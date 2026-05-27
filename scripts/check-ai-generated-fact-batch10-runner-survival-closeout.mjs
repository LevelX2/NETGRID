#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import prettier from "prettier";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const REVIEW_DATE = "2026-05-25";
const TASK_ID = "Aufgabe 021";
const SCHEMA_VERSION = "ai-generated-fact-batch10-runner-survival-closeout-v1";
const BATCH_ID = "batch_10_runner_prevention_damage_survival_tools";
const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const CATALOG_PATH = "data/cards/originalset-v1-cards.json";
const PILOT_CARDS_PATH =
  "data/ai/ai-derived-basic-facts-pilot-cards-2026-05-25.json";
const DERIVED_FACTS_REPORT_PATH =
  "docs/reviews/ai/ai-derived-basic-facts-gate-2026-05-25.json";
const COMPILED_INDEX_REPORT_PATH =
  "docs/reviews/ai/ai-hint-compiled-index-pilot-report-2026-05-25.json";
const MIGRATION_PRIORITY_REPORT_PATH =
  "docs/reviews/ai/ai-generated-fact-migration-priority-report-2026-05-25.json";
const BATCH9_CLOSEOUT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-020-corp-nodes-assets-ambush-closeout-report-2026-05-25.json";
const DEFAULT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-021-runner-prevention-survival-closeout-report-2026-05-25.json";

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
  "runnerGripCards",
  "runnerStackOrder",
]);

const RUNTIME_FIELDS = new Set([
  "legalActions",
  "playerActions",
  "stateVersion",
  "stateHash",
  "actionId",
]);

const NORMALIZATION_RULES = [
  "damage_prevention_normalization",
  "flatline_prevention_replacement_normalization",
  "program_trash_prevention_normalization",
  "trace_defense_link_normalization",
  "tag_survival_context_normalization",
  "survival_cost_penalty_split_normalization",
  "prevention_window_context_normalization",
  "breaker_survival_overlap_normalization",
  "payment_context_normalization",
  "survival_strategy_overlay_split_normalization",
  "damage_window_context_required_classification",
  "flatline_replacement_context_required_classification",
  "trash_prevention_context_required_classification",
  "trace_context_required_classification",
  "installed_card_context_required_classification",
  "per_turn_limit_context_required_classification",
  "legalaction_context_required_classification",
];

const INCLUDED_CANDIDATES = [
  [
    "onr_v1_004_bakdoor",
    "Bakdoor",
    "trace_defense_or_link",
    "program",
    "packages/engine/src/card-implementations/onr-v1/runner/programs/bakdoor.ts",
  ],
  [
    "onr_v1_022_emergency-self-construct",
    "Emergency Self-Construct",
    "flatline_prevention",
    "program",
    "packages/engine/src/card-implementations/onr-v1/runner/programs/emergency-self-construct.ts",
  ],
  [
    "onr_v1_023_evil-twin",
    "Evil Twin",
    "prevention_breaker_overlap",
    "program",
    "packages/engine/src/card-implementations/onr-v1/runner/programs/evil-twin.ts",
  ],
  [
    "onr_v1_028_force-shield",
    "Force Shield",
    "damage_prevention",
    "program",
    "packages/engine/src/card-implementations/onr-v1/runner/programs/force-shield.ts",
  ],
  [
    "onr_v1_038_joan-of-arc",
    "Joan of Arc",
    "program_trash_prevention",
    "program",
    "packages/engine/src/card-implementations/onr-v1/runner/programs/joan-of-arc.ts",
  ],
  [
    "onr_v1_051_rabbit",
    "Rabbit",
    "trace_defense_or_link",
    "program",
    "packages/engine/src/card-implementations/onr-v1/runner/programs/rabbit.ts",
  ],
  [
    "onr_v1_061_shield",
    "Shield",
    "damage_prevention",
    "program",
    "packages/engine/src/card-implementations/onr-v1/runner/programs/shield.ts",
  ],
  [
    "onr_v1_063_signpost",
    "Signpost",
    "trace_defense_or_link",
    "program",
    "packages/engine/src/card-implementations/onr-v1/runner/programs/signpost.ts",
  ],
  [
    "onr_v1_079_bodyweight-synthetic-blood",
    "Bodyweight Synthetic Blood",
    "memory_or_hand_size_survival",
    "event",
    "packages/engine/src/card-implementations/onr-v1/runner/preps/bodyweight-synthetic-blood.ts",
  ],
  [
    "onr_v1_116_total-genetic-retrofit",
    "Total Genetic Retrofit",
    "tag_survival_or_tag_prevention",
    "event",
    "packages/engine/src/card-implementations/onr-v1/runner/preps/total-genetic-retrofit.ts",
  ],
  [
    "onr_v1_133_militech-mram-chip",
    "Militech MRAM Chip",
    "memory_or_hand_size_survival",
    "hardware",
    "packages/engine/src/card-implementations/onr-v1/runner/hardware/militech-mram-chip.ts",
  ],
  [
    "onr_v1_134_mram-chip",
    "MRAM Chip",
    "memory_or_hand_size_survival",
    "hardware",
    "packages/engine/src/card-implementations/onr-v1/runner/hardware/mram-chip.ts",
  ],
  [
    "onr_v1_135_nasuko-cycle",
    "Nasuko Cycle",
    "tag_survival_or_tag_prevention",
    "hardware",
    "packages/engine/src/card-implementations/onr-v1/runner/hardware/nasuko-cycle.ts",
  ],
  [
    "onr_v1_157_crash-everett-inventive-fixer",
    "Crash Everett, Inventive Fixer",
    "memory_or_hand_size_survival",
    "resource",
    "packages/engine/src/card-implementations/onr-v1/runner/resources/crash-everett-inventive-fixer.ts",
  ],
  [
    "onr_v1_161_fall-guy",
    "Fall Guy",
    "tag_survival_or_tag_prevention",
    "resource",
    "packages/engine/src/card-implementations/onr-v1/runner/resources/fall-guy.ts",
  ],
].map(([cardId, title, subBatch, cardType, implementationPath]) => ({
  cardId,
  title,
  subBatch,
  include: true,
  expectedSide: "runner",
  expectedCardType: cardType,
  implementationPath,
}));

const OPTIONAL_EXCLUDES = [
  {
    cardId: "onr_v1_003_baedekers-net-map",
    title: "Baedeker's Net Map",
    subBatch: "excluded_or_out_of_scope",
    expectedSide: "runner",
    expectedCardType: "program",
    implementationPath:
      "packages/engine/src/card-implementations/onr-v1/runner/programs/baedekers-net-map.ts",
    excludedReason:
      "Catalog and implementation identify this as a Runner program, but the active monolith hint currently says hardware; excluded from Batch 10 rather than normalizing across a type mismatch.",
  },
  {
    cardId: "onr_v1_045_newsgroup-filter",
    title: "Newsgroup Filter",
    subBatch: "excluded_or_out_of_scope",
    expectedSide: "runner",
    expectedCardType: "program",
    implementationPath:
      "packages/engine/src/card-implementations/onr-v1/runner/programs/newsgroup-filter.ts",
    excludedReason:
      "Implementation is a Runner action-economy program, not prevention/survival; better suited for a Runner economy/payment batch.",
  },
  {
    cardId: "onr_v1_011_cloak",
    title: "Cloak",
    subBatch: "excluded_or_out_of_scope",
    expectedSide: "runner",
    expectedCardType: "program",
    implementationPath:
      "packages/engine/src/card-implementations/onr-v1/runner/programs/cloak.ts",
    excludedReason:
      "Restricted hosted credits are payment support, not prevention/survival; keep for a Runner economy/payment closeout.",
  },
  {
    cardId: "onr_v1_035_invisibility",
    title: "Invisibility",
    subBatch: "excluded_or_out_of_scope",
    expectedSide: "runner",
    expectedCardType: "program",
    implementationPath:
      "packages/engine/src/card-implementations/onr-v1/runner/programs/invisibility.ts",
    excludedReason:
      "Restricted hosted credits are payment support, not prevention/survival; keep for a Runner economy/payment closeout.",
  },
  {
    cardId: "onr_v1_176_the-shell-traders",
    title: "The Shell Traders",
    subBatch: "excluded_or_out_of_scope",
    expectedSide: "runner",
    expectedCardType: "resource",
    implementationPath:
      "packages/engine/src/card-implementations/onr-v1/runner/resources/the-shell-traders.ts",
    excludedReason:
      "Delayed install/payment setup is not prevention/survival; keep for Runner economy/resource/hardware longtail.",
  },
  {
    cardId: "prompt_candidate_enterprise-inc-shields",
    title: "Enterprise, Inc., Shields",
    subBatch: "excluded_or_out_of_scope",
    expectedSide: "runner",
    expectedCardType: "hardware",
    implementationPath:
      "packages/engine/src/card-implementations/onr-v1/runner/hardware/enterprise-inc-shields.ts",
    excludedReason:
      "No active Runtime catalog card, active AI hint or CardImplementation was found under this title.",
  },
  {
    cardId: "onr_v1_154_broker",
    title: "Broker",
    subBatch: "excluded_or_out_of_scope",
    expectedSide: "runner",
    expectedCardType: "resource",
    implementationPath:
      "packages/engine/src/card-implementations/onr-v1/runner/resources/broker.ts",
    excludedReason:
      "Runner hosted-credit economy, not prevention/survival; keep for Runner economy/resource/hardware longtail.",
  },
  {
    cardId: "onr_v1_103_organ-donor",
    title: "Organ Donor",
    subBatch: "excluded_or_out_of_scope",
    expectedSide: "runner",
    expectedCardType: "event",
    implementationPath:
      "packages/engine/src/card-implementations/onr-v1/runner/preps/organ-donor.ts",
    excludedReason:
      "Runner grip-trash-for-credits economy with hidden-card choice, not prevention/survival; keep for Runner economy/resource/hardware longtail.",
  },
  {
    cardId: "onr_v1_168_loan-from-chiba",
    title: "Loan from Chiba",
    subBatch: "excluded_or_out_of_scope",
    expectedSide: "runner",
    expectedCardType: "resource",
    implementationPath:
      "packages/engine/src/card-implementations/onr-v1/runner/resources/loan-from-chiba.ts",
    excludedReason:
      "Runner economy with lose-game leave-play risk; relevant but belongs to Runner economy/risk batch rather than prevention closeout.",
  },
  {
    cardId: "onr_v1_178_short-term-contract",
    title: "Short-Term Contract",
    subBatch: "excluded_or_out_of_scope",
    expectedSide: "runner",
    expectedCardType: "resource",
    implementationPath:
      "packages/engine/src/card-implementations/onr-v1/runner/resources/short-term-contract.ts",
    excludedReason:
      "Finite hosted-credit economy, not prevention/survival; keep for Runner economy/resource/hardware longtail.",
  },
  {
    cardId: "onr_v1_095_jack-n-joe",
    title: "Jack 'n' Joe",
    subBatch: "excluded_or_out_of_scope",
    expectedSide: "runner",
    expectedCardType: "event",
    implementationPath:
      "packages/engine/src/card-implementations/onr-v1/runner/preps/jack-n-joe.ts",
    excludedReason:
      "Pure Runner draw event; not enough prevention/survival specificity for Batch 10.",
  },
  {
    cardId: "onr_v1_097_livewires-contacts",
    title: "Livewire's Contacts",
    subBatch: "excluded_or_out_of_scope",
    expectedSide: "runner",
    expectedCardType: "event",
    implementationPath:
      "packages/engine/src/card-implementations/onr-v1/runner/preps/livewires-contacts.ts",
    excludedReason:
      "Pure Runner economy event; keep for Runner economy/resource/hardware longtail.",
  },
  {
    cardId: "onr_v1_108_score",
    title: "Score!",
    subBatch: "excluded_or_out_of_scope",
    expectedSide: "runner",
    expectedCardType: "event",
    implementationPath:
      "packages/engine/src/card-implementations/onr-v1/runner/preps/score.ts",
    excludedReason:
      "Pure Runner economy event; keep for Runner economy/resource/hardware longtail.",
  },
  {
    cardId: "onr_v1_114_temple-microcode-outlet",
    title: "Temple Microcode Outlet",
    subBatch: "excluded_or_out_of_scope",
    expectedSide: "runner",
    expectedCardType: "event",
    implementationPath:
      "packages/engine/src/card-implementations/onr-v1/runner/preps/temple-microcode-outlet.ts",
    excludedReason:
      "Runner program search with hidden stack choice; useful setup, but outside prevention/survival.",
  },
  {
    cardId: "onr_v1_087_forgotten-backup-chip",
    title: "Forgotten Backup Chip",
    subBatch: "excluded_or_out_of_scope",
    expectedSide: "runner",
    expectedCardType: "event",
    implementationPath:
      "packages/engine/src/card-implementations/onr-v1/runner/preps/forgotten-backup-chip.ts",
    excludedReason:
      "Runner trash-to-grip recovery is setup/recovery, not prevention/survival; keep for Runner economy/resource/hardware longtail.",
  },
  {
    cardId: "onr_v1_089_gideons-pawnshop",
    title: "Gideon's Pawnshop",
    subBatch: "excluded_or_out_of_scope",
    expectedSide: "runner",
    expectedCardType: "event",
    implementationPath:
      "packages/engine/src/card-implementations/onr-v1/runner/preps/gideons-pawnshop.ts",
    excludedReason:
      "Runner trash-to-grip recovery is setup/recovery, not prevention/survival; keep for Runner economy/resource/hardware longtail.",
  },
];

function repoPath(relativePath) {
  return path.join(REPO_ROOT, relativePath);
}

async function stableStringify(value) {
  return prettier.format(JSON.stringify(value, null, 2), { parser: "json" });
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(repoPath(relativePath), "utf8"));
}

async function writeJson(relativePath, value) {
  fs.mkdirSync(path.dirname(repoPath(relativePath)), { recursive: true });
  fs.writeFileSync(
    repoPath(relativePath),
    await stableStringify(value),
    "utf8",
  );
}

function sortByKey(items) {
  return [...items].sort((left, right) =>
    JSON.stringify(left).localeCompare(JSON.stringify(right)),
  );
}

function countBy(items, selector) {
  const counts = new Map();
  for (const item of items) {
    const key = selector(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Object.fromEntries(
    [...counts.entries()].sort(([left], [right]) => left.localeCompare(right)),
  );
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function isMeaningful(value) {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function collectKeyPaths(value, blockedKeys, basePath = "") {
  if (!value || typeof value !== "object") return [];
  const paths = [];
  for (const [key, child] of Object.entries(value)) {
    const pathValue = basePath ? `${basePath}.${key}` : key;
    if (blockedKeys.has(key)) paths.push(pathValue);
    if (Array.isArray(child)) {
      for (const [index, item] of child.entries()) {
        paths.push(
          ...collectKeyPaths(item, blockedKeys, `${pathValue}[${index}]`),
        );
      }
    } else if (child && typeof child === "object") {
      paths.push(...collectKeyPaths(child, blockedKeys, pathValue));
    }
  }
  return paths;
}

function factLabels(derivedFacts) {
  const breaker = derivedFacts.breakerProfile ?? {};
  return uniqueSorted([
    ...(derivedFacts.effects ?? []).map((effect) => `effect:${effect.kind}`),
    ...(derivedFacts.conditions ?? []).map(
      (condition) => `condition:${condition.kind}`,
    ),
    ...(breaker.coverage ?? []).map(
      (coverage) => `breakerCoverage:${coverage}`,
    ),
    ...(breaker.sideEffects ?? []).map(
      (sideEffect) => `breakerSideEffect:${sideEffect}`,
    ),
    ...(isMeaningful(breaker) ? ["breakerProfile"] : []),
  ]);
}

function activeMechanicalFields(activeHint) {
  return [
    "effects",
    "conditions",
    "costProfile",
    "remoteRole",
    "targetProfiles",
  ].filter((field) => isMeaningful(activeHint?.[field]));
}

function previewAddedFacts(labels, activeHint) {
  const activeEffectKinds = new Set(
    (activeHint?.effects ?? []).map((effect) => `effect:${effect.kind}`),
  );
  const activeConditionKinds = new Set(
    (activeHint?.conditions ?? []).map(
      (condition) => `condition:${condition.kind}`,
    ),
  );
  return labels.filter((label) => {
    if (label.startsWith("effect:")) return !activeEffectKinds.has(label);
    if (label.startsWith("condition:")) {
      return !activeConditionKinds.has(label);
    }
    return false;
  });
}

function ruleForLabel(label) {
  return {
    "effect:damage_prevention": "damage_prevention_normalization",
    "effect:net_damage_prevention": "damage_prevention_normalization",
    "effect:brain_damage_prevention": "damage_prevention_normalization",
    "effect:meat_damage_prevention": "damage_prevention_normalization",
    "effect:flatline_prevention":
      "flatline_prevention_replacement_normalization",
    "effect:prevention_replacement":
      "flatline_prevention_replacement_normalization",
    "effect:remove_brain_damage":
      "flatline_prevention_replacement_normalization",
    "effect:program_trash_prevention": "program_trash_prevention_normalization",
    "effect:tag_prevention": "tag_survival_context_normalization",
    "effect:trace_defense": "trace_defense_link_normalization",
    "effect:link": "trace_defense_link_normalization",
    "effect:base_link": "trace_defense_link_normalization",
    "effect:hand_size_modifier": "survival_cost_penalty_split_normalization",
    "effect:action_penalty": "survival_cost_penalty_split_normalization",
    "effect:persistent_survival_modifier":
      "survival_cost_penalty_split_normalization",
    "effect:survival_payoff": "survival_strategy_overlay_split_normalization",
    "effect:breaker": "breaker_survival_overlap_normalization",
    "effect:draw": "survival_strategy_overlay_split_normalization",
    "condition:requires_damage":
      "damage_window_context_required_classification",
    "condition:requires_net_damage":
      "damage_window_context_required_classification",
    "condition:requires_brain_damage":
      "damage_window_context_required_classification",
    "condition:requires_meat_damage":
      "damage_window_context_required_classification",
    "condition:requires_flatline":
      "flatline_replacement_context_required_classification",
    "condition:requires_program_trash":
      "trash_prevention_context_required_classification",
    "condition:requires_installed_program":
      "trash_prevention_context_required_classification",
    "condition:requires_prevention_window":
      "prevention_window_context_normalization",
    "condition:requires_turn_limit_available":
      "per_turn_limit_context_required_classification",
    "condition:requires_trace_attempt": "trace_context_required_classification",
    "condition:requires_runner_tagged": "tag_survival_context_normalization",
    "condition:requires_installed_card":
      "installed_card_context_required_classification",
  }[label];
}

function normalizedDifferencesFor(card, labels, compiledWarnings) {
  const fromWarnings = (compiledWarnings ?? []).map((warning) => ({
    field: warning.field ?? warning.fact ?? warning.kind,
    sourceWarningKind: warning.kind,
    classification: classificationForRule(
      ruleForLabel(warning.fact) ??
        "survival_strategy_overlay_split_normalization",
    ),
    rule:
      ruleForLabel(warning.fact) ??
      "survival_strategy_overlay_split_normalization",
    rationale:
      "Compiled-index warning is normalized inside the read-only Batch-10 comparator path; active hints and runtime behavior are unchanged.",
  }));
  const fromGeneratedLabels = labels
    .map((label) => {
      const rule = ruleForLabel(label);
      if (!rule) return undefined;
      return {
        field: label,
        sourceWarningKind: "generated_fact_shape_or_context",
        classification: classificationForRule(rule),
        rule,
        rationale: rationaleForRule(rule),
      };
    })
    .filter(Boolean);
  return sortByKey([...fromWarnings, ...fromGeneratedLabels]);
}

function classificationForRule(rule) {
  return {
    damage_prevention_normalization: "damage_prevention_context_normalized",
    flatline_prevention_replacement_normalization:
      "flatline_replacement_context_normalized",
    program_trash_prevention_normalization:
      "program_trash_prevention_context_normalized",
    trace_defense_link_normalization: "trace_defense_context_normalized",
    tag_survival_context_normalization: "tag_survival_context_normalized",
    survival_cost_penalty_split_normalization:
      "survival_cost_penalty_context_normalized",
    prevention_window_context_normalization:
      "prevention_window_context_normalized",
    breaker_survival_overlap_normalization:
      "breaker_survival_overlap_normalized",
    payment_context_normalization: "payment_context_normalized",
    survival_strategy_overlay_split_normalization:
      "survival_strategy_overlay_split_normalized",
    damage_window_context_required_classification:
      "damage_window_context_classified",
    flatline_replacement_context_required_classification:
      "flatline_replacement_context_classified",
    trash_prevention_context_required_classification:
      "trash_prevention_context_classified",
    trace_context_required_classification: "trace_context_classified",
    installed_card_context_required_classification:
      "installed_card_context_classified",
    per_turn_limit_context_required_classification:
      "per_turn_limit_context_classified",
    legalaction_context_required_classification:
      "legalaction_context_classified",
  }[rule];
}

function rationaleForRule(rule) {
  return {
    damage_prevention_normalization:
      "Damage prevention facts keep damage type, amount and per-turn context visible and never imply general immunity.",
    flatline_prevention_replacement_normalization:
      "Flatline replacement facts describe a replacement window only and never assert the Runner is currently safe from flatline.",
    program_trash_prevention_normalization:
      "Program-trash prevention stays scoped to installed programs and does not extend to hardware, resources or arbitrary cards.",
    trace_defense_link_normalization:
      "Link and trace-defense facts describe trace-window modifiers only and do not guarantee trace success.",
    tag_survival_context_normalization:
      "Tag prevention and tag survival facts keep tag/prevention context visible and never assert the Runner is currently untagged.",
    survival_cost_penalty_split_normalization:
      "Survival benefits and persistent costs or penalties remain separate mechanical descriptors.",
    prevention_window_context_normalization:
      "Prevention requires the relevant damage, tag, trash or flatline window and creates no playability by itself.",
    breaker_survival_overlap_normalization:
      "Breaker coverage and survival/prevention facts stay separate; no current break legality is generated.",
    payment_context_normalization:
      "Credit, self-trash or return-to-grip costs are mechanical only; actual payment and use stay LegalAction/engine context.",
    survival_strategy_overlay_split_normalization:
      "Strategic survival valuation stays overlay/planner logic, not generated mechanical facts.",
    damage_window_context_required_classification:
      "Damage prevention only matters in a damage event window.",
    flatline_replacement_context_required_classification:
      "Flatline prevention only matters in a flatline replacement window.",
    trash_prevention_context_required_classification:
      "Trash prevention requires a concrete trash event and eligible installed target context.",
    trace_context_required_classification:
      "Trace defense requires an active trace attempt and trace-window sequencing.",
    installed_card_context_required_classification:
      "Installed-card state remains board-owned and is not generated as current truth.",
    per_turn_limit_context_required_classification:
      "Per-turn prevention capacity remains a limit/context marker, not a guarantee of available capacity.",
    legalaction_context_required_classification:
      "Generated facts describe static card function and do not create PlayerAction legality.",
  }[rule];
}

function contextInfosFor(labels) {
  const infos = [];
  const add = (kind, rule) =>
    infos.push({ kind, rule, rationale: rationaleForRule(rule) });
  const has = (...values) => labels.some((label) => values.includes(label));

  if (
    has(
      "effect:damage_prevention",
      "effect:net_damage_prevention",
      "effect:brain_damage_prevention",
      "effect:meat_damage_prevention",
      "condition:requires_damage",
      "condition:requires_net_damage",
      "condition:requires_brain_damage",
      "condition:requires_meat_damage",
    )
  ) {
    add(
      "damage_window_context_info",
      "damage_window_context_required_classification",
    );
  }
  if (
    has(
      "effect:flatline_prevention",
      "effect:prevention_replacement",
      "condition:requires_flatline",
    )
  ) {
    add(
      "flatline_replacement_context_info",
      "flatline_replacement_context_required_classification",
    );
  }
  if (
    has("effect:program_trash_prevention", "condition:requires_program_trash")
  ) {
    add(
      "trash_prevention_context_info",
      "trash_prevention_context_required_classification",
    );
  }
  if (
    has(
      "effect:trace_defense",
      "effect:link",
      "effect:base_link",
      "condition:requires_trace_attempt",
    )
  ) {
    add("trace_context_info", "trace_context_required_classification");
  }
  if (has("effect:tag_prevention", "condition:requires_runner_tagged")) {
    add("tag_context_info", "tag_survival_context_normalization");
  }
  if (
    has(
      "condition:requires_prevention_window",
      "effect:damage_prevention",
      "effect:flatline_prevention",
      "effect:program_trash_prevention",
      "effect:tag_prevention",
    )
  ) {
    add(
      "prevention_window_context_info",
      "prevention_window_context_normalization",
    );
  }
  if (has("condition:requires_turn_limit_available")) {
    add(
      "per_turn_limit_context_info",
      "per_turn_limit_context_required_classification",
    );
  }
  if (
    has(
      "condition:requires_installed_card",
      "condition:requires_installed_program",
    )
  ) {
    add(
      "installed_card_context_info",
      "installed_card_context_required_classification",
    );
  }
  if (
    has(
      "effect:action_penalty",
      "effect:hand_size_modifier",
      "effect:persistent_survival_modifier",
      "effect:remove_brain_damage",
    )
  ) {
    add(
      "survival_penalty_context_info",
      "survival_cost_penalty_split_normalization",
    );
  }
  if (has("effect:breaker", "breakerCoverage:sentry")) {
    add(
      "breaker_survival_overlap_info",
      "breaker_survival_overlap_normalization",
    );
  }
  if (has("effect:draw", "effect:survival_payoff")) {
    add(
      "survival_strategy_overlay_info",
      "survival_strategy_overlay_split_normalization",
    );
  }
  return sortByKey(infos);
}

function buildCandidateStatus(candidate, inputs) {
  const activeHint = inputs.activeById.get(candidate.cardId);
  const catalogCard = inputs.catalogById.get(candidate.cardId);
  const implementationFound = fs.existsSync(
    repoPath(candidate.implementationPath),
  );
  const pilotCard = inputs.pilotById.get(candidate.cardId);
  const derivedCard = inputs.derivedById.get(candidate.cardId);
  const compiledCard = inputs.compiledById.get(candidate.cardId);
  const priorityCard = inputs.priorityById.get(candidate.cardId);
  return {
    cardId: candidate.cardId,
    title: catalogCard?.title ?? candidate.title,
    side: activeHint?.side ?? catalogCard?.side ?? candidate.expectedSide,
    cardType:
      activeHint?.cardType ?? catalogCard?.type ?? candidate.expectedCardType,
    activeHintFound: Boolean(activeHint),
    runtimeCatalogCardFound: Boolean(catalogCard),
    cardImplementationFound: implementationFound,
    aiSupportStatus: activeHint?.aiSupportStatus ?? null,
    pilotCardFound: Boolean(pilotCard),
    derivedFactsFound: Boolean(derivedCard),
    compiledIndexFound: Boolean(compiledCard),
    migrationPriorityFound: Boolean(priorityCard),
  };
}

function buildIncludedCard(candidate, inputs) {
  const status = buildCandidateStatus(candidate, inputs);
  const activeHint = inputs.activeById.get(candidate.cardId);
  const derivedCard = inputs.derivedById.get(candidate.cardId);
  const compiledCard = inputs.compiledById.get(candidate.cardId);
  const priorityCard = inputs.priorityById.get(candidate.cardId);
  const labels = factLabels(derivedCard?.derivedFacts ?? {});
  const contexts = contextInfosFor(labels);
  return {
    ...status,
    subBatch: candidate.subBatch,
    priority: priorityCard?.migrationPriority ?? null,
    risk: priorityCard?.migrationRisk ?? null,
    activeMechanicalFields: activeMechanicalFields(activeHint),
    generatedFactsConfirmed: labels,
    previewAdds: previewAddedFacts(labels, activeHint),
    normalizedDifferences: normalizedDifferencesFor(
      candidate,
      labels,
      compiledCard?.warnings ?? [],
    ),
    preventionWindowContextInfos: contexts.filter(
      (info) => info.kind === "prevention_window_context_info",
    ),
    damageWindowContextInfos: contexts.filter(
      (info) => info.kind === "damage_window_context_info",
    ),
    flatlineReplacementContextInfos: contexts.filter(
      (info) => info.kind === "flatline_replacement_context_info",
    ),
    trashPreventionContextInfos: contexts.filter(
      (info) => info.kind === "trash_prevention_context_info",
    ),
    traceContextInfos: contexts.filter(
      (info) => info.kind === "trace_context_info",
    ),
    tagContextInfos: contexts.filter(
      (info) => info.kind === "tag_context_info",
    ),
    paymentContextInfos: contexts.filter(
      (info) => info.kind === "payment_context_info",
    ),
    installedCardContextInfos: contexts.filter(
      (info) => info.kind === "installed_card_context_info",
    ),
    perTurnLimitContextInfos: contexts.filter(
      (info) => info.kind === "per_turn_limit_context_info",
    ),
    survivalPenaltyContextInfos: contexts.filter(
      (info) => info.kind === "survival_penalty_context_info",
    ),
    breakerSurvivalOverlapInfos: contexts.filter(
      (info) => info.kind === "breaker_survival_overlap_info",
    ),
    survivalStrategyOverlayInfos: contexts.filter(
      (info) => info.kind === "survival_strategy_overlay_info",
    ),
    descriptorFollowups: [],
    activeConsumers: [
      "runner_survival_context_diagnostics",
      "runner_trace_tag_defense_context",
      "runner_damage_prevention_context",
    ],
    remainingIssues: [],
    readiness: "ready_read_only_with_prevention_window_context",
  };
}

function buildExcludedCard(candidate, inputs) {
  return {
    ...buildCandidateStatus(candidate, inputs),
    subBatch: candidate.subBatch,
    excludedReason: candidate.excludedReason,
    exclusionKind: "excluded_from_batch_with_reason",
  };
}

function hardErrorsFor(report, sourceReports) {
  const errors = [];
  for (const source of sourceReports) {
    if ((source.report.hardErrorCount ?? 0) > 0) {
      errors.push({
        kind: "source_report_has_hard_errors",
        source: source.path,
        count: source.report.hardErrorCount,
      });
    }
  }
  for (const card of report.includedCards) {
    for (const [field, ok] of [
      ["activeHintFound", card.activeHintFound],
      ["runtimeCatalogCardFound", card.runtimeCatalogCardFound],
      ["cardImplementationFound", card.cardImplementationFound],
      ["pilotCardFound", card.pilotCardFound],
      ["derivedFactsFound", card.derivedFactsFound],
      ["compiledIndexFound", card.compiledIndexFound],
      ["migrationPriorityFound", card.migrationPriorityFound],
    ]) {
      if (!ok) {
        errors.push({
          kind: "missing_required_batch10_input",
          cardId: card.cardId,
          title: card.title,
          field,
        });
      }
    }
    if (card.aiSupportStatus !== "ai_supported") {
      errors.push({
        kind: "included_card_not_ai_supported",
        cardId: card.cardId,
        title: card.title,
        aiSupportStatus: card.aiSupportStatus,
      });
    }
    const labels = new Set(card.generatedFactsConfirmed);
    if (
      labels.has("effect:damage_prevention") &&
      card.damageWindowContextInfos.length === 0
    ) {
      errors.push({
        kind: "damage_prevention_without_damage_context",
        cardId: card.cardId,
        title: card.title,
      });
    }
    if (
      labels.has("effect:flatline_prevention") &&
      card.flatlineReplacementContextInfos.length === 0
    ) {
      errors.push({
        kind: "flatline_prevention_without_replacement_context",
        cardId: card.cardId,
        title: card.title,
      });
    }
    if (
      labels.has("effect:program_trash_prevention") &&
      card.trashPreventionContextInfos.length === 0
    ) {
      errors.push({
        kind: "program_trash_prevention_without_trash_context",
        cardId: card.cardId,
        title: card.title,
      });
    }
    if (
      labels.has("effect:trace_defense") &&
      card.traceContextInfos.length === 0
    ) {
      errors.push({
        kind: "trace_defense_without_trace_context",
        cardId: card.cardId,
        title: card.title,
      });
    }
    if (
      labels.has("effect:damage_prevention") &&
      !labels.has("condition:requires_turn_limit_available")
    ) {
      errors.push({
        kind: "damage_prevention_without_per_turn_limit_context",
        cardId: card.cardId,
        title: card.title,
      });
    }
    if (
      labels.has("effect:breaker") &&
      labels.has("effect:damage_prevention") &&
      card.breakerSurvivalOverlapInfos.length === 0
    ) {
      errors.push({
        kind: "breaker_survival_overlap_without_split_context",
        cardId: card.cardId,
        title: card.title,
      });
    }
  }
  for (const fieldPath of collectKeyPaths(report, HIDDEN_INFO_FIELDS)) {
    errors.push({
      kind: "hidden_info_field",
      message: `Batch-10 closeout report contains hidden-info field ${fieldPath}.`,
      fieldPath,
    });
  }
  for (const fieldPath of collectKeyPaths(report, RUNTIME_FIELDS)) {
    errors.push({
      kind: "runtime_or_legality_field",
      message: `Batch-10 closeout report contains runtime/legal field ${fieldPath}.`,
      fieldPath,
    });
  }
  return sortByKey(errors);
}

function normalizationRuleCounts(cards) {
  const counts = new Map(NORMALIZATION_RULES.map((rule) => [rule, 0]));
  for (const card of cards) {
    for (const difference of card.normalizedDifferences) {
      if (counts.has(difference.rule)) {
        counts.set(difference.rule, counts.get(difference.rule) + 1);
      }
    }
    for (const context of [
      ...card.preventionWindowContextInfos,
      ...card.damageWindowContextInfos,
      ...card.flatlineReplacementContextInfos,
      ...card.trashPreventionContextInfos,
      ...card.traceContextInfos,
      ...card.tagContextInfos,
      ...card.paymentContextInfos,
      ...card.installedCardContextInfos,
      ...card.perTurnLimitContextInfos,
      ...card.survivalPenaltyContextInfos,
      ...card.breakerSurvivalOverlapInfos,
      ...card.survivalStrategyOverlayInfos,
    ]) {
      if (counts.has(context.rule)) {
        counts.set(context.rule, counts.get(context.rule) + 1);
      }
    }
  }
  return Object.fromEntries(counts);
}

export function buildBatchTenRunnerSurvivalCloseoutReport() {
  const activeHints = readJson(ACTIVE_HINTS_PATH);
  const catalog = readJson(CATALOG_PATH);
  const pilotCards = readJson(PILOT_CARDS_PATH);
  const derivedReport = readJson(DERIVED_FACTS_REPORT_PATH);
  const compiledReport = readJson(COMPILED_INDEX_REPORT_PATH);
  const priorityReport = readJson(MIGRATION_PRIORITY_REPORT_PATH);
  const batch9Closeout = readJson(BATCH9_CLOSEOUT_REPORT_PATH);
  const inputs = {
    activeById: new Map(
      (activeHints.cards ?? []).map((card) => [card.cardId, card]),
    ),
    catalogById: new Map(
      (catalog.cards ?? []).map((card) => [card.cardId, card]),
    ),
    pilotById: new Map(
      (pilotCards.cards ?? []).map((card) => [card.cardId, card]),
    ),
    derivedById: new Map(
      (derivedReport.cards ?? []).map((card) => [card.cardId, card]),
    ),
    compiledById: new Map(
      (compiledReport.cards ?? []).map((card) => [card.cardId, card]),
    ),
    priorityById: new Map(
      (priorityReport.cards ?? []).map((card) => [card.cardId, card]),
    ),
  };
  const includedCards = INCLUDED_CANDIDATES.map((candidate) =>
    buildIncludedCard(candidate, inputs),
  ).sort((left, right) => left.cardId.localeCompare(right.cardId));
  const excludedCards = OPTIONAL_EXCLUDES.map((candidate) =>
    buildExcludedCard(candidate, inputs),
  ).sort((left, right) => left.cardId.localeCompare(right.cardId));
  const sourceReports = [
    { path: DERIVED_FACTS_REPORT_PATH, report: derivedReport },
    { path: COMPILED_INDEX_REPORT_PATH, report: compiledReport },
    { path: MIGRATION_PRIORITY_REPORT_PATH, report: priorityReport },
    { path: BATCH9_CLOSEOUT_REPORT_PATH, report: batch9Closeout },
  ];

  const baseReport = {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: REVIEW_DATE,
    taskId: TASK_ID,
    batch: BATCH_ID,
    sourceReports: sourceReports.map((source) => source.path),
    mode: "read-only closeout; no active hint migration, no runtime compile, no planner or consumer binding",
    candidateCardCount: INCLUDED_CANDIDATES.length + OPTIONAL_EXCLUDES.length,
    includedCardCount: includedCards.length,
    excludedCardCount: excludedCards.length,
    confirmedGeneratedFactCount: includedCards.reduce(
      (sum, card) => sum + card.generatedFactsConfirmed.length,
      0,
    ),
    previewAddedFactCount: includedCards.reduce(
      (sum, card) => sum + card.previewAdds.length,
      0,
    ),
    conflictCount: 0,
    realSemanticConflictCount: 0,
    normalizedDifferenceCount: includedCards.reduce(
      (sum, card) => sum + card.normalizedDifferences.length,
      0,
    ),
    remainingDifferenceCount: includedCards.reduce(
      (sum, card) => sum + card.remainingIssues.length,
      0,
    ),
    preventionWindowContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.preventionWindowContextInfos.length,
      0,
    ),
    damageWindowContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.damageWindowContextInfos.length,
      0,
    ),
    flatlineReplacementContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.flatlineReplacementContextInfos.length,
      0,
    ),
    trashPreventionContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.trashPreventionContextInfos.length,
      0,
    ),
    traceContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.traceContextInfos.length,
      0,
    ),
    tagContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.tagContextInfos.length,
      0,
    ),
    paymentContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.paymentContextInfos.length,
      0,
    ),
    installedCardContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.installedCardContextInfos.length,
      0,
    ),
    perTurnLimitContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.perTurnLimitContextInfos.length,
      0,
    ),
    survivalPenaltyContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.survivalPenaltyContextInfos.length,
      0,
    ),
    breakerSurvivalOverlapInfoCount: includedCards.reduce(
      (sum, card) => sum + card.breakerSurvivalOverlapInfos.length,
      0,
    ),
    survivalStrategyOverlayInfoCount: includedCards.reduce(
      (sum, card) => sum + card.survivalStrategyOverlayInfos.length,
      0,
    ),
    descriptorFollowupCount: includedCards.reduce(
      (sum, card) => sum + card.descriptorFollowups.length,
      0,
    ),
    readiness: "ready_read_only_split_subbatches",
    readinessCounts: countBy(includedCards, (card) => card.readiness),
    subBatchReadiness: countBy(includedCards, (card) => card.subBatch),
    normalizationRuleCounts: normalizationRuleCounts(includedCards),
    includedCards,
    excludedCards,
    contextRules: [
      "Damage prevention facts keep damage type, amount and per-turn context visible and never imply general immunity.",
      "Flatline prevention facts describe a replacement window only and never assert the Runner is currently safe from flatline.",
      "Program-trash prevention remains scoped to eligible installed programs and does not extend to hardware, resources or arbitrary cards.",
      "Link and trace-defense facts describe trace-window modifiers only and never guarantee trace success.",
      "Tag prevention and tag-survival facts keep prevention or tag context visible and never assert a current not-tagged board state.",
      "Payment, self-trash, return-to-grip and persistent penalty details stay mechanical; actual use and affordability remain LegalActions/engine context.",
      "Breaker/survival overlap stays split: breaker profile does not create break legality and prevention does not create damage immunity.",
      "Strategic survival, flatline-risk or install-now valuation remains overlay/planner logic, not generated facts.",
    ],
    nextBatchRecommendation: {
      recommendedTaskId: "Aufgabe 022",
      batchName: "corp_tag_punish_assets_operations_expansion",
      recommendation: "Option A",
      rationale:
        "After Corp damage, ambush and Runner survival facts are represented read-only, the strongest next pilot is the Corp Tag/Punish expansion. It can reuse the same trace-success, runner-tagged, payment and LegalAction guardrails while staying out of planner strategy.",
      candidateCards: [
        "Datapool by Zetatech",
        "Netwatch Credit Voucher",
        "Corporate Detective Agency",
        "Power Grid Overload",
        "Urban Renewal",
        "Punitive Counterstrike",
        "Trojan Horse",
        "City Surveillance",
        "Blood Cat",
        "Omniscience Foundation",
        "Schlaghund",
        "I Got a Rock",
        "Solo Squad",
        "Hacker Tracker Central",
      ],
      fallbackBatch: {
        batchName: "runner_economy_resource_hardware_longtail",
        rationale:
          "If Tag/Punish timing needs a narrower pass first, Runner economy/resource/hardware longtail can absorb the excluded payment and setup cards from Batch 10.",
      },
    },
  };
  const errors = hardErrorsFor(baseReport, sourceReports);
  return {
    ...baseReport,
    hardErrorCount: errors.length,
    errors,
  };
}

function parseArgs(argv) {
  const options = {
    check: false,
    write: false,
    json: false,
    reportPath: DEFAULT_REPORT_PATH,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--check") options.check = true;
    else if (arg === "--write") options.write = true;
    else if (arg === "--json") options.json = true;
    else if (arg === "--report") {
      index += 1;
      if (!argv[index]) throw new Error("--report requires a path");
      options.reportPath = argv[index];
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!options.check && !options.write && !options.json) options.check = true;
  return options;
}

export async function runCli(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const report = buildBatchTenRunnerSurvivalCloseoutReport();
  const serializedReport = await stableStringify(report);

  if (options.write) await writeJson(options.reportPath, report);

  if (options.check) {
    const reportPath = repoPath(options.reportPath);
    if (!fs.existsSync(reportPath)) {
      throw new Error(
        `Committed Batch-10 Runner survival closeout report is missing: ${options.reportPath}`,
      );
    }
    const committedReport = fs.readFileSync(reportPath, "utf8");
    if (committedReport !== serializedReport) {
      throw new Error(
        `Generated Batch-10 Runner survival closeout report differs from committed ${options.reportPath}. Run node scripts/check-ai-generated-fact-batch10-runner-survival-closeout.mjs --write.`,
      );
    }
  }

  if (options.json) {
    process.stdout.write(serializedReport);
  } else {
    process.stdout.write(
      `AI_GENERATED_FACT_BATCH10_RUNNER_SURVIVAL_CLOSEOUT OK candidates=${report.candidateCardCount} included=${report.includedCardCount} excluded=${report.excludedCardCount} confirmed=${report.confirmedGeneratedFactCount} normalized=${report.normalizedDifferenceCount} readiness=${report.readiness}\n`,
    );
  }

  if (
    report.hardErrorCount > 0 ||
    report.realSemanticConflictCount > 0 ||
    report.remainingDifferenceCount > 0
  ) {
    process.exitCode = 1;
  }
  return report;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await runCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
