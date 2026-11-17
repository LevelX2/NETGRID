import { buildAiDecisionInputDto } from "../input-dto";
import {
  aiInput,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import { describe, expect, it } from "vitest";
import { runnerDamagePreventionChoiceResolution } from "./damage-prevention-choice-option";

describe("Runner damage prevention choice", () => {
  it("uses the strongest Engine damage option in an acute window", () => {
    const raw = aiInput("runner", []);
    raw.playerView.own.gripOrHq = [
      visibleCard("a", "runner", "event"),
      visibleCard("b", "runner", "event"),
    ];
    const options = [
      { id: "pass", label: "Pass" },
      {
        id: "weak_99",
        label: "Prevention",
        metadata: { optionKind: "prevent_damage", amount: 1 },
      },
      {
        id: "strong_1",
        label: "Prevention",
        metadata: { optionKind: "prevent_damage", amount: 2 },
      },
      {
        id: "trash_9",
        label: "Prevent trash",
        metadata: { optionKind: "prevent_trash", amount: 9 },
      },
    ];
    const choice = {
      choiceId: "prevention",
      stateVersion: 1,
      side: "runner",
      source: "v120.event_modification.prevent",
      prompt: "Damage Prevention",
      kind: "select_option",
      minSelections: 1,
      maxSelections: 1,
      options,
      visibility: "hidden_info_barrier",
    } as const;
    raw.playerView.pendingChoice = choice;
    const input = buildAiDecisionInputDto(raw);
    const projectedChoice = input.playerView.pendingChoice!;
    expect(
      runnerDamagePreventionChoiceResolution(
        input,
        projectedChoice,
        projectedChoice.options,
      ),
    ).toEqual({ kind: "select", optionId: "strong_1" });
  });
});
