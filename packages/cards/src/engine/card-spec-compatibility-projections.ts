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
  | "agendaAccessReplacement"
  | "advanceable"
  | "corpUtility"
  | "corpRootRezCreditOutcome"
  | "damagePreventionSources"
  | "flatlineReplacementSources"
  | "fortRunWindows"
  | "hardwareDeck"
  | "hostedProgramCapacity"
  | "iceEncounter"
  | "icebreakerAbilities"
  | "icebreakerEncounterStrengthBonus"
  | "icebreakerSubtypeChange"
  | "installCapabilities"
  | "installTargetBinding"
  | "lifecycle"
  | "modifiers"
  | "relativeIce"
  | "restrictedHostedCreditSource"
  | "runnerCounterEffects"
  | "runnerEventLongtail"
  | "runnerEventTargetedEffect"
  | "runnerRunStrengthBoost"
  | "runnerUtilityLongtail"
  | "scoredAgenda"
  | "selfRezAdditionalCosts"
  | "selfRezCostModifiers"
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

const CARD_SPEC_IMPLEMENTATION_FAMILIES = new Set([
  "abilities",
  "accessEffects",
  "agendaAccessReplacement",
  "advanceable",
  "corpUtility",
  "corpRootRezCreditOutcome",
  "damagePreventionSources",
  "flatlineReplacementSources",
  "fortRunWindows",
  "hardwareDeck",
  "hostedProgramCapacity",
  "iceEncounter",
  "icebreakerAbilities",
  "icebreakerEncounterStrengthBonus",
  "icebreakerSubtypeChange",
  "installCapabilities",
  "installTargetBinding",
  "lifecycle",
  "modifiers",
  "relativeIce",
  "restrictedHostedCreditSource",
  "runnerCounterEffects",
  "runnerEventLongtail",
  "runnerEventTargetedEffect",
  "runnerRunStrengthBoost",
  "runnerUtilityLongtail",
  "scoredAgenda",
  "selfRezAdditionalCosts",
  "selfRezCostModifiers",
  "selfStealCosts",
  "successfulRunFollowups",
  "tagPreventionSources",
  "trashPreventionSources",
  "unique",
  "uniqueDirectLongtail",
  "variableRez",
  "virusCounter",
]);

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
  return (engine.printedSubroutines ?? []).map((subroutine) => {
    if (subroutine.kind === "damage")
      return {
        id: subroutine.capabilityKey,
        type: "do_damage",
        damageType:
          subroutine.damageType === "brain" ? "core" : subroutine.damageType,
        amount: subroutine.amount,
      } satisfies SubroutineDefinition;
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
        typeof cancelPayment !== "number" ||
        !Number.isInteger(cancelPayment) ||
        cancelPayment <= 0
      )
        throw new Error("card_spec_invalid_run_strength_cancel_payment");
      return {
        id: subroutine.capabilityKey,
        type: "set_run_future_strength_bonus",
        amount: subroutine.amount,
        runFutureStrengthCancelPaymentAmount: cancelPayment,
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
        baseTraceStrength: subroutine.baseTraceStrength,
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
      `card_spec_unsupported_printed_subroutine:${subroutine.kind}`,
    );
  });
}

function projectTraceSuccessEffect(
  effects: Extract<
    NonNullable<CardMechanicalSpec["printedSubroutines"]>[number],
    { kind: "trace" }
  >["onSuccess"],
): NonNullable<SubroutineDefinition["traceSuccessEffect"]> {
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
  if (effects.length === 2) {
    const endRun = effects.find((effect) => effect.kind === "end_run");
    const runLock = effects.find(
      (effect) => effect.kind === "runner_run_lock_until_action_paid",
    );
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
