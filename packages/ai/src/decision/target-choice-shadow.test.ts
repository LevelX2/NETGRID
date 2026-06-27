import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { containsForbiddenSemanticMarker } from "../diagnostics/semantic-redaction";
import {
  TARGET_CHOICE_SHADOW_SCHEMA_VERSION,
  buildTargetChoiceShadowReport,
  targetChoiceRecommendationForTargetFit,
  targetChoiceWouldSelectForAccessDecisionProjection,
} from "./target-choice-shadow";

describe("TargetChoiceShadow", () => {
  it("ranks legal choice options without creating selectedChoices", () => {
    const report = buildTargetChoiceShadowReport({
      action: action({
        choiceRequirements: [
          {
            choiceId: "discard_choice",
            minSelections: 1,
            maxSelections: 1,
            optionIds: ["draw", "gain", "run"],
          },
        ],
      }),
      preferredOptionIds: ["gain"],
      avoidOptionIds: ["run"],
    });

    expect(report.schemaVersion).toBe(TARGET_CHOICE_SHADOW_SCHEMA_VERSION);
    expect(report.rankedOptions.map((option) => option.optionId)).toEqual([
      "gain",
      "draw",
      "run",
    ]);
    expect(report.selectionOutput).toEqual({
      selectedChoicesCreated: false,
      selectedTargetsCreated: false,
      wouldSelect: {
        requirementId: "discard_choice",
        optionId: "gain",
        confidence: "medium",
        evidence: expect.arrayContaining([
          "target_choice_would_select:dry_run",
          "option_kind:choice_option",
        ]),
      },
    });
    expect(targetChoiceWouldSelectForAccessDecisionProjection(report)).toEqual(
      expect.objectContaining({
        requirementId: "discard_choice",
        optionId: "gain",
        confidence: "medium",
        selectedChoicesCreated: false,
        selectedTargetsCreated: false,
        evidence: expect.arrayContaining([
          "target_choice_access_decision_projection:dry_run",
          "target_choice_would_select:dry_run",
        ]),
      }),
    );
    expect(targetChoiceRecommendationForTargetFit(report)).toEqual(
      expect.objectContaining({
        scope: "target_choice_target_fit_recommendation",
        actionId: "resolve-choice",
        requirementId: "discard_choice",
        optionId: "gain",
        confidence: "medium",
        productiveUseAllowed: true,
        runtimeConsumerStatus: "target_fit_only",
        noRuntimeEffect: true,
        selectedChoicesCreated: false,
        selectedTargetsCreated: false,
        evidence: expect.arrayContaining([
          "target_choice_target_fit:productive_recommendation",
          "target_choice_target_fit_selected_choices_created:false",
          "target_choice_target_fit_selected_targets_created:false",
        ]),
      }),
    );
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.runtimeConsumerStatus).toBe("none");
    expect(report.noRuntimeEffect).toBe(true);
    expect(report.scorecard).toMatchObject({
      version: "target-choice-shadow-scorecard-v2",
      coverageStatus: "covered",
      optionCount: 3,
      choiceOptionCount: 3,
      targetOptionCount: 0,
      blockedRequirementCount: 0,
      productiveUseAllowed: false,
      noRuntimeEffect: true,
    });
    expect(report.scorecard.topOption).toEqual({
      requirementId: "discard_choice",
      optionId: "gain",
      kind: "choice_option",
      score: 124,
    });
    expect(report.evidence).toEqual(
      expect.arrayContaining([
        "scorecard_version:target-choice-shadow-scorecard-v2",
        "scorecard_coverage_status:covered",
      ]),
    );
  });

  it("ranks side-safe server target options deterministically", () => {
    const report = buildTargetChoiceShadowReport({
      action: action({
        targetRequirements: [
          {
            id: "server",
            kind: "server",
            visibility: "known_to_actor",
            allowedServers: ["remote_1", "rd", "hq"],
          },
        ],
      }),
      preferredOptionIds: ["rd"],
    });

    expect(report.rankedOptions.map((option) => option.optionId)).toEqual([
      "rd",
      "hq",
      "remote_1",
    ]);
    expect(report.blockedRequirements).toEqual([]);
  });

  it("ranks real Engine payload server targets as report-only options", () => {
    const report = buildTargetChoiceShadowReport({
      action: action({
        actionId: "runner.start_run.remote_1",
        type: "start_run",
        payload: { serverId: "remote_1" },
      }),
    });

    expect(report.rankedOptions).toEqual([
      expect.objectContaining({
        requirementId: "payload.serverId",
        optionId: "remote_1",
        kind: "target_option",
      }),
    ]);
    expect(report.rankedOptions[0]?.evidence).toEqual(
      expect.arrayContaining([
        "target_option_source:legal_action_payload",
        "target_payload_key:serverId",
      ]),
    );
    expect(report.selectionOutput).toEqual({
      selectedChoicesCreated: false,
      selectedTargetsCreated: false,
    });
    expect(report.scorecard).toMatchObject({
      coverageStatus: "covered",
      contextSignalCounts: {
        contextScoredOptions: 0,
        preferredOptions: 0,
        avoidedOptions: 0,
        utilityLinkedOptions: 0,
        opportunityLinkedOptions: 0,
        threatLinkedOptions: 0,
      },
    });
  });

  it("ranks real Engine payload card targets when the card id is side-safe", () => {
    const report = buildTargetChoiceShadowReport({
      action: action({
        actionId: "corp.score_agenda.remote_1_agenda",
        side: "corp",
        type: "score_agenda",
        payload: { cardId: "remote_1_agenda" },
      }),
      utilityFamilies: ["corp_scoreline"],
    });

    expect(report.rankedOptions).toEqual([
      expect.objectContaining({
        requirementId: "payload.cardId",
        optionId: "remote_1_agenda",
        kind: "target_option",
      }),
    ]);
    expect(report.rankedOptions[0]?.evidence).toEqual(
      expect.arrayContaining([
        "target_requirement_kind:card",
        "target_payload_key:cardId",
        "utility_family:corp_scoreline",
      ]),
    );
  });

  it("blocks empty choice requirements without fabricating options", () => {
    const report = buildTargetChoiceShadowReport({
      action: action({
        choiceRequirements: [
          {
            choiceId: "empty-choice",
            minSelections: 1,
            maxSelections: 1,
            optionIds: [],
          },
        ],
      }),
    });

    expect(report.rankedOptions).toEqual([]);
    expect(report.blockedRequirements).toEqual([
      expect.objectContaining({
        requirementId: "empty-choice",
        kind: "choice",
        reason: "no_side_safe_options",
      }),
    ]);
  });

  it("raises remote targets when remote-contest utility and opportunity align", () => {
    const report = buildTargetChoiceShadowReport({
      action: action({
        actionId: "run-server",
        type: "start_run",
        targetRequirements: [
          {
            id: "server",
            kind: "server",
            visibility: "known_to_actor",
            allowedServers: ["hq", "remote_1"],
          },
        ],
      }),
      utilityFamilies: ["remote_contest"],
      opportunities: [
        {
          opportunity: "remote_contest_window",
          priority: "critical",
          side: "runner",
          targetId: "remote_1",
          evidence: ["test:remote_score_threat"],
        },
      ],
    });

    expect(report.rankedOptions.map((option) => option.optionId)).toEqual([
      "remote_1",
      "hq",
    ]);
    expect(report.rankedOptions[0]?.evidence).toEqual(
      expect.arrayContaining([
        "utility_family:remote_contest",
        "opportunity:remote_contest_window",
      ]),
    );
    expect(report.selectionOutput).toMatchObject({
      selectedChoicesCreated: false,
      selectedTargetsCreated: false,
      wouldSelect: {
        requirementId: "server",
        optionId: "remote_1",
        confidence: "high",
      },
    });
    expect(report.selectionOutput.wouldSelect?.evidence).toEqual(
      expect.arrayContaining([
        "target_choice_would_select:dry_run",
        "option_kind:target_option",
        "opportunity:remote_contest_window",
      ]),
    );
    expect(targetChoiceWouldSelectForAccessDecisionProjection(report)).toEqual(
      expect.objectContaining({
        requirementId: "server",
        optionId: "remote_1",
        selectedChoicesCreated: false,
        selectedTargetsCreated: false,
        evidence: expect.arrayContaining([
          "target_choice_access_decision_projection_selected_choices_created:false",
          "target_choice_access_decision_projection_selected_targets_created:false",
        ]),
      }),
    );
    expect(report.scorecard).toMatchObject({
      coverageStatus: "covered",
      contextSignalCounts: {
        contextScoredOptions: 1,
        preferredOptions: 0,
        avoidedOptions: 0,
        utilityLinkedOptions: 1,
        opportunityLinkedOptions: 1,
        threatLinkedOptions: 0,
      },
    });
  });

  it("raises central access targets with known agenda payoff context", () => {
    const report = buildTargetChoiceShadowReport({
      action: action({
        actionId: "run-server",
        type: "start_run",
        targetRequirements: [
          {
            id: "server",
            kind: "server",
            visibility: "known_to_actor",
            allowedServers: ["rd", "hq", "remote_1"],
          },
        ],
      }),
      utilityFamilies: ["run_access"],
      opportunities: [
        {
          opportunity: "known_agenda_payoff",
          priority: "critical",
          side: "runner",
          targetId: "hq",
          evidence: ["test:known_agenda"],
        },
      ],
    });

    expect(report.rankedOptions.map((option) => option.optionId)).toEqual([
      "hq",
      "rd",
      "remote_1",
    ]);
    expect(report.rankedOptions[0]?.evidence).toEqual(
      expect.arrayContaining([
        "utility_family:run_access",
        "opportunity:known_agenda_payoff",
      ]),
    );
  });

  it("lowers risky or unknown remote targets under survival context", () => {
    const report = buildTargetChoiceShadowReport({
      action: action({
        actionId: "run-server",
        type: "start_run",
        targetRequirements: [
          {
            id: "server",
            kind: "server",
            visibility: "known_to_actor",
            allowedServers: ["remote_1", "hq"],
          },
        ],
      }),
      utilityFamilies: ["survival"],
      threats: [
        {
          threat: "runner_flatline_risk",
          severity: "critical",
          affectedSide: "runner",
          targetId: "remote_1",
          evidence: ["test:damage_risk"],
        },
      ],
    });

    expect(report.rankedOptions.map((option) => option.optionId)).toEqual([
      "hq",
      "remote_1",
    ]);
    expect(report.rankedOptions[1]?.evidence).toEqual(
      expect.arrayContaining([
        "utility_family:survival",
        "threat:runner_flatline_risk",
      ]),
    );
  });

  it("raises scoreline target options for corp score goals", () => {
    const report = buildTargetChoiceShadowReport({
      action: action({
        actionId: "corp-target",
        side: "corp",
        type: "activated_card_ability",
        targetRequirements: [
          {
            id: "target",
            kind: "card",
            side: "corp",
            zoneScope: ["remote"],
            visibility: "known_to_actor",
          },
        ],
      }),
      sideSafeTargetIdsByRequirementId: {
        target: ["remote_2_asset", "remote_1_agenda"],
      },
      utilityFamilies: ["corp_scoreline"],
    });

    expect(report.rankedOptions.map((option) => option.optionId)).toEqual([
      "remote_1_agenda",
      "remote_2_asset",
    ]);
    expect(report.rankedOptions[0]?.evidence).toEqual(
      expect.arrayContaining(["utility_family:corp_scoreline"]),
    );
  });

  it("ranks side-safe target options from semantic candidate target context", () => {
    const report = buildTargetChoiceShadowReport({
      action: action({
        actionId: "run-server",
        type: "start_run",
        targetRequirements: [
          {
            id: "server",
            kind: "server",
            visibility: "known_to_actor",
          },
        ],
      }),
      candidate: semanticCandidate({
        actionId: "run-server",
        selectedTargetIds: ["remote_1"],
        availableTargetIds: ["hq", "rd"],
      }),
    });

    expect(report.rankedOptions.map((option) => option.optionId)).toEqual([
      "hq",
      "rd",
      "remote_1",
    ]);
    expect(report.rankedOptions[0]?.evidence).toEqual(
      expect.arrayContaining([
        "target_option_source:semantic_candidate_target_context",
        "candidate_action_id:run-server",
      ]),
    );
    expect(report.selectionOutput).toEqual({
      selectedChoicesCreated: false,
      selectedTargetsCreated: false,
    });
  });

  it("keeps explicit side-safe target maps ahead of semantic candidate context", () => {
    const report = buildTargetChoiceShadowReport({
      action: action({
        actionId: "run-server",
        type: "start_run",
        targetRequirements: [
          {
            id: "server",
            kind: "server",
            visibility: "known_to_actor",
          },
        ],
      }),
      candidate: semanticCandidate({
        actionId: "run-server",
        selectedTargetIds: ["remote_1"],
      }),
      sideSafeTargetIdsByRequirementId: {
        server: ["rd"],
      },
    });

    expect(report.rankedOptions.map((option) => option.optionId)).toEqual(["rd"]);
    expect(report.rankedOptions[0]?.evidence).toEqual(
      expect.arrayContaining(["target_option_source:explicit_side_safe_map"]),
    );
  });

  it("blocks engine-only targets instead of ranking hidden options", () => {
    const report = buildTargetChoiceShadowReport({
      action: action({
        targetRequirements: [
          {
            id: "secret_target",
            kind: "card",
            visibility: "engine_only",
          },
        ],
      }),
      sideSafeTargetIdsByRequirementId: {
        secret_target: ["should_not_rank"],
      },
    });

    expect(report.rankedOptions).toEqual([]);
    expect(report.blockedRequirements).toEqual([
      expect.objectContaining({
        requirementId: "secret_target",
        reason: "engine_only_target",
      }),
    ]);
    expect(report.scorecard).toMatchObject({
      coverageStatus: "blocked",
      optionCount: 0,
      blockedRequirementCount: 1,
      engineOnlyBlockedCount: 1,
      noSideSafeOptionsBlockedCount: 0,
      topOption: undefined,
    });
    expect(report.selectionOutput.wouldSelect).toBeUndefined();
  });

  it("does not emit wouldSelect for ambiguous top options", () => {
    const report = buildTargetChoiceShadowReport({
      action: action({
        choiceRequirements: [
          {
            choiceId: "ambiguous",
            minSelections: 1,
            maxSelections: 1,
            optionIds: ["left", "right"],
          },
        ],
      }),
    });

    expect(report.selectionOutput).toEqual({
      selectedChoicesCreated: false,
      selectedTargetsCreated: false,
    });
  });

  it("ranks activated card ability legal targets without materializing selected targets", () => {
    const report = buildTargetChoiceShadowReport({
      action: action({
        actionId: "ability-target",
        type: "activated_card_ability",
        targetRequirements: [
          {
            id: "target",
            kind: "card",
            side: "runner",
            zoneScope: ["rig"],
            visibility: "known_to_actor",
          },
        ],
      }),
      sideSafeTargetIdsByRequirementId: {
        target: ["runner-resource", "runner-program"],
      },
      preferredOptionIds: ["runner-program"],
    });

    expect(report.actionType).toBe("activated_card_ability");
    expect(report.rankedOptions.map((option) => option.optionId)).toEqual([
      "runner-program",
      "runner-resource",
    ]);
    expect(report.selectionOutput).toEqual({
      selectedChoicesCreated: false,
      selectedTargetsCreated: false,
    });
  });

  it("covers accessed-card trash and decline contexts as report-only diagnostics", () => {
    const trashReport = buildTargetChoiceShadowReport({
      action: action({
        actionId: "trash-accessed",
        type: "trash_accessed_card",
        targetRequirements: [
          {
            id: "accessed",
            kind: "card",
            side: "corp",
            zoneScope: ["remote"],
            visibility: "known_to_actor",
          },
        ],
      }),
      sideSafeTargetIdsByRequirementId: {
        accessed: ["accessed-card-public-id"],
      },
    });
    const declineReport = buildTargetChoiceShadowReport({
      action: action({
        actionId: "decline-trash",
        type: "decline_trash",
      }),
    });

    expect(trashReport.rankedOptions).toEqual([
      expect.objectContaining({
        requirementId: "accessed",
        optionId: "accessed-card-public-id",
      }),
    ]);
    expect(declineReport.rankedOptions).toEqual([]);
    expect(declineReport.blockedRequirements).toEqual([]);
    expect(declineReport.noRuntimeEffect).toBe(true);
  });

  it("ranks score and advance legal target options deterministically", () => {
    const report = buildTargetChoiceShadowReport({
      action: action({
        actionId: "advance-installed",
        side: "corp",
        type: "advance_card",
        targetRequirements: [
          {
            id: "installed-card",
            kind: "card",
            side: "corp",
            zoneScope: ["remote"],
            visibility: "known_to_actor",
          },
        ],
      }),
      sideSafeTargetIdsByRequirementId: {
        "installed-card": ["remote_2_agenda", "remote_1_agenda"],
      },
    });

    expect(report.rankedOptions.map((option) => option.optionId)).toEqual([
      "remote_1_agenda",
      "remote_2_agenda",
    ]);
  });

  it("redacts forbidden markers from report-only option diagnostics", () => {
    const report = buildTargetChoiceShadowReport({
      action: action({
        choiceRequirements: [
          {
            choiceId: "safe_choice",
            minSelections: 1,
            maxSelections: 1,
            optionIds: ["privatePayload", "safe"],
          },
        ],
      }),
    });

    expect(report.rankedOptions.map((option) => option.optionId)).toContain(
      "[redacted]",
    );
    expect(containsForbiddenSemanticMarker(report)).toBe(false);
    expect(containsForbiddenSemanticMarker(report.scorecard)).toBe(false);
  });
});

function action(options: {
  actionId?: string;
  side?: LegalAction["side"];
  type?: LegalAction["type"];
  choiceRequirements?: LegalAction["choiceRequirements"];
  targetRequirements?: LegalAction["targetRequirements"];
  payload?: LegalAction["payload"];
}): LegalAction {
  return {
    actionId: options.actionId ?? "resolve-choice",
    side: options.side ?? "runner",
    type: options.type ?? "resolve_choice",
    label: "Resolve choice",
    source: "game_rule",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: options.targetRequirements ?? [],
    ...(options.choiceRequirements
      ? { choiceRequirements: options.choiceRequirements }
      : {}),
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
    ...(options.payload ? { payload: options.payload } : {}),
  };
}

function semanticCandidate(params: {
  actionId: string;
  selectedTargetIds?: readonly string[];
  availableTargetIds?: readonly string[];
}): ActionSemanticCandidate {
  return {
    actionId: params.actionId,
    actionType: "start_run",
    actorSide: "runner",
    observerSide: "runner",
    visibilityScope: "actor_private",
    legalActionRef: {
      actionId: params.actionId,
      actionType: "start_run",
      originalPayloadKeys: ["serverId"],
    },
    stateVersion: 1,
    sourceKind: "basic_action",
    abilityBindingMethod: "unresolved",
    semanticActionType: "run.start",
    cardContextSignals: [],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: {
      costKnownStatus: "known",
      additionalCosts: [],
    },
    timingProfile: {},
    targetContext: {
      selectedTargets: (params.selectedTargetIds ?? []).map((targetId) => ({
        targetId,
        targetKind: "server",
        targetSide: "corp",
        visibilityScope: "actor_private",
        evidence: ["test_selected_target"],
      })),
      availableTargets: (params.availableTargetIds ?? []).map((targetId) => ({
        targetId,
        targetKind: "server",
        targetSide: "corp",
        evidence: ["test_available_target"],
      })),
      targetKind: "server",
      targetZones: [],
      targetSide: "corp",
      hiddenInfoPolicy: "side_safe_engine_input_only",
      availableTargetsStatus: "engine_provided",
      targetProfileMatches: [],
      targetConstraintResults: [],
    },
    boardContext: {
      source: "not_projected",
      sideSafe: true,
      notes: ["test"],
    },
    confidence: "high",
    primaryProjectionStatus: "projected",
    projectionIssues: [],
    hardGates: [],
    evidence: ["test_candidate"],
  };
}
