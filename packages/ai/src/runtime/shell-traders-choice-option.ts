import { type AiDecisionInput } from "@netgrid/shared";

type PendingChoice = NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>;

export function selectedShellTradersStartTurnChoiceOptionId(
  choice: PendingChoice,
): string | undefined {
  return (
    choice.options.slice().sort((left, right) => {
      const leftCounter = Number(
        /\((\d+)\)\s*$/.exec(left.label)?.[1] ?? Number.MAX_SAFE_INTEGER,
      );
      const rightCounter = Number(
        /\((\d+)\)\s*$/.exec(right.label)?.[1] ?? Number.MAX_SAFE_INTEGER,
      );
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
