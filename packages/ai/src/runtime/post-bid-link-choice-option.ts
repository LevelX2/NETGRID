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
        const leftDelta = Number(/\+(\d+)\s+Link/.exec(left.label)?.[1] ?? 0);
        const rightDelta = Number(/\+(\d+)\s+Link/.exec(right.label)?.[1] ?? 0);
        return (
          rightDelta - leftDelta ||
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
      })),
      ...(strongestLinkOption
        ? { fallbackOptionId: strongestLinkOption.id }
        : {}),
      ...traceContext,
    }).option ?? strongestLinkOption;
  return selected?.id;
}
