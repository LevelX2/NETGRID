import type {
  AiDecisionInput,
  PublicGameEvent,
  StateHash,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  reconcileCorpCampaignContinuity,
  type CorpCampaignDescriptor,
} from "./corp-opponent-campaign-continuity";

describe("Corp opponent-turn campaign continuity", () => {
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
        serverId: "remote_1",
      }),
      event(12, "rez_ice", {
        actor: "corp",
        actionType: "rez_ice",
        serverId: "remote_1",
      }),
      event(13, "trace", {
        actor: "corp",
        actionType: "trace",
        traceSuccessful: true,
      }),
      event(14, "access_card", {
        actor: "runner",
        actionType: "access_card",
        serverId: "remote_1",
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
      serverId: "remote_1",
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
          serverId: "remote_1",
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
      (server) => server.id !== "remote_1",
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

  it("reconstructs deterministically after restart and ignores unrelated payload prose", () => {
    const firstInput = decisionInput({
      stateVersion: 14,
      activeSide: "runner",
      events: [
        event(12, "access_card", {
          actor: "runner",
          actionType: "access_card",
          serverId: "remote_1",
          label: "first public label",
          sourceDefinitionId: "public-definition-a",
        }),
      ],
    });
    const equivalentInput = structuredClone(firstInput);
    equivalentInput.playerView.publicEvents[0]!.publicPayload.label =
      "different public label";
    equivalentInput.playerView.publicEvents[0]!.publicPayload.sourceDefinitionId =
      "public-definition-b";
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
        serverId: "remote_1",
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
        serverId: "remote_1",
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
        serverId: "remote_1",
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
      serverId: "remote_1",
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
    openingRushOpportunityKey: "opening-rush:agenda-1:remote_1",
  };
}

function agendaDescriptor(): CorpCampaignDescriptor {
  return {
    campaignId: "campaign:agenda:agenda-1:remote_1",
    kind: "agenda",
    moduleId: "corp.score_agenda",
    rootPlanInstanceId: "plan:corp.score_agenda:agenda%3Aagenda-1%3Aremote_1",
    originStateVersion: 10,
    milestoneId: "install_agenda",
    targetServerId: "remote_1",
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
          id: "remote_1",
          label: "Remote 1",
          ice: [],
          root: [
            {
              instanceId: "agenda-1",
              definitionId: "agenda-definition",
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
    eventId: `event-${stateVersionAfter}-${type}`,
    type,
    stateVersionBefore: stateVersionAfter - 1,
    stateVersionAfter,
    stateHashAfter: `hash-${stateVersionAfter}` as StateHash,
    publicPayload,
  };
}
