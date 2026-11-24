import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import {
  DEMO_DECKS,
  type CardInstanceId,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import { afterEach, describe, expect, it } from "vitest";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import {
  corpCampaignSlotJustCleared,
  corpScoreProjectReservesSlotAfterCampaign,
} from "../../runtime/corp-scoreline/score-hand-support";
import { corpEconomyDevelopmentCampaigns } from "./economy-signals";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";

const CAMPAIGN = "onr_v1_337_rockerboy-promotion";
const AGENDA = "onr_v1_196_corporate-war";
const WALL = "onr_v1_237_data-wall";
const deck = {
  ...DEMO_DECKS.demo_corp_001,
  id: "finite-campaign-fort-reuse",
  cards: [
    ...DEMO_DECKS.demo_corp_001.cards,
    { id: CAMPAIGN, quantity: 1 },
    { id: AGENDA, quantity: 1 },
    { id: WALL, quantity: 5 },
  ],
};

function apply(state: GameState, action: LegalAction) {
  const result = applyAction(state, {
    matchId: state.matchId,
    side: action.side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function perform(state: GameState, type: LegalAction["type"]) {
  const action = getLegalActions(state, state.activeSide).find(
    (offered) => offered.type === type,
  );
  if (!action) throw new Error("Missing " + type + " in " + state.timingPoint);
  return apply(state, action);
}

function nextCorpMain(state: GameState) {
  const afterCorp = perform(state, "end_turn");
  const afterRunner = perform(afterCorp, "end_turn");
  return perform(afterRunner, "mandatory_draw");
}

function inputFor(state: GameState) {
  return buildAiDecisionInput(state, "corp", {
    ownDeckSnapshot: {
      deckSnapshotId: deck.id,
      side: "corp",
      cards: deck.cards.map((card) => ({
        cardId: card.id,
        quantity: card.quantity,
      })),
    },
  });
}

function decide(state: GameState) {
  const input = inputFor(state);
  const decision = chooseAiAction(input);
  const action = input.legalActions.find(
    (offered) => offered.actionId === decision.actionId,
  );
  if (!action) throw new Error("Expected an offered action.");
  expect(decision).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
  return { action, trace: decision.decisionDebug?.planFirstDecision };
}

function fixture(pool?: number) {
  const state = perform(
    createGameAfterSetup({
      matchId: "finite-campaign-" + (pool ?? "install"),
      seed: "finite-campaign",
      corpDeck: deck,
    }),
    "mandatory_draw",
  );
  for (const id of state.corp.hq) {
    state.cardInstances[id]!.zone = { side: "corp", zone: "rd" };
    state.corp.rd.push(id);
  }
  state.corp.hq = [];
  const ids = (definitionId: string) =>
    Object.values(state.cardInstances)
      .filter((card) => card.definitionId === definitionId)
      .map((card) => card.instanceId);
  const campaignId = ids(CAMPAIGN)[0]!;
  const agendaId = ids(AGENDA)[0]!;
  const walls = ids(WALL);
  state.corp.servers.push({
    id: "remote_1",
    label: "Remote 1",
    kind: "remote",
    ice: [],
    root: [],
  });

  function move(
    id: CardInstanceId,
    zone: GameState["cardInstances"][string]["zone"],
  ) {
    state.corp.rd = state.corp.rd.filter((cardId) => cardId !== id);
    state.cardInstances[id]!.zone = zone;
    if (zone.zone === "hq") state.corp.hq.push(id);
    if (zone.zone === "serverIce" || zone.zone === "serverRoot") {
      const server = state.corp.servers.find(
        (entry) => entry.id === zone.serverId,
      )!;
      server[zone.zone === "serverIce" ? "ice" : "root"].push(id);
      state.cardInstances[id]!.rezzed = true;
      state.cardInstances[id]!.faceup = true;
    }
  }
  for (const [index, serverId] of [
    "hq",
    "rd",
    "remote_1",
    "remote_1",
  ].entries()) {
    move(walls[index]!, {
      side: "corp",
      zone: "serverIce",
      serverId: serverId as "hq" | "rd" | "remote_1",
    });
  }
  state.corp.credits = 10;
  state.runner.credits = 1;
  if (pool === undefined) {
    move(campaignId, { side: "corp", zone: "hq" });
    const drawOrder = [walls[4]!, agendaId];
    state.corp.rd = [
      ...drawOrder,
      ...state.corp.rd.filter((id) => !drawOrder.includes(id)),
    ];
    state.corp.clicks = 1;
  } else {
    move(campaignId, {
      side: "corp",
      zone: "serverRoot",
      serverId: "remote_1",
    });
    state.cardInstances[campaignId]!.counters = { bit: pool };
    move(agendaId, { side: "corp", zone: "hq" });
    state.corp.clicks = 2;
  }
  return { state, campaignId, agendaId };
}

function reservedScoreProject(
  agendaId: CardInstanceId,
): CorpScoreProjectSignal {
  return {
    projectId: "reserved-score",
    agendaInstanceId: agendaId,
    agendaPoints: 3,
    serverId: "remote_1",
    phase: "install_agenda",
    sameTurnCloseout: false,
    terminalScore: false,
    feasible: false,
    fundingGap: 7,
    evidenceCode: "test_current_protection_funding_gap",
  };
}

afterEach(resetResidentPlanPortfolioMemory);

describe("finite campaign fort reuse", () => {
  it("installs with the last click, takes 3+2 payouts, and installs an agenda in that fort", () => {
    const { state: start, campaignId, agendaId } = fixture();
    expect(getPlayerView(start, "corp").own.corpFutureFlexibleClicks).toEqual([
      3, 3,
    ]);
    expect(
      getPlayerView(start, "runner").own.corpFutureFlexibleClicks,
    ).toBeUndefined();
    let state = start;
    function play(type: LegalAction["type"], source: string, moduleId: string) {
      const { action, trace } = decide(state);
      expect(
        [action.type, action.source],
        JSON.stringify(trace?.selectedPlan),
      ).toEqual([type, source]);
      expect(trace?.selectedPlan?.moduleId).toBe(moduleId);
      state = apply(state, action);
    }

    play("install_card", campaignId, "corp.economy");
    expect(state.corp.servers.at(-1)?.root).toEqual([campaignId]);
    state = nextCorpMain(state);
    play("rez_card", campaignId, "corp.economy");
    for (let count = 0; count < 3; count += 1)
      play("activated_card_ability", campaignId, "corp.economy");
    expect(state.corp.credits).toBe(15);
    expect(state.cardInstances[campaignId]!.counters?.bit).toBe(6);

    state = nextCorpMain(state);
    for (let count = 0; count < 2; count += 1)
      play("activated_card_ability", campaignId, "corp.economy");
    expect([state.corp.credits, state.corp.clicks]).toEqual([21, 1]);
    expect(state.corp.servers.at(-1)?.root).toEqual([]);
    play("install_card", agendaId, "corp.score_agenda");
    expect(state.corp.servers.at(-1)?.root).toEqual([agendaId]);

    const replay = replayEvents(
      start,
      state.eventLog.slice(start.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    if (!replay.ok) throw new Error("Replay rejected.");
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("takes a last one-credit payout when it opens a certified score slot", () => {
    const { state, campaignId, agendaId } = fixture(1);
    state.corp.credits = 20;
    const payout = decide(state);
    expect(payout.action).toMatchObject({
      source: campaignId,
      type: "activated_card_ability",
      payload: { hostedCreditTakeAmount: 1 },
    });
    const after = apply(state, payout.action);
    expect(after.corp.servers.at(-1)?.root).toEqual([]);
    const clearedInput = inputFor(after);
    const laterScore = reservedScoreProject(agendaId);
    expect(corpCampaignSlotJustCleared(clearedInput, "remote_1")).toBe(true);
    expect(corpCampaignSlotJustCleared(clearedInput, "rd")).toBe(false);
    expect(
      corpScoreProjectReservesSlotAfterCampaign(clearedInput, laterScore),
    ).toBe(false);
    expect(
      corpScoreProjectReservesSlotAfterCampaign(clearedInput, {
        ...laterScore,
        feasible: true,
      }),
    ).toBe(true);
    expect(
      corpScoreProjectReservesSlotAfterCampaign(clearedInput, {
        ...laterScore,
        deadlinePressure: true,
      }),
    ).toBe(true);

    const next = decide(after);
    expect(
      next.action,
      JSON.stringify({
        event: after.eventLog.at(-1)?.publicPayload,
        dispositions: next.trace?.dispositions.filter((entry) =>
          entry.actionId.includes(agendaId),
        ),
      }),
    ).toMatchObject({ type: "install_card", source: agendaId });
  });

  it("installs for a same-turn win instead of clearing a productive pool", () => {
    const { state, campaignId, agendaId } = fixture(1);
    state.corp.credits = 20;
    state.corp.clicks = 4;
    state.agendaPointsToWin = 3;
    const { action, trace } = decide(state);
    expect(action).toMatchObject({ type: "install_card", source: agendaId });
    expect(trace?.priority?.effectiveClass).toBe("P1");
    let after = apply(state, action);
    expect(after.corp.archives).toContain(campaignId);
    for (let count = 0; count < 3; count += 1)
      after = perform(after, "advance_card");
    after = perform(after, "score_agenda");
    expect(after.winner).toBe("corp");
  });

  it("admits a temporary campaign only for a reserved score with a covered credit gap", () => {
    const { state, campaignId, agendaId } = fixture();
    state.corp.rd = state.corp.rd.filter((id) => id !== agendaId);
    state.cardInstances[agendaId]!.zone = { side: "corp", zone: "hq" };
    state.corp.hq.push(agendaId);
    const input = inputFor(state);
    const candidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "corp",
      stateVersion: state.stateVersion,
      visibleSourceDefinitionsByInstanceId:
        visibleSourceDefinitionsByInstanceId(input.playerView),
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
    });
    const project = reservedScoreProject(agendaId);
    const action = input.legalActions.find(
      (entry) =>
        entry.type === "install_card" &&
        entry.source === campaignId &&
        entry.payload?.serverId === "remote_1",
    );
    expect(action).toBeDefined();
    const campaignOffered = (score: CorpScoreProjectSignal) =>
      corpEconomyDevelopmentCampaigns(input, candidates, [score]).some(
        (signal) =>
          signal.kind === "develop_campaign" &&
          signal.actionIds.includes(action!.actionId),
      );
    expect(campaignOffered(project)).toBe(true);
    expect(campaignOffered({ ...project, feasible: true })).toBe(false);
    expect(campaignOffered({ ...project, deadlinePressure: true })).toBe(false);
    expect(campaignOffered({ ...project, fundingGap: 12 })).toBe(false);
  });
});
