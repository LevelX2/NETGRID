import { afterEach, describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";
import {
  aiInput,
  legalAction,
  safeRuntimeRunTarget,
  server,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import { runnerCentralPressureHasExecutableEventRun } from "../runtime/plan-first-live-runtime";
import { createSemanticRuntimeDecisionContext } from "../runtime/semantic-runtime-decision-context";
import type { SemanticRuntimeDecisionContextDependencies } from "../runtime/semantic-runtime-decision-context";
import { withEffectiveRunQuote } from "../effective-run-quote.test-support";

const DIRECT_RD_ACTION_ID = "runner.start_run.rd";
const INSIDE_JOB_RD_ACTION_ID = "runner.play.inside-job.rd";
const SOCIAL_ENGINEERING_ACTION_ID = "runner.play.social-engineering";

afterEach(() => {
  resetResidentPlanPortfolioMemory();
});

describe("Inside Job central plan-first coverage", () => {
  it("keeps the executable Inside Job route plan-owned despite both competing routes", () => {
    const { input, insideJobEvaluation, directRunEvaluation } =
      insideJobConflictFixture();

    const decision = liveContext({
      evaluateRunnerRunTargets: () => [
        insideJobEvaluation,
        directRunEvaluation,
      ],
    }).chooseSemanticRuntimeAction(input, {});

    expect(input.legalActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: INSIDE_JOB_RD_ACTION_ID,
          type: "play_event",
          payload: expect.objectContaining({ serverId: "rd" }),
        }),
        expect.objectContaining({
          actionId: SOCIAL_ENGINEERING_ACTION_ID,
          type: "play_event",
        }),
        expect.objectContaining({
          actionId: DIRECT_RD_ACTION_ID,
          type: "start_run",
          payload: expect.objectContaining({ serverId: "rd" }),
        }),
      ]),
    );
    expect(insideJobEvaluation).toMatchObject({
      actionId: INSIDE_JOB_RD_ACTION_ID,
      targetServerId: "rd",
      pathPassability: "reachable",
      recommendation: "run_now",
    });
    expect(insideJobEvaluation.score).toBeGreaterThan(0);
    expect(decision).toMatchObject({
      actionId: INSIDE_JOB_RD_ACTION_ID,
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.pressure_central",
      },
    });

    const portfolio = residentPlanPortfolioSnapshot(input);
    const executor = portfolio?.instances.find(
      (instance) => instance.instanceId === portfolio.executorInstanceId,
    );
    expect(executor).toMatchObject({
      moduleId: "runner.pressure_central",
      moduleState: {
        signal: {
          serverId: "rd",
          reachable: true,
          runActionIds: expect.arrayContaining([INSIDE_JOB_RD_ACTION_ID]),
        },
      },
    });
    expect(JSON.stringify(executor?.moduleState)).not.toContain(
      SOCIAL_ENGINEERING_ACTION_ID,
    );
  });

  it("preserves a lone bypass event when a blind basic R&D route is already competitive", () => {
    const { input, insideJobEvaluation, directRunEvaluation } =
      insideJobConflictFixture();
    const rd = input.playerView.servers.find((entry) => entry.id === "rd");
    if (!rd) throw new Error("Missing R&D server");
    rd.ice = [
      {
        ...visibleCard("rd-unknown-ice", "corp", "ice", {
          rezzed: false,
        }),
        known: false,
        rezzed: false,
      },
    ];
    const evaluatedInsideJob = {
      ...insideJobEvaluation,
      score: 205,
      consumableRunOpportunityQuote: {
        schemaVersion: "runner-consumable-run-opportunity-v1" as const,
        kind: "bypass_first_ice" as const,
        sourceDefinitionId: "onr_v1_094_inside-job",
        gripCopyCount: 1,
        handAtCapacity: false,
        baseOpportunityCost: 45,
        duplicateRelief: 0,
        handCapacityRelief: 0,
        immediatePayoffRelief: 0,
        opportunityCost: 45,
        rawRouteScore: 250,
        effectiveRouteScore: 205,
        evidence: [
          "consumable_run_opportunity_cost:45",
          "consumable_run_raw_route_score:250",
          "consumable_run_effective_route_score:205",
        ],
      },
      runActionProjection: {
        ...insideJobEvaluation.runActionProjection,
        sourceKind: "event" as const,
      },
    };
    const evaluatedDirectRun = {
      ...directRunEvaluation,
      pathPassability: "reachable" as const,
      recommendation: "run_now" as const,
      score: 215,
    };

    const decision = liveContext({
      evaluateRunnerRunTargets: () => [evaluatedInsideJob, evaluatedDirectRun],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: DIRECT_RD_ACTION_ID,
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.pressure_central",
      },
    });
    const alternatives = decision.decisionDebug?.actionAlternatives;
    expect(
      alternatives?.find(
        (alternative) => alternative.actionId === INSIDE_JOB_RD_ACTION_ID,
      ),
    ).toMatchObject({
      selected: false,
      score: 205,
      scoreBreakdown: [
        expect.objectContaining({ key: "run_route_raw_score", value: 250 }),
        expect.objectContaining({
          key: "consumable_run_opportunity_cost",
          value: -45,
        }),
      ],
      whyNot: expect.arrayContaining([
        "run_route_raw_score:250",
        "run_route_opportunity_cost:45",
        "run_route_effective_score:205",
      ]),
    });
  });

  it("still spends the bypass event when a second grip copy makes its effective route better", () => {
    const { input, insideJobEvaluation, directRunEvaluation } =
      insideJobConflictFixture();
    const rd = input.playerView.servers.find((entry) => entry.id === "rd");
    if (!rd) throw new Error("Missing R&D server");
    rd.ice = [
      {
        ...visibleCard("rd-unknown-ice", "corp", "ice", {
          rezzed: false,
        }),
        known: false,
        rezzed: false,
      },
    ];
    input.playerView.own.gripOrHq.push(
      visibleCard("inside-job-backup", "runner", "event", {
        definitionId: "onr_v1_094_inside-job",
        title: "Inside Job",
      }),
    );
    const evaluatedInsideJob = {
      ...insideJobEvaluation,
      score: 220,
      consumableRunOpportunityQuote: {
        ...insideJobEvaluation.consumableRunOpportunityQuote,
        gripCopyCount: 2,
        duplicateRelief: 15,
        opportunityCost: 30,
        rawRouteScore: 250,
        effectiveRouteScore: 220,
        evidence: [
          "consumable_run_grip_copy_count:2",
          "consumable_run_opportunity_cost:30",
          "consumable_run_raw_route_score:250",
          "consumable_run_effective_route_score:220",
        ],
      },
    };
    const evaluatedDirectRun = {
      ...directRunEvaluation,
      pathPassability: "reachable" as const,
      recommendation: "run_now" as const,
      score: 215,
    };

    const decision = liveContext({
      evaluateRunnerRunTargets: () => [evaluatedInsideJob, evaluatedDirectRun],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: INSIDE_JOB_RD_ACTION_ID,
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
    });
  });

  it.each([
    {
      label: "unreachable pressure route",
      signalOverride: { reachable: false },
    },
    {
      label: "non-positive marginal value",
      signalOverride: { marginalValue: 0 },
    },
    {
      label: "action-specific route exclusion",
      signalOverride: {
        runActionExclusions: {
          [INSIDE_JOB_RD_ACTION_ID]: ["unpayable_current_route"],
        },
      },
    },
  ])(
    "does not let the Event guard mask Social Engineering for $label",
    ({ signalOverride }) => {
      const { input, insideJobEvaluation } = insideJobConflictFixture();
      const candidates = buildActionSemanticCandidates(input);
      const signal = {
        pressureId: "central-pressure:rd",
        serverId: "rd",
        reachable: true,
        marginalValue: insideJobEvaluation.score,
        runActionIds: [INSIDE_JOB_RD_ACTION_ID],
        ...signalOverride,
      } as unknown as Parameters<
        typeof runnerCentralPressureHasExecutableEventRun
      >[0];

      expect(
        runnerCentralPressureHasExecutableEventRun(signal, candidates, [
          insideJobEvaluation,
        ] as Parameters<typeof runnerCentralPressureHasExecutableEventRun>[2]),
      ).toBe(false);
    },
  );
});

function insideJobConflictFixture() {
  const insideJob = legalAction(
    INSIDE_JOB_RD_ACTION_ID,
    "runner",
    "play_event",
    "Inside Job auf R&D",
    { credits: 2, clicks: 1 },
    {
      source: "inside-job-card",
      payload: {
        cardId: "inside-job-card",
        sourceDefinitionId: "onr_v1_094_inside-job",
        serverId: "rd",
        effectKind: "run",
        bypassFirstIce: true,
      },
    },
  );
  const socialEngineering = legalAction(
    SOCIAL_ENGINEERING_ACTION_ID,
    "runner",
    "play_event",
    "Social Engineering spielen",
    { credits: 1, clicks: 1 },
    {
      source: "social-engineering-card",
      payload: {
        cardId: "social-engineering-card",
        sourceDefinitionId: "onr_v1_111_social-engineering",
      },
    },
  );
  const directRun = legalAction(
    DIRECT_RD_ACTION_ID,
    "runner",
    "start_run",
    "Run R&D",
    { credits: 0, clicks: 1 },
    {
      payload: { serverId: "rd" },
    },
  );
  const input = aiInput("runner", [insideJob, socialEngineering, directRun]);
  input.playerView.own.credits = 5;
  input.playerView.own.clicks = 4;
  input.playerView.opponent.deckCount = 10;
  input.playerView.own.gripOrHq = [
    visibleCard("inside-job-card", "runner", "event", {
      definitionId: "onr_v1_094_inside-job",
      title: "Inside Job",
    }),
    visibleCard("social-engineering-card", "runner", "event", {
      definitionId: "onr_v1_111_social-engineering",
      title: "Social Engineering",
    }),
  ];
  input.playerView.own.rig = [];
  input.playerView.servers = [
    server("hq"),
    server("rd", [
      withEffectiveRunQuote(
        visibleCard("rd-wall", "corp", "ice", {
          definitionId: "onr_v1_232_crystal-wall",
          title: "Crystal Wall",
          rezzed: true,
          subtypes: ["wall"],
          strength: 3,
        }),
        {
          effectiveStrength: 3,
          subroutines: [
            {
              id: "rd-wall-end-the-run",
              type: "end_the_run",
              sourceDefinitionId: "onr_v1_232_crystal-wall",
              sourceTitle: "Crystal Wall",
            },
          ],
        },
      ),
    ]),
    server("archives"),
  ];

  const insideJobEvaluation = {
    ...safeRuntimeRunTarget(INSIDE_JOB_RD_ACTION_ID, "rd"),
    knownAccessState: "unknown",
    score: 215,
    consumableRunOpportunityQuote: {
      schemaVersion: "runner-consumable-run-opportunity-v1" as const,
      kind: "bypass_first_ice" as const,
      sourceDefinitionId: "onr_v1_094_inside-job",
      gripCopyCount: 1,
      handAtCapacity: false,
      baseOpportunityCost: 45,
      duplicateRelief: 0,
      handCapacityRelief: 0,
      immediatePayoffRelief: 0,
      opportunityCost: 45,
      rawRouteScore: 260,
      effectiveRouteScore: 215,
      evidence: [
        "consumable_run_opportunity_cost:45",
        "consumable_run_raw_route_score:260",
        "consumable_run_effective_route_score:215",
      ],
    },
    runActionProjection: {
      ...safeRuntimeRunTarget(INSIDE_JOB_RD_ACTION_ID, "rd")
        .runActionProjection,
      actionType: "play_event",
      sourceKind: "event",
      structure: "card_run",
      bypassFirstIce: true,
    },
  };
  const directRunEvaluation = {
    ...safeRuntimeRunTarget(DIRECT_RD_ACTION_ID, "rd"),
    pathPassability: "blocked_missing_coverage",
    recommendation: "find_breaker_first",
    score: -320,
  };
  return { input, insideJobEvaluation, directRunEvaluation };
}

function liveContext(overrides: Record<string, unknown> = {}) {
  const dependencies = {
    buildActionSemanticCandidates,
    deckCapabilitiesForInput: () => ({}),
    runnerStrategicIntentForInput: () => ({
      primaryWinIntent: "runner.access_agendas",
    }),
    evaluateRunnerHandDevelopment: () => [],
    buildRunnerEconomyPosture: () => ({
      minimumCreditFloor: 0,
      desiredCreditReserve: 0,
      fundingNeed: false,
      evidence: [],
    }),
    evaluateRunnerRunTargets: () => [],
    runnerEncounterActionExclusion: () => undefined,
    semanticRuntimeChoices: () => [],
    selectedChoicesForDecision: () => undefined,
    practicalMicroRuntimeCandidates: () => [],
    ...overrides,
  } as unknown as SemanticRuntimeDecisionContextDependencies;
  return createSemanticRuntimeDecisionContext(dependencies);
}
