import { describe, expect, it } from "vitest";
import { hashGameState } from "@netgrid/engine";

import inactiveAgendaProtectionJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-baseline-seed02-01-inactive-agenda-protection-d181.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("baseline Seed 02 effect-activation checkpoint", () => {
  it("funds the agenda protection gap through its exact economy continuation", () => {
    const fixture = structuredClone(
      inactiveAgendaProtectionJson,
    ) as AiDecisionCheckpointV1;
    const state = fixture.engine.testOnlyGameState;
    // The native visible Bartmoss/Krash rig and prepared income can now pass
    // Fragmentation Storm. This positive funding control needs a real blocker.
    for (const id of state.runner.rig.programs) {
      state.runner.stack.push(id);
      Object.assign(state.cardInstances[id]!, {
        zone: { side: "runner", zone: "stack" },
        faceup: false,
        rezzed: false,
      });
    }
    state.runner.rig.programs = [];
    fixture.source.kind = "synthetic_companion";
    fixture.engine.stateHash = hashGameState(state);
    const result = runAiDecisionCheckpoint(fixture);

    expect(result.ok, `${result.code ?? "ok"}: ${result.message}`).toBe(true);
  });

  it("searches for effective protection when the native public rig defeats the installed ICE", () => {
    const fixture = structuredClone(
      inactiveAgendaProtectionJson,
    ) as AiDecisionCheckpointV1;
    fixture.expectation = {
      acceptableActions: [{ type: "draw_card" }],
      planExecution: {
        acceptablePlanKinds: ["corp.defend_servers"],
        acceptableCapabilities: ["develop_score_protection"],
      },
    };
    const result = runAiDecisionCheckpoint(fixture);
    expect(result.ok, result.message).toBe(true);
    expect(result.decision?.fallbackUsed).toBe(false);
  });
});
