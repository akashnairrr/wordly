import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { articlePrefix, getLanguage, LANGUAGE_LIST } from "./languages"

describe("languages", () => {
  it("picker lists languages by English name", () => {
    const names = LANGUAGE_LIST.map((l) => l.name)
    assert.deepEqual(names, [...names].sort())
  })

  it("articles as written before the noun: Italian elides and switches to lo; others add a space", () => {
    const it = getLanguage("it")
    assert.equal(articlePrefix(it, "libro", "m"), "il ")
    assert.equal(articlePrefix(it, "albero", "m"), "l'")
    assert.equal(articlePrefix(it, "zio", "m"), "lo ")
    assert.equal(articlePrefix(it, "studente", "m"), "lo ")
    assert.equal(articlePrefix(it, "casa", "f"), "la ")
    assert.equal(articlePrefix(it, "amica", "f"), "l'")
    assert.equal(articlePrefix(getLanguage("pt"), "casa", "f"), "a ")
    assert.equal(articlePrefix(getLanguage("de"), "Haus", "n"), "das ")
    assert.equal(articlePrefix(getLanguage("ru"), "дом", "m"), "")
  })
})
