import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { instantiatePlanProposal } from "./plan-instance";
import { bindBestCurrentPlanRoute } from "./plan-route";
import {
  requireValidatedPlanAssessment,
  RUNNER_PLAN_PRIORITY_POLICY,
} from "./plan-assessment";
import type { ResidentPlanPortfolio } from "./resident-plan-portfolio";
import type { RunnerCorePlanDomain } from "./runner-core-plan-modules";
import type { PlanSchedulerContext } from "./plan-scheduler";
import {
  createRunnerTacticalPlanModules,
  runnerPressureProgressReceipt,
  runnerVoluntaryActionFamilyOwner,
  type RunnerPlanDomain,
  type RunnerTacticalPlanDomain,
} from "./runner-tactical-plan-modules";

describe("Runner tactical plan modules", () => {
  it("owns a proactive Guide play only through runner.expose_information", () => {
    const guide = {
      ...candidate("play-guide", "play_event", "play.runner_event"),
      sourceKind: "card" as const,
      sourceCardInstanceId: "guide-card",
      sourceDefinitionId: "onr_v1_092_ice-and-datas-guide-to-the-net",
      abilityKey: "abilities_on_play_expose_outermost_ice_each_fort",
    };
    const module = tacticalModule("runner.expose_information");
    const runnerContext = context([guide], {
      exposeInformation: [
        {
          kind: "proactive",
          informationId: "card:guide-card",
          sourceCardInstanceId: "guide-card",
          sourceDefinitionId: "onr_v1_092_ice-and-datas-guide-to-the-net",
          targetPositionKeys: ["hq:ice:0"],
          phase: "play_information_event",
          selectedActionId: "play-guide",
          rejectedActionIds: [],
          admissible: true,
          evidenceCodes: ["runner_expose_information_unknown_target_available"],
        },
      ],
    });
    const instance = instantiatePlanProposal(
      module.discover(runnerContext)[0]!,
      10,
    );
    const materialized = module.materialize(
      instance,
      {} as never,
      runnerContext,
    );

    expect(instance.moduleId).toBe("runner.expose_information");
    expect(materialized.step.capability).toMatchObject({
      semanticActionTypes: ["play.runner_event"],
    });
    expect(
      materialized.candidates.map(({ candidate }) => candidate.actionId),
    ).toEqual(["play-guide"]);
    expect(
      runnerVoluntaryActionFamilyOwner(
        guide,
        runnerContext.domain as RunnerPlanDomain,
      ),
    ).toBe("runner.expose_information");
  });

  it("owns early EndTurn only through a rules-proven terminal-win plan", () => {
    const endTurn = candidate(
      "runner.end_turn",
      "end_turn",
      "turn_flow.end_turn",
    );
    endTurn.sourceKind = "game_rule";
    const module = tacticalModule("runner.secure_terminal_win");
    const runnerContext = context([endTurn], {
      terminalWins: [
        {
          terminalId: "corp-deckout",
          semanticActionTypes: ["turn_flow.end_turn"],
          evidenceCode: "corp_visible_empty_rd_forced_mandatory_draw",
        },
      ],
    });
    const instance = instantiatePlanProposal(
      module.discover(runnerContext)[0]!,
      10,
    );
    const assessment = module.assess(instance, runnerContext, emptyPortfolio());

    expect(assessment).toMatchObject({
      priorityClaim: {
        requestedClass: "P1",
        reasonCode: "terminal_win",
        witness: { guarantee: "rules_proven" },
      },
    });
    const materialization = module.materialize(
      instance,
      assessment as never,
      runnerContext,
    );
    expect(
      materialization.candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["runner.end_turn"]);
    expect(materialization.earlyEndTurnJustification).toEqual({
      kind: "rules_proven_terminal_win",
      terminalCondition: "corp_empty_rd_mandatory_draw",
    });
    expect(
      runnerVoluntaryActionFamilyOwner(
        endTurn,
        runnerContext.domain as RunnerPlanDomain,
      ),
    ).toBe("runner.secure_terminal_win");
    expect(
      runnerVoluntaryActionFamilyOwner(endTurn, domain({})),
    ).toBeUndefined();
  });

  it("binds central pressure to its exact server and purpose", () => {
    const rd = run("run-rd", "rd");
    const hq = run("run-hq", "hq");
    const module = tacticalModule("runner.pressure_central");
    const runnerContext = context([rd, hq], {
      centralPressure: [
        {
          pressureId: "rd-pressure",
          serverId: "rd",
          purpose: "multiaccess",
          strategyLineIds: ["rd_lock"],
          priorityClass: "P4",
          reachable: true,
          marginalValue: 8,
          evidenceCode: "deck_strategy_rd",
        },
      ],
    });
    const instance = instantiatePlanProposal(
      module.discover(runnerContext)[0]!,
      10,
    );
    const materialized = module.materialize(
      instance,
      {} as never,
      runnerContext,
    );

    expect(materialized.step.target).toEqual({ kind: "server", id: "rd" });
    expect(
      materialized.candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["run-rd"]);
  });

  it("assesses targeted-bypass preparation as contingent rather than visible-state forced", () => {
    const social = {
      ...candidate("play-social", "play_event", "play.runner_event"),
      sourceKind: "card" as const,
      sourceDefinitionId: "onr_v1_111_social-engineering",
      sourceCardInstanceId: "social-card",
      functionalEffects: [
        {
          kind: "future_run_effect" as const,
          timing: "action" as const,
          scope: "server" as const,
          target: "make_run",
        },
        {
          kind: "future_encounter_effect" as const,
          timing: "during_run" as const,
          scope: "ice" as const,
          target: "bypass_chosen_ice",
        },
      ],
    };
    const module = tacticalModule("runner.pressure_central");
    const runnerContext = context([social], {
      centralPressure: [
        {
          pressureId: "central:hq",
          serverId: "hq",
          purpose: "access",
          strategyLineIds: ["runner.access_agendas"],
          priorityClass: "P4",
          reachable: true,
          marginalValue: 120,
          evidenceCode: "runner_targeted_bypass_preflight:hq:0",
          sourceDefinitionIds: ["onr_v1_111_social-engineering"],
          preparationActionIds: ["play-social"],
          routePreparation: "targeted_bypass",
          targetedBypassCommitment: {
            kind: "targeted_bypass_run",
            sourceActionId: "play-social",
            sourceCardInstanceId: "social-card",
            sourceDefinitionId: "onr_v1_111_social-engineering",
            plannedAtStateVersion: 10,
            ownerModuleId: "runner.pressure_central",
            ownerDedupeKey: "central:hq",
            serverId: "hq",
            icePosition: 0,
            visibleIceInstanceId: "hq-wall",
            intendedHiddenAmount: 2,
            expectedCorpGuessAmount: 3,
            evidenceCodes: ["runner_targeted_bypass_preflight:complete"],
          },
        },
      ],
    });
    const instance = instantiatePlanProposal(
      module.discover(runnerContext)[0]!,
      10,
    );

    expect(
      module.materialize(instance, {} as never, runnerContext).step.capability,
    ).toMatchObject({
      requiredFunctionalEffects: [
        { kind: "future_run_effect", target: "make_run" },
        { kind: "future_encounter_effect", target: "bypass_chosen_ice" },
      ],
    });
    expect(
      module.materialize(instance, {} as never, runnerContext).step.capability,
    ).not.toHaveProperty("requiredSourceDefinitionIds");
    expect(
      bindBestCurrentPlanRoute({
        side: "runner",
        stateVersion: 10,
        timingPoint: "runner.action",
        planInstanceId: instance.instanceId,
        ...module.materialize(instance, {} as never, runnerContext),
      }).head.actionId,
    ).toBe("play-social");

    expect(
      module.assess(instance, runnerContext, emptyPortfolio()),
    ).toMatchObject({
      feasibility: {
        opponentCanReact: true,
        confidence: "belief_supported",
      },
      expectedOutcome: {
        guarantee: "belief_supported",
      },
    });
  });

  it("binds central pressure to the exact evaluated run producer", () => {
    const basic = run("run-rd-basic", "rd");
    const protocol = run("run-rd-protocol", "rd");
    delete protocol.runProjectionSummary;
    protocol.semanticActionType = "ability.activate";
    protocol.sourceKind = "card";
    protocol.sourceDefinitionId = "onr_v1_050_r-and-d-protocol-files";
    const module = tacticalModule("runner.pressure_central");
    const runnerContext = context([basic, protocol], {
      centralPressure: [
        {
          pressureId: "rd-pressure",
          serverId: "rd",
          purpose: "information",
          strategyLineIds: ["rd_lock"],
          priorityClass: "P4",
          reachable: true,
          marginalValue: 20,
          evidenceCode: "protocol_private_look",
          runActionIds: ["run-rd-protocol"],
        },
      ],
    });
    const instance = instantiatePlanProposal(
      module.discover(runnerContext)[0]!,
      10,
    );

    expect(
      module
        .materialize(instance, {} as never, runnerContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["run-rd-protocol"]);
    expect(
      bindBestCurrentPlanRoute({
        side: "runner",
        stateVersion: 10,
        timingPoint: "runner.action",
        planInstanceId: instance.instanceId,
        ...module.materialize(instance, {} as never, runnerContext),
      }).head.actionId,
    ).toBe("run-rd-protocol");
  });

  it("does not impose one run producer's source on an exact mixed pressure route", () => {
    const basic = run("run-rd-basic", "rd");
    const protocol = run("run-rd-protocol", "rd");
    protocol.semanticActionType = "play.runner_event";
    protocol.sourceKind = "card";
    protocol.sourceDefinitionId = "onr_v1_050_r-and-d-protocol-files";
    const module = tacticalModule("runner.pressure_central");
    const runnerContext = context([basic, protocol], {
      centralPressure: [
        {
          pressureId: "rd-pressure",
          serverId: "rd",
          purpose: "information",
          strategyLineIds: ["rd_lock"],
          priorityClass: "P4",
          reachable: true,
          marginalValue: 20,
          evidenceCode: "mixed_exact_rd_routes",
          sourceDefinitionIds: ["onr_v1_050_r-and-d-protocol-files"],
          runActionIds: ["run-rd-basic"],
        },
      ],
    });
    const instance = instantiatePlanProposal(
      module.discover(runnerContext)[0]!,
      10,
    );
    const materialized = module.materialize(
      instance,
      {} as never,
      runnerContext,
    );

    expect(materialized.step.capability).not.toHaveProperty(
      "requiredSourceDefinitionIds",
    );
    expect(
      bindBestCurrentPlanRoute({
        side: "runner",
        stateVersion: 10,
        timingPoint: "runner.action",
        planInstanceId: instance.instanceId,
        ...materialized,
      }).head.actionId,
    ).toBe("run-rd-basic");
  });

  it("does not spend a card run on an empty central when its visible payoff requires ICE", () => {
    const basic = run("run-archives-basic", "archives");
    const technician = {
      ...run("run-archives-technician", "archives"),
      actionType: "play_event",
      semanticActionType: "play.runner_event",
      sourceKind: "card" as const,
      sourceDefinitionId: "onr_proteus_106_disgruntled-ice-technician",
      costProfile: {
        clickCost: 1,
        creditCost: 2,
        costKnownStatus: "known" as const,
        additionalCosts: [],
      },
      effectTargets: ["make_run", "derez", "ends_run_after_effect"],
      conditions: [
        {
          kind: "requires_encounter",
          status: "not_evaluated" as const,
        },
        {
          kind: "requires_rezzed_ice",
          status: "not_evaluated" as const,
        },
      ],
    };
    const module = tacticalModule("runner.pressure_central");
    const runnerContext = context([technician, basic], {
      centralPressure: [
        {
          pressureId: "archives-pressure",
          serverId: "archives",
          purpose: "access",
          strategyLineIds: ["runner.access_agendas"],
          priorityClass: "P4",
          reachable: true,
          marginalValue: 160,
          evidenceCode: "empty_archives_access",
          sourceDefinitionIds: [technician.sourceDefinitionId],
          runActionIds: [technician.actionId, basic.actionId],
          runActionValues: {
            [technician.actionId]: 0,
            [basic.actionId]: 0,
          },
        },
      ],
    });
    runnerContext.input.playerView.servers = [
      { id: "archives", label: "Archives", ice: [], root: [] },
    ];
    const instance = instantiatePlanProposal(
      module.discover(runnerContext)[0]!,
      10,
    );
    const materialized = module.materialize(
      instance,
      {} as never,
      runnerContext,
    );

    expect(
      materialized.candidates.map((entry) => entry.candidate.actionId),
    ).toEqual([basic.actionId]);
    expect(
      bindBestCurrentPlanRoute({
        side: "runner",
        stateVersion: 10,
        timingPoint: "runner.action",
        planInstanceId: instance.instanceId,
        ...materialized,
      }).head.actionId,
    ).toBe(basic.actionId);

    runnerContext.input.playerView.servers[0]!.ice = [
      {
        instanceId: "archives-ice",
        title: "Archives ICE",
        known: true,
        rezzed: true,
      },
    ];
    const payoffMaterialized = module.materialize(
      instance,
      {} as never,
      runnerContext,
    );
    expect(
      bindBestCurrentPlanRoute({
        side: "runner",
        stateVersion: 10,
        timingPoint: "runner.action",
        planInstanceId: instance.instanceId,
        ...payoffMaterialized,
      }).head.actionId,
    ).toBe(technician.actionId);
  });

  it("does not replace access with Demolition Run when no rezzed ICE can be trashed", () => {
    const basic = run("run-hq-basic", "hq");
    const demolition = {
      ...run("run-hq-demolition", "hq"),
      actionType: "play_event",
      semanticActionType: "play.runner_event",
      sourceKind: "card" as const,
      sourceDefinitionId: "onr_proteus_105_demolition-run",
      costProfile: {
        clickCost: 1,
        creditCost: 4,
        costKnownStatus: "known" as const,
        additionalCosts: [],
      },
      effectTargets: [
        "make_chosen_server_run",
        "trash_rezzed_ice_on_fort_and_tag_runner",
        "trash_rezzed_ice_on_fort",
        "run.successful_run_self_tag",
      ],
    };
    const module = tacticalModule("runner.pressure_central");
    const runnerContext = context([demolition, basic], {
      centralPressure: [
        {
          pressureId: "hq-pressure",
          serverId: "hq",
          purpose: "access",
          strategyLineIds: ["runner.access_agendas"],
          priorityClass: "P4",
          reachable: true,
          marginalValue: 200,
          evidenceCode: "open_hq_access",
          sourceDefinitionIds: [demolition.sourceDefinitionId],
          runActionIds: [demolition.actionId, basic.actionId],
          runActionValues: {
            [demolition.actionId]: 10,
            [basic.actionId]: 0,
          },
        },
      ],
    });
    runnerContext.input.playerView.servers = [
      { id: "hq", label: "HQ", ice: [], root: [] },
    ];
    const instance = instantiatePlanProposal(
      module.discover(runnerContext)[0]!,
      10,
    );

    expect(
      module
        .materialize(instance, {} as never, runnerContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual([basic.actionId]);

    runnerContext.input.playerView.servers[0]!.ice = [
      {
        instanceId: "hq-ice",
        title: "HQ ICE",
        known: true,
        rezzed: true,
      },
    ];
    expect(
      bindBestCurrentPlanRoute({
        side: "runner",
        stateVersion: 10,
        timingPoint: "runner.action",
        planInstanceId: instance.instanceId,
        ...module.materialize(instance, {} as never, runnerContext),
      }).head.actionId,
    ).toBe(demolition.actionId);
  });

  it("keeps a card run when its differential ICE payoff is visibly applicable", () => {
    const basic = run("run-rd-basic", "rd");
    const bypass = {
      ...run("run-rd-bypass", "rd"),
      actionType: "play_event",
      semanticActionType: "play.runner_event",
      sourceKind: "card" as const,
      sourceDefinitionId: "onr_v1_094_inside-job",
      costProfile: {
        clickCost: 1,
        creditCost: 2,
        costKnownStatus: "known" as const,
        additionalCosts: [],
      },
      effectTargets: ["make_run", "bypass_first_ice"],
    };
    const module = tacticalModule("runner.pressure_central");
    const runnerContext = context([bypass, basic], {
      centralPressure: [
        {
          pressureId: "rd-pressure",
          serverId: "rd",
          purpose: "access",
          strategyLineIds: ["runner.access_agendas"],
          priorityClass: "P4",
          reachable: true,
          marginalValue: 215,
          evidenceCode: "rd_bypass_access",
          sourceDefinitionIds: [bypass.sourceDefinitionId],
          runActionIds: [bypass.actionId, basic.actionId],
          runActionValues: {
            [bypass.actionId]: 0,
            [basic.actionId]: 0,
          },
        },
      ],
    });
    runnerContext.input.playerView.servers = [
      {
        id: "rd",
        label: "R&D",
        ice: [
          {
            instanceId: "rd-ice",
            title: "R&D ICE",
            known: true,
            rezzed: true,
          },
        ],
        root: [],
      },
    ];
    const instance = instantiatePlanProposal(
      module.discover(runnerContext)[0]!,
      10,
    );
    const materialized = module.materialize(
      instance,
      {} as never,
      runnerContext,
    );

    expect(
      bindBestCurrentPlanRoute({
        side: "runner",
        stateVersion: 10,
        timingPoint: "runner.action",
        planInstanceId: instance.instanceId,
        ...materialized,
      }).head.actionId,
    ).toBe(bypass.actionId);
  });

  it("spends a trace-link run event only when that server shows a trace", () => {
    const basic = run("run-hq-basic", "hq");
    const traceRun = {
      ...run("run-hq-trace-link", "hq"),
      actionType: "play_event",
      semanticActionType: "play.runner_event",
      sourceKind: "card" as const,
      sourceDefinitionId: "trace-link-run-event",
      costProfile: {
        clickCost: 1,
        creditCost: 2,
        costKnownStatus: "known" as const,
        additionalCosts: [],
      },
      effectTargets: ["make_run", "run.trace_link_bonus"],
    };
    const module = tacticalModule("runner.pressure_central");
    const runnerContext = context([traceRun, basic], {
      centralPressure: [
        {
          pressureId: "hq-pressure",
          serverId: "hq",
          purpose: "access",
          strategyLineIds: ["runner.access_agendas"],
          priorityClass: "P4",
          reachable: true,
          marginalValue: 200,
          evidenceCode: "hq_access",
          runActionIds: [traceRun.actionId, basic.actionId],
          runActionValues: {
            [traceRun.actionId]: 0,
            [basic.actionId]: 0,
          },
        },
      ],
    });
    runnerContext.input.playerView.servers = [
      {
        id: "hq",
        label: "HQ",
        ice: [
          {
            instanceId: "unknown-hq-ice",
            known: false,
            rezzed: false,
          },
        ],
        root: [],
      },
    ];
    const instance = instantiatePlanProposal(
      module.discover(runnerContext)[0]!,
      10,
    );

    expect(
      module
        .materialize(instance, {} as never, runnerContext)
        .candidates.map(({ candidate }) => candidate.actionId),
    ).toEqual([basic.actionId]);

    runnerContext.input.playerView.servers[0]!.ice = [
      {
        instanceId: "known-trace-ice",
        known: true,
        rezzed: true,
        effectiveRunQuote: {
          iceInstanceId: "known-trace-ice",
          iceDefinitionId: "trace-ice",
          effectiveStrength: 2,
          subroutines: [
            {
              id: "trace-subroutine",
              type: "initiate_trace",
              sourceDefinitionId: "trace-ice",
              sourceTitle: "Trace ICE",
              traceLimit: 3,
              traceSuccessEffect: { type: "add_tag", amount: 1 },
            },
          ],
        },
      },
    ];
    expect(
      module
        .materialize(instance, {} as never, runnerContext)
        .candidates.map(({ candidate }) => candidate.actionId),
    ).toEqual([traceRun.actionId, basic.actionId]);
  });

  it("keeps source binding on the concrete central payoff-development phase", () => {
    const develop = cardAction(
      "install-rd-protocol",
      "onr_v1_050_r-and-d-protocol-files",
    );
    const module = tacticalModule("runner.pressure_central");
    const runnerContext = context([develop], {
      centralPressure: [
        {
          pressureId: "rd-pressure",
          serverId: "rd",
          purpose: "multiaccess",
          strategyLineIds: ["rd_lock"],
          priorityClass: "P4",
          reachable: true,
          marginalValue: 20,
          evidenceCode: "develop_rd_payoff",
          sourceDefinitionIds: ["onr_v1_050_r-and-d-protocol-files"],
          preparationActionIds: ["install-rd-protocol"],
          routePreparation: "develop_payoff",
        },
      ],
    });
    const instance = instantiatePlanProposal(
      module.discover(runnerContext)[0]!,
      10,
    );
    const materialized = module.materialize(
      instance,
      {} as never,
      runnerContext,
    );

    expect(materialized.step.capability.requiredSourceDefinitionIds).toEqual([
      "onr_v1_050_r-and-d-protocol-files",
    ]);
    expect(
      bindBestCurrentPlanRoute({
        side: "runner",
        stateVersion: 10,
        timingPoint: "runner.action",
        planInstanceId: instance.instanceId,
        ...materialized,
      }).head.actionId,
    ).toBe("install-rd-protocol");
  });

  it("allows an information probe only as an admitted pressure plan", () => {
    const probe = run("probe-hq", "hq");
    const module = tacticalModule("runner.pressure_central");
    expect(
      module.discover(
        context([probe], {
          centralPressure: [
            {
              pressureId: "probe",
              serverId: "hq",
              purpose: "information",
              strategyLineIds: [],
              priorityClass: "P5",
              reachable: true,
              marginalValue: 0,
              evidenceCode: "no_information_value",
            },
          ],
        }),
      )[0],
    ).toMatchObject({ initialViability: "blocked" });
    expect(
      module.discover(
        context([probe], {
          centralPressure: [
            {
              pressureId: "probe",
              serverId: "hq",
              purpose: "information",
              strategyLineIds: [],
              priorityClass: "P5",
              reachable: true,
              marginalValue: 3,
              evidenceCode: "hq_unknown_and_probe_useful",
            },
          ],
        }),
      )[0],
    ).toMatchObject({ initialViability: "ready" });
  });

  it("raises a known agenda remote as a witnessed P2 contest", () => {
    const module = tacticalModule("runner.contest_remote");
    const runnerContext = context([run("remote", "remote_1")], {
      remoteContests: [
        {
          contestId: "remote-1",
          serverId: "remote_1",
          purpose: "contest",
          knownAgendaThreat: true,
          reachable: true,
          marginalValue: 20,
          evidenceCode: "known_agenda_remote",
          runActionAssessments: {
            remote: {
              verdict: "executable",
              stepValue: 20,
              evidenceCodes: ["known_agenda_remote"],
            },
          },
        },
      ],
    });
    const proposal = module.discover(runnerContext)[0]!;
    const instance = instantiatePlanProposal(proposal, 10);
    const assessment = module.assess(instance, runnerContext, emptyPortfolio());

    expect(assessment.priorityClaim).toMatchObject({
      requestedClass: "P2",
      reasonCode: "score_threat",
      witness: { evidenceCode: "known_agenda_remote" },
    });
  });

  it("keeps a belief-dependent targeted bypass below P2 even against a known agenda", () => {
    const bypass = run("targeted-bypass", "remote_1");
    const module = tacticalModule("runner.contest_remote");
    const runnerContext = context([bypass], {
      remoteContests: [
        {
          contestId: "remote-1",
          serverId: "remote_1",
          purpose: "contest",
          knownAgendaThreat: true,
          reachable: true,
          marginalValue: 20,
          evidenceCode: "targeted_bypass_preflight",
          routePreparation: "targeted_bypass",
          preparationActionIds: [bypass.actionId],
          runActionAssessments: {},
        },
      ],
    });
    const proposal = module.discover(runnerContext)[0]!;
    const instance = instantiatePlanProposal(proposal, 10);

    expect(
      module.assess(instance, runnerContext, emptyPortfolio()),
    ).toMatchObject({
      priorityClaim: { requestedClass: "P4" },
      intentFit: "tactical_override",
    });
  });

  it("does not retain a superseded support gap when a remote contest route becomes executable", () => {
    const remoteRun = run("remote-run", "remote_1");
    const module = tacticalModule("runner.contest_remote");
    const runnerContext = context([remoteRun], {
      remoteContests: [
        {
          contestId: "remote:remote_1",
          serverId: "remote_1",
          purpose: "contest",
          knownAgendaThreat: true,
          terminalPatternThreat: true,
          reachable: true,
          marginalValue: 1400,
          evidenceCode: "runner_matchpoint_remote_pattern_focus:remote_1",
          supportNeedId: "coverage:breaker_wall",
          runActionAssessments: {
            [remoteRun.actionId]: {
              verdict: "executable",
              stepValue: 1400,
              evidenceCodes: ["current_remote_route"],
            },
          },
        },
      ],
    });
    const instance = instantiatePlanProposal(
      module.discover(runnerContext)[0]!,
      10,
    );
    (runnerContext.domain as RunnerPlanDomain).coverageGaps.push({
      gapId: "coverage:breaker_wall",
      requiredRole: "breaker_wall",
      requesterModuleId: "runner.contest_remote",
      requesterPlanInstanceId: instance.instanceId,
      requesterNeedId: "coverage:breaker_wall",
      priorityClass: "P2",
      evidenceCode: "missing_wall_coverage",
      deckHasAnswer: false,
      answerInHand: false,
      fundingActionIds: [],
      directSearchActionIds: [],
      searchEngineSetupActionIds: [],
      drawForAnswerActionIds: [],
    });

    const planAssessment = module.assess(
      instance,
      runnerContext,
      emptyPortfolio(),
    );

    expect(planAssessment).toMatchObject({
      readiness: "executable_now",
      feasibility: { currentRouteHeadPossible: true },
      resourceGaps: [],
    });
    expect(() =>
      requireValidatedPlanAssessment(
        planAssessment,
        RUNNER_PLAN_PRIORITY_POLICY,
        10,
      ),
    ).not.toThrow();
    const materialized = module.materialize(
      instance,
      planAssessment as never,
      runnerContext,
    );
    expect(materialized.step).toMatchObject({
      stepId: `${instance.instanceId}:contest`,
      capability: { capabilityId: "contest_remote" },
      target: { kind: "server", id: "remote_1" },
    });
    const route = bindBestCurrentPlanRoute({
      side: "runner",
      stateVersion: 10,
      timingPoint: "runner.action",
      planInstanceId: instance.instanceId,
      ...materialized,
    });
    expect(route).toMatchObject({
      planInstanceId: instance.instanceId,
      head: {
        planInstanceId: instance.instanceId,
        stepId: `${instance.instanceId}:contest`,
        actionId: remoteRun.actionId,
      },
    });
  });

  it("does not create generic development without admission", () => {
    const module = tacticalModule("runner.develop_board_and_hand");
    const install = cardAction("install-special", "special");
    expect(
      module.discover(
        context([install], {
          developments: [
            {
              developmentId: "special",
              definitionId: "special",
              phase: "execute",
              assignedDomainPlanIds: [],
              duplicateAlreadyInstalled: false,
              affordableOrSupportable: true,
              semanticActionTypes: ["install.card"],
              actionIds: ["install-special"],
              priorityClass: "P5",
              value: 10,
              evidenceCode: "card_in_hand",
            },
          ],
        }),
      ),
    ).toEqual([]);
  });

  it("keeps a concrete card plan resident when its current funding route is blocked", () => {
    const module = tacticalModule("runner.develop_board_and_hand");
    const [proposal] = module.discover(
      context([], {
        developments: [
          {
            developmentId: "card:breaker",
            definitionId: "breaker",
            phase: "fund",
            purposeCode: "breaker_or_rig_piece:setup",
            assignedDomainPlanIds: [],
            duplicateAlreadyInstalled: false,
            affordableOrSupportable: false,
            semanticActionTypes: ["economy.gain_credit"],
            actionIds: [],
            fundingGap: 2,
            priorityClass: "P5",
            value: 40,
            evidenceCode: "missing_credits",
          },
        ],
      }),
    );

    expect(proposal).toMatchObject({
      initialViability: "blocked",
      target: { kind: "card", id: "breaker" },
      blockers: [
        {
          code: "development_funding_route_unavailable_this_turn",
        },
      ],
      evidenceRefs: [
        {
          code: "missing_credits:card_specific_waiting_route:breaker_or_rig_piece:setup",
        },
      ],
    });
  });

  it("lets the concrete card plan choose its funding route without transferring ownership to the bank plan", () => {
    const basic = candidate("basic-credit");
    basic.economyProjection = {
      schemaVersion: "action-economy-projection-v1",
      kind: "immediate_liquid",
      timing: "immediate",
      creditRestriction: "general",
      clickCost: 1,
      creditCost: 0,
      grossLiquidCreditGain: 1,
      netLiquidCreditGain: 1,
      cardsDrawn: 0,
      cardsConsumed: 0,
      netHandDelta: 0,
      repeatable: true,
      reliability: "guaranteed",
      source: "basic_action_contract",
      confidence: "high",
      evidence: [],
    };
    const bank = candidate(
      "bank-cashout",
      "activated_card_ability",
      "economy.gain_credit",
    );
    bank.sourceKind = "card";
    bank.sourceDefinitionId = "broker";
    bank.economyProjection = {
      ...basic.economyProjection,
      grossLiquidCreditGain: 3,
      netLiquidCreditGain: 3,
      source: "legal_action_payload",
    };
    const module = tacticalModule("runner.develop_board_and_hand");
    const runnerContext = context([basic, bank], {
      developments: [
        {
          developmentId: "card:breaker",
          definitionId: "breaker",
          phase: "fund",
          purposeCode: "breaker_or_rig_piece:useful_now",
          assignedDomainPlanIds: [],
          duplicateAlreadyInstalled: false,
          affordableOrSupportable: true,
          semanticActionTypes: ["economy.gain_credit"],
          actionIds: ["basic-credit", "bank-cashout"],
          fundingGap: 2,
          priorityClass: "P5",
          value: 40,
          evidenceCode: "missing_credits",
        },
      ],
    });
    const instance = instantiatePlanProposal(
      module.discover(runnerContext)[0]!,
      10,
    );
    const materialized = module.materialize(
      instance,
      {} as never,
      runnerContext,
    );

    expect(materialized.step).toMatchObject({
      capability: { capabilityId: "fund_breaker" },
      purpose: "Fund the resident breaker development plan.",
    });
    expect(materialized.step.target).toBeUndefined();
    expect(
      materialized.candidates.map((entry) => ({
        actionId: entry.candidate.actionId,
        stepValue: entry.stepValue,
      })),
    ).toEqual([
      { actionId: "basic-credit", stepValue: 60 },
      { actionId: "bank-cashout", stepValue: 80 },
    ]);
  });

  it("owns matchpoint remote exposure as a remote-contest preparation step", () => {
    const expose = candidate(
      "expose-remote",
      "activated_card_ability",
      "card_ability.trigger",
    );
    expose.sourceKind = "card";
    expose.sourceDefinitionId = "seeya";
    const module = tacticalModule("runner.contest_remote");
    const runnerContext = context([expose], {
      remoteContests: [
        {
          contestId: "remote:remote_1",
          serverId: "remote_1",
          purpose: "information",
          knownAgendaThreat: false,
          reachable: true,
          marginalValue: 800,
          evidenceCode: "runner_remote_information_preparation",
          runActionAssessments: {},
          preparationActionIds: ["expose-remote"],
          routePreparation: "expose_remote",
        },
      ],
    });
    const instance = instantiatePlanProposal(
      module.discover(runnerContext)[0]!,
      10,
    );
    const assessment = module.assess(instance, runnerContext, emptyPortfolio());
    const materialized = module.materialize(
      instance,
      assessment as never,
      runnerContext,
    );

    expect(assessment).toMatchObject({
      priorityClaim: { requestedClass: "P4" },
    });
    expect(materialized.step.target).toBeUndefined();
    expect(
      materialized.candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["expose-remote"]);
  });

  it("keeps run-window parent origin and only compatible window actions", () => {
    const module = tacticalModule("runner.convert_run_window");
    const access = candidate(
      "access",
      "resolve_access_card",
      "access.resolve_card",
    );
    const credit = candidate("credit");
    const runnerContext = context([access, credit], {
      runWindows: [
        {
          windowId: "access-7",
          serverId: "rd",
          rootPlanInstanceId: "plan:runner.pressure_central:rd",
          leafPlanInstanceId: "plan:runner.convert_run_window:access-7",
          semanticActionTypes: ["access.resolve_card"],
          purposeCode: "resolve_rd_access",
          evidenceCode: "successful_rd_run",
          actionAssessments: {
            access: {
              admissible: true,
              evidenceCodes: ["test_access_plan_admissible"],
            },
          },
        },
      ],
    });
    const proposal = module.discover(runnerContext)[0]!;
    const instance = instantiatePlanProposal(proposal, 10);
    const materialized = module.materialize(
      instance,
      {} as never,
      runnerContext,
    );

    expect(proposal.parentInstanceId).toBe("plan:runner.pressure_central:rd");
    expect(
      materialized.candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["access"]);
  });

  it("does not admit a run-window candidate without an explicit positive assessment", () => {
    const module = tacticalModule("runner.convert_run_window");
    const access = candidate(
      "access",
      "resolve_access_card",
      "access.resolve_card",
    );
    const runnerContext = context([access], {
      runWindows: [
        {
          windowId: "unassessed-access",
          rootPlanInstanceId: "rules.access_window",
          leafPlanInstanceId:
            "plan:runner.convert_run_window:unassessed-access",
          semanticActionTypes: ["access.resolve_card"],
          purposeCode: "resolve_access",
          evidenceCode: "legal_access_window_without_run_snapshot",
        },
      ],
    });
    const instance = instantiatePlanProposal(
      module.discover(runnerContext)[0]!,
      10,
    );

    expect(
      module.materialize(instance, {} as never, runnerContext).candidates,
    ).toEqual([]);
  });

  it("lets a witnessed run-safety requirement outrank continuation inside the same run plan", () => {
    const module = tacticalModule("runner.convert_run_window");
    const runContext = run("run-context", "hq").runProjectionSummary!;
    const jackOut = {
      ...candidate("jack", "jack_out", "run.jack_out"),
      runProjectionSummary: runContext,
    };
    const continueRun = {
      ...candidate("continue", "continue_run", "run.continue"),
      runProjectionSummary: runContext,
    };
    const runnerContext = context([continueRun, jackOut], {
      runWindows: [
        {
          windowId: "dangerous-next-encounter",
          serverId: "hq",
          rootPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
          leafPlanInstanceId:
            "plan:runner.convert_run_window:dangerous-next-encounter",
          semanticActionTypes: ["run.continue", "run.jack_out"],
          purposeCode: "convert_active_run_window",
          evidenceCode: "runner_future_encounter_damage_requires_jack_out",
          safetyIntent: "jack_out",
          safetyEvidenceCode:
            "runner_future_encounter_damage_requires_jack_out",
          actionAssessments: {
            continue: {
              admissible: true,
              evidenceCodes: ["test_continue_plan_admissible"],
            },
            jack: {
              admissible: true,
              evidenceCodes: ["test_jack_out_plan_admissible"],
            },
          },
        },
      ],
    });
    const instance = instantiatePlanProposal(
      module.discover(runnerContext)[0]!,
      10,
    );
    const materialized = module.materialize(
      instance,
      {} as never,
      runnerContext,
    );

    expect(
      bindBestCurrentPlanRoute({
        side: "runner",
        stateVersion: 10,
        timingPoint: "run.jack_out_window",
        planInstanceId: instance.instanceId,
        ...materialized,
      }).head.actionId,
    ).toBe("jack");
  });

  it("executes legal breaker mitigation before continuing through a visible threat", () => {
    const module = tacticalModule("runner.convert_run_window");
    const runContext = run("run-context", "hq").runProjectionSummary!;
    const pump = {
      ...candidate("pump", "pump_breaker", "breaker.boost_strength"),
      runProjectionSummary: runContext,
    };
    const continueRun = {
      ...candidate("continue", "continue_run", "run.continue"),
      runProjectionSummary: runContext,
    };
    const runnerContext = context([continueRun, pump], {
      runWindows: [
        {
          windowId: "fatal-attractor-encounter",
          serverId: "hq",
          rootPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
          leafPlanInstanceId:
            "plan:runner.convert_run_window:fatal-attractor-encounter",
          semanticActionTypes: ["breaker.boost_strength", "run.continue"],
          purposeCode: "convert_active_run_window",
          evidenceCode:
            "runner_visible_encounter_requires_mitigation:onr_v1_242_fatal-attractor",
          encounterIntent: "mitigate_threat",
          encounterEvidenceCode:
            "runner_visible_encounter_requires_mitigation:onr_v1_242_fatal-attractor",
          actionAssessments: {
            continue: {
              admissible: true,
              evidenceCodes: ["test_continue_plan_admissible"],
            },
            pump: {
              admissible: true,
              evidenceCodes: ["test_pump_plan_admissible"],
            },
          },
        },
      ],
    });
    const instance = instantiatePlanProposal(
      module.discover(runnerContext)[0]!,
      10,
    );
    const materialized = module.materialize(
      instance,
      {} as never,
      runnerContext,
    );

    expect(
      bindBestCurrentPlanRoute({
        side: "runner",
        stateVersion: 10,
        timingPoint: "run.encounter_ice",
        planInstanceId: instance.instanceId,
        ...materialized,
      }).head.actionId,
    ).toBe("pump");
  });

  it("converts a parent trash commitment instead of re-evaluating decline as a peer action", () => {
    const module = tacticalModule("runner.convert_run_window");
    const trash = {
      ...candidate("trash-krumz", "trash_accessed_card", "access.trash_card"),
      sourceKind: "card" as const,
      sourceDefinitionId: "onr_v1_330_krumz",
      costProfile: {
        costKnownStatus: "known" as const,
        creditCost: 2,
        additionalCosts: [],
      },
    };
    const decline = candidate(
      "decline",
      "decline_trash",
      "access.decline_trash",
    );
    const runnerContext = context([decline, trash], {
      runWindows: [
        {
          windowId: "access-hq-trash",
          serverId: "hq",
          rootPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
          leafPlanInstanceId: "plan:runner.convert_run_window:access-hq-trash",
          semanticActionTypes: ["access.decline_trash", "access.trash_card"],
          purposeCode: "convert_active_run_window",
          evidenceCode: "visible_active_run",
          accessCommitment: {
            payoff: "trash_affordable",
            intendedAction: "trash",
            knownTargetDefinitionIds: ["onr_v1_330_krumz"],
            trashBudget: 2,
            evidenceCode: "central_memory_payoff:trash_affordable",
          },
          actionAssessments: {
            decline: {
              admissible: true,
              evidenceCodes: ["test_decline_plan_admissible"],
            },
            "trash-krumz": {
              admissible: true,
              evidenceCodes: ["test_trash_plan_admissible"],
            },
          },
        },
      ],
    });
    const instance = instantiatePlanProposal(
      module.discover(runnerContext)[0]!,
      10,
    );
    const materialized = module.materialize(
      instance,
      {} as never,
      runnerContext,
    );

    expect(
      materialized.candidates.map((entry) => ({
        actionId: entry.candidate.actionId,
        stepValue: entry.stepValue,
      })),
    ).toEqual([
      { actionId: "decline", stepValue: -200 },
      { actionId: "trash-krumz", stepValue: 200 },
    ]);
  });

  it("records Highlighter progress only after real access conversion and resets on purge", () => {
    expect(
      runnerPressureProgressReceipt({
        planInstanceId: "pressure",
        stateVersionBefore: 10,
        stateVersionAfter: 11,
        previousCounter: 1,
        currentCounter: 2,
        accessConverted: false,
        corpPurged: false,
      }).progress,
    ).toBe("no_progress");
    expect(
      runnerPressureProgressReceipt({
        planInstanceId: "pressure",
        stateVersionBefore: 11,
        stateVersionAfter: 12,
        previousCounter: 1,
        currentCounter: 2,
        accessConverted: true,
        corpPurged: false,
      }).progress,
    ).toBe("progress");
    expect(
      runnerPressureProgressReceipt({
        planInstanceId: "pressure",
        stateVersionBefore: 12,
        stateVersionAfter: 13,
        previousCounter: 2,
        currentCounter: 0,
        accessConverted: false,
        corpPurged: true,
      }),
    ).toMatchObject({
      progress: "regression",
      reasonCode: "corp_purge_observed",
    });
  });

  it("leaves unsupported generic draw and probe runs visibly ownerless", () => {
    const planDomain = domain({});
    expect(
      runnerVoluntaryActionFamilyOwner(
        candidate("draw", "draw_card", "draw.card"),
        planDomain,
      ),
    ).toBeUndefined();
    expect(
      runnerVoluntaryActionFamilyOwner(run("unplanned-run", "hq"), planDomain),
    ).toBeUndefined();
  });

  it("assigns a generic draw to its existing hand-development signal", () => {
    const draw = candidate("draw", "draw_card", "draw.card");
    const planDomain = domain({
      developments: [
        {
          developmentId: "generic:draw-options",
          definitionId: "runner_option_development",
          targetKind: "capability",
          phase: "execute",
          purposeCode: "increase_hand_option_density",
          assignedDomainPlanIds: [],
          duplicateAlreadyInstalled: false,
          affordableOrSupportable: true,
          semanticActionTypes: ["draw.card"],
          actionIds: [draw.actionId],
          priorityClass: "P6",
          value: 12,
          evidenceCode:
            "runner_hand_capacity_accepts_immediate_option_development",
        },
      ],
    });

    expect(runnerVoluntaryActionFamilyOwner(draw, planDomain)).toBe(
      "runner.develop_board_and_hand",
    );
  });
});

function tacticalModule(moduleId: string) {
  return createRunnerTacticalPlanModules().find(
    (module) => module.moduleId === moduleId,
  )!;
}

function context(
  candidates: ActionSemanticCandidate[],
  overrides: Partial<RunnerTacticalPlanDomain>,
): PlanSchedulerContext {
  return {
    input: {
      side: "runner",
      legalActions: candidates.map((value) => ({
        actionId: value.actionId,
        type: value.actionType,
      })),
      playerView: { stateVersion: 10, timingPoint: "runner_action.main" },
    } as unknown as AiDecisionInput,
    actionCandidates: candidates,
    turnKey: "runner:1",
    domain: domain(overrides),
  };
}

function domain(
  overrides: Partial<RunnerTacticalPlanDomain>,
): RunnerPlanDomain {
  const core: RunnerCorePlanDomain = {
    fundingNeeds: [],
    coverageGaps: [],
    creditBanks: [],
    defense: {
      activeTags: 0,
      visibleTagPunish: false,
      persistentHazardCounterRemovalAvailable: false,
      pendingDamage: 0,
      damagePreventionNeeded: false,
      handSize: 5,
      minimumHandBuffer: 3,
      drawAllowed: true,
      forgoUnsafeRunCapacity: false,
      handBufferPriorityClass: "P5",
      evidenceCodes: [],
    },
  };
  return {
    ...core,
    terminalWins: overrides.terminalWins ?? [],
    centralPressure: overrides.centralPressure ?? [],
    remoteContests: overrides.remoteContests ?? [],
    developments: overrides.developments ?? [],
    exposeInformation: overrides.exposeInformation ?? [],
    runWindows: overrides.runWindows ?? [],
  };
}

function emptyPortfolio(): ResidentPlanPortfolio {
  return {
    schemaVersion: "resident-plan-portfolio-v2",
    side: "runner",
    stateVersion: 10,
    instances: [],
    completionHistory: [],
    transitions: [],
  };
}

function run(actionId: string, serverId: string): ActionSemanticCandidate {
  return {
    ...candidate(actionId, "start_run", "run.start"),
    runProjectionSummary: {
      serverId,
      serverKind: serverId.startsWith("remote")
        ? "remote"
        : (serverId as "hq" | "rd" | "archives"),
      source: "legal_action_payload",
      evidence: [],
    },
  };
}

function cardAction(
  actionId: string,
  definitionId: string,
): ActionSemanticCandidate {
  return {
    ...candidate(actionId, "install_card", "install.card"),
    sourceKind: "card",
    sourceDefinitionId: definitionId,
  };
}

function candidate(
  actionId: string,
  actionType = "gain_credit",
  semanticActionType = "economy.gain_credit",
): ActionSemanticCandidate {
  return {
    actionId,
    actionType,
    actorSide: "runner",
    legalActionRef: {
      actionId,
      actionType,
      originalPayloadKeys: [],
    },
    stateVersion: 10,
    sourceKind: "basic_action",
    abilityBindingMethod: "unresolved",
    semanticActionType,
    visibilityScope: "actor_private",
    cardContextSignals: [],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: { costKnownStatus: "known", additionalCosts: [] },
    timingProfile: {},
    boardContext: {
      source: "ai_decision_input",
      sideSafe: true,
      stateVersion: 10,
      notes: [],
    },
    confidence: "high",
    primaryProjectionStatus: "projected",
    projectionIssues: [],
    hardGates: [],
    evidence: [],
  };
}
