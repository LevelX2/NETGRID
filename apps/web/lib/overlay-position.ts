export type OverlayPositionPreference = { kind: "default" } | { kind: "custom"; xPercent: number; yPercent: number };

export function parseOverlayPositionPreference(raw: string | null): OverlayPositionPreference {
  if (!raw) return { kind: "default" };
  try {
    return normalizeOverlayPositionPreference(JSON.parse(raw));
  } catch {
    return { kind: "default" };
  }
}

export function normalizeOverlayPositionPreference(value: unknown): OverlayPositionPreference {
  if (!value || typeof value !== "object") return { kind: "default" };
  const candidate = value as { kind?: unknown; xPercent?: unknown; yPercent?: unknown };
  if (candidate.kind !== "custom" || !finiteOverlayPercent(candidate.xPercent) || !finiteOverlayPercent(candidate.yPercent)) {
    return { kind: "default" };
  }
  return { kind: "custom", xPercent: candidate.xPercent, yPercent: candidate.yPercent };
}

export function serializeOverlayPositionPreference(position: OverlayPositionPreference): string {
  return JSON.stringify(position);
}

export function clampOverlayPosition(
  xPercent: number,
  yPercent: number,
  viewportWidth: number,
  viewportHeight: number,
  overlayWidth: number,
  overlayHeight: number
): OverlayPositionPreference {
  const margin = 8;
  const safeWidth = Math.max(1, viewportWidth);
  const safeHeight = Math.max(1, viewportHeight);
  const maxLeft = Math.max(margin, safeWidth - overlayWidth - margin);
  const maxTop = Math.max(margin, safeHeight - overlayHeight - margin);
  const leftPx = clampOverlayValue((xPercent / 100) * safeWidth, margin, maxLeft);
  const topPx = clampOverlayValue((yPercent / 100) * safeHeight, margin, maxTop);
  return {
    kind: "custom",
    xPercent: roundOverlayPercent((leftPx / safeWidth) * 100),
    yPercent: roundOverlayPercent((topPx / safeHeight) * 100)
  };
}

function finiteOverlayPercent(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

function clampOverlayValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function roundOverlayPercent(value: number): number {
  return Math.round(value * 100) / 100;
}
