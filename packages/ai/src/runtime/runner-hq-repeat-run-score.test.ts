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

  it("develops exact basic liquidity after rejecting a repeated low-value HQ run", () => {
    const runHq = runAction("run-hq", "hq");
    const gain = action("gain", "gain_credit");
    const end = action("end", "end_turn");
    const input = runnerInput({
      legalActions: [runHq, gain, end],
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
        {
          ...publicEvent("evt_hq_run", "start_run", 3, {
            actor: "runner",
            actionType: "start_run",
            serverId: "hq",
          }),
          turnSerial: 0,
        },
        {
          ...publicEvent("evt_hq_access", "access_card", 4, {
            actor: "runner",
            actionType: "access_card",
            serverLabel: "HQ",
            cardDefinitionId: "onr_v1_297_overtime-incentives",
            title: "Overtime Incentives",
          }),
          turnSerial: 0,
        },
      ],
    });

    const decision = chooseRunnerAction(input, {
      runnerTurnPlannerMode: "legacy_compare",
    });
    const runAlternative = decision.decisionDebug?.actionAlternatives?.find(
      (alternative) => alternative.actionId === runHq.actionId,
    );

    expect(decision.actionId).toBe("gain");
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.reasonCode).toBe("plan_first.runner.economy");
    expect(decision.decisionDebug?.planKind).toBe("runner.economy");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_priority_class:P6",
        "plan_module:runner.economy",
        "plan_step_capability:gain_general_liquid_credits",
        "plan_assessment_evidence:runner_engine_certified_immediate_liquidity_development",
      ]),
    );
    expect(runAlternative?.whyNot).toEqual(
      expect.arrayContaining([
        "candidate_plan_evidence:runner_central_pressure_known_no_current_payoff:hq",
      ]),
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
    turnSerial: 0,
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
    source: type === "end_turn" ? "game_rule" : "basic_action",
    timingPoint: "runner_action.main",
    costs: [{ clicks: type === "end_turn" ? 0 : 1 }],
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
