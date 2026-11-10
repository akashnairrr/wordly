import assert from "node:assert/strict"
import { afterEach, describe, it } from "node:test"
import { translate } from "./actions"

const realFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = realFetch
  delete process.env.DEEPL_AUTH_KEY
})

/** Fakes DeepL: records each request and answers with `reply(body)`. */
function fakeDeepL(reply: (body: { text: string[] }) => string[], status = 200) {
  const calls: { url: string; body: Record<string, unknown> & { text: string[] } }[] = []
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    const body = JSON.parse(init.body as string)
    calls.push({ url, body })
    return new Response(JSON.stringify({ translations: reply(body).map((text) => ({ text })) }), { status })
  }) as typeof fetch
  return calls
}

describe("translate", () => {
  it("rejects bad input without calling DeepL", async () => {
    const calls = fakeDeepL(() => [])
    assert.ok("error" in (await translate("Hello", "fr")), "no key")
    process.env.DEEPL_AUTH_KEY = "k:fx"
    assert.ok("error" in (await translate("   ", "fr")), "empty")
    assert.ok("error" in (await translate("a".repeat(1001), "fr")), "too long")
    assert.ok("error" in (await translate("Hello", "xx")), "unknown language")
    assert.equal(calls.length, 0)
  })

  it("translates, then glosses each distinct word in context", async () => {
    process.env.DEEPL_AUTH_KEY = "k:fx"
    const calls = fakeDeepL(({ text }) =>
      text[0] === "Hello, the world, the end" ? ["Bonjour, le monde, le fin"] : text.map((t) => `en:${t}`)
    )
    const result = await translate(" Hello, the world, the end ", "fr")
    assert.deepEqual(result, {
      text: "Bonjour, le monde, le fin",
      words: { bonjour: "en:bonjour", le: "en:le", monde: "en:monde", fin: "en:fin" },
    })
    assert.equal(calls[0]?.url, "https://api-free.deepl.com/v2/translate")
    assert.equal(calls[0]?.body.target_lang, "FR")
    assert.deepEqual(calls[1]?.body, {
      text: ["bonjour", "le", "monde", "fin"],
      source_lang: "FR",
      target_lang: "EN-US",
      context: "Bonjour, le monde, le fin",
    })
  })

  it("reports a used-up quota", async () => {
    process.env.DEEPL_AUTH_KEY = "k"
    fakeDeepL(() => [], 456)
    assert.deepEqual(await translate("Hello", "de"), { error: "The monthly translation limit is used up." })
  })
})
