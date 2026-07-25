import {
  CARD_DEFINITIONS_BY_ID,
  type LegalAction,
  type VisibleCard,
  type VisibleCorpRezCostQuote,
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
    const wall = fundedIce(
      "data-wall",
      "onr_v1_238_data-wall-2-0",
      false,
    );
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

  it("fails closed on missing, incomplete, or non-credit rez obligations", () => {
    const wall = fundedIce(
      "data-wall",
      "onr_v1_238_data-wall-2-0",
      false,
    );
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
    expect(
      fundedAssessment({
        serverIce: [
          {
            ...wall,
            effectiveRezCostQuote: {
              ...wall.effectiveRezCostQuote!,
              mandatoryAdditionalCosts: { agendaPoints: 1 },
            },
          },
        ],
        corpCredits: 5,
        threshold: HALF,
      }),
    ).toMatchObject({
      knowledge: "unknown",
      unknownReason: "unsupported_mandatory_rez_cost",
    });
  });

  it("fails closed when an effective rez quote drifts by card, server, or state", () => {
    const wall = fundedIce(
      "data-wall",
      "onr_v1_238_data-wall-2-0",
      false,
    );
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
    const wall = fundedIce(
      "data-wall",
      "onr_v1_238_data-wall-2-0",
      false,
    );
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
    const wall = fundedIce(
      "data-wall",
      "onr_v1_238_data-wall-2-0",
      false,
    );
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
      expectedTargetServerId:
        overrides.expectedTargetServerId ?? "remote_1",
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
    expect(certifies(need, { expectedTargetServerId: "remote_2" })).toBe(
      false,
    );
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
    });

    expect(route).toMatchObject({
      knowledge: "known",
      effect: "no_progress",
      funded: false,
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
      source: handIce("filter", "onr_v1_244_filter"),
      targetServerId: "remote_1",
      currentIce: [],
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

  it("rejects mandatory agenda-point cost in a post-install rez quote", () => {
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
            postInstallRezQuoteMandatoryAgendaPointCost: 1,
            postInstallRezQuoteMandatoryAdditionalCostKind: "agenda_point",
          },
        },
      }),
    ).toMatchObject({
      knowledge: "unknown",
      unknownReason: "unsupported_mandatory_rez_cost",
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
            postInstallRezQuoteReductionSourceDefinitionIds:
              "encoder,encoder",
          },
        },
      }),
    ).toMatchObject({
      knowledge: "known",
      effect: "progress",
    });
  });
});

function routeFor(params: {
  source: VisibleCard;
  targetServerId: "new_remote" | "remote_1";
  currentIce?: CorpFundedScoreProtectionIceInput[];
  corpCredits: number;
  scoreReserve?: CorpScoreReserve;
}) {
  return projectCorpFundedIceInstallRoute(routeSetup(params));
}

function routeSetup(params: {
  source: VisibleCard;
  targetServerId: "new_remote" | "remote_1";
  currentIce?: CorpFundedScoreProtectionIceInput[];
  corpCredits: number;
  scoreReserve?: CorpScoreReserve;
}) {
  const currentIce = params.currentIce ?? [];
  const scoreReserve = params.scoreReserve ?? NO_RESERVE;
  const baseline = fundedAssessment({
    serverIce: currentIce,
    corpCredits: params.corpCredits,
    scoreReserve,
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
    visibleCorpHand: [params.source],
    ...(params.targetServerId === "new_remote"
      ? {}
      : {
          currentServer: {
            id: params.targetServerId,
            ice: currentIce,
          },
        }),
    runnerRig: [blink()],
    runnerCredits: 0,
    projectedInstallCredits:
      params.targetServerId === "new_remote" ? 0 : currentIce.length,
    projectedInstallClicks: 1,
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
}): CorpFundedScoreProtectionAssessment {
  return assessBestFundedCorpScoreProtection({
    serverIce: params.serverIce,
    runnerRig: [blink()],
    runnerCredits: 0,
    targetServerId: "remote_1",
    observedAtStateVersion: 7,
    availableCorpCredits: params.corpCredits,
    availableCorpClicks: params.corpClicks ?? 3,
    scoreReserve: params.scoreReserve ?? NO_RESERVE,
    maximumRunnerAccessSuccessProbability: params.threshold ?? QUARTER,
  });
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
      postInstallRezQuoteBaseCredits: source.rezCost ?? 0,
      postInstallRezQuoteFinalCredits: source.rezCost ?? 0,
      postInstallRezQuoteMandatoryAgendaPointCost: 0,
    },
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
  const card = definition("onr_v1_007_blink");
  return {
    instanceId: "blink",
    definitionId: card.id,
    known: true,
    title: card.title,
    type: "program",
    strength: card.strength,
    subtypes: card.subtypes.slice(),
    owner: "runner",
  } as VisibleCard;
}

function definition(definitionId: string) {
  const card = CARD_DEFINITIONS_BY_ID[definitionId];
  if (!card) throw new Error(`Missing test definition ${definitionId}`);
  return card;
}
