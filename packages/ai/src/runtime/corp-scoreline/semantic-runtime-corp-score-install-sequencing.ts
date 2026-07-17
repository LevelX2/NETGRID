import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate";
import type { TacticalGoalLike } from "../../decision/semantic-decision-frame";
import { type CorpBoardTriage } from "../semantic-runtime-corp-board-triage";
import { createAiHintsByCard } from "../../ai-hints";
import type { CorpScoringWindowAssessment } from "../semantic-runtime-corp-scoring-window";
import { type SemanticRuntimeCorpScoreDependencies } from "./semantic-runtime-corp-score-contracts";
import {
  corpTacticalGoalScoreValue,
  highestPriorityCorpGoalForAction,
  semanticRuntimeCorpActionClickCost,
  semanticRuntimeCorpActionCreditCost,
  visibleSourceCardForAction,
} from "./semantic-runtime-corp-score-action-economy";

const AI_HINTS_BY_CARD = createAiHintsByCard();

export function corpPersistentInstallDiscountSequenceComponent<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  action: LegalAction,
  sourceCard: VisibleCard | undefined,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
  dependencies: Pick<
    SemanticRuntimeCorpScoreDependencies<TConsumer>,
    "actionCreditCost"
  >,
  boardTriage: CorpBoardTriage,
): AiDecisionScoreComponent | undefined {
  if (
    input.playerView.timingPoint !== "corp_action.main" ||
    !sourceCard ||
    sourceCard.type === "ice" ||
    !sourceCard.definitionId ||
    semanticRuntimeCorpActionCreditCost(
      dependencies,
      action,
      actionSemanticCandidate,
    ) !== 0 ||
    semanticRuntimeCorpActionClickCost(action, actionSemanticCandidate) !== 0
  ) {
    return undefined;
  }
  const location = input.playerView.servers.find((server) =>
    server.root.some((card) => card.instanceId === sourceCard.instanceId),
  );
  if (!location) return undefined;
  if (
    (boardTriage.severity === "high" || boardTriage.severity === "critical") &&
    boardTriage.targetServerId !== undefined &&
    boardTriage.targetServerId !== location.id
  ) {
    return undefined;
  }
  const hint = AI_HINTS_BY_CARD.get(sourceCard.definitionId);
  const persistentFortDiscounts = (hint?.effects ?? []).filter(
    (effect) =>
      effect.kind === "install_discount" &&
      effect.timing === "persistent" &&
      effect.scope === "fort" &&
      effect.resource === "credits" &&
      typeof effect.amount === "number" &&
      effect.amount > 0,
  );
  if (
    persistentFortDiscounts.length === 0 ||
    hint?.conditions?.some(
      (condition) => condition.kind === "requires_rezzed_card",
    ) !== true
  ) {
    return undefined;
  }
  const sameFortPaidIceInstalls = input.legalActions
    .filter(
      (candidate) =>
        candidate.type === "install_card" &&
        candidate.payload?.placement === "ice" &&
        candidate.payload?.serverId === location.id,
    )
    .map((candidate) => ({
      action: candidate,
      creditCost: dependencies.actionCreditCost(candidate),
    }))
    .filter((candidate) => candidate.creditCost > 0);
  if (sameFortPaidIceInstalls.length === 0) return undefined;
  const discountAmount = Math.max(
    ...persistentFortDiscounts.map((effect) => effect.amount ?? 0),
  );
  const minimumInstallCost = Math.min(
    ...sameFortPaidIceInstalls.map((candidate) => candidate.creditCost),
  );
  const immediateSaving = Math.min(discountAmount, minimumInstallCost);
  const value = 2800 + Math.min(800, immediateSaving * 400);
  return {
    key: "corp_persistent_install_discount_sequence",
    label: "Persistenten Installationsrabatt zuerst aktivieren",
    value,
    reason: [
      "persistent_install_discount_sequence:free_rez_before_same_fort_ice",
      `card:${sourceCard.instanceId}`,
      `server:${location.id}`,
      `discount:${discountAmount}`,
      `same_fort_paid_ice_installs:${sameFortPaidIceInstalls.length}`,
      `minimum_install_cost:${minimumInstallCost}`,
      `immediate_saving:${immediateSaving}`,
    ].join("|"),
  };
}

export function corpServerIceLocation(
  input: AiDecisionInput,
  sourceId: string,
):
  | {
      server: AiDecisionInput["playerView"]["servers"][number];
      iceIndex: number;
    }
  | undefined {
  for (const server of input.playerView.servers ?? []) {
    const iceIndex = server.ice.findIndex((ice) => ice.instanceId === sourceId);
    if (iceIndex >= 0) return { server, iceIndex };
  }
  return undefined;
}

export function minimumInnerUnrezzedIceRezCost(location: {
  server: AiDecisionInput["playerView"]["servers"][number];
  iceIndex: number;
}): number | undefined {
  const costs = location.server.ice
    .slice(0, location.iceIndex)
    .filter((ice) => ice.rezzed !== true)
    .map((ice) =>
      typeof ice.rezCost === "number" && Number.isFinite(ice.rezCost)
        ? Math.max(0, Math.floor(ice.rezCost))
        : undefined,
    )
    .filter((cost): cost is number => cost !== undefined);
  if (costs.length === 0) return undefined;
  return Math.min(...costs);
}

export function addCorpScoringWindowEvidenceComponent(
  components: AiDecisionScoreComponent[],
  assessment: CorpScoringWindowAssessment | undefined,
): void {
  if (!assessment) return;
  components.push({
    key: "corp_scoring_window_assessment",
    label: "Scoring-Window",
    value: 0,
    reason: assessment.evidence.join("|"),
  });
}

export function corpTacticalGoalFitScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
  scopeId: string,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): AiDecisionScoreComponent | undefined {
  const goals = corpTacticalGoalsForInput(input);
  if (goals.length === 0) return undefined;
  const goal = highestPriorityCorpGoalForAction(
    goals,
    action,
    scopeId,
    actionSemanticCandidate,
    visibleSourceCardForAction(input, action),
  );
  if (!goal) return undefined;
  return {
    key: "corp_goal_fit_tactical_goal",
    label: "Corp-TacticalGoal",
    value: corpTacticalGoalScoreValue(goal),
    reason: [
      `goal:${goal.goalId}`,
      `family:${goal.family}`,
      `urgency:${goal.urgency ?? "unknown"}`,
      `action:${action.type}`,
      `scope:${scopeId}`,
      ...(goal.targetServerId ? [`target:${goal.targetServerId}`] : []),
    ].join("|"),
  };
}

function corpTacticalGoalsForInput(
  input: AiDecisionInput,
): readonly TacticalGoalLike[] {
  return (
    (
      input as AiDecisionInput & {
        ownCorpTacticalGoals?: readonly TacticalGoalLike[];
      }
    ).ownCorpTacticalGoals ?? []
  );
}
