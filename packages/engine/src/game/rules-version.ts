import type { GameState } from "@netgrid/shared";

export function isV097OrLater(state: GameState): boolean {
  return isVersionAtLeast(state, 97);
}

export function isV099OrLater(state: GameState): boolean {
  return isVersionAtLeast(state, 99);
}

export function isVersionAtLeast(state: GameState, minorGate: number): boolean {
  const version = state.baseline.engineSchemaVersion
    .split(".")
    .map((part) => Number(part));
  const [major = 0, minor = 0, patch = 0] = version;
  if (major !== 0) return major > 0;
  if (minor !== minorGate) return minor > minorGate;
  return patch >= 0;
}
