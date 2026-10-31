// Human pronunciation recordings: Lingua Libre (words, via Wikimedia Commons) and Tatoeba (sentences).
import { execFileSync } from "node:child_process"
import { existsSync, readFileSync, writeFileSync } from "node:fs"

const UA = "Wordly/0.1 (vocabulary trainer data build; https://github.com/)"

interface CommonsFile {
  name: string
  url: string
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Wikimedia rate-limits bulk API use: pause between pages and back off on 429 (honouring Retry-After). */
async function politeFetch(url: string): Promise<Response> {
  for (let attempt = 0; attempt < 8; attempt++) {
    await sleep(attempt ? 0 : 250)
    const res = await fetch(url, { headers: { "User-Agent": UA } })
    if (res.ok) return res
    if (res.status !== 429 && res.status < 500) throw new Error(`Commons API: HTTP ${res.status}`)
    const wait = Number(res.headers.get("retry-after")) * 1000 || 2000 * 2 ** attempt
    process.stdout.write(` (rate limited, waiting ${Math.round(wait / 1000)}s)`)
    await sleep(wait)
  }
  throw new Error("Commons API: still rate limited after retries")
}

/** Every Commons file starting with `prefix` (e.g. "LL-Q1321_(spa)-"), cached because it takes ~100+ API pages. */
async function listCommonsFiles(prefix: string, cachePath: string): Promise<CommonsFile[]> {
  if (existsSync(cachePath)) return JSON.parse(readFileSync(cachePath, "utf8"))
  const files: CommonsFile[] = []
  let cont: Record<string, string> = {}
  for (;;) {
    const params = new URLSearchParams({
      action: "query",
      list: "allimages",
      aiprefix: prefix,
      ailimit: "500",
      aiprop: "url",
      format: "json",
      ...cont,
    })
    const res = await politeFetch(`https://commons.wikimedia.org/w/api.php?${params}`)
    const data = (await res.json()) as { query: { allimages: CommonsFile[] }; continue?: Record<string, string> }
    files.push(...data.query.allimages.map((f) => ({ name: f.name, url: f.url.replace(/\?.*/, "") })))
    process.stdout.write(`\r  Lingua Libre: ${files.length} recordings`)
    if (!data.continue) break
    cont = data.continue
  }
  process.stdout.write("\n")
  writeFileSync(cachePath, JSON.stringify(files))
  return files
}

/**
 * word → recording URL. File names look like "LL-Q1321_(spa)-<speaker>-<word>.wav".
 * When several speakers recorded a word, the most prolific speaker wins (usually native speakers recording lists).
 */
export async function loadWordRecordings(prefix: string, cachePath: string): Promise<Map<string, string>> {
  const files = await listCommonsFiles(prefix, cachePath)
  const parsed = files.flatMap((f) => {
    const rest = f.name.slice(prefix.length).replace(/\.\w+$/, "")
    const cut = rest.lastIndexOf("-")
    if (cut <= 0) return []
    return [
      {
        speaker: rest.slice(0, cut),
        word: rest
          .slice(cut + 1)
          .replace(/_/g, " ")
          .toLowerCase(),
        url: f.url,
      },
    ]
  })
  const perSpeaker = new Map<string, number>()
  for (const p of parsed) perSpeaker.set(p.speaker, (perSpeaker.get(p.speaker) ?? 0) + 1)
  const best = new Map<string, { url: string; n: number }>()
  for (const p of parsed) {
    const n = perSpeaker.get(p.speaker)!
    if ((best.get(p.word)?.n ?? -1) < n) best.set(p.word, { url: p.url, n })
  }
  return new Map([...best].map(([w, b]) => [w, b.url]))
}

/** Tatoeba sentence id → audio URL, from sentences_with_audio.csv (sentence_id, audio_id, username, …). */
export function loadSentenceRecordings(tarPath: string): Map<string, string> {
  const csv = execFileSync("tar", ["-xOjf", tarPath], { maxBuffer: 1 << 30 }).toString("utf8")
  const out = new Map<string, string>()
  for (const line of csv.split("\n")) {
    const [sentenceId, audioId] = line.split("\t")
    if (sentenceId && audioId && !out.has(sentenceId))
      out.set(sentenceId, `https://tatoeba.org/en/audio/download/${audioId}`)
  }
  return out
}
