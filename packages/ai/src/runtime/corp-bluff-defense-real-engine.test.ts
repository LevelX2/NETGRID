import { beforeEach, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
} from "@netgrid/engine";
import type { GameState, Side } from "@netgrid/shared";
import catalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { chooseCorpAction, chooseRunnerAction } from "../index";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { corpBluffDefenseNeed } from "../plans/corp-bluff-defense";
import { buildAiDecisionInput } from "./ai-decision-input";
import { corpRdRecyclingSignals } from "./corp-access-zone-preparation";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";

const BEL = "onr_proteus_054_bel-digmo-antibody";
const DOG = "onr_proteus_021_dog-pile";
const RIDDLER = "onr_proteus_034_riddler";
const FUBAR = "onr_proteus_088_fubar";
const decks = Object.fromEntries(
  (["corp", "runner"] as const).map((side) => {
    const id =
      side === "corp"
        ? "standard_proteus_corp_hidden_node_control_2026_05_25"
        : "standard_proteus_runner_breaker_lab_2026_05_25";
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
beforeEach(() => resetResidentPlanPortfolioMemory());
function fixture(ice = DOG, credits = 6) {
  let state = createGameAfterSetup({
    seed: `bluff-defense-${ice}`,
    corpDeck: decks.corp!,
    runnerDeck: decks.runner!,
  });
  state = act(
    state,
    "corp",
    getLegalActions(state, "corp").find((a) => a.type === "mandatory_draw")!
      .actionId,
  );
  RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCredits(credits)
    .withCorpRemoteRoot("remote_1", BEL)
    .withCorpIceOnServer("remote_1", ice)
    .withRunnerCredits(6)
    .withRunnerProgramInstalled("onr_proteus_093_redecorator");
  state.turnSerial = 12;
  return state;
}
function input(state: GameState, side: Side = "corp") {
  const deck = decks[side]!;
  return buildAiDecisionInput(state, side, {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: deck.id,
      side,
      cards: deck.cards.map((c) => ({ cardId: c.id, quantity: c.quantity })),
    },
  });
}
function act(
  state: GameState,
  side: Side,
  actionId: string,
  choices?: Record<string, unknown>,
) {
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId,
    clientKnownStateVersion: state.stateVersion,
    ...(choices ? { selectedChoices: choices } : {}),
  });
  if (!result.ok) throw Error(result.error.message);
  return result.state;
}
function startRun(state: GameState) {
  state.activeSide = "runner";
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  state.runner.clicks = 4;
  return act(
    state,
    "runner",
    getLegalActions(state, "runner").find(
      (a) => a.type === "start_run" && a.payload?.serverId === "remote_1",
    )!.actionId,
  );
}
function chooseAndApply(state: GameState, side: Side) {
  const i = input(state, side);
  const decision = (side === "corp" ? chooseCorpAction : chooseRunnerAction)(i);
  const action = i.legalActions.find((a) => a.actionId === decision.actionId)!;
  expect(action).toBeDefined();
  expect(decision.fallbackUsed).toBe(false);
  if (side === "corp")
    expect(decision.decisionDebug?.planFirstDecision?.route).toMatchObject({
      actionId: action.actionId,
      stateVersion: state.stateVersion,
    });
  return {
    state: act(state, side, action.actionId, decision.selectedChoices),
    decision,
    action,
  };
}
it("funds the exact installed decoy ICE before committing the last credit elsewhere", () => {
  const state = fixture(DOG, 4);
  const i = input(state);
  const source = i.playerView.servers.find((s) => s.id === "remote_1")!
    .root[0]!;
  expect(
    corpBluffDefenseNeed(i, "remote_1", source.instanceId, 0),
  ).toMatchObject({
    fundingGap: 1,
    requiredCredits: 5,
    outcome: "access_cost",
  });
  const next = chooseAndApply(state, "corp");
  expect(next.action.type).toBe("gain_credit");
  expect(
    next.decision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
  ).toContain("plan:corp.economy:ambush-defense-funding");
  expect(
    next.decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
  ).toContain("plan:corp.ambush_and_bluff:");
  expect(next.state.corp.credits).toBe(5);
});
it("rezzes funded bait ICE, charges an actual break and only then recycles the bait", () => {
  let state = startRun(fixture());
  const first = chooseAndApply(state, "corp");
  expect(first.action.type).toBe("rez_ice");
  expect(
    first.decision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
  ).toBe("plan:corp.defend_servers:server-defense-portfolio");
  state = first.state;
  const runnerBefore = state.runner.credits;
  let recycled = false;
  for (let n = 0; n < 20 && state.run; n++) {
    const side = getLegalActions(state, state.activeSide).length
      ? state.activeSide
      : state.activeSide === "corp"
        ? "runner"
        : "corp";
    const next = chooseAndApply(state, side);
    if (
      next.action.type === "rez_card" &&
      next.action.source.includes("bel-digmo")
    ) {
      expect(state.runner.credits).toBeLessThan(runnerBefore);
      expect(state.run?.position.kind).toBe("server");
      const lines =
        next.decision.decisionDebug?.planFirstDecision?.turnPlanning
          ?.consideredLines;
      const decline = lines?.find(
        (line) => line.firstActionId === "corp.decline_rez.remote_1",
      );
      expect(decline?.steps).toHaveLength(1);
      expect(decline?.stopReason).toBe("observation_boundary");
      recycled = true;
    }
    state = next.state;
  }
  expect(recycled).toBe(true);
  expect(state.runner.credits).toBeLessThan(runnerBefore);
});
it("quotes and executes Riddler's paid stop with a publicly selected nonmatching Fubar", () => {
  let state = fixture(RIDDLER, 8);
  RealEngineFixtureBuilder.forState(state).withRunnerProgramInstalled(FUBAR);
  const fubarId = state.runner.rig.programs.find(
    (id) => state.cardInstances[id]!.definitionId === FUBAR,
  )!;
  state.cardInstances[fubarId]!.selectedSubtype = "sentry";
  state = startRun(state);
  const before = hashState(state);
  const corp = input(state).playerView.servers.find((s) => s.id === "remote_1")!
    .ice[0]!;
  expect(corp.effectivePostRezRunQuote).toMatchObject({
    complete: true,
    paidEncounterDefense: {
      creditCost: 2,
      exchange: {
        complete: true,
        runnerBreakUnavailable: { reason: "no_visible_eligible_breaker" },
      },
    },
  });
  expect(
    getPlayerView(state, "runner").servers.find((s) => s.id === "remote_1")!
      .ice[0]!.effectivePostRezRunQuote,
  ).toBeUndefined();
  expect(hashState(state)).toBe(before);
  const rez = chooseAndApply(state, "corp");
  expect(rez.action.type).toBe("rez_ice");
  state = rez.state;
  while (state.timingPoint === "run.approach_ice")
    state = chooseAndApply(state, "corp").state;
  const paid = chooseAndApply(state, "corp");
  expect(paid.action.type).toBe("activated_card_ability");
  expect(
    paid.decision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
  ).toBe("plan:corp.defend_servers:server-defense-portfolio");
  expect(paid.state.corp.credits).toBe(4);
});
it("does not fund stale ICE quotes or consume an independent scoring reserve", () => {
  const i = input(fixture(DOG, 4));
  const server = i.playerView.servers.find((s) => s.id === "remote_1")!;
  expect(
    corpBluffDefenseNeed(i, server.id, server.root[0]!.instanceId, 4),
  ).toBeUndefined();
  server.ice[0]!.effectiveRezCostQuote!.expiresAtStateVersion--;
  expect(
    corpBluffDefenseNeed(i, server.id, server.root[0]!.instanceId, 0),
  ).toBeUndefined();
});
it("does not rez a paid-ability shell when only the rez can be afforded", () => {
  const state = startRun(fixture(RIDDLER, 3));
  expect(chooseAndApply(state, "corp").action.type).toBe("decline_rez");
});
it("keeps an unconfigured subtype unknown and quotes a configured matching breaker", () => {
  let state = fixture(RIDDLER, 8);
  RealEngineFixtureBuilder.forState(state).withRunnerProgramInstalled(FUBAR);
  const id = state.runner.rig.programs.find(
    (id) => state.cardInstances[id]!.definitionId === FUBAR,
  )!;
  state = startRun(state);
  const read = () =>
    input(state).playerView.servers.find((s) => s.id === "remote_1")!.ice[0]!
      .effectivePostRezRunQuote;
  expect(read()).toMatchObject({
    complete: true,
    paidEncounterDefense: {
      exchange: {
        complete: false,
        reason: "visible_runner_break_projection_unknown",
      },
    },
  });
  expect(chooseAndApply(state, "corp").action.type).toBe("decline_rez");
  state.cardInstances[id]!.selectedSubtype = "code_gate";
  expect(read()).toMatchObject({
    complete: true,
    paidEncounterDefense: {
      exchange: {
        complete: true,
        runnerBreak: { breakerCardId: id, requiredCredits: 3 },
      },
    },
  });
});
it("prefers an available taxing remote over naked placement and preserves Score's reserved remote", () => {
  const state = fixture(DOG, 8);
  RealEngineFixtureBuilder.forState(state).withCorpCardInHq(BEL);
  const i = input(state);
  const candidates = buildActionSemanticCandidates({
    legalActions: i.legalActions,
    observerSide: "corp",
    stateVersion: i.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: Object.fromEntries(
      i.playerView.own.gripOrHq.map((c) => [c.instanceId, c.definitionId!]),
    ),
  });
  const signal = corpRdRecyclingSignals(i, candidates).find(
    (s) => s.phase === "install",
  )!;
  expect(signal.serverId).toBe("remote_1");
  expect(signal.defenseNeed?.outcome).toBe("access_cost");
  expect(
    corpRdRecyclingSignals(
      i,
      candidates,
      undefined,
      new Set(["remote_1"]),
    ).find((s) => s.phase === "install")?.serverId,
  ).toBe("new_remote");
});
