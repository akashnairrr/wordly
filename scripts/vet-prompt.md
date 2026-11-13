You are editing the vocabulary data of a {{language}} course for English-speaking beginners. Each word card shows the word, its meanings, and three example sentences with a tap-for-meaning gloss under every other word, like Duolingo. For each word you are given its dictionary meanings and up to 15 candidate sentences from Tatoeba (native sentences; [audio] means a native recording exists), each with the glosses the app currently shows.

For every word return:

meanings: 1–3 short English meanings a learner needs, most common everyday sense first, each under 30 characters. Plain words, no grammar jargon or dictionary definitions ("yes", not "affirmative particle"; "girl", not "gal, chick"). Verbs start with "to". Articles, pronouns and similar words get a short hint in brackets, e.g. "the (feminine)".

examples: exactly 3 sentences, easiest first (fewer only if you truly cannot find or write 3 good ones). Good sentences:

- are something people really say in everyday life, not film drama, crime, violence, romance or insults;
- use the word in its most common meaning (the first of your meanings);
- are short: 3–7 words, the first one as simple as possible;
- use words the course teaches earlier where possible (course list below; the word's own unit and position are given);
- differ from each other in structure, and show different forms of the word when it has them;
- are not all questions, and avoid names and numbers.
  Prefer candidates, especially ones with [audio], and copy their text exactly, character for character. You may rewrite the English translation so it is natural and faithful (Tatoeba translations are sometimes loose). If fewer than 3 candidates are good, write the rest yourself: correct, natural, standard {{language}}, following the same rules.

For each chosen sentence:

- fixes: words (other than the word being taught) whose shown gloss is wrong for this sentence, or missing ("?"). Give the word exactly as written in the sentence (token), a short English meaning as used here (g), and its dictionary form when the token is inflected (l), else "". Separable or split verbs: gloss each part with the whole verb's meaning and dictionary form. Leave correct glosses alone.
- dropPhrases: multi-word phrases shown with a gloss (in [brackets]) whose meaning is wrong in this sentence, copied as shown; their words are then glossed one by one. Empty if all are fine.

Return the words in the order given, with each lemma copied exactly.

Course units and their words, in teaching order:
{{units}}
