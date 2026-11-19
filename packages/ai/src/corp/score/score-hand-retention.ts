import {
  planningCardByDefinitionId,
  planningCardFactsByDefinitionId,
} from "@netgrid/cards/planning";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { corpFixedOperationPlayCredits } from "../../runtime/corp-canonical-card-facts";

/** The cleanup comparison can price plain action bursts as a group. More
 * complex conversion effects keep their existing per-card disposition. */
export function fixedCorpScoreActionBurst(definitionId: number) {
  const credits = corpFixedOperationPlayCredits(definitionId);
  if (credits === undefined) return undefined;
  const abilities =
    planningCardByDefinitionId(definitionId)?.engine.abilities;
  if (abilities?.length !== 1) return undefined;
  const [ability] = abilities;
  if (
    ability?.kind !== "on_play" ||
    ability.costs !== "printed" ||
    ability.condition !== undefined ||
    ability.effects.length !== 1
  )
    return undefined;
  const [effect] = ability.effects;
  return effect?.kind === "gain_actions" &&
    effect.recipient === "corp" &&
    effect.amount > 1
    ? { credits, netActions: effect.amount - 1 }
    : undefined;
}

/** Bounded retention estimate. Ordinary advance/install costs, no extra
 * funding and no claim that the Runner will leave an agenda alone. */
export function prepareCorpScoreHandRetention(input: AiDecisionInput) {
  const { own, servers, agendaPointsToWin } = input.playerView;
  const credits =
    own.credits -
    (own.installRezOnlyCredits ?? 0) -
    (own.corpEndTurnCreditObligation?.creditsDue ?? 0);
  const installed = servers
    .filter((server) => server.id !== "archives")
    .flatMap((server) => server.root);
  const burstsByInstance = new Map(
    own.gripOrHq.flatMap((card) => {
      const burst =
        card.known && card.definitionId
          ? fixedCorpScoreActionBurst(card.definitionId)
          : undefined;
      return burst && burst.credits <= credits
        ? [[card.instanceId, burst] as const]
        : [];
    }),
  );
  const available = burstsByInstance.size > 0;
  return (remainingHq: readonly VisibleCard[]): number => {
    if (!available) return 0;
    const bursts = remainingHq.flatMap((card) => {
      const burst = burstsByInstance.get(card.instanceId);
      return burst ? [burst] : [];
    });
    if (bursts.length === 0) return 0;
    let value = 0;
    function considerAgenda(card: VisibleCard, installClicks: number) {
      const definition = card.definitionId
        ? planningCardFactsByDefinitionId(card.definitionId)
        : undefined;
      if (
        !card.known ||
        definition?.type !== "agenda" ||
        card.advancementRequirement === undefined
      )
        return;
      const advances = Math.max(
        0,
        card.advancementRequirement - (card.advancementCounters ?? 0),
      );
      const clicks = advances + installClicks;
      const points = card.agendaPoints ?? definition.agendaPoints;
      const matchpoint =
        points !== undefined && own.agendaPoints + points >= agendaPointsToWin;
      if (clicks <= 3) return;
      for (const [index, first] of bursts.entries()) {
        // One retained burst can advance a longer score setup. Redundant
        // copies have no further value unless they open a funded closeout.
        // An unsupported HQ agenda only provides a small development option.
        if (
          first.credits +
            Math.min(advances, 3 + first.netActions - installClicks) <=
          credits
        )
          value = Math.max(value, installClicks === 0 ? 180 : 70);
        if (
          3 + first.netActions >= clicks &&
          first.credits + advances <= credits
        ) {
          value = Math.max(value, matchpoint ? 660 : 440);
          continue;
        }
        if (
          bursts
            .slice(index + 1)
            .some(
              (second) =>
                3 + first.netActions + second.netActions >= clicks &&
                first.credits + second.credits + advances <= credits,
            )
        )
          value = Math.max(value, matchpoint ? 660 : 440);
      }
    }
    for (const card of installed) considerAgenda(card, 0);
    for (const card of remainingHq) considerAgenda(card, 1);
    return value;
  };
}
