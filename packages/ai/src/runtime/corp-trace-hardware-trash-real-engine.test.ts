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
  expect(decision.actionId).toBe("corp.resolve_choice");
  const selected = decision.selectedChoices;
  expect(selected?.choiceId).toBe(choice.choiceId);
  const target = choice.options.find(
    (option) => option.id === selected?.selectedOptionIds[0],
  )?.value;
  if (typeof target !== "string" || !state.runner.rig.hardware.includes(target)) {
    throw new Error("Defense must choose one installed hardware");
  }

  const resolved = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: decision.actionId,
    clientKnownStateVersion: state.stateVersion,
    ...(selected ? { selectedChoices: selected } : {}),
  });
  if (!resolved.ok) throw new Error(resolved.error.message);
  expect(validateGameState(resolved.state).ok).toBe(true);
  expect(resolved.state.runner.rig.hardware).not.toContain(target);
  expect(resolved.state.runner.heap).toContain(target);
});
