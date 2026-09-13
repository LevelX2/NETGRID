import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { type RunnerCorePlanDomain } from "../../plans/runner-core-plan-contracts";
import { type RunnerCoverageGapSignal } from "../../plans/runner-coverage-contracts";
import type { RunnerRunFundingSupport } from "../../plans/runner-funding-service-contract";
import { ActiveRunnerRunRoot } from "../../plans/runner-run-origin-contract";
import { runnerCardRunHasVisibleDifferentialPayoff } from "../../plans/runner-run-payoff";
import {
  INFORMATION_PROBE_KNOWN_PATH_CREDIT_BUDGET,
  runnerInformationProbeCanUseQuotedPath,
  runPurposeForEvaluation,
} from "../../plans/runner-run-purpose";
import {
  type RunnerPlanDomain,
  type RunnerRemoteContestSignal,
} from "../../plans/runner-tactical-plan-contracts";
import {
  bestRunTargetsByServer,
  runnerRunFundingSupport,
  runnerRunHasExactUrgency,
  runnerRunTargetCanConvertNow,
} from "../../run-analysis/runner-plan-run-funding";
import {
  accessCommitmentForEvaluation,
  runnerKnownAgendaRunEvaluationIsCertified,
  runRiskContractForEvaluation,
  witnessedKnownAgendaRunEvaluations,
} from "../../run-analysis/runner-plan-run-route-facts";
import { runnerRunLockReleaseRoutes } from "../../run-analysis/runner-run-lock-release-routes";
import {
  runnerRezOrTrashPreparationBeatsImmediateRun,
  runnerSameTurnAccessPreparationSourceDefinitionId,
  runnerTargetedBypassPayoffValue,
  runnerTargetedIceTrashPayoffValue,
} from "../../run-analysis/runner-run-preparation";
import {
  runnerKnownRemoteAccessDamageAmbushAssessment,
  runnerRecentFutureEncounterDamageSafetyAbort,
} from "../../runner-damage-threat-assessment";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../../runner-run-target-evaluation";
import { uniqueBy } from "../../runtime/collection";
import { runnerCandidateIsExposeAbility } from "../../runtime/runner-information-action-facts";
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
import { candidateTargetIds } from "../../runtime/visible-action-facts";
import { visibleKnownAgendaOnServer } from "../../runtime/visible-server-agenda-facts";
import { runnerDefenseHandBufferFacts } from "../defense-recovery/defense-signals";
import type { RunnerHandDevelopmentEvaluation } from "../hand-development/hand-development-evaluation";
import { runnerCoverageGapIsTerminalRemoteThreat } from "../rig-coverage/coverage-support";
import {
  runnerCriticalDamageContestBlocked,
  runnerTerminalNonlethalDamageContestAlreadyFailedThisTurn,
  runnerTerminalRemoteContestIsDirectlyMandatory,
} from "./remote-contest-admission";
type RunnerRemoteContestSignalDraft = Omit<
  RunnerRemoteContestSignal,
  "runActionAssessments"
> & {
  preferredRunActionIds?: string[];
  runActionDeferralEvidenceCode?: string;
};

function runnerTargetedIceTrashRemotePreparationSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  contestSignals: readonly RunnerRemoteContestSignalDraft[],
  runTargets: readonly RunnerRunTargetEvaluation[],
): RunnerRemoteContestSignalDraft[] {
  const eligiblePlans = contestSignals.filter(
    (signal) => signal.routePreparation === undefined,
  );
  return candidates
    .filter(runnerActionRequiresTargetedIceTrashPlan)
    .sort((left, right) => left.actionId.localeCompare(right.actionId))
    .flatMap((candidate) => {
      const targetIceState = runnerTargetedIceTrashState(candidate);
      const planTargets = eligiblePlans.flatMap((signal) => {
        const payoffValue = Math.max(
          signal.knownAgendaThreat || signal.terminalPatternThreat ? 1_000 : 0,
          runnerTargetedIceTrashPayoffValue(
            signal.serverId,
            signal.marginalValue,
            runTargets,
          ),
          targetIceState === "unrezzed" || targetIceState === "rez_or_trash"
            ? runnerUnrezzedIceTrashRouteOpeningPayoff(input, signal.serverId)
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
            ownerModuleId: "runner.contest_remote" as const,
            ownerDedupeKey: signal.contestId,
            serverId: signal.serverId,
            payoffValue,
            knownAgendaThreat: signal.knownAgendaThreat,
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
        (signal) => signal.contestId === commitment.ownerDedupeKey,
      );
      if (!owner) return [];
      // The executable preparation replaces the blocked run route and its
      // support request. Coverage reconciles any independent remaining need.
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
          evidenceCode: `runner_targeted_ice_trash_preflight:${commitment.serverId}:${commitment.targetIceInstanceId}`,
          preparationActionIds: [commitment.sourceActionId],
          routePreparation: "targeted_ice_trash" as const,
          targetedIceTrashCommitment: commitment,
        },
      ];
    })
    .slice(0, 1);
}

function runnerTargetedBypassRemotePreparationSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  contestSignals: readonly RunnerRemoteContestSignalDraft[],
  runTargets: readonly RunnerRunTargetEvaluation[],
): RunnerRemoteContestSignalDraft[] {
  const eligiblePlans = contestSignals.filter(
    (signal) => signal.routePreparation === undefined,
  );
  return candidates
    .filter(runnerActionRequiresTargetedBypassPlan)
    .sort((left, right) => left.actionId.localeCompare(right.actionId))
    .flatMap((candidate) => {
      const planTargets = eligiblePlans.flatMap((signal) => {
        const payoffValue = Math.max(
          signal.knownAgendaThreat || signal.terminalPatternThreat ? 1_000 : 0,
          runnerTargetedBypassPayoffValue(signal.serverId, runTargets),
        );
        if (payoffValue <= 0) return [];
        return [
          {
            ownerModuleId: "runner.contest_remote" as const,
            ownerDedupeKey: signal.contestId,
            serverId: signal.serverId,
            payoffValue,
            knownAgendaThreat: signal.knownAgendaThreat,
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
        (signal) => signal.contestId === commitment.ownerDedupeKey,
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
          preparationActionIds: [commitment.sourceActionId],
          routePreparation: "targeted_bypass" as const,
          targetedBypassCommitment: commitment,
        },
      ];
    })
    .slice(0, 1);
}

function runnerSameTurnAccessRemotePreparationSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[],
  runTargets: readonly RunnerRunTargetEvaluation[],
): RunnerRemoteContestSignalDraft[] {
  if (input.playerView.own.clicks < 2) return [];
  const target = [...runTargets]
    .filter(
      (evaluation) =>
        evaluation.targetServerId.startsWith("remote_") &&
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
      contestId: `remote:${target.targetServerId}`,
      serverId: target.targetServerId,
      purpose: "contest" as const,
      knownAgendaThreat: target.scoreThreat,
      reachable: true,
      marginalValue: Math.min(300, Math.max(target.score, exactRoute.value)),
      evidenceCode: `runner_same_turn_access_preparation:${target.targetServerId}:${exactRoute.definitionId}`,
      preparationActionIds: [exactRoute.candidate.actionId],
      routePreparation: "prepare_access_payoff" as const,
    },
  ];
}

function runnerRemoteInformationPreparationSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  runTargets: readonly RunnerRunTargetEvaluation[],
): RunnerRemoteContestSignalDraft[] {
  const exposeCandidates = candidates.filter(
    (candidate) =>
      !runnerActionRequiresTargetedBypassPlan(candidate) &&
      runnerCandidateIsExposeAbility(input, candidate),
  );
  if (exposeCandidates.length === 0) return [];
  const matchpointPressure =
    input.playerView.own.agendaPoints >=
      input.playerView.agendaPointsToWin - 2 ||
    input.playerView.opponent.agendaPoints >=
      input.playerView.agendaPointsToWin - 2;
  const remote = input.playerView.servers
    .filter((server) => {
      const accessState = runTargets.find(
        (evaluation) => evaluation.targetServerId === server.id,
      )?.knownAccessState;
      return (
        server.id.startsWith("remote_") &&
        server.root.some((card) => card.known === false) &&
        (accessState === undefined ||
          accessState === "unknown" ||
          accessState === "changed") &&
        matchpointPressure &&
        server.root.every((card) => (card.advancementCounters ?? 0) === 0)
      );
    })
    .sort(
      (left, right) =>
        Math.max(
          0,
          ...right.root.map((card) => card.advancementCounters ?? 0),
        ) -
          Math.max(
            0,
            ...left.root.map((card) => card.advancementCounters ?? 0),
          ) ||
        right.root.length - left.root.length ||
        left.id.localeCompare(right.id),
    )[0];
  if (!remote) return [];
  const directContest = runTargets.find(
    (evaluation) =>
      evaluation.targetServerId === remote.id &&
      evaluation.pathPassability === "reachable" &&
      (evaluation.recommendation === "run_now" ||
        evaluation.recommendation === "run_if_free") &&
      evaluation.score > 0,
  );
  if (directContest) return [];
  const remoteTargetIds = new Set([
    remote.id,
    ...remote.root.map((card) => card.instanceId),
  ]);
  const preparationActionIds = exposeCandidates
    .filter((candidate) => {
      const targetIds = candidateTargetIds(candidate);
      return (
        targetIds.length === 0 ||
        targetIds.some((targetId) => remoteTargetIds.has(targetId))
      );
    })
    .map((candidate) => candidate.actionId);
  if (preparationActionIds.length === 0) return [];
  return [
    {
      contestId: `remote:${remote.id}`,
      serverId: remote.id,
      purpose: "information",
      knownAgendaThreat: false,
      reachable: true,
      marginalValue:
        800 +
        Math.max(
          0,
          ...remote.root.map((card) => card.advancementCounters ?? 0),
        ) *
          50,
      evidenceCode: "runner_remote_information_preparation",
      preparationActionIds,
      routePreparation: "expose_remote",
    },
  ];
}

function runnerIrrecoverableRandomBreakScoreThreatContest(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  evaluation: RunnerRunTargetEvaluation,
): boolean {
  const randomBreakRisk = evaluation.randomBreakOrDamageRiskAssessment;
  if (
    evaluation.targetKind !== "remote" ||
    evaluation.scoreThreat !== true ||
    evaluation.pathPassability !==
      "blocked_by_random_break_damage_hand_buffer" ||
    randomBreakRisk?.blockedByHandBuffer !== true ||
    randomBreakRisk.stableCoverageAvailable === true ||
    randomBreakRisk.currentHandCount > 0
  ) {
    return false;
  }
  const recoveryRouteAvailable = candidates.some(
    (candidate) =>
      candidate.semanticActionType === "draw.card" ||
      candidate.actionTacticSignals.some(
        (signal) =>
          signal === "search.breaker" ||
          signal === "search.program" ||
          signal === "install.breaker",
      ),
  );
  return !recoveryRouteAvailable;
}

function runnerRemoteProbeCanConvertNow(
  input: AiDecisionInput,
  economy: RunnerEconomyPosture,
  evaluation: RunnerRunTargetEvaluation,
): boolean {
  if (
    evaluation.unrezzedIceRiskUnderfunded === true &&
    evaluation.creditsAfterRun <= 0
  ) {
    return false;
  }
  return (
    evaluation.accessTargetKind === "remote" &&
    evaluation.runCommitment === "probe_only" &&
    evaluation.pathPassability === "reachable" &&
    evaluation.score > 0 &&
    evaluation.creditsAfterRun >= 0 &&
    (evaluation.pathCost === 0 ||
      evaluation.creditsAfterRun >= economy.minimumCreditFloor ||
      (evaluation.scoreThreat && input.playerView.opponent.credits <= 1))
  );
}

function runnerMatchpointRemoteFocusSignals(
  input: AiDecisionInput,
  runTargets: readonly RunnerRunTargetEvaluation[],
  coverageGaps: readonly RunnerCoverageGapSignal[],
): RunnerRemoteContestSignalDraft[] {
  const threat = runnerTerminalContestThreat(input);
  if (threat?.kind !== "opponent_matchpoint") return [];
  return threat.remoteServerIds.flatMap((serverId) => {
    const evaluations = runTargets.filter(
      (evaluation) =>
        evaluation.targetKind === "remote" &&
        evaluation.targetServerId === serverId,
    );
    if (
      evaluations.some((evaluation) =>
        runnerTerminalRemoteContestIsDirectlyMandatory(input, evaluation),
      )
    ) {
      return [];
    }
    const coverageSupport = coverageGaps.find(
      (gap) =>
        gap.targetServerId === serverId &&
        gap.requesterModuleId === "runner.contest_remote" &&
        gap.requesterNeedId === gap.gapId,
    );
    return [
      {
        contestId: `remote:${serverId}`,
        serverId,
        purpose: "contest" as const,
        knownAgendaThreat: false,
        terminalPatternThreat: true,
        reachable: false,
        marginalValue: 1_400,
        evidenceCode: `runner_matchpoint_remote_pattern_focus:${serverId}`,
        ...(coverageSupport ? { supportNeedId: coverageSupport.gapId } : {}),
        preferredRunActionIds: evaluations.map(
          (evaluation) => evaluation.actionId,
        ),
      },
    ];
  });
}

function bindRunnerRemoteRunActionAssessments(
  input: AiDecisionInput,
  economy: RunnerEconomyPosture,
  signal: RunnerRemoteContestSignalDraft,
  runTargets: readonly RunnerRunTargetEvaluation[],
  candidates: readonly ActionSemanticCandidate[],
): RunnerRemoteContestSignal {
  const currentActionIds = new Set(
    candidates.map((candidate) => candidate.actionId),
  );
  const evaluations = runTargets.filter(
    (evaluation) =>
      evaluation.targetKind === "remote" &&
      evaluation.targetServerId === signal.serverId &&
      currentActionIds.has(evaluation.actionId),
  );
  const duplicateActionIds = evaluations
    .map((evaluation) => evaluation.actionId)
    .filter(
      (actionId, index, actionIds) => actionIds.indexOf(actionId) !== index,
    );
  if (duplicateActionIds.length > 0) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [...new Set(duplicateActionIds)],
      owner: "plan_module",
      removalCondition:
        "Each exact same-server Runner run action must have exactly one run-target evaluation before the Remote plan can classify it.",
    });
  }
  const preferredActionIds = new Set(signal.preferredRunActionIds ?? []);
  const evaluatedRunActionAssessments = evaluations.map((evaluation) => {
    const actionCandidate = candidates.find(
      (candidate) => candidate.actionId === evaluation.actionId,
    );
    const directlyAvailableBasicRun = candidates.some(
      (candidate) =>
        candidate.semanticActionType === "run.start" &&
        candidate.runProjectionSummary?.serverId === signal.serverId,
    );
    const lacksDifferentialPayoff =
      directlyAvailableBasicRun &&
      actionCandidate?.semanticActionType === "play.runner_event" &&
      !runnerCardRunHasVisibleDifferentialPayoff(
        input,
        actionCandidate,
        signal.serverId,
        evaluations,
      );
    const fundingSupport = runnerRunFundingSupport(
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
    const productiveProbeCanConvertNow = runnerRemoteProbeCanConvertNow(
      input,
      economy,
      evaluation,
    );
    const irrecoverableScoreThreatContest =
      signal.evidenceCode ===
        `runner_irrecoverable_random_break_damage_score_threat_contest:${evaluation.targetServerId}` ||
      runnerIrrecoverableRandomBreakScoreThreatContest(
        input,
        candidates,
        evaluation,
      );
    const terminalRemoteContestIsDirectlyMandatory =
      runnerTerminalRemoteContestIsDirectlyMandatory(input, evaluation);
    const directRunRouteReady =
      evaluation.recommendation === "run_now" ||
      evaluation.recommendation === "run_if_free" ||
      productiveProbeCanConvertNow ||
      directRunCanConvertNow;
    const exactUrgentPayoffOverridesNegativeRiskScore =
      runnerRunHasExactUrgency(input, evaluation) &&
      evaluation.recommendation === "run_now";
    const specialRouteMembership =
      signal.constrainedActionCapacity === true ||
      signal.evidenceCode === "visible_known_agenda_remote";
    const executable =
      signal.runActionDeferralEvidenceCode === undefined &&
      signal.routePreparation === undefined &&
      signal.reachable &&
      signal.marginalValue > 0 &&
      !lacksDifferentialPayoff &&
      (terminalRemoteContestIsDirectlyMandatory ||
        (specialRouteMembership
          ? preferredActionIds.has(evaluation.actionId)
          : irrecoverableScoreThreatContest ||
            (evaluation.pathPassability === "reachable" &&
              (evaluation.score > 0 ||
                exactUrgentPayoffOverridesNegativeRiskScore) &&
              fundingSupport === undefined &&
              directRunRouteReady)));
    const evidenceCodes = executable
      ? [
          `runner_remote_run_variant_executable:${signal.serverId}:${evaluation.actionId}`,
          ...evaluation.evidence,
        ]
      : [
          lacksDifferentialPayoff
            ? "runner_remote_card_run_has_no_visible_differential_payoff_over_basic_run"
            : (signal.runActionDeferralEvidenceCode ??
              runnerRemoteRunVariantNonproductiveEvidence(
                signal,
                evaluation,
                fundingSupport,
                preferredActionIds,
              )),
          ...evaluation.evidence,
        ];
    const opportunityQuote = evaluation.consumableRunOpportunityQuote;
    return [
      evaluation.actionId,
      {
        verdict: executable
          ? ("executable" as const)
          : ("explicitly_nonproductive" as const),
        stepValue: executable ? signal.marginalValue + evaluation.score : 0,
        evidenceCodes,
        routeDiagnostic: {
          rawRouteScore: opportunityQuote?.rawRouteScore ?? evaluation.score,
          opportunityCost: opportunityQuote?.opportunityCost ?? 0,
          effectiveRouteScore: evaluation.score,
        },
      },
    ];
  });
  const releaseRunLockAssessments =
    signal.routePreparation === "release_run_lock"
      ? candidates
          .filter((candidate) => preferredActionIds.has(candidate.actionId))
          .map((candidate) => [
            candidate.actionId,
            {
              verdict: signal.reachable
                ? ("executable" as const)
                : ("explicitly_nonproductive" as const),
              stepValue: signal.reachable ? signal.marginalValue : 0,
              evidenceCodes: [
                signal.reachable
                  ? `runner_remote_run_lock_release_executable:${signal.serverId}:${candidate.actionId}`
                  : `runner_remote_run_lock_release_blocked:${signal.serverId}:${candidate.actionId}`,
              ],
            },
          ])
      : [];
  const runActionAssessments = Object.fromEntries([
    ...evaluatedRunActionAssessments,
    ...releaseRunLockAssessments,
  ]);
  const {
    preferredRunActionIds: _preferredRunActionIds,
    runActionDeferralEvidenceCode: _runActionDeferralEvidenceCode,
    ...normalized
  } = signal;
  return {
    ...normalized,
    runActionAssessments,
  };
}

function runnerRemoteRunVariantNonproductiveEvidence(
  signal: RunnerRemoteContestSignalDraft,
  evaluation: RunnerRunTargetEvaluation,
  fundingSupport: RunnerRunFundingSupport | undefined,
  preferredActionIds: ReadonlySet<string>,
): string {
  if (signal.routePreparation) {
    return `runner_remote_run_deferred_to_bound_preparation:${signal.serverId}:${signal.routePreparation}`;
  }
  if (
    signal.constrainedActionCapacity &&
    !preferredActionIds.has(evaluation.actionId)
  ) {
    return `runner_remote_run_not_bound_to_restricted_capacity:${signal.serverId}`;
  }
  if (signal.supportNeedId || fundingSupport) {
    return `runner_remote_run_deferred_to_bound_funding_support:${signal.serverId}:${signal.supportNeedId ?? fundingSupport!.needId}`;
  }
  if (evaluation.knownAccessState === "known_no_current_payoff") {
    return `runner_remote_run_known_no_current_payoff:${signal.serverId}:${evaluation.recommendation}`;
  }
  if (evaluation.pathPassability !== "reachable") {
    return `runner_remote_run_route_blocked:${signal.serverId}:${evaluation.pathPassability}`;
  }
  if (evaluation.score <= 0) {
    return `runner_remote_run_below_material_value:${signal.serverId}:${evaluation.score}:${evaluation.recommendation}`;
  }
  if (!signal.reachable) {
    return `runner_remote_run_plan_not_executable:${signal.serverId}:${signal.evidenceCode}`;
  }
  return `runner_remote_run_not_currently_convertible:${signal.serverId}:${evaluation.recommendation}`;
}

export function runnerRemoteHasKnownIceScheduledForRunnerTurnEndTrash(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  return (
    input.playerView.servers
      .find((server) => server.id === serverId)
      ?.ice.some(
        (card) =>
          card.known === true &&
          card.rezzed === true &&
          card.lifecycleMarkers?.some(
            (marker) => marker.kind === "scheduled_trash_at_runner_turn_end",
          ) === true,
      ) === true
  );
}

export function runnerRemoteHasCurrentContestMaterial(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  return (
    (input.playerView.servers.find((server) => server.id === serverId)?.root
      .length ?? 0) > 0
  );
}

export function buildRunnerRemoteContestSignals({
  input,
  candidates,
  runTargets,
  runLockReleaseRoutes,
  economy,
  coverageGaps,
  terminalContestThreat,
  recentSafetyAbort,
  damageThreat,
  forgoUnsafeRunCapacity,
  constrainedRunCandidates,
  handDevelopment,
  recurringEconomyRunDeferralEvidenceCode,
  activeRunRoot,
}: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  runTargets: readonly RunnerRunTargetEvaluation[];
  runLockReleaseRoutes: ReturnType<typeof runnerRunLockReleaseRoutes>;
  economy: RunnerEconomyPosture;
  coverageGaps: RunnerCorePlanDomain["coverageGaps"];
  terminalContestThreat: ReturnType<typeof runnerTerminalContestThreat>;
  recentSafetyAbort: ReturnType<
    typeof runnerRecentFutureEncounterDamageSafetyAbort
  >;
  damageThreat: ReturnType<typeof runnerDefenseHandBufferFacts>["damageThreat"];
  forgoUnsafeRunCapacity: boolean;
  constrainedRunCandidates: {
    candidate: ActionSemanticCandidate;
    serverId: string;
    marginalValue: number;
    evidenceCode: string;
  }[];
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[];
  recurringEconomyRunDeferralEvidenceCode: string | undefined;
  activeRunRoot: ActiveRunnerRunRoot | undefined;
}): RunnerPlanDomain["remoteContests"] {
  const baseRemoteContestDrafts: RunnerRemoteContestSignalDraft[] = [
    ...runnerRemoteInformationPreparationSignals(input, candidates, runTargets),
    ...runLockReleaseRoutes.flatMap((route) => {
      if (!route.serverId.startsWith("remote_")) return [];
      return [
        {
          contestId: `remote:${route.serverId}`,
          serverId: route.serverId,
          purpose: "contest" as const,
          knownAgendaThreat: route.terminal,
          reachable: route.ready,
          marginalValue: route.value,
          evidenceCode: route.evidenceCode,
          ...(route.actionId
            ? { preferredRunActionIds: [route.actionId] }
            : {}),
          ...(route.supportNeedId
            ? { supportNeedId: route.supportNeedId }
            : {}),
          routePreparation: "release_run_lock" as const,
        },
      ];
    }),
    ...bestRunTargetsByServer(input, economy, runTargets, candidates)
      .filter((evaluation) => {
        if (
          evaluation.targetKind === "remote" &&
          runnerRemoteHasKnownIceScheduledForRunnerTurnEndTrash(
            input,
            evaluation.targetServerId,
          )
        ) {
          return false;
        }
        const visibleKnownAgendaRoute = visibleKnownAgendaOnServer(
          input,
          evaluation.targetServerId,
        );
        if (
          visibleKnownAgendaRoute &&
          !runnerKnownAgendaRunEvaluationIsCertified(
            input,
            candidates,
            evaluation,
            evaluation.targetServerId,
          )
        ) {
          return false;
        }
        const productiveProbeCanConvertNow = runnerRemoteProbeCanConvertNow(
          input,
          economy,
          evaluation,
        );
        const irrecoverableScoreThreatContest =
          runnerIrrecoverableRandomBreakScoreThreatContest(
            input,
            candidates,
            evaluation,
          );
        const terminalRemoteContestIsDirectlyMandatory =
          runnerTerminalRemoteContestIsDirectlyMandatory(input, evaluation);
        const coverageSupport = coverageGaps.some(
          (gap) =>
            gap.requesterModuleId === "runner.contest_remote" &&
            gap.targetServerId === evaluation.targetServerId &&
            (gap.targetRunActionId === evaluation.actionId ||
              terminalContestThreat?.remoteServerIds.includes(
                evaluation.targetServerId,
              ) === true),
        );
        return (
          evaluation.targetKind === "remote" &&
          ((evaluation.pathPassability === "reachable" &&
            (evaluation.recommendation === "run_now" ||
              evaluation.recommendation === "run_if_free" ||
              evaluation.recommendation === "gain_credits_first" ||
              productiveProbeCanConvertNow) &&
            evaluation.score > 0) ||
            terminalRemoteContestIsDirectlyMandatory ||
            irrecoverableScoreThreatContest ||
            coverageSupport ||
            runnerRunFundingSupport(
              input,
              economy,
              evaluation,
              runTargets,
              candidates,
            ) !== undefined)
        );
      })
      .map((evaluation) => {
        const recentSafetyBlocked =
          recentSafetyAbort?.serverId === evaluation.targetServerId;
        const fundingSupport = recentSafetyBlocked
          ? undefined
          : runnerRunFundingSupport(
              input,
              economy,
              evaluation,
              runTargets,
              candidates,
            );
        const coverageSupport = coverageGaps.find(
          (gap) =>
            gap.requesterModuleId === "runner.contest_remote" &&
            gap.targetServerId === evaluation.targetServerId &&
            (gap.targetRunActionId === evaluation.actionId ||
              terminalContestThreat?.remoteServerIds.includes(
                evaluation.targetServerId,
              ) === true),
        );
        const purpose = runPurposeForEvaluation(evaluation);
        const directRunCanConvertNow = runnerRunTargetCanConvertNow(
          input,
          economy,
          evaluation,
          candidates,
        );
        const productiveProbeCanConvertNow = runnerRemoteProbeCanConvertNow(
          input,
          economy,
          evaluation,
        );
        const irrecoverableScoreThreatContest =
          runnerIrrecoverableRandomBreakScoreThreatContest(
            input,
            candidates,
            evaluation,
          );
        const terminalRemoteContestIsDirectlyMandatory =
          runnerTerminalRemoteContestIsDirectlyMandatory(input, evaluation);
        const terminalRemoteThreat = runnerCoverageGapIsTerminalRemoteThreat(
          input,
          evaluation,
        );
        const fundingSupportCanExecuteBeforeUrgentContest =
          fundingSupport !== undefined &&
          fundingSupport.routeActionIds.length > 0;
        const urgentContestBypassesUnavailableFundingSupport =
          (terminalRemoteContestIsDirectlyMandatory ||
            irrecoverableScoreThreatContest) &&
          fundingSupport !== undefined &&
          !fundingSupportCanExecuteBeforeUrgentContest;
        const boundFundingSupport =
          urgentContestBypassesUnavailableFundingSupport
            ? undefined
            : fundingSupport;
        const repeatedTerminalDamageContest =
          runnerTerminalNonlethalDamageContestAlreadyFailedThisTurn(
            input,
            evaluation,
          );
        const criticalDamageContestBlocked = runnerCriticalDamageContestBlocked(
          input,
          evaluation,
          damageThreat,
        );
        const safetyBlocked =
          recentSafetyBlocked ||
          criticalDamageContestBlocked ||
          repeatedTerminalDamageContest;
        const runRiskContract = runRiskContractForEvaluation(input, evaluation);
        const directRunRouteReady =
          evaluation.prerunReserveQuote?.status !== "blocked" &&
          (purpose !== "information" ||
            runnerInformationProbeCanUseQuotedPath(
              evaluation,
              directRunCanConvertNow,
            )) &&
          (evaluation.recommendation === "run_now" ||
            evaluation.recommendation === "run_if_free" ||
            productiveProbeCanConvertNow ||
            directRunCanConvertNow);
        return {
          contestId: `remote:${evaluation.targetServerId}`,
          serverId: evaluation.targetServerId,
          purpose: purpose === "information" ? purpose : ("contest" as const),
          knownAgendaThreat: evaluation.scoreThreat,
          terminalPatternThreat: terminalRemoteThreat,
          reachable:
            !safetyBlocked &&
            !forgoUnsafeRunCapacity &&
            coverageSupport === undefined &&
            boundFundingSupport === undefined &&
            (terminalRemoteContestIsDirectlyMandatory ||
              irrecoverableScoreThreatContest ||
              (evaluation.prerunReserveQuote?.status !== "blocked" &&
                directRunRouteReady)),
          marginalValue: terminalRemoteThreat
            ? 1_400
            : irrecoverableScoreThreatContest
              ? 1_200
              : coverageSupport
                ? Math.max(1, evaluation.score)
                : boundFundingSupport
                  ? Math.max(1, evaluation.score)
                  : evaluation.recommendation === "run_now" ||
                      productiveProbeCanConvertNow
                    ? evaluation.score
                    : Math.min(evaluation.score, 60),
          evidenceCode: forgoUnsafeRunCapacity
            ? "runner_restricted_run_capacity_below_required_hand_buffer"
            : safetyBlocked
              ? repeatedTerminalDamageContest
                ? `runner_terminal_remote_contest_repeat_blocked_after_failed_path:${evaluation.targetServerId}`
                : criticalDamageContestBlocked
                  ? `runner_critical_damage_remote_contest_requires_hand_buffer:${evaluation.targetServerId}`
                  : recentSafetyAbort!.evidenceCode
              : terminalRemoteContestIsDirectlyMandatory
                ? `runner_terminal_remote_contest_mandatory:${evaluation.targetServerId}:${evaluation.actionId}`
                : irrecoverableScoreThreatContest
                  ? `runner_irrecoverable_random_break_damage_score_threat_contest:${evaluation.targetServerId}`
                  : coverageSupport
                    ? coverageSupport.evidenceCode
                    : boundFundingSupport
                      ? boundFundingSupport.evidenceCode
                      : directRunCanConvertNow
                        ? `runner_direct_run_converts_now:${evaluation.targetServerId}`
                        : evaluation.recommendation === "gain_credits_first"
                          ? `runner_remote_contest_waits_for_credit_reserve:${evaluation.targetServerId}`
                          : productiveProbeCanConvertNow
                            ? `runner_productive_remote_probe_converts_now:${evaluation.targetServerId}`
                            : (evaluation.evidence[0] ??
                              "runner_remote_target"),
          ...(coverageSupport
            ? { supportNeedId: coverageSupport.gapId }
            : boundFundingSupport
              ? { supportNeedId: boundFundingSupport.needId }
              : {}),
          preferredRunActionIds: [evaluation.actionId],
          ...(purpose === "information"
            ? {
                encounterCreditSpendLimit: evaluation.pathCost,
              }
            : {}),
          accessCommitment: accessCommitmentForEvaluation(input, evaluation),
          ...(runRiskContract ? { runRiskContract } : {}),
        };
      }),
    ...runnerMatchpointRemoteFocusSignals(input, runTargets, coverageGaps),
    ...input.playerView.servers.flatMap((server) => {
      const knownAgenda = server.root.some(
        (card) => card.known !== false && card.type === "agenda",
      );
      const knownAgendaRunEvaluations = witnessedKnownAgendaRunEvaluations(
        input,
        candidates,
        runTargets,
        server.id,
      );
      if (
        !server.id.startsWith("remote_") ||
        !knownAgenda ||
        knownAgendaRunEvaluations.length === 0
      ) {
        return [];
      }
      const coverageSupport = coverageGaps.find(
        (gap) =>
          gap.targetServerId === server.id &&
          gap.requesterModuleId === "runner.contest_remote" &&
          gap.requesterNeedId === gap.gapId,
      );
      const preferredRunActionIds = knownAgendaRunEvaluations.map(
        (evaluation) => evaluation.actionId,
      );
      return [
        {
          contestId: `remote:${server.id}`,
          serverId: server.id,
          purpose: "contest" as const,
          knownAgendaThreat: true,
          reachable: !forgoUnsafeRunCapacity,
          marginalValue: 1_000,
          evidenceCode: forgoUnsafeRunCapacity
            ? "runner_restricted_run_capacity_below_required_hand_buffer"
            : "visible_known_agenda_remote",
          ...(coverageSupport ? { supportNeedId: coverageSupport.gapId } : {}),
          preferredRunActionIds,
          accessCommitment: accessCommitmentForEvaluation(
            input,
            knownAgendaRunEvaluations[0]!,
          ),
        },
      ];
    }),
    ...constrainedRunCandidates.flatMap(
      ({ candidate, serverId, marginalValue, evidenceCode }) => {
        if (!serverId.startsWith("remote_")) return [];
        return [
          {
            contestId: `remote:${serverId}`,
            serverId,
            purpose: "information" as const,
            knownAgendaThreat: false,
            reachable: true,
            marginalValue,
            constrainedActionCapacity: true,
            evidenceCode,
            preferredRunActionIds: [candidate.actionId],
            encounterCreditSpendLimit:
              INFORMATION_PROBE_KNOWN_PATH_CREDIT_BUDGET,
          },
        ];
      },
    ),
    ...runnerSameTurnAccessRemotePreparationSignals(
      input,
      candidates,
      handDevelopment,
      runTargets,
    ),
  ];
  const remoteContestDrafts: RunnerRemoteContestSignalDraft[] = [
    ...baseRemoteContestDrafts,
    ...runnerTargetedIceTrashRemotePreparationSignals(
      input,
      candidates,
      baseRemoteContestDrafts,
      runTargets,
    ),
    ...runnerTargetedBypassRemotePreparationSignals(
      input,
      candidates,
      baseRemoteContestDrafts,
      runTargets,
    ),
    // A remembered access decline is an explicit target rejection even when
    // the current path and trash payment are affordable. Keep its exact run
    // assessments available when no productive contest was admitted above.
    ...runTargets
      .filter(
        (evaluation) =>
          evaluation.targetKind === "remote" &&
          evaluation.recommendation === "declined_trash_memory_active",
      )
      .map((evaluation): RunnerRemoteContestSignalDraft => {
        const evidenceCode = `runner_remote_run_declined_trash_memory_active:${evaluation.targetServerId}`;
        return {
          contestId: `remote:${evaluation.targetServerId}`,
          serverId: evaluation.targetServerId,
          purpose: "contest",
          knownAgendaThreat: false,
          reachable: false,
          marginalValue: 0,
          evidenceCode,
          runActionDeferralEvidenceCode: evidenceCode,
        };
      }),
  ];
  const remoteContests = uniqueBy(
    [
      ...uniqueBy(remoteContestDrafts, (signal) => signal.contestId)
        .map((signal) => {
          const knownAmbush = runnerKnownRemoteAccessDamageAmbushAssessment(
            input,
            signal.serverId,
          );
          return knownAmbush
            ? {
                ...signal,
                reachable: false,
                marginalValue: 0,
                runActionDeferralEvidenceCode: knownAmbush.evidenceCode,
                evidenceCode: `${signal.evidenceCode}|${knownAmbush.evidenceCode}`,
              }
            : signal;
        })
        .filter(
          (signal) =>
            signal.routePreparation !== undefined ||
            !runnerRemoteHasKnownIceScheduledForRunnerTurnEndTrash(
              input,
              signal.serverId,
            ),
        )
        .map((signal) =>
          bindRunnerRemoteRunActionAssessments(
            input,
            economy,
            recurringEconomyRunDeferralEvidenceCode &&
              !signal.runActionDeferralEvidenceCode
              ? {
                  ...signal,
                  runActionDeferralEvidenceCode:
                    recurringEconomyRunDeferralEvidenceCode,
                }
              : signal,
            runTargets,
            candidates,
          ),
        ),
      ...(activeRunRoot?.parentBinding?.moduleId === "runner.contest_remote"
        ? [
            {
              ...activeRunRoot.parentBinding.signal,
              // The parent remains resident while its run is in progress, but
              // there is no current start-run variant for the normal Remote
              // plan module to materialize. Encounter actions are owned by the
              // bound run-window continuation below, so the current decision
              // has an exact empty assessment set rather than reusing the
              // pre-run action assessments persisted with the parent.
              runActionAssessments: {},
            },
          ]
        : []),
    ],
    (signal) => signal.contestId,
  );
  return remoteContests;
}
