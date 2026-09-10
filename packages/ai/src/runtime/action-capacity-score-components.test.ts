import { describe, expect, it } from "vitest";
import type {
  ActionCapacityProjection,
  ActionSemanticCandidate,
} from "../action-semantic-candidate-types";
import {
  createCorpActionDemand,
  createRunnerActionDemand,
  type ActionDemand,
  type ActionDemandRestriction,
} from "../plans/action-demand";
import { economyCreditBaseValue } from "../economy/economy-action-score";
import type { PlanActionContributionScore } from "../plans/plan-portfolio-types";
import {
  actionCapacityRuntimeScoreComponents,
  compareActionCapacityDominance,
  type ActionCapacityScoringContext,
} from "./action-capacity-score-components";

describe("action-capacity runtime scoring", () => {
  it("counts one plan-conversion component instead of raw plus plan value", () => {
    const source = candidate("overtime", 2, { listedActionCost: 1 });
    const context = scoringContext(
      [scoreDemand(3, 4)],
      [contribution("overtime", 950)],
    );

    const components = actionCapacityRuntimeScoreComponents(source, context);

    expect(components).toHaveLength(1);
    expect(components[0]).toMatchObject({
      key: "action_capacity_plan_conversion",
      value: 870,
    });
    expect(components[0]?.reason).toContain(
      "action_capacity_plan_contribution_counted_once:true",
    );
  });

  it("values Overtime for a score follow-up above speculative basic-credit use", () => {
    const source = candidate("overtime", 2, { listedActionCost: 1 });
    const planned = value(source, scoringContext([scoreDemand(3, 4)]));
    const speculative = value(source);
    const basicCredit = economyCreditBaseValue(1);

    expect(planned).toBeGreaterThan(basicCredit);
    expect(planned).toBeGreaterThan(speculative);
    expect(speculative).toBeLessThanOrEqual(0);
  });

  it("does not value restricted burst actions without a compatible route", () => {
    const installOnly = candidate("valu-pak", 5, {
      actionType: "play_event",
      listedActionCost: 1,
      restriction: "program_install_only",
      allowedActionTypes: ["install_card"],
    });
    const unrestricted = candidate("unrestricted-burst", 5, {
      listedActionCost: 1,
    });

    expect(value(installOnly)).toBe(-440);
    expect(value(unrestricted)).toBeGreaterThan(0);
    expect(
      actionCapacityRuntimeScoreComponents(installOnly, undefined)[0]?.reason,
    ).toContain("action_capacity_demand:none");
  });

  it("does not discount a route-adjusted plan contribution twice", () => {
    const conditionalSource = candidate("conditional-overtime", 2, {
      listedActionCost: 1,
      reliability: "conditional",
    });

    expect(
      value(
        conditionalSource,
        scoringContext(
          [scoreDemand(3, 4)],
          [contribution("conditional-overtime", 550)],
        ),
      ),
    ).toBe(470);
  });

  it("keeps +2 above +1 and excludes only the comparable smaller source", () => {
    const plusOne = candidate("plus-one", 1, { listedActionCost: 1 });
    const plusTwo = candidate("plus-two", 2, { listedActionCost: 1 });
    const context = scoringContext([scoreDemand(2, 3)]);

    expect(value(plusTwo, context)).toBeGreaterThan(value(plusOne, context));
    expect(compareActionCapacityDominance(plusTwo, plusOne)).toMatchObject({
      dominantActionId: "plus-two",
      dominatedActionId: "plus-one",
    });
  });

  it("spends a finite Corporate Boon counter for a live sequence but preserves it without demand", () => {
    const boon = candidate("corporate-boon", 1, {
      listedActionCost: 0,
      actionType: "activated_card_ability",
      sourceCounterType: "boon",
      sourceCounterCost: 1,
    });

    expect(value(boon, scoringContext([scoreDemand(3, 4)]))).toBeGreaterThan(
      500,
    );
    expect(value(boon)).toBeLessThan(0);
  });

  it("amortizes a recurring engine only across its usable horizon", () => {
    const short = candidate("short-engine", 0, {
      kind: "future_recurring_gain",
      timing: "future_turn_start",
      gainAmountPerTurn: 1,
      durationTurns: 1,
      listedActionCost: 1,
    });
    const long = candidate("long-engine", 0, {
      kind: "future_recurring_gain",
      timing: "future_turn_start",
      gainAmountPerTurn: 1,
      durationTurns: 4,
      listedActionCost: 1,
    });

    expect(value(long)).toBeGreaterThan(value(short));
    expect(value(short)).toBeLessThan(0);
    expect(value(long)).toBeGreaterThan(0);
  });

  it("does not use future recurring actions to solve a current-turn demand", () => {
    const futureEngine = candidate("future-engine", 0, {
      kind: "future_recurring_gain",
      timing: "future_turn_start",
      gainAmountPerTurn: 1,
      durationTurns: 3,
      listedActionCost: 1,
    });
    const nextTurnDemand = createCorpActionDemand({
      demandId: "corp:next-turn-development",
      purpose: "next_turn_setup",
      priority: "next_own_turn",
      hardness: "soft",
      deadline: "start_of_next_own_turn",
      currentActions: 0,
      targetActions: 1,
      acceptedRestrictions: ["unrestricted"],
      requiredActionTypes: ["install_card"],
    });

    expect(
      value(futureEngine, scoringContext([scoreDemand(3, 4)])),
    ).toBeLessThan(0);
    expect(
      value(futureEngine, scoringContext([nextTurnDemand])),
    ).toBeGreaterThan(0);
  });

  it("discounts conditional and self-damaging action sources", () => {
    const safe = candidate("safe", 2, { listedActionCost: 1 });
    const conditional = candidate("conditional", 2, {
      listedActionCost: 1,
      reliability: "conditional",
    });
    const selfDamage = candidate("self-damage", 2, {
      listedActionCost: 1,
      selfDamage: 1,
    });
    const context = scoringContext([scoreDemand(2, 3)]);

    expect(value(safe, context)).toBeGreaterThan(value(conditional, context));
    expect(value(safe, context)).toBeGreaterThan(value(selfDamage, context));
  });

  it("prices explicit action debt as a penalty", () => {
    const debt = candidate("action-debt", 0, {
      kind: "action_debt",
      actionDebt: 2,
    });

    expect(value(debt)).toBe(-360);
  });

  it("rejects non-finite capacity values before emitting score or dominance", () => {
    const invalid = candidate("invalid-capacity", Number.NaN);
    const valid = candidate("valid-capacity", 1);

    expect(() =>
      actionCapacityRuntimeScoreComponents(invalid, undefined),
    ).toThrow("action_capacity_score_non_finite:invalid-capacity");
    expect(() => compareActionCapacityDominance(invalid, valid)).toThrow(
      "action_capacity_score_non_finite:invalid-capacity",
    );
  });

  it("only grants demand value to compatible restricted actions", () => {
    const runDemand = createRunnerActionDemand({
      demandId: "runner:run-actions",
      purpose: "current_run",
      priority: "acute_hard_plan_blocker",
      hardness: "hard",
      deadline: "before_current_plan_action",
      currentActions: 0,
      targetActions: 1,
      acceptedRestrictions: ["unrestricted", "run_only"],
      requiredActionTypes: ["start_run"],
    });
    const runOnly = candidate("run-only", 1, {
      restriction: "run_only",
      allowedActionTypes: ["start_run"],
      actionType: "start_run",
    });
    const installOnly = candidate("install-only", 1, {
      restriction: "install_only",
      allowedActionTypes: ["install_card"],
    });
    const context = scoringContext([runDemand]);

    expect(value(runOnly, context)).toBeGreaterThan(500);
    expect(value(installOnly, context)).toBeLessThan(value(runOnly, context));
  });
});

function value(
  source: ActionSemanticCandidate,
  context?: ActionCapacityScoringContext,
): number {
  return actionCapacityRuntimeScoreComponents(source, context)[0]?.value ?? 0;
}

function scoringContext(
  actionDemands: readonly ActionDemand[],
  planActionContributions: readonly PlanActionContributionScore[] = [],
): ActionCapacityScoringContext {
  return { actionDemands, planActionContributions };
}

function scoreDemand(currentActions: number, targetActions: number) {
  return createCorpActionDemand({
    demandId: `corp:score:${currentActions}:${targetActions}`,
    purpose: "current_score_closeout",
    priority: "acute_hard_plan_blocker",
    hardness: "hard",
    deadline: "before_current_plan_action",
    currentActions,
    targetActions,
    acceptedRestrictions: ["unrestricted"],
    requiredActionTypes: ["install_card", "advance_card", "score_agenda"],
  });
}

function contribution(
  actionId: string,
  totalValue: number,
): PlanActionContributionScore {
  return {
    actionId,
    totalValue,
    interruptValue: 0,
    foregroundValue: totalValue,
    backgroundValue: 0,
    multiPlanBonus: 0,
    contributionCount: 1,
    portfolioEntryIds: ["corp.create_score_window:card:agenda"],
    evidence: ["test-plan-contribution"],
  };
}

function candidate(
  actionId: string,
  gain: number,
  overrides: {
    actionType?: string;
    listedActionCost?: number;
    restriction?: ActionDemandRestriction;
    allowedActionTypes?: string[];
    kind?: ActionCapacityProjection["kind"];
    timing?: ActionCapacityProjection["timing"];
    reliability?: ActionCapacityProjection["reliability"];
    gainAmountPerTurn?: number;
    durationTurns?: number;
    sourceCounterType?: string;
    sourceCounterCost?: number;
    selfDamage?: number;
    actionDebt?: number;
  } = {},
): ActionSemanticCandidate {
  const listedActionCost = overrides.listedActionCost ?? 0;
  const restriction = overrides.restriction ?? "unrestricted";
  const kind =
    overrides.kind ??
    (restriction === "unrestricted"
      ? "immediate_unrestricted_gain"
      : "immediate_restricted_gain");
  const followupActionCapacity = kind === "future_recurring_gain" ? 0 : gain;
  return {
    actionId,
    actionType: overrides.actionType ?? "play_operation",
    actorSide: "corp",
    sourceDefinitionId: actionId,
    costProfile: {
      clickCost: listedActionCost,
      creditCost: 0,
      ...(overrides.selfDamage
        ? {
            selfDamage: [
              { type: "core" as const, amount: overrides.selfDamage },
            ],
          }
        : {}),
      costKnownStatus: "known",
      additionalCosts: [],
    },
    actionCapacityProjection: {
      schemaVersion: "action-capacity-projection-v1",
      kind,
      timing: overrides.timing ?? "immediate",
      restriction,
      allowedActionTypes: overrides.allowedActionTypes ?? [],
      listedActionCost,
      preExistingActionCost: listedActionCost,
      grossActionsGained: gain,
      generatedActionsConsumedByCurrentAction: 0,
      followupActionCapacity,
      netCurrentTurnActionDelta:
        kind === "future_recurring_gain" ? 0 : gain - listedActionCost,
      actionDebt: overrides.actionDebt ?? 0,
      ...(overrides.gainAmountPerTurn !== undefined
        ? { gainAmountPerTurn: overrides.gainAmountPerTurn }
        : {}),
      ...(overrides.durationTurns !== undefined
        ? { durationTurns: overrides.durationTurns }
        : {}),
      selfFinancing: false,
      repeatable: "unknown",
      reliability: overrides.reliability ?? "guaranteed",
      ...(overrides.sourceCounterType
        ? { sourceCounterType: overrides.sourceCounterType }
        : {}),
      ...(overrides.sourceCounterCost !== undefined
        ? { sourceCounterCost: overrides.sourceCounterCost }
        : {}),
      source: "legal_action_payload",
      confidence: "high",
      evidence: [`test:${actionId}`],
    },
  } as unknown as ActionSemanticCandidate;
}
