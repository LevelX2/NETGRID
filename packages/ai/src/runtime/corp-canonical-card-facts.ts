import {
  canonicalCapabilityId,
  cardSpecPlanningCardByDefinitionId,
} from "@netgrid/cards/planning";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { AiCardHint } from "../ai-hints";

export type CorpConditionalScoreCreditProfile = Readonly<{
  threshold: number;
  gainAmount: number;
}>;

export type CorpHostedCreditBankProfile = Readonly<{
  poolCredits: number;
  payoutCredits: number;
  payoutActionCost: number;
  payoutTiming: "action" | "start_of_corp_turn";
}>;

export type CorpTaggedDamagePayoffProfile = Readonly<{
  requiredRunnerTags: number;
  agendaPointCost: number;
  damageType: "meat";
  damageAmount: number;
}>;

export type CorpTaggedMeatDamageOperationProfile = Readonly<{
  capabilityKey: string;
  sourceCapabilityId: string;
  damageAmount: number;
}>;

export type CorpTraceTagSourceProfile = Readonly<{
  capabilityKey: string;
  sourceCapabilityId: string;
}>;

export type CorpOnPlayCapabilityProfile = Readonly<{
  capabilityKey: string;
  sourceCapabilityId: string;
}>;

export type CorpScoreConversionProfile = Readonly<{
  movesAdvancementCounters: boolean;
  placesAdvancementCounters: boolean;
  gainsCorpActions: boolean;
}>;

export type CorpArchivesToHqOperationProfile = Readonly<{
  capabilityKey: string;
  sourceCapabilityId: string;
  maxSelections: 1 | "all";
  filterCardType?: "ice";
  visibility: "hidden_info_barrier";
}>;

export type CorpScoredAgendaFreeRezProfile = Readonly<{
  capabilityKey: string;
  sourceCapabilityId: string;
  visibility: "hidden_info_barrier";
  targetPurpose: "rez_best_defensive_ice";
}>;

export type CorpScoredAgendaIceMarkProfile = Readonly<{
  capabilityKey: string;
  sourceCapabilityId: string;
  visibility: "public";
  targetPurpose: "strengthen_and_repeat_best_ice_subroutine";
  targetPreferences: readonly [
    "multi_subroutine_ice",
    "blocks_relevant_run_path",
  ];
  targetAvoid: readonly ["hidden_info_dependent_choice"];
}>;

export function corpScoredAgendaIceMarkProfile(
  definitionId: string | undefined,
): CorpScoredAgendaIceMarkProfile | undefined {
  const planning = planningCard(definitionId);
  const scoredAgenda = planning?.planning.engine.scoredAgenda;
  const targetPreference = planning?.planning.planningAnnotations?.card?.find(
    (annotation) =>
      annotation.kind === "target_preference" &&
      annotation.purpose === "strengthen_and_repeat_best_ice_subroutine",
  );
  if (
    planning?.planning.side !== "corp" ||
    planning.planning.cardType !== "agenda" ||
    scoredAgenda?.kind !== "select_rezzed_ice_mark_modifier" ||
    scoredAgenda.target !== "rezzed_installed_ice" ||
    scoredAgenda.counterType !== "mark" ||
    scoredAgenda.counterAmount !== 1 ||
    scoredAgenda.strengthBonusPerCounter !== 1 ||
    scoredAgenda.duplicateEachSelfProvidedSubroutinePerCounter !== true ||
    scoredAgenda.visibility !== "public" ||
    typeof scoredAgenda.capabilityKey !== "string" ||
    scoredAgenda.capabilityKey.length === 0 ||
    targetPreference?.kind !== "target_preference" ||
    targetPreference.preferences?.[0] !== "multi_subroutine_ice" ||
    targetPreference.preferences?.[1] !== "blocks_relevant_run_path" ||
    targetPreference.avoid?.length !== 1 ||
    targetPreference.avoid[0] !== "hidden_info_dependent_choice"
  ) {
    return undefined;
  }
  return {
    capabilityKey: scoredAgenda.capabilityKey,
    sourceCapabilityId: canonicalCapabilityId(
      planning.planning.cardDefinitionId,
      scoredAgenda.capabilityKey,
    ),
    visibility: scoredAgenda.visibility,
    targetPurpose: "strengthen_and_repeat_best_ice_subroutine",
    targetPreferences: ["multi_subroutine_ice", "blocks_relevant_run_path"],
    targetAvoid: ["hidden_info_dependent_choice"],
  };
}

export function corpScoredAgendaFreeRezProfile(
  definitionId: string | undefined,
): CorpScoredAgendaFreeRezProfile | undefined {
  const planning = planningCard(definitionId);
  const scoredAgenda = planning?.planning.engine.scoredAgenda;
  if (
    planning?.planning.side !== "corp" ||
    planning.planning.cardType !== "agenda" ||
    scoredAgenda?.kind !== "score_rez_installed_ice_at_no_cost" ||
    scoredAgenda.visibility !== "hidden_info_barrier" ||
    typeof scoredAgenda.capabilityKey !== "string" ||
    scoredAgenda.capabilityKey.length === 0
  ) {
    return undefined;
  }
  return {
    capabilityKey: scoredAgenda.capabilityKey,
    sourceCapabilityId: canonicalCapabilityId(
      planning.planning.cardDefinitionId,
      scoredAgenda.capabilityKey,
    ),
    visibility: scoredAgenda.visibility,
    targetPurpose: "rez_best_defensive_ice",
  };
}

export function corpConditionalScoreCreditProfile(
  definitionId: string | undefined,
): CorpConditionalScoreCreditProfile | undefined {
  const planning = planningCard(definitionId);
  const scoredAgenda = planning?.planning.engine.scoredAgenda;
  if (
    planning?.planning.side !== "corp" ||
    scoredAgenda?.kind !== "score_credit_swing_if_corp_credit_threshold_met" ||
    !positiveSafeInteger(scoredAgenda.threshold) ||
    !positiveSafeInteger(scoredAgenda.gainAmount)
  ) {
    return undefined;
  }
  return {
    threshold: scoredAgenda.threshold,
    gainAmount: scoredAgenda.gainAmount,
  };
}

export function corpImmediateEconomyGainFromHint(
  hint: AiCardHint | undefined,
): number | undefined {
  if (hint?.side !== "corp" || hint.cardType !== "operation") return undefined;
  const amounts = (hint.effects ?? [])
    .filter(
      (effect) =>
        effect.kind === "economy" &&
        effect.scope === "corp" &&
        effect.timing === "action" &&
        effect.finite === true &&
        positiveSafeInteger(effect.amount),
    )
    .map((effect) => effect.amount as number);
  return amounts.length > 0 ? Math.max(...amounts) : undefined;
}

export function corpHostedCreditBankProfile(
  definitionId: string | undefined,
): CorpHostedCreditBankProfile | undefined {
  const planning = planningCard(definitionId);
  if (planning?.planning.side !== "corp") return undefined;
  const lifecycle = planning.planning.engine.lifecycle;
  const poolCredits = [
    ...(lifecycle?.on_install ?? []),
    ...(lifecycle?.on_rez ?? []),
  ].reduce(
    (sum, effect) =>
      effect.kind === "add_hosted_credits" &&
      effect.target === "source" &&
      positiveSafeInteger(effect.amount)
        ? sum + effect.amount
        : sum,
    0,
  );
  const payoutCredits = Math.max(
    0,
    ...(planning.planning.engine.abilities ?? []).flatMap((ability) =>
      ability.effects.flatMap((effect) =>
        effect.kind === "take_hosted_credits" &&
        effect.recipient === "controller" &&
        positiveSafeInteger(effect.amount)
          ? [effect.amount]
          : [],
      ),
    ),
    ...(lifecycle?.start_of_corp_turn ?? []).flatMap((ability) =>
      ability.effects.flatMap((effect) =>
        effect.kind === "take_hosted_credits" &&
        effect.recipient === "controller" &&
        positiveSafeInteger(effect.amount)
          ? [effect.amount]
          : [],
      ),
    ),
  );
  const lifecyclePayout = (lifecycle?.start_of_corp_turn ?? []).some(
    (ability) =>
      ability.effects.some(
        (effect) =>
          effect.kind === "take_hosted_credits" &&
          effect.recipient === "controller" &&
          positiveSafeInteger(effect.amount),
      ),
  );
  const payoutActionCost = Math.max(
    0,
    ...(planning.planning.engine.abilities ?? []).flatMap((ability) =>
      ability.effects.some(
        (effect) =>
          effect.kind === "take_hosted_credits" &&
          effect.recipient === "controller",
      )
        ? [
            Array.isArray(ability.costs)
              ? ability.costs.reduce(
                  (sum: number, cost) =>
                    cost.kind === "action" && positiveSafeInteger(cost.amount)
                      ? sum + cost.amount
                      : sum,
                  0,
                )
              : 0,
          ]
        : [],
    ),
  );
  return poolCredits > 0 && payoutCredits > 0
    ? {
        poolCredits,
        payoutCredits,
        payoutActionCost,
        payoutTiming: lifecyclePayout ? "start_of_corp_turn" : "action",
      }
    : undefined;
}

export function corpDefinitionHasTraceSource(
  definitionId: string | undefined,
): boolean {
  const planning = planningCard(definitionId);
  if (planning?.planning.side !== "corp") return false;
  const engine = planning.planning.engine;
  return (
    containsMechanicalKind(engine, "trace") ||
    (isRecord(engine.relativeIce) &&
      isRecord(engine.relativeIce.dynamicTraceSubroutines))
  );
}

export function corpDefinitionHasTagSource(
  definitionId: string | undefined,
): boolean {
  const planning = planningCard(definitionId);
  return (
    planning?.planning.side === "corp" &&
    containsMechanicalKind(planning.planning.engine, "add_tags")
  );
}

export function corpDefinitionHasTraceTagSource(
  definitionId: string | undefined,
): boolean {
  return corpTraceTagSourceProfile(definitionId) !== undefined;
}

export function corpTraceTagSourceProfile(
  definitionId: string | undefined,
): CorpTraceTagSourceProfile | undefined {
  const planning = planningCard(definitionId);
  if (
    planning?.planning.side !== "corp" ||
    planning.planning.cardType !== "operation"
  ) {
    return undefined;
  }
  const ability = (planning.planning.engine.abilities ?? []).find(
    (candidate) =>
      candidate.kind === "on_play" &&
      mechanicalRecordsByKind(candidate.effects, "trace").some(
        (trace) =>
          containsMechanicalKind(trace.onSuccess, "add_tags") ||
          containsMechanicalKind(
            trace.onSuccess,
            "add_tags_by_trace_margin_over_runner_link",
          ),
      ),
  );
  return ability
    ? {
        capabilityKey: ability.capabilityKey,
        sourceCapabilityId: canonicalCapabilityId(
          planning.planning.cardDefinitionId,
          ability.capabilityKey,
        ),
      }
    : undefined;
}

export function corpDirectTagOperationProfile(
  definitionId: string | undefined,
): CorpOnPlayCapabilityProfile | undefined {
  const planning = planningCard(definitionId);
  if (
    planning?.planning.side !== "corp" ||
    planning.planning.cardType !== "operation"
  ) {
    return undefined;
  }
  const utility = planning.planning.engine.corpUtility;
  if (
    utility?.kind === "encounter_tag" &&
    utility.visibility === "public" &&
    utility.addressability.includes("plan") &&
    utility.addressability.includes("action") &&
    utility.addressability.includes("quote")
  ) {
    return {
      capabilityKey: utility.capabilityKey,
      sourceCapabilityId: canonicalCapabilityId(
        planning.planning.cardDefinitionId,
        utility.capabilityKey,
      ),
    };
  }
  const ability = (planning.planning.engine.abilities ?? []).find(
    (candidate) =>
      candidate.kind === "on_play" &&
      candidate.effects.some(
        (effect) =>
          effect.kind === "add_tags" &&
          effect.recipient === "runner" &&
          positiveSafeInteger(effect.amount),
      ),
  );
  return ability
    ? {
        capabilityKey: ability.capabilityKey,
        sourceCapabilityId: canonicalCapabilityId(
          planning.planning.cardDefinitionId,
          ability.capabilityKey,
        ),
      }
    : undefined;
}

export function corpTaggedCreditDenialOperationProfile(
  definitionId: string | undefined,
): CorpOnPlayCapabilityProfile | undefined {
  const planning = planningCard(definitionId);
  if (
    planning?.planning.side !== "corp" ||
    planning.planning.cardType !== "operation"
  ) {
    return undefined;
  }
  const ability = (planning.planning.engine.abilities ?? []).find(
    (candidate) =>
      candidate.kind === "on_play" &&
      (containsMechanicalKind(candidate.condition, "runner_is_tagged") ||
        containsMechanicalKind(candidate.condition, "runner_tags_at_least")) &&
      candidate.effects.some(
        (effect) =>
          effect.kind === "lose_credits" && effect.recipient === "runner",
      ),
  );
  return ability
    ? {
        capabilityKey: ability.capabilityKey,
        sourceCapabilityId: canonicalCapabilityId(
          planning.planning.cardDefinitionId,
          ability.capabilityKey,
        ),
      }
    : undefined;
}

export function corpInstalledHardwareTrashOperationProfile(
  definitionId: string | undefined,
): CorpOnPlayCapabilityProfile | undefined {
  const planning = planningCard(definitionId);
  const utility = planning?.planning.engine.corpUtility;
  if (
    planning?.planning.side !== "corp" ||
    planning.planning.cardType !== "operation" ||
    utility?.kind !== "installed_hardware_trash_by_counter" ||
    utility.excludesSubtype !== "cybernetics" ||
    utility.visibility !== "public"
  ) {
    return undefined;
  }
  return {
    capabilityKey: utility.capabilityKey,
    sourceCapabilityId: canonicalCapabilityId(
      planning.planning.cardDefinitionId,
      utility.capabilityKey,
    ),
  };
}

export function corpArchivesToHqOperationProfile(
  definitionId: string | undefined,
): CorpArchivesToHqOperationProfile | undefined {
  const planning = planningCard(definitionId);
  const utility = planning?.planning.engine.corpUtility;
  if (
    planning?.planning.side !== "corp" ||
    planning.planning.cardType !== "operation" ||
    utility?.kind !== "corp_archives_to_hq" ||
    utility.visibility !== "hidden_info_barrier" ||
    (utility.maxSelections !== undefined &&
      utility.maxSelections !== 1 &&
      utility.maxSelections !== "all") ||
    (utility.filter?.cardType !== undefined &&
      utility.filter.cardType !== "ice")
  ) {
    return undefined;
  }
  return {
    capabilityKey: utility.capabilityKey,
    sourceCapabilityId: canonicalCapabilityId(
      planning.planning.cardDefinitionId,
      utility.capabilityKey,
    ),
    maxSelections: utility.maxSelections ?? 1,
    ...(utility.filter?.cardType
      ? { filterCardType: utility.filter.cardType }
      : {}),
    visibility: utility.visibility,
  };
}

export function corpTaggedMeatDamageOperationProfile(
  definitionId: string | undefined,
): CorpTaggedMeatDamageOperationProfile | undefined {
  const planning = planningCard(definitionId);
  if (
    planning?.planning.side !== "corp" ||
    planning.planning.cardType !== "operation"
  ) {
    return undefined;
  }
  const profiles = (planning.planning.engine.abilities ?? []).flatMap(
    (ability) => {
      if (ability.kind !== "on_play") return [];
      const requiresTaggedRunner =
        containsMechanicalKind(ability.condition, "runner_is_tagged") ||
        containsMechanicalKind(ability.condition, "runner_tags_at_least");
      if (!requiresTaggedRunner) return [];
      return ability.effects.flatMap((effect) =>
        effect.kind === "damage" &&
        effect.recipient === "runner" &&
        effect.damageType === "meat" &&
        positiveSafeInteger(effect.amount)
          ? [
              {
                capabilityKey: ability.capabilityKey,
                sourceCapabilityId: canonicalCapabilityId(
                  planning.planning.cardDefinitionId,
                  ability.capabilityKey,
                ),
                damageAmount: effect.amount,
              },
            ]
          : [],
      );
    },
  );
  return profiles.sort(
    (left, right) =>
      right.damageAmount - left.damageAmount ||
      left.capabilityKey.localeCompare(right.capabilityKey),
  )[0];
}

export function corpTaggedDamagePayoffProfile(
  definitionId: string | undefined,
): CorpTaggedDamagePayoffProfile | undefined {
  const planning = planningCard(definitionId);
  const payoff = planning?.planning.engine.uniqueDirectLongtail;
  if (
    planning?.planning.side !== "corp" ||
    payoff?.kind !== "tagged_meat_damage" ||
    !positiveSafeInteger(payoff.requiredRunnerTags) ||
    !positiveSafeInteger(payoff.agendaPointCost) ||
    payoff.damageType !== "meat" ||
    !positiveSafeInteger(payoff.damageAmount)
  ) {
    return undefined;
  }
  return {
    requiredRunnerTags: payoff.requiredRunnerTags,
    agendaPointCost: payoff.agendaPointCost,
    damageType: payoff.damageType,
    damageAmount: payoff.damageAmount,
  };
}

export function corpScoreConversionProfile(
  definitionId: string | undefined,
): CorpScoreConversionProfile | undefined {
  const planning = planningCard(definitionId);
  if (planning?.planning.side !== "corp") return undefined;
  const effectKinds = new Set(
    (planning.planning.engine.abilities ?? []).flatMap((ability) =>
      ability.effects.map((effect) => effect.kind),
    ),
  );
  const profile = {
    movesAdvancementCounters: effectKinds.has("move_advancement_counters"),
    placesAdvancementCounters: effectKinds.has(
      "distribute_advancement_counters",
    ),
    gainsCorpActions: (planning.planning.engine.abilities ?? []).some(
      (ability) =>
        ability.effects.some(
          (effect) =>
            effect.kind === "gain_actions" &&
            (effect.recipient === "corp" ||
              effect.recipient === "controller") &&
            positiveSafeInteger(effect.amount),
        ),
    ),
  };
  return Object.values(profile).some(Boolean) ? profile : undefined;
}

export function corpCandidateProvidesScoreConversion(
  candidate: ActionSemanticCandidate,
): boolean {
  if (
    candidate.semanticActionType === "score_conversion.move_advancement" ||
    candidate.semanticActionType === "score_conversion.place_advancement" ||
    candidate.semanticActionType === "score_conversion.gain_action_capacity"
  ) {
    return true;
  }
  if (
    candidate.actionCapacityProjection?.kind ===
      "immediate_unrestricted_gain" &&
    candidate.actionCapacityProjection.followupActionCapacity > 0
  ) {
    return true;
  }
  return corpScoreConversionProfile(candidate.sourceDefinitionId) !== undefined;
}

function planningCard(definitionId: string | undefined) {
  return definitionId
    ? cardSpecPlanningCardByDefinitionId(definitionId)
    : undefined;
}

function positiveSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0;
}

function containsMechanicalKind(value: unknown, kind: string): boolean {
  if (Array.isArray(value))
    return value.some((entry) => containsMechanicalKind(entry, kind));
  if (!isRecord(value)) return false;
  if (value.kind === kind) return true;
  return Object.values(value).some((entry) =>
    containsMechanicalKind(entry, kind),
  );
}

function mechanicalRecordsByKind(
  value: unknown,
  kind: string,
): Record<string, unknown>[] {
  if (Array.isArray(value))
    return value.flatMap((entry) => mechanicalRecordsByKind(entry, kind));
  if (!isRecord(value)) return [];
  return [
    ...(value.kind === kind ? [value] : []),
    ...Object.values(value).flatMap((entry) =>
      mechanicalRecordsByKind(entry, kind),
    ),
  ];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
