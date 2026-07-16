import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import { semanticRuntimeActionExclusion } from "./semantic-runtime-action-exclusion";

describe("semanticRuntimeActionExclusion", () => {
  it("keeps a projected reachable bypass action despite a generically blocked ICE path", () => {
    const action = runEventAction();
    const exclusion = semanticRuntimeActionExclusion(
      runnerInput(action),
      action,
      undefined,
      {
        planMemoryActionExclusion: () => undefined,
        corpAdvancementCounterPlacementAssessment: () => undefined,
        runnerSelfDamageSurvivalExclusion: () => undefined,
        runnerEncounterActionExclusion: () => undefined,
        runnerProgramSacrificeExclusion: () => undefined,
        runnerMultiRunEventExclusion: () => undefined,
        runnerRunTargetEvaluationForAction: () =>
          reachableBypassEvaluation(action),
        runnerBlinkRunExclusion: () => undefined,
        knownCentralPayoffExclusion: () => undefined,
        runnerArchivesExclusion: () => undefined,
        runnerEmptyRemoteExclusion: () => undefined,
        isRemoteServerTarget: (serverId) =>
          serverId?.startsWith("remote_") === true,
        knownIcePathReason: () => "generic_path_should_not_override_projection",
      },
    );

    expect(exclusion).toBeUndefined();
  });
});

function runEventAction(): LegalAction {
  return {
    actionId: "inside-job-remote-1",
    side: "runner",
    type: "start_run",
    label: "Inside Job on Remote 1",
    source: "inside-job",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }, { credits: 2 }],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 2,
    payload: { serverId: "remote_1" },
  } as LegalAction;
}

function runnerInput(action: LegalAction): AiDecisionInput {
  return {
    side: "runner",
    legalActions: [action],
    profileId: "test-runner",
    difficulty: "normal",
    eventTail: [],
    seed: "reachable-bypass-exclusion",
    decisionId: "reachable-bypass-exclusion.1",
    actionNumber: 1,
    playerView: {
      stateVersion: 1,
      own: { credits: 4, rig: [] },
      opponent: { credits: 5, identity: { counterDisplays: [] } },
      servers: [
        {
          id: "remote_1",
          label: "Remote 1",
          ice: [codeGateIce()],
          root: [{ known: false, instanceId: "hidden-root-card" }],
        },
      ],
    },
  } as unknown as AiDecisionInput;
}

function codeGateIce(): VisibleCard {
  return {
    instanceId: "remote-code-gate",
    definitionId: "simple_code_gate_ice",
    title: "Simple Code Gate ICE",
    type: "ice",
    subtypes: ["code_gate"],
    known: true,
    rezzed: true,
    strength: 2,
  };
}

function reachableBypassEvaluation(
  action: LegalAction,
): RunnerRunTargetEvaluation {
  return {
    actionId: action.actionId,
    targetServerId: "remote_1",
    accessServerId: "remote_1",
    pathPassability: "reachable",
    bypassedFirstIce: true,
    runActionProjection: { structure: "event_run" },
    runActionPayoff: { scoreBonus: 0 },
  } as unknown as RunnerRunTargetEvaluation;
}
