import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  assessCorpBasicEconomyNearTie,
  replayStableCorpBasicEconomyNearTieChoice,
} from "./corp-basic-economy-near-tie";
import type { SemanticRuntimeChoice } from "../semantic-runtime-types";

describe("Corp replay-stable basic economy near ties", () => {
  it("repeats the same selection for the same AI decision context", () => {
    const input = corpInput("repeatable-seed");
    const choices = nearTieChoices();

    const first = replayStableCorpBasicEconomyNearTieChoice(
      input,
      choices,
      choices[0]!,
    );
    const second = replayStableCorpBasicEconomyNearTieChoice(
      structuredClone(input),
      structuredClone(choices),
      structuredClone(choices[0]!),
    );

    expect(second.action.actionId).toBe(first.action.actionId);
    expect(second.evidence).toEqual(first.evidence);
    expect(first.scoreBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_seeded_near_tie_variation",
          value: 0,
        }),
      ]),
    );
  });

  it("varies only the bounded near-tie choice across seeds", () => {
    const choices = nearTieChoices();
    const selected = new Set(
      Array.from(
        { length: 32 },
        (_, index) =>
          replayStableCorpBasicEconomyNearTieChoice(
            corpInput(`seed-${index}`),
            choices,
            choices[0]!,
          ).action.actionId,
      ),
    );

    expect(selected).toEqual(new Set(["corp.draw", "corp.gain"]));
  });

  it("does not vary when the strategic score gap exceeds the window", () => {
    const input = corpInput("clear-winner");
    const draw = choice("corp.draw", "draw_card", 1100, 53);
    const gain = choice("corp.gain", "gain_credit", 1000, 54);

    const assessment = assessCorpBasicEconomyNearTie(input, [draw, gain], draw);

    expect(assessment).toMatchObject({
      eligible: false,
      reason: "insufficient_candidates",
      selectedActionId: "corp.draw",
    });
  });

  it("does not admit optional draw when the hand has no safe capacity", () => {
    const input = corpInput("full-hand", 5, 5);
    const gain = choice("corp.gain", "gain_credit", 1000, 54);
    const draw = choice("corp.draw", "draw_card", 999, 53);

    const assessment = assessCorpBasicEconomyNearTie(input, [gain, draw], gain);

    expect(assessment).toMatchObject({
      eligible: false,
      reason: "insufficient_candidates",
      selectedActionId: "corp.gain",
    });
  });

  it("does not admit excluded candidates", () => {
    const input = corpInput("excluded-draw");
    const gain = choice("corp.gain", "gain_credit", 1000, 54);
    const draw = {
      ...choice("corp.draw", "draw_card", 999, 53),
      exclusion: {
        key: "test_exclusion",
        label: "Test",
        reason: "excluded",
      },
    };

    const assessment = assessCorpBasicEconomyNearTie(input, [gain, draw], gain);

    expect(assessment.eligible).toBe(false);
    expect(assessment.selectedActionId).toBe("corp.gain");
  });
});

function nearTieChoices(): SemanticRuntimeChoice[] {
  return [
    choice("corp.draw", "draw_card", 1099, 53),
    choice("corp.gain", "gain_credit", 1000, 54),
  ];
}

function choice(
  actionId: string,
  type: LegalAction["type"],
  score: number,
  typeTieBreaker: number,
): SemanticRuntimeChoice {
  return {
    action: {
      actionId,
      side: "corp",
      type,
      label: actionId,
      source: "basic_action",
      costs: [],
      payload: {},
    } as unknown as LegalAction,
    scopeId: "basic_economy_draw",
    score,
    scoreBreakdown: [
      {
        key: "semantic_type_tie_breaker",
        label: "Type",
        value: typeTieBreaker,
        reason: type,
      },
    ],
    reasonCode: "corp.semantic.basic_economy_draw",
    explanation: "test",
    evidence: [],
  };
}

function corpInput(
  seed: string,
  maxHandSize = 5,
  handCount = 4,
): AiDecisionInput {
  return {
    side: "corp",
    seed,
    decisionId: "decision-17",
    actionNumber: 17,
    profileId: "corp-ai-v0.9-hard",
    difficulty: "hard",
    legalActions: [],
    eventTail: [],
    playerView: {
      stateVersion: 17,
      own: {
        gripOrHq: Array.from({ length: handCount }, (_, index) => ({
          instanceId: `hq-${index}`,
          known: true,
          owner: "corp",
          type: "operation",
        })),
        maxHandSize,
      },
    },
  } as unknown as AiDecisionInput;
}
