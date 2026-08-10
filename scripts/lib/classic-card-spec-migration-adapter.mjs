import { execFileSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { format } from "prettier";
import {
  assertDerivedCounts,
  expression,
  extractSingleExportedConstObject,
  parseSetMigrationInvocation,
  renderValue,
  sha256,
  verifyMigrationOutputs,
} from "./card-spec-migration-core.mjs";

const root = process.cwd();
const CLASSIC_IMPLEMENTATION_PATHS = Object.freeze([
  "packages/engine/src/card-implementations/classic/corp/agendas/data-fort-remapping.ts",
  "packages/engine/src/card-implementations/classic/corp/agendas/superserum.ts",
  "packages/engine/src/card-implementations/classic/corp/agendas/theorem-proof.ts",
  "packages/engine/src/card-implementations/classic/corp/agendas/unlisted-research-lab.ts",
  "packages/engine/src/card-implementations/classic/corp/assets/indiscriminate-response-team.ts",
  "packages/engine/src/card-implementations/classic/corp/assets/protected-resources.ts",
  "packages/engine/src/card-implementations/classic/corp/assets/satellite-monitors.ts",
  "packages/engine/src/card-implementations/classic/corp/assets/strategic-planning-group.ts",
  "packages/engine/src/card-implementations/classic/corp/ice/baskerville.ts",
  "packages/engine/src/card-implementations/classic/corp/ice/bolter-swarm.ts",
  "packages/engine/src/card-implementations/classic/corp/ice/brain-drain.ts",
  "packages/engine/src/card-implementations/classic/corp/ice/deadeye.ts",
  "packages/engine/src/card-implementations/classic/corp/ice/dumpster.ts",
  "packages/engine/src/card-implementations/classic/corp/ice/entrapment.ts",
  "packages/engine/src/card-implementations/classic/corp/ice/glacier.ts",
  "packages/engine/src/card-implementations/classic/corp/ice/imperial-guard.ts",
  "packages/engine/src/card-implementations/classic/corp/ice/puzzle.ts",
  "packages/engine/src/card-implementations/classic/corp/ice/trapdoor.ts",
  "packages/engine/src/card-implementations/classic/corp/ice/vortex.ts",
  "packages/engine/src/card-implementations/classic/corp/operations/badtimes.ts",
  "packages/engine/src/card-implementations/classic/corp/operations/corporate-shuffle.ts",
  "packages/engine/src/card-implementations/classic/corp/operations/reclamation-project.ts",
  "packages/engine/src/card-implementations/classic/corp/upgrades/london-city-grid.ts",
  "packages/engine/src/card-implementations/classic/corp/upgrades/self-destruct.ts",
  "packages/engine/src/card-implementations/classic/corp/upgrades/shock-treatment.ts",
  "packages/engine/src/card-implementations/classic/corp/upgrades/sterdroid.ts",
  "packages/engine/src/card-implementations/classic/corp/upgrades/street-enforcer.ts",
  "packages/engine/src/card-implementations/classic/runner/events/boostergang-connections.ts",
  "packages/engine/src/card-implementations/classic/runner/events/corruption.ts",
  "packages/engine/src/card-implementations/classic/runner/events/do-the-drine.ts",
  "packages/engine/src/card-implementations/classic/runner/events/finders-keepers.ts",
  "packages/engine/src/card-implementations/classic/runner/events/gypsytm-schedule-analyzer.ts",
  "packages/engine/src/card-implementations/classic/runner/events/library-search.ts",
  "packages/engine/src/card-implementations/classic/runner/events/meat-upgrade.ts",
  "packages/engine/src/card-implementations/classic/runner/events/networking.ts",
  "packages/engine/src/card-implementations/classic/runner/events/panzer-run.ts",
  "packages/engine/src/card-implementations/classic/runner/events/running-interference.ts",
  "packages/engine/src/card-implementations/classic/runner/hardware/little-black-box.ts",
  "packages/engine/src/card-implementations/classic/runner/hardware/omnitech-spinal-tap-cybermodem.ts",
  "packages/engine/src/card-implementations/classic/runner/hardware/omnitech-wet-drive.ts",
  "packages/engine/src/card-implementations/classic/runner/hardware/vintage-camaro.ts",
  "packages/engine/src/card-implementations/classic/runner/hardware/zetatech-portastation.ts",
  "packages/engine/src/card-implementations/classic/runner/programs/early-worm.ts",
  "packages/engine/src/card-implementations/classic/runner/programs/matador.ts",
  "packages/engine/src/card-implementations/classic/runner/programs/ms-todon.ts",
  "packages/engine/src/card-implementations/classic/runner/programs/psychic-friend.ts",
  "packages/engine/src/card-implementations/classic/runner/programs/rent-i-con.ts",
  "packages/engine/src/card-implementations/classic/runner/programs/schematics-search-engine.ts",
  "packages/engine/src/card-implementations/classic/runner/programs/superglue.ts",
  "packages/engine/src/card-implementations/classic/runner/resources/crash-space.ts",
  "packages/engine/src/card-implementations/classic/runner/resources/elena-laskova.ts",
  "packages/engine/src/card-implementations/classic/runner/resources/executive-file-clerk.ts",
  "packages/engine/src/card-implementations/classic/runner/resources/phone-freak.ts",
  "packages/engine/src/card-implementations/classic/runner/resources/sandbox-dig.ts",
]);
const CLASSIC_SUBREGISTRY_PATHS = Object.freeze([
  "packages/engine/src/card-implementations/subregistries/classic-corp-agenda-implementations.ts",
  "packages/engine/src/card-implementations/subregistries/classic-corp-asset-implementations.ts",
  "packages/engine/src/card-implementations/subregistries/classic-corp-ice-implementations.ts",
  "packages/engine/src/card-implementations/subregistries/classic-corp-operation-implementations.ts",
  "packages/engine/src/card-implementations/subregistries/classic-corp-upgrade-implementations.ts",
  "packages/engine/src/card-implementations/subregistries/classic-runner-event-implementations.ts",
  "packages/engine/src/card-implementations/subregistries/classic-runner-hardware-implementations.ts",
  "packages/engine/src/card-implementations/subregistries/classic-runner-program-implementations.ts",
  "packages/engine/src/card-implementations/subregistries/classic-runner-resource-implementations.ts",
]);

const descriptor = Object.freeze({
  sourceCommit: "a7f1409871e19d898deafa0d0c9aa6ca5118051f",
  setId: "classic",
  setName: "Classic",
  setCode: "classic",
  outputDirectory: "packages/cards/src/specs/classic",
  setSpecTarget: "packages/cards/src/sets/classic.set-spec.ts",
  reportTarget: "docs/reviews/cards/classic-card-spec-migration-report.json",
  expected: Object.freeze({
    rawCards: 54,
    supportEntries: 54,
    legacyHints: 54,
    legacyImplementationModules: 54,
    legacyImplementationSubregistries: 9,
    runtimeDefinitions: 54,
    projectedImplementations: 50,
    targetDefinitionOnlyRuntime: 4,
    catalogOnly: 0,
    legacyImplementationBacked: 54,
    addressableNodes: 70,
  }),
  implementationPaths: CLASSIC_IMPLEMENTATION_PATHS,
  subregistryPaths: CLASSIC_SUBREGISTRY_PATHS,
  sourcePaths: Object.freeze([
    "data/cards/classic-cards.json",
    "data/manifests/classic-card-support.json",
    "data/ai/ai-card-hints-active.json",
    "packages/engine/src/card-implementations/helpers.ts",
    "packages/engine/src/card-implementations/subregistries/card-implementation-catalog.ts",
    ...CLASSIC_IMPLEMENTATION_PATHS,
    ...CLASSIC_SUBREGISTRY_PATHS,
  ]),
});
const { mode } = parseSetMigrationInvocation(process.argv, {
  classic: descriptor,
});
const SOURCE_COMMIT = descriptor.sourceCommit;
const outputDirectory = path.join(root, descriptor.outputDirectory);
const SOURCE_PATHS = descriptor.sourcePaths;
const sourceTextByPath = new Map(
  SOURCE_PATHS.map((relativePath) => [relativePath, gitShow(relativePath)]),
);
const sourceText = (relativePath) => {
  const value = sourceTextByPath.get(relativePath);
  if (value === undefined)
    fail(`card_spec_migration_source_missing:${relativePath}`);
  return value;
};
const sourceCards = JSON.parse(sourceText(SOURCE_PATHS[0])).cards;
const sourceSupport = JSON.parse(sourceText(SOURCE_PATHS[1])).cards;
const sourceHints = JSON.parse(sourceText(SOURCE_PATHS[2])).cards;

const CLASSIC_RAW_FIELDS = new Set([
  "cardId",
  "collectorNumber",
  "displayOnlyText",
  "faction",
  "numeric",
  "rarity",
  "setId",
  "setName",
  "side",
  "subtypes",
  "text",
  "title",
  "type",
]);
const CLASSIC_RAW_NUMERIC_FIELDS = new Set([
  "advancementRequirement",
  "agendaPoints",
  "cost",
  "installCost",
  "memoryCost",
  "rezCost",
  "strength",
  "trashCost",
]);
const CLASSIC_RARITY_FIELDS = new Set([
  "code",
  "labelDe",
  "labelEn",
  "sourceId",
  "sourceValue",
]);
const CLASSIC_SUPPORT_FIELDS = new Set([
  "blockReasons",
  "cardId",
  "setId",
  "statuses",
  "support",
]);
const CLASSIC_SUPPORT_STATUS_FIELDS = new Set([
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
const CLASSIC_SUPPORT_REFERENCE_FIELDS = new Set([
  "aiHintRef",
  "coverage",
  "resolverRef",
  "scenarioRefs",
]);
const CLASSIC_HINT_FIELDS = new Set([
  "actionCapacityProfiles",
  "actionStrategySupportPairs",
  "actionTacticSignals",
  "aiSupportStatus",
  "breakerProfile",
  "cardId",
  "cardType",
  "conditions",
  "costProfile",
  "effects",
  "functionSignals",
  "lineSupport",
  "manualNotes",
  "planRoles",
  "quality",
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
const CLASSIC_BREAKER_PROFILE_FIELDS = new Set([
  "baseStrength",
  "breakCost",
  "coverage",
  "emergencyCoverage",
  "maxSubroutinesPerBreak",
  "pumpCost",
  "pumpStrengthAmount",
  "restrictions",
  "sideEffects",
]);
const CLASSIC_CONDITION_FIELDS = new Set(["kind"]);
const CLASSIC_EFFECT_FIELDS = new Set([
  "amount",
  "finite",
  "kind",
  "repeatable",
  "resource",
  "scope",
  "target",
  "timing",
]);
const CLASSIC_COST_PROFILE_FIELDS = new Set([
  "agendaPoints",
  "clicks",
  "counters",
  "credits",
  "memory",
  "opportunityCost",
  "reserveRisk",
]);
const CLASSIC_QUALITY_FIELDS = new Set([
  "benchmarkCovered",
  "confidence",
  "hintReviewed",
  "needsHumanReview",
  "reviewedBy",
  "reviewedDate",
  "strategyCovered",
]);
const CLASSIC_STRATEGY_PAIR_FIELDS = new Set([
  "confidence",
  "evidence",
  "rationale",
  "role",
  "roleDetail",
  "strategyId",
]);
const CLASSIC_ACTION_STRATEGY_PAIR_FIELDS = new Set([
  "confidence",
  "evidence",
  "role",
  "strategyId",
]);
const CLASSIC_TARGET_PROFILE_FIELDS = new Set([
  "avoid",
  "hiddenInfoPolicy",
  "kind",
  "preferences",
  "purpose",
  "schemaVersion",
  "targetType",
  "timing",
]);
const CLASSIC_ACTION_CAPACITY_FIELDS = new Set([
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
const CLASSIC_VALUE_HINT_FIELDS = new Set([
  "damage",
  "economy",
  "remoteRootValue",
]);
const CLASSIC_SOURCE_SLICE_FINGERPRINTS = Object.freeze({
  raw: "sha256:c64e5939f01297f81833574403e9c215e160a198b03d9856e1ba6f2234f6bd30",
  support:
    "sha256:038d53e3b889fdc9674a5f1f978f38cc484586ec6cae5a83fb07ae9b3246031c",
  hints:
    "sha256:506be8f64ea38d47cc98c464565af862595e0dc826c873bfe053f4705e9c2fe0",
});

async function runClassicInventoryMigration() {
  const classicIds = new Set(sourceCards.map((card) => card.cardId));
  const classicHints = sourceHints.filter((hint) =>
    classicIds.has(hint.cardId),
  );
  assertClosedClassicSources(classicHints);
  const implementations = descriptor.implementationPaths.map((relativePath) => {
    const parsed = extractSingleExportedConstObject(
      sourceText(relativePath),
      CLASSIC_HELPER_CALLS,
      fail,
    );
    return {
      relativePath,
      exportName: parsed.exportName,
      implementation: parsed.value,
    };
  });
  assertUniqueIds(sourceCards, "cardId", "classic_raw");
  assertUniqueIds(sourceSupport, "cardId", "classic_support");
  assertUniqueIds(classicHints, "cardId", "classic_hint");
  assertUniqueIds(
    implementations.map((entry) => entry.implementation),
    "cardDefinitionId",
    "classic_implementation",
  );
  const exactIds = [...classicIds].sort().join("\n");
  for (const [label, ids] of [
    ["support", sourceSupport.map((entry) => entry.cardId)],
    ["hint", classicHints.map((entry) => entry.cardId)],
    [
      "implementation",
      implementations.map((entry) => entry.implementation.cardDefinitionId),
    ],
  ])
    if ([...ids].sort().join("\n") !== exactIds)
      fail(`classic_source_id_partition_mismatch:${label}`);
  if (
    sourceCards.some((card) => card.setId !== "classic") ||
    sourceSupport.some((entry) => entry.setId !== "classic")
  )
    fail("classic_source_set_mismatch");

  assertClassicSubregistryBindings(implementations);
  const mechanics = implementations.map((entry) => {
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
      families,
      addressableNodes,
      sourceFingerprint: sha256(sourceText(entry.relativePath)),
      implementationFingerprint: sha256(JSON.stringify(entry.implementation)),
    };
  });
  const familyCounts = {};
  for (const entry of mechanics)
    for (const family of entry.families)
      familyCounts[family] = (familyCounts[family] ?? 0) + 1;
  const addressableNodes = mechanics.flatMap((entry) =>
    entry.addressableNodes.map((node) => ({
      cardDefinitionId: entry.cardDefinitionId,
      ...node,
      capabilityKey: requiredClassicCapabilityKey(
        entry.cardDefinitionId,
        node.family,
        node.sourceIndex,
      ),
      addressability: ["plan", "action", "quote", "debug"],
      disposition: "explicit_reviewed_semantic_capability_key",
    })),
  );
  const canonicalCapabilityIds = addressableNodes.map(
    (node) => `${node.cardDefinitionId}:${node.capabilityKey}`,
  );
  if (new Set(canonicalCapabilityIds).size !== canonicalCapabilityIds.length)
    fail("classic_duplicate_canonical_capability_id");
  const implementationsById = new Map(
    implementations.map((entry) => [
      entry.implementation.cardDefinitionId,
      entry.implementation,
    ]),
  );
  const hintsById = new Map(classicHints.map((entry) => [entry.cardId, entry]));
  const migratedCards = [...sourceCards]
    .sort(compareByCardId)
    .map((sourceCard) =>
      migrateClassicCard(
        sourceCard,
        implementationsById.get(sourceCard.cardId),
        hintsById.get(sourceCard.cardId),
      ),
    );
  const projectedImplementations = implementations.filter((entry) =>
    hasClassicImplementationProjection(entry.implementation),
  ).length;
  const targetDefinitionOnlyRuntime =
    implementations.length - projectedImplementations;
  assertDerivedCounts(
    {
      rawCards: sourceCards.length,
      supportEntries: sourceSupport.length,
      legacyHints: classicHints.length,
      legacyImplementationModules: implementations.length,
      legacyImplementationSubregistries: descriptor.subregistryPaths.length,
      runtimeDefinitions: sourceCards.length,
      projectedImplementations,
      targetDefinitionOnlyRuntime,
      catalogOnly: 0,
      legacyImplementationBacked: implementations.length,
      addressableNodes: addressableNodes.length,
    },
    descriptor.expected,
    fail,
  );
  const outputs = new Map();
  for (const spec of migratedCards)
    outputs.set(
      `${spec.__migrationEvidence.cardDefinitionId}.card-spec.ts`,
      await format(renderCardSpec(spec), { parser: "typescript" }),
    );
  outputs.set(
    "@set-spec",
    await format(
      `import type { SetSpec } from "../contracts";\n\nexport const setSpec = {\n  schemaVersion: "set-spec-v1",\n  setId: "classic",\n  name: "Classic",\n  code: "classic",\n  sortOrder: 30,\n  publication: { status: "active" },\n} satisfies SetSpec;\n`,
      { parser: "typescript" },
    ),
  );
  const report = {
    schemaVersion: "card-spec-migration-report-v1",
    setId: descriptor.setId,
    sourceCommit: SOURCE_COMMIT,
    sourceInputs: SOURCE_PATHS.map((relativePath) => ({
      relativePath,
      fingerprint: sha256(sourceText(relativePath)),
    })),
    counts: {
      rawCards: sourceCards.length,
      supportEntries: sourceSupport.length,
      legacyHints: classicHints.length,
      legacyImplementationModules: implementations.length,
      legacyImplementationSubregistries: descriptor.subregistryPaths.length,
      runtimeDefinitions: sourceCards.length,
      projectedImplementations,
      targetDefinitionOnlyRuntime,
      catalogOnly: 0,
      legacyImplementationBacked: implementations.length,
      addressableNodes: addressableNodes.length,
    },
    familyCounts,
    dispositions: {
      implementationSource: "closed_literal_ast_plus_reviewed_helper_expansion",
      sourceAuthorship:
        "54_legacy_implementation_backed_distinct_from_target_projection",
      printedOnlyRuntime:
        "resolved_definition_subroutines_without_empty_implementation",
      regionBaseline:
        "discard_redundant_authoring_marker_use_region_subtype_and_modifier",
      capabilityIdentity:
        "exact70_explicit_reviewed_semantic_keys_bound_before_generation",
      textAndIds: "never_parsed_for_mechanical_semantics",
      sourceSchemas:
        "closed_raw_support_hint_shapes_plus_exact_pinned_slice_fingerprints",
      publicIdentity:
        "cardId_side_cardType_from_raw_public_identity_not_planning",
      mechanicalHintFields:
        "effects_conditions_functionSignals_breakerProfile_requiredMechanics_actionCapacityProfiles_and_mechanical_role_risk_tactic_cost_target_value_parts_derived_from_engine",
      planningHintFields:
        "strategyAnchors_lineSupport_strategicRole_strategySupportPairs_actionStrategySupportPairs_strategicExchangeKinds_and_reviewed_plan_tactic_target_value_risk_interpretations_typed",
      planningTacticSplit:
        "closed_known_planning_tactic_map_mechanical_effect_timing_scope_and_capability_tokens_discarded_for_engine_derivation",
      targetProfileSplit:
        "dumpster_fixed_archives_redirect_discarded_because_no_target_choice_exists",
      evidenceHintFields:
        "aiSupportStatus_quality_scenarioRefs_bound_as_coverage_evidence_not_runtime_planning",
      editorHintFields: "manualNotes_explicitly_discarded_editor_only",
    },
    cards: mechanics.map((entry) => ({
      ...entry,
      rawCard: sourceCards.find(
        (card) => card.cardId === entry.cardDefinitionId,
      ),
      legacyImplementation: implementationsById.get(entry.cardDefinitionId),
      legacyHintFingerprint: sha256(
        JSON.stringify(hintsById.get(entry.cardDefinitionId)),
      ),
      outputFingerprint: sha256(
        outputs.get(`${entry.cardDefinitionId}.card-spec.ts`),
      ),
    })),
    addressableNodes,
    aggregateOutputFingerprint: sha256(
      [...outputs]
        .map(([relativePath, content]) => `${relativePath}\n${content}`)
        .join("\n"),
    ),
  };
  outputs.set("@report", `${JSON.stringify(report, null, 2)}\n`);
  await verifyOrWrite(outputs);
  console.log(
    `classic_card_spec_inventory_${mode}_ok cards=${sourceCards.length} implementations=${implementations.length} families=${Object.keys(familyCounts).length} addressable=${addressableNodes.length} source=${SOURCE_COMMIT}`,
  );
}

function migrateClassicCard(sourceCard, implementation, hint) {
  if (implementation === undefined)
    fail(`classic_implementation_missing:${sourceCard.cardId}`);
  if (hint === undefined) fail(`classic_hint_missing:${sourceCard.cardId}`);
  const engine = {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: classicCharacteristics(sourceCard),
    ...classicMechanicalFamilies(implementation),
  };
  const capabilityText = capabilityTextFor(implementation);
  const planningAnnotations = classicPlanningAnnotations(
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
      rulesText: sourceCard.text,
      ...(capabilityText.length === 0 ? {} : { capabilityText }),
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
        setId: "classic",
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

function classicCharacteristics(sourceCard) {
  const numeric = sourceCard.numeric;
  if (numeric === null || typeof numeric !== "object")
    fail(`classic_numeric_missing:${sourceCard.cardId}`);
  const playCost =
    sourceCard.type === "event" || sourceCard.type === "operation"
      ? {
          kind: "fixed",
          credits: requiredNumber(numeric.cost, `${sourceCard.cardId}.cost`),
        }
      : null;
  return {
    faction: sourceCard.faction,
    subtypes: [...(sourceCard.subtypes ?? [])],
    numeric: {
      installCost: nullableNumber(
        numeric.installCost,
        "installCost",
        sourceCard,
      ),
      memoryCost: nullableNumber(numeric.memoryCost, "memoryCost", sourceCard),
      rezCost: nullableNumber(numeric.rezCost, "rezCost", sourceCard),
      trashCost: nullableNumber(numeric.trashCost, "trashCost", sourceCard),
      advancementRequirement: nullableNumber(
        numeric.advancementRequirement,
        "advancementRequirement",
        sourceCard,
      ),
      agendaPoints: nullableNumber(
        numeric.agendaPoints,
        "agendaPoints",
        sourceCard,
      ),
    },
    playCost,
    strength:
      numeric.strength === null
        ? { kind: "not_applicable" }
        : {
            kind: "fixed",
            value: requiredNumber(
              numeric.strength,
              `${sourceCard.cardId}.strength`,
            ),
          },
  };
}

function classicMechanicalFamilies(implementation) {
  const result = {};
  for (const [family, value] of Object.entries(implementation)) {
    if (family === "cardDefinitionId") continue;
    if (family === "regionBaseline") continue;
    if (CLASSIC_ADDRESSABLE_FAMILIES.has(family)) {
      const entries = Array.isArray(value) ? value : [value];
      const migrated = entries.map((entry, sourceIndex) => ({
        capabilityKey: expression(
          `capabilityKey(${JSON.stringify(
            requiredClassicCapabilityKey(
              implementation.cardDefinitionId,
              family,
              sourceIndex,
            ),
          )})`,
        ),
        addressability: ["plan", "action", "quote", "debug"],
        ...mechanicsOnly(entry),
      }));
      result[family] = Array.isArray(value) ? migrated : migrated[0];
      continue;
    }
    result[family] = mechanicsOnly(value);
  }
  return result;
}

function mechanicsOnly(value) {
  if (Array.isArray(value)) return value.map(mechanicsOnly);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "label" && key !== "text")
      .map(([key, entry]) => [key, mechanicsOnly(entry)]),
  );
}

function capabilityTextFor(implementation) {
  const result = [];
  for (const family of CLASSIC_ADDRESSABLE_FAMILIES) {
    const value = implementation[family];
    if (value === undefined) continue;
    const entries = Array.isArray(value) ? value : [value];
    entries.forEach((entry, sourceIndex) => {
      if (typeof entry.label !== "string") return;
      result.push({
        capabilityKey: expression(
          `capabilityKey(${JSON.stringify(
            requiredClassicCapabilityKey(
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

const CLASSIC_ACTION_STRATEGY_CAPABILITIES = Object.freeze({
  onr_classic_005_baskerville: ["subroutine_trace_baskerville_counter"],
  onr_classic_016_badtimes: ["reduce_tagged_runner_memory_until_end_turn"],
  "onr_classic_021_satellite-monitors": ["start_turn_tag_roll_per_runner_run"],
  "onr_classic_023_shock-treatment": [
    "tagged_access_trash_hardware_and_programs",
  ],
  "onr_classic_026_street-enforcer": ["run_start_tax_runner_tags"],
  "onr_classic_029_ms-todon": ["break_sentry_with_tag_stealth_tradeoff"],
  onr_classic_035_corruption: ["transfer_agenda_points_for_credits_and_tag"],
  "onr_classic_039_library-search": ["run_rd_or_hq_with_access_bonus"],
  "onr_classic_044_crash-space": ["trace_auto_success_add_tag"],
});

const CLASSIC_MECHANICALLY_DERIVED_PLAN_ROLES = new Set([
  "break_ice",
  "draw",
  "increase_link",
  "recover_from_tags",
  "runner_install_hardware",
  "score_agenda",
]);
const CLASSIC_PLANNING_TACTIC_INTERPRETATIONS = Object.freeze({
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

const CLASSIC_TARGET_PROFILE_DISPOSITIONS = Object.freeze({
  onr_classic_009_dumpster: Object.freeze({
    purpose: "redirect_run_to_archives_outermost_rezzed_ice",
  }),
});

function classicPlanningAnnotations(cardDefinitionId, hint) {
  const card = [];
  for (const role of stringValues(
    hint.planRoles,
    `${cardDefinitionId}.planRoles`,
  ))
    if (!CLASSIC_MECHANICALLY_DERIVED_PLAN_ROLES.has(role))
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
    const interpretation = CLASSIC_PLANNING_TACTIC_INTERPRETATIONS[token];
    if (interpretation === undefined) continue;
    planningTactics.set(
      `${interpretation.signal}:${interpretation.use}`,
      interpretation,
    );
  }
  for (const interpretation of planningTactics.values())
    card.push({ kind: "tactic_interpretation", ...interpretation });
  const targetProfiles = objectValues(
    hint.targetProfiles,
    `${cardDefinitionId}.targetProfiles`,
  );
  const targetProfileDisposition =
    CLASSIC_TARGET_PROFILE_DISPOSITIONS[cardDefinitionId];
  if (targetProfileDisposition !== undefined) {
    if (
      targetProfiles.length !== 1 ||
      targetProfiles[0]?.purpose !== targetProfileDisposition.purpose
    )
      fail(`classic_target_profile_disposition_drift:${cardDefinitionId}`);
  }
  for (const target of targetProfileDisposition === undefined
    ? targetProfiles
    : [])
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
      fail(`classic_unknown_value_axis:${cardDefinitionId}:${axis}`);
    card.push({
      kind: "value_interpretation",
      axis: axis === "remoteRootValue" ? "remote_root_value" : "economy",
      rating: numericRating(value, `${cardDefinitionId}.${axis}`),
      rationale: `Migrated from reviewed Classic hint ${cardDefinitionId}.`,
    });
  }
  const costProfile = hint.costProfile ?? {};
  for (const [field, risk] of [
    ["opportunityCost", "opportunity_cost"],
    ["reserveRisk", "reserve_risk"],
  ]) {
    const severity = costProfile[field];
    if (severity === undefined) continue;
    if (severity !== "low" && severity !== "medium" && severity !== "high")
      fail(
        `classic_unknown_cost_risk:${cardDefinitionId}:${field}:${severity}`,
      );
    card.push({
      kind: "risk_interpretation",
      risk,
      severity,
      rationale: `Migrated from reviewed Classic hint ${cardDefinitionId}.`,
    });
  }
  if (hint.riskTags?.includes("flatline_risk"))
    card.push({
      kind: "risk_interpretation",
      risk: "flatline_risk",
      severity: "high",
      rationale: `Migrated from reviewed Classic hint ${cardDefinitionId}.`,
    });

  const actionPairs = objectValues(
    hint.actionStrategySupportPairs,
    `${cardDefinitionId}.actionStrategySupportPairs`,
  );
  const keys = CLASSIC_ACTION_STRATEGY_CAPABILITIES[cardDefinitionId] ?? [];
  if ((actionPairs.length === 0) !== (keys.length === 0) || keys.length > 1)
    fail(
      `classic_action_strategy_capability_mismatch:${cardDefinitionId}:${actionPairs.length}:${keys.length}`,
    );
  const capabilities =
    actionPairs.length === 0
      ? []
      : [
          {
            capabilityKey: expression(
              `capabilityKey(${JSON.stringify(keys[0])})`,
            ),
            annotations: actionPairs.map((pair) =>
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
    fail(`classic_action_strategy_evidence_shape:${cardDefinitionId}`);
  const evidenceAnchor = evidence[0].replace(/^tactic_signal_anchor:/, "");
  if (
    evidenceAnchor === evidence[0] ||
    ![
      "access.hq_multiaccess",
      "access.rnd_multiaccess",
      "tag.payoff",
      "tag.source",
      "trace.source",
    ].includes(evidenceAnchor)
  )
    fail(`classic_action_strategy_evidence_ontology:${cardDefinitionId}`);
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

function strategySupportAnnotation(pair, cardDefinitionId) {
  return {
    kind: "strategy_support",
    strategyKey: requiredString(
      pair.strategyId,
      `${cardDefinitionId}.strategyId`,
    ),
    role: requiredString(pair.role, `${cardDefinitionId}.role`),
    roleDetail:
      pair.roleDetail === undefined
        ? requiredString(pair.role, `${cardDefinitionId}.role`)
        : requiredString(pair.roleDetail, `${cardDefinitionId}.roleDetail`),
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
    fail(`classic_unknown_confidence:${cardDefinitionId}:${value}`);
  return value;
}

function numericRating(value, pathLabel) {
  if (value === 1) return "low";
  if (value === 2) return "medium";
  if (value === 3) return "high";
  if (value === 4) return "very_high";
  if (value === 5) return "critical";
  fail(`classic_unknown_rating:${pathLabel}:${value}`);
}

function stringValues(value, pathLabel) {
  if (value === undefined) return [];
  const entries = Array.isArray(value) ? value : [value];
  if (entries.some((entry) => typeof entry !== "string" || entry.length === 0))
    fail(`classic_invalid_string_values:${pathLabel}`);
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
    fail(`classic_invalid_object_values:${pathLabel}`);
  return entries;
}

function renderCardSpec(specWithEvidence) {
  const { __migrationEvidence: _evidence, ...spec } = specWithEvidence;
  const usesCapabilityKey = JSON.stringify(spec).includes("capabilityKey(");
  const imports = usesCapabilityKey
    ? "capabilityKey, cardDefinitionId, type CardSpec"
    : "cardDefinitionId, type CardSpec";
  return `import { ${imports} } from "../..";\n\nexport const cardSpec = ${renderValue(spec)} satisfies CardSpec;\n`;
}

function nullableNumber(value, field, sourceCard) {
  if (value === null) return null;
  return requiredNumber(value, `${sourceCard.cardId}.${field}`);
}

function requiredNumber(value, pathLabel) {
  if (typeof value !== "number" || !Number.isFinite(value))
    fail(`classic_number_missing:${pathLabel}`);
  return value;
}

function requiredString(value, pathLabel) {
  if (typeof value !== "string" || value.length === 0)
    fail(`classic_string_missing:${pathLabel}`);
  return value;
}

function compareByCardId(left, right) {
  return left.cardId < right.cardId ? -1 : left.cardId > right.cardId ? 1 : 0;
}

function hasClassicImplementationProjection(implementation) {
  return Object.entries(implementation).some(
    ([family, value]) =>
      family !== "cardDefinitionId" &&
      family !== "printedSubroutines" &&
      family !== "regionBaseline" &&
      value !== undefined &&
      (!Array.isArray(value) || value.length > 0),
  );
}

const CLASSIC_ADDRESSABLE_FAMILIES = new Set([
  "abilities",
  "accessEffects",
  "agendaAccessReplacement",
  "corpUtility",
  "damagePreventionSources",
  "fortRunWindows",
  "icebreakerAbilities",
  "printedSubroutines",
  "runnerCounterEffects",
  "runnerEventLongtail",
  "runnerUtilityLongtail",
  "scoredAgenda",
  "successfulRunFollowups",
  "tagPreventionSources",
]);

const CLASSIC_CAPABILITY_KEYS = Object.freeze({
  "onr_classic_001_data-fort-remapping": {
    scoredAgenda: ["on_score_add_remap_counter"],
    abilities: ["spend_remap_counter_end_run"],
  },
  onr_classic_002_superserum: {
    scoredAgenda: ["on_score_purge_virus_and_prevent_next"],
  },
  "onr_classic_003_unlisted-research-lab": {
    scoredAgenda: ["on_score_start_turn_extra_draw"],
  },
  "onr_classic_004_theorem-proof": {
    agendaAccessReplacement: ["access_install_as_runner_program"],
    abilities: ["score_source_as_agenda"],
  },
  onr_classic_005_baskerville: {
    printedSubroutines: [
      "subroutine_net_damage_2",
      "subroutine_trace_baskerville_counter",
      "subroutine_end_run",
    ],
    runnerCounterEffects: ["baskerville_counter_run_start_damage"],
  },
  "onr_classic_006_bolter-swarm": {
    printedSubroutines: [
      "subroutine_net_damage_4",
      "subroutine_prohibit_break_next_ice",
    ],
  },
  "onr_classic_007_brain-drain": {
    printedSubroutines: ["subroutine_random_brain_damage"],
  },
  onr_classic_008_deadeye: {
    printedSubroutines: ["subroutine_trash_program", "subroutine_end_run"],
  },
  onr_classic_009_dumpster: {
    printedSubroutines: ["subroutine_deflect_to_archives"],
  },
  onr_classic_010_entrapment: {
    printedSubroutines: ["subroutine_paid_deflect_to_data_fort"],
  },
  onr_classic_011_glacier: {
    printedSubroutines: ["subroutine_end_run_a", "subroutine_end_run_b"],
    fortRunWindows: ["start_run_move_to_other_fort"],
  },
  "onr_classic_012_imperial-guard": {
    printedSubroutines: ["subroutine_trash_program", "subroutine_end_run"],
  },
  onr_classic_013_puzzle: {
    printedSubroutines: [
      "subroutine_end_run_trash_source_a",
      "subroutine_end_run_trash_source_b",
    ],
  },
  onr_classic_014_trapdoor: {
    printedSubroutines: ["subroutine_deflect_to_subsidiary_fort"],
  },
  onr_classic_015_vortex: {
    printedSubroutines: ["subroutine_paid_deflect_to_data_fort"],
  },
  onr_classic_016_badtimes: {
    corpUtility: ["reduce_tagged_runner_memory_until_end_turn"],
  },
  "onr_classic_017_corporate-shuffle": {
    corpUtility: ["draw_five_then_shuffle_hq_card"],
  },
  "onr_classic_018_reclamation-project": {
    corpUtility: ["return_archives_ice_to_hq"],
  },
  "onr_classic_019_indiscriminate-response-team": {
    successfulRunFollowups: ["successful_run_shuffle_grip_then_redraw"],
  },
  "onr_classic_021_satellite-monitors": {
    corpUtility: ["start_turn_tag_roll_per_runner_run"],
  },
  "onr_classic_022_self-destruct": {
    accessEffects: ["access_trash_server_and_damage_runner"],
  },
  "onr_classic_023_shock-treatment": {
    accessEffects: ["tagged_access_trash_hardware_and_programs"],
  },
  onr_classic_024_sterdroid: {
    abilities: [
      "corp_main_double_chosen_ice_strength",
      "during_run_double_chosen_ice_strength",
    ],
  },
  "onr_classic_025_strategic-planning-group": {
    corpUtility: ["start_turn_draw_extra_then_bottom_one"],
  },
  "onr_classic_026_street-enforcer": {
    corpUtility: ["run_start_tax_runner_tags"],
  },
  "onr_classic_027_early-worm": {
    icebreakerAbilities: ["break_wall_subroutine", "pump_strength_three"],
  },
  onr_classic_028_matador: {
    icebreakerAbilities: ["break_sentry_subroutine", "pump_strength_five"],
  },
  "onr_classic_029_ms-todon": {
    icebreakerAbilities: [
      "break_sentry_with_tag_stealth_tradeoff",
      "pump_strength_one",
    ],
  },
  "onr_classic_030_psychic-friend": {
    icebreakerAbilities: [
      "break_code_gate_subroutine",
      "pump_strength_for_turn",
    ],
  },
  "onr_classic_031_rent-i-con": {
    icebreakerAbilities: [
      "break_any_subroutine_and_trash_after_run",
      "pump_strength_one",
    ],
  },
  "onr_classic_032_schematics-search-engine": {
    runnerUtilityLongtail: ["hq_access_expose_installed_corp_cards"],
  },
  onr_classic_033_superglue: {
    runnerUtilityLongtail: ["derez_fully_broken_passed_ice"],
  },
  "onr_classic_034_boostergang-connections": {
    runnerEventLongtail: ["trash_grip_search_equal_count"],
  },
  onr_classic_035_corruption: {
    runnerEventLongtail: ["transfer_agenda_points_for_credits_and_tag"],
  },
  "onr_classic_036_do-the-drine": {
    runnerEventLongtail: ["take_core_damage_for_credits"],
  },
  "onr_classic_037_finders-keepers": {
    runnerEventLongtail: ["roll_three_dice_gain_credits"],
  },
  "onr_classic_038_gypsytm-schedule-analyzer": {
    abilities: ["on_play_run_rd_store_revealed_agenda"],
  },
  "onr_classic_039_library-search": {
    runnerEventLongtail: ["run_rd_or_hq_with_access_bonus"],
  },
  "onr_classic_040_meat-upgrade": {
    abilities: ["on_play_remove_tags_and_draw"],
  },
  onr_classic_041_networking: {
    abilities: ["on_play_gain_nine_credits"],
  },
  "onr_classic_042_panzer-run": {
    abilities: ["on_play_gain_credits_and_draw"],
  },
  "onr_classic_043_running-interference": {
    abilities: ["on_play_run_with_rez_surcharge"],
  },
  "onr_classic_044_crash-space": {
    abilities: ["trash_source_action"],
    runnerUtilityLongtail: ["trace_auto_success_add_tag"],
  },
  "onr_classic_045_elena-laskova": {
    runnerUtilityLongtail: ["first_prep_credit_gain_bonus"],
  },
  "onr_classic_046_executive-file-clerk": {
    abilities: ["trash_source_look_at_hq"],
  },
  "onr_classic_047_little-black-box": {
    damagePreventionSources: ["prevent_one_net_or_core_damage"],
  },
  "onr_classic_048_omnitech-spinal-tap-cybermodem": {
    runnerUtilityLongtail: ["start_turn_random_core_damage"],
  },
  "onr_classic_049_omnitech-wet-drive": {
    runnerUtilityLongtail: ["base_memory_equals_grip_count"],
  },
  "onr_classic_050_sandbox-dig": {
    abilities: ["trash_source_look_at_rd_top_three"],
  },
  "onr_classic_051_vintage-camaro": {
    tagPreventionSources: ["pay_and_forgo_action_avoid_tag"],
  },
  "onr_classic_053_protected-resources": {
    abilities: ["deposit_hosted_credits", "withdraw_hosted_credits"],
  },
});

function requiredClassicCapabilityKey(cardDefinitionId, family, sourceIndex) {
  const key =
    CLASSIC_CAPABILITY_KEYS[cardDefinitionId]?.[family]?.[sourceIndex];
  if (key === undefined)
    fail(
      `classic_capability_key_disposition_missing:${cardDefinitionId}:${family}:${sourceIndex}`,
    );
  return key;
}

function addressableNodesFor(implementation) {
  const nodes = [];
  for (const family of [...CLASSIC_ADDRESSABLE_FAMILIES].sort()) {
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

function assertClassicSubregistryBindings(implementations) {
  const subregistryText = descriptor.subregistryPaths
    .map((relativePath) => sourceText(relativePath))
    .join("\n");
  for (const entry of implementations) {
    const occurrences = subregistryText.split(entry.exportName).length - 1;
    if (occurrences !== 2)
      fail(
        `classic_subregistry_binding_mismatch:${entry.exportName}:${occurrences}`,
      );
  }
}

function assertClosedClassicSources(classicHints) {
  if (
    sha256(JSON.stringify(sourceCards)) !==
    CLASSIC_SOURCE_SLICE_FINGERPRINTS.raw
  )
    fail("classic_raw_slice_fingerprint_mismatch");
  if (
    sha256(JSON.stringify(sourceSupport)) !==
    CLASSIC_SOURCE_SLICE_FINGERPRINTS.support
  )
    fail("classic_support_slice_fingerprint_mismatch");
  if (
    sha256(JSON.stringify(classicHints)) !==
    CLASSIC_SOURCE_SLICE_FINGERPRINTS.hints
  )
    fail("classic_hint_slice_fingerprint_mismatch");

  const rawById = new Map(sourceCards.map((card) => [card.cardId, card]));
  for (const card of sourceCards) {
    assertAllowedKeys(card, CLASSIC_RAW_FIELDS, `raw:${card.cardId}`);
    assertAllowedKeys(
      requiredRecord(card.numeric, `raw:${card.cardId}.numeric`),
      CLASSIC_RAW_NUMERIC_FIELDS,
      `raw:${card.cardId}.numeric`,
    );
    if (card.rarity !== null && card.rarity !== undefined)
      assertAllowedKeys(
        requiredRecord(card.rarity, `raw:${card.cardId}.rarity`),
        CLASSIC_RARITY_FIELDS,
        `raw:${card.cardId}.rarity`,
      );
    assertStringArray(card.subtypes, `raw:${card.cardId}.subtypes`);
  }
  for (const support of sourceSupport) {
    assertAllowedKeys(
      support,
      CLASSIC_SUPPORT_FIELDS,
      `support:${support.cardId}`,
    );
    const statuses = requiredRecord(
      support.statuses,
      `support:${support.cardId}.statuses`,
    );
    assertAllowedKeys(
      statuses,
      CLASSIC_SUPPORT_STATUS_FIELDS,
      `support:${support.cardId}.statuses`,
    );
    for (const [key, value] of Object.entries(statuses))
      if (typeof value !== "boolean")
        fail(`classic_invalid_support_status:${support.cardId}:${key}`);
    assertAllowedKeys(
      requiredRecord(support.support, `support:${support.cardId}.support`),
      CLASSIC_SUPPORT_REFERENCE_FIELDS,
      `support:${support.cardId}.support`,
    );
    assertStringArray(
      support.blockReasons,
      `support:${support.cardId}.blockReasons`,
    );
    assertStringArray(
      support.support.scenarioRefs,
      `support:${support.cardId}.support.scenarioRefs`,
    );
  }
  for (const hint of classicHints) {
    assertAllowedKeys(hint, CLASSIC_HINT_FIELDS, `hint:${hint.cardId}`);
    const raw = rawById.get(hint.cardId);
    if (
      raw === undefined ||
      hint.side !== raw.side ||
      hint.cardType !== raw.type
    )
      fail(`classic_hint_public_identity_mismatch:${hint.cardId}`);
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
      fail(`classic_unknown_ai_support_status:${hint.cardId}`);
    if (hint.breakerProfile !== undefined) {
      assertAllowedKeys(
        requiredRecord(
          hint.breakerProfile,
          `hint:${hint.cardId}.breakerProfile`,
        ),
        CLASSIC_BREAKER_PROFILE_FIELDS,
        `hint:${hint.cardId}.breakerProfile`,
      );
      assertStringArray(
        hint.breakerProfile.coverage,
        `hint:${hint.cardId}.breakerProfile.coverage`,
      );
      assertStringArray(
        hint.breakerProfile.restrictions,
        `hint:${hint.cardId}.breakerProfile.restrictions`,
      );
      assertStringArray(
        hint.breakerProfile.sideEffects,
        `hint:${hint.cardId}.breakerProfile.sideEffects`,
      );
    }
    for (const [field, allowed] of [
      ["conditions", CLASSIC_CONDITION_FIELDS],
      ["effects", CLASSIC_EFFECT_FIELDS],
      ["strategySupportPairs", CLASSIC_STRATEGY_PAIR_FIELDS],
      ["actionStrategySupportPairs", CLASSIC_ACTION_STRATEGY_PAIR_FIELDS],
      ["targetProfiles", CLASSIC_TARGET_PROFILE_FIELDS],
      ["actionCapacityProfiles", CLASSIC_ACTION_CAPACITY_FIELDS],
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
    if (hint.costProfile !== undefined)
      assertAllowedKeys(
        requiredRecord(hint.costProfile, `hint:${hint.cardId}.costProfile`),
        CLASSIC_COST_PROFILE_FIELDS,
        `hint:${hint.cardId}.costProfile`,
      );
    if (hint.quality !== undefined)
      assertAllowedKeys(
        requiredRecord(hint.quality, `hint:${hint.cardId}.quality`),
        CLASSIC_QUALITY_FIELDS,
        `hint:${hint.cardId}.quality`,
      );
    if (hint.valueHints !== undefined)
      assertAllowedKeys(
        requiredRecord(hint.valueHints, `hint:${hint.cardId}.valueHints`),
        CLASSIC_VALUE_HINT_FIELDS,
        `hint:${hint.cardId}.valueHints`,
      );
  }
}

function assertAllowedKeys(value, allowed, pathLabel) {
  for (const key of Object.keys(value))
    if (!allowed.has(key))
      fail(`classic_unknown_source_field:${pathLabel}:${key}`);
}

function requiredRecord(value, pathLabel) {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    fail(`classic_invalid_record:${pathLabel}`);
  return value;
}

function recordArray(value, pathLabel) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) fail(`classic_invalid_record_array:${pathLabel}`);
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
    fail(`classic_invalid_string_array:${pathLabel}`);
}

const CLASSIC_HELPER_CALLS = Object.freeze({
  addHostedCredits: ([amount]) => ({
    kind: "add_hosted_credits",
    target: "source",
    amount,
    visibility: "public",
  }),
  agendaPointSelfRezCost: ([amount]) => [
    { kind: "agenda_point", amount, visibility: "public" },
  ],
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
  deflectRunSubroutine: ([input]) => ({
    kind: "deflect_run",
    target: input.target,
    ...(input.cost === undefined
      ? {}
      : { cost: { kind: "credit", amount: input.cost } }),
    ...(input.autoBreakIfNoTarget === undefined
      ? {}
      : { autoBreakIfNoTarget: input.autoBreakIfNoTarget }),
    text: input.text,
  }),
  endTheRunSubroutine: () => ({
    kind: "end_the_run",
    text: "*End the run.",
  }),
  endTheRunSubroutines: ([count]) =>
    Array.from({ length: count }, () => ({
      kind: "end_the_run",
      text: "*End the run.",
    })),
  netDamageSubroutine: ([amount]) => ({
    kind: "damage",
    damageType: "net",
    amount,
    preventable: true,
    text: `*Do ${amount} Net damage.`,
  }),
  noisyIcebreakerSelfRezReduction: ([amount]) => [
    {
      kind: "self_rez_cost_reduction_during_run_after_noisy_icebreaker",
      amount,
      visibility: "public",
    },
  ],
  restrictedHostedCreditSource: ([input]) => ({
    capacity: input.capacity,
    counterType: "bit",
    usableFor: input.usableFor,
    refresh: {
      timing: "start_of_runner_turn",
      mode: "refill_to_capacity_if_used",
    },
    ...(input.allowUseWhileOverwritingSource === undefined
      ? {}
      : { allowUseWhileOverwritingSource: true }),
    ...(input.requireHostedBreakerForIcebreakerUse === undefined
      ? {}
      : { requireHostedBreakerForIcebreakerUse: true }),
  }),
  trashProgramSubroutine: () => ({
    kind: "trash_program",
    text: "*Trash a program.",
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
    driftCode: "classic_card_spec_migration_drift",
    fail,
  });
}

function assertUniqueIds(entries, field, label) {
  const ids = entries.map((entry) => entry[field]);
  if (
    ids.some((id) => typeof id !== "string" || id.length === 0) ||
    new Set(ids).size !== ids.length
  )
    fail(`classic_duplicate_or_missing_id:${label}`);
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

await runClassicInventoryMigration();
