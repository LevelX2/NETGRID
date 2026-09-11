import { RUNNER_BREAKER_COVERAGE_ROLES } from "../../plans/runner-coverage-contracts";
import { runnerCandidateSourceDefinitionId } from "../../runtime/runner-action-source-facts";
import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { rolesForDeckDoctrineCard } from "../../deck-doctrine-card-roles";
import { runnerCoverageCurrentPhase } from "./coverage-plan-module";
import {
  runnerRolesCoverCoverageGap,
  type RunnerCoverageGapSignal,
} from "../../plans/runner-coverage-contracts";
import {
  type PlanActionDisposition,
  type PlanSchedulerContext,
} from "../../plans/plan-scheduler";
import { planInstanceIdForProposal } from "../../plans/plan-instance";
import { runnerTerminalContestThreat } from "../../runtime/runner-terminal-contest-threat";
type CoverageDispositionDomain = {
  coverageGaps: RunnerCoverageGapSignal[];
  developments: readonly {
    assignedDomainPlanIds: readonly string[];
    actionIds: readonly string[];
  }[];
  centralPressure: readonly {
    supportNeedId?: string;
    pressureId: string;
    marginalValue: number;
  }[];
};
type AddDisposition = (
  actionId: string,
  ownerModuleId: PlanActionDisposition["ownerModuleId"],
  evidenceCode: string,
) => void;
export function addRunnerCoverageMemoryDispositions(
  domain: Pick<CoverageDispositionDomain, "coverageGaps">,
  add: AddDisposition,
): void {
  for (const gap of domain.coverageGaps) {
    for (const actionId of gap.programInstallMemoryRejectedActionIds ?? []) {
      add(
        actionId,
        "runner.rig_and_coverage",
        "runner_coverage_search_install_has_no_acceptable_sacrifice",
      );
    }
  }
}
export function runnerCoverageInstallDeferrals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  domain: CoverageDispositionDomain,
  dispositions: PlanActionDisposition[],
  currentTurnKey: string,
) {
  const deferredSameTurnCoverageInstallActionIds = new Set(
    domain.coverageGaps.flatMap((gap) =>
      gap.sameTurnRunConversion !== undefined && (gap.fundingGap ?? 0) > 0
        ? (gap.installActionIds ?? [])
        : [],
    ),
  );
  const coveragePlanningContext: PlanSchedulerContext = {
    input,
    actionCandidates: candidates,
    actionDispositions: dispositions,
    transientSignals: [],
    turnKey: currentTurnKey,
    domain,
  };
  const coverageGapsByAssignedPlanId = new Map(
    domain.coverageGaps.map((gap) => [
      `runner.rig_and_coverage:${gap.gapId}`,
      gap,
    ]),
  );
  const deferredCoveragePreparationInstallActionIds = new Set(
    domain.developments.flatMap((signal) => {
      if (signal.assignedDomainPlanIds.length === 0) return [];
      const assignedCoverageGaps = signal.assignedDomainPlanIds.flatMap(
        (planId) => {
          const gap = coverageGapsByAssignedPlanId.get(planId);
          return gap ? [gap] : [];
        },
      );
      if (
        assignedCoverageGaps.length !== signal.assignedDomainPlanIds.length ||
        !assignedCoverageGaps.every(
          (gap) =>
            runnerCoverageCurrentPhase({
              context: coveragePlanningContext,
              gap,
              rolesForDefinitionId: rolesForDeckDoctrineCard,
            }) === "prepare_coverage",
        )
      ) {
        return [];
      }
      return signal.actionIds.filter(
        (actionId) =>
          candidates.find((candidate) => candidate.actionId === actionId)
            ?.semanticActionType === "install.card",
      );
    }),
  );
  return {
    deferredSameTurnCoverageInstallActionIds,
    deferredCoveragePreparationInstallActionIds,
    coveragePlanningContext,
    coverageGapsByAssignedPlanId,
  };
}
export function applyRunnerCoverageCandidateDisposition(
  params: {
    input: AiDecisionInput;
    candidate: ActionSemanticCandidate;
    domain: CoverageDispositionDomain;
    coverageOwnedActionIds: ReadonlySet<string>;
    deferrals: ReturnType<typeof runnerCoverageInstallDeferrals>;
  },
  add: AddDisposition,
): boolean {
  const { input, candidate, domain, coverageOwnedActionIds } = params;
  const {
    deferredSameTurnCoverageInstallActionIds,
    deferredCoveragePreparationInstallActionIds,
  } = params.deferrals;
  const boundCoverageInstallGaps =
    candidate.semanticActionType === "install.card"
      ? domain.coverageGaps.filter((gap) =>
          gap.installActionIds?.includes(candidate.actionId),
        )
      : [];
  if (
    boundCoverageInstallGaps.length > 0 &&
    boundCoverageInstallGaps.every(
      (gap) =>
        gap.requesterModuleId === "runner.pressure_central" &&
        domain.centralPressure.some(
          (parent) =>
            parent.supportNeedId === gap.gapId &&
            gap.requesterNeedId === gap.gapId &&
            gap.requesterPlanInstanceId ===
              planInstanceIdForProposal({
                moduleId: "runner.pressure_central",
                dedupeKey: parent.pressureId,
              }) &&
            parent.marginalValue <= 0,
        ),
    )
  ) {
    // A child cannot execute for a parent that currently rejects the payoff.
    // Keep the exact installation diagnosed by its existing coverage owner;
    // another positive or independent coverage need must remain eligible.
    add(
      candidate.actionId,
      "runner.rig_and_coverage",
      "runner_coverage_install_deferred_by_nonpositive_bound_parent",
    );
    return true;
  }
  if (deferredCoveragePreparationInstallActionIds.has(candidate.actionId)) {
    add(
      candidate.actionId,
      "runner.rig_and_coverage",
      "runner_coverage_install_deferred_for_current_preparation_phase",
    );
    return true;
  }
  if (deferredSameTurnCoverageInstallActionIds.has(candidate.actionId)) {
    add(
      candidate.actionId,
      "runner.rig_and_coverage",
      "runner_coverage_install_waits_for_bound_same_turn_funding",
    );
    return true;
  }
  const subtypeAction = input.legalActions.find(
    (action) => action.actionId === candidate.actionId,
  );
  if (
    subtypeAction?.side === "runner" &&
    subtypeAction.type === "trigger_ability" &&
    subtypeAction.payload?.runnerAbility === "change_icebreaker_subtype"
  ) {
    if (!coverageOwnedActionIds.has(candidate.actionId)) {
      add(
        candidate.actionId,
        "runner.rig_and_coverage",
        "runner_breaker_subtype_change_requires_bound_run_coverage_need",
      );
    }
    return true;
  }
  return false;
}
export function addRunnerCoverageRejectedSearchDispositions(
  domain: Pick<CoverageDispositionDomain, "coverageGaps">,
  coverageOwnedActionIds: ReadonlySet<string>,
  developmentOwnedActionIds: ReadonlySet<string>,
  add: AddDisposition,
): void {
  const rejectedCoverageGapsByActionId = new Map<
    string,
    RunnerCoverageGapSignal[]
  >();
  for (const gap of domain.coverageGaps) {
    for (const actionId of gap.rejectedSearchActionIds ?? []) {
      if (
        coverageOwnedActionIds.has(actionId) ||
        developmentOwnedActionIds.has(actionId)
      ) {
        continue;
      }
      const rejectedGaps = rejectedCoverageGapsByActionId.get(actionId) ?? [];
      rejectedGaps.push(gap);
      rejectedCoverageGapsByActionId.set(actionId, rejectedGaps);
    }
  }
  for (const [actionId, rejectedGaps] of rejectedCoverageGapsByActionId) {
    add(
      actionId,
      "runner.rig_and_coverage",
      `runner_coverage_search_rejected_without_deck_answer:${rejectedGaps
        .map(
          (gap) => `${gap.requiredRole}@${gap.targetServerId ?? "no_server"}`,
        )
        .sort()
        .join("+")}`,
    );
  }
}
export function runnerMatchpointReserveBlocksOverlappingBreakerInstall(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  coverageOwnedActionIds: ReadonlySet<string>,
  coverageGaps: readonly RunnerCoverageGapSignal[],
): boolean {
  const sourceDefinitionId = runnerCandidateSourceDefinitionId(
    input,
    candidate,
  );
  const sourceRoles = sourceDefinitionId
    ? rolesForDeckDoctrineCard(sourceDefinitionId)
    : [];
  const ownsTargetedCoverageNeed = coverageGaps.some(
    (gap) =>
      gap.targetServerId !== undefined &&
      ((gap.installActionIds ?? []).includes(candidate.actionId) ||
        (gap.answerInHand &&
          runnerRolesCoverCoverageGap(sourceRoles, gap.requiredRole))),
  );
  if (
    candidate.semanticActionType !== "install.card" ||
    (coverageOwnedActionIds.has(candidate.actionId) &&
      ownsTargetedCoverageNeed) ||
    runnerTerminalContestThreat(input) === undefined ||
    candidate.costProfile.costKnownStatus !== "known" ||
    (candidate.costProfile.creditCost ?? 0) <= 0
  ) {
    return false;
  }
  if (!sourceDefinitionId) return false;
  const candidateCoverage = RUNNER_BREAKER_COVERAGE_ROLES.filter((role) =>
    runnerRolesCoverCoverageGap(sourceRoles, role),
  );
  if (candidateCoverage.length === 0) return false;

  return (input.playerView.own.rig ?? []).some((installedCard) => {
    if (!installedCard.known || !installedCard.definitionId) return false;
    const installedRoles = rolesForDeckDoctrineCard(installedCard.definitionId);
    return candidateCoverage.some((role) =>
      runnerRolesCoverCoverageGap(installedRoles, role),
    );
  });
}
