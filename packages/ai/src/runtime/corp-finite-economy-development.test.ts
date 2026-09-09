import {
  createGameAfterSetup,
  getLegalActions,
  applyAction,
} from "@netgrid/engine";
import { DEMO_DECKS, type GameState, type LegalAction } from "@netgrid/shared";
import { afterEach, expect, it } from "vitest";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { buildAiDecisionInput } from "./ai-decision-input";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { residentPlanPortfolioSnapshot } from "../plans/resident-plan-portfolio-memory";
const pool = "onr_v1_337_rockerboy-promotion";
const wall = "onr_v1_279_wall-of-static";
const deck = {
  ...DEMO_DECKS.demo_corp_001,
  cards: [
    ...DEMO_DECKS.demo_corp_001.cards,
    { id: pool, quantity: 1 },
    { id: "onr_v1_285_closed-accounts", quantity: 1 },
    { id: wall, quantity: 1 },
    { id: "onr_v1_237_data-wall", quantity: 1 },
    { id: "onr_v1_278_wall-of-ice", quantity: 1 },
  ],
};
afterEach(resetResidentPlanPortfolioMemory);
function apply(state: GameState, action: LegalAction) {
  const result = applyAction(state, {
    matchId: state.matchId,
    side: action.side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `finite:${state.stateVersion}`,
  });
  if (!result.ok) throw Error(result.error.message);
  return result.state;
}
function prepared(protectedRemote: boolean, credits = 8) {
  let state = createGameAfterSetup({
    seed: "finite-economy-investment",
    corpDeck: deck,
    runnerDeck: DEMO_DECKS.demo_runner_001,
  });
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "mandatory_draw")!,
  );
  const setup = RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCardInHq(pool)
    .withCorpCredits(credits);
  setup
    .withRezzedCorpIceOnServer("hq", "onr_v1_237_data-wall")
    .withRezzedCorpIceOnServer("rd", "onr_v1_278_wall-of-ice");
  setup.withCorpCardInHq("onr_v1_285_closed-accounts");
  if (protectedRemote) setup.withRezzedCorpIceOnServer("remote_1", wall);
  return state;
}
function input(state: GameState) {
  return buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: "finite-campaign",
      side: "corp",
      cards: deck.cards.map((c) => ({ cardId: c.id, quantity: c.quantity })),
    },
  });
}
it("develops funded economy before speculative agenda search and takes the actual payouts", () => {
  let state = prepared(true);
  const first = input(state);
  const installationDecision = chooseAiAction(first);
  const portfolio = residentPlanPortfolioSnapshot(first)!;
  const campaign = portfolio.instances.find(
    (p) => p.moduleId === "corp.economy" && p.phase === "install",
  )!;
  expect(campaign).toBeDefined();
  expect(campaign.moduleState).toMatchObject({
    signal: {
      phase: "install",
      payback: { projectedNetCredits: 3 },
      riskAdjustment: { protectionState: "protected_not_contestable" },
    },
  });
  const chosen = first.legalActions.find(
    (a) => a.actionId === installationDecision.actionId,
  )!;
  expect(chosen).toMatchObject({
    type: "install_card",
    payload: { serverId: "remote_1" },
  });
  expect(
    installationDecision.decisionDebug?.planFirstDecision
      ?.leafExecutorInstanceId,
  ).toMatch(/^plan:corp\.economy:/);
  expect(state.cardInstances[chosen.source]!.definitionId).toBe(pool);
  state = apply(state, chosen);
  resetResidentPlanPortfolioMemory();
  const next = input(state);
  const rezDecision = chooseAiAction(next);
  expect(
    residentPlanPortfolioSnapshot(next)!.instances.some(
      (p) => p.moduleId === "corp.economy" && p.phase === "rez",
    ),
  ).toBe(true);
  const rezAction = next.legalActions.find(
    (a) => a.actionId === rezDecision.actionId,
  )!;
  expect(rezAction).toMatchObject({ type: "rez_card", source: chosen.source });
  expect(
    rezDecision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
  ).toMatch(/^plan:corp\.economy:/);
  state = apply(state, rezAction);
  resetResidentPlanPortfolioMemory();
  const payoutInput = input(state);
  const payout = chooseAiAction(payoutInput);
  const payoutAction = payoutInput.legalActions.find(
    (a) => a.actionId === payout.actionId,
  )!;
  expect(payoutAction).toMatchObject({
    type: "activated_card_ability",
    source: chosen.source,
  });
  expect(
    payout.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
  ).toMatch(/^plan:corp\.economy:/);
  expect(payout.decisionDebug?.planFirstDecision?.route).toMatchObject({
    actionId: payoutAction.actionId,
    stateVersion: state.stateVersion,
  });
  expect(
    residentPlanPortfolioSnapshot(payoutInput)!.instances.find(
      (p) =>
        p.instanceId ===
        payout.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
    )?.moduleState,
  ).toMatchObject({
    signal: {
      withdrawalCampaign: {
        remainingPoolCredits: 15,
        projectedNetCredits: 8,
        projectedPayoutExecutions: 4,
      },
    },
  });
  const beforeCredits = state.corp.credits;
  state = apply(state, payoutAction);
  expect(state.corp.credits).toBe(beforeCredits + 3);
});
it.each([
  [false, 8],
  [true, 3],
] as const)(
  "does not spend on an unprofitable or unfunded first installation (%s, %s)",
  (protection, credits) => {
    const current = input(prepared(protection, credits));
    const decision = chooseAiAction(current);
    expect(
      current.legalActions.find((a) => a.actionId === decision.actionId)?.type,
    ).not.toBe("install_card");
    expect(
      residentPlanPortfolioSnapshot(current)!.instances.some(
        (p) => p.moduleId === "corp.economy" && p.phase === "install",
      ),
    ).toBe(false);
  },
);
