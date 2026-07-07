import {
  bankBuildActions,
  bankToolEvidence,
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
    const blockers = corpScoreWindowBlockers(
      input,
      serverId,
      action,
      context.corpScorelineWindowAssessment,
    );
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
  const scorelineInstallActionIds = new Set(
    (context.candidates ?? [])
      .filter(corpCandidateIsScorelineInstall)
      .map((candidate) => candidate.actionId),
  );
  for (const action of input.legalActions.filter(
    (candidate) =>
      candidate.type === "install_card" &&
      candidate.payload?.placement !== "ice" &&
      scorelineInstallActionIds.has(candidate.actionId),
  )) {
    const serverId = actionServerId(action) ?? visibleSourceServerId(input.playerView, action);
    if (!serverId || !serverId.startsWith("remote_")) continue;
    const blockers = corpScoreWindowBlockers(
      input,
      serverId,
      action,
      context.corpScorelineWindowAssessment,
    );
    const strategicBoost = tacticalGoalPriorityBoost(scorelineGoal);
    const currentStep =
      blockers.length > 0
        ? corpScoreWindowCurrentStep(action, blockers)
        : createPlanStep({
            stepId: `install_or_prepare_agenda:${action.actionId}`,
            kind: "install_or_prepare_agenda",
            desiredActionSemantics: ["install.card", "scoreline"],
            rationale: ["install scoreline card into an existing scoring remote"],
          });
    plans.push(
      createTacticalPlan({
        planId: `corp.create_score_window:${action.actionId}`,
        side: "corp",
        type: "corp.create_score_window",
        status: blockers.length > 0 ? "blocked" : "active",
        priority:
          (remoteIsProtected(input.playerView, serverId) ? 940 : 780) +
          strategicBoost,
        horizonTurns: 1,
        target: { kind: "server", id: serverId },
        blockers,
        currentStep,
        nextSteps: corpScoreWindowSequence(action.actionId),
        evidence: [
          `install_scoreline_action:${action.actionId}`,
          "corp_score_sequence:install_scoreline_card",
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
            "trash_runner_resource",
            "net_damage",
            "meat_damage",
            "corp_window.punish",
            "punish.payoff",
            "visible_punish_payoff",
            "score_flatline_window",
            "flatline",
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
  const bankBuildActionList = bankBuildActions(context, "corp", input.legalActions);
  const corpBankToolEvidence = bankToolEvidence(context, "corp");
  const economyStrategicBoost = tacticalGoalPriorityBoost(economyGoal, 100);
  if (
    bankBuildActionList.length > 0 &&
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
          ...bankBuildActionList.map((action) => `bank_build_action:${action.actionId}`),
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

function corpCandidateIsScorelineInstall(
  candidate: NonNullable<TacticalPlanBuildContext["candidates"]>[number],
): boolean {
  if (candidate.actorSide !== "corp") return false;
  if (candidate.actionType !== "install_card") return false;
  const signals = [
    candidate.semanticActionType,
    ...candidate.actionTacticSignals,
    ...candidate.cardContextSignals,
    ...candidate.strategySupport.flatMap((entry) => [
      entry.strategyId,
      entry.role,
    ]),
    ...candidate.evidence,
  ].map((entry) => entry.toLocaleLowerCase("en-US"));
  return signals.some(
    (signal) =>
      signal === "scoreline" ||
      signal === "score_line" ||
      signal === "corp_score_agenda" ||
      signal === "corp.scoreline" ||
      signal === "corp.remote_scoring",
  );
}
