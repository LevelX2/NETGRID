import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { applyAction, getLegalActions, hashGameState } from "@netgrid/engine";
import type { GameState } from "@netgrid/shared";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../input-dto";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";
import { selectedChoicesForDecision } from "./selected-choices-for-decision";

afterEach(resetResidentPlanPortfolioMemory);
function fixture(ref: string) {
  const f = JSON.parse(
    readFileSync(
      new URL(`./test-fixtures/meta-530-${ref}-expiry.json`, import.meta.url),
      "utf8",
    ),
  );
  expect(Object.values(f.checkpoint.validation).every((v) => v === true)).toBe(
    true,
  );
  expect(
    f.provenance.eachPrefixHashMatches && f.provenance.checkpointHashMatches,
  ).toBe(true);
  expect(hashGameState(f.state)).toBe(f.checkpoint.stateHash);
  const input = {
    ...f.checkpoint.input,
    ...buildAiDecisionInputDto(f.checkpoint.input),
  } as AiDecisionInputWithDeckCapabilities;
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    f.checkpoint.runtime,
  );
  return { ...f, input, state: f.state as GameState };
}
function take(
  state: GameState,
  side: "corp" | "runner",
  actionId: string,
  choices?: { choiceId: string; selectedOptionIds: string[] },
) {
  expect(
    getLegalActions(state, side).some((a) => a.actionId === actionId),
  ).toBe(true);
  const r = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId,
    clientKnownStateVersion: state.stateVersion,
    ...(choices ? { selectedChoices: choices } : {}),
  });
  if (!r.ok) throw Error(r.error.message);
  return r.state;
}
it.each(["g3d108", "g4d180"])(
  "binds decline to the native last-access target expiry and preserves the whole cleanup result (%s)",
  (ref) => {
    const f = fixture(ref),
      originalInput = JSON.stringify({
        view: f.input.playerView,
        legal: f.input.legalActions,
        deck: f.input.ownDeckSnapshot,
      }),
      originalState = hashGameState(f.state);
    const decision = chooseAiAction(f.input);
    expect(decision.fallbackUsed).toBe(false);
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe("corp.ambush_and_bluff");
    expect(decision.selectedChoices?.selectedOptionIds).toEqual(["decline"]);
    expect(
      JSON.stringify({
        view: f.input.playerView,
        legal: f.input.legalActions,
        deck: f.input.ownDeckSnapshot,
      }),
    ).toBe(originalInput);
    expect(hashGameState(f.state)).toBe(originalState);
    const choiceId = f.input.playerView.pendingChoice!.choiceId;
    const paid = take(f.state, "corp", "corp.resolve_choice", {
      choiceId,
      selectedOptionIds: ["pay"],
    });
    const declined = take(f.state, "corp", decision.actionId!, {
      choiceId,
      selectedOptionIds: ["decline"],
    });
    const paidCleanup = take(
      paid,
      "runner",
      f.nextOriginalRunnerAction.actionId,
    );
    const declinedCleanup = take(
      declined,
      "runner",
      f.nextOriginalRunnerAction.actionId,
    );
    expect(paidCleanup.run).toBeUndefined();
    expect(declinedCleanup.run).toBeUndefined();
    expect(declinedCleanup.runner).toEqual(paidCleanup.runner);
    for (const id of f.input.playerView.run!
      .runEndTrashUsedBreakerIdsThisRun!) {
      expect(declinedCleanup.cardInstances[id]).toEqual(
        paidCleanup.cardInstances[id],
      );
      expect(paidCleanup.runner.heap).toContain(id);
      expect(paidCleanup.cardInstances[id]!.counters).toBeUndefined();
    }
    expect(declinedCleanup.corp.credits - paidCleanup.corp.credits).toBe(3);
  },
);
it("retains activation in the native multiaccess control instead of inventing a closed horizon", () => {
  const f = fixture("g1d296"),
    decision = chooseAiAction(f.input);
  expect(f.input.playerView.run!.breach!.remainingCount).toBe(1);
  expect(decision.selectedChoices?.selectedOptionIds).toEqual(["pay"]);
});
it("retains the useful penalty on the native unused Rental target after access cleanup", () => {
  const f = fixture("g26d95"),
    decision = chooseAiAction(f.input);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.selectedChoices?.selectedOptionIds).toEqual(["pay"]);
  expect(f.input.playerView.run!.breach!.remainingCount).toBe(0);
  expect(
    f.input.playerView.run!.runEndTrashUsedBreakerIdsThisRun,
  ).toBeUndefined();
  const choiceId = f.input.playerView.pendingChoice!.choiceId;
  const paid = take(f.state, "corp", "corp.resolve_choice", {
    choiceId,
    selectedOptionIds: ["pay"],
  });
  const cleanup = take(paid, "runner", f.nextOriginalRunnerAction.actionId);
  const target = f.input.playerView.opponent.rig!.find(
    (c: { subtypes?: string[] }) => c.subtypes?.includes("icebreaker"),
  )!;
  expect(cleanup.run).toBeUndefined();
  expect(cleanup.runner.rig.programs).toContain(target.instanceId);
  expect(cleanup.cardInstances[target.instanceId]!.counters?.pattel).toBe(1);
});
it("retains the native Runner-bound access penalty even when the used breaker expires", () => {
  const f = fixture("g31d405"),
    decision = chooseAiAction(f.input);
  expect(
    f.input.playerView.run!.runEndTrashUsedBreakerIdsThisRun!.length,
  ).toBeGreaterThan(0);
  expect(f.input.playerView.run!.breach!.remainingCount).toBe(0);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.selectedChoices?.selectedOptionIds).toEqual(["pay"]);
});
it.each(["run", "targets", "remaining_access", "selected_option"])(
  "fails closed when the native expiry binding changes: %s",
  (mode) => {
    const f = fixture("g3d108");
    chooseAiAction(f.input);
    const portfolio = residentPlanPortfolioSnapshot(f.input)!;
    const altered = structuredClone(f.input);
    if (mode === "run") altered.playerView.run!.runId += "-changed";
    if (mode === "targets")
      altered.playerView.run!.runEndTrashUsedBreakerIdsThisRun = [];
    if (mode === "remaining_access")
      altered.playerView.run!.breach!.remainingCount = 1;
    if (mode === "selected_option") {
      const executor = portfolio.instances.find(
        (p) => p.instanceId === portfolio.executorInstanceId,
      )!;
      const state = executor.moduleState as {
        signal: { accessPaymentChoiceBinding: { selectedOptionIds: string[] } };
      };
      state.signal.accessPaymentChoiceBinding.selectedOptionIds = ["pay"];
    }
    const action = altered.legalActions.find(
      (a: AiDecisionInputWithDeckCapabilities["legalActions"][number]) =>
        a.type === "resolve_choice",
    )!;
    expect(() =>
      selectedChoicesForDecision(altered, action, {} as never, portfolio),
    ).toThrow(expect.objectContaining({ code: "window_origin_missing" }));
  },
);
