import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { runnerDrawProjectionFor } from "../actions/action-economy-projection";
import { visibleRunnerDrawTaxSourceCount } from "./ai-feature-server";

const DRAW_TAX_TAG_LIABILITY_VALUE = -900;

export function runnerDrawTaxLiabilityScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
  candidate?: ActionSemanticCandidate,
): AiDecisionScoreComponent | undefined {
  if (input.side !== "runner" || action.side !== "runner") return undefined;
  const projection = runnerDrawTaxLiabilityProjection(input, action, candidate);
  const projectedTags = projection.projectedTagsAdded;
  if (projectedTags <= 0) return undefined;
  return {
    key: "runner_draw_tax_tag_liability",
    label: "Draw-Tax-Tag-Folgekosten",
    value: DRAW_TAX_TAG_LIABILITY_VALUE * projectedTags,
    reason: [
      `projected_tags:${projectedTags}`,
      `projected_credits_paid:${projection.projectedCreditsPaid}`,
      `current_tags:${Math.max(0, input.playerView.own.tags)}`,
    ].join(";"),
  };
}

export type RunnerDrawTaxLiabilityProjection = {
  drawCount: number;
  sourceCount: number;
  projectedCreditsPaid: number;
  projectedTagsAdded: number;
};

/**
 * Side-safe worst-case quote for the visible per-card draw tax. The Engine
 * remains authoritative for each later choice; this projection only lets the
 * already owning plan compare current LegalActions before crossing the draw
 * boundary.
 */
export function runnerDrawTaxLiabilityProjection(
  input: AiDecisionInput,
  action: LegalAction,
  candidate?: ActionSemanticCandidate,
): RunnerDrawTaxLiabilityProjection {
  const explicitTags = payloadNumber(action.payload?.drawTaxProjectedTagsAdded);
  const explicitCredits = payloadNumber(
    action.payload?.drawTaxProjectedCreditsPaid,
  );
  if (explicitTags !== undefined || explicitCredits !== undefined) {
    return {
      drawCount: drawCountFor(action, candidate),
      sourceCount: nonNegativePayloadNumber(action.payload?.drawTaxSourceCount),
      projectedCreditsPaid: explicitCredits ?? 0,
      projectedTagsAdded: explicitTags ?? 0,
    };
  }

  const drawCount = drawCountFor(action, candidate);
  const sourceCount =
    input.side === "runner" && drawCount > 0
      ? (runnerDrawProjectionFor(action)?.visibleDrawTaxSourceCount ??
        visibleRunnerDrawTaxSourceCount(input))
      : 0;
  const obligations = drawCount * sourceCount;
  const actionCreditCost = action.costs.reduce(
    (sum, cost) => sum + Math.max(0, cost.credits ?? 0),
    0,
  );
  const availableCredits = Math.max(
    0,
    (input.playerView.own.credits ?? 0) - actionCreditCost,
  );
  const projectedCreditsPaid = Math.min(obligations, availableCredits);
  return {
    drawCount,
    sourceCount,
    projectedCreditsPaid,
    projectedTagsAdded: Math.max(0, obligations - projectedCreditsPaid),
  };
}

function drawCountFor(
  action: LegalAction,
  candidate?: ActionSemanticCandidate,
): number {
  const runnerDrawProjection = runnerDrawProjectionFor(action);
  if (runnerDrawProjection) return runnerDrawProjection.projectedGrossDrawCount;
  const payloadDrawCount = [
    action.payload?.drawCardsAmount,
    action.payload?.drawAmount,
    action.payload?.drawCount,
  ]
    .map(payloadNumber)
    .find((value) => value !== undefined && value > 0);
  if (payloadDrawCount !== undefined) return payloadDrawCount;
  const projectedDrawCount = candidate?.economyProjection?.cardsDrawn;
  if (
    typeof projectedDrawCount === "number" &&
    Number.isFinite(projectedDrawCount) &&
    projectedDrawCount > 0
  ) {
    return projectedDrawCount;
  }
  return action.type === "draw_card" && action.source === "basic_action"
    ? 1
    : 0;
}

function payloadNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, value)
    : undefined;
}

function nonNegativePayloadNumber(value: unknown): number {
  return payloadNumber(value) ?? 0;
}
