export type EvidenceCarrier = {
  evidence: readonly string[];
};

export function hasEvidenceFlag(
  entry: EvidenceCarrier,
  flag: string,
): boolean {
  const evidence = new Set(entry.evidence);
  return evidence.has(flag);
}

export function evidenceValue(
  entry: EvidenceCarrier,
  prefix: string,
): string | undefined {
  return entry.evidence
    .find((item) => item.startsWith(prefix))
    ?.slice(prefix.length);
}

export function evidenceNumber(entry: EvidenceCarrier, prefix: string): number {
  const parsed = Number(evidenceValue(entry, prefix));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function hasEvidencePrefix(
  entry: EvidenceCarrier,
  prefix: string,
): boolean {
  return entry.evidence.some((item) => item.startsWith(prefix));
}
