import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { KnownRezzedIcePathAssessment } from "../visible-run-analysis";

export type RunnerKnownNoAccessTarget = {
  serverId: string;
  assessment: KnownRezzedIcePathAssessment;
};

type RunnerKnownNoAccessDependencies = {
  assessKnownRezzedIcePath: (
    iceCards: AiDecisionInput["playerView"]["servers"][number]["ice"],
    rigCards: NonNullable<AiDecisionInput["playerView"]["own"]["rig"]>,
    runnerCredits: number,
    rootCards: AiDecisionInput["playerView"]["servers"][number]["root"],
  ) => KnownRezzedIcePathAssessment;
  runnerKnownPathAssessmentIsKnownNoAccess: (
    assessment: KnownRezzedIcePathAssessment,
  ) => boolean;
  runnerRunTargetHasOnlyUnknownOrUnrezzedIce: (
    input: AiDecisionInput,
    serverId: string,
  ) => boolean;
};

export function runnerKnownNoAccessLegalRunTargets(
  input: AiDecisionInput,
  dependencies: RunnerKnownNoAccessDependencies,
): RunnerKnownNoAccessTarget[] {
  if (input.side !== "runner") return [];
  return input.legalActions
    .filter(
      (action) =>
        action.side === "runner" &&
        action.type === "start_run" &&
        typeof action.payload?.serverId === "string",
    )
    .map((action) => {
      const serverId = String(action.payload?.serverId);
      const server = input.playerView.servers.find(
        (candidate) => candidate.id === serverId,
      );
      if (!server) return undefined;
      const assessment = dependencies.assessKnownRezzedIcePath(
        server.ice,
        input.playerView.own.rig ?? [],
        input.playerView.own.credits,
        server.root,
      );
      if (
        assessment.canReachAccess ||
        assessment.assessedKnownIceCount <= 0 ||
        !dependencies.runnerKnownPathAssessmentIsKnownNoAccess(assessment) ||
        dependencies.runnerRunTargetHasOnlyUnknownOrUnrezzedIce(input, serverId)
      )
        return undefined;
      return { serverId, assessment };
    })
    .filter(
      (target): target is RunnerKnownNoAccessTarget => target !== undefined,
    );
}

export type RunnerCoverageRepairDiagnostic = Partial<{
  runnerCoverageRepairIntentCandidates: boolean;
  runnerCoverageRepairIntentSearchTaken: boolean;
  runnerCoverageRepairIntentRecoveryTaken: boolean;
  runnerCoverageRepairIntentInstallTaken: boolean;
  runnerCoverageRepairIntentDrawOrEconomyTaken: boolean;
  runnerCoverageRepairIntentSatisfied: boolean;
  runnerCoverageRepairIntentNoFollowup: boolean;
}>;

export function runnerCoverageRepairDiagnostic(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: {
    runnerKnownNoAccessLegalRunTargets: (
      input: AiDecisionInput,
    ) => RunnerKnownNoAccessTarget[];
    sourceDefinitionIdForAction: (
      input: AiDecisionInput,
      action: LegalAction,
    ) => string | undefined;
    rolesForCardId: (definitionId: string | undefined) => string[];
  },
): RunnerCoverageRepairDiagnostic {
  if (dependencies.runnerKnownNoAccessLegalRunTargets(input).length === 0)
    return {};
  const definitionId = dependencies.sourceDefinitionIdForAction(input, action);
  const roles = definitionId ? dependencies.rolesForCardId(definitionId) : [];
  const actionKind = action.type;
  const isSearchOrRecovery =
    roles.some(
      (role) =>
        role.includes("search") ||
        role.includes("tutor") ||
        role.includes("recovery") ||
        role.includes("trash_recovery"),
    ) || actionKind === "resolve_choice";
  const isRecovery = roles.some(
    (role) => role.includes("recovery") || role.includes("trash_recovery"),
  );
  const isInstall = actionKind === "install_card";
  const isDrawOrEconomy =
    actionKind === "draw_card" ||
    actionKind === "gain_credit" ||
    (actionKind === "play_event" && roles.some((role) => role === "economy"));
  return {
    runnerCoverageRepairIntentCandidates: true,
    ...(isSearchOrRecovery && !isRecovery
      ? { runnerCoverageRepairIntentSearchTaken: true }
      : {}),
    ...(isRecovery ? { runnerCoverageRepairIntentRecoveryTaken: true } : {}),
    ...(isInstall ? { runnerCoverageRepairIntentInstallTaken: true } : {}),
    ...(isDrawOrEconomy
      ? { runnerCoverageRepairIntentDrawOrEconomyTaken: true }
      : {}),
    ...(isSearchOrRecovery || isInstall || isDrawOrEconomy
      ? { runnerCoverageRepairIntentSatisfied: true }
      : { runnerCoverageRepairIntentNoFollowup: true }),
  };
}
