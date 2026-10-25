import { readFileSync } from "node:fs";
import { beforeEach, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  hashGameState,
  replayEvents,
} from "@netgrid/engine";
import type { GameState } from "@netgrid/shared";
import catalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import {
  buildAiDecisionInput,
  type AiDecisionInputWithDeckCapabilities,
} from "./ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { selectedRunnerRemoteExposeChoiceOptionIds } from "../runner/remote-contest/remote-expose-choice";

const decks = Object.fromEntries(
  (["runner", "corp"] as const).map((side) => {
    const id =
      side === "runner"
        ? "standard_runner_inside_forgery_loop"
        : "standard_corp_mp1ddh7c";
    const entry = catalog.decks.find((d) => d.standardDeckId === id)!;
    return [
      side,
      {
        id,
        name: entry.name,
        side,
        identity: entry.identityCardId,
        cards: entry.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
      },
    ];
  }),
);
beforeEach(resetResidentPlanPortfolioMemory);
function apply(
  state: GameState,
  actionId: string,
  selectedChoices?: Record<string, unknown>,
) {
  const action = [
    ...getLegalActions(state, "runner"),
    ...getLegalActions(state, "corp"),
  ].find((a) => a.actionId === actionId)!;
  const result = applyAction(state, {
    matchId: state.matchId,
    side: action.side,
    actionId,
    clientKnownStateVersion: state.stateVersion,
    ...(selectedChoices ? { selectedChoices } : {}),
  });
  if (!result.ok) throw Error(result.error.message);
  return result.state;
}
function fixture(credits = 9, clicks = 4, advanced = 1) {
  let state = createGameAfterSetup({
    seed: "remote-expose-preparation",
    runnerDeck: decks.runner!,
    corpDeck: decks.corp!,
    agendaPointsToWin: 7,
  });
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "mandatory_draw")!
      .actionId,
  );
  RealEngineFixtureBuilder.forState(state).withCorpHqSize(0);
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "end_turn")!.actionId,
  );
  RealEngineFixtureBuilder.forState(state)
    .withRunnerGripSize(0)
    .withRunnerCredits(credits)
    .withRunnerClicks(clicks)
    .withRunnerProgramInstalled("onr_v1_058_seeya")
    .withRunnerProgramInstalled("onr_v1_039_krash")
    .withRunnerCardInGrip("onr_v1_161_fall-guy")
    .withCorpRemoteRoot("remote_1", "onr_v1_323_experimental-ai", advanced);
  state.runner.memoryUsed = 2;
  state.corp.credits = 8;
  return state;
}
function input(state: GameState) {
  return buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: decks.runner!.id,
      side: "runner",
      cards: decks.runner!.cards.map((c) => ({
        cardId: c.id,
        quantity: c.quantity,
      })),
    },
  });
}
it("replaces the original blind run with exact Remote information preparation", () => {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../data/scenarios/ai-decision-checkpoints/cp-meta-493-r1-g7-d44.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  restoreAiRuntimeCheckpoint(
    cp.input,
    cp.input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const before = JSON.stringify([cp.input.playerView, cp.input.legalActions]),
    decision = chooseAiAction(cp.input);
  expect(decision.actionId).toContain("seeya");
  expect(decision.reasonCode).toBe("plan_first.runner.contest_remote");
  expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    "plan:runner.contest_remote:remote%3Aremote_1",
  );
  expect(decision.fallbackUsed).toBe(false);
  expect(
    JSON.stringify([cp.input.playerView, cp.input.legalActions]) === before,
  ).toBe(true);
});
it.each([5, 9])(
  "resolves the native choice to the bound hidden root at %i credits while preserving the Remote origin",
  (credits) => {
    let state = fixture(credits);
    const initial = structuredClone(state),
      eventStart = state.eventLog.length;
    const first = chooseAiAction(input(state));
    expect(first.actionId).toContain("seeya");
    state = apply(state, first.actionId!);
    const choice = input(state);
    expect(choice.playerView.pendingChoice?.kind).toBe("select_cards");
    const decision = chooseAiAction(choice);
    expect(decision.selectedChoices?.selectedOptionIds).toEqual([
      `card_${choice.playerView.servers.find((s) => s.id === "remote_1")!.root[0]!.instanceId}`,
    ]);
    expect(decision.fallbackUsed).toBe(false);
    state = apply(state, decision.actionId!, decision.selectedChoices);
    expect(
      input(state).playerView.servers.find((s) => s.id === "remote_1")!.root[0]!
        .definitionId,
    ).toBe("onr_v1_323_experimental-ai");
    for (let i = 0; i < 3 && input(state).playerView.pendingChoice; i++) {
      const acknowledgment = chooseAiAction(input(state));
      state = apply(
        state,
        acknowledgment.actionId!,
        acknowledgment.selectedChoices,
      );
    }
    expect(input(state).playerView.pendingChoice).toBeUndefined();
    const afterInformation = chooseAiAction(input(state));
    const next = input(state).legalActions.find(
      (a) => a.actionId === afterInformation.actionId,
    )!;
    expect(
      next.type === "start_run" && next.payload?.serverId === "remote_1",
    ).toBe(false);
    expect(
      state.runner.rig.programs.some(
        (id) => state.cardInstances[id]!.definitionId === "onr_v1_039_krash",
      ),
    ).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(eventStart));
    expect(replay.ok).toBe(true);
    expect(hashGameState(replay.state)).toBe(hashGameState(state));
  },
);
it.each([
  [0, 4],
  [3, 4],
  [5, 1],
  [9, 1],
  [9, 4],
] as const)(
  "does not manufacture the advanced-root preparation at %i credits/%i clicks when no new information is available",
  (credits, clicks) => {
    const state = fixture(
        credits,
        clicks,
        credits === 9 && clicks === 4 ? 0 : 1,
      ),
      decision = chooseAiAction(input(state));
    expect(decision.actionId?.includes("seeya")).toBe(false);
    expect(decision.fallbackUsed).toBe(false);
  },
);
it("does not expose a known root repeatedly", () => {
  const state = fixture();
  const root = state.corp.servers.find((s) => s.id === "remote_1")!.root[0]!;
  state.cardInstances[root]!.faceup = true;
  expect(chooseAiAction(input(state)).actionId?.includes("seeya")).toBe(false);
});
it("keeps a financed root preparation when a more advanced remote lacks a funded path", () => {
  const state = fixture();
  RealEngineFixtureBuilder.forState(state)
    .withCorpRemoteRoot("remote_2", "onr_v1_217_strike-force-kali", 3)
    .withRezzedCorpIceOnServer("remote_2", "onr_v1_278_wall-of-ice");
  const first = chooseAiAction(input(state));
  expect(first.actionId).toContain("seeya");
  expect(first.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    "plan:runner.contest_remote:remote%3Aremote_1",
  );
  const after = apply(state, first.actionId!),
    choice = input(after),
    decision = chooseAiAction(choice);
  expect(decision.selectedChoices?.selectedOptionIds).toEqual([
    `card_${choice.playerView.servers.find((s) => s.id === "remote_1")!.root[0]!.instanceId}`,
  ]);
});
it.each(["source", "version", "target", "option", "origin"] as const)(
  "fails closed for a mismatched expose %s",
  (variant) => {
    const state = fixture(),
      first = chooseAiAction(input(state)),
      after = apply(state, first.actionId!),
      current = input(after);
    const choice = current.playerView.pendingChoice!,
      action = current.legalActions.find((a) => a.type === "resolve_choice")!;
    let options = choice.options;
    if (variant === "source")
      choice.source = choice.source.replace(
        "runner_onr_v1_058_seeya_1",
        "wrong_source",
      );
    if (variant === "version") current.playerView.stateVersion += 1;
    if (variant === "target")
      current.playerView.servers.find((s) => s.id === "remote_1")!.root = [];
    if (variant === "option") options = [];
    if (variant === "origin") resetResidentPlanPortfolioMemory();
    expect(() =>
      selectedRunnerRemoteExposeChoiceOptionIds(
        current,
        action,
        choice,
        options,
      ),
    ).toThrow("window_origin_missing");
  },
);

it("keeps the native G14/D49 financed information head despite the general economy preference", () => {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../data/scenarios/ai-decision-checkpoints/cp-meta-554-r4-g14-d49.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.keys(cp.validation)).toHaveLength(9);
  expect(Object.values(cp.validation).every(Boolean)).toBe(true);
  restoreAiRuntimeCheckpoint(
    cp.input,
    cp.input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const before = JSON.stringify([cp.input.playerView, cp.input.legalActions]);
  const decision = chooseAiAction(cp.input);
  expect(cp.input.playerView.own.credits).toBe(5);
  expect(decision.actionId).toContain("seeya");
  expect(decision.reasonCode).toBe("plan_first.runner.contest_remote");
  const plan = decision.decisionDebug!.planFirstDecision!;
  expect(plan.rootPlanInstanceId).toBe(
    "plan:runner.contest_remote:remote%3Aremote_1",
  );
  expect(plan.route?.actionId).toBe(decision.actionId);
  expect(plan.route?.stateVersion).toBe(cp.input.playerView.stateVersion);
  expect(plan.route?.planInstanceId).toBe(plan.leafExecutorInstanceId);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).toBe(false);
  expect(JSON.stringify([cp.input.playerView, cp.input.legalActions])).toBe(
    before,
  );
});
