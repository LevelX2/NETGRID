import { type AiDecisionInput } from "@netgrid/shared";

type PendingChoice = NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>;

export function selectedSetupMulliganChoiceOptionId(
  choice: PendingChoice,
  decision: string,
): string | undefined {
  return (
    choice.options.find((option) => option.id === decision) ?? choice.options[0]
  )?.id;
}
