import { type AiDecisionInput } from "@netgrid/shared";

export function technicalIdCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function turnKey(input: AiDecisionInput): string {
  return `${input.side}:${input.playerView.turnSerial ?? input.actionNumber}`;
}
