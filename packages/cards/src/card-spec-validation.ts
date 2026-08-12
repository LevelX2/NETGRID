import {
  abilityKey,
  assertAbilityKeyAlias,
  cardDefinitionId,
  capabilityKey,
  type AddressableCapabilityContract,
  type CapabilityKey,
} from "./capability-identity";
import type { CardSpec, SetSpec } from "./contracts";
import type { CardMechanicalSpec } from "./engine/card-mechanical-contracts";
import { assertPlanningAnnotations } from "./planning-annotations";
import {
  deepFreezeSerializable,
  assertStrictlySerializable,
  type DeepReadonly,
} from "./serializable";

export type CardSpecValidationErrorCode =
  | "unknown_contract_field"
  | "invalid_contract_shape"
  | "duplicate_printing_id"
  | "duplicate_capability_key"
  | "missing_capability_key"
  | "missing_capability_text"
  | "orphan_planning_capability"
  | "orphan_capability_text"
  | "forbidden_runtime_identity";

export class CardSpecValidationError extends Error {
  readonly name = "CardSpecValidationError";

  constructor(
    readonly code: CardSpecValidationErrorCode,
    readonly path: string,
    message: string,
  ) {
    super(`${code} at ${path}: ${message}`);
  }
}

const ROOT_KEYS = new Set([
  "schemaVersion",
  "identity",
  "text",
  "rules",
  "engine",
  "planningAnnotations",
  "printings",
  "publication",
]);
const IDENTITY_KEYS = new Set([
  "cardDefinitionId",
  "title",
  "side",
  "cardType",
]);
const TEXT_KEYS = new Set([
  "schemaVersion",
  "rulesText",
  "flavorText",
  "reminderText",
  "markCounterDisplay",
  "capabilityText",
]);
const MARK_COUNTER_DISPLAY_KEYS = new Set(["id", "label", "ariaLabelName"]);
const CAPABILITY_TEXT_KEYS = new Set(["capabilityKey", "actionLabel"]);
const RULES_KEYS = new Set(["schemaVersion", "references"]);
const RULE_REFERENCE_KEYS = new Set(["source", "reference", "note"]);
const ENGINE_KEY_LIST = [
  "schemaVersion",
  "characteristics",
  "abilities",
  "accessEffects",
  "accessHooks",
  "advanceable",
  "agendaAccessReplacement",
  "corpRootRezCreditOutcome",
  "corpTrashInstalledRunnerSource",
  "corpUtility",
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
  "printedSubroutines",
  "regionBaseline",
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
  "selfStealCosts",
  "successfulRunFollowups",
  "tagPreventionSources",
  "trashPreventionSources",
  "unique",
  "uniqueDirectLongtail",
  "variableRez",
  "virusCounter",
] as const satisfies readonly (keyof CardMechanicalSpec)[];
const ENGINE_KEYS = new Set<string>(ENGINE_KEY_LIST);
type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? true
    : false;
type Assert<Condition extends true> = Condition;
type EngineKeyCoverage = Assert<
  Equal<keyof CardMechanicalSpec, (typeof ENGINE_KEY_LIST)[number]>
>;
const engineKeyCoverage: EngineKeyCoverage = true;
void engineKeyCoverage;
const CHARACTERISTIC_KEYS = new Set([
  "subtypes",
  "faction",
  "numeric",
  "playCost",
  "strength",
  "baseLink",
  "memoryLimitBonus",
  "maxHandSizeBonus",
  "recurringCredits",
]);
const NUMERIC_KEYS = new Set([
  "installCost",
  "memoryCost",
  "rezCost",
  "trashCost",
  "advancementRequirement",
  "agendaPoints",
]);
const PRINTING_KEYS = new Set([
  "schemaVersion",
  "printingId",
  "setId",
  "collectorNumber",
  "rarity",
  "variant",
  "faceTextOverride",
]);
const PUBLICATION_KEYS = new Set([
  "schemaVersion",
  "status",
  "blockReason",
  "catalogBlockReason",
]);
const SET_KEYS = new Set([
  "schemaVersion",
  "setId",
  "name",
  "code",
  "sortOrder",
  "publication",
]);
const SET_PUBLICATION_KEYS = new Set(["status", "blockReason"]);
const ADDRESSABILITY = new Set(["plan", "action", "choice", "quote", "debug"]);
const ACTIVATED_ABILITY_TIMINGS = new Set([
  "runner_main",
  "runner_paid",
  "during_run",
  "runner_cost_penalty_support",
  "access_start",
  "corp_main",
  "corp_paid",
  "corp_encounter",
  "corp_during_run",
  "corp_trace_window",
  "corp_start_run_window",
  "trace_base_link_window",
  "trace_post_bid_link_window",
  "trace_success_cancel_window",
]);
const FORBIDDEN_RUNTIME_IDENTITIES = new Set([
  "actionId",
  "cardImplementationAbilityIndex",
]);
const FORBIDDEN_ENGINE_DISPLAY_FIELDS = new Set(["label", "text"]);
const ALWAYS_ADDRESSABLE_FAMILIES = new Set([
  "abilities",
  "accessEffects",
  "accessHooks",
  "agendaAccessReplacement",
  "corpTrashInstalledRunnerSource",
  "corpUtility",
  "damagePreventionSources",
  "flatlineReplacementSources",
  "fortRunWindows",
  "hiddenReplacementLongtail",
  "iceEncounter",
  "icebreakerAbilities",
  "icebreakerSubtypeChange",
  "installTargetBinding",
  "printedSubroutines",
  "relativeIce",
  "remainingReplacementLongtail",
  "runEncounterInterventions",
  "runnerCounterEffects",
  "runnerEventLongtail",
  "runnerEventTargetedEffect",
  "runnerRunStrengthBoost",
  "runnerUtilityLongtail",
  "scoredAgenda",
  "successfulRunFollowups",
  "tagPreventionSources",
  "trashPreventionSources",
  "uniqueDirectLongtail",
  "variableRez",
  "virusCounter",
  "end_of_runner_turn",
]);
const CONDITIONALLY_ADDRESSABLE_KINDS = new Set([
  "server_run_start_restriction",
  "successful_run_before_access_effect",
  "select_rezzed_ice_mark_modifier",
  "score_install_hq_cards_into_new_remote_then_rez",
]);
const FLATLINE_REPLACEMENT_SOURCE_BASE_KEYS = new Set([
  "capabilityKey",
  "abilityKey",
  "addressability",
  "kind",
  "replacement",
  "visibility",
]);
const FLATLINE_REPLACEMENT_SOURCE_KEYS = new Set([
  ...FLATLINE_REPLACEMENT_SOURCE_BASE_KEYS,
  "resolution",
  "cost",
  "damageType",
  "activeOnlyDuring",
  "badPublicity",
]);

/**
 * Validates a compile-time typed CardSpec's envelope, authority boundaries,
 * identities, references, and strict serialization. It intentionally does
 * not claim that arbitrary JSON satisfies every deep mechanical union.
 */
export function assertCardSpecContract(spec: CardSpec): void {
  assertStrictlySerializable(spec, "$cardSpec");
  const root = closedObject(spec, ROOT_KEYS, "$cardSpec");
  if (root.schemaVersion !== "card-spec-v1")
    invalid("$cardSpec.schemaVersion", "invalid version");

  const identity = closedObject(
    root.identity,
    IDENTITY_KEYS,
    "$cardSpec.identity",
  );
  if (typeof identity.cardDefinitionId !== "string")
    invalid("$cardSpec.identity.cardDefinitionId", "must be a string");
  cardDefinitionId(identity.cardDefinitionId);
  assertNonEmptyString(identity.title, "$cardSpec.identity.title");
  enumValue(identity.side, ["corp", "runner"], "$cardSpec.identity.side");
  enumValue(
    identity.cardType,
    [
      "identity",
      "event",
      "program",
      "hardware",
      "resource",
      "agenda",
      "operation",
      "asset",
      "upgrade",
      "ice",
    ],
    "$cardSpec.identity.cardType",
  );

  const text = closedObject(root.text, TEXT_KEYS, "$cardSpec.text");
  if (text.schemaVersion !== "canonical-card-text-v1")
    invalid("$cardSpec.text.schemaVersion", "invalid version");
  stringValue(text.rulesText, "$cardSpec.text.rulesText");
  optionalStringValue(text.flavorText, "$cardSpec.text.flavorText");
  optionalStringValue(text.reminderText, "$cardSpec.text.reminderText");
  if (text.markCounterDisplay !== undefined) {
    const markCounterDisplay = closedObject(
      text.markCounterDisplay,
      MARK_COUNTER_DISPLAY_KEYS,
      "$cardSpec.text.markCounterDisplay",
    );
    assertNonEmptyString(
      markCounterDisplay.id,
      "$cardSpec.text.markCounterDisplay.id",
    );
    assertNonEmptyString(
      markCounterDisplay.label,
      "$cardSpec.text.markCounterDisplay.label",
    );
    assertNonEmptyString(
      markCounterDisplay.ariaLabelName,
      "$cardSpec.text.markCounterDisplay.ariaLabelName",
    );
  }
  const capabilityTextKeys = new Set<CapabilityKey>();
  if (text.capabilityText !== undefined)
    denseArray(text.capabilityText, "$cardSpec.text.capabilityText").forEach(
      (entry, index) => {
        const path = `$cardSpec.text.capabilityText[${index}]`;
        const record = closedObject(entry, CAPABILITY_TEXT_KEYS, path);
        if (typeof record.capabilityKey !== "string")
          invalid(`${path}.capabilityKey`, "must be a string");
        const key = capabilityKey(record.capabilityKey);
        if (capabilityTextKeys.has(key))
          invalid(`${path}.capabilityKey`, "duplicate capability text key");
        capabilityTextKeys.add(key);
        assertNonEmptyString(record.actionLabel, `${path}.actionLabel`);
      },
    );

  const rules = closedObject(root.rules, RULES_KEYS, "$cardSpec.rules");
  if (rules.schemaVersion !== "card-rules-v1")
    invalid("$cardSpec.rules.schemaVersion", "invalid version");
  denseArray(rules.references, "$cardSpec.rules.references").forEach(
    (reference, index) => {
      const path = `$cardSpec.rules.references[${index}]`;
      const record = closedObject(reference, RULE_REFERENCE_KEYS, path);
      enumValue(
        record.source,
        ["comprehensive_rules", "card_text", "project_ruling"],
        `${path}.source`,
      );
      assertNonEmptyString(record.reference, `${path}.reference`);
      optionalStringValue(record.note, `${path}.note`);
    },
  );

  const engine = closedObject(root.engine, ENGINE_KEYS, "$cardSpec.engine");
  if (engine.schemaVersion !== "card-mechanical-spec-v1")
    invalid("$cardSpec.engine.schemaVersion", "invalid version");
  const characteristics = closedObject(
    engine.characteristics,
    CHARACTERISTIC_KEYS,
    "$cardSpec.engine.characteristics",
  );
  assertNonEmptyString(
    characteristics.faction,
    "$cardSpec.engine.characteristics.faction",
  );
  stringArray(
    characteristics.subtypes,
    "$cardSpec.engine.characteristics.subtypes",
  );
  const numeric = closedObject(
    characteristics.numeric,
    NUMERIC_KEYS,
    "$cardSpec.engine.characteristics.numeric",
  );
  for (const key of NUMERIC_KEYS)
    nullableNonNegativeNumber(
      numeric[key],
      `$cardSpec.engine.characteristics.numeric.${key}`,
    );
  optionalNonNegativeNumber(
    characteristics.baseLink,
    "$cardSpec.engine.characteristics.baseLink",
  );
  optionalNonNegativeNumber(
    characteristics.memoryLimitBonus,
    "$cardSpec.engine.characteristics.memoryLimitBonus",
  );
  optionalNonNegativeNumber(
    characteristics.maxHandSizeBonus,
    "$cardSpec.engine.characteristics.maxHandSizeBonus",
  );
  optionalNonNegativeNumber(
    characteristics.recurringCredits,
    "$cardSpec.engine.characteristics.recurringCredits",
  );
  if (characteristics.playCost !== null)
    assertPlayCost(
      characteristics.playCost,
      "$cardSpec.engine.characteristics.playCost",
    );
  assertResolvedStrength(
    characteristics.strength,
    "$cardSpec.engine.characteristics.strength",
  );
  assertVirusCounterScope(engine.virusCounter);
  assertCharacteristicOwnership(identity.cardType, characteristics, numeric);
  if (engine.variableRez !== undefined) {
    const variableRez = closedObject(
      engine.variableRez,
      new Set([
        "capabilityKey",
        "abilityKey",
        "addressability",
        "kind",
        "additionalCost",
        "additionalCostPerValue",
        "additionalCostPerSubroutine",
        "alternateSubtypes",
        "baseSubtypes",
        "minValue",
        "maxValue",
        "minSubroutines",
        "traceLimitFromValue",
        "visibility",
      ]),
      "$cardSpec.engine.variableRez",
    );
    if (variableRez.visibility !== "public")
      invalid("$cardSpec.engine.variableRez.visibility", "must be public");
    if (variableRez.kind === "x_strength") {
      for (const key of Object.keys(variableRez))
        if (
          ![
            "capabilityKey",
            "addressability",
            "kind",
            "additionalCostPerValue",
            "minValue",
            "maxValue",
            "traceLimitFromValue",
            "visibility",
          ].includes(key)
        )
          invalid(
            `$cardSpec.engine.variableRez.${key}`,
            "field is not valid for x-strength variable rez",
          );
      optionalNonNegativeNumber(
        variableRez.additionalCostPerValue,
        "$cardSpec.engine.variableRez.additionalCostPerValue",
      );
      optionalNonNegativeNumber(
        variableRez.minValue,
        "$cardSpec.engine.variableRez.minValue",
      );
      optionalNonNegativeNumber(
        variableRez.maxValue,
        "$cardSpec.engine.variableRez.maxValue",
      );
      if (
        variableRez.additionalCostPerValue !== 1 ||
        variableRez.minValue !== 0 ||
        variableRez.maxValue === undefined
      )
        invalid(
          "$cardSpec.engine.variableRez",
          "x-strength requires cost 1, minimum 0, and a maximum",
        );
      for (const key of ["traceLimitFromValue"])
        if (variableRez[key] !== undefined && variableRez[key] !== true)
          invalid(
            `$cardSpec.engine.variableRez.${key}`,
            "must be true when present",
          );
      const strength = closedObject(
        characteristics.strength,
        new Set(["kind", "minimumStrength", "maximumStrength"]),
        "$cardSpec.engine.characteristics.strength",
      );
      if (
        strength.kind !== "paid_x" ||
        strength.minimumStrength !== variableRez.minValue ||
        strength.maximumStrength !== variableRez.maxValue
      )
        invalid(
          "$cardSpec.engine.variableRez",
          "x_strength bounds must match paid_x strength bounds",
        );
    } else if (variableRez.kind === "paid_end_the_run_subroutines") {
      for (const key of Object.keys(variableRez))
        if (
          ![
            "capabilityKey",
            "addressability",
            "kind",
            "additionalCostPerSubroutine",
            "minSubroutines",
            "visibility",
          ].includes(key)
        )
          invalid(
            `$cardSpec.engine.variableRez.${key}`,
            "field is not valid for paid subroutines variable rez",
          );
      if (
        variableRez.additionalCostPerSubroutine !== 2 ||
        variableRez.minSubroutines !== 0
      )
        invalid(
          "$cardSpec.engine.variableRez",
          "paid end-the-run subroutines require cost 2 and minimum 0",
        );
    } else if (variableRez.kind === "alternate_subtype") {
      for (const key of Object.keys(variableRez))
        if (
          ![
            "capabilityKey",
            "addressability",
            "kind",
            "additionalCost",
            "baseSubtypes",
            "alternateSubtypes",
            "visibility",
          ].includes(key)
        )
          invalid(
            `$cardSpec.engine.variableRez.${key}`,
            "field is not valid for alternate-subtype variable rez",
          );
      optionalNonNegativeNumber(
        variableRez.additionalCost,
        "$cardSpec.engine.variableRez.additionalCost",
      );
      stringArray(
        variableRez.baseSubtypes,
        "$cardSpec.engine.variableRez.baseSubtypes",
      );
      stringArray(
        variableRez.alternateSubtypes,
        "$cardSpec.engine.variableRez.alternateSubtypes",
      );
      if (
        variableRez.additionalCost === undefined ||
        !Array.isArray(variableRez.baseSubtypes) ||
        variableRez.baseSubtypes.length === 0 ||
        !Array.isArray(variableRez.alternateSubtypes) ||
        variableRez.alternateSubtypes.length === 0
      )
        invalid(
          "$cardSpec.engine.variableRez",
          "alternate subtype requires cost and both subtype sets",
        );
    } else {
      invalid("$cardSpec.engine.variableRez.kind", "unknown variable rez kind");
    }
  }
  if (engine.regionBaseline !== undefined) {
    const region = closedObject(
      engine.regionBaseline,
      new Set([
        "kind",
        "rezOnInstall",
        "installOnlyIfRezAffordable",
        "oneRegionPerFort",
        "trashOlderRegions",
      ]),
      "$cardSpec.engine.regionBaseline",
    );
    if (region.kind !== "region_baseline")
      invalid(
        "$cardSpec.engine.regionBaseline.kind",
        "must be region_baseline",
      );
    for (const key of [
      "rezOnInstall",
      "installOnlyIfRezAffordable",
      "oneRegionPerFort",
      "trashOlderRegions",
    ] as const)
      if (region[key] !== true)
        invalid(`$cardSpec.engine.regionBaseline.${key}`, "must be true");
  }
  if (engine.flatlineReplacementSources !== undefined)
    assertFlatlineReplacementSources(
      engine.flatlineReplacementSources,
      "$cardSpec.engine.flatlineReplacementSources",
    );
  assertDynamicDamageSubroutineBinding(engine);
  assertActivatedAbilityTimingExtensions(engine.abilities);
  assertTraceSuccessCancelEffects(engine.abilities);
  assertRunnerForcedRandomActionTable(engine.uniqueDirectLongtail);

  const capabilityKeys = assertCapabilityIdentities(engine, "$cardSpec.engine");
  for (const key of capabilityTextKeys)
    if (!capabilityKeys.has(key))
      throw new CardSpecValidationError(
        "orphan_capability_text",
        "$cardSpec.text.capabilityText",
        `capability text ${key} must bind an existing engine capability`,
      );
  assertActivatedCapabilityTextCoverage(engine, capabilityTextKeys);
  if (root.planningAnnotations !== undefined) {
    assertPlanningAnnotations(root.planningAnnotations);
    assertPlanningCapabilityReferences(
      root.planningAnnotations,
      capabilityKeys,
    );
  }

  const printingIds = new Set<string>();
  denseArray(root.printings, "$cardSpec.printings").forEach(
    (printing, index) => {
      const path = `$cardSpec.printings[${index}]`;
      const record = closedObject(printing, PRINTING_KEYS, path);
      if (record.schemaVersion !== "printing-spec-v1")
        invalid(`${path}.schemaVersion`, "invalid version");
      assertNonEmptyString(record.printingId, `${path}.printingId`);
      assertNonEmptyString(record.setId, `${path}.setId`);
      optionalStringValue(record.collectorNumber, `${path}.collectorNumber`);
      optionalStringValue(record.rarity, `${path}.rarity`);
      optionalStringValue(record.variant, `${path}.variant`);
      optionalStringValue(record.faceTextOverride, `${path}.faceTextOverride`);
      const printingId = requiredString(
        record.printingId,
        `${path}.printingId`,
      );
      if (printingIds.has(printingId))
        throw new CardSpecValidationError(
          "duplicate_printing_id",
          `${path}.printingId`,
          printingId,
        );
      printingIds.add(printingId);
    },
  );
  assertPublication(root.publication, "$cardSpec.publication");
}

function assertActivatedCapabilityTextCoverage(
  engine: Record<string, unknown>,
  capabilityTextKeys: ReadonlySet<CapabilityKey>,
): void {
  if (!Array.isArray(engine.abilities)) return;
  engine.abilities.forEach((ability, index) => {
    if (typeof ability !== "object" || ability === null) return;
    const record = ability as Record<string, unknown>;
    if (
      record.kind !== "activated" ||
      !Array.isArray(record.addressability) ||
      !record.addressability.includes("action") ||
      typeof record.capabilityKey !== "string"
    )
      return;
    const key = capabilityKey(record.capabilityKey);
    if (capabilityTextKeys.has(key)) return;
    throw new CardSpecValidationError(
      "missing_capability_text",
      `$cardSpec.engine.abilities[${index}].capabilityKey`,
      `activated action capability ${key} requires canonical capability text`,
    );
  });
}

function assertFlatlineReplacementSources(value: unknown, path: string): void {
  denseArray(value, path).forEach((entry, index) => {
    const sourcePath = `${path}[${index}]`;
    const source = closedObject(
      entry,
      FLATLINE_REPLACEMENT_SOURCE_KEYS,
      sourcePath,
    );
    const baseKeys = new Set(FLATLINE_REPLACEMENT_SOURCE_BASE_KEYS);
    if (source.kind === "flatline_replacement_from_grip") {
      baseKeys.add("resolution");
      assertExactKeys(source, baseKeys, sourcePath);
      if (source.replacement !== "flatline_tag_replacement")
        invalid(
          `${sourcePath}.replacement`,
          "must be flatline_tag_replacement",
        );
      assertFlatlineTagReplacementResolution(
        source.resolution,
        `${sourcePath}.resolution`,
      );
    } else if (source.kind === "flatline_replacement_installed") {
      baseKeys.add("resolution");
      baseKeys.add("cost");
      assertExactKeys(source, baseKeys, sourcePath);
      if (source.replacement !== "installed_flatline_prevention")
        invalid(
          `${sourcePath}.replacement`,
          "must be installed_flatline_prevention",
        );
      const cost = closedObject(
        source.cost,
        new Set(["kind"]),
        `${sourcePath}.cost`,
      );
      if (cost.kind !== "trash_source")
        invalid(`${sourcePath}.cost.kind`, "must be trash_source");
      assertInstalledFlatlinePreventionResolution(
        source.resolution,
        `${sourcePath}.resolution`,
      );
    } else if (source.kind === "damage_replacement_from_grip") {
      for (const key of ["damageType", "activeOnlyDuring", "badPublicity"])
        baseKeys.add(key);
      assertExactKeys(source, baseKeys, sourcePath);
      if (source.replacement !== "prevent_meat_damage_add_bad_publicity")
        invalid(
          `${sourcePath}.replacement`,
          "must be prevent_meat_damage_add_bad_publicity",
        );
      if (source.damageType !== "meat")
        invalid(`${sourcePath}.damageType`, "must be meat");
      if (source.activeOnlyDuring !== "corp_turn")
        invalid(`${sourcePath}.activeOnlyDuring`, "must be corp_turn");
      if (source.badPublicity !== 2)
        invalid(`${sourcePath}.badPublicity`, "must be 2");
    } else invalid(`${sourcePath}.kind`, "unknown flatline replacement kind");
    if (source.visibility !== "public")
      invalid(`${sourcePath}.visibility`, "must be public");
  });
}

function assertDynamicDamageSubroutineBinding(
  engine: Record<string, unknown>,
): void {
  const printed =
    engine.printedSubroutines === undefined
      ? []
      : denseArray(
          engine.printedSubroutines,
          "$cardSpec.engine.printedSubroutines",
        );
  const derivedDamage = printed.filter((entry) => {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry))
      return false;
    const record = entry as Record<string, unknown>;
    return (
      record.kind === "damage" &&
      record.amount !== null &&
      typeof record.amount === "object" &&
      !Array.isArray(record.amount)
    );
  });
  const relativeIce =
    engine.relativeIce === undefined
      ? undefined
      : closedObject(
          engine.relativeIce,
          new Set([
            "capabilityKey",
            "abilityKey",
            "addressability",
            "kind",
            "strengthBonusPerCount",
            "dynamicDamageSubroutine",
            "dynamicTraceSubroutines",
          ]),
          "$cardSpec.engine.relativeIce",
        );
  if (relativeIce?.dynamicDamageSubroutine === undefined) {
    if (derivedDamage.length > 0)
      invalid(
        "$cardSpec.engine.printedSubroutines",
        "derived damage requires a relative ICE dynamic-damage owner",
      );
    return;
  }
  if (typeof relativeIce.capabilityKey !== "string")
    invalid(
      "$cardSpec.engine.relativeIce.capabilityKey",
      "must be a capability key",
    );
  const ownerCapabilityKey = capabilityKey(relativeIce.capabilityKey as string);
  const binding = closedObject(
    relativeIce.dynamicDamageSubroutine,
    new Set(["subroutineCapabilityKey", "amountPerCount", "visibility"]),
    "$cardSpec.engine.relativeIce.dynamicDamageSubroutine",
  );
  if (typeof binding.subroutineCapabilityKey !== "string")
    invalid(
      "$cardSpec.engine.relativeIce.dynamicDamageSubroutine.subroutineCapabilityKey",
      "must be a capability key",
    );
  const targetCapabilityKey = capabilityKey(
    binding.subroutineCapabilityKey as string,
  );
  if (
    !Number.isInteger(binding.amountPerCount) ||
    (binding.amountPerCount as number) <= 0
  )
    invalid(
      "$cardSpec.engine.relativeIce.dynamicDamageSubroutine.amountPerCount",
      "must be a positive integer",
    );
  if (binding.visibility !== "public")
    invalid(
      "$cardSpec.engine.relativeIce.dynamicDamageSubroutine.visibility",
      "must be public",
    );
  const targets = printed.filter((entry) => {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry))
      return false;
    return (
      (entry as Record<string, unknown>).capabilityKey === targetCapabilityKey
    );
  });
  if (targets.length !== 1)
    invalid(
      "$cardSpec.engine.relativeIce.dynamicDamageSubroutine.subroutineCapabilityKey",
      targets.length === 0
        ? "must reference exactly one printed subroutine"
        : "must not reference duplicate printed subroutines",
    );
  const target = targets[0] as Record<string, unknown>;
  if (target.kind !== "damage")
    invalid(
      "$cardSpec.engine.relativeIce.dynamicDamageSubroutine.subroutineCapabilityKey",
      "must reference a damage subroutine",
    );
  const amount = closedObject(
    target.amount,
    new Set(["kind", "source", "ownerCapabilityKey"]),
    "$cardSpec.engine.printedSubroutines.dynamicDamage.amount",
  );
  if (
    amount.kind !== "derived" ||
    amount.source !== "relative_ice_dynamic_damage"
  )
    invalid(
      "$cardSpec.engine.printedSubroutines.dynamicDamage.amount",
      "must declare the closed relative ICE derived source",
    );
  if (amount.ownerCapabilityKey !== ownerCapabilityKey)
    invalid(
      "$cardSpec.engine.printedSubroutines.dynamicDamage.amount.ownerCapabilityKey",
      "must reference the owning relative ICE capability",
    );
  if (derivedDamage.length !== 1 || derivedDamage[0] !== targets[0])
    invalid(
      "$cardSpec.engine.printedSubroutines",
      "must contain exactly one derived damage subroutine for the relative ICE owner",
    );
}

function assertFlatlineTagReplacementResolution(
  value: unknown,
  path: string,
): void {
  const resolution = closedObject(
    value,
    new Set([
      "trashSource",
      "removeAllCoreDamage",
      "refreshGripToMax",
      "gainCredits",
      "removeAllTags",
      "futureActionDebt",
      "futureAgendaPointForfeit",
    ]),
    path,
  );
  const required: Record<string, true | number> = {
    trashSource: true,
    removeAllCoreDamage: true,
    refreshGripToMax: true,
    gainCredits: 10,
    removeAllTags: true,
    futureActionDebt: 4,
    futureAgendaPointForfeit: 3,
  };
  for (const [key, expected] of Object.entries(required))
    if (resolution[key] !== expected)
      invalid(`${path}.${key}`, `must be ${String(expected)}`);
}

function assertInstalledFlatlinePreventionResolution(
  value: unknown,
  path: string,
): void {
  const resolution = closedObject(
    value,
    new Set([
      "trashAllGrip",
      "removeAllCoreDamage",
      "maxHandSizeModifier",
      "runnerActionsPerTurnOverride",
      "permanentMeatDamagePrevention",
    ]),
    path,
  );
  const required: Record<string, true | number> = {
    trashAllGrip: true,
    removeAllCoreDamage: true,
    maxHandSizeModifier: -1,
    runnerActionsPerTurnOverride: 3,
    permanentMeatDamagePrevention: true,
  };
  for (const [key, expected] of Object.entries(required))
    if (resolution[key] !== expected)
      invalid(`${path}.${key}`, `must be ${String(expected)}`);
}

function assertExactKeys(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  path: string,
): void {
  for (const key of Object.keys(value))
    if (!allowed.has(key))
      throw new CardSpecValidationError(
        "unknown_contract_field",
        `${path}.${key}`,
        "field is outside the closed CardSpec contract",
      );
}

function assertCharacteristicOwnership(
  cardType: unknown,
  characteristics: Record<string, unknown>,
  numeric: Record<string, unknown>,
): void {
  const type = requiredString(cardType, "$cardSpec.identity.cardType");
  const numericPath = "$cardSpec.engine.characteristics.numeric";
  const requireNumber = (key: string): void => {
    if (typeof numeric[key] !== "number")
      invalid(`${numericPath}.${key}`, `${type} cards require this value`);
  };
  const requireNull = (key: string): void => {
    if (numeric[key] !== null)
      invalid(
        `${numericPath}.${key}`,
        `${type} cards must not declare this value`,
      );
  };
  const allNumeric = [...NUMERIC_KEYS];
  const requiredNumeric: Record<string, readonly string[]> = {
    identity: [],
    event: [],
    operation: [],
    program: ["installCost", "memoryCost"],
    hardware: ["installCost"],
    resource: ["installCost"],
    agenda: ["advancementRequirement", "agendaPoints"],
    asset: ["rezCost", "trashCost"],
    upgrade: ["rezCost", "trashCost"],
    ice: ["rezCost"],
  };
  const required = requiredNumeric[type];
  if (required === undefined)
    invalid("$cardSpec.identity.cardType", `unknown card type ${type}`);
  for (const key of allNumeric)
    if (required.includes(key)) requireNumber(key);
    else requireNull(key);

  const played = type === "event" || type === "operation";
  if (played !== (characteristics.playCost !== null))
    invalid(
      "$cardSpec.engine.characteristics.playCost",
      played
        ? `${type} cards require a play cost`
        : `${type} cards must not declare a play cost`,
    );

  const strength = characteristics.strength as Record<string, unknown>;
  const strengthRequired =
    type === "ice" ||
    (type === "program" &&
      (characteristics.subtypes as readonly unknown[]).includes("icebreaker"));
  if (strengthRequired && strength.kind === "not_applicable")
    invalid(
      "$cardSpec.engine.characteristics.strength",
      `${type} ice capabilities require fixed or variable strength`,
    );
  if (!strengthRequired && strength.kind !== "not_applicable")
    invalid(
      "$cardSpec.engine.characteristics.strength",
      `${type} cards must not declare strength`,
    );
}

export function assertSetSpecContract(spec: unknown): asserts spec is SetSpec {
  assertStrictlySerializable(spec, "$setSpec");
  const root = closedObject(spec, SET_KEYS, "$setSpec");
  if (root.schemaVersion !== "set-spec-v1")
    invalid("$setSpec.schemaVersion", "invalid version");
  assertNonEmptyString(root.setId, "$setSpec.setId");
  assertNonEmptyString(root.name, "$setSpec.name");
  optionalStringValue(root.code, "$setSpec.code");
  if (
    typeof root.sortOrder !== "number" ||
    !Number.isInteger(root.sortOrder) ||
    root.sortOrder < 0
  )
    invalid("$setSpec.sortOrder", "must be a non-negative integer");
  const publication = closedObject(
    root.publication,
    SET_PUBLICATION_KEYS,
    "$setSpec.publication",
  );
  assertEditorialPublication(publication, "$setSpec.publication");
}

export function finalizeCardSpec(spec: CardSpec): DeepReadonly<CardSpec> {
  assertCardSpecContract(spec);
  return deepFreezeSerializable(spec);
}

export function finalizeSetSpec(spec: SetSpec): DeepReadonly<SetSpec> {
  assertSetSpecContract(spec);
  return deepFreezeSerializable(spec);
}

function assertPublication(value: unknown, path: string): void {
  const publication = closedObject(value, PUBLICATION_KEYS, path);
  if (publication.schemaVersion !== "card-publication-v1")
    invalid(`${path}.schemaVersion`, "invalid version");
  assertEditorialPublication(publication, path);
}

function assertEditorialPublication(
  publication: Record<string, unknown>,
  path: string,
): void {
  enumValue(
    publication.status,
    ["active", "experimental", "disabled"],
    `${path}.status`,
  );
  if (publication.status === "disabled")
    assertNonEmptyString(publication.blockReason, `${path}.blockReason`);
  else if (publication.blockReason !== undefined)
    invalid(`${path}.blockReason`, "is allowed only for disabled publication");
  if (publication.catalogBlockReason !== undefined) {
    if (publication.status !== "experimental")
      invalid(
        `${path}.catalogBlockReason`,
        "is allowed only for experimental catalog entries",
      );
    assertNonEmptyString(
      publication.catalogBlockReason,
      `${path}.catalogBlockReason`,
    );
  }
}

function assertActivatedAbilityTimingExtensions(value: unknown): void {
  if (value === undefined) return;
  for (const [index, ability] of denseArray(
    value,
    "$cardSpec.engine.abilities",
  ).entries()) {
    const path = `$cardSpec.engine.abilities[${index}]`;
    const record = ability as Record<string, unknown>;
    if (record.kind !== "activated" || record.additionalTimings === undefined)
      continue;
    const baseTiming = record.timing;
    if (
      typeof baseTiming !== "string" ||
      !ACTIVATED_ABILITY_TIMINGS.has(baseTiming)
    )
      invalid(`${path}.timing`, "must be a known activated ability timing");
    const seen = new Set<string>();
    for (const [timingIndex, timingEntry] of denseArray(
      record.additionalTimings,
      `${path}.additionalTimings`,
    ).entries()) {
      const timingPath = `${path}.additionalTimings[${timingIndex}]`;
      const timing = closedObject(
        timingEntry,
        new Set(["timing", "condition"]),
        timingPath,
      );
      if (
        typeof timing.timing !== "string" ||
        !ACTIVATED_ABILITY_TIMINGS.has(timing.timing)
      )
        invalid(
          `${timingPath}.timing`,
          "must be a known activated ability timing",
        );
      if (timing.timing === baseTiming)
        invalid(
          `${timingPath}.timing`,
          "must not duplicate the ordinary timing",
        );
      if (seen.has(timing.timing))
        invalid(
          `${timingPath}.timing`,
          "must not duplicate an additional timing",
        );
      seen.add(timing.timing);
    }
  }
}

function assertTraceSuccessCancelEffects(value: unknown): void {
  if (value === undefined) return;
  for (const [index, ability] of denseArray(
    value,
    "$cardSpec.engine.abilities",
  ).entries()) {
    const path = `$cardSpec.engine.abilities[${index}]`;
    const record = ability as Record<string, unknown>;
    if (record.kind !== "activated") continue;
    const effects = Array.isArray(record.effects) ? record.effects : [];
    const cancelEffects = effects.filter(
      (effect) =>
        (effect as Record<string, unknown>).kind ===
        "cancel_successful_trace_effect",
    );
    const badPublicityEffects = effects.filter(
      (effect) =>
        (effect as Record<string, unknown>).kind ===
        "add_bad_publicity_if_cancelled_trace_has_non_tag_effect",
    );
    if (cancelEffects.length === 0 && badPublicityEffects.length === 0)
      continue;
    if (record.timing !== "trace_success_cancel_window")
      invalid(
        path,
        "trace-cancel effects require the trace success cancel timing",
      );
    if (cancelEffects.length !== 1)
      invalid(path, "trace-cancel abilities require exactly one cancel effect");
    if (badPublicityEffects.length > 1)
      invalid(
        path,
        "trace-cancel abilities permit at most one Bad Publicity consequence",
      );
    for (const effect of badPublicityEffects) {
      const effectPath = `${path}.effects[${effects.indexOf(effect)}]`;
      const amount = (effect as Record<string, unknown>).amount;
      if (!Number.isInteger(amount) || (amount as number) <= 0)
        invalid(`${effectPath}.amount`, "must be a positive integer");
    }
  }
}

function assertRunnerForcedRandomActionTable(value: unknown): void {
  if (value === undefined) return;
  const record = value as Record<string, unknown>;
  if (record.kind !== "runner_start_turn_forced_random_action") return;
  if (record.mustTakeIfPossible !== true)
    invalid(
      "$cardSpec.engine.uniqueDirectLongtail.mustTakeIfPossible",
      "must be true for a forced random action",
    );
  const outcomes = denseArray(
    record.outcomes,
    "$cardSpec.engine.uniqueDirectLongtail.outcomes",
  );
  if (outcomes.length !== 6)
    invalid(
      "$cardSpec.engine.uniqueDirectLongtail.outcomes",
      "must declare exactly six die outcomes",
    );
  const allowedActions = new Set([
    "draw_card",
    "gain_credit",
    "make_run_rd",
    "make_run_hq",
    "make_run_remote",
    "reveal_random_grip_card_to_corp_and_play_or_install",
  ]);
  const seen = new Set<number>();
  for (const [index, outcome] of outcomes.entries()) {
    const path = `$cardSpec.engine.uniqueDirectLongtail.outcomes[${index}]`;
    const entry = closedObject(outcome, new Set(["dieRoll", "action"]), path);
    if (
      !Number.isInteger(entry.dieRoll) ||
      (entry.dieRoll as number) < 1 ||
      (entry.dieRoll as number) > 6
    )
      invalid(`${path}.dieRoll`, "must be a die result from 1 through 6");
    const dieRoll = entry.dieRoll as number;
    if (seen.has(dieRoll)) invalid(`${path}.dieRoll`, "must not be duplicated");
    seen.add(dieRoll);
    if (typeof entry.action !== "string" || !allowedActions.has(entry.action))
      invalid(`${path}.action`, "must be a known forced-action outcome");
  }
}

function assertVirusCounterScope(value: unknown): void {
  if (value === undefined) return;
  const virusCounter = value as Record<string, unknown>;
  if (virusCounter.addOnSuccessfulRun === undefined) return;
  const trigger = closedObject(
    virusCounter.addOnSuccessfulRun,
    new Set(["server", "counterScope", "amount", "visibility"]),
    "$cardSpec.engine.virusCounter.addOnSuccessfulRun",
  );
  const scope = closedObject(
    trigger.counterScope,
    new Set(["kind"]),
    "$cardSpec.engine.virusCounter.addOnSuccessfulRun.counterScope",
  );
  enumValue(
    scope.kind,
    [
      "source_card",
      "shared_corp_pool",
      "attacked_server",
      "chosen_fully_broken_ice",
      "attacked_central_server_pool",
    ],
    "$cardSpec.engine.virusCounter.addOnSuccessfulRun.counterScope.kind",
  );
}

function assertCapabilityIdentities(
  value: unknown,
  path: string,
): ReadonlySet<CapabilityKey> {
  const keys = new Set<CapabilityKey>();
  visit(value, path, false);

  function visit(
    current: unknown,
    currentPath: string,
    addressabilityRequired: boolean,
  ): void {
    if (current === null || typeof current !== "object") return;
    if (Array.isArray(current)) {
      current.forEach((entry, index) =>
        visit(entry, `${currentPath}[${index}]`, addressabilityRequired),
      );
      return;
    }
    const record = current as Record<string, unknown>;
    for (const displayField of FORBIDDEN_ENGINE_DISPLAY_FIELDS)
      if (Object.hasOwn(record, displayField))
        throw new CardSpecValidationError(
          "unknown_contract_field",
          `${currentPath}.${displayField}`,
          "display copy belongs to CardSpec.text or a later public projection",
        );
    for (const forbidden of FORBIDDEN_RUNTIME_IDENTITIES)
      if (Object.hasOwn(record, forbidden))
        throw new CardSpecValidationError(
          "forbidden_runtime_identity",
          `${currentPath}.${forbidden}`,
          "future action IDs and legacy array indices are not CardSpec semantics",
        );

    const hasAddressability = Object.hasOwn(record, "addressability");
    const hasCapabilityKey = Object.hasOwn(record, "capabilityKey");
    const hasAbilityKey = Object.hasOwn(record, "abilityKey");
    const nodeRequiresAddressability =
      addressabilityRequired ||
      (typeof record.kind === "string" &&
        CONDITIONALLY_ADDRESSABLE_KINDS.has(record.kind));
    if (
      (nodeRequiresAddressability || hasAddressability || hasAbilityKey) &&
      !hasCapabilityKey
    )
      throw new CardSpecValidationError(
        "missing_capability_key",
        currentPath,
        "addressable nodes and abilityKey aliases require capabilityKey",
      );
    if (nodeRequiresAddressability && !hasAddressability)
      throw new CardSpecValidationError(
        "missing_capability_key",
        currentPath,
        "addressable capability nodes require an explicit addressability contract",
      );
    if (hasAddressability) {
      if (
        !Array.isArray(record.addressability) ||
        record.addressability.length === 0
      )
        invalid(`${currentPath}.addressability`, "must be a non-empty array");
      const addressabilityValues = new Set<string>();
      for (const [index, entry] of record.addressability.entries())
        if (typeof entry !== "string" || !ADDRESSABILITY.has(entry))
          invalid(
            `${currentPath}.addressability[${index}]`,
            "unknown addressability",
          );
        else if (addressabilityValues.has(entry))
          invalid(
            `${currentPath}.addressability[${index}]`,
            "duplicate addressability",
          );
        else addressabilityValues.add(entry);
    }
    if (hasCapabilityKey) {
      if (typeof record.capabilityKey !== "string")
        invalid(`${currentPath}.capabilityKey`, "must be a string");
      const key = capabilityKey(record.capabilityKey);
      if (keys.has(key))
        throw new CardSpecValidationError(
          "duplicate_capability_key",
          `${currentPath}.capabilityKey`,
          key,
        );
      keys.add(key);
      if (hasAbilityKey && typeof record.abilityKey !== "string")
        invalid(`${currentPath}.abilityKey`, "must be a string");
      const alias = hasAbilityKey
        ? abilityKey(record.abilityKey as string)
        : undefined;
      const identity: Pick<
        AddressableCapabilityContract,
        "capabilityKey" | "abilityKey"
      > =
        alias === undefined
          ? { capabilityKey: key }
          : { capabilityKey: key, abilityKey: alias };
      assertAbilityKeyAlias(identity, currentPath);
    }
    for (const [key, entry] of Object.entries(record))
      visit(
        entry,
        `${currentPath}.${key}`,
        ALWAYS_ADDRESSABLE_FAMILIES.has(key),
      );
  }
  return keys;
}

function assertPlanningCapabilityReferences(
  value: unknown,
  engineKeys: ReadonlySet<CapabilityKey>,
): void {
  const root = value as { capabilities?: readonly { capabilityKey: string }[] };
  for (const [index, capability] of (root.capabilities ?? []).entries()) {
    const key = capabilityKey(capability.capabilityKey);
    if (!engineKeys.has(key))
      throw new CardSpecValidationError(
        "orphan_planning_capability",
        `$cardSpec.planningAnnotations.capabilities[${index}].capabilityKey`,
        "planning annotations must bind an existing engine capability",
      );
  }
}

function closedObject(
  value: unknown,
  allowed: ReadonlySet<string>,
  path: string,
): Record<string, unknown> {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  )
    invalid(path, "must be a plain object");
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record))
    if (!allowed.has(key))
      throw new CardSpecValidationError(
        "unknown_contract_field",
        `${path}.${key}`,
        "field is outside the closed CardSpec contract",
      );
  return record;
}

function assertNonEmptyString(
  value: unknown,
  path: string,
): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0)
    invalid(path, "must be a non-empty string");
}

function requiredString(value: unknown, path: string): string {
  assertNonEmptyString(value, path);
  return value;
}

function stringValue(value: unknown, path: string): void {
  if (typeof value !== "string") invalid(path, "must be a string");
}

function optionalStringValue(value: unknown, path: string): void {
  if (value !== undefined) stringValue(value, path);
}

function enumValue(
  value: unknown,
  allowed: readonly string[],
  path: string,
): void {
  if (typeof value !== "string" || !allowed.includes(value))
    invalid(path, `must be one of ${allowed.join(", ")}`);
}

function denseArray(value: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(value)) invalid(path, "must be an array");
  for (let index = 0; index < value.length; index += 1)
    if (!Object.hasOwn(value, index))
      invalid(`${path}[${index}]`, "array hole");
  return value;
}

function stringArray(value: unknown, path: string): void {
  denseArray(value, path).forEach((entry, index) =>
    assertNonEmptyString(entry, `${path}[${index}]`),
  );
}

function nullableNonNegativeNumber(value: unknown, path: string): void {
  if (
    value !== null &&
    (typeof value !== "number" || !Number.isInteger(value) || value < 0)
  )
    invalid(path, "must be a non-negative integer or null");
}

function optionalNonNegativeNumber(value: unknown, path: string): void {
  if (value === undefined) return;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0)
    invalid(path, "must be a non-negative integer");
}

function assertPlayCost(value: unknown, path: string): void {
  const record = closedObject(
    value,
    new Set(["kind", "credits", "minimumX", "creditsPerX", "maximumX"]),
    path,
  );
  if (record.kind === "fixed") {
    for (const key of Object.keys(record))
      if (!["kind", "credits"].includes(key))
        invalid(`${path}.${key}`, "field is not valid for fixed play cost");
    optionalNonNegativeNumber(record.credits, `${path}.credits`);
    if (record.credits === undefined) invalid(`${path}.credits`, "is required");
    return;
  }
  if (record.kind !== "variable_x")
    invalid(`${path}.kind`, "unknown play cost");
  for (const key of Object.keys(record))
    if (!["kind", "minimumX", "creditsPerX", "maximumX"].includes(key))
      invalid(`${path}.${key}`, "field is not valid for variable-X play cost");
  optionalNonNegativeNumber(record.minimumX, `${path}.minimumX`);
  optionalNonNegativeNumber(record.creditsPerX, `${path}.creditsPerX`);
  if (record.minimumX === undefined || record.creditsPerX === undefined)
    invalid(path, "minimumX and creditsPerX are required");
  const maximum = closedObject(
    record.maximumX,
    new Set(["kind"]),
    `${path}.maximumX`,
  );
  if (maximum.kind !== "context")
    invalid(`${path}.maximumX.kind`, "must be context");
}

function assertResolvedStrength(value: unknown, path: string): void {
  const record = closedObject(
    value,
    new Set([
      "kind",
      "value",
      "minimumStrength",
      "maximumStrength",
      "dieSides",
    ]),
    path,
  );
  if (record.kind === "not_applicable") {
    if (Object.keys(record).length !== 1)
      invalid(path, "not_applicable strength has no additional fields");
    return;
  }
  if (record.kind === "fixed") {
    if (Object.keys(record).some((key) => !["kind", "value"].includes(key)))
      invalid(path, "fixed strength accepts only value");
    optionalNonNegativeNumber(record.value, `${path}.value`);
    if (record.value === undefined) invalid(`${path}.value`, "is required");
    return;
  }
  if (record.kind === "paid_x") {
    if (
      Object.keys(record).some(
        (key) => !["kind", "minimumStrength", "maximumStrength"].includes(key),
      )
    )
      invalid(path, "paid_x strength accepts only minimum and maximum");
    optionalNonNegativeNumber(
      record.minimumStrength,
      `${path}.minimumStrength`,
    );
    optionalNonNegativeNumber(
      record.maximumStrength,
      `${path}.maximumStrength`,
    );
    if (
      typeof record.minimumStrength !== "number" ||
      typeof record.maximumStrength !== "number"
    )
      invalid(path, "paid_x strength requires minimum and maximum");
    if (record.maximumStrength < record.minimumStrength)
      invalid(path, "paid_x maximumStrength must not be below minimumStrength");
    return;
  }
  if (record.kind !== "random_die")
    invalid(`${path}.kind`, "unknown strength model");
  if (Object.keys(record).some((key) => !["kind", "dieSides"].includes(key)))
    invalid(path, "random_die strength accepts only dieSides");
  optionalNonNegativeNumber(record.dieSides, `${path}.dieSides`);
  if (typeof record.dieSides !== "number" || record.dieSides < 2)
    invalid(`${path}.dieSides`, "must be an integer of at least 2");
}

function invalid(path: string, message: string): never {
  throw new CardSpecValidationError("invalid_contract_shape", path, message);
}
