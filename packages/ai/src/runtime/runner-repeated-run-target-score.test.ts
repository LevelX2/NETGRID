import type {
  AiDecisionInput,
  PlayerView,
  PublicGameEvent,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { runnerRepeatedRunTargetScoreComponents } from "./runner-repeated-run-target-score";

describe("runnerRepeatedRunTargetScoreComponents", () => {
  it("keeps the full penalty for an unchanged known R&D top", () => {
    expect(
      components(
        runnerInput({
          agendaPoints: 5,
          events: [rdAccessEvent(1)],
        }),
      ),
    ).toEqual([
      expect.objectContaining({
        key: "runner_recent_same_server_runs",
        value: -2600,
      }),
    ]);
  });

  it("does not suppress a changed R&D top at matchpoint", () => {
    expect(
      components(
        runnerInput({
          agendaPoints: 5,
          events: [rdAccessEvent(1), mandatoryDrawEvent(2)],
        }),
      ),
    ).toEqual([]);
  });

  it("retains a bounded repeat discount for a changed R&D top before matchpoint", () => {
    expect(
      components(
        runnerInput({
          agendaPoints: 3,
          events: [rdAccessEvent(1), mandatoryDrawEvent(2)],
        }),
      ),
    ).toEqual([
      expect.objectContaining({
        key: "runner_recent_same_server_runs",
        value: -700,
      }),
    ]);
  });

  it("keeps the full penalty when no visible event changed R&D", () => {
    expect(components(runnerInput({ agendaPoints: 5, events: [] }))).toEqual([
      expect.objectContaining({
        key: "runner_recent_same_server_runs",
        value: -2600,
      }),
    ]);
  });
});

function components(input: AiDecisionInput) {
  return runnerRepeatedRunTargetScoreComponents(input, "rd", {
    recentStartRunsOnServer: () => 1,
    isRemoteServerTarget: () => false,
  });
}

function runnerInput(params: {
  agendaPoints: number;
  events: PublicGameEvent[];
}): AiDecisionInput {
  const stateVersion = params.events.at(-1)?.stateVersionAfter ?? 3;
  const playerView: PlayerView = {
    side: "runner",
    stateVersion,
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "runner_action.main",
    own: {
      identity: visibleIdentity("runner"),
      credits: 6,
      clicks: 4,
      agendaPoints: params.agendaPoints,
      gripOrHq: [],
      stackOrRdCount: 20,
      heapOrArchives: [],
      scoreArea: [],
      rig: [],
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: visibleIdentity("corp"),
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      tags: 0,
      handCount: 4,
      maxHandSize: 5,
      deckCount: 20,
      discardCount: 0,
      scoreArea: [],
    },
    servers: [
      { id: "hq", label: "HQ", ice: [], root: [] },
      { id: "rd", label: "R&D", ice: [], root: [] },
      { id: "archives", label: "Archives", ice: [], root: [] },
    ],
    publicEvents: params.events,
    legalActions: [],
    winner: null,
    agendaPointsToWin: 7,
  };
  return {
    side: "runner",
    playerView,
    eventTail: params.events,
    legalActions: [],
    difficulty: "hard",
    seed: "runner-repeat-run-target-score-test",
    decisionId: "runner-repeat-run-target-score-test:runner",
    actionNumber: 1,
    profileId: "runner-ai-test",
  };
}

function rdAccessEvent(version: number): PublicGameEvent {
  return {
    eventId: `rd-access-${version}`,
    type: "access_card",
    stateVersionBefore: version - 1,
    stateVersionAfter: version,
    stateHashAfter: `hash-${version}`,
    visibilityClass: "hidden_info_barrier",
    publicPayload: {
      actor: "runner",
      actionType: "access_card",
      serverLabel: "R&D",
      targets: { serverLabel: "R&D" },
      cardDefinitionId: "onr_v1_281_accounts-receivable",
      title: "Accounts Receivable",
    },
  } as PublicGameEvent;
}

function mandatoryDrawEvent(version: number): PublicGameEvent {
  return {
    eventId: `mandatory-draw-${version}`,
    type: "mandatory_draw",
    stateVersionBefore: version - 1,
    stateVersionAfter: version,
    stateHashAfter: `hash-${version}`,
    visibilityClass: "private_to_side",
    publicPayload: {
      actor: "corp",
      actionType: "mandatory_draw",
    },
  } as PublicGameEvent;
}

function visibleIdentity(side: "runner" | "corp"): VisibleCard {
  return {
    instanceId: `${side}-identity`,
    definitionId: `${side}-identity`,
    title: `${side} identity`,
    owner: side,
    controller: side,
    type: "identity",
    known: true,
  };
}
