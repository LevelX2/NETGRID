import { CARD_DEFINITIONS_BY_ID } from "../../card-definition-compatibility";
import {
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";
import { RUNTIME_CARDS } from "../../ai-hints";
import { semanticRuntimeCorpCentralPressureAssessment } from "../semantic-runtime-corp-central-pressure";
import { decisionDerivedValue } from "../decision-derived-cache";
import { readExactCurrentInstalledCorpIceRezQuote } from "../corp-exact-ice-rez-route";
import type {
  CorpScoringWindowAgendaStealSeverity,
  CorpScoringWindowAssessment,
  CorpScoringWindowHorizon,
  CorpScoringWindowKind,
  CorpScoringWindowNextStep,
  CorpServerLike,
  SemanticRuntimeCorpScoringWindowDependencies,
} from "./semantic-runtime-corp-scoring-window-contracts";
import {
  isAsciiLetterOrDigit,
  iceRunQuoteHasPotentialScoringProtection,
  scoringWindowAccessAssessment,
  scoringWindowPostRezProtectionAssessment,
  scoringWindowVisibleCardTextTokens,
  tokensIncludePhrase,
} from "./semantic-runtime-corp-scoring-window-runner-pressure";
import { SCORING_WINDOW_AI_HINTS_BY_CARD } from "./semantic-runtime-corp-scoring-window-card-data";
export {
  scoringWindowAccessAssessment,
  scoringWindowPostRezProtectionAssessment,
} from "./semantic-runtime-corp-scoring-window-runner-pressure";

const CORP_CENTRAL_PRESSURE_DECISION_CACHE_KEY = Symbol(
  "corp-central-pressure",
);

export function projectedRemoteServerForAction<TServer extends CorpServerLike>(
  input: AiDecisionInput,
  action: LegalAction,
  server: TServer | undefined,
  dependencies: SemanticRuntimeCorpScoringWindowDependencies<TServer>,
): CorpServerLike | undefined {
  if (action.type !== "install_card") {
    return server;
  }
  const sourceCard = dependencies.actionSourceCard?.(input, action);
  if (!sourceCard) return server;
  const projectedServerId =
    server?.id ?? dependencies.actionServerId(input, action);
  if (!projectedServerId) return undefined;
  if (action.payload?.placement !== "ice") {
    return {
      id: projectedServerId,
      ice: [...(server?.ice ?? [])],
      root: [...(server?.root ?? []), sourceCard],
    };
  }
  if (sourceCard.type !== "ice") return server;
  return {
    id: projectedServerId,
    ice: [...(server?.ice ?? []), sourceCard],
    root: [...(server?.root ?? [])],
  };
}

export function scoringWindowHorizon<TServer extends CorpServerLike>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoringWindowDependencies<TServer>,
): CorpScoringWindowHorizon {
  if (action.type === "score_agenda") return "immediate";
  if (dependencies.advanceCompletesScore(input, action)) return "immediate";
  if (action.type === "advance_card") {
    const sourceCard = dependencies.actionSourceCard?.(input, action);
    const requirement = scoringWindowAdvancementRequirement(sourceCard);
    if (typeof requirement !== "number") return "unknown";
    const currentCounters = Math.max(
      0,
      Math.floor(sourceCard?.advancementCounters ?? 0),
    );
    const advancesStillNeeded = Math.max(
      0,
      requirement - (currentCounters + 1),
    );
    // "immediate" is reserved for the current action completing the agenda.
    // Same-turn multi-action closeouts have their own action-economy consumer;
    // this projection asks whether the runner receives a contest window before
    // a later scoring chance.
    return advancesStillNeeded <= 3 ? "next_turn" : "slow";
  }
  if (action.type !== "install_card" || action.payload?.placement === "ice") {
    return "unknown";
  }
  const sourceCard = dependencies.actionSourceCard?.(input, action);
  const requirement = scoringWindowAdvancementRequirement(sourceCard);
  if (typeof requirement !== "number") return "unknown";
  const remainingCorpClicksAfterAction = Math.max(
    0,
    Math.floor(
      input.playerView.own.clicks - scoringWindowActionClickCost(action),
    ),
  );
  if (remainingCorpClicksAfterAction >= requirement) return "immediate";
  if (
    scoringWindowVisibleInTurnAdvancementBurstAvailable(
      input,
      action,
      sourceCard,
      requirement,
      remainingCorpClicksAfterAction,
      dependencies,
    )
  ) {
    return "immediate";
  }
  return requirement <= 3 ? "next_turn" : "slow";
}

function scoringWindowActionClickCost(action: LegalAction): number {
  const explicitClicks = (action.costs ?? []).reduce(
    (sum, cost) =>
      sum +
      (typeof cost.clicks === "number" && Number.isFinite(cost.clicks)
        ? Math.max(0, Math.floor(cost.clicks))
        : 0),
    0,
  );
  if (explicitClicks > 0) return explicitClicks;
  if (
    action.type === "install_card" ||
    action.type === "advance_card" ||
    action.type === "score_agenda" ||
    action.type === "play_operation" ||
    action.type === "gain_credit" ||
    action.type === "draw_card"
  ) {
    return 1;
  }
  return 0;
}

export function scoringWindowPreExposureAdvancementCreditReserve<
  TServer extends CorpServerLike,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoringWindowDependencies<TServer>,
  scoreHorizon: CorpScoringWindowHorizon,
  scoreLineAction: boolean,
): number {
  if (!scoreLineAction || scoreHorizon === "immediate") return 0;
  if (scoreHorizon !== "next_turn" && scoreHorizon !== "slow") return 0;
  if (action.type !== "advance_card") return 0;
  const sourceCard = dependencies.actionSourceCard?.(input, action);
  if (!sourceCard || sourceCard.type !== "agenda") return 0;
  const requirement = scoringWindowAdvancementRequirement(sourceCard);
  if (typeof requirement !== "number" || requirement <= 0) return 0;
  const currentCounters = Math.max(
    0,
    Math.floor(
      typeof sourceCard.advancementCounters === "number" &&
        Number.isFinite(sourceCard.advancementCounters)
        ? sourceCard.advancementCounters
        : 0,
    ),
  );
  const countersAfterAction =
    action.type === "advance_card" ? currentCounters + 1 : currentCounters;
  const advancesStillNeeded = Math.max(0, requirement - countersAfterAction);
  if (advancesStillNeeded <= 0) return 0;
  const remainingCorpClicksAfterAction = Math.max(
    0,
    Math.floor(
      input.playerView.own.clicks - scoringWindowActionClickCost(action),
    ),
  );
  return Math.min(remainingCorpClicksAfterAction, advancesStillNeeded);
}

function scoringWindowAdvancementRequirement(
  card: VisibleCard | undefined,
): number | undefined {
  if (!card) return undefined;
  if (
    typeof card.advancementRequirement === "number" &&
    Number.isFinite(card.advancementRequirement)
  ) {
    return Math.max(0, Math.floor(card.advancementRequirement));
  }
  const runtimeRequirement =
    card.definitionId !== undefined
      ? (
          RUNTIME_CARDS[card.definitionId] as
            | { numeric?: { advancementRequirement?: number | null } }
            | undefined
        )?.numeric?.advancementRequirement
      : undefined;
  if (
    typeof runtimeRequirement === "number" &&
    Number.isFinite(runtimeRequirement)
  ) {
    return Math.max(0, Math.floor(runtimeRequirement));
  }
  const demoRequirement =
    card.definitionId !== undefined
      ? CARD_DEFINITIONS_BY_ID[card.definitionId]?.advancementRequirement
      : undefined;
  if (typeof demoRequirement === "number" && Number.isFinite(demoRequirement)) {
    return Math.max(0, Math.floor(demoRequirement));
  }
  return undefined;
}

function scoringWindowVisibleInTurnAdvancementBurstAvailable<
  TServer extends CorpServerLike,
>(
  input: AiDecisionInput,
  action: LegalAction,
  sourceCard: VisibleCard | undefined,
  requirement: number,
  remainingCorpClicksAfterAction: number,
  dependencies: SemanticRuntimeCorpScoringWindowDependencies<TServer>,
): boolean {
  if (!sourceCard || sourceCard.type !== "agenda") return false;
  if (remainingCorpClicksAfterAction < 2) return false;
  const creditsAfterAction =
    input.playerView.own.credits - dependencies.actionCreditCost(action);
  return input.playerView.own.gripOrHq.some((card) => {
    if (card.known === false || card.instanceId === sourceCard.instanceId) {
      return false;
    }
    if (card.type !== "operation") return false;
    const burstCounters = scoringWindowVisibleAdvancementBurstAmount(card);
    if (burstCounters <= 0) return false;
    const operationCost = scoringWindowVisibleOperationCost(card);
    if (operationCost === undefined) return false;
    const basicAdvancesNeeded = Math.max(0, requirement - burstCounters);
    const clicksNeeded = 1 + basicAdvancesNeeded;
    const creditsNeeded = operationCost + basicAdvancesNeeded;
    return (
      remainingCorpClicksAfterAction >= clicksNeeded &&
      creditsAfterAction >= creditsNeeded
    );
  });
}

function scoringWindowVisibleAdvancementBurstAmount(card: VisibleCard): number {
  const structuredAmount = card.definitionId
    ? Math.max(
        0,
        ...(
          SCORING_WINDOW_AI_HINTS_BY_CARD.get(card.definitionId)?.effects ?? []
        )
          .filter(
            (effect) =>
              effect.timing === "action" &&
              effect.resource === "advancement_counters" &&
              (effect.kind === "advance_burst" ||
                effect.kind === "score_acceleration"),
          )
          .map((effect) => effect.amount ?? 0),
      )
    : 0;
  if (structuredAmount > 0) return structuredAmount;
  const tokens = scoringWindowVisibleCardTextTokens(card);
  const amountToken = tokens.find(
    (token, index) =>
      tokens[index - 1] === "add" &&
      tokens[index + 1] === "advancement" &&
      (tokens[index + 2] === "counter" || tokens[index + 2] === "counters"),
  );
  return scoringWindowPositiveInteger(amountToken);
}

function scoringWindowVisibleOperationCost(
  card: VisibleCard,
): number | undefined {
  const playCost = card.playCost;
  if (playCost === undefined) return undefined;
  if (playCost.kind === "fixed") {
    return Number.isInteger(playCost.credits) && playCost.credits >= 0
      ? playCost.credits
      : undefined;
  }
  if (
    playCost.kind !== "variable_x" ||
    !Number.isInteger(playCost.minimumX) ||
    playCost.minimumX < 0 ||
    !Number.isInteger(playCost.creditsPerX) ||
    playCost.creditsPerX < 1 ||
    playCost.maximumX?.kind !== "context"
  ) {
    return undefined;
  }
  return playCost.minimumX * playCost.creditsPerX;
}

function scoringWindowPositiveInteger(value: string | undefined): number {
  if (!value) return 0;
  const numeric = Number.parseInt(value, 10);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  switch (value.toLocaleLowerCase("en-US")) {
    case "one":
      return 1;
    case "two":
      return 2;
    case "three":
      return 3;
    case "four":
      return 4;
    case "five":
      return 5;
    case "six":
      return 6;
    case "seven":
      return 7;
    case "eight":
      return 8;
    case "nine":
      return 9;
    case "ten":
      return 10;
    default:
      return 0;
  }
}

function positiveVisibleNumber(
  value: number | null | undefined,
): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

export function scoringWindowRunnerExposureCreditActions(
  input: AiDecisionInput,
  scoreHorizon: CorpScoringWindowHorizon,
  scoreLineAction: boolean,
): number {
  if (!scoreLineAction || scoreHorizon === "immediate") return 0;
  if (scoreHorizon !== "next_turn" && scoreHorizon !== "slow") return 0;
  const visibleClicks = input.playerView.opponent.clicks;
  const availableRunnerClicks =
    typeof visibleClicks === "number" && Number.isFinite(visibleClicks)
      ? Math.max(0, Math.floor(visibleClicks))
      : 4;
  return Math.max(3, availableRunnerClicks - 1);
}

export function scoringWindowRezBudget(
  input: AiDecisionInput,
  server: CorpServerLike | undefined,
  creditsAfterAction: number,
  preExposureAdvancementCreditReserve = 0,
): {
  knowledge: "known" | "unknown";
  corpCanRezRelevantIce: boolean;
  corpCanRezFullPath: boolean;
  affordableIceCount: number;
  relevantIceCount: number;
  affordableRelevantIceCount: number;
  durableRelevantIceCount: number;
  affordableDurableRelevantIceCount: number;
  weakPositionScalingIceCount: number;
  dynamicProtectionWeaknessCount: number;
  dynamicProtectionReserve: number;
  corpCanRezFullPathWithDynamicReserve: boolean;
  evidence: string[];
} {
  if (
    !nonNegativeSafeInteger(creditsAfterAction) ||
    !nonNegativeSafeInteger(preExposureAdvancementCreditReserve)
  ) {
    return unknownScoringWindowRezBudget({
      creditsAfterAction,
      preExposureAdvancementCreditReserve,
      effectiveCreditsAfterReserve: undefined,
      reason: "invalid_credit_input",
    });
  }
  const effectiveCreditsAfterReserve =
    creditsAfterAction - preExposureAdvancementCreditReserve;
  if (!server || server.ice.length === 0) {
    return {
      knowledge: "known",
      corpCanRezRelevantIce: false,
      corpCanRezFullPath: false,
      affordableIceCount: 0,
      relevantIceCount: 0,
      affordableRelevantIceCount: 0,
      durableRelevantIceCount: 0,
      affordableDurableRelevantIceCount: 0,
      weakPositionScalingIceCount: 0,
      dynamicProtectionWeaknessCount: 0,
      dynamicProtectionReserve: 0,
      corpCanRezFullPathWithDynamicReserve: false,
      evidence: [
        "remote_rez_budget:no_ice",
        `remote_rez_budget:pre_exposure_advancement_credit_reserve:${preExposureAdvancementCreditReserve}`,
        `remote_rez_budget:credits_after_pre_exposure_reserve:${effectiveCreditsAfterReserve}`,
      ],
    };
  }
  const rezCosts: number[] = [];
  for (const ice of server.ice) {
    if (ice.rezzed === true) {
      rezCosts.push(0);
      continue;
    }
    const quoteRead = readExactCurrentInstalledCorpIceRezQuote({
      input,
      sourceCard: ice,
      targetServerId: server.id,
    });
    if (
      !quoteRead ||
      quoteRead.quote.mandatoryAdditionalCosts.agendaPoints !== 0
    ) {
      return unknownScoringWindowRezBudget({
        creditsAfterAction,
        preExposureAdvancementCreditReserve,
        effectiveCreditsAfterReserve,
        reason: `unknown_installed_rez_quote:${ice.instanceId}`,
      });
    }
    rezCosts.push(quoteRead.totalRezCredits);
  }
  const qualities = server.ice.map((ice, iceIndex) =>
    scoringWindowIceQuality(
      input.playerView.stateVersion,
      server,
      ice,
      iceIndex,
    ),
  );
  const relevantRezCosts = rezCosts.filter(
    (_cost, index) => qualities[index]?.relevant === true,
  );
  const durableRelevantRezCosts = rezCosts.filter(
    (_cost, index) => qualities[index]?.durableRelevant === true,
  );
  const relevantIceCount = relevantRezCosts.length;
  const durableRelevantIceCount = durableRelevantRezCosts.length;
  const affordableIceCount = rezCosts.filter(
    (cost) => cost <= effectiveCreditsAfterReserve,
  ).length;
  const affordableRelevantIceCount = relevantRezCosts.filter(
    (cost) => cost <= effectiveCreditsAfterReserve,
  ).length;
  const affordableDurableRelevantIceCount = durableRelevantRezCosts.filter(
    (cost) => cost <= effectiveCreditsAfterReserve,
  ).length;
  const weakPositionScalingIceCount = qualities.filter(
    (quality) => quality.weakPositionScaling,
  ).length;
  const dynamicProtectionWeaknessCount = qualities.filter(
    (quality) => quality.dynamicProtectionWeakness,
  ).length;
  const dynamicProtectionReserve = qualities.reduce(
    (sum, quality) => sum + quality.dynamicReserve,
    0,
  );
  const minimumRezCost =
    relevantRezCosts.length > 0 ? Math.min(...relevantRezCosts) : Infinity;
  const totalRezCost = relevantRezCosts.reduce((sum, cost) => sum + cost, 0);
  const totalRezCostWithDynamicReserve =
    totalRezCost + dynamicProtectionReserve;
  return {
    knowledge: "known",
    corpCanRezRelevantIce:
      relevantRezCosts.length > 0 &&
      effectiveCreditsAfterReserve >= minimumRezCost,
    corpCanRezFullPath:
      relevantRezCosts.length > 0 &&
      effectiveCreditsAfterReserve >= totalRezCost,
    corpCanRezFullPathWithDynamicReserve:
      relevantRezCosts.length > 0 &&
      effectiveCreditsAfterReserve >= totalRezCostWithDynamicReserve,
    affordableIceCount,
    relevantIceCount,
    affordableRelevantIceCount,
    durableRelevantIceCount,
    affordableDurableRelevantIceCount,
    weakPositionScalingIceCount,
    dynamicProtectionWeaknessCount,
    dynamicProtectionReserve,
    evidence: [
      `remote_rez_budget:credits_after_action:${creditsAfterAction}`,
      `remote_rez_budget:pre_exposure_advancement_credit_reserve:${preExposureAdvancementCreditReserve}`,
      `remote_rez_budget:credits_after_pre_exposure_reserve:${effectiveCreditsAfterReserve}`,
      `remote_rez_budget:min_relevant_rez_cost:${Number.isFinite(minimumRezCost) ? minimumRezCost : "none"}`,
      `remote_rez_budget:full_relevant_path_rez_cost:${totalRezCost}`,
      `remote_rez_budget:full_relevant_path_with_dynamic_reserve:${totalRezCostWithDynamicReserve}`,
      `remote_rez_budget:relevant_ice_count:${relevantIceCount}`,
      `remote_rez_budget:affordable_relevant_ice_count:${affordableRelevantIceCount}`,
      `remote_rez_budget:durable_relevant_ice_count:${durableRelevantIceCount}`,
      `remote_rez_budget:weak_position_scaling_ice_count:${weakPositionScalingIceCount}`,
      `remote_rez_budget:dynamic_protection_weakness_count:${dynamicProtectionWeaknessCount}`,
      `remote_rez_budget:dynamic_protection_reserve:${dynamicProtectionReserve}`,
    ],
  };
}

function unknownScoringWindowRezBudget(params: {
  creditsAfterAction: number;
  preExposureAdvancementCreditReserve: number;
  effectiveCreditsAfterReserve: number | undefined;
  reason: string;
}): ReturnType<typeof scoringWindowRezBudget> {
  return {
    knowledge: "unknown",
    corpCanRezRelevantIce: false,
    corpCanRezFullPath: false,
    affordableIceCount: 0,
    relevantIceCount: 0,
    affordableRelevantIceCount: 0,
    durableRelevantIceCount: 0,
    affordableDurableRelevantIceCount: 0,
    weakPositionScalingIceCount: 0,
    dynamicProtectionWeaknessCount: 0,
    dynamicProtectionReserve: 0,
    corpCanRezFullPathWithDynamicReserve: false,
    evidence: [
      "remote_rez_budget:knowledge:unknown",
      `remote_rez_budget:${params.reason}`,
      `remote_rez_budget:credits_after_action:${params.creditsAfterAction}`,
      `remote_rez_budget:pre_exposure_advancement_credit_reserve:${params.preExposureAdvancementCreditReserve}`,
      `remote_rez_budget:credits_after_pre_exposure_reserve:${params.effectiveCreditsAfterReserve ?? "unknown"}`,
    ],
  };
}

function nonNegativeSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function scoringWindowIceQuality(
  observedAtStateVersion: number,
  server: CorpServerLike,
  ice: VisibleCard,
  iceIndex: number,
): {
  relevant: boolean;
  durableRelevant: boolean;
  weakPositionScaling: boolean;
  dynamicProtectionWeakness: boolean;
  dynamicReserve: number;
} {
  const quote = scoringWindowBoundRunQuote(
    ice,
    server.id,
    observedAtStateVersion,
  );
  const relevant = iceRunQuoteHasPotentialScoringProtection(quote);
  const durableAccessStop = iceHasDurableScoringAccessStop(quote);
  const weakPositionScaling =
    relevant && iceHasUnsupportedPositionScaling(server, ice, iceIndex);
  const dynamicProtectionWeakness =
    relevant && iceHasDynamicProtectionWeakness(ice);
  return {
    relevant,
    durableRelevant:
      relevant &&
      durableAccessStop &&
      !weakPositionScaling &&
      !dynamicProtectionWeakness,
    weakPositionScaling,
    dynamicProtectionWeakness,
    dynamicReserve: relevant && iceHasSameFortRepositionRisk(ice) ? 1 : 0,
  };
}

function iceHasDurableScoringAccessStop(
  quote: VisibleCard["effectiveRunQuote"] | undefined,
): boolean {
  const quoteSubroutines = quote?.subroutines ?? [];
  if (
    quoteSubroutines.some((subroutine) =>
      [
        "end_the_run",
        "end_the_run_unless_runner_pays",
        "set_run_future_end_the_run_subroutine",
        "set_runner_run_lock_actions",
      ].includes(subroutine.type),
    )
  ) {
    return true;
  }
  return false;
}

function scoringWindowBoundRunQuote(
  ice: VisibleCard,
  serverId: string,
  observedAtStateVersion: number,
): VisibleCard["effectiveRunQuote"] | undefined {
  if (
    ice.rezzed === true &&
    ice.effectiveRunQuote?.iceInstanceId === ice.instanceId &&
    ice.effectiveRunQuote.iceDefinitionId === ice.definitionId
  ) {
    return ice.effectiveRunQuote;
  }
  const postRez = ice.effectivePostRezRunQuote;
  if (
    ice.rezzed === false &&
    postRez?.context === "installed_post_rez" &&
    postRez.complete === true &&
    postRez.cardId === ice.instanceId &&
    postRez.iceDefinitionId === ice.definitionId &&
    postRez.targetServerId === serverId &&
    postRez.projectedServerId === serverId &&
    postRez.expiresAtStateVersion === observedAtStateVersion &&
    postRez.effectiveRunQuote.iceInstanceId === ice.instanceId &&
    postRez.effectiveRunQuote.iceDefinitionId === ice.definitionId
  ) {
    return postRez.effectiveRunQuote;
  }
  return undefined;
}

function iceHasUnsupportedPositionScaling(
  server: CorpServerLike,
  ice: VisibleCard,
  iceIndex: number,
): boolean {
  const signals = scoringWindowCardSignals(ice);
  const positionScaling = scoringWindowIceHasPositionScalingRisk(signals);
  if (!positionScaling) return false;
  return server.ice.slice(iceIndex + 1).length === 0;
}

function iceHasDynamicProtectionWeakness(ice: VisibleCard): boolean {
  const signals = scoringWindowCardSignals(ice);
  return (
    scoringWindowIceHasPositionScalingRisk(signals) ||
    iceHasSameFortRepositionRisk(ice)
  );
}

function scoringWindowIceHasPositionScalingRisk(
  signals: readonly string[],
): boolean {
  return signals.some((signal) =>
    scoringWindowSignalMatches(signal, [
      "corp_ice.outer_ice_scaling",
      "corp_ice.position_scaling",
      "position_dependent_ice",
    ]),
  );
}

function iceHasSameFortRepositionRisk(ice: VisibleCard): boolean {
  const signals = scoringWindowCardSignals(ice);
  return signals.some((signal) =>
    scoringWindowSignalMatches(signal, [
      "same_fort_reposition",
      "corp_ice.mobile_position_change",
      "mobile_position_change",
    ]),
  );
}

function scoringWindowCardSignals(card: VisibleCard): string[] {
  const hint = card.definitionId
    ? SCORING_WINDOW_AI_HINTS_BY_CARD.get(card.definitionId)
    : undefined;
  return [
    ...(hint?.roles ?? []),
    ...(hint?.planRoles ?? []),
    ...((hint as { riskTags?: readonly string[] } | undefined)?.riskTags ?? []),
    ...((hint as { tacticSignals?: readonly string[] } | undefined)
      ?.tacticSignals ?? []),
  ];
}

function scoringWindowSignalMatches(
  signal: string,
  needles: readonly string[],
): boolean {
  const normalized = signal.toLocaleLowerCase("en-US");
  return needles.some((needle) => {
    const normalizedNeedle = needle.toLocaleLowerCase("en-US");
    if (normalized === normalizedNeedle) return true;
    const tokens = normalized.split(/[._:-]+/).filter(Boolean);
    const needleTokens = normalizedNeedle.split(/[._:-]+/).filter(Boolean);
    if (needleTokens.length <= 1) {
      const tokenSet = new Set(tokens);
      return tokenSet.has(normalizedNeedle);
    }
    return tokens.some(
      (token, index) =>
        token === needleTokens[0] &&
        needleTokens.every(
          (needleToken, offset) => tokens[index + offset] === needleToken,
        ),
    );
  });
}

export function scoringWindowKind(params: {
  action: LegalAction;
  access: ReturnType<typeof scoringWindowAccessAssessment>;
  centralPressure: boolean;
  delayedExposureRisk: boolean;
  exposureAccess: ReturnType<typeof scoringWindowAccessAssessment>;
  existingWindow: CorpScoringWindowKind;
  hasScorePressure: boolean;
  immediateScore: boolean;
  projectedServer: CorpServerLike | undefined;
  rezBudget: ReturnType<typeof scoringWindowRezBudget>;
  runnerCanContestBeforeScore: boolean;
  runnerExposureCreditActions: number;
  agendaStealSeverity: CorpScoringWindowAgendaStealSeverity;
  scoreLineAction: boolean;
}): CorpScoringWindowKind {
  if (params.immediateScore) return "durable";
  if (!params.projectedServer || params.projectedServer.ice.length === 0) {
    return params.scoreLineAction ? "unsafe" : "none";
  }
  if (
    !params.rezBudget.corpCanRezRelevantIce ||
    params.access.agendaStealRelevantNow
  ) {
    return params.scoreLineAction ? "unsafe" : "none";
  }
  if (params.runnerCanContestBeforeScore) {
    return params.scoreLineAction ? "unsafe" : "none";
  }
  if (params.delayedExposureRisk) {
    return params.scoreLineAction ? "unsafe" : "none";
  }
  if (
    params.scoreLineAction &&
    scoringWindowHasSevereExposureRisk(
      params.agendaStealSeverity,
      params.runnerExposureCreditActions,
    ) &&
    params.rezBudget.dynamicProtectionWeaknessCount > 0 &&
    (params.rezBudget.affordableDurableRelevantIceCount < 2 ||
      !params.rezBudget.corpCanRezFullPathWithDynamicReserve)
  ) {
    return "unsafe";
  }
  if (
    params.action.type === "install_card" &&
    params.action.payload?.placement === "ice" &&
    (params.existingWindow === "durable" ||
      params.existingWindow === "temporary_safe") &&
    !remoteContainsScoreLine(params.projectedServer) &&
    !scoringWindowIceInstallImprovesExistingWindow(params)
  ) {
    return "none";
  }
  if (
    params.projectedServer.ice.length >= 2 &&
    params.access.unmodeledIceCount === 0 &&
    params.rezBudget.durableRelevantIceCount >= 2 &&
    params.rezBudget.affordableDurableRelevantIceCount >= 2 &&
    params.rezBudget.corpCanRezFullPath &&
    !params.exposureAccess.runnerCanReachAccessNow
  ) {
    return "durable";
  }
  if (
    params.hasScorePressure &&
    params.rezBudget.corpCanRezRelevantIce &&
    !params.exposureAccess.runnerCanReachAccessNow &&
    !params.centralPressure
  ) {
    return "temporary_safe";
  }
  if (
    params.hasScorePressure &&
    params.exposureAccess.unmodeledIceCount > 0 &&
    params.exposureAccess.visibleRunnerIcebreakerCount === 0 &&
    params.rezBudget.corpCanRezRelevantIce &&
    !params.centralPressure
  ) {
    return "temporary_safe";
  }
  if (
    params.hasScorePressure &&
    params.exposureAccess.missingVisibleBreakerCoverage &&
    params.rezBudget.corpCanRezRelevantIce &&
    !params.centralPressure
  ) {
    return "temporary_safe";
  }
  if (
    params.action.type === "install_card" &&
    params.action.payload?.placement === "ice" &&
    params.hasScorePressure &&
    params.rezBudget.affordableRelevantIceCount > 0 &&
    params.existingWindow !== "durable" &&
    params.existingWindow !== "temporary_safe"
  ) {
    return "temporary_safe";
  }
  return params.scoreLineAction ? "unsafe" : "none";
}

export function scoringWindowDelayedScoreExposureRisk(params: {
  agendaInstall: boolean;
  access: ReturnType<typeof scoringWindowAccessAssessment>;
  agendaStealSeverity: CorpScoringWindowAgendaStealSeverity;
  exposureAccess: ReturnType<typeof scoringWindowAccessAssessment>;
  immediateScore: boolean;
  projectedServer: CorpServerLike | undefined;
  rezBudget: ReturnType<typeof scoringWindowRezBudget>;
  runnerExposureCreditActions: number;
  scoreHorizon: CorpScoringWindowHorizon;
  scoreLineAction: boolean;
}): boolean {
  if (!params.scoreLineAction || params.immediateScore) return false;
  if (params.scoreHorizon === "immediate") return false;
  if (params.runnerExposureCreditActions <= 0) return false;
  if (params.agendaStealSeverity === "none") return false;
  // The access projections already model every visible installed or publicly
  // staged breaker and their available credits. High credits alone must not
  // turn an unknown Runner hand into a contest path: that would make the Corp
  // act on hidden information and suppress an agenda installation into an
  // otherwise legal scoreline.
  if (params.agendaInstall) {
    return false;
  }
  const iceCount = params.projectedServer?.ice.length ?? 0;
  if (iceCount <= 0) return false;
  const lightOrUnprovenRemote =
    iceCount <= 1 ||
    (params.rezBudget.affordableDurableRelevantIceCount ?? 0) < 2 ||
    !params.rezBudget.corpCanRezFullPath ||
    (params.rezBudget.dynamicProtectionWeaknessCount ?? 0) > 0;
  const safetyDependsOnMissingCoverage =
    params.access.missingVisibleBreakerCoverage ||
    params.exposureAccess.missingVisibleBreakerCoverage ||
    (params.exposureAccess.unmodeledIceCount > 0 &&
      params.exposureAccess.visibleRunnerIcebreakerCount === 0);
  if (!safetyDependsOnMissingCoverage) return false;
  const richRunnerExposure =
    params.access.visibleRunnerContestCredits >= 8 ||
    params.exposureAccess.visibleRunnerContestCredits >= 10;
  const coverageAcquisitionAffordable =
    safetyDependsOnMissingCoverage &&
    (params.exposureAccess.visibleBreakCost ?? 0) > 0 &&
    params.exposureAccess.visibleRunnerContestCredits >=
      (params.exposureAccess.visibleBreakCost ?? Number.POSITIVE_INFINITY);
  if (!richRunnerExposure && !coverageAcquisitionAffordable) return false;
  const fullRunnerExposureBeforeScore =
    params.scoreHorizon === "next_turn" ||
    params.scoreHorizon === "slow" ||
    params.runnerExposureCreditActions >= 3;
  return (
    lightOrUnprovenRemote ||
    (fullRunnerExposureBeforeScore && safetyDependsOnMissingCoverage)
  );
}

function scoringWindowIceInstallImprovesExistingWindow(params: {
  existingWindow: CorpScoringWindowKind;
  exposureAccess: ReturnType<typeof scoringWindowAccessAssessment>;
  projectedServer: CorpServerLike | undefined;
  rezBudget: ReturnType<typeof scoringWindowRezBudget>;
}): boolean {
  if (
    params.existingWindow === "temporary_safe" &&
    params.rezBudget.dynamicProtectionWeaknessCount > 0 &&
    (params.rezBudget.affordableDurableRelevantIceCount ?? 0) > 0 &&
    params.rezBudget.corpCanRezRelevantIce &&
    !params.exposureAccess.runnerCanReachAccessNow
  ) {
    return true;
  }
  return (
    params.existingWindow === "temporary_safe" &&
    (params.projectedServer?.ice.length ?? 0) >= 2 &&
    (params.rezBudget.affordableDurableRelevantIceCount ?? 0) >= 2 &&
    params.rezBudget.corpCanRezFullPath &&
    !params.exposureAccess.runnerCanReachAccessNow
  );
}

function remoteContainsScoreLine(server: CorpServerLike | undefined): boolean {
  return (
    server?.root.some(
      (card) =>
        (card.known && card.type === "agenda") ||
        (card.advancementCounters ?? 0) > 0,
    ) === true
  );
}

export function scoringWindowAgendaPointsAtRisk<TServer extends CorpServerLike>(
  input: AiDecisionInput,
  action: LegalAction,
  projectedServer: CorpServerLike | undefined,
  dependencies: SemanticRuntimeCorpScoringWindowDependencies<TServer>,
  scoreLineAction: boolean,
): number {
  if (!scoreLineAction) return 0;
  const sourceCard =
    action.type === "install_card"
      ? dependencies.actionSourceCard?.(input, action)
      : undefined;
  if (sourceCard?.known && sourceCard.type === "agenda") {
    return visibleAgendaPoints(sourceCard);
  }
  const agendaPoints = (projectedServer?.root ?? [])
    .filter((card) => card.known && card.type === "agenda")
    .map(visibleAgendaPoints)
    .filter((points) => points > 0);
  return agendaPoints.length > 0 ? Math.max(...agendaPoints) : 0;
}

function visibleAgendaPoints(card: VisibleCard): number {
  if (!card.known || card.type !== "agenda") return 0;
  if (
    typeof card.agendaPoints === "number" &&
    Number.isFinite(card.agendaPoints)
  ) {
    return Math.max(0, Math.floor(card.agendaPoints));
  }
  const runtimeAgendaPoints =
    card.definitionId !== undefined
      ? (
          RUNTIME_CARDS[card.definitionId] as
            | { numeric?: { agendaPoints?: number | null } }
            | undefined
        )?.numeric?.agendaPoints
      : undefined;
  if (
    typeof runtimeAgendaPoints === "number" &&
    Number.isFinite(runtimeAgendaPoints)
  ) {
    return Math.max(0, Math.floor(runtimeAgendaPoints));
  }
  const demoAgendaPoints =
    card.definitionId !== undefined
      ? CARD_DEFINITIONS_BY_ID[card.definitionId]?.agendaPoints
      : undefined;
  if (
    typeof demoAgendaPoints === "number" &&
    Number.isFinite(demoAgendaPoints)
  ) {
    return Math.max(0, Math.floor(demoAgendaPoints));
  }
  return card.type === "agenda" ? 2 : 0;
}

export function scoringWindowAgendaStealSeverity(
  input: AiDecisionInput,
  agendaPointsAtRisk: number,
): CorpScoringWindowAgendaStealSeverity {
  if (agendaPointsAtRisk <= 0) return "none";
  const agendaPointsToWin =
    typeof input.playerView.agendaPointsToWin === "number" &&
    Number.isFinite(input.playerView.agendaPointsToWin)
      ? input.playerView.agendaPointsToWin
      : 7;
  const runnerAgendaPoints =
    typeof input.playerView.opponent.agendaPoints === "number" &&
    Number.isFinite(input.playerView.opponent.agendaPoints)
      ? input.playerView.opponent.agendaPoints
      : 0;
  const afterSteal = runnerAgendaPoints + agendaPointsAtRisk;
  if (afterSteal >= agendaPointsToWin) return "game_ending";
  if (afterSteal >= agendaPointsToWin - 1) return "near_win";
  return "normal";
}

function scoringWindowHasSevereExposureRisk(
  severity: CorpScoringWindowAgendaStealSeverity,
  runnerExposureCreditActions: number,
): boolean {
  return (
    runnerExposureCreditActions > 0 &&
    (severity === "game_ending" || severity === "near_win")
  );
}

export function scoringWindowRecommendedNextStep(params: {
  action: LegalAction;
  agendaStealSeverity: CorpScoringWindowAgendaStealSeverity;
  hasScorePressure: boolean;
  projectedServer: CorpServerLike | undefined;
  windowKind: CorpScoringWindowKind;
  rezBudget: ReturnType<typeof scoringWindowRezBudget>;
  runnerExposureCreditActions: number;
  runnerCanContestBeforeScore: boolean;
  centralPressure: boolean;
  delayedExposureRisk: boolean;
}): CorpScoringWindowNextStep {
  if (
    params.windowKind === "durable" &&
    params.action.type === "score_agenda"
  ) {
    return "score";
  }
  if (
    (params.windowKind === "temporary_safe" ||
      params.windowKind === "durable") &&
    params.action.type === "advance_card"
  ) {
    return "advance";
  }
  if (params.rezBudget.knowledge === "unknown") return "none";
  if (
    (params.windowKind === "temporary_safe" ||
      params.windowKind === "durable") &&
    params.action.type === "install_card" &&
    params.action.payload?.placement !== "ice"
  ) {
    return "install_agenda";
  }
  if (
    params.action.type === "install_card" &&
    params.action.payload?.placement === "ice" &&
    params.hasScorePressure &&
    !params.centralPressure &&
    params.windowKind !== "none"
  ) {
    return "build_remote_ice";
  }
  const remoteHasIce = (params.projectedServer?.ice.length ?? 0) > 0;
  if (
    params.windowKind === "unsafe" &&
    params.hasScorePressure &&
    !params.centralPressure &&
    params.delayedExposureRisk
  ) {
    return "build_remote_ice";
  }
  if (
    params.windowKind === "unsafe" &&
    params.hasScorePressure &&
    !params.centralPressure &&
    scoringWindowHasSevereExposureRisk(
      params.agendaStealSeverity,
      params.runnerExposureCreditActions,
    ) &&
    params.rezBudget.dynamicProtectionWeaknessCount > 0
  ) {
    return params.rezBudget.corpCanRezFullPathWithDynamicReserve
      ? "build_remote_ice"
      : "gain_credit";
  }
  if (
    params.windowKind === "unsafe" &&
    params.hasScorePressure &&
    params.runnerCanContestBeforeScore &&
    (params.agendaStealSeverity === "game_ending" ||
      params.agendaStealSeverity === "near_win")
  ) {
    return !params.rezBudget.corpCanRezRelevantIce && !remoteHasIce
      ? "gain_credit"
      : "build_remote_ice";
  }
  if (
    params.windowKind === "unsafe" &&
    params.hasScorePressure &&
    !params.centralPressure &&
    scoringWindowHasSevereExposureRisk(
      params.agendaStealSeverity,
      params.runnerExposureCreditActions,
    ) &&
    (params.rezBudget.affordableDurableRelevantIceCount ?? 0) < 1
  ) {
    return "build_remote_ice";
  }
  if (
    params.windowKind === "unsafe" &&
    params.hasScorePressure &&
    !params.centralPressure &&
    (!remoteHasIce ||
      (params.runnerCanContestBeforeScore &&
        params.rezBudget.corpCanRezRelevantIce))
  ) {
    return "build_remote_ice";
  }
  if (!params.rezBudget.corpCanRezRelevantIce) return "gain_credit";
  return "none";
}

export function strongestExistingScoringRemote<TServer extends CorpServerLike>(
  input: AiDecisionInput,
  dependencies: SemanticRuntimeCorpScoringWindowDependencies<TServer>,
): CorpScoringWindowKind {
  let strongest: CorpScoringWindowKind = "none";
  for (const server of input.playerView.servers) {
    if (!dependencies.isRemoteServerTarget(server.id)) continue;
    const candidate = dependencies.server(input, server.id);
    if (
      !dependencies.remoteHasScoreLine(candidate) &&
      !semanticRuntimeCorpHasAgendaInHq(input)
    ) {
      continue;
    }
    const access = scoringWindowPostRezProtectionAssessment(input, candidate);
    const rezBudget = scoringWindowRezBudget(
      input,
      candidate,
      input.playerView.own.credits,
    );
    const kind = scoringWindowKind({
      action: {
        actionId: "existing_remote_capacity",
        label: "existing_remote_capacity",
        type: "install_card",
        side: "corp",
        source: "game_rule",
        timingPoint: "corp_action.main",
        costs: [],
        targetRequirements: [],
        visibility: "private_to_actor",
        expiresAtStateVersion: input.playerView.stateVersion,
        payload: { placement: "ice" },
      } as unknown as LegalAction,
      access,
      centralPressure: false,
      exposureAccess: access,
      existingWindow: "none",
      hasScorePressure: true,
      immediateScore: false,
      projectedServer: candidate,
      rezBudget,
      runnerCanContestBeforeScore:
        access.runnerCanReachAccessNow && access.agendaStealRelevantNow,
      runnerExposureCreditActions: 0,
      agendaStealSeverity: "none",
      scoreLineAction: false,
      delayedExposureRisk: false,
    });
    if (kind === "durable") return "durable";
    if (kind === "temporary_safe") strongest = "temporary_safe";
  }
  return strongest;
}

export function semanticRuntimeCorpHasAgendaInHq(
  input: AiDecisionInput,
): boolean {
  return input.playerView.own.gripOrHq.some(
    (card) => card.known && card.type === "agenda",
  );
}

export function semanticRuntimeCorpCentralPressure(
  input: AiDecisionInput,
): boolean {
  return decisionDerivedValue(
    input,
    CORP_CENTRAL_PRESSURE_DECISION_CACHE_KEY,
    () => buildSemanticRuntimeCorpCentralPressure(input),
  );
}

function buildSemanticRuntimeCorpCentralPressure(
  input: AiDecisionInput,
): boolean {
  const agendaInHq = semanticRuntimeCorpHasAgendaInHq(input);
  const hq = input.playerView.servers.find((server) => server.id === "hq");
  const rd = input.playerView.servers.find((server) => server.id === "rd");
  const hqAccess = scoringWindowPostRezProtectionAssessment(input, hq);
  const rdAccess = scoringWindowPostRezProtectionAssessment(input, rd);
  const hqPressure = semanticRuntimeCorpCentralPressureAssessment(input, "hq");
  const rdPressure = semanticRuntimeCorpCentralPressureAssessment(input, "rd");
  const hqRunOrAccessEvents = hqPressure.runOrAccessEvents;
  const rdRunOrAccessEvents = rdPressure.runOrAccessEvents;
  return (
    (agendaInHq &&
      hqAccess.runnerCanReachAccessNow &&
      hqAccess.visibleRunnerContestCredits >= 1) ||
    (hqAccess.runnerCanReachAccessNow &&
      hqAccess.visibleRunnerContestCredits >= 2 &&
      (hqRunOrAccessEvents >= 3 ||
        visibleRunnerCentralMultiaccess(input, "hq") ||
        hqPressure.successfulAccessEvents > 0)) ||
    (rdAccess.runnerCanReachAccessNow &&
      rdAccess.visibleRunnerContestCredits >= 4 &&
      (rdRunOrAccessEvents >= 2 ||
        visibleRunnerCentralMultiaccess(input, "rd") ||
        rdPressure.successfulAccessEvents > 0 ||
        rdPressure.eventMultiaccess))
  );
}

function visibleRunnerCentralMultiaccess(
  input: AiDecisionInput,
  serverId: "hq" | "rd",
): boolean {
  return (input.playerView.opponent.rig ?? []).some((card) => {
    if (card.known === false) return false;
    const tokens = visibleRunnerCentralMultiaccessTokens(card);
    const tokenSet = new Set(tokens);
    const hasCentralMultiaccess =
      tokenSet.has("multiaccess") ||
      tokensIncludePhrase(tokens, ["additional", "card"]) ||
      tokensIncludePhrase(tokens, ["access", "1", "additional"]);
    if (!hasCentralMultiaccess) {
      return false;
    }
    if (serverId === "hq") return tokenSet.has("hq");
    return tokenSet.has("rnd") || tokenSet.has("rd");
  });
}

function visibleRunnerCentralMultiaccessTokens(card: VisibleCard): string[] {
  const text = `${card.title ?? ""} ${card.rulesText ?? ""} ${
    card.definitionId ?? ""
  }`.replace(/r&d/gi, "rnd");
  const tokens: string[] = [];
  let current = "";
  for (const character of text) {
    if (isAsciiLetterOrDigit(character)) {
      current += character.toLocaleLowerCase("en-US");
    } else {
      if (current.length > 0) tokens.push(current);
      current = "";
    }
  }
  if (current.length > 0) tokens.push(current);
  return tokens;
}
