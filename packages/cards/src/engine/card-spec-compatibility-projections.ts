import type {
  CardDefinitionId,
  ResolvedCardDefinition,
  SubroutineDefinition,
} from "@netgrid/shared";
import type {
  CardMechanicalDefinition,
  CardMechanicalSpec,
} from "./card-mechanical-contracts";
import type { CardSpec } from "../contracts";
import type { EngineCardView } from "../projections";
import { deepFreezeSerializable, type DeepReadonly } from "../serializable";

export type CardSpecCardImplementation = {
  cardDefinitionId: CardDefinitionId;
} & Pick<
  CardMechanicalDefinition,
  | "abilities"
  | "accessEffects"
  | "accessHooks"
  | "agendaAccessReplacement"
  | "advanceable"
  | "corpTrashInstalledRunnerSource"
  | "corpUtility"
  | "corpRootRezCreditOutcome"
  | "damagePreventionSources"
  | "flatlineReplacementSources"
  | "fortCapacityModifiers"
  | "fortRunWindows"
  | "hardwareDeck"
  | "hiddenReplacementLongtail"
  | "hostedProgramCapacity"
  | "hostedProgramModifiers"
  | "iceEncounter"
  | "icebreakerAbilities"
  | "icebreakerEncounterStrengthBonus"
  | "icebreakerSubtypeChange"
  | "installAdditionalCosts"
  | "installCapabilities"
  | "installTargetBinding"
  | "leavePlayCleanup"
  | "lifecycle"
  | "modifiers"
  | "relativeIce"
  | "remainingReplacementLongtail"
  | "restrictedHostedCreditSource"
  | "runEncounterInterventions"
  | "runnerCounterEffects"
  | "runnerEventLongtail"
  | "runnerEventTargetedEffect"
  | "runnerRunStrengthBoost"
  | "runnerUtilityLongtail"
  | "scoredAgenda"
  | "selfRezAdditionalCosts"
  | "selfRezCostModifiers"
  | "selfRezWindows"
  | "selfStealCosts"
  | "successfulRunFollowups"
  | "tagPreventionSources"
  | "trashPreventionSources"
  | "unique"
  | "uniqueDirectLongtail"
  | "variableRez"
  | "virusCounter"
>;
type CardSpecCardImplementationFamilies = Omit<
  CardSpecCardImplementation,
  "cardDefinitionId"
>;

/**
 * Compatibility bridge for consumers that still require the pre-CardSpec definition
 * shape. Every field is derived from one registry projection pair; this is
 * not an authoring surface. Remove with the legacy CardDefinition consumers
 * in CS11.
 */
export function projectCardSpecDefinition(
  engineView: DeepReadonly<EngineCardView>,
  spec: DeepReadonly<CardSpec>,
): ResolvedCardDefinition {
  if (engineView.cardDefinitionId !== spec.identity.cardDefinitionId)
    throw new Error("card_spec_projection_definition_mismatch");
  const characteristics = engineView.engine.characteristics;
  const numeric = characteristics.numeric;
  const strength = characteristics.strength;
  const subroutines = projectPrintedSubroutines(engineView.engine);
  return deepFreezeSerializable({
    id: spec.identity.cardDefinitionId,
    title: spec.identity.title,
    side: spec.identity.side,
    type: spec.identity.cardType,
    subtypes: [...characteristics.subtypes],
    implementationStatus: "playable_mvp",
    ...(spec.identity.cardType === "event" ||
    spec.identity.cardType === "operation"
      ? {
          playCost: characteristics.playCost,
          ...(characteristics.playCost?.kind === "fixed"
            ? { cost: characteristics.playCost.credits }
            : {}),
        }
      : { playCost: null }),
    ...(numeric.installCost !== null
      ? { installCost: numeric.installCost }
      : {}),
    ...(numeric.memoryCost !== null ? { memoryCost: numeric.memoryCost } : {}),
    ...(numeric.rezCost !== null ? { rezCost: numeric.rezCost } : {}),
    ...(numeric.trashCost !== null ? { trashCost: numeric.trashCost } : {}),
    ...(numeric.advancementRequirement !== null
      ? { advancementRequirement: numeric.advancementRequirement }
      : {}),
    ...(numeric.agendaPoints !== null
      ? { agendaPoints: numeric.agendaPoints }
      : {}),
    ...(strength.kind === "fixed"
      ? { strength: strength.value }
      : strength.kind === "not_applicable"
        ? {}
        : { variableStrength: { ...strength } }),
    ...(characteristics.baseLink !== undefined
      ? { baseLink: characteristics.baseLink }
      : {}),
    ...(characteristics.memoryLimitBonus !== undefined
      ? { memoryLimitBonus: characteristics.memoryLimitBonus }
      : {}),
    ...(characteristics.maxHandSizeBonus !== undefined
      ? { maxHandSizeBonus: characteristics.maxHandSizeBonus }
      : {}),
    ...(characteristics.recurringCredits !== undefined
      ? { recurringCredits: characteristics.recurringCredits }
      : {}),
    numeric: {
      cost:
        characteristics.playCost?.kind === "fixed"
          ? characteristics.playCost.credits
          : null,
      installCost: numeric.installCost,
      memoryCost: numeric.memoryCost,
      strength: strength.kind === "fixed" ? strength.value : null,
      rezCost: numeric.rezCost,
      trashCost: numeric.trashCost,
      advancementRequirement: numeric.advancementRequirement,
      agendaPoints: numeric.agendaPoints,
    },
    strengthModel: { ...strength },
    rulesText: spec.text.rulesText,
    ...(subroutines.length > 0 ? { subroutines } : {}),
    mechanics: deriveMechanicTokens(spec.identity.cardType, engineView.engine),
    ...(spec.text.markCounterDisplay !== undefined
      ? { markCounterDisplay: { ...spec.text.markCounterDisplay } }
      : {}),
  }) as ResolvedCardDefinition;
}

export function projectCardSpecImplementation(
  engineView: DeepReadonly<EngineCardView>,
  spec: DeepReadonly<CardSpec>,
): CardSpecCardImplementation {
  if (engineView.cardDefinitionId !== spec.identity.cardDefinitionId)
    throw new Error("card_spec_projection_definition_mismatch");
  const {
    schemaVersion: _schemaVersion,
    characteristics: _characteristics,
    printedSubroutines: _printedSubroutines,
    regionBaseline: _regionBaseline,
    ...families
  } = engineView.engine;
  assertCardSpecImplementationFamilies(families);
  const labels = new Map(
    (spec.text.capabilityText ?? []).map((entry) => [
      entry.capabilityKey,
      entry.actionLabel,
    ]),
  );
  return deepFreezeSerializable({
    cardDefinitionId: engineView.cardDefinitionId,
    ...(cloneWithCapabilityLabels(
      families,
      labels,
    ) as CardSpecCardImplementationFamilies),
  }) as CardSpecCardImplementation;
}

const CARD_SPEC_IMPLEMENTATION_FAMILY_LIST = [
  "abilities",
  "accessEffects",
  "accessHooks",
  "agendaAccessReplacement",
  "advanceable",
  "corpTrashInstalledRunnerSource",
  "corpUtility",
  "corpRootRezCreditOutcome",
  "damagePreventionSources",
  "flatlineReplacementSources",
  "fortCapacityModifiers",
  "fortRunWindows",
  "hardwareDeck",
  "hiddenReplacementLongtail",
  "hostedProgramCapacity",
  "hostedProgramModifiers",
  "iceEncounter",
  "icebreakerAbilities",
  "icebreakerEncounterStrengthBonus",
  "icebreakerSubtypeChange",
  "installAdditionalCosts",
  "installCapabilities",
  "installTargetBinding",
  "leavePlayCleanup",
  "lifecycle",
  "modifiers",
  "relativeIce",
  "remainingReplacementLongtail",
  "restrictedHostedCreditSource",
  "runEncounterInterventions",
  "runnerCounterEffects",
  "runnerEventLongtail",
  "runnerEventTargetedEffect",
  "runnerRunStrengthBoost",
  "runnerUtilityLongtail",
  "scoredAgenda",
  "selfRezAdditionalCosts",
  "selfRezCostModifiers",
  "selfRezWindows",
  "selfStealCosts",
  "successfulRunFollowups",
  "tagPreventionSources",
  "trashPreventionSources",
  "unique",
  "uniqueDirectLongtail",
  "variableRez",
  "virusCounter",
] as const satisfies readonly (keyof CardSpecCardImplementationFamilies)[];

const CARD_SPEC_IMPLEMENTATION_FAMILIES = new Set<string>(
  CARD_SPEC_IMPLEMENTATION_FAMILY_LIST,
);

function assertCardSpecImplementationFamilies(
  families: Record<string, unknown>,
): void {
  for (const family of Object.keys(families))
    if (!CARD_SPEC_IMPLEMENTATION_FAMILIES.has(family))
      throw new Error(`card_spec_unhandled_implementation_family:${family}`);
}

export function hasCardSpecImplementation(
  engine: DeepReadonly<CardMechanicalSpec>,
): boolean {
  return Object.entries(engine).some(
    ([family, value]) =>
      family !== "schemaVersion" &&
      family !== "characteristics" &&
      family !== "printedSubroutines" &&
      family !== "regionBaseline" &&
      value !== undefined &&
      (!Array.isArray(value) || value.length > 0),
  );
}

/** Temporary CS06 aliases retained only for existing slice-focused tests. */
export type Cs06CardImplementation = CardSpecCardImplementation;
export const projectCs06CardDefinition = projectCardSpecDefinition;
export const projectCs06CardImplementation = projectCardSpecImplementation;

function projectPrintedSubroutines(
  engine: DeepReadonly<CardMechanicalSpec>,
): SubroutineDefinition[] {
  assertDynamicDamageSubroutineBinding(engine);
  return (engine.printedSubroutines ?? []).map((subroutine) => {
    if (subroutine.kind === "damage") {
      const amount =
        typeof subroutine.amount === "number"
          ? { amount: subroutine.amount }
          : {
              derivedAmount: {
                kind: "relative_ice_dynamic_damage" as const,
                ownerCapabilityKey: String(
                  subroutine.amount.ownerCapabilityKey,
                ),
              },
            };
      return {
        id: subroutine.capabilityKey,
        type: "do_damage",
        damageType:
          subroutine.damageType === "brain" ? "core" : subroutine.damageType,
        ...amount,
      } satisfies SubroutineDefinition;
    }
    if (subroutine.kind === "end_the_run")
      return {
        id: subroutine.capabilityKey,
        type: "end_the_run",
      } satisfies SubroutineDefinition;
    if (subroutine.kind === "end_the_run_and_trash_source_at_end_of_turn")
      return {
        id: subroutine.capabilityKey,
        type: "end_the_run_and_trash_source_at_end_of_turn",
      } satisfies SubroutineDefinition;
    if (subroutine.kind === "trash_program")
      return {
        id: subroutine.capabilityKey,
        type: "trash_installed_program",
      } satisfies SubroutineDefinition;
    if (subroutine.kind === "trash_program_unless_runner_pays")
      return {
        id: subroutine.capabilityKey,
        type: "trash_installed_program_unless_runner_pays",
        amount: subroutine.amount,
      } satisfies SubroutineDefinition;
    if (subroutine.kind === "end_the_run_unless_runner_pays")
      return {
        id: subroutine.capabilityKey,
        type: "end_the_run_unless_runner_pays",
        amount: subroutine.amount,
      } satisfies SubroutineDefinition;
    if (subroutine.kind === "run_duration_ice_strength") {
      const cancelPayment = subroutine.runnerMayCancelOnPassingSource?.amount;
      if (
        cancelPayment !== undefined &&
        (!Number.isInteger(cancelPayment) || cancelPayment <= 0)
      )
        throw new Error("card_spec_invalid_run_strength_cancel_payment");
      return {
        id: subroutine.capabilityKey,
        type: "set_run_future_strength_bonus",
        amount: requirePositiveSubroutineAmount(
          subroutine.amount,
          subroutine.kind,
        ),
        ...(cancelPayment === undefined
          ? {}
          : { runFutureStrengthCancelPaymentAmount: cancelPayment }),
      } satisfies SubroutineDefinition;
    }
    if (subroutine.kind === "prohibit_break_and_jack_out_next_ice")
      return {
        id: subroutine.capabilityKey,
        type: "set_next_encounter_lock",
        ...projectBreakTags(subroutine.breakTags),
      } satisfies SubroutineDefinition;
    if (subroutine.kind === "run_duration_additional_subroutine") {
      if (
        subroutine.append !== "after_existing" ||
        subroutine.subroutine.kind !== "end_the_run"
      )
        throw new Error("card_spec_invalid_run_duration_additional_subroutine");
      return {
        id: subroutine.capabilityKey,
        type: "set_run_future_end_the_run_subroutine",
        ...projectBreakTags(subroutine.breakTags),
      } satisfies SubroutineDefinition;
    }
    if (subroutine.kind === "run_duration_break_subroutine_cost")
      return {
        id: subroutine.capabilityKey,
        type: "set_run_break_subroutine_cost_modifier",
        amount: requirePositiveSubroutineAmount(
          subroutine.amount,
          subroutine.kind,
        ),
        ...projectBreakTags(subroutine.breakTags),
      } satisfies SubroutineDefinition;
    if (subroutine.kind === "run_duration_cannot_jack_out")
      return {
        id: subroutine.capabilityKey,
        type: "set_run_jack_out_lock",
        ...projectBreakTags(subroutine.breakTags),
      } satisfies SubroutineDefinition;
    if (subroutine.kind === "run_duration_encounter_cost_or_end_run")
      return {
        id: subroutine.capabilityKey,
        type: "set_run_encounter_tax",
        amount: requirePositiveSubroutineAmount(
          subroutine.amount,
          subroutine.kind,
        ),
        ...projectBreakTags(subroutine.breakTags),
      } satisfies SubroutineDefinition;
    if (subroutine.kind === "run_duration_jack_out_cost")
      return {
        id: subroutine.capabilityKey,
        type: "set_run_jack_out_additional_cost",
        amount: requirePositiveSubroutineAmount(
          subroutine.amount,
          subroutine.kind,
        ),
        ...projectBreakTags(subroutine.breakTags),
      } satisfies SubroutineDefinition;
    if (
      subroutine.kind ===
      "run_duration_trash_program_after_passing_rezzed_ice_unless_jack_out"
    )
      return {
        id: subroutine.capabilityKey,
        type: "set_run_pass_rezzed_ice_program_trash",
        ...projectBreakTags(subroutine.breakTags),
      } satisfies SubroutineDefinition;
    if (
      subroutine.kind ===
      "secret_spend_compare_end_run_unless_corp_spent_at_least_runner"
    ) {
      if (subroutine.allowedAmounts.join(",") !== "0,1,2")
        throw new Error("card_spec_invalid_secret_spend_allowed_amounts");
      return {
        id: subroutine.capabilityKey,
        type: "secret_spend_compare_end_run_unless_corp_spent_at_least_runner",
        ...projectBreakTags(subroutine.breakTags),
      } satisfies SubroutineDefinition;
    }
    if (subroutine.kind === "random_resume_from_rezzed_ice_back_or_jack_out")
      return {
        id: subroutine.capabilityKey,
        type: "rewind_run_to_rezzed_ice_by_die",
        ...projectBreakTags(subroutine.breakTags),
      } satisfies SubroutineDefinition;
    if (subroutine.kind === "next_encounter_unless_fully_break_damage")
      return {
        id: subroutine.capabilityKey,
        type: "set_next_encounter_unless_fully_break_damage",
        damageType: subroutine.damageType,
        amount: requirePositiveSubroutineAmount(
          subroutine.amount,
          subroutine.kind,
        ),
        ...projectBreakTags(subroutine.breakTags),
      } satisfies SubroutineDefinition;
    if (subroutine.kind === "runner_run_lock_actions")
      return {
        id: subroutine.capabilityKey,
        type: "set_runner_run_lock_actions",
        amount: requirePositiveSubroutineAmount(
          subroutine.amount,
          subroutine.kind,
        ),
        ...projectBreakTags(subroutine.breakTags),
      } satisfies SubroutineDefinition;
    if (subroutine.kind === "runner_forgoes_next_action")
      return {
        id: subroutine.capabilityKey,
        type: "set_runner_forgo_next_action",
        ...projectBreakTags(subroutine.breakTags),
      } satisfies SubroutineDefinition;
    if (subroutine.kind === "end_the_run_and_runner_forgoes_next_action") {
      if (
        subroutine.sequence.join(",") !==
        "end_the_run,runner_forgoes_next_action"
      )
        throw new Error("card_spec_invalid_end_run_action_forgo_sequence");
      return {
        id: subroutine.capabilityKey,
        type: "end_the_run_and_runner_forgoes_next_action",
        ...projectBreakTags(subroutine.breakTags),
      } satisfies SubroutineDefinition;
    }
    if (subroutine.kind === "prohibit_break_next_ice")
      return {
        id: subroutine.capabilityKey,
        type: "set_next_encounter_no_break_subroutines",
        ...(subroutine.breakTags === undefined
          ? {}
          : { breakTags: [...subroutine.breakTags] }),
      } satisfies SubroutineDefinition;
    if (subroutine.kind === "deflect_run")
      return {
        id: subroutine.capabilityKey,
        type: "deflect_run",
        deflectorTarget: subroutine.target,
        ...(subroutine.cost?.kind === "credit"
          ? { deflectorCost: subroutine.cost.amount }
          : {}),
        ...(subroutine.autoBreakIfNoTarget
          ? { deflectorAutoBreakIfNoTarget: true }
          : {}),
        ...(subroutine.breakTags === undefined
          ? {}
          : { breakTags: [...subroutine.breakTags] }),
      } satisfies SubroutineDefinition;
    if (subroutine.kind === "random_damage")
      return {
        id: subroutine.capabilityKey,
        type: "random_damage",
        dieFaces: subroutine.dieFaces,
        damageOnResults: [...subroutine.damageOnResults],
        damageType: "core",
        amount: subroutine.amount,
      } satisfies SubroutineDefinition;
    if (subroutine.kind === "trace")
      return {
        id: subroutine.capabilityKey,
        type: "initiate_trace",
        traceLimit: subroutine.traceLimit,
        traceSuccessEffect: projectTraceSuccessEffect(subroutine.onSuccess),
        ...(subroutine.breakTags === undefined
          ? {}
          : { breakTags: [...subroutine.breakTags] }),
      } satisfies SubroutineDefinition;
    if (
      subroutine.kind === "corp_gain_credit" ||
      subroutine.kind === "runner_lose_credits" ||
      subroutine.kind === "give_runner_tag"
    )
      return {
        id: subroutine.capabilityKey,
        type: subroutine.kind,
        amount: subroutine.amount,
      } satisfies SubroutineDefinition;
    throw new Error(
      `card_spec_unsupported_printed_subroutine:${(subroutine as { kind: string }).kind}`,
    );
  });
}

function assertDynamicDamageSubroutineBinding(
  engine: DeepReadonly<CardMechanicalSpec>,
): void {
  const binding = engine.relativeIce?.dynamicDamageSubroutine;
  const printed = engine.printedSubroutines ?? [];
  const derivedDamage = printed.filter(
    (subroutine) =>
      subroutine.kind === "damage" && typeof subroutine.amount !== "number",
  );
  if (binding === undefined) {
    if (derivedDamage.length > 0)
      throw new Error("card_spec_orphan_derived_damage_subroutine");
    return;
  }
  if (
    !Number.isInteger(binding.amountPerCount) ||
    binding.amountPerCount <= 0 ||
    binding.visibility !== "public"
  )
    throw new Error("card_spec_invalid_dynamic_damage_binding");
  const targets = printed.filter(
    (subroutine) =>
      subroutine.capabilityKey === binding.subroutineCapabilityKey,
  );
  if (targets.length === 0)
    throw new Error("card_spec_dynamic_damage_target_missing");
  if (targets.length > 1)
    throw new Error("card_spec_dynamic_damage_target_duplicate");
  const target = targets[0];
  if (
    target?.kind !== "damage" ||
    typeof target.amount === "number" ||
    target.amount.kind !== "derived" ||
    target.amount.source !== "relative_ice_dynamic_damage" ||
    target.amount.ownerCapabilityKey !== engine.relativeIce?.capabilityKey
  )
    throw new Error("card_spec_dynamic_damage_target_mismatch");
  if (
    derivedDamage.length !== 1 ||
    derivedDamage[0]?.capabilityKey !== binding.subroutineCapabilityKey
  )
    throw new Error("card_spec_dynamic_damage_binding_duplicate");
}

function requirePositiveSubroutineAmount(value: number, kind: string): number {
  if (!Number.isInteger(value) || value <= 0)
    throw new Error(`card_spec_invalid_printed_subroutine_amount:${kind}`);
  return value;
}

function projectBreakTags(
  breakTags: readonly string[] | undefined,
): Pick<SubroutineDefinition, "breakTags"> {
  if (breakTags === undefined || breakTags.length === 0) return {};
  return { breakTags: [...breakTags] };
}

function projectTraceSuccessEffect(
  effects: Extract<
    NonNullable<CardMechanicalSpec["printedSubroutines"]>[number],
    { kind: "trace" }
  >["onSuccess"],
): NonNullable<SubroutineDefinition["traceSuccessEffect"]> {
  const tagEffects = effects.filter((effect) => effect.kind === "add_tags");
  const counterEffects = effects.filter(
    (effect) => effect.kind === "add_counter",
  );
  const marginTagEffects = effects.filter(
    (effect) => effect.kind === "add_tags_by_trace_margin_over_runner_link",
  );
  const preventableDamageEffects = effects.filter(
    (effect) => effect.kind === "preventable_damage",
  );
  const endRunEffects = effects.filter((effect) => effect.kind === "end_run");
  const runLockEffects = effects.filter(
    (effect) => effect.kind === "runner_run_lock_until_action_paid",
  );
  const trashProgramEffects = effects.filter(
    (effect) => effect.kind === "trash_program",
  );
  const trashHardwareEffects = effects.filter(
    (effect) => effect.kind === "trash_hardware",
  );
  const unpreventableMeatEffects = effects.filter(
    (effect) => effect.kind === "unpreventable_meat_damage",
  );
  if (
    tagEffects.length === 1 &&
    counterEffects.length === 0 &&
    marginTagEffects.length === 0 &&
    preventableDamageEffects.length === 0 &&
    endRunEffects.length === 0 &&
    runLockEffects.length === 0 &&
    trashProgramEffects.length === 0 &&
    trashHardwareEffects.length === 0 &&
    unpreventableMeatEffects.length === 0
  ) {
    const amount = tagEffects[0]?.amount ?? 0;
    if (!Number.isInteger(amount) || amount <= 0)
      throw new Error("card_spec_invalid_trace_tag_effect");
    return { type: "add_tag", amount };
  }
  if (effects.length === 1 && effects[0]?.kind === "add_counter") {
    const effect = effects[0];
    if (
      typeof effect.counterType !== "string" ||
      typeof effect.amount !== "number"
    )
      throw new Error("card_spec_invalid_trace_counter_effect");
    return {
      type: "add_counter",
      counterType: effect.counterType,
      amount: effect.amount,
    };
  }
  if (effects.length === 1 && effects[0]?.kind === "preventable_damage") {
    const effect = effects[0];
    if (
      effect.recipient !== "runner" ||
      effect.damageType !== "net" ||
      typeof effect.amount !== "number" ||
      !Number.isInteger(effect.amount) ||
      effect.amount <= 0 ||
      effect.visibility !== "public"
    )
      throw new Error("card_spec_invalid_trace_damage_effect");
    return { type: "net_damage", amount: effect.amount };
  }
  if (
    tagEffects.length === 1 &&
    counterEffects.length === 1 &&
    marginTagEffects.length === 0 &&
    preventableDamageEffects.length === 0 &&
    endRunEffects.length === 0 &&
    runLockEffects.length === 0 &&
    trashProgramEffects.length === 0 &&
    trashHardwareEffects.length === 0 &&
    unpreventableMeatEffects.length === 0
  ) {
    const tagAmount = tagEffects[0]?.amount ?? 0;
    const counterAmount = counterEffects[0]?.amount ?? 0;
    if (!Number.isInteger(tagAmount) || tagAmount <= 0)
      throw new Error("card_spec_invalid_trace_tag_effect");
    if (!Number.isInteger(counterAmount) || counterAmount <= 0)
      throw new Error("card_spec_invalid_trace_counter_effect");
    return {
      type: "add_tag_and_counter",
      tagAmount,
      counterType: counterEffects[0]!.counterType,
      amount: counterAmount,
    };
  }
  if (
    tagEffects.length === 0 &&
    counterEffects.length === 0 &&
    marginTagEffects.length === 1 &&
    preventableDamageEffects.length === 0 &&
    endRunEffects.length === 0 &&
    runLockEffects.length === 0 &&
    trashProgramEffects.length === 0 &&
    trashHardwareEffects.length === 0 &&
    unpreventableMeatEffects.length === 0 &&
    effects.length === 0
  )
    return { type: "add_tags_by_trace_margin_over_runner_link" };
  if (
    tagEffects.length === 0 &&
    counterEffects.length === 0 &&
    marginTagEffects.length === 0 &&
    preventableDamageEffects.length === 0 &&
    endRunEffects.length === 1 &&
    runLockEffects.length === 1 &&
    trashProgramEffects.length === 0 &&
    trashHardwareEffects.length === 0 &&
    unpreventableMeatEffects.length === 0
  ) {
    const endRun = endRunEffects[0];
    const runLock = runLockEffects[0];
    if (
      endRun?.visibility !== "public" ||
      runLock?.kind !== "runner_run_lock_until_action_paid" ||
      runLock.visibility !== "public" ||
      !Number.isInteger(runLock.amount) ||
      runLock.amount <= 0
    )
      throw new Error("card_spec_invalid_trace_run_lock_effect");
    return { type: "end_run_and_run_lock", amount: runLock.amount };
  }
  if (
    tagEffects.length === 0 &&
    counterEffects.length === 0 &&
    marginTagEffects.length === 0 &&
    preventableDamageEffects.length === 0 &&
    endRunEffects.length === 1 &&
    runLockEffects.length === 1 &&
    trashProgramEffects.length === 1 &&
    trashHardwareEffects.length === 0 &&
    unpreventableMeatEffects.length === 0
  ) {
    const amount = runLockEffects[0]?.amount ?? 0;
    if (!Number.isInteger(amount) || amount <= 0)
      throw new Error("card_spec_invalid_trace_run_lock_effect");
    return { type: "end_run_trash_program_and_run_lock", amount };
  }
  if (
    tagEffects.length === 0 &&
    counterEffects.length === 0 &&
    marginTagEffects.length === 0 &&
    preventableDamageEffects.length === 0 &&
    endRunEffects.length === 1 &&
    runLockEffects.length === 0 &&
    trashProgramEffects.length === 0 &&
    trashHardwareEffects.length === 1 &&
    unpreventableMeatEffects.length === 1
  ) {
    const amount = unpreventableMeatEffects[0]?.amount ?? 0;
    if (!Number.isInteger(amount) || amount <= 0)
      throw new Error(
        "card_spec_invalid_trace_unpreventable_meat_damage_effect",
      );
    return {
      type: "end_run_trash_hardware_and_unpreventable_meat_damage",
      amount,
    };
  }
  if (
    tagEffects.length === 0 &&
    counterEffects.length === 0 &&
    marginTagEffects.length === 0 &&
    preventableDamageEffects.length === 0 &&
    endRunEffects.length === 0 &&
    runLockEffects.length === 0 &&
    trashProgramEffects.length === 0 &&
    trashHardwareEffects.length === 0 &&
    unpreventableMeatEffects.length === 0
  )
    return { type: "none" };
  throw new Error("card_spec_unsupported_trace_success_effect");
}

function deriveMechanicTokens(
  cardType: CardSpec["identity"]["cardType"],
  engine: DeepReadonly<CardMechanicalSpec>,
): string[] {
  const tokens = new Set<string>();
  const baseMechanics =
    cardType === "asset" && engine.corpRootRezCreditOutcome !== undefined
      ? ["install_remote", "rez_asset", "trash_on_access"]
      : cardType === "upgrade" && hasOnlyCharacteristics(engine)
        ? ["install_remote", "rez_upgrade", "trash_on_access"]
        : BASE_MECHANICS[cardType];
  for (const token of baseMechanics) tokens.add(token);
  if (engine.characteristics.memoryLimitBonus !== undefined)
    tokens.add("modify_memory_limit");
  for (const [family, declaration] of Object.entries(engine)) {
    if (family === "schemaVersion" || family === "characteristics") continue;
    if (family === "corpRootRezCreditOutcome") {
      tokens.add("gain_credits_on_rez");
      continue;
    }
    if (family === "printedSubroutines" && engine.variableRez === undefined) {
      for (const subroutine of engine.printedSubroutines ?? [])
        tokens.add(subroutine.kind);
      continue;
    }
    if (
      family === "icebreakerAbilities" &&
      engine.installTargetBinding === undefined &&
      engine.icebreakerEncounterStrengthBonus === undefined &&
      engine.icebreakerSubtypeChange === undefined
    ) {
      for (const ability of engine.icebreakerAbilities ?? [])
        tokens.add(ability.kind);
      continue;
    }
    if (
      family === "abilities" &&
      engine.abilities?.every(
        (ability) =>
          ability.kind === "on_play" &&
          (ability.effects ?? []).every((effect) =>
            ["draw_cards", "gain_credits", "lose_credits", "make_run"].includes(
              effect.kind,
            ),
          ),
      ) === true
    ) {
      for (const ability of engine.abilities)
        for (const effect of ability.effects ?? []) {
          if (effect.kind === "make_run") {
            tokens.add("start_run");
            if ((effect.successfulRunRunnerCreditGain ?? 0) > 0)
              tokens.add("successful_run_bonus");
          } else tokens.add(effect.kind);
        }
      continue;
    }
    tokens.add(family);
    for (const kind of nestedKinds(declaration)) tokens.add(kind);
  }
  return [...tokens].sort();
}

function hasOnlyCharacteristics(
  engine: DeepReadonly<CardMechanicalSpec>,
): boolean {
  return Object.entries(engine).every(
    ([family, value]) =>
      family === "schemaVersion" ||
      family === "characteristics" ||
      value === undefined ||
      (Array.isArray(value) && value.length === 0),
  );
}

const BASE_MECHANICS: Record<
  CardSpec["identity"]["cardType"],
  readonly string[]
> = {
  identity: [],
  event: ["play_event"],
  operation: ["play_operation"],
  program: ["install_program"],
  hardware: ["install_hardware"],
  resource: ["install_resource"],
  agenda: ["install_remote", "advance", "score_agenda"],
  asset: ["install_remote", "rez_card", "trash_on_access"],
  upgrade: ["install_remote", "rez_card", "trash_on_access"],
  ice: ["install_ice", "rez_ice", "encounter_ice"],
};

function nestedKinds(value: unknown): string[] {
  const found = new Set<string>();
  const visit = (candidate: unknown): void => {
    if (Array.isArray(candidate)) {
      for (const entry of candidate) visit(entry);
      return;
    }
    if (candidate === null || typeof candidate !== "object") return;
    const record = candidate as Record<string, unknown>;
    if (typeof record.kind === "string") found.add(record.kind);
    for (const nested of Object.values(record)) visit(nested);
  };
  visit(value);
  return [...found];
}

function cloneWithCapabilityLabels(
  value: unknown,
  labels: ReadonlyMap<string, string>,
): unknown {
  if (Array.isArray(value))
    return value.map((entry) => cloneWithCapabilityLabels(entry, labels));
  if (value === null || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  const cloned = Object.fromEntries(
    Object.entries(record).map(([key, nested]) => [
      key,
      cloneWithCapabilityLabels(nested, labels),
    ]),
  );
  const key =
    typeof record.capabilityKey === "string" ? record.capabilityKey : undefined;
  const label = key === undefined ? undefined : labels.get(key);
  return label === undefined ? cloned : { ...cloned, label };
}
