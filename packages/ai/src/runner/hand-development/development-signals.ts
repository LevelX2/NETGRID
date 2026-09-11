import { type RunnerCorePlanDomain } from "../../plans/runner-core-plan-contracts";
import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { runnerImmediateAgendaPointGain } from "../../actions/runner-agenda-point-effect";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definition-compatibility";
import { rolesForDeckDoctrineCard } from "../../deck-doctrine-card-roles";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { type ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";

import { type RunnerPlanDomain } from "../../plans/runner-tactical-plan-contracts";
import { runnerEffectsProvideNonNoisyBreakerCredits } from "../../runner-canonical-hint-semantics";
import type { RunnerHandDevelopmentEvaluation } from "./hand-development-evaluation";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../../runner-run-target-evaluation";
import type { RunnerStrategicIntentProfile } from "../../runner-strategic-intent";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { rolesHaveBreakerRole } from "../../runtime/breaker-role-match";
import { uniqueBy } from "../../runtime/collection";
import { mergedPublicHistory } from "../../runtime/public-event-history";
import { rolesMatch } from "../../runtime/role-match";
import {
  runnerAccessPayoffCampaignTargetIsViable,
  runnerCentralPayoffServer,
  runnerCentralPayoffServerForDefinition,
} from "../../runtime/runner-access-payoff-facts";
import {
  runnerCandidateSourceDefinitionId,
  runnerInstallSourceInstanceId,
} from "../../runtime/runner-action-source-facts";
import { type RunnerHandRotationAssessment } from "../../runtime/runner-hand-rotation-assessment";
import {
  runnerCandidateSourceSupportsProgramSearch,
  runnerProgramSearchSourceCardInstanceId,
} from "../../runtime/runner-program-search-facts";
import { runnerDefinitionRequiresTargetedBypassPlan } from "../../runtime/runner-targeted-bypass-plan";
import { type RunnerDevelopmentSignal } from "./development-types";

export function runnerProgramSearchRecentlyResolved(
  input: AiDecisionInput,
): boolean {
  return uniqueBy(
    [...input.playerView.publicEvents, ...input.eventTail],
    (event) => event.eventId,
  ).some(
    (event) =>
      event.publicPayload?.actor === "runner" &&
      event.publicPayload?.hiddenZoneAction === "p3_37_search_stack_to_grip",
  );
}

function runnerUnrepresentedProgramDevelopmentTargets(
  input: AiDecisionInput,
): string[] | undefined {
  const deckSnapshot = (input as AiDecisionInputWithDeckCapabilities)
    .ownDeckSnapshot;
  if (!deckSnapshot) return undefined;
  const representedDefinitions = new Set(
    [
      ...input.playerView.own.gripOrHq,
      ...(input.playerView.own.rig ?? []),
    ].flatMap((card) => (card.definitionId ? [card.definitionId] : [])),
  );
  const discardedByDefinition = new Map<string, number>();
  for (const card of input.playerView.own.heapOrArchives ?? []) {
    if (!card.definitionId) continue;
    discardedByDefinition.set(
      card.definitionId,
      (discardedByDefinition.get(card.definitionId) ?? 0) + 1,
    );
  }
  return deckSnapshot.cards.flatMap((entry) => {
    const definition = CARD_DEFINITIONS_BY_ID[entry.cardId];
    const plausibleStackCopies =
      entry.quantity - (discardedByDefinition.get(entry.cardId) ?? 0);
    return definition?.type === "program" &&
      plausibleStackCopies > 0 &&
      !representedDefinitions.has(entry.cardId)
      ? [entry.cardId]
      : [];
  });
}

export type RunnerStrategicProgramSearchTarget = {
  definitionId: string;
  purpose:
    | "recurring_breaker_economy"
    | "memory_support"
    | "rd_pressure_support"
    | "hq_pressure_support";
  rank: number;
  evidenceCodes: string[];
};

function runnerStrategicProgramSearchTargets(
  input: AiDecisionInput,
  strategicIntent: RunnerStrategicIntentProfile,
): RunnerStrategicProgramSearchTarget[] | undefined {
  const unrepresented = runnerUnrepresentedProgramDevelopmentTargets(input);
  if (!unrepresented) return undefined;
  const strategicState = (input as AiDecisionInputWithDeckCapabilities)
    .ownStrategicIntentState;
  const preferredCentral =
    strategicState?.targetVector.kind === "central" &&
    (strategicState.targetVector.targetId === "rd" ||
      strategicState.targetVector.targetId === "hq")
      ? strategicState.targetVector.targetId
      : undefined;
  const recurringEngineActive = strategicIntent.engineLineIds?.includes(
    "runner.engine.compatible_recurring_economy",
  );
  const recurringProviderIds = new Set(
    (strategicIntent.engineProviders ?? [])
      .filter((provider) =>
        provider.capabilities.includes("runner.economy.recurring_breaker"),
      )
      .map((provider) => provider.cardId),
  );
  const compatibleBreakerDemand =
    runnerHasCompatibleNonNoisyBreakerDemand(input);
  const memoryRemaining =
    typeof input.playerView.own.memoryLimit === "number"
      ? input.playerView.own.memoryLimit -
        (input.playerView.own.memoryUsed ?? 0)
      : undefined;
  return unrepresented
    .flatMap((definitionId): RunnerStrategicProgramSearchTarget[] => {
      const definition = CARD_DEFINITIONS_BY_ID[definitionId];
      if (!definition || definition.type !== "program") return [];
      const roles = rolesForDeckDoctrineCard(definitionId);
      const subtypes = new Set(
        (definition.subtypes ?? []).map((subtype) =>
          subtype.trim().toLocaleLowerCase("en-US"),
        ),
      );
      const breaker =
        rolesHaveBreakerRole(roles) ||
        ["icebreaker", "fracter", "decoder", "killer", "worm"].some((subtype) =>
          subtypes.has(subtype),
        );
      if (breaker) return [];

      const hint = AI_HINTS_BY_CARD.get(definitionId);
      const immediatelyInstallable =
        (definition.installCost ?? Number.POSITIVE_INFINITY) <=
          input.playerView.own.credits &&
        (memoryRemaining === undefined ||
          (definition.memoryCost ?? 0) <= memoryRemaining);
      const feasibilityRank = immediatelyInstallable ? 20 : 0;
      if (
        recurringEngineActive &&
        recurringProviderIds.has(definitionId) &&
        compatibleBreakerDemand &&
        runnerEffectsProvideNonNoisyBreakerCredits(hint?.effects)
      ) {
        return [
          {
            definitionId,
            purpose: "recurring_breaker_economy",
            rank: 400 + feasibilityRank,
            evidenceCodes: [
              "runner_program_search_target_non_noisy_breaker_demand",
              "runner_program_search_target_recurring_engine_active",
            ],
          },
        ];
      }
      if (
        (definition.memoryLimitBonus ?? 0) > 0 &&
        memoryRemaining !== undefined &&
        memoryRemaining <= 1
      ) {
        return [
          {
            definitionId,
            purpose: "memory_support",
            rank: 300 + feasibilityRank,
            evidenceCodes: [
              `runner_program_search_target_memory_remaining:${memoryRemaining}`,
            ],
          },
        ];
      }
      if (
        preferredCentral === "rd" &&
        rolesMatch(roles, ["pressure_rnd", "multiaccess_rnd"])
      ) {
        return [
          {
            definitionId,
            purpose: "rd_pressure_support",
            rank: 200 + feasibilityRank,
            evidenceCodes: ["runner_program_search_target_active_rd_pressure"],
          },
        ];
      }
      if (
        preferredCentral === "hq" &&
        rolesMatch(roles, ["pressure_hq", "multiaccess_hq"])
      ) {
        return [
          {
            definitionId,
            purpose: "hq_pressure_support",
            rank: 200 + feasibilityRank,
            evidenceCodes: ["runner_program_search_target_active_hq_pressure"],
          },
        ];
      }
      return [];
    })
    .sort(
      (left, right) =>
        right.rank - left.rank ||
        left.definitionId.localeCompare(right.definitionId),
    );
}

function runnerHasCompatibleNonNoisyBreakerDemand(
  input: AiDecisionInput,
): boolean {
  return [
    ...input.playerView.own.gripOrHq,
    ...(input.playerView.own.rig ?? []),
  ].some((card) => {
    const roles = rolesForDeckDoctrineCard(card.definitionId ?? "");
    const subtypes = new Set(
      (card.subtypes ?? []).map((subtype) =>
        subtype.trim().toLocaleLowerCase("en-US"),
      ),
    );
    return (
      (rolesHaveBreakerRole(roles) ||
        ["icebreaker", "fracter", "decoder", "killer", "worm"].some((subtype) =>
          subtypes.has(subtype),
        )) &&
      !subtypes.has("noisy")
    );
  });
}

export function runnerHandDevelopmentExplicitlyRejected(
  evaluation: RunnerHandDevelopmentEvaluation,
): boolean {
  return (
    evaluation.deferReason === "duplicate" ||
    evaluation.deferReason === "no_current_need" ||
    evaluation.deferReason === "missing_mu" ||
    evaluation.deferReason === "timing" ||
    evaluation.deferReason === "preserve_credit_floor" ||
    evaluation.deferReason === "stronger_override" ||
    evaluation.availability === "not_relevant_now" ||
    evaluation.persistentInstallEvaluation?.duplicateRole ===
      "redundant_duplicate"
  );
}

export function runnerHandDevelopmentRejectionForCandidate(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  evaluations: readonly RunnerHandDevelopmentEvaluation[],
): RunnerHandDevelopmentEvaluation | undefined {
  const action = input.legalActions.find(
    (entry) => entry.actionId === candidate.actionId,
  );
  const sourceCardInstanceId = runnerInstallSourceInstanceId(candidate, action);
  const sourceDefinitionId = runnerCandidateSourceDefinitionId(
    input,
    candidate,
  );
  return evaluations.find(
    (evaluation) =>
      runnerHandDevelopmentExplicitlyRejected(evaluation) &&
      (evaluation.legalActionId === candidate.actionId ||
        (evaluation.cardInstanceId === sourceCardInstanceId &&
          evaluation.definitionId === sourceDefinitionId)),
  );
}

export type RunnerLiquiditySaturationOptionDevelopment = Readonly<{
  admissible: boolean;
  evidenceCodes: readonly string[];
}>;

export function runnerLiquiditySaturationOptionDevelopment(
  input: AiDecisionInput,
  reserveTargetCredits: number,
): RunnerLiquiditySaturationOptionDevelopment {
  const currentTurnSerial = input.playerView.turnSerial;
  if (
    !Number.isSafeInteger(currentTurnSerial) ||
    (currentTurnSerial ?? -1) < 2 ||
    input.playerView.own.credits < reserveTargetCredits ||
    input.playerView.own.stackOrRdCount <= 0
  ) {
    return { admissible: false, evidenceCodes: [] };
  }
  const history = mergedPublicHistory(input);
  const currentTurnDrawObserved = history.some((event) => {
    if (
      event.turnSerial !== currentTurnSerial ||
      event.publicPayload.actor !== "runner"
    ) {
      return false;
    }
    const actionType =
      typeof event.publicPayload.actionType === "string"
        ? event.publicPayload.actionType
        : event.type;
    return actionType === "draw_card";
  });
  if (currentTurnDrawObserved) {
    return { admissible: false, evidenceCodes: [] };
  }
  const previousRunnerTurnSerial = history.reduce<number | undefined>(
    (latest, event) => {
      if (
        event.publicPayload.actor !== "runner" ||
        !Number.isSafeInteger(event.turnSerial) ||
        (event.turnSerial ?? -1) >= (currentTurnSerial as number)
      ) {
        return latest;
      }
      const actionType =
        typeof event.publicPayload.actionType === "string"
          ? event.publicPayload.actionType
          : event.type;
      if (actionType === "end_turn" || actionType === "resolve_choice") {
        return latest;
      }
      return latest === undefined
        ? event.turnSerial
        : Math.max(latest, event.turnSerial as number);
    },
    undefined,
  );
  if (previousRunnerTurnSerial === undefined) {
    return { admissible: false, evidenceCodes: [] };
  }
  const previousRunnerTurnActions = history
    .filter(
      (event) =>
        event.turnSerial === previousRunnerTurnSerial &&
        event.publicPayload.actor === "runner",
    )
    .map((event) =>
      typeof event.publicPayload.actionType === "string"
        ? event.publicPayload.actionType
        : event.type,
    )
    .filter(
      (actionType) =>
        actionType !== "end_turn" && actionType !== "resolve_choice",
    );
  const liquidityConversionCount = previousRunnerTurnActions.filter(
    (actionType) => actionType === "gain_credit",
  ).length;
  const optionDevelopmentDrawCount = previousRunnerTurnActions.filter(
    (actionType) => actionType === "draw_card",
  ).length;
  const previousTurnWasPureLiquidity =
    liquidityConversionCount >= 3 &&
    previousRunnerTurnActions.every(
      (actionType) => actionType === "gain_credit",
    );
  const previousTurnContinuedOnlyOptionDevelopment =
    optionDevelopmentDrawCount === 1 &&
    liquidityConversionCount >= 2 &&
    previousRunnerTurnActions.every(
      (actionType) =>
        actionType === "draw_card" || actionType === "gain_credit",
    );
  if (
    !previousTurnWasPureLiquidity &&
    !previousTurnContinuedOnlyOptionDevelopment
  ) {
    return { admissible: false, evidenceCodes: [] };
  }
  return {
    admissible: true,
    evidenceCodes: [
      previousTurnWasPureLiquidity
        ? "runner_previous_turn_exhausted_into_basic_liquidity"
        : "runner_previous_turn_advanced_only_by_bounded_option_draw",
      `runner_previous_liquidity_turn:${previousRunnerTurnSerial}`,
      `runner_previous_liquidity_conversions:${liquidityConversionCount}`,
      `runner_liquidity_reserve_saturated:${reserveTargetCredits}`,
      `runner_option_development_cadence_available:${currentTurnSerial}`,
    ],
  };
}

export function runnerEventInstallChoiceDevelopmentSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  previous: ResidentPlanPortfolio | undefined,
): RunnerPlanDomain["developments"] {
  const choice = input.playerView.pendingChoice;
  const continuation = choice?.continuation;
  if (
    input.side !== "runner" ||
    !choice ||
    continuation?.family !== "runner_grip_install_with_temporary_credits"
  )
    return [];
  const previousInstance = previous?.instances.find((instance) => {
    const moduleState = instance.moduleState as
      | { kind?: unknown; signal?: RunnerDevelopmentSignal }
      | undefined;
    return (
      instance.instanceId === previous.executorInstanceId &&
      instance.moduleId === "runner.develop_board_and_hand" &&
      instance.executionState === "executor" &&
      moduleState?.kind === "development" &&
      moduleState.signal?.eventInstallChoiceCommitment !== undefined
    );
  });
  const previousSignal = (
    previousInstance?.moduleState as
      | { kind?: unknown; signal?: RunnerDevelopmentSignal }
      | undefined
  )?.signal;
  const commitment = previousSignal?.eventInstallChoiceCommitment;
  const commitmentReachedChoiceDirectly =
    commitment?.selectedAtStateVersion === previous?.stateVersion &&
    commitment?.engineContinuationAtStateVersion === undefined;
  const commitmentReachedChoiceThroughEngineContinuation =
    commitment?.selectedAtStateVersion !== undefined &&
    commitment?.selectedAtStateVersion < (previous?.stateVersion ?? 0) &&
    commitment?.engineContinuationAtStateVersion === previous?.stateVersion;
  const choiceCandidates = candidates.filter(
    (candidate) =>
      candidate.actionType === "resolve_choice" &&
      candidate.semanticActionType === "choice.resolve",
  );
  const legalAction =
    choiceCandidates.length === 1
      ? input.legalActions.find(
          (action) => action.actionId === choiceCandidates[0]!.actionId,
        )
      : undefined;
  const requirement = legalAction?.choiceRequirements?.[0];
  const selectableOptions = choice.options.filter(
    (option) => option.selectable !== false && typeof option.value === "string",
  );
  const selectableOptionIds = selectableOptions.map((option) => option.id);
  const exactChoiceContract =
    choice.side === "runner" &&
    choice.kind === "select_cards" &&
    choice.visibility === "hidden_info_barrier" &&
    choice.stateVersion === input.playerView.stateVersion &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    continuation.createdAtStateVersion === input.playerView.stateVersion &&
    previous?.stateVersion === input.playerView.stateVersion - 1 &&
    previousInstance !== undefined &&
    previousSignal !== undefined &&
    commitment !== undefined &&
    (commitmentReachedChoiceDirectly ||
      commitmentReachedChoiceThroughEngineContinuation) &&
    commitment.sourceActionId === continuation.originActionId &&
    commitment.sourceCardInstanceId === continuation.sourceCardInstanceId &&
    commitment.sourceDefinitionId === continuation.sourceCardDefinitionId &&
    commitment.sourceCapabilityKey === continuation.sourceCapabilityKey &&
    continuation.originActionId.length > 0 &&
    continuation.sourceCardInstanceId.length > 0 &&
    continuation.sourceCardDefinitionId.length > 0 &&
    continuation.sourceCapabilityKey.length > 0 &&
    Number.isSafeInteger(continuation.temporaryCredits) &&
    continuation.temporaryCredits > 0 &&
    continuation.allowedTypes.length > 0 &&
    new Set(continuation.allowedTypes).size ===
      continuation.allowedTypes.length &&
    legalAction?.side === "runner" &&
    legalAction.type === "resolve_choice" &&
    legalAction.source === "game_rule" &&
    legalAction.expiresAtStateVersion === input.playerView.stateVersion &&
    legalAction.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    requirement.optionIds.length === choice.options.length &&
    choice.options.every((option) => requirement.optionIds.includes(option.id));
  if (!exactChoiceContract || !legalAction || choiceCandidates.length !== 1)
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: choiceCandidates.map(
        (candidate) => candidate.actionId,
      ),
      owner: "continuation",
      removalCondition:
        "The Engine-opened event install choice must preserve its exact canonical capability, source action, selectable options and current resolve-choice LegalAction contract.",
    });
  const selectedOption = selectableOptions.find(
    (option) => option.value === commitment?.targetCardInstanceId,
  );
  const selectedCard = commitment
    ? input.playerView.own.gripOrHq.find(
        (card) => card.instanceId === commitment.targetCardInstanceId,
      )
    : undefined;
  if (
    !commitment ||
    !selectedOption ||
    !selectedCard?.definitionId ||
    selectedCard.known === false ||
    selectedCard.definitionId !== commitment.targetDefinitionId ||
    (selectedCard.type !== "program" && selectedCard.type !== "hardware") ||
    !continuation.allowedTypes.includes(selectedCard.type) ||
    !selectableOptionIds.includes(selectedOption.id)
  )
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [legalAction.actionId],
      owner: "continuation",
      removalCondition:
        "The resident runner development plan must bind one selectable visible program or hardware target before resolving the event-install choice.",
    });
  const originSelectedAtStateVersion = commitment.selectedAtStateVersion;
  if (originSelectedAtStateVersion === undefined)
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [legalAction.actionId],
      owner: "continuation",
      removalCondition:
        "The event-install choice must preserve the state version selected by its original development executor.",
    });
  return [
    {
      ...previousSignal,
      targetKind: "capability",
      phase: "resolve_event_install_choice",
      semanticActionTypes: [choiceCandidates[0]!.semanticActionType],
      actionIds: [legalAction.actionId],
      evidenceCode:
        "runner_event_install_choice_target_bound_by_development_plan",
      eventInstallChoiceBinding: {
        choiceId: choice.choiceId,
        actionId: legalAction.actionId,
        sourceCardInstanceId: continuation.sourceCardInstanceId,
        sourceDefinitionId: continuation.sourceCardDefinitionId,
        sourceCapabilityKey: continuation.sourceCapabilityKey,
        sourceStateVersion: input.playerView.stateVersion,
        originSelectedAtStateVersion,
        choiceSource: choice.source,
        selectedOptionId: selectedOption.id,
        targetCardInstanceId: commitment.targetCardInstanceId,
        targetDefinitionId: selectedCard.definitionId,
      },
    },
  ];
}

export function runnerProgramSearchStrategyDevelopmentSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  strategicIntent: RunnerStrategicIntentProfile,
  coverageGaps: RunnerCorePlanDomain["coverageGaps"],
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[],
): RunnerPlanDomain["developments"] {
  if (
    runnerProgramSearchRecentlyResolved(input) &&
    input.playerView.own.gripOrHq.some(
      (card) => card.known && card.type === "program",
    )
  ) {
    return [];
  }
  const strategicState = (input as AiDecisionInputWithDeckCapabilities)
    .ownStrategicIntentState;
  if (
    !(strategicIntent.setupEngine ?? []).some(
      (setup) =>
        setup === "runner.search_breaker_setup" ||
        setup === "runner.draw_or_search_setup",
    ) &&
    strategicState?.primaryStrategy.strategyId !== "runner.search.breaker"
  ) {
    return [];
  }
  if (
    input.playerView.own.gripOrHq.length >= input.playerView.own.maxHandSize
  ) {
    return [];
  }
  const strategicTargets = runnerStrategicProgramSearchTargets(
    input,
    strategicIntent,
  );
  const target = strategicTargets?.[0];
  if (!target) return [];
  const coverageOwnedActionIds = new Set(
    coverageGaps.flatMap((gap) =>
      gap.answerInHand ? [] : gap.directSearchActionIds,
    ),
  );
  const bySource = new Map<
    string,
    {
      sourceCardInstanceId: string;
      sourceDefinitionId: string;
      candidates: ActionSemanticCandidate[];
    }
  >();
  for (const candidate of candidates) {
    if (
      !runnerCandidateSourceSupportsProgramSearch(input, candidate) ||
      coverageOwnedActionIds.has(candidate.actionId) ||
      runnerHandDevelopmentRejectionForCandidate(
        input,
        candidate,
        handDevelopment,
      ) !== undefined
    ) {
      continue;
    }
    const sourceDefinitionId = runnerCandidateSourceDefinitionId(
      input,
      candidate,
    );
    const sourceCardInstanceId = runnerProgramSearchSourceCardInstanceId(
      input,
      candidate,
    );
    if (!sourceDefinitionId || !sourceCardInstanceId) continue;
    const sourceKey = sourceCardInstanceId;
    const group = bySource.get(sourceKey);
    if (group) {
      group.candidates.push(candidate);
    } else {
      bySource.set(sourceKey, {
        sourceCardInstanceId,
        sourceDefinitionId,
        candidates: [candidate],
      });
    }
  }
  return [...bySource.entries()].map(
    ([
      sourceKey,
      {
        sourceCardInstanceId,
        sourceDefinitionId,
        candidates: sourceCandidates,
      },
    ]) => ({
      developmentId: `program-search:${sourceKey}`,
      definitionId: sourceDefinitionId,
      targetKind: "capability" as const,
      phase: "execute" as const,
      purposeCode: `search_${target.purpose}`,
      assignedDomainPlanIds: [],
      duplicateAlreadyInstalled: false,
      affordableOrSupportable: true,
      semanticActionTypes: [
        ...new Set(
          sourceCandidates.map((candidate) => candidate.semanticActionType),
        ),
      ],
      actionIds: sourceCandidates.map((candidate) => candidate.actionId).sort(),
      priorityClass: "P5" as const,
      value: 20,
      evidenceCode: `runner_program_search_strategy_target:${target.definitionId}`,
      evidenceCodes: [
        `runner_program_search_source:${sourceDefinitionId}`,
        `runner_program_search_target_purpose:${target.purpose}`,
        ...target.evidenceCodes,
      ],
      programSearchCommitment: {
        sourceCardInstanceId,
        sourceDefinitionId,
        targetDefinitionId: target.definitionId,
        targetPurpose: target.purpose,
        plannedAtStateVersion: input.playerView.stateVersion,
      },
    }),
  );
}

export function runnerGenericDrawDevelopmentSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  strategicIntent: RunnerStrategicIntentProfile,
  coverageGaps: RunnerCorePlanDomain["coverageGaps"],
  handRotation: RunnerHandRotationAssessment,
  liquiditySaturation: RunnerLiquiditySaturationOptionDevelopment,
): RunnerPlanDomain["developments"] {
  if (!handRotation.genericDrawAdmissible && !liquiditySaturation.admissible)
    return [];
  const fullHandHasKnownRotationTarget =
    handRotation.handCapacityGap <= 0 &&
    handRotation.knownRotationTargetCardInstanceIds.length > 0;
  const drawCandidates = candidates.filter(
    (candidate) =>
      (candidate.actionType === "draw_card" &&
        candidate.semanticActionType === "draw.card" &&
        candidate.sourceKind === "basic_action") ||
      (handRotation.handCapacityGap > 0 &&
        candidate.sourceKind === "card" &&
        candidate.tagEffectProfile?.acuteTagRemoval !== true &&
        candidate.economyProjection?.timing === "immediate" &&
        (candidate.economyProjection.netHandDelta ?? 0) > 0 &&
        (candidate.economyProjection.netHandDelta ?? 0) <=
          Math.max(0, handRotation.handCapacityGap)),
  );
  if (drawCandidates.length === 0) return [];
  const throughputTendency = strategicIntent.developmentTendencies?.find(
    (tendency) =>
      tendency.tendencyId ===
        "runner.development.throughput_until_dependency_ready" &&
      tendency.ownerModuleId === "runner.develop_board_and_hand" &&
      tendency.strength !== "low",
  );
  const doctrineThroughputActive =
    throughputTendency !== undefined && coverageGaps.length > 0;
  const doctrineValue =
    throughputTendency?.strength === "high"
      ? 20
      : throughputTendency?.strength === "medium"
        ? 10
        : 0;
  return [
    {
      developmentId: "generic:draw-options",
      definitionId: "runner_option_development",
      targetKind: "capability",
      phase: "execute",
      purposeCode: liquiditySaturation.admissible
        ? "escape_repeated_liquidity_saturation"
        : fullHandHasKnownRotationTarget
          ? "rotate_functionally_dead_hand_card"
          : "increase_hand_option_density",
      assignedDomainPlanIds: [],
      duplicateAlreadyInstalled: false,
      affordableOrSupportable: true,
      semanticActionTypes: [
        ...new Set(
          drawCandidates.map((candidate) => candidate.semanticActionType),
        ),
      ],
      actionIds: drawCandidates.map((candidate) => candidate.actionId),
      priorityClass: liquiditySaturation.admissible ? "P5" : "P6",
      value: liquiditySaturation.admissible
        ? 1
        : (fullHandHasKnownRotationTarget
            ? 18
            : 10 + Math.min(5, handRotation.handCapacityGap)) +
          (doctrineThroughputActive ? doctrineValue : 0),
      evidenceCode: liquiditySaturation.admissible
        ? "runner_repeated_liquidity_saturation_opens_option_development"
        : fullHandHasKnownRotationTarget
          ? "runner_full_hand_has_functionally_dead_rotation_target"
          : "runner_hand_capacity_accepts_immediate_option_development",
      ...(liquiditySaturation.admissible
        ? {
            evidenceCodes: [
              "runner_engine_owner:runner.develop_board_and_hand",
              ...liquiditySaturation.evidenceCodes,
              ...handRotation.evidenceCodes,
            ],
          }
        : doctrineThroughputActive
          ? {
              evidenceCodes: [
                "runner_engine_doctrine:throughput_until_dependency_ready",
                "runner_engine_owner:runner.develop_board_and_hand",
                ...handRotation.evidenceCodes,
                ...coverageGaps.map(
                  (gap) => `runner_engine_open_coverage_gap:${gap.gapId}`,
                ),
              ],
            }
          : { evidenceCodes: [...handRotation.evidenceCodes] }),
    },
  ];
}

export function runnerImmediateAgendaPointDevelopmentSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  terminalWins: RunnerPlanDomain["terminalWins"],
): RunnerPlanDomain["developments"] {
  const terminalActionIds = new Set(
    (terminalWins ?? []).flatMap((signal) => signal.actionIds ?? []),
  );
  return candidates.flatMap((candidate) => {
    const agendaPointGain = runnerImmediateAgendaPointGain(candidate);
    if (
      agendaPointGain === undefined ||
      terminalActionIds.has(candidate.actionId)
    ) {
      return [];
    }
    if (!candidate.sourceDefinitionId || !candidate.sourceCardInstanceId) {
      throw new PlanResolutionFailure("missing_action_semantics", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map((action) => action.type),
        unresolvedActionIds: [candidate.actionId],
        owner: "action_semantics",
        removalCondition:
          "Every legal immediate Runner agenda-point conversion must expose its exact source definition and card instance.",
      });
    }
    return [
      {
        developmentId: `agenda-point:${candidate.sourceCardInstanceId}`,
        definitionId: candidate.sourceDefinitionId,
        phase: "execute" as const,
        purposeCode: "convert_legal_agenda_point",
        assignedDomainPlanIds: [],
        duplicateAlreadyInstalled: false,
        affordableOrSupportable: true,
        semanticActionTypes: [candidate.semanticActionType],
        actionIds: [candidate.actionId],
        priorityClass: "P3" as const,
        value: 900 + agendaPointGain * 100,
        evidenceCode: "runner_legal_immediate_agenda_point_conversion",
      },
    ];
  });
}

export function runnerCentralPressureDevelopmentSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[],
  runTargets: readonly RunnerRunTargetEvaluation[],
  coverageGaps: RunnerPlanDomain["coverageGaps"],
  strategicIntent: RunnerStrategicIntentProfile,
  economy: RunnerEconomyPosture,
): RunnerPlanDomain["centralPressure"] {
  const eligible = handDevelopment.flatMap((evaluation) => {
    if (
      evaluation.developmentRole !== "access_payoff" ||
      !evaluation.definitionId ||
      runnerDefinitionRequiresTargetedBypassPlan(evaluation.definitionId)
    ) {
      return [];
    }
    const candidate = evaluation.legalActionId
      ? candidates.find(
          (entry) =>
            entry.actionId === evaluation.legalActionId &&
            runnerCandidateSourceDefinitionId(input, entry) ===
              evaluation.definitionId,
        )
      : undefined;
    const supportsPrimaryStrategy = candidate?.strategySupport.some(
      (support) => support.strategyId === strategicIntent.primaryWinIntent,
    );
    if (
      evaluation.strategicFit !== "strong" &&
      evaluation.strategicFit !== "medium" &&
      !supportsPrimaryStrategy
    ) {
      return [];
    }
    const serverId =
      (candidate ? runnerCentralPayoffServer(candidate) : undefined) ??
      runnerCentralPayoffServerForDefinition(evaluation.definitionId);
    if (!serverId) return [];
    const target = [...runTargets]
      .filter(
        (entry) =>
          entry.targetServerId === serverId ||
          entry.accessServerId === serverId,
      )
      .sort(
        (left, right) =>
          right.score - left.score ||
          left.actionId.localeCompare(right.actionId),
      )[0];
    if (
      !target ||
      !runnerAccessPayoffCampaignTargetIsViable(input, target, coverageGaps)
    ) {
      return [];
    }
    const installedCopyCount =
      evaluation.persistentInstallEvaluation?.installedSameDefinitionCount ??
      (input.playerView.own.rig ?? []).filter(
        (card) => card.definitionId === evaluation.definitionId,
      ).length;
    const openingReserveConversion =
      evaluation.availability === "legal_now" &&
      evaluation.deferReason === "preserve_credit_floor" &&
      evaluation.fundingNeed?.reason === "would_break_floor" &&
      economy.creditReservePolicy.phase === "opening" &&
      economy.creditReservePolicy.remoteScoreThreat === "none" &&
      target.pathPassability === "reachable" &&
      target.pathCost === 0 &&
      (target.recommendation === "run_now" ||
        target.recommendation === "run_if_free") &&
      input.playerView.own.clicks >= 2;
    const legalInstall =
      evaluation.availability === "legal_now" &&
      (evaluation.deferReason === "none" ||
        (evaluation.deferReason === "duplicate" && installedCopyCount === 0) ||
        openingReserveConversion) &&
      candidate?.semanticActionType === "install.card";
    const waitingForInstallFunding =
      evaluation.availability === "missing_credits" &&
      evaluation.deferReason === "missing_credits" &&
      evaluation.fundingNeed !== undefined;
    if (!legalInstall && !waitingForInstallFunding) return [];
    const installCost =
      evaluation.fundingNeed?.installOrPlayCost ??
      evaluation.persistentInstallEvaluation?.installCost ??
      candidate?.costProfile.creditCost;
    if (!Number.isSafeInteger(installCost) || installCost! < 0) return [];
    const marginalValue =
      Math.min(300, Math.max(1, evaluation.priority)) -
      installedCopyCount * 140;
    if (marginalValue <= 0) return [];
    return [
      {
        evaluation,
        candidate,
        serverId,
        target,
        installedCopyCount,
        installCost: installCost!,
        marginalValue,
        reserveFundingOptional: openingReserveConversion,
      },
    ];
  });
  const byServer = new Map<string, typeof eligible>();
  for (const entry of eligible) {
    const current = byServer.get(entry.serverId) ?? [];
    current.push(entry);
    byServer.set(entry.serverId, current);
  }
  return [...byServer.entries()].flatMap(([serverId, entries]) => {
    const ordered = entries.sort(
      (left, right) =>
        right.marginalValue - left.marginalValue ||
        right.target.score - left.target.score ||
        left.evaluation.cardInstanceId.localeCompare(
          right.evaluation.cardInstanceId,
        ),
    );
    const selected = ordered[0];
    if (!selected) return [];
    const installAffordabilityGap = Math.max(
      0,
      selected.installCost - input.playerView.own.credits,
    );
    const reserveFundingGap = selected.reserveFundingOptional
      ? Math.max(0, selected.evaluation.fundingNeed?.missingCredits ?? 0)
      : 0;
    const fundingGap = Math.max(installAffordabilityGap, reserveFundingGap);
    const fundingTargetCredits = Math.max(
      selected.installCost,
      input.playerView.own.credits + fundingGap,
    );
    const runFundingTargetCredits = Math.max(
      0,
      selected.target.pathCost + economy.minimumCreditFloor,
    );
    const supportNeedId =
      fundingGap > 0
        ? `access-payoff-support:central:${serverId}:${selected.evaluation.cardInstanceId}`
        : undefined;
    const evidenceCodes = [
      "runner_access_payoff_campaign_parent:runner.pressure_central",
      `runner_access_payoff_campaign_server:${serverId}`,
      `runner_access_payoff_campaign_card:${selected.evaluation.cardInstanceId}`,
      `runner_access_payoff_campaign_desired_copies:${selected.installedCopyCount + 1}`,
      `runner_access_payoff_campaign_install_cost:${selected.installCost}`,
      `runner_access_payoff_campaign_funding_target_credits:${fundingTargetCredits}`,
      `runner_access_payoff_campaign_run_target_credits:${runFundingTargetCredits}`,
      `runner_access_payoff_campaign_funding_gap:${fundingGap}`,
      `runner_access_payoff_campaign_reserve_funding_optional:${selected.reserveFundingOptional}`,
      `runner_access_payoff_campaign_milestone:${fundingGap > 0 ? "fund_install" : "install_payoff"}`,
    ];
    return [
      {
        pressureId: `central:${serverId}`,
        serverId: serverId as "hq" | "rd" | "archives",
        purpose: "multiaccess" as const,
        strategyLineIds: [
          ...new Set([
            strategicIntent.primaryWinIntent,
            ...(selected.candidate?.strategySupport.map(
              (support) => support.strategyId,
            ) ?? []),
          ]),
        ],
        priorityClass: "P4" as const,
        reachable:
          selected.candidate !== undefined && supportNeedId === undefined,
        marginalValue: selected.marginalValue,
        evidenceCode: `runner_access_payoff_campaign:${serverId}:${selected.evaluation.cardInstanceId}`,
        sourceDefinitionIds: [selected.evaluation.definitionId!],
        preparationActionIds: selected.candidate
          ? [selected.candidate.actionId]
          : [],
        rejectedPreparationActionIds: ordered
          .slice(1)
          .flatMap((entry) =>
            entry.candidate ? [entry.candidate.actionId] : [],
          ),
        ...(supportNeedId ? { supportNeedId } : {}),
        routePreparation: "develop_payoff" as const,
        accessPayoffCampaign: {
          payoffCardInstanceId: selected.evaluation.cardInstanceId,
          payoffDefinitionId: selected.evaluation.definitionId!,
          desiredCopyCount: selected.installedCopyCount + 1,
          installedCopyCount: selected.installedCopyCount,
          selectedCopyOrdinal: selected.installedCopyCount + 1,
          installCost: selected.installCost,
          fundingTargetCredits,
          runFundingTargetCredits,
          totalFundingEnvelope: selected.installCost + runFundingTargetCredits,
          fundingGap,
          reserveFundingOptional: selected.reserveFundingOptional,
          horizon: fundingGap > 0 ? "bounded_multi_turn" : "same_turn",
          milestone: fundingGap > 0 ? "fund_install" : "install_payoff",
          evidenceCodes,
        },
      },
    ];
  });
}

export function runnerAccessPayoffDevelopmentLacksBoundAccessRoute(
  evaluation: RunnerHandDevelopmentEvaluation,
  candidate: ActionSemanticCandidate | undefined,
  runTargets: readonly RunnerRunTargetEvaluation[],
  coverageGaps: RunnerPlanDomain["coverageGaps"],
): boolean {
  if (
    evaluation.developmentRole !== "access_payoff" ||
    !evaluation.definitionId
  ) {
    return false;
  }
  const serverId =
    (candidate ? runnerCentralPayoffServer(candidate) : undefined) ??
    runnerCentralPayoffServerForDefinition(evaluation.definitionId);
  if (!serverId) return false;
  const targetEvaluations = runTargets.filter(
    (target) =>
      target.targetServerId === serverId || target.accessServerId === serverId,
  );
  if (targetEvaluations.length === 0) return false;
  const currentAccessRoute = targetEvaluations.some(
    (target) =>
      target.pathPassability === "reachable" &&
      target.score > 0 &&
      (target.recommendation === "run_now" ||
        target.recommendation === "run_if_free"),
  );
  if (currentAccessRoute) return false;
  const boundCoverageContinuation = coverageGaps.some(
    (gap) =>
      (gap.targetServerId === undefined || gap.targetServerId === serverId) &&
      (gap.answerInHand || (gap.directSearchActionIds?.length ?? 0) > 0),
  );
  return !boundCoverageContinuation;
}
