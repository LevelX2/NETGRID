import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { clickCreditBankProfile } from "../../plans/credit-bank-investment";
import type { CorpHostedBankInvestment } from "./economy-types";

/** Current native load only. Canonical bank facts authorize a projection,
 * never an invented future action or future liquid-credit guarantee. */
export function corpHostedBankLoadMatches(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  investment: CorpHostedBankInvestment,
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
