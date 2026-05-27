import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  GameState,
  LegalAction,
  SubroutineDefinition,
} from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { RuntimeIcebreakerAbility } from "../../ability-engine/icebreaker-abilities";
import {
  handleRunnerBreakerActionExecution,
  type RunnerBreakerActionExecutionHost,
} from "./runner-breaker-action-execution";

const BREAKER_ID = "breaker" as CardInstanceId;
const ICE_ID = "ice" as CardInstanceId;

function state(): GameState {
  return {
    stateVersion: 4,
    activeSide: "runner",
    phase: "run",
    timingPoint: "run.encounter_ice",
    baseline: { engineSchemaVersion: "0.99.0" },
    runner: {
      credits: 5,
      clicks: 2,
      tags: 0,
      stack: [],
      grip: [],
      heap: [],
      scoreArea: [],
      identity: "runner_identity" as CardInstanceId,
      rig: {
        programs: [BREAKER_ID],
        hardware: [],
        resources: [],
      },
    },
    corp: {
      credits: 5,
      hq: [],
      rd: [],
      archives: [],
      scoreArea: [],
      identity: "corp_identity" as CardInstanceId,
      servers: [
        {
          id: "hq",
          kind: "hq",
          label: "HQ",
          ice: [ICE_ID],
          root: [],
        },
      ],
    },
    cardInstances: {
      [BREAKER_ID]: {
        id: BREAKER_ID,
        definitionId: "breaker_definition",
        owner: "runner",
        controller: "runner",
        zone: { side: "runner", zone: "rig" },
        faceup: true,
        rezzed: true,
        strengthModifier: 1,
      } as unknown as CardInstance,
      [ICE_ID]: {
        id: ICE_ID,
        definitionId: "ice_definition",
        owner: "corp",
        controller: "corp",
        zone: { side: "corp", zone: "serverIce", serverId: "hq" },
        faceup: true,
        rezzed: true,
        strengthModifier: 0,
      } as unknown as CardInstance,
    },
    run: {
      runId: "run_4",
      attackedServerId: "hq",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "hq", iceIndex: 0 },
      approachedIceId: ICE_ID,
      encounteredIceId: ICE_ID,
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
      successful: false,
      accessCount: 1,
    },
    eventLog: [],
    randomCounter: 0,
  } as unknown as GameState;
}

function legalAction(
  type: LegalAction["type"],
  payload: NonNullable<LegalAction["payload"]> = {},
  credits = 1,
): LegalAction {
  return {
    actionId: `${type}.1`,
    type,
    label: type,
    side: "runner",
    source: "game_rule",
    stateVersion: 4,
    timingPoint: "run.encounter_ice",
    costs: credits > 0 ? [{ credits }] : [],
    payload,
  } as unknown as LegalAction;
}

function definition(id = "breaker_definition"): CardDefinition {
  return {
    id,
    title: id,
    side: id === "ice_definition" ? "corp" : "runner",
    type: id === "ice_definition" ? "ice" : "program",
    strength: 2,
    subroutines: [{ id: "sub_0", type: "end_the_run" } as SubroutineDefinition],
  } as CardDefinition;
}

type HostOverrides = {
  cards?: Partial<RunnerBreakerActionExecutionHost["cards"]>;
  run?: Partial<RunnerBreakerActionExecutionHost["run"]>;
  breaker?: Partial<RunnerBreakerActionExecutionHost["breaker"]>;
  payment?: Partial<RunnerBreakerActionExecutionHost["payment"]>;
  fort?: Partial<RunnerBreakerActionExecutionHost["fort"]>;
  effects?: Partial<RunnerBreakerActionExecutionHost["effects"]>;
  turn?: Partial<RunnerBreakerActionExecutionHost["turn"]>;
  tracking?: Partial<RunnerBreakerActionExecutionHost["tracking"]>;
};

function hostFor(
  targetState: GameState,
  calls: string[],
  overrides: HostOverrides = {},
): RunnerBreakerActionExecutionHost {
  const host: RunnerBreakerActionExecutionHost = {
    state: targetState,
    cards: {
      definitionFor: (cardId) =>
        definition(cardId === ICE_ID ? "ice_definition" : "breaker_definition"),
      cardInstanceFor: (cardId) => targetState.cardInstances[cardId] as CardInstance,
      effectiveSubtypesForCard: () => [],
    },
    run: {
      currentRun: () => targetState.run as NonNullable<GameState["run"]>,
      currentEncounterSubroutines: () => [],
      runRemainderStrengthBonusForBreaker: () => 2,
      finishRun: (successful) => calls.push(`finish:${successful}`),
    },
    breaker: {
      pumpAbilityForLegalAction: () => undefined,
      pumpAmountForLegalAction: () => 1,
      pumpDurationForLegalAction: () => "current_encounter",
      breakAbilityForLegalAction: () =>
        ({ type: "break_subroutine" }) as RuntimeIcebreakerAbility,
      assertCurrentSubroutineMatchesLegalAction: () =>
        ({ id: "sub_0", type: "end_the_run" }) as SubroutineDefinition,
      assertBreakSubroutineCostQuoteValid: () => calls.push("assertCost"),
      resolveMultiBreakSubroutinesAction: () => calls.push("multiBreak"),
      resolveBlinkBreakSubroutineAction: () => calls.push("blink"),
    },
    payment: {
      spendRunnerRunCredits: (amount, breakerId) =>
        calls.push(`spend:${amount}:${breakerId ?? "none"}`),
    },
    fort: {
      shouldOpenAardvarkInterception: () => false,
      startAardvarkInterceptionChoice: (_breakerId, actionType) =>
        calls.push(`aardvark:${actionType}`),
      applyPostBreakStealthLoss: () => calls.push("stealthLoss"),
    },
    effects: {
      executeEffectCommands: (commands) =>
        calls.push(
          ...commands.map((command) =>
            command.type === "break_subroutine"
              ? `effect:${command.type}:${command.subroutineIndex}`
              : command.type === "change_breaker_strength"
                ? `effect:${command.type}:${command.amount}`
                : `effect:${command.type}`,
          ),
        ),
      addRunnerFutureActionDebt: (amount) => calls.push(`futureDebt:${amount}`),
    },
    turn: {
      ensureRunnerTurnFlags: () => {
        targetState.runnerTurnFlags ??= {
          stoleAgendaThisTurn: false,
          stoleAgendaLastTurn: false,
        };
        return targetState.runnerTurnFlags;
      },
    },
    tracking: {
      recordBartmossEncounterUsage: () => calls.push("bartmoss"),
      recordDupreBreakUsage: () => calls.push("dupre"),
      recordSnowballBreakUsage: () => calls.push("snowball"),
    },
  };

  return {
    state: host.state,
    cards: { ...host.cards, ...overrides.cards },
    run: { ...host.run, ...overrides.run },
    breaker: { ...host.breaker, ...overrides.breaker },
    payment: { ...host.payment, ...overrides.payment },
    fort: { ...host.fort, ...overrides.fort },
    effects: { ...host.effects, ...overrides.effects },
    turn: { ...host.turn, ...overrides.turn },
    tracking: { ...host.tracking, ...overrides.tracking },
  };
}

describe("runner-breaker-action-execution", () => {
  it("does not import from index or contain public event wiring", () => {
    const source = readFileSync(
      new URL("./runner-breaker-action-execution.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain("../index");
    expect(source).not.toContain("../../index");
    expect(source).not.toContain("PublicPayload");
    expect(source).not.toContain("BuildEvent");
  });

  it("returns unhandled for unrelated actions", () => {
    const calls: string[] = [];
    const result = handleRunnerBreakerActionExecution(
      hostFor(state(), calls),
      legalAction("gain_credit"),
    );

    expect(result).toEqual({ handled: false });
    expect(calls).toEqual([]);
  });

  it("executes a basic pump through payment and effect callbacks", () => {
    const calls: string[] = [];
    const action = legalAction("pump_breaker", { breakerId: BREAKER_ID });

    const result = handleRunnerBreakerActionExecution(
      hostFor(state(), calls, {
        breaker: { pumpAmountForLegalAction: () => 2 },
      }),
      action,
    );

    expect(result.handled).toBe(true);
    expect(calls).toEqual([
      `spend:1:${BREAKER_ID}`,
      "effect:change_breaker_strength:2",
    ]);
  });

  it("keeps current-run strength bonus payload and optional run end stable", () => {
    const calls: string[] = [];
    const targetState = state();
    const action = legalAction(
      "pump_breaker",
      { breakerId: BREAKER_ID, pumpAmount: 3 },
      3,
    );

    handleRunnerBreakerActionExecution(
      hostFor(targetState, calls, {
        breaker: {
          pumpAbilityForLegalAction: () =>
            ({ type: "pump_strength", onUseEndRun: true }) as RuntimeIcebreakerAbility,
          pumpAmountForLegalAction: () => 3,
          pumpDurationForLegalAction: () => "current_run",
        },
      }),
      action,
    );

    expect(targetState.run?.remainderStrengthBonusByBreaker?.[BREAKER_ID]).toBe(5);
    expect(action.payload).toMatchObject({
      runRemainderStrengthBonusApplied: true,
      runRemainderStrengthBonusAfter: 5,
    });
    expect(calls).toEqual([`spend:3:${BREAKER_ID}`, "finish:false"]);
  });

  it("opens Aardvark interception and stops pump execution", () => {
    const calls: string[] = [];

    handleRunnerBreakerActionExecution(
      hostFor(state(), calls, {
        fort: { shouldOpenAardvarkInterception: () => true },
      }),
      legalAction("pump_breaker", { breakerId: BREAKER_ID }),
    );

    expect(calls).toEqual([`spend:1:${BREAKER_ID}`, "aardvark:pump_breaker"]);
  });

  it("executes a basic break through validation, payment, effects and tracking", () => {
    const calls: string[] = [];

    handleRunnerBreakerActionExecution(
      hostFor(state(), calls),
      legalAction("break_subroutine", {
        breakerId: BREAKER_ID,
        subroutineIndex: 0,
      }),
    );

    expect(calls).toEqual([
      "assertCost",
      `spend:1:${BREAKER_ID}`,
      "effect:break_subroutine:0",
      "stealthLoss",
      "bartmoss",
      "dupre",
      "snowball",
    ]);
  });

  it("delegates multi-break and Blink special paths without duplicating engines", () => {
    const multiCalls: string[] = [];
    handleRunnerBreakerActionExecution(
      hostFor(state(), multiCalls, {
        breaker: {
          breakAbilityForLegalAction: () =>
            ({ type: "break_subroutine", count: 2 }) as RuntimeIcebreakerAbility,
        },
      }),
      legalAction("break_subroutine", {
        breakerId: BREAKER_ID,
        subroutineIndexes: "0,1",
      }),
    );

    expect(multiCalls).toEqual(["multiBreak", "bartmoss", "dupre", "snowball"]);

    const blinkCalls: string[] = [];
    handleRunnerBreakerActionExecution(
      hostFor(state(), blinkCalls, {
        breaker: {
          breakAbilityForLegalAction: () =>
            ({
              type: "break_subroutine",
              special: "blink_random_break_or_net_damage",
            }) as RuntimeIcebreakerAbility,
        },
      }),
      legalAction("break_subroutine", {
        breakerId: BREAKER_ID,
        subroutineIndex: 0,
      }),
    );

    expect(blinkCalls).toEqual(["assertCost", `spend:1:${BREAKER_ID}`, "blink"]);
  });
});
