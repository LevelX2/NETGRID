// ARCH-6 read-only View-Helfer.
// Keine State-Mutation, keine LegalAction-Erzeugung, kein Import aus index.ts,
// keine PublicPayload-Vertragsaenderung.
import type { GameState, ServerId } from "@netgrid/shared";

export function publicServerLabel(
  state: GameState,
  serverId: unknown,
): string | undefined {
  if (typeof serverId !== "string") return undefined;
  if (serverId === "new_remote") return "neuem Remote";
  return state.corp.servers.find((server) => server.id === serverId)?.label;
}

export function serverChoiceDisplayLabel(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): string {
  const label = publicServerLabel(state, serverId) ?? serverId;
  const remote = /^Remote\s+(\d+)$/i.exec(label.trim());
  return remote?.[1] ? `Remote ${remote[1]}` : label;
}

export function publicServerLabelForCard(
  state: GameState,
  cardId: string | undefined,
): string | undefined {
  if (!cardId) return undefined;
  const zone = state.cardInstances[cardId]?.zone;
  const serverId = zone && "serverId" in zone ? zone.serverId : undefined;
  return publicServerLabel(state, serverId);
}