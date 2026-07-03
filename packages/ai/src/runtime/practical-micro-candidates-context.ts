import type {
  AiDecision,
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";

import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import type { PracticalMicroCandidate } from "./practical-micro-runtime";
import type { CorpScorelineWindowAssessment } from "./corp-scoreline/semantic-runtime-corp-scoreline-assessment";
import { rolesMatch } from "./role-match";

type KnownPathAssessment = {
  assessedKnownIceCount: number;
  canReachAccess: boolean;
};

type CorpScoreTerminalWindow = {
  terminalWindow: boolean;
  blockedByCheapContest: boolean;
  blockedByCredits: boolean;
  blockedByRunnerContest: boolean;
  blockedByHqThreat: boolean;
  scoreActionIds: string[];
  advanceToScoreActionIds: string[];
  agendaInstallActionIds: string[];
  evidence: string[];
};

export type PracticalMicroCandidatesContextDependencies = {
  visibleSourceCard: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => VisibleCard | undefined;
  isVisibleIcebreakerProgram: (card: VisibleCard) => boolean;
  visibleBreakerCardCanAddressIce: (
    breaker: VisibleCard,
    ice: VisibleCard,
  ) => boolean;
  serverId: (action: LegalAction) => string | undefined;
  knownPathAssessment: (
    server: AiDecisionInput["playerView"]["servers"][number],
    input: AiDecisionInput,
  ) => KnownPathAssessment;
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
  scoreTerminalWindow: (input: AiDecisionInput) => CorpScoreTerminalWindow;
  scorelineWindowAssessment?: (
    input: AiDecisionInput,
  ) => CorpScorelineWindowAssessment;
  actionTypeIsReactive: (type: LegalAction["type"]) => boolean;
  runnerRunTargets: (input: AiDecisionInput) => RunnerRunTargetEvaluation[];
  runnerRunTargetPlausibleForMultiRun: (
    evaluation: RunnerRunTargetEvaluation | undefined,
  ) => boolean;
  runnerRunTargetHighPayoff: (
    evaluation: Pick<RunnerRunTargetEvaluation, "accessPayoff">,
  ) => boolean;
};

export function createPracticalMicroCandidatesContext(
  dependencies: PracticalMicroCandidatesContextDependencies,
): {
  practicalMicroRuntimeCandidates: (
    input: AiDecisionInput,
    runtimeDecision: AiDecision,
  ) => PracticalMicroCandidate[];
} {
  function practicalMicroRuntimeCandidates(
    input: AiDecisionInput,
    runtimeDecision: AiDecision,
  ): PracticalMicroCandidate[] {
    return [
      corpSafeScorelineCandidate(input, runtimeDecision),
      runnerRunPayoffCompletionCandidate(input, runtimeDecision),
      runnerVisibleCoverageInstallCandidate(input, runtimeDecision),
      corpStalePunishDeactivationCandidate(input, runtimeDecision),
    ].filter(
      (candidate): candidate is PracticalMicroCandidate =>
        candidate !== undefined,
    );
  }

  function runtimeSelectedLegalAction(
    input: AiDecisionInput,
    runtimeDecision: AiDecision,
  ): LegalAction | undefined {
    return input.legalActions.find(
      (action) => action.actionId === runtimeDecision.actionId,
    );
  }

  function runnerVisibleCoverageInstallCandidate(
    input: AiDecisionInput,
    runtimeDecision: AiDecision,
  ): PracticalMicroCandidate | undefined {
    if (input.side !== "runner") return undefined;
    if (!runnerHasKnownBlockedPathWithVisibleBreakerAnswer(input))
      return undefined;
    const action = input.legalActions.find((candidate) => {
      if (candidate.type !== "install_card") return false;
      const sourceCard = dependencies.visibleSourceCard(input, candidate);
      if (!sourceCard || !dependencies.isVisibleIcebreakerProgram(sourceCard))
        return false;
      const alreadyInstalledSameBreaker = (
        input.playerView.own.rig ?? []
      ).some(
        (card) =>
          card.known &&
          card.definitionId !== undefined &&
          card.definitionId === sourceCard.definitionId,
      );
      return !alreadyInstalledSameBreaker;
    });
    if (!action) return undefined;
    return {
      ruleId: "runner_visible_coverage_install",
      actionId: action.actionId,
      actionType: action.type,
      reasonCode: "practical_micro.runner_visible_coverage_install",
      explanation:
        "Der Runner installiert sichtbare Breaker-Abdeckung, bevor ein bekannter blockierter Pfad wiederholt wird.",
      evidence: [
        "practical_micro_runner_visible_coverage_install:true",
        `practical_micro_runtime_reference:${runtimeDecision.actionId}`,
        `install_action:${action.actionId}`,
      ],
    };
  }

  function runnerHasKnownBlockedPathWithVisibleBreakerAnswer(
    input: AiDecisionInput,
  ): boolean {
    const visibleBreakerInstalls = input.legalActions.filter((action) => {
      if (action.type !== "install_card") return false;
      const sourceCard = dependencies.visibleSourceCard(input, action);
      return (
        sourceCard !== undefined &&
        dependencies.isVisibleIcebreakerProgram(sourceCard)
      );
    });
    if (visibleBreakerInstalls.length === 0) return false;
    for (const runAction of input.legalActions) {
      if (runAction.type !== "start_run") continue;
      const serverId = dependencies.serverId(runAction);
      const server = input.playerView.servers.find(
        (entry) => entry.id === serverId,
      );
      if (!server) continue;
      const assessment = dependencies.knownPathAssessment(server, input);
      if (assessment.assessedKnownIceCount <= 0 || assessment.canReachAccess)
        continue;
      if (
        visibleBreakerInstalls.some((installAction) => {
          const sourceCard = dependencies.visibleSourceCard(
            input,
            installAction,
          );
          return (
            sourceCard !== undefined &&
            server.ice.some(
              (ice) =>
                ice.known &&
                ice.rezzed === true &&
                dependencies.visibleBreakerCardCanAddressIce(sourceCard, ice),
            )
          );
        })
      ) {
        return true;
      }
    }
    return false;
  }

  function corpStalePunishDeactivationCandidate(
    input: AiDecisionInput,
    runtimeDecision: AiDecision,
  ): PracticalMicroCandidate | undefined {
    if (input.side !== "corp") return undefined;
    const runtimeAction = runtimeSelectedLegalAction(input, runtimeDecision);
    if (
      !runtimeAction ||
      !corpActionLooksLikeStalePunish(input, runtimeAction)
    )
      return undefined;
    const action = input.legalActions.find((candidate) => {
      if (candidate.actionId === runtimeAction.actionId) return false;
      if (corpActionLooksLikeStalePunish(input, candidate)) return false;
      return (
        candidate.type === "score_agenda" ||
        candidate.type === "advance_card" ||
        candidate.type === "rez_ice" ||
        (candidate.type === "install_card" &&
          candidate.payload?.placement === "ice")
      );
    });
    if (!action) return undefined;
    return {
      ruleId: "corp_stale_punish_deactivation",
      actionId: action.actionId,
      actionType: action.type,
      reasonCode: "practical_micro.corp_stale_punish_deactivation",
      explanation:
        "Die Corp nimmt eine sichtbare Board- oder Scoreline-Aktion statt eines stale Punish ohne frische Bedingung.",
      evidence: [
        "practical_micro_corp_stale_punish_deactivation:true",
        `stale_punish_action:${runtimeAction.actionId}`,
        `replacement_action:${action.actionId}`,
      ],
    };
  }

  function corpActionLooksLikeStalePunish(
    input: AiDecisionInput,
    action: LegalAction,
  ): boolean {
    if (input.playerView.opponent.tags > 0) return false;
    const roles = dependencies.rolesForAction(input, action);
    return (
      action.payload?.tagPunishAction === true ||
      action.payload?.damagePunishAction === true ||
      rolesMatch(roles, ["punish", "tag_punish", "damage_punish"])
    );
  }

  function corpSafeScorelineCandidate(
    input: AiDecisionInput,
    runtimeDecision: AiDecision,
  ): PracticalMicroCandidate | undefined {
    if (input.side !== "corp") return undefined;
    const scoreline = dependencies.scorelineWindowAssessment?.(input);
    if (scoreline) {
      return corpSafeScorelineCandidateFromAssessment(input, scoreline);
    }
    const terminal = dependencies.scoreTerminalWindow(input);
    if (!terminal.terminalWindow) return undefined;
    if (
      terminal.blockedByCheapContest ||
      terminal.blockedByCredits ||
      terminal.blockedByRunnerContest ||
      terminal.blockedByHqThreat
    )
      return undefined;
    const actionId =
      terminal.scoreActionIds[0] ??
      terminal.advanceToScoreActionIds[0] ??
      terminal.agendaInstallActionIds[0];
    const action = input.legalActions.find(
      (candidate) => candidate.actionId === actionId,
    );
    if (!action) return undefined;
    return {
      ruleId: "corp_safe_scoreline",
      actionId: action.actionId,
      actionType: action.type,
      reasonCode: "practical_micro.corp_safe_scoreline",
      explanation:
        "Die Corp vollzieht eine sichere Scoreline, statt das geöffnete Score-Fenster zu vertagen.",
      evidence: [
        "practical_micro_corp_safe_scoreline:true",
        ...terminal.evidence.slice(0, 8),
        `scoreline_action:${action.actionId}`,
      ],
    };
  }

  function corpSafeScorelineCandidateFromAssessment(
    input: AiDecisionInput,
    scoreline: CorpScorelineWindowAssessment,
  ): PracticalMicroCandidate | undefined {
    const path =
      scoreline.bestPath && !scoreline.bestPath.blocked
        ? scoreline.bestPath
        : undefined;
    if (
      !path ||
      (path.recommendedNextStep !== "score_now" &&
        path.recommendedNextStep !== "advance_agenda" &&
        path.recommendedNextStep !== "install_agenda")
    ) {
      return undefined;
    }
    const action = input.legalActions.find(
      (candidate) => candidate.actionId === path.actionId,
    );
    if (!action) return undefined;
    return {
      ruleId: "corp_safe_scoreline",
      actionId: action.actionId,
      actionType: action.type,
      reasonCode: "practical_micro.corp_safe_scoreline",
      explanation:
        "Die Corp vollzieht eine sichere Scoreline, statt das geöffnete Score-Fenster zu vertagen.",
      evidence: [
        "practical_micro_corp_safe_scoreline:true",
        ...scoreline.evidence.slice(0, 8),
        ...path.evidence.slice(0, 8),
        `scoreline_action:${action.actionId}`,
      ],
    };
  }

  function runnerRunPayoffCompletionCandidate(
    input: AiDecisionInput,
    runtimeDecision: AiDecision,
  ): PracticalMicroCandidate | undefined {
    if (input.side !== "runner") return undefined;
    const runtimeAction = runtimeSelectedLegalAction(input, runtimeDecision);
    if (
      runtimeAction === undefined ||
      dependencies.actionTypeIsReactive(runtimeAction.type)
    )
      return undefined;
    const evaluation = dependencies
      .runnerRunTargets(input)
      .find(
        (candidate) =>
          dependencies.runnerRunTargetPlausibleForMultiRun(candidate) &&
          dependencies.runnerRunTargetHighPayoff(candidate),
      );
    if (!evaluation) return undefined;
    const action = input.legalActions.find(
      (candidate) => candidate.actionId === evaluation.actionId,
    );
    if (!action) return undefined;
    return {
      ruleId: "runner_run_payoff_completion",
      actionId: action.actionId,
      actionType: action.type,
      reasonCode: "practical_micro.runner_run_payoff_completion",
      explanation:
        "Der Runner nutzt ein erreichbares Run-Payoff-Fenster, statt nach fertiger Vorbereitung weiter zu driften.",
      evidence: [
        "practical_micro_runner_run_payoff_completion:true",
        `target:${evaluation.targetServerId}`,
        `access_payoff:${evaluation.accessPayoff}`,
        `recommendation:${evaluation.recommendation}`,
        `credits_after_run:${evaluation.creditsAfterRun}`,
      ],
    };
  }

  return { practicalMicroRuntimeCandidates };
}
