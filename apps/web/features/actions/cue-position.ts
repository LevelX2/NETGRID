export type CuePositionPreset = "top-right" | "top-left" | "bottom-right" | "bottom-left" | "center";

export type CuePositionPreference =
  | { kind: "preset"; preset: CuePositionPreset }
  | { kind: "custom"; xPercent: number; yPercent: number };

export const DEFAULT_CUE_POSITION: CuePositionPreference = { kind: "preset", preset: "top-right" };

export function parseCuePositionPreference(raw: string | null): CuePositionPreference {
  if (!raw) return DEFAULT_CUE_POSITION;
  try {
    return normalizeCuePositionPreference(JSON.parse(raw));
  } catch {
    return DEFAULT_CUE_POSITION;
  }
}

export function normalizeCuePositionPreference(value: unknown): CuePositionPreference {
  if (!value || typeof value !== "object") return DEFAULT_CUE_POSITION;
  const candidate = value as { kind?: unknown; preset?: unknown; xPercent?: unknown; yPercent?: unknown };
  if (candidate.kind === "preset" && isCuePreset(candidate.preset)) return { kind: "preset", preset: candidate.preset };
  if (candidate.kind === "custom" && finitePercent(candidate.xPercent) && finitePercent(candidate.yPercent)) {
    return { kind: "custom", xPercent: candidate.xPercent, yPercent: candidate.yPercent };
  }
  return DEFAULT_CUE_POSITION;
}

export function serializeCuePositionPreference(position: CuePositionPreference): string {
  return JSON.stringify(position);
}

export function cuePositionClassName(position: CuePositionPreference): string {
  return position.kind === "preset" ? `cuePosition-${position.preset}` : "cuePosition-custom";
}

export function cuePositionStyle(position: CuePositionPreference): Record<string, string> {
  if (position.kind !== "custom") return {};
  return {
    left: `${position.xPercent}%`,
    top: `${position.yPercent}%`
  };
}

export function clampCuePosition(xPercent: number, yPercent: number, viewportWidth: number, viewportHeight: number, overlayWidth: number, overlayHeight: number): CuePositionPreference {
  const margin = 12;
  const safeWidth = Math.max(1, viewportWidth);
  const safeHeight = Math.max(1, viewportHeight);
  const maxLeft = Math.max(margin, safeWidth - overlayWidth - margin);
  const maxTop = Math.max(margin, safeHeight - overlayHeight - margin);
  const leftPx = clamp((xPercent / 100) * safeWidth, margin, maxLeft);
  const topPx = clamp((yPercent / 100) * safeHeight, margin, maxTop);
  return {
    kind: "custom",
    xPercent: roundPercent((leftPx / safeWidth) * 100),
    yPercent: roundPercent((topPx / safeHeight) * 100)
  };
}

function isCuePreset(value: unknown): value is CuePositionPreset {
  return value === "top-right" || value === "top-left" || value === "bottom-right" || value === "bottom-left" || value === "center";
}

function finitePercent(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}
