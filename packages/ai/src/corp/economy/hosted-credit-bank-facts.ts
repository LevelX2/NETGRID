import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { clickCreditBankProfile } from "../../plans/credit-bank-investment";
import type { CorpHostedBankInvestment } from "./economy-types";

/** Current native load only. Canonical bank facts authorize a projection,
 * never an invented future action or future liquid-credit guarantee. */
export function corpHostedBankLoadMatches(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  investment: Pick<
    CorpHostedBankInvestment,
    | "actionId"
    | "stateVersion"
    | "sourceInstanceId"
    | "sourceDefinitionId"
    | "storedCredits"
    | "creditsPerLoad"
  >,
): boolean {
  const action = input.legalActions.find(
    (a) => a.actionId === candidate.actionId,
  );
  const card = input.playerView.servers
    .flatMap((s) => s.root)
    .find((c) => c.instanceId === investment.sourceInstanceId);
  const profile = clickCreditBankProfile(investment.sourceDefinitionId);
  return (
    input.side === "corp" &&
    input.playerView.timingPoint === "corp_action.main" &&
    input.playerView.run === undefined &&
    investment.stateVersion === input.playerView.stateVersion &&
    candidate.actionId === investment.actionId &&
    candidate.sourceCardInstanceId === investment.sourceInstanceId &&
    candidate.sourceDefinitionId === investment.sourceDefinitionId &&
    card?.known === true &&
    card.rezzed === true &&
    card.owner === "corp" &&
    card.controller === "corp" &&
    card.definitionId === investment.sourceDefinitionId &&
    (card.counters?.bit ?? 0) === investment.storedCredits &&
    profile?.side === "corp" &&
    profile.creditsPerLoad === investment.creditsPerLoad &&
    action?.side === "corp" &&
    action.type === "activated_card_ability" &&
    action.source === investment.sourceInstanceId &&
    action.expiresAtStateVersion === investment.stateVersion &&
    action.abilityRef?.sourceCardInstanceId === investment.sourceInstanceId &&
    action.abilityRef.sourceAbilityId === profile.loadAbilityId &&
    action.payload?.cardImplementationAddsHostedCredits === true &&
    action.payload.hostedCreditAddAmount === investment.creditsPerLoad &&
    action.costs.length === 1 &&
    action.costs[0]?.clicks === 1 &&
    Object.entries(action.costs[0]).every(([key, value]) =>
      key === "clicks" ? value === 1 : key === "credits" && value === 0,
    ) &&
    action.targetRequirements.length === 0 &&
    (action.choiceRequirements?.length ?? 0) === 0
  );
}

/** Discovery owns admission. A fully known bank load that has no admitted
 * investment/funding route still needs an explicit owner rejection. The
 * presence of an Engine same-turn quote alone does not establish demand. */
export function corpHostedBankLoadRejectionEvidence(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): string | undefined {
  if (!candidate.sourceDefinitionId || !candidate.sourceCardInstanceId)
    return undefined;
  const profile = clickCreditBankProfile(candidate.sourceDefinitionId);
  const card = input.playerView.servers
    .flatMap((server) => server.root)
    .find((entry) => entry.instanceId === candidate.sourceCardInstanceId);
  if (!profile || !card) return undefined;
  return corpHostedBankLoadMatches(input, candidate, {
    actionId: candidate.actionId,
    stateVersion: input.playerView.stateVersion,
    sourceInstanceId: card.instanceId,
    sourceDefinitionId: candidate.sourceDefinitionId,
    storedCredits: card.counters?.bit ?? 0,
    creditsPerLoad: profile.creditsPerLoad,
  })
    ? "corp_hosted_bank_load_deferred_no_admitted_investment_or_funding_route"
    : undefined;
}
