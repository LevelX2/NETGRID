import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type {
  ActionSemanticCandidate,
  LegalTarget,
} from "../action-semantic-candidate-types";
import {
  CORP_PLAN_PRIORITY_POLICY,
  requireValidatedPlanAssessment,
} from "./plan-assessment";
import {
  CORP_CORE_ACTION_OWNERSHIP,
  corpCoreActionOwner,
  createCorpCorePlanModules,
  type CorpCorePlanDomain,
} from "./corp-core-plan-modules";
import { instantiatePlanProposal } from "./plan-instance";
import type { ResidentPlanPortfolio } from "./resident-plan-portfolio";
import { bindBestCurrentPlanRoute } from "./plan-route";
import type { PlanSchedulerContext } from "./plan-scheduler";

describe("Corp core plan modules", () => {
  it("keeps score and defense ownership disjoint", () => {
    expect(CORP_CORE_ACTION_OWNERSHIP).toMatchObject({
      "install.agenda": "corp.score_agenda",
      "score.advance_card": "corp.score_agenda",
      "score.agenda": "corp.score_agenda",
      "install.ice": "corp.defend_servers",
      "corp_window.rez": "corp.defend_servers",
    });
    expect(corpCoreActionOwner("score.agenda")).not.toBe(
      corpCoreActionOwner("corp_window.rez"),
    );
  });

  it.each([
    [
      "install_agenda",
      cardAction("install", "install.card", "agenda-def"),
      "agenda-def",
    ],
    [
      "advance_agenda",
      targetAction("advance", "score.advance_card", "agenda-1", "card"),
      "agenda-1",
    ],
    [
      "score_agenda",
      targetAction("score", "score.agenda", "agenda-1", "agenda"),
      "agenda-1",
    ],
  ] as const)(
    "gives the score plan exact ownership of %s",
    (phase, action, targetId) => {
      const module = corpModule("corp.score_agenda");
      const corpContext = context([action], {
        scoreProjects: [
          {
            projectId: "score-1",
            agendaDefinitionId: "agenda-def",
            agendaInstanceId: "agenda-1",
            serverId: "remote_1",
            phase,
            sameTurnCloseout: phase !== "install_agenda",
            terminalScore: false,
            feasible: true,
            evidenceCode: "visible_score_line",
          },
        ],
      });
      const instance = instantiatePlanProposal(
        module.discover(corpContext)[0]!,
        10,
      );
      const materialized = module.materialize(
        instance,
        {} as never,
        corpContext,
      );

      expect(
        materialized.candidates.map((entry) => entry.candidate.actionId),
      ).toEqual([action.actionId]);
      expect(materialized.step.target?.id).toBe(targetId);
    },
  );

  it("protects same-turn score as P3 with a semantic continuation", () => {
    const advance = targetAction(
      "advance",
      "score.advance_card",
      "agenda-1",
      "card",
    );
    const module = corpModule("corp.score_agenda");
    const corpContext = context([advance], {
      scoreProjects: [
        {
          projectId: "score-1",
          agendaDefinitionId: "agenda-def",
          agendaInstanceId: "agenda-1",
          phase: "advance_agenda",
          sameTurnCloseout: true,
          terminalScore: false,
          feasible: true,
          evidenceCode: "same_turn_score",
        },
      ],
    });
    const instance = instantiatePlanProposal(
      module.discover(corpContext)[0]!,
      10,
    );
    const planAssessment = requireValidatedPlanAssessment(
      module.assess(instance, corpContext, emptyPortfolio()),
      CORP_PLAN_PRIORITY_POLICY,
      10,
    );
    const materialized = module.materialize(
      instance,
      planAssessment,
      corpContext,
    );

    expect(planAssessment.priorityValidation.effectiveClass).toBe("P3");
    expect(materialized.continuation?.nextCapability).toEqual({
      capabilityId: "score_advanced_agenda",
      semanticActionTypes: ["score.agenda"],
    });
    expect(JSON.stringify(materialized.continuation)).not.toContain("actionId");
  });

  it("does not let defense absorb a score action", () => {
    const score = targetAction("score", "score.agenda", "agenda-1", "agenda");
    const rez = {
      ...cardAction("rez", "corp_window.rez", "ice-def"),
      targetContext: targetContext("ice-1", "ice"),
    };
    const module = corpModule("corp.defend_servers");
    const corpContext = context([score, rez], {
      defenseNeeds: [
        {
          defenseId: "rez-ice",
          serverId: "remote_1",
          phase: "rez_response",
          sourceDefinitionIds: ["ice-def"],
          targetIceInstanceId: "ice-1",
          urgent: true,
          value: 20,
          evidenceCode: "run_approaching",
        },
      ],
    });
    const instance = instantiatePlanProposal(
      module.discover(corpContext)[0]!,
      10,
    );
    const materialized = module.materialize(instance, {} as never, corpContext);

    expect(
      materialized.candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["rez"]);
  });

  it("routes a legal source-less rez through defense without weakening the capability", () => {
    const rez = candidate("rez", "rez_ice", "corp_window.rez");
    const module = corpModule("corp.defend_servers");
    const corpContext = context([rez], {
      defenseNeeds: [
        {
          defenseId: "rez-visible",
          serverId: "unknown",
          phase: "rez_response",
          sourceDefinitionIds: [],
          urgent: false,
          value: 10,
          evidenceCode: "visible_rez_window",
        },
      ],
    });
    const instance = instantiatePlanProposal(
      module.discover(corpContext)[0]!,
      10,
    );
    const materialized = module.materialize(instance, {} as never, corpContext);

    expect(
      bindBestCurrentPlanRoute({
        side: "corp",
        stateVersion: 10,
        timingPoint: "corp_action.main",
        planInstanceId: instance.instanceId,
        ...materialized,
      }).head.actionId,
    ).toBe("rez");
  });

  it("does not create a generic board-install winner without a domain project", () => {
    const genericInstall = cardAction(
      "install-random",
      "install.card",
      "random-asset",
    );
    const corpContext = context([genericInstall], {});

    expect(
      createCorpCorePlanModules().flatMap((module) =>
        module.discover(corpContext),
      ),
    ).toEqual([]);
  });

  it("removes a satisfied economy need and cannot outrank P3 closeout by value", () => {
    const economy = corpModule("corp.economy");
    const credit = candidate("credit", "gain_credit", "economy.gain_credit");
    const open = economy.discover(
      context([credit], {
        economyNeeds: [
          {
            needId: "score-funding",
            gap: 5,
            parentPlanInstanceId: "plan:corp.score_agenda:score-1",
            urgentForScore: true,
            evidenceCode: "score_needs_credits",
          },
        ],
      }),
    );
    const satisfied = economy.discover(
      context([credit], {
        economyNeeds: [
          {
            needId: "score-funding",
            gap: 0,
            urgentForScore: true,
            evidenceCode: "score_funded",
          },
        ],
      }),
    );

    expect(open[0]?.parentInstanceId).toBe("plan:corp.score_agenda:score-1");
    expect(satisfied).toEqual([]);
  });

  it("keeps neutral credit progress explicit at P6 without inventing a funding gap", () => {
    const economy = corpModule("corp.economy");
    const credit = candidate("credit", "gain_credit", "economy.gain_credit");
    const corpContext = context([credit], {
      economyNeeds: [
        {
          needId: "neutral-credit",
          gap: 0,
          neutralProgress: true,
          urgentForScore: false,
          evidenceCode: "corp_neutral_credit_progress_available",
        },
      ],
    });
    const instance = instantiatePlanProposal(
      economy.discover(corpContext)[0]!,
      10,
    );

    expect(
      economy.assess(instance, corpContext, emptyPortfolio()),
    ).toMatchObject({
      priorityClaim: {
        requestedClass: "P6",
        reasonCode: "neutral_progress",
      },
      withinClassValue: 1,
    });
  });
});

function corpModule(moduleId: string) {
  return createCorpCorePlanModules().find(
    (module) => module.moduleId === moduleId,
  )!;
}

function context(
  candidates: ActionSemanticCandidate[],
  overrides: Partial<CorpCorePlanDomain>,
): PlanSchedulerContext {
  const domain: CorpCorePlanDomain = {
    scoreProjects: overrides.scoreProjects ?? [],
    remoteProjects: overrides.remoteProjects ?? [],
    defenseNeeds: overrides.defenseNeeds ?? [],
    economyNeeds: overrides.economyNeeds ?? [],
  };
  return {
    input: {
      side: "corp",
      legalActions: candidates.map((value) => ({
        actionId: value.actionId,
        type: value.actionType,
      })),
      playerView: { stateVersion: 10, timingPoint: "corp_action.main" },
    } as unknown as AiDecisionInput,
    actionCandidates: candidates,
    turnKey: "corp:1",
    domain,
  };
}

function emptyPortfolio(): ResidentPlanPortfolio {
  return {
    schemaVersion: "resident-plan-portfolio-v2",
    side: "corp",
    stateVersion: 10,
    instances: [],
    completionHistory: [],
    transitions: [],
  };
}

function cardAction(
  actionId: string,
  semanticActionType: string,
  sourceDefinitionId: string,
): ActionSemanticCandidate {
  return {
    ...candidate(actionId, "install_card", semanticActionType),
    sourceKind: "card",
    sourceDefinitionId,
  };
}

function targetAction(
  actionId: string,
  semanticActionType: string,
  targetId: string,
  targetKind: LegalTarget["targetKind"],
): ActionSemanticCandidate {
  return {
    ...candidate(actionId, actionId, semanticActionType),
    targetContext: targetContext(targetId, targetKind),
  };
}

function targetContext(
  targetId: string,
  targetKind: LegalTarget["targetKind"],
) {
  return {
    selectedTargets: [
      {
        targetId,
        targetKind,
        targetSide: "corp" as const,
        visibilityScope: "public" as const,
        evidence: [],
      },
    ],
    targetKind,
    targetZones: [],
    targetSide: "corp" as const,
    hiddenInfoPolicy: "side_safe",
    availableTargetsStatus: "engine_provided" as const,
    targetProfileMatches: [],
    targetConstraintResults: [],
  };
}

function candidate(
  actionId: string,
  actionType: string,
  semanticActionType: string,
): ActionSemanticCandidate {
  return {
    actionId,
    actionType,
    actorSide: "corp",
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
