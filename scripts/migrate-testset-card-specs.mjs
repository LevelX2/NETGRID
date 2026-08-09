import { execFileSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { format } from "prettier";
import {
  assertAllowedKeys as assertAllowedKeysCore,
  assertDerivedCounts,
  expression as migrationExpression,
  extractArrayObjects as extractArrayObjectsCore,
  parseSetMigrationInvocation,
  renderValue as renderMigrationValue,
  sha256 as migrationSha256,
  verifyMigrationOutputs,
} from "./lib/card-spec-migration-core.mjs";

const SOURCE_COMMIT = "a771126723c80aa5d77d8a444e7d6489e52819b3";
const root = process.cwd();
const MIGRATION_DESCRIPTORS = Object.freeze({
  testset: Object.freeze({
    setId: "testset",
    setName: "NETGRID Testset",
    setCode: "testset",
    outputDirectory: "packages/cards/src/specs/testset",
    setSpecTarget: "packages/cards/src/sets/testset.set-spec.ts",
    reportTarget: "docs/reviews/cards/testset-card-spec-migration-report.json",
    expected: Object.freeze({
      rawCards: 38,
      supportEntries: 38,
      sharedDefinitions: 36,
      legacyHints: 36,
      runtimeDefinitions: 36,
      projectedImplementations: 20,
      targetDefinitionOnlyRuntime: 16,
      catalogOnly: 2,
      legacyImplementationModules: 2,
      legacyDefinitionOnlyRuntime: 34,
    }),
    sourcePaths: Object.freeze([
      "data/cards/testset-cards.json",
      "data/manifests/testset-card-support.json",
      "data/ai/ai-card-hints-active.json",
      "packages/shared/src/card-definitions.ts",
      "packages/engine/src/game/engine-runtime-internal/public-event-runtime-bootstrap.ts",
      "packages/engine/src/game/play/corp-operation-resolution.ts",
      "packages/engine/src/card-implementations/demo/corp/assets/simple-economy-asset.ts",
      "packages/engine/src/card-implementations/v08/corp/assets/cashout-asset.ts",
      "packages/engine/src/card-implementations/subregistries/card-implementation-catalog.ts",
      "packages/engine/src/game/install/install-card.ts",
      "packages/engine/src/game/abilities/runner-special-trigger-execution.ts",
      "packages/ai/src/simulation/remote-trash-role.ts",
    ]),
  }),
});
const { mode, descriptor } = parseSetMigrationInvocation(
  process.argv,
  MIGRATION_DESCRIPTORS,
);
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
const sourceDefinitions = extractArrayObjects(
  sourceText(SOURCE_PATHS[3]),
  "CARD_DEFINITIONS",
);
const testsetIds = new Set(sourceCards.map((card) => card.cardId));
const definitionsById = new Map(
  sourceDefinitions
    .filter((definition) => testsetIds.has(definition.id))
    .map((definition) => [definition.id, definition]),
);
const supportById = new Map(
  sourceSupport.map((entry) => [entry.cardId, entry]),
);
const hintsById = new Map(
  sourceHints
    .filter((hint) => testsetIds.has(hint.cardId))
    .map((hint) => [hint.cardId, hint]),
);

async function runMigration() {
  assertExactSourcePartition();
  assertClosedSourceShapes();
  assertReviewedRuntimeEvidence();

  const outputs = new Map();
  const migratedCards = [];
  for (const sourceCard of [...sourceCards].sort(compareByCardId)) {
    const definition = definitionsById.get(sourceCard.cardId);
    const support = supportById.get(sourceCard.cardId);
    const hint = hintsById.get(sourceCard.cardId);
    const spec = migrateCard(sourceCard, definition, support, hint);
    migratedCards.push(spec);
    outputs.set(
      `${sourceCard.cardId}.card-spec.ts`,
      await format(renderCardSpec(spec), { parser: "typescript" }),
    );
  }

  const setSpec = `import type { SetSpec } from "../contracts";\n\nexport const setSpec = {\n  schemaVersion: "set-spec-v1",\n  setId: ${quote(descriptor.setId)},\n  name: ${quote(descriptor.setName)},\n  code: ${quote(descriptor.setCode)},\n  sortOrder: 0,\n  publication: { status: "active" },\n} satisfies SetSpec;\n`;
  outputs.set("@set-spec", await format(setSpec, { parser: "typescript" }));
  outputs.set(
    "@report",
    `${JSON.stringify(migrationReport(migratedCards, outputs), null, 2)}\n`,
  );

  await verifyOrWrite(outputs);
  console.log(
    `testset_card_spec_migration_${mode}_ok cards=${sourceCards.length} definitions=${definitionsById.size} hints=${hintsById.size} source=${SOURCE_COMMIT}`,
  );
}

function migrateCard(sourceCard, definition, support, hint) {
  const catalogOnly = definition === undefined;
  if (catalogOnly !== (hint === undefined))
    fail(`testset_definition_hint_partition_mismatch:${sourceCard.cardId}`);
  assertLegacyCardParity(sourceCard, definition);
  const characteristics = characteristicsFor(sourceCard, definition);
  const engine = {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics,
    ...mechanicalFamiliesFor(definition),
  };
  const planningAnnotations = planningAnnotationsFor(
    hint,
    engine,
    sourceCard.type,
  );
  const publication = catalogOnly
    ? {
        schemaVersion: "card-publication-v1",
        status: "experimental",
        ...(sourceCard.cardId === "catalog_preview_resource_001"
          ? {
              catalogBlockReason:
                "Intentionally blocked catalog-only test fixture.",
            }
          : {}),
      }
    : { schemaVersion: "card-publication-v1", status: "active" };
  return {
    schemaVersion: "card-spec-v1",
    identity: {
      cardDefinitionId: expression(
        `cardDefinitionId(${quote(sourceCard.cardId)})`,
      ),
      title: sourceCard.title,
      side: sourceCard.side,
      cardType: sourceCard.type,
    },
    text: {
      schemaVersion: "canonical-card-text-v1",
      rulesText: definition?.rulesText ?? sourceCard.text,
      ...(sourceCard.flavorText === undefined
        ? {}
        : { flavorText: sourceCard.flavorText }),
    },
    rules: {
      schemaVersion: "card-rules-v1",
      references: [{ source: "card_text", reference: sourceCard.cardId }],
    },
    engine,
    ...(planningAnnotations === undefined ? {} : { planningAnnotations }),
    printings: [
      {
        schemaVersion: "printing-spec-v1",
        printingId: sourceCard.cardId,
        setId: "testset",
        collectorNumber: sourceCard.collectorNumber,
      },
    ],
    publication,
    __migrationEvidence: {
      implementationCoverage:
        sourceCard.cardId === "simple_economy_asset" ||
        sourceCard.cardId === "v08_cashout_asset"
          ? "implementation_backed_declarative"
          : catalogOnly
            ? "coverage_missing"
            : "definition_only_test_fixture",
      manifestStatuses: support.statuses,
    },
  };
}

function characteristicsFor(sourceCard, definition) {
  const rawNumeric = sourceCard.numeric ?? {};
  const fixed = (field) => {
    const definitionValue = definition?.[field];
    const rawValue = rawNumeric[field];
    if (
      definitionValue !== undefined &&
      rawValue !== undefined &&
      definitionValue !== rawValue
    )
      fail(
        `testset_raw_definition_numeric_mismatch:${sourceCard.cardId}:${field}`,
      );
    return definitionValue ?? rawValue ?? null;
  };
  const playCost =
    sourceCard.type === "event" || sourceCard.type === "operation"
      ? {
          kind: "fixed",
          credits: requiredNumber(
            definition?.cost ?? rawNumeric.cost,
            `${sourceCard.cardId}.playCost`,
          ),
        }
      : null;
  const strength =
    typeof definition?.strength === "number"
      ? { kind: "fixed", value: definition.strength }
      : { kind: "not_applicable" };
  const memoryDefaultIds = new Set([
    "simple_setup_hardware",
    "v08_memory_chip",
  ]);
  return {
    faction: sourceCard.faction,
    subtypes: definition?.subtypes ?? sourceCard.subtypes ?? [],
    numeric: {
      installCost:
        sourceCard.cardId === "catalog_preview_resource_001"
          ? requiredNumber(
              rawNumeric.cost,
              "catalog_preview_resource_001.installCost_reconciliation",
            )
          : fixed("installCost"),
      memoryCost: fixed("memoryCost"),
      rezCost: fixed("rezCost"),
      trashCost: fixed("trashCost"),
      advancementRequirement: fixed("advancementRequirement"),
      agendaPoints: fixed("agendaPoints"),
    },
    playCost,
    strength,
    ...(definition?.baseLink === undefined
      ? {}
      : { baseLink: definition.baseLink }),
    ...(definition?.memoryLimitBonus !== undefined
      ? { memoryLimitBonus: definition.memoryLimitBonus }
      : memoryDefaultIds.has(sourceCard.cardId)
        ? { memoryLimitBonus: 1 }
        : {}),
    ...(definition?.maxHandSizeBonus === undefined
      ? {}
      : { maxHandSizeBonus: definition.maxHandSizeBonus }),
    ...(definition?.recurringCredits === undefined
      ? {}
      : { recurringCredits: definition.recurringCredits }),
  };
}

function mechanicalFamiliesFor(definition) {
  if (definition === undefined) return {};
  const result = {};
  if (definition.subroutines?.length)
    result.printedSubroutines = definition.subroutines.map((subroutine) =>
      migrateSubroutine(subroutine),
    );
  if (definition.abilities?.length)
    result.icebreakerAbilities = definition.abilities.map((ability) =>
      migrateIcebreakerAbility(ability),
    );
  const onPlay = onPlayAbilityFor(definition.id);
  if (onPlay !== undefined) result.abilities = [onPlay];
  const rootRezCredits = rootRezCreditOutcomeFor(definition.id);
  if (rootRezCredits !== undefined)
    result.corpRootRezCreditOutcome = rootRezCredits;
  return result;
}

function migrateSubroutine(subroutine) {
  const common = {
    capabilityKey: expression(`capabilityKey(${quote(subroutine.id)})`),
    addressability: ["plan", "action", "quote", "debug"],
  };
  if (subroutine.type === "end_the_run")
    return { ...common, kind: "end_the_run" };
  if (subroutine.type === "corp_gain_credit")
    return {
      ...common,
      kind: "corp_gain_credit",
      amount: requiredNumber(subroutine.amount, subroutine.id),
    };
  if (subroutine.type === "runner_lose_credits")
    return {
      ...common,
      kind: "runner_lose_credits",
      amount: requiredNumber(subroutine.amount, subroutine.id),
    };
  if (subroutine.type === "give_runner_tag")
    return {
      ...common,
      kind: "give_runner_tag",
      amount: requiredNumber(subroutine.amount, subroutine.id),
    };
  fail(`testset_unknown_subroutine:${subroutine.id}:${subroutine.type}`);
}

function migrateIcebreakerAbility(ability) {
  const common = {
    capabilityKey: expression(`capabilityKey(${quote(ability.id)})`),
    addressability: ["plan", "action", "quote", "debug"],
  };
  if (ability.type === "pump_strength")
    return {
      ...common,
      kind: "increase_strength",
      cost: {
        kind: "credit",
        amount: requiredNumber(ability.cost?.credits, ability.id),
      },
      amount: requiredNumber(ability.amount, ability.id),
      duration: "current_encounter",
      visibility: "public",
    };
  if (ability.type === "break_subroutine")
    return {
      ...common,
      kind: "break_subroutine",
      cost: {
        kind: "credit",
        amount: requiredNumber(ability.cost?.credits, ability.id),
      },
      matches: { kind: "ice_subtype", subtype: ability.iceSubtype },
      visibility: "public",
    };
  fail(`testset_unknown_icebreaker_ability:${ability.id}:${ability.type}`);
}

function onPlayAbilityFor(definitionId) {
  const printed = {
    kind: "on_play",
    capabilityKey: expression(
      `capabilityKey(${quote(`${definitionId}_on_play`)})`,
    ),
    addressability: ["plan", "action", "quote", "debug"],
    costs: "printed",
  };
  const publicEffect = { visibility: "public" };
  const definitions = {
    simple_economy_event: {
      ...printed,
      effects: [
        {
          kind: "gain_credits",
          recipient: "runner",
          amount: 4,
          ...publicEffect,
        },
      ],
    },
    simple_draw_event: {
      ...printed,
      effects: [
        { kind: "draw_cards", recipient: "runner", amount: 2, ...publicEffect },
      ],
    },
    simple_run_event: {
      ...printed,
      effects: [
        {
          kind: "make_run",
          target: { kind: "chosen_server" },
          successfulRunRunnerCreditGain: 2,
          ...publicEffect,
        },
      ],
    },
    v08_burst_credit_event: {
      ...printed,
      effects: [
        {
          kind: "gain_credits",
          recipient: "runner",
          amount: 6,
          ...publicEffect,
        },
      ],
    },
    v08_deep_draw_event: {
      ...printed,
      effects: [
        { kind: "draw_cards", recipient: "runner", amount: 3, ...publicEffect },
      ],
    },
    v08_overclock_run_event: {
      ...printed,
      effects: [
        {
          kind: "make_run",
          target: { kind: "chosen_server" },
          successfulRunRunnerCreditGain: 3,
          ...publicEffect,
        },
      ],
    },
    simple_economy_operation: {
      ...printed,
      effects: [
        {
          kind: "gain_credits",
          recipient: "corp",
          amount: 4,
          ...publicEffect,
        },
      ],
    },
    simple_draw_operation: {
      ...printed,
      effects: [
        { kind: "draw_cards", recipient: "corp", amount: 2, ...publicEffect },
      ],
    },
    simple_tag_punishment_operation: {
      ...printed,
      condition: { kind: "runner_is_tagged" },
      effects: [
        {
          kind: "lose_credits",
          recipient: "runner",
          amount: 2,
          ...publicEffect,
        },
      ],
    },
    v08_credit_surge_operation: {
      ...printed,
      effects: [
        {
          kind: "gain_credits",
          recipient: "corp",
          amount: 7,
          ...publicEffect,
        },
      ],
    },
    v08_archive_planning_operation: {
      ...printed,
      effects: [
        { kind: "draw_cards", recipient: "corp", amount: 3, ...publicEffect },
      ],
    },
  };
  return definitions[definitionId];
}

function rootRezCreditOutcomeFor(definitionId) {
  const amount =
    definitionId === "simple_economy_asset"
      ? 3
      : definitionId === "v08_cashout_asset"
        ? 4
        : undefined;
  if (amount === undefined) return undefined;
  return {
    timing: "after_runner_rez_interrupt_window",
    effect: {
      kind: "gain_credits",
      recipient: "corp",
      amount,
      visibility: "public",
    },
  };
}

function planningAnnotationsFor(hint, engine, cardType) {
  if (hint === undefined) return undefined;
  const card = [];
  for (const role of hint.planRoles ?? [])
    card.push({ kind: "plan_role", role });
  if (hint.roles?.includes("setup")) {
    const reviewedDrawSetup = engine.abilities?.some((ability) =>
      ability.effects?.some((effect) => effect.kind === "draw_cards"),
    );
    if (
      !reviewedDrawSetup &&
      cardType !== "identity" &&
      cardType !== "hardware"
    )
      fail(`testset_unbound_setup_plan_role:${hint.cardId}`);
    if (reviewedDrawSetup) card.push({ kind: "plan_role", role: "setup" });
  }
  if (hint.roles?.includes("tempo")) {
    const reviewedTempo = engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) => effect.kind === "gain_credits" && effect.amount >= 6,
      ),
    );
    if (!reviewedTempo) fail(`testset_unbound_tempo_plan_role:${hint.cardId}`);
    card.push({ kind: "plan_role", role: "tempo" });
  }
  for (const role of hint.strategicRole ?? [])
    card.push({ kind: "strategic_role", role });
  for (const strategyKey of hint.strategyAnchors ?? [])
    card.push({ kind: "strategy_anchor", strategyKey });
  for (const lineKey of hint.lineSupport ?? [])
    card.push({ kind: "line_support", lineKey, support: "supports" });
  for (const [axis, value] of Object.entries(hint.valueHints ?? {})) {
    if (value !== 1 && value !== 2 && value !== 3)
      fail(`testset_unknown_value_hint:${hint.cardId}:${axis}:${value}`);
    card.push({
      kind: "value_interpretation",
      axis: axis === "remoteRootValue" ? "remote_root_value" : axis,
      rating: value === 1 ? "low" : value === 2 ? "medium" : "high",
      rationale: `Migrated from reviewed Testset hint ${hint.cardId}.`,
    });
  }
  const planningTactics = new Set([
    "draw.card",
    "economy.card",
    "punish.payoff",
    "tag.payoff",
  ]);
  const mechanicalActionSignals = new Set([
    "effect_scope:corp",
    "effect_scope:runner",
    "effect_timing:action",
    "effect_timing:on_rez",
    "effect:draw",
    "effect:economy",
    "effect:tag_punish_payoff",
  ]);
  for (const signal of hint.actionTacticSignals ?? []) {
    if (mechanicalActionSignals.has(signal)) continue;
    if (!planningTactics.has(signal))
      fail(`testset_unknown_planning_tactic:${hint.cardId}:${signal}`);
    card.push({
      kind: "tactic_interpretation",
      signal,
      use: signal,
    });
  }
  for (const pair of hint.actionStrategySupportPairs ?? [])
    card.push({
      kind: "strategy_support",
      strategyKey: pair.strategyId,
      role: pair.role,
      roleDetail: pair.roleDetail ?? pair.role,
      confidence: pair.confidence,
      ...(pair.rationale === undefined ? {} : { rationale: pair.rationale }),
    });
  return {
    schemaVersion: "card-planning-annotations-v1",
    card,
  };
}

const RECONCILED_SUBTYPE_ORDER_IDS = new Set([
  "efficient_fracter",
  "simple_decoder",
  "simple_fracter",
  "v08_precise_decoder",
  "v08_steady_fracter",
]);

const RAW_CARD_FIELDS = new Set([
  "cardId",
  "setId",
  "title",
  "side",
  "type",
  "subtypes",
  "numeric",
  "text",
  "displayOnlyText",
  "faction",
  "setName",
  "collectorNumber",
  "rarity",
]);
const RAW_NUMERIC_FIELDS = new Set([
  "cost",
  "installCost",
  "memoryCost",
  "strength",
  "rezCost",
  "trashCost",
  "advancementRequirement",
  "agendaPoints",
]);
const SUPPORT_FIELDS = new Set([
  "cardId",
  "setId",
  "statuses",
  "support",
  "blockReasons",
]);
const SUPPORT_STATUS_FIELDS = new Set([
  "imported",
  "validated",
  "catalog_ready",
  "implemented",
  "engine_supported",
  "playable",
  "human_playable",
  "ai_supported",
  "deck_legal",
  "format_legal",
  "blocked",
]);
const SUPPORT_REFERENCE_FIELDS = new Set([
  "resolverRef",
  "coverage",
  "aiHintRef",
  "scenarioRefs",
]);
const DEFINITION_FIELDS = new Set([
  "id",
  "title",
  "side",
  "type",
  "subtypes",
  "implementationStatus",
  "abilityEnabled",
  "cost",
  "playCost",
  "installCost",
  "memoryCost",
  "strength",
  "rezCost",
  "trashCost",
  "advancementRequirement",
  "agendaPoints",
  "baseLink",
  "memoryLimitBonus",
  "maxHandSizeBonus",
  "recurringCredits",
  "numeric",
  "strengthModel",
  "rulesText",
  "subroutines",
  "mechanics",
  "abilities",
  "markCounterDisplay",
]);
const HINT_FIELDS = new Set([
  "cardId",
  "side",
  "cardType",
  "roles",
  "planRoles",
  "strategicRole",
  "strategyAnchors",
  "lineSupport",
  "breakerProfile",
  "valueHints",
  "conditions",
  "effects",
  "riskTags",
  "functionSignals",
  "tacticSignals",
  "actionTacticSignals",
  "actionStrategySupportPairs",
  "requiredMechanics",
  "quality",
  "aiSupportStatus",
  "scenarioRefs",
  "manualNotes",
  "no_signal_reason",
]);
const KNOWN_DEFINITION_MECHANICS = new Set([
  "identity_setup",
  "install_remote",
  "advance",
  "score",
  "steal",
  "install_ice",
  "rez_ice",
  "encounter_ice",
  "end_the_run",
  "corp_gain_credit",
  "runner_lose_credits",
  "give_runner_tag",
  "install_program",
  "memory",
  "pump_breaker",
  "break_subroutine",
  "play_event",
  "play_operation",
  "gain_credits",
  "draw_cards",
  "start_run",
  "successful_run_bonus",
  "runner_is_tagged",
  "install_hardware",
  "modify_memory_limit",
  "rez_asset",
  "gain_credits_on_rez",
  "rez_upgrade",
  "trash_on_access",
  "v08_local_original",
]);
const KNOWN_PLAN_ROLES = new Set([
  "bait_runner",
  "build_rig",
  "build_scoring_remote",
  "draw_for_answers",
  "protect_hq",
  "protect_rnd",
  "punish_tagged_runner",
  "recover_economy",
  "score_next_turn",
  "setup",
  "tempo",
]);
const ICEBREAKER_ABILITY_FIELDS = new Set([
  "id",
  "type",
  "cost",
  "amount",
  "iceSubtype",
  "count",
  "timingPoint",
]);
const SUBROUTINE_FIELDS = new Set(["id", "type", "amount"]);
const BREAKER_PROFILE_FIELDS = new Set([
  "baseStrength",
  "breakCost",
  "coverage",
  "pumpCost",
]);
const CONDITION_FIELDS = new Set(["kind"]);
const EFFECT_FIELDS = new Set([
  "amount",
  "finite",
  "kind",
  "resource",
  "scope",
  "timing",
]);
const QUALITY_FIELDS = new Set([
  "benchmarkCovered",
  "confidence",
  "hintReviewed",
  "needsHumanReview",
  "reviewedBy",
  "reviewedDate",
  "strategyCovered",
]);
const KNOWN_HINT_ROLES = new Set([
  "agenda_2pt",
  "agenda_3pt",
  "asset_trash_target",
  "barrier_ice",
  "breaker_decoder",
  "breaker_fracter",
  "breaker_killer",
  "code_gate_ice",
  "corp_identity",
  "draw",
  "draw_operation",
  "economy",
  "economy_asset",
  "economy_operation",
  "efficient_breaker",
  "etr_ice",
  "event",
  "memory",
  "no_ability_agenda",
  "remote_support",
  "run_pressure",
  "runner_identity",
  "score_plan",
  "sentry_ice",
  "setup",
  "tag_ice",
  "tag_punishment",
  "taxing_ice",
  "tempo",
  "testset_baseline_agenda",
  "upgrade",
]);
const KNOWN_RISK_TAGS = new Set([
  "encounter",
  "hidden_ice",
  "hidden_root",
  "hidden_until_score_or_access",
  "hidden_zone_change",
  "install_runner",
  "public_play",
  "run",
  "tag",
]);
const KNOWN_FUNCTION_SIGNALS = new Set([
  "breaker.code_gate",
  "breaker.sentry",
  "breaker.wall",
  "corp_ice.end_run",
  "corp_ice.tag_source",
  "draw.corp_draw",
  "economy.corp_credit_burst",
  "economy.generic",
  "risk.requires_tagged_runner",
  "tag.payoff",
  "tax.runner_credit",
]);
const KNOWN_TACTIC_SIGNALS = new Set([
  "corp_ice.end_run",
  "corp_ice.tag_source",
  "draw.corp_draw",
  "economy.corp_credit_burst",
  "economy.runner_credit_loss",
  "risk.requires_tagged_runner",
  "tag.payoff",
  "tag.source",
  "tax.runner_credit",
]);
const KNOWN_REQUIRED_MECHANICS = new Set([
  "advance",
  "advancement_requirement",
  "agenda_points",
  "encounter_ice",
  "end_the_run",
  "give_runner_tag",
  "identity_setup",
  "install_hardware",
  "install_ice",
  "install_program",
  "install_remote",
  "memory",
  "play_event",
  "play_operation",
  "rez_card",
  "rez_ice",
  "score",
  "steal",
  "subtype_barrier",
  "subtype_code_gate",
  "subtype_decoder",
  "subtype_fracter",
  "subtype_icebreaker",
  "subtype_killer",
  "subtype_sentry",
  "trash_cost",
  "trash_on_access",
]);
const KNOWN_SCENARIO_REFS = new Set([
  "data/scenarios/ai-corp-tag-approval-slice-smokes.json#no_tag_punishment_without_runner_tag",
  "data/scenarios/ai-corp-tag-approval-slice-smokes.json#tag_ice_pressure",
  "data/scenarios/card-support-ai-supported-current.json#active_card_support_ai_supported",
  "packages/ai/src/index.test.ts::V1.4.0 plan-based Corp AI",
  "packages/ai/src/index.test.ts::V1.4.1 plan-based Runner AI",
]);

function assertClosedSourceShapes() {
  for (const card of sourceCards) {
    assertAllowedKeys(card, RAW_CARD_FIELDS, `raw:${card.cardId}`);
    assertAllowedKeys(
      card.numeric ?? {},
      RAW_NUMERIC_FIELDS,
      `raw:${card.cardId}.numeric`,
    );
  }
  for (const support of sourceSupport) {
    assertAllowedKeys(support, SUPPORT_FIELDS, `support:${support.cardId}`);
    assertAllowedKeys(
      support.statuses,
      SUPPORT_STATUS_FIELDS,
      `support:${support.cardId}.statuses`,
    );
    assertAllowedKeys(
      support.support,
      SUPPORT_REFERENCE_FIELDS,
      `support:${support.cardId}.support`,
    );
  }
  for (const definition of definitionsById.values()) {
    assertAllowedKeys(
      definition,
      DEFINITION_FIELDS,
      `definition:${definition.id}`,
    );
    for (const token of definition.mechanics ?? [])
      if (!KNOWN_DEFINITION_MECHANICS.has(token))
        fail(`testset_unknown_definition_mechanic:${definition.id}:${token}`);
    for (const subroutine of definition.subroutines ?? []) {
      assertAllowedKeys(
        subroutine,
        SUBROUTINE_FIELDS,
        `definition:${definition.id}.subroutine:${subroutine.id}`,
      );
      if (subroutine.type !== "end_the_run")
        requiredNumber(subroutine.amount, `${definition.id}.${subroutine.id}`);
    }
    for (const ability of definition.abilities ?? []) {
      assertAllowedKeys(
        ability,
        ICEBREAKER_ABILITY_FIELDS,
        `definition:${definition.id}.ability:${ability.id}`,
      );
      assertAllowedKeys(
        ability.cost,
        new Set(["credits"]),
        `definition:${definition.id}.ability:${ability.id}.cost`,
      );
      requiredNumber(
        ability.cost.credits,
        `${definition.id}.${ability.id}.cost.credits`,
      );
      if (ability.timingPoint !== "run.encounter_ice")
        fail(
          `testset_unknown_icebreaker_timing:${definition.id}:${ability.id}`,
        );
      if (ability.type === "pump_strength") {
        requiredNumber(ability.amount, `${definition.id}.${ability.id}.amount`);
        if (ability.count !== undefined || ability.iceSubtype !== undefined)
          fail(`testset_invalid_pump_shape:${definition.id}:${ability.id}`);
      } else if (ability.type === "break_subroutine") {
        if (
          ability.count !== 1 ||
          !["barrier", "code_gate", "sentry"].includes(ability.iceSubtype)
        )
          fail(`testset_invalid_break_shape:${definition.id}:${ability.id}`);
        if (ability.amount !== undefined)
          fail(`testset_invalid_break_amount:${definition.id}:${ability.id}`);
      } else
        fail(
          `testset_unknown_icebreaker_ability:${definition.id}:${ability.id}`,
        );
    }
  }
  for (const hint of hintsById.values()) {
    assertAllowedKeys(hint, HINT_FIELDS, `hint:${hint.cardId}`);
    for (const role of hint.planRoles ?? [])
      if (!KNOWN_PLAN_ROLES.has(role))
        fail(`testset_unknown_plan_role:${hint.cardId}:${role}`);
    assertKnownStringArray(
      hint.roles,
      KNOWN_HINT_ROLES,
      `hint:${hint.cardId}.roles`,
    );
    assertKnownStringArray(
      hint.riskTags,
      KNOWN_RISK_TAGS,
      `hint:${hint.cardId}.riskTags`,
    );
    assertKnownStringArray(
      hint.functionSignals ?? [],
      KNOWN_FUNCTION_SIGNALS,
      `hint:${hint.cardId}.functionSignals`,
    );
    assertKnownStringArray(
      hint.tacticSignals ?? [],
      KNOWN_TACTIC_SIGNALS,
      `hint:${hint.cardId}.tacticSignals`,
    );
    assertKnownStringArray(
      hint.requiredMechanics,
      KNOWN_REQUIRED_MECHANICS,
      `hint:${hint.cardId}.requiredMechanics`,
    );
    assertKnownStringArray(
      hint.scenarioRefs,
      KNOWN_SCENARIO_REFS,
      `hint:${hint.cardId}.scenarioRefs`,
    );
    if (hint.breakerProfile !== undefined) {
      assertAllowedKeys(
        hint.breakerProfile,
        BREAKER_PROFILE_FIELDS,
        `hint:${hint.cardId}.breakerProfile`,
      );
      for (const field of ["baseStrength", "breakCost", "pumpCost"])
        requiredNumber(
          hint.breakerProfile[field],
          `hint:${hint.cardId}.breakerProfile.${field}`,
        );
      assertKnownStringArray(
        hint.breakerProfile.coverage,
        new Set(["wall", "code_gate", "sentry"]),
        `hint:${hint.cardId}.breakerProfile.coverage`,
      );
    }
    for (const condition of hint.conditions ?? []) {
      assertAllowedKeys(
        condition,
        CONDITION_FIELDS,
        `hint:${hint.cardId}.condition`,
      );
      if (condition.kind !== "requires_runner_tagged")
        fail(`testset_unknown_hint_condition:${hint.cardId}:${condition.kind}`);
    }
    for (const effect of hint.effects ?? []) {
      assertAllowedKeys(effect, EFFECT_FIELDS, `hint:${hint.cardId}.effect`);
      if (!["draw", "economy", "tag_punish_payoff"].includes(effect.kind))
        fail(`testset_unknown_hint_effect:${hint.cardId}:${effect.kind}`);
      if (!["corp", "runner"].includes(effect.scope))
        fail(
          `testset_unknown_hint_effect_scope:${hint.cardId}:${effect.scope}`,
        );
      if (!["action", "on_rez"].includes(effect.timing))
        fail(
          `testset_unknown_hint_effect_timing:${hint.cardId}:${effect.timing}`,
        );
      if (effect.amount !== undefined)
        requiredNumber(effect.amount, `hint:${hint.cardId}.effect.amount`);
      if (effect.finite !== undefined && effect.finite !== true)
        fail(`testset_unknown_hint_effect_finite:${hint.cardId}`);
      if (
        effect.resource !== undefined &&
        !["cards", "credits"].includes(effect.resource)
      )
        fail(`testset_unknown_hint_effect_resource:${hint.cardId}`);
    }
    assertAllowedKeys(
      hint.quality,
      QUALITY_FIELDS,
      `hint:${hint.cardId}.quality`,
    );
    if (
      hint.quality.benchmarkCovered !== true ||
      hint.quality.hintReviewed !== true ||
      hint.quality.needsHumanReview !== false ||
      typeof hint.quality.strategyCovered !== "boolean" ||
      !["low", "medium", "high"].includes(hint.quality.confidence) ||
      typeof hint.quality.reviewedBy !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(hint.quality.reviewedDate)
    )
      fail(`testset_unknown_hint_quality:${hint.cardId}`);
    if (hint.aiSupportStatus !== "ai_supported")
      fail(`testset_unknown_ai_support_status:${hint.cardId}`);
    if (
      hint.manualNotes !== undefined &&
      (!Array.isArray(hint.manualNotes) ||
        hint.manualNotes.some((entry) => typeof entry !== "string"))
    )
      fail(`testset_invalid_manual_notes:${hint.cardId}`);
    if (
      hint.no_signal_reason !== undefined &&
      typeof hint.no_signal_reason !== "string"
    )
      fail(`testset_invalid_no_signal_reason:${hint.cardId}`);
    for (const role of hint.strategicRole ?? [])
      if (role !== "punish_payoff")
        fail(`testset_unknown_strategic_role:${hint.cardId}:${role}`);
    for (const key of hint.strategyAnchors ?? [])
      if (key !== "corp.tag_trace_punish")
        fail(`testset_unknown_strategy_anchor:${hint.cardId}:${key}`);
    for (const key of hint.lineSupport ?? [])
      if (key !== "corp.tag_trace_punish")
        fail(`testset_unknown_line_support:${hint.cardId}:${key}`);
    for (const axis of Object.keys(hint.valueHints ?? {}))
      if (axis !== "economy" && axis !== "remoteRootValue")
        fail(`testset_unknown_value_axis:${hint.cardId}:${axis}`);
    for (const pair of hint.actionStrategySupportPairs ?? []) {
      assertAllowedKeys(
        pair,
        new Set([
          "strategyId",
          "role",
          "roleDetail",
          "evidence",
          "confidence",
          "rationale",
        ]),
        `hint:${hint.cardId}.strategyPair`,
      );
      if (
        pair.strategyId !== "corp.tag_trace_punish" ||
        pair.role !== "payoff_anchor" ||
        pair.confidence !== "high" ||
        JSON.stringify(pair.evidence) !==
          JSON.stringify(["tactic_signal_anchor:tag.payoff"])
      )
        fail(`testset_unknown_strategy_pair:${hint.cardId}`);
    }
  }
}

function assertKnownStringArray(value, allowed, pathLabel) {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string"))
    fail(`testset_invalid_string_array:${pathLabel}`);
  for (const entry of value)
    if (!allowed.has(entry))
      fail(`testset_unknown_token:${pathLabel}:${entry}`);
}

const REVIEWED_RUNTIME_EVIDENCE = Object.freeze([
  ...[
    ["simple_economy_event", "runner_event_gain_credits_4"],
    ["simple_draw_event", "runner_event_draw_2"],
    ["simple_run_event", "runner_event_run_success_2"],
    ["v08_burst_credit_event", "runner_event_gain_credits_6"],
    ["v08_deep_draw_event", "runner_event_draw_3"],
    ["v08_overclock_run_event", "runner_event_run_success_3"],
  ].map(([cardDefinitionId, marker]) => ({
    cardDefinitionId,
    relativePath:
      "packages/engine/src/game/engine-runtime-internal/public-event-runtime-bootstrap.ts",
    locator: `${cardDefinitionId}: {`,
    marker,
    maxDistance: 100,
  })),
  ...[
    ["simple_economy_operation", "corp_operation_gain_credits_4"],
    ["simple_draw_operation", "corp_operation_draw_2"],
    ["simple_tag_punishment_operation", "corp_operation_tag_punishment_lose_2"],
    ["v08_credit_surge_operation", "corp_operation_gain_credits_7"],
    ["v08_archive_planning_operation", "corp_operation_draw_3"],
  ].map(([cardDefinitionId, marker]) => ({
    cardDefinitionId,
    relativePath: "packages/engine/src/game/play/corp-operation-resolution.ts",
    locator: `${cardDefinitionId}: {`,
    marker,
    maxDistance: 100,
  })),
  {
    cardDefinitionId: "simple_economy_asset",
    relativePath:
      "packages/engine/src/card-implementations/demo/corp/assets/simple-economy-asset.ts",
    locator: 'cardDefinitionId: "simple_economy_asset"',
    marker: "amount: 3",
    maxDistance: 250,
  },
  {
    cardDefinitionId: "v08_cashout_asset",
    relativePath:
      "packages/engine/src/card-implementations/v08/corp/assets/cashout-asset.ts",
    locator: 'cardDefinitionId: "v08_cashout_asset"',
    marker: "amount: 4",
    maxDistance: 250,
  },
  {
    cardDefinitionIds: ["simple_setup_hardware", "v08_memory_chip"],
    relativePath: "packages/engine/src/game/install/install-card.ts",
    locator: "memoryLimitBonus ?? 1",
    marker: "memoryLimitBonus ?? 1",
    maxDistance: 0,
  },
  {
    cardDefinitionIds: ["simple_setup_hardware", "v08_memory_chip"],
    relativePath:
      "packages/engine/src/game/abilities/runner-special-trigger-execution.ts",
    locator: "memoryLimitBonus ?? 1",
    marker: "memoryLimitBonus ?? 1",
    maxDistance: 0,
  },
  {
    cardDefinitionId: "simple_upgrade",
    relativePath: "packages/ai/src/simulation/remote-trash-role.ts",
    locator: 'definitionId === "simple_upgrade"',
    marker: 'definitionId === "simple_upgrade"',
    maxDistance: 0,
  },
]);

function assertReviewedRuntimeEvidence() {
  for (const evidence of REVIEWED_RUNTIME_EVIDENCE) {
    const text = sourceText(evidence.relativePath);
    const locatorIndex = text.indexOf(evidence.locator);
    const markerIndex = text.indexOf(evidence.marker, locatorIndex);
    if (
      locatorIndex < 0 ||
      markerIndex < locatorIndex ||
      markerIndex - locatorIndex > evidence.maxDistance
    )
      fail(
        `testset_reviewed_runtime_evidence_missing:${evidence.relativePath}:${evidence.locator}:${evidence.marker}`,
      );
  }
}

function migrationReport(migratedCards, outputs) {
  const specs = [...outputs]
    .filter(([relativePath]) => relativePath.endsWith(".card-spec.ts"))
    .map(([relativePath, content]) => ({
      cardDefinitionId: path.basename(relativePath, ".card-spec.ts"),
      outputFingerprint: sha256(content),
    }));
  const runtimeDefinitions = migratedCards.filter(
    (entry) => entry.publication.status === "active",
  ).length;
  const projectedImplementations = migratedCards.filter((entry) =>
    ["abilities", "icebreakerAbilities", "corpRootRezCreditOutcome"].some(
      (family) => entry.engine[family] !== undefined,
    ),
  ).length;
  const targetDefinitionOnlyRuntime =
    runtimeDefinitions - projectedImplementations;
  const catalogOnly = migratedCards.length - runtimeDefinitions;
  const legacyImplementationModules = migratedCards.filter(
    (entry) =>
      entry.__migrationEvidence.implementationCoverage ===
      "implementation_backed_declarative",
  ).length;
  const legacyDefinitionOnlyRuntime = migratedCards.filter(
    (entry) =>
      entry.__migrationEvidence.implementationCoverage ===
      "definition_only_test_fixture",
  ).length;
  assertDerivedCounts(
    {
      runtimeDefinitions,
      projectedImplementations,
      targetDefinitionOnlyRuntime,
      catalogOnly,
      legacyImplementationModules,
      legacyDefinitionOnlyRuntime,
    },
    {
      runtimeDefinitions: descriptor.expected.runtimeDefinitions,
      projectedImplementations: descriptor.expected.projectedImplementations,
      targetDefinitionOnlyRuntime:
        descriptor.expected.targetDefinitionOnlyRuntime,
      catalogOnly: descriptor.expected.catalogOnly,
      legacyImplementationModules:
        descriptor.expected.legacyImplementationModules,
      legacyDefinitionOnlyRuntime:
        descriptor.expected.legacyDefinitionOnlyRuntime,
    },
    fail,
  );
  return {
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
      sharedDefinitions: definitionsById.size,
      legacyHints: hintsById.size,
      generatedCardSpecs: specs.length,
      runtimeDefinitions,
      projectedImplementations,
      targetDefinitionOnlyRuntime,
      catalogOnly,
      legacyImplementationModules,
      legacyDefinitionOnlyRuntime,
    },
    dispositions: {
      rawFields: "canonical_identity_text_characteristics_printing",
      definitionFields: "canonical_mechanics_or_explicit_editor_discard",
      hintFields: "mechanical_derivation_planning_annotation_or_evidence",
      manifestFields: "editorial_parity_evidence_only",
      displayOnlyText: "legacy_catalog_metadata_not_public_card_text",
      v08_local_original: "explicitly_discarded_nonsemantic_marker",
      identityAbilityEnabledFalse: "explicitly_discarded_unused_legacy_flag",
      hintMechanicalFields:
        "compiler_derived_from_card_spec_and_bound_by_legacy_hint_fingerprint",
      hintPlanningFields: "closed_typed_planning_annotations",
      hintEvidenceFields: "review_quality_scenario_and_manual_evidence_only",
    },
    reconciliations: [
      {
        cardDefinitionId: "catalog_preview_resource_001",
        field: "numeric.cost->characteristics.numeric.installCost",
        disposition: "canonical_resource_install_cost",
        value: 1,
      },
      ...[...RECONCILED_SUBTYPE_ORDER_IDS].sort().map((cardDefinitionId) => ({
        cardDefinitionId,
        field: "subtypes",
        disposition: "shared_runtime_canonical_order_same_set",
      })),
      ...["simple_setup_hardware", "v08_memory_chip"].map(
        (cardDefinitionId) => ({
          cardDefinitionId,
          field: "memoryLimitBonus",
          disposition: "explicit_legacy_runtime_default",
          value: 1,
        }),
      ),
      {
        cardDefinitionId: "catalog_preview_resource_001",
        field: "publication.catalogBlockReason",
        disposition: "editorial_reason_replaces_runtime_coupled_legacy_reason",
        value: "Intentionally blocked catalog-only test fixture.",
      },
      ...[
        "efficient_fracter",
        "simple_decoder",
        "simple_fracter",
        "simple_killer",
        "v08_adaptive_killer",
        "v08_precise_decoder",
        "v08_steady_fracter",
      ].map((cardDefinitionId) => ({
        cardDefinitionId,
        field: "hint.breakerProfile.baseStrength",
        disposition:
          "discarded_stale_hint_mechanics_card_spec_strength_is_authority",
        legacyValue: 1,
      })),
    ],
    runtimeEvidence: REVIEWED_RUNTIME_EVIDENCE,
    cards: migratedCards.map((entry) => ({
      cardDefinitionId: expressionValue(entry.identity.cardDefinitionId),
      implementationCoverage: entry.__migrationEvidence.implementationCoverage,
      manifestStatuses: entry.__migrationEvidence.manifestStatuses,
      legacyHintFingerprint: hintsById.has(
        expressionValue(entry.identity.cardDefinitionId),
      )
        ? sha256(
            JSON.stringify(
              hintsById.get(expressionValue(entry.identity.cardDefinitionId)),
            ),
          )
        : null,
      outputFingerprint: requiredOutputFingerprint(
        specs,
        expressionValue(entry.identity.cardDefinitionId),
      ),
    })),
    aggregateOutputFingerprint: sha256(
      [...outputs]
        .map(([relativePath, content]) => `${relativePath}\n${content}`)
        .join("\n"),
    ),
  };
}

function requiredOutputFingerprint(specs, cardDefinitionId) {
  const match = specs.find(
    (spec) => spec.cardDefinitionId === cardDefinitionId,
  );
  if (match === undefined)
    fail(`testset_output_fingerprint_missing:${cardDefinitionId}`);
  return match.outputFingerprint;
}

function expressionValue(value) {
  const match = /cardDefinitionId\("([^"]+)"\)/.exec(value.__expression);
  if (!match) fail("testset_invalid_definition_id_expression");
  return match[1];
}

function sha256(value) {
  return migrationSha256(value);
}

function assertLegacyCardParity(sourceCard, definition) {
  if (definition === undefined) return;
  for (const [field, rawField] of [
    ["id", "cardId"],
    ["title", "title"],
    ["side", "side"],
    ["type", "type"],
    ["rulesText", "text"],
  ])
    if (definition[field] !== sourceCard[rawField])
      fail(
        `testset_raw_definition_field_mismatch:${sourceCard.cardId}:${field}`,
      );
  const rawSubtypes = sourceCard.subtypes ?? [];
  const definitionSubtypes = definition.subtypes ?? [];
  if (JSON.stringify(rawSubtypes) !== JSON.stringify(definitionSubtypes)) {
    if (!RECONCILED_SUBTYPE_ORDER_IDS.has(sourceCard.cardId))
      fail(`testset_unreviewed_subtype_delta:${sourceCard.cardId}`);
    if (
      JSON.stringify([...rawSubtypes].sort()) !==
      JSON.stringify([...definitionSubtypes].sort())
    )
      fail(`testset_subtype_set_mismatch:${sourceCard.cardId}`);
  }
  if (
    definition.implementationStatus !== "playable_mvp" ||
    sourceCard.setId !== "testset"
  )
    fail(`testset_runtime_identity_mismatch:${sourceCard.cardId}`);
  if (
    definition.abilityEnabled !== undefined &&
    definition.abilityEnabled !== false
  )
    fail(`testset_identity_ability_disposition_gap:${sourceCard.cardId}`);
  if (
    sourceCard.cardId === "simple_setup_hardware" ||
    sourceCard.cardId === "v08_memory_chip"
  ) {
    if (!(definition.mechanics ?? []).includes("modify_memory_limit"))
      fail(`testset_memory_default_evidence_missing:${sourceCard.cardId}`);
  }
}

function assertAllowedKeys(value, allowed, pathLabel) {
  assertAllowedKeysCore(value, allowed, pathLabel, fail);
}

function renderCardSpec(specWithEvidence) {
  const { __migrationEvidence: _evidence, ...spec } = specWithEvidence;
  const usesCapabilityKey = JSON.stringify(spec).includes("capabilityKey(");
  const imports = usesCapabilityKey
    ? "capabilityKey, cardDefinitionId, type CardSpec"
    : "cardDefinitionId, type CardSpec";
  return `import { ${imports} } from "../..";\n\nexport const cardSpec = ${renderValue(spec, 0)} satisfies CardSpec;\n`;
}

function renderValue(value, depth) {
  return renderMigrationValue(value, depth);
}

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
    driftCode: `${descriptor.setId}_card_spec_migration_drift`,
    fail,
  });
}

function assertExactSourcePartition() {
  if (
    sourceCards.length !== descriptor.expected.rawCards ||
    sourceSupport.length !== descriptor.expected.supportEntries
  )
    fail("testset_source_count_mismatch");
  if (
    definitionsById.size !== descriptor.expected.sharedDefinitions ||
    hintsById.size !== descriptor.expected.legacyHints
  )
    fail("testset_definition_hint_count_mismatch");
  assertUniqueIds(sourceCards, "cardId", "raw");
  assertUniqueIds(sourceSupport, "cardId", "support");
  assertUniqueIds([...definitionsById.values()], "id", "definition");
  assertUniqueIds([...hintsById.values()], "cardId", "hint");
  for (const sourceCard of sourceCards) {
    if (sourceCard.setId !== descriptor.setId)
      fail(`testset_wrong_raw_set:${sourceCard.cardId}:${sourceCard.setId}`);
    if (!supportById.has(sourceCard.cardId))
      fail(`testset_missing_support:${sourceCard.cardId}`);
    if (
      definitionsById.has(sourceCard.cardId) !==
      hintsById.has(sourceCard.cardId)
    )
      fail(`testset_definition_hint_xor:${sourceCard.cardId}`);
  }
  for (const support of sourceSupport)
    if (!testsetIds.has(support.cardId) || support.setId !== descriptor.setId)
      fail(`testset_unexpected_support:${support.cardId}:${support.setId}`);
}

function assertUniqueIds(entries, field, label) {
  const ids = entries.map((entry) => entry[field]);
  if (
    ids.some((id) => typeof id !== "string" || id.length === 0) ||
    new Set(ids).size !== ids.length
  )
    fail(`testset_duplicate_or_missing_id:${label}`);
}

function extractArrayObjects(sourceText, variableName) {
  return extractArrayObjectsCore(sourceText, variableName, fail);
}

function gitShow(relativePath) {
  return execFileSync("git", ["show", `${SOURCE_COMMIT}:${relativePath}`], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

function expression(__expression) {
  return migrationExpression(__expression);
}

function quote(value) {
  return JSON.stringify(value);
}

function requiredNumber(value, pathLabel) {
  if (typeof value !== "number") fail(`testset_number_missing:${pathLabel}`);
  return value;
}

function compareByCardId(left, right) {
  return left.cardId < right.cardId ? -1 : left.cardId > right.cardId ? 1 : 0;
}

function fail(message) {
  throw new Error(message);
}

await runMigration();
