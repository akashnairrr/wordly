import { LANGUAGE_LIST } from "./languages"

// The language last used on this device, so the landing page can offer to continue in it.
const KEY = "wordly:language"

export function saveLastLanguage(code: string) {
  try {
    localStorage.setItem(KEY, code)
  } catch {
    // Storage blocked (private mode): the landing page just starts from the first language.
  }
}

/** The saved language, if it's still one the app offers. */
export function readLastLanguage(): string | null {
  try {
    const code = localStorage.getItem(KEY)
    return code && LANGUAGE_LIST.some((l) => l.code === code) ? code : null
  } catch {
    return null
  }
}
