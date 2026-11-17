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
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { buildRunnerEconomyPosture } from "../../runner-economy-posture";
import { creditBankFloorRecoveryWindow } from "./credit-bank-floor-recovery";

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
        "../../runtime/test-fixtures/meta581-r3-g6-d128-broker.json",
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

it("loads before a recoverable floor payout and funds the same next-turn R&D target using two fewer actions", () => {
  const f = fixture();
  expect(f.provenance.checkedStates).toBe(128);
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
    const targetActionId = "runner.start_run.rd";
    const targetCredits = 11;
    const steps: {
      side: Side;
      actionId: string;
      hash: string;
      selectedChoices?: Record<string, unknown>;
      bankOwner?: string | undefined;
    }[] = [];
    for (let n = 0; n < 24; n++) {
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
      const cashout = input.legalActions.find(
        (action) => action.payload?.cardImplementationAbilityKey === "withdraw_credits",
      );
      // Compare both financing routes against the same next-turn R&D action.
      const followingRunnerTurn = side === "runner" && state.turnSerial > f.state.turnSerial;
      const comparisonActionId = input.playerView.own.credits >= targetCredits
        ? targetActionId
        : oldCashout ? "runner.gain_credit" : cashout?.actionId;
      const controlled = followingRunnerTurn || (oldCashout && n === 0);
      const decision = controlled
        ? { actionId: followingRunnerTurn ? comparisonActionId : cashout?.actionId }
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
      const selectedChoices = "selectedChoices" in decision ? decision.selectedChoices : undefined;
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
      const bankOwner = action === cashout
        ? buildActionSemanticCandidates({
            legalActions: [action],
            observerSide: "runner",
            stateVersion: input.playerView.stateVersion,
            cardSemanticProfilesByDefinitionId: buildActionCardSemanticProfilesByDefinitionId(),
          })[0]?.planOwnerBinding?.owner
        : undefined;
      steps.push({
        side: side!,
        bankOwner,
        actionId: action.actionId,
        hash: hashGameState(state),
        ...(selectedChoices ? { selectedChoices } : {}),
      });
      if (action.type === "start_run") break;
    }
    expect(steps.at(-1)?.actionId).toBe(targetActionId);
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
  expect(after.view.own.credits).toBe(11);
  expect(before.view.own.credits).toBe(11);
  expect(after.view.own.clicks - before.view.own.clicks).toBe(2);
  expect(after.state.turnSerial).toBe(before.state.turnSerial);
  expect(after.view.own.gripOrHq).toEqual(before.view.own.gripOrHq);
  expect(after.state.corp).toEqual(before.state.corp);
  expect(after.view.opponent).toEqual(before.view.opponent);
  expect(after.state.randomCounter).toBe(before.state.randomCounter);
  expect(
    after.steps.filter((s) => s.side === "corp").map((s) => s.actionId),
  ).toEqual(
    before.steps.filter((s) => s.side === "corp").map((s) => s.actionId),
  );
  expect(after.steps.find((step) => step.bankOwner !== undefined)?.bankOwner).toBe("runner.credit_bank");
}, 30000);

function recovery(input: AiDecisionInputWithDeckCapabilities) {
  const candidates = buildActionSemanticCandidates(input);
  return creditBankFloorRecoveryWindow({
    input,
    candidates,
    economy: buildRunnerEconomyPosture({
      input,
      deckCapabilities: input.ownDeckCapabilities!,
      strategicIntent: input.ownRunnerStrategicIntent!,
    }),
    runTargets: [],
    handDevelopment: [],
    minimumHandBuffer: 3,
    loadActionIds: input.legalActions
      .filter((a) => a.payload?.cardImplementationAbilityKey === "store_credits")
      .map((a) => a.actionId),
  });
}
it("requires enough current actions for the actual floor, independently of the amount already banked", () => {
  const input = fixture().runner.input;
  expect(recovery(input)).toMatchObject({ projectedEndTurnCredits: 5 });
  input.playerView.own.clicks = 1;
  expect(recovery(input)).toBeUndefined();
});
it.each([
  "tag",
  "hand",
  "own-matchpoint",
  "corp-matchpoint",
  "short-stack",
  "short-rd",
  "income-missing",
  "income-stale",
  "visible-score",
])("keeps the current payout safeguard for %s", (kind) => {
  const input = fixture().runner.input;
  if (kind === "tag") input.playerView.own.tags = 1;
  if (kind === "hand")
    input.playerView.own.gripOrHq = input.playerView.own.gripOrHq.slice(0, 1);
  if (kind === "own-matchpoint") input.playerView.own.agendaPoints = 6;
  if (kind === "corp-matchpoint") input.playerView.opponent.agendaPoints = 6;
  if (kind === "short-stack") input.playerView.own.stackOrRdCount = 1;
  if (kind === "short-rd") input.playerView.opponent.deckCount = 1;
  if (kind === "income-missing")
    input.legalActions = input.legalActions.filter(
      (a) => a.type !== "gain_credit",
    );
  if (kind === "income-stale")
    input.legalActions.find((a) => a.type === "gain_credit")!
      .expiresAtStateVersion--;
  if (kind === "visible-score") {
    const source = input.playerView.servers.flatMap((s) => s.root)[0]!;
    input.playerView.servers.find((s) => s.id === "r1")!.root = [
      { ...source, advancementCounters: 2 },
    ];
  }
  expect(recovery(input)).toBeUndefined();
});
