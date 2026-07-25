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

  it("admits preparation and immediate execution without a nonexistent parent", () => {
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
    expect(sequence.parentInstanceId).toBeUndefined();
  });

  it("assigns a bound punish-support rez to the preparation campaign", () => {
    const rez = cardAction(
      "rez-support",
      "corp_window.rez",
      "punish-card",
    );
    const planDomain = domain({
      punishCampaigns: [
        {
          ...punishSignal("prepare"),
          initiatingSemanticActionType: "corp_window.rez",
        },
      ],
    });

    expect(corpTacticalActionFamilyOwner(rez, planDomain)).toBe(
      "corp.punish_campaign",
    );
  });

  it("binds a punish-support preparation to its exact planned placement action", () => {
    const hq = cardAction(
      "install-paris-hq",
      "install.card",
      "paris-city-grid",
    );
    const rd = cardAction(
      "install-paris-rd",
      "install.card",
      "paris-city-grid",
    );
    const signal = {
      ...punishSignal("prepare"),
      sourceDefinitionIds: ["paris-city-grid"],
      actionIds: [hq.actionId],
      initiatingSemanticActionType: "install.card",
    };
    const planDomain = domain({ punishCampaigns: [signal] });
    const module = tacticalModule("corp.punish_campaign");
    const moduleContext = context([hq, rd], {
      punishCampaigns: [signal],
    });
    const instance = instantiatePlanProposal(
      module.discover(moduleContext)[0]!,
      10,
    );

    expect(corpTacticalActionFamilyOwner(hq, planDomain)).toBe(
      "corp.punish_campaign",
    );
    expect(corpTacticalActionFamilyOwner(rd, planDomain)).toBeUndefined();
    expect(
      module
        .materialize(instance, {} as never, moduleContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["install-paris-hq"]);
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

  it("starts an immediate trace sequence with the operation that creates the trace", () => {
    const operation = cardAction(
      "play-trace-operation",
      "play.corp_operation",
      "punish-card",
    );
    const module = tacticalModule("corp.execute_punish_sequence");
    const corpContext = context([operation], {
      punishCampaigns: [
        {
          ...punishSignal("trace"),
          initiatingSemanticActionType: "play.corp_operation",
        },
      ],
    });
    const instance = instantiatePlanProposal(
      module.discover(corpContext)[0]!,
      10,
    );

    expect(
      module.materialize(instance, {} as never, corpContext).candidates.map(
        (entry) => entry.candidate.actionId,
      ),
    ).toEqual(["play-trace-operation"]);
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
              commitmentVersion: "corp_ambush_commitment_v1",
              ambushId: "ambush",
              sourceDefinitionId: "ambush",
              sourceInstanceId: "ambush-instance",
              actionIds: ["install"],
              serverId: "remote_1",
              phase: "install",
              assignedDomainPlanIds: [],
              duplicateAlreadyInstalled: false,
              affordableOrSupportable: true,
              plannedAtStateVersion: 10,
              plannedAdvancementTarget: 0,
              value: 5,
              evidenceCode: "card_in_hq",
            },
          ],
        }),
      ),
    ).toEqual([]);
  });

  it("materializes each same-definition ambush copy only through its exact install action", () => {
    const installA = {
      ...cardAction("install-a", "install.card", "ambush"),
      sourceCardInstanceId: "ambush-a",
      runProjectionSummary: {
        serverId: "remote_1",
        serverKind: "remote" as const,
        source: "legal_action_payload" as const,
        evidence: [],
      },
    };
    const installB = {
      ...cardAction("install-b", "install.card", "ambush"),
      sourceCardInstanceId: "ambush-b",
      runProjectionSummary: {
        serverId: "remote_1",
        serverKind: "remote" as const,
        source: "legal_action_payload" as const,
        evidence: [],
      },
    };
    const module = tacticalModule("corp.ambush_and_bluff");
    const corpContext = context([installA, installB], {
      ambushes: [
        ambushSignal("install", "ambush-a", "install-a"),
        ambushSignal("install", "ambush-b", "install-b"),
      ],
    });
    const plans = module.discover(corpContext);

    expect(plans).toHaveLength(2);
    expect(
      plans.map((proposal) => {
        const instance = instantiatePlanProposal(proposal, 10);
        return module
          .materialize(instance, {} as never, corpContext)
          .candidates.map((entry) => entry.candidate.actionId);
      }),
    ).toEqual([["install-a"], ["install-b"]]);
    expect(
      corpTacticalActionFamilyOwner(
        installA,
        corpContext.domain as CorpPlanDomain,
      ),
    ).toBe("corp.ambush_and_bluff");
    expect(
      corpTacticalActionFamilyOwner(
        {
          ...installA,
          actionId: "unbound-sibling-action",
        },
        corpContext.domain as CorpPlanDomain,
      ),
    ).toBeUndefined();
  });

  it("keeps install, advance and trigger steps bound to one ambush instance", () => {
    const module = tacticalModule("corp.ambush_and_bluff");
    const phases = [
      {
        phase: "install" as const,
        action: {
          ...cardAction("install-a", "install.card", "ambush"),
          sourceCardInstanceId: "ambush-a",
        },
      },
      {
        phase: "advance" as const,
        action: {
          ...cardAction("advance-a", "score.advance_card", "ambush"),
          sourceCardInstanceId: "ambush-a",
        },
      },
      {
        phase: "trigger" as const,
        action: {
          ...cardAction("trigger-a", "card_ability.trigger", "ambush"),
          sourceCardInstanceId: "ambush-a",
        },
      },
    ];

    for (const { phase, action } of phases) {
      const sibling = {
        ...action,
        actionId: `${phase}-b`,
        sourceCardInstanceId: "ambush-b",
      };
      const corpContext = context([action, sibling], {
        ambushes: [ambushSignal(phase, "ambush-a", action.actionId)],
      });
      const proposal = module.discover(corpContext)[0]!;
      const materialized = module.materialize(
        instantiatePlanProposal(proposal, 10),
        {} as never,
        corpContext,
      );

      expect(
        materialized.candidates.map((entry) => entry.candidate.actionId),
      ).toEqual([action.actionId]);
      expect(materialized.step.target).toEqual(
        phase === "install"
          ? { kind: "server", id: "remote_1" }
          : { kind: "card", id: "ambush-a" },
      );
    }
  });

  it("owns only a draw explicitly materialized by an allowed hand plan", () => {
    const draw = candidate("draw", "draw_card", "draw.card");
    const planDomain = domain({
      handManagement: [
        {
          handPlanId: "draw-for-plan",
          phase: "draw_for_plan",
          agendaCount: 0,
          handSize: 2,
          maximumHandSize: 5,
          actionIds: ["draw"],
          concretePurposeCode: "find_plan_material",
          value: 20,
          evidenceCode: "concrete_draw_need",
        },
      ],
    });
    expect(corpTacticalActionFamilyOwner(draw, planDomain)).toBe(
      "corp.hand_and_agenda_management",
    );
    expect(
      corpTacticalActionFamilyOwner(
        draw,
        domain({
          handManagement: [
            {
              ...planDomain.handManagement[0]!,
              routeAllowed: false,
            },
          ],
        }),
      ),
    ).toBeUndefined();
    expect(corpTacticalActionFamilyOwner(draw, domain({}))).toBeUndefined();
  });

  it("materializes an exact mixed economy action only when it projects a draw", () => {
    const mixedDraw = {
      ...cardAction(
        "night-shift",
        "economy.gain_credit",
        "onr_v1_295_night-shift",
      ),
      economyProjection: { cardsDrawn: 1 } as never,
    };
    const noDraw = {
      ...mixedDraw,
      actionId: "credit-only",
      legalActionRef: {
        ...mixedDraw.legalActionRef,
        actionId: "credit-only",
      },
      economyProjection: { cardsDrawn: 0 } as never,
    };
    const handSignal = {
      handPlanId: "draw-for-plan",
      phase: "draw_for_plan" as const,
      agendaCount: 0,
      handSize: 1,
      maximumHandSize: 5,
      actionIds: ["night-shift", "credit-only"],
      concretePurposeCode: "find_plan_material",
      value: 20,
      evidenceCode: "concrete_draw_need",
    };
    const schedulerContext = context([mixedDraw, noDraw], {
      handManagement: [handSignal],
    });
    const module = tacticalModule("corp.hand_and_agenda_management");
    const proposal = module.discover(schedulerContext)[0]!;
    const instance = instantiatePlanProposal(proposal, 10);

    const materialized = module.materialize(
      instance,
      module.assess(instance, schedulerContext, emptyPortfolio()) as never,
      schedulerContext,
    );

    expect(
      materialized.candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["night-shift"]);
    expect(materialized.step.capability.semanticActionTypes).toContain(
      "economy.gain_credit",
    );
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

function ambushSignal(
  phase: "install" | "advance" | "trigger",
  sourceInstanceId: string,
  actionId: string,
) {
  return {
    commitmentVersion: "corp_ambush_commitment_v1" as const,
    ambushId: `ambush:${sourceInstanceId}`,
    sourceDefinitionId: "ambush",
    sourceInstanceId,
    actionIds: [actionId],
    serverId: "remote_1",
    phase,
    purposeCode: "develop_ambush",
    assignedDomainPlanIds: ["ambush"],
    duplicateAlreadyInstalled: false,
    affordableOrSupportable: true,
    plannedAtStateVersion: 10,
    plannedAdvancementTarget: phase === "advance" ? 1 : 0,
    value: 10,
    evidenceCode: "exact_ambush_action",
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
      playerView: {
        stateVersion: 10,
        timingPoint: "corp_action.main",
        own: {
          clicks: 3,
          credits: 11,
          gripOrHq: Array.from({ length: 6 }, (_, index) => ({
            instanceId: `overflow-card-${index}`,
          })),
          maxHandSize: 5,
        },
      },
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
