import { afterEach, describe, expect, it } from "vitest";

import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  Side,
  VisibleCard,
} from "@netgrid/shared";
import { chooseRunnerAction } from "./index";

const originalSemanticRuntime = process.env.NETGRID_SEMANTIC_AI_RUNTIME;

afterEach(() => {
  if (originalSemanticRuntime === undefined) {
    delete process.env.NETGRID_SEMANTIC_AI_RUNTIME;
  } else {
    process.env.NETGRID_SEMANTIC_AI_RUNTIME = originalSemanticRuntime;
  }
});

describe("known visible ICE run risk", () => {
  it("chooses credits over an unknown R&D run through unavoidable visible Hunter", () => {
    process.env.NETGRID_SEMANTIC_AI_RUNTIME = "semantic";
    const run = runAction("run-rd", "rd");
    const gain = gainCreditAction("gain-credit");
    const input = aiInput({
      credits: 2,
      servers: [
        server("rd", {
          ice: [hunterTraceTagIce("rd-hunter")],
        }),
      ],
      legalActions: [run, gain],
    });

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });
    const alternatives = new Map(
      decision.decisionDebug?.actionAlternatives?.map((entry) => [
        entry.actionId,
        entry,
      ]) ?? [],
    );
    const runAlternative = alternatives.get(run.actionId);
    const guidance = runAlternative?.scoreBreakdown?.find(
      (component) => component.key === "runner_run_target_semantic_guidance",
    );

    expect(decision.actionId).toBe(gain.actionId);
    expect(runAlternative?.excluded).not.toBe(true);
    expect(guidance).toMatchObject({ value: -2100 });
    expect(guidance?.reason).toContain("recommendation:gain_credits_first");
    expect(guidance?.reason).toContain("visible_ice_hazard:trace_tag");
    expect(guidance?.reason).toContain(
      "visible_trace_tag_hazard_unavoidable:true",
    );
  });
});

function aiInput(params: {
  credits: number;
  servers: PlayerView["servers"];
  legalActions: LegalAction[];
  rig?: VisibleCard[];
}): AiDecisionInput {
  const playerView: PlayerView = {
    stateVersion: 1,
    side: "runner",
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "runner_action.main",
    own: {
      identity: visibleIdentity("runner"),
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
      identity: visibleIdentity("corp"),
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
    servers: params.servers,
    publicEvents: [],
    legalActions: params.legalActions,
    winner: null,
    agendaPointsToWin: 7,
  };
  return {
    side: "runner",
    playerView,
    eventTail: [],
    legalActions: params.legalActions,
    difficulty: "normal",
    seed: "known-visible-ice-run-risk",
    decisionId: "known-visible-ice-run-risk:1:runner",
    actionNumber: 1,
    profileId: "known-visible-ice-run-risk-test",
  };
}

function server(
  id: PlayerView["servers"][number]["id"],
  overrides: Partial<PlayerView["servers"][number]> = {},
): PlayerView["servers"][number] {
  return {
    id,
    label: id,
    ice: [],
    root: [],
    ...overrides,
  };
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

function gainCreditAction(actionId: string): LegalAction {
  return {
    actionId,
    side: "runner",
    type: "gain_credit",
    label: "Gain credit",
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
  };
}

function visibleIdentity(side: Side): VisibleCard {
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

function hunterTraceTagIce(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: "onr_v1_249_hunter",
    title: "Hunter",
    type: "ice",
    subtypes: ["sentry", "bloodhound"],
    known: true,
    rezzed: true,
    strength: 5,
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: "onr_v1_249_hunter",
      effectiveStrength: 5,
      subroutines: [
        {
          id: `${instanceId}_trace`,
          type: "initiate_trace",
          sourceDefinitionId: "onr_v1_249_hunter",
          sourceTitle: "Hunter",
          amount: 5,
        },
      ],
    },
  };
}
