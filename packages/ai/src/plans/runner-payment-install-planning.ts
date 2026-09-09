import { planningCardByDefinitionId } from "@netgrid/cards/planning";
import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { PaymentWindowFundingSetup } from "./funding-route";

/** Compile a visible install's unconditional, single-use payment capability.
 * This describes a future run window; it never supplies a LegalAction for it. */
export function runnerPaymentInstallSetups(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): PaymentWindowFundingSetup[] {
  if (input.playerView.side !== "runner") return [];
  return candidates.flatMap((candidate) => {
    const source = input.playerView.own.gripOrHq.find(
      (card) =>
        card.instanceId === candidate.sourceCardInstanceId &&
        card.definitionId === candidate.sourceDefinitionId &&
        card.known &&
        card.type === "resource" &&
        card.subtypes?.includes("hidden"),
    );
    const cost = candidate.costProfile;
    const legal = input.legalActions.find(
      (action) => action.actionId === candidate.actionId,
    );
    if (
      !source?.definitionId ||
      !legal ||
      legal.type !== "install_card" ||
      candidate.semanticActionType !== "install.card" ||
      legal.expiresAtStateVersion !== input.playerView.stateVersion ||
      cost.costKnownStatus !== "known" ||
      cost.additionalCosts.length > 0 ||
      !Number.isSafeInteger(cost.creditCost) ||
      cost.creditCost! < 0 ||
      !Number.isSafeInteger(cost.clickCost) ||
      cost.clickCost! <= 0 ||
      cost.variableCost ||
      cost.selfDamage?.length ||
      cost.selfTag ||
      cost.discardCost ||
      cost.trashCost ||
      cost.forfeitAgenda ||
      cost.hostedCreditCost ||
      cost.agendaPointCost
    )
      return [];
    const card = planningCardByDefinitionId(source.definitionId);
    if (card?.side !== "runner") return [];
    const capabilities = card.prospectiveCapabilities.capabilities;
    // Other install choices, liabilities or lifecycle outcomes need their own
    // projection before this can be a guaranteed setup.
    if (
      capabilities.some(
        (capability) =>
          capability.installChoices.length > 0 ||
          capability.liabilities.length > 0,
      ) ||
      Object.values(card.engine.lifecycle ?? {}).some((effects) =>
        Array.isArray(effects) ? effects.length > 0 : effects === true,
      )
    )
      return [];
    const setups = capabilities.flatMap(
      (capability): PaymentWindowFundingSetup[] => {
        const descriptor = (suffix: string) =>
          capability.descriptors.find((entry) => entry.path.endsWith(suffix))
            ?.value;
        if (
          capability.identity.kind !== "keyed" ||
          capability.transition.kind !== "install" ||
          capability.initialConditionEvaluation.state !== "not_applicable" ||
          descriptor(".kind") !== "activated" ||
          descriptor(".timing") !== "runner_cost_penalty_support" ||
          capability.descriptors.some(
            (entry) =>
              ![".kind", ".timing", ".costs", ".effects"].some((suffix) =>
                entry.path.endsWith(suffix),
              ),
          )
        )
          return [];
        const costs = descriptor(".costs");
        const effects = descriptor(".effects");
        if (
          !Array.isArray(costs) ||
          costs.length !== 2 ||
          !Array.isArray(effects) ||
          effects.length !== 1
        )
          return [];
        const credit = costs.find((entry) => entry?.kind === "credit");
        const trash = costs.find((entry) => entry?.kind === "trash_source");
        const gain = effects[0];
        if (
          !credit ||
          !trash ||
          trash.amount !== 1 ||
          !Number.isSafeInteger(credit.amount) ||
          credit.amount < 0 ||
          gain?.kind !== "gain_credits" ||
          gain.recipient !== "runner" ||
          !Number.isSafeInteger(gain.amount) ||
          gain.amount <= credit.amount
        )
          return [];
        return [
          {
            actionId: candidate.actionId,
            sourceCardInstanceId: source.instanceId,
            sourceDefinitionId: source.definitionId!,
            capabilityId: capability.identity.canonicalCapabilityId,
            installClickCost: cost.clickCost!,
            installCreditCost: cost.creditCost!,
            activationCreditCost: credit.amount,
            netPaymentGain: gain.amount - credit.amount,
            evidence: [
              "runner_payment_install_same_turn_setup",
              `payment_source:${source.instanceId}`,
              `payment_capability:${capability.identity.canonicalCapabilityId}`,
              "payment_source_consumed_once",
            ],
          },
        ];
      },
    );
    // Alternative abilities on a consumed source cannot fund separate steps.
    return setups
      .sort(
        (a, b) =>
          b.netPaymentGain - a.netPaymentGain ||
          a.capabilityId.localeCompare(b.capabilityId),
      )
      .slice(0, 1);
  });
}
