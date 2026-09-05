import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  hashState,
  quoteCorpRestrictedCreditRoute,
} from "@netgrid/engine";
import {
  DEMO_DECKS,
  type DeckDefinition,
  type GameState,
  type LegalAction,
  type CorpRestrictedCreditRouteRequest,
} from "@netgrid/shared";
import { afterEach, describe, expect, it } from "vitest";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { chooseCorpAction } from "../index";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "./ai-decision-input";
import { buildAiDecisionInputDto } from "../input-dto";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";

const CONTRACT = "onr_proteus_059_government-contract";
const WALL = "onr_v1_279_wall-of-static";
const CAMPAIGN = "onr_v1_337_rockerboy-promotion";
const OPERATION = "onr_v1_302_scorched-earth";
const CORP_DECK: DeckDefinition = {
  ...DEMO_DECKS.demo_corp_001,
  id: "restricted-credit-corp",
  cards: [
    ...DEMO_DECKS.demo_corp_001.cards,
    { id: CONTRACT, quantity: 1 },
    { id: WALL, quantity: 1 },
    { id: CAMPAIGN, quantity: 1 },
    { id: OPERATION, quantity: 1 },
  ],
};

describe("Corp restricted install/rez credit real-Engine capability", () => {
  afterEach(resetResidentPlanPortfolioMemory);

  it("offers the prepared payout in the run rez window and funds the actual ICE rez", () => {
    let state = preparedInstallWindow();
    state.cardInstances[contractId(state)]!.advancementCounters = 2;
    RealEngineFixtureBuilder.forState(state).withCorpIceOnServer("hq", WALL);
    state = apply(
      state,
      getLegalActions(state, "corp").find(
        (action) => action.type === "end_turn",
      )!,
    );
    state = apply(
      state,
      getLegalActions(state, "runner").find(
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "hq",
      )!,
    );
    expect(state.timingPoint).toBe("run.approach_ice");
    const payout = getLegalActions(state, "corp").find(
      (action) =>
        action.source === contractId(state) &&
        action.type === "activated_card_ability",
    );
    expect(payout).toBeDefined();
    const iceId = state.run!.approachedIceId!;
    const before = hashState(state);
    const quote = quoteCorpRestrictedCreditRoute(state, {
      matchId: state.matchId,
      side: "corp",
      stateVersion: state.stateVersion,
      timingPoint: state.timingPoint,
      payoutActionId: payout!.actionId,
      consumer: {
        actionType: "rez_ice",
        sourceCardInstanceId: iceId,
        serverId: "hq",
      },
    });
    expect(quote, JSON.stringify(quote)).toMatchObject({
      status: "quoted",
      quote: {
        consumer: {
          availableBeforePayout: false,
          creditCost: 3,
          restrictedCreditsApplied: 3,
          generalCreditsRequired: 0,
        },
      },
    });
    expect(hashState(state)).toBe(before);
    state = apply(state, payout!);
    const rez = getLegalActions(state, "corp").find(
      (action) => action.type === "rez_ice" && action.source === iceId,
    )!;
    state = apply(state, rez);
    expect(state.cardInstances[iceId]!.rezzed).toBe(true);
    expect(state.corp.credits).toBe(0);
    expect(state.corpTemporaryInstallRezCredits?.remaining ?? 0).toBe(0);
    expect(state.cardInstances[contractId(state)]!.advancementCounters).toBe(1);
    expect(state.timingPoint).toBe("run.encounter_ice");
    expect(
      getLegalActions(state, "corp").some(
        (action) => action.source === contractId(state),
      ),
    ).toBe(false);
  });

  it("does not offer a general-credit operation after the actual restricted payout", () => {
    const state = preparedInstallWindow();
    RealEngineFixtureBuilder.forState(state).withCorpCardInHq(OPERATION);
    state.runner.tags = 1;
    const payout = getLegalActions(state, "corp").find(
      (action) => action.payload?.restrictedCreditGainComplete === true,
    )!;
    const funded = apply(state, payout);
    const offeredOperation = (current: GameState) =>
      getLegalActions(current, "corp").find(
        (action) =>
          action.type === "play_operation" &&
          current.cardInstances[action.source]?.definitionId === OPERATION,
      );
    expect(offeredOperation(funded)).toBeUndefined();
    funded.corp.credits += 3;
    expect(offeredOperation(funded)).toBeDefined();
    expect(funded.corpTemporaryInstallRezCredits?.remaining).toBe(3);
  });

  it("selects a bound payout for an admitted economic consumer", () => {
    const state = preparedEconomyWindow();
    state.cardInstances[contractId(state)]!.advancementCounters = 2;
    const input = decisionInput(state);
    expect(input.corpRestrictedCreditRouteQuotes).toHaveLength(1);
    const decision = chooseCorpAction(input);
    expect(decision.actionId).toBe(
      input.corpRestrictedCreditRouteQuotes![0]!.request.payoutActionId,
    );
    const debug = decision.decisionDebug!.planFirstDecision!;
    expect(debug.selectedPlan?.moduleId).toBe("corp.economy");
    expect(debug.rootPlanInstanceId).not.toBe(debug.leafExecutorInstanceId);
    expect(debug.selectedStep).toMatchObject({
      parentInstanceId: debug.rootPlanInstanceId,
      needId: expect.stringContaining("economy-rez-funding:"),
      supportAssignmentId: expect.any(String),
    });
    expect(debug.route).toMatchObject({
      actionId: decision.actionId,
      semanticActionType: "economy.gain_restricted_credit",
      stateVersion: state.stateVersion,
    });
    const funded = apply(
      state,
      input.legalActions.find(
        (action) => action.actionId === decision.actionId,
      )!,
    );
    const fundedInput = decisionInput(funded);
    expect(
      (fundedInput.corpRestrictedCreditRouteQuotes ?? []).every(
        (quote) => quote.consumer.availableBeforePayout,
      ),
    ).toBe(true);
    expect(
      fundedInput.legalActions.some(
        (action) => action.payload?.restrictedCreditGainComplete === true,
      ),
    ).toBe(true);
    const next = chooseCorpAction(fundedInput);
    expect(next.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
      debug.rootPlanInstanceId,
    );
    expect(next.decisionDebug?.planFirstDecision?.leafExecutorInstanceId).toBe(
      debug.rootPlanInstanceId,
    );
    expect(
      next.decisionDebug?.planFirstDecision?.selectedStep?.needId,
    ).toBeUndefined();
    expect(
      next.decisionDebug?.planFirstDecision?.turnPlanning?.commitment
        ?.continuation,
    ).toMatchObject({
      status: "retained",
      previousOwnerRootPlanInstanceId: debug.rootPlanInstanceId,
      boundaryKind: "plan_internal_continuation",
    });
    const rez = fundedInput.legalActions.find(
      (action) => action.actionId === next.actionId,
    )!;
    expect(rez).toMatchObject({
      type: "rez_card",
      source:
        input.corpRestrictedCreditRouteQuotes![0]!.consumer
          .sourceCardInstanceId,
    });
    const rezzed = apply(funded, rez);
    expect(rezzed.corpTemporaryInstallRezCredits?.remaining ?? 0).toBe(0);
    expect(rezzed.cardInstances[contractId(state)]!.advancementCounters).toBe(
      1,
    );
    // This step's acceptance ends at support hand-back and the actual rez milestone.
    // Finite-bank withdrawal scheduling remains the following lifecycle acceptance.
    const cashout = getLegalActions(rezzed, "corp").find(
      (action) =>
        action.source === rez.source &&
        action.type === "activated_card_ability",
    )!;
    expect(apply(rezzed, cashout).corp.credits).toBe(3);
  });

  it("quotes a currently unaffordable economic root rez with mixed payment", () => {
    const state = preparedEconomyWindow();
    const request = fundingRequest(state);
    request.consumer = {
      actionType: "rez_card",
      sourceCardInstanceId: Object.values(state.cardInstances).find(
        (card) => card.definitionId === CAMPAIGN,
      )!.instanceId,
      serverId: "remote_2",
    };
    expect(quoteCorpRestrictedCreditRoute(state, request)).toMatchObject({
      status: "quoted",
      quote: {
        consumer: {
          availableBeforePayout: false,
          creditCost: 4,
          clickCost: 0,
          restrictedCreditsApplied: 3,
          newlyProvidedCreditsApplied: 3,
          generalCreditsRequired: 1,
        },
        remainingRestrictedCreditsAfterConsumer: 0,
      },
    });
  });

  it("quotes the exact funding prefix without mutating state or inventing a future Action ID", () => {
    const state = preparedInstallWindow();
    const before = hashState(state);
    const request = fundingRequest(state);
    const result = quoteCorpRestrictedCreditRoute(state, request);
    expect(result).toMatchObject({
      status: "quoted",
      quote: {
        payoutCredits: 3,
        payoutClickCost: 0,
        payoutGeneralCreditCost: 0,
        payoutAdvancementCounterCost: 1,
        guarantee: "exact_current_funding_prefix",
        consumer: {
          actionType: "install_card",
          availableBeforePayout: false,
          serverId: "hq",
          clickCost: 1,
          creditCost: 1,
          restrictedCreditsApplied: 1,
          newlyProvidedCreditsApplied: 1,
          generalCreditsRequired: 0,
        },
        remainingRestrictedCreditsAfterConsumer: 2,
        cleanup: "end_of_turn",
      },
    });
    expect(hashState(state)).toBe(before);
    expect(quoteCorpRestrictedCreditRoute(state, request)).toEqual(result);
    if (result.status !== "quoted")
      throw new Error("Expected a complete funding quote");
    expect(result.quote.consumer).not.toHaveProperty("actionId");
    expect(result.quote.request.payoutActionId).toBe(request.payoutActionId);
  });

  it("does not give a free installation, stale request or foreign source a funding claim", () => {
    const state = preparedInstallWindow();
    const request = fundingRequest(state);
    expect(
      quoteCorpRestrictedCreditRoute(state, {
        ...request,
        stateVersion: state.stateVersion - 1,
      }),
    ).toMatchObject({ status: "unavailable", reason: "stale_request" });
    expect(
      quoteCorpRestrictedCreditRoute(state, {
        ...request,
        consumer: { ...request.consumer, serverId: "rd" },
      }),
    ).toMatchObject({
      status: "unavailable",
      reason: "consumer_has_no_restricted_payment",
    });
    expect(
      quoteCorpRestrictedCreditRoute(state, {
        ...request,
        consumer: {
          ...request.consumer,
          sourceCardInstanceId: state.runner.grip[0]!,
        },
      }),
    ).toMatchObject({ status: "unavailable", reason: "consumer_not_owned" });
    expect(
      quoteCorpRestrictedCreditRoute(state, {
        ...request,
        consumer: { ...request.consumer, actionType: "advance_card" as never },
      }),
    ).toMatchObject({
      status: "unavailable",
      reason: "consumer_invocation_not_exact",
    });
  });

  it("does not change funding evidence with opponent hidden-card identities", () => {
    const state = preparedInstallWindow();
    const request = fundingRequest(state);
    const before = quoteCorpRestrictedCreditRoute(state, request);
    const other = structuredClone(state);
    const gripId = other.runner.grip[0]!;
    const stackId = other.runner.stack[0]!;
    other.runner.grip[0] = stackId;
    other.runner.stack[0] = gripId;
    other.cardInstances[gripId]!.zone = { side: "runner", zone: "stack" };
    other.cardInstances[stackId]!.zone = { side: "runner", zone: "grip" };
    expect(quoteCorpRestrictedCreditRoute(other, request)).toEqual(before);
  });

  it("does not spend a second counter when the consumer is already covered by the existing restricted pool", () => {
    const state = preparedInstallWindow();
    state.cardInstances[contractId(state)]!.advancementCounters = 2;
    const payout = getLegalActions(state, "corp").find(
      (action) =>
        action.source === contractId(state) &&
        action.type === "activated_card_ability",
    )!;
    const funded = apply(state, payout);
    expect(
      quoteCorpRestrictedCreditRoute(funded, fundingRequest(funded)),
    ).toMatchObject({
      status: "unavailable",
      reason: "consumer_has_no_restricted_payment",
    });
  });

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

  it("keeps an unsupported consumer locally unknown without executing the payout", () => {
    const input = decisionInput(preparedInstallWindow());
    const decision = chooseCorpAction(input);
    const payout = input.legalActions.find(
      (action) => action.payload?.restrictedCreditGainComplete === true,
    )!;
    expect(decision.actionId).not.toBe(payout.actionId);
    expect(
      decision.decisionDebug?.planFirstDecision?.dispositions,
    ).toContainEqual({
      actionId: payout.actionId,
      disposition: "assessment_unknown",
      ownerModuleId: "corp.economy",
      evidenceCode: "corp_restricted_credit_no_admitted_exact_consumer",
    });
    expect(decision.fallbackUsed).toBe(false);
  });

  it("rejects stale or foreign quote bindings locally and strips noncontract fields", () => {
    const input = decisionInput(preparedEconomyWindow());
    const quote = input.corpRestrictedCreditRouteQuotes![0]!;
    const contaminated = {
      ...quote,
      privatePayload: "forbidden",
      consumer: { ...quote.consumer, actionId: "future-forbidden" },
    };
    const sanitized = buildAiDecisionInputDto({
      ...input,
      corpRestrictedCreditRouteQuotes: [
        { ...quote, request: { ...quote.request, stateVersion: 0 } },
        { ...quote, payoutSourceCardInstanceId: "foreign-source" },
        contaminated,
      ],
    });
    expect(sanitized.corpRestrictedCreditRouteQuotes).toEqual([quote]);
    expect(JSON.stringify(sanitized)).not.toContain("forbidden");
    expect(chooseCorpAction({ ...input, ...sanitized }).actionId).toBe(
      quote.request.payoutActionId,
    );
  });

  it("selects the same exact head for an identical full context and hidden-zone counterprobe", () => {
    const state = preparedEconomyWindow();
    const first = chooseCorpAction(decisionInput(state));
    resetResidentPlanPortfolioMemory();
    const repeated = chooseCorpAction(decisionInput(state));
    expect(repeated.actionId).toBe(first.actionId);
    expect(repeated.decisionDebug?.planFirstDecision?.selectedStep).toEqual(
      first.decisionDebug?.planFirstDecision?.selectedStep,
    );
    resetResidentPlanPortfolioMemory();
    const other = structuredClone(state);
    const a = other.runner.grip[0]!;
    const b = other.runner.stack[0]!;
    other.runner.grip[0] = b;
    other.runner.stack[0] = a;
    other.cardInstances[a]!.zone = { side: "runner", zone: "stack" };
    other.cardInstances[b]!.zone = { side: "runner", zone: "grip" };
    const counterprobe = chooseCorpAction(decisionInput(other));
    expect(counterprobe.actionId).toBe(first.actionId);
    expect(counterprobe.decisionDebug?.planFirstDecision?.selectedStep).toEqual(
      first.decisionDebug?.planFirstDecision?.selectedStep,
    );
  });
});

function hqInstall(state: GameState) {
  return getLegalActions(state, "corp").find(
    (action) =>
      action.type === "install_card" && action.payload?.serverId === "hq",
  );
}

function fundingRequest(state: GameState): CorpRestrictedCreditRouteRequest {
  return {
    matchId: state.matchId,
    side: "corp",
    stateVersion: state.stateVersion,
    timingPoint: state.timingPoint,
    payoutActionId: getLegalActions(state, "corp").find(
      (action) =>
        action.type === "activated_card_ability" &&
        action.source === contractId(state),
    )!.actionId,
    consumer: {
      actionType: "install_card",
      serverId: "hq",
      sourceCardInstanceId: Object.values(state.cardInstances).find(
        (card) => card.definitionId === WALL,
      )!.instanceId,
    },
  };
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

function preparedEconomyWindow(): GameState {
  const state = preparedInstallWindow();
  RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpRemoteRoot("remote_2", CAMPAIGN, 0, {
      faceup: false,
      rezzed: false,
    })
    .withCorpCardInHq("simple_agenda")
    .withCorpCredits(1);
  return state;
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
