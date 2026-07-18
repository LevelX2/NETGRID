import { type AiDecisionInput } from "@netgrid/shared";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;

export function selectedShellTradersStartTurnChoiceOptionId(
  choice: PendingChoice,
): string | undefined {
  return (
    choice.options.slice().sort((left, right) => {
      const leftCounter = delayedInstallRemainingCounters(left);
      const rightCounter = delayedInstallRemainingCounters(right);
      const leftProgramBias = left.card?.type === "program" ? -1 : 0;
      const rightProgramBias = right.card?.type === "program" ? -1 : 0;
      return (
        leftCounter - rightCounter ||
        leftProgramBias - rightProgramBias ||
        left.label.localeCompare(right.label, "de")
      );
    })[0] ?? choice.options[0]
  )?.id;
}

function delayedInstallRemainingCounters(
  option: PendingChoice["options"][number],
): number {
  const value = option.metadata?.delayedInstallRemainingCounters;
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : Number.MAX_SAFE_INTEGER;
}
