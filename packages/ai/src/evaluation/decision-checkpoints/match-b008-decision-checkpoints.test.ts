import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import cp01Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-b008-01.json";
import cp02Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-b008-02.json";
import cp03Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-b008-03.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match B008 older decision checkpoints", () => {
  it.each([
    ["CP-B008-01 break before run-ending subroutines", cp01Json],
    ["CP-B008-02 financeable event-run path", cp02Json],
    ["CP-B008-03 two-card hand buffer", cp03Json],
  ])("satisfies %s on current code", (_label, json) => {
    expectCheckpointToPass(fixture(json));
  });

  it("allows run-ending subroutines when no break is affordable", () => {
    const noBreakBudget = mutateFixture(cp01Json, (fixture) => {
      fixture.engine.testOnlyGameState.runner.credits = 0;
      fixture.expectation = { acceptableActions: [{ type: "continue_run" }] };
    });

    expectCheckpointToPass(noBreakBudget);
  });

  it("keeps an open R&D path in the pressure plan while Gypsy remains legal", () => {
    const openRnd = mutateFixture(cp02Json, (fixture) => {
      const state = fixture.engine.testOnlyGameState;
      const rnd = state.corp.servers.find((server) => server.id === "rd");
      if (!rnd) throw new Error("Missing captured R&D server");
      for (const iceId of rnd.ice.splice(0)) {
        state.corp.archives.push(iceId);
        state.cardInstances[iceId] = {
          ...state.cardInstances[iceId]!,
          zone: { side: "corp", zone: "archives" },
          faceup: true,
          rezzed: false,
        };
      }
      fixture.expectation = {
        acceptableActions: [
          {
            actionId:
              "runner.play_event.runner_onr_proteus_119_promises-promises_3.runner_onr_proteus_119_promises-promises_3.onr_proteus_119_promises-promises:on_play_mark_next_agenda_access_point_gain",
          },
        ],
        planExecution: {
          acceptablePlanKinds: ["runner.pressure_central"],
          acceptableCapabilities: [
            "develop_onr_proteus_119_promises-promises",
          ],
          requiredAssessmentEvidence: [
            "runner_same_turn_access_preparation:rd:onr_proteus_119_promises-promises",
          ],
        },
      };
    });

    const result = runAiDecisionCheckpoint(openRnd);
    expect(result.ok, result.message).toBe(true);
    expect(
      result.input.legalActions.some(
        (action) =>
          action.type === "play_event" &&
          action.source ===
            "runner_onr_classic_038_gypsytm-schedule-analyzer_2",
      ),
    ).toBe(true);
  });

  it("keeps credit development with a four-card hand buffer", () => {
    const buffered = mutateFixture(cp03Json, (fixture) => {
      const state = fixture.engine.testOnlyGameState;
      const cards = state.runner.stack.splice(-2);
      state.runner.grip.push(...cards);
      for (const cardId of cards) {
        state.cardInstances[cardId] = {
          ...state.cardInstances[cardId]!,
          zone: { side: "runner", zone: "grip" },
          faceup: false,
          rezzed: false,
        };
      }
      fixture.expectation = { forbiddenActions: [{ type: "draw_card" }] };
    });

    expectCheckpointToPass(buffered);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

function mutateFixture(
  value: unknown,
  mutation: (fixture: AiDecisionCheckpointV1) => void,
): AiDecisionCheckpointV1 {
  const result = fixture(value);
  mutation(result);
  result.engine.stateHash = hashGameState(result.engine.testOnlyGameState);
  return result;
}

function expectCheckpointToPass(fixture: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(fixture);
  expect(result.ok, result.message).toBe(true);
}
