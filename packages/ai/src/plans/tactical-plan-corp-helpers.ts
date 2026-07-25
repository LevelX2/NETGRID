import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { actionHasImmediateCreditGain } from "../actions/action-effect-classification";
import type { TacticalGoalLike } from "../decision/semantic-decision-frame";
import { visibleCorpRootProvidesRemoteProtection } from "../runtime/semantic-runtime-corp-remote-reachability";
import { corpScoringWindowHasFundedPreScoreProtection } from "../runtime/corp-scoreline/semantic-runtime-corp-scoring-window-contracts";
import {
  advanceCanCloseScoreThisTurn,
  advanceCompletesScore,
  corpRemoteContestabilityAssessment,
  remoteIsProtected,
} from "./tactical-plan-corp-score-window";
import { createPlanStep } from "./tactical-plan-builders";
import { actionServerId, isRemoteServer } from "./tactical-plan-server-targets";
import { serverHasUnrezzedIce } from "./tactical-plan-run-reachability";
import { visibleCardByInstanceId } from "./tactical-plan-visible-cards";
import type {
  PlanBlocker,
  PlanStep,
  TacticalPlanBuildContext,
} from "./tactical-plan-types";
import {
  candidateRequiresSuccessfulTrace,
  traceActionLeavesImmediatePunishWindow,
  traceTagExpectedSuccessEstimate,
} from "../runtime/trace-tag-success-estimate";

const CORP_PUNISH_EXACT_SIGNALS = new Set([
  "tag.source",
  "trace.source",
  "tag.payoff",
  "damage.payoff",
  "trash_runner_resource",
  "net_damage",
  "meat_damage",
]);

export function corpImmediateCreditActionIds(
  input?: Pick<AiDecisionInput, "legalActions">,
): string[] {
  return (
    input?.legalActions
      .filter(actionHasImmediateCreditGain)
      .map((action) => action.actionId) ?? []
  );
}

export function corpPunishCandidates(
  context: TacticalPlanBuildContext,
  punishGoal: TacticalGoalLike | undefined,
): ActionSemanticCandidate[] {
  if (!punishGoal) return [];
  return (context.candidates ?? []).filter((candidate) => {
    if (candidate.actorSide !== "corp") return false;
    if (candidate.actionType === "install_card") {
      const action = context.input?.legalActions.find(
        (legalAction) => legalAction.actionId === candidate.actionId,
      );
      // Installing damage-labelled ICE is setup, not an immediate punish
      // payoff. Explicit non-ICE root setup may still be the concrete first
      // step of a punish plan.
      if (!action || action.payload?.placement === "ice") return false;
    }
    if (
      candidate.primaryProjectionStatus === "blocked" ||
      candidate.primaryProjectionStatus === "hidden_info_blocked"
    ) {
      return false;
    }
    if (
      candidateRequiresSuccessfulTrace(candidate) &&
      (traceTagExpectedSuccessEstimate(context.input) === 0 ||
        !traceActionLeavesImmediatePunishWindow(context.input, candidate))
    ) {
      return false;
    }
    if (
      candidate.sourceDefinitionId === "onr_v1_285_closed-accounts" &&
      context.input.playerView.opponent.credits <= 0
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
  const target = serverId
    ? { kind: "server" as const, id: serverId }
    : undefined;
  const scorelinePath = scorelineAssessment?.paths.find(
    (path) => path.actionId === action.actionId,
  );
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
      ? corpRemoteContestabilityAssessment(input, serverId)
      : undefined;
  const fundedPreScoreProtection = corpScoringWindowHasFundedPreScoreProtection(
    scorelinePath?.scoringWindow,
  );
  if (
    serverId &&
    remoteContestability?.contestable === true &&
    !fundedPreScoreProtection &&
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
  const sourceScorelineProtectionBlockers = scorelinePath?.blockers.filter(
    (blocker) =>
      blocker === "unsafe_remote" ||
      blocker === "runner_contest" ||
      blocker === "cheap_contest",
  );
  if (
    serverId &&
    isRemoteServer(serverId) &&
    sourceScorelineProtectionBlockers &&
    sourceScorelineProtectionBlockers.length > 0 &&
    !fundedPreScoreProtection &&
    !advanceCompletesScore(input.playerView, action) &&
    !blockers.some((blocker) => blocker.kind === "score_window_contestable")
  ) {
    blockers.push({
      blockerId: `score_window_contestable:${serverId}`,
      kind: "score_window_contestable",
      severity: "hard",
      ...(target ? { target } : {}),
      removalStepKind: "protect_remote",
      evidence: [
        `server:${serverId}`,
        "scoreline_source_safety_gate:true",
        ...sourceScorelineProtectionBlockers.map(
          (blocker) => `scoreline_source_blocker:${blocker}`,
        ),
        ...(scorelinePath?.evidence ?? []),
      ],
    });
  }
  const scorelineNeedsFunding =
    scorelineAssessment?.recommendedNextStep === "fund_scoreline" &&
    (scorelinePath?.recommendedNextStep === "fund_scoreline" ||
      scorelinePath?.blockers.includes("credits") === true ||
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
        ...(scorelinePath?.evidence ?? []),
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
  input?: AiDecisionInput,
): PlanStep {
  if (
    blockers.some(
      (blocker) =>
        blocker.kind === "score_window_unprotected" ||
        blocker.kind === "score_window_contestable",
    )
  ) {
    const targetServerId = blockers.find(
      (blocker) =>
        blocker.kind === "score_window_unprotected" ||
        blocker.kind === "score_window_contestable",
    )?.target?.id;
    const protectionPath = input
      ? corpRemoteProtectionPath(input, targetServerId)
      : emptyCorpRemoteProtectionPath();
    if (protectionPath.immediateActionIds.length === 0) {
      return createPlanStep({
        stepId: `find_remote_protection:${action.actionId}`,
        kind: "find_remote_protection",
        desiredActionSemantics: ["draw.card", "search.deck"],
        actionCandidateIds: protectionPath.acquisitionActionIds,
        requiredCapabilities: [
          {
            capabilityId: `remote_protection:${action.actionId}`,
            kind: "remote_protection",
            side: "corp",
            evidence: [
              "no_effective_remote_protection_in_hq",
              ...protectionPath.evidence,
            ],
          },
          {
            capabilityId: `remote_protection_draw:${action.actionId}`,
            kind: "card_draw",
            side: "corp",
            evidence: ["find_effective_remote_protection"],
          },
        ],
        rationale: [
          "find protection that the visible Runner rig cannot nullify",
        ],
      });
    }
    return createPlanStep({
      stepId: `protect_remote:${action.actionId}`,
      kind: "protect_remote",
      desiredActionSemantics: ["install.card", "corp_window.rez"],
      actionCandidateIds: protectionPath.immediateActionIds,
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
      actionCandidateIds: corpImmediateCreditActionIds(input),
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
    actionCandidateIds: [action.actionId],
    rationale: ["advance action progresses a visible score window"],
  });
}

export type CorpRemoteProtectionPath = {
  immediateActionIds: string[];
  acquisitionActionIds: string[];
  evidence: string[];
};

function emptyCorpRemoteProtectionPath(): CorpRemoteProtectionPath {
  return {
    immediateActionIds: [],
    acquisitionActionIds: [],
    evidence: [],
  };
}

export function corpRemoteProtectionPath(
  input: AiDecisionInput,
  serverId: string | undefined,
): CorpRemoteProtectionPath {
  if (!serverId) return emptyCorpRemoteProtectionPath();
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  const immediateActionIds: string[] = [];
  const evidence: string[] = [];

  for (const action of input.legalActions.filter(
    (candidate) =>
      candidate.side === "corp" && actionServerId(candidate) === serverId,
  )) {
    const source = visibleCardByInstanceId(
      input.playerView,
      String(action.source),
    );
    if (
      action.type === "install_card" &&
      action.payload?.placement === "ice" &&
      source?.type === "ice"
    ) {
      evidence.push(
        `ice_allocation_delegated_to_corp_defend_servers:${serverId}`,
      );
      continue;
    }
    if (action.type === "rez_ice" && source?.type === "ice") {
      immediateActionIds.push(action.actionId);
      continue;
    }
    if (
      action.type === "install_card" &&
      action.payload?.placement !== "ice" &&
      source !== undefined &&
      visibleCorpRootProvidesRemoteProtection(source, {
        zone: "root",
        state: "after_install",
        ...(server ? { server } : {}),
        serverId,
        runnerTags: input.playerView.opponent.tags,
      })
    ) {
      immediateActionIds.push(action.actionId);
      continue;
    }
    if (
      action.type === "rez_card" &&
      source !== undefined &&
      visibleCorpRootProvidesRemoteProtection(source, {
        zone: "root",
        state: "after_rez",
        ...(server ? { server } : {}),
        serverId,
        runnerTags: input.playerView.opponent.tags,
      })
    ) {
      immediateActionIds.push(action.actionId);
    }
  }

  return {
    immediateActionIds,
    acquisitionActionIds: input.legalActions
      .filter((action) => action.side === "corp" && action.type === "draw_card")
      .map((action) => action.actionId),
    evidence,
  };
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
