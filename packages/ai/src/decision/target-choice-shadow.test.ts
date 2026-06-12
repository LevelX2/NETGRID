import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { containsForbiddenSemanticMarker } from "../diagnostics/semantic-redaction";
import {
  TARGET_CHOICE_SHADOW_SCHEMA_VERSION,
  buildTargetChoiceShadowReport,
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
    });
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.runtimeConsumerStatus).toBe("none");
    expect(report.noRuntimeEffect).toBe(true);
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
    expect(report.selectionOutput).toEqual({
      selectedChoicesCreated: false,
      selectedTargetsCreated: false,
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
  });
});

function action(options: {
  actionId?: string;
  side?: LegalAction["side"];
  type?: LegalAction["type"];
  choiceRequirements?: LegalAction["choiceRequirements"];
  targetRequirements?: LegalAction["targetRequirements"];
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
