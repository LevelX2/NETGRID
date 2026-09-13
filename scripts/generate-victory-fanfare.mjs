import { writeFileSync } from "node:fs";

// NETGRID victory fanfare. Original deterministic synthesis; no samples or dependencies.
const rate = 48000;
const duration = 3.79;
const frames = Math.round(rate * duration);
const left = new Float64Array(frames);
const right = new Float64Array(frames);
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
const smooth = (x) => {
  x = Math.min(1, Math.max(0, x));
  return x * x * (3 - 2 * x);
};

function synth(midi, start, hold, level, pan, kind = "lead") {
  const release = kind === "bell" ? 0.38 : hold > 0.5 ? 0.36 : 0.07;
  const begin = Math.round(start * rate);
  const length = Math.round((hold + release) * rate);
  const voices = kind === "lead" || kind === "pad" ? [-7, 0, 7] : [0];
  for (const [voice, cents] of voices.entries()) {
    const freq = hz(midi) * 2 ** (cents / 1200);
    let phase = voice * 0.7;
    for (let n = 0; n < length && begin + n < frames; n++) {
      const t = n / rate;
      // A fast upward pitch settlement gives each call a synthetic attack.
      const pitch = kind === "lead" ? 1 - 0.018 * Math.exp(-t / 0.013) : 1;
      phase += (2 * Math.PI * freq * pitch) / rate;
      const attack = kind === "pad" ? 0.065 : 0.007;
      const env =
        smooth(t / attack) * (t < hold ? 1 : 1 - smooth((t - hold) / release));
      let wave = 0;
      if (kind === "bell") {
        wave =
          Math.sin(phase + 0.65 * Math.exp(-t / 0.1) * Math.sin(2 * phase)) *
          Math.exp(-t / 0.17);
      } else if (kind === "bass") {
        wave =
          Math.sin(phase) +
          0.28 * Math.sin(2 * phase) +
          0.1 * Math.sin(3 * phase);
      } else {
        const brightness = kind === "pad" ? 1.5 : 2.2 + 4 * Math.exp(-t / 0.09);
        for (let h = 1; h <= 12; h++) {
          wave += (Math.exp(-(h - 1) / brightness) / h) * Math.sin(h * phase);
        }
        if (kind === "lead") wave += 0.12 * Math.sin(phase / 2);
      }
      const value = (wave * env * level) / voices.length;
      const spread = Math.max(
        -0.9,
        Math.min(0.9, pan + (voice - (voices.length - 1) / 2) * 0.23),
      );
      left[begin + n] += value * Math.sqrt((1 - spread) / 2);
      right[begin + n] += value * Math.sqrt((1 + spread) / 2);
    }
  }
}

// Six steady, clearly separated notes; the melody only rises at the finish.
for (let i = 0; i < 6; i++) {
  const start = 0.04 + i * 0.21;
  synth(72, start, 0.115, 0.19 + i * 0.008, -0.08);
  synth(60, start + 0.004, 0.115, 0.07, 0.15);
  synth(36, start, 0.1, 0.145, 0, "bass");
}
for (const [note, start, hold] of [
  [76, 1.3, 0.14],
  [79, 1.54, 0.14],
  [84, 1.78, 1.05],
]) {
  synth(note, start, hold, 0.25, -0.08);
  synth(note - 12, start + 0.004, hold, 0.075, 0.15);
}

// Stable C-major harmony keeps the repeated call unambiguous.
for (let i = 0; i < 6; i++) {
  for (const [j, note] of [48, 55, 64].entries()) {
    synth(note, 0.04 + i * 0.21, 0.105, 0.035, j % 2 ? 0.5 : -0.5, "pad");
  }
}
for (const start of [1.3, 1.54]) synth(36, start, 0.13, 0.16, 0, "bass");
synth(36, 1.78, 1.03, 0.21, 0, "bass");
for (const [i, note] of [48, 55, 60, 64, 67, 76].entries()) {
  synth(note, 1.78, 1.08, 0.06, i % 2 ? 0.6 : -0.6, "pad");
}

// Digital shimmer is reserved for the finish, leaving the opening rhythm clear.
for (const [i, note] of [84, 88, 91, 96].entries()) {
  synth(note, 1.78 + i * 0.09, 0.12, 0.048, i % 2 ? 0.55 : -0.55, "bell");
}

// Quiet room reflections; no noise, distortion, percussion or abrupt cuts.
const dryL = left.slice();
const dryR = right.slice();
for (const [delay, gain] of [
  [0.059, 0.11],
  [0.089, 0.09],
  [0.131, 0.07],
  [0.173, 0.05],
  [0.223, 0.035],
  [0.307, 0.022],
]) {
  const offset = Math.round(delay * rate);
  for (let i = offset; i < frames; i++) {
    left[i] += dryR[i - offset] * gain;
    right[i] += dryL[i - offset] * gain;
  }
}
let peak = 0;
for (let i = 0; i < frames; i++)
  peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
const scale = 10 ** (-3 / 20) / peak;
const wav = Buffer.alloc(44 + frames * 4);
wav.write("RIFF", 0);
wav.writeUInt32LE(wav.length - 8, 4);
wav.write("WAVE", 8);
wav.write("fmt ", 12);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(2, 22);
wav.writeUInt32LE(rate, 24);
wav.writeUInt32LE(rate * 4, 28);
wav.writeUInt16LE(4, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36);
wav.writeUInt32LE(frames * 4, 40);
let sum = 0;
for (let i = 0; i < frames; i++) {
  const l = left[i] * scale;
  const r = right[i] * scale;
  sum += l * l + r * r;
  wav.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
  wav.writeInt16LE(Math.round(r * 32767), 46 + i * 4);
}
const target = new URL(
  "../apps/web/public/audio/netgrid/results/game-won-fanfare.wav",
  import.meta.url,
);
writeFileSync(target, wav);
console.log(
  JSON.stringify({
    file: target.pathname,
    duration,
    sampleRate: rate,
    channels: 2,
    peakDbFS: -3,
    rmsDbFS: 20 * Math.log10(Math.sqrt(sum / (frames * 2))),
    bytes: wav.length,
  }),
);
