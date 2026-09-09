import type {
  AiDecisionInput,
  CorpRestrictedCreditBankQuote,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";

export type CorpRestrictedRezPreparation = {
  actionId: string;
  bank: CorpRestrictedCreditBankQuote;
  targetIceInstanceId: string;
  targetServerId: string;
  requiredRezCredits: number;
  creditCost: number;
  clickCost: number;
  capacityGain: number;
  generalCreditsAfterPreparation: number;
  remainingGeneralCreditGap: number;
  horizon: "next_runner_turn_rez_window";
  setupRoute?: NonNullable<
    CorpRestrictedCreditBankQuote["setupRoutes"]
  >[number];
};

export function currentCorpRestrictedCreditBanks(
  input: AiDecisionInput,
): CorpRestrictedCreditBankQuote[] {
  return input.playerView.servers.flatMap((server) =>
    server.root.flatMap((card) => {
      const quote = card.restrictedCreditBankQuote;
      return card.known &&
        card.rezzed === true &&
        quote &&
        quote.sourceCardInstanceId === card.instanceId &&
        quote.serverId === server.id &&
        quote.expiresAtStateVersion === input.playerView.stateVersion &&
        quote.advancementCounters === card.advancementCounters
        ? [quote]
        : [];
    }),
  );
}

export function corpRestrictedRezPreparationCandidates(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  target: {
    targetIceInstanceId: string;
    targetServerId: string;
    requiredRezCredits: number;
  },
): CorpRestrictedRezPreparation[] {
  if (
    input.playerView.timingPoint !== "corp_action.main" ||
    input.playerView.run
  )
    return [];
  const existingBankPreparations = currentCorpRestrictedCreditBanks(
    input,
  ).flatMap((bank) => {
    // One prepared payout for this one consumer. Do not keep stockpiling counters.
    if (
      bank.advancementCounters !== 0 ||
      bank.generalCreditsAvailable !== input.playerView.own.credits
    )
      return [];
    return candidates.flatMap((candidate) => {
      const action = input.legalActions.find(
        (action) => action.actionId === candidate.actionId,
      );
      if (
        action?.type !== "advance_card" ||
        action.source !== bank.sourceCardInstanceId ||
        action.expiresAtStateVersion !== input.playerView.stateVersion ||
        action.targetRequirements.length > 0 ||
        (action.choiceRequirements?.length ?? 0) > 0 ||
        candidate.costProfile.costKnownStatus !== "known" ||
        candidate.costProfile.additionalCosts.length > 0
      )
        return [];
      const creditCost = candidate.costProfile.creditCost;
      const clickCost = candidate.costProfile.clickCost;
      if (
        typeof creditCost !== "number" ||
        !Number.isSafeInteger(creditCost) ||
        creditCost < 0 ||
        typeof clickCost !== "number" ||
        !Number.isSafeInteger(clickCost) ||
        clickCost <= 0 ||
        creditCost > bank.generalCreditsAvailable ||
        clickCost > input.playerView.own.clicks
      )
        return [];
      const afterGeneral = bank.generalCreditsAvailable - creditCost;
      const afterCapacity = afterGeneral + bank.creditsPerCounter;
      const capacityGain =
        Math.min(target.requiredRezCredits, afterCapacity) -
        Math.min(target.requiredRezCredits, bank.generalCreditsAvailable);
      const remainingGeneralCreditGap = Math.max(
        0,
        target.requiredRezCredits - afterCapacity,
      );
      const basicCreditAvailable = candidates.some((entry) => {
        const head = input.legalActions.find(
          (legal) => legal.actionId === entry.actionId,
        );
        return (
          head?.type === "gain_credit" &&
          head.expiresAtStateVersion === input.playerView.stateVersion &&
          entry.economyProjection?.reliability === "guaranteed" &&
          entry.economyProjection.netLiquidCreditGain === 1 &&
          entry.costProfile.clickCost === 1 &&
          entry.costProfile.creditCost === 0
        );
      });
      // Compare one preparation to the same clicks spent gaining general credits.
      // The remaining finite gap may use the remaining normal clicks. This is
      // conditional capacity, never a bound future invocation or liquid payout.
      if (
        !Number.isSafeInteger(afterCapacity) ||
        !Number.isSafeInteger(capacityGain) ||
        (remainingGeneralCreditGap > 0 &&
          (!basicCreditAvailable ||
            remainingGeneralCreditGap >
              input.playerView.own.clicks - clickCost)) ||
        capacityGain <= clickCost
      )
        return [];
      return [
        {
          actionId: action.actionId,
          bank,
          ...target,
          creditCost,
          clickCost,
          capacityGain,
          generalCreditsAfterPreparation: afterGeneral,
          remainingGeneralCreditGap,
          horizon: "next_runner_turn_rez_window" as const,
        },
      ];
    });
  });
  const initialPreparations = input.playerView.servers.flatMap((server) =>
    server.root.flatMap((card) => {
      const bank = card.restrictedCreditBankQuote;
      if (
        !card.known ||
        card.rezzed ||
        !bank ||
        bank.sourceCardInstanceId !== card.instanceId ||
        bank.serverId !== server.id ||
        bank.expiresAtStateVersion !== input.playerView.stateVersion ||
        bank.advancementCounters !== card.advancementCounters ||
        bank.generalCreditsAvailable !== input.playerView.own.credits
      )
        return [];
      return (bank.setupRoutes ?? [])
        .flatMap((setupRoute) => {
          const action = input.legalActions.find(
            (action) => action.actionId === setupRoute.headActionId,
          );
          const candidate = candidates.find(
            (candidate) => candidate.actionId === action?.actionId,
          );
          if (
            !action ||
            !candidate ||
            action.type !== setupRoute.headKind ||
            action.source !== card.instanceId ||
            action.expiresAtStateVersion !== input.playerView.stateVersion ||
            action.targetRequirements.length > 0 ||
            (action.choiceRequirements?.length ?? 0) > 0 ||
            candidate.costProfile.costKnownStatus !== "known" ||
            candidate.costProfile.additionalCosts.length > 0
          )
            return [];
          const creditCost = candidate.costProfile.creditCost;
          const clickCost = candidate.costProfile.clickCost;
          if (
            typeof creditCost !== "number" ||
            typeof clickCost !== "number" ||
            setupRoute.setupCredits > bank.generalCreditsAvailable ||
            setupRoute.setupClicks > input.playerView.own.clicks
          )
            return [];
          const afterCapacity =
            setupRoute.remainingGeneralCredits +
            setupRoute.targetCounters * bank.creditsPerCounter;
          const capacityGain =
            Math.min(target.requiredRezCredits, afterCapacity) -
            Math.min(target.requiredRezCredits, bank.generalCreditsAvailable);
          // A complete affordable prefix must fund this exact Defense consumer and
          // outperform the same clicks spent gaining credits. Stored counters are
          // conditional future capacity; no payout or future action is bound here.
          if (
            !Number.isSafeInteger(afterCapacity) ||
            afterCapacity < target.requiredRezCredits ||
            capacityGain <= setupRoute.setupClicks
          )
            return [];
          return [
            {
              actionId: action.actionId,
              bank,
              ...target,
              creditCost,
              clickCost,
              capacityGain,
              generalCreditsAfterPreparation:
                setupRoute.remainingGeneralCredits,
              remainingGeneralCreditGap: 0,
              horizon: "next_runner_turn_rez_window" as const,
              setupRoute,
            },
          ];
        })
        .sort(
          (a, b) =>
            a.setupRoute.setupClicks - b.setupRoute.setupClicks ||
            a.setupRoute.setupCredits - b.setupRoute.setupCredits,
        )
        .slice(0, 1);
    }),
  );
  return [...existingBankPreparations, ...initialPreparations];
}
