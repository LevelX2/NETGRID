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
