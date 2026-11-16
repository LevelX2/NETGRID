import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../input-dto";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../plans/turn-planning-contracts";
import type { AiDecisionInputWithDeckCapabilities } from "../runtime/ai-decision-input";
import { quoteRunnerRunTarget } from "../runner-run-target-evaluation";
import { createDeckCapabilitiesContext } from "../runtime/deck-capabilities-context";
import { assessKnownRezzedIcePath } from "../visible-run-analysis";
import { visibleIceRunHazardsForQuote } from "./visible-run-hazards";
import { quoteInstalledFixedTagAvoidance } from "./installed-tag-avoidance-quote";

function fixture(game: 14 | 26) {
  const index = game === 14 ? 247 : 334;
  const cp = JSON.parse(
    readFileSync(
      new URL(
        `../../../../data/scenarios/ai-decision-checkpoints/cp-p719-r07-g${game}-d${index}-installed-tag-prevention.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  } as AiDecisionInputWithDeckCapabilities;
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  return { cp, input };
}
afterEach(resetResidentPlanPortfolioMemory);

it.each([14, 26] as const)(
  "prices installed tag avoidance in the native game %i funded route",
  (game) => {
    const { input } = fixture(game);
    // Resource totals from the funded controls for these checkpoints.
    input.playerView.own.credits = game === 14 ? 12 : 21;
    input.playerView.own.clicks = game === 14 ? 1 : 2;
    const before = structuredClone(input);
    const target = quoteRunnerRunTarget({
      input,
      deckCapabilities:
        createDeckCapabilitiesContext().deckCapabilitiesForInput(input),
      runActionId: "runner.start_run.remote_1",
      targetServerId: "remote_1",
    })!.target;
    expect(target.visibleTraceTagHazardUnavoidable).not.toBe(true);
    expect(target.unavoidableVisibleIceHazardCount ?? 0).toBe(0);
    expect(target.routeQuote!.knownCost).toBe(game === 14 ? 9 : 12);
    expect(target.routeQuote!.unknownIceCount).toBe(game === 14 ? 0 : 1);
    // Potential effects remain diagnostic; only residual hazards count as risk.
    expect(target.expectedTagsFromVisibleIce ?? 0).toBe(0);
    expect(target.visibleIceRunHazards?.[0]).toMatchObject({
      kind: "trace_tag",
      unavoidable: false,
      minimumAvoidanceCost: game === 14 ? 3 : 0,
    });
    expect(input).toEqual(before);
  },
);

it.each([14, 26] as const)(
  "keeps the existing funding owner for native game %i",
  (game) => {
    const { cp, input } = fixture(game);
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      cp.runtime,
    );
    const before = structuredClone(input),
      decision = chooseAiAction(input);
    const action = input.legalActions.find(
      (a) => a.actionId === decision.actionId,
    )!;
    expect(action.type).toBe("activated_card_ability");
    if (game === 14)
      expect(action.payload!.cardImplementationEffectKind).toBe(
        "move_top_trash_to_grip",
      );
    else {
      expect(action.payload!.effectKind).toBe("gain_credits");
      expect(action.payload!.cardImplementationAbilityKey).toBe(
        "withdraw_credits",
      );
    }
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe(game === 14 ? "runner.economy" : "runner.credit_bank");
    expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
    expect(input).toEqual(before);
  },
);

function tagFacts() {
  const { input } = fixture(14);
  const nasuko = input.playerView.own.rig!.find(
    (c) => c.definitionId === "onr_v1_135_nasuko-cycle",
  )!;
  const { input: other } = fixture(26);
  const fallGuy = other.playerView.own.rig!.find(
    (c) => c.definitionId === "onr_v1_161_fall-guy",
  )!;
  const hunter = input.playerView.servers
    .flatMap((s) => s.ice)
    .find((c) => c.definitionId === "onr_v1_249_hunter" && c.rezzed)!;
  return { nasuko, fallGuy, hunter };
}

it("pays repeatable avoidance once per tag and consumes a trash source only once", () => {
  const { nasuko, fallGuy } = tagFacts();
  const quote = (
    rigCards: (typeof nasuko)[],
    tags: number,
    generalCredits: number,
    used = new Set<string>(),
  ) => quoteInstalledFixedTagAvoidance(rigCards, tags, generalCredits, used);
  expect(quote([nasuko], 2, 6)).toMatchObject({
    cost: 6,
    trashedSourceIds: [],
  });
  expect(quote([nasuko], 2, 5)).toBeUndefined();
  expect(quote([fallGuy], 2, 0)).toBeUndefined();
  expect(quote([fallGuy, nasuko], 2, 3)).toMatchObject({
    cost: 3,
    trashedSourceIds: [fallGuy.instanceId],
  });
  expect(quote([fallGuy], 1, 0, new Set([fallGuy.instanceId]))).toBeUndefined();
});

it("carries consumed prevention across two ICE and keeps the input unchanged", () => {
  const { hunter, fallGuy } = tagFacts();
  const ice = [0, 1].map((i) => ({
    ...structuredClone(hunter),
    instanceId: `hunter-${i}`,
    effectiveRunQuote: {
      ...structuredClone(hunter.effectiveRunQuote!),
      iceInstanceId: `hunter-${i}`,
    },
  }));
  const before = structuredClone(ice);
  const path = assessKnownRezzedIcePath(ice, [fallGuy], 0, [], 100, {
    traceRulesProfile: "modern_open",
  });
  expect(path.visibleIceRunHazards!.map((h) => h.unavoidable)).toEqual([
    false,
    true,
  ]);
  expect(path.expectedTagsFromVisibleIce).toBe(1);
  expect(ice).toEqual(before);
});

it.each([
  "repeatable",
  "no_general_cash",
  "unknown_source",
  "counter",
  "variable",
  "coupled_source",
  "future_action",
] as const)("retains the exact mitigation boundary: %s", (variant) => {
  const { hunter, nasuko, fallGuy } = tagFacts();
  const source = structuredClone(
    variant === "counter" || variant === "coupled_source" ? fallGuy : nasuko,
  );
  if (variant === "unknown_source") source.known = false;
  if (variant === "coupled_source")
    source.definitionId = "onr_v1_167_leland-corporate-bodyguard";
  if (variant === "future_action")
    source.definitionId = "onr_classic_051_vintage-camaro";
  const ice = structuredClone(hunter);
  if (variant === "counter")
    ice.effectiveRunQuote!.subroutines[0]!.traceSuccessEffect = {
      type: "add_tag_and_counter",
      tagAmount: 1,
      counterType: "power",
      amount: 1,
    };
  if (variant === "variable")
    ice.effectiveRunQuote!.subroutines[0]!.traceSuccessEffect = {
      type: "add_tags_by_trace_margin_over_runner_link",
    };
  const h = visibleIceRunHazardsForQuote({
    quote: ice.effectiveRunQuote,
    ice,
    iceIndex: 0,
    rigCards: [],
    tagPrevention: { rigCards: [source], consumedSourceIds: new Set() },
    creditBudget: {
      credits: 30,
      traceEligibleCredits: variant === "no_general_cash" ? 2 : 3,
    },
    visibleCorpBidCapacity: 100,
    breakerStrengths: new Map(),
    additionalBreakCostPerSubroutine: 0,
    traceRulesProfile: "modern_open",
  })[0]!;
  expect(h.hazard.unavoidable).toBe(variant !== "repeatable");
  if (variant === "repeatable")
    expect(h.avoidancePayment).toEqual({
      kind: "tag_prevention",
      cost: 3,
      trashedSourceIds: [],
    });
});

it("uses a trash source at most once within the same encounter", () => {
  const { hunter, fallGuy } = tagFacts();
  const trace = hunter.effectiveRunQuote!.subroutines[0]!;
  const ice = {
    ...hunter,
    effectiveRunQuote: {
      ...hunter.effectiveRunQuote!,
      subroutines: [trace, { ...trace, id: "second-trace" }],
    },
  };
  const path = assessKnownRezzedIcePath([ice], [fallGuy], 0, [], 100, {
    traceRulesProfile: "modern_open",
  });
  expect(
    path.visibleIceRunHazards?.map((hazard) => hazard.unavoidable),
  ).toEqual([false, true]);
  expect(path.expectedTagsFromVisibleIce).toBe(1);
});

it("keeps the source installed when winning the trace is just as cheap", () => {
  const { hunter, fallGuy } = tagFacts();
  const trace = hunter.effectiveRunQuote!.subroutines[0]!;
  const hazards = visibleIceRunHazardsForQuote({
    quote: {
      ...hunter.effectiveRunQuote!,
      subroutines: [{ ...trace, traceLimit: 0 }],
    },
    ice: hunter,
    iceIndex: 0,
    rigCards: [],
    tagPrevention: { rigCards: [fallGuy], consumedSourceIds: new Set() },
    creditBudget: 0,
    visibleCorpBidCapacity: 0,
    breakerStrengths: new Map(),
    additionalBreakCostPerSubroutine: 0,
    traceRulesProfile: "modern_open",
  });
  expect(hazards[0]?.avoidancePayment).toEqual({ kind: "general", cost: 0 });
});

it("keeps installed prevention available under a prohibition on breaking", () => {
  const { hunter, nasuko } = tagFacts();
  const path = assessKnownRezzedIcePath([hunter], [nasuko], 3, [], 100, {
    traceRulesProfile: "modern_open",
    prohibitBreakingIceInstanceIds: [hunter.instanceId],
  });
  expect(path.visibleIceRunHazards![0]!.unavoidable).toBe(false);
  expect(path.visibleBreakCost).toBe(3);
  expect(path.creditsAfterPath).toBe(0);
});
