#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const GENERATED_AT = "2026-07-01";
const TASK_ID = "AGENDA-SEMANTIC-REVIEW-V1";

const REVIEW_CSV_PATH =
  "docs/reviews/ai/agenda-semantic-review-v1-input-2026-07-01.csv";
const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const TACTIC_SIGNAL_PATH = "data/ai/tactic-signals-v1.json";
const STRATEGY_GOALS_PATH = "data/ai/strategy-goals-v1.json";
const HINT_ONTOLOGY_PATH = "packages/ai/src/hint-ontology.ts";
const BEFORE_JSON_PATH =
  "docs/reviews/ai/agenda-semantic-review-v1-before-2026-07-01.json";
const TAXONOMY_JSON_PATH =
  "docs/reviews/ai/agenda-semantic-review-v1-taxonomy-report-2026-07-01.json";
const RESULT_JSON_PATH =
  "docs/reviews/ai/agenda-semantic-review-v1-result-2026-07-01.json";
const RESULT_MD_PATH =
  "docs/reviews/ai/agenda-semantic-review-v1-result-2026-07-01.md";

const CARD_FILES = [
  "data/cards/classic-cards.json",
  "data/cards/originalset-v1-cards.json",
  "data/cards/proteus-cards.json",
];

const NEW_STRATEGY_GOALS = [
  {
    strategyId: "corp.action_tempo",
    side: "corp",
    description:
      "Convert scored agenda abilities or counters into extra Corp actions, action-mode flexibility, or recurring tempo that changes near-term sequencing.",
    detectionMode: "engine_anchor",
    anchorSignals: [
      "action.corp_extra_action",
      "action.corp_recurring_extra_action",
      "action.corp_counter_to_extra_action",
      "tempo.corp_recurring_action",
    ],
    requiredSupport: {
      tempoSource: "required",
      economy: "recommended",
      scorePlan: "recommended",
      boardSafety: "conditional",
    },
    supportWeights: {
      tempoSource: 0.4,
      economy: 0.25,
      scorePlan: 0.25,
      boardSafety: 0.1,
    },
    tacticalGoalHints: [
      "bank_extra_action_counter",
      "convert_action_when_window_open",
      "prefer_extra_action_with_visible_payoff",
      "avoid_random_tempo_without_board_value",
    ],
  },
  {
    strategyId: "corp.overadvance_value",
    side: "corp",
    description:
      "Invest additional advancement counters into agendas whose overadvance payoff materially improves score value, recurring value, or win conversion.",
    detectionMode: "payoff_anchor",
    anchorSignals: [
      "advance.overadvance_payoff",
      "score.overadvance_bonus",
      "score.overadvance_scaling",
    ],
    requiredSupport: {
      advancementWindow: "required",
      economy: "required",
      scorePlan: "required",
      remoteSafety: "recommended",
    },
    supportWeights: {
      advancementWindow: 0.35,
      economy: 0.25,
      scorePlan: 0.25,
      remoteSafety: 0.15,
    },
    tacticalGoalHints: [
      "evaluate_overadvance_payoff",
      "advance_beyond_requirement_when_safe",
      "avoid_overadvance_without_score_window",
      "convert_overadvance_to_closeout",
    ],
  },
  {
    strategyId: "corp.draw_engine",
    side: "corp",
    description:
      "Use scored agenda draw or repeatable draw actions as a deck engine for finding ICE, economy, agendas, and follow-up pressure.",
    detectionMode: "engine_anchor",
    anchorSignals: [
      "draw.corp_recurring",
      "draw.corp_recurring_optional",
      "draw.corp_action_draw",
      "score.recurring_draw",
    ],
    requiredSupport: {
      drawSource: "required",
      scorePlan: "required",
      economy: "recommended",
      safety: "conditional",
    },
    supportWeights: {
      drawSource: 0.4,
      scorePlan: 0.25,
      economy: 0.2,
      safety: 0.15,
    },
    tacticalGoalHints: [
      "score_draw_engine_agenda",
      "use_draw_when_hand_quality_low",
      "convert_draw_to_next_score_window",
      "avoid_overdrawing_into_hq_pressure",
    ],
  },
  {
    strategyId: "corp.deck_recycle_engine",
    side: "corp",
    description:
      "Recycle HQ or Archives cards into R&D and combine shuffle or draw effects into a repeatable Corp resource and agenda-density engine.",
    detectionMode: "engine_anchor",
    anchorSignals: [
      "archives.corp_recycle_to_rnd",
      "rnd.corp_shuffle_recycle",
      "hq.corp_hand_to_rnd_shuffle",
      "draw.corp_action_draw",
    ],
    requiredSupport: {
      recycleSource: "required",
      drawOrShuffle: "required",
      agendaDensity: "recommended",
      economy: "recommended",
    },
    supportWeights: {
      recycleSource: 0.35,
      drawOrShuffle: 0.3,
      agendaDensity: 0.2,
      economy: 0.15,
    },
    tacticalGoalHints: [
      "recycle_low_value_hq_cards",
      "shuffle_archives_value_into_rnd",
      "draw_after_recycle_when_safe",
      "protect_rnd_after_density_change",
    ],
  },
];

const ROLE_NORMALIZATION = {
  damage_amplifier: "enabler",
  trace_tag_source: "enabler",
  tagged_meat_damage_payoff: "punish_payoff",
  tagged_runner_punish_payoff: "punish_payoff",
  score_window_payoff: "scoring_tool",
  setup_payoff: "enabler",
  damage_engine: "engine_anchor",
  access_punish: "punish_payoff",
  access_tag_source: "enabler",
};

const CANONICAL_ROLES = new Set([
  "payoff_anchor",
  "engine_anchor",
  "enabler",
  "support_tool",
  "utility",
  "defensive_tool",
  "emergency_tool",
  "win_condition",
  "tax_tool",
  "punish_payoff",
  "scoring_tool",
]);

const PAIR_OVERRIDES = {
  "onr_classic_003_unlisted-research-lab": [
    pair(
      "corp.draw_engine",
      "engine_anchor",
      "scored_recurring_draw_engine",
      "high",
      "Scored recurring draw is a repeatable Corp draw engine, not generic remote-scoring support.",
    ),
  ],
  "onr_v1_188_ai-chief-financial-officer": [
    pair(
      "corp.deck_recycle_engine",
      "engine_anchor",
      "scored_zone_recycle_draw_engine",
      "medium",
      "Action draw plus HQ/Archives-to-R&D shuffle forms a reusable deck recycle engine after scoring.",
    ),
  ],
  "onr_v1_192_corporate-boon": [
    pair(
      "corp.action_tempo",
      "payoff_anchor",
      "extra_action_counter_bank",
      "medium",
      "The scored counter bank converts into extra Corp actions and belongs under action-tempo rather than remote scoring.",
    ),
  ],
  "onr_v1_199_employee-empowerment": [
    pair(
      "corp.draw_engine",
      "engine_anchor",
      "scored_optional_draw_engine",
      "medium",
      "Optional recurring scored-agenda draw is a durable draw-engine anchor when the deck can use added card velocity.",
    ),
  ],
  "onr_v1_214_project-babylon": [
    pair(
      "corp.overadvance_value",
      "win_condition",
      "overadvance_agenda_point_payoff",
      "high",
      "The payoff is specifically overadvance agenda-point conversion, not generic remote scoring.",
    ),
  ],
  "onr_v1_218_subsidiary-branch": [
    pair(
      "corp.action_tempo",
      "engine_anchor",
      "recurring_extra_action_engine",
      "medium",
      "A recurring extra Corp action is a reusable action-tempo engine after the agenda is scored.",
    ),
  ],
  "onr_proteus_001_ai-board-member": [
    pair(
      "corp.action_tempo",
      "utility",
      "random_recurring_action_mode",
      "medium",
      "Random recurring action modes create action-tempo flexibility but carry mode variance risk.",
    ),
  ],
  "onr_proteus_006_please-dont-choke-anyone": [
    pair(
      "corp.action_tempo",
      "enabler",
      "damage_conversion_extra_action_bank",
      "medium",
      "Successful damage can be converted into a counter bank for extra actions, making the card an action-tempo enabler.",
    ),
  ],
  "onr_proteus_007_project-venice": [
    pair(
      "corp.overadvance_value",
      "win_condition",
      "overadvance_extra_action_payoff",
      "high",
      "Overadvance creates the recurring extra-action payoff, so the core strategic anchor is overadvance value.",
    ),
    pair(
      "corp.action_tempo",
      "payoff_anchor",
      "recurring_extra_action_payoff",
      "medium",
      "The resulting recurring extra action also materially supports action-tempo sequencing.",
    ),
  ],
  "onr_proteus_008_project-zurich": [
    pair(
      "corp.overadvance_value",
      "payoff_anchor",
      "overadvance_recurring_credit_payoff",
      "medium",
      "Overadvance turns extra advancement investment into recurring Corp economy value.",
    ),
  ],
};

const PAIR_REVIEW_RATIONALE = {
  "onr_v1_216_security-purge":
    "Review v1 removes the previous remote-scoring pair; free install/rez from R&D is an ICE-tax/glacier setup payoff.",
};

function pair(strategyId, role, roleDetail, confidence, rationale) {
  return { strategyId, role, roleDetail, confidence, rationale };
}

function main() {
  const command = process.argv[2];
  if (
    !["taxonomy", "high", "all", "report"].includes(command ?? "")
  ) {
    console.error(
      "Usage: node scripts/apply-agenda-semantic-review-v1.mjs <taxonomy|high|all|report>",
    );
    process.exitCode = 1;
    return;
  }

  if (command === "taxonomy") {
    const summary = applyTaxonomy();
    captureBeforeIfMissing();
    writeJson(TAXONOMY_JSON_PATH, summary);
    console.log(
      `AGENDA_SEMANTIC_REVIEW taxonomy strategies=${summary.addedStrategyIds.length} signals=${summary.addedSignalIds.length}`,
    );
    return;
  }

  if (command === "high") {
    const summary = applyCards((row) => row.priority === "high");
    console.log(
      `AGENDA_SEMANTIC_REVIEW high updated=${summary.updatedCards.length}`,
    );
    return;
  }

  if (command === "all") {
    const summary = applyCards(() => true);
    console.log(
      `AGENDA_SEMANTIC_REVIEW all updated=${summary.updatedCards.length}`,
    );
    return;
  }

  if (command === "report") {
    const report = buildResultReport();
    writeJson(RESULT_JSON_PATH, report.json);
    writeText(RESULT_MD_PATH, report.markdown);
    console.log(
      `AGENDA_SEMANTIC_REVIEW report cards=${report.json.cards.length} changed=${report.json.changedCardCount}`,
    );
  }
}

function applyTaxonomy() {
  const rows = readReviewRows();
  const strategyData = readJson(STRATEGY_GOALS_PATH);
  const tacticData = readJson(TACTIC_SIGNAL_PATH);

  const existingStrategyIds = new Set(
    strategyData.strategyGoals.map((goal) => goal.strategyId),
  );
  const addedStrategyIds = [];
  for (const goal of NEW_STRATEGY_GOALS) {
    const index = strategyData.strategyGoals.findIndex(
      (entry) => entry.strategyId === goal.strategyId,
    );
    if (index >= 0) {
      strategyData.strategyGoals[index] = goal;
    } else {
      strategyData.strategyGoals.push(goal);
      addedStrategyIds.push(goal.strategyId);
      existingStrategyIds.add(goal.strategyId);
    }
  }

  const tacticSignalIds = new Set(
    tacticData.signals.map((signal) => signal.signalId),
  );
  const reviewSignals = sortedUnique(
    rows.flatMap((row) => parseSignalList(row.recommended_tactic_signals)),
  );
  const addedSignalIds = [];
  for (const signalId of reviewSignals) {
    if (tacticSignalIds.has(signalId)) continue;
    tacticData.signals.push(createTacticSignal(signalId));
    tacticSignalIds.add(signalId);
    addedSignalIds.push(signalId);
  }
  tacticData.signals.sort((left, right) =>
    left.signalId.localeCompare(right.signalId),
  );

  writeJson(STRATEGY_GOALS_PATH, strategyData);
  writeJson(TACTIC_SIGNAL_PATH, tacticData);
  updateHintOntologyStrategyIds(NEW_STRATEGY_GOALS.map((goal) => goal.strategyId));

  return {
    schemaVersion: "agenda-semantic-review-v1-taxonomy-report",
    taskId: TASK_ID,
    generatedAt: GENERATED_AT,
    addedStrategyIds,
    refreshedStrategyIds: NEW_STRATEGY_GOALS.map((goal) => goal.strategyId),
    addedSignalIds,
    reviewSignalCount: reviewSignals.length,
    roleNormalization: ROLE_NORMALIZATION,
    notes: [
      "Manual Agenda Review v1 tactic signals are cataloged without allowedStrategyAnchors because the strategy-taxonomy validator requires catalog anchors to match derivation rules exactly.",
      "Card-level strategySupportPairs carry the reviewed strategy evidence.",
      "corp.value_engine, corp.score_tempo and corp.damage_conversion_tempo were not introduced because the active review rows can be represented by narrower anchors.",
    ],
  };
}

function applyCards(predicate) {
  const rows = readReviewRows().filter(predicate);
  const activeHints = readJson(ACTIVE_HINTS_PATH);
  const hintsById = new Map(
    activeHints.cards.map((hint, index) => [hint.cardId, { hint, index }]),
  );
  const updatedCards = [];

  for (const row of rows) {
    const entry = hintsById.get(row.card_id);
    if (!entry) {
      throw new Error(`Active hint missing for review card ${row.card_id}`);
    }
    const { hint } = entry;
    const tacticSignals = parseSignalList(row.recommended_tactic_signals);
    if (tacticSignals.length > 0) {
      hint.tacticSignals = tacticSignals;
    } else {
      delete hint.tacticSignals;
    }

    const pairs = buildPairsForRow(row, tacticSignals);
    if (pairs.length > 0) {
      hint.strategySupportPairs = pairs;
      hint.lineSupport = uniquePreserve(pairs.map((item) => item.strategyId));
      hint.strategicRole = uniquePreserve(pairs.map((item) => item.role));
    } else {
      delete hint.strategySupportPairs;
      delete hint.lineSupport;
      delete hint.strategicRole;
    }

    hint.quality = {
      ...(hint.quality ?? {}),
      hintReviewed: true,
      strategyCovered: pairs.length > 0,
      confidence: qualityConfidence(row, pairs),
      needsHumanReview: false,
      reviewedDate: GENERATED_AT,
      reviewedBy: "codex-agenda-semantic-review-v1",
    };

    updatedCards.push({
      cardId: row.card_id,
      title: row.card,
      priority: row.priority,
      reviewStatus: row.review_status,
      tacticSignals,
      lineSupport: hint.lineSupport ?? [],
      strategicRole: hint.strategicRole ?? [],
      pairCount: pairs.length,
    });
  }

  writeJson(ACTIVE_HINTS_PATH, activeHints);
  return {
    schemaVersion: "agenda-semantic-review-v1-apply-summary",
    taskId: TASK_ID,
    generatedAt: GENERATED_AT,
    updatedCards,
  };
}

function buildPairsForRow(row, tacticSignals) {
  const override = PAIR_OVERRIDES[row.card_id];
  const rawPairs = override ?? parsePairField(row.recommended_strategy_support_pairs);
  return rawPairs.map((rawPair) => {
    const normalized = normalizePair(rawPair);
    const evidence = evidenceForPair(normalized.strategyId, tacticSignals);
    return {
      strategyId: normalized.strategyId,
      role: normalized.role,
      ...(normalized.roleDetail ? { roleDetail: normalized.roleDetail } : {}),
      evidence,
      confidence: normalized.confidence,
      rationale:
        rawPair.rationale ??
        PAIR_REVIEW_RATIONALE[row.card_id] ??
        rationaleForPair(row, normalized),
    };
  });
}

function parsePairField(value) {
  if (!value || value.startsWith("_keine_")) return [];
  const pairs = [];
  for (const part of splitTopLevelSemicolon(value)) {
    const item = part.trim();
    if (!item || item.startsWith("entferne ")) continue;
    const match = item.match(
      /^(corp\.[a-z0-9_.]+)\s*->\s*([a-z0-9_]+)(?:\/([a-z0-9_.]+))?\s*\(([^)]*)\)/,
    );
    if (!match) continue;
    const [, strategyId, roleToken, roleDetail, confidenceText] = match;
    pairs.push({
      strategyId,
      role: roleToken,
      roleDetail,
      confidence: extractConfidence(confidenceText),
    });
  }
  return pairs;
}

function splitTopLevelSemicolon(value) {
  const parts = [];
  let current = "";
  let depth = 0;
  for (const char of value) {
    if (char === "(") depth += 1;
    if (char === ")" && depth > 0) depth -= 1;
    if (char === ";" && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim().length > 0) parts.push(current);
  return parts;
}

function normalizePair(rawPair) {
  const role = ROLE_NORMALIZATION[rawPair.role] ?? rawPair.role;
  if (!CANONICAL_ROLES.has(role)) {
    throw new Error(`Unknown canonical role after normalization: ${rawPair.role}`);
  }
  const roleDetail =
    rawPair.roleDetail ??
    (ROLE_NORMALIZATION[rawPair.role] ? rawPair.role : undefined);
  return {
    strategyId: rawPair.strategyId,
    role,
    roleDetail,
    confidence: rawPair.confidence ?? "medium",
  };
}

function extractConfidence(value) {
  if (/\bhigh\b/.test(value)) return "high";
  if (/\bmedium\b/.test(value)) return "medium";
  if (/\blow\b/.test(value)) return "low";
  return "medium";
}

function evidenceForPair(strategyId, tacticSignals) {
  const matchers = {
    "corp.action_tempo": [/^action\./, /^tempo\./, /^limit\./, /^draw\.corp_draw_action$/, /^economy\.corp_credit_action$/, /^score\.recurring_extra_action$/],
    "corp.ambush_bluff": [/^access\./, /^score\.own_fort_trash_on_score$/, /^risk\.trash_own_fort_on_score$/],
    "corp.central_stabilize": [/^defense\./, /^hq\./, /^rnd\./, /^virus\./, /^score\.hq_/, /^score\.rnd_/],
    "corp.damage_kill": [/^damage\./, /^score\.meat_damage/, /^score\.tagged_meat_damage/, /^score\.damage/, /^score\.hand_size_pressure/, /^access\.corp_net_damage/],
    "corp.deck_recycle_engine": [/^archives\./, /^rnd\./, /^hq\.corp_hand_to_rnd_shuffle$/, /^draw\./],
    "corp.draw_engine": [/^draw\./, /^score\.recurring_draw$/, /^score\.agenda_action$/],
    "corp.fast_advance": [/^score\.agenda_difficulty_discount$/, /^score\.(black_ops|gray_ops|research)_difficulty_discount$/],
    "corp.ice_tax_glacier": [/^ice\./, /^score\.(free_rez_ice|free_install_and_rez_ice|rnd_install_and_rez|fort_ice_strength_bonus|chosen_ice_strength_bonus|repeat_ice_subroutines|code_gate_strength_bonus|wall_strength_bonus|black_ice_strength_bonus|ice_type_tax_support)$/, /^install\.corp_rnd_ice_install$/, /^economy\.corp_ice_type_reveal_burst$/],
    "corp.overadvance_value": [/^advance\.overadvance_payoff$/, /^score\.overadvance/, /^score\.conditional_bonus_agenda_points$/, /^action\.corp_recurring_extra_action$/, /^economy\.corp_recurring_credit$/, /^risk\.overadvance_investment$/],
    "corp.remote_scoring": [/^score\./, /^remote\./, /^run\.corp_end_run_counter$/, /^defense\.corp_run_end_counter$/, /^access\.corp_agenda_steal/, /^risk\.fragile_delayed_score$/, /^risk\.program_removal_denies_score$/],
    "corp.tag_trace_punish": [/^tag\./, /^trace\./, /^condition\./, /^score\.trace_tag_source$/, /^access\.corp_tag_ambush$/],
  };
  const patterns = matchers[strategyId] ?? [];
  const evidence = tacticSignals.filter((signal) =>
    patterns.some((pattern) => pattern.test(signal)),
  );
  return evidence.length > 0 ? evidence : tacticSignals.slice(0, 3);
}

function rationaleForPair(row, pair) {
  const detail = pair.roleDetail ? `/${pair.roleDetail}` : "";
  return `Agenda Semantic Review v1 maps ${row.card} to ${pair.strategyId} as ${pair.role}${detail}.`;
}

function qualityConfidence(row, pairs) {
  if (pairs.some((pair) => pair.confidence === "high")) return "high";
  if (pairs.some((pair) => pair.confidence === "medium")) return "medium";
  if (row.review_status === "behalten") return "high";
  if (row.priority === "high") return "high";
  return "medium";
}

function createTacticSignal(signalId) {
  const prefix = signalId.split(".")[0];
  const supportOnly = isSupportOnlySignal(signalId);
  return {
    signalId,
    group: `agenda_semantic_review_v1_${prefix}`,
    sideScope: "corp",
    description: describeSignal(signalId),
    supportOnly,
    mayAnchorStrategy: false,
    allowedStrategyAnchors: [],
    sourceKinds: ["Agenda Semantic Review v1 reviewed Corp-Agenda hints"],
    examples: [],
    targetProfileRelevant:
      signalId.startsWith("access.") || signalId.startsWith("install."),
    notes:
      "Agenda Semantic Review v1 manual signal; read-only hint metadata only. Strategy anchoring is expressed through reviewed card-level strategySupportPairs, not derivation rules.",
  };
}

function isSupportOnlySignal(signalId) {
  return (
    signalId.startsWith("risk.") ||
    signalId.startsWith("condition.") ||
    signalId.startsWith("limit.") ||
    signalId === "score.high_agenda_value" ||
    signalId === "score.vanilla_points"
  );
}

function describeSignal(signalId) {
  const [domain, ...rest] = signalId.split(".");
  const words = rest.join(" ").replaceAll("_", " ");
  const domainLabels = {
    access: "Access or steal-window pressure",
    action: "Corp action-tempo utility",
    advance: "Overadvance payoff",
    archives: "Archives recycle utility",
    condition: "Condition gate",
    damage: "Corp damage pressure",
    defense: "Corp defensive utility",
    draw: "Corp draw utility",
    economy: "Corp economy utility",
    hq: "HQ density or shuffle utility",
    ice: "ICE tax or rez utility",
    info: "Information exposure utility",
    install: "Corp install utility",
    limit: "Use-limit metadata",
    risk: "Risk or drawback metadata",
    rnd: "R&D shuffle or recycle utility",
    run: "Run-ending or run-window utility",
    score: "Scored-agenda utility",
    tag: "Tag or tagged-runner utility",
    tempo: "Tempo utility",
    trace: "Trace pressure",
    virus: "Virus-counter utility",
  };
  return `${domainLabels[domain] ?? "Agenda utility"}: ${words}.`;
}

function updateHintOntologyStrategyIds(strategyIds) {
  const absolutePath = path.join(REPO_ROOT, HINT_ONTOLOGY_PATH);
  let source = fs.readFileSync(absolutePath, "utf8");
  const missing = strategyIds.filter((strategyId) => !source.includes(`"${strategyId}"`));
  if (missing.length === 0) return;
  const marker = '  "corp.rush_score",\n';
  if (!source.includes(marker)) {
    throw new Error("Could not find corp.rush_score marker in hint ontology.");
  }
  const insertion = missing.map((strategyId) => `  "${strategyId}",`).join("\n") + "\n";
  source = source.replace(marker, marker + insertion);
  fs.writeFileSync(absolutePath, source);
}

function captureBeforeIfMissing() {
  if (fs.existsSync(path.join(REPO_ROOT, BEFORE_JSON_PATH))) return;
  const rows = readReviewRows();
  const activeHints = readJson(ACTIVE_HINTS_PATH);
  const cards = readCardsById();
  const hintsById = new Map(activeHints.cards.map((hint) => [hint.cardId, hint]));
  writeJson(BEFORE_JSON_PATH, {
    schemaVersion: "agenda-semantic-review-v1-before",
    taskId: TASK_ID,
    generatedAt: GENERATED_AT,
    sourceCsv: REVIEW_CSV_PATH,
    cards: rows.map((row) => {
      const card = cards.get(row.card_id);
      return {
        set: row.set,
        cardId: row.card_id,
        title: row.card,
        text: card?.text ?? "",
        reviewStatus: row.review_status,
        priority: row.priority,
        currentIssue: row.current_issue,
        recommendedTacticSignals: parseSignalList(row.recommended_tactic_signals),
        recommendedStrategySupportPairs: row.recommended_strategy_support_pairs,
        recommendedTargetOrConstraints: row.recommended_target_or_constraints,
        rationale: row.rationale,
        before: summarizeHint(hintsById.get(row.card_id)),
      };
    }),
  });
}

function buildResultReport() {
  const before = readJson(BEFORE_JSON_PATH);
  const activeHints = readJson(ACTIVE_HINTS_PATH);
  const hintsById = new Map(activeHints.cards.map((hint) => [hint.cardId, hint]));
  const cards = before.cards.map((entry) => {
    const after = summarizeHint(hintsById.get(entry.cardId));
    const changed = diffSummary(entry.before, after);
    return {
      ...entry,
      after,
      changed,
      changedAny: changed.length > 0,
    };
  });

  const json = {
    schemaVersion: "agenda-semantic-review-v1-result",
    taskId: TASK_ID,
    generatedAt: GENERATED_AT,
    changedCardCount: cards.filter((card) => card.changedAny).length,
    unchangedCardCount: cards.filter((card) => !card.changedAny).length,
    cards,
  };

  return { json, markdown: renderMarkdownReport(json) };
}

function summarizeHint(hint) {
  if (!hint) {
    return {
      tacticSignals: [],
      lineSupport: [],
      strategicRole: [],
      strategySupportPairs: [],
      quality: {},
    };
  }
  return {
    tacticSignals: hint.tacticSignals ?? [],
    lineSupport: hint.lineSupport ?? [],
    strategicRole: hint.strategicRole ?? [],
    strategySupportPairs: (hint.strategySupportPairs ?? []).map((pair) => ({
      strategyId: pair.strategyId,
      role: pair.role,
      ...(pair.roleDetail ? { roleDetail: pair.roleDetail } : {}),
      evidence: pair.evidence ?? [],
      confidence: pair.confidence,
      ...(pair.rationale ? { rationale: pair.rationale } : {}),
    })),
    quality: {
      strategyCovered: hint.quality?.strategyCovered ?? false,
      confidence: hint.quality?.confidence,
      reviewedDate: hint.quality?.reviewedDate,
      reviewedBy: hint.quality?.reviewedBy,
    },
  };
}

function diffSummary(before, after) {
  const changes = [];
  for (const field of [
    "tacticSignals",
    "lineSupport",
    "strategicRole",
  ]) {
    const beforeValues = before[field] ?? [];
    const afterValues = after[field] ?? [];
    if (!sameArray(beforeValues, afterValues)) {
      changes.push({
        field,
        added: afterValues.filter((value) => !beforeValues.includes(value)),
        removed: beforeValues.filter((value) => !afterValues.includes(value)),
      });
    }
  }
  if (
    JSON.stringify(before.strategySupportPairs ?? []) !==
    JSON.stringify(after.strategySupportPairs ?? [])
  ) {
    changes.push({
      field: "strategySupportPairs",
      beforeCount: (before.strategySupportPairs ?? []).length,
      afterCount: (after.strategySupportPairs ?? []).length,
    });
  }
  if (before.quality?.strategyCovered !== after.quality?.strategyCovered) {
    changes.push({
      field: "quality.strategyCovered",
      before: before.quality?.strategyCovered,
      after: after.quality?.strategyCovered,
    });
  }
  return changes;
}

function renderMarkdownReport(report) {
  const lines = [];
  lines.push("# Agenda Semantic Review v1 Ergebnis");
  lines.push("");
  lines.push(`Status: \`complete-local\``);
  lines.push("");
  lines.push(`Stand: ${GENERATED_AT}`);
  lines.push("");
  lines.push(
    `Umfang: ${report.cards.length} Agendas, ${report.changedCardCount} mit Feldänderungen, ${report.unchangedCardCount} ohne Feldänderung gegenüber dem importierten Vorher-Stand.`,
  );
  lines.push("");
  lines.push("## Legende");
  lines.push("");
  lines.push("- Taktiksignale: konkrete, nutzbare Spielwirkung für die KI.");
  lines.push("- Strategieanker: wiederverwendbarer Corp-Spielplan, den die Karte ankern oder wesentlich tragen kann.");
  lines.push("- Strategische Rolle: hierarchische Rolle innerhalb eines konkreten Strategieankers, gespeichert als `strategySupportPairs`.");
  lines.push("");
  lines.push("## Karten");
  for (const card of report.cards) {
    lines.push("");
    lines.push(`### ${card.title} (${card.cardId})`);
    lines.push("");
    lines.push(`Set: ${card.set}`);
    lines.push("");
    lines.push(`Text: ${card.text || "_kein Kartentext gefunden_"}`);
    lines.push("");
    lines.push(`Review-Status: ${card.reviewStatus}; Priorität: ${card.priority}.`);
    lines.push("");
    lines.push("Vorher:");
    lines.push(`- AI-Status: strategyCovered=${String(card.before.quality.strategyCovered)}, confidence=${card.before.quality.confidence ?? "n/a"}`);
    lines.push(`- Taktiksignale: ${formatList(card.before.tacticSignals)}`);
    lines.push(`- Strategieanker: ${formatList(card.before.lineSupport)}`);
    lines.push(`- Strategische Rollen: ${formatList(card.before.strategicRole)}`);
    lines.push(`- StrategySupportPairs: ${formatPairs(card.before.strategySupportPairs)}`);
    lines.push("");
    lines.push("Nachher:");
    lines.push(`- AI-Status: strategyCovered=${String(card.after.quality.strategyCovered)}, confidence=${card.after.quality.confidence ?? "n/a"}`);
    lines.push(`- Taktiksignale: ${formatList(card.after.tacticSignals)}`);
    lines.push(`- Strategieanker: ${formatList(card.after.lineSupport)}`);
    lines.push(`- Strategische Rollen: ${formatList(card.after.strategicRole)}`);
    lines.push(`- StrategySupportPairs: ${formatPairs(card.after.strategySupportPairs)}`);
    lines.push("");
    lines.push(`Änderungen: ${formatChanges(card.changed)}`);
    lines.push("");
    lines.push(`Review-Begründung: ${card.rationale || "_keine_"}`);
    if (
      card.recommendedTargetOrConstraints &&
      card.recommendedTargetOrConstraints !== "_keine_"
    ) {
      lines.push("");
      lines.push(`Target-/Constraint-Hinweis aus Review: ${card.recommendedTargetOrConstraints}`);
    }
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function formatList(values) {
  if (!values || values.length === 0) return "_keine_";
  return values.map((value) => `\`${value}\``).join(", ");
}

function formatPairs(pairs) {
  if (!pairs || pairs.length === 0) return "_keine_";
  return pairs
    .map((pair) => {
      const detail = pair.roleDetail ? `/${pair.roleDetail}` : "";
      return `\`${pair.strategyId} -> ${pair.role}${detail} (${pair.confidence})\``;
    })
    .join("; ");
}

function formatChanges(changes) {
  if (!changes || changes.length === 0) return "_keine Feldänderung_";
  return changes
    .map((change) => {
      if (change.field === "strategySupportPairs") {
        return `${change.field}: ${change.beforeCount} -> ${change.afterCount}`;
      }
      if (change.field === "quality.strategyCovered") {
        return `${change.field}: ${String(change.before)} -> ${String(change.after)}`;
      }
      return `${change.field}: +${formatInlineValues(change.added)} / -${formatInlineValues(change.removed)}`;
    })
    .join("; ");
}

function formatInlineValues(values) {
  if (!values || values.length === 0) return "keine";
  return values.map((value) => `\`${value}\``).join(", ");
}

function readReviewRows() {
  const rows = parseCsv(readText(REVIEW_CSV_PATH));
  const header = rows.shift();
  const indexes = Object.fromEntries(header.map((column, index) => [column, index]));
  return rows.map((row) => ({
    set: row[indexes.set],
    card_id: row[indexes.card_id],
    card: row[indexes.card],
    review_status: row[indexes.review_status],
    priority: row[indexes.priority],
    current_issue: row[indexes.current_issue],
    recommended_tactic_signals: row[indexes.recommended_tactic_signals],
    recommended_strategy_support_pairs:
      row[indexes.recommended_strategy_support_pairs],
    recommended_target_or_constraints:
      row[indexes.recommended_target_or_constraints],
    rationale: row[indexes.rationale],
    stats_bucket: row[indexes.stats_bucket],
  }));
}

function parseSignalList(value) {
  if (!value || value.trim() === "_keine_") return [];
  return uniquePreserve(
    value
      .split(";")
      .map((part) => part.trim())
      .filter((part) => part && part !== "_keine_"),
  );
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inQuotes) {
      if (char === '"' && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        value += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }
  if (value.length > 0 || row.length > 0) {
    row.push(value.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows.filter((candidate) => candidate.some((item) => item !== ""));
}

function readCardsById() {
  const cards = new Map();
  for (const cardFile of CARD_FILES) {
    for (const card of readJson(cardFile).cards ?? []) {
      cards.set(card.cardId, card);
    }
  }
  return cards;
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function writeJson(relativePath, value) {
  writeText(relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function readText(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
}

function writeText(relativePath, value) {
  const absolutePath = path.join(REPO_ROOT, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, value);
}

function sortedUnique(values) {
  return [...new Set(values.filter((value) => typeof value === "string"))].sort();
}

function uniquePreserve(values) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    if (typeof value !== "string" || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

function sameArray(left, right) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

main();
