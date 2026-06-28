import { describe, expect, it } from "vitest";
import type { LegalAction } from "@netgrid/shared";
import {
  buildActionSemanticCandidates,
  type ActionSemanticCandidate,
} from "../action-semantic-candidate";
import { scoreActionGoalFit } from "./action-goal-fit";
import type { TacticalGoalUtility } from "./tactical-goal-utility";

describe("ActionGoalFit", () => {
  it("scores gain_credit as a fit for economy goals", () => {
    const candidate = candidateFor("gain-1", "gain_credit");
    const fit = scoreActionGoalFit({
      candidate,
      utility: utility("runner.build_economy_base", "economy"),
      legalActionIds: ["gain-1"],
    });

    expect(fit.fitStatus).toBe("fit");
    expect(fit.score).toBeGreaterThan(80);
    expect(fit.components.map((component) => component.component)).toContain(
      "goal_fit",
    );
  });

  it("raises gain_credit utility under high credit pressure", () => {
    const candidate = candidateFor("gain-1", "gain_credit");
    const lowPressureFit = scoreActionGoalFit({
      candidate,
      utility: utility("runner.build_economy_base", "economy"),
      legalActionIds: ["gain-1"],
      creditPressure: "low",
    });
    const highPressureFit = scoreActionGoalFit({
      candidate,
      utility: utility("runner.build_economy_base", "economy"),
      legalActionIds: ["gain-1"],
      creditPressure: "high",
    });

    expect(highPressureFit.score).toBeGreaterThan(lowPressureFit.score);
    expect(
      highPressureFit.components
        .find((component) => component.component === "cost_fit")
        ?.evidence,
    ).toEqual(expect.arrayContaining(["credit_pressure:high"]));
  });

  it("keeps start_run irrelevant for economy but useful for run access", () => {
    const candidate = candidateFor("run-1", "start_run");

    expect(
      scoreActionGoalFit({
        candidate,
        utility: utility("runner.build_economy_base", "economy"),
        legalActionIds: ["run-1"],
      }).fitStatus,
    ).toBe("irrelevant");
    expect(
      scoreActionGoalFit({
        candidate,
        utility: utility("runner.pressure_good_central_target", "run_access"),
        legalActionIds: ["run-1"],
      }).fitStatus,
    ).toBe("partial");
  });

  it("scores jack_out for survival but not access pressure", () => {
    const candidate = candidateFor("jack-1", "jack_out");

    const survivalFit = scoreActionGoalFit({
      candidate,
      utility: utility("runner.survive", "survival", 100, "critical"),
      legalActionIds: ["jack-1"],
    });
    const accessFit = scoreActionGoalFit({
      candidate,
      utility: utility("runner.pressure_good_central_target", "run_access"),
      legalActionIds: ["jack-1"],
    });

    expect(survivalFit.fitStatus).toBe("fit");
    expect(accessFit.fitStatus).toBe("irrelevant");
  });

  it("scores install_card for setup and coverage goals", () => {
    const candidate = {
      ...candidateFor("install-1", "install_card"),
      actionTacticSignals: ["setup.coverage"],
    };

    const fit = scoreActionGoalFit({
      candidate,
      utility: utility("runner.find_or_install_primary_breaker", "coverage"),
      legalActionIds: ["install-1"],
    });

    expect(fit.fitStatus).not.toBe("blocked");
    expect(fit.score).toBeGreaterThan(60);
  });

  it("matches tag and damage fallback families by structured semantic terms", () => {
    const tagFit = scoreActionGoalFit({
      candidate: {
        ...candidateFor("tag-1", "trigger_ability"),
        semanticActionType: "tag.apply",
      },
      utility: utility("corp.visible_tag_punish", "tag_punish"),
      legalActionIds: ["tag-1"],
    });
    const damageFit = scoreActionGoalFit({
      candidate: {
        ...candidateFor("damage-1", "trigger_ability"),
        semanticActionType: "damage.net",
      },
      utility: utility("corp.damage_window", "damage_pressure"),
      legalActionIds: ["damage-1"],
    });

    expect(tagFit.fitStatus).not.toBe("irrelevant");
    expect(damageFit.fitStatus).not.toBe("irrelevant");
  });

  it("ignores substring-only tag and damage semantic noise", () => {
    const tagNoise = scoreActionGoalFit({
      candidate: {
        ...candidateFor("tag-noise", "trigger_ability"),
        semanticActionType: "tagalong.apply",
      },
      utility: utility("corp.visible_tag_punish", "tag_punish"),
      legalActionIds: ["tag-noise"],
    });
    const damageNoise = scoreActionGoalFit({
      candidate: {
        ...candidateFor("damage-noise", "trigger_ability"),
        semanticActionType: "damaged_goods",
      },
      utility: utility("corp.damage_window", "damage_pressure"),
      legalActionIds: ["damage-noise"],
    });

    expect(tagNoise.fitStatus).toBe("irrelevant");
    expect(damageNoise.fitStatus).toBe("irrelevant");
  });

  it("blocks risky self-damage actions under critical survival goals", () => {
    const risky = {
      ...candidateFor("damage-1", "activated_card_ability"),
      costProfile: {
        ...candidateFor("damage-1", "activated_card_ability").costProfile,
        selfDamage: [{ type: "net", amount: 2 }],
      },
    } satisfies ActionSemanticCandidate;

    const fit = scoreActionGoalFit({
      candidate: risky,
      utility: utility("runner.survive", "survival", 100, "critical"),
      legalActionIds: ["damage-1"],
    });

    expectHardGateOnly(fit, "risk_unacceptable", [
      "hard_gate:risk_unacceptable",
      "high_risk:true",
      "goal_family:survival",
      "urgency:critical",
    ]);
  });

  it("matches plan alignment evidence exactly", () => {
    const aligned = scoreActionGoalFit({
      candidate: {
        ...candidateFor("gain-1", "gain_credit"),
        evidence: ["plan_alignment:runner.build_economy_base"],
      },
      utility: {
        ...utility("runner.build_economy_base", "economy"),
        evidence: ["plan_alignment:runner.build_economy_base"],
      },
      legalActionIds: ["gain-1"],
    });
    const noise = scoreActionGoalFit({
      candidate: {
        ...candidateFor("gain-noise", "gain_credit"),
        evidence: ["not_plan_alignment:runner.build_economy_base_noise"],
      },
      utility: {
        ...utility("runner.build_economy_base", "economy"),
        evidence: ["plan_alignment:runner.build_economy_base"],
      },
      legalActionIds: ["gain-noise"],
    });

    expect(
      aligned.components.find(
        (component) => component.component === "plan_alignment",
      )?.delta,
    ).toBe(8);
    expect(
      noise.components.find(
        (component) => component.component === "plan_alignment",
      )?.delta,
    ).toBe(0);
  });

  it("blocks target-profile goals when target context is missing", () => {
    const candidate = candidateFor("choice-1", "resolve_choice");
    const fit = scoreActionGoalFit({
      candidate,
      utility: utility("runner.resolve_target", "target_resolution"),
      legalActionIds: ["choice-1"],
    });

    expectHardGateOnly(fit, "target_context_missing_for_target_profile", [
      "hard_gate:target_context_missing_for_target_profile",
      "requires_target_context:true",
      "has_target_context:false",
    ]);
  });

  it("raises target fit from productive TargetChoice recommendations without selected choices", () => {
    const base = candidateFor("run-remote", "start_run");
    const candidate = {
      ...base,
      semanticActionType: "run.start",
      targetContext: {
        selectedTargets: [],
        availableTargets: [
          {
            targetId: "remote_1",
            targetKind: "server",
            targetSide: "corp",
            evidence: ["test_available_target"],
          },
        ],
        targetKind: "server",
        targetZones: [],
        targetSide: "corp",
        hiddenInfoPolicy: "side_safe_engine_input_only",
        availableTargetsStatus: "engine_provided",
        targetProfileMatches: [],
        targetConstraintResults: [],
      },
    } satisfies ActionSemanticCandidate;

    const withoutRecommendation = scoreActionGoalFit({
      candidate,
      utility: utility("runner.remote_contest", "remote_contest"),
      legalActionIds: ["run-remote"],
    });
    const withRecommendation = scoreActionGoalFit({
      candidate,
      utility: utility("runner.remote_contest", "remote_contest"),
      legalActionIds: ["run-remote"],
      targetChoiceRecommendation: {
        scope: "target_choice_target_fit_recommendation",
        actionId: "run-remote",
        actionType: "start_run",
        requirementId: "server",
        optionId: "remote_1",
        optionKind: "target_option",
        confidence: "high",
        score: 152,
        productiveUseAllowed: true,
        runtimeConsumerStatus: "target_fit_only",
        noRuntimeEffect: true,
        selectedChoicesCreated: false,
        selectedTargetsCreated: false,
        evidence: ["target_choice_target_fit:productive_recommendation"],
      },
    });

    expect(withRecommendation.score).toBeGreaterThan(
      withoutRecommendation.score,
    );
    expect(
      withRecommendation.components.find(
        (component) => component.component === "target_fit",
      )?.evidence,
    ).toEqual(
      expect.arrayContaining([
        "target_choice_recommendation:true",
        "target_choice_option:remote_1",
        "target_choice_confidence:high",
      ]),
    );
  });

  it("blocks target-profile goals when side-safe target constraints reject the option", () => {
    const base = candidateFor("choice-1", "resolve_choice");
    const blocked = {
      ...base,
      targetContext: {
        selectedTargets: [],
        targetKind: "card",
        targetZones: [],
        targetSide: "unknown",
        hiddenInfoPolicy: "engine_provided_targets_only",
        availableTargetsStatus: "engine_provided",
        targetProfileMatches: [
          {
            status: "unknown",
            issues: ["target_context_unavailable"],
            evidence: ["target_profile:unresolved"],
          },
        ],
        targetConstraintResults: [
          {
            status: "block",
            reason: "unresolved_target_context",
            evidence: ["constraint:unresolved_target_context"],
          },
        ],
      },
    } satisfies ActionSemanticCandidate;

    const fit = scoreActionGoalFit({
      candidate: blocked,
      utility: utility("runner.resolve_target", "target_resolution"),
      legalActionIds: ["choice-1"],
    });

    expectHardGateOnly(fit, "target_context_blocked", [
      "hard_gate:target_context_blocked",
      "target_profile_blocked:true",
      "target_constraint_blocked:true",
    ]);
  });

  it("blocks wrong-side corp scoreline actions before positive timing score", () => {
    const fit = scoreActionGoalFit({
      candidate: candidateFor("score-wrong-side", "score_agenda"),
      utility: utility("corp.score_window", "corp_scoreline"),
      legalActionIds: ["score-wrong-side"],
    });

    expectHardGateOnly(fit, "wrong_timing", [
      "hard_gate:wrong_timing",
      "goal_family:corp_scoreline",
      "actor_side:runner",
    ]);
  });

  it("blocks plan-step mismatches before fallback family matching", () => {
    const fit = scoreActionGoalFit({
      candidate: candidateFor("gain-1", "gain_credit"),
      utility: utility("runner.follow_plan_step", "economy"),
      legalActionIds: ["gain-1"],
      expectedActionSignals: ["run.start"],
    });

    expectHardGateOnly(fit, "plan_step_mismatch", [
      "hard_gate:plan_step_mismatch",
      "expected:run.start",
      "candidate:economy.gain_credit",
    ]);
  });

  it("keeps the not_in_legal_actions gate as a defensive blocker", () => {
    const fit = scoreActionGoalFit({
      candidate: candidateFor("gain-1", "gain_credit"),
      utility: utility("runner.build_economy_base", "economy"),
      legalActionIds: ["other-action"],
    });

    expectHardGateOnly(fit, "not_in_legal_actions", [
      "hard_gate:not_in_legal_actions",
      "action_id:gain-1",
      "legal:false",
    ]);
  });

  it("blocks hidden-info candidates before positive scoring components", () => {
    const base = candidateFor("gain-1", "gain_credit");
    const hiddenInfoBlocked = {
      ...base,
      projectionIssues: [...base.projectionIssues, "hidden_info_blocked"],
    } satisfies ActionSemanticCandidate;

    const fit = scoreActionGoalFit({
      candidate: hiddenInfoBlocked,
      utility: utility("runner.build_economy_base", "economy"),
      legalActionIds: ["gain-1"],
    });

    expectHardGateOnly(fit, "hidden_info_required", [
      "hard_gate:hidden_info_required",
      "hidden_info_blocked:true",
    ]);
  });

  it("blocks actions that cost more credits than the side-safe economy context can pay", () => {
    const base = candidateFor("install-expensive", "install_card");
    const expensive = {
      ...base,
      costProfile: {
        ...base.costProfile,
        creditCost: 6,
      },
    } satisfies ActionSemanticCandidate;

    const fit = scoreActionGoalFit({
      candidate: expensive,
      utility: utility("runner.find_or_install_primary_breaker", "coverage"),
      legalActionIds: ["install-expensive"],
      availableCredits: 2,
    });

    expectHardGateOnly(fit, "cannot_pay", [
      "hard_gate:cannot_pay",
      "credit_cost:6",
      "available_credits:2",
    ]);
  });
});

function expectHardGateOnly(
  fit: ReturnType<typeof scoreActionGoalFit>,
  blocker: string,
  evidence: string[],
): void {
  expect(fit.fitStatus).toBe("blocked");
  expect(fit.score).toBe(0);
  expect(fit.blockers).toContain(blocker);
  expect(fit.components).toEqual([
    expect.objectContaining({
      component: "fallback_safety",
      delta: -100,
      evidence: expect.arrayContaining(evidence),
    }),
  ]);
  expect(fit.components.map((component) => component.component)).not.toEqual(
    expect.arrayContaining(["goal_fit", "cost_fit", "target_fit"]),
  );
}

function candidateFor(
  actionId: string,
  type: LegalAction["type"],
): ActionSemanticCandidate {
  const [candidate] = buildActionSemanticCandidates({
    legalActions: [legalAction(actionId, type)],
    observerSide: "runner",
    stateVersion: 1,
  });
  if (!candidate) throw new Error("candidate fixture failed");
  return candidate;
}

function legalAction(actionId: string, type: LegalAction["type"]): LegalAction {
  return {
    actionId,
    side: "runner",
    type,
    label: type,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
  };
}

function utility(
  goalId: string,
  family: TacticalGoalUtility["family"],
  priority = 80,
  urgency: TacticalGoalUtility["urgency"] = "high",
): TacticalGoalUtility {
  const requiredActionSignalsByFamily: Record<
    TacticalGoalUtility["family"],
    string[]
  > = {
    survival: ["tag.remove", "draw.card", "run.jack_out", "turn_flow.end_turn"],
    economy: ["economy.gain_credit", "draw.card", "install.card"],
    setup: ["install.card", "draw.card", "play.runner_event"],
    coverage: ["install.card", "draw.card", "breaker.boost_strength"],
    run_access: ["run.start", "run.continue", "access.resolve_card"],
    remote_contest: ["run.start", "access.resolve_card"],
    corp_scoreline: ["score.advance_card", "score.agenda", "install.card"],
    corp_ice_defense: ["corp_window.rez", "install.card", "economy.gain_credit"],
    tag_punish: ["tag.trash_runner_resource", "card_ability.trigger"],
    damage_pressure: ["card_ability.trigger", "play.corp_operation"],
    target_resolution: ["choice.resolve", "card_ability.unknown"],
    cleanup: ["tag.remove", "counter.purge_virus", "turn_flow.end_turn"],
  };
  return {
    goalId,
    family,
    priority,
    urgency,
    source: "boardstate",
    blockers: [],
    requiredActionSignals: requiredActionSignalsByFamily[family],
    evidence: [`goal:${goalId}`],
  };
}
