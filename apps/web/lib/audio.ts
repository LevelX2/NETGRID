import type { ApiGameResultSummary } from "@netgrid/shared";

import type { ActionSoundKind } from "../app/action-cues";

type GameResultSummary = ApiGameResultSummary;

let sharedAudioContext: AudioContext | null = null;

export function seriesAudioOutcome(result: GameResultSummary): GameResultSummary["viewerOutcome"] {
  if (result.series?.status !== "finished") return result.viewerOutcome;
  return result.series.viewerSeriesOutcome;
}

export function primeAudio(volume: number): void {
  playActionCueSound("choice", volume);
}

function audioContext(): AudioContext | null {
  const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!sharedAudioContext || sharedAudioContext.state === "closed") sharedAudioContext = new AudioCtor();
  if (sharedAudioContext.state === "suspended") void sharedAudioContext.resume().catch(() => undefined);
  return sharedAudioContext;
}

export function playResultSound(outcome: GameResultSummary["viewerOutcome"], volume: number): void {
  const context = audioContext();
  if (!context) return;
  const safeVolume = Math.min(1, Math.max(0, volume));
  const notes =
    outcome === "won"
      ? [523.25, 659.25, 783.99]
      : outcome === "lost"
        ? [392, 329.63, 261.63]
        : [440, 493.88, 440];
  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + index * 0.11;
    oscillator.type = outcome === "lost" ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, safeVolume * 0.12), start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.17);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.19);
  });
}

export function playActionCueSound(kind: ActionSoundKind, volume: number, repeatCount = 1): void {
  const context = audioContext();
  if (!context) return;
  const safeVolume = Math.min(1, Math.max(0, volume));
  if (kind === "draw") {
    playCardDrawSnap(context, safeVolume, repeatCount);
    return;
  }
  const pattern = actionSoundPattern(kind);
  pattern.forEach((note, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + index * 0.075;
    oscillator.type = note.type;
    oscillator.frequency.setValueAtTime(note.frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, safeVolume * note.gain), start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + note.duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + note.duration + 0.02);
  });
}

function playCardDrawSnap(context: AudioContext, volume: number, repeatCount: number): void {
  const safeCount = Math.min(5, Math.max(1, Math.floor(repeatCount)));
  for (let index = 0; index < safeCount; index += 1) {
    const start = context.currentTime + index * 0.085;
    const noiseBuffer = context.createBuffer(1, Math.max(1, Math.floor(context.sampleRate * 0.035)), context.sampleRate);
    const samples = noiseBuffer.getChannelData(0);
    for (let i = 0; i < samples.length; i += 1) {
      const decay = 1 - i / samples.length;
      samples[i] = (Math.random() * 2 - 1) * decay;
    }
    const noise = context.createBufferSource();
    const noiseGain = context.createGain();
    const highpass = context.createBiquadFilter();
    noise.buffer = noiseBuffer;
    highpass.type = "highpass";
    highpass.frequency.setValueAtTime(1800, start);
    noiseGain.gain.setValueAtTime(Math.max(0.0001, volume * 0.14), start);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.045);
    noise.connect(highpass);
    highpass.connect(noiseGain);
    noiseGain.connect(context.destination);
    noise.start(start);
    noise.stop(start + 0.05);

    const click = context.createOscillator();
    const clickGain = context.createGain();
    click.type = "square";
    click.frequency.setValueAtTime(1220, start);
    click.frequency.exponentialRampToValueAtTime(520, start + 0.035);
    clickGain.gain.setValueAtTime(0.0001, start);
    clickGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * 0.07), start + 0.004);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.04);
    click.connect(clickGain);
    clickGain.connect(context.destination);
    click.start(start);
    click.stop(start + 0.055);
  }
}

function actionSoundPattern(kind: ActionSoundKind): Array<{ frequency: number; duration: number; gain: number; type: OscillatorType }> {
  switch (kind) {
    case "draw":
      return [{ frequency: 660, duration: 0.11, gain: 0.07, type: "sine" }];
    case "credit":
      return [
        { frequency: 988, duration: 0.035, gain: 0.055, type: "triangle" },
        { frequency: 1480, duration: 0.05, gain: 0.035, type: "triangle" }
      ];
    case "install_hidden":
      return [{ frequency: 185, duration: 0.12, gain: 0.05, type: "triangle" }];
    case "install_known":
      return [
        { frequency: 262, duration: 0.05, gain: 0.045, type: "triangle" },
        { frequency: 392, duration: 0.08, gain: 0.04, type: "triangle" }
      ];
    case "play":
      return [
        { frequency: 440, duration: 0.09, gain: 0.06, type: "sine" },
        { frequency: 554, duration: 0.1, gain: 0.05, type: "sine" }
      ];
    case "rez":
      return [
        { frequency: 110, duration: 0.08, gain: 0.055, type: "sawtooth" },
        { frequency: 330, duration: 0.14, gain: 0.04, type: "triangle" }
      ];
    case "run":
      return [
        { frequency: 294, duration: 0.045, gain: 0.05, type: "triangle" },
        { frequency: 587, duration: 0.065, gain: 0.035, type: "square" }
      ];
    case "access":
      return [{ frequency: 740, duration: 0.11, gain: 0.055, type: "triangle" }];
    case "agenda":
      return [
        { frequency: 523, duration: 0.1, gain: 0.07, type: "sine" },
        { frequency: 784, duration: 0.14, gain: 0.06, type: "sine" }
      ];
    case "trash":
      return [
        { frequency: 196, duration: 0.055, gain: 0.055, type: "sawtooth" },
        { frequency: 98, duration: 0.12, gain: 0.035, type: "triangle" }
      ];
    case "tag_or_damage":
      return [
        { frequency: 247, duration: 0.08, gain: 0.08, type: "square" },
        { frequency: 220, duration: 0.1, gain: 0.06, type: "square" }
      ];
    case "choice":
      return [{ frequency: 660, duration: 0.075, gain: 0.045, type: "triangle" }];
    case "game_end":
      return [
        { frequency: 523, duration: 0.1, gain: 0.07, type: "sine" },
        { frequency: 659, duration: 0.1, gain: 0.06, type: "sine" }
      ];
    case "runner_turn":
      return [
        { frequency: 392, duration: 0.13, gain: 0.1, type: "triangle" },
        { frequency: 523, duration: 0.14, gain: 0.09, type: "sine" },
        { frequency: 659, duration: 0.15, gain: 0.09, type: "sine" },
        { frequency: 880, duration: 0.17, gain: 0.085, type: "triangle" },
        { frequency: 1175, duration: 0.22, gain: 0.075, type: "sine" },
        { frequency: 1568, duration: 0.19, gain: 0.045, type: "sine" }
      ];
    case "corp_turn":
      return [
        { frequency: 262, duration: 0.14, gain: 0.11, type: "sawtooth" },
        { frequency: 196, duration: 0.16, gain: 0.1, type: "square" },
        { frequency: 147, duration: 0.18, gain: 0.095, type: "sawtooth" },
        { frequency: 98, duration: 0.23, gain: 0.085, type: "triangle" },
        { frequency: 131, duration: 0.17, gain: 0.075, type: "square" },
        { frequency: 87, duration: 0.24, gain: 0.065, type: "triangle" }
      ];
    case "turn":
    default:
      return [{ frequency: 247, duration: 0.09, gain: 0.04, type: "triangle" }];
  }
}
