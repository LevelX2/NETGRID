import { describe, expect, it } from "vitest";
import type { VisibleCard } from "@netgrid/shared";
import type { KnownRezzedIcePathAssessment } from "../visible-run-analysis";
import {
  assessCorpRemoteMaturity,
  assessCorpRemoteMaturityFromVisibleServer,
  quoteCorpRemotePath,
  requiredGeneralCreditTax,
} from "./corp-remote-maturity-assessment";

describe("Corp remote maturity policy", () => {
  it("uses the versioned relative tax bands with their absolute floors", () => {
    expect(requiredGeneralCreditTax("score_window", 20)).toBe(7);
    expect(requiredGeneralCreditTax("taxing", 20)).toBe(10);
    expect(requiredGeneralCreditTax("glacier", 20)).toBe(13);
    expect(requiredGeneralCreditTax("glacier", 4)).toBe(4);
  });

  it("keeps general and restricted Runner credits separate", () => {
    const quote = quoteCorpRemotePath({
      assessment: path({
        creditsAfterPath: 8,
        creditBudgetAfterPath: {
          credits: 8,
          icebreakerCredits: 1,
          nonStealthNonNoisyIcebreakerCredits: 0,
          stealthNonNoisyIcebreakerCredits: 1,
          stealthCreditsBySourceId: { cloak: 1 },
          hostedIcebreakerCreditsByBreakerInstanceId: { breaker: 0 },
        },
      }),
      expectedKnownIceCount: 2,
      runnerCreditBudgetBefore: {
        credits: 8,
        icebreakerCredits: 3,
        nonStealthNonNoisyIcebreakerCredits: 2,
        stealthNonNoisyIcebreakerCredits: 2,
        stealthCreditsBySourceId: { cloak: 2 },
        hostedIcebreakerCreditsByBreakerInstanceId: { breaker: 2 },
      },
    });
    expect(quote.generalCreditTax).toBe(0);
    expect(quote.restrictedCreditsSpent).toEqual({
      breaker: 2,
      stealth: 1,
      hosted: 2,
      other: 2,
    });
  });

  it("does not invent certainty for a partial or conditional path", () => {
    const maturity = assessCorpRemoteMaturity({
      observedAtStateVersion: 17,
      targetBand: "score_window",
      funded: {
        assessment: path({ assessedKnownIceCount: 1 }),
        expectedKnownIceCount: 2,
        runnerCreditBudgetBefore: { credits: 10 },
      },
      staged: {
        assessment: path({
          conditionalRiskReasons: ["conditional_trace_bid"],
        }),
        expectedKnownIceCount: 2,
        runnerCreditBudgetBefore: { credits: 10 },
      },
      selectedFundedRezIceIds: [],
      minimumSatisfyingStagedIceIds: [],
    });
    expect(maturity).toEqual({
      knowledge: "unknown",
      observedAtStateVersion: 17,
      unknownReasons: ["funded_path_assessment_unknown"],
    });
  });

  it("accepts explicit non-credit hazards without converting them into credits", () => {
    const maturity = assessCorpRemoteMaturity({
      observedAtStateVersion: 18,
      targetBand: "score_window",
      funded: {
        assessment: path({
          visibleIceRunHazards: [
            {
              kind: "trace_damage",
              severity: "high",
              effectType: "net_damage",
              effectTiming: "before_access",
              preventsAccess: false,
              canCauseFlatlineBeforeAccess: false,
              iceIndex: 0,
              subroutineId: "sub-1",
              runnerTraceCapacity: 0,
              unavoidable: true,
              expectedDamage: 2,
              penalty: 10,
              evidence: [],
            },
          ],
        }),
        expectedKnownIceCount: 2,
        runnerCreditBudgetBefore: { credits: 10 },
      },
      staged: {
        assessment: path({
          creditsAfterPath: 6,
          creditBudgetAfterPath: { credits: 6 },
        }),
        expectedKnownIceCount: 2,
        runnerCreditBudgetBefore: { credits: 10 },
      },
      selectedFundedRezIceIds: ["ice-1"],
      minimumSatisfyingStagedIceIds: ["ice-1", "ice-2"],
      minimumRezFundingGap: 3,
    });
    expect(maturity.knowledge).toBe("known");
    if (maturity.knowledge !== "known") return;
    expect(maturity.fundedTargetReached).toBe(true);
    expect(maturity.fundedPath.generalCreditTax).toBe(0);
    expect(maturity.stagedTargetReached).toBe(true);
  });

  it("keeps independently known rez subsets when one candidate quote is unknown", () => {
    const knownIce: VisibleCard = {
      instanceId: "known-ice",
      definitionId: "known-ice-definition",
      title: "Known ICE",
      known: true,
      type: "ice",
      owner: "corp",
      controller: "corp",
      rezzed: false,
      effectiveRezCostQuote: {
        context: "installed",
        cardId: "known-ice",
        targetServerId: "remote_1",
        projectedServerId: "remote_1",
        expiresAtStateVersion: 19,
        complete: true,
        costKind: "fixed",
        baseCredits: 1,
        finalCredits: 1,
        mandatoryAdditionalCosts: { agendaPoints: 0 },
      },
      effectivePostRezRunQuote: {
        context: "installed_post_rez",
        cardId: "known-ice",
        iceDefinitionId: "known-ice-definition",
        targetServerId: "remote_1",
        projectedServerId: "remote_1",
        expiresAtStateVersion: 19,
        complete: true,
        effectiveRunQuote: {
          iceInstanceId: "known-ice",
          iceDefinitionId: "known-ice-definition",
          effectiveStrength: 0,
          subroutines: [],
        },
      },
    };
    const unknownIce: VisibleCard = {
      instanceId: "unknown-ice",
      definitionId: "unknown-ice-definition",
      title: "Unknown quote ICE",
      known: true,
      type: "ice",
      owner: "corp",
      controller: "corp",
      rezzed: false,
    };

    const maturity = assessCorpRemoteMaturityFromVisibleServer({
      observedAtStateVersion: 19,
      targetServerId: "remote_1",
      targetBand: "score_window",
      serverIce: [knownIce, unknownIce],
      runnerRig: [],
      runnerCreditBudget: { credits: 10 },
      availableCorpRezCredits: 1,
    });

    expect(maturity.knowledge).toBe("known");
    if (maturity.knowledge !== "known") return;
    expect(maturity.selectedFundedRezIceIds).toEqual([]);
    expect(maturity.stagedTargetReached).toBe(false);
  });
});

function path(
  overrides: Partial<KnownRezzedIcePathAssessment> = {},
): KnownRezzedIcePathAssessment {
  return {
    blocked: false,
    canReachAccess: true,
    knownPathBlockedByUnbreakableIce: false,
    knownPathBlockedByMissingCoverage: false,
    knownPathBlockedByEtr: false,
    creditsAfterPath: 10,
    creditBudgetAfterPath: { credits: 10 },
    canBreakNextIceButNotFullPath: false,
    hasBypassOrSpecialAccessPlan: false,
    creditsSpentBeforeUnpayableIce: 0,
    assessedKnownIceCount: 2,
    ...overrides,
  };
}
