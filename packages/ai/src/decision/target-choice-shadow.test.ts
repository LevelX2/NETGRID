import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
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
  choiceRequirements?: LegalAction["choiceRequirements"];
  targetRequirements?: LegalAction["targetRequirements"];
}): LegalAction {
  return {
    actionId: "resolve-choice",
    side: "runner",
    type: "resolve_choice",
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
