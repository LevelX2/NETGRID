import standardDeckCatalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import type {
  DeckDefinition,
  GameState,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import { beforeEach, expect, it } from "vitest";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "./ai-decision-input";
import { runnerRunLockReleaseProjection } from "./runner-run-lock-release-score";
import { runnerRecurringEconomySignals } from "../runner/recurring-economy/recurring-economy-signals";
import type { RunnerEconomyPosture } from "../run-analysis/runner-run-target-types";
import { buildRunnerStrategicIntentProfile } from "../runner-strategic-intent";

const CONFERENCE = "onr_v1_184_top-runners-conference";
function deck(id: string): DeckDefinition {
  const current = standardDeckCatalog.decks.find(
    (d) => d.standardDeckId === id,
  )!;
  return {
    id,
    name: current.name,
    side: current.side as "runner" | "corp",
    identity: current.identityCardId,
    cards: current.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
  };
}
const runnerDeck = deck("standard_runner_last_call_at_rd"),
  corpDeck = deck("standard_corp_cheap_bag_tricks");
function apply(
  state: GameState,
  action: LegalAction,
  choices?: PlayerAction["selectedChoices"],
): GameState {
  if (!action) throw new Error("Missing native action");
  const result = applyAction(state, {
    matchId: state.matchId,
    side: action.side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `prepared:${state.stateVersion}`,
    ...(choices ? { selectedChoices: choices } : {}),
  });
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.state;
}
function native(state: GameState, side: "corp" | "runner", type: string) {
  return apply(
    state,
    getLegalActions(state, side).find((a) => a.type === type)!,
  );
}
function fixture(payouts: number, killer = true): GameState {
  let state = createGameAfterSetup({
    matchId: "prepared-recurring-run",
    seed: "prepared-recurring-run",
    agendaPointsToWin: 7,
    runnerDeck,
    corpDeck,
  });
  state = native(state, "corp", "mandatory_draw");
  const builder = RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCardInHq("onr_v1_199_employee-empowerment")
    .withCorpCredits(15)
    .withRezzedCorpIceOnServer("hq", "onr_v1_264_rex")
    .withRezzedCorpIceOnServer("rd", "onr_v1_223_banpei")
    .withRunnerCredits(50)
    .withRunnerGripSize(0)
    .withRunnerCardInGrip(CONFERENCE)
    .withRunnerCardInGrip("onr_v1_079_bodyweight-synthetic-blood")
    .withRunnerCardInGrip("onr_v1_157_crash-everett-inventive-fixer")
    .withRunnerCardInGrip("onr_v1_108_score")
    .withRunnerProgramInstalled("onr_v1_074_worm")
    .withRunnerProgramInstalled("onr_v1_014_codecracker");
  if (killer) builder.withRunnerProgramInstalled("onr_v1_054_raptor");
  state.runner.memoryUsed = killer ? 3 : 2;
  state = native(state, "corp", "end_turn");
  state = apply(
    state,
    getLegalActions(state, "runner").find(
      (a) => a.type === "start_run" && a.payload?.serverId === "hq",
    )!,
  );
  for (let n = 0; n < 8 && !state.trace; n++) {
    state = apply(
      state,
      [
        ...getLegalActions(state, "runner"),
        ...getLegalActions(state, "corp"),
      ].find((a) => a.type === "continue_run")!,
    );
  }
  expect(state.trace).toBeDefined();
  for (const side of ["corp", "runner"] as const) {
    const choice = state.pendingChoice!;
    const option = choice.options.find(
      (o) => o.id === (side === "corp" ? "bid_3" : "bid_0"),
    )!;
    state = apply(
      state,
      getLegalActions(state, side).find((a) => a.type === "resolve_choice")!,
      { choiceId: choice.choiceId, selectedOptionIds: [option.id] },
    );
  }
  expect(state.run).toBeUndefined();
  expect(state.runnerTurnFlags?.runnerRunLockCreditCost).toBe(2);
  state = apply(
    state,
    getLegalActions(state, "runner").find(
      (a) =>
        a.type === "install_card" &&
        a.source.includes("top-runners-conference"),
    )!,
  );
  for (let n = 0; n < payouts; n++) {
    state = native(state, "runner", "end_turn");
    state = native(state, "corp", "mandatory_draw");
    state = native(state, "corp", "end_turn");
  }
  expect(state.runnerTurnFlags?.runnerRunLockCreditCost).toBe(2);
  return state;
}
function inputFor(state: GameState) {
  return buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    decisionId: `prepared:${state.stateVersion}`,
    profileId: "prepared-recurring-run",
    ownDeckSnapshot: {
      deckSnapshotId: "prepared-recurring-run",
      side: "runner",
      cards: runnerDeck.cards.map((c) => ({
        cardId: c.id,
        quantity: c.quantity,
      })),
    },
  });
}
function releaseFor(input: ReturnType<typeof inputFor>) {
  return input.legalActions.find(
    (a) =>
      a.type === "trigger_ability" &&
      a.payload?.abilityId === "pay_to_remove_run_lock",
  )!;
}
beforeEach(resetResidentPlanPortfolioMemory);

it("lets the Run parent release a native persistent lock after two actual payouts, then execute a native run", () => {
  let state = fixture(2);
  const input = inputFor(state),
    release = releaseFor(input),
    before = JSON.stringify(input);
  expect(input.legalActions.some((a) => a.type === "start_run")).toBe(false);
  expect(runnerRunLockReleaseProjection(input, release)?.status).toBe("ready");
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(release.actionId);
  expect(decision.reasonCode).toBe("plan_first.runner.pressure_central");
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.evidence).toContain(
    "plan_step_capability:pressure_hq_access",
  );
  expect(residentPlanPortfolioSnapshot(input)?.executorInstanceId).toContain(
    "runner.pressure_central",
  );
  expect(JSON.stringify(input)).toBe(before);
  state = apply(state, release);
  expect(state.runner.credits).toBe(52);
  expect(state.runner.clicks).toBe(3);
  expect(state.runnerTurnFlags?.runnerRunLockCreditCost).toBe(0);
  // Keep the real portfolio: the following decision must revalidate its native route.
  const after = inputFor(state),
    followup = chooseAiAction(after);
  const action = after.legalActions.find(
    (a) => a.actionId === followup.actionId,
  )!;
  expect(action.type).toBe("start_run");
  expect(followup.reasonCode).toBe("plan_first.runner.pressure_central");
  expect(followup.fallbackUsed).toBe(false);
  expect(residentPlanPortfolioSnapshot(after)?.executorInstanceId).toContain(
    "runner.pressure_central",
  );
  state = apply(state, action);
  expect(state.run).toBeDefined();
  expect(
    inputFor(state).playerView.own.rig?.some(
      (c) => c.definitionId === CONFERENCE,
    ),
  ).toBe(false);
});

it.each([0, 1])(
  "preserves a funded nonterminal investment after %i actual payouts",
  (payouts) => {
    const input = inputFor(fixture(payouts)),
      release = releaseFor(input);
    expect(runnerRunLockReleaseProjection(input, release)?.status).toBe(
      "ready",
    );
    const decision = chooseAiAction(input);
    expect(decision.actionId).not.toBe(release.actionId);
    expect(
      decision.decisionDebug?.actionAlternatives
        ?.find((a) => a.actionId === release.actionId)
        ?.whyNot?.join("|"),
    ).toContain("runner_recurring_economy_defers_run_until_payout");
  },
);

it.each(["funding", "clicks", "path"] as const)(
  "keeps a recouped investment when the prepared run is blocked by %s",
  (blocker) => {
    const state = fixture(2, blocker !== "path");
    if (blocker === "funding")
      RealEngineFixtureBuilder.forState(state).withRunnerCredits(6);
    if (blocker === "clicks") state.runner.clicks = 1;
    if (blocker === "path")
      RealEngineFixtureBuilder.forState(state)
        .withRezzedCorpIceOnServer("hq", "onr_v1_223_banpei")
        .withRezzedCorpIceOnServer("rd", "onr_v1_271_tko-2-0");
    const input = inputFor(state),
      release = releaseFor(input);
    expect(runnerRunLockReleaseProjection(input, release)?.status).toBe(
      `blocked_${blocker}`,
    );
    expect(chooseAiAction(input).actionId).not.toBe(release.actionId);
  },
);

it.each(["missing", "stale", "unfunded"] as const)(
  "fails closed for a supposedly ready preparation with %s binding",
  (violation) => {
    const input = inputFor(fixture(2)),
      release = releaseFor(input);
    if (violation === "stale") release.expiresAtStateVersion--;
    expect(() =>
      runnerRecurringEconomySignals(
        input,
        [],
        [],
        {} as RunnerEconomyPosture,
        [],
        buildRunnerStrategicIntentProfile({}),
        () => false,
        [
          {
            actionId:
              violation === "missing"
                ? "not_current_native_action"
                : release.actionId,
            ready: true,
            terminal: false,
            value: 1800,
            fundingGap: violation === "unfunded" ? 1 : 0,
            serverId: "hq",
            parentPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
          },
        ],
      ),
    ).toThrow("stale_or_future_action_reference");
  },
);
