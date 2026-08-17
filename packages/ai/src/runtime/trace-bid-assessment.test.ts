import { createGame, getLegalActions, getPlayerView } from "@netgrid/engine";
import type {
  AiDecisionInput,
  CardDefinitionId,
  GameState,
  PublicGameEvent,
  Side,
  TraceRulesProfile,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { reconstructBeliefState } from "../belief-state";
import { assessTraceBidCandidates } from "./trace-bid-assessment";
import { latestTraceContext } from "./trace-context";

describe("Blind Trace bid assessment", () => {
  it("keeps low-stakes variance inside legal rational candidates and skips Modern", () => {
    const blind = decisionInput({
      profile: "classic_blind",
      side: "corp",
      sourceDefinitionId: "unknown_low_stakes_trace" as CardDefinitionId,
      printedTrace: 3,
      bidMax: 3,
    });
    const assessment = assess(blind);

    expect(assessment.assessment).toMatchObject({
      stakes: "low",
      behavioralBias: "polarized",
      printedTrace: 3,
      effectiveTraceLimit: 3,
    });
    expect(assessment.candidates.length).toBeGreaterThan(1);
    expect(
      assessment.candidates.every(
        (candidate) =>
          candidate.bid >= 0 &&
          candidate.bid <= 3 &&
          Number.isInteger(candidate.weight) &&
          candidate.weight > 0,
      ),
    ).toBe(true);

    const modern = decisionInput({
      profile: "modern_open",
      side: "corp",
      sourceDefinitionId: "unknown_low_stakes_trace" as CardDefinitionId,
      printedTrace: 3,
      bidMax: 8,
    });
    expect(
      assessTraceBidCandidates(
        modern,
        requiredChoice(modern),
        latestTraceContext(modern),
      ),
    ).toBeUndefined();
  });

  it("tightens variance for a terminal Trace and preserves the credit reserve in ordinary cases", () => {
    const low = assess(
      decisionInput({
        profile: "classic_blind",
        side: "runner",
        sourceDefinitionId: "unknown_low_stakes_trace" as CardDefinitionId,
        printedTrace: 5,
        bidMax: 5,
        ownCredits: 5,
      }),
    );
    const terminal = assess(
      decisionInput({
        profile: "classic_blind",
        side: "runner",
        sourceDefinitionId: "onr_v1_248_homewrecker" as CardDefinitionId,
        printedTrace: 5,
        bidMax: 5,
        ownCredits: 5,
        runnerGripCount: 2,
      }),
    );

    expect(terminal.assessment.stakes).toBe("terminal");
    expect(terminal.assessment.reserveTarget).toBe(0);
    expect(terminal.candidates.length).toBeLessThanOrEqual(
      low.candidates.length,
    );
    expect(low.assessment.reserveTarget).toBeGreaterThan(0);
    expect(low.assessment.rationalTarget).toBeLessThanOrEqual(3);
  });

  it("accounts for structured Tag, run-lock, Link, low-credit and specialized-credit situations", () => {
    const tagInput = decisionInput({
      profile: "classic_blind",
      side: "corp",
      sourceDefinitionId: "onr_v1_236_data-raven" as CardDefinitionId,
      printedTrace: 5,
      bidMax: 5,
    });
    const tag = assess(tagInput);
    const punishInput = decisionInput({
      profile: "classic_blind",
      side: "corp",
      sourceDefinitionId: "onr_v1_236_data-raven" as CardDefinitionId,
      printedTrace: 5,
      bidMax: 5,
    });
    punishInput.playerView.own.gripOrHq.push({
      instanceId: "visible_punish",
      definitionId: "onr_v1_302_scorched-earth",
      title: "Scorched Earth",
      type: "operation",
      known: true,
      owner: "corp",
      controller: "corp",
    });
    const punish = assess(punishInput);
    const runLock = assess(
      decisionInput({
        profile: "classic_blind",
        side: "corp",
        sourceDefinitionId:
          "onr_proteus_025_homing-missile" as CardDefinitionId,
        printedTrace: 0,
        effectiveTraceLimit: 5,
        bidMax: 5,
      }),
    );
    const highLink = assess(
      decisionInput({
        profile: "classic_blind",
        side: "corp",
        sourceDefinitionId: "onr_v1_236_data-raven" as CardDefinitionId,
        printedTrace: 5,
        bidMax: 5,
        runnerLink: 4,
      }),
    );
    const lowCredits = assess(
      decisionInput({
        profile: "classic_blind",
        side: "corp",
        sourceDefinitionId: "onr_v1_236_data-raven" as CardDefinitionId,
        printedTrace: 5,
        bidMax: 1,
        ownCredits: 1,
      }),
    );
    const specializedCredits = assess(
      decisionInput({
        profile: "classic_blind",
        side: "corp",
        sourceDefinitionId: "onr_v1_236_data-raven" as CardDefinitionId,
        printedTrace: 5,
        bidMax: 5,
        ownCredits: 2,
      }),
    );

    expect(tag.assessment.outcomeValue).toBeGreaterThan(3);
    expect(punish.assessment.outcomeValue).toBeGreaterThan(
      tag.assessment.outcomeValue,
    );
    expect(punish.assessment.stakes).toBe("high");
    expect(runLock.assessment).toMatchObject({
      stakes: "normal",
      behavioralBias: "aggressive",
      outcomeValue: 8,
    });
    expect(highLink.assessment.rationalTarget).toBeLessThanOrEqual(
      tag.assessment.rationalTarget,
    );
    expect(lowCredits.candidates.every((candidate) => candidate.bid <= 1)).toBe(
      true,
    );
    expect(
      specializedCredits.candidates.some((candidate) => candidate.bid > 2),
    ).toBe(true);
  });

  it("uses the profile tie rule in both sides' utility instead of a resolver shortcut", () => {
    const corpRunnerTies = assess(
      decisionInput({
        profile: "classic_blind",
        side: "corp",
        sourceDefinitionId: "onr_v1_236_data-raven" as CardDefinitionId,
        printedTrace: 5,
        bidMax: 5,
      }),
    );
    const corpCorpTies = assess(
      decisionInput({
        profile: "classic_blind_corp_ties",
        side: "corp",
        sourceDefinitionId: "onr_v1_236_data-raven" as CardDefinitionId,
        printedTrace: 5,
        bidMax: 5,
      }),
    );
    const runnerRunnerTies = assess(
      decisionInput({
        profile: "classic_blind",
        side: "runner",
        sourceDefinitionId: "onr_v1_236_data-raven" as CardDefinitionId,
        printedTrace: 5,
        bidMax: 5,
      }),
    );
    const runnerCorpTies = assess(
      decisionInput({
        profile: "classic_blind_corp_ties",
        side: "runner",
        sourceDefinitionId: "onr_v1_236_data-raven" as CardDefinitionId,
        printedTrace: 5,
        bidMax: 5,
      }),
    );

    expect(corpCorpTies.candidates).not.toEqual(corpRunnerTies.candidates);
    expect(runnerCorpTies.candidates).not.toEqual(runnerRunnerTies.candidates);
    expect(corpCorpTies.assessment.rationalTarget).toBeLessThanOrEqual(
      corpRunnerTies.assessment.rationalTarget,
    );
    expect(runnerCorpTies.assessment.rationalTarget).toBeGreaterThanOrEqual(
      runnerRunnerTies.assessment.rationalTarget,
    );
  });

  it("cannot observe the opposing hidden bid before reveal", () => {
    const lowHiddenBid = decisionInput({
      profile: "classic_blind",
      side: "runner",
      sourceDefinitionId: "onr_v1_236_data-raven" as CardDefinitionId,
      printedTrace: 5,
      bidMax: 5,
      hiddenCorpBid: 0,
    });
    const highHiddenBid = decisionInput({
      profile: "classic_blind",
      side: "runner",
      sourceDefinitionId: "onr_v1_236_data-raven" as CardDefinitionId,
      printedTrace: 5,
      bidMax: 5,
      hiddenCorpBid: 5,
    });

    expect(lowHiddenBid.playerView.trace?.corpBid).toBeUndefined();
    expect(highHiddenBid.playerView.trace?.corpBid).toBeUndefined();
    expect(assess(highHiddenBid)).toEqual(assess(lowHiddenBid));
  });

  it("uses side-safe specialized opponent capacity for both Blind bidders", () => {
    const corpNormalOnly = decisionInput({
      profile: "classic_blind",
      side: "corp",
      sourceDefinitionId: "onr_v1_236_data-raven" as CardDefinitionId,
      printedTrace: 6,
      bidMax: 6,
      opponentCredits: 3,
      visibleOpponentBidCapacity: 3,
    });
    const corpWithVisibleRunnerPool = decisionInput({
      profile: "classic_blind",
      side: "corp",
      sourceDefinitionId: "onr_v1_236_data-raven" as CardDefinitionId,
      printedTrace: 6,
      bidMax: 6,
      opponentCredits: 3,
      visibleOpponentBidCapacity: 6,
    });
    const runnerNormalOnly = decisionInput({
      profile: "classic_blind",
      side: "runner",
      sourceDefinitionId: "onr_v1_236_data-raven" as CardDefinitionId,
      printedTrace: 5,
      bidMax: 6,
      opponentCredits: 3,
      visibleOpponentBidCapacity: 3,
    });
    const runnerWithVisibleCorpPool = decisionInput({
      profile: "classic_blind",
      side: "runner",
      sourceDefinitionId: "onr_v1_236_data-raven" as CardDefinitionId,
      printedTrace: 5,
      bidMax: 6,
      opponentCredits: 3,
      visibleOpponentBidCapacity: 5,
    });

    expect(assess(corpWithVisibleRunnerPool).candidates).not.toEqual(
      assess(corpNormalOnly).candidates,
    );
    expect(assess(runnerWithVisibleCorpPool).candidates).not.toEqual(
      assess(runnerNormalOnly).candidates,
    );

    corpWithVisibleRunnerPool.playerView.opponent.rig = [
      {
        instanceId: "concealed_trace_support_slot",
        known: false,
        concealed: true,
        hiddenRunnerResource: true,
        type: "resource",
        owner: "runner",
        controller: "runner",
      },
    ];
    expect(assess(corpWithVisibleRunnerPool)).toEqual(
      assess(
        decisionInput({
          profile: "classic_blind",
          side: "corp",
          sourceDefinitionId: "onr_v1_236_data-raven" as CardDefinitionId,
          printedTrace: 6,
          bidMax: 6,
          opponentCredits: 3,
          visibleOpponentBidCapacity: 6,
        }),
      ),
    );
  });

  it("keeps weighted variance above the safe bid floor for a known lethal tag follow-up", () => {
    const input = decisionInput({
      profile: "classic_blind",
      side: "runner",
      sourceDefinitionId: "onr_v1_284_chance-observation" as CardDefinitionId,
      printedTrace: 5,
      bidMax: 10,
      ownCredits: 10,
      opponentCredits: 6,
      visibleOpponentBidCapacity: 5,
      runnerGripCount: 5,
    });
    input.playerView.opponent.clicks = 2;
    const hqLook = runnerHqLookEvent(
      ["onr_v1_307_urban-renewal"] as CardDefinitionId[],
      input.playerView.stateVersion,
    );
    input.playerView.publicEvents = [hqLook];
    input.eventTail = [hqLook];

    expect(
      reconstructBeliefState(input).runnerOpponentModel?.hqHandMemory.ledger
        .safeDefinitions,
    ).toEqual([
      expect.objectContaining({
        definitionId: "onr_v1_307_urban-renewal",
        count: 1,
      }),
    ]);

    const result = assess(input);

    expect(result.assessment).toMatchObject({
      stakes: "terminal",
      visibleOpponentBidCapacity: 5,
    });
    expect(result.candidates.length).toBeGreaterThan(1);
    expect(result.candidates.every((candidate) => candidate.bid >= 1)).toBe(
      true,
    );
    expect(
      new Set(result.candidates.map((candidate) => candidate.weight)).size,
    ).toBeGreaterThan(1);
  });
});

function runnerHqLookEvent(
  definitionIds: CardDefinitionId[],
  stateVersion: number,
): PublicGameEvent {
  return {
    eventId: "runner-known-hq-payoff",
    type: "resolve_choice",
    stateVersionBefore: Math.max(0, stateVersion - 1),
    stateVersionAfter: stateVersion,
    stateHashAfter: "hash-runner-known-hq-payoff",
    visibilityClass: "hidden_info_barrier",
    publicPayload: {
      actor: "runner",
      actionType: "resolve_choice",
      hiddenZoneAction: "p3_33_private_look",
      privateLookZone: "hq",
      privateLookCount: definitionIds.length,
      knownHqDefinitionIds: definitionIds,
    },
  };
}

function assess(input: AiDecisionInput) {
  const result = assessTraceBidCandidates(
    input,
    requiredChoice(input),
    latestTraceContext(input),
  );
  if (!result) throw new Error("Expected Blind Trace assessment.");
  return result;
}

function requiredChoice(input: AiDecisionInput) {
  const choice = input.playerView.pendingChoice;
  if (!choice) throw new Error("Expected visible Trace Choice.");
  return choice;
}

function decisionInput(input: {
  profile: TraceRulesProfile;
  side: Side;
  sourceDefinitionId: CardDefinitionId;
  printedTrace: number;
  effectiveTraceLimit?: number;
  bidMax: number;
  ownCredits?: number;
  runnerLink?: number;
  runnerGripCount?: number;
  hiddenCorpBid?: number;
  opponentCredits?: number;
  visibleOpponentBidCapacity?: number;
}): AiDecisionInput {
  const state = traceState(input);
  const playerView = getPlayerView(state, input.side);
  if (input.visibleOpponentBidCapacity !== undefined && playerView.trace) {
    playerView.trace.visibleOpponentBidCapacity =
      input.visibleOpponentBidCapacity;
  }
  return {
    matchId: state.matchId,
    side: input.side,
    playerView,
    eventTail: [],
    legalActions: getLegalActions(state, input.side),
    difficulty: "hard",
    seed: "trace-assessment",
    decisionId: `trace-assessment:${input.profile}:${input.side}`,
    actionNumber: state.stateVersion,
    profileId: "default",
  };
}

function traceState(input: {
  profile: TraceRulesProfile;
  side: Side;
  sourceDefinitionId: CardDefinitionId;
  printedTrace: number;
  effectiveTraceLimit?: number;
  bidMax: number;
  ownCredits?: number;
  runnerLink?: number;
  runnerGripCount?: number;
  hiddenCorpBid?: number;
  opponentCredits?: number;
  visibleOpponentBidCapacity?: number;
}): GameState {
  const state = createGame({
    seed: `trace-assessment:${input.profile}:${input.side}`,
    setupMode: "completed",
    traceRulesProfile: input.profile,
  });
  const effectiveTraceLimit = input.effectiveTraceLimit ?? input.printedTrace;
  state.activeSide = input.side;
  if (input.side === "corp") {
    state.corp.credits = input.ownCredits ?? 5;
    state.runner.credits = input.opponentCredits ?? 5;
  } else {
    state.runner.credits = input.ownCredits ?? 5;
    state.corp.credits = input.opponentCredits ?? 5;
  }
  if (input.runnerGripCount !== undefined) {
    state.runner.grip = state.runner.grip.slice(0, input.runnerGripCount);
  }
  state.trace = {
    traceId: "trace_assessment_1",
    sourceCardInstanceId: state.corp.identity,
    sourceDefinitionId: input.sourceDefinitionId,
    traceRulesProfile: input.profile,
    traceLimit: input.printedTrace,
    effectiveTraceLimit,
    corpBidMax: effectiveTraceLimit,
    status: input.side === "corp" ? "corp_bid" : "runner_bid",
    bidsRevealed: input.profile === "modern_open" && input.side === "runner",
    ...(input.side === "runner"
      ? {
          corpBid: input.hiddenCorpBid ?? 2,
          traceValue: input.hiddenCorpBid ?? 2,
        }
      : {}),
    runnerLink: input.runnerLink ?? 0,
    successEffect: { type: "add_tag", amount: 1 },
  };
  state.pendingChoice = {
    choiceId: `trace_assessment_1.${input.side}.bid.${state.stateVersion}`,
    side: input.side,
    source: "trace:trace_assessment_1",
    prompt: "Gebot wählen",
    kind: "bid_amount",
    options: Array.from({ length: input.bidMax + 1 }, (_, bid) => ({
      id: `bid_${bid}`,
      label: `${bid} Credits`,
      publicLabel: "Gebot festlegen",
      value: bid,
    })),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion,
    visibility:
      input.profile === "modern_open" ? "public" : "hidden_info_barrier",
  };
  return state;
}
