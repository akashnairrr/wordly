"use server"

import { LANGUAGE_LIST } from "@/lib/languages"
import { tokenize } from "@/lib/words"

// Same cap as the text field in translate-view.tsx.
const MAX_CHARS = 1000
// DeepL takes at most 50 texts per request.
const BATCH = 50

export type TranslateResult = { text: string; words: Record<string, string> } | { error: string }

class DeepLError extends Error {
  constructor(readonly status: number) {
    super(`DeepL ${status}`)
  }
}

async function deepl(key: string, body: Record<string, unknown>): Promise<string[]> {
  const host = key.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com"
  const res = await fetch(`https://${host}/v2/translate`, {
    method: "POST",
    headers: { Authorization: `DeepL-Auth-Key ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new DeepLError(res.status)
  const data = (await res.json()) as { translations: { text: string }[] }
  return data.translations.map((t) => t.text)
}

/**
 * English → `lang`, plus an English meaning for every word of the translation. The whole translation goes along as
 * `context` (not billed), so each word's meaning fits this sentence ("la" → "the" vs "there").
 */
// ponytail: no rate limit, the length cap only; add a per-IP limit (Vercel KV / Upstash) if quota abuse shows up.
// ponytail: per-word DeepL meanings, no dictionary form (suis, not être); a build-time form → gloss map from the data
// pipeline would match the Words page exactly.
export async function translate(text: string, lang: string): Promise<TranslateResult> {
  const key = process.env.DEEPL_AUTH_KEY
  if (!key) return { error: "The translator isn't set up yet." }
  text = text.trim()
  if (!text) return { error: "Type something to translate." }
  if (text.length > MAX_CHARS) return { error: `Keep it under ${MAX_CHARS} characters.` }
  if (!LANGUAGE_LIST.some((l) => l.code === lang)) return { error: "That language isn't available." }

  let translation: string
  try {
    ;[translation = ""] = await deepl(key, {
      text: [text],
      source_lang: "EN",
      target_lang: lang === "pt" ? "PT-PT" : lang.toUpperCase(),
    })
  } catch (e) {
    if (e instanceof DeepLError && e.status === 456) return { error: "The monthly translation limit is used up." }
    return { error: "Couldn't translate right now. Try again in a moment." }
  }

  const tokens = [...new Set(tokenize(translation))]
  const words: Record<string, string> = {}
  try {
    const batches = []
    for (let i = 0; i < tokens.length; i += BATCH) batches.push(tokens.slice(i, i + BATCH))
    const meanings = await Promise.all(
      batches.map((batch) =>
        deepl(key, { text: batch, source_lang: lang.toUpperCase(), target_lang: "EN-US", context: translation })
      )
    )
    meanings.flat().forEach((m, i) => {
      const token = tokens[i]!
      // A meaning that only repeats the word (French s' → "s") says nothing.
      if (m.toLowerCase() !== token) words[token] = m
    })
  } catch {
    // The translation is still useful without word meanings.
  }
  return { text: translation, words }
}
