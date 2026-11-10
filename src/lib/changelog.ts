// What changed in each version, newest first. The first entry is the current version (shown in the header chip);
// keep "version" in package.json in step with it.

export interface Release {
  version: string
  /** ISO date. */
  date: string
  changes: string[]
}

export const CHANGELOG: [Release, ...Release[]] = [
  {
    version: "0.2",
    date: "2026-11-10",
    changes: [
      "A new Translate page: write or say something in English and see it in the language you're learning.",
      "Hover over or tap any word in a translation to see what it means.",
      "Listen to the translation read aloud.",
      "A new menu: pages sit down the side on bigger screens, and behind the ☰ button on phones.",
    ],
  },
  {
    version: "0.1",
    date: "2026-11-02",
    changes: [
      "Now in Russian, Italian and French too.",
      "Dark mode, with a light / dark switch at the top of the page.",
      "Wordly remembers the language you used last, so you can pick up where you left off.",
      "Quizzes earn XP, give you a second try at questions you miss, and end with a match round where you pair words with their meanings.",
      "Sound effects for right and wrong answers (you can turn them off).",
      "See how well you know each word as it gets stronger with practice.",
      "A Basics page for every language: the alphabet, its sounds, and the rules English doesn't have.",
    ],
  },
  {
    version: "0.0",
    date: "2026-10-31",
    changes: [
      "Learn Spanish or German, starting with the words people actually say most.",
      "5,000 words per language, in five levels.",
      "Short lessons of new words, each followed by a quiz.",
      "Every word comes with everyday example sentences, and every other word in them shows its meaning too.",
      "Hear native speakers say words and sentences wherever there's a recording.",
      "Browse and search the full word list, and come back to words that need practice.",
      "Your progress stays on your device, and you can back it up from the Progress page.",
    ],
  },
]

export const CURRENT_VERSION = CHANGELOG[0].version
