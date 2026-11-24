import {
  canonicalCapabilityId,
  planningCardByDefinitionId,
} from "@netgrid/cards/planning";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";

/** Canonical same-fort discount facts, never an installation recommendation. */
export function corpSameFortAgendaDiscountProfiles(
  definitionId: number | undefined,
): readonly Readonly<{ requiredSubtype?: string; reduction: number }>[] {
  const card = planningCard(definitionId);
  return (card?.engine.modifiers ?? []).flatMap((modifier) =>
    modifier.kind === "agenda_difficulty" &&
    modifier.operation === "reduce" &&
    modifier.side === "corp" &&
    modifier.sourceZone === "corp_root" &&
    modifier.activeWhile === "rezzed" &&
    modifier.appliesTo.sameServerAsSource === true &&
    positiveSafeInteger(modifier.amount)
      ? [
          {
            ...(modifier.appliesTo.subtype !== undefined
              ? { requiredSubtype: modifier.appliesTo.subtype }
              : {}),
            reduction: modifier.amount,
          },
        ]
      : [],
  );
}

/** A public, unconditional reusable run has separate physical entry and access.
 * This certifies a possible path, never predicts the Runner's next action. */
export function corpPublicFixedOffServerRunProfiles(
  definitionId: number | undefined,
): readonly Readonly<{
  entryServerId: "hq" | "rd" | "archives";
  accessServerId: "hq" | "rd";
}>[] {
  const card = planningCard(definitionId);
  if (card?.side !== "runner") return [];
  const result: {
    entryServerId: "hq" | "rd" | "archives";
    accessServerId: "hq" | "rd";
  }[] = [];
  for (const ability of card.engine.abilities ?? []) {
    if (
      ability.kind !== "activated" ||
      ability.timing !== "runner_main" ||
      ability.condition !== undefined ||
      ability.limit !== undefined ||
      !ability.addressability?.includes("plan") ||
      !ability.addressability?.includes("action") ||
      !ability.addressability?.includes("quote") ||
      ability.costs?.length !== 1 ||
      ability.costs[0]?.kind !== "action" ||
      ability.costs[0].amount !== 1 ||
      ability.effects.length !== 1
    )
      continue;
    const effect = ability.effects[0];
    if (
      !isRecord(effect) ||
      effect.kind !== "make_run" ||
      !isRecord(effect.target) ||
      effect.target.kind !== "central_server" ||
      Object.keys(effect.target).some(
        (key) => key !== "kind" && key !== "server",
      ) ||
      !["hq", "rd", "archives"].includes(String(effect.target.server)) ||
      (effect.accessServerOverride !== "hq" &&
        effect.accessServerOverride !== "rd") ||
      effect.accessServerOverride === effect.target.server ||
      effect.visibility !== "public" ||
      (effect.successfulRunServerOverride !== undefined &&
        effect.successfulRunServerOverride !== effect.accessServerOverride) ||
      Object.keys(effect).some(
        (key) =>
          ![
            "kind",
            "target",
            "accessServerOverride",
            "successfulRunServerOverride",
            "visibility",
          ].includes(key),
      )
    )
      continue;
    result.push({
      entryServerId: effect.target.server as "hq" | "rd" | "archives",
      accessServerId: effect.accessServerOverride,
    });
  }
  return result;
}

export type CorpTaggedDamagePayoffProfile = Readonly<{
  requiredRunnerTags: number;
  agendaPointCost: number;
  damageType: "meat";
  damageAmount: number;
}>;

export type CorpTaggedMeatDamageProfile = Readonly<{
  capabilityKey: string;
  sourceCapabilityId: number;
  damageAmount: number;
  agendaPointCost?: number;
}>;

export type CorpTraceTagSourceProfile = Readonly<{
  capabilityKey: string;
  sourceCapabilityId: number;
}>;

export type CorpOnPlayCapabilityProfile = Readonly<{
  capabilityKey: string;
  sourceCapabilityId: number;
}>;

/** Fixed printed cost for a visible operation, independent of its play conditions. */
export function corpFixedOperationPlayCredits(
  definitionId: number | undefined,
): number | undefined {
  const card = planningCard(definitionId);
  if (card?.side !== "corp" || card.cardType !== "operation") return undefined;
  const cost = card.engine.characteristics.playCost;
  return cost?.kind === "fixed" ? cost.credits : undefined;
}

export function corpPunishFixedCapabilityCost(
  definitionId: number,
  capabilityId: number,
): { clicks: number; credits: number } | undefined {
  const card = planningCard(definitionId);
  if (card?.side !== "corp") return undefined;
  if (card.cardType === "operation") {
    const credits = corpFixedOperationPlayCredits(definitionId);
    return credits === undefined ? undefined : { clicks: 1, credits };
  }
  const scored = card.engine.scoredAgenda;
  if (
    scored?.kind === "tagged_runner_meat_damage_reduce_hand_size_on_success" &&
    canonicalCapabilityId(card.cardDefinitionId, scored.capabilityKey) ===
      capabilityId
  ) {
    return { clicks: 1, credits: 0 };
  }
  const ability = card.engine.abilities?.find(
    (candidate) =>
      canonicalCapabilityId(card.cardDefinitionId, candidate.capabilityKey) ===
      capabilityId,
  );
  if (ability?.kind !== "activated" || ability.timing !== "corp_main")
    return undefined;
  if (
    ability.costs.some(
      (cost) => cost.kind !== "action" && cost.kind !== "credit",
    )
  )
    return undefined;
  return {
    clicks: ability.costs.reduce(
      (sum, cost) => sum + (cost.kind === "action" ? cost.amount : 0),
      0,
    ),
    credits: ability.costs.reduce(
      (sum, cost) => sum + (cost.kind === "credit" ? cost.amount : 0),
      0,
    ),
  };
}

export type CorpScoreConversionProfile = Readonly<{
  movesAdvancementCounters: boolean;
  placesAdvancementCounters: boolean;
  gainsCorpActions: boolean;
}>;

export type CorpArchivesToHqOperationProfile = Readonly<{
  capabilityKey: string;
  sourceCapabilityId: number;
  maxSelections: 1 | "all";
  filterCardType?: "ice";
  visibility: "hidden_info_barrier";
}>;

export type CorpScoredAgendaFreeRezProfile = Readonly<{
  capabilityKey: string;
  sourceCapabilityId: number;
  visibility: "hidden_info_barrier";
  targetPurpose: "rez_best_defensive_ice";
}>;

export type CorpScoredAgendaIceMarkProfile = Readonly<{
  capabilityKey: string;
  sourceCapabilityId: number;
  visibility: "public";
  targetPurpose: "strengthen_and_repeat_best_ice_subroutine";
  targetPreferences: readonly [
    "multi_subroutine_ice",
    "blocks_relevant_run_path",
  ];
  targetAvoid: readonly ["hidden_info_dependent_choice"];
}>;

export type CorpScoredAgendaHqShuffleProfile = Readonly<{
  capabilityKey: string;
  sourceCapabilityId: number;
  creditPerAgendaPoint: number;
  visibility: "hidden_info_barrier";
  targetPurpose: "choose_hq_agenda_subset_for_reveal_credit_and_shuffle";
}>;

export type CorpStartOfTurnOptionalDrawProfile = Readonly<{
  sourceEffect: "corp_start_turn_optional_draw";
  drawCount: number;
}>;

export function corpStartOfTurnOptionalDrawProfile(
  definitionId: number | undefined,
): CorpStartOfTurnOptionalDrawProfile | undefined {
  const planning = planningCard(definitionId);
  const scoredAgenda = planning?.engine.scoredAgenda;
  return planning?.side === "corp" &&
    planning.cardType === "agenda" &&
    scoredAgenda?.kind === "corp_start_turn_optional_draw" &&
    positiveSafeInteger(scoredAgenda.drawCount)
    ? {
        sourceEffect: "corp_start_turn_optional_draw",
        drawCount: scoredAgenda.drawCount,
      }
    : undefined;
}

export function corpScoredAgendaHqShuffleProfile(
  definitionId: number | undefined,
): CorpScoredAgendaHqShuffleProfile | undefined {
  const planning = planningCard(definitionId);
  const scoredAgenda = planning?.engine.scoredAgenda;
  const targetPreference = planning?.planningAnnotations?.card?.find(
    (annotation) =>
      annotation.kind === "target_preference" &&
      annotation.purpose ===
        "choose_hq_agenda_subset_for_reveal_credit_and_shuffle",
  );
  if (
    planning?.side !== "corp" ||
    planning.cardType !== "agenda" ||
    scoredAgenda?.kind !== "shuffle_selected_hq_agendas_into_rd_gain_credits" ||
    scoredAgenda.shuffleSelectedIntoRnd !== true ||
    scoredAgenda.visibility !== "hidden_info_barrier" ||
    !positiveSafeInteger(scoredAgenda.creditPerAgendaPoint) ||
    typeof scoredAgenda.capabilityKey !== "string" ||
    scoredAgenda.capabilityKey.length === 0 ||
    targetPreference?.kind !== "target_preference"
  ) {
    return undefined;
  }
  return {
    capabilityKey: scoredAgenda.capabilityKey,
    sourceCapabilityId: canonicalCapabilityId(
      planning.cardDefinitionId,
      scoredAgenda.capabilityKey,
    ),
    creditPerAgendaPoint: scoredAgenda.creditPerAgendaPoint,
    visibility: scoredAgenda.visibility,
    targetPurpose: "choose_hq_agenda_subset_for_reveal_credit_and_shuffle",
  };
}

export function corpScoredAgendaIceMarkProfile(
  definitionId: number | undefined,
): CorpScoredAgendaIceMarkProfile | undefined {
  const planning = planningCard(definitionId);
  const scoredAgenda = planning?.engine.scoredAgenda;
  const targetPreference = planning?.planningAnnotations?.card?.find(
    (annotation) =>
      annotation.kind === "target_preference" &&
      annotation.purpose === "strengthen_and_repeat_best_ice_subroutine",
  );
  if (
    planning?.side !== "corp" ||
    planning.cardType !== "agenda" ||
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
      planning.cardDefinitionId,
      scoredAgenda.capabilityKey,
    ),
    visibility: scoredAgenda.visibility,
    targetPurpose: "strengthen_and_repeat_best_ice_subroutine",
    targetPreferences: ["multi_subroutine_ice", "blocks_relevant_run_path"],
    targetAvoid: ["hidden_info_dependent_choice"],
  };
}

export function corpScoredAgendaFreeRezProfile(
  definitionId: number | undefined,
): CorpScoredAgendaFreeRezProfile | undefined {
  const planning = planningCard(definitionId);
  const scoredAgenda = planning?.engine.scoredAgenda;
  if (
    planning?.side !== "corp" ||
    planning.cardType !== "agenda" ||
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
      planning.cardDefinitionId,
      scoredAgenda.capabilityKey,
    ),
    visibility: scoredAgenda.visibility,
    targetPurpose: "rez_best_defensive_ice",
  };
}

/** A deliberately closed proof: no activation, lifecycle or other conversion.
 * Printed encounter effects and ICE install discounts cannot create main-phase
 * income. Past on-score payouts are inert in the scored area.
 */
export function corpDefinitionIsMainPhasePassive(
  definitionId: number | undefined,
  scoreEffect: "none" | "past" | "unreachable" = "none",
): boolean {
  const card = planningCard(definitionId);
  if (card?.side !== "corp") return false;
  const engine = card.engine;
  const allowedKeys = new Set([
    "schemaVersion",
    "characteristics",
    "printedSubroutines",
    "modifiers",
  ]);
  if (scoreEffect !== "none") allowedKeys.add("scoredAgenda");
  if (Object.keys(engine).some((key) => !allowedKeys.has(key))) return false;
  if (
    (engine.modifiers ?? []).some(
      (modifier) => modifier.kind !== "install_cost",
    )
  )
    return false;
  if (
    scoreEffect !== "unreachable" &&
    engine.scoredAgenda &&
    engine.scoredAgenda.kind !== "gain_credits_on_score" &&
    engine.scoredAgenda.kind !==
      "score_credit_swing_if_corp_credit_threshold_met"
  )
    return false;
  return true;
}

/** With no later click, plain hand recovery or advancement cannot fund a score.
 * The caller must exclude other installed agendas and advancement triggers.
 */
export function corpOperationCannotFundWithLastClick(
  definitionId: number | undefined,
): boolean {
  const card = planningCard(definitionId);
  if (card?.side !== "corp" || card.cardType !== "operation")
    return false;
  const engine = card.engine;
  const keys = new Set([
    "schemaVersion",
    "characteristics",
    "abilities",
    "corpUtility",
  ]);
  if (Object.keys(engine).some((key) => !keys.has(key))) return false;
  if (!engine.abilities?.length)
    return engine.corpUtility?.kind === "corp_archives_to_hq";
  return (
    !engine.corpUtility &&
    engine.abilities.every(
      (ability) =>
        ability.kind === "on_play" &&
        ability.costs === "printed" &&
        ability.effects.length > 0 &&
        ability.effects.every(
          (effect) => effect.kind === "distribute_advancement_counters",
        ),
    )
  );
}

export function corpDefinitionHasTraceSource(
  definitionId: number | undefined,
): boolean {
  const planning = planningCard(definitionId);
  if (planning?.side !== "corp") return false;
  const engine = planning.engine;
  return (
    containsMechanicalKind(engine, "trace") ||
    (isRecord(engine.relativeIce) &&
      isRecord(engine.relativeIce.dynamicTraceSubroutines))
  );
}

export function corpDefinitionHasTagSource(
  definitionId: number | undefined,
): boolean {
  const planning = planningCard(definitionId);
  return (
    planning?.side === "corp" &&
    (containsMechanicalKind(planning.engine, "add_tags") ||
      planning.engine.corpUtility?.kind === "encounter_tag")
  );
}

export function corpDefinitionHasTraceTagSource(
  definitionId: number | undefined,
): boolean {
  return corpTraceTagSourceProfile(definitionId) !== undefined;
}

export function corpTraceTagSourceProfile(
  definitionId: number | undefined,
): CorpTraceTagSourceProfile | undefined {
  const planning = planningCard(definitionId);
  if (
    planning?.side !== "corp" ||
    planning.cardType !== "operation"
  ) {
    return undefined;
  }
  const ability = (planning.engine.abilities ?? []).find(
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
          planning.cardDefinitionId,
          ability.capabilityKey,
        ),
      }
    : undefined;
}

export function corpScoredTraceTagSourceProfile(
  definitionId: number | undefined,
): CorpTraceTagSourceProfile | undefined {
  const planning = planningCard(definitionId);
  if (
    planning?.side !== "corp" ||
    planning.cardType !== "agenda"
  )
    return undefined;
  const ability = (planning.engine.abilities ?? []).find(
    (candidate) =>
      candidate.kind === "activated" &&
      candidate.timing === "corp_main" &&
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
          planning.cardDefinitionId,
          ability.capabilityKey,
        ),
      }
    : undefined;
}

export function corpDirectTagOperationProfile(
  definitionId: number | undefined,
): CorpOnPlayCapabilityProfile | undefined {
  const planning = planningCard(definitionId);
  if (
    planning?.side !== "corp" ||
    planning.cardType !== "operation"
  ) {
    return undefined;
  }
  const utility = planning.engine.corpUtility;
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
        planning.cardDefinitionId,
        utility.capabilityKey,
      ),
    };
  }
  const ability = (planning.engine.abilities ?? []).find(
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
          planning.cardDefinitionId,
          ability.capabilityKey,
        ),
      }
    : undefined;
}

export function corpTaggedCreditDenialOperationProfile(
  definitionId: number | undefined,
): CorpOnPlayCapabilityProfile | undefined {
  const planning = planningCard(definitionId);
  if (
    planning?.side !== "corp" ||
    planning.cardType !== "operation"
  ) {
    return undefined;
  }
  const ability = (planning.engine.abilities ?? []).find(
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
          planning.cardDefinitionId,
          ability.capabilityKey,
        ),
      }
    : undefined;
}

export function corpInstalledHardwareTrashOperationProfile(
  definitionId: number | undefined,
): CorpOnPlayCapabilityProfile | undefined {
  const planning = planningCard(definitionId);
  const utility = planning?.engine.corpUtility;
  if (
    planning?.side !== "corp" ||
    planning.cardType !== "operation" ||
    utility?.kind !== "installed_hardware_trash_by_counter" ||
    utility.excludesSubtype !== "cybernetics" ||
    utility.visibility !== "public"
  ) {
    return undefined;
  }
  return {
    capabilityKey: utility.capabilityKey,
    sourceCapabilityId: canonicalCapabilityId(
      planning.cardDefinitionId,
      utility.capabilityKey,
    ),
  };
}

export function corpArchivesToHqOperationProfile(
  definitionId: number | undefined,
): CorpArchivesToHqOperationProfile | undefined {
  const planning = planningCard(definitionId);
  const utility = planning?.engine.corpUtility;
  if (
    planning?.side !== "corp" ||
    planning.cardType !== "operation" ||
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
      planning.cardDefinitionId,
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
  definitionId: number | undefined,
): CorpTaggedMeatDamageProfile | undefined {
  return taggedMeatDamageProfile(definitionId, "operation");
}

export function corpScoredTaggedMeatDamageProfile(
  definitionId: number | undefined,
): CorpTaggedMeatDamageProfile | undefined {
  const card = planningCard(definitionId);
  const scored = card?.engine.scoredAgenda;
  if (
    card?.side === "corp" &&
    card.cardType === "agenda" &&
    scored?.kind === "tagged_runner_meat_damage_reduce_hand_size_on_success" &&
    scored.visibility === "public" &&
    positiveSafeInteger(scored.damageAmount)
  ) {
    return {
      capabilityKey: scored.capabilityKey,
      sourceCapabilityId: canonicalCapabilityId(
        card.cardDefinitionId,
        scored.capabilityKey,
      ),
      damageAmount: scored.damageAmount,
    };
  }
  return taggedMeatDamageProfile(definitionId, "agenda");
}

export function corpInstalledTaggedMeatDamageProfile(
  definitionId: number | undefined,
): CorpTaggedMeatDamageProfile | undefined {
  const card = planningCard(definitionId);
  if (
    card?.side !== "corp" ||
    (card.cardType !== "asset" && card.cardType !== "upgrade")
  )
    return undefined;
  const direct = card.engine.uniqueDirectLongtail;
  if (direct?.kind === "tagged_meat_damage") {
    return {
      capabilityKey: direct.capabilityKey,
      sourceCapabilityId: canonicalCapabilityId(
        card.cardDefinitionId,
        direct.capabilityKey,
      ),
      damageAmount: direct.damageAmount,
      agendaPointCost: direct.agendaPointCost,
    };
  }
  return taggedMeatDamageProfile(definitionId, card.cardType);
}

function taggedMeatDamageProfile(
  definitionId: number | undefined,
  cardType: "operation" | "agenda" | "asset" | "upgrade",
): CorpTaggedMeatDamageProfile | undefined {
  const planning = planningCard(definitionId);
  if (
    planning?.side !== "corp" ||
    planning.cardType !== cardType
  ) {
    return undefined;
  }
  const profiles = (planning.engine.abilities ?? []).flatMap(
    (ability) => {
      if (cardType === "operation") {
        if (ability.kind !== "on_play") return [];
      } else if (
        ability.kind !== "activated" ||
        ability.timing !== "corp_main"
      ) {
        return [];
      }
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
                  planning.cardDefinitionId,
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
  definitionId: number | undefined,
): CorpTaggedDamagePayoffProfile | undefined {
  const planning = planningCard(definitionId);
  const payoff = planning?.engine.uniqueDirectLongtail;
  if (
    planning?.side !== "corp" ||
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

/** Guaranteed placement on one target from a plain unconditional operation.
 * Distinct-target distribution contributes at most one counter to that agenda. */
export function corpGuaranteedOnPlayAdvancementCountersPerTarget(
  definitionId: number | undefined,
): number {
  const card = planningCard(definitionId);
  if (card?.side !== "corp" || card.cardType !== "operation")
    return 0;
  const abilities = card.engine.abilities;
  if (abilities?.length !== 1) return 0;
  const ability = abilities[0]!;
  if (
    ability.kind !== "on_play" ||
    ability.costs !== "printed" ||
    ability.condition !== undefined ||
    ability.effects.length !== 1
  )
    return 0;
  const effect = ability.effects[0]!;
  if (
    effect.kind !== "distribute_advancement_counters" ||
    effect.target !== "installed_advanceable_cards" ||
    !positiveSafeInteger(effect.amount)
  )
    return 0;
  return effect.distribution === "up_to_distinct_targets_one_each"
    ? 1
    : effect.amount;
}

export function corpScoreConversionProfile(
  definitionId: number | undefined,
): CorpScoreConversionProfile | undefined {
  const planning = planningCard(definitionId);
  if (planning?.side !== "corp") return undefined;
  const effectKinds = new Set(
    (planning.engine.abilities ?? []).flatMap((ability) =>
      ability.effects.map((effect) => effect.kind),
    ),
  );
  const profile = {
    movesAdvancementCounters: effectKinds.has("move_advancement_counters"),
    placesAdvancementCounters: effectKinds.has(
      "distribute_advancement_counters",
    ),
    gainsCorpActions: (planning.engine.abilities ?? []).some(
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

function planningCard(definitionId: number | undefined) {
  return definitionId
    ? planningCardByDefinitionId(definitionId)
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
