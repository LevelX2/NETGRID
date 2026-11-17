import { describe, expect, it } from "vitest";
import { hashGameState } from "@netgrid/engine";

import inactiveAgendaProtectionJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-baseline-seed02-01-inactive-agenda-protection-d181.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import { RealEngineFixtureBuilder } from "../real-engine-fixture-builder";

describe("baseline Seed 02 effect-activation checkpoint", () => {
  it("funds the agenda protection gap through its exact economy continuation", () => {
    const fixture = structuredClone(
      inactiveAgendaProtectionJson,
    ) as unknown as AiDecisionCheckpointV1;
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

  it("preserves hand capacity when the native public rig defeats the installed ICE", () => {
    const fixture = structuredClone(
      inactiveAgendaProtectionJson,
    ) as unknown as AiDecisionCheckpointV1;
    fixture.expectation = {
      acceptableActions: [{ type: "gain_credit" }],
      planExecution: { acceptablePlanKinds: ["corp.economy"] },
    };
    const result = runAiDecisionCheckpoint(fixture);
    expect(result.ok, result.message).toBe(true);
    expect(result.input.playerView.own.gripOrHq).toHaveLength(
      result.input.playerView.own.maxHandSize,
    );
    expect(
      result.decision?.decisionDebug?.planFirstDecision?.dispositions,
    ).toContainEqual(
      expect.objectContaining({
        actionId: "corp.draw_card",
        ownerModuleId: "corp.hand_and_agenda_management",
        evidenceCode: "corp_exact_draw_projection_exceeds_hand_capacity",
      }),
    );
  });

  it("does not claim a hand-capacity blocker when the Corp has room to draw", () => {
    const fixture = structuredClone(
      inactiveAgendaProtectionJson,
    ) as unknown as AiDecisionCheckpointV1;
    const state = fixture.engine.testOnlyGameState;
    RealEngineFixtureBuilder.forState(state).withCorpHqSize(4);
    fixture.source.kind = "synthetic_companion";
    fixture.engine.stateHash = hashGameState(state);
    fixture.expectation = {
      acceptableActions: [{}],
    };
    const result = runAiDecisionCheckpoint(fixture);
    expect(result.ok, result.message).toBe(true);
    expect(
      result.input.legalActions.some((action) => action.type === "draw_card"),
    ).toBe(true);
    expect(result.decision?.fallbackUsed).toBe(false);
    expect(
      result.decision?.decisionDebug?.planFirstDecision?.dispositions,
    ).not.toContainEqual(
      expect.objectContaining({
        actionId: "corp.draw_card",
        evidenceCode: "corp_exact_draw_projection_exceeds_hand_capacity",
      }),
    );
  });
});
