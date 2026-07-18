import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import type { RunnerEconomyPosture } from "../runner-run-target-evaluation";
import {
  actionCreditCost,
  legalActionCreditNetGain,
  type TacticalPlanCreditValueDependencies,
} from "./tactical-plan-action-values";

export type RunnerSurvivalProgressKind =
  | "draw"
  | "damage_prevention"
  | "fund_reaction_reserve"
  | "none";

export type RunnerSurvivalActionProgress = {
  progressCapable: boolean;
  kind: RunnerSurvivalProgressKind;
  minimumCredits: number;
  reserveGapBefore: number;
  reserveGapAfter: number;
  evidence: string[];
};

export function runnerSurvivalMinimumCredits(params: {
  input: AiDecisionInput;
  candidates?: readonly ActionSemanticCandidate[] | undefined;
  economyPosture?: RunnerEconomyPosture | undefined;
  flatlineRiskLevel: "none" | "suspected" | "confirmed" | "critical";
}): number {
  const reactionReserve = Math.max(
    0,
    params.economyPosture?.minimumCreditFloor ??
      defaultDamageReactionReserve(params.flatlineRiskLevel),
  );
  const candidateByActionId = new Map(
    (params.candidates ?? []).map((candidate) => [
      candidate.actionId,
      candidate,
    ]),
  );
  const visiblePreventionFundingTargets = params.input.legalActions
    .map((action) => ({
      action,
      candidate: candidateByActionId.get(action.actionId),
    }))
    .filter(
      (entry) =>
        entry.candidate !== undefined &&
        candidateShowsDamageSurvivalSemantics(entry.candidate),
    )
    .map((entry) => actionCreditCost(entry.action))
    .filter((cost) => cost > params.input.playerView.own.credits);
  const preventionTarget =
    visiblePreventionFundingTargets.length > 0
      ? Math.min(...visiblePreventionFundingTargets)
      : 0;
  return Math.max(reactionReserve, preventionTarget);
}

export function runnerSurvivalActionProgress(params: {
  input: AiDecisionInput;
  action: LegalAction;
  candidate?: ActionSemanticCandidate | undefined;
  minimumCredits: number;
  dependencies: TacticalPlanCreditValueDependencies;
}): RunnerSurvivalActionProgress {
  const currentCredits = params.input.playerView.own.credits;
  const minimumCredits = Math.max(0, params.minimumCredits);
  const reserveGapBefore = Math.max(0, minimumCredits - currentCredits);
  const commonEvidence = [
    `runner_survival_minimum_credits:${minimumCredits}`,
    `runner_survival_current_credits:${currentCredits}`,
    `runner_survival_reserve_gap_before:${reserveGapBefore}`,
  ];
  if (params.action.type === "draw_card") {
    return {
      progressCapable: true,
      kind: "draw",
      minimumCredits,
      reserveGapBefore,
      reserveGapAfter: reserveGapBefore,
      evidence: [...commonEvidence, "runner_survival_progress:draw"],
    };
  }
  if (
    params.candidate !== undefined &&
    params.candidate.primaryProjectionStatus !== "blocked" &&
    params.candidate.primaryProjectionStatus !== "hidden_info_blocked" &&
    candidateShowsDamageSurvivalSemantics(params.candidate)
  ) {
    return {
      progressCapable: true,
      kind: "damage_prevention",
      minimumCredits,
      reserveGapBefore,
      reserveGapAfter: reserveGapBefore,
      evidence: [
        ...commonEvidence,
        "runner_survival_progress:damage_prevention",
      ],
    };
  }
  if (params.action.type !== "gain_credit" || reserveGapBefore <= 0) {
    return noRunnerSurvivalProgress(
      minimumCredits,
      reserveGapBefore,
      commonEvidence,
      reserveGapBefore <= 0
        ? "runner_survival_no_progress:reserve_satisfied"
        : "runner_survival_no_progress:action_not_survival_capable",
    );
  }
  const creditGain = legalActionCreditNetGain(
    params.input,
    params.action,
    params.dependencies,
  );
  const reserveGapAfter = Math.max(
    0,
    minimumCredits - (currentCredits + creditGain),
  );
  if (creditGain <= 0 || reserveGapAfter >= reserveGapBefore) {
    return noRunnerSurvivalProgress(
      minimumCredits,
      reserveGapBefore,
      [
        ...commonEvidence,
        `runner_survival_credit_gain:${creditGain}`,
        `runner_survival_reserve_gap_after:${reserveGapAfter}`,
      ],
      "runner_survival_no_progress:credit_gap_unchanged",
    );
  }
  return {
    progressCapable: true,
    kind: "fund_reaction_reserve",
    minimumCredits,
    reserveGapBefore,
    reserveGapAfter,
    evidence: [
      ...commonEvidence,
      `runner_survival_credit_gain:${creditGain}`,
      `runner_survival_reserve_gap_after:${reserveGapAfter}`,
      "runner_survival_progress:fund_reaction_reserve",
    ],
  };
}

export function candidateShowsDamageSurvivalSemantics(
  candidate: ActionSemanticCandidate,
): boolean {
  return candidateSurvivalTokens(candidate).some((token) =>
    [
      "damage.prevent",
      "damage_prevention",
      "flatline_prevention",
      "net_damage_prevention",
      "survival.damage_prevention",
      "survival.flatline_prevention",
    ].includes(token),
  );
}

function defaultDamageReactionReserve(
  level: "none" | "suspected" | "confirmed" | "critical",
): number {
  switch (level) {
    case "critical":
      return 4;
    case "confirmed":
      return 3;
    case "suspected":
      return 2;
    case "none":
      return 0;
  }
}

function noRunnerSurvivalProgress(
  minimumCredits: number,
  reserveGapBefore: number,
  evidence: string[],
  reason: string,
): RunnerSurvivalActionProgress {
  return {
    progressCapable: false,
    kind: "none",
    minimumCredits,
    reserveGapBefore,
    reserveGapAfter: reserveGapBefore,
    evidence: [...evidence, reason],
  };
}

function candidateSurvivalTokens(candidate: ActionSemanticCandidate): string[] {
  return [
    candidate.semanticActionType,
    candidate.sourceCardId,
    candidate.abilityId,
    ...candidate.cardContextSignals,
    ...candidate.actionTacticSignals,
    ...candidate.strategySupport.flatMap((support) => [
      support.strategyId,
      support.role,
      `${support.strategyId}:${support.role}`,
    ]),
    ...candidate.conditions.map((condition) => condition.kind),
    ...candidate.risks.map((risk) => risk.kind),
    ...candidate.constraints.map((constraint) => constraint.kind),
    ...candidate.costProfile.additionalCosts,
    ...candidate.evidence,
  ]
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => {
      const normalized = value.toLocaleLowerCase("en-US");
      return [normalized, ...normalized.split(/[.:_\-\s]+/).filter(Boolean)];
    });
}
