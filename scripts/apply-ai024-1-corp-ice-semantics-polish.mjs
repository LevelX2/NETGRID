#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GENERATED_AT = "2026-06-02";
const CORRECTS_COMMIT = "466bf28d";
const SOURCE_COMMIT = "cf7753c3";

const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const TACTIC_SIGNAL_PATH = "data/ai/tactic-signals-v1.json";
const DERIVATION_PATH = "data/ai/function-signal-derivation-v1.json";
const MD_REPORT_PATH = "docs/reviews/ai/ai024-1-corp-ice-semantics-polish-2026-06-02.md";
const JSON_REPORT_PATH = "docs/reviews/ai/ai024-1-corp-ice-semantics-polish-report-2026-06-02.json";
const README_PATH = "docs/reviews/ai/README.md";

const AI024_1_SIGNALS = {
  "corp_ice.jackout_lock": [false, ["corp.ice_tax_glacier"]],
  "corp_ice.runner_action_loss": [false, ["corp.ice_tax_glacier"]],
  "corp_ice.next_ice_break_lock": [false, ["corp.ice_tax_glacier"]],
  "corp_ice.encounter_paid_subroutine_add": [false, ["corp.ice_tax_glacier"]],
  "corp_ice.optional_self_bounce_gain": [true, []],
  "corp_ice.runner_pay_or_program_trash": [false, ["corp.ice_tax_glacier"]],
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

const CARD_FIXES = {
  "onr_v1_221_asp": {
    title: "Asp",
    signals: ["corp_ice.conditional_end_run", "corp_ice.run_lock", "corp_ice.trace_source", "trace.source"],
    lineSupport: ["corp.ice_tax_glacier"],
    strategicRole: ["tax_tool"],
    rationale: "Trace-success end-run plus post-run action payment lock; no tag text.",
  },
  "onr_v1_240_fang": {
    title: "Fang",
    signals: ["corp_ice.conditional_end_run", "corp_ice.end_run", "corp_ice.run_lock", "corp_ice.trace_source", "trace.source"],
    lineSupport: ["corp.ice_tax_glacier"],
    strategicRole: ["tax_tool"],
    rationale: "Trace-success end-run plus run lock; no tag text.",
  },
  "onr_v1_241_fang-2-0": {
    title: "Fang 2.0",
    signals: ["corp_ice.conditional_end_run", "corp_ice.run_lock", "corp_ice.trace_source", "trace.source"],
    lineSupport: ["corp.ice_tax_glacier"],
    strategicRole: ["tax_tool"],
    rationale: "Trace-success end-run plus run lock; no tag text.",
  },
  "onr_v1_243_fetch-4-0-1": {
    title: "Fetch 4.0.1",
    signals: ["corp_ice.tag_source", "corp_ice.trace_source", "tag.source", "trace.source"],
    rationale: "Trace-success tag source only; no end-run text.",
  },
  "onr_v1_249_hunter": {
    title: "Hunter",
    signals: ["corp_ice.tag_source", "corp_ice.trace_source", "tag.source", "trace.source"],
    rationale: "Trace-success tag source only; no end-run text.",
  },
  "onr_v1_264_rex": {
    title: "Rex",
    signals: ["corp_ice.conditional_end_run", "corp_ice.run_lock", "corp_ice.trace_source", "trace.source"],
    lineSupport: ["corp.ice_tax_glacier"],
    strategicRole: ["tax_tool"],
    rationale: "Trace-success end-run plus action-payment run lock; no tag text.",
  },
  "onr_v1_246_fragmentation-storm": {
    title: "Fragmentation Storm",
    signals: ["corp_ice.conditional_end_run", "corp_ice.program_trash", "corp_ice.run_lock", "corp_ice.trace_source", "trace.source"],
    lineSupport: ["corp.ice_tax_glacier"],
    strategicRole: ["tax_tool"],
    rationale: "Trace-success end-run, program trash and run lock; removes false net-damage semantics.",
  },
  "onr_v1_251_jack-attack": {
    title: "Jack Attack",
    signals: ["corp_ice.jackout_lock", "corp_ice.tag_source", "corp_ice.trace_source", "tag.source", "trace.source"],
    lineSupport: ["corp.ice_tax_glacier"],
    strategicRole: ["tax_tool"],
    rationale: "Explicit jack-out lock plus trace-success tag.",
  },
  "onr_v1_268_shock-r": {
    title: "Shock.r",
    signals: ["corp_ice.jackout_lock", "corp_ice.next_ice_break_lock"],
    lineSupport: ["corp.ice_tax_glacier"],
    strategicRole: ["tax_tool"],
    rationale: "Next-ICE break lock and temporary jack-out lock replace generic other_utility.",
  },
  "onr_v1_271_tko-2-0": {
    title: "TKO 2.0",
    signals: ["corp_ice.end_run", "corp_ice.runner_action_loss"],
    lineSupport: ["corp.ice_tax_glacier"],
    strategicRole: ["tax_tool"],
    rationale: "End-run plus explicit next-action loss.",
  },
  "onr_v1_272_too-many-doors": {
    title: "Too Many Doors",
    signals: ["corp_ice.conditional_end_run", "corp_ice.random_or_guessing"],
    rationale: "Secret bid can end the run; removes false R&D reorder signal.",
  },
  "onr_v1_280_zombie": {
    title: "Zombie",
    signals: ["corp_ice.brain_damage", "corp_ice.damage_source", "corp_ice.end_run", "damage.payoff"],
    lineSupport: ["corp.damage_kill"],
    strategicRole: ["punish_payoff"],
    rationale: "Two brain damage subroutines plus end-run; no generic other_utility.",
  },
  "onr_proteus_014_chihuahua": {
    title: "Chihuahua",
    signals: ["corp_ice.damage_source", "corp_ice.net_damage", "corp_ice.rez_economy", "corp_ice.trace_source", "damage.payoff", "trace.source"],
    rationale: "Trace-success net damage plus on-rez economy.",
  },
  "onr_proteus_015_colonel-failure": {
    title: "Colonel Failure",
    signals: ["corp_ice.end_run", "corp_ice.multi_end_run", "corp_ice.program_trash"],
    rationale: "Three program-trash and two end-run subroutines; removes false self-bounce/maintenance drawback.",
  },
  "onr_proteus_016_coyote": {
    title: "Coyote",
    signals: ["corp_ice.future_strength_buff", "corp_ice.rez_economy"],
    lineSupport: ["corp.ice_tax_glacier"],
    strategicRole: ["tax_tool"],
    rationale: "Future ICE strength buff plus on-rez economy.",
  },
  "onr_proteus_018_datacomb": {
    title: "Datacomb",
    signals: ["corp_ice.end_run", "corp_ice.self_bounce_or_maintenance_drawback"],
    rationale: "End-run plus pass-triggered pay-or-uninstall drawback; no rez economy.",
  },
  "onr_proteus_019_death-yo-yo": {
    title: "Death Yo-Yo",
    signals: ["corp_ice.brain_damage", "corp_ice.damage_source", "corp_ice.end_run", "corp_ice.optional_self_bounce_gain", "damage.payoff"],
    lineSupport: ["corp.damage_kill"],
    strategicRole: ["punish_payoff"],
    rationale: "Brain damage/end-run plus optional pass-triggered self-bounce gain.",
  },
  "onr_proteus_025_homing-missile": {
    title: "Homing Missile",
    signals: ["corp_ice.conditional_end_run", "corp_ice.rez_paid_scaling", "corp_ice.run_lock", "corp_ice.trace_source", "trace.source"],
    lineSupport: ["corp.ice_tax_glacier"],
    strategicRole: ["tax_tool"],
    rationale: "Rez-paid trace scaling, conditional ETR and run lock.",
  },
  "onr_proteus_027_iceberg": {
    title: "Iceberg",
    signals: ["corp_ice.damage_source", "corp_ice.encounter_paid_subroutine_add", "corp_ice.net_damage", "damage.payoff"],
    lineSupport: ["corp.ice_tax_glacier"],
    strategicRole: ["tax_tool"],
    rationale: "Net damage plus encounter-paid end-run subroutine add.",
  },
  "onr_proteus_029_marionette": {
    title: "Marionette",
    signals: ["corp_ice.end_run", "corp_ice.program_trash", "corp_ice.self_bounce_or_maintenance_drawback"],
    rationale: "Program trash/end-run plus pass-triggered pay-or-uninstall drawback, support-only.",
  },
  "onr_proteus_032_misleading-access-menus": {
    title: "Misleading Access Menus",
    signals: ["corp_ice.encounter_tax", "corp_ice.rez_economy", "corp_ice.runner_pay_or_end_run"],
    lineSupport: ["corp.ice_tax_glacier"],
    strategicRole: ["tax_tool"],
    rationale: "Runner pay-or-end-run plus on-rez economy; no run_lock.",
  },
  "onr_proteus_034_riddler": {
    title: "Riddler",
    signals: ["corp_ice.encounter_paid_subroutine_add"],
    lineSupport: ["corp.ice_tax_glacier"],
    strategicRole: ["tax_tool"],
    rationale: "Encounter-paid end-run subroutine add, not vanilla ETR.",
  },
  "onr_proteus_037_scaffolding": {
    title: "Scaffolding",
    signals: ["corp_ice.end_run", "corp_ice.optional_self_bounce_gain"],
    rationale: "End-run plus optional pass-triggered self-bounce gain.",
  },
  "onr_proteus_038_snowbank": {
    title: "Snowbank",
    signals: ["corp_ice.encounter_tax", "corp_ice.rez_economy", "corp_ice.runner_pay_or_end_run"],
    lineSupport: ["corp.ice_tax_glacier"],
    strategicRole: ["tax_tool"],
    rationale: "Runner pay-or-end-run plus on-rez economy; no run_lock.",
  },
  "onr_proteus_042_tumblers": {
    title: "Tumblers",
    signals: ["corp_ice.end_run", "corp_ice.optional_self_bounce_gain"],
    rationale: "End-run plus optional pass-triggered self-bounce gain.",
  },
  "onr_proteus_043_twisty-passages": {
    title: "Twisty Passages",
    signals: ["corp_ice.end_run", "corp_ice.self_bounce_or_maintenance_drawback"],
    rationale: "End-run plus pass-triggered pay-or-uninstall drawback.",
  },
  "onr_proteus_045_washed-up-solo-construct": {
    title: "Washed-Up Solo Construct",
    signals: ["corp_ice.program_trash", "corp_ice.rez_economy", "corp_ice.runner_pay_or_program_trash"],
    rationale: "Runner pay-or-program-trash plus on-rez economy; support-only to avoid over-broad program-trash anchoring.",
  },
  "onr_v1_230_cortical-scanner": {
    title: "Cortical Scanner",
    signals: ["corp_ice.end_run", "corp_ice.multi_end_run"],
    rationale: "Three real end-run subroutines.",
  },
  "onr_v1_239_endless-corridor": {
    title: "Endless Corridor",
    signals: ["corp_ice.end_run", "corp_ice.multi_end_run"],
    rationale: "Two real end-run subroutines.",
  },
  "onr_v1_263_reinforced-wall": {
    title: "Reinforced Wall",
    signals: ["corp_ice.end_run", "corp_ice.multi_end_run"],
    rationale: "Two real end-run subroutines.",
  },
  "onr_v1_278_wall-of-ice": {
    title: "Wall of Ice",
    signals: ["corp_ice.damage_source", "corp_ice.end_run", "corp_ice.multi_end_run", "corp_ice.net_damage", "damage.payoff"],
    lineSupport: ["corp.damage_kill", "corp.ice_tax_glacier"],
    strategicRole: ["punish_payoff", "tax_tool"],
    rationale: "Two net damage and two end-run subroutines.",
  },
  "onr_proteus_041_toughoniumtm-wall": {
    title: "Toughonium Wall",
    signals: ["corp_ice.end_run", "corp_ice.multi_end_run"],
    rationale: "Four real end-run subroutines.",
  },
  "onr_v1_238_data-wall-2-0": {
    title: "Data Wall 2.0",
    signals: ["corp_ice.end_run"],
    rationale: "Repo text has a single end-run subroutine.",
  },
};

const SIMPLE_PROGRAM_TRASH_SUPPORT_ONLY = [
  "onr_v1_223_banpei",
  "onr_v1_233_d-arc-knight",
  "onr_v1_235_data-naga",
  "onr_v1_250_ice-pick-willie",
  "onr_v1_267_sentinels-prime",
  "onr_v1_273_triggerman",
];

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

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function signalDescription(signalId) {
  return `AI024-1 Corp ICE polish tactic signal: ${signalId.replaceAll("_", " ")}.`;
}

function signalGroup(signalId) {
  if (signalId.includes("jackout") || signalId.includes("action") || signalId.includes("lock")) return "ai024_1_corp_ice_lock_tax";
  if (signalId.includes("subroutine")) return "ai024_1_corp_ice_paid_subroutine";
  if (signalId.includes("program_trash")) return "ai024_1_corp_ice_program_trash";
  if (signalId.includes("bounce")) return "ai024_1_corp_ice_bounce";
  return "ai024_1_corp_ice";
}

function updateTacticSignals() {
  const catalog = readJson(TACTIC_SIGNAL_PATH);
  catalog.signals = (catalog.signals ?? []).filter((signal) => !FORBIDDEN_SUBTYPE_SIGNALS.has(signal.signalId));
  const byId = new Map(catalog.signals.map((signal) => [signal.signalId, signal]));
  for (const [signalId, [supportOnly, anchors]] of Object.entries(AI024_1_SIGNALS)) {
    const signal = byId.get(signalId) ?? { signalId };
    signal.group = signalGroup(signalId);
    signal.sideScope = "corp";
    signal.description = signalDescription(signalId);
    signal.supportOnly = supportOnly;
    signal.mayAnchorStrategy = !supportOnly;
    signal.allowedStrategyAnchors = [...anchors].sort();
    signal.sourceKinds = ["AI024-1 corrected Corp-ICE structured hint effects"];
    signal.examples = signal.examples ?? [];
    signal.targetProfileRelevant = signalId.includes("paid") || signalId.includes("program_trash") || signalId.includes("lock");
    signal.notes =
      "AI024-1 Corp-ICE polish signal; read-only semantics only. It does not create planner, engine, legality, targeting, profile/default, action-score or plan-weight behavior.";
    if (!byId.has(signalId)) {
      catalog.signals.push(signal);
      byId.set(signalId, signal);
    }
  }
  catalog.taskId = "AI024-1";
  catalog.generatedAt = GENERATED_AT;
  catalog.description =
    "Controlled V1 tactic-signal catalog. AI024-1 sharpens selected Corp-ICE function signals without subtype-only or card-specific signals and without planner, engine, targeting, action-score, plan-weight, legality, profile/default or UI-derivation effects.";
  catalog.signals.sort((left, right) => left.signalId.localeCompare(right.signalId));
  writeJson(TACTIC_SIGNAL_PATH, catalog);
  return Object.keys(AI024_1_SIGNALS).map((signalId) => byId.get(signalId));
}

function updateDerivationRules() {
  const data = readJson(DERIVATION_PATH);
  data.derivationRules = (data.derivationRules ?? []).filter((rule) => !FORBIDDEN_SUBTYPE_SIGNALS.has(rule.signalId));
  const existing = new Set(
    data.derivationRules.map((rule) => `${rule.signalId}:${JSON.stringify(rule.match)}:${JSON.stringify(rule.gates)}`),
  );
  for (const [signalId, [, anchors]] of Object.entries(AI024_1_SIGNALS)) {
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
  data.taskId = "AI024-1";
  data.updatesTaskId = `${data.updatesTaskId ?? "AI003-AI026"}/AI024-1`;
  data.generatedAt = GENERATED_AT;
  data.description =
    "Read-only side-aware derivation contract for function signals from existing structured AI hint fields. AI024-1 sharpens selected Corp-ICE semantics while keeping Planner, targeting-AI, action-score, plan-weight, engine, legality, profile/default and UI-derivation effects unchanged.";
  data.derivationRules.sort((left, right) =>
    `${left.signalId}:${JSON.stringify(left.match)}`.localeCompare(`${right.signalId}:${JSON.stringify(right.match)}`),
  );
  writeJson(DERIVATION_PATH, data);
}

function applyActiveHints() {
  const data = readJson(ACTIVE_HINTS_PATH);
  const byId = new Map((data.cards ?? []).map((hint) => [hint.cardId, hint]));
  const changedCards = [];
  for (const [cardId, fix] of Object.entries(CARD_FIXES)) {
    const hint = byId.get(cardId);
    if (!hint) throw new Error(`Missing active hint for ${cardId}`);
    const before = JSON.stringify(hint);
    hint.tacticSignals = unique(fix.signals);
    if (fix.lineSupport?.length) hint.lineSupport = unique(fix.lineSupport);
    else delete hint.lineSupport;
    if (fix.strategicRole?.length) hint.strategicRole = unique(fix.strategicRole);
    else delete hint.strategicRole;
    hint.quality = {
      ...(hint.quality ?? {}),
      benchmarkCovered: hint.quality?.benchmarkCovered === true,
      hintReviewed: true,
      strategyCovered: (hint.lineSupport ?? []).length > 0,
      confidence: "high",
      needsHumanReview: false,
      reviewedDate: GENERATED_AT,
      reviewedBy: "codex",
    };
    if (JSON.stringify(hint) !== before) changedCards.push({ cardId, title: fix.title, ...fix });
  }
  for (const cardId of SIMPLE_PROGRAM_TRASH_SUPPORT_ONLY) {
    const hint = byId.get(cardId);
    if (!hint) throw new Error(`Missing active hint for ${cardId}`);
    const before = JSON.stringify(hint);
    hint.tacticSignals = unique(["corp_ice.end_run", "corp_ice.program_trash"]);
    delete hint.lineSupport;
    delete hint.strategicRole;
    hint.quality = {
      ...(hint.quality ?? {}),
      benchmarkCovered: hint.quality?.benchmarkCovered === true,
      hintReviewed: true,
      strategyCovered: false,
      confidence: "high",
      needsHumanReview: false,
      reviewedDate: GENERATED_AT,
      reviewedBy: "codex",
    };
    if (JSON.stringify(hint) !== before) {
      changedCards.push({
        cardId,
        title: hint.title ?? cardId,
        signals: hint.tacticSignals,
        rationale: "Simple program-trash plus ETR ICE stays support-only and no longer auto-anchors Corp ICE Tax/Glacier.",
      });
    }
  }
  writeJson(ACTIVE_HINTS_PATH, data);
  return changedCards;
}

function pairFor(cardId, fix) {
  const pairs = [];
  for (const strategyId of fix.lineSupport ?? []) {
    const evidence = unique(
      fix.signals.filter((signal) => {
        if (strategyId === "corp.damage_kill") return signal.includes("damage") || signal === "damage.payoff";
        if (strategyId === "corp.ice_tax_glacier") return !signal.includes("damage") && !signal.includes("tag") && !signal.includes("trace");
        return true;
      }),
    );
    pairs.push({
      cardId,
      title: fix.title,
      strategyId,
      role: strategyId === "corp.damage_kill" ? "damage_pressure" : "ice_tax_or_lock_piece",
      evidence,
      confidence: "medium",
    });
  }
  return pairs;
}

function buildReport(changedCards, addedSignals) {
  const changedStrategySupportPairs = changedCards.flatMap((item) => pairFor(item.cardId, item));
  return {
    schemaVersion: "ai024-1-corp-ice-semantics-polish-report-v1",
    taskId: "AI024-1",
    generatedAt: GENERATED_AT,
    status: "complete",
    sourceCommit: SOURCE_COMMIT,
    correctsCommit: CORRECTS_COMMIT,
    countsBefore: {
      activeCompiledCorpIce: 95,
      inactiveCheckedCorpIce: 11,
    },
    countsAfter: {
      activeCompiledCorpIce: 95,
      inactiveCheckedCorpIce: 11,
      changedCardCount: changedCards.length,
      addedSignalCount: addedSignals.length,
      newStrategyIdCount: 0,
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
    changedCards: changedCards.map((item) => ({
      cardId: item.cardId,
      title: item.title,
      tacticSignals: unique(item.signals),
      strategyAnchors: unique(item.lineSupport ?? []),
      rationale: item.rationale,
    })),
    changedSignals: changedCards.map((item) => ({ cardId: item.cardId, title: item.title, tacticSignals: unique(item.signals) })),
    removedSignals: [
      { signalId: "corp_ice.rnd_reorder", removedFrom: ["Too Many Doors"], rationale: "No R&D reorder text." },
      { signalId: "corp_ice.net_damage", removedFrom: ["Fragmentation Storm"], rationale: "No net-damage text." },
      { signalId: "corp_ice.tag_source", removedFrom: ["Asp", "Fang", "Fang 2.0", "Rex"], rationale: "Trace locks end runs; no tag text." },
      { signalId: "tag.source", removedFrom: ["Asp", "Fang", "Fang 2.0", "Rex"], rationale: "No tag text." },
      { signalId: "corp_ice.self_bounce_or_maintenance_drawback", removedFrom: ["Colonel Failure"], rationale: "No self-bounce or maintenance drawback text." },
    ],
    addedSignals: addedSignals.map((signal) => ({
      signalId: signal.signalId,
      supportOnly: signal.supportOnly,
      mayAnchorStrategy: signal.mayAnchorStrategy,
      allowedStrategyAnchors: signal.allowedStrategyAnchors,
    })),
    changedStrategySupportPairs,
    retainedDeferredItems: [
      {
        topic: "target_profile_activation",
        decision: "deferred",
        rationale: "Paid scaling, secret bids, action locks and program trash targets remain diagnostic/read-only until side-safe TargetProfile consumption exists.",
      },
    ],
    hiddenInfoSafetyReview: [
      {
        topic: "corp_ice_hidden_semantics",
        result: "pass",
        notes: "Corp-ICE semantics remain corp_side_only_until_rezzed until ICE is rezzed, exposed or otherwise legally known.",
      },
      {
        topic: "runtime_visibility",
        result: "pass",
        notes: "AI024-1 adds no WebSocket, reconnect, undo-preview, replay, PublicEvents, log, client-error, planner or Targeting-AI projection path.",
      },
    ],
    verification: [{ command: "node scripts/check-ai024-1-corp-ice-semantics-polish.mjs", result: "pending_after_apply" }],
  };
}

function updateReadme() {
  if (!fs.existsSync(repoPath(README_PATH))) return;
  const text = fs.readFileSync(repoPath(README_PATH), "utf8");
  const entry =
    "- `ai024-1-corp-ice-semantics-polish-2026-06-02.md` / `ai024-1-corp-ice-semantics-polish-report-2026-06-02.json`: AI024-1 schärft ausgewählte Corp-ICE-Signale nach, korrigiert falsche Tag-/Damage-/R&D-Reorder-/Self-Bounce-Zuordnungen, ergänzt sechs kontrollierte Lock-/Paid-/Bounce-/Program-Trash-Signale und begrenzt einfache Program-Trash-ICE als support-only. Keine neue Strategy-ID und keine Planner-, ActionScore-, PlanWeight-, Targeting-KI-, Engine-, Legalitäts-, Profil-/Default-, UI- oder Hidden-Info-Wirkung.";
  if (text.includes("ai024-1-corp-ice-semantics-polish-2026-06-02.md")) {
    writeText(
      README_PATH,
      text.replace(
        /^- `ai024-1-corp-ice-semantics-polish-2026-06-02\.md` \/ `ai024-1-corp-ice-semantics-polish-report-2026-06-02\.json`: .*$/m,
        entry,
      ),
    );
    return;
  }
  const marker = "- `ai024-corp-ice-semantics-review-2026-06-02.md`";
  const index = text.indexOf(marker);
  if (index === -1) {
    writeText(README_PATH, `${text.trimEnd()}\n${entry}\n`);
    return;
  }
  const lineEnd = text.indexOf("\n", index);
  writeText(README_PATH, `${text.slice(0, lineEnd + 1)}${entry}\n${text.slice(lineEnd + 1)}`);
}

function buildMarkdown(report) {
  return `# AI024-1 Corp-ICE-Taktiksignale und Strategieanker

## Kurzfazit

AI024-1 korrigiert ${report.countsAfter.changedCardCount} ausgewählte Corp-ICE-Hints aus dem AI024-Stand. Die Abdeckung bleibt bei ${report.countsAfter.activeCompiledCorpIce} aktiven/compiled Corp-ICE und ${report.countsAfter.inactiveCheckedCorpIce} inaktiven Classic-ICE. Es werden ${report.countsAfter.addedSignalCount} kontrollierte Funktionssignale ergänzt; es gibt keine neue Strategy-ID und keine Planner-, ActionScore-, PlanWeight-, Targeting-, Engine-, Legalitäts-, Profil-/Default-, UI- oder Hidden-Info-Wirkung.

## Neue Signale

${report.addedSignals.map((signal) => `- \`${signal.signalId}\`: supportOnly=${signal.supportOnly}, mayAnchor=${signal.mayAnchorStrategy}`).join("\n")}

## Geänderte Karten

${report.changedCards.map((card) => `- ${card.title}: ${card.tacticSignals.map((signal) => `\`${signal}\``).join(", ")}. ${card.rationale}`).join("\n")}

## Entfernte falsche Zuordnungen

${report.removedSignals.map((item) => `- \`${item.signalId}\`: ${item.removedFrom.join(", ")}. ${item.rationale}`).join("\n")}

## Hidden-Info-Grenzen

Corp-ICE-Semantik bleibt \`corp_side_only_until_rezzed\`, bis ICE rezzed, exposed oder anderweitig legal bekannt ist. AI024-1 ergänzt keine Runner-seitige unrezzed-ICE-Sicht und keine WebSocket-, Reconnect-, Undo-, Replay-, PublicEvents-, Log-, Client-Error-, Planner- oder Targeting-KI-Projektion.

## Deferred Items

${report.retainedDeferredItems.map((item) => `- ${item.topic}: ${item.decision}. ${item.rationale}`).join("\n")}
`;
}

function main() {
  const addedSignals = updateTacticSignals();
  updateDerivationRules();
  const changedCards = applyActiveHints();
  const report = buildReport(changedCards, addedSignals);
  writeJson(JSON_REPORT_PATH, report);
  writeText(MD_REPORT_PATH, buildMarkdown(report));
  updateReadme();
  console.log(`AI024-1 applied changed=${changedCards.length} addedSignals=${addedSignals.length}`);
}

main();
