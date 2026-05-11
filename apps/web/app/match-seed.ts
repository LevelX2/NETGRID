export const LEGACY_DEFAULT_MATCH_SEED = "mvp-0.3-ai-demo";

export function createMatchSeed(options: { now?: number; randomPart?: string } = {}): string {
  const now = options.now ?? Date.now();
  const randomPart = options.randomPart ?? randomSeedPart();
  return `match-${now.toString(36)}-${randomPart}`;
}

export function normalizeMatchSeed(input: string | undefined): string {
  const trimmed = input?.trim() ?? "";
  if (!trimmed || trimmed === LEGACY_DEFAULT_MATCH_SEED) return createMatchSeed();
  return trimmed;
}

function randomSeedPart(): string {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.randomUUID === "function") return cryptoApi.randomUUID().slice(0, 8);
  if (typeof cryptoApi?.getRandomValues === "function") {
    const values = new Uint32Array(1);
    cryptoApi.getRandomValues(values);
    return (values[0] ?? 0).toString(36).padStart(6, "0").slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10).padEnd(8, "0");
}
