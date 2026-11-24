import { readFileSync } from "node:fs";
import { applyAction, hashGameState, validateGameState } from "@netgrid/engine";
import type { GameState, PlayerAction } from "@netgrid/shared";
import { expect, it } from "vitest";
import { deckSnapshotCardCountsForTest } from "../deck-snapshot.test-support";
import { buildAiDecisionInput, chooseAiAction } from "../index";
import { simulationEngineRuntimeOptions } from "../simulation/engine-selection";

it("resolves the native Cinderella hardware choice from its numeric definition", () => {
  const fixture = JSON.parse(
    readFileSync(
      new URL(
        "../../../engine/src/game/run/test-fixtures/meta592-r2-g39-trace-run-end.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as { state: GameState; action: PlayerAction; stateHash: string };
  expect(hashGameState(fixture.state)).toBe(fixture.stateHash);

  const bid = applyAction(fixture.state, fixture.action);
  if (!bid.ok) throw new Error(bid.error.message);
  const { state } = bid;
  const choice = state.pendingChoice;
  if (!choice?.source.startsWith("trace_success.hardware_wrecker:")) {
    throw new Error("Native Corp hardware choice missing");
  }
  const input = buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: "native-cinderella-hardware-test",
      side: "corp",
      cards: deckSnapshotCardCountsForTest(state, "corp"),
    },
  });

  const decision = chooseAiAction(input, simulationEngineRuntimeOptions(state));
  const selected = decision.selectedChoices;
  if (
    decision.actionId !== "cn" ||
    selected?.choiceId !== choice.choiceId ||
    !Array.isArray(selected.selectedOptionIds) ||
    selected.selectedOptionIds.length !== 1
  ) {
    throw new Error("Defense must resolve the active hardware choice");
  }
  const [selectedOptionId] = selected.selectedOptionIds;
  const option = choice.options.find(
    (candidate) => candidate.id === selectedOptionId,
  );
  if (
    typeof option?.value !== "string" ||
    !state.runner.rig.hardware.includes(option.value)
  ) {
    throw new Error("Defense must choose one installed hardware");
  }

  const resolved = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: decision.actionId,
    clientKnownStateVersion: state.stateVersion,
    selectedChoices: {
      choiceId: choice.choiceId,
      selectedOptionIds: [option.id],
    },
  });
  if (!resolved.ok) throw new Error(resolved.error.message);
  expect(validateGameState(resolved.state).ok).toBe(true);
  expect(resolved.state.runner.rig.hardware).not.toContain(option.value);
  expect(resolved.state.runner.heap).toContain(option.value);
});
