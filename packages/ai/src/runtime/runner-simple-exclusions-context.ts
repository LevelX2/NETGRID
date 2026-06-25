import type { AiDecisionInput } from "@netgrid/shared";
import {
  knownCentralPayoffExclusion,
  type KnownCentralPayoffForExclusion,
} from "./known-central-payoff-exclusion";
import { runnerArchivesExclusion } from "./runner-archives-exclusion";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";

type RunnerSimpleExclusionServer =
  AiDecisionInput["playerView"]["servers"][number];

export type RunnerSimpleExclusionsContextDependencies = {
  evaluateKnownCentralPayoff: (
    input: AiDecisionInput,
    serverId: string | undefined,
  ) => KnownCentralPayoffForExclusion;
  definitionType: (definitionId: string) => string | undefined;
};

export type RunnerSimpleExclusionsContext = {
  semanticRuntimeKnownCentralPayoffExclusion: (
    input: AiDecisionInput,
    serverId: string | undefined,
  ) => SemanticRuntimeExclusion | undefined;
  semanticRuntimeRunnerEmptyRemoteExclusion: (
    server: RunnerSimpleExclusionServer,
  ) => SemanticRuntimeExclusion | undefined;
  semanticRuntimeRunnerArchivesExclusion: (
    input: AiDecisionInput,
    server: RunnerSimpleExclusionServer | undefined,
  ) => SemanticRuntimeExclusion | undefined;
};

export function createRunnerSimpleExclusionsContext(
  dependencies: RunnerSimpleExclusionsContextDependencies,
): RunnerSimpleExclusionsContext {
  return {
    semanticRuntimeKnownCentralPayoffExclusion: (input, serverId) =>
      knownCentralPayoffExclusion(input, serverId, {
        evaluatePayoff: dependencies.evaluateKnownCentralPayoff,
      }),
    semanticRuntimeRunnerEmptyRemoteExclusion: (server) => {
      if (server.root.length > 0) return undefined;
      return {
        key: "remote_empty_no_root",
        label: "Remote ohne Root-Ziel",
        reason: `empty_remote_root:${server.id}`,
      };
    },
    semanticRuntimeRunnerArchivesExclusion: (input, server) =>
      runnerArchivesExclusion(input, server, {
        definitionType: dependencies.definitionType,
      }),
  };
}
