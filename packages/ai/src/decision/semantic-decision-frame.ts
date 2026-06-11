import type { AiDecisionInput, Side } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import type { DeckCapabilityProfile } from "../deck-capabilities";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../runner-run-target-evaluation";
import type { RunnerTacticalGoal } from "../runner-tactical-goals";
import type { TacticalPlanRuntimeResult } from "../plans/tactical-plan-types";

export const SEMANTIC_DECISION_FRAME_SCHEMA_VERSION =
  "semantic-decision-frame-v1" as const;

export type TacticalGoalLike = RunnerTacticalGoal | {
  goalId: string;
  family: string;
  priority: number;
  urgency?: string;
  source?: string;
  evidence?: readonly string[];
};

export type SemanticDecisionEconomyContext = {
  availableCredits?: number;
  clicksRemaining?: number;
  creditPressure?: "low" | "medium" | "high";
  evidence: string[];
};

export type SemanticDecisionFrame = {
  schemaVersion: typeof SEMANTIC_DECISION_FRAME_SCHEMA_VERSION;
  side: Side;
  stateVersion: number;
  profileId?: string;
  legalActionIds: string[];
  actionCandidates: ActionSemanticCandidate[];
  tacticalGoals: TacticalGoalLike[];
  tacticalPlan?: TacticalPlanRuntimeResult;
  deckCapabilities?: DeckCapabilityProfile;
  beliefSummary?: unknown;
  economyContext?: SemanticDecisionEconomyContext;
  runner?: {
    runTargets?: RunnerRunTargetEvaluation[];
    economyPosture?: RunnerEconomyPosture;
  };
  evidence: string[];
  hiddenInfoPolicy: "player_view_only";
};

export type BuildSemanticDecisionFrameParams = {
  input: AiDecisionInput;
  actionCandidates?: readonly ActionSemanticCandidate[];
  tacticalGoals?: readonly TacticalGoalLike[];
  tacticalPlan?: TacticalPlanRuntimeResult;
  deckCapabilities?: DeckCapabilityProfile;
  beliefSummary?: unknown;
  runner?: {
    runTargets?: readonly RunnerRunTargetEvaluation[];
    economyPosture?: RunnerEconomyPosture;
  };
  evidence?: readonly string[];
};

const FORBIDDEN_FRAME_KEYS = new Set([
  "cardInstances",
  "privatePayload",
  "sessionToken",
  "reconnectToken",
  "joinToken",
  "tokenHash",
  "fullGameState",
]);

export function buildSemanticDecisionFrame(
  params: BuildSemanticDecisionFrameParams,
): SemanticDecisionFrame {
  const legalActionIds = params.input.legalActions.map((action) => action.actionId);
  const legalActionIdSet = new Set(legalActionIds);
  const invalidCandidateIds = (params.actionCandidates ?? [])
    .filter((candidate) => !legalActionIdSet.has(candidate.actionId))
    .map((candidate) => candidate.actionId)
    .sort();
  if (invalidCandidateIds.length > 0) {
    throw new Error(
      `SemanticDecisionFrame received non-legal action candidates: ${invalidCandidateIds.join(", ")}`,
    );
  }
  const candidatesByActionId = new Map(
    (params.actionCandidates ?? []).map((candidate) => [
      candidate.actionId,
      candidate,
    ]),
  );
  const actionCandidates = legalActionIds
    .map((actionId) => candidatesByActionId.get(actionId))
    .filter((candidate): candidate is ActionSemanticCandidate => Boolean(candidate));
  const economyContext = buildEconomyContext(params);

  const frame: SemanticDecisionFrame = {
    schemaVersion: SEMANTIC_DECISION_FRAME_SCHEMA_VERSION,
    side: params.input.side,
    stateVersion: params.input.playerView.stateVersion,
    profileId: params.input.profileId,
    legalActionIds,
    actionCandidates,
    tacticalGoals: [...(params.tacticalGoals ?? [])],
    ...(params.tacticalPlan ? { tacticalPlan: params.tacticalPlan } : {}),
    ...(params.deckCapabilities
      ? { deckCapabilities: params.deckCapabilities }
      : {}),
    ...(params.beliefSummary !== undefined
      ? { beliefSummary: params.beliefSummary }
      : {}),
    economyContext,
    ...(params.runner
      ? {
          runner: {
            ...(params.runner.runTargets
              ? { runTargets: [...params.runner.runTargets] }
              : {}),
            ...(params.runner.economyPosture
              ? { economyPosture: params.runner.economyPosture }
              : {}),
          },
        }
      : {}),
    evidence: [
      "semantic_decision_frame:player_view_only",
      `legal_action_count:${legalActionIds.length}`,
      `action_candidate_count:${actionCandidates.length}`,
      ...(params.evidence ?? []),
    ],
    hiddenInfoPolicy: "player_view_only",
  };
  assertSemanticDecisionFrameIsSideSafe(frame);
  return frame;
}

function buildEconomyContext(
  params: BuildSemanticDecisionFrameParams,
): SemanticDecisionEconomyContext {
  const credits = params.input.playerView.own.credits;
  const clicks = params.input.playerView.own.clicks;
  const posture = params.runner?.economyPosture;
  const creditPressure = classifyCreditPressure(credits, posture);
  return {
    availableCredits: credits,
    clicksRemaining: clicks,
    creditPressure,
    evidence: [
      `available_credits:${credits}`,
      `clicks_remaining:${clicks}`,
      `credit_pressure:${creditPressure}`,
      ...(posture
        ? [
            `economy_recommendation:${posture.recommendation}`,
            `funding_need:${posture.fundingNeed}`,
          ]
        : []),
    ],
  };
}

function classifyCreditPressure(
  credits: number,
  posture: RunnerEconomyPosture | undefined,
): NonNullable<SemanticDecisionEconomyContext["creditPressure"]> {
  if (
    posture?.fundingNeed ||
    posture?.recommendation === "build_economy" ||
    credits <= Math.max(0, posture?.minimumCreditFloor ?? 0)
  ) {
    return "high";
  }
  if (
    posture?.recommendation === "cash_out_bank" ||
    credits < (posture?.desiredCreditReserve ?? 3)
  ) {
    return "medium";
  }
  return "low";
}

export function assertSemanticDecisionFrameIsSideSafe(
  frame: SemanticDecisionFrame,
): void {
  const forbiddenPath = findForbiddenKeyPath(frame);
  if (forbiddenPath) {
    throw new Error(
      `SemanticDecisionFrame contains forbidden hidden-info key: ${forbiddenPath}`,
    );
  }
}

function findForbiddenKeyPath(value: unknown, path = "frame"): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "object") return undefined;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const nestedPath = findForbiddenKeyPath(value[index], `${path}[${index}]`);
      if (nestedPath) return nestedPath;
    }
    return undefined;
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const currentPath = `${path}.${key}`;
    if (FORBIDDEN_FRAME_KEYS.has(key)) return currentPath;
    const nestedPath = findForbiddenKeyPath(nested, currentPath);
    if (nestedPath) return nestedPath;
  }
  return undefined;
}
