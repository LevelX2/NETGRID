import {
  bankToolEvidence,
  isBankBuildAction,
} from "./tactical-plan-bank-tools";
import {
  createPlanStep,
  createTacticalPlan,
} from "./tactical-plan-builders";
import {
  advanceCompletesScore,
  corpHasSafeScoreAlternative,
  remoteIsProtected,
} from "./tactical-plan-corp-score-window";
import {
  corpPunishCandidates,
  corpScoreWindowBlockers,
  corpScoreWindowCurrentStep,
  corpScoreWindowSequence,
} from "./tactical-plan-corp-helpers";
import {
  corpGoalForFamily,
  tacticalGoalEvidence,
  tacticalGoalPriorityBoost,
  tacticalGoalScoreBreakdown,
} from "./tactical-plan-goal-evidence";
import { actionServerId } from "./tactical-plan-server-targets";
import type {
  TacticalPlan,
  TacticalPlanBuildContext,
} from "./tactical-plan-types";
import { visibleSourceServerId } from "./tactical-plan-visible-cards";

export function buildCorpTacticalPlans(
  context: TacticalPlanBuildContext,
): TacticalPlan[] {
  const input = context.input;
  const stateVersion = input.playerView.stateVersion;
  const plans: TacticalPlan[] = [];
  const scorelineGoal = corpGoalForFamily(context, "corp_scoreline");
  const defenseGoal = corpGoalForFamily(context, "corp_ice_defense");
  const economyGoal = corpGoalForFamily(context, "economy");
  const punishGoal =
    corpGoalForFamily(context, "tag_punish") ??
    corpGoalForFamily(context, "damage_pressure");
  for (const action of input.legalActions.filter((candidate) => candidate.type === "score_agenda")) {
    const strategicBoost = tacticalGoalPriorityBoost(scorelineGoal);
    plans.push(
      createTacticalPlan({
        planId: `corp.create_score_window:${action.actionId}`,
        side: "corp",
        type: "corp.create_score_window",
        status: "active",
        priority: 980 + strategicBoost,
        horizonTurns: 1,
        currentStep: createPlanStep({
          stepId: `score_agenda:${action.actionId}`,
          kind: "score_agenda",
          desiredActionSemantics: ["score.agenda"],
          rationale: ["agenda score action is already legal"],
        }),
        nextSteps: corpScoreWindowSequence(action.actionId),
        evidence: [
          `score_action:${action.actionId}`,
          "corp_score_sequence:score_now",
          ...tacticalGoalEvidence(scorelineGoal),
        ],
        scoreBreakdown: tacticalGoalScoreBreakdown(scorelineGoal, strategicBoost),
        stateVersion,
      }),
    );
  }
  for (const action of input.legalActions.filter((candidate) => candidate.type === "advance_card")) {
    const serverId = actionServerId(action) ?? visibleSourceServerId(input.playerView, action);
    const blockers = corpScoreWindowBlockers(input, serverId, action);
    const currentStep = corpScoreWindowCurrentStep(action, blockers);
    const strategicBoost = tacticalGoalPriorityBoost(scorelineGoal);
    if (
      serverId &&
      !remoteIsProtected(input.playerView, serverId) &&
      !advanceCompletesScore(input.playerView, action) &&
      corpHasSafeScoreAlternative(input, action)
    ) {
      continue;
    }
    plans.push(
      createTacticalPlan({
        planId: `corp.create_score_window:${action.actionId}`,
        side: "corp",
        type: "corp.create_score_window",
        status: blockers.length > 0 ? "blocked" : "active",
        priority:
          (serverId && remoteIsProtected(input.playerView, serverId) ? 900 : 760) +
          strategicBoost,
        horizonTurns: 1,
        ...(serverId ? { target: { kind: "server", id: serverId } } : {}),
        blockers,
        currentStep,
        nextSteps: corpScoreWindowSequence(action.actionId),
        evidence: [
          `advance_action:${action.actionId}`,
          "corp_score_sequence:advance_score_card",
          ...tacticalGoalEvidence(scorelineGoal),
          ...blockers.flatMap((blocker) => blocker.evidence),
        ],
        scoreBreakdown: tacticalGoalScoreBreakdown(scorelineGoal, strategicBoost),
        stateVersion,
      }),
    );
  }
  for (const action of input.legalActions.filter((candidate) => candidate.type === "rez_ice")) {
    const serverId = actionServerId(action) ?? visibleSourceServerId(input.playerView, action);
    const strategicBoost = tacticalGoalPriorityBoost(defenseGoal);
    plans.push(
      createTacticalPlan({
        planId: `corp.rez_defense:${action.actionId}`,
        side: "corp",
        type: "corp.rez_defense",
        status: "active",
        priority: 930 + strategicBoost,
        horizonTurns: 1,
        ...(serverId ? { target: { kind: "server", id: serverId } } : {}),
        currentStep: createPlanStep({
          stepId: `rez_outer_ice:${action.actionId}`,
          kind: "rez_outer_ice",
          desiredActionSemantics: ["corp_window.rez"],
          rationale: ["rez window can turn existing ICE into defense"],
        }),
        evidence: [
          `rez_action:${action.actionId}`,
          ...tacticalGoalEvidence(defenseGoal),
        ],
        scoreBreakdown: tacticalGoalScoreBreakdown(defenseGoal, strategicBoost),
        stateVersion,
      }),
    );
  }
  for (const candidate of corpPunishCandidates(context, punishGoal)) {
    const action = input.legalActions.find(
      (legalAction) => legalAction.actionId === candidate.actionId,
    );
    if (!action) continue;
    const strategicBoost = tacticalGoalPriorityBoost(punishGoal);
    plans.push(
      createTacticalPlan({
        planId: `corp.apply_punish_pressure:${action.actionId}`,
        side: "corp",
        type: "corp.apply_punish_pressure",
        status: "active",
        priority: 730 + strategicBoost,
        horizonTurns: 1,
        currentStep: createPlanStep({
          stepId: `apply_punish_pressure:${action.actionId}`,
          kind: "apply_punish_pressure",
          desiredActionSemantics: [
            "tag.source",
            "trace.source",
            "tag.payoff",
            "damage.payoff",
            "corp_window.punish",
            "card_ability.trigger",
            "card_ability.unknown",
            "play.corp_operation",
          ],
          rationale: ["strategic Corp punish pressure maps to an existing legal action"],
        }),
        evidence: [
          `punish_action:${action.actionId}`,
          `punish_semantic:${candidate.semanticActionType}`,
          ...candidate.actionTacticSignals.map((signal) => `punish_tactic:${signal}`),
          ...candidate.cardContextSignals.map((signal) => `punish_card_signal:${signal}`),
          ...tacticalGoalEvidence(punishGoal),
        ],
        scoreBreakdown: tacticalGoalScoreBreakdown(punishGoal, strategicBoost),
        stateVersion,
      }),
    );
  }
  const bankBuildActions = input.legalActions.filter(isBankBuildAction);
  const corpBankToolEvidence = bankToolEvidence(context, "corp");
  const economyStrategicBoost = tacticalGoalPriorityBoost(economyGoal, 100);
  if (
    bankBuildActions.length > 0 &&
    input.playerView.own.credits >= 4 &&
    context.previousPlan?.type !== "corp.build_credit_bank"
  ) {
    plans.push(
      createTacticalPlan({
        planId: "corp.build_credit_bank",
        side: "corp",
        type: "corp.build_credit_bank",
        status: "active",
        priority: 690 + economyStrategicBoost,
        horizonTurns: 2,
        target: { kind: "bank", id: "corp_credit_bank" },
        currentStep: createPlanStep({
          stepId: "build_bank_counter:corp",
          kind: "build_bank_counter",
          desiredActionSemantics: ["card_ability.trigger", "card_ability.unknown"],
          requiredCapabilities: [
            {
              capabilityId: "corp.bank_capacity",
              kind: "bank_capacity",
              side: "corp",
              target: { kind: "bank", id: "corp_credit_bank" },
              evidence: corpBankToolEvidence,
            },
          ],
          rationale: ["corp can bank spare credits for future score or rez windows"],
        }),
        evidence: [
          ...bankBuildActions.map((action) => `bank_build_action:${action.actionId}`),
          ...corpBankToolEvidence,
          ...tacticalGoalEvidence(economyGoal),
        ],
        scoreBreakdown: tacticalGoalScoreBreakdown(
          economyGoal,
          economyStrategicBoost,
        ),
        stateVersion,
      }),
    );
  }
  return plans;
}
