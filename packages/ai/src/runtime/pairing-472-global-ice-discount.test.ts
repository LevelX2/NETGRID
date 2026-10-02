import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  validateGameState,
} from "@netgrid/engine";
import {
  ORIGINALSET_DEFAULT_DECKS,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import { afterEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "./ai-decision-input";

const fortress = "onr_v1_324_fortress-architects";
const chester = "onr_v1_352_chester-mix";
const filter = "onr_v1_244_filter";
const corpDeck = {
  ...ORIGINALSET_DEFAULT_DECKS.corp,
  cards: [
    { id: fortress, quantity: 1 },
    { id: chester, quantity: 1 },
    { id: filter, quantity: 1 },
    { id: "onr_v1_237_data-wall", quantity: 2 },
    { id: "onr_v1_247_haunting-inquisition", quantity: 1 },
    { id: "onr_v1_220_tycho-extension", quantity: 1 },
    { id: "onr_v1_188_ai-chief-financial-officer", quantity: 33 },
  ],
};
const runnerDeck = {
  ...ORIGINALSET_DEFAULT_DECKS.runner,
  cards: [
    { id: "onr_v1_021_dwarf", quantity: 1 },
    ...ORIGINALSET_DEFAULT_DECKS.runner.cards,
  ],
};

afterEach(resetResidentPlanPortfolioMemory);
function prepared(sourceDefinitionId = fortress, hqDiscounted = false) {
  const state = createGameAfterSetup({
    seed: "sp453-global-discount",
    corpDeck,
    runnerDeck,
  });
  state.activeSide = "corp";
  state.phase = "corp_action_phase";
  state.timingPoint = "corp_action.main";
  state.corp.clicks = 1;
  const fixture = RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCredits(2)
    .withRunnerCredits(20)
    .withRunnerProgramInstalled("onr_v1_021_dwarf")
    .withCorpCardInHq(filter)
    .withCorpCardInHq("onr_v1_220_tycho-extension")
    .withCorpRemoteRoot("remote_1", sourceDefinitionId)
    .withRezzedCorpIceOnServer("rd", "onr_v1_247_haunting-inquisition");
  const wallIds = Object.values(state.cardInstances)
    .filter((c) => c.definitionId === "onr_v1_237_data-wall")
    .map((c) => c.instanceId);
  for (const id of wallIds) {
    state.corp.hq = state.corp.hq.filter((c) => c !== id);
    state.corp.rd = state.corp.rd.filter((c) => c !== id);
    state.corp.archives = state.corp.archives.filter((c) => c !== id);
    state.corp.servers.find((s) => s.id === "hq")!.ice.push(id);
    Object.assign(state.cardInstances[id]!, {
      zone: { side: "corp", zone: "serverIce", serverId: "hq" },
      faceup: true,
      rezzed: true,
    });
  }
  if (hqDiscounted)
    fixture.withCorpRemoteRoot("hq", chester, 0, {
      faceup: true,
      rezzed: true,
    });
  return state;
}
function input(state: GameState) {
  return buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: "sp453-global-discount",
      side: "corp",
      cards: corpDeck.cards.map((c) => ({
        cardId: c.id,
        quantity: c.quantity,
      })),
    },
  });
}
function apply(state: GameState, action: LegalAction) {
  const result = applyAction(state, {
    matchId: state.matchId,
    side: action.side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: "sp453:" + state.stateVersion,
  });
  if (!result.ok) throw Error(result.error.message);
  return result.state;
}
describe("pairing 472: actual Engine global ICE discount through the productive AI input", () => {
  it("prepares the selected HQ defense from another root fort and then installs the same ICE", () => {
    const state = prepared();
    const current = input(state);
    const chosen = chooseAiAction(current);
    const action = current.legalActions.find(
      (a) => a.actionId === chosen.actionId,
    )!;
    expect(action).toMatchObject({
      type: "rez_card",
      payload: { serverId: "remote_1" },
    });
    expect(state.cardInstances[action.source!]!.definitionId).toBe(fortress);
    expect(chosen).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
    expect(chosen.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
      priority: { effectiveClass: "P3" },
    });
    const rezzed = apply(state, action);
    expect(rezzed.corp.clicks).toBe(1);
    const next = input(rezzed);
    const installation = chooseAiAction(next);
    const install = getLegalActions(rezzed, "corp").find(
      (a) => a.actionId === installation.actionId,
    )!;
    expect(install).toMatchObject({
      type: "install_card",
      payload: { placement: "ice", serverId: "hq", iceInstallTotalCost: 1 },
    });
    expect(rezzed.cardInstances[install.source!]!.definitionId).toBe(filter);
    expect(installation.decisionDebug?.planFirstDecision?.selectedStep).toEqual(
      chosen.decisionDebug?.planFirstDecision?.selectedStep,
    );
    expect(installation.decisionDebug?.planFirstDecision?.priority).toEqual(
      chosen.decisionDebug?.planFirstDecision?.priority,
    );
    const installed = apply(rezzed, install);
    expect(installed.corp.credits).toBe(1);
    expect(validateGameState(installed)).toEqual({ ok: true, errors: [] });
  });
  it("does not transfer a fort-local discount to the selected HQ installation", () => {
    const state = prepared(chester);
    const current = input(state);
    const chosen = chooseAiAction(current);
    expect(
      current.legalActions.find((a) => a.actionId === chosen.actionId),
    ).toMatchObject({
      type: "install_card",
      payload: { placement: "ice", serverId: "hq", iceInstallTotalCost: 2 },
    });
  });
  it("does not prepare an already free selected HQ installation", () => {
    const state = prepared(fortress, true);
    const current = input(state);
    const chosen = chooseAiAction(current);
    expect(
      current.legalActions.find((a) => a.actionId === chosen.actionId),
    ).toMatchObject({
      type: "install_card",
      payload: { placement: "ice", serverId: "hq", iceInstallTotalCost: 0 },
    });
  });
});
