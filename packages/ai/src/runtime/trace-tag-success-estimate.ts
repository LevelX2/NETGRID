import { type AiDecisionInput } from "@netgrid/shared";

export function traceTagExpectedSuccessEstimate(
  input: AiDecisionInput,
): number {
  if (input.side !== "corp") return 0;
  if (input.playerView.own.credits >= input.playerView.opponent.credits + 2)
    return 1;
  if (input.playerView.own.credits >= input.playerView.opponent.credits)
    return 0.5;
  return 0.25;
}
