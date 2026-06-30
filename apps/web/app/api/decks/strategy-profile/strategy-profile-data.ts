import type {
  AiDeckStrategyProfile,
  DeckStrategyEvidence,
  RunnerStrategicIntentProfile,
} from "@netgrid/ai";
import {
  buildDeckCapabilityProfile,
  buildDeckStrategyProfile,
  buildRunnerStrategicIntentProfile,
} from "@netgrid/ai";
import type { DeckSnapshot, DeckValidationResult, EditableDeck } from "@netgrid/decks";
import { assertDeckPayloadSafe } from "@netgrid/decks";
import type { Side } from "@netgrid/shared";
import strategyGoalsData from "../../../../../../data/ai/strategy-goals-v1.json";
import { createRuntimeCardsById } from "../../card-pool-runtime";
import { deckValidationResponse } from "../deck-data";
import {
  formatDeckStrategyValue,
  formatRunnerStrategicIntentValue,
  formatStrategyLabel,
  type DeckStrategyProfileAnchorEvidence,
  type DeckStrategyProfileEntry,
  type DeckStrategyProfileEvidenceGroup,
  type DeckStrategyProfileGap,
  type DeckStrategyProfileRunnerStrategicIntentViewer,
  type DeckStrategyProfileSection,
  type DeckStrategyProfileStrategyRow,
  type DeckStrategyProfileStrategyStatus,
  type DeckStrategyProfileSupportEvidence,
  type DeckStrategyProfileTone,
  type DeckStrategyProfileUnavailableDeckInfo,
  type DeckStrategyProfileViewer,
  type DeckStrategyProfileViewerResponse,
} from "../../../deck-strategy-profile-ui";

type StrategyGoal = {
  strategyId: string;
  side: Side;
  description?: string;
};

type DeckValidationResponseBody = {
  validation: DeckValidationResult;
  snapshot: DeckSnapshot | null;
  error?: { message: string };
};

const RESPONSE_SCHEMA_VERSION = "ai007-deck-strategy-viewer-response-v1" as const;
const VIEWER_SCHEMA_VERSION = "ai007-deck-strategy-viewer-v1" as const;
const STRATEGY_GOALS_BY_ID = new Map(
  (strategyGoalsData.strategyGoals as StrategyGoal[]).map((goal) => [
    goal.strategyId,
    goal,
  ]),
);
const CARDS_BY_ID = createRuntimeCardsById();

export function deckStrategyProfileViewerResponse(
  deckPayload: unknown,
): DeckStrategyProfileViewerResponse {
  const deckInfo = deckInfoFromUnknown(deckPayload);
  if (!isEditableDeckLike(deckPayload)) {
    return unavailableResponse("Deckprofil konnte nicht berechnet werden", deckInfo);
  }
  if (deckPayload.cards.length === 0) {
    return unavailableResponse("Deck enthält keine Karten", deckInfo);
  }

  const validationResponse = deckValidationResponse(deckPayload);
  if (validationResponse.status !== 200) {
    return unavailableResponse("Deckprofil konnte nicht berechnet werden", deckInfo);
  }
  const body = validationResponse.body as DeckValidationResponseBody;
  if (body.error) {
    return unavailableResponse(body.error.message, deckInfo);
  }
  if (!body.validation.ok || !body.snapshot) {
    return unavailableResponse(
      deckValidationUnavailableReason(body.validation),
      deckInfoFromDeck(deckPayload, body.validation.totalCards),
    );
  }

  try {
    const profile = buildDeckStrategyProfile({
      deckSnapshotId: body.snapshot.deckSnapshotId,
      side: body.snapshot.side,
      formatProfileId: body.snapshot.formatProfileId,
      publicMetadata: body.snapshot.publicMetadata,
      cards: body.snapshot.cards.map((entry) => ({
        cardId: entry.cardId,
        quantity: entry.quantity,
      })),
    });
    const runnerStrategicIntent = profile.side === "runner"
      ? buildRunnerStrategicIntentViewer(
          buildRunnerStrategicIntentProfile({
            strategyProfile: profile,
            deckCapabilities: buildDeckCapabilityProfile({
              side: body.snapshot.side,
              deckSnapshot: {
                deckSnapshotId: body.snapshot.deckSnapshotId,
                side: body.snapshot.side,
                formatProfileId: body.snapshot.formatProfileId,
                publicMetadata: body.snapshot.publicMetadata,
                cards: body.snapshot.cards.map((entry) => ({
                  cardId: entry.cardId,
                  quantity: entry.quantity,
                })),
              },
            }),
          }),
        )
      : undefined;
    const viewer = buildDeckStrategyProfileViewer(
      profile,
      body.snapshot,
      deckPayload,
      runnerStrategicIntent,
    );
    const response: DeckStrategyProfileViewerResponse = {
      schemaVersion: RESPONSE_SCHEMA_VERSION,
      taskId: "AI007",
      status: "available",
      viewer,
    };
    const safety = assertDeckPayloadSafe(response);
    if (!safety.ok) return unavailableResponse("Deckprofil wurde sicherheitshalber blockiert", deckInfo);
    return response;
  } catch {
    return unavailableResponse("Deckprofil konnte nicht berechnet werden", deckInfo);
  }
}

export function buildDeckStrategyProfileViewer(
  profile: AiDeckStrategyProfile,
  snapshot: Pick<DeckSnapshot, "deckHash" | "name">,
  deck: Pick<EditableDeck, "deckId" | "name" | "side">,
  runnerStrategicIntent?: DeckStrategyProfileRunnerStrategicIntentViewer,
): DeckStrategyProfileViewer {
  const strategies = strategyRows(profile);
  const evidenceStrategies = strategies
    .filter((strategy) => strategy.status === "primary" || strategy.status === "secondary")
    .slice(0, 8);
  const fallbackEvidenceStrategies = evidenceStrategies.length > 0 ? evidenceStrategies : strategies.slice(0, 3);
  const viewer: DeckStrategyProfileViewer = {
    schemaVersion: VIEWER_SCHEMA_VERSION,
    taskId: "AI007",
    deckId: profile.deckId,
    deckName: snapshot.name || deck.name,
    side: profile.side,
    cardCount: profile.cardCount,
    statusEntries: statusEntries(profile, snapshot, deck),
    source: {
      label: "Diagnostisches KI-Deckprofil",
      aggregation: "AI006 strategy aggregation",
      profileSchemaVersion: profile.schemaVersion,
      profileTaskId: profile.taskId,
      plannerEffect: "none",
      deckHash: snapshot.deckHash,
    },
    diagnosticNotice:
      "Diagnostisches KI-Deckprofil: Strategieprofile werden aus neuer KI-Semantik berechnet. Noch keine direkte Plannerwirkung. Hinweis: Der aktuelle KI-Spieler verwendet teilweise noch bestehende DeckDoctrine-/Legacy-PlanWeights; Legacy-Signale werden getrennt gezählt.",
    primaryStrategies: profile.primaryStrategies,
    secondaryStrategies: profile.secondaryStrategies,
    strategies,
    sideProfileTitle: profile.side === "runner" ? "Runner-Profil" : "Korp-Profil",
    sideProfileGroups:
      profile.side === "runner"
        ? runnerProfileSections(profile.runnerProfile)
        : corpProfileSections(profile.corpProfile),
    evidenceGroups: fallbackEvidenceStrategies.map((strategy) =>
      evidenceGroupForStrategy(strategy, profile),
    ),
    ...(runnerStrategicIntent ? { runnerStrategicIntent } : {}),
    functionSignalCounts: countEntries(profile.functionSignalCounts, "function-signals"),
    legacySignalGroups: legacySignalGroups(profile.legacySignalCounts),
    warnings: warningEntries(profile.warnings),
  };
  return viewer;
}

function statusEntries(
  profile: AiDeckStrategyProfile,
  snapshot: Pick<DeckSnapshot, "deckHash" | "name">,
  deck: Pick<EditableDeck, "deckId" | "name" | "side">,
): DeckStrategyProfileEntry[] {
  return [
    { label: "Deck", value: snapshot.name || deck.name, tone: "info" },
    { label: "Deck-ID", value: deck.deckId, tone: "legacy" },
    { label: "Seite", value: sideLabel(profile.side), tone: "info" },
    { label: "Karten", value: String(profile.cardCount), tone: "info" },
    { label: "Analysequelle", value: "Diagnostisches KI-Deckprofil", tone: "valid" },
    { label: "Aggregation", value: "AI006 strategy aggregation aus neuer KI-Semantik", tone: "valid" },
    { label: "Plannerwirkung", value: "Noch keine direkte Plannerwirkung", tone: "warning" },
    { label: "Legacy-Signale", value: "getrennt gezählt", tone: "legacy" },
    { label: "Profil-Schema", value: profile.schemaVersion, tone: "legacy" },
    { label: "Deck-Hash", value: snapshot.deckHash, tone: "legacy" },
  ];
}

function buildRunnerStrategicIntentViewer(
  intent: RunnerStrategicIntentProfile,
): DeckStrategyProfileRunnerStrategicIntentViewer {
  const executionStyleEntries = intent.executionStyle
    ? [intentEntry("Ausführungsstil", intent.executionStyle, "valid")]
    : [intentEntry("Ausführungsstil", "runner.unknown", "legacy", "kein eindeutiger Run-Tempo-Anker")];
  return {
    schemaVersion: intent.schemaVersion,
    title: "Abgeleitete KI-Spielabsicht",
    notice:
      "Runtime-nahe Runner-Interpretation aus diagnostischem KI-Deckprofil und AI-internen DeckCapabilities. Diese Anzeige bleibt read-only und ändert keine KI-Gewichtung.",
    source: {
      label: "Abgeleitete KI-Spielabsicht",
      interpretation: "Runtime-nahe Projektion",
      deckStrategyProfile: intent.source.deckStrategyProfile,
      deckCapabilities: intent.source.deckCapabilities,
      plannerEffect: intent.source.plannerEffect,
    },
    statusEntries: [
      { label: "Analyseabschnitt", value: "Abgeleitete KI-Spielabsicht", tone: "valid" },
      { label: "Interpretation", value: "Runtime-nahe Projektion", tone: "valid" },
      { label: "Profilquelle", value: "Diagnoseprofil + DeckCapabilities", tone: "info" },
      { label: "Plannerwirkung", value: "Read-only im Deckeditor", tone: "warning" },
      { label: "Confidence", value: formatDeckStrategyValue(intent.confidence), tone: confidenceTone(intent.confidence) },
    ],
    sections: [
      {
        key: "runner-intent-win-plan",
        title: "Gewinnplan",
        entries: [
          intentEntry("Primärer Gewinnplan", intent.primaryWinIntent, "valid"),
          ...executionStyleEntries,
        ],
      },
      {
        key: "runner-intent-setup-engine",
        title: "Setup-Engine",
        entries: intent.setupEngine.map((value) =>
          intentEntry("Setup", value, "info"),
        ),
        emptyText: "Keine Setup-Engine abgeleitet.",
      },
      {
        key: "runner-intent-pressure-vectors",
        title: "Druckvektoren",
        entries: intent.pressureVectors.map((value) =>
          intentEntry("Druck", value, "valid"),
        ),
        emptyText: "Keine Druckvektoren abgeleitet.",
      },
      {
        key: "runner-intent-risk-profile",
        title: "Risikoprofil",
        entries: intent.riskProfile.map((value) =>
          intentEntry("Risiko", value, "warning"),
        ),
        emptyText: "Kein besonderes Risikoprofil.",
      },
      {
        key: "runner-intent-rejected-intents",
        title: "Abgelehnte Muster",
        entries: intent.rejectedIntents.map((value) =>
          intentEntry("Abgelehnt", value, "legacy"),
        ),
        emptyText: "Keine abgelehnten Muster.",
      },
    ],
    evidence: intent.evidence.map((fact, index) => ({
      label: index === 0 ? "Quelle" : "Evidence",
      value: formatRunnerStrategicIntentEvidence(fact),
      tone: "legacy",
    })),
  };
}

function intentEntry(
  label: string,
  value: string,
  tone: DeckStrategyProfileTone,
  detail?: string,
): DeckStrategyProfileEntry {
  return {
    label,
    value: formatRunnerStrategicIntentValue(value),
    ...(detail ? { detail } : {}),
    tone,
  };
}

function confidenceTone(
  confidence: RunnerStrategicIntentProfile["confidence"],
): DeckStrategyProfileTone {
  switch (confidence) {
    case "high":
      return "valid";
    case "medium":
      return "info";
    case "low":
      return "warning";
  }
}

function formatRunnerStrategicIntentEvidence(fact: string): string {
  if (fact === "deck_strategy_profile:present") return "Diagnostisches Deckprofil vorhanden";
  if (fact === "deck_strategy_profile:missing") return "Diagnostisches Deckprofil fehlt";
  if (fact === "deck_capabilities:present") return "DeckCapabilities vorhanden";
  if (fact === "deck_capabilities:missing") return "DeckCapabilities fehlen";

  const [kind, ...parts] = fact.split(":");
  if (kind === "deck_strategy_planner_effect") {
    return `Deckprofil-Plannerwirkung: ${formatDeckStrategyValue(parts.join(":"))}`;
  }
  if (kind === "deck_strategy_primary_count") {
    return `${parts[0] ?? "0"} primäre Diagnose-Strategien`;
  }
  if (kind === "deck_capability_confidence") {
    return `DeckCapability Confidence: ${formatDeckStrategyValue(parts.join(":"))}`;
  }
  if (kind === "deck_capability_runner_breakers") {
    return `${parts[0] ?? "0"} bekannte Runner-Breaker`;
  }
  if (kind === "deck_capability_runner_search_tools") {
    return `${parts[0] ?? "0"} bekannte Search-Tools`;
  }
  if (kind === "deck_capability_runner_bank_tools") {
    return `${parts[0] ?? "0"} bekannte Economy-/Bank-Tools`;
  }
  if (kind === "execution_style") {
    return `Ausführungsstil: ${formatRunnerStrategicIntentValue(parts.join(":"))}`;
  }
  if (kind === "setup_engine") {
    return `Setup-Engine: ${formatRunnerStrategicIntentList(parts.join(":"))}`;
  }
  if (kind === "pressure_vectors") {
    return `Druckvektoren: ${formatRunnerStrategicIntentList(parts.join(":"))}`;
  }
  if (kind === "risk_profile") {
    return `Risikoprofil: ${formatRunnerStrategicIntentList(parts.join(":"))}`;
  }
  if (kind === "rejected_intents") {
    return `Abgelehnte Muster: ${formatRunnerStrategicIntentList(parts.join(":"))}`;
  }
  if (kind === "strategy_score" && parts.length >= 2) {
    return `${formatRunnerStrategicIntentValue(parts[0] ?? "")}: ${parts
      .slice(1)
      .map(formatDeckStrategyValue)
      .join(", ")}`;
  }
  return formatDeckStrategyValue(fact);
}

function formatRunnerStrategicIntentList(value: string): string {
  if (!value || value === "none") return "keine";
  return value
    .split("|")
    .filter(Boolean)
    .map(formatRunnerStrategicIntentValue)
    .join(", ");
}

function strategyRows(profile: AiDeckStrategyProfile): DeckStrategyProfileStrategyRow[] {
  return Object.entries(profile.strategyScores)
    .map(([strategyId, score]) => {
      const goal = STRATEGY_GOALS_BY_ID.get(strategyId);
      return {
        strategyId,
        label: formatStrategyLabel(strategyId),
        ...(goal?.description ? { description: goal.description } : {}),
        anchorScore: score.anchorScore,
        supportScore: score.supportScore,
        finalScore: score.finalScore,
        confidence: score.confidence,
        status: strategyStatus(strategyId, score.finalScore, profile),
        evidenceCount: score.anchorEvidence.length + score.supportEvidence.length,
        gapCount: score.supportGaps.length,
      };
    })
    .sort(
      (left, right) =>
        right.finalScore - left.finalScore ||
        right.anchorScore - left.anchorScore ||
        left.strategyId.localeCompare(right.strategyId),
    );
}

function strategyStatus(
  strategyId: string,
  finalScore: number,
  profile: AiDeckStrategyProfile,
): DeckStrategyProfileStrategyStatus {
  if (profile.primaryStrategies.includes(strategyId)) return "primary";
  if (profile.secondaryStrategies.includes(strategyId)) return "secondary";
  if (finalScore > 0) return "low";
  return "unsupported";
}

function evidenceGroupForStrategy(
  strategy: DeckStrategyProfileStrategyRow,
  profile: AiDeckStrategyProfile,
): DeckStrategyProfileEvidenceGroup {
  const score = profile.strategyScores[strategy.strategyId];
  const base = {
    strategyId: strategy.strategyId,
    label: strategy.label,
    ...(strategy.description ? { description: strategy.description } : {}),
  };
  if (!score) {
    return {
      ...base,
      anchorEvidence: [],
      supportEvidence: [],
      supportGaps: [],
    };
  }
  return {
    ...base,
    anchorEvidence: score.anchorEvidence.map(anchorEvidenceEntry),
    supportEvidence: supportEvidenceEntries(score.supportEvidence),
    supportGaps: score.supportGaps.map((gapName) => ({
      gapName,
      strategyId: strategy.strategyId,
      tone: "warning" as const,
    })),
  };
}

function anchorEvidenceEntry(evidence: DeckStrategyEvidence): DeckStrategyProfileAnchorEvidence {
  return {
    cardId: evidence.cardId,
    cardTitle: cardTitle(evidence.cardId),
    quantity: evidence.quantity,
    source: evidence.source,
    ...(evidence.signal ? { signal: evidence.signal } : {}),
    ...(evidence.role ? { role: evidence.role } : {}),
    reason: evidence.reason,
  };
}

function supportEvidenceEntries(
  evidence: DeckStrategyEvidence[],
): DeckStrategyProfileSupportEvidence[] {
  const groups = new Map<
    string,
    {
      signal: string;
      category: string;
      count: number;
      exampleCards: Set<string>;
      sources: Set<string>;
    }
  >();

  for (const entry of evidence) {
    const signal = entry.signal ?? entry.strategyId ?? entry.source;
    const category = supportCategory(entry.reason);
    const key = `${category}:${signal}`;
    const group =
      groups.get(key) ??
      {
        signal,
        category,
        count: 0,
        exampleCards: new Set<string>(),
        sources: new Set<string>(),
      };
    group.count += entry.quantity;
    group.exampleCards.add(cardTitle(entry.cardId));
    group.sources.add(entry.source);
    groups.set(key, group);
  }

  return [...groups.values()]
    .map((group) => ({
      signal: group.signal,
      category: group.category,
      count: group.count,
      exampleCards: [...group.exampleCards].sort().slice(0, 5),
      sources: [...group.sources].sort(),
    }))
    .sort((left, right) => right.count - left.count || left.signal.localeCompare(right.signal));
}

function supportCategory(reason: string): string {
  if (reason.startsWith("support:")) return reason.slice("support:".length);
  return "support";
}

function runnerProfileSections(
  profile: AiDeckStrategyProfile["runnerProfile"],
): DeckStrategyProfileSection[] {
  if (!profile) return [];
  return [
    {
      key: "runner-coverage",
      title: "Coverage",
      entries: [
        coverageEntry("Wall", profile.coverageProfile.wall),
        coverageEntry("Code Gate", profile.coverageProfile.code_gate),
        coverageEntry("Sentry", profile.coverageProfile.sentry),
        coverageEntry("Universal", profile.coverageProfile.universal),
        coverageEntry("Special", profile.coverageProfile.special),
      ],
    },
    {
      key: "runner-economy",
      title: "Economy",
      entries: numericEntries(profile.economyProfile, {
        generic: "Generic",
        burst: "Burst",
        recurring: "Recurring",
        finite: "Finite",
        risky: "Risky",
        actionBased: "Action-based",
      }),
    },
    {
      key: "runner-setup",
      title: "Setup",
      entries: numericEntries(profile.setupProfile, {
        search: "Search",
        draw: "Draw",
        recovery: "Recovery",
        installSupport: "Install support",
        memoryHandSize: "Memory/Hand-size",
      }),
    },
    {
      key: "runner-pressure",
      title: "Pressure",
      entries: numericEntries(profile.pressureProfile, {
        rnd: "R&D",
        hq: "HQ",
        remote: "Remote",
        archives: "Archives",
      }),
    },
    {
      key: "runner-defense",
      title: "Defense",
      entries: numericEntries(profile.defenseProfile, {
        tag: "Tag",
        trace: "Trace",
        damage: "Damage",
        programTrash: "Program trash",
      }),
    },
  ];
}

function corpProfileSections(
  profile: AiDeckStrategyProfile["corpProfile"],
): DeckStrategyProfileSection[] {
  if (!profile) return [];
  return [
    {
      key: "corp-ice",
      title: "ICE",
      entries: numericEntries(profile.iceProfile, {
        etr: "ETR",
        trace: "Trace",
        tag: "Tag",
        damage: "Damage",
        programTrash: "Program trash",
        futureEncounter: "Future encounter",
        taxRunCost: "Run tax",
      }),
    },
    {
      key: "corp-score",
      title: "Score",
      entries: numericEntries(profile.scoreProfile, {
        scoreAcceleration: "Score acceleration",
        agendaInstallAdvanceScoreSupport: "Agenda install/advance/score support",
        remoteScoringProtection: "Remote scoring protection",
        stealTax: "Steal tax",
      }),
    },
    {
      key: "corp-economy",
      title: "Economy",
      entries: numericEntries(profile.economyProfile, {
        operationEconomy: "Operation economy",
        assetEconomy: "Asset economy",
        rezSupport: "Rez support",
        recurring: "Recurring",
        finite: "Finite",
      }),
    },
    {
      key: "corp-punish",
      title: "Punish",
      entries: numericEntries(profile.punishProfile, {
        tagSources: "Tag sources",
        tagPayoff: "Tag payoffs",
        damagePayoff: "Damage payoffs",
        traceDensity: "Trace density",
      }),
    },
    {
      key: "corp-remote",
      title: "Remote",
      entries: numericEntries(profile.remoteProfile, {
        scoringProtection: "Scoring protection",
        ambush: "Ambush",
        assetEconomy: "Asset economy",
        regionCityGridUpgradeSupport: "Region/City/Grid/Upgrade support",
      }),
    },
  ];
}

function coverageEntry(
  label: string,
  bucket: { count: number; searchable: boolean | "unknown" },
): DeckStrategyProfileEntry {
  return {
    label,
    value: String(bucket.count),
    ...(typeof bucket.searchable === "boolean"
      ? { detail: bucket.searchable ? "suchbar" : "nicht suchbar" }
      : {}),
    tone: bucket.count > 0 ? "valid" : "legacy",
  };
}

function numericEntries<T extends Record<string, number | "unknown">>(
  record: T,
  labels: Record<keyof T, string>,
): DeckStrategyProfileEntry[] {
  return (Object.keys(labels) as Array<keyof T>)
    .filter((key) => record[key] !== "unknown")
    .map((key) => {
      const value = record[key];
      const numberValue = typeof value === "number" ? value : 0;
      return {
        label: labels[key],
        value: String(numberValue),
        tone: numberValue > 0 ? "info" : "legacy",
      };
    });
}

function countEntries(
  record: Record<string, number>,
  label: string,
): DeckStrategyProfileEntry[] {
  return Object.entries(record)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([key, value]) => ({
      label,
      value: `${key}: ${value}`,
      tone: value > 0 ? "info" : "legacy",
    }));
}

function legacySignalGroups(
  record: Record<string, number>,
): DeckStrategyProfileSection[] {
  const groups: Record<"roles" | "planRoles" | "lineSupport" | "other", DeckStrategyProfileEntry[]> = {
    roles: [],
    planRoles: [],
    lineSupport: [],
    other: [],
  };
  for (const [key, value] of Object.entries(record).sort(
    (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
  )) {
    const [prefix, ...rest] = key.split(":");
    const signal = rest.join(":") || key;
    const entry = {
      label: prefix ?? "legacy",
      value: `${formatDeckStrategyValue(signal)}: ${value}`,
      tone: "legacy" as const,
    };
    if (prefix === "role") groups.roles.push(entry);
    else if (prefix === "planRole") groups.planRoles.push(entry);
    else if (prefix === "lineSupport") groups.lineSupport.push(entry);
    else groups.other.push(entry);
  }
  return [
    { key: "legacy-roles", title: "Legacy roles", entries: groups.roles },
    { key: "legacy-planRoles", title: "Legacy planRoles", entries: groups.planRoles },
    { key: "legacy-lineSupport", title: "Legacy lineSupport", entries: groups.lineSupport },
    { key: "legacy-other", title: "Weitere Legacy-/Migrationssignale", entries: groups.other },
  ].filter((section) => section.entries.length > 0);
}

function warningEntries(warnings: string[]): DeckStrategyProfileViewer["warnings"] {
  return warnings.map((warning) => ({
    label: warningLabel(warning),
    value: warning,
    tone: warningTone(warning),
  }));
}

function warningLabel(warning: string): string {
  if (warning.startsWith("missing_")) return "Fehlende Daten";
  if (warning.startsWith("side_mismatch")) return "Side-Warnung";
  if (warning.includes("legacy")) return "Legacy-Hinweis";
  if (warning.includes("descriptor")) return "Descriptor-Gap";
  return "Hinweis";
}

function warningTone(warning: string): DeckStrategyProfileTone {
  if (warning.startsWith("side_mismatch")) return "danger";
  if (warning.startsWith("missing_")) return "warning";
  if (warning.includes("legacy")) return "legacy";
  return "info";
}

function deckValidationUnavailableReason(validation: DeckValidationResult): string {
  if (validation.errorCodes?.includes("minimum_deck_size")) return "Deckprofil konnte nicht berechnet werden: Deck ist unvollständig";
  if (validation.errorCodes?.includes("format_profile_unsupported")) return "Deckprofil konnte nicht berechnet werden: Formatprofil nicht unterstützt";
  return "Deckprofil konnte nicht berechnet werden: Deckvalidierung nicht erfolgreich";
}

function unavailableResponse(
  reason: string,
  deck?: DeckStrategyProfileUnavailableDeckInfo,
): DeckStrategyProfileViewerResponse {
  const base = {
    schemaVersion: RESPONSE_SCHEMA_VERSION,
    taskId: "AI007" as const,
    status: "unavailable" as const,
    reason,
  };
  if (!deck || Object.keys(deck).length === 0) return base;
  return { ...base, deck };
}

function deckInfoFromUnknown(value: unknown): DeckStrategyProfileUnavailableDeckInfo {
  if (!value || typeof value !== "object") return {};
  const record = value as Record<string, unknown>;
  const deck: DeckStrategyProfileUnavailableDeckInfo = {};
  if (typeof record.deckId === "string") deck.deckId = record.deckId;
  if (typeof record.name === "string") deck.deckName = record.name;
  if (record.side === "runner" || record.side === "corp") deck.side = record.side;
  if (Array.isArray(record.cards)) {
    deck.cardCount = record.cards.reduce((sum, entry) => {
      const quantity = (entry as { quantity?: unknown }).quantity;
      return sum + (typeof quantity === "number" && Number.isFinite(quantity) ? Math.max(0, Math.floor(quantity)) : 0);
    }, 0);
  }
  return deck;
}

function deckInfoFromDeck(
  deck: EditableDeck,
  cardCount: number,
): DeckStrategyProfileUnavailableDeckInfo {
  return {
    deckId: deck.deckId,
    deckName: deck.name,
    side: deck.side,
    cardCount,
  };
}

function isEditableDeckLike(value: unknown): value is EditableDeck {
  if (!value || typeof value !== "object") return false;
  const deck = value as Partial<EditableDeck>;
  return Boolean(
    typeof deck.deckId === "string" &&
      typeof deck.deckVersion === "string" &&
      typeof deck.name === "string" &&
      (deck.side === "runner" || deck.side === "corp") &&
      typeof deck.identityCardId === "string" &&
      typeof deck.cardPoolSnapshotId === "string" &&
      typeof deck.formatProfileId === "string" &&
      Array.isArray(deck.cards) &&
      typeof deck.createdAt === "string" &&
      typeof deck.updatedAt === "string",
  );
}

function cardTitle(cardId: string): string {
  return CARDS_BY_ID[cardId]?.title ?? cardId;
}

function sideLabel(side: Side): string {
  return side === "corp" ? "Korp" : "Runner";
}
