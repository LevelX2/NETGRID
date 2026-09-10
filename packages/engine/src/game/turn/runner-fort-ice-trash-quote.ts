import {
  RUNNER_FORT_ICE_TRASH_QUOTE_SCHEMA_VERSION,
  type CardDefinition,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import { printedCostOnPlayImplementation } from "../../ability-engine/card-implementation-runtime-shared";

/** The same current, public rezzed-ICE set consumed by the on-play effect. */
export function runnerFortIceTrashActionPayload(
  state: GameState,
  definition: CardDefinition,
): NonNullable<LegalAction["payload"]> {
  const effects = printedCostOnPlayImplementation(definition)?.effects ?? [];
  const effect = effects.find(
    (entry) =>
      entry.kind ===
      "trash_rezzed_ice_on_last_successful_run_fort_and_add_tags",
  );
  if (!effect) return {};
  const serverId = state.runnerTurnFlags?.lastSuccessfulRunServerId;
  const server = state.corp.servers.find((entry) => entry.id === serverId);
  if (!server)
    throw new Error("runner_fort_ice_trash_quote_missing_successful_fort");
  return {
    runnerFortIceTrashQuoteSchemaVersion:
      RUNNER_FORT_ICE_TRASH_QUOTE_SCHEMA_VERSION,
    runnerFortIceTrashQuoteStateVersion: state.stateVersion,
    runnerFortIceTrashServerId: server.id,
    runnerFortIceTrashRezzedIceCount: server.ice.filter((id) => {
      const card = state.cardInstances[id];
      if (!card)
        throw new Error("runner_fort_ice_trash_quote_missing_ice_instance");
      return card.rezzed === true;
    }).length,
    runnerFortIceTrashTagsAdded: effect.tagAmount,
  };
}
