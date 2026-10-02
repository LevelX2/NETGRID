import { describe, expect, it } from "vitest";
import { DEMO_DECKS } from "@netgrid/shared";
import {
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashGameState,
  validateGameState,
} from "../../index";
import {
  apply,
  findCard,
  removeEverywhere,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import { quoteCorpHostedCreditBankCycle } from "./hosted-credit-bank-cycle-quote";

const bankDefinition = "onr_v1_318_department-of-truth-enhancement";
function fixture(credits = 3, clicks = 3, rezzed = false) {
  let state = createGameAfterSetup({
    seed: "hosted-bank-cycle-boundary",
    corpDeck: {
      ...DEMO_DECKS.demo_corp_001,
      cards: [
        ...DEMO_DECKS.demo_corp_001.cards,
        { id: bankDefinition, quantity: 1 },
      ],
    },
  });
  state = apply(state, "corp", (a) => a.type === "mandatory_draw");
  const source = findCard(state, bankDefinition);
  removeEverywhere(state, source);
  state.corp.servers.push({
    id: "remote_1",
    kind: "remote",
    label: "Remote 1",
    root: [source],
    ice: [],
  });
  state.cardInstances[source]!.zone = {
    side: "corp",
    zone: "serverRoot",
    serverId: "remote_1",
  };
  state.cardInstances[source]!.rezzed = rezzed;
  state.cardInstances[source]!.faceup = rezzed;
  state.corp.credits = credits;
  state.corp.clicks = clicks;
  return { state, source };
}
describe("current normal-turn hosted bank cycle quote", () => {
  it("matches the complete legal cycle and beats three basic credits by exactly one", () => {
    const { state, source } = fixture();
    const beforeHash = hashGameState(state);
    const rez = getLegalActions(state, "corp").find(
      (a) => a.type === "rez_card" && a.source === source,
    )!;
    const quote = quoteCorpHostedCreditBankCycle(state, rez)!;
    expect(hashGameState(state)).toBe(beforeHash);
    expect(quote).toMatchObject({
      headKind: "rez",
      setupCreditCost: 2,
      loadExecutions: 2,
      cashoutCredits: 6,
      netLiquidCreditGain: 4,
      baselineLiquidCreditGain: 3,
      extraLiquidCredits: 1,
    });
    expect(
      JSON.parse(String(rez.payload?.hostedCreditBankCycleQuoteJson)),
    ).toEqual(quote);
    let bank = apply(state, "corp", (a) => a.actionId === rez.actionId);
    for (let n = 0; n < 2; n++)
      bank = apply(
        bank,
        "corp",
        (a) =>
          a.source === source &&
          a.abilityRef?.sourceAbilityId === quote.loadAbilityId,
      );
    bank = apply(
      bank,
      "corp",
      (a) =>
        a.source === source &&
        a.abilityRef?.sourceAbilityId === quote.cashoutAbilityId,
    );
    let basic = state;
    for (let n = 0; n < 3; n++)
      basic = apply(basic, "corp", (a) => a.type === "gain_credit");
    expect([bank.corp.credits, bank.corp.clicks]).toEqual([7, 0]);
    expect([basic.corp.credits, basic.corp.clicks]).toEqual([6, 0]);
    expect(bank.cardInstances[source]!.counters?.bit).toBeUndefined();
    expect(validateGameState(bank)).toEqual({ ok: true, errors: [] });
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "hostedCreditBankCycleQuoteJson",
    );
    expect(
      bank.eventLog.some((e) =>
        JSON.stringify(e.publicPayload).includes(
          "hostedCreditBankCycleQuoteJson",
        ),
      ),
    ).toBe(false);
  });
  it("quotes one load and cashout when the installed bank is already rezzed", () => {
    const { state, source } = fixture(3, 2, true);
    const load = getLegalActions(state, "corp").find(
      (a) =>
        a.source === source &&
        a.payload?.cardImplementationAddsHostedCredits === true,
    )!;
    const quote = quoteCorpHostedCreditBankCycle(state, load)!;
    expect(quote).toMatchObject({
      headKind: "load",
      setupCreditCost: 0,
      cashoutCredits: 3,
      extraLiquidCredits: 1,
    });
    const loaded = apply(state, "corp", (a) => a.actionId === load.actionId);
    const paid = apply(
      loaded,
      "corp",
      (a) =>
        a.source === source &&
        a.abilityRef?.sourceAbilityId === quote.cashoutAbilityId,
    );
    expect([paid.corp.credits, paid.corp.clicks]).toEqual([6, 0]);
  });
  for (const [name, credits, clicks, rezzed] of [
    ["unrezzed bank with two clicks", 3, 2, false],
    ["one-click loading cannot cash out this turn", 3, 1, true],
    ["unaffordable rez", 1, 3, false],
  ] as const)
    it("does not certify " + name, () => {
      const { state, source } = fixture(credits, clicks, rezzed);
      expect(
        getLegalActions(state, "corp")
          .filter((a) => a.source === source)
          .every(
            (a) => a.payload?.hostedCreditBankCycleQuoteJson === undefined,
          ),
      ).toBe(true);
    });
  it("rejects a stale current head and ignores hidden opponent ordering", () => {
    const { state, source } = fixture();
    const rez = getLegalActions(state, "corp").find(
      (a) => a.type === "rez_card" && a.source === source,
    )!;
    const quote = quoteCorpHostedCreditBankCycle(state, rez);
    const hidden = structuredClone(state);
    hidden.runner.grip.reverse();
    hidden.runner.stack.reverse();
    expect(quoteCorpHostedCreditBankCycle(hidden, rez)).toEqual(quote);
    expect(
      quoteCorpHostedCreditBankCycle(state, {
        ...rez,
        expiresAtStateVersion: rez.expiresAtStateVersion - 1,
      }),
    ).toBeUndefined();
  });
});
