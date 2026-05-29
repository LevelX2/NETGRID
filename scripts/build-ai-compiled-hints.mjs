#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const DERIVED_FACTS_REPORT_PATH =
  "docs/reviews/ai/ai-derived-basic-facts-gate-2026-05-25.json";
const OVERLAY_ROOT = "data/ai/hints/overlays";
const RUNTIME_PILOT_CARDS_PATH =
  "data/ai/ai-compiled-hint-runtime-pilot-cards-2026-05-25.json";
const COMPILED_HINTS_PATH = "data/ai/ai-card-hints-compiled.json";
const REPORT_PATH =
  "docs/reviews/ai/aufgabe-041-compiled-hint-runtime-pilot-report-2026-05-25.json";
const GENERATED_AT = "2026-05-25";

const LEGACY_FIELDS = [
  "cardId",
  "side",
  "cardType",
  "roles",
  "planRoles",
  "aiSupportStatus",
];
const MECHANICAL_FIELDS = [
  "effects",
  "conditions",
  "costProfile",
  "breakerProfile",
  "remoteRole",
  "targetProfiles",
];
const OVERLAY_FIELDS = [
  "lineSupport",
  "quality",
  "manualNotes",
  "strategicNotes",
];
const HIDDEN_INFO_FIELDS = new Set([
  "opponentDeckList",
  "corpHiddenRndOrder",
  "runnerHiddenStackOrder",
  "hiddenHqCards",
  "privatePayload",
  "fullGameState",
  "cardInstances",
  "actualDeckOrder",
  "actualStackOrder",
  "actualRndOrder",
]);
const RUNTIME_OR_LEGALITY_FIELDS = new Set([
  "legalActions",
  "playerActions",
  "runtime",
  "planner",
  "profile",
  "stateVersion",
  "stateHash",
  "actionId",
  "consumer",
  "strategyWeights",
  "legality",
  "deck",
  "matchState",
]);
const KNOWN_EFFECT_KINDS = new Set([
  "economy",
  "draw",
  "damage",
  "tag",
  "trace",
  "run_tax",
  "breaker",
  "search",
  "remote_protection",
  "score_acceleration",
  "trash_credit",
  "multiaccess",
  "topdeck_info",
  "hq_info",
  "expose_info",
  "zone_shuffle",
  "etr",
  "extra_action",
  "counter_economy",
  "action_economy",
  "start_of_turn_economy",
  "recurring_economy",
  "advanceable_economy",
  "scored_agenda_action",
  "advance_burst",
  "shuffle_draw",
  "card_recovery",
  "agenda_reveal_economy",
  "advance",
  "install",
  "rez",
  "remote_build",
  "global_modifier",
  "finite_economy_pool",
  "future_run_effect",
  "future_encounter_effect",
  "access_replacement",
  "install_discount",
  "rez_discount",
  "program_trash",
  "ice_trash",
  "hardware_trash",
  "run_lock",
  "no_jack_out",
  "persistent_counter_effect",
  "trace_credit",
  "resource_trash",
  "link_penalty",
  "tag_punish_payoff",
  "tag_source",
  "remote_tax",
  "access_punish",
  "ambush",
  "damage_prevention",
  "flatline_prevention",
  "program_trash_prevention",
  "hardware_trash_prevention",
  "resource_trash_prevention",
  "tag_prevention",
  "trace_defense",
  "link",
  "base_link",
  "remove_brain_damage",
  "meat_damage_prevention",
  "net_damage_prevention",
  "brain_damage_prevention",
  "hand_size_modifier",
  "action_penalty",
  "persistent_survival_modifier",
  "prevention_replacement",
  "survival_payoff",
  "delayed_penalty",
]);
const KNOWN_CONDITIONS = new Set([
  "requires_runner_tagged",
  "requires_successful_run",
  "requires_known_ice",
  "requires_agenda_in_remote",
  "requires_trace_success",
  "requires_during_run",
  "requires_scored_agenda",
  "requires_accessed_card",
  "requires_remote_server",
  "requires_hq_pressure",
  "requires_rnd_pressure",
  "requires_installed_program",
  "requires_missing_breaker_coverage",
  "requires_encounter",
  "requires_unbroken_subroutine",
  "requires_later_encounter",
  "requires_remaining_ice",
  "requires_agenda_in_hq",
  "requires_agenda_reveal",
  "requires_hq_agenda",
  "requires_installed_ice",
  "requires_rezzed_ice",
  "requires_score_window",
  "requires_corp_credits_threshold",
  "requires_start_of_turn",
  "requires_stolen_agenda_last_turn",
  "requires_archives_card",
  "requires_rnd_top",
  "requires_advancement_counter",
  "requires_installed_card",
  "requires_rezzed_card",
  "requires_runner_draw",
  "requires_runner_pay_or_take_tag",
  "requires_damage",
  "requires_net_damage",
  "requires_meat_damage",
  "requires_brain_damage",
  "requires_flatline",
  "requires_program_trash",
  "requires_trace_attempt",
  "requires_prevention_window",
  "requires_turn_limit_available",
  "requires_runner_action",
  "requires_installed_resource",
  "requires_installed_hardware",
  "requires_grip_card",
  "requires_stack_search",
  "requires_heap_card",
  "requires_credit_pool",
]);
const KNOWN_BREAKER_COVERAGES = new Set([
  "wall",
  "sentry",
  "code_gate",
  "ap",
  "trace",
  "watchdog",
  "black_ice",
  "universal",
  "unknown_special",
]);
const KNOWN_REMOTE_ROLES = new Set([
  "scoring_protection",
  "bait",
  "asset_economy",
  "run_tax",
  "remote_capacity",
  "ambush",
  "tax_fort",
  "ice_modifier",
  "agenda_steal_tax",
  "tag_punish_asset",
]);

function repoPath(relativePath) {
  return path.join(REPO_ROOT, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(repoPath(relativePath), "utf8"));
}

function writeJson(relativePath, value) {
  fs.mkdirSync(path.dirname(repoPath(relativePath)), { recursive: true });
  fs.writeFileSync(repoPath(relativePath), serialize(value), "utf8");
}

function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function listJsonFiles(absoluteDir) {
  if (!fs.existsSync(absoluteDir)) return [];
  return fs
    .readdirSync(absoluteDir, { withFileTypes: true })
    .flatMap((entry) => {
      const absolutePath = path.join(absoluteDir, entry.name);
      if (entry.isDirectory()) return listJsonFiles(absolutePath);
      return entry.isFile() && entry.name.endsWith(".json")
        ? [absolutePath]
        : [];
    })
    .sort();
}

function readOverlayByCard() {
  const byCard = new Map();
  for (const absolutePath of listJsonFiles(repoPath(OVERLAY_ROOT))) {
    const overlayFile = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
    for (const entry of overlayFile.cards ?? []) {
      byCard.set(entry.cardId, entry.overlay ?? {});
    }
  }
  return byCard;
}

function isMeaningful(value) {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function stableValue(value) {
  if (Array.isArray(value)) {
    return value
      .map(stableValue)
      .sort((left, right) =>
        JSON.stringify(left).localeCompare(JSON.stringify(right)),
      );
  }
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(
        ([key, child]) =>
          ![
            "source",
            "confidence",
            "derivationNotes",
            "needsManualOverlayReasons",
          ].includes(key) && isMeaningful(child),
      )
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, stableValue(child)]),
  );
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function generatedFactsFrom(derivedFacts = {}) {
  return Object.fromEntries(
    MECHANICAL_FIELDS.flatMap((field) =>
      isMeaningful(derivedFacts[field]) ? [[field, stableValue(derivedFacts[field])]] : [],
    ),
  );
}

function overlayFieldsFrom(overlay = {}) {
  return Object.fromEntries(
    OVERLAY_FIELDS.flatMap((field) =>
      isMeaningful(overlay[field]) ? [[field, stableValue(overlay[field])]] : [],
    ),
  );
}

export function buildCompiledHintsArtifact() {
  const activeHints = readJson(ACTIVE_HINTS_PATH);
  const derivedReport = readJson(DERIVED_FACTS_REPORT_PATH);
  const runtimePilotCards = readJson(RUNTIME_PILOT_CARDS_PATH);
  const overlaysByCard = readOverlayByCard();
  const derivedByCard = new Map(
    (derivedReport.cards ?? []).map((card) => [card.cardId, card]),
  );
  const runtimePilotIds = new Set(
    (runtimePilotCards.cards ?? []).map((card) => card.cardId),
  );
  const cards = (activeHints.cards ?? []).map((activeHint) => {
    const compiled = clone(activeHint);
    const derivedCard = derivedByCard.get(activeHint.cardId);
    const generatedFacts = generatedFactsFrom(derivedCard?.derivedFacts);
    for (const [field, value] of Object.entries(generatedFacts)) {
      compiled[field] = mergeMechanicalField(field, compiled[field], value);
    }
    const overlay = overlayFieldsFrom(overlaysByCard.get(activeHint.cardId));
    for (const [field, value] of Object.entries(overlay)) {
      compiled[field] = value;
    }
    if (runtimePilotIds.has(activeHint.cardId)) {
      compiled.runtimeCompiledHintPilot = true;
    }
    return compiled;
  });
  return {
    schemaVersion: "ai-card-hints-compiled-v1",
    taskId: "Aufgabe 041",
    generatedAt: GENERATED_AT,
    source: {
      activeHintsPath: ACTIVE_HINTS_PATH,
      derivedFactsReportPath: DERIVED_FACTS_REPORT_PATH,
      manualOverlayRoot: OVERLAY_ROOT,
      runtimePilotCardsPath: RUNTIME_PILOT_CARDS_PATH,
      mode: "active legacy hints plus generated mechanical facts plus optional manual overlays; hints do not create LegalActions",
    },
    cards,
  };
}

function mergeMechanicalField(field, activeValue, generatedValue) {
  if (!isMeaningful(activeValue)) return stableValue(generatedValue);
  if (!isMeaningful(generatedValue)) return stableValue(activeValue);
  if (["effects", "conditions", "targetProfiles"].includes(field)) {
    return uniqueBySerialized([
      ...(Array.isArray(activeValue) ? activeValue : []),
      ...(Array.isArray(generatedValue) ? generatedValue : []),
    ]).map(stableValue);
  }
  if (
    ["costProfile", "breakerProfile", "remoteRole"].includes(field) &&
    activeValue &&
    generatedValue &&
    typeof activeValue === "object" &&
    typeof generatedValue === "object" &&
    !Array.isArray(activeValue) &&
    !Array.isArray(generatedValue)
  ) {
    return stableValue({ ...activeValue, ...generatedValue });
  }
  return stableValue(generatedValue);
}

function uniqueBySerialized(values) {
  const seen = new Set();
  return values.filter((value) => {
    const key = JSON.stringify(stableValue(value));
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildCompiledHintsReport(artifact = buildCompiledHintsArtifact()) {
  const activeHints = readJson(ACTIVE_HINTS_PATH);
  const derivedReport = readJson(DERIVED_FACTS_REPORT_PATH);
  const runtimePilotCards = readJson(RUNTIME_PILOT_CARDS_PATH);
  const overlaysByCard = readOverlayByCard();
  const activeByCard = new Map(
    (activeHints.cards ?? []).map((hint) => [hint.cardId, hint]),
  );
  const compiledByCard = new Map(
    (artifact.cards ?? []).map((hint) => [hint.cardId, hint]),
  );
  const generatedFactCardIds = new Set(
    (derivedReport.cards ?? [])
      .filter((card) => Object.keys(generatedFactsFrom(card.derivedFacts)).length > 0)
      .map((card) => card.cardId),
  );
  const runtimePilotIds = new Set(
    (runtimePilotCards.cards ?? []).map((card) => card.cardId),
  );
  const errors = validateCompiledArtifact({
    activeHints,
    artifact,
    runtimePilotCards,
  });
  return {
    schemaVersion: "aufgabe-041-compiled-hint-runtime-pilot-report-v1",
    taskId: "Aufgabe 041",
    generatedAt: GENERATED_AT,
    activeHintCount: activeHints.cards?.length ?? 0,
    compiledHintCount: artifact.cards?.length ?? 0,
    runtimePilotCardCount: runtimePilotIds.size,
    generatedFactsCardCount: generatedFactCardIds.size,
    legacyFallbackOnlyCount: (activeHints.cards ?? []).filter(
      (hint) => !generatedFactCardIds.has(hint.cardId),
    ).length,
    manualOverlayCardCount: overlaysByCard.size,
    hardErrorCount: errors.length,
    warningCount: 0,
    runtimePilotCards: [...runtimePilotIds].sort().map((cardId) => {
      const compiled = compiledByCard.get(cardId);
      return {
        cardId,
        side: compiled?.side ?? null,
        cardType: compiled?.cardType ?? null,
        generatedFields: MECHANICAL_FIELDS.filter((field) =>
          isMeaningful(compiled?.[field]),
        ),
        manualOverlayFields: OVERLAY_FIELDS.filter((field) =>
          isMeaningful(compiled?.[field]),
        ),
      };
    }),
    legacyCompatibility: {
      legacyFieldsChecked: LEGACY_FIELDS,
      allActiveHintsPresent: (activeHints.cards ?? []).every((hint) =>
        compiledByCard.has(hint.cardId),
      ),
      activeLegacyFieldsStable: errors.every(
        (error) => error.kind !== "legacy_field_drift",
      ),
      aiSupportStatusStable: (activeHints.cards ?? []).every(
        (hint) =>
          activeByCard.get(hint.cardId)?.aiSupportStatus ===
          compiledByCard.get(hint.cardId)?.aiSupportStatus,
      ),
    },
    consumerImpact: {
      runnerBreaker: ["breakerProfile"],
      runnerSearch: ["effects.search", "targetProfiles"],
      runnerRemoteTrash: ["remoteRole.asset_economy", "effects.trash_credit"],
      corpIceOrdering: ["effects.future_encounter_effect"],
      corpTagPunish: ["effects.tag_punish_payoff"],
      runnerRemoteAccess: ["remoteRole.agenda_steal_tax"],
    },
    errors,
  };
}

function validateCompiledArtifact({ activeHints, artifact, runtimePilotCards }) {
  const errors = [];
  const activeCards = activeHints.cards ?? [];
  const compiledCards = artifact.cards ?? [];
  const activeByCard = new Map(activeCards.map((hint) => [hint.cardId, hint]));
  const compiledByCard = new Map(compiledCards.map((hint) => [hint.cardId, hint]));
  const runtimePilotIds = new Set(
    (runtimePilotCards.cards ?? []).map((card) => card.cardId),
  );

  if (compiledCards.length !== activeCards.length) {
    errors.push({
      kind: "compiled_count_mismatch",
      message: `Expected ${activeCards.length} compiled hints, got ${compiledCards.length}.`,
    });
  }
  if (compiledByCard.size !== compiledCards.length) {
    errors.push({
      kind: "duplicate_compiled_card_id",
      message: "Compiled artifact contains duplicate card IDs.",
    });
  }
  for (const activeHint of activeCards) {
    const compiled = compiledByCard.get(activeHint.cardId);
    if (!compiled) {
      errors.push({
        kind: "missing_compiled_hint",
        cardId: activeHint.cardId,
        message: "Active hint is absent from compiled artifact.",
      });
      continue;
    }
    for (const field of LEGACY_FIELDS) {
      if (JSON.stringify(activeHint[field]) !== JSON.stringify(compiled[field])) {
        errors.push({
          kind: "legacy_field_drift",
          cardId: activeHint.cardId,
          field,
          message: `Compiled legacy field ${field} differs from active hint.`,
        });
      }
    }
    for (const [field, value] of Object.entries(activeHint)) {
      if (MECHANICAL_FIELDS.includes(field)) continue;
      if (OVERLAY_FIELDS.includes(field)) continue;
      if (compiled[field] === undefined && value !== undefined) {
        errors.push({
          kind: "active_field_dropped",
          cardId: activeHint.cardId,
          field,
          message: `Compiled hint dropped active field ${field}.`,
        });
      }
    }
  }
  for (const cardId of runtimePilotIds) {
    const compiled = compiledByCard.get(cardId);
    if (!compiled) continue;
    if (compiled.runtimeCompiledHintPilot !== true) {
      errors.push({
        kind: "runtime_pilot_flag_missing",
        cardId,
        message: "Runtime pilot card lacks runtimeCompiledHintPilot=true.",
      });
    }
  }

  for (const compiled of compiledCards) {
    validateNoForbiddenFields(compiled, compiled.cardId, errors);
    validateKnownOntology(compiled, errors);
  }
  validatePilotSpecificGuards(compiledByCard, errors);
  return errors.sort((left, right) =>
    `${left.cardId ?? ""}:${left.kind}:${left.field ?? ""}`.localeCompare(
      `${right.cardId ?? ""}:${right.kind}:${right.field ?? ""}`,
    ),
  );
}

function validateNoForbiddenFields(value, cardId, errors, basePath = "$") {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      validateNoForbiddenFields(item, cardId, errors, `${basePath}[${index}]`),
    );
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    const fieldPath = `${basePath}.${key}`;
    if (HIDDEN_INFO_FIELDS.has(key)) {
      errors.push({
        kind: "hidden_info_field",
        cardId,
        fieldPath,
        message: `Compiled hint contains hidden-info field ${fieldPath}.`,
      });
    }
    if (RUNTIME_OR_LEGALITY_FIELDS.has(key)) {
      errors.push({
        kind: "runtime_or_legality_field",
        cardId,
        fieldPath,
        message: `Compiled hint contains runtime/legal field ${fieldPath}.`,
      });
    }
    validateNoForbiddenFields(child, cardId, errors, fieldPath);
  }
}

function validateKnownOntology(hint, errors) {
  for (const [index, effect] of (hint.effects ?? []).entries()) {
    if (!KNOWN_EFFECT_KINDS.has(effect.kind)) {
      errors.push({
        kind: "unknown_effect_kind",
        cardId: hint.cardId,
        field: `effects[${index}].kind`,
        message: `Unknown effect kind ${String(effect.kind)}.`,
      });
    }
  }
  for (const [index, condition] of (hint.conditions ?? []).entries()) {
    if (!KNOWN_CONDITIONS.has(condition.kind)) {
      errors.push({
        kind: "unknown_condition_kind",
        cardId: hint.cardId,
        field: `conditions[${index}].kind`,
        message: `Unknown condition kind ${String(condition.kind)}.`,
      });
    }
  }
  for (const [index, coverage] of (hint.breakerProfile?.coverage ?? []).entries()) {
    if (!KNOWN_BREAKER_COVERAGES.has(coverage)) {
      errors.push({
        kind: "unknown_breaker_coverage",
        cardId: hint.cardId,
        field: `breakerProfile.coverage[${index}]`,
        message: `Unknown breaker coverage ${String(coverage)}.`,
      });
    }
  }
  if (hint.remoteRole && !KNOWN_REMOTE_ROLES.has(hint.remoteRole.kind)) {
    errors.push({
      kind: "unknown_remote_role",
      cardId: hint.cardId,
      field: "remoteRole.kind",
      message: `Unknown remote role ${String(hint.remoteRole.kind)}.`,
    });
  }
}

function validatePilotSpecificGuards(compiledByCard, errors) {
  const selfModifyingCode = compiledByCard.get("onr_v1_059_self-modifying-code");
  if (selfModifyingCode?.effects?.some((effect) => effect.kind === "install_discount")) {
    errors.push({
      kind: "self_modifying_code_install_discount",
      cardId: "onr_v1_059_self-modifying-code",
      message: "Self-Modifying Code must not compile install_discount.",
    });
  }
  const bbs = compiledByCard.get("onr_v1_309_bbs-whispering-campaign");
  if (JSON.stringify(bbs).includes("remainingPool")) {
    errors.push({
      kind: "bbs_remaining_pool_static_fact",
      cardId: "onr_v1_309_bbs-whispering-campaign",
      message: "BBS Whispering Campaign must not compile current remaining pool.",
    });
  }
  for (const cardId of [
    "onr_v1_222_ball-and-chain",
    "onr_v1_225_canis-major",
  ]) {
    const hint = compiledByCard.get(cardId);
    const effectKinds = new Set((hint?.effects ?? []).map((effect) => effect.kind));
    const conditionKinds = new Set(
      (hint?.conditions ?? []).map((condition) => condition.kind),
    );
    if (
      !effectKinds.has("future_encounter_effect") ||
      !conditionKinds.has("requires_remaining_ice")
    ) {
      errors.push({
        kind: "future_encounter_context_missing",
        cardId,
        message:
          "Future ICE pilot cards must compile future_encounter_effect and requires_remaining_ice.",
      });
    }
  }
}

function parseArgs(argv) {
  const options = { check: false, write: false, json: false };
  for (const arg of argv) {
    if (arg === "--check") options.check = true;
    else if (arg === "--write") options.write = true;
    else if (arg === "--json") options.json = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!options.check && !options.write && !options.json) options.write = true;
  return options;
}

export function runCli(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const artifact = buildCompiledHintsArtifact();
  const report = buildCompiledHintsReport(artifact);
  const serializedArtifact = serialize(artifact);
  const serializedReport = serialize(report);

  if (options.write) {
    writeJson(COMPILED_HINTS_PATH, artifact);
    writeJson(REPORT_PATH, report);
  }
  if (options.check) {
    if (!fs.existsSync(repoPath(COMPILED_HINTS_PATH))) {
      throw new Error(`Compiled hints artifact is missing: ${COMPILED_HINTS_PATH}`);
    }
    if (!fs.existsSync(repoPath(REPORT_PATH))) {
      throw new Error(`Compiled hints report is missing: ${REPORT_PATH}`);
    }
    if (fs.readFileSync(repoPath(COMPILED_HINTS_PATH), "utf8") !== serializedArtifact) {
      throw new Error(
        `Generated compiled hints differ from committed ${COMPILED_HINTS_PATH}. Run corepack pnpm build:ai-compiled-hints.`,
      );
    }
    if (fs.readFileSync(repoPath(REPORT_PATH), "utf8") !== serializedReport) {
      throw new Error(
        `Generated compiled report differs from committed ${REPORT_PATH}. Run corepack pnpm build:ai-compiled-hints.`,
      );
    }
  }

  if (options.json) {
    process.stdout.write(serializedReport);
  } else {
    process.stdout.write(
      `AI_COMPILED_HINTS ${report.hardErrorCount === 0 ? "OK" : "FAIL"} cards=${report.compiledHintCount} pilot=${report.runtimePilotCardCount} generated=${report.generatedFactsCardCount} fallback=${report.legacyFallbackOnlyCount} errors=${report.hardErrorCount}\n`,
    );
  }
  if (report.hardErrorCount > 0) process.exitCode = 1;
  return { artifact, report };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    runCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
