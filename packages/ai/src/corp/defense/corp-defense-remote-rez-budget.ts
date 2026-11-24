import { type AiDecisionInput } from "@netgrid/shared";
import { corpFundedCentralProtectionReserve } from "./corp-server-protection-reserve";
export function corpAvailableRemoteRezCredits(input: AiDecisionInput): number {
  const reserve = corpFundedCentralProtectionReserve(input);
  return Math.max(0, input.playerView.own.credits - reserve);
}
