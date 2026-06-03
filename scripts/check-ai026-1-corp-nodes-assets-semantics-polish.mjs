#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const CARD_FILES = [
  "data/cards/originalset-v1-cards.json",
  "data/cards/proteus-cards.json",
  "data/cards/classic-cards.json",
  "data/cards/testset-cards.json",
];
const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const COMPILED_HINTS_PATH = "data/ai/ai-card-hints-compiled.json";
const TACTIC_SIGNAL_PATH = "data/ai/tactic-signals-v1.json";
const STRATEGY_PATH = "data/ai/strategy-goals-v1.json";
const REPORT_PATH = "docs/reviews/ai/ai026-1-corp-nodes-assets-semantics-polish-report-2026-06-02.json";

const NEW_SIGNALS = [
  "access.corp_archives_net_damage_ambush",
  "access.corp_brain_damage_ambush",
  "access.corp_credit_loss_counter",
  "access.corp_icebreaker_strength_counter",
  "access.corp_net_damage_ambush",
  "access.corp_rnd_net_damage_ambush",
  "access.corp_tag_ambush",
  "draw.corp_draw",
  "economy.corp_action_charged_bank",
  "economy.corp_advanceable_cashout",
  "economy.corp_charge_bank",
  "economy.corp_counter_cashout",
  "economy.corp_hq_agenda_reveal_credit",
  "economy.corp_multi_action_credit",
  "hq.corp_hand_refresh",
  "hq.corp_installed_card_bounce",
  "ice.corp_self_trash_cost",
  "info.hq_agenda_reveal",
  "install.corp_uninstall_to_hq",
  "risk.reveal_hq_agendas",
  "risk.trash_own_rezzed_ice",
  "rnd.corp_shuffle_hq_into_rnd",
  "setup.corp_hand_size",
];

const REPORT_FLAGS = [
  "plannerEffect",
  "actionScoreEffect",
  "planWeightEffect",
  "targetingAiEffect",
  "engineEffect",
  "legalEffect",
  "profileOrDefaultSwitch",
  "uiDerivationEffect",
  "hiddenInfoLeakEffect",
];

function repoPath(relativePath) {
  return path.join(REPO_ROOT, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(repoPath(relativePath), "utf8"));
}

function cardsFrom(relativePath) {
  const data = readJson(relativePath);
  return (data.cards ?? []).map((card) => ({ ...card, setId: card.setId ?? data.setId ?? "testset" }));
}

function fail(errors, message) {
  errors.push(message);
}

function hasAll(hint, signals) {
  return signals.every((signal) => (hint?.tacticSignals ?? []).includes(signal));
}

function hasNone(hint, signals) {
  return signals.every((signal) => !(hint?.tacticSignals ?? []).includes(signal));
}

function reportCard(reportById, cardId) {
  return reportById.get(cardId);
}

function reportPairs(reportById, cardId) {
  return reportCard(reportById, cardId)?.strategySupportPairs ?? [];
}

function pairRoles(reportById, cardId) {
  return reportPairs(reportById, cardId).map((pair) => pair.role);
}

function main() {
  const errors = [];
  const report = readJson(REPORT_PATH);
  const activeHints = readJson(ACTIVE_HINTS_PATH).cards ?? [];
  const compiledHints = readJson(COMPILED_HINTS_PATH).cards ?? [];
  const tacticSignals = readJson(TACTIC_SIGNAL_PATH).signals ?? [];
  const strategies = readJson(STRATEGY_PATH).strategyGoals ?? [];
  const allCards = CARD_FILES.flatMap(cardsFrom);

  const activeById = new Map(activeHints.map((hint) => [hint.cardId, hint]));
  const compiledById = new Map(compiledHints.map((hint) => [hint.cardId, hint]));
  const catalogIds = new Set(tacticSignals.map((signal) => signal.signalId));
  const strategyIds = new Set(strategies.map((strategy) => strategy.strategyId));
  const reportById = new Map((report.postReviewAssignments ?? []).map((card) => [card.cardId, card]));
  const activeIds = new Set(activeHints.map((hint) => hint.cardId));
  const compiledIds = new Set(compiledHints.map((hint) => hint.cardId));
  const activeCompiledAssets = allCards.filter(
    (card) => card.side === "corp" && card.type === "asset" && activeIds.has(card.cardId) && compiledIds.has(card.cardId),
  );

  if (report.schemaVersion !== "ai026-1-corp-nodes-assets-semantics-polish-report-v1") fail(errors, "unexpected schemaVersion");
  if (report.taskId !== "AI026-1") fail(errors, "unexpected taskId");
  if (report.guideVersion !== "V3") fail(errors, "AI026-1 must reference Guide V3");
  if (report.correctsTask !== "AI026") fail(errors, "AI026-1 must correct AI026");
  if (report.countsAfter?.activeCompiledCorpNodeAssets !== 54) fail(errors, "expected 54 active compiled Corp nodes/assets");
  if (activeCompiledAssets.length !== 54) fail(errors, `active compiled node/asset inventory mismatch: ${activeCompiledAssets.length}`);
  if (report.countsAfter?.productionOriginalsetNodeAssets !== 41) fail(errors, "expected 41 production Originalset nodes/assets");
  if (report.countsAfter?.productionProteusNodeAssets !== 11) fail(errors, "expected 11 production Proteus nodes/assets");
  if (report.countsAfter?.activeTestNodeAssets !== 2) fail(errors, "expected 2 active test/V08 assets");
  if (report.countsAfter?.newStrategyIdCount !== 0) fail(errors, "AI026-1 must not introduce Strategy IDs");
  for (const flag of REPORT_FLAGS) if (report.countsAfter?.[flag] !== false) fail(errors, `${flag} is not false`);

  for (const signalId of NEW_SIGNALS) {
    const signal = tacticSignals.find((item) => item.signalId === signalId);
    if (!signal) fail(errors, `missing AI026-1 signal ${signalId}`);
    if (signal?.sideScope !== "corp") fail(errors, `${signalId} sideScope is not corp`);
  }
  const legacyDraw = tacticSignals.find((item) => item.signalId === "economy.corp_draw");
  if (legacyDraw && legacyDraw.notForDirectScoring !== true) fail(errors, "economy.corp_draw must be marked notForDirectScoring");

  for (const card of report.postReviewAssignments ?? []) {
    const activeHint = activeById.get(card.cardId);
    const compiledHint = compiledById.get(card.cardId);
    if (!activeHint) fail(errors, `missing active hint ${card.cardId}`);
    if (!compiledHint) fail(errors, `missing compiled hint ${card.cardId}`);
    for (const signal of card.tacticSignals ?? []) {
      if (!catalogIds.has(signal)) fail(errors, `${card.title} uses uncatalogued signal ${signal}`);
    }
    for (const strategyId of card.strategyAnchors ?? []) {
      if (!strategyIds.has(strategyId)) fail(errors, `${card.title} uses unknown strategy ${strategyId}`);
      if (strategyId.startsWith("runner.")) fail(errors, `${card.title} uses runner strategy ${strategyId}`);
    }
  }

  const hint = (cardId) => activeById.get(cardId);
  const card = (cardId) => reportCard(reportById, cardId);
  const roles = (cardId) => pairRoles(reportById, cardId);

  if (!hasAll(hint("onr_v1_340_setup"), ["access.corp_net_damage_ambush", "damage.payoff"])) fail(errors, "Setup! missing Net-Damage access ambush");
  if ((hint("onr_v1_340_setup")?.lineSupport ?? []).includes("corp.damage_kill")) fail(errors, "Setup! must not be Damage/Kill only for small net damage");

  if (!hasAll(hint("onr_v1_345_trap"), ["access.corp_net_damage_ambush", "access.corp_tag_ambush"])) fail(errors, "TRAP! missing access net/tag ambush semantics");
  if (roles("onr_v1_345_trap").includes("persistent_tag_source")) fail(errors, "TRAP! must not be persistent_tag_source");
  if (!roles("onr_v1_345_trap").includes("access_tag_source")) fail(errors, "TRAP! missing access_tag_source role");

  if (!hasAll(hint("onr_v1_346_vacant-soulkiller"), ["access.corp_brain_damage_ambush"])) fail(errors, "Vacant Soulkiller missing brain damage ambush");
  if (roles("onr_v1_346_vacant-soulkiller").includes("meat_damage_payoff")) fail(errors, "Vacant Soulkiller must not be meat_damage_payoff");

  if (!hasAll(hint("onr_v1_348_virus-test-site"), ["access.corp_net_damage_ambush"])) fail(errors, "Virus Test Site missing net damage ambush");
  if (roles("onr_v1_348_virus-test-site").includes("meat_damage_payoff")) fail(errors, "Virus Test Site must not be meat_damage_payoff");

  if (!hasAll(hint("onr_proteus_054_bel-digmo-antibody"), ["access.corp_rnd_net_damage_ambush", "rnd.corp_self_shuffle_access"])) {
    fail(errors, "Bel-Digmo Antibody missing R&D net damage ambush");
  }
  if (!hasAll(hint("onr_proteus_075_stereogram-antibody"), ["access.corp_archives_net_damage_ambush", "rnd.corp_self_shuffle_access"])) {
    fail(errors, "Stereogram Antibody missing Archives net damage ambush");
  }
  if (card("onr_proteus_075_stereogram-antibody")?.hiddenInfoPolicy === "archives_access_exception") {
    fail(errors, "Stereogram Antibody must not use archives safe exception as hidden-info policy");
  }

  if (roles("onr_v1_310_blood-cat").includes("trace_credit_enabler")) fail(errors, "Blood Cat must not be trace_credit_enabler");
  if (!roles("onr_v1_310_blood-cat").includes("trace_tag_source")) fail(errors, "Blood Cat missing trace_tag_source role");

  if ((hint("onr_v1_315_corprunners-shattered-remains")?.lineSupport ?? []).includes("corp.tag_trace_punish")) {
    fail(errors, "Corprunner's Shattered Remains must not anchor tag_trace_punish without tag/tagged text");
  }

  if (!hasAll(hint("onr_v1_333_omniscience-foundation"), ["tag.additional_tag_followup", "tag.payoff", "risk.requires_tagged_runner"])) {
    fail(errors, "Omniscience Foundation missing tag snowball/follow-up semantics");
  }
  if (!hasNone(hint("onr_v1_333_omniscience-foundation"), ["tag.source", "tag.corp_persistent_source"])) {
    fail(errors, "Omniscience Foundation still modeled as initial/persistent tag source");
  }

  if (!hasAll(hint("onr_v1_314_corporate-negotiating-center"), ["economy.corp_hq_agenda_reveal_credit", "info.hq_agenda_reveal", "risk.reveal_hq_agendas"])) {
    fail(errors, "Corporate Negotiating Center missing HQ agenda reveal semantics");
  }
  if (!hasNone(hint("onr_v1_314_corporate-negotiating-center"), ["risk.high_difficulty_agenda"])) fail(errors, "Corporate Negotiating Center still has high difficulty agenda risk");

  if (!hasAll(hint("onr_v1_316_cowboy-sysop"), ["hq.corp_installed_card_bounce", "install.corp_uninstall_to_hq"])) fail(errors, "Cowboy Sysop missing installed-card bounce");
  if (!hasNone(hint("onr_v1_316_cowboy-sysop"), ["archives.corp_recovery"])) fail(errors, "Cowboy Sysop still has Archives recovery");

  if (!hasAll(hint("onr_v1_336_rescheduler"), ["draw.corp_draw", "hq.corp_hand_refresh", "rnd.corp_shuffle_hq_into_rnd"])) fail(errors, "Rescheduler missing hand refresh semantics");
  if (!hasNone(hint("onr_v1_336_rescheduler"), ["rnd.corp_topdeck_setup"])) fail(errors, "Rescheduler still has topdeck setup");

  if (!hasAll(hint("onr_proteus_076_syd-meyer-superstores"), ["economy.corp_asset_cashout", "ice.corp_self_trash_cost", "risk.trash_own_rezzed_ice"])) {
    fail(errors, "Syd Meyer Superstores missing cashout/self-trash risk");
  }
  if (!hasNone(hint("onr_proteus_076_syd-meyer-superstores"), ["ice.corp_install_discount", "risk.temporary_rez_liability"])) {
    fail(errors, "Syd Meyer Superstores still has install discount or temporary-rez liability");
  }

  if (!hasAll(hint("onr_v1_321_esa-contract"), ["draw.corp_draw"])) fail(errors, "ESA Contract missing draw.corp_draw");
  if (!hasNone(hint("onr_v1_321_esa-contract"), ["economy.corp_draw"])) fail(errors, "ESA Contract still has economy.corp_draw");
  if (!hasAll(hint("onr_v1_322_euromarket-consortium"), ["draw.corp_draw", "setup.corp_hand_size"])) {
    fail(errors, "Euromarket Consortium missing draw/Corp hand-size split");
  }
  if (!hasNone(hint("onr_v1_322_euromarket-consortium"), ["economy.corp_draw", "score.hand_size"])) {
    fail(errors, "Euromarket Consortium still uses economy/score context");
  }
  if (!hasAll(hint("onr_v1_338_rustbelt-hq-branch"), ["setup.corp_hand_size"])) fail(errors, "Rustbelt HQ Branch missing Corp hand-size");
  if (!hasNone(hint("onr_v1_338_rustbelt-hq-branch"), ["score.hand_size"])) fail(errors, "Rustbelt HQ Branch still uses score.hand_size");

  if (!hasAll(hint("onr_v1_328_information-laundering"), ["economy.corp_counter_cashout", "economy.corp_advanceable_cashout"])) {
    fail(errors, "Information Laundering missing counter cashout semantics");
  }
  if (!hasAll(hint("onr_v1_318_department-of-truth-enhancement"), ["economy.corp_charge_bank", "economy.corp_action_charged_bank"])) {
    fail(errors, "Department of Truth Enhancement missing charge-bank semantics");
  }
  if (!hasAll(hint("onr_v1_343_south-african-mining-corp"), ["economy.corp_multi_action_credit"])) {
    fail(errors, "South African Mining Corp missing multi-action credit semantics");
  }

  for (const cardId of ["onr_v1_335_remote-facility", "onr_v1_331_nevinyrral"]) {
    if ((hint(cardId)?.lineSupport ?? []).length !== 0) fail(errors, `${cardId} must not auto-anchor extra actions`);
  }
  if (!hasAll(hint("onr_v1_331_nevinyrral"), ["risk.leaves_play_loss", "risk.loss_condition"])) fail(errors, "Nevinyrral missing leave-play/loss risk");
  if (!(hint("onr_v1_334_pacifica-regional-ai")?.lineSupport ?? []).includes("corp.fast_advance")) {
    fail(errors, "Pacifica Regional AI should retain Fast Advance anchor");
  }

  const staticConstraints = [
    ["onr_v1_317_data-masons", "only_walls"],
    ["onr_v1_320_encoder-inc", "only_code_gates"],
    ["onr_v1_341_skalderviken-sa-beta-test-site", "only_black_ice"],
  ];
  for (const [cardId, constraint] of staticConstraints) {
    if (card(cardId)?.targetProfileStatus !== "not_required") fail(errors, `${cardId} static scope must not be a TargetProfile`);
    if (!(card(cardId)?.constraints ?? []).includes(constraint)) fail(errors, `${cardId} missing constraint ${constraint}`);
  }
  if (card("onr_v1_324_fortress-architects")?.targetProfileStatus !== "not_required") {
    fail(errors, "Fortress Architects static install discount must not be a TargetProfile");
  }

  if (!hasAll(hint("onr_proteus_057_doppelganger-antibody"), ["access.corp_credit_loss_counter", "access.corp_counter_punish"])) {
    fail(errors, "Doppelganger Antibody missing credit-loss counter signal");
  }
  if (!hasAll(hint("onr_proteus_068_pattel-antibody"), ["access.corp_icebreaker_strength_counter", "access.corp_counter_punish"])) {
    fail(errors, "Pattel Antibody missing icebreaker-strength counter signal");
  }

  if (report.testNodeAssetSeparation?.activeTestNodeAssets?.length !== 2) fail(errors, "test/V08 asset separation missing active test assets");
  if (report.testNodeAssetSeparation?.testStrategySupportPairsExcludedFromProductionAggregation !== true) {
    fail(errors, "test/V08 StrategySupportPair separation not documented");
  }
  if (!report.hiddenInfoSafetyReview?.every((item) => item.result === "pass")) fail(errors, "hidden-info review is not all pass");

  if (errors.length > 0) {
    console.error(`AI026-1 Corp nodes/assets polish check failed (${errors.length}):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(
    `AI026-1 Corp nodes/assets polish check passed active=${activeCompiledAssets.length} changed=${report.countsAfter.changedCardCount} addedSignals=${NEW_SIGNALS.length}`,
  );
}

main();
