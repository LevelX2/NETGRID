import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { applyAction, hashState, replayEvents } from "@netgrid/engine";
import type { GameState } from "@netgrid/shared";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import {
  buildAiDecisionInput,
  type AiDecisionInputWithDeckCapabilities,
} from "../../runtime/ai-decision-input";
import { corpFreeRezPayoutPreparation } from "./free-rez-payout-preparation";
import type {
  EconomyState,
  CorpEconomyDevelopmentSignal,
  CorpEconomyParentFundingSignal,
} from "./economy-types";
function fixture(name: "bbs" | "accounts" = "bbs") {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta569-score-" +
          name +
          "-funding.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
    engineState: GameState;
  };
}
afterEach(resetResidentPlanPortfolioMemory);
function prefix(name: "bbs" | "accounts", actionTypes: string[]) {
  const saved = fixture(name);
  let current = structuredClone(saved.engineState);
  expect(Object.values(saved.validation).every(Boolean)).toBe(true);
  const expectedParent =
    "plan:corp.score_agenda:agenda%3Acorp_onr_v1_193_corporate-coup_1%3Aremote_" +
    (name === "bbs" ? "3" : "1");
  for (const [index, type] of actionTypes.entries()) {
    const input =
      index === 0
        ? saved.input
        : buildAiDecisionInput(current, "corp", {
            ownDeckSnapshot: saved.input.ownDeckSnapshot!,
            difficulty: "hard",
          });
    input.planningStateIdentity = buildPlanningStateIdentity(input);
    if (index === 0)
      restoreAiRuntimeCheckpoint(
        input,
        input.ownDeckSnapshot!.deckSnapshotId,
        saved.runtime,
      );
    const before = JSON.stringify(input),
      result = chooseAiAction(input),
      action = input.legalActions.find((a) => a.actionId === result.actionId)!;
    expect(JSON.stringify(input)).toBe(before);
    expect(result).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
    expect(action.type).toBe(type);
    expect(result.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: expectedParent,
      selectedPlan: {
        moduleId: "corp.economy",
        parentInstanceId: expectedParent,
      },
      route: { actionId: action.actionId, stateVersion: current.stateVersion },
    });
    const applied = applyAction(current, {
      matchId: current.matchId,
      side: "corp",
      actionId: action.actionId,
      clientKnownStateVersion: current.stateVersion,
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) throw Error("Real Engine prefix rejected");
    current = applied.state;
  }
  const replay = replayEvents(
    saved.engineState,
    current.eventLog.slice(saved.engineState.eventLog.length),
  );
  expect(replay.ok).toBe(true);
  if (!replay.ok) throw Error("Replay rejected");
  expect(hashState(replay.state)).toBe(hashState(current));
  return current;
}
it("keeps install, free rez and both real payouts on the exact Score funding Need", () => {
  const end = prefix("bbs", [
    "install_card",
    "rez_card",
    "activated_card_ability",
    "activated_card_ability",
  ]);
  expect([end.corp.credits, end.corp.clicks]).toEqual([4, 0]);
});
it("preserves the better Basic -> Basic -> Accounts Receivable route", () => {
  const end = prefix("accounts", [
    "gain_credit",
    "gain_credit",
    "play_operation",
  ]);
  expect([end.corp.credits, end.corp.clicks]).toEqual([9, 0]);
});
it.each([
  "two_clicks",
  "one_click",
  "urgent_parent",
  "near_target",
  "stale",
] as const)("does not certify the setup after %s changes", (change) => {
  const saved = fixture(),
    input = saved.input;
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    saved.runtime,
  );
  chooseAiAction(input);
  const signals = residentPlanPortfolioSnapshot(input)!
    .instances.filter((i) => i.moduleId === "corp.economy")
    .map((i) => (i.moduleState as EconomyState).signal);
  const signal = structuredClone(
    signals.find(
      (s) => s.kind === "parent_funding" && s.freeRezPayoutPreparation,
    )! as CorpEconomyParentFundingSignal,
  );
  const campaigns = signals.filter(
    (s): s is CorpEconomyDevelopmentSignal => s.kind === "develop_campaign",
  );
  expect(signal.freeRezPayoutPreparation).toBeDefined();
  if (change === "two_clicks") input.playerView.own.clicks = 2;
  if (change === "one_click") input.playerView.own.clicks = 1;
  if (change === "urgent_parent") signal.delegatedPriorityClass = "P2";
  if (change === "near_target") {
    signal.gap = 1;
    signal.scoreFundingMilestone = {
      ...signal.scoreFundingMilestone!,
      remainingGap: 1,
      targetCredits: input.playerView.own.credits + 1,
    };
  }
  if (change === "stale")
    input.legalActions.find(
      (a) => a.actionId === signal.freeRezPayoutPreparation!.actionId,
    )!.expiresAtStateVersion--;
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "corp",
    stateVersion: input.playerView.stateVersion,
  });
  expect(
    corpFreeRezPayoutPreparation(
      input,
      candidates,
      signal,
      signal.freeRezPayoutPreparation!.basicFundingActionId,
      campaigns,
    ),
  ).toBeUndefined();
});
