import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { runnerDrawProjectionFor } from "../../actions/action-economy-projection";
import { runnerDrawTaxLiabilityProjection } from "../../runtime/runner-draw-tax-liability-score";
import { currentLegalActionResourceCost } from "../../runtime/visible-action-facts";

type GripBudget = {
  handSize: number;
  clicks: number;
  credits: number;
};

type GripRoute = {
  actionId: string;
  clicks: number;
  credits: number;
};

function bestGripRoutes(routes: GripRoute[]): GripRoute[] {
  routes.sort((a, b) => a.clicks - b.clicks || a.credits - b.credits);
  const best = routes[0];
  return best
    ? routes.filter(
        (route) =>
          route.clicks === best.clicks && route.credits === best.credits,
      )
    : [];
}

const currentLegalActions = (input: AiDecisionInput) =>
  input.legalActions.filter(
    (action) =>
      action.side === "runner" &&
      action.timingPoint === input.playerView.timingPoint &&
      action.expiresAtStateVersion === input.playerView.stateVersion,
  );

export function nextCorpTurnBufferDrawActionIds(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  target: number,
  excludedActionIds: ReadonlySet<string>,
  creditBudget = input.playerView.own.credits,
): string[] {
  const { own } = input.playerView;
  return nextCorpTurnBufferDraws(input, candidates, target, excludedActionIds, {
    handSize: own.gripOrHq.length,
    clicks: own.clicks,
    credits: creditBudget,
  }).map(({ actionId }) => actionId);
}

function nextCorpTurnBufferDraws(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  target: number,
  excludedActionIds: ReadonlySet<string>,
  budget: GripBudget,
  afterInstall = false,
): GripRoute[] {
  const gap = target - budget.handSize;
  if (gap <= 0) return [];
  const stack = input.playerView.own.stackOrRdCount;
  const actions = currentLegalActions(input);
  const draws = candidates.flatMap((candidate) => {
    const projection = candidate.economyProjection;
    if (
      excludedActionIds.has(candidate.actionId) ||
      candidate.semanticActionType === "install.card" ||
      projection?.reliability !== "guaranteed" ||
      (candidate.semanticActionType !== "draw.card" &&
        projection.timing !== "immediate") ||
      projection.netHandDelta <= 0 ||
      (candidate.costProfile.selfDamage?.length ?? 0) > 0 ||
      (candidate.costProfile.selfTag ?? 0) > 0
    )
      return [];
    const action = actions.find(
      (legal) => legal.actionId === candidate.actionId,
    );
    if (!action) return [];
    if (
      afterInstall &&
      ((action.type !== "draw_card" && action.type !== "play_event") ||
        action.targetRequirements.length > 0 ||
        (action.choiceRequirements?.length ?? 0) > 0 ||
        !runnerDrawProjectionFor(action))
    ) {
      return [];
    }
    const tax = runnerDrawTaxLiabilityProjection(input, action, candidate);
    const credits =
      currentLegalActionResourceCost(action, "credits") +
      tax.projectedCreditsPaid;
    const clicks = currentLegalActionResourceCost(action, "clicks");
    const stackUsed = projection.drawPileCardsConsumed ?? tax.drawCount;
    if (
      credits > budget.credits ||
      clicks > budget.clicks ||
      tax.projectedTagsAdded > 0 ||
      stackUsed > stack
    )
      return [];
    return [
      {
        action,
        clicks,
        credits,
        stackUsed,
        handGain: projection.netHandDelta,
        drawTaxSources: tax.sourceCount,
      },
    ];
  });
  const basic = draws.find(
    ({ action, handGain }) =>
      action.type === "draw_card" &&
      action.source === "basic_action" &&
      handGain === 1,
  );
  const routes = draws.flatMap(
    ({ action, clicks, credits, handGain, stackUsed }) => {
      const remaining = gap - handGain;
      if (remaining <= 0)
        return [{ actionId: action.actionId, clicks, credits }];
      if (!basic || basic.drawTaxSources > 0) return [];
      const totalClicks = clicks + remaining * basic.clicks;
      const totalCredits = credits + remaining * basic.credits;
      return totalClicks <= budget.clicks &&
        totalCredits <= budget.credits &&
        stackUsed + remaining * basic.stackUsed <= stack
        ? [
            {
              actionId: action.actionId,
              clicks: totalClicks,
              credits: totalCredits,
            },
          ]
        : [];
    },
  );
  return bestGripRoutes(routes);
}

/** Certify the same-turn install and refill horizon from current bindings.
 * Only the install head is executable here. Defense rebinds the draw after it. */
export function nextCorpTurnCapacityInstalls(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  target: number,
  excludedActionIds: ReadonlySet<string>,
): string[] {
  const { own } = input.playerView;
  const actions = currentLegalActions(input);
  const routes = candidates.flatMap((candidate) => {
    if (
      candidate.actionType !== "install_card" ||
      candidate.semanticActionType !== "install.card" ||
      candidate.costProfile.costKnownStatus !== "known" ||
      candidate.costProfile.additionalCosts.length > 0 ||
      (candidate.costProfile.selfDamage?.length ?? 0) > 0 ||
      (candidate.costProfile.selfTag ?? 0) > 0
    )
      return [];
    const install = actions.find(
      (action) => action.actionId === candidate.actionId,
    );
    if (
      !install ||
      install.choiceRequirements?.length ||
      install.targetRequirements.length
    )
      return [];
    const card = own.gripOrHq.find(
      (entry) => entry.instanceId === install.source,
    );
    if (!card?.known || !card.definitionId) return [];
    const engine = cardSpecPlanningCardByDefinitionId(card.definitionId)
      ?.planning.engine;
    if (
      !engine ||
      (engine.lifecycle?.on_install?.length ?? 0) > 0 ||
      (engine.hardwareDeck &&
        own.rig?.some(
          (installed) =>
            installed.definitionId &&
            cardSpecPlanningCardByDefinitionId(installed.definitionId)?.planning
              .engine.hardwareDeck,
        ))
    )
      return [];
    const modifiers = engine.modifiers ?? [];
    const bonus = modifiers.reduce(
      (sum, modifier) =>
        modifier.kind === "hand_size" &&
        modifier.operation === "increase" &&
        modifier.side === "runner" &&
        modifier.activeWhile === "installed" &&
        modifier.sourceZone === "runner_installed" &&
        modifier.visibility === "public"
          ? sum + modifier.amount
          : sum,
      0,
    );
    if (bonus <= 0 || own.maxHandSize + bonus < target) return [];
    const credits = currentLegalActionResourceCost(install, "credits");
    const clicks = currentLegalActionResourceCost(install, "clicks");
    const budget = {
      handSize: own.gripOrHq.length - 1,
      clicks: own.clicks - clicks,
      credits: own.credits - credits,
    };
    if (budget.clicks < 0 || budget.credits < 0) return [];
    if (budget.handSize >= target) {
      return [{ actionId: install.actionId, clicks, credits }];
    }
    const [draw] = nextCorpTurnBufferDraws(
      input,
      candidates,
      target,
      excludedActionIds,
      budget,
      true,
    );
    return draw
      ? [
          {
            actionId: install.actionId,
            clicks: clicks + draw.clicks,
            credits: credits + draw.credits,
          },
        ]
      : [];
  });
  return bestGripRoutes(routes).map(({ actionId }) => actionId);
}
