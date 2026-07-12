import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

const DRAW_TAX_TAG_LIABILITY_VALUE = -900;

export function runnerDrawTaxLiabilityScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent | undefined {
  if (input.side !== "runner" || action.side !== "runner") return undefined;
  const projectedTags = nonNegativePayloadNumber(
    action.payload?.drawTaxProjectedTagsAdded,
  );
  if (projectedTags <= 0) return undefined;
  const projectedCredits = nonNegativePayloadNumber(
    action.payload?.drawTaxProjectedCreditsPaid,
  );
  return {
    key: "runner_draw_tax_tag_liability",
    label: "Draw-Tax-Tag-Folgekosten",
    value: DRAW_TAX_TAG_LIABILITY_VALUE * projectedTags,
    reason: [
      `projected_tags:${projectedTags}`,
      `projected_credits_paid:${projectedCredits}`,
      `current_tags:${Math.max(0, input.playerView.own.tags)}`,
    ].join(";"),
  };
}

function nonNegativePayloadNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, value)
    : 0;
}
