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
const TASK_ID = "Aufgabe 020";
const SCHEMA_VERSION = "ai-generated-fact-batch9-corp-nodes-closeout-v1";
const BATCH_ID = "batch_9_corp_nodes_assets_ambush_economy_remotes";
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
const BATCH8_CLOSEOUT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-019-corp-economy-advance-burst-closeout-report-2026-05-25.json";
const DEFAULT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-020-corp-nodes-assets-ambush-closeout-report-2026-05-25.json";

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

const RUNTIME_FIELDS = new Set([
  "legalActions",
  "playerActions",
  "stateVersion",
  "stateHash",
  "actionId",
]);

const NORMALIZATION_RULES = [
  "remote_asset_economy_normalization",
  "finite_pool_asset_normalization",
  "advanceable_asset_economy_normalization",
  "ambush_access_punish_normalization",
  "tag_source_asset_normalization",
  "remote_tax_or_runner_payment_normalization",
  "remote_capacity_or_portfolio_normalization",
  "trace_credit_support_normalization",
  "hidden_zone_or_rearrange_context_normalization",
  "remote_strategy_overlay_split_normalization",
  "access_context_required_classification",
  "trace_success_context_required_classification",
  "runner_tagged_context_required_classification",
  "variable_amount_context_classification",
  "remote_context_required_classification",
  "legalaction_context_required_classification",
  "hidden_zone_context_classification",
  "board_context_required_classification",
];

const INCLUDED_CANDIDATES = [
  [
    "onr_v1_308_acme-savings-and-loan",
    "ACME Savings and Loan",
    "remote_asset_economy",
    "asset",
  ],
  [
    "onr_v1_309_bbs-whispering-campaign",
    "BBS Whispering Campaign",
    "finite_pool_asset_economy",
    "asset",
  ],
  [
    "onr_v1_311_braindance-campaign",
    "Braindance Campaign",
    "finite_pool_asset_economy",
    "asset",
  ],
  ["onr_v1_310_blood-cat", "Blood Cat", "tag_source_asset_or_node", "asset"],
  [
    "onr_v1_313_city-surveillance",
    "City Surveillance",
    "remote_tax_or_runner_payment_asset",
    "asset",
  ],
  [
    "onr_v1_314_corporate-negotiating-center",
    "Corporate Negotiating Center",
    "start_of_turn_asset_economy",
    "asset",
  ],
  [
    "onr_v1_315_corprunners-shattered-remains",
    "Corprunner's Shattered Remains",
    "ambush_access_punish",
    "asset",
  ],
  ["onr_v1_354_crybaby", "Crybaby", "ambush_access_punish", "upgrade"],
  ["onr_v1_321_esa-contract", "ESA Contract", "action_asset_economy", "asset"],
  [
    "onr_v1_322_euromarket-consortium",
    "Euromarket Consortium",
    "board_state_or_hand_size_asset",
    "asset",
  ],
  [
    "onr_v1_323_experimental-ai",
    "Experimental AI",
    "ambush_access_punish",
    "asset",
  ],
  [
    "onr_v1_324_fortress-architects",
    "Fortress Architects",
    "remote_utility_or_rearrange_asset",
    "asset",
  ],
  [
    "onr_v1_325_hacker-tracker-central",
    "Hacker Tracker Central",
    "trace_credit_or_trace_support_asset",
    "asset",
  ],
  [
    "onr_v1_326_holovid-campaign",
    "Holovid Campaign",
    "finite_pool_asset_economy",
    "asset",
  ],
  [
    "onr_v1_327_i-got-a-rock",
    "I Got a Rock",
    "tag_punish_asset_or_node",
    "asset",
  ],
  [
    "onr_v1_328_information-laundering",
    "Information Laundering",
    "advanceable_asset_economy",
    "asset",
  ],
  [
    "onr_v1_329_investment-firm",
    "Investment Firm",
    "finite_pool_asset_economy",
    "asset",
  ],
  [
    "onr_v1_332_newsgroup-taunting",
    "Newsgroup Taunting",
    "remote_tax_or_runner_payment_asset",
    "asset",
  ],
  [
    "onr_v1_333_omniscience-foundation",
    "Omniscience Foundation",
    "tag_source_asset_or_node",
    "asset",
  ],
  [
    "onr_v1_334_pacifica-regional-ai",
    "Pacifica Regional AI",
    "advanceable_asset_economy",
    "asset",
  ],
  [
    "onr_v1_335_remote-facility",
    "Remote Facility",
    "remote_capacity_or_remote_portfolio_asset",
    "asset",
  ],
  [
    "onr_v1_336_rescheduler",
    "Rescheduler",
    "hidden_zone_or_rearrange_asset",
    "asset",
  ],
  [
    "onr_v1_337_rockerboy-promotion",
    "Rockerboy Promotion",
    "finite_pool_asset_economy",
    "asset",
  ],
  [
    "onr_v1_338_rustbelt-hq-branch",
    "Rustbelt HQ Branch",
    "board_state_or_hand_size_asset",
    "asset",
  ],
  ["onr_v1_339_schlaghund", "Schlaghund", "tag_punish_asset_or_node", "asset"],
  ["onr_v1_340_setup", "Setup!", "ambush_access_punish", "asset"],
  ["onr_v1_342_solo-squad", "Solo Squad", "tag_punish_asset_or_node", "asset"],
  [
    "onr_v1_343_south-african-mining-corp",
    "South African Mining Corp",
    "action_asset_economy",
    "asset",
  ],
  [
    "onr_v1_344_spinn-public-relations",
    "Spinn® Public Relations",
    "finite_pool_asset_economy",
    "asset",
  ],
  [
    "onr_v1_287_datapool-by-zetatech",
    "Datapool by Zetatech",
    "tag_punish_asset_or_node",
    "operation",
  ],
  [
    "onr_v1_293_netwatch-credit-voucher",
    "Netwatch Credit Voucher",
    "tag_punish_asset_or_node",
    "operation",
  ],
  [
    "onr_v1_286_corporate-detective-agency",
    "Corporate Detective Agency",
    "tag_punish_asset_or_node",
    "operation",
  ],
  [
    "onr_v1_299_power-grid-overload",
    "Power Grid Overload",
    "tag_punish_asset_or_node",
    "operation",
  ],
  [
    "onr_v1_307_urban-renewal",
    "Urban Renewal",
    "tag_punish_asset_or_node",
    "operation",
  ],
  [
    "onr_v1_306_trojan-horse",
    "Trojan Horse",
    "tag_punish_asset_or_node",
    "operation",
  ],
  [
    "onr_v1_294_new-blood",
    "New Blood",
    "hidden_zone_or_rearrange_asset",
    "operation",
  ],
  [
    "onr_v1_316_cowboy-sysop",
    "Cowboy Sysop",
    "hidden_zone_or_rearrange_asset",
    "asset",
  ],
  [
    "onr_v1_368_roving-submarine",
    "Roving Submarine",
    "remote_tax_or_runner_payment_asset",
    "upgrade",
  ],
  [
    "onr_v1_362_new-galveston-city-grid",
    "New Galveston City Grid",
    "remote_tax_or_runner_payment_asset",
    "upgrade",
  ],
  [
    "onr_v1_360_jerusalem-city-grid",
    "Jerusalem City Grid",
    "remote_utility_or_rearrange_asset",
    "upgrade",
  ],
  [
    "onr_v1_369_singapore-city-grid",
    "Singapore City Grid",
    "hidden_zone_or_rearrange_asset",
    "upgrade",
  ],
  [
    "onr_v1_352_chester-mix",
    "Chester Mix",
    "remote_utility_or_rearrange_asset",
    "upgrade",
  ],
  [
    "onr_v1_364_omni-kismet-ph-d",
    "Omni Kismet, Ph.D.",
    "hidden_zone_or_rearrange_asset",
    "upgrade",
  ],
  [
    "onr_v1_358_dr-dreff",
    "Dr. Dreff",
    "hidden_zone_or_rearrange_asset",
    "upgrade",
  ],
  [
    "onr_v1_346_vacant-soulkiller",
    "Vacant Soulkiller",
    "ambush_access_punish",
    "asset",
  ],
].map(([cardId, title, subBatch, cardType]) => ({
  cardId,
  title,
  subBatch,
  include: true,
  expectedSide: "corp",
  expectedCardType: cardType,
  implementationPath: `packages/engine/src/card-implementations/onr-v1/corp/${
    cardType === "operation"
      ? "operations"
      : cardType === "upgrade"
        ? "upgrades"
        : "assets"
  }/${cardId.replace(/^onr_v1_\d+_/, "")}.ts`,
}));

const OPTIONAL_EXCLUDES = [
  {
    cardId: "prompt_candidate_rex-campaign",
    title: "Rex Campaign",
    subBatch: "excluded_or_out_of_scope",
    expectedSide: "corp",
    expectedCardType: "asset",
    implementationPath:
      "packages/engine/src/card-implementations/onr-v1/corp/assets/rex-campaign.ts",
    excludedReason:
      "No active Runtime catalog card, active AI hint or CardImplementation was found under this title.",
  },
  {
    cardId: "prompt_candidate_marcel-desoleil",
    title: "Marcel DeSoleil",
    subBatch: "excluded_or_out_of_scope",
    expectedSide: "corp",
    expectedCardType: "asset",
    implementationPath:
      "packages/engine/src/card-implementations/onr-v1/corp/assets/marcel-desoleil.ts",
    excludedReason:
      "No active Runtime catalog card, active AI hint or CardImplementation was found under this title.",
  },
  {
    cardId: "onr_v1_103_zetatech-software-installer",
    title: "Zetatech Software Installer",
    subBatch: "excluded_or_out_of_scope",
    expectedSide: "runner",
    expectedCardType: "program",
    implementationPath:
      "packages/engine/src/card-implementations/onr-v1/runner/programs/zetatech-software-installer.ts",
    excludedReason:
      "Runner program/install-support card; outside the Corp Nodes / Assets / Ambush / Economy Remotes scope.",
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
  return uniqueSorted([
    ...(derivedFacts.effects ?? []).map((effect) => `effect:${effect.kind}`),
    ...(derivedFacts.conditions ?? []).map(
      (condition) => `condition:${condition.kind}`,
    ),
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
    "effect:economy": "remote_asset_economy_normalization",
    "effect:counter_economy": "finite_pool_asset_normalization",
    "effect:finite_economy_pool": "finite_pool_asset_normalization",
    "effect:action_economy": "remote_asset_economy_normalization",
    "effect:start_of_turn_economy": "remote_asset_economy_normalization",
    "effect:recurring_economy": "finite_pool_asset_normalization",
    "effect:advanceable_economy": "advanceable_asset_economy_normalization",
    "effect:draw": "remote_asset_economy_normalization",
    "effect:extra_action": "remote_capacity_or_portfolio_normalization",
    "effect:ambush": "ambush_access_punish_normalization",
    "effect:access_punish": "ambush_access_punish_normalization",
    "effect:damage": "ambush_access_punish_normalization",
    "effect:program_trash": "ambush_access_punish_normalization",
    "effect:hardware_trash": "ambush_access_punish_normalization",
    "effect:resource_trash": "ambush_access_punish_normalization",
    "effect:persistent_counter_effect": "ambush_access_punish_normalization",
    "effect:link_penalty": "ambush_access_punish_normalization",
    "effect:tag_source": "tag_source_asset_normalization",
    "effect:tag_punish_payoff": "tag_source_asset_normalization",
    "effect:trace": "tag_source_asset_normalization",
    "effect:trace_credit": "trace_credit_support_normalization",
    "effect:remote_tax": "remote_tax_or_runner_payment_normalization",
    "effect:run_tax": "remote_tax_or_runner_payment_normalization",
    "effect:install_discount": "remote_capacity_or_portfolio_normalization",
    "effect:rez_discount": "remote_capacity_or_portfolio_normalization",
    "effect:remote_protection": "remote_capacity_or_portfolio_normalization",
    "effect:future_encounter_effect":
      "hidden_zone_or_rearrange_context_normalization",
    "effect:zone_shuffle": "hidden_zone_or_rearrange_context_normalization",
    "condition:requires_start_of_turn":
      "legalaction_context_required_classification",
    "condition:requires_accessed_card":
      "access_context_required_classification",
    "condition:requires_trace_success":
      "trace_success_context_required_classification",
    "condition:requires_runner_tagged":
      "runner_tagged_context_required_classification",
    "condition:requires_runner_draw":
      "runner_tagged_context_required_classification",
    "condition:requires_runner_pay_or_take_tag":
      "runner_tagged_context_required_classification",
    "condition:requires_advancement_counter":
      "variable_amount_context_classification",
    "condition:requires_remote_server":
      "remote_context_required_classification",
    "condition:requires_rezzed_card": "board_context_required_classification",
    "condition:requires_during_run":
      "legalaction_context_required_classification",
    "condition:requires_successful_run":
      "legalaction_context_required_classification",
  }[label];
}

function normalizedDifferencesFor(card, labels, compiledWarnings) {
  const fromWarnings = (compiledWarnings ?? []).map((warning) => ({
    field: warning.field ?? warning.fact ?? warning.kind,
    sourceWarningKind: warning.kind,
    classification: classificationForRule(
      ruleForLabel(warning.fact) ??
        "remote_strategy_overlay_split_normalization",
    ),
    rule:
      ruleForLabel(warning.fact) ??
      "remote_strategy_overlay_split_normalization",
    rationale:
      "Compiled-index warning is normalized inside the read-only Batch-9 comparator path; active hints and runtime behavior are unchanged.",
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
    remote_asset_economy_normalization:
      "remote_asset_economy_context_normalized",
    finite_pool_asset_normalization: "finite_pool_asset_context_normalized",
    advanceable_asset_economy_normalization:
      "advanceable_asset_context_normalized",
    ambush_access_punish_normalization:
      "ambush_access_punish_context_normalized",
    tag_source_asset_normalization: "tag_source_asset_context_normalized",
    remote_tax_or_runner_payment_normalization:
      "remote_tax_runner_payment_context_normalized",
    remote_capacity_or_portfolio_normalization:
      "remote_capacity_portfolio_context_normalized",
    trace_credit_support_normalization:
      "trace_credit_support_context_normalized",
    hidden_zone_or_rearrange_context_normalization:
      "hidden_zone_rearrange_context_normalized",
    remote_strategy_overlay_split_normalization:
      "remote_strategy_overlay_split_normalized",
    access_context_required_classification: "access_context_classified",
    trace_success_context_required_classification:
      "trace_success_context_classified",
    runner_tagged_context_required_classification:
      "runner_tagged_context_classified",
    variable_amount_context_classification:
      "variable_amount_context_classified",
    remote_context_required_classification: "remote_context_classified",
    legalaction_context_required_classification:
      "legalaction_context_classified",
    hidden_zone_context_classification: "hidden_zone_context_classified",
    board_context_required_classification: "board_context_classified",
  }[rule];
}

function rationaleForRule(rule) {
  return {
    remote_asset_economy_normalization:
      "Remote asset economy facts stay mechanical; the report never recommends installing or using economy now.",
    finite_pool_asset_normalization:
      "Hosted and finite pools are mechanical descriptors only; remaining counters or credits stay board state.",
    advanceable_asset_economy_normalization:
      "Advanceable asset value is variable and counter-gated; advancement and score legality stay engine-owned.",
    ambush_access_punish_normalization:
      "Ambush/access-punish facts describe trigger classes and never assert a guaranteed hit or target.",
    tag_source_asset_normalization:
      "Tag/tag-punish facts keep trace, tagged-runner, payment or draw context visible and never assert guaranteed tags.",
    remote_tax_or_runner_payment_normalization:
      "Remote tax/payment facts are contextual pressure, not static remote safety.",
    remote_capacity_or_portfolio_normalization:
      "Remote capacity and portfolio support are mechanical context only; portfolio strategy stays planner/overlay logic.",
    trace_credit_support_normalization:
      "Trace credits and trace support are mechanical only; actual trace bidding stays LegalAction/engine context.",
    hidden_zone_or_rearrange_context_normalization:
      "Hidden-zone rearrange facts never expose hidden card identities or order.",
    remote_strategy_overlay_split_normalization:
      "Remote portfolio, bait and trash-budget strategy remain overlay/planner logic, not generated facts.",
    access_context_required_classification:
      "Access-punish mechanics require actual access context and do not create access legality.",
    trace_success_context_required_classification:
      "Trace-success payoffs remain conditional and do not become guaranteed outcomes.",
    runner_tagged_context_required_classification:
      "Tagged-runner payoffs remain conditional and do not assert the Runner is currently tagged.",
    variable_amount_context_classification:
      "Variable amounts remain context-dependent and are not fixed guaranteed values.",
    remote_context_required_classification:
      "Remote/server/root context remains board-owned and not a static truth.",
    legalaction_context_required_classification:
      "Generated facts describe static card function and do not create PlayerAction legality.",
    hidden_zone_context_classification:
      "Hidden-zone facts are side-safe context markers only.",
    board_context_required_classification:
      "Board/server/rezzed/install state remains runtime-owned.",
  }[rule];
}

function contextInfosFor(labels) {
  const infos = [];
  const add = (kind, rule) =>
    infos.push({ kind, rule, rationale: rationaleForRule(rule) });
  if (
    labels.some((label) =>
      [
        "effect:economy",
        "effect:counter_economy",
        "effect:action_economy",
        "effect:start_of_turn_economy",
        "effect:recurring_economy",
        "effect:finite_economy_pool",
        "effect:extra_action",
        "effect:draw",
        "effect:remote_tax",
        "effect:run_tax",
        "effect:remote_protection",
        "effect:install_discount",
        "effect:rez_discount",
        "condition:requires_remote_server",
        "condition:requires_rezzed_card",
      ].includes(label),
    )
  ) {
    add("remote_context_info", "remote_context_required_classification");
  }
  if (
    labels.some((label) =>
      [
        "effect:economy",
        "effect:counter_economy",
        "effect:action_economy",
        "effect:start_of_turn_economy",
        "effect:extra_action",
        "effect:draw",
        "condition:requires_start_of_turn",
        "condition:requires_during_run",
        "condition:requires_successful_run",
      ].includes(label),
    )
  ) {
    add(
      "legalaction_context_info",
      "legalaction_context_required_classification",
    );
  }
  if (
    labels.some((label) =>
      ["effect:zone_shuffle", "effect:future_encounter_effect"].includes(label),
    )
  ) {
    add("hidden_zone_context_info", "hidden_zone_context_classification");
  }
  if (
    labels.some((label) =>
      [
        "effect:finite_economy_pool",
        "effect:advanceable_economy",
        "condition:requires_advancement_counter",
      ].includes(label),
    )
  ) {
    add(
      "variable_amount_context_info",
      "variable_amount_context_classification",
    );
  }
  if (
    labels.some((label) =>
      [
        "effect:ambush",
        "effect:access_punish",
        "effect:damage",
        "effect:program_trash",
        "effect:hardware_trash",
        "effect:resource_trash",
        "effect:persistent_counter_effect",
        "effect:link_penalty",
        "condition:requires_accessed_card",
      ].includes(label),
    )
  ) {
    add("access_context_info", "access_context_required_classification");
  }
  if (
    labels.some((label) =>
      [
        "effect:tag_source",
        "effect:tag_punish_payoff",
        "effect:trace",
        "condition:requires_runner_tagged",
        "condition:requires_runner_draw",
        "condition:requires_runner_pay_or_take_tag",
      ].includes(label),
    )
  ) {
    add(
      "runner_tagged_context_info",
      "runner_tagged_context_required_classification",
    );
  }
  if (
    labels.some((label) =>
      ["effect:trace", "condition:requires_trace_success"].includes(label),
    )
  ) {
    add(
      "trace_success_context_info",
      "trace_success_context_required_classification",
    );
  }
  if (
    labels.some((label) =>
      [
        "effect:remote_protection",
        "effect:install_discount",
        "effect:rez_discount",
        "condition:requires_rezzed_card",
      ].includes(label),
    )
  ) {
    add("board_context_required_info", "board_context_required_classification");
  }
  if (
    labels.some((label) =>
      [
        "effect:ambush",
        "effect:access_punish",
        "effect:remote_tax",
        "effect:run_tax",
        "effect:finite_economy_pool",
        "effect:advanceable_economy",
      ].includes(label),
    )
  ) {
    add(
      "remote_strategy_overlay_info",
      "remote_strategy_overlay_split_normalization",
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
    remoteContextInfos: contexts.filter(
      (info) => info.kind === "remote_context_info",
    ),
    accessContextInfos: contexts.filter(
      (info) => info.kind === "access_context_info",
    ),
    traceContextInfos: contexts.filter(
      (info) => info.kind === "trace_success_context_info",
    ),
    tagContextInfos: contexts.filter(
      (info) => info.kind === "runner_tagged_context_info",
    ),
    legalActionContextInfos: contexts.filter(
      (info) => info.kind === "legalaction_context_info",
    ),
    hiddenZoneContextInfos: contexts.filter(
      (info) => info.kind === "hidden_zone_context_info",
    ),
    variableAmountContextInfos: contexts.filter(
      (info) => info.kind === "variable_amount_context_info",
    ),
    boardContextInfos: contexts.filter(
      (info) => info.kind === "board_context_required_info",
    ),
    remoteStrategyOverlayInfos: contexts.filter(
      (info) => info.kind === "remote_strategy_overlay_info",
    ),
    descriptorFollowups: [],
    activeConsumers: [
      "corp_remote_portfolio_diagnostics",
      "corp_trash_budget_context",
      "corp_tag_punish_context",
    ],
    remainingIssues: [],
    readiness: "ready_read_only_with_remote_access_context",
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
          kind: "missing_required_batch9_input",
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
    if (labels.has("effect:ambush") && card.accessContextInfos.length === 0) {
      errors.push({
        kind: "ambush_without_access_context",
        cardId: card.cardId,
        title: card.title,
      });
    }
    if (
      labels.has("effect:tag_punish_payoff") &&
      card.tagContextInfos.length === 0
    ) {
      errors.push({
        kind: "tag_punish_without_tag_context",
        cardId: card.cardId,
        title: card.title,
      });
    }
    if (
      labels.has("effect:trace") &&
      !card.generatedFactsConfirmed.includes("condition:requires_trace_success")
    ) {
      errors.push({
        kind: "trace_without_trace_success_context",
        cardId: card.cardId,
        title: card.title,
      });
    }
    if (
      labels.has("effect:finite_economy_pool") &&
      card.variableAmountContextInfos.length === 0
    ) {
      errors.push({
        kind: "finite_pool_without_variable_amount_context",
        cardId: card.cardId,
        title: card.title,
      });
    }
    if (
      labels.has("effect:remote_tax") &&
      card.remoteContextInfos.length === 0
    ) {
      errors.push({
        kind: "remote_tax_without_remote_context",
        cardId: card.cardId,
        title: card.title,
      });
    }
  }
  for (const fieldPath of collectKeyPaths(report, HIDDEN_INFO_FIELDS)) {
    errors.push({
      kind: "hidden_info_field",
      message: `Batch-9 closeout report contains hidden-info field ${fieldPath}.`,
      fieldPath,
    });
  }
  for (const fieldPath of collectKeyPaths(report, RUNTIME_FIELDS)) {
    errors.push({
      kind: "runtime_or_legality_field",
      message: `Batch-9 closeout report contains runtime/legal field ${fieldPath}.`,
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
      ...card.remoteContextInfos,
      ...card.accessContextInfos,
      ...card.traceContextInfos,
      ...card.tagContextInfos,
      ...card.legalActionContextInfos,
      ...card.hiddenZoneContextInfos,
      ...card.variableAmountContextInfos,
      ...card.boardContextInfos,
      ...card.remoteStrategyOverlayInfos,
    ]) {
      if (counts.has(context.rule)) {
        counts.set(context.rule, counts.get(context.rule) + 1);
      }
    }
  }
  return Object.fromEntries(counts);
}

export function buildBatchNineCorpNodesCloseoutReport() {
  const activeHints = readJson(ACTIVE_HINTS_PATH);
  const catalog = readJson(CATALOG_PATH);
  const pilotCards = readJson(PILOT_CARDS_PATH);
  const derivedReport = readJson(DERIVED_FACTS_REPORT_PATH);
  const compiledReport = readJson(COMPILED_INDEX_REPORT_PATH);
  const priorityReport = readJson(MIGRATION_PRIORITY_REPORT_PATH);
  const batch8Closeout = readJson(BATCH8_CLOSEOUT_REPORT_PATH);
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
    { path: BATCH8_CLOSEOUT_REPORT_PATH, report: batch8Closeout },
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
    remoteContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.remoteContextInfos.length,
      0,
    ),
    accessContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.accessContextInfos.length,
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
    legalActionContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.legalActionContextInfos.length,
      0,
    ),
    hiddenZoneContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.hiddenZoneContextInfos.length,
      0,
    ),
    variableAmountContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.variableAmountContextInfos.length,
      0,
    ),
    boardContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.boardContextInfos.length,
      0,
    ),
    remoteStrategyOverlayInfoCount: includedCards.reduce(
      (sum, card) => sum + card.remoteStrategyOverlayInfos.length,
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
      "Remote economy nodes/assets describe mechanical credit, draw, action or pool behavior only and never say to install or use economy now.",
      "Hosted or finite pools expose static capacity and timing only; remaining counters or credits stay board state.",
      "Ambush and access-punish facts require access context and never assert guaranteed hit, damage, trash or target choice.",
      "Trace/tag facts keep trace-success, runner-tagged, runner-draw or payment context visible and never assert guaranteed tags.",
      "Remote tax/payment facts are contextual pressure only and do not become static remote safety.",
      "Hidden-zone and rearrange facts never contain hidden card identities or order.",
      "Remote portfolio, bait, trash-budget and tag-punish strategy remain overlay/planner logic, not generated mechanical facts.",
    ],
    nextBatchRecommendation: {
      recommendedTaskId: "Aufgabe 021",
      batchName: "runner_prevention_damage_survival_tools",
      recommendation: "Option A",
      rationale:
        "After Corp ICE damage/trace and Corp Nodes/Ambush/Tag-Punish close cleanly, Runner prevention and survival tools are the strongest complementary read-only batch. They can model mechanical prevention/survival functions without turning damage avoidance into planner strategy.",
      candidateCards: [
        "Joan of Arc",
        "Shield",
        "Force Shield",
        "Emergency Self-Construct",
        "Evil Twin",
        "Bodyweight Synthetic Blood",
        "Crash Everett, Inventive Fixer",
      ],
      fallbackBatch: {
        batchName: "corp_tag_punish_assets_operations_expansion",
        rationale:
          "If Runner prevention is too sparse in active implementations, a focused Tag/Punish expansion can reuse the same runner-tagged and trace-context guardrails.",
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
  const report = buildBatchNineCorpNodesCloseoutReport();
  const serializedReport = await stableStringify(report);

  if (options.write) await writeJson(options.reportPath, report);

  if (options.check) {
    const reportPath = repoPath(options.reportPath);
    if (!fs.existsSync(reportPath)) {
      throw new Error(
        `Committed Batch-9 Corp nodes closeout report is missing: ${options.reportPath}`,
      );
    }
    const committedReport = fs.readFileSync(reportPath, "utf8");
    if (committedReport !== serializedReport) {
      throw new Error(
        `Generated Batch-9 Corp nodes closeout report differs from committed ${options.reportPath}. Run node scripts/check-ai-generated-fact-batch9-corp-nodes-closeout.mjs --write.`,
      );
    }
  }

  if (options.json) {
    process.stdout.write(serializedReport);
  } else {
    process.stdout.write(
      `AI_GENERATED_FACT_BATCH9_CORP_NODES_CLOSEOUT OK candidates=${report.candidateCardCount} included=${report.includedCardCount} excluded=${report.excludedCardCount} confirmed=${report.confirmedGeneratedFactCount} normalized=${report.normalizedDifferenceCount} readiness=${report.readiness}\n`,
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
