import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
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
import standardDeckCatalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { corpRestrictedRezDefenseSignals } from "./corp-restricted-rez-defense";
import { allocateCorpCentralDefenseFromAiFacts } from "./corp-central-defense-facts-adapter";
import { corpRestrictedRezPreparationCandidates } from "./corp-restricted-credit-reserve";

const CONTRACT = "onr_proteus_059_government-contract";
const WALL = "onr_v1_279_wall-of-static";
const CAMPAIGN = "onr_v1_337_rockerboy-promotion";
const OPERATION = "onr_v1_302_scorched-earth";
const ORIGINAL_ENTRY = standardDeckCatalog.decks.find(
  (deck) =>
    deck.standardDeckId ===
    "standard_proteus_corp_hidden_node_control_2026_05_25",
)!;
const ORIGINAL_DECK: DeckDefinition = {
  id: ORIGINAL_ENTRY.standardDeckId,
  name: ORIGINAL_ENTRY.name,
  side: "corp",
  identity: ORIGINAL_ENTRY.identityCardId,
  cards: ORIGINAL_ENTRY.cards.map((card) => ({
    id: card.cardId,
    quantity: card.quantity,
  })),
};
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

  it("does not admit a zero-click terminal funding need without an executable head", () => {
    const state = preparedOriginalTerminalReserve(3, 0);
    const input = decisionInput(state, ORIGINAL_DECK);
    expect(input.legalActions.map((action) => action.type)).toEqual([
      "end_turn",
    ]);
    const decision = chooseCorpAction(input);
    expect(decision.actionId).toBe("corp.end_turn");
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe("corp.complete_turn");
    expect(apply(state, input.legalActions[0]!).activeSide).toBe("runner");
  });

  it("completes a profitable unrezzed bank prefix for the exact Defense consumer", () => {
    let state = preparedOriginalTerminalReserve(3, 1);
    const source = state.cardInstances[contractId(state)]!;
    source.rezzed = false;
    source.faceup = false;
    source.advancementCounters = 1;
    const before = hashState(state);
    const firstInput = decisionInput(state, ORIGINAL_DECK);
    expect(preparationsForOriginal(firstInput)).toMatchObject([
      {
        setupRoute: {
          headKind: "advance_card",
          setupCredits: 3,
          setupClicks: 1,
          targetCounters: 2,
          remainingGeneralCredits: 0,
        },
      },
    ]);
    expect(hashState(state)).toBe(before);
    for (const type of ["advance_card", "rez_card"]) {
      const input = decisionInput(state, ORIGINAL_DECK);
      const decision = chooseCorpAction(input);
      const head = input.legalActions.find(
        (action) => action.actionId === decision.actionId,
      )!;
      expect(
        head,
        JSON.stringify(decision.decisionDebug?.planFirstDecision),
      ).toMatchObject({ type, source: source.instanceId });
      expect(
        decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
      ).toBe("corp.economy");
      expect(
        decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
      ).toContain("corp.defend_servers");
      state = apply(state, head);
    }
    expect(state.corp.credits).toBe(0);
    expect(state.cardInstances[source.instanceId]).toMatchObject({
      rezzed: true,
      advancementCounters: 2,
    });
    expect(
      preparationsForOriginal(decisionInput(state, ORIGINAL_DECK)),
    ).toEqual([]);
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
          action.type === "start_run" && action.payload?.serverId === "rd",
      )!,
    );
    for (const type of [
      "activated_card_ability",
      "activated_card_ability",
      "rez_ice",
    ]) {
      const input = decisionInput(state, ORIGINAL_DECK);
      const decision = chooseCorpAction(input);
      const head = input.legalActions.find(
        (action) => action.actionId === decision.actionId,
      )!;
      expect(
        head.type,
        JSON.stringify(decision.decisionDebug?.planFirstDecision),
      ).toBe(type);
      state = apply(state, head);
    }
    expect(state.cardInstances[source.instanceId]!.advancementCounters).toBe(0);
    expect(state.corp.credits).toBe(0);
  });

  it("rejects an unprofitable initial investment and a stale setup quote", () => {
    const state = preparedOriginalTerminalReserve(5, 3);
    const source = state.cardInstances[contractId(state)]!;
    source.rezzed = false;
    source.faceup = false;
    expect(
      preparationsForOriginal(decisionInput(state, ORIGINAL_DECK)),
    ).toEqual([]);
    source.advancementCounters = 1;
    state.corp.credits = 3;
    const input = decisionInput(state, ORIGINAL_DECK);
    expect(preparationsForOriginal(input)).toHaveLength(1);
    input.playerView.servers.find((server) => server.id === "remote_1")!
      .root[0]!.restrictedCreditBankQuote!.expiresAtStateVersion--;
    expect(preparationsForOriginal(input)).toEqual([]);
  });

  it.each([
    { credits: 4, clicks: 1 },
    { credits: 3, clicks: 2 },
  ])(
    "reloads an exhausted rezzed Contract for a finite terminal rez need and converts it next turn ($credits credits)",
    ({ credits, clicks }) => {
      const state = preparedOriginalTerminalReserve(credits, clicks);
      const input = decisionInput(state, ORIGINAL_DECK);
      expect(input.playerView.opponent.agendaPoints).toBe(6);
      const allocation = allocateCorpCentralDefenseFromAiFacts({ input });
      expect(allocation).toMatchObject({
        status: "known",
        selectedServerId: "rd",
      });
      const choice = chooseCorpAction(input);
      const head = input.legalActions.find(
        (action) => action.actionId === choice.actionId,
      )!;
      expect(
        head,
        JSON.stringify(choice.decisionDebug?.planFirstDecision),
      ).toMatchObject({ type: "advance_card", source: contractId(state) });
      expect(
        choice.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
      ).toBe("corp.economy");
      expect(
        choice.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
      ).toContain("corp.defend_servers");
      let next = apply(state, head);
      expect(next.corp.credits).toBe(credits - 1);
      expect(next.cardInstances[contractId(state)]!.advancementCounters).toBe(
        1,
      );
      if (credits === 3) {
        const followupInput = decisionInput(next, ORIGINAL_DECK);
        const followup = chooseCorpAction(followupInput);
        const followupHead = followupInput.legalActions.find(
          (action) => action.actionId === followup.actionId,
        )!;
        expect(
          followupHead.type,
          JSON.stringify(followup.decisionDebug?.planFirstDecision),
        ).toBe("gain_credit");
        expect(
          followup.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
        ).toBe(choice.decisionDebug?.planFirstDecision?.rootPlanInstanceId);
        next = apply(next, followupHead);
        expect(next.corp.credits).toBe(3);
        expect(next.cardInstances[contractId(state)]!.advancementCounters).toBe(
          1,
        );
      }
      next = apply(
        next,
        getLegalActions(next, "corp").find(
          (action) => action.type === "end_turn",
        )!,
      );
      next = apply(
        next,
        getLegalActions(next, "runner").find(
          (action) =>
            action.type === "start_run" && action.payload?.serverId === "rd",
        )!,
      );
      const fundingInput = decisionInput(next, ORIGINAL_DECK);
      const funding = chooseCorpAction(fundingInput);
      expect(funding.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
        choice.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
      );
      const payout = fundingInput.legalActions.find(
        (action) => action.actionId === funding.actionId,
      )!;
      expect(payout.payload?.restrictedCreditGainComplete).toBe(true);
      next = apply(next, payout);
      const rezInput = decisionInput(next, ORIGINAL_DECK);
      const rez = chooseCorpAction(rezInput);
      const rezHead = rezInput.legalActions.find(
        (action) => action.actionId === rez.actionId,
      )!;
      expect(rezHead.type).toBe("rez_ice");
      next = apply(next, rezHead);
      expect(next.corp.credits).toBe(0);
      expect(next.cardInstances[contractId(state)]!.advancementCounters).toBe(
        0,
      );
    },
  );

  it("stops loading when one stored counter already closes the bound reserve", () => {
    const state = preparedOriginalTerminalReserve(4, 3);
    const input = decisionInput(state, ORIGINAL_DECK);
    const first = chooseCorpAction(input);
    const head = input.legalActions.find(
      (action) => action.actionId === first.actionId,
    )!;
    expect(head).toMatchObject({
      type: "advance_card",
      source: contractId(state),
    });
    const next = apply(state, head);
    const nextInput = decisionInput(next, ORIGINAL_DECK);
    const nextChoice = chooseCorpAction(nextInput);
    const nextHead = nextInput.legalActions.find(
      (action) => action.actionId === nextChoice.actionId,
    )!;
    expect(
      nextHead.type === "advance_card" && nextHead.source === contractId(state),
    ).toBe(false);
    expect(preparationsForOriginal(nextInput)).toEqual([]);
    expect(
      nextChoice.decisionDebug?.planFirstDecision?.selectedStep?.needId ?? "",
    ).not.toContain("defense-reserve:");
  });

  it("requires a finite useful capacity delta, exact source, and enough remaining clicks", () => {
    const state = preparedOriginalTerminalReserve(3, 2);
    const input = decisionInput(state, ORIGINAL_DECK);
    expect(preparationsForOriginal(input)).toMatchObject([
      { capacityGain: 2, remainingGeneralCreditGap: 1 },
    ]);
    expect(preparationsForOriginal(input)).toEqual(
      preparationsForOriginal(input),
    );
    const tooLate = structuredClone(input);
    tooLate.playerView.own.clicks = 1;
    expect(preparationsForOriginal(tooLate)).toEqual([]);
    const stale = structuredClone(input);
    stale.playerView.servers.find((server) => server.id === "remote_1")!
      .root[0]!.restrictedCreditBankQuote!.expiresAtStateVersion--;
    expect(preparationsForOriginal(stale)).toEqual([]);
    const missingHead = structuredClone(input);
    missingHead.legalActions = missingHead.legalActions.filter(
      (action) => action.type !== "advance_card",
    );
    expect(preparationsForOriginal(missingHead)).toEqual([]);
    const noBasicCredit = structuredClone(input);
    noBasicCredit.legalActions = noBasicCredit.legalActions.filter(
      (action) => action.type !== "gain_credit",
    );
    expect(preparationsForOriginal(noBasicCredit)).toEqual([]);
    const alreadyFunded = decisionInput(
      preparedOriginalTerminalReserve(6, 2),
      ORIGINAL_DECK,
    );
    expect(preparationsForOriginal(alreadyFunded)).toEqual([]);
  });

  it("does not replace defense draw with a bank preparation for visibly breakable ICE", () => {
    const state = preparedOriginalTerminalReserve(3, 2);
    RealEngineFixtureBuilder.forState(state)
      .withRunnerProgramInstalled("onr_v1_036_jackhammer")
      .withRunnerCredits(30);
    const input = decisionInput(state, ORIGINAL_DECK);
    const choice = chooseCorpAction(input);
    expect(
      input.legalActions.find((action) => action.actionId === choice.actionId)
        ?.type,
    ).toBe("draw_card");
    expect(
      choice.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe("corp.defend_servers");
  });

  it("reassesses loss of the stored source instead of keeping fictitious rez capacity", () => {
    const state = preparedOriginalTerminalReserve(4, 3);
    const input = decisionInput(state, ORIGINAL_DECK);
    const choice = chooseCorpAction(input);
    const next = apply(
      state,
      input.legalActions.find((action) => action.actionId === choice.actionId)!,
    );
    const source = next.cardInstances[contractId(state)]!;
    // Isolated opponent-removal checkpoint: no claim of a chosen Runner route.
    const remote = next.corp.servers.find(
      (server) => server.id === "remote_1",
    )!;
    remote.root = remote.root.filter((id) => id !== source.instanceId);
    next.corp.archives.push(source.instanceId);
    source.zone = { side: "corp", zone: "archives" };
    source.rezzed = false;
    source.advancementCounters = 0;
    next.stateVersion++;
    const nextInput = decisionInput(next, ORIGINAL_DECK);
    expect(preparationsForOriginal(nextInput)).toEqual([]);
    const followup = chooseCorpAction(nextInput);
    expect(
      nextInput.legalActions.find(
        (action) => action.actionId === followup.actionId,
      )?.source,
    ).not.toBe(source.instanceId);
  });

  it("keeps restricted-bank capacity private, current, source-bound and allowlisted", () => {
    const state = preparedOriginalTerminalReserve(3, 2);
    const input = decisionInput(state, ORIGINAL_DECK);
    const root = input.playerView.servers.find(
      (server) => server.id === "remote_1",
    )!.root[0]!;
    const original = structuredClone(root.restrictedCreditBankQuote!);
    const sanitizedBank = () =>
      buildAiDecisionInputDto(input).playerView.servers.find(
        (server) => server.id === "remote_1",
      )!.root[0]!.restrictedCreditBankQuote;
    Object.assign(root.restrictedCreditBankQuote!, {
      secret: "not-transported",
    });
    expect(sanitizedBank()).toEqual(original);
    for (const invalid of [
      { expiresAtStateVersion: input.playerView.stateVersion - 1 },
      { sourceCardInstanceId: "foreign" },
      { serverId: "rd" },
      { advancementCounters: 1 },
      { payoutGeneralCreditCost: 1 },
      { generalCreditsAvailable: -1 },
    ]) {
      root.restrictedCreditBankQuote = {
        ...original,
        ...invalid,
      } as typeof original;
      expect(sanitizedBank()).toBeUndefined();
    }
    expect(
      getPlayerView(state, "runner")
        .servers.flatMap((server) => server.root)
        .every((card) => !card.restrictedCreditBankQuote),
    ).toBe(true);
  });

  it("projects a rezzed counter bank as stored conditional capacity, not liquid payout", () => {
    const state = preparedInstallWindow();
    state.cardInstances[contractId(state)]!.advancementCounters = 0;
    const bank = decisionInput(state).playerView.servers.find(
      (server) => server.id === "remote_1",
    )!.root[0]!.restrictedCreditBankQuote;
    expect(bank).toMatchObject({
      advancementCounters: 0,
      creditsPerCounter: 3,
      generalCreditsAvailable: 0,
      condition: "source_remains_installed_and_rezzed_at_paid_window",
    });
    expect(
      getLegalActions(state, "corp").some(
        (action) => action.payload?.restrictedCreditGainComplete === true,
      ),
    ).toBe(false);
    state.cardInstances[contractId(state)]!.rezzed = false;
    expect(
      decisionInput(state).playerView.servers.find(
        (server) => server.id === "remote_1",
      )!.root[0]!.restrictedCreditBankQuote,
    ).toMatchObject({ setupRoutes: [] });
  });

  it("funds and hands back Mobile Barricade on the unchanged Hidden Node deck", () => {
    const state = preparedOriginalRun();
    const input = decisionInput(state, ORIGINAL_DECK);
    const funding = input.corpRestrictedCreditRouteQuotes!.find(
      (quote) => quote.consumer.actionType === "rez_ice",
    )!;
    expect(funding.consumer).toMatchObject({
      sourceCardDefinitionId: "onr_proteus_033_mobile-barricade",
      creditCost: 6,
      generalCreditsRequired: 3,
      generalCreditsRemainingAfterConsumer: 0,
    });
    const decision = chooseCorpAction(input);
    expect(decision.actionId).toBe(funding.request.payoutActionId);
    const root = decision.decisionDebug!.planFirstDecision!.rootPlanInstanceId;
    expect(root).toContain("corp.defend_servers");
    expect(
      decision.decisionDebug!.planFirstDecision!.selectedPlan?.moduleId,
    ).toBe("corp.economy");
    const funded = apply(
      state,
      input.legalActions.find(
        (action) => action.actionId === decision.actionId,
      )!,
    );
    const nextInput = decisionInput(funded, ORIGINAL_DECK);
    const next = chooseCorpAction(nextInput);
    expect(next.decisionDebug!.planFirstDecision!.rootPlanInstanceId).toBe(
      root,
    );
    expect(next.decisionDebug!.planFirstDecision!.leafExecutorInstanceId).toBe(
      root,
    );
    expect(
      next.decisionDebug!.planFirstDecision!.selectedStep?.needId,
    ).toBeUndefined();
    const rez = nextInput.legalActions.find(
      (action) => action.actionId === next.actionId,
    )!;
    expect(rez.type).toBe("rez_ice");
    expect(rez.source).toBe(funding.consumer.sourceCardInstanceId);
    expect(apply(funded, rez).cardInstances[rez.source]!.rezzed).toBe(true);
    resetResidentPlanPortfolioMemory();
    expect(chooseCorpAction(decisionInput(state, ORIGINAL_DECK)).actionId).toBe(
      decision.actionId,
    );
  });

  it("keeps unknown access evidence local and does not execute unproven restricted defense funding", () => {
    const input = decisionInput(preparedOriginalRun(), ORIGINAL_DECK);
    for (const quote of input.corpRestrictedCreditRouteQuotes ?? [])
      delete quote.consumer.currentRunAccessBlock;
    const decision = chooseCorpAction(input);
    expect(
      input.legalActions.find((action) => action.actionId === decision.actionId)
        ?.type,
    ).toBe("decline_rez");
  });

  it("does not treat an affordable visible break route as an access block", () => {
    const state = preparedOriginalRun();
    RealEngineFixtureBuilder.forState(state)
      .withRunnerProgramInstalled("onr_v1_036_jackhammer")
      .withRunnerCredits(30);
    const input = decisionInput(state, ORIGINAL_DECK);
    expect(input.corpRestrictedCreditRouteQuotes).toHaveLength(1);
    expect(
      input.corpRestrictedCreditRouteQuotes![0]!.consumer.currentRunAccessBlock,
    ).toBeUndefined();
    expect(corpRestrictedRezDefenseSignals(input, [])).toEqual([]);
  });

  it("preserves a separate score reserve and ignores hidden opponent zone permutations", () => {
    const state = preparedOriginalRun();
    const input = decisionInput(state, ORIGINAL_DECK);
    expect(corpRestrictedRezDefenseSignals(input, [])).toHaveLength(1);
    expect(
      corpRestrictedRezDefenseSignals(input, [
        {
          projectId: "agenda:reserve",
          agendaPoints: 2,
          serverId: "remote_2",
          phase: "advance_agenda",
          sameTurnCloseout: false,
          terminalScore: false,
          feasible: true,
          evidenceCode: "test",
          continuationReserve: {
            agendaCardId: "reserve",
            serverId: "remote_2",
            requiredCreditsBeforeNextCorpTurn: 1,
            remainingAdvancementCounters: 1,
            nextCorpTurnGuaranteedFlexibleClicks: 3,
            certifiedCreditGainFromFreeClicks: 2,
          },
        },
      ]),
    ).toEqual([]);
    const decision = chooseCorpAction(input);
    resetResidentPlanPortfolioMemory();
    const other = structuredClone(state);
    const a = other.runner.grip[0]!;
    const b = other.runner.stack[0]!;
    other.runner.grip[0] = b;
    other.runner.stack[0] = a;
    other.cardInstances[a]!.zone = { side: "runner", zone: "stack" };
    other.cardInstances[b]!.zone = { side: "runner", zone: "grip" };
    const counterInput = decisionInput(other, ORIGINAL_DECK);
    expect(counterInput.corpRestrictedCreditRouteQuotes).toEqual(
      input.corpRestrictedCreditRouteQuotes,
    );
    expect(chooseCorpAction(counterInput).actionId).toBe(decision.actionId);
  });

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
    const fundingDecision = chooseCorpAction(decisionInput(state));
    expect(fundingDecision.actionId).toBe(payout!.actionId);
    expect(
      fundingDecision.decisionDebug?.planFirstDecision?.selectedStep,
    ).toMatchObject({
      parentInstanceId:
        fundingDecision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
      needId: expect.stringContaining("restricted-rez:"),
      supportAssignmentId: expect.any(String),
    });
    state = apply(state, payout!);
    const rez = getLegalActions(state, "corp").find(
      (action) => action.type === "rez_ice" && action.source === iceId,
    )!;
    const rezDecision = chooseCorpAction(decisionInput(state));
    expect(rezDecision.actionId).toBe(rez.actionId);
    expect(
      rezDecision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
    ).toBe(
      fundingDecision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
    );
    expect(
      rezDecision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe("corp.defend_servers");
    expect(
      rezDecision.decisionDebug?.planFirstDecision?.selectedStep?.needId,
    ).toBeUndefined();
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

  it("selects a bound payout and permits a higher-priority interruption after the economic rez", () => {
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
    const cashoutInput = decisionInput(rezzed);
    const cashoutDecision = chooseCorpAction(cashoutInput);
    const cashout = cashoutInput.legalActions.find(
      (action) => action.actionId === cashoutDecision.actionId,
    )!;
    // Higher-priority score protection can interrupt the economy lifecycle;
    // accepting the economic rez does not authorize overriding that need.
    expect(cashout.type).toBe("draw_card");
    expect(
      cashoutDecision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
    ).toContain("corp.score_agenda");
    const availablePayout = cashoutInput.legalActions.find(
      (action) =>
        action.source === rez.source &&
        action.type === "activated_card_ability",
    )!;
    expect(apply(rezzed, availablePayout).corp.credits).toBe(3);
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

function decisionInput(state: GameState, deck: DeckDefinition = CORP_DECK) {
  return buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: `restricted-credit:${deck.id}`,
      side: "corp",
      cards: deck.cards.map((card) => ({
        cardId: card.id,
        quantity: card.quantity,
      })),
    },
  });
}

function preparedOriginalCorp(): GameState {
  let state = createGameAfterSetup({
    seed: "hidden-node-prepared-defense",
    corpDeck: ORIGINAL_DECK,
    runnerDeck: {
      ...DEMO_DECKS.demo_runner_001,
      cards: [
        ...DEMO_DECKS.demo_runner_001.cards,
        { id: "onr_v1_036_jackhammer", quantity: 1 },
      ],
    },
  });
  state = apply(
    state,
    getLegalActions(state, "corp").find(
      (action) => action.type === "mandatory_draw",
    )!,
  );
  RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpRemoteRoot("remote_1", CONTRACT, 2, { faceup: true, rezzed: true })
    .withCorpIceOnServer("hq", "onr_proteus_033_mobile-barricade")
    .withCorpCredits(3)
    .withRunnerCredits(0);
  return state;
}

function preparedOriginalTerminalReserve(
  credits: number,
  clicks: number,
): GameState {
  const state = preparedOriginalCorp();
  RealEngineFixtureBuilder.forState(state)
    .withCorpIceOnServer("rd", "onr_proteus_033_mobile-barricade")
    .withCorpCardInHq("onr_v1_281_accounts-receivable")
    .withCorpCredits(credits);
  state.cardInstances[contractId(state)]!.advancementCounters = 0;
  state.corp.clicks = clicks;
  const stolen = state.corp.rd.filter(
    (id) =>
      state.cardInstances[id]!.definitionId === "onr_proteus_004_fetal-ai",
  );
  expect(stolen).toHaveLength(2);
  state.corp.rd = state.corp.rd.filter((id) => !stolen.includes(id));
  for (const id of stolen) {
    state.runner.scoreArea.push(id);
    state.cardInstances[id] = {
      ...state.cardInstances[id]!,
      controller: "runner",
      faceup: true,
      rezzed: true,
      zone: { side: "runner", zone: "scoreArea" },
    };
  }
  return state;
}

function preparationsForOriginal(input: ReturnType<typeof decisionInput>) {
  return corpRestrictedRezPreparationCandidates(
    input,
    buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "corp",
    }),
    {
      targetIceInstanceId: input.playerView.servers.find(
        (server) => server.id === "rd",
      )!.ice[0]!.instanceId,
      targetServerId: "rd",
      requiredRezCredits: 6,
    },
  );
}

function preparedOriginalRun(): GameState {
  let state = preparedOriginalCorp();
  state = apply(
    state,
    getLegalActions(state, "corp").find(
      (action) => action.type === "end_turn",
    )!,
  );
  return apply(
    state,
    getLegalActions(state, "runner").find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    )!,
  );
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
