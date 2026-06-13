import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { buildTargetChoiceShadowReport } from "../decision/target-choice-shadow";
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
      productiveUseAllowed: false,
      selectedChoicesCreated: false,
      selectedTargetsCreated: false,
      runtimeConsumerStatus: "none",
      noRuntimeEffect: true,
    });
    expect(report.categoryCounts.ready_for_local_dry_run).toBe(1);
    expect(report.categoryCounts.ready_for_shadow_only).toBe(1);
    expect(report.categoryCounts.blocked_engine_only).toBe(1);
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
