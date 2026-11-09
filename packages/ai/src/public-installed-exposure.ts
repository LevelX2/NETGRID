import type { PlayerView, PublicGameEvent } from "@netgrid/shared";
import { PlanResolutionFailure } from "./plans/plan-resolution-failure";

export type PublicInstalledExposure = Readonly<{
  serverId: string;
  positionKey: string;
  definitionId: string;
}>;

/** Projects only the Engine's aligned public multi-expose observation facts. */
export function publicInstalledExposures(
  playerView: PlayerView,
  event: PublicGameEvent,
): readonly PublicInstalledExposure[] {
  const payload = event.publicPayload;
  const multiExposeFamilies = [
    "multi_expose_installed_corp_cards",
    "expose_installed_cards_single_fort",
    "v1911_expose_outermost_ice_each_data_fort",
  ];
  if (
    payload.revealKind !== "expose" ||
    !multiExposeFamilies.includes(String(payload.hiddenZoneAction))
  ) {
    return [];
  }
  const fail = (): never => {
    throw new PlanResolutionFailure("invalid_player_view_card_projection", {
      side: playerView.side,
      stateVersion: playerView.stateVersion,
      timingPoint: playerView.timingPoint,
      legalActionTypes: [],
      owner: "rules_contract",
      removalCondition: `Publish aligned public definition, server and installed-position bindings for expose event ${event.eventId}.`,
    });
  };
  const definitions = payload.publicRevealDefinitionIds;
  const servers = payload.exposedServerIds;
  const positions = payload.exposedPositionKeys;
  // A completed zero-target effect has no observation requiring a location.
  if (payload.revealedCount === 0) {
    if (
      [definitions, servers, positions].some(
        (value) => value !== undefined && value !== "",
      )
    )
      return fail();
    return [];
  }
  if (
    typeof definitions !== "string" ||
    typeof servers !== "string" ||
    typeof positions !== "string"
  ) {
    return fail();
  }
  const definitionIds = definitions === "" ? [] : definitions.split(",");
  const serverIds = servers === "" ? [] : servers.split(",");
  const positionKeys = positions === "" ? [] : positions.split(",");
  if (
    definitionIds.length !== serverIds.length ||
    definitionIds.length !== positionKeys.length ||
    (payload.revealedCount !== undefined &&
      payload.revealedCount !== definitionIds.length)
  ) {
    return fail();
  }
  const seen = new Set<string>();
  return definitionIds.map((definitionId, index) => {
    const serverId = serverIds[index]!;
    const positionKey = positionKeys[index]!;
    const key = `${serverId}:${positionKey}`;
    if (
      !definitionId ||
      definitionId.trim() !== definitionId ||
      !/^(hq|rd|archives|remote_\d+)$/.test(serverId) ||
      !/^(ice|root):\d+$/.test(positionKey) ||
      seen.has(key)
    ) {
      return fail();
    }
    seen.add(key);
    return { serverId, positionKey, definitionId };
  });
}
