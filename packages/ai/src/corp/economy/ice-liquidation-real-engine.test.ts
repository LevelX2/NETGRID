import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import { DEMO_DECKS, type GameState, type LegalAction } from "@netgrid/shared";
import { expect, it } from "vitest";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { buildAiDecisionInputDto } from "../../input-dto";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { assessCorpIceLiquidation } from "../defense/corp-ice-liquidation";
import { assessCorpEconomyFundingRoute } from "./economy-routes";

const SYD = "onr_proteus_076_syd-meyer-superstores";
const WALL = "onr_v1_279_wall-of-static";
const deck = {
  ...DEMO_DECKS.demo_corp_001,
  id: "ice-liquidation-corp",
  cards: [
    ...DEMO_DECKS.demo_corp_001.cards,
    { id: SYD, quantity: 1 },
    { id: WALL, quantity: 2 },
  ],
};
function fixture() {
  let state = createGameAfterSetup({
    seed: "e553-liquidation",
    corpDeck: deck,
    runnerDeck: DEMO_DECKS.demo_runner_001,
  });
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "mandatory_draw")!,
  );
  for (const id of state.corp.hq) {
    state.cardInstances[id]!.zone = { side: "corp", zone: "rd" };
    state.corp.rd.push(id);
  }
  state.corp.hq = [];
  const walls = Object.values(state.cardInstances)
    .filter((c) => c.definitionId === WALL)
    .slice(0, 2);
  const syd = Object.values(state.cardInstances).find(
    (c) => c.definitionId === SYD,
  )!;
  state.corp.servers.push({
    id: "remote_1",
    kind: "remote",
    label: "Remote 1",
    ice: walls.map((c) => c.instanceId),
    root: [syd.instanceId],
  });
  for (const c of [...walls, syd]) {
    state.corp.hq = state.corp.hq.filter((id) => id !== c.instanceId);
    state.corp.rd = state.corp.rd.filter((id) => id !== c.instanceId);
    c.zone = {
      side: "corp",
      zone: c === syd ? "serverRoot" : "serverIce",
      serverId: "remote_1",
    };
    c.rezzed = true;
    c.faceup = true;
  }
  state.corp.credits = 0;
  return state;
}
function inputFor(state: GameState) {
  return buildAiDecisionInput(state, "corp", {
    decisionId: `sale:${state.stateVersion}`,
    profileId: "ice-liquidation",
    ownDeckSnapshot: {
      deckSnapshotId: deck.id,
      side: "corp",
      cards: deck.cards.map((c) => ({ cardId: c.id, quantity: c.quantity })),
    },
  });
}
function apply(state: GameState, action: LegalAction) {
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `${state.stateVersion}:${action.actionId}`,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}
function route(state: GameState, gap: number, bound = true) {
  const input = inputFor(state);
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "corp",
    stateVersion: state.stateVersion,
  });
  return assessCorpEconomyFundingRoute(
    { input, actionCandidates: candidates, turnKey: "corp:1" },
    {
      kind: "parent_funding",
      needId: "fund-exact-score",
      ...(bound
        ? { parentPlanInstanceId: "plan:corp.score_agenda:exact" }
        : {}),
      parentNeedId: "score-credit-gap",
      gap,
      actionIds: candidates.map((c) => c.actionId),
      urgentForScore: false,
      evidenceCode: "test_bound_funding",
    },
  );
}
it("funds an exact need from one redundant static layer and revalidates the real post-sale board", () => {
  const state = fixture();
  const input = inputFor(state);
  expect(input.playerView.runnerNextTurnCreditClicks).toBe(3);
  const sales = input.legalActions.filter(
    (a) => a.payload?.gainedCredits === 4,
  );
  expect(sales).toHaveLength(2);
  expect(sales.map((a) => assessCorpIceLiquidation(input, a))).toEqual([
    expect.objectContaining({ status: "preserved" }),
    expect.objectContaining({ status: "preserved" }),
  ]);
  const funding = route(state, 4);
  expect(sales.map((a) => a.actionId)).toContain(funding.headActionId);
  const after = apply(
    state,
    sales.find((a) => a.actionId === funding.headActionId)!,
  );
  expect(after.corp.credits).toBe(4);
  expect(after.corp.servers.find((s) => s.id === "remote_1")!.ice).toHaveLength(
    1,
  );
  const post = inputFor(after);
  const lastSale = post.legalActions.find(
    (a) => a.payload?.gainedCredits === 4,
  )!;
  expect(assessCorpIceLiquidation(post, lastSale)).toMatchObject({
    status: "blocked",
    reason: "last_defense_layer",
  });
  expect(route(state, 8)).toMatchObject({ status: "uncovered" });
  expect(route(state, 4, false).headActionId).toBeUndefined();
});
it("does not certify stale actions or missing post-removal protection facts", () => {
  const input = inputFor(fixture());
  const sale = input.legalActions.find((a) => a.payload?.gainedCredits === 4)!;
  expect(
    assessCorpIceLiquidation(input, {
      ...sale,
      expiresAtStateVersion: input.playerView.stateVersion - 1,
    }).status,
  ).toBe("unknown");
  const remote = input.playerView.servers.find((s) => s.id === "remote_1")!;
  delete remote.ice[0]!.effectiveRunQuote;
  expect(assessCorpIceLiquidation(input, sale).status).toBe("unknown");
});

it("preserves the Engine income forecast through the side-safe input and rejects malformed values", () => {
  const input = inputFor(fixture());
  input.playerView.runnerNextTurnCreditClicks = -1;
  expect(() => buildAiDecisionInputDto(input)).toThrow(
    "Invalid Engine Runner next-turn credit-click forecast",
  );
});
