import { execFileSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { format } from "prettier";
import ts from "typescript";
import {
  assertDerivedCounts,
  expression,
  extractSingleExportedConstObject,
  parseSetMigrationInvocation,
  renderValue,
  sha256,
  verifyMigrationOutputs,
} from "./card-spec-migration-core.mjs";
import {
  ORIGINALSET_V1_ACTION_STRATEGY_CAPABILITY_SLOTS,
  ORIGINALSET_V1_ADDRESSABLE_FAMILIES,
  ORIGINALSET_V1_CAPABILITY_KEYS,
  ORIGINALSET_V1_HELPER_SYMBOLS,
  ORIGINALSET_V1_MECHANICAL_PLAN_ROLES,
  ORIGINALSET_V1_MECHANICAL_RECONCILIATIONS,
  ORIGINALSET_V1_PLANNING_ONTOLOGY_FINGERPRINTS,
  ORIGINALSET_V1_PLANNING_PLAN_ROLES,
  ORIGINALSET_V1_PLANNING_TACTIC_INTERPRETATIONS,
  ORIGINALSET_V1_SHARED_ABILITY_DISPOSITIONS,
  ORIGINALSET_V1_UNADDRESSABLE_ACTION_STRATEGY_DISPOSITIONS,
  ORIGINALSET_V1_VALUE_HINT_DISPOSITIONS,
} from "./originalset-v1-card-spec-migration-disposition.mjs";

const root = process.cwd();
const SOURCE_COMMIT = "7ce7675d9dd99347d009c3928b44968d5dd80eb0";
const RAW_PATH = "data/cards/originalset-v1-cards.json";
const SUPPORT_PATH = "data/manifests/originalset-v1-card-support.json";
const HINT_PATH = "data/ai/ai-card-hints-active.json";
const SHARED_DEFINITIONS_PATH = "packages/shared/src/card-definitions.ts";
const IMPLEMENTATION_ROOT = "packages/engine/src/card-implementations/onr-v1";
const SUBREGISTRY_ROOT =
  "packages/engine/src/card-implementations/subregistries";
const EXISTING_SPEC_ROOT = "packages/cards/src/specs/originalset-v1";
const REPORT_TARGET =
  "docs/reviews/cards/originalset-v1-card-spec-migration-report.json";
const SET_SPEC_TARGET = "packages/cards/src/sets/originalset-v1.set-spec.ts";
const descriptor = Object.freeze({
  setId: "originalset-v1",
  expected: Object.freeze({
    rawCards: 367,
    supportEntries: 367,
    legacyHints: 367,
    legacyImplementationModules: 366,
    legacyImplementationSubregistries: 32,
    existingCardSpecs: 7,
    existingAddressableNodes: 9,
    plannedProjectedImplementations: 366,
    plannedDefinitionOnlyRuntime: 1,
    legacyTopLevelFamilies: 37,
    addressableNodes: 406,
    importedHelperModules: 83,
    importedHelperSymbols: 19,
  }),
});
const { mode } = parseSetMigrationInvocation(process.argv, {
  "originalset-v1": descriptor,
});

const implementationPaths = gitList(IMPLEMENTATION_ROOT).filter((entry) =>
  entry.endsWith(".ts"),
);
const subregistryPaths = gitList(SUBREGISTRY_ROOT).filter(
  (entry) => /\/onr-v1-.*\.ts$/.test(entry) && !entry.endsWith(".test.ts"),
);
const existingSpecPaths = gitList(EXISTING_SPEC_ROOT).filter((entry) =>
  entry.endsWith(".card-spec.ts"),
);

const sourceText = (relativePath) => gitShow(relativePath);
const sourceCards = JSON.parse(sourceText(RAW_PATH)).cards;
const sourceSupport = JSON.parse(sourceText(SUPPORT_PATH)).cards;
const sourceHints = JSON.parse(sourceText(HINT_PATH)).cards;
const sharedDefinitions = evaluatePinnedSharedDefinitions(
  sourceText(SHARED_DEFINITIONS_PATH),
);
const sharedDefinitionsById = new Map(
  sharedDefinitions.map((definition) => [definition.id, definition]),
);
const sharedDefinitionIds = new Set(
  [
    ...sourceText(SHARED_DEFINITIONS_PATH).matchAll(/id: "(onr_v1_[^"]+)"/g),
  ].map((match) => match[1]),
);
const rawVariableStrengthIds = sourceCards
  .filter((card) => card.variableStrength !== undefined)
  .map((card) => card.cardId);
assertExactSet(
  new Set(["onr_v1_002_ai-boon"]),
  new Set(rawVariableStrengthIds),
  "originalset_v1_raw_variable_strength_inventory_mismatch",
);

const ORIGINALSET_V1_HELPER_CALLS = Object.freeze({
  addHostedCredits: ([amount]) => ({
    kind: "add_hosted_credits",
    target: "source",
    amount,
    visibility: "public",
  }),
  basicIcebreakerAbilities: ([input]) => [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: input.breakCost },
      matches: input.matches,
      visibility: "public",
      ...(input.breakCount === undefined ? {} : { count: input.breakCount }),
    },
    {
      kind: "increase_strength",
      cost: { kind: "credit", amount: input.pumpCost },
      amount: input.pumpAmount ?? 1,
      duration: input.pumpDuration ?? "current_encounter",
      visibility: "public",
    },
  ],
  brainDamageSubroutine: ([amount]) => ({
    kind: "damage",
    damageType: "brain",
    amount,
    preventable: true,
    text: `*Do ${amount} brain damage.`,
  }),
  endTheRunSubroutine: () => ({ kind: "end_the_run", text: "*End the run." }),
  endTheRunSubroutines: ([count]) =>
    Array.from({ length: count }, () => ({
      kind: "end_the_run",
      text: "*End the run.",
    })),
  hostedCreditAddAbility: ([input]) => ({
    kind: "activated",
    timing: input.timing,
    costs: [{ kind: "action", amount: 1 }],
    ...(input.limit ? { limit: input.limit } : {}),
    label: input.label,
    effects: [
      {
        kind: "add_hosted_credits",
        target: "source",
        amount: input.amount,
        visibility: "public",
      },
    ],
  }),
  hostedCreditTakeAbility: ([input]) => ({
    kind: "activated",
    timing: input.timing,
    costs: [{ kind: "action", amount: 1 }],
    condition: { kind: "source_has_hosted_credits" },
    ...(input.limit ? { limit: input.limit } : {}),
    label: input.label,
    effects: [
      {
        kind: "take_hosted_credits",
        source: "source",
        recipient: "controller",
        ...(input.amount === undefined ? {} : { amount: input.amount }),
        ...(input.mode === undefined ? {} : { mode: input.mode }),
        visibility: "public",
      },
      ...(input.trashWhenEmpty && input.amount !== undefined
        ? [
            {
              kind: "trash_source_when_empty",
              source: "source",
              visibility: "public",
            },
          ]
        : []),
    ],
  }),
  hostedCreditTakeTurnTrigger: ([input]) => ({
    condition: { kind: "source_has_hosted_credits" },
    effects: [
      {
        kind: "take_hosted_credits",
        source: "source",
        recipient: "controller",
        amount: input.amount,
        mode: "up_to_amount_if_available",
        visibility: "public",
      },
      ...(input.trashWhenEmpty
        ? [
            {
              kind: "trash_source_when_empty",
              source: "source",
              visibility: "public",
            },
          ]
        : []),
    ],
  }),
  lookTopStackShowToCorpThenInstallMatchingEffect: () => ({
    kind: "look_top_stack_show_to_corp_then_install_matching",
    count: 5,
    allowedTypes: ["program"],
    installCost: "free",
    trashSourceIfInstalled: true,
    shuffleAfterwards: true,
    visibility: "hidden_info_barrier",
  }),
  lookTopStackTakeMatchingEffect: ([input]) => ({
    kind: "look_top_stack_take_matching",
    count: input.count,
    allowedTypes: input.allowedTypes,
    costPerTaken: input.costPerTaken,
    revealTakenToCorp: true,
    shuffleRemainder: true,
    visibility: "hidden_info_barrier",
  }),
  lookTopStackTakeOneArrangeRestEffect: () => ({
    kind: "look_top_stack_take_one_arrange_rest",
    count: 5,
    visibility: "hidden_info_barrier",
  }),
  netDamageSubroutine: ([amount]) => ({
    kind: "damage",
    damageType: "net",
    amount,
    preventable: true,
    text: `*Do ${amount} Net damage.`,
  }),
  restrictedHostedCreditSource: ([input]) => ({
    capacity: input.capacity,
    counterType: "bit",
    usableFor: input.usableFor,
    refresh: {
      timing: "start_of_runner_turn",
      mode: "refill_to_capacity_if_used",
    },
    ...(input.allowUseWhileOverwritingSource
      ? { allowUseWhileOverwritingSource: true }
      : {}),
    ...(input.requireHostedBreakerForIcebreakerUse
      ? { requireHostedBreakerForIcebreakerUse: true }
      : {}),
  }),
  scoredRezzedIceMarkModifier: ([input = {}]) => ({
    kind: "select_rezzed_ice_mark_modifier",
    abilityKey: input.abilityKey ?? "scored_ice_mark:0",
    target: "rezzed_installed_ice",
    counterType: "mark",
    counterAmount: 1,
    strengthBonusPerCounter: 1,
    duplicateEachPrintedSubroutinePerCounter: true,
    visibility: "public",
  }),
  searchStackInstallEffect: ([input]) => ({
    kind: "search_stack_install",
    filter: "program",
    installCost: input.installCost,
    shuffleAfterwards: true,
    visibility: "hidden_info_barrier",
  }),
  searchStackToGripEffect: ([input]) => ({
    kind: "search_stack_to_grip",
    filter: input.filter,
    revealToCorp: input.revealToCorp,
    shuffleAfterwards: true,
    visibility: "hidden_info_barrier",
  }),
  traceTagEffect: ([traceLimit, amount = 1]) => ({
    kind: "trace",
    traceLimit,
    visibility: "public",
    onSuccess: [
      { kind: "add_tags", recipient: "runner", amount, visibility: "public" },
    ],
  }),
  traceTagSubroutine: ([traceLimit, amount = 1]) => ({
    kind: "trace",
    traceLimit,
    text: `*Trace ${traceLimit}-If trace is successful, ${amount === 1 ? "give Runner a tag" : `give Runner ${amount} tags`}.`,
    onSuccess: [
      { kind: "add_tags", recipient: "runner", amount, visibility: "public" },
    ],
  }),
  trashProgramSubroutine: () => ({
    kind: "trash_program",
    text: "*Trash a program.",
  }),
});

const implementations = implementationPaths.map(inventoryImplementation);
const rawIds = new Set(sourceCards.map((card) => card.cardId));
const hintIds = sourceHints
  .filter((hint) => rawIds.has(hint.cardId))
  .map((hint) => hint.cardId);
const supportIds = sourceSupport.map((entry) => entry.cardId);
const existingIds = existingSpecPaths.map(idFromSpecPath);
const existingAddressableNodes = existingSpecPaths.reduce(
  (total, relativePath) =>
    total + engineAddressableNodeCount(sourceText(relativePath)),
  0,
);
const implementationIds = implementations.map(
  (entry) => entry.cardDefinitionId,
);
const definitionOnlyIds = sourceCards
  .map((card) => card.cardId)
  .filter((id) => !implementationIds.includes(id));
const familyCounts = countBy(
  implementations.flatMap((entry) => entry.families),
);
const addressableFamilyNodeCounts = countBy(
  implementations.flatMap((entry) =>
    entry.addressableNodes.map((node) => node.family),
  ),
);
const importedHelperModules = implementations.filter(
  (entry) => entry.helperImports.length > 0,
);
const importedHelperSymbols = [
  ...new Set(importedHelperModules.flatMap((entry) => entry.helperImports)),
].sort();

assertExactSet(rawIds, supportIds, "originalset_v1_support_inventory_mismatch");
assertExactSet(rawIds, hintIds, "originalset_v1_hint_inventory_mismatch");
if (existingIds.some((id) => rawIds.has(id)))
  fail("originalset_v1_existing_specs_must_be_disjoint_from_raw_inventory");
if (
  definitionOnlyIds.length !== 1 ||
  definitionOnlyIds[0] !== "onr_v1_220_tycho-extension"
)
  fail("originalset_v1_definition_only_disposition_mismatch");
if (new Set(implementationIds).size !== implementationIds.length)
  fail("originalset_v1_duplicate_implementation_definition");
if (implementationIds.some((id) => !rawIds.has(id)))
  fail("originalset_v1_implementation_outside_raw_inventory");
if ([...rawIds].some((id) => !sharedDefinitionIds.has(id)))
  fail("originalset_v1_shared_definition_inventory_mismatch");
if (
  importedHelperSymbols.some((name) => !ORIGINALSET_V1_HELPER_SYMBOLS.has(name))
)
  fail("originalset_v1_unknown_helper_symbol");

const addressableNodes = implementations.flatMap(
  (entry) => entry.addressableNodes,
);
const capabilityKeys = requiredCapabilityKeys(addressableNodes);
const sourceHintsById = new Map(
  sourceHints
    .filter((hint) => rawIds.has(hint.cardId))
    .map((hint) => [hint.cardId, hint]),
);
const planningEvidence = requiredOriginalsetPlanningEvidence(
  [...sourceHintsById.values()],
  capabilityKeys,
);
const planningAnnotationsById = new Map(
  [...sourceHintsById.entries()].map(([cardDefinitionId, hint]) => [
    cardDefinitionId,
    originalsetPlanningAnnotations(cardDefinitionId, hint, capabilityKeys),
  ]),
);
const planningProjection = summarizePlanningProjection(
  planningAnnotationsById,
  planningEvidence,
  [...sourceHintsById.values()],
);
const sharedAbilityParity = requiredSharedAbilityParity(sharedDefinitionsById);
const sharedPrintedSubroutineParity = requiredSharedPrintedSubroutineParity(
  implementations,
  sharedDefinitionsById,
);
assertDerivedCounts(
  {
    rawCards: sourceCards.length,
    supportEntries: sourceSupport.length,
    legacyHints: hintIds.length,
    legacyImplementationModules: implementations.length,
    legacyImplementationSubregistries: subregistryPaths.length,
    existingCardSpecs: existingSpecPaths.length,
    existingAddressableNodes,
    plannedProjectedImplementations: implementations.length,
    plannedDefinitionOnlyRuntime: definitionOnlyIds.length,
    legacyTopLevelFamilies: Object.keys(familyCounts).length,
    addressableNodes: addressableNodes.length,
    importedHelperModules: importedHelperModules.length,
    importedHelperSymbols: importedHelperSymbols.length,
  },
  descriptor.expected,
  fail,
);

const reportPath = path.join(root, REPORT_TARGET);
const outputs = new Map();
for (const sourceCard of [...sourceCards].sort((left, right) =>
  left.cardId.localeCompare(right.cardId),
))
  outputs.set(
    `${sourceCard.cardId}.card-spec.ts`,
    await format(
      renderCardSpec(
        sourceCard,
        implementations.find(
          (entry) => entry.cardDefinitionId === sourceCard.cardId,
        ),
        capabilityKeys,
        planningAnnotationsById.get(sourceCard.cardId),
      ),
      { parser: "typescript" },
    ),
  );
for (const existingPath of existingSpecPaths)
  outputs.set(path.basename(existingPath), sourceText(existingPath));
outputs.set("@set-spec", sourceText(SET_SPEC_TARGET));
const sourceCardsById = new Map(sourceCards.map((card) => [card.cardId, card]));
const sourceSupportById = new Map(
  sourceSupport.map((entry) => [entry.cardId, entry]),
);
const implementationsById = new Map(
  implementations.map((entry) => [entry.cardDefinitionId, entry]),
);
const addressableNodeRecords = addressableNodes.map((node) => {
  const entry = implementationsById.get(node.cardDefinitionId);
  if (!entry)
    fail(
      `originalset_v1_addressable_implementation_missing:${node.cardDefinitionId}`,
    );
  const slot = `${node.cardDefinitionId}:${node.family}:${node.sourceIndex}`;
  const sourceValue = Array.isArray(entry.implementation[node.family])
    ? entry.implementation[node.family][node.sourceIndex]
    : entry.implementation[node.family];
  if (sourceValue === undefined)
    fail(`originalset_v1_addressable_source_missing:${slot}`);
  return {
    ...node,
    sourceFingerprint: sha256(JSON.stringify(sourceValue)),
    capabilityKey: capabilityKeys.get(slot),
    addressability: ["plan", "action", "quote", "debug"],
    disposition: "explicit_reviewed_semantic_capability_key",
  };
});
const report = {
  schemaVersion: "card-spec-migration-report-v1",
  setId: descriptor.setId,
  mode: "generated_projection",
  sourceCommit: SOURCE_COMMIT,
  counts: {
    rawCards: sourceCards.length,
    supportEntries: sourceSupport.length,
    legacyHints: hintIds.length,
    legacyImplementationModules: implementations.length,
    legacyImplementationSubregistries: subregistryPaths.length,
    existingCardSpecs: existingSpecPaths.length,
    existingAddressableNodes,
    totalCardSpecs: sourceCards.length + existingSpecPaths.length,
    totalAddressableNodes: addressableNodes.length + existingAddressableNodes,
    generatedCardSpecs: sourceCards.length,
    plannedProjectedImplementations: implementations.length,
    plannedDefinitionOnlyRuntime: definitionOnlyIds.length,
    legacyTopLevelFamilies: Object.keys(familyCounts).length,
    addressableNodes: addressableNodes.length,
    importedHelperModules: importedHelperModules.length,
    importedHelperSymbols: importedHelperSymbols.length,
  },
  sourceFingerprint: {
    raw: sha256(sourceText(RAW_PATH)),
    support: sha256(sourceText(SUPPORT_PATH)),
    hints: sha256(sourceText(HINT_PATH)),
    sharedDefinitions: sha256(sourceText(SHARED_DEFINITIONS_PATH)),
    implementationPaths: sha256(JSON.stringify(implementationPaths)),
    subregistryPaths: sha256(JSON.stringify(subregistryPaths)),
  },
  idPartition: {
    generatedCardSpecIds: [...rawIds].sort(),
    existingCardSpecIds: [...existingIds].sort(),
    projectedImplementationIds: [...implementationIds].sort(),
    definitionOnlyIds: [...definitionOnlyIds].sort(),
  },
  familyCardCounts: familyCounts,
  addressableFamilyNodeCounts,
  helperDisposition: {
    importedSymbols: importedHelperSymbols,
    sourceDisposition:
      "closed_symbol_inventory; every imported helper is evaluated by the reviewed typed helper mapping",
  },
  definitionOnly: definitionOnlyIds,
  sharedDefinitionParity: {
    rawDefinitions: rawIds.size,
    matchedPinnedSharedDefinitions: [...rawIds].filter((id) =>
      sharedDefinitionIds.has(id),
    ).length,
    sharedAbilitySlots: sharedAbilityParity.sharedAbilitySlots,
    sharedAbilityTargetSlots: sharedAbilityParity.sharedAbilityTargetSlots,
    sharedStaticCharacteristicCards:
      sharedAbilityParity.sharedStaticCharacteristicCards,
    sharedStaticCharacteristicFacts:
      sharedAbilityParity.sharedStaticCharacteristicFacts,
    printedSubroutines: sharedPrintedSubroutineParity,
  },
  capabilityDisposition: {
    required: addressableNodes.length,
    authored: capabilityKeys.size,
    status: "explicit_reviewed_disposition",
  },
  planningAnnotationDisposition: planningProjection,
  addressableNodes: addressableNodeRecords,
  cards: [...rawIds].sort().map((cardDefinitionId) => {
    const sourceCard = sourceCardsById.get(cardDefinitionId);
    const support = sourceSupportById.get(cardDefinitionId);
    const hint = sourceHintsById.get(cardDefinitionId);
    const sharedDefinition = sharedDefinitionsById.get(cardDefinitionId);
    const implementation = implementationsById.get(cardDefinitionId);
    const cardNodes = addressableNodeRecords.filter(
      (node) => node.cardDefinitionId === cardDefinitionId,
    );
    const output = outputs.get(`${cardDefinitionId}.card-spec.ts`);
    if (!sourceCard || !support || !hint || !sharedDefinition || !output)
      fail(`originalset_v1_card_record_source_missing:${cardDefinitionId}`);
    const planningAnnotations = planningAnnotationsById.get(cardDefinitionId);
    if (planningAnnotations === undefined)
      fail(`originalset_v1_card_record_planning_missing:${cardDefinitionId}`);
    return {
      cardDefinitionId,
      sourcePath: implementation?.relativePath ?? RAW_PATH,
      exportName: implementation?.exportName ?? null,
      sourceFingerprint: sha256(
        JSON.stringify({ sourceCard, support, hint, sharedDefinition }),
      ),
      implementationFingerprint:
        implementation === undefined
          ? null
          : sha256(JSON.stringify(implementation.implementation)),
      rawCard: sourceCard,
      families: implementation?.families ?? [],
      capabilitySlots: cardNodes.map((node) => ({
        family: node.family,
        sourceIndex: node.sourceIndex,
        sourceFingerprint: node.sourceFingerprint,
        capabilityKey: node.capabilityKey,
      })),
      planningAnnotationsFingerprint: sha256(
        JSON.stringify(planningAnnotations),
      ),
      planningAnnotationCounts: {
        card: planningAnnotations.card.length,
        capabilityGroups: planningAnnotations.capabilities.length,
        capabilityAnnotations: planningAnnotations.capabilities.reduce(
          (total, entry) => total + entry.annotations.length,
          0,
        ),
      },
      outputFingerprint: sha256(output),
    };
  }),
  mechanicalReconciliations: ORIGINALSET_V1_MECHANICAL_RECONCILIATIONS,
  generatedOutputs: {
    cardSpecs: sourceCards.length,
    setSpec: SET_SPEC_TARGET,
  },
  aggregateOutputFingerprint: sha256(
    [...outputs]
      .map(([relativePath, content]) => `${relativePath}\n${content}`)
      .join("\n"),
  ),
};
const reportText = await format(JSON.stringify(report), { parser: "json" });
outputs.set("@report", reportText);
await verifyMigrationOutputs({
  mode,
  root,
  outputDirectory: path.join(root, EXISTING_SPEC_ROOT),
  generated: outputs,
  targetFor: (relativePath) =>
    relativePath === "@set-spec"
      ? path.join(root, SET_SPEC_TARGET)
      : relativePath === "@report"
        ? reportPath
        : path.join(root, EXISTING_SPEC_ROOT, relativePath),
  writeDirectories: [path.dirname(reportPath)],
  driftCode: "originalset_v1_card_spec_migration_drift",
  fail,
});
console.log(
  `originalset_v1_card_spec_migration_${mode}_ok cards=${sourceCards.length} implementations=${implementations.length} families=${Object.keys(familyCounts).length} addressable=${addressableNodes.length} capabilityDisposition=${capabilityKeys.size}/${addressableNodes.length} source=${SOURCE_COMMIT}`,
);

function inventoryImplementation(relativePath) {
  const text = sourceText(relativePath);
  const parsed = extractSingleExportedConstObject(
    text,
    ORIGINALSET_V1_HELPER_CALLS,
    fail,
  );
  const source = ts.createSourceFile(
    relativePath,
    text,
    ts.ScriptTarget.Latest,
    true,
  );
  let object;
  const helperImports = [];
  source.forEachChild((node) => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      if (
        node.moduleSpecifier.text === "../../../helpers" ||
        node.moduleSpecifier.text ===
          "../../../../ability-engine/card-implementation-primitives"
      ) {
        const bindings = node.importClause?.namedBindings;
        if (!bindings || !ts.isNamedImports(bindings))
          fail(`originalset_v1_non_named_helper_import:${relativePath}`);
        helperImports.push(
          ...bindings.elements.map((entry) => entry.name.text),
        );
      }
    }
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations)
      if (
        declaration.initializer &&
        ts.isObjectLiteralExpression(declaration.initializer)
      )
        object = declaration.initializer;
  });
  if (object === undefined)
    fail(`originalset_v1_legacy_export_missing:${relativePath}`);
  const properties = new Map();
  for (const property of object.properties) {
    if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name))
      fail(`originalset_v1_unsupported_top_level_ast:${relativePath}`);
    properties.set(property.name.text, property.initializer);
  }
  const idNode = properties.get("cardDefinitionId");
  if (!idNode || !ts.isStringLiteral(idNode))
    fail(`originalset_v1_card_definition_id_missing:${relativePath}`);
  const families = [...properties.keys()]
    .filter((key) => key !== "cardDefinitionId")
    .sort();
  const addressableNodes = [];
  for (const family of [...ORIGINALSET_V1_ADDRESSABLE_FAMILIES].sort()) {
    const value = properties.get(family);
    if (!value) continue;
    for (
      let index = 0;
      index < addressableLength(value, relativePath);
      index += 1
    )
      addressableNodes.push({
        cardDefinitionId: parsed.value.cardDefinitionId,
        family,
        sourceIndex: index,
      });
  }
  return {
    relativePath,
    cardDefinitionId: parsed.value.cardDefinitionId,
    exportName: parsed.exportName,
    implementation: parsed.value,
    families,
    addressableNodes,
    helperImports: [...new Set(helperImports)].sort(),
  };
}

function addressableLength(node, relativePath) {
  if (ts.isArrayLiteralExpression(node))
    return node.elements.reduce((total, element) => {
      if (ts.isSpreadElement(element))
        return total + addressableLength(element.expression, relativePath);
      return total + addressableLength(element, relativePath);
    }, 0);
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
    const name = node.expression.text;
    if (!ORIGINALSET_V1_HELPER_SYMBOLS.has(name))
      fail(
        `originalset_v1_unsupported_addressable_helper:${relativePath}:${name}`,
      );
    if (name === "basicIcebreakerAbilities") return 2;
    if (name === "endTheRunSubroutines") {
      const count = node.arguments[0];
      if (!count || !ts.isNumericLiteral(count))
        fail(
          `originalset_v1_unsupported_end_run_subroutine_count:${relativePath}`,
        );
      return Number(count.text);
    }
    return 1;
  }
  if (ts.isObjectLiteralExpression(node)) return 1;
  fail(
    `originalset_v1_unsupported_addressable_ast:${relativePath}:${node.kind}`,
  );
}

function requiredCapabilityKeys(addressableNodes) {
  const requiredSlotEntries = addressableNodes.map(
    (node) => `${node.cardDefinitionId}:${node.family}:${node.sourceIndex}`,
  );
  assertNoDuplicateValues(
    requiredSlotEntries,
    "originalset_v1_capability_required_slot_duplicate",
  );
  const requiredSlots = new Set(requiredSlotEntries);
  const authoredSlots = Object.keys(ORIGINALSET_V1_CAPABILITY_KEYS);
  assertExactSet(
    requiredSlots,
    authoredSlots,
    "originalset_v1_capability_disposition_slot_mismatch",
  );
  for (const [slot, key] of Object.entries(ORIGINALSET_V1_CAPABILITY_KEYS)) {
    if (!/^[a-z][a-z0-9_]*$/.test(key))
      fail(`originalset_v1_capability_key_invalid:${slot}`);
  }
  for (const cardDefinitionId of new Set(
    addressableNodes.map((node) => node.cardDefinitionId),
  )) {
    const keys = authoredSlots
      .filter((slot) => slot.startsWith(`${cardDefinitionId}:`))
      .map((slot) => ORIGINALSET_V1_CAPABILITY_KEYS[slot]);
    if (new Set(keys).size !== keys.length)
      fail(`originalset_v1_capability_key_collision:${cardDefinitionId}`);
  }
  return new Map(Object.entries(ORIGINALSET_V1_CAPABILITY_KEYS));
}

function requiredSharedAbilityParity(definitionsById) {
  const sourceSlots = [];
  for (const definition of definitionsById.values())
    for (const ability of definition.abilities ?? [])
      sourceSlots.push(`${definition.id}:sharedAbility:${ability.id}`);
  const authoredSlots = Object.keys(ORIGINALSET_V1_SHARED_ABILITY_DISPOSITIONS);
  assertNoDuplicateValues(
    sourceSlots,
    "originalset_v1_shared_ability_source_slot_duplicate",
  );
  assertExactSet(
    new Set(sourceSlots),
    authoredSlots,
    "originalset_v1_shared_ability_disposition_slot_mismatch",
  );
  const targetSlots = authoredSlots.flatMap(
    (slot) => ORIGINALSET_V1_SHARED_ABILITY_DISPOSITIONS[slot],
  );
  for (const slot of authoredSlots)
    assertNoDuplicateValues(
      ORIGINALSET_V1_SHARED_ABILITY_DISPOSITIONS[slot],
      `originalset_v1_shared_ability_target_duplicate:${slot}`,
    );
  if (
    targetSlots.some(
      (slot) => ORIGINALSET_V1_CAPABILITY_KEYS[slot] === undefined,
    )
  )
    fail("originalset_v1_shared_ability_target_missing_capability");
  const staticFields = [
    "baseLink",
    "memoryLimitBonus",
    "maxHandSizeBonus",
    "recurringCredits",
  ];
  const staticFacts = [...definitionsById.values()].flatMap((definition) =>
    staticFields
      .filter((field) => definition[field] !== undefined)
      .map((field) => `${definition.id}:${field}`),
  );
  const staticCards = new Set(staticFacts.map((fact) => fact.split(":")[0]))
    .size;
  if (
    sourceSlots.length !== 59 ||
    staticCards !== 35 ||
    staticFacts.length !== 40
  )
    fail(
      `originalset_v1_shared_definition_inventory_mismatch:abilities=${sourceSlots.length}:staticFacts=${staticFacts.length}`,
    );
  return {
    sharedAbilitySlots: sourceSlots.length,
    sharedAbilityTargetSlots: targetSlots.length,
    sharedStaticCharacteristicCards: staticCards,
    sharedStaticCharacteristicFacts: staticFacts.length,
  };
}

function requiredSharedPrintedSubroutineParity(entries, definitionsById) {
  const implementationCounts = new Map(
    entries
      .filter((entry) => entry.implementation.printedSubroutines?.length)
      .map((entry) => [
        entry.cardDefinitionId,
        entry.implementation.printedSubroutines.length,
      ]),
  );
  const sharedCounts = new Map(
    [...definitionsById.values()]
      .filter((definition) => definition.subroutines?.length)
      .map((definition) => [definition.id, definition.subroutines.length]),
  );
  const drift = [
    ...new Set([...implementationCounts.keys(), ...sharedCounts.keys()]),
  ]
    .filter((id) => implementationCounts.get(id) !== sharedCounts.get(id))
    .sort()
    .map((id) => ({
      cardDefinitionId: id,
      shared: sharedCounts.get(id) ?? 0,
      effectiveLegacy: implementationCounts.get(id) ?? 0,
      disposition: "preserve_effective_legacy_runtime_subroutines",
    }));
  if (
    JSON.stringify(drift) !==
    JSON.stringify([
      {
        cardDefinitionId: "onr_v1_260_pocket-virtual-reality",
        shared: 1,
        effectiveLegacy: 2,
        disposition: "preserve_effective_legacy_runtime_subroutines",
      },
      {
        cardDefinitionId: "onr_v1_276_viral-15",
        shared: 1,
        effectiveLegacy: 2,
        disposition: "preserve_effective_legacy_runtime_subroutines",
      },
    ])
  )
    fail("originalset_v1_shared_printed_subroutine_drift_unreviewed");
  return {
    sharedCards: sharedCounts.size,
    sharedNodes: [...sharedCounts.values()].reduce(
      (sum, count) => sum + count,
      0,
    ),
    effectiveLegacyCards: implementationCounts.size,
    effectiveLegacyNodes: [...implementationCounts.values()].reduce(
      (sum, count) => sum + count,
      0,
    ),
    drift,
  };
}

function evaluatePinnedSharedDefinitions(source) {
  const transpiled = ts
    .transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    })
    .outputText.replaceAll("export ", "");
  let definitions;
  try {
    definitions = Function(`${transpiled}; return CARD_DEFINITIONS`)();
  } catch {
    fail("originalset_v1_shared_definition_evaluation_failed");
  }
  if (!Array.isArray(definitions))
    fail("originalset_v1_shared_definition_array_missing");
  const originalset = definitions.filter(
    (definition) =>
      typeof definition?.id === "string" && definition.id.startsWith("onr_v1_"),
  );
  if (originalset.length !== 367)
    fail(
      `originalset_v1_shared_definition_count_mismatch:${originalset.length}`,
    );
  return originalset;
}

function requiredOriginalsetPlanningEvidence(hints, capabilityKeys) {
  const targetProfiles = hints.flatMap((hint) =>
    planningObjectValues(hint.targetProfiles, `${hint.cardId}.targetProfiles`),
  );
  const strategyPairs = hints.flatMap((hint) =>
    planningObjectValues(
      hint.strategySupportPairs,
      `${hint.cardId}.strategySupportPairs`,
    ),
  );
  const actionPairs = hints.flatMap((hint) =>
    planningObjectValues(
      hint.actionStrategySupportPairs,
      `${hint.cardId}.actionStrategySupportPairs`,
    ),
  );
  const ontology = {
    topLevelFields: planningUnique(
      hints.flatMap((hint) => Object.keys(planningRecord(hint, hint.cardId))),
    ),
    planRoles: planningFieldOntology(hints, "planRoles"),
    strategicRoles: planningFieldOntology(hints, "strategicRole"),
    strategyAnchors: planningFieldOntology(hints, "strategyAnchors"),
    lineSupport: planningFieldOntology(hints, "lineSupport"),
    strategicExchangeKinds: planningFieldOntology(
      hints,
      "strategicExchangeKinds",
    ),
    tacticSignalOntology: planningFieldOntology(hints, "tacticSignals"),
    actionTacticSignalOntology: planningFieldOntology(
      hints,
      "actionTacticSignals",
    ),
    remoteRoleOntology: {
      keys: planningUnique(
        hints
          .filter((hint) => hint.remoteRole !== undefined)
          .flatMap((hint) =>
            Object.keys(
              planningRecord(hint.remoteRole, `${hint.cardId}.remoteRole`),
            ),
          ),
      ),
      kinds: planningUnique(
        hints
          .filter((hint) => hint.remoteRole !== undefined)
          .map((hint) => hint.remoteRole.kind),
      ),
      scopes: planningUnique(
        hints
          .filter((hint) => hint.remoteRole !== undefined)
          .map((hint) => hint.remoteRole.serverScope),
      ),
      threats: planningUnique(
        hints
          .filter((hint) => hint.remoteRole !== undefined)
          .map((hint) => hint.remoteRole.threatLevel),
      ),
    },
    targetOntology: {
      keys: planningUnique(
        targetProfiles.flatMap((entry) => Object.keys(entry)),
      ),
      kinds: planningUnique(targetProfiles.map((entry) => entry.kind)),
      types: planningUnique(targetProfiles.map((entry) => entry.targetType)),
      timings: planningUnique(targetProfiles.map((entry) => entry.timing)),
      hidden: planningUnique(
        targetProfiles.map((entry) => entry.hiddenInfoPolicy),
      ),
      purposes: planningUnique(targetProfiles.map((entry) => entry.purpose)),
      preferences: planningUnique(
        targetProfiles.flatMap((entry) =>
          planningStringValues(entry.preferences, "target.preferences"),
        ),
      ),
      avoid: planningUnique(
        targetProfiles.flatMap((entry) =>
          planningStringValues(entry.avoid, "target.avoid"),
        ),
      ),
    },
    strategyEvidenceOntology: planningUnique(
      strategyPairs.flatMap((pair) =>
        planningStringValues(pair.evidence, "strategySupportPair.evidence"),
      ),
    ),
    actionEvidenceOntology: planningUnique(
      actionPairs.flatMap((pair) =>
        planningStringValues(
          pair.evidence,
          "actionStrategySupportPair.evidence",
        ),
      ),
    ),
  };
  for (const [name, value] of Object.entries(ontology)) {
    const expected = ORIGINALSET_V1_PLANNING_ONTOLOGY_FINGERPRINTS[name];
    if (expected === undefined || sha256(JSON.stringify(value)) !== expected)
      fail(`originalset_v1_planning_ontology_drift:${name}`);
  }

  const observedPlanRoles = new Set(ontology.planRoles);
  const disposedPlanRoles = [
    ...ORIGINALSET_V1_PLANNING_PLAN_ROLES,
    ...ORIGINALSET_V1_MECHANICAL_PLAN_ROLES,
  ];
  assertNoDuplicateValues(
    disposedPlanRoles,
    "originalset_v1_planning_plan_role_disposition_duplicate",
  );
  assertExactSet(
    observedPlanRoles,
    disposedPlanRoles,
    "originalset_v1_planning_plan_role_disposition_mismatch",
  );

  for (const hint of hints) assertOriginalsetPlanningHintShape(hint);

  const actionCardIds = hints
    .filter(
      (hint) =>
        planningObjectValues(
          hint.actionStrategySupportPairs,
          `${hint.cardId}.actionStrategySupportPairs`,
        ).length > 0,
    )
    .map((hint) => hint.cardId);
  const boundActionCards = Object.keys(
    ORIGINALSET_V1_ACTION_STRATEGY_CAPABILITY_SLOTS,
  );
  const unaddressableActionCards = Object.keys(
    ORIGINALSET_V1_UNADDRESSABLE_ACTION_STRATEGY_DISPOSITIONS,
  );
  assertNoDuplicateValues(
    [...boundActionCards, ...unaddressableActionCards],
    "originalset_v1_action_strategy_card_disposition_duplicate",
  );
  assertExactSet(
    new Set(actionCardIds),
    [...boundActionCards, ...unaddressableActionCards],
    "originalset_v1_action_strategy_card_disposition_mismatch",
  );
  for (const [cardDefinitionId, slots] of Object.entries(
    ORIGINALSET_V1_ACTION_STRATEGY_CAPABILITY_SLOTS,
  )) {
    if (slots.length === 0)
      fail(`originalset_v1_action_strategy_empty_binding:${cardDefinitionId}`);
    assertNoDuplicateValues(
      slots,
      `originalset_v1_action_strategy_duplicate_binding:${cardDefinitionId}`,
    );
    for (const slot of slots) {
      if (!slot.startsWith(`${cardDefinitionId}:`))
        fail(`originalset_v1_action_strategy_cross_card_binding:${slot}`);
      if (capabilityKeys.get(slot) === undefined)
        fail(`originalset_v1_action_strategy_capability_missing:${slot}`);
    }
  }

  const sourceCardStrategyPairs = strategyPairs.length;
  const sourceActionStrategyPairs = actionPairs.length;
  const discardedUnaddressableActionPairs = hints
    .filter((hint) =>
      Object.hasOwn(
        ORIGINALSET_V1_UNADDRESSABLE_ACTION_STRATEGY_DISPOSITIONS,
        hint.cardId,
      ),
    )
    .reduce(
      (total, hint) =>
        total +
        planningObjectValues(
          hint.actionStrategySupportPairs,
          `${hint.cardId}.actionStrategySupportPairs`,
        ).length,
      0,
    );
  return {
    sourceCardStrategyPairs,
    sourceActionStrategyPairs,
    discardedUnaddressableActionPairs,
    sourceTargetProfiles: targetProfiles.length,
    sourceRemoteRoles: hints.filter((hint) => hint.remoteRole !== undefined)
      .length,
    sourceValueHints: hints.reduce(
      (total, hint) => total + Object.keys(hint.valueHints ?? {}).length,
      0,
    ),
    ontologyFingerprints: ORIGINALSET_V1_PLANNING_ONTOLOGY_FINGERPRINTS,
  };
}

function assertOriginalsetPlanningHintShape(hint) {
  const cardDefinitionId = planningRequiredString(hint.cardId, "hint.cardId");
  for (const field of [
    "planRoles",
    "strategicRole",
    "strategyAnchors",
    "lineSupport",
    "strategicExchangeKinds",
    "tacticSignals",
    "actionTacticSignals",
  ])
    planningStringValues(hint[field], `${cardDefinitionId}.${field}`);

  if (hint.remoteRole !== undefined) {
    const remote = planningRecord(
      hint.remoteRole,
      `${cardDefinitionId}.remoteRole`,
    );
    assertPlanningRecordKeys(
      remote,
      ["kind", "serverScope", "threatLevel"],
      `${cardDefinitionId}.remoteRole`,
    );
    planningRequiredString(remote.kind, `${cardDefinitionId}.remoteRole.kind`);
    planningRequiredString(
      remote.serverScope,
      `${cardDefinitionId}.remoteRole.serverScope`,
    );
    if (remote.threatLevel !== "medium" && remote.threatLevel !== "high")
      fail(`originalset_v1_remote_role_threat_invalid:${cardDefinitionId}`);
  }

  for (const [index, target] of planningObjectValues(
    hint.targetProfiles,
    `${cardDefinitionId}.targetProfiles`,
  ).entries()) {
    const targetPath = `${cardDefinitionId}.targetProfiles[${index}]`;
    if (target.schemaVersion !== "target-profile-v1")
      fail(`originalset_v1_target_profile_version_invalid:${targetPath}`);
    for (const field of [
      "kind",
      "hiddenInfoPolicy",
      "purpose",
      "targetType",
      "timing",
    ])
      planningRequiredString(target[field], `${targetPath}.${field}`);
    for (const field of ["activeRunConstraint", "serverScope"])
      if (target[field] !== undefined)
        planningRequiredString(target[field], `${targetPath}.${field}`);
    planningStringValues(target.preferences, `${targetPath}.preferences`);
    planningStringValues(target.avoid, `${targetPath}.avoid`);
    planningStringValues(
      target.requiredSubtypes,
      `${targetPath}.requiredSubtypes`,
    );
    if (
      target.minimumTargetCount !== undefined &&
      (!Number.isInteger(target.minimumTargetCount) ||
        target.minimumTargetCount < 1)
    )
      fail(`originalset_v1_target_profile_minimum_invalid:${targetPath}`);
  }

  const valueHints = planningRecord(
    hint.valueHints ?? {},
    `${cardDefinitionId}.valueHints`,
  );
  for (const [axis, value] of Object.entries(valueHints)) {
    if (!new Set(["damage", "economy", "remoteRootValue"]).has(axis))
      fail(
        `originalset_v1_value_hint_axis_unknown:${cardDefinitionId}:${axis}`,
      );
    if (!Number.isInteger(value) || value < 1)
      fail(`originalset_v1_value_hint_invalid:${cardDefinitionId}:${axis}`);
  }

  for (const [field, expectedKeys] of [
    [
      "strategySupportPairs",
      [
        "confidence",
        "evidence",
        "rationale",
        "role",
        "roleDetail",
        "strategyId",
      ],
    ],
    [
      "actionStrategySupportPairs",
      ["confidence", "evidence", "role", "strategyId"],
    ],
  ])
    for (const [index, pair] of planningObjectValues(
      hint[field],
      `${cardDefinitionId}.${field}`,
    ).entries()) {
      const pairPath = `${cardDefinitionId}.${field}[${index}]`;
      assertPlanningRecordKeys(pair, expectedKeys, pairPath);
      for (const pairField of expectedKeys.filter(
        (entry) => entry !== "evidence",
      ))
        planningRequiredString(pair[pairField], `${pairPath}.${pairField}`);
      const evidence = planningStringValues(
        pair.evidence,
        `${pairPath}.evidence`,
      );
      if (evidence.length === 0)
        fail(`originalset_v1_strategy_evidence_empty:${pairPath}`);
      planningConfidence(pair.confidence, pairPath);
    }
}

function originalsetPlanningAnnotations(
  cardDefinitionId,
  hint,
  capabilityKeys,
) {
  const card = [];
  for (const role of planningStringValues(
    hint.planRoles,
    `${cardDefinitionId}.planRoles`,
  )) {
    if (ORIGINALSET_V1_PLANNING_PLAN_ROLES.has(role))
      card.push({ kind: "plan_role", role });
    else if (!ORIGINALSET_V1_MECHANICAL_PLAN_ROLES.has(role))
      fail(
        `originalset_v1_plan_role_without_disposition:${cardDefinitionId}:${role}`,
      );
  }
  for (const role of planningStringValues(
    hint.strategicRole,
    `${cardDefinitionId}.strategicRole`,
  ))
    card.push({ kind: "strategic_role", role });
  for (const strategyKey of planningStringValues(
    hint.strategyAnchors,
    `${cardDefinitionId}.strategyAnchors`,
  ))
    card.push({ kind: "strategy_anchor", strategyKey });
  for (const lineKey of planningStringValues(
    hint.lineSupport,
    `${cardDefinitionId}.lineSupport`,
  ))
    card.push({ kind: "line_support", lineKey, support: "supports" });
  for (const exchange of planningStringValues(
    hint.strategicExchangeKinds,
    `${cardDefinitionId}.strategicExchangeKinds`,
  ))
    card.push({ kind: "strategic_exchange", exchange });
  for (const pair of planningObjectValues(
    hint.strategySupportPairs,
    `${cardDefinitionId}.strategySupportPairs`,
  ))
    card.push(originalsetStrategySupportAnnotation(pair, cardDefinitionId));

  const tactics = new Map();
  for (const token of [
    ...planningStringValues(
      hint.tacticSignals,
      `${cardDefinitionId}.tacticSignals`,
    ),
    ...planningStringValues(
      hint.actionTacticSignals,
      `${cardDefinitionId}.actionTacticSignals`,
    ),
  ]) {
    const interpretation =
      ORIGINALSET_V1_PLANNING_TACTIC_INTERPRETATIONS[token];
    if (interpretation !== undefined)
      tactics.set(
        `${interpretation.signal}:${interpretation.use}`,
        interpretation,
      );
  }
  for (const interpretation of tactics.values())
    card.push({ kind: "tactic_interpretation", ...interpretation });

  if (hint.remoteRole !== undefined)
    card.push({
      kind: "remote_role",
      role: planningRequiredString(
        hint.remoteRole.kind,
        `${cardDefinitionId}.remoteRole.kind`,
      ),
      threatLevel: hint.remoteRole.threatLevel,
    });

  for (const target of planningObjectValues(
    hint.targetProfiles,
    `${cardDefinitionId}.targetProfiles`,
  ))
    card.push({
      kind: "target_preference",
      purpose: planningRequiredString(
        target.purpose,
        `${cardDefinitionId}.targetProfiles.purpose`,
      ),
      ...(target.preferences === undefined
        ? {}
        : {
            preferences: planningStringValues(
              target.preferences,
              `${cardDefinitionId}.targetProfiles.preferences`,
            ),
          }),
      ...(target.avoid === undefined
        ? {}
        : {
            avoid: planningStringValues(
              target.avoid,
              `${cardDefinitionId}.targetProfiles.avoid`,
            ),
          }),
    });

  for (const [axis, value] of Object.entries(hint.valueHints ?? {})) {
    const slot = `${cardDefinitionId}:${axis}`;
    if (
      ORIGINALSET_V1_VALUE_HINT_DISPOSITIONS.discardedAxes.includes(axis) ||
      ORIGINALSET_V1_VALUE_HINT_DISPOSITIONS.discardedSlots.includes(slot)
    )
      continue;
    if (axis !== "remoteRootValue" && axis !== "economy")
      fail(`originalset_v1_value_hint_without_disposition:${slot}`);
    card.push({
      kind: "value_interpretation",
      axis: axis === "remoteRootValue" ? "remote_root_value" : "economy",
      rating: planningNumericRating(value, slot),
    });
  }

  const actionPairs = planningObjectValues(
    hint.actionStrategySupportPairs,
    `${cardDefinitionId}.actionStrategySupportPairs`,
  );
  const targetSlots =
    ORIGINALSET_V1_ACTION_STRATEGY_CAPABILITY_SLOTS[cardDefinitionId];
  const discarded = Object.hasOwn(
    ORIGINALSET_V1_UNADDRESSABLE_ACTION_STRATEGY_DISPOSITIONS,
    cardDefinitionId,
  );
  if (actionPairs.length > 0 && (targetSlots === undefined) === !discarded)
    fail(
      `originalset_v1_action_strategy_disposition_invalid:${cardDefinitionId}`,
    );
  const capabilityAnnotations = new Map();
  for (const slot of targetSlots ?? []) {
    const key = capabilityKeys.get(slot);
    if (key === undefined)
      fail(`originalset_v1_action_strategy_capability_missing:${slot}`);
    capabilityAnnotations.set(
      key,
      actionPairs.map((pair) =>
        originalsetActionStrategySupportAnnotation(pair, cardDefinitionId),
      ),
    );
  }
  const capabilities = [...capabilityAnnotations.entries()].map(
    ([key, annotations]) => ({
      capabilityKey: expression(`capabilityKey(${JSON.stringify(key)})`),
      annotations,
    }),
  );
  return {
    schemaVersion: "card-planning-annotations-v1",
    card,
    capabilities,
  };
}

function originalsetStrategySupportAnnotation(pair, cardDefinitionId) {
  return {
    kind: "strategy_support",
    strategyKey: planningRequiredString(
      pair.strategyId,
      `${cardDefinitionId}.strategyId`,
    ),
    role: planningRequiredString(pair.role, `${cardDefinitionId}.role`),
    roleDetail: planningRequiredString(
      pair.roleDetail,
      `${cardDefinitionId}.roleDetail`,
    ),
    confidence: planningConfidence(pair.confidence, cardDefinitionId),
    rationale: planningRequiredString(
      pair.rationale,
      `${cardDefinitionId}.rationale`,
    ),
  };
}

function originalsetActionStrategySupportAnnotation(pair, cardDefinitionId) {
  const evidence = planningStringValues(
    pair.evidence,
    `${cardDefinitionId}.actionStrategySupportEvidence`,
  );
  if (evidence.length !== 1)
    fail(`originalset_v1_action_strategy_evidence_shape:${cardDefinitionId}`);
  const evidenceAnchor = evidence[0].replace(/^tactic_signal_anchor:/, "");
  if (evidenceAnchor === evidence[0])
    fail(`originalset_v1_action_strategy_evidence_anchor:${cardDefinitionId}`);
  const role = planningRequiredString(pair.role, `${cardDefinitionId}.role`);
  return {
    kind: "strategy_support",
    strategyKey: planningRequiredString(
      pair.strategyId,
      `${cardDefinitionId}.strategyId`,
    ),
    role,
    roleDetail: `${role}_${evidenceAnchor.replaceAll(".", "_")}`,
    evidenceAnchor,
    confidence: planningConfidence(pair.confidence, cardDefinitionId),
  };
}

function planningDispositionFingerprint() {
  return sha256(
    JSON.stringify({
      planningPlanRoles: [...ORIGINALSET_V1_PLANNING_PLAN_ROLES].sort(),
      mechanicalPlanRoles: [...ORIGINALSET_V1_MECHANICAL_PLAN_ROLES].sort(),
      tacticInterpretations: ORIGINALSET_V1_PLANNING_TACTIC_INTERPRETATIONS,
      ontologyFingerprints: ORIGINALSET_V1_PLANNING_ONTOLOGY_FINGERPRINTS,
      actionStrategyCapabilitySlots:
        ORIGINALSET_V1_ACTION_STRATEGY_CAPABILITY_SLOTS,
      unaddressableActionStrategy:
        ORIGINALSET_V1_UNADDRESSABLE_ACTION_STRATEGY_DISPOSITIONS,
      valueHints: ORIGINALSET_V1_VALUE_HINT_DISPOSITIONS,
    }),
  );
}

function summarizePlanningProjection(annotationsById, evidence, hints) {
  const entries = [...annotationsById.entries()].sort(([left], [right]) =>
    left.localeCompare(right),
  );
  const cardAnnotations = entries.flatMap(([, annotations]) =>
    annotations.card.map((annotation) => annotation),
  );
  const capabilityGroups = entries.flatMap(([, annotations]) =>
    annotations.capabilities.map((entry) => entry),
  );
  const capabilityAnnotations = capabilityGroups.flatMap(
    (entry) => entry.annotations,
  );
  const mappedTacticTokens = new Set(
    Object.keys(ORIGINALSET_V1_PLANNING_TACTIC_INTERPRETATIONS),
  );
  const sourceTacticTokens = hints.flatMap((hint) => [
    ...planningStringValues(hint.tacticSignals, `${hint.cardId}.tacticSignals`),
    ...planningStringValues(
      hint.actionTacticSignals,
      `${hint.cardId}.actionTacticSignals`,
    ),
  ]);
  const mechanicalPlanRoleOccurrences = hints.reduce(
    (total, hint) =>
      total +
      planningStringValues(hint.planRoles, `${hint.cardId}.planRoles`).filter(
        (role) => ORIGINALSET_V1_MECHANICAL_PLAN_ROLES.has(role),
      ).length,
    0,
  );
  const discardedValueHints = hints.reduce(
    (total, hint) =>
      total +
      Object.keys(hint.valueHints ?? {}).filter(
        (axis) =>
          ORIGINALSET_V1_VALUE_HINT_DISPOSITIONS.discardedAxes.includes(axis) ||
          ORIGINALSET_V1_VALUE_HINT_DISPOSITIONS.discardedSlots.includes(
            `${hint.cardId}:${axis}`,
          ),
      ).length,
    0,
  );
  return {
    status: "closed_nonmechanical_projection",
    dispositionFingerprint: planningDispositionFingerprint(),
    aggregatePlanningAnnotationsFingerprint: sha256(JSON.stringify(entries)),
    sourceEvidence: evidence,
    projected: {
      cardsWithAnnotations: entries.filter(
        ([, annotations]) =>
          annotations.card.length > 0 || annotations.capabilities.length > 0,
      ).length,
      cardAnnotations: cardAnnotations.length,
      capabilityGroups: capabilityGroups.length,
      capabilityAnnotations: capabilityAnnotations.length,
      annotationKinds: countBy(
        [...cardAnnotations, ...capabilityAnnotations].map(
          (annotation) => annotation.kind,
        ),
      ),
    },
    discarded: {
      mechanicalPlanRoleOccurrences,
      compilerOwnedTacticSignalOccurrences: sourceTacticTokens.filter(
        (token) => !mappedTacticTokens.has(token),
      ).length,
      valueHintOccurrences: discardedValueHints,
      unaddressableActionStrategyPairs:
        evidence.discardedUnaddressableActionPairs,
      compilerOwnedFields: [
        "actionCapacityProfiles",
        "aiSupportStatus",
        "breakerProfile",
        "conditions",
        "constraints",
        "costProfile",
        "effects",
        "functionSignals",
        "hiddenInfoPolicy",
        "manualNotes",
        "quality",
        "requiredMechanics",
        "riskTags",
        "roles",
        "scenarioRefs",
        "strategicNotes",
      ],
    },
  };
}

function planningFieldOntology(hints, field) {
  return planningUnique(
    hints.flatMap((hint) =>
      planningStringValues(hint[field], `${hint.cardId}.${field}`),
    ),
  );
}

function planningUnique(values) {
  if (values.some((value) => typeof value !== "string" || value.length === 0))
    fail("originalset_v1_planning_ontology_invalid_string");
  return [...new Set(values)].sort();
}

function planningStringValues(value, pathLabel) {
  if (value === undefined) return [];
  const entries = Array.isArray(value) ? value : [value];
  if (entries.some((entry) => typeof entry !== "string" || entry.length === 0))
    fail(`originalset_v1_planning_string_values_invalid:${pathLabel}`);
  return entries;
}

function planningObjectValues(value, pathLabel) {
  if (value === undefined) return [];
  const entries = Array.isArray(value) ? value : [value];
  if (
    entries.some(
      (entry) =>
        entry === null ||
        typeof entry !== "object" ||
        Array.isArray(entry) ||
        Object.getPrototypeOf(entry) !== Object.prototype,
    )
  )
    fail(`originalset_v1_planning_object_values_invalid:${pathLabel}`);
  return entries;
}

function planningRecord(value, pathLabel) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  )
    fail(`originalset_v1_planning_record_invalid:${pathLabel}`);
  return value;
}

function assertPlanningRecordKeys(value, expectedKeys, pathLabel) {
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    fail(`originalset_v1_planning_record_keys_invalid:${pathLabel}`);
}

function planningRequiredString(value, pathLabel) {
  if (typeof value !== "string" || value.length === 0)
    fail(`originalset_v1_planning_string_missing:${pathLabel}`);
  return value;
}

function planningConfidence(value, pathLabel) {
  if (value !== "low" && value !== "medium" && value !== "high")
    fail(`originalset_v1_planning_confidence_invalid:${pathLabel}`);
  return value;
}

function planningNumericRating(value, pathLabel) {
  if (value === 1) return "low";
  if (value === 2) return "medium";
  if (value === 3) return "high";
  if (value === 4) return "very_high";
  if (value === 5) return "critical";
  fail(`originalset_v1_planning_rating_invalid:${pathLabel}:${value}`);
}

function renderCardSpec(sourceCard, implementation, keys, planningAnnotations) {
  if (planningAnnotations === undefined)
    fail(`originalset_v1_planning_annotations_missing:${sourceCard.cardId}`);
  const engine = {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: characteristicsFor(sourceCard),
    ...(implementation === undefined
      ? {}
      : mechanicalProjection(implementation, keys)),
  };
  const spec = {
    schemaVersion: "card-spec-v1",
    identity: {
      cardDefinitionId: expression(
        `cardDefinitionId(${JSON.stringify(sourceCard.cardId)})`,
      ),
      title: sourceCard.title,
      side: sourceCard.side,
      cardType: normalizedCardType(sourceCard.type),
    },
    text: {
      schemaVersion: "canonical-card-text-v1",
      rulesText: sourceCard.text,
    },
    rules: {
      schemaVersion: "card-rules-v1",
      references: [{ source: "card_text", reference: sourceCard.cardId }],
    },
    engine,
    ...(planningAnnotations.card.length === 0 &&
    planningAnnotations.capabilities.length === 0
      ? {}
      : { planningAnnotations }),
    printings: [
      {
        schemaVersion: "printing-spec-v1",
        printingId: sourceCard.cardId,
        setId: "originalset-v1",
        collectorNumber: sourceCard.collectorNumber,
        rarity: sourceCard.rarity.code,
      },
    ],
    publication: { schemaVersion: "card-publication-v1", status: "active" },
  };
  return `import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";\n\nexport const cardSpec = ${renderValue(spec)} satisfies CardSpec;\n`;
}

function characteristicsFor(sourceCard) {
  const numeric = sourceCard.numeric;
  const sharedDefinition = sharedDefinitionsById.get(sourceCard.cardId);
  if (sharedDefinition === undefined)
    fail(`originalset_v1_shared_definition_missing:${sourceCard.cardId}`);
  const playCost =
    sharedDefinition.playCost ??
    (["event", "operation"].includes(sourceCard.type)
      ? { kind: "fixed", credits: numeric.cost }
      : null);
  if (
    playCost !== null &&
    playCost.kind === "fixed" &&
    !Number.isInteger(playCost.credits)
  )
    fail(`originalset_v1_play_cost_missing:${sourceCard.cardId}`);
  return {
    faction: sourceCard.faction,
    subtypes: sourceCard.subtypes,
    numeric: {
      installCost: numeric.installCost,
      memoryCost: numeric.memoryCost,
      rezCost: numeric.rezCost,
      trashCost: numeric.trashCost,
      advancementRequirement: numeric.advancementRequirement,
      agendaPoints: numeric.agendaPoints,
    },
    playCost,
    strength: rawStrengthFor(sourceCard, sharedDefinition),
    ...(sharedDefinition.baseLink === undefined
      ? {}
      : { baseLink: sharedDefinition.baseLink }),
    ...(sharedDefinition.memoryLimitBonus === undefined
      ? {}
      : { memoryLimitBonus: sharedDefinition.memoryLimitBonus }),
    ...(sharedDefinition.maxHandSizeBonus === undefined
      ? {}
      : { maxHandSizeBonus: sharedDefinition.maxHandSizeBonus }),
    ...(sharedDefinition.recurringCredits === undefined
      ? {}
      : { recurringCredits: sharedDefinition.recurringCredits }),
  };
}

function rawStrengthFor(sourceCard, sharedDefinition) {
  const numeric = sourceCard.numeric;
  const variableStrength = sourceCard.variableStrength;
  if (variableStrength === undefined) {
    if (sharedDefinition.variableStrength !== undefined)
      fail(
        `originalset_v1_shared_variable_strength_missing_raw:${sourceCard.cardId}`,
      );
    return Number.isInteger(numeric.strength)
      ? { kind: "fixed", value: numeric.strength }
      : { kind: "not_applicable" };
  }
  if (
    variableStrength === null ||
    typeof variableStrength !== "object" ||
    Array.isArray(variableStrength) ||
    Object.keys(variableStrength).some(
      (key) => key !== "kind" && key !== "dieSides",
    ) ||
    variableStrength.kind !== "random_die" ||
    !Number.isInteger(variableStrength.dieSides) ||
    variableStrength.dieSides < 2
  )
    fail(`originalset_v1_raw_variable_strength_invalid:${sourceCard.cardId}`);
  if (numeric.strength !== null)
    fail(
      `originalset_v1_raw_variable_strength_numeric_conflict:${sourceCard.cardId}`,
    );
  if (
    JSON.stringify(variableStrength) !==
    JSON.stringify(sharedDefinition.variableStrength)
  )
    fail(
      `originalset_v1_shared_variable_strength_mismatch:${sourceCard.cardId}`,
    );
  return { kind: "random_die", dieSides: variableStrength.dieSides };
}

function normalizedCardType(type) {
  return type === "hardware-chip" || type === "hardware-deck"
    ? "hardware"
    : type;
}

function mechanicalProjection(entry, keys) {
  const engine = stripLegacyFields(entry.implementation);
  delete engine.cardDefinitionId;
  delete engine.regionBaseline;
  if (entry.cardDefinitionId === "onr_v1_022_emergency-self-construct")
    engine.flatlineReplacementSources = [
      {
        ...engine.flatlineReplacementSources[0],
        resolution:
          ORIGINALSET_V1_MECHANICAL_RECONCILIATIONS[entry.cardDefinitionId]
            .resolution,
      },
    ];
  if (entry.cardDefinitionId === "onr_v1_078_arasaka-owns-you")
    engine.flatlineReplacementSources = [
      {
        ...engine.flatlineReplacementSources[0],
        resolution:
          ORIGINALSET_V1_MECHANICAL_RECONCILIATIONS[entry.cardDefinitionId]
            .resolution,
      },
    ];
  for (const node of entry.addressableNodes) {
    const values = Array.isArray(engine[node.family])
      ? engine[node.family]
      : [engine[node.family]];
    values[node.sourceIndex] = {
      capabilityKey: expression(
        `capabilityKey(${JSON.stringify(keys.get(`${entry.cardDefinitionId}:${node.family}:${node.sourceIndex}`))})`,
      ),
      addressability: ["plan", "action", "quote", "debug"],
      ...values[node.sourceIndex],
    };
    engine[node.family] = Array.isArray(engine[node.family])
      ? values
      : values[0];
  }
  return engine;
}

function stripLegacyFields(value) {
  if (Array.isArray(value)) return value.map(stripLegacyFields);
  if (value === null || typeof value !== "object") return value;
  const result = Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !["text", "label", "abilityKey"].includes(key))
      .map(([key, entry]) => [key, stripLegacyFields(entry)]),
  );
  return canonicalizeTraceFields(result);
}

function canonicalizeTraceFields(value) {
  if (value.traceStrengthAndLimitPerBit !== undefined) {
    value.traceValueAndLimitPerBit = value.traceStrengthAndLimitPerBit;
    delete value.traceStrengthAndLimitPerBit;
  }
  if (value.additionalPlayCostPerBaseTracePointAboveZero !== undefined) {
    value.additionalPlayCostPerTraceLimitPointAboveZero =
      value.additionalPlayCostPerBaseTracePointAboveZero;
    delete value.additionalPlayCostPerBaseTracePointAboveZero;
  }
  if (value.baseTraceStrength !== undefined) {
    value.traceLimit = value.traceBidLimit ?? value.baseTraceStrength;
    delete value.baseTraceStrength;
    delete value.traceBidLimit;
  }
  if (
    value.traceBaseFromValue !== undefined ||
    value.traceBidLimitFromValue !== undefined
  ) {
    value.traceLimitFromValue = true;
    delete value.traceBaseFromValue;
    delete value.traceBidLimitFromValue;
  }
  return value;
}

function assertExactSet(expected, actual, code) {
  const actualEntries = [...actual];
  const received = new Set(actualEntries);
  if (received.size !== actualEntries.length) fail(`${code}_duplicate`);
  if (
    expected.size !== received.size ||
    [...expected].some((id) => !received.has(id))
  )
    fail(code);
}

function assertNoDuplicateValues(values, code) {
  if (new Set(values).size !== values.length) fail(code);
}

function countBy(values) {
  const result = {};
  for (const value of values) result[value] = (result[value] ?? 0) + 1;
  return Object.fromEntries(
    Object.entries(result).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function idFromSpecPath(relativePath) {
  return path.basename(relativePath).replace(/\.card-spec\.ts$/, "");
}

function engineAddressableNodeCount(source) {
  const file = ts.createSourceFile(
    "card-spec.ts",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  let engine;
  const findEngine = (node) => {
    if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name)) {
      if (node.name.text === "engine") engine = node.initializer;
    }
    ts.forEachChild(node, findEngine);
  };
  findEngine(file);
  if (!engine || !ts.isObjectLiteralExpression(engine))
    fail("originalset_v1_existing_spec_engine_missing");
  let count = 0;
  const countAddressable = (node) => {
    if (ts.isObjectLiteralExpression(node)) {
      const names = new Set(
        node.properties
          .filter(ts.isPropertyAssignment)
          .map((property) =>
            ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
              ? property.name.text
              : "",
          ),
      );
      if (names.has("capabilityKey") && names.has("addressability")) count += 1;
    }
    ts.forEachChild(node, countAddressable);
  };
  countAddressable(engine);
  return count;
}

function gitList(relativePath) {
  return execFileSync(
    "git",
    ["ls-tree", "-r", "--name-only", SOURCE_COMMIT, "--", relativePath],
    {
      cwd: root,
      encoding: "utf8",
    },
  )
    .split(/\r?\n/)
    .filter(Boolean);
}

function gitShow(relativePath) {
  return execFileSync("git", ["show", `${SOURCE_COMMIT}:${relativePath}`], {
    cwd: root,
    encoding: "utf8",
  });
}

function fail(message) {
  throw new Error(message);
}
