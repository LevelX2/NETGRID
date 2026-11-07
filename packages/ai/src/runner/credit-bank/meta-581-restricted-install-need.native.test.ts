import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { applyAction, getPlayerView, hashGameState } from "@netgrid/engine";
import type { GameState, Side } from "@netgrid/shared";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
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
  selectAiDecisionSideForState,
  type AiDecisionInputWithDeckCapabilities,
} from "../../runtime/ai-decision-input";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildRunnerEconomyPosture } from "../../runner-economy-posture";
import { evaluateRunnerHandDevelopment } from "../hand-development/hand-development-evaluation";

type Checkpoint = {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
  stateHash: string;
  validation: Record<string, boolean>;
};
function fixture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../runtime/test-fixtures/meta581-r4-g24-d65-broker.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    state: GameState;
    runner: Checkpoint;
    corp: Checkpoint;
    provenance: { checkedStates: number };
  };
}
afterEach(resetResidentPlanPortfolioMemory);

function chooseDirect(input: AiDecisionInputWithDeckCapabilities) {
  const decision = chooseAiAction(input);
  if (
    decision.selectionKind !== undefined &&
    decision.selectionKind !== "direct"
  )
    throw Error(
      "This recorded bank/credit/run sequence contains only direct decisions.",
    );
  return decision;
}

it("does not treat an unavailable restricted-install bit as acute income and preserves the important next-turn steal", () => {
  const f = fixture();
  expect(f.provenance.checkedStates).toBe(65);
  expect(hashGameState(f.state)).toBe(f.runner.stateHash);
  for (const cp of [f.runner, f.corp])
    expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  function play(oldCashout: boolean) {
    resetResidentPlanPortfolioMemory();
    for (const cp of [f.runner, f.corp]) {
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
    }
    let state = f.state;
    const steps: {
      side: Side;
      actionId: string;
      hash: string;
      selectedChoices?: Record<string, unknown>;
      module?: string | undefined;
      root?: string | undefined;
    }[] = [];
    let runStarted = false;
    for (let n = 0; n < 96; n++) {
      if (runStarted && state.timingPoint === "runner_action.main") break;
      const { side } = selectAiDecisionSideForState(state);
      expect(side).toBeDefined();
      const cp = f[side!];
      const input =
        n === 0
          ? cp.input
          : buildAiDecisionInput(state, side!, {
              difficulty: cp.input.difficulty,
              profileId: cp.input.profileId,
              ownDeckSnapshot: cp.input.ownDeckSnapshot!,
            });
      const unchanged = JSON.stringify(input);
      const decision: Partial<ReturnType<typeof chooseDirect>> & {
        actionId: string;
      } =
        oldCashout && n === 0
          ? {
              actionId: input.legalActions.find((a) =>
                a.actionId.endsWith("withdraw_credits"),
              )!.actionId,
            }
          : chooseDirect(input);
      expect(JSON.stringify(input)).toBe(unchanged);
      if ("fallbackUsed" in decision)
        expect(decision).toMatchObject({
          fallbackUsed: false,
          timeoutUsed: false,
        });
      const action = input.legalActions.find(
        (a) => a.actionId === decision.actionId,
      )!;
      expect(action).toBeDefined();
      if (n === 0 && !oldCashout) {
        expect(action.payload?.cardImplementationAbilityKey).toBe(
          "store_credits",
        );
        expect(
          "decisionDebug" in decision &&
            decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
        ).toBe("runner.credit_bank");
      }
      const selectedChoices = decision.selectedChoices;
      const result = applyAction(state, {
        matchId: state.matchId,
        side: side!,
        actionId: action.actionId,
        clientKnownStateVersion: state.stateVersion,
        ...(selectedChoices ? { selectedChoices } : {}),
      });
      expect(result.ok).toBe(true);
      if (!result.ok) throw Error(result.error.message);
      state = result.state;
      steps.push({
        side: side!,
        actionId: action.actionId,
        hash: hashGameState(state),
        ...(selectedChoices ? { selectedChoices } : {}),
        ...("decisionDebug" in decision
          ? {
              module:
                decision.decisionDebug?.planFirstDecision?.selectedPlan
                  ?.moduleId,
              root: decision.decisionDebug?.planFirstDecision
                ?.rootPlanInstanceId,
            }
          : {}),
      });
      if (action.type === "start_run") runStarted = true;
    }
    expect(steps.at(-1)?.actionId).toContain("runner.steal_agenda.");
    let replay = f.state;
    for (const step of steps) {
      const result = applyAction(replay, {
        matchId: replay.matchId,
        side: step.side,
        actionId: step.actionId,
        clientKnownStateVersion: replay.stateVersion,
        ...(step.selectedChoices
          ? { selectedChoices: step.selectedChoices }
          : {}),
      });
      expect(result.ok).toBe(true);
      if (!result.ok) throw Error(result.error.message);
      replay = result.state;
      expect(hashGameState(replay)).toBe(step.hash);
    }
    expect(hashGameState(replay)).toBe(hashGameState(state));
    return { state, steps, view: getPlayerView(state, "runner") };
  }
  const before = play(true),
    after = play(false);
  expect(after.view.own.credits).toBe(4);
  expect(before.view.own.credits).toBe(7);
  expect(after.view.own.clicks).toBe(3);
  expect(before.view.own.clicks).toBe(3);
  expect(after.view.own.agendaPoints).toBe(2);
  expect(before.view.own.agendaPoints).toBe(2);
  const stored = (view: typeof after.view) =>
    view.own
      .rig!.filter((c) => c.definitionId === "onr_v1_154_broker")
      .reduce((n, c) => n + (c.counters?.bit ?? 0), 0);
  expect(stored(after.view)).toBe(6);
  expect(stored(before.view)).toBe(0);
  expect(
    after.view.own.credits + stored(after.view) - before.view.own.credits,
  ).toBe(3);
  expect(after.state.turnSerial).toBe(before.state.turnSerial);
  expect(after.view.own.gripOrHq).toEqual(before.view.own.gripOrHq);
  expect(after.state.corp).toEqual(before.state.corp);
  expect(after.view.opponent).toEqual(before.view.opponent);
  // Changed liquidity can change the conditional reply to Coyote while its
  // inner ICE is still hidden. Each branch is replayed above; their RNG
  // counters need not match when only the stored-bank branch tries Blink.
  expect(after.state.randomCounter).toBe(before.state.randomCounter + 1);
  expect(after.state.randomDrawRecords.at(-1)).toMatchObject({
    counter: before.state.randomCounter,
    purpose: expect.stringContaining(
      "icebreaker.random_break_or_damage.onr_v1_007_blink",
    ),
  });
  expect(after.steps.some((step) =>
    step.actionId.startsWith("runner.break_subroutine.") &&
    step.actionId.includes("onr_v1_007_blink"),
  )).toBe(true);
  expect(
    after.steps.filter((s) => s.side === "corp").map((s) => s.actionId),
  ).toEqual(
    before.steps.filter((s) => s.side === "corp").map((s) => s.actionId),
  );
  expect(
    after.steps.find((s) => s.actionId === "runner.start_run.remote_1")?.module,
  ).toBe("runner.contest_remote");
}, 30000);

it("reports no acute economy need for a pure unavailable program-install bundle", () => {
  const input = fixture().runner.input;
  const evaluations = evaluateRunnerHandDevelopment({
    input,
    actionCandidates: buildActionSemanticCandidates(input),
    deckCapabilities: input.ownDeckCapabilities!,
    strategicIntent: input.ownRunnerStrategicIntent!,
  });
  const bundle = evaluations.find(
    (e) => e.definitionId === "onr_v1_117_valu-pak-software-bundle",
  );
  expect(bundle).toMatchObject({
    availability: "timing_blocked",
    currentNeed: "none",
  });
  expect(
    input.legalActions.some((a) => a.source === bundle!.cardInstanceId),
  ).toBe(false);
});
