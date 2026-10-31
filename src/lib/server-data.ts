// Build-time reads of the same generated files, for statically rendered pages.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { IndexEntry, Word } from "./types";

const dir = (lang: string) => join(process.cwd(), "public/data", lang);

export function readIndex(lang: string): IndexEntry[] {
  return JSON.parse(readFileSync(join(dir(lang), "index.json"), "utf8"));
}

export function readWord(lang: string, id: string): Word {
  return JSON.parse(readFileSync(join(dir(lang), "words", `${id}.json`), "utf8"));
}
