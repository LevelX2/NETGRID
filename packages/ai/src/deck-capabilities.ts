import type { AiDecisionInput, LegalAction, PlayerView, Side, VisibleCard } from "@netgrid/shared";
import { CARD_ROLES_BY_CARD, RUNTIME_CARDS, createAiHintsByCard } from "./ai-hints";
import type { AiDeckDoctrineDeckSnapshot } from "./deck-doctrine";
import { rolesMatch } from "./runtime/role-match";
import {
  estimateBreakerCostProfileFromOntology,
  getStructuredBreakerProfileForCard,
} from "./breaker-ontology-consumer";
import type { KnownHintBreakerCoverage } from "./hint-ontology";

export const DECK_CAPABILITY_PROFILE_SCHEMA_VERSION =
  "deck-capability-profile-v1" as const;

export type DeckCapabilityConfidence = "low" | "medium" | "high";

export type BreakerCoverageKind =
  | "wall"
  | "code_gate"
  | "sentry"
  | "ap"
  | "trace"
  | "universal"
  | "subtype_limited"
  | "special";

export type CapabilityCardStatus =
  | "in_deck"
  | "in_hand"
  | "installed"
  | "discarded"
  | "scored"
  | "unavailable";

export type BreakerCapability = {
  cardId: string;
  title: string;
  coverage: BreakerCoverageKind[];
  installCost?: number;
  memoryCost?: number;
  baseStrength?: number;
  breakCost?: number;
  pumpCost?: number;
  risks: string[];
  restrictions: string[];
  quantityKnownInDeck: number;
  locations: CapabilityCardStatus[];
  confidence: DeckCapabilityConfidence;
  evidence: string[];
};

export type CoverageState = {
  coverage: BreakerCoverageKind;
  inDeckKnown: boolean;
  inHand: boolean;
  installed: boolean;
  inHeapOrArchives?: boolean;
  searchableNow: boolean;
  drawOnly: boolean;
  missing: boolean;
  bestKnownCards: string[];
  blockers: string[];
};

export type BreakerCoverageMatrix = Record<BreakerCoverageKind, CoverageState>;

export type SearchAccessTool = {
  cardId: string;
  title: string;
  status: CapabilityCardStatus;
  canSearchPrograms: boolean;
  canSearchBreakers: boolean;
  legalNow: boolean;
  confidence: DeckCapabilityConfidence;
  evidence: string[];
};

export type SearchAccessProfile = {
  tools: SearchAccessTool[];
  canSearchProgramsNow: boolean;
  canSearchBreakersNow: boolean;
  evidence: string[];
};

export type EconomyBankTool = {
  cardId: string;
  title: string;
  ownerSide: Side;
  status: CapabilityCardStatus;
  currentBankAmount?: number;
  maxKnownCapacity?: number;
  buildActionLegal: boolean;
  cashOutActionLegal: boolean;
  buildActionIds: string[];
  cashOutActionIds: string[];
  estimatedPayout?: number;
  confidence: DeckCapabilityConfidence;
  evidence: string[];
};

export type MemoryCapabilityProfile = {
  memoryUsed?: number;
  memoryLimit?: number;
  memoryAvailable?: number;
  memoryToolsKnown: number;
  missingMemoryPressure: boolean;
  evidence: string[];
};

export type RunnerAttackPlanProfile = {
  centralPressureToolsKnown: number;
  remoteContestToolsKnown: number;
  setupToolsKnown: number;
  evidence: string[];
};

export type CorpScorePlanProfile = {
  agendaToolsKnown: number;
  advanceToolsKnown: number;
  scoreSupportToolsKnown: number;
  evidence: string[];
};

export type CorpRezReserveProfile = {
  iceKnownInDeck: number;
  rezEconomyToolsKnown: number;
  evidence: string[];
};

export type CorpIceTaxProfile = {
  barrierIceKnown: number;
  codeGateIceKnown: number;
  sentryIceKnown: number;
  taxingIceKnown: number;
  evidence: string[];
};

export type CorpRemotePlanProfile = {
  remoteProtectionToolsKnown: number;
  remoteEconomyToolsKnown: number;
  ambushToolsKnown: number;
  evidence: string[];
};

export type MissingCapability = {
  capabilityId: string;
  kind: string;
  severity: "soft" | "hard";
  evidence: string[];
};

export type DeckCapabilityProfile = {
  schemaVersion: typeof DECK_CAPABILITY_PROFILE_SCHEMA_VERSION;
  side: Side;
  runner?: {
    breakerInventory: BreakerCapability[];
    breakerCoverageMatrix: BreakerCoverageMatrix;
    searchAccess: SearchAccessProfile;
    economyBankTools: EconomyBankTool[];
    memoryProfile: MemoryCapabilityProfile;
    attackPlanProfile: RunnerAttackPlanProfile;
  };
  corp?: {
    scorePlanProfile: CorpScorePlanProfile;
    rezReserveProfile: CorpRezReserveProfile;
    economyBankTools: EconomyBankTool[];
    iceTaxProfile: CorpIceTaxProfile;
    remotePlanProfile: CorpRemotePlanProfile;
  };
  missingCapabilities: MissingCapability[];
  confidence: DeckCapabilityConfidence;
  evidence: string[];
};

export type BuildDeckCapabilityProfileParams = {
  side: Side;
  playerView?: PlayerView;
  legalActions?: readonly LegalAction[];
  deckSnapshot?: AiDeckDoctrineDeckSnapshot;
};

type CardCapabilityRecord = {
  cardId: string;
  title: string;
  side: Side;
  type?: string;
  subtypes: string[];
  text: string;
  roles: string[];
  planRoles: string[];
  quantityKnownInDeck: number;
  locations: CapabilityCardStatus[];
  visibleCards: VisibleCard[];
};

const AI_HINTS = createAiHintsByCard();
const CAPABILITY_SOURCE_PRIORITY =
  "capability_source_priority:structured>roles>visible_board>text_fallback";
const BREAKER_COVERAGES: BreakerCoverageKind[] = [
  "wall",
  "code_gate",
  "sentry",
  "ap",
  "trace",
  "universal",
  "subtype_limited",
  "special",
];

export function buildDeckCapabilityProfile(
  params: BuildDeckCapabilityProfileParams,
): DeckCapabilityProfile {
  const records = buildCardCapabilityRecords(params);
  return params.side === "runner"
    ? buildRunnerDeckCapabilityProfile(params, records)
    : buildCorpDeckCapabilityProfile(params, records);
}

export function buildDeckCapabilityProfileFromInput(
  input: AiDecisionInput,
  deckSnapshot?: AiDeckDoctrineDeckSnapshot,
): DeckCapabilityProfile {
  return buildDeckCapabilityProfile({
    side: input.side,
    playerView: input.playerView,
    legalActions: input.legalActions,
    ...(deckSnapshot ? { deckSnapshot } : {}),
  });
}

export function redactedDeckCapabilityFacts(
  profile: DeckCapabilityProfile,
): string[] {
  if (profile.side === "runner" && profile.runner) {
    const matrix = profile.runner.breakerCoverageMatrix;
    const breakerFacts = BREAKER_COVERAGES.map((coverage) => {
      const state = matrix[coverage];
      const status = state.installed
        ? "installed"
        : state.inHand
          ? "in_hand"
          : state.searchableNow
            ? "in_deck/searchable"
            : state.inDeckKnown
              ? "in_deck/draw_only"
              : "missing";
      return `breaker.${coverage}=${status}`;
    });
    const bankFacts = profile.runner.economyBankTools.length > 0
      ? [
          `bank_tool_count:${profile.runner.economyBankTools.length}`,
          `bank_tool_legal:${profile.runner.economyBankTools.some((tool) => tool.buildActionLegal || tool.cashOutActionLegal)}`,
        ]
      : ["bank_tool_count:0"];
    return [
      ...breakerFacts,
      ...bankFacts,
      ...profile.missingCapabilities
        .filter((capability) => capability.kind.includes("coverage"))
        .map((capability) => `missing:${capability.kind}`),
      `deck_capability_confidence:${profile.confidence}`,
    ];
  }
  if (profile.side === "corp" && profile.corp) {
    return [
      `corp_score_tools:${profile.corp.scorePlanProfile.scoreSupportToolsKnown}`,
      `corp_ice_known:${profile.corp.rezReserveProfile.iceKnownInDeck}`,
      `corp_bank_tool_count:${profile.corp.economyBankTools.length}`,
      `deck_capability_confidence:${profile.confidence}`,
    ];
  }
  return [`deck_capability_confidence:${profile.confidence}`];
}

function buildRunnerDeckCapabilityProfile(
  params: BuildDeckCapabilityProfileParams,
  records: readonly CardCapabilityRecord[],
): DeckCapabilityProfile {
  const breakerInventory = records
    .map(breakerCapabilityFromRecord)
    .filter((capability): capability is BreakerCapability => capability !== undefined)
    .sort(compareBreakerCapabilities);
  const searchAccess = buildSearchAccessProfile(params, records);
  const breakerCoverageMatrix = buildBreakerCoverageMatrix(
    breakerInventory,
    searchAccess,
  );
  const economyBankTools = buildEconomyBankTools(params, records);
  const memoryProfile = buildMemoryCapabilityProfile(params.playerView, records);
  const attackPlanProfile = buildRunnerAttackPlanProfile(records);
  const missingCapabilities = BREAKER_COVERAGES
    .filter((coverage) => breakerCoverageMatrix[coverage].missing)
    .map((coverage) => ({
      capabilityId: `runner.${coverage}_coverage`,
      kind: `${coverage}_coverage`,
      severity: coverage === "special" || coverage === "subtype_limited" ? "soft" : "hard",
      evidence: [`coverage_state:${coverage}:missing`],
    } satisfies MissingCapability));
  const confidence = params.deckSnapshot
    ? missingCapabilities.length === 0 ? "high" : "medium"
    : "low";
  return {
    schemaVersion: DECK_CAPABILITY_PROFILE_SCHEMA_VERSION,
    side: "runner",
    runner: {
      breakerInventory,
      breakerCoverageMatrix,
      searchAccess,
      economyBankTools,
      memoryProfile,
      attackPlanProfile,
    },
    missingCapabilities,
    confidence,
    evidence: [
      CAPABILITY_SOURCE_PRIORITY,
      params.deckSnapshot ? "deck_snapshot:present" : "deck_snapshot:absent",
      `runner_breaker_inventory:${breakerInventory.length}`,
      `runner_search_tools:${searchAccess.tools.length}`,
    ],
  };
}

function buildCorpDeckCapabilityProfile(
  params: BuildDeckCapabilityProfileParams,
  records: readonly CardCapabilityRecord[],
): DeckCapabilityProfile {
  const economyBankTools = buildEconomyBankTools(params, records);
  const scorePlanProfile = buildCorpScorePlanProfile(records);
  const rezReserveProfile = buildCorpRezReserveProfile(records);
  const iceTaxProfile = buildCorpIceTaxProfile(records);
  const remotePlanProfile = buildCorpRemotePlanProfile(records);
  const confidence = params.deckSnapshot ? "medium" : "low";
  return {
    schemaVersion: DECK_CAPABILITY_PROFILE_SCHEMA_VERSION,
    side: "corp",
    corp: {
      scorePlanProfile,
      rezReserveProfile,
      economyBankTools,
      iceTaxProfile,
      remotePlanProfile,
    },
    missingCapabilities: [],
    confidence,
    evidence: [
      CAPABILITY_SOURCE_PRIORITY,
      params.deckSnapshot ? "deck_snapshot:present" : "deck_snapshot:absent",
      `corp_ice_known:${rezReserveProfile.iceKnownInDeck}`,
      `corp_bank_tools:${economyBankTools.length}`,
    ],
  };
}

function buildCardCapabilityRecords(
  params: BuildDeckCapabilityProfileParams,
): CardCapabilityRecord[] {
  const visibleRecords = visibleCardRecords(params.playerView, params.side);
  const byId = new Map<string, CardCapabilityRecord>();
  for (const entry of params.deckSnapshot?.cards ?? []) {
    const record = recordFromDefinition(entry.cardId, params.side, entry.quantity);
    if (record) byId.set(entry.cardId, record);
  }
  for (const visible of visibleRecords) {
    const cardId = visible.card.definitionId;
    if (!cardId) continue;
    const current = byId.get(cardId) ?? recordFromVisibleCard(visible.card, params.side);
    if (!current) continue;
    byId.set(cardId, {
      ...current,
      locations: sortedUnique([...current.locations, visible.location]),
      visibleCards: [...current.visibleCards, visible.card],
    });
  }
  return [...byId.values()].sort((left, right) => left.cardId.localeCompare(right.cardId));
}

function recordFromDefinition(
  cardId: string,
  side: Side,
  quantityKnownInDeck: number,
): CardCapabilityRecord | undefined {
  const definition = RUNTIME_CARDS[cardId];
  if (!definition || definition.side !== side) return undefined;
  const hint = AI_HINTS.get(cardId);
  return {
    cardId,
    title: definition.title,
    side,
    type: definition.type,
    subtypes: [...definition.subtypes],
    text: definition.text,
    roles: [...(CARD_ROLES_BY_CARD.get(cardId)?.roles ?? []), ...(hint?.roles ?? [])],
    planRoles: [...(hint?.planRoles ?? [])],
    quantityKnownInDeck: Math.max(0, quantityKnownInDeck),
    locations: quantityKnownInDeck > 0 ? ["in_deck"] : [],
    visibleCards: [],
  };
}

function recordFromVisibleCard(
  card: VisibleCard,
  side: Side,
): CardCapabilityRecord | undefined {
  const cardId = card.definitionId;
  if (!cardId) return undefined;
  const definition = RUNTIME_CARDS[cardId];
  const hint = AI_HINTS.get(cardId);
  const ownerSide = definition?.side ?? card.owner ?? card.controller ?? side;
  if (ownerSide !== side) return undefined;
  const type = definition?.type ?? card.type;
  return {
    cardId,
    title: definition?.title ?? card.title ?? cardId,
    side,
    ...(type ? { type } : {}),
    subtypes: [...(definition?.subtypes ?? card.subtypes ?? [])],
    text: definition?.text ?? card.rulesText ?? "",
    roles: [...(CARD_ROLES_BY_CARD.get(cardId)?.roles ?? []), ...(hint?.roles ?? [])],
    planRoles: [...(hint?.planRoles ?? [])],
    quantityKnownInDeck: 0,
    locations: [],
    visibleCards: [card],
  };
}

function visibleCardRecords(
  playerView: PlayerView | undefined,
  side: Side,
): Array<{ card: VisibleCard; location: CapabilityCardStatus }> {
  if (!playerView || playerView.side !== side) return [];
  const records: Array<{ card: VisibleCard; location: CapabilityCardStatus }> = [
    ...playerView.own.gripOrHq.map((card) => ({ card, location: "in_hand" as const })),
    ...(playerView.own.rig ?? []).map((card) => ({ card, location: "installed" as const })),
    ...playerView.own.heapOrArchives.map((card) => ({ card, location: "discarded" as const })),
    ...playerView.own.scoreArea.map((card) => ({ card, location: "scored" as const })),
  ];
  if (side === "corp") {
    records.push(
      ...playerView.servers.flatMap((server) => [
        ...server.ice.map((card) => ({ card, location: "installed" as const })),
        ...server.root.map((card) => ({ card, location: "installed" as const })),
      ]),
    );
  }
  return records.filter(({ card }) => card.known !== false || card.owner === side || card.controller === side);
}

function breakerCapabilityFromRecord(
  record: CardCapabilityRecord,
): BreakerCapability | undefined {
  if (record.side !== "runner") return undefined;
  const breakerProfile = getStructuredBreakerProfileForCard(record.cardId);
  const costProfile = estimateBreakerCostProfileFromOntology(record.cardId);
  const coverage = breakerCoverageForRecord(record);
  if (coverage.length === 0) return undefined;
  const visible = record.visibleCards[0];
  const roleBasedBreaker =
    record.roles.some((role) => role.startsWith("breaker_")) ||
    record.subtypes.some((subtype) => /icebreaker|fracter|decoder|killer/i.test(subtype));
  const confidence: DeckCapabilityConfidence = breakerProfile
    ? "high"
    : roleBasedBreaker
      ? "medium"
      : "low";
  return {
    cardId: record.cardId,
    title: record.title,
    coverage,
    ...(costProfile?.installCredits !== undefined
      ? { installCost: costProfile.installCredits }
      : visible?.installCost !== undefined
        ? { installCost: visible.installCost }
        : runtimeNumber(record.cardId, "installCost")),
    ...(costProfile?.memory !== undefined
      ? { memoryCost: costProfile.memory }
      : visible?.memoryCost !== undefined
        ? { memoryCost: visible.memoryCost }
        : runtimeNumber(record.cardId, "memoryCost")),
    ...(breakerProfile?.baseStrength !== undefined
      ? { baseStrength: breakerProfile.baseStrength }
      : visible?.strength !== undefined
        ? { baseStrength: visible.strength }
        : runtimeNumber(record.cardId, "strength")),
    ...(breakerProfile?.breakCost !== undefined ? { breakCost: breakerProfile.breakCost } : {}),
    ...(breakerProfile?.pumpCost !== undefined ? { pumpCost: breakerProfile.pumpCost } : {}),
    risks: sortedUnique([
      ...(breakerProfile?.sideEffects ?? []),
      ...(costProfile && costProfile.sideEffectPenalty > 0 ? ["side_effect_penalty"] : []),
    ]),
    restrictions: sortedUnique([...(breakerProfile?.restrictions ?? [])]),
    quantityKnownInDeck: record.quantityKnownInDeck,
    locations: sortedUnique(record.locations.length > 0 ? record.locations : ["unavailable"]),
    confidence,
    evidence: [
      ...capabilitySourceEvidence({
        structured: Boolean(breakerProfile),
        roleBased: roleBasedBreaker,
      }),
      breakerProfile ? "breaker_profile:structured" : `breaker_profile:${confidence}`,
      ...coverage.map((entry) => `coverage:${entry}`),
    ],
  };
}

function breakerCoverageForRecord(record: CardCapabilityRecord): BreakerCoverageKind[] {
  const hintCoverage = getStructuredBreakerProfileForCard(record.cardId)?.coverage ?? [];
  const coverage = new Set<BreakerCoverageKind>(
    hintCoverage.map(mapHintCoverage).filter((entry): entry is BreakerCoverageKind => Boolean(entry)),
  );
  const haystack = normalizedRecordText(record);
  for (const role of [...record.roles, ...record.planRoles]) {
    if (role === "breaker_fracter") coverage.add("wall");
    if (role === "breaker_decoder") coverage.add("code_gate");
    if (role === "breaker_killer") coverage.add("sentry");
  }
  if (/fracter|wall|barrier/.test(haystack)) coverage.add("wall");
  if (/decoder|code gate|code_gate|codegate/.test(haystack)) coverage.add("code_gate");
  if (/killer|sentry/.test(haystack)) coverage.add("sentry");
  if (/\bap\b|anti-personnel|net damage|meat damage/.test(haystack)) coverage.add("ap");
  if (/\btrace\b|traces/.test(haystack)) coverage.add("trace");
  if (/break (?:an? |one |\d+ )?ice subroutine|breaks? .*subroutine/.test(haystack)) {
    coverage.add(coverage.size > 0 ? "subtype_limited" : "special");
  }
  if (
    coverage.size === 0 &&
    (record.subtypes.some((subtype) => /icebreaker/i.test(subtype)) ||
      /icebreaker|breaker/.test(haystack))
  ) {
    coverage.add("special");
  }
  return [...coverage].sort();
}

function mapHintCoverage(
  coverage: KnownHintBreakerCoverage,
): BreakerCoverageKind | undefined {
  switch (coverage) {
    case "wall":
    case "sentry":
    case "code_gate":
    case "ap":
    case "trace":
    case "universal":
      return coverage;
    case "watchdog":
    case "black_ice":
    case "unknown_special":
      return "special";
  }
}

function buildBreakerCoverageMatrix(
  breakerInventory: readonly BreakerCapability[],
  searchAccess: SearchAccessProfile,
): BreakerCoverageMatrix {
  return Object.fromEntries(
    BREAKER_COVERAGES.map((coverage) => {
      const matching = breakerInventory.filter((breaker) =>
        breaker.coverage.includes(coverage) ||
        breaker.coverage.includes("universal"),
      );
      const installed = matching.some((breaker) => breaker.locations.includes("installed"));
      const inHand = matching.some((breaker) => breaker.locations.includes("in_hand"));
      const inHeapOrArchives = matching.some((breaker) => breaker.locations.includes("discarded"));
      const inDeckKnown = matching.some((breaker) =>
        breaker.quantityKnownInDeck > visibleKnownCopyCount(breaker),
      );
      const searchableNow =
        inDeckKnown &&
        (searchAccess.canSearchBreakersNow || searchAccess.canSearchProgramsNow);
      const state: CoverageState = {
        coverage,
        inDeckKnown,
        inHand,
        installed,
        ...(inHeapOrArchives ? { inHeapOrArchives } : {}),
        searchableNow,
        drawOnly: inDeckKnown && !searchableNow && !inHand && !installed,
        missing: !installed && !inHand && !inDeckKnown,
        bestKnownCards: matching
          .slice()
          .sort(compareBreakerCapabilities)
          .slice(0, 3)
          .map((breaker) => breaker.cardId),
        blockers: coverageBlockers(coverage, {
          installed,
          inHand,
          inDeckKnown,
          searchableNow,
        }),
      };
      return [coverage, state];
    }),
  ) as BreakerCoverageMatrix;
}

function coverageBlockers(
  coverage: BreakerCoverageKind,
  state: Pick<CoverageState, "installed" | "inHand" | "inDeckKnown" | "searchableNow">,
): string[] {
  if (state.installed) return [];
  if (state.inHand) return ["not_installed"];
  if (state.searchableNow) return ["needs_search_action"];
  if (state.inDeckKnown) return ["draw_only"];
  return [`missing_${coverage}_coverage`];
}

function visibleKnownCopyCount(breaker: BreakerCapability): number {
  return breaker.locations.reduce((sum, location) => {
    if (location === "in_hand" || location === "installed" || location === "discarded") {
      return sum + 1;
    }
    return sum;
  }, 0);
}

function buildSearchAccessProfile(
  params: BuildDeckCapabilityProfileParams,
  records: readonly CardCapabilityRecord[],
): SearchAccessProfile {
  const tools = records
    .map((record) => searchAccessToolForRecord(params, record))
    .filter((tool): tool is SearchAccessTool => tool !== undefined)
    .sort((left, right) => left.cardId.localeCompare(right.cardId));
  return {
    tools,
    canSearchProgramsNow: tools.some((tool) => tool.canSearchPrograms && tool.legalNow),
    canSearchBreakersNow: tools.some((tool) => tool.canSearchBreakers && tool.legalNow),
    evidence: tools.flatMap((tool) =>
      tool.legalNow ? [`search_tool_legal:${tool.status}`] : [],
    ),
  };
}

function searchAccessToolForRecord(
  params: BuildDeckCapabilityProfileParams,
  record: CardCapabilityRecord,
): SearchAccessTool | undefined {
  const text = normalizedRecordTextWithoutRoles(record);
  const roleSignals = [...record.roles, ...record.planRoles];
  const signals = roleSignals.join(" ").toLowerCase();
  const canSearchPrograms =
    /program_search|setup\.program_search|search.*program|search your stack for a program/.test(text) ||
    rolesMatch(roleSignals, ["program_search", "breaker_search"]);
  const canSearchBreakers =
    canSearchPrograms ||
    /breaker_search|search.*breaker|icebreaker/.test(text) ||
    rolesMatch(roleSignals, ["breaker_search"]);
  if (!canSearchPrograms && !canSearchBreakers) return undefined;
  const status = primaryStatus(record.locations);
  const structuredSearch =
    rolesMatch(roleSignals, ["program_search", "breaker_search", "search"]);
  return {
    cardId: record.cardId,
    title: record.title,
    status,
    canSearchPrograms,
    canSearchBreakers,
    legalNow:
      params.legalActions?.some((action) =>
        actionSourceMatchesRecord(action, record),
      ) ?? false,
    confidence: /program_search|breaker_search|search your stack/.test(`${text} ${signals}`)
      ? "high"
      : "medium",
    evidence: [
      ...capabilitySourceEvidence({
        structured: structuredSearch,
        roleBased: record.roles.length > 0 || record.planRoles.length > 0,
      }),
      canSearchPrograms ? "search_programs:true" : "search_programs:false",
      canSearchBreakers ? "search_breakers:true" : "search_breakers:false",
      `status:${status}`,
    ],
  };
}

function normalizedRecordTextWithoutRoles(record: CardCapabilityRecord): string {
  return [
    record.cardId,
    record.title,
    record.type,
    ...record.subtypes,
    record.text,
  ].join(" ").toLowerCase();
}

function buildEconomyBankTools(
  params: BuildDeckCapabilityProfileParams,
  records: readonly CardCapabilityRecord[],
): EconomyBankTool[] {
  return records
    .map((record) => economyBankToolForRecord(params, record))
    .filter((tool): tool is EconomyBankTool => tool !== undefined)
    .sort((left, right) => left.cardId.localeCompare(right.cardId));
}

function economyBankToolForRecord(
  params: BuildDeckCapabilityProfileParams,
  record: CardCapabilityRecord,
): EconomyBankTool | undefined {
  const text = normalizedRecordText(record);
  const signals = [...record.roles, ...record.planRoles].join(" ").toLowerCase();
  if (
    !/broker|bank|stored credits|temporary_resource_bank|counter_bank/.test(
      `${text} ${signals}`,
    )
  ) {
    return undefined;
  }
  const buildActionIds = (params.legalActions ?? [])
    .filter((action) => actionMatchesBankBuild(action, record))
    .map((action) => action.actionId)
    .sort();
  const cashOutActionIds = (params.legalActions ?? [])
    .filter((action) => actionMatchesBankCashOut(action, record))
    .map((action) => action.actionId)
    .sort();
  const buildActionLegal = buildActionIds.length > 0;
  const cashOutActionLegal = cashOutActionIds.length > 0;
  const currentBankAmount = currentVisibleBankAmount(record.visibleCards);
  const structuredBank =
    /temporary_resource_bank|counter_bank/.test(signals) ||
    currentBankAmount !== undefined;
  return {
    cardId: record.cardId,
    title: record.title,
    ownerSide: record.side,
    status: primaryStatus(record.locations),
    ...(currentBankAmount !== undefined ? { currentBankAmount } : {}),
    ...maxKnownBankCapacity(record.text),
    buildActionLegal,
    cashOutActionLegal,
    buildActionIds,
    cashOutActionIds,
    ...(cashOutActionLegal && currentBankAmount !== undefined
      ? { estimatedPayout: currentBankAmount }
      : {}),
    confidence: /temporary_resource_bank|counter_bank|broker/.test(`${text} ${signals}`)
      ? "high"
      : "medium",
    evidence: [
      ...capabilitySourceEvidence({
        structured: structuredBank,
        roleBased: record.roles.length > 0 || record.planRoles.length > 0,
      }),
      `bank_status:${primaryStatus(record.locations)}`,
      buildActionLegal ? "bank_build_legal:true" : "bank_build_legal:false",
      cashOutActionLegal ? "bank_cashout_legal:true" : "bank_cashout_legal:false",
    ],
  };
}

function buildMemoryCapabilityProfile(
  playerView: PlayerView | undefined,
  records: readonly CardCapabilityRecord[],
): MemoryCapabilityProfile {
  const memoryUsed = playerView?.own.memoryUsed;
  const memoryLimit = playerView?.own.memoryLimit;
  const memoryAvailable =
    memoryUsed !== undefined && memoryLimit !== undefined
      ? Math.max(0, memoryLimit - memoryUsed)
      : undefined;
  const memoryToolsKnown = records.filter((record) =>
    record.type === "hardware" &&
    (/memory|\bmu\b/.test(normalizedRecordText(record)) ||
      runtimeNumber(record.cardId, "memoryLimitBonus") !== undefined),
  ).length;
  return {
    ...(memoryUsed !== undefined ? { memoryUsed } : {}),
    ...(memoryLimit !== undefined ? { memoryLimit } : {}),
    ...(memoryAvailable !== undefined ? { memoryAvailable } : {}),
    memoryToolsKnown,
    missingMemoryPressure: memoryAvailable !== undefined && memoryAvailable <= 0,
    evidence: [
      ...(memoryAvailable !== undefined ? [`memory_available:${memoryAvailable}`] : []),
      `memory_tools_known:${memoryToolsKnown}`,
    ],
  };
}

function buildRunnerAttackPlanProfile(
  records: readonly CardCapabilityRecord[],
): RunnerAttackPlanProfile {
  const roleText = records.map((record) => record.roles.join(" ")).join(" ");
  const centralPressureToolsKnown = countRoleMatches(roleText, [
    "pressure_rnd",
    "pressure_hq",
    "multiaccess",
  ]);
  const remoteContestToolsKnown = countRoleMatches(roleText, [
    "remote_contest",
    "trash_support",
  ]);
  const setupToolsKnown = records.filter((record) =>
    record.roles.some((role) => role.startsWith("setup") || role === "runner_program"),
  ).length;
  return {
    centralPressureToolsKnown,
    remoteContestToolsKnown,
    setupToolsKnown,
    evidence: [
      `central_pressure_tools:${centralPressureToolsKnown}`,
      `remote_contest_tools:${remoteContestToolsKnown}`,
      `setup_tools:${setupToolsKnown}`,
    ],
  };
}

function buildCorpScorePlanProfile(
  records: readonly CardCapabilityRecord[],
): CorpScorePlanProfile {
  const agendaToolsKnown = records.filter((record) => record.type === "agenda").length;
  const advanceToolsKnown = records.filter((record) =>
    /advance|advancement/.test(normalizedRecordText(record)),
  ).length;
  const scoreSupportToolsKnown = records.filter((record) =>
    record.roles.some((role) => role.includes("score")) ||
    /score|agenda/.test(normalizedRecordText(record)),
  ).length;
  return {
    agendaToolsKnown,
    advanceToolsKnown,
    scoreSupportToolsKnown,
    evidence: [
      `agenda_tools:${agendaToolsKnown}`,
      `advance_tools:${advanceToolsKnown}`,
      `score_support_tools:${scoreSupportToolsKnown}`,
    ],
  };
}

function buildCorpRezReserveProfile(
  records: readonly CardCapabilityRecord[],
): CorpRezReserveProfile {
  const iceKnownInDeck = records.filter((record) => record.type === "ice").length;
  const rezEconomyToolsKnown = records.filter((record) =>
    /rez|economy|credits/.test(normalizedRecordText(record)) &&
    (record.type === "operation" || record.type === "asset"),
  ).length;
  return {
    iceKnownInDeck,
    rezEconomyToolsKnown,
    evidence: [
      `ice_known:${iceKnownInDeck}`,
      `rez_economy_tools:${rezEconomyToolsKnown}`,
    ],
  };
}

function buildCorpIceTaxProfile(
  records: readonly CardCapabilityRecord[],
): CorpIceTaxProfile {
  const iceRecords = records.filter((record) => record.type === "ice");
  return {
    barrierIceKnown: iceRecords.filter((record) => subtypeOrText(record, "wall", "barrier")).length,
    codeGateIceKnown: iceRecords.filter((record) => subtypeOrText(record, "code_gate", "code gate")).length,
    sentryIceKnown: iceRecords.filter((record) => subtypeOrText(record, "sentry")).length,
    taxingIceKnown: iceRecords.filter((record) => /tax|trace|pay|lose/.test(normalizedRecordText(record))).length,
    evidence: [`ice_records:${iceRecords.length}`],
  };
}

function buildCorpRemotePlanProfile(
  records: readonly CardCapabilityRecord[],
): CorpRemotePlanProfile {
  return {
    remoteProtectionToolsKnown: records.filter((record) =>
      record.roles.some((role) => role.includes("remote") || role.includes("ice")) ||
      record.type === "ice",
    ).length,
    remoteEconomyToolsKnown: records.filter((record) =>
      record.roles.some((role) => role.includes("economy_asset")) ||
      /asset.*credit|campaign|bank/.test(normalizedRecordText(record)),
    ).length,
    ambushToolsKnown: records.filter((record) =>
      record.roles.includes("ambush") || record.subtypes.includes("ambush"),
    ).length,
    evidence: ["corp_remote_profile:conservative"],
  };
}

function normalizedRecordText(record: CardCapabilityRecord): string {
  return [
    record.cardId,
    record.title,
    record.type,
    ...record.subtypes,
    record.text,
    ...record.roles,
    ...record.planRoles,
  ].join(" ").toLowerCase();
}

function capabilitySourceEvidence(input: {
  structured: boolean;
  roleBased: boolean;
}): string[] {
  if (input.structured) return ["capability_source:structured"];
  if (input.roleBased) return ["capability_source:role_or_subtype"];
  return ["capability_source:text_fallback", "text_fallback:transition_only"];
}

function actionSourceMatchesRecord(
  action: LegalAction,
  record: CardCapabilityRecord,
): boolean {
  const source = String(action.source);
  const payloadCardId =
    typeof action.payload?.cardId === "string"
      ? action.payload.cardId
      : undefined;
  return record.visibleCards.some(
    (card) => card.instanceId === source || card.instanceId === payloadCardId,
  ) ||
    source === record.cardId ||
    payloadCardId === record.cardId ||
    action.payload?.sourceCardId === record.cardId;
}

function actionMatchesBankBuild(
  action: LegalAction,
  record: CardCapabilityRecord,
): boolean {
  if (!actionSourceMatchesRecord(action, record)) return false;
  return action.payload?.cardImplementationAddsHostedCredits === true;
}

function actionMatchesBankCashOut(
  action: LegalAction,
  record: CardCapabilityRecord,
): boolean {
  if (!actionSourceMatchesRecord(action, record)) return false;
  return action.payload?.cardImplementationTakesHostedCredits === true;
}

function currentVisibleBankAmount(cards: readonly VisibleCard[]): number | undefined {
  const values = cards.flatMap((card) => [
    ...(card.counterDisplays ?? [])
      .filter((counter) =>
        counter.creditPool?.kind === "stored_credit" ||
        counter.creditPool?.kind === "recurring_credit" ||
        counter.displayKind === "stored_credits" ||
        counter.displayKind === "recurring_credit",
      )
      .map((counter) => counter.amount),
    ...(card.counters?.recurring_credit !== undefined
      ? [card.counters.recurring_credit]
      : []),
  ]);
  if (values.length === 0) return undefined;
  return values.reduce((sum, value) => sum + value, 0);
}

function maxKnownBankCapacity(text: string): Pick<EconomyBankTool, "maxKnownCapacity"> {
  const match = text.match(/put\s+(?:\[(\d+)\]|(\d+))/i);
  const value = Number(match?.[1] ?? match?.[2] ?? NaN);
  return Number.isFinite(value) ? { maxKnownCapacity: value } : {};
}

function runtimeNumber(
  cardId: string,
  key: "installCost" | "memoryCost" | "strength" | "memoryLimitBonus",
): { [K in typeof key]?: number } {
  const value =
    key === "memoryLimitBonus"
      ? undefined
      : RUNTIME_CARDS[cardId]?.numeric[key];
  return typeof value === "number" ? { [key]: value } : {};
}

function primaryStatus(locations: readonly CapabilityCardStatus[]): CapabilityCardStatus {
  if (locations.includes("installed")) return "installed";
  if (locations.includes("in_hand")) return "in_hand";
  if (locations.includes("in_deck")) return "in_deck";
  if (locations.includes("discarded")) return "discarded";
  if (locations.includes("scored")) return "scored";
  return "unavailable";
}

function subtypeOrText(record: CardCapabilityRecord, ...needles: string[]): boolean {
  const text = normalizedRecordText(record);
  return needles.some((needle) =>
    record.subtypes.some((subtype) => subtype.toLowerCase() === needle) ||
    text.includes(needle),
  );
}

function countRoleMatches(roleText: string, roles: readonly string[]): number {
  return roles.reduce((sum, role) => sum + (roleText.includes(role) ? 1 : 0), 0);
}

function compareBreakerCapabilities(
  left: BreakerCapability,
  right: BreakerCapability,
): number {
  return confidenceRank(right.confidence) - confidenceRank(left.confidence) ||
    right.coverage.length - left.coverage.length ||
    left.cardId.localeCompare(right.cardId);
}

function confidenceRank(confidence: DeckCapabilityConfidence): number {
  switch (confidence) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
  }
}

function sortedUnique<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort();
}
