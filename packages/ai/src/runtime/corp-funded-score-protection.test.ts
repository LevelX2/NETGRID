import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import {
  type LegalAction,
  type VisibleCard,
  type VisibleCorpRezCostQuote,
  type VisibleVariableCorpRezCostParameter,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  assessBestFundedCorpScoreProtection,
  corpFundedScoreProtectionCertifiesBinding,
  projectCorpFundedIceInstallRoute,
  type CorpFundedRemoteAccessRiskNeed,
  type CorpFundedScoreProtectionAssessment,
  type CorpFundedScoreProtectionIceInput,
  type CorpScoreReserve,
} from "./corp-funded-score-protection";

const QUARTER = { numerator: 1, denominator: 4 } as const;
const HALF = { numerator: 1, denominator: 2 } as const;
const NO_RESERVE: CorpScoreReserve = {
  creditBreakdown: [],
  hardClickReserve: 0,
};

describe("assessBestFundedCorpScoreProtection", () => {
  it("enumerates affordable unrezzed ICE and selects the best exact protection", () => {
    const assessment = fundedAssessment({
      serverIce: [
        fundedIce("filter", "onr_v1_244_filter", true),
        fundedIce("data-wall", "onr_v1_238_data-wall-2-0", false),
      ],
      corpCredits: 2,
    });

    expect(assessment).toMatchObject({
      knowledge: "known",
      fundedProtection: true,
      totalSelectedRezCost: 2,
      creditsAfterDefense: 0,
      minimumSatisfyingRezCost: 2,
      minimumAdditionalCreditsToSatisfy: 0,
      protection: {
        runnerAccessSuccessProbability: { numerator: 1, denominator: 4 },
      },
      selectedRezCosts: [
        {
          iceInstanceId: "data-wall",
          credits: 2,
          source: "engine_rez_cost_quote",
        },
      ],
    });
  });

  it("reports the exact funding gap for installed but unaffordable satisfying ICE", () => {
    const assessment = fundedAssessment({
      serverIce: [
        fundedIce("filter", "onr_v1_244_filter", true),
        fundedIce("data-wall", "onr_v1_238_data-wall-2-0", false),
      ],
      corpCredits: 3,
      scoreReserve: {
        creditBreakdown: [{ reserveId: "score", credits: 2 }],
        hardClickReserve: 0,
      },
    });

    expect(assessment).toMatchObject({
      knowledge: "known",
      fundedProtection: false,
      totalSelectedRezCost: 0,
      minimumSatisfyingRezCost: 2,
      minimumAdditionalCreditsToSatisfy: 1,
      protection: {
        runnerAccessSuccessProbability: { numerator: 1, denominator: 2 },
      },
    });
  });

  it("uses the cheapest satisfying subset instead of over-fulfilling the objective", () => {
    const assessment = fundedAssessment({
      serverIce: [
        fundedIce("filter", "onr_v1_244_filter", false),
        fundedIce("data-wall", "onr_v1_238_data-wall-2-0", false),
      ],
      corpCredits: 2,
      threshold: HALF,
    });

    expect(assessment).toMatchObject({
      knowledge: "known",
      fundedProtection: true,
      totalSelectedRezCost: 0,
      minimumSatisfyingRezCost: 0,
      selectedRezCosts: [{ iceInstanceId: "filter", credits: 0 }],
      protection: {
        runnerAccessSuccessProbability: HALF,
      },
    });
  });

  it("does not select a redundant zero-cost ICE when a smaller subset satisfies", () => {
    const assessment = fundedAssessment({
      serverIce: [
        fundedIce("a-fetch", "onr_v1_243_fetch-4-0-1", false),
        fundedIce("z-filter", "onr_v1_244_filter", false),
      ],
      corpCredits: 0,
      threshold: HALF,
    });

    expect(assessment).toMatchObject({
      knowledge: "known",
      selectedRezCosts: [{ iceInstanceId: "z-filter" }],
    });
  });

  it("preserves a certified protecting subset when an optional sibling subset is unknown", () => {
    const assessment = fundedAssessment({
      serverIce: [
        fundedIce("data-wall", "onr_v1_238_data-wall-2-0", false),
        fundedIce("cinderella", "onr_v1_228_cinderella", false),
      ],
      corpCredits: 10,
      threshold: HALF,
    });

    expect(assessment).toMatchObject({
      knowledge: "known",
      fundedProtection: true,
      selectedRezCosts: [{ iceInstanceId: "data-wall" }],
      protection: {
        runnerAccessSuccessProbability: HALF,
      },
    });
    expect(assessment.evidence).toContain("unknownSubsetCount:2");
    expect(assessment.evidence).toContain(
      "unknownSubsetReason:unsupported_access_relevant_ice_effect",
    );
  });

  it("fails closed before enumerating a pathological number of rez subsets", () => {
    const assessment = fundedAssessment({
      serverIce: Array.from({ length: 13 }, (_, index) =>
        fundedIce(`filter-${index}`, "onr_v1_244_filter", false),
      ),
      corpCredits: 0,
      threshold: HALF,
    });

    expect(assessment).toMatchObject({
      knowledge: "unknown",
      fundedProtection: false,
      unknownReason: "search_space_exceeded",
    });
  });

  it("reports a hard-click blocker independently from the credit gap", () => {
    const assessment = fundedAssessment({
      serverIce: [fundedIce("filter", "onr_v1_244_filter", true)],
      corpCredits: 0,
      corpClicks: 0,
      threshold: HALF,
      scoreReserve: {
        creditBreakdown: [],
        hardClickReserve: 1,
      },
    });

    expect(assessment).toMatchObject({
      knowledge: "known",
      fundedProtection: false,
      minimumSatisfyingRezCost: 0,
      minimumAdditionalCreditsToSatisfy: 0,
      minimumAdditionalClicksToSatisfy: 1,
      preservesHardClickReserve: false,
    });
  });

  it("uses the engine-certified effective rez cost instead of printed card data", () => {
    const wall = fundedIce("data-wall", "onr_v1_238_data-wall-2-0", false);
    const assessment = fundedAssessment({
      serverIce: [
        {
          ...wall,
          effectiveRezCostQuote: {
            ...wall.effectiveRezCostQuote!,
            finalCredits: 5,
            increaseSourceDefinitionIds: ["test_public_rez_surcharge"],
          },
        },
      ],
      corpCredits: 4,
      threshold: HALF,
    });

    expect(assessment).toMatchObject({
      knowledge: "known",
      fundedProtection: false,
      minimumSatisfyingRezCost: 5,
      minimumAdditionalCreditsToSatisfy: 1,
      totalSelectedRezCost: 0,
    });
  });

  it("fails closed on missing or incomplete quotes and budgets mandatory agenda-point rez costs", () => {
    const wall = fundedIce("data-wall", "onr_v1_238_data-wall-2-0", false);
    const { effectiveRezCostQuote: _missingQuote, ...withoutQuote } = wall;
    expect(
      fundedAssessment({
        serverIce: [withoutQuote],
        corpCredits: 5,
        threshold: HALF,
      }),
    ).toMatchObject({
      knowledge: "unknown",
      unknownReason: "missing_rez_cost_quote",
    });
    expect(
      fundedAssessment({
        serverIce: [
          {
            ...wall,
            effectiveRezCostQuote: {
              context: "installed",
              cardId: "data-wall",
              targetServerId: "remote_1",
              projectedServerId: "remote_1",
              expiresAtStateVersion: 7,
              complete: false,
            },
          },
        ],
        corpCredits: 5,
        threshold: HALF,
      }),
    ).toMatchObject({
      knowledge: "unknown",
      unknownReason: "incomplete_rez_cost_quote",
    });
    const agendaPointWall = {
      ...wall,
      effectiveRezCostQuote: {
        ...wall.effectiveRezCostQuote!,
        mandatoryAdditionalCosts: { agendaPoints: 1 },
      },
    };
    expect(
      fundedAssessment({
        serverIce: [agendaPointWall],
        corpCredits: 5,
        corpAgendaPoints: 1,
        threshold: HALF,
      }),
    ).toMatchObject({
      knowledge: "known",
      fundedProtection: true,
      totalSelectedRezCost: 2,
      totalSelectedAgendaPointCost: 1,
      agendaPointsAfterDefense: 0,
      selectedRezCosts: [
        {
          iceInstanceId: "data-wall",
          credits: 2,
          agendaPoints: 1,
        },
      ],
    });
    expect(
      fundedAssessment({
        serverIce: [agendaPointWall],
        corpCredits: 5,
        corpAgendaPoints: 0,
        threshold: HALF,
      }),
    ).toMatchObject({
      knowledge: "known",
      fundedProtection: false,
      totalSelectedRezCost: 0,
      totalSelectedAgendaPointCost: 0,
      selectedRezCosts: [],
    });
  });

  it("fails closed when an effective rez quote drifts by card, server, or state", () => {
    const wall = fundedIce("data-wall", "onr_v1_238_data-wall-2-0", false);
    for (const effectiveRezCostQuote of [
      { ...wall.effectiveRezCostQuote!, cardId: "other-card" },
      { ...wall.effectiveRezCostQuote!, targetServerId: "remote_2" as const },
      { ...wall.effectiveRezCostQuote!, expiresAtStateVersion: 8 },
    ]) {
      expect(
        fundedAssessment({
          serverIce: [{ ...wall, effectiveRezCostQuote }],
          corpCredits: 5,
          threshold: HALF,
        }),
      ).toMatchObject({
        knowledge: "unknown",
        unknownReason: "rez_cost_quote_drift",
      });
    }
  });

  it("admits a post-install quote only for the explicitly scoped projected card", () => {
    const wall = fundedIce("data-wall", "onr_v1_238_data-wall-2-0", false);
    const projectedWall = {
      ...wall,
      effectiveRezCostQuote: {
        ...wall.effectiveRezCostQuote,
        context: "post_install" as const,
      },
    };
    const common = {
      serverIce: [projectedWall],
      runnerRig: [blink()],
      runnerCredits: 0,
      targetServerId: "remote_1" as const,
      observedAtStateVersion: 7,
      availableCorpCredits: 2,
      availableCorpClicks: 3,
      availableCorpAgendaPoints: 0,
      scoreReserve: NO_RESERVE,
      maximumRunnerAccessSuccessProbability: HALF,
    };

    expect(assessBestFundedCorpScoreProtection(common)).toMatchObject({
      knowledge: "unknown",
      unknownReason: "rez_cost_quote_drift",
    });
    expect(
      assessBestFundedCorpScoreProtection({
        ...common,
        postInstallQuoteCardId: "different-card",
      }),
    ).toMatchObject({
      knowledge: "unknown",
      unknownReason: "rez_cost_quote_drift",
    });
    expect(
      assessBestFundedCorpScoreProtection({
        ...common,
        postInstallQuoteCardId: "data-wall",
      }),
    ).toMatchObject({
      knowledge: "known",
      fundedProtection: true,
    });
  });

  it("preserves duplicate modifier source ids from stacked engine modifiers", () => {
    const wall = fundedIce("data-wall", "onr_v1_238_data-wall-2-0", false);
    expect(
      fundedAssessment({
        serverIce: [
          {
            ...wall,
            effectiveRezCostQuote: {
              ...wall.effectiveRezCostQuote!,
              reductionSourceDefinitionIds: ["encoder", "encoder"],
            },
          },
        ],
        corpCredits: 2,
        threshold: HALF,
      }),
    ).toMatchObject({
      knowledge: "known",
      fundedProtection: true,
    });
  });

  it("certifies Sandstorm's first ETR as the exact minimum funding frontier", () => {
    const assessment = fundedAssessment({
      serverIce: [
        fundedIce("filter", "onr_v1_244_filter", true),
        variableFundedIce(
          "sandstorm",
          "onr_proteus_036_sandstorm",
          sandstormRezParameter(),
        ),
      ],
      corpCredits: 5,
    });

    expect(assessment).toMatchObject({
      knowledge: "known",
      fundedProtection: false,
      totalSelectedRezCost: 0,
      minimumSatisfyingRezCost: 6,
      minimumAdditionalCreditsToSatisfy: 1,
      protection: {
        runnerAccessSuccessProbability: HALF,
        protectsScore: false,
      },
      minimumSatisfyingRezCosts: [
        {
          iceInstanceId: "sandstorm",
          iceDefinitionId: "onr_proteus_036_sandstorm",
          credits: 6,
          source: "engine_rez_cost_quote",
          variableRezChoice: {
            kind: "paid_end_the_run_subroutines",
            subroutineCount: 1,
          },
        },
      ],
      minimumSatisfyingProtection: {
        runnerAccessSuccessProbability: QUARTER,
        protectsScore: true,
      },
    });
  });

  it("selects the exact alternate subtype when only that Engine option protects", () => {
    const assessment = fundedAssessment({
      serverIce: [
        variableFundedIce(
          "credit-blocks",
          "onr_proteus_017_credit-blocks",
          creditBlocksRezParameter(),
        ),
      ],
      corpCredits: 7,
      runnerRig: [runnerProgram("codeslinger", "onr_v1_015_codeslinger")],
      runnerCredits: 10,
      threshold: HALF,
    });

    expect(assessment).toMatchObject({
      knowledge: "known",
      fundedProtection: true,
      totalSelectedRezCost: 7,
      minimumSatisfyingRezCost: 7,
      selectedRezCosts: [
        {
          iceInstanceId: "credit-blocks",
          credits: 7,
          variableRezChoice: {
            kind: "alternate_subtype",
            selectedSubtypes: ["wall"],
          },
        },
      ],
      minimumSatisfyingRezCosts: [
        {
          iceInstanceId: "credit-blocks",
          credits: 7,
          variableRezChoice: {
            kind: "alternate_subtype",
            selectedSubtypes: ["wall"],
          },
        },
      ],
      minimumSatisfyingProtection: {
        runnerAccessSuccessProbability: { numerator: 0, denominator: 1 },
        protectsScore: true,
      },
    });
  });

  it("keeps alternate rez options mutually exclusive for one ICE", () => {
    const assessment = fundedAssessment({
      serverIce: [
        variableFundedIce(
          "credit-blocks",
          "onr_proteus_017_credit-blocks",
          creditBlocksRezParameter(),
        ),
      ],
      corpCredits: 7,
      threshold: QUARTER,
    });

    expect(assessment).toMatchObject({
      knowledge: "known",
      fundedProtection: false,
      selectedRezCosts: [
        {
          iceInstanceId: "credit-blocks",
          credits: 6,
          variableRezChoice: {
            kind: "alternate_subtype",
            selectedSubtypes: ["sentry"],
          },
        },
      ],
      protection: {
        runnerAccessSuccessProbability: HALF,
        protectsScore: false,
      },
    });
    if (assessment.knowledge !== "known") {
      throw new Error("expected known alternate-subtype assessment");
    }
    expect(assessment.selectedRezCosts).toHaveLength(1);
    expect(
      new Set(assessment.selectedRezCosts.map((cost) => cost.iceInstanceId))
        .size,
    ).toBe(assessment.selectedRezCosts.length);
    expect(assessment.minimumSatisfyingRezCost).toBeUndefined();
    expect(assessment.minimumSatisfyingRezCosts).toBeUndefined();
    expect(assessment.minimumSatisfyingProtection).toBeUndefined();
  });

  it("fails closed on an X-strength option outside the direct-access model", () => {
    const assessment = fundedAssessment({
      serverIce: [
        variableFundedIce(
          "homing-missile",
          "onr_proteus_025_homing-missile",
          homingMissileRezParameter(),
        ),
      ],
      corpCredits: 12,
      threshold: HALF,
    });

    expect(assessment).toMatchObject({
      knowledge: "unknown",
      fundedProtection: false,
      unknownReason: "unsupported_variable_rez_effect",
    });
  });

  it("fails closed on malformed installed variable-rez arithmetic", () => {
    const malformed = {
      ...sandstormRezParameter(),
      firstEndTheRunFinalCredits: 7,
    } satisfies VisibleVariableCorpRezCostParameter;
    const assessment = fundedAssessment({
      serverIce: [
        variableFundedIce("sandstorm", "onr_proteus_036_sandstorm", malformed),
      ],
      corpCredits: 7,
      threshold: HALF,
    });

    expect(assessment).toMatchObject({
      knowledge: "unknown",
      unknownReason: "unsupported_variable_rez_effect",
    });
  });
});

describe("corpFundedScoreProtectionCertifiesBinding", () => {
  const exactNeed = (
    baseline: CorpFundedScoreProtectionAssessment,
  ): CorpFundedRemoteAccessRiskNeed => ({
    needId: "score-protection:agenda:agenda-1:remote_1",
    parentProjectId: "agenda:agenda-1:remote_1",
    targetServerId: "remote_1",
    observedAtStateVersion: 7,
    objective: {
      kind: "funded_remote_access_risk",
      maximumRunnerAccessSuccessProbability: QUARTER,
      policySource: "test_policy",
    },
    scoreReserve: NO_RESERVE,
    baseline,
  });
  const certifies = (
    need: CorpFundedRemoteAccessRiskNeed | undefined,
    overrides: Partial<{
      expectedParentProjectId: string;
      expectedTargetServerId: string;
      observedAtStateVersion: number;
    }> = {},
  ) =>
    corpFundedScoreProtectionCertifiesBinding({
      need,
      expectedParentProjectId:
        overrides.expectedParentProjectId ?? "agenda:agenda-1:remote_1",
      expectedTargetServerId: overrides.expectedTargetServerId ?? "remote_1",
      observedAtStateVersion: overrides.observedAtStateVersion ?? 7,
    });

  it("certifies only a known funded protecting baseline with exact parent, server and state binding", () => {
    const baseline = fundedAssessment({
      serverIce: [
        fundedIce("filter", "onr_v1_244_filter", true),
        fundedIce("data-wall", "onr_v1_238_data-wall-2-0", false),
      ],
      corpCredits: 2,
    });
    const need = exactNeed(baseline);

    expect(certifies(need)).toBe(true);
    expect(certifies(undefined)).toBe(false);
    expect(
      certifies(need, { expectedParentProjectId: "agenda:foreign:remote_1" }),
    ).toBe(false);
    expect(certifies(need, { expectedTargetServerId: "remote_2" })).toBe(false);
    expect(certifies(need, { observedAtStateVersion: 8 })).toBe(false);
  });

  it("fails closed for unknown, unfunded and non-protecting exact baselines", () => {
    const unknown = fundedAssessment({
      serverIce: Array.from({ length: 13 }, (_, index) =>
        fundedIce(`filter-${index}`, "onr_v1_244_filter", false),
      ),
      corpCredits: 0,
      threshold: HALF,
    });
    const unfunded = fundedAssessment({
      serverIce: [
        fundedIce("filter", "onr_v1_244_filter", true),
        fundedIce("data-wall", "onr_v1_238_data-wall-2-0", false),
      ],
      corpCredits: 0,
    });
    const nonProtecting = fundedAssessment({
      serverIce: [fundedIce("hunter", "onr_v1_249_hunter", true)],
      corpCredits: 10,
    });

    expect(certifies(exactNeed(unknown))).toBe(false);
    expect(certifies(exactNeed(unfunded))).toBe(false);
    expect(certifies(exactNeed(nonProtecting))).toBe(false);
  });
});

describe("projectCorpFundedIceInstallRoute", () => {
  it("classifies Hunter as no progress", () => {
    const route = routeFor({
      source: handIce("hunter", "onr_v1_249_hunter"),
      targetServerId: "remote_1",
      currentIce: [],
      corpCredits: 5,
      preferPostInstallSourceProgress: true,
    });

    expect(route).toMatchObject({
      knowledge: "known",
      effect: "no_progress",
      funded: false,
      selectedRezCosts: [
        {
          iceInstanceId: "hunter",
          source: "engine_rez_cost_quote",
        },
      ],
      after: {
        protection: {
          runnerAccessSuccessProbability: { numerator: 1, denominator: 1 },
        },
      },
    });
  });

  it("classifies Filter against Blink as progress", () => {
    const route = routeFor({
      source: handIce("filter", "onr_v1_244_filter"),
      targetServerId: "remote_1",
      currentIce: [],
      corpCredits: 5,
    });

    expect(route).toMatchObject({
      knowledge: "known",
      effect: "progress",
      funded: false,
      after: {
        selectedRezCosts: [
          {
            iceInstanceId: "filter",
            credits: 0,
            source: "engine_rez_cost_quote",
          },
        ],
        protection: {
          runnerAccessSuccessProbability: { numerator: 1, denominator: 2 },
        },
      },
    });
  });

  it("recognizes recurring-credit-aware Runner tax even when access stays certain", () => {
    const route = routeFor({
      source: handIce("sleeper", "onr_v1_270_sleeper"),
      targetServerId: "remote_1",
      currentIce: [fundedIce("filter", "onr_v1_244_filter", true)],
      corpCredits: 5,
      runnerRig: [
        runnerProgram("decoder", "simple_decoder"),
        recurringCreditPool("cloak", "using_icebreaker_during_run_non_noisy"),
      ],
      runnerCredits: 1,
    });

    expect(route).toMatchObject({
      knowledge: "known",
      effect: "progress",
      after: {
        protection: {
          runnerAccessSuccessProbability: { numerator: 1, denominator: 1 },
          runnerCreditsRemainingOnBestAccessPath: 0,
        },
      },
      evidence: expect.arrayContaining([
        "runnerCreditsRemainingBefore:1",
        "runnerCreditsRemainingAfter:0",
        "runnerCreditTaxProgress:true",
      ]),
    });
  });

  it("classifies a second necessary ETR as satisfied", () => {
    const route = routeFor({
      source: handIce("data-wall", "onr_v1_238_data-wall-2-0"),
      targetServerId: "remote_1",
      currentIce: [fundedIce("filter", "onr_v1_244_filter", true)],
      corpCredits: 5,
    });

    expect(route).toMatchObject({
      knowledge: "known",
      effect: "satisfied",
      funded: true,
      installCredits: 1,
      installClicks: 1,
      creditsAfterDefense: 2,
      after: {
        protection: {
          runnerAccessSuccessProbability: { numerator: 1, denominator: 4 },
        },
      },
    });
  });

  it("keeps a protective route unfunded when the install consumes the score reserve", () => {
    const scoreReserve: CorpScoreReserve = {
      creditBreakdown: [{ reserveId: "advance-and-score", credits: 3 }],
      hardClickReserve: 0,
    };
    const route = routeFor({
      source: handIce("filter", "onr_v1_244_filter"),
      targetServerId: "remote_1",
      currentIce: [fundedIce("hunter", "onr_v1_249_hunter", true)],
      corpCredits: 3,
      scoreReserve,
    });

    expect(route).toMatchObject({
      knowledge: "known",
      effect: "no_progress",
      funded: false,
      preservesScoreCreditReserve: false,
      creditsAfterDefense: 2,
      after: {
        protection: {
          runnerAccessSuccessProbability: { numerator: 1, denominator: 2 },
        },
      },
    });
  });

  it("fails closed when the projected install cost drifts from LegalAction", () => {
    const source = handIce("filter", "onr_v1_244_filter");
    const setup = routeSetup({
      source,
      targetServerId: "remote_1",
      currentIce: [],
      corpCredits: 5,
    });

    const route = projectCorpFundedIceInstallRoute({
      ...setup,
      projectedInstallCredits: 1,
    });

    expect(route).toMatchObject({
      knowledge: "unknown",
      effect: "unknown",
      unknownReason: "install_cost_drift",
    });
  });

  it("treats new_remote as an empty new path", () => {
    const route = routeFor({
      source: handIce("data-wall", "onr_v1_238_data-wall-2-0"),
      targetServerId: "new_remote",
      corpCredits: 4,
    });

    expect(route).toMatchObject({
      knowledge: "known",
      targetServerId: "new_remote",
      installCredits: 0,
      effect: "progress",
      after: {
        protection: {
          runnerAccessSuccessProbability: { numerator: 1, denominator: 2 },
        },
      },
    });
  });

  it("fails closed on source binding drift", () => {
    const source = handIce("filter", "onr_v1_244_filter");
    const setup = routeSetup({
      source,
      targetServerId: "remote_1",
      currentIce: [],
      corpCredits: 5,
    });
    const action = {
      ...setup.action,
      payload: { ...setup.action.payload, cardId: "different-instance" },
    };

    expect(
      projectCorpFundedIceInstallRoute({ ...setup, action }),
    ).toMatchObject({
      knowledge: "unknown",
      unknownReason: "source_binding_drift",
    });
  });

  it("fails closed when the install base cost does not match the current ICE count", () => {
    const source = handIce("data-wall", "onr_v1_238_data-wall-2-0");
    const setup = routeSetup({
      source,
      targetServerId: "remote_1",
      currentIce: [fundedIce("filter", "onr_v1_244_filter", true)],
      corpCredits: 2,
    });
    const action = {
      ...setup.action,
      costs: [{ clicks: 1 }],
      payload: {
        ...setup.action.payload,
        iceInstallBaseCost: 0,
        iceInstallAdditionalCost: 0,
        iceInstallReduction: 0,
        iceInstallTotalCost: 0,
      },
    };

    expect(
      projectCorpFundedIceInstallRoute({
        ...setup,
        action,
        projectedInstallCredits: 0,
      }),
    ).toMatchObject({
      knowledge: "unknown",
      unknownReason: "install_payload_cost_drift",
    });
  });

  it("fails closed when current resources drift from the stored baseline", () => {
    const setup = routeSetup({
      source: handIce("data-wall", "onr_v1_238_data-wall-2-0"),
      targetServerId: "remote_1",
      currentIce: [fundedIce("existing-filter", "onr_v1_244_filter", true)],
      corpCredits: 5,
    });

    expect(
      projectCorpFundedIceInstallRoute({
        ...setup,
        currentCorpCredits: 4,
      }),
    ).toMatchObject({
      knowledge: "unknown",
      unknownReason: "baseline_drift",
    });
  });

  it("fails closed when the need reserve drifts from its baseline", () => {
    const setup = routeSetup({
      source: handIce("filter", "onr_v1_244_filter"),
      targetServerId: "remote_1",
      currentIce: [],
      corpCredits: 5,
    });

    expect(
      projectCorpFundedIceInstallRoute({
        ...setup,
        need: {
          ...setup.need,
          scoreReserve: {
            creditBreakdown: [{ reserveId: "score", credits: 1 }],
            hardClickReserve: 0,
          },
        },
      }),
    ).toMatchObject({
      knowledge: "unknown",
      unknownReason: "reserve_drift",
    });
  });

  it("binds a new_remote baseline to the empty projected path", () => {
    const setup = routeSetup({
      source: handIce("data-wall", "onr_v1_238_data-wall-2-0"),
      targetServerId: "new_remote",
      corpCredits: 4,
    });
    const nonEmptyBaseline = fundedAssessment({
      serverIce: [fundedIce("filter", "onr_v1_244_filter", true)],
      corpCredits: 4,
    });

    expect(
      projectCorpFundedIceInstallRoute({
        ...setup,
        need: { ...setup.need, baseline: nonEmptyBaseline },
      }),
    ).toMatchObject({
      knowledge: "unknown",
      unknownReason: "baseline_drift",
    });
  });

  it("binds an optional payload definition and Corp ownership to the source", () => {
    const source = handIce("filter", "onr_v1_244_filter");
    const setup = routeSetup({
      source,
      targetServerId: "remote_1",
      currentIce: [],
      corpCredits: 5,
    });

    expect(
      projectCorpFundedIceInstallRoute({
        ...setup,
        action: {
          ...setup.action,
          payload: {
            ...setup.action.payload,
            sourceDefinitionId: "onr_v1_249_hunter",
          },
        },
      }),
    ).toMatchObject({
      knowledge: "unknown",
      unknownReason: "source_binding_drift",
    });
    expect(
      projectCorpFundedIceInstallRoute({
        ...setup,
        visibleCorpHand: [{ ...source, owner: "runner" }],
      }),
    ).toMatchObject({
      knowledge: "unknown",
      unknownReason: "source_binding_drift",
    });
  });

  it("fails closed on incomplete or identity-drifted post-install rez quotes", () => {
    const setup = routeSetup({
      source: handIce("filter", "onr_v1_244_filter"),
      targetServerId: "remote_1",
      currentIce: [],
      corpCredits: 5,
    });

    expect(
      projectCorpFundedIceInstallRoute({
        ...setup,
        action: {
          ...setup.action,
          payload: {
            ...setup.action.payload,
            postInstallRezQuoteComplete: false,
          },
        },
      }),
    ).toMatchObject({
      knowledge: "unknown",
      unknownReason: "post_install_rez_quote_unknown",
    });
    expect(
      projectCorpFundedIceInstallRoute({
        ...setup,
        action: {
          ...setup.action,
          payload: {
            ...setup.action.payload,
            postInstallRezQuoteCardId: "other-card",
          },
        },
      }),
    ).toMatchObject({
      knowledge: "unknown",
      unknownReason: "post_install_rez_quote_drift",
    });
  });

  it("projects a mandatory agenda-point cost in a post-install rez quote", () => {
    const setup = routeSetup({
      source: handIce("filter", "onr_v1_244_filter"),
      targetServerId: "remote_1",
      currentIce: [],
      corpCredits: 5,
      corpAgendaPoints: 1,
    });
    const action = {
      ...setup.action,
      payload: {
        ...setup.action.payload,
        postInstallRezQuoteMandatoryAgendaPointCost: 1,
        postInstallRezQuoteMandatoryAdditionalCostKind: "agenda_point",
      },
    };

    expect(projectCorpFundedIceInstallRoute({ ...setup, action })).toMatchObject(
      {
        knowledge: "known",
        after: {
          totalSelectedAgendaPointCost: 1,
          agendaPointsAfterDefense: 0,
        },
      },
    );
    const insufficientSetup = routeSetup({
      source: handIce("data-wall", "onr_v1_238_data-wall-2-0"),
      targetServerId: "remote_1",
      currentIce: [fundedIce("existing-filter", "onr_v1_244_filter", true)],
      corpCredits: 5,
      corpAgendaPoints: 0,
    });
    expect(
      projectCorpFundedIceInstallRoute({
        ...insufficientSetup,
        action: {
          ...insufficientSetup.action,
          payload: {
            ...insufficientSetup.action.payload,
            postInstallRezQuoteMandatoryAgendaPointCost: 1,
            postInstallRezQuoteMandatoryAdditionalCostKind: "agenda_point",
          },
        },
      }),
    ).toMatchObject({
      knowledge: "known",
      after: {
        totalSelectedAgendaPointCost: 0,
        selectedRezCosts: [],
      },
    });
  });

  it("binds a new remote rez quote to a positive concrete remote id", () => {
    const setup = routeSetup({
      source: handIce("filter", "onr_v1_244_filter"),
      targetServerId: "new_remote",
      corpCredits: 5,
    });

    for (const projectedServerId of ["hq", "remote_0"]) {
      expect(
        projectCorpFundedIceInstallRoute({
          ...setup,
          action: {
            ...setup.action,
            payload: {
              ...setup.action.payload,
              postInstallRezQuoteProjectedServerId: projectedServerId,
            },
          },
        }),
      ).toMatchObject({
        knowledge: "unknown",
        unknownReason: "post_install_rez_quote_drift",
      });
    }
  });

  it("preserves duplicate post-install modifier source ids", () => {
    const setup = routeSetup({
      source: handIce("filter", "onr_v1_244_filter"),
      targetServerId: "remote_1",
      currentIce: [],
      corpCredits: 5,
    });

    expect(
      projectCorpFundedIceInstallRoute({
        ...setup,
        action: {
          ...setup.action,
          payload: {
            ...setup.action.payload,
            postInstallRezQuoteReductionSourceDefinitionIds: "encoder,encoder",
          },
        },
      }),
    ).toMatchObject({
      knowledge: "known",
      effect: "progress",
    });
  });

  it("projects Sandstorm's exact first-ETR choice and one-credit funding gap", () => {
    const setup = routeSetup({
      source: handIce("sandstorm", "onr_proteus_036_sandstorm"),
      targetServerId: "remote_1",
      currentIce: [fundedIce("filter", "onr_v1_244_filter", true)],
      corpCredits: 6,
    });
    const action = variableInstallAction(setup.action, sandstormRezParameter());

    const route = projectCorpFundedIceInstallRoute({
      ...setup,
      action,
    });

    expect(route).toMatchObject({
      knowledge: "known",
      effect: "no_progress",
      funded: false,
      installCredits: 1,
      creditsAfterDefense: 5,
      selectedRezCosts: [],
      after: {
        availableCorpCredits: 5,
        minimumSatisfyingRezCost: 6,
        minimumAdditionalCreditsToSatisfy: 1,
        minimumSatisfyingRezCosts: [
          {
            iceInstanceId: "sandstorm",
            credits: 6,
            variableRezChoice: {
              kind: "paid_end_the_run_subroutines",
              subroutineCount: 1,
            },
          },
        ],
        minimumSatisfyingProtection: {
          runnerAccessSuccessProbability: QUARTER,
          protectsScore: true,
        },
      },
    });
  });

  it("projects an exact alternate-subtype post-install choice", () => {
    const setup = routeSetup({
      source: handIce("credit-blocks", "onr_proteus_017_credit-blocks"),
      targetServerId: "new_remote",
      corpCredits: 7,
      runnerRig: [runnerProgram("codeslinger", "onr_v1_015_codeslinger")],
      runnerCredits: 10,
    });
    const action = variableInstallAction(
      setup.action,
      creditBlocksRezParameter(),
    );

    const route = projectCorpFundedIceInstallRoute({
      ...setup,
      action,
    });

    expect(route).toMatchObject({
      knowledge: "known",
      effect: "satisfied",
      funded: true,
      selectedRezCosts: [
        {
          iceInstanceId: "credit-blocks",
          credits: 7,
          variableRezChoice: {
            kind: "alternate_subtype",
            selectedSubtypes: ["wall"],
          },
        },
      ],
      after: {
        protection: {
          runnerAccessSuccessProbability: { numerator: 0, denominator: 1 },
          protectsScore: true,
        },
      },
    });
  });

  it("fails a post-install X-strength route closed after exact quote parsing", () => {
    const setup = routeSetup({
      source: handIce("homing-missile", "onr_proteus_025_homing-missile"),
      targetServerId: "new_remote",
      corpCredits: 12,
    });
    const action = variableInstallAction(
      setup.action,
      homingMissileRezParameter(),
    );

    expect(
      projectCorpFundedIceInstallRoute({
        ...setup,
        action,
      }),
    ).toMatchObject({
      knowledge: "unknown",
      effect: "unknown",
      unknownReason: "after_assessment_unknown",
      evidence: expect.arrayContaining([
        "afterUnknownReason:unsupported_variable_rez_effect",
      ]),
    });
  });

  it("classifies malformed post-install variable arithmetic as quote drift", () => {
    const setup = routeSetup({
      source: handIce("sandstorm", "onr_proteus_036_sandstorm"),
      targetServerId: "new_remote",
      corpCredits: 7,
    });
    const malformed = {
      ...sandstormRezParameter(),
      firstEndTheRunFinalCredits: 7,
    } satisfies VisibleVariableCorpRezCostParameter;
    const action = variableInstallAction(setup.action, malformed);

    expect(
      projectCorpFundedIceInstallRoute({
        ...setup,
        action,
      }),
    ).toMatchObject({
      knowledge: "unknown",
      effect: "unknown",
      unknownReason: "post_install_rez_quote_drift",
    });
  });
});

function routeFor(params: {
  source: VisibleCard;
  targetServerId: "new_remote" | "remote_1";
  currentIce?: CorpFundedScoreProtectionIceInput[];
  corpCredits: number;
  scoreReserve?: CorpScoreReserve;
  runnerRig?: VisibleCard[];
  runnerCredits?: number;
  corpAgendaPoints?: number;
  preferPostInstallSourceProgress?: boolean;
}) {
  return projectCorpFundedIceInstallRoute(routeSetup(params));
}

function routeSetup(params: {
  source: VisibleCard;
  targetServerId: "new_remote" | "remote_1";
  currentIce?: CorpFundedScoreProtectionIceInput[];
  corpCredits: number;
  scoreReserve?: CorpScoreReserve;
  runnerRig?: VisibleCard[];
  runnerCredits?: number;
  corpAgendaPoints?: number;
  preferPostInstallSourceProgress?: boolean;
}) {
  const currentIce = params.currentIce ?? [];
  const scoreReserve = params.scoreReserve ?? NO_RESERVE;
  const baseline = fundedAssessment({
    serverIce: currentIce,
    corpCredits: params.corpCredits,
    scoreReserve,
    ...(params.corpAgendaPoints !== undefined
      ? { corpAgendaPoints: params.corpAgendaPoints }
      : {}),
    ...(params.runnerRig ? { runnerRig: params.runnerRig } : {}),
    ...(params.runnerCredits !== undefined
      ? { runnerCredits: params.runnerCredits }
      : {}),
  });
  const need = needFor(params.targetServerId, baseline, scoreReserve);
  const action = installAction(
    params.source,
    params.targetServerId,
    params.targetServerId === "new_remote" ? 0 : currentIce.length,
  );
  return {
    need,
    action,
    currentStateVersion: 7,
    currentCorpCredits: params.corpCredits,
    currentCorpClicks: 3,
    currentCorpAgendaPoints: params.corpAgendaPoints ?? 0,
    visibleCorpHand: [params.source],
    ...(params.targetServerId === "new_remote"
      ? {}
      : {
          currentServer: {
            id: params.targetServerId,
            ice: currentIce,
          },
        }),
    runnerRig: params.runnerRig ?? [blink()],
    runnerCredits: params.runnerCredits ?? 0,
    projectedInstallCredits:
      params.targetServerId === "new_remote" ? 0 : currentIce.length,
    projectedInstallClicks: 1,
    ...(params.preferPostInstallSourceProgress === true
      ? { preferPostInstallSourceProgress: true }
      : {}),
  };
}

function needFor(
  targetServerId: "new_remote" | "remote_1",
  baseline: CorpFundedScoreProtectionAssessment,
  scoreReserve: CorpScoreReserve,
): CorpFundedRemoteAccessRiskNeed {
  return {
    needId: `need:${targetServerId}`,
    parentProjectId: "score-project",
    targetServerId,
    observedAtStateVersion: 7,
    objective: {
      kind: "funded_remote_access_risk",
      maximumRunnerAccessSuccessProbability: QUARTER,
      policySource: "test-policy",
    },
    scoreReserve,
    baseline,
  };
}

function fundedAssessment(params: {
  serverIce: CorpFundedScoreProtectionIceInput[];
  corpCredits: number;
  corpClicks?: number;
  scoreReserve?: CorpScoreReserve;
  threshold?: typeof QUARTER | typeof HALF;
  runnerRig?: VisibleCard[];
  runnerCredits?: number;
  corpAgendaPoints?: number;
}): CorpFundedScoreProtectionAssessment {
  return assessBestFundedCorpScoreProtection({
    serverIce: params.serverIce,
    runnerRig: params.runnerRig ?? [blink()],
    runnerCredits: params.runnerCredits ?? 0,
    targetServerId: "remote_1",
    observedAtStateVersion: 7,
    availableCorpCredits: params.corpCredits,
    availableCorpClicks: params.corpClicks ?? 3,
    availableCorpAgendaPoints: params.corpAgendaPoints ?? 0,
    scoreReserve: params.scoreReserve ?? NO_RESERVE,
    maximumRunnerAccessSuccessProbability: params.threshold ?? QUARTER,
  });
}

function variableInstallAction(
  action: LegalAction,
  parameter: VisibleVariableCorpRezCostParameter,
): LegalAction {
  const variablePayload =
    parameter.kind === "x_strength"
      ? {
          postInstallRezQuoteVariableRezKind: parameter.kind,
          postInstallRezQuoteVariableAdditionalCreditsPerValue:
            parameter.additionalCreditsPerValue,
          postInstallRezQuoteVariableMinValue: parameter.minValue,
          postInstallRezQuoteVariableMaxValue: parameter.maxValue,
          postInstallRezQuoteVariableMinValueFinalCredits:
            parameter.minValueFinalCredits,
          postInstallRezQuoteVariableMaxValueFinalCredits:
            parameter.maxValueFinalCredits,
          postInstallRezQuoteVariableEffectiveStrengthFromValue:
            parameter.effectiveStrengthFromValue,
          ...(parameter.traceLimitFromValue
            ? { postInstallRezQuoteVariableTraceLimitFromValue: true }
            : {}),
        }
      : parameter.kind === "paid_end_the_run_subroutines"
        ? {
            postInstallRezQuoteVariableRezKind: parameter.kind,
            postInstallRezQuoteVariableAdditionalCreditsPerSubroutine:
              parameter.additionalCreditsPerSubroutine,
            postInstallRezQuoteVariableMinSubroutines: parameter.minSubroutines,
            postInstallRezQuoteVariableMinSubroutinesFinalCredits:
              parameter.minSubroutinesFinalCredits,
            postInstallRezQuoteVariableFirstEndTheRunSubroutineCount:
              parameter.firstEndTheRunSubroutineCount,
            postInstallRezQuoteVariableFirstEndTheRunFinalCredits:
              parameter.firstEndTheRunFinalCredits,
          }
        : {
            postInstallRezQuoteVariableRezKind: parameter.kind,
            postInstallRezQuoteVariableBaseSubtypes:
              parameter.baseSubtypes.join(","),
            postInstallRezQuoteVariableBaseSubtypesFinalCredits:
              parameter.baseSubtypesFinalCredits,
            postInstallRezQuoteVariableAlternateSubtypes:
              parameter.alternateSubtypes.join(","),
            postInstallRezQuoteVariableAlternateSubtypesAdditionalCredits:
              parameter.alternateSubtypesAdditionalCredits,
            postInstallRezQuoteVariableAlternateSubtypesFinalCredits:
              parameter.alternateSubtypesFinalCredits,
          };
  return {
    ...action,
    payload: {
      ...action.payload,
      postInstallRezQuoteCostKind: "variable",
      ...variablePayload,
    },
  };
}

function installAction(
  source: VisibleCard,
  serverId: "new_remote" | "remote_1",
  existingIceCount: number,
): LegalAction {
  const installCredits = serverId === "new_remote" ? 0 : existingIceCount;
  return {
    actionId: `install:${source.instanceId}:${serverId}`,
    side: "corp",
    type: "install_card",
    label: `Install ${source.title}`,
    source: source.instanceId,
    timingPoint: "corp_action.main",
    costs: [
      {
        clicks: 1,
        ...(installCredits > 0 ? { credits: installCredits } : {}),
      },
    ],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 7,
    payload: {
      cardId: source.instanceId,
      serverId,
      placement: "ice",
      ...(serverId === "new_remote"
        ? {}
        : {
            iceInstallBaseCost: existingIceCount,
            iceInstallAdditionalCost: 0,
            iceInstallReduction: 0,
            iceInstallTotalCost: installCredits,
          }),
      postInstallRezQuoteCardId: source.instanceId,
      postInstallRezQuoteTargetServerId: serverId,
      postInstallRezQuoteProjectedServerId:
        serverId === "new_remote" ? "remote_1" : serverId,
      postInstallRezQuoteExpiresAtStateVersion: 7,
      postInstallRezQuoteComplete: true,
      postInstallRezQuoteCostKind: "fixed",
      postInstallRezQuoteBaseCredits: source.rezCost ?? 0,
      postInstallRezQuoteFinalCredits: source.rezCost ?? 0,
      postInstallRezQuoteMandatoryAgendaPointCost: 0,
    },
  };
}

function variableFundedIce(
  instanceId: string,
  definitionId: string,
  variableParameter: VisibleVariableCorpRezCostParameter,
): CorpFundedScoreProtectionIceInput {
  const card = definition(definitionId);
  return {
    instanceId,
    definitionId,
    known: true,
    rezzed: false,
    ...(card.strength !== undefined ? { strength: card.strength } : {}),
    subtypes: card.subtypes.slice(),
    effectiveRezCostQuote: {
      context: "installed",
      cardId: instanceId,
      targetServerId: "remote_1",
      projectedServerId: "remote_1",
      expiresAtStateVersion: 7,
      complete: true,
      costKind: "variable",
      baseCredits: card.rezCost ?? 0,
      finalCredits: card.rezCost ?? 0,
      mandatoryAdditionalCosts: { agendaPoints: 0 },
      variableParameter,
    },
  };
}

function sandstormRezParameter(): Extract<
  VisibleVariableCorpRezCostParameter,
  { kind: "paid_end_the_run_subroutines" }
> {
  return {
    kind: "paid_end_the_run_subroutines",
    additionalCreditsPerSubroutine: 2,
    minSubroutines: 0,
    minSubroutinesFinalCredits: 4,
    firstEndTheRunSubroutineCount: 1,
    firstEndTheRunFinalCredits: 6,
  };
}

function creditBlocksRezParameter(): Extract<
  VisibleVariableCorpRezCostParameter,
  { kind: "alternate_subtype" }
> {
  return {
    kind: "alternate_subtype",
    baseSubtypes: ["sentry"],
    baseSubtypesFinalCredits: 6,
    alternateSubtypes: ["wall"],
    alternateSubtypesAdditionalCredits: 1,
    alternateSubtypesFinalCredits: 7,
  };
}

function homingMissileRezParameter(): Extract<
  VisibleVariableCorpRezCostParameter,
  { kind: "x_strength" }
> {
  return {
    kind: "x_strength",
    additionalCreditsPerValue: 1,
    minValue: 0,
    maxValue: 8,
    minValueFinalCredits: 4,
    maxValueFinalCredits: 12,
    effectiveStrengthFromValue: true,
    traceLimitFromValue: true,
  };
}

function fundedIce(
  instanceId: string,
  definitionId: string,
  rezzed: boolean,
): CorpFundedScoreProtectionIceInput & {
  effectiveRezCostQuote: Extract<
    VisibleCorpRezCostQuote,
    { context: "installed"; complete: true }
  >;
} {
  const card = definition(definitionId);
  return {
    instanceId,
    definitionId,
    known: true,
    rezzed,
    ...(card.strength !== undefined ? { strength: card.strength } : {}),
    subtypes: card.subtypes.slice(),
    effectiveRezCostQuote: {
      context: "installed",
      cardId: instanceId,
      targetServerId: "remote_1",
      projectedServerId: "remote_1",
      expiresAtStateVersion: 7,
      complete: true,
      costKind: "fixed",
      baseCredits: card.rezCost ?? 0,
      finalCredits: card.rezCost ?? 0,
      mandatoryAdditionalCosts: { agendaPoints: 0 },
    },
  };
}

function handIce(instanceId: string, definitionId: string): VisibleCard {
  const card = definition(definitionId);
  return {
    instanceId,
    definitionId,
    known: true,
    title: card.title,
    type: "ice",
    strength: card.strength,
    subtypes: card.subtypes.slice(),
    rezCost: card.rezCost,
    owner: "corp",
  } as VisibleCard;
}

function blink(): VisibleCard {
  return runnerProgram("blink", "onr_v1_007_blink");
}

function runnerProgram(instanceId: string, definitionId: string): VisibleCard {
  const card = definition(definitionId);
  return {
    instanceId,
    definitionId: card.id,
    known: true,
    title: card.title,
    type: "program",
    strength: card.strength,
    subtypes: card.subtypes.slice(),
    owner: "runner",
  } as VisibleCard;
}

function recurringCreditPool(
  instanceId: string,
  use: "using_icebreaker_during_run_non_noisy",
): VisibleCard {
  const card = definition("onr_v1_011_cloak");
  return {
    instanceId,
    definitionId: card.id,
    known: true,
    title: card.title,
    type: "program",
    subtypes: card.subtypes.slice(),
    owner: "runner",
    counterDisplays: [
      {
        id: `${instanceId}-recurring`,
        amount: 1,
        displayKind: "recurring_credit",
        label: "Recurring credits",
        ariaLabel: "Recurring credits",
        creditPool: {
          kind: "recurring_credit",
          uses: [use],
        },
      },
    ],
  } as VisibleCard;
}

function definition(definitionId: string) {
  const card = CARD_DEFINITIONS_BY_ID[definitionId];
  if (!card) throw new Error(`Missing test definition ${definitionId}`);
  return card;
}
