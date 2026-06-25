export type AiDecisionDebugRow = [string, string];

export type AiDecisionDebugDeckStrategySummary = {
  rows: AiDecisionDebugRow[];
  primaryStrategies: string[];
  secondaryStrategies: string[];
  blockers: string[];
  warnings: string[];
};

export function aiDecisionDebugDeckStrategySummary(
  detail: unknown,
): AiDecisionDebugDeckStrategySummary {
  const record = aiDecisionDebugRecord(detail);
  const items = record
    ? aiDecisionDebugDetailSectionItems(record, "strategic_runtime", 96)
    : [];
  const rows: AiDecisionDebugRow[] = [];
  const primaryStrategies = aiDecisionDebugTagValues(
    items,
    "deck_strategy_primary",
  ).map(aiDecisionDebugStrategyLineLabel);
  const secondaryStrategies = aiDecisionDebugTagValues(
    items,
    "deck_strategy_secondary",
  ).map(aiDecisionDebugStrategyLineLabel);
  const blockers = aiDecisionDebugTagValues(
    items,
    "strategic_intent_blocker",
  ).map(aiDecisionDebugStrategicBlockerLabel);
  const warnings = aiDecisionDebugTagValues(items, "deck_strategy_warning").map(
    aiDecisionDebugReadableId,
  );

  const profile = aiDecisionDebugTagValue(items, "deck_strategy_profile");
  const side = aiDecisionDebugTagValue(items, "deck_strategy_side");
  const cardCount = aiDecisionDebugTagValue(items, "deck_strategy_card_count");
  const primaryCount = aiDecisionDebugTagValue(
    items,
    "deck_strategy_primary_count",
  );
  const secondaryCount = aiDecisionDebugTagValue(
    items,
    "deck_strategy_secondary_count",
  );

  if (profile) {
    rows.push([
      "Deckprofil",
      profile === "missing" ? "nicht verfügbar" : "KI-internes Strategieprofil",
    ]);
  }
  if (side || cardCount) {
    rows.push([
      "Deckbasis",
      [
        side === "runner" ? "Runner" : side === "corp" ? "Korp" : undefined,
        cardCount ? `${cardCount} Karten` : undefined,
      ]
        .filter(Boolean)
        .join(" · "),
    ]);
  }
  if (primaryStrategies.length > 0) {
    rows.push(["Primäre Strategie", primaryStrategies.join(" · ")]);
  } else if (primaryCount === "0") {
    rows.push([
      "Primäre Strategie",
      "neutral / keine produktive Primärstrategie",
    ]);
  }
  if (secondaryStrategies.length > 0) {
    rows.push(["Sekundäre Strategien", secondaryStrategies.join(" · ")]);
  } else if (secondaryCount === "0") {
    rows.push(["Sekundäre Strategien", "keine"]);
  }

  const currentStrategy = aiDecisionDebugTagValue(
    items,
    "strategic_intent_state",
  );
  if (currentStrategy) {
    rows.push([
      "Aktuelle Linie",
      `${aiDecisionDebugStrategyLabel(currentStrategy)} (${currentStrategy})`,
    ]);
  }
  const family = aiDecisionDebugTagValue(items, "strategic_intent_family");
  if (family)
    rows.push(["Strategiefamilie", aiDecisionDebugFamilyLabel(family)]);
  const phase = aiDecisionDebugTagValue(items, "strategic_intent_phase");
  if (phase) rows.push(["Phase", aiDecisionDebugPhaseLabel(phase)]);
  const target = aiDecisionDebugTagValue(items, "strategic_intent_target");
  const targetId = aiDecisionDebugTagValue(items, "strategic_intent_target_id");
  if (target || targetId) {
    rows.push(["Ziel", aiDecisionDebugTargetLabel(target, targetId)]);
  }
  const reserve = aiDecisionDebugTagValue(items, "strategic_intent_reserve");
  if (reserve) rows.push(["Reserve", aiDecisionDebugReserveLabel(reserve)]);
  const transition = aiDecisionDebugTagValue(
    items,
    "strategic_intent_transition",
  );
  if (transition)
    rows.push(["Fortschreibung", aiDecisionDebugTransitionLabel(transition)]);
  const completeness = aiDecisionDebugTagValue(
    items,
    "strategic_intent_completeness",
  );
  if (completeness)
    rows.push([
      "Vollständigkeit",
      aiDecisionDebugCompletenessLabel(completeness),
    ]);
  if (blockers.length === 0) {
    const blockerCount = aiDecisionDebugTagValue(
      items,
      "strategic_intent_blocker_count",
    );
    if (blockerCount && blockerCount !== "0") {
      rows.push(["Blocker", blockerCount]);
    }
  }

  return { rows, primaryStrategies, secondaryStrategies, blockers, warnings };
}

export function aiDecisionDebugHqHandRows(
  value: unknown,
): AiDecisionDebugRow[] {
  const hq = aiDecisionDebugRecord(value);
  if (!hq) return [];

  const knownCount = aiDecisionDebugFiniteNumber(hq.knownCount) ?? 0;
  const handCountValue = aiDecisionDebugFiniteNumber(hq.handCount);
  const handCount = handCountValue ?? "?";
  const summary = aiDecisionDebugRecord(hq.summary);
  const safeKnownCount =
    aiDecisionDebugFiniteNumber(summary?.safeKnownCount) ?? knownCount;
  const ambiguousCount =
    aiDecisionDebugFiniteNumber(summary?.ambiguousCount) ?? 0;
  const unknownCount =
    aiDecisionDebugFiniteNumber(summary?.unknownCount) ??
    (handCountValue !== undefined
      ? Math.max(0, handCountValue - knownCount)
      : 0);
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

  const knownCards = aiDecisionDebugCardList(
    hq.safeKnownCards ?? hq.knownCards,
    8,
  );
  const contentParts = [
    knownCards,
    ambiguousCount > 0 ? `${ambiguousCount} unklar` : "",
    unknownCount > 0 ? `${unknownCount} unbekannt` : "",
  ].filter(Boolean);
  if (contentParts.length > 0)
    rows.push(["HQ-Hand-Inhalt", contentParts.join(" · ")]);

  const candidateSummary = aiDecisionDebugHqCandidateGroupList(
    hq.candidateGroups,
    3,
  );
  if (candidateSummary) rows.push(["HQ-Hand-Kandidaten", candidateSummary]);

  return rows;
}

function aiDecisionDebugHqCandidateGroupList(
  value: unknown,
  limit: number,
): string {
  const groups = aiDecisionDebugRecordList(value).slice(0, limit);
  if (groups.length === 0) return "";
  const labels = groups.map((group) => {
    const category =
      typeof group.category === "string"
        ? aiDecisionDebugHqCandidateCategoryLabel(group.category)
        : "Hidden-Install";
    const ambiguousCount =
      aiDecisionDebugFiniteNumber(group.ambiguousCount) ?? 0;
    const unknownCandidateCount =
      aiDecisionDebugFiniteNumber(group.unknownCandidateCount) ?? 0;
    const departureCount =
      aiDecisionDebugFiniteNumber(group.departureCount) ?? 0;
    const server =
      typeof group.serverId === "string"
        ? aiDecisionDebugServerLabel(group.serverId)
        : "";
    return [
      server ? `${server}: ${category}` : category,
      ambiguousCount > 0 ? `${ambiguousCount} unklar` : "",
      unknownCandidateCount > 0
        ? `${unknownCandidateCount} unbekannte Kandidaten`
        : "",
      departureCount > 0 ? `${departureCount} abgegangen` : "",
    ]
      .filter(Boolean)
      .join(" · ");
  });
  const remainder = aiDecisionDebugRecordList(value).length - groups.length;
  return remainder > 0
    ? `${labels.join(" · ")} · +${remainder}`
    : labels.join(" · ");
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
  if (value.startsWith("remote_"))
    return `Remote ${value.slice("remote_".length)}`;
  return value;
}

function aiDecisionDebugDetailSectionItems(
  detail: Record<string, unknown>,
  sectionId: string,
  limit: number,
): string[] {
  const section = aiDecisionDebugRecordList(detail.detailSections).find(
    (entry) => entry.id === sectionId,
  );
  const items = Array.isArray(section?.items) ? section.items : [];
  return items
    .filter((entry): entry is string => typeof entry === "string")
    .slice(0, limit);
}

function aiDecisionDebugTagValue(
  items: string[],
  key: string,
): string | undefined {
  return aiDecisionDebugTagValues(items, key)[0];
}

function aiDecisionDebugTagValues(items: string[], key: string): string[] {
  const prefix = `${key}:`;
  return items
    .filter((item) => item.startsWith(prefix))
    .map((item) => item.slice(prefix.length))
    .filter(Boolean);
}

function aiDecisionDebugStrategyLineLabel(value: string): string {
  const [strategyId = "unknown", score, confidence, status] = value.split(":");
  const scoreNumber = Number(score);
  return [
    `${aiDecisionDebugStrategyLabel(strategyId)} (${strategyId})`,
    Number.isFinite(scoreNumber) ? `Score ${scoreNumber}` : undefined,
    confidence ? aiDecisionDebugConfidenceLabel(confidence) : undefined,
    status ? aiDecisionDebugRuntimeStatusLabel(status) : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
}

function aiDecisionDebugStrategyLabel(value: string): string {
  const labels: Record<string, string> = {
    "runner.rig_first": "Rig aufbauen",
    "runner.economy_first": "Wirtschaft stabilisieren",
    "runner.search.breaker": "Breaker suchen",
    "runner.rnd_pressure": "R&D-Druck",
    "runner.hq_pressure": "HQ-Druck",
    "runner.interface_closeout": "Interface-Abschluss",
    "runner.remote_contest": "Remote contesten",
    "runner.remote_trash": "Remote trashen",
    "runner.survival_defense": "Überleben absichern",
    "runner.run_event_tempo": "Run-Event-Tempo",
    "corp.remote_scoring": "Remote-Scoring",
    "corp.rush_score": "Rush-Score",
    "corp.fast_advance": "Fast Advance",
    "corp.ice_tax_glacier": "ICE-Tax / Glacier",
    "corp.central_stabilize": "Zentralserver stabilisieren",
    "corp.asset_economy": "Asset-Wirtschaft",
    "corp.tag_trace_punish": "Tag-/Trace-Punish",
    "corp.damage_kill": "Damage-Kill",
    "corp.ambush_bluff": "Ambush-Bluff",
    "corp.economy_rez_reserve": "Rez-Reserve aufbauen",
    "runner.neutral": "Neutrale Runner-Linie",
    "corp.neutral": "Neutrale Korp-Linie",
  };
  return labels[value] ?? aiDecisionDebugReadableId(value);
}

function aiDecisionDebugFamilyLabel(value: string): string {
  const labels: Record<string, string> = {
    runner_setup: "Runner-Setup",
    runner_central_pressure: "Runner-Zentraldruck",
    runner_remote_contest: "Runner-Remote-Contest",
    runner_remote_trash: "Runner-Remote-Trash",
    runner_survival: "Runner-Überleben",
    runner_tempo: "Runner-Tempo",
    corp_scoreline: "Korp-Scoreline",
    corp_fast_advance: "Korp-Fast-Advance",
    corp_ice_tax: "Korp-ICE-Tax",
    corp_central_defense: "Korp-Zentralverteidigung",
    corp_asset_economy: "Korp-Asset-Wirtschaft",
    corp_tag_trace_punish: "Korp-Tag-/Trace-Punish",
    corp_damage_kill: "Korp-Damage-Kill",
    corp_ambush: "Korp-Ambush",
    corp_economy_reserve: "Korp-Reserve",
    neutral: "neutral",
  };
  return labels[value] ?? aiDecisionDebugReadableId(value);
}

function aiDecisionDebugPhaseLabel(value: string): string {
  const labels: Record<string, string> = {
    setup: "Setup",
    economy: "Wirtschaft",
    pressure: "Druck",
    contest: "Contest",
    score: "Score",
    defense: "Verteidigung",
    recovery: "Erholung",
    neutral: "neutral",
  };
  return labels[value] ?? aiDecisionDebugReadableId(value);
}

function aiDecisionDebugTargetLabel(
  target: string | undefined,
  targetId: string | undefined,
): string {
  const kindLabels: Record<string, string> = {
    central: "Zentralserver",
    remote: "Remote",
    economy: "Wirtschaft",
    setup: "Setup",
    score: "Score",
    defense: "Verteidigung",
    none: "kein konkretes Ziel",
  };
  const kind = target
    ? (kindLabels[target] ?? aiDecisionDebugReadableId(target))
    : "";
  const id = targetId ? aiDecisionDebugServerLabel(targetId) : "";
  return [kind, id].filter(Boolean).join(" · ") || "-";
}

function aiDecisionDebugReserveLabel(value: string): string {
  const [kind = "", required = "", available = "", satisfied = ""] =
    value.split(":");
  if (kind === "none") return "keine";
  const kindLabel =
    kind === "credits"
      ? "Credits"
      : kind === "clicks"
        ? "Klicks"
        : aiDecisionDebugReadableId(kind);
  const availability =
    available && available !== "unknown"
      ? `${available} verfügbar`
      : "Verfügbarkeit unbekannt";
  const status =
    satisfied === "true"
      ? "erfüllt"
      : satisfied === "false"
        ? "nicht erfüllt"
        : "";
  return [`${required || "?"} ${kindLabel} benötigt`, availability, status]
    .filter(Boolean)
    .join(" · ");
}

function aiDecisionDebugTransitionLabel(value: string): string {
  const labels: Record<string, string> = {
    selected: "neu gewählt",
    continued: "fortgesetzt",
    paused: "pausiert",
    switched: "gewechselt",
    abandoned: "verworfen",
  };
  return labels[value] ?? aiDecisionDebugReadableId(value);
}

function aiDecisionDebugCompletenessLabel(value: string): string {
  const labels: Record<string, string> = {
    complete: "vollständig",
    partial: "teilweise",
    blocked: "blockiert",
    absent: "nicht vorhanden",
    unknown: "unbekannt",
  };
  return labels[value] ?? aiDecisionDebugReadableId(value);
}

function aiDecisionDebugConfidenceLabel(value: string): string {
  const labels: Record<string, string> = {
    low: "niedrige Sicherheit",
    medium: "mittlere Sicherheit",
    high: "hohe Sicherheit",
  };
  return labels[value] ?? aiDecisionDebugReadableId(value);
}

function aiDecisionDebugRuntimeStatusLabel(value: string): string {
  const labels: Record<string, string> = {
    productive: "produktiv nutzbar",
    supporting: "unterstützend",
    blocked: "blockiert",
    diagnostic_only: "nur Diagnose",
  };
  return labels[value] ?? aiDecisionDebugReadableId(value);
}

function aiDecisionDebugStrategicBlockerLabel(value: string): string {
  const [reason = value, severity] = value.split(":");
  const reasonLabels: Record<string, string> = {
    no_strategy_anchor: "kein Strategieanker",
    support_gap: "Support-Lücke",
    missing_role: "Rolle fehlt",
    reserve_shortfall: "Reserve fehlt",
    temporarily_unavailable: "temporär nicht verfügbar",
    unknown_state: "unklarer Zustand",
  };
  const severityLabel =
    severity === "hard" ? "hart" : severity === "soft" ? "weich" : severity;
  return [
    reasonLabels[reason] ?? aiDecisionDebugReadableId(reason),
    severityLabel,
  ]
    .filter(Boolean)
    .join(" · ");
}

function aiDecisionDebugReadableId(value: string): string {
  return value
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function aiDecisionDebugCardList(value: unknown, limit: number): string {
  const entries = aiDecisionDebugRecordList(value).slice(0, limit);
  if (entries.length === 0) return "";
  const labels = entries.map((entry) => {
    const label = aiDecisionDebugCardLabel(entry) || "?";
    const count =
      typeof entry.count === "number" && entry.count > 1
        ? ` x${entry.count}`
        : "";
    const type = typeof entry.type === "string" ? ` (${entry.type})` : "";
    return `${label}${count}${type}`;
  });
  const remainder = aiDecisionDebugRecordList(value).length - entries.length;
  return remainder > 0
    ? `${labels.join(", ")} +${remainder}`
    : labels.join(", ");
}

function aiDecisionDebugCardLabel(
  entry: Record<string, unknown> | undefined,
): string {
  if (!entry) return "";
  return typeof entry.title === "string"
    ? entry.title
    : typeof entry.definitionId === "string"
      ? entry.definitionId
      : "";
}

function aiDecisionDebugRecord(
  value: unknown,
): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function aiDecisionDebugRecordList(
  value: unknown,
): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is Record<string, unknown> =>
    Boolean(entry && typeof entry === "object" && !Array.isArray(entry)),
  );
}

function aiDecisionDebugFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}
