import { readFileSync } from "node:fs";
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
  corpDefenseActionDispositions,
  corpDefensePortfolioHasExecutableRoute,
  corpDefensePlacementDispositions,
  corpEconomyActionIsOwned,
  createCorpCorePlanModules,
  assessCorpEconomyFundingRoute,
  type CorpDefenseSignal,
  type CorpCorePlanDomain,
} from "./corp-core-plan-modules";
import { instantiatePlanProposal } from "./plan-instance";
import type { ResidentPlanPortfolio } from "./resident-plan-portfolio";
import { bindBestCurrentPlanRoute } from "./plan-route";
import type { PlanSchedulerContext } from "./plan-scheduler";
import type { KnownCorpFundedIceInstallRouteProjection } from "../runtime/corp-funded-score-protection";

function knownCentralAllocation(
  selectedServerId: "hq" | "rd",
  nearTie = false,
): NonNullable<CorpCorePlanDomain["centralDefenseAllocation"]> {
  const evidence = {
    threat: "material" as const,
    expectedAgendaLoss: { numerator: 1, denominator: 5 },
    expectedTrashableLoss: { numerator: 0, denominator: 1 },
    accessibleCardCount: 1,
    isMultiaccess: false,
    recentRunOrAccessEvents: 0,
    recentSuccessfulAccessRunnerTurns: 0,
    serverBoundEffectIds: [],
  };
  return {
    status: "known",
    selectedServerId,
    evidence: { hq: evidence, rd: evidence },
    canonicalNearTieCandidateServerIds: nearTie ? ["hq", "rd"] : [],
    hqHold: { status: "ineligible" },
  };
}

describe("Corp core plan modules", () => {
  it("keeps score and defense ownership disjoint", () => {
    expect(CORP_CORE_ACTION_OWNERSHIP).toMatchObject({
      "install.agenda": "corp.score_agenda",
      "score.advance_card": "corp.score_agenda",
      "score.agenda": "corp.score_agenda",
      "install.ice": "corp.defend_servers",
    });
    expect(CORP_CORE_ACTION_OWNERSHIP).not.toHaveProperty("corp_window.rez");
  });

  it.each([
    [
      "install_agenda",
      {
        ...cardAction("install", "install.card", "agenda-def"),
        targetContext: targetContext("remote_1", "server"),
      },
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
            agendaPoints: 2,
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

  it("keeps an explicitly bound score route closed to sibling action variants", () => {
    const committed = {
      ...cardAction("install-committed", "install.card", "agenda-def"),
      targetContext: targetContext("remote_1", "server"),
    };
    const sibling = {
      ...cardAction("install-sibling", "install.card", "agenda-def"),
      targetContext: targetContext("remote_1", "server"),
    };
    const module = corpModule("corp.score_agenda");
    const corpContext = context([committed, sibling], {
      scoreProjects: [
        {
          projectId: "score-1",
          agendaDefinitionId: "agenda-def",
          agendaPoints: 2,
          agendaInstanceId: "agenda-1",
          serverId: "remote_1",
          actionIds: ["install-committed"],
          phase: "install_agenda",
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

    expect(
      module
        .materialize(instance, {} as never, corpContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["install-committed"]);
  });

  it("materializes an exact score-conversion action before its Engine choice binds the agenda target", () => {
    const committed = {
      ...candidate(
        "systematic-layoffs",
        "play_operation",
        "score_conversion.place_advancement",
      ),
      sourceKind: "card" as const,
      sourceCardInstanceId: "systematic-layoffs-card",
      sourceDefinitionId: "onr_v1_304_systematic-layoffs",
    };
    const sibling = {
      ...committed,
      actionId: "different-place-advancement",
    };
    const module = corpModule("corp.score_agenda");
    const corpContext = context([committed, sibling], {
      scoreProjects: [
        {
          projectId: "score-1",
          agendaDefinitionId: "agenda-def",
          agendaPoints: 3,
          agendaInstanceId: "agenda-1",
          serverId: "remote_1",
          actionIds: ["systematic-layoffs"],
          routeSemanticActionTypes: ["score_conversion.place_advancement"],
          phase: "convert_agenda",
          sameTurnCloseout: true,
          terminalScore: false,
          feasible: true,
          evidenceCode: "same_turn_score_conversion",
        },
      ],
    });
    const instance = instantiatePlanProposal(
      module.discover(corpContext)[0]!,
      10,
    );

    expect(
      module
        .materialize(instance, {} as never, corpContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["systematic-layoffs"]);
  });

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
          agendaPoints: 2,
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
          kind: "generic",
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
          kind: "generic",
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

  it.each([
    {
      verdict: "productive" as const,
      expectedActionIds: ["rez"],
    },
    {
      verdict: "nonproductive" as const,
      expectedActionIds: ["decline"],
    },
    {
      verdict: "open" as const,
      expectedActionIds: ["rez"],
    },
  ])(
    "materializes the exact rez-window alternatives for a $verdict rez assessment",
    ({ verdict, expectedActionIds }) => {
      const rez = candidate("rez", "rez_ice", "corp_window.rez");
      const decline = candidate(
        "decline",
        "decline_rez",
        "corp_window.decline_rez",
      );
      const module = corpModule("corp.defend_servers");
      const corpContext = context([rez, decline], {
        defenseNeeds: [
          {
            kind: "generic",
            defenseId: "rez:ice-1",
            serverId: "remote_1",
            phase: "rez_response",
            sourceDefinitionIds: [],
            actionIds: ["rez"],
            urgent: true,
            rezWindowVerdict: verdict,
            value:
              verdict === "productive"
                ? 100
                : verdict === "nonproductive"
                  ? -100
                  : 20,
            evidenceCode: `test_rez_${verdict}`,
          },
          {
            kind: "generic",
            defenseId: "decline:ice-1",
            serverId: "remote_1",
            phase: "decline_rez",
            sourceDefinitionIds: [],
            actionIds: ["decline"],
            urgent: true,
            value: 0,
            evidenceCode: "test_decline",
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
      ).toEqual(expectedActionIds);
    },
  );

  it("keeps all server needs in one defense plan and allocates one physical ICE across competing targets", () => {
    const installHq = {
      ...cardAction("install-hq", "install.card", "ice-shared"),
      sourceCardInstanceId: "ice-shared-1",
      targetContext: targetContext("hq", "server"),
    };
    const installRd = {
      ...cardAction("install-rd", "install.card", "ice-shared"),
      sourceCardInstanceId: "ice-shared-1",
      targetContext: targetContext("rd", "server"),
    };
    const installRemote = {
      ...cardAction("install-remote", "install.card", "ice-shared"),
      sourceCardInstanceId: "ice-shared-1",
      targetContext: targetContext("remote_1", "server"),
    };
    const module = corpModule("corp.defend_servers");
    const corpContext = context([installHq, installRd, installRemote], {
      centralDefenseAllocation: knownCentralAllocation("hq", true),
      defenseNeeds: [
        {
          kind: "generic",
          defenseId: "install:hq",
          serverId: "hq",
          phase: "install_ice",
          sourceDefinitionIds: ["ice-shared"],
          urgent: false,
          value: 20,
          evidenceCode: "visible_hq_need",
        },
        {
          kind: "generic",
          defenseId: "install:rd",
          serverId: "rd",
          phase: "install_ice",
          sourceDefinitionIds: ["ice-shared"],
          urgent: false,
          value: 80,
          evidenceCode: "visible_rd_need",
        },
        {
          kind: "generic",
          defenseId: "install:remote_1",
          serverId: "remote_1",
          phase: "install_ice",
          sourceDefinitionIds: ["ice-shared"],
          urgent: false,
          value: 50,
          evidenceCode: "visible_remote_need",
        },
      ],
    });
    const proposals = module.discover(corpContext);
    const instance = instantiatePlanProposal(proposals[0]!, 10);
    const materialized = module.materialize(instance, {} as never, corpContext);

    expect(proposals).toHaveLength(1);
    expect(proposals[0]?.dedupeKey).toBe("server-defense-portfolio");
    expect(
      materialized.candidates.map((entry) => entry.candidate.actionId).sort(),
    ).toEqual(["install-hq", "install-rd"]);
    expect(
      bindBestCurrentPlanRoute({
        side: "corp",
        stateVersion: 10,
        timingPoint: "corp_action.main",
        planInstanceId: instance.instanceId,
        ...materialized,
      }).head.actionId,
    ).toBe("install-hq");
  });

  it("keeps an unpressured global defense portfolio in the background priority class", () => {
    const installHq = {
      ...cardAction("install-hq", "install.card", "ice-shared"),
      sourceCardInstanceId: "ice-shared-1",
      targetContext: targetContext("hq", "server"),
    };
    const installRd = {
      ...cardAction("install-rd", "install.card", "ice-shared"),
      sourceCardInstanceId: "ice-shared-1",
      targetContext: targetContext("rd", "server"),
    };
    const module = corpModule("corp.defend_servers");
    const corpContext = context([installHq, installRd], {
      centralDefenseAllocation: knownCentralAllocation("hq"),
      defenseNeeds: [
        {
          kind: "generic",
          defenseId: "install:hq",
          serverId: "hq",
          phase: "install_ice",
          sourceDefinitionIds: ["ice-shared"],
          urgent: false,
          value: 8,
          evidenceCode: "ordinary_hq_floor",
        },
        {
          kind: "generic",
          defenseId: "install:rd",
          serverId: "rd",
          phase: "install_ice",
          sourceDefinitionIds: ["ice-shared"],
          urgent: false,
          value: 8,
          evidenceCode: "ordinary_rd_floor",
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

    expect(planAssessment.priorityValidation.effectiveClass).toBe("P6");
  });

  it("orders central defense by structural HQ agenda exposure before R&D multiaccess", () => {
    const installHq = {
      ...cardAction("install-hq", "install.card", "ice-shared"),
      sourceCardInstanceId: "ice-shared-1",
      targetContext: targetContext("hq", "server"),
    };
    const installRd = {
      ...cardAction("install-rd", "install.card", "ice-shared"),
      sourceCardInstanceId: "ice-shared-1",
      targetContext: targetContext("rd", "server"),
    };
    const module = corpModule("corp.defend_servers");
    const corpContext = context([installHq, installRd], {
      centralDefenseAllocation: knownCentralAllocation("hq"),
      defenseNeeds: [
        {
          kind: "generic",
          defenseId: "install:hq",
          serverId: "hq",
          phase: "install_ice",
          sourceDefinitionIds: ["ice-shared"],
          urgent: true,
          value: 100,
          evidenceCode:
            "engine_certified_global_defense_access_probability_reduced",
        },
        {
          kind: "generic",
          defenseId: "install:rd",
          serverId: "rd",
          phase: "install_ice",
          sourceDefinitionIds: ["ice-shared"],
          urgent: true,
          value: 100,
          evidenceCode:
            "engine_certified_global_defense_access_probability_reduced",
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
    ).toBe("install-hq");
  });

  it("materializes exactly one canonical HQ/R&D Engine near tie only when the central fact comparator certifies it", () => {
    const actions = ["hq", "rd"].map((serverId) => ({
      ...cardAction(`install-${serverId}`, "install.card", "ice-shared"),
      sourceCardInstanceId: "ice-shared-1",
      targetContext: targetContext(serverId, "server"),
    }));
    const materialize = (
      allocation: NonNullable<CorpCorePlanDomain["centralDefenseAllocation"]>,
      rdValue: number,
    ) => {
      const corpContext = context(
        actions,
        {
          centralDefenseAllocation: allocation,
          defenseNeeds: [
            {
              kind: "generic",
              defenseId: "install:hq",
              serverId: "hq",
              phase: "install_ice",
              sourceDefinitionIds: ["ice-shared"],
              urgent: true,
              value: 100,
              evidenceCode: "exact_hq_route",
            },
            {
              kind: "generic",
              defenseId: "install:rd",
              serverId: "rd",
              phase: "install_ice",
              sourceDefinitionIds: ["ice-shared"],
              urgent: true,
              value: rdValue,
              evidenceCode: "exact_rd_route",
            },
          ],
        },
        { credits: 10, clicks: 3 },
      );
      const module = corpModule("corp.defend_servers");
      const instance = instantiatePlanProposal(
        module.discover(corpContext)[0]!,
        10,
      );
      return module.materialize(instance, {} as never, corpContext);
    };

    expect(
      materialize(knownCentralAllocation("hq", true), 90)
        .engineRandomizedIceInstallNearTie,
    ).toEqual({
      kind: "engine_randomized_ice_install_selection",
      candidates: [
        { actionId: "install-hq", targetServerId: "hq" },
        { actionId: "install-rd", targetServerId: "rd" },
      ],
    });
    expect(
      materialize(knownCentralAllocation("hq"), 90)
        .engineRandomizedIceInstallNearTie,
    ).toBeUndefined();
  });

  it("permits a visible concentrated R&D attack to divert the next central defense from an exposed HQ", () => {
    const installHq = {
      ...cardAction("install-hq", "install.card", "ice-shared"),
      sourceCardInstanceId: "ice-shared-1",
      targetContext: targetContext("hq", "server"),
    };
    const installRd = {
      ...cardAction("install-rd", "install.card", "ice-shared"),
      sourceCardInstanceId: "ice-shared-1",
      targetContext: targetContext("rd", "server"),
    };
    const module = corpModule("corp.defend_servers");
    const corpContext = context([installHq, installRd], {
      centralDefenseAllocation: knownCentralAllocation("rd"),
      defenseNeeds: [
        {
          kind: "generic",
          defenseId: "install:hq",
          serverId: "hq",
          phase: "install_ice",
          sourceDefinitionIds: ["ice-shared"],
          urgent: true,
          value: 100,
          evidenceCode:
            "engine_certified_global_defense_access_probability_reduced",
        },
        {
          kind: "generic",
          defenseId: "install:rd",
          serverId: "rd",
          phase: "install_ice",
          sourceDefinitionIds: ["ice-shared"],
          urgent: true,
          value: 100,
          evidenceCode:
            "engine_certified_global_defense_access_probability_reduced",
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
    ).toBe("install-rd");
  });

  it("selects the exact central route class only after global allocation and preserves non-central continuations", () => {
    const actions = ["hq", "rd", "remote_1"].map((serverId) => ({
      ...cardAction(`install-${serverId}`, "install.card", "ice-shared"),
      sourceCardInstanceId: "ice-shared-1",
      targetContext: targetContext(serverId, "server"),
    }));
    const corpContext = context(actions, {
      centralDefenseAllocation: knownCentralAllocation("rd"),
      defenseNeeds: actions.map((action) => {
        const serverId = action.targetContext.selectedTargets[0]!.targetId;
        return {
          kind: "generic" as const,
          defenseId: `install:${serverId}`,
          serverId,
          phase: "install_ice" as const,
          sourceDefinitionIds: ["ice-shared"],
          urgent: true,
          value: 100,
          evidenceCode: "engine_certified_global_defense_route",
        };
      }),
    });
    const module = corpModule("corp.defend_servers");
    const instance = instantiatePlanProposal(
      module.discover(corpContext)[0]!,
      10,
    );

    expect(
      module
        .materialize(instance, {} as never, corpContext)
        .candidates.map((entry) => entry.candidate.actionId)
        .sort(),
    ).toEqual(["install-rd"]);
  });

  it("keeps the selected central route when only a non-central alternative is also available", () => {
    const actions = ["hq", "archives"].map((serverId) => ({
      ...cardAction(`install-${serverId}`, "install.card", "ice-shared"),
      sourceCardInstanceId: "ice-shared-1",
      targetContext: targetContext(serverId, "server"),
    }));
    const corpContext = context(actions, {
      centralDefenseAllocation: knownCentralAllocation("hq"),
      defenseNeeds: actions.map((action) => {
        const serverId = action.targetContext.selectedTargets[0]!.targetId;
        return {
          kind: "generic" as const,
          defenseId: `install:${serverId}`,
          serverId,
          phase: "install_ice" as const,
          sourceDefinitionIds: ["ice-shared"],
          urgent: true,
          value: 100,
          evidenceCode: "engine_certified_global_defense_route",
        };
      }),
    });
    const module = corpModule("corp.defend_servers");
    const instance = instantiatePlanProposal(
      module.discover(corpContext)[0]!,
      10,
    );

    expect(
      module
        .materialize(instance, {} as never, corpContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["install-hq"]);
  });

  it("fails closed between two central heads when their allocation facts are unknown while another server route remains executable", () => {
    const actions = ["hq", "rd", "remote_1"].map((serverId) => ({
      ...cardAction(`install-${serverId}`, "install.card", "ice-shared"),
      sourceCardInstanceId: "ice-shared-1",
      targetContext: targetContext(serverId, "server"),
    }));
    const corpContext = context(actions, {
      centralDefenseAllocation: {
        status: "unknown",
        reason: "incomplete_or_invalid_facts",
      },
      defenseNeeds: actions.map((action) => {
        const serverId = action.targetContext.selectedTargets[0]!.targetId;
        return {
          kind: "generic" as const,
          defenseId: `install:${serverId}`,
          serverId,
          phase: "install_ice" as const,
          sourceDefinitionIds: ["ice-shared"],
          urgent: true,
          value: 100,
          evidenceCode: "engine_certified_global_defense_route",
        };
      }),
    });
    const module = corpModule("corp.defend_servers");
    const instance = instantiatePlanProposal(
      module.discover(corpContext)[0]!,
      10,
    );

    expect(
      module
        .materialize(instance, {} as never, corpContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["install-remote_1"]);
  });

  it("keeps only the canonical exact route per HQ/R&D near-tie server", () => {
    const universalHq = {
      ...cardAction("a-universal-hq", "install.card", "universal-ice"),
      sourceCardInstanceId: "universal-ice-1",
      targetContext: targetContext("hq", "server"),
    };
    const universalRd = {
      ...cardAction("z-universal-rd", "install.card", "universal-ice"),
      sourceCardInstanceId: "universal-ice-1",
      targetContext: targetContext("rd", "server"),
    };
    const hqSpecialist = {
      ...cardAction("b-hq-specialist", "install.card", "hq-specialist"),
      sourceCardInstanceId: "hq-specialist-1",
      targetContext: targetContext("hq", "server"),
    };
    const module = corpModule("corp.defend_servers");
    const corpContext = context(
      [universalHq, universalRd, hqSpecialist],
      {
        centralDefenseAllocation: knownCentralAllocation("hq", true),
        defenseNeeds: [
          {
            kind: "generic",
            defenseId: "install:hq",
            serverId: "hq",
            phase: "install_ice",
            sourceDefinitionIds: ["universal-ice", "hq-specialist"],
            urgent: false,
            value: 100,
            evidenceCode: "visible_hq_need",
          },
          {
            kind: "generic",
            defenseId: "install:rd",
            serverId: "rd",
            phase: "install_ice",
            sourceDefinitionIds: ["universal-ice"],
            urgent: false,
            value: 90,
            evidenceCode: "visible_rd_need",
          },
        ],
      },
      { credits: 20, clicks: 3 },
    );
    const instance = instantiatePlanProposal(
      module.discover(corpContext)[0]!,
      10,
    );
    const materialized = module.materialize(instance, {} as never, corpContext);

    expect(
      materialized.candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["a-universal-hq", "z-universal-rd"]);
    expect(
      bindBestCurrentPlanRoute({
        side: "corp",
        stateVersion: 10,
        timingPoint: "corp_action.main",
        planInstanceId: instance.instanceId,
        ...materialized,
      }).head.actionId,
    ).toBe("a-universal-hq");
  });

  it("does not turn a current exact HQ/R&D near tie into a numeric budget ranking", () => {
    const installHq = {
      ...cardAction("install-hq", "install.card", "hq-ice"),
      sourceCardInstanceId: "hq-ice-1",
      costProfile: {
        creditCost: 4,
        clickCost: 1,
        costKnownStatus: "known" as const,
        additionalCosts: [],
      },
      targetContext: targetContext("hq", "server"),
    };
    const installRd = {
      ...cardAction("install-rd", "install.card", "rd-ice"),
      sourceCardInstanceId: "rd-ice-1",
      costProfile: {
        creditCost: 4,
        clickCost: 1,
        costKnownStatus: "known" as const,
        additionalCosts: [],
      },
      targetContext: targetContext("rd", "server"),
    };
    const module = corpModule("corp.defend_servers");
    const corpContext = context(
      [installHq, installRd],
      {
        centralDefenseAllocation: knownCentralAllocation("hq", true),
        defenseNeeds: [
          {
            kind: "generic",
            defenseId: "install:hq",
            serverId: "hq",
            phase: "install_ice",
            sourceDefinitionIds: ["hq-ice"],
            urgent: false,
            value: 100,
            evidenceCode: "visible_hq_need",
          },
          {
            kind: "generic",
            defenseId: "install:rd",
            serverId: "rd",
            phase: "install_ice",
            sourceDefinitionIds: ["rd-ice"],
            urgent: false,
            value: 90,
            evidenceCode: "visible_rd_need",
          },
        ],
      },
      { credits: 6, clicks: 3 },
    );
    const instance = instantiatePlanProposal(
      module.discover(corpContext)[0]!,
      10,
    );

    const allocationValues = Object.fromEntries(
      module
        .materialize(instance, {} as never, corpContext)
        .candidates.map((entry) => [entry.candidate.actionId, entry.stepValue]),
    );
    expect(allocationValues).toEqual({
      "install-hq": 1,
      "install-rd": 1,
    });
  });

  it("materializes one current exact install route without layer projection", () => {
    const firstRemote = {
      ...cardAction("first-remote", "install.card", "first-ice"),
      sourceCardInstanceId: "first-ice-1",
      targetContext: targetContext("remote_1", "server"),
    };
    const firstHq = {
      ...cardAction("first-hq", "install.card", "first-ice"),
      sourceCardInstanceId: "first-ice-1",
      targetContext: targetContext("hq", "server"),
    };
    const secondRemote = {
      ...cardAction("second-remote", "install.card", "second-ice"),
      sourceCardInstanceId: "second-ice-1",
      targetContext: targetContext("remote_1", "server"),
    };
    const secondHq = {
      ...cardAction("second-hq", "install.card", "second-ice"),
      sourceCardInstanceId: "second-ice-1",
      targetContext: targetContext("hq", "server"),
    };
    const module = corpModule("corp.defend_servers");
    const corpContext = context(
      [firstRemote, firstHq, secondRemote, secondHq],
      {
        defenseNeeds: [
          {
            kind: "generic",
            defenseId: "install:remote_1",
            serverId: "remote_1",
            phase: "install_ice",
            sourceDefinitionIds: ["first-ice", "second-ice"],
            urgent: false,
            value: 500,
            evidenceCode: "critical_score_remote",
          },
          {
            kind: "generic",
            defenseId: "install:hq",
            serverId: "hq",
            phase: "install_ice",
            sourceDefinitionIds: ["first-ice", "second-ice"],
            urgent: false,
            value: 60,
            evidenceCode: "ordinary_hq_floor",
          },
        ],
      },
      { credits: 20, clicks: 3 },
    );
    const instance = instantiatePlanProposal(
      module.discover(corpContext)[0]!,
      10,
    );
    const allocationValues = Object.fromEntries(
      module
        .materialize(instance, {} as never, corpContext)
        .candidates.map((entry) => [entry.candidate.actionId, entry.stepValue]),
    );

    expect(allocationValues).toEqual({ "first-hq": 1 });
  });

  it("exposes the exact global-defense route result without a second admission heuristic", () => {
    const install = {
      ...cardAction("install-rd", "install.card", "rd-ice"),
      targetContext: targetContext("rd", "server"),
    };
    const signal = {
      kind: "generic",
      defenseId: "install:rd",
      serverId: "rd",
      phase: "install_ice",
      sourceDefinitionIds: ["rd-ice"],
      urgent: false,
      value: 80,
      evidenceCode: "visible_rd_need",
    } satisfies CorpDefenseSignal;
    const corpContext = context(
      [install],
      { defenseNeeds: [signal] },
      { credits: 0, clicks: 1 },
    );

    expect(corpDefensePortfolioHasExecutableRoute(corpContext, [signal])).toBe(
      true,
    );
    corpContext.input.legalActions[0]!.source = "different-instance";
    expect(corpDefensePortfolioHasExecutableRoute(corpContext, [signal])).toBe(
      false,
    );
  });

  it("fails closed when a defense placement source instance is unresolved or its candidate cost drifts from LegalAction", () => {
    const {
      sourceCardInstanceId: _unresolvedSourceCardInstanceId,
      ...unresolvedInstall
    } = {
      ...cardAction("install-rd", "install.card", "rd-ice"),
      targetContext: targetContext("rd", "server"),
    };
    const signal = {
      kind: "generic",
      defenseId: "install:rd",
      serverId: "rd",
      phase: "install_ice",
      sourceDefinitionIds: ["rd-ice"],
      urgent: false,
      value: 80,
      evidenceCode: "visible_rd_need",
    } satisfies CorpDefenseSignal;
    const unresolvedContext = context(
      [unresolvedInstall],
      { defenseNeeds: [signal] },
      { credits: 5, clicks: 1 },
    );
    expect(() =>
      corpDefensePortfolioHasExecutableRoute(unresolvedContext, [signal]),
    ).toThrowError("missing_plan_module_coverage");

    const costedInstall = {
      ...cardAction("install-rd", "install.card", "rd-ice"),
      targetContext: targetContext("rd", "server"),
    };
    const driftContext = context(
      [costedInstall],
      { defenseNeeds: [signal] },
      { credits: 5, clicks: 1 },
    );
    driftContext.input.legalActions[0]!.costs = [{ clicks: 1, credits: 1 }];
    expect(corpDefensePortfolioHasExecutableRoute(driftContext, [signal])).toBe(
      false,
    );
  });

  it.each([
    ["missing credits", "credits", undefined],
    ["NaN credits", "credits", Number.NaN],
    ["infinite credits", "credits", Number.POSITIVE_INFINITY],
    ["negative credits", "credits", -1],
    ["fractional credits", "credits", 1.5],
    ["missing clicks", "clicks", undefined],
    ["NaN clicks", "clicks", Number.NaN],
    ["infinite clicks", "clicks", Number.POSITIVE_INFINITY],
    ["negative clicks", "clicks", -1],
    ["fractional clicks", "clicks", 1.5],
  ] as const)(
    "fails closed on %s in the visible defense-allocation budget",
    (_label, resource, value) => {
      const install = {
        ...cardAction("install-rd", "install.card", "rd-ice"),
        targetContext: targetContext("rd", "server"),
      };
      const signal = {
        kind: "generic",
        defenseId: "install:rd",
        serverId: "rd",
        phase: "install_ice",
        sourceDefinitionIds: ["rd-ice"],
        urgent: false,
        value: 80,
        evidenceCode: "visible_rd_need",
      } satisfies CorpDefenseSignal;
      const corpContext = context(
        [install],
        { defenseNeeds: [signal] },
        { credits: 1, clicks: 1 },
      );
      const own = corpContext.input.playerView.own as {
        credits?: number;
        clicks?: number;
      };
      if (value === undefined) {
        delete own[resource];
      } else {
        own[resource] = value;
      }

      expect(
        corpDefensePortfolioHasExecutableRoute(corpContext, [signal]),
      ).toBe(false);
    },
  );

  it("keeps authoritative zero credits distinct from unknown while zero clicks correctly blocks placement", () => {
    const install = {
      ...cardAction("install-rd", "install.card", "rd-ice"),
      targetContext: targetContext("rd", "server"),
    };
    const signal = {
      kind: "generic",
      defenseId: "install:rd",
      serverId: "rd",
      phase: "install_ice",
      sourceDefinitionIds: ["rd-ice"],
      urgent: false,
      value: 80,
      evidenceCode: "visible_rd_need",
    } satisfies CorpDefenseSignal;
    const corpContext = context(
      [install],
      { defenseNeeds: [signal] },
      { credits: 0, clicks: 1 },
    );
    expect(corpDefensePortfolioHasExecutableRoute(corpContext, [signal])).toBe(
      true,
    );

    corpContext.input.playerView.own.clicks = 0;
    expect(corpDefensePortfolioHasExecutableRoute(corpContext, [signal])).toBe(
      false,
    );
  });

  it("fails closed when a post-install Engine quote drifts from the exact projection", () => {
    const cheap = {
      ...cardAction("install-cheap", "install.card", "cheap-ice"),
      targetContext: targetContext("rd", "server"),
    };
    const expensive = {
      ...cardAction("install-expensive", "install.card", "expensive-ice"),
      targetContext: targetContext("rd", "server"),
    };
    const signal = {
      kind: "generic",
      defenseId: "install:rd",
      serverId: "rd",
      phase: "install_ice",
      sourceDefinitionIds: ["cheap-ice", "expensive-ice"],
      urgent: false,
      value: 80,
      evidenceCode: "visible_rd_need",
    } satisfies CorpDefenseSignal;
    const routeIsExecutable = (
      cheapRezCost: number,
      expensiveRezCost: number,
    ) => {
      const corpContext = context(
        [cheap, expensive],
        { defenseNeeds: [signal] },
        { credits: 3, clicks: 1 },
      );
      for (const action of corpContext.input.legalActions) {
        action.payload!.postInstallRezQuoteFinalCredits =
          action.actionId === cheap.actionId ? cheapRezCost : expensiveRezCost;
      }
      return corpDefensePortfolioHasExecutableRoute(
        corpContext,
        (corpContext.domain as CorpCorePlanDomain).defenseNeeds,
      );
    };

    expect(routeIsExecutable(0, 0)).toBe(true);
    expect(routeIsExecutable(1, 4)).toBe(false);
    expect(routeIsExecutable(4, 1)).toBe(false);
  });

  it("does not let another installed ICE quote locally veto the exact route", () => {
    const install = {
      ...cardAction("install-rd", "install.card", "rd-ice"),
      targetContext: targetContext("rd", "server"),
    };
    const signal = {
      kind: "generic",
      defenseId: "install:rd",
      serverId: "rd",
      phase: "install_ice",
      sourceDefinitionIds: ["rd-ice"],
      urgent: false,
      value: 80,
      evidenceCode: "visible_rd_need",
    } satisfies CorpDefenseSignal;
    const corpContext = context(
      [install],
      { defenseNeeds: [signal] },
      { credits: 4, clicks: 1 },
    );
    const server = corpContext.input.playerView.servers.find(
      (candidateServer) => candidateServer.id === "rd",
    )!;
    server.ice.push({
      instanceId: "existing-rd-ice",
      known: true,
      type: "ice",
      rezzed: false,
      rezCost: 0,
      effectiveRezCostQuote: {
        context: "installed",
        cardId: "existing-rd-ice",
        targetServerId: "rd",
        projectedServerId: "rd",
        expiresAtStateVersion: 10,
        complete: true,
        baseCredits: 0,
        finalCredits: 4,
        mandatoryAdditionalCosts: { agendaPoints: 0 },
      },
    });
    expect(corpDefensePortfolioHasExecutableRoute(corpContext, [signal])).toBe(
      true,
    );

    const quote = server.ice[0]!.effectiveRezCostQuote;
    if (!quote || !quote.complete) throw new Error("expected complete quote");
    quote.finalCredits = 3;
    expect(corpDefensePortfolioHasExecutableRoute(corpContext, [signal])).toBe(
      true,
    );
  });

  it.each([
    ["current", true],
    ["missing_quote", false],
    ["incomplete_quote", false],
    ["stale_quote", false],
    ["unknown_rezzed_state", false],
    ["extra_selection", false],
    ["duplicate_selection", false],
  ] as const)(
    "binds every selected rez cost to current installed ICE facts: %s",
    (mode, expectedExecutable) => {
      const install = {
        ...cardAction("install-rd", "install.card", "new-rd-ice"),
        targetContext: targetContext("rd", "server"),
      };
      const sourceProjection = knownInstallProjection({
        actionId: install.actionId,
        sourceCardInstanceId: install.sourceCardInstanceId!,
        sourceDefinitionId: install.sourceDefinitionId!,
        targetServerId: "rd",
        effect: "progress",
        probability: { numerator: 0, denominator: 1 },
        totalCredits: 1,
      });
      const existingSelection = {
        iceInstanceId: "existing-rd-ice",
        iceDefinitionId: "existing-rd-ice-definition",
        credits: 1,
        source: "engine_rez_cost_quote" as const,
      };
      const selectedRezCosts = [
        ...sourceProjection.selectedRezCosts,
        existingSelection,
        ...(mode === "extra_selection"
          ? [
              {
                iceInstanceId: "ghost-rd-ice",
                iceDefinitionId: "ghost-rd-ice-definition",
                credits: 1,
                source: "engine_rez_cost_quote" as const,
              },
            ]
          : []),
        ...(mode === "duplicate_selection" ? [existingSelection] : []),
      ];
      const projection = {
        ...sourceProjection,
        selectedRezCosts,
        after: {
          ...sourceProjection.after,
          selectedRezCosts,
          totalSelectedRezCost: selectedRezCosts.reduce(
            (total, cost) => total + cost.credits,
            0,
          ),
        },
      } satisfies KnownCorpFundedIceInstallRouteProjection;
      const signal = {
        kind: "generic",
        defenseId: "install:rd",
        serverId: "rd",
        phase: "install_ice",
        sourceDefinitionIds: [install.sourceDefinitionId!],
        actionIds: [install.actionId],
        urgent: false,
        value: 80,
        evidenceCode: "visible_rd_need",
        installRoute: {
          disposition: "productive",
          projection,
        },
      } satisfies CorpDefenseSignal;
      const corpContext = context(
        [install],
        { defenseNeeds: [signal] },
        { credits: 0, clicks: 3 },
      );
      const server = corpContext.input.playerView.servers.find(
        (candidateServer) => candidateServer.id === "rd",
      )!;
      const quoteBinding = {
        context: "installed" as const,
        cardId: existingSelection.iceInstanceId,
        targetServerId: "rd" as const,
        projectedServerId: "rd" as const,
        expiresAtStateVersion: mode === "stale_quote" ? 11 : 10,
      };
      server.ice.push({
        instanceId: existingSelection.iceInstanceId,
        known: true,
        definitionId: existingSelection.iceDefinitionId,
        type: "ice",
        ...(mode === "unknown_rezzed_state" ? {} : { rezzed: false }),
        ...(mode === "missing_quote"
          ? {}
          : {
              effectiveRezCostQuote:
                mode === "incomplete_quote"
                  ? { ...quoteBinding, complete: false as const }
                  : {
                      ...quoteBinding,
                      complete: true as const,
                      baseCredits: 1,
                      finalCredits: 1,
                      mandatoryAdditionalCosts: { agendaPoints: 0 },
                    },
            }),
      });

      expect(
        corpDefensePortfolioHasExecutableRoute(corpContext, [signal]),
      ).toBe(expectedExecutable);
    },
  );

  it("does not use printed ICE cost when the post-install Engine quote is incomplete", () => {
    const install = {
      ...cardAction("install-rd", "install.card", "rd-ice"),
      targetContext: targetContext("rd", "server"),
    };
    const signal = {
      kind: "generic",
      defenseId: "install:rd",
      serverId: "rd",
      phase: "install_ice",
      sourceDefinitionIds: ["rd-ice"],
      urgent: false,
      value: 80,
      evidenceCode: "visible_rd_need",
    } satisfies CorpDefenseSignal;
    const corpContext = context(
      [install],
      { defenseNeeds: [signal] },
      { credits: 5, clicks: 1 },
    );
    corpContext.input.playerView.own.gripOrHq[0]!.rezCost = 0;
    corpContext.input.legalActions[0]!.payload!.postInstallRezQuoteComplete = false;

    expect(corpDefensePortfolioHasExecutableRoute(corpContext, [signal])).toBe(
      false,
    );
  });

  it("does not let an unrelated installed quote override the exact install projection", () => {
    const install = {
      ...cardAction("install-rd", "install.card", "rd-ice"),
      targetContext: targetContext("rd", "server"),
    };
    const signal = {
      kind: "generic",
      defenseId: "install:rd",
      serverId: "rd",
      phase: "install_ice",
      sourceDefinitionIds: ["rd-ice"],
      urgent: false,
      value: 80,
      evidenceCode: "visible_rd_need",
    } satisfies CorpDefenseSignal;
    const corpContext = context(
      [install],
      { defenseNeeds: [signal] },
      { credits: 1, clicks: 1 },
    );
    const server = corpContext.input.playerView.servers.find(
      (candidateServer) => candidateServer.id === "rd",
    )!;
    server.ice.push({
      instanceId: "existing-rd-ice",
      known: true,
      type: "ice",
      rezzed: false,
      rezCost: 0,
      effectiveRezCostQuote: {
        context: "installed",
        cardId: "existing-rd-ice",
        targetServerId: "rd",
        projectedServerId: "rd",
        expiresAtStateVersion: 10,
        complete: false,
      },
    });
    expect(corpDefensePortfolioHasExecutableRoute(corpContext, [signal])).toBe(
      true,
    );

    server.ice[0]!.rezCost = 99;
    server.ice[0]!.effectiveRezCostQuote = {
      context: "installed",
      cardId: "existing-rd-ice",
      targetServerId: "rd",
      projectedServerId: "rd",
      expiresAtStateVersion: 10,
      complete: true,
      baseCredits: 99,
      finalCredits: 0,
      mandatoryAdditionalCosts: { agendaPoints: 0 },
    };
    expect(corpDefensePortfolioHasExecutableRoute(corpContext, [signal])).toBe(
      true,
    );
  });

  it("does not reconstruct future layer costs from install payload arithmetic", () => {
    const allocationValue = (reduction: number) => {
      const first = {
        ...cardAction("first-remote", "install.card", "first-ice"),
        targetContext: targetContext("remote_1", "server"),
      };
      const second = {
        ...cardAction("second-remote", "install.card", "second-ice"),
        targetContext: targetContext("remote_1", "server"),
      };
      const signal = {
        kind: "generic",
        defenseId: "install:remote_1",
        serverId: "remote_1",
        phase: "install_ice",
        sourceDefinitionIds: ["first-ice", "second-ice"],
        urgent: false,
        value: 500,
        evidenceCode: "critical_score_remote",
      } satisfies CorpDefenseSignal;
      const corpContext = context(
        [first, second],
        { defenseNeeds: [signal] },
        { credits: 0, clicks: 2 },
      );
      for (const action of corpContext.input.legalActions) {
        action.payload = {
          ...action.payload,
          iceInstallBaseCost: 0,
          iceInstallAdditionalCost: 0,
          iceInstallReduction: reduction,
          iceInstallTotalCost: 0,
        };
      }
      const module = corpModule("corp.defend_servers");
      const instance = instantiatePlanProposal(
        module.discover(corpContext)[0]!,
        10,
      );
      return module
        .materialize(instance, {} as never, corpContext)
        .candidates.find(
          (candidate) => candidate.candidate.actionId === "first-remote",
        )!.stepValue;
    };

    const normalLayerCost = allocationValue(0);
    const reducedToZero = allocationValue(2);
    expect(reducedToZero).toBe(normalLayerCost);
  });

  it("does not speculate about a second same-server ICE placement without complete consistent payload cost facts", () => {
    const projectedValue = (payloadMode: "complete" | "missing" | "drift") => {
      const first = {
        ...cardAction("first-remote", "install.card", "first-ice"),
        targetContext: targetContext("remote_1", "server"),
      };
      const second = {
        ...cardAction("second-remote", "install.card", "second-ice"),
        targetContext: targetContext("remote_1", "server"),
      };
      const signal = {
        kind: "generic",
        defenseId: "install:remote_1",
        serverId: "remote_1",
        phase: "install_ice",
        sourceDefinitionIds: ["first-ice", "second-ice"],
        urgent: false,
        value: 500,
        evidenceCode: "critical_score_remote",
      } satisfies CorpDefenseSignal;
      const corpContext = context(
        [first, second],
        { defenseNeeds: [signal] },
        { credits: 1, clicks: 2 },
      );
      for (const action of corpContext.input.legalActions) {
        if (payloadMode === "missing") {
          delete action.payload?.iceInstallBaseCost;
        }
        if (payloadMode === "drift" && action.payload) {
          action.payload.iceInstallBaseCost = 1;
          action.payload.iceInstallTotalCost = 0;
        }
      }
      const module = corpModule("corp.defend_servers");
      const instance = instantiatePlanProposal(
        module.discover(corpContext)[0]!,
        10,
      );
      return module
        .materialize(instance, {} as never, corpContext)
        .candidates.find(
          (candidate) => candidate.candidate.actionId === "first-remote",
        )!.stepValue;
    };

    const complete = projectedValue("complete");
    expect(complete).toBe(projectedValue("missing"));
    expect(complete).toBe(projectedValue("drift"));
  });

  it("contains no zero-default expression for productive defense install or rez costs", () => {
    const source = readFileSync(
      new URL("./corp-core-plan-modules.ts", import.meta.url),
      "utf8",
    );
    expect(source).not.toMatch(/costProfile\.creditCost\s*\?\?\s*0/);
    expect(source).not.toMatch(/rezCost\s*\?\?\s*0/);
  });

  it("uses exact access progress instead of a legacy numeric defense value veto", () => {
    const installArchives = {
      ...cardAction("install-archives", "install.card", "held-ice"),
      sourceCardInstanceId: "held-ice-1",
      targetContext: targetContext("archives", "server"),
    };
    const module = corpModule("corp.defend_servers");
    const corpContext = context([installArchives], {
      defenseNeeds: [
        {
          kind: "generic",
          defenseId: "install:archives",
          serverId: "archives",
          phase: "install_ice",
          sourceDefinitionIds: ["held-ice"],
          urgent: false,
          value: -10,
          evidenceCode: "no_visible_archives_need",
        },
      ],
    });
    const proposal = module.discover(corpContext)[0]!;
    const instance = instantiatePlanProposal(proposal, 10);

    expect(proposal.initialViability).toBe("ready");
    expect(
      module.materialize(instance, {} as never, corpContext).candidates,
    ).toHaveLength(1);
    expect(
      corpDefensePlacementDispositions(
        corpContext,
        (corpContext.domain as CorpCorePlanDomain).defenseNeeds,
      ),
    ).toEqual([]);
  });

  it("keeps a positive ICE allocation as a plan route without a rejection disposition", () => {
    const installHq = {
      ...cardAction("install-hq", "install.card", "held-ice"),
      sourceCardInstanceId: "held-ice-1",
      targetContext: targetContext("hq", "server"),
    };
    const corpContext = context([installHq], {
      defenseNeeds: [
        {
          kind: "generic",
          defenseId: "install:hq",
          serverId: "hq",
          phase: "install_ice",
          sourceDefinitionIds: ["held-ice"],
          urgent: false,
          value: 100,
          evidenceCode: "visible_hq_need",
        },
      ],
    });
    const module = corpModule("corp.defend_servers");
    const instance = instantiatePlanProposal(
      module.discover(corpContext)[0]!,
      10,
    );

    expect(
      module
        .materialize(instance, {} as never, corpContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["install-hq"]);
    expect(
      corpDefensePlacementDispositions(
        corpContext,
        (corpContext.domain as CorpCorePlanDomain).defenseNeeds,
      ),
    ).toEqual([]);
  });

  it("disposes an exact defensive-upgrade server route when an urgent response owns the window", () => {
    const installHq = {
      ...cardAction("install-hq", "install.card", "olivia"),
      sourceCardInstanceId: "olivia-1",
      targetContext: targetContext("hq", "server"),
    };
    const urgentRez = {
      ...cardAction("rez-current", "corp_window.rez", "current-ice"),
      sourceCardInstanceId: "current-ice-1",
      targetContext: targetContext("current-ice-1", "ice"),
    };
    const corpContext = context(
      [installHq, urgentRez],
      {
        defenseNeeds: [
          {
            kind: "generic",
            defenseId: "install-support:hq",
            serverId: "hq",
            phase: "install_defense_support",
            sourceDefinitionIds: ["olivia"],
            actionIds: ["install-hq"],
            urgent: false,
            value: 100,
            evidenceCode: "olivia_supports_hq",
          },
          {
            kind: "generic",
            defenseId: "rez:current-ice-1",
            serverId: "remote_1",
            phase: "rez_response",
            sourceDefinitionIds: ["current-ice"],
            actionIds: ["rez-current"],
            targetIceInstanceId: "current-ice-1",
            urgent: true,
            rezWindowVerdict: "productive",
            value: 200,
            evidenceCode: "urgent_current_rez",
          },
        ],
      },
      { credits: 5, clicks: 3 },
    );

    expect(
      corpDefensePlacementDispositions(
        corpContext,
        (corpContext.domain as CorpCorePlanDomain).defenseNeeds,
      ),
    ).toEqual([
      {
        actionId: "install-hq",
        evidenceCode: "corp_defense_global_allocation_rejected:hq:install-hq",
      },
    ]);
  });

  it("owns a concrete draw-for-ICE step inside the global defense plan", () => {
    const draw = candidate("draw-for-rd-ice", "draw_card", "draw.card");
    const module = corpModule("corp.defend_servers");
    const corpContext = context([draw], {
      defenseNeeds: [
        {
          kind: "generic",
          defenseId: "draw-for-ice:rd",
          serverId: "rd",
          phase: "draw_for_ice",
          sourceDefinitionIds: [],
          actionIds: ["draw-for-rd-ice"],
          urgent: false,
          value: 1_250,
          evidenceCode: "corp_missing_concrete_defense_draw:rd",
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

    expect(planAssessment).toMatchObject({
      priorityValidation: { effectiveClass: "P5" },
      evidenceCodes: ["corp_missing_concrete_defense_draw:rd"],
    });
    expect(materialized.step.capability).toMatchObject({
      capabilityId: "allocate_server_defense",
      semanticActionTypes: ["draw.card"],
    });
    expect(
      bindBestCurrentPlanRoute({
        side: "corp",
        stateVersion: 10,
        timingPoint: "corp_action.main",
        planInstanceId: instance.instanceId,
        ...materialized,
      }).head.actionId,
    ).toBe("draw-for-rd-ice");
  });

  it("raises an exact score-protection draw delegation to P4 without transferring ICE ownership to the score plan", () => {
    const draw = candidate(
      "draw-for-score-remote-ice",
      "draw_card",
      "draw.card",
    );
    const module = corpModule("corp.defend_servers");
    const corpContext = context([draw], {
      defenseNeeds: [
        {
          kind: "score_protection_draw",
          defenseId: "score-support-draw-for-ice:agenda-1",
          serverId: "remote_1",
          phase: "draw_for_ice",
          parentProjectId: "agenda:agenda-1:remote_1",
          delegatedPriorityClass: "P4",
          actionId: draw.actionId,
          drawAttemptState: {
            turnKey: "corp:1",
            remainingAttempts: 1,
          },
          evidenceCode:
            "score_plan_requires_targeted_ice_draw:agenda:agenda-1:remote_1:remote_1",
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

    expect(planAssessment.priorityValidation.effectiveClass).toBe("P4");
    expect(
      module.materialize(instance, planAssessment, corpContext).candidates,
    ).toEqual([
      expect.objectContaining({
        candidate: expect.objectContaining({ actionId: draw.actionId }),
        stepValue: 1,
      }),
    ]);
  });

  it("selects the score parent before its child route and keeps priority, evidence, action, and parent identity aligned", () => {
    const p4Install = {
      ...cardAction("a-p4-install", "install.card", "p4-ice"),
      targetContext: targetContext("remote_2", "server"),
    };
    const p1Draw = candidate("z-p1-draw", "draw_card", "draw.card");
    const urgentDefense = candidate(
      "urgent-defense",
      "trigger_ability",
      "card_ability.trigger",
    );
    const module = corpModule("corp.defend_servers");
    const p1ParentProjectId = "agenda:terminal:remote_1";
    const corpContext = context([p4Install, p1Draw, urgentDefense], {
      defenseNeeds: [
        {
          kind: "score_protection_install",
          defenseId: "score:p4-install",
          serverId: "remote_2",
          phase: "install_ice",
          parentProjectId: "agenda:development:remote_2",
          delegatedPriorityClass: "P4",
          actionId: p4Install.actionId,
          sourceCardInstanceId: p4Install.sourceCardInstanceId!,
          sourceDefinitionId: p4Install.sourceDefinitionId!,
          effect: "satisfied",
          runnerAccessSuccessProbability: {
            numerator: 0,
            denominator: 1,
          },
          totalInstallAndRezCredits: 0,
          projection: knownInstallProjection({
            actionId: p4Install.actionId,
            sourceCardInstanceId: p4Install.sourceCardInstanceId!,
            sourceDefinitionId: p4Install.sourceDefinitionId!,
            targetServerId: "remote_2",
            effect: "satisfied",
            probability: { numerator: 0, denominator: 1 },
            totalCredits: 0,
          }),
          evidenceCode: "p4_install_must_not_preempt_p1_parent",
        },
        {
          kind: "score_protection_draw",
          defenseId: "score:p1-draw",
          serverId: "remote_1",
          phase: "draw_for_ice",
          parentProjectId: p1ParentProjectId,
          delegatedPriorityClass: "P1",
          actionId: p1Draw.actionId,
          drawAttemptState: {
            turnKey: "corp:1",
            remainingAttempts: 1,
          },
          evidenceCode: "p1_parent_requires_targeted_draw",
        },
        {
          kind: "generic",
          defenseId: "urgent-generic-response",
          serverId: "hq",
          phase: "activate_run_defense",
          sourceDefinitionIds: [],
          actionIds: [urgentDefense.actionId],
          urgent: true,
          value: 500,
          evidenceCode: "generic_p2_response",
        },
      ],
    });
    const proposal = module.discover(corpContext)[0]!;
    const instance = instantiatePlanProposal(proposal, 10);
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

    expect(proposal.parentInstanceId).toBe(
      "plan:corp.score_agenda:agenda%3Aterminal%3Aremote_1",
    );
    expect(planAssessment).toMatchObject({
      priorityValidation: { effectiveClass: "P1" },
      evidenceCodes: ["p1_parent_requires_targeted_draw"],
      withinClassValue: 1,
    });
    expect(
      materialized.candidates.map((entry) => entry.candidate.actionId),
    ).toEqual([p1Draw.actionId]);
  });

  it("keeps a P4 score child behind an executable generic P2 defense band without retaining the score parent", () => {
    const scoreDraw = candidate("score-p4-draw", "draw_card", "draw.card");
    const urgentDefense = candidate(
      "urgent-defense",
      "trigger_ability",
      "card_ability.trigger",
    );
    const module = corpModule("corp.defend_servers");
    const corpContext = context([scoreDraw, urgentDefense], {
      defenseNeeds: [
        {
          kind: "score_protection_draw",
          defenseId: "score:p4-draw",
          serverId: "remote_1",
          phase: "draw_for_ice",
          parentProjectId: "agenda:development:remote_1",
          delegatedPriorityClass: "P4",
          actionId: scoreDraw.actionId,
          drawAttemptState: {
            turnKey: "corp:1",
            remainingAttempts: 1,
          },
          evidenceCode: "p4_score_draw",
        },
        {
          kind: "generic",
          defenseId: "urgent-generic-response",
          serverId: "hq",
          phase: "activate_run_defense",
          sourceDefinitionIds: [],
          actionIds: [urgentDefense.actionId],
          urgent: true,
          value: 500,
          evidenceCode: "generic_p2_response",
        },
      ],
    });
    const proposal = module.discover(corpContext)[0]!;
    const instance = instantiatePlanProposal(proposal, 10);
    const planAssessment = requireValidatedPlanAssessment(
      module.assess(instance, corpContext, emptyPortfolio()),
      CORP_PLAN_PRIORITY_POLICY,
      10,
    );

    expect(proposal.parentInstanceId).toBeUndefined();
    expect(planAssessment).toMatchObject({
      priorityValidation: { effectiveClass: "P2" },
      evidenceCodes: ["generic_p2_response"],
    });
    expect(
      module
        .materialize(instance, planAssessment, corpContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual([urgentDefense.actionId]);
  });

  it("selects exactly one technically stable targeted draw route", () => {
    const draw = candidate("basic-draw", "draw_card", "draw.card");
    const nightShift = candidate(
      "night-shift",
      "play_operation",
      "play.corp_operation",
    );
    nightShift.economyProjection = {
      schemaVersion: "action-economy-projection-v1",
      kind: "immediate_liquid",
      timing: "immediate",
      creditRestriction: "general",
      clickCost: 1,
      creditCost: 0,
      grossLiquidCreditGain: 2,
      netLiquidCreditGain: 2,
      cardsDrawn: 1,
      cardsConsumed: 1,
      netHandDelta: 0,
      repeatable: false,
      reliability: "guaranteed",
      source: "legal_action_payload",
      confidence: "high",
      evidence: ["test_night_shift_draw_projection"],
    };
    const module = corpModule("corp.defend_servers");
    const corpContext = context([draw, nightShift], {
      defenseNeeds: [
        {
          kind: "score_protection_draw",
          defenseId: "score-support-draw-for-ice:agenda-1",
          serverId: "remote_1",
          phase: "draw_for_ice",
          parentProjectId: "agenda:agenda-1:remote_1",
          delegatedPriorityClass: "P4",
          actionId: draw.actionId,
          drawAttemptState: {
            turnKey: "corp:1",
            remainingAttempts: 1,
          },
          evidenceCode: "score_plan_requires_targeted_basic_draw",
        },
        {
          kind: "score_protection_draw",
          defenseId: "score-support-night-shift:agenda-1",
          serverId: "remote_1",
          phase: "draw_for_ice",
          parentProjectId: "agenda:agenda-1:remote_1",
          delegatedPriorityClass: "P4",
          actionId: nightShift.actionId,
          drawAttemptState: {
            turnKey: "corp:1",
            remainingAttempts: 1,
          },
          evidenceCode: "score_plan_requires_targeted_night_shift",
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
    ).toEqual(["basic-draw"]);
    expect(
      bindBestCurrentPlanRoute({
        side: "corp",
        stateVersion: 10,
        timingPoint: "corp_action.main",
        planInstanceId: instance.instanceId,
        ...materialized,
      }).head.actionId,
    ).toBe("basic-draw");
  });

  it("leaves shared basic support actions open while closing defense-exclusive actions through the global allocation", () => {
    const draw = candidate("draw-for-ice", "draw_card", "draw.card");
    const credit = candidate(
      "gain-credit",
      "gain_credit",
      "economy.gain_credit",
    );
    const deferredRez = cardAction(
      "rez-hq-support",
      "corp_window.rez",
      "hq-support",
    );
    const deferredAbility = cardAction(
      "activate-hq-support",
      "card_ability.trigger",
      "hq-ability",
    );
    const urgentRez = cardAction("rez-rd-ice", "corp_window.rez", "rd-ice");
    const corpContext = context(
      [draw, credit, deferredRez, deferredAbility, urgentRez],
      {
        defenseNeeds: [
          {
            kind: "generic",
            defenseId: "draw-for-ice:hq",
            serverId: "hq",
            phase: "draw_for_ice",
            sourceDefinitionIds: [],
            actionIds: [draw.actionId],
            urgent: false,
            value: 50,
            evidenceCode: "draw_for_hq_defense",
          },
          {
            kind: "generic",
            defenseId: "rez-support:hq",
            serverId: "hq",
            phase: "rez_response",
            sourceDefinitionIds: ["hq-support"],
            actionIds: [deferredRez.actionId],
            urgent: false,
            rezWindowVerdict: "productive",
            value: 120,
            evidenceCode: "rez_hq_support",
          },
          {
            kind: "generic",
            defenseId: "activate-support:hq",
            serverId: "hq",
            phase: "activate_run_defense",
            sourceDefinitionIds: ["hq-ability"],
            actionIds: [deferredAbility.actionId],
            urgent: false,
            value: 100,
            evidenceCode: "activate_hq_support",
          },
          {
            kind: "generic",
            defenseId: "rez-urgent:rd",
            serverId: "rd",
            phase: "rez_response",
            sourceDefinitionIds: ["rd-ice"],
            actionIds: [urgentRez.actionId],
            urgent: true,
            rezWindowVerdict: "productive",
            value: 300,
            evidenceCode: "urgent_rd_rez",
          },
        ],
      },
    );

    expect(
      corpDefenseActionDispositions(
        corpContext,
        (corpContext.domain as CorpCorePlanDomain).defenseNeeds,
      ),
    ).toEqual([
      {
        actionId: deferredRez.actionId,
        evidenceCode:
          "corp_defense_global_priority_band_rejected:hq:rez-support:hq:selected:rd:rez-urgent:rd:rez-rd-ice",
      },
      {
        actionId: deferredAbility.actionId,
        evidenceCode:
          "corp_defense_global_priority_band_rejected:hq:activate-support:hq:selected:rd:rez-urgent:rd:rez-rd-ice",
      },
    ]);
  });

  it("selects a productive P5 rez route when an unknown central allocation leaves the P2 band without an executable route", () => {
    const installHq = {
      ...cardAction("install-hq", "install.card", "hq-ice"),
      targetContext: targetContext("hq", "server"),
    };
    const installRd = {
      ...cardAction("install-rd", "install.card", "rd-ice"),
      targetContext: targetContext("rd", "server"),
    };
    const rezDataMasons = cardAction(
      "rez-data-masons",
      "corp_window.rez",
      "onr_v1_317_data-masons",
    );
    const corpContext = context(
      [installHq, installRd, rezDataMasons],
      {
        defenseNeeds: [
          {
            kind: "generic",
            defenseId: "install:hq",
            serverId: "hq",
            phase: "install_ice",
            sourceDefinitionIds: ["hq-ice"],
            actionIds: [installHq.actionId],
            urgent: true,
            value: 1,
            evidenceCode: "exact_hq_install",
          },
          {
            kind: "generic",
            defenseId: "install:rd",
            serverId: "rd",
            phase: "install_ice",
            sourceDefinitionIds: ["rd-ice"],
            actionIds: [installRd.actionId],
            urgent: true,
            value: 1,
            evidenceCode: "exact_rd_install",
          },
          {
            kind: "generic",
            defenseId: "rez-exact-card-support:data-masons",
            serverId: "remote_1",
            phase: "rez_response",
            sourceDefinitionIds: ["onr_v1_317_data-masons"],
            actionIds: [rezDataMasons.actionId],
            urgent: false,
            rezWindowVerdict: "productive",
            value: 120,
            evidenceCode:
              "corp_rez_data_masons_supports_visible_installed_walls:data-wall",
          },
        ],
      },
      { credits: 5, clicks: 3 },
    );
    const module = corpModule("corp.defend_servers");
    const proposal = module.discover(corpContext)[0]!;
    const instance = instantiatePlanProposal(proposal, 10);

    expect(proposal.initialViability).toBe("ready");
    expect(
      module.assess(instance, corpContext, emptyPortfolio()).priorityClaim
        .requestedClass,
    ).toBe("P5");
    expect(
      module
        .materialize(instance, {} as never, corpContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["rez-data-masons"]);
    expect(
      corpDefenseActionDispositions(
        corpContext,
        (corpContext.domain as CorpCorePlanDomain).defenseNeeds,
      ),
    ).not.toContainEqual(
      expect.objectContaining({ actionId: "rez-data-masons" }),
    );
  });

  it("dispositions productive Data Masons only when a higher P2 central route is executable", () => {
    const installHq = {
      ...cardAction("install-hq", "install.card", "hq-ice"),
      targetContext: targetContext("hq", "server"),
    };
    const installRd = {
      ...cardAction("install-rd", "install.card", "rd-ice"),
      targetContext: targetContext("rd", "server"),
    };
    const rezDataMasons = cardAction(
      "rez-data-masons",
      "corp_window.rez",
      "onr_v1_317_data-masons",
    );
    const corpContext = context(
      [installHq, installRd, rezDataMasons],
      {
        defenseNeeds: [
          {
            kind: "generic",
            defenseId: "install:hq",
            serverId: "hq",
            phase: "install_ice",
            sourceDefinitionIds: ["hq-ice"],
            actionIds: [installHq.actionId],
            urgent: true,
            value: 1,
            evidenceCode: "exact_hq_install",
          },
          {
            kind: "generic",
            defenseId: "install:rd",
            serverId: "rd",
            phase: "install_ice",
            sourceDefinitionIds: ["rd-ice"],
            actionIds: [installRd.actionId],
            urgent: true,
            value: 1,
            evidenceCode: "exact_rd_install",
          },
          {
            kind: "generic",
            defenseId: "rez-exact-card-support:data-masons",
            serverId: "remote_1",
            phase: "rez_response",
            sourceDefinitionIds: ["onr_v1_317_data-masons"],
            actionIds: [rezDataMasons.actionId],
            urgent: false,
            rezWindowVerdict: "productive",
            value: 120,
            evidenceCode:
              "corp_rez_data_masons_supports_visible_installed_walls:data-wall",
          },
        ],
        centralDefenseAllocation: knownCentralAllocation("hq"),
      },
      { credits: 5, clicks: 3 },
    );
    const module = corpModule("corp.defend_servers");
    const instance = instantiatePlanProposal(
      module.discover(corpContext)[0]!,
      10,
    );

    expect(
      module.assess(instance, corpContext, emptyPortfolio()).priorityClaim
        .requestedClass,
    ).toBe("P2");
    expect(
      module
        .materialize(instance, {} as never, corpContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["install-hq"]);
    expect(
      corpDefenseActionDispositions(
        corpContext,
        (corpContext.domain as CorpCorePlanDomain).defenseNeeds,
        (corpContext.domain as CorpCorePlanDomain).centralDefenseAllocation,
      ),
    ).toContainEqual({
      actionId: "rez-data-masons",
      evidenceCode:
        "corp_defense_global_priority_band_rejected:remote_1:rez-exact-card-support:data-masons:selected:hq:install:hq:install-hq",
    });
  });

  it("binds equal-band assessment evidence to the selected Data Masons rez route instead of a central placement sibling", () => {
    const installHq = {
      ...cardAction("install-hq", "install.card", "hq-ice"),
      targetContext: targetContext("hq", "server"),
    };
    const rezDataMasons = cardAction(
      "rez-data-masons",
      "corp_window.rez",
      "onr_v1_317_data-masons",
    );
    const dataMasonsEvidence =
      "corp_rez_data_masons_supports_visible_installed_walls:data-wall";
    const corpContext = context(
      [installHq, rezDataMasons],
      {
        defenseNeeds: [
          {
            kind: "generic",
            defenseId: "install:hq",
            serverId: "hq",
            phase: "install_ice",
            sourceDefinitionIds: ["hq-ice"],
            actionIds: [installHq.actionId],
            urgent: false,
            value: 20,
            evidenceCode: "exact_hq_install",
          },
          {
            kind: "generic",
            defenseId: "rez-exact-card-support:data-masons",
            serverId: "remote_1",
            phase: "rez_response",
            sourceDefinitionIds: ["onr_v1_317_data-masons"],
            actionIds: [rezDataMasons.actionId],
            urgent: false,
            rezWindowVerdict: "productive",
            value: 120,
            evidenceCode: dataMasonsEvidence,
          },
        ],
        centralDefenseAllocation: knownCentralAllocation("hq"),
      },
      { credits: 5, clicks: 3 },
    );
    const module = corpModule("corp.defend_servers");
    const proposal = module.discover(corpContext)[0]!;
    const instance = instantiatePlanProposal(proposal, 10);
    const assessed = module.assess(
      instance,
      corpContext,
      emptyPortfolio(),
    );

    expect(
      module
        .materialize(instance, {} as never, corpContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["rez-data-masons"]);
    expect(proposal.evidenceRefs).toEqual([
      { code: dataMasonsEvidence, source: "visible_state" },
    ]);
    expect(assessed.evidenceCodes).toEqual([dataMasonsEvidence]);
  });

  it("falls through a stale urgent window signal to an executable Data Masons P5 route", () => {
    const rezDataMasons = cardAction(
      "rez-data-masons",
      "corp_window.rez",
      "onr_v1_317_data-masons",
    );
    const dataMasonsEvidence =
      "corp_rez_data_masons_supports_visible_installed_walls:data-wall";
    const corpContext = context([rezDataMasons], {
      defenseNeeds: [
        {
          kind: "generic",
          defenseId: "rez-stale-urgent",
          serverId: "rd",
          phase: "rez_response",
          sourceDefinitionIds: ["stale-ice"],
          actionIds: ["missing-stale-rez-action"],
          urgent: true,
          rezWindowVerdict: "productive",
          value: 300,
          evidenceCode: "stale_urgent_rez",
        },
        {
          kind: "generic",
          defenseId: "rez-exact-card-support:data-masons",
          serverId: "remote_1",
          phase: "rez_response",
          sourceDefinitionIds: ["onr_v1_317_data-masons"],
          actionIds: [rezDataMasons.actionId],
          urgent: false,
          rezWindowVerdict: "productive",
          value: 120,
          evidenceCode: dataMasonsEvidence,
        },
      ],
    });
    const module = corpModule("corp.defend_servers");
    const proposal = module.discover(corpContext)[0]!;
    const instance = instantiatePlanProposal(proposal, 10);
    const assessed = module.assess(
      instance,
      corpContext,
      emptyPortfolio(),
    );

    expect(proposal.initialViability).toBe("ready");
    expect(assessed.priorityClaim.requestedClass).toBe("P5");
    expect(assessed.evidenceCodes).toEqual([dataMasonsEvidence]);
    expect(
      module
        .materialize(instance, {} as never, corpContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["rez-data-masons"]);
  });

  it("selects one score-protection install lexicographically and suppresses targeted draw", () => {
    const installHq = {
      ...cardAction("install-hq", "install.card", "ice-hq"),
      targetContext: targetContext("hq", "server"),
    };
    const scoreActions = [
      ["a-satisfying", "ice-a"],
      ["b-satisfying", "ice-b"],
      ["c-riskier", "ice-c"],
      ["y-cheaper", "ice-y"],
      ["z-expensive", "ice-z"],
      ["progress-only", "ice-progress"],
    ].map(([actionId, definitionId]) => ({
      ...cardAction(actionId!, "install.card", definitionId!),
      targetContext: targetContext("new_remote", "server"),
    }));
    const draw = candidate("score-draw", "draw_card", "draw.card");
    const module = corpModule("corp.defend_servers");
    const scoreSignal = (
      actionId: string,
      definitionId: string,
      effect: "progress" | "satisfied",
      probability: { numerator: number; denominator: number },
      totalInstallAndRezCredits: number,
      _genericLocalFit: number,
    ) =>
      ({
        kind: "score_protection_install",
        defenseId: `score:${actionId}`,
        serverId: "new_remote",
        phase: "install_ice",
        parentProjectId: "agenda:agenda-1:new_remote",
        delegatedPriorityClass: "P4",
        actionId,
        sourceCardInstanceId: `${definitionId}-instance`,
        sourceDefinitionId: definitionId,
        effect,
        runnerAccessSuccessProbability: probability,
        totalInstallAndRezCredits,
        projection: knownInstallProjection({
          actionId,
          sourceCardInstanceId: `${definitionId}-instance`,
          sourceDefinitionId: definitionId,
          targetServerId: "new_remote",
          effect,
          probability,
          totalCredits: totalInstallAndRezCredits,
        }),
        evidenceCode: `score_route:${actionId}`,
      }) satisfies CorpDefenseSignal;
    const corpContext = context([installHq, ...scoreActions, draw], {
      defenseNeeds: [
        {
          kind: "generic",
          defenseId: "install:hq",
          serverId: "hq",
          phase: "install_ice",
          sourceDefinitionIds: ["ice-hq"],
          urgent: false,
          value: 20,
          evidenceCode: "visible_hq_need",
        },
        scoreSignal(
          "progress-only",
          "ice-progress",
          "progress",
          { numerator: 0, denominator: 1 },
          0,
          100,
        ),
        scoreSignal(
          "c-riskier",
          "ice-c",
          "satisfied",
          { numerator: 1, denominator: 2 },
          0,
          100,
        ),
        scoreSignal(
          "z-expensive",
          "ice-z",
          "satisfied",
          { numerator: 1, denominator: 4 },
          2,
          100,
        ),
        scoreSignal(
          "y-cheaper",
          "ice-y",
          "satisfied",
          { numerator: 1, denominator: 4 },
          1,
          0,
        ),
        scoreSignal(
          "b-satisfying",
          "ice-b",
          "satisfied",
          { numerator: 1, denominator: 4 },
          1,
          10,
        ),
        scoreSignal(
          "a-satisfying",
          "ice-a",
          "satisfied",
          { numerator: 1, denominator: 4 },
          1,
          10,
        ),
        {
          kind: "score_protection_draw",
          defenseId: "score:draw",
          serverId: "new_remote",
          phase: "draw_for_ice",
          parentProjectId: "agenda:agenda-1:new_remote",
          delegatedPriorityClass: "P4",
          actionId: draw.actionId,
          drawAttemptState: {
            turnKey: "corp:1",
            remainingAttempts: 1,
          },
          evidenceCode: "score_route:draw",
        },
      ],
    });
    const sourceDefinitionOmitted = corpContext.input.legalActions.find(
      (action) => action.actionId === "a-satisfying",
    );
    expect(sourceDefinitionOmitted?.payload).toBeDefined();
    delete sourceDefinitionOmitted!.payload!.sourceDefinitionId;
    const instance = instantiatePlanProposal(
      module.discover(corpContext)[0]!,
      10,
    );
    expect(module.discover(corpContext)[0]?.persistencePolicy).toBe(
      "flexible_support",
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

    expect(planAssessment.priorityValidation.effectiveClass).toBe("P4");
    expect(
      bindBestCurrentPlanRoute({
        side: "corp",
        stateVersion: 10,
        timingPoint: "corp_action.main",
        planInstanceId: instance.instanceId,
        ...materialized,
      }).head.actionId,
    ).toBe("a-satisfying");
    expect(materialized.candidates).toHaveLength(1);
    expect(planAssessment.evidenceCodes).toEqual(["score_route:a-satisfying"]);
  });

  it("uses targeted draw only when no direct productive score-protection install is executable", () => {
    const draw = candidate("score-draw", "draw_card", "draw.card");
    const module = corpModule("corp.defend_servers");
    const corpContext = context([draw], {
      defenseNeeds: [
        {
          kind: "score_protection_install",
          defenseId: "score:missing-install",
          serverId: "remote_1",
          phase: "install_ice",
          parentProjectId: "agenda:agenda-1:remote_1",
          delegatedPriorityClass: "P4",
          actionId: "missing-install",
          sourceCardInstanceId: "missing-ice",
          sourceDefinitionId: "missing-ice-definition",
          effect: "satisfied",
          runnerAccessSuccessProbability: { numerator: 0, denominator: 1 },
          totalInstallAndRezCredits: 0,
          projection: knownInstallProjection({
            actionId: "missing-install",
            sourceCardInstanceId: "missing-ice",
            sourceDefinitionId: "missing-ice-definition",
            targetServerId: "remote_1",
            effect: "satisfied",
            probability: { numerator: 0, denominator: 1 },
            totalCredits: 0,
          }),
          evidenceCode: "score_route:missing_install",
        },
        {
          kind: "score_protection_draw",
          defenseId: "score:draw",
          serverId: "remote_1",
          phase: "draw_for_ice",
          parentProjectId: "agenda:agenda-1:remote_1",
          delegatedPriorityClass: "P4",
          actionId: draw.actionId,
          drawAttemptState: {
            turnKey: "corp:1",
            remainingAttempts: 1,
          },
          evidenceCode: "score_route:draw",
        },
      ],
    });
    const instance = instantiatePlanProposal(
      module.discover(corpContext)[0]!,
      10,
    );

    expect(
      module
        .materialize(instance, {} as never, corpContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual([draw.actionId]);
  });

  it("fails closed on incomplete or legacy score-protection signals", () => {
    const install = {
      ...cardAction("install-score-ice", "install.card", "score-ice"),
      targetContext: targetContext("remote_1", "server"),
    };
    const module = corpModule("corp.defend_servers");
    const incomplete = {
      kind: "score_protection_install",
      defenseId: "score:incomplete",
      serverId: "remote_1",
      phase: "install_ice",
      parentProjectId: "agenda:agenda-1:remote_1",
      delegatedPriorityClass: "P4",
      actionId: install.actionId,
      sourceCardInstanceId: install.sourceCardInstanceId,
      sourceDefinitionId: install.sourceDefinitionId,
      effect: "satisfied",
      runnerAccessSuccessProbability: { numerator: 0, denominator: 0 },
      genericLocalFit: 10,
      evidenceCode: "score_route:incomplete",
    } as unknown as CorpDefenseSignal;
    const legacy = {
      kind: "generic",
      defenseId: "score:legacy",
      serverId: "remote_1",
      phase: "install_ice",
      sourceDefinitionIds: [install.sourceDefinitionId],
      actionIds: [install.actionId],
      urgent: false,
      legacyScoreOverride: true,
      value: 120,
      evidenceCode: "score_route:legacy",
    } as unknown as CorpDefenseSignal;

    expect(() =>
      module.discover(
        context([install], {
          defenseNeeds: [
            {
              kind: "generic",
              defenseId: "generic:otherwise-executable",
              serverId: "remote_1",
              phase: "install_ice",
              sourceDefinitionIds: [install.sourceDefinitionId!],
              actionIds: [install.actionId],
              urgent: false,
              value: 10,
              evidenceCode: "generic_route_must_not_mask_invalid_contract",
            },
            incomplete,
            legacy,
          ],
        }),
      ),
    ).toThrowError(/missing_plan_module_coverage/);
  });

  it("fails closed when a score signal probability drifts from its exact projection", () => {
    const install = {
      ...cardAction("install-score-ice", "install.card", "score-ice"),
      targetContext: targetContext("remote_1", "server"),
    };
    const projection = knownInstallProjection({
      actionId: install.actionId,
      sourceCardInstanceId: install.sourceCardInstanceId!,
      sourceDefinitionId: install.sourceDefinitionId!,
      targetServerId: "remote_1",
      effect: "satisfied",
      probability: { numerator: 0, denominator: 1 },
      totalCredits: 0,
    });
    const mismatched = {
      kind: "score_protection_install",
      defenseId: "score:probability-drift",
      serverId: "remote_1",
      phase: "install_ice",
      parentProjectId: "agenda:agenda-1:remote_1",
      delegatedPriorityClass: "P4",
      actionId: install.actionId,
      sourceCardInstanceId: install.sourceCardInstanceId!,
      sourceDefinitionId: install.sourceDefinitionId!,
      effect: "satisfied",
      runnerAccessSuccessProbability: { numerator: 1, denominator: 2 },
      totalInstallAndRezCredits: 0,
      projection,
      evidenceCode: "score_route:probability_drift",
    } satisfies CorpDefenseSignal;

    expect(() =>
      corpModule("corp.defend_servers").discover(
        context([install], { defenseNeeds: [mismatched] }),
      ),
    ).toThrowError(/missing_plan_module_coverage/);
  });

  it("lets an urgent server response constrain the global defense allocation", () => {
    const urgentRez = {
      ...cardAction("rez-run-ice", "corp_window.rez", "run-ice"),
      sourceCardInstanceId: "run-ice-1",
      targetContext: targetContext("run-ice-1", "ice"),
    };
    const installRd = {
      ...cardAction("install-rd", "install.card", "ice-rd"),
      targetContext: targetContext("rd", "server"),
    };
    const module = corpModule("corp.defend_servers");
    const corpContext = context([urgentRez, installRd], {
      defenseNeeds: [
        {
          kind: "generic",
          defenseId: "rez:run-ice-1",
          serverId: "hq",
          phase: "rez_response",
          sourceDefinitionIds: ["run-ice"],
          targetIceInstanceId: "run-ice-1",
          urgent: true,
          value: 10,
          evidenceCode: "active_run_rez_window",
        },
        {
          kind: "generic",
          defenseId: "install:rd",
          serverId: "rd",
          phase: "install_ice",
          sourceDefinitionIds: ["ice-rd"],
          urgent: false,
          value: 1_000,
          evidenceCode: "visible_rd_need",
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
    ).toEqual(["rez-run-ice"]);
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

  it("does not let advancement-counter traps masquerade as Corp economy", () => {
    const experimentalAi = cardAction(
      "install-experimental-ai",
      "install.card",
      "onr_v1_323_experimental-ai",
    );

    expect(corpEconomyActionIsOwned(experimentalAi)).toBe(false);
  });

  it("removes a satisfied economy need and cannot outrank P3 closeout by value", () => {
    const economy = corpModule("corp.economy");
    const credit = candidate("credit", "gain_credit", "economy.gain_credit");
    const open = economy.discover(
      context([credit], {
        economyNeeds: [
          {
            kind: "parent_funding",
            needId: "score-support:score-1",
            gap: 5,
            actionIds: ["credit"],
            parentPlanInstanceId: "plan:corp.score_agenda:score-1",
            delegatedPriorityClass: "P4",
            urgentForScore: true,
            evidenceCode: "score_needs_credits",
          },
        ],
        scoreProjects: [scoreProject("score-1", "P4", "score_needs_credits")],
      }),
    );
    const satisfied = economy.discover(
      context([credit], {
        economyNeeds: [
          {
            kind: "parent_funding",
            needId: "score-funding",
            gap: 0,
            actionIds: ["credit"],
            urgentForScore: true,
            evidenceCode: "score_funded",
          },
        ],
      }),
    );

    expect(open[0]?.parentInstanceId).toBe("plan:corp.score_agenda:score-1");
    expect(satisfied).toEqual([]);
  });

  it.each(["P1", "P2", "P3", "P4"] as const)(
    "inherits %s and the exact parent for a score-project funding delegation",
    (delegatedPriorityClass) => {
      const economy = corpModule("corp.economy");
      const credit = candidate("credit", "gain_credit", "economy.gain_credit");
      const parentPlanInstanceId = `plan:corp.score_agenda:score-${delegatedPriorityClass}`;
      const corpContext = context([credit], {
        economyNeeds: [
          {
            kind: "parent_funding",
            needId: `score-support:score-${delegatedPriorityClass}`,
            gap: 1,
            actionIds: ["credit"],
            parentPlanInstanceId,
            delegatedPriorityClass,
            urgentForScore: true,
            evidenceCode: `score_needs_credits_${delegatedPriorityClass}`,
          },
        ],
        scoreProjects: [
          scoreProject(
            `score-${delegatedPriorityClass}`,
            delegatedPriorityClass,
            `score_needs_credits_${delegatedPriorityClass}`,
          ),
        ],
      });
      const proposal = economy.discover(corpContext)[0]!;
      const instance = instantiatePlanProposal(proposal, 10);

      expect(proposal.parentInstanceId).toBe(parentPlanInstanceId);
      const planAssessment = requireValidatedPlanAssessment(
        economy.assess(instance, corpContext, emptyPortfolio()),
        CORP_PLAN_PRIORITY_POLICY,
        10,
      );
      expect(planAssessment).toMatchObject({
        priorityClaim: {
          requestedClass: delegatedPriorityClass,
        },
        withinClassValue: 320,
        evidenceCodes: [`score_needs_credits_${delegatedPriorityClass}`],
      });
      expect(planAssessment.priorityValidation.effectiveClass).toBe(
        delegatedPriorityClass,
      );
      expect(
        economy
          .materialize(instance, planAssessment, corpContext)
          .candidates.map((entry) => entry.candidate.actionId),
      ).toEqual([credit.actionId]);
    },
  );

  it("keeps an exactly bound score-funding child blocked when no current funding route covers its gap", () => {
    const economy = corpModule("corp.economy");
    const parentPlanInstanceId = "plan:corp.score_agenda:score-P1";
    const corpContext = context([], {
      economyNeeds: [
        {
          kind: "parent_funding",
          needId: "score-support:score-P1",
          gap: 3,
          actionIds: [],
          parentPlanInstanceId,
          delegatedPriorityClass: "P1",
          urgentForScore: true,
          evidenceCode: "score_needs_credits_P1",
          fundingRouteAssessment: {
            routeId: "funding:score-P1:uncovered",
            status: "uncovered",
            reliability: "contingent",
            evidence: ["funding_route_uncovered:true"],
          },
        },
      ],
      scoreProjects: [
        scoreProject("score-P1", "P1", "score_needs_credits_P1"),
      ],
    });

    const proposal = economy.discover(corpContext)[0]!;
    const instance = instantiatePlanProposal(proposal, 10);
    const planAssessment = requireValidatedPlanAssessment(
      economy.assess(instance, corpContext, emptyPortfolio()),
      CORP_PLAN_PRIORITY_POLICY,
      10,
    );

    expect(proposal).toMatchObject({
      parentInstanceId: parentPlanInstanceId,
      initialViability: "blocked",
    });
    expect(planAssessment.priorityValidation.effectiveClass).toBe("P1");
    expect(
      economy.materialize(instance, planAssessment, corpContext).candidates,
    ).toEqual([]);
  });

  it("fails closed when a score-funding child omits either its parent or inherited priority", () => {
    const economy = corpModule("corp.economy");
    const credit = candidate("credit", "gain_credit", "economy.gain_credit");
    const missingPriority = {
      kind: "parent_funding" as const,
      needId: "score-funding-missing-priority",
      gap: 1,
      actionIds: [credit.actionId],
      parentPlanInstanceId: "plan:corp.score_agenda:score-1",
      urgentForScore: true,
      evidenceCode: "incomplete_score_funding",
    };
    const {
      parentPlanInstanceId: _missingParentPlanInstanceId,
      ...scoreFunding
    } = missingPriority;
    const missingParent = {
      ...scoreFunding,
      needId: "score-funding-missing-parent",
      delegatedPriorityClass: "P1" as const,
    };

    for (const invalidSignal of [missingPriority, missingParent]) {
      expect(() =>
        economy.discover(
          context([credit], {
            economyNeeds: [invalidSignal],
          }),
        ),
      ).toThrowError(/missing_plan_module_coverage/);
    }
  });

  it("does not invent an autonomous Corp economy plan after its finite reserve is satisfied", () => {
    const economy = corpModule("corp.economy");
    const credit = candidate("credit", "gain_credit", "economy.gain_credit");
    const corpContext = context([credit], {
      economyNeeds: [
        {
          kind: "reserve",
          needId: "satisfied-reserve",
          targetCredits: 5,
          gap: 0,
          actionIds: ["credit"],
          urgentForScore: false,
          evidenceCode: "corp_visible_minimum_reserve_satisfied",
        },
      ],
    });

    expect(economy.discover(corpContext)).toEqual([]);
  });

  it("does not use a non-liquid campaign install to satisfy a reserve gap", () => {
    const economy = corpModule("corp.economy");
    const credit = candidate("credit", "gain_credit", "economy.gain_credit");
    const campaign = {
      ...cardAction(
        "install-campaign",
        "install.card",
        "onr_v1_309_bbs-whispering-campaign",
      ),
      sourceCardInstanceId: "bbs-card",
      targetContext: targetContext("remote_1", "server"),
    };
    const corpContext = context([credit, campaign], {
      economyNeeds: [
        {
          kind: "reserve",
          needId: "minimum-reserve",
          targetCredits: 5,
          gap: 2,
          actionIds: ["credit"],
          urgentForScore: false,
          evidenceCode: "visible_reserve_gap",
        },
      ],
    });
    const instance = instantiatePlanProposal(
      economy.discover(corpContext)[0]!,
      10,
    );
    const materialized = economy.materialize(
      instance,
      {} as never,
      corpContext,
    );

    expect(
      bindBestCurrentPlanRoute({
        side: "corp",
        stateVersion: 10,
        timingPoint: "corp_action.main",
        planInstanceId: instance.instanceId,
        ...materialized,
      }).head.actionId,
    ).toBe("credit");
  });

  it("requires a complete immediate-liquid projection for a Corp funding action", () => {
    const economy = corpModule("corp.economy");
    const complete = candidate(
      "complete-credit",
      "gain_credit",
      "economy.gain_credit",
    );
    const incomplete = candidate(
      "missing-projection",
      "gain_credit",
      "economy.gain_credit",
    );
    delete incomplete.economyProjection;
    const corpContext = context([incomplete, complete], {
      economyNeeds: [
        {
          kind: "reserve",
          needId: "projection-contract",
          targetCredits: 5,
          gap: 2,
          actionIds: [incomplete.actionId, complete.actionId],
          urgentForScore: false,
          evidenceCode: "projection_contract",
        },
      ],
    });
    const instance = instantiatePlanProposal(
      economy.discover(corpContext)[0]!,
      10,
    );

    expect(
      economy
        .materialize(instance, {} as never, corpContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["complete-credit"]);
  });

  it("materializes only the best guaranteed funding route head", () => {
    const economy = corpModule("corp.economy");
    const slow = candidate("slow-credit", "gain_credit", "economy.gain_credit");
    const fast = candidate("fast-credit", "play_card", "economy.gain_credit");
    fast.economyProjection = {
      ...fast.economyProjection!,
      grossLiquidCreditGain: 3,
      netLiquidCreditGain: 3,
      repeatable: false,
      source: "legal_action_payload",
    };
    const corpContext = context([slow, fast], {
      economyNeeds: [
        {
          kind: "parent_funding",
          needId: "exact-head",
          gap: 3,
          actionIds: [slow.actionId, fast.actionId],
          urgentForScore: false,
          evidenceCode: "exact_head",
        },
      ],
    });
    const instance = instantiatePlanProposal(
      economy.discover(corpContext)[0]!,
      10,
    );

    expect(
      economy
        .materialize(instance, {} as never, corpContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["fast-credit"]);
  });

  it("advances a finite reserve by its best guaranteed one-action tranche when the final target is not reachable this turn", () => {
    const economy = corpModule("corp.economy");
    const basicCredit = candidate(
      "basic-credit",
      "gain_credit",
      "economy.gain_credit",
    );
    const bbsPayout = candidate(
      "bbs-payout",
      "activate_ability",
      "economy.gain_credit",
    );
    bbsPayout.economyProjection = {
      ...bbsPayout.economyProjection!,
      grossLiquidCreditGain: 2,
      netLiquidCreditGain: 2,
      repeatable: false,
      source: "legal_action_payload",
    };
    const reserve = {
      kind: "reserve" as const,
      needId: "multi-turn-minimum-reserve",
      targetCredits: 5,
      gap: 5,
      actionIds: [basicCredit.actionId, bbsPayout.actionId],
      urgentForScore: false,
      evidenceCode: "visible_reserve_gap",
    };
    const corpContext = context(
      [basicCredit, bbsPayout],
      { economyNeeds: [reserve] },
      { credits: 0, clicks: 2 },
    );
    const fundingRouteAssessment = assessCorpEconomyFundingRoute(
      corpContext,
      reserve,
    );
    const instance = instantiatePlanProposal(
      economy.discover(corpContext)[0]!,
      10,
    );

    expect(fundingRouteAssessment).toMatchObject({
      status: "covered_guaranteed",
      reliability: "guaranteed",
      headActionId: "bbs-payout",
    });
    expect(fundingRouteAssessment.evidence).toEqual(
      expect.arrayContaining([
        "corp_reserve_incremental_route:true",
        "corp_reserve_final_target:5",
        "corp_reserve_incremental_target:2",
      ]),
    );
    expect(
      economy
        .materialize(instance, {} as never, corpContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["bbs-payout"]);
  });

  it("does not weaken an exact parent-funding requirement into incremental reserve progress", () => {
    const economy = corpModule("corp.economy");
    const basicCredit = candidate(
      "basic-credit",
      "gain_credit",
      "economy.gain_credit",
    );
    const bbsPayout = candidate(
      "bbs-payout",
      "activate_ability",
      "economy.gain_credit",
    );
    bbsPayout.economyProjection = {
      ...bbsPayout.economyProjection!,
      grossLiquidCreditGain: 2,
      netLiquidCreditGain: 2,
      repeatable: false,
      source: "legal_action_payload",
    };
    const parentFunding = {
      kind: "parent_funding" as const,
      needId: "unreachable-parent-funding",
      gap: 5,
      actionIds: [basicCredit.actionId, bbsPayout.actionId],
      urgentForScore: true,
      evidenceCode: "parent_requires_full_route",
    };
    const corpContext = context(
      [basicCredit, bbsPayout],
      { economyNeeds: [parentFunding] },
      { credits: 0, clicks: 2 },
    );
    const fundingRouteAssessment = assessCorpEconomyFundingRoute(
      corpContext,
      parentFunding,
    );
    const proposal = economy.discover(corpContext)[0]!;
    const instance = instantiatePlanProposal(proposal, 10);

    expect(fundingRouteAssessment).toMatchObject({
      status: "uncovered",
      reliability: "contingent",
    });
    expect(fundingRouteAssessment.headActionId).toBeUndefined();
    expect(proposal.initialViability).toBe("blocked");
    expect(
      economy.materialize(instance, {} as never, corpContext).candidates,
    ).toEqual([]);
  });

  it("advances an exactly bound score-funding child by one guaranteed tranche", () => {
    const economy = corpModule("corp.economy");
    const basicCredit = candidate(
      "basic-credit",
      "gain_credit",
      "economy.gain_credit",
    );
    const project = scoreProject(
      "agenda:agenda-1:remote_1",
      "P1",
      "score_needs_exact_funding",
    );
    const scoreFunding = {
      kind: "parent_funding" as const,
      needId: `score-support:${project.projectId}`,
      gap: 5,
      actionIds: [basicCredit.actionId],
      parentPlanInstanceId:
        "plan:corp.score_agenda:agenda%3Aagenda-1%3Aremote_1",
      delegatedPriorityClass: "P1" as const,
      urgentForScore: true,
      evidenceCode: project.evidenceCode,
    };
    const corpContext = context(
      [basicCredit],
      {
        scoreProjects: [project],
        economyNeeds: [scoreFunding],
      },
      { credits: 1, clicks: 2 },
    );
    const fundingRouteAssessment = assessCorpEconomyFundingRoute(
      corpContext,
      scoreFunding,
    );
    const proposal = economy.discover(corpContext)[0]!;
    const instance = instantiatePlanProposal(proposal, 10);

    expect(fundingRouteAssessment).toMatchObject({
      status: "covered_guaranteed",
      reliability: "guaranteed",
      headActionId: "basic-credit",
    });
    expect(fundingRouteAssessment.evidence).toEqual(
      expect.arrayContaining([
        "corp_incremental_score_funding_incremental_route:true",
        "corp_incremental_score_funding_final_target:6",
        "corp_incremental_score_funding_incremental_target:2",
      ]),
    );
    expect(proposal).toMatchObject({
      parentInstanceId: scoreFunding.parentPlanInstanceId,
      initialViability: "ready",
    });
    const planAssessment = requireValidatedPlanAssessment(
      economy.assess(instance, corpContext, emptyPortfolio()),
      CORP_PLAN_PRIORITY_POLICY,
      10,
    );
    expect(planAssessment).toMatchObject({
      priorityClaim: {
        requestedClass: "P1",
      },
      evidenceCodes: [project.evidenceCode],
    });
    expect(planAssessment.priorityValidation.effectiveClass).toBe("P1");
    expect(
      economy
        .materialize(instance, planAssessment, corpContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["basic-credit"]);
  });

  it("advances an exactly bound funding-only defense child by one guaranteed tranche", () => {
    const economy = corpModule("corp.economy");
    const basicCredit = candidate(
      "basic-credit",
      "gain_credit",
      "economy.gain_credit",
    );
    const defenseParent = {
      kind: "generic" as const,
      defenseId: "install:hq",
      serverId: "hq",
      phase: "install_ice" as const,
      sourceDefinitionIds: ["pocket-vr"],
      actionIds: ["install-pocket-vr"],
      urgent: true,
      value: 80,
      evidenceCode: "corp_defense_exact_route_funding_required:hq:pocket-vr",
      installRoute: {
        disposition: "funding_only" as const,
        projection: knownInstallProjection({
          actionId: "install-pocket-vr",
          sourceCardInstanceId: "pocket-vr",
          sourceDefinitionId: "pocket-vr",
          targetServerId: "hq",
          effect: "progress",
          probability: { numerator: 0, denominator: 1 },
          totalCredits: 4,
          availableCredits: 5,
          preservesReserves: false,
        }),
      },
    } satisfies CorpDefenseSignal;
    const defenseFunding = {
      kind: "parent_funding" as const,
      needId: "defense-support:hq:pocket-vr",
      gap: 4,
      actionIds: [basicCredit.actionId],
      immediateDefenseConversion: true,
      parentPlanInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
      parentNeedId: defenseParent.defenseId,
      parentPriorityClass: "P2" as const,
      incrementalDefenseReserve: {
        targetCredits: 9,
        serverId: "hq",
        iceInstanceId: "pocket-vr",
      },
      urgentForScore: true,
      evidenceCode: defenseParent.evidenceCode,
    };
    const corpContext = context(
      [basicCredit],
      {
        defenseNeeds: [defenseParent],
        economyNeeds: [defenseFunding],
      },
      { credits: 5, clicks: 1 },
    );
    const fundingRouteAssessment = assessCorpEconomyFundingRoute(
      corpContext,
      defenseFunding,
    );
    const proposal = economy.discover(corpContext)[0]!;
    const instance = instantiatePlanProposal(proposal, 10);

    expect(fundingRouteAssessment).toMatchObject({
      status: "covered_guaranteed",
      reliability: "guaranteed",
      headActionId: "basic-credit",
    });
    expect(proposal.parentInstanceId).toBe(
      defenseFunding.parentPlanInstanceId,
    );
    const planAssessment = requireValidatedPlanAssessment(
      economy.assess(instance, corpContext, emptyPortfolio()),
      CORP_PLAN_PRIORITY_POLICY,
      10,
    );
    expect(planAssessment.priorityValidation.effectiveClass).toBe("P2");
    expect(fundingRouteAssessment.evidence).toEqual(
      expect.arrayContaining([
        "corp_incremental_defense_reserve_incremental_route:true",
        "corp_incremental_defense_reserve_final_target:9",
        "corp_incremental_defense_reserve_incremental_target:6",
      ]),
    );
    expect(
      economy
        .materialize(instance, {} as never, corpContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["basic-credit"]);
  });

  it.each([
    ["missing", {}],
    [
      "wrong",
      {
        parentPlanInstanceId:
          "plan:corp.defend_servers:wrong-defense-portfolio",
      },
    ],
  ] as const)(
    "fails closed on a %s exact parent for a defense-funding child",
    (_label, parentBinding) => {
      const economy = corpModule("corp.economy");
      const basicCredit = candidate(
        "basic-credit",
        "gain_credit",
        "economy.gain_credit",
      );
      const defenseParent = {
        kind: "generic" as const,
        defenseId: "install:hq",
        serverId: "hq",
        phase: "install_ice" as const,
        sourceDefinitionIds: ["pocket-vr"],
        actionIds: ["install-pocket-vr"],
        urgent: true,
        value: 80,
        evidenceCode: "corp_defense_exact_route_funding_required:hq:pocket-vr",
        installRoute: {
          disposition: "funding_only" as const,
          projection: knownInstallProjection({
            actionId: "install-pocket-vr",
            sourceCardInstanceId: "pocket-vr",
            sourceDefinitionId: "pocket-vr",
            targetServerId: "hq",
            effect: "progress",
            probability: { numerator: 0, denominator: 1 },
            totalCredits: 4,
            preservesReserves: false,
          }),
        },
      } satisfies CorpDefenseSignal;

      expect(() =>
        economy.discover(
          context([basicCredit], {
            defenseNeeds: [defenseParent],
            economyNeeds: [
              {
                kind: "parent_funding",
                needId: "defense-support:hq:pocket-vr",
                gap: 4,
                actionIds: [basicCredit.actionId],
                immediateDefenseConversion: true,
                parentNeedId: defenseParent.defenseId,
                parentPriorityClass: "P2",
                incrementalDefenseReserve: {
                  targetCredits: 9,
                  serverId: "hq",
                  iceInstanceId: "pocket-vr",
                },
                urgentForScore: false,
                evidenceCode: defenseParent.evidenceCode,
                ...parentBinding,
              },
            ],
          }),
        ),
      ).toThrowError(/missing_plan_module_coverage/);
    },
  );

  it("rejects malformed or already-reached incremental defense reserve contracts", () => {
    const basicCredit = candidate(
      "basic-credit",
      "gain_credit",
      "economy.gain_credit",
    );
    const malformed = {
      kind: "parent_funding" as const,
      needId: "malformed-defense-reserve",
      gap: Number.POSITIVE_INFINITY,
      actionIds: [basicCredit.actionId],
      immediateDefenseConversion: true,
      parentPlanInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
      parentNeedId: "install:hq",
      incrementalDefenseReserve: {
        targetCredits: Number.POSITIVE_INFINITY,
        serverId: "hq",
        iceInstanceId: "pocket-vr",
      },
      urgentForScore: true,
      evidenceCode: "malformed_defense_reserve",
    };
    const reached = {
      ...malformed,
      needId: "reached-defense-reserve",
      gap: 0,
      incrementalDefenseReserve: {
        ...malformed.incrementalDefenseReserve,
        targetCredits: 5,
      },
    };

    for (const signal of [malformed, reached]) {
      const assessment = assessCorpEconomyFundingRoute(
        context(
          [basicCredit],
          { economyNeeds: [signal] },
          { credits: 5, clicks: 1 },
        ),
        signal,
      );
      expect(assessment.headActionId).toBeUndefined();
      expect(assessment.evidence).not.toContain(
        "corp_incremental_defense_reserve_incremental_route:true",
      );
    }
  });

  it("never advances a reserve above its finite target even when a stale gap is present", () => {
    const basicCredit = candidate(
      "basic-credit",
      "gain_credit",
      "economy.gain_credit",
    );
    const staleReserve = {
      kind: "reserve" as const,
      needId: "already-satisfied-reserve",
      targetCredits: 5,
      gap: 5,
      actionIds: [basicCredit.actionId],
      urgentForScore: false,
      evidenceCode: "stale_reserve_gap",
    };
    const fundingRouteAssessment = assessCorpEconomyFundingRoute(
      context(
        [basicCredit],
        { economyNeeds: [staleReserve] },
        { credits: 6, clicks: 3 },
      ),
      staleReserve,
    );

    expect(fundingRouteAssessment).toMatchObject({
      status: "funded",
      reliability: "guaranteed",
    });
    expect(fundingRouteAssessment.headActionId).toBeUndefined();
    expect(fundingRouteAssessment.evidence).not.toContain(
      "corp_reserve_incremental_route:true",
    );
  });

  it("binds different parent gaps to their own exact funding route", () => {
    const economy = corpModule("corp.economy");
    const small = candidate("small-credit", "play_card", "economy.gain_credit");
    small.economyProjection = {
      ...small.economyProjection!,
      repeatable: false,
      source: "legal_action_payload",
    };
    const large = candidate("large-credit", "play_card", "economy.gain_credit");
    large.economyProjection = {
      ...large.economyProjection!,
      clickCost: 2,
      grossLiquidCreditGain: 3,
      netLiquidCreditGain: 3,
      repeatable: false,
      source: "legal_action_payload",
    };
    const corpContext = context([small, large], {
      economyNeeds: [
        {
          kind: "parent_funding",
          needId: "small-gap",
          gap: 1,
          actionIds: [small.actionId, large.actionId],
          urgentForScore: false,
          evidenceCode: "small_gap",
        },
        {
          kind: "parent_funding",
          needId: "large-gap",
          gap: 3,
          actionIds: [small.actionId, large.actionId],
          urgentForScore: false,
          evidenceCode: "large_gap",
        },
      ],
    });
    const proposals = economy.discover(corpContext);
    const heads = Object.fromEntries(
      proposals.map((proposal) => {
        const instance = instantiatePlanProposal(proposal, 10);
        return [
          proposal.dedupeKey,
          economy.materialize(instance, {} as never, corpContext).candidates[0]
            ?.candidate.actionId,
        ];
      }),
    );

    expect(heads).toEqual({
      "small-gap": "small-credit",
      "large-gap": "large-credit",
    });
  });

  it("develops one admitted card campaign without treating its action as the need", () => {
    const economy = corpModule("corp.economy");
    const campaign = {
      ...cardAction(
        "install-campaign",
        "install.card",
        "onr_v1_309_bbs-whispering-campaign",
      ),
      sourceCardInstanceId: "bbs-card",
      targetContext: targetContext("remote_1", "server"),
    };
    const corpContext = context([campaign], {
      economyNeeds: [
        {
          kind: "develop_campaign",
          needId: "economy-campaign:bbs-card",
          sourceInstanceId: "bbs-card",
          sourceDefinitionId: "onr_v1_309_bbs-whispering-campaign",
          phase: "install",
          actionIds: ["install-campaign"],
          cadence: {
            kind: "finite_pool",
            maximumSetupExecutions: 1,
          },
          payback: {
            projectedCredits: 16,
            setupCreditCost: 0,
            projectedNetCredits: 16,
            horizonTurns: 3,
          },
          completion: {
            kind: "source_phase_reached",
            expectedState: "installed_unrezzed",
          },
          urgentForScore: false,
          evidenceCode:
            "corp_visible_economy_campaign:onr_v1_309_bbs-whispering-campaign:install",
        },
      ],
    });
    const proposal = economy.discover(corpContext)[0]!;
    const instance = instantiatePlanProposal(proposal, 10);

    expect(proposal.target).toEqual({ kind: "card", id: "bbs-card" });
    expect(
      bindBestCurrentPlanRoute({
        side: "corp",
        stateVersion: 10,
        timingPoint: "corp_action.main",
        planInstanceId: instance.instanceId,
        ...economy.materialize(instance, {} as never, corpContext),
      }).head.actionId,
    ).toBe("install-campaign");
  });

  it("keeps an admitted campaign resident but blocked without a current action", () => {
    const economy = corpModule("corp.economy");
    const corpContext = context([], {
      economyNeeds: [
        {
          kind: "develop_campaign",
          needId: "economy-campaign:bbs-card",
          sourceInstanceId: "bbs-card",
          sourceDefinitionId: "onr_v1_309_bbs-whispering-campaign",
          phase: "install",
          actionIds: [],
          cadence: {
            kind: "finite_pool",
            maximumSetupExecutions: 1,
          },
          payback: {
            projectedCredits: 16,
            setupCreditCost: 0,
            projectedNetCredits: 16,
            horizonTurns: 3,
          },
          completion: {
            kind: "source_phase_reached",
            expectedState: "installed_unrezzed",
          },
          urgentForScore: false,
          evidenceCode:
            "corp_visible_economy_campaign:onr_v1_309_bbs-whispering-campaign:install",
        },
      ],
    });

    expect(economy.discover(corpContext)).toEqual([
      expect.objectContaining({
        dedupeKey: "economy-campaign:bbs-card",
        initialViability: "blocked",
      }),
    ]);
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
  visibleResources: { credits?: number; clicks?: number } = {},
): PlanSchedulerContext {
  const postInstallRezCreditsByActionId = new Map(
    (overrides.defenseNeeds ?? []).flatMap((signal) => {
      const projection =
        signal.kind === "score_protection_install"
          ? signal.projection
          : signal.kind === "generic" && signal.phase === "install_ice"
            ? signal.installRoute?.projection
            : undefined;
      if (!projection) return [];
      const selected = projection.selectedRezCosts.find(
        (cost) => cost.iceInstanceId === projection.sourceCardInstanceId,
      );
      return selected ? [[projection.actionId, selected.credits] as const] : [];
    }),
  );
  const defenseNeeds = (overrides.defenseNeeds ?? []).flatMap((signal) => {
    if (
      signal.kind !== "generic" ||
      signal.phase !== "install_ice" ||
      signal.installRoute
    ) {
      return [signal];
    }
    const routeCandidates = candidates.filter(
      (candidate) =>
        candidate.semanticActionType === "install.card" &&
        candidateTargetIdsForTest(candidate).includes(signal.serverId) &&
        (signal.actionIds === undefined ||
          signal.actionIds.includes(candidate.actionId)) &&
        (signal.sourceDefinitionIds.length === 0 ||
          signal.sourceDefinitionIds.includes(
            candidate.sourceDefinitionId ?? "",
          )),
    );
    const exactSignals = routeCandidates.flatMap((routeCandidate) => {
      if (
        !routeCandidate.sourceCardInstanceId ||
        !routeCandidate.sourceDefinitionId
      ) {
        return [];
      }
      return [
        {
          ...signal,
          defenseId:
            routeCandidates.length === 1
              ? signal.defenseId
              : `${signal.defenseId}:${routeCandidate.actionId}`,
          sourceDefinitionIds: [routeCandidate.sourceDefinitionId],
          actionIds: [routeCandidate.actionId],
          installRoute: {
            disposition: "productive" as const,
            projection: knownInstallProjection({
              actionId: routeCandidate.actionId,
              sourceCardInstanceId: routeCandidate.sourceCardInstanceId,
              sourceDefinitionId: routeCandidate.sourceDefinitionId,
              targetServerId: signal.serverId,
              effect: "progress",
              probability: { numerator: 0, denominator: 1 },
              totalCredits: 0,
              installCredits: routeCandidate.costProfile.creditCost ?? 0,
              availableCredits: visibleResources.credits ?? 0,
              availableClicks: visibleResources.clicks ?? 3,
            }),
          },
        },
      ];
    });
    if (exactSignals.length === 0) {
      return [signal];
    }
    if (exactSignals.length === 1) {
      Object.assign(signal, exactSignals[0]);
      return [signal];
    }
    return exactSignals;
  });
  const domain: CorpCorePlanDomain = {
    scoreProjects: overrides.scoreProjects ?? [],
    remoteProjects: overrides.remoteProjects ?? [],
    defenseNeeds,
    ...(overrides.centralDefenseAllocation
      ? { centralDefenseAllocation: overrides.centralDefenseAllocation }
      : {}),
    economyNeeds: overrides.economyNeeds ?? [],
  };
  return {
    input: {
      side: "corp",
      legalActions: candidates.map((value) => {
        const serverId = value.targetContext?.selectedTargets.find(
          (target) => target.targetKind === "server",
        )?.targetId;
        return {
          actionId: value.actionId,
          side: "corp",
          type: value.actionType,
          label: value.actionId,
          timingPoint: "corp_action.main",
          expiresAtStateVersion: 10,
          targetRequirements: [],
          choiceRequirements: [],
          costs: [
            {
              clicks: value.costProfile.clickCost,
              credits: value.costProfile.creditCost,
            },
          ],
          ...(value.sourceCardInstanceId
            ? { source: value.sourceCardInstanceId }
            : {}),
          ...(value.semanticActionType === "install.card" && serverId
            ? {
                payload: {
                  placement: "ice",
                  serverId,
                  cardId: value.sourceCardInstanceId,
                  sourceDefinitionId: value.sourceDefinitionId,
                  iceInstallBaseCost: 0,
                  iceInstallAdditionalCost: 0,
                  iceInstallReduction: 0,
                  iceInstallTotalCost: value.costProfile.creditCost,
                  postInstallRezQuoteCardId: value.sourceCardInstanceId,
                  postInstallRezQuoteTargetServerId: serverId,
                  postInstallRezQuoteProjectedServerId:
                    serverId === "new_remote" ? "remote_1" : serverId,
                  postInstallRezQuoteExpiresAtStateVersion: 10,
                  postInstallRezQuoteComplete: true,
                  postInstallRezQuoteBaseCredits:
                    postInstallRezCreditsByActionId.get(value.actionId) ?? 0,
                  postInstallRezQuoteFinalCredits:
                    postInstallRezCreditsByActionId.get(value.actionId) ?? 0,
                  postInstallRezQuoteMandatoryAgendaPointCost: 0,
                },
              }
            : {}),
        };
      }),
      playerView: {
        stateVersion: 10,
        timingPoint: "corp_action.main",
        servers: [
          ...new Set(
            candidates.flatMap(
              (candidate) =>
                candidate.targetContext?.selectedTargets.flatMap((target) =>
                  target.targetKind === "server" ? [target.targetId] : [],
                ) ?? [],
            ),
          ),
        ].map((serverId) => ({
          id: serverId,
          label: serverId,
          ice: [],
          root: [],
        })),
        own: {
          credits: visibleResources.credits ?? 0,
          clicks: visibleResources.clicks ?? 3,
          gripOrHq: candidates.flatMap((candidate) =>
            candidate.sourceCardInstanceId && candidate.sourceDefinitionId
              ? [
                  {
                    instanceId: candidate.sourceCardInstanceId,
                    definitionId: candidate.sourceDefinitionId,
                    type: "ice",
                    known: true,
                    rezCost: 0,
                    rulesText: "*End the run.",
                  },
                ]
              : [],
          ),
        },
        opponent: { credits: 0, rig: [] },
      },
    } as unknown as AiDecisionInput,
    actionCandidates: candidates,
    turnKey: "corp:1",
    domain,
  };
}

function candidateTargetIdsForTest(
  candidate: ActionSemanticCandidate,
): string[] {
  return (
    candidate.targetContext?.selectedTargets.map((target) => target.targetId) ??
    []
  );
}

function knownInstallProjection<
  Effect extends "no_progress" | "progress" | "satisfied",
>(params: {
  actionId: string;
  sourceCardInstanceId: string;
  sourceDefinitionId: string;
  targetServerId: string;
  effect: Effect;
  probability: { numerator: number; denominator: number };
  totalCredits: number;
  installCredits?: number;
  availableCredits?: number;
  availableClicks?: number;
  preservesReserves?: boolean;
}): KnownCorpFundedIceInstallRouteProjection & { effect: Effect } {
  const protection = {
    knowledge: "known" as const,
    maximumRunnerAccessSuccessProbability: {
      numerator: 1,
      denominator: 2,
    },
    runnerAccessSuccessProbability: params.probability,
    protectsScore: params.effect === "satisfied",
    requiredRandomBreakSuccesses: 0,
    randomBreaks: [],
    runnerCreditsRemainingOnBestAccessPath: 0,
    evidence: [],
  };
  const selectedRezCosts = [
    {
      iceInstanceId: params.sourceCardInstanceId,
      iceDefinitionId: params.sourceDefinitionId,
      credits: params.totalCredits,
      source: "engine_rez_cost_quote" as const,
    },
  ];
  const fundedAssessment = {
    knowledge: "known" as const,
    availableCorpCredits: params.availableCredits ?? 0,
    availableCorpClicks: params.availableClicks ?? 3,
    totalScoreReserveCredits: 0,
    hardClickReserve: 0,
    fundedProtection: params.preservesReserves !== false,
    scoreReserveFingerprint: "credits:;hardClicks:0",
    protection,
    selectedRezCosts,
    totalSelectedRezCost: params.totalCredits,
    creditsAfterDefense: 0,
    clicksAfterDefense: 2,
    preservesScoreCreditReserve: params.preservesReserves !== false,
    preservesHardClickReserve: true,
    evidence: [],
  };
  return {
    knowledge: "known",
    actionId: params.actionId,
    sourceCardInstanceId: params.sourceCardInstanceId,
    sourceDefinitionId: params.sourceDefinitionId,
    targetServerId: params.targetServerId,
    before: fundedAssessment,
    after: fundedAssessment,
    effect: params.effect,
    evidence: [],
    installCredits: params.installCredits ?? 0,
    installClicks: 1,
    installCostSource: "legal_action_agreed_projection",
    selectedRezCosts,
    creditsAfterDefense: 0,
    clicksAfterDefense: 2,
    preservesScoreCreditReserve: params.preservesReserves !== false,
    preservesHardClickReserve: true,
    preservesReserves: params.preservesReserves !== false,
    funded: params.preservesReserves !== false,
  } as KnownCorpFundedIceInstallRouteProjection & { effect: Effect };
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

function scoreProject(
  projectId: string,
  priorityClass: "P1" | "P2" | "P3" | "P4",
  evidenceCode: string,
): CorpCorePlanDomain["scoreProjects"][number] {
  return {
    projectId,
    agendaDefinitionId: "agenda-def",
    agendaPoints: 2,
    agendaInstanceId: `agenda-${projectId}`,
    phase: "advance_agenda",
    terminalScore: priorityClass === "P1",
    preventsTerminalSteal: priorityClass === "P2",
    sameTurnCloseout: priorityClass === "P3",
    feasible: true,
    evidenceCode,
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
    sourceCardInstanceId: `${sourceDefinitionId}-instance`,
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
    costProfile: {
      clickCost: 1,
      creditCost: 0,
      costKnownStatus: "known",
      additionalCosts: [],
    },
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
    ...(semanticActionType === "economy.gain_credit"
      ? {
          economyProjection: {
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
            evidence: ["test_projection:complete"],
          },
        }
      : {}),
    hardGates: [],
    evidence: [],
  };
}
