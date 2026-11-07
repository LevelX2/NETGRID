import { describe, expect, it } from "vitest";
import { hashGameState } from "@netgrid/engine";

import knownDamageAmbushJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f5d27033-01-known-damage-ambush-jack-out.json";
import marginalMemoryInstallJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f5d27033-02-marginal-memory-install-yield.json";
import confirmedDamageReserveJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f5d27033-03-confirmed-damage-reaction-reserve.json";
import safeRemoteContinueJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f5d27033-04-safe-remote-continue-control.json";
import usefulBreakerInstallJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f5d27033-05-useful-breaker-install-control.json";
import visiblePayoffRunJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f5d27033-06-visible-payoff-run-control.json";
import { bindHistoricalRunEventCadence } from "./checkpoint-cadence-fixture.test-support";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match F5D27033 runner flatline-risk checkpoints", () => {
  it.each([
    [
      "jacks out before the sole known advanced damage ambush",
      knownDamageAmbushJson,
    ],
    [
      "lets a much stronger action displace a marginal memory install",
      marginalMemoryInstallJson,
    ],
    [
      "keeps reaction reserve under confirmed damage and a locked hand buffer",
      confirmedDamageReserveJson,
    ],
  ])("%s", (_label, json) => {
    expectCheckpointToPass(fixture(json));
  });

  it.each([
    ["continues an unambiguous safe remote run", safeRemoteContinueJson],
    [
      "keeps the useful breaker resident while contesting the certified remote",
      usefulBreakerInstallJson,
    ],
    ["still takes a run with visible immediate payoff", visiblePayoffRunJson],
  ])("control: %s", (_label, json) => {
    expectCheckpointToPass(fixture(json));
  });

  it("does not expose the later hidden flatline combo to the reserve decision", () => {
    const checkpoint = fixture(confirmedDamageReserveJson);
    const publicPrefix = JSON.stringify(checkpoint.engine.eventPrefix);

    expect(publicPrefix).not.toContain("onr_v1_284_chance-observation");
    expect(publicPrefix).not.toContain("onr_v1_307_urban-renewal");
    expect(publicPrefix).not.toContain("Chance Observation");
    expect(publicPrefix).not.toContain("Urban Renewal");
  });

  it("still contests the known agenda once its ambush-free route is certified", () => {
    const checkpoint = fixture(marginalMemoryInstallJson);
    const state = checkpoint.engine.testOnlyGameState;
    const remote = state.corp.servers.find(
      (server) => server.id === "remote_1",
    )!;
    for (const id of remote.ice) {
      state.corp.archives.push(id);
      Object.assign(state.cardInstances[id]!, {
        zone: { side: "corp", zone: "archives" },
        faceup: true,
        rezzed: false,
      });
    }
    remote.ice = [];
    state.cardInstances[remote.root[0]!]!.faceup = true;
    checkpoint.source.kind = "synthetic_companion";
    checkpoint.engine.stateHash = hashGameState(state);
    checkpoint.expectation = structuredClone(
      marginalMemoryInstallJson.expectation,
    );
    checkpoint.expectation.planExecution!.requiredAssessmentEvidence = [
      "visible_known_agenda_remote",
    ];
    expectCheckpointToPass(checkpoint);
  });

  it("still installs the useful breaker with a funded reaction reserve", () => {
    const checkpoint = fixture(visiblePayoffRunJson);
    checkpoint.engine.testOnlyGameState.runner.credits = 10;
    checkpoint.source.kind = "synthetic_companion";
    checkpoint.engine.stateHash = hashGameState(
      checkpoint.engine.testOnlyGameState,
    );
    checkpoint.expectation = structuredClone(visiblePayoffRunJson.expectation);
    expectCheckpointToPass(checkpoint);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  const checkpoint = bindHistoricalRunEventCadence(
    structuredClone(value) as AiDecisionCheckpointV1,
    [
      "cp-f5d27033-05-useful-breaker-install-control",
      "cp-f5d27033-06-visible-payoff-run-control",
    ],
  );
  if (
    [
      "cp-f5d27033-02-marginal-memory-install-yield",
      "cp-f5d27033-05-useful-breaker-install-control",
      "cp-f5d27033-06-visible-payoff-run-control",
    ].includes(checkpoint.checkpointId)
  ) {
    // Nine credits and a full three-card damage-locked hand leave the
    // current ten-credit reaction reserve incomplete. The remote in 02/05
    // has an unknown root and unrezzed Fang, so it supplies no immediate payoff.
    checkpoint.expectation = {
      acceptableActions: [{ actionId: "runner.gain_credit" }],
      forbiddenActions: [
        { sourceDefinitionId: "onr_v1_146_zetatech-mem-chip" },
      ],
      planExecution: {
        acceptablePlanKinds: ["runner.defense_and_recovery"],
        acceptableCapabilities: ["build_damage_reaction_reserve"],
        requiredAssessmentEvidence: [
          "runner_damage_locked_hand_reaction_reserve",
        ],
      },
    };
  }
  return checkpoint;
}

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
}
