import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  handleTraceOrchestrationAction,
  resolveTraceChoice,
  startTraceFromOperation,
  type TraceOrchestrationHost,
} from "./trace-orchestration";
import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  GameState,
  LegalAction,
  ModifierKind,
  PlayerAction,
  Side,
} from "@netgrid/shared";
import type { ActivatedCardAbilityImplementation } from "../../ability-engine/definition-types";
import type {
  CorpTracePaymentDependencies,
  RunnerTracePaymentDependencies,
} from "../payment";

describe("trace orchestration", () => {
  it("starts an operation trace with stable trace choice metadata", () => {
    const sourceId = "source_1" as CardInstanceId;
    const sourceDefinition = definition("trace_source", "operation");
    const state = minimalState({
      cardInstances: {
        [sourceId]: instance(sourceId, sourceDefinition.id, "corp"),
      },
    });
    const action = actionFor("corp", "trigger_ability", {
      cardId: sourceId,
    });

    startTraceFromOperation(
      testHost(state, { [sourceDefinition.id]: sourceDefinition }),
      sourceDefinition.id,
      2,
      action,
    );

    expect(state.trace).toMatchObject({
      traceId: "op_trace.2.trace_source.source_1",
      sourceCardInstanceId: sourceId,
      sourceDefinitionId: sourceDefinition.id,
      baseTraceStrength: 2,
      corpBidMax: 5,
      status: "corp_bid",
    });
    expect(state.pendingChoice).toMatchObject({
      choiceId: "op_trace.2.trace_source.source_1.corp.bid.2",
      side: "corp",
      source: "trace:op_trace.2.trace_source.source_1",
      kind: "bid_amount",
      stateVersion: 2,
      visibility: "public",
    });
    expect(action.payload).toMatchObject({
      traceStarted: true,
      traceId: "op_trace.2.trace_source.source_1",
      sourceCardId: sourceId,
      sourceDefinitionId: sourceDefinition.id,
      baseTraceStrength: 2,
    });
  });

  it("resolves the Corp bid through existing trace payment primitives", () => {
    const sourceId = "source_1" as CardInstanceId;
    const sourceDefinition = definition("trace_source", "operation");
    const state = minimalState({
      cardInstances: {
        [sourceId]: instance(sourceId, sourceDefinition.id, "corp"),
      },
    });
    state.trace = activeTrace(sourceId, sourceDefinition.id, "corp_bid", {
      corpBidMax: 5,
    });
    state.pendingChoice = bidChoice(state, "corp", state.trace.traceId, 5);
    const action = actionFor("corp", "resolve_choice");

    resolveTraceChoice(
      testHost(state, { [sourceDefinition.id]: sourceDefinition }),
      action,
      playerChoice("bid_2"),
    );

    expect(state.corp.credits).toBe(3);
    expect(state.trace).toMatchObject({
      status: "runner_bid",
      corpBid: 2,
      traceStrength: 4,
      runnerLink: 1,
    });
    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      source: "trace:trace_1",
      kind: "bid_amount",
    });
    expect(action.payload).toMatchObject({
      traceId: "trace_1",
      traceStep: "corp_bid",
      baseTraceStrength: 2,
      corpBid: 2,
      corpCreditBid: 2,
      traceStrength: 4,
      runnerLink: 1,
      traceBaseLinkChoiceOpened: false,
    });
  });

  it("resolves the Runner bid and completes operation trace success without a run", () => {
    const sourceId = "source_1" as CardInstanceId;
    const sourceDefinition = definition("trace_source", "operation");
    const state = minimalState({
      cardInstances: {
        [sourceId]: instance(sourceId, sourceDefinition.id, "corp"),
      },
    });
    state.trace = activeTrace(sourceId, sourceDefinition.id, "runner_bid", {
      corpBid: 2,
      traceStrength: 4,
      runnerLink: 1,
    });
    state.pendingChoice = bidChoice(state, "runner", state.trace.traceId, 5);
    const calls = testCalls();
    const action = actionFor("runner", "resolve_choice");

    resolveTraceChoice(
      testHost(state, { [sourceDefinition.id]: sourceDefinition }, calls),
      action,
      playerChoice("bid_2"),
    );

    expect(state.runner.credits).toBe(3);
    expect(calls.followups).toEqual([]);
    expect(state.runner.tags).toBe(1);
    expect(action.payload).toMatchObject({
      traceId: "trace_1",
      traceStep: "runner_bid",
      traceSuccessful: true,
      tagsAdded: 1,
    });
    expect(state.trace).toBeUndefined();
    expect(state.pendingChoice).toBeUndefined();
  });

  it("opens a trace success cancel window from a real successful trace result", () => {
    const sourceId = "source_1" as CardInstanceId;
    const sourceDefinition = definition("trace_source", "operation");
    const backDoorId = "back_door" as CardInstanceId;
    const backDoorDefinition = definition(
      "onr_proteus_129_back-door-to-netwatch",
      "resource",
    );
    const state = minimalState({
      cardInstances: {
        [sourceId]: instance(sourceId, sourceDefinition.id, "corp"),
        [backDoorId]: instance(backDoorId, backDoorDefinition.id, "runner"),
      },
      runnerResources: [backDoorId],
    });
    state.trace = activeTrace(sourceId, sourceDefinition.id, "runner_bid", {
      corpBid: 0,
      traceStrength: 5,
      runnerLink: 1,
      baseTraceStrength: 5,
      successEffect: { type: "net_damage", amount: 1 },
    });
    state.pendingChoice = bidChoice(state, "runner", state.trace.traceId, 5);
    const calls = testCalls();
    const action = actionFor("runner", "resolve_choice");

    resolveTraceChoice(
      testHost(
        state,
        {
          [sourceDefinition.id]: sourceDefinition,
          [backDoorDefinition.id]: backDoorDefinition,
        },
        calls,
        { successCancelSourceId: backDoorId },
      ),
      action,
      playerChoice("bid_0"),
    );

    expect(calls.followups).toEqual([]);
    expect(state.trace).toMatchObject({ status: "trace_success_cancel" });
    expect(state.pendingChoice).toMatchObject({
      source: "trace_success_cancel:trace_1",
      side: "runner",
      visibility: "hidden_info_barrier",
    });
    expect(state.pendingChoice?.options.map((option) => option.id)).toContain(
      `trace_success_cancel_${backDoorId}`,
    );
    expect(action.payload).toMatchObject({
      traceStep: "runner_bid",
      traceSuccessCancelChoiceOpened: true,
    });
  });

  it("resolves post-bid link choices through existing runner trace payment", () => {
    const sourceId = "source_1" as CardInstanceId;
    const sourceDefinition = definition("trace_source", "operation");
    const programId = "program_1" as CardInstanceId;
    const programDefinition = definition("pvr", "program");
    const state = minimalState({
      cardInstances: {
        [sourceId]: instance(sourceId, sourceDefinition.id, "corp"),
        [programId]: instance(programId, programDefinition.id, "runner"),
      },
      runnerPrograms: [programId],
    });
    state.trace = activeTrace(sourceId, sourceDefinition.id, "post_bid_link", {
      corpBid: 2,
      traceStrength: 4,
      runnerLink: 1,
      runnerBid: 2,
      runnerStrength: 3,
      postBidLinkBonus: 0,
      postBidLinkSourceIds: [],
    });
    state.run = { runId: "run_1", attackedServerId: "rd" } as any;
    state.pendingChoice = {
      choiceId: "trace_1.post_bid_link.2",
      side: "runner",
      source: "trace_post_bid_link:trace_1",
      prompt: "Post-bid Link-Faehigkeit nutzen",
      kind: "select_option",
      options: [
        { id: "pass", label: "Keine Link-Faehigkeit nutzen" },
        {
          id: `trace_link_${programId}`,
          label: "PVR: +1 Link",
          value: programId,
        },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: 2,
      visibility: "hidden_info_barrier",
    };
    const calls = testCalls();
    const action = actionFor("runner", "resolve_choice");

    resolveTraceChoice(
      testHost(
        state,
        {
          [sourceDefinition.id]: sourceDefinition,
          [programDefinition.id]: programDefinition,
        },
        calls,
        { postBidLinkSourceId: programId },
      ),
      action,
      playerChoice(`trace_link_${programId}`),
    );

    expect(state.runner.credits).toBe(4);
    expect(calls.runActionCapSpends).toEqual([1]);
    expect(calls.submarineMarkers).toEqual([programId]);
    expect(calls.followups).toEqual(["post_bid_link:trace_1"]);
    expect(action.payload).toMatchObject({
      traceId: "trace_1",
      traceStep: "post_bid_link",
      eventModificationDecision: "apply",
      sourceDefinitionId: programDefinition.id,
      postBidTraceLinkSourceDefinitionId: programDefinition.id,
      postBidTraceLinkCostPaid: 1,
      postBidTraceLinkDelta: 1,
      postBidTraceLinkBonus: 1,
      runnerLink: 2,
      runnerStrength: 4,
      postBidTraceLinkChoiceOpened: false,
    });
  });

  it("records base-link payments against run-action spending cap", () => {
    const sourceId = "source_1" as CardInstanceId;
    const sourceDefinition = definition("trace_source", "operation");
    const accessId = "access_kiribati_1" as CardInstanceId;
    const accessDefinition = definition(
      "onr_v1_150_access-to-kiribati",
      "resource",
    );
    const state = minimalState({
      cardInstances: {
        [sourceId]: instance(sourceId, sourceDefinition.id, "corp"),
        [accessId]: instance(accessId, accessDefinition.id, "runner"),
      },
      runnerResources: [accessId],
    });
    state.trace = activeTrace(sourceId, sourceDefinition.id, "base_link", {
      traceStrength: 4,
    });
    state.run = { runId: "run_1", attackedServerId: "rd" } as any;
    state.pendingChoice = {
      choiceId: "trace_1.base_link.2",
      side: "runner",
      source: "trace_base_link:trace_1",
      prompt: "Base-Link-Karte fuer Trace nutzen",
      kind: "select_option",
      options: [
        { id: "pass", label: "Keine Base-Link-Karte nutzen" },
        {
          id: `trace_base_link_${accessId}`,
          label: "Access to Kiribati: Base Link 1",
          value: accessId,
        },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: 2,
      visibility: "hidden_info_barrier",
    };
    const calls = testCalls();
    const action = actionFor("runner", "resolve_choice");

    resolveTraceChoice(
      testHost(
        state,
        {
          [sourceDefinition.id]: sourceDefinition,
          [accessDefinition.id]: accessDefinition,
        },
        calls,
      ),
      action,
      playerChoice(`trace_base_link_${accessId}`),
    );

    expect(state.runner.credits).toBe(4);
    expect(calls.runActionCapSpends).toEqual([1]);
    expect(state.trace).toMatchObject({
      status: "runner_bid",
      runnerLink: 2,
    });
    expect(action.payload).toMatchObject({
      traceStep: "base_link",
      baseLinkUsed: true,
      traceBaseLinkCostPaid: 1,
      baseLinkValue: 1,
    });
  });

  it("does not handle legacy Paris City Grid trace trigger payloads", () => {
    const sourceId = "paris_1" as CardInstanceId;
    const sourceDefinition = definition("paris_city_grid", "upgrade");
    const state = minimalState({
      cardInstances: {
        [sourceId]: instance(sourceId, sourceDefinition.id, "corp"),
      },
    });
    const action = actionFor("corp", "trigger_ability", {
      cardId: sourceId,
      v1918UpgradeAbility: "trace_2_tag",
      traceStrength: 2,
    });

    const result = handleTraceOrchestrationAction(
      testHost(
        state,
        { [sourceDefinition.id]: sourceDefinition },
        testCalls(),
        {
          parisTraceDefinitionId: sourceDefinition.id,
          rezzedCorpRootCardIds: [sourceId],
        },
      ),
      action,
    );

    expect(result).toEqual({ handled: false });
    expect(state.trace).toBeUndefined();
    expect(state.pendingChoice).toBeUndefined();
  });

  it("does not import from index.ts", () => {
    const source = readFileSync(
      new URL("./trace-orchestration.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain("../index");
    expect(source).not.toContain("../../index");
  });
});

function definition(
  id: string,
  type: CardDefinition["type"],
  extras: Partial<CardDefinition> = {},
): CardDefinition {
  return {
    id: id as CardDefinitionId,
    title: id,
    type,
    installCost: 0,
    rezCost: 0,
    agendaPoints: 0,
    advancementRequirement: 0,
    mechanics: [],
    subtypes: [],
    ...extras,
  } as CardDefinition;
}

function instance(
  id: CardInstanceId,
  definitionId: CardDefinitionId,
  owner: "corp" | "runner",
): CardInstance {
  return {
    id,
    definitionId,
    owner,
    controller: owner,
    faceup: true,
    rezzed: true,
    zone:
      owner === "runner"
        ? { side: "runner", zone: "rig" }
        : { side: "corp", zone: "hq" },
  } as unknown as CardInstance;
}

function minimalState(input: {
  cardInstances: Record<CardInstanceId, CardInstance>;
  runnerPrograms?: CardInstanceId[];
  runnerResources?: CardInstanceId[];
}): GameState {
  return {
    stateVersion: 1,
    randomCounter: 0,
    activeSide: "corp",
    phase: "corp_action_phase",
    timingPoint: "corp_action.main",
    runner: {
      identity: "runner_identity" as CardInstanceId,
      clicks: 4,
      credits: 5,
      stack: [],
      grip: [],
      heap: [],
      scoreArea: [],
      tags: 0,
      memoryUsed: 0,
      memoryLimit: 4,
      rig: {
        programs: [...(input.runnerPrograms ?? [])],
        hardware: [],
        resources: [...(input.runnerResources ?? [])],
      },
    },
    corp: {
      clicks: 3,
      credits: 5,
      rd: [],
      hq: [],
      archives: [],
      scoreArea: [],
      badPublicity: 0,
      servers: [],
    },
    cardInstances: {
      runner_identity: instance(
        "runner_identity" as CardInstanceId,
        "runner_identity_def" as CardDefinitionId,
        "runner",
      ),
      ...input.cardInstances,
    },
    eventLog: [],
  } as unknown as GameState;
}

function activeTrace(
  sourceCardInstanceId: CardInstanceId,
  sourceDefinitionId: CardDefinitionId,
  status: NonNullable<GameState["trace"]>["status"],
  extras: Partial<NonNullable<GameState["trace"]>> = {},
): NonNullable<GameState["trace"]> {
  return {
    traceId: "trace_1",
    sourceCardInstanceId,
    sourceDefinitionId,
    baseTraceStrength: 2,
    status,
    successEffect: { type: "add_tag", amount: 1 },
    ...extras,
  } as NonNullable<GameState["trace"]>;
}

function bidChoice(
  state: GameState,
  side: Side,
  traceId: string,
  maxBid: number,
) {
  return {
    choiceId: `${traceId}.${side}.bid.${state.stateVersion + 1}`,
    side,
    source: `trace:${traceId}`,
    prompt: "Bid",
    kind: "bid_amount",
    options: Array.from({ length: maxBid + 1 }, (_, amount) => ({
      id: `bid_${amount}`,
      label: `${amount} Credits`,
      publicLabel: `${amount} Credits`,
      value: amount,
    })),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  } as NonNullable<GameState["pendingChoice"]>;
}

function actionFor(
  side: Side,
  type: LegalAction["type"],
  payload: NonNullable<LegalAction["payload"]> = {},
): LegalAction {
  return {
    actionId: `${side}.${type}`,
    type,
    side,
    label: type,
    source: "test",
    timing: "main",
    costs: [],
    payload,
  } as unknown as LegalAction;
}

function playerChoice(optionId: string): PlayerAction {
  return {
    actionId: "choice",
    side: "runner",
    type: "resolve_choice",
    stateVersion: 1,
    selectedChoices: { selectedOptionIds: [optionId] },
  } as unknown as PlayerAction;
}

type TestCalls = {
  submarineMarkers: CardInstanceId[];
  followups: string[];
  runActionCapSpends: number[];
};

function testCalls(): TestCalls {
  return {
    submarineMarkers: [],
    followups: [],
    runActionCapSpends: [],
  };
}

function testHost(
  state: GameState,
  definitions: Record<CardDefinitionId, CardDefinition>,
  calls = testCalls(),
  options: {
    postBidLinkSourceId?: CardInstanceId;
    postBidLinkAmount?: number;
    postBidLinkTap?: boolean;
    successCancelSourceId?: CardInstanceId;
    parisTraceDefinitionId?: CardDefinitionId;
    rezzedCorpRootCardIds?: CardInstanceId[];
  } = {},
): TraceOrchestrationHost {
  const definitionFor = (cardId: CardInstanceId) => {
    const foundDefinition =
      definitions[state.cardInstances[cardId]!.definitionId];
    if (!foundDefinition) {
      if (cardId === state.runner.identity)
        return definition("runner_identity_def", "identity", { baseLink: 1 });
      throw new Error(`Definition fehlt: ${cardId}`);
    }
    return foundDefinition;
  };
  const corpTracePaymentDeps: CorpTracePaymentDependencies = {
    encounterTemporaryTraceCreditsAvailable: () => 0,
    spendEncounterTemporaryTraceCredits: () => 0,
    fortTraceBitPoolTotal: () => 0,
    spendFortTraceBitPool: () => 0,
    corpCreditsAvailable: (targetState) => targetState.corp.credits,
    spendCorpCredits: (targetState, amount) => {
      targetState.corp.credits -= amount;
    },
    corpTraceBitPoolTotal: () => 0,
    spendCorpTraceBitPool: () => 0,
    corpTraceCounterPoolTotal: () => 0,
    spendCorpTraceCounterPool: () => 0,
    cardCounter: () => 0,
  };
  const runnerTracePaymentDeps: RunnerTracePaymentDependencies = {
    runnerTraceLinkCreditSources: () => [],
    hostedPaymentCredits: () => 0,
    spendHostedPaymentCredits: () => undefined,
    runnerCreditsAvailable: (targetState) => targetState.runner.credits,
    spendRunnerCredits: (targetState, amount) => {
      targetState.runner.credits -= amount;
    },
    recordRunnerRunCreditSpend: () => undefined,
    recordRunActionSpendingCapSpend: (_targetState, amount) => {
      calls.runActionCapSpends.push(amount);
    },
    definitionIdForCard: (targetState, cardId) =>
      targetState.cardInstances[cardId]!.definitionId,
  };
  return {
    state,
    cards: {
      definitionFor,
      runnerInstalledCardIds: () => [
        ...state.runner.rig.programs,
        ...state.runner.rig.hardware,
        ...state.runner.rig.resources,
      ],
      activatedTraceAbilities: (_definition, timing) => {
        if (
          timing === "trace_success_cancel_window" &&
          options.successCancelSourceId
        ) {
          return [
            {
              index: 0,
              ability: {
                kind: "activated",
                timing: "trace_success_cancel_window",
                costs: [
                  { kind: "credit", amount: 3 },
                  { kind: "tap_source", amount: 1 },
                ],
                effects: [],
              } as ActivatedCardAbilityImplementation,
            },
          ];
        }
        if (timing !== "trace_post_bid_link_window") return [];
        if (!options.postBidLinkSourceId) return [];
        return [
          {
            index: 0,
            ability: {
              kind: "activated",
              timing: "trace_post_bid_link_window",
              costs: options.postBidLinkTap
                ? [{ kind: "tap_source", amount: 1 }]
                : [{ kind: "credit", amount: 1 }],
              effects: [
                {
                  kind: "increase_trace_link",
                  amount: options.postBidLinkAmount ?? 1,
                  visibility: "public",
                },
              ],
              limit: { kind: "once_per_trace_per_source", scope: "source" },
            } as ActivatedCardAbilityImplementation,
          },
        ];
      },
      hasCardImplementationForDefinition: () => false,
      isTraceLinkForceJackOutSource: (cardId) =>
        cardId === options.postBidLinkSourceId,
    },
    payment: {
      corpTracePaymentDeps,
      runnerTracePaymentDeps,
      runnerTraceLinkCreditSourceIds: () => [],
      hostedPaymentCredits: () => 0,
      spendRunnerCredits: (amount) => {
        state.runner.credits -= amount;
      },
      recordRunActionSpendingCapSpend: (amount) => {
        calls.runActionCapSpends.push(amount);
      },
    },
    runner: {
      identityModifierAmount: (
        _side: Side,
        _kind: ModifierKind,
        _duration: "setup" | "static",
      ) => 0,
    },
    corp: {
      rezzedCorpRootCardIds: () => options.rezzedCorpRootCardIds ?? [],
    },
    counters: {
      cardCounter: () => 0,
      corpTraceCounterPoolTotal: () => 0,
      recurringTraceCreditPoolTotal: () => 0,
    },
    fort: {
      fortTraceBitPoolSource: () => undefined,
    },
    run: {
      markTraceLinkForceJackOutAfterEncounter: (cardId) => {
        calls.submarineMarkers.push(cardId);
      },
      applyPrintedTraceSuccessFollowups: (input) => {
        calls.followups.push(`${input.traceStep}:${input.trace.traceId}`);
        delete state.pendingChoice;
        delete state.trace;
        return { handled: true, stateChanged: true } as any;
      },
    },
    trace: {
      supportsTraceSuccessEffect: () => true,
    },
    callbacks: {
      sanitizeId: (value) => value.replace(/[^a-z0-9_]+/gi, "_"),
      addCorpTraceCounterPoolCounters: () => 0,
      resolveTraceTrashRunnerResourceSuccess: () => ({}),
    },
  };
}
