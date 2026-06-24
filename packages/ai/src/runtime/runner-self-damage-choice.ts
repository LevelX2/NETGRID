import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { bestSemanticRuntimeChoice } from "./semantic-choice-ranking";
import { semanticRuntimeChoiceWithEvidence } from "./semantic-runtime-score-components";
import type {
  SemanticRuntimeChoice,
  SemanticRuntimeExclusion,
} from "./semantic-runtime-types";

export type RunnerSelfDamageSurvivalAssessment = {
  sourceDefinitionId: string;
  handBeforeAction: number;
  handAfterActionCost: number;
  selfDamageAmount: number;
  selfDamageType: "net" | "meat" | "brain" | "core" | "unknown";
  preventable: boolean | "unknown";
  unpreventable: boolean;
  effectiveSelfDamage: number;
  survivesSelfDamage: boolean;
  immediateWinByAction: boolean;
  badPublicityBefore?: number;
  badPublicityAdded?: number;
  evidence: string[];
};

type SelfDamageActionEvidence = {
  amount: number;
  type: RunnerSelfDamageSurvivalAssessment["selfDamageType"];
  preventable: RunnerSelfDamageSurvivalAssessment["preventable"];
  badPublicityAdded?: number;
  evidence: string[];
};

export type RunnerSelfDamageSurvivalAssessmentDependencies = {
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  hintEffectsForCard: (definitionId: string) => readonly unknown[] | undefined;
  fakedHitCardId: string;
  badPublicityLossThreshold: number;
};

export type RunnerSelfDamageChoiceDependencies = {
  survivalAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerSelfDamageSurvivalAssessment | undefined;
};

export function runnerSelfDamageSurvivalAssessment(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerSelfDamageSurvivalAssessmentDependencies,
): RunnerSelfDamageSurvivalAssessment | undefined {
  if (input.side !== "runner" || action.side !== "runner") return undefined;
  const sourceDefinitionId = dependencies.sourceDefinitionIdForAction(
    input,
    action,
  );
  if (!sourceDefinitionId) return undefined;
  const selfDamage = selfDamageEvidenceForAction(
    input,
    action,
    sourceDefinitionId,
    dependencies,
  );
  if (!selfDamage) return undefined;

  const handBeforeAction = input.playerView.own.gripOrHq.length;
  const handAfterActionCost =
    handBeforeAction - (actionConsumesOwnRunnerHandCard(input, action) ? 1 : 0);
  const badPublicityBefore = visibleCorpBadPublicity(input);
  const badPublicityAdded = selfDamage.badPublicityAdded ?? 0;
  const immediateWinByAction =
    badPublicityAdded > 0 &&
    badPublicityBefore + badPublicityAdded >=
      dependencies.badPublicityLossThreshold;
  const effectiveSelfDamage = selfDamage.amount;
  const survivesSelfDamage = handAfterActionCost >= effectiveSelfDamage;
  const selfDamageUnpreventable = selfDamage.preventable === false;
  const selfDamageDispositionEvidence =
    !survivesSelfDamage && !immediateWinByAction
      ? ["why_self_damage_action_blocked:self_damage_flatline_risk"]
      : [
          `why_self_damage_action_allowed:${
            immediateWinByAction
              ? "lethal_but_winning_closeout"
              : "survives_self_damage"
          }`,
        ];
  const evidence = [
    "self_damage_survival_assessed:true",
    `self_damage_source:${sourceDefinitionId}`,
    `self_damage_hand_before:${handBeforeAction}`,
    `self_damage_hand_after_action_cost:${handAfterActionCost}`,
    `self_damage_amount:${selfDamage.amount}`,
    `self_damage_type:${selfDamage.type}`,
    `self_damage_preventable:${selfDamage.preventable}`,
    `self_damage_unpreventable:${selfDamageUnpreventable}`,
    `self_damage_effective:${effectiveSelfDamage}`,
    `self_damage_survives:${survivesSelfDamage}`,
    `self_damage_immediate_win:${immediateWinByAction}`,
    ...selfDamageDispositionEvidence,
    ...(badPublicityAdded > 0
      ? [
          `self_damage_bad_publicity_before:${badPublicityBefore}`,
          `self_damage_bad_publicity_added:${badPublicityAdded}`,
        ]
      : []),
    ...(immediateWinByAction ? ["lethal_but_winning_closeout"] : []),
    ...selfDamage.evidence,
  ];

  return {
    sourceDefinitionId,
    handBeforeAction,
    handAfterActionCost,
    selfDamageAmount: selfDamage.amount,
    selfDamageType: selfDamage.type,
    preventable: selfDamage.preventable,
    unpreventable: selfDamageUnpreventable,
    effectiveSelfDamage,
    survivesSelfDamage,
    immediateWinByAction,
    ...(badPublicityAdded > 0 ? { badPublicityBefore, badPublicityAdded } : {}),
    evidence,
  };
}

export function runnerSelfDamageImmediateWinSemanticChoice(
  input: AiDecisionInput,
  choices: readonly SemanticRuntimeChoice[],
  dependencies: RunnerSelfDamageChoiceDependencies,
): SemanticRuntimeChoice | undefined {
  if (input.side !== "runner") return undefined;
  const choice = bestSemanticRuntimeChoice(
    choices.filter((candidate) => {
      if (candidate.exclusion) return false;
      return dependencies.survivalAssessment(input, candidate.action)
        ?.immediateWinByAction;
    }),
  );
  if (!choice) return undefined;
  return semanticRuntimeChoiceWithEvidence(choice, {
    reasonCode: "runner.self_damage.immediate_win",
    explanation:
      "Der Runner darf eine Self-Damage-Aktion waehlen, wenn dieselbe Aktion sofort gewinnt.",
    evidence: ["self_damage_immediate_win_selected:true"],
  });
}

export function runnerSelfDamageSurvivalExclusion(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerSelfDamageChoiceDependencies,
): SemanticRuntimeExclusion | undefined {
  const assessment = dependencies.survivalAssessment(input, action);
  if (!assessment) return undefined;
  if (assessment.survivesSelfDamage || assessment.immediateWinByAction) {
    return undefined;
  }
  return {
    key: "self_damage_flatline_risk",
    label: "Self-Damage-Flatline-Risiko",
    reason: sortedUnique(assessment.evidence).join("|"),
  };
}

function selfDamageEvidenceForAction(
  input: AiDecisionInput,
  action: LegalAction,
  sourceDefinitionId: string,
  dependencies: RunnerSelfDamageSurvivalAssessmentDependencies,
): SelfDamageActionEvidence | undefined {
  if (
    sourceDefinitionId === dependencies.fakedHitCardId &&
    action.type === "play_event"
  ) {
    return {
      amount: 2,
      type: "core",
      preventable: false,
      badPublicityAdded: 1,
      evidence: [
        "self_damage_contract:faked_hit",
        "self_damage_evidence:docs/reviews/ai/faked-hit-self-damage-semantics-review-2026-06-08.md",
      ],
    };
  }

  const effect = dependencies.hintEffectsForCard(sourceDefinitionId)?.find(
    (candidate) => {
      const record = candidate as Record<string, unknown>;
      const target = stringRecordValue(candidate, "target");
      return (
        record.kind === "damage" &&
        record.scope === "runner" &&
        record.timing === "action" &&
        typeof record.amount === "number" &&
        (target?.includes("self") === true ||
          target?.includes("self_inflicted") === true)
      );
    },
  );
  const record = effect as Record<string, unknown> | undefined;
  if (!record || typeof record.amount !== "number") return undefined;

  return {
    amount: Math.max(0, Math.floor(record.amount)),
    type: damageTypeFromHintResource(
      typeof record.resource === "string" ? record.resource : undefined,
    ),
    preventable: booleanRecordValue(record, "preventable") ?? "unknown",
    evidence: [
      "self_damage_contract:structured_ai_hint",
      `self_damage_hint_card:${sourceDefinitionId}`,
    ],
  };
}

function actionConsumesOwnRunnerHandCard(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  if (
    action.type !== "play_event" &&
    action.type !== "install_card" &&
    action.type !== "activated_card_ability" &&
    action.type !== "trigger_ability"
  ) {
    return false;
  }
  return input.playerView.own.gripOrHq.some(
    (card) => card.known && card.instanceId === action.source,
  );
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

function damageTypeFromHintResource(
  resource: string | undefined,
): RunnerSelfDamageSurvivalAssessment["selfDamageType"] {
  switch (resource) {
    case "net_damage":
      return "net";
    case "meat_damage":
      return "meat";
    case "brain_damage":
      return "brain";
    default:
      return "unknown";
  }
}

function stringRecordValue(value: unknown, key: string): string | undefined {
  const record = value as Record<string, unknown>;
  return typeof record[key] === "string" ? record[key] : undefined;
}

function booleanRecordValue(value: unknown, key: string): boolean | undefined {
  const record = value as Record<string, unknown>;
  return typeof record[key] === "boolean" ? record[key] : undefined;
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
