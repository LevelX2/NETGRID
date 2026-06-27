import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  buildTargetChoiceShadowReport,
  type TargetChoiceShadowReport,
} from "../decision/target-choice-shadow";
import { containsForbiddenSemanticMarker } from "../diagnostics/semantic-redaction";
import { buildTargetChoiceSelectedChoicesReadinessReport } from "./target-choice-shadow-readiness";

describe("TargetChoice selectedChoices readiness", () => {
  it("classifies target-choice reports without creating selections", () => {
    const ready = buildTargetChoiceShadowReport({
      action: action({
        actionId: "choice",
        choiceRequirements: [
          {
            choiceId: "choice",
            minSelections: 1,
            maxSelections: 1,
            optionIds: ["low", "high"],
          },
        ],
      }),
      preferredOptionIds: ["high"],
    });
    const shadowOnly = buildTargetChoiceShadowReport({
      action: action({
        actionId: "target",
        targetRequirements: [
          {
            id: "server",
            kind: "server",
            visibility: "known_to_actor",
            allowedServers: ["hq", "rd"],
          },
        ],
      }),
    });
    const blocked = buildTargetChoiceShadowReport({
      action: action({
        actionId: "engine-only",
        targetRequirements: [
          {
            id: "secret",
            kind: "card",
            visibility: "engine_only",
          },
        ],
      }),
    });

    const report = buildTargetChoiceSelectedChoicesReadinessReport([
      { scenarioId: "s1", reports: [ready, shadowOnly, blocked] },
    ]);

    expect(report).toMatchObject({
      version: "target-choice-selectedchoices-readiness-v1",
      scope: "target_choice_selectedchoices_readiness_report_only",
      scenarioCount: 1,
      actionReportCount: 3,
      targetFitRecommendationCount: 1,
      productiveUseAllowed: false,
      selectedChoicesCreated: false,
      selectedTargetsCreated: false,
      runtimeConsumerStatus: "none",
      noRuntimeEffect: true,
    });
    expect(report.categoryCounts.ready_for_local_dry_run).toBe(1);
    expect(report.categoryCounts.ready_for_shadow_only).toBe(1);
    expect(report.categoryCounts.blocked_engine_only).toBe(1);
    expect(report.cases).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: "choice",
          targetFitRecommendationReady: true,
          targetFitRecommendationOptionId: "high",
          evidence: expect.arrayContaining([
            "target_fit_recommendation_ready:true",
          ]),
        }),
      ]),
    );
    expect(report.evidence).toEqual(
      expect.arrayContaining(["target_fit_recommendation_count:1"]),
    );
    expect(containsForbiddenSemanticMarker(report)).toBe(false);
  });

  it("emits concrete followup candidates for unclear target-choice dry-runs", () => {
    const tie = buildTargetChoiceShadowReport({
      action: action({
        actionId: "tie",
        targetRequirements: [
          {
            id: "server",
            kind: "server",
            visibility: "known_to_actor",
            allowedServers: ["hq", "rd"],
          },
        ],
      }),
    });
    const missingSideSafeOptions = buildTargetChoiceShadowReport({
      action: action({
        actionId: "missing-side-safe",
        targetRequirements: [
          {
            id: "server",
            kind: "server",
            visibility: "known_to_actor",
          },
        ],
      }),
    });
    const engineOnly = buildTargetChoiceShadowReport({
      action: action({
        actionId: "engine-only",
        targetRequirements: [
          {
            id: "secret",
            kind: "card",
            visibility: "engine_only",
          },
        ],
      }),
    });
    const hiddenInfoBlocked: TargetChoiceShadowReport = {
      ...missingSideSafeOptions,
      actionId: "hidden-info",
      blockedRequirements: [
        {
          requirementId: "server",
          kind: "server",
          reason: "no_side_safe_options",
          evidence: ["hidden_info_blocked"],
        },
      ],
      scorecard: {
        ...missingSideSafeOptions.scorecard,
        noSideSafeOptionsBlockedCount: 0,
        blockedRequirementCount: 1,
      },
    };
    const scorecardUnclear = buildTargetChoiceShadowReport({
      action: action({ actionId: "unclear" }),
    });

    const report = buildTargetChoiceSelectedChoicesReadinessReport([
      {
        scenarioId: "followups",
        reports: [
          tie,
          missingSideSafeOptions,
          engineOnly,
          hiddenInfoBlocked,
          scorecardUnclear,
        ],
      },
    ]);

    expect(report.followupCandidates.map((candidate) => candidate.kind)).toEqual([
      "engine_only_target",
      "hidden_info_blocked",
      "missing_side_safe_options",
      "tie_without_preference",
      "scorecard_unclear",
    ]);
    expect(report.evidence).toEqual(
      expect.arrayContaining(["followup_candidate_count:5"]),
    );
    expect(report.followupCandidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          candidateId: "followups:tie:tie_without_preference",
          evidence: expect.arrayContaining([
            "target_choice_followup:tie_without_preference",
            "productive_use_allowed:false",
          ]),
        }),
      ]),
    );
    expect(containsForbiddenSemanticMarker(report)).toBe(false);
  });
});

function action(options: {
  actionId: string;
  targetRequirements?: LegalAction["targetRequirements"];
  choiceRequirements?: LegalAction["choiceRequirements"];
}): LegalAction {
  return {
    actionId: options.actionId,
    side: "runner",
    type: options.choiceRequirements ? "resolve_choice" : "start_run",
    label: options.actionId,
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
