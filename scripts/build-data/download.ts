import { createWriteStream, existsSync, mkdirSync, renameSync } from "node:fs"
import { join } from "node:path"
import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"
import type { ReadableStream } from "node:stream/web"
import { SENTENCE_AUDIO, type Sources } from "./sources"

export interface RawFiles {
  frequency: string
  wiktionary: string
  sentences: string
  sentenceAudio: string
  /** Cache of the Lingua Libre file listing (built by recordings.ts, not downloaded here). */
  wordAudioIndex: string
}

async function fetchTo(url: string, dest: string) {
  if (existsSync(dest)) return
  console.log(`Downloading ${url}`)
  const res = await fetch(url)
  if (!res.ok || !res.body) throw new Error(`${url}: HTTP ${res.status}`)
  // Write to a temp name so an interrupted download is never mistaken for a complete one.
  await pipeline(Readable.fromWeb(res.body as ReadableStream), createWriteStream(dest + ".part"))
  renameSync(dest + ".part", dest)
}

export async function download(lang: string, sources: Sources, rawDir: string): Promise<RawFiles> {
  const dir = join(rawDir, lang)
  mkdirSync(dir, { recursive: true })
  const files = {
    frequency: join(dir, "frequency.txt"),
    wiktionary: join(dir, "wiktionary.jsonl.gz"),
    sentences: join(dir, "sentences.zip"),
    sentenceAudio: join(rawDir, "sentences_audio.tar.bz2"),
    wordAudioIndex: join(dir, "lingualibre.json"),
  }
  await fetchTo(sources.frequency, files.frequency)
  await fetchTo(sources.sentences.url, files.sentences)
  await fetchTo(SENTENCE_AUDIO, files.sentenceAudio)
  await fetchTo(sources.wiktionary, files.wiktionary)
  return files
}
