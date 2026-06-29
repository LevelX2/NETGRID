import type { AiDecisionInput } from "@netgrid/shared";

import type { BeliefState } from "../belief-state";
import {
  evaluateKnownRemoteAccessPayoff,
  type KnownRemoteAccessPayoff,
} from "../known-remote-access-payoff";

export function legacyRunnerKnownRemoteAccessPayoff(
  input: AiDecisionInput,
  serverId: string | undefined,
  beliefState?: BeliefState,
): KnownRemoteAccessPayoff {
  return beliefState
    ? evaluateKnownRemoteAccessPayoff(input, serverId, beliefState)
    : evaluateKnownRemoteAccessPayoff(input, serverId);
}
