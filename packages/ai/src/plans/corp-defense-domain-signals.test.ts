import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it, vi } from "vitest";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import {
  corpGlobalDefenseInstallRouteAssessment,
  corpIceInstallHasCurrentCompleteRezQuote,
  corpQualitativeIceStagingSignal,
  type CorpDefenseDomainSignalFacts,
} from "./corp-defense-domain-signals";

describe("corp defense domain signals", () => {
  it("requires the exact current complete post-install rez quote", () => {
    const input = {
      playerView: { stateVersion: 12 },
    } as unknown as AiDecisionInput;
    const action = {
      payload: {
        postInstallRezQuoteComplete: true,
        postInstallRezQuoteCardId: "ice-1",
        postInstallRezQuoteTargetServerId: "hq",
        postInstallRezQuoteExpiresAtStateVersion: 12,
        postInstallRezQuoteFinalCredits: 4,
      },
    } as unknown as LegalAction;

    expect(
      corpIceInstallHasCurrentCompleteRezQuote(input, action, "ice-1", "hq"),
    ).toBe(true);
    expect(
      corpIceInstallHasCurrentCompleteRezQuote(
        {
          ...input,
          playerView: { ...input.playerView, stateVersion: 13 },
        },
        action,
        "ice-1",
        "hq",
      ),
    ).toBe(false);
  });

  it("keeps an unbound new remote outside global defense ownership", () => {
    const facts = unusedFacts();

    expect(
      corpGlobalDefenseInstallRouteAssessment(
        {} as AiDecisionInput,
        {} as ActionSemanticCandidate,
        "new_remote",
        undefined,
        facts,
      ),
    ).toEqual({
      knowledge: "known",
      disposition: "effect_missing",
      evidenceCode:
        "corp_global_defense_cannot_invent_an_unbound_new_remote_objective",
    });
    expect(facts.hasExactNonNegativeCostProfile).not.toHaveBeenCalled();
    expect(facts.archivesHasVisibleKnownAgenda).not.toHaveBeenCalled();
  });

  it("does not create qualitative staging outside an existing server", () => {
    const facts = unusedFacts();

    expect(
      corpQualitativeIceStagingSignal(
        {} as AiDecisionInput,
        {} as ActionSemanticCandidate,
        "new_remote",
        undefined,
        facts,
      ),
    ).toBeUndefined();
    expect(facts.hasExactNonNegativeCostProfile).not.toHaveBeenCalled();
  });
});

function unusedFacts(): CorpDefenseDomainSignalFacts {
  return {
    hasExactNonNegativeCostProfile: vi.fn(),
    archivesHasVisibleKnownAgenda: vi.fn(),
  };
}
