import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";

import { allocateCorpCentralDefenseFromAiFacts } from "./corp-central-defense-facts-adapter";
import {
  actionIceRezSupportLiability,
  definitionHasActionIceRezSupport,
} from "./corp-defense-rez-support-facts";

export type CorpDefensePackageRetentionPair = Readonly<{
  iceInstanceId: string;
  supportInstanceId: string;
  bonus: number;
}>;

export function corpDefensePackageRetentionPairs(
  input: AiDecisionInput,
  retainedCards: readonly VisibleCard[],
): CorpDefensePackageRetentionPair[] {
  if (input.side !== "corp" || retainedCards.length < 2) return [];
  const allocation = allocateCorpCentralDefenseFromAiFacts({ input });
  if (allocation.status !== "known") return [];
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
    return [];
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
      typeof card.definitionId === "number" &&
      definitionHasActionIceRezSupport(card.definitionId),
  );
  return ice.flatMap((iceCard) =>
    supports.flatMap((support) => {
      const liability = actionIceRezSupportLiability(support.definitionId!);
      if (!liability) return [];
      const penalty =
        liability === "temporary" ? 60 : liability === "installment" ? 40 : 0;
      return [
        {
          iceInstanceId: iceCard.instanceId,
          supportInstanceId: support.instanceId,
          bonus: 330 + Math.min(8, iceCard.rezCost!) * 10 - penalty,
        },
      ];
    }),
  );
}
