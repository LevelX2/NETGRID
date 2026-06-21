import { describe, expect, it } from "vitest";

import type {
  AiDecisionInput,
  PlayerView,
  VisibleCard,
} from "@netgrid/shared";
import {
  knownRemoteAgendaAccessCommitment,
  projectKnownRemoteTrashCommitment,
} from "./known-remote-access-commitment";

describe("known remote access commitment", () => {
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
      definitionId: "onr_v1_322_euromarket-consortium",
      rootType: "asset",
      trashCost: 4,
      creditsAfterPath: 8,
      visibleCard: visibleCard("euromarket", {
        definitionId: "onr_v1_322_euromarket-consortium",
        title: "Euromarket Consortium",
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

function aiInput(params: { credits: number }): AiDecisionInput {
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
      rig: [],
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
