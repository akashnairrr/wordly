// Quiz sound effects, synthesised with Web Audio so there are no files to load.

type Sfx = "correct" | "wrong" | "done"

// [frequency Hz, start s, length s] per note.
const NOTES: Record<Sfx, { wave: OscillatorType; notes: [number, number, number][] }> = {
  correct: {
    wave: "sine",
    notes: [
      [784, 0, 0.12],
      [1175, 0.09, 0.2],
    ],
  },
  wrong: {
    wave: "triangle",
    notes: [
      [196, 0, 0.12],
      [147, 0.1, 0.22],
    ],
  },
  done: {
    wave: "sine",
    notes: [
      [523, 0, 0.15],
      [659, 0.12, 0.15],
      [784, 0.24, 0.15],
      [1047, 0.36, 0.35],
    ],
  },
}

let ctx: AudioContext | undefined

export function playSfx(kind: Sfx) {
  try {
    ctx ??= new AudioContext()
    const { wave, notes } = NOTES[kind]
    for (const [freq, start, length] of notes) {
      const t = ctx.currentTime + start
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = wave
      osc.frequency.value = freq
      // Quick attack, exponential fade: a soft blip rather than a click.
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.15, t + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + length)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + length)
    }
  } catch {
    // No Web Audio (old browser, blocked): the quiz works silently.
  }
}
