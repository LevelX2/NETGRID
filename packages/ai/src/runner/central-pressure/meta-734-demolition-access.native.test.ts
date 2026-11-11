import {
  applyAction,
  createGame,
  getLegalActions,
  getPlayerView,
} from "@netgrid/engine";
import {
  ORIGINALSET_DEFAULT_DECKS,
  RUNNER_FORT_ICE_TRASH_QUOTE_SCHEMA_VERSION,
  type CardDefinitionId,
  type GameState,
  type Side,
} from "@netgrid/shared";
import { afterEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { activeRunRootPlan } from "../run-window/run-window-origin";
import { buildAiDecisionInputDto } from "../../input-dto";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";

const demolition = "onr_proteus_105_demolition-run";
const dwarf = "onr_v1_021_dwarf";
const krash = "onr_v1_039_krash";
const highlighter = "onr_proteus_090_highlighter";
const cheapWall = "onr_v1_238_data-wall-2-0";
const costlyWall = "onr_v1_245_fire-wall";

function takeDeckCard(
  state: GameState,
  side: Side,
  definitionId: CardDefinitionId,
) {
  const zones =
    side === "runner"
      ? [state.runner.grip, state.runner.stack]
      : [state.corp.hq, state.corp.rd];
  for (const zone of zones) {
    const index = zone.findIndex(
      (id) => state.cardInstances[id]?.definitionId === definitionId,
    );
    if (index >= 0) {
      const [id] = zone.splice(index, 1);
      return state.cardInstances[id!]!;
    }
  }
  throw Error("Missing fixture card " + definitionId);
}

afterEach(resetResidentPlanPortfolioMemory);

function fixture(
  expensive = false,
  serverId: "rd" | "remote_1" = "rd",
  credits = expensive ? 60 : 21,
  wallCount = 2,
) {
  const decks = ORIGINALSET_DEFAULT_DECKS;
  const runnerDeck = {
    ...decks.runner,
    cards: [
      ...decks.runner.cards,
      { id: demolition, quantity: 3 },
      { id: highlighter, quantity: 1 },
    ],
  };
  const corpDeck = {
    ...decks.corp,
    cards: [
      ...decks.corp.cards,
      { id: cheapWall, quantity: 1 },
      { id: costlyWall, quantity: wallCount },
    ],
  };
  const state = createGame({
    seed: "demolition-real-run-replacement",
    setupMode: "completed",
    runnerDeck,
    corpDeck,
  });
  const event = takeDeckCard(state, "runner", demolition);
  event.zone = { side: "runner", zone: "grip" };
  state.runner.grip.push(event.instanceId);
  for (const definition of [expensive ? krash : dwarf, highlighter]) {
    const card = takeDeckCard(state, "runner", definition);
    card.zone = { side: "runner", zone: "rig" };
    card.faceup = true;
    card.rezzed = true;
    state.runner.rig.programs.push(card.instanceId);
  }
  for (const definition of [
    "onr_v1_220_tycho-extension",
    "onr_v1_214_project-babylon",
  ]) {
    const card = takeDeckCard(state, "corp", definition);
    card.controller = "runner";
    card.zone = { side: "runner", zone: "scoreArea" };
    card.faceup = true;
    state.runner.scoreArea.push(card.instanceId);
  }
  if (serverId === "remote_1") {
    state.corp.servers.push({
      id: serverId,
      kind: "remote",
      label: "Remote 1",
      ice: [],
      root: [],
    });
  }
  const fort = state.corp.servers.find((server) => server.id === serverId)!;
  for (const definition of expensive
    ? Array<CardDefinitionId>(wallCount).fill(costlyWall)
    : [cheapWall]) {
    const ice = takeDeckCard(state, "corp", definition);
    ice.zone = { side: "corp", zone: "serverIce", serverId };
    ice.faceup = true;
    ice.rezzed = true;
    fort.ice.push(ice.instanceId);
  }
  state.runner.credits = credits;
  state.runner.clicks = 4;
  state.corp.credits = 5;
  state.phase = "runner_action_phase";
  state.activeSide = "runner";
  state.timingPoint = "runner_action.main";
  const actions = getLegalActions(state, "runner");
  const selected = actions.find(
    (action) =>
      action.source === event.instanceId &&
      action.payload?.serverId === serverId,
  );
  if (!selected) throw Error("Missing native R&D Event");
  const input = buildAiDecisionInputDto({
    matchId: state.matchId,
    playerView: getPlayerView(state, "runner"),
    legalActions: actions,
    eventTail: [],
    side: "runner",
    difficulty: "hard",
    seed: state.seed,
    decisionId: state.matchId + ":demolition",
    actionNumber: state.stateVersion,
    profileId: "runner-ai-v0.9-hard",
  });
  const targets = evaluateRunnerRunTargets({ input });
  const eventTarget = targets.find(
    (target) => target.actionId === selected.actionId,
  );
  const normal = targets.find(
    (target) => target.actionId === `runner.start_run.${serverId}`,
  );
  if (!eventTarget || !normal) throw Error("Missing native comparison routes");
  return { state, input, selected, eventTarget, normal, runnerDeck, corpDeck };
}

describe("Demolition Run's native successful-run replacement", () => {
  it("quotes the current ICE and tags without an Agenda or Mole access bonus", () => {
    const { state, input, selected, eventTarget, normal } = fixture();
    expect(input.playerView.own.agendaPoints).toBe(5);
    expect(selected.payload).toMatchObject({
      successfulRunAccessReplacement: "trash_rezzed_ice_on_fort_and_tag_runner",
      runnerFortIceTrashQuoteSchemaVersion:
        RUNNER_FORT_ICE_TRASH_QUOTE_SCHEMA_VERSION,
      runnerFortIceTrashQuoteStateVersion: state.stateVersion,
      runnerFortIceTrashServerId: "rd",
      runnerFortIceTrashRezzedIceCount: 1,
      runnerFortIceTrashTagsAdded: 3,
    });
    expect(eventTarget).toMatchObject({
      accessPayoff: "known_low_value",
      accessNoveltyRatio: 0,
      knownAccessState: "known_no_current_payoff",
      multiaccessAvailable: false,
      runActionProjection: {
        accessReplacement: "trash_rezzed_ice_on_fort_and_tag_runner",
        successfulRunSelfTags: 3,
      },
    });
    expect(eventTarget.evidence).toEqual(
      expect.arrayContaining([
        "runner_matchpoint_central_access:false",
        "run_access_replacement_normal_access:false",
        "fort_ice_trash_basic_cleanup_credits:6",
        "fort_ice_trash_basic_cleanup_clicks:3",
      ]),
    );
    expect(normal.multiaccessAvailable).toBe(true);
    expect(normal.evidence).toContain("runner_matchpoint_central_access:true");
    expect(normal.score).toBeGreaterThan(eventTarget.score);
    const applied = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: selected.actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    expect(applied.ok).toBe(true);
    if (applied.ok) {
      expect(applied.state.run).toMatchObject({
        successfulRunAccessReplacement:
          "trash_rezzed_ice_on_fort_and_tag_runner",
        successfulRunRunnerTagGain: 3,
      });
    }
  });

  it("retains a positive payoff for clearing two expensive ICE", () => {
    const { eventTarget } = fixture(true);
    expect(eventTarget).toMatchObject({
      accessPayoff: "access_bonus",
      knownAccessState: "known_payoff",
      accessNoveltyRatio: 0,
      multiaccessAvailable: false,
    });
    expect(eventTarget.evidence).toEqual(
      expect.arrayContaining([
        "run_access_replacement_normal_access:false",
        "fort_ice_trash_rezzed_targets:2",
        "fort_ice_trash_tags:3",
      ]),
    );
  });

  it("admits no empty Remote follow-up despite positive known cash savings", () => {
    const { eventTarget } = fixture(true, "remote_1");
    expect(eventTarget).toMatchObject({
      accessPayoff: "known_low_value",
      knownAccessState: "known_no_current_payoff",
      scoreThreat: false,
    });
    expect(eventTarget.fortIceTrashObjective).toBeUndefined();
    expect(eventTarget.evidence).toContain(
      "fort_ice_trash_useful_followup:false",
    );
  });

  it("does not spend the cash needed to remove the Event's tags", () => {
    const { eventTarget } = fixture(true, "rd", 23);
    expect(eventTarget.creditsAfterRun).toBeLessThan(6);
    expect(eventTarget.knownAccessState).toBe("known_no_current_payoff");
    expect(eventTarget.fortIceTrashObjective).toBeUndefined();
  });

  it("carries a worthwhile Event through native pumps, breaks and the ICE-trash replacement", () => {
    const prepared = fixture(true, "rd", 80, 4);
    let state = prepared.state;
    for (const id of state.runner.scoreArea.splice(0)) {
      state.cardInstances[id]!.controller = "corp";
      state.cardInstances[id]!.zone = { side: "corp", zone: "rd" };
      state.cardInstances[id]!.faceup = false;
      state.corp.rd.push(id);
    }
    const mole = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === highlighter,
    )!;
    state.runner.rig.programs.splice(
      state.runner.rig.programs.indexOf(mole),
      1,
    );
    state.cardInstances[mole]!.zone = { side: "runner", zone: "stack" };
    state.cardInstances[mole]!.faceup = false;
    state.cardInstances[mole]!.rezzed = false;
    state.runner.stack.push(mole);
    for (const id of state.runner.grip.slice()) {
      if (state.cardInstances[id]?.definitionId === demolition) continue;
      state.runner.grip.splice(state.runner.grip.indexOf(id), 1);
      state.runner.stack.push(id);
      state.cardInstances[id]!.zone = { side: "runner", zone: "stack" };
    }
    for (const id of state.runner.stack.filter(
      (id) => state.cardInstances[id]?.definitionId === demolition,
    )) {
      state.runner.stack.splice(state.runner.stack.indexOf(id), 1);
      state.cardInstances[id]!.zone = { side: "runner", zone: "grip" };
      state.runner.grip.push(id);
    }
    const snapshot = (side: Side) => ({
      deckSnapshotId: `demolition-native-${side}`,
      side,
      cards: (side === "runner"
        ? prepared.runnerDeck
        : prepared.corpDeck
      ).cards.map((card) => ({ cardId: card.id, quantity: card.quantity })),
    });
    const inputFor = (side: Side) =>
      buildAiDecisionInput(state, side, {
        difficulty: "hard",
        ownDeckSnapshot: snapshot(side),
      });
    for (const id of state.corp.hq.splice(0)) {
      state.corp.rd.push(id);
      state.cardInstances[id]!.zone = { side: "corp", zone: "rd" };
    }
    const initial = inputFor("runner");
    const start = chooseAiAction(initial);
    expect(start.fallbackUsed || start.timeoutUsed).toBe(false);
    const selected = initial.legalActions.find(
      (action) => action.actionId === start.actionId,
    );
    if (!selected) throw Error("The selected Event is not an Engine offer");
    expect(
      selected.payload?.successfulRunAccessReplacement,
      start.actionId,
    ).toBe("trash_rezzed_ice_on_fort_and_tag_runner");
    const rootId = start.decisionDebug?.planFirstDecision?.rootPlanInstanceId;
    expect(rootId).toContain("runner.pressure_central");
    const played = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: selected.actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    if (!played.ok) throw Error(played.error.message);
    state = played.state;
    const initialRun = inputFor("runner");
    expect(
      activeRunRootPlan(residentPlanPortfolioSnapshot(initialRun), initialRun),
    ).toMatchObject({
      instanceId: rootId,
      accessCommitment: {
        intendedAction: "replace_access",
        fortIceTrashObjective: {
          actionId: start.actionId,
          serverId: "rd",
          tagsAdded: 3,
        },
      },
    });
    expect(
      initialRun.playerView.run?.successfulRunFortIceTrashQuote,
    ).toMatchObject({
      runId: state.run?.runId,
      stateVersion: state.stateVersion,
      serverId: "rd",
      sourceCardInstanceId: selected?.source,
      rezzedIceCount: 4,
      tagsAdded: 3,
    });
    expect(
      getPlayerView(state, "corp").run?.successfulRunFortIceTrashQuote,
    ).toBeUndefined();

    const actionTypes: string[] = [];
    for (let step = 0; state.run && step < 40; step++) {
      const side = state.activeSide;
      const input = inputFor(side);
      const decision = chooseAiAction(input);
      expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
      const action = input.legalActions.find(
        (a) => a.actionId === decision.actionId,
      )!;
      expect(action).toBeDefined();
      actionTypes.push(action.type);
      if (
        action.type === "pump_breaker" ||
        action.type === "break_subroutine"
      ) {
        expect(
          decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
        ).toBe(rootId);
        expect(
          decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
        ).toBe("runner.convert_run_window");
      }
      const applied = applyAction(state, {
        matchId: state.matchId,
        side,
        actionId: action.actionId,
        clientKnownStateVersion: state.stateVersion,
        ...(decision.selectedChoices
          ? { selectedChoices: decision.selectedChoices }
          : {}),
      });
      if (!applied.ok) throw Error(applied.error.message);
      state = applied.state;
    }
    expect(state.run).toBeUndefined();
    expect(actionTypes).toContain("pump_breaker");
    expect(actionTypes).toContain("break_subroutine");
    expect(actionTypes).not.toContain("access_card");
    expect(
      state.corp.servers.find((server) => server.id === "rd")?.ice,
    ).toEqual([]);
    expect(state.runner.tags).toBe(3);
  });

  it("does not silently assign an ordinary access when the bound quote is missing", () => {
    const { input, selected } = fixture();
    const action = input.legalActions.find(
      (action) => action.actionId === selected.actionId,
    )!;
    delete action.payload!.runnerFortIceTrashQuoteStateVersion;
    expect(() => evaluateRunnerRunTargets({ input })).toThrow(
      "runner_fort_ice_trash_replacement_quote_invalid",
    );
  });
});
