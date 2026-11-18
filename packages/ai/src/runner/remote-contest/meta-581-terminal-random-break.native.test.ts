import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { applyAction, hashGameState } from "@netgrid/engine";
import type { GameState } from "@netgrid/shared";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import {
  buildAiDecisionInput,
  type AiDecisionInputWithDeckCapabilities,
} from "../../runtime/ai-decision-input";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { terminalRandomBreakRescueForRun } from "./remote-contest-random-break-rescue";
function fixture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../runtime/test-fixtures/meta581-r4-g34-d408-terminal.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    state: GameState;
    runner: {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
      stateHash: string;
      validation: Record<string, boolean>;
    };
    provenance: { checkedStates: number };
  };
}
afterEach(resetResidentPlanPortfolioMemory);
function direct(input: AiDecisionInputWithDeckCapabilities) {
  const d = chooseAiAction(input);
  if (d.selectionKind !== undefined && d.selectionKind !== "direct")
    throw Error("Expected direct runner decision");
  return d;
}
function evaluation(input: AiDecisionInputWithDeckCapabilities) {
  return evaluateRunnerRunTargets({
    input,
    actionCandidates: buildActionSemanticCandidates(input),
    deckCapabilities: input.ownDeckCapabilities!,
    strategicIntent: input.ownRunnerStrategicIntent!,
  }).find((e) => e.targetServerId === "r1")!;
}
function play(seed?: string) {
  resetResidentPlanPortfolioMemory();
  const f = fixture(),
    cp = f.runner;
  expect(f.provenance.checkedStates).toBe(408);
  expect(hashGameState(f.state)).toBe(cp.stateHash);
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  cp.input.planningStateIdentity = buildPlanningStateIdentity(cp.input);
  restoreAiRuntimeCheckpoint(
    cp.input,
    cp.input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  restoreResidentPlanPortfolioMemorySnapshot(
    cp.input,
    cp.runtime.residentPlanPortfolio!,
  );
  let state = seed ? { ...f.state, seed } : f.state;
  const initial = state;
  const steps: {
    action: string;
    after: string;
    command: Parameters<typeof applyAction>[1];
  }[] = [];
  for (let n = 0; n < 18 && !state.winner; n++) {
    const input =
      n === 0
        ? cp.input
        : buildAiDecisionInput(state, "runner", {
            difficulty: cp.input.difficulty,
            profileId: cp.input.profileId,
            ownDeckSnapshot: cp.input.ownDeckSnapshot!,
          });
    const unchanged = JSON.stringify(input),
      decision = direct(input);
    expect(JSON.stringify(input)).toBe(unchanged);
    expect(decision).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
    const action = input.legalActions.find(
      (a) => a.actionId === decision.actionId,
    )!;
    expect(action).toBeDefined();
    if (n === 0) {
      expect(action.actionId).toBe("rs.r1");
      expect(
        decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
      ).toBe("runner.contest_remote");
      expect(
        decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
      ).toBe("p1p4xezjcxov79rno40lq3f7rv");
    }
    if (action.type === "break_subroutine") {
      expect(action.payload?.subroutineIndex).toBe(1);
      expect(action.payload?.targetIceDefinitionId).toBe(
        79,
      );
      expect(
        decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
      ).toBe("p1p4xezjcxov79rno40lq3f7rv");
      expect(JSON.stringify(decision.decisionDebug)).toContain(
        "runner_bound_terminal_random_break_last_chance",
      );
    }
    const command = {
      matchId: state.matchId,
      side: "runner" as const,
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(decision.selectedChoices
        ? { selectedChoices: decision.selectedChoices }
        : {}),
    };
    const result = applyAction(state, command);
    expect(result.ok).toBe(true);
    if (!result.ok) throw Error(result.error.message);
    if (action.type === "break_subroutine") {
      const dice = result.state.randomDrawRecords
        .slice(state.randomDrawRecords.length)
        .filter((draw) => draw.purpose[0] === 20);
      expect(dice).toHaveLength(1);
      const roll = Math.floor(dice[0]!.value * 6) + 1;
      expect(result.event.publicPayload).toMatchObject({
        randomBreakOutcomeRoll: roll,
        randomBreakOutcomeSuccess: roll >= 4,
        randomBreakOutcomeDamageAmount: roll >= 4 ? 0 : roll,
      });
    }
    state = result.state;
    steps.push({
      action: action.actionId,
      after: hashGameState(state),
      command,
    });
  }
  expect(state.winner).toBeTruthy();
  expect(
    steps.filter((s) => s.action.startsWith("r3")),
  ).toHaveLength(1);
  let replay = initial;
  for (const s of steps) {
    const r = applyAction(replay, s.command);
    expect(r.ok).toBe(true);
    if (!r.ok) throw Error(r.error.message);
    replay = r.state;
    expect(hashGameState(replay)).toBe(s.after);
  }
  expect(hashGameState(replay)).toBe(hashGameState(state));
  return state.winner;
}
it("attempts the bound last chance under the original seed and follows the current deterministic die", () => {
  expect(play()).toBe("runner");
}, 30000);
it("preserves a real winning branch and honest backfire losses over 24 separate Engine dice", () => {
  const winners = Array.from({ length: 24 }, (_, i) =>
    play("meta581-r4-terminal-counter-" + i),
  );
  expect(winners.filter((s) => s === "runner")).toHaveLength(10);
  expect(winners.filter((s) => s === "corp")).toHaveLength(14);
}, 30000);
it.each([
  "nonterminal",
  "stack",
  "hand",
  "tag",
  "unknown-ice",
  "positive-damage",
  "two-stops",
  "unfunded",
  "stale-action",
  "stable-answer",
  "alternative-recovery-action",
  "missing-rig-fact",
])("does not admit a last-chance override for %s", (kind) => {
  const input = fixture().runner.input,
    e = evaluation(input);
  expect(terminalRandomBreakRescueForRun(input, e)).toBeDefined();
  if (kind === "nonterminal") input.playerView.opponent.agendaPoints = 0;
  if (kind === "stack") input.playerView.own.stackOrRdCount = 1;
  if (kind === "hand")
    input.playerView.own.gripOrHq = [input.playerView.own.rig![0]!];
  if (kind === "tag") input.playerView.own.tags = 1;
  if (kind === "missing-rig-fact") delete input.playerView.own.rig;
  const ice = input.playerView.servers.find((s) => s.id === "r1")!
    .ice[1]!;
  if (kind === "unknown-ice") ice.known = false;
  if (kind === "positive-damage")
    ice.effectiveRunQuote!.subroutines[0]!.amount = 1;
  if (kind === "two-stops")
    ice.effectiveRunQuote!.subroutines.push({
      ...ice.effectiveRunQuote!.subroutines[1]!,
      id: "second_stop",
    });
  if (kind === "unfunded") input.playerView.own.credits = 0;
  if (kind === "stale-action")
    input.legalActions.find((a) => a.actionId === e.actionId)!
      .expiresAtStateVersion++;
  if (kind === "stable-answer")
    e.randomBreakOrDamageRiskAssessment!.stableCoverageAvailable = true;
  if (kind === "alternative-recovery-action") {
    const recovery = input.legalActions.find(
      (a) => a.type === "activated_card_ability",
    )!;
    recovery.payload = {
      ...recovery.payload,
      effectKind: "move_top_trash_to_grip",
    };
  }
  expect(terminalRandomBreakRescueForRun(input, e)).toBeUndefined();
});
