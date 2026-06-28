import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import { rolesMatch } from "./role-match";

export type RunnerBadPublicityRelevanceAssessment = {
  sourceDefinitionId: string;
  currentCorpBadPublicity: number;
  badPublicityGainFromAction: number;
  immediateBadPublicityCloseout: boolean;
  badPublicityPlanPresent: boolean;
  badPublicitySupportCount: number;
  payoffLikelyWithinHorizon: boolean;
  drawbackSeverity: number;
  badPublicityRelevanceScore: number;
  evidence: string[];
};

type RunnerBadPublicityActionEvidence = {
  gain: number;
  evidence: string[];
};

type RunnerSelfDamageSurvivalAssessmentLike = {
  effectiveSelfDamage: number;
  preventable: boolean | "unknown";
  evidence: string[];
};

export type RunnerBadPublicityCardSupportDependencies = {
  rolesForCardId: (definitionId: string) => string[];
  hintEffectsForCard: (definitionId: string) => readonly unknown[] | undefined;
  rulesTextForCard: (definitionId: string) => string | undefined;
  effectTarget: (effect: unknown) => string | undefined;
};

export type RunnerBadPublicityRelevanceAssessmentDependencies = {
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  selfDamageSurvivalAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerSelfDamageSurvivalAssessmentLike | undefined;
  actionCreditCost: (action: LegalAction) => number;
  cardSupport: RunnerBadPublicityCardSupportDependencies;
  fakedHitCardId: string;
};

const BAD_PUBLICITY_LOSS_THRESHOLD_FOR_AI = 7;

export function runnerBadPublicityRelevanceAssessment(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerBadPublicityRelevanceAssessmentDependencies,
): RunnerBadPublicityRelevanceAssessment | undefined {
  if (input.side !== "runner" || action.side !== "runner") return undefined;
  const sourceDefinitionId = dependencies.sourceDefinitionIdForAction(
    input,
    action,
  );
  if (!sourceDefinitionId) return undefined;
  const actionEvidence = runnerBadPublicityEvidenceForAction(
    sourceDefinitionId,
    dependencies,
  );
  if (!actionEvidence) return undefined;

  const currentCorpBadPublicity = visibleCorpBadPublicity(input);
  const badPublicityGainFromAction = actionEvidence.gain;
  const immediateBadPublicityCloseout =
    currentCorpBadPublicity + badPublicityGainFromAction >=
    BAD_PUBLICITY_LOSS_THRESHOLD_FOR_AI;
  const badPublicitySupportCount =
    runnerVisibleBadPublicitySupportCount(input, dependencies.cardSupport);
  const badPublicityPlanPresent = badPublicitySupportCount >= 2;
  const payoffLikelyWithinHorizon =
    immediateBadPublicityCloseout ||
    (badPublicityPlanPresent &&
      currentCorpBadPublicity + badPublicityGainFromAction >= 4);
  const selfDamageAssessment = dependencies.selfDamageSurvivalAssessment(
    input,
    action,
  );
  const drawbackSeverity =
    dependencies.actionCreditCost(action) * 45 +
    (selfDamageAssessment
      ? selfDamageAssessment.effectiveSelfDamage * 450 +
        (selfDamageAssessment.preventable === false ? 250 : 0)
      : 0);
  const badPublicityRelevanceScore = immediateBadPublicityCloseout
    ? 1600
    : badPublicityPlanPresent
      ? Math.max(-250, 350 - Math.floor(drawbackSeverity * 0.5))
      : -900 - drawbackSeverity;
  const evidence = [
    `bad_publicity_current:${currentCorpBadPublicity}`,
    `bad_publicity_gain_from_action:${badPublicityGainFromAction}`,
    `bad_publicity_closeout:${immediateBadPublicityCloseout}`,
    `bad_publicity_plan_present:${badPublicityPlanPresent}`,
    `bad_publicity_support_count:${badPublicitySupportCount}`,
    `bad_publicity_payoff_horizon:${payoffLikelyWithinHorizon}`,
    `bad_publicity_drawback_severity:${drawbackSeverity}`,
    `bad_publicity_relevance_score:${badPublicityRelevanceScore}`,
    ...(immediateBadPublicityCloseout
      ? ["immediate_bad_publicity_closeout"]
      : badPublicityPlanPresent
        ? ["bad_publicity_plan_support"]
        : [
            "bad_publicity_support_only",
            "no_bad_publicity_closeout",
            "why_bad_publicity_support_only:no_visible_bad_publicity_plan",
          ]),
    ...(drawbackSeverity > 0 && !immediateBadPublicityCloseout
      ? ["drawback_outweighs_bp_gain"]
      : []),
    ...(selfDamageAssessment?.evidence ?? []),
    ...actionEvidence.evidence,
  ];

  return {
    sourceDefinitionId,
    currentCorpBadPublicity,
    badPublicityGainFromAction,
    immediateBadPublicityCloseout,
    badPublicityPlanPresent,
    badPublicitySupportCount,
    payoffLikelyWithinHorizon,
    drawbackSeverity,
    badPublicityRelevanceScore,
    evidence,
  };
}

function runnerBadPublicityEvidenceForAction(
  sourceDefinitionId: string,
  dependencies: RunnerBadPublicityRelevanceAssessmentDependencies,
): RunnerBadPublicityActionEvidence | undefined {
  if (sourceDefinitionId === dependencies.fakedHitCardId) {
    return {
      gain: 1,
      evidence: ["bad_publicity_contract:faked_hit"],
    };
  }
  if (
    !cardHasBadPublicitySupport(
      sourceDefinitionId,
      dependencies.cardSupport,
    )
  ) {
    return undefined;
  }
  return {
    gain: 1,
    evidence: [`bad_publicity_contract:hint:${sourceDefinitionId}`],
  };
}

function runnerVisibleBadPublicitySupportCount(
  input: AiDecisionInput,
  dependencies: RunnerBadPublicityCardSupportDependencies,
): number {
  const visibleOwnCards = [
    ...input.playerView.own.gripOrHq,
    ...(input.playerView.own.rig ?? []),
    ...input.playerView.own.scoreArea,
  ];
  return visibleOwnCards.filter(
    (card) =>
      card.known &&
      card.definitionId !== undefined &&
      cardHasBadPublicitySupport(card.definitionId, dependencies),
  ).length;
}

function cardHasBadPublicitySupport(
  definitionId: string,
  dependencies: RunnerBadPublicityCardSupportDependencies,
): boolean {
  const roles = dependencies.rolesForCardId(definitionId);
  const hintEffects = dependencies.hintEffectsForCard(definitionId);
  const rulesText = dependencies.rulesTextForCard(definitionId);
  return (
    rolesMatch(roles, ["bad_publicity"]) ||
    hintEffects?.some((effect) =>
      effectMentionsBadPublicity(effect, dependencies),
    ) === true ||
    /bad publicity|bad_publicity/i.test(rulesText ?? "")
  );
}

function effectMentionsBadPublicity(
  effect: unknown,
  dependencies: RunnerBadPublicityCardSupportDependencies,
): boolean {
  const target = dependencies.effectTarget(effect);
  return target !== undefined && rolesMatch([target], ["bad_publicity"]);
}

function visibleCorpBadPublicity(input: AiDecisionInput): number {
  const identity =
    input.side === "runner"
      ? input.playerView.opponent.identity
      : input.playerView.own.identity;
  const amount = identity.counterDisplays?.find(
    (counter) =>
      counter.id === "bad_publicity" ||
      counter.counterType === "bad_publicity" ||
      counter.displayKind === "bad_publicity",
  )?.amount;
  return typeof amount === "number" && Number.isFinite(amount)
    ? Math.max(0, Math.floor(amount))
    : 0;
}
