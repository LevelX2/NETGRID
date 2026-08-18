import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  Side,
  VisibleCard,
} from "@netgrid/shared";
import { AI_HINTS_BY_CARD, RUNTIME_CARDS } from "./ai-hints";
import type { AiDeckStrategyDeckSnapshot } from "./deck-strategy-snapshot";
import { rolesMatch } from "./runtime/role-match";
import {
  estimateBreakerCostProfileFromOntology,
  getStructuredBreakerProfileForCard,
} from "./breaker-ontology-consumer";
import type {
  AiHintStructuredEffect,
  KnownHintBreakerCoverage,
} from "./hint-ontology";
import type { AiHintActionPlanOwnerBinding } from "./action-plan-owner-contracts";
import { runnerEffectsProvideMultiaccess } from "./runner-canonical-hint-semantics";
import { exactBankCashOutPayout } from "./actions/action-economy-projection";

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
  sourceCardInstanceId?: string;
  title: string;
  ownerSide: Side;
  status: CapabilityCardStatus;
  currentBankAmount?: number;
  currentBankAmounts?: number[];
  portfolioStoredAmount?: number;
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
  deckSnapshot?: AiDeckStrategyDeckSnapshot;
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
  effects: AiHintStructuredEffect[];
  actionPlanOwnerBindings: AiHintActionPlanOwnerBinding[];
  quantityKnownInDeck: number;
  locations: CapabilityCardStatus[];
  visibleCards: VisibleCard[];
};

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
  deckSnapshot?: AiDeckStrategyDeckSnapshot,
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
    const bankFacts =
      profile.runner.economyBankTools.length > 0
        ? [
            `bank_tool_count:${profile.runner.economyBankTools.length}`,
            `bank_tool_legal:${profile.runner.economyBankTools.some((tool) => tool.buildActionLegal || tool.cashOutActionLegal)}`,
          ]
        : ["bank_tool_count:0"];
    return [
      ...breakerFacts,
      ...bankFacts,
      ...profile.missingCapabilities
        .filter((capability) =>
          missingCapabilityKindHasCoverageSegment(capability.kind),
        )
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

function missingCapabilityKindHasCoverageSegment(kind: string): boolean {
  return rolesMatch([kind], ["coverage"]);
}

function buildRunnerDeckCapabilityProfile(
  params: BuildDeckCapabilityProfileParams,
  records: readonly CardCapabilityRecord[],
): DeckCapabilityProfile {
  const breakerInventory = records
    .map(breakerCapabilityFromRecord)
    .filter(
      (capability): capability is BreakerCapability => capability !== undefined,
    )
    .sort(compareBreakerCapabilities);
  const searchAccess = buildSearchAccessProfile(params, records);
  const breakerCoverageMatrix = buildBreakerCoverageMatrix(
    breakerInventory,
    searchAccess,
  );
  const economyBankTools = buildEconomyBankTools(params, records);
  const memoryProfile = buildMemoryCapabilityProfile(
    params.playerView,
    records,
  );
  const attackPlanProfile = buildRunnerAttackPlanProfile(records);
  const missingCapabilities = BREAKER_COVERAGES.filter(
    (coverage) => breakerCoverageMatrix[coverage].missing,
  ).map(
    (coverage) =>
      ({
        capabilityId: `runner.${coverage}_coverage`,
        kind: `${coverage}_coverage`,
        severity:
          coverage === "special" || coverage === "subtype_limited"
            ? "soft"
            : "hard",
        evidence: [`coverage_state:${coverage}:missing`],
      }) satisfies MissingCapability,
  );
  const confidence = params.deckSnapshot
    ? missingCapabilities.length === 0
      ? "high"
      : "medium"
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
    const record = recordFromDefinition(
      entry.cardId,
      params.side,
      entry.quantity,
    );
    if (record) byId.set(entry.cardId, record);
  }
  for (const visible of visibleRecords) {
    const cardId = visible.card.definitionId;
    if (!cardId) continue;
    const current =
      byId.get(cardId) ?? recordFromVisibleCard(visible.card, params.side);
    if (!current) continue;
    byId.set(cardId, {
      ...current,
      locations: sortedUnique([...current.locations, visible.location]),
      visibleCards: [...current.visibleCards, visible.card],
    });
  }
  return [...byId.values()]
    .map((record) => reconcileKnownDeckRemainder(record))
    .sort((left, right) => left.cardId.localeCompare(right.cardId));
}

function reconcileKnownDeckRemainder(
  record: CardCapabilityRecord,
): CardCapabilityRecord {
  const knownOutsideDeckCount = new Set(
    record.visibleCards.map((card) => card.instanceId),
  ).size;
  const remainingPossibleInDeck = Math.max(
    0,
    record.quantityKnownInDeck - knownOutsideDeckCount,
  );
  return {
    ...record,
    quantityKnownInDeck: remainingPossibleInDeck,
    locations: sortedUnique([
      ...record.locations.filter((location) => location !== "in_deck"),
      ...(remainingPossibleInDeck > 0 ? (["in_deck"] as const) : []),
    ]),
  };
}

function recordFromDefinition(
  cardId: string,
  side: Side,
  quantityKnownInDeck: number,
): CardCapabilityRecord | undefined {
  const definition = RUNTIME_CARDS[cardId];
  if (!definition || definition.side !== side) return undefined;
  const hint = AI_HINTS_BY_CARD.get(cardId);
  return {
    cardId,
    title: definition.title,
    side,
    type: definition.type,
    subtypes: [...definition.subtypes],
    text: definition.text,
    roles: [...(hint?.roles ?? [])],
    planRoles: [...(hint?.planRoles ?? [])],
    effects: [...(hint?.effects ?? [])],
    actionPlanOwnerBindings: [...(hint?.actionPlanOwnerBindings ?? [])],
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
  const hint = AI_HINTS_BY_CARD.get(cardId);
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
    roles: [...(hint?.roles ?? [])],
    planRoles: [...(hint?.planRoles ?? [])],
    effects: [...(hint?.effects ?? [])],
    actionPlanOwnerBindings: [...(hint?.actionPlanOwnerBindings ?? [])],
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
  const records: Array<{ card: VisibleCard; location: CapabilityCardStatus }> =
    [
      ...playerView.own.gripOrHq.map((card) => ({
        card,
        location: "in_hand" as const,
      })),
      ...(playerView.own.rig ?? []).map((card) => ({
        card,
        location: "installed" as const,
      })),
      ...playerView.own.heapOrArchives.map((card) => ({
        card,
        location: "discarded" as const,
      })),
      ...playerView.own.scoreArea.map((card) => ({
        card,
        location: "scored" as const,
      })),
      ...(playerView.specialZones?.setAside ?? []).map((card) => ({
        card,
        location: "unavailable" as const,
      })),
      ...(playerView.specialZones?.removedFromGame ?? []).map((card) => ({
        card,
        location: "unavailable" as const,
      })),
    ];
  if (side === "corp") {
    records.push(
      ...playerView.servers.flatMap((server) => [
        ...server.ice.map((card) => ({ card, location: "installed" as const })),
        ...server.root.map((card) => ({
          card,
          location: "installed" as const,
        })),
      ]),
    );
  }
  return records.filter(
    ({ card }) =>
      card.known !== false || card.owner === side || card.controller === side,
  );
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
  const hint = AI_HINTS_BY_CARD.get(record.cardId);
  const roleBasedBreaker =
    rolesMatch(record.roles, ["breaker_"]) ||
    record.subtypes.some((subtype) =>
      deckCapabilityTokensIncludeAny(deckCapabilityTextTokens(subtype), [
        "icebreaker",
        "fracter",
        "decoder",
        "killer",
      ]),
    );
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
    ...(breakerProfile?.breakCost !== undefined
      ? { breakCost: breakerProfile.breakCost }
      : {}),
    ...(breakerProfile?.pumpCost !== undefined
      ? { pumpCost: breakerProfile.pumpCost }
      : {}),
    risks: sortedUnique([
      ...(breakerProfile?.sideEffects ?? []),
      ...(hint?.functionSignals?.includes("breaker.self_trash_risk") === true
        ? ["self_trash"]
        : []),
      ...(costProfile && costProfile.sideEffectPenalty > 0
        ? ["side_effect_penalty"]
        : []),
    ]),
    restrictions: sortedUnique([...(breakerProfile?.restrictions ?? [])]),
    quantityKnownInDeck: record.quantityKnownInDeck,
    locations: sortedUnique(
      record.locations.length > 0 ? record.locations : ["unavailable"],
    ),
    confidence,
    evidence: [
      ...capabilitySourceEvidence({
        structured: Boolean(breakerProfile),
        roleBased: roleBasedBreaker,
      }),
      breakerProfile
        ? "breaker_profile:structured"
        : `breaker_profile:${confidence}`,
      ...coverage.map((entry) => `coverage:${entry}`),
    ],
  };
}

function breakerCoverageForRecord(
  record: CardCapabilityRecord,
): BreakerCoverageKind[] {
  const hintCoverage =
    getStructuredBreakerProfileForCard(record.cardId)?.coverage ?? [];
  const coverage = new Set<BreakerCoverageKind>(
    hintCoverage
      .map(mapHintCoverage)
      .filter((entry): entry is BreakerCoverageKind => Boolean(entry)),
  );
  const haystack = normalizedRecordText(record);
  const tokens = deckCapabilityTextTokens(haystack);
  for (const role of [...record.roles, ...record.planRoles]) {
    if (role === "breaker_fracter") coverage.add("wall");
    if (role === "breaker_decoder") coverage.add("code_gate");
    if (role === "breaker_killer") coverage.add("sentry");
  }
  if (deckCapabilityTokensIncludeAny(tokens, ["fracter", "wall", "barrier"]))
    coverage.add("wall");
  if (
    deckCapabilityTokensIncludeAny(tokens, ["decoder", "codegate"]) ||
    deckCapabilityTokensIncludePhrase(tokens, ["code", "gate"])
  )
    coverage.add("code_gate");
  if (deckCapabilityTokensIncludeAny(tokens, ["killer", "sentry"]))
    coverage.add("sentry");
  if (
    deckCapabilityTokensIncludeAny(tokens, ["ap"]) ||
    deckCapabilityTokensIncludePhrase(tokens, ["anti", "personnel"]) ||
    deckCapabilityTokensIncludePhrase(tokens, ["net", "damage"]) ||
    deckCapabilityTokensIncludePhrase(tokens, ["meat", "damage"])
  )
    coverage.add("ap");
  if (deckCapabilityTokensIncludeAny(tokens, ["trace", "traces"]))
    coverage.add("trace");
  if (deckCapabilityTokensLookLikeBreakSubroutine(tokens)) {
    coverage.add(coverage.size > 0 ? "subtype_limited" : "special");
  }
  if (
    coverage.size === 0 &&
    (record.subtypes.some((subtype) =>
      deckCapabilityTokensIncludeAny(deckCapabilityTextTokens(subtype), [
        "icebreaker",
      ]),
    ) ||
      [...record.roles, ...record.planRoles].some(
        (role) =>
          role === "icebreaker" ||
          role === "universal_breaker" ||
          role.startsWith("breaker_"),
      ))
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
      const matching = breakerInventory.filter(
        (breaker) =>
          breakerHasCoverage(breaker, coverage) ||
          breakerHasCoverage(breaker, "universal"),
      );
      const installed = matching.some((breaker) =>
        breakerHasLocation(breaker, "installed"),
      );
      const inHand = matching.some((breaker) =>
        breakerHasLocation(breaker, "in_hand"),
      );
      const inHeapOrArchives = matching.some((breaker) =>
        breakerHasLocation(breaker, "discarded"),
      );
      const inDeckKnown = matching.some(
        (breaker) => breaker.quantityKnownInDeck > 0,
      );
      const searchableNow =
        inDeckKnown &&
        (searchAccess.canSearchBreakersNow ||
          searchAccess.canSearchProgramsNow);
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
  state: Pick<
    CoverageState,
    "installed" | "inHand" | "inDeckKnown" | "searchableNow"
  >,
): string[] {
  if (state.installed) return [];
  if (state.inHand) return ["not_installed"];
  if (state.searchableNow) return ["needs_search_action"];
  if (state.inDeckKnown) return ["draw_only"];
  return [`missing_${coverage}_coverage`];
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
    canSearchProgramsNow: tools.some(
      (tool) => tool.canSearchPrograms && tool.legalNow,
    ),
    canSearchBreakersNow: tools.some(
      (tool) => tool.canSearchBreakers && tool.legalNow,
    ),
    evidence: tools.flatMap((tool) =>
      tool.legalNow ? [`search_tool_legal:${tool.status}`] : [],
    ),
  };
}

function searchAccessToolForRecord(
  params: BuildDeckCapabilityProfileParams,
  record: CardCapabilityRecord,
): SearchAccessTool | undefined {
  const text = normalizedRecordRulesTextWithoutRoles(record);
  const roleSignals = [...record.roles, ...record.planRoles];
  const genericStackSearch =
    deckCapabilityTextHasStackSearchSignal(text) ||
    rolesMatch(roleSignals, ["stack_search"]);
  const canSearchPrograms =
    genericStackSearch ||
    deckCapabilityTextHasProgramSearchSignal(text) ||
    rolesMatch(roleSignals, ["program_search", "breaker_search"]);
  const canSearchBreakers =
    genericStackSearch ||
    canSearchPrograms ||
    deckCapabilityTextHasBreakerSearchSignal(text) ||
    rolesMatch(roleSignals, ["breaker_search"]);
  if (!canSearchPrograms && !canSearchBreakers) return undefined;
  const status = primaryStatus(record.locations);
  const structuredSearch = rolesMatch(roleSignals, [
    "program_search",
    "breaker_search",
    "stack_search",
    "search",
  ]);
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
    confidence:
      deckCapabilityTextHasHighConfidenceSearchSignal(text) || structuredSearch
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

function normalizedRecordTextWithoutRoles(
  record: CardCapabilityRecord,
): string {
  return [
    record.cardId,
    record.title,
    record.type,
    ...record.subtypes,
    record.text,
  ]
    .join(" ")
    .toLowerCase();
}

function normalizedRecordRulesTextWithoutRoles(
  record: CardCapabilityRecord,
): string {
  return [record.type, ...record.subtypes, record.text].join(" ").toLowerCase();
}

function buildEconomyBankTools(
  params: BuildDeckCapabilityProfileParams,
  records: readonly CardCapabilityRecord[],
): EconomyBankTool[] {
  return records
    .flatMap((record) => economyBankToolsForRecord(params, record))
    .filter((tool): tool is EconomyBankTool => tool !== undefined)
    .sort(
      (left, right) =>
        left.cardId.localeCompare(right.cardId) ||
        (left.sourceCardInstanceId ?? "").localeCompare(
          right.sourceCardInstanceId ?? "",
        ),
    );
}

function economyBankToolsForRecord(
  params: BuildDeckCapabilityProfileParams,
  record: CardCapabilityRecord,
): EconomyBankTool[] {
  if (recordHasRunOnlyEconomyPool(record)) return [];
  const text = normalizedRecordText(record);
  const signals = [...record.roles, ...record.planRoles]
    .join(" ")
    .toLowerCase();
  const canonicalRunnerBank = recordHasCanonicalRunnerCreditBank(record);
  if (
    record.side === "runner"
      ? !canonicalRunnerBank
      : !deckCapabilityTextHasBankToolSignal(`${text} ${signals}`)
  ) {
    return [];
  }
  const visibleInstances = visibleCardRecords(
    params.playerView,
    params.side,
  ).filter(({ card }) => card.definitionId === record.cardId);
  if (visibleInstances.length > 0) {
    return visibleInstances.map(({ card, location }) =>
      economyBankToolForRecord(params, record, {
        card,
        location,
      }),
    );
  }
  return [economyBankToolForRecord(params, record)];
}

function economyBankToolForRecord(
  params: BuildDeckCapabilityProfileParams,
  record: CardCapabilityRecord,
  visibleInstance?: {
    card: VisibleCard;
    location: CapabilityCardStatus;
  },
): EconomyBankTool {
  const text = normalizedRecordText(record);
  const signals = [...record.roles, ...record.planRoles]
    .join(" ")
    .toLowerCase();
  const canonicalRunnerBank = recordHasCanonicalRunnerCreditBank(record);
  const buildActionIds = (params.legalActions ?? [])
    .filter((action) =>
      actionMatchesBankBuild(action, record, visibleInstance?.card),
    )
    .map((action) => action.actionId)
    .sort();
  const cashOutActions = (params.legalActions ?? []).filter((action) =>
    actionMatchesBankCashOut(action, record, visibleInstance?.card),
  );
  const cashOutActionIds = cashOutActions
    .map((action) => action.actionId)
    .sort();
  const buildActionLegal = buildActionIds.length > 0;
  const cashOutActionLegal = cashOutActionIds.length > 0;
  const currentBankAmounts = currentVisibleBankAmounts(
    visibleInstance ? [visibleInstance.card] : record.visibleCards,
  );
  const currentBankAmount =
    currentBankAmounts.length > 0 ? Math.max(...currentBankAmounts) : undefined;
  const portfolioStoredAmount =
    currentBankAmounts.length > 0
      ? currentBankAmounts.reduce((sum, amount) => sum + amount, 0)
      : undefined;
  const estimatedPayout = Math.max(
    0,
    ...cashOutActions.map((action) => exactBankCashOutPayout(action) ?? 0),
  );
  const structuredBank =
    canonicalRunnerBank ||
    deckCapabilityTextHasStructuredBankRoleSignal(signals) ||
    currentBankAmount !== undefined;
  return {
    cardId: record.cardId,
    ...(visibleInstance
      ? { sourceCardInstanceId: visibleInstance.card.instanceId }
      : {}),
    title: record.title,
    ownerSide: record.side,
    status: visibleInstance?.location ?? primaryStatus(record.locations),
    ...(currentBankAmount !== undefined ? { currentBankAmount } : {}),
    ...(currentBankAmounts.length > 0 ? { currentBankAmounts } : {}),
    ...(portfolioStoredAmount !== undefined ? { portfolioStoredAmount } : {}),
    buildActionLegal,
    cashOutActionLegal,
    buildActionIds,
    cashOutActionIds,
    ...(cashOutActionLegal && estimatedPayout > 0 ? { estimatedPayout } : {}),
    confidence:
      canonicalRunnerBank ||
      deckCapabilityTextHasHighConfidenceBankSignal(`${text} ${signals}`)
        ? "high"
        : "medium",
    evidence: [
      ...capabilitySourceEvidence({
        structured: structuredBank,
        roleBased: record.roles.length > 0 || record.planRoles.length > 0,
      }),
      ...(visibleInstance
        ? [`bank_source_instance:${visibleInstance.card.instanceId}`]
        : []),
      `bank_status:${visibleInstance?.location ?? primaryStatus(record.locations)}`,
      buildActionLegal ? "bank_build_legal:true" : "bank_build_legal:false",
      cashOutActionLegal
        ? "bank_cashout_legal:true"
        : "bank_cashout_legal:false",
    ],
  };
}

function recordHasCanonicalRunnerCreditBank(
  record: CardCapabilityRecord,
): boolean {
  const hasBuildOwner = record.actionPlanOwnerBindings.some(
    (binding) =>
      binding.owner === "runner.credit_bank" && binding.route === "build",
  );
  const hasCashOutOwner = record.actionPlanOwnerBindings.some(
    (binding) =>
      binding.owner === "runner.credit_bank" && binding.route === "cash_out",
  );
  const hasAutomaticCashOut = record.effects.some(
    (effect) =>
      effect.kind === "counter_economy" &&
      effect.scope === "runner" &&
      effect.resource === "credits" &&
      effect.economyMode === "bank_cashout",
  );
  const hasAutomaticInitialLoad = record.effects.some(
    (effect) =>
      effect.kind === "finite_economy_pool" &&
      effect.scope === "runner" &&
      effect.timing === "install" &&
      effect.resource === "credits" &&
      effect.target === "economy.hosted_credit_bank" &&
      effect.economyMode === "fixed_pool" &&
      effect.finite === true,
  );
  return (
    record.side === "runner" &&
    (hasBuildOwner || hasAutomaticInitialLoad) &&
    (hasCashOutOwner || hasAutomaticCashOut)
  );
}

function recordHasRunOnlyEconomyPool(record: CardCapabilityRecord): boolean {
  return record.effects.some(
    (effect) =>
      effect.kind === "finite_economy_pool" &&
      effect.timing === "during_run" &&
      effect.target === "run_credit_pool",
  );
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
  const memoryToolsKnown = records.filter((record) => {
    const runtimeMemoryLimitBonus = runtimeNumber(
      record.cardId,
      "memoryLimitBonus",
    ).memoryLimitBonus;
    return (
      record.type === "hardware" &&
      (deckCapabilityTextHasMemoryToolSignal(normalizedRecordText(record)) ||
        runtimeMemoryLimitBonus !== undefined)
    );
  }).length;
  return {
    ...(memoryUsed !== undefined ? { memoryUsed } : {}),
    ...(memoryLimit !== undefined ? { memoryLimit } : {}),
    ...(memoryAvailable !== undefined ? { memoryAvailable } : {}),
    memoryToolsKnown,
    missingMemoryPressure:
      memoryAvailable !== undefined && memoryAvailable <= 0,
    evidence: [
      ...(memoryAvailable !== undefined
        ? [`memory_available:${memoryAvailable}`]
        : []),
      `memory_tools_known:${memoryToolsKnown}`,
    ],
  };
}

function buildRunnerAttackPlanProfile(
  records: readonly CardCapabilityRecord[],
): RunnerAttackPlanProfile {
  const centralPressureToolsKnown = records.filter(
    (record) =>
      runnerEffectsProvideMultiaccess(record.effects) ||
      rolesMatch(record.roles, ["pressure_rnd", "pressure_hq"]),
  ).length;
  const remoteContestToolsKnown = records.filter(
    (record) =>
      rolesMatch(record.roles, ["remote_contest", "trash_support"]) ||
      (rolesMatch(record.planRoles, ["contest_remote"]) &&
        record.effects.some((effect) => {
          const target = (
            effect as AiHintStructuredEffect & { target?: string }
          ).target;
          return (
            effect.kind === "future_run_effect" &&
            effect.scope === "runner" &&
            target === "make_run"
          );
        })),
  ).length;
  const setupToolsKnown = records.filter(
    (record) =>
      rolesMatch(record.roles, ["setup"]) ||
      record.roles.some((role) => role === "runner_program"),
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
  const agendaToolsKnown = records.filter(
    (record) => record.type === "agenda",
  ).length;
  const advanceToolsKnown = records.filter((record) =>
    deckCapabilityTextHasCorpAdvanceSignal(normalizedRecordText(record)),
  ).length;
  const scoreSupportToolsKnown = records.filter(
    (record) =>
      rolesMatch(record.roles, ["score"]) ||
      deckCapabilityTextHasCorpScoreSignal(
        normalizedRecordTextWithoutRoles(record),
      ),
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
  const iceKnownInDeck = records.filter(
    (record) => record.type === "ice",
  ).length;
  const rezEconomyToolsKnown = records.filter(
    (record) =>
      deckCapabilityTextHasCorpRezEconomySignal(normalizedRecordText(record)) &&
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
    barrierIceKnown: iceRecords.filter((record) =>
      subtypeOrText(record, "wall", "barrier"),
    ).length,
    codeGateIceKnown: iceRecords.filter((record) =>
      subtypeOrText(record, "code_gate", "code gate"),
    ).length,
    sentryIceKnown: iceRecords.filter((record) =>
      subtypeOrText(record, "sentry"),
    ).length,
    taxingIceKnown: iceRecords.filter((record) =>
      deckCapabilityTextHasCorpTaxingIceSignal(normalizedRecordText(record)),
    ).length,
    evidence: [`ice_records:${iceRecords.length}`],
  };
}

function buildCorpRemotePlanProfile(
  records: readonly CardCapabilityRecord[],
): CorpRemotePlanProfile {
  return {
    remoteProtectionToolsKnown: records.filter(
      (record) =>
        rolesMatch(record.roles, ["remote", "ice"]) || record.type === "ice",
    ).length,
    remoteEconomyToolsKnown: records.filter(
      (record) =>
        rolesMatch(record.roles, ["economy_asset"]) ||
        deckCapabilityTextHasCorpRemoteEconomySignal(
          normalizedRecordTextWithoutRoles(record),
          record.type,
        ),
    ).length,
    ambushToolsKnown: records.filter(
      (record) =>
        rolesMatch(record.roles, ["ambush"]) ||
        record.subtypes.some((subtype) => subtype.toLowerCase() === "ambush"),
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
  ]
    .join(" ")
    .toLowerCase();
}

function deckCapabilityTextTokens(text: string): string[] {
  return text
    .toLocaleLowerCase("en-US")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function deckCapabilityTokensIncludeAny(
  tokens: readonly string[],
  needles: readonly string[],
): boolean {
  const tokenSet = new Set(tokens);
  return needles.some((needle) => tokenSet.has(needle));
}

function deckCapabilityTokensIncludePhrase(
  tokens: readonly string[],
  phrase: readonly string[],
): boolean {
  return tokens.some((_, index) =>
    phrase.every((token, offset) => tokens[index + offset] === token),
  );
}

function deckCapabilityTokensLookLikeBreakSubroutine(
  tokens: readonly string[],
): boolean {
  for (const [index, token] of tokens.entries()) {
    if (token !== "break" && token !== "breaks") continue;
    for (
      let cursor = index + 1;
      cursor < Math.min(tokens.length, index + 9);
      cursor += 1
    ) {
      if (tokens[cursor] === "subroutine") return true;
    }
  }
  return false;
}

function deckCapabilityTextHasProgramSearchSignal(text: string): boolean {
  const tokens = deckCapabilityTextTokens(text);
  return (
    deckCapabilityTokensIncludePhrase(tokens, ["program", "search"]) ||
    deckCapabilityTokensIncludePhrase(tokens, ["setup", "program", "search"]) ||
    deckCapabilityTokensIncludeInOrder(tokens, "search", "program") ||
    deckCapabilityTokensIncludePhrase(tokens, [
      "search",
      "your",
      "stack",
      "for",
      "a",
      "program",
    ])
  );
}

function deckCapabilityTextHasStackSearchSignal(text: string): boolean {
  const tokens = deckCapabilityTextTokens(text);
  return (
    deckCapabilityTokensIncludePhrase(tokens, ["search", "your", "stack"]) ||
    deckCapabilityTokensIncludePhrase(tokens, ["search", "the", "stack"])
  );
}

function deckCapabilityTextHasBreakerSearchSignal(text: string): boolean {
  const tokens = deckCapabilityTextTokens(text);
  return (
    deckCapabilityTokensIncludePhrase(tokens, ["breaker", "search"]) ||
    deckCapabilityTokensIncludeInOrder(tokens, "search", "breaker")
  );
}

function deckCapabilityTextHasHighConfidenceSearchSignal(
  text: string,
): boolean {
  const tokens = deckCapabilityTextTokens(text);
  return (
    deckCapabilityTokensIncludePhrase(tokens, ["program", "search"]) ||
    deckCapabilityTokensIncludePhrase(tokens, ["breaker", "search"]) ||
    deckCapabilityTokensIncludePhrase(tokens, ["search", "your", "stack"])
  );
}

function deckCapabilityTextHasBankToolSignal(text: string): boolean {
  const tokens = deckCapabilityTextTokens(text);
  return (
    deckCapabilityTokensIncludeAny(tokens, ["broker", "bank"]) ||
    deckCapabilityTokensIncludePhrase(tokens, ["stored", "credits"]) ||
    deckCapabilityTokensIncludePhrase(tokens, [
      "temporary",
      "resource",
      "bank",
    ]) ||
    deckCapabilityTokensIncludePhrase(tokens, ["counter", "bank"])
  );
}

function deckCapabilityTextHasStructuredBankRoleSignal(text: string): boolean {
  const tokens = deckCapabilityTextTokens(text);
  return (
    deckCapabilityTokensIncludePhrase(tokens, [
      "temporary",
      "resource",
      "bank",
    ]) || deckCapabilityTokensIncludePhrase(tokens, ["counter", "bank"])
  );
}

function deckCapabilityTextHasHighConfidenceBankSignal(text: string): boolean {
  const tokens = deckCapabilityTextTokens(text);
  return (
    deckCapabilityTokensIncludeAny(tokens, ["broker"]) ||
    deckCapabilityTokensIncludePhrase(tokens, [
      "temporary",
      "resource",
      "bank",
    ]) ||
    deckCapabilityTokensIncludePhrase(tokens, ["counter", "bank"])
  );
}

function deckCapabilityTextHasMemoryToolSignal(text: string): boolean {
  return deckCapabilityTokensIncludeAny(deckCapabilityTextTokens(text), [
    "memory",
    "mu",
  ]);
}

function deckCapabilityTextHasCorpAdvanceSignal(text: string): boolean {
  return deckCapabilityTokensIncludeAny(deckCapabilityTextTokens(text), [
    "advance",
    "advancement",
  ]);
}

function deckCapabilityTextHasCorpScoreSignal(text: string): boolean {
  return deckCapabilityTokensIncludeAny(deckCapabilityTextTokens(text), [
    "score",
    "agenda",
  ]);
}

function deckCapabilityTextHasCorpRezEconomySignal(text: string): boolean {
  return deckCapabilityTokensIncludeAny(deckCapabilityTextTokens(text), [
    "rez",
    "economy",
    "credits",
  ]);
}

function deckCapabilityTextHasCorpTaxingIceSignal(text: string): boolean {
  return deckCapabilityTokensIncludeAny(deckCapabilityTextTokens(text), [
    "tax",
    "trace",
    "pay",
    "lose",
  ]);
}

function deckCapabilityTextHasCorpRemoteEconomySignal(
  text: string,
  cardType: string | undefined,
): boolean {
  const tokens = deckCapabilityTextTokens(text);
  return (
    (cardType === "asset" &&
      deckCapabilityTokensIncludeAny(tokens, ["credit", "credits"])) ||
    deckCapabilityTokensIncludeAny(tokens, ["campaign", "bank"])
  );
}

function deckCapabilityTokensIncludeInOrder(
  tokens: readonly string[],
  first: string,
  second: string,
): boolean {
  const firstIndex = tokens.indexOf(first);
  return firstIndex >= 0 && tokens.indexOf(second, firstIndex + 1) >= 0;
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
  return (
    record.visibleCards.some(
      (card) => card.instanceId === source || card.instanceId === payloadCardId,
    ) ||
    source === record.cardId ||
    payloadCardId === record.cardId ||
    action.payload?.sourceCardId === record.cardId
  );
}

function actionMatchesBankBuild(
  action: LegalAction,
  record: CardCapabilityRecord,
  visibleCard?: VisibleCard,
): boolean {
  if (
    !(visibleCard
      ? actionSourceMatchesVisibleCard(action, visibleCard)
      : actionSourceMatchesRecord(action, record))
  )
    return false;
  return action.payload?.cardImplementationAddsHostedCredits === true;
}

function actionMatchesBankCashOut(
  action: LegalAction,
  record: CardCapabilityRecord,
  visibleCard?: VisibleCard,
): boolean {
  if (
    !(visibleCard
      ? actionSourceMatchesVisibleCard(action, visibleCard)
      : actionSourceMatchesRecord(action, record))
  )
    return false;
  return action.payload?.cardImplementationTakesHostedCredits === true;
}

function actionSourceMatchesVisibleCard(
  action: LegalAction,
  card: VisibleCard,
): boolean {
  return (
    action.source === card.instanceId ||
    action.payload?.cardId === card.instanceId ||
    action.abilityRef?.sourceCardInstanceId === card.instanceId
  );
}

function currentVisibleBankAmounts(cards: readonly VisibleCard[]): number[] {
  return cards
    .map((card) => {
      const values = [
        ...(card.counterDisplays ?? [])
          .filter(
            (counter) =>
              counter.creditPool?.kind === "stored_credit" ||
              counter.creditPool?.kind === "recurring_credit" ||
              counter.displayKind === "stored_credits" ||
              counter.displayKind === "recurring_credit",
          )
          .map((counter) => counter.amount),
        ...(card.counters?.recurring_credit !== undefined
          ? [card.counters.recurring_credit]
          : []),
      ];
      return values.length > 0 ? Math.max(...values) : undefined;
    })
    .filter((value): value is number => value !== undefined)
    .sort((left, right) => right - left);
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

function primaryStatus(
  locations: readonly CapabilityCardStatus[],
): CapabilityCardStatus {
  const locationSet = new Set(locations);
  if (locationSet.has("installed")) return "installed";
  if (locationSet.has("in_hand")) return "in_hand";
  if (locationSet.has("in_deck")) return "in_deck";
  if (locationSet.has("discarded")) return "discarded";
  if (locationSet.has("scored")) return "scored";
  return "unavailable";
}

function breakerHasCoverage(
  breaker: BreakerCapability,
  coverage: BreakerCoverageKind,
): boolean {
  return new Set(breaker.coverage).has(coverage);
}

function breakerHasLocation(
  breaker: BreakerCapability,
  location: CapabilityCardStatus,
): boolean {
  return new Set(breaker.locations).has(location);
}

function subtypeOrText(
  record: CardCapabilityRecord,
  ...needles: string[]
): boolean {
  const textTokens = deckCapabilityTextTokens(normalizedRecordText(record));
  return needles.some(
    (needle) =>
      record.subtypes.some((subtype) => subtype.toLowerCase() === needle) ||
      deckCapabilityTokensIncludePhrase(
        textTokens,
        deckCapabilityTextTokens(needle),
      ),
  );
}

function compareBreakerCapabilities(
  left: BreakerCapability,
  right: BreakerCapability,
): number {
  return (
    confidenceRank(right.confidence) - confidenceRank(left.confidence) ||
    right.coverage.length - left.coverage.length ||
    left.cardId.localeCompare(right.cardId)
  );
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
