import Link from "next/link";

export const metadata = { title: "Data sources & credits · Wordly" };

const SOURCES = [
  {
    title: "Word frequency",
    body: (
      <>
        <a href="https://github.com/hermitdave/FrequencyWords">FrequencyWords</a> by Hermit Dave, built from{" "}
        <a href="https://opus.nlpl.eu/OpenSubtitles.php">OpenSubtitles 2018</a>. CC BY-SA 4.0.
      </>
    ),
  },
  {
    title: "Meanings, forms and conjugations",
    body: (
      <>
        <a href="https://en.wiktionary.org/">Wiktionary</a> contributors, via the <a href="https://kaikki.org/">kaikki.org</a> extract (Tatu Ylonen,
        Wiktextract). CC BY-SA 4.0 and GFDL.
      </>
    ),
  },
  {
    title: "Word recordings",
    body: (
      <>
        Native speakers on <a href="https://lingualibre.org/">Lingua Libre</a> and Wiktionary, hosted on{" "}
        <a href="https://commons.wikimedia.org/">Wikimedia Commons</a>. CC BY-SA (per recording).
      </>
    ),
  },
  {
    title: "Example sentences and their recordings",
    body: (
      <>
        <a href="https://tatoeba.org/">Tatoeba</a> contributors, via <a href="https://www.manythings.org/anki/">manythings.org</a>. Sentences CC BY 2.0
        FR; recordings under each contributor&apos;s licence.
      </>
    ),
  },
];

export default function About() {
  return (
    <main className="container">
      <p style={{ margin: "28px 0 0" }}>
        <Link href="/">← Wordly</Link>
      </p>
      <h1 style={{ fontSize: "clamp(34px, 7vw, 48px)", margin: "16px 0 8px", color: "var(--accent)" }}>Data sources & credits</h1>
      <p className="muted">Wordly is built entirely on open data. Thank you to everyone who contributed to these projects.</p>
      <ul style={{ listStyle: "none", padding: 0, margin: "24px 0", borderTop: "1px solid var(--line)" }}>
        {SOURCES.map((s) => (
          <li key={s.title} style={{ padding: "16px 0", borderBottom: "1px solid var(--line)" }}>
            <h2 style={{ fontSize: 20, marginBottom: 6 }}>{s.title}</h2>
            <p style={{ margin: 0 }}>{s.body}</p>
          </li>
        ))}
      </ul>
      <p className="small">
        The generated word data is a derivative of these sources and is shared under CC BY-SA 4.0. Where no recording exists, pronunciation uses your
        browser&apos;s built-in text-to-speech.
      </p>
    </main>
  );
}
