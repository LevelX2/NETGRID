import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { CorpCorePlanDomain } from "./corp-core-plan-modules";
import {
  corpSpecialDevelopmentAdmission,
  corpTacticalActionFamilyOwner,
  createCorpTacticalPlanModules,
  type CorpPlanDomain,
  type CorpTacticalPlanDomain,
} from "./corp-tactical-plan-modules";
import { instantiatePlanProposal } from "./plan-instance";
import type { ResidentPlanPortfolio } from "./resident-plan-portfolio";
import type { PlanSchedulerContext } from "./plan-scheduler";

describe("Corp tactical plan modules", () => {
  it("creates purge only for strategically material virus pressure", () => {
    const purge = candidate(
      "purge",
      "purge_virus_counters",
      "counter.purge_runner_virus",
    );
    const module = tacticalModule("corp.respond_to_virus_pressure");
    expect(
      module.discover(
        context([purge], {
          virusPressure: [
            {
              pressureId: "virus",
              virusCounters: 3,
              strategicDamage: 10,
              critical: true,
              purgeUseful: true,
              evidenceCode: "highlighter_pressure",
            },
          ],
        }),
      )[0],
    ).toMatchObject({
      initialViability: "ready",
      executionClass: "urgent_response",
    });
    expect(
      module.discover(
        context([purge], {
          virusPressure: [
            {
              pressureId: "virus",
              virusCounters: 3,
              strategicDamage: 0,
              critical: false,
              purgeUseful: false,
              evidenceCode: "irrelevant_virus",
            },
          ],
        }),
      ),
    ).toEqual([]);
  });

  it("keeps preparation and execution as resident linked plans", () => {
    const prepare = cardAction(
      "prepare",
      "play.corp_operation",
      "punish-card",
    );
    const trace = cardAction("trace", "trace.initiate", "punish-card");
    const campaignModule = tacticalModule("corp.punish_campaign");
    const sequenceModule = tacticalModule("corp.execute_punish_sequence");
    const prepareContext = context([prepare], {
      punishCampaigns: [punishSignal("prepare")],
    });
    const traceContext = context([trace], {
      punishCampaigns: [punishSignal("trace")],
    });
    const campaign = campaignModule.discover(prepareContext)[0]!;
    const sequence = sequenceModule.discover(traceContext)[0]!;

    expect(campaign.persistencePolicy).toBe("sticky_goal");
    expect(sequence.persistencePolicy).toBe("locked_sequence");
    expect(sequence.parentInstanceId).toBe(
      "plan:corp.punish_campaign:campaign",
    );
  });

  it("does not claim P1 for an uncertain terminal line", () => {
    const kill = cardAction("kill", "damage.net", "punish-card");
    const module = tacticalModule("corp.execute_punish_sequence");
    const uncertainContext = context([kill], {
      punishCampaigns: [
        {
          ...punishSignal("kill"),
          terminalCondition: "runner_flatline",
          visibleTerminalProjection: true,
          guarantee: "belief_supported",
        },
      ],
    });
    const strongContext = context([kill], {
      punishCampaigns: [
        {
          ...punishSignal("kill"),
          terminalCondition: "runner_flatline",
          visibleTerminalProjection: true,
          guarantee: "visible_state_forced",
        },
      ],
    });
    const uncertainInstance = instantiatePlanProposal(
      module.discover(uncertainContext)[0]!,
      10,
    );
    const strongInstance = instantiatePlanProposal(
      module.discover(strongContext)[0]!,
      10,
    );

    expect(
      module.assess(
        uncertainInstance,
        uncertainContext,
        emptyPortfolio(),
      ).priorityClaim.requestedClass,
    ).toBe("P3");
    expect(
      module.assess(
        strongInstance,
        strongContext,
        emptyPortfolio(),
      ).priorityClaim.requestedClass,
    ).toBe("P1");
  });

  it("branches punish continuation semantically without future action ids", () => {
    const trace = cardAction("trace", "trace.initiate", "punish-card");
    const module = tacticalModule("corp.execute_punish_sequence");
    const corpContext = context([trace], {
      punishCampaigns: [punishSignal("trace")],
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

    expect(materialized.continuation?.nextCapability.capabilityId).toBe(
      "resolve_trace_tag",
    );
    expect(JSON.stringify(materialized.continuation)).not.toContain("actionId");
  });

  it("rejects generic ambush development without purpose", () => {
    expect(
      corpSpecialDevelopmentAdmission({
        assignedDomainPlanIds: [],
        duplicateAlreadyInstalled: false,
        affordableOrSupportable: true,
      }),
    ).toEqual({ admitted: false, reasonCode: "no_concrete_corp_purpose" });

    const module = tacticalModule("corp.ambush_and_bluff");
    const install = {
      ...cardAction("install", "install.card", "ambush"),
      runProjectionSummary: {
        serverId: "remote_1",
        serverKind: "remote" as const,
        source: "legal_action_payload" as const,
        evidence: [],
      },
    };
    expect(
      module.discover(
        context([install], {
          ambushes: [
            {
              ambushId: "ambush",
              sourceDefinitionId: "ambush",
              serverId: "remote_1",
              phase: "install",
              assignedDomainPlanIds: [],
              duplicateAlreadyInstalled: false,
              affordableOrSupportable: true,
              value: 5,
              evidenceCode: "card_in_hq",
            },
          ],
        }),
      ),
    ).toEqual([]);
  });

  it("owns agenda flood and concrete draw but not generic draw", () => {
    const draw = candidate("draw", "draw_card", "draw.card");
    const planDomain = domain({
      handManagement: [
        {
          handPlanId: "flood",
          phase: "agenda_flood_relief",
          agendaCount: 4,
          handSize: 7,
          maximumHandSize: 5,
          concretePurposeCode: "reduce_agenda_flood",
          value: 20,
          evidenceCode: "visible_own_agenda_flood",
        },
      ],
    });
    expect(corpTacticalActionFamilyOwner(draw, planDomain)).toBe(
      "corp.hand_and_agenda_management",
    );
    expect(corpTacticalActionFamilyOwner(draw, domain({}))).toBeUndefined();
  });

  it("leaves an unneeded purge ownerless so coverage failure is visible", () => {
    const purge = candidate(
      "purge",
      "purge_virus_counters",
      "counter.purge_runner_virus",
    );
    expect(
      corpTacticalActionFamilyOwner(purge, domain({})),
    ).toBeUndefined();
  });
});

function tacticalModule(moduleId: string) {
  return createCorpTacticalPlanModules().find(
    (module) => module.moduleId === moduleId,
  )!;
}

function punishSignal(
  phase: "prepare" | "trace" | "tag" | "damage" | "kill",
) {
  return {
    campaignId: "campaign",
    phase,
    sourceDefinitionIds: ["punish-card"],
    feasible: true,
    guarantee: "visible_state_forced" as const,
    visibleTerminalProjection: false,
    value: 30,
    evidenceCode: "visible_punish_line",
  };
}

function context(
  candidates: ActionSemanticCandidate[],
  overrides: Partial<CorpTacticalPlanDomain>,
): PlanSchedulerContext {
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
    domain: domain(overrides),
  };
}

function domain(
  overrides: Partial<CorpTacticalPlanDomain>,
): CorpPlanDomain {
  const core: CorpCorePlanDomain = {
    scoreProjects: [],
    remoteProjects: [],
    defenseNeeds: [],
    economyNeeds: [],
  };
  return {
    ...core,
    virusPressure: overrides.virusPressure ?? [],
    punishCampaigns: overrides.punishCampaigns ?? [],
    ambushes: overrides.ambushes ?? [],
    handManagement: overrides.handManagement ?? [],
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
    ...candidate(actionId, actionId, semanticActionType),
    sourceKind: "card",
    sourceDefinitionId,
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
