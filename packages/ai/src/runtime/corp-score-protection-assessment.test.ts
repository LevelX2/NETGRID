import { CARD_DEFINITIONS_BY_ID, type VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  assessCorpScoreProtection,
  compareExactProbabilities,
  type ExactProbability,
} from "./corp-score-protection-assessment";

const QUARTER: ExactProbability = { numerator: 1, denominator: 4 };

describe("assessCorpScoreProtection", () => {
  it("compares exact probabilities without unsafe Number arithmetic", () => {
    expect(
      compareExactProbabilities(
        {
          numerator: Number.MAX_SAFE_INTEGER - 1,
          denominator: Number.MAX_SAFE_INTEGER,
        },
        { numerator: 1, denominator: 1 },
      ),
    ).toBe(-1);
    expect(
      compareExactProbabilities(
        { numerator: 2, denominator: 4 },
        { numerator: 1, denominator: 2 },
      ),
    ).toBe(0);
    expect(
      compareExactProbabilities(
        { numerator: 2, denominator: 1 },
        { numerator: 1, denominator: 1 },
      ),
    ).toBeUndefined();
  });

  it("keeps access at 1 through Pocket VR and Hunter", () => {
    const assessment = assessCorpScoreProtection({
      serverIce: [
        ice("pocket", "onr_v1_260_pocket-virtual-reality"),
        ice("hunter", "onr_v1_249_hunter"),
      ],
      runnerRig: [],
      runnerCredits: 0,
      maximumRunnerAccessSuccessProbability: QUARTER,
    });

    expect(assessment).toMatchObject({
      knowledge: "known",
      runnerAccessSuccessProbability: { numerator: 1, denominator: 1 },
      protectsScore: false,
      requiredRandomBreakSuccesses: 0,
    });
  });

  it.each([
    ["Filter", "onr_v1_244_filter"],
    ["Data Wall 2.0", "onr_v1_238_data-wall-2-0"],
  ])(
    "requires one successful Blink check against %s",
    (_title, definitionId) => {
      const assessment = assessCorpScoreProtection({
        serverIce: [ice("etr", definitionId)],
        runnerRig: [blink()],
        runnerCredits: 0,
        maximumRunnerAccessSuccessProbability: QUARTER,
      });

      expect(assessment).toMatchObject({
        knowledge: "known",
        runnerAccessSuccessProbability: { numerator: 1, denominator: 2 },
        protectsScore: false,
        requiredRandomBreakSuccesses: 1,
        randomBreaks: [
          {
            attempts: 1,
            successProbabilityPerAttempt: {
              numerator: 1,
              denominator: 2,
            },
            combinedSuccessProbability: {
              numerator: 1,
              denominator: 2,
            },
          },
        ],
      });
    },
  );

  it("multiplies two necessary Blink successes to exactly 1/4", () => {
    const assessment = assessCorpScoreProtection({
      serverIce: [
        ice("filter", "onr_v1_244_filter"),
        ice("data-wall", "onr_v1_238_data-wall-2-0"),
      ],
      runnerRig: [blink()],
      runnerCredits: 0,
      maximumRunnerAccessSuccessProbability: QUARTER,
    });

    expect(assessment).toMatchObject({
      knowledge: "known",
      runnerAccessSuccessProbability: { numerator: 1, denominator: 4 },
      protectsScore: true,
      requiredRandomBreakSuccesses: 2,
    });
  });

  it("combines two independent Blink instances against one ETR to exactly 3/4", () => {
    const assessment = assessCorpScoreProtection({
      serverIce: [ice("data-wall", "onr_v1_238_data-wall-2-0")],
      runnerRig: [blink("blink-1"), blink("blink-2")],
      runnerCredits: 0,
      maximumRunnerAccessSuccessProbability: QUARTER,
    });

    expect(assessment).toMatchObject({
      knowledge: "known",
      runnerAccessSuccessProbability: { numerator: 3, denominator: 4 },
      protectsScore: false,
      requiredRandomBreakSuccesses: 1,
      randomBreaks: [
        {
          breakerInstanceId: "blink-1",
          attempts: 1,
          successProbabilityPerAttempt: { numerator: 1, denominator: 2 },
        },
        {
          breakerInstanceId: "blink-2",
          attempts: 1,
          successProbabilityPerAttempt: { numerator: 1, denominator: 2 },
        },
      ],
    });
  });

  it("compounds the combined two-Blink probability across two independent ETRs", () => {
    const assessment = assessCorpScoreProtection({
      serverIce: [
        ice("filter", "onr_v1_244_filter"),
        ice("data-wall", "onr_v1_238_data-wall-2-0"),
      ],
      runnerRig: [blink("blink-1"), blink("blink-2")],
      runnerCredits: 0,
      maximumRunnerAccessSuccessProbability: QUARTER,
    });

    expect(assessment).toMatchObject({
      knowledge: "known",
      runnerAccessSuccessProbability: { numerator: 9, denominator: 16 },
      protectsScore: false,
      requiredRandomBreakSuccesses: 2,
    });
  });

  it("uses a stable free matching breaker instead of Blink", () => {
    const assessment = assessCorpScoreProtection({
      serverIce: [ice("data-wall", "onr_v1_238_data-wall-2-0")],
      runnerRig: [
        blink("blink-1"),
        blink("blink-2"),
        runnerProgram(
          "stable-wall-breaker",
          "onr_v1_037_japanese-water-torture",
        ),
      ],
      runnerCredits: 0,
      maximumRunnerAccessSuccessProbability: QUARTER,
    });

    expect(assessment).toMatchObject({
      knowledge: "known",
      runnerAccessSuccessProbability: { numerator: 1, denominator: 1 },
      protectsScore: false,
      requiredRandomBreakSuccesses: 0,
      randomBreaks: [],
    });
  });

  it("returns access probability 0 for an unbroken ETR barrier", () => {
    const assessment = assessCorpScoreProtection({
      serverIce: [ice("data-wall", "onr_v1_238_data-wall-2-0")],
      runnerRig: [],
      runnerCredits: 0,
      maximumRunnerAccessSuccessProbability: QUARTER,
    });

    expect(assessment).toMatchObject({
      knowledge: "known",
      runnerAccessSuccessProbability: { numerator: 0, denominator: 1 },
      protectsScore: true,
      requiredRandomBreakSuccesses: 0,
    });
  });

  it("projects static hypothetical ICE only with explicit matching facts", () => {
    const definition = CARD_DEFINITIONS_BY_ID["onr_v1_244_filter"]!;
    const assessment = assessCorpScoreProtection({
      serverIce: [
        {
          instanceId: "projected-filter",
          definitionId: "onr_v1_244_filter",
          known: true,
          rezzed: true,
          strength: definition.strength!,
          subtypes: definition.subtypes.slice(),
        },
      ],
      runnerRig: [blink()],
      runnerCredits: 0,
      maximumRunnerAccessSuccessProbability: QUARTER,
    });

    expect(assessment).toMatchObject({
      knowledge: "known",
      runnerAccessSuccessProbability: { numerator: 1, denominator: 2 },
      protectsScore: false,
    });
  });

  it("fails closed instead of filling missing hypothetical ICE facts from the catalog", () => {
    const assessment = assessCorpScoreProtection({
      serverIce: [
        {
          instanceId: "projected-filter",
          definitionId: "onr_v1_244_filter",
          known: true,
          rezzed: true,
        },
      ],
      runnerRig: [blink()],
      runnerCredits: 0,
      maximumRunnerAccessSuccessProbability: QUARTER,
    });

    expect(assessment).toMatchObject({
      knowledge: "unknown",
      protectsScore: false,
      unknownReason: "unknown_rezzed_ice",
    });
  });

  it("uses the parent-provided threshold instead of a hardcoded cutoff", () => {
    const common = {
      serverIce: [ice("filter", "onr_v1_244_filter")],
      runnerRig: [blink()],
      runnerCredits: 0,
    };

    expect(
      assessCorpScoreProtection({
        ...common,
        maximumRunnerAccessSuccessProbability: {
          numerator: 1,
          denominator: 2,
        },
      }),
    ).toMatchObject({ knowledge: "known", protectsScore: true });
    expect(
      assessCorpScoreProtection({
        ...common,
        maximumRunnerAccessSuccessProbability: QUARTER,
      }),
    ).toMatchObject({ knowledge: "known", protectsScore: false });
  });

  it("fails closed for unknown rezzed ICE", () => {
    const assessment = assessCorpScoreProtection({
      serverIce: [
        {
          instanceId: "unknown-ice",
          known: false,
          type: "ice",
          rezzed: true,
          owner: "corp",
        } as VisibleCard,
      ],
      runnerRig: [],
      runnerCredits: 0,
      maximumRunnerAccessSuccessProbability: QUARTER,
    });

    expect(assessment).toMatchObject({
      knowledge: "unknown",
      protectsScore: false,
      unknownReason: "unknown_rezzed_ice",
    });
  });

  it("fails closed for an unknown installed Runner card", () => {
    const assessment = assessCorpScoreProtection({
      serverIce: [ice("data-wall", "onr_v1_238_data-wall-2-0")],
      runnerRig: [
        {
          instanceId: "unknown-program",
          known: false,
          type: "program",
          owner: "runner",
        } as VisibleCard,
      ],
      runnerCredits: 0,
      maximumRunnerAccessSuccessProbability: QUARTER,
    });

    expect(assessment).toMatchObject({
      knowledge: "unknown",
      protectsScore: false,
      unknownReason: "unknown_runner_rig_card",
    });
  });

  it("models two visible independent random breakers instead of treating them as unknown", () => {
    const assessment = assessCorpScoreProtection({
      serverIce: [ice("data-wall", "onr_v1_238_data-wall-2-0")],
      runnerRig: [blink("blink-1"), blink("blink-2")],
      runnerCredits: 0,
      maximumRunnerAccessSuccessProbability: QUARTER,
    });

    expect(assessment).toMatchObject({
      knowledge: "known",
      protectsScore: false,
      runnerAccessSuccessProbability: { numerator: 3, denominator: 4 },
    });
  });

  it("fails closed when multiple stable breakers could split multiple ETR subroutines", () => {
    const assessment = assessCorpScoreProtection({
      serverIce: [ice("endless-corridor", "onr_v1_239_endless-corridor")],
      runnerRig: [
        runnerProgram("decoder-1", "simple_decoder"),
        runnerProgram("decoder-2", "simple_decoder"),
      ],
      runnerCredits: 2,
      maximumRunnerAccessSuccessProbability: QUARTER,
    });

    expect(assessment).toMatchObject({
      knowledge: "unknown",
      protectsScore: false,
      unknownReason: "unsupported_breaker_combination",
    });
  });

  it.each([
    [
      "unknown definition",
      {
        ...blink(),
        definitionId: "missing-definition",
      },
    ],
    [
      "wrong visible type",
      {
        ...blink(),
        type: "resource",
      },
    ],
    [
      "invalid visible strength",
      {
        ...blink(),
        strength: -1,
      },
    ],
    [
      "missing visible breaker strength",
      {
        ...blink(),
        strength: undefined,
      },
    ],
  ])("fails closed for a Runner rig card with %s", (_label, badCard) => {
    const assessment = assessCorpScoreProtection({
      serverIce: [ice("data-wall", "onr_v1_238_data-wall-2-0")],
      runnerRig: [badCard as VisibleCard],
      runnerCredits: 0,
      maximumRunnerAccessSuccessProbability: QUARTER,
    });

    expect(assessment).toMatchObject({
      knowledge: "unknown",
      protectsScore: false,
      unknownReason: "unknown_runner_rig_card",
    });
  });

  it("fails closed for duplicate Runner rig and ICE instance identities", () => {
    expect(
      assessCorpScoreProtection({
        serverIce: [ice("wall", "onr_v1_238_data-wall-2-0")],
        runnerRig: [blink("duplicate"), blink("duplicate")],
        runnerCredits: 0,
        maximumRunnerAccessSuccessProbability: QUARTER,
      }),
    ).toMatchObject({
      knowledge: "unknown",
      unknownReason: "duplicate_runner_rig_instance",
    });
    expect(
      assessCorpScoreProtection({
        serverIce: [
          ice("duplicate", "onr_v1_244_filter"),
          ice("duplicate", "onr_v1_238_data-wall-2-0"),
        ],
        runnerRig: [],
        runnerCredits: 0,
        maximumRunnerAccessSuccessProbability: QUARTER,
      }),
    ).toMatchObject({
      knowledge: "unknown",
      unknownReason: "duplicate_ice_instance",
    });
  });

  it.each([
    [
      "instance",
      {
        iceInstanceId: "other-wall",
      },
    ],
    [
      "definition",
      {
        iceDefinitionId: "onr_v1_244_filter",
      },
    ],
    [
      "break surcharge",
      {
        breakSubroutineAdditionalCostPerSubroutine: -1,
      },
    ],
  ])(
    "fails closed when an effective quote has an invalid %s binding",
    (_label, override) => {
      const card = ice("wall", "onr_v1_238_data-wall-2-0");
      const assessment = assessCorpScoreProtection({
        serverIce: [
          {
            ...card,
            effectiveRunQuote: {
              ...effectiveQuote(card),
              ...override,
            },
          },
        ],
        runnerRig: [blink()],
        runnerCredits: 0,
        maximumRunnerAccessSuccessProbability: QUARTER,
      });

      expect(assessment).toMatchObject({
        knowledge: "unknown",
        protectsScore: false,
        unknownReason: "invalid_effective_run_quote",
      });
    },
  );

  it("uses effective quote strength for break affordability", () => {
    const card = ice("wall", "onr_v1_238_data-wall-2-0");
    const assessment = assessCorpScoreProtection({
      serverIce: [
        {
          ...card,
          effectiveRunQuote: {
            ...effectiveQuote(card),
            effectiveStrength: 3,
          },
        },
      ],
      runnerRig: [
        runnerProgram(
          "stable-wall-breaker",
          "onr_v1_037_japanese-water-torture",
        ),
      ],
      runnerCredits: 0,
      maximumRunnerAccessSuccessProbability: QUARTER,
    });

    expect(assessment).toMatchObject({
      knowledge: "known",
      runnerAccessSuccessProbability: { numerator: 0, denominator: 1 },
      protectsScore: true,
    });
  });

  it("charges the effective per-subroutine break surcharge", () => {
    const card = ice("wall", "onr_v1_238_data-wall-2-0");
    const assessment = assessCorpScoreProtection({
      serverIce: [
        {
          ...card,
          effectiveRunQuote: {
            ...effectiveQuote(card),
            breakSubroutineAdditionalCostPerSubroutine: 1,
          },
        },
      ],
      runnerRig: [
        runnerProgram(
          "stable-wall-breaker",
          "onr_v1_037_japanese-water-torture",
        ),
      ],
      runnerCredits: 0,
      maximumRunnerAccessSuccessProbability: QUARTER,
    });

    expect(assessment).toMatchObject({
      knowledge: "known",
      runnerAccessSuccessProbability: { numerator: 0, denominator: 1 },
      protectsScore: true,
    });
  });

  it("fails closed when visible alternate Runner credit pools can fund breaking", () => {
    const cloakDefinition = CARD_DEFINITIONS_BY_ID["onr_v1_011_cloak"]!;
    const cloak = {
      instanceId: "cloak",
      definitionId: cloakDefinition.id,
      title: cloakDefinition.title,
      type: cloakDefinition.type,
      subtypes: cloakDefinition.subtypes.slice(),
      known: true,
      owner: "runner",
      counterDisplays: [
        {
          id: "cloak-recurring",
          amount: 1,
          displayKind: "recurring_credit",
          label: "Recurring credits",
          ariaLabel: "Recurring credits",
          creditPool: {
            kind: "recurring_credit",
            uses: ["using_icebreaker_during_run_non_noisy"],
          },
        },
      ],
    } as VisibleCard;
    const assessment = assessCorpScoreProtection({
      serverIce: [ice("wall", "onr_v1_238_data-wall-2-0")],
      runnerRig: [
        runnerProgram(
          "stable-wall-breaker",
          "onr_v1_037_japanese-water-torture",
        ),
        cloak,
      ],
      runnerCredits: 0,
      maximumRunnerAccessSuccessProbability: QUARTER,
    });

    expect(assessment).toMatchObject({
      knowledge: "unknown",
      protectsScore: false,
      unknownReason: "unsupported_runner_credit_pools",
    });
  });

  it("fails closed when a visible non-breaker modifies ICE encounter strength", () => {
    const clownDefinition = CARD_DEFINITIONS_BY_ID["onr_v1_012_clown"]!;
    const assessment = assessCorpScoreProtection({
      serverIce: [ice("wall", "onr_v1_238_data-wall-2-0")],
      runnerRig: [
        {
          instanceId: "clown",
          definitionId: clownDefinition.id,
          title: clownDefinition.title,
          type: clownDefinition.type,
          subtypes: clownDefinition.subtypes.slice(),
          known: true,
          owner: "runner",
        } as VisibleCard,
      ],
      runnerCredits: 0,
      maximumRunnerAccessSuccessProbability: QUARTER,
    });

    expect(assessment).toMatchObject({
      knowledge: "unknown",
      protectsScore: false,
      unknownReason: "unsupported_runner_access_effect",
    });
  });

  it("does not exempt an icebreaker with additional run-flow mechanics", () => {
    const assessment = assessCorpScoreProtection({
      serverIce: [ice("wall", "onr_v1_238_data-wall-2-0")],
      runnerRig: [runnerProgram("ai-boon", "onr_v1_002_ai-boon")],
      runnerCredits: 0,
      maximumRunnerAccessSuccessProbability: QUARTER,
    });

    expect(assessment).toMatchObject({
      knowledge: "unknown",
      protectsScore: false,
      unknownReason: "unsupported_runner_access_effect",
    });
  });

  it("fails closed for a trace with missing success effect", () => {
    const hunter = ice("hunter", "onr_v1_249_hunter");
    const quote = effectiveQuote(hunter);
    const assessment = assessCorpScoreProtection({
      serverIce: [
        {
          ...hunter,
          effectiveRunQuote: {
            ...quote,
            subroutines: quote.subroutines.map((subroutine) => {
              const { traceSuccessEffect: _omitted, ...withoutEffect } =
                subroutine;
              return withoutEffect;
            }),
          },
        },
      ],
      runnerRig: [],
      runnerCredits: 0,
      maximumRunnerAccessSuccessProbability: QUARTER,
    });

    expect(assessment).toMatchObject({
      knowledge: "unknown",
      protectsScore: false,
      unknownReason: "unsupported_access_relevant_ice_effect",
    });
  });

  it("fails closed when catalog mechanics contradict a nominal no-op trace effect", () => {
    const assessment = assessCorpScoreProtection({
      serverIce: [ice("cinderella", "onr_v1_228_cinderella")],
      runnerRig: [],
      runnerCredits: 0,
      maximumRunnerAccessSuccessProbability: QUARTER,
    });

    expect(assessment).toMatchObject({
      knowledge: "unknown",
      protectsScore: false,
      unknownReason: "unsupported_access_relevant_ice_effect",
    });
  });
});

function ice(instanceId: string, definitionId: string): VisibleCard {
  const definition = CARD_DEFINITIONS_BY_ID[definitionId];
  if (!definition) throw new Error(`Missing test card ${definitionId}`);
  return {
    instanceId,
    definitionId,
    title: definition.title,
    type: "ice",
    subtypes: definition.subtypes.slice(),
    known: true,
    rezzed: true,
    strength: definition.strength,
    owner: "corp",
  } as VisibleCard;
}

function blink(instanceId = "blink"): VisibleCard {
  return runnerProgram(instanceId, "onr_v1_007_blink");
}

function runnerProgram(instanceId: string, definitionId: string): VisibleCard {
  const definition = CARD_DEFINITIONS_BY_ID[definitionId];
  if (!definition) throw new Error(`Missing test card ${definitionId}`);
  return {
    instanceId,
    definitionId,
    title: definition.title,
    type: "program",
    subtypes: definition.subtypes.slice(),
    known: true,
    strength: definition.strength,
    owner: "runner",
  } as VisibleCard;
}

function effectiveQuote(card: VisibleCard) {
  if (!card.definitionId) throw new Error("Missing ICE definition id");
  const definition = CARD_DEFINITIONS_BY_ID[card.definitionId];
  if (!definition || definition.type !== "ice") {
    throw new Error(`Missing ICE definition ${card.definitionId}`);
  }
  return {
    iceInstanceId: card.instanceId,
    iceDefinitionId: definition.id,
    effectiveStrength: card.strength!,
    subroutines: (definition.subroutines ?? []).map((subroutine) => ({
      ...subroutine,
    })),
  };
}
