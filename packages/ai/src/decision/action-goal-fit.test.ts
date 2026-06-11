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

    expect(fit.fitStatus).toBe("blocked");
    expect(fit.blockers).toContain("risk_unacceptable");
  });

  it("blocks target-profile goals when target context is missing", () => {
    const candidate = candidateFor("choice-1", "resolve_choice");
    const fit = scoreActionGoalFit({
      candidate,
      utility: utility("runner.resolve_target", "target_resolution"),
      legalActionIds: ["choice-1"],
    });

    expect(fit.fitStatus).toBe("blocked");
    expect(fit.blockers).toContain(
      "target_context_missing_for_target_profile",
    );
  });

  it("keeps the not_in_legal_actions gate as a defensive blocker", () => {
    const fit = scoreActionGoalFit({
      candidate: candidateFor("gain-1", "gain_credit"),
      utility: utility("runner.build_economy_base", "economy"),
      legalActionIds: ["other-action"],
    });

    expect(fit.fitStatus).toBe("blocked");
    expect(fit.blockers).toContain("not_in_legal_actions");
  });
});

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
