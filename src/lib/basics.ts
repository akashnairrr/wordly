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
  /** The sound, described for an English speaker. */
  sound: string
  example: string
  en: string
}

/** Full alphabet charts, for languages that don't use the Latin alphabet. Shown before the rest of the basics. */
export const ALPHABETS: Record<string, Letter[]> = {
  ru: [
    { letter: "А а", sound: "a in 'father'", example: "мама", en: "mum" },
    { letter: "Б б", sound: "b in 'bed'", example: "брат", en: "brother" },
    { letter: "В в", sound: "v in 'van'", example: "вода", en: "water" },
    { letter: "Г г", sound: "g in 'go'", example: "год", en: "year" },
    { letter: "Д д", sound: "d in 'dog'", example: "дом", en: "house" },
    { letter: "Е е", sound: "ye in 'yes'", example: "еда", en: "food" },
    { letter: "Ё ё", sound: "yo in 'yoghurt', always stressed", example: "ёж", en: "hedgehog" },
    { letter: "Ж ж", sound: "s in 'pleasure'", example: "жена", en: "wife" },
    { letter: "З з", sound: "z in 'zoo'", example: "зима", en: "winter" },
    { letter: "И и", sound: "ee in 'see'", example: "игра", en: "game" },
    { letter: "Й й", sound: "y in 'boy'", example: "мой", en: "my" },
    { letter: "К к", sound: "k in 'kite'", example: "кот", en: "cat" },
    { letter: "Л л", sound: "l in 'milk'", example: "луна", en: "moon" },
    { letter: "М м", sound: "m in 'man'", example: "мир", en: "world, peace" },
    { letter: "Н н", sound: "n in 'no'", example: "нос", en: "nose" },
    { letter: "О о", sound: "o in 'more' when stressed, else like а", example: "окно", en: "window" },
    { letter: "П п", sound: "p in 'pen'", example: "папа", en: "dad" },
    { letter: "Р р", sound: "rolled r", example: "рыба", en: "fish" },
    { letter: "С с", sound: "s in 'sun'", example: "сок", en: "juice" },
    { letter: "Т т", sound: "t in 'top'", example: "там", en: "there" },
    { letter: "У у", sound: "oo in 'food'", example: "утро", en: "morning" },
    { letter: "Ф ф", sound: "f in 'fun'", example: "фото", en: "photo" },
    { letter: "Х х", sound: "ch in Scottish 'loch'", example: "хлеб", en: "bread" },
    { letter: "Ц ц", sound: "ts in 'cats'", example: "цвет", en: "colour" },
    { letter: "Ч ч", sound: "ch in 'chair'", example: "чай", en: "tea" },
    { letter: "Ш ш", sound: "sh in 'shop', but harder", example: "шапка", en: "hat" },
    { letter: "Щ щ", sound: "long, soft shsh, as in 'fresh sheets'", example: "ещё", en: "more, still" },
    { letter: "Ъ ъ", sound: "hard sign: no sound, a short break", example: "подъезд", en: "entrance" },
    { letter: "Ы ы", sound: "i in 'bit' with the tongue pulled back", example: "сыр", en: "cheese" },
    { letter: "Ь ь", sound: "soft sign: no sound, softens the letter before", example: "соль", en: "salt" },
    { letter: "Э э", sound: "e in 'bet'", example: "это", en: "this" },
    { letter: "Ю ю", sound: "yu in 'you'", example: "юг", en: "south" },
    { letter: "Я я", sound: "ya in 'yard'", example: "яблоко", en: "apple" },
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
