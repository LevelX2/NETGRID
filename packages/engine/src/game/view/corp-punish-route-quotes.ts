import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import {
  CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
  type CorpPunishRouteIncompleteReason,
  type CorpPunishRouteQuote,
  type CorpPunishRouteQuoteRequest,
  type CorpPunishRouteQuoteResult,
  type CorpPunishRouteStepQuote,
  type EngineError,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import {
  CapabilityIdentityError,
  canonicalCapabilityId,
  engineCardByDefinitionId,
} from "@netgrid/cards/engine";
import type {
  CardConditionImplementation,
  CardEffectImplementation,
  OnPlayCardAbilityImplementation,
} from "../../ability-engine/definition-types";
import {
  CardCapabilityBindingError,
  onPlayAbilityForCapabilityIdentity,
} from "../../ability-engine/card-capability-binding";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { applyAction } from "../apply-action";
import { createRunnerInstalledTrashImminentEvent } from "../damage/damage-event-resolution";
import { collectEventModificationCandidates } from "../damage/prevention-sources";
import { getLegalActions } from "../legal-actions";
import {
  fixedPlayCostCredits,
  playCostForDefinition,
} from "../payment/play-cost";
import {
  cardCounter,
  damagePreventionUsedThisTurn,
} from "../state/turn-flags-counters";
import { eligibleInstalledRunnerHardwareIds } from "../state/installed-runner-hardware";
import { isConcealedRunnerResource } from "./card-view";

type CertifiedStep = {
  quote: CorpPunishRouteStepQuote;
  effects: readonly CardEffectImplementation[];
  condition?: CardConditionImplementation;
  currentLegalActionId?: string;
};

type CertifiedTraceTagResponse = {
  sourceStepId: string;
  traceLimit: number;
  corpResponseCredits: number;
  runnerResponseCredits: number;
  minimumTagAmount: number;
  maximumTagAmount: number;
  concealedRunnerResponsesUnknown: boolean;
  visibleTagPreventionResponse: boolean;
};

/**
 * Certifies rules facts for one caller-owned Corp punish route.
 *
 * This boundary deliberately does not select a route. It accepts only exact
 * source/capability bindings, validates the current head against LegalActions
 * and projects the narrow deterministic on-play tag/damage slice supported by
 * the declarative CardImplementation vocabulary. Unsupported steps make only
 * this route incomplete; no printed rules text or AI hint is consulted.
 */
export function quoteCorpPunishRoute(
  state: GameState,
  request: CorpPunishRouteQuoteRequest,
): CorpPunishRouteQuoteResult {
  if (!isCorpPunishRouteQuoteRequest(request)) {
    return quoteFail(
      "ERR_INVALID_TARGET",
      "Die Punish-Routen-Anfrage ist unvollständig.",
    );
  }
  if (request.matchId !== state.matchId) {
    return quoteFail(
      "ERR_INVALID_TARGET",
      "Die Punish-Routen-Anfrage gehört nicht zu diesem Spiel.",
    );
  }
  if (request.stateVersion !== state.stateVersion) {
    return quoteFail(
      "ERR_STALE_STATE",
      "Der Spielzustand der Punish-Routen-Anfrage ist veraltet.",
    );
  }
  if (request.side !== "corp") {
    return quoteFail(
      "ERR_WRONG_SIDE",
      "Nur die Corp darf eine Corp-Punish-Route quoten.",
    );
  }
  if (
    request.timingPoint !== state.timingPoint ||
    state.activeSide !== "corp" ||
    state.timingPoint !== "corp_action.main"
  ) {
    return quoteFail(
      "ERR_UNKNOWN_ACTION",
      "Die Punish-Route gehört nicht zum aktuellen Corp-Aktionsfenster.",
    );
  }

  const requestEcho = cloneRequest(request);
  const requestFingerprint = corpPunishRouteRequestFingerprint(request);
  const base = quoteBase(state, requestEcho, requestFingerprint);
  const certifiedSteps: CertifiedStep[] = [];

  for (const step of request.steps) {
    const certification = certifyStep(state, step);
    if (!certification.ok) {
      return {
        ok: true,
        quote: incompleteQuote(base, certification.reason),
      };
    }
    certifiedSteps.push(certification.step);
  }

  const head = certifiedSteps[0];
  const currentHeadAction = head
    ? exactCurrentHeadAction(state, head.quote, head.currentLegalActionId)
    : undefined;
  const fundingOnlyHead =
    head && !currentHeadAction && head.currentLegalActionId === undefined
      ? exactFundingOnlyHeadAvailable(state, head.quote)
      : false;
  if (!head || (!currentHeadAction && !fundingOnlyHead)) {
    return {
      ok: true,
      quote: incompleteQuote(base, "head_legal_action_unavailable"),
    };
  }
  if (currentHeadAction) {
    head.quote.currentLegalAction = structuredClone(currentHeadAction);
  }

  const traceTagResponse =
    currentHeadAction || fundingOnlyHead
      ? certifyExactTraceTagResponse(state, certifiedSteps, currentHeadAction)
      : undefined;
  if (
    certifiedSteps.some((step) =>
      step.effects.some((effect) => effect.kind === "trace"),
    ) &&
    !traceTagResponse
  ) {
    return {
      ok: true,
      quote: incompleteQuote(base, "response_window_unknown"),
    };
  }

  let projectedRunnerTagsMinimum = state.runner.tags;
  let projectedRunnerTagsMaximum = state.runner.tags;
  let minimumMeatDamage = 0;
  let maximumMeatDamage = 0;
  let minimumNetDamage = 0;
  let maximumNetDamage = 0;
  let minimumCoreDamage = 0;
  let maximumCoreDamage = 0;
  let directTagStepId: string | undefined;
  let traceTagStepId: string | undefined;
  for (const certified of certifiedSteps) {
    const condition = certified.condition;
    if (condition) {
      const conditionStatus = conditionStatusAfterPriorSteps(
        condition,
        projectedRunnerTagsMinimum,
        projectedRunnerTagsMaximum,
        certified.quote.order === 0,
      );
      if (conditionStatus === "unmet" || conditionStatus === "unknown") {
        return {
          ok: true,
          quote: incompleteQuote(
            base,
            conditionStatus === "unknown"
              ? "future_state_transition_unavailable"
              : "source_condition_unsatisfied",
          ),
        };
      }
    }
    for (const effect of certified.effects) {
      if (effect.kind === "add_tags") {
        projectedRunnerTagsMinimum += effect.amount;
        projectedRunnerTagsMaximum += effect.amount;
        directTagStepId ??= certified.quote.stepId;
      } else if (
        effect.kind === "trace" &&
        traceTagResponse?.sourceStepId === certified.quote.stepId
      ) {
        projectedRunnerTagsMinimum += traceTagResponse.minimumTagAmount;
        projectedRunnerTagsMaximum += traceTagResponse.maximumTagAmount;
        traceTagStepId ??= certified.quote.stepId;
      } else if (effect.kind === "damage") {
        const conditionStatus = certified.condition
          ? conditionStatusAfterPriorSteps(
              certified.condition,
              projectedRunnerTagsMinimum,
              projectedRunnerTagsMaximum,
              certified.quote.order === 0,
            )
          : "met";
        if (effect.damageType === "meat") {
          maximumMeatDamage += effect.amount;
          if (conditionStatus === "met") minimumMeatDamage += effect.amount;
        }
        if (effect.damageType === "net") {
          maximumNetDamage += effect.amount;
          if (conditionStatus === "met") minimumNetDamage += effect.amount;
        }
        if (effect.damageType === "core") {
          maximumCoreDamage += effect.amount;
          if (conditionStatus === "met") minimumCoreDamage += effect.amount;
        }
      }
    }
  }

  const minimumDamage =
    minimumMeatDamage + minimumNetDamage + minimumCoreDamage;
  const maximumDamage =
    maximumMeatDamage + maximumNetDamage + maximumCoreDamage;
  const visibleDamagePrevention =
    maximumDamage > 0
      ? visibleDamagePreventionEnvelope(state, {
          meat: maximumMeatDamage,
          net: maximumNetDamage,
          core: maximumCoreDamage,
        })
      : {
          knowledge: "none_visible" as const,
          maximumPreventableDamage: 0,
          creditCost: { minimum: 0, maximum: 0 },
        };
  if (visibleDamagePrevention === undefined) {
    return {
      ok: true,
      quote: incompleteQuote(base, "damage_prevention_quote_incomplete"),
    };
  }

  const totalClicks = certifiedSteps.reduce(
    (sum, step) => sum + step.quote.clicks,
    0,
  );
  const totalActionCredits = certifiedSteps.reduce(
    (sum, step) => sum + step.quote.credits,
    0,
  );
  const hasDamage = maximumDamage > 0;
  const hasTraceTagResponse = traceTagResponse !== undefined;
  const corpResponseCredits = traceTagResponse?.corpResponseCredits ?? 0;
  const runnerResponseCredits =
    traceTagResponse?.runnerResponseCredits ??
    (hasDamage ? state.runner.credits : 0);

  return {
    ok: true,
    quote: {
      ...base,
      complete: true,
      incompleteReasons: [],
      steps: certifiedSteps.map(({ quote }) => quote),
      totalClicks,
      totalActionCredits,
      tagTrigger:
        state.runner.tags > 0
          ? {
              kind: "existing_tag",
              status: "satisfied",
              currentRunnerTags: state.runner.tags,
              requiredRunnerTags: 1,
            }
          : directTagStepId
            ? {
                kind: "direct_tag_step",
                status: "projected",
                currentRunnerTags: 0,
                requiredRunnerTags: 1,
                sourceStepId: directTagStepId,
              }
            : traceTagStepId && traceTagResponse
              ? {
                  kind: "trace_tag_step",
              status: "response_required",
              currentRunnerTags: 0,
              requiredRunnerTags: traceTagResponse.maximumTagAmount,
              sourceStepId: traceTagStepId,
              traceLimit: traceTagResponse.traceLimit,
                }
              : {
                  kind: "none",
                  status: "not_required",
                  currentRunnerTags: 0,
                  requiredRunnerTags: 0,
                },
      responsePaymentEnvelope: {
        responseKind: hasTraceTagResponse
          ? hasDamage &&
            visibleDamagePrevention.maximumPreventableDamage > 0
            ? "mixed"
            : "trace_bid"
          : hasDamage
            ? "runner_optional"
            : "none",
        paymentKnowledge: hasTraceTagResponse
          ? traceTagResponse.concealedRunnerResponsesUnknown
            ? "unknown"
            : traceTagResponse.visibleTagPreventionResponse ||
                visibleDamagePrevention.maximumPreventableDamage > 0
              ? "bounded_public"
              : "exact_public"
          : hasDamage
            ? "unknown"
            : "exact_public",
        corpCreditsAvailable: state.corp.credits,
        runnerCreditsVisible: state.runner.credits,
        corpResponseCredits: {
          minimum: 0,
          maximum: corpResponseCredits,
        },
        totalCorpCredits: {
          minimum: totalActionCredits,
          maximum: totalActionCredits + corpResponseCredits,
        },
        runnerResponseCredits: {
          minimum: 0,
          maximum: runnerResponseCredits,
        },
      },
      damageEnvelope: {
        runnerHandCount: state.runner.grip.length,
        rawDamage: {
          meat: maximumMeatDamage,
          net: maximumNetDamage,
          core: maximumCoreDamage,
          total: maximumDamage,
        },
        effectiveDamage: {
          minimum: Math.max(
            0,
            minimumDamage - visibleDamagePrevention.maximumPreventableDamage,
          ),
          maximum: maximumDamage,
        },
        visiblePrevention: visibleDamagePrevention,
        visiblePiercing: {
          knowledge: "none_visible",
          maximumBypassedDamage: 0,
          creditCost: { minimum: 0, maximum: 0 },
        },
      },
      guarantee: traceTagResponse?.concealedRunnerResponsesUnknown
        ? "not_guaranteed"
        : traceTagResponse &&
            traceTagResponse.minimumTagAmount <
              traceTagResponse.maximumTagAmount
          ? "conditional_on_runner_response"
        : hasDamage
          ? "conditional_on_runner_response"
          : "guaranteed",
      responseKnowledge: hasTraceTagResponse
        ? traceTagResponse.concealedRunnerResponsesUnknown
          ? "unknown"
          : traceTagResponse.visibleTagPreventionResponse ||
              visibleDamagePrevention.maximumPreventableDamage > 0
            ? "public_bounded"
            : "public_exact"
        : hasDamage
          ? "unknown"
          : "public_exact",
    },
  };
}

/**
 * Certifies the smallest Corp bid that wins against the Runner's largest
 * currently legal response by executing the real trace flow on cloned states.
 * Any additional base-link, post-bid or prevention choice keeps the route
 * unknown instead of being approximated.
 */
function certifyExactTraceTagResponse(
  state: GameState,
  steps: readonly CertifiedStep[],
  currentHeadAction: LegalAction | undefined,
): CertifiedTraceTagResponse | undefined {
  const traceSteps = steps.filter((step) =>
    step.effects.some((effect) => effect.kind === "trace"),
  );
  if (traceSteps.length !== 1 || traceSteps[0] !== steps[0]) return undefined;
  const traceStep = traceSteps[0]!;
  const traceEffect = traceStep.effects[0];
  if (
    traceStep.effects.length !== 1 ||
    traceEffect?.kind !== "trace" ||
    traceEffect.onSuccess.length !== 1
  ) {
    return undefined;
  }
  const tagEffect = traceEffect.onSuccess[0];
  if (
    !tagEffect ||
    tagEffect.kind !== "add_tags" ||
    tagEffect.recipient !== "runner" ||
    tagEffect.visibility !== "public" ||
    !Number.isSafeInteger(tagEffect.amount) ||
    tagEffect.amount <= 0
  ) {
    return undefined;
  }

  const { state: simulationState, concealedRunnerResponsesUnknown } =
    publicTraceSimulationState(state);
  if (!currentHeadAction) {
    simulationState.corp.credits = traceStep.quote.credits;
    currentHeadAction = exactCurrentHeadAction(
      simulationState,
      traceStep.quote,
    );
  }
  if (!currentHeadAction) return undefined;
  const played = applyAction(simulationState, {
    matchId: simulationState.matchId,
    side: "corp",
    actionId: currentHeadAction.actionId,
    clientKnownStateVersion: simulationState.stateVersion,
  });
  if (
    !played.ok ||
    played.state.trace?.status !== "corp_bid" ||
    played.state.pendingChoice?.side !== "corp" ||
    played.state.pendingChoice.kind !== "bid_amount" ||
    played.state.trace.traceLimit !== traceEffect.traceLimit
  ) {
    return undefined;
  }
  let verifiedAfterHead = played.state;
  let corpBidOptions = numericBidOptions(verifiedAfterHead);
  let maximumCorpBid = corpBidOptions.sort(
    (left, right) => right.value - left.value,
  )[0];
  if (!maximumCorpBid || maximumCorpBid.value < traceEffect.traceLimit) {
    const { state: fundedSimulationState } = publicTraceSimulationState(state);
    fundedSimulationState.corp.credits =
      traceStep.quote.credits + traceEffect.traceLimit;
    const fundedHeadAction = exactCurrentHeadAction(
      fundedSimulationState,
      traceStep.quote,
    );
    if (!fundedHeadAction) return undefined;
    const fundedHead = applyAction(fundedSimulationState, {
      matchId: fundedSimulationState.matchId,
      side: "corp",
      actionId: fundedHeadAction.actionId,
      clientKnownStateVersion: fundedSimulationState.stateVersion,
    });
    if (
      !fundedHead.ok ||
      fundedHead.state.trace?.status !== "corp_bid" ||
      fundedHead.state.pendingChoice?.side !== "corp" ||
      fundedHead.state.pendingChoice.kind !== "bid_amount"
    ) {
      return undefined;
    }
    verifiedAfterHead = fundedHead.state;
    corpBidOptions = numericBidOptions(verifiedAfterHead);
    maximumCorpBid = corpBidOptions.sort(
      (left, right) => right.value - left.value,
    )[0];
  }
  if (
    !maximumCorpBid ||
    maximumCorpBid.value !== traceEffect.traceLimit ||
    corpBidOptions.some((option) => option.value > traceEffect.traceLimit) ||
    !corpBidOptions.some((option) => option.value === 0)
  ) {
    return undefined;
  }
  const afterCorpBid = applyExactChoice(
    verifiedAfterHead,
    "corp",
    maximumCorpBid.id,
  );
  if (
    !afterCorpBid ||
    afterCorpBid.trace?.status !== "runner_bid" ||
    afterCorpBid.pendingChoice?.side !== "runner" ||
    afterCorpBid.pendingChoice.kind !== "bid_amount" ||
    afterCorpBid.trace.corpBid !== maximumCorpBid.value ||
    afterCorpBid.trace.traceValue !== maximumCorpBid.value ||
    !Number.isSafeInteger(afterCorpBid.trace.runnerLink) ||
    afterCorpBid.trace.runnerLink! < 0
  ) {
    return undefined;
  }
  const runnerBidOptions = numericBidOptions(afterCorpBid);
  const maximumRunnerBid = runnerBidOptions.sort(
    (left, right) => right.value - left.value,
  )[0];
  const zeroRunnerBid = runnerBidOptions.find((option) => option.value === 0);
  if (!maximumRunnerBid || !zeroRunnerBid) return undefined;

  // Original Trace is open and sequential: Corp bids first from zero up to
  // the Trace limit, then Runner responds. A tie belongs to the Runner, so a
  // successful tag branch exists only if the maximum Corp bid exceeds Link.
  const runnerLink = afterCorpBid.trace.runnerLink!;
  if (maximumCorpBid.value <= runnerLink) return undefined;
  const tieCorpBid = corpBidOptions.find(
    (option) => option.value === runnerLink,
  );
  if (tieCorpBid) {
    const tieRunnerWindow = applyExactChoice(
      structuredClone(verifiedAfterHead),
      "corp",
      tieCorpBid.id,
    );
    const tieRunnerZero = tieRunnerWindow
      ? numericBidOptions(tieRunnerWindow).find((option) => option.value === 0)
      : undefined;
    const tied =
      tieRunnerWindow && tieRunnerZero
        ? applyExactChoice(tieRunnerWindow, "runner", tieRunnerZero.id)
        : undefined;
    if (
      !tied ||
      tied.trace !== undefined ||
      tied.pendingChoice !== undefined ||
      tied.runner.tags !== simulationState.runner.tags
    ) {
      return undefined;
    }
  }

  const successful = applyExactChoice(
    structuredClone(afterCorpBid),
    "runner",
    zeroRunnerBid.id,
  );
  if (!successful) return undefined;
  const successfulOutcomes = exactTagApplicationOutcomes(successful);
  if (!successfulOutcomes) return undefined;
  const maximumRunnerResponse = applyExactChoice(
    structuredClone(afterCorpBid),
    "runner",
    maximumRunnerBid.id,
  );
  if (!maximumRunnerResponse) return undefined;
  const maximumResponseOutcomes = exactTagApplicationOutcomes(
    maximumRunnerResponse,
  );
  if (!maximumResponseOutcomes) return undefined;
  const responseOutcomes = [
    ...successfulOutcomes.states,
    ...maximumResponseOutcomes.states,
  ];
  const tagAmounts = responseOutcomes.map(
    (outcome) => outcome.runner.tags - simulationState.runner.tags,
  );
  const minimumTagAmount = concealedRunnerResponsesUnknown
    ? 0
    : Math.min(...tagAmounts);
  const maximumTagAmount = Math.max(...tagAmounts);
  if (
    tagAmounts.some(
      (amount) =>
        !Number.isSafeInteger(amount) || amount < 0 || amount > tagEffect.amount,
    ) ||
    maximumTagAmount !== tagEffect.amount
  ) {
    return undefined;
  }
  const corpResponseCredits =
    verifiedAfterHead.corp.credits - afterCorpBid.corp.credits;
  const runnerResponseCredits = Math.max(
    ...responseOutcomes.map(
      (outcome) => afterCorpBid.runner.credits - outcome.runner.credits,
    ),
  );
  if (
    !Number.isSafeInteger(corpResponseCredits) ||
    corpResponseCredits < 0 ||
    !Number.isSafeInteger(runnerResponseCredits) ||
    runnerResponseCredits < 0
  ) {
    return undefined;
  }
  return {
    sourceStepId: traceStep.quote.stepId,
    traceLimit: traceEffect.traceLimit,
    corpResponseCredits,
    runnerResponseCredits,
    minimumTagAmount,
    maximumTagAmount,
    concealedRunnerResponsesUnknown,
    visibleTagPreventionResponse:
      successfulOutcomes.usedTagPreventionWindow ||
      maximumResponseOutcomes.usedTagPreventionWindow,
  };
}

function exactTagApplicationOutcomes(
  state: GameState,
  depth = 0,
):
  | { states: GameState[]; usedTagPreventionWindow: boolean }
  | undefined {
  if (state.trace !== undefined || depth > 8) return undefined;
  const choice = state.pendingChoice;
  if (!choice) {
    return { states: [state], usedTagPreventionWindow: depth > 0 };
  }
  if (
    choice.side !== "runner" ||
    choice.kind !== "select_option" ||
    choice.source !== "v120.event_modification.avoid" ||
    choice.minSelections !== 1 ||
    choice.maxSelections !== 1 ||
    choice.options.length < 2 ||
    choice.options.length > 16 ||
    new Set(choice.options.map((option) => option.id)).size !==
      choice.options.length
  ) {
    return undefined;
  }
  const states: GameState[] = [];
  for (const option of choice.options) {
    const resolved = applyExactChoice(
      structuredClone(state),
      "runner",
      option.id,
    );
    if (!resolved) return undefined;
    const branch = exactTagApplicationOutcomes(resolved, depth + 1);
    if (!branch) return undefined;
    states.push(...branch.states);
  }
  return { states, usedTagPreventionWindow: true };
}

/**
 * Concealed installed Runner cards are absent from the Corp's rules evidence.
 * Remove them from the private simulation and downgrade the response contract
 * to unknown so neither quote presence nor cost can encode their identities.
 */
function publicTraceSimulationState(state: GameState): {
  state: GameState;
  concealedRunnerResponsesUnknown: boolean;
} {
  const projected = structuredClone(state);
  const concealed = new Set(
    [
      ...projected.runner.rig.hardware,
      ...projected.runner.rig.programs,
      ...projected.runner.rig.resources,
    ].filter((cardId) => projected.cardInstances[cardId]?.faceup !== true),
  );
  if (concealed.size === 0) {
    return { state: projected, concealedRunnerResponsesUnknown: false };
  }
  projected.runner.rig.hardware = projected.runner.rig.hardware.filter(
    (cardId) => !concealed.has(cardId),
  );
  projected.runner.rig.programs = projected.runner.rig.programs.filter(
    (cardId) => !concealed.has(cardId),
  );
  projected.runner.rig.resources = projected.runner.rig.resources.filter(
    (cardId) => !concealed.has(cardId),
  );
  for (const cardId of concealed) delete projected.cardInstances[cardId];
  return { state: projected, concealedRunnerResponsesUnknown: true };
}

function numericBidOptions(
  state: GameState,
): Array<{ id: string; value: number }> {
  return (state.pendingChoice?.options ?? []).flatMap((option) =>
    typeof option.value === "number" &&
    Number.isSafeInteger(option.value) &&
    option.value >= 0
      ? [{ id: option.id, value: option.value }]
      : [],
  );
}

function applyExactChoice(
  state: GameState,
  side: "corp" | "runner",
  optionId: string,
): GameState | undefined {
  const choice = state.pendingChoice;
  if (!choice || choice.side !== side) return undefined;
  const action = getLegalActions(state, side).find(
    (candidate) => candidate.type === "resolve_choice",
  );
  if (!action) return undefined;
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    selectedChoices: {
      choiceId: choice.choiceId,
      selectedOptionIds: [optionId],
    },
  });
  return result.ok ? result.state : undefined;
}

export function corpPunishRouteRequestFingerprint(
  request: CorpPunishRouteQuoteRequest,
): string {
  return encodeParts([
    CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
    request.matchId,
    request.side,
    String(request.stateVersion),
    request.timingPoint,
    request.campaignId,
    request.routeId,
    String(request.steps.length),
    ...request.steps.flatMap((step) => [
      step.stepId,
      String(step.order),
      step.kind,
      step.sourceCardInstanceId,
      step.sourceCapabilityBindingKind,
      step.sourceCapabilityId,
      ...(step.currentLegalActionId ? [step.currentLegalActionId] : []),
    ]),
  ]);
}

function certifyStep(
  state: GameState,
  request: CorpPunishRouteQuoteRequest["steps"][number],
):
  | { ok: true; step: CertifiedStep }
  | { ok: false; reason: CorpPunishRouteIncompleteReason } {
  const instance = state.cardInstances[request.sourceCardInstanceId];
  if (!instance) return { ok: false, reason: "source_unavailable" };
  if (
    instance.owner !== "corp" ||
    instance.controller !== "corp" ||
    instance.zone.side !== "corp"
  ) {
    return { ok: false, reason: "source_unavailable" };
  }
  if (instance.zone.zone !== "hq") {
    return { ok: false, reason: "source_zone_unsupported" };
  }

  const definition = CARD_DEFINITIONS_BY_ID[instance.definitionId];
  if (!definition || definition.side !== "corp") {
    return { ok: false, reason: "source_identity_unknown" };
  }
  if (definition.type !== "operation") {
    return { ok: false, reason: "source_capability_unsupported" };
  }
  if (request.kind === "hardware_trash") {
    return certifyHardwareTrashStep(state, request, definition);
  }
  let capability: OnPlayCardAbilityImplementation | undefined;
  try {
    capability = onPlayCapability(
      definition,
      request.sourceCapabilityBindingKind,
      request.sourceCapabilityId,
    );
  } catch (error) {
    if (
      error instanceof CardCapabilityBindingError ||
      error instanceof CapabilityIdentityError
    )
      return { ok: false, reason: "source_capability_missing" };
    throw error;
  }
  if (!capability) {
    return { ok: false, reason: "source_capability_missing" };
  }
  if (capability.costs !== "printed") {
    return { ok: false, reason: "cost_quote_incomplete" };
  }
  const effectValidation = supportedEffects(request.kind, capability.effects);
  if (!effectValidation.ok) return effectValidation;

  const credits = fixedPlayCostCredits(definition);
  if (!Number.isSafeInteger(credits) || credits < 0) {
    return { ok: false, reason: "cost_quote_incomplete" };
  }
  return {
    ok: true,
    step: {
      quote: {
        stepId: request.stepId,
        order: request.order,
        kind: request.kind,
        sourceCardInstanceId: request.sourceCardInstanceId,
        sourceCardDefinitionId: instance.definitionId,
        sourceCapabilityBindingKind: request.sourceCapabilityBindingKind,
        sourceCapabilityId: request.sourceCapabilityId,
        clicks: 1,
        credits,
      },
      effects: capability.effects,
      ...(capability.condition ? { condition: capability.condition } : {}),
      ...(request.currentLegalActionId
        ? { currentLegalActionId: request.currentLegalActionId }
        : {}),
    },
  };
}

function certifyHardwareTrashStep(
  state: GameState,
  request: CorpPunishRouteQuoteRequest["steps"][number],
  definition: (typeof CARD_DEFINITIONS_BY_ID)[string],
):
  | { ok: true; step: CertifiedStep }
  | { ok: false; reason: CorpPunishRouteIncompleteReason } {
  if (request.sourceCapabilityBindingKind !== "card_spec_capability_key") {
    return { ok: false, reason: "source_capability_missing" };
  }
  if (request.kind !== "hardware_trash") {
    return { ok: false, reason: "source_effects_unsupported" };
  }
  const utility = cardImplementationForDefinitionId(definition.id)?.corpUtility;
  const canonicalUtility = engineCardByDefinitionId(definition.id)?.engine
    .corpUtility;
  if (
    canonicalUtility?.kind !== "installed_hardware_trash_by_counter" ||
    request.sourceCapabilityId !==
      canonicalCapabilityId(definition.id, canonicalUtility.capabilityKey) ||
    utility?.kind !== "installed_hardware_trash_by_counter" ||
    utility.excludesSubtype !== "cybernetics" ||
    utility.visibility !== "public"
  ) {
    return { ok: false, reason: "source_capability_unsupported" };
  }
  const playCost = playCostForDefinition(definition);
  if (
    playCost.kind !== "variable_x" ||
    !Number.isSafeInteger(playCost.minimumX) ||
    playCost.minimumX < 1 ||
    !Number.isSafeInteger(playCost.creditsPerX) ||
    playCost.creditsPerX < 1
  ) {
    return { ok: false, reason: "cost_quote_incomplete" };
  }
  if (state.runner.tags < 1) {
    return { ok: false, reason: "source_condition_unsatisfied" };
  }
  if (
    new Set(state.runner.rig.hardware).size !==
      state.runner.rig.hardware.length ||
    state.runner.rig.hardware.some((cardId) => {
      const instance = state.cardInstances[cardId];
      const targetDefinition = instance
        ? CARD_DEFINITIONS_BY_ID[instance.definitionId]
        : undefined;
      return (
        !instance ||
        instance.owner !== "runner" ||
        instance.controller !== "runner" ||
        instance.zone.side !== "runner" ||
        instance.zone.zone !== "rig" ||
        targetDefinition?.type !== "hardware"
      );
    })
  ) {
    return { ok: false, reason: "target_quote_incomplete" };
  }
  const eligibleTargetInstanceIds = eligibleInstalledRunnerHardwareIds(
    state,
    utility.excludesSubtype,
  );
  if (eligibleTargetInstanceIds.length === 0) {
    return { ok: false, reason: "source_condition_unsatisfied" };
  }
  const trashEvent = createRunnerInstalledTrashImminentEvent(
    state,
    eligibleTargetInstanceIds,
    "corp_punish_route_quote.hardware_trash",
  );
  if (
    state.runner.rig.resources.some((cardId) =>
      isConcealedRunnerResource(state, cardId),
    ) ||
    collectEventModificationCandidates(state, trashEvent).length > 0
  ) {
    return { ok: false, reason: "trash_prevention_quote_incomplete" };
  }
  const currentActionProjection = request.currentLegalActionId
    ? exactRequestedHardwareTrashAction(
        state,
        request,
        playCost,
        eligibleTargetInstanceIds.length,
      )
    : undefined;
  if (request.currentLegalActionId && !currentActionProjection) {
    return { ok: false, reason: "head_legal_action_unavailable" };
  }
  const selectedX = currentActionProjection?.selectedX ?? playCost.minimumX;
  const credits =
    currentActionProjection?.credits ?? selectedX * playCost.creditsPerX;
  if (!Number.isSafeInteger(credits) || credits < 1) {
    return { ok: false, reason: "cost_quote_incomplete" };
  }
  const legalMaximumX =
    currentActionProjection?.legalMaximumX ??
    Math.min(
      eligibleTargetInstanceIds.length,
      Math.floor(credits / playCost.creditsPerX),
    );
  if (!Number.isSafeInteger(legalMaximumX) || legalMaximumX < selectedX) {
    return { ok: false, reason: "cost_quote_incomplete" };
  }
  return {
    ok: true,
    step: {
      quote: {
        stepId: request.stepId,
        order: request.order,
        kind: request.kind,
        sourceCardInstanceId: request.sourceCardInstanceId,
        sourceCardDefinitionId: definition.id,
        sourceCapabilityBindingKind: request.sourceCapabilityBindingKind,
        sourceCapabilityId: request.sourceCapabilityId,
        clicks: 1,
        credits,
        hardwareTrashProjection: {
          kind: "installed_runner_hardware",
          targetKnowledge: "public_exact",
          eligibleTargetInstanceIds,
          eligibleTargetCount: eligibleTargetInstanceIds.length,
          excludedSubtype: utility.excludesSubtype,
          costKind: "variable_x",
          minimumX: playCost.minimumX,
          selectedX,
          legalMaximumX,
          creditsPerX: playCost.creditsPerX,
          preventionKnowledge: "none_visible",
        },
      },
      effects: [],
      ...(request.currentLegalActionId
        ? { currentLegalActionId: request.currentLegalActionId }
        : {}),
    },
  };
}

function exactRequestedHardwareTrashAction(
  state: GameState,
  request: CorpPunishRouteQuoteRequest["steps"][number],
  playCost: Extract<
    ReturnType<typeof playCostForDefinition>,
    { kind: "variable_x" }
  >,
  eligibleTargetCount: number,
):
  | {
      selectedX: number;
      legalMaximumX: number;
      credits: number;
    }
  | undefined {
  const action = getLegalActions(state, "corp").find(
    (candidate) =>
      candidate.actionId === request.currentLegalActionId &&
      candidate.side === "corp" &&
      candidate.type === "play_operation" &&
      candidate.source === request.sourceCardInstanceId &&
      candidate.payload?.cardId === request.sourceCardInstanceId &&
      candidate.timingPoint === state.timingPoint &&
      candidate.expiresAtStateVersion === state.stateVersion &&
      candidate.targetRequirements.length === 0 &&
      (candidate.choiceRequirements?.length ?? 0) === 0,
  );
  if (!action) return undefined;
  const selectedX = Number(action.payload?.hardwareTrashByCounterTrashCount);
  const legalMaximumX = Math.min(
    eligibleTargetCount,
    Math.floor(state.corp.credits / playCost.creditsPerX),
  );
  const credits = selectedX * playCost.creditsPerX;
  if (
    !Number.isSafeInteger(selectedX) ||
    selectedX < playCost.minimumX ||
    selectedX > legalMaximumX ||
    !Number.isSafeInteger(credits) ||
    credits < 1 ||
    sumActionCost(action, "clicks") !== 1 ||
    sumActionCost(action, "credits") !== credits ||
    action.payload?.eligibleHardwareCount !== eligibleTargetCount ||
    action.payload?.xValue !== selectedX ||
    action.payload?.xMinimum !== playCost.minimumX ||
    action.payload?.xMaximum !== legalMaximumX ||
    action.payload?.xUpperBound !== legalMaximumX ||
    action.payload?.xCreditsPerUnit !== playCost.creditsPerX ||
    action.payload?.variableCostKind !== "printed_play_cost"
  ) {
    return undefined;
  }
  return { selectedX, legalMaximumX, credits };
}

function onPlayCapability(
  definition: (typeof CARD_DEFINITIONS_BY_ID)[string] & {},
  bindingKind: "card_spec_capability_key",
  capabilityId: string,
): OnPlayCardAbilityImplementation | undefined {
  return onPlayAbilityForCapabilityIdentity(definition, {
    kind: bindingKind,
    sourceCapabilityId: capabilityId,
  });
}

function supportedEffects(
  requestedKind: CorpPunishRouteQuoteRequest["steps"][number]["kind"],
  effects: readonly CardEffectImplementation[],
): { ok: true } | { ok: false; reason: CorpPunishRouteIncompleteReason } {
  if (effects.length !== 1) {
    return { ok: false, reason: "source_effects_unsupported" };
  }
  const effect = effects[0];
  if (!effect || effect.visibility !== "public") {
    return { ok: false, reason: "source_effects_unsupported" };
  }
  if (effect.kind === "trace") {
    const success = effect.onSuccess;
    return requestedKind === "trace_tag" &&
      success.length === 1 &&
      success[0]?.kind === "add_tags" &&
      success[0].recipient === "runner" &&
      success[0].visibility === "public" &&
      Number.isSafeInteger(success[0].amount) &&
      success[0].amount > 0
      ? { ok: true }
      : { ok: false, reason: "response_window_unknown" };
  }
  if (
    effect.kind === "add_tags" &&
    effect.recipient === "runner" &&
    Number.isSafeInteger(effect.amount) &&
    effect.amount > 0
  ) {
    return requestedKind === "tag"
      ? { ok: true }
      : { ok: false, reason: "source_effects_unsupported" };
  }
  if (
    effect.kind === "damage" &&
    effect.recipient === "runner" &&
    effect.preventable === true &&
    Number.isSafeInteger(effect.amount) &&
    effect.amount > 0
  ) {
    return requestedKind === `${effect.damageType}_damage`
      ? { ok: true }
      : { ok: false, reason: "source_effects_unsupported" };
  }
  if (
    effect.kind === "lose_credits" &&
    effect.recipient === "runner" &&
    effect.mode === "all"
  ) {
    return requestedKind === "other_punish"
      ? { ok: true }
      : { ok: false, reason: "source_effects_unsupported" };
  }
  return { ok: false, reason: "source_effects_unsupported" };
}

function exactCurrentHeadAction(
  state: GameState,
  step: CorpPunishRouteStepQuote,
  currentLegalActionId?: string,
): LegalAction | undefined {
  return getLegalActions(state, "corp").find(
    (action) =>
      (currentLegalActionId === undefined ||
        action.actionId === currentLegalActionId) &&
      action.side === "corp" &&
      action.type === "play_operation" &&
      action.source === step.sourceCardInstanceId &&
      action.payload?.cardId === step.sourceCardInstanceId &&
      action.timingPoint === state.timingPoint &&
      action.expiresAtStateVersion === state.stateVersion &&
      action.targetRequirements.length === 0 &&
      (action.choiceRequirements?.length ?? 0) === 0 &&
      sumActionCost(action, "clicks") === step.clicks &&
      sumActionCost(action, "credits") === step.credits &&
      exactHardwareTrashActionBinding(action, step),
  );
}

function exactHardwareTrashActionBinding(
  action: LegalAction,
  step: CorpPunishRouteStepQuote,
): boolean {
  const projection = step.hardwareTrashProjection;
  if (!projection) return step.kind !== "hardware_trash";
  return (
    step.kind === "hardware_trash" &&
    action.payload?.hardwareTrashByCounterTrashCount === projection.selectedX &&
    action.payload?.eligibleHardwareCount === projection.eligibleTargetCount &&
    action.payload?.xValue === projection.selectedX &&
    action.payload?.xMinimum === projection.minimumX &&
    action.payload?.xMaximum === projection.legalMaximumX &&
    action.payload?.xUpperBound === projection.legalMaximumX &&
    action.payload?.xCreditsPerUnit === projection.creditsPerX &&
    action.payload?.variableCostKind === "printed_play_cost"
  );
}

/**
 * Proves that the current head is blocked only by a fixed credit shortfall.
 *
 * The hypothetical state changes no rules fact except the Corp credit pool.
 * LegalAction projection remains the authority for every other condition,
 * timing, click, target and choice requirement. The projected action is not
 * exposed as a current LegalAction; it only certifies the funding horizon.
 */
function exactFundingOnlyHeadAvailable(
  state: GameState,
  step: CorpPunishRouteStepQuote,
): boolean {
  if (
    step.credits <= state.corp.credits ||
    step.clicks > state.corp.clicks ||
    step.credits < 1
  ) {
    return false;
  }
  const fundedProbe = structuredClone(state);
  fundedProbe.corp.credits = step.credits;
  return exactCurrentHeadAction(fundedProbe, step) !== undefined;
}

function conditionStatusAfterPriorSteps(
  condition: CardConditionImplementation,
  projectedRunnerTagsMinimum: number,
  projectedRunnerTagsMaximum: number,
  isCurrentHead: boolean,
): "met" | "unmet" | "conditional" | "unknown" {
  if (isCurrentHead) return "met";
  if (condition.kind === "runner_is_tagged") {
    if (projectedRunnerTagsMinimum > 0) return "met";
    return projectedRunnerTagsMaximum > 0 ? "conditional" : "unmet";
  }
  if (condition.kind === "runner_tags_at_least") {
    if (projectedRunnerTagsMinimum >= condition.amount) return "met";
    return projectedRunnerTagsMaximum >= condition.amount
      ? "conditional"
      : "unmet";
  }
  return "unknown";
}

function visibleDamagePreventionEnvelope(
  state: GameState,
  rawDamage: Readonly<Record<"meat" | "net" | "core", number>>,
):
  | CorpPunishRouteQuote["damageEnvelope"]["visiblePrevention"]
  | undefined {
  const supportedSources: {
    matchingDamage: number;
    maximumPrevention: number;
  }[] = [];
  for (const instance of Object.values(state.cardInstances)) {
    if (!instance.faceup) continue;
    if (instance.zone.side !== "runner" || instance.zone.zone !== "rig") {
      if (
        instance.zone.side === "corp" &&
        instance.zone.zone === "serverRoot" &&
        instance.rezzed &&
        cardImplementationForDefinitionId(instance.definitionId)?.corpUtility
          ?.kind === "meat_damage_boost"
      ) {
        return undefined;
      }
      continue;
    }
    for (const source of
      cardImplementationForDefinitionId(instance.definitionId)
        ?.damagePreventionSources ?? []) {
      const matchingDamage = source.damageTypes.reduce(
        (total, damageType) => total + rawDamage[damageType],
        0,
      );
      if (matchingDamage <= 0) continue;
      if (
        source.visibility !== "public" ||
        source.cost.kind !== "source_counter" ||
        source.corpMayPayToBypass ||
        source.corpMayCancelUntilEndOfTurn
      ) {
        return undefined;
      }
      const availableUses = Math.floor(
        cardCounter(state, instance.instanceId, source.cost.counterType) /
          source.cost.amount,
      );
      const sourceCapacity =
        source.amount === "all"
          ? availableUses > 0
            ? matchingDamage
            : 0
          : source.amount * availableUses;
      const remainingTurnLimit = source.limit
        ? Math.max(
            0,
            source.limit.amount -
              damagePreventionUsedThisTurn(state, instance.instanceId),
          )
        : sourceCapacity;
      supportedSources.push({
        matchingDamage,
        maximumPrevention: Math.min(
          matchingDamage,
          sourceCapacity,
          remainingTurnLimit,
        ),
      });
    }
  }
  if (supportedSources.length === 0) {
    return {
      knowledge: "none_visible",
      maximumPreventableDamage: 0,
      creditCost: { minimum: 0, maximum: 0 },
    };
  }
  if (supportedSources.length > 1) return undefined;
  return {
    knowledge: "bounded_public",
    maximumPreventableDamage:
      supportedSources[0]?.maximumPrevention ?? 0,
    creditCost: { minimum: 0, maximum: 0 },
  };
}

function quoteBase(
  state: GameState,
  requestEcho: CorpPunishRouteQuoteRequest,
  requestFingerprint: string,
): Pick<
  CorpPunishRouteQuote,
  | "schemaVersion"
  | "visibility"
  | "matchId"
  | "side"
  | "routeId"
  | "campaignId"
  | "campaignIdOrigin"
  | "stateVersion"
  | "timingPoint"
  | "requestFingerprint"
  | "requestEcho"
> {
  return {
    schemaVersion: CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
    visibility: "private_to_actor",
    matchId: state.matchId,
    side: "corp",
    routeId: requestEcho.routeId,
    campaignId: requestEcho.campaignId,
    campaignIdOrigin: "request_binding",
    stateVersion: state.stateVersion,
    timingPoint: state.timingPoint,
    requestFingerprint,
    requestEcho,
  };
}

function incompleteQuote(
  base: ReturnType<typeof quoteBase>,
  reason: CorpPunishRouteIncompleteReason,
): CorpPunishRouteQuote {
  return {
    ...base,
    complete: false,
    incompleteReasons: [reason],
    steps: [],
    totalClicks: 0,
    totalActionCredits: 0,
    tagTrigger: {
      kind: "unknown",
      status: "unknown",
      currentRunnerTags: 0,
      requiredRunnerTags: 0,
    },
    responsePaymentEnvelope: {
      responseKind: "unknown",
      paymentKnowledge: "unknown",
      corpCreditsAvailable: 0,
      runnerCreditsVisible: 0,
      corpResponseCredits: { minimum: 0, maximum: 0 },
      totalCorpCredits: { minimum: 0, maximum: 0 },
      runnerResponseCredits: { minimum: 0, maximum: 0 },
    },
    damageEnvelope: {
      runnerHandCount: 0,
      rawDamage: { meat: 0, net: 0, core: 0, total: 0 },
      effectiveDamage: { minimum: 0, maximum: 0 },
      visiblePrevention: {
        knowledge: "unknown",
        maximumPreventableDamage: 0,
        creditCost: { minimum: 0, maximum: 0 },
      },
      visiblePiercing: {
        knowledge: "unknown",
        maximumBypassedDamage: 0,
        creditCost: { minimum: 0, maximum: 0 },
      },
    },
    guarantee: "unknown",
    responseKnowledge: "unknown",
  };
}

function isCorpPunishRouteQuoteRequest(request: unknown): boolean {
  if (!request || typeof request !== "object") return false;
  const record = request as Partial<CorpPunishRouteQuoteRequest>;
  if (
    record.schemaVersion !== CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION ||
    !nonblank(record.matchId) ||
    (record.side !== "corp" && record.side !== "runner") ||
    !nonNegativeSafeInteger(record.stateVersion) ||
    !nonblank(record.timingPoint) ||
    !nonblank(record.campaignId) ||
    !nonblank(record.routeId) ||
    !Array.isArray(record.steps) ||
    record.steps.length < 1 ||
    record.steps.length > 6
  ) {
    return false;
  }
  const steps = record.steps;
  return (
    new Set(steps.map((step) => step.stepId)).size === steps.length &&
    new Set(
      steps.map(
        (step) =>
          `${step.sourceCardInstanceId}\u0000${step.sourceCapabilityId}`,
      ),
    ).size === steps.length &&
    new Set(steps.map((step) => step.sourceCardInstanceId)).size ===
      steps.length &&
    steps.every(
      (step, index) =>
        step !== null &&
        typeof step === "object" &&
        nonblank(step.stepId) &&
        step.order === index &&
        validStepKind(step.kind) &&
        nonblank(step.sourceCardInstanceId) &&
        nonblank(step.sourceCapabilityId) &&
        (step.currentLegalActionId === undefined ||
          (index === 0 && nonblank(step.currentLegalActionId))),
    )
  );
}

function validStepKind(
  value: CorpPunishRouteQuoteRequest["steps"][number]["kind"],
): boolean {
  return (
    value === "tag" ||
    value === "trace_tag" ||
    value === "meat_damage" ||
    value === "net_damage" ||
    value === "core_damage" ||
    value === "hardware_trash" ||
    value === "other_punish"
  );
}

function cloneRequest(
  request: CorpPunishRouteQuoteRequest,
): CorpPunishRouteQuoteRequest {
  return {
    schemaVersion: CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
    matchId: request.matchId,
    side: "corp",
    stateVersion: request.stateVersion,
    timingPoint: request.timingPoint,
    campaignId: request.campaignId,
    routeId: request.routeId,
    steps: request.steps.map((step) => ({ ...step })),
  };
}

function sumActionCost(action: LegalAction, key: "clicks" | "credits"): number {
  return action.costs.reduce((sum, cost) => sum + (cost[key] ?? 0), 0);
}

function nonblank(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function nonNegativeSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

function encodeParts(parts: readonly string[]): string {
  return `${parts.length};${parts
    .map((part) => `${part.length}:${part}`)
    .join("")}`;
}

function quoteFail(
  code: EngineError["code"],
  message: string,
): CorpPunishRouteQuoteResult {
  return { ok: false, error: { code, message } };
}
