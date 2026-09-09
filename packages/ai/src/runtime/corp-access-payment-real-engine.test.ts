import { beforeEach, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import type { GameState, Side } from "@netgrid/shared";
import catalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { chooseCorpAction } from "../index";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "./ai-decision-input";
import { selectedChoicesForDecision } from "./selected-choices-for-decision";

const decks = Object.fromEntries(
  (["corp", "runner"] as const).map((side) => {
    const id =
      side === "corp"
        ? "standard_proteus_corp_hidden_node_control_2026_05_25"
        : "standard_proteus_runner_breaker_lab_2026_05_25";
    const d = catalog.decks.find((d) => d.standardDeckId === id)!;
    return [
      side,
      {
        id,
        name: d.name,
        side,
        identity: d.identityCardId,
        cards: d.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
      },
    ];
  }),
);
beforeEach(() => resetResidentPlanPortfolioMemory());
function apply(s: GameState, side: Side, type: string) {
  const action = getLegalActions(s, side).find(
    (a) =>
      a.type === type && (type !== "start_run" || a.payload?.serverId === "hq"),
  );
  if (!action) throw Error("missing fixture action " + type);
  if (!d.actionId) throw Error("Missing bound Corp action.");
  const r = applyAction(s, {
    matchId: s.matchId,
    side,
    actionId: action.actionId,
    clientKnownStateVersion: s.stateVersion,
  });
  if (!r.ok) throw Error(r.error.message);
  return r.state;
}
function fixture(program?: string, source = "onr_proteus_068_pattel-antibody") {
  let s = createGameAfterSetup({
    seed: "corp-empty-access-payment",
    corpDeck: decks.corp!,
    runnerDeck: decks.runner!,
    traceRulesProfile: "modern_open",
  });
  s = apply(s, "corp", "mandatory_draw");
  const f = RealEngineFixtureBuilder.forState(s)
    .withCorpHqSize(0)
    .withCorpCardInHq(source);
  if (program) f.withRunnerProgramInstalled(program);
  s.corp.credits = 10;
  s = apply(s, "corp", "end_turn");
  s = apply(s, "runner", "start_run");
  s = apply(s, "runner", "access_card");
  return s;
}
function input(s: GameState) {
  return buildAiDecisionInput(s, "corp", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: decks.corp!.id,
      side: "corp",
      cards: decks.corp!.cards.map((c) => ({
        cardId: c.id,
        quantity: c.quantity,
      })),
    },
  });
}
it.each([undefined, "onr_proteus_089_garbage-in"])(
  "declines paid breaker counters with no eligible target (%s), under the ambush owner",
  (program) => {
    const s = fixture(program),
      initial = structuredClone(s),
      start = s.eventLog.length,
      before = hashState(s),
      i = input(s);
    expect(
      i.playerView.pendingChoice?.options[0]?.metadata
        ?.accessPaymentNoOpCertified,
    ).toBe(true);
    expect(getPlayerView(s, "runner").pendingChoice).toBeUndefined();
    const d = chooseCorpAction(i);
    expect(d.actionId).toBe("corp.resolve_choice");
    expect(d.selectedChoices?.selectedOptionIds).toEqual(["decline"]);
    expect(d.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
      "corp.ambush_and_bluff",
    );
    expect(
      residentPlanPortfolioSnapshot(i)?.instances.some(
        (p) =>
          p.moduleId === "corp.ambush_and_bluff" &&
          p.executionState === "executor",
      ),
    ).toBe(true);
    expect(hashState(s)).toBe(before);
    if (!d.actionId) throw Error("Missing bound Corp action.");
    const r = applyAction(s, {
      matchId: s.matchId,
      side: "corp",
      actionId: d.actionId,
      clientKnownStateVersion: s.stateVersion,
      selectedChoices: d.selectedChoices,
    });
    if (!r.ok) throw Error(r.error.message);
    expect(r.state.corp.credits).toBe(10);
    expect(r.state.pendingChoice).toBeUndefined();
    const replay = replayEvents(initial, r.state.eventLog.slice(start));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(r.state));
  },
);
it("preserves payment and real counter effect when an icebreaker is installed", () => {
  const s = fixture("onr_proteus_095_skeleton-passkeys"),
    i = input(s),
    d = chooseCorpAction(i);
  expect(
    i.playerView.pendingChoice?.options[0]?.metadata
      ?.accessPaymentNoOpCertified,
  ).toBe(false);
  expect(d.selectedChoices?.selectedOptionIds).toEqual(["pay"]);
  expect(d.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
    "corp.ambush_and_bluff",
  );
  if (!d.actionId) throw Error("Missing bound Corp action.");
  const r = applyAction(s, {
    matchId: s.matchId,
    side: "corp",
    actionId: d.actionId,
    clientKnownStateVersion: s.stateVersion,
    selectedChoices: d.selectedChoices,
  });
  if (!r.ok) throw Error(r.error.message);
  expect(r.state.corp.credits).toBe(7);
  expect(
    getPlayerView(r.state, "runner").own.rig?.find(
      (c) => c.definitionId === "onr_proteus_095_skeleton-passkeys",
    )?.counters?.pattel,
  ).toBe(1);
});
it.each(["stateVersion", "certificate", "options", "source"] as const)(
  "rejects a stale paid-access binding after %s changes",
  (changed) => {
    const i = input(fixture());
    chooseCorpAction(i);
    const portfolio = residentPlanPortfolioSnapshot(i)!;
    const altered = structuredClone(i);
    if (changed === "stateVersion") altered.playerView.stateVersion++;
    if (changed === "certificate")
      altered.playerView.pendingChoice!.options[0]!.metadata!.accessPaymentNoOpCertified = false;
    if (changed === "options")
      altered.playerView.pendingChoice!.options[1]!.id = "different-decline";
    if (changed === "source")
      altered.playerView.pendingChoice!.source += "-stale";
    const action = altered.legalActions.find(
      (a) => a.type === "resolve_choice",
    )!;
    expect(() =>
      selectedChoicesForDecision(altered, action, {} as never, portfolio),
    ).toThrow(expect.objectContaining({ code: "window_origin_missing" }));
  },
);
it("does not mistake a runner counter effect for an empty icebreaker effect", () => {
  const s = fixture(undefined, "onr_proteus_057_doppelganger-antibody"),
    d = chooseCorpAction(input(s));
  expect(d.selectedChoices?.selectedOptionIds).toEqual(["pay"]);
  expect(d.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
    "corp.ambush_and_bluff",
  );
  if (!d.actionId) throw Error("Missing bound Corp action.");
  const r = applyAction(s, {
    matchId: s.matchId,
    side: "corp",
    actionId: d.actionId,
    clientKnownStateVersion: s.stateVersion,
    selectedChoices: d.selectedChoices,
  });
  if (!r.ok) throw Error(r.error.message);
  expect(r.state.corp.credits).toBe(8);
});
