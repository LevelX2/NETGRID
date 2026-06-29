import { afterEach, describe, expect, it } from "vitest";

import type {
  AiDecisionInput,
  CardInstanceId,
  GameState,
  LegalAction,
  PlayerView,
  Side,
  TraceSuccessEffect,
  VisibleCard,
} from "@netgrid/shared";
import {
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
} from "@netgrid/engine";
import { buildAiDecisionInputDto } from "./input-dto";
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
  it("preserves rezzed Hunter trace fields through Engine PlayerView DTO into runner AI", () => {
    process.env.NETGRID_SEMANTIC_AI_RUNTIME = "semantic";
    const state = engineRunnerTurnWithRezzedIce(
      "known-ice-run-risk-engine-dto",
      "onr_v1_249_hunter",
    );
    const playerView = getPlayerView(state, "runner");
    const playerViewHunter = playerView.servers.find(
      (serverView) => serverView.id === "rd",
    )?.ice[0];

    expect(playerViewHunter?.effectiveRunQuote?.subroutines[0]).toMatchObject({
      type: "initiate_trace",
      baseTraceStrength: 5,
      traceSuccessEffect: { type: "add_tag", amount: 1 },
    });

    const input = buildAiDecisionInputDto({
      side: "runner",
      playerView,
      eventTail: [],
      legalActions: getLegalActions(state, "runner"),
      difficulty: "normal",
      seed: state.seed,
      decisionId: "known-ice-run-risk-engine-dto:runner:1",
      actionNumber: 1,
      profileId: "known-visible-ice-run-risk-test",
    });
    const dtoHunter = input.playerView.servers.find(
      (serverView) => serverView.id === "rd",
    )?.ice[0];
    expect(dtoHunter?.effectiveRunQuote?.subroutines[0]).toMatchObject({
      type: "initiate_trace",
      baseTraceStrength: 5,
      traceSuccessEffect: { type: "add_tag", amount: 1 },
    });

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });
    const run = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const guidanceReason = run
      ? semanticGuidanceReason(decision, run.actionId)
      : "";

    expect(run).toBeDefined();
    expect(decision.actionId).not.toBe(run?.actionId);
    expect(guidanceReason).toContain("visible_ice_hazard:trace_tag");
    expect(guidanceReason).toContain("visible_ice_trace_base:5");
    expect(guidanceReason).toContain(
      "visible_trace_tag_hazard_unavoidable:true",
    );
  });

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
    expect(guidance).toMatchObject({ value: -42 });
    expect(guidance?.reason).toContain("recommendation:gain_credits_first");
    expect(guidance?.reason).toContain("raw_guidance:-2100");
    expect(guidance?.reason).toContain("normalized_guidance:-42");
    expect(guidance?.reason).toContain("visible_ice_hazard:trace_tag");
    expect(guidance?.reason).toContain(
      "visible_trace_tag_hazard_unavoidable:true",
    );
  });

  it("keeps a visible remote agenda runnable through unavoidable Hunter risk", () => {
    process.env.NETGRID_SEMANTIC_AI_RUNTIME = "semantic";
    const run = runAction("run-remote-1", "remote_1");
    const gain = gainCreditAction("gain-credit");
    const input = aiInput({
      credits: 2,
      servers: [
        server("remote_1", {
          ice: [hunterTraceTagIce("remote-hunter")],
          root: [
            visibleCard("remote-agenda", {
              definitionId: "simple_agenda",
              title: "Simple Agenda",
              type: "agenda",
              known: true,
            }),
          ],
        }),
      ],
      legalActions: [run, gain],
    });

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });

    expect(decision.actionId).toBe(run.actionId);
  });

  it.each([
    {
      label: "add_counter",
      expectedKind: "trace_counter",
      expectedGuidance: [
        "visible_ice_hazard:trace_counter",
        "unavoidable_visible_ice_hazard_count:1",
      ],
      effect: {
        type: "add_counter",
        counterType: "trace_tag_counter",
        amount: 1,
      } satisfies TraceSuccessEffect,
    },
    {
      label: "net_damage",
      expectedKind: "trace_damage",
      expectedGuidance: [
        "visible_ice_hazard:trace_damage",
        "unavoidable_visible_ice_hazard_count:1",
      ],
      effect: { type: "net_damage", amount: 2 } satisfies TraceSuccessEffect,
    },
    {
      label: "end_run_and_run_lock",
      expectedKind: "trace_run_lock",
      expectedGuidance: [
        "path:blocked_unbreakable",
        "recommendation:do_not_run_now",
      ],
      effect: {
        type: "end_run_and_run_lock",
        amount: 2,
      } satisfies TraceSuccessEffect,
    },
    {
      label: "end_run_trash_program_and_run_lock",
      expectedKind: "trace_trash",
      expectedGuidance: [
        "path:blocked_unbreakable",
        "recommendation:do_not_run_now",
      ],
      effect: {
        type: "end_run_trash_program_and_run_lock",
        amount: 2,
      } satisfies TraceSuccessEffect,
    },
    {
      label: "trash_runner_resource_and_add_tag",
      expectedKind: "trace_trash",
      expectedGuidance: [
        "visible_ice_hazard:trace_trash",
        "unavoidable_visible_ice_hazard_count:1",
      ],
      effect: {
        type: "trash_runner_resource_and_add_tag",
        targetCardInstanceId: "runner-resource",
      } satisfies TraceSuccessEffect,
    },
  ])(
    "chooses setup over unknown R&D run through visible $label trace risk",
    ({ effect, expectedGuidance }) => {
      process.env.NETGRID_SEMANTIC_AI_RUNTIME = "semantic";
      const run = runAction("run-rd", "rd");
      const gain = gainCreditAction("gain-credit");
      const input = aiInput({
        credits: 2,
        servers: [
          server("rd", {
            ice: [traceEffectIce("rd-trace-risk", effect)],
          }),
        ],
        legalActions: [run, gain],
      });

      const decision = chooseRunnerAction(input, {
        persistTacticalPlanMemory: false,
      });

      expect(decision.actionId).toBe(gain.actionId);
      const guidanceReason = semanticGuidanceReason(decision, run.actionId);
      for (const expected of expectedGuidance) {
        expect(guidanceReason).toContain(expected);
      }
    },
  );
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

function visibleCard(
  instanceId: string,
  overrides: Partial<VisibleCard>,
): VisibleCard {
  return {
    instanceId,
    known: true,
    ...overrides,
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

function traceEffectIce(
  instanceId: string,
  effect: TraceSuccessEffect,
): VisibleCard {
  return {
    instanceId,
    definitionId: "test_visible_trace_effect_ice",
    title: "Trace Risk ICE",
    type: "ice",
    subtypes: ["sentry", "trace"],
    known: true,
    rezzed: true,
    strength: 5,
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: "test_visible_trace_effect_ice",
      effectiveStrength: 5,
      subroutines: [
        {
          id: `${instanceId}_trace`,
          type: "initiate_trace",
          sourceDefinitionId: "test_visible_trace_effect_ice",
          sourceTitle: "Trace Risk ICE",
          amount: 5,
          baseTraceStrength: 5,
          traceSuccessEffect: effect,
        },
      ],
    },
  };
}

function semanticGuidanceReason(
  decision: ReturnType<typeof chooseRunnerAction>,
  actionId: string,
): string {
  const alternative = decision.decisionDebug?.actionAlternatives?.find(
    (entry) => entry.actionId === actionId,
  );
  return (
    alternative?.scoreBreakdown?.find(
      (component) => component.key === "runner_run_target_semantic_guidance",
    )?.reason ?? ""
  );
}

function engineRunnerTurnWithRezzedIce(
  seed: string,
  definitionId: string,
): GameState {
  const state = createGameAfterSetup({ seed });
  state.activeSide = "runner";
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  delete state.pendingChoice;
  state.runner.clicks = 4;
  state.runner.credits = 2;
  state.corp.clicks = 3;
  state.corp.credits = 5;
  addCorpIceToServerForTest(state, "rd", definitionId);
  return state;
}

function addCorpIceToServerForTest(
  state: GameState,
  serverId: "hq" | "rd" | "archives" | `remote_${number}`,
  definitionId: string,
): CardInstanceId {
  const id =
    `test_corp_ice_${serverId}_${definitionId}_${Object.keys(state.cardInstances).length}` as CardInstanceId;
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  expect(server).toBeDefined();
  if (!server) throw new Error("Missing server");
  server.ice.push(id);
  state.cardInstances[id] = {
    instanceId: id,
    definitionId,
    owner: "corp",
    controller: "corp",
    zone: { side: "corp", zone: "serverIce", serverId },
    faceup: true,
    rezzed: true,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  return id;
}
