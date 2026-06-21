import type { VisibleCard } from "@netgrid/shared";

export type RemoteAccessFingerprintCard = Pick<
  VisibleCard,
  "advancementCounters" | "counters" | "definitionId" | "instanceId" | "known" | "rezzed"
>;

export function remoteAccessFingerprint(params: {
  serverId: string;
  root: readonly RemoteAccessFingerprintCard[];
}): string {
  const rootEntries = params.root.map((card, index) =>
    [
      `pos:${index}`,
      `instance:${card.instanceId ?? "unknown"}`,
      `definition:${card.definitionId ?? "unknown"}`,
      `known:${card.known === true}`,
      `rezzed:${card.rezzed === true}`,
      `adv:${card.advancementCounters ?? 0}`,
      `counters:${counterFingerprint(card.counters)}`,
    ].join("|"),
  );
  return [
    `server:${params.serverId}`,
    `root_count:${params.root.length}`,
    ...rootEntries,
  ].join(";");
}

export function remoteAccessFingerprintChanged(params: {
  previousFingerprint: string;
  currentFingerprint: string;
}): boolean {
  return params.previousFingerprint !== params.currentFingerprint;
}

function counterFingerprint(
  counters: VisibleCard["counters"] | undefined,
): string {
  if (!counters) return "none";
  return Object.entries(counters)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${value}`)
    .join(",");
}

