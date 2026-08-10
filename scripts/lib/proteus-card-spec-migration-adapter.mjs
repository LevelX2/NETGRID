import { execFileSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { format } from "prettier";
import ts from "typescript";
import {
  assertDerivedCounts,
  expression,
  extractExportedConstObject,
  extractSingleExportedConstObject,
  parseSetMigrationInvocation,
  renderValue,
  sha256,
  verifyMigrationOutputs,
} from "./card-spec-migration-core.mjs";
import {
  PROTEUS_ACTION_STRATEGY_CAPABILITIES,
  PROTEUS_ADDRESSABLE_FAMILIES,
  PROTEUS_CAPABILITY_KEYS,
  PROTEUS_HELPER_MODULE_DISPOSITIONS,
  PROTEUS_MECHANICAL_RECONCILIATIONS,
} from "./proteus-card-spec-migration-disposition.mjs";

const root = process.cwd();
const SOURCE_COMMIT = "e6d901e6832852f7ad70b81ae92b1c1a76a8a899";
const RAW_PATH = "data/cards/proteus-cards.json";
const SUPPORT_PATH = "data/manifests/proteus-card-support.json";
const HINT_PATH = "data/ai/ai-card-hints-active.json";
const SHARED_DEFINITIONS_PATH = "packages/shared/src/card-definitions.ts";
const HELPERS_PATH = "packages/engine/src/card-implementations/helpers.ts";
const PRIMITIVES_PATH =
  "packages/engine/src/ability-engine/card-implementation-primitives.ts";
const CATALOG_PATH =
  "packages/engine/src/card-implementations/subregistries/card-implementation-catalog.ts";
const COVERAGE_LOCATIONS_PATH =
  "packages/engine/src/card-implementations/coverage-source-locations.ts";
const IMPLEMENTATION_ROOT = "packages/engine/src/card-implementations/proteus";
const SUBREGISTRY_ROOT =
  "packages/engine/src/card-implementations/subregistries";
const EXISTING_SPEC_PATHS = Object.freeze([
  "packages/cards/src/specs/proteus/onr_proteus_020_digiconda.card-spec.ts",
  "packages/cards/src/specs/proteus/onr_proteus_080_black-widow.card-spec.ts",
  "packages/cards/src/specs/proteus/onr_proteus_092_morphing-tool.card-spec.ts",
]);
const SET_SPEC_PATH = "packages/cards/src/sets/proteus.set-spec.ts";

const implementationPaths = Object.freeze(
  gitList(IMPLEMENTATION_ROOT).filter((relativePath) =>
    relativePath.endsWith(".ts"),
  ),
);
const subregistryPaths = Object.freeze(
  gitList(SUBREGISTRY_ROOT).filter(
    (relativePath) =>
      /\/proteus-.*\.ts$/.test(relativePath) &&
      !relativePath.endsWith(".test.ts"),
  ),
);
const sourcePaths = Object.freeze([
  RAW_PATH,
  SUPPORT_PATH,
  HINT_PATH,
  SHARED_DEFINITIONS_PATH,
  HELPERS_PATH,
  PRIMITIVES_PATH,
  CATALOG_PATH,
  COVERAGE_LOCATIONS_PATH,
  ...implementationPaths,
  ...subregistryPaths,
  ...EXISTING_SPEC_PATHS,
  SET_SPEC_PATH,
]);

const descriptor = Object.freeze({
  sourceCommit: SOURCE_COMMIT,
  setId: "proteus",
  setName: "Proteus",
  setCode: "proteus",
  outputDirectory: "packages/cards/src/specs/proteus",
  setSpecTarget: SET_SPEC_PATH,
  reportTarget: "docs/reviews/cards/proteus-card-spec-migration-report.json",
  implementationPaths,
  subregistryPaths,
  sourcePaths,
  expected: Object.freeze({
    sourceInputs: 180,
    rawCards: 151,
    supportEntries: 151,
    legacyHints: 151,
    legacyImplementationModules: 151,
    legacyImplementationSubregistries: 17,
    legacyImplementationCatalogGroups: 9,
    legacyTopLevelFamilies: 32,
    plannedRuntimeDefinitions: 151,
    plannedProjectedImplementations: 148,
    plannedDefinitionOnlyRuntime: 3,
    existingCardSpecs: 3,
    importedHelperModules: 10,
    addressableHelperModules: 6,
    importedHelperSymbols: 7,
    addressableHelperSymbols: 3,
    sharedProteusDefinitions: 46,
    sharedVariableIceDefinitions: 16,
    sharedStaticSubroutineCards: 13,
    sharedStaticSubroutines: 20,
    sharedSubroutineCards: 10,
    sharedSubroutines: 13,
    addressableNodes: 191,
  }),
});
const { mode } = parseSetMigrationInvocation(process.argv, {
  proteus: descriptor,
});
const outputDirectory = path.join(root, descriptor.outputDirectory);
const sourceTextByPath = new Map(
  descriptor.sourcePaths.map((relativePath) => [
    relativePath,
    gitShow(relativePath),
  ]),
);
const sourceText = (relativePath) => {
  const value = sourceTextByPath.get(relativePath);
  if (value === undefined)
    fail(`proteus_card_spec_migration_source_missing:${relativePath}`);
  return value;
};
const sourceCards = JSON.parse(sourceText(RAW_PATH)).cards;
const sourceSupport = JSON.parse(sourceText(SUPPORT_PATH)).cards;
const sourceHints = JSON.parse(sourceText(HINT_PATH)).cards;
const sourceSharedProteusCards = [
  ...extractConstArrayLiteral(
    SHARED_DEFINITIONS_PATH,
    "PROTEUS_VISIBLE_BASELINE_CARDS",
  ),
  ...extractConstArrayLiteral(
    SHARED_DEFINITIONS_PATH,
    "PROTEUS_CYBERNETICS_DECK_CARDS",
  ),
  ...extractConstArrayLiteral(
    SHARED_DEFINITIONS_PATH,
    "PROTEUS_VARIABLE_ICE_CARDS",
  ),
];
const sourceSharedVariableIceCards = extractConstArrayLiteral(
  SHARED_DEFINITIONS_PATH,
  "PROTEUS_VARIABLE_ICE_CARDS",
);

const PROTEUS_SOURCE_FINGERPRINTS = Object.freeze({
  implementationPaths:
    "sha256:786e3eeefd43e5fc972ce32437d9135fa51f7b369c03c228a32a06f2ca8689aa",
  subregistryPaths:
    "sha256:07600edf9d1b2b408e546f64d1d28248f670963ae86292bc2470c57e74eab67a",
  implementationAggregate:
    "sha256:cff3af030e5c1b1451f4ab76065f9dab510e1e336a937783822d04785f20610b",
  subregistryAggregate:
    "sha256:cd321907b39f7f0f3fe1818bbcd80cc0b56eb46a031fd393ae84d0e5b8279180",
  raw: "sha256:4c9c0a291388feb1955cb8478fdf168227fcbef8bddf6f1e71971585e0cc8f70",
  support:
    "sha256:7ab6d88b83fa8835def344f8506b712c4ea3fddc306c63a45dbe9b578e8bfe10",
  hints:
    "sha256:fb9846d26c1a27f0eb0571d58831b04199db5918457de8c285b2fe97f7164c61",
  sharedProteusCards:
    "sha256:367d6a68114e05191bba7179f17339ded13a2de5f399eec2e28aa8fd87500320",
});

const PROTEUS_RAW_FIELDS = new Set([
  "cardId",
  "collectorNumber",
  "displayOnlyText",
  "faction",
  "markCounterDisplay",
  "numeric",
  "playCost",
  "rarity",
  "setId",
  "setName",
  "side",
  "subtypes",
  "text",
  "title",
  "type",
  "variableStrength",
]);
const PROTEUS_RAW_NUMERIC_FIELDS = new Set([
  "advancementRequirement",
  "agendaPoints",
  "cost",
  "installCost",
  "memoryCost",
  "rezCost",
  "strength",
  "trashCost",
]);
const PROTEUS_RARITY_FIELDS = new Set([
  "code",
  "labelDe",
  "labelEn",
  "sourceId",
  "sourceValue",
]);
const PROTEUS_SUPPORT_FIELDS = new Set([
  "blockReasons",
  "cardId",
  "notes",
  "setId",
  "statuses",
  "support",
]);
const PROTEUS_SUPPORT_STATUS_FIELDS = new Set([
  "ai_supported",
  "blocked",
  "catalog_ready",
  "deck_legal",
  "engine_supported",
  "format_legal",
  "human_playable",
  "implemented",
  "imported",
  "playable",
  "validated",
]);
const PROTEUS_SUPPORT_REFERENCE_FIELDS = new Set([
  "aiHintRef",
  "coverage",
  "notes",
  "resolverRef",
  "scenarioRefs",
]);
const PROTEUS_HINT_FIELDS = new Set([
  "actionCapacityProfiles",
  "actionStrategySupportPairs",
  "actionTacticSignals",
  "aiSupportStatus",
  "breakerProfile",
  "cardId",
  "cardType",
  "conditions",
  "effects",
  "functionSignals",
  "hiddenInfoPolicy",
  "lineSupport",
  "manualNotes",
  "planRoles",
  "quality",
  "remoteRole",
  "requiredMechanics",
  "riskTags",
  "roles",
  "scenarioRefs",
  "side",
  "strategicExchangeKinds",
  "strategicRole",
  "strategyAnchors",
  "strategySupportPairs",
  "tacticSignals",
  "targetProfiles",
  "valueHints",
]);
const PROTEUS_BREAKER_PROFILE_FIELDS = new Set([
  "breakCost",
  "configurableCoverage",
  "coverage",
  "coverageCandidates",
  "maxSubroutinesPerBreak",
  "multiSubroutineBreak",
  "oneTimeModeChoice",
  "pumpCost",
  "pumpStrengthAmount",
  "sideEffects",
]);
const PROTEUS_CONDITION_FIELDS = new Set(["kind"]);
const PROTEUS_EFFECT_FIELDS = new Set([
  "amount",
  "amountKind",
  "damageTypes",
  "economyMode",
  "finite",
  "kind",
  "perTurnLimit",
  "preventable",
  "repeatable",
  "resource",
  "scope",
  "target",
  "timing",
]);
const PROTEUS_QUALITY_FIELDS = new Set([
  "benchmarkCovered",
  "confidence",
  "hintReviewed",
  "needsHumanReview",
  "reviewedBy",
  "reviewedDate",
  "strategyCovered",
]);
const PROTEUS_STRATEGY_PAIR_FIELDS = new Set([
  "confidence",
  "evidence",
  "rationale",
  "role",
  "roleDetail",
  "strategyId",
]);
const PROTEUS_ACTION_STRATEGY_PAIR_FIELDS = new Set([
  "confidence",
  "evidence",
  "role",
  "strategyId",
]);
const PROTEUS_TARGET_PROFILE_FIELDS = new Set([
  "avoid",
  "hiddenInfoPolicy",
  "kind",
  "preferences",
  "purpose",
  "schemaVersion",
  "targetType",
  "timing",
]);
const PROTEUS_ACTION_CAPACITY_FIELDS = new Set([
  "actionTypes",
  "amount",
  "amountKind",
  "bankable",
  "class",
  "expiresAt",
  "recipient",
  "reliability",
  "repeatable",
  "restriction",
  "sourceResource",
  "timing",
]);
const PROTEUS_VALUE_HINT_FIELDS = new Set(["economy", "remoteRootValue"]);
const PROTEUS_REMOTE_ROLE_FIELDS = new Set([
  "kind",
  "serverScope",
  "threatLevel",
]);

const PROTEUS_CATALOG_GROUP_EXPORTS = Object.freeze([
  "PROTEUS_CORP_AGENDA_IMPLEMENTATIONS",
  "PROTEUS_CORP_ASSET_IMPLEMENTATIONS",
  "PROTEUS_CORP_ICE_IMPLEMENTATIONS",
  "PROTEUS_CORP_OPERATION_IMPLEMENTATIONS",
  "PROTEUS_CORP_UPGRADE_IMPLEMENTATIONS",
  "PROTEUS_RUNNER_EVENT_IMPLEMENTATIONS",
  "PROTEUS_RUNNER_HARDWARE_IMPLEMENTATIONS",
  "PROTEUS_RUNNER_PROGRAM_IMPLEMENTATIONS",
  "PROTEUS_RUNNER_RESOURCE_IMPLEMENTATIONS",
]);
const ADDRESSABLE_HELPER_SYMBOLS = new Set([
  "basicIcebreakerAbilities",
  "hiddenSuccessfulRunBeforeAccessEffect",
  "searchStackInstallEffect",
]);

async function runProteusInventoryMigration() {
  const proteusIds = new Set(sourceCards.map((card) => card.cardId));
  const proteusHints = sourceHints.filter((hint) =>
    proteusIds.has(hint.cardId),
  );
  assertClosedProteusSources(proteusHints);
  assertPinnedPathInventories();

  const implementations = descriptor.implementationPaths.map((relativePath) => {
    const helperImports = assertClosedImplementationImports(relativePath);
    const parsed = extractSingleExportedConstObject(
      sourceText(relativePath),
      PROTEUS_HELPER_CALLS,
      fail,
    );
    return {
      relativePath,
      exportName: parsed.exportName,
      helperImports,
      implementation: parsed.value,
    };
  });
  const sharedStaticSubroutineCards = sourceSharedProteusCards.filter(
    (card) => (card.subroutines?.length ?? 0) > 0,
  );
  const legacyPrintedSubroutineIds = new Set(
    implementations
      .filter(
        (entry) => (entry.implementation.printedSubroutines?.length ?? 0) > 0,
      )
      .map((entry) => entry.implementation.cardDefinitionId),
  );
  const sharedSubroutineCards = sharedStaticSubroutineCards.filter(
    (card) => !legacyPrintedSubroutineIds.has(card.id),
  );
  const expectedSharedSubroutineIds = [
    "onr_proteus_012_bug-zapper",
    "onr_proteus_013_caryatid",
    "onr_proteus_017_credit-blocks",
    "onr_proteus_021_dog-pile",
    "onr_proteus_023_galatea",
    "onr_proteus_025_homing-missile",
    "onr_proteus_028_lesser-arcana",
    "onr_proteus_030_mastermind",
    "onr_proteus_039_sphinx-2006",
    "onr_proteus_040_sumo-2008",
  ];
  if (
    sourceSharedProteusCards.length !== 46 ||
    new Set(sourceSharedProteusCards.map((card) => card.id)).size !== 46 ||
    sourceSharedProteusCards.some((card) => !proteusIds.has(card.id)) ||
    sourceSharedVariableIceCards.length !== 16 ||
    sharedStaticSubroutineCards.length !== 13 ||
    sharedStaticSubroutineCards.reduce(
      (total, card) => total + card.subroutines.length,
      0,
    ) !== 20 ||
    sharedSubroutineCards.length !== 10 ||
    sharedSubroutineCards.reduce(
      (total, card) => total + card.subroutines.length,
      0,
    ) !== 13 ||
    sharedSubroutineCards
      .map((card) => card.id)
      .sort()
      .join("\n") !== expectedSharedSubroutineIds.join("\n")
  )
    fail(
      `proteus_shared_subroutine_inventory_mismatch:shared=${sourceSharedProteusCards.length}:variable=${sourceSharedVariableIceCards.length}:staticCards=${sharedStaticSubroutineCards.length}:staticSubroutines=${sharedStaticSubroutineCards.reduce((total, card) => total + card.subroutines.length, 0)}:supplementCards=${sharedSubroutineCards.length}:supplementSubroutines=${sharedSubroutineCards.reduce((total, card) => total + card.subroutines.length, 0)}:ids=${sharedSubroutineCards
        .map((card) => card.id)
        .sort()
        .join(",")}`,
    );
  const sharedSubroutinesById = new Map(
    sharedSubroutineCards.map((card) => [card.id, card.subroutines]),
  );
  const mechanicalImplementations = implementations.map((entry) => {
    const sharedSubroutines = sharedSubroutinesById.get(
      entry.implementation.cardDefinitionId,
    );
    if (sharedSubroutines === undefined) return entry;
    if (entry.implementation.printedSubroutines !== undefined)
      fail(
        `proteus_shared_subroutine_duplicate_authority:${entry.implementation.cardDefinitionId}`,
      );
    const supplementedImplementation = {
      ...entry.implementation,
      printedSubroutines: sharedSubroutines.map((subroutine) =>
        translateSharedPrintedSubroutine(
          entry.implementation.cardDefinitionId,
          subroutine,
          entry.implementation.relativeIce?.dynamicDamageSubroutine ===
            undefined
            ? undefined
            : requiredProteusCapabilityKey(
                entry.implementation.cardDefinitionId,
                "relativeIce",
                0,
              ),
        ),
      ),
    };
    return {
      ...entry,
      implementation: reconcileSharedSubroutineReferences(
        supplementedImplementation,
        sharedSubroutines,
      ),
      sharedSubroutines,
    };
  });
  assertUniqueIds(sourceCards, "cardId", "proteus_raw");
  assertUniqueIds(sourceSupport, "cardId", "proteus_support");
  assertUniqueIds(proteusHints, "cardId", "proteus_hint");
  assertUniqueIds(
    implementations.map((entry) => entry.implementation),
    "cardDefinitionId",
    "proteus_implementation",
  );
  const exactIds = [...proteusIds].sort().join("\n");
  for (const [label, ids] of [
    ["support", sourceSupport.map((entry) => entry.cardId)],
    ["hint", proteusHints.map((entry) => entry.cardId)],
    [
      "implementation",
      implementations.map((entry) => entry.implementation.cardDefinitionId),
    ],
  ])
    if ([...ids].sort().join("\n") !== exactIds)
      fail(`proteus_source_id_partition_mismatch:${label}`);
  if (
    sourceCards.some((card) => card.setId !== "proteus") ||
    sourceSupport.some((entry) => entry.setId !== "proteus")
  )
    fail("proteus_source_set_mismatch");

  assertProteusSubregistryBindings(implementations);
  assertProteusCatalogGroups();
  assertKnownCoverageGap(proteusIds);

  const mechanics = mechanicalImplementations.map((entry) => {
    const families = Object.entries(entry.implementation)
      .filter(([family]) => family !== "cardDefinitionId")
      .filter(([, value]) => value !== undefined)
      .map(([family]) => family)
      .sort();
    const addressableNodes = addressableNodesFor(entry.implementation);
    return {
      cardDefinitionId: entry.implementation.cardDefinitionId,
      sourcePath: entry.relativePath,
      exportName: entry.exportName,
      helperImports: entry.helperImports,
      families,
      addressableNodes,
      sourceFingerprint: sha256(sourceText(entry.relativePath)),
      implementationFingerprint: sha256(JSON.stringify(entry.implementation)),
      ...(entry.sharedSubroutines === undefined
        ? {}
        : {
            sharedSubroutineFingerprint: sha256(
              JSON.stringify(entry.sharedSubroutines),
            ),
          }),
    };
  });
  const familyCardCounts = {};
  const familyNodeCounts = {};
  for (const entry of mechanics) {
    for (const family of entry.families)
      familyCardCounts[family] = (familyCardCounts[family] ?? 0) + 1;
    for (const node of entry.addressableNodes)
      familyNodeCounts[node.family] = (familyNodeCounts[node.family] ?? 0) + 1;
  }
  const addressableNodes = mechanics.flatMap((entry) =>
    entry.addressableNodes.map((node) => ({
      cardDefinitionId: entry.cardDefinitionId,
      ...node,
      capabilityKey: requiredProteusCapabilityKey(
        entry.cardDefinitionId,
        node.family,
        node.sourceIndex,
      ),
      addressability: ["plan", "action", "quote", "debug"],
      disposition: "explicit_reviewed_semantic_capability_key",
    })),
  );
  assertExactCapabilityDisposition(mechanics, addressableNodes);

  const projectedImplementations = implementations.filter((entry) =>
    hasProteusImplementationProjection(entry.implementation),
  ).length;
  const plannedDefinitionOnlyRuntime =
    implementations.length - projectedImplementations;
  const importedHelperModules = implementations.filter(
    (entry) => entry.helperImports.length > 0,
  );
  const addressableHelperModules = importedHelperModules.filter((entry) =>
    entry.helperImports.some((name) => ADDRESSABLE_HELPER_SYMBOLS.has(name)),
  );
  const importedHelperSymbols = [
    ...new Set(importedHelperModules.flatMap((entry) => entry.helperImports)),
  ].sort();
  const addressableHelperSymbols = importedHelperSymbols.filter((name) =>
    ADDRESSABLE_HELPER_SYMBOLS.has(name),
  );

  assertDerivedCounts(
    {
      sourceInputs: descriptor.sourcePaths.length,
      rawCards: sourceCards.length,
      supportEntries: sourceSupport.length,
      legacyHints: proteusHints.length,
      legacyImplementationModules: implementations.length,
      legacyImplementationSubregistries: descriptor.subregistryPaths.length,
      legacyImplementationCatalogGroups: PROTEUS_CATALOG_GROUP_EXPORTS.length,
      legacyTopLevelFamilies: Object.keys(familyCardCounts).length,
      plannedRuntimeDefinitions: sourceCards.length,
      plannedProjectedImplementations: projectedImplementations,
      plannedDefinitionOnlyRuntime,
      existingCardSpecs: EXISTING_SPEC_PATHS.length,
      importedHelperModules: importedHelperModules.length,
      addressableHelperModules: addressableHelperModules.length,
      importedHelperSymbols: importedHelperSymbols.length,
      addressableHelperSymbols: addressableHelperSymbols.length,
      sharedProteusDefinitions: sourceSharedProteusCards.length,
      sharedVariableIceDefinitions: sourceSharedVariableIceCards.length,
      sharedStaticSubroutineCards: sharedStaticSubroutineCards.length,
      sharedStaticSubroutines: sharedStaticSubroutineCards.reduce(
        (total, card) => total + card.subroutines.length,
        0,
      ),
      sharedSubroutineCards: sharedSubroutineCards.length,
      sharedSubroutines: sharedSubroutineCards.reduce(
        (total, card) => total + card.subroutines.length,
        0,
      ),
      addressableNodes: addressableNodes.length,
    },
    descriptor.expected,
    fail,
  );

  const implementationsById = new Map(
    mechanicalImplementations.map((entry) => [
      entry.implementation.cardDefinitionId,
      entry.implementation,
    ]),
  );
  const hintsById = new Map(proteusHints.map((entry) => [entry.cardId, entry]));
  const migratedCards = [...sourceCards]
    .sort(compareByCardId)
    .map((sourceCard) =>
      migrateProteusCard(
        sourceCard,
        implementationsById.get(sourceCard.cardId),
        hintsById.get(sourceCard.cardId),
      ),
    );
  const legacyManualNoteCards = proteusHints.filter(
    (hint) => (hint.manualNotes?.length ?? 0) > 0,
  ).length;
  const legacyManualNotes = proteusHints.reduce(
    (total, hint) => total + (hint.manualNotes?.length ?? 0),
    0,
  );
  const legacyActionStrategyCards = proteusHints.filter(
    (hint) => (hint.actionStrategySupportPairs?.length ?? 0) > 0,
  ).length;
  const legacyActionStrategyPairs = proteusHints.reduce(
    (total, hint) => total + (hint.actionStrategySupportPairs?.length ?? 0),
    0,
  );
  const generatedActionStrategyCards = migratedCards.filter(
    (card) => (card.planningAnnotations?.capabilities.length ?? 0) > 0,
  ).length;
  const generatedActionStrategyPairs = migratedCards.reduce(
    (total, card) =>
      total +
      (card.planningAnnotations?.capabilities.reduce(
        (capabilityTotal, capability) =>
          capabilityTotal + capability.annotations.length,
        0,
      ) ?? 0),
    0,
  );
  const actionCapacityCards = proteusHints.filter(
    (hint) => (hint.actionCapacityProfiles?.length ?? 0) > 0,
  ).length;
  const actionCapacityProfiles = proteusHints.reduce(
    (total, hint) => total + (hint.actionCapacityProfiles?.length ?? 0),
    0,
  );
  const outputs = new Map();
  for (const spec of migratedCards)
    outputs.set(
      `${spec.__migrationEvidence.cardDefinitionId}.card-spec.ts`,
      await format(renderCardSpec(spec), { parser: "typescript" }),
    );
  for (const relativePath of EXISTING_SPEC_PATHS)
    outputs.set(path.basename(relativePath), sourceText(relativePath));
  outputs.set("@set-spec", sourceText(SET_SPEC_PATH));
  const report = {
    schemaVersion: "card-spec-migration-report-v1",
    phase: "generated_specs_and_exact151_ai_pre_sourcecut_review",
    setId: descriptor.setId,
    sourceCommit: SOURCE_COMMIT,
    sourceInputs: descriptor.sourcePaths.map((relativePath) => ({
      relativePath,
      fingerprint: sha256(sourceText(relativePath)),
    })),
    counts: {
      sourceInputs: descriptor.sourcePaths.length,
      rawCards: sourceCards.length,
      supportEntries: sourceSupport.length,
      legacyHints: proteusHints.length,
      legacyImplementationModules: implementations.length,
      legacyImplementationSubregistries: descriptor.subregistryPaths.length,
      legacyImplementationCatalogGroups: PROTEUS_CATALOG_GROUP_EXPORTS.length,
      legacyTopLevelFamilies: Object.keys(familyCardCounts).length,
      plannedRuntimeDefinitions: sourceCards.length,
      plannedProjectedImplementations: projectedImplementations,
      plannedDefinitionOnlyRuntime,
      existingCardSpecs: EXISTING_SPEC_PATHS.length,
      generatedCardSpecs: migratedCards.length,
      importedHelperModules: importedHelperModules.length,
      addressableHelperModules: addressableHelperModules.length,
      importedHelperSymbols: importedHelperSymbols.length,
      addressableHelperSymbols: addressableHelperSymbols.length,
      sharedProteusDefinitions: sourceSharedProteusCards.length,
      sharedVariableIceDefinitions: sourceSharedVariableIceCards.length,
      sharedStaticSubroutineCards: sharedStaticSubroutineCards.length,
      sharedStaticSubroutines: sharedStaticSubroutineCards.reduce(
        (total, card) => total + card.subroutines.length,
        0,
      ),
      sharedSubroutineCards: sharedSubroutineCards.length,
      sharedSubroutines: sharedSubroutineCards.reduce(
        (total, card) => total + card.subroutines.length,
        0,
      ),
      addressableNodes: addressableNodes.length,
      legacyManualNoteCards,
      legacyManualNotes,
      legacyActionStrategyCards,
      legacyActionStrategyPairs,
      generatedActionStrategyCards,
      generatedActionStrategyPairs,
      generatedActionCapacityCards: actionCapacityCards,
      generatedActionCapacityProfiles: actionCapacityProfiles,
    },
    targetCountsAfterCutover: {
      proteusDefinitions: 154,
      proteusProjectedImplementations: 151,
      cardSpecDefinitions: 251,
      cardSpecProjectedImplementations: 228,
      legacyProjectedImplementations: 366,
      combinedProjectedImplementations: 594,
      engineDefinitions: 634,
      sharedDefinitions: 383,
      sharedDefinitionsById: 383,
      legacyHints: 367,
      generatedCardSpecHints: 251,
      effectiveHints: 618,
      catalogCards: 620,
    },
    familyCardCounts,
    addressableFamilyNodeCounts: familyNodeCounts,
    helperDisposition: {
      ownerFiles: [HELPERS_PATH, PRIMITIVES_PATH],
      importedSymbols: importedHelperSymbols,
      addressableSymbols: addressableHelperSymbols,
      importedModules: importedHelperModules.map((entry) => entry.relativePath),
      addressableModules: addressableHelperModules.map(
        (entry) => entry.relativePath,
      ),
      sourceDisposition:
        "closed_exact_import_map_and_reviewed_literal_helper_expansion",
    },
    dispositions: {
      sourceAuthorship:
        "151_legacy_implementation_backed_cards_plus_3_existing_cs06_card_specs",
      generationBoundary:
        "generated_specs_and_generic_projector_only_no_sourcecut_or_runtime_authority_transfer",
      implementationSource:
        "closed_literal_ast_plus_seven_reviewed_helper_symbol_evaluators",
      sharedSubroutineSource:
        "pinned_shared_proteus_variable_ice_definition_slice_exact16_with_13_runtime_subroutines_on_10_cards",
      sharedDefinitionSource:
        "pinned_exact46_hand_authored_proteus_shared_definitions_with_full_public_fact_and_runtime_subroutine_parity",
      sharedSubtypeOrder:
        "canonical_raw_subtype_order_preserves_exact_subtype_sets_and_intentionally_reorders_only_bel_digmo_doppelganger_pattel_stereogram_bug_zapper_dog_pile_food_fight_hunting_pack_mastermind",
      sharedMechanicTokens:
        "legacy_shared_mechanics_are_not_a_second_runtime_authority_typed_card_spec_nodes_replace_consumed_tokens_armageddon_does_not_gain_an_unprinted_install_virus_counter",
      sharedDynamicSubroutineBinding:
        "relative_ice_dynamic_damage_references_are_rebound_from_legacy_shared_subroutine_ids_to_the_reviewed_canonical_printed_subroutine_capability_keys",
      sharedHomingTraceLimit:
        "legacy_shared_zero_placeholder_is_replaced_by_typed_variable_rez_trace_limit_from_rez_value_runtime_projection",
      sharedDynamicHintBinding:
        "relative_ice_and_x_trace_shared_zero_placeholders_never_compile_as_fixed_zero_hint_values_typed_dynamic_owners_supply_amount_scope_timing_and_run_lock",
      mechanicPresentationSplit:
        "nested_legacy_text_removed_from_engine_nodes_canonical_rules_text_and_capability_text_own_public_copy",
      printedOnlyRuntime:
        "brain_wash_colonel_failure_toughonium_wall_definition_owned_without_fake_implementation",
      regionBaseline:
        "discard_three_redundant_authoring_markers_use_region_subtype_and_real_modifiers",
      capabilityIdentity:
        "exact191_explicit_reviewed_semantic_keys_including_13_pinned_shared_subroutines_no_kind_or_ordinal_runtime_inference",
      sourceSchemas:
        "closed_raw_support_hint_shapes_plus_exact_pinned_slice_and_path_fingerprints",
      hintAuthority:
        "mechanical_facts_derive_from_closed_typed_engine_nodes_planning_interpretations_use_reviewed_typed_card_and_capability_annotations_evidence_and_editor_fields_never_enter_runtime_hints",
      actionCapacityProfiles:
        "exact16_profiles_on_15_cards_derive_only_from_closed_typed_mechanical_nodes_no_card_id_normalizer_authority",
      actionStrategySupportPairs:
        "exact27_pairs_on_17_cards_bound_to_reviewed_capability_keys_with_closed_role_detail_and_evidence_anchor_hunting_pack_passive_pair_discarded_as_not_action_addressable",
      manualNotes:
        "discard_all_250_editor_only_notes_on_74_cards_readiness_classification_is_invariant_to_note_removal",
      timeToCollectLegacyCondition:
        "discard_stale_requires_program_trash_hint_condition_typed_trash_prevention_protects_resources_without_a_program_cost",
      disintegratorTargetProfile:
        "canonical_breaker_effect_owner_uses_encounter_resolution_and_visible_or_known_policy_instead_of_stale_legacy_during_ice_encounter_public_claim",
      canonicalDamageValues:
        "fixed_damage_values_for_fetal_ai_bel_digmo_and_stereogram_derive_from_typed_mechanics_instead_of_legacy_empty_value_hints",
      streetwareEconomyValue:
        "typed_three_credit_recurring_mechanic_replaces_stale_legacy_economy_one_evaluation",
      fetalAiAccessEffects:
        PROTEUS_MECHANICAL_RECONCILIATIONS["onr_proteus_004_fetal-ai"]
          .accessEffects.disposition,
      fetalAiSelfStealCosts:
        PROTEUS_MECHANICAL_RECONCILIATIONS["onr_proteus_004_fetal-ai"]
          .selfStealCosts.disposition,
      markedAccountsAccessEffects:
        PROTEUS_MECHANICAL_RECONCILIATIONS["onr_proteus_005_marked-accounts"]
          .accessEffects.disposition,
      existingSpecs:
        "digiconda_black_widow_morphing_tool_preserved_byte_for_byte",
      sourceCut:
        "not_authorized_old_sources_remain_until_projector_and_exact151_ai_review",
      knownBaselineCoverageGap:
        "charity_takeover_current_locations_empty_must_close_during_cutover",
      eurocorpseHostedProgramCapacity:
        PROTEUS_MECHANICAL_RECONCILIATIONS[
          "onr_proteus_139_eurocorpse-tm-spin-chip"
        ].hostedProgramCapacity.disposition,
      knownBaselinePilotGap:
        "clean_e6d_live_gate_failed_with_six_illegal_actions_and_runtime_failures_across_datacomb_hijack_sunburst_and_washed_up_solo_construct_owner_cause_fixes_required_before_report_regeneration_no_blind_rebase",
    },
    cards: mechanics.map((entry) => ({
      ...entry,
      ...(PROTEUS_MECHANICAL_RECONCILIATIONS[entry.cardDefinitionId] ===
      undefined
        ? {}
        : {
            mechanicalReconciliation:
              PROTEUS_MECHANICAL_RECONCILIATIONS[entry.cardDefinitionId],
          }),
      rawCard: sourceCards.find(
        (card) => card.cardId === entry.cardDefinitionId,
      ),
      legacyHintFingerprint: sha256(
        JSON.stringify(hintsById.get(entry.cardDefinitionId)),
      ),
      legacyImplementation: implementationsById.get(entry.cardDefinitionId),
      legacyModuleImplementation: implementations.find(
        (implementation) =>
          implementation.implementation.cardDefinitionId ===
          entry.cardDefinitionId,
      )?.implementation,
      sharedDefinition: sourceSharedProteusCards.find(
        (definition) => definition.id === entry.cardDefinitionId,
      ),
      outputFingerprint: sha256(
        outputs.get(`${entry.cardDefinitionId}.card-spec.ts`),
      ),
    })),
    addressableNodes,
    aggregateInventoryFingerprint: sha256(
      JSON.stringify({
        sourceCommit: SOURCE_COMMIT,
        cards: mechanics,
        addressableNodes,
        familyCardCounts,
        familyNodeCounts,
      }),
    ),
    aggregateOutputFingerprint: sha256(
      [...outputs]
        .map(([relativePath, content]) => `${relativePath}\n${content}`)
        .join("\n"),
    ),
  };
  outputs.set(
    "@report",
    await format(JSON.stringify(report), {
      parser: "json",
      endOfLine: "lf",
    }),
  );
  await verifyOrWrite(outputs);
  console.log(
    `proteus_card_spec_inventory_${mode}_ok cards=${sourceCards.length} implementations=${implementations.length} families=${Object.keys(familyCardCounts).length} addressable=${addressableNodes.length} source=${SOURCE_COMMIT}`,
  );
}

function migrateProteusCard(sourceCard, implementation, hint) {
  if (implementation === undefined)
    fail(`proteus_implementation_missing:${sourceCard.cardId}`);
  if (hint === undefined) fail(`proteus_hint_missing:${sourceCard.cardId}`);
  const capabilityText = capabilityTextFor(implementation);
  const planningAnnotations = proteusPlanningAnnotations(
    sourceCard.cardId,
    hint,
  );
  return {
    schemaVersion: "card-spec-v1",
    identity: {
      cardDefinitionId: expression(
        `cardDefinitionId(${JSON.stringify(sourceCard.cardId)})`,
      ),
      title: sourceCard.title,
      side: sourceCard.side,
      cardType: sourceCard.type,
    },
    text: {
      schemaVersion: "canonical-card-text-v1",
      rulesText: reconciledProteusRulesText(sourceCard),
      ...(capabilityText.length === 0 ? {} : { capabilityText }),
      ...(sourceCard.markCounterDisplay === undefined
        ? {}
        : { markCounterDisplay: sourceCard.markCounterDisplay }),
    },
    rules: {
      schemaVersion: "card-rules-v1",
      references: [{ source: "card_text", reference: sourceCard.cardId }],
    },
    engine: {
      schemaVersion: "card-mechanical-spec-v1",
      characteristics: proteusCharacteristics(sourceCard),
      ...proteusMechanicalFamilies(implementation),
    },
    ...(planningAnnotations.card.length === 0 &&
    planningAnnotations.capabilities.length === 0
      ? {}
      : { planningAnnotations }),
    printings: [
      {
        schemaVersion: "printing-spec-v1",
        printingId: sourceCard.cardId,
        setId: "proteus",
        collectorNumber: sourceCard.collectorNumber,
        ...(sourceCard.rarity?.code === undefined
          ? {}
          : { rarity: sourceCard.rarity.code }),
      },
    ],
    publication: {
      schemaVersion: "card-publication-v1",
      status: "active",
    },
    __migrationEvidence: {
      cardDefinitionId: sourceCard.cardId,
      implementationCoverage: "legacy_implementation_backed_declarative",
    },
  };
}

const PROTEUS_PLANNING_TACTIC_INTERPRETATIONS = Object.freeze({
  "access.punish": { signal: "access.punish", use: "access.punish" },
  "corp.remote_protection": {
    signal: "corp.remote_protection",
    use: "corp.remote_protection",
  },
  "coverage.breaker": {
    signal: "coverage.breaker",
    use: "coverage.breaker",
  },
  "damage.payoff": {
    signal: "damage.payoff",
    use: "damage.payoff.runner",
  },
  "damage.payoff.runner": {
    signal: "damage.payoff",
    use: "damage.payoff.runner",
  },
  "draw.card": { signal: "draw.card", use: "draw.card" },
  "economy.card": { signal: "economy.card", use: "economy.card" },
  "punish.payoff": { signal: "punish.payoff", use: "punish.payoff" },
  "remote.ambush": { signal: "remote.ambush", use: "remote.ambush" },
  "tag.payoff": { signal: "tag.payoff", use: "tag.payoff" },
});

function proteusPlanningAnnotations(cardDefinitionId, hint) {
  const card = [];
  for (const role of stringValues(
    hint.planRoles,
    `${cardDefinitionId}.planRoles`,
  ))
    card.push({ kind: "plan_role", role });
  for (const role of stringValues(
    hint.strategicRole,
    `${cardDefinitionId}.strategicRole`,
  ))
    card.push({ kind: "strategic_role", role });
  for (const strategyKey of stringValues(
    hint.strategyAnchors,
    `${cardDefinitionId}.strategyAnchors`,
  ))
    card.push({ kind: "strategy_anchor", strategyKey });
  for (const lineKey of stringValues(
    hint.lineSupport,
    `${cardDefinitionId}.lineSupport`,
  ))
    card.push({ kind: "line_support", lineKey, support: "supports" });
  for (const exchange of stringValues(
    hint.strategicExchangeKinds,
    `${cardDefinitionId}.strategicExchangeKinds`,
  ))
    card.push({ kind: "strategic_exchange", exchange });
  for (const pair of objectValues(
    hint.strategySupportPairs,
    `${cardDefinitionId}.strategySupportPairs`,
  ))
    card.push(strategySupportAnnotation(pair, cardDefinitionId));

  const planningTactics = new Map();
  for (const token of [
    ...stringValues(hint.tacticSignals, `${cardDefinitionId}.tacticSignals`),
    ...stringValues(
      hint.actionTacticSignals,
      `${cardDefinitionId}.actionTacticSignals`,
    ),
  ]) {
    const interpretation = PROTEUS_PLANNING_TACTIC_INTERPRETATIONS[token];
    if (interpretation !== undefined)
      planningTactics.set(
        `${interpretation.signal}:${interpretation.use}`,
        interpretation,
      );
  }
  for (const interpretation of planningTactics.values())
    card.push({ kind: "tactic_interpretation", ...interpretation });

  for (const target of objectValues(
    hint.targetProfiles,
    `${cardDefinitionId}.targetProfiles`,
  ))
    card.push({
      kind: "target_preference",
      purpose: requiredString(target.purpose, `${cardDefinitionId}.purpose`),
      ...(target.preferences === undefined
        ? {}
        : {
            preferences: stringValues(
              target.preferences,
              `${cardDefinitionId}.preferences`,
            ),
          }),
      ...(target.avoid === undefined
        ? {}
        : {
            avoid: stringValues(target.avoid, `${cardDefinitionId}.avoid`),
          }),
    });
  for (const [axis, value] of Object.entries(hint.valueHints ?? {})) {
    if (axis === "damage") continue;
    if (axis !== "remoteRootValue" && axis !== "economy")
      fail(`proteus_unknown_value_axis:${cardDefinitionId}:${axis}`);
    card.push({
      kind: "value_interpretation",
      axis: axis === "remoteRootValue" ? "remote_root_value" : "economy",
      rating: numericRating(value, `${cardDefinitionId}.${axis}`),
      rationale: `Migrated from reviewed Proteus hint ${cardDefinitionId}.`,
    });
  }

  const legacyActionPairs = objectValues(
    hint.actionStrategySupportPairs,
    `${cardDefinitionId}.actionStrategySupportPairs`,
  );
  const capabilityKey = PROTEUS_ACTION_STRATEGY_CAPABILITIES[cardDefinitionId];
  const discardedPassivePair =
    cardDefinitionId === "onr_proteus_026_hunting-pack";
  if (discardedPassivePair) {
    if (legacyActionPairs.length !== 1)
      fail("proteus_hunting_pack_action_pair_disposition_changed");
  } else if ((legacyActionPairs.length === 0) !== (capabilityKey === undefined))
    fail(
      `proteus_action_strategy_capability_mismatch:${cardDefinitionId}:${legacyActionPairs.length}`,
    );
  const capabilities =
    legacyActionPairs.length === 0 || discardedPassivePair
      ? []
      : [
          {
            capabilityKey: expression(
              `capabilityKey(${JSON.stringify(capabilityKey)})`,
            ),
            annotations: legacyActionPairs.map((pair) =>
              actionStrategySupportAnnotation(pair, cardDefinitionId),
            ),
          },
        ];
  return {
    schemaVersion: "card-planning-annotations-v1",
    card,
    capabilities,
  };
}

function actionStrategySupportAnnotation(pair, cardDefinitionId) {
  const evidence = stringValues(
    pair.evidence,
    `${cardDefinitionId}.actionStrategySupportEvidence`,
  );
  if (evidence.length !== 1)
    fail(`proteus_action_strategy_evidence_shape:${cardDefinitionId}`);
  const evidenceAnchor = evidence[0].replace(/^tactic_signal_anchor:/, "");
  if (
    evidenceAnchor === evidence[0] ||
    ![
      "access.hq_multiaccess",
      "access.rnd_multiaccess",
      "damage.corp_tagged_meat_payoff",
      "tag.payoff",
      "tag.source",
      "trace.source",
    ].includes(evidenceAnchor)
  )
    fail(`proteus_action_strategy_evidence_ontology:${cardDefinitionId}`);
  const role = requiredString(pair.role, `${cardDefinitionId}.role`);
  return {
    kind: "strategy_support",
    strategyKey: requiredString(
      pair.strategyId,
      `${cardDefinitionId}.strategyId`,
    ),
    role,
    roleDetail: `${role}_${evidenceAnchor.replaceAll(".", "_")}`,
    evidenceAnchor,
    confidence: confidenceValue(pair.confidence, cardDefinitionId),
  };
}

const PROTEUS_CARD_STRATEGY_EVIDENCE_PROFILES = new Set([
  "access_counter_credit_loss",
  "access_counter_icebreaker_strength",
  "access_net_damage_payoff_archives",
  "access_net_damage_payoff_rnd",
  "access_tag_ambush",
  "access_tag_source",
  "access_window_advancement_enabler",
  "agenda_net_damage_ambush",
  "black_ops_agenda_difficulty_discount",
  "brain_damage_ice",
  "central_multiaccess_reduction",
  "damage_amplifier",
  "damage_conversion_extra_action_bank",
  "deep_server_damage_payoff_ice",
  "future_strength_tax_ice",
  "gray_ops_agenda_difficulty_discount",
  "ice_order_control",
  "ice_subroutine_repeat_support",
  "install_rez_reserve_counter",
  "install_rez_reserve_temporary",
  "installment_free_rez_ice",
  "multi_program_trash_tax_ice",
  "net_damage_steal_tax",
  "one_card_score_closeout",
  "overadvance_extra_action_payoff",
  "overadvance_recurring_credit_payoff",
  "paid_end_run_subroutine_ice",
  "paid_trace_tag_source",
  "pass_ice_pay_or_end_remote_protection",
  "pass_ice_pay_or_end_tax",
  "pay_or_end_run_ice",
  "position_scaling_etr_ice",
  "position_scaling_net_damage_ice",
  "position_scaling_strength_tax_ice",
  "position_scaling_tax_ice",
  "position_scaling_trace_tag_source",
  "position_scaling_trace_tag_tax_ice",
  "program_bounce_ambush",
  "random_recurring_action_mode",
  "recurring_extra_action_payoff",
  "remote_content_swap_defense",
  "remote_run_control",
  "research_agenda_difficulty_discount",
  "resource_install_retaliatory_trace_tag_source",
  "retaliatory_node_trash_tag_source",
  "rez_paid_scaling_ice",
  "run_spend_cap_tax",
  "run_temporary_credit_reserve",
  "scaling_trace_margin_tag_source",
  "tagged_meat_hand_size_pressure",
  "tagged_runner_punish_payoff",
  "trace_credit_enabler",
  "trace_success_recent_resource_trash",
  "temporary_free_rez_ice",
  "x_strength_trace_ice",
]);

function strategySupportAnnotation(pair, cardDefinitionId) {
  const evidence = stringValues(pair.evidence, `${cardDefinitionId}.evidence`);
  let roleDetail =
    pair.roleDetail === undefined
      ? requiredString(pair.role, `${cardDefinitionId}.role`)
      : requiredString(pair.roleDetail, `${cardDefinitionId}.roleDetail`);
  let evidenceProfile = roleDetail;
  if (roleDetail === "access_net_damage_payoff")
    evidenceProfile = evidence.includes("access.corp_rnd_net_damage_ambush")
      ? "access_net_damage_payoff_rnd"
      : evidence.includes("access.corp_archives_net_damage_ambush")
        ? "access_net_damage_payoff_archives"
        : fail(`proteus_access_damage_evidence_profile:${cardDefinitionId}`);
  if (roleDetail === "install_rez_reserve")
    evidenceProfile = evidence.includes("economy.corp_counter_cashout")
      ? "install_rez_reserve_counter"
      : evidence.includes("economy.corp_run_temporary_credit")
        ? "install_rez_reserve_temporary"
        : fail(`proteus_install_rez_evidence_profile:${cardDefinitionId}`);
  if (roleDetail === "run_lock_ice") {
    if (
      evidence.length !== 2 ||
      !evidence.includes("corp_ice.rez_paid_scaling") ||
      !evidence.includes("corp_ice.run_lock")
    )
      fail(
        `proteus_homing_missile_legacy_evidence_changed:${cardDefinitionId}`,
      );
    roleDetail = "x_strength_trace_ice";
    evidenceProfile = "x_strength_trace_ice";
  }
  if (!PROTEUS_CARD_STRATEGY_EVIDENCE_PROFILES.has(evidenceProfile))
    fail(
      `proteus_unknown_card_strategy_evidence_profile:${cardDefinitionId}:${evidenceProfile}`,
    );
  return {
    kind: "strategy_support",
    strategyKey: requiredString(
      pair.strategyId,
      `${cardDefinitionId}.strategyId`,
    ),
    role: requiredString(pair.role, `${cardDefinitionId}.role`),
    roleDetail,
    evidenceProfile,
    confidence: confidenceValue(pair.confidence, cardDefinitionId),
    ...(pair.rationale === undefined
      ? {}
      : {
          rationale: requiredString(
            pair.rationale,
            `${cardDefinitionId}.rationale`,
          ),
        }),
  };
}

function confidenceValue(value, cardDefinitionId) {
  if (value !== "low" && value !== "medium" && value !== "high")
    fail(`proteus_unknown_confidence:${cardDefinitionId}:${value}`);
  return value;
}

function numericRating(value, pathLabel) {
  if (value === 1) return "low";
  if (value === 2) return "medium";
  if (value === 3) return "high";
  if (value === 4) return "very_high";
  if (value === 5) return "critical";
  fail(`proteus_unknown_rating:${pathLabel}:${value}`);
}

function stringValues(value, pathLabel) {
  if (value === undefined) return [];
  const entries = Array.isArray(value) ? value : [value];
  if (entries.some((entry) => typeof entry !== "string" || entry.length === 0))
    fail(`proteus_invalid_string_values:${pathLabel}`);
  return entries;
}

function objectValues(value, pathLabel) {
  if (value === undefined) return [];
  const entries = Array.isArray(value) ? value : [value];
  if (
    entries.some(
      (entry) =>
        entry === null || typeof entry !== "object" || Array.isArray(entry),
    )
  )
    fail(`proteus_invalid_object_values:${pathLabel}`);
  return entries;
}

function requiredString(value, pathLabel) {
  if (typeof value !== "string" || value.length === 0)
    fail(`proteus_string_missing:${pathLabel}`);
  return value;
}

function proteusCharacteristics(sourceCard) {
  const numeric = requiredRecord(
    sourceCard.numeric,
    `raw:${sourceCard.cardId}.numeric`,
  );
  const playCost =
    sourceCard.type === "event" || sourceCard.type === "operation"
      ? (sourceCard.playCost ?? {
          kind: "fixed",
          credits: requiredNumber(numeric.cost, `${sourceCard.cardId}.cost`),
        })
      : null;
  const strength =
    sourceCard.variableStrength ??
    (numeric.strength === null
      ? { kind: "not_applicable" }
      : {
          kind: "fixed",
          value: requiredNumber(
            numeric.strength,
            `${sourceCard.cardId}.strength`,
          ),
        });
  return {
    faction: sourceCard.faction,
    subtypes: [...(sourceCard.subtypes ?? [])],
    numeric: {
      installCost: nullableNumber(
        numeric.installCost,
        sourceCard,
        "installCost",
      ),
      memoryCost: nullableNumber(numeric.memoryCost, sourceCard, "memoryCost"),
      rezCost: nullableNumber(numeric.rezCost, sourceCard, "rezCost"),
      trashCost: nullableNumber(numeric.trashCost, sourceCard, "trashCost"),
      advancementRequirement: nullableNumber(
        numeric.advancementRequirement,
        sourceCard,
        "advancementRequirement",
      ),
      agendaPoints: nullableNumber(
        numeric.agendaPoints,
        sourceCard,
        "agendaPoints",
      ),
    },
    playCost,
    strength,
  };
}

function proteusMechanicalFamilies(implementation) {
  const result = {};
  for (const [family, value] of Object.entries(implementation)) {
    if (family === "cardDefinitionId" || family === "regionBaseline") continue;
    const reconciledValue = reconciledProteusMechanic(
      implementation.cardDefinitionId,
      family,
      mechanicsOnly(value),
    );
    if (PROTEUS_ADDRESSABLE_FAMILIES.has(family)) {
      const entries = Array.isArray(reconciledValue)
        ? reconciledValue
        : [reconciledValue];
      const migrated = entries.map((entry, sourceIndex) => ({
        capabilityKey: expression(
          `capabilityKey(${JSON.stringify(
            requiredProteusCapabilityKey(
              implementation.cardDefinitionId,
              family,
              sourceIndex,
            ),
          )})`,
        ),
        addressability: ["plan", "action", "quote", "debug"],
        ...entry,
      }));
      result[family] = Array.isArray(reconciledValue) ? migrated : migrated[0];
      continue;
    }
    result[family] = reconciledValue;
  }
  return result;
}

function reconciledProteusMechanic(cardDefinitionId, family, value) {
  const reconciliation =
    PROTEUS_MECHANICAL_RECONCILIATIONS[cardDefinitionId]?.[family];
  if (reconciliation === undefined) return value;
  if (family === "accessEffects" || family === "selfStealCosts")
    return reconcileAccessZoneMechanic(
      cardDefinitionId,
      family,
      value,
      reconciliation,
    );
  if (reconciliation.kind === "dynamic_damage_binding") {
    assertDynamicDamageReconciliation(
      cardDefinitionId,
      family,
      value,
      reconciliation,
    );
    if (family === "relativeIce")
      return {
        ...value,
        dynamicDamageSubroutine: {
          ...value.dynamicDamageSubroutine,
          subroutineCapabilityKey: expression(
            `capabilityKey(${JSON.stringify(
              value.dynamicDamageSubroutine.subroutineCapabilityKey,
            )})`,
          ),
        },
      };
    return value.map((entry) =>
      entry?.amount?.kind === "derived"
        ? {
            ...entry,
            amount: {
              ...entry.amount,
              ownerCapabilityKey: expression(
                `capabilityKey(${JSON.stringify(
                  entry.amount.ownerCapabilityKey,
                )})`,
              ),
            },
          }
        : entry,
    );
  }
  if (reconciliation.kind === "minotaur_repeat_scope") {
    if (
      family !== "modifiers" ||
      !Array.isArray(value) ||
      value.length !== 1 ||
      value[0]?.kind !== "additional_subroutine" ||
      value[0].repeat?.kind !== "for_each_rezzed_installed_ice" ||
      value[0].repeat.excludeSource !== true ||
      JSON.stringify(value[0].repeat.subtypeAnyOf) !==
        JSON.stringify(["code_gate", "wall"]) ||
      Object.hasOwn(value[0].repeat, "scope") ||
      Object.hasOwn(value[0].repeat, "subtypeMatch")
    )
      fail(`proteus_minotaur_repeat_source_shape:${cardDefinitionId}`);
    return [
      {
        ...value[0],
        repeat: {
          ...value[0].repeat,
          scope: reconciliation.scope,
          subtypeMatch: reconciliation.subtypeMatch,
        },
      },
    ];
  }
  if (
    family !== "hostedProgramCapacity" ||
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    reconciliation.capacityMu !== 1
  )
    fail(
      `proteus_unknown_mechanical_reconciliation:${cardDefinitionId}:${family}`,
    );
  return { ...value, capacityMu: reconciliation.capacityMu };
}

function reconciledProteusRulesText(sourceCard) {
  const reconciliation =
    PROTEUS_MECHANICAL_RECONCILIATIONS[sourceCard.cardId]?.rulesText;
  if (reconciliation === undefined) return sourceCard.text;
  if (
    sourceCard.text !== reconciliation.legacy ||
    typeof reconciliation.canonical !== "string" ||
    reconciliation.canonical.split("\n").length !== 4 ||
    reconciliation.canonical
      .split("\n")
      .some((line) => line !== "*End the run.")
  )
    fail(`proteus_rules_text_reconciliation_mismatch:${sourceCard.cardId}`);
  return reconciliation.canonical;
}

function assertDynamicDamageReconciliation(
  cardDefinitionId,
  family,
  value,
  reconciliation,
) {
  if (family === "relativeIce") {
    const binding = value?.dynamicDamageSubroutine;
    if (
      value?.kind !== "rezzed_ice_outside_this_ice" ||
      binding?.subroutineCapabilityKey !==
        reconciliation.subroutineCapabilityKey ||
      !Number.isInteger(binding.amountPerCount) ||
      binding.amountPerCount <= 0 ||
      binding.visibility !== "public"
    )
      fail(
        `proteus_dynamic_damage_relative_ice_reconciliation_mismatch:${cardDefinitionId}`,
      );
    return;
  }
  if (family === "printedSubroutines") {
    const entries = Array.isArray(value) ? value : [];
    const targetIndex =
      PROTEUS_CAPABILITY_KEYS[cardDefinitionId]?.printedSubroutines?.indexOf(
        reconciliation.subroutineCapabilityKey,
      ) ?? -1;
    const target = entries[targetIndex];
    const derivedTargets = entries.filter(
      (entry) => entry?.amount?.kind === "derived",
    );
    if (
      targetIndex < 0 ||
      derivedTargets.length !== 1 ||
      target?.kind !== "damage" ||
      target.amount?.kind !== "derived" ||
      target.amount.source !== "relative_ice_dynamic_damage" ||
      target.amount.ownerCapabilityKey !== reconciliation.ownerCapabilityKey
    )
      fail(
        `proteus_dynamic_damage_printed_reconciliation_mismatch:${cardDefinitionId}`,
      );
    return;
  }
  fail(
    `proteus_dynamic_damage_reconciliation_family_mismatch:${cardDefinitionId}:${family}`,
  );
}

function reconcileAccessZoneMechanic(
  cardDefinitionId,
  family,
  value,
  reconciliation,
) {
  const entries = Array.isArray(value) ? value : [value];
  const expectedKind =
    family === "accessEffects" ? "on_access" : "current_access_self_steal_cost";
  if (
    entries.length !== 1 ||
    entries[0] === null ||
    typeof entries[0] !== "object" ||
    Array.isArray(entries[0]) ||
    entries[0].kind !== expectedKind ||
    JSON.stringify(entries[0].sourceZones) !==
      JSON.stringify(reconciliation.legacySourceZones) ||
    JSON.stringify(entries[0].ignoreIfAccessedFrom) !==
      JSON.stringify([reconciliation.removeIgnoredAccessZone]) ||
    !Array.isArray(reconciliation.canonicalSourceZones) ||
    reconciliation.removeIgnoredAccessZone !== "archives"
  )
    fail(
      `proteus_invalid_access_zone_reconciliation_source:${cardDefinitionId}:${family}`,
    );
  const { ignoreIfAccessedFrom: _ignored, ...entry } = entries[0];
  const reconciled = {
    ...entry,
    sourceZones: [...reconciliation.canonicalSourceZones],
  };
  return Array.isArray(value) ? [reconciled] : reconciled;
}

function mechanicsOnly(value) {
  if (Array.isArray(value)) return value.map(mechanicsOnly);
  if (value === null || typeof value !== "object") return value;
  const result = Object.fromEntries(
    Object.entries(value)
      .filter(
        ([key]) =>
          key !== "label" &&
          key !== "text" &&
          key !== "abilityKey" &&
          key !== "capabilityKey" &&
          key !== "addressability",
      )
      .map(([key, entry]) => [key, mechanicsOnly(entry)]),
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

function capabilityTextFor(implementation) {
  const result = [];
  for (const family of PROTEUS_ADDRESSABLE_FAMILIES) {
    const value = implementation[family];
    if (value === undefined) continue;
    const entries = Array.isArray(value) ? value : [value];
    entries.forEach((entry, sourceIndex) => {
      if (typeof entry.label !== "string") return;
      result.push({
        capabilityKey: expression(
          `capabilityKey(${JSON.stringify(
            requiredProteusCapabilityKey(
              implementation.cardDefinitionId,
              family,
              sourceIndex,
            ),
          )})`,
        ),
        actionLabel: entry.label,
      });
    });
  }
  return result;
}

function renderCardSpec(specWithEvidence) {
  const { __migrationEvidence: _evidence, ...spec } = specWithEvidence;
  const usesCapabilityKey = JSON.stringify(spec).includes("capabilityKey(");
  const imports = usesCapabilityKey
    ? "capabilityKey, cardDefinitionId, type CardSpec"
    : "cardDefinitionId, type CardSpec";
  return `import { ${imports} } from "../..";\n\nexport const cardSpec = ${renderValue(spec)} satisfies CardSpec;\n`;
}

function nullableNumber(value, sourceCard, field) {
  if (value === null) return null;
  return requiredNumber(value, `${sourceCard.cardId}.${field}`);
}

function requiredNumber(value, pathLabel) {
  if (typeof value !== "number" || !Number.isFinite(value))
    fail(`proteus_number_missing:${pathLabel}`);
  return value;
}

function compareByCardId(left, right) {
  return left.cardId < right.cardId ? -1 : left.cardId > right.cardId ? 1 : 0;
}

function assertPinnedPathInventories() {
  if (
    sha256(JSON.stringify(implementationPaths)) !==
    PROTEUS_SOURCE_FINGERPRINTS.implementationPaths
  )
    fail("proteus_implementation_path_inventory_mismatch");
  if (
    sha256(JSON.stringify(subregistryPaths)) !==
    PROTEUS_SOURCE_FINGERPRINTS.subregistryPaths
  )
    fail("proteus_subregistry_path_inventory_mismatch");
  if (
    aggregateSourceFingerprint(implementationPaths) !==
    PROTEUS_SOURCE_FINGERPRINTS.implementationAggregate
  )
    fail("proteus_implementation_source_aggregate_mismatch");
  if (
    aggregateSourceFingerprint(subregistryPaths) !==
    PROTEUS_SOURCE_FINGERPRINTS.subregistryAggregate
  )
    fail("proteus_subregistry_source_aggregate_mismatch");
}

function aggregateSourceFingerprint(relativePaths) {
  return sha256(
    relativePaths
      .map((relativePath) => `${relativePath}\n${sourceText(relativePath)}`)
      .join("\n"),
  );
}

function extractConstArrayLiteral(relativePath, constName) {
  const sourceFile = ts.createSourceFile(
    relativePath,
    sourceText(relativePath),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  if (sourceFile.parseDiagnostics.length > 0)
    fail(`proteus_shared_definition_parse_error:${relativePath}`);
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        !ts.isIdentifier(declaration.name) ||
        declaration.name.text !== constName
      )
        continue;
      if (
        declaration.initializer === undefined ||
        !ts.isArrayLiteralExpression(declaration.initializer)
      )
        fail(`proteus_shared_definition_array_missing:${constName}`);
      return declaration.initializer.elements.map((element, index) =>
        literalAstValue(element, `${constName}[${index}]`),
      );
    }
  }
  fail(`proteus_shared_definition_const_missing:${constName}`);
}

function literalAstValue(node, pathLabel) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(node.operand)
  )
    return -Number(node.operand.text);
  if (ts.isArrayLiteralExpression(node))
    return node.elements.map((entry, index) =>
      literalAstValue(entry, `${pathLabel}[${index}]`),
    );
  if (ts.isObjectLiteralExpression(node)) {
    const result = {};
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property))
        fail(`proteus_shared_definition_nonliteral_property:${pathLabel}`);
      const name = property.name;
      const key =
        ts.isIdentifier(name) || ts.isStringLiteral(name)
          ? name.text
          : fail(`proteus_shared_definition_property_name:${pathLabel}`);
      if (Object.hasOwn(result, key))
        fail(
          `proteus_shared_definition_duplicate_property:${pathLabel}.${key}`,
        );
      result[key] = literalAstValue(
        property.initializer,
        `${pathLabel}.${key}`,
      );
    }
    return result;
  }
  fail(`proteus_shared_definition_nonliteral_value:${pathLabel}`);
}

function translateSharedPrintedSubroutine(
  cardDefinitionId,
  subroutine,
  relativeIceCapabilityKey,
) {
  const type = requiredString(
    subroutine.type,
    `${cardDefinitionId}.sharedSubroutine.type`,
  );
  if (type === "end_the_run")
    return { kind: "end_the_run", text: "*End the run." };
  if (type === "do_damage") {
    if (
      subroutine.amount !== 0 ||
      (subroutine.damageType !== "net" && subroutine.damageType !== "core") ||
      relativeIceCapabilityKey === undefined
    )
      fail(`proteus_shared_dynamic_damage_shape:${cardDefinitionId}`);
    return {
      kind: "damage",
      damageType: subroutine.damageType === "core" ? "brain" : "net",
      amount: {
        kind: "derived",
        source: "relative_ice_dynamic_damage",
        ownerCapabilityKey: relativeIceCapabilityKey,
      },
      preventable: true,
      text: "*Do dynamic damage.",
    };
  }
  if (type === "initiate_trace") {
    const success = requiredRecord(
      subroutine.traceSuccessEffect,
      `${cardDefinitionId}.sharedSubroutine.traceSuccessEffect`,
    );
    if (
      subroutine.baseTraceStrength !== 0 ||
      subroutine.traceBidLimit !== 0 ||
      success.type !== "end_run_and_run_lock" ||
      success.amount !== 2
    )
      fail(`proteus_shared_homing_trace_shape:${cardDefinitionId}`);
    return {
      kind: "trace",
      traceLimit: 0,
      onSuccess: [
        { kind: "end_run", visibility: "public" },
        {
          kind: "runner_run_lock_until_action_paid",
          amount: 2,
          visibility: "public",
        },
      ],
      text: "*Trace X. If successful, end the run and apply the printed run lock.",
    };
  }
  fail(
    `proteus_shared_subroutine_type_unsupported:${cardDefinitionId}:${type}`,
  );
}

function reconcileSharedSubroutineReferences(
  implementation,
  sharedSubroutines,
) {
  const relativeIce = implementation.relativeIce;
  const dynamicDamageSubroutine = relativeIce?.dynamicDamageSubroutine;
  if (dynamicDamageSubroutine === undefined) return implementation;
  const sourceIndex = sharedSubroutines.findIndex(
    (subroutine) => subroutine.id === dynamicDamageSubroutine.subroutineId,
  );
  if (sourceIndex < 0)
    fail(
      `proteus_relative_ice_shared_subroutine_missing:${implementation.cardDefinitionId}:${dynamicDamageSubroutine.subroutineId}`,
    );
  const canonicalSubroutineKey = requiredProteusCapabilityKey(
    implementation.cardDefinitionId,
    "printedSubroutines",
    sourceIndex,
  );
  const ownerCapabilityKey = requiredProteusCapabilityKey(
    implementation.cardDefinitionId,
    "relativeIce",
    0,
  );
  const canonicalTarget = implementation.printedSubroutines?.[sourceIndex];
  if (
    canonicalTarget?.kind !== "damage" ||
    canonicalTarget.amount?.kind !== "derived" ||
    canonicalTarget.amount.source !== "relative_ice_dynamic_damage" ||
    canonicalTarget.amount.ownerCapabilityKey !== ownerCapabilityKey
  )
    fail(
      `proteus_relative_ice_dynamic_damage_target_mismatch:${implementation.cardDefinitionId}`,
    );
  const { subroutineId: _legacySubroutineId, ...dynamicDamage } =
    dynamicDamageSubroutine;
  return {
    ...implementation,
    relativeIce: {
      ...relativeIce,
      dynamicDamageSubroutine: {
        ...dynamicDamage,
        subroutineCapabilityKey: canonicalSubroutineKey,
      },
    },
  };
}

function assertClosedImplementationImports(relativePath) {
  const text = sourceText(relativePath);
  const sourceFile = ts.createSourceFile(
    relativePath,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  if (sourceFile.parseDiagnostics.length > 0)
    fail(`proteus_legacy_parse_error:${relativePath}`);
  const helperImports = [];
  let typeImportCount = 0;
  for (const node of sourceFile.statements) {
    if (!ts.isImportDeclaration(node)) continue;
    const source = node.moduleSpecifier.text;
    const clause = node.importClause;
    if (clause?.isTypeOnly) {
      if (source !== "../../../types")
        fail(`proteus_unexpected_type_import:${relativePath}:${source}`);
      const names = namedImportNames(clause);
      if (names.length !== 1 || names[0] !== "CardImplementationDefinition")
        fail(`proteus_unexpected_type_import_names:${relativePath}`);
      typeImportCount += 1;
      continue;
    }
    if (clause === undefined)
      fail(`proteus_side_effect_import_forbidden:${relativePath}:${source}`);
    for (const name of namedImportNames(clause)) helperImports.push(name);
    const disposition = PROTEUS_HELPER_MODULE_DISPOSITIONS[relativePath];
    if (disposition === undefined || source !== disposition.source)
      fail(`proteus_helper_import_source_unreviewed:${relativePath}:${source}`);
  }
  if (typeImportCount !== 1)
    fail(
      `proteus_type_import_count_mismatch:${relativePath}:${typeImportCount}`,
    );
  const actual = [...helperImports].sort();
  const expected = [
    ...(PROTEUS_HELPER_MODULE_DISPOSITIONS[relativePath]?.helpers ?? []),
  ].sort();
  if (actual.join("\n") !== expected.join("\n"))
    fail(`proteus_helper_import_disposition_mismatch:${relativePath}`);
  return actual;
}

function namedImportNames(clause) {
  if (clause.name !== undefined) fail("proteus_default_import_forbidden");
  const bindings = clause.namedBindings;
  if (bindings === undefined || !ts.isNamedImports(bindings))
    fail("proteus_namespace_import_forbidden");
  return bindings.elements.map((element) => element.name.text).sort();
}

function addressableNodesFor(implementation) {
  const nodes = [];
  for (const family of [...PROTEUS_ADDRESSABLE_FAMILIES].sort()) {
    const value = implementation[family];
    if (value === undefined) continue;
    const entries = Array.isArray(value) ? value : [value];
    entries.forEach((entry, index) =>
      nodes.push({
        family,
        sourceIndex: index,
        sourceFingerprint: sha256(JSON.stringify(entry)),
      }),
    );
  }
  return nodes;
}

function requiredProteusCapabilityKey(cardDefinitionId, family, sourceIndex) {
  const key =
    PROTEUS_CAPABILITY_KEYS[cardDefinitionId]?.[family]?.[sourceIndex];
  if (key === undefined)
    fail(
      `proteus_capability_key_disposition_missing:${cardDefinitionId}:${family}:${sourceIndex}`,
    );
  return key;
}

function assertExactCapabilityDisposition(mechanics, addressableNodes) {
  const actualSlots = new Set(
    mechanics.flatMap((entry) =>
      entry.addressableNodes.map(
        (node) =>
          `${entry.cardDefinitionId}:${node.family}:${node.sourceIndex}`,
      ),
    ),
  );
  const dispositionSlots = [];
  for (const [cardDefinitionId, families] of Object.entries(
    PROTEUS_CAPABILITY_KEYS,
  ))
    for (const [family, keys] of Object.entries(families))
      keys.forEach((key, sourceIndex) => {
        if (!/^[a-z][a-z0-9_]*$/.test(key))
          fail(
            `proteus_invalid_capability_key:${cardDefinitionId}:${family}:${key}`,
          );
        dispositionSlots.push(`${cardDefinitionId}:${family}:${sourceIndex}`);
      });
  if (
    dispositionSlots.length !== actualSlots.size ||
    new Set(dispositionSlots).size !== dispositionSlots.length ||
    dispositionSlots.some((slot) => !actualSlots.has(slot))
  )
    fail("proteus_capability_key_disposition_not_exact");
  const canonicalIds = addressableNodes.map(
    (node) => `${node.cardDefinitionId}:${node.capabilityKey}`,
  );
  if (new Set(canonicalIds).size !== canonicalIds.length)
    fail("proteus_duplicate_canonical_capability_id");
}

function hasProteusImplementationProjection(implementation) {
  return Object.entries(implementation).some(
    ([family, value]) =>
      family !== "cardDefinitionId" &&
      family !== "printedSubroutines" &&
      family !== "regionBaseline" &&
      value !== undefined &&
      (!Array.isArray(value) || value.length > 0),
  );
}

function assertProteusSubregistryBindings(implementations) {
  const subregistryText = descriptor.subregistryPaths
    .map((relativePath) => sourceText(relativePath))
    .join("\n");
  for (const entry of implementations) {
    const occurrences = subregistryText.split(entry.exportName).length - 1;
    if (occurrences !== 2)
      fail(
        `proteus_subregistry_binding_mismatch:${entry.exportName}:${occurrences}`,
      );
  }
}

function assertProteusCatalogGroups() {
  const catalog = sourceText(CATALOG_PATH);
  for (const exportName of PROTEUS_CATALOG_GROUP_EXPORTS) {
    const occurrences = catalog.split(exportName).length - 1;
    if (occurrences !== 2)
      fail(
        `proteus_catalog_group_binding_mismatch:${exportName}:${occurrences}`,
      );
  }
}

function assertKnownCoverageGap(proteusIds) {
  const locations = extractExportedConstObject(
    sourceText(COVERAGE_LOCATIONS_PATH),
    "IMPLEMENTED_CARD_LOCATION_BY_DEFINITION_ID",
    Object.freeze({}),
    fail,
  );
  const proteusLocations = Object.keys(locations).filter((cardId) =>
    proteusIds.has(cardId),
  );
  if (
    proteusLocations.length !== 94 ||
    Object.hasOwn(locations, "onr_proteus_002_charity-takeover")
  )
    fail("proteus_known_coverage_location_gap_changed");
}

function assertClosedProteusSources(proteusHints) {
  if (sha256(JSON.stringify(sourceCards)) !== PROTEUS_SOURCE_FINGERPRINTS.raw)
    fail("proteus_raw_slice_fingerprint_mismatch");
  if (
    sha256(JSON.stringify(sourceSupport)) !==
    PROTEUS_SOURCE_FINGERPRINTS.support
  )
    fail("proteus_support_slice_fingerprint_mismatch");
  if (
    sha256(JSON.stringify(proteusHints)) !== PROTEUS_SOURCE_FINGERPRINTS.hints
  )
    fail("proteus_hint_slice_fingerprint_mismatch");
  if (
    sha256(JSON.stringify(sourceSharedProteusCards)) !==
    PROTEUS_SOURCE_FINGERPRINTS.sharedProteusCards
  )
    fail("proteus_shared_definition_slice_fingerprint_mismatch");

  const rawById = new Map(sourceCards.map((card) => [card.cardId, card]));
  for (const card of sourceCards) {
    assertAllowedKeys(card, PROTEUS_RAW_FIELDS, `raw:${card.cardId}`);
    assertAllowedKeys(
      requiredRecord(card.numeric, `raw:${card.cardId}.numeric`),
      PROTEUS_RAW_NUMERIC_FIELDS,
      `raw:${card.cardId}.numeric`,
    );
    if (card.rarity !== null && card.rarity !== undefined)
      assertAllowedKeys(
        requiredRecord(card.rarity, `raw:${card.cardId}.rarity`),
        PROTEUS_RARITY_FIELDS,
        `raw:${card.cardId}.rarity`,
      );
    if (card.variableStrength !== undefined)
      assertAllowedKeys(
        requiredRecord(
          card.variableStrength,
          `raw:${card.cardId}.variableStrength`,
        ),
        new Set(["kind", "maximumStrength", "minimumStrength"]),
        `raw:${card.cardId}.variableStrength`,
      );
    if (card.playCost !== undefined) {
      assertAllowedKeys(
        requiredRecord(card.playCost, `raw:${card.cardId}.playCost`),
        new Set(["creditsPerX", "kind", "maximumX", "minimumX"]),
        `raw:${card.cardId}.playCost`,
      );
      if (card.playCost.maximumX !== undefined)
        assertAllowedKeys(
          requiredRecord(
            card.playCost.maximumX,
            `raw:${card.cardId}.playCost.maximumX`,
          ),
          new Set(["kind"]),
          `raw:${card.cardId}.playCost.maximumX`,
        );
    }
    if (card.markCounterDisplay !== undefined)
      assertAllowedKeys(
        requiredRecord(
          card.markCounterDisplay,
          `raw:${card.cardId}.markCounterDisplay`,
        ),
        new Set(["ariaLabelName", "id", "label"]),
        `raw:${card.cardId}.markCounterDisplay`,
      );
    assertStringArray(card.subtypes, `raw:${card.cardId}.subtypes`);
  }

  for (const support of sourceSupport) {
    assertAllowedKeys(
      support,
      PROTEUS_SUPPORT_FIELDS,
      `support:${support.cardId}`,
    );
    const statuses = requiredRecord(
      support.statuses,
      `support:${support.cardId}.statuses`,
    );
    assertAllowedKeys(
      statuses,
      PROTEUS_SUPPORT_STATUS_FIELDS,
      `support:${support.cardId}.statuses`,
    );
    for (const [key, value] of Object.entries(statuses))
      if (typeof value !== "boolean")
        fail(`proteus_invalid_support_status:${support.cardId}:${key}`);
    const references = requiredRecord(
      support.support,
      `support:${support.cardId}.support`,
    );
    assertAllowedKeys(
      references,
      PROTEUS_SUPPORT_REFERENCE_FIELDS,
      `support:${support.cardId}.support`,
    );
    assertStringArray(
      support.blockReasons,
      `support:${support.cardId}.blockReasons`,
    );
    assertStringArray(
      references.scenarioRefs,
      `support:${support.cardId}.support.scenarioRefs`,
    );
  }

  for (const hint of proteusHints) {
    assertAllowedKeys(hint, PROTEUS_HINT_FIELDS, `hint:${hint.cardId}`);
    const raw = rawById.get(hint.cardId);
    if (
      raw === undefined ||
      hint.side !== raw.side ||
      hint.cardType !== raw.type
    )
      fail(`proteus_hint_public_identity_mismatch:${hint.cardId}`);
    for (const field of [
      "roles",
      "planRoles",
      "strategicRole",
      "strategyAnchors",
      "lineSupport",
      "strategicExchangeKinds",
      "riskTags",
      "functionSignals",
      "tacticSignals",
      "actionTacticSignals",
      "requiredMechanics",
      "scenarioRefs",
      "manualNotes",
    ])
      assertStringArray(hint[field], `hint:${hint.cardId}.${field}`);
    if (hint.aiSupportStatus !== "ai_supported")
      fail(`proteus_unknown_ai_support_status:${hint.cardId}`);
    if (
      hint.hiddenInfoPolicy !== undefined &&
      typeof hint.hiddenInfoPolicy !== "string"
    )
      fail(`proteus_invalid_hidden_info_policy:${hint.cardId}`);
    if (hint.breakerProfile !== undefined) {
      const breaker = requiredRecord(
        hint.breakerProfile,
        `hint:${hint.cardId}.breakerProfile`,
      );
      assertAllowedKeys(
        breaker,
        PROTEUS_BREAKER_PROFILE_FIELDS,
        `hint:${hint.cardId}.breakerProfile`,
      );
      for (const field of ["coverage", "coverageCandidates", "sideEffects"])
        assertStringArray(
          breaker[field],
          `hint:${hint.cardId}.breakerProfile.${field}`,
        );
    }
    for (const [field, allowed] of [
      ["conditions", PROTEUS_CONDITION_FIELDS],
      ["effects", PROTEUS_EFFECT_FIELDS],
      ["strategySupportPairs", PROTEUS_STRATEGY_PAIR_FIELDS],
      ["actionStrategySupportPairs", PROTEUS_ACTION_STRATEGY_PAIR_FIELDS],
      ["targetProfiles", PROTEUS_TARGET_PROFILE_FIELDS],
      ["actionCapacityProfiles", PROTEUS_ACTION_CAPACITY_FIELDS],
    ])
      for (const [index, entry] of recordArray(
        hint[field],
        `hint:${hint.cardId}.${field}`,
      ).entries())
        assertAllowedKeys(
          entry,
          allowed,
          `hint:${hint.cardId}.${field}[${index}]`,
        );
    if (hint.quality !== undefined)
      assertAllowedKeys(
        requiredRecord(hint.quality, `hint:${hint.cardId}.quality`),
        PROTEUS_QUALITY_FIELDS,
        `hint:${hint.cardId}.quality`,
      );
    if (hint.valueHints !== undefined)
      assertAllowedKeys(
        requiredRecord(hint.valueHints, `hint:${hint.cardId}.valueHints`),
        PROTEUS_VALUE_HINT_FIELDS,
        `hint:${hint.cardId}.valueHints`,
      );
    if (hint.remoteRole !== undefined)
      assertAllowedKeys(
        requiredRecord(hint.remoteRole, `hint:${hint.cardId}.remoteRole`),
        PROTEUS_REMOTE_ROLE_FIELDS,
        `hint:${hint.cardId}.remoteRole`,
      );
  }
}

function assertAllowedKeys(value, allowed, pathLabel) {
  for (const key of Object.keys(value))
    if (!allowed.has(key))
      fail(`proteus_unknown_source_field:${pathLabel}:${key}`);
}

function requiredRecord(value, pathLabel) {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    fail(`proteus_invalid_record:${pathLabel}`);
  return value;
}

function recordArray(value, pathLabel) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) fail(`proteus_invalid_record_array:${pathLabel}`);
  return value.map((entry, index) =>
    requiredRecord(entry, `${pathLabel}[${index}]`),
  );
}

function assertStringArray(value, pathLabel) {
  if (value === undefined) return;
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== "string" || entry.length === 0)
  )
    fail(`proteus_invalid_string_array:${pathLabel}`);
}

const PROTEUS_HELPER_CALLS = Object.freeze({
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
  hiddenSuccessfulRunBeforeAccessEffect: ([input]) => ({
    kind: "successful_run_before_access_effect",
    abilityKey: input.abilityKey ?? "successful_run_before_access:0",
    timing: "immediately_after_successful_run_before_access",
    server: input.server,
    source: "installed_hidden_runner_resource",
    cost: { kind: "reveal_and_trash_source" },
    effect: input.effect,
    visibility: "hidden_info_barrier",
  }),
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
  searchStackInstallEffect: ([input]) => ({
    kind: "search_stack_install",
    filter: "program",
    installCost: input.installCost,
    shuffleAfterwards: true,
    visibility: "hidden_info_barrier",
  }),
});

async function verifyOrWrite(generated) {
  await verifyMigrationOutputs({
    mode,
    root,
    outputDirectory,
    generated,
    targetFor: (relativePath) =>
      relativePath === "@report"
        ? path.join(root, descriptor.reportTarget)
        : relativePath === "@set-spec"
          ? path.join(root, descriptor.setSpecTarget)
          : path.join(outputDirectory, relativePath),
    writeDirectories: [path.dirname(path.join(root, descriptor.reportTarget))],
    driftCode: "proteus_card_spec_migration_drift",
    fail,
  });
}

function assertUniqueIds(entries, field, label) {
  const ids = entries.map((entry) => entry[field]);
  if (
    ids.some((id) => typeof id !== "string" || id.length === 0) ||
    new Set(ids).size !== ids.length
  )
    fail(`proteus_duplicate_or_missing_id:${label}`);
}

function gitList(relativePath) {
  return execFileSync(
    "git",
    ["ls-tree", "-r", "--name-only", SOURCE_COMMIT, "--", relativePath],
    { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  )
    .split(/\r?\n/u)
    .filter(Boolean)
    .sort();
}

function gitShow(relativePath) {
  return execFileSync("git", ["show", `${SOURCE_COMMIT}:${relativePath}`], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

function fail(message) {
  throw new Error(message);
}

await runProteusInventoryMigration();
