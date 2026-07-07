import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import type { TacticalGoalLike } from "../decision/semantic-decision-frame";
import {
  advanceCanCloseScoreThisTurn,
  advanceCompletesScore,
  corpRemoteContestabilityAssessment,
  remoteIsProtected,
} from "./tactical-plan-corp-score-window";
import { createPlanStep } from "./tactical-plan-builders";
import { isRemoteServer } from "./tactical-plan-server-targets";
import { serverHasUnrezzedIce } from "./tactical-plan-run-reachability";
import type {
  PlanBlocker,
  PlanStep,
  TacticalPlanBuildContext,
} from "./tactical-plan-types";

const CORP_PUNISH_EXACT_SIGNALS = new Set([
  "tag.source",
  "trace.source",
  "tag.payoff",
  "damage.payoff",
  "trash_runner_resource",
  "net_damage",
  "meat_damage",
]);

export function corpPunishCandidates(
  context: TacticalPlanBuildContext,
  punishGoal: TacticalGoalLike | undefined,
): ActionSemanticCandidate[] {
  if (!punishGoal) return [];
  return (context.candidates ?? []).filter((candidate) => {
    if (candidate.actorSide !== "corp") return false;
    if (
      candidate.primaryProjectionStatus === "blocked" ||
      candidate.primaryProjectionStatus === "hidden_info_blocked"
    ) {
      return false;
    }
    return candidatePunishSignals(candidate).some(signalMatchesCorpPunish);
  });
}

function candidatePunishSignals(candidate: ActionSemanticCandidate): string[] {
  return [
    candidate.semanticActionType,
    candidate.sourceCardId,
    candidate.abilityId,
    ...candidate.cardContextSignals,
    ...candidate.actionTacticSignals,
    ...candidate.conditions.map((entry) => entry.kind),
    ...candidate.risks.map((entry) => entry.kind),
    ...candidate.constraints.map((entry) => entry.kind),
    ...candidate.costProfile.additionalCosts,
    ...(candidate.targetContext?.targetProfileMatches.flatMap(
      (entry) => entry.evidence,
    ) ?? []),
  ]
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.toLocaleLowerCase("en-US"));
}

function signalMatchesCorpPunish(signal: string): boolean {
  return (
    CORP_PUNISH_EXACT_SIGNALS.has(signal) ||
    signalHasTerm(signal, "punish") ||
    signalHasTerm(signal, "flatline")
  );
}

function signalHasTerm(signal: string, term: string): boolean {
  return signal
    .split(/[.:-]+/)
    .some((segment) => signalSegmentHasTerm(segment, term));
}

function signalSegmentHasTerm(segment: string, term: string): boolean {
  if (segment === term) return true;
  const termSet = new Set(segment.split("_").filter(Boolean));
  return termSet.has(term);
}

export function corpScoreWindowBlockers(
  input: AiDecisionInput,
  serverId: string | undefined,
  action: LegalAction,
  scorelineAssessment?: TacticalPlanBuildContext["corpScorelineWindowAssessment"],
): PlanBlocker[] {
  const blockers: PlanBlocker[] = [];
  const target = serverId ? { kind: "server" as const, id: serverId } : undefined;
  if (
    serverId &&
    isRemoteServer(serverId) &&
    !remoteIsProtected(input.playerView, serverId) &&
    !advanceCompletesScore(input.playerView, action)
  ) {
    blockers.push({
      blockerId: `score_window_unprotected:${serverId}`,
      kind: "score_window_unprotected",
      severity: "hard",
      ...(target ? { target } : {}),
      removalStepKind: "protect_remote",
      evidence: [`server:${serverId}`, "remote_protection:false"],
    });
  }
  const remoteContestability =
    serverId && isRemoteServer(serverId)
      ? corpRemoteContestabilityAssessment(input.playerView, serverId)
      : undefined;
  if (
    serverId &&
    remoteContestability?.contestable === true &&
    !advanceCompletesScore(input.playerView, action)
  ) {
    blockers.push({
      blockerId: `score_window_contestable:${serverId}`,
      kind: "score_window_contestable",
      severity: "hard",
      ...(target ? { target } : {}),
      removalStepKind: "protect_remote",
      evidence: [`server:${serverId}`, ...remoteContestability.evidence],
    });
  }
  const scorelineFundingPath = scorelineAssessment?.paths.find(
    (path) => path.actionId === action.actionId,
  );
  const scorelineNeedsFunding =
    scorelineAssessment?.recommendedNextStep === "fund_scoreline" &&
    (scorelineFundingPath?.recommendedNextStep === "fund_scoreline" ||
      scorelineFundingPath?.blockers.includes("credits") === true ||
      scorelineAssessment.blockedByCredits === true);
  if (
    serverId &&
    isRemoteServer(serverId) &&
    scorelineNeedsFunding &&
    !advanceCompletesScore(input.playerView, action) &&
    !advanceCanCloseScoreThisTurn(input.playerView, action)
  ) {
    blockers.push({
      blockerId: `missing_rez_reserve:${serverId}`,
      kind: "missing_rez_reserve",
      severity: "soft",
      ...(target ? { target } : {}),
      removalStepKind: "build_rez_reserve",
      evidence: [
        `server:${serverId}`,
        `corp_credits:${input.playerView.own.credits}`,
        "corp_scoreline_recommended_next_step:fund_scoreline",
        "scoreline_funding_path_blocks_advance:true",
        ...(scorelineFundingPath?.evidence ?? []),
      ],
    });
  }
  if (
    serverId &&
    remoteIsProtected(input.playerView, serverId) &&
    serverHasUnrezzedIce(input.playerView, serverId) &&
    input.playerView.own.credits < 4 &&
    !blockers.some((blocker) => blocker.kind === "missing_rez_reserve")
  ) {
    blockers.push({
      blockerId: `missing_rez_reserve:${serverId}`,
      kind: "missing_rez_reserve",
      severity: "soft",
      ...(target ? { target } : {}),
      removalStepKind: "build_rez_reserve",
      evidence: [
        `server:${serverId}`,
        `corp_credits:${input.playerView.own.credits}`,
        "rez_reserve_below_pragmatic_floor:4",
      ],
    });
  }
  return blockers;
}

export function corpScoreWindowCurrentStep(
  action: LegalAction,
  blockers: readonly PlanBlocker[],
): PlanStep {
  if (
    blockers.some(
      (blocker) =>
        blocker.kind === "score_window_unprotected" ||
        blocker.kind === "score_window_contestable",
    )
  ) {
    return createPlanStep({
      stepId: `protect_remote:${action.actionId}`,
      kind: "protect_remote",
      desiredActionSemantics: ["install.card", "corp_window.rez"],
      requiredCapabilities: [
        {
          capabilityId: `remote_protection:${action.actionId}`,
          kind: "remote_protection",
          side: "corp",
          evidence: blockers.some(
            (blocker) => blocker.kind === "score_window_contestable",
          )
            ? ["score_window_contestable"]
            : ["score_window_unprotected"],
        },
      ],
      rationale: ["score window must be protected before advancing safely"],
    });
  }
  if (blockers.some((blocker) => blocker.kind === "missing_rez_reserve")) {
    return createPlanStep({
      stepId: `build_rez_reserve:${action.actionId}`,
      kind: "build_rez_reserve",
      desiredActionSemantics: ["economy.gain_credit", "card_ability.trigger"],
      requiredCapabilities: [
        {
          capabilityId: `rez_reserve:${action.actionId}`,
          kind: "rez_reserve",
          side: "corp",
          evidence: ["missing_rez_reserve"],
        },
      ],
      rationale: ["score window needs a small rez reserve before advancing"],
    });
  }
  return createPlanStep({
    stepId: `advance_score_card:${action.actionId}`,
    kind: "advance_score_card",
    desiredActionSemantics: ["score.advance_card"],
    rationale: ["advance action progresses a visible score window"],
  });
}

export function corpScoreWindowSequence(actionId: string): PlanStep[] {
  return [
    createPlanStep({
      stepId: `build_remote:${actionId}`,
      kind: "build_remote",
      desiredActionSemantics: ["install.card"],
      rationale: ["build or reuse a scoring remote"],
    }),
    createPlanStep({
      stepId: `protect_remote:${actionId}`,
      kind: "protect_remote",
      desiredActionSemantics: ["install.card", "corp_window.rez"],
      requiredCapabilities: [
        {
          capabilityId: `remote_protection:${actionId}`,
          kind: "remote_protection",
          side: "corp",
          evidence: ["score_window_sequence"],
        },
      ],
      rationale: ["protect the scoring remote"],
    }),
    createPlanStep({
      stepId: `build_rez_reserve:${actionId}`,
      kind: "build_rez_reserve",
      desiredActionSemantics: ["economy.gain_credit", "card_ability.trigger"],
      requiredCapabilities: [
        {
          capabilityId: `rez_reserve:${actionId}`,
          kind: "rez_reserve",
          side: "corp",
          evidence: ["score_window_sequence"],
        },
      ],
      rationale: ["hold credits for a relevant rez window"],
    }),
    createPlanStep({
      stepId: `install_or_prepare_agenda:${actionId}`,
      kind: "install_or_prepare_agenda",
      desiredActionSemantics: ["install.card"],
      rationale: ["prepare an agenda or scoreable card"],
    }),
    createPlanStep({
      stepId: `advance_score_card:${actionId}`,
      kind: "advance_score_card",
      desiredActionSemantics: ["score.advance_card"],
      rationale: ["advance the score card"],
    }),
    createPlanStep({
      stepId: `score_agenda:${actionId}`,
      kind: "score_agenda",
      desiredActionSemantics: ["score.agenda"],
      rationale: ["score when the agenda is ready"],
    }),
  ];
}
