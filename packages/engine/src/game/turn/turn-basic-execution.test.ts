import type {
  CardInstanceId,
  GameState,
  LegalAction,
  Side,
} from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createGame } from "../create-game";
import { buildLegalAction } from "./action-builders";
import {
  addCorpActionDebt,
  handleTurnBasicExecution,
  purgeVirusCounters,
  type DrawTaxDecision,
  type TurnBasicExecutionHost,
  type TurnBasicRunnerDrawSummary,
} from "./turn-basic-execution";

describe("turn basic execution", () => {
  it("returns unhandled for actions outside the turn-basic boundary", () => {
    const state = createGame({
      seed: "arch-64-turn-basic-unhandled",
      setupMode: "completed",
    });
    const before = JSON.stringify(state);
    const action = buildLegalAction(
      state,
      "runner",
      "gain_credit",
      "1 Credit nehmen",
      "basic_action",
      [{ clicks: 1 }],
    );

    expect(handleTurnBasicExecution(testHost(state), action)).toEqual({
      handled: false,
    });
    expect(JSON.stringify(state)).toBe(before);
  });

  it("executes simple Runner draw through the provided draw callbacks", () => {
    const state = createGame({
      seed: "arch-64-turn-basic-runner-draw",
      setupMode: "completed",
    });
    state.activeSide = "runner";
    state.phase = "runner_action_phase";
    state.timingPoint = "runner_action.main";
    state.runner.clicks = 4;
    const stackBefore = state.runner.stack.length;
    const gripBefore = state.runner.grip.length;
    const action = buildLegalAction(
      state,
      "runner",
      "draw_card",
      "Karte ziehen",
      "basic_action",
      [{ clicks: 1 }],
    );

    expect(handleTurnBasicExecution(testHost(state), action)).toMatchObject({
      handled: true,
      actionType: "draw_card",
    });
    expect(state.runner.clicks).toBe(3);
    expect(state.runner.stack).toHaveLength(stackBefore - 1);
    expect(state.runner.grip).toHaveLength(gripBefore + 1);
    expect(action.payload).toMatchObject({ drawnCount: 1 });
  });

  it("executes simple Corp draw without duplicating Runner draw replacements", () => {
    const state = createGame({
      seed: "arch-64-turn-basic-corp-draw",
      setupMode: "completed",
    });
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;
    const rdBefore = state.corp.rd.length;
    const hqBefore = state.corp.hq.length;
    const action = buildLegalAction(
      state,
      "corp",
      "draw_card",
      "Karte ziehen",
      "basic_action",
      [{ clicks: 1 }],
    );

    handleTurnBasicExecution(testHost(state), action);

    expect(state.corp.clicks).toBe(2);
    expect(state.corp.rd).toHaveLength(rdBefore - 1);
    expect(state.corp.hq).toHaveLength(hqBefore + 1);
    expect(action.payload).toBeUndefined();
  });

  it("removes one normal Runner tag with delegated tag-removal payment", () => {
    const state = createGame({
      seed: "arch-64-turn-basic-remove-tag",
      setupMode: "completed",
    });
    state.activeSide = "runner";
    state.phase = "runner_action_phase";
    state.timingPoint = "runner_action.main";
    state.runner.clicks = 4;
    state.runner.tags = 2;
    state.runner.credits = 5;
    const action = buildLegalAction(
      state,
      "runner",
      "remove_tag",
      "Tag entfernen",
      "basic_action",
      [{ clicks: 1, credits: 2 }],
    );

    handleTurnBasicExecution(testHost(state), action);

    expect(state.runner.clicks).toBe(3);
    expect(state.runner.credits).toBe(3);
    expect(state.runner.tags).toBe(1);
    expect(action.payload).toMatchObject({ removeTagAmount: 1 });
  });

  it("purges normal virus counters without touching other counter types", () => {
    const state = createGame({
      seed: "arch-64-turn-basic-purge-virus",
      setupMode: "completed",
    });
    state.corp.clicks = 3;
    const cardId = state.corp.identity;
    state.cardInstances[cardId] = {
      ...state.cardInstances[cardId]!,
      counters: { virus: 2, power: 1 },
    };
    state.poxCountersByServer = { hq: 1 };
    state.faitAccompliCountersByServer = { rd: 1 };
    const action = buildLegalAction(
      state,
      "corp",
      "purge_virus_counters",
      "Virus-Counter purgen",
      "basic_action",
      [{ clicks: 3 }],
      { purgedCounterType: "virus" },
    );

    handleTurnBasicExecution(testHost(state), action);

    expect(state.corp.clicks).toBe(0);
    expect(state.cardInstances[cardId]?.counters).toEqual({ power: 1 });
    expect(state.poxCountersByServer).toEqual({});
    expect(state.faitAccompliCountersByServer).toEqual({});
    expect(action.payload).toMatchObject({
      purgedVirusCounters: 4,
      purgedCounterType: "virus",
    });
  });

  it("purges registered Runner-virus counters and opens Corp action debt", () => {
    const state = createGame({
      seed: "arch-64-turn-basic-purge-runner-virus",
      setupMode: "completed",
    });
    state.runnerVirusPurgeWindow = {
      windowId: "arch64.window",
      timingFamily: "run_special_effect",
    };
    state.purgeableRunnerVirusCounters = {
      corp: { tax: 2 },
      servers: { rd: { socket_rd: 1 } },
      effects: {
        doom_roll: {
          counterType: "doom",
          amount: 1,
          publicLabel: "Doom",
        },
      },
    };
    const action = buildLegalAction(
      state,
      "corp",
      "purge_runner_virus_counters",
      "Runner-Virus-Counter purgen",
      "game_rule",
      [],
      { purgeModel: "future_action_debt" },
    );

    handleTurnBasicExecution(testHost(state), action);

    expect(state.purgeableRunnerVirusCounters).toBeUndefined();
    expect(state.runnerVirusPurgeWindow).toBeUndefined();
    expect(state.corpActionDebt).toMatchObject({
      forgoActionsPending: 3,
      entries: [
        {
          reason: "proteus_virus_purge",
          remaining: 3,
          createdAtStateVersion: state.stateVersion,
          source: "proteus_purge",
        },
      ],
    });
    expect(action.payload).toMatchObject({
      purgeModel: "future_action_debt",
      purgedRunnerVirusCounters: 4,
      purgedCounterSummary:
        "corp:tax=2;server:rd:socket_rd=1;effect:doom_roll:doom=1",
      actionDebtAdded: 3,
      corpActionDebtTotalAfter: 3,
      timingWindowId: "arch64.window",
      timingFamily: "run_special_effect",
    });
  });

  it("pays Corp action debt through forgo_action", () => {
    const state = createGame({
      seed: "arch-64-turn-basic-forgo-action",
      setupMode: "completed",
    });
    state.corp.clicks = 2;
    addCorpActionDebt(state, {
      amount: 2,
      reason: "test_debt",
      source: "arch64",
    });
    const action = buildLegalAction(
      state,
      "corp",
      "forgo_action",
      "Aktionsschuld abtragen",
      "game_rule",
      [{ clicks: 1 }],
    );

    handleTurnBasicExecution(testHost(state), action);

    expect(state.corp.clicks).toBe(1);
    expect(state.corpActionDebt?.forgoActionsPending).toBe(1);
    expect(action.payload).toMatchObject({
      actionDebtPaid: 1,
      corpActionDebtTotalBefore: 2,
      corpActionDebtTotalAfter: 1,
      corpClicksAfter: 1,
    });
  });

  it("delegates end_turn to the configured turn callback", () => {
    const state = createGame({
      seed: "arch-64-turn-basic-end-turn",
      setupMode: "completed",
    });
    const calls: Array<{ side: Side; actionType: string }> = [];
    const action = buildLegalAction(
      state,
      "runner",
      "end_turn",
      "Zug beenden",
      "game_rule",
    );

    handleTurnBasicExecution(
      testHost(state, {
        endTurn: (_state, side, legalAction) => {
          calls.push({ side, actionType: legalAction.type });
          _state.activeSide = "corp";
        },
      }),
      action,
    );

    expect(calls).toEqual([{ side: "runner", actionType: "end_turn" }]);
    expect(state.activeSide).toBe("corp");
  });

  it("does not import from index.ts", () => {
    const source = readFileSync(
      new URL("./turn-basic-execution.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain('from "../index"');
    expect(source).not.toContain("from '../index'");
    expect(source).not.toContain('from "../../index"');
    expect(source).not.toContain("from '../../index'");
    expect(source).not.toContain("buildEvent");
    expect(source).not.toContain("PublicPayload");
  });
});

function testHost(
  state: GameState,
  overrides: Partial<{
    endTurn: TurnBasicExecutionHost["turn"]["endTurn"];
  }> = {},
): TurnBasicExecutionHost {
  return {
    state,
    draw: {
      drawCorpCard: drawCorpCardForTest,
      drawRunnerCards: drawRunnerCardsForTest,
      applyRunnerDrawSummaryPayload: (_state, legalAction, summary) => {
        if (summary.drawnCount <= 0) return;
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          drawnCount: summary.drawnCount,
          drawnCardIds: summary.drawnCardIds?.join(",") ?? "",
        };
      },
    },
    turn: {
      spendClick,
      spendClicks: (next, side, amount) => {
        for (let index = 0; index < amount; index += 1) spendClick(next, side);
      },
      endTurn:
        overrides.endTurn ??
        ((next, side) => {
          next.activeSide = side === "corp" ? "runner" : "corp";
        }),
    },
    credits: {
      spendRunnerTagRemovalCredits: (next, amount, legalAction) => {
        if (next.runner.credits < amount)
          throw new Error("Der Runner kann die Tag-Entfernung nicht bezahlen.");
        next.runner.credits -= amount;
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          removeTagAmount: 1,
        };
      },
    },
    cards: {
      trashRunnerInstalledCardToHeap: (next, cardId) => {
        const typedCardId = cardId as CardInstanceId;
        next.runner.rig.resources = next.runner.rig.resources.filter(
          (candidate) => candidate !== typedCardId,
        );
        next.runner.heap.push(typedCardId);
      },
    },
    callbacks: {
      startCodeViralCachePurgeChoice: () => false,
    },
  };
}

function spendClick(state: GameState, side: Side): void {
  const clicks = side === "corp" ? state.corp.clicks : state.runner.clicks;
  if (clicks <= 0) throw new Error("Nicht genug Klicks vorhanden.");
  if (side === "corp") state.corp.clicks -= 1;
  else state.runner.clicks -= 1;
}

function drawCorpCardForTest(state: GameState): void {
  const cardId = state.corp.rd.shift();
  if (!cardId) return;
  state.corp.hq.push(cardId);
  state.cardInstances[cardId] = {
    ...state.cardInstances[cardId]!,
    zone: { side: "corp", zone: "hq" },
  };
}

function drawRunnerCardsForTest(
  state: GameState,
  amount: number,
  _decision?: DrawTaxDecision,
): TurnBasicRunnerDrawSummary {
  const drawnCardIds: CardInstanceId[] = [];
  for (let index = 0; index < amount; index += 1) {
    const cardId = state.runner.stack.shift();
    if (!cardId) break;
    drawnCardIds.push(cardId);
    state.runner.grip.push(cardId);
    state.cardInstances[cardId] = {
      ...state.cardInstances[cardId]!,
      zone: { side: "runner", zone: "grip" },
    };
  }
  return {
    drawnCount: drawnCardIds.length,
    drawnCardIds,
    drawTaxSourceCount: 0,
    drawTaxCreditsPaid: 0,
    drawTaxTagsAdded: 0,
  };
}

describe("turn basic purge helper", () => {
  it("throws when normal virus purge has no counters", () => {
    const state = createGame({
      seed: "arch-64-turn-basic-empty-purge",
      setupMode: "completed",
    });
    for (const cardId of Object.keys(state.cardInstances)) {
      const { counters: _counters, ...withoutCounters } =
        state.cardInstances[cardId as CardInstanceId]!;
      void _counters;
      state.cardInstances[cardId as CardInstanceId] = {
        ...withoutCounters,
      };
    }

    expect(() => purgeVirusCounters(state)).toThrow(
      "Es gibt keine Virus-Counter zu purgen.",
    );
  });
});
