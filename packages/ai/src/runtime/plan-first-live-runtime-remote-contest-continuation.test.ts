import { describe, expect, it } from "vitest";
import type { LegalActionPayload } from "@netgrid/shared";

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

describe("plan-first Remote contest continuation", () => {
  it("preserves an affordable-trash parent payoff while the bound run-window leaf pumps through visible ICE", () => {
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
      knownAccessState: "known_payoff" as const,
      accessPayoff: "trash_affordable" as const,
      recommendation: "run_now" as const,
      pathCost: 9,
      creditsAfterRun: 1,
      score: 300,
      evidence: [
        "remote_memory_payoff:known",
        "access_decision_projection_known_root:onr_v1_347_vapor-ops",
        "known_remote_root_general_trash_cost:1",
      ],
    };
    const context = liveContext({
      evaluateRunnerRunTargets: (params: {
        input: { legalActions: Array<{ type: string }> };
      }) =>
        params.input.legalActions.some((action) => action.type === "start_run")
          ? [target]
          : [],
    });
    const vaporOps = visibleCard("vapor-ops", "corp", "asset", {
      definitionId: "onr_v1_347_vapor-ops",
      title: "Vapor Ops",
      rezzed: true,
      trashCost: 1,
    });
    const startInput = aiInput("runner", [startRun]);
    startInput.playerView.own.credits = 11;
    startInput.playerView.own.clicks = 4;
    startInput.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [vaporOps]),
    ];

    expect(context.chooseSemanticRuntimeAction(startInput, {})).toMatchObject({
      actionId: startRun.actionId,
      reasonCode: "plan_first.runner.contest_remote",
    });
    const root = residentPlanPortfolioSnapshot(startInput)?.instances.find(
      (instance) => instance.moduleId === "runner.contest_remote",
    );
    expect(root).toMatchObject({
      moduleState: {
        signal: {
          accessCommitment: {
            payoff: "trash_affordable",
            intendedAction: "trash",
            knownTargetDefinitionIds: ["onr_v1_347_vapor-ops"],
            trashBudget: 1,
          },
        },
      },
    });

    const pump = encounterAction("pump-loony-goon", "pump_breaker", 1, {
      breakerId: "loony-goon",
      iceId: "neural-blade",
      pumpStrengthAmount: 1,
    });
    const fireSubroutines = encounterAction(
      "fire-neural-blade-subroutines",
      "continue_run",
      0,
      {
        encounterContinue: true,
        encounterWillEndRun: false,
        unbrokenSubroutineCount: 2,
      },
    );
    const encounterInput = aiInput("runner", [pump, fireSubroutines]);
    encounterInput.playerView.stateVersion = 113;
    for (const action of encounterInput.legalActions) {
      action.expiresAtStateVersion = 113;
    }
    encounterInput.playerView.timingPoint = "run.encounter_ice";
    encounterInput.playerView.own.credits = 9;
    encounterInput.playerView.own.clicks = 3;
    encounterInput.playerView.own.rig = [
      visibleCard("loony-goon", "runner", "program", {
        definitionId: "onr_v1_040_loony-goon",
        title: "Loony Goon",
        subtypes: ["icebreaker"],
        strength: 2,
      }),
      visibleCard("codecracker", "runner", "program", {
        definitionId: "onr_v1_014_codecracker",
        title: "Codecracker",
        subtypes: ["icebreaker"],
        strength: 0,
      }),
      visibleCard("short-term-contract", "runner", "resource", {
        definitionId: "onr_v1_178_short-term-contract",
        title: "Short-Term Contract",
        counters: { bit: 4 },
      }),
    ];
    const neuralBlade = withEffectiveRunQuote(
      visibleCard("neural-blade", "corp", "ice", {
        definitionId: "onr_v1_258_neural-blade",
        title: "Neural Blade",
        subtypes: ["sentry"],
        rezzed: true,
        strength: 4,
      }),
      {
        effectiveStrength: 4,
        subroutines: [
          {
            id: "neural-blade-net-damage",
            type: "do_damage",
            sourceDefinitionId: "onr_v1_258_neural-blade",
            sourceTitle: "Neural Blade",
          },
          {
            id: "neural-blade-break-prohibition",
            type: "set_next_encounter_no_break_subroutines",
            sourceDefinitionId: "onr_v1_258_neural-blade",
            sourceTitle: "Neural Blade",
            unbrokenRunEffect: { preventsFutureBreaking: true },
          },
        ],
      },
    );
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
            id: "keeper-end-the-run",
            type: "end_the_run",
            sourceDefinitionId: "onr_v1_252_keeper",
            sourceTitle: "Keeper",
          },
        ],
      },
    );
    encounterInput.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [keeper, neuralBlade], [vaporOps]),
    ];
    encounterInput.playerView.run = {
      runId: "match-df965-remote-1",
      attackedServerId: "remote_1",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "remote_1", iceIndex: 1 },
      encounteredIce: neuralBlade,
      successful: false,
    };

    const decision = context.chooseSemanticRuntimeAction(encounterInput, {});
    const portfolio = residentPlanPortfolioSnapshot(encounterInput);
    const leaf = portfolio?.instances.find(
      (instance) => instance.moduleId === "runner.convert_run_window",
    );

    expect(decision).toMatchObject({
      actionId: pump.actionId,
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId: root?.instanceId,
          leafExecutorInstanceId: leaf?.instanceId,
          route: { actionId: pump.actionId },
        },
      },
    });
    expect(leaf).toMatchObject({
      parentInstanceId: root?.instanceId,
      moduleState: {
        signal: {
          accessCommitment: { payoff: "trash_affordable" },
          actionAssessments: {
            [pump.actionId]: {
              admissible: true,
              evidenceCodes: expect.arrayContaining([
                "runner_run_parent_payoff_preserved:trash_affordable",
              ]),
            },
          },
        },
      },
    });
  });
});

function encounterAction(
  actionId: string,
  type: "pump_breaker" | "continue_run",
  credits: number,
  payload: LegalActionPayload,
) {
  const action = legalAction(
    actionId,
    "runner",
    type,
    actionId,
    { credits, clicks: 0 },
    {
      source: type === "continue_run" ? "game_rule" : "loony-goon",
      payload,
    },
  );
  action.timingPoint = "run.encounter_ice";
  action.expiresAtStateVersion = 113;
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
      evidence: ["test_remote_contest_continuation"],
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
