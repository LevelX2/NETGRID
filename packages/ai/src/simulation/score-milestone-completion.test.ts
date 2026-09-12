import { expect, it } from "vitest";
import {
  createGame,
  applyAction,
  hashGameState,
  getPlayerView,
} from "@netgrid/engine";
import cpJson from "../../../../data/scenarios/ai-decision-checkpoints/cp-score-continuity-known-427-d412.json";
import prefix from "../../../../data/scenarios/ai-decision-checkpoints/cp-score-continuity-known-427-prefix.json";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import {
  buildAiDecisionInput,
  type AiDecisionInputWithDeckCapabilities,
} from "../runtime/ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "../evaluation/decision-checkpoints/runtime-checkpoint";

it("finishes the audited multi-turn campaign before the second Runner window", () => {
  let state = createGame(prefix.creation as Parameters<typeof createGame>[0]);
  for (const command of prefix.commands) {
    expect(command.kind).toBe("action");
    const result = applyAction(state, {
      ...command,
      matchId: state.matchId,
      clientKnownStateVersion: state.stateVersion,
    } as Parameters<typeof applyAction>[1]);
    if (!result.ok) throw new Error(result.error.message);
    state = result.state;
  }
  expect(hashGameState(state)).toBe(cpJson.stateHash);
  const cp = structuredClone(cpJson) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    cp.input,
    cp.input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const root =
    "plan:corp.score_agenda:agenda%3Acorp_onr_v1_193_corporate-coup_1%3Aremote_1";
  const selected: string[] = [];
  const corp = () => {
    const input = buildAiDecisionInput(state, "corp", {
      difficulty: "hard",
      profileId: cp.input.profileId,
      ownDeckSnapshot: cp.input.ownDeckSnapshot!,
      decisionId: `score-milestone:${state.stateVersion}`,
    });
    const decision = chooseAiAction(input);
    expect(decision.fallbackUsed).toBe(false);
    if (decision.actionId!.includes("corporate-coup")) {
      expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
        rootPlanInstanceId: root,
        leafExecutorInstanceId: root,
      });
    }
    selected.push(decision.actionId!);
    const result = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: decision.actionId!,
      clientKnownStateVersion: state.stateVersion,
      ...(decision.selectedChoices
        ? { selectedChoices: decision.selectedChoices }
        : {}),
    });
    if (!result.ok) throw new Error(result.error.message);
    state = result.state;
  };
  for (let i = 0; i < 10 && state.activeSide === "corp"; i++) corp();
  expect(state.activeSide).toBe("runner");
  // Preserve the exact historical intervening reply; this tests completion
  // timing at D412, not an independent claim about the full-match winner.
  for (const reply of prefix.runnerReply) {
    const result = applyAction(state, {
      ...reply,
      side: "runner",
      matchId: state.matchId,
      clientKnownStateVersion: state.stateVersion,
    });
    if (!result.ok) throw new Error(result.error.message);
    state = result.state;
  }
  for (
    let i = 0;
    i < 10 &&
    state.activeSide === "corp" &&
    getPlayerView(state, "corp").own.agendaPoints < 6;
    i++
  )
    corp();
  expect(getPlayerView(state, "corp").own.agendaPoints).toBe(6);
  expect(getPlayerView(state, "runner").own.agendaPoints).toBe(3);
  expect(state.turnSerial).toBe(56);
  expect(
    selected.filter(
      (id) =>
        id.startsWith("corp.advance_card.") && id.includes("corporate-coup"),
    ),
  ).toHaveLength(5);
  expect(selected).not.toContain("corp.draw_card");
});
