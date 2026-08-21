import type { CardDefinitionId } from "@netgrid/shared";
import {
  canonicalCapabilityId,
  type CanonicalCapabilityId,
  type CapabilityAddressability,
  type CapabilityKey,
} from "./capability-identity";
import { assertCardSpecContract } from "./card-spec-validation";
import type { CardSpec } from "./contracts";
import type { CardMechanicalSpec } from "./engine/card-mechanical-contracts";
import { cardSectionFingerprints, type Fingerprint } from "./fingerprints";
import type { PlanningInterpretation } from "./planning-annotations";
import {
  canonicalSerialize,
  deepFreezeSerializable,
  type DeepReadonly,
  type JsonValue,
} from "./serializable";

export const PROSPECTIVE_CAPABILITY_SCHEMA_VERSION =
  "prospective-capability-view-v1" as const;
export const PROSPECTIVE_COMPILER_VERSION =
  "prospective-capability-compiler-v1" as const;

export type ProspectiveCapabilityFamily = Exclude<
  keyof CardMechanicalSpec,
  "schemaVersion" | "characteristics"
>;

export type ProspectiveUncertaintyClass =
  | "statically_compilable"
  | "requires_engine_quote"
  | "unknown";

/** Exhaustive CS01 classification owned by the canonical CardMechanicalSpec. */
export const PROSPECTIVE_CLASS_BY_FAMILY = {
  abilities: "requires_engine_quote",
  accessEffects: "requires_engine_quote",
  accessHooks: "requires_engine_quote",
  advanceable: "statically_compilable",
  agendaAccessReplacement: "requires_engine_quote",
  corpRootRezCreditOutcome: "statically_compilable",
  corpTrashInstalledRunnerSource: "requires_engine_quote",
  corpUtility: "requires_engine_quote",
  damagePreventionSources: "requires_engine_quote",
  flatlineReplacementSources: "requires_engine_quote",
  fortCapacityModifiers: "statically_compilable",
  fortRunWindows: "requires_engine_quote",
  hardwareDeck: "statically_compilable",
  hiddenReplacementLongtail: "requires_engine_quote",
  hostedProgramCapacity: "statically_compilable",
  hostedProgramModifiers: "statically_compilable",
  iceEncounter: "requires_engine_quote",
  icebreakerAbilities: "requires_engine_quote",
  icebreakerEncounterStrengthBonus: "statically_compilable",
  icebreakerSubtypeChange: "requires_engine_quote",
  installAdditionalCosts: "statically_compilable",
  installCapabilities: "statically_compilable",
  installTargetBinding: "requires_engine_quote",
  leavePlayCleanup: "statically_compilable",
  lifecycle: "requires_engine_quote",
  modifiers: "statically_compilable",
  printedSubroutines: "requires_engine_quote",
  regionBaseline: "unknown",
  relativeIce: "requires_engine_quote",
  remainingReplacementLongtail: "requires_engine_quote",
  restrictedHostedCreditSource: "statically_compilable",
  runEncounterInterventions: "requires_engine_quote",
  runnerCounterEffects: "requires_engine_quote",
  runnerEventLongtail: "requires_engine_quote",
  runnerEventTargetedEffect: "requires_engine_quote",
  runnerRunStrengthBoost: "requires_engine_quote",
  runnerUtilityLongtail: "requires_engine_quote",
  scoredAgenda: "requires_engine_quote",
  selfRezAdditionalCosts: "statically_compilable",
  selfRezCostModifiers: "statically_compilable",
  selfRezWindows: "requires_engine_quote",
  selfStealCosts: "statically_compilable",
  successfulRunFollowups: "requires_engine_quote",
  tagPreventionSources: "requires_engine_quote",
  trashPreventionSources: "requires_engine_quote",
  unique: "statically_compilable",
  uniqueDirectLongtail: "requires_engine_quote",
  variableRez: "requires_engine_quote",
  virusCounter: "requires_engine_quote",
} as const satisfies Record<
  ProspectiveCapabilityFamily,
  ProspectiveUncertaintyClass
>;

const ORDERED_FAMILIES = Object.freeze(
  (
    Object.keys(PROSPECTIVE_CLASS_BY_FAMILY) as ProspectiveCapabilityFamily[]
  ).sort(compareText),
);

export type ProspectiveTransition = {
  kind: "install" | "play" | "rez" | "score" | "access" | "none";
  sourceState: "in_hand" | "installed" | "rezzed" | "scored" | "accessed";
  cost: JsonValue;
};

export type ProspectiveDescriptorKind =
  | "capability_kind"
  | "cost"
  | "timing"
  | "condition"
  | "limit"
  | "target"
  | "effect"
  | "choice"
  | "mechanic";

export type ProspectiveCapabilityDescriptor = {
  kind: ProspectiveDescriptorKind;
  path: string;
  value: JsonValue;
};

export type ProspectiveCapabilityIdentity =
  | { kind: "unkeyed" }
  | {
      kind: "keyed";
      capabilityKey: CapabilityKey;
      canonicalCapabilityId: CanonicalCapabilityId;
      addressability: readonly CapabilityAddressability[];
    };

export type ProspectiveDirectOutcome = {
  phase: "transition" | "capability_resolution";
  sourcePath: string;
  descriptorPaths: readonly string[];
  resolution: "declared_transition_effect" | "requires_engine_quote";
};

export type ProspectiveInitializedValue = {
  kind: "hosted_credits";
  value: number;
  basis: "engine_default" | "on_install_declared_effect";
};

export type ProspectiveInstallChoice = {
  sourcePath: string;
  descriptorPaths: readonly string[];
  selectedValue: null;
};

export type ProspectiveLiability = {
  phase:
    | "start_of_corp_turn"
    | "start_of_runner_turn"
    | "end_of_runner_turn"
    | "on_leave_play"
    | "end_of_turn_cleanup";
  sourcePath: string;
  descriptorPaths: readonly string[];
  resolution:
    | "declared_effect"
    | "addressable_choice"
    | "requires_engine_quote";
};

export type ProspectiveInitialConditionEvaluation =
  | { state: "not_applicable" }
  | { state: "not_statically_evaluated" }
  | {
      state: "condition_unsatisfied";
      conditionPath: string;
      reason: "source_hosted_credits_initialized_to_zero";
    };

export type ProspectiveCapability = {
  family: ProspectiveCapabilityFamily;
  sourcePath: string;
  uncertaintyClass: ProspectiveUncertaintyClass;
  uncertaintyReason?: "unowned_family_requires_engine_owner_or_removal";
  identity: ProspectiveCapabilityIdentity;
  transition: ProspectiveTransition;
  descriptors: readonly ProspectiveCapabilityDescriptor[];
  directOutcomes: readonly ProspectiveDirectOutcome[];
  installChoices: readonly ProspectiveInstallChoice[];
  liabilities: readonly ProspectiveLiability[];
  initialConditionEvaluation: ProspectiveInitialConditionEvaluation;
  planningAnnotations?: readonly PlanningInterpretation[];
};

export type ProspectiveCapabilityView = {
  schemaVersion: typeof PROSPECTIVE_CAPABILITY_SCHEMA_VERSION;
  compilerVersion: typeof PROSPECTIVE_COMPILER_VERSION;
  cardDefinitionId: CardDefinitionId;
  cardRulesFingerprint: Fingerprint;
  planningAnnotationsFingerprint: Fingerprint;
  initializedValues: readonly ProspectiveInitializedValue[];
  cardPlanningAnnotations?: readonly PlanningInterpretation[];
  capabilities: readonly ProspectiveCapability[];
  currentLegality: "not_evaluated_requires_current_legal_action_or_engine_quote";
};

const compiledByRelevantFingerprint = new Map<
  string,
  DeepReadonly<ProspectiveCapabilityView>
>();

export function compileProspectiveCapabilities(
  spec: CardSpec,
): DeepReadonly<ProspectiveCapabilityView> {
  assertCardSpecContract(spec);
  const fingerprints = cardSectionFingerprints(spec);
  const cacheKey = canonicalSerialize([
    PROSPECTIVE_COMPILER_VERSION,
    spec.identity.cardDefinitionId,
    fingerprints.cardRulesFingerprint,
    fingerprints.planningAnnotationsFingerprint,
  ]);
  const cached = compiledByRelevantFingerprint.get(cacheKey);
  if (cached !== undefined) return cached;

  const initializedValues = initialValuesFor(spec);
  const capabilities: ProspectiveCapability[] = [];
  for (const family of ORDERED_FAMILIES) {
    const value = spec.engine[family];
    if (value === undefined) continue;
    if (family === "lifecycle") {
      compileLifecycle(
        spec,
        value as JsonValue,
        initializedValues,
        capabilities,
      );
      continue;
    }
    const json = value as JsonValue;
    const entries = Array.isArray(json) ? json : [json];
    entries.forEach((entry, index) =>
      capabilities.push(
        compileNode(
          spec,
          family,
          `engine.${family}${Array.isArray(json) ? `[${index}]` : ""}`,
          entry,
          initializedValues,
        ),
      ),
    );
  }
  capabilities.sort((left, right) =>
    compareText(left.sourcePath, right.sourcePath),
  );

  const result = deepFreezeSerializable({
    schemaVersion: PROSPECTIVE_CAPABILITY_SCHEMA_VERSION,
    compilerVersion: PROSPECTIVE_COMPILER_VERSION,
    cardDefinitionId: spec.identity.cardDefinitionId,
    cardRulesFingerprint: fingerprints.cardRulesFingerprint,
    planningAnnotationsFingerprint: fingerprints.planningAnnotationsFingerprint,
    initializedValues,
    ...(spec.planningAnnotations?.card !== undefined
      ? {
          cardPlanningAnnotations: cloneJson(
            spec.planningAnnotations.card as JsonValue,
          ) as PlanningInterpretation[],
        }
      : {}),
    capabilities,
    currentLegality:
      "not_evaluated_requires_current_legal_action_or_engine_quote",
  } satisfies ProspectiveCapabilityView);
  compiledByRelevantFingerprint.set(cacheKey, result);
  return result;
}

function compileLifecycle(
  spec: CardSpec,
  value: JsonValue,
  initialValues: readonly ProspectiveInitializedValue[],
  output: ProspectiveCapability[],
): void {
  if (!isObject(value)) return;
  const hooks = [
    "on_install",
    "on_rez",
    "on_score",
    "on_leave_play",
    "start_of_corp_turn",
    "start_of_runner_turn",
    "end_of_runner_turn",
    "on_runner_run_start",
  ] as const;
  for (const hook of hooks) {
    const entries = value[hook];
    if (!Array.isArray(entries)) continue;
    entries.forEach((entry, index) =>
      output.push(
        compileNode(
          spec,
          "lifecycle",
          `engine.lifecycle.${hook}[${index}]`,
          entry,
          initialValues,
          hook,
        ),
      ),
    );
  }
}

function compileNode(
  spec: CardSpec,
  family: ProspectiveCapabilityFamily,
  sourcePath: string,
  value: JsonValue,
  initialValues: readonly ProspectiveInitializedValue[],
  lifecycleHook?: string,
): ProspectiveCapability {
  const descriptors = directDescriptors(value, sourcePath);
  const identity = identityFor(spec, value);
  const uncertaintyClass = PROSPECTIVE_CLASS_BY_FAMILY[family];
  const annotation =
    identity.kind === "keyed"
      ? spec.planningAnnotations?.capabilities?.find(
          (entry) => entry.capabilityKey === identity.capabilityKey,
        )?.annotations
      : undefined;
  return {
    family,
    sourcePath,
    uncertaintyClass,
    ...(family === "regionBaseline"
      ? {
          uncertaintyReason:
            "unowned_family_requires_engine_owner_or_removal" as const,
        }
      : {}),
    identity,
    transition: transitionFor(spec, family, value, lifecycleHook),
    descriptors,
    directOutcomes: directOutcomesFor(
      family,
      lifecycleHook,
      sourcePath,
      descriptors,
    ),
    installChoices: installChoicesFor(family, value, sourcePath, descriptors),
    liabilities: liabilitiesFor(
      family,
      lifecycleHook,
      value,
      sourcePath,
      descriptors,
    ),
    initialConditionEvaluation: initialConditionFor(descriptors, initialValues),
    ...(annotation !== undefined
      ? {
          planningAnnotations: cloneJson(
            annotation as JsonValue,
          ) as PlanningInterpretation[],
        }
      : {}),
  };
}

function identityFor(
  spec: CardSpec,
  value: JsonValue,
): ProspectiveCapabilityIdentity {
  if (!isObject(value) || typeof value.capabilityKey !== "string")
    return { kind: "unkeyed" };
  const key = value.capabilityKey as CapabilityKey;
  return {
    kind: "keyed",
    capabilityKey: key,
    canonicalCapabilityId: canonicalCapabilityId(
      spec.identity.cardDefinitionId,
      key,
    ),
    addressability: cloneJson(
      value.addressability as JsonValue,
    ) as CapabilityAddressability[],
  };
}

function transitionFor(
  spec: CardSpec,
  family: ProspectiveCapabilityFamily,
  value: JsonValue,
  lifecycleHook?: string,
): ProspectiveTransition {
  const playCost: JsonValue = {
    sourcePath: "engine.characteristics.playCost",
    value: cloneJson(spec.engine.characteristics.playCost as JsonValue),
  };
  if (lifecycleHook === "on_install")
    return { kind: "install", sourceState: "installed", cost: playCost };
  if (lifecycleHook === "on_rez")
    return { kind: "rez", sourceState: "rezzed", cost: playCost };
  if (lifecycleHook === "on_score") return scoreTransition(spec);
  switch (family) {
    case "installAdditionalCosts":
    case "installCapabilities":
    case "installTargetBinding":
      return { kind: "install", sourceState: "in_hand", cost: playCost };
    case "advanceable":
      return { kind: "install", sourceState: "installed", cost: playCost };
    case "fortCapacityModifiers":
      return { kind: "install", sourceState: "installed", cost: playCost };
    case "accessEffects":
    case "accessHooks":
    case "agendaAccessReplacement":
      return { kind: "access", sourceState: "accessed", cost: null };
    case "scoredAgenda":
      return scoreTransition(spec);
    case "selfRezAdditionalCosts":
    case "selfRezCostModifiers":
    case "selfRezWindows":
    case "variableRez":
    case "corpRootRezCreditOutcome":
      return { kind: "rez", sourceState: "rezzed", cost: playCost };
    case "abilities":
      if (
        spec.identity.cardType === "event" ||
        spec.identity.cardType === "operation"
      )
        return { kind: "play", sourceState: "in_hand", cost: playCost };
      return inPlayTransition(spec, playCost);
    case "icebreakerAbilities":
    case "icebreakerEncounterStrengthBonus":
    case "icebreakerSubtypeChange":
      return { kind: "install", sourceState: "installed", cost: playCost };
    case "regionBaseline":
      return { kind: "install", sourceState: "in_hand", cost: playCost };
    case "modifiers":
      if (isObject(value) && value.activeWhile === "installed")
        return { kind: "install", sourceState: "installed", cost: playCost };
      return inPlayTransition(spec, playCost);
    default:
      return lifecycleHook === undefined
        ? inPlayTransition(spec, playCost)
        : inPlayTransition(spec, playCost);
  }
}

function inPlayTransition(
  spec: CardSpec,
  cost: JsonValue,
): ProspectiveTransition {
  if (
    spec.identity.cardType === "event" ||
    spec.identity.cardType === "operation"
  )
    return { kind: "play", sourceState: "in_hand", cost };
  if (spec.identity.cardType === "agenda")
    return { kind: "none", sourceState: "installed", cost: null };
  if (spec.identity.cardType === "identity")
    return { kind: "none", sourceState: "installed", cost: null };
  if (
    spec.identity.side === "corp" &&
    ["asset", "upgrade", "ice"].includes(spec.identity.cardType)
  )
    return { kind: "rez", sourceState: "rezzed", cost };
  return { kind: "install", sourceState: "installed", cost };
}

function scoreTransition(spec: CardSpec): ProspectiveTransition {
  return {
    kind: "score",
    sourceState: "scored",
    cost: {
      sourcePath: "engine.characteristics.numeric.advancementRequirement",
      value: spec.engine.characteristics.numeric.advancementRequirement,
    },
  };
}

const DESCRIPTOR_KEYS = {
  kind: "capability_kind",
  cost: "cost",
  costs: "cost",
  timing: "timing",
  condition: "condition",
  limit: "limit",
  target: "target",
  targets: "target",
  matches: "target",
  effects: "effect",
  effect: "effect",
  choices: "choice",
  stores: "choice",
  while: "mechanic",
  amount: "mechanic",
  operation: "mechanic",
  appliesTo: "mechanic",
  activeWhile: "mechanic",
  visibility: "mechanic",
  minValue: "mechanic",
  maxValue: "mechanic",
  additionalCostPerValue: "mechanic",
  sourceZone: "mechanic",
  sourceZones: "mechanic",
  targetServer: "mechanic",
  allowedCards: "mechanic",
  maxCards: "mechanic",
  temporaryCredits: "mechanic",
  optionalRez: "mechanic",
  installOnlyIfRezAffordable: "mechanic",
  rezOnInstall: "mechanic",
  oneRegionPerFort: "mechanic",
  trashOlderRegions: "mechanic",
} as const satisfies Readonly<Record<string, ProspectiveDescriptorKind>>;

function directDescriptors(
  value: JsonValue,
  sourcePath: string,
): ProspectiveCapabilityDescriptor[] {
  if (!isObject(value))
    return [{ kind: "mechanic", path: sourcePath, value: cloneJson(value) }];
  return Object.entries(value)
    .filter(
      ([key]) =>
        key !== "capabilityKey" &&
        key !== "abilityKey" &&
        key !== "addressability",
    )
    .map(([key, child]) => ({
      kind: DESCRIPTOR_KEYS[key as keyof typeof DESCRIPTOR_KEYS] ?? "mechanic",
      path: `${sourcePath}.${key}`,
      value: cloneJson(child),
    }))
    .sort((left, right) => compareText(left.path, right.path));
}

function directOutcomesFor(
  family: ProspectiveCapabilityFamily,
  lifecycleHook: string | undefined,
  sourcePath: string,
  descriptors: readonly ProspectiveCapabilityDescriptor[],
): ProspectiveDirectOutcome[] {
  const effectPaths = descriptors
    .filter((entry) => entry.kind === "effect")
    .map((entry) => entry.path);
  if (
    lifecycleHook === "on_install" ||
    lifecycleHook === "on_rez" ||
    lifecycleHook === "on_score"
  )
    return [
      {
        phase: "transition",
        sourcePath,
        descriptorPaths:
          effectPaths.length > 0
            ? effectPaths
            : descriptors.map((entry) => entry.path),
        resolution: isClosedDeterministicTransition(descriptors)
          ? "declared_transition_effect"
          : "requires_engine_quote",
      },
    ];
  if (family === "abilities" || family === "scoredAgenda")
    return effectPaths.length === 0
      ? []
      : [
          {
            phase: "capability_resolution",
            sourcePath,
            descriptorPaths: effectPaths,
            resolution: "requires_engine_quote",
          },
        ];
  if (
    family === "installCapabilities" &&
    descriptors.some(
      (entry) =>
        entry.kind === "capability_kind" && entry.value === "rez_on_install",
    )
  )
    return [
      {
        phase: "transition",
        sourcePath,
        descriptorPaths: descriptors.map((entry) => entry.path),
        resolution: "declared_transition_effect",
      },
    ];
  return [];
}

function installChoicesFor(
  family: ProspectiveCapabilityFamily,
  value: JsonValue,
  sourcePath: string,
  descriptors: readonly ProspectiveCapabilityDescriptor[],
): ProspectiveInstallChoice[] {
  const descriptorPaths = descriptors.map((entry) => entry.path);
  if (family === "installTargetBinding")
    return [{ sourcePath, descriptorPaths, selectedValue: null }];
  if (
    family === "abilities" &&
    isObject(value) &&
    Array.isArray(value.effects) &&
    value.effects.some(
      (effect) =>
        isObject(effect) &&
        effect.kind === "choose_stack_or_trash_program_install",
    )
  )
    return [{ sourcePath, descriptorPaths, selectedValue: null }];
  return [];
}

function liabilitiesFor(
  family: ProspectiveCapabilityFamily,
  lifecycleHook: string | undefined,
  value: JsonValue,
  sourcePath: string,
  descriptors: readonly ProspectiveCapabilityDescriptor[],
): ProspectiveLiability[] {
  const descriptorPaths = descriptors.map((entry) => entry.path);
  const phase = lifecycleHook as ProspectiveLiability["phase"] | undefined;
  if (
    family === "lifecycle" &&
    phase !== undefined &&
    [
      "start_of_corp_turn",
      "start_of_runner_turn",
      "end_of_runner_turn",
      "on_leave_play",
    ].includes(phase)
  ) {
    const effectKind = effectKinds(value);
    return [
      {
        phase,
        sourcePath,
        descriptorPaths,
        resolution:
          phase === "end_of_runner_turn" && identityIsKeyed(value)
            ? "addressable_choice"
            : effectKind.every(
                  (kind) => kind === "lose_credits" || kind === "trash_source",
                )
              ? "declared_effect"
              : "requires_engine_quote",
      },
    ];
  }
  if (family === "leavePlayCleanup")
    return [
      {
        phase: "on_leave_play",
        sourcePath,
        descriptorPaths,
        resolution: "declared_effect",
      },
    ];
  if (
    family === "abilities" &&
    isObject(value) &&
    Array.isArray(value.effects) &&
    value.effects.some(
      (effect) =>
        isObject(effect) &&
        effect.kind === "choose_stack_or_trash_program_install" &&
        effect.returnInstalledCardToGripAtEndOfTurn === true,
    )
  )
    return [
      {
        phase: "end_of_turn_cleanup",
        sourcePath,
        descriptorPaths,
        resolution: "requires_engine_quote",
      },
    ];
  if (
    family === "scoredAgenda" &&
    isObject(value) &&
    value.temporaryCredits !== undefined &&
    isObject(value.temporaryCredits) &&
    value.temporaryCredits.returnUnused === true
  )
    return [
      {
        phase: "end_of_turn_cleanup",
        sourcePath,
        descriptorPaths: descriptors
          .filter((entry) => entry.path.endsWith(".temporaryCredits"))
          .map((entry) => entry.path),
        resolution: "requires_engine_quote",
      },
    ];
  return [];
}

function initialValuesFor(spec: CardSpec): ProspectiveInitializedValue[] {
  const graph = spec.engine as unknown as JsonValue;
  if (
    !containsKind(graph, "source_has_hosted_credits") &&
    !containsKind(graph, "add_hosted_credits") &&
    !containsKind(graph, "take_hosted_credits")
  )
    return [];
  let value = 0;
  let basis: ProspectiveInitializedValue["basis"] = "engine_default";
  const onInstall = spec.engine.lifecycle?.on_install ?? [];
  for (const effect of onInstall) {
    if (effect.kind === "add_hosted_credits") {
      value += effect.amount;
      basis = "on_install_declared_effect";
    }
  }
  return [{ kind: "hosted_credits", value, basis }];
}

function initialConditionFor(
  descriptors: readonly ProspectiveCapabilityDescriptor[],
  initialValues: readonly ProspectiveInitializedValue[],
): ProspectiveInitialConditionEvaluation {
  const condition = descriptors.find(
    (entry) =>
      entry.kind === "condition" &&
      isObject(entry.value) &&
      entry.value.kind === "source_has_hosted_credits",
  );
  if (condition === undefined)
    return descriptors.some((entry) => entry.kind === "condition")
      ? { state: "not_statically_evaluated" }
      : { state: "not_applicable" };
  const hosted = initialValues.find((entry) => entry.kind === "hosted_credits");
  return hosted?.value === 0
    ? {
        state: "condition_unsatisfied",
        conditionPath: condition.path,
        reason: "source_hosted_credits_initialized_to_zero",
      }
    : { state: "not_statically_evaluated" };
}

function containsKind(value: JsonValue, kind: string): boolean {
  if (Array.isArray(value))
    return value.some((entry) => containsKind(entry, kind));
  if (!isObject(value)) return false;
  if (value.kind === kind) return true;
  return Object.values(value).some((entry) => containsKind(entry, kind));
}

function effectKinds(value: JsonValue): string[] {
  if (!isObject(value)) return [];
  const effects = Array.isArray(value.effects) ? value.effects : [value];
  return effects
    .filter(isObject)
    .map((effect) => effect.kind)
    .filter((kind): kind is string => typeof kind === "string");
}

function effectKindsFromDescriptors(
  descriptors: readonly ProspectiveCapabilityDescriptor[],
): string[] {
  return descriptors
    .filter(
      (entry) => entry.kind === "capability_kind" || entry.kind === "effect",
    )
    .flatMap((entry) =>
      typeof entry.value === "string"
        ? [entry.value]
        : effectKinds(entry.value),
    );
}

function isClosedDeterministicTransition(
  descriptors: readonly ProspectiveCapabilityDescriptor[],
): boolean {
  const kinds = effectKindsFromDescriptors(descriptors);
  return (
    kinds.length > 0 &&
    kinds.every((kind) =>
      ["gain_credits", "lose_credits", "trash_source"].includes(kind),
    )
  );
}

function identityIsKeyed(value: JsonValue): boolean {
  return isObject(value) && typeof value.capabilityKey === "string";
}

function isObject(
  value: JsonValue,
): value is Readonly<Record<string, JsonValue>> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cloneJson(value: JsonValue): JsonValue {
  return JSON.parse(canonicalSerialize(value)) as JsonValue;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
