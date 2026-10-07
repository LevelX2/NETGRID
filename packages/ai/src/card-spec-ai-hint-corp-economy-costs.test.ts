import { cardSpecPlanningCards } from "@netgrid/cards/planning";
import { expect, it } from "vitest";
import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";
import { AI_HINTS_BY_CARD } from "./ai-hints";
import { buildDeckStrategyProfile } from "./deck-doctrine-strategy";

const SYD = "onr_proteus_076_syd-meyer-superstores";
const BOOT = "onr_proteus_058_executive-boot-camp";
const LISA = "onr_proteus_063_lisa-blight";
function entry(id: string) {
  const found = cardSpecPlanningCards().find((c) => c.definition.id === id)!;
  const { planningAnnotations: _annotations, ...planning } = structuredClone(
    found.planning,
  );
  return { ...found, planning };
}
function mechanical(id: string) {
  return deriveCardSpecAiHint(entry(id));
}

it("derives Syd's payout and own-ICE loss from mechanics, including the exact action capability", () => {
  const hint = mechanical(SYD);
  const payout = expect.objectContaining({
    kind: "action_economy",
    scope: "corp",
    timing: "action",
    resource: "credits",
    target: "economy.own_rezzed_ice_liquidation",
    amount: 4,
    economyMode: "liquid_payout",
  });
  const loss = expect.objectContaining({
    kind: "ice_trash",
    scope: "ice",
    target: "chosen_own_rezzed_ice",
  });
  expect(hint.effects).toEqual(expect.arrayContaining([payout, loss]));
  expect(hint.conditions).toContainEqual({ kind: "requires_rezzed_ice" });
  expect(hint.functionSignals).toContain("economy.generic");
  expect(hint.actionCapabilitySemantics).toContainEqual(
    expect.objectContaining({
      capabilityKey: "corp_main_trash_rezzed_ice_for_credits",
      effects: expect.arrayContaining([payout, loss]),
    }),
  );
  expect(AI_HINTS_BY_CARD.get(SYD)!.effects).toEqual(
    expect.arrayContaining([payout, loss]),
  );
});

it("keeps Boot Camp's two run credits restricted and its random HQ card as an own cost", () => {
  const hint = mechanical(BOOT);
  const pool = expect.objectContaining({
    kind: "finite_economy_pool",
    scope: "corp",
    timing: "during_run",
    target: "economy.corp_run_temporary_credit",
    amount: 2,
    economyMode: "restricted_credit",
    finite: true,
  });
  const discard = expect.objectContaining({
    kind: "random_discard",
    scope: "hq",
    timing: "during_run",
    resource: "cards",
    target: "cost.corp_random_discard_hq",
    amount: 1,
  });
  expect(hint.effects).toEqual(expect.arrayContaining([pool, discard]));
  expect(hint.effects).not.toContainEqual(
    expect.objectContaining({ economyMode: "liquid_payout" }),
  );
  expect(hint.conditions).toContainEqual({ kind: "requires_during_run" });
  expect(hint.functionSignals).toContain("risk.random_outcome");
  expect(hint.functionSignals).not.toContain("corp.random_discard_pressure");
  expect(hint.actionCapabilitySemantics).toContainEqual(
    expect.objectContaining({
      capabilityKey: "during_run_discard_for_two_run_credits",
      effects: expect.arrayContaining([pool, discard]),
    }),
  );
  expect(AI_HINTS_BY_CARD.get(BOOT)!.effects).toEqual(
    expect.arrayContaining([pool, discard]),
  );
});

it("projects the same typed HQ cost for Lisa without pretending it is opponent discard pressure", () => {
  const hint = mechanical(LISA);
  expect(hint.effects).toContainEqual(
    expect.objectContaining({
      kind: "random_discard",
      scope: "hq",
      target: "cost.corp_random_discard_hq",
      amount: 1,
    }),
  );
  expect(hint.functionSignals).toContain("risk.random_outcome");
  expect(hint.functionSignals).not.toContain("corp.random_discard_pressure");
});

it("does not preserve economy or random-cost signals by card identity after the typed nodes are removed", () => {
  const syd = entry(SYD);
  Object.assign(syd.planning.engine.abilities![0]!, { effects: [] });
  expect(deriveCardSpecAiHint(syd).effects).toBeUndefined();
  const boot = entry(BOOT);
  Object.assign(boot.planning.engine.abilities![0]!, {
    effects: [],
    costs: [],
  });
  expect(deriveCardSpecAiHint(boot).effects).toBeUndefined();
});

it("reaches the real deck profile while keeping temporary run credit distinct from liquid economy", () => {
  const profile = buildDeckStrategyProfile({
    deckSnapshotId: "typed-liquidation-economy",
    side: "corp",
    cards: [
      { cardId: SYD, quantity: 3 },
      { cardId: BOOT, quantity: 2 },
    ],
  });
  expect(profile.functionSignalCounts["economy.generic"]).toBe(3);
  expect(
    profile.functionSignalCounts["economy.corp_run_temporary_credit"],
  ).toBe(2);
});

it.each([
  { amount: 0 },
  { amount: 1.5 },
  { recipient: "runner" },
  { usableFor: "install_or_rez" },
  { cleanup: "end_of_turn" },
  { visibility: "corp_private" },
])("rejects malformed run-credit mechanics %j", (mutation) => {
  const current = entry(BOOT);
  Object.assign(current.planning.engine.abilities![0]!.effects![0]!, mutation);
  expect(() => deriveCardSpecAiHint(current)).toThrow(
    "card_spec_unknown_temporary_corp_run_credit_shape",
  );
});
it.each([
  { gainCredits: 0 },
  { gainCredits: 2.5 },
  { target: "chosen_installed_ice" },
  { visibility: "corp_private" },
])("rejects malformed own-ICE liquidation mechanics %j", (mutation) => {
  const current = entry(SYD);
  Object.assign(current.planning.engine.abilities![0]!.effects![0]!, mutation);
  expect(() => deriveCardSpecAiHint(current)).toThrow(
    "card_spec_unknown_own_ice_liquidation_shape",
  );
});
it.each([0, -1, 1.5])(
  "rejects malformed random HQ discard cost %s",
  (amount) => {
    const current = entry(BOOT);
    const costs = current.planning.engine.abilities![0]!.costs;
    if (!Array.isArray(costs)) throw Error("fixture_requires_typed_costs");
    const cost = costs.find((c) => c.kind === "corp_random_discard_hq")!;
    Object.assign(cost, { amount });
    expect(() => deriveCardSpecAiHint(current)).toThrow(
      "card_spec_unknown_corp_random_discard_cost_shape",
    );
  },
);
