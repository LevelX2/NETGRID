import { describe, expect, it } from "vitest";
import type { LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { projectRandomBadPublicityModel } from "./random-bad-publicity-model";

describe("projectRandomBadPublicityModel", () => {
  it("represents a future random result as undrawn without predicting it", () => {
    const model = projectRandomBadPublicityModel(
      candidate(),
      action({
        randomDrawRecordPurpose: "proteus_dice",
        randomCounterAfter: 12,
      }),
    );

    expect(model?.randomOutcome).toEqual({
      schemaVersion: "random-outcome-model-v1",
      outcomeStatus: "not_drawn",
      purpose: "proteus_dice",
      randomCounterAfter: 12,
      source: "engine_random_draw_records_only",
      futureOutcomeAccess: "forbidden",
      deterministicProjection: true,
      evidence: [
        "random_outcome:not_drawn",
        "random_source:engine_random_draw_records_only",
        "future_random_outcome_access:forbidden",
        "random_purpose:proteus_dice",
        "random_counter_after:12",
      ],
    });
    expect(JSON.stringify(model)).not.toMatch(/result|rolled|outcomeValue/i);
  });

  it("is deterministic for the same side-safe action projection", () => {
    const input = action({ randomPurpose: "proteus_coin", rollDice: true });
    expect(projectRandomBadPublicityModel(candidate(), input)).toEqual(
      projectRandomBadPublicityModel(candidate(), input),
    );
  });

  it("derives a visible bad-publicity threshold from explicit payload values", () => {
    const model = projectRandomBadPublicityModel(
      candidate(),
      action({ badPublicityAdded: 2, badPublicityBefore: 5 }),
    );

    expect(model?.badPublicity).toMatchObject({
      delta: 2,
      current: 5,
      after: 7,
      lossThreshold: 7,
      thresholdStatus: "reached",
      actorRelevance: "payoff",
      source: "legal_action_payload",
    });
  });

  it("keeps the threshold unknown when side-safe semantics provide no count", () => {
    const model = projectRandomBadPublicityModel(
      candidate({ actionTacticSignals: ["economy.bad_publicity"] }),
      action({}),
    );

    expect(model?.badPublicity).toMatchObject({
      thresholdStatus: "unknown",
      actorRelevance: "support",
      source: "side_safe_semantics",
    });
    expect(model?.badPublicity).not.toHaveProperty("current");
    expect(model?.badPublicity).not.toHaveProperty("after");
  });

  it("does not match near-miss semantic tokens", () => {
    const model = projectRandomBadPublicityModel(
      candidate({ actionTacticSignals: ["badger.publicist"] }),
      action({}),
    );
    expect(model).toBeUndefined();
  });

  it("classifies bad-publicity gain as a Corp risk", () => {
    const model = projectRandomBadPublicityModel(
      candidate({ actorSide: "corp" }),
      action({ badPublicityDelta: 1 }, "corp"),
    );
    expect(model?.badPublicity?.actorRelevance).toBe("risk");
  });
});

function action(
  payload: Record<string, unknown>,
  side: "runner" | "corp" = "runner",
): LegalAction {
  return {
    actionId: "action-1",
    type: "trigger_ability",
    side,
    payload,
  } as LegalAction;
}

function candidate(
  overrides: Partial<ActionSemanticCandidate> = {},
): ActionSemanticCandidate {
  return {
    actorSide: "runner",
    cardContextSignals: [],
    actionTacticSignals: [],
    conditions: [],
    risks: [],
    constraints: [],
    hardGates: [],
    ...overrides,
  } as ActionSemanticCandidate;
}
