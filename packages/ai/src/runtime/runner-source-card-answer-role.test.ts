import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import { runnerSourceCardAnswerRole } from "./runner-source-card-answer-role";

describe("runnerSourceCardAnswerRole", () => {
  it("uses source metadata and roles but ignores label-only answer text", () => {
    const labelOnly = action({
      actionId: "label-only-search",
      label: "Search your stack for a program",
    });
    const roleBacked = action({
      actionId: "role-backed-search",
      label: "Use ability",
      payload: { sourceDefinitionId: "search-source" },
    });
    const definitionBacked = action({
      actionId: "definition-backed-draw",
      label: "Use ability",
      payload: { sourceDefinitionId: "draw-source" },
    });

    expect(runnerSourceCardAnswerRole(input(), labelOnly, dependencies())).toBeUndefined();
    expect(runnerSourceCardAnswerRole(input(), roleBacked, dependencies())).toBe(
      "search",
    );
    expect(
      runnerSourceCardAnswerRole(input(), definitionBacked, dependencies()),
    ).toBe("draw");
  });

  it("ignores substring-only source roles and mechanics", () => {
    const roleNoise = action({
      actionId: "role-noise",
      label: "Use ability",
      payload: { sourceDefinitionId: "role-noise-source" },
    });
    const mechanicNoise = action({
      actionId: "mechanic-noise",
      label: "Use ability",
      payload: { sourceDefinitionId: "mechanic-noise-source" },
    });

    expect(runnerSourceCardAnswerRole(input(), roleNoise, dependencies()))
      .toBeUndefined();
    expect(runnerSourceCardAnswerRole(input(), mechanicNoise, dependencies()))
      .toBeUndefined();
  });
});

function dependencies() {
  return {
    visibleSourceCard: () => undefined,
    sourceDefinitionId: (_input: AiDecisionInput, action: LegalAction) =>
      typeof action.payload?.sourceDefinitionId === "string"
        ? action.payload.sourceDefinitionId
        : undefined,
    rolesForCardId: (definitionId: string | undefined) =>
      definitionId === "search-source"
        ? ["program_search"]
        : definitionId === "role-noise-source"
          ? ["research_noise"]
          : [],
    sourceDefinition: (definitionId: string | undefined) =>
      definitionId === "draw-source"
        ? { mechanics: ["draw_card"] }
        : definitionId === "mechanic-noise-source"
          ? { mechanics: ["withdraw_card"] }
        : undefined,
  };
}

function input(): AiDecisionInput {
  return {
    side: "runner",
    legalActions: [],
    playerView: {
      side: "runner",
    },
  } as unknown as AiDecisionInput;
}

function action(overrides: Partial<LegalAction>): LegalAction {
  return {
    actionId: "action",
    side: "runner",
    type: "trigger_ability",
    label: "Use ability",
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    ...overrides,
  };
}
