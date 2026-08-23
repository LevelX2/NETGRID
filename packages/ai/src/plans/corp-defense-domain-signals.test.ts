import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it, vi } from "vitest";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { CorpCorePlanDomain } from "./corp-core-plan-modules";
import {
  assessBestFundedCorpScoreProtection,
  projectCorpFundedIceInstallRoute,
  type KnownCorpFundedIceInstallRouteProjection,
  type KnownCorpFundedScoreProtectionAssessment,
} from "../runtime/corp-funded-score-protection";
import {
  corpGlobalDefenseInstallRouteAssessment,
  corpIceInstallHasCurrentCompleteRezQuote,
  corpQualitativeIceStagingSignal,
  type CorpDefenseDomainSignalFacts,
} from "./corp-defense-domain-signals";

vi.mock("../runtime/corp-funded-score-protection", async () => {
  const actual = await vi.importActual<
    typeof import("../runtime/corp-funded-score-protection")
  >("../runtime/corp-funded-score-protection");
  return {
    ...actual,
    assessBestFundedCorpScoreProtection: vi.fn(
      actual.assessBestFundedCorpScoreProtection,
    ),
    projectCorpFundedIceInstallRoute: vi.fn(
      actual.projectCorpFundedIceInstallRoute,
    ),
  };
});

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

  it("allows one exact parent-bound new-remote ICE route without opening generic ownership", () => {
    const { input, candidate, facts } = layeredRemoteFixture(0, 2, 4);
    input.playerView.opponent = { credits: 4, rig: [] } as never;
    const action = input.legalActions[0]!;
    action.payload = {
      ...action.payload,
      serverId: "new_remote",
      postInstallRezQuoteTargetServerId: "new_remote",
      postInstallRezQuoteProjectedServerId: "remote_2",
      postInstallEffectiveRunQuoteJson: JSON.stringify({
        iceInstanceId: "candidate-ice",
        iceDefinitionId: "onr_v1_237_data-wall",
        effectiveStrength: 0,
        subroutines: [{ id: "sub-1", type: "end_the_run" }],
      }),
    };

    expect(
      corpQualitativeIceStagingSignal(
        input,
        candidate,
        "new_remote",
        undefined,
        facts,
        {
          kind: "remote",
          parentProjectId: "strategic-score-remote",
          parentNeedId: "remote-hardening:strategic-score-remote:0",
          targetRecoveryTurns: 2,
        },
      ),
    ).toMatchObject({
      kind: "generic",
      serverId: "new_remote",
      parentKind: "remote",
      parentProjectId: "strategic-score-remote",
      parentNeedId: "remote-hardening:strategic-score-remote:0",
    });
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

  it("keeps an already funded central rez route ahead of an additional ICE install", () => {
    const { input, candidate, facts } = layeredRemoteFixture(1, 3, 1);
    const remoteAction = input.legalActions[0]!;
    input.playerView.servers[0]!.ice = [
      {
        instanceId: "hq-data-wall",
        definitionId: "onr_v1_237_data-wall",
        owner: "corp",
        side: "corp",
        known: true,
        type: "ice",
        rezzed: false,
        strength: 0,
        subtypes: ["wall"],
        effectiveRezCostQuote: {
          context: "installed",
          cardId: "hq-data-wall",
          targetServerId: "hq",
          projectedServerId: "hq",
          expiresAtStateVersion: input.playerView.stateVersion,
          complete: true,
          costKind: "fixed",
          baseCredits: 1,
          finalCredits: 1,
          mandatoryAdditionalCosts: { agendaPoints: 0 },
        },
      },
    ];
    const centralAllocation = {
      status: "known",
      selectedServerId: "hq",
      evidence: {
        hq: { threat: "material" },
        rd: { threat: "none" },
      },
      canonicalNearTieCandidateServerIds: ["hq"],
      hqHold: { status: "ineligible" },
    } as unknown as CorpCorePlanDomain["centralDefenseAllocation"];

    expect(
      corpQualitativeIceStagingSignal(
        input,
        candidate,
        "remote_1",
        centralAllocation,
        facts,
        { kind: "score", parentProjectId: "score-project-1" },
      ),
    ).toBeUndefined();

    const hqCandidate = {
      ...candidate,
      actionId: "install-candidate-ice-hq",
    } as ActionSemanticCandidate;
    input.legalActions = [
      {
        ...input.legalActions[0]!,
        actionId: hqCandidate.actionId,
        payload: {
          ...input.legalActions[0]!.payload,
          serverId: "hq",
          postInstallRezQuoteTargetServerId: "hq",
          postInstallRezQuoteProjectedServerId: "hq",
        },
      },
    ];
    expect(
      corpQualitativeIceStagingSignal(
        input,
        hqCandidate,
        "hq",
        centralAllocation,
        facts,
      ),
    ).toBeUndefined();
    expect(
      corpGlobalDefenseInstallRouteAssessment(
        input,
        hqCandidate,
        "hq",
        centralAllocation,
        facts,
      ),
    ).toEqual({
      knowledge: "known",
      disposition: "effect_missing",
      evidenceCode:
        "corp_additional_ice_install_consumes_known_central_rez_reserve:hq",
    });

    input.playerView.own.credits = 2;
    input.legalActions = [remoteAction];
    expect(
      corpQualitativeIceStagingSignal(
        input,
        candidate,
        "remote_1",
        centralAllocation,
        facts,
        { kind: "score", parentProjectId: "score-project-1" },
      ),
    ).toMatchObject({
      kind: "generic",
      serverId: "remote_1",
      phase: "install_defense_support",
    });
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

  it("keeps a qualitative known route's source rez funding gap numeric", () => {
    const { input, candidate, action } = qualitativeCentralRouteFixture();
    const baseline = knownFundedAssessment();
    vi.mocked(assessBestFundedCorpScoreProtection).mockReturnValueOnce(
      baseline,
    );
    vi.mocked(projectCorpFundedIceInstallRoute).mockReturnValueOnce({
      knowledge: "known",
      actionId: action.actionId,
      sourceCardInstanceId: action.source,
      sourceDefinitionId: candidate.sourceDefinitionId!,
      targetServerId: "hq",
      before: baseline,
      after: { ...baseline },
      effect: "no_progress",
      evidence: [],
      installCredits: 1,
      installClicks: 1,
      installCostSource: "legal_action_agreed_projection",
      selectedRezCosts: [],
      creditsAfterDefense: 4,
      clicksAfterDefense: 2,
      preservesScoreCreditReserve: true,
      preservesHardClickReserve: true,
      preservesReserves: true,
      funded: false,
    } as unknown as KnownCorpFundedIceInstallRouteProjection);

    expect(
      corpGlobalDefenseInstallRouteAssessment(
        input,
        candidate,
        "hq",
        undefined,
        {
          hasExactNonNegativeCostProfile: vi.fn(() => true),
          archivesHasVisibleKnownAgenda: vi.fn(() => false),
        },
      ),
    ).toMatchObject({
      knowledge: "known",
      disposition: "productive",
      progressKind: "funded_structured_central_defense",
      rezFundingGap: 0,
    });
  });
});

function qualitativeCentralRouteFixture(): {
  input: AiDecisionInput;
  candidate: ActionSemanticCandidate;
  action: LegalAction;
} {
  const stateVersion = 29;
  const source = {
    instanceId: "shock-r",
    definitionId: "onr_v1_268_shock-r",
    owner: "corp",
    side: "corp",
    known: true,
    type: "ice",
    rezzed: false,
    strength: 3,
    subtypes: ["sentry"],
    effectiveRunQuote: {
      iceInstanceId: "shock-r",
      iceDefinitionId: "onr_v1_268_shock-r",
      effectiveStrength: 3,
      subroutines: [
        {
          id: "shock-r-lock",
          type: "set_next_encounter_lock",
          breakTags: ["stun"],
        },
      ],
    },
  };
  const action = {
    actionId: "install-shock-r-hq",
    side: "corp",
    type: "install_card",
    source: source.instanceId,
    costs: [{ clicks: 1, credits: 1 }],
    targetRequirements: [],
    choiceRequirements: [],
    expiresAtStateVersion: stateVersion,
    payload: {
      cardId: source.instanceId,
      sourceDefinitionId: source.definitionId,
      placement: "ice",
      serverId: "hq",
      postInstallRezQuoteComplete: true,
      postInstallRezQuoteCardId: source.instanceId,
      postInstallRezQuoteTargetServerId: "hq",
      postInstallRezQuoteProjectedServerId: "hq",
      postInstallRezQuoteExpiresAtStateVersion: stateVersion,
      postInstallRezQuoteFinalCredits: 4,
    },
  } as unknown as LegalAction;
  return {
    action,
    input: {
      legalActions: [action],
      playerView: {
        stateVersion,
        turnSerial: 1,
        own: {
          credits: 5,
          clicks: 3,
          agendaPoints: 0,
          gripOrHq: [source],
          heapOrArchives: [],
          maxHandSize: 5,
        },
        opponent: { credits: 5, rig: [] },
        servers: [
          { id: "hq", ice: [], root: [] },
          { id: "rd", ice: [], root: [] },
          { id: "archives", ice: [], root: [] },
        ],
      },
    } as unknown as AiDecisionInput,
    candidate: {
      actionId: action.actionId,
      sourceCardInstanceId: source.instanceId,
      sourceDefinitionId: source.definitionId,
      semanticActionType: "install.card",
      costProfile: {
        clickCost: 1,
        creditCost: 1,
        costKnownStatus: "known",
        additionalCosts: [],
      },
    } as unknown as ActionSemanticCandidate,
  };
}

function knownFundedAssessment(): KnownCorpFundedScoreProtectionAssessment {
  return {
    knowledge: "known",
    availableCorpCredits: 5,
    availableCorpClicks: 3,
    availableCorpAgendaPoints: 0,
    totalScoreReserveCredits: 0,
    hardClickReserve: 0,
    fundedProtection: false,
    scoreReserveFingerprint: "none",
    protection: {
      knowledge: "known",
      protectsScore: false,
      maximumRunnerAccessSuccessProbability: { numerator: 1, denominator: 2 },
      runnerAccessSuccessProbability: { numerator: 1, denominator: 1 },
      runnerCreditsRemainingOnBestAccessPath: 5,
      evidence: [],
    },
    selectedRezCosts: [],
    totalSelectedRezCost: 0,
    totalSelectedAgendaPointCost: 0,
    creditsAfterDefense: 5,
    agendaPointsAfterDefense: 0,
    clicksAfterDefense: 3,
    preservesScoreCreditReserve: true,
    preservesHardClickReserve: true,
    evidence: [],
  } as unknown as KnownCorpFundedScoreProtectionAssessment;
}

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
