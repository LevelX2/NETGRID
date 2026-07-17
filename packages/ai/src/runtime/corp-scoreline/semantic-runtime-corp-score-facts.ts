import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { visibleCardDefinition } from "../card-definition-lookup";

export type CorpPreparedScoreRemotePipeline = {
  serverId: string;
  iceCount: number;
  unrezzedRezCost: number;
  reserveFloor: number;
};

export function corpPreparedScoreRemotePipeline(
  input: AiDecisionInput,
): CorpPreparedScoreRemotePipeline | undefined {
  return input.playerView.servers
    .filter(
      (server) =>
        server.id.startsWith("remote_") &&
        server.root.length === 0 &&
        server.ice.length > 0,
    )
    .map((server) => {
      const unrezzedRezCost = corpVisibleUnrezzedRezCost(server.ice);
      return {
        serverId: server.id,
        iceCount: server.ice.length,
        unrezzedRezCost,
        reserveFloor: Math.min(8, Math.max(3, unrezzedRezCost + 2)),
      };
    })
    .sort(
      (left, right) =>
        right.iceCount - left.iceCount ||
        right.reserveFloor - left.reserveFloor ||
        left.serverId.localeCompare(right.serverId),
    )[0];
}

export function corpHqAgendaCount(input: AiDecisionInput): number {
  return input.playerView.own.gripOrHq.filter(
    (card) => card.known !== false && visibleCardIsAgenda(card),
  ).length;
}

export function corpVisibleUnrezzedRezCost(
  ice: readonly VisibleCard[],
): number {
  return ice
    .filter((card) => card.known !== false && card.rezzed !== true)
    .reduce((sum, card) => {
      const definition = visibleCardDefinition(card);
      const rezCost =
        positiveOrZeroNumber(card.rezCost) ??
        positiveOrZeroNumber(definition?.rezCost) ??
        0;
      return sum + rezCost;
    }, 0);
}

function positiveOrZeroNumber(value: number | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

function visibleCardIsAgenda(card: VisibleCard): boolean {
  return (
    card.type === "agenda" || visibleCardDefinition(card)?.type === "agenda"
  );
}
