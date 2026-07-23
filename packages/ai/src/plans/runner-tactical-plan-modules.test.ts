import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { instantiatePlanProposal } from "./plan-instance";
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
    expect(materialized.candidates.map((entry) => entry.candidate.actionId)).toEqual([
      "run-rd",
    ]);
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
          knownAgendaThreat: true,
          reachable: true,
          marginalValue: 20,
          evidenceCode: "known_agenda_remote",
        },
      ],
    });
    const proposal = module.discover(runnerContext)[0]!;
    const instance = instantiatePlanProposal(proposal, 10);
    const assessment = module.assess(
      instance,
      runnerContext,
      emptyPortfolio(),
    );

    expect(assessment.priorityClaim).toMatchObject({
      requestedClass: "P2",
      reasonCode: "score_threat",
      witness: { evidenceCode: "known_agenda_remote" },
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
              assignedDomainPlanIds: [],
              duplicateAlreadyInstalled: false,
              affordableOrSupportable: true,
              semanticActionTypes: ["install.card"],
              value: 10,
              evidenceCode: "card_in_hand",
            },
          ],
        }),
      ),
    ).toEqual([]);
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

    expect(proposal.parentInstanceId).toBe(
      "plan:runner.pressure_central:rd",
    );
    expect(materialized.candidates.map((entry) => entry.candidate.actionId)).toEqual([
      "access",
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
    defense: {
      activeTags: 0,
      visibleTagPunish: false,
      pendingDamage: 0,
      damagePreventionNeeded: false,
      handSize: 5,
      minimumHandBuffer: 3,
      drawAllowed: true,
      evidenceCodes: [],
    },
  };
  return {
    ...core,
    centralPressure: overrides.centralPressure ?? [],
    remoteContests: overrides.remoteContests ?? [],
    developments: overrides.developments ?? [],
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
