// The Basics page: what an English speaker wouldn't guess about each language, grouped, with examples to hear.

export interface BasicsExample {
  text: string
  en: string
}

export interface BasicsEntry {
  title: string
  body: string
  examples?: BasicsExample[]
}

export interface BasicsGroup {
  title: string
  entries: BasicsEntry[]
}

export interface Letter {
  letter: string
  /** What text-to-speech reads to say the letter's name, when the bare letter would be read as a word or skipped. */
  say?: string
  /** The sound, described for an English speaker. */
  sound: string
  example: string
  en: string
}

/** Every letter and the sound it makes in that language, with a word to hear it in. Shown before the rest of the basics. */
export const ALPHABETS: Record<string, Letter[]> = {
  ru: [
    { letter: "А а", say: "а", sound: "a in 'father'", example: "мама", en: "mum" },
    { letter: "Б б", say: "бэ", sound: "b in 'bed'", example: "брат", en: "brother" },
    { letter: "В в", say: "вэ", sound: "v in 'van'", example: "вода", en: "water" },
    { letter: "Г г", say: "гэ", sound: "g in 'go'", example: "год", en: "year" },
    { letter: "Д д", say: "дэ", sound: "d in 'dog'", example: "дом", en: "house" },
    { letter: "Е е", say: "е", sound: "ye in 'yes'", example: "еда", en: "food" },
    { letter: "Ё ё", say: "ё", sound: "yo in 'yoghurt', always stressed", example: "ёж", en: "hedgehog" },
    { letter: "Ж ж", say: "жэ", sound: "s in 'pleasure'", example: "жена", en: "wife" },
    { letter: "З з", say: "зэ", sound: "z in 'zoo'", example: "зима", en: "winter" },
    { letter: "И и", say: "и", sound: "ee in 'see'", example: "игра", en: "game" },
    { letter: "Й й", say: "и краткое", sound: "y in 'boy'", example: "мой", en: "my" },
    { letter: "К к", say: "ка", sound: "k in 'kite'", example: "кот", en: "cat" },
    { letter: "Л л", say: "эль", sound: "l in 'milk'", example: "луна", en: "moon" },
    { letter: "М м", say: "эм", sound: "m in 'man'", example: "мир", en: "world, peace" },
    { letter: "Н н", say: "эн", sound: "n in 'no'", example: "нос", en: "nose" },
    { letter: "О о", say: "о", sound: "o in 'more' when stressed, else like а", example: "окно", en: "window" },
    { letter: "П п", say: "пэ", sound: "p in 'pen'", example: "папа", en: "dad" },
    { letter: "Р р", say: "эр", sound: "rolled r", example: "рыба", en: "fish" },
    { letter: "С с", say: "эс", sound: "s in 'sun'", example: "сок", en: "juice" },
    { letter: "Т т", say: "тэ", sound: "t in 'top'", example: "там", en: "there" },
    { letter: "У у", say: "у", sound: "oo in 'food'", example: "утро", en: "morning" },
    { letter: "Ф ф", say: "эф", sound: "f in 'fun'", example: "фото", en: "photo" },
    { letter: "Х х", say: "ха", sound: "ch in Scottish 'loch'", example: "хлеб", en: "bread" },
    { letter: "Ц ц", say: "цэ", sound: "ts in 'cats'", example: "цвет", en: "colour" },
    { letter: "Ч ч", say: "че", sound: "ch in 'chair'", example: "чай", en: "tea" },
    { letter: "Ш ш", say: "ша", sound: "sh in 'shop', but harder", example: "шапка", en: "hat" },
    { letter: "Щ щ", say: "ща", sound: "long, soft shsh, as in 'fresh sheets'", example: "ещё", en: "more, still" },
    {
      letter: "Ъ ъ",
      say: "твёрдый знак",
      sound: "hard sign: no sound, a short break",
      example: "подъезд",
      en: "entrance",
    },
    { letter: "Ы ы", say: "ы", sound: "i in 'bit' with the tongue pulled back", example: "сыр", en: "cheese" },
    {
      letter: "Ь ь",
      say: "мягкий знак",
      sound: "soft sign: no sound, softens the letter before",
      example: "соль",
      en: "salt",
    },
    { letter: "Э э", say: "э", sound: "e in 'bet'", example: "это", en: "this" },
    { letter: "Ю ю", say: "ю", sound: "yu in 'you'", example: "юг", en: "south" },
    { letter: "Я я", say: "я", sound: "ya in 'yard'", example: "яблоко", en: "apple" },
  ],
  de: [
    { letter: "A a", sound: "a in 'father'", example: "Apfel", en: "apple" },
    { letter: "B b", sound: "b in 'bed'; p at the end of a word", example: "Brot", en: "bread" },
    {
      letter: "C c",
      sound: "rare alone (k, or ts before e and i); mostly in ch, ck, sch",
      example: "Café",
      en: "café",
    },
    { letter: "D d", sound: "d in 'dog'; t at the end of a word", example: "Dorf", en: "village" },
    {
      letter: "E e",
      sound: "long: 'ay' without the glide; short: e in 'bed'; at the end, 'uh'",
      example: "essen",
      en: "to eat",
    },
    { letter: "F f", sound: "f in 'fun'", example: "Fisch", en: "fish" },
    { letter: "G g", sound: "always hard, g in 'go'; k at the end of a word", example: "gut", en: "good" },
    { letter: "H h", sound: "h in 'hat'; silent after a vowel, which it makes long", example: "Haus", en: "house" },
    { letter: "I i", sound: "long: ee in 'see'; short: i in 'bit'", example: "Insel", en: "island" },
    { letter: "J j", sound: "y in 'yes'", example: "Jahr", en: "year" },
    { letter: "K k", sound: "k in 'kite', also before n", example: "Knie", en: "knee" },
    { letter: "L l", sound: "l in 'leaf'", example: "Licht", en: "light" },
    { letter: "M m", sound: "m in 'man'", example: "Milch", en: "milk" },
    { letter: "N n", sound: "n in 'no'", example: "Nacht", en: "night" },
    { letter: "O o", sound: "long: 'oh' without the glide; short: o in 'lot'", example: "Ofen", en: "oven" },
    { letter: "P p", sound: "p in 'pen'; pf is p and f together", example: "Pferd", en: "horse" },
    { letter: "Q q", sound: "always qu, said 'kv'", example: "Quelle", en: "spring, source" },
    {
      letter: "R r",
      sound: "throaty, at the back of the mouth; after a vowel, almost 'uh'",
      example: "rot",
      en: "red",
    },
    {
      letter: "S s",
      sound: "z before a vowel; s at the end; sh before p, t at the start",
      example: "Sonne",
      en: "sun",
    },
    { letter: "T t", sound: "t in 'top'", example: "Tisch", en: "table" },
    { letter: "U u", sound: "long: oo in 'food'; short: u in 'put'", example: "Uhr", en: "clock" },
    { letter: "V v", sound: "usually f in 'fun'", example: "Vogel", en: "bird" },
    { letter: "W w", sound: "v in 'van'", example: "Wein", en: "wine" },
    { letter: "X x", sound: "ks in 'box'", example: "Taxi", en: "taxi" },
    { letter: "Y y", sound: "like ü; only in foreign words", example: "Typ", en: "type, guy" },
    { letter: "Z z", sound: "ts in 'cats'", example: "Zug", en: "train" },
    { letter: "Ä ä", sound: "e in 'bed', or a long 'air' without the r", example: "Käse", en: "cheese" },
    { letter: "Ö ö", sound: "say 'ay' with rounded lips", example: "Öl", en: "oil" },
    { letter: "Ü ü", sound: "say 'ee' with rounded lips", example: "Tür", en: "door" },
    { letter: "ß", say: "Eszett", sound: "s in 'sun', after a long vowel", example: "groß", en: "big" },
  ],
  es: [
    { letter: "A a", sound: "a in 'father', short", example: "agua", en: "water" },
    { letter: "B b", sound: "b in 'bed'; softer between vowels, lips barely touching", example: "boca", en: "mouth" },
    { letter: "C c", sound: "k before a, o, u; th in 'think' before e, i (Spain)", example: "casa", en: "house" },
    { letter: "D d", sound: "d in 'dog'; th in 'this' between vowels", example: "dedo", en: "finger" },
    { letter: "E e", sound: "e in 'bed'", example: "esto", en: "this" },
    { letter: "F f", sound: "f in 'fun'", example: "fuego", en: "fire" },
    { letter: "G g", sound: "g in 'go'; a throaty h before e, i", example: "gato", en: "cat" },
    { letter: "H h", sound: "silent", example: "hora", en: "hour" },
    { letter: "I i", sound: "ee in 'see', short", example: "isla", en: "island" },
    { letter: "J j", sound: "throaty h, like ch in Scottish 'loch'", example: "jugo", en: "juice" },
    { letter: "K k", sound: "k; only in foreign words", example: "kilo", en: "kilo" },
    { letter: "L l", sound: "l in 'leaf'; ll is y in 'yes'", example: "luna", en: "moon" },
    { letter: "M m", sound: "m in 'man'", example: "mesa", en: "table" },
    { letter: "N n", sound: "n in 'no'", example: "nada", en: "nothing" },
    { letter: "Ñ ñ", sound: "ny in 'canyon'", example: "niño", en: "child" },
    { letter: "O o", sound: "o in 'more', short, without the glide of 'go'", example: "ojo", en: "eye" },
    { letter: "P p", sound: "p in 'pen', without a puff of air", example: "pan", en: "bread" },
    { letter: "Q q", sound: "k; always que or qui, with a silent u", example: "queso", en: "cheese" },
    { letter: "R r", sound: "a quick tap; rolled at the start of a word and as rr", example: "rápido", en: "fast" },
    { letter: "S s", sound: "s in 'sun', never z", example: "sol", en: "sun" },
    { letter: "T t", sound: "t with the tongue on the teeth, no puff of air", example: "taza", en: "cup" },
    { letter: "U u", sound: "oo in 'food'; silent in gue, gui, que, qui", example: "uva", en: "grape" },
    { letter: "V v", sound: "the same as b", example: "vaca", en: "cow" },
    { letter: "W w", sound: "w; only in foreign words", example: "kiwi", en: "kiwi" },
    { letter: "X x", sound: "ks; a throaty h in a few names like México", example: "examen", en: "exam" },
    { letter: "Y y", say: "ye", sound: "y in 'yes'; on its own (y = and), ee", example: "yo", en: "I" },
    { letter: "Z z", sound: "th in 'think' (Spain); s in Latin America", example: "zapato", en: "shoe" },
  ],
  fr: [
    { letter: "A a", sound: "a in 'father', short", example: "ami", en: "friend" },
    { letter: "B b", sound: "b in 'bed'", example: "bébé", en: "baby" },
    { letter: "C c", sound: "k before a, o, u; s before e, i", example: "ciel", en: "sky" },
    { letter: "D d", sound: "d in 'dog'; silent at the end", example: "deux", en: "two" },
    {
      letter: "E e",
      sound: "a short 'uh'; often silent, always at the end of a word",
      example: "demain",
      en: "tomorrow",
    },
    { letter: "F f", sound: "f in 'fun'", example: "fille", en: "girl, daughter" },
    { letter: "G g", sound: "g in 'go'; s in 'pleasure' before e, i", example: "gare", en: "station" },
    { letter: "H h", sound: "always silent", example: "hôtel", en: "hotel" },
    { letter: "I i", sound: "ee in 'see'", example: "lit", en: "bed" },
    { letter: "J j", sound: "s in 'pleasure'", example: "jour", en: "day" },
    { letter: "K k", sound: "k; rare", example: "kilo", en: "kilo" },
    { letter: "L l", sound: "l in 'leaf'; ill is often y", example: "lune", en: "moon" },
    { letter: "M m", sound: "m in 'man'; after a vowel, often makes it nasal", example: "maison", en: "house" },
    { letter: "N n", sound: "n in 'no'; after a vowel, often makes it nasal", example: "nuit", en: "night" },
    { letter: "O o", sound: "o in 'more', or 'oh' without the glide", example: "mot", en: "word" },
    { letter: "P p", sound: "p in 'pen'; often silent at the end", example: "pomme", en: "apple" },
    { letter: "Q q", sound: "k; almost always qu", example: "quatre", en: "four" },
    { letter: "R r", sound: "throaty, at the back of the mouth", example: "rue", en: "street" },
    { letter: "S s", sound: "s in 'sun'; z between vowels; silent at the end", example: "soleil", en: "sun" },
    { letter: "T t", sound: "t in 'top'; silent at the end", example: "table", en: "table" },
    { letter: "U u", sound: "say 'ee' with rounded lips", example: "sucre", en: "sugar" },
    { letter: "V v", sound: "v in 'van'", example: "ville", en: "town" },
    { letter: "W w", sound: "v or w; only in foreign words", example: "wagon", en: "railway carriage" },
    { letter: "X x", sound: "ks or gz; silent at the end", example: "taxi", en: "taxi" },
    { letter: "Y y", say: "i grec", sound: "ee in 'see'", example: "stylo", en: "pen" },
    { letter: "Z z", sound: "z in 'zoo'; silent at the end", example: "zéro", en: "zero" },
    { letter: "É é", sound: "'ay' without the glide", example: "été", en: "summer" },
    { letter: "È è", sound: "e in 'bed'", example: "mère", en: "mother" },
    { letter: "Ê ê", sound: "e in 'bed'", example: "fête", en: "party" },
    { letter: "Ç ç", sound: "s in 'sun'", example: "garçon", en: "boy" },
  ],
  it: [
    { letter: "A a", sound: "a in 'father'", example: "amore", en: "love" },
    { letter: "B b", sound: "b in 'bed'", example: "bello", en: "beautiful" },
    { letter: "C c", sound: "k before a, o, u, h; ch in 'chair' before e, i", example: "casa", en: "house" },
    { letter: "D d", sound: "d with the tongue on the teeth", example: "dove", en: "where" },
    { letter: "E e", sound: "e in 'bed', or 'ay' without the glide", example: "erba", en: "grass" },
    { letter: "F f", sound: "f in 'fun'", example: "fiore", en: "flower" },
    { letter: "G g", sound: "g in 'go'; j in 'jam' before e, i", example: "gatto", en: "cat" },
    { letter: "H h", sound: "silent; keeps c and g hard", example: "hanno", en: "they have" },
    { letter: "I i", sound: "ee in 'see'; y before another vowel", example: "isola", en: "island" },
    { letter: "J j", sound: "only in foreign words and a few names", example: "jeans", en: "jeans" },
    { letter: "K k", sound: "k; only in foreign words", example: "kiwi", en: "kiwi" },
    { letter: "L l", sound: "l in 'leaf'", example: "luna", en: "moon" },
    { letter: "M m", sound: "m in 'man'", example: "mare", en: "sea" },
    { letter: "N n", sound: "n in 'no'", example: "notte", en: "night" },
    { letter: "O o", sound: "o in 'more', or 'oh' without the glide", example: "occhio", en: "eye" },
    { letter: "P p", sound: "p in 'pen', without a puff of air", example: "pane", en: "bread" },
    { letter: "Q q", sound: "always qu, said 'kw'", example: "quando", en: "when" },
    { letter: "R r", sound: "tapped or rolled with the tongue tip", example: "rosso", en: "red" },
    { letter: "S s", sound: "s in 'sun'; often z between vowels", example: "sole", en: "sun" },
    { letter: "T t", sound: "t with the tongue on the teeth, no puff of air", example: "tavolo", en: "table" },
    { letter: "U u", sound: "oo in 'food'; w before another vowel", example: "uva", en: "grape" },
    { letter: "V v", sound: "v in 'van'", example: "vino", en: "wine" },
    { letter: "W w", sound: "only in foreign words", example: "weekend", en: "weekend" },
    { letter: "X x", sound: "ks; only in foreign words", example: "taxi", en: "taxi" },
    { letter: "Y y", sound: "only in foreign words", example: "yogurt", en: "yoghurt" },
    { letter: "Z z", sound: "ts in 'cats' or ds in 'roads'", example: "pizza", en: "pizza" },
  ],
  pt: [
    {
      letter: "A a",
      say: "á",
      sound: "a in 'father' when stressed; a short 'uh' when not",
      example: "amigo",
      en: "friend",
    },
    { letter: "B b", sound: "b in 'bed'", example: "bola", en: "ball" },
    { letter: "C c", sound: "k before a, o, u; s before e, i", example: "casa", en: "house" },
    { letter: "D d", sound: "d in 'dog'", example: "dia", en: "day" },
    {
      letter: "E e",
      say: "é",
      sound: "e in 'bed' or 'ay' when stressed; almost silent when not",
      example: "festa",
      en: "party",
    },
    { letter: "F f", sound: "f in 'fun'", example: "faca", en: "knife" },
    { letter: "G g", sound: "g in 'go'; s in 'pleasure' before e, i", example: "gato", en: "cat" },
    { letter: "H h", sound: "silent; in ch, lh, nh it changes the letter before", example: "hoje", en: "today" },
    { letter: "I i", sound: "ee in 'see'", example: "ilha", en: "island" },
    { letter: "J j", sound: "s in 'pleasure'", example: "janela", en: "window" },
    { letter: "K k", sound: "k; only in foreign words", example: "kiwi", en: "kiwi" },
    { letter: "L l", sound: "l in 'leaf'; dark, as in 'milk', at the end of a syllable", example: "lua", en: "moon" },
    {
      letter: "M m",
      sound: "m in 'man'; at the end of a syllable, makes the vowel nasal",
      example: "mesa",
      en: "table",
    },
    {
      letter: "N n",
      sound: "n in 'no'; at the end of a syllable, makes the vowel nasal",
      example: "noite",
      en: "night",
    },
    { letter: "O o", say: "ó", sound: "o in 'lot' or 'oh' when stressed; oo when not", example: "olho", en: "eye" },
    { letter: "P p", sound: "p in 'pen'", example: "pão", en: "bread" },
    { letter: "Q q", sound: "k; always qu", example: "queijo", en: "cheese" },
    { letter: "R r", sound: "a tap between vowels; throaty at the start and as rr", example: "rua", en: "street" },
    {
      letter: "S s",
      sound: "s at the start; z between vowels; sh at the end of a syllable",
      example: "sol",
      en: "sun",
    },
    { letter: "T t", sound: "t in 'top'", example: "tempo", en: "time, weather" },
    { letter: "U u", sound: "oo in 'food'", example: "uva", en: "grape" },
    { letter: "V v", sound: "v in 'van'", example: "vinho", en: "wine" },
    { letter: "W w", sound: "only in foreign words", example: "web", en: "web" },
    { letter: "X x", sound: "usually sh; sometimes ks, s or z", example: "peixe", en: "fish" },
    { letter: "Y y", sound: "only in foreign words", example: "yoga", en: "yoga" },
    { letter: "Z z", sound: "z in 'zoo'; sh at the end of a word", example: "zero", en: "zero" },
    { letter: "Ç ç", sound: "s in 'sun'", example: "açúcar", en: "sugar" },
    { letter: "Ã ã", sound: "a nasal 'uh', through the nose", example: "mãe", en: "mother" },
    { letter: "Õ õ", sound: "a nasal 'oh', mostly in -ões", example: "limões", en: "lemons" },
  ],
}

export const BASICS: Record<string, BasicsGroup[]> = {
  de: [
    {
      title: "Letters and sounds",
      entries: [
        {
          title: "Umlauts: ä, ö, ü",
          body: "The two dots change the vowel. ä is like the e in 'bed'. For ö, say 'ay' with rounded lips; for ü, say 'ee' with rounded lips. Without a German keyboard they're written ae, oe, ue.",
          examples: [
            { text: "Mädchen", en: "girl" },
            { text: "schön", en: "beautiful" },
            { text: "über", en: "over, about" },
          ],
        },
        {
          title: "ß (Eszett)",
          body: "Not a B: it's a sharp double s, used after long vowels and ei, au. Switzerland writes ss instead.",
          examples: [
            { text: "Straße", en: "street" },
            { text: "heißen", en: "to be called" },
          ],
        },
        {
          title: "ei and ie",
          body: "Say the second letter in English: ei sounds like 'eye', ie like 'ee'. eu and äu sound like 'oy'.",
          examples: [
            { text: "mein", en: "my" },
            { text: "Liebe", en: "love" },
            { text: "neu", en: "new" },
          ],
        },
        {
          title: "Two ch sounds",
          body: "After a, o, u and au, ch is rasped in the throat, as in Scottish 'loch'. Everywhere else it's a softer hiss, like the h in 'huge' said with force.",
          examples: [
            { text: "Buch", en: "book" },
            { text: "ich", en: "I" },
          ],
        },
        {
          title: "w, v, z and j",
          body: "w sounds like English v, v usually like f, z like 'ts' and j like y.",
          examples: [
            { text: "Wasser", en: "water" },
            { text: "Vater", en: "father" },
            { text: "Zeit", en: "time" },
            { text: "ja", en: "yes" },
          ],
        },
        {
          title: "sch, sp and st",
          body: "sch is 'sh'. At the start of a word, sp and st are 'shp' and 'sht'.",
          examples: [
            { text: "Schule", en: "school" },
            { text: "spielen", en: "to play" },
            { text: "Stadt", en: "city" },
          ],
        },
        {
          title: "Hard endings",
          body: "At the end of a word, b, d and g harden to p, t and k. -ig at the end sounds like 'ich'.",
          examples: [
            { text: "Hund", en: "dog" },
            { text: "Tag", en: "day" },
            { text: "richtig", en: "correct" },
          ],
        },
      ],
    },
    {
      title: "Grammar",
      entries: [
        {
          title: "Every noun has a capital",
          body: "All nouns are capitalised, not only names. It makes nouns easy to spot in a sentence.",
          examples: [{ text: "Der Hund trinkt Wasser.", en: "The dog drinks water." }],
        },
        {
          title: "Three genders: der, die, das",
          body: "Every noun is masculine, feminine or neuter, and the gender often has nothing to do with meaning. Learn each noun with its article. In the plural all three use die.",
          examples: [
            { text: "der Tisch", en: "the table (masculine)" },
            { text: "die Tür", en: "the door (feminine)" },
            { text: "das Mädchen", en: "the girl (neuter)" },
          ],
        },
        {
          title: "Four cases",
          body: "Articles and endings change with a noun's role in the sentence: subject, direct object, indirect object or owner. That's why 'the' can be der, den, dem or des.",
          examples: [
            { text: "Der Mann schläft.", en: "The man is sleeping." },
            { text: "Ich sehe den Mann.", en: "I see the man." },
            { text: "Ich helfe dem Mann.", en: "I'm helping the man." },
          ],
        },
        {
          title: "The verb comes second, or last",
          body: "In a statement the verb is always the second element, even if the sentence starts with 'today'. Second verbs and verbs in clauses with dass, weil or wenn go to the end.",
          examples: [
            { text: "Heute gehe ich ins Kino.", en: "Today I'm going to the cinema." },
            { text: "Ich habe das Buch gelesen.", en: "I've read the book." },
            { text: "Ich bleibe, weil ich müde bin.", en: "I'm staying because I'm tired." },
          ],
        },
        {
          title: "Compound words",
          body: "German glues nouns together into one word. The last part says what it is, and gives the gender.",
          examples: [
            { text: "Handschuh", en: "glove (hand + shoe)" },
            { text: "Krankenhaus", en: "hospital (sick + house)" },
          ],
        },
      ],
    },
    {
      title: "Politeness",
      entries: [
        {
          title: "du and Sie",
          body: "du is 'you' for friends, family, children and other young people. Sie, always capitalised, is for strangers, older people and work. When unsure, start with Sie.",
          examples: [
            { text: "Wie geht es dir?", en: "How are you? (du)" },
            { text: "Wie geht es Ihnen?", en: "How are you? (Sie)" },
          ],
        },
      ],
    },
  ],

  es: [
    {
      title: "Letters and sounds",
      entries: [
        {
          title: "ñ",
          body: "A separate letter, said like the ny in 'canyon'.",
          examples: [
            { text: "año", en: "year" },
            { text: "España", en: "Spain" },
          ],
        },
        {
          title: "Five pure vowels",
          body: "a, e, i, o and u each have one short, clean sound, never the glide of English 'go' or 'say'. A final e is always said.",
          examples: [
            { text: "casa", en: "house" },
            { text: "noche", en: "night" },
          ],
        },
        {
          title: "r and rr",
          body: "A single r is a quick tap, like the tt in American 'butter'. rr, and r at the start of a word, is rolled.",
          examples: [
            { text: "pero", en: "but" },
            { text: "perro", en: "dog" },
            { text: "rojo", en: "red" },
          ],
        },
        {
          title: "j and g",
          body: "j, and g before e or i, is a rough h from the throat. Before a, o and u, g is hard as in 'go'.",
          examples: [
            { text: "jamón", en: "ham" },
            { text: "gente", en: "people" },
            { text: "gato", en: "cat" },
          ],
        },
        {
          title: "Silent h, and b sounds like v",
          body: "h is never pronounced. b and v sound the same, a soft b between the lips.",
          examples: [
            { text: "hola", en: "hello" },
            { text: "vino", en: "wine" },
          ],
        },
        {
          title: "c and z in Spain",
          body: "In Spain, z, and c before e or i, sound like the th in 'think'. In Latin America they sound like s.",
          examples: [
            { text: "gracias", en: "thank you" },
            { text: "cerveza", en: "beer" },
          ],
        },
        {
          title: "ll and y",
          body: "Both sound like the y in 'yes' for most speakers. ll is never an l sound.",
          examples: [
            { text: "llamar", en: "to call" },
            { text: "calle", en: "street" },
          ],
        },
        {
          title: "Accent marks",
          body: "Words ending in a vowel, n or s stress the second-to-last syllable; others stress the last. An accent marks a word that breaks the rule, or tells apart words that sound the same.",
          examples: [
            { text: "café", en: "coffee" },
            { text: "sí", en: "yes (si = if)" },
            { text: "tú", en: "you (tu = your)" },
          ],
        },
        {
          title: "¿ and ¡",
          body: "Questions and exclamations open with an upside-down mark, so you know the tone before you read the sentence.",
          examples: [
            { text: "¿Dónde está?", en: "Where is it?" },
            { text: "¡Qué bien!", en: "How great!" },
          ],
        },
      ],
    },
    {
      title: "Grammar",
      entries: [
        {
          title: "Two genders",
          body: "Every noun is masculine (el) or feminine (la), and adjectives match it. Most -o nouns are masculine and most -a nouns feminine, with exceptions.",
          examples: [
            { text: "el libro rojo", en: "the red book" },
            { text: "la casa roja", en: "the red house" },
            { text: "el día", en: "the day (masculine)" },
          ],
        },
        {
          title: "Two verbs for 'to be'",
          body: "ser is for what something is: identity, origin, time. estar is for where it is and how it is right now.",
          examples: [
            { text: "Soy de Madrid.", en: "I'm from Madrid." },
            { text: "Estoy cansado.", en: "I'm tired." },
          ],
        },
        {
          title: "The subject is often left out",
          body: "The verb ending already says who: 'hablo' is 'I speak'. Saying yo, tú and so on adds emphasis.",
          examples: [{ text: "Tengo hambre.", en: "I'm hungry." }],
        },
      ],
    },
    {
      title: "Politeness",
      entries: [
        {
          title: "tú, usted and vosotros",
          body: "tú is 'you' for friends and family; usted is polite and takes the 'he/she' form of the verb. In Spain, vosotros is 'you all' among friends; Latin America says ustedes to any group.",
          examples: [
            { text: "¿Cómo estás?", en: "How are you? (tú)" },
            { text: "¿Cómo está usted?", en: "How are you? (usted)" },
          ],
        },
      ],
    },
  ],

  fr: [
    {
      title: "Letters and sounds",
      entries: [
        {
          title: "Accents",
          body: "é is like 'ay' without the glide; è and ê are like the e in 'bed'. ç is always an s sound. à and ù only tell words apart (a = has, à = to) and don't change the sound.",
          examples: [
            { text: "été", en: "summer" },
            { text: "mère", en: "mother" },
            { text: "garçon", en: "boy" },
          ],
        },
        {
          title: "Silent final letters",
          body: "Most final consonants aren't said, nor is a final e. c, r, f and l are often pronounced (think 'careful'). The plural -ent of verbs is silent too.",
          examples: [
            { text: "petit", en: "small" },
            { text: "trop", en: "too much" },
            { text: "ils parlent", en: "they speak" },
          ],
        },
        {
          title: "Nasal vowels",
          body: "Before an n or m that ends a syllable, the vowel is said through the nose and the n isn't pronounced: an/en, on, in/ain.",
          examples: [
            { text: "enfant", en: "child" },
            { text: "bon", en: "good" },
            { text: "pain", en: "bread" },
          ],
        },
        {
          title: "u and ou",
          body: "ou is the oo in 'food'. u has no English match: say 'ee' with rounded lips.",
          examples: [
            { text: "tout", en: "all" },
            { text: "tu", en: "you" },
          ],
        },
        {
          title: "The French r",
          body: "Made at the back of the throat, close to a gargle, not with the tongue tip.",
          examples: [{ text: "rouge", en: "red" }],
        },
        {
          title: "Vowel combinations",
          body: "oi is 'wa', au and eau are 'oh', ai is like the e in 'bed'.",
          examples: [
            { text: "moi", en: "me" },
            { text: "beau", en: "beautiful" },
            { text: "lait", en: "milk" },
          ],
        },
        {
          title: "Liaison",
          body: "A silent final consonant is said when the next word starts with a vowel, joining the words: les amis sounds like 'lay-zami'.",
          examples: [
            { text: "les amis", en: "the friends" },
            { text: "vous avez", en: "you have" },
          ],
        },
        {
          title: "Elision: l', j', c'",
          body: "le, la, je, ce, ne and de drop their vowel before a vowel or silent h, and take an apostrophe.",
          examples: [
            { text: "l'homme", en: "the man" },
            { text: "j'aime", en: "I like" },
            { text: "c'est", en: "it is" },
          ],
        },
        {
          title: "Even stress",
          body: "French gives each syllable the same weight, with a slight lift on the last one of a phrase. Don't stress the first syllable as in English.",
          examples: [{ text: "restaurant", en: "restaurant" }],
        },
      ],
    },
    {
      title: "Grammar",
      entries: [
        {
          title: "Two genders",
          body: "Every noun is masculine (le, un) or feminine (la, une), and adjectives match it. Learn each noun with its article; les is the plural for both.",
          examples: [
            { text: "le livre", en: "the book" },
            { text: "la table", en: "the table" },
          ],
        },
        {
          title: "Negation: ne … pas",
          body: "'Not' wraps around the verb. In everyday speech the ne is usually dropped.",
          examples: [
            { text: "Je ne sais pas.", en: "I don't know." },
            { text: "Je sais pas.", en: "Dunno. (spoken)" },
          ],
        },
        {
          title: "Numbers 70 to 99",
          body: "France counts in twenties above 60: 70 is 'sixty-ten', 80 'four twenties', 90 'four twenties ten'. Belgium and Switzerland say septante and nonante.",
          examples: [
            { text: "soixante-dix", en: "70" },
            { text: "quatre-vingts", en: "80" },
            { text: "quatre-vingt-dix", en: "90" },
          ],
        },
      ],
    },
    {
      title: "Politeness and writing",
      entries: [
        {
          title: "tu and vous",
          body: "tu is 'you' for friends, family and children. vous is for strangers, people you work with, and any group. Use vous until someone offers tu.",
          examples: [
            { text: "Comment vas-tu ?", en: "How are you? (tu)" },
            { text: "Comment allez-vous ?", en: "How are you? (vous)" },
          ],
        },
        {
          title: "Spaces before ? ! : ;",
          body: "French puts a space before two-part punctuation, and quotes with « guillemets ».",
          examples: [{ text: "Il a dit : « Bonjour ! »", en: "He said: “Hello!”" }],
        },
      ],
    },
  ],

  it: [
    {
      title: "Letters and sounds",
      entries: [
        {
          title: "Double consonants",
          body: "A double letter is held longer, and it can change the word. Pause slightly on it.",
          examples: [
            { text: "pala", en: "shovel" },
            { text: "palla", en: "ball" },
            { text: "nonno", en: "grandfather" },
          ],
        },
        {
          title: "c and g: soft or hard",
          body: "Before e and i, c is 'ch' and g is 'j'. Elsewhere they're hard, as in 'cat' and 'go'. An h keeps them hard before e and i.",
          examples: [
            { text: "ciao", en: "hi" },
            { text: "che", en: "what" },
            { text: "gelato", en: "ice cream" },
            { text: "spaghetti", en: "spaghetti" },
          ],
        },
        {
          title: "gli, gn and sc",
          body: "gli is like the lli in 'million', gn like the ny in 'canyon'. sc before e or i is 'sh'.",
          examples: [
            { text: "figlio", en: "son" },
            { text: "bagno", en: "bathroom" },
            { text: "pesce", en: "fish" },
          ],
        },
        {
          title: "Pure vowels, all said",
          body: "Each vowel has one clean sound, and every one is pronounced, including the final one.",
          examples: [{ text: "pane", en: "bread" }],
        },
        {
          title: "Rolled r, silent h",
          body: "r is tapped or rolled with the tongue tip. h is never pronounced.",
          examples: [
            { text: "Roma", en: "Rome" },
            { text: "ho", en: "I have" },
          ],
        },
        {
          title: "Accent marks",
          body: "An accent on the last letter means stress falls there. It also tells apart words: è (is) and e (and).",
          examples: [
            { text: "città", en: "city" },
            { text: "perché", en: "why, because" },
            { text: "È vero.", en: "It's true." },
          ],
        },
      ],
    },
    {
      title: "Grammar",
      entries: [
        {
          title: "Two genders, several articles",
          body: "Nouns are masculine or feminine. 'The' changes with the next word's sound: il, lo before z or s + consonant, l' before a vowel, la for feminine.",
          examples: [
            { text: "il libro", en: "the book" },
            { text: "lo zio", en: "the uncle" },
            { text: "l'amica", en: "the (female) friend" },
            { text: "la casa", en: "the house" },
          ],
        },
        {
          title: "The subject is often left out",
          body: "The verb ending says who: 'parlo' is 'I speak'. io, tu and so on add emphasis.",
          examples: [{ text: "Ho fame.", en: "I'm hungry." }],
        },
        {
          title: "Two helpers for the past",
          body: "Most verbs form the past with avere (to have). Verbs of motion or change, and reflexive verbs, use essere (to be), and the participle then agrees like an adjective.",
          examples: [
            { text: "Ho mangiato.", en: "I ate." },
            { text: "Sono andata.", en: "I went. (said by a woman)" },
          ],
        },
      ],
    },
    {
      title: "Politeness",
      entries: [
        {
          title: "tu and Lei",
          body: "tu is 'you' for friends and family. The polite Lei, literally 'she', takes the 'he/she' form of the verb, for men and women alike.",
          examples: [
            { text: "Come stai?", en: "How are you? (tu)" },
            { text: "Come sta?", en: "How are you? (Lei)" },
          ],
        },
      ],
    },
  ],

  pt: [
    {
      title: "Letters and sounds",
      entries: [
        {
          title: "The tilde: ã, õ, ão",
          body: "A ~ makes the vowel nasal, said through the nose. ão, as in 'não', is a nasal 'ow' and is one of the most common sounds in Portuguese.",
          examples: [
            { text: "não", en: "no" },
            { text: "mãe", en: "mother" },
            { text: "limões", en: "lemons" },
          ],
        },
        {
          title: "Nasal m and n",
          body: "An m or n that ends a syllable isn't said as a consonant: it makes the vowel before it nasal.",
          examples: [
            { text: "bom", en: "good" },
            { text: "sim", en: "yes" },
          ],
        },
        {
          title: "Swallowed vowels",
          body: "In Portugal, unstressed vowels are reduced or dropped, so words sound shorter than they look, and a final e is often silent.",
          examples: [
            { text: "telefone", en: "telephone" },
            { text: "pequeno", en: "small" },
          ],
        },
        {
          title: "s that sounds like 'sh'",
          body: "In Portugal, an s or z at the end of a syllable sounds like 'sh'. Between vowels, s is a z sound.",
          examples: [
            { text: "mais", en: "more" },
            { text: "escola", en: "school" },
            { text: "casa", en: "house" },
          ],
        },
        {
          title: "lh and nh",
          body: "lh is like the lli in 'million', nh like the ny in 'canyon'.",
          examples: [
            { text: "filho", en: "son" },
            { text: "vinho", en: "wine" },
          ],
        },
        {
          title: "Two r sounds",
          body: "At the start of a word and as rr, r is guttural, from the back of the throat. Between vowels it's a quick tap.",
          examples: [
            { text: "rua", en: "street" },
            { text: "carro", en: "car" },
            { text: "caro", en: "expensive" },
          ],
        },
        {
          title: "Accents and ç",
          body: "´ marks stress and an open vowel, ^ stress and a closed one. ç is always an s sound.",
          examples: [
            { text: "café", en: "coffee" },
            { text: "você", en: "you" },
            { text: "coração", en: "heart" },
          ],
        },
      ],
    },
    {
      title: "Grammar",
      entries: [
        {
          title: "Two genders",
          body: "Nouns are masculine (o) or feminine (a), and adjectives match. Yes, 'the' is a single letter.",
          examples: [
            { text: "o livro", en: "the book" },
            { text: "a casa", en: "the house" },
          ],
        },
        {
          title: "Contractions",
          body: "Short prepositions merge with the article: de + o = do, em + a = na, por + o = pelo.",
          examples: [
            { text: "o carro do João", en: "João's car" },
            { text: "na rua", en: "in the street" },
          ],
        },
        {
          title: "Two verbs for 'to be'",
          body: "ser is for what something is: identity, origin, time. estar is for where it is and how it is right now.",
          examples: [
            { text: "Sou de Lisboa.", en: "I'm from Lisbon." },
            { text: "Estou cansado.", en: "I'm tired." },
          ],
        },
        {
          title: "'I'm doing': estar a + verb",
          body: "Portugal says 'I am at speaking' for an action in progress. (Brazil says estou falando.)",
          examples: [{ text: "Estou a trabalhar.", en: "I'm working." }],
        },
        {
          title: "The subject is often left out",
          body: "The verb ending says who: 'falo' is 'I speak'.",
          examples: [{ text: "Tenho fome.", en: "I'm hungry." }],
        },
      ],
    },
    {
      title: "Politeness",
      entries: [
        {
          title: "tu, você and o senhor",
          body: "In Portugal tu is 'you' for friends and family. você can sound blunt to strangers; it's politer to use their name or o senhor / a senhora, with the 'he/she' verb form.",
          examples: [
            { text: "Como estás?", en: "How are you? (tu)" },
            { text: "Como está o senhor?", en: "How are you, sir?" },
          ],
        },
      ],
    },
  ],

  ru: [
    {
      title: "About the letters",
      entries: [
        {
          title: "Cyrillic",
          body: "Russian uses the 33-letter Cyrillic alphabet. Once you learn it, spelling is a good guide to pronunciation, far better than in English.",
          examples: [
            { text: "Москва", en: "Moscow" },
            { text: "спасибо", en: "thank you" },
          ],
        },
        {
          title: "False friends",
          body: "These look like Latin letters but aren't: В is v, Н is n, Р is r, С is s, У is oo, Х is the ch in 'loch', Е is 'ye'.",
          examples: [
            { text: "вода", en: "water" },
            { text: "нет", en: "no" },
            { text: "рука", en: "hand" },
            { text: "хорошо", en: "good" },
          ],
        },
        {
          title: "Sounds English doesn't have",
          body: "Ж is the s in 'pleasure', Ш a hard 'sh', Щ a long soft 'shsh', Ц 'ts', Ч 'ch'. Ы is like 'i' said with the tongue pulled back.",
          examples: [
            { text: "жена", en: "wife" },
            { text: "щи", en: "cabbage soup" },
            { text: "улица", en: "street" },
            { text: "мы", en: "we" },
          ],
        },
        {
          title: "Soft and hard signs: ь, ъ",
          body: "They have no sound of their own. ь softens the consonant before it (tongue raised as for 'y'); ъ keeps a short break before я, е, ё, ю.",
          examples: [
            { text: "мать", en: "mother" },
            { text: "объект", en: "object" },
          ],
        },
        {
          title: "ё is usually written е",
          body: "ё (yo) is always stressed, but books and signs drop the dots, so you have to know the word.",
          examples: [{ text: "ёлка", en: "fir tree" }],
        },
      ],
    },
    {
      title: "Sounds",
      entries: [
        {
          title: "Stress isn't marked",
          body: "Any syllable can be stressed, and the stress can move between forms of the same word. Learners' books mark it with an accent; normal text doesn't.",
          examples: [
            { text: "замок", en: "castle (ЗА-мок) or lock (за-МОК)" },
            { text: "рука, руки", en: "hand, hands (stress moves)" },
          ],
        },
        {
          title: "Unstressed о sounds like а",
          body: "Only a stressed о sounds like 'o'. Elsewhere it's an 'a' or a short 'uh': молоко is 'ma-la-KO'. Unstressed е and я drift towards 'i'.",
          examples: [
            { text: "молоко", en: "milk" },
            { text: "хорошо", en: "good" },
          ],
        },
        {
          title: "Hard endings",
          body: "At the end of a word, б, в, г, д, ж, з harden to п, ф, к, т, ш, с.",
          examples: [
            { text: "хлеб", en: "bread (sounds 'khlep')" },
            { text: "город", en: "city (sounds 'GO-rat')" },
          ],
        },
      ],
    },
    {
      title: "Grammar",
      entries: [
        {
          title: "No 'a' or 'the'",
          body: "Russian has no articles. Context, and word order, tell you whether it's 'a book' or 'the book'.",
          examples: [{ text: "Это книга.", en: "This is a book." }],
        },
        {
          title: "No 'is' in the present",
          body: "'Am / is / are' is left out in the present tense. A dash sometimes stands in for it in writing.",
          examples: [
            { text: "Я студент.", en: "I am a student." },
            { text: "Москва — столица России.", en: "Moscow is the capital of Russia." },
          ],
        },
        {
          title: "Six cases",
          body: "Noun endings change with a word's role: subject, object, 'of', 'to', 'with' and 'about / in'. Word order is freer because the endings do the work.",
          examples: [
            { text: "Это мама.", en: "This is mum." },
            { text: "Я люблю маму.", en: "I love mum." },
            { text: "Я с мамой.", en: "I'm with mum." },
          ],
        },
        {
          title: "Three genders",
          body: "Nouns ending in a consonant are usually masculine, -а / -я feminine, -о / -е neuter. -ь can be either masculine or feminine.",
          examples: [
            { text: "дом", en: "house (m)" },
            { text: "книга", en: "book (f)" },
            { text: "окно", en: "window (n)" },
          ],
        },
        {
          title: "Verbs come in pairs",
          body: "Most verbs have two versions: imperfective for ongoing or repeated actions, perfective for one finished action. Dictionaries list both.",
          examples: [
            { text: "Я читал книгу.", en: "I was reading the book." },
            { text: "Я прочитал книгу.", en: "I read the book (to the end)." },
          ],
        },
        {
          title: "The past goes by gender",
          body: "Past tense verbs agree with the speaker's or subject's gender, not with 'I / you / he'.",
          examples: [
            { text: "Он читал.", en: "He was reading." },
            { text: "Она читала.", en: "She was reading." },
          ],
        },
      ],
    },
    {
      title: "Politeness",
      entries: [
        {
          title: "ты and вы",
          body: "ты is 'you' for friends, family and children. вы is for strangers, older people, work, and any group. Adults use вы and the full first name with patronymic: Анна Петровна.",
          examples: [
            { text: "Как ты?", en: "How are you? (ты)" },
            { text: "Как вы?", en: "How are you? (вы)" },
          ],
        },
      ],
    },
  ],
}
