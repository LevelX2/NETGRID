import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import type {
  CorpBoardTriage,
  CorpBoardTriageDependencies,
  ScoredLegalAction,
} from "./corp-scoreline/semantic-runtime-corp-board-triage-contracts";
import {
  actionBuildsScoreRemote,
  corpLegalActions,
  corpRemoteScoringStrategyWantsRemoteDevelopment,
  corpTriageVisibleAgendaPoints,
  inputWithOpponentDefaults,
  legalEconomyActionExists,
  normalizedCorpBoardTriageValue,
} from "./corp-scoreline/semantic-runtime-corp-board-triage-actions";
import { semanticRuntimeVisibleSourceCard } from "./visible-card-lookup";
import {
  actionClosesScoreNow,
  actionKeepsSideSafeSameTurnScoreCloseout,
  centralPressureMustInterruptActiveScoreline,
  centralPressureShouldDriveTriage,
  centralPressureTriage,
  centralDefenseAcquisitionActionExists,
  centralServerNeedsProtection,
  centralTriageSeverity,
  concreteCentralProtectionActionExists,
  corpActiveScorelineClockPressure,
  corpForcedScorelineClockPressure,
  corpRemoteScoringStrategyEvidence,
  corpTriageIsPunishPrimary,
  fundableCentralProtectionFloor,
  highestPriorityScoreRemoteEntry,
  highestPriorityTriageCentralPressure,
  preScoreCentralProtectionTriage,
  scoredLegalAction,
  scoreNowCentralProtectionInterruptTriage,
  scoreRemoteNeedsFunding,
  scoreRemoteNeedsProtection,
  scoreRemoteRequiredRezFloor,
  triageSeverityFromScoringWindow,
} from "./corp-scoreline/semantic-runtime-corp-board-triage-policies";
import { semanticRuntimeCorpBoardTriageActionComponentForTriage } from "./corp-scoreline/semantic-runtime-corp-board-triage-alignment";
import {
  corpScorelineAllowsMultiTurnDevelopment,
  corpScorelineFeasibilityForDecisionInput,
} from "./corp-scoreline-feasibility";
import { decisionDerivedValue } from "./decision-derived-cache";

export type {
  CorpBoardTriage,
  CorpBoardTriageDependencies,
  CorpBoardTriagePrimary,
  CorpBoardTriageSeverity,
} from "./corp-scoreline/semantic-runtime-corp-board-triage-contracts";

export { normalizedCorpBoardTriageValue } from "./corp-scoreline/semantic-runtime-corp-board-triage-actions";

const CORP_BOARD_TRIAGE_DECISION_CACHE_KEY = Symbol("corp-board-triage");
type CorpBoardTriageDecisionCache = WeakMap<object, CorpBoardTriage>;

export function semanticRuntimeCorpBoardTriage<TConsumer extends string>(
  input: AiDecisionInput,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): CorpBoardTriage {
  const cache = decisionDerivedValue<CorpBoardTriageDecisionCache>(
    input,
    CORP_BOARD_TRIAGE_DECISION_CACHE_KEY,
    () => new WeakMap(),
  );
  const cached = cache.get(dependencies);
  if (cached) return cached;
  const triage = buildSemanticRuntimeCorpBoardTriage(input, dependencies);
  cache.set(dependencies, triage);
  return triage;
}

function buildSemanticRuntimeCorpBoardTriage<TConsumer extends string>(
  input: AiDecisionInput,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): CorpBoardTriage {
  const actions = corpLegalActions(input).map((action) =>
    scoredLegalAction(input, action, dependencies),
  );
  const currentCredits = input.playerView.own.credits;
  const scorelineFeasibility = corpScorelineFeasibilityForDecisionInput(input);
  const scorelineDevelopmentAllowed =
    corpScorelineAllowsMultiTurnDevelopment(scorelineFeasibility);

  const scoreNow = actions
    .filter(
      (entry) =>
      actionClosesScoreNow(input, entry.action, dependencies) ||
      actionKeepsSideSafeSameTurnScoreCloseout(input, entry, dependencies),
    )
    .sort(
      (left, right) =>
        corpScoreNowAgendaPoints(input, right.action) -
          corpScoreNowAgendaPoints(input, left.action) ||
        left.action.actionId.localeCompare(right.action.actionId),
    )[0];
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

  const preScoreCentralProtection = scorelineDevelopmentAllowed
    ? preScoreCentralProtectionTriage(
        input,
        actions,
        currentCredits,
        dependencies,
      )
    : undefined;
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
    (concreteCentralProtectionActionExists(
      input,
      actions,
      "rd",
      dependencies,
    ) ||
      (legalEconomyActionExists(input) &&
        fundableCentralProtectionFloor(input, actions, "rd", dependencies) !==
          undefined))
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

  const remoteFunding = scorelineDevelopmentAllowed
    ? highestPriorityScoreRemoteEntry(
        actions.filter((entry) =>
          scoreRemoteNeedsFunding(input, entry, actions, dependencies),
        ),
      )
    : undefined;
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

  const remoteProtection = scorelineDevelopmentAllowed
    ? highestPriorityScoreRemoteEntry(
        actions.filter((entry) =>
          scoreRemoteNeedsProtection(input, entry, dependencies),
        ),
      )
    : undefined;
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
    const needsDefenseAcquisition =
      centralPressure.serverId === "rd" &&
      centralServerNeedsProtection(input, "rd") &&
      !dependencies.corpHasCentralRezFloorFundingNeed(input) &&
      centralPressure.recentSuccessfulAccessEvents >= 2 &&
      !concreteCentralProtectionActionExists(
        input,
        actions,
        "rd",
        dependencies,
      ) &&
      centralDefenseAcquisitionActionExists(input, actions);
    return centralPressureTriage(
      centralPressure,
      centralPressureSeverity,
      currentCredits,
      needsDefenseAcquisition
        ? [
            "corp_board_triage_central_defense_acquisition:true",
            "corp_board_triage_repeated_central_access:true",
          ]
        : [],
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
    scorelineDevelopmentAllowed &&
    (!corpTriageIsPunishPrimary(input) ||
      corpRemoteScoringStrategyWantsRemoteDevelopment(input))
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
    evidence: [
      "corp_board_triage_primary:low_value",
      ...(scorelineFeasibility && !scorelineDevelopmentAllowed
        ? [
            ...scorelineFeasibility.evidence,
            "corp_board_triage_scoreline_development:false",
          ]
        : []),
    ],
  };
}

function corpScoreNowAgendaPoints(
  input: AiDecisionInput,
  action: LegalAction,
): number {
  const source = semanticRuntimeVisibleSourceCard(input, action);
  return source ? corpTriageVisibleAgendaPoints(source) : 0;
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
  return semanticRuntimeCorpBoardTriageActionComponentForTriage(
    input,
    action,
    dependencies,
    actionSemanticCandidate,
    semanticRuntimeCorpBoardTriage(input, dependencies),
  );
}
