import type { GameState, LegalAction, VisibleCard } from "@netgrid/shared";
import { visibleCorpCard } from "./card-view";
import { visibleEffectiveIceRunQuote } from "./visible-run-quote";

/** Exact physical relocation of already-rezzed public ICE. Unrezzed ICE
 * requires a separate move/rez projection and is intentionally unquoted. */
export function visibleMobileIceMoveQuote(
  state: GameState,
  action: LegalAction,
): string | undefined {
  const sourceId = action.source;
  const origin = state.corp.servers.find((s) => s.ice.includes(sourceId));
  const target = state.corp.servers.find(
    (s) => s.id === action.payload?.targetServerId,
  );
  const source = state.cardInstances[sourceId];
  if (
    !origin ||
    !target ||
    !source?.rezzed ||
    origin.id === target.id ||
    action.payload?.fortRunWindowAbility !==
      "move_self_to_outermost_position_on_other_fort"
  )
    return undefined;
  const credits = action.costs.reduce((n, c) => n + (c.credits ?? 0), 0);
  const path = (current: GameState): VisibleCard[] | undefined => {
    const fort = current.corp.servers.find((s) => s.id === target.id)!;
    const cards: (VisibleCard | undefined)[] = fort.ice.map((id) => {
      if (!current.cardInstances[id]?.rezzed) return undefined;
      const card = visibleCorpCard(current, id, "corp", "ice");
      const quote = card
        ? visibleEffectiveIceRunQuote(current, id, card)
        : undefined;
      return card && quote ? { ...card, effectiveRunQuote: quote } : undefined;
    });
    return cards.every((c): c is VisibleCard => c !== undefined)
      ? cards
      : undefined;
  };
  const before = path(state);
  if (!before) return undefined;
  const projected = structuredClone(state);
  projected.corp.servers.find((s) => s.id === origin.id)!.ice =
    origin.ice.filter((id) => id !== sourceId);
  projected.corp.servers.find((s) => s.id === target.id)!.ice.push(sourceId);
  projected.cardInstances[sourceId]!.zone = {
    side: "corp",
    zone: "serverIce",
    serverId: target.id,
  };
  projected.corp.credits -= credits;
  if (projected.run?.attackedServerId === target.id) {
    projected.run.position = {
      kind: "ice",
      serverId: target.id,
      iceIndex: target.ice.length,
    };
    projected.run.approachedIceId = sourceId;
    delete projected.run.encounteredIceId;
  }
  const after = path(projected);
  if (!after) return undefined;
  return JSON.stringify({
    schemaVersion: "corp-mobile-ice-move-v1",
    stateVersion: state.stateVersion,
    actionId: action.actionId,
    sourceIceInstanceId: sourceId,
    sourceServerId: origin.id,
    targetServerId: target.id,
    corpCreditsAfterMove: projected.corp.credits,
    beforeIce: before,
    afterIce: after,
  });
}
