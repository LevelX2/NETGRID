import {
  CORP_ZONE_TRANSITION_PROJECTION_SCHEMA_VERSION,
  CORP_ROOT_REZ_CREDIT_OUTCOME_QUOTE_SCHEMA_VERSION,
  RUNNER_DRAW_PROJECTION_SCHEMA_VERSION,
  type CorpZoneTransitionProjection,
  type LegalAction,
  type RunnerDrawProjection,
} from "@netgrid/shared";
import type {
  ActionEconomyProjection,
  ActionSemanticCandidate,
} from "../action-semantic-candidate-types";
import {
  exactImmediateCreditGainAmount,
  isBasicCreditAction,
} from "./action-effect-classification";

export type RootRezCreditOutcomeProjectionStatus =
  | { status: "not_applicable" }
  | { status: "missing"; evidenceCode: string }
  | { status: "malformed"; evidenceCode: string }
  | {
      status: "runner_interruptible";
      grossCreditGain: number;
      rezCredits: number;
      netCreditGain: number;
      evidenceCode: string;
    }
  | {
      status: "nonpositive";
      grossCreditGain: number;
      rezCredits: number;
      netCreditGain: number;
      evidenceCode: string;
    }
  | {
      status: "guaranteed_positive";
      grossCreditGain: number;
      rezCredits: number;
      netCreditGain: number;
      evidenceCode: string;
    };

export type CorpZoneTransitionProjectionStatus =
  | { status: "not_applicable" }
  | { status: "malformed"; evidenceCode: string }
  | { status: "terminal_deckout"; evidenceCode: string }
  | {
      status: "guaranteed";
      projection: CorpZoneTransitionProjection;
      evidenceCode: string;
    };

export function applyActionEconomyProjection(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): ActionSemanticCandidate {
  const economyProjection = actionEconomyProjectionFor(candidate, action);
  return {
    ...candidate,
    economyProjection,
    evidence: [
      ...candidate.evidence,
      "AI economy resources projected from side-safe LegalAction facts",
      ...economyProjection.evidence.map((entry) => `economy:${entry}`),
    ],
  };
}

export function actionEconomyProjectionFor(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): ActionEconomyProjection {
  const rootRezOutcome = rootRezCreditOutcomeProjectionStatus(
    candidate,
    action,
  );
  const rootRezAction = rootRezOutcome.status !== "not_applicable";
  const rootRezGrossGain =
    rootRezOutcome.status === "guaranteed_positive"
      ? rootRezOutcome.grossCreditGain
      : undefined;
  const payloadGain = rootRezAction
    ? undefined
    : positiveNumber(exactImmediateCreditGainAmount(action));
  const basicActionGain = isBasicCreditAction(action) ? 1 : undefined;
  const grossLiquidCreditGain =
    rootRezGrossGain ?? payloadGain ?? basicActionGain;
  const creditCost = Math.max(0, candidate.costProfile.creditCost ?? 0);
  const clickCost = Math.max(0, candidate.costProfile.clickCost ?? 0);
  const storedCreditsAdded = positiveNumber(
    action.payload?.hostedCreditAddAmount,
  );
  const storedCreditsTaken = positiveNumber(
    action.payload?.hostedCreditTakeAmount,
  );
  const runnerDrawProjection = runnerDrawProjectionFor(action);
  const corpZoneTransition = corpZoneTransitionProjectionStatus(
    candidate,
    action,
  );
  const corpZoneProjection =
    corpZoneTransition.status === "guaranteed"
      ? corpZoneTransition.projection
      : undefined;
  const payloadCardsDrawn =
    corpZoneProjection?.grossDrawCount ??
    runnerDrawProjection?.projectedGrossDrawCount ??
    firstPositiveNumber(action, ["drawCardsAmount", "drawAmount", "drawCount"]);
  const basicActionCardsDrawn =
    runnerDrawProjection === undefined && isBasicDrawAction(action)
      ? 1
      : undefined;
  const cardsDrawn = payloadCardsDrawn ?? basicActionCardsDrawn ?? 0;
  const cardsConsumed =
    corpZoneProjection?.sourceHqConsumptionCount ??
    (action.type === "play_event" || action.type === "play_operation" ? 1 : 0);
  const netHandDelta =
    corpZoneProjection?.netHqDelta ??
    runnerDrawProjection?.projectedNetHandDelta ??
    cardsDrawn - cardsConsumed;
  const drawPileCardsConsumed =
    corpZoneProjection?.grossDrawCount ?? (cardsDrawn > 0 ? cardsDrawn : 0);
  const drawPileCardsReplenished = corpZoneProjection
    ? corpZoneProjection.hqCardsRecycledBeforeDrawCount +
      corpZoneProjection.archivesCardsRecycledBeforeDrawCount +
      corpZoneProjection.rdCardsReplenishedAfterDrawCount
    : 0;
  const netDrawPileDelta = drawPileCardsReplenished - drawPileCardsConsumed;
  const source =
    corpZoneTransition.status === "guaranteed" ||
    rootRezOutcome.status === "guaranteed_positive" ||
    rootRezOutcome.status === "runner_interruptible" ||
    rootRezOutcome.status === "nonpositive" ||
    payloadGain !== undefined ||
    payloadCardsDrawn !== undefined ||
    storedCreditsAdded !== undefined ||
    storedCreditsTaken !== undefined ||
    (cardsDrawn > 0 && basicActionCardsDrawn === undefined)
      ? "legal_action_payload"
      : basicActionGain !== undefined || basicActionCardsDrawn !== undefined
        ? "basic_action_contract"
        : "unknown";
  const kind =
    grossLiquidCreditGain !== undefined
      ? "immediate_liquid"
      : storedCreditsAdded !== undefined
        ? "stored_credit_build"
        : "non_economy";
  const timing =
    grossLiquidCreditGain !== undefined
      ? "immediate"
      : cardsDrawn > 0
        ? "immediate"
        : storedCreditsAdded !== undefined
          ? "setup"
          : "unknown";
  const payoutMode =
    action.payload?.hostedCreditTakeMode === "all"
      ? "all_available"
      : storedCreditsTaken !== undefined || grossLiquidCreditGain !== undefined
        ? "fixed"
        : undefined;
  const sourcePool =
    action.payload?.cardImplementationTakesHostedCredits === true
      ? "finite"
      : undefined;
  const maxCurrentTurnUses = exactPositiveInteger(
    action.payload?.cardImplementationHostedCreditCashOutMaxUses,
  );
  const evidence = [
    `kind:${kind}`,
    `click_cost:${clickCost}`,
    `credit_cost:${creditCost}`,
    `cards_drawn:${cardsDrawn}`,
    `cards_consumed:${cardsConsumed}`,
    `net_hand_delta:${netHandDelta}`,
    `draw_pile_cards_consumed:${drawPileCardsConsumed}`,
    `draw_pile_cards_replenished:${drawPileCardsReplenished}`,
    `net_draw_pile_delta:${netDrawPileDelta}`,
    `source:${source}`,
    ...(grossLiquidCreditGain !== undefined
      ? [
          `gross_liquid_credit_gain:${grossLiquidCreditGain}`,
          `net_liquid_credit_gain:${grossLiquidCreditGain - creditCost}`,
        ]
      : []),
    ...(storedCreditsAdded !== undefined
      ? [`stored_credits_added:${storedCreditsAdded}`]
      : []),
    ...(storedCreditsTaken !== undefined
      ? [`stored_credits_taken:${storedCreditsTaken}`]
      : []),
    ...(payoutMode !== undefined ? [`payout_mode:${payoutMode}`] : []),
    ...(sourcePool !== undefined ? [`source_pool:${sourcePool}`] : []),
    ...(maxCurrentTurnUses !== undefined
      ? [`max_current_turn_uses:${maxCurrentTurnUses}`]
      : []),
    ...(rootRezAction
      ? [`root_rez_credit_outcome:${rootRezOutcome.status}`]
      : []),
    ...(corpZoneTransition.status !== "not_applicable"
      ? [`corp_zone_transition:${corpZoneTransition.status}`]
      : []),
  ];

  const reliability =
    corpZoneTransition.status === "terminal_deckout" ||
    corpZoneTransition.status === "malformed"
      ? ("unknown" as const)
      : rootRezOutcome.status === "runner_interruptible"
        ? ("conditional" as const)
        : rootRezOutcome.status === "missing" ||
            rootRezOutcome.status === "malformed"
          ? ("unknown" as const)
          : source === "legal_action_payload" ||
              source === "basic_action_contract"
            ? ("guaranteed" as const)
            : ("unknown" as const);
  const confidence =
    corpZoneTransition.status === "terminal_deckout" ||
    corpZoneTransition.status === "malformed" ||
    rootRezOutcome.status === "missing" ||
    rootRezOutcome.status === "malformed"
      ? ("none" as const)
      : source === "legal_action_payload"
        ? ("high" as const)
        : source === "basic_action_contract"
          ? ("medium" as const)
          : ("none" as const);

  return {
    schemaVersion: "action-economy-projection-v1",
    kind,
    timing,
    creditRestriction: "general",
    clickCost,
    creditCost,
    ...(grossLiquidCreditGain !== undefined
      ? {
          grossLiquidCreditGain,
          netLiquidCreditGain: grossLiquidCreditGain - creditCost,
        }
      : {}),
    ...(storedCreditsAdded !== undefined ? { storedCreditsAdded } : {}),
    ...(storedCreditsTaken !== undefined ? { storedCreditsTaken } : {}),
    cardsDrawn,
    cardsConsumed,
    netHandDelta,
    ...(cardsDrawn > 0
      ? {
          ...(corpZoneProjection
            ? {
                postDrawDispositionCount:
                  corpZoneProjection.postDrawDispositionCount,
              }
            : {}),
          drawPileCardsConsumed,
          drawPileCardsReplenished,
          netDrawPileDelta,
        }
      : {}),
    ...(payoutMode !== undefined ? { payoutMode } : {}),
    ...(sourcePool !== undefined ? { sourcePool } : {}),
    ...(maxCurrentTurnUses !== undefined ? { maxCurrentTurnUses } : {}),
    repeatable:
      maxCurrentTurnUses !== undefined
        ? maxCurrentTurnUses > 1
        : isBasicCreditAction(action) || isBasicDrawAction(action)
          ? true
          : "unknown",
    reliability,
    source:
      corpZoneTransition.status === "terminal_deckout" ||
      corpZoneTransition.status === "malformed" ||
      rootRezOutcome.status === "missing" ||
      rootRezOutcome.status === "malformed"
        ? "unknown"
        : source,
    confidence,
    evidence,
  };
}

export function corpZoneTransitionProjectionStatus(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): CorpZoneTransitionProjectionStatus {
  const payload = action.payload;
  const fields = [
    payload?.corpZoneTransitionProjectionSchemaVersion,
    payload?.corpZoneTransitionProjectionComplete,
    payload?.corpZoneTransitionProjectionSourceCardInstanceId,
    payload?.corpZoneTransitionProjectionSourceDefinitionId,
    payload?.corpZoneTransitionProjectionStateVersion,
    payload?.corpZoneTransitionProjectionTimingPoint,
    payload?.corpZoneTransitionProjectionActionId,
    payload?.corpZoneTransitionProjectionKind,
    payload?.corpZoneTransitionProjectionResolution,
    payload?.corpZoneTransitionProjectionGrossDrawCount,
    payload?.corpZoneTransitionProjectionSourceHqConsumptionCount,
    payload?.corpZoneTransitionProjectionPostDrawDispositionCount,
    payload?.corpZoneTransitionProjectionHqCardsRecycledBeforeDrawCount,
    payload?.corpZoneTransitionProjectionArchivesCardsRecycledBeforeDrawCount,
    payload?.corpZoneTransitionProjectionRdCardsReplenishedAfterDrawCount,
    payload?.corpZoneTransitionProjectionNetHqDelta,
    payload?.corpZoneTransitionProjectionNetRdDelta,
    payload?.corpZoneTransitionProjectionNetRdConsumption,
    payload?.corpZoneTransitionProjectionVisibleDrawReplacementSourceCount,
  ];
  if (fields.every((value) => value === undefined)) {
    return { status: "not_applicable" };
  }
  const grossDrawCount = payload?.corpZoneTransitionProjectionGrossDrawCount;
  const sourceHqConsumptionCount =
    payload?.corpZoneTransitionProjectionSourceHqConsumptionCount;
  const postDrawDispositionCount =
    payload?.corpZoneTransitionProjectionPostDrawDispositionCount;
  const hqCardsRecycledBeforeDrawCount =
    payload?.corpZoneTransitionProjectionHqCardsRecycledBeforeDrawCount;
  const archivesCardsRecycledBeforeDrawCount =
    payload?.corpZoneTransitionProjectionArchivesCardsRecycledBeforeDrawCount;
  const rdCardsReplenishedAfterDrawCount =
    payload?.corpZoneTransitionProjectionRdCardsReplenishedAfterDrawCount;
  const netHqDelta = payload?.corpZoneTransitionProjectionNetHqDelta;
  const netRdDelta = payload?.corpZoneTransitionProjectionNetRdDelta;
  const netRdConsumption =
    payload?.corpZoneTransitionProjectionNetRdConsumption;
  const visibleDrawReplacementSourceCount =
    payload?.corpZoneTransitionProjectionVisibleDrawReplacementSourceCount;
  const sourceCardInstanceId =
    payload?.corpZoneTransitionProjectionSourceCardInstanceId;
  const sourceDefinitionId =
    payload?.corpZoneTransitionProjectionSourceDefinitionId;
  const stateVersion = payload?.corpZoneTransitionProjectionStateVersion;
  const timingPoint = payload?.corpZoneTransitionProjectionTimingPoint;
  const actionId = payload?.corpZoneTransitionProjectionActionId;
  const kind = payload?.corpZoneTransitionProjectionKind;
  const resolution = payload?.corpZoneTransitionProjectionResolution;
  const exactCandidateStateVersion =
    candidate.stateVersion === undefined ||
    candidate.stateVersion ===
      payload?.corpZoneTransitionProjectionStateVersion;
  const validKind =
    kind === "draw_then_shuffle_one_hq_into_rd" ||
    kind === "shuffle_hq_archives_into_rd_then_draw" ||
    kind === "shuffle_hq_into_rd_then_draw_same_count";
  const structurallyValid =
    payload?.corpZoneTransitionProjectionSchemaVersion ===
      CORP_ZONE_TRANSITION_PROJECTION_SCHEMA_VERSION &&
    typeof payload.corpZoneTransitionProjectionComplete === "boolean" &&
    typeof sourceCardInstanceId === "string" &&
    sourceCardInstanceId === action.source &&
    sourceCardInstanceId === candidate.sourceCardInstanceId &&
    typeof sourceDefinitionId === "string" &&
    (candidate.sourceDefinitionId === undefined ||
      sourceDefinitionId === candidate.sourceDefinitionId) &&
    stateVersion === action.expiresAtStateVersion &&
    exactCandidateStateVersion &&
    timingPoint === action.timingPoint &&
    actionId === action.actionId &&
    actionId === candidate.actionId &&
    candidate.legalActionRef.actionId === action.actionId &&
    validKind &&
    (resolution === "guaranteed" ||
      resolution === "corp_deckout_before_completion") &&
    isExactPositiveInteger(grossDrawCount) &&
    isExactNonNegativeInteger(sourceHqConsumptionCount) &&
    isExactNonNegativeInteger(postDrawDispositionCount) &&
    isExactNonNegativeInteger(hqCardsRecycledBeforeDrawCount) &&
    isExactNonNegativeInteger(archivesCardsRecycledBeforeDrawCount) &&
    isExactNonNegativeInteger(rdCardsReplenishedAfterDrawCount) &&
    isExactInteger(netHqDelta) &&
    isExactInteger(netRdDelta) &&
    isExactNonNegativeInteger(netRdConsumption) &&
    isExactNonNegativeInteger(visibleDrawReplacementSourceCount) &&
    netHqDelta ===
      grossDrawCount -
        sourceHqConsumptionCount -
        postDrawDispositionCount -
        hqCardsRecycledBeforeDrawCount &&
    netRdDelta ===
      hqCardsRecycledBeforeDrawCount +
        archivesCardsRecycledBeforeDrawCount +
        rdCardsReplenishedAfterDrawCount -
        grossDrawCount &&
    netRdConsumption === Math.max(0, -netRdDelta);
  if (!structurallyValid) {
    return {
      status: "malformed",
      evidenceCode: "corp_zone_transition_projection_malformed_or_stale",
    };
  }
  if (
    payload.corpZoneTransitionProjectionComplete !== true ||
    resolution !== "guaranteed"
  ) {
    return {
      status: "terminal_deckout",
      evidenceCode: "corp_zone_transition_projection_deckout_before_completion",
    };
  }
  return {
    status: "guaranteed",
    projection: {
      schemaVersion: CORP_ZONE_TRANSITION_PROJECTION_SCHEMA_VERSION,
      complete: true,
      sourceCardInstanceId: sourceCardInstanceId!,
      sourceDefinitionId: sourceDefinitionId!,
      stateVersion: stateVersion!,
      timingPoint: timingPoint!,
      actionId: actionId!,
      kind,
      resolution,
      grossDrawCount,
      sourceHqConsumptionCount,
      postDrawDispositionCount,
      hqCardsRecycledBeforeDrawCount,
      archivesCardsRecycledBeforeDrawCount,
      rdCardsReplenishedAfterDrawCount,
      netHqDelta,
      netRdDelta,
      netRdConsumption,
      visibleDrawReplacementSourceCount,
    },
    evidenceCode: "corp_zone_transition_projection_engine_certified",
  };
}

/**
 * Returns the exact liquid-credit payout quoted by a currently legal bank
 * cash-out action. The stored pool is deliberately not a substitute: it may
 * require several clicks to convert.
 */
export function exactBankCashOutPayout(
  action: LegalAction,
): number | undefined {
  if (action.payload?.cardImplementationTakesHostedCredits !== true) {
    return undefined;
  }
  return (
    positiveNumber(action.payload.gainCreditsAmount) ??
    positiveNumber(action.payload.hostedCreditTakeAmount)
  );
}

export function exactBankCashOutTakeAmount(
  action: LegalAction,
): number | undefined {
  if (action.payload?.cardImplementationTakesHostedCredits !== true) {
    return undefined;
  }
  return positiveNumber(action.payload.hostedCreditTakeAmount);
}

export function runnerDrawProjectionFor(
  action: LegalAction,
): RunnerDrawProjection | undefined {
  const payload = action.payload;
  if (
    !isBasicDrawAction(action) ||
    payload?.runnerDrawProjectionSchemaVersion !==
      RUNNER_DRAW_PROJECTION_SCHEMA_VERSION
  )
    return undefined;
  const projectedGrossDrawCount = payload.projectedGrossDrawCount;
  const projectedPostDrawDispositionCount =
    payload.projectedPostDrawDispositionCount;
  const projectedNetHandDelta = payload.projectedNetHandDelta;
  const visibleDrawTaxSourceCount = payload.visibleDrawTaxSourceCount;
  if (
    !isExactNonNegativeInteger(projectedGrossDrawCount) ||
    !isExactNonNegativeInteger(projectedPostDrawDispositionCount) ||
    !isExactNonNegativeInteger(projectedNetHandDelta) ||
    !isExactNonNegativeInteger(visibleDrawTaxSourceCount) ||
    projectedPostDrawDispositionCount > projectedGrossDrawCount ||
    projectedNetHandDelta !==
      projectedGrossDrawCount - projectedPostDrawDispositionCount
  )
    return undefined;
  return {
    schemaVersion: RUNNER_DRAW_PROJECTION_SCHEMA_VERSION,
    projectedGrossDrawCount,
    projectedPostDrawDispositionCount,
    projectedNetHandDelta,
    visibleDrawTaxSourceCount,
  };
}

export function rootRezCreditOutcomeProjectionStatus(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): RootRezCreditOutcomeProjectionStatus {
  if (
    action.type !== "rez_card" ||
    typeof action.payload?.cardId !== "string" ||
    typeof action.payload.serverId !== "string"
  ) {
    return { status: "not_applicable" };
  }
  const payload = action.payload;
  const quoteFields = [
    payload.rootRezCreditOutcomeQuoteSchemaVersion,
    payload.rootRezCreditOutcomeQuoteComplete,
    payload.rootRezCreditOutcomeQuoteSourceCardInstanceId,
    payload.rootRezCreditOutcomeQuoteTargetServerId,
    payload.rootRezCreditOutcomeQuoteStateVersion,
    payload.rootRezCreditOutcomeQuoteTimingPoint,
    payload.rootRezCreditOutcomeQuoteActionId,
    payload.rootRezCreditOutcomeQuoteResolution,
    payload.rootRezCreditOutcomeQuoteGrossCreditGain,
    payload.rootRezCreditOutcomeQuoteRezCredits,
    payload.rootRezCreditOutcomeQuoteNetCreditGain,
  ];
  if (quoteFields.every((value) => value === undefined)) {
    return {
      status: "missing",
      evidenceCode: "corp_root_rez_credit_outcome_quote_missing",
    };
  }

  const sourceCardInstanceId =
    payload.rootRezCreditOutcomeQuoteSourceCardInstanceId;
  const targetServerId = payload.rootRezCreditOutcomeQuoteTargetServerId;
  const stateVersion = payload.rootRezCreditOutcomeQuoteStateVersion;
  const grossCreditGain = payload.rootRezCreditOutcomeQuoteGrossCreditGain;
  const rezCredits = payload.rootRezCreditOutcomeQuoteRezCredits;
  const netCreditGain = payload.rootRezCreditOutcomeQuoteNetCreditGain;
  const listedRezCredits = exactListedCreditCost(action);
  const validTargetServer =
    targetServerId === "hq" ||
    targetServerId === "rd" ||
    targetServerId === "archives" ||
    (typeof targetServerId === "string" &&
      /^remote_[1-9][0-9]*$/.test(targetServerId));
  const exactCandidateStateVersion =
    candidate.stateVersion === undefined ||
    candidate.stateVersion === stateVersion;
  const exactCandidateCost =
    candidate.costProfile.costKnownStatus === "known" &&
    candidate.costProfile.creditCost === rezCredits;
  const completeAndBound =
    payload.rootRezCreditOutcomeQuoteSchemaVersion ===
      CORP_ROOT_REZ_CREDIT_OUTCOME_QUOTE_SCHEMA_VERSION &&
    payload.rootRezCreditOutcomeQuoteComplete === true &&
    typeof sourceCardInstanceId === "string" &&
    sourceCardInstanceId === action.source &&
    sourceCardInstanceId === payload.cardId &&
    sourceCardInstanceId === candidate.sourceCardInstanceId &&
    validTargetServer &&
    targetServerId === payload.serverId &&
    isExactNonNegativeInteger(stateVersion) &&
    stateVersion === action.expiresAtStateVersion &&
    exactCandidateStateVersion &&
    payload.rootRezCreditOutcomeQuoteTimingPoint === action.timingPoint &&
    payload.rootRezCreditOutcomeQuoteActionId === action.actionId &&
    payload.rootRezCreditOutcomeQuoteActionId === candidate.actionId &&
    candidate.legalActionRef.actionId === action.actionId &&
    (payload.rootRezCreditOutcomeQuoteResolution === "guaranteed" ||
      payload.rootRezCreditOutcomeQuoteResolution === "runner_interruptible") &&
    isExactPositiveInteger(grossCreditGain) &&
    isExactNonNegativeInteger(rezCredits) &&
    isExactInteger(netCreditGain) &&
    netCreditGain === grossCreditGain - rezCredits &&
    listedRezCredits === rezCredits &&
    exactCandidateCost;
  if (!completeAndBound) {
    return {
      status: "malformed",
      evidenceCode: "corp_root_rez_credit_outcome_quote_malformed_or_stale",
    };
  }
  if (payload.rootRezCreditOutcomeQuoteResolution === "runner_interruptible") {
    return {
      status: "runner_interruptible",
      grossCreditGain,
      rezCredits,
      netCreditGain,
      evidenceCode: "corp_root_rez_credit_outcome_runner_interruptible",
    };
  }
  if (netCreditGain <= 0) {
    return {
      status: "nonpositive",
      grossCreditGain,
      rezCredits,
      netCreditGain,
      evidenceCode: "corp_root_rez_credit_outcome_not_positive",
    };
  }
  return {
    status: "guaranteed_positive",
    grossCreditGain,
    rezCredits,
    netCreditGain,
    evidenceCode: "corp_root_rez_credit_outcome_engine_certified",
  };
}

function exactListedCreditCost(action: LegalAction): number | undefined {
  let total = 0;
  for (const cost of action.costs) {
    const credits = cost.credits ?? 0;
    if (!isExactNonNegativeInteger(credits)) return undefined;
    total += credits;
    if (!Number.isSafeInteger(total)) return undefined;
  }
  return total;
}

function firstPositiveNumber(
  action: LegalAction,
  keys: readonly string[],
): number | undefined {
  for (const key of keys) {
    const value = positiveNumber(action.payload?.[key]);
    if (value !== undefined) return value;
  }
  return undefined;
}

function isBasicDrawAction(action: LegalAction): boolean {
  return action.type === "draw_card" && action.source === "basic_action";
}

function positiveNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

function exactPositiveInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? value
    : undefined;
}

function isExactInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value);
}

function isExactNonNegativeInteger(value: unknown): value is number {
  return isExactInteger(value) && value >= 0;
}

function isExactPositiveInteger(value: unknown): value is number {
  return isExactInteger(value) && value > 0;
}
