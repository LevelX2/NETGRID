import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { type ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { type RunnerCorePlanDomain } from "../../plans/runner-core-plan-contracts";
import { ActiveRunnerRunRoot } from "../../plans/runner-run-origin-contract";
import { runnerCardRunHasVisibleDifferentialPayoff } from "../../plans/runner-run-payoff";
import {
  runnerInformationProbeCanUseQuotedPath,
  runPurposeForEvaluation,
} from "../../plans/runner-run-purpose";
import {
  type RunnerPlanDomain,
  type RunnerPressureSignal,
} from "../../plans/runner-tactical-plan-contracts";
import {
  bestRunTargetsByServer,
  runnerRunFundingSupport,
  runnerRunTargetCanConvertNow,
} from "../../run-analysis/runner-plan-run-funding";
import {
  accessCommitmentForEvaluation,
  planSafeRunExclusionEvidence,
  runRiskContractForEvaluation,
  sourceDefinitionForEvaluation,
  witnessedReachableRunActionIds,
  witnessedRunActionIds,
} from "../../run-analysis/runner-plan-run-route-facts";
import {
  runnerRunLockPreferredServerIds,
  runnerRunLockReleaseRoutes,
} from "../../run-analysis/runner-run-lock-release-routes";
import {
  runnerRezOrTrashPreparationBeatsImmediateRun,
  runnerSameTurnAccessPreparationSourceDefinitionId,
  runnerTargetedBypassPayoffValue,
  runnerTargetedIceTrashPayoffValue,
} from "../../run-analysis/runner-run-preparation";
import { runnerRecentFutureEncounterDamageSafetyAbort } from "../../runner-damage-threat-assessment";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../../runner-run-target-evaluation";
import {
  runnerRunTargetMultiRunPayoffClass,
  runnerRunTargetPlausibleForMultiRun,
} from "../../runner-run-target-guidance";
import type { RunnerStrategicIntentProfile } from "../../runner-strategic-intent";
import { uniqueBy } from "../../runtime/collection";
import {
  mergedPublicHistory,
  serverIdFromEvent,
} from "../../runtime/public-event-history";
import { runnerArchivesHasQualifiedHiddenPayoff } from "../../runtime/runner-archives-score";
import {
  runnerMultiRunEventAssessment,
  type RunnerMultiRunEventAssessment,
} from "../../runtime/runner-multi-run-event-assessment";
import { runnerMultiRunEventScoreValue } from "../../runtime/runner-multi-run-event-score";
import { runnerHqSuccessWindowSetupAssessment } from "../../runtime/runner-start-run-score";
import {
  runnerActionRequiresTargetedBypassPlan,
  runnerDefinitionRequiresTargetedBypassPlan,
  runnerTargetedBypassPlanCommitment,
} from "../run-window/runner-targeted-bypass-plan";
import {
  runnerActionRequiresTargetedIceTrashPlan,
  runnerTargetedIceTrashPlanCommitment,
  runnerTargetedIceTrashState,
  runnerUnrezzedIceTrashRouteOpeningPayoff,
} from "../../runtime/runner-targeted-ice-trash-plan";
import { runnerTerminalContestThreat } from "../../runtime/runner-terminal-contest-threat";
import {
  archivesHasVisibleKnownAgenda,
  archivesIsKnownWithoutAgenda,
} from "../../runtime/visible-server-agenda-facts";
import { runnerDefenseHandBufferFacts } from "../defense-recovery/defense-signals";
import type { RunnerHandDevelopmentEvaluation } from "../hand-development/hand-development-evaluation";
function runnerAccumulatedCentralPressureConversionSignals(
  candidates: readonly ActionSemanticCandidate[],
  pressureSignals: RunnerPlanDomain["centralPressure"],
  previous: ResidentPlanPortfolio | undefined,
): RunnerPlanDomain["centralPressure"] {
  const conversions = candidates.filter(
    (candidate) =>
      candidate.actorSide === "runner" &&
      candidate.actionType === "activated_card_ability" &&
      candidate.abilityBindingMethod === "canonical_capability_id" &&
      candidate.sourceCardInstanceId !== undefined &&
      candidate.sourceDefinitionId !== undefined &&
      candidate.functionalEffects?.some(
        (effect) =>
          effect.kind === "persistent_counter_effect" &&
          effect.scope === "corp" &&
          effect.timing === "action" &&
          effect.resource === "actions" &&
          effect.target === "virus.corp_action_denial" &&
          Number.isFinite(effect.amount) &&
          effect.amount! > 0,
      ) === true,
  );
  if (conversions.length === 0) return [];
  const residentOwner = runnerRunLockPreferredServerIds(previous)
    .flatMap((serverId) =>
      pressureSignals.filter((signal) => signal.serverId === serverId),
    )
    .find((signal) => signal !== undefined);
  const owner =
    residentOwner ??
    [...pressureSignals].sort(
      (left, right) =>
        runnerCentralPressurePriorityOrder(left.priorityClass) -
          runnerCentralPressurePriorityOrder(right.priorityClass) ||
        right.marginalValue - left.marginalValue ||
        left.serverId.localeCompare(right.serverId),
    )[0];
  if (!owner) return [];
  return [
    {
      ...owner,
      priorityClass: "P3",
      reachable: true,
      marginalValue: Math.max(1, owner.marginalValue),
      evidenceCode:
        "runner_accumulated_central_pressure_conversion_is_currently_legal",
      sourceDefinitionIds: [
        ...new Set(
          conversions.flatMap((candidate) =>
            candidate.sourceDefinitionId ? [candidate.sourceDefinitionId] : [],
          ),
        ),
      ],
      preparationActionIds: conversions.map((candidate) => candidate.actionId),
      routePreparation: "convert_accumulated_pressure",
    },
  ];
}

function runnerCentralPressurePriorityOrder(
  priorityClass: RunnerPressureSignal["priorityClass"],
): number {
  return priorityClass === "P2"
    ? 0
    : priorityClass === "P3"
      ? 1
      : priorityClass === "P4"
        ? 2
        : priorityClass === "P5"
          ? 3
          : 4;
}

function runnerTargetedIceTrashCentralPreparationSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  pressureSignals: RunnerPlanDomain["centralPressure"],
  runTargets: readonly RunnerRunTargetEvaluation[],
): RunnerPlanDomain["centralPressure"] {
  const eligiblePlans = pressureSignals.filter(
    (signal) => signal.routePreparation === undefined,
  );
  return candidates
    .filter(runnerActionRequiresTargetedIceTrashPlan)
    .sort((left, right) => left.actionId.localeCompare(right.actionId))
    .flatMap((candidate) => {
      const targetIceState = runnerTargetedIceTrashState(candidate);
      const planTargets = eligiblePlans.flatMap((signal) => {
        const payoffValue = Math.max(
          runnerTargetedIceTrashPayoffValue(
            signal.serverId,
            signal.marginalValue,
            runTargets,
          ),
          targetIceState === "unrezzed" || targetIceState === "rez_or_trash"
            ? runnerUnrezzedIceTrashRouteOpeningPayoff(input, signal.serverId)
            : 0,
          (targetIceState === "unrezzed" ||
            targetIceState === "rez_or_trash") &&
            signal.serverId === "rd" &&
            input.playerView.own.agendaPoints >=
              input.playerView.agendaPointsToWin - 1
            ? 1_000
            : 0,
        );
        if (
          payoffValue <= 0 ||
          !runnerRezOrTrashPreparationBeatsImmediateRun({
            input,
            targetIceState,
            serverId: signal.serverId,
            payoffValue,
            runTargets,
          })
        )
          return [];
        return [
          {
            ownerModuleId: "runner.pressure_central" as const,
            ownerDedupeKey: signal.pressureId,
            serverId: signal.serverId,
            payoffValue,
          },
        ];
      });
      const commitment = runnerTargetedIceTrashPlanCommitment({
        input,
        candidate,
        planTargets,
      });
      if (!commitment) return [];
      const owner = eligiblePlans.find(
        (signal) => signal.pressureId === commitment.ownerDedupeKey,
      );
      if (!owner) return [];
      const payoffValue =
        planTargets.find(
          (target) =>
            target.ownerDedupeKey === commitment.ownerDedupeKey &&
            target.serverId === commitment.serverId,
        )?.payoffValue ?? 0;
      return [
        {
          ...owner,
          reachable: true,
          marginalValue: payoffValue,
          evidenceCode: `runner_targeted_ice_trash_preflight:${commitment.serverId}:${commitment.targetIceInstanceId}`,
          sourceDefinitionIds: [commitment.sourceDefinitionId],
          preparationActionIds: [commitment.sourceActionId],
          routePreparation: "targeted_ice_trash" as const,
          targetedIceTrashCommitment: commitment,
        },
      ];
    })
    .slice(0, 1);
}

function runnerTargetedBypassCentralPreparationSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  pressureSignals: RunnerPlanDomain["centralPressure"],
  runTargets: readonly RunnerRunTargetEvaluation[],
): RunnerPlanDomain["centralPressure"] {
  const eligiblePlans = pressureSignals.filter(
    (signal) =>
      signal.routePreparation === undefined &&
      !runnerCentralPressureHasExecutableEventRun(
        signal,
        candidates,
        runTargets,
      ),
  );
  return candidates
    .filter(runnerActionRequiresTargetedBypassPlan)
    .sort((left, right) => left.actionId.localeCompare(right.actionId))
    .flatMap((candidate) => {
      const planTargets = eligiblePlans.flatMap((signal) => {
        const payoffValue = runnerTargetedBypassPayoffValue(
          signal.serverId,
          runTargets,
        );
        if (payoffValue <= 0) return [];
        return [
          {
            ownerModuleId: "runner.pressure_central" as const,
            ownerDedupeKey: signal.pressureId,
            serverId: signal.serverId,
            payoffValue,
          },
        ];
      });
      const commitment = runnerTargetedBypassPlanCommitment({
        input,
        candidate,
        planTargets,
      });
      if (!commitment) return [];
      const owner = eligiblePlans.find(
        (signal) => signal.pressureId === commitment.ownerDedupeKey,
      );
      if (!owner) return [];
      const { supportNeedId: _supersededSupportNeed, ...preparedOwner } = owner;
      const payoffValue =
        planTargets.find(
          (target) =>
            target.ownerDedupeKey === commitment.ownerDedupeKey &&
            target.serverId === commitment.serverId,
        )?.payoffValue ?? 0;
      return [
        {
          ...preparedOwner,
          reachable: true,
          marginalValue: payoffValue,
          evidenceCode: `runner_targeted_bypass_preflight:${commitment.serverId}:${commitment.icePosition}`,
          sourceDefinitionIds: [commitment.sourceDefinitionId],
          preparationActionIds: [commitment.sourceActionId],
          routePreparation: "targeted_bypass" as const,
          targetedBypassCommitment: commitment,
        },
      ];
    })
    .slice(0, 1);
}

export function runnerCentralPressureHasExecutableEventRun(
  signal: RunnerPlanDomain["centralPressure"][number],
  candidates: readonly ActionSemanticCandidate[],
  runTargets: readonly RunnerRunTargetEvaluation[],
): boolean {
  if (!signal.reachable || signal.marginalValue <= 0) return false;
  const ownedActionIds = new Set(signal.runActionIds ?? []);
  return candidates.some(
    (candidate) =>
      ownedActionIds.has(candidate.actionId) &&
      (signal.runActionExclusions?.[candidate.actionId]?.length ?? 0) === 0 &&
      candidate.semanticActionType === "play.runner_event" &&
      candidate.runProjectionSummary?.serverId === signal.serverId &&
      runTargets.some(
        (evaluation) =>
          evaluation.actionId === candidate.actionId &&
          evaluation.targetServerId === signal.serverId &&
          evaluation.pathPassability === "reachable" &&
          (evaluation.recommendation === "run_now" ||
            evaluation.recommendation === "run_if_free") &&
          evaluation.score > 0 &&
          evaluation.knownAccessState !== "known_no_current_payoff",
      ),
  );
}

function runnerSameTurnAccessCentralPreparationSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[],
  runTargets: readonly RunnerRunTargetEvaluation[],
  strategicIntent: RunnerStrategicIntentProfile,
): RunnerPlanDomain["centralPressure"] {
  if (input.playerView.own.clicks < 2) return [];
  const target = [...runTargets]
    .filter(
      (evaluation) =>
        (evaluation.targetServerId === "hq" ||
          evaluation.targetServerId === "rd" ||
          evaluation.targetServerId === "archives") &&
        evaluation.pathPassability === "reachable" &&
        evaluation.recommendation === "run_now" &&
        evaluation.score > 0 &&
        evaluation.knownAccessState !== "known_no_current_payoff",
    )
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.targetServerId.localeCompare(right.targetServerId),
    )[0];
  if (!target) return [];
  const handRoute = [...handDevelopment]
    .filter(
      (evaluation) =>
        evaluation.availability === "legal_now" &&
        evaluation.deferReason === "none" &&
        evaluation.activationPrerequisites.some(
          (prerequisite) =>
            prerequisite.kind === "same_turn_access" && prerequisite.satisfied,
        ) &&
        evaluation.definitionId !== undefined &&
        !runnerDefinitionRequiresTargetedBypassPlan(evaluation.definitionId) &&
        evaluation.legalActionId !== undefined,
    )
    .sort(
      (left, right) =>
        right.priority - left.priority ||
        left.cardInstanceId.localeCompare(right.cardInstanceId),
    )
    .flatMap((evaluation) => {
      const candidate = candidates.find(
        (entry) =>
          entry.actionId === evaluation.legalActionId &&
          entry.sourceDefinitionId === evaluation.definitionId,
      );
      if (!candidate || !evaluation.definitionId) return [];
      return [
        {
          candidate,
          definitionId: evaluation.definitionId,
          value: evaluation.priority,
        },
      ];
    })[0];
  const exactRoute =
    handRoute ??
    candidates
      .flatMap((candidate) => {
        if (runnerActionRequiresTargetedBypassPlan(candidate)) return [];
        const definitionId = runnerSameTurnAccessPreparationSourceDefinitionId(
          input,
          candidate,
        );
        return definitionId
          ? [{ candidate, definitionId, value: target.score }]
          : [];
      })
      .sort((left, right) =>
        left.candidate.actionId.localeCompare(right.candidate.actionId),
      )[0];
  if (!exactRoute) return [];
  return [
    {
      pressureId: `central:${target.targetServerId}`,
      serverId: target.targetServerId as "hq" | "rd" | "archives",
      purpose: "access" as const,
      strategyLineIds: [
        ...new Set([
          strategicIntent.primaryWinIntent,
          ...exactRoute.candidate.strategySupport.map(
            (support) => support.strategyId,
          ),
        ]),
      ],
      priorityClass: "P4" as const,
      reachable: true,
      marginalValue: Math.min(300, Math.max(target.score, exactRoute.value)),
      evidenceCode: `runner_same_turn_access_preparation:${target.targetServerId}:${exactRoute.definitionId}`,
      sourceDefinitionIds: [exactRoute.definitionId],
      preparationActionIds: [exactRoute.candidate.actionId],
      routePreparation: "develop_payoff" as const,
    },
  ];
}

export function runnerCentralPressureHasMaterialMarginalValue(
  input: AiDecisionInput,
  evaluation: RunnerRunTargetEvaluation,
): boolean {
  if (evaluation.accessTargetKind === "archives") {
    return (
      archivesHasVisibleKnownAgenda(input) ||
      runnerArchivesHasQualifiedHiddenPayoff(input)
    );
  }
  const hqSaturatedByVisibleAccessEvidence =
    evaluation.accessTargetKind === "hq" &&
    (input.playerView.servers.find((server) => server.id === "hq")?.ice
      .length ?? 0) === 0 &&
    evaluation.evidence.includes(
      "hq_run_suppressed_by_knownness_low_value:true",
    );
  const runnerMatchpointCentralAccess =
    (evaluation.accessTargetKind === "rd" ||
      evaluation.accessTargetKind === "hq") &&
    evaluation.knownAccessState !== "known_no_current_payoff" &&
    input.playerView.own.agendaPoints >= input.playerView.agendaPointsToWin - 2;
  if (
    hqSaturatedByVisibleAccessEvidence &&
    !runnerMatchpointCentralAccess &&
    !(
      evaluation.multiaccessAvailable &&
      (evaluation.accessNoveltyRatio ?? 1) >= 0.5
    ) &&
    evaluation.accessPayoff !== "agenda" &&
    evaluation.accessPayoff !== "score_threat"
  ) {
    return false;
  }
  return (
    evaluation.score >= 50 ||
    (evaluation.recommendation === "run_now" &&
      evaluation.pathCost === 0 &&
      evaluation.score > 0) ||
    (evaluation.multiaccessAvailable &&
      (evaluation.accessNoveltyRatio ?? 1) >= 0.5) ||
    runnerMatchpointCentralAccess ||
    evaluation.accessPayoff === "agenda" ||
    evaluation.accessPayoff === "score_threat"
  );
}

type RunnerCentralPressureCadence = {
  routeAvailable: boolean;
  evidenceCode: string;
};

export function runnerCentralPressureCadence(
  input: AiDecisionInput,
  serverId: "hq" | "rd" | "archives",
): RunnerCentralPressureCadence {
  const available = (evidenceCode: string): RunnerCentralPressureCadence => ({
    routeAvailable: true,
    evidenceCode,
  });
  if (serverId === "archives") {
    return available("runner_central_pressure_cadence_not_required:archives");
  }
  const turnSerial = input.playerView.turnSerial;
  if (!Number.isSafeInteger(turnSerial) || (turnSerial ?? -1) < 0) {
    return {
      routeAvailable: false,
      evidenceCode: `runner_central_pressure_cadence_turn_invalid:${serverId}`,
    };
  }
  if (input.playerView.run !== undefined) {
    return available(`runner_central_pressure_cadence_active_run:${serverId}`);
  }
  const currentTurnSerial = turnSerial as number;
  const history = mergedPublicHistory(input);
  let activeRunServerId: string | undefined;
  let activeRunServerKnown = false;
  let lastAccessIndex = -1;
  let lastValueConversionIndex = -1;
  let targetRunHasAccess = false;
  let unboundAccessObserved = false;
  for (let index = 0; index < history.length; index += 1) {
    const event = history[index]!;
    const actionType =
      typeof event.publicPayload.actionType === "string"
        ? event.publicPayload.actionType
        : event.type;
    const runnerCadenceEvent =
      event.publicPayload.actor === "runner" &&
      (actionType === "start_run" ||
        event.type === "run_started" ||
        actionType === "access_card" ||
        actionType === "steal_agenda" ||
        actionType === "trash_accessed_card" ||
        actionType === "jack_out");
    if (!runnerCadenceEvent) continue;
    if (
      !Number.isSafeInteger(event.turnSerial) ||
      (event.turnSerial ?? -1) < 0
    ) {
      return {
        routeAvailable: false,
        evidenceCode: `runner_central_pressure_cadence_event_turn_invalid:${serverId}:${event.eventId}`,
      };
    }
    if (event.turnSerial !== currentTurnSerial) continue;
    if (actionType === "start_run" || event.type === "run_started") {
      activeRunServerId = serverIdFromEvent(event);
      activeRunServerKnown = activeRunServerId !== undefined;
      targetRunHasAccess = false;
      continue;
    }
    if (actionType === "jack_out") {
      activeRunServerId = undefined;
      activeRunServerKnown = false;
      targetRunHasAccess = false;
      continue;
    }
    if (actionType === "access_card") {
      if (!activeRunServerKnown) {
        unboundAccessObserved = true;
      } else if (activeRunServerId === serverId && !targetRunHasAccess) {
        targetRunHasAccess = true;
        lastAccessIndex = index;
        lastValueConversionIndex = -1;
      }
      continue;
    }
    if (
      (actionType === "steal_agenda" || actionType === "trash_accessed_card") &&
      activeRunServerKnown &&
      activeRunServerId === serverId &&
      targetRunHasAccess
    ) {
      lastValueConversionIndex = index;
    }
  }
  if (unboundAccessObserved) {
    return {
      routeAvailable: false,
      evidenceCode: `runner_central_pressure_cadence_access_unbound:${serverId}:${currentTurnSerial}`,
    };
  }
  if (lastAccessIndex < 0) {
    return available(
      `runner_central_pressure_cadence_first_access:${serverId}:${currentTurnSerial}`,
    );
  }
  if (lastValueConversionIndex > lastAccessIndex) {
    return available(
      `runner_central_pressure_cadence_value_converted:${serverId}:${currentTurnSerial}`,
    );
  }
  for (const event of history.slice(lastAccessIndex + 1)) {
    if (
      corpCentralPressureKnowledgeRefresh(event, serverId, currentTurnSerial)
    ) {
      return available(
        `runner_central_pressure_cadence_refreshed:${serverId}:${event.eventId}`,
      );
    }
  }
  return {
    routeAvailable: false,
    evidenceCode: `runner_central_pressure_cadence_consumed:${serverId}:${currentTurnSerial}`,
  };
}

function corpCentralPressureKnowledgeRefresh(
  event: ReturnType<typeof mergedPublicHistory>[number],
  serverId: "hq" | "rd",
  turnSerial: number,
): boolean {
  if (event.turnSerial !== turnSerial) return false;
  const payload = event.publicPayload;
  const actionType =
    typeof payload.actionType === "string" ? payload.actionType : event.type;
  if (payload.actor !== "corp") return false;
  if (actionType === "draw_card" || actionType === "mandatory_draw") {
    return true;
  }
  if (serverId === "rd") {
    return actionType === "shuffle_stack" || actionType === "reorder_cards";
  }
  return (
    actionType === "install_card" ||
    actionType === "play_operation" ||
    actionType === "discard_card" ||
    (actionType === "resolve_choice" &&
      payload.hiddenZoneAction === "discard_phase")
  );
}

function runnerTerminalRemoteUnreachableCentralLastChance(
  input: AiDecisionInput,
  evaluation: RunnerRunTargetEvaluation,
  runTargets: readonly RunnerRunTargetEvaluation[],
): boolean {
  if (
    input.playerView.own.agendaPoints <
      input.playerView.agendaPointsToWin - 1 ||
    (evaluation.targetServerId !== "hq" &&
      evaluation.targetServerId !== "rd") ||
    evaluation.pathPassability !== "reachable" ||
    evaluation.routeQuote?.reachability === "no_access" ||
    evaluation.prerunReserveQuote?.status === "blocked" ||
    evaluation.knownAccessState === "known_no_current_payoff" ||
    evaluation.accessPayoffContestable === false ||
    evaluation.creditsAfterRun < 0 ||
    evaluation.visibleTraceTagHazardUnavoidable === true ||
    (evaluation.unavoidableVisibleIceHazardCount ?? 0) > 0
  ) {
    return false;
  }
  const threat = runnerTerminalContestThreat(input);
  if (!threat || threat.remoteServerIds.length === 0) return false;

  return threat.remoteServerIds.every((serverId) => {
    const remoteEvaluations = runTargets.filter(
      (candidate) =>
        candidate.targetKind === "remote" &&
        candidate.targetServerId === serverId,
    );
    return (
      remoteEvaluations.length > 0 &&
      remoteEvaluations.every(
        (candidate) => candidate.pathPassability !== "reachable",
      )
    );
  });
}

function runnerCentralPressureMultiRunRouteQuote(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  evaluation: RunnerRunTargetEvaluation,
): RunnerMultiRunEventAssessment | undefined {
  const candidate = candidates.find(
    (entry) => entry.actionId === evaluation.actionId,
  );
  if (candidate?.semanticActionType !== "play.runner_event") {
    return undefined;
  }
  const action = input.legalActions.find(
    (entry) => entry.actionId === evaluation.actionId,
  );
  if (!action) return undefined;
  const quote = runnerMultiRunEventAssessment(input, action, {
    sourceDefinitionIdForAction: () => candidate.sourceDefinitionId,
    targetServerId: (legalAction) =>
      typeof legalAction.payload?.serverId === "string"
        ? legalAction.payload.serverId
        : undefined,
    targetEvaluation: () => evaluation,
    payoffClass: runnerRunTargetMultiRunPayoffClass,
    canTakeRun: runnerRunTargetPlausibleForMultiRun,
    scoreValue: runnerMultiRunEventScoreValue,
  });
  return quote?.phase === "first_run" && quote.canTakeRun ? quote : undefined;
}

export function runnerUnboundCentralDirectRunDispositionEvidence(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  evaluation: RunnerRunTargetEvaluation,
): string | undefined {
  const legalAction = input.legalActions.find(
    (action) => action.actionId === evaluation.actionId,
  );
  const candidate = candidates.find(
    (entry) =>
      entry.actionId === evaluation.actionId &&
      entry.semanticActionType === "run.start" &&
      entry.runProjectionSummary?.serverId === evaluation.targetServerId,
  );
  if (
    !candidate ||
    legalAction?.type !== "start_run" ||
    legalAction.payload?.serverId !== evaluation.targetServerId ||
    evaluation.accessServerId !== evaluation.targetServerId
  ) {
    return undefined;
  }
  const quote = evaluation.routeQuote;
  const quoteKnown =
    quote !== undefined &&
    Number.isFinite(quote.knownCost) &&
    Number.isFinite(quote.guaranteedKnownCost) &&
    Number.isFinite(quote.availableCredits) &&
    Number.isFinite(quote.fundingGap) &&
    Number.isFinite(evaluation.creditsAfterRun);
  if (!quoteKnown) {
    return `runner_central_direct_run_quote_unknown:${evaluation.targetServerId}:${evaluation.actionId}`;
  }
  const exactRouteEvidence = [
    `access_${quote.reachability}`,
    `funding_gap_${quote.fundingGap}`,
    `credits_after_${evaluation.creditsAfterRun}`,
    `hazards_${evaluation.unavoidableVisibleIceHazardCount ?? 0}`,
    `score_${evaluation.score}`,
    `recommendation_${evaluation.recommendation}`,
  ].join(":");
  if (
    evaluation.knownAccessState === "known_no_current_payoff" ||
    quote.reachability !== "guaranteed_access" ||
    quote.fundingGap > 0 ||
    evaluation.creditsAfterRun < 0 ||
    evaluation.score <= 0 ||
    (evaluation.recommendation !== "run_now" &&
      evaluation.recommendation !== "run_if_free")
  ) {
    return `runner_central_direct_run_exact_route_nonproductive:${evaluation.targetServerId}:${exactRouteEvidence}`;
  }
  return undefined;
}

export function buildRunnerCentralPressureSignals({
  input,
  candidates,
  strategicIntent,
  economy,
  runTargets,
  handDevelopment,
  previous,
  runLockReleaseRoutes,
  coverageGaps,
  damageThreat,
  recentSafetyAbort,
  handSize,
  minimumHandBuffer,
  forgoUnsafeRunCapacity,
  constrainedRunCandidates,
  effectiveAccessPayoffCampaignSignals,
  activeRunRoot,
  recurringEconomyRunDeferralEvidenceCode,
}: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  strategicIntent: RunnerStrategicIntentProfile;
  economy: RunnerEconomyPosture;
  runTargets: readonly RunnerRunTargetEvaluation[];
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[];
  previous: ResidentPlanPortfolio | undefined;
  runLockReleaseRoutes: ReturnType<typeof runnerRunLockReleaseRoutes>;
  coverageGaps: RunnerCorePlanDomain["coverageGaps"];
  damageThreat: ReturnType<typeof runnerDefenseHandBufferFacts>["damageThreat"];
  recentSafetyAbort: ReturnType<
    typeof runnerRecentFutureEncounterDamageSafetyAbort
  >;
  handSize: number;
  minimumHandBuffer: number;
  forgoUnsafeRunCapacity: boolean;
  constrainedRunCandidates: {
    candidate: ActionSemanticCandidate;
    serverId: string;
    marginalValue: number;
    evidenceCode: string;
  }[];
  effectiveAccessPayoffCampaignSignals: RunnerPlanDomain["centralPressure"];
  activeRunRoot: ActiveRunnerRunRoot | undefined;
  recurringEconomyRunDeferralEvidenceCode: string | undefined;
}): RunnerPlanDomain["centralPressure"] {
  const baseCentralPressure: RunnerPlanDomain["centralPressure"] = uniqueBy(
    [
      ...runLockReleaseRoutes.flatMap((route) => {
        if (
          route.serverId !== "hq" &&
          route.serverId !== "rd" &&
          route.serverId !== "archives"
        )
          return [];
        const centralServerId = route.serverId;
        return [
          {
            pressureId: `central:${centralServerId}`,
            serverId: centralServerId as "hq" | "rd" | "archives",
            purpose: "access" as const,
            strategyLineIds: [strategicIntent.primaryWinIntent],
            priorityClass: route.terminal ? ("P2" as const) : ("P4" as const),
            reachable: route.ready,
            marginalValue: route.value,
            evidenceCode: route.evidenceCode,
            ...(route.actionId
              ? {
                  runActionIds: [route.actionId],
                  runActionValues: { [route.actionId]: route.value },
                  runActionEvidence: {
                    [route.actionId]: [
                      "plan_route_stage:release_run_lock",
                      `plan_route_follow_up_server:${centralServerId}`,
                    ],
                  },
                }
              : {
                  runActionIds: [],
                  runActionValues: {},
                  runActionEvidence: {},
                }),
            runActionExclusions: {},
            ...(route.supportNeedId
              ? { supportNeedId: route.supportNeedId }
              : {}),
            routePreparation: "release_run_lock" as const,
          },
        ];
      }),
      ...bestRunTargetsByServer(input, economy, runTargets, candidates)
        .filter(
          (evaluation) =>
            evaluation.targetServerId === "hq" ||
            evaluation.targetServerId === "rd" ||
            evaluation.targetServerId === "archives",
        )
        .map((evaluation) => {
          const knownAgendaInArchives =
            evaluation.targetServerId === "archives" &&
            archivesHasVisibleKnownAgenda(input);
          const terminalCentralAccess =
            (evaluation.targetServerId === "hq" ||
              evaluation.targetServerId === "rd") &&
            evaluation.knownAccessState !== "known_no_current_payoff" &&
            input.playerView.own.agendaPoints >=
              input.playerView.agendaPointsToWin - 1;
          const pressureCadence = runnerCentralPressureCadence(
            input,
            evaluation.targetServerId as "hq" | "rd" | "archives",
          );
          const sameServerEvaluations = runTargets.filter(
            (candidate) =>
              candidate.targetServerId === evaluation.targetServerId,
          );
          const multiRunRoutesByActionId = new Map(
            sameServerEvaluations.flatMap((candidateEvaluation) => {
              const quote = runnerCentralPressureMultiRunRouteQuote(
                input,
                candidates,
                candidateEvaluation,
              );
              return quote
                ? [[candidateEvaluation.actionId, quote] as const]
                : [];
            }),
          );
          const bestMultiRunRouteValue = Math.max(
            0,
            ...[...multiRunRoutesByActionId.values()].map(
              (quote) => quote.value,
            ),
          );
          const directlyAvailableBasicRun = sameServerEvaluations.some(
            (candidateEvaluation) => {
              const actionCandidate = candidates.find(
                (entry) => entry.actionId === candidateEvaluation.actionId,
              );
              return (
                actionCandidate?.semanticActionType === "run.start" &&
                actionCandidate.sourceKind === "basic_action" &&
                candidateEvaluation.pathPassability === "reachable" &&
                (candidateEvaluation.recommendation === "run_now" ||
                  candidateEvaluation.recommendation === "run_if_free")
              );
            },
          );
          const coverageSupport = coverageGaps.find(
            (gap) =>
              gap.requesterModuleId === "runner.pressure_central" &&
              gap.targetServerId === evaluation.targetServerId &&
              gap.targetRunActionId === evaluation.actionId,
          );
          const hqSuccessWindowRoute = sameServerEvaluations.flatMap(
            (candidateEvaluation) => {
              const action = input.legalActions.find(
                (candidateAction) =>
                  candidateAction.actionId === candidateEvaluation.actionId,
              );
              if (!action) return [];
              const setup = runnerHqSuccessWindowSetupAssessment(
                input,
                action,
                candidateEvaluation.targetServerId,
              );
              return setup
                ? [
                    {
                      actionId: candidateEvaluation.actionId,
                      setup,
                    },
                  ]
                : [];
            },
          )[0];
          const hqSuccessWindowSetupAvailable =
            hqSuccessWindowRoute !== undefined;
          const knownNoPayoff =
            evaluation.knownAccessState === "known_no_current_payoff" ||
            (evaluation.targetServerId === "archives" &&
              archivesIsKnownWithoutAgenda(input));
          const terminalRemoteUnreachableCentralLastChance =
            runnerTerminalRemoteUnreachableCentralLastChance(
              input,
              evaluation,
              runTargets,
            );
          const confirmedDamageRouteBlocked =
            !terminalCentralAccess &&
            !terminalRemoteUnreachableCentralLastChance &&
            (damageThreat.flatlineRisk.level === "confirmed" ||
              damageThreat.flatlineRisk.level === "critical") &&
            damageThreat.flatlineRisk.handCount <
              damageThreat.flatlineRisk.recommendedHandFloor &&
            damageThreat.flatlineRisk.riskyRunServerIds.includes(
              evaluation.targetServerId,
            );
          const safetyBlocked =
            recentSafetyAbort?.serverId === evaluation.targetServerId ||
            confirmedDamageRouteBlocked;
          const materialMarginalValue =
            runnerCentralPressureHasMaterialMarginalValue(input, evaluation);
          const costlyInformationRunBelowHandBuffer =
            handSize < minimumHandBuffer &&
            evaluation.pathCost > 0 &&
            evaluation.accessPayoff !== "agenda" &&
            evaluation.accessPayoff !== "score_threat";
          const fundingSupport =
            safetyBlocked || !pressureCadence.routeAvailable
              ? undefined
              : runnerRunFundingSupport(
                  input,
                  economy,
                  evaluation,
                  runTargets,
                  candidates,
                );
          const directRunCanConvertNow = runnerRunTargetCanConvertNow(
            input,
            economy,
            evaluation,
            candidates,
          );
          const executionMode = runPurposeForEvaluation(evaluation);
          const currentPressureRoute =
            (!knownNoPayoff || hqSuccessWindowSetupAvailable) &&
            pressureCadence.routeAvailable &&
            (materialMarginalValue ||
              hqSuccessWindowSetupAvailable ||
              terminalRemoteUnreachableCentralLastChance) &&
            (!costlyInformationRunBelowHandBuffer ||
              terminalRemoteUnreachableCentralLastChance) &&
            fundingSupport === undefined &&
            coverageSupport === undefined &&
            evaluation.pathPassability === "reachable" &&
            evaluation.routeQuote?.reachability !== "no_access" &&
            evaluation.prerunReserveQuote?.status !== "blocked" &&
            (executionMode !== "information" ||
              terminalRemoteUnreachableCentralLastChance ||
              runnerInformationProbeCanUseQuotedPath(
                evaluation,
                directRunCanConvertNow,
                terminalCentralAccess,
              )) &&
            (evaluation.recommendation === "run_now" ||
              evaluation.recommendation === "run_if_free" ||
              directRunCanConvertNow ||
              terminalRemoteUnreachableCentralLastChance) &&
            (evaluation.score > 0 ||
              hqSuccessWindowSetupAvailable ||
              terminalRemoteUnreachableCentralLastChance);
          const purpose =
            terminalRemoteUnreachableCentralLastChance ||
            executionMode === "contest"
              ? ("access" as const)
              : executionMode;
          const runRiskContract = runRiskContractForEvaluation(
            input,
            evaluation,
          );
          return {
            pressureId: `central:${evaluation.targetServerId}`,
            serverId: evaluation.targetServerId as "hq" | "rd" | "archives",
            purpose,
            strategyLineIds: [strategicIntent.primaryWinIntent],
            priorityClass: knownAgendaInArchives
              ? ("P2" as const)
              : terminalRemoteUnreachableCentralLastChance
                ? ("P2" as const)
                : evaluation.targetServerId === "archives" &&
                    ["unknown", "fresh"].includes(evaluation.accessPayoff)
                  ? ("P6" as const)
                  : ("P4" as const),
            reachable:
              currentPressureRoute && !safetyBlocked && !forgoUnsafeRunCapacity,
            marginalValue:
              (knownAgendaInArchives
                ? 1_000
                : terminalRemoteUnreachableCentralLastChance
                  ? 1_400 + evaluation.score
                  : hqSuccessWindowRoute
                    ? Math.max(320, evaluation.score)
                    : evaluation.recommendation === "run_now"
                      ? evaluation.score
                      : Math.min(evaluation.score, 60)) +
              bestMultiRunRouteValue,
            evidenceCode: forgoUnsafeRunCapacity
              ? "runner_restricted_run_capacity_below_required_hand_buffer"
              : knownAgendaInArchives
                ? "visible_known_agenda_in_archives"
                : terminalRemoteUnreachableCentralLastChance
                  ? `runner_terminal_remote_unreachable_central_last_chance:${evaluation.targetServerId}`
                  : safetyBlocked
                    ? confirmedDamageRouteBlocked
                      ? `runner_confirmed_damage_central_pressure_requires_hand_buffer:${evaluation.targetServerId}`
                      : recentSafetyAbort!.evidenceCode
                    : knownNoPayoff
                      ? `runner_central_pressure_known_no_current_payoff:${evaluation.targetServerId}`
                      : !pressureCadence.routeAvailable
                        ? pressureCadence.evidenceCode
                        : hqSuccessWindowRoute
                          ? `runner_hq_success_window_setup:${hqSuccessWindowRoute.setup.sourceDefinitionId}`
                          : coverageSupport
                            ? coverageSupport.evidenceCode
                            : fundingSupport
                              ? fundingSupport.evidenceCode
                              : costlyInformationRunBelowHandBuffer
                                ? `runner_central_pressure_requires_hand_buffer:${evaluation.targetServerId}`
                                : !materialMarginalValue
                                  ? `runner_central_pressure_below_material_value:${evaluation.targetServerId}`
                                  : !currentPressureRoute
                                    ? `runner_central_pressure_no_admissible_route:${evaluation.targetServerId}`
                                    : (evaluation.evidence[0] ??
                                      "runner_run_target"),
            ...(coverageSupport
              ? { supportNeedId: coverageSupport.gapId }
              : fundingSupport
                ? { supportNeedId: fundingSupport.needId }
                : {}),
            runActionIds: pressureCadence.routeAvailable
              ? [
                  ...new Set([
                    ...witnessedRunActionIds(
                      candidates,
                      runTargets,
                      evaluation.targetServerId,
                    ),
                    ...(terminalRemoteUnreachableCentralLastChance
                      ? [evaluation.actionId]
                      : []),
                    ...(hqSuccessWindowRoute
                      ? [hqSuccessWindowRoute.actionId]
                      : []),
                  ]),
                ]
              : [],
            runActionValues: Object.fromEntries(
              sameServerEvaluations
                .filter(
                  (candidate) => candidate.pathPassability === "reachable",
                )
                .map((candidate) => {
                  const routeSpecificPreference =
                    candidate.actionId === hqSuccessWindowRoute?.actionId
                      ? 100
                      : candidate.runActionProjection?.spendLimit !== undefined
                        ? 10
                        : 0;
                  const multiRunRouteValue =
                    multiRunRoutesByActionId.get(candidate.actionId)?.value ??
                    0;
                  return [
                    candidate.actionId,
                    candidate.score -
                      evaluation.score +
                      routeSpecificPreference +
                      multiRunRouteValue -
                      bestMultiRunRouteValue,
                  ];
                }),
            ),
            runActionDifferentialPayoffIds: [
              ...multiRunRoutesByActionId.keys(),
            ].sort(),
            runActionEvidence: Object.fromEntries(
              sameServerEvaluations.flatMap((candidate) => {
                const spendLimit = candidate.runActionProjection?.spendLimit;
                if (candidate.pathPassability !== "reachable") {
                  return [];
                }
                const opportunityQuote =
                  candidate.consumableRunOpportunityQuote;
                const multiRunRoute = multiRunRoutesByActionId.get(
                  candidate.actionId,
                );
                return [
                  [
                    candidate.actionId,
                    [
                      `run_route_raw_score:${opportunityQuote?.rawRouteScore ?? candidate.score}`,
                      `run_route_opportunity_cost:${opportunityQuote?.opportunityCost ?? 0}`,
                      `run_route_effective_score:${candidate.score}`,
                      `run_route_relative_value:${candidate.score - evaluation.score}`,
                      ...(opportunityQuote?.evidence ?? []),
                      ...(multiRunRoute?.evidence ?? []),
                      ...(multiRunRoute
                        ? [
                            `runner_central_pressure_multi_run_value:${multiRunRoute.value}`,
                          ]
                        : []),
                      ...(candidate.actionId === hqSuccessWindowRoute?.actionId
                        ? [
                            "plan_route_preference:hq_success_window_setup",
                            ...hqSuccessWindowRoute.setup.evidence,
                          ]
                        : []),
                      ...(spendLimit !== undefined
                        ? [
                            "plan_route_preference:bounded_card_run",
                            `run_action_spending_cap_target_server:${evaluation.targetServerId}`,
                            `run_action_spending_cap_limit:${spendLimit}`,
                          ]
                        : []),
                    ],
                  ],
                ];
              }),
            ),
            runActionRouteDiagnostics: Object.fromEntries(
              sameServerEvaluations.map((candidate) => {
                const opportunityQuote =
                  candidate.consumableRunOpportunityQuote;
                return [
                  candidate.actionId,
                  {
                    rawRouteScore:
                      opportunityQuote?.rawRouteScore ?? candidate.score,
                    opportunityCost: opportunityQuote?.opportunityCost ?? 0,
                    effectiveRouteScore: candidate.score,
                  },
                ];
              }),
            ),
            runActionExclusions: Object.fromEntries(
              sameServerEvaluations.flatMap((candidate) => {
                const actionCandidate = candidates.find(
                  (entry) => entry.actionId === candidate.actionId,
                );
                const lacksDifferentialPayoff =
                  directlyAvailableBasicRun &&
                  actionCandidate?.semanticActionType === "play.runner_event" &&
                  !multiRunRoutesByActionId.has(candidate.actionId) &&
                  !runnerCardRunHasVisibleDifferentialPayoff(
                    input,
                    actionCandidate,
                    evaluation.targetServerId as "hq" | "rd" | "archives",
                    sameServerEvaluations,
                  );
                const opensHqSuccessWindow =
                  candidate.actionId === hqSuccessWindowRoute?.actionId;
                const candidateRouteAdmissible =
                  !forgoUnsafeRunCapacity &&
                  (!knownNoPayoff || opensHqSuccessWindow) &&
                  pressureCadence.routeAvailable &&
                  (materialMarginalValue ||
                    opensHqSuccessWindow ||
                    terminalRemoteUnreachableCentralLastChance) &&
                  (!costlyInformationRunBelowHandBuffer ||
                    terminalRemoteUnreachableCentralLastChance) &&
                  !safetyBlocked &&
                  candidate.prerunReserveQuote?.status !== "blocked" &&
                  candidate.pathPassability === "reachable" &&
                  !lacksDifferentialPayoff &&
                  (candidate.recommendation === "run_now" ||
                    candidate.recommendation === "run_if_free" ||
                    terminalRemoteUnreachableCentralLastChance) &&
                  (candidate.score > 0 ||
                    opensHqSuccessWindow ||
                    terminalRemoteUnreachableCentralLastChance);
                if (candidateRouteAdmissible) return [];
                const spendLimitBlocked =
                  candidate.runActionProjection?.spendLimit !== undefined &&
                  candidate.pathPassability === "blocked_unpayable";
                return [
                  [
                    candidate.actionId,
                    [
                      `run_route_excluded:path:${candidate.pathPassability}`,
                      `run_route_excluded:recommendation:${candidate.recommendation}`,
                      `run_route_excluded:score:${candidate.score}`,
                      ...(lacksDifferentialPayoff
                        ? [
                            "run_route_excluded:no_visible_differential_payoff_over_basic_run",
                          ]
                        : []),
                      ...(!pressureCadence.routeAvailable
                        ? [pressureCadence.evidenceCode]
                        : []),
                      ...planSafeRunExclusionEvidence(candidate.evidence),
                      ...(spendLimitBlocked
                        ? [
                            "run_action_spending_cap_risk_skip:visible_break_cost_gt_cap",
                            ...candidate.evidence.flatMap((entry) =>
                              entry.startsWith("visible_break_cost:")
                                ? [
                                    `run_action_spending_cap_visible_break_cost:${entry.slice("visible_break_cost:".length)}`,
                                  ]
                                : entry.startsWith(
                                      "run_action_projection_spend_limit:",
                                    )
                                  ? [
                                      `run_action_spending_cap_limit:${entry.slice("run_action_projection_spend_limit:".length)}`,
                                    ]
                                  : [],
                            ),
                          ]
                        : []),
                    ],
                  ],
                ];
              }),
            ),
            ...(executionMode === "information"
              ? {
                  encounterCreditSpendLimit: evaluation.pathCost,
                }
              : {}),
            accessCommitment: accessCommitmentForEvaluation(input, evaluation),
            ...(runRiskContract ? { runRiskContract } : {}),
            ...(sourceDefinitionForEvaluation(evaluation, candidates)
              ? {
                  sourceDefinitionIds: [
                    sourceDefinitionForEvaluation(evaluation, candidates)!,
                  ],
                }
              : {}),
          };
        }),
      ...input.playerView.servers.flatMap((server) => {
        const visibleAgendaRunActionIds = witnessedReachableRunActionIds(
          candidates,
          runTargets,
          "archives",
        );
        if (
          server.id !== "archives" ||
          !archivesHasVisibleKnownAgenda(input) ||
          visibleAgendaRunActionIds.length === 0
        ) {
          return [];
        }
        return [
          {
            pressureId: "central:archives",
            serverId: "archives" as const,
            purpose: "access" as const,
            strategyLineIds: [strategicIntent.primaryWinIntent],
            priorityClass: "P2" as const,
            reachable: !forgoUnsafeRunCapacity,
            marginalValue: 1_000,
            evidenceCode: forgoUnsafeRunCapacity
              ? "runner_restricted_run_capacity_below_required_hand_buffer"
              : "visible_known_agenda_in_archives",
            runActionIds: visibleAgendaRunActionIds,
            runActionValues: {},
            runActionEvidence: {},
            runActionExclusions: {},
          },
        ];
      }),
      ...constrainedRunCandidates.flatMap(
        ({ candidate, serverId, marginalValue, evidenceCode }) => {
          if (serverId !== "hq" && serverId !== "rd" && serverId !== "archives")
            return [];
          return [
            {
              pressureId: `central:${serverId}`,
              serverId: serverId as "hq" | "rd" | "archives",
              purpose: "information" as const,
              strategyLineIds: [strategicIntent.primaryWinIntent],
              priorityClass: "P6" as const,
              reachable: true,
              marginalValue,
              evidenceCode,
              runActionIds: [candidate.actionId],
              ...(candidate.sourceDefinitionId
                ? { sourceDefinitionIds: [candidate.sourceDefinitionId] }
                : {}),
            },
          ];
        },
      ),
      ...effectiveAccessPayoffCampaignSignals,
      // A legal same-turn payoff changes the current phase of the already
      // discovered server-pressure plan. Keep it after the direct route
      // signals because uniqueBy intentionally retains the last phase for a
      // shared pressureId.
      ...runnerSameTurnAccessCentralPreparationSignals(
        input,
        candidates,
        handDevelopment,
        runTargets,
        strategicIntent,
      ),
    ],
    (signal) => signal.pressureId,
  );
  const centralPressure: RunnerPlanDomain["centralPressure"] = uniqueBy(
    [
      ...baseCentralPressure,
      ...runnerTargetedIceTrashCentralPreparationSignals(
        input,
        candidates,
        baseCentralPressure,
        runTargets,
      ),
      ...runnerTargetedBypassCentralPreparationSignals(
        input,
        candidates,
        baseCentralPressure,
        runTargets,
      ),
      ...runnerAccumulatedCentralPressureConversionSignals(
        candidates,
        baseCentralPressure,
        previous,
      ),
      ...(activeRunRoot?.parentBinding?.moduleId === "runner.pressure_central"
        ? [activeRunRoot.parentBinding.signal]
        : []),
    ],
    (signal) => signal.pressureId,
  ).map((signal) => {
    if (!recurringEconomyRunDeferralEvidenceCode) return signal;
    const runActionIds = signal.runActionIds ?? [];
    if (runActionIds.length === 0) return signal;
    return {
      ...signal,
      runActionExclusions: {
        ...(signal.runActionExclusions ?? {}),
        ...Object.fromEntries(
          runActionIds.map((actionId) => [
            actionId,
            [recurringEconomyRunDeferralEvidenceCode],
          ]),
        ),
      },
    };
  });
  return centralPressure;
}
