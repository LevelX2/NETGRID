import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { AI_HINTS_BY_CARD } from "../ai-hints";
import { runnerHandTextHasVisibleThreatSignal } from "./hand-development/runner-hand-text-signals";

export function visibleRunnerThreat(input: AiDecisionInput): boolean {
  if ((input.playerView.own.tags ?? 0) > 0) return true;
  return input.playerView.servers.some((server) =>
    [...server.root, ...server.ice].some(visibleCardShowsRunnerThreat),
  );
}

export function visibleRunnerTraceThreat(input: AiDecisionInput): boolean {
  return input.playerView.servers.some((server) =>
    [...server.root, ...server.ice].some(visibleCardShowsTraceThreat),
  );
}

export function visibleRunnerTraceThreatOnServer(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  const server = input.playerView.servers.find(
    (entry) => entry.id === serverId,
  );
  return (
    server !== undefined &&
    [...server.root, ...server.ice].some(visibleCardShowsTraceThreat)
  );
}

export function visibleRunnerTagThreat(input: AiDecisionInput): boolean {
  return input.playerView.servers.some((server) =>
    [...server.root, ...server.ice].some(
      (card) =>
        card.known === true &&
        card.rezzed === true &&
        (card.effectiveRunQuote?.subroutines.some(
          (subroutine) =>
            subroutine.type === "give_runner_tag" ||
            (subroutine.type === "initiate_trace" &&
              subroutine.traceSuccessEffect !== undefined &&
              [
                "add_tag",
                "add_tags_by_trace_margin_over_runner_link",
                "add_tag_and_counter",
                "trash_runner_resource_and_add_tag",
              ].includes(subroutine.traceSuccessEffect.type)),
        ) === true ||
          (card.definitionId !== undefined &&
            AI_HINTS_BY_CARD.get(card.definitionId)?.functionSignals?.includes(
              "tag.source",
            ) === true)),
    ),
  );
}

function visibleCardShowsTraceThreat(card: VisibleCard): boolean {
  return (
    card.known === true &&
    card.rezzed === true &&
    (card.effectiveRunQuote?.subroutines.some(
      (subroutine) => subroutine.type === "initiate_trace",
    ) === true ||
      (card.definitionId !== undefined &&
        AI_HINTS_BY_CARD.get(card.definitionId)?.functionSignals?.includes(
          "trace.source",
        ) === true))
  );
}

function visibleCardShowsRunnerThreat(card: VisibleCard): boolean {
  if (!card.known) return false;
  return runnerHandTextHasVisibleThreatSignal(
    [card.title, card.rulesText, card.definitionId, ...(card.subtypes ?? [])]
      .filter((entry): entry is string => typeof entry === "string")
      .join(" "),
  );
}
