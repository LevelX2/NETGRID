#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const reportJsonPath =
  "docs/reviews/engine/card-function-abstraction-2026-06-12.json";
const reportMdPath =
  "docs/reviews/engine/card-function-abstraction-2026-06-12.md";

const writeReport = process.argv.includes("--write-report");

const scopedRoots = [
  "packages/engine/src/ability-engine",
  "packages/engine/src/game",
  "packages/engine/src/mechanics",
  "packages/engine/src/card-implementations",
  "packages/shared/src",
  "scripts",
];

const watchTokens = [
  {
    token: "preying_mantis",
    title: "Preying Mantis",
    target: "optional_extra_action_with_delayed_damage",
  },
  {
    token: "preyingMantis",
    title: "Preying Mantis",
    target: "abilityUseLedger / delayedEndTurnEffects",
  },
  {
    token: "quest_for_cattekin",
    title: "Quest for Cattekin",
    target: "start_turn_random_effect_table",
  },
  {
    token: "questForCattekin",
    title: "Quest for Cattekin",
    target: "persistentModifiers / start_turn_random_effect_table",
  },
  {
    token: "pirate_broadcast",
    title: "Pirate Broadcast",
    target: "multi_server_success_sequence",
  },
  {
    token: "pirateBroadcast",
    title: "Pirate Broadcast",
    target: "pendingSequences.multi_server_success_sequence",
  },
  {
    token: "bizarre_encryption_scheme",
    title: "Bizarre Encryption Scheme",
    target: "delayed_agenda_access_replacement",
  },
  {
    token: "bizarreEncryption",
    title: "Bizarre Encryption Scheme",
    target: "runDurationEffects.access_replacement",
  },
  {
    token: "code_viral_cache",
    title: "Code Viral Cache",
    target: "purge_replacement_with_runner_virus_counter_cleanup",
  },
  {
    token: "CODE_VIRAL_CACHE",
    title: "Code Viral Cache",
    target: "purge_replacement_with_runner_virus_counter_cleanup",
  },
  {
    token: "startup_immolator",
    title: "Startup Immolator",
    target: "trash_fully_broken_passed_ice",
  },
  {
    token: "startupImmolator",
    title: "Startup Immolator",
    target: "abilityUseLedger",
  },
  {
    token: "krumz",
    title: "Krumz",
    target: "recurring_trace_credit_pool",
  },
  {
    token: "Krumz",
    title: "Krumz",
    target: "recurring_trace_credit_pool",
  },
  {
    token: "siren",
    title: "Siren",
    target: "start_run_redirect_to_source_fort",
  },
  {
    token: "Siren",
    title: "Siren",
    target: "start_run_redirect_to_source_fort",
  },
  {
    token: "corporate_war",
    title: "Corporate War",
    target: "score_credit_swing_if_corp_credit_threshold_met",
  },
  {
    token: "project_babylon",
    title: "Project Babylon",
    target: "overadvance_bonus_agenda_points",
  },
  {
    token: "newsgroup_taunting",
    title: "Newsgroup Taunting",
    target: "run_start_tax",
  },
  {
    token: "newsgroupTaunting",
    title: "Newsgroup Taunting",
    target: "run_start_tax",
  },
  {
    token: "omniscience_foundation",
    title: "Omniscience Foundation",
    target: "end_turn_tag_on_successful_run_condition",
  },
  {
    token: "disinfectant",
    title: "Disinfectant",
    target: "counter_prevention_replacement",
  },
  {
    token: "silver_lining",
    title: "Silver Lining Recovery Protocol",
    target: "recovery_protocol_after_runner_action",
  },
  {
    token: "fortress_respecification",
    title: "Fortress Respecification",
    target: "ice_reorder_hidden_zone_effect",
  },
  {
    token: "social_engineering",
    title: "Social Engineering",
    target: "secret_guess_run_effect",
  },
  {
    token: "new_blood",
    title: "New Blood",
    target: "conceal_reorder_installed_ice",
  },
  {
    token: "shell_traders",
    title: "Shell Traders",
    target: "delayed_install_sequence",
  },
];

const abstractionPlan = [
  {
    priority: "slice_now",
    cardTitle: "Preying Mantis",
    currentNames: [
      "preying_mantis_optional_action_unpreventable_core_damage",
      "preying_mantis_gain_action",
      "resolvePreyingMantisGainAction",
      "preyingMantisUsedSourceIdsThisTurn",
      "preyingMantisDamageDueSourceIdsThisTurn",
    ],
    targetKind: "optional_extra_action_with_delayed_damage",
    targetState: [
      "runnerTurnFlags.abilityUsedSourceIdsByLimitKey[limitKey]",
      "runnerTurnFlags.delayedEndTurnEffects[]",
    ],
    params: {
      extraActions: 1,
      damageType: "core",
      damageAmount: 1,
      damageTiming: "end_of_turn",
      preventable: false,
      limit: "once_per_turn_per_source",
    },
    notes:
      "Erster vertikaler Slice, weil kind, Payload, Resolver und Turn-State zusammen sichtbar sind.",
  },
  {
    priority: "deferred_refactor_required",
    cardTitle: "Quest for Cattekin",
    currentNames: [
      "quest_for_cattekin_start_turn_random_permanent_action",
      "questForCattekinPermanentActionGain",
    ],
    targetKind: "start_turn_random_effect_table",
    targetState: ["runnerTurnFlags.persistentModifiers[]"],
    params: {
      dieFaces: 6,
      outcomes: [
        "trash_source_and_grant_permanent_extra_action",
        "unpreventable_core_damage",
        "unpreventable_net_damage",
        "no_effect",
      ],
    },
    notes:
      "Fachlich nah an Action-Economy/Delayed-Damage, aber wegen Random-/Permanent-State erst nach dem Muster-Slice.",
  },
  {
    priority: "deferred_refactor_required",
    cardTitle: "Pirate Broadcast",
    currentNames: ["pirateBroadcastPending", "pirateBroadcastRun"],
    targetKind: "multi_server_success_sequence",
    targetState: ["runnerTurnFlags.pendingSequences[]"],
    params: {
      sequence: "run_each_data_fort",
      advanceOnSuccessfulRun: true,
      failOnUnsuccessfulRun: true,
    },
    notes:
      "Größerer Sequenz-State; nicht in denselben Slice ziehen.",
  },
  {
    priority: "deferred_refactor_required",
    cardTitle: "Bizarre Encryption Scheme",
    currentNames: [
      "bizarre_encryption_scheme_access_replacement",
      "bizarreEncryptionSchemeActive",
      "bizarreEncryptionDelayedAgendas",
    ],
    targetKind: "delayed_agenda_access_replacement",
    targetState: ["runDurationEffects[]", "delayedAccessEffects[]"],
    params: {
      replacementWindow: "agenda_access",
      delay: "after_current_access_sequence",
    },
    notes:
      "Access-/Breach-State betrifft Hidden-Info-Grenzen und braucht eigenen Regression-Slice.",
  },
  {
    priority: "deferred_refactor_required",
    cardTitle: "Code Viral Cache",
    currentNames: ["code_viral_cache_purge_replacement", "CODE_VIRAL_CACHE_ID"],
    targetKind: "purge_replacement_with_runner_virus_counter_cleanup",
    targetState: ["replacementEffects[]"],
    params: {
      interruptedEvent: "corp_purge_virus_counters",
      runnerVirusCounterCleanup: true,
    },
    notes:
      "Purge-Replacement bleibt als eigene Event-/Replacement-Familie.",
  },
  {
    priority: "deferred_refactor_required",
    cardTitle: "Startup Immolator",
    currentNames: [
      "startup_immolator_trash_fully_broken_ice",
      "startupImmolatorUsedSourceIdsThisTurn",
    ],
    targetKind: "trash_fully_broken_passed_ice",
    targetState: ["runnerTurnFlags.abilityUsedSourceIdsByLimitKey[limitKey]"],
    params: {
      triggerWindow: "after_passing_fully_broken_ice",
      target: "that_ice",
      limit: "once_per_turn_per_source",
    },
    notes:
      "Kann nach Ability-Use-Ledger auf dieselbe Limit-Infrastruktur wie Preying Mantis wechseln.",
  },
  {
    priority: "deferred_refactor_required",
    cardTitle: "Krumz",
    currentNames: ["krumz_trace_bit", "spendKrumzTraceBits"],
    targetKind: "recurring_trace_credit_pool",
    targetState: ["recurringCreditPools[]"],
    params: {
      amount: 1,
      spendWindow: "trace",
      refresh: "start_of_corp_turn_after_use",
    },
    notes:
      "Soll mit vorhandenen Trace-Credit- und Recurring-Credit-Pfaden zusammengeführt werden.",
  },
  {
    priority: "deferred_refactor_required",
    cardTitle: "Siren",
    currentNames: ["siren_start_run_redirect"],
    targetKind: "start_run_redirect_to_source_fort",
    targetState: ["runStartInterventions[]"],
    params: {
      redirectTarget: "source_fort",
      triggerWindow: "run_start",
    },
    notes:
      "Run-Redirect braucht side-sichere Serverbindung und darf keine Hidden-Info über Zielauswahl leaken.",
  },
  {
    priority: "deferred_refactor_required",
    cardTitle: "Corporate War / Project Babylon",
    currentNames: ["corporate_war_credit_swing", "project_babylon_bonus_points"],
    targetKind:
      "score_credit_swing_if_corp_credit_threshold_met / overadvance_bonus_agenda_points",
    targetState: ["scoredAgendaAbilities[]"],
    params: {
      triggerWindow: "agenda_scored",
      conditionSource: "agenda_params",
    },
    notes:
      "Agenda-Scoring-Familien sollten über parametrisierte Scored-Agenda-Abilities laufen.",
  },
];

const functionalFiles = new Set([
  "packages/engine/src/ability-engine/definition-types.ts",
  "packages/shared/src/index.ts",
]);

function listFiles() {
  const output = execFileSync("git", ["ls-files", ...scopedRoots], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((path) => path !== "scripts/check-card-name-leakage-in-runtime.mjs")
    .filter((path) => /\.(ts|tsx|mjs|js)$/.test(path));
}

function lineColumnFor(text, index) {
  const before = text.slice(0, index);
  const lines = before.split(/\r?\n/);
  return { line: lines.length, column: lines.at(-1).length + 1 };
}

function lineText(text, lineNumber) {
  return text.split(/\r?\n/)[lineNumber - 1]?.trim() ?? "";
}

function isTestFile(path) {
  return /\.test\.tsx?$/.test(path) || path.includes("/test-fixtures/");
}

function isCatalogPath(path) {
  return path.includes("packages/engine/src/card-implementations/");
}

function isRegistryPath(path) {
  return path === "packages/engine/src/card-implementations/registry.ts";
}

function isCommentOnly(line) {
  return line.startsWith("//") || line.startsWith("*") || line.startsWith("/*");
}

function classify({ path, token, snippet }) {
  if (isTestFile(path)) return "test_only_card_name";
  if (isRegistryPath(path)) return "allowed_catalog_reference";
  if (isCatalogPath(path)) {
    if (snippet.includes("cardDefinitionId") || isCommentOnly(snippet))
      return "allowed_catalog_reference";
    if (snippet.includes("kind:")) return "functional_kind_uses_card_name";
    return "allowed_catalog_reference";
  }
  if (snippet.includes("kind:")) return "functional_kind_uses_card_name";
  if (snippet.includes("runnerUtilityAbility") || snippet.includes("corpAbility"))
    return "payload_key_uses_card_name";
  if (snippet.match(/\bfunction\s+resolve[A-Z]/) || snippet.match(/\bconst\s+resolve[A-Z]/))
    return "resolver_function_uses_card_name";
  if (
    functionalFiles.has(path) &&
    (snippet.includes("?:") || snippet.includes(": {") || snippet.includes("= {"))
  )
    return "runtime_state_field_uses_card_name";
  if (token === token.toUpperCase() && snippet.includes(token))
    return "mechanics_constant_controls_behavior_by_card_id";
  if (path.includes("/game/") || path.includes("/mechanics/"))
    return "runtime_state_field_uses_card_name";
  return "false_positive";
}

function findOccurrences() {
  const findings = [];
  for (const path of listFiles()) {
    const text = readFileSync(`${repoRoot}/${path}`, "utf8");
    for (const watch of watchTokens) {
      let index = text.indexOf(watch.token);
      while (index !== -1) {
        const position = lineColumnFor(text, index);
        const snippet = lineText(text, position.line);
        findings.push({
          path,
          line: position.line,
          column: position.column,
          token: watch.token,
          cardTitle: watch.title,
          category: classify({ path, token: watch.token, snippet }),
          targetAbstraction: watch.target,
          snippet,
        });
        index = text.indexOf(watch.token, index + watch.token.length);
      }
    }
  }
  return findings.sort((a, b) =>
    `${a.path}:${String(a.line).padStart(6, "0")}:${a.token}`.localeCompare(
      `${b.path}:${String(b.line).padStart(6, "0")}:${b.token}`,
    ),
  );
}

function summary(findings) {
  return findings.reduce((acc, finding) => {
    acc[finding.category] = (acc[finding.category] ?? 0) + 1;
    return acc;
  }, {});
}

function renderMarkdown(report) {
  const lines = [
    "# Card Function Abstraction Review 2026-06-12",
    "",
    `Status: ${report.status}`,
    "",
    "## Kurzbefund",
    "",
    "Kartennamen sind in Katalog- und Testkontexten weiterhin zulässig. Problematisch sind kartenspezifische Namen in funktionalen `kind`-Werten, Payload-Keys, Runtime-State-Feldern, Resolvernamen und verhaltenssteuernden Konstanten.",
    "",
    "## Zählung",
    "",
    "| Kategorie | Anzahl |",
    "| --- | ---: |",
  ];
  for (const [category, count] of Object.entries(report.summary)) {
    lines.push(`| ${category} | ${count} |`);
  }
  lines.push("", "## Problemstellen", "");
  for (const finding of report.findings.filter(
    (entry) =>
      ![
        "allowed_catalog_reference",
        "test_only_card_name",
        "false_positive",
      ].includes(entry.category),
  )) {
    lines.push(
      `- ${finding.category}: \`${finding.path}:${finding.line}\` ${finding.cardTitle} / \`${finding.token}\` -> \`${finding.targetAbstraction}\``,
    );
  }
  lines.push("", "## Abstraktionsplan", "");
  lines.push("| Priorität | Fundklasse | Zielbaustein | State-Ziel |");
  lines.push("| --- | --- | --- | --- |");
  for (const entry of report.abstractionPlan) {
    lines.push(
      `| ${entry.priority} | ${entry.cardTitle} | \`${entry.targetKind}\` | ${entry.targetState.map((value) => `\`${value}\``).join(", ")} |`,
    );
  }
  lines.push("", "## Nächste Umsetzung", "");
  lines.push(
    "Der erste Code-Slice refaktoriert `Preying Mantis`, weil dort alle problematischen Ebenen in einem schmalen Pfad zusammenfallen: `kind`, Payload-Ability, Resolvername, Usage-State und Delayed-End-Turn-State.",
  );
  lines.push("", "## Erlaubte Referenzen", "");
  for (const finding of report.findings.filter(
    (entry) => entry.category === "allowed_catalog_reference",
  )) {
    lines.push(
      `- \`${finding.path}:${finding.line}\` ${finding.cardTitle} / \`${finding.token}\``,
    );
  }
  return `${lines.join("\n")}\n`;
}

const findings = findOccurrences();
const report = {
  schemaVersion: 1,
  generatedAt: "2026-06-12",
  status: "inventory",
  scope: scopedRoots,
  categories: [
    "allowed_catalog_reference",
    "functional_kind_uses_card_name",
    "runtime_state_field_uses_card_name",
    "payload_key_uses_card_name",
    "resolver_function_uses_card_name",
    "mechanics_constant_controls_behavior_by_card_id",
    "test_only_card_name",
    "false_positive",
  ],
  summary: summary(findings),
  abstractionPlan,
  findings,
};

if (writeReport) {
  mkdirSync(`${repoRoot}/docs/reviews/engine`, { recursive: true });
  writeFileSync(`${repoRoot}/${reportJsonPath}`, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(`${repoRoot}/${reportMdPath}`, renderMarkdown(report));
  console.log(
    `Wrote ${report.findings.length} findings to ${reportJsonPath} and ${reportMdPath}.`,
  );
  process.exit(0);
}

if (!existsSync(`${repoRoot}/${reportJsonPath}`)) {
  console.error(`Missing baseline report ${reportJsonPath}. Run with --write-report.`);
  process.exit(1);
}

const expected = JSON.parse(readFileSync(`${repoRoot}/${reportJsonPath}`, "utf8"));
const normalize = (value) =>
  JSON.stringify({ ...value, generatedAt: "baseline" }, null, 2);
if (normalize(report) !== normalize(expected)) {
  console.error(
    "Card function abstraction inventory changed. Run scripts/check-card-name-leakage-in-runtime.mjs --write-report and review the diff.",
  );
  process.exit(1);
}

console.log(
  `Card function abstraction inventory matches ${report.findings.length} baseline findings.`,
);
