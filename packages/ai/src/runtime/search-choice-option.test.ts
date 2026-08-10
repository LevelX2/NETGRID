import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  isSearchChoice,
  selectedSearchChoiceOptionIds,
} from "./search-choice-option";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;

describe("selectedSearchChoiceOptionIds", () => {
  it("matches search choices by bounded source tokens", () => {
    expect(isSearchChoice(sourceOnlyChoice("stack search"))).toBe(true);
    expect(isSearchChoice(sourceOnlyChoice("searchlight stackish"))).toBe(
      false,
    );
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
        hasInstalledNonNoisyIcebreaker: false,
        rigRoles: new Set(),
        rigDefinitionIds: new Set(),
      },
      effectsForCardId: () => [],
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
        hasInstalledNonNoisyIcebreaker: false,
        rigRoles: new Set(["breaker_fracter"]),
        rigDefinitionIds: new Set(),
      },
      effectsForCardId: () => [],
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
        hasInstalledNonNoisyIcebreaker: false,
        rigRoles: new Set(["breaker_fracter"]),
        rigDefinitionIds: new Set(),
      },
      effectsForCardId: () => [],
      rolesForCardId: () => [],
      requiredCoverage: "breaker_ap",
    });

    expect(selected).toEqual(["ap-breaker"]);
  });

  it("prefers a new installable support program over breaker copies already in rig and grip", () => {
    const choice = searchChoice(
      [
        option("krash", "Krash", "program", {
          memoryCost: 1,
          installCost: 0,
          subtypes: ["Icebreaker"],
        }),
        option("lockjaw", "Lockjaw", "program", {
          memoryCost: 1,
          installCost: 0,
        }),
      ],
      1,
    );
    const selected = selectedSearchChoiceOptionIds(choice, choice.options, {
      features: {
        credits: 4,
        memoryRemaining: 2,
        hasInstalledNonNoisyIcebreaker: false,
        rigRoles: new Set([
          "breaker_fracter",
          "breaker_decoder",
          "breaker_killer",
        ]),
        rigDefinitionIds: new Set(["krash"]),
        gripDefinitionCounts: new Map([["krash", 1]]),
      },
      effectsForCardId: () => [],
      rolesForCardId: (cardId) =>
        cardId === "krash"
          ? ["breaker_fracter", "breaker_decoder", "breaker_killer"]
          : ["icebreaker_support", "run_support"],
    });

    expect(selected).toEqual(["lockjaw"]);
  });

  it("prefers a fresh support definition over another copy already in grip", () => {
    const choice = searchChoice(
      [
        option("lockjaw", "Lockjaw", "program", {
          memoryCost: 1,
          installCost: 0,
        }),
        option("clown", "Clown", "program", {
          memoryCost: 1,
          installCost: 4,
        }),
      ],
      1,
    );
    const selected = selectedSearchChoiceOptionIds(choice, choice.options, {
      features: {
        credits: 4,
        memoryRemaining: 2,
        hasInstalledNonNoisyIcebreaker: false,
        rigRoles: new Set(["breaker_universal"]),
        rigDefinitionIds: new Set(["krash"]),
        gripDefinitionCounts: new Map([["lockjaw", 1]]),
      },
      effectsForCardId: () => [],
      rolesForCardId: (cardId) =>
        cardId === "lockjaw"
          ? ["icebreaker_support", "run_support"]
          : ["ice_modifier", "run_support"],
    });

    expect(selected).toEqual(["clown"]);
  });

  it("takes an affordable plan-aligned event before ordering an unusable program", () => {
    const choice = takeOneArrangeRestChoice([
      option("cloak-a", "Cloak", "program", {
        definitionId: "cloak",
        memoryCost: 1,
        installCost: 7,
      }),
      option("wiretaps", "Executive Wiretaps", "event", {
        definitionId: "wiretaps",
        cost: 2,
        playCost: { kind: "fixed", credits: 2 },
      }),
      option("mouse", "Mouse", "program", {
        definitionId: "mouse",
        memoryCost: 1,
        installCost: 2,
      }),
    ]);
    const selected = selectedSearchChoiceOptionIds(choice, choice.options, {
      features: {
        credits: 3,
        memoryRemaining: 0,
        hasInstalledNonNoisyIcebreaker: false,
        rigRoles: new Set(),
        rigDefinitionIds: new Set(),
      },
      effectsForCardId: () => [],
      rolesForCardId: (cardId) => {
        if (cardId === "cloak") return ["icebreaker_support"];
        if (cardId === "wiretaps") return ["multiaccess", "pressure_hq"];
        return ["hidden_zone_tool"];
      },
      preferredServerId: "hq",
    });

    expect(selected).toBeDefined();
    if (!selected) throw new Error("expected a stack-search selection");
    expect(selected[0]).toBe("wiretaps");
  });

  it("keeps a funded Cloak first and devalues its duplicate in the rest order", () => {
    const choice = takeOneArrangeRestChoice([
      option("cloak-a", "Cloak A", "program", {
        definitionId: "cloak",
        memoryCost: 1,
        installCost: 7,
      }),
      option("cloak-b", "Cloak B", "program", {
        definitionId: "cloak",
        memoryCost: 1,
        installCost: 7,
      }),
      option("wiretaps", "Executive Wiretaps", "event", {
        definitionId: "wiretaps",
        cost: 2,
        playCost: { kind: "fixed", credits: 2 },
      }),
      option("mouse", "Mouse", "program", {
        definitionId: "mouse",
        memoryCost: 1,
        installCost: 2,
      }),
    ]);
    const selected = selectedSearchChoiceOptionIds(choice, choice.options, {
      features: {
        credits: 8,
        memoryRemaining: 1,
        hasInstalledNonNoisyIcebreaker: true,
        rigRoles: new Set(),
        rigDefinitionIds: new Set(),
      },
      effectsForCardId: (cardId) =>
        cardId === "cloak"
          ? [
              {
                kind: "recurring_economy",
                scope: "runner",
                timing: "persistent",
                resource: "credits",
                target: "non_noisy_icebreaker",
                amount: 3,
                economyMode: "restricted_credit",
                repeatable: true,
              },
            ]
          : [],
      rolesForCardId: (cardId) => {
        if (cardId === "cloak") return ["economy", "icebreaker_support"];
        if (cardId === "wiretaps") return ["multiaccess", "pressure_hq"];
        return ["hidden_zone_tool"];
      },
      preferredServerId: "hq",
    });

    expect(selected).toBeDefined();
    if (!selected) throw new Error("expected a stack-search selection");
    expect(selected[0]).toBe("cloak-a");
    expect(selected.indexOf("cloak-b")).toBeGreaterThan(
      selected.indexOf("mouse"),
    );
  });

  it.each([
    {
      label: "only a noisy breaker can consume the restricted credits",
      credits: 8,
      memoryRemaining: 1,
      hasInstalledNonNoisyIcebreaker: false,
    },
    {
      label: "the recurring-credit program is not immediately usable",
      credits: 6,
      memoryRemaining: 1,
      hasInstalledNonNoisyIcebreaker: true,
    },
  ])("keeps Mouse ahead when $label", (scenario) => {
    const choice = takeOneArrangeRestChoice([
      option("cloak", "Cloak", "program", {
        memoryCost: 1,
        installCost: 7,
      }),
      option("mouse", "Mouse", "program", {
        memoryCost: 1,
        installCost: 2,
      }),
    ]);
    const selected = selectedSearchChoiceOptionIds(choice, choice.options, {
      features: {
        credits: scenario.credits,
        memoryRemaining: scenario.memoryRemaining,
        hasInstalledNonNoisyIcebreaker:
          scenario.hasInstalledNonNoisyIcebreaker,
        rigRoles: new Set(),
        rigDefinitionIds: new Set(),
      },
      effectsForCardId: (cardId) =>
        cardId === "cloak"
          ? [
              {
                kind: "recurring_economy",
                scope: "runner",
                timing: "persistent",
                resource: "credits",
                target: "non_noisy_icebreaker",
                amount: 3,
                economyMode: "restricted_credit",
                repeatable: true,
              },
            ]
          : [],
      rolesForCardId: (cardId) =>
        cardId === "cloak" ? ["icebreaker_support"] : ["hidden_zone_tool"],
    });

    expect(selected?.[0]).toBe("mouse");
  });

  it("fails closed for a search-result event with missing play cost", () => {
    const choice = searchChoice(
      [
        option("modeled", "Modeled event", "event", {
          playCost: { kind: "fixed", credits: 1 },
        }),
        option("unmodeled", "Unmodeled event", "event", {
          playCost: undefined,
        }),
      ],
      1,
    );
    expect(() =>
      selectedSearchChoiceOptionIds(choice, choice.options, {
        features: {
          credits: 1,
          memoryRemaining: 4,
          hasInstalledNonNoisyIcebreaker: false,
          rigRoles: new Set(),
          rigDefinitionIds: new Set(),
        },
        effectsForCardId: () => [],
        rolesForCardId: () => [],
      }),
    ).toThrow(
      "Invalid visible play-cost projection for a known event or operation search option.",
    );
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

function takeOneArrangeRestChoice(
  options: PendingChoice["options"],
): PendingChoice {
  const { cardSearchPresentation, stackSearchResolution, ...choice } =
    searchChoice(options, options.length);
  void cardSearchPresentation;
  void stackSearchResolution;
  return {
    ...choice,
    source: "p3_37.runner_stack_top5_choose_one_arrange_rest:test:1",
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
      ...(type === "event" || type === "operation"
        ? { playCost: { kind: "fixed", credits: 0 } }
        : {}),
      ...cardOverrides,
    },
  } as unknown as PendingChoice["options"][number];
}
