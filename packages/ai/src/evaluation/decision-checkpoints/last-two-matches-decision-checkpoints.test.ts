import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import cp01Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-last-two-01.json";
import cp02Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-last-two-02.json";
import cp03Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-last-two-03.json";
import cp04Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-last-two-04.json";
import cp05Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-last-two-05.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("last two matches exact decision checkpoints", () => {
  it.each([
    ["short-match dead Prearranged Drop", cp01Json],
    ["selfplay dead Prearranged Drop", cp02Json],
    ["movement treated as an active encounter", cp03Json],
    ["trace kill window missed by stale context", cp04Json],
    ["inevitable Corp deckout not locked", cp05Json],
  ])("satisfies %s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));

    expect(result.ok, result.message).toBe(true);
  });

  it("funds the missing wall route instead of playing an unbound access payoff", () => {
    const accessStillExecutable = mutateFixture(cp01Json, (fixture) => {
      fixture.engine.testOnlyGameState.runner.clicks = 2;
      fixture.expectation = {
        acceptableActions: [{ type: "gain_credit" }],
        forbiddenActions: [
          { type: "play_event", sourceDefinitionId: PREARRANGED_DROP },
        ],
        planExecution: {
          acceptablePlanKinds: ["runner.rig_and_coverage"],
          acceptableCapabilities: ["fund_install_breaker_wall"],
          requiredAssessmentEvidence: [
            "deck_strategy_open_wall_coverage",
          ],
        },
      };
    });

    expectCheckpointToPass(accessStillExecutable);
  });

  it("does not lock deckout while R&D still contains a card", () => {
    const deckNotEmpty = mutateFixture(cp05Json, (fixture) => {
      const state = fixture.engine.testOnlyGameState;
      const cardId = state.corp.archives[0];
      if (!cardId) throw new Error("Missing Corp card for deckout counterprobe");
      state.corp.archives = state.corp.archives.filter((id) => id !== cardId);
      state.corp.rd.push(cardId);
      state.cardInstances[cardId] = {
        ...state.cardInstances[cardId]!,
        zone: { side: "corp", zone: "rd" },
        faceup: false,
        rezzed: false,
      };
      fixture.expectation = {
        forbiddenActions: [{ type: "end_turn" }],
      };
    });

    expectCheckpointToPass(deckNotEmpty);
  });

  it("does not force the kill bid when no visible tag payoff remains in HQ", () => {
    const noVisiblePayoff = mutateFixture(cp04Json, (fixture) => {
      const state = fixture.engine.testOnlyGameState;
      const payoffCardIds = state.corp.hq.filter((cardId) =>
        TRACE_PAYOFFS.has(state.cardInstances[cardId]?.definitionId ?? ""),
      );
      if (payoffCardIds.length === 0) {
        throw new Error("Missing Corp tag payoff for trace counterprobe");
      }
      state.corp.hq = state.corp.hq.filter(
        (cardId) => !payoffCardIds.includes(cardId),
      );
      state.corp.archives.push(...payoffCardIds);
      for (const cardId of payoffCardIds) {
        state.cardInstances[cardId] = {
          ...state.cardInstances[cardId]!,
          zone: { side: "corp", zone: "archives" },
          faceup: true,
          rezzed: false,
        };
      }
      fixture.expectation = {
        acceptableActions: [{ type: "resolve_choice" }],
        choice: { mustNotSelectValues: [5] },
      };
    });

    expectCheckpointToPass(noVisiblePayoff);
  });
});

const PREARRANGED_DROP = "onr_proteus_118_prearranged-drop";
const TRACE_PAYOFFS = new Set([
  "onr_v1_302_scorched-earth",
  "onr_v1_307_urban-renewal",
]);

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
