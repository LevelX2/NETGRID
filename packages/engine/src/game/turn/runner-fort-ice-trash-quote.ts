import {
  RUNNER_FORT_ICE_TRASH_QUOTE_SCHEMA_VERSION,
  type CardDefinition,
  type GameState,
  type LegalAction,
  type RunnerSuccessfulRunFortIceTrashQuote,
} from "@netgrid/shared";
import { printedCostOnPlayImplementation } from "../../ability-engine/card-implementation-runtime-shared";
import type { MakeRunEffectImplementation } from "../../ability-engine/definition-types";

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
  return runnerFortIceTrashQuote(
    state,
    state.runnerTurnFlags?.lastSuccessfulRunServerId,
    effect.tagAmount,
  );
}

/** Public ICE present now, bound to this exact prospective Run's printed effect. */
export function runnerSuccessfulRunFortIceTrashActionPayload(
  state: GameState,
  serverId: string,
  effect: MakeRunEffectImplementation,
): NonNullable<LegalAction["payload"]> {
  if (
    effect.successfulRunAccessReplacement !==
    "trash_rezzed_ice_on_fort_and_tag_runner"
  )
    return {};
  const tags = effect.successfulRunRunnerTagGain;
  if (tags === undefined || !Number.isSafeInteger(tags) || tags <= 0)
    throw new Error("runner_fort_ice_trash_quote_invalid_tags");
  return {
    ...runnerFortIceTrashQuote(state, serverId, tags),
    successfulRunAccessReplacement: effect.successfulRunAccessReplacement,
  };
}

export function runnerActiveSuccessfulRunFortIceTrashQuote(
  state: GameState,
): RunnerSuccessfulRunFortIceTrashQuote | undefined {
  const run = state.run;
  if (
    !run ||
    run.successfulRunAccessReplacement !==
      "trash_rezzed_ice_on_fort_and_tag_runner"
  )
    return undefined;
  const tags = run.successfulRunRunnerTagGain;
  const sourceCardInstanceId = run.successfulRunSourceCardId;
  if (
    !sourceCardInstanceId ||
    tags === undefined ||
    !Number.isSafeInteger(tags) ||
    tags <= 0
  )
    throw new Error(
      "runner_active_fort_ice_trash_quote_missing_source_or_tags",
    );
  const quote = runnerFortIceTrashQuote(state, run.attackedServerId, tags);
  return {
    schemaVersion: quote.runnerFortIceTrashQuoteSchemaVersion,
    runId: run.runId,
    stateVersion: quote.runnerFortIceTrashQuoteStateVersion,
    serverId: run.attackedServerId,
    sourceCardInstanceId,
    rezzedIceCount: quote.runnerFortIceTrashRezzedIceCount,
    tagsAdded: quote.runnerFortIceTrashTagsAdded,
  };
}

function runnerFortIceTrashQuote(
  state: GameState,
  serverId: string | undefined,
  tags: number,
) {
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
    runnerFortIceTrashTagsAdded: tags,
  };
}
