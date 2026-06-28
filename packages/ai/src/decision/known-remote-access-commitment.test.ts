import { describe, expect, it } from "vitest";

import type {
  AiDecisionInput,
  PlayerView,
  VisibleCard,
} from "@netgrid/shared";
import {
  knownRemoteAgendaAccessCommitment,
  knownRemoteRootHasHighImpactRole,
  projectKnownRemoteTrashCommitment,
  trashSupportEffectTargetHasFreeTrash,
} from "./known-remote-access-commitment";

describe("known remote access commitment", () => {
  it("matches high-impact remote root roles by bounded role terms", () => {
    expect(knownRemoteRootHasHighImpactRole(["asset_economy"])).toBe(true);
    expect(knownRemoteRootHasHighImpactRole(["holovid_campaign"])).toBe(true);
    expect(knownRemoteRootHasHighImpactRole(["access_tax"])).toBe(true);
    expect(knownRemoteRootHasHighImpactRole(["access_taxish_noise"])).toBe(
      false,
    );
    expect(knownRemoteRootHasHighImpactRole(["microeconomy_noise"])).toBe(
      false,
    );
    expect(knownRemoteRootHasHighImpactRole(["campaigner_noise"])).toBe(false);
  });

  it("models agenda access as a steal commitment", () => {
    expect(
      knownRemoteAgendaAccessCommitment("remote_1", [
        "known_remote_agenda_root:root:0",
      ]),
    ).toMatchObject({
      serverId: "remote_1",
      knownAccessState: "known_payoff",
      intendedAccessAction: "steal",
      reason: "agenda_payoff",
      evidence: expect.arrayContaining([
        "known_remote_access_commitment_intended_action:steal",
        "known_remote_access_commitment_reason:agenda_payoff",
        "known_remote_agenda_root:root:0",
      ]),
    });
  });

  it("declines known finite-pool economy trash when reserve would break", () => {
    const projection = projectKnownRemoteTrashCommitment(aiInput({ credits: 4 }), {
      serverId: "remote_1",
      definitionId: "onr_v1_326_holovid-campaign",
      rootType: "asset",
      trashCost: 4,
      creditsAfterPath: 4,
      visibleCard: visibleCard("holovid", {
        definitionId: "onr_v1_326_holovid-campaign",
        title: "Holovid Campaign",
        type: "asset",
        counters: { bit: 5 },
      }),
    });

    expect(projection).toMatchObject({
      payoff: "trash_unaffordable",
      accessDecision: "defer_until_funded",
      declineReason: "reserve_would_break",
      knownNoCurrentPayoff: true,
      preservesReserve: false,
      commitment: {
        knownAccessState: "known_no_current_payoff",
        intendedAccessAction: "decline",
        reason: "reserve_would_break",
      },
    });
    expect(projection.evidence).toEqual(
      expect.arrayContaining([
        "known_remote_root_finite_pool_economy:true",
        "known_remote_root_corp_value_remaining:5",
      ]),
    );
    expect(projection.commitment.evidence).toContain(
      "known_remote_access_commitment_reason:reserve_would_break",
    );
  });

  it("keeps insufficient credits distinct from reserve preservation", () => {
    const projection = projectKnownRemoteTrashCommitment(aiInput({ credits: 2 }), {
      serverId: "remote_1",
      definitionId: "onr_v1_326_holovid-campaign",
      rootType: "asset",
      trashCost: 4,
      creditsAfterPath: 2,
      visibleCard: visibleCard("holovid", {
        definitionId: "onr_v1_326_holovid-campaign",
        title: "Holovid Campaign",
        type: "asset",
        counters: { bit: 5 },
      }),
    });

    expect(projection).toMatchObject({
      payoff: "trash_unaffordable",
      accessDecision: "defer_until_funded",
      declineReason: "insufficient_credits",
      technicallyAffordable: false,
      commitment: {
        knownAccessState: "known_no_current_payoff",
        intendedAccessAction: "decline",
        reason: "insufficient_credits",
      },
    });
    expect(projection.commitment.evidence).toContain(
      "known_remote_access_commitment_reason:insufficient_credits",
    );
  });

  it("keeps affordable non-pooled remote trash as a trash commitment", () => {
    const projection = projectKnownRemoteTrashCommitment(aiInput({ credits: 8 }), {
      serverId: "remote_1",
      definitionId: "neutral-known-asset",
      rootType: "asset",
      trashCost: 4,
      creditsAfterPath: 8,
      visibleCard: visibleCard("neutral-asset", {
        definitionId: "neutral-known-asset",
        title: "Neutral Asset",
        type: "asset",
      }),
    });

    expect(projection).toMatchObject({
      payoff: "trash_affordable",
      accessDecision: "trash",
      contestable: true,
      commitment: {
        knownAccessState: "known_payoff",
        intendedAccessAction: "trash",
        reason: "trash_affordable",
      },
    });
    expect(projection.evidence).toEqual(
      expect.arrayContaining([
        "known_remote_root_finite_pool_economy:false",
        "known_remote_root_trash_dedicated_credits:0",
      ]),
    );
  });

  it("uses bounded free-trash support from installed runner cards", () => {
    const projection = projectKnownRemoteTrashCommitment(
      aiInput({
        credits: 8,
        rig: [
          visibleCard("kilroy", {
            definitionId: "onr_v1_096_kilroy-was-here",
            title: "Kilroy Was Here",
            type: "event",
          }),
        ],
      }),
      {
        serverId: "remote_1",
        definitionId: "neutral-known-asset",
        rootType: "asset",
        trashCost: 4,
        creditsAfterPath: 8,
        visibleCard: visibleCard("neutral-asset", {
          definitionId: "neutral-known-asset",
          title: "Neutral Asset",
          type: "asset",
        }),
      },
    );

    expect(projection).toMatchObject({
      generalTrashCost: 0,
      creditsAfterTrash: 8,
      evidence: expect.arrayContaining([
        "known_remote_root_free_trash_support:true",
        "known_remote_root_trash_support_source:onr_v1_096_kilroy-was-here",
      ]),
    });
  });

  it("matches free-trash effect targets by bounded marker segments", () => {
    expect(trashSupportEffectTargetHasFreeTrash("free_trash")).toBe(true);
    expect(trashSupportEffectTargetHasFreeTrash("access.free_trash")).toBe(true);
    expect(trashSupportEffectTargetHasFreeTrash("not_free_trash_noise")).toBe(
      false,
    );
  });

  it("uses supplied runner economy posture as access reserve basis", () => {
    const projection = projectKnownRemoteTrashCommitment(aiInput({ credits: 8 }), {
      serverId: "remote_1",
      definitionId: "onr_v1_322_euromarket-consortium",
      rootType: "asset",
      trashCost: 4,
      creditsAfterPath: 8,
      economyPosture: {
        desiredCreditReserve: 7,
        creditReservePolicy: {
          reserveDrivers: ["visible_remote_score_threat"],
        },
      },
      visibleCard: visibleCard("euromarket", {
        definitionId: "onr_v1_322_euromarket-consortium",
        title: "Euromarket Consortium",
        type: "asset",
      }),
    });

    expect(projection).toMatchObject({
      desiredCreditReserve: 7,
      preservesReserve: false,
      commitment: {
        reason: "reserve_would_break",
      },
    });
    expect(projection.evidence).toEqual(
      expect.arrayContaining([
        "access_reserve_source:runner_economy_posture",
        "access_reserve_desired:7",
        "access_reserve_driver:visible_remote_score_threat",
      ]),
    );
  });

  it("declines depleted finite-pool economy without card-specific logic", () => {
    const projection = projectKnownRemoteTrashCommitment(aiInput({ credits: 10 }), {
      serverId: "remote_1",
      definitionId: "onr_v1_326_holovid-campaign",
      rootType: "asset",
      trashCost: 4,
      creditsAfterPath: 10,
      visibleCard: visibleCard("holovid", {
        definitionId: "onr_v1_326_holovid-campaign",
        title: "Holovid Campaign",
        type: "asset",
        counters: { bit: 0 },
      }),
    });

    expect(projection).toMatchObject({
      payoff: "known_low_value",
      accessDecision: "decline",
      declineReason: "low_value_target",
      knownNoCurrentPayoff: true,
      commitment: {
        knownAccessState: "known_no_current_payoff",
        intendedAccessAction: "decline",
        reason: "finite_pool_depleted",
      },
    });
    expect(projection.evidence).toContain(
      "known_remote_root_finite_pool_depleted:true",
    );
  });
});

function aiInput(params: {
  credits: number;
  rig?: VisibleCard[];
}): AiDecisionInput {
  const playerView: PlayerView = {
    stateVersion: 1,
    side: "runner",
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "runner_action.main",
    own: {
      identity: visibleCard("runner-identity", {
        definitionId: "runner-identity",
        title: "Runner Identity",
        type: "identity",
      }),
      credits: params.credits,
      clicks: 3,
      agendaPoints: 0,
      gripOrHq: [],
      stackOrRdCount: 20,
      heapOrArchives: [],
      scoreArea: [],
      rig: params.rig ?? [],
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: visibleCard("corp-identity", {
        definitionId: "corp-identity",
        title: "Corp Identity",
        type: "identity",
      }),
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      tags: 0,
      handCount: 5,
      maxHandSize: 5,
      deckCount: 20,
      discardCount: 0,
      scoreArea: [],
    },
    servers: [
      {
        id: "remote_1",
        label: "Remote 1",
        ice: [],
        root: [],
      },
    ],
    publicEvents: [],
    legalActions: [],
    winner: null,
    agendaPointsToWin: 7,
  };
  return {
    side: "runner",
    playerView,
    eventTail: [],
    legalActions: [],
    difficulty: "normal",
    seed: "known-remote-access-commitment-test",
    decisionId: "known-remote-access-commitment-test:1:runner",
    actionNumber: 1,
    profileId: "runner-ai-test",
  };
}

function visibleCard(
  instanceId: string,
  overrides: Omit<Partial<VisibleCard>, "instanceId"> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    ...overrides,
  };
}
