import { type AiDecisionInput } from "@netgrid/shared";
import { type CorpCorePlanDomain } from "../../plans/corp-core-plan-contracts";
import { corpFundedCentralProtectionReserve } from "./corp-server-protection-reserve";
export function corpAvailableRemoteRezCredits(
  input: AiDecisionInput,
  centralAllocation: CorpCorePlanDomain["centralDefenseAllocation"],
): number {
  if (centralAllocation?.status !== "known") {
    return input.playerView.own.credits;
  }
  const reserve = corpFundedCentralProtectionReserve(input);
  return Math.max(0, input.playerView.own.credits - reserve);
}
