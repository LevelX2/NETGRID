import { readFileSync } from "node:fs";
import type { AiDecisionInput, VisibleCorpRezCostQuote } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type {
  ActionSemanticCandidate,
  LegalTarget,
} from "../action-semantic-candidate-types";
import {
  CORP_PLAN_PRIORITY_POLICY,
  compareValidatedPlanAssessments,
  requireValidatedPlanAssessment,
} from "./plan-assessment";
import {
  CORP_CORE_ACTION_OWNERSHIP,
  corpAgendaPurgeDefenseChoiceSignal,
  corpClassicDeflectorDefenseChoiceSignal,
  corpCoreActionOwner,
  corpDefenseActionDispositions,
  corpDefensePortfolioHasExecutableRoute,
  corpDefensePlacementDispositions,
  corpEconomyActionIsOwned,
  assessCorpSpendAgainstScoreFundingMilestones,
  corpScoreFundingMilestone,
  corpGenericDefensePriorityClass,
  corpScorePriorityClass,
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
): Extract<
  NonNullable<CorpCorePlanDomain["centralDefenseAllocation"]>,
  { status: "known" }
> {
  const evidence = {
    threat: "material" as const,
    installedIceCount: 0,
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
    expect(CORP_CORE_ACTION_OWNERSHIP).not.toHaveProperty(
      "install.remote_project",
    );
  });

  it("keeps the resident remote parent actionless and P6-support-only", () => {
    const module = corpModule("corp.establish_scoring_remote");
    const signal = remoteProjectSignal();
    const corpContext = context([], { remoteProjects: [signal] });
    const proposal = module.discover(corpContext)[0]!;
    const instance = instantiatePlanProposal(proposal, 10);
    const materialized = module.materialize(instance, {} as never, corpContext);

    expect(proposal.dedupeKey).toBe("strategic-score-remote");
    expect(proposal.cadence).toEqual({
      turnKey: "corp:8",
      maxExecutionsPerTurn: 1,
      executionsUsed: 0,
    });
    expect(materialized.step.capability.semanticActionTypes).toEqual([]);
    expect(materialized.candidates).toEqual([]);
  });

  it("binds a remote ICE support action to the exact resident parent need", () => {
    const install = {
      ...cardAction("install-remote-ice", "install.card", "ice-def-1"),
      sourceCardInstanceId: "ice-1",
      targetContext: targetContext("remote_1", "server"),
    };
    const remote = remoteProjectSignal();
    const defense: CorpDefenseSignal = {
      kind: "generic",
      defenseId: "remote-defense:ice-1",
      serverId: "remote_1",
      phase: "install_defense_support",
      sourceDefinitionIds: ["ice-def-1"],
      actionIds: [install.actionId],
      parentKind: "remote",
      parentProjectId: remote.projectId,
      parentNeedId: remote.need!.needId,
      sourceCardInstanceId: "ice-1",
      urgent: false,
      value: 12,
      evidenceCode: "remote_protection_below_target",
    };
    const corpContext = context([install], {
      remoteProjects: [remote],
      defenseNeeds: [defense],
    });
    const proposal = corpModule("corp.defend_servers").discover(
      corpContext,
    )[0]!;

    expect(proposal.parentInstanceId).toBe(
      "plan:corp.establish_scoring_remote:strategic-score-remote",
    );
    expect(proposal.parentNeedId).toBe(remote.need!.needId);
  });

  it("assigns Security Purge ICE targets through corp.defend_servers", () => {
    const revealedCardIds = ["keeper-1", "razor-wire-1"];
    const serverIds = ["hq", "rd", "remote_1", "new_remote"];
    const options = revealedCardIds.flatMap((cardId) =>
      serverIds.flatMap((serverId) =>
        cardId === "keeper-1"
          ? [
              {
                id: `agenda_purge_${cardId}_${serverId}_alternate_subtype:base`,
                label: `${cardId} -> ${serverId} as wall`,
                value: `${cardId}|${serverId}|alternate_subtype:base`,
                selectable: true,
                metadata: { creditCost: 0 },
              },
              {
                id: `agenda_purge_${cardId}_${serverId}_alternate_subtype:alternate`,
                label: `${cardId} -> ${serverId} as code gate`,
                value: `${cardId}|${serverId}|alternate_subtype:alternate`,
                selectable: true,
                metadata: { creditCost: 1 },
              },
            ]
          : [
              {
                id: `agenda_purge_${cardId}_${serverId}_fixed`,
                label: `${cardId} -> ${serverId}`,
                value: `${cardId}|${serverId}|fixed`,
                selectable: true,
                metadata: { creditCost: 0 },
              },
            ],
      ),
    );
    const choiceId = "security-purge-targets";
    const actionId = "resolve-security-purge";
    const choiceCandidate = candidate(
      actionId,
      "resolve_choice",
      "choice.resolve",
    );
    const input = {
      side: "corp",
      legalActions: [
        {
          actionId,
          side: "corp",
          type: "resolve_choice",
          source: "game_rule",
          timingPoint: "corp_action.main",
          expiresAtStateVersion: 10,
          choiceRequirements: [
            {
              choiceId,
              minSelections: 2,
              maxSelections: 2,
              optionIds: options.map((option) => option.id),
            },
          ],
          targetRequirements: [],
          costs: [],
        },
      ],
      playerView: {
        stateVersion: 10,
        timingPoint: "corp_action.main",
        pendingChoice: {
          choiceId,
          side: "corp",
          kind: "select_option",
          visibility: "hidden_info_barrier",
          source:
            "card_implementation.agenda_purge_install_targets:security-purge-1:keeper-1,razor-wire-1:10",
          stateVersion: 10,
          minSelections: 2,
          maxSelections: 2,
          options,
        },
        servers: [
          { id: "hq", label: "HQ", ice: [], root: [] },
          { id: "rd", label: "R&D", ice: [], root: [] },
          { id: "archives", label: "Archives", ice: [], root: [] },
          { id: "remote_1", label: "Remote 1", ice: [], root: [] },
        ],
        own: {
          credits: 4,
          scoreArea: [
            {
              instanceId: "security-purge-1",
              definitionId: "corp_onr_v1_216_security-purge",
              type: "agenda",
              known: true,
            },
          ],
        },
      },
    } as unknown as AiDecisionInput;

    expect(
      corpAgendaPurgeDefenseChoiceSignal(
        input,
        [choiceCandidate],
        knownCentralAllocation("hq"),
      ),
    ).toMatchObject({
      kind: "generic",
      phase: "resolve_install_targets",
      actionIds: [actionId],
      evidenceCode: "agenda_purge_ice_allocation_owned_by_corp_defend_servers",
      choiceResolution: {
        choiceId,
        targets: [
          {
            cardId: "keeper-1",
            serverId: "hq",
            optionId: "agenda_purge_keeper-1_hq_alternate_subtype:base",
          },
          {
            cardId: "razor-wire-1",
            serverId: "rd",
            optionId: "agenda_purge_razor-wire-1_rd_fixed",
          },
        ],
      },
    });
  });

  it("assigns a paid Classic Deflector redirect through corp.defend_servers", () => {
    const choiceId = "classic_deflector_11";
    const actionId = "corp.resolve_choice";
    const sourceIceId = "deflector-ice";
    const sourceDefinitionId = "generic-deflector";
    const subroutineId = "generic-deflector.subroutine.1.deflect_run";
    const options = [
      { id: "decline", label: "Nicht zahlen", value: "decline" },
      { id: "server_hq", label: "HQ", value: "hq" },
      { id: "server_rd", label: "R&D", value: "rd" },
      { id: "server_archives", label: "Archives", value: "archives" },
      { id: "server_remote_1", label: "Remote 1", value: "remote_1" },
    ];
    const input = {
      side: "corp",
      legalActions: [
        {
          actionId,
          side: "corp",
          type: "resolve_choice",
          source: "game_rule",
          timingPoint: "run.encounter_ice",
          expiresAtStateVersion: 11,
          choiceRequirements: [
            {
              choiceId,
              minSelections: 1,
              maxSelections: 1,
              optionIds: options.map((option) => option.id),
            },
          ],
          targetRequirements: [],
          costs: [],
        },
      ],
      playerView: {
        stateVersion: 11,
        timingPoint: "run.encounter_ice",
        pendingChoice: {
          choiceId,
          side: "corp",
          kind: "select_option",
          visibility: "public",
          source: `card_implementation.classic_deflector:run_8:${sourceIceId}:0:${sourceDefinitionId}:${subroutineId}:any_data_fort:2:0`,
          stateVersion: 11,
          minSelections: 1,
          maxSelections: 1,
          options,
        },
        own: {
          credits: 3,
          gripOrHq: [],
          heapOrArchives: [],
        },
        run: {
          attackedServerId: "rd",
          phase: "encounter_ice",
          position: { kind: "ice", serverId: "rd", iceIndex: 0 },
          encounteredIce: {
            instanceId: sourceIceId,
            definitionId: sourceDefinitionId,
            type: "ice",
            known: true,
            rezzed: true,
          },
        },
        servers: [
          { id: "hq", label: "HQ", ice: [], root: [] },
          {
            id: "rd",
            label: "R&D",
            ice: [
              {
                instanceId: sourceIceId,
                definitionId: sourceDefinitionId,
                type: "ice",
                known: true,
                rezzed: true,
                effectiveRunQuote: {
                  iceInstanceId: sourceIceId,
                  iceDefinitionId: sourceDefinitionId,
                  effectiveStrength: 4,
                  subroutines: [
                    {
                      id: subroutineId,
                      type: "deflect_run",
                      deflectorTarget: "any_data_fort",
                      deflectorCost: 2,
                    },
                  ],
                },
              },
            ],
            root: [],
          },
          { id: "archives", label: "Archives", ice: [], root: [] },
          {
            id: "remote_1",
            label: "Remote 1",
            ice: [],
            root: [{ instanceId: "asset", type: "asset", known: true }],
          },
        ],
      },
    } as unknown as AiDecisionInput;

    expect(
      corpClassicDeflectorDefenseChoiceSignal(
        input,
        [candidate(actionId, "resolve_choice", "choice.resolve")],
        knownCentralAllocation("rd"),
        0,
      ),
    ).toMatchObject({
      kind: "generic",
      phase: "resolve_run_redirect",
      actionIds: [actionId],
      serverId: "archives",
      evidenceCode: "classic_deflector_redirect_owned_by_corp_defend_servers",
      choiceResolution: {
        kind: "classic_deflector_redirect",
        choiceId,
        sourceIceInstanceId: sourceIceId,
        sourceDefinitionId,
        subroutineId,
        selectedOptionId: "server_archives",
        selectedServerId: "archives",
        disposition: "redirect",
      },
    });

    expect(
      corpClassicDeflectorDefenseChoiceSignal(
        input,
        [candidate(actionId, "resolve_choice", "choice.resolve")],
        knownCentralAllocation("rd"),
        2,
      ),
    ).toMatchObject({
      phase: "resolve_run_redirect",
      serverId: "rd",
      choiceResolution: {
        kind: "classic_deflector_redirect",
        selectedOptionId: "decline",
        disposition: "decline",
      },
    });

    const mandatoryOptions = options.filter(
      (option) => option.id !== "decline",
    );
    input.playerView.pendingChoice!.source = `card_implementation.classic_deflector:run_8:${sourceIceId}:0:${sourceDefinitionId}:${subroutineId}:any_data_fort:0:0`;
    input.playerView.pendingChoice!.options = mandatoryOptions;
    input.legalActions[0]!.choiceRequirements![0]!.optionIds =
      mandatoryOptions.map((option) => option.id);
    input.playerView.servers[1]!.ice[0]!.effectiveRunQuote!.subroutines[0]!.deflectorCost = 0;
    expect(
      corpClassicDeflectorDefenseChoiceSignal(
        input,
        [candidate(actionId, "resolve_choice", "choice.resolve")],
        knownCentralAllocation("rd"),
        3,
      ),
    ).toMatchObject({
      phase: "resolve_run_redirect",
      serverId: "archives",
      choiceResolution: {
        selectedOptionId: "server_archives",
        disposition: "redirect",
      },
    });
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

  it.each([
    {
      caseName: "terminal score with a same-turn closeout",
      terminalScore: true,
      sameTurnCloseout: true,
      deadlinePressure: false,
      expectedPriorityClass: "P1",
      expectedHorizon: "current_turn",
      expectedWitnessGuarantee: "visible_state_forced",
    },
    {
      caseName: "terminal score without a closeout",
      terminalScore: true,
      sameTurnCloseout: false,
      deadlinePressure: false,
      expectedPriorityClass: "P4",
      expectedHorizon: "multi_turn",
      expectedWitnessGuarantee: undefined,
    },
    {
      caseName: "deadline score route without a closeout",
      terminalScore: false,
      sameTurnCloseout: false,
      deadlinePressure: true,
      expectedPriorityClass: "P3",
      expectedHorizon: "current_turn",
      expectedWitnessGuarantee: undefined,
    },
    {
      caseName: "ordinary score route",
      terminalScore: false,
      sameTurnCloseout: false,
      deadlinePressure: false,
      expectedPriorityClass: "P4",
      expectedHorizon: "multi_turn",
      expectedWitnessGuarantee: undefined,
    },
  ] as const)(
    "classifies $caseName from existing scoreline signals",
    ({
      caseName,
      expectedHorizon,
      expectedPriorityClass,
      expectedWitnessGuarantee,
      ...scorelineSignals
    }) => {
      const advance = targetAction(
        `advance-${caseName}`,
        "score.advance_card",
        `agenda-${caseName}`,
        "card",
      );
      const module = corpModule("corp.score_agenda");
      const project = {
        ...scoreProject(
          `score-${caseName}`,
          "P4",
          `score_priority_case:${caseName}`,
        ),
        agendaInstanceId: `agenda-${caseName}`,
        ...scorelineSignals,
      };
      const corpContext = context([advance], { scoreProjects: [project] });
      const instance = instantiatePlanProposal(
        module.discover(corpContext)[0]!,
        10,
      );
      const planAssessment = requireValidatedPlanAssessment(
        module.assess(instance, corpContext, emptyPortfolio()),
        CORP_PLAN_PRIORITY_POLICY,
        10,
      );

      expect(corpScorePriorityClass(project)).toBe(expectedPriorityClass);
      expect(planAssessment.priorityValidation.effectiveClass).toBe(
        expectedPriorityClass,
      );
      expect(planAssessment.priorityClaim.horizon).toBe(expectedHorizon);
      expect(planAssessment.priorityClaim.witness?.guarantee).toBe(
        expectedWitnessGuarantee,
      );
    },
  );

  it("keeps a same-turn closeout ahead of a higher-value terminal route without a closeout", () => {
    const module = corpModule("corp.score_agenda");
    const closeoutAction = targetAction(
      "advance-same-turn-closeout",
      "score.advance_card",
      "agenda-same-turn-closeout",
      "card",
    );
    const uncertainTerminalAction = targetAction(
      "advance-uncertain-terminal",
      "score.advance_card",
      "agenda-uncertain-terminal",
      "card",
    );
    const corpContext = context([closeoutAction, uncertainTerminalAction], {
      scoreProjects: [
        {
          ...scoreProject("same-turn-closeout", "P3", "same_turn_closeout"),
          agendaInstanceId: "agenda-same-turn-closeout",
        },
        {
          ...scoreProject(
            "uncertain-terminal",
            "P4",
            "uncertain_terminal_route",
          ),
          agendaInstanceId: "agenda-uncertain-terminal",
          terminalScore: true,
        },
      ],
    });
    const assessments = module
      .discover(corpContext)
      .map((proposal) =>
        requireValidatedPlanAssessment(
          module.assess(
            instantiatePlanProposal(proposal, 10),
            corpContext,
            emptyPortfolio(),
          ),
          CORP_PLAN_PRIORITY_POLICY,
          10,
        ),
      )
      .sort(compareValidatedPlanAssessments);

    expect(assessments.map((assessment) => assessment.instanceId)).toEqual([
      "plan:corp.score_agenda:same-turn-closeout",
      "plan:corp.score_agenda:uncertain-terminal",
    ]);
    expect(
      assessments.map(
        (assessment) => assessment.priorityValidation.effectiveClass,
      ),
    ).toEqual(["P3", "P4"]);
  });

  it("keeps the agenda-less score root supportable only through its exact current tactical material signal", () => {
    const module = corpModule("corp.score_agenda");
    const corpContext = context([], {
      scoreProjects: [
        {
          projectId: "general",
          agendaPoints: 0,
          phase: "select_agenda",
          sameTurnCloseout: false,
          terminalScore: false,
          feasible: false,
          evidenceCode: "corp_score_campaign_missing_agenda_material",
        },
      ],
    });
    corpContext.transientSignals = [
      {
        schemaVersion: "transient-plan-signal-v1",
        signalId: "corp-score-material:general",
        side: "corp",
        observedAtStateVersion: 10,
        planModuleId: "corp.score_agenda",
        planDedupeKey: "general",
        kind: "goal",
        scope: "tactical",
        evidenceCode: "corp_score_campaign_missing_agenda_material",
        guarantee: "robust_but_reactive",
        target: { kind: "capability", id: "score-material:general" },
      },
    ];
    const proposal = module.discover(corpContext)[0]!;
    const instance = instantiatePlanProposal(proposal, 10);
    const rawAssessment = module.assess(
      instance,
      corpContext,
      emptyPortfolio(),
    );
    const validated = requireValidatedPlanAssessment(
      {
        ...rawAssessment,
        transientSignals: [...corpContext.transientSignals!],
      },
      CORP_PLAN_PRIORITY_POLICY,
      10,
    );

    expect(proposal).toMatchObject({
      dedupeKey: "general",
      initialViability: "ready",
      phase: "select_agenda",
      persistencePolicy: "sticky_goal",
      target: { kind: "capability", id: "score-material:general" },
    });
    expect(proposal.moduleState).not.toHaveProperty(
      "signal.agendaDefinitionId",
    );
    expect(validated).toMatchObject({
      intentFit: "tactical_override",
      readiness: "executable_with_support",
      priorityValidation: { effectiveClass: "P4" },
      resourceGaps: [
        {
          needId: "score-material:general",
          capability: "draw_score_agenda_material",
          minimum: 1,
          available: 0,
          deadline: "multi_turn",
        },
      ],
    });
  });

  it("publishes score setup only as the exact concrete parent's source-scoped need", () => {
    const module = corpModule("corp.score_agenda");
    const setupNeed = {
      needId: "score-setup:agenda:agenda-1:remote_1:chicago",
      actionId: "install-chicago",
      sourceCardInstanceId: "chicago",
      sourceDefinitionId: "onr_v1_312_chicago-branch",
    };
    const corpContext = context([], {
      scoreProjects: [
        {
          projectId: "agenda:agenda-1:remote_1",
          agendaDefinitionId: "onr_v1_201_executive-extraction",
          agendaPoints: 2,
          agendaInstanceId: "agenda-1",
          serverId: "remote_1",
          phase: "install_agenda",
          sameTurnCloseout: false,
          setupNeed,
          terminalScore: false,
          feasible: false,
          evidenceCode: "corp_last_click_score_install_deferred:remote_1",
        },
      ],
    });
    const proposal = module.discover(corpContext)[0]!;
    const instance = instantiatePlanProposal(proposal, 10);
    const assessment = module.assess(instance, corpContext, emptyPortfolio());

    expect(proposal.initialViability).toBe("ready");
    expect(assessment).toMatchObject({
      readiness: "executable_with_support",
      resourceGaps: [
        {
          needId: setupNeed.needId,
          capability: "install_score_acceleration_support",
          minimum: 1,
          available: 0,
          deadline: "multi_turn",
        },
      ],
    });

    const malformedContext = context([], {
      scoreProjects: [
        {
          ...(corpContext.domain as CorpCorePlanDomain).scoreProjects[0]!,
          setupNeed: {
            ...setupNeed,
            needId: "score-setup:foreign-parent:chicago",
          },
        },
      ],
    });
    expect(() => module.discover(malformedContext)).toThrow(
      expect.objectContaining({ code: "invalid_support_graph" }),
    );
  });

  it("does not claim generic score intent fit from a mismatched material signal", () => {
    const module = corpModule("corp.score_agenda");
    const corpContext = context([], {
      scoreProjects: [
        {
          projectId: "general",
          agendaPoints: 0,
          phase: "select_agenda",
          sameTurnCloseout: false,
          terminalScore: false,
          feasible: false,
          evidenceCode: "corp_score_campaign_missing_agenda_material",
        },
      ],
    });
    corpContext.transientSignals = [
      {
        schemaVersion: "transient-plan-signal-v1",
        signalId: "corp-score-material:foreign",
        side: "corp",
        observedAtStateVersion: 10,
        planModuleId: "corp.score_agenda",
        planDedupeKey: "general",
        kind: "goal",
        scope: "tactical",
        evidenceCode: "corp_score_campaign_missing_agenda_material",
        guarantee: "robust_but_reactive",
        target: { kind: "capability", id: "score-material:general" },
      },
    ];
    const instance = instantiatePlanProposal(
      module.discover(corpContext)[0]!,
      10,
    );
    const assessment = module.assess(instance, corpContext, emptyPortfolio());

    expect(assessment.intentFit).toBe("none");
    expect(() =>
      requireValidatedPlanAssessment(assessment, CORP_PLAN_PRIORITY_POLICY, 10),
    ).toThrowError("priority_claim_rejected");
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

  it("keeps a funding-only ICE install inside the defense plan when no better immediate route exists", () => {
    const install = {
      ...cardAction("install-staged-rd", "install.card", "staged-ice"),
      targetContext: targetContext("rd", "server"),
    };
    const defense = fundingOnlyDefenseSignal(install, "no_progress");
    const module = corpModule("corp.defend_servers");
    const corpContext = context(
      [install],
      { defenseNeeds: [defense] },
      { credits: 0, clicks: 3 },
    );
    const instance = instantiatePlanProposal(
      module.discover(corpContext)[0]!,
      10,
    );
    const planAssessment = requireValidatedPlanAssessment(
      module.assess(instance, corpContext, emptyPortfolio()),
      CORP_PLAN_PRIORITY_POLICY,
      10,
    );

    expect(planAssessment.readiness).toBe("executable_now");
    expect(
      module
        .materialize(instance, planAssessment, corpContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["install-staged-rd"]);
  });

  it("keeps exact funding ahead of a funding-only ICE install", () => {
    const install = {
      ...cardAction("install-after-funding", "install.card", "funded-ice"),
      targetContext: targetContext("rd", "server"),
    };
    const gainCredit = candidate(
      "gain-before-install",
      "gain_credit",
      "economy.gain_credit",
    );
    const defense = fundingOnlyDefenseSignal(install, "progress");
    const module = corpModule("corp.defend_servers");
    const corpContext = context(
      [install, gainCredit],
      {
        defenseNeeds: [defense],
        economyNeeds: [
          {
            kind: "parent_funding",
            needId: `defense-reserve:rd:${install.sourceCardInstanceId}`,
            gap: 2,
            actionIds: [gainCredit.actionId],
            immediateDefenseConversion: true,
            parentPlanInstanceId:
              "plan:corp.defend_servers:server-defense-portfolio",
            parentNeedId: defense.defenseId,
            incrementalDefenseReserve: {
              targetCredits: 2,
              serverId: "rd",
              iceInstanceId: install.sourceCardInstanceId!,
            },
            urgentForScore: false,
            evidenceCode: defense.evidenceCode,
          },
        ],
      },
      { credits: 0, clicks: 3 },
    );
    const instance = instantiatePlanProposal(
      module.discover(corpContext)[0]!,
      10,
    );
    const planAssessment = requireValidatedPlanAssessment(
      module.assess(instance, corpContext, emptyPortfolio()),
      CORP_PLAN_PRIORITY_POLICY,
      10,
    );

    expect(planAssessment).toMatchObject({
      readiness: "executable_with_support",
      resourceGaps: [
        {
          needId: defense.defenseId,
          capability: "credits",
          minimum: 2,
        },
      ],
    });
    expect(
      module
        .materialize(instance, planAssessment, corpContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual([]);
    expect(
      corpDefenseActionDispositions(corpContext, [defense]),
    ).toContainEqual({
      actionId: install.actionId,
      evidenceCode: `corp_defense_exact_route_requires_parent_funding:rd:${defense.defenseId}`,
    });
  });

  it("uses an executable productive defense install instead of a funding-only staging route", () => {
    const stagedInstall = {
      ...cardAction("install-staged", "install.card", "staged-ice"),
      targetContext: targetContext("rd", "server"),
    };
    const productiveInstall = {
      ...cardAction("install-productive", "install.card", "productive-ice"),
      targetContext: targetContext("rd", "server"),
    };
    const module = corpModule("corp.defend_servers");
    const corpContext = context(
      [stagedInstall, productiveInstall],
      {
        defenseNeeds: [
          fundingOnlyDefenseSignal(stagedInstall, "progress"),
          productiveDefenseSignal(productiveInstall),
        ],
      },
      { credits: 0, clicks: 3 },
    );
    const instance = instantiatePlanProposal(
      module.discover(corpContext)[0]!,
      10,
    );
    const planAssessment = requireValidatedPlanAssessment(
      module.assess(instance, corpContext, emptyPortfolio()),
      CORP_PLAN_PRIORITY_POLICY,
      10,
    );

    expect(
      module
        .materialize(instance, {} as never, corpContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["install-productive"]);
    expect(planAssessment).toMatchObject({
      readiness: "executable_now",
      resourceGaps: [],
    });
  });

  it("rejects a no-progress staging bluff on an already protected unpressured central", () => {
    const install = {
      ...cardAction("install-weak-bluff", "install.card", "bluff-ice"),
      targetContext: targetContext("rd", "server"),
    };
    const defense = fundingOnlyDefenseSignal(install, "no_progress");
    const module = corpModule("corp.defend_servers");
    const corpContext = context(
      [install],
      { defenseNeeds: [defense] },
      { credits: 0, clicks: 3 },
    );
    corpContext.input.playerView.servers.find(
      (server) => server.id === "rd",
    )!.ice = [
      {
        instanceId: "existing-rd-ice",
        definitionId: "existing-rd-ice-definition",
        type: "ice",
        known: true,
        rezzed: false,
      },
    ];
    const instance = instantiatePlanProposal(
      module.discover(corpContext)[0]!,
      10,
    );

    expect(
      module.materialize(instance, {} as never, corpContext).candidates,
    ).toEqual([]);
  });

  it("separates acute central pressure from terminal central defense", () => {
    const base = {
      kind: "generic" as const,
      defenseId: "install:rd",
      serverId: "rd",
      phase: "install_ice" as const,
      sourceDefinitionIds: ["ice"],
      urgent: false,
      value: 1,
      evidenceCode: "central_pressure",
    };

    expect(
      corpGenericDefensePriorityClass([{ ...base, centralPressure: "acute" }]),
    ).toBe("P3");
    expect(
      corpGenericDefensePriorityClass([
        { ...base, centralPressure: "material" },
      ]),
    ).toBe("P3");
    expect(
      corpGenericDefensePriorityClass([
        { ...base, urgent: true, centralPressure: "terminal" },
      ]),
    ).toBe("P2");
    expect(
      corpGenericDefensePriorityClass([
        {
          ...base,
          phase: "draw_for_ice",
          urgent: true,
          centralPressure: "terminal",
        },
      ]),
    ).toBe("P2");
    expect(
      corpGenericDefensePriorityClass([
        {
          ...base,
          phase: "draw_for_ice",
          urgent: true,
          centralPressure: "acute",
        },
      ]),
    ).toBe("P6");
    expect(corpGenericDefensePriorityClass([base])).toBe("P6");
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

  it.each([
    ["rd", "hq"],
    ["hq", "rd"],
  ] as const)(
    "falls back from allocated %s when only %s still has an exact productive central route",
    (allocatedServerId, productiveServerId) => {
      const install = {
        ...cardAction(
          `install-${productiveServerId}`,
          "install.card",
          "ice-shared",
        ),
        sourceCardInstanceId: "ice-shared-1",
        targetContext: targetContext(productiveServerId, "server"),
      };
      const module = corpModule("corp.defend_servers");
      const corpContext = context([install], {
        centralDefenseAllocation: knownCentralAllocation(allocatedServerId),
        defenseNeeds: [
          {
            kind: "generic",
            defenseId: `install:${productiveServerId}`,
            serverId: productiveServerId,
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

      expect(
        module
          .materialize(instance, {} as never, corpContext)
          .candidates.map((entry) => entry.candidate.actionId),
      ).toEqual([`install-${productiveServerId}`]);
    },
  );

  it("does not fall back from terminal allocated R&D to a threat-free HQ route", () => {
    const installHq = {
      ...cardAction("install-hq", "install.card", "ice-shared"),
      sourceCardInstanceId: "ice-shared-1",
      targetContext: targetContext("hq", "server"),
    };
    const allocation = knownCentralAllocation("rd");
    const corpContext = context([installHq], {
      centralDefenseAllocation: {
        ...allocation,
        evidence: {
          hq: { ...allocation.evidence.hq, threat: "none" },
          rd: { ...allocation.evidence.rd, threat: "terminal" },
        },
      },
      defenseNeeds: [
        {
          kind: "generic",
          defenseId: "install:hq",
          serverId: "hq",
          phase: "install_ice",
          sourceDefinitionIds: ["ice-shared"],
          urgent: false,
          value: 100,
          evidenceCode:
            "engine_certified_global_defense_access_probability_reduced",
        },
      ],
    });
    const module = corpModule("corp.defend_servers");
    const instance = instantiatePlanProposal(
      module.discover(corpContext)[0]!,
      10,
    );

    expect(
      module.materialize(instance, {} as never, corpContext).candidates,
    ).toEqual([]);
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

  it("keeps a non-central route eligible after central allocation", () => {
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
    ).toEqual(["install-archives"]);
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
        costKind: "fixed",
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
    ["fixed exact", "fixed", 1, true, undefined],
    [
      "paid ETR first frontier",
      "paid_end_the_run_subroutines",
      3,
      true,
      undefined,
    ],
    [
      "paid ETR selected-cost drift",
      "paid_end_the_run_subroutines",
      1,
      false,
      undefined,
    ],
    [
      "paid ETR malformed arithmetic",
      "paid_end_the_run_subroutines",
      3,
      false,
      "malformed_arithmetic",
    ],
    ["alternate subtype exact", "alternate_subtype", 5, true, undefined],
    [
      "alternate subtype selected-cost drift",
      "alternate_subtype",
      1,
      false,
      undefined,
    ],
    [
      "alternate subtype cross-family payload",
      "alternate_subtype",
      5,
      false,
      "cross_family_field",
    ],
    ["X fail-closed", "x_strength", 1, false, undefined],
  ] as const)(
    "binds the source selected rez cost to the current post-install quote: %s",
    (_label, costModel, selectedCredits, expectedExecutable, corruption) => {
      const install = {
        ...cardAction("install-rd", "install.card", "new-rd-ice"),
        targetContext: targetContext("rd", "server"),
      };
      const projection = knownInstallProjection({
        actionId: install.actionId,
        sourceCardInstanceId: install.sourceCardInstanceId!,
        sourceDefinitionId: install.sourceDefinitionId!,
        targetServerId: "rd",
        effect: "progress",
        probability: { numerator: 0, denominator: 1 },
        totalCredits: selectedCredits,
      });
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
      const quoteFields = postInstallRezQuoteFieldsForTest(costModel);
      if (corruption === "malformed_arithmetic") {
        quoteFields.postInstallRezQuoteVariableFirstEndTheRunFinalCredits = 4;
      } else if (corruption === "cross_family_field") {
        quoteFields.postInstallRezQuoteVariableMinSubroutines = 0;
      }
      Object.assign(corpContext.input.legalActions[0]!.payload!, quoteFields);

      expect(
        corpDefensePortfolioHasExecutableRoute(corpContext, [signal]),
      ).toBe(expectedExecutable);
    },
  );

  it.each([
    ["fixed exact", "fixed", 1, true, undefined],
    [
      "paid ETR first frontier",
      "paid_end_the_run_subroutines",
      3,
      true,
      undefined,
    ],
    [
      "paid ETR selected-cost drift",
      "paid_end_the_run_subroutines",
      1,
      false,
      undefined,
    ],
    [
      "paid ETR malformed arithmetic",
      "paid_end_the_run_subroutines",
      3,
      false,
      "malformed_arithmetic",
    ],
    ["alternate subtype exact", "alternate_subtype", 5, true, undefined],
    [
      "alternate subtype selected-cost drift",
      "alternate_subtype",
      1,
      false,
      undefined,
    ],
    ["X fail-closed", "x_strength", 1, false, undefined],
  ] as const)(
    "binds an existing selected rez cost to the current installed quote: %s",
    (_label, costModel, selectedCredits, expectedExecutable, corruption) => {
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
        credits: selectedCredits,
        source: "engine_rez_cost_quote" as const,
      };
      const selectedRezCosts = [
        ...sourceProjection.selectedRezCosts,
        existingSelection,
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
      const effectiveRezCostQuote = installedRezQuoteForTest(
        costModel,
        existingSelection.iceInstanceId,
      );
      if (
        corruption === "malformed_arithmetic" &&
        effectiveRezCostQuote.complete &&
        effectiveRezCostQuote.costKind === "variable" &&
        effectiveRezCostQuote.variableParameter.kind ===
          "paid_end_the_run_subroutines"
      ) {
        effectiveRezCostQuote.variableParameter.firstEndTheRunFinalCredits = 4;
      }
      corpContext.input.playerView.servers
        .find((server) => server.id === "rd")!
        .ice.push({
          instanceId: existingSelection.iceInstanceId,
          definitionId: existingSelection.iceDefinitionId,
          known: true,
          type: "ice",
          rezzed: false,
          effectiveRezCostQuote,
        });

      expect(
        corpDefensePortfolioHasExecutableRoute(corpContext, [signal]),
      ).toBe(expectedExecutable);
    },
  );

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
                      costKind: "fixed" as const,
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
      costKind: "fixed",
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
        evidenceCode:
          "corp_defense_global_allocation_rejected:hq:install-support:hq:reason:higher_priority_band:selected:remote_1:rez:current-ice-1:rez-current",
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

  it("keeps an exact score-protection draw at its own P5 until the scheduler validates its P4 parent", () => {
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
          parentNeedId: "score-protection:agenda-1:remote_1",
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
    const proposal = module.discover(corpContext)[0]!;
    const instance = instantiatePlanProposal(proposal, 10);
    const planAssessment = requireValidatedPlanAssessment(
      module.assess(instance, corpContext, emptyPortfolio()),
      CORP_PLAN_PRIORITY_POLICY,
      10,
    );

    expect(planAssessment.priorityValidation.effectiveClass).toBe("P5");
    const materialized = module.materialize(
      instance,
      planAssessment,
      corpContext,
    );
    expect(proposal.parentInstanceId).toBe(
      "plan:corp.score_agenda:agenda%3Aagenda-1%3Aremote_1",
    );
    expect(proposal.parentNeedId).toBe("score-protection:agenda-1:remote_1");
    expect(materialized.step).toMatchObject({
      stepId: `${instance.instanceId}:develop_score_protection`,
      capability: {
        capabilityId: "develop_score_protection",
        semanticActionTypes: ["draw.card"],
      },
    });
    expect(materialized.step.target).toBeUndefined();
    expect(materialized.candidates).toEqual([
      expect.objectContaining({
        candidate: expect.objectContaining({ actionId: draw.actionId }),
        stepValue: 1,
      }),
    ]);
  });

  it("selects the score parent before materializing its P5 child route and keeps evidence, action, and parent identity aligned", () => {
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
          parentNeedId: "score-protection:development:remote_2",
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
          parentNeedId: "score-protection:terminal:remote_1",
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
    expect(proposal.parentNeedId).toBe("score-protection:terminal:remote_1");
    expect(planAssessment).toMatchObject({
      priorityValidation: { effectiveClass: "P5" },
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
          parentNeedId: "score-protection:development:remote_1",
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

  it("protects an exposed P3 score parent before adding an equally ranked central layer", () => {
    const scoreInstall = {
      ...cardAction("score-protection-install", "install.card", "score-ice"),
      targetContext: targetContext("remote_1", "server"),
    };
    const centralInstall = {
      ...cardAction("central-install", "install.card", "central-ice"),
      targetContext: targetContext("rd", "server"),
    };
    const module = corpModule("corp.defend_servers");
    const scoreProjectId = "agenda:exposed:remote_1";
    const corpContext = context([scoreInstall, centralInstall], {
      defenseNeeds: [
        {
          kind: "score_protection_install",
          defenseId: "score:exposed-install",
          serverId: "remote_1",
          phase: "install_ice",
          parentProjectId: scoreProjectId,
          parentNeedId: "score-protection:exposed:remote_1",
          delegatedPriorityClass: "P3",
          actionId: scoreInstall.actionId,
          sourceCardInstanceId: scoreInstall.sourceCardInstanceId!,
          sourceDefinitionId: scoreInstall.sourceDefinitionId!,
          effect: "progress",
          runnerAccessSuccessProbability: {
            numerator: 1,
            denominator: 2,
          },
          totalInstallAndRezCredits: 1,
          projection: knownInstallProjection({
            actionId: scoreInstall.actionId,
            sourceCardInstanceId: scoreInstall.sourceCardInstanceId!,
            sourceDefinitionId: scoreInstall.sourceDefinitionId!,
            targetServerId: "remote_1",
            effect: "progress",
            probability: { numerator: 1, denominator: 2 },
            totalCredits: 1,
          }),
          evidenceCode: "exposed_score_parent_needs_protection",
        },
        {
          kind: "generic",
          defenseId: "material-rd-layer",
          serverId: "rd",
          phase: "install_ice",
          sourceDefinitionIds: [centralInstall.sourceDefinitionId!],
          actionIds: [centralInstall.actionId],
          urgent: false,
          installRoute: {
            disposition: "productive",
            progressKind: "scoreline_central_tax_allocation",
            projection: knownInstallProjection({
              actionId: centralInstall.actionId,
              sourceCardInstanceId: centralInstall.sourceCardInstanceId!,
              sourceDefinitionId: centralInstall.sourceDefinitionId!,
              targetServerId: "rd",
              effect: "progress",
              probability: { numerator: 1, denominator: 2 },
              totalCredits: 1,
            }),
          },
          value: 1,
          evidenceCode: "material_central_pressure",
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

    expect(proposal.parentInstanceId).toBe(
      "plan:corp.score_agenda:agenda%3Aexposed%3Aremote_1",
    );
    expect(planAssessment).toMatchObject({
      priorityValidation: { effectiveClass: "P5" },
      evidenceCodes: ["exposed_score_parent_needs_protection"],
    });
    expect(
      module
        .materialize(instance, planAssessment, corpContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual([scoreInstall.actionId]);
  });

  it("completes a deadline-bound P3 score-protection staging layer before an equally ranked central layer", () => {
    const scoreInstall = {
      ...cardAction("score-staging-install", "install.card", "score-ice"),
      targetContext: targetContext("remote_1", "server"),
    };
    const centralInstall = {
      ...cardAction("central-install", "install.card", "central-ice"),
      targetContext: targetContext("rd", "server"),
    };
    const module = corpModule("corp.defend_servers");
    const scoreProjectId = "agenda:prepared:remote_1";
    const corpContext = context([scoreInstall, centralInstall], {
      defenseNeeds: [
        {
          kind: "score_protection_staging_install",
          defenseId: "score:prepared-staging-install",
          serverId: "remote_1",
          phase: "install_ice",
          parentProjectId: scoreProjectId,
          parentNeedId: "score-protection:prepared:remote_1",
          delegatedPriorityClass: "P3",
          actionId: scoreInstall.actionId,
          sourceCardInstanceId: scoreInstall.sourceCardInstanceId!,
          sourceDefinitionId: scoreInstall.sourceDefinitionId!,
          evidenceCode: "prepared_score_parent_needs_staging_layer",
        },
        {
          kind: "generic",
          defenseId: "material-rd-layer",
          serverId: "rd",
          phase: "install_ice",
          sourceDefinitionIds: [centralInstall.sourceDefinitionId!],
          actionIds: [centralInstall.actionId],
          urgent: false,
          centralPressure: "material",
          installRoute: {
            disposition: "productive",
            projection: knownInstallProjection({
              actionId: centralInstall.actionId,
              sourceCardInstanceId: centralInstall.sourceCardInstanceId!,
              sourceDefinitionId: centralInstall.sourceDefinitionId!,
              targetServerId: "rd",
              effect: "progress",
              probability: { numerator: 1, denominator: 2 },
              totalCredits: 1,
            }),
          },
          value: 1,
          evidenceCode: "material_central_pressure",
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

    expect(proposal.parentInstanceId).toBe(
      "plan:corp.score_agenda:agenda%3Aprepared%3Aremote_1",
    );
    expect(planAssessment.evidenceCodes).toEqual([
      "prepared_score_parent_needs_staging_layer",
    ]);
    expect(
      module
        .materialize(instance, planAssessment, corpContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual([scoreInstall.actionId]);
  });

  it("selects exactly one densest targeted draw route with a technical tie-break", () => {
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
          parentNeedId: "score-protection:agenda-1:remote_1",
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
          parentNeedId: "score-protection:agenda-1:remote_1",
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
    ).toEqual(["night-shift"]);
    expect(
      bindBestCurrentPlanRoute({
        side: "corp",
        stateVersion: 10,
        timingPoint: "corp_action.main",
        planInstanceId: instance.instanceId,
        ...materialized,
      }).head.actionId,
    ).toBe("night-shift");
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
    const assessed = module.assess(instance, corpContext, emptyPortfolio());

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
    const assessed = module.assess(instance, corpContext, emptyPortfolio());

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
        parentNeedId: "score-protection:agenda-1:new_remote",
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
          parentNeedId: "score-protection:agenda-1:new_remote",
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

    expect(planAssessment.priorityValidation.effectiveClass).toBe("P5");
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
          parentNeedId: "score-protection:agenda-1:remote_1",
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
          parentNeedId: "score-protection:agenda-1:remote_1",
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
      parentNeedId: "score-protection:agenda-1:remote_1",
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
      parentNeedId: "score-protection:agenda-1:remote_1",
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
            parentNeedId: "score-support:score-1",
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
    expect(open[0]?.parentNeedId).toBe("score-support:score-1");
    expect(satisfied).toEqual([]);
  });

  it.each(["P1", "P2", "P3", "P4"] as const)(
    "keeps a %s score parent ready with its exact open funding gap",
    (priorityClass) => {
      const score = corpModule("corp.score_agenda");
      const project = {
        ...scoreProject(
          `funding-parent-${priorityClass}`,
          priorityClass,
          `score_parent_needs_funding_${priorityClass}`,
        ),
        feasible: false,
        fundingGap: 2,
      };
      const corpContext = context([], { scoreProjects: [project] });
      const proposal = score.discover(corpContext)[0]!;
      const instance = instantiatePlanProposal(proposal, 10);
      const planAssessment = requireValidatedPlanAssessment(
        score.assess(instance, corpContext, emptyPortfolio()),
        CORP_PLAN_PRIORITY_POLICY,
        10,
      );

      expect(proposal).toMatchObject({
        initialViability: "ready",
        blockers: [],
      });
      expect(planAssessment).toMatchObject({
        readiness: "executable_with_support",
        priorityValidation: { effectiveClass: priorityClass },
        feasibility: { currentRouteHeadPossible: false },
        resourceGaps: [
          {
            needId: `score-support:funding-parent-${priorityClass}`,
            capability: "credits",
            minimum: 2,
            available: 0,
          },
        ],
      });
    },
  );

  it("keeps an exact current advance behind its published protection funding gap", () => {
    const score = corpModule("corp.score_agenda");
    const project = {
      ...scoreProject(
        "current-advance-with-future-protection-gap",
        "P4",
        "score_advance_with_future_protection_gap",
      ),
      fundingGap: 2,
    };
    const advance = targetAction(
      "advance-current-agenda",
      "score.advance_card",
      project.agendaInstanceId!,
      "card",
    );
    const corpContext = context([advance], { scoreProjects: [project] });
    const proposal = score.discover(corpContext)[0]!;
    const instance = instantiatePlanProposal(proposal, 10);
    const planAssessment = requireValidatedPlanAssessment(
      score.assess(instance, corpContext, emptyPortfolio()),
      CORP_PLAN_PRIORITY_POLICY,
      10,
    );

    expect(proposal).toMatchObject({
      initialViability: "ready",
      blockers: [],
    });
    expect(planAssessment).toMatchObject({
      readiness: "executable_with_support",
      feasibility: { currentRouteHeadPossible: false },
      resourceGaps: [
        {
          needId: `score-support:${project.projectId}`,
          capability: "credits",
          minimum: 2,
          available: 0,
        },
      ],
    });
  });

  it("keeps an exact current terminal install executable while its later score route remains unknown", () => {
    const score = corpModule("corp.score_agenda");
    const install = {
      ...cardAction(
        "install-current-terminal-agenda",
        "install.card",
        "agenda-def",
      ),
      targetContext: targetContext("remote_1", "server"),
    };
    const project = {
      projectId: "current-terminal-install-with-uncertain-later-route",
      agendaDefinitionId: "agenda-def",
      agendaPoints: 2,
      serverId: "remote_1",
      actionIds: [install.actionId],
      phase: "install_agenda" as const,
      sameTurnCloseout: false,
      terminalScore: true,
      feasible: true,
      evidenceCode: "score_install_with_uncertain_later_route",
      uncertainty: {
        kind: "later_score_route" as const,
        knowledge: "unknown" as const,
        reason: "later_score_route_not_engine_proven",
        currentActionScope: "exact_install_only" as const,
      },
    };
    const corpContext = context([install], { scoreProjects: [project] });
    const proposal = score.discover(corpContext)[0]!;
    const instance = instantiatePlanProposal(proposal, 10);
    const planAssessment = requireValidatedPlanAssessment(
      score.assess(instance, corpContext, emptyPortfolio()),
      CORP_PLAN_PRIORITY_POLICY,
      10,
    );

    expect(planAssessment).toMatchObject({
      readiness: "executable_now",
      priorityValidation: { effectiveClass: "P4" },
      feasibility: { currentRouteHeadPossible: true },
      resourceGaps: [],
    });
    expect(
      score
        .materialize(instance, planAssessment, corpContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual([install.actionId]);
  });

  it.each(["P1", "P2", "P3", "P4"] as const)(
    "inherits the exact %s score-parent priority for a funding delegation",
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
            parentNeedId: `score-support:score-${delegatedPriorityClass}`,
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
      expect(proposal.parentNeedId).toBe(
        `score-support:score-${delegatedPriorityClass}`,
      );
      const planAssessment = requireValidatedPlanAssessment(
        economy.assess(instance, corpContext, emptyPortfolio()),
        CORP_PLAN_PRIORITY_POLICY,
        10,
      );
      expect(planAssessment).toMatchObject({
        priorityClaim: {
          requestedClass: delegatedPriorityClass,
        },
        withinClassValue: 280,
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

  it("values a parent-funding route more highly when one credit action nearly closes its gap", () => {
    const economy = corpModule("corp.economy");
    const credit = candidate("credit", "gain_credit", "economy.gain_credit");
    const assessmentValue = (gap: number) => {
      const projectId = `score-gap-${gap}`;
      const parentPlanInstanceId = `plan:corp.score_agenda:${projectId}`;
      const signal = {
        kind: "parent_funding" as const,
        needId: `score-support:${projectId}`,
        gap,
        actionIds: [credit.actionId],
        parentPlanInstanceId,
        parentNeedId: `score-support:${projectId}`,
        delegatedPriorityClass: "P4" as const,
        urgentForScore: true,
        evidenceCode: `score_needs_${gap}_credits`,
      };
      const corpContext = context([credit], {
        economyNeeds: [signal],
        scoreProjects: [scoreProject(projectId, "P4", signal.evidenceCode)],
      });
      const proposal = economy.discover(corpContext)[0]!;
      const instance = instantiatePlanProposal(proposal, 10);
      return requireValidatedPlanAssessment(
        economy.assess(instance, corpContext, emptyPortfolio()),
        CORP_PLAN_PRIORITY_POLICY,
        10,
      ).withinClassValue;
    };

    expect(assessmentValue(1)).toBeGreaterThan(assessmentValue(10));
  });

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
          parentNeedId: "score-support:score-P1",
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
      scoreProjects: [scoreProject("score-P1", "P1", "score_needs_credits_P1")],
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

  it("excludes an empty-R&D draw operation from funding while keeping Basic Credit executable", () => {
    const economy = corpModule("corp.economy");
    const basicCredit = candidate(
      "basic-credit",
      "gain_credit",
      "economy.gain_credit",
    );
    const nightShift = candidate(
      "night-shift",
      "play_operation",
      "economy.gain_credit",
    );
    nightShift.sourceKind = "card";
    nightShift.sourceCardInstanceId = "night-shift-card";
    nightShift.sourceDefinitionId = "onr_v1_295_night-shift";
    nightShift.economyProjection = {
      ...nightShift.economyProjection!,
      grossLiquidCreditGain: 2,
      netLiquidCreditGain: 2,
      cardsDrawn: 1,
      cardsConsumed: 1,
      netHandDelta: 0,
      repeatable: false,
      source: "legal_action_payload",
    };
    const fundingNeed = {
      kind: "parent_funding" as const,
      needId: "empty-rd-funding",
      gap: 2,
      actionIds: [basicCredit.actionId, nightShift.actionId],
      urgentForScore: false,
      evidenceCode: "empty_rd_funding_test",
    };
    const corpContext = context(
      [basicCredit, nightShift],
      { economyNeeds: [fundingNeed] },
      { credits: 0, clicks: 2 },
    );
    corpContext.input.playerView.own.stackOrRdCount = 0;
    corpContext.input.legalActions.find(
      (action) => action.actionId === nightShift.actionId,
    )!.payload = { gainCreditsAmount: 2, drawCardsAmount: 1 };
    const route = assessCorpEconomyFundingRoute(corpContext, fundingNeed);
    const instance = instantiatePlanProposal(
      economy.discover(corpContext)[0]!,
      10,
    );

    expect(route).toMatchObject({
      status: "covered_guaranteed",
      reliability: "guaranteed",
      headActionId: "basic-credit",
    });
    expect(
      economy
        .materialize(instance, {} as never, corpContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["basic-credit"]);
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
    project.fundingGap = 5;
    project.fundingMilestone = corpScoreFundingMilestone(project, 1)!;
    const scoreFunding = {
      kind: "parent_funding" as const,
      needId: `score-support:${project.projectId}`,
      gap: 5,
      actionIds: [basicCredit.actionId],
      parentPlanInstanceId:
        "plan:corp.score_agenda:agenda%3Aagenda-1%3Aremote_1",
      parentNeedId: `score-support:${project.projectId}`,
      scoreFundingMilestone: project.fundingMilestone,
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
      parentNeedId: scoreFunding.parentNeedId,
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

  it("keeps a score funding target stable while guaranteed credit tranches shrink its gap", () => {
    const first = {
      ...scoreProject("stable-funding", "P4", "score_needs_funding"),
      fundingGap: 3,
    };
    const firstMilestone = corpScoreFundingMilestone(first, 2);
    const next = {
      ...first,
      fundingGap: 2,
    };
    const nextMilestone = corpScoreFundingMilestone(next, 3);

    expect(firstMilestone).toMatchObject({
      targetCredits: 5,
      observedCredits: 2,
      remainingGap: 3,
      priorityClass: "P4",
      hardness: "soft",
      deadline: "multi_turn",
    });
    expect(nextMilestone).toMatchObject({
      targetCredits: 5,
      observedCredits: 3,
      remainingGap: 2,
    });
  });

  it("lets the score parent reserve funded progress only against lower-priority spending", () => {
    const project = {
      ...scoreProject("reserved-funding", "P4", "score_needs_funding"),
      fundingGap: 2,
    };
    project.fundingMilestone = corpScoreFundingMilestone(project, 3)!;

    expect(
      assessCorpSpendAgainstScoreFundingMilestones({
        currentCredits: 3,
        actionCreditCost: 1,
        actionPriorityClass: "P5",
        scoreProjects: [project],
      }),
    ).toMatchObject({
      preservesMilestone: false,
      protectedCredits: 3,
      projectId: project.projectId,
    });
    expect(
      assessCorpSpendAgainstScoreFundingMilestones({
        currentCredits: 3,
        actionCreditCost: 1,
        actionPriorityClass: "P3",
        scoreProjects: [project],
      }).preservesMilestone,
    ).toBe(true);
    expect(
      assessCorpSpendAgainstScoreFundingMilestones({
        currentCredits: 3,
        actionCreditCost: 1,
        actionPriorityClass: "P5",
        scoreProjects: [],
      }).preservesMilestone,
    ).toBe(true);
  });

  it("advances an exactly bound funding-only defense child by one guaranteed tranche", () => {
    const economy = corpModule("corp.economy");
    const basicCredit = candidate(
      "basic-credit",
      "gain_credit",
      "economy.gain_credit",
    );
    const scoreProtectionDraw = candidate(
      "score-protection-draw",
      "draw_card",
      "draw.card",
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
      needId: "defense-reserve:hq:pocket-vr",
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
      [basicCredit, scoreProtectionDraw],
      {
        defenseNeeds: [
          defenseParent,
          {
            kind: "score_protection_draw",
            defenseId: "score:draw:p4",
            serverId: "remote_1",
            phase: "draw_for_ice",
            parentProjectId: "agenda:foreign-p4:remote_1",
            parentNeedId: "score-protection:foreign-p4:remote_1",
            delegatedPriorityClass: "P4",
            actionId: scoreProtectionDraw.actionId,
            drawAttemptState: {
              turnKey: "corp:1",
              remainingAttempts: 1,
            },
            evidenceCode: "foreign_p4_score_protection_draw",
          },
        ],
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
    expect(proposal.parentInstanceId).toBe(defenseFunding.parentPlanInstanceId);
    expect(proposal.parentNeedId).toBe(defenseFunding.parentNeedId);
    const defense = corpModule("corp.defend_servers");
    const defenseProposal = defense.discover(corpContext)[0]!;
    const defenseInstance = instantiatePlanProposal(defenseProposal, 10);
    const defenseAssessment = requireValidatedPlanAssessment(
      defense.assess(defenseInstance, corpContext, emptyPortfolio()),
      CORP_PLAN_PRIORITY_POLICY,
      10,
    );
    expect(defenseProposal).toMatchObject({
      initialViability: "ready",
      blockers: [],
    });
    expect(defenseAssessment).toMatchObject({
      readiness: "executable_with_support",
      priorityValidation: { effectiveClass: "P2" },
      resourceGaps: [
        {
          needId: defenseParent.defenseId,
          capability: "credits",
          minimum: 4,
          available: 0,
        },
      ],
    });
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
    ["mismatched gap", { gap: 3 }],
    [
      "mismatched target server",
      {
        incrementalDefenseReserve: {
          targetCredits: 9,
          serverId: "rd",
          iceInstanceId: "pocket-vr",
        },
      },
    ],
    [
      "mismatched ICE",
      {
        incrementalDefenseReserve: {
          targetCredits: 9,
          serverId: "hq",
          iceInstanceId: "different-ice",
        },
      },
    ],
  ] as const)(
    "fails closed on a %s exact contract for a defense-funding child",
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
                needId: "defense-reserve:hq:pocket-vr",
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

  it("fails closed when a defense-reserve child loses every optional parent-binding field", () => {
    const economy = corpModule("corp.economy");
    const basicCredit = candidate(
      "basic-credit",
      "gain_credit",
      "economy.gain_credit",
    );

    expect(() =>
      economy.discover(
        context([basicCredit], {
          economyNeeds: [
            {
              kind: "parent_funding",
              needId: "defense-reserve:hq:pocket-vr",
              gap: 4,
              actionIds: [basicCredit.actionId],
              urgentForScore: false,
              evidenceCode:
                "corp_defense_exact_route_funding_required:hq:pocket-vr",
            },
          ],
        }),
      ),
    ).toThrowError(/missing_plan_module_coverage/);
  });

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

  it("converts one exactly bound immediate Corp economy operation at P4", () => {
    const economy = corpModule("corp.economy");
    const accounts = {
      ...candidate("play-accounts", "play_operation", "economy.gain_credit"),
      sourceKind: "card" as const,
      sourceCardInstanceId: "accounts-card",
      sourceDefinitionId: "onr_v1_281_accounts-receivable",
      costProfile: {
        clickCost: 1,
        creditCost: 5,
        costKnownStatus: "known" as const,
        additionalCosts: [],
      },
      economyProjection: {
        schemaVersion: "action-economy-projection-v1" as const,
        kind: "immediate_liquid" as const,
        timing: "immediate" as const,
        creditRestriction: "general" as const,
        clickCost: 1,
        creditCost: 5,
        grossLiquidCreditGain: 9,
        netLiquidCreditGain: 4,
        cardsDrawn: 0,
        cardsConsumed: 1,
        netHandDelta: -1,
        payoutMode: "fixed" as const,
        repeatable: "unknown" as const,
        reliability: "guaranteed" as const,
        source: "legal_action_payload" as const,
        confidence: "high" as const,
        evidence: ["test_projection:complete"],
      },
    };
    const signal = {
      kind: "convert_immediate_operation" as const,
      needId: "economy-immediate-operation:accounts-card",
      sourceInstanceId: "accounts-card",
      sourceDefinitionId: "onr_v1_281_accounts-receivable",
      actionIds: ["play-accounts"] as [string],
      conversion: {
        clickCost: 1,
        creditCost: 5,
        grossLiquidCreditGain: 9,
        netLiquidCreditGain: 4,
        cardsDrawn: 0,
        cardsConsumed: 1 as const,
        netHandDelta: -1,
        payoutMode: "fixed" as const,
        reliability: "guaranteed" as const,
        source: "legal_action_payload" as const,
      },
      cadence: {
        kind: "single_action" as const,
        maximumConversions: 1 as const,
      },
      completion: {
        kind: "source_consumed" as const,
      },
      urgentForScore: false,
      evidenceCode:
        "corp_engine_certified_immediate_operation_conversion:onr_v1_281_accounts-receivable",
    };
    const corpContext = context(
      [accounts],
      { economyNeeds: [signal] },
      { credits: 5, clicks: 1 },
    );
    const proposal = economy.discover(corpContext)[0]!;
    const instance = instantiatePlanProposal(proposal, 10);

    expect(proposal).toMatchObject({
      target: { kind: "card", id: "accounts-card" },
      initialViability: "ready",
    });
    expect(
      economy.assess(instance, corpContext, {
        executorInstanceId: undefined,
      } as never),
    ).toMatchObject({
      priorityClaim: {
        requestedClass: "P4",
        reasonCode: "strategic_campaign",
      },
      withinClassValue: 80,
    });
    expect(
      bindBestCurrentPlanRoute({
        side: "corp",
        stateVersion: 10,
        timingPoint: "corp_action.main",
        planInstanceId: instance.instanceId,
        ...economy.materialize(instance, {} as never, corpContext),
      }).head.actionId,
    ).toBe("play-accounts");

    const driftedContext = context(
      [
        {
          ...accounts,
          economyProjection: {
            ...accounts.economyProjection,
            netLiquidCreditGain: 3,
          },
        },
      ],
      { economyNeeds: [signal] },
      { credits: 5, clicks: 1 },
    );
    const driftedProposal = economy.discover(driftedContext)[0]!;
    expect(driftedProposal.initialViability).toBe("blocked");
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
                  postInstallRezQuoteCostKind: "fixed",
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

type TestRezCostModel =
  | "fixed"
  | "paid_end_the_run_subroutines"
  | "alternate_subtype"
  | "x_strength";

function postInstallRezQuoteFieldsForTest(
  costModel: TestRezCostModel,
): Record<string, string | number | boolean> {
  const common = {
    postInstallRezQuoteBaseCredits: 1,
    postInstallRezQuoteFinalCredits: 1,
  };
  if (costModel === "fixed") {
    return {
      ...common,
      postInstallRezQuoteCostKind: "fixed",
    };
  }
  if (costModel === "paid_end_the_run_subroutines") {
    return {
      ...common,
      postInstallRezQuoteCostKind: "variable",
      postInstallRezQuoteVariableRezKind: costModel,
      postInstallRezQuoteVariableAdditionalCreditsPerSubroutine: 2,
      postInstallRezQuoteVariableMinSubroutines: 0,
      postInstallRezQuoteVariableMinSubroutinesFinalCredits: 1,
      postInstallRezQuoteVariableFirstEndTheRunSubroutineCount: 1,
      postInstallRezQuoteVariableFirstEndTheRunFinalCredits: 3,
    };
  }
  if (costModel === "alternate_subtype") {
    return {
      ...common,
      postInstallRezQuoteCostKind: "variable",
      postInstallRezQuoteVariableRezKind: costModel,
      postInstallRezQuoteVariableBaseSubtypes: "sentry",
      postInstallRezQuoteVariableBaseSubtypesFinalCredits: 1,
      postInstallRezQuoteVariableAlternateSubtypes: "wall",
      postInstallRezQuoteVariableAlternateSubtypesAdditionalCredits: 4,
      postInstallRezQuoteVariableAlternateSubtypesFinalCredits: 5,
    };
  }
  return {
    ...common,
    postInstallRezQuoteCostKind: "variable",
    postInstallRezQuoteVariableRezKind: costModel,
    postInstallRezQuoteVariableAdditionalCreditsPerValue: 1,
    postInstallRezQuoteVariableMinValue: 0,
    postInstallRezQuoteVariableMaxValue: 6,
    postInstallRezQuoteVariableMinValueFinalCredits: 1,
    postInstallRezQuoteVariableMaxValueFinalCredits: 7,
    postInstallRezQuoteVariableEffectiveStrengthFromValue: true,
  };
}

function installedRezQuoteForTest(
  costModel: TestRezCostModel,
  iceInstanceId: string,
): VisibleCorpRezCostQuote {
  const common = {
    context: "installed" as const,
    cardId: iceInstanceId,
    targetServerId: "rd" as const,
    projectedServerId: "rd" as const,
    expiresAtStateVersion: 10,
    complete: true as const,
    baseCredits: 1,
    finalCredits: 1,
    mandatoryAdditionalCosts: { agendaPoints: 0 },
  };
  if (costModel === "fixed") {
    return {
      ...common,
      costKind: "fixed",
    };
  }
  if (costModel === "paid_end_the_run_subroutines") {
    return {
      ...common,
      costKind: "variable",
      variableParameter: {
        kind: costModel,
        additionalCreditsPerSubroutine: 2,
        minSubroutines: 0,
        minSubroutinesFinalCredits: 1,
        firstEndTheRunSubroutineCount: 1,
        firstEndTheRunFinalCredits: 3,
      },
    };
  }
  if (costModel === "alternate_subtype") {
    return {
      ...common,
      costKind: "variable",
      variableParameter: {
        kind: costModel,
        baseSubtypes: ["sentry"],
        baseSubtypesFinalCredits: 1,
        alternateSubtypes: ["wall"],
        alternateSubtypesAdditionalCredits: 4,
        alternateSubtypesFinalCredits: 5,
      },
    };
  }
  return {
    ...common,
    costKind: "variable",
    variableParameter: {
      kind: costModel,
      additionalCreditsPerValue: 1,
      minValue: 0,
      maxValue: 6,
      minValueFinalCredits: 1,
      maxValueFinalCredits: 7,
      effectiveStrengthFromValue: true,
    },
  };
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
  minimumAdditionalCreditsToSatisfy?: number;
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
    availableCorpAgendaPoints: 0,
    totalScoreReserveCredits: 0,
    hardClickReserve: 0,
    fundedProtection: params.preservesReserves !== false,
    scoreReserveFingerprint: "credits:;hardClicks:0",
    protection,
    selectedRezCosts,
    totalSelectedRezCost: params.totalCredits,
    totalSelectedAgendaPointCost: 0,
    creditsAfterDefense: 0,
    agendaPointsAfterDefense: 0,
    clicksAfterDefense: 2,
    preservesScoreCreditReserve: params.preservesReserves !== false,
    preservesHardClickReserve: true,
    evidence: [],
  };
  const minimumAdditionalCreditsToSatisfy =
    params.minimumAdditionalCreditsToSatisfy ??
    (params.preservesReserves === false ? params.totalCredits : undefined);
  const afterAssessment = {
    ...fundedAssessment,
    ...(minimumAdditionalCreditsToSatisfy !== undefined
      ? {
          minimumSatisfyingRezCost: params.totalCredits,
          minimumSatisfyingRezCosts: selectedRezCosts,
          minimumSatisfyingProtection: protection,
          minimumAdditionalCreditsToSatisfy,
          minimumAdditionalClicksToSatisfy: 0,
        }
      : {}),
  };
  return {
    knowledge: "known",
    actionId: params.actionId,
    sourceCardInstanceId: params.sourceCardInstanceId,
    sourceDefinitionId: params.sourceDefinitionId,
    targetServerId: params.targetServerId,
    before: fundedAssessment,
    after: afterAssessment,
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

function fundingOnlyDefenseSignal(
  install: ActionSemanticCandidate,
  effect: "no_progress" | "progress",
): CorpDefenseSignal {
  return {
    kind: "generic",
    defenseId: `install:rd:${install.actionId}`,
    serverId: "rd",
    phase: "install_ice",
    sourceDefinitionIds: [install.sourceDefinitionId!],
    actionIds: [install.actionId],
    urgent: false,
    installRoute: {
      disposition: "funding_only",
      progressKind: "funding_required",
      rezFundingGap: 2,
      projection: knownInstallProjection({
        actionId: install.actionId,
        sourceCardInstanceId: install.sourceCardInstanceId!,
        sourceDefinitionId: install.sourceDefinitionId!,
        targetServerId: "rd",
        effect,
        probability: { numerator: 1, denominator: 2 },
        totalCredits: 2,
        availableCredits: 0,
        availableClicks: 3,
        preservesReserves: false,
        minimumAdditionalCreditsToSatisfy: 2,
      }),
    },
    value: 10,
    evidenceCode: `funding_only:${install.actionId}`,
  };
}

function productiveDefenseSignal(
  install: ActionSemanticCandidate,
): CorpDefenseSignal {
  return {
    kind: "generic",
    defenseId: `install:rd:${install.actionId}`,
    serverId: "rd",
    phase: "install_ice",
    sourceDefinitionIds: [install.sourceDefinitionId!],
    actionIds: [install.actionId],
    urgent: false,
    installRoute: {
      disposition: "productive",
      progressKind: "funded_structured_central_defense",
      rezFundingGap: 0,
      projection: knownInstallProjection({
        actionId: install.actionId,
        sourceCardInstanceId: install.sourceCardInstanceId!,
        sourceDefinitionId: install.sourceDefinitionId!,
        targetServerId: "rd",
        effect: "progress",
        probability: { numerator: 0, denominator: 1 },
        totalCredits: 0,
        availableCredits: 0,
        availableClicks: 3,
        preservesReserves: true,
      }),
    },
    value: 20,
    evidenceCode: `productive:${install.actionId}`,
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
    sameTurnCloseout: priorityClass === "P1" || priorityClass === "P3",
    feasible: true,
    evidenceCode,
  };
}

function remoteProjectSignal(): CorpCorePlanDomain["remoteProjects"][number] {
  return {
    projectId: "strategic-score-remote",
    purpose: "scoring_remote",
    purposes: ["scoreline"],
    target: {
      status: "bound",
      serverId: "remote_1",
      targetBindingRevision: 0,
    },
    serverId: "remote_1",
    protectionTarget: "taxing",
    buildTiming: "prebuild",
    targetRecoveryTurns: 2,
    phase: "harden_to_protection_target",
    maturity: {
      knowledge: "unknown",
      observedAtStateVersion: 10,
      unknownReasons: ["test_fixture"],
    },
    need: {
      needId: "remote-hardening:strategic-score-remote:0",
      parentProjectId: "strategic-score-remote",
      targetServerId: "remote_1",
      observedAtStateVersion: 10,
      capability: "improve_remote_protection_path",
      minimum: 1,
    },
    cadence: {
      turnKey: "corp:8",
      maximumActions: 1,
      actionsUsed: 0,
      open: true,
    },
    feasible: true,
    value: 20,
    evidenceCode: "remote_protection_below_target:remote_1",
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
