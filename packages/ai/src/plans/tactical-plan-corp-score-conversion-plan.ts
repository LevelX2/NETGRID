import type { LegalAction } from "@netgrid/shared";
import type { TacticalGoalLike } from "../decision/semantic-decision-frame";
import { createPlanStep, createTacticalPlan } from "./tactical-plan-builders";
import {
  tacticalGoalEvidence,
  tacticalGoalPriorityBoost,
  tacticalGoalScoreBreakdown,
} from "./tactical-plan-goal-evidence";
import {
  corpSameTurnScoreConversionPaths,
  type CorpScoreConversionPath,
  type CorpScoreConversionStep,
} from "./tactical-plan-corp-score-conversion";
import type {
  PlanStep,
  PlanStepKind,
  TacticalPlan,
  TacticalPlanBuildContext,
} from "./tactical-plan-types";

export function buildCorpScoreConversionPlans(
  context: TacticalPlanBuildContext,
  scorelineGoal: TacticalGoalLike | undefined,
): TacticalPlan[] {
  const legalActionsById = new Map(
    context.input.legalActions.map((action) => [action.actionId, action]),
  );
  const strategicBoost = tacticalGoalPriorityBoost(scorelineGoal);
  return corpSameTurnScoreConversionPaths(context.input).flatMap((path) => {
    const currentIndex = currentExecutableStepIndex(
      path,
      context.input.legalActions,
    );
    if (currentIndex < 0) return [];
    const current = planStepForConversion(
      path,
      path.steps[currentIndex]!,
      legalActionsById,
    );
    if (current.actionCandidateIds.length === 0) return [];
    const nextSteps = path.steps
      .slice(currentIndex + 1)
      .map((step) => planStepForConversion(path, step, legalActionsById));
    return [
      createTacticalPlan({
        planId: `corp.create_score_window:conversion:${path.agendaCardId}`,
        side: "corp",
        type: "corp.create_score_window",
        status: "active",
        priority: 970 + strategicBoost + path.agendaPoints,
        horizonTurns: 1,
        target: { kind: "card", id: path.agendaCardId },
        currentStep: current,
        nextSteps,
        evidence: [
          ...path.evidence,
          "corp_score_sequence:same_turn_conversion",
          "score_window_unprotected_override:same_turn_guaranteed",
          ...tacticalGoalEvidence(scorelineGoal),
        ],
        scoreBreakdown: [
          ...tacticalGoalScoreBreakdown(scorelineGoal, strategicBoost),
          {
            key: "corp_same_turn_score_conversion",
            label: "Same-Turn-Score-Conversion",
            value: 960,
            reason: path.evidence.join("|"),
          },
        ],
        stateVersion: context.input.playerView.stateVersion,
      }),
    ];
  });
}

function currentExecutableStepIndex(
  path: CorpScoreConversionPath,
  legalActions: readonly LegalAction[],
): number {
  return path.steps.findIndex((step) =>
    currentActionIdForStep(path, step, legalActions),
  );
}

function planStepForConversion(
  path: CorpScoreConversionPath,
  step: CorpScoreConversionStep,
  legalActionsById: ReadonlyMap<string, LegalAction>,
): PlanStep {
  const currentActionId = currentActionIdForStep(path, step, [
    ...legalActionsById.values(),
  ]);
  const kind = planStepKind(step);
  return createPlanStep({
    stepId: `score_conversion:${step.kind}:${path.agendaCardId}`,
    kind,
    desiredActionSemantics: desiredSemantics(step),
    ...(currentActionId ? { actionCandidateIds: [currentActionId] } : {}),
    rationale: [
      `execute ${step.kind} for guaranteed same-turn score conversion`,
      `agenda:${path.agendaCardId}`,
      `server:${path.targetServerId}`,
      ...step.evidence,
    ],
  });
}

function currentActionIdForStep(
  path: CorpScoreConversionPath,
  step: CorpScoreConversionStep,
  legalActions: readonly LegalAction[],
): string | undefined {
  if (
    step.actionId &&
    legalActions.some((action) => action.actionId === step.actionId)
  )
    return step.actionId;
  if (step.kind === "basic_advance") {
    return legalActions.find(
      (action) =>
        action.side === "corp" &&
        action.type === "advance_card" &&
        actionCardId(action) === path.agendaCardId,
    )?.actionId;
  }
  if (step.kind === "place_advancement" && step.sourceCardId) {
    return legalActions.find(
      (action) =>
        action.side === "corp" &&
        actionCardId(action) === step.sourceCardId &&
        action.payload?.scoreConversionCapability === "place_advancement",
    )?.actionId;
  }
  if (step.kind === "score_ready") {
    return legalActions.find(
      (action) =>
        action.side === "corp" &&
        action.type === "score_agenda" &&
        actionCardId(action) === path.agendaCardId,
    )?.actionId;
  }
  return undefined;
}

function planStepKind(step: CorpScoreConversionStep): PlanStepKind {
  switch (step.kind) {
    case "gain_action_capacity":
      return "gain_action_capacity";
    case "install_score_target":
      return "install_or_prepare_agenda";
    case "place_advancement":
    case "move_advancement":
      return "convert_advancement";
    case "basic_advance":
      return "advance_score_card";
    case "score_ready":
      return "score_agenda";
  }
}

function desiredSemantics(step: CorpScoreConversionStep): string[] {
  switch (step.kind) {
    case "gain_action_capacity":
      return ["score_conversion.gain_action_capacity"];
    case "install_score_target":
      return ["install.card", "scoreline"];
    case "place_advancement":
      return ["score_conversion.place_advancement"];
    case "move_advancement":
      return ["score_conversion.move_advancement"];
    case "basic_advance":
      return ["score.advance_card"];
    case "score_ready":
      return ["score.agenda"];
  }
}

function actionCardId(action: LegalAction): string | undefined {
  const cardId = action.payload?.cardId;
  if (typeof cardId === "string" && cardId.length > 0) return cardId;
  return typeof action.source === "string" && action.source !== "game_rule"
    ? action.source
    : undefined;
}
