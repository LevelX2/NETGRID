import type {
  AiDecisionInput,
  CorpRootRezDiscountedIceQuote,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import type { CorpExactCardRezSupportAssessment } from "./defense-runtime-types";

/** A free current preparation, never an invented future LegalAction. */
export function corpRootRezDiscountedIceAssessment(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  serverId: string,
): CorpExactCardRezSupportAssessment | undefined {
  const action = input.legalActions.find(
    (a) => a.actionId === candidate.actionId,
  );
  const raw = action?.payload?.rootRezDiscountedIceQuoteJson;
  if (raw === undefined) return undefined;
  let quote: Partial<CorpRootRezDiscountedIceQuote>;
  try {
    quote = JSON.parse(String(raw));
  } catch {
    throw new PlanResolutionFailure("missing_action_semantics", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((a) => a.type),
      unresolvedActionIds: [candidate.actionId],
      owner: "action_semantics",
      removalCondition:
        "Publish a valid current root-rez discounted-ICE quote from the Engine.",
    });
  }
  const rejected: CorpExactCardRezSupportAssessment = {
    productive: false,
    serverId,
    value: 0,
    evidenceCode:
      "corp_root_rez_discount_has_no_bound_funded_unbreakable_current_stop",
  };
  if (!quote || typeof quote !== "object") return rejected;
  const run = input.playerView.run;
  const server = input.playerView.servers.find((s) => s.id === serverId);
  const source = server?.root.find(
    (c) => c.instanceId === candidate.sourceCardInstanceId,
  );
  const ice =
    run?.position?.kind === "ice"
      ? server?.ice[run.position.iceIndex]
      : undefined;
  const effect = ice?.effectiveRezResourceExchangeQuote;
  if (
    input.side !== "corp" ||
    input.playerView.timingPoint !== "run.approach_ice" ||
    !action ||
    action.type !== "rez_card" ||
    action.side !== "corp" ||
    candidate.stateVersion !== input.playerView.stateVersion ||
    candidate.legalActionRef.actionId !== action.actionId ||
    action.source !== candidate.sourceCardInstanceId ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.timingPoint !== input.playerView.timingPoint ||
    action.costs.some((cost) =>
      Object.values(cost).some((value) => value !== 0),
    ) ||
    !source?.known ||
    source.rezzed ||
    !ice?.known ||
    ice.rezzed ||
    run?.attackedServerId !== serverId ||
    run.phase !== "approach_ice" ||
    quote.schemaVersion !== "corp-root-rez-discounted-ice-v1" ||
    quote.actionId !== action.actionId ||
    quote.sourceCardInstanceId !== source.instanceId ||
    quote.targetServerId !== serverId ||
    quote.targetIceInstanceId !== ice.instanceId ||
    quote.runId !== run.runId ||
    quote.stateVersion !== input.playerView.stateVersion ||
    quote.temporaryDerezAfterRun !== true ||
    !Number.isSafeInteger(quote.discountedCredits) ||
    (quote.discountedCredits ?? -1) < 0 ||
    !Number.isSafeInteger(quote.ordinaryCredits) ||
    (quote.ordinaryCredits ?? 0) <= (quote.discountedCredits ?? 0) ||
    (quote.discountedCredits ?? Infinity) > input.playerView.own.credits ||
    effect?.complete !== true ||
    effect.context !== "installed" ||
    effect.cardId !== ice.instanceId ||
    effect.targetServerId !== serverId ||
    effect.projectedServerId !== serverId ||
    effect.expiresAtStateVersion !== input.playerView.stateVersion ||
    !Number.isSafeInteger(effect.hardEndTheRunSubroutineCount) ||
    effect.hardEndTheRunSubroutineCount < 1 ||
    effect.runnerBreakUnavailable?.reason !== "no_visible_eligible_breaker" ||
    effect.runnerBreakUnavailable.evidenceSource !== "engine_icebreaker_ability"
  )
    return rejected;
  return {
    productive: true,
    serverId,
    value: 180,
    evidenceCode: `corp_root_rez_funds_unbreakable_current_ice:${ice.instanceId}:${quote.discountedCredits}`,
  };
}
