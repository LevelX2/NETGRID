import { describe, expect, it } from "vitest";
import {
  sanitizeAiDecisionDebug,
  type LegalActionPayload,
  type VisibleCard,
} from "@netgrid/shared";

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

  it("keeps the admitted full-path Remote run bound through a known Filter instead of reapplying the turn reserve", () => {
    resetResidentPlanPortfolioMemory();
    const startRun = legalAction(
      "run-remote-1-known-filter",
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
      runCommitment: "full_path" as const,
      unknownUnrezzedIceCount: 0,
      prerunReserveQuote: {
        purpose: "contest" as const,
        status: "not_required" as const,
        riskTolerance: "standard" as const,
        knownPathCost: 0,
        creditsAfterKnownPath: 1,
        unknownIceCount: 0,
        unknownIcePositions: [],
        corpRezCredits: 12,
        visibleCoverage: "full" as const,
        requiredCredits: 0,
        creditGap: 0,
        requiredHandBuffer: 0,
        handBufferGap: 0,
        evidence: ["match_979f6c9b9feeb640_full_known_path"],
      },
      recommendation: "run_now" as const,
      pathCost: 0,
      creditsAfterRun: 1,
      score: 300,
      evidence: [
        "remote_memory_payoff:known",
        "access_decision_projection_known_root:onr_v1_312_chicago-branch",
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
      runnerEncounterActionExclusion: (
        _input: unknown,
        action: { type: string },
      ) =>
        action.type === "break_subroutine"
          ? {
              key: "encounter_remote_payoff_reserve_would_break",
              label: "Break macht Remote-Ziel unbezahlbar",
              reason: [
                "encounter_action:break_subroutine",
                "encounter_remote_payoff_blocked:true",
                "encounter_remote_trash_decline_reason:reserve_would_break",
              ].join("|"),
            }
          : undefined,
    });
    const chicagoBranch = visibleCard("chicago-branch", "corp", "asset", {
      definitionId: "onr_v1_312_chicago-branch",
      title: "Chicago Branch",
      rezzed: true,
      trashCost: 1,
    });
    const filter = withEffectiveRunQuote(
      visibleCard("known-filter", "corp", "ice", {
        definitionId: "onr_v1_244_filter",
        title: "Filter",
        subtypes: ["code_gate"],
        rezzed: true,
        strength: 0,
      }),
      {
        effectiveStrength: 0,
        subroutines: [
          {
            id: "known-filter-end-the-run",
            type: "end_the_run",
            sourceDefinitionId: "onr_v1_244_filter",
            sourceTitle: "Filter",
          },
        ],
      },
    );
    const startInput = aiInput("runner", [startRun]);
    startInput.playerView.own.credits = 1;
    startInput.playerView.opponent.credits = 12;
    startInput.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [filter], [chicagoBranch]),
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
          runRiskContract: { runCommitment: "full_path" },
          accessCommitment: {
            payoff: "trash_affordable",
            intendedAction: "trash",
          },
        },
      },
    });

    const breakFilter = legalAction(
      "break-known-filter",
      "runner",
      "break_subroutine",
      "Codecracker: Subroutine brechen",
      { credits: 0, clicks: 0 },
      {
        source: "codecracker",
        payload: {
          breakerId: "codecracker",
          iceId: filter.instanceId,
          subroutineIndex: 0,
        },
      },
    );
    const resolveFilter = legalAction(
      "resolve-known-filter",
      "runner",
      "continue_run",
      "Subroutine auslösen (Run endet)",
      { credits: 0, clicks: 0 },
      {
        payload: {
          encounterContinue: true,
          encounterWillEndRun: true,
          unbrokenSubroutineCount: 1,
        },
      },
    );
    const encounterInput = aiInput("runner", [breakFilter, resolveFilter]);
    encounterInput.playerView.stateVersion = 2;
    encounterInput.playerView.timingPoint = "run.encounter_ice";
    for (const action of encounterInput.legalActions) {
      action.expiresAtStateVersion = 2;
      action.timingPoint = "run.encounter_ice";
    }
    encounterInput.playerView.own.credits = 1;
    encounterInput.playerView.own.rig = [
      visibleCard("codecracker", "runner", "program", {
        definitionId: "onr_v1_014_codecracker",
        title: "Codecracker",
        subtypes: ["icebreaker"],
        strength: 0,
      }),
    ];
    encounterInput.playerView.opponent.credits = 12;
    encounterInput.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [filter], [chicagoBranch]),
    ];
    encounterInput.playerView.run = {
      runId: "match-979-known-filter",
      attackedServerId: "remote_1",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "remote_1", iceIndex: 0 },
      encounteredIce: filter,
      successful: false,
    };

    const decision = context.chooseSemanticRuntimeAction(encounterInput, {});
    const leaf = residentPlanPortfolioSnapshot(encounterInput)?.instances.find(
      (instance) => instance.moduleId === "runner.convert_run_window",
    );

    expect(decision).toMatchObject({
      actionId: breakFilter.actionId,
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId: root?.instanceId,
          leafExecutorInstanceId: leaf?.instanceId,
          route: { actionId: breakFilter.actionId },
        },
      },
    });
    expect(leaf).toMatchObject({
      parentInstanceId: root?.instanceId,
      moduleState: {
        signal: {
          runRiskReassessment: { decision: "preserve_continuation" },
          actionAssessments: {
            [breakFilter.actionId]: {
              admissible: true,
              evidenceCodes: expect.arrayContaining([
                "runner_full_path_commitment_preserved",
                "runner_full_path_commitment_overrode_encounter_exclusion:encounter_remote_payoff_reserve_would_break",
              ]),
            },
          },
        },
      },
    });
  });

  it("continues toward one unknown inner ICE while the admitted run-risk contract is still satisfied", () => {
    const { startDecision, decision, leaf, root } = runRiskContractScenario({
      currentCredits: 4,
      currentGripCount: 3,
    });

    expect(startDecision.decisionDebug?.planFirstDecision).toMatchObject({
      selectedStep: {
        planInstanceId: expect.any(String),
        stepId: expect.any(String),
      },
      selectedRunQuote: {
        schemaVersion: "ai-selected-run-quote-v1",
        actionId: "run-remote-1-risk-contract",
        serverId: "remote_1",
        purpose: "contest",
        pathCost: 0,
        creditsBeforeRun: 4,
        creditsAfterRun: 4,
        score: 300,
        reachable: true,
        runCommitment: "probe_only",
        reserveQuote: {
          requiredCredits: 4,
          creditGap: 0,
          requiredHandBuffer: 3,
          handBufferGap: 0,
        },
        riskContract: {
          unrezzedIceRisk: 0.81,
          runnerCreditsAtEntry: 4,
          reserveQuote: { creditGap: 0, handBufferGap: 0 },
        },
      },
    });
    expect(
      sanitizeAiDecisionDebug(startDecision.decisionDebug)?.planFirstDecision
        ?.selectedRunQuote,
    ).toMatchObject({
      actionId: "run-remote-1-risk-contract",
      reserveQuote: { creditGap: 0, handBufferGap: 0 },
    });

    expect(decision).toMatchObject({
      actionId: "continue-remote-1-risk-contract",
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId: root?.instanceId,
          leafExecutorInstanceId: leaf?.instanceId,
          route: { actionId: "continue-remote-1-risk-contract" },
        },
      },
    });
    expect(root).toMatchObject({
      moduleId: "runner.contest_remote",
      moduleState: {
        signal: {
          runRiskContract: {
            runCommitment: "probe_only",
            reserveQuote: {
              requiredCredits: 4,
              creditGap: 0,
              requiredHandBuffer: 3,
              handBufferGap: 0,
            },
          },
        },
      },
    });
    expect(leaf).toMatchObject({
      moduleId: "runner.convert_run_window",
      parentInstanceId: root?.instanceId,
      moduleState: {
        signal: {
          runRiskReassessment: {
            decision: "preserve_continuation",
            baselineReserveQuote: { creditGap: 0, handBufferGap: 0 },
            currentReserveQuote: { creditGap: 0, handBufferGap: 0 },
          },
        },
      },
    });
  });

  it("prefers jack-out in the same bound run-window leaf after material liquidity degradation", () => {
    const { decision, leaf, root } = runRiskContractScenario({
      currentCredits: 2,
      currentGripCount: 3,
    });

    expect(decision).toMatchObject({
      actionId: "jack-out-remote-1-risk-contract",
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId: root?.instanceId,
          leafExecutorInstanceId: leaf?.instanceId,
          route: { actionId: "jack-out-remote-1-risk-contract" },
        },
      },
    });
    expect(root?.moduleId).toBe("runner.contest_remote");
    expect(leaf).toMatchObject({
      moduleId: "runner.convert_run_window",
      parentInstanceId: root?.instanceId,
      moduleState: {
        signal: {
          safetyIntent: "jack_out",
          safetyEvidenceCode: "runner_run_risk_contract_degraded:remote_1",
          runRiskReassessment: {
            decision: "prefer_jack_out",
            baselineReserveQuote: { creditGap: 0 },
            currentReserveQuote: { creditGap: 1 },
          },
        },
      },
    });
  });

  it("prefers jack-out when the admitted hand buffer degrades before unknown ICE", () => {
    const { decision, leaf, root } = runRiskContractScenario({
      currentCredits: 4,
      currentGripCount: 2,
    });

    expect(decision.actionId).toBe("jack-out-remote-1-risk-contract");
    expect(root?.moduleId).toBe("runner.contest_remote");
    expect(leaf).toMatchObject({
      moduleId: "runner.convert_run_window",
      parentInstanceId: root?.instanceId,
      moduleState: {
        signal: {
          runRiskReassessment: {
            decision: "prefer_jack_out",
            currentReserveQuote: { handBufferGap: 1 },
          },
        },
      },
    });
  });

  it("keeps running after Corp rez exposure disappears, but not when visible free-rez support remains", () => {
    const noRezExposure = runRiskContractScenario({
      currentCredits: 2,
      currentGripCount: 3,
      currentCorpCredits: 0,
    });
    expect(noRezExposure.decision.actionId).toBe(
      "continue-remote-1-risk-contract",
    );
    expect(noRezExposure.leaf).toMatchObject({
      parentInstanceId: noRezExposure.root?.instanceId,
      moduleState: {
        signal: {
          runRiskReassessment: {
            decision: "preserve_continuation",
            currentReserveQuote: {
              status: "not_required",
              creditGap: 0,
              handBufferGap: 0,
            },
          },
        },
      },
    });

    const visibleFreeRezExposure = runRiskContractScenario({
      currentCredits: 1,
      currentGripCount: 3,
      currentCorpCredits: 0,
      currentVisibleRezSupport: true,
    });
    expect(visibleFreeRezExposure.decision.actionId).toBe(
      "jack-out-remote-1-risk-contract",
    );
    expect(visibleFreeRezExposure.leaf).toMatchObject({
      parentInstanceId: visibleFreeRezExposure.root?.instanceId,
      moduleState: {
        signal: {
          runRiskReassessment: {
            decision: "prefer_jack_out",
            currentReserveQuote: {
              status: "blocked",
              creditGap: 1,
              handBufferGap: 0,
            },
          },
        },
      },
    });
  });
});

function runRiskContractScenario(params: {
  currentCredits: number;
  currentGripCount: number;
  currentCorpCredits?: number;
  currentVisibleRezSupport?: boolean;
}) {
  resetResidentPlanPortfolioMemory();
  const startRun = legalAction(
    "run-remote-1-risk-contract",
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
    runCommitment: "probe_only" as const,
    unknownUnrezzedIceCount: 1,
    unrezzedIceRisk: 0.81,
    unrezzedIceRiskCreditBuffer: 4,
    visibleDuringRunRezSupport: false,
    prerunReserveQuote: {
      purpose: "contest" as const,
      status: "satisfied" as const,
      riskTolerance: "standard" as const,
      knownPathCost: 0,
      creditsAfterKnownPath: 4,
      unknownIceCount: 1,
      unknownIcePositions: [0],
      corpRezCredits: 14,
      visibleCoverage: "none" as const,
      requiredCredits: 4,
      creditGap: 0,
      requiredHandBuffer: 3,
      handBufferGap: 0,
      evidence: ["test_run_risk_contract_satisfied"],
    },
    recommendation: "run_now" as const,
    score: 300,
    evidence: ["remote_memory_payoff:known"],
  };
  const context = liveContext({
    evaluateRunnerRunTargets: (input: {
      input: { legalActions: Array<{ type: string }> };
    }) =>
      input.input.legalActions.some((action) => action.type === "start_run")
        ? [target]
        : [],
  });
  const unknownInnerIce = {
    instanceId: "remote-1-unknown-inner-ice",
    owner: "corp",
    controller: "corp",
    known: false,
  } as VisibleCard;
  const valuableRemote = visibleCard(
    "remote-1-investment-firm",
    "corp",
    "asset",
    {
      definitionId: "onr_v1_294_investment-firm",
      title: "Investment Firm",
      rezzed: true,
      trashCost: 2,
    },
  );
  const startInput = aiInput("runner", [startRun]);
  startInput.playerView.own.credits = 4;
  startInput.playerView.own.gripOrHq = testGrip(3, "start-risk-contract");
  startInput.playerView.opponent.credits = 14;
  startInput.playerView.servers = [
    server("hq"),
    server("rd"),
    server("archives"),
    server("remote_1", [unknownInnerIce], [valuableRemote]),
  ];

  const startDecision = context.chooseSemanticRuntimeAction(startInput, {});
  expect(startDecision).toMatchObject({
    actionId: startRun.actionId,
    reasonCode: "plan_first.runner.contest_remote",
  });
  const root = residentPlanPortfolioSnapshot(startInput)?.instances.find(
    (instance) => instance.moduleId === "runner.contest_remote",
  );

  const continueRun = legalAction(
    "continue-remote-1-risk-contract",
    "runner",
    "continue_run",
    "Continue Remote 1 run",
    { credits: 0, clicks: 0 },
    { payload: { serverId: "remote_1" } },
  );
  const jackOut = legalAction(
    "jack-out-remote-1-risk-contract",
    "runner",
    "jack_out",
    "Jack out",
    { credits: 0, clicks: 0 },
  );
  const continuationInput = aiInput("runner", [continueRun, jackOut]);
  continuationInput.playerView.stateVersion = 2;
  continuationInput.playerView.timingPoint = "run.jack_out_window";
  for (const action of continuationInput.legalActions) {
    action.expiresAtStateVersion = 2;
    action.timingPoint = "run.jack_out_window";
  }
  continuationInput.playerView.own.credits = params.currentCredits;
  continuationInput.playerView.own.gripOrHq = testGrip(
    params.currentGripCount,
    "current-risk-contract",
  );
  continuationInput.playerView.opponent.credits =
    params.currentCorpCredits ?? 14;
  const currentRemote = server("remote_1", [unknownInnerIce], [valuableRemote]);
  if (params.currentVisibleRezSupport) {
    currentRemote.statuses = [
      {
        id: "remote-1-visible-rez-support",
        kind: "during_run_ice_rez_support",
        scope: "target_server",
        costModel: "half_rez_cost_rounded_down",
        target: "unrezzed_ice_on_this_fort",
        limit: "once_per_run_per_source",
        targetServerId: "remote_1",
        sourceCardInstanceId: "remote-1-rez-support",
        sourceTitle: "Visible rez support",
        sourceSide: "corp",
      },
    ];
  }
  continuationInput.playerView.servers = [
    server("hq"),
    server("rd"),
    server("archives"),
    currentRemote,
  ];
  continuationInput.playerView.run = {
    runId: "remote-1-risk-contract-run",
    attackedServerId: "remote_1",
    phase: "movement",
    position: { kind: "ice", serverId: "remote_1", iceIndex: 0 },
    successful: false,
  };

  const decision = context.chooseSemanticRuntimeAction(continuationInput, {});
  const leaf = residentPlanPortfolioSnapshot(continuationInput)?.instances.find(
    (instance) => instance.moduleId === "runner.convert_run_window",
  );
  return { startDecision, decision, leaf, root };
}

function testGrip(count: number, prefix: string): VisibleCard[] {
  return Array.from({ length: count }, (_, index) =>
    visibleCard(`${prefix}-${index}`, "runner", "event"),
  );
}

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
