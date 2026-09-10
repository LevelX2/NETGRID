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
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "./ai-decision-input";

const RASMIN = "onr_proteus_070_rasmin-bridger";
const HOMING = "onr_proteus_025_homing-missile";
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
function act(
  s: GameState,
  side: Side,
  id: string,
  selectedChoices?: Record<string, unknown>,
) {
  const result = applyAction(s, {
    matchId: s.matchId,
    side,
    actionId: id,
    clientKnownStateVersion: s.stateVersion,
    ...(selectedChoices ? { selectedChoices } : {}),
  });
  if (!result.ok) throw Error(result.error.message);
  return result.state;
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
function fixture(kind: "pass_tax" | "trace", runnerCredits: number) {
  let s = createGameAfterSetup({
    seed: `run-tax-${kind}`,
    corpDeck: decks.corp!,
    runnerDeck: decks.runner!,
    traceRulesProfile: "modern_open",
  });
  s = act(s, "corp", "corp.mandatory_draw");
  const f = RealEngineFixtureBuilder.forState(s)
    .withCorpHqSize(0)
    .withCorpCredits(12)
    .withRunnerCredits(runnerCredits);
  if (kind === "pass_tax")
    f.withCorpRemoteRoot("hq", RASMIN)
      .withCorpIceOnServer("hq", "onr_proteus_012_bug-zapper")
      .withCorpIceOnServer("hq", "onr_proteus_017_credit-blocks")
      .withCorpIceOnServer("hq", "onr_proteus_021_dog-pile");
  else f.withCorpIceOnServer("hq", HOMING);
  s.corp.clicks = 0;
  s = act(s, "corp", "corp.end_turn");
  const start = getLegalActions(s, "runner").find(
    (a) => a.type === "start_run" && a.payload?.serverId === "hq",
  )!;
  return act(s, "runner", start.actionId);
}

it("rezzes a pass toll before the first passage under Defense and forces pay or stop", () => {
  let s = fixture("pass_tax", 2);
  s.corp.credits = 4;
  const before = hashState(s);
  const decision = chooseCorpAction(input(s));
  const selected = getLegalActions(s, "corp").find(
    (a) => a.actionId === decision.actionId,
  )!;
  expect(selected.type).toBe("rez_card");
  expect(s.cardInstances[selected.source!]!.definitionId).toBe(RASMIN);
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("corp.defend_servers");
  expect(hashState(s)).toBe(before);
  s = act(s, "corp", selected.actionId);
  let paid = 0;
  for (let steps = 0; s.run && steps < 30; steps++) {
    const side = s.activeSide;
    const actions = getLegalActions(s, side);
    const tax = actions.find(
      (a) =>
        a.payload?.fortRunWindowAbility ===
          "runner_pay_or_end_run_after_passing_ice_on_this_fort" &&
        a.payload?.decision === "pay",
    );
    const action =
      tax ??
      actions.find(
        (a) =>
          a.payload?.fortRunWindowAbility ===
            "runner_pay_or_end_run_after_passing_ice_on_this_fort" &&
          a.payload?.decision === "end_run",
      ) ??
      actions.find((a) => a.type === "decline_rez") ??
      actions.find((a) => a.type === "continue_run");
    if (!action) throw Error(`Unexpected fixture window ${s.timingPoint}`);
    if (tax) paid++;
    s = act(s, side, action.actionId);
  }
  expect(paid).toBe(2);
  expect(s.run).toBeUndefined();
  expect(s.runner.credits).toBe(0);
});

it("does not pay four credits for a weak current toll against a rich Runner", () => {
  const s = fixture("pass_tax", 20);
  s.corp.credits = 4;
  const decision = chooseCorpAction(input(s));
  expect(
    getLegalActions(s, "corp").find((a) => a.actionId === decision.actionId)
      ?.type,
  ).toBe("decline_rez");
  const runnerView = getPlayerView(s, "runner");
  expect(
    JSON.stringify(runnerView.servers.find((x) => x.id === "hq")!.root),
  ).not.toContain(RASMIN);
});

it("rezzes a priced variable trace ICE that stops a broke Runner without a breaker", () => {
  let s = fixture("trace", 0);
  const initial = structuredClone(s);
  const before = hashState(s);
  const decision = chooseCorpAction(input(s));
  const action = getLegalActions(s, "corp").find(
    (a) => a.actionId === decision.actionId,
  )!;
  expect(action.type).toBe("rez_ice");
  expect(action.payload?.variableRezValue).toBe(1);
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("corp.defend_servers");
  expect(hashState(s)).toBe(before);
  expect(JSON.stringify(getPlayerView(s, "runner"))).not.toContain(
    "currentTraceIceRezQuotes",
  );
  s = act(s, "corp", action.actionId);
  s = act(
    s,
    "runner",
    getLegalActions(s, "runner").find((a) => a.type === "continue_run")!
      .actionId,
  );
  const bid = chooseCorpAction(input(s));
  s = act(s, "corp", bid.actionId!, bid.selectedChoices);
  expect(s.corp.credits).toBe(7);
  const runnerBid = getLegalActions(s, "runner").find(
    (a) => a.type === "resolve_choice",
  )!;
  s = act(s, "runner", runnerBid.actionId, {
    choiceId: getPlayerView(s, "runner").pendingChoice!.choiceId,
    selectedOptionIds: ["bid_0"],
  });
  expect(s.run).toBeUndefined();
  expect(s.runnerTurnFlags?.runnerRunLockCreditCost).toBe(2);
  const replay = replayEvents(
    initial,
    s.eventLog.slice(initial.eventLog.length),
  );
  expect(replay.ok).toBe(true);
  expect(hashState(replay.state)).toBe(hashState(s));
});

it("prices trace ties correctly and declines a trace the rich Runner can avoid", () => {
  const s = fixture("trace", 1);
  const ice = getPlayerView(s, "corp").servers.find((x) => x.id === "hq")!
    .ice[0]!;
  expect(
    ice.currentTraceIceRezQuotes?.find((q) => q.variableValue === 1)
      ?.guaranteedRunEnd,
  ).toBe(false);
  expect(
    ice.currentTraceIceRezQuotes?.find((q) => q.variableValue === 2)
      ?.guaranteedRunEnd,
  ).toBe(true);
  s.runner.credits = 20;
  expect(
    getLegalActions(s, "corp").find(
      (a) => a.actionId === chooseCorpAction(input(s)).actionId,
    )?.type,
  ).toBe("decline_rez");
});

it("includes an affordable visible breaker and does not certify a blind trace", () => {
  const s = fixture("trace", 20);
  RealEngineFixtureBuilder.forState(s).withRunnerProgramInstalled(
    "onr_proteus_079_big-frackin-gun",
  );
  const quote = getPlayerView(s, "corp").servers.find((x) => x.id === "hq")!
    .ice[0]!.currentTraceIceRezQuotes;
  expect(quote?.find((q) => q.variableValue === 1)?.runnerCanBreak).toBe(true);
  expect(quote?.every((q) => !q.guaranteedRunEnd)).toBe(true);
  s.traceRulesProfile = "classic_blind";
  expect(
    getPlayerView(s, "corp").servers.find((x) => x.id === "hq")!.ice[0]!
      .currentTraceIceRezQuotes,
  ).toBeUndefined();
});

it("rejects a stale trace receipt and counts bad-publicity credits for pass tolls", () => {
  const trace = input(fixture("trace", 0));
  for (const q of trace.playerView.servers.find((x) => x.id === "hq")!.ice[0]!
    .currentTraceIceRezQuotes!)
    q.stateVersion--;
  expect(
    trace.legalActions.find(
      (a) => a.actionId === chooseCorpAction(trace).actionId,
    )?.type,
  ).toBe("decline_rez");
  const s = fixture("pass_tax", 2);
  s.corp.credits = 4;
  s.run!.badPublicityCredits = 2;
  const quote = getPlayerView(s, "corp").servers.find((x) => x.id === "hq")!
    .root[0]!.currentPassTaxRezQuote;
  expect(quote?.runnerSpendableCredits).toBe(4);
  expect(
    getLegalActions(s, "corp").find(
      (a) => a.actionId === chooseCorpAction(input(s)).actionId,
    )?.type,
  ).toBe("decline_rez");
});
