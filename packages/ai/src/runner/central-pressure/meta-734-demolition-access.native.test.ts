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
import { describe, expect, it } from "vitest";
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

function fixture(expensive = false) {
  const decks = ORIGINALSET_DEFAULT_DECKS;
  const state = createGame({
    seed: "demolition-real-run-replacement",
    setupMode: "completed",
    runnerDeck: {
      ...decks.runner,
      cards: [
        ...decks.runner.cards,
        { id: demolition, quantity: 1 },
        { id: highlighter, quantity: 1 },
      ],
    },
    corpDeck: {
      ...decks.corp,
      cards: [
        ...decks.corp.cards,
        { id: cheapWall, quantity: 1 },
        { id: costlyWall, quantity: 2 },
      ],
    },
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
  const rd = state.corp.servers.find((server) => server.id === "rd")!;
  for (const definition of expensive ? [costlyWall, costlyWall] : [cheapWall]) {
    const ice = takeDeckCard(state, "corp", definition);
    ice.zone = { side: "corp", zone: "serverIce", serverId: "rd" };
    ice.faceup = true;
    ice.rezzed = true;
    rd.ice.push(ice.instanceId);
  }
  state.runner.credits = expensive ? 60 : 21;
  state.runner.clicks = 4;
  state.corp.credits = 5;
  state.phase = "runner_action_phase";
  state.activeSide = "runner";
  state.timingPoint = "runner_action.main";
  const actions = getLegalActions(state, "runner");
  const selected = actions.find(
    (action) =>
      action.source === event.instanceId && action.payload?.serverId === "rd",
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
    (target) => target.actionId === "runner.start_run.rd",
  );
  if (!eventTarget || !normal) throw Error("Missing native comparison routes");
  return { state, input, selected, eventTarget, normal };
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
