import { type GameState } from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  credits,
  spendClick,
  spendClicks,
  spendCredits,
} from "./economy-mutation";
import { ensureRunnerTurnFlags } from "./turn-flags-counters";

function state(): GameState {
  return {
    runner: { credits: 5, clicks: 3 },
    corp: { credits: 4, clicks: 2 },
  } as unknown as GameState;
}

describe("economy-mutation", () => {
  it("does not import index or contain payment engine/public payload wiring", () => {
    const source = readFileSync(
      new URL("./economy-mutation.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain("../index");
    expect(source).not.toContain("../../index");
    expect(source).not.toContain("PublicPayload");
    expect(source).not.toContain("publicContext");
    expect(source).not.toContain("quote");
    expect(source).not.toContain("randomPurpose");
  });

  it("spends and gains credits with stable errors", () => {
    const current = state();

    spendCredits(current, "runner", 2);
    spendCredits(current, "corp", 3);
    expect(current.runner.credits).toBe(3);
    expect(current.corp.credits).toBe(1);

    credits(current, "runner", 4);
    credits(current, "corp", 2);
    expect(current.runner.credits).toBe(7);
    expect(current.corp.credits).toBe(3);

    expect(() => spendCredits(current, "runner", 8)).toThrow(
      "Der Runner kann die Kosten nicht bezahlen.",
    );
    expect(() => spendCredits(current, "corp", 4)).toThrow(
      "Die Korp kann die Kosten nicht bezahlen.",
    );
  });

  it("spends clicks and updates runner action/run-lock flags", () => {
    const current = state();
    ensureRunnerTurnFlags(current).runLockActionsPending = 2;

    spendClick(current, "runner");
    expect(current.runner.clicks).toBe(2);
    expect(ensureRunnerTurnFlags(current).runnerActionsTakenThisTurn).toBe(1);
    expect(ensureRunnerTurnFlags(current).runLockActionsPending).toBe(1);

    spendClicks(current, "runner", 2);
    expect(current.runner.clicks).toBe(0);
    expect(ensureRunnerTurnFlags(current).runnerActionsTakenThisTurn).toBe(3);

    spendClick(current, "corp");
    expect(current.corp.clicks).toBe(1);

    expect(() => spendClick(current, "runner")).toThrow(
      "Der Runner hat keine Clicks mehr.",
    );
    expect(() => spendClicks(current, "corp", -1)).toThrow(
      "Click amount ist ungueltig.",
    );
  });
});
