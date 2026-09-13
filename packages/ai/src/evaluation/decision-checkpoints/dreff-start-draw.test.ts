import { beforeEach, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const checkpointJson: unknown = JSON.parse(
  readFileSync(
    new URL(
      "../../../../../data/scenarios/ai-decision-checkpoints/cp-dreff-454-start-draw-d317.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

beforeEach(resetResidentPlanPortfolioMemory);

function fixture(committedDrawCount = 1) {
  const capture = structuredClone(checkpointJson) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  const input = capture.input;
  // Historical Actor input predates this Engine quote. The source and counts
  // are explicit regression parameters, not a repaired historical state/hash.
  const choice = input.playerView.pendingChoice!;
  choice.corpStartDrawQuote = {
    sourceCardInstanceId: choice.source.split(":")[1]!,
    observedAtStateVersion: input.playerView.stateVersion,
    additionalDrawCount: 1,
    committedDrawCount,
    mandatoryDrawCount: 1,
  };
  return capture;
}

it.each([1, 2])(
  "skips extra draw with the recorded full HQ and three R&D cards, including %i committed draws (SP-382)",
  (committed) => {
    const { input, runtime } = fixture(committed);
    expect(input.playerView.own.stackOrRdCount).toBe(3);
    expect(input.playerView.own.gripOrHq.length).toBe(6);
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const decision = chooseAiAction(input);
    expect(decision.selectedChoices?.selectedOptionIds).toEqual(["skip"]);
    expect(decision.fallbackUsed).toBe(false);
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe("corp.hand_and_agenda_management");
  },
);

it.each([
  ["refills a low hand", 0, 12, 1, 1, "draw"],
  ["reserves the next mandatory draws", 0, 3, 1, 1, "skip"],
  ["counts earlier optional commitments", 1, 12, 3, 1, "skip"],
  ["preserves capacity after mandatory draws", 4, 12, 1, 1, "skip"],
  ["includes the quoted Skivviss rate", 0, 8, 3, 3, "skip"],
] as const)("%s", (_label, hand, rd, committed, mandatory, expected) => {
  const { input } = fixture(committed);
  input.playerView.own.gripOrHq = input.playerView.own.gripOrHq.slice(0, hand);
  input.playerView.own.stackOrRdCount = rd;
  input.playerView.pendingChoice!.corpStartDrawQuote!.mandatoryDrawCount =
    mandatory;
  expect(chooseAiAction(input).selectedChoices?.selectedOptionIds).toEqual([
    expected,
  ]);
});

it.each(["missing", "stale"] as const)(
  "rejects a %s Engine quote",
  (variant) => {
    const { input } = fixture();
    if (variant === "missing")
      delete input.playerView.pendingChoice!.corpStartDrawQuote;
    else
      input.playerView.pendingChoice!.corpStartDrawQuote!
        .observedAtStateVersion--;
    expect(() => chooseAiAction(input)).toThrow();
  },
);

it("carries the exact public draw counts through the actor DTO", () => {
  const { input } = fixture(2);
  const dto = buildAiDecisionInputDto(input);
  expect(dto.playerView.pendingChoice?.corpStartDrawQuote).toEqual(
    input.playerView.pendingChoice!.corpStartDrawQuote,
  );
  expect(
    chooseAiAction({ ...input, ...dto }).selectedChoices?.selectedOptionIds,
  ).toEqual(["skip"]);
});

it.each(["funded", "unfunded", "agenda_in_hq", "occupied"] as const)(
  "requires a concrete available scoring remote for agenda search: %s",
  (variant) => {
    const { input } = fixture();
    const agenda = input.playerView.own.gripOrHq.find(
      (card) => card.type === "agenda",
    )!;
    input.playerView.own.gripOrHq = input.playerView.own.gripOrHq
      .filter((card) => card.type !== "agenda")
      .slice(0, 3);
    expect(input.playerView.own.gripOrHq).toHaveLength(3);
    input.playerView.own.stackOrRdCount = 20;
    input.playerView.own.credits = variant === "unfunded" ? 0 : 12;
    if (variant === "agenda_in_hq") input.playerView.own.gripOrHq[0] = agenda;
    if (variant === "occupied")
      input.playerView.servers
        .find((server) => server.id === "remote_1")!
        .root.push(agenda);
    expect(chooseAiAction(input).selectedChoices?.selectedOptionIds).toEqual([
      variant === "funded" ? "draw" : "skip",
    ]);
  },
);
