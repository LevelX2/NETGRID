import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { applyAction, getLegalActions, hashGameState } from "@netgrid/engine";
import type { AiDecisionInput, GameState } from "@netgrid/shared";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../input-dto";
import { buildAiDecisionInput } from "./ai-decision-input";
import { currentEncounterRequiresDamagePreservingBreak } from "./current-encounter-damage";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";

const fixture = (kind: "shell-substitution" | "trace-payment") =>
  JSON.parse(
    readFileSync(
      new URL(`./test-fixtures/meta-529-${kind}.json`, import.meta.url),
      "utf8",
    ),
  );
afterEach(resetResidentPlanPortfolioMemory);
function original(kind: "shell-substitution" | "trace-payment") {
  const { checkpoint: cp, state, provenance, steps } = fixture(kind);
  expect(Object.values(cp.validation).every((v) => v === true)).toBe(true);
  expect(
    provenance.eachPrefixHashMatches && provenance.checkpointHashMatches,
  ).toBe(true);
  expect(hashGameState(state)).toBe(cp.stateHash);
  const input = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  } as AiDecisionInput;
  restoreAiRuntimeCheckpoint(
    input,
    cp.input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  return { cp, state: state as GameState, input, steps };
}
function take(
  state: GameState,
  side: "runner" | "corp",
  actionId: string,
  selectedChoices?: Record<string, unknown>,
) {
  expect(
    getLegalActions(state, side).some((a) => a.actionId === actionId),
  ).toBe(true);
  const applied = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId,
    clientKnownStateVersion: state.stateVersion,
    ...(selectedChoices
      ? { selectedChoices: engineChoices(selectedChoices) }
      : {}),
  });
  if (!applied.ok) throw Error(applied.error.message);
  return applied.state;
}
function engineChoices(value: Record<string, unknown>) {
  if (
    typeof value.choiceId !== "string" ||
    !Array.isArray(value.selectedOptionIds)
  )
    throw Error("invalid_native_fixture_choices");
  return {
    choiceId: value.choiceId,
    selectedOptionIds: value.selectedOptionIds.map((id: unknown) => {
      if (typeof id !== "string") throw Error("invalid_native_fixture_option");
      return id;
    }),
  };
}
describe("Paarung 529 native owner regressions", () => {
  it.each(["missing_origin", "missing_window", "old_version"])(
    "keeps malformed native payment %s fail-closed",
    (mode) => {
      const { input, cp, state: before } = original("trace-payment");
      const bid = chooseAiAction(input);
      const state = take(before, "runner", bid.actionId!, bid.selectedChoices);
      const supportInput = buildAiDecisionInput(state, "runner", {
        difficulty: "hard",
        ownDeckSnapshot: cp.input.ownDeckSnapshot,
      });
      expect(currentEncounterRequiresDamagePreservingBreak(supportInput)).toBe(
        false,
      );
      if (mode === "missing_origin") {
        resetResidentPlanPortfolioMemory();
        expect(() => chooseAiAction(supportInput)).toThrow(
          expect.objectContaining({ code: "missing_plan_module_coverage" }),
        );
      } else {
        if (mode === "missing_window")
          delete supportInput.legalActions[0]!.payload!
            .costPenaltySupportWindowId;
        else supportInput.legalActions[0]!.expiresAtStateVersion--;
        expect(() =>
          currentEncounterRequiresDamagePreservingBreak(supportInput),
        ).toThrow(
          expect.objectContaining({ code: "missing_action_semantics" }),
        );
      }
    },
  );
  it("completes the prepared definition under the Shell development owner, retaining the run click and hand answer", () => {
    const { input, state: before } = original("shell-substitution");
    const chosen = chooseAiAction(input);
    expect(chosen.fallbackUsed).toBe(false);
    const action = input.legalActions.find(
      (a) => a.actionId === chosen.actionId,
    )!;
    expect(action.payload?.delayedInstallAbility).toBe("remove_shell_counter");
    expect(action.payload?.targetCardId).toBe(
      "runner_onr_classic_031_rent-i-con_2",
    );
    expect(
      chosen.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
    ).toContain("plan:runner.shell_traders_pipeline:");
    expect(chosen.decisionDebug?.planFirstDecision?.selectedPlan?.phase).toBe(
      "progress",
    );
    const state = take(before, "runner", chosen.actionId!);
    expect([state.runner.credits, state.runner.clicks]).toEqual([2, 1]);
    expect(state.runner.rig.programs).toContain(
      "runner_onr_classic_031_rent-i-con_2",
    );
    expect(state.runner.grip).toContain("runner_onr_classic_031_rent-i-con_1");
  });
  it("validates the entire finite original Shell alternative through access, Corp turn and the real later score click", () => {
    const { state: initial, steps } = original("shell-substitution");
    let state = initial;
    for (const step of steps) {
      const side = getLegalActions(state, "runner").some(
        (a) => a.actionId === step.action,
      )
        ? "runner"
        : "corp";
      state = take(state, side, step.action, step.selectedChoices);
      expect(hashGameState(state)).toBe(step.stateHash);
    }
    expect(state.winner).toBe("runner");
  });
  it("preserves the trace owner after compound damage/trace and pays Swiss once before resuming the exact bid", () => {
    const { input, cp, state: before } = original("trace-payment");
    expect(
      input.eventTail?.some(
        (e) =>
          e.publicPayload.traceStarted === true &&
          e.publicPayload.effectKind === "damage",
      ),
    ).toBe(true);
    const bid = chooseAiAction(input);
    expect(bid.selectedChoices?.selectedOptionIds).toEqual(["bid_7"]);
    expect(bid.fallbackUsed).toBe(false);
    const pending =
      residentPlanPortfolioSnapshot(
        input,
      )?.pendingRunnerCostPenaltySupportOrigin;
    expect(pending).toMatchObject({
      originalActionId: "runner.resolve_choice",
      selectedAtStateVersion: 204,
      rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      executorInstanceId: "plan:runner.convert_run_window:run%3Arun_200",
    });
    let state = take(before, "runner", bid.actionId!, bid.selectedChoices);
    expect(state.runner.credits).toBe(6);
    const supportInput = buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
      ownDeckSnapshot: cp.input.ownDeckSnapshot,
    });
    const support = chooseAiAction(supportInput);
    expect(support.fallbackUsed).toBe(false);
    const supportAction = supportInput.legalActions.find(
      (a) => a.actionId === support.actionId,
    )!;
    expect(supportAction.payload?.costPenaltySupportOriginalActionId).toBe(
      "runner.resolve_choice",
    );
    expect(supportAction.payload?.costPenaltySupportWindowId).toBe(
      "runner_cost_penalty_support.205",
    );
    expect(
      support.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
    ).toBe(pending!.executorInstanceId);
    state = take(state, "runner", support.actionId!, support.selectedChoices);
    expect(state.runner.credits).toBe(9);
    expect(state.runner.heap).toContain(
      "runner_onr_proteus_152_swiss-bank-account_1",
    );
    const continuedInput = buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
      ownDeckSnapshot: cp.input.ownDeckSnapshot,
    });
    const continued = chooseAiAction(continuedInput);
    expect(continued.actionId).toBe("runner.resolve_choice");
    expect(continued.selectedChoices?.selectedOptionIds).toEqual(["bid_7"]);
    expect(continued.fallbackUsed).toBe(false);
    expect(
      continued.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
    ).toBe(pending!.executorInstanceId);
    state = take(
      state,
      "runner",
      continued.actionId!,
      continued.selectedChoices,
    );
    expect(state.runner.credits).toBe(2);
    expect(
      state.cardInstances[state.runner.identity]!.counters?.baskerville ?? 0,
    ).toBe(0);
  });
});
