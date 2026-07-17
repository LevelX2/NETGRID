import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { actionProvidesCredits } from "../actions/action-effect-classification";
import { rolesMatch } from "./role-match";
import { visibleCardDefinition } from "./card-definition-lookup";
import {
  visibleBreakerCardCanAddressIce,
  visibleBreakerRoles,
} from "./runner-visible-breaker-coverage";
import { semanticRuntimeCorpCentralPressureAssessment } from "./semantic-runtime-corp-central-pressure";
import { semanticRuntimeCorpEffectiveDefenseContext } from "./semantic-runtime-corp-effective-defense";
import { semanticRuntimeCorpCentralIceProfile } from "./semantic-runtime-corp-remote-score";
import { corpIcePlacementCandidateForAction } from "./corp-ice-placement/corp-ice-placement";
import type {
  CorpScoringWindowAssessment,
  CorpScoringWindowAgendaStealSeverity,
} from "./semantic-runtime-corp-scoring-window";
import { semanticRuntimeVisibleSourceCard } from "./visible-card-lookup";
import { corpStrategicKillLineFundingActive } from "./corp-visible-kill-line";
import type {
  CorpBoardTriage,
  CorpBoardTriageDependencies,
  ScoredLegalAction,
} from "./corp-scoreline/semantic-runtime-corp-board-triage-contracts";

export type {
  CorpBoardTriage,
  CorpBoardTriageDependencies,
  CorpBoardTriagePrimary,
  CorpBoardTriageSeverity,
} from "./corp-scoreline/semantic-runtime-corp-board-triage-contracts";
import {
  actionBuildsScoreRemote,
  actionCreatesPurgeActionDebt,
  actionDistractsFromCentralProtection,
  actionHasVisibleDrawSource,
  actionIsExpensiveNonProtection,
  actionIsOffTargetInstall,
  actionIsUnfundedTargetProtectionInstall,
  actionProvidesEconomy,
  actionRelievesHqAgendaPressureViaSafeRemote,
  actionServerIdForAction,
  actionUsesVisibleMatchpointAgenda,
  corpBoardTriageMismatchComponentValue,
  corpLegalActions,
  corpRemoteScoringStrategyWantsRemoteDevelopment,
  inputWithOpponentDefaults,
  legalEconomyActionExists,
  normalizedCorpBoardTriageValue,
  triageIsActiveScorelineLock,
  triageIsEmergencyHqAgendaRemoteConversion,
  triageIsLastViableDeckoutMatchpoint,
  triageNeedsFunding,
  triageReason,
} from "./corp-scoreline/semantic-runtime-corp-board-triage-actions";
import {
  actionAcceleratesScoreline,
  actionClosesScoreNow,
  actionDelaysForcedScoreline,
  actionDelaysProtectedScoreRemote,
  actionKeepsSideSafeSameTurnScoreCloseout,
  actionKeepsSideSafeSameTurnScoreCloseoutForAction,
  actionProtectsServer,
  actionPushesConcreteAgendaScoreline,
  actionPushesUnsafeScoreline,
  centralPressureMustInterruptActiveScoreline,
  centralPressureShouldDriveTriage,
  centralPressureTriage,
  centralServerNeedsProtection,
  centralTriageSeverity,
  concreteCentralProtectionActionExists,
  corpActiveScorelineClockPressure,
  corpForcedScorelineClockPressure,
  corpRemoteScoringStrategyEvidence,
  corpTriageIsPunishPrimary,
  highestPriorityScoreRemoteEntry,
  highestPriorityTriageCentralPressure,
  preScoreCentralProtectionTriage,
  sameTargetRezIsDefinitelyBad,
  sameTargetRezMissesCriticalCentralStop,
  scoredLegalAction,
  scoreNowCentralProtectionInterruptTriage,
  scoreRemoteNeedsFunding,
  scoreRemoteNeedsProtection,
  scoreRemoteRequiredRezFloor,
  triageSeverityFromScoringWindow,
} from "./corp-scoreline/semantic-runtime-corp-board-triage-policies";

export { normalizedCorpBoardTriageValue } from "./corp-scoreline/semantic-runtime-corp-board-triage-actions";

const TRIAGE_ALIGNMENT_BONUS = 850;
const TRIAGE_MISMATCH_HIGH = -4200;
const TRIAGE_MISMATCH_MEDIUM = -2200;

export function semanticRuntimeCorpBoardTriage<TConsumer extends string>(
  input: AiDecisionInput,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): CorpBoardTriage {
  const actions = corpLegalActions(input).map((action) =>
    scoredLegalAction(input, action, dependencies),
  );
  const currentCredits = input.playerView.own.credits;

  const scoreNow = actions.find(
    (entry) =>
      actionClosesScoreNow(input, entry.action, dependencies) ||
      actionKeepsSideSafeSameTurnScoreCloseout(input, entry, dependencies),
  );
  if (scoreNow) {
    const scoreNowCentralInterrupt = scoreNowCentralProtectionInterruptTriage(
      input,
      actions,
      scoreNow,
      currentCredits,
      dependencies,
    );
    if (scoreNowCentralInterrupt) return scoreNowCentralInterrupt;
    return {
      primary: "score_now",
      severity: "critical",
      targetServerId: scoreNow.serverId,
      currentCredits,
      evidence: [
        "corp_board_triage_primary:score_now",
        "corp_board_triage_severity:critical",
        `corp_board_triage_action:${scoreNow.action.actionId}`,
      ],
    };
  }

  const preScoreCentralProtection = preScoreCentralProtectionTriage(
    input,
    actions,
    currentCredits,
    dependencies,
  );
  if (preScoreCentralProtection) return preScoreCentralProtection;

  const openingCentralBaseline = openingCentralBaselineTriage(
    input,
    actions,
    currentCredits,
    dependencies,
  );
  if (openingCentralBaseline) return openingCentralBaseline;

  const forcedScorelinePressure = corpForcedScorelineClockPressure(
    input,
    actions,
    dependencies,
  );
  if (forcedScorelinePressure) {
    return {
      primary: "force_scoreline_clock",
      severity: forcedScorelinePressure.severity,
      targetServerId: forcedScorelinePressure.targetServerId,
      scoreRemoteServerId: forcedScorelinePressure.scoreRemoteServerId,
      requiredRezFloor: forcedScorelinePressure.requiredRezFloor,
      currentCredits,
      evidence: [
        "corp_board_triage_primary:force_scoreline_clock",
        `corp_board_triage_severity:${forcedScorelinePressure.severity}`,
        ...forcedScorelinePressure.evidence,
      ],
    };
  }

  const pressureInput = inputWithOpponentDefaults(input);
  const centralPressure = highestPriorityTriageCentralPressure(pressureInput);
  const centralPressureSeverity = centralPressure
    ? centralTriageSeverity(pressureInput, centralPressure)
    : undefined;
  if (
    centralPressure?.serverId === "rd" &&
    centralPressureSeverity === "critical" &&
    centralServerNeedsProtection(input, "rd") &&
    concreteCentralProtectionActionExists(input, actions, "rd", dependencies)
  ) {
    const activeScorelineClock = corpActiveScorelineClockPressure(
      input,
      actions,
      dependencies,
    );
    if (
      !activeScorelineClock ||
      centralPressureMustInterruptActiveScoreline(
        pressureInput,
        centralPressure,
        activeScorelineClock,
      )
    ) {
      return centralPressureTriage(
        centralPressure,
        centralPressureSeverity,
        currentCredits,
        [
          "corp_board_triage_central_override:critical_before_remote",
          "corp_board_triage_central_override_requires_unanswered_protection:true",
        ],
      );
    }
  }

  const remoteFunding = highestPriorityScoreRemoteEntry(
    actions.filter((entry) =>
      scoreRemoteNeedsFunding(input, entry, actions, dependencies),
    ),
  );
  if (remoteFunding?.scoringWindow) {
    const requiredRezFloor = scoreRemoteRequiredRezFloor(
      input,
      actions,
      remoteFunding,
      dependencies,
    );
    return {
      primary: "fund_score_remote",
      severity: triageSeverityFromScoringWindow(remoteFunding.scoringWindow),
      targetServerId: remoteFunding.serverId,
      scoreRemoteServerId: remoteFunding.serverId,
      requiredRezFloor,
      currentCredits,
      runnerAgendaPointsAfterSteal:
        remoteFunding.scoringWindow.runnerAgendaPointsAfterSteal,
      evidence: [
        "corp_board_triage_primary:fund_score_remote",
        `corp_board_triage_target:${remoteFunding.serverId ?? "unknown"}`,
        `corp_board_triage_source_action:${remoteFunding.action.actionId}`,
        ...remoteFunding.scoringWindow.evidence,
        ...(remoteFunding.remoteRezFloor?.evidence ?? []),
      ],
    };
  }

  const remoteProtection = highestPriorityScoreRemoteEntry(
    actions.filter((entry) =>
      scoreRemoteNeedsProtection(input, entry, dependencies),
    ),
  );
  if (remoteProtection?.scoringWindow) {
    return {
      primary: "protect_score_remote",
      severity: triageSeverityFromScoringWindow(remoteProtection.scoringWindow),
      targetServerId: remoteProtection.serverId,
      scoreRemoteServerId: remoteProtection.serverId,
      currentCredits,
      runnerAgendaPointsAfterSteal:
        remoteProtection.scoringWindow.runnerAgendaPointsAfterSteal,
      evidence: [
        "corp_board_triage_primary:protect_score_remote",
        `corp_board_triage_target:${remoteProtection.serverId ?? "unknown"}`,
        `corp_board_triage_source_action:${remoteProtection.action.actionId}`,
        ...remoteProtection.scoringWindow.evidence,
      ],
    };
  }

  const activeScorelineClock = corpActiveScorelineClockPressure(
    input,
    actions,
    dependencies,
  );
  if (activeScorelineClock) {
    return {
      primary: "force_scoreline_clock",
      severity: activeScorelineClock.severity,
      targetServerId: activeScorelineClock.targetServerId,
      scoreRemoteServerId: activeScorelineClock.scoreRemoteServerId,
      requiredRezFloor: activeScorelineClock.requiredRezFloor,
      currentCredits,
      evidence: [
        "corp_board_triage_primary:force_scoreline_clock",
        `corp_board_triage_severity:${activeScorelineClock.severity}`,
        ...activeScorelineClock.evidence,
      ],
    };
  }

  if (
    centralPressure &&
    centralPressureSeverity &&
    centralPressureShouldDriveTriage(
      input,
      actions,
      centralPressure,
      centralPressureSeverity,
      dependencies,
    )
  ) {
    return centralPressureTriage(
      centralPressure,
      centralPressureSeverity,
      currentCredits,
    );
  }

  if (
    currentCredits < 4 ||
    dependencies.corpHasRemoteRezFloorFundingNeed(input) ||
    dependencies.corpHasCentralRezFloorFundingNeed(input)
  ) {
    return {
      primary: "recover_economy",
      severity: currentCredits <= 2 ? "high" : "medium",
      currentCredits,
      evidence: [
        "corp_board_triage_primary:recover_economy",
        `corp_board_triage_credits:${currentCredits}`,
      ],
    };
  }

  const setupRemote =
    !corpTriageIsPunishPrimary(input) ||
    corpRemoteScoringStrategyWantsRemoteDevelopment(input)
      ? actions.find((entry) => actionBuildsScoreRemote(entry))
      : undefined;
  if (setupRemote) {
    return {
      primary: "setup_score_remote",
      severity: "medium",
      targetServerId: setupRemote.serverId,
      scoreRemoteServerId: setupRemote.serverId,
      currentCredits,
      evidence: [
        "corp_board_triage_primary:setup_score_remote",
        `corp_board_triage_target:${setupRemote.serverId ?? "unknown"}`,
        ...corpRemoteScoringStrategyEvidence(input),
      ],
    };
  }

  return {
    primary: "low_value",
    severity: "low",
    currentCredits,
    evidence: ["corp_board_triage_primary:low_value"],
  };
}

function openingCentralBaselineTriage<TConsumer extends string>(
  input: AiDecisionInput,
  actions: readonly ScoredLegalAction[],
  currentCredits: number,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): CorpBoardTriage | undefined {
  if (typeof input.actionNumber !== "number" || input.actionNumber > 8) {
    return undefined;
  }
  const hasDevelopedRemote = input.playerView.servers.some(
    (server) =>
      server.id.startsWith("remote_") &&
      (server.ice.length > 0 || server.root.length > 0),
  );
  if (hasDevelopedRemote) return undefined;
  const hasCompetingEmptyRemoteDevelopment = actions.some(
    (entry) =>
      entry.action.type === "install_card" &&
      (entry.serverId === "new_remote" ||
        entry.serverId?.startsWith("remote_")) &&
      entry.action.payload?.placement !== "root_agenda",
  );
  if (!hasCompetingEmptyRemoteDevelopment) return undefined;
  const target = (["rd", "hq"] as const).find(
    (serverId) =>
      centralServerNeedsProtection(input, serverId) &&
      concreteCentralProtectionActionExists(
        input,
        actions,
        serverId,
        dependencies,
      ),
  );
  if (!target) return undefined;
  return {
    primary: target === "rd" ? "protect_rd" : "protect_hq",
    severity: "high",
    targetServerId: target,
    currentCredits,
    evidence: [
      `corp_board_triage_primary:protect_${target}`,
      "corp_board_triage_opening_central_baseline:true",
      "corp_board_triage_opening_remote_development_deferred:true",
      `corp_board_triage_action_number:${input.actionNumber}`,
      `corp_board_triage_target:${target}`,
    ],
  };
}

export function semanticRuntimeCorpBoardTriageActionComponent<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
  actionSemanticCandidate?: ActionSemanticCandidate,
): AiDecisionScoreComponent | undefined {
  const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
  if (triage.primary === "low_value") return undefined;
  const actionServerId = actionServerIdForAction(input, action);
  const alignment = corpBoardTriageActionAlignment(
    input,
    action,
    actionServerId,
    triage,
    dependencies,
    actionSemanticCandidate,
  );
  if (alignment === "match") {
    const rawValue =
      triage.severity === "critical"
        ? TRIAGE_ALIGNMENT_BONUS + 350
        : TRIAGE_ALIGNMENT_BONUS;
    const normalizedValue = normalizedCorpBoardTriageValue(rawValue);
    return {
      key: "corp_board_triage_alignment",
      label: "Corp-Board-Triage",
      value: normalizedValue,
      reason: triageReason(
        triage,
        action,
        actionServerId,
        "match",
        rawValue,
        normalizedValue,
      ),
    };
  }
  if (alignment === "mismatch") {
    const rawValue =
      triage.severity === "low" || triage.severity === "medium"
        ? TRIAGE_MISMATCH_MEDIUM
        : TRIAGE_MISMATCH_HIGH;
    const normalizedValue = normalizedCorpBoardTriageValue(rawValue);
    const componentValue = corpBoardTriageMismatchComponentValue(
      input,
      triage,
      normalizedValue,
      action,
      actionServerId,
    );
    return {
      key: "corp_board_triage_mismatch",
      label: "Corp-Board-Triage",
      value: componentValue,
      reason: triageReason(
        triage,
        action,
        actionServerId,
        "mismatch",
        rawValue,
        normalizedValue,
        componentValue,
      ),
    };
  }
  return {
    key: "corp_board_triage_context",
    label: "Corp-Board-Triage",
    value: 0,
    reason: triageReason(triage, action, actionServerId, "neutral"),
  };
}

function corpBoardTriageActionAlignment<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  actionServerId: string | undefined,
  triage: CorpBoardTriage,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): "match" | "mismatch" | "neutral" {
  switch (triage.primary) {
    case "score_now":
      return actionClosesScoreNow(input, action, dependencies) ||
        actionKeepsSideSafeSameTurnScoreCloseoutForAction(
          input,
          action,
          dependencies,
        )
        ? "match"
        : "mismatch";
    case "force_scoreline_clock": {
      const activeScorelineLock = triageIsActiveScorelineLock(triage);
      const emergencyRemoteConversion =
        triageIsEmergencyHqAgendaRemoteConversion(triage);
      const lastViableDeckoutMatchpoint =
        triageIsLastViableDeckoutMatchpoint(triage);
      const needsFunding =
        triage.requiredRezFloor !== undefined &&
        triage.currentCredits !== undefined &&
        triage.currentCredits < triage.requiredRezFloor;
      const legalEconomyAvailable = legalEconomyActionExists(input);
      if (
        actionKeepsSideSafeSameTurnScoreCloseoutForAction(
          input,
          action,
          dependencies,
        )
      ) {
        return "match";
      }
      if (
        actionAcceleratesScoreline(actionSemanticCandidate) &&
        (!needsFunding || !legalEconomyAvailable)
      ) {
        return "match";
      }
      if (actionHasVisibleDrawSource(input, action, actionSemanticCandidate)) {
        return "mismatch";
      }
      if (
        actionPushesConcreteAgendaScoreline(input, action, dependencies) &&
        triage.targetServerId &&
        actionServerId &&
        actionServerId !== triage.targetServerId
      ) {
        return "mismatch";
      }
      if (actionPushesConcreteAgendaScoreline(input, action, dependencies)) {
        if (
          lastViableDeckoutMatchpoint &&
          actionUsesVisibleMatchpointAgenda(input, action) &&
          (!triage.targetServerId || actionServerId === triage.targetServerId)
        ) {
          return "match";
        }
        if (needsFunding && legalEconomyAvailable) {
          return "mismatch";
        }
        if (
          emergencyRemoteConversion &&
          (!triage.targetServerId || actionServerId === triage.targetServerId)
        ) {
          return "match";
        }
        return "match";
      }
      if (
        actionProtectsServer(
          input,
          action,
          actionServerId,
          triage,
          dependencies,
          actionSemanticCandidate,
        )
      ) {
        return activeScorelineLock ? "mismatch" : "match";
      }
      if (
        needsFunding &&
        actionProvidesEconomy(
          input,
          action,
          dependencies,
          actionSemanticCandidate,
        )
      ) {
        return lastViableDeckoutMatchpoint ? "mismatch" : "match";
      }
      return actionDelaysForcedScoreline(
        input,
        action,
        actionServerId,
        triage,
        dependencies,
        actionSemanticCandidate,
      )
        ? "mismatch"
        : "neutral";
    }
    case "protect_score_remote":
      if (
        actionKeepsSideSafeSameTurnScoreCloseoutForAction(
          input,
          action,
          dependencies,
        )
      ) {
        return "match";
      }
      if (
        actionProtectsServer(
          input,
          action,
          actionServerId,
          triage,
          dependencies,
          actionSemanticCandidate,
        )
      ) {
        return "match";
      }
      if (
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        actionServerId === triage.targetServerId &&
        (triage.severity === "high" || triage.severity === "critical")
      ) {
        return "mismatch";
      }
      if (
        action.type === "rez_ice" &&
        actionServerId === triage.targetServerId
      ) {
        return sameTargetRezIsDefinitelyBad(
          input,
          action,
          dependencies,
          actionSemanticCandidate,
        ) ||
          sameTargetRezMissesCriticalCentralStop(
            input,
            action,
            triage,
            dependencies,
            actionSemanticCandidate,
          )
          ? "mismatch"
          : "neutral";
      }
      return actionPushesUnsafeScoreline(input, action, dependencies) ||
        actionIsOffTargetInstall(action, actionServerId, triage) ||
        actionDelaysProtectedScoreRemote(
          input,
          action,
          actionServerId,
          triage,
          dependencies,
          actionSemanticCandidate,
        )
        ? "mismatch"
        : "neutral";
    case "fund_score_remote":
      if (
        actionProvidesEconomy(
          input,
          action,
          dependencies,
          actionSemanticCandidate,
        )
      ) {
        return "match";
      }
      if (action.type === "draw_card" && !legalEconomyActionExists(input)) {
        return "match";
      }
      if (
        triageNeedsFunding(triage) &&
        legalEconomyActionExists(input) &&
        actionIsUnfundedTargetProtectionInstall(
          input,
          action,
          actionServerId,
          triage,
          dependencies,
        )
      ) {
        return "mismatch";
      }
      return actionCreatesPurgeActionDebt(action) ||
        actionPushesUnsafeScoreline(input, action, dependencies) ||
        actionIsOffTargetInstall(action, actionServerId, triage) ||
        actionIsExpensiveNonProtection(action, actionServerId, triage)
        ? "mismatch"
        : "neutral";
    case "protect_hq":
    case "protect_rd":
      if (
        triage.evidence.includes(
          "corp_board_triage_central_override:first_layer_before_speculative_remote",
        ) &&
        actionProvidesEconomy(
          input,
          action,
          dependencies,
          actionSemanticCandidate,
        )
      ) {
        return "match";
      }
      if (
        actionRelievesHqAgendaPressureViaSafeRemote(
          input,
          action,
          actionServerId,
          triage,
          dependencies,
        )
      ) {
        return "match";
      }
      if (
        actionProtectsServer(
          input,
          action,
          actionServerId,
          triage,
          dependencies,
          actionSemanticCandidate,
        )
      ) {
        return "match";
      }
      if (
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        actionServerId === triage.targetServerId &&
        (triage.severity === "high" || triage.severity === "critical")
      ) {
        return "mismatch";
      }
      if (
        action.type === "rez_ice" &&
        actionServerId === triage.targetServerId
      ) {
        return sameTargetRezIsDefinitelyBad(
          input,
          action,
          dependencies,
          actionSemanticCandidate,
        ) ||
          sameTargetRezMissesCriticalCentralStop(
            input,
            action,
            triage,
            dependencies,
            actionSemanticCandidate,
          )
          ? "mismatch"
          : "neutral";
      }
      return actionDistractsFromCentralProtection(
        action,
        actionServerId,
        triage,
      )
        ? "mismatch"
        : "neutral";
    case "recover_economy":
      if (
        actionProvidesEconomy(
          input,
          action,
          dependencies,
          actionSemanticCandidate,
        )
      ) {
        return "match";
      }
      if (action.type === "draw_card" && !legalEconomyActionExists(input)) {
        return "match";
      }
      return action.type === "advance_card" || action.type === "install_card"
        ? "mismatch"
        : "neutral";
    case "setup_score_remote":
      if (
        (action.type === "install_card" &&
          action.payload?.placement !== "ice" &&
          actionServerId === triage.targetServerId &&
          dependencies.corpActionIsScoreLine(
            input,
            action,
            dependencies.rolesForAction(input, action),
          )) ||
        actionBuildsScoreRemote({
          action,
          roles: dependencies.rolesForAction(input, action),
          serverId: actionServerId,
        })
      ) {
        return "match";
      }
      if (
        action.type === "install_card" &&
        actionServerId !== undefined &&
        actionServerId !== triage.targetServerId
      ) {
        return "mismatch";
      }
      return actionServerId === "archives" ? "mismatch" : "neutral";
    case "low_value":
      return "neutral";
  }
}
