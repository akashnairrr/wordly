"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getLanguage } from "@/lib/languages";
import { playRecording, RATES, speak, voicesFor } from "@/lib/speech";
import { useProgress } from "@/lib/useProgress";

export interface SayOptions {
  slow?: boolean;
  /** Human recording to prefer over text-to-speech. */
  audio?: string;
}

interface SpeechApi {
  /** Text-to-speech availability; null while voices are still loading. Recordings work regardless. */
  available: boolean | null;
  voices: SpeechSynthesisVoice[];
  /** The voice actually used for text-to-speech (chosen one, else the most natural). */
  voice?: SpeechSynthesisVoice;
  say: (text: string, opts?: SayOptions) => void;
}

const SpeechContext = createContext<SpeechApi>({ available: null, voices: [], say: () => {} });

export function SpeechProvider({ lang, children }: { lang: string; children: React.ReactNode }) {
  const language = getLanguage(lang);
  const [progress] = useProgress(lang);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[] | null>(null);

  useEffect(() => {
    let live = true;
    voicesFor(language).then((v) => live && setVoices(v));
    return () => {
      live = false;
    };
  }, [language]);

  const voiceURI = progress?.settings.voiceURI;
  const rate = progress?.settings.rate ?? RATES.normal;
  // voicesFor() sorts most natural first, so [0] is the best default.
  const voice = voices?.find((v) => v.voiceURI === voiceURI) ?? voices?.[0];

  const say = useCallback(
    (text: string, { slow = false, audio }: SayOptions = {}) => {
      const r = slow ? RATES.slow : rate;
      const tts = () => speak(text, language, { voice, rate: r });
      if (audio) playRecording(audio, r, tts);
      else tts();
    },
    [voice, rate, language],
  );

  const api = useMemo(() => ({ available: voices === null ? null : voices.length > 0, voices: voices ?? [], voice, say }), [voices, voice, say]);
  return <SpeechContext.Provider value={api}>{children}</SpeechContext.Provider>;
}

export const useSpeech = () => useContext(SpeechContext);
