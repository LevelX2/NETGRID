import { type AiDecisionInput } from "@netgrid/shared";

import { selectEfficientPostBidLinkOption } from "../trace-bid-efficiency";
import { type LatestTraceContext } from "./trace-context";

type PendingChoice = NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>;

export function selectedPostBidLinkChoiceOptionId(
  choice: PendingChoice,
  traceContext: LatestTraceContext,
): string | undefined {
  const strongestLinkOption =
    choice.options
      .filter((option) => option.id.startsWith("trace_link_"))
      .sort((left, right) => {
        const leftDelta = postBidTraceLinkDelta(left);
        const rightDelta = postBidTraceLinkDelta(right);
        return (
          (rightDelta ?? 0) - (leftDelta ?? 0) ||
          left.label.localeCompare(right.label, "de")
        );
      })[0] ??
    choice.options.find((option) => option.id === "pass") ??
    choice.options[0];
  const selected =
    selectEfficientPostBidLinkOption({
      options: choice.options.map((option) => ({
        id: option.id,
        label: option.label,
        ...postBidTraceLinkOptionDelta(option),
      })),
      ...(strongestLinkOption
        ? { fallbackOptionId: strongestLinkOption.id }
        : {}),
      ...traceContext,
    }).option ?? strongestLinkOption;
  return selected?.id;
}

function postBidTraceLinkDelta(
  option: PendingChoice["options"][number],
): number | undefined {
  const delta = option.metadata?.postBidTraceLinkDelta;
  return typeof delta === "number" && Number.isInteger(delta) && delta > 0
    ? delta
    : undefined;
}

function postBidTraceLinkOptionDelta(
  option: PendingChoice["options"][number],
): { linkDelta: number } | Record<string, never> {
  const delta = postBidTraceLinkDelta(option);
  return delta !== undefined ? { linkDelta: delta } : {};
}
