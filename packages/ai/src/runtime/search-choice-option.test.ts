import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  isSearchChoice,
  selectedSearchChoiceOptionIds,
} from "./search-choice-option";

type PendingChoice = NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>;

describe("selectedSearchChoiceOptionIds", () => {
  it("matches search choices by bounded source tokens", () => {
    expect(isSearchChoice(sourceOnlyChoice("stack search"))).toBe(true);
    expect(isSearchChoice(sourceOnlyChoice("searchlight stackish"))).toBe(false);
  });

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

  it("prioritizes a direct required-coverage answer over generic programs", () => {
    const choice = searchChoice(
      [
        option("generic", "Generic program", "program"),
        option("memory", "Memory chip", "program", { memoryLimitBonus: 1 }),
        option("ap-breaker", "AP Breaker", "program", {
          subtypes: ["Icebreaker", "AP"],
        }),
      ],
      1,
    );
    const selected = selectedSearchChoiceOptionIds(choice, choice.options, {
      features: {
        credits: 5,
        memoryRemaining: 3,
        rigRoles: new Set(["breaker_fracter"]),
        rigDefinitionIds: new Set(),
      },
      rolesForCardId: () => [],
      requiredCoverage: "breaker_ap",
    });

    expect(selected).toEqual(["ap-breaker"]);
  });
});

function searchChoice(
  options: PendingChoice["options"],
  maxSelections = 2,
): PendingChoice {
  return {
    id: "search-choice",
    source: "stack search",
    minSelections: maxSelections,
    maxSelections,
    options,
    cardSearchPresentation: {
      destination: "grip",
    },
  } as unknown as PendingChoice;
}

function sourceOnlyChoice(source: string): PendingChoice {
  const { cardSearchPresentation, stackSearchResolution, ...choice } =
    searchChoice([]);
  void cardSearchPresentation;
  void stackSearchResolution;
  return {
    ...choice,
    source,
  } as PendingChoice;
}

function option(
  id: string,
  label: string,
  type: string = "event",
  cardOverrides: Record<string, unknown> = {},
): PendingChoice["options"][number] {
  return {
    id,
    label,
    card: {
      definitionId: id,
      title: label,
      type,
      known: true,
      ...cardOverrides,
    },
  } as unknown as PendingChoice["options"][number];
}
