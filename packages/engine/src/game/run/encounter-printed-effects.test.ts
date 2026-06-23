import {
  type CardDefinition,
  type CardInstance,
  type CardInstanceId,
  type ChoiceRequest,
  type CounterType,
  type GameState,
  type ImminentEvent,
  type LegalAction,
  type SubroutineDefinition,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  applyPrintedTraceSuccessFollowups,
  encounterPrintedEffectHost,
  resolvePrintedDamageSubroutine,
  startTraceFromPrintedSubroutine,
  type EncounterPrintedEffectHost,
} from "./encounter-printed-effects";
import type { DamageSummary } from "./encounter-resolution";

function instance(
  id: string,
  definitionId: string,
  zone: CardInstance["zone"],
  options: Partial<CardInstance> = {},
): CardInstance {
  return {
    id: id as CardInstanceId,
    definitionId,
    owner: zone.side,
    controller: zone.side,
    zone,
    faceup: options.faceup ?? true,
    rezzed: options.rezzed ?? true,
    counters: options.counters,
    ...options,
  } as CardInstance;
}

function makeState(): GameState {
  return {
    stateVersion: 9,
    activeSide: "runner",
    phase: "run",
    timingPoint: "run.encounter_ice",
    runner: {
      credits: 5,
      tags: 0,
      identity: "runner_identity" as CardInstanceId,
      grip: ["grip_1" as CardInstanceId, "grip_2" as CardInstanceId],
      heap: [],
      rig: {
        programs: [],
        hardware: [],
        resources: [],
      },
      scoreArea: [],
      coreDamage: 0,
    },
    corp: {
      credits: 4,
      hq: [],
      rd: [],
      archives: [],
      servers: [
        {
          id: "rd",
          kind: "rd",
          ice: ["ice_1" as CardInstanceId],
          root: [],
        },
        { id: "hq", kind: "hq", ice: [], root: [] },
        { id: "archives", kind: "archives", ice: [], root: [] },
      ],
    },
    cardInstances: {
      runner_identity: instance("runner_identity", "runner_identity", {
        side: "runner",
        zone: "rig",
      }),
      ice_1: instance("ice_1", "onr_v1_001_test-ice", {
        side: "corp",
        zone: "serverIce",
        serverId: "rd",
      }),
      grip_1: instance("grip_1", "grip_card_1", {
        side: "runner",
        zone: "grip",
      }),
      grip_2: instance("grip_2", "grip_card_2", {
        side: "runner",
        zone: "grip",
      }),
    },
    run: {
      runId: "run_1",
      attackedServerId: "rd",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "rd", iceIndex: 0 },
      encounteredIceId: "ice_1" as CardInstanceId,
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
    },
  } as unknown as GameState;
}

function definitionFor(cardId: CardInstanceId): CardDefinition {
  const definitions: Record<string, CardDefinition> = {
    ice_1: {
      id: "onr_v1_001_test-ice",
      title: "Test ICE",
      type: "ice",
      subtypes: ["ap"],
    } as CardDefinition,
    runner_identity: {
      id: "runner_identity",
      title: "Runner Identity",
      type: "identity",
      baseLink: 0,
    } as CardDefinition,
  };
  return definitions[cardId] ?? ({
    id: String(cardId),
    title: String(cardId),
    type: "program",
  } as CardDefinition);
}

function makeHost(
  state: GameState,
  legalAction?: LegalAction,
  overrides: Partial<EncounterPrintedEffectHost["callbacks"]> = {},
): EncounterPrintedEffectHost {
  const callbacks: EncounterPrintedEffectHost["callbacks"] = {
    addCardCounter: (cardId, counterType, amount) => {
      const card = state.cardInstances[cardId]!;
      card.counters = {
        ...(card.counters ?? {}),
        [counterType]: (card.counters?.[counterType] ?? 0) + amount,
      };
    },
    addCorpTraceCounterPoolCounters: () => 0,
    calculateRunnerLink: () => 0,
    cardCounter: (cardId, counterType) =>
      state.cardInstances[cardId]?.counters?.[counterType] ?? 0,
    createDamageImminentEvent: (request) =>
      ({
        eventId: `imminent_damage_${request.damageId}`,
        eventType: "damage",
        source: { kind: "game_rule" },
        controller: "corp",
        affectedSide: "runner",
        payload: request,
        visibility: "hidden_info_barrier",
        createdAtStateVersion: state.stateVersion + 1,
      }) as ImminentEvent,
    definitionFor,
    ensureRunnerTurnFlags: () =>
      (state.runnerTurnFlags ??= {
        stoleAgendaThisTurn: false,
        stoleAgendaLastTurn: false,
        stolenAgendaAdvancementCountersThisTurn: 0,
        stolenAgendaAdvancementCountersLastTurn: 0,
        runnerReceivedTagThisTurn: false,
        stoleResearchAgendaThisTurn: false,
        stoleGrayOpsAgendaThisTurn: false,
        stoleBlackOpsAgendaThisTurn: false,
        runAttemptsThisTurn: 0,
        runAttemptsLastTurn: 0,
        successfulHqRunThisTurn: false,
        successfulRunThisTurn: false,
        damagePreventionUsage: {},
        runnerActionsTakenThisTurn: 0,
        abilityUsedSourceIdsByLimitKey: {},
        startOfTurnFloatingCreditsApplied: false,
        bonusRunPending: false,
        forgoNextActionPending: false,
        forgoNextActionsPending: 0,
        runLockActionsPending: 0,
        runnerRunLockCreditCost: 0,
        valuPakProgramInstallActionsRemaining: 0,
        valuPakTemporaryProgramInstallCredits: 0,
      }),
    finishRun: (successful) => {
      legalAction?.payload && (legalAction.payload.finishedRun = successful);
      delete state.run;
    },
    hasInstalledMicrotechTrodeSet: () => false,
    corpTraceCounterPoolTotal: () => 0,
    recurringTraceCreditPoolTotal: () => 0,
    openDamageResolutionWindow: () => false,
    openEventModificationWindow: () => false,
    openReplacementWindow: () => false,
    fortTraceBitPoolSource: () => undefined,
    rabbitTraceLimitReductionForIceTrace: () => 0,
    resolveDamageImminentEvent: (event) =>
      ({
        damageType: event.payload.damageType,
        amount: event.payload.amount,
        cardsTrashed: event.payload.amount,
        flatline: false,
        runnerGripBefore: 4,
        runnerGripAfter: 2,
      }) as DamageSummary,
    resolveTraceHardwareWreckerSuccess: () => ({}),
    resolveTraceTrashRunnerResourceSuccess: () => ({}),
    resolveTrashInstalledProgramSubroutine: () => undefined,
    setDamagePayload: (summary) => {
      if (!legalAction) return;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        damageResolved: true,
        damageType: summary.damageType,
        damageAmount: summary.amount,
        cardsTrashed: summary.cardsTrashed,
        flatline: summary.flatline,
        ...(summary.runnerGripBefore !== undefined
          ? { runnerGripBefore: summary.runnerGripBefore }
          : {}),
        ...(summary.runnerGripAfter !== undefined
          ? { runnerGripAfter: summary.runnerGripAfter }
          : {}),
      };
    },
    supportsTraceSuccessEffect: () => true,
    traceBidChoice: (side, traceId, prompt, maxBid) =>
      ({
        choiceId: `${traceId}.${side}.bid.10`,
        side,
        source: `trace:${traceId}`,
        prompt,
        kind: "bid_amount",
        options: Array.from({ length: maxBid + 1 }, (_, amount) => ({
          id: `bid_${amount}`,
          label: `${amount} Credits`,
          value: amount,
        })),
        minSelections: 1,
        maxSelections: 1,
        stateVersion: 10,
        visibility: "public",
      }) as ChoiceRequest,
    ...overrides,
  };
  return encounterPrintedEffectHost(state, callbacks);
}

describe("encounter printed effects boundary", () => {
  it("delegates printed Net damage through the damage callback and preserves payload shape", () => {
    const state = makeState();
    const legalAction = { payload: {} } as LegalAction;
    const summaries: DamageSummary[] = [];

    const result = resolvePrintedDamageSubroutine(makeHost(state, legalAction), {
      definition: definitionFor("ice_1" as CardInstanceId),
      subroutine: {
        id: "net_damage",
        type: "do_damage",
        damageType: "net",
        amount: 2,
      } as SubroutineDefinition,
      subroutineIndex: 0,
      damageSummaries: summaries,
      legalAction,
    });

    expect(result).toMatchObject({
      handled: true,
      damageType: "net",
      damageAmount: 2,
    });
    expect(summaries).toHaveLength(1);
    expect(legalAction.payload).toMatchObject({
      damageResolved: true,
      damageType: "net",
      damageAmount: 2,
      cardsTrashed: 2,
      flatline: false,
      runnerGripBefore: 4,
      runnerGripAfter: 2,
    });
    expect(legalAction.resolvedEffects).toEqual([
      expect.objectContaining({
        kind: "resolve_subroutine",
        sourceDefinitionId: "onr_v1_001_test-ice",
        subroutineType: "do_damage",
        amount: 2,
      }),
    ]);
  });

  it("opens prevention/replacement windows without resolving printed core damage", () => {
    const state = makeState();
    const legalAction = { payload: {} } as LegalAction;
    const result = resolvePrintedDamageSubroutine(
      makeHost(state, legalAction, {
        openDamageResolutionWindow: () => true,
      }),
      {
        definition: definitionFor("ice_1" as CardInstanceId),
        subroutine: {
          id: "core_damage",
          type: "do_damage",
          damageType: "core",
          amount: 1,
        } as SubroutineDefinition,
        subroutineIndex: 1,
        damageSummaries: [],
        legalAction,
      },
    );

    expect(result).toMatchObject({
      handled: true,
      suspended: true,
      damageType: "core",
      damageAmount: 1,
    });
    expect(state.run?.resolvedSubroutineIndexes).toEqual([1]);
    expect(legalAction.payload).toEqual({});
  });

  it("starts printed Trace with stable trace id, source metadata, bid choice, and credit pools", () => {
    const state = makeState();
    state.run!.encounterTemporaryTraceCredits = {
      sourceIceId: "ice_1" as CardInstanceId,
      sourceDefinitionId: "onr_v1_001_test-ice" as never,
      remaining: 2,
      usableFor: "this_ice_printed_trace_subroutines",
    };
    const legalAction = { payload: {} } as LegalAction;

    const result = startTraceFromPrintedSubroutine(
      makeHost(state, legalAction, {
        corpTraceCounterPoolTotal: () => 1,
        recurringTraceCreditPoolTotal: () => 1,
        rabbitTraceLimitReductionForIceTrace: () => 2,
      }),
      {
        sourceCardInstanceId: "ice_1" as CardInstanceId,
        subroutineIndex: 2,
        subroutine: {
          id: "trace_tag",
          type: "initiate_trace",
          baseTraceStrength: 4,
          traceSuccessEffect: { type: "add_tag", amount: 1 },
        } as SubroutineDefinition,
        legalAction,
      },
    );

    expect(result).toMatchObject({
      handled: true,
      suspended: true,
      traceId: "run_1.ice_1.2.trace",
      baseTraceStrength: 4,
      corpBidMax: 6,
    });
    expect(state.trace).toMatchObject({
      traceId: "run_1.ice_1.2.trace",
      sourceCardInstanceId: "ice_1",
      sourceDefinitionId: "onr_v1_001_test-ice",
      subroutineIndex: 2,
      baseTraceStrength: 4,
      corpBidMax: 6,
      rabbitTraceLimitReduction: 2,
      encounterTemporaryTraceCreditSourceIceId: "ice_1",
      encounterTemporaryTraceCreditSourceDefinitionId: "onr_v1_001_test-ice",
      status: "corp_bid",
    });
    expect(state.pendingChoice).toMatchObject({
      choiceId: "run_1.ice_1.2.trace.corp.bid.10",
      source: "trace:run_1.ice_1.2.trace",
      kind: "bid_amount",
      visibility: "public",
    });
    expect(legalAction.payload).toMatchObject({
      traceStarted: true,
      traceId: "run_1.ice_1.2.trace",
      sourceCardId: "ice_1",
      sourceDefinitionId: "onr_v1_001_test-ice",
      baseTraceStrength: 4,
      corpBidMax: 6,
      rabbitTraceLimitReduction: 2,
      temporaryTraceCreditsAvailable: 2,
    });
  });

  it("applies printed Trace-success tag and counter followups without changing trace identifiers", () => {
    const state = makeState();
    state.trace = {
      traceId: "run_1.ice_1.0.trace",
      sourceCardInstanceId: "ice_1" as CardInstanceId,
      sourceDefinitionId: "onr_v1_001_test-ice" as never,
      subroutineIndex: 0,
      baseTraceStrength: 3,
      corpBid: 1,
      runnerBid: 0,
      status: "runner_bid",
      successEffect: {
        type: "add_tag_and_counter",
        tagAmount: 1,
        counterType: "trace_tag_counter",
        amount: 1,
      },
    };
    state.pendingChoice = { choiceId: "trace_choice" } as ChoiceRequest;
    const legalAction = { payload: {} } as LegalAction;

    const result = applyPrintedTraceSuccessFollowups(
      makeHost(state, legalAction, {
        addCorpTraceCounterPoolCounters: () => 1,
      }),
      {
        trace: state.trace,
        traceStep: "runner_bid",
        legalAction,
        runnerLinkFallback: 0,
        extraPayload: { runnerTraceCreditsSpent: 0 },
        deletePendingChoice: true,
      },
    );

    expect(result).toMatchObject({
      handled: true,
      traceSuccessful: true,
      tagsAdded: 1,
      hackerTrackerCountersAdded: 1,
    });
    expect(state.trace).toBeUndefined();
    expect(state.pendingChoice).toBeUndefined();
    expect(state.runner.tags).toBe(1);
    expect(state.cardInstances.runner_identity?.counters?.trace_tag_counter).toBe(1);
    expect(state.run?.traceSuccessBySubroutineIndex).toEqual({ 0: true });
    expect(legalAction.payload).toMatchObject({
      traceId: "run_1.ice_1.0.trace",
      traceStep: "runner_bid",
      baseTraceStrength: 3,
      sourceDefinitionId: "onr_v1_001_test-ice",
      corpBid: 1,
      traceStrength: 4,
      runnerBid: 0,
      runnerStrength: 0,
      traceSuccessful: true,
      tagsAdded: 1,
      addedCounterAmount: 1,
      counterType: "trace_tag_counter",
      remainingCounters: 1,
      hackerTrackerCountersAdded: 1,
      traceHostedCreditsAdded: 1,
    });
  });

  it("applies printed Trace-success run-lock/end-run followups through callbacks", () => {
    const state = makeState();
    state.trace = {
      traceId: "run_1.ice_1.1.trace",
      sourceCardInstanceId: "ice_1" as CardInstanceId,
      sourceDefinitionId: "onr_v1_001_test-ice" as never,
      subroutineIndex: 1,
      baseTraceStrength: 2,
      corpBid: 0,
      runnerBid: 0,
      status: "runner_bid",
      successEffect: { type: "end_run_and_run_lock", amount: 2 },
    };
    const legalAction = { payload: {} } as LegalAction;
    let finished: boolean | undefined;

    applyPrintedTraceSuccessFollowups(
      makeHost(state, legalAction, {
        finishRun: (successful) => {
          finished = successful;
          delete state.run;
        },
      }),
      {
        trace: state.trace,
        traceStep: "post_bid_link",
        legalAction,
        runnerLinkFallback: 0,
      },
    );

    expect(finished).toBe(false);
    expect(state.runnerTurnFlags?.runnerRunLockCreditCost).toBe(2);
    expect(legalAction.payload).toMatchObject({
      traceId: "run_1.ice_1.1.trace",
      traceStep: "post_bid_link",
      traceSuccessful: true,
      tagsAdded: 0,
      fangRunEnded: true,
      runnerRunEnded: true,
      runnerRunLockCreditCost: 2,
    });
  });
});
