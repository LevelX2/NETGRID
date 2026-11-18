import type { CardInstanceId, GameState } from "@netgrid/shared";

/** A reference to a public position in the current view, never a card identity. */
export function hiddenVisibleCardId(
  state: GameState,
  cardId: CardInstanceId,
): CardInstanceId {
  for (const server of state.corp.servers) {
    for (const area of ["ice", "root"] as const) {
      const position = server[area].indexOf(cardId);
      if (position >= 0)
        return `h${server.id}.${area === "ice" ? "i" : "r"}${position.toString(36)}`;
    }
  }
  const zones = [
    ["hs", state.specialZones?.setAside ?? []],
    ["hx", state.specialZones?.removedFromGame ?? []],
    ["hh", state.corp.hq],
    ["hd", state.corp.rd],
    ["ha", state.corp.archives],
  ] as const;
  for (const [scope, cards] of zones) {
    const position = cards.indexOf(cardId);
    if (position >= 0) return `${scope}${position.toString(36)}`;
  }
  throw new Error("Der verdeckten Karte fehlt eine aktuelle Zonenposition.");
}

export function hiddenRunnerResourceSlotId(
  state: GameState,
  cardId: CardInstanceId,
): CardInstanceId {
  const position = state.runner.rig.resources.indexOf(cardId);
  if (position < 0)
    throw new Error("Der Resource fehlt eine aktuelle Rig-Position.");
  return `s${position.toString(36)}`;
}
