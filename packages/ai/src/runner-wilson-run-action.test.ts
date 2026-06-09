import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  Side,
  VisibleCard,
  VisibleEffectiveIceRunQuote,
} from "@netgrid/shared";
import { chooseRunnerAction } from "./index";
import { resetTacticalPlanMemory } from "./tactical-plans";

const WILSON_DEFINITION_ID = "onr_v1_187_wilson-weeflerunner-apprentice";

describe("Runner Wilson run action utilization", () => {
  const originalRuntimeMode = process.env.NETGRID_SEMANTIC_AI_RUNTIME;

  beforeEach(() => {
    resetTacticalPlanMemory();
    delete process.env.NETGRID_SEMANTIC_AI_RUNTIME;
  });

  afterEach(() => {
    resetTacticalPlanMemory();
    if (originalRuntimeMode === undefined) {
      delete process.env.NETGRID_SEMANTIC_AI_RUNTIME;
    } else {
      process.env.NETGRID_SEMANTIC_AI_RUNTIME = originalRuntimeMode;
    }
  });

  it("uses Wilson before an already selected safe run", () => {
    const wilson = wilsonTriggerAction();
    const runRd = runAction("runner.start_run.rd", "rd");
    const input = runnerInput({
      credits: 5,
      servers: [server("rd")],
      legalActions: [runRd, wilson, gainCreditAction()],
    });

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(wilson.actionId);
    expect(input.legalActions.some((action) => action.actionId === decision.actionId)).toBe(true);
    expect(debugText).toContain("wilson_run_action_preferred");
    expect(debugText).toContain("wilson_target_server:rd");
    expect(debugText).toContain("wilson_cap_limit:3");
    expect(debugText).not.toMatch(
      /cardInstances|privatePayload|FullState|sessionToken|reconnectToken|joinToken|decklist|hidden-card/i,
    );
  });

  it("uses Wilson instead of ending after normal Runner actions are spent", () => {
    const wilson = wilsonTriggerAction();
    const endTurn = endTurnAction();
    const input = runnerInput({
      credits: 5,
      servers: [server("hq")],
      legalActions: [wilson, endTurn],
    });
    input.playerView.own.clicks = 0;

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });

    expect(decision.actionId).toBe(wilson.actionId);
    expect(input.legalActions.some((action) => action.actionId === decision.actionId)).toBe(true);
  });

  it("prefers the Wilson-only run action for the same planned target", () => {
    const normalRun = runAction("runner.start_run.rd", "rd", "Run auf R&D");
    const wilsonRun = runAction("runner.wilson.start_run.rd", "rd", "Wilson-Run auf R&D", {
      wilsonRunOnlyAction: true,
      runSpendingCap: 3,
    });
    const input = runnerInput({
      credits: 5,
      servers: [server("rd")],
      legalActions: [normalRun, wilsonRun, gainCreditAction()],
    });

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(wilsonRun.actionId);
    expect(input.legalActions.some((action) => action.actionId === decision.actionId)).toBe(true);
    expect(debugText).toContain("wilson_run_only_action_preferred");
    expect(debugText).toContain("wilson_target_server:rd");
    expect(debugText).not.toMatch(/cardInstances|privatePayload|FullState|decklist|hidden-card/i);
  });

  it("skips Wilson when visible breaker spending would exceed the cap", () => {
    const wilson = wilsonTriggerAction();
    const runRd = runAction("runner.start_run.rd", "rd");
    const input = runnerInput({
      credits: 8,
      rig: [visibleBreaker("simple-fracter", "simple_fracter", 2)],
      servers: [
        server("rd", {
          ice: [highCostBarrierIce()],
        }),
      ],
      legalActions: [runRd, wilson, gainCreditAction()],
    });

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(runRd.actionId);
    expect(input.legalActions.some((action) => action.actionId === decision.actionId)).toBe(true);
    expect(debugText).toContain("wilson_cap_risk_skip:visible_break_cost_gt_cap");
    expect(debugText).toContain("wilson_visible_break_cost:5");
    expect(debugText).not.toMatch(
      /cardInstances|privatePayload|FullState|sessionToken|reconnectToken|joinToken|decklist|hidden-card/i,
    );
  });
});

function runnerInput(params: {
  credits: number;
  servers: PlayerView["servers"];
  legalActions: LegalAction[];
  rig?: VisibleCard[];
}): AiDecisionInput {
  const view: PlayerView = {
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
      rig: [visibleWilson(), ...(params.rig ?? [])],
      memoryUsed: params.rig?.length ?? 0,
      memoryLimit: 4,
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
    playerView: view,
    eventTail: [],
    legalActions: params.legalActions,
    difficulty: "normal",
    seed: "runner-wilson-run-action-test",
    decisionId: "runner-wilson-run-action-test:runner",
    actionNumber: 1,
    profileId: "runner-ai-v1.4.2-normal",
  };
}

function wilsonTriggerAction(): LegalAction {
  return legalAction(
    "runner.trigger_ability.wilson.gain_run_action",
    "trigger_ability",
    "Wilson: Run-Aktion erhalten",
    {
      source: "wilson-1",
      costs: [],
      payload: {
        cardId: "wilson-1",
        runnerAbility: "wilson_gain_run_action",
        sourceDefinitionId: WILSON_DEFINITION_ID,
        gainActionsAmount: 1,
        runSpendingCap: 3,
      },
    },
  );
}

function runAction(
  actionId: string,
  serverId: string,
  label = `Run auf ${serverId}`,
  payload: LegalAction["payload"] = {},
): LegalAction {
  return legalAction(actionId, "start_run", label, {
    payload: { serverId, ...payload },
  });
}

function gainCreditAction(): LegalAction {
  return legalAction("runner.gain_credit", "gain_credit", "Credit nehmen", {
    costs: [{ clicks: 1 }],
  });
}

function endTurnAction(): LegalAction {
  return legalAction("runner.end_turn", "end_turn", "Zug beenden", {
    costs: [],
  });
}

function legalAction(
  actionId: string,
  type: LegalAction["type"],
  label: string,
  options: {
    source?: string;
    costs?: LegalAction["costs"];
    payload?: LegalAction["payload"];
  } = {},
): LegalAction {
  return {
    actionId,
    side: "runner",
    type,
    label,
    source: options.source ?? "basic_action",
    timingPoint: "runner_action.main",
    costs: options.costs ?? [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    ...(options.payload ? { payload: options.payload } : {}),
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

function highCostBarrierIce(): VisibleCard {
  return {
    instanceId: "rd-high-cost-barrier",
    definitionId: "simple_barrier_ice",
    title: "High Cost Barrier",
    type: "ice",
    owner: "corp",
    controller: "corp",
    known: true,
    rezzed: true,
    subtypes: ["barrier"],
    strength: 6,
    effectiveRunQuote: {
      iceInstanceId: "rd-high-cost-barrier",
      iceDefinitionId: "simple_barrier_ice",
      effectiveStrength: 6,
      subroutines: [{ id: "high_cost_barrier_etr", type: "end_the_run" }],
    } satisfies VisibleEffectiveIceRunQuote,
  };
}

function visibleWilson(): VisibleCard {
  return {
    instanceId: "wilson-1",
    definitionId: WILSON_DEFINITION_ID,
    title: "Wilson, Weeflerunner Apprentice",
    owner: "runner",
    controller: "runner",
    type: "resource",
    known: true,
  };
}

function visibleBreaker(
  instanceId: string,
  definitionId: string,
  strength: number,
): VisibleCard {
  return {
    instanceId,
    definitionId,
    title: definitionId,
    owner: "runner",
    controller: "runner",
    type: "program",
    known: true,
    subtypes: ["icebreaker", "fracter"],
    strength,
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
