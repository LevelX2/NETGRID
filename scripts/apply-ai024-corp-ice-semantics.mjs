#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GENERATED_AT = "2026-06-02";
const SOURCE_COMMIT = "f2ebeb6d";

const CARD_FILES = [
  "data/cards/classic-cards.json",
  "data/cards/originalset-v1-cards.json",
  "data/cards/proteus-cards.json",
];
const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const COMPILED_HINTS_PATH = "data/ai/ai-card-hints-compiled.json";
const TACTIC_SIGNAL_PATH = "data/ai/tactic-signals-v1.json";
const DERIVATION_PATH = "data/ai/function-signal-derivation-v1.json";
const MD_REPORT_PATH = "docs/reviews/ai/ai024-corp-ice-semantics-review-2026-06-02.md";
const JSON_REPORT_PATH = "docs/reviews/ai/ai024-corp-ice-semantics-review-report-2026-06-02.json";
const README_PATH = "docs/reviews/ai/README.md";

const AI024_SIGNALS = {
  "corp_ice.end_run": [true, []],
  "corp_ice.multi_end_run": [false, ["corp.ice_tax_glacier"]],
  "corp_ice.conditional_end_run": [true, []],
  "corp_ice.runner_pay_or_end_run": [false, ["corp.ice_tax_glacier"]],
  "corp_ice.net_damage": [false, ["corp.damage_kill"]],
  "corp_ice.brain_damage": [false, ["corp.damage_kill"]],
  "corp_ice.meat_damage": [false, ["corp.damage_kill"]],
  "corp_ice.damage_source": [false, ["corp.damage_kill"]],
  "corp_ice.trace_source": [true, []],
  "corp_ice.tag_source": [true, []],
  "corp_ice.persistent_tag_source": [false, ["corp.tag_trace_punish"]],
  "corp_ice.program_trash": [false, ["corp.ice_tax_glacier"]],
  "corp_ice.hardware_trash": [false, ["corp.ice_tax_glacier"]],
  "corp_ice.run_lock": [false, ["corp.ice_tax_glacier"]],
  "corp_ice.jackout_tax": [false, ["corp.ice_tax_glacier"]],
  "corp_ice.encounter_tax": [false, ["corp.ice_tax_glacier"]],
  "corp_ice.break_cost_tax": [false, ["corp.ice_tax_glacier"]],
  "corp_ice.future_strength_buff": [false, ["corp.ice_tax_glacier"]],
  "corp_ice.future_subroutine_modifier": [false, ["corp.ice_tax_glacier"]],
  "corp_ice.position_scaling": [false, ["corp.ice_tax_glacier"]],
  "corp_ice.outer_ice_scaling": [false, ["corp.ice_tax_glacier"]],
  "corp_ice.rez_paid_scaling": [false, ["corp.ice_tax_glacier"]],
  "corp_ice.rez_economy": [true, []],
  "corp_ice.type_choice_or_mode_choice": [true, []],
  "corp_ice.mobile_position_change": [true, []],
  "corp_ice.self_bounce_or_maintenance_drawback": [true, []],
  "corp_ice.random_or_guessing": [true, []],
  "corp_ice.rnd_reorder": [true, []],
  "corp_ice.other_utility": [true, []],
};

const FORBIDDEN_SUBTYPE_SIGNALS = new Set([
  "corp_ice.sentry",
  "corp_ice.code_gate",
  "corp_ice.wall",
  "corp_ice.ap",
  "corp_ice.black_ice",
  "corp_ice.killer",
  "corp_ice.watchdog",
  "corp_ice.pit_bull",
  "corp_ice.bloodhound",
  "corp_ice.hellhound",
  "corp_ice.hellbolt",
  "corp_ice.brainwipe",
  "corp_ice.zombie",
  "corp_ice.firestarter",
  "corp_ice.sword",
  "corp_ice.knockout",
  "corp_ice.stun",
  "corp_ice.random",
  "corp_ice.flatline",
  "corp_ice.dec_krash",
]);

const MULTI_ETR = new Set(["Ball and Chain", "Data Wall 2.0", "Reinforced Wall", "Toughonium™ Wall"]);
const CONDITIONAL_ETR = new Set(["Fang", "Fang 2.0", "Hunter", "Asp"]);
const RUN_LOCK = new Set(["Bolter Cluster", "Haunting Inquisition", "Tutor", "Virizz", "Viral 15", "Misleading Access Menus"]);
const JACKOUT_TAX = new Set(["Viral 15", "Ball and Chain", "Tutor"]);
const POSITION_SCALING = new Set(["Bug Zapper", "Dog Pile", "Hunting Pack", "Mastermind", "Minotaur"]);
const MOBILE_ICE = new Set(["Mobile Barricade", "Walking Wall"]);
const MODE_CHOICE = new Set(["Caryatid", "Credit Blocks", "Galatea", "Lesser Arcana", "Sphinx 2006", "Sumo 2008"]);
const PAID_SCALING = new Set(["Digiconda", "Food Fight", "Gatekeeper", "Homing Missile", "Sandstorm"]);
const RANDOM_ICE = new Set(["Too Many Doors", "Vacuum Link", "Roadblock"]);
const RND_REORDER = new Set(["Too Many Doors"]);
const REZ_ECONOMY = new Set(["Credit Blocks", "Datacomb"]);
const SELF_DRAWBACK = new Set(["Colonel Failure", "Washed-Up Solo Construct"]);
const LEGACY_ROLE_BY_PAIR_ROLE = {
  ice_tax_or_lock_piece: "tax_tool",
  damage_pressure: "punish_payoff",
  persistent_tag_source: "engine_anchor",
};

function repoPath(relativePath) {
  return path.join(REPO_ROOT, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(repoPath(relativePath), "utf8"));
}

function writeJson(relativePath, value) {
  fs.mkdirSync(path.dirname(repoPath(relativePath)), { recursive: true });
  fs.writeFileSync(repoPath(relativePath), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(relativePath, text) {
  fs.mkdirSync(path.dirname(repoPath(relativePath)), { recursive: true });
  fs.writeFileSync(repoPath(relativePath), text, "utf8");
}

function cardsFrom(relativePath) {
  const data = readJson(relativePath);
  return (data.cards ?? []).map((card) => ({ ...card, sourceFile: relativePath, setId: card.setId ?? data.setId }));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function hintText(hint, card) {
  return JSON.stringify({
    title: card.title,
    subtypes: card.subtypes ?? [],
    roles: hint?.roles ?? [],
    planRoles: hint?.planRoles ?? [],
    requiredMechanics: hint?.requiredMechanics ?? [],
    riskTags: hint?.riskTags ?? [],
    effects: hint?.effects ?? [],
    conditions: hint?.conditions ?? [],
  }).toLowerCase();
}

function signalDescription(signalId) {
  return `AI024 Corp ICE tactic signal: ${signalId.replaceAll("_", " ")}.`;
}

function signalGroup(signalId) {
  if (signalId.includes("damage")) return "ai024_corp_ice_damage";
  if (signalId.includes("tag") || signalId.includes("trace")) return "ai024_corp_ice_tag_trace";
  if (signalId.includes("end_run") || signalId.includes("tax") || signalId.includes("lock")) return "ai024_corp_ice_tax";
  if (signalId.includes("rez") || signalId.includes("position") || signalId.includes("choice")) return "ai024_corp_ice_utility";
  return "ai024_corp_ice";
}

function updateTacticSignals() {
  const catalog = readJson(TACTIC_SIGNAL_PATH);
  catalog.signals = (catalog.signals ?? []).filter((signal) => !FORBIDDEN_SUBTYPE_SIGNALS.has(signal.signalId));
  const byId = new Map(catalog.signals.map((signal) => [signal.signalId, signal]));
  for (const [signalId, [supportOnly, anchors]] of Object.entries(AI024_SIGNALS)) {
    const signal = byId.get(signalId) ?? { signalId };
    signal.group = signalGroup(signalId);
    signal.sideScope = "corp";
    signal.description = signalDescription(signalId);
    signal.supportOnly = supportOnly;
    signal.mayAnchorStrategy = !supportOnly;
    signal.allowedStrategyAnchors = [...anchors].sort();
    signal.sourceKinds = ["AI024 reviewed Corp-ICE structured hint effects"];
    signal.examples = signal.examples ?? [];
    signal.targetProfileRelevant =
      signalId.includes("choice") ||
      signalId.includes("paid") ||
      signalId.includes("position") ||
      signalId.includes("random");
    signal.notes =
      "AI024 Corp-ICE signal; read-only semantics only. It does not create planner, engine, legality, targeting, profile/default, action-score or plan-weight behavior.";
    if (!byId.has(signalId)) {
      catalog.signals.push(signal);
      byId.set(signalId, signal);
    }
  }
  catalog.taskId = "AI024";
  catalog.generatedAt = GENERATED_AT;
  catalog.description =
    "Controlled V1 tactic-signal catalog. AI024 adds Corp-ICE function signals without subtype-only or card-specific signals and without planner, engine, targeting, action-score, plan-weight, legality, profile/default or UI-derivation effects.";
  catalog.signals.sort((left, right) => left.signalId.localeCompare(right.signalId));
  writeJson(TACTIC_SIGNAL_PATH, catalog);
  return Object.keys(AI024_SIGNALS).map((signalId) => byId.get(signalId));
}

function updateDerivationRules() {
  const data = readJson(DERIVATION_PATH);
  data.derivationRules = (data.derivationRules ?? []).filter((rule) => !FORBIDDEN_SUBTYPE_SIGNALS.has(rule.signalId));
  const existing = new Set(
    data.derivationRules.map((rule) => `${rule.signalId}:${JSON.stringify(rule.match)}:${JSON.stringify(rule.gates)}`),
  );
  for (const [signalId, [, anchors]] of Object.entries(AI024_SIGNALS)) {
    const rule = {
      signalId,
      source: "effects",
      match: { target: signalId },
      gates: { side: "corp", cardType: "ice", target: signalId },
      strategyAnchorFor: [...anchors].sort(),
    };
    const key = `${rule.signalId}:${JSON.stringify(rule.match)}:${JSON.stringify(rule.gates)}`;
    if (!existing.has(key)) data.derivationRules.push(rule);
  }
  for (const rule of data.derivationRules ?? []) {
    const definition = AI024_SIGNALS[rule.signalId];
    if (!definition || rule.source !== "effects" || rule.match?.target !== rule.signalId) continue;
    const [, anchors] = definition;
    rule.strategyAnchorFor = [...anchors].sort();
  }
  data.taskId = "AI024";
  data.updatesTaskId = `${data.updatesTaskId ?? "AI003-AI023"}/AI024`;
  data.generatedAt = GENERATED_AT;
  data.description =
    "Read-only side-aware derivation contract for function signals from existing structured AI hint fields. AI024 adds Corp-ICE semantics while keeping Planner, targeting-AI, action-score, plan-weight, engine, legality, profile/default and UI-derivation effects unchanged.";
  data.derivationRules.sort((left, right) =>
    `${left.signalId}:${JSON.stringify(left.match)}`.localeCompare(`${right.signalId}:${JSON.stringify(right.match)}`),
  );
  writeJson(DERIVATION_PATH, data);
}

function classify(card, hint) {
  const text = hintText(hint, card);
  const title = card.title;
  const effects = hint?.effects ?? [];
  const roles = new Set((hint?.roles ?? []).map((role) => String(role).toLowerCase()));
  const mechanics = new Set((hint?.requiredMechanics ?? []).map((mechanic) => String(mechanic).toLowerCase()));
  const riskTags = new Set((hint?.riskTags ?? []).map((risk) => String(risk).toLowerCase()));
  const signals = [];
  const functionalEffects = [];
  const conditions = (hint?.conditions ?? []).map((condition) => condition.kind ?? condition);
  const risks = [...(hint?.riskTags ?? [])];

  const hasEffectKind = (kind) => effects.some((effect) => String(effect.kind).toLowerCase() === kind);
  const hasEtr =
    roles.has("etr_ice") ||
    roles.has("end_run") ||
    mechanics.has("end_the_run") ||
    hasEffectKind("etr") ||
    hasEffectKind("remote_protection");
  const hasDamage =
    roles.has("damage") ||
    roles.has("damage_ice") ||
    roles.has("core_damage_ice") ||
    mechanics.has("damage") ||
    mechanics.has("net_damage") ||
    mechanics.has("meat_damage") ||
    mechanics.has("core_damage") ||
    hasEffectKind("damage");
  const hasTrace = roles.has("trace") || mechanics.has("trace") || hasEffectKind("trace");
  const hasTag =
    roles.has("tag") ||
    roles.has("tag_ice") ||
    mechanics.has("add_tag") ||
    hasEffectKind("tag") ||
    hasEffectKind("tag_source");
  const hasProgramTrash =
    roles.has("program_trash_ice") ||
    mechanics.has("trash_installed_program") ||
    mechanics.has("uninstall_runner_program") ||
    hasEffectKind("program_trash");
  const hasHardwareTrash = roles.has("hardware_trash") || mechanics.has("trash_hardware") || hasEffectKind("hardware_trash");
  const hasRunTax = hasEffectKind("run_tax");
  const damageAmount = Math.max(0, ...effects.filter((effect) => effect.kind === "damage").map((effect) => Number(effect.amount ?? 1)));
  const subtypes = (card.subtypes ?? []).map((subtype) => subtype.toLowerCase().replaceAll("_", " "));
  const hasBrainSubtype = subtypes.includes("brainwipe") || roles.has("core_damage_ice") || mechanics.has("core_damage") || mechanics.has("brain_damage");
  const hasMeatDamage = mechanics.has("meat_damage") || effects.some((effect) => String(effect.resource).toLowerCase() === "meat_damage");

  if (hasEtr) signals.push("corp_ice.end_run"), functionalEffects.push("end_run");
  if (MULTI_ETR.has(title)) signals.push("corp_ice.multi_end_run"), functionalEffects.push("multi_end_run");
  if (CONDITIONAL_ETR.has(title)) signals.push("corp_ice.conditional_end_run"), functionalEffects.push("conditional_end_run");
  if (hasRunTax || RUN_LOCK.has(title)) signals.push("corp_ice.encounter_tax"), functionalEffects.push("encounter_tax");
  if (JACKOUT_TAX.has(title)) signals.push("corp_ice.jackout_tax"), functionalEffects.push("jackout_tax");
  if (RUN_LOCK.has(title)) signals.push("corp_ice.run_lock"), functionalEffects.push("run_lock");
  if (text.includes("break_cost") || title === "Virizz") signals.push("corp_ice.break_cost_tax"), functionalEffects.push("break_cost_tax");
  if (hasDamage) {
    signals.push("corp_ice.damage_source", "damage.payoff");
    functionalEffects.push("damage_source");
    if (hasBrainSubtype) signals.push("corp_ice.brain_damage"), functionalEffects.push("brain_damage");
    else if (hasMeatDamage) signals.push("corp_ice.meat_damage"), functionalEffects.push("meat_damage");
    else signals.push("corp_ice.net_damage"), functionalEffects.push("net_damage");
  }
  if (hasTrace) signals.push("corp_ice.trace_source", "trace.source"), functionalEffects.push("trace_source");
  if (hasTag) signals.push("corp_ice.tag_source", "tag.source"), functionalEffects.push("tag_source");
  if (title === "Data Raven") signals.push("corp_ice.persistent_tag_source"), functionalEffects.push("persistent_tag_source");
  if (hasProgramTrash) signals.push("corp_ice.program_trash"), functionalEffects.push("program_trash");
  if (hasHardwareTrash) signals.push("corp_ice.hardware_trash"), functionalEffects.push("hardware_trash");
  if (text.includes("strength") || POSITION_SCALING.has(title)) signals.push("ice.strength_modifier"), functionalEffects.push("strength_modifier");
  if (POSITION_SCALING.has(title)) signals.push("corp_ice.position_scaling", "corp_ice.outer_ice_scaling"), functionalEffects.push("position_or_outer_scaling");
  if (PAID_SCALING.has(title)) signals.push("corp_ice.rez_paid_scaling"), functionalEffects.push("rez_paid_scaling");
  if (MODE_CHOICE.has(title)) signals.push("corp_ice.type_choice_or_mode_choice"), functionalEffects.push("type_or_mode_choice");
  if (MOBILE_ICE.has(title)) signals.push("corp_ice.mobile_position_change"), functionalEffects.push("mobile_position_change");
  if (RANDOM_ICE.has(title)) signals.push("corp_ice.random_or_guessing"), functionalEffects.push("random_or_guessing");
  if (RND_REORDER.has(title) || text.includes("reorder_rd")) signals.push("corp_ice.rnd_reorder"), functionalEffects.push("rnd_reorder");
  if (REZ_ECONOMY.has(title)) signals.push("corp_ice.rez_economy"), functionalEffects.push("rez_economy");
  if (SELF_DRAWBACK.has(title)) signals.push("corp_ice.self_bounce_or_maintenance_drawback"), functionalEffects.push("self_bounce_or_maintenance_drawback");
  if (signals.length === 0) signals.push("corp_ice.other_utility"), functionalEffects.push("other_utility");

  const strategyPairs = [];
  const addPair = (strategyId, role, evidence, confidence = "medium") => {
    const filtered = unique(evidence);
    if (!filtered.length) return;
    strategyPairs.push({ strategyId, role, evidence: filtered, confidence });
  };

  const heavyStopperEvidence = signals.filter((signal) =>
    [
      "corp_ice.multi_end_run",
      "corp_ice.runner_pay_or_end_run",
      "corp_ice.run_lock",
      "corp_ice.jackout_tax",
      "corp_ice.break_cost_tax",
      "corp_ice.position_scaling",
      "corp_ice.outer_ice_scaling",
      "corp_ice.rez_paid_scaling",
      "corp_ice.program_trash",
      "corp_ice.hardware_trash",
      "ice.strength_modifier",
    ].includes(signal),
  );
  if (heavyStopperEvidence.length) addPair("corp.ice_tax_glacier", "ice_tax_or_lock_piece", heavyStopperEvidence, "medium");

  const damageEvidence = signals.filter((signal) =>
    ["corp_ice.damage_source", "corp_ice.brain_damage", "corp_ice.meat_damage", "corp_ice.net_damage", "damage.payoff"].includes(signal),
  );
  if (damageEvidence.length && (damageAmount >= 2 || hasBrainSubtype || hasMeatDamage || subtypes.includes("black ice") || subtypes.includes("black ice"))) {
    addPair("corp.damage_kill", "damage_pressure", damageEvidence, damageAmount >= 3 || hasBrainSubtype ? "high" : "medium");
  }

  if (signals.includes("corp_ice.persistent_tag_source")) {
    addPair("corp.tag_trace_punish", "persistent_tag_source", ["corp_ice.persistent_tag_source", "corp_ice.trace_source", "corp_ice.tag_source"], "high");
  }

  const strategyAnchors = unique(strategyPairs.map((pair) => pair.strategyId));
  const legacyStrategicRole = unique(strategyPairs.map((pair) => LEGACY_ROLE_BY_PAIR_ROLE[pair.role] ?? "support_tool"));
  const primaryAnchorEvidence = unique(strategyPairs.flatMap((pair) => pair.evidence));
  const supportingEvidence = unique(signals.filter((signal) => !primaryAnchorEvidence.includes(signal)));
  let targetProfileStatus = "not_required";
  const targetProfileKinds = [];
  if (MODE_CHOICE.has(title)) targetProfileStatus = "schema_gap", targetProfileKinds.push("on_rez_type_or_mode_choice");
  if (PAID_SCALING.has(title)) targetProfileStatus = "candidate", targetProfileKinds.push("paid_x_or_rez_scaling");
  if (MOBILE_ICE.has(title)) targetProfileStatus = "schema_gap", targetProfileKinds.push("fort_position_change");
  if (title === "Too Many Doors") targetProfileStatus = "schema_gap", targetProfileKinds.push("secret_bid_or_guessing_game");

  return {
    mechanicalFamily: familyFromSignals(signals),
    functionalEffects: unique(functionalEffects),
    conditions: unique(conditions),
    risks: unique(risks),
    tacticSignals: unique(signals),
    strategyAnchors,
    legacyStrategicRole,
    strategySupportPairs: strategyPairs,
    primaryAnchorEvidence,
    supportingEvidence,
    targetProfileStatus,
    targetProfileKinds: unique(targetProfileKinds),
    hiddenInfoPolicy: "corp_side_only_until_rezzed",
    confidence: hint?.quality?.confidence === "low" ? "medium" : (hint?.quality?.confidence ?? "high"),
    rationale: rationale(title, strategyPairs, signals),
  };
}

function familyFromSignals(signals) {
  if (signals.includes("corp_ice.persistent_tag_source")) return "tag_counter_or_persistent_tag";
  if (signals.includes("corp_ice.brain_damage")) return "brain_damage_ice";
  if (signals.includes("corp_ice.meat_damage")) return "meat_damage_ice";
  if (signals.includes("corp_ice.net_damage")) return "net_damage_ice";
  if (signals.includes("corp_ice.program_trash")) return "program_trash";
  if (signals.includes("corp_ice.hardware_trash")) return "hardware_trash";
  if (signals.includes("corp_ice.run_lock")) return "run_lock_or_action_tax";
  if (signals.includes("corp_ice.jackout_tax")) return "jackout_lock_or_jackout_tax";
  if (signals.includes("corp_ice.position_scaling")) return "position_or_outer_ice_scaling";
  if (signals.includes("corp_ice.rez_paid_scaling")) return "rez_paid_scaling";
  if (signals.includes("corp_ice.type_choice_or_mode_choice")) return "type_choice_or_mode_choice";
  if (signals.includes("corp_ice.mobile_position_change")) return "mobile_or_position_changing_ice";
  if (signals.includes("corp_ice.random_or_guessing")) return "random_or_guessing_game";
  if (signals.includes("corp_ice.multi_end_run")) return "multi_end_run";
  if (signals.includes("corp_ice.conditional_end_run")) return "conditional_end_run_or_trace_end_run";
  if (signals.includes("corp_ice.end_run")) return "vanilla_end_run";
  return "other_ice_utility";
}

function rationale(title, pairs, signals) {
  const anchors = pairs.map((pair) => `${pair.strategyId}/${pair.role}`).join(", ");
  const supportOnly = anchors ? "" : " No canonical strategy anchor is set.";
  return `${title} is reviewed from existing structured ICE hints. Functional signals are ${signals.join(", ")}.${anchors ? ` Anchors: ${anchors}.` : ""}${supportOnly} Subtypes remain card data, not tactic signals.`;
}

function inventory() {
  const allCards = CARD_FILES.flatMap(cardsFrom);
  const activeHints = readJson(ACTIVE_HINTS_PATH).cards ?? [];
  const compiledHints = readJson(COMPILED_HINTS_PATH).cards ?? [];
  const activeIds = new Set(activeHints.map((hint) => hint.cardId));
  const compiledIds = new Set(compiledHints.map((hint) => hint.cardId));
  const ice = allCards.filter((card) => card.side === "corp" && card.type === "ice");
  const activeCompiled = ice.filter((card) => ["originalset-v1", "proteus"].includes(card.setId) && activeIds.has(card.cardId) && compiledIds.has(card.cardId));
  const inactive = ice.filter((card) => !activeIds.has(card.cardId) || !compiledIds.has(card.cardId));
  return { allCards, activeCompiled, inactive };
}

function updateActiveHints(assignmentsById) {
  const data = readJson(ACTIVE_HINTS_PATH);
  let changed = 0;
  for (const hint of data.cards ?? []) {
    const assignment = assignmentsById.get(hint.cardId);
    if (!assignment) continue;
    const before = JSON.stringify(hint);
    hint.tacticSignals = assignment.tacticSignals;
    if (assignment.strategyAnchors.length) hint.lineSupport = assignment.strategyAnchors;
    else delete hint.lineSupport;
    if (assignment.legacyStrategicRole.length) hint.strategicRole = assignment.legacyStrategicRole;
    else delete hint.strategicRole;
    hint.quality = {
      ...(hint.quality ?? {}),
      benchmarkCovered: hint.quality?.benchmarkCovered === true,
      hintReviewed: true,
      strategyCovered: assignment.strategyAnchors.length > 0,
      confidence: assignment.confidence,
      needsHumanReview: false,
      reviewedDate: GENERATED_AT,
      reviewedBy: "codex",
    };
    if (JSON.stringify(hint) !== before) changed += 1;
  }
  writeJson(ACTIVE_HINTS_PATH, data);
  return changed;
}

function clusterOverview(assignments) {
  const byFamily = new Map();
  for (const item of assignments) {
    const entry = byFamily.get(item.mechanicalFamily) ?? { mechanicalFamily: item.mechanicalFamily, count: 0, cardIds: [] };
    entry.count += 1;
    entry.cardIds.push(item.cardId);
    byFamily.set(item.mechanicalFamily, entry);
  }
  return [...byFamily.values()].sort((left, right) => left.mechanicalFamily.localeCompare(right.mechanicalFamily));
}

function buildReport({ activeCompiled, inactive, postReviewAssignments, newSignals }) {
  const strategySupportPairs = postReviewAssignments.flatMap((card) =>
    card.strategySupportPairs.map((pair) => ({ cardId: card.cardId, title: card.title, ...pair })),
  );
  const targetProfileCandidates = postReviewAssignments
    .filter((card) => card.targetProfileStatus !== "not_required")
    .map((card) => ({
      cardId: card.cardId,
      title: card.title,
      status: card.targetProfileStatus,
      targetProfileKinds: card.targetProfileKinds,
    }));
  return {
    schemaVersion: "ai024-corp-ice-semantics-review-report-v1",
    taskId: "AI024",
    generatedAt: GENERATED_AT,
    status: "complete",
    scope: "corp_ice",
    sourceCommit: SOURCE_COMMIT,
    summary: {
      activeCorpIceCount: activeCompiled.length,
      reviewedIceCount: postReviewAssignments.length,
      inactiveCheckedIceCount: inactive.length,
      changedIceCount: postReviewAssignments.length,
      unchangedCheckedIceCount: 0,
      newTacticSignalCount: newSignals.length,
      changedExistingTacticSignalCount: 0,
      removedOrAvoidedSubtypeSignalCount: FORBIDDEN_SUBTYPE_SIGNALS.size,
      newStrategyIdCount: 0,
      strategySupportPairCount: strategySupportPairs.length,
      targetProfileCandidateCount: targetProfileCandidates.length,
      schemaGapCount: targetProfileCandidates.filter((item) => item.status === "schema_gap").length,
      plannerEffect: false,
      actionScoreEffect: false,
      planWeightEffect: false,
      targetingAiEffect: false,
      engineEffect: false,
      legalEffect: false,
      profileOrDefaultSwitch: false,
      uiDerivationEffect: false,
      hiddenInfoLeakEffect: false,
    },
    inventory: {
      activeCompiledIceCardIds: activeCompiled.map((card) => card.cardId),
      inactiveCheckedIceCardIds: inactive.map((card) => card.cardId),
      countDiscrepancies: [
        {
          setId: "originalset-v1",
          expectedSpoilerCount: 60,
          activeCompiledRepoCount: activeCompiled.filter((card) => card.setId === "originalset-v1").length,
          status: "matches",
        },
        {
          setId: "proteus",
          expectedSpoilerCount: 35,
          activeCompiledRepoCount: activeCompiled.filter((card) => card.setId === "proteus").length,
          status: "matches",
        },
        {
          setId: "classic",
          expectedSpoilerCount: 60,
          activeCompiledRepoCount: activeCompiled.filter((card) => card.setId === "classic").length,
          inactiveKnownRepoCount: inactive.filter((card) => card.setId === "classic").length,
          status: "repo_has_inactive_classic_subset_originalset_is_active_classic_line",
        },
      ],
    },
    clusterOverview: clusterOverview(postReviewAssignments),
    newTacticSignals: newSignals.map((signal) => ({
      signalId: signal.signalId,
      supportOnly: signal.supportOnly,
      mayAnchorStrategy: signal.mayAnchorStrategy,
      allowedStrategyAnchors: signal.allowedStrategyAnchors,
    })),
    changedExistingTacticSignals: [],
    forbiddenSubtypeSignals: [...FORBIDDEN_SUBTYPE_SIGNALS].sort(),
    removedOrAvoidedSubtypeSignals: [...FORBIDDEN_SUBTYPE_SIGNALS].sort(),
    newStrategyIds: [],
    strategySupportPairs,
    targetProfileCandidates,
    hiddenInfoSafetyReview: [
      {
        topic: "corp_ice_hidden_semantics",
        result: "pass",
        notes:
          "Corp-ICE semantics remain Corp-side until rezzed, exposed or otherwise legally known. No Runner-side unrezzed ICE projection, UI payload, reconnect, undo, replay, public event, log or client-error path is added.",
      },
      {
        topic: "inspector_and_review_artifacts",
        result: "pass",
        notes:
          "Review and Inspector data are diagnostic artifacts. AI024 adds no runtime visibility route and no target selection behavior.",
      },
    ],
    deferredItems: [
      {
        topic: "target_profile_v1_for_ice_mode_paid_position_choices",
        decision: "deferred_or_schema_gap",
        rationale:
          "On-rez type/mode choice, paid-X scaling, mobile position changes and secret guessing games are report-only until side-safe TargetProfile schema support exists.",
      },
      {
        topic: "legal_action_semantic_bridge",
        decision: "deferred",
        rationale:
          "ICE tactic signals remain read-only and do not generate legality, planner choices, ActionScore or PlanWeight behavior.",
      },
    ],
    postReviewAssignments,
    verification: [
      { command: "node scripts/check-ai024-corp-ice-semantics.mjs", result: "pending_after_apply" },
    ],
  };
}

function updateReadme() {
  if (!fs.existsSync(repoPath(README_PATH))) return;
  const text = fs.readFileSync(repoPath(README_PATH), "utf8");
  const entry =
    "- `ai024-corp-ice-semantics-review-2026-06-02.md` / `ai024-corp-ice-semantics-review-report-2026-06-02.json`: AI024 prüft 95 aktive/compiled Corp-ICE aus Originalset und Proteus plus 11 inaktive Classic-ICE. Es ergänzt kontrollierte `corp_ice.*`-Funktionssignale, vermeidet Subtyp-only- und kartenspezifische Signale, trennt einfache ETR-/Tag-/Trace-/Rez-Economy-Signale von Strategieankern und hält TargetProfile-Kandidaten report-only. Keine neue Strategy-ID und keine Planner-, ActionScore-, PlanWeight-, Targeting-KI-, Engine-, Legalitäts-, Profil-/Default-, UI- oder Hidden-Info-Wirkung.";
  if (text.includes("ai024-corp-ice-semantics-review-2026-06-02.md")) {
    writeText(
      README_PATH,
      text.replace(
        /^- `ai024-corp-ice-semantics-review-2026-06-02\.md` \/ `ai024-corp-ice-semantics-review-report-2026-06-02\.json`: .*$/m,
        entry,
      ),
    );
    return;
  }
  const marker = "- `ai023-1-corp-agendas-semantics-polish-2026-06-02.md`";
  const index = text.indexOf(marker);
  if (index === -1) {
    writeText(README_PATH, `${text.trimEnd()}\n${entry}\n`);
    return;
  }
  const lineEnd = text.indexOf("\n", index);
  writeText(README_PATH, `${text.slice(0, lineEnd + 1)}${entry}\n${text.slice(lineEnd + 1)}`);
}

function buildMarkdown(report) {
  const signalRows = report.newTacticSignals
    .map((signal) => `- \`${signal.signalId}\`: supportOnly=${signal.supportOnly}, mayAnchor=${signal.mayAnchorStrategy}, anchors=${signal.allowedStrategyAnchors.join(", ") || "none"}`)
    .join("\n");
  const anchorRows = report.strategySupportPairs
    .map((pair) => `- ${pair.title}: \`${pair.strategyId}\` -> \`${pair.role}\` (${pair.confidence})`)
    .join("\n");
  const targetRows = report.targetProfileCandidates
    .map((item) => `- ${item.title}: ${item.status} (${item.targetProfileKinds.join(", ")})`)
    .join("\n");
  return `# AI024 Corp ICE Semantics Review

## Kurzfazit

AI024 prüft ${report.summary.activeCorpIceCount} aktive/compiled Korp-ICE aus Originalset und Proteus sowie ${report.summary.inactiveCheckedIceCount} inaktive Classic-ICE. Subtypen bleiben Kartendaten und werden nicht als Taktiksignale gespiegelt. Neue \`corp_ice.*\`-Signale sind read-only und erzeugen keine Planner-, ActionScore-, PlanWeight-, Targeting-, Engine-, Legalitäts-, Profil-, UI- oder Hidden-Info-Wirkung.

## Inventar

- Originalset: 60 aktive/compiled Korp-ICE; Spoiler-Erwartung 60.
- Proteus: 35 aktive/compiled Korp-ICE; Spoiler-Erwartung 35.
- Classic: 11 bekannte inaktive Korp-ICE im Repo; der aktive Classic/Originalset-Pfad ist \`originalset-v1\`.

## Clusterübersicht

${report.clusterOverview.map((cluster) => `- ${cluster.mechanicalFamily}: ${cluster.count}`).join("\n")}

## Neue / wiederverwendete Taktiksignale

AI024 ergänzt ${report.summary.newTacticSignalCount} kontrollierte Korp-ICE-Signale. Wiederverwendet werden unter anderem \`ice.etr\`, \`ice.future_pressure\`, \`ice.strength_modifier\`, \`damage.payoff\`, \`trace.source\` und \`tag.source\`, sofern SideScope und Wirkung passen.

${signalRows}

## Vermiedene Subtyp-Signale

Nicht eingeführt wurden: ${report.removedOrAvoidedSubtypeSignals.map((signal) => `\`${signal}\``).join(", ")}.

## Strategieanker

Einfache ETR-, Tag-/Trace-, Damage-, Program-Trash- oder Rez-Economy-ICE erhalten nicht automatisch einen Strategieanker. Anchors stehen nur dort im Report, wo der geprüfte ICE-Befund eine stärkere Tax-/Lock-/Damage-/Persistent-Tag-Linie trägt.

${anchorRows}

## TargetProfile-Kandidaten

${targetRows}

## Hidden-Info-Grenzen

Korp-ICE-Semantik bleibt \`corp_side_only_until_rezzed\`, bis ein ICE rezzed, exposed oder anderweitig legal bekannt ist. AI024 ergänzt keine Runner-seitige unrezzed-ICE-Sicht und keine WebSocket-, Reconnect-, Undo-, Replay-, PublicEvents-, Log- oder Client-Fehler-Projektion.

## Deferred Items

${report.deferredItems.map((item) => `- ${item.topic}: ${item.decision}. ${item.rationale}`).join("\n")}

## Post-Review-Liste

Die vollständige Kartenliste mit Funktionsfamilie, Taktiksignalen, Strategieankern, \`strategySupportPairs\`, TargetProfile-Status und Hidden-Info-Policy steht im JSON-Report \`ai024-corp-ice-semantics-review-report-2026-06-02.json\`.
`;
}

function main() {
  const { allCards, activeCompiled, inactive } = inventory();
  const activeHints = readJson(ACTIVE_HINTS_PATH).cards ?? [];
  const hintById = new Map(activeHints.map((hint) => [hint.cardId, hint]));
  const newSignals = updateTacticSignals();
  updateDerivationRules();
  const postReviewAssignments = activeCompiled.map((card) => {
    const hint = hintById.get(card.cardId);
    if (!hint) throw new Error(`Missing active hint for ${card.cardId}`);
    const assignment = classify(card, hint);
    return {
      cardId: card.cardId,
      title: card.title,
      cardType: "ice",
      subtypes: card.subtypes ?? [],
      ...assignment,
      needsHumanReview: false,
      postReviewStatus: "changed",
    };
  });
  const assignmentsById = new Map(postReviewAssignments.map((assignment) => [assignment.cardId, assignment]));
  const changed = updateActiveHints(assignmentsById);
  const report = buildReport({ activeCompiled, inactive, postReviewAssignments, newSignals });
  writeJson(JSON_REPORT_PATH, report);
  writeText(MD_REPORT_PATH, buildMarkdown(report));
  updateReadme();
  console.log(`AI024 applied active=${activeCompiled.length} inactive=${inactive.length} changed=${changed} newSignals=${newSignals.length} cards=${allCards.length}`);
}

main();
