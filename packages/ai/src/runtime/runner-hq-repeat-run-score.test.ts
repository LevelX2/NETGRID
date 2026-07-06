import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  PublicGameEvent,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { staleKnownHqRepeatRunPenalty } from "./runner-hq-repeat-run-score";

describe("staleKnownHqRepeatRunPenalty", () => {
  it("heavily suppresses HQ runs when the full HQ is known low value", () => {
    const runHq = runAction("run-hq", "hq");
    const input = runnerInput({
      legalActions: [runHq],
      opponentHandCount: 2,
      events: [
        hqPrivateLookEvent("evt_hq_look", 1, [
          "simple_economy_operation",
          "onr_v1_281_accounts-receivable",
        ]),
      ],
    });

    expect(staleKnownHqRepeatRunPenalty(input, runHq)).toBe(1400);
  });

  it("does not suppress HQ runs when a known HQ agenda is available", () => {
    const runHq = runAction("run-hq", "hq");
    const input = runnerInput({
      legalActions: [runHq],
      opponentHandCount: 2,
      events: [
        hqPrivateLookEvent("evt_hq_look", 1, [
          "simple_agenda",
          "simple_economy_operation",
        ]),
      ],
    });

    expect(staleKnownHqRepeatRunPenalty(input, runHq)).toBe(0);
  });
});

function runnerInput(params: {
  legalActions: LegalAction[];
  opponentHandCount: number;
  events: PublicGameEvent[];
}): AiDecisionInput {
  const playerView: PlayerView = {
    side: "runner",
    stateVersion: params.events.at(-1)?.stateVersionAfter ?? 1,
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "runner_action.main",
    own: {
      identity: visibleIdentity("runner"),
      credits: 6,
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
      identity: visibleIdentity("corp"),
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      tags: 0,
      handCount: params.opponentHandCount,
      maxHandSize: 5,
      deckCount: 20,
      discardCount: 0,
      scoreArea: [],
    },
    servers: [{ id: "hq", label: "HQ", ice: [], root: [] }],
    publicEvents: params.events,
    legalActions: params.legalActions,
    winner: null,
    agendaPointsToWin: 7,
  };
  return {
    side: "runner",
    playerView,
    eventTail: params.events,
    legalActions: params.legalActions,
    difficulty: "normal",
    seed: "runner-hq-repeat-run-score-test",
    decisionId: "runner-hq-repeat-run-score-test:runner",
    actionNumber: 1,
    profileId: "runner-ai-test",
  };
}

function hqPrivateLookEvent(
  eventId: string,
  stateVersionBefore: number,
  knownHqDefinitionIds: string[],
): PublicGameEvent {
  return {
    eventId,
    type: "resolve_choice",
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `hash_${eventId}`,
    visibilityClass: "hidden_info_barrier",
    publicPayload: {
      actor: "runner",
      actionType: "resolve_choice",
      hiddenZoneAction: "p3_33_private_look",
      privateLookZone: "hq",
      privateLookCount: knownHqDefinitionIds.length,
      knownHqDefinitionIds,
    },
  } as PublicGameEvent;
}

function runAction(actionId: string, serverId: string): LegalAction {
  return {
    actionId,
    side: "runner",
    type: "start_run",
    label: `Run ${serverId}`,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    payload: { serverId },
  };
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
