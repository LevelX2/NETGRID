import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  PublicGameEvent,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { chooseRunnerAction } from "../ai-runtime-public-entrypoints";
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

  it("chooses economy over a repeated run on a fully known low-value one-card HQ", () => {
    const runHq = runAction("run-hq", "hq");
    const gain = action("gain", "gain_credit");
    const input = runnerInput({
      legalActions: [runHq, gain],
      opponentHandCount: 1,
      events: [
        hqPrivateLookEvent("evt_hq_look", 1, [
          "simple_economy_asset",
          "simple_upgrade",
        ]),
        publicEvent("evt_hidden_install", "install_card", 2, {
          actor: "corp",
          actionType: "install_card",
          serverId: "remote_1",
          installPlacement: "root",
        }),
        publicEvent("evt_hq_access", "access_card", 3, {
          actor: "runner",
          actionType: "access_card",
          serverLabel: "HQ",
          cardDefinitionId: "onr_v1_297_overtime-incentives",
          title: "Overtime Incentives",
        }),
      ],
    });

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("gain");
    expect(JSON.stringify(decision.decisionDebug)).toContain(
      "hq_run_suppressed_by_fully_known_low_value_hand:true",
    );
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

function publicEvent(
  eventId: string,
  type: string,
  stateVersionBefore: number,
  publicPayload: Record<string, unknown>,
): PublicGameEvent {
  return {
    eventId,
    type,
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `hash_${eventId}`,
    visibilityClass: "public",
    publicPayload,
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

function action(actionId: string, type: LegalAction["type"]): LegalAction {
  return {
    actionId,
    side: "runner",
    type,
    label: actionId,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    payload: {},
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
