import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { articlePrefix, getLanguage, LANGUAGE_LIST, withPronoun } from "./languages"

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
    const fr = getLanguage("fr")
    assert.equal(articlePrefix(fr, "livre", "m"), "le ")
    assert.equal(articlePrefix(fr, "maison", "f"), "la ")
    assert.equal(articlePrefix(fr, "homme", "m"), "l'")
    assert.equal(articlePrefix(fr, "école", "f"), "l'")
  })

  it("French elides je before a vowel", () => {
    const fr = getLanguage("fr")
    assert.equal(withPronoun(fr, "je", "fais"), "je fais")
    assert.equal(withPronoun(fr, "je", "aime"), "j'aime")
    assert.equal(withPronoun(fr, "je", "ai fait"), "j'ai fait")
    assert.equal(withPronoun(fr, "tu", "aimes"), "tu aimes")
    assert.equal(withPronoun(getLanguage("es"), "yo", "amo"), "yo amo")
  })
})
