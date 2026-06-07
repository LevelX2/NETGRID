export type AiDecisionDebugRow = [string, string];

export function aiDecisionDebugHqHandRows(value: unknown): AiDecisionDebugRow[] {
  const hq = aiDecisionDebugRecord(value);
  if (!hq) return [];

  const knownCount = aiDecisionDebugFiniteNumber(hq.knownCount) ?? 0;
  const handCountValue = aiDecisionDebugFiniteNumber(hq.handCount);
  const handCount = handCountValue ?? "?";
  const summary = aiDecisionDebugRecord(hq.summary);
  const safeKnownCount = aiDecisionDebugFiniteNumber(summary?.safeKnownCount) ?? knownCount;
  const ambiguousCount = aiDecisionDebugFiniteNumber(summary?.ambiguousCount) ?? 0;
  const unknownCount =
    aiDecisionDebugFiniteNumber(summary?.unknownCount) ??
    (handCountValue !== undefined ? Math.max(0, handCountValue - knownCount) : 0);
  const knowledgeStatus =
    hq.allCardsKnown === true
      ? "vollständig"
      : knownCount <= 0 && safeKnownCount <= 0 && ambiguousCount <= 0
        ? "keine bekannt"
        : "teilweise";

  const rows: AiDecisionDebugRow[] = [];
  rows.push([
    "HQ-Hand-Wissen",
    summary
      ? `${safeKnownCount} sicher bekannt / ${ambiguousCount} unklar / ${unknownCount} unbekannt · ${knowledgeStatus}`
      : `${knownCount}/${handCount} Karten namentlich bekannt · ${knowledgeStatus}`,
  ]);

  const knownCards = aiDecisionDebugCardList(hq.safeKnownCards ?? hq.knownCards, 8);
  const contentParts = [
    knownCards,
    ambiguousCount > 0 ? `${ambiguousCount} unklar` : "",
    unknownCount > 0 ? `${unknownCount} unbekannt` : "",
  ].filter(Boolean);
  if (contentParts.length > 0) rows.push(["HQ-Hand-Inhalt", contentParts.join(" · ")]);

  const candidateSummary = aiDecisionDebugHqCandidateGroupList(hq.candidateGroups, 3);
  if (candidateSummary) rows.push(["HQ-Hand-Kandidaten", candidateSummary]);

  return rows;
}

function aiDecisionDebugHqCandidateGroupList(value: unknown, limit: number): string {
  const groups = aiDecisionDebugRecordList(value).slice(0, limit);
  if (groups.length === 0) return "";
  const labels = groups.map((group) => {
    const category =
      typeof group.category === "string"
        ? aiDecisionDebugHqCandidateCategoryLabel(group.category)
        : "Hidden-Install";
    const ambiguousCount = aiDecisionDebugFiniteNumber(group.ambiguousCount) ?? 0;
    const unknownCandidateCount = aiDecisionDebugFiniteNumber(group.unknownCandidateCount) ?? 0;
    const departureCount = aiDecisionDebugFiniteNumber(group.departureCount) ?? 0;
    const server = typeof group.serverId === "string" ? aiDecisionDebugServerLabel(group.serverId) : "";
    return [
      server ? `${server}: ${category}` : category,
      ambiguousCount > 0 ? `${ambiguousCount} unklar` : "",
      unknownCandidateCount > 0 ? `${unknownCandidateCount} unbekannte Kandidaten` : "",
      departureCount > 0 ? `${departureCount} abgegangen` : "",
    ].filter(Boolean).join(" · ");
  });
  const remainder = aiDecisionDebugRecordList(value).length - groups.length;
  return remainder > 0 ? `${labels.join(" · ")} · +${remainder}` : labels.join(" · ");
}

function aiDecisionDebugHqCandidateCategoryLabel(value: string): string {
  const labels: Record<string, string> = {
    hidden_ice_install: "ICE-Install-Kandidaten",
    hidden_root_install: "Root-Install-Kandidaten",
    hidden_install: "Install-Kandidaten",
    hidden_install_uncertain: "unsichere Install-Kandidaten",
  };
  return labels[value] ?? value;
}

function aiDecisionDebugServerLabel(value: string): string {
  if (value === "hq") return "HQ";
  if (value === "rd") return "R&D";
  if (value === "archives") return "Archive";
  if (value.startsWith("remote_")) return `Remote ${value.slice("remote_".length)}`;
  return value;
}

function aiDecisionDebugCardList(value: unknown, limit: number): string {
  const entries = aiDecisionDebugRecordList(value).slice(0, limit);
  if (entries.length === 0) return "";
  const labels = entries.map((entry) => {
    const label = aiDecisionDebugCardLabel(entry) || "?";
    const count = typeof entry.count === "number" && entry.count > 1 ? ` x${entry.count}` : "";
    const type = typeof entry.type === "string" ? ` (${entry.type})` : "";
    return `${label}${count}${type}`;
  });
  const remainder = aiDecisionDebugRecordList(value).length - entries.length;
  return remainder > 0 ? `${labels.join(", ")} +${remainder}` : labels.join(", ");
}

function aiDecisionDebugCardLabel(entry: Record<string, unknown> | undefined): string {
  if (!entry) return "";
  return typeof entry.title === "string"
    ? entry.title
    : typeof entry.definitionId === "string"
      ? entry.definitionId
      : "";
}

function aiDecisionDebugRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function aiDecisionDebugRecordList(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === "object" && !Array.isArray(entry)));
}

function aiDecisionDebugFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
