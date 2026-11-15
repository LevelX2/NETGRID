import { describe, expect, it } from "vitest";
import type { CorpGenericDefenseSignal } from "../../plans/corp-defense-contracts";
import type { CorpSelectedRezCost } from "../../runtime/corp-funded-score-protection";
import {
  isValidDefenseSignal,
  selectedRezCostSetsEqual,
  validExactIceRezRoute,
} from "./defense-validation";

const route = {
  actionId: "corp.rez_ice.ice_1",
  sourceCardInstanceId: "ice_1",
  sourceDefinitionId: "ice_definition",
  targetServerId: "rd",
  routeKind: "access_reduction",
  quote: {
    context: "installed",
    complete: true,
    cardId: "ice_1",
    targetServerId: "rd",
    expiresAtStateVersion: 7,
    finalCredits: 2,
  },
  before: {
    knowledge: "known",
    runnerAccessSuccessProbability: { numerator: 1, denominator: 1 },
  },
  after: {
    knowledge: "known",
    runnerAccessSuccessProbability: { numerator: 0, denominator: 1 },
  },
  effect: "satisfied",
  totalRezCredits: 2,
};

describe("Defense route contracts", () => {
  it("requires evidence for the declared route kind even with a known access assessment", () => {
    expect(validExactIceRezRoute(route)).toBe(true);
    expect(validExactIceRezRoute({ ...route, routeKind: "unknown_kind" })).toBe(
      false,
    );
    expect(
      validExactIceRezRoute({ ...route, routeKind: "exact_resource_exchange" }),
    ).toBe(false);
    expect(
      validExactIceRezRoute({
        ...route,
        routeKind: "exact_resource_exchange",
        resourceExchange: null,
      }),
    ).toBe(false);
    expect(
      validExactIceRezRoute({
        ...route,
        accessBlock: {
          reason: "no_visible_eligible_breaker",
          hardEndTheRunSubroutineCount: 1,
        },
        routeKind: "free_persistent_defense",
        totalRezCredits: 0,
        quote: { ...route.quote, finalCredits: 0 },
      }),
    ).toBe(false);
  });

  it("keeps a zero-cost immediate credit gain valid without an access assessment", () => {
    expect(
      validExactIceRezRoute({
        ...route,
        routeKind: "costless_immediate_credit_gain",
        before: undefined,
        after: undefined,
        immediateCorpCreditGain: 2,
        effect: "progress",
        totalRezCredits: 0,
        quote: { ...route.quote, finalCredits: 0 },
      }),
    ).toBe(true);
  });

  it("requires a program-trash resolution with one Defense action", () => {
    const signal: CorpGenericDefenseSignal = {
      kind: "generic",
      defenseId: "trash_program",
      serverId: "rd",
      phase: "resolve_program_trash",
      sourceDefinitionIds: ["ice_definition"],
      actionIds: ["corp.resolve_choice"],
      urgent: true,
      value: 1000,
      evidenceCode: "program_trash",
    };
    const bound: CorpGenericDefenseSignal = {
      ...signal,
      choiceResolution: {
        kind: "program_trash",
        choiceId: "trash_1",
        choiceSource: "card_implementation.trash_installed_program:ice_1",
        sourceStateVersion: 7,
        origin: { kind: "encounter", runId: "run_1" },
        sourceIceInstanceId: "ice_1",
        selectedOptionId: "card_program_1",
        targetCardInstanceId: "program_1",
      },
    };
    expect(isValidDefenseSignal(signal)).toBe(false);
    expect(isValidDefenseSignal(bound)).toBe(true);
    expect(isValidDefenseSignal({ ...bound, actionIds: [] })).toBe(false);
  });
});

describe("Selected Defense Rez costs", () => {
  it.each([
    [
      { kind: "x_strength", value: 1 },
      { kind: "x_strength", value: 2 },
    ],
    [
      { kind: "paid_end_the_run_subroutines", subroutineCount: 1 },
      { kind: "paid_end_the_run_subroutines", subroutineCount: 2 },
    ],
    [
      { kind: "alternate_subtype", selectedSubtypes: ["barrier"] },
      { kind: "alternate_subtype", selectedSubtypes: ["sentry"] },
    ],
  ] as const)("compares the exact quoted variant for %j", (first, other) => {
    const fixed: CorpSelectedRezCost = {
      iceInstanceId: "ice_1",
      iceDefinitionId: "ice_definition",
      credits: 2,
      source: "engine_rez_cost_quote",
    };
    const selected: CorpSelectedRezCost = {
      ...fixed,
      variableRezChoice: first,
    };
    expect(
      selectedRezCostSetsEqual([selected], [structuredClone(selected)]),
    ).toBe(true);
    expect(
      selectedRezCostSetsEqual(
        [selected],
        [{ ...selected, variableRezChoice: other }],
      ),
    ).toBe(false);
    expect(selectedRezCostSetsEqual([selected], [fixed])).toBe(false);
  });
});
