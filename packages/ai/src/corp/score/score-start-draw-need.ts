import { isRemoteServerId } from "@netgrid/shared";
import type { AiDecisionInput } from "@netgrid/shared";
import { corpRemoteHasEngineQuotedFundableScoreFriction } from "./corp-score-defense-continuity";

/** Score owns the concrete agenda-search purpose; Hand owns draw capacity. */
export function corpStartDrawAgendaSearchServerId(
  input: AiDecisionInput,
): string | undefined {
  if (
    input.playerView.own.gripOrHq.some(
      (card) => card.known && card.type === "agenda",
    ) ||
    input.playerView.servers.some(
      (server) =>
        isRemoteServerId(server.id) &&
        server.root.some((card) => card.known && card.type === "agenda"),
    )
  )
    return undefined;
  return input.playerView.servers.find(
    (server) =>
      isRemoteServerId(server.id) &&
      server.root.length === 0 &&
      (server.ice.some(
        (ice) =>
          ice.rezzed === true &&
          (ice.effectiveRunQuote?.subroutines.length ?? 0) > 0,
      ) ||
        corpRemoteHasEngineQuotedFundableScoreFriction(input, server.id, 0)),
  )?.id;
}
