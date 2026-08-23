export const PREMIUM_AUDIO_CUE_KEYS = [
  "match-start",
  "runner-turn",
  "corp-turn",
  "run-start",
  "ice-rez",
  "access",
  "gain-tag",
  "agenda-runner",
  "agenda-corp",
  "damage-net",
  "damage-meat",
  "damage-core",
  "flatline",
  "game-won",
  "game-lost",
] as const;

export type PremiumAudioCueKey = (typeof PREMIUM_AUDIO_CUE_KEYS)[number];

export type PremiumAudioCueDefinition = {
  files: readonly [string, ...string[]];
  gain: number;
  cooldownMs: number;
  preload: boolean;
  category:
    | "match"
    | "turn"
    | "run"
    | "security"
    | "access"
    | "agenda"
    | "damage"
    | "result";
};

const ROOT = "/audio/netgrid";

export const PREMIUM_AUDIO_MANIFEST = {
  "match-start": {
    files: [`${ROOT}/match/match-start.wav`],
    gain: 0.78,
    cooldownMs: 3200,
    preload: true,
    category: "match",
  },
  "runner-turn": {
    files: [`${ROOT}/turns/runner-turn.wav`],
    gain: 0.58,
    cooldownMs: 500,
    preload: true,
    category: "turn",
  },
  "corp-turn": {
    files: [`${ROOT}/turns/corp-turn.wav`],
    gain: 0.62,
    cooldownMs: 500,
    preload: true,
    category: "turn",
  },
  "run-start": {
    files: [`${ROOT}/run/run-start.wav`],
    gain: 0.64,
    cooldownMs: 300,
    preload: true,
    category: "run",
  },
  "ice-rez": {
    files: [`${ROOT}/security/ice-rez.wav`],
    gain: 0.68,
    cooldownMs: 220,
    preload: true,
    category: "security",
  },
  access: {
    files: [`${ROOT}/access/access.wav`],
    gain: 0.5,
    cooldownMs: 120,
    preload: false,
    category: "access",
  },
  "gain-tag": {
    files: [`${ROOT}/security/gain-tag.wav`],
    gain: 0.62,
    cooldownMs: 180,
    preload: false,
    category: "security",
  },
  "agenda-runner": {
    files: [`${ROOT}/agenda/agenda-runner.wav`],
    gain: 0.7,
    cooldownMs: 700,
    preload: false,
    category: "agenda",
  },
  "agenda-corp": {
    files: [`${ROOT}/agenda/agenda-corp.wav`],
    gain: 0.72,
    cooldownMs: 700,
    preload: false,
    category: "agenda",
  },
  "damage-net": {
    files: [`${ROOT}/damage/damage-net.wav`],
    gain: 0.58,
    cooldownMs: 90,
    preload: true,
    category: "damage",
  },
  "damage-meat": {
    files: [`${ROOT}/damage/damage-meat.wav`],
    gain: 0.66,
    cooldownMs: 110,
    preload: true,
    category: "damage",
  },
  "damage-core": {
    files: [`${ROOT}/damage/damage-core.wav`],
    gain: 0.72,
    cooldownMs: 140,
    preload: true,
    category: "damage",
  },
  flatline: {
    files: [`${ROOT}/damage/flatline.wav`],
    gain: 0.8,
    cooldownMs: 1400,
    preload: true,
    category: "damage",
  },
  "game-won": {
    files: [`${ROOT}/results/game-won.wav`],
    gain: 0.76,
    cooldownMs: 1700,
    preload: true,
    category: "result",
  },
  "game-lost": {
    files: [`${ROOT}/results/game-lost.wav`],
    gain: 0.76,
    cooldownMs: 1700,
    preload: true,
    category: "result",
  },
} as const satisfies Record<PremiumAudioCueKey, PremiumAudioCueDefinition>;

export function isLocalPremiumAudioPath(path: string): boolean {
  return (
    path.startsWith(`${ROOT}/`) &&
    path.endsWith(".wav") &&
    !path.includes("..") &&
    !path.includes("://")
  );
}
