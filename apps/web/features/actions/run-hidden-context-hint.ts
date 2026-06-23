import type { LegalAction, PlayerView } from "@netgrid/shared";

import { encounterBreakerActions, runCurrentIceLabel } from "../../app/action-board-ui";

export function runHiddenContextActionHint(view: PlayerView, contextualActions: LegalAction[]): string | null {
  if (view.run?.phase !== "encounter_ice") return null;
  const breakerActions = encounterBreakerActions(view, contextualActions);
  if (breakerActions.length === 0) return null;
  const runnerRig = view.side === "runner" ? (view.own.rig ?? []) : (view.opponent.rig ?? []);
  const breakerIds = new Set(
    breakerActions
      .map((action) => (typeof action.payload?.breakerId === "string" ? action.payload.breakerId : action.source))
      .filter((id): id is string => typeof id === "string" && id !== "basic_action" && id !== "game_rule")
  );
  const breakerNames = runnerRig
    .filter((card) => breakerIds.has(card.instanceId))
    .map((card) => card.title)
    .filter((title): title is string => Boolean(title));
  const uniqueNames = Array.from(new Set(breakerNames));
  const target = runCurrentIceLabel(view) ?? "dieses ICE";
  if (uniqueNames.length === 1) return `Eisbrecher verfügbar: Wähle ${uniqueNames[0]} im Rig für Aktionen gegen ${target}.`;
  if (uniqueNames.length > 1) return `Eisbrecher verfügbar: Wähle ${uniqueNames.slice(0, 2).join(" oder ")} im Rig für Aktionen gegen ${target}.`;
  return `Eisbrecher verfügbar: Wähle den passenden Eisbrecher im Rig für Aktionen gegen ${target}.`;
}
