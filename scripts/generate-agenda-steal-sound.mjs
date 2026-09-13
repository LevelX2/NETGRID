import { writeFileSync } from "node:fs";

// NETGRID agenda-steal cue. Original deterministic synthesis without samples.
const sr = 48000;
const smooth = (x) => {
  x = Math.max(0, Math.min(1, x));
  return x * x * (3 - 2 * x);
};

function createCue(name, duration, compose) {
  const frames = Math.round(sr * duration);
  const channels = [new Float64Array(frames), new Float64Array(frames)];
  function tone({
    at = 0,
    length = 0.5,
    f = 110,
    end = f,
    amp = 0.1,
    pan = 0,
    attack = 0.012,
    release = 0.15,
    decay = 0,
    fm = 0,
    ratio = 2,
    fmDecay = 0.2,
    edge = 0.2,
    swell = false,
  }) {
    const offset = Math.round(at * sr);
    let phase = 0;
    for (let i = 0; i < Math.round(length * sr) && i + offset < frames; i++) {
      const t = i / sr;
      const progress = t / length;
      const freq = f * (end / f) ** progress;
      phase += (2 * Math.PI * freq) / sr;
      const env =
        smooth(t / attack) *
        smooth((length - t) / release) *
        Math.exp(-decay * t) *
        (swell ? 0.15 + 0.85 * smooth(progress) : 1);
      const modulation = fm * Math.exp(-t / fmDecay) * Math.sin(ratio * phase);
      const value =
        amp *
        env *
        (Math.sin(phase + modulation) +
          edge * Math.sin(2 * phase) +
          edge * 0.4 * Math.sin(3 * phase));
      const movingPan = Math.min(0.95, Math.max(-0.95, pan));
      channels[0][i + offset] += value * Math.sqrt((1 - movingPan) / 2);
      channels[1][i + offset] += value * Math.sqrt((1 + movingPan) / 2);
    }
  }
  compose(tone);
  const dry = channels.map((c) => c.slice());
  for (const [delay, gain] of [
    [0.071, 0.11],
    [0.113, 0.085],
    [0.179, 0.055],
    [0.263, 0.03],
  ]) {
    const n = Math.round(delay * sr);
    for (let i = n; i < frames; i++) {
      channels[0][i] += dry[1][i - n] * gain;
      channels[1][i] += dry[0][i - n] * gain;
    }
  }
  let peak = 0,
    energy = 0;
  for (const channel of channels)
    for (const sample of channel) {
      peak = Math.max(peak, Math.abs(sample));
      energy += sample * sample;
    }
  const rms = Math.sqrt(energy / (2 * frames));
  const scale = Math.min(10 ** (-3 / 20) / peak, 10 ** (-17 / 20) / rms);
  const wav = Buffer.alloc(44 + frames * 4);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write("WAVE", 8);
  wav.write("fmt ", 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(2, 22);
  wav.writeUInt32LE(sr, 24);
  wav.writeUInt32LE(sr * 4, 28);
  wav.writeUInt16LE(4, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(frames * 4, 40);
  for (let i = 0; i < frames; i++)
    for (let ch = 0; ch < 2; ch++) {
      wav.writeInt16LE(
        Math.round(channels[ch][i] * scale * 32767),
        44 + i * 4 + ch * 2,
      );
    }
  writeFileSync(new URL(name, import.meta.url), wav);
  console.log(
    JSON.stringify({
      name,
      duration,
      peakDbFS: 20 * Math.log10(peak * scale),
      rmsDbFS: 20 * Math.log10(rms * scale),
    }),
  );
}

// Six short descending notes,
// then a separated, sustained lowest note: D4 C4 Bb3 A3 G3 F3 — D3.
createCue(
  "../apps/web/public/audio/netgrid/agenda/agenda-stolen-descent.wav",
  2.43,
  (tone) => {
    const notes = [293.66, 261.63, 233.08, 220, 196, 174.61, 146.83];
    notes.forEach((f, i) => {
      const last = i === notes.length - 1;
      const at = 0.03 + i * 0.17 + (last ? 0.14 : 0);
      tone({
        at,
        length: last ? 0.78 : 0.135,
        f,
        amp: 0.2,
        edge: 0.25,
        fm: 0.4,
        ratio: 2,
        fmDecay: 0.065,
        attack: 0.008,
        release: last ? 0.4 : 0.035,
        decay: last ? 1.2 : 0,
      });
      tone({
        at: at + 0.003,
        length: last ? 0.85 : 0.135,
        f: f / 2,
        amp: 0.105,
        edge: 0.1,
        attack: 0.01,
        release: last ? 0.44 : 0.04,
        decay: last ? 1.2 : 0,
      });
    });
    // The lowest foundation begins with the final note, after the small pause.
    tone({
      at: 1.19,
      length: 0.94,
      f: 73.415,
      amp: 0.1,
      attack: 0.02,
      release: 0.44,
      decay: 1.0,
      edge: 0.12,
    });
  },
);
