"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Header.module.css";

export function Header({ lang, languageName }: { lang: string; languageName: string }) {
  const path = usePathname().replace(/\/?$/, "/");
  const links = [
    { href: `/${lang}/`, label: "Today", active: path === `/${lang}/` || path.startsWith(`/${lang}/session`) },
    { href: `/${lang}/words/`, label: "Words", active: path.startsWith(`/${lang}/words`) },
    { href: `/${lang}/progress/`, label: "Progress", active: path.startsWith(`/${lang}/progress`) },
  ];
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          wordly
        </Link>
        <nav className={styles.nav} aria-label="Main">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={styles.link} aria-current={l.active ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>
        <span className={styles.lang}>{languageName}</span>
      </div>
    </header>
  );
}
