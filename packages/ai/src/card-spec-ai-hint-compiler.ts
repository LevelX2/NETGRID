import aiSupportScenarioData from "../../../data/scenarios/card-support-ai-supported-current.json";
import {
  KNOWN_HINT_LINE_SUPPORT,
  KNOWN_HINT_BREAKER_COVERAGES,
  KNOWN_HINT_REMOTE_ROLE_KINDS,
  KNOWN_HINT_STRATEGIC_EXCHANGE_KINDS,
  KNOWN_HINT_STRATEGY_SUPPORT_PAIR_ROLES,
  KNOWN_HINT_TARGET_PROFILE_AVOIDS,
  KNOWN_HINT_TARGET_PROFILE_PREFERENCES,
  type KnownHintStrategySupportPairRole,
} from "./hint-ontology";
import {
  cardSpecPlanningCards,
  KNOWN_PLANNING_TACTIC_SIGNALS,
  KNOWN_PLANNING_TACTIC_USES,
} from "@netgrid/cards/planning";
import type { PlanningInterpretation } from "@netgrid/cards/planning";
import {
  CARD_SPEC_AI_HINT_COMPILER_VERSION,
  type AiCardHint,
  type AiRuntimeValueHints,
} from "./ai-hint-contracts";

export {
  CARD_SPEC_AI_HINT_COMPILER_VERSION,
  type AiCardHint,
  type AiRuntimeValueHintKey,
  type AiRuntimeValueHints,
} from "./ai-hint-contracts";

const CARD_SPEC_HINT_ENGINE_FIELDS = new Set([
  "schemaVersion",
  "characteristics",
  "corpRootRezCreditOutcome",
  "abilities",
  "accessEffects",
  "agendaAccessReplacement",
  "advanceable",
  "corpUtility",
  "damagePreventionSources",
  "fortRunWindows",
  "hardwareDeck",
  "icebreakerAbilities",
  "icebreakerEncounterStrengthBonus",
  "icebreakerSubtypeChange",
  "installCapabilities",
  "installTargetBinding",
  "lifecycle",
  "modifiers",
  "printedSubroutines",
  "restrictedHostedCreditSource",
  "runnerCounterEffects",
  "runnerEventLongtail",
  "runnerUtilityLongtail",
  "scoredAgenda",
  "selfRezAdditionalCosts",
  "selfRezCostModifiers",
  "successfulRunFollowups",
  "tagPreventionSources",
  "unique",
  "variableRez",
]);

export function deriveCardSpecAiHint(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): AiCardHint {
  for (const field of Object.keys(entry.planning.engine))
    if (!CARD_SPEC_HINT_ENGINE_FIELDS.has(field))
      throw new Error(`card_spec_hint_unsupported_family: ${field}`);
  const annotations = entry.planning.planningAnnotations?.card ?? [];
  const planRoles = [
    ...new Set([
      ...annotations.flatMap((annotation) =>
        annotation.kind === "plan_role" ? [annotation.role] : [],
      ),
      ...derivedMechanicalPlanRoles(entry),
    ]),
  ];
  const strategicRole = annotations.flatMap((annotation) =>
    annotation.kind === "strategic_role" ? [annotation.role] : [],
  );
  const strategyAnchors = annotations.flatMap((annotation) =>
    annotation.kind === "strategy_anchor" ? [annotation.strategyKey] : [],
  );
  const lineSupport = closedPlanningValues(
    annotations.flatMap((annotation) =>
      annotation.kind === "line_support" ? [annotation.lineKey] : [],
    ),
    KNOWN_HINT_LINE_SUPPORT,
    "line_support",
  );
  const strategicExchangeKinds = closedPlanningValues(
    annotations.flatMap((annotation) =>
      annotation.kind === "strategic_exchange" ? [annotation.exchange] : [],
    ),
    KNOWN_HINT_STRATEGIC_EXCHANGE_KINDS,
    "strategic_exchange",
  );
  const remoteRoleAnnotation = annotations.find(
    (annotation) => annotation.kind === "remote_role",
  );
  const valueHints: AiRuntimeValueHints = {};
  for (const annotation of annotations)
    if (annotation.kind === "value_interpretation")
      valueHints[valueHintKey(annotation.axis)] =
        annotation.rating === "low"
          ? 1
          : annotation.rating === "medium"
            ? 2
            : annotation.rating === "high"
              ? 3
              : annotation.rating === "very_high"
                ? 4
                : 5;
  Object.assign(valueHints, deriveMechanicalValueHints(entry.planning.engine));
  const strategySupportPairs = annotations
    .filter(
      (
        annotation,
      ): annotation is Extract<
        PlanningInterpretation,
        { kind: "strategy_support" }
      > => annotation.kind === "strategy_support",
    )
    .map((annotation) => ({
      strategyId: annotation.strategyKey,
      role: strategySupportRole(annotation.role),
      roleDetail: annotation.roleDetail,
      evidence: derivedStrategyEvidence(
        entry.planning.engine,
        annotation.strategyKey,
      ),
      confidence: annotation.confidence,
      ...(annotation.rationale === undefined
        ? {}
        : { rationale: annotation.rationale }),
    }));
  const capabilityStrategySupportPairs = (
    entry.planning.planningAnnotations?.capabilities ?? []
  ).flatMap((capability) =>
    capability.annotations.flatMap((annotation) =>
      annotation.kind !== "strategy_support"
        ? []
        : [
            {
              strategyId: annotation.strategyKey,
              role: strategySupportRole(annotation.role),
              roleDetail: annotation.roleDetail,
              evidence: derivedActionStrategyEvidence(
                entry.planning.engine,
                capability.capabilityKey,
                annotation.strategyKey,
                strategySupportRole(annotation.role),
                annotation.roleDetail,
                annotation.evidenceAnchor,
              ),
              confidence: annotation.confidence,
              ...(annotation.rationale === undefined
                ? {}
                : { rationale: annotation.rationale }),
            },
          ],
    ),
  );
  const targetProfiles = deriveTargetProfiles(entry);
  const breakerProfile = deriveBreakerProfile(entry.planning.engine);
  const actionCapacityProfiles = deriveActionCapacityProfiles(
    entry.planning.engine,
  );
  const effects = deriveHintEffects(entry);
  const functionSignals = derivedFunctionSignals(entry);
  const tacticSignals = derivedTacticSignals(entry);
  const actionTacticSignals = deriveActionTacticSignals(entry, effects);
  const conditions = deriveConditions(entry);
  const costProfile = deriveCostProfile(annotations, entry);
  const riskTags = deriveRiskTags(annotations, entry);
  const roles = deriveRoles(entry);
  const evidence = deriveAiSupportEvidence(entry);
  const hint = {
    cardId: entry.definition.id,
    side: entry.definition.side,
    cardType: entry.definition.type,
    aiSupportStatus: evidence.status,
    roles,
    planRoles,
    valueHints,
    ...(strategicRole.length === 0 ? {} : { strategicRole }),
    ...(strategyAnchors.length === 0 ? {} : { strategyAnchors }),
    ...(lineSupport.length === 0 ? {} : { lineSupport }),
    ...(strategicExchangeKinds.length === 0 ? {} : { strategicExchangeKinds }),
    ...(strategySupportPairs.length === 0 ? {} : { strategySupportPairs }),
    ...(capabilityStrategySupportPairs.length > 0
      ? { actionStrategySupportPairs: capabilityStrategySupportPairs }
      : strategySupportPairs.length > 0 &&
          entry.planning.engine.abilities?.some(
            (ability) => ability.kind === "on_play",
          ) === true
        ? { actionStrategySupportPairs: strategySupportPairs }
        : {}),
    ...(targetProfiles.length === 0 ? {} : { targetProfiles }),
    ...(breakerProfile === undefined ? {} : { breakerProfile }),
    ...(actionCapacityProfiles.length === 0 ? {} : { actionCapacityProfiles }),
    ...(effects.length === 0 ? {} : { effects }),
    ...(functionSignals.length === 0 ? {} : { functionSignals }),
    ...(tacticSignals.length === 0 ? {} : { tacticSignals }),
    ...(actionTacticSignals.length === 0 ? {} : { actionTacticSignals }),
    ...(conditions.length === 0 ? {} : { conditions }),
    ...(costProfile === undefined ? {} : { costProfile }),
    ...(riskTags.length === 0 ? {} : { riskTags }),
    quality: evidence.quality,
    scenarioRefs: evidence.scenarioRefs,
    ...(remoteRoleAnnotation?.kind === "remote_role"
      ? {
          remoteRole: {
            kind: closedPlanningValue(
              remoteRoleAnnotation.role,
              KNOWN_HINT_REMOTE_ROLE_KINDS,
              "remote_role",
            ),
            threatLevel: remoteRoleAnnotation.threatLevel,
            serverScope:
              entry.definition.type === "upgrade" ? "remote" : "server",
          },
        }
      : {}),
    requiredMechanics: deriveRequiredMechanics(entry),
  } satisfies AiCardHint;
  return hint;
}

function derivedMechanicalPlanRoles(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): string[] {
  const closedExtended = usesClosedExtendedMechanicalProfile(entry);
  if (!usesExtendedMechanicalSemantics(entry) && !closedExtended) return [];
  const engine = entry.planning.engine;
  const roles = new Set<string>();
  if (
    closedExtended
      ? engine.scoredAgenda !== undefined ||
        engine.agendaAccessReplacement?.kind === "install_as_runner_program"
      : engine.scoredAgenda !== undefined
  )
    roles.add("score_agenda");
  if (
    engine.icebreakerAbilities !== undefined &&
    engine.installTargetBinding === undefined &&
    engine.icebreakerEncounterStrengthBonus === undefined &&
    engine.icebreakerSubtypeChange === undefined &&
    entry.planning.planningAnnotations?.card?.some(
      (annotation) =>
        annotation.kind === "tactic_interpretation" &&
        annotation.use === "coverage.breaker",
    ) === true
  )
    roles.add("break_ice");
  if (
    !closedExtended &&
    engine.abilities?.some((ability) =>
      ability.effects?.some((effect) => effect.kind === "draw_cards"),
    )
  )
    roles.add("draw");
  if (
    closedExtended &&
    (engine.corpUtility?.kind ===
      "draw_corp_cards_then_shuffle_hq_card_into_rd" ||
      engine.scoredAgenda?.kind === "corp_start_turn_mandatory_draw")
  )
    roles.add("draw");
  if (
    engine.abilities?.some((ability) =>
      ability.effects?.some((effect) => effect.kind === "remove_tags"),
    )
  )
    roles.add("recover_from_tags");
  if (
    engine.hardwareDeck === true ||
    engine.runnerUtilityLongtail?.kind === "base_memory_equals_grip_count"
  )
    roles.add("runner_install_hardware");
  if (
    engine.restrictedHostedCreditSource?.usableFor.includes("increase_link") &&
    entry.definition.type === "resource"
  )
    roles.add("increase_link");
  return [...roles];
}

function deriveActionCapacityProfiles(
  engine: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"],
): NonNullable<AiCardHint["actionCapacityProfiles"]> {
  return (engine.tagPreventionSources ?? []).flatMap((source) => {
    if (source.cost.kind !== "credit_and_forgo_next_action") return [];
    if (source.kind !== "avoid_tag" || source.amount !== 1)
      throw new Error("card_spec_unknown_action_debt_tag_prevention_shape");
    return [
      {
        class: "action_debt" as const,
        timing: "prevention_window" as const,
        recipient: "runner" as const,
        restriction: "unrestricted" as const,
        reliability: "guaranteed" as const,
        sourceResource: "replacement_effect" as const,
        expiresAt: "debt_paid" as const,
        amount: 1,
        amountKind: "fixed" as const,
        bankable: false,
        repeatable: true,
      },
    ];
  });
}

function strategySupportRole(value: string): KnownHintStrategySupportPairRole {
  const role = KNOWN_HINT_STRATEGY_SUPPORT_PAIR_ROLES.find(
    (candidate) => candidate === value,
  );
  if (role === undefined)
    throw new Error(`card_spec_unknown_strategy_support_role: ${value}`);
  return role;
}

function closedPlanningValue<const Values extends readonly string[]>(
  value: string,
  allowed: Values,
  field: string,
): Values[number] {
  const result = allowed.find((candidate) => candidate === value);
  if (result === undefined)
    throw new Error(`card_spec_unknown_${field}: ${value}`);
  return result;
}

function closedPlanningValues<const Values extends readonly string[]>(
  values: readonly string[],
  allowed: Values,
  field: string,
): Values[number][] {
  return values.map((value) => closedPlanningValue(value, allowed, field));
}

function deriveRequiredMechanics(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): string[] {
  if (usesClosedExtendedMechanicalProfile(entry))
    return deriveExtendedRequiredMechanics(entry);
  const mechanics = new Set(entry.definition.mechanics);
  const normalizeGenericMechanics = usesGenericCompatibilityMechanics(entry);
  if (normalizeGenericMechanics)
    for (const internal of [
      "abilities",
      "corpRootRezCreditOutcome",
      "on_play",
      "printedSubroutines",
    ])
      mechanics.delete(internal);
  if (isSimpleBreaker(entry))
    for (const internal of [
      "break_subroutine",
      "credit",
      "ice_subtype",
      "icebreakerAbilities",
      "increase_strength",
    ])
      mechanics.delete(internal);
  if (hasGenericOnPlayEffect(entry))
    for (const internal of [
      "chosen_server",
      "gain_credits",
      "runner_is_tagged",
    ])
      mechanics.delete(internal);
  if (entry.definition.type === "identity") mechanics.add("identity_setup");
  if (
    entry.definition.type === "agenda" &&
    entry.planning.engine.scoredAgenda === undefined
  ) {
    mechanics.delete("score_agenda");
    mechanics.add("score");
    mechanics.add("steal");
    mechanics.add("advancement_requirement");
    mechanics.add("agenda_points");
  }
  if (
    entry.planning.engine.characteristics.memoryLimitBonus !== undefined ||
    isSimpleBreaker(entry)
  )
    mechanics.add("memory");
  if (
    entry.planning.engine.corpRootRezCreditOutcome !== undefined ||
    (entry.definition.type === "upgrade" && normalizeGenericMechanics)
  )
    mechanics.add("trash_cost");
  if (isSimpleBreaker(entry) || isSimplePrintedIce(entry))
    for (const subtype of entry.definition.subtypes)
      mechanics.add(`subtype_${subtype}`);
  if (isSimplePrintedIce(entry))
    for (const subroutine of entry.planning.engine.printedSubroutines ?? [])
      mechanics.add(subroutine.kind);
  if (
    entry.definition.type === "resource" &&
    entry.definition.subtypes.includes("connection")
  )
    mechanics.add("resource_tag_interaction");
  for (const ability of entry.planning.engine.abilities ?? []) {
    if (
      Array.isArray(ability.costs) &&
      ability.costs.some((cost) => cost.kind === "action")
    )
      mechanics.add("take_click_ability");
    for (const effect of ability.effects ?? []) {
      if (
        (normalizeGenericMechanics && effect.kind === "gain_credits") ||
        (normalizeGenericMechanics && effect.kind === "draw_cards") ||
        (normalizeGenericMechanics && effect.kind === "make_run") ||
        (normalizeGenericMechanics && effect.kind === "lose_credits")
      )
        mechanics.delete(effect.kind);
      if (effect.kind === "add_hosted_credits") {
        mechanics.add("gain_credit");
        mechanics.add("bit_depot");
      }
      if (effect.kind === "take_hosted_credits") mechanics.add("bit_depot");
      if (effect.kind === "make_run" && !normalizeGenericMechanics) {
        mechanics.add("start_run");
        if ((effect.successfulRunRunnerCreditGain ?? 0) > 0)
          mechanics.add("successful_run_credit_gain");
      }
    }
  }
  return [...mechanics].sort();
}

function usesClosedExtendedMechanicalProfile(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): boolean {
  const engine = entry.planning.engine;
  const simpleReviewedBreaker =
    isSimpleBreaker(entry) &&
    entry.planning.planningAnnotations?.card?.some(
      (annotation) =>
        annotation.kind === "tactic_interpretation" &&
        annotation.use === "coverage.breaker",
    ) === true;
  return (
    simpleReviewedBreaker ||
    engine.agendaAccessReplacement?.kind === "install_as_runner_program" ||
    engine.corpUtility !== undefined ||
    engine.damagePreventionSources !== undefined ||
    engine.hardwareDeck === true ||
    engine.restrictedHostedCreditSource !== undefined ||
    engine.runnerCounterEffects !== undefined ||
    engine.runnerEventLongtail !== undefined ||
    engine.runnerUtilityLongtail !== undefined ||
    engine.selfRezAdditionalCosts !== undefined ||
    engine.selfRezCostModifiers !== undefined ||
    engine.successfulRunFollowups !== undefined ||
    engine.tagPreventionSources !== undefined ||
    engine.scoredAgenda?.kind === "add_counters_on_score" ||
    engine.scoredAgenda?.kind ===
      "purge_runner_virus_counters_and_prevent_next" ||
    engine.scoredAgenda?.kind === "corp_start_turn_mandatory_draw" ||
    engine.modifiers?.some((modifier) =>
      ["break_subroutine_cost", "hand_size", "memory_units"].includes(
        modifier.kind,
      ),
    ) === true ||
    engine.printedSubroutines?.some((subroutine) =>
      [
        "random_damage",
        "trace",
        "prohibit_break_next_ice",
        "trash_program",
        "deflect_run",
        "end_the_run_and_trash_source_at_end_of_turn",
      ].includes(subroutine.kind),
    ) === true ||
    engine.abilities?.some(
      (ability) =>
        (Array.isArray(ability.costs) &&
          ability.costs.some(
            (cost) => cost.kind === "action" && cost.amount > 1,
          )) ||
        additionalClickAmount(ability.costs) === 1 ||
        ability.effects?.some((effect) =>
          [
            "double_chosen_ice_strength_until_end_of_turn",
            "private_look",
            "remove_tags",
            "transfer_hosted_credits",
          ].includes(effect.kind),
        ) ||
        ability.effects?.some(
          (effect) =>
            effect.kind === "make_run" &&
            (effect.successfulRunAccessReplacement !== undefined ||
              effect.corpRezCostSurcharge !== undefined),
        ),
    ) === true ||
    engine.accessEffects?.some((access) =>
      access.effects.some((effect) =>
        [
          "trash_other_corp_installed_cards_in_source_server_and_damage_runner",
          "trash_installed_runner_hardware_and_programs",
        ].includes(effect.kind),
      ),
    ) === true
  );
}

function deriveExtendedRequiredMechanics(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): string[] {
  const engine = entry.planning.engine;
  const mechanics = new Set<string>();
  const cardType = entry.definition.type;
  if (cardType === "agenda") mechanics.add("score_agenda");
  if (cardType === "asset") {
    mechanics.add("install_asset");
    mechanics.add("rez_card");
  }
  if (cardType === "event") mechanics.add("play_event");
  if (cardType === "hardware") mechanics.add("install_hardware");
  if (cardType === "ice") {
    mechanics.add("install_ice");
    mechanics.add("rez_ice");
    mechanics.add("encounter_ice");
  }
  if (cardType === "operation") mechanics.add("play_operation");
  if (cardType === "program") mechanics.add("install_program");
  if (cardType === "resource") mechanics.add("install_resource");
  if (cardType === "upgrade") mechanics.add("rez_card");
  if (
    (cardType === "asset" || cardType === "upgrade") &&
    engine.characteristics.numeric.trashCost !== null
  )
    mechanics.add("trash_on_access");

  if (engine.scoredAgenda?.kind === "add_counters_on_score")
    for (const token of ["scored_counter", "corp_during_run_paid_ability"])
      mechanics.add(token);
  if (
    engine.scoredAgenda?.kind === "purge_runner_virus_counters_and_prevent_next"
  )
    for (const token of [
      "purge_runner_virus_counters",
      "virus_counter_prevention",
    ])
      mechanics.add(token);
  if (engine.scoredAgenda?.kind === "corp_start_turn_mandatory_draw")
    for (const token of ["start_turn_trigger", "draw_cards"])
      mechanics.add(token);
  if (engine.agendaAccessReplacement?.kind === "install_as_runner_program")
    for (const token of [
      "agenda_access_replacement",
      "install_as_runner_program",
      "runner_score_action",
      "remove_from_game_on_leave_play",
    ])
      mechanics.add(token);

  for (const ability of engine.abilities ?? []) {
    if (ability.kind === "activated") mechanics.add("activated_ability");
    if (
      Array.isArray(ability.costs) &&
      ability.costs.some((cost) => cost.kind === "action" && cost.amount > 1)
    )
      mechanics.add("double_action_cost");
    if (additionalClickAmount(ability.costs) === 1)
      mechanics.add("double_action_cost");
    for (const cost of Array.isArray(ability.costs) ? ability.costs : []) {
      if (cost.kind === "credit") mechanics.add("credit_cost");
      if (cost.kind === "tap_source")
        for (const token of ["paid_tap_ability", "tap_source"])
          mechanics.add(token);
      if (cost.kind === "trash_source") mechanics.add("trash_source");
      if (cost.kind === "source_counter") mechanics.add("source_counter_cost");
    }
    for (const effect of ability.effects ?? []) {
      if (effect.kind === "draw_cards") mechanics.add("draw_cards");
      if (effect.kind === "gain_credits") mechanics.add("gain_credits");
      if (effect.kind === "make_run") mechanics.add("start_run");
      if (
        effect.kind === "make_run" &&
        effect.successfulRunAccessReplacement !== undefined
      )
        for (const token of [
          "successful_run_access_replacement",
          "reveal_cards_until_agenda",
          "move_card_to_hq",
        ])
          mechanics.add(token);
      if (
        effect.kind === "make_run" &&
        effect.corpRezCostSurcharge !== undefined
      )
        mechanics.add("run_duration_rez_cost_surcharge");
      if (effect.kind === "remove_tags") mechanics.add("remove_tags");
      if (effect.kind === "end_run") mechanics.add("end_run");
      if (effect.kind === "private_look") {
        mechanics.add(
          effect.zone === "hq" ? "private_hq_look" : "private_rnd_top_look",
        );
      }
      if (effect.kind === "double_chosen_ice_strength_until_end_of_turn")
        for (const token of ["target_rezzed_ice", "temporary_ice_strength"])
          mechanics.add(token);
      if (effect.kind === "score_source_as_agenda")
        mechanics.add("runner_score_action");
      if (effect.kind === "transfer_hosted_credits")
        mechanics.add("hosted_credit_transfer");
    }
  }

  for (const subroutine of engine.printedSubroutines ?? []) {
    if (subroutine.kind === "damage")
      mechanics.add("printed_subroutine_damage");
    if (subroutine.kind === "random_damage")
      for (const token of [
        "printed_random_damage",
        "random_die_resolution",
        "core_damage",
      ])
        mechanics.add(token);
    if (subroutine.kind === "trace") mechanics.add("trace");
    if (subroutine.kind === "end_the_run") mechanics.add("end_the_run");
    if (subroutine.kind === "end_the_run_and_trash_source_at_end_of_turn")
      for (const token of ["end_the_run", "delayed_turn_end_trash"])
        mechanics.add(token);
    if (subroutine.kind === "trash_program")
      mechanics.add("trash_installed_program");
    if (subroutine.kind === "prohibit_break_next_ice")
      mechanics.add("next_encounter_no_break_subroutines");
    if (subroutine.kind === "deflect_run") {
      mechanics.add("deflect_run");
      mechanics.add("encounter_reposition");
      if (subroutine.cost !== undefined)
        mechanics.add("paid_subroutine_choice");
      if (subroutine.autoBreakIfNoTarget === true)
        mechanics.add("auto_break_without_target");
    }
  }
  for (const install of engine.installCapabilities ?? [])
    if (
      install.kind === "install_not_on_archives" ||
      install.kind === "install_only_in_hq_or_rd" ||
      install.kind === "install_only_inside_subsidiary_data_fort"
    )
      mechanics.add("install_restriction");
  if (engine.selfRezCostModifiers !== undefined)
    mechanics.add("sleepy_noisy_rez_discount");
  if (engine.selfRezAdditionalCosts !== undefined)
    mechanics.add("agenda_point_rez_cost");
  for (const window of engine.fortRunWindows ?? [])
    if (window.kind === "move_self_to_outermost_position_on_other_fort")
      mechanics.add("start_run_ice_move");
  if (engine.runnerCounterEffects !== undefined)
    for (const token of [
      "runner_counter",
      "run_start_counter_damage",
      "runner_counter_removal",
    ])
      mechanics.add(token);
  if (engine.characteristics.subtypes.includes("region"))
    mechanics.add("region_upgrade");
  for (const subtype of engine.characteristics.subtypes)
    mechanics.add(`subtype_${subtype}`);
  if (engine.unique !== undefined) mechanics.add("unique");
  for (const modifier of engine.modifiers ?? []) {
    if (modifier.kind === "break_subroutine_cost")
      mechanics.add("break_subroutine_cost_modifier");
    if (modifier.kind === "hand_size") mechanics.add("hand_size_modifier");
    if (modifier.kind === "memory_units") mechanics.add("memory_modifier");
  }

  const utilityKind = engine.corpUtility?.kind;
  if (utilityKind === "runner_memory_limit_modifier_until_end_of_turn")
    for (const token of [
      "runner_is_tagged",
      "temporary_memory_limit_modifier",
      "trash_installed_program_if_over_memory",
    ])
      mechanics.add(token);
  if (utilityKind === "draw_corp_cards_then_shuffle_hq_card_into_rd")
    for (const token of [
      "draw_cards",
      "shuffle_hq_to_rd",
      "double_action_cost",
    ])
      mechanics.add(token);
  if (utilityKind === "corp_archives_to_hq")
    for (const token of ["archives_to_hq", "reveal", "double_action_cost"])
      mechanics.add(token);
  if (utilityKind === "corp_start_turn_tag_roll_per_runner_run_last_turn")
    for (const token of [
      "corp_start_turn",
      "random_die_resolution",
      "add_tags",
      "run_attempt_count",
    ])
      mechanics.add(token);
  if (utilityKind === "corp_draw_extra_then_bottom_one")
    for (const token of ["corp_draw_replacement", "extra_draw", "bottom_rd"])
      mechanics.add(token);
  if (utilityKind === "run_start_tax_runner_tags")
    for (const token of ["run_start_tax", "runner_tags", "same_fort"])
      mechanics.add(token);
  if (engine.successfulRunFollowups !== undefined)
    for (const token of [
      "successful_run_trigger",
      "shuffle_grip_into_stack",
      "draw_cards",
    ])
      mechanics.add(token);

  for (const access of engine.accessEffects ?? []) {
    mechanics.add("access_effect");
    if (access.condition?.kind === "runner_tags_at_least")
      mechanics.add("runner_tags_at_least");
    for (const effect of access.effects) {
      if (
        effect.kind ===
        "trash_other_corp_installed_cards_in_source_server_and_damage_runner"
      )
        for (const token of [
          "trash_installed_corp_cards",
          "net_damage",
          "tap_source",
        ])
          mechanics.add(token);
      if (effect.kind === "trash_installed_runner_hardware_and_programs")
        for (const token of ["trash_hardware", "trash_programs"])
          mechanics.add(token);
    }
  }

  const breakAbility = engine.icebreakerAbilities?.find(
    (ability) => ability.kind === "break_subroutine",
  );
  const pumpAbility = engine.icebreakerAbilities?.find(
    (ability) => ability.kind === "increase_strength",
  );
  if (breakAbility?.kind === "break_subroutine") {
    mechanics.add("pump_icebreaker_strength");
    if (breakAbility.matches.kind === "any")
      mechanics.add("break_any_subroutine");
    if (breakAbility.matches.kind === "ice_subtype")
      mechanics.add(
        `break_${breakerCoverageForSubtype(breakAbility.matches.subtype)}_subroutine`,
      );
    if (
      breakAbility.special?.kind ===
      "once_per_run_break_tag_and_all_stealth_loss"
    )
      for (const token of ["tag_self", "stealth_credit_loss"])
        mechanics.add(token);
    if (breakAbility.special?.kind === "run_end_trash_source_if_used")
      mechanics.add("run_end_self_trash");
  }
  if (
    pumpAbility?.kind === "increase_strength" &&
    pumpAbility.duration === "current_turn"
  )
    mechanics.add("run_duration_strength");

  const runnerUtilityKind = engine.runnerUtilityLongtail?.kind;
  if (runnerUtilityKind === "hq_access_expose_all_installed_corp_cards")
    for (const token of ["hq_access_trigger", "expose_installed_corp_cards"])
      mechanics.add(token);
  if (runnerUtilityKind === "derez_fully_broken_passed_ice")
    for (const token of [
      "fully_break_ice_window",
      "derez_ice",
      "paid_tap_ability",
      "tap_source",
    ])
      mechanics.add(token);
  if (runnerUtilityKind === "base_memory_equals_grip_count")
    mechanics.add("memory_limit_from_grip_size");
  if (runnerUtilityKind === "trace_attempts_auto_success_add_tag")
    for (const token of ["trace_attempt_modifier", "take_tag"])
      mechanics.add(token);
  if (runnerUtilityKind === "start_turn_random_effect_table")
    mechanics.add("random_start_turn_damage");
  if (runnerUtilityKind === "first_prep_credit_gain_bonus")
    mechanics.add("prep_credit_gain_bonus");

  for (const trigger of engine.lifecycle?.start_of_runner_turn ?? [])
    if (trigger.effects.some((effect) => effect.kind === "gain_credits"))
      mechanics.add("start_of_turn_credit");
  for (const effect of engine.lifecycle?.on_leave_play ?? []) {
    if (effect.kind === "lose_credits") mechanics.add("leave_play_credit_loss");
    if (effect.kind === "damage") mechanics.add("leave_play_damage");
  }

  const runnerEventKind = engine.runnerEventLongtail?.kind;
  if (runnerEventKind === "trash_grip_search_stack_to_grip_equal_count")
    for (const token of ["trash_grip", "search_stack", "shuffle_stack"])
      mechanics.add(token);
  if (runnerEventKind === "runner_corruption_agenda_point_transfer")
    for (const token of [
      "recent_stolen_agenda_gate",
      "score_area_transfer",
      "gain_credits",
      "take_tag",
    ])
      mechanics.add(token);
  if (runnerEventKind === "do_the_drine_unpreventable_core_damage_for_credits")
    for (const token of ["runner_choice", "brain_damage", "gain_credits"])
      mechanics.add(token);
  if (runnerEventKind === "three_dice_gain_credits")
    for (const token of ["random_die_resolution", "gain_credits"])
      mechanics.add(token);
  if (runnerEventKind === "library_search_run")
    for (const token of [
      "start_run",
      "successful_run_bonus_access",
      "no_noisy_icebreaker_or_trace_condition",
    ])
      mechanics.add(token);

  if (engine.hardwareDeck === true) mechanics.add("deck_unique_replacement");
  if (engine.unique !== undefined && cardType === "resource")
    mechanics.add("unique_resource");
  if (engine.restrictedHostedCreditSource !== undefined) {
    for (const token of ["restricted_credit_pool", "hosted_counters"])
      mechanics.add(token);
    if (engine.restrictedHostedCreditSource.usableFor.includes("play_events"))
      mechanics.add("play_event_payment");
    if (engine.restrictedHostedCreditSource.usableFor.includes("increase_link"))
      mechanics.add("trace_link_payment");
  }
  if (engine.damagePreventionSources !== undefined)
    mechanics.add("damage_prevention_turn_limit");
  if (engine.tagPreventionSources !== undefined)
    for (const token of ["prevent_tag", "future_action_debt", "credit_cost"])
      mechanics.add(token);
  return [...mechanics].sort();
}

function hasGenericOnPlayEffect(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): boolean {
  return (
    entry.planning.engine.abilities?.some(
      (ability) =>
        ability.kind === "on_play" &&
        ability.effects?.some((effect) =>
          ["gain_credits", "draw_cards", "make_run", "lose_credits"].includes(
            effect.kind,
          ),
        ),
    ) === true
  );
}

function isSimpleBreaker(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): boolean {
  return (
    entry.planning.engine.icebreakerAbilities !== undefined &&
    entry.planning.engine.installTargetBinding === undefined &&
    entry.planning.engine.icebreakerEncounterStrengthBonus === undefined &&
    entry.planning.engine.icebreakerSubtypeChange === undefined
  );
}

function isSimplePrintedIce(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): boolean {
  return (
    entry.planning.engine.printedSubroutines !== undefined &&
    entry.planning.engine.variableRez === undefined
  );
}

function isPlainRemoteValueUpgrade(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): boolean {
  return (
    entry.definition.type === "upgrade" &&
    entry.planning.engine.fortRunWindows === undefined &&
    (!usesClosedExtendedMechanicalProfile(entry) ||
      entry.planning.engine.accessEffects === undefined) &&
    entry.planning.planningAnnotations?.card?.some(
      (annotation) =>
        annotation.kind === "value_interpretation" &&
        annotation.axis === "remote_root_value",
    ) === true
  );
}

function usesGenericCompatibilityMechanics(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): boolean {
  return (
    entry.definition.type === "identity" ||
    (entry.definition.type === "agenda" &&
      entry.planning.engine.scoredAgenda === undefined) ||
    entry.planning.engine.characteristics.memoryLimitBonus !== undefined ||
    entry.planning.engine.corpRootRezCreditOutcome !== undefined ||
    isPlainRemoteValueUpgrade(entry) ||
    hasGenericOnPlayEffect(entry) ||
    isSimpleBreaker(entry) ||
    isSimplePrintedIce(entry)
  );
}

function usesExtendedMechanicalSemantics(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): boolean {
  const engine = entry.planning.engine;
  return (
    engine.agendaAccessReplacement !== undefined ||
    engine.corpUtility !== undefined ||
    engine.damagePreventionSources !== undefined ||
    engine.hardwareDeck !== undefined ||
    engine.restrictedHostedCreditSource !== undefined ||
    engine.runnerCounterEffects !== undefined ||
    engine.runnerEventLongtail !== undefined ||
    engine.runnerUtilityLongtail !== undefined ||
    engine.selfRezAdditionalCosts !== undefined ||
    engine.selfRezCostModifiers !== undefined ||
    engine.successfulRunFollowups !== undefined ||
    engine.tagPreventionSources !== undefined ||
    engine.unique !== undefined ||
    engine.characteristics.subtypes.includes("region") ||
    entry.planning.planningAnnotations?.card?.some(
      (annotation) =>
        annotation.kind === "tactic_interpretation" &&
        annotation.use === "coverage.breaker",
    ) === true ||
    engine.modifiers?.some((modifier) =>
      ["break_subroutine_cost", "hand_size", "memory_units"].includes(
        modifier.kind,
      ),
    ) === true ||
    engine.printedSubroutines?.some((subroutine) =>
      [
        "random_damage",
        "trace",
        "prohibit_break_next_ice",
        "trash_program",
        "deflect_run",
        "end_the_run_and_trash_source_at_end_of_turn",
      ].includes(subroutine.kind),
    ) === true ||
    engine.icebreakerAbilities?.some(
      (ability) =>
        (ability.kind === "break_subroutine" &&
          ability.special !== undefined) ||
        (ability.kind === "increase_strength" &&
          ability.duration === "current_turn"),
    ) === true ||
    engine.abilities?.some(
      (ability) =>
        (Array.isArray(ability.costs) &&
          ability.costs.some(
            (cost) => cost.kind === "action" && cost.amount > 1,
          )) ||
        ability.effects?.some(
          (effect) =>
            ![
              "gain_credits",
              "draw_cards",
              "make_run",
              "lose_credits",
            ].includes(effect.kind),
        ),
    ) === true
  );
}

function hasExtendedHintFamily(
  engine: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"],
): boolean {
  return (
    engine.agendaAccessReplacement !== undefined ||
    engine.corpUtility !== undefined ||
    engine.damagePreventionSources !== undefined ||
    engine.hardwareDeck !== undefined ||
    engine.restrictedHostedCreditSource !== undefined ||
    engine.runnerCounterEffects !== undefined ||
    engine.runnerEventLongtail !== undefined ||
    engine.runnerUtilityLongtail !== undefined ||
    engine.selfRezAdditionalCosts !== undefined ||
    engine.selfRezCostModifiers !== undefined ||
    engine.successfulRunFollowups !== undefined ||
    engine.tagPreventionSources !== undefined ||
    engine.unique !== undefined
  );
}

function deriveAiSupportEvidence(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): {
  status: AiCardHint["aiSupportStatus"];
  quality: NonNullable<AiCardHint["quality"]>;
  scenarioRefs: string[];
} {
  const scenario = aiSupportScenarioData.scenarios.find(
    (candidate) => candidate.id === "active_card_support_ai_supported",
  );
  if (
    aiSupportScenarioData.status !== "ai_supported" ||
    scenario === undefined ||
    !scenario.coversCards.includes(entry.definition.id)
  )
    throw new Error(
      `card_spec_ai_support_scenario_evidence_missing: ${entry.definition.id}`,
    );
  const confidence = highestStrategySupportConfidence(
    entry.planning.planningAnnotations?.card ?? [],
  );
  return {
    status: "ai_supported",
    quality: {
      hintReviewed: true,
      needsHumanReview: false,
      strategyCovered: confidence !== undefined,
      ...(confidence === undefined ? {} : { confidence }),
    },
    scenarioRefs: [
      `data/scenarios/card-support-ai-supported-current.json#${scenario.id}`,
    ],
  };
}

function highestStrategySupportConfidence(
  annotations: readonly PlanningInterpretation[],
): "low" | "medium" | "high" | undefined {
  const rank = { low: 0, medium: 1, high: 2 } as const;
  return annotations.reduce<"low" | "medium" | "high" | undefined>(
    (highest, annotation) =>
      annotation.kind === "strategy_support" &&
      (highest === undefined || rank[annotation.confidence] > rank[highest])
        ? annotation.confidence
        : highest,
    undefined,
  );
}

function deriveRoles(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): string[] {
  const roles = new Set<string>();
  const engine = entry.planning.engine;
  const cardType = entry.definition.type;
  if (cardType === "identity") {
    roles.add(`${entry.definition.side}_identity`);
    roles.add("setup");
  }
  if (
    cardType === "agenda" &&
    engine.scoredAgenda === undefined &&
    engine.agendaAccessReplacement === undefined
  ) {
    roles.add("agenda");
    roles.add("score_plan");
    if (entry.definition.agendaPoints !== undefined)
      roles.add(`agenda_${entry.definition.agendaPoints}pt`);
    roles.add("no_ability_agenda");
  }
  if (
    cardType === "hardware" &&
    engine.characteristics.memoryLimitBonus &&
    !usesExtendedMechanicalSemantics(entry)
  ) {
    roles.add("memory");
    roles.add("setup");
  }
  if (cardType === "upgrade" && isPlainRemoteValueUpgrade(entry)) {
    roles.add("remote_support");
    roles.add("upgrade");
  }
  if (engine.corpRootRezCreditOutcome !== undefined) {
    roles.add("asset_trash_target");
    roles.add("economy_asset");
  }
  for (const ability of engine.abilities ?? [])
    for (const effect of ability.effects ?? []) {
      if (effect.kind === "gain_credits") {
        roles.add("economy");
        roles.add(cardType);
        if (cardType === "operation") roles.add("economy_operation");
      }
      if (effect.kind === "draw_cards") {
        roles.add("draw");
        roles.add(cardType);
        if (cardType === "operation") roles.add("draw_operation");
      }
      if (effect.kind === "make_run") {
        roles.add(cardType);
        roles.add("run_pressure");
        if ((effect.successfulRunRunnerCreditGain ?? 0) >= 3)
          roles.add("economy");
      }
      if (
        effect.kind === "lose_credits" &&
        ability.condition?.kind === "runner_is_tagged"
      )
        roles.add("tag_punishment");
    }
  if (entry.planning.engine.icebreakerAbilities !== undefined) {
    roles.add("icebreaker");
    roles.add("program");
  }
  const breaker = entry.planning.engine.icebreakerAbilities?.find(
    (ability) => ability.kind === "break_subroutine",
  );
  if (breaker?.kind === "break_subroutine") {
    const coveredSubtypes =
      breaker.matches.kind === "ice_subtype"
        ? [breaker.matches.subtype]
        : breaker.matches.kind === "selected_ice_subtype"
          ? entry.planning.engine.installTargetBinding?.kind ===
            "choose_icebreaker_subtype_on_install"
            ? (entry.planning.engine.installTargetBinding.choices ?? [])
            : []
          : [];
    for (const subtype of coveredSubtypes) {
      const coverage = breakerCoverageForSubtype(subtype);
      if (coverage === "code_gate") roles.add("breaker_decoder");
      if (coverage === "sentry") roles.add("breaker_killer");
      if (coverage === "wall") roles.add("breaker_fracter");
    }
  }
  if (isSimpleBreaker(entry)) {
    const breakAbility = engine.icebreakerAbilities?.find(
      (ability) => ability.kind === "break_subroutine",
    );
    const pumpAbility = engine.icebreakerAbilities?.find(
      (ability) => ability.kind === "increase_strength",
    );
    if (
      breakAbility?.kind === "break_subroutine" &&
      pumpAbility?.kind === "increase_strength" &&
      breakAbility.cost.amount <= 1 &&
      pumpAbility.cost.amount <= 1 &&
      breakAbility.special === undefined
    )
      roles.add("efficient_breaker");
  }
  for (const modifier of entry.planning.engine.modifiers ?? [])
    if (modifier.kind === "rez_cost" || modifier.kind === "ice_strength") {
      roles.add("ice_modifier");
      roles.add("economy_asset");
      roles.add("remote_support");
    }
  for (const access of entry.planning.engine.accessEffects ?? []) {
    if (
      access.effects.some(
        (effect) =>
          (effect.kind === "damage" ||
            effect.kind === "damage_from_source_advancement_counters") &&
          effect.damageType === "net",
      )
    ) {
      roles.add("ambush");
      roles.add("net_damage");
    }
    if (access.visibility === "hidden_info_barrier") roles.add("hidden_zone");
  }
  if (
    entry.planning.engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) =>
          effect.kind === "add_hosted_credits" ||
          effect.kind === "take_hosted_credits",
      ),
    )
  )
    roles.add("economy");
  if (lifecycleHasCreditEffect(entry.planning.engine.lifecycle))
    for (const role of ["economy", "resource"]) roles.add(role);
  if (
    entry.planning.engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) => effect.kind === "choose_stack_or_trash_program_install",
      ),
    )
  ) {
    roles.add("hidden_zone_tool");
    roles.add("temporary_program_install");
  }
  for (const subroutine of entry.planning.engine.printedSubroutines ?? []) {
    roles.add("ice");
    if (subroutine.kind === "damage") roles.add("damage_ice");
    if (subroutine.kind === "end_the_run") roles.add("etr_ice");
    if (subroutine.kind === "give_runner_tag") roles.add("tag_ice");
    if (
      subroutine.kind === "runner_lose_credits" ||
      (subroutine.kind === "corp_gain_credit" && subroutine.amount >= 2)
    )
      roles.add("taxing_ice");
  }
  if (entry.definition.subtypes.includes("barrier")) roles.add("barrier_ice");
  if (entry.definition.subtypes.includes("code_gate"))
    roles.add("code_gate_ice");
  if (
    entry.planning.engine.printedSubroutines !== undefined &&
    entry.definition.subtypes.includes("sentry")
  )
    roles.add("sentry_ice");
  if (
    entry.planning.engine.scoredAgenda?.kind ===
    "score_install_hq_cards_into_new_remote_then_rez"
  )
    for (const role of ["corp", "agenda", "per_card_longtail"]) roles.add(role);
  if (
    entry.planning.engine.fortRunWindows?.some(
      (window) => window.kind === "server_run_start_restriction",
    ) === true
  )
    for (const role of ["upgrade", "advance", "agenda"]) roles.add(role);
  if (
    entry.planning.engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) =>
          effect.kind === "add_hosted_credits" ||
          effect.kind === "take_hosted_credits",
      ),
    )
  )
    for (const role of ["economy", "resource"]) roles.add(role);
  if (usesClosedExtendedMechanicalProfile(entry)) {
    if (
      hasExtendedHintFamily(engine) &&
      (cardType === "asset" ||
        cardType === "event" ||
        cardType === "operation" ||
        cardType === "hardware" ||
        cardType === "program" ||
        cardType === "resource")
    )
      roles.add(cardType);
  }
  if (usesClosedExtendedMechanicalProfile(entry)) {
    if (cardType === "agenda") roles.add("agenda");
    if (engine.scoredAgenda?.kind === "add_counters_on_score")
      for (const role of ["advanceable", "run_defense", "counter"])
        roles.add(role);
    if (
      engine.scoredAgenda?.kind ===
      "purge_runner_virus_counters_and_prevent_next"
    )
      roles.add("virus");
    if (engine.scoredAgenda?.kind === "corp_start_turn_mandatory_draw")
      roles.add("draw");
    if (engine.agendaAccessReplacement?.kind === "install_as_runner_program")
      for (const role of ["access_replacement", "runner_program"])
        roles.add(role);
    if (engine.successfulRunFollowups !== undefined)
      roles.add("remote_support");
    if (
      engine.corpUtility?.kind ===
      "runner_memory_limit_modifier_until_end_of_turn"
    )
      for (const role of [
        "memory_pressure",
        "program_trash",
        "tag_punishment_operation",
      ])
        roles.add(role);
    if (engine.corpUtility?.kind === "corp_archives_to_hq")
      roles.add("ice_recovery");
    if (
      engine.corpUtility?.kind ===
      "corp_start_turn_tag_roll_per_runner_run_last_turn"
    )
      roles.add("tag_punishment");
    if (engine.corpUtility?.kind === "run_start_tax_runner_tags")
      roles.add("tag_punishment");
    if (
      engine.accessEffects?.some((access) =>
        access.effects.some(
          (effect) =>
            effect.kind ===
            "trash_other_corp_installed_cards_in_source_server_and_damage_runner",
        ),
      )
    )
      for (const role of ["ambush", "net_damage"]) roles.add(role);
    if (
      engine.accessEffects?.some((access) =>
        access.effects.some(
          (effect) =>
            effect.kind === "trash_installed_runner_hardware_and_programs",
        ),
      )
    )
      for (const role of ["ambush", "tag_punishment"]) roles.add(role);
    if (engine.hardwareDeck === true) roles.add("deck");
    if (engine.tagPreventionSources !== undefined) roles.add("tag_prevention");
    if (engine.damagePreventionSources !== undefined)
      roles.add("damage_prevention");
    for (const subroutine of engine.printedSubroutines ?? []) {
      if (
        subroutine.kind === "damage" ||
        subroutine.kind === "random_damage" ||
        subroutine.kind === "trace"
      )
        roles.add("damage");
      if (subroutine.kind === "random_damage") roles.add("core_damage_ice");
      if (subroutine.kind === "prohibit_break_next_ice")
        roles.add("run_lock_ice");
      if (subroutine.kind === "trash_program") roles.add("program_trash_ice");
      if (subroutine.kind === "deflect_run") roles.add("taxing_ice");
      if (subroutine.kind === "end_the_run_and_trash_source_at_end_of_turn") {
        roles.add("etr_ice");
        roles.add("taxing_ice");
      }
    }
    if (
      engine.printedSubroutines !== undefined &&
      entry.definition.subtypes.includes("ap")
    )
      roles.add("ap_ice");
    if (
      engine.printedSubroutines !== undefined &&
      entry.definition.subtypes.includes("wall")
    )
      roles.add("barrier_ice");
    if (
      (engine.printedSubroutines ?? []).filter(
        (subroutine) => subroutine.kind === "end_the_run",
      ).length > 1
    )
      roles.add("taxing_ice");
    const breakerRoleAbility = engine.icebreakerAbilities?.find(
      (ability) => ability.kind === "break_subroutine",
    );
    if (breakerRoleAbility?.kind === "break_subroutine") {
      if (breakerRoleAbility.matches.kind === "any") {
        roles.add("universal_breaker");
        roles.add("self_trash");
      }
      if (
        breakerRoleAbility.special?.kind ===
        "once_per_run_break_tag_and_all_stealth_loss"
      )
        roles.add("noisy");
    }
    if (engine.unique !== undefined && cardType !== "resource")
      roles.add("unique");
    if (
      engine.scoredAgenda?.kind ===
      "purge_runner_virus_counters_and_prevent_next"
    )
      roles.add("virus");
    if (engine.scoredAgenda?.kind === "corp_start_turn_mandatory_draw")
      roles.add("draw");
    if (
      engine.corpUtility?.kind ===
      "draw_corp_cards_then_shuffle_hq_card_into_rd"
    )
      roles.add("draw_operation");
    if (engine.accessEffects?.some((access) => access.effects.length > 0))
      for (const role of ["ambush", "upgrade"]) roles.add(role);
    if (
      engine.accessEffects?.some((access) =>
        access.effects.some(
          (effect) =>
            effect.kind ===
            "trash_other_corp_installed_cards_in_source_server_and_damage_runner",
        ),
      )
    )
      roles.add("net_damage");
    if (
      engine.accessEffects?.some((access) =>
        access.effects.some(
          (effect) =>
            effect.kind === "trash_installed_runner_hardware_and_programs",
        ),
      )
    )
      roles.add("tag_punishment");
    const runnerUtility = engine.runnerUtilityLongtail?.kind;
    if (runnerUtility === "hq_access_expose_all_installed_corp_cards")
      for (const role of ["expose", "hq_access"]) roles.add(role);
    if (runnerUtility === "derez_fully_broken_passed_ice")
      for (const role of ["derez", "fully_broken_ice"]) roles.add(role);
    if (runnerUtility === "base_memory_equals_grip_count")
      for (const role of ["memory", "setup"]) roles.add(role);
    if (runnerUtility === "trace_attempts_auto_success_add_tag")
      for (const role of ["economy", "tag_self", "trace"]) roles.add(role);
    if (runnerUtility === "first_prep_credit_gain_bonus") roles.add("economy");
    const runnerEvent = engine.runnerEventLongtail?.kind;
    if (runnerEvent === "trash_grip_search_stack_to_grip_equal_count")
      for (const role of ["stack_search", "setup"]) roles.add(role);
    if (runnerEvent === "runner_corruption_agenda_point_transfer")
      for (const role of [
        "agenda_steal_followup",
        "high_risk_economy",
        "tag_self",
      ])
        roles.add(role);
    if (runnerEvent === "do_the_drine_unpreventable_core_damage_for_credits")
      for (const role of [
        "brain_damage_economy",
        "high_risk_economy",
        "choice",
      ])
        roles.add(role);
    if (runnerEvent === "three_dice_gain_credits")
      for (const role of ["economy", "deterministic_random"]) roles.add(role);
    if (runnerEvent === "library_search_run")
      for (const role of [
        "multiaccess",
        "run_event",
        "hq_pressure",
        "rd_pressure",
      ])
        roles.add(role);
    if (
      engine.abilities?.some((ability) =>
        ability.effects?.some((effect) => effect.kind === "make_run"),
      )
    ) {
      if (
        engine.abilities.some((ability) =>
          ability.effects?.some(
            (effect) =>
              effect.kind === "make_run" &&
              effect.successfulRunAccessReplacement !== undefined,
          ),
        )
      )
        for (const role of [
          "rd_pressure",
          "rd_access_replacement",
          "agenda_pressure",
        ])
          roles.add(role);
      if (
        engine.abilities.some((ability) =>
          ability.effects?.some(
            (effect) =>
              effect.kind === "make_run" &&
              effect.corpRezCostSurcharge !== undefined,
          ),
        )
      )
        for (const role of ["rez_tax", "run_event"]) roles.add(role);
      roles.delete("run_pressure");
    }
    if (
      engine.abilities?.some((ability) =>
        ability.effects?.some((effect) => effect.kind === "remove_tags"),
      )
    )
      roles.add("tag_removal");
    if (engine.hardwareDeck === true) roles.add("memory");
    if (
      engine.restrictedHostedCreditSource?.usableFor.includes(
        "using_icebreaker_during_run",
      )
    ) {
      roles.add("run_support");
      roles.add("recurring_credit");
    }
    if (
      engine.restrictedHostedCreditSource?.usableFor.length === 1 &&
      engine.restrictedHostedCreditSource.usableFor[0] === "increase_link"
    )
      for (const role of entry.definition.subtypes.includes("connection")
        ? ["connection", "economy", "link"]
        : ["link"])
        roles.add(role);
    if (
      engine.restrictedHostedCreditSource?.usableFor.includes("play_events")
    ) {
      roles.add("economy");
      roles.add("event_credit_host");
    }
    if (
      engine.abilities?.some((ability) =>
        ability.effects?.some((effect) => effect.kind === "private_look"),
      )
    )
      for (const role of [
        "resource",
        engine.abilities.some((ability) =>
          ability.effects?.some(
            (effect) => effect.kind === "private_look" && effect.zone === "hq",
          ),
        )
          ? "hq_access"
          : "rd_run_reward",
      ])
        roles.add(role);
    if (
      engine.abilities?.some((ability) =>
        ability.effects?.some(
          (effect) => effect.kind === "transfer_hosted_credits",
        ),
      )
    )
      for (const role of ["asset", "economy", "hosting"]) roles.add(role);
  }
  return [...roles];
}

function deriveRiskTags(
  annotations: readonly PlanningInterpretation[],
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): string[] {
  const risks = annotations.flatMap((annotation) =>
    annotation.kind === "risk_interpretation" ? [annotation.risk] : [],
  );
  if (
    entry.definition.type === "agenda" &&
    entry.planning.engine.scoredAgenda === undefined
  )
    risks.push("hidden_until_score_or_access");
  if (
    entry.planning.engine.abilities?.some((ability) =>
      ability.effects?.some((effect) => effect.kind === "make_run"),
    )
  )
    risks.push("run");
  if (
    entry.planning.engine.abilities?.some((ability) =>
      ability.effects?.some((effect) => effect.kind === "draw_cards"),
    )
  )
    risks.push("hidden_zone_change");
  if (isSimpleBreaker(entry)) risks.push("encounter");
  if (entry.definition.type === "hardware") risks.push("install_runner");
  if (
    entry.planning.engine.corpRootRezCreditOutcome !== undefined ||
    isPlainRemoteValueUpgrade(entry)
  )
    risks.push("hidden_root");
  if (isSimplePrintedIce(entry)) risks.push("hidden_ice");
  if (
    entry.planning.engine.printedSubroutines?.some(
      (subroutine) => subroutine.kind === "give_runner_tag",
    ) ||
    entry.planning.engine.abilities?.some(
      (ability) => ability.condition?.kind === "runner_is_tagged",
    )
  )
    risks.push("tag");
  if (hasHiddenInfoBarrier(entry.planning.engine))
    risks.push("hidden_info_barrier");
  if (
    entry.definition.type === "resource" &&
    entry.definition.subtypes.includes("connection")
  )
    risks.push("resource_trash_if_tagged");
  if (
    entry.planning.engine.lifecycle?.on_install?.some(
      (effect) => effect.kind === "gain_credits",
    )
  )
    risks.push("credit_swing");
  if (
    entry.planning.engine.lifecycle?.on_leave_play?.some(
      (effect) => effect.kind === "pay_credits_or_lose_game",
    )
  )
    risks.push("leave_play_penalty");
  if (
    entry.planning.engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) => effect.kind === "choose_stack_or_trash_program_install",
      ),
    )
  )
    risks.push("temporary_install");
  if ((entry.planning.engine.accessEffects?.length ?? 0) > 0)
    risks.push("access_window");
  if (
    entry.planning.engine.accessEffects?.some((access) =>
      access.effects.some(
        (effect) =>
          effect.kind === "damage" ||
          effect.kind === "damage_from_source_advancement_counters",
      ),
    )
  )
    risks.push("damage_window");
  if (
    entry.planning.engine.accessEffects?.some(
      (access) =>
        access.visibility === "hidden_info_barrier" ||
        access.effects.some(
          (effect) => effect.visibility === "hidden_info_barrier",
        ),
    )
  )
    risks.push("hidden_zone_barrier");
  if (usesClosedExtendedMechanicalProfile(entry))
    risks.push(...deriveClosedExtendedRiskTags(entry));
  return [...new Set(risks)];
}

function deriveClosedExtendedRiskTags(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): string[] {
  const engine = entry.planning.engine;
  const risks = new Set<string>();
  if (engine.scoredAgenda?.kind === "add_counters_on_score")
    for (const risk of ["public_counter", "scored_counter", "single_use"])
      risks.add(risk);
  if (
    engine.scoredAgenda?.kind === "purge_runner_virus_counters_and_prevent_next"
  )
    for (const risk of ["virus_meta", "temporary_prevention"]) risks.add(risk);
  if (engine.scoredAgenda?.kind === "corp_start_turn_mandatory_draw")
    risks.add("start_turn_trigger");
  if (engine.agendaAccessReplacement?.kind === "install_as_runner_program")
    for (const risk of [
      "access_replacement",
      "memory_pressure_for_runner",
      "remove_from_game",
      "runner_can_score_later",
    ])
      risks.add(risk);

  for (const subroutine of engine.printedSubroutines ?? []) {
    if (subroutine.kind === "damage" && subroutine.damageType === "net")
      risks.add("ap_damage");
    if (subroutine.kind === "trace") risks.add("trace");
    if (subroutine.kind === "prohibit_break_next_ice")
      risks.add("next_encounter_lock");
    if (subroutine.kind === "random_damage")
      for (const risk of ["deterministic_random", "core_damage"])
        risks.add(risk);
    if (subroutine.kind === "trash_program") risks.add("program_trash");
    if (subroutine.kind === "deflect_run") {
      risks.add("run_redirect");
      risks.add("target_fort_choice");
      if (subroutine.cost !== undefined) risks.add("corp_credit_cost");
    }
    if (subroutine.kind === "end_the_run_and_trash_source_at_end_of_turn")
      for (const risk of ["self_trash", "turn_end_delayed_effect"])
        risks.add(risk);
  }
  if (engine.selfRezCostModifiers !== undefined) risks.add("noisy_discount");
  if (engine.runnerCounterEffects !== undefined) risks.add("runner_counter");
  for (const install of engine.installCapabilities ?? []) {
    risks.add("install_restriction");
    if (install.kind === "install_not_on_archives")
      risks.add("archives_only_target");
    if (install.kind === "install_only_inside_subsidiary_data_fort")
      risks.add("subsidiary_target_only");
  }
  if (engine.selfRezAdditionalCosts !== undefined)
    risks.add("agenda_point_cost");
  if (engine.fortRunWindows !== undefined) risks.add("start_run_reposition");

  const utility = engine.corpUtility?.kind;
  if (utility === "runner_memory_limit_modifier_until_end_of_turn")
    for (const risk of ["memory_pressure", "program_trash", "tag_condition"])
      risks.add(risk);
  if (utility === "draw_corp_cards_then_shuffle_hq_card_into_rd")
    for (const risk of ["double_action", "hq_card_selection", "hidden_zone"])
      risks.add(risk);
  if (utility === "corp_archives_to_hq")
    for (const risk of [
      "archives_dependency",
      "double_action",
      "reveal_to_runner",
    ])
      risks.add(risk);
  if (utility === "corp_start_turn_tag_roll_per_runner_run_last_turn")
    for (const risk of ["tag", "random_effect"]) risks.add(risk);
  if (utility === "corp_draw_extra_then_bottom_one")
    for (const risk of ["hidden_zone", "draw_replacement", "unique"])
      risks.add(risk);
  if (utility === "run_start_tax_runner_tags")
    for (const risk of ["run_cost_modifier", "tag_synergy"]) risks.add(risk);
  if (engine.successfulRunFollowups !== undefined)
    for (const risk of ["hidden_zone", "successful_run"]) risks.add(risk);
  if (engine.characteristics.subtypes.includes("region"))
    for (const risk of ["run_cost_modifier", "region"]) risks.add(risk);

  for (const access of engine.accessEffects ?? []) {
    risks.add("hidden_zone");
    if (
      access.effects.some(
        (effect) =>
          effect.kind ===
          "trash_other_corp_installed_cards_in_source_server_and_damage_runner",
      )
    )
      for (const risk of ["net_damage", "subsidiary_only"]) risks.add(risk);
    if (
      access.effects.some(
        (effect) =>
          effect.kind === "trash_installed_runner_hardware_and_programs",
      )
    )
      for (const risk of ["tag_threshold", "rig_trash"]) risks.add(risk);
  }
  if (
    engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) =>
          effect.kind === "double_chosen_ice_strength_until_end_of_turn",
      ),
    )
  )
    for (const risk of ["targeted_ice", "temporary_modifier"]) risks.add(risk);

  const breaker = engine.icebreakerAbilities?.find(
    (ability) => ability.kind === "break_subroutine",
  );
  const pump = engine.icebreakerAbilities?.find(
    (ability) => ability.kind === "increase_strength",
  );
  if (
    breaker?.kind === "break_subroutine" &&
    breaker.special?.kind === "once_per_run_break_tag_and_all_stealth_loss"
  )
    for (const risk of ["noisy", "tag_risk", "stealth_loss"]) risks.add(risk);
  if (pump?.kind === "increase_strength" && pump.duration === "current_turn")
    risks.add("run_duration_strength");
  if (
    breaker?.kind === "break_subroutine" &&
    breaker.special?.kind === "run_end_trash_source_if_used"
  )
    risks.add("self_trash");

  const runnerUtility = engine.runnerUtilityLongtail?.kind;
  if (runnerUtility === "hq_access_expose_all_installed_corp_cards")
    risks.add("public_reveal");
  if (runnerUtility === "derez_fully_broken_passed_ice")
    for (const risk of ["timing_window", "tap_source"]) risks.add(risk);
  if (runnerUtility === "base_memory_equals_grip_count")
    for (const risk of ["dynamic_memory", "grip_size_dependency"])
      risks.add(risk);
  if (runnerUtility === "trace_attempts_auto_success_add_tag")
    for (const risk of ["trace_liability", "tag_self"]) risks.add(risk);
  if (runnerUtility === "first_prep_credit_gain_bonus")
    risks.add("prep_dependency");
  if (runnerUtility === "start_turn_random_effect_table")
    for (const risk of [
      "deterministic_random",
      "brain_damage",
      "unpreventable_damage",
    ])
      risks.add(risk);

  const runnerEvent = engine.runnerEventLongtail?.kind;
  if (runnerEvent === "trash_grip_search_stack_to_grip_equal_count")
    for (const risk of [
      "grip_trash",
      "hidden_zone_projection",
      "high_opportunity_cost",
    ])
      risks.add(risk);
  if (runnerEvent === "runner_corruption_agenda_point_transfer")
    for (const risk of [
      "agenda_transfer",
      "conditional_play",
      "tag_self",
      "high_opportunity_cost",
    ])
      risks.add(risk);
  if (runnerEvent === "do_the_drine_unpreventable_core_damage_for_credits")
    for (const risk of [
      "brain_damage",
      "unpreventable_damage",
      "high_opportunity_cost",
    ])
      risks.add(risk);
  if (runnerEvent === "three_dice_gain_credits")
    risks.add("deterministic_random");
  if (runnerEvent === "library_search_run")
    for (const risk of [
      "conditional_access",
      "run_success_dependency",
      "noisy_breaker_restriction",
    ])
      risks.add(risk);

  for (const ability of engine.abilities ?? []) {
    if (additionalClickAmount(ability.costs) === 1) risks.add("double_action");
    for (const cost of Array.isArray(ability.costs) ? ability.costs : []) {
      if (cost.kind === "credit") risks.add("credit_cost");
      if (cost.kind === "tap_source" || cost.kind === "trash_source")
        risks.add("tap_source");
    }
    for (const effect of ability.effects ?? []) {
      if (effect.kind === "make_run") risks.add("run_success_dependency");
      if (effect.kind === "make_run" && effect.successfulRunAccessReplacement)
        for (const risk of ["hidden_zone", "rd_reveal", "access_replacement"])
          risks.add(risk);
      if (effect.kind === "make_run" && effect.corpRezCostSurcharge)
        risks.add("run_cost_modifier");
      if (effect.kind === "remove_tags") risks.add("tag_clear_timing");
      if (effect.kind === "private_look") risks.add("hidden_zone");
    }
  }
  if (engine.unique !== undefined && entry.definition.type === "resource")
    risks.add("unique_resource");
  if (engine.hardwareDeck === true) risks.add("deck_unique");
  if (engine.restrictedHostedCreditSource !== undefined) {
    risks.add("restricted_credits");
    if (engine.restrictedHostedCreditSource.usableFor.includes("play_events"))
      risks.add("hosted_counters");
  }
  if (engine.damagePreventionSources !== undefined) risks.add("damage_window");
  if (engine.tagPreventionSources !== undefined)
    for (const risk of ["future_action_debt", "tag_prevention", "credit_cost"])
      risks.add(risk);
  for (const effect of engine.lifecycle?.on_leave_play ?? []) {
    if (effect.kind === "lose_credits") risks.add("leave_play_credit_loss");
    if (effect.kind === "damage") risks.add("leave_play_damage");
  }
  if (
    engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) => effect.kind === "transfer_hosted_credits",
      ),
    )
  )
    for (const risk of ["runner_trash_value", "stored_credit_exposure"])
      risks.add(risk);
  return [...risks];
}

function lifecycleHasCreditEffect(
  lifecycle: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"]["lifecycle"],
): boolean {
  if (lifecycle === undefined) return false;
  return (
    lifecycle.on_install?.some((effect) => effect.kind === "gain_credits") ===
      true ||
    lifecycle.start_of_runner_turn?.some((entry) =>
      entry.effects.some((effect) => effect.kind === "lose_credits"),
    ) === true ||
    lifecycle.on_leave_play?.some(
      (effect) => effect.kind === "pay_credits_or_lose_game",
    ) === true
  );
}

function hasHiddenInfoBarrier(
  engine: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"],
): boolean {
  return (
    engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) =>
          effect.kind === "choose_stack_or_trash_program_install" &&
          effect.visibility === "hidden_info_barrier",
      ),
    ) === true ||
    engine.accessEffects?.some(
      (access) =>
        access.visibility === "hidden_info_barrier" ||
        access.effects.some(
          (effect) => effect.visibility === "hidden_info_barrier",
        ),
    ) === true ||
    engine.scoredAgenda?.visibility === "hidden_info_barrier"
  );
}

function deriveCostProfile(
  annotations: readonly PlanningInterpretation[],
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): AiCardHint["costProfile"] {
  if (usesClosedExtendedMechanicalProfile(entry))
    return deriveClosedExtendedCostProfile(annotations, entry);
  const engine = entry.planning.engine;
  const opportunity = annotations.find(
    (annotation) =>
      annotation.kind === "risk_interpretation" &&
      annotation.risk === "opportunity_cost",
  );
  const reserve = annotations.find(
    (annotation) =>
      annotation.kind === "risk_interpretation" &&
      annotation.risk === "reserve_risk",
  );
  const clicks = engine.abilities?.some((ability) => ability.kind === "on_play")
    ? hasGenericOnPlayEffect(entry)
      ? undefined
      : 1
    : engine.abilities
        ?.flatMap((ability) =>
          Array.isArray(ability.costs) ? ability.costs : [],
        )
        .find((cost) => cost.kind === "action")?.amount;
  if (
    clicks === undefined &&
    opportunity === undefined &&
    reserve === undefined
  )
    return undefined;
  return {
    ...(clicks === undefined ? {} : { clicks }),
    ...(opportunity?.kind === "risk_interpretation"
      ? { opportunityCost: opportunity.severity }
      : {}),
    ...(reserve?.kind === "risk_interpretation"
      ? { reserveRisk: reserve.severity }
      : {}),
  };
}

function deriveClosedExtendedCostProfile(
  annotations: readonly PlanningInterpretation[],
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): AiCardHint["costProfile"] {
  const engine = entry.planning.engine;
  const result: NonNullable<AiCardHint["costProfile"]> = {};
  const opportunity = annotations.find(
    (annotation) =>
      annotation.kind === "risk_interpretation" &&
      annotation.risk === "opportunity_cost",
  );
  const reserve = annotations.find(
    (annotation) =>
      annotation.kind === "risk_interpretation" &&
      annotation.risk === "reserve_risk",
  );
  if (opportunity?.kind === "risk_interpretation")
    result.opportunityCost = opportunity.severity;
  if (reserve?.kind === "risk_interpretation")
    result.reserveRisk = reserve.severity;

  const activatedAbilities = (engine.abilities ?? []).filter(
    (ability) => ability.kind === "activated",
  );
  const onPlayAbilities = (engine.abilities ?? []).filter(
    (ability) => ability.kind === "on_play",
  );
  const arrayCosts = (engine.abilities ?? []).flatMap((ability) =>
    Array.isArray(ability.costs) ? ability.costs : [],
  );
  const actionCost = arrayCosts.find((cost) => cost.kind === "action");
  const creditCost = arrayCosts.find((cost) => cost.kind === "credit");
  const counterCost = arrayCosts.find((cost) => cost.kind === "source_counter");
  const additionalClicks = (engine.abilities ?? [])
    .filter(
      (ability) => !Array.isArray(ability.costs) && ability.costs !== "printed",
    )
    .reduce(
      (maximum, ability) =>
        Math.max(maximum, additionalClickAmount(ability.costs)),
      0,
    );
  if (actionCost?.kind === "action") result.clicks = actionCost.amount;
  else if (onPlayAbilities.length > 0) result.clicks = 1 + additionalClicks;
  else if (activatedAbilities.length > 0 && entry.definition.side === "runner")
    result.clicks = 0;
  if (creditCost?.kind === "credit") result.credits = creditCost.amount;
  if (counterCost?.kind === "source_counter")
    result.counters = counterCost.amount;

  if (engine.agendaAccessReplacement?.kind === "install_as_runner_program")
    result.memory = engine.agendaAccessReplacement.memoryCost;
  if (engine.selfRezAdditionalCosts !== undefined)
    result.agendaPoints = engine.selfRezAdditionalCosts.reduce(
      (total, cost) => total + cost.amount,
      0,
    );
  for (const window of engine.fortRunWindows ?? [])
    if (window.kind === "move_self_to_outermost_position_on_other_fort")
      result.credits = window.cost.amount;
  for (const subroutine of engine.printedSubroutines ?? [])
    if (subroutine.kind === "deflect_run" && subroutine.cost !== undefined)
      result.credits = subroutine.cost.amount;

  if (
    engine.corpUtility !== undefined &&
    entry.definition.type === "operation"
  ) {
    result.clicks =
      engine.corpUtility.playCost?.kind === "printed"
        ? 1 + engine.corpUtility.playCost.additionalClicks
        : 1;
    if (engine.characteristics.playCost?.kind === "fixed")
      result.credits = engine.characteristics.playCost.credits;
  }
  const breaker = engine.icebreakerAbilities?.find(
    (ability) => ability.kind === "break_subroutine",
  );
  if (breaker?.kind === "break_subroutine") {
    result.clicks = 0;
    result.credits = breaker.cost.amount;
    if (engine.characteristics.numeric.memoryCost !== null)
      result.memory = engine.characteristics.numeric.memoryCost;
  }
  if (engine.runnerEventLongtail !== undefined) result.clicks = 1;
  if (engine.hardwareDeck === true || entry.definition.type === "hardware") {
    result.clicks = 1;
    if (engine.characteristics.numeric.installCost !== null)
      result.credits = engine.characteristics.numeric.installCost;
  }
  if (entry.definition.type === "resource" && activatedAbilities.length === 0) {
    result.clicks = 1;
    if (engine.characteristics.numeric.installCost !== null)
      result.credits = engine.characteristics.numeric.installCost;
  }
  if (
    entry.definition.type === "resource" &&
    activatedAbilities.length > 0 &&
    creditCost === undefined &&
    engine.characteristics.numeric.installCost !== null
  )
    result.credits = engine.characteristics.numeric.installCost;
  if (
    entry.definition.type === "program" &&
    engine.icebreakerAbilities === undefined
  ) {
    result.clicks = 0;
    result.credits ??= 0;
    if (engine.characteristics.numeric.memoryCost !== null)
      result.memory = engine.characteristics.numeric.memoryCost;
  }
  if (engine.runnerUtilityLongtail?.kind === "derez_fully_broken_passed_ice") {
    delete result.credits;
    result.counters = 0;
  }
  return Object.keys(result).length === 0 ? undefined : result;
}

function deriveConditions(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): NonNullable<AiCardHint["conditions"]> {
  const engine = entry.planning.engine;
  const conditions: NonNullable<AiCardHint["conditions"]> = [];
  if (
    engine.abilities?.some(
      (ability) => ability.condition?.kind === "source_has_hosted_credits",
    )
  )
    conditions.push({ kind: "requires_installed_resource" });
  if (
    engine.abilities?.some(
      (ability) => ability.condition?.kind === "runner_is_tagged",
    )
  )
    conditions.push({ kind: "requires_runner_tagged" });
  if (engine.lifecycle?.start_of_runner_turn !== undefined)
    conditions.push({ kind: "requires_start_of_turn" });
  if (engine.scoredAgenda !== undefined)
    conditions.push(
      { kind: "requires_hq_agenda" },
      { kind: "requires_score_window" },
      { kind: "requires_scored_agenda" },
    );
  for (const access of engine.accessEffects ?? []) {
    conditions.push({ kind: "requires_accessed_card" });
    if (
      access.effects.some(
        (effect) => effect.kind === "damage_from_source_advancement_counters",
      )
    )
      conditions.push({ kind: "requires_advancement_counter" });
    if (access.sourceZones.includes("rd"))
      conditions.push({ kind: "requires_rnd_top" });
  }
  if (engine.fortRunWindows !== undefined)
    conditions.push({ kind: "requires_remote_server" });
  if (engine.modifiers !== undefined)
    conditions.push({ kind: "requires_installed_ice" });
  if ((engine.printedSubroutines?.length ?? 0) > 0)
    conditions.push(
      { kind: "requires_encounter" },
      { kind: "requires_unbroken_subroutine" },
    );
  if (usesClosedExtendedMechanicalProfile(entry)) {
    if (
      engine.abilities?.some(
        (ability) =>
          ability.kind === "activated" && ability.timing === "corp_during_run",
      )
    )
      conditions.push({ kind: "requires_during_run" });
    if (engine.scoredAgenda?.kind === "corp_start_turn_mandatory_draw")
      conditions.push({ kind: "requires_start_of_turn" });
    if (engine.agendaAccessReplacement?.kind === "install_as_runner_program")
      conditions.push({ kind: "requires_accessed_card" });
    if (
      engine.printedSubroutines?.some(
        (subroutine) => subroutine.kind === "trace",
      )
    )
      conditions.push({ kind: "requires_trace_success" });
    if (
      engine.printedSubroutines?.some(
        (subroutine) => subroutine.kind === "prohibit_break_next_ice",
      )
    )
      conditions.push({ kind: "requires_remaining_ice" });
    if (
      engine.printedSubroutines?.some(
        (subroutine) => subroutine.kind === "trash_program",
      )
    )
      conditions.push({ kind: "requires_installed_program" });
    for (const subroutine of engine.printedSubroutines ?? [])
      if (subroutine.kind === "deflect_run") {
        conditions.push({ kind: "requires_rezzed_ice" });
        if (subroutine.cost !== undefined)
          conditions.push({ kind: "requires_corp_credits_threshold" });
        if (subroutine.target === "any_data_fort")
          conditions.push({ kind: "requires_remote_server" });
        if (subroutine.target === "subsidiary_data_fort")
          conditions.push({ kind: "requires_remote_server" });
      }
    if (engine.fortRunWindows !== undefined)
      conditions.push({ kind: "requires_installed_ice" });
    const corpUtilityKind = engine.corpUtility?.kind;
    if (corpUtilityKind === "runner_memory_limit_modifier_until_end_of_turn")
      conditions.push({ kind: "requires_runner_tagged" });
    if (corpUtilityKind === "corp_archives_to_hq")
      conditions.push({ kind: "requires_archives_card" });
    if (corpUtilityKind === "corp_start_turn_tag_roll_per_runner_run_last_turn")
      conditions.push({ kind: "requires_start_of_turn" });
    if (corpUtilityKind === "run_start_tax_runner_tags")
      conditions.push(
        { kind: "requires_during_run" },
        { kind: "requires_runner_tagged" },
        { kind: "requires_remote_server" },
      );
    if (engine.successfulRunFollowups !== undefined)
      conditions.push({ kind: "requires_successful_run" });
    if (
      engine.modifiers?.some(
        (modifier) => modifier.kind === "break_subroutine_cost",
      )
    )
      conditions.push(
        { kind: "requires_during_run" },
        { kind: "requires_remote_server" },
      );
    if (
      engine.abilities?.some((ability) =>
        ability.effects?.some(
          (effect) =>
            effect.kind === "double_chosen_ice_strength_until_end_of_turn",
        ),
      )
    )
      conditions.push(
        { kind: "requires_installed_ice" },
        { kind: "requires_corp_credits_threshold" },
      );
    for (const access of engine.accessEffects ?? [])
      if (access.condition?.kind === "runner_tags_at_least")
        conditions.push({ kind: "requires_runner_tagged" });
      else if (
        access.effects.some(
          (effect) =>
            effect.kind ===
            "trash_other_corp_installed_cards_in_source_server_and_damage_runner",
        )
      )
        conditions.push({ kind: "requires_remote_server" });
    const breaker = engine.icebreakerAbilities?.find(
      (ability) => ability.kind === "break_subroutine",
    );
    if (breaker?.kind === "break_subroutine" && breaker.special !== undefined)
      conditions.push(
        { kind: "requires_during_run" },
        { kind: "requires_encounter" },
      );
    if (
      engine.icebreakerAbilities?.some(
        (ability) =>
          ability.kind === "increase_strength" &&
          ability.duration === "current_turn",
      )
    )
      conditions.push({ kind: "requires_during_run" });
    const runnerUtilityKind = engine.runnerUtilityLongtail?.kind;
    if (runnerUtilityKind === "hq_access_expose_all_installed_corp_cards")
      conditions.push(
        { kind: "requires_hq_pressure" },
        { kind: "requires_accessed_card" },
      );
    if (runnerUtilityKind === "derez_fully_broken_passed_ice")
      conditions.push(
        { kind: "requires_encounter" },
        { kind: "requires_rezzed_ice" },
      );
    if (runnerUtilityKind === "trace_attempts_auto_success_add_tag")
      conditions.push({ kind: "requires_trace_attempt" });
    if (runnerUtilityKind === "first_prep_credit_gain_bonus")
      conditions.push({ kind: "requires_runner_action" });
    if (runnerUtilityKind === "base_memory_equals_grip_count")
      conditions.push({ kind: "requires_runner_draw" });
    const runnerEventKind = engine.runnerEventLongtail?.kind;
    if (runnerEventKind === "trash_grip_search_stack_to_grip_equal_count")
      conditions.push(
        { kind: "requires_grip_card" },
        { kind: "requires_stack_search" },
      );
    if (runnerEventKind === "runner_corruption_agenda_point_transfer")
      conditions.push({ kind: "requires_stolen_agenda_last_turn" });
    if (
      runnerEventKind === "do_the_drine_unpreventable_core_damage_for_credits"
    )
      conditions.push(
        { kind: "requires_runner_action" },
        { kind: "requires_brain_damage" },
      );
    if (runnerEventKind === "three_dice_gain_credits")
      conditions.push({ kind: "requires_runner_action" });
    if (runnerEventKind === "library_search_run")
      conditions.push({ kind: "requires_successful_run" });
    if (
      engine.abilities?.some(
        (ability) => additionalClickAmount(ability.costs) === 1,
      )
    )
      conditions.push({ kind: "requires_runner_action" });
    for (const ability of engine.abilities ?? [])
      for (const effect of ability.effects ?? []) {
        if (effect.kind === "make_run" && effect.successfulRunAccessReplacement)
          conditions.push(
            { kind: "requires_rnd_pressure" },
            { kind: "requires_successful_run" },
          );
        if (effect.kind === "make_run" && effect.corpRezCostSurcharge)
          conditions.push({ kind: "requires_during_run" });
        if (effect.kind === "private_look")
          conditions.push(
            { kind: "requires_runner_action" },
            {
              kind:
                effect.zone === "hq"
                  ? "requires_hq_pressure"
                  : "requires_rnd_pressure",
            },
          );
      }
    if (engine.damagePreventionSources !== undefined)
      conditions.push({ kind: "requires_damage" });
    if (engine.tagPreventionSources !== undefined)
      conditions.push({ kind: "requires_prevention_window" });
    if (engine.runnerUtilityLongtail?.kind === "start_turn_random_effect_table")
      conditions.push({ kind: "requires_start_of_turn" });
  }
  return uniqueConditions(conditions);
}

function uniqueConditions(
  conditions: NonNullable<AiCardHint["conditions"]>,
): NonNullable<AiCardHint["conditions"]> {
  const seen = new Set<string>();
  return conditions.filter((condition) =>
    seen.has(condition.kind) ? false : (seen.add(condition.kind), true),
  );
}

function deriveActionTacticSignals(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
  effects: NonNullable<AiCardHint["effects"]>,
): string[] {
  const signals = new Set<string>();
  for (const effect of effects) {
    signals.add(`effect:${effect.kind}`);
    signals.add(`effect_scope:${effect.scope}`);
    signals.add(`effect_timing:${effect.timing}`);
  }
  if (usesClosedExtendedMechanicalProfile(entry)) {
    for (const effect of effects) {
      if (effect.kind === "scored_agenda_action")
        signals.add("corp.score_progress");
      if (
        effect.kind === "access_replacement" ||
        effect.kind === "access_punish" ||
        effect.kind === "ambush" ||
        effect.kind === "hq_info" ||
        effect.kind === "topdeck_info" ||
        effect.kind === "multiaccess" ||
        effect.timing === "on_access"
      )
        signals.add("access.payoff");
      if (effect.kind === "access_punish")
        signals.add("access.corp_access_punish");
      if (effect.kind === "ambush") signals.add("access.corp_ambush");
      if (effect.kind === "trace") signals.add("trace.source");
      if (effect.kind === "program_trash")
        signals.add("target.runner_program_trash");
      if (effect.kind === "hardware_trash")
        signals.add("target.runner_hardware_trash");
      if (effect.kind === "tag_source" || effect.kind === "tag")
        signals.add("tag.source");
      if (effect.kind === "multiaccess")
        signals.add(
          effect.scope === "hq"
            ? "access.hq_multiaccess"
            : "access.rnd_multiaccess",
        );
      if (effect.kind === "search") signals.add("setup.search");
      if (
        effect.kind === "tag_prevention" ||
        effect.kind === "net_damage_prevention" ||
        effect.kind === "brain_damage_prevention"
      )
        signals.add("survival.defense");
    }
    if (entry.planning.engine.printedSubroutines !== undefined)
      signals.add("corp.ice_protection");
  }
  for (const annotation of allPlanningAnnotations(entry)) {
    if (annotation.kind === "tactic_interpretation")
      signals.add(
        closedPlanningValue(
          annotation.use,
          KNOWN_PLANNING_TACTIC_USES,
          "tactic_use",
        ),
      );
    if (annotation.kind === "remote_role")
      signals.add(`remote_role:${annotation.role}`);
  }
  return [...signals].sort();
}

function allPlanningAnnotations(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): PlanningInterpretation[] {
  return [
    ...(entry.planning.planningAnnotations?.card ?? []),
    ...(entry.planning.planningAnnotations?.capabilities ?? []).flatMap(
      (capability) => capability.annotations,
    ),
  ];
}

function deriveTargetProfiles(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): NonNullable<AiCardHint["targetProfiles"]> {
  const preference = entry.planning.planningAnnotations?.card?.find(
    (annotation) => annotation.kind === "target_preference",
  );
  if (
    preference?.kind === "target_preference" &&
    usesClosedExtendedMechanicalProfile(entry)
  )
    return [deriveClosedExtendedTargetProfile(entry, preference)];
  const requiredSubtype = entry.planning.engine.modifiers?.flatMap(
    (modifier) =>
      (modifier.kind === "rez_cost" || modifier.kind === "ice_strength") &&
      modifier.appliesTo.subtype !== undefined
        ? [modifier.appliesTo.subtype]
        : [],
  )[0];
  if (preference?.kind === "target_preference" && requiredSubtype !== undefined)
    return [
      {
        schemaVersion: "target-profile-v1",
        kind: "use_target",
        timing: "corp_rez_window",
        targetType: "installed_ice",
        purpose: preference.purpose,
        ...(preference.preferences === undefined
          ? {}
          : {
              preferences: closedPlanningValues(
                preference.preferences,
                KNOWN_HINT_TARGET_PROFILE_PREFERENCES,
                "target_preference",
              ),
            }),
        avoid: ["hidden_info_dependent_choice"],
        hiddenInfoPolicy: "legal_targets_only",
        requiredSubtypes: [requiredSubtype],
        serverScope: "any_visible_server",
      },
    ];
  const capabilityPreferences = new Map(
    (entry.planning.planningAnnotations?.capabilities ?? []).flatMap(
      (capability) => {
        const target = capability.annotations.find(
          (annotation) => annotation.kind === "target_preference",
        );
        return target?.kind === "target_preference"
          ? [[capability.capabilityKey, target] as const]
          : [];
      },
    ),
  );
  const installBinding = entry.planning.engine.installTargetBinding;
  if (installBinding !== undefined) {
    const target = capabilityPreferences.get(installBinding.capabilityKey);
    if (target !== undefined) {
      const base = {
        schemaVersion: "target-profile-v1" as const,
        kind:
          installBinding.kind === "choose_installed_ice_on_install"
            ? ("install_target" as const)
            : ("mode_choice" as const),
        timing: "on_install" as const,
        targetType:
          installBinding.kind === "choose_installed_ice_on_install"
            ? ("installed_ice" as const)
            : ("ice_type" as const),
        purpose: target.purpose,
        ...(target.preferences === undefined
          ? {}
          : {
              preferences: closedPlanningValues(
                target.preferences,
                KNOWN_HINT_TARGET_PROFILE_PREFERENCES,
                "target_preference",
              ),
            }),
        ...(target.avoid === undefined
          ? {}
          : {
              avoid: closedPlanningValues(
                target.avoid,
                KNOWN_HINT_TARGET_PROFILE_AVOIDS,
                "target_avoid",
              ),
            }),
        hiddenInfoPolicy: "visible_or_known_only" as const,
      };
      const subtypeChange = entry.planning.engine.icebreakerSubtypeChange;
      if (subtypeChange !== undefined) {
        const changeTarget = capabilityPreferences.get(
          subtypeChange.capabilityKey,
        );
        if (changeTarget === undefined) return [base];
        return [
          base,
          {
            ...base,
            timing: "paid_action" as const,
            purpose: changeTarget.purpose,
            ...(changeTarget.preferences === undefined
              ? {}
              : {
                  preferences: closedPlanningValues(
                    changeTarget.preferences,
                    KNOWN_HINT_TARGET_PROFILE_PREFERENCES,
                    "target_preference",
                  ),
                }),
            ...(changeTarget.avoid === undefined
              ? {}
              : {
                  avoid: closedPlanningValues(
                    changeTarget.avoid,
                    KNOWN_HINT_TARGET_PROFILE_AVOIDS,
                    "target_avoid",
                  ),
                }),
          },
        ];
      }
      return [base];
    }
  }
  const onPlay = entry.planning.engine.abilities?.find(
    (ability) => ability.kind === "on_play",
  );
  if (onPlay !== undefined) {
    const target = capabilityPreferences.get(onPlay.capabilityKey);
    if (target !== undefined)
      return [
        {
          schemaVersion: "target-profile-v1",
          kind: "search_install_target",
          timing: "on_play",
          targetType: "program",
          purpose: target.purpose,
          ...(target.preferences === undefined
            ? {}
            : {
                preferences: closedPlanningValues(
                  target.preferences,
                  KNOWN_HINT_TARGET_PROFILE_PREFERENCES,
                  "target_preference",
                ),
              }),
          ...(target.avoid === undefined
            ? {}
            : {
                avoid: closedPlanningValues(
                  target.avoid,
                  KNOWN_HINT_TARGET_PROFILE_AVOIDS,
                  "target_avoid",
                ),
              }),
          hiddenInfoPolicy: "public_or_controller_known_only",
        },
      ];
  }
  const scoredAgenda = entry.planning.engine.scoredAgenda;
  if (scoredAgenda !== undefined && "capabilityKey" in scoredAgenda) {
    const target = capabilityPreferences.get(scoredAgenda.capabilityKey);
    if (target !== undefined)
      return [
        {
          schemaVersion: "target-profile-v1",
          kind: "install_target",
          timing: "on_score",
          targetType: "card",
          purpose: target.purpose,
          ...(target.preferences === undefined
            ? {}
            : {
                preferences: closedPlanningValues(
                  target.preferences,
                  KNOWN_HINT_TARGET_PROFILE_PREFERENCES,
                  "target_preference",
                ),
              }),
          ...(target.avoid === undefined
            ? {}
            : {
                avoid: closedPlanningValues(
                  target.avoid,
                  KNOWN_HINT_TARGET_PROFILE_AVOIDS,
                  "target_avoid",
                ),
              }),
          hiddenInfoPolicy: "public_or_controller_known_only",
        },
      ];
  }
  return [];
}

function deriveClosedExtendedTargetProfile(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
  preference: Extract<PlanningInterpretation, { kind: "target_preference" }>,
): NonNullable<AiCardHint["targetProfiles"]>[number] {
  const engine = entry.planning.engine;
  const planningFields = {
    schemaVersion: "target-profile-v1" as const,
    purpose: preference.purpose,
    ...(preference.preferences === undefined
      ? {}
      : {
          preferences: closedPlanningValues(
            preference.preferences,
            KNOWN_HINT_TARGET_PROFILE_PREFERENCES,
            "target_preference",
          ),
        }),
    ...(preference.avoid === undefined
      ? {}
      : {
          avoid: closedPlanningValues(
            preference.avoid,
            KNOWN_HINT_TARGET_PROFILE_AVOIDS,
            "target_avoid",
          ),
        }),
  };
  if (engine.agendaAccessReplacement?.kind === "install_as_runner_program")
    return {
      ...planningFields,
      kind: "replacement_target",
      timing: "on_access",
      targetType: "accessed_card",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.printedSubroutines?.some(
      (subroutine) => subroutine.kind === "trash_program",
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "subroutine_resolution",
      targetType: "program",
      hiddenInfoPolicy: "visible_or_known_only",
    };
  if (
    engine.printedSubroutines?.some(
      (subroutine) => subroutine.kind === "deflect_run",
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "subroutine_resolution",
      targetType: "server",
      hiddenInfoPolicy: "legal_targets_only",
    };
  if (engine.fortRunWindows !== undefined)
    return {
      ...planningFields,
      kind: "use_target",
      timing: "start_of_run",
      targetType: "ice_position",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.corpUtility?.kind ===
      "draw_corp_cards_then_shuffle_hq_card_into_rd" ||
    engine.corpUtility?.kind === "corp_archives_to_hq"
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_play",
      targetType: "card",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (engine.accessEffects !== undefined)
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_access",
      targetType: "card",
      hiddenInfoPolicy: "legal_targets_only",
    };
  if (
    engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) =>
          effect.kind === "double_chosen_ice_strength_until_end_of_turn",
      ),
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "activated_ability",
      targetType: "installed_ice",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.runnerUtilityLongtail?.kind ===
    "hq_access_expose_all_installed_corp_cards"
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "hq_access",
      targetType: "card",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (engine.runnerUtilityLongtail?.kind === "derez_fully_broken_passed_ice")
    return {
      ...planningFields,
      kind: "use_target",
      timing: "encounter_resolution",
      targetType: "installed_ice",
      hiddenInfoPolicy: "visible_or_known_only",
    };
  if (
    engine.runnerEventLongtail?.kind ===
    "trash_grip_search_stack_to_grip_equal_count"
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_play",
      targetType: "card",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.runnerEventLongtail?.kind ===
    "do_the_drine_unpreventable_core_damage_for_credits"
  )
    return {
      ...planningFields,
      kind: "mode_choice",
      timing: "on_play",
      targetType: "mode_choice",
      hiddenInfoPolicy: "legal_options_only",
    };
  if (engine.runnerEventLongtail?.kind === "library_search_run")
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_play",
      targetType: "server",
      hiddenInfoPolicy: "legal_targets_only",
    };
  const makeRun = engine.abilities
    ?.flatMap((ability) => ability.effects ?? [])
    .find((effect) => effect.kind === "make_run");
  if (makeRun?.kind === "make_run")
    return makeRun.successfulRunAccessReplacement !== undefined
      ? {
          ...planningFields,
          kind: "replacement_target",
          timing: "after_successful_run",
          targetType: "card",
          hiddenInfoPolicy: "current_access_only",
        }
      : {
          ...planningFields,
          kind: "use_target",
          timing: "on_play",
          targetType: "server",
          hiddenInfoPolicy: "legal_targets_only",
        };
  if (
    engine.abilities?.some((ability) =>
      ability.effects?.some((effect) => effect.kind === "private_look"),
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_use",
      targetType: "card",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  throw new Error(
    `card_spec_target_preference_without_supported_mechanical_owner: ${entry.definition.id}`,
  );
}

function deriveMechanicalValueHints(
  engine: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"],
): AiRuntimeValueHints {
  const result: AiRuntimeValueHints = {};
  for (const ability of engine.abilities ?? [])
    for (const effect of ability.effects ?? [])
      if (effect.kind === "add_hosted_credits") result.economy = effect.amount;
  for (const effect of engine.lifecycle?.on_install ?? [])
    if (effect.kind === "gain_credits")
      result.installCreditGain = effect.amount;
  for (const entry of engine.lifecycle?.start_of_runner_turn ?? [])
    for (const effect of entry.effects)
      if (effect.kind === "lose_credits" && effect.amount !== undefined)
        result.startOfTurnCreditLoss = effect.amount;
  for (const effect of engine.lifecycle?.on_leave_play ?? [])
    if (effect.kind === "pay_credits_or_lose_game")
      result.leavePlayPayCost = effect.amount;
  for (const access of engine.accessEffects ?? [])
    for (const effect of access.effects)
      if (effect.kind === "damage")
        result.damage = Math.max(result.damage ?? 0, effect.amount);
      else if (effect.kind === "damage_from_source_advancement_counters")
        result.damage = Math.max(result.damage ?? 0, effect.minimumAmount);
  return result;
}

function deriveBreakerProfile(
  engine: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"],
): AiCardHint["breakerProfile"] {
  const abilities = engine.icebreakerAbilities;
  if (abilities === undefined) return undefined;
  const breaker = abilities.find(
    (ability) => ability.kind === "break_subroutine",
  );
  const pump = abilities.find(
    (ability) => ability.kind === "increase_strength",
  );
  if (
    breaker?.kind !== "break_subroutine" ||
    pump?.kind !== "increase_strength"
  )
    return undefined;
  if (breaker.matches.kind === "selected_ice_subtype")
    return {
      configurableCoverage: true,
      coverageCandidates: [
        ...(engine.installTargetBinding?.kind ===
        "choose_icebreaker_subtype_on_install"
          ? (engine.installTargetBinding.choices ?? [])
          : []),
      ],
      breakCost: breaker.cost.amount,
      maxSubroutinesPerBreak: 1,
      pumpCost: pump.cost.amount,
      pumpStrengthAmount: pump.amount,
      reconfigurableType: engine.icebreakerSubtypeChange !== undefined,
    };
  if (breaker.matches.kind === "any")
    return {
      coverage: ["universal"],
      emergencyCoverage: true,
      breakCost: breaker.cost.amount,
      ...(engine.characteristics.strength.kind === "fixed"
        ? { baseStrength: engine.characteristics.strength.value }
        : {}),
      maxSubroutinesPerBreak: 1,
      pumpCost: pump.cost.amount,
      pumpStrengthAmount: pump.amount,
      ...(breaker.special?.kind === "run_end_trash_source_if_used"
        ? {
            restrictions: ["trashes_self_at_end_of_run_after_break_use"],
            sideEffects: ["program_trash_risk"],
          }
        : {}),
    };
  if (breaker.matches.kind !== "ice_subtype")
    throw new Error(
      `card_spec_unsupported_breaker_matcher: ${breaker.matches.kind}`,
    );
  return {
    coverage: [
      closedPlanningValue(
        breakerCoverageForSubtype(breaker.matches.subtype),
        KNOWN_HINT_BREAKER_COVERAGES,
        "breaker_coverage",
      ),
    ],
    breakCost: breaker.cost.amount,
    ...(engine.installTargetBinding === undefined &&
    engine.icebreakerEncounterStrengthBonus === undefined &&
    engine.icebreakerSubtypeChange === undefined &&
    engine.characteristics.strength.kind === "fixed"
      ? { baseStrength: engine.characteristics.strength.value }
      : {}),
    ...(engine.installTargetBinding === undefined &&
    engine.icebreakerEncounterStrengthBonus === undefined &&
    engine.icebreakerSubtypeChange === undefined
      ? { maxSubroutinesPerBreak: 1 }
      : {}),
    pumpCost: pump.cost.amount,
    pumpStrengthAmount: pump.amount,
    ...(breaker.special?.kind === "once_per_run_break_tag_and_all_stealth_loss"
      ? {
          restrictions: ["first_sentry_break_each_run_gives_runner_tag"],
          sideEffects: ["stealth_loss"],
        }
      : pump.duration === "current_turn"
        ? { sideEffects: ["temporary_strength"] }
        : {}),
    targetedIceBonus: engine.installTargetBinding !== undefined,
    strengthBonusVsChosenIce:
      engine.icebreakerEncounterStrengthBonus?.kind ===
      "against_selected_installed_ice",
  };
}

function breakerCoverageForSubtype(
  subtype: string,
): (typeof KNOWN_HINT_BREAKER_COVERAGES)[number] {
  if (subtype === "barrier") return "wall";
  if (subtype === "code_gate" || subtype === "sentry") return subtype;
  return closedPlanningValue(
    subtype,
    KNOWN_HINT_BREAKER_COVERAGES,
    "breaker_coverage",
  );
}

function deriveHintEffects(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): NonNullable<AiCardHint["effects"]> {
  if (usesClosedExtendedMechanicalProfile(entry))
    return deriveClosedExtendedHintEffects(entry);
  const engine = entry.planning.engine;
  const effects: NonNullable<AiCardHint["effects"]> = [];
  if (engine.corpRootRezCreditOutcome !== undefined)
    effects.push({
      kind: "economy",
      scope: "corp",
      timing: "on_rez",
      amount: engine.corpRootRezCreditOutcome.effect.amount,
    });
  for (const ability of engine.abilities ?? [])
    for (const effect of ability.effects ?? []) {
      if (effect.kind === "gain_credits")
        effects.push({
          kind: "economy",
          scope:
            effect.recipient === "controller"
              ? entry.definition.side
              : effect.recipient,
          timing: "action",
          amount: effect.amount,
          finite: true,
        });
      if (effect.kind === "draw_cards")
        effects.push({
          kind: "draw",
          scope:
            effect.recipient === "controller"
              ? entry.definition.side
              : effect.recipient,
          timing: "action",
          resource: "cards",
          amount: effect.amount,
          finite: true,
        });
      if (
        effect.kind === "lose_credits" &&
        effect.recipient === "runner" &&
        ability.condition?.kind === "runner_is_tagged"
      )
        effects.push({
          kind: "tag_punish_payoff",
          scope: "runner",
          timing: "action",
          ...(effect.amount === undefined ? {} : { amount: effect.amount }),
          finite: true,
        });
    }
  const hasHostedCreditBank = engine.abilities?.some((ability) =>
    ability.effects?.some(
      (effect) =>
        effect.kind === "add_hosted_credits" ||
        effect.kind === "take_hosted_credits",
    ),
  );
  if (hasHostedCreditBank)
    effects.push(
      {
        kind: "economy",
        scope: "runner",
        timing: "persistent",
        target: "economy.action_credit",
      },
      {
        kind: "economy",
        scope: "runner",
        timing: "persistent",
        target: "economy.temporary_resource_bank",
      },
    );
  if (
    entry.definition.type === "resource" &&
    entry.definition.subtypes.includes("connection")
  )
    effects.push({
      kind: "global_modifier",
      scope: "runner",
      timing: "persistent",
      target: "resource.connection",
    });
  for (const modifier of engine.modifiers ?? []) {
    if (modifier.kind === "rez_cost")
      effects.push({
        kind: "rez_discount",
        scope: "ice",
        timing: "persistent",
        amount: modifier.amount,
        resource: "credits",
      });
    if (modifier.kind === "ice_strength")
      effects.push({
        kind: "remote_protection",
        scope: "ice",
        timing: "persistent",
        amount: modifier.amount,
        resource: "strength",
      });
  }
  if (engine.icebreakerAbilities !== undefined)
    effects.push({ kind: "breaker", scope: "runner", timing: "persistent" });
  for (const access of engine.accessEffects ?? [])
    for (const effect of access.effects)
      if (
        effect.kind === "damage" ||
        effect.kind === "damage_from_source_advancement_counters"
      )
        effects.push({
          kind: "damage",
          scope: "runner",
          timing: "on_access",
          resource: hintDamageResource(effect.damageType),
          amount:
            effect.kind === "damage" ? effect.amount : effect.minimumAmount,
          target: "access.corp_net_damage_ambush",
        });
  for (const window of engine.fortRunWindows ?? [])
    if (window.kind === "server_run_start_restriction")
      effects.push({
        kind: "remote_tax",
        scope: "remote",
        timing: "during_run",
        target: "run.corp_server_lock",
      });
  for (const subroutine of engine.printedSubroutines ?? []) {
    if (subroutine.kind === "damage")
      effects.push({
        kind: "damage",
        scope: "runner",
        timing: "encounter_resolution",
        resource: hintDamageResource(subroutine.damageType),
        amount: subroutine.amount,
        finite: true,
        target: `corp_ice.${subroutine.damageType}_damage`,
      });
    if (subroutine.kind === "end_the_run")
      effects.push({
        kind: "etr",
        scope: "run_path",
        timing: "encounter_resolution",
        target: "corp_ice.end_run",
      });
    if (subroutine.kind === "corp_gain_credit")
      effects.push({
        kind: "economy",
        scope: "corp",
        timing: "encounter_resolution",
        resource: "credits",
        amount: subroutine.amount,
        finite: true,
        target: "corp_ice.credit_gain",
      });
    if (subroutine.kind === "runner_lose_credits")
      effects.push({
        kind: "run_tax",
        scope: "runner",
        timing: "encounter_resolution",
        resource: "credits",
        amount: subroutine.amount,
        finite: true,
        target: "corp_ice.credit_loss",
      });
    if (subroutine.kind === "give_runner_tag")
      effects.push({
        kind: "tag_source",
        scope: "runner",
        timing: "encounter_resolution",
        amount: subroutine.amount,
        finite: true,
        target: "corp_ice.tag_source",
      });
  }
  if (engine.variableRez?.kind === "x_strength")
    effects.push({
      kind: "global_modifier",
      scope: "ice",
      timing: "on_rez",
      resource: "strength",
      target: "corp_ice.rez_paid_scaling",
    });
  if (
    engine.scoredAgenda?.kind ===
    "score_install_hq_cards_into_new_remote_then_rez"
  )
    effects.push(
      {
        kind: "economy",
        scope: "corp",
        timing: "when_scored",
        resource: "credits",
        amount: engine.scoredAgenda.temporaryCredits.amount,
      },
      { kind: "install", scope: "remote", timing: "when_scored" },
      { kind: "remote_build", scope: "remote", timing: "when_scored" },
      { kind: "rez", scope: "remote", timing: "when_scored" },
    );
  for (const ability of engine.abilities ?? [])
    for (const effect of ability.effects ?? []) {
      if (effect.kind === "add_hosted_credits")
        effects.push({
          kind: "counter_economy",
          scope: "runner",
          timing: "action",
          resource: "credits",
          amount: effect.amount,
          economyMode: "bank_load",
          target: "economy.bank_load",
        });
      if (effect.kind === "take_hosted_credits")
        effects.push({
          kind: "action_economy",
          scope: "runner",
          timing: "action",
          resource: "credits",
          amountKind: effect.mode === "all" ? "all_available" : "dynamic",
          economyMode: "bank_cashout",
          target: "economy.bank_cashout_all",
        });
      if (effect.kind === "choose_stack_or_trash_program_install")
        effects.push(
          {
            kind: "search",
            scope: "runner",
            timing: "action",
            target: "program_search",
          },
          {
            kind: "install",
            scope: "installed_card",
            timing: "action",
            target: "program",
          },
          {
            kind: "install_discount",
            scope: "installed_card",
            timing: "action",
            target: "temporary_program_install",
          },
          {
            kind: "delayed_penalty",
            scope: "runner",
            timing: "runner_turn",
            target: "end_of_turn_bounce",
          },
        );
    }
  for (const effect of engine.lifecycle?.on_install ?? [])
    if (effect.kind === "gain_credits") {
      effects.push({
        kind: "economy",
        scope: "runner",
        timing: "persistent",
        target: "economy.high_risk_burst_credit",
      });
      effects.push({
        kind: "economy",
        scope: "runner",
        timing: "action",
        resource: "credits",
        amount: effect.amount,
      });
      effects.push({
        kind: "counter_economy",
        scope: "runner",
        timing: "action",
        resource: "credits",
      });
    }
  for (const entry of engine.lifecycle?.start_of_runner_turn ?? [])
    for (const effect of entry.effects)
      if (effect.kind === "lose_credits" && effect.amount !== undefined) {
        effects.push({
          kind: "economy",
          scope: "runner",
          timing: "persistent",
          target: "economy.turn_start_credit",
        });
        effects.push({
          kind: "delayed_penalty",
          scope: "runner",
          timing: "start_of_turn",
          resource: "credits",
          amount: effect.amount,
        });
      }
  for (const effect of engine.lifecycle?.on_leave_play ?? [])
    if (effect.kind === "pay_credits_or_lose_game") {
      effects.push(
        {
          kind: "delayed_penalty",
          scope: "runner",
          timing: "persistent",
          target: "risk.debt_loss_condition",
        },
        {
          kind: "delayed_penalty",
          scope: "runner",
          timing: "persistent",
          target: "risk.lose_game_debt",
        },
      );
      effects.push({
        kind: "delayed_penalty",
        scope: "runner",
        timing: "on_leave_play",
        resource: "credits",
        amount: effect.amount,
      });
    }
  return effects;
}

function deriveClosedExtendedHintEffects(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): NonNullable<AiCardHint["effects"]> {
  const engine = entry.planning.engine;
  const effects: NonNullable<AiCardHint["effects"]> = [];

  if (engine.scoredAgenda?.kind === "add_counters_on_score") {
    effects.push(
      {
        kind: "scored_agenda_action",
        scope: "score_area",
        timing: "when_scored",
        target: "score.action_counter_bank",
        finite: true,
      },
      {
        kind: "persistent_counter_effect",
        scope: "score_area",
        timing: "when_scored",
        resource: "counters",
        target: "score.action_counter_bank",
        amount: engine.scoredAgenda.amount,
        finite: true,
      },
    );
  }
  if (
    engine.scoredAgenda?.kind === "purge_runner_virus_counters_and_prevent_next"
  )
    effects.push(
      {
        kind: "persistent_counter_effect",
        scope: "runner",
        timing: "when_scored",
        resource: "counters",
        target: "virus.corp_counter_prevention",
        finite: true,
      },
      {
        kind: "prevention_replacement",
        scope: "corp",
        timing: "persistent",
        resource: "counters",
        target: "virus.corp_counter_prevention",
        amount: engine.scoredAgenda.preventCount,
        finite: true,
      },
    );
  if (engine.scoredAgenda?.kind === "corp_start_turn_mandatory_draw")
    effects.push(
      {
        kind: "draw",
        scope: "corp",
        timing: "start_of_turn",
        resource: "cards",
        target: "score.recurring_draw",
        amount: engine.scoredAgenda.drawCount,
        repeatable: true,
      },
      {
        kind: "draw",
        scope: "corp",
        timing: "start_of_turn",
        resource: "cards",
        target: "draw.corp_draw",
        amount: engine.scoredAgenda.drawCount,
        repeatable: true,
      },
    );
  if (engine.agendaAccessReplacement?.kind === "install_as_runner_program")
    effects.push(
      {
        kind: "access_replacement",
        scope: "accessed_card",
        timing: "on_access",
        resource: "cards",
        target: "access.runner_program_bounce",
        finite: true,
      },
      {
        kind: "install",
        scope: "runner",
        timing: "on_access",
        resource: "memory",
        target: "runner_installs_agenda_as_program",
        amount: engine.agendaAccessReplacement.memoryCost,
        finite: true,
      },
    );

  for (const ability of engine.abilities ?? []) {
    for (const effect of ability.effects ?? []) {
      if (effect.kind === "end_run")
        effects.push({
          kind: "etr",
          scope: "run_path",
          timing: "during_run",
          target: "remap_counter_end_run",
          finite: true,
        });
      if (effect.kind === "score_source_as_agenda")
        effects.push({
          kind: "scored_agenda_action",
          scope: "score_area",
          timing: "action",
          target: "score.closeout_agenda",
          finite: true,
        });
      if (effect.kind === "double_chosen_ice_strength_until_end_of_turn")
        effects.push(
          {
            kind: "global_modifier",
            scope: "ice",
            timing: "during_run",
            resource: "strength",
            target: "double_chosen_ice_strength_until_end_of_turn",
            finite: true,
          },
          {
            kind: "remote_protection",
            scope: "remote",
            timing: "during_run",
            target: "remote.scoring_protection",
            finite: true,
          },
        );
      if (effect.kind === "gain_credits")
        effects.push({
          kind: "economy",
          scope:
            effect.recipient === "controller"
              ? entry.definition.side
              : effect.recipient,
          timing: "action",
          resource: "credits",
          target: "burst_credit",
          amount: effect.amount,
          finite: true,
        });
      if (effect.kind === "draw_cards")
        effects.push({
          kind: "draw",
          scope:
            effect.recipient === "controller"
              ? entry.definition.side
              : effect.recipient,
          timing: "action",
          resource: "cards",
          target: "draw",
          amount: effect.amount,
          finite: true,
        });
      if (effect.kind === "remove_tags")
        effects.push({
          kind: "tag_prevention",
          scope: "runner",
          timing: "action",
          resource: "tags",
          target: "remove_tags",
          amount: requiredFiniteNumber(effect.amount, "remove_tags.amount"),
          finite: true,
        });
      if (effect.kind === "private_look")
        effects.push({
          kind: effect.zone === "hq" ? "hq_info" : "topdeck_info",
          scope: effect.zone === "rd" ? "rnd" : effect.zone,
          timing: "action",
          resource: "cards",
          target: effect.zone === "hq" ? "full_reveal" : "top_cards",
          ...(typeof effect.count === "number" ? { amount: effect.count } : {}),
          repeatable: true,
        });
      if (effect.kind === "make_run") {
        effects.push({
          kind: "future_run_effect",
          scope:
            effect.target.kind === "central_server"
              ? effect.target.server === "rd"
                ? "rnd"
                : effect.target.server
              : "runner",
          timing: "action",
          target:
            effect.target.kind === "central_server"
              ? `make_${effect.target.server === "rd" ? "rnd" : effect.target.server}_run`
              : "make_chosen_server_run",
          finite: true,
        });
        if (effect.successfulRunAccessReplacement !== undefined)
          effects.push(
            {
              kind: "access_replacement",
              scope: "rnd",
              timing: "successful_run",
              target: "reveal_until_agenda_store_in_hq",
              finite: true,
            },
            {
              kind: "topdeck_info",
              scope: "rnd",
              timing: "successful_run",
              resource: "cards",
              target: "reveal_until_agenda",
              finite: true,
            },
          );
        if (effect.corpRezCostSurcharge !== undefined)
          effects.push({
            kind: "run_tax",
            scope: "corp",
            timing: "during_run",
            resource: "credits",
            target: "matching_printed_rez_cost_surcharge",
            finite: true,
          });
      }
      if (effect.kind === "transfer_hosted_credits")
        effects.push({
          kind:
            effect.direction === "controller_to_source"
              ? "finite_economy_pool"
              : "economy",
          scope: "corp",
          timing: "action",
          target:
            effect.direction === "controller_to_source"
              ? "economy.corp_charge_bank"
              : "economy.corp_action_charged_bank",
        });
    }
  }

  for (const subroutine of engine.printedSubroutines ?? []) {
    if (subroutine.kind === "damage")
      effects.push({
        kind: "damage",
        scope: "runner",
        timing: "encounter",
        resource: "damage",
        target: `corp_ice.${subroutine.damageType}_damage`,
        amount: subroutine.amount,
        finite: true,
      });
    if (subroutine.kind === "random_damage")
      effects.push({
        kind: "damage",
        scope: "runner",
        timing: "encounter",
        resource: "damage",
        target: "corp_ice.brain_damage",
        amount: subroutine.amount,
        finite: true,
      });
    if (subroutine.kind === "trace")
      effects.push({
        kind: "trace",
        scope: "runner",
        timing: "encounter",
        target: "trace.source",
        amount: subroutine.baseTraceStrength,
        finite: true,
      });
    if (subroutine.kind === "end_the_run")
      effects.push({
        kind: "etr",
        scope: "run_path",
        timing: "encounter",
        target: "corp_ice.end_run",
        finite: true,
      });
    if (subroutine.kind === "prohibit_break_next_ice")
      effects.push({
        kind: "future_encounter_effect",
        scope: "run_path",
        timing: "encounter",
        target: "corp_ice.next_ice_break_lock",
        finite: true,
      });
    if (subroutine.kind === "trash_program")
      effects.push({
        kind: "program_trash",
        scope: "installed_program",
        timing: "encounter",
        target: "corp_ice.program_trash",
        finite: true,
      });
    if (subroutine.kind === "deflect_run")
      effects.push({
        kind: "run_lock",
        scope: "run_path",
        timing: "encounter",
        target: "run.corp_redirect",
        ...(subroutine.cost === undefined
          ? {}
          : { resource: "credits", amount: subroutine.cost.amount }),
        finite: true,
      });
    if (subroutine.kind === "end_the_run_and_trash_source_at_end_of_turn")
      effects.push(
        {
          kind: "etr",
          scope: "run_path",
          timing: "encounter",
          target: "corp_ice.end_run",
          finite: true,
        },
        {
          kind: "delayed_penalty",
          scope: "corp",
          timing: "end_of_turn",
          resource: "cards",
          target: "trash_source_at_end_of_turn",
          finite: true,
        },
      );
  }
  if (
    (engine.printedSubroutines ?? []).filter(
      (subroutine) =>
        subroutine.kind === "end_the_run" ||
        subroutine.kind === "end_the_run_and_trash_source_at_end_of_turn",
    ).length > 1
  ) {
    for (let index = effects.length - 1; index >= 0; index -= 1)
      if (
        effects[index]?.kind === "etr" &&
        effects[index]?.target === "corp_ice.end_run"
      )
        effects.splice(index, 1);
    effects.unshift({
      kind: "etr",
      scope: "run_path",
      timing: "encounter",
      target: "corp_ice.end_run",
      finite: true,
    });
    effects.splice(1, 0, {
      kind: "etr",
      scope: "run_path",
      timing: "encounter",
      target: "corp_ice.multi_end_run",
      finite: true,
    });
  }

  if (engine.selfRezCostModifiers !== undefined) {
    const rezDiscount = engine.selfRezCostModifiers.reduce(
      (total, modifier) => total + modifier.amount,
      0,
    );
    if (rezDiscount <= 0)
      throw new Error("card_spec_unknown_self_rez_cost_modifier_shape");
    effects.push({
      kind: "rez_discount",
      scope: "corp",
      timing: "during_run",
      resource: "credits",
      target: "noisy_icebreaker_self_rez_discount",
      amount: rezDiscount,
      finite: true,
    });
  }
  if (engine.runnerCounterEffects !== undefined) {
    const counterAmount = engine.printedSubroutines
      ?.find((subroutine) => subroutine.kind === "trace")
      ?.onSuccess?.find((effect) => effect.kind === "add_counter")?.amount;
    effects.push({
      kind: "persistent_counter_effect",
      scope: "runner",
      timing: "trace_success",
      resource: "counters",
      target: "baskerville_counter_run_start_net_damage",
      amount: requiredFiniteNumber(
        counterAmount,
        "runner_counter_effect.trace_add_counter.amount",
      ),
      repeatable: true,
    });
  }
  for (const window of engine.fortRunWindows ?? [])
    if (window.kind === "move_self_to_outermost_position_on_other_fort")
      effects.push({
        kind: "future_encounter_effect",
        scope: "run_path",
        timing: "start_of_run",
        target: "move_self_to_outermost_position_on_other_fort",
        finite: true,
      });

  appendClosedCorpUtilityEffects(effects, engine.corpUtility);
  appendClosedAccessEffects(effects, engine.accessEffects);
  appendClosedBreakerEffects(effects, engine);
  appendClosedRunnerLongtailEffects(effects, engine);
  appendClosedHardwareEffects(effects, engine);
  const seen = new Set<string>();
  return effects.filter((effect) => {
    const fingerprint = JSON.stringify(effect);
    if (seen.has(fingerprint)) return false;
    seen.add(fingerprint);
    return true;
  });
}

function appendClosedCorpUtilityEffects(
  effects: NonNullable<AiCardHint["effects"]>,
  utility: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"]["corpUtility"],
): void {
  if (utility?.kind === "runner_memory_limit_modifier_until_end_of_turn")
    effects.push(
      {
        kind: "global_modifier",
        scope: "runner",
        timing: "action",
        resource: "memory",
        target: "runner_memory_limit_modifier_until_end_of_turn",
        amount: -utility.amount,
        finite: true,
      },
      {
        kind: "program_trash",
        scope: "installed_program",
        timing: "action",
        target: "memory_pressure_program_trash",
        finite: true,
      },
      {
        kind: "tag_punish_payoff",
        scope: "runner",
        timing: "action",
        resource: "memory",
        target: "memory_pressure",
        amount: utility.amount,
        finite: true,
      },
    );
  if (utility?.kind === "draw_corp_cards_then_shuffle_hq_card_into_rd")
    effects.push(
      {
        kind: "draw",
        scope: "corp",
        timing: "action",
        resource: "cards",
        target: "draw.corp_draw",
        amount: utility.drawCount,
        finite: true,
      },
      {
        kind: "zone_shuffle",
        scope: "rnd",
        timing: "action",
        resource: "cards",
        target: "rnd.corp_shuffle_hq_into_rnd",
        amount: 1,
        finite: true,
      },
    );
  if (utility?.kind === "corp_archives_to_hq")
    effects.push(
      {
        kind: "card_recovery",
        scope: "archives",
        timing: "action",
        resource: "cards",
        target: "archives.corp_recovery",
        finite: true,
      },
      {
        kind: "search",
        scope: "archives",
        timing: "action",
        resource: "cards",
        target: "ice_recovery",
        finite: true,
      },
    );
  if (utility?.kind === "corp_start_turn_tag_roll_per_runner_run_last_turn")
    effects.push({
      kind: "tag_source",
      scope: "runner",
      timing: "start_of_turn",
      resource: "tags",
      target: "tag.source",
      amount: utility.tagOn,
      repeatable: true,
    });
  if (utility?.kind === "corp_draw_extra_then_bottom_one")
    effects.push(
      {
        kind: "draw",
        scope: "corp",
        timing: "persistent",
        resource: "cards",
        target: "draw.corp_draw",
        amount: utility.extraDraw,
        repeatable: true,
      },
      {
        kind: "zone_shuffle",
        scope: "rnd",
        timing: "persistent",
        resource: "cards",
        target: "bottom_one_drawn_card",
        amount: 1,
        repeatable: true,
      },
    );
  if (utility?.kind === "run_start_tax_runner_tags")
    effects.push(
      {
        kind: "run_tax",
        scope: "runner",
        timing: "start_of_run",
        resource: "credits",
        target: "tax.runner_credit",
        repeatable: true,
      },
      {
        kind: "tag_punish_payoff",
        scope: "runner",
        timing: "start_of_run",
        resource: "credits",
        target: "tag.payoff",
        repeatable: true,
      },
      {
        kind: "remote_protection",
        scope: "remote",
        timing: "persistent",
        target: "remote.scoring_protection",
      },
    );
}

function appendClosedAccessEffects(
  effects: NonNullable<AiCardHint["effects"]>,
  accesses: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"]["accessEffects"],
): void {
  for (const access of accesses ?? []) {
    effects.push({
      kind: "ambush",
      scope: "accessed_card",
      timing: "on_access",
      target: "remote.ambush",
      finite: true,
    });
    for (const effect of access.effects) {
      if (
        effect.kind ===
        "trash_other_corp_installed_cards_in_source_server_and_damage_runner"
      )
        effects.push(
          {
            kind: "damage",
            scope: "runner",
            timing: "on_access",
            resource: "damage",
            target: "access.corp_net_damage_ambush",
            repeatable: true,
          },
          {
            kind: "ice_trash",
            scope: "server",
            timing: "on_access",
            target: "ice.corp_self_trash_cost",
            finite: true,
          },
        );
      if (effect.kind === "trash_installed_runner_hardware_and_programs")
        effects.push(
          {
            kind: "hardware_trash",
            scope: "runner",
            timing: "on_access",
            target: "access.corp_hardware_trash",
            finite: true,
          },
          {
            kind: "program_trash",
            scope: "installed_program",
            timing: "on_access",
            target: "access.corp_program_trash",
            amount: effect.programAmount,
            finite: true,
          },
          {
            kind: "tag_punish_payoff",
            scope: "runner",
            timing: "on_access",
            target: "tag.payoff",
            finite: true,
          },
        );
    }
  }
}

function appendClosedBreakerEffects(
  effects: NonNullable<AiCardHint["effects"]>,
  engine: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"],
): void {
  const breaker = engine.icebreakerAbilities?.find(
    (ability) => ability.kind === "break_subroutine",
  );
  if (breaker?.kind !== "break_subroutine") return;
  effects.push({ kind: "breaker", scope: "runner", timing: "persistent" });
  if (breaker.special?.kind === "once_per_run_break_tag_and_all_stealth_loss")
    effects.push(
      {
        kind: "tag",
        scope: "runner",
        timing: "during_run",
        resource: "tags",
        target: "self_tag_after_first_sentry_break",
        amount: 1,
      },
      {
        kind: "finite_economy_pool",
        scope: "runner",
        timing: "during_run",
        resource: "credits",
        target: "stealth_credit_loss",
      },
    );
  if (breaker.special?.kind === "run_end_trash_source_if_used")
    effects.push({
      kind: "delayed_penalty",
      scope: "installed_program",
      timing: "on_leave_play",
      target: "run_end_self_trash",
    });
}

function appendClosedRunnerLongtailEffects(
  effects: NonNullable<AiCardHint["effects"]>,
  engine: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"],
): void {
  const utility = engine.runnerUtilityLongtail;
  if (utility?.kind === "hq_access_expose_all_installed_corp_cards")
    effects.push(
      {
        kind: "hq_info",
        scope: "hq",
        timing: "on_access",
        resource: "cards",
        target: "full_reveal",
      },
      {
        kind: "expose_info",
        scope: "installed_card",
        timing: "on_access",
        resource: "cards",
        target: "installed_corp_cards",
      },
    );
  if (utility?.kind === "derez_fully_broken_passed_ice")
    effects.push({
      kind: "rez",
      scope: "ice",
      timing: "encounter_resolution",
      target: "derez",
    });
  if (utility?.kind === "base_memory_equals_grip_count")
    effects.push({
      kind: "global_modifier",
      scope: "runner",
      timing: "persistent",
      resource: "memory",
      target: "base_memory_equals_grip_count",
    });
  if (utility?.kind === "trace_attempts_auto_success_add_tag")
    effects.push(
      {
        kind: "trace",
        scope: "trace",
        timing: "trace_window",
        target: "runner_trace_attempts_auto_success",
        repeatable: true,
      },
      {
        kind: "tag",
        scope: "runner",
        timing: "trace_success",
        resource: "tags",
        target: "self_tag_after_trace",
        amount: 1,
        repeatable: true,
      },
    );
  if (utility?.kind === "first_prep_credit_gain_bonus")
    effects.push({
      kind: "economy",
      scope: "runner",
      timing: "action",
      resource: "credits",
      target: "economy.conditional_burst_credit",
      amount: utility.amount,
      repeatable: true,
    });

  for (const followup of engine.successfulRunFollowups ?? [])
    if (
      followup.kind ===
      "corp_optional_shuffle_runner_grip_into_stack_then_draw_same_count"
    )
      effects.push(
        {
          kind: "access_punish",
          scope: "runner",
          timing: "after_successful_run",
          resource: "cards",
          target: "runner_grip_shuffle_stack_redraw",
          repeatable: true,
        },
        {
          kind: "zone_shuffle",
          scope: "stack",
          timing: "after_successful_run",
          resource: "cards",
          target: "runner_grip_shuffle_stack_redraw",
          repeatable: true,
        },
        {
          kind: "draw",
          scope: "runner",
          timing: "after_successful_run",
          resource: "cards",
          target: "same_count_redraw",
          repeatable: true,
        },
      );

  const event = engine.runnerEventLongtail;
  if (event?.kind === "trash_grip_search_stack_to_grip_equal_count")
    effects.push(
      {
        kind: "search",
        scope: "stack",
        timing: "action",
        resource: "cards",
        target: "stack_card_search",
        finite: true,
      },
      {
        kind: "zone_shuffle",
        scope: "stack",
        timing: "action",
        resource: "cards",
        target: "shuffle_after_search",
        finite: true,
      },
      {
        kind: "delayed_penalty",
        scope: "runner",
        timing: "action",
        resource: "cards",
        target: "trash_grip_as_search_cost",
        finite: true,
      },
    );
  if (event?.kind === "runner_corruption_agenda_point_transfer")
    effects.push(
      {
        kind: "economy",
        scope: "runner",
        timing: "action",
        resource: "credits",
        target: "credits_per_agenda_point_lost",
        amount: event.creditsPerAgendaPoint,
        finite: true,
      },
      {
        kind: "tag",
        scope: "runner",
        timing: "action",
        resource: "tags",
        target: "self_tag_after_agenda_transfer",
        amount: event.tagRunner,
        finite: true,
      },
      {
        kind: "run_tax",
        scope: "score_area",
        timing: "action",
        target: "agenda_points_given_to_corp",
        finite: true,
      },
    );
  if (event?.kind === "do_the_drine_unpreventable_core_damage_for_credits")
    effects.push(
      {
        kind: "economy",
        scope: "runner",
        timing: "action",
        resource: "credits",
        target: "credits_per_self_brain_damage",
        amount: event.creditsPerDamage,
        finite: true,
      },
      {
        kind: "damage",
        scope: "runner",
        timing: "action",
        resource: "brain_damage",
        target: "self_unpreventable_brain_damage",
        finite: true,
      },
    );
  if (event?.kind === "three_dice_gain_credits")
    effects.push({
      kind: "economy",
      scope: "runner",
      timing: "action",
      resource: "credits",
      target: "three_dice_credit_gain_expected_value",
      amount: Math.floor((event.diceCount * (event.dieFaces + 1)) / 2),
      finite: true,
    });
  if (event?.kind === "library_search_run")
    effects.push(
      {
        kind: "future_run_effect",
        scope: "runner",
        timing: "action",
        target: "make_hq_or_rnd_run",
        finite: true,
      },
      {
        kind: "multiaccess",
        scope: "hq",
        timing: "successful_run",
        resource: "cards",
        amount: event.accessBonus,
        finite: true,
      },
      {
        kind: "multiaccess",
        scope: "rnd",
        timing: "successful_run",
        resource: "cards",
        amount: event.accessBonus,
        finite: true,
      },
      {
        kind: "run_lock",
        scope: "run_path",
        timing: "during_run",
        target: "no_noisy_icebreaker_or_trace",
        finite: true,
      },
    );
}

function appendClosedHardwareEffects(
  effects: NonNullable<AiCardHint["effects"]>,
  engine: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"],
): void {
  if (engine.hardwareDeck === true)
    effects.push({
      kind: "hardware_trait",
      scope: "hardware",
      timing: "persistent",
      target: "deck_exclusive",
    });
  for (const modifier of engine.modifiers ?? []) {
    if (modifier.kind === "memory_units")
      effects.push({
        kind: "global_modifier",
        scope: "runner",
        timing: "persistent",
        resource: "memory",
        amount: modifier.amount,
      });
    if (modifier.kind === "hand_size")
      effects.push({
        kind: "hand_size_modifier",
        scope: "runner",
        timing: "persistent",
        resource: "hand_size",
        amount: modifier.amount,
      });
    if (modifier.kind === "break_subroutine_cost")
      effects.push(
        {
          kind: "run_tax",
          scope: "runner",
          timing: "during_run",
          resource: "credits",
          target: "run.break_cost_penalty",
          amount: modifier.amount,
          repeatable: true,
        },
        {
          kind: "remote_protection",
          scope: "remote",
          timing: "persistent",
          target: "remote.scoring_protection",
        },
      );
  }
  for (const source of engine.restrictedHostedCreditSource === undefined
    ? []
    : [engine.restrictedHostedCreditSource])
    for (const use of source.usableFor)
      effects.push({
        kind: "recurring_economy",
        scope: "runner",
        timing: "persistent",
        resource: "credits",
        target:
          use === "using_icebreaker_during_run"
            ? "icebreaker"
            : use === "play_events"
              ? "play_events"
              : "link",
        amount: source.capacity,
        repeatable: true,
      });
  for (const source of engine.damagePreventionSources ?? [])
    for (const damageType of source.damageTypes)
      effects.push({
        kind:
          damageType === "net"
            ? "net_damage_prevention"
            : "brain_damage_prevention",
        scope: "runner",
        timing: "prevention_window",
        resource: damageType === "net" ? "net_damage" : "brain_damage",
        ...(typeof source.amount === "number" ? { amount: source.amount } : {}),
      });
  for (const source of engine.tagPreventionSources ?? [])
    effects.push(
      {
        kind: "tag_prevention",
        scope: "runner",
        timing: "prevention_window",
        resource: "tags",
        target: "avoid_tag",
        amount: source.amount,
      },
      {
        kind: "action_penalty",
        scope: "runner",
        timing: "prevention_window",
        resource: "actions",
        target: "action_loss",
        amount: 1,
      },
    );
  for (const trigger of engine.lifecycle?.start_of_runner_turn ?? [])
    for (const effect of trigger.effects)
      if (effect.kind === "gain_credits")
        effects.push({
          kind: "economy",
          scope: "runner",
          timing: "start_of_turn",
          resource: "credits",
          target: "economy.turn_start_credit",
          amount: effect.amount,
          repeatable: true,
        });
  for (const effect of engine.lifecycle?.on_leave_play ?? []) {
    if (effect.kind === "lose_credits")
      effects.push({
        kind: "delayed_penalty",
        scope: "runner",
        timing: "on_leave_play",
        resource: "credits",
        target: "risk.leaves_play_loss",
        amount: requiredFiniteNumber(
          effect.amount,
          "lifecycle.on_leave_play.lose_credits.amount",
        ),
        finite: true,
      });
    if (effect.kind === "damage")
      effects.push({
        kind: "damage",
        scope: "runner",
        timing: "on_leave_play",
        resource: hintDamageResource(effect.damageType),
        target: "self_inflicted_brain_damage",
        amount: effect.amount,
        finite: true,
      });
  }
  if (engine.runnerUtilityLongtail?.kind === "start_turn_random_effect_table")
    for (const outcome of engine.runnerUtilityLongtail.outcomes)
      if (outcome.kind === "unpreventable_damage")
        effects.push({
          kind: "damage",
          scope: "runner",
          timing: "start_of_turn",
          resource: hintDamageResource(outcome.damageType),
          target: "self_inflicted_brain_damage",
          amount: outcome.amount,
          repeatable: true,
        });
}

function hintDamageResource(
  damageType: "net" | "meat" | "core" | "brain",
): "net_damage" | "meat_damage" | "brain_damage" {
  if (damageType === "net") return "net_damage";
  if (damageType === "meat") return "meat_damage";
  if (damageType === "core" || damageType === "brain") return "brain_damage";
  throw new Error(`card_spec_unknown_damage_type: ${String(damageType)}`);
}

function derivedFunctionSignals(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): string[] {
  const engine = entry.planning.engine;
  const signals = new Set<string>();
  if (engine.corpRootRezCreditOutcome !== undefined) {
    signals.add("economy.corp_credit_burst");
    signals.add("economy.generic");
  }
  for (const modifier of engine.modifiers ?? []) {
    if (modifier.kind === "rez_cost") signals.add("economy.rez_discount");
    if (modifier.kind === "ice_strength") signals.add("ice.strength_modifier");
  }
  for (const access of engine.accessEffects ?? []) {
    if (access.ignoreIfAccessedFrom?.includes("archives"))
      signals.add("access.archives_safe_exception");
    if (access.revealIfAccessedFrom?.includes("rd"))
      signals.add("access.rnd_reveal_requirement");
    for (const effect of access.effects)
      if (
        effect.kind === "damage" ||
        effect.kind === "damage_from_source_advancement_counters"
      ) {
        signals.add("access.corp_net_damage_ambush");
        if (effect.kind === "damage_from_source_advancement_counters")
          signals.add("advance.corp_counter_bank");
      }
  }
  if (engine.fortRunWindows !== undefined)
    for (const signal of [
      "condition.corp_installed_or_advanced_this_fort_last_turn",
      "run.corp_server_lock",
      "tax.remote",
    ])
      signals.add(signal);
  if (engine.variableRez !== undefined) {
    signals.add("corp_ice.rez_paid_scaling");
    signals.add("ice.strength_modifier");
  }
  for (const subroutine of engine.printedSubroutines ?? []) {
    if (subroutine.kind === "damage") {
      signals.add(`corp_ice.${subroutine.damageType}_damage`);
    }
    if (subroutine.kind === "end_the_run") {
      signals.add("corp_ice.end_run");
      signals.add("ice.etr");
    }
    if (subroutine.kind === "corp_gain_credit") {
      signals.add("corp_ice.credit_gain");
      signals.add("economy.corp_credit_burst");
      signals.add("economy.generic");
    }
    if (subroutine.kind === "runner_lose_credits") {
      signals.add("corp_ice.credit_loss");
      signals.add("tax.runner_credit");
      signals.add("tax.ice");
    }
    if (subroutine.kind === "give_runner_tag") {
      signals.add("corp_ice.tag_source");
      signals.add("tag.source");
    }
  }
  for (const ability of engine.abilities ?? [])
    for (const effect of ability.effects ?? []) {
      if (effect.kind === "gain_credits") {
        signals.add(`economy.${effect.recipient}_credit_burst`);
        signals.add("economy.generic");
      }
      if (effect.kind === "draw_cards")
        signals.add(`draw.${effect.recipient}_draw`);
      if (
        effect.kind === "lose_credits" &&
        effect.recipient === "runner" &&
        ability.condition?.kind === "runner_is_tagged"
      ) {
        signals.add("risk.requires_tagged_runner");
        signals.add("tag.payoff");
      }
      if (
        effect.kind === "add_hosted_credits" ||
        effect.kind === "take_hosted_credits"
      ) {
        signals.add("economy.action");
        signals.add("economy.action_credit");
        signals.add("economy.counter");
        signals.add("economy.generic");
        signals.add("economy.temporary_resource_bank");
      }
      if (effect.kind === "choose_stack_or_trash_program_install")
        for (const signal of [
          "setup.end_of_turn_bounce",
          "setup.install_discount",
          "setup.program_install",
          "setup.program_search",
          "setup.search",
          "setup.temporary_program_install",
        ])
          signals.add(signal);
    }
  if (
    engine.lifecycle?.on_install?.some(
      (effect) => effect.kind === "gain_credits",
    )
  )
    for (const signal of [
      "economy.counter",
      "economy.generic",
      "economy.high_risk_burst_credit",
    ])
      signals.add(signal);
  if (
    engine.lifecycle?.start_of_runner_turn?.some((entry) =>
      entry.effects.some((effect) => effect.kind === "lose_credits"),
    )
  )
    signals.add("economy.turn_start_credit");
  if (
    engine.lifecycle?.on_leave_play?.some(
      (effect) => effect.kind === "pay_credits_or_lose_game",
    )
  )
    for (const signal of ["risk.debt_loss_condition", "risk.lose_game_debt"])
      signals.add(signal);
  const breakerSignalAbility = engine.icebreakerAbilities?.find(
    (ability) => ability.kind === "break_subroutine",
  );
  if (breakerSignalAbility?.kind === "break_subroutine") {
    if (breakerSignalAbility.matches.kind === "ice_subtype")
      signals.add(
        `breaker.${breakerCoverageForSubtype(
          breakerSignalAbility.matches.subtype,
        )}`,
      );
    else signals.add("breaker.configurable_coverage");
  }
  if (engine.icebreakerSubtypeChange !== undefined)
    signals.add("breaker.reconfigurable_type");
  if (engine.icebreakerEncounterStrengthBonus !== undefined) {
    signals.add("breaker.strength_bonus_vs_chosen_ice");
    signals.add("breaker.targeted_ice_bonus");
  }
  if (engine.scoredAgenda !== undefined)
    for (const signal of [
      "economy.corp_install_rez_budget",
      "economy.generic",
      "install.corp_new_remote_fort_from_hq",
      "score.remote_fort_creation",
      "score.remote_install_budget",
    ])
      signals.add(signal);
  if (
    entry.definition.type === "resource" &&
    entry.definition.subtypes.includes("connection")
  )
    signals.add("resource.connection");
  if (engine.scoredAgenda?.kind === "add_counters_on_score")
    for (const signal of [
      "defense.corp_run_end_counter",
      "run.corp_end_run_counter",
      "score.action_counter_bank",
      "score.agenda_action",
      "score.run_end_counter_bank",
    ])
      signals.add(signal);
  if (
    engine.scoredAgenda?.kind === "purge_runner_virus_counters_and_prevent_next"
  )
    for (const signal of [
      "defense.virus_counter_defense",
      "virus.corp_counter_clear",
      "virus.corp_counter_prevention",
    ])
      signals.add(signal);
  if (engine.scoredAgenda?.kind === "corp_start_turn_mandatory_draw")
    for (const signal of [
      "draw.corp_draw",
      "draw.corp_recurring",
      "score.recurring_draw",
    ])
      signals.add(signal);
  if (engine.agendaAccessReplacement?.kind === "install_as_runner_program")
    for (const signal of [
      "access.corp_agenda_steal_replacement",
      "access.corp_delayed_agenda_score",
      "access.corp_runner_agenda_program_install",
      "access.runner_program_bounce",
      "risk.fragile_delayed_score",
      "risk.program_removal_denies_score",
      "risk.runner_memory_burden",
      "score.agenda_action",
      "score.closeout_agenda",
    ])
      signals.add(signal);
  if (engine.selfRezCostModifiers !== undefined)
    for (const signal of ["corp_ice.rez_economy", "economy.rez_discount"])
      signals.add(signal);
  for (const subroutine of engine.printedSubroutines ?? []) {
    if (subroutine.kind === "trace")
      for (const signal of [
        "corp_ice.trace_source",
        "damage.payoff",
        "tax.runner_persistent",
        "trace.source",
      ])
        signals.add(signal);
    if (subroutine.kind === "prohibit_break_next_ice")
      for (const signal of [
        "corp_ice.next_ice_break_lock",
        "ice.future_pressure",
      ])
        signals.add(signal);
    if (subroutine.kind === "random_damage")
      for (const signal of [
        "corp_ice.brain_damage",
        "corp_ice.random_or_guessing",
        "damage.payoff",
        "risk.random_outcome",
      ])
        signals.add(signal);
    if (subroutine.kind === "trash_program")
      signals.add("corp_ice.program_trash");
    if (subroutine.kind === "deflect_run") signals.add("run.corp_redirect");
    if (subroutine.kind === "end_the_run_and_trash_source_at_end_of_turn")
      for (const signal of [
        "corp_ice.end_run",
        "corp_ice.self_bounce_or_maintenance_drawback",
        "ice.etr",
      ])
        signals.add(signal);
  }
  if (
    (engine.printedSubroutines ?? []).filter(
      (subroutine) =>
        subroutine.kind === "end_the_run" ||
        subroutine.kind === "end_the_run_and_trash_source_at_end_of_turn",
    ).length > 1
  )
    signals.add("corp_ice.multi_end_run");
  if (engine.runnerCounterEffects !== undefined)
    for (const signal of [
      "damage.corp_persistent_damage_counter",
      "defense.corp_run_end_counter",
    ])
      signals.add(signal);
  for (const window of engine.fortRunWindows ?? [])
    if (window.kind === "move_self_to_outermost_position_on_other_fort")
      signals.add("corp_ice.mobile_position_change");
  if (
    engine.corpUtility?.kind ===
    "runner_memory_limit_modifier_until_end_of_turn"
  )
    for (const signal of [
      "risk.program_cleanup_after_mu_loss",
      "risk.requires_tagged_runner",
      "tag.payoff",
    ])
      signals.add(signal);
  if (
    engine.corpUtility?.kind === "draw_corp_cards_then_shuffle_hq_card_into_rd"
  )
    for (const signal of [
      "draw.corp_draw",
      "hq.corp_hand_refresh",
      "risk.double_operation_action_cost",
      "rnd.corp_shuffle_hq_into_rnd",
    ])
      signals.add(signal);
  if (engine.corpUtility?.kind === "corp_archives_to_hq")
    for (const signal of [
      "archives.corp_recovery",
      "info.reveal_recovered_cards_to_runner",
      "risk.double_operation_action_cost",
    ])
      signals.add(signal);
  if (
    engine.corpUtility?.kind ===
    "corp_start_turn_tag_roll_per_runner_run_last_turn"
  )
    for (const signal of [
      "condition.runner_attempted_run_last_turn",
      "risk.random_outcome",
      "tag.source",
    ])
      signals.add(signal);
  if (engine.corpUtility?.kind === "corp_draw_extra_then_bottom_one")
    for (const signal of ["draw.corp_draw", "hq.corp_hand_filter"])
      signals.add(signal);
  if (engine.corpUtility?.kind === "run_start_tax_runner_tags")
    for (const signal of [
      "condition.runner_has_one_or_more_tags",
      "tag.payoff",
      "tag.runner_credit_loss_payoff",
      "tax.runner_persistent",
    ])
      signals.add(signal);
  if (engine.successfulRunFollowups !== undefined)
    signals.add("run.successful_run_grip_reset");
  for (const access of engine.accessEffects ?? [])
    for (const effect of access.effects) {
      if (
        effect.kind ===
        "trash_other_corp_installed_cards_in_source_server_and_damage_runner"
      )
        for (const signal of [
          "access.corp_net_damage_ambush",
          "access.punish",
          "damage.payoff",
          "ice.corp_self_trash_cost",
          "remote.ambush",
          "risk.trash_own_installed_cards",
        ])
          signals.add(signal);
      if (effect.kind === "trash_installed_runner_hardware_and_programs")
        for (const signal of [
          "access.corp_hardware_trash",
          "access.corp_program_trash",
          "access.punish",
          "condition.runner_has_four_or_more_tags",
          "remote.ambush",
          "tag.payoff",
        ])
          signals.add(signal);
    }
  for (const ability of engine.abilities ?? [])
    for (const effect of ability.effects ?? []) {
      if (effect.kind === "double_chosen_ice_strength_until_end_of_turn")
        for (const signal of [
          "ice.corp_strength_support",
          "ice.corp_targeted_strength_boost",
          "ice.strength_modifier",
        ])
          signals.add(signal);
      if (effect.kind === "remove_tags") signals.add("tag.removal");
    }
  const pumpAbility = engine.icebreakerAbilities?.find(
    (ability) => ability.kind === "increase_strength",
  );
  if (
    breakerSignalAbility?.kind === "break_subroutine" &&
    breakerSignalAbility.special?.kind ===
      "once_per_run_break_tag_and_all_stealth_loss"
  )
    for (const signal of [
      "breaker.stealth_payment_loss",
      "economy.finite_pool",
    ])
      signals.add(signal);
  if (
    pumpAbility?.kind === "increase_strength" &&
    pumpAbility.duration === "current_turn"
  )
    signals.add("breaker.scaling_strength");
  if (
    breakerSignalAbility?.kind === "break_subroutine" &&
    breakerSignalAbility.matches.kind === "any"
  )
    for (const signal of [
      "breaker.emergency_coverage",
      "breaker.self_trash_risk",
      "breaker.universal",
    ])
      signals.add(signal);
  const runnerUtilityKind = engine.runnerUtilityLongtail?.kind;
  if (runnerUtilityKind === "hq_access_expose_all_installed_corp_cards")
    for (const signal of [
      "access.hq_full_reveal",
      "info.expose",
      "info.expose_installed_card",
      "info.hq",
      "info.hq_information",
    ])
      signals.add(signal);
  if (runnerUtilityKind === "derez_fully_broken_passed_ice")
    signals.add("ice.derez");
  if (runnerUtilityKind === "base_memory_equals_grip_count")
    signals.add("setup.memory");
  const runnerEventKind = engine.runnerEventLongtail?.kind;
  if (runnerEventKind === "trash_grip_search_stack_to_grip_equal_count")
    signals.add("setup.search");
  if (runnerEventKind === "runner_corruption_agenda_point_transfer")
    signals.add("economy.generic");
  if (runnerEventKind === "do_the_drine_unpreventable_core_damage_for_credits")
    signals.add("economy.generic");
  if (runnerEventKind === "three_dice_gain_credits")
    signals.add("economy.generic");
  if (runnerEventKind === "library_search_run")
    for (const signal of [
      "access.hq_multiaccess",
      "access.rnd_multiaccess",
      "run.event_tempo",
    ])
      signals.add(signal);
  if (usesClosedExtendedMechanicalProfile(entry)) {
    if (
      engine.printedSubroutines?.some(
        (subroutine) =>
          subroutine.kind === "damage" || subroutine.kind === "random_damage",
      )
    )
      signals.add("damage.payoff");
    if (engine.fortRunWindows !== undefined) signals.add("ice.future_pressure");
    if (
      engine.modifiers?.some(
        (modifier) => modifier.kind === "break_subroutine_cost",
      )
    )
      for (const signal of ["run.break_cost_penalty", "tax.runner_persistent"])
        signals.add(signal);
    if (
      pumpAbility?.kind === "increase_strength" &&
      pumpAbility.duration === "current_turn"
    )
      signals.add("breaker.scaling_strength");
    if (
      engine.abilities?.some((ability) =>
        ability.effects?.some(
          (effect) =>
            effect.kind === "make_run" &&
            effect.successfulRunAccessReplacement !== undefined,
        ),
      )
    )
      for (const signal of ["info.rnd_topdeck", "run.event_tempo"])
        signals.add(signal);
    if (
      engine.abilities?.some((ability) =>
        ability.effects?.some(
          (effect) =>
            effect.kind === "make_run" &&
            effect.corpRezCostSurcharge !== undefined,
        ),
      )
    )
      signals.add("run.event_tempo");
    if (runnerEventKind === "library_search_run") signals.add("run.lock");
    if (
      engine.abilities?.some((ability) =>
        ability.effects?.some((effect) => effect.kind === "remove_tags"),
      )
    )
      signals.add("defense.tag_prevention");
    if (
      engine.abilities?.some((ability) =>
        ability.effects?.some((effect) => effect.kind === "draw_cards"),
      )
    )
      signals.add("setup.draw");
    if (
      engine.abilities?.some((ability) =>
        ability.effects?.some((effect) => effect.kind === "gain_credits"),
      )
    )
      signals.add("economy.burst_credit");
    if (
      engine.lifecycle?.start_of_runner_turn?.some((trigger) =>
        trigger.effects.some((effect) => effect.kind === "gain_credits"),
      )
    )
      for (const signal of ["economy.generic", "economy.turn_start_credit"])
        signals.add(signal);
    if (
      engine.lifecycle?.on_leave_play?.some(
        (effect) => effect.kind === "lose_credits",
      )
    )
      signals.add("risk.leaves_play_loss");
    if (runnerUtilityKind === "trace_attempts_auto_success_add_tag")
      signals.add("risk.self_tag");
    if (runnerUtilityKind === "first_prep_credit_gain_bonus")
      for (const signal of [
        "economy.conditional_burst_credit",
        "economy.generic",
      ])
        signals.add(signal);
    if (
      engine.abilities?.some((ability) =>
        ability.effects?.some(
          (effect) => effect.kind === "private_look" && effect.zone === "hq",
        ),
      )
    )
      signals.add("info.hq");
    if (
      engine.abilities?.some((ability) =>
        ability.effects?.some(
          (effect) => effect.kind === "private_look" && effect.zone === "rd",
        ),
      )
    )
      signals.add("info.rnd_topdeck");
    if (engine.hardwareDeck === true) signals.add("setup.deck_exclusive");
    if (engine.modifiers?.some((modifier) => modifier.kind === "memory_units"))
      signals.add("setup.memory");
    if (engine.modifiers?.some((modifier) => modifier.kind === "hand_size"))
      signals.add("setup.hand_size");
    if (engine.restrictedHostedCreditSource !== undefined) {
      signals.add("economy.recurring");
      for (const use of engine.restrictedHostedCreditSource.usableFor) {
        if (use === "increase_link") {
          signals.add("economy.recurring_link_credit");
          signals.add("defense.trace_defense");
        }
        if (use === "using_icebreaker_during_run")
          signals.add("economy.recurring_breaker_credit");
      }
    }
    if (engine.damagePreventionSources !== undefined)
      for (const source of engine.damagePreventionSources)
        for (const damageType of source.damageTypes)
          signals.add(
            damageType === "net"
              ? "defense.net_damage_prevention"
              : "defense.brain_damage_prevention",
          );
    if (engine.tagPreventionSources !== undefined)
      for (const signal of ["defense.tag_prevention", "risk.action_loss"])
        signals.add(signal);
    if (runnerUtilityKind === "start_turn_random_effect_table")
      for (const signal of [
        "risk.brain_damage_self_inflicted",
        "risk.unpreventable_brain_damage",
      ])
        signals.add(signal);
    if (
      engine.abilities?.some((ability) =>
        ability.effects?.some(
          (effect) => effect.kind === "transfer_hosted_credits",
        ),
      )
    )
      for (const signal of [
        "economy.corp_action_charged_bank",
        "economy.corp_charge_bank",
        "economy.corp_counter_bank",
        "economy.finite_pool",
        "economy.generic",
        "remote.asset_economy",
      ])
        signals.add(signal);
  }
  return [...signals].sort();
}

function derivedTacticSignals(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): string[] {
  const engine = entry.planning.engine;
  const signals = new Set<string>();
  if (engine.corpRootRezCreditOutcome !== undefined)
    signals.add("economy.corp_credit_burst");
  for (const modifier of engine.modifiers ?? []) {
    if (modifier.kind === "rez_cost") signals.add("ice.corp_rez_discount");
    if (modifier.kind === "ice_strength")
      signals.add("ice.corp_strength_support");
    if (modifier.kind === "rez_cost" || modifier.kind === "ice_strength")
      signals.add("tax.ice");
  }
  for (const access of engine.accessEffects ?? []) {
    if (access.ignoreIfAccessedFrom?.includes("archives"))
      signals.add("access.archives_safe_exception");
    if (access.revealIfAccessedFrom?.includes("rd"))
      signals.add("access.rnd_reveal_requirement");
    for (const effect of access.effects) {
      if (
        (effect.kind === "damage" ||
          effect.kind === "damage_from_source_advancement_counters") &&
        effect.damageType === "net"
      ) {
        signals.add("access.corp_net_damage_ambush");
      }
      if (effect.kind === "damage_from_source_advancement_counters")
        signals.add("advance.corp_counter_bank");
    }
  }
  if (engine.variableRez?.kind === "x_strength")
    signals.add("corp_ice.rez_paid_scaling");
  for (const subroutine of engine.printedSubroutines ?? []) {
    if (subroutine.kind === "damage") {
      signals.add("corp_ice.damage_source");
      signals.add(`corp_ice.${subroutine.damageType}_damage`);
    }
    if (subroutine.kind === "end_the_run") signals.add("corp_ice.end_run");
    if (subroutine.kind === "corp_gain_credit")
      for (const signal of [
        "corp_ice.credit_gain",
        "economy.corp_credit_burst",
      ])
        signals.add(signal);
    if (subroutine.kind === "runner_lose_credits") {
      signals.add("economy.runner_credit_loss");
      signals.add("tax.runner_credit");
      signals.add("tax.ice");
    }
    if (subroutine.kind === "give_runner_tag") {
      signals.add("corp_ice.tag_source");
      signals.add("tag.source");
    }
  }
  for (const ability of engine.abilities ?? [])
    for (const effect of ability.effects ?? []) {
      if (effect.kind === "gain_credits")
        signals.add(`economy.${effect.recipient}_credit_burst`);
      if (effect.kind === "draw_cards")
        signals.add(`draw.${effect.recipient}_draw`);
      if (
        effect.kind === "lose_credits" &&
        effect.recipient === "runner" &&
        ability.condition?.kind === "runner_is_tagged"
      ) {
        signals.add("risk.requires_tagged_runner");
        signals.add("tag.payoff");
      }
    }
  for (const ability of engine.abilities ?? [])
    if (
      ability.effects?.some(
        (effect) => effect.kind === "choose_stack_or_trash_program_install",
      )
    )
      signals.add("setup.search");
  for (const window of engine.fortRunWindows ?? [])
    if (window.kind === "server_run_start_restriction") {
      signals.add("run.corp_server_lock");
      signals.add("condition.corp_installed_or_advanced_this_fort_last_turn");
    }
  if (
    engine.scoredAgenda?.kind ===
    "score_install_hq_cards_into_new_remote_then_rez"
  ) {
    signals.add("score.remote_fort_creation");
    signals.add("score.remote_install_budget");
  }
  if (usesClosedExtendedMechanicalProfile(entry)) {
    const tacticFunctionSignals = new Set([
      "access.corp_agenda_steal_replacement",
      "access.corp_delayed_agenda_score",
      "access.corp_hardware_trash",
      "access.corp_net_damage_ambush",
      "access.corp_program_trash",
      "access.corp_runner_agenda_program_install",
      "archives.corp_recovery",
      "condition.runner_attempted_run_last_turn",
      "condition.runner_has_four_or_more_tags",
      "condition.runner_has_one_or_more_tags",
      "corp_ice.brain_damage",
      "corp_ice.end_run",
      "corp_ice.mobile_position_change",
      "corp_ice.multi_end_run",
      "corp_ice.next_ice_break_lock",
      "corp_ice.program_trash",
      "corp_ice.random_or_guessing",
      "corp_ice.rez_economy",
      "corp_ice.self_bounce_or_maintenance_drawback",
      "corp_ice.trace_source",
      "damage.corp_persistent_damage_counter",
      "defense.corp_run_end_counter",
      "defense.virus_counter_defense",
      "draw.corp_draw",
      "draw.corp_recurring",
      "economy.corp_action_charged_bank",
      "economy.corp_counter_bank",
      "hq.corp_hand_filter",
      "hq.corp_hand_refresh",
      "ice.corp_strength_support",
      "ice.corp_targeted_strength_boost",
      "ice.etr",
      "info.reveal_recovered_cards_to_runner",
      "risk.action_loss",
      "risk.brain_damage_self_inflicted",
      "risk.double_operation_action_cost",
      "risk.fragile_delayed_score",
      "risk.leaves_play_loss",
      "risk.program_cleanup_after_mu_loss",
      "risk.program_removal_denies_score",
      "risk.random_outcome",
      "risk.requires_tagged_runner",
      "risk.runner_memory_burden",
      "risk.self_tag",
      "risk.trash_own_installed_cards",
      "risk.unpreventable_brain_damage",
      "rnd.corp_shuffle_hq_into_rd",
      "remote.asset_economy",
      "run.break_cost_penalty",
      "run.corp_end_run_counter",
      "run.corp_redirect",
      "run.successful_run_grip_reset",
      "score.recurring_draw",
      "score.run_end_counter_bank",
      "tag.payoff",
      "tag.runner_credit_loss_payoff",
      "tag.source",
      "tax.runner_persistent",
      "trace.source",
      "virus.corp_counter_clear",
      "virus.corp_counter_prevention",
    ]);
    for (const signal of derivedFunctionSignals(entry))
      if (tacticFunctionSignals.has(signal)) signals.add(signal);
    for (const subroutine of engine.printedSubroutines ?? []) {
      if (subroutine.kind === "damage") signals.add("corp_ice.damage_source");
      if (subroutine.kind === "random_damage")
        signals.add("corp_ice.damage_source");
      if (subroutine.kind === "deflect_run")
        signals.add("corp_ice.encounter_tax");
      if (subroutine.kind === "prohibit_break_next_ice")
        signals.add("corp_ice.run_lock");
    }
    if (engine.corpUtility?.kind === "corp_archives_to_hq")
      for (const signal of ["hq.corp_ice_recovery", "ice.corp_recovery"])
        signals.add(signal);
    if (
      engine.corpUtility?.kind ===
      "draw_corp_cards_then_shuffle_hq_card_into_rd"
    )
      signals.add("rnd.corp_shuffle_hq_into_rnd");
    if (engine.corpUtility?.kind === "corp_draw_extra_then_bottom_one")
      signals.add("draw.corp_recurring");
    if (
      engine.corpUtility?.kind ===
      "runner_memory_limit_modifier_until_end_of_turn"
    )
      for (const signal of [
        "runner.memory_reduction",
        "tag.runner_memory_pressure",
      ])
        signals.add(signal);
  }
  for (const annotation of allPlanningAnnotations(entry))
    if (annotation.kind === "tactic_interpretation")
      signals.add(
        closedPlanningValue(
          annotation.signal,
          KNOWN_PLANNING_TACTIC_SIGNALS,
          "tactic_signal",
        ),
      );
  return [...signals].sort();
}

function valueHintKey(axis: string): keyof AiRuntimeValueHints {
  if (axis === "economy") return "economy";
  if (axis === "remote_root_value") return "remoteRootValue";
  throw new Error(`card_spec_unknown_value_axis: ${axis}`);
}

function derivedActionStrategyEvidence(
  engine: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"],
  capabilityKey: string,
  strategyId: string,
  role: string,
  roleDetail: string,
  evidenceAnchor: Extract<
    PlanningInterpretation,
    { kind: "strategy_support" }
  >["evidenceAnchor"],
): string[] {
  const node = addressableEngineNode(engine, capabilityKey);
  if (node === undefined)
    throw new Error(
      `card_spec_action_strategy_capability_missing: ${capabilityKey}`,
    );
  const kind = node.kind;
  let expectedAnchor:
    | NonNullable<
        Extract<
          PlanningInterpretation,
          { kind: "strategy_support" }
        >["evidenceAnchor"]
      >
    | undefined;
  let expectedRole: "anchor_evidence" | "payoff_anchor" | undefined;
  if (
    kind === "corp_start_turn_tag_roll_per_runner_run_last_turn" ||
    kind === "runner_corruption_agenda_point_transfer" ||
    kind === "trace_attempts_auto_success_add_tag" ||
    (kind === "break_subroutine" &&
      isRecord(node.special) &&
      node.special.kind === "once_per_run_break_tag_and_all_stealth_loss")
  ) {
    expectedAnchor = "tag.source";
    expectedRole = "anchor_evidence";
  } else if (
    kind === "runner_memory_limit_modifier_until_end_of_turn" ||
    kind === "run_start_tax_runner_tags" ||
    (kind === "on_access" &&
      isRecord(node.condition) &&
      node.condition.kind === "runner_tags_at_least")
  ) {
    expectedAnchor = "tag.payoff";
    expectedRole = "payoff_anchor";
  } else if (kind === "trace") {
    expectedAnchor = "trace.source";
    expectedRole = "anchor_evidence";
  } else if (kind === "library_search_run") {
    expectedRole = "payoff_anchor";
    if (strategyId === "runner.hq_pressure")
      expectedAnchor = "access.hq_multiaccess";
    else if (strategyId === "runner.rnd_pressure")
      expectedAnchor = "access.rnd_multiaccess";
    else if (
      strategyId === "runner.interface_closeout" &&
      (evidenceAnchor === "access.hq_multiaccess" ||
        evidenceAnchor === "access.rnd_multiaccess")
    )
      expectedAnchor = evidenceAnchor;
  }
  const expectedStrategy =
    kind === "library_search_run"
      ? new Set([
          "runner.hq_pressure",
          "runner.interface_closeout",
          "runner.rnd_pressure",
        ])
      : new Set(["corp.tag_trace_punish"]);
  const expectedRoleDetail =
    expectedAnchor === undefined || expectedRole === undefined
      ? undefined
      : `${expectedRole}_${expectedAnchor.replaceAll(".", "_")}`;
  if (
    !expectedStrategy.has(strategyId) ||
    evidenceAnchor !== expectedAnchor ||
    role !== expectedRole ||
    roleDetail !== expectedRoleDetail
  )
    throw new Error(
      `card_spec_action_strategy_binding_mismatch: ${capabilityKey}:${strategyId}`,
    );
  return [`tactic_signal_anchor:${expectedAnchor}`];
}

function addressableEngineNode(
  value: unknown,
  capabilityKey: string,
): Record<string, unknown> | undefined {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const match = addressableEngineNode(entry, capabilityKey);
      if (match !== undefined) return match;
    }
    return undefined;
  }
  if (!isRecord(value)) return undefined;
  if (value.capabilityKey === capabilityKey) return value;
  for (const entry of Object.values(value)) {
    const match = addressableEngineNode(entry, capabilityKey);
    if (match !== undefined) return match;
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function additionalClickAmount(costs: unknown): number {
  if (!isRecord(costs) || costs.additionalClicks === undefined) return 0;
  if (costs.additionalClicks !== 1)
    throw new Error("card_spec_unknown_additional_click_cost");
  return costs.additionalClicks;
}

function requiredFiniteNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value))
    throw new Error(`card_spec_required_number_missing: ${field}`);
  return value;
}

function derivedStrategyEvidence(
  engine: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"],
  strategyId?: string,
): string[] {
  const printed = engine.printedSubroutines ?? [];
  const hasTrace = printed.some((subroutine) => subroutine.kind === "trace");
  const hasBreakLock = printed.some(
    (subroutine) => subroutine.kind === "prohibit_break_next_ice",
  );
  const hasDeflect = printed.some(
    (subroutine) => subroutine.kind === "deflect_run",
  );
  if (strategyId === "corp.damage_kill" && hasTrace)
    return [
      "corp_ice.damage_source",
      "corp_ice.net_damage",
      "damage.corp_persistent_damage_counter",
      "damage.payoff",
    ];
  if (strategyId === "corp.ice_tax_glacier" && hasTrace)
    return [
      "corp_ice.damage_source",
      "corp_ice.end_run",
      "corp_ice.net_damage",
    ];
  if (strategyId === "corp.damage_kill" && hasBreakLock)
    return ["corp_ice.damage_source", "corp_ice.net_damage", "damage.payoff"];
  if (strategyId === "corp.ice_tax_glacier" && hasBreakLock)
    return ["corp_ice.next_ice_break_lock", "corp_ice.run_lock"];
  if (hasDeflect) {
    if (strategyId === "corp.ice_tax_glacier")
      return ["corp_ice.encounter_tax", "run.corp_redirect"];
    if (
      strategyId === "corp.remote_scoring" ||
      strategyId === "corp.central_stabilize"
    )
      return ["run.corp_redirect"];
  }
  if (
    strategyId === "corp.ice_tax_glacier" &&
    engine.fortRunWindows?.some(
      (window) =>
        window.kind === "move_self_to_outermost_position_on_other_fort",
    )
  )
    return [
      "corp_ice.mobile_position_change",
      "corp_ice.multi_end_run",
      "corp_ice.end_run",
    ];
  const destructiveAccess = engine.accessEffects?.flatMap(
    (access) => access.effects,
  );
  if (
    destructiveAccess?.some(
      (effect) =>
        effect.kind ===
        "trash_other_corp_installed_cards_in_source_server_and_damage_runner",
    )
  )
    return strategyId === "corp.ambush_bluff"
      ? ["remote.ambush", "access.corp_net_damage_ambush", "access.punish"]
      : ["access.corp_net_damage_ambush", "damage.payoff"];
  if (
    destructiveAccess?.some(
      (effect) =>
        effect.kind === "trash_installed_runner_hardware_and_programs",
    )
  )
    return strategyId === "corp.ambush_bluff"
      ? [
          "remote.ambush",
          "access.corp_hardware_trash",
          "access.corp_program_trash",
          "access.punish",
        ]
      : [
          "condition.runner_has_four_or_more_tags",
          "tag.payoff",
          "access.corp_hardware_trash",
          "access.corp_program_trash",
        ];
  const evidence = new Set<string>();
  const add = (...signals: string[]) =>
    signals.forEach((signal) => evidence.add(signal));
  for (const scored of engine.scoredAgenda === undefined
    ? []
    : [engine.scoredAgenda]) {
    if (scored.kind === "add_counters_on_score")
      add(
        "score.run_end_counter_bank",
        "run.corp_end_run_counter",
        "defense.corp_run_end_counter",
      );
    if (scored.kind === "purge_runner_virus_counters_and_prevent_next")
      add(
        "virus.corp_counter_clear",
        "virus.corp_counter_prevention",
        "defense.virus_counter_defense",
      );
    if (scored.kind === "corp_start_turn_mandatory_draw")
      add("draw.corp_recurring", "score.recurring_draw");
  }
  if (engine.agendaAccessReplacement?.kind === "install_as_runner_program")
    add(
      "access.corp_agenda_steal_replacement",
      "risk.fragile_delayed_score",
      "risk.program_removal_denies_score",
    );
  for (const utility of engine.corpUtility === undefined
    ? []
    : [engine.corpUtility]) {
    if (utility.kind === "corp_archives_to_hq")
      add(
        "archives.corp_recovery",
        "hq.corp_ice_recovery",
        "ice.corp_recovery",
        "info.reveal_recovered_cards_to_runner",
      );
    if (utility.kind === "corp_start_turn_tag_roll_per_runner_run_last_turn")
      add("condition.runner_attempted_run_last_turn", "tag.source");
    if (utility.kind === "corp_draw_extra_then_bottom_one")
      add("draw.corp_draw", "draw.corp_recurring", "hq.corp_hand_filter");
    if (utility.kind === "run_start_tax_runner_tags")
      add("tag.payoff", "tag.runner_credit_loss_payoff");
    if (utility.kind === "runner_memory_limit_modifier_until_end_of_turn")
      add(
        "tag.payoff",
        "tag.runner_memory_pressure",
        "runner.memory_reduction",
      );
  }
  for (const followup of engine.successfulRunFollowups ?? [])
    if (
      followup.kind ===
      "corp_optional_shuffle_runner_grip_into_stack_then_draw_same_count"
    )
      add("run.successful_run_grip_reset");
  for (const modifier of engine.modifiers ?? []) {
    if (modifier.kind === "rez_cost") evidence.add("ice.corp_rez_discount");
    if (modifier.kind === "ice_strength")
      evidence.add("ice.corp_strength_support");
    evidence.add("tax.ice");
  }
  for (const access of engine.accessEffects ?? [])
    if (
      access.effects.some(
        (effect) =>
          (effect.kind === "damage" ||
            effect.kind === "damage_from_source_advancement_counters") &&
          effect.damageType === "net",
      )
    ) {
      evidence.add("access.corp_net_damage_ambush");
      if (strategyId === "corp.ambush_bluff") evidence.add("access.punish");
      if (strategyId === "corp.damage_kill") evidence.add("damage.payoff");
    } else if (
      access.effects.some(
        (effect) =>
          effect.kind ===
          "trash_other_corp_installed_cards_in_source_server_and_damage_runner",
      )
    ) {
      evidence.add("remote.ambush");
      evidence.add("access.corp_net_damage_ambush");
      if (strategyId === "corp.ambush_bluff") evidence.add("access.punish");
      if (strategyId === "corp.damage_kill") evidence.add("damage.payoff");
    } else if (
      access.effects.some(
        (effect) =>
          effect.kind === "trash_installed_runner_hardware_and_programs",
      )
    ) {
      add(
        "remote.ambush",
        "access.corp_hardware_trash",
        "access.corp_program_trash",
      );
      if (strategyId === "corp.ambush_bluff") evidence.add("access.punish");
      if (access.condition?.kind === "runner_tags_at_least")
        add("condition.runner_has_four_or_more_tags", "tag.payoff");
    }
  for (const ability of engine.abilities ?? [])
    if (
      ability.effects?.some(
        (effect) =>
          effect.kind === "double_chosen_ice_strength_until_end_of_turn",
      )
    )
      add("ice.corp_targeted_strength_boost", "ice.corp_strength_support");
  const extendedPrintedEvidence = (engine.printedSubroutines ?? []).some(
    (subroutine) =>
      subroutine.kind === "random_damage" ||
      subroutine.kind === "trace" ||
      subroutine.kind === "prohibit_break_next_ice" ||
      subroutine.kind === "deflect_run" ||
      subroutine.kind === "end_the_run_and_trash_source_at_end_of_turn" ||
      subroutine.kind === "trash_program",
  );
  if (extendedPrintedEvidence)
    for (const subroutine of engine.printedSubroutines ?? []) {
      if (subroutine.kind === "damage") {
        add(
          "corp_ice.damage_source",
          `corp_ice.${subroutine.damageType}_damage`,
        );
        if (strategyId === "corp.damage_kill") evidence.add("damage.payoff");
      }
      if (subroutine.kind === "random_damage")
        add(
          "corp_ice.brain_damage",
          "corp_ice.damage_source",
          "damage.payoff",
          "risk.random_outcome",
        );
      if (subroutine.kind === "end_the_run") evidence.add("corp_ice.end_run");
      if (subroutine.kind === "prohibit_break_next_ice")
        add("corp_ice.next_ice_break_lock", "corp_ice.run_lock");
      if (subroutine.kind === "deflect_run")
        add("corp_ice.encounter_tax", "run.corp_redirect");
    }
  if (
    (engine.printedSubroutines ?? []).filter(
      (subroutine) => subroutine.kind === "end_the_run",
    ).length > 1
  )
    add("corp_ice.multi_end_run");
  for (const window of engine.fortRunWindows ?? [])
    if (window.kind === "move_self_to_outermost_position_on_other_fort")
      add("corp_ice.mobile_position_change");
  for (const counter of engine.runnerCounterEffects ?? [])
    if (counter.runStart?.kind === "damage")
      add("damage.corp_persistent_damage_counter");
  if (
    engine.scoredAgenda?.kind ===
    "score_install_hq_cards_into_new_remote_then_rez"
  ) {
    evidence.add("score.remote_fort_creation");
    evidence.add("score.remote_install_budget");
  }
  for (const window of engine.fortRunWindows ?? [])
    if (window.kind === "server_run_start_restriction") {
      evidence.add("run.corp_server_lock");
      evidence.add("condition.corp_installed_or_advanced_this_fort_last_turn");
    }
  if (engine.variableRez?.kind === "x_strength")
    evidence.add("corp_ice.rez_paid_scaling");
  if (
    engine.abilities?.some(
      (ability) =>
        ability.condition?.kind === "runner_is_tagged" &&
        ability.effects?.some(
          (effect) =>
            effect.kind === "lose_credits" && effect.recipient === "runner",
        ),
    )
  ) {
    evidence.add("punish.payoff");
    evidence.add("tag.payoff");
  }
  if (strategyId !== undefined && evidence.size === 0)
    throw new Error(
      `card_spec_strategy_support_evidence_missing: ${strategyId}`,
    );
  return [...evidence].sort();
}
