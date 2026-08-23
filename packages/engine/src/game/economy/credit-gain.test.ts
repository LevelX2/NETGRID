import type { CardInstanceId } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { createGame } from "../create-game";
import { applyCreditGain, creditGainPublicPayload } from "./credit-gain";

const ELENA_LASKOVA = "onr_classic_045_elena-laskova";
const FINDERS_KEEPERS = "onr_classic_037_finders-keepers";

describe("authoritative credit gain pipeline", () => {
  it("applies installed first-prep modifiers to the first gain only", () => {
    const state = game("credit-gain-elena");
    installElena(state);
    state.runner.credits = 0;

    const first = applyCreditGain(state, {
      side: "runner",
      baseAmount: 10,
      source: {
        kind: "card_effect",
        sourceDefinitionId: FINDERS_KEEPERS,
        gainOrdinal: 1,
        reason: "three_dice_gain_credits",
      },
    });
    const second = applyCreditGain(state, {
      side: "runner",
      baseAmount: 3,
      source: {
        kind: "card_effect",
        sourceDefinitionId: FINDERS_KEEPERS,
        gainOrdinal: 2,
        reason: "second_gain_regression",
      },
    });

    expect(first).toMatchObject({
      baseAmount: 10,
      bonusAmount: 1,
      requestedAmount: 11,
      interceptedAmount: 0,
      creditedAmount: 11,
      creditsBefore: 0,
      creditsAfter: 11,
      modifierSourceDefinitionIds: [ELENA_LASKOVA],
    });
    expect(creditGainPublicPayload(first)).toMatchObject({
      gainedCredits: 11,
      runnerCreditsAfter: 11,
      creditGainBaseAmount: 10,
      creditGainBonusAmount: 1,
      firstPrepCreditGainBonus: 1,
      firstPrepCreditGainBonusSourceDefinitionIds: ELENA_LASKOVA,
    });
    expect(second).toMatchObject({ bonusAmount: 0, creditedAmount: 3 });
    expect(state.runner.credits).toBe(14);
  });

  it("does not apply prep modifiers to non-event or temporary gains", () => {
    const state = game("credit-gain-non-prep");
    installElena(state);
    state.runner.credits = 0;

    const ruleGain = applyCreditGain(state, {
      side: "runner",
      baseAmount: 2,
      source: { kind: "rule_effect", reason: "basic_rule_reward" },
    });
    const temporary = applyCreditGain(state, {
      side: "corp",
      baseAmount: 4,
      source: {
        kind: "temporary_grant",
        sourceDefinitionId: "simple_economy_asset",
        reason: "temporary_install_or_rez_credits",
      },
    });

    expect(ruleGain).toMatchObject({ bonusAmount: 0, creditedAmount: 2 });
    expect(temporary).toMatchObject({
      bonusAmount: 0,
      creditedAmount: 4,
      countsAsStandardGain: false,
    });
  });

  it("keeps temporary Corp grants outside Investment Firm replacement", () => {
    const state = game("credit-gain-temporary-investment-firm");
    const firmId = "investment_firm" as CardInstanceId;
    const server = state.corp.servers.find(
      (candidate) => candidate.id === "rd",
    )!;
    state.cardInstances[firmId] = {
      instanceId: firmId,
      definitionId: "onr_v1_329_investment-firm",
      owner: "corp",
      controller: "corp",
      zone: { side: "corp", zone: "serverRoot", serverId: server.id },
      faceup: true,
      rezzed: true,
      advancementCounters: 0,
      strengthModifier: 0,
    };
    server.root.push(firmId);
    const before = state.corp.credits;

    const result = applyCreditGain(state, {
      side: "corp",
      baseAmount: 4,
      source: {
        kind: "temporary_grant",
        sourceDefinitionId: "simple_economy_asset",
        reason: "temporary_install_or_rez_credits",
      },
    });

    expect(result.creditedAmount).toBe(4);
    expect(state.corp.credits).toBe(before + 4);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.pendingCorpCreditGainReplacement).toBeUndefined();
  });

  it("keeps a prep bonus in the original run-only credit destination", () => {
    const state = game("credit-gain-elena-run-only");
    installElena(state);
    state.runner.credits = 3;
    state.run = {
      runnerRunTemporaryCredits: {
        sourceDefinitionId: FINDERS_KEEPERS,
        remaining: 4,
        returnUnusedAtRunEnd: true,
      },
    } as NonNullable<typeof state.run>;

    const result = applyCreditGain(state, {
      side: "runner",
      baseAmount: 4,
      source: {
        kind: "card_effect",
        sourceDefinitionId: FINDERS_KEEPERS,
        gainOrdinal: 1,
        reason: "prep_run_only_credit_gain",
      },
      destination: {
        kind: "runner_run_temporary",
        sourceDefinitionId: FINDERS_KEEPERS,
        returnUnusedAtRunEnd: true,
      },
    });

    expect(result).toMatchObject({
      bonusAmount: 1,
      creditedAmount: 5,
      creditsAfter: 9,
    });
    expect(state.runner.credits).toBe(3);
    expect(state.run?.runnerRunTemporaryCredits?.remaining).toBe(9);
    expect(creditGainPublicPayload(result)).toMatchObject({
      gainedCredits: 5,
      runnerRunTemporaryCreditsAfter: 9,
      firstPrepCreditGainBonus: 1,
    });
  });

  it("intercepts standard Corp gains with existing credit-forfeit debt", () => {
    const state = game("credit-gain-forfeit");
    state.corp.credits = 5;
    state.actionEconomy = { corpCreditForfeitDebt: { remaining: 2 } };

    const result = applyCreditGain(state, {
      side: "corp",
      baseAmount: 5,
      source: { kind: "rule_effect", reason: "credit_consolidation" },
    });

    expect(result).toMatchObject({
      requestedAmount: 5,
      interceptedAmount: 2,
      creditedAmount: 3,
      creditsBefore: 5,
      creditsAfter: 8,
    });
    expect(state.actionEconomy?.corpCreditForfeitDebt).toBeUndefined();
    expect(creditGainPublicPayload(result)).toMatchObject({
      gainedCredits: 3,
      creditGainRequestedAmount: 5,
      creditGainInterceptedAmount: 2,
      corpCreditsAfter: 8,
    });
  });

  it("rejects malformed amounts and card-effect ordinals", () => {
    const state = game("credit-gain-invalid");

    expect(() =>
      applyCreditGain(state, {
        side: "runner",
        baseAmount: -1,
        source: { kind: "rule_effect", reason: "invalid" },
      }),
    ).toThrow("Credit-Gain-Betrag ist ungueltig.");
    expect(() =>
      applyCreditGain(state, {
        side: "runner",
        baseAmount: 1,
        source: {
          kind: "card_effect",
          sourceDefinitionId: FINDERS_KEEPERS,
          gainOrdinal: 0,
          reason: "invalid",
        },
      }),
    ).toThrow("Credit-Gain-Ordinal ist ungueltig.");
  });
});

function game(seed: string) {
  return createGame({ seed, setupMode: "completed" });
}

function installElena(state: ReturnType<typeof game>): void {
  const instanceId = "test_elena_laskova" as CardInstanceId;
  state.cardInstances[instanceId] = {
    instanceId,
    definitionId: ELENA_LASKOVA,
    owner: "runner",
    controller: "runner",
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: false,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  state.runner.rig.resources.push(instanceId);
}
