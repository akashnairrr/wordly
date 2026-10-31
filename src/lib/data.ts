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

export const fetchIndex = (lang: string) => getJson<IndexEntry[]>(`${lang}/index.json`)
export const fetchWord = (lang: string, id: string) => getJson<Word>(`${lang}/words/${encodeURIComponent(id)}.json`)
