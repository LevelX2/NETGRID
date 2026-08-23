import { type GameState } from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  credits,
  loseAllCorpCredits,
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

  it("rejects non-finite, fractional and negative credit amounts without mutation", () => {
    for (const amount of [Number.NaN, Number.POSITIVE_INFINITY, 1.5, -1]) {
      const current = state();
      expect(() => spendCredits(current, "runner", amount)).toThrow(
        "Credit amount ist ungueltig.",
      );
      expect(current.runner.credits).toBe(5);
      expect(current.corp.credits).toBe(4);
    }
  });

  it("consumes unrestricted trace-window credits before normal Corp credits", () => {
    const current = state();
    current.corp.credits = 9;
    current.trace = {
      traceId: "trace_unrestricted_credits",
      sourceCardInstanceId: "ldl_1",
      sourceDefinitionId: "onr_proteus_061_ldl-traffic-analyzers",
      traceLimit: 5,
      status: "corp_bid",
      successEffect: { type: "none" },
      corpTemporaryTraceCredits: {
        sourceCardInstanceId: "ldl_1",
        sourceDefinitionId: "onr_proteus_061_ldl-traffic-analyzers",
        remaining: 5,
        includedInCorpCreditPool: true,
        usableFor: "unrestricted_during_current_trace",
        returnUnusedAtTraceEnd: true,
      },
    } as NonNullable<GameState["trace"]>;

    spendCredits(current, "corp", 3);

    expect(current.corp.credits).toBe(6);
    expect(current.trace.corpTemporaryTraceCredits?.remaining).toBe(2);
  });

  it("loses the complete Corp pool and clears every included temporary pool", () => {
    const current = state();
    current.corp.credits = 12;
    current.corpTemporaryInstallRezCredits = {
      sourceCardInstanceId: "install_source",
      sourceDefinitionId: "simple_economy_asset",
      remaining: 3,
      usableFor: "corp_install_or_rez",
      returnUnusedAtTurnEnd: true,
    };
    current.run = {
      corpRunTemporaryCredits: {
        sourceCardInstanceId: "run_source",
        sourceDefinitionId: "simple_upgrade",
        remaining: 4,
        usableFor: "corp_costs_during_this_run",
        returnUnusedAtRunEnd: true,
      },
    } as NonNullable<GameState["run"]>;
    current.trace = {
      corpTemporaryTraceCredits: {
        sourceCardInstanceId: "trace_source",
        sourceDefinitionId: "simple_upgrade",
        remaining: 5,
        includedInCorpCreditPool: true,
        usableFor: "unrestricted_during_current_trace",
        returnUnusedAtTraceEnd: true,
      },
    } as NonNullable<GameState["trace"]>;

    expect(loseAllCorpCredits(current)).toBe(12);
    expect(current.corp.credits).toBe(0);
    expect(current.corpTemporaryInstallRezCredits).toBeUndefined();
    expect(current.run.corpRunTemporaryCredits).toBeUndefined();
    expect(current.trace.corpTemporaryTraceCredits).toBeUndefined();
  });

  it("spends clicks and updates runner action/run-lock flags", () => {
    const current = state();
    ensureRunnerTurnFlags(current).runLockActionsPending = 2;

    spendClick(current, "runner");
    expect(current.runner.clicks).toBe(2);
    expect(ensureRunnerTurnFlags(current).runnerActionOrdinal).toBe(1);
    expect(ensureRunnerTurnFlags(current).runLockActionsPending).toBe(1);

    spendClicks(current, "runner", 2);
    expect(current.runner.clicks).toBe(0);
    expect(ensureRunnerTurnFlags(current).runnerActionOrdinal).toBe(3);
    expect(ensureRunnerTurnFlags(current).runLockActionsPending).toBe(0);

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
