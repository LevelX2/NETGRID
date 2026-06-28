import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { selectedSearchChoiceOptionIds } from "./search-choice-option";

type PendingChoice = NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>;

describe("selectedSearchChoiceOptionIds", () => {
  it("matches search option roles by bounded role terms", () => {
    const choice = searchChoice([
      option("memory", "Memory card"),
      option("economy", "Economy card"),
      option("noise", "Noise card"),
    ]);
    const selected = selectedSearchChoiceOptionIds(choice, choice.options, {
      features: {
        credits: 3,
        memoryRemaining: 1,
        rigRoles: new Set(),
        rigDefinitionIds: new Set(),
      },
      rolesForCardId: (cardId) => {
        if (cardId === "memory") return ["support_memory"];
        if (cardId === "economy") return ["runner_economy"];
        return ["memoryish_noise", "economyish_noise"];
      },
    });

    expect(selected).toEqual(["memory", "economy"]);
  });

  it("matches breaker option and rig roles by bounded role terms", () => {
    const choice = searchChoice([
      option("duplicate", "Duplicate breaker", "program"),
      option("fresh", "Fresh breaker", "program"),
      option("noise", "Noise breaker", "program"),
    ]);
    const selected = selectedSearchChoiceOptionIds(choice, choice.options, {
      features: {
        credits: 5,
        memoryRemaining: 4,
        rigRoles: new Set(["breaker_fracter"]),
        rigDefinitionIds: new Set(),
      },
      rolesForCardId: (cardId) => {
        if (cardId === "duplicate") return ["support_breaker_fracter"];
        if (cardId === "fresh") return ["breaker_decoder"];
        return ["breaker_fracterish_noise"];
      },
    });

    expect(selected).toEqual(["fresh", "duplicate"]);
  });
});

function searchChoice(options: PendingChoice["options"]): PendingChoice {
  return {
    id: "search-choice",
    source: "stack search",
    minSelections: 2,
    maxSelections: 2,
    options,
    cardSearchPresentation: {
      destination: "grip",
    },
  } as unknown as PendingChoice;
}

function option(
  id: string,
  label: string,
  type: string = "event",
): PendingChoice["options"][number] {
  return {
    id,
    label,
    card: {
      definitionId: id,
      title: label,
      type,
      known: true,
    },
  } as unknown as PendingChoice["options"][number];
}
