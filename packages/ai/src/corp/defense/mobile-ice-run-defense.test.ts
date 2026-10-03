import { describe, it, expect, afterEach } from "vitest";
import {
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  applyAction,
  validateGameState,
} from "@netgrid/engine";
import {
  ORIGINALSET_DEFAULT_DECKS,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import { removeEverywhere } from "../../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { buildAiDecisionInputDto } from "../../input-dto";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { assessMobileIceRunDefense } from "./mobile-ice-run-defense";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";

function fixture(credits = 3, runnerCredits = 22) {
  const state = createGameAfterSetup({
    seed: "sp431-current-terminal-move",
    runnerDeck: {
      ...ORIGINALSET_DEFAULT_DECKS.runner,
      cards: [
        { id: "onr_v1_039_krash", quantity: 3 },
        { id: "onr_v1_108_score", quantity: 8 },
      ],
    },
    corpDeck: {
      ...ORIGINALSET_DEFAULT_DECKS.corp,
      cards: [
        { id: "onr_classic_011_glacier", quantity: 3 },
        { id: "onr_classic_008_deadeye", quantity: 3 },
        { id: "onr_classic_004_theorem-proof", quantity: 6 },
        { id: "onr_classic_001_data-fort-remapping", quantity: 3 },
      ],
    },
  });
  state.activeSide = "runner";
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  state.runner.credits = runnerCredits;
  state.runner.clicks = 3;
  state.corp.credits = credits;
  const scoredTheorem = Object.values(state.cardInstances).filter(
    (c) => c.definitionId === "onr_classic_004_theorem-proof",
  )[1]!;
  const scoredRemaps = Object.values(state.cardInstances).filter(
    (c) => c.definitionId === "onr_classic_001_data-fort-remapping",
  );
  for (const [card, side] of [
    [scoredTheorem, "runner"],
    [scoredRemaps[0]!, "runner"],
    [scoredRemaps[1]!, "corp"],
    [scoredRemaps[2]!, "corp"],
  ] as const) {
    removeEverywhere(state, card.instanceId);
    card.zone = { side, zone: "scoreArea" };
    card.faceup = true;
    state[side].scoreArea.push(card.instanceId);
  }
  const glacs = Object.values(state.cardInstances).filter(
    (c) => c.definitionId === "onr_classic_011_glacier",
  );
  const dead = Object.values(state.cardInstances).find(
    (c) => c.definitionId === "onr_classic_008_deadeye",
  )!;
  const agenda = Object.values(state.cardInstances).find(
    (c) => c.definitionId === "onr_classic_004_theorem-proof",
  )!;
  const krash = Object.values(state.cardInstances).find(
    (c) => c.definitionId === "onr_v1_039_krash",
  )!;
  for (const c of [glacs[0]!, glacs[1]!, dead, agenda, krash])
    removeEverywhere(state, c.instanceId);
  for (const [c, server] of [
    [glacs[0]!, "remote_1"],
    [glacs[1]!, "remote_2"],
    [dead, "remote_2"],
  ] as const) {
    c.zone = { side: "corp", zone: "serverIce", serverId: server };
    c.rezzed = true;
    c.faceup = true;
  }
  agenda.zone = { side: "corp", zone: "serverRoot", serverId: "remote_2" };
  agenda.advancementCounters = 1;
  krash.zone = { side: "runner", zone: "rig" };
  krash.faceup = true;
  state.runner.rig.programs.push(krash.instanceId);
  state.corp.servers.push(
    {
      id: "remote_1",
      kind: "remote",
      label: "Remote 1",
      root: [],
      ice: [glacs[0]!.instanceId],
    },
    {
      id: "remote_2",
      kind: "remote",
      label: "Remote 2",
      root: [agenda.instanceId],
      ice: [dead.instanceId, glacs[1]!.instanceId],
    },
  );
  const start = getLegalActions(state, "runner").find(
    (a) => a.type === "start_run" && a.payload?.serverId === "remote_2",
  )!;
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId: start.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: "sp431-start",
  });
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return { state: result.state, source: glacs[0]!.instanceId };
}
function inputFor(state: GameState) {
  const raw = buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    profileId: "sp431",
    decisionId: `sp431:${state.matchId}:${state.stateVersion}`,
    ownDeckSnapshot: {
      deckSnapshotId: "sp431-current-terminal-corp",
      side: "corp",
      cards: [
        { cardId: "onr_classic_011_glacier", quantity: 3 },
        { cardId: "onr_classic_008_deadeye", quantity: 3 },
        { cardId: "onr_classic_004_theorem-proof", quantity: 6 },
        { cardId: "onr_classic_001_data-fort-remapping", quantity: 3 },
      ],
    },
  });
  return { ...raw, ...buildAiDecisionInputDto(raw) };
}
function move(input: ReturnType<typeof inputFor>) {
  return input.legalActions.find(
    (a) =>
      a.payload?.fortRunWindowAbility ===
        "move_self_to_outermost_position_on_other_fort" &&
      a.payload?.serverId === "remote_1" &&
      a.payload?.targetServerId === "remote_2",
  )!;
}
function apply(state: GameState, action: LegalAction) {
  const r = applyAction(state, {
    matchId: state.matchId,
    side: action.side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `sp431:${state.stateVersion}`,
  });
  if (!r.ok) throw new Error(JSON.stringify(r.error));
  expect(validateGameState(r.state)).toEqual({ ok: true, errors: [] });
  return r.state;
}
function terminalHqFixture(corpCredits = 3, runnerCredits = 4) {
  const { state, source } = fixture(corpCredits, runnerCredits);
  // Arrange the public resources and Corp-private HQ of native G26 D446;
  // the run itself and both movement/rez transitions use real LegalActions.
  delete state.run;
  state.activeSide = "runner";
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  const remote = state.corp.servers.find((s) => s.id === "remote_2")!;
  const agenda = state.cardInstances[remote.root[0]!]!;
  removeEverywhere(state, agenda.instanceId);
  agenda.zone = { side: "corp", zone: "hq" };
  state.corp.hq.push(agenda.instanceId);
  const runnerRemap = state.runner.scoreArea.find(
    (id) =>
      state.cardInstances[id]!.definitionId ===
      "onr_classic_001_data-fort-remapping",
  )!;
  removeEverywhere(state, runnerRemap);
  state.cardInstances[runnerRemap]!.zone = { side: "corp", zone: "archives" };
  state.corp.archives.push(runnerRemap);
  const extraScore = Object.values(state.cardInstances).find(
    (c) =>
      c.definitionId === "onr_classic_004_theorem-proof" &&
      c.zone.zone !== "scoreArea" &&
      c.instanceId !== agenda.instanceId,
  )!;
  removeEverywhere(state, extraScore.instanceId);
  extraScore.zone = { side: "runner", zone: "scoreArea" };
  extraScore.faceup = true;
  state.runner.scoreArea.push(extraScore.instanceId);
  state.cardInstances[source]!.rezzed = false;
  state.cardInstances[source]!.faceup = false;
  const start = getLegalActions(state, "runner").find(
    (a) => a.type === "start_run" && a.payload?.serverId === "hq",
  )!;
  return { state: apply(state, start), source };
}
afterEach(resetResidentPlanPortfolioMemory);
describe("SP-431 Defense-owned current terminal mobile-ICE route", () => {
  it("completes a real move and point-paid rez before terminal HQ access", () => {
    const { state, source } = terminalHqFixture();
    const input = inputFor(state);
    expect(state.cardInstances[source]!.rezzed).toBe(false);
    expect(state.corp.credits).toBe(3);
    expect(input.playerView.own.agendaPoints).toBe(4);
    expect(
      getPlayerView(state, "runner").servers.find((s) => s.id === "remote_1")!
        .ice[0]!.known,
    ).toBe(false);
    expect(input.playerView.opponent.agendaPoints).toBe(6);
    const action = input.legalActions.find(
      (a) => a.source === source && a.payload?.targetServerId === "hq",
    )!;
    const quote = JSON.parse(
      action.payload!.corpMobileIceMoveQuoteJson as string,
    );
    expect(quote.continuation).toEqual({
      requiresRez: true,
      rezCredits: 0,
      mandatoryAgendaPoints: 1,
      corpCreditsAfterDefense: 2,
      corpAgendaPointsAfterDefense: 3,
    });
    // Before the producer/owner correction this offered move had no quote,
    // and the productive chooser declined the current terminal HQ run.
    const moved = apply(state, action);
    const rezInput = inputFor(moved);
    const rez = rezInput.legalActions.find((a) => a.type === "rez_ice")!;
    expect(rez).toBeDefined();
    const rezDecision = chooseAiAction(rezInput);
    expect(rezDecision.actionId).toBe(rez.actionId);
    const rezzed = apply(moved, rez);
    expect(getPlayerView(rezzed, "corp").own.agendaPoints).toBe(3);
    expect(rezzed.corp.credits).toBe(2);
    expect(
      getPlayerView(rezzed, "corp")
        .servers.find((s) => s.id === "hq")!
        .ice.map((c) => c.effectiveRunQuote),
    ).toEqual(quote.afterIce.map((c: any) => c.effectiveRunQuote));
    resetResidentPlanPortfolioMemory();
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe(action.actionId);
    expect(
      decision.decisionDebug!.planFirstDecision!.rootPlanInstanceId,
    ).toContain("corp.defend_servers");
    expect(
      rezDecision.decisionDebug!.planFirstDecision!.rootPlanInstanceId,
    ).toContain("corp.defend_servers");
    for (const d of [decision, rezDecision]) {
      expect(d.fallbackUsed).toBe(false);
      expect(
        d.decisionDebug!.planFirstDecision!.leafExecutorInstanceId,
      ).toContain("corp.defend_servers");
      expect(d.decisionDebug!.planFirstDecision!.selectedStep).toBeDefined();
      expect(d.decisionDebug!.planFirstDecision!.route).toBeDefined();
    }
  });
  it("holds an HQ move when the Runner can fund its complete post-rez path", () => {
    const { state, source } = terminalHqFixture(3, 50),
      input = inputFor(state);
    const action = input.legalActions.find(
      (a) => a.source === source && a.payload?.targetServerId === "hq",
    )!;
    expect(assessMobileIceRunDefense(input, action)).toMatchObject({
      productive: false,
      evidenceCode: "corp_mobile_ice_does_not_prove_terminal_access_block",
    });
    expect(chooseAiAction(input).actionId).not.toBe(action.actionId);
  });
  it("does not infer terminal HQ material from hidden R&D or the deck list", () => {
    const { state, source } = terminalHqFixture();
    for (const id of state.corp.hq.filter((id) =>
      state.cardInstances[id]!.definitionId.includes("theorem-proof"),
    )) {
      removeEverywhere(state, id);
      state.cardInstances[id]!.zone = { side: "corp", zone: "rd" };
      state.corp.rd.push(id);
    }
    const input = inputFor(state),
      action = input.legalActions.find(
        (a) => a.source === source && a.payload?.targetServerId === "hq",
      )!;
    expect(assessMobileIceRunDefense(input, action)).toMatchObject({
      productive: false,
      evidenceCode: "corp_mobile_ice_has_no_bound_current_terminal_agenda",
    });
  });
  it.each([1, 3])(
    "uses a real Engine move and quote with %i Corp credits",
    (credits) => {
      const { state } = fixture(credits),
        input = inputFor(state),
        action = move(input);
      expect(action).toBeDefined();
      expect(action.payload?.corpMobileIceMoveQuoteJson).toBeTypeOf("string");
      expect(assessMobileIceRunDefense(input, action)).toMatchObject({
        productive: true,
        serverId: "remote_2",
      });
      const decision = chooseAiAction(input);
      expect(decision.actionId).toBe(action.actionId);
      expect(decision.fallbackUsed).toBe(false);
      const pf = decision.decisionDebug!.planFirstDecision!;
      expect(pf.rootPlanInstanceId).toContain("corp.defend_servers");
      expect(pf.leafExecutorInstanceId).toContain("corp.defend_servers");
      expect(pf.selectedStep).toBeDefined();
      expect(pf.route).toBeDefined();
      const quote = JSON.parse(
          action.payload!.corpMobileIceMoveQuoteJson as string,
        ),
        after = apply(state, action);
      const actual = getPlayerView(after, "corp").servers.find(
        (s) => s.id === "remote_2",
      )!.ice;
      expect(actual.map((c) => c.effectiveRunQuote)).toEqual(
        quote.afterIce.map((c: any) => c.effectiveRunQuote),
      );
      expect(after.corp.credits).toBe(credits - 1);
    },
  );
  it("holds movement when the Runner can still fund the resulting complete path", () => {
    const { state } = fixture(3, 50),
      input = inputFor(state),
      action = move(input);
    expect(assessMobileIceRunDefense(input, action)).toMatchObject({
      productive: false,
      evidenceCode: "corp_mobile_ice_does_not_prove_terminal_access_block",
    });
    expect(chooseAiAction(input).actionId).not.toBe(action.actionId);
  });
  it("does not abandon an agenda on the origin fort", () => {
    const { state } = fixture(),
      spare = Object.values(state.cardInstances).find(
        (c) =>
          c.definitionId === "onr_classic_004_theorem-proof" &&
          c.zone.zone !== "serverRoot",
      )!;
    removeEverywhere(state, spare.instanceId);
    spare.zone = { side: "corp", zone: "serverRoot", serverId: "remote_1" };
    state.corp.servers
      .find((s) => s.id === "remote_1")!
      .root.push(spare.instanceId);
    const input = inputFor(state);
    expect(assessMobileIceRunDefense(input, move(input))).toMatchObject({
      productive: false,
    });
  });
  it("keeps unfunded movement unavailable", () => {
    const { state } = fixture(0),
      input = inputFor(state);
    expect(move(input)).toBeUndefined();
  });
  it("does not claim protection when an unrezzed movement source cannot pay its mandatory point", () => {
    const { state, source } = fixture();
    state.cardInstances[source]!.rezzed = false;
    for (const id of state.corp.scoreArea)
      state.cardInstances[id]!.agendaPointsSpent = 2;
    const input = inputFor(state),
      action = move(input);
    expect(action).toBeDefined();
    expect(action.payload?.corpMobileIceMoveQuoteJson).toBeUndefined();
    expect(assessMobileIceRunDefense(input, action)).toMatchObject({
      productive: false,
      evidenceCode: "corp_mobile_ice_requires_complete_current_move_quote",
    });
  });
  it("keeps nonterminal agenda allocation outside the current terminal response", () => {
    const { state } = fixture(),
      scored = state.runner.scoreArea.find(
        (id) =>
          state.cardInstances[id]?.definitionId ===
          "onr_classic_001_data-fort-remapping",
      )!;
    removeEverywhere(state, scored);
    state.cardInstances[scored]!.zone = { side: "corp", zone: "archives" };
    state.corp.archives.push(scored);
    const input = inputFor(state);
    expect(input.playerView.opponent.agendaPoints).toBe(3);
    expect(assessMobileIceRunDefense(input, move(input))).toMatchObject({
      productive: false,
      evidenceCode: "corp_mobile_ice_has_no_bound_current_terminal_agenda",
    });
  });
  it.each(["state", "action", "target", "json", "payment"])(
    "fails closed on a broken quote binding: %s",
    (broken) => {
      const { state } = fixture(),
        input = inputFor(state),
        action = move(input),
        q = JSON.parse(action.payload!.corpMobileIceMoveQuoteJson as string);
      if (broken === "state") q.stateVersion--;
      if (broken === "action") q.actionId = "another-action";
      if (broken === "target") q.targetServerId = "hq";
      if (broken === "payment") q.continuation.corpAgendaPointsAfterDefense--;
      action.payload!.corpMobileIceMoveQuoteJson =
        broken === "json" ? "{" : JSON.stringify(q);
      expect(() => assessMobileIceRunDefense(input, action)).toThrow(
        PlanResolutionFailure,
      );
    },
  );
});
