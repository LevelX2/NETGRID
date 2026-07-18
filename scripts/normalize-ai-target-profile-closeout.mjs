#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const ACTIVE_HINTS_PATH = path.join(
  REPO_ROOT,
  "data/ai/ai-card-hints-active.json",
);

function profile(
  kind,
  timing,
  targetType,
  purpose,
  preferences,
  avoid = ["hidden_info_dependent_choice"],
  hiddenInfoPolicy = "legal_targets_only",
) {
  return {
    schemaVersion: "target-profile-v1",
    kind,
    timing,
    targetType,
    purpose,
    preferences,
    avoid,
    hiddenInfoPolicy,
  };
}

const ADVANCE_TARGET = (timing) =>
  profile("use_target", timing, "card", "advance_high_value_corp_card", [
    "prefer_option_that_protects_agenda_or_remote_pressure",
    "central_or_remote_plan_enabler",
  ]);
const INSTALL_TARGET = (timing, targetType = "card") =>
  profile("install_target", timing, targetType, "install_best_legal_target", [
    "high_install_cost_or_memory",
    "central_or_remote_plan_enabler",
  ]);
const REZ_ICE_TARGET = (timing) =>
  profile("use_target", timing, "installed_ice", "rez_best_defensive_ice", [
    "high_rez_cost_relief",
    "blocks_relevant_run_path",
    "protects_agenda_remote",
  ]);
const BREAK_SUBROUTINE_TARGET = profile(
  "use_target",
  "during_ice_encounter",
  "subroutine",
  "break_subroutines_that_preserve_run_goal",
  ["current_run_path_relevance", "high_run_denial_payoff"],
  [],
);

const TARGET_PROFILES_BY_CARD = new Map([
  [
    "onr_classic_023_shock-treatment",
    [
      profile(
        "use_target",
        "on_access",
        "card",
        "trash_high_value_installed_runner_card",
        ["high_install_cost_or_memory", "currently_used_breaker"],
      ),
    ],
  ],
  [
    "onr_proteus_009_viral-breeding-ground",
    [
      profile(
        "use_target",
        "on_score",
        "program",
        "bounce_high_value_runner_program",
        ["installed_icebreaker", "high_install_cost_or_memory"],
      ),
    ],
  ],
  ["onr_proteus_079_big-frackin-gun", [BREAK_SUBROUTINE_TARGET]],
  ["onr_proteus_093_redecorator", [BREAK_SUBROUTINE_TARGET]],
  [
    "onr_proteus_104_decoy-signal",
    [
      profile(
        "use_target",
        "start_of_run",
        "installed_ice",
        "expose_ice_on_relevant_run_path",
        ["relevant_server_ice", "blocks_relevant_run_path"],
      ),
    ],
  ],
  ["onr_proteus_110_hijack", [INSTALL_TARGET("on_play")]],
  [
    "onr_proteus_120_reconnaissance",
    [
      profile(
        "use_target",
        "on_play",
        "installed_ice",
        "expose_ice_on_relevant_run_path",
        ["relevant_server_ice", "blocks_relevant_run_path"],
      ),
    ],
  ],
  [
    "onr_proteus_146_precision-bribery",
    [
      profile(
        "use_target",
        "on_play",
        "server",
        "lock_fort_creation_with_near_term_value",
        ["protects_agenda_remote", "current_run_path_relevance"],
      ),
    ],
  ],
  ["onr_v1_047_pile-driver", [BREAK_SUBROUTINE_TARGET]],
  [
    "onr_v1_043_mystery-box",
    [
      profile(
        "search_install_target",
        "activated_ability",
        "program",
        "install_best_program_for_current_rig_need",
        [
          "program_repairs_missing_coverage",
          "program_affordable_after_install",
          "program_preserves_run_goal",
        ],
      ),
    ],
  ],
  [
    "onr_v1_059_self-modifying-code",
    [
      profile(
        "search_install_target",
        "activated_ability",
        "program",
        "install_program_that_answers_current_ice_or_setup_gap",
        [
          "program_breaks_current_ice",
          "program_repairs_missing_coverage",
          "program_affordable_after_install",
        ],
      ),
    ],
  ],
  [
    "onr_v1_075_zetatech-software-installer",
    [
      profile(
        "install_target",
        "activated_ability",
        "program",
        "install_best_program_with_recurring_credit",
        [
          "program_repairs_missing_coverage",
          "program_affordable_after_install",
          "high_install_cost_or_memory",
        ],
      ),
    ],
  ],
  [
    "onr_v1_157_crash-everett-inventive-fixer",
    [
      profile(
        "search_install_target",
        "activated_ability",
        "card",
        "filter_stack_for_current_setup_need",
        ["missing_current_coverage", "central_or_remote_plan_enabler"],
      ),
    ],
  ],
  [
    "onr_v1_179_silicon-saloon-franchise",
    [
      profile(
        "use_target",
        "paid_action",
        "card",
        "search_for_current_setup_or_economy_need",
        ["missing_current_coverage", "central_or_remote_plan_enabler"],
      ),
    ],
  ],
  ["onr_v1_189_artificial-security-directors", [ADVANCE_TARGET("on_score")]],
  [
    "onr_v1_194_corporate-downsizing",
    [
      profile(
        "use_target",
        "on_score",
        "card",
        "reveal_and_shuffle_agendas_from_hq",
        ["protect_agenda_density", "lowest_near_term_value"],
        [],
        "public_or_controller_known_only",
      ),
    ],
  ],
  [
    "onr_v1_197_data-fort-reclamation",
    [
      profile(
        "install_target",
        "on_score",
        "card",
        "create_remote_with_best_hq_cards",
        [
          "prefer_option_that_protects_agenda_or_remote_pressure",
          "central_or_remote_plan_enabler",
        ],
        [],
        "public_or_controller_known_only",
      ),
    ],
  ],
  ["onr_v1_201_executive-extraction", [ADVANCE_TARGET("on_score")]],
  ["onr_v1_202_genetics-visionary-acquisition", [ADVANCE_TARGET("on_score")]],
  [
    "onr_v1_204_ice-transmutation",
    [
      profile(
        "use_target",
        "on_score",
        "installed_ice",
        "strengthen_and_repeat_best_ice_subroutine",
        ["multi_subroutine_ice", "blocks_relevant_run_path"],
      ),
      profile(
        "use_target",
        "subroutine_resolution",
        "subroutine",
        "repeat_highest_impact_subroutine",
        ["high_run_denial_payoff", "current_run_path_relevance"],
        [],
      ),
    ],
  ],
  ["onr_v1_212_priority-requisition", [REZ_ICE_TARGET("on_score")]],
  [
    "onr_v1_215_security-net-optimization",
    [
      profile(
        "use_target",
        "on_score",
        "server",
        "strengthen_ice_on_most_relevant_fort",
        ["protects_agenda_remote", "protects_central_access_pressure"],
      ),
    ],
  ],
  ["onr_v1_216_security-purge", [INSTALL_TARGET("on_score")]],
  ["onr_v1_289_edgerunner-inc-temps", [INSTALL_TARGET("on_play")]],
  ["onr_v1_292_management-shake-up", [ADVANCE_TARGET("on_play")]],
  [
    "onr_v1_296_off-site-backups",
    [
      profile(
        "use_target",
        "on_play",
        "card",
        "recover_best_archives_card_to_hq",
        ["central_or_remote_plan_enabler", "protect_agenda_density"],
        [],
        "public_or_controller_known_only",
      ),
    ],
  ],
  [
    "onr_v1_298_planning-consultants",
    [
      profile(
        "mode_choice",
        "on_play",
        "card",
        "order_rnd_top_cards_for_near_term_plan",
        ["central_or_remote_plan_enabler", "protect_agenda_density"],
        [],
        "public_or_controller_known_only",
      ),
    ],
  ],
  ["onr_v1_300_project-consultants", [ADVANCE_TARGET("on_play")]],
  ["onr_v1_304_systematic-layoffs", [ADVANCE_TARGET("on_play")]],
  ["onr_v1_305_team-restructuring", [ADVANCE_TARGET("on_play")]],
  [
    "onr_v1_312_chicago-branch",
    [ADVANCE_TARGET("activated_ability")],
  ],
  [
    "onr_v1_316_cowboy-sysop",
    [
      profile(
        "use_target",
        "activated_ability",
        "card",
        "return_lowest_near_term_value_installed_card",
        ["lowest_near_term_value"],
      ),
    ],
  ],
  ["onr_v1_317_data-masons", [REZ_ICE_TARGET("corp_rez_window")]],
  ["onr_v1_320_encoder-inc", [REZ_ICE_TARGET("corp_rez_window")]],
  ["onr_v1_324_fortress-architects", [INSTALL_TARGET("activated_ability")]],
  [
    "onr_v1_341_skalderviken-sa-beta-test-site",
    [REZ_ICE_TARGET("corp_rez_window")],
  ],
]);

function parseMode(argv) {
  if (argv.length !== 1 || !["--check", "--write"].includes(argv[0])) {
    throw new Error("Use --check or --write.");
  }
  return argv[0].slice(2);
}

function formatProfiles(profiles, newline) {
  return JSON.stringify(profiles, null, 2).replace(/\n/g, `${newline}      `);
}

const mode = parseMode(process.argv.slice(2));
let text = fs.readFileSync(ACTIVE_HINTS_PATH, "utf8");
const data = JSON.parse(text);
const cardsById = new Map((data.cards ?? []).map((card) => [card.cardId, card]));
const newline = text.includes("\r\n") ? "\r\n" : "\n";
const insertions = [];

for (const [cardId, profiles] of TARGET_PROFILES_BY_CARD) {
  const card = cardsById.get(cardId);
  if (!card) throw new Error(`Unknown card id: ${cardId}`);
  if (card.targetProfiles !== undefined) {
    if (JSON.stringify(card.targetProfiles) !== JSON.stringify(profiles)) {
      throw new Error(`Target profiles differ for ${cardId}.`);
    }
    continue;
  }
  const cardMarker = `      "cardId": ${JSON.stringify(cardId)}`;
  const cardStart = text.indexOf(cardMarker);
  const nextCardStart = text.indexOf(`${newline}    {${newline}      "cardId":`, cardStart + 1);
  const cardEnd = nextCardStart >= 0 ? nextCardStart : text.length;
  const statusMarker = `${newline}      "aiSupportStatus":`;
  const statusIndex = text.indexOf(statusMarker, cardStart);
  if (statusIndex < 0 || statusIndex >= cardEnd) {
    throw new Error(`Could not place target profiles for ${cardId}.`);
  }
  const formatted =
    `${newline}      "targetProfiles": ${formatProfiles(profiles, newline)},`;
  insertions.push({ index: statusIndex, formatted });
}

for (const insertion of insertions.sort((left, right) => right.index - left.index)) {
  text = `${text.slice(0, insertion.index)}${insertion.formatted}${text.slice(insertion.index)}`;
}

if (mode === "write") {
  fs.writeFileSync(ACTIVE_HINTS_PATH, text, "utf8");
} else if (insertions.length > 0) {
  console.error("AI target profile closeout is stale.");
  process.exitCode = 1;
}
console.log(
  JSON.stringify({
    status: "pass",
    mode,
    reviewedCards: TARGET_PROFILES_BY_CARD.size,
    insertedCards: insertions.length,
  }),
);
