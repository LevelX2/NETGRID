import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  PublicGameEvent,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { chooseRunnerAction } from "../ai-runtime-public-entrypoints";
import { staleKnownRndRepeatRunPenalty } from "./runner-rnd-repeat-run-score";

describe("staleKnownRndRepeatRunPenalty", () => {
  it("recognizes label-only R&D access events as stale known low-value top cards", () => {
    const runRd = runAction("run-rd", "rd");
    const input = runnerInput({
      legalActions: [runRd],
      events: [
        rdLabelOnlyAccessEvent(
          "evt_rd_access",
          1,
          "onr_v1_281_accounts-receivable",
          "Accounts Receivable",
        ),
      ],
    });

    expect(staleKnownRndRepeatRunPenalty(input, runRd)).toBe(420);
  });

  it("develops exact basic liquidity after rejecting a repeated low-value R&D run", () => {
    const runRd = runAction("run-rd", "rd");
    const gain = action("gain", "gain_credit");
    const end = action("end", "end_turn");
    const input = runnerInput({
      legalActions: [runRd, gain, end],
      events: [
        runnerRunStartEvent("evt_rd_run", 0, "rd"),
        rdLabelOnlyAccessEvent(
          "evt_rd_access",
          1,
          "onr_v1_281_accounts-receivable",
          "Accounts Receivable",
        ),
      ],
    });

    const decision = chooseRunnerAction(input, {
      runnerTurnPlannerMode: "legacy_compare",
    });
    const runAlternative = decision.decisionDebug?.actionAlternatives?.find(
      (alternative) => alternative.actionId === runRd.actionId,
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
        "candidate_plan_evidence:runner_central_pressure_known_no_current_payoff:rd",
      ]),
    );
  });
});

function runnerInput(params: {
  legalActions: LegalAction[];
  events: PublicGameEvent[];
}): AiDecisionInput {
  const stateVersion = params.events.at(-1)?.stateVersionAfter ?? 1;
  const playerView: PlayerView = {
    side: "runner",
    stateVersion,
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
    seed: "runner-rnd-repeat-run-score-test",
    decisionId: "runner-rnd-repeat-run-score-test:runner",
    actionNumber: 1,
    profileId: "runner-ai-test",
  };
}

function rdLabelOnlyAccessEvent(
  eventId: string,
  stateVersionBefore: number,
  cardDefinitionId: string,
  title: string,
): PublicGameEvent {
  return {
    eventId,
    type: "access_card",
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    turnSerial: 0,
    stateHashAfter: `hash_${eventId}`,
    visibilityClass: "hidden_info_barrier",
    publicPayload: {
      actor: "runner",
      actionType: "access_card",
      serverLabel: "R&D",
      targets: { serverLabel: "R&D" },
      cardDefinitionId,
      title,
    },
  } as PublicGameEvent;
}

function runnerRunStartEvent(
  eventId: string,
  stateVersionBefore: number,
  serverId: string,
): PublicGameEvent {
  return {
    eventId,
    type: "start_run",
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    turnSerial: 0,
    stateHashAfter: `hash_${eventId}`,
    visibilityClass: "public",
    publicPayload: {
      actor: "runner",
      actionType: "start_run",
      serverId,
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
