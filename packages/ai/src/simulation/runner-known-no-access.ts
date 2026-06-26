import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { isRemoteServerTarget } from "../runtime/server-target";
import type { KnownRezzedIcePathAssessment } from "../visible-run-analysis";

type VisibleCardDefinitionLookup = (
  input: AiDecisionInput,
  cardId: string,
) => { definitionId?: string } | undefined;

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

type RunnerKnownPathDiagnosticsDependencies =
  RunnerKnownNoAccessDependencies & {
    remoteServerHasScoreThreat: (
      input: AiDecisionInput,
      serverId: string,
    ) => boolean;
    rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
    rolesForCardId: (definitionId: string | undefined) => string[];
    runnerCoverageRepairDiagnostic: (
      input: AiDecisionInput,
      action: LegalAction,
    ) => RunnerCoverageRepairDiagnostic;
    runnerHasRecentRunOnServer: (
      input: AiDecisionInput,
      serverId: string,
    ) => boolean;
    runnerKnownPathAssessmentIsUnbreakableNoAccess: (
      assessment: KnownRezzedIcePathAssessment,
    ) => boolean;
    runnerRemoteHasKnownRelevantTrashTarget: (
      input: AiDecisionInput,
      serverId: string,
    ) => boolean;
  };

export function runnerKnownPathDiagnosticsForAction(
  input: AiDecisionInput,
  action: LegalAction,
  targetServerId: string | undefined,
  reserveTarget: number,
  dependencies: RunnerKnownPathDiagnosticsDependencies,
) {
  const legalKnownNoAccessTargets = runnerKnownNoAccessLegalRunTargets(
    input,
    dependencies,
  );
  const selectedKnownNoAccess =
    targetServerId !== undefined &&
    legalKnownNoAccessTargets.some(
      (target) => target.serverId === targetServerId,
    );
  const suppressedKnownNoAccess =
    action.type !== "start_run" && legalKnownNoAccessTargets.length > 0;
  const firstProbeUnknownAllowed =
    action.type === "start_run" &&
    targetServerId !== undefined &&
    dependencies.runnerRunTargetHasOnlyUnknownOrUnrezzedIce(
      input,
      targetServerId,
    ) &&
    legalKnownNoAccessTargets.length === 0;
  if (action.type === "jack_out") {
    const run = input.playerView.run;
    const server = input.playerView.servers.find(
      (candidate) => candidate.id === run?.attackedServerId,
    );
    const currentIce =
      run?.position?.kind === "ice"
        ? server?.ice[run.position.iceIndex]
        : undefined;
    if (
      currentIce?.known &&
      currentIce.rezzed === true &&
      (run?.position?.kind === "ice" ? run.position.iceIndex : 99) <= 1 &&
      dependencies.assessKnownRezzedIcePath(
        [currentIce],
        input.playerView.own.rig ?? [],
        input.playerView.own.credits,
        server?.root ?? [],
      ).blocked
    ) {
      const fullPath =
        server !== undefined
          ? dependencies.assessKnownRezzedIcePath(
              server.ice,
              input.playerView.own.rig ?? [],
              input.playerView.own.credits,
              server.root,
            )
          : undefined;
      return {
        runEndedAfterFirstIceDueToCredits: true,
        ...(fullPath?.canReachAccess === false &&
        fullPath.unpayableReason ===
          "later_ice_unaffordable_after_prior_ice_cost"
          ? { runnerRunAbortedAfterKnownUnpayableLaterIce: true }
          : {}),
      };
    }
    return {};
  }
  if (action.type !== "start_run" || !targetServerId) {
    const selectedCoverageRepair = dependencies.runnerCoverageRepairDiagnostic(
      input,
      action,
    );
    const suppressedUnbreakableTarget = legalKnownNoAccessTargets.find(
      (target) =>
        dependencies.runnerKnownPathAssessmentIsUnbreakableNoAccess(
          target.assessment,
        ),
    );
    const suppressedServerId = suppressedUnbreakableTarget?.serverId;
    const suppressedCentral =
      suppressedServerId === "hq" ||
      suppressedServerId === "rd" ||
      suppressedServerId === "archives";
    const suppressedRemote =
      suppressedServerId !== undefined &&
      isRemoteServerTarget(suppressedServerId);
    const selectedRemoteCoverageRepair =
      suppressedRemote &&
      (selectedCoverageRepair.runnerCoverageRepairIntentSearchTaken === true ||
        selectedCoverageRepair.runnerCoverageRepairIntentRecoveryTaken ===
          true ||
        selectedCoverageRepair.runnerCoverageRepairIntentInstallTaken ===
          true ||
        selectedCoverageRepair.runnerCoverageRepairIntentDrawOrEconomyTaken ===
          true);
    return {
      ...(suppressedKnownNoAccess
        ? {
            runnerRunSuppressedAsKnownNoAccess: true,
          }
        : {}),
      ...(suppressedUnbreakableTarget
        ? {
            runnerRepeatKnownUnbreakableRunSuppressed: true,
            runnerKnownPathAccessNotReachable: true,
            runnerKnownPathBlockedByUnbreakableIce: true,
          }
        : {}),
      ...(suppressedUnbreakableTarget?.assessment
        .knownPathBlockedByMissingCoverage
        ? { runnerKnownPathBlockedByMissingCoverage: true }
        : {}),
      ...(suppressedUnbreakableTarget?.assessment.knownPathBlockedByEtr
        ? { runnerKnownPathBlockedByKnownEtr: true }
        : {}),
      ...(suppressedUnbreakableTarget?.assessment.missingCoverage?.includes(
        "wall",
      )
        ? { runnerKnownPathBlockedByWall: true }
        : {}),
      ...(suppressedCentral
        ? {
            runnerCentralPressureSuppressedNoAccess: true,
            runnerMultiaccessValueSuppressedNoAccess: true,
          }
        : {}),
      ...(suppressedRemote
        ? {
            runnerKnownUnbreakableRemoteRunSuppressed: true,
            runnerKnownUnbreakableRemoteTraceSampled: true,
          }
        : {}),
      ...(suppressedRemote &&
      selectedCoverageRepair.runnerCoverageRepairIntentCandidates === true
        ? { runnerKnownUnbreakableRemoteCoverageRepairAvailable: true }
        : {}),
      ...(selectedRemoteCoverageRepair
        ? { runnerKnownUnbreakableRemoteCoverageRepairTaken: true }
        : {}),
      ...(suppressedServerId === "hq"
        ? { runnerHqInterfaceSuppressedNoAccess: true }
        : {}),
      ...(suppressedServerId === "rd"
        ? { runnerRndInterfaceSuppressedNoAccess: true }
        : {}),
      ...(suppressedServerId === "hq" &&
      suppressedUnbreakableTarget?.assessment.unbreakableIceTitle ===
        "Data Wall"
        ? {
            runnerDataWallHqNoAccessSuppressed: true,
            runnerHqInterfaceDataWallValueSuppressed: true,
          }
        : {}),
      ...(suppressedServerId === "hq" &&
      suppressedUnbreakableTarget?.assessment.unbreakableIceTitle ===
        "Data Wall" &&
      dependencies.runnerHasRecentRunOnServer(input, suppressedServerId)
        ? { runnerDataWallHqRepeatSuppressed: true }
        : {}),
      ...selectedCoverageRepair,
    };
  }
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === targetServerId,
  );
  if (!server)
    return {
      ...(firstProbeUnknownAllowed
        ? { runnerRunAllowedAsFirstProbeUnknownIce: true }
        : {}),
    };
  const assessment = dependencies.assessKnownRezzedIcePath(
    server.ice,
    input.playerView.own.rig ?? [],
    input.playerView.own.credits,
    server.root,
  );
  const knownPathCost = assessment.visibleBreakCost ?? 0;
  const creditsAfterPath = input.playerView.own.credits - knownPathCost;
  const creditsMissing = Math.max(
    0,
    knownPathCost - input.playerView.own.credits,
  );
  const remote = isRemoteServerTarget(targetServerId);
  const central =
    targetServerId === "hq" ||
    targetServerId === "rd" ||
    targetServerId === "archives";
  const remoteThreat = dependencies.remoteServerHasScoreThreat(
    input,
    targetServerId,
  );
  const positiveProbe =
    !remoteThreat &&
    (action.payload?.bypass === true ||
      dependencies.rolesForAction(input, action).some(
        (role) =>
          role.includes("bypass") ||
          role.includes("probe") ||
          role.includes("expose") ||
          role.includes("inside_job"),
      ));
  const insufficientPath = assessment.blocked || creditsMissing > 0;
  const knownNoAccess =
    assessment.canReachAccess === false &&
    assessment.assessedKnownIceCount > 0 &&
    dependencies.runnerKnownPathAssessmentIsKnownNoAccess(assessment);
  const knownUnbreakableNoAccess =
    knownNoAccess &&
    dependencies.runnerKnownPathAssessmentIsUnbreakableNoAccess(assessment);
  const canBreakNextButNotFull =
    assessment.canBreakNextIceButNotFullPath === true;
  const insufficientReserve =
    !insufficientPath &&
    creditsAfterPath < reserveTarget &&
    (remoteThreat ||
      dependencies.runnerRemoteHasKnownRelevantTrashTarget(
        input,
        targetServerId,
      ));
  return {
    runKnownPathCostAtStart: knownPathCost,
    runCreditsAfterKnownPathEstimate: creditsAfterPath,
    runCreditsMissingForKnownPath: creditsMissing,
    ...(input.playerView.own.credits < reserveTarget
      ? { runnerRunStartedBelowReserve: true }
      : {}),
    ...(remote && input.playerView.own.credits < reserveTarget
      ? { runnerRemoteRunStartedBelowReserve: true }
      : {}),
    ...(central && input.playerView.own.credits < reserveTarget
      ? { runnerCentralRunStartedBelowReserve: true }
      : {}),
    ...(remoteThreat
      ? {
          runnerReserveBeforeAdvancedRemoteContest:
            input.playerView.own.credits - reserveTarget,
        }
      : {}),
    ...(insufficientPath
      ? { runStartedAgainstKnownUnaffordablePath: true }
      : {}),
    ...(insufficientPath && remote
      ? { remoteRunStartedAgainstKnownUnaffordablePath: true }
      : {}),
    ...(insufficientPath && central
      ? { centralRunStartedAgainstKnownUnaffordablePath: true }
      : {}),
    ...(knownNoAccess
      ? {
          runnerKnownPathCanReachAccessFalse: true,
        }
      : {}),
    ...(assessment.canReachAccess
      ? { runnerKnownPathAccessReachable: true }
      : assessment.assessedKnownIceCount > 0
        ? { runnerKnownPathAccessNotReachable: true }
        : {}),
    ...(knownNoAccess && !knownUnbreakableNoAccess
      ? { runnerRunStartedAgainstKnownUnpayableFullPath: true }
      : {}),
    ...(knownNoAccess && remote
      ? knownUnbreakableNoAccess
        ? {
            runnerRunStartedAgainstKnownUnbreakableRemotePath: true,
            runnerKnownUnbreakableRemoteTraceSampled: true,
            runnerKnownUnbreakableRemoteTrueBug: true,
            runnerKnownUnbreakableRemoteRunTakenDespiteGate: true,
          }
        : { runnerRunStartedAgainstKnownUnpayableRemotePath: true }
      : {}),
    ...(knownNoAccess && central
      ? knownUnbreakableNoAccess
        ? { runnerRunStartedAgainstKnownUnbreakableCentralPath: true }
        : { runnerRunStartedAgainstKnownUnpayableCentralPath: true }
      : {}),
    ...(knownUnbreakableNoAccess
      ? {
          runnerKnownPathBlockedByUnbreakableIce: true,
          runnerRunStartedAgainstKnownUnbreakablePath: true,
        }
      : {}),
    ...(assessment.knownPathBlockedByMissingCoverage
      ? { runnerKnownPathBlockedByMissingCoverage: true }
      : {}),
    ...(assessment.knownPathBlockedByEtr
      ? { runnerKnownPathBlockedByKnownEtr: true }
      : {}),
    ...(assessment.missingCoverage?.includes("wall")
      ? { runnerKnownPathBlockedByWall: true }
      : {}),
    ...(assessment.missingCoverage?.includes("code_gate")
      ? { runnerKnownPathBlockedByCodeGate: true }
      : {}),
    ...(assessment.missingCoverage?.includes("sentry")
      ? { runnerKnownPathBlockedBySentry: true }
      : {}),
    ...(knownUnbreakableNoAccess && central && targetServerId === "hq"
      ? { runnerHqInterfaceSuppressedNoAccess: true }
      : {}),
    ...(knownUnbreakableNoAccess && central && targetServerId === "rd"
      ? { runnerRndInterfaceSuppressedNoAccess: true }
      : {}),
    ...(knownUnbreakableNoAccess && central
      ? {
          runnerMultiaccessValueSuppressedNoAccess: true,
          runnerCentralPressureSuppressedNoAccess: true,
        }
      : {}),
    ...(knownUnbreakableNoAccess &&
    targetServerId === "hq" &&
    assessment.unbreakableIceTitle === "Data Wall"
      ? {
          runnerDataWallHqNoAccessSuppressed: true,
          runnerHqInterfaceDataWallValueSuppressed: true,
        }
      : {}),
    ...(knownUnbreakableNoAccess &&
    dependencies.runnerHasRecentRunOnServer(input, targetServerId)
      ? {
          runnerRepeatKnownUnbreakableRunTakenDespiteSuppression: true,
          runnerRepeatKnownUnbreakableRunPenalized: true,
        }
      : {}),
    ...(knownUnbreakableNoAccess &&
    central &&
    dependencies.runnerHasRecentRunOnServer(input, targetServerId)
      ? { runnerRepeatKnownUnbreakableCentralRunSuppressed: true }
      : {}),
    ...(knownUnbreakableNoAccess &&
    remote &&
    dependencies.runnerHasRecentRunOnServer(input, targetServerId)
      ? {
          runnerRepeatKnownUnbreakableRemoteRunSuppressed: true,
          runnerKnownUnbreakableRemoteRunPenalized: true,
        }
      : {}),
    ...(knownUnbreakableNoAccess &&
    targetServerId === "hq" &&
    assessment.unbreakableIceTitle === "Data Wall" &&
    dependencies.runnerHasRecentRunOnServer(input, targetServerId)
      ? { runnerDataWallHqRepeatSuppressed: true }
      : {}),
    ...(canBreakNextButNotFull
      ? { runnerKnownPathCanBreakNextIceButNotFullPath: true }
      : {}),
    ...(assessment.creditsSpentBeforeUnpayableIce > 0
      ? { runnerRunSpentCreditsBeforeKnownUnbreakableLaterIce: true }
      : {}),
    ...(knownNoAccess &&
    (assessment.visibleBreakCost ?? 0) > input.playerView.own.credits
      ? { runnerRunCostQuoteUnderestimatedFullPath: true }
      : {}),
    ...(knownNoAccess &&
    dependencies.runnerHasRecentRunOnServer(input, targetServerId)
      ? { runnerRepeatRunOnKnownUnpayablePath: true }
      : {}),
    ...(knownNoAccess &&
    remote &&
    dependencies.runnerHasRecentRunOnServer(input, targetServerId)
      ? { runnerRepeatRunOnKnownUnpayableRemotePath: true }
      : {}),
    ...(knownNoAccess && positiveProbe
      ? { runnerRunCouldOnlyForceRezButNotAccess: true }
      : {}),
    ...(firstProbeUnknownAllowed
      ? { runnerRunAllowedAsFirstProbeUnknownIce: true }
      : {}),
    ...(selectedKnownNoAccess
      ? { runnerRunPenalizedAsKnownNoAccess: true }
      : {}),
    ...(insufficientReserve
      ? { runStartedWithInsufficientStealOrTrashReserve: true }
      : {}),
    ...(positiveProbe ? { probeRunWithPositiveInfoValue: true } : {}),
    ...(insufficientPath && !positiveProbe && !remoteThreat
      ? { lowValueUnaffordableRun: true }
      : {}),
  };
}

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

export function createRunnerCoverageRepairDiagnostic(dependencies: {
  runnerKnownNoAccessLegalRunTargets: (
    input: AiDecisionInput,
  ) => RunnerKnownNoAccessTarget[];
  findVisibleCard: VisibleCardDefinitionLookup;
  rolesForCardId: (definitionId: string | undefined) => string[];
}): (
  input: AiDecisionInput,
  action: LegalAction,
) => RunnerCoverageRepairDiagnostic {
  return (input, action) =>
    runnerCoverageRepairDiagnostic(input, action, {
      runnerKnownNoAccessLegalRunTargets:
        dependencies.runnerKnownNoAccessLegalRunTargets,
      sourceDefinitionIdForAction: (diagnosticInput, diagnosticAction) =>
        typeof diagnosticAction.source === "string"
          ? dependencies.findVisibleCard(
              diagnosticInput,
              diagnosticAction.source,
            )?.definitionId
          : undefined,
      rolesForCardId: dependencies.rolesForCardId,
    });
}
