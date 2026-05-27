import type {
  CardInstanceId,
  GameState,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  createPerformActionExecutor,
  performAction,
  type PerformActionExecutionHost,
} from "./perform-action";

type HostCalls = {
  turn: ReturnType<typeof vi.fn>;
  economy: ReturnType<typeof vi.fn>;
  abilities: ReturnType<typeof vi.fn>;
  activated: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
  install: ReturnType<typeof vi.fn>;
  board: ReturnType<typeof vi.fn>;
  scoreAgenda: ReturnType<typeof vi.fn>;
  startRun: ReturnType<typeof vi.fn>;
  movement: ReturnType<typeof vi.fn>;
  breaker: ReturnType<typeof vi.fn>;
  continueRun: ReturnType<typeof vi.fn>;
  rez: ReturnType<typeof vi.fn>;
  access: ReturnType<typeof vi.fn>;
  choices: ReturnType<typeof vi.fn>;
};

function spyAs<T extends (...args: any[]) => any>(
  spy: ReturnType<typeof vi.fn>,
): T {
  return spy as unknown as T;
}

function legalAction(
  type: LegalAction["type"],
  payload: NonNullable<LegalAction["payload"]> = {},
): LegalAction {
  return {
    actionId: `test.${type}`,
    type,
    label: type,
    side: "runner",
    source: "game_rule",
    stateVersion: 1,
    timingPoint: "runner_action.main",
    costs: [],
    payload,
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
  } as unknown as LegalAction;
}

function playerAction(actionId = "test.action"): PlayerAction {
  return {
    actionId,
    side: "runner",
    matchId: "match_1",
    clientKnownStateVersion: 1,
  } as PlayerAction;
}

function host(
  overrides: Partial<{
    turnHandled: boolean;
    movementHandled: boolean;
    accessHandled: boolean;
  }> = {},
): { host: PerformActionExecutionHost; calls: HostCalls } {
  const calls: HostCalls = {
    turn: vi.fn(() => ({ handled: overrides.turnHandled ?? false })),
    economy: vi.fn(),
    abilities: vi.fn(),
    activated: vi.fn(),
    play: vi.fn(),
    install: vi.fn(),
    board: vi.fn(),
    scoreAgenda: vi.fn(),
    startRun: vi.fn(),
    movement: vi.fn(() => ({ handled: overrides.movementHandled ?? false })),
    breaker: vi.fn(),
    continueRun: vi.fn(),
    rez: vi.fn(),
    access: vi.fn(() => ({ handled: overrides.accessHandled ?? true })),
    choices: vi.fn(),
  };

  return {
    calls,
    host: {
      turn: {
        handleTurnBasicExecution: spyAs<
          PerformActionExecutionHost["turn"]["handleTurnBasicExecution"]
        >(calls.turn),
      },
      economy: {
        handleCreditEconomyExecution: spyAs<
          PerformActionExecutionHost["economy"]["handleCreditEconomyExecution"]
        >(calls.economy),
      },
      abilities: {
        handleTriggerAbilityExecution: spyAs<
          PerformActionExecutionHost["abilities"]["handleTriggerAbilityExecution"]
        >(calls.abilities),
      },
      cardImplementation: {
        handleActivatedCardImplementationAction: spyAs<
          PerformActionExecutionHost["cardImplementation"]["handleActivatedCardImplementationAction"]
        >(calls.activated),
      },
      play: {
        handlePlayCardExecution: spyAs<
          PerformActionExecutionHost["play"]["handlePlayCardExecution"]
        >(calls.play),
      },
      install: {
        executeInstallCard: spyAs<
          PerformActionExecutionHost["install"]["executeInstallCard"]
        >(calls.install),
      },
      board: {
        handleBoardStateActionExecution: spyAs<
          PerformActionExecutionHost["board"]["handleBoardStateActionExecution"]
        >(calls.board),
      },
      corp: {
        scoreAgenda: spyAs<
          PerformActionExecutionHost["corp"]["scoreAgenda"]
        >(calls.scoreAgenda),
      },
      run: {
        handleStartRunActionExecution: spyAs<
          PerformActionExecutionHost["run"]["handleStartRunActionExecution"]
        >(calls.startRun),
        handleRunMovementAction: spyAs<
          PerformActionExecutionHost["run"]["handleRunMovementAction"]
        >(calls.movement),
        handleRunnerBreakerActionExecution: spyAs<
          PerformActionExecutionHost["run"]["handleRunnerBreakerActionExecution"]
        >(calls.breaker),
        continueRun: spyAs<PerformActionExecutionHost["run"]["continueRun"]>(
          calls.continueRun,
        ),
      },
      rez: {
        handleRezActionExecution: spyAs<
          PerformActionExecutionHost["rez"]["handleRezActionExecution"]
        >(calls.rez),
      },
      access: {
        handleAccessExecution: spyAs<
          PerformActionExecutionHost["access"]["handleAccessExecution"]
        >(calls.access),
      },
      choices: {
        resolvePendingChoice: spyAs<
          PerformActionExecutionHost["choices"]["resolvePendingChoice"]
        >(calls.choices),
      },
    },
  };
}

function expectOnlyCalled(calls: HostCalls, expected: keyof HostCalls): void {
  for (const [name, spy] of Object.entries(calls)) {
    if (name === "turn") continue;
    if (name === expected) expect(spy).toHaveBeenCalledTimes(1);
    else expect(spy).not.toHaveBeenCalled();
  }
}

describe("perform-action dispatcher", () => {
  it("does not import from index or contain public event wiring", () => {
    const source = readFileSync(
      new URL("./perform-action.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain("../index");
    expect(source).not.toContain("../../index");
    expect(source).not.toContain("PublicPayload");
    expect(source).not.toContain("BuildEvent");
  });

  it("short-circuits turn-basic actions before branch dispatch", () => {
    const { host: performHost, calls } = host({ turnHandled: true });
    const action = legalAction("draw_card");

    performAction(performHost, action, playerAction(action.actionId));

    expect(calls.turn).toHaveBeenCalledWith(action);
    expectOnlyCalled(calls, "turn");
  });

  it.each([
    ["activated_card_ability", "activated"],
    ["gain_credit", "economy"],
    ["play_event", "play"],
    ["play_operation", "play"],
    ["install_card", "install"],
    ["advance_card", "board"],
    ["start_run", "startRun"],
    ["jack_out", "movement"],
    ["rez_ice", "rez"],
    ["decline_rez", "rez"],
    ["pump_breaker", "breaker"],
    ["break_subroutine", "breaker"],
    ["trash_resource", "board"],
    ["move_to_set_aside", "board"],
    ["move_to_removed_from_game", "board"],
    ["return_from_set_aside", "board"],
    ["change_card_control", "board"],
    ["trigger_ability", "abilities"],
  ] satisfies Array<[LegalAction["type"], keyof HostCalls]>)(
    "delegates %s to %s",
    (type, expected) => {
      const { host: performHost, calls } = host();
      const action = legalAction(type);

      performAction(performHost, action, playerAction(action.actionId));

      expect(calls.turn).toHaveBeenCalledWith(action);
      expectOnlyCalled(calls, expected);
    },
  );

  it("passes score_agenda card id to the corp scorer", () => {
    const { host: performHost, calls } = host();
    const action = legalAction("score_agenda", {
      cardId: "agenda_1" as CardInstanceId,
    });

    performAction(performHost, action, playerAction(action.actionId));

    expect(calls.scoreAgenda).toHaveBeenCalledWith(action, "agenda_1");
  });

  it("continues through run-continuation only when movement does not handle it", () => {
    const handled = host({ movementHandled: true });
    const action = legalAction("continue_run");

    performAction(handled.host, action, playerAction(action.actionId));
    expect(handled.calls.movement).toHaveBeenCalledWith(action);
    expect(handled.calls.continueRun).not.toHaveBeenCalled();

    const fallback = host({ movementHandled: false });
    performAction(fallback.host, action, playerAction(action.actionId));
    expect(fallback.calls.movement).toHaveBeenCalledWith(action);
    expect(fallback.calls.continueRun).toHaveBeenCalledWith(action);
  });

  it.each(["access_card", "steal_agenda", "trash_accessed_card", "decline_trash"] as const)(
    "preserves invalid access error for %s",
    (type) => {
      const { host: performHost } = host({ accessHandled: false });
      const action = legalAction(type);

      expect(() =>
        performAction(performHost, action, playerAction(action.actionId)),
      ).toThrow("Die Access-Aktion ist nicht gueltig.");
    },
  );

  it("delegates resolve_choice with player action", () => {
    const { host: performHost, calls } = host();
    const action = legalAction("resolve_choice");
    const player = playerAction(action.actionId);

    performAction(performHost, action, player);

    expect(calls.choices).toHaveBeenCalledWith(action, player);
  });

  it("keeps unsupported action behavior as a no-op after turn precheck", () => {
    const { host: performHost, calls } = host();
    const action = legalAction("unsupported_action" as LegalAction["type"]);

    performAction(performHost, action, playerAction(action.actionId));

    expect(calls.turn).toHaveBeenCalledWith(action);
    for (const [name, spy] of Object.entries(calls)) {
      if (name !== "turn") expect(spy).not.toHaveBeenCalled();
    }
  });

  it("creates an executor from a state-bound host factory", () => {
    const { host: performHost, calls } = host();
    const state = { stateVersion: 1 } as GameState;
    const action = legalAction("gain_credit");
    const executor = createPerformActionExecutor((receivedState) => {
      expect(receivedState).toBe(state);
      return performHost;
    });

    executor(state, action, playerAction(action.actionId));

    expect(calls.economy).toHaveBeenCalledWith(action);
  });
});
