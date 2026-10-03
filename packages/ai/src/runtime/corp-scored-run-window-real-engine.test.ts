import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import { DEMO_DECKS, type GameState, type LegalAction } from "@netgrid/shared";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import {
  buildAiDecisionInput,
  selectAiDecisionSideForState,
} from "./ai-decision-input";

const REMAP = "onr_classic_001_data-fort-remapping";
const THEOREM = "onr_classic_004_theorem-proof";
const DEAD = "onr_classic_008_deadeye";
const extra = [REMAP, THEOREM, DEAD];
const corpDeck = {
  ...DEMO_DECKS.demo_corp_001,
  id: "scored-run-response",
  cards: [
    ...DEMO_DECKS.demo_corp_001.cards.filter((c) => !extra.includes(c.id)),
    ...extra.map((id) => ({ id, quantity: 3 })),
  ],
};
function apply(state: GameState, action: LegalAction) {
  const r = applyAction(state, {
    matchId: state.matchId,
    side: action.side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `scored:${state.stateVersion}:${action.actionId}`,
  });
  if (!r.ok) throw Error(JSON.stringify(r.error));
  return r.state;
}
function fixture(rezzedIce: boolean) {
  let state = createGameAfterSetup({
    seed: `scored-run-response-${rezzedIce}`,
    corpDeck,
    agendaPointsToWin: 7,
  });
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "mandatory_draw")!,
  );
  RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCardInHq(REMAP)
    .withCorpCredits(10);
  const install = getLegalActions(state, "corp").find(
    (a) =>
      a.type === "install_card" &&
      a.source &&
      state.cardInstances[a.source]?.definitionId === REMAP &&
      a.payload?.serverId === "new_remote",
  )!;
  const agendaId = install.source!;
  state = apply(state, install);
  state.cardInstances[agendaId]!.advancementCounters = 4;
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "score_agenda")!,
  );
  for (const id of state.corp.rd
    .filter((id) => state.cardInstances[id]!.definitionId === THEOREM)
    .slice(0, 2)) {
    state.corp.rd = state.corp.rd.filter((x) => x !== id);
    state.runner.scoreArea.push(id);
    Object.assign(state.cardInstances[id]!, {
      zone: { side: "runner", zone: "scoreArea" },
      controller: "runner",
      faceup: true,
      rezzed: true,
    });
  }
  const hqAgenda = state.corp.rd.find(
    (id) => id !== agendaId && state.cardInstances[id]!.definitionId === REMAP,
  )!;
  expect(hqAgenda).toBeDefined();
  state.corp.rd = state.corp.rd.filter((id) => id !== hqAgenda);
  state.corp.hq.push(hqAgenda);
  Object.assign(state.cardInstances[hqAgenda]!, {
    zone: { side: "corp", zone: "hq" },
    faceup: false,
    rezzed: false,
  });
  expect(
    getPlayerView(state, "corp").own.scoreArea.find(
      (c) => c.instanceId === agendaId,
    )?.counterDisplays,
  ).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ counterType: "remap", amount: 1 }),
    ]),
  );
  if (rezzedIce)
    RealEngineFixtureBuilder.forState(state).withRezzedCorpIceOnServer(
      "hq",
      DEAD,
    );
  state.corp.clicks = 0;
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "end_turn")!,
  );
  expect(state.activeSide).toBe("runner");
  return state;
}
afterEach(resetResidentPlanPortfolioMemory);

it.each([false, true])(
  "gives the existing Defense owner its Remap response before terminal HQ access (rezzed ICE: %s)",
  (rezzedIce) => {
    let state = fixture(rezzedIce);
    const initial = structuredClone(state),
      eventStart = state.eventLog.length;
    state = apply(
      state,
      getLegalActions(state, "runner").find(
        (a) => a.type === "start_run" && a.payload?.serverId === "hq",
      )!,
    );
    expect(selectAiDecisionSideForState(state).side).toBe("corp");
    const input = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
      profileId: "scored-response",
      decisionId: `scored:${state.stateVersion}`,
      ownDeckSnapshot: {
        deckSnapshotId: corpDeck.id,
        side: "corp",
        cards: corpDeck.cards.map((c) => ({
          cardId: c.id,
          quantity: c.quantity,
        })),
      },
    });
    expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
    const ability = input.legalActions.find(
      (a) =>
        a.type === "activated_card_ability" &&
        a.payload?.cardImplementationEffectKind === "end_run",
    )!;
    expect(ability).toBeDefined();
    const d = chooseAiAction(input);
    expect(d.actionId).toBe(ability.actionId);
    expect(d.fallbackUsed).toBe(false);
    const pf = d.decisionDebug?.planFirstDecision;
    expect(pf?.rootPlanInstanceId).toBe(
      "plan:corp.defend_servers:server-defense-portfolio",
    );
    expect(pf?.leafExecutorInstanceId).toBe(pf?.rootPlanInstanceId);
    expect(pf?.route).toMatchObject({
      actionId: ability.actionId,
      stateVersion: state.stateVersion,
    });
    state = apply(state, ability);
    expect(state.run).toBeUndefined();
    expect(
      getPlayerView(state, "corp").own.scoreArea.find(
        (c) => c.definitionId === REMAP,
      )?.counterDisplays ?? [],
    ).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ counterType: "remap", amount: 1 }),
      ]),
    );
    const replay = replayEvents(initial, state.eventLog.slice(eventStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  },
);
