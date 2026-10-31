// Pronunciation: human recordings when the data has one, otherwise the best text-to-speech voice the browser offers.
import type { Language } from "./languages";

export const RATES = { normal: 0.95, slow: 0.7 } as const;

// macOS/iOS novelty and legacy voices: robotic, so never picked by default.
const ROBOTIC = /\b(Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley|Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Fred|Junior|Kathy|Ralph)\b/i;
// Neural/cloud voices (Edge "… Online (Natural)", Chrome "Google …", Apple "Enhanced"/"Premium") sound far more human.
const NATURAL = /natural|neural|premium|enhanced|online|google/i;

export function voiceQuality(v: SpeechSynthesisVoice): number {
  if (ROBOTIC.test(v.name)) return -10;
  return (NATURAL.test(v.name) ? 5 : 0) + (v.localService ? 0 : 2);
}

export const isNaturalVoice = (v: SpeechSynthesisVoice) => voiceQuality(v) >= 5;

function matches(voice: SpeechSynthesisVoice, locale: string) {
  return voice.lang.replace("_", "-").toLowerCase().startsWith(locale.toLowerCase());
}

/** Voices for the language, most natural first. Waits briefly because browsers load voices asynchronously. */
export function voicesFor(lang: Language): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return Promise.resolve([]);
  const pick = () => {
    const all = speechSynthesis.getVoices();
    const localeRank = (v: SpeechSynthesisVoice) => lang.ttsLocales.findIndex((l) => matches(v, l));
    return all
      .filter((v) => localeRank(v) >= 0)
      .sort((a, b) => voiceQuality(b) - voiceQuality(a) || localeRank(a) - localeRank(b));
  };
  if (speechSynthesis.getVoices().length) return Promise.resolve(pick());
  return new Promise((resolve) => {
    const done = () => {
      speechSynthesis.removeEventListener("voiceschanged", done);
      resolve(pick());
    };
    speechSynthesis.addEventListener("voiceschanged", done);
    setTimeout(done, 1500);
  });
}

let current: HTMLAudioElement | null = null;

export function stopSpeaking() {
  current?.pause();
  current = null;
  if (typeof window !== "undefined" && "speechSynthesis" in window) speechSynthesis.cancel();
}

export function speak(text: string, lang: Language, opts: { voice?: SpeechSynthesisVoice; rate?: number } = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  stopSpeaking();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = opts.voice?.lang ?? lang.ttsLocales[0];
  if (opts.voice) u.voice = opts.voice;
  u.rate = opts.rate ?? RATES.normal;
  speechSynthesis.speak(u);
}

/** Plays a human recording; calls `fallback` (text-to-speech) if it can't load or play. */
export function playRecording(url: string, rate: number, fallback: () => void) {
  stopSpeaking();
  const audio = new Audio(url);
  audio.playbackRate = rate;
  audio.preservesPitch = true;
  current = audio;
  let failed = false;
  const fail = () => {
    if (failed || current !== audio) return;
    failed = true;
    fallback();
  };
  audio.addEventListener("error", fail);
  audio.play().catch(fail);
}
