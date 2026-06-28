import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import {
  visibleBreakerCardCanAddressIce,
  visibleBreakerRoles,
} from "./runner-visible-breaker-coverage";

export type EffectiveDefenseContext = {
  isRezzableNow: boolean;
  rezCost: number;
  postRezCredits: number;
  hasImmediateStopPotential: boolean;
  hasMeaningfulTaxOrDamage: boolean;
  requiresPostRezPaidAbility: boolean;
  postRezAbilityAffordable: boolean;
  minimumUsefulX?: number;
  zeroEffectRisk: boolean;
  evidence: string[];
};

export type SemanticRuntimeCorpEffectiveDefenseDependencies = {
  actionCreditCost: (action: LegalAction) => number;
};

const VARIABLE_REZ_KINDS_REQUIRING_VALUE = new Set([
  "paid_end_the_run",
  "paid_end_the_run_subroutines",
  "trace_boost",
  "x_strength",
]);

export function semanticRuntimeCorpEffectiveDefenseContext(
  input: AiDecisionInput,
  action: LegalAction,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
  dependencies: SemanticRuntimeCorpEffectiveDefenseDependencies,
): EffectiveDefenseContext | undefined {
  if (input.side !== "corp" || action.side !== "corp") return undefined;
  if (action.type !== "rez_ice") return undefined;

  const rezCost = actionCreditCost(
    action,
    actionSemanticCandidate,
    dependencies,
  );
  const postRezCredits = input.playerView.own.credits - rezCost;
  const isRezzableNow = postRezCredits >= 0;
  const defenseSignals = defenseSignalEntries(action, actionSemanticCandidate);
  const variableRezKind = variableRezKindForAction(
    action,
    actionSemanticCandidate,
  );
  const variableRezValue = variableRezChosenValue(
    action,
    actionSemanticCandidate,
  );
  const minimumUsefulX = minimumUsefulVariableRezValue(
    variableRezKind,
    defenseSignals,
  );
  const zeroVariableDefense =
    minimumUsefulX !== undefined &&
    variableRezValue !== undefined &&
    variableRezValue < minimumUsefulX;
  const requiresPostRezPaidAbility =
    defenseSignals.some(
      (signal) =>
        signalHasTerm(signal, "encounter_paid_subroutine_add") ||
        signalHasTerm(signal, "paid_subroutine"),
    );
  const postRezAbilityMinimumCost = requiresPostRezPaidAbility ? 2 : 0;
  const postRezAbilityAffordable =
    !requiresPostRezPaidAbility ||
    postRezCredits >= postRezAbilityMinimumCost;
  const hasEtrSignal =
    defenseSignals.some(
      (signal) =>
        signalHasTerm(signal, "etr_ice") ||
        signalHasTerm(signal, "end_the_run") ||
        signalHasTerm(signal, "end_run") ||
        signalHasTerm(signal, "conditional_end_run") ||
        signalHasTerm(signal, "ice_protection"),
    );
  const hasTraceSignal =
    defenseSignals.some((signal) => signalHasTerm(signal, "trace"));
  const hasTaxOrDamageSignal =
    defenseSignals.some(
      (signal) => signalHasTerm(signal, "tax") || signalHasTerm(signal, "damage"),
    ) ||
    hasTraceSignal;
  const visibleBreakerCoverage = visibleRunnerCoverageCanBreakRezzedIce(
    input,
    action,
  );
  const rawImmediateStopPotential =
    isRezzableNow &&
    !zeroVariableDefense &&
    ((hasEtrSignal &&
      (!requiresPostRezPaidAbility || postRezAbilityAffordable)) ||
      (hasTraceSignal &&
        variableRezValue !== undefined &&
        variableRezValue >= (minimumUsefulX ?? 1)));
  const hasImmediateStopPotential =
    rawImmediateStopPotential && !visibleBreakerCoverage;
  const hasMeaningfulTaxOrDamage =
    isRezzableNow &&
    !zeroVariableDefense &&
    hasTaxOrDamageSignal &&
    (!requiresPostRezPaidAbility || postRezAbilityAffordable);
  const hasKnownDefenseSignal =
    hasEtrSignal ||
    hasTraceSignal ||
    hasTaxOrDamageSignal ||
    requiresPostRezPaidAbility;
  const zeroEffectRisk =
    isRezzableNow &&
    (zeroVariableDefense ||
      (visibleBreakerCoverage && !hasMeaningfulTaxOrDamage) ||
      (hasKnownDefenseSignal &&
        ((requiresPostRezPaidAbility && !postRezAbilityAffordable) ||
          (!hasImmediateStopPotential && !hasMeaningfulTaxOrDamage))));

  return {
    isRezzableNow,
    rezCost,
    postRezCredits,
    hasImmediateStopPotential,
    hasMeaningfulTaxOrDamage,
    requiresPostRezPaidAbility,
    postRezAbilityAffordable,
    ...(minimumUsefulX !== undefined ? { minimumUsefulX } : {}),
    zeroEffectRisk,
    evidence: [
      `effective_defense_rezzable:${isRezzableNow}`,
      `effective_defense_rez_cost:${rezCost}`,
      `effective_defense_post_rez_credits:${postRezCredits}`,
      `effective_defense_stop:${hasImmediateStopPotential}`,
      `effective_defense_tax_or_damage:${hasMeaningfulTaxOrDamage}`,
      `effective_defense_post_rez_paid_ability:${requiresPostRezPaidAbility}`,
      `effective_defense_post_rez_ability_affordable:${postRezAbilityAffordable}`,
      `effective_defense_visible_breaker_coverage:${visibleBreakerCoverage}`,
      `effective_defense_zero_effect:${zeroEffectRisk}`,
      ...(variableRezKind ? [`effective_defense_variable_kind:${variableRezKind}`] : []),
      ...(variableRezValue !== undefined
        ? [`effective_defense_variable_value:${variableRezValue}`]
        : []),
      ...(minimumUsefulX !== undefined
        ? [`effective_defense_minimum_useful_x:${minimumUsefulX}`]
        : []),
    ],
  };
}

function visibleRunnerCoverageCanBreakRezzedIce(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  const sourceCard = visibleActionSourceCard(input, action);
  if (!sourceCard) return false;
  const selectedSubtypes = selectedSubtypesAfterRez(action);
  const assessedIce =
    selectedSubtypes.length > 0
      ? {
          ...sourceCard,
          subtypes: selectedSubtypes,
        }
      : sourceCard;
  return (input.playerView.opponent.rig ?? []).some(
    (card) =>
      card.known !== false &&
      card.type === "program" &&
      visibleBreakerCardCanAddressIce(card, assessedIce, {
        visibleBreakerRoles,
        visibleCardText,
      }),
  );
}

function visibleActionSourceCard(
  input: AiDecisionInput,
  action: LegalAction,
) {
  const sourceId = action.source;
  if (!sourceId || sourceId === "basic_action" || sourceId === "game_rule") {
    return undefined;
  }
  const visibleCards = [
    ...(input.playerView.own.gripOrHq ?? []),
    ...(input.playerView.own.rig ?? []),
    ...(input.playerView.own.scoreArea ?? []),
    ...(input.playerView.servers ?? []).flatMap((server) => [
      ...server.ice,
      ...server.root,
    ]),
  ];
  return visibleCards.find((card) => card.instanceId === sourceId);
}

function selectedSubtypesAfterRez(action: LegalAction): string[] {
  const value = payloadString(action, "selectedSubtypesAfterRez");
  return value
    ? value
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
    : [];
}

function visibleCardText(card: { title?: string; rulesText?: string; definitionId?: string; subtypes?: readonly string[] }): string {
  return [
    card.title,
    card.rulesText,
    card.definitionId,
    ...(card.subtypes ?? []),
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ");
}

function actionCreditCost(
  action: LegalAction,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
  dependencies: SemanticRuntimeCorpEffectiveDefenseDependencies,
): number {
  const costProfile = actionSemanticCandidate?.costProfile;
  if (costProfile === undefined) return dependencies.actionCreditCost(action);
  if (typeof costProfile.creditCost === "number") return costProfile.creditCost;
  if (
    costProfile.costKnownStatus === "known" ||
    costProfile.costKnownStatus === "not_applicable"
  ) {
    return 0;
  }
  return dependencies.actionCreditCost(action);
}

function defenseSignalEntries(
  action: LegalAction,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): string[] {
  return [
    action.type,
    actionSemanticCandidate?.semanticActionType,
    ...(actionSemanticCandidate?.actionTacticSignals ?? []),
    ...(actionSemanticCandidate?.cardContextSignals ?? []),
    ...(actionSemanticCandidate?.strategySupport.map((support) => support.strategyId) ??
      []),
    ...(actionSemanticCandidate?.evidence ?? []),
  ]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.toLocaleLowerCase("en-US"));
}

function variableRezKindForAction(
  action: LegalAction,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): string | undefined {
  return (
    payloadString(action, "variableRezKind") ??
    variableRezFromActionId(action)?.kind ??
    actionSemanticCandidate?.costProfile.variableCost?.kind
  );
}

function variableRezChosenValue(
  action: LegalAction,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): number | undefined {
  return (
    payloadNumber(action, "variableRezValue") ??
    (typeof actionSemanticCandidate?.costProfile.variableCost?.chosen ===
    "number"
      ? actionSemanticCandidate.costProfile.variableCost.chosen
      : undefined) ??
    (typeof actionSemanticCandidate?.costProfile.xValue === "number"
      ? actionSemanticCandidate.costProfile.xValue
      : undefined) ??
    variableRezFromActionId(action)?.value
  );
}

function minimumUsefulVariableRezValue(
  variableRezKind: string | undefined,
  defenseSignals: readonly string[],
): number | undefined {
  if (
    (variableRezKind !== undefined &&
      VARIABLE_REZ_KINDS_REQUIRING_VALUE.has(variableRezKind)) ||
    defenseSignals.some(
      (signal) =>
        signal === "trace.source" || signalHasTerm(signal, "trace_ice"),
    )
  ) {
    return 1;
  }
  return undefined;
}

function variableRezFromActionId(
  action: LegalAction,
): { kind: string; value: number } | undefined {
  const actionIdParts = action.actionId.split(".");
  for (let index = 0; index < actionIdParts.length - 1; index += 1) {
    const kind = actionIdParts[index];
    if (
      kind !== "x_strength" &&
      kind !== "trace_boost" &&
      kind !== "paid_end_the_run_subroutines"
    ) {
      continue;
    }
    const value = Number(actionIdParts[index + 1]);
    if (Number.isFinite(value)) {
      return { kind, value };
    }
  }
  return undefined;
}

function payloadString(action: LegalAction, key: string): string | undefined {
  const value = action.payload?.[key];
  return typeof value === "string" ? value : undefined;
}

function payloadNumber(action: LegalAction, key: string): number | undefined {
  const value = action.payload?.[key];
  return typeof value === "number" ? value : undefined;
}

function signalHasTerm(signal: string, term: string): boolean {
  return signal
    .split(/[.:-]+/)
    .some((segment) => signalSegmentHasTerm(segment, term));
}

function signalSegmentHasTerm(segment: string, term: string): boolean {
  return (
    segment === term ||
    segment.startsWith(`${term}_`) ||
    segment.endsWith(`_${term}`) ||
    segment.includes(`_${term}_`)
  );
}
