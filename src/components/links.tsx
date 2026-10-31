"use client";

import Button, { type ButtonProps } from "@mui/material/Button";
import Link, { type LinkProps } from "@mui/material/Link";
import NextLink from "next/link";
import { useSyncExternalStore } from "react";

// MUI components rendered as Next links. Client-only, so server pages can use them (a component prop can't cross from server to client).

export function ButtonLink(props: ButtonProps & { href: string }) {
  return <Button component={NextLink} {...props} />;
}

export function TextLink(props: LinkProps & { href: string }) {
  return <Link component={NextLink} {...props} />;
}

/** Remembers the word list's filters (its ?q=&filter=&pos=) for this tab, so links back to the list can restore them. */
export const wordsSearchKey = (lang: string) => `wordly:words-search:${lang}`;

function savedSearch(lang: string): string {
  try {
    return sessionStorage.getItem(wordsSearchKey(lang)) ?? "";
  } catch {
    return ""; // Storage blocked: plain list.
  }
}

const noSubscribe = () => () => {};

/** "← All words", back to the list as it was last filtered. */
export function WordsBackLink({ lang }: { lang: string }) {
  // Read after hydration only; the static HTML links to the plain list.
  const search = useSyncExternalStore(
    noSubscribe,
    () => savedSearch(lang),
    () => "",
  );
  return <TextLink href={`/${lang}/words/${search}`}>← All words</TextLink>;
}
