import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";

import { allocateCorpCentralDefenseFromAiFacts } from "./corp-central-defense-facts-adapter";
import {
  actionIceRezSupportLiability,
  definitionHasActionIceRezSupport,
} from "./corp-defense-rez-support-facts";

export type CorpDefensePackageRetentionQuote = Readonly<{
  bonus: number;
  evidenceCode: string;
}>;

const NO_PACKAGE_QUOTE: CorpDefensePackageRetentionQuote = {
  bonus: 0,
  evidenceCode: "corp_defense_package_retention_not_applicable",
};

export function quoteCorpDefensePackageRetention(
  input: AiDecisionInput,
  retainedCards: readonly VisibleCard[],
): CorpDefensePackageRetentionQuote {
  if (input.side !== "corp" || retainedCards.length < 2) {
    return NO_PACKAGE_QUOTE;
  }
  const allocation = allocateCorpCentralDefenseFromAiFacts({ input });
  if (allocation.status !== "known") return NO_PACKAGE_QUOTE;
  const serverId = allocation.selectedServerId;
  const evidence = allocation.evidence[serverId];
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (
    !server ||
    server.ice.length > 0 ||
    (evidence.threat !== "acute" &&
      evidence.threat !== "terminal" &&
      evidence.recentSuccessfulAccessRunnerTurns === 0)
  ) {
    return NO_PACKAGE_QUOTE;
  }
  const ice = retainedCards.filter(
    (card) =>
      card.known &&
      card.type === "ice" &&
      typeof card.rezCost === "number" &&
      Number.isSafeInteger(card.rezCost) &&
      card.rezCost > 0,
  );
  const supports = retainedCards.filter(
    (card) =>
      card.known &&
      typeof card.definitionId === "string" &&
      definitionHasActionIceRezSupport(card.definitionId),
  );
  let best:
    | {
        ice: VisibleCard;
        support: VisibleCard;
        liability: NonNullable<ReturnType<typeof actionIceRezSupportLiability>>;
        bonus: number;
      }
    | undefined;
  for (const iceCard of ice) {
    for (const support of supports) {
      const liability = actionIceRezSupportLiability(support.definitionId!);
      if (!liability) continue;
      const liabilityPenalty =
        liability === "temporary" ? 60 : liability === "installment" ? 40 : 0;
      const bonus = 330 + Math.min(8, iceCard.rezCost!) * 10 - liabilityPenalty;
      if (
        !best ||
        bonus > best.bonus ||
        (bonus === best.bonus &&
          `${iceCard.instanceId}:${support.instanceId}` <
            `${best.ice.instanceId}:${best.support.instanceId}`)
      ) {
        best = { ice: iceCard, support, liability, bonus };
      }
    }
  }
  return best
    ? {
        bonus: best.bonus,
        evidenceCode: `corp_defense_package_retention:${serverId}:${best.liability}:ice_rez_${best.ice.rezCost}:bonus_${best.bonus}`,
      }
    : NO_PACKAGE_QUOTE;
}
