import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import {
  candidateMatchesSignal,
  evaluateActionGoalHardGates,
  type ActionGoalHardGateResult,
} from "./hard-gates";
import type { ScoreComponentDelta } from "./score-components";
import type { TargetChoiceTargetFitRecommendation } from "./target-choice-shadow";
import type { TacticalGoalUtility } from "./tactical-goal-utility";

export type ActionGoalFit = {
  actionId: string;
  goalId: string;
  fitStatus: "fit" | "partial" | "blocked" | "irrelevant";
  score: number;
  components: ScoreComponentDelta[];
  blockers: string[];
};

export type ScoreActionGoalFitParams = {
  candidate: ActionSemanticCandidate;
  utility: TacticalGoalUtility;
  legalActionIds?: readonly string[];
  availableCredits?: number;
  creditPressure?: "low" | "medium" | "high";
  expectedActionSignals?: readonly string[];
  targetChoiceRecommendation?: TargetChoiceTargetFitRecommendation;
};

export function scoreActionGoalFit(
  params: ScoreActionGoalFitParams,
): ActionGoalFit {
  const hardGates = evaluateActionGoalHardGates(params);
  const blockers = hardGates
    .filter((gate) => gate.status === "block")
    .map((gate) => gate.gate);
  if (blockers.length > 0) {
    return {
      actionId: params.candidate.actionId,
      goalId: params.utility.goalId,
      fitStatus: "blocked",
      score: 0,
      components: hardGateComponents(hardGates),
      blockers,
    };
  }

  const components = [
    goalFitComponent(params.candidate, params.utility),
    costFitComponent(params.candidate, params.utility, params.creditPressure),
    timingFitComponent(params.candidate, params.utility),
    riskAdjustmentComponent(params.candidate, params.utility),
    planAlignmentComponent(params.candidate, params.utility),
    targetFitComponent(
      params.candidate,
      params.utility,
      params.targetChoiceRecommendation,
    ),
    fallbackSafetyComponent(params.candidate),
  ];
  const score = Math.max(
    0,
    Math.round(components.reduce((sum, component) => sum + component.delta, 0)),
  );
  return {
    actionId: params.candidate.actionId,
    goalId: params.utility.goalId,
    fitStatus: fitStatusForScore(score, params.utility.priority),
    score,
    components,
    blockers: [],
  };
}

function hardGateComponents(
  hardGates: readonly ActionGoalHardGateResult[],
): ScoreComponentDelta[] {
  return hardGates
    .filter((gate) => gate.status === "block")
    .map((gate) => ({
      component: "fallback_safety",
      delta: -100,
      evidence: [`hard_gate:${gate.gate}`, ...gate.evidence],
    }));
}

function goalFitComponent(
  candidate: ActionSemanticCandidate,
  utility: TacticalGoalUtility,
): ScoreComponentDelta {
  const matchedSignals = utility.requiredActionSignals.filter((signal) =>
    candidateMatchesSignal(candidate, signal),
  );
  const familyFallback = familyFallbackMatch(candidate, utility);
  const matched = matchedSignals.length > 0 || familyFallback;
  return {
    component: "goal_fit",
    delta: matched ? utility.priority : -20,
    evidence: [
      `utility_family:${utility.family}`,
      `candidate_semantic:${candidate.semanticActionType}`,
      `matched:${matched}`,
      ...(matchedSignals.length > 0
        ? [`matched_signals:${matchedSignals.join(",")}`]
        : []),
    ],
  };
}

function costFitComponent(
  candidate: ActionSemanticCandidate,
  utility: TacticalGoalUtility,
  creditPressure: ScoreActionGoalFitParams["creditPressure"],
): ScoreComponentDelta {
  const creditCost = candidate.costProfile.creditCost ?? 0;
  const creditGain =
    candidate.semanticActionType === "economy.gain_credit" ? 15 : 0;
  const pressureBonus =
    candidate.semanticActionType === "economy.gain_credit"
      ? creditPressureBonus(creditPressure)
      : 0;
  const costPenalty = utility.family === "economy" ? Math.min(10, creditCost) : creditCost;
  return {
    component: "cost_fit",
    delta: creditGain + pressureBonus - costPenalty,
    evidence: [
      `credit_cost:${creditCost}`,
      `credit_gain_bonus:${creditGain}`,
      `credit_pressure:${creditPressure ?? "unknown"}`,
      `credit_pressure_bonus:${pressureBonus}`,
    ],
  };
}

function creditPressureBonus(
  creditPressure: ScoreActionGoalFitParams["creditPressure"],
): number {
  switch (creditPressure) {
    case "high":
      return 10;
    case "medium":
      return 5;
    case "low":
    case undefined:
      return 0;
  }
}

function timingFitComponent(
  candidate: ActionSemanticCandidate,
  utility: TacticalGoalUtility,
): ScoreComponentDelta {
  const score =
    utility.family === "corp_scoreline" &&
    candidate.semanticActionType === "score.agenda"
      ? 12
      : candidate.timingProfile.scoreWindow && utility.family === "corp_scoreline"
        ? 8
        : 2;
  return {
    component: "timing_fit",
    delta: score,
    evidence: [
      `score_window:${candidate.timingProfile.scoreWindow === true}`,
      `goal_family:${utility.family}`,
    ],
  };
}

function riskAdjustmentComponent(
  candidate: ActionSemanticCandidate,
  utility: TacticalGoalUtility,
): ScoreComponentDelta {
  const highRiskCount = candidate.risks.filter(
    (risk) => risk.severity === "high" || risk.severity === "unknown",
  ).length;
  const selfDamageCount = candidate.costProfile.selfDamage?.length ?? 0;
  const penalty =
    highRiskCount * 20 +
    selfDamageCount * (utility.family === "survival" ? 60 : 25);
  return {
    component: "risk_adjustment",
    delta: -penalty,
    evidence: [
      `high_risk_count:${highRiskCount}`,
      `self_damage_cost_count:${selfDamageCount}`,
    ],
  };
}

function planAlignmentComponent(
  candidate: ActionSemanticCandidate,
  utility: TacticalGoalUtility,
): ScoreComponentDelta {
  const aligned = utility.evidence.some((entry) =>
    candidate.evidence.some((candidateEntry) => candidateEntry.includes(entry)),
  );
  return {
    component: "plan_alignment",
    delta: aligned ? 8 : 0,
    evidence: [`aligned:${aligned}`],
  };
}

function targetFitComponent(
  candidate: ActionSemanticCandidate,
  utility: TacticalGoalUtility,
  targetChoiceRecommendation: TargetChoiceTargetFitRecommendation | undefined,
): ScoreComponentDelta {
  const hasTargetContext = Boolean(candidate.targetContext);
  const needsTarget =
    utility.family === "target_resolution" ||
    utility.family === "remote_contest" ||
    utility.family === "run_access";
  const recommendationApplies =
    targetChoiceRecommendation?.actionId === candidate.actionId &&
    targetChoiceRecommendation.productiveUseAllowed === true &&
    targetChoiceRecommendation.selectedChoicesCreated === false &&
    targetChoiceRecommendation.selectedTargetsCreated === false;
  const recommendationBonus =
    needsTarget && recommendationApplies
      ? targetChoiceRecommendation.confidence === "high"
        ? 18
        : targetChoiceRecommendation.confidence === "medium"
          ? 12
          : 6
      : 0;
  return {
    component: "target_fit",
    delta: needsTarget ? (hasTargetContext ? 12 : -10) + recommendationBonus : 0,
    evidence: [
      `needs_target:${needsTarget}`,
      `has_target:${hasTargetContext}`,
      `target_choice_recommendation:${recommendationApplies}`,
      ...(recommendationApplies
        ? [
            `target_choice_option:${targetChoiceRecommendation.optionId}`,
            `target_choice_confidence:${targetChoiceRecommendation.confidence}`,
            `target_choice_score:${targetChoiceRecommendation.score}`,
          ]
        : []),
    ],
  };
}

function fallbackSafetyComponent(
  candidate: ActionSemanticCandidate,
): ScoreComponentDelta {
  const engineLegalGate = candidate.hardGates.find(
    (gate) => gate.gateId === "engine_legal_action",
  );
  const safe = engineLegalGate?.status === "pass";
  return {
    component: "fallback_safety",
    delta: safe ? 3 : -50,
    evidence: [`engine_legal_action_gate:${engineLegalGate?.status ?? "missing"}`],
  };
}

function familyFallbackMatch(
  candidate: ActionSemanticCandidate,
  utility: TacticalGoalUtility,
): boolean {
  const semantic = candidate.semanticActionType;
  switch (utility.family) {
    case "survival":
      return semantic === "run.jack_out" || semantic === "tag.remove";
    case "economy":
      return semantic.startsWith("economy.") || semantic === "draw.card";
    case "setup":
    case "coverage":
      return semantic === "install.card" || semantic === "draw.card";
    case "run_access":
    case "remote_contest":
      return (
        (semantic.startsWith("run.") && semantic !== "run.jack_out") ||
        semantic.startsWith("access.")
      );
    case "corp_scoreline":
      return semantic.startsWith("score.");
    case "corp_ice_defense":
      return semantic === "corp_window.rez" || semantic === "install.card";
    case "cleanup":
      return semantic === "tag.remove" || semantic.startsWith("counter.");
    case "tag_punish":
      return semanticHasTerm(semantic, "tag");
    case "damage_pressure":
      return (
        semanticHasTerm(semantic, "damage") ||
        semantic.startsWith("card_ability.")
      );
    case "target_resolution":
      return semantic === "choice.resolve" || Boolean(candidate.targetContext);
  }
}

function semanticHasTerm(semantic: string, term: string): boolean {
  return semantic
    .split(/[.:-]+/)
    .some((segment) => semanticSegmentHasTerm(segment, term));
}

function semanticSegmentHasTerm(segment: string, term: string): boolean {
  return (
    segment === term ||
    segment.startsWith(`${term}_`) ||
    segment.endsWith(`_${term}`) ||
    segment.includes(`_${term}_`)
  );
}

function fitStatusForScore(
  score: number,
  priority: number,
): ActionGoalFit["fitStatus"] {
  if (score <= 0) return "irrelevant";
  if (score >= priority) return "fit";
  if (score >= Math.max(20, priority / 2)) return "partial";
  return "irrelevant";
}
