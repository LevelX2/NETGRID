import {
  applyAction,
  applyRandomizedTraceBidSelection,
  createGame,
  getLegalActions,
  quoteRandomizedTraceBidSelection,
} from "@netgrid/engine";
import type {
  AiDecision,
  CardDefinitionId,
  GameState,
  Side,
  TraceRulesProfile,
  TraceSuccessEffect,
} from "@netgrid/shared";
import { beforeEach, describe, expect, it } from "vitest";

import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import type { AiDeckStrategyDeckSnapshot } from "../deck-strategy-snapshot";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "../runtime/ai-decision-input";

const PROFILES = [
  "modern_open",
  "classic_blind",
  "classic_blind_corp_ties",
] as const satisfies readonly TraceRulesProfile[];

const SCENARIOS = [
  {
    id: "low",
    sourceDefinitionId: "trace_comparison_low" as CardDefinitionId,
    traceLimit: 3,
    runnerLink: 1,
    corpCredits: 6,
    runnerCredits: 6,
    runnerGripCount: 5,
    successEffect: { type: "none" } as TraceSuccessEffect,
  },
  {
    id: "tag",
    sourceDefinitionId: "onr_v1_236_data-raven" as CardDefinitionId,
    traceLimit: 5,
    runnerLink: 1,
    corpCredits: 8,
    runnerCredits: 3,
    runnerGripCount: 5,
    successEffect: {
      type: "add_tag_and_counter",
      tagAmount: 1,
      counterType: "trace_tag_counter",
      amount: 1,
    } as TraceSuccessEffect,
  },
  {
    id: "terminal",
    sourceDefinitionId: "onr_v1_248_homewrecker" as CardDefinitionId,
    traceLimit: 5,
    runnerLink: 0,
    corpCredits: 8,
    runnerCredits: 6,
    runnerGripCount: 2,
    successEffect: {
      type: "end_run_trash_hardware_and_unpreventable_meat_damage",
      amount: 2,
    } as TraceSuccessEffect,
  },
] as const;

type ScenarioId = (typeof SCENARIOS)[number]["id"];

type TraceSample = {
  profile: TraceRulesProfile;
  scenario: ScenarioId;
  seed: string;
  corpBid: number;
  runnerBid: number;
  corpBidMax: number;
  runnerBidMax: number;
  successful: boolean;
};

type ProfileMetrics = {
  attempts: number;
  successRate: number;
  averageCorpBid: number;
  averageRunnerBid: number;
  corpZeroBidShare: number;
  runnerZeroBidShare: number;
  corpMaximumBidShare: number;
  runnerMaximumBidShare: number;
  corpBidVariance: number;
  runnerBidVariance: number;
};

describe("Trace profile scenario comparison", () => {
  beforeEach(() => resetResidentPlanPortfolioMemory());

  it("compares all profiles reproducibly without destructive terminal variance", () => {
    const first = runComparison();
    resetResidentPlanPortfolioMemory();
    const second = runComparison();

    expect(second).toEqual(first);
    for (const profile of PROFILES) {
      const metrics = first.metrics[profile];
      expect(metrics.attempts).toBe(SCENARIOS.length * 12);
      expect(metrics.successRate).toBeGreaterThanOrEqual(0);
      expect(metrics.successRate).toBeLessThanOrEqual(1);
      expect(metrics.averageCorpBid).toBeGreaterThanOrEqual(0);
      expect(metrics.averageRunnerBid).toBeGreaterThanOrEqual(0);
    }

    const classicLowBids = bidsFor(
      first.samples,
      "classic_blind",
      "low",
      "corpBid",
    );
    const classicTerminalBids = bidsFor(
      first.samples,
      "classic_blind",
      "terminal",
      "corpBid",
    );
    expect(new Set(classicLowBids).size).toBeGreaterThan(1);
    expect(variance(classicTerminalBids)).toBeLessThanOrEqual(
      variance(classicLowBids),
    );
    expect(
      first.samples.every(
        (sample) =>
          sample.corpBid >= 0 &&
          sample.corpBid <= sample.corpBidMax &&
          sample.runnerBid >= 0 &&
          sample.runnerBid <= sample.runnerBidMax,
      ),
    ).toBe(true);

    const terminalBlindSamples = first.samples.filter(
      (sample) =>
        sample.scenario === "terminal" && sample.profile !== "modern_open",
    );
    expect(terminalBlindSamples.every((sample) => sample.corpBid >= 3)).toBe(
      true,
    );
    expect(
      first.metrics.classic_blind_corp_ties.successRate,
    ).toBeGreaterThanOrEqual(first.metrics.classic_blind.successRate);

    console.info(
      "TRACE_PROFILE_SCENARIO_COMPARISON",
      JSON.stringify(first.metrics),
    );
  });
});

function runComparison(): {
  samples: TraceSample[];
  metrics: Record<TraceRulesProfile, ProfileMetrics>;
} {
  const samples = PROFILES.flatMap((profile) =>
    SCENARIOS.flatMap((scenario) =>
      Array.from({ length: 12 }, (_, index) =>
        runTrace(profile, scenario, `${scenario.id}:${index}`),
      ),
    ),
  );
  return {
    samples,
    metrics: Object.fromEntries(
      PROFILES.map((profile) => [
        profile,
        profileMetrics(samples.filter((sample) => sample.profile === profile)),
      ]),
    ) as Record<TraceRulesProfile, ProfileMetrics>,
  };
}

function runTrace(
  profile: TraceRulesProfile,
  scenario: (typeof SCENARIOS)[number],
  seed: string,
): TraceSample {
  let state = traceState(profile, scenario, seed);
  const corpBidMax = highestChoiceBid(state);
  const corpDecision = chooseDecision(state, "corp");
  state = applyDecision(state, corpDecision);
  const corpBid = state.trace?.corpBid;
  if (corpBid === undefined || state.trace?.status !== "runner_bid") {
    throw new Error("Corp Trace bid did not reach the Runner bid window.");
  }
  const runnerBidMax = highestChoiceBid(state);
  const runnerDecision = chooseDecision(state, "runner");
  const applied = applyDecisionWithEvent(state, runnerDecision);
  const payload = applied.event.publicPayload;
  const runnerBid = payload.runnerBid;
  const successful = payload.traceSuccessful;
  if (typeof runnerBid !== "number" || typeof successful !== "boolean") {
    throw new Error("Trace comparison result payload is incomplete.");
  }
  return {
    profile,
    scenario: scenario.id,
    seed,
    corpBid,
    runnerBid,
    corpBidMax,
    runnerBidMax,
    successful,
  };
}

function chooseDecision(state: GameState, side: Side): AiDecision {
  resetResidentPlanPortfolioMemory();
  const input = buildAiDecisionInput(state, side, {
    ownDeckSnapshot: deckSnapshot(state, side),
    decisionId: `trace-comparison:${state.seed}:${side}:${state.stateVersion}`,
    profileId: `trace-comparison-${side}`,
  });
  return chooseAiAction(input, {
    persistTacticalPlanMemory: false,
    quoteRandomizedTraceBidSelection: (request) =>
      quoteRandomizedTraceBidSelection(state, request),
  });
}

function applyDecision(state: GameState, decision: AiDecision): GameState {
  return applyDecisionWithEvent(state, decision).state;
}

function applyDecisionWithEvent(state: GameState, decision: AiDecision) {
  const result =
    decision.selectionKind === "engine_randomized_trace_bid_selection"
      ? applyRandomizedTraceBidSelection(state, {
          ...decision.engineCommand,
          idempotencyKey: `trace-comparison:${state.stateVersion}`,
        })
      : decision.selectionKind === undefined ||
          decision.selectionKind === "direct"
        ? applyAction(state, {
            matchId: state.matchId,
            side: state.activeSide,
            actionId: decision.actionId,
            clientKnownStateVersion: state.stateVersion,
            ...(decision.selectedChoices
              ? { selectedChoices: decision.selectedChoices }
              : {}),
            idempotencyKey: `trace-comparison:${state.stateVersion}`,
          })
        : undefined;
  if (!result) {
    throw new Error(`Unexpected decision kind ${decision.selectionKind}.`);
  }
  if (!result.ok) throw new Error(result.error.message);
  return result;
}

function traceState(
  profile: TraceRulesProfile,
  scenario: (typeof SCENARIOS)[number],
  seed: string,
): GameState {
  const state = createGame({
    seed,
    setupMode: "completed",
    traceRulesProfile: profile,
  });
  state.activeSide = "corp";
  state.corp.credits = scenario.corpCredits;
  state.runner.credits = scenario.runnerCredits;
  const runnerGripOverflow = state.runner.grip.slice(scenario.runnerGripCount);
  state.runner.grip = state.runner.grip.slice(0, scenario.runnerGripCount);
  state.runner.stack.push(...runnerGripOverflow);
  for (const instanceId of runnerGripOverflow) {
    const instance = state.cardInstances[instanceId];
    if (instance) instance.zone = { side: "runner", zone: "stack" };
  }
  const corpBidMax =
    profile === "modern_open" ? scenario.corpCredits : scenario.traceLimit;
  state.trace = {
    traceId: "trace_comparison_1",
    sourceCardInstanceId: state.corp.identity,
    sourceDefinitionId: scenario.sourceDefinitionId,
    traceRulesProfile: profile,
    traceLimit: scenario.traceLimit,
    effectiveTraceLimit: scenario.traceLimit,
    corpBidMax,
    status: "corp_bid",
    bidsRevealed: false,
    runnerLink: scenario.runnerLink,
    successEffect: scenario.successEffect,
  };
  state.pendingChoice = bidChoice(
    state,
    "corp",
    corpBidMax,
    profile === "modern_open" ? "public" : "hidden_info_barrier",
  );
  return state;
}

function bidChoice(
  state: GameState,
  side: Side,
  maximum: number,
  visibility: "public" | "hidden_info_barrier",
): NonNullable<GameState["pendingChoice"]> {
  return {
    choiceId: `trace_comparison_1.${side}.bid.${state.stateVersion}`,
    side,
    source: "trace:trace_comparison_1",
    prompt: "Trace-Gebot wählen",
    kind: "bid_amount",
    options: Array.from({ length: maximum + 1 }, (_, bid) => ({
      id: `bid_${bid}`,
      label: `${bid} Credits`,
      publicLabel:
        visibility === "public" ? `${bid} Credits` : "Gebot festlegen",
      value: bid,
    })),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion,
    visibility,
  };
}

function highestChoiceBid(state: GameState): number {
  const bids = state.pendingChoice?.options.flatMap((option) =>
    Number.isSafeInteger(option.value) ? [Number(option.value)] : [],
  );
  const maximum = bids?.length ? Math.max(...bids) : undefined;
  if (maximum === undefined) throw new Error("Trace bid options missing.");
  return maximum;
}

function deckSnapshot(
  state: GameState,
  side: Side,
): AiDeckStrategyDeckSnapshot {
  const zones =
    side === "corp"
      ? [...state.corp.hq, ...state.corp.rd, ...state.corp.archives]
      : [...state.runner.grip, ...state.runner.stack, ...state.runner.heap];
  const counts = new Map<string, number>();
  for (const instanceId of zones) {
    const definitionId = state.cardInstances[instanceId]?.definitionId;
    if (!definitionId) continue;
    counts.set(definitionId, (counts.get(definitionId) ?? 0) + 1);
  }
  return {
    deckSnapshotId: `trace-comparison-${side}`,
    side,
    cards: [...counts].map(([cardId, quantity]) => ({ cardId, quantity })),
  };
}

function profileMetrics(samples: readonly TraceSample[]): ProfileMetrics {
  const corpBids = samples.map((sample) => sample.corpBid);
  const runnerBids = samples.map((sample) => sample.runnerBid);
  return {
    attempts: samples.length,
    successRate: ratio(
      samples.filter((sample) => sample.successful).length,
      samples.length,
    ),
    averageCorpBid: average(corpBids),
    averageRunnerBid: average(runnerBids),
    corpZeroBidShare: ratio(
      corpBids.filter((bid) => bid === 0).length,
      samples.length,
    ),
    runnerZeroBidShare: ratio(
      runnerBids.filter((bid) => bid === 0).length,
      samples.length,
    ),
    corpMaximumBidShare: ratio(
      samples.filter((sample) => sample.corpBid === sample.corpBidMax).length,
      samples.length,
    ),
    runnerMaximumBidShare: ratio(
      samples.filter((sample) => sample.runnerBid === sample.runnerBidMax)
        .length,
      samples.length,
    ),
    corpBidVariance: variance(corpBids),
    runnerBidVariance: variance(runnerBids),
  };
}

function bidsFor(
  samples: readonly TraceSample[],
  profile: TraceRulesProfile,
  scenario: ScenarioId,
  field: "corpBid" | "runnerBid",
): number[] {
  return samples
    .filter(
      (sample) => sample.profile === profile && sample.scenario === scenario,
    )
    .map((sample) => sample[field]);
}

function average(values: readonly number[]): number {
  return rounded(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function variance(values: readonly number[]): number {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return rounded(
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length,
  );
}

function ratio(value: number, total: number): number {
  return rounded(value / total);
}

function rounded(value: number): number {
  return Math.round(value * 1000) / 1000;
}
