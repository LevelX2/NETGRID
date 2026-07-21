import { bankBuildActions, bankToolEvidence } from "./tactical-plan-bank-tools";
import { createPlanStep, createTacticalPlan } from "./tactical-plan-builders";
import {
  advanceCompletesScore,
  corpHasSafeScoreAlternative,
  remoteIsProtected,
} from "./tactical-plan-corp-score-window";
import {
  corpPunishCandidates,
  corpImmediateCreditActionIds,
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
import {
  visibleCardForAction,
  visibleSourceServerId,
} from "./tactical-plan-visible-cards";
import { buildCorpScoreConversionPlans } from "./tactical-plan-corp-score-conversion-plan";
import { buildCorpFiniteEconomyPlans } from "./tactical-plan-corp-finite-economy";
import { buildCorpPersistentEconomyPlans } from "./tactical-plan-corp-persistent-economy";
import { buildCorpRemoteProjectPlans } from "./tactical-plan-corp-remote-project";
import {
  corpScorelineActionCanCloseThisTurn,
  corpScorelineAllowsMultiTurnDevelopment,
  corpScorelineFeasibilityForDecisionInput,
} from "../runtime/corp-scoreline-feasibility";
import { createCorpCreditDemand } from "./credit-demand";
import { corpActiveRemoteScorelineState } from "../runtime/corp-scoreline/semantic-runtime-corp-score-state";
import { semanticRuntimeCorpExistingCentralRezFloorAssessments } from "../runtime/semantic-runtime-corp-central-rez-context";

export function buildCorpTacticalPlans(
  context: TacticalPlanBuildContext,
): TacticalPlan[] {
  const input = context.input;
  const stateVersion = input.playerView.stateVersion;
  const plans: TacticalPlan[] = [];
  const scorelineFeasibility = corpScorelineFeasibilityForDecisionInput(input);
  const scorelinePointsReachable = scorelineFeasibility?.feasible !== false;
  const scorelineMultiTurnDevelopmentAllowed =
    corpScorelineAllowsMultiTurnDevelopment(scorelineFeasibility);
  const scorelinePlanAllowedForAction = (actionId: string): boolean =>
    scorelinePointsReachable &&
    (scorelineMultiTurnDevelopmentAllowed ||
      corpScorelineActionCanCloseThisTurn(scorelineFeasibility, actionId));
  const scorelineGoal = corpGoalForFamily(context, "corp_scoreline");
  const defenseGoal = corpGoalForFamily(context, "corp_ice_defense");
  const economyGoal = corpGoalForFamily(context, "economy");
  const punishGoal =
    corpGoalForFamily(context, "tag_punish") ??
    corpGoalForFamily(context, "damage_pressure");
  if (scorelineMultiTurnDevelopmentAllowed) {
    plans.push(...buildCorpScoreConversionPlans(context, scorelineGoal));
  }
  plans.push(...buildCorpFiniteEconomyPlans(context));
  plans.push(...buildCorpPersistentEconomyPlans(context));
  if (scorelineMultiTurnDevelopmentAllowed) {
    plans.push(...buildCorpRemoteProjectPlans(context));
  }
  const immediateCreditActionIds = corpImmediateCreditActionIds(input);
  const strategicReserve = context.strategicIntentState?.reserve;
  if (
    strategicReserve?.kind === "credits" &&
    strategicReserve.satisfied === false &&
    strategicReserve.required > input.playerView.own.credits
  ) {
    const planId = "corp.fund_strategy_reserve";
    const strategicBoost = tacticalGoalPriorityBoost(economyGoal);
    plans.push(
      createTacticalPlan({
        planId,
        side: "corp",
        type: "corp.fund_strategy_reserve",
        status: immediateCreditActionIds.length > 0 ? "progressing" : "blocked",
        priority: 800 + strategicBoost,
        horizonTurns: 3,
        target: { kind: "capability", id: "strategy_credit_reserve" },
        blockers: [
          {
            blockerId: `${planId}:missing_credits`,
            kind: "missing_credits",
            severity: "soft",
            target: { kind: "capability", id: "strategy_credit_reserve" },
            removalStepKind: "gain_credits",
            evidence: strategicReserve.evidence,
          },
        ],
        creditDemands: [
          createCorpCreditDemand({
            demandId: `${planId}:credits`,
            sourcePlanId: planId,
            purpose: "tactical_reserve",
            priority: "tactical_reserve",
            hardness: "soft",
            deadline: "within_three_own_turns",
            currentCredits: input.playerView.own.credits,
            targetCredits: strategicReserve.required,
            evidence: strategicReserve.evidence,
          }),
        ],
        currentStep: createPlanStep({
          stepId: `${planId}:gain_credits`,
          kind: "gain_credits",
          desiredActionSemantics: [
            "economy.gain_credit",
            "card_ability.trigger",
          ],
          actionCandidateIds: immediateCreditActionIds,
          requiredCapabilities: [
            {
              capabilityId: `${planId}:credit_reserve`,
              kind: "credits",
              side: "corp",
              target: { kind: "capability", id: "strategy_credit_reserve" },
              minimumCredits: strategicReserve.required,
              evidence: strategicReserve.evidence,
            },
          ],
          rationale: [
            `build the strategic reserve to ${strategicReserve.required} credits`,
          ],
        }),
        evidence: [
          "corp_strategy_credit_reserve_plan:true",
          ...strategicReserve.evidence,
          ...tacticalGoalEvidence(economyGoal),
        ],
        scoreBreakdown: tacticalGoalScoreBreakdown(economyGoal, strategicBoost),
        stateVersion,
      }),
    );
  }
  const centralRezReserveAssessments =
    input.playerView.own.stackOrRdCount > 1
      ? semanticRuntimeCorpExistingCentralRezFloorAssessments(input).filter(
          (assessment) => assessment.blockedByFloor,
        )
      : [];
  for (const reserve of centralRezReserveAssessments) {
    const planId = `corp.rez_defense:${reserve.serverId}:fund`;
    const strategicBoost = tacticalGoalPriorityBoost(defenseGoal);
    plans.push(
      createTacticalPlan({
        planId,
        side: "corp",
        type: "corp.rez_defense",
        status: immediateCreditActionIds.length > 0 ? "progressing" : "blocked",
        priority: 930 + strategicBoost,
        horizonTurns: 1,
        target: { kind: "server", id: reserve.serverId },
        blockers: [
          {
            blockerId: `${planId}:missing_rez_reserve`,
            kind: "missing_rez_reserve",
            severity: "soft",
            target: { kind: "server", id: reserve.serverId },
            removalStepKind: "build_rez_reserve",
            evidence: reserve.evidence,
          },
        ],
        creditDemands: [
          createCorpCreditDemand({
            demandId: `${planId}:credits`,
            sourcePlanId: planId,
            purpose: "current_rez_window",
            priority: "current_foreground_plan",
            hardness: "soft",
            deadline: "end_of_current_turn",
            currentCredits: input.playerView.own.credits,
            targetCredits: reserve.rezFloor,
            evidence: reserve.evidence,
          }),
        ],
        currentStep: createPlanStep({
          stepId: `${planId}:build_rez_reserve`,
          kind: "build_rez_reserve",
          desiredActionSemantics: [
            "economy.gain_credit",
            "card_ability.trigger",
          ],
          actionCandidateIds: immediateCreditActionIds,
          requiredCapabilities: [
            {
              capabilityId: `${planId}:rez_reserve`,
              kind: "rez_reserve",
              side: "corp",
              minimumCredits: reserve.rezFloor,
              evidence: reserve.evidence,
            },
          ],
          rationale: [
            `fund the pressured ${reserve.serverId.toUpperCase()} ICE rez floor`,
          ],
        }),
        evidence: [
          "corp_central_rez_reserve_plan:true",
          ...reserve.evidence,
          ...tacticalGoalEvidence(defenseGoal),
        ],
        scoreBreakdown: tacticalGoalScoreBreakdown(defenseGoal, strategicBoost),
        stateVersion,
      }),
    );
  }
  for (const action of input.legalActions.filter(
    (candidate) =>
      candidate.type === "score_agenda" &&
      scorelinePlanAllowedForAction(candidate.actionId),
  )) {
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
          actionCandidateIds: [action.actionId],
          rationale: ["agenda score action is already legal"],
        }),
        nextSteps: corpScoreWindowSequence(action.actionId),
        evidence: [
          `score_action:${action.actionId}`,
          "corp_score_sequence:score_now",
          ...tacticalGoalEvidence(scorelineGoal),
        ],
        scoreBreakdown: tacticalGoalScoreBreakdown(
          scorelineGoal,
          strategicBoost,
        ),
        stateVersion,
      }),
    );
  }
  for (const action of input.legalActions.filter(
    (candidate) =>
      candidate.type === "advance_card" &&
      scorelinePlanAllowedForAction(candidate.actionId),
  )) {
    const serverId =
      actionServerId(action) ?? visibleSourceServerId(input.playerView, action);
    const blockers = corpScoreWindowBlockers(
      input,
      serverId,
      action,
      context.corpScorelineWindowAssessment,
    );
    const currentStep = corpScoreWindowCurrentStep(action, blockers, input);
    const strategicBoost = tacticalGoalPriorityBoost(scorelineGoal);
    const planId = `corp.create_score_window:${action.actionId}`;
    const activeScoreline = corpActiveRemoteScorelineState(input);
    const explicitReserveTarget =
      activeScoreline?.cardId === action.source &&
      input.playerView.own.credits < activeScoreline.reserveFloor
        ? activeScoreline.reserveFloor
        : blockers.some((blocker) => blocker.kind === "missing_rez_reserve")
          ? 4
          : 0;
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
        planId,
        side: "corp",
        type: "corp.create_score_window",
        status:
          blockers.length === 0
            ? "active"
            : currentStep.actionCandidateIds.length > 0
              ? "progressing"
              : "blocked",
        priority:
          (serverId && remoteIsProtected(input.playerView, serverId)
            ? 900
            : 760) + strategicBoost,
        horizonTurns: 1,
        ...(serverId ? { target: { kind: "server", id: serverId } } : {}),
        blockers,
        ...(explicitReserveTarget > 0
          ? {
              creditDemands: [
                createCorpCreditDemand({
                  demandId: `${planId}:score-window-reserve`,
                  sourcePlanId: planId,
                  purpose: "current_score_window",
                  priority: "current_foreground_plan",
                  hardness: "soft",
                  deadline: "end_of_current_turn",
                  currentCredits: input.playerView.own.credits,
                  targetCredits: explicitReserveTarget,
                  evidence: [
                    `active_scoreline_reserve_target:${explicitReserveTarget}`,
                    ...(activeScoreline?.cardId === action.source
                      ? activeScoreline.evidence
                      : ["missing_rez_reserve"]),
                  ],
                }),
              ],
            }
          : {}),
        currentStep,
        nextSteps: corpScoreWindowSequence(action.actionId),
        evidence: [
          `advance_action:${action.actionId}`,
          "corp_score_sequence:advance_score_card",
          ...tacticalGoalEvidence(scorelineGoal),
          ...blockers.flatMap((blocker) => blocker.evidence),
        ],
        scoreBreakdown: tacticalGoalScoreBreakdown(
          scorelineGoal,
          strategicBoost,
        ),
        stateVersion,
      }),
    );
  }
  const scorelineInstallActionIds = new Set(
    input.legalActions
      .filter(
        (action) =>
          action.side === "corp" &&
          action.type === "install_card" &&
          action.payload?.placement !== "ice" &&
          visibleCardForAction(input.playerView, action)?.type === "agenda",
      )
      .map((action) => action.actionId),
  );
  for (const action of input.legalActions.filter(
    (candidate) =>
      candidate.type === "install_card" &&
      candidate.payload?.placement !== "ice" &&
      scorelineInstallActionIds.has(candidate.actionId) &&
      scorelinePlanAllowedForAction(candidate.actionId),
  )) {
    const serverId =
      actionServerId(action) ?? visibleSourceServerId(input.playerView, action);
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
        ? corpScoreWindowCurrentStep(action, blockers, input)
        : createPlanStep({
            stepId: `install_or_prepare_agenda:${action.actionId}`,
            kind: "install_or_prepare_agenda",
            desiredActionSemantics: ["install.card", "scoreline"],
            actionCandidateIds: [action.actionId],
            rationale: [
              "install scoreline card into an existing scoring remote",
            ],
          });
    plans.push(
      createTacticalPlan({
        planId: `corp.create_score_window:${action.actionId}`,
        side: "corp",
        type: "corp.create_score_window",
        status:
          blockers.length === 0
            ? "active"
            : currentStep.actionCandidateIds.length > 0
              ? "progressing"
              : "blocked",
        priority:
          (remoteIsProtected(input.playerView, serverId) ? 940 : 780) +
          strategicBoost,
        horizonTurns: 3,
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
        scoreBreakdown: tacticalGoalScoreBreakdown(
          scorelineGoal,
          strategicBoost,
        ),
        stateVersion,
      }),
    );
  }
  for (const action of input.legalActions.filter(
    (candidate) =>
      candidate.type === "rez_ice" &&
      visibleCardForAction(input.playerView, candidate)?.type === "ice",
  )) {
    const serverId =
      actionServerId(action) ?? visibleSourceServerId(input.playerView, action);
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
          actionCandidateIds: [action.actionId],
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
          actionCandidateIds: [action.actionId],
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
          rationale: [
            "strategic Corp punish pressure maps to an existing legal action",
          ],
        }),
        evidence: [
          `punish_action:${action.actionId}`,
          `punish_semantic:${candidate.semanticActionType}`,
          ...candidate.actionTacticSignals.map(
            (signal) => `punish_tactic:${signal}`,
          ),
          ...candidate.cardContextSignals.map(
            (signal) => `punish_card_signal:${signal}`,
          ),
          ...tacticalGoalEvidence(punishGoal),
        ],
        scoreBreakdown: tacticalGoalScoreBreakdown(punishGoal, strategicBoost),
        stateVersion,
      }),
    );
  }
  const bankBuildActionList = bankBuildActions(
    context,
    "corp",
    input.legalActions,
  );
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
          desiredActionSemantics: [
            "card_ability.trigger",
            "card_ability.unknown",
          ],
          requiredCapabilities: [
            {
              capabilityId: "corp.bank_capacity",
              kind: "bank_capacity",
              side: "corp",
              target: { kind: "bank", id: "corp_credit_bank" },
              evidence: corpBankToolEvidence,
            },
          ],
          rationale: [
            "corp can bank spare credits for future score or rez windows",
          ],
        }),
        evidence: [
          ...bankBuildActionList.map(
            (action) => `bank_build_action:${action.actionId}`,
          ),
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
