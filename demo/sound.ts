// Demo sounds, synthesized with the Web Audio API: no recording is used (see docs/LEGAL.md).
// Nothing is created until the first sound, so browsers that block audio before a click are fine.

let context: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null;
  context ??= new AudioContext();
  if (context.state === 'suspended') void context.resume();
  return context;
}

/** Plays samples computed by `sample(time)`, faded in and out over 10 ms to avoid clicks. */
function play(seconds: number, volume: number, sample: (time: number) => number): void {
  const ctx = audio();
  if (!ctx) return;
  const rate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, Math.ceil(seconds * rate), rate);
  const data = buffer.getChannelData(0);
  const fade = 0.01 * rate;
  for (let i = 0; i < data.length; i++) {
    const envelope = Math.min(1, i / fade, (data.length - 1 - i) / fade);
    data[i] = sample(i / rate) * envelope * volume;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
}

/** A short beep for a key press. */
export function playKey(): void {
  play(0.05, 0.08, (t) => (Math.sin(2 * Math.PI * 1000 * t) > 0 ? 1 : -1));
}

/**
 * A modem connection, after the V.23 standard used by the Minitel: the answer tone (2,100 Hz), the
 * idle carriers, then data. Data goes down at 1,200 baud (1,300 Hz for a 1, 2,100 Hz for a 0) and
 * up at 75 baud (390 Hz for a 1, 450 Hz for a 0). The bits are random.
 */
export function playConnection(): void {
  const ANSWER = 0.6;
  const CARRIER = 0.4;
  const DATA = 0.9;
  const down = { phase: 0, bit: 1, slot: -1 };
  const up = { phase: 0, bit: 1, slot: -1 };
  let last = 0;

  /** Phase-continuous frequency shift keying: a new random bit at each slot. */
  const fsk = (state: typeof down, time: number, step: number, baud: number, mark: number, space: number, idle: boolean) => {
    const slot = Math.floor(time * baud);
    if (slot !== state.slot) {
      state.slot = slot;
      state.bit = idle || Math.random() < 0.5 ? 1 : 0;
    }
    state.phase = (state.phase + 2 * Math.PI * (state.bit ? mark : space) * step) % (2 * Math.PI);
    return Math.sin(state.phase);
  };

  play(ANSWER + CARRIER + DATA, 0.12, (t) => {
    const step = t - last;
    last = t;
    if (t < ANSWER) return Math.sin(2 * Math.PI * 2100 * t);
    const idle = t < ANSWER + CARRIER;
    return 0.7 * fsk(down, t, step, 1200, 1300, 2100, idle) + 0.3 * fsk(up, t, step, 75, 390, 450, idle);
  });
}
