import { readFileSync } from "node:fs";
import { beforeEach, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import type { DeckDefinition } from "@netgrid/shared";
import { metaTenStandardDecks as catalog } from "../meta-ten-standard-decks.test-support";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { RealEngineFixtureBuilder } from "../real-engine-fixture-builder";

it("preserves a forced Engine choice with no offered grip replacement", () => {
  const input = native(),
    choice = input.playerView.pendingChoice!;
  choice.options = choice.options.filter((option: {id: string}) => option.id === "pass");
  input.legalActions[0]!.choiceRequirements![0]!.optionIds = ["pass"];
  expect(chooseAiAction(input).selectedChoices).toEqual({
    choiceId: choice.choiceId,
    selectedOptionIds: ["pass"],
  });
});

function native() {
  const cp = JSON.parse(
    readFileSync(
      new URL("./fixtures/meta-ten-repairs/477-g26.json", import.meta.url),
      "utf8",
    ),
  );
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  return input;
}
beforeEach(resetResidentPlanPortfolioMemory);

it("binds the native lethal damage replacement to the defense owner", () => {
  const input = native(),
    decision = chooseAiAction(input);
  expect(decision.selectedChoices).toEqual({
    choiceId: input.playerView.pendingChoice!.choiceId,
    selectedOptionIds: [
      "flatline_tag_replacement_from_grip_runner_onr_v1_078_arasaka-owns-you_1",
    ],
  });
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    selectedPlan: { moduleId: "runner.defense_and_recovery" },
    rootPlanInstanceId: "plan:runner.defense_and_recovery:runner",
    leafExecutorInstanceId: "plan:runner.defense_and_recovery:runner",
    route: {
      stepId: "plan:runner.defense_and_recovery:runner:replace_terminal_damage",
    },
  });
});

it.each(["side", "state", "source", "effect"])(
  "rejects changed %s before completing the payload",
  (boundary) => {
    const input = native(),
      choice = input.playerView.pendingChoice!;
    if (boundary === "side") choice.side = "corp";
    if (boundary === "state") choice.stateVersion++;
    if (boundary === "source") input.playerView.own.gripOrHq = [];
    if (boundary === "effect")
      choice.options[1]!.metadata!.optionKind = "unrelated_replacement";
    expect(() => chooseAiAction(input)).toThrow(/window_origin_missing/);
  },
);

it("applies the actual Engine rescue without flatlining", () => {
  const original = native();
  const runner = catalog.decks.find(
    (d) => d.standardDeckId === "standard_runner_lucidrine_shell_traders",
  )!;
  const corp = catalog.decks.find((d) => d.name === "Express Shutdown")!;
  const deck = (d: typeof runner): DeckDefinition => ({
    id: d.standardDeckId,
    name: d.name,
    side: d.side as "runner" | "corp",
    identity: d.identityCardId,
    cards: d.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
  });
  let state = createGameAfterSetup({
    seed: "sp508-terminal-rescue",
    runnerDeck: deck(runner),
    corpDeck: deck(corp),
  });
  state.activeSide = "corp";
  state.phase = "corp_action_phase";
  state.timingPoint = "corp_action.main";
  state.corp.clicks = 3;
  RealEngineFixtureBuilder.forState(state)
    .withCorpCredits(10)
    .withRunnerGripSize(0)
    .withRunnerCardInGrip("onr_v1_078_arasaka-owns-you")
    .withRunnerTags(1)
    .withCorpCardInHq("onr_v1_302_scorched-earth");
  const operation = getLegalActions(state, "corp").find(
    (a) => a.type === "play_operation" && a.source?.includes("scorched-earth"),
  )!;
  const damage = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: operation.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!damage.ok) throw Error(damage.error.message);
  state = damage.state;
  expect(state.pendingChoice?.source).toBe("v121.replacement.damage");
  const input = buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    ownDeckSnapshot: original.ownDeckSnapshot,
    eventTail: state.eventLog,
  });
  const decision = chooseAiAction(input);
  const rescue = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId: decision.actionId!,
    clientKnownStateVersion: state.stateVersion,
    selectedChoices: decision.selectedChoices!,
  });
  if (!rescue.ok) throw Error(rescue.error.message);
  expect(rescue.state.winner).toBeNull();
  expect(rescue.state.runner.tags).toBe(0);
  expect(
    rescue.state.runner.heap.some((id) => id.includes("arasaka-owns-you")),
  ).toBe(true);
  expect(rescue.state.runner.grip).toHaveLength(
    rescue.state.runner.maxHandSize,
  );
});
