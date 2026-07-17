import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { createAiHintsByCard } from "../ai-hints";
import { createPlanStep, createTacticalPlan } from "./tactical-plan-builders";
import type {
  PlanStep,
  PlanBlocker,
  TacticalPlan,
  TacticalPlanBuildContext,
} from "./tactical-plan-types";
import { visibleCardForAction } from "./tactical-plan-visible-cards";
import { corpStrategicKillLineFundingActive } from "../runtime/corp-visible-kill-line";

const AI_HINTS_BY_CARD = createAiHintsByCard();

export function buildCorpFiniteEconomyPlans(
  context: TacticalPlanBuildContext,
): TacticalPlan[] {
  const installed = context.input.playerView.servers.flatMap((server) =>
    server.id.startsWith("remote_")
      ? server.root
          .filter(isReviewedFiniteActionEconomyAsset)
          .map((card) => ({ card, serverId: server.id }))
      : [],
  );
  const activeInstalled = installed.filter(
    ({ card }) => visibleHostedCredits(card) !== 0,
  );
  const plans = activeInstalled.flatMap(({ card, serverId }) =>
    installedFiniteEconomyPlan(context, card, serverId),
  );
  if (activeInstalled.length > 0) return plans;

  const installActionsByCard = new Map<string, LegalAction[]>();
  for (const action of context.input.legalActions) {
    if (
      action.side !== "corp" ||
      action.type !== "install_card" ||
      action.payload?.placement === "ice"
    ) {
      continue;
    }
    const card = visibleCardForAction(context.input.playerView, action);
    if (!card || !isReviewedFiniteActionEconomyAsset(card)) continue;
    const actions = installActionsByCard.get(card.instanceId) ?? [];
    actions.push(action);
    installActionsByCard.set(card.instanceId, actions);
  }
  for (const [cardId, actions] of installActionsByCard) {
    if (
      context.input.playerView.own.credits <= 1 &&
      !finiteEconomyPreservesVisibleKillLine(context)
    ) {
      continue;
    }
    const scorelineBlocker = finiteEconomyInstallScorelineBlocker(
      context.input,
    );
    plans.push(
      createTacticalPlan({
        planId: `corp.develop_finite_economy:${cardId}`,
        side: "corp",
        type: "corp.develop_finite_economy",
        status: scorelineBlocker ? "blocked" : "active",
        priority: 760,
        horizonTurns: 3,
        target: { kind: "card", id: cardId },
        ...(scorelineBlocker ? { blockers: [scorelineBlocker] } : {}),
        currentStep: createPlanStep({
          stepId: `install_finite_economy:${cardId}`,
          kind: "install_finite_economy",
          desiredActionSemantics: ["install.card", "economy.finite_pool"],
          actionCandidateIds: actions.map((action) => action.actionId),
          rationale: [
            "install reviewed finite action-economy asset before using basic credit actions",
          ],
        }),
        nextSteps: [rezStep(cardId), drainStep(cardId)],
        evidence: [
          "corp_finite_economy_plan:install",
          `corp_finite_economy_card:${cardId}`,
          `corp_finite_economy_install_options:${actions.length}`,
          ...(scorelineBlocker?.evidence ?? []),
        ],
        scoreBreakdown: [
          {
            key: "corp_finite_economy_install",
            label: "Endliche Ökonomie installieren",
            value: 760,
            reason: "reviewed finite action-economy asset is ready to install",
          },
        ],
        stateVersion: context.input.playerView.stateVersion,
      }),
    );
  }
  return plans;
}

function finiteEconomyPreservesVisibleKillLine(
  context: TacticalPlanBuildContext,
): boolean {
  return corpStrategicKillLineFundingActive(
    context.input,
    context.strategicIntentState?.primaryStrategy.family,
  );
}

function finiteEconomyInstallScorelineBlocker(
  input: AiDecisionInput,
): PlanBlocker | undefined {
  const activeScoreline = input.playerView.servers
    .filter((server) => server.id.startsWith("remote_"))
    .flatMap((server) =>
      server.root
        .filter((card) => card.known !== false && card.type === "agenda")
        .map((card) => ({ card, serverId: server.id })),
    )[0];
  if (!activeScoreline) return undefined;
  const scoreReady = input.legalActions.some(
    (action) =>
      action.type === "score_agenda" &&
      String(action.source) === activeScoreline.card.instanceId,
  );
  return {
    blockerId: `active_scoreline_priority:${activeScoreline.card.instanceId}`,
    kind: "active_scoreline_priority",
    severity: "soft",
    target: { kind: "server", id: activeScoreline.serverId },
    removalStepKind: scoreReady ? "score_agenda" : "advance_score_card",
    evidence: [
      "corp_finite_economy_deferred_by_active_scoreline:true",
      `corp_finite_economy_scoreline_server:${activeScoreline.serverId}`,
      `corp_finite_economy_scoreline_card:${activeScoreline.card.instanceId}`,
      `corp_finite_economy_score_ready:${scoreReady}`,
    ],
  };
}

function installedFiniteEconomyPlan(
  context: TacticalPlanBuildContext,
  card: VisibleCard,
  serverId: string,
): TacticalPlan[] {
  const legalActions = context.input.legalActions.filter(
    (action) =>
      action.side === "corp" &&
      visibleCardForAction(context.input.playerView, action)?.instanceId ===
        card.instanceId,
  );
  const abilityActions = legalActions.filter(
    (action) => action.type === "activated_card_ability",
  );
  const rezActions = legalActions.filter(
    (action) => action.type === "rez_ice" || action.type === "rez_card",
  );
  const currentStep = card.rezzed
    ? drainStep(card.instanceId, abilityActions)
    : rezStep(card.instanceId, rezActions);
  if (currentStep.actionCandidateIds.length === 0) return [];
  const hostedCredits = visibleHostedCredits(card);
  return [
    createTacticalPlan({
      planId: `corp.develop_finite_economy:${card.instanceId}`,
      side: "corp",
      type: "corp.develop_finite_economy",
      status: "active",
      priority: card.rezzed ? 890 : 840,
      horizonTurns: 3,
      target: { kind: "card", id: card.instanceId },
      currentStep,
      nextSteps: card.rezzed ? [] : [drainStep(card.instanceId)],
      evidence: [
        `corp_finite_economy_plan:${card.rezzed ? "drain" : "rez"}`,
        `corp_finite_economy_card:${card.instanceId}`,
        `corp_finite_economy_server:${serverId}`,
        `corp_finite_economy_hosted_credits:${hostedCredits ?? "unknown"}`,
      ],
      scoreBreakdown: [
        {
          key: card.rezzed
            ? "corp_finite_economy_drain"
            : "corp_finite_economy_rez",
          label: card.rezzed
            ? "Endliche Ökonomie leeren"
            : "Endliche Ökonomie aktivieren",
          value: card.rezzed ? 890 : 840,
          reason: `finite action-economy asset has ${hostedCredits ?? "unknown"} hosted credits`,
        },
      ],
      stateVersion: context.input.playerView.stateVersion,
    }),
  ];
}

function rezStep(
  cardId: string,
  actions: readonly LegalAction[] = [],
): PlanStep {
  return createPlanStep({
    stepId: `rez_finite_economy:${cardId}`,
    kind: "rez_finite_economy",
    desiredActionSemantics: ["corp_window.rez", "economy.finite_pool"],
    actionCandidateIds: actions.map((action) => action.actionId),
    rationale: ["rez the installed finite economy asset before draining it"],
  });
}

function drainStep(
  cardId: string,
  actions: readonly LegalAction[] = [],
): PlanStep {
  return createPlanStep({
    stepId: `drain_finite_economy:${cardId}`,
    kind: "drain_finite_economy",
    desiredActionSemantics: [
      "card_ability.trigger",
      "economy.finite_pool",
      "economy.gain_credit",
    ],
    actionCandidateIds: actions.map((action) => action.actionId),
    rationale: [
      "take the efficient credit payout repeatedly until the finite pool is empty",
    ],
  });
}

function isReviewedFiniteActionEconomyAsset(card: VisibleCard): boolean {
  if (card.known === false || card.type !== "asset" || !card.definitionId) {
    return false;
  }
  const hint = AI_HINTS_BY_CARD.get(card.definitionId);
  return (
    hint?.side === "corp" &&
    hint.aiSupportStatus === "ai_supported" &&
    hint.quality?.hintReviewed === true &&
    (hint.effects ?? []).some(
      (effect) =>
        effect.kind === "economy" &&
        effect.timing === "action" &&
        effect.resource === "credits" &&
        effect.finite === true &&
        (effect.amount ?? 0) >= 2,
    )
  );
}

function visibleHostedCredits(card: VisibleCard): number | undefined {
  const counters = card.counters as Partial<Record<string, number>> | undefined;
  if (!counters) return undefined;
  for (const key of ["bit", "recurring_credit", "credit"]) {
    const value = counters[key];
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      return value;
    }
  }
  return undefined;
}
