// Client-side loading of generated word data from public/data/<lang>/.
import type { IndexEntry, Word } from "./types"

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
const cache = new Map<string, Promise<unknown>>()

function getJson<T>(path: string): Promise<T> {
  let p = cache.get(path)
  if (!p) {
    p = fetch(`${BASE}/data/${path}`).then((r) => {
      if (!r.ok) throw new Error(`Failed to load ${path} (${r.status})`)
      return r.json()
    })
    p.catch(() => cache.delete(path))
    cache.set(path, p)
  }
  return p as Promise<T>
}

// Data built before course units has no teaching order: teach it by frequency, as it was.
// ponytail: drop once every language is rebuilt with a curriculum.
const withOrder = <T extends { rank: number; order?: number }>(w: T): T => ({ ...w, order: w.order ?? w.rank })

export const fetchIndex = (lang: string) =>
  getJson<IndexEntry[]>(`${lang}/index.json`).then((index) => index.map(withOrder))
export const fetchWord = (lang: string, id: string) =>
  getJson<Word>(`${lang}/words/${encodeURIComponent(id)}.json`).then(withOrder)
