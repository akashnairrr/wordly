import assert from "node:assert/strict";
import { test } from "node:test";
import { allForms } from "../../src/lib/words";
import { bestEntry, toWord, wordId } from "./normalize";
import { findExamples, indexSentences, literalness } from "./sentences";
import { formOfTargets, isLemmaEntry, type RawEntry } from "./wiktionary";

// Trimmed from real kaikki.org entries.
const conj = (form: string, ...tags: string[]) => ({ form, tags, source: "conjugation" });
const tener: RawEntry = {
  word: "tener",
  pos: "verb",
  sounds: [{ ipa: "/teˈneɾ/" }, { ipa: "[t̪eˈneɾ]" }],
  senses: [{ glosses: ["to have; to possess"] }, { glosses: ["to hold; to grasp"] }],
  forms: [
    { form: "tengo", tags: ["first-person", "present", "singular"] },
    conj("irregular", "table-tags"),
    conj("teniendo", "gerund"),
    conj("tenido", "masculine", "participle", "past", "singular"),
    conj("tengo", "first-person", "indicative", "present", "singular"),
    conj("tienes", "indicative", "informal", "present", "second-person", "singular"),
    conj("tenés", "indicative", "informal", "present", "second-person", "singular", "vos-form"),
    conj("tenéis", "indicative", "plural", "present", "second-person"),
    conj("tuvo", "indicative", "preterite", "singular", "third-person"),
    conj("tuviera", "first-person", "imperfect", "singular", "subjunctive"),
    conj("tuviese", "first-person", "imperfect", "imperfect-se", "singular", "subjunctive"),
    conj("tuviere", "first-person", "future", "singular", "subjunctive"),
    conj("ten", "imperative", "informal", "second-person", "singular"),
    conj("tenga", "formal", "imperative", "second-person-semantically", "singular", "third-person"),
    conj("tenga", "imperative", "singular", "third-person"),
    conj("tengas", "imperative", "negative", "second-person", "singular"),
    conj("tenerlo", "accusative", "combined-form", "infinitive", "object-singular", "object-third-person"),
  ],
};
const casa: RawEntry = {
  word: "casa",
  pos: "noun",
  head_templates: [{ expansion: "casa f (plural casas)" }],
  sounds: [{ ipa: "/ˈkasa/" }],
  senses: [{ glosses: ["house"], tags: ["feminine"] }],
  forms: [{ form: "casas", tags: ["plural"] }],
};
const bueno: RawEntry = {
  word: "bueno",
  pos: "adj",
  senses: [{ glosses: ["good (of good quality)"] }, { glosses: ["good (morally)"] }, { glosses: ["obsolete sense"], tags: ["obsolete"] }],
  forms: [
    { form: "before a noun buen", tags: ["masculine", "singular"] },
    { form: "buena", tags: ["feminine"] },
    { form: "buenos", tags: ["masculine", "plural"] },
    { form: "buenas", tags: ["feminine", "plural"] },
    { form: "güeno", tags: ["alternative", "pronunciation-spelling"] },
  ],
};
const casaVerbForm: RawEntry = {
  word: "casa",
  pos: "verb",
  senses: [{ glosses: ["inflection of casar:"], tags: ["form-of"], form_of: [{ word: "casar" }] }],
};

test("verb: conjugation grid keeps standard forms and drops vos/-se/clitic/formal variants", () => {
  const w = toWord(tener, 1)!;
  assert.equal(w.pos, "verb");
  assert.equal(w.ipa, "/teˈneɾ/");
  assert.deepEqual(w.glosses, ["to have; to possess", "to hold; to grasp"]);
  assert.deepEqual(w.conjugation?.indicative?.present, { "1s": "tengo", "2s": "tienes", "2p": "tenéis" });
  assert.equal(w.conjugation?.indicative?.preterite?.["3s"], "tuvo");
  assert.deepEqual(w.conjugation?.subjunctive?.imperfect, { "1s": "tuviera" });
  assert.equal(w.conjugation?.subjunctive?.future, undefined);
  assert.deepEqual(w.conjugation?.imperative?.affirmative, { "2s": "ten", "3s": "tenga" });
  assert.deepEqual(w.conjugation?.imperative?.negative, { "2s": "tengas" });
  assert.deepEqual(w.nonFinite, { gerund: "teniendo", participle: "tenido" });
  assert.ok(!allForms(w).includes("tenés"));
  assert.ok(!allForms(w).includes("irregular"));
});

test("noun: gender from headword, plural from forms", () => {
  const w = toWord(casa, 2)!;
  assert.equal(w.gender, "f");
  assert.deepEqual(w.forms, { plural: "casas" });
});

test("adjective: gendered forms, skips phrases and alternative spellings", () => {
  const w = toWord(bueno, 3)!;
  assert.deepEqual(w.forms, { feminine: "buena", masculinePlural: "buenos", femininePlural: "buenas" });
  assert.equal(w.glosses.length, 2);
});

test("form-of entries are not lemmas and point at their lemma", () => {
  assert.equal(isLemmaEntry(casaVerbForm), false);
  assert.deepEqual(formOfTargets(casaVerbForm), ["casar"]);
});

test("wordId is ASCII and keeps accented words distinct", () => {
  assert.equal(wordId("está"), "esta_");
  assert.equal(wordId("esta"), "esta");
  assert.equal(wordId("año"), "an_o");
});

test("examples: whole-word match, spread across forms", () => {
  const index = indexSentences([
    { text: "Tengo un perro pequeño en casa.", en: "I have a small dog at home." },
    { text: "Tengo hambre ahora mismo, de verdad.", en: "I'm really hungry right now." },
    { text: "¿Tienes tiempo para hablar hoy?", en: "Do you have time to talk today?" },
    { text: "Contengo la respiración bajo el agua.", en: "I hold my breath underwater." },
  ]);
  const got = findExamples(index, ["tengo", "tienes"], 2).map((e) => e.text);
  assert.equal(got.length, 2);
  assert.ok(
    got.some((t) => t.startsWith("¿Tienes")),
    "second form gets a sentence before the first form's second one",
  );
  assert.ok(!got.some((t) => t.startsWith("Contengo")));
});

test("examples: everyday sentences beat rare words, names, numbers and borrowed spellings", () => {
  const common = ["yo", "tengo", "hambre", "tú", "quieres", "comer", "algo", "como", "una", "es", "el", "de", "tom", "años", "están", "cabra"];
  const everyday = {
    rank: new Map(common.map((w, i) => [w, i] as [string, number])),
    commonCutoff: common.length,
    basicCutoff: common.length,
    droppedPronouns: new Set(["yo", "tú"]),
  };
  const index = indexSentences(
    [
      { text: "El ornitorrinco come insectos acuáticos.", en: "The platypus eats aquatic insects." },
      { text: "Tom quiere comer algo.", en: "Tom wants to eat something." },
      { text: "Tengo 17 años y quiero comer.", en: "I'm 17 and want to eat." },
      { text: "Están como una cabra.", en: "They're crazy." },
      { text: "¿Quieres comer algo?", en: "Do you want to eat something?", audio: "x.mp3" },
    ],
    everyday,
  );
  const [first, second] = findExamples(index, ["comer", "como", "come"], 5, new Set(["como"])).map((e) => e.text);
  assert.equal(first, "¿Quieres comer algo?");
  assert.notEqual(second, "Están como una cabra.");
  assert.equal(findExamples(index, ["comer", "como", "come"], 5, new Set(["como"])).at(-1)?.text, "Están como una cabra.");
});

test("examples: dropped pronouns, drama and loose translations lose to plain literal speech", () => {
  const dict: Record<string, string> = {
    tengo: "I have",
    hambre: "hunger",
    yo: "I",
    me: "me",
    puedes: "can",
    decir: "to say",
    la: "the",
    hora: "hour",
    qué: "what",
  };
  const everyday = {
    rank: new Map(),
    commonCutoff: Infinity,
    basicCutoff: Infinity,
    droppedPronouns: new Set(["yo"]),
    gloss: (t: string) => dict[t],
  };
  const index = indexSentences(
    [
      { text: "¡Yo tengo hambre!", en: "I'm hungry!" },
      { text: "Tengo hambre.", en: "I'm hungry." },
    ],
    everyday,
  );
  assert.equal(findExamples(index, ["tengo"], 1)[0].text, "Tengo hambre.");
  assert.equal(
    literalness(["me", "puedes", "decir", "la", "hora"], "What time is it?", (t) => dict[t]),
    0,
  );
  assert.equal(
    literalness(["qué", "hora"], "What hour?", (t) => dict[t]),
    1,
  );
});

test("bestEntry: most real meanings wins; letter names don't count; verbs win ties", () => {
  const e = (pos: string, ...glosses: string[]): RawEntry => ({ word: "x", pos, senses: glosses.map((g) => ({ glosses: [g] })) });
  const letter = e("noun", "The name of the Latin-script letter D/d.");
  const prep = e("prep", "of", "from");
  assert.equal(bestEntry([letter, prep]), prep);
  const verb = e("verb", "to be", "to exist");
  const noun = e("noun", "a being", "essence");
  assert.equal(bestEntry([noun, verb]), verb);
  assert.equal(bestEntry([letter]), undefined);
});
