import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { withEffectiveRunQuote } from "../effective-run-quote.test-support";
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
import { createSemanticRuntimeDecisionContext } from "./semantic-runtime-decision-context";
import type { SemanticRuntimeDecisionContextDependencies } from "./semantic-runtime-decision-context";

describe("plan-first information-probe reassessment", () => {
  it("converts the same Remote parent after a revealed affordable path and binds the current pump route", () => {
    resetResidentPlanPortfolioMemory();
    const startRun = legalAction(
      "run-remote-1",
      "runner",
      "start_run",
      "Run Remote 1",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "remote_1" } },
    );
    const target = {
      ...safeRuntimeRunTarget(startRun.actionId, "remote_1"),
      targetKind: "remote" as const,
      accessTargetKind: "remote" as const,
      knownAccessState: "unknown" as const,
      accessPayoff: "unknown" as const,
      recommendation: "run_if_free" as const,
      pathCost: 0,
      score: 180,
    };
    const context = liveContext({
      evaluateRunnerRunTargets: (params: {
        input: { legalActions: Array<{ type: string }> };
      }) =>
        params.input.legalActions.some((action) => action.type === "start_run")
          ? [target]
          : [],
    });
    const startInput = aiInput("runner", [startRun]);
    startInput.playerView.own.credits = 10;
    startInput.playerView.own.clicks = 3;
    const unknownRemoteRoot = {
      ...visibleCard("remote-root", "corp", "asset"),
      known: false,
      definitionId: undefined,
      title: "Unknown remote card",
      type: undefined,
    };
    startInput.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [unknownRemoteRoot]),
    ];

    expect(context.chooseSemanticRuntimeAction(startInput, {})).toMatchObject({
      actionId: startRun.actionId,
      reasonCode: "plan_first.runner.contest_remote",
    });
    const rootBeforeReveal = residentPlanPortfolioSnapshot(
      startInput,
    )?.instances.find(
      (instance) => instance.moduleId === "runner.contest_remote",
    );
    expect(rootBeforeReveal).toMatchObject({
      moduleState: { signal: { purpose: "information" } },
    });

    const pump = encounterAction("aaa-pump-krash", "pump_breaker", 2, {
      breakerId: "krash",
      iceId: "data-wall-2",
      pumpStrengthAmount: 1,
    });
    const endEncounter = encounterAction(
      "zzz-let-end-the-run-fire",
      "continue_run",
      0,
      {
        encounterContinue: true,
        encounterWillEndRun: true,
        unbrokenSubroutineCount: 1,
      },
    );
    const encounterInput = aiInput("runner", [pump, endEncounter]);
    encounterInput.playerView.stateVersion = 2;
    for (const action of encounterInput.legalActions) {
      action.expiresAtStateVersion = 2;
    }
    encounterInput.playerView.timingPoint = "run.encounter_ice";
    encounterInput.playerView.own.credits = 10;
    encounterInput.playerView.own.clicks = 2;
    encounterInput.playerView.own.rig = [
      visibleCard("krash", "runner", "program", {
        definitionId: "onr_v1_039_krash",
        title: "Krash",
        subtypes: ["icebreaker"],
        strength: 0,
      }),
    ];
    const dataWall = withEffectiveRunQuote(
      visibleCard("data-wall-2", "corp", "ice", {
        definitionId: "onr_v1_238_data-wall-2-0",
        title: "Data Wall 2.0",
        subtypes: ["wall"],
        rezzed: true,
        strength: 1,
      }),
      {
        effectiveStrength: 1,
        subroutines: [
          {
            id: "data-wall-2-etr",
            type: "end_the_run",
            sourceDefinitionId: "onr_v1_238_data-wall-2-0",
            sourceTitle: "Data Wall 2.0",
          },
        ],
      },
    );
    encounterInput.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [dataWall], [unknownRemoteRoot]),
    ];
    encounterInput.playerView.run = {
      runId: "probe-remote-1",
      attackedServerId: "remote_1",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "remote_1", iceIndex: 0 },
      encounteredIce: dataWall,
      successful: false,
    };

    const decision = context.chooseSemanticRuntimeAction(encounterInput, {});

    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_action_assessment_evidence:runner_information_boundary_reassessment",
        "plan_action_assessment_evidence:runner_information_boundary_decision:convert_to_contest",
        "plan_action_assessment_evidence:runner_information_boundary_known_path_cost:4",
        "plan_action_assessment_evidence:runner_information_boundary_encounter_budget:4",
      ]),
    );
    expect(
      residentPlanPortfolioSnapshot(encounterInput)?.instances.find(
        (instance) => instance.moduleId === "runner.convert_run_window",
      ),
    ).toMatchObject({
      parentInstanceId: rootBeforeReveal?.instanceId,
      moduleState: {
        signal: {
          actionAssessments: {
            [pump.actionId]: { admissible: true },
            [endEncounter.actionId]: { admissible: false },
          },
        },
      },
    });
    expect(decision).toMatchObject({
      actionId: pump.actionId,
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId: rootBeforeReveal?.instanceId,
          route: { actionId: pump.actionId },
        },
      },
    });
    expect(
      residentPlanPortfolioSnapshot(encounterInput)?.instances.find(
        (instance) => instance.instanceId === rootBeforeReveal?.instanceId,
      ),
    ).toMatchObject({
      moduleState: {
        signal: {
          purpose: "contest",
          encounterCreditSpendLimit: 4,
          informationBoundaryReassessment: {
            decision: "convert_to_contest",
            observedIceInstanceId: dataWall.instanceId,
          },
        },
      },
    });

    const secondPump = encounterAction(
      "pump-krash-at-keeper",
      "pump_breaker",
      2,
      {
        breakerId: "krash",
        iceId: "keeper-after-data-wall",
        pumpStrengthAmount: 1,
      },
    );
    const secondEndEncounter = encounterAction(
      "continue-keeper-etr",
      "continue_run",
      0,
      {
        encounterContinue: true,
        encounterWillEndRun: true,
        unbrokenSubroutineCount: 1,
      },
    );
    const secondEncounterInput = aiInput("runner", [
      secondPump,
      secondEndEncounter,
    ]);
    secondEncounterInput.playerView.stateVersion = 3;
    for (const action of secondEncounterInput.legalActions) {
      action.expiresAtStateVersion = 3;
    }
    secondEncounterInput.playerView.timingPoint = "run.encounter_ice";
    secondEncounterInput.playerView.own.credits = 6;
    secondEncounterInput.playerView.own.clicks = 2;
    secondEncounterInput.playerView.own.rig = [
      visibleCard("krash", "runner", "program", {
        definitionId: "onr_v1_039_krash",
        title: "Krash",
        subtypes: ["icebreaker"],
        strength: 1,
      }),
    ];
    const keeperAfterDataWall = withEffectiveRunQuote(
      visibleCard("keeper-after-data-wall", "corp", "ice", {
        definitionId: "onr_v1_252_keeper",
        title: "Keeper",
        subtypes: ["code_gate"],
        rezzed: true,
        strength: 4,
      }),
      {
        effectiveStrength: 4,
        subroutines: [
          {
            id: "keeper-after-data-wall-etr",
            type: "end_the_run",
            sourceDefinitionId: "onr_v1_252_keeper",
            sourceTitle: "Keeper",
          },
        ],
      },
    );
    secondEncounterInput.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [keeperAfterDataWall, dataWall], [unknownRemoteRoot]),
    ];
    secondEncounterInput.playerView.run = {
      runId: "probe-remote-1",
      attackedServerId: "remote_1",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "remote_1", iceIndex: 0 },
      encounteredIce: keeperAfterDataWall,
      successful: false,
    };

    const secondDecision = context.chooseSemanticRuntimeAction(
      secondEncounterInput,
      {},
    );

    expect(secondDecision).toMatchObject({
      actionId: secondEndEncounter.actionId,
      reasonCode: "plan_first.runner.convert_run_window",
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId: rootBeforeReveal?.instanceId,
          route: { actionId: secondEndEncounter.actionId },
        },
      },
    });
    expect(secondDecision.evidence).toEqual(
      expect.arrayContaining([
        "plan_action_assessment_evidence:runner_information_boundary_previous_purpose:contest",
        "plan_action_assessment_evidence:runner_information_boundary_decision:retain_information",
      ]),
    );
    expect(
      residentPlanPortfolioSnapshot(secondEncounterInput)?.instances.find(
        (instance) => instance.instanceId === rootBeforeReveal?.instanceId,
      ),
    ).toMatchObject({
      moduleState: {
        signal: {
          purpose: "information",
          informationBoundaryReassessment: {
            observedIceInstanceId: keeperAfterDataWall.instanceId,
            decision: "retain_information",
          },
        },
      },
    });
  });

  it("retains the information purpose when the revealed full path is not payable", () => {
    resetResidentPlanPortfolioMemory();
    const startRun = legalAction(
      "run-rd",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "rd" } },
    );
    const target = {
      ...safeRuntimeRunTarget(startRun.actionId, "rd"),
      knownAccessState: "unknown" as const,
      accessPayoff: "fresh" as const,
      recommendation: "run_if_free" as const,
      pathCost: 0,
      score: 160,
    };
    const context = liveContext({
      evaluateRunnerRunTargets: (params: {
        input: { legalActions: Array<{ type: string }> };
      }) =>
        params.input.legalActions.some((action) => action.type === "start_run")
          ? [target]
          : [],
    });
    const startInput = aiInput("runner", [startRun]);
    startInput.playerView.own.credits = 3;
    startInput.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
    ];
    context.chooseSemanticRuntimeAction(startInput, {});

    const pump = encounterAction("pump-krash", "pump_breaker", 2, {
      breakerId: "krash",
      iceId: "keeper",
      pumpStrengthAmount: 1,
    });
    const endEncounter = encounterAction("continue-etr", "continue_run", 0, {
      encounterContinue: true,
      encounterWillEndRun: true,
      unbrokenSubroutineCount: 1,
    });
    const encounterInput = aiInput("runner", [pump, endEncounter]);
    encounterInput.playerView.stateVersion = 2;
    for (const action of encounterInput.legalActions) {
      action.expiresAtStateVersion = 2;
    }
    encounterInput.playerView.timingPoint = "run.encounter_ice";
    encounterInput.playerView.own.credits = 3;
    encounterInput.playerView.own.rig = [
      visibleCard("krash", "runner", "program", {
        definitionId: "onr_v1_039_krash",
        subtypes: ["icebreaker"],
        strength: 0,
      }),
    ];
    const keeper = withEffectiveRunQuote(
      visibleCard("keeper", "corp", "ice", {
        definitionId: "onr_v1_252_keeper",
        title: "Keeper",
        subtypes: ["code_gate"],
        rezzed: true,
        strength: 4,
      }),
      {
        effectiveStrength: 4,
        subroutines: [
          {
            id: "keeper-etr",
            type: "end_the_run",
            sourceDefinitionId: "onr_v1_252_keeper",
            sourceTitle: "Keeper",
          },
        ],
      },
    );
    encounterInput.playerView.servers = [
      server("hq"),
      server("rd", [keeper]),
      server("archives"),
    ];
    encounterInput.playerView.run = {
      runId: "probe-rd",
      attackedServerId: "rd",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "rd", iceIndex: 0 },
      encounteredIce: keeper,
      successful: false,
    };

    const decision = context.chooseSemanticRuntimeAction(encounterInput, {});

    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_action_assessment_evidence:runner_information_boundary_decision:retain_information",
      ]),
    );
    expect(decision.actionId).toBe(endEncounter.actionId);
    expect(
      residentPlanPortfolioSnapshot(encounterInput)?.instances.find(
        (instance) => instance.moduleId === "runner.pressure_central",
      ),
    ).toMatchObject({
      moduleState: {
        signal: {
          purpose: "information",
          informationBoundaryReassessment: {
            decision: "retain_information",
          },
        },
      },
    });
  });
});

function encounterAction(
  actionId: string,
  type: "pump_breaker" | "break_subroutine" | "continue_run",
  credits: number,
  payload: Record<string, unknown>,
) {
  const action = legalAction(
    actionId,
    "runner",
    type,
    actionId,
    { credits, clicks: 0 },
    { source: type === "continue_run" ? "game_rule" : "krash", payload },
  );
  action.timingPoint = "run.encounter_ice";
  action.expiresAtStateVersion = 2;
  return action;
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
      evidence: ["test_information_probe_reassessment"],
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
