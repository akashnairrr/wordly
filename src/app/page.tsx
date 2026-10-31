import Link from "next/link";
import { Flag } from "@/components/Flag";
import { LANGUAGES } from "@/lib/languages";
import styles from "./landing.module.css";

export default function LanguagePicker() {
  return (
    <main className="container">
      <section className={styles.hero}>
        <p className={styles.logo}>wordly</p>
        <h1 className={styles.title}>Learn the words people actually say.</h1>
        <p className={styles.lede}>
          The most common spoken words of a language, one small lesson at a time: what they mean, how native speakers say them, how they change, and how
          they&apos;re used in real sentences.
        </p>
      </section>

      <section className={styles.languages}>
        <h2 className={styles.pick}>Choose a language</h2>
        <ul>
          {Object.values(LANGUAGES).map((l) => (
            <li key={l.code}>
              <Link href={`/${l.code}/`} className={styles.language}>
                <span className={styles.name}>
                  <Flag country={l.country} height={28} />
                  <span className={`display ${styles.native}`} lang={l.code}>
                    {l.nativeName}
                  </span>
                </span>
                <span className="muted">{l.name}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="small">
          More languages are on the way. <Link href="/about/">Data sources & credits</Link>
        </p>
      </section>
    </main>
  );
}
