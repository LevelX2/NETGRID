import {
  type CardInstance,
  type CardInstanceId,
  type GameState,
} from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  addCardCounter,
  cardCounter,
  clearCardCounters,
  ensureCorpTurnFlags,
  ensureRunnerTurnFlags,
  recordRunnerActionSpent,
  setCardCounter,
  spendCardCounter,
} from "./turn-flags-counters";

const CARD_ID = "counter_card" as CardInstanceId;

function state(): GameState {
  return {
    runner: { rig: { programs: [], hardware: [], resources: [] } },
    corp: { servers: [], scoreArea: [] },
    cardInstances: {
      [CARD_ID]: {
        instanceId: CARD_ID,
        definitionId: "counter_definition",
        owner: "runner",
        controller: "runner",
        zone: { side: "runner", zone: "rig" },
        faceup: true,
        rezzed: true,
        advancementCounters: 0,
        strengthModifier: 0,
      } as CardInstance,
    },
  } as unknown as GameState;
}

describe("turn-flags-counters", () => {
  it("does not import index or contain public payload wiring", () => {
    const source = readFileSync(
      new URL("./turn-flags-counters.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain("../index");
    expect(source).not.toContain("../../index");
    expect(source).not.toContain("PublicPayload");
    expect(source).not.toContain("publicContext");
    expect(source).not.toContain("randomPurpose");
  });

  it("mutates card counters with stable errors and cleanup behavior", () => {
    const current = state();

    expect(cardCounter(current, CARD_ID, "virus")).toBe(0);
    addCardCounter(current, CARD_ID, "virus", 2);
    expect(cardCounter(current, CARD_ID, "virus")).toBe(2);
    spendCardCounter(current, CARD_ID, "virus", 1);
    expect(cardCounter(current, CARD_ID, "virus")).toBe(1);
    setCardCounter(current, CARD_ID, "virus", 0);
    expect(current.cardInstances[CARD_ID]?.counters).toBeUndefined();
    expect(() => addCardCounter(current, CARD_ID, "virus", -1)).toThrow(
      "Counter amount ist ungueltig.",
    );
    expect(() => spendCardCounter(current, CARD_ID, "virus", 1)).toThrow(
      "Nicht genug Counter vorhanden.",
    );

    setCardCounter(current, CARD_ID, "power", 3);
    clearCardCounters(current, CARD_ID);
    expect(current.cardInstances[CARD_ID]?.counters).toBeUndefined();
  });

  it("ensures turn flags and records runner action spending", () => {
    const current = state();

    const runnerFlags = ensureRunnerTurnFlags(current);
    expect(runnerFlags.runAttemptsThisTurn).toBe(0);
    expect(runnerFlags.shellTradersStartTurnResolvedSourceIds).toEqual([]);
    recordRunnerActionSpent(current, 2);
    expect(ensureRunnerTurnFlags(current).runnerActionsTakenThisTurn).toBe(2);

    const corpFlags = ensureCorpTurnFlags(current);
    expect(corpFlags.scoredBlackOpsAgendaThisTurn).toBe(false);
    expect(corpFlags.disinfectantUsedSourceIdsThisTurn).toEqual([]);
  });
});
