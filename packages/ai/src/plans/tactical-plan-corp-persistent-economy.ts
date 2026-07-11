import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { createAiHintsByCard } from "../ai-hints";
import { createPlanStep, createTacticalPlan } from "./tactical-plan-builders";
import type {
  PlanStep,
  TacticalPlan,
  TacticalPlanBuildContext,
} from "./tactical-plan-types";
import { visibleCardForAction } from "./tactical-plan-visible-cards";

const AI_HINTS_BY_CARD = createAiHintsByCard();

export function buildCorpPersistentEconomyPlans(
  context: TacticalPlanBuildContext,
): TacticalPlan[] {
  return context.input.playerView.servers.flatMap((server) =>
    server.root.flatMap((card) =>
      installedPersistentEconomyPlan(context.input, card, server.id),
    ),
  );
}

function installedPersistentEconomyPlan(
  input: AiDecisionInput,
  card: VisibleCard,
  serverId: string,
): TacticalPlan[] {
  const profile = persistentEconomyProfile(card);
  if (!profile) return [];
  const actions = input.legalActions.filter(
    (action) =>
      action.side === "corp" &&
      visibleCardForAction(input.playerView, action)?.instanceId ===
        card.instanceId,
  );
  const rezActions = actions.filter((action) => action.type === "rez_ice");
  const useActions = actions.filter((action) =>
    persistentEconomyUseAction(input, action, profile),
  );
  const currentStep = card.rezzed
    ? usePersistentEconomyStep(card.instanceId, useActions)
    : rezPersistentEconomyStep(card.instanceId, rezActions);
  if (currentStep.actionCandidateIds.length === 0) return [];
  const activationCost = card.rezzed
    ? 0
    : Math.min(...rezActions.map(actionCreditCost));
  if (!card.rezzed && activationCost > input.playerView.own.credits) return [];
  const zeroCostActivation = !card.rezzed && activationCost === 0;

  return [
    createTacticalPlan({
      planId: `corp.activate_persistent_economy:${card.instanceId}`,
      side: "corp",
      type: "corp.activate_persistent_economy",
      status: "active",
      priority: zeroCostActivation ? 930 : card.rezzed ? 900 : 820,
      horizonTurns: 2,
      target: { kind: "card", id: card.instanceId },
      currentStep,
      nextSteps: card.rezzed ? [] : [usePersistentEconomyStep(card.instanceId)],
      evidence: [
        `corp_persistent_economy_plan:${card.rezzed ? "use" : "rez"}`,
        `corp_persistent_economy_card:${card.instanceId}`,
        `corp_persistent_economy_server:${serverId}`,
        `corp_persistent_economy_activation_cost:${activationCost}`,
        `corp_persistent_economy_zero_cost_activation:${zeroCostActivation}`,
      ],
      scoreBreakdown: [
        {
          key: card.rezzed
            ? "corp_persistent_economy_use"
            : "corp_persistent_economy_rez",
          label: card.rezzed
            ? "Persistente Ökonomie nutzen"
            : "Persistente Ökonomie aktivieren",
          value: zeroCostActivation ? 930 : card.rezzed ? 900 : 820,
          reason: card.rezzed
            ? "reviewed persistent economy support has a legal use action"
            : `installed persistent economy support can be activated for ${activationCost} credits`,
        },
      ],
      stateVersion: input.playerView.stateVersion,
    }),
  ];
}

function rezPersistentEconomyStep(
  cardId: string,
  actions: readonly LegalAction[] = [],
): PlanStep {
  return createPlanStep({
    stepId: `rez_persistent_economy:${cardId}`,
    kind: "rez_persistent_economy",
    desiredActionSemantics: ["corp_window.rez", "economy.persistent"],
    actionCandidateIds: actions.map((action) => action.actionId),
    rationale: [
      "activate the installed persistent economy support before passive actions",
    ],
  });
}

function usePersistentEconomyStep(
  cardId: string,
  actions: readonly LegalAction[] = [],
): PlanStep {
  return createPlanStep({
    stepId: `use_persistent_economy:${cardId}`,
    kind: "use_persistent_economy",
    desiredActionSemantics: [
      "card_ability.trigger",
      "economy.persistent",
      "economy.gain_credit",
      "draw.corp_draw",
    ],
    actionCandidateIds: actions.map((action) => action.actionId),
    rationale: ["convert the active persistent support into cards or credits"],
  });
}

function persistentEconomyUseAction(
  input: AiDecisionInput,
  action: LegalAction,
  profile: PersistentEconomyProfile,
): boolean {
  if (
    profile.supportsDraw &&
    (action.type === "activated_card_ability" ||
      action.type === "trigger_ability" ||
      action.type === "draw_card")
  ) {
    const handSpace = Math.max(
      0,
      input.playerView.own.maxHandSize - input.playerView.own.gripOrHq.length,
    );
    return handSpace >= 2;
  }
  return (
    profile.supportsCredits &&
    (action.type === "gain_credit" ||
      action.type === "activated_card_ability" ||
      action.type === "trigger_ability") &&
    structuredCreditGain(action) > 0
  );
}

type PersistentEconomyProfile = {
  supportsCredits: boolean;
  supportsDraw: boolean;
};

function persistentEconomyProfile(
  card: VisibleCard,
): PersistentEconomyProfile | undefined {
  if (card.known === false || card.type !== "asset" || !card.definitionId) {
    return undefined;
  }
  const hint = AI_HINTS_BY_CARD.get(card.definitionId);
  if (
    hint?.side !== "corp" ||
    hint.aiSupportStatus !== "ai_supported" ||
    hint.quality?.hintReviewed !== true ||
    hint.remoteRole?.kind !== "asset_economy"
  ) {
    return undefined;
  }
  const persistentEffects = (hint.effects ?? []).filter(
    (effect) =>
      effect.finite !== true &&
      (effect.kind === "economy" ||
        effect.kind === "agenda_reveal_economy" ||
        effect.kind === "draw") &&
      (effect.timing === "action" || effect.timing === "start_of_turn"),
  );
  if (persistentEffects.length === 0) return undefined;
  return {
    supportsCredits: persistentEffects.some(
      (effect) =>
        effect.kind === "economy" || effect.kind === "agenda_reveal_economy",
    ),
    supportsDraw: persistentEffects.some((effect) => effect.kind === "draw"),
  };
}

function structuredCreditGain(action: LegalAction): number {
  return Math.max(
    0,
    Number(action.payload?.gainCreditsAmount ?? 0),
    Number(action.payload?.cardImplementationCreditAmount ?? 0),
  );
}

function actionCreditCost(action: LegalAction): number {
  return (action.costs ?? []).reduce(
    (sum, cost) => sum + Math.max(0, Number(cost.credits ?? 0)),
    0,
  );
}
