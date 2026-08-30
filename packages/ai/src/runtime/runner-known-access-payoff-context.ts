import type { AiDecisionInput } from "@netgrid/shared";

import { evaluateKnownRemoteAccessPayoff } from "../known-remote-access-payoff";

export function runnerRemoteHasKnownNoCurrentPayoff(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  return evaluateKnownRemoteAccessPayoff(input, serverId).knownNoCurrentPayoff;
}
