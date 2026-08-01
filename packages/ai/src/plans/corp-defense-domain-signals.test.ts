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

  it("admits a useful second or third unrezzed layer for a bound score remote", () => {
    const { input, candidate, facts } = layeredRemoteFixture(2, 1, 8);

    const signal = corpQualitativeIceStagingSignal(
      input,
      candidate,
      "remote_1",
      undefined,
      facts,
      { kind: "score", parentProjectId: "score-project-1" },
    );

    expect(signal).toMatchObject({
      kind: "generic",
      serverId: "remote_1",
      phase: "install_defense_support",
      sourceDefinitionIds: ["onr_v1_237_data-wall"],
    });
    expect(signal?.evidenceCode).toContain(
      "corp_layered_remote_ice_staging:score:score-project-1",
    );
  });

  it("rejects a low-marginal extra layer without imposing a fixed layer cap", () => {
    const { input, candidate, facts } = layeredRemoteFixture(4, 8, 6);

    expect(
      corpQualitativeIceStagingSignal(
        input,
        candidate,
        "remote_1",
        undefined,
        facts,
        { kind: "remote", parentProjectId: "remote-project-1" },
      ),
    ).toBeUndefined();
  });
});

function layeredRemoteFixture(
  existingUnrezzedLayers: number,
  rezCredits: number,
  corpCredits: number,
): {
  input: AiDecisionInput;
  candidate: ActionSemanticCandidate;
  facts: CorpDefenseDomainSignalFacts;
} {
  const stateVersion = 17;
  const source = {
    instanceId: "candidate-ice",
    definitionId: "onr_v1_237_data-wall",
    owner: "corp",
    side: "corp",
    known: true,
    type: "ice",
    rezzed: false,
    strength: 0,
    subtypes: ["wall"],
  };
  const action = {
    actionId: "install-candidate-ice",
    side: "corp",
    type: "install_card",
    source: source.instanceId,
    costs: [{ clicks: 1, credits: 1 }],
    targetRequirements: [],
    choiceRequirements: [],
    expiresAtStateVersion: stateVersion,
    payload: {
      placement: "ice",
      serverId: "remote_1",
      postInstallRezQuoteComplete: true,
      postInstallRezQuoteCardId: source.instanceId,
      postInstallRezQuoteTargetServerId: "remote_1",
      postInstallRezQuoteProjectedServerId: "remote_1",
      postInstallRezQuoteExpiresAtStateVersion: stateVersion,
      postInstallRezQuoteFinalCredits: rezCredits,
    },
  } as unknown as LegalAction;
  const input = {
    legalActions: [action],
    playerView: {
      stateVersion,
      own: {
        credits: corpCredits,
        clicks: 3,
        gripOrHq: [source],
        maxHandSize: 5,
      },
      servers: [
        { id: "hq", ice: [], root: [] },
        { id: "rd", ice: [], root: [] },
        { id: "archives", ice: [], root: [] },
        {
          id: "remote_1",
          root: [],
          ice: Array.from({ length: existingUnrezzedLayers }, (_, index) => ({
            ...source,
            instanceId: `existing-ice-${index + 1}`,
          })),
        },
      ],
    },
  } as unknown as AiDecisionInput;
  const candidate = {
    actionId: action.actionId,
    sourceDefinitionId: source.definitionId,
    semanticActionType: "install.card",
    costProfile: {
      clickCost: 1,
      creditCost: 1,
      additionalCosts: [],
    },
  } as unknown as ActionSemanticCandidate;
  return {
    input,
    candidate,
    facts: {
      hasExactNonNegativeCostProfile: vi.fn(() => true),
      archivesHasVisibleKnownAgenda: vi.fn(() => false),
    },
  };
}

function unusedFacts(): CorpDefenseDomainSignalFacts {
  return {
    hasExactNonNegativeCostProfile: vi.fn(),
    archivesHasVisibleKnownAgenda: vi.fn(),
  };
}
