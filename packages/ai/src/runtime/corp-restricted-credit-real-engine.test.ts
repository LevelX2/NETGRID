import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import {
  DEMO_DECKS,
  type DeckDefinition,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import { afterEach, describe, expect, it } from "vitest";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { chooseCorpAction } from "../index";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "./ai-decision-input";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";

const CONTRACT = "onr_proteus_059_government-contract";
const WALL = "onr_v1_279_wall-of-static";
const CORP_DECK: DeckDefinition = {
  ...DEMO_DECKS.demo_corp_001,
  id: "restricted-credit-corp",
  cards: [
    ...DEMO_DECKS.demo_corp_001.cards,
    { id: CONTRACT, quantity: 1 },
    { id: WALL, quantity: 1 },
  ],
};

describe("Corp restricted install/rez credit real-Engine capability", () => {
  afterEach(resetResidentPlanPortfolioMemory);

  it("proves a prepared payout can fund an otherwise unavailable current installation", () => {
    const state = preparedInstallWindow();
    const input = decisionInput(state);
    const payout = input.legalActions.find(
      (action) =>
        action.source === contractId(state) &&
        action.type === "activated_card_ability",
    );
    expect(payout).toBeDefined();
    const projection = buildActionSemanticCandidates({
      legalActions: [payout!],
      observerSide: "corp",
    })[0]?.economyProjection;
    expect(projection).toMatchObject({
      kind: "restricted_credit",
      creditRestriction: "restricted",
      reliability: "guaranteed",
      restrictedCreditPayout: {
        amount: 3,
        usableFor: "corp_install_or_rez",
        cleanup: "end_of_turn",
        sourceAdvancementCounterCost: 1,
      },
    });
    expect(projection?.netLiquidCreditGain).toBeUndefined();
    expect(hqInstall(state)).toBeUndefined();
    const funded = apply(state, payout!);
    expect(funded.corpTemporaryInstallRezCredits?.remaining).toBe(3);
    const install = hqInstall(funded);
    expect(install?.costs).toEqual([{ clicks: 1, credits: 1 }]);
    const installed = apply(funded, install!);
    expect(installed.corpTemporaryInstallRezCredits?.remaining).toBe(2);
    expect(installed.cardInstances[install!.source]?.zone).toMatchObject({
      zone: "serverIce",
      serverId: "hq",
    });
    const ended = apply(
      installed,
      getLegalActions(installed, "corp").find(
        (action) => action.type === "end_turn",
      )!,
    );
    expect(ended.corp.credits).toBe(0);
    expect(ended.corpTemporaryInstallRezCredits?.remaining ?? 0).toBe(0);
  });

  it("does not turn the payout into general advancement credits or a second counter payout", () => {
    const state = preparedInstallWindow();
    const funded = apply(
      state,
      getLegalActions(state, "corp").find(
        (action) =>
          action.type === "activated_card_ability" &&
          action.source === contractId(state),
      )!,
    );
    expect(funded.cardInstances[contractId(state)]?.advancementCounters).toBe(
      0,
    );
    expect(
      getLegalActions(funded, "corp").some(
        (action) => action.type === "advance_card",
      ),
    ).toBe(false);
    expect(
      getLegalActions(funded, "corp").some(
        (action) =>
          action.type === "activated_card_ability" &&
          action.source === contractId(state),
      ),
    ).toBe(false);
  });

  it("characterizes the first productive-chooser loss as missing payout ownership", () => {
    const input = decisionInput(preparedInstallWindow());
    try {
      chooseCorpAction(input);
      expect.fail(
        "HN-F baseline must expose the unowned restricted-credit payout",
      );
    } catch (error) {
      expect(error).toBeInstanceOf(PlanResolutionFailure);
      expect(error).toMatchObject({
        code: "missing_plan_module_coverage",
        context: { owner: "plan_registry" },
      });
      expect(
        (error as PlanResolutionFailure).context.removalCondition,
      ).toContain(
        "productive_action_without_owner:corp.activated_card_ability",
      );
    }
  });
});

function hqInstall(state: GameState) {
  return getLegalActions(state, "corp").find(
    (action) =>
      action.type === "install_card" && action.payload?.serverId === "hq",
  );
}

function preparedInstallWindow(): GameState {
  let state = createGameAfterSetup({
    seed: "restricted-credit-rez",
    corpDeck: CORP_DECK,
  });
  state = apply(
    state,
    getLegalActions(state, "corp").find(
      (action) => action.type === "mandatory_draw",
    )!,
  );
  RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpRemoteRoot("remote_1", CONTRACT, 1, { faceup: true, rezzed: true })
    .withCorpIceOnServer("hq", "simple_barrier_ice")
    .withCorpCardInHq(WALL)
    .withCorpCredits(0)
    .withRunnerCredits(0);
  return state;
}

function contractId(state: GameState) {
  return Object.values(state.cardInstances).find(
    (card) => card.definitionId === CONTRACT,
  )!.instanceId;
}

function decisionInput(state: GameState) {
  return buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: "restricted-credit-corp-snapshot",
      side: "corp",
      cards: CORP_DECK.cards.map((card) => ({
        cardId: card.id,
        quantity: card.quantity,
      })),
    },
  });
}

function apply(state: GameState, action: LegalAction) {
  if (!action)
    throw new Error(`Missing fixture action at ${state.timingPoint}`);
  const result = applyAction(state, {
    matchId: state.matchId,
    side: action.side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `restricted-credit:${state.stateVersion}`,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}
