import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { readKnownCorpCentralAgendaThreat } from "./corp-central-defense-facts-adapter";

export function corpPassTaxRezAssessment(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  source: VisibleCard,
  serverId: string,
) {
  const q = source.currentPassTaxRezQuote;
  if (!q) return undefined;
  const fail = (evidenceCode: string) => ({
    productive: false,
    serverId,
    value: 0,
    evidenceCode,
  });
  const action = input.legalActions.find(
    (a) => a.actionId === candidate.actionId,
  );
  const run = input.playerView.run;
  if (
    q.actionId !== candidate.actionId ||
    q.sourceCardInstanceId !== source.instanceId ||
    q.targetServerId !== serverId ||
    q.stateVersion !== input.playerView.stateVersion ||
    q.runId !== run?.runId ||
    run.attackedServerId !== serverId ||
    run.position?.kind !== "ice" ||
    !action ||
    action.type !== "rez_card" ||
    action.source !== source.instanceId ||
    action.expiresAtStateVersion !== q.stateVersion ||
    action.targetRequirements.length ||
    action.choiceRequirements?.length ||
    q.remainingPasses !== run.position.iceIndex + 1 ||
    ![
      q.rezCredits,
      q.creditsPerPass,
      q.remainingPasses,
      q.remainingPassCredits,
      q.runnerSpendableCredits,
    ].every((n) => Number.isSafeInteger(n) && n >= 0) ||
    q.remainingPasses <= 0 ||
    q.creditsPerPass <= 0 ||
    q.remainingPassCredits !== q.remainingPasses * q.creditsPerPass ||
    action.costs.reduce((n, c) => n + (c.credits ?? 0), 0) !== q.rezCredits ||
    action.costs.some((c) => (c.clicks ?? 0) !== 0) ||
    q.rezCredits > input.playerView.own.credits
  )
    return fail("corp_pass_tax_rez_quote_binding_invalid");
  const centralThreat =
    serverId === "hq" || serverId === "rd"
      ? readKnownCorpCentralAgendaThreat({ input, serverId })
      : undefined;
  const terminal = centralThreat?.threat === "terminal";
  const productive =
    q.remainingPassCredits > q.runnerSpendableCredits ||
    q.remainingPassCredits >= q.rezCredits ||
    terminal;
  return productive
    ? {
        productive: true,
        serverId,
        value: 160,
        evidenceCode: `corp_pass_tax_rez_current_path:${q.remainingPassCredits}:available_${q.runnerSpendableCredits}`,
      }
    : fail("corp_pass_tax_rez_current_exchange_not_worthwhile");
}
