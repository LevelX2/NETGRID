import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import type { DeckDefinition } from "@netgrid/shared";
import { metaTenStandardDecks as catalog } from "../evaluation/meta-ten-standard-decks.test-support";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { buildAiDecisionInput } from "./ai-decision-input";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

it("replays the native selected search through actual Engine source, target and installation", () => {
  const checkpoint = JSON.parse(
    readFileSync(
      new URL(
        "../evaluation/decision-checkpoints/fixtures/meta-ten-repairs/476-g3.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const runner = catalog.decks.find(
    (d) =>
      d.standardDeckId === "standard_runner_rent_i_con_shellspiel_2026_07_17",
  )!;
  const corp = catalog.decks.find(
    (d) => d.standardDeckId === "standard_corp_original_speed_v10",
  )!;
  const deck = (d: typeof runner): DeckDefinition => ({
    id: d.standardDeckId,
    name: d.name,
    side: d.side,
    identity: d.identityCardId,
    cards: d.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
  });
  let state = createGameAfterSetup({
    seed: "sp504-source-target-install",
    runnerDeck: deck(runner),
    corpDeck: deck(corp),
  });
  state.activeSide = "runner";
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  RealEngineFixtureBuilder.forState(state)
    .withRunnerCredits(20)
    .withRunnerClicks(1)
    .withRunnerGripSize(0)
    .withRunnerProgramInstalled("onr_classic_031_rent-i-con");
  const sourceId =
    checkpoint.input.playerView.pendingChoice.sourceCardInstanceId;
  state.runner.stack = state.runner.stack.filter((id) => id !== sourceId);
  state.runner.grip.push(sourceId);
  state.cardInstances[sourceId]!.zone = { side: "runner", zone: "grip" };
  state.stateVersion = checkpoint.runtime.residentPlanPortfolio.stateVersion;
  state.matchId = checkpoint.input.decisionId.split(":")[0];
  const sourceAction = getLegalActions(state, "runner").find(
    (a) => a.type === "play_event" && a.payload?.cardId === sourceId,
  )!;
  const sourceResult = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId: sourceAction.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!sourceResult.ok) throw Error(sourceResult.error.message);
  state = sourceResult.state;
  const initialInput = buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    ownDeckSnapshot: checkpoint.input.ownDeckSnapshot,
    eventTail: state.eventLog,
  });
  restoreAiRuntimeCheckpoint(
    initialInput,
    checkpoint.input.ownDeckSnapshot.deckSnapshotId,
    checkpoint.runtime,
  );
  const roots: string[] = [];
  const selected: string[][] = [];
  for (let step = 0; step < 5; step++) {
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
      ownDeckSnapshot: checkpoint.input.ownDeckSnapshot,
      eventTail: state.eventLog,
    });
    const decision = chooseAiAction(input);
    roots.push(decision.decisionDebug!.planFirstDecision!.rootPlanInstanceId!);
    if (
      decision.selectedChoices &&
      "selectedOptionIds" in decision.selectedChoices
    )
      selected.push(decision.selectedChoices.selectedOptionIds as string[]);
    const result = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: decision.actionId!,
      clientKnownStateVersion: state.stateVersion,
      ...(decision.selectedChoices
        ? { selectedChoices: decision.selectedChoices }
        : {}),
    });
    if (!result.ok) throw Error(result.error.message);
    state = result.state;
    if (!state.pendingChoice) break;
  }
  expect(roots.length).toBeGreaterThan(1);
  expect(new Set(roots).size).toBe(1);
  expect(selected).toContainEqual(["source_stack"]);
  expect(state.pendingChoice).toBeUndefined();
  expect(
    state.runner.rig.programs.map(
      (id) => state.cardInstances[id]!.definitionId,
    ),
  ).toContain("onr_v1_011_cloak");
});
