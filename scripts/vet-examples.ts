// Has Claude pick each word's example sentences from the pipeline's candidates (data-raw/<lang>/candidates.json),
// clean up its meanings and fix wrong word glosses. Results go to scripts/build-data/vetted/<lang>.json, which the
// pipeline applies on its next run. Uses the Message Batches API (half price, results within ~1 hour).
//
// Usage: pnpm vet --lang es [--limit 50] [--dry]
//   --limit  vet only the first N unvetted words in course order (try a few before paying for all 5,000)
//   --dry    print the first request and its token count, send nothing
// Rerunning resumes: words already vetted are skipped, and a batch still in flight is picked up again.

import Anthropic from "@anthropic-ai/sdk"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { parseArgs } from "node:util"
import { getLanguage } from "../src/lib/languages"
import type { Example, Pos } from "../src/lib/types"
import { UNITS } from "../src/lib/units"
import { tokenize } from "../src/lib/words"
import { loadVetted, vettedPath, type Vetted, type VettedWord } from "./build-data/vetted"

const ROOT = join(import.meta.dirname, "..")
const MODEL = "claude-opus-5-5"
const WORDS_PER_REQUEST = 10

interface Candidate {
  lemma: string
  pos: Pos
  glosses: string[]
  order: number
  unit?: number
  examples: Example[]
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["words"],
  properties: {
    words: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["lemma", "meanings", "examples"],
        properties: {
          lemma: { type: "string" },
          meanings: { type: "array", items: { type: "string" } },
          examples: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["text", "en", "fixes", "dropPhrases"],
              properties: {
                text: { type: "string" },
                en: { type: "string" },
                fixes: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["token", "g", "l"],
                    properties: { token: { type: "string" }, g: { type: "string" }, l: { type: "string" } },
                  },
                },
                dropPhrases: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
    },
  },
}

function systemPrompt(language: string, course: Candidate[]): string {
  const units = UNITS.map((title, i) => {
    const words = course.filter((w) => w.unit === i + 1).map((w) => w.lemma)
    return words.length ? `${i + 1}. ${title}: ${words.join(", ")}` : ""
  }).filter(Boolean)
  return readFileSync(join(import.meta.dirname, "vet-prompt.md"), "utf8")
    .replaceAll("{{language}}", language)
    .replace("{{units}}", units.join("\n"))
}

function describe(w: Candidate): string {
  const where = w.unit
    ? `course unit ${w.unit} (${UNITS[w.unit - 1]}), word #${w.order}`
    : `word #${w.order}, after the course`
  const candidates = w.examples.map((e, i) => {
    const tokens = tokenize(e.text)
    const inPhrase = (k: number) => e.phrases?.some(([a, b]) => k >= a && k < b)
    const glosses = [
      ...(e.phrases ?? []).map(([a, b, g]) => `[${tokens.slice(a, b).join(" ")}]=${g}`),
      ...tokens.flatMap((t, k) => {
        if (inPhrase(k)) return []
        const g = e.words?.[k]
        return g === null ? [] : [`${t}=${g ? g.g + (g.l ? ` (${g.l})` : "") : "?"}`]
      }),
    ]
    return `${i + 1}. ${e.text} — ${e.en}${e.audio ? " [audio]" : ""}\n   ${glosses.join(" · ")}`
  })
  return `## ${w.lemma} (${w.pos}) — ${where}
Dictionary meanings: ${w.glosses.slice(0, 4).join("; ")}
${candidates.length ? `Candidates:\n${candidates.join("\n")}` : "No candidates: write all 3 sentences."}`
}

function toVetted(raw: {
  meanings: string[]
  examples: { text: string; en: string; fixes: { token: string; g: string; l: string }[]; dropPhrases: string[] }[]
}): VettedWord | undefined {
  const meanings = raw.meanings.map((m) => m.trim()).filter(Boolean)
  const examples = raw.examples
    .filter((e) => e.text.trim() && e.en.trim())
    .map((e) => {
      const fixes = e.fixes
        .filter((f) => f.token && f.g)
        .map((f) => ({ token: f.token, g: f.g, ...(f.l && { l: f.l }) }))
      return {
        text: e.text.trim(),
        en: e.en.trim(),
        ...(fixes.length && { fixes }),
        ...(e.dropPhrases.length && { dropPhrases: e.dropPhrases }),
      }
    })
  return meanings.length && examples.length ? { meanings, examples } : undefined
}

async function main() {
  const { values } = parseArgs({
    options: { lang: { type: "string", default: "es" }, limit: { type: "string" }, dry: { type: "boolean" } },
  })
  const lang = values.lang!
  const language = getLanguage(lang).name
  const candidatesPath = join(ROOT, "data-raw", lang, "candidates.json")
  if (!existsSync(candidatesPath)) throw new Error(`Run "pnpm data --lang ${lang}" first: ${candidatesPath} is missing`)
  const all = (JSON.parse(readFileSync(candidatesPath, "utf8")) as Candidate[]).sort((a, b) => a.order - b.order)
  const vetted: Vetted = loadVetted(ROOT, lang)
  const statePath = join(ROOT, "data-raw", lang, "vet-batch.json")
  const client = new Anthropic()
  const system = systemPrompt(
    language,
    all.filter((w) => w.unit)
  )

  let state: { id: string; chunks: Record<string, string[]> }
  if (existsSync(statePath)) {
    state = JSON.parse(readFileSync(statePath, "utf8"))
    console.log(`Resuming batch ${state.id}`)
  } else {
    const todo = all
      .filter((w) => !Object.hasOwn(vetted, w.lemma))
      .slice(0, values.limit ? Number(values.limit) : undefined)
    if (!todo.length) return console.log("Every word is vetted.")
    const chunks: Candidate[][] = []
    for (let i = 0; i < todo.length; i += WORDS_PER_REQUEST) chunks.push(todo.slice(i, i + WORDS_PER_REQUEST))
    const params = (chunk: Candidate[]) => ({
      model: MODEL,
      max_tokens: 16000,
      // Same prefix for every request: cached after the first.
      system: [{ type: "text" as const, text: system, cache_control: { type: "ephemeral" as const } }],
      output_config: { effort: "medium" as const, format: { type: "json_schema" as const, schema: SCHEMA } },
      messages: [{ role: "user" as const, content: chunk.map(describe).join("\n\n") }],
    })
    if (values.dry) {
      const first = params(chunks[0]!)
      console.log(first.system[0]!.text, "\n\n---\n\n", first.messages[0]!.content)
      console.log(`\n${todo.length} words in ${chunks.length} requests`)
      const count = client.messages.countTokens({ model: MODEL, system: first.system, messages: first.messages })
      await count.then(
        (c) => console.log(`First request: ${c.input_tokens} input tokens`),
        (e: Error) => console.log(`(No token count: ${e.message})`)
      )
      return
    }
    const batch = await client.messages.batches.create({
      requests: chunks.map((chunk, i) => ({ custom_id: `${lang}-${i}`, params: params(chunk) })),
    })
    state = { id: batch.id, chunks: Object.fromEntries(chunks.map((c, i) => [`${lang}-${i}`, c.map((w) => w.lemma)])) }
    writeFileSync(statePath, JSON.stringify(state))
    console.log(`Created batch ${batch.id}: ${todo.length} words in ${chunks.length} requests`)
  }

  for (;;) {
    const batch = await client.messages.batches.retrieve(state.id)
    if (batch.processing_status === "ended") break
    const c = batch.request_counts
    console.log(`${new Date().toLocaleTimeString()} processing ${c.processing}, done ${c.succeeded + c.errored}`)
    await new Promise((r) => setTimeout(r, 60_000))
  }

  let added = 0
  const usage = { input: 0, cached: 0, output: 0 }
  for await (const result of await client.messages.batches.results(state.id)) {
    const lemmas = state.chunks[result.custom_id] ?? []
    if (result.result.type !== "succeeded") {
      console.warn(`${result.custom_id} ${result.result.type}: ${lemmas.join(", ")} left unvetted`)
      continue
    }
    const message = result.result.message
    usage.input += message.usage.input_tokens
    usage.cached += message.usage.cache_read_input_tokens ?? 0
    usage.output += message.usage.output_tokens
    if (message.stop_reason !== "end_turn") {
      console.warn(`${result.custom_id} stopped (${message.stop_reason}): ${lemmas.join(", ")} left unvetted`)
      continue
    }
    const text = message.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("")
    let words: (Parameters<typeof toVetted>[0] & { lemma: string })[]
    try {
      words = JSON.parse(text).words
    } catch {
      console.warn(`${result.custom_id}: unreadable answer, ${lemmas.join(", ")} left unvetted`)
      continue
    }
    for (const lemma of lemmas) {
      const raw = words.find((w) => w.lemma === lemma)
      const v = raw && toVetted(raw)
      if (v) {
        vetted[lemma] = v
        added++
      } else console.warn(`${lemma}: no usable answer, left unvetted`)
    }
  }
  const out = vettedPath(ROOT, lang)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, JSON.stringify(vetted, null, 2) + "\n")
  rmSync(statePath)
  console.log(`Vetted ${added} words → ${out} (${Object.keys(vetted).length} in all)`)
  console.log(`Tokens: ${usage.input} input + ${usage.cached} cached, ${usage.output} output`)
  console.log(`Now run: pnpm data --lang ${lang}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
