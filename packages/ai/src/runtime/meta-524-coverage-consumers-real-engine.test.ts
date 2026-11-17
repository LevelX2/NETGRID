import { referencesDefaultDeckCard } from "../evaluation/decision-checkpoints/compact-card-reference.test-support";
import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  applyRandomizedIceInstallSelection,
  createGame,
  createGameAfterSetup,
  getLegalActions,
  hashGameState,
  quoteRandomizedIceInstallSelection,
} from "@netgrid/engine";
import type { PlayerAction, Side, ServerId } from "@netgrid/shared";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { putRunnerCardOnTopOfStack, removeEverywhere } from "../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "./ai-decision-input";

type Fixture = {
  gameNumber: number;
  options: Parameters<typeof createGame>[0];
  initialHash: string;
  commands: {
    side: Side;
    applied: Pick<PlayerAction, "actionId" | "selectedChoices">;
    random?: { rngDrawPurpose: string; rngDrawCounter: number };
    hash: string;
  }[];
  checkpoint: {
    stateVersion: number;
    stateHash: string;
    decisionId: string;
    actionNumber: number;
    profileId: string;
    ownDeckSnapshot: NonNullable<
      Parameters<typeof buildAiDecisionInput>[2]
    >["ownDeckSnapshot"];
    originalLegalActionIds: string[];
    runtime: AiRuntimeCheckpointV1;
  };
};
const fixtures = JSON.parse(
  readFileSync(
    new URL(
      "../../../../data/scenarios/ai-decision-checkpoints/meta-524-original-prefixes.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as Fixture[];
afterEach(resetResidentPlanPortfolioMemory);

function decodeParts(value: string): string[] {
  const mark = value.indexOf(";");
  expect(mark).toBeGreaterThan(0);
  const count = Number(value.slice(0, mark));
  expect(Number.isSafeInteger(count) && count >= 0).toBe(true);
  let at = mark + 1;
  const result: string[] = [];
  for (let n = 0; n < count; n++) {
    const colon = value.indexOf(":", at);
    expect(colon).toBeGreaterThan(at);
    const length = Number(value.slice(at, colon));
    expect(Number.isSafeInteger(length) && length >= 0).toBe(true);
    at = colon + 1;
    expect(at + length).toBeLessThanOrEqual(value.length);
    result.push(value.slice(at, at + length));
    at += length;
  }
  expect(at).toBe(value.length);
  return result;
}

function replay(gameNumber: number) {
  const fixture = fixtures.find((f) => f.gameNumber === gameNumber)!;
  let state = createGame(fixture.options);
  expect(hashGameState(state)).toBe(fixture.initialHash);
  for (const command of fixture.commands) {
    let result;
    if (command.random) {
      const parts = decodeParts(command.random.rngDrawPurpose);
      expect(parts).toHaveLength(7);
      expect(parts[0]).toBe("engine.randomized_ice_install_selection");
      expect(parts[2]).toBe("corp");
      expect(command.side).toBe("corp");
      expect(Number(parts[3])).toBe(state.stateVersion);
      expect(parts[4]).toBe(state.timingPoint);
      expect(command.random.rngDrawCounter).toBe(state.randomCounter);
      const fingerprint = decodeParts(parts[6]!);
      expect(fingerprint[0]).toBe(parts[1]);
      const count = Number(fingerprint[1]);
      expect(Number.isSafeInteger(count) && count >= 2).toBe(true);
      expect(fingerprint).toHaveLength(2 + count * 2);
      const request: Parameters<typeof quoteRandomizedIceInstallSelection>[1] =
        {
          schemaVersion: parts[1] as Parameters<
            typeof quoteRandomizedIceInstallSelection
          >[1]["schemaVersion"],
          matchId: state.matchId,
          side: "corp",
          stateVersion: state.stateVersion,
          timingPoint: state.timingPoint,
          planStepId: parts[5]!,
          candidates: Array.from({ length: count }, (_, i) => ({
            actionId: fingerprint[2 + i * 2]!,
            targetServerId: fingerprint[3 + i * 2]! as ServerId,
          })),
        };
      const quoted = quoteRandomizedIceInstallSelection(state, request);
      if (!quoted.ok) throw Error("original_random_quote_rejected");
      expect(quoted.quote.candidateFingerprint).toBe(parts[6]);
      result = applyRandomizedIceInstallSelection(state, {
        kind: "engine_randomized_ice_install_selection",
        quote: quoted.quote,
      });
      if (!result.ok) throw Error("original_random_command_rejected");
      expect(result.receipt.selectedLegalAction.actionId).toBe(
        command.applied.actionId,
      );
      expect(result.receipt.randomDraw.purpose).toBe(
        command.random.rngDrawPurpose,
      );
    } else {
      result = applyAction(state, {
        matchId: state.matchId,
        side: command.side,
        clientKnownStateVersion: state.stateVersion,
        ...command.applied,
      });
    }
    if (!result.ok) throw Error(result.error.message);
    state = result.state;
    expect(hashGameState(state)).toBe(command.hash);
  }
  const cp = fixture.checkpoint;
  expect(state.stateVersion).toBe(cp.stateVersion);
  expect(hashGameState(state)).toBe(cp.stateHash);
  const input = {
    ...buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
      ownDeckSnapshot: cp.ownDeckSnapshot,
      eventTail: state.eventLog,
    }),
    decisionId: cp.decisionId,
    actionNumber: cp.actionNumber,
    profileId: cp.profileId,
  };
  // Legal-action ordering is not part of replay identity. Preserve the exact
  // multiset of commands while allowing the current Engine's presentation order.
  expect(input.legalActions.map((a) => a.actionId).sort()).toEqual(
    [...cp.originalLegalActionIds].sort(),
  );
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  return { state, input };
}

it("executes the ready Inside Job without borrowing the normal run's Wall support (G6 D158, 157 original commands)", () => {
  const { state, input } = replay(6);
  const decision = chooseAiAction(input);
  const action = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  )!;
  expect(action).toMatchObject({
    type: "play_event",
    payload: { serverId: "r1", bypassFirstIce: true },
  });
  expect(referencesDefaultDeckCard(action.source, 306)).toBe(true);
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("runner.contest_remote");
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!result.ok) throw Error(result.error.message);
  expect(result.state.runner.credits).toBe(20);
  expect(result.state.runner.clicks).toBe(1);
  expect(result.state.run?.attackedServerId).toBe("r1");
});

it("retains the unique just-drawn Gate answer for its exact coverage executor (G18 D33, 32 original commands)", () => {
  const { state, input } = replay(18);
  const decision = chooseAiAction(input);
  expect(decision.selectedChoices).toEqual({
    choiceId: "p3_61_crash_draw_32",
    selectedOptionIds: ["trash_c2g1"],
  });
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId: decision.actionId!,
    clientKnownStateVersion: state.stateVersion,
    selectedChoices: decision.selectedChoices!,
  });
  if (!result.ok) throw Error(result.error.message);
  expect(result.state.runner.grip).toContain("c1ea");
  expect(result.state.runner.heap).toContain(
    "c2g1",
  );
});

it("discards the newly drawn duplicate Gate breaker when another copy is installed", () => {
  const fixture = fixtures.find((candidate) => candidate.gameNumber === 18)!;
  let state = createGameAfterSetup({ ...fixture.options, seed: "coverage-duplicate-gate-draw" });
  for (const type of ["mandatory_draw", "end_turn"] as const) {
    if (type === "end_turn") RealEngineFixtureBuilder.forState(state).withCorpHqSize(0);
    const action = getLegalActions(state, "corp").find((candidate) => candidate.type === type)!;
    const applied = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    if (!applied.ok) throw Error(applied.error.message);
    state = applied.state;
  }
  RealEngineFixtureBuilder.forState(state)
    .withRunnerGripSize(0)
    .withRunnerCredits(4)
    .withRunnerClicks(1)
    .withRunnerProgramInstalled(226)
    .withRunnerResourceInstalled(369);
  state.runner.memoryUsed = 1;
  state.runnerTurnFlags!.runLockActionsPending = 1;
  state.runnerTurnFlags!.runnerRunLockCreditCost = 10;
  const installed = state.runner.rig.programs[0]!;
  const duplicate = Object.values(state.cardInstances).find((card) =>
    card.definitionId === 226 && card.instanceId !== installed,
  )!;
  removeEverywhere(state, duplicate.instanceId);
  duplicate.zone = { side: "runner", zone: "stack" };
  state.runner.stack.unshift(duplicate.instanceId);
  putRunnerCardOnTopOfStack(state, 396);
  const decide = (current: typeof state) => chooseAiAction(buildAiDecisionInput(current, "runner", {
    difficulty: "hard",
    ownDeckSnapshot: fixture.checkpoint.ownDeckSnapshot,
  }));
  const draw = decide(state);
  expect(draw.actionId).toBe("runner.draw_card");
  const drawn = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId: draw.actionId!,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!drawn.ok) throw Error(drawn.error.message);
  const decision = decide(drawn.state);
  expect(decision.selectedChoices).toEqual({
    choiceId: drawn.state.pendingChoice?.choiceId,
    selectedOptionIds: ["trash_" + duplicate.instanceId],
  });
  const applied = applyAction(drawn.state, {
    matchId: state.matchId,
    side: "runner",
    actionId: decision.actionId!,
    clientKnownStateVersion: drawn.state.stateVersion,
    selectedChoices: decision.selectedChoices,
  });
  if (!applied.ok) throw Error(applied.error.message);
  expect(applied.state.runner.heap).toContain(duplicate.instanceId);
  expect(applied.state.runner.rig.programs).toContain(installed);
});

it("rejects a changed hidden-draw origin instead of protecting or choosing an unbound card", () => {
  const { input } = replay(18);
  const continuation = input.playerView.pendingChoice!.continuation!;
  if (continuation.family !== "runner_hidden_draw_keep_or_top_replacement")
    throw Error("wrong_native_family");
  continuation.originActionId = "runner.unbound_source";
  expect(() => chooseAiAction(input)).toThrow();
});
