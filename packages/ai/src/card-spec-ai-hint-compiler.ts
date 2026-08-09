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
  "advanceable",
  "fortRunWindows",
  "icebreakerAbilities",
  "icebreakerEncounterStrengthBonus",
  "icebreakerSubtypeChange",
  "installCapabilities",
  "installTargetBinding",
  "lifecycle",
  "modifiers",
  "printedSubroutines",
  "scoredAgenda",
  "variableRez",
]);

export function deriveCardSpecAiHint(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): AiCardHint {
  for (const field of Object.keys(entry.planning.engine))
    if (!CARD_SPEC_HINT_ENGINE_FIELDS.has(field))
      throw new Error(`card_spec_hint_unsupported_family: ${field}`);
  const annotations = entry.planning.planningAnnotations?.card ?? [];
  const planRoles = annotations.flatMap((annotation) =>
    annotation.kind === "plan_role" ? [annotation.role] : [],
  );
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
            : 3;
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
  const targetProfiles = deriveTargetProfiles(entry);
  const breakerProfile = deriveBreakerProfile(entry.planning.engine);
  const effects = deriveHintEffects(entry);
  const functionSignals = derivedFunctionSignals(entry);
  const tacticSignals = derivedTacticSignals(entry);
  const actionTacticSignals = deriveActionTacticSignals(entry, effects);
  const conditions = deriveConditions(entry.planning.engine);
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
    ...(strategySupportPairs.length === 0 ||
    entry.planning.engine.abilities?.some(
      (ability) => ability.kind === "on_play",
    ) !== true
      ? {}
      : { actionStrategySupportPairs: strategySupportPairs }),
    ...(targetProfiles.length === 0 ? {} : { targetProfiles }),
    ...(breakerProfile === undefined ? {} : { breakerProfile }),
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
  if (cardType === "agenda" && engine.scoredAgenda === undefined) {
    roles.add("agenda");
    roles.add("score_plan");
    if (entry.definition.agendaPoints !== undefined)
      roles.add(`agenda_${entry.definition.agendaPoints}pt`);
    roles.add("no_ability_agenda");
  }
  if (cardType === "hardware" && engine.characteristics.memoryLimitBonus) {
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
      pumpAbility.cost.amount <= 1
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
  if (entry.planning.engine.scoredAgenda !== undefined)
    for (const role of ["corp", "agenda", "per_card_longtail"]) roles.add(role);
  if (entry.planning.engine.fortRunWindows !== undefined)
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
  return [...new Set(risks)];
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

function deriveConditions(
  engine: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"],
): NonNullable<AiCardHint["conditions"]> {
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
  const breakAbility = engine.icebreakerAbilities?.find(
    (ability) => ability.kind === "break_subroutine",
  );
  if (breakAbility?.kind === "break_subroutine") {
    if (breakAbility.matches.kind === "ice_subtype")
      signals.add(
        `breaker.${breakerCoverageForSubtype(breakAbility.matches.subtype)}`,
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

function derivedStrategyEvidence(
  engine: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"],
  strategyId?: string,
): string[] {
  const evidence = new Set<string>();
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
    }
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
