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
const PUBLICATION_KEYS = new Set(["schemaVersion", "status", "blockReason"]);
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

  const capabilityKeys = assertCapabilityIdentities(engine, "$cardSpec.engine");
  for (const key of capabilityTextKeys)
    if (!capabilityKeys.has(key))
      throw new CardSpecValidationError(
        "orphan_capability_text",
        "$cardSpec.text.capabilityText",
        `capability text ${key} must bind an existing engine capability`,
      );
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
      record.minimumStrength === undefined ||
      record.maximumStrength === undefined
    )
      invalid(path, "paid_x strength requires minimum and maximum");
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
