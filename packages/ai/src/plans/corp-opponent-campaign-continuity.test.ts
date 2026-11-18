import { syntheticCardDefinitionId } from "@netgrid/engine/test-fixtures/synthetic-card-definition-id";
import type {
  AiDecisionInput,
  PublicGameEvent,
  StateHash,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  corpCampaignDescriptors,
  recentlyCompromisedCorpRemoteIds,
  reconcileCorpCampaignContinuity,
  type CorpCampaignDescriptor,
} from "./corp-opponent-campaign-continuity";

describe("Corp opponent-turn campaign continuity", () => {
  it("rejects an identity rebound to a different campaign objective before reconciliation", () => {
    const descriptor = agendaDescriptor();
    expect(() => reconcileCorpCampaignContinuity({
      input: decisionInput({ stateVersion: 12, activeSide: "corp" }),
      previous: [],
      descriptors: [{ ...descriptor, identity: { ...descriptor.identity, objectiveKey: "different-agenda" } }],
    })).toThrowError(expect.objectContaining({ code: "invalid_plan_identity" }));
  });
  it("exposes only newly observed public remote accesses to the score owner", () => {
    const input = decisionInput({
      stateVersion: 15,
      activeSide: "corp",
      events: [
        event(9, "access_card", {
          actor: "runner",
          actionType: "access_card",
          serverId: "r1",
        }),
        event(12, "steal_agenda", {
          actor: "runner",
          actionType: "steal_agenda",
          targetServerId: "r2",
        }),
        event(14, "gain_credit", {
          actor: "runner",
          actionType: "gain_credit",
          serverId: "r3",
        }),
      ],
    });

    expect(recentlyCompromisedCorpRemoteIds(input, 10)).toEqual(["r2"]);
    expect(recentlyCompromisedCorpRemoteIds(input, 15)).toEqual([]);
  });

  it("cannot mark a remote compromised from an access with no server binding", () => {
    const access = event(12, "access_card", { actor: "runner" });
    const [campaign] = reconcileCorpCampaignContinuity({
      input: decisionInput({
        stateVersion: 12,
        activeSide: "runner",
        events: [access],
      }),
      previous: [],
      descriptors: [agendaDescriptor()],
    });

    expect(campaign?.status).toBe("awaiting_opponent_outcome");
    expect(campaign?.publicOutcomes).toEqual([]);
  });

  it("retains an open Trace after its event drops out of the diagnostic history", () => {
    const [opened] = reconcileCorpCampaignContinuity({
      input: decisionInput({
        stateVersion: 11,
        activeSide: "runner",
        events: [event(11, "trace_started", {})],
      }),
      previous: [],
      descriptors: [agendaDescriptor()],
    });
    expect(opened?.reaction.openWindowKinds).toEqual(["trace"]);

    const [pending] = reconcileCorpCampaignContinuity({
      input: decisionInput({
        stateVersion: 47,
        activeSide: "runner",
        events: Array.from({ length: 36 }, (_, i) =>
          event(12 + i, "continue_run", { serverId: "r1" }),
        ),
      }),
      previous: [opened!],
      descriptors: [agendaDescriptor()],
    });

    expect(pending?.publicOutcomes).toHaveLength(32);
    expect(
      pending?.publicOutcomes.some(({ kind }) => kind === "trace_started"),
    ).toBe(false);
    expect(pending?.reaction).toMatchObject({
      status: "paused",
      openWindowKinds: ["trace"],
    });

    const [stillPending] = reconcileCorpCampaignContinuity({
      input: decisionInput({ stateVersion: 48, activeSide: "runner" }),
      previous: [pending!],
      descriptors: [agendaDescriptor()],
    });
    expect(stillPending?.reaction.openWindowKinds).toEqual(["trace"]);

    const [resolved] = reconcileCorpCampaignContinuity({
      input: decisionInput({
        stateVersion: 49,
        activeSide: "runner",
        events: [event(49, "trace_resolved", {})],
      }),
      previous: [stillPending!],
      descriptors: [agendaDescriptor()],
    });
    expect(resolved?.reaction.openWindowKinds).toEqual([]);
  });

  it("does not bind a score project to a different root plan instance", () => {
    const domain = {
      scoreProjects: [
        {
          projectId: "project-a",
          phase: "install_agenda",
          agendaInstanceId: "agenda-a",
          terminalScore: false,
          sameTurnCloseout: false,
          feasible: true,
          evidenceCode: "project-a",
        },
      ],
      defenseNeeds: [],
    };
    const unrelatedPortfolio = {
      instances: [
        {
          moduleId: "corp.score_agenda",
          dedupeKey: "project-b",
          instanceId: "score-project-b",
          createdAtStateVersion: 4,
        },
      ],
    };

    expect(
      corpCampaignDescriptors({
        domain: domain as never,
        portfolio: unrelatedPortfolio as never,
      }),
    ).toEqual([]);

    expect(
      corpCampaignDescriptors({
        domain: domain as never,
        portfolio: {
          instances: [
            {
              ...unrelatedPortfolio.instances[0],
              dedupeKey: "project-a",
              instanceId: "score-project-a",
            },
          ],
        } as never,
      }),
    ).toEqual([
      expect.objectContaining({
        campaignId: "k2093ge6gncdmdeuovfjsts3ey",
        rootPlanInstanceId: "score-project-a",
      }),
    ]);
  });

  it("feeds public run, rez, trace, access and remote compromise outcomes back into the campaign", () => {
    const initial = reconcileCorpCampaignContinuity({
      input: decisionInput({ stateVersion: 10, activeSide: "corp" }),
      previous: [],
      descriptors: [openingRushDescriptor()],
    });
    expect(initial).toMatchObject([
      {
        status: "continuable",
        requote: { status: "current" },
        publicOutcomes: [],
      },
    ]);

    const events = [
      event(11, "start_run", {
        actor: "runner",
        actionType: "start_run",
        serverId: "r1",
      }),
      event(12, "rez_ice", {
        actor: "corp",
        actionType: "rez_ice",
        serverId: "r1",
      }),
      event(13, "trace", {
        actor: "corp",
        actionType: "trace",
        traceSuccessful: true,
      }),
      event(14, "access_card", {
        actor: "runner",
        actionType: "access_card",
        serverId: "r1",
      }),
    ];
    const waiting = reconcileCorpCampaignContinuity({
      input: decisionInput({
        stateVersion: 14,
        activeSide: "runner",
        events,
      }),
      previous: initial,
      descriptors: [openingRushDescriptor()],
    });

    expect(waiting[0]).toMatchObject({
      kind: "opening_rush",
      status: "blocked",
      milestoneId: "install_agenda",
      requote: {
        status: "awaiting_next_own_turn",
        reasonCode: "campaign_remote_compromised_awaiting_own_turn_requote",
      },
    });
    expect(waiting[0]?.publicOutcomes.map((outcome) => outcome.kind)).toEqual([
      "run_declared",
      "corp_rez",
      "trace_resolved",
      "access_resolved",
      "remote_compromised",
    ]);
    expect(
      waiting[0]?.publicOutcomes.every(
        (outcome) =>
          outcome.origin === "public_event" ||
          outcome.origin === "visible_state_derivation",
      ),
    ).toBe(true);
  });

  it("requotes on the next own turn and does not duplicate replayed public events", () => {
    const previous = reconcileCorpCampaignContinuity({
      input: decisionInput({ stateVersion: 10, activeSide: "corp" }),
      previous: [],
      descriptors: [agendaDescriptor()],
    });
    const access = event(12, "access_card", {
      actor: "runner",
      actionType: "access_card",
      serverId: "r1",
    });
    const waiting = reconcileCorpCampaignContinuity({
      input: decisionInput({
        stateVersion: 12,
        activeSide: "runner",
        events: [access, access],
      }),
      previous,
      descriptors: [agendaDescriptor()],
    });
    const continued = reconcileCorpCampaignContinuity({
      input: decisionInput({
        stateVersion: 15,
        activeSide: "corp",
        events: [access],
      }),
      previous: waiting,
      descriptors: [agendaDescriptor()],
    });

    expect(continued[0]).toMatchObject({
      status: "continuable",
      requote: {
        status: "current",
        reasonCode: "campaign_requoted_after_public_opponent_outcomes",
        lastQuotedAtStateVersion: 15,
      },
    });
    expect(continued[0]?.publicOutcomes).toHaveLength(2);
    expect(
      new Set(continued[0]?.publicOutcomes.map((entry) => entry.outcomeId)),
    ).toHaveProperty("size", 2);
  });

  it("ends only for a visible scored, missing or publicly trashed target", () => {
    const scored = decisionInput({ stateVersion: 20, activeSide: "corp" });
    scored.playerView.own.scoreArea.push(
      scored.playerView.servers[2]!.root[0]!,
    );
    scored.playerView.servers[2]!.root = [];
    expect(
      reconcileCorpCampaignContinuity({
        input: scored,
        previous: [],
        descriptors: [agendaDescriptor()],
      })[0],
    ).toMatchObject({
      status: "completed",
      requote: { status: "not_applicable" },
    });

    const trashed = decisionInput({
      stateVersion: 21,
      activeSide: "runner",
      events: [
        event(21, "trash_accessed_card", {
          actor: "runner",
          actionType: "trash_accessed_card",
          serverId: "r1",
          trashedCardId: "agenda-1",
        }),
      ],
    });
    expect(
      reconcileCorpCampaignContinuity({
        input: trashed,
        previous: [],
        descriptors: [agendaDescriptor()],
      })[0],
    ).toMatchObject({
      status: "abandoned",
      requote: { status: "not_applicable" },
    });

    const missingRemote = decisionInput({
      stateVersion: 22,
      activeSide: "corp",
    });
    missingRemote.playerView.servers = missingRemote.playerView.servers.filter(
      (server) => server.id !== "r1",
    );
    expect(
      reconcileCorpCampaignContinuity({
        input: missingRemote,
        previous: [],
        descriptors: [agendaDescriptor()],
      })[0],
    ).toMatchObject({
      status: "abandoned",
      requote: { reasonCode: "campaign_target_remote_missing" },
    });
  });

  it("does not treat declining a trash as destruction of the campaign target", () => {
    const initial = reconcileCorpCampaignContinuity({
      input: decisionInput({ stateVersion: 10, activeSide: "corp" }),
      previous: [],
      descriptors: [agendaDescriptor()],
    });
    const declined = reconcileCorpCampaignContinuity({
      input: decisionInput({
        stateVersion: 11,
        activeSide: "runner",
        events: [
          event(11, "decline_trash", {
            actor: "runner",
            actionType: "decline_trash",
            serverId: "r1",
          }),
        ],
      }),
      previous: initial,
      descriptors: [agendaDescriptor()],
    });

    expect(declined[0]).toMatchObject({
      status: "awaiting_opponent_outcome",
      publicOutcomes: [],
    });
  });

  it("reconstructs deterministically after restart and ignores unrelated payload prose", () => {
    const firstInput = decisionInput({
      stateVersion: 14,
      activeSide: "runner",
      events: [
        event(12, "access_card", {
          actor: "runner",
          actionType: "access_card",
          serverId: "r1",
          label: "first public label",
          sourceDefinitionId: syntheticCardDefinitionId("public-definition-a"),
        }),
      ],
    });
    const equivalentInput = structuredClone(firstInput);
    equivalentInput.playerView.publicEvents[0]!.publicPayload.label =
      "different public label";
    equivalentInput.playerView.publicEvents[0]!.publicPayload.sourceDefinitionId =
      syntheticCardDefinitionId("public-definition-b");
    equivalentInput.eventTail = equivalentInput.playerView.publicEvents;

    const first = reconcileCorpCampaignContinuity({
      input: firstInput,
      previous: [],
      descriptors: [openingRushDescriptor()],
    });
    const repeated = reconcileCorpCampaignContinuity({
      input: structuredClone(firstInput),
      previous: [],
      descriptors: [openingRushDescriptor()],
    });
    const equivalent = reconcileCorpCampaignContinuity({
      input: equivalentInput,
      previous: [],
      descriptors: [openingRushDescriptor()],
    });

    expect(repeated).toEqual(first);
    expect(equivalent).toEqual(first);
    expect(first[0]).toMatchObject({
      status: "blocked",
      requote: { status: "awaiting_next_own_turn" },
    });
  });

  it("pauses overlapping public reaction windows and resumes only after all are resolved", () => {
    const initial = reconcileCorpCampaignContinuity({
      input: decisionInput({ stateVersion: 10, activeSide: "corp" }),
      previous: [],
      descriptors: [agendaDescriptor()],
    });
    const openEvents = [
      event(11, "rez_window_opened", {
        actor: "corp",
        actionType: "rez_window_opened",
        serverId: "r1",
        rezWindowOpened: true,
      }),
      event(12, "trace_started", {
        actor: "corp",
        actionType: "trace_started",
        traceStarted: true,
      }),
      event(13, "prevention_window_opened", {
        actor: "runner",
        actionType: "prevention_window_opened",
        preventionWindowOpened: true,
      }),
      event(14, "trace_resolved", {
        actor: "corp",
        actionType: "trace_resolved",
        traceSuccessful: false,
      }),
    ];
    const paused = reconcileCorpCampaignContinuity({
      input: decisionInput({
        stateVersion: 14,
        activeSide: "runner",
        events: openEvents,
      }),
      previous: initial,
      descriptors: [agendaDescriptor()],
    });

    expect(paused[0]).toMatchObject({
      status: "awaiting_opponent_outcome",
      requote: {
        reasonCode: "campaign_paused_for_public_reaction_windows",
      },
      reaction: {
        status: "paused",
        openWindowKinds: ["prevention", "rez"],
        deadline: "current_run_end",
        claimDisposition: "reserved",
      },
    });

    const resolvedEvents = [
      ...openEvents,
      event(15, "rez_window_resolved", {
        actor: "corp",
        actionType: "rez_window_resolved",
        serverId: "r1",
        rezWindowResolved: true,
      }),
      event(16, "prevention_window_resolved", {
        actor: "runner",
        actionType: "prevention_window_resolved",
        preventionWindowResolved: true,
      }),
      event(17, "end_run", {
        actor: "runner",
        actionType: "end_run",
        serverId: "r1",
        runEnded: true,
      }),
    ];
    const resumed = reconcileCorpCampaignContinuity({
      input: decisionInput({
        stateVersion: 18,
        activeSide: "corp",
        events: resolvedEvents,
      }),
      previous: paused,
      descriptors: [agendaDescriptor()],
    });

    expect(resumed[0]).toMatchObject({
      status: "continuable",
      requote: {
        status: "current",
        reasonCode: "campaign_resumed_after_public_reactions",
      },
      reaction: {
        status: "resumable",
        openWindowKinds: [],
        deadline: "none",
        claimDisposition: "active",
      },
    });
  });

  it("expires an unresolved reaction deadline without granting action authority", () => {
    const initial = reconcileCorpCampaignContinuity({
      input: decisionInput({ stateVersion: 10, activeSide: "corp" }),
      previous: [],
      descriptors: [agendaDescriptor()],
    });
    const opened = event(11, "ambush_triggered", {
      actor: "corp",
      actionType: "ambush_triggered",
      serverId: "r1",
      ambushTriggered: true,
    });
    const paused = reconcileCorpCampaignContinuity({
      input: decisionInput({
        stateVersion: 11,
        activeSide: "runner",
        events: [opened],
      }),
      previous: initial,
      descriptors: [agendaDescriptor()],
    });
    const expired = reconcileCorpCampaignContinuity({
      input: decisionInput({
        stateVersion: 12,
        activeSide: "corp",
        events: [opened],
      }),
      previous: paused,
      descriptors: [agendaDescriptor()],
    });

    expect(expired[0]).toMatchObject({
      status: "blocked",
      requote: {
        status: "required_now",
        reasonCode: "campaign_reaction_deadline_expired_before_own_turn",
      },
      reaction: {
        status: "expired",
        openWindowKinds: ["ambush"],
        claimDisposition: "requote_required",
      },
    });
    expect(
      Object.keys(expired[0] ?? {}).some((key) =>
        key.toLocaleLowerCase("en-US").includes("actionid"),
      ),
    ).toBe(false);
  });
});

function openingRushDescriptor(): CorpCampaignDescriptor {
  return {
    ...agendaDescriptor(),
    kind: "opening_rush",
    openingRushOpportunityKey: "opening-rush:agenda-1:r1",
  };
}

function agendaDescriptor(): CorpCampaignDescriptor {
  return {
    campaignId: "kbhzdiku4ohast2p12lu30lfh2", identity: {"ownerModuleId":"corp.score_agenda","objectiveKey":"agenda:agenda-1:r1"},
    kind: "agenda",
    moduleId: "corp.score_agenda",
    rootPlanInstanceId: "pbdq9qo2j7h919e58ns3d9h9nh",
    originStateVersion: 10,
    milestoneId: "install_agenda",
    targetServerId: "r1",
    targetCardInstanceId: "agenda-1",
    currentlyAdmitted: true,
    evidenceCode: "test_agenda_campaign",
  };
}

function decisionInput(params: {
  stateVersion: number;
  activeSide: "corp" | "runner";
  events?: PublicGameEvent[];
}): AiDecisionInput {
  const events = params.events ?? [];
  return {
    side: "corp",
    difficulty: "hard",
    seed: "campaign-continuity-test",
    decisionId: "campaign-continuity-test:decision",
    actionNumber: params.stateVersion,
    profileId: "campaign-continuity-test",
    legalActions: [],
    eventTail: events,
    playerView: {
      side: "corp",
      stateVersion: params.stateVersion,
      timingPoint:
        params.activeSide === "corp"
          ? "corp_action.main"
          : "runner_action.main",
      activeSide: params.activeSide,
      phase:
        params.activeSide === "corp"
          ? "corp_action_phase"
          : "runner_action_phase",
      own: {
        identity: { instanceId: "corp-id", known: true },
        credits: 8,
        clicks: params.activeSide === "corp" ? 3 : 0,
        agendaPoints: 0,
        gripOrHq: [],
        stackOrRdCount: 40,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: { instanceId: "runner-id", known: true },
        credits: 8,
        clicks: params.activeSide === "runner" ? 3 : 0,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 40,
        discardCount: 0,
        scoreArea: [],
      },
      servers: [
        { id: "hq", label: "HQ", ice: [], root: [] },
        { id: "rd", label: "R&D", ice: [], root: [] },
        {
          id: "r1",
          label: "Remote 1",
          ice: [],
          root: [
            {
              instanceId: "agenda-1",
              definitionId: syntheticCardDefinitionId("agenda-definition"),
              type: "agenda",
              known: true,
            },
          ],
        },
      ],
      publicEvents: events,
      legalActions: [],
      winner: null,
      agendaPointsToWin: 7,
    },
  };
}

function event(
  stateVersionAfter: number,
  type: string,
  publicPayload: PublicGameEvent["publicPayload"],
): PublicGameEvent {
  return {
    eventId: stateVersionAfter + 1,
    type,
    stateVersionBefore: stateVersionAfter - 1,
    stateVersionAfter,
    stateHashAfter: `hash-${stateVersionAfter}` as StateHash,
    publicPayload,
  };
}
