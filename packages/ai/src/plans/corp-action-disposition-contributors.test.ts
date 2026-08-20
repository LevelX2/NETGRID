import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it, vi } from "vitest";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { CorpPlanDomain } from "./corp-tactical-plan-modules";
import {
  collectCorpActionDispositions,
  type CorpActionDispositionContributorFacts,
} from "./corp-action-disposition-contributors";
import { planInstanceIdForProposal } from "./plan-instance";

describe("corp action disposition contributors", () => {
  it("reserves an unmatched Data Fort capability for corp.score_agenda", () => {
    const candidate = {
      actionId: "data-fort-build",
      actionType: "activated_card_ability",
      semanticActionType: "card_ability.activate",
      planOwnerBinding: {
        capabilityKey: "hq_to_new_remote_install_rez",
        owner: "corp.score_agenda",
      },
    } as unknown as ActionSemanticCandidate;

    expect(
      collectCorpActionDispositions(
        input(),
        [candidate],
        emptyDomain(),
        contributorFacts(),
      ),
    ).toEqual([
      {
        actionId: "data-fort-build",
        disposition: "explicitly_nonproductive",
        ownerModuleId: "corp.score_agenda",
        evidenceCode: "capability_plan_owner:hq_to_new_remote_install_rez",
      },
    ]);
  });

  it("admits a capability-owned action once an exact score project materializes it", () => {
    const candidate = {
      actionId: "move-advancement",
      actionType: "activated_card_ability",
      semanticActionType: "score_conversion.move_advancement",
      planOwnerBinding: {
        capabilityKey:
          "abilities_activated_corp_main_move_advancement_counters",
        owner: "corp.score_agenda",
      },
    } as unknown as ActionSemanticCandidate;
    const domain = {
      ...emptyDomain(),
      scoreProjects: [
        {
          projectId: "agenda:hostile-takeover:remote_2",
          agendaPoints: 1,
          agendaInstanceId: "hostile-takeover",
          serverId: "remote_2",
          actionIds: [candidate.actionId],
          phase: "convert_agenda" as const,
          sameTurnCloseout: true,
          terminalScore: false,
          feasible: true,
          evidenceCode: "corp_same_turn_score_conversion:move_advancement",
        },
      ],
    };
    const facts = {
      ...contributorFacts(),
      corpExactExecutableNonEconomyPlanOwnsAction: vi.fn(
        (_domain, current) => current.actionId === candidate.actionId,
      ),
    };

    expect(
      collectCorpActionDispositions(input(), [candidate], domain, facts),
    ).toEqual([]);
  });

  it("keeps score-effect target siblings with the bound score parent", () => {
    const selected = {
      actionId: "score-agenda-hq",
      actionType: "score_agenda",
      semanticActionType: "score.agenda",
      sourceKind: "card",
      sourceCardInstanceId: "security-net",
    } as unknown as ActionSemanticCandidate;
    const sibling = {
      ...selected,
      actionId: "score-agenda-rd",
    } as unknown as ActionSemanticCandidate;
    const domain = {
      ...emptyDomain(),
      scoreProjects: [
        {
          projectId: "agenda:security-net:remote_2",
          agendaPoints: 3,
          agendaInstanceId: "security-net",
          serverId: "remote_2",
          actionIds: [selected.actionId],
          phase: "score_agenda" as const,
          sameTurnCloseout: true,
          terminalScore: false,
          feasible: true,
          evidenceCode: "corp_same_turn_score_conversion:score_ready",
        },
      ],
    };
    const facts = {
      ...contributorFacts(),
      corpExactExecutableNonEconomyPlanOwnsAction: vi.fn(
        (_domain, candidate) => candidate.actionId === selected.actionId,
      ),
    };

    expect(
      collectCorpActionDispositions(
        input(),
        [selected, sibling],
        domain,
        facts,
      ),
    ).toEqual([
      {
        actionId: sibling.actionId,
        disposition: "explicitly_nonproductive",
        ownerModuleId: "corp.score_agenda",
        evidenceCode:
          "corp_bound_score_effect_target_variant_not_selected:agenda:security-net:remote_2",
      },
    ]);
  });

  it("blocks the resident agenda advance while its continuation reserve is unfunded", () => {
    const advance = {
      actionId: "advance-fetal-ai",
      actionType: "advance_card",
      semanticActionType: "score.advance_card",
      sourceKind: "card",
      sourceCardInstanceId: "fetal-ai-1",
    } as unknown as ActionSemanticCandidate;
    const domain = {
      ...emptyDomain(),
      scoreProjects: [
        {
          projectId: "agenda:fetal-ai-1:remote_1",
          agendaPoints: 3,
          agendaInstanceId: "fetal-ai-1",
          serverId: "remote_1",
          phase: "advance_agenda" as const,
          sameTurnCloseout: false,
          terminalScore: false,
          feasible: true,
          continuationReserve: {
            agendaCardId: "fetal-ai-1",
            serverId: "remote_1",
            requiredCreditsBeforeNextCorpTurn: 3,
            remainingAdvancementCounters: 3,
            nextCorpTurnGuaranteedFlexibleClicks: 3,
            certifiedCreditGainFromFreeClicks: 0,
          },
          fundingMilestone: {
            kind: "score_credit_milestone" as const,
            targetCredits: 3,
            observedCredits: 1,
            remainingGap: 2,
            priorityClass: "P4" as const,
            hardness: "soft" as const,
            deadline: "next_corp_turn" as const,
            releaseCondition:
              "parent_invalidated_or_higher_priority_preemption" as const,
          },
          evidenceCode:
            "engine_certified_next_turn_score_continuation:fetal-ai-1:remote_1",
        },
      ],
    };

    expect(
      collectCorpActionDispositions(
        input(),
        [advance],
        domain,
        contributorFacts(),
      ),
    ).toEqual([
      {
        actionId: advance.actionId,
        disposition: "explicitly_nonproductive",
        ownerModuleId: "corp.score_agenda",
        evidenceCode:
          "corp_score_continuation_advance_waits_for_credit_reserve:agenda:fetal-ai-1:remote_1:2",
      },
    ]);
  });

  it("keeps future recurring capacity with corp.economy before later fallbacks", () => {
    const candidate = {
      actionId: "recurring-capacity",
      actionType: "play_operation",
      semanticActionType: "play.corp_operation",
      actionCapacityProjection: { kind: "future_recurring_gain" },
    } as unknown as ActionSemanticCandidate;

    expect(
      collectCorpActionDispositions(
        input(),
        [candidate],
        emptyDomain(),
        contributorFacts(),
      ),
    ).toEqual([
      {
        actionId: "recurring-capacity",
        disposition: "explicitly_nonproductive",
        ownerModuleId: "corp.economy",
        evidenceCode:
          "corp_future_recurring_action_capacity_has_no_bound_parent_plan",
      },
    ]);
  });

  it("classifies an Engine-bound activated run-credit ability even while its broad semantic remains unknown", () => {
    const candidate = {
      actionId: "executive-boot-camp",
      actionType: "activated_card_ability",
      semanticActionType: "card_ability.unknown",
    } as unknown as ActionSemanticCandidate;
    const facts = {
      ...contributorFacts(),
      corpRunDefenseAbilityAssessment: vi.fn(() => ({
        productive: false,
        serverId: "hq",
        value: 0,
        evidenceCode:
          "corp_temporary_run_credits_have_no_current_defense_funding_gap:hq:executive-boot-camp",
      })),
    };

    expect(
      collectCorpActionDispositions(input(), [candidate], emptyDomain(), facts),
    ).toEqual([
      {
        actionId: candidate.actionId,
        disposition: "explicitly_nonproductive",
        ownerModuleId: "corp.defend_servers",
        evidenceCode:
          "corp_temporary_run_credits_have_no_current_defense_funding_gap:hq:executive-boot-camp",
      },
    ]);
  });

  it("disposes generic Basic Credit through hand management while HQ overflows", () => {
    const current = input();
    current.playerView.own.credits = 1;
    current.playerView.own.gripOrHq = Array.from({ length: 6 }, (_, index) => ({
      instanceId: `corp-card-${index}`,
    })) as never;
    current.playerView.own.maxHandSize = 5;
    current.legalActions = [
      {
        actionId: "basic-credit",
        side: "corp",
        type: "gain_credit",
        source: "basic_action",
        expiresAtStateVersion: 12,
        targetRequirements: [],
        choiceRequirements: [],
        costs: [{ clicks: 1 }],
      },
      {
        actionId: "expensive-route",
        side: "corp",
        type: "install_card",
        source: "corp-card-0",
        expiresAtStateVersion: 12,
        targetRequirements: [],
        costs: [{ clicks: 1, credits: 8 }],
      },
    ] as never;
    const candidate = {
      actionId: "basic-credit",
      sourceKind: "basic_action",
      actionType: "gain_credit",
      semanticActionType: "economy.gain_credit",
      costProfile: {
        clickCost: 1,
        creditCost: 0,
        additionalCosts: [],
      },
      economyProjection: {
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
        payoutMode: "fixed",
        reliability: "guaranteed",
        source: "basic_action_contract",
        confidence: "medium",
      },
    } as unknown as ActionSemanticCandidate;

    expect(
      collectCorpActionDispositions(
        current,
        [candidate],
        emptyDomain(),
        contributorFacts(),
      ),
    ).toEqual([
      {
        actionId: "basic-credit",
        disposition: "explicitly_nonproductive",
        ownerModuleId: "corp.hand_and_agenda_management",
        evidenceCode: "corp_basic_credit_rejected_hq_overflow_requires_cleanup",
      },
    ]);
  });

  it("disposes an unbound punish-support install without requiring an execution quote", () => {
    const candidate = {
      actionId: "install-trace-support",
      actionType: "install_card",
      semanticActionType: "install.card",
      sourceKind: "card",
      sourceDefinitionId: "trace-support",
    } as unknown as ActionSemanticCandidate;
    const facts = {
      ...contributorFacts(),
      corpDefinitionSupportsPunishPlan: vi.fn(() => true),
    };

    expect(
      collectCorpActionDispositions(input(), [candidate], emptyDomain(), facts),
    ).toEqual([
      {
        actionId: "install-trace-support",
        disposition: "explicitly_nonproductive",
        ownerModuleId: "corp.execute_punish_sequence",
        evidenceCode: "corp_conditional_punish_setup_has_no_feasible_campaign",
      },
    ]);
  });

  it("does not dispose an action owned by an exact executable plan", () => {
    const candidate = {
      actionId: "install-exact-punish-plan",
      actionType: "install_card",
      semanticActionType: "install.card",
      sourceKind: "card",
      sourceDefinitionId: "trace-support",
    } as unknown as ActionSemanticCandidate;
    const facts = {
      ...contributorFacts(),
      corpExactExecutableNonEconomyPlanOwnsAction: vi.fn(() => true),
      corpDefinitionSupportsPunishPlan: vi.fn(() => true),
    };

    expect(
      collectCorpActionDispositions(input(), [candidate], emptyDomain(), facts),
    ).toEqual([]);
  });

  it("does not let HQ-overflow classification conflict with a materialized defense route", () => {
    const candidate = {
      actionId: "install-defense-upgrade-on-score-server",
      actionType: "install_card",
      semanticActionType: "install.card",
      sourceKind: "card",
      sourceDefinitionId: "onr_v1_363_olivia-salazar",
    } as unknown as ActionSemanticCandidate;
    const facts = {
      ...contributorFacts(),
      corpDefenseMaterializedActionIds: vi.fn(
        () => new Set([candidate.actionId]),
      ),
      corpHqOverflowReservedScoreServerDispositionEvidence: vi.fn(
        () =>
          "corp_hq_overflow_install_rejected_reserved_score_server:remote_1",
      ),
    };

    expect(
      collectCorpActionDispositions(input(), [candidate], emptyDomain(), facts),
    ).toEqual([]);
  });

  it("does not let an infeasible prepared score parent suppress a legal sibling route", () => {
    const candidate = {
      actionId: "install-agenda-new-remote",
      actionType: "install_card",
      semanticActionType: "install.card",
      sourceKind: "card",
      sourceCardInstanceId: "agenda-in-hq",
      targetIds: ["new_remote"],
    } as unknown as ActionSemanticCandidate;
    const domain = {
      ...emptyDomain(),
      scoreProjects: [
        {
          projectId: "prepared-but-unfunded",
          agendaPoints: 2,
          agendaInstanceId: "agenda-in-hq",
          serverId: "remote_1",
          phase: "install_agenda" as const,
          sameTurnCloseout: false,
          terminalScore: false,
          feasible: false,
          evidenceCode: "prepared_parent_rez_resource_unavailable",
        },
        {
          projectId: "feasible-sibling",
          agendaPoints: 2,
          agendaInstanceId: "agenda-in-hq",
          serverId: "new_remote",
          actionIds: [candidate.actionId],
          phase: "install_agenda" as const,
          sameTurnCloseout: false,
          terminalScore: false,
          feasible: true,
          evidenceCode: "new_remote_score_route_feasible",
        },
      ],
    };
    const facts = {
      ...contributorFacts(),
      candidateIsVisibleCorpAgendaInstall: vi.fn(() => true),
      candidateTargetIds: vi.fn(() => ["new_remote"]),
    };

    expect(
      collectCorpActionDispositions(input(), [candidate], domain, facts),
    ).toEqual([
      {
        actionId: candidate.actionId,
        disposition: "explicitly_nonproductive",
        ownerModuleId: "corp.hand_and_agenda_management",
        evidenceCode: "corp_card_action_has_no_exact_parent_need",
      },
    ]);
  });

  it("disposes an exact tag-source action with no visible payoff without requiring a quote", () => {
    const candidate = {
      actionId: "trace-tag-source",
      actionType: "activated_card_ability",
      semanticActionType: "card_ability.activate",
      sourceKind: "card",
      sourceDefinitionId: "trace-tag-source",
      functionalEffects: [
        {
          kind: "tag_source",
          scope: "runner",
          timing: "trace_success",
          target: "runner",
          amount: 1,
          finite: false,
        },
      ],
    } as unknown as ActionSemanticCandidate;
    const facts = {
      ...contributorFacts(),
      corpDefinitionSupportsPunishPlan: vi.fn(() => true),
      corpConditionalPunishTagSourceHasNoVisiblePayoff: vi.fn(() => true),
    };

    expect(
      collectCorpActionDispositions(input(), [candidate], emptyDomain(), facts),
    ).toEqual([
      {
        actionId: "trace-tag-source",
        disposition: "explicitly_nonproductive",
        ownerModuleId: "corp.execute_punish_sequence",
        evidenceCode:
          "corp_conditional_punish_tag_source_has_no_visible_payoff",
      },
    ]);
  });

  it("keeps an exact tag-source action quote-bound when a visible payoff exists", () => {
    const candidate = {
      actionId: "trace-tag-source",
      actionType: "activated_card_ability",
      semanticActionType: "card_ability.activate",
      sourceKind: "card",
      sourceDefinitionId: "trace-tag-source",
    } as unknown as ActionSemanticCandidate;
    const facts = {
      ...contributorFacts(),
      corpDefinitionSupportsPunishPlan: vi.fn(() => true),
      corpConditionalPunishTagSourceHasNoVisiblePayoff: vi.fn(() => false),
      corpPunishQuoteRequestExists: vi.fn(() => true),
    };

    expect(
      collectCorpActionDispositions(input(), [candidate], emptyDomain(), facts),
    ).toEqual([
      {
        actionId: "trace-tag-source",
        disposition: "assessment_unknown",
        ownerModuleId: "corp.execute_punish_sequence",
        evidenceCode: "corp_conditional_punish_action_quote_unknown",
      },
    ]);
  });

  it("disposes a punish action when no engine quote request can be formed", () => {
    const candidate = {
      actionId: "trace-tag-source",
      actionType: "play_operation",
      semanticActionType: "play.corp_operation",
      sourceKind: "card",
      sourceDefinitionId: "trace-tag-source",
    } as unknown as ActionSemanticCandidate;
    const facts = {
      ...contributorFacts(),
      corpDefinitionSupportsPunishPlan: vi.fn(() => true),
      corpConditionalPunishTagSourceHasNoVisiblePayoff: vi.fn(() => false),
      corpPunishQuoteRequestExists: vi.fn(() => false),
    };

    expect(
      collectCorpActionDispositions(input(), [candidate], emptyDomain(), facts),
    ).toEqual([
      {
        actionId: "trace-tag-source",
        disposition: "explicitly_nonproductive",
        ownerModuleId: "corp.execute_punish_sequence",
        evidenceCode:
          "corp_conditional_punish_action_has_no_engine_quote_request",
      },
    ]);
  });

  it("keeps an unsafe-horizon draw only on its exact terminal score parent", () => {
    const current = input();
    current.playerView.own.stackOrRdCount = 3;
    const candidate = {
      actionId: "terminal-night-shift",
      actionType: "play_operation",
      semanticActionType: "economy.gain_credit",
      sourceKind: "card",
      economyProjection: { cardsDrawn: 1 },
    } as unknown as ActionSemanticCandidate;
    const projectId = "terminal-score-project";
    const parentPlanInstanceId = planInstanceIdForProposal({
      moduleId: "corp.score_agenda",
      dedupeKey: projectId,
    });
    const domain = {
      ...emptyDomain(),
      scoreProjects: [
        {
          projectId,
          agendaPoints: 1,
          phase: "advance_agenda",
          sameTurnCloseout: true,
          terminalScore: false,
          feasible: true,
          evidenceCode: "exact-terminal-score",
        },
      ],
      economyNeeds: [
        {
          kind: "parent_funding",
          needId: "terminal-score-funding",
          gap: 1,
          actionIds: [candidate.actionId],
          parentPlanInstanceId,
          urgentForScore: true,
          evidenceCode: "exact-terminal-score",
        },
      ],
    } as CorpPlanDomain;
    const facts = {
      ...contributorFacts(),
      corpOpenEconomyPlanOwnsAction: vi.fn(() => true),
    };

    expect(
      collectCorpActionDispositions(current, [candidate], domain, facts),
    ).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: candidate.actionId,
          evidenceCode: expect.stringContaining(
            "corp_voluntary_draw_blocked_deckout_horizon",
          ),
        }),
      ]),
    );
  });
});

function input(): AiDecisionInput {
  return {
    side: "corp",
    legalActions: [],
    playerView: {
      stateVersion: 12,
      timingPoint: "action",
      own: {
        credits: 0,
        clicks: 1,
        gripOrHq: [],
        maxHandSize: 5,
      },
      servers: [],
    },
  } as unknown as AiDecisionInput;
}

function emptyDomain(): CorpPlanDomain {
  return {
    scoreProjects: [],
    remoteProjects: [],
    defenseNeeds: [],
    economyNeeds: [],
    virusPressure: [],
    punishCampaigns: [],
    ambushes: [],
    handManagement: [],
  };
}

function contributorFacts(): CorpActionDispositionContributorFacts {
  const no = vi.fn(() => false);
  const none = vi.fn(() => undefined);
  return {
    turnKey: vi.fn(() => "corp:12"),
    candidateTargetIds: vi.fn(() => []),
    candidateIsVisibleCorpIceInstall: no,
    candidateIsVisibleCorpAgendaInstall: no,
    isCorpInstallServerId: no,
    corpCandidateIsImmediateRootRezEconomySource: no,
    corpCandidateIsScoreAccelerationSupport: no,
    corpCandidateProjectsCardDraw: no,
    corpConditionalRezSupportWithoutCurrentRouteEvidence: none,
    corpDefenseSignalOwnsAction: no,
    corpDefenseMaterializedActionIds: vi.fn(() => new Set<string>()),
    corpDefensiveUpgradePlacement: none,
    corpDefinitionSupportsPunishPlan: no,
    corpConditionalPunishTagSourceHasNoVisiblePayoff: no,
    corpPunishQuoteRequestExists: no,
    corpDrawCandidatePreservesHandCapacity: no,
    corpEmptyRdDrawOperationDispositionEvidence: none,
    corpExactExecutableNonEconomyPlanOwnsAction: no,
    corpExactOverflowHandConversionPlanOwnsCandidate: no,
    corpHqOverflowReservedScoreServerDispositionEvidence: none,
    corpHandSignalMatchesCandidate: no,
    corpOpenEconomyPlanOwnsAction: no,
    corpRemoteCreationLockRemovalAction: none,
    corpRunDefenseAbilityAssessment: none,
    corpScoreProjectAssessmentIsUnknown: no,
    corpScoreProjectId: vi.fn(() => "unbound"),
    corpScoredAgendaRevealWithoutPurposeDispositionEvidence: none,
    visibleKnownCardType: none,
    defenseDomainSignalFacts: {
      hasExactNonNegativeCostProfile: no,
      archivesHasVisibleKnownAgenda: no,
    },
  };
}
