import type { PlayerView, PublicGameEvent, Side, VisibleCard } from "@netgrid/shared";

import type { BoardHighlight } from "../../app/action-cues";
import {
  actionSlotCapacityForTurn,
  baseActionSlotCapacity,
  corpInstalledCardState,
  corpRootCardsForDisplay
} from "../../app/action-board-ui";

export type ServerLane = {
  kind: "ice" | "root";
  label: "ICE" | "Root";
  cards: VisibleCard[];
};

export type HighlightableBoardZone = "hq" | "rd" | "archives" | "grip" | "stack" | "heap" | "rig" | "scoreArea";

export function serverLanesForSide(side: Side, server: PlayerView["servers"][number]): ServerLane[] {
  const iceLane = { kind: "ice" as const, label: "ICE" as const, cards: server.ice };
  const rootLane = { kind: "root" as const, label: "Root" as const, cards: corpRootCardsForDisplay(side, server.id, server.root) };
  return [rootLane, iceLane];
}

export function iceStackSlotClass(card: VisibleCard): string {
  const installedState = corpInstalledCardState(card);
  return installedState === "rezzed" ? "iceCardSlot rezzedIceStackSlot" : "iceCardSlot unrezzedIceStackSlot";
}

export function opponentSide(side: Side): Side {
  return side === "runner" ? "corp" : "runner";
}

export function sideLabel(side: Side): string {
  return side === "corp" ? "Korp" : "Runner";
}

export function turnSideForView(view: PlayerView): Side | null {
  if (view.phase === "corp_draw_phase" || view.phase === "corp_action_phase") return "corp";
  if (view.phase === "runner_action_phase" || view.phase === "run") return "runner";
  return null;
}

export function turnActionHeaderLabel(view: PlayerView, side: Side, activeAiSide?: Side): string {
  const actorLabel = `${sideLabel(side)}${activeAiSide === side ? "-KI" : ""}`;
  return `Zug: ${currentTurnNumberForView(view)}  ${actorLabel} Aktionen`;
}

export function sideStatusLineForView(view: PlayerView, side: Side): string {
  if (view.pendingChoice?.side === side) return "Entscheidet";
  const turnSide = turnSideForView(view);
  if (turnSide !== side) return "Wartet";
  const choiceOwner = view.pendingChoice?.side;
  if (choiceOwner && choiceOwner !== side) return `Am Zug · ${sideLabel(choiceOwner)} entscheidet`;
  return "Am Zug";
}

export function currentTurnNumberForView(view: PlayerView): number {
  let activeSide: Side = "corp";
  let activeTurnNumber = 1;

  for (const event of view.publicEvents) {
    const actionType = typeof event.publicPayload.actionType === "string" ? event.publicPayload.actionType : event.type;
    const actor = sideFromPublicPayload(event.publicPayload.actor);
    if (!actor) continue;

    if (actionType === "mandatory_draw" && actor === "corp") {
      if (activeSide !== "corp") {
        activeSide = "corp";
        activeTurnNumber += 1;
      }
      continue;
    }

    if (actionType === "end_turn") {
      if (activeSide !== actor) activeSide = actor;
      activeSide = actor === "corp" ? "runner" : "corp";
      activeTurnNumber += 1;
    }
  }

  return activeTurnNumber;
}

export function sideFromPublicPayload(value: unknown): Side | null {
  return value === "corp" || value === "runner" ? value : null;
}

export function updateActionSlotCapacity(capacities: Record<Side, number>, side: Side, currentClicks: number, active: boolean, resetActiveSide: boolean, events: PublicGameEvent[]): void {
  const baseCapacity = baseActionSlotCapacity(side);
  const safeClicks = Math.max(0, Math.floor(currentClicks));
  const turnCapacity = active ? actionSlotCapacityForTurn(side, safeClicks, events) : safeClicks;
  if (active && resetActiveSide) {
    capacities[side] = Math.max(baseCapacity, turnCapacity);
    return;
  }
  if (active) {
    capacities[side] = Math.max(capacities[side] ?? baseCapacity, turnCapacity);
    return;
  }
  if (safeClicks > (capacities[side] ?? baseCapacity)) capacities[side] = safeClicks;
}

export function centralServerCountLabel(view: PlayerView, serverId: PlayerView["servers"][number]["id"]): string | null {
  switch (serverId) {
    case "hq":
      return formatHandLimitCount(view.side === "corp" ? view.own.gripOrHq.length : view.opponent.handCount, view.side === "corp" ? view.own.maxHandSize : view.opponent.maxHandSize);
    case "rd":
      return formatCardCount(view.side === "corp" ? view.own.stackOrRdCount : view.opponent.deckCount);
    case "archives":
      return formatCardCount(view.side === "corp" ? view.own.heapOrArchives.length : (view.opponent.discardCount ?? 0));
    default:
      return null;
  }
}

export function serverHighlighted(highlight: BoardHighlight | null, serverId: string): boolean {
  if (!highlight) return false;
  if (highlight.kind === "server" || highlight.kind === "run") return Boolean(highlight.serverId && highlight.serverId === serverId);
  return false;
}

export function zoneHighlighted(highlight: BoardHighlight | null, side: Side, zone: HighlightableBoardZone): boolean {
  return Boolean(highlight?.kind === "zone" && highlight.side === side && highlight.zone === zone);
}

export function formatCardCount(count: number): string {
  return `${count} ${count === 1 ? "Karte" : "Karten"}`;
}

export function formatHandLimitCount(count: number, limit: number): string {
  return `${count} von ${limit} Karten`;
}
