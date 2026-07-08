import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { rolesMatch } from "../runtime/role-match";
import {
  runnerRunPathCreditBudgetWithVisiblePools,
  type KnownRezzedIcePathAssessment,
  type RunnerRunPathCreditBudget,
} from "../visible-run-analysis";
import {
  centralPressureTargetsForCard,
  isCentralPressureCardForMetrics,
} from "./central-pressure-card";

type CentralServerTarget = "hq" | "rd" | "archives";

type CentralRunPressureJustificationDependencies = {
  assessKnownRezzedIcePath: (
    iceCards: AiDecisionInput["playerView"]["servers"][number]["ice"],
    rigCards: VisibleCard[],
    runnerCredits: number | RunnerRunPathCreditBudget,
    rootCards?: AiDecisionInput["playerView"]["servers"][number]["root"],
  ) => KnownRezzedIcePathAssessment;
  recentCentralRunSameTargetWithoutRefresh: (
    input: AiDecisionInput,
    target: CentralServerTarget,
  ) => boolean;
  rolesForCardId: (definitionId: string | undefined) => string[];
  runnerCreditReserveTargetForInput: (input: AiDecisionInput) => number;
  trueCentralCloseoutProfileForMetrics: (
    input: AiDecisionInput,
    target: CentralServerTarget,
  ) => { opportunity: boolean };
};

export function createRunnerCentralRunPressureJustificationContext(
  dependencies: CentralRunPressureJustificationDependencies,
): {
  runnerCentralRunHasClearPressureJustification: (
    input: AiDecisionInput,
    targetServerId: string,
    contestableRemoteThreatVisible: boolean,
  ) => boolean;
  runnerCentralRunPressureJustificationReasons: (
    input: AiDecisionInput,
    targetServerId: string,
    contestableRemoteThreatVisible: boolean,
  ) => string[];
  runnerCentralRunBurnsRemoteContestReserve: (
    input: AiDecisionInput,
    targetServerId: string,
    contestableProfiles: Array<{ postRunReserveTarget: number }>,
  ) => boolean;
} {
  return {
    runnerCentralRunHasClearPressureJustification: (
      input,
      targetServerId,
      contestableRemoteThreatVisible,
    ) =>
      runnerCentralRunHasClearPressureJustification(
        input,
        targetServerId,
        contestableRemoteThreatVisible,
        dependencies,
      ),
    runnerCentralRunPressureJustificationReasons: (
      input,
      targetServerId,
      contestableRemoteThreatVisible,
    ) =>
      runnerCentralRunPressureJustificationReasons(
        input,
        targetServerId,
        contestableRemoteThreatVisible,
        dependencies,
      ),
    runnerCentralRunBurnsRemoteContestReserve: (
      input,
      targetServerId,
      contestableProfiles,
    ) =>
      runnerCentralRunBurnsRemoteContestReserve(
        input,
        targetServerId,
        contestableProfiles,
        dependencies,
      ),
  };
}

export function runnerCentralRunHasClearPressureJustification(
  input: AiDecisionInput,
  targetServerId: string,
  contestableRemoteThreatVisible: boolean,
  dependencies: CentralRunPressureJustificationDependencies,
): boolean {
  return (
    runnerCentralRunPressureJustificationReasons(
      input,
      targetServerId,
      contestableRemoteThreatVisible,
      dependencies,
    ).length > 0
  );
}

export function runnerCentralRunPressureJustificationReasons(
  input: AiDecisionInput,
  targetServerId: string,
  contestableRemoteThreatVisible: boolean,
  dependencies: CentralRunPressureJustificationDependencies,
): string[] {
  if (
    targetServerId !== "hq" &&
    targetServerId !== "rd" &&
    targetServerId !== "archives"
  )
    return [];
  const centralTarget = targetServerId;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === centralTarget,
  );
  const assessment = dependencies.assessKnownRezzedIcePath(
    server?.ice ?? [],
    input.playerView.own.rig ?? [],
    runnerRunPathCreditBudgetWithVisiblePools(
      input.playerView.own.credits,
      input.playerView.own.rig ?? [],
    ),
    server?.root ?? [],
  );
  if (assessment.blocked) return [];
  const visibleBreakCost = assessment.visibleBreakCost ?? 0;
  const installedTargets = new Set(
    (input.playerView.own.rig ?? [])
      .filter((card) =>
        isCentralPressureCardForMetrics(card.definitionId, true),
      )
      .flatMap((card) => centralPressureTargetsForCard(card.definitionId)),
  );
  const matchingInterface = installedTargets.has(centralTarget);
  const hasAnyInterface = installedTargets.size > 0;
  const hasMultiaccess = (input.playerView.own.rig ?? []).some((card) =>
    rolesMatch(dependencies.rolesForCardId(card.definitionId), ["multiaccess"]),
  );
  const openOrCheap = visibleBreakCost <= 1 || (server?.ice.length ?? 0) === 0;
  const preservesReserve =
    assessment.creditsAfterPath >=
    dependencies.runnerCreditReserveTargetForInput(input);
  if (!openOrCheap || !preservesReserve) return [];
  const closeout = dependencies.trueCentralCloseoutProfileForMetrics(
    input,
    centralTarget,
  ).opportunity;
  const hqPressure =
    centralTarget === "hq" && input.playerView.opponent.handCount >= 5;
  const rndFreshness =
    centralTarget === "rd" &&
    !dependencies.recentCentralRunSameTargetWithoutRefresh(input, "rd");
  const remoteUncontestable = !contestableRemoteThreatVisible;
  const reasons = [
    ...(matchingInterface ? ["interface"] : []),
    ...(hasMultiaccess ? ["multiaccess"] : []),
    ...(closeout ? ["closeout"] : []),
    ...(remoteUncontestable ? ["remote_uncontestable"] : []),
    ...(hqPressure ? ["hq_pressure"] : []),
    ...(rndFreshness ? ["rnd_freshness"] : []),
    ...(!matchingInterface && hasAnyInterface ? ["generic_interface"] : []),
  ];
  if (contestableRemoteThreatVisible) {
    return reasons.filter((reason) =>
      [
        "interface",
        "multiaccess",
        "closeout",
        "hq_pressure",
        "rnd_freshness",
      ].includes(reason),
    );
  }
  return reasons;
}

export function runnerCentralRunBurnsRemoteContestReserve(
  input: AiDecisionInput,
  targetServerId: string,
  contestableProfiles: Array<{ postRunReserveTarget: number }>,
  dependencies: Pick<
    CentralRunPressureJustificationDependencies,
    "assessKnownRezzedIcePath"
  >,
): boolean {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === targetServerId,
  );
  const assessment = dependencies.assessKnownRezzedIcePath(
    server?.ice ?? [],
    input.playerView.own.rig ?? [],
    runnerRunPathCreditBudgetWithVisiblePools(
      input.playerView.own.credits,
      input.playerView.own.rig ?? [],
    ),
    server?.root ?? [],
  );
  if (assessment.blocked || contestableProfiles.length === 0) return false;
  const creditsAfterPath = assessment.creditsAfterPath;
  const requiredReserve = Math.max(
    ...contestableProfiles.map((profile) => profile.postRunReserveTarget),
  );
  return creditsAfterPath < requiredReserve;
}
