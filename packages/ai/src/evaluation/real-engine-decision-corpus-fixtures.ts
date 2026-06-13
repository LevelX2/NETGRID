import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import snapshotsData08 from "../../../../data/decks/deck-snapshots-0.8.json";
import type { GameState, LegalAction, Side } from "@netgrid/shared";
import type { AiDeckDoctrineDeckSnapshot } from "../deck-doctrine";
import { buildDeckDoctrineV2Diagnostic } from "../deck-doctrine-strategy";
import {
  buildRunnerEconomyPosture,
  evaluateRunnerRunTargets,
} from "../runner-run-target-evaluation";
import { buildAiDecisionInput } from "../runtime/ai-decision-input";
import type {
  RealEngineDecisionCorpusLeagueExpectation,
  RealEngineDecisionCorpusScenario,
} from "./real-engine-decision-corpus";
import {
  RealEngineFixtureBuilder,
  type RealEngineFixtureMutator,
} from "./real-engine-fixture-builder";

export const REAL_ENGINE_DECISION_CORPUS_SCENARIO_IDS = [
  "runner_real_low_credits",
  "runner_real_safe_hq_access",
  "runner_real_safe_rd_access",
  "runner_real_target_choice_hq_remote_mix",
  "runner_real_target_choice_discard_choice",
  "runner_real_remote_score_threat",
  "runner_real_damage_buffer_needed",
  "runner_real_tag_cleanup",
  "runner_real_click_limited_economy",
  "runner_real_remote_probe",
  "runner_real_rnd_pressure_with_buffer",
  "runner_real_high_credits_setup",
  "runner_real_empty_hand_draw",
  "runner_real_tagged_low_credits",
  "runner_real_safe_archives_access",
  "runner_real_remote_with_ice_probe",
  "runner_real_low_click_tag_cleanup",
  "runner_real_remote_unknown_no_contest",
  "runner_real_remote_known_agenda_contest",
  "runner_real_run_blocked_missing_coverage",
  "runner_real_run_blocked_unpayable",
  "runner_real_tagged_remove_before_run",
  "runner_real_draw_before_damage_risk",
  "runner_real_setup_install_breaker",
  "runner_real_basic_end_turn_when_no_good_action",
  "runner_real_hq_multiaccess_payoff",
  "runner_real_rd_multiaccess_payoff",
  "corp_real_score_agenda_window",
  "corp_real_advance_score_window",
  "corp_real_target_choice_multi_score_payload",
  "corp_real_target_choice_multi_advance_payload",
  "corp_real_low_rez_reserve",
  "corp_real_rez_value_window",
  "corp_real_do_not_rez_when_broke",
  "corp_real_basic_economy_draw",
  "corp_real_remote_defense_setup",
  "corp_real_install_credit_pressure",
  "corp_real_high_credit_main_window",
  "corp_real_score_low_credits",
  "corp_real_remote_ice_defense",
  "corp_real_low_credit_main_window",
  "corp_real_rez_affordable_outer_ice",
  "corp_real_remote_double_asset_setup",
  "corp_real_draw_pressure_window",
  "corp_real_score_now_vs_gain_credit",
  "corp_real_advance_not_score_yet",
  "corp_real_rez_too_expensive_decline",
  "corp_real_hq_pressure_defend",
  "corp_real_rnd_pressure_defend",
  "corp_real_no_punish_without_tag",
  "corp_real_punish_candidate_tagged_runner_shadow_only",
  "corp_real_install_remote_when_safe",
  "corp_real_asset_economy_install",
  "corp_real_fast_advance_support_shadow_only",
] as const;

const LEAGUE_EXPECTATION_BY_SCENARIO_ID = {
  runner_real_low_credits: expectation(["gain_credit", "draw_card"], {
    pilotEligibleScopes: ["basic_setup"],
    forbiddenMistakes: ["economy_starvation"],
    notes: ["low credits should prefer economy or draw stabilization"],
  }),
  runner_real_safe_hq_access: expectation(["start_run"], {
    pilotEligibleScopes: ["runner_safe_access"],
    forbiddenMistakes: ["missed_safe_access"],
    notes: ["safe central run should stay visible to shadow league"],
  }),
  runner_real_safe_rd_access: expectation(["start_run"], {
    pilotEligibleScopes: ["runner_safe_access"],
    forbiddenMistakes: ["missed_safe_access"],
  }),
  runner_real_target_choice_hq_remote_mix: expectation(["start_run"], {
    forbiddenMistakes: ["target_choice_unavailable"],
    notes: ["target-choice corpus keeps central and remote run payloads visible"],
  }),
  runner_real_target_choice_discard_choice: expectation(["resolve_choice"], {
    forbiddenMistakes: ["target_choice_unavailable"],
    notes: ["target-choice corpus covers real Engine choice requirements"],
  }),
  runner_real_remote_score_threat: expectation(["start_run"], {
    forbiddenMistakes: ["ignored_remote_threat"],
    notes: ["remote contest remains report-only until a productive scope exists"],
  }),
  runner_real_damage_buffer_needed: expectation(["draw_card"], {
    forbiddenMistakes: ["ignored_damage_risk", "unsafe_run"],
  }),
  runner_real_tag_cleanup: expectation(["remove_tag"], {
    forbiddenMistakes: ["unsafe_run"],
  }),
  runner_real_tagged_remove_before_run: expectation(["remove_tag"], {
    forbiddenMistakes: ["unsafe_run"],
  }),
  runner_real_remote_known_agenda_contest: expectation(["start_run"], {
    forbiddenMistakes: ["ignored_remote_threat"],
  }),
  runner_real_draw_before_damage_risk: expectation(["draw_card"], {
    forbiddenMistakes: ["ignored_damage_risk", "unsafe_run"],
  }),
  corp_real_score_agenda_window: expectation(["score_agenda"], {
    pilotEligibleScopes: ["corp_score_window"],
    forbiddenMistakes: ["missed_score_window"],
  }),
  corp_real_advance_score_window: expectation(["advance_card"], {
    forbiddenMistakes: ["missed_score_window"],
  }),
  corp_real_target_choice_multi_score_payload: expectation(["score_agenda"], {
    forbiddenMistakes: ["target_choice_unavailable", "missed_score_window"],
  }),
  corp_real_target_choice_multi_advance_payload: expectation(["advance_card"], {
    forbiddenMistakes: ["target_choice_unavailable", "missed_score_window"],
  }),
  corp_real_low_rez_reserve: expectation(["gain_credit", "draw_card"], {
    forbiddenMistakes: ["bad_rez_spend"],
  }),
  corp_real_rez_value_window: expectation(["rez_ice"], {
    forbiddenMistakes: ["bad_rez_spend"],
  }),
  corp_real_do_not_rez_when_broke: expectation(["decline_rez"], {
    forbiddenMistakes: ["bad_rez_spend"],
  }),
  corp_real_basic_economy_draw: expectation(["gain_credit", "draw_card"], {
    pilotEligibleScopes: ["basic_setup"],
    forbiddenMistakes: ["economy_starvation"],
  }),
  corp_real_score_now_vs_gain_credit: expectation(["score_agenda"], {
    pilotEligibleScopes: ["corp_score_window"],
    forbiddenMistakes: ["missed_score_window"],
  }),
  corp_real_advance_not_score_yet: expectation(["advance_card"], {
    forbiddenMistakes: ["missed_score_window"],
  }),
  corp_real_rez_too_expensive_decline: expectation(["decline_rez"], {
    forbiddenMistakes: ["bad_rez_spend"],
  }),
} as const satisfies Partial<
  Record<
    (typeof REAL_ENGINE_DECISION_CORPUS_SCENARIO_IDS)[number],
    RealEngineDecisionCorpusLeagueExpectation
  >
>;

export function buildRealEngineDecisionCorpusScenarios(): RealEngineDecisionCorpusScenario[] {
  return [
    runnerScenario(
      "runner_real_low_credits",
      "real-runner-low-credits",
      (fixture) => {
        fixture.withRunnerCredits(0);
      },
      [],
      "onr_origin_runner_ai_snapshot_v1",
    ),
    runnerScenario(
      "runner_real_safe_hq_access",
      "real-runner-safe-hq",
      (fixture) => {
        fixture.withRunnerCredits(7);
      },
      [],
      "onr_origin_runner_ai_snapshot_v1",
    ),
    runnerScenario(
      "runner_real_safe_rd_access",
      "real-runner-safe-rd",
      (fixture) => {
        fixture.withRunnerCredits(7);
      },
      [],
      "onr_origin_runner_ai_snapshot_v1",
    ),
    runnerScenario(
      "runner_real_target_choice_hq_remote_mix",
      "real-runner-target-choice-mix",
      (fixture) => {
        fixture.withRunnerCredits(9).withCorpRemoteAgenda("remote_1", 2, {
          faceup: true,
          rezzed: false,
        });
      },
      ["fixture:target_choice_hq_remote_mix"],
      "proteus_runner_hq_virus_derez_snapshot_v2026_05_25",
    ),
    runnerDiscardChoiceScenario(
      "runner_real_target_choice_discard_choice",
      "real-runner-target-choice-discard",
      "onr_origin_runner_ai_snapshot_v1",
    ),
    runnerScenario(
      "runner_real_remote_score_threat",
      "real-runner-remote-threat",
      (fixture) => {
        fixture.withRunnerCredits(8).withCorpRemoteAgenda("remote_1", 2, {
          faceup: true,
          rezzed: false,
        });
      },
      ["fixture:remote_score_threat"],
      "proteus_runner_hq_virus_derez_snapshot_v2026_05_25",
    ),
    runnerScenario(
      "runner_real_damage_buffer_needed",
      "real-runner-damage-buffer",
      (fixture) => {
        fixture.withRunnerCredits(4).withRunnerGripSize(1);
      },
      ["fixture:low_hand_buffer"],
      "onr_origin_runner_ai_snapshot_v1",
    ),
    runnerScenario(
      "runner_real_tag_cleanup",
      "real-runner-tag-cleanup",
      (fixture) => {
        fixture.withRunnerTags(1).withRunnerCredits(5);
      },
      [],
      "onr_origin_runner_ai_snapshot_v1",
    ),
    runnerScenario(
      "runner_real_click_limited_economy",
      "real-runner-click-limited-economy",
      (fixture) => {
        fixture.withRunnerClicks(1).withRunnerCredits(1);
      },
      ["fixture:runner_click_limited"],
      "demo_runner_008_snapshot_v0_8",
    ),
    runnerScenario(
      "runner_real_remote_probe",
      "real-runner-remote-probe",
      (fixture) => {
        fixture.withRunnerCredits(6).ensureServer("remote_2");
      },
      ["fixture:runner_remote_probe"],
      "proteus_runner_hq_virus_derez_snapshot_v2026_05_25",
    ),
    runnerScenario(
      "runner_real_rnd_pressure_with_buffer",
      "real-runner-rnd-pressure-buffer",
      (fixture) => {
        fixture.withRunnerCredits(9).withRunnerGripSize(4);
      },
      ["fixture:rnd_pressure_with_buffer"],
      "onr_origin_runner_ai_snapshot_v1",
    ),
    runnerScenario(
      "runner_real_high_credits_setup",
      "real-runner-high-credits-setup",
      (fixture) => {
        fixture.withRunnerCredits(12);
      },
      ["fixture:runner_high_credits_setup"],
      "demo_runner_008_snapshot_v0_8",
    ),
    runnerScenario(
      "runner_real_empty_hand_draw",
      "real-runner-empty-hand-draw",
      (fixture) => {
        fixture.withRunnerCredits(5).withRunnerGripSize(0);
      },
      ["fixture:runner_empty_hand"],
      "onr_origin_runner_ai_snapshot_v1",
    ),
    runnerScenario(
      "runner_real_tagged_low_credits",
      "real-runner-tagged-low-credits",
      (fixture) => {
        fixture.withRunnerTags(2).withRunnerCredits(1);
      },
      ["fixture:runner_tagged_low_credits"],
      "onr_origin_runner_ai_snapshot_v1",
    ),
    runnerScenario(
      "runner_real_safe_archives_access",
      "real-runner-safe-archives",
      (fixture) => {
        fixture.withRunnerCredits(7);
      },
      ["fixture:runner_archives_access"],
      "proteus_runner_hq_virus_derez_snapshot_v2026_05_25",
    ),
    runnerScenario(
      "runner_real_remote_with_ice_probe",
      "real-runner-remote-ice-probe",
      (fixture) => {
        fixture
          .withRunnerCredits(9)
          .ensureServer("remote_2")
          .withCorpIceOnServer("remote_2", "simple_barrier_ice");
      },
      ["fixture:runner_remote_with_ice_probe"],
      "proteus_runner_hq_virus_derez_snapshot_v2026_05_25",
    ),
    runnerScenario(
      "runner_real_low_click_tag_cleanup",
      "real-runner-low-click-tag-cleanup",
      (fixture) => {
        fixture.withRunnerClicks(1).withRunnerTags(1).withRunnerCredits(4);
      },
      ["fixture:runner_low_click_tag_cleanup"],
      "onr_origin_runner_ai_snapshot_v1",
    ),
    runnerScenario(
      "runner_real_remote_unknown_no_contest",
      "real-runner-remote-unknown-no-contest",
      (fixture) => {
        fixture.withRunnerCredits(6).ensureServer("remote_3");
      },
      ["fixture:runner_remote_unknown_no_contest"],
      "proteus_runner_hq_virus_derez_snapshot_v2026_05_25",
    ),
    runnerScenario(
      "runner_real_remote_known_agenda_contest",
      "real-runner-remote-known-agenda-contest",
      (fixture) => {
        fixture.withRunnerCredits(9).withCorpRemoteAgenda("remote_2", 2, {
          faceup: true,
          rezzed: false,
        });
      },
      ["fixture:runner_remote_known_agenda_contest"],
      "proteus_runner_hq_virus_derez_snapshot_v2026_05_25",
    ),
    runnerScenario(
      "runner_real_run_blocked_missing_coverage",
      "real-runner-blocked-missing-coverage",
      (fixture) => {
        fixture
          .withRunnerCredits(5)
          .ensureServer("remote_2")
          .withCorpIceOnServer("remote_2", "simple_barrier_ice");
      },
      ["fixture:runner_run_blocked_missing_coverage"],
      "onr_origin_runner_ai_snapshot_v1",
    ),
    runnerScenario(
      "runner_real_run_blocked_unpayable",
      "real-runner-blocked-unpayable",
      (fixture) => {
        fixture
          .withRunnerCredits(0)
          .ensureServer("remote_2")
          .withCorpIceOnServer("remote_2", "simple_barrier_ice");
      },
      ["fixture:runner_run_blocked_unpayable"],
      "onr_origin_runner_ai_snapshot_v1",
    ),
    runnerScenario(
      "runner_real_tagged_remove_before_run",
      "real-runner-tagged-remove-before-run",
      (fixture) => {
        fixture.withRunnerTags(2).withRunnerCredits(6);
      },
      ["fixture:runner_tagged_remove_before_run"],
      "onr_origin_runner_ai_snapshot_v1",
    ),
    runnerScenario(
      "runner_real_draw_before_damage_risk",
      "real-runner-draw-before-damage-risk",
      (fixture) => {
        fixture.withRunnerCredits(4).withRunnerGripSize(1);
      },
      ["fixture:runner_draw_before_damage_risk"],
      "onr_origin_runner_ai_snapshot_v1",
    ),
    runnerScenario(
      "runner_real_setup_install_breaker",
      "real-runner-setup-install-breaker",
      (fixture) => {
        fixture.withRunnerCredits(5);
      },
      ["fixture:runner_setup_install_breaker"],
      "demo_runner_008_snapshot_v0_8",
    ),
    runnerScenario(
      "runner_real_basic_end_turn_when_no_good_action",
      "real-runner-basic-end-turn",
      (fixture) => {
        fixture.withRunnerClicks(0).withRunnerCredits(0);
      },
      ["fixture:runner_basic_end_turn_when_no_good_action"],
      "onr_origin_runner_ai_snapshot_v1",
    ),
    runnerScenario(
      "runner_real_hq_multiaccess_payoff",
      "real-runner-hq-multiaccess-payoff",
      (fixture) => {
        fixture.withRunnerCredits(9);
      },
      ["fixture:runner_hq_multiaccess_payoff"],
      "proteus_runner_hq_virus_derez_snapshot_v2026_05_25",
    ),
    runnerScenario(
      "runner_real_rd_multiaccess_payoff",
      "real-runner-rd-multiaccess-payoff",
      (fixture) => {
        fixture.withRunnerCredits(9);
      },
      ["fixture:runner_rd_multiaccess_payoff"],
      "onr_origin_runner_ai_snapshot_v1",
    ),
    corpScenario(
      "corp_real_score_agenda_window",
      "real-corp-score-window",
      (fixture) => {
        fixture.withCorpCredits(8).withCorpRemoteAgenda("remote_1", 3);
      },
      ["fixture:score_agenda_window"],
      "onr_origin_corp_ai_snapshot_v1",
    ),
    corpScenario(
      "corp_real_advance_score_window",
      "real-corp-advance-window",
      (fixture) => {
        fixture.withCorpCredits(8).withCorpRemoteAgenda("remote_1", 2);
      },
      ["fixture:advance_to_score_window"],
      "onr_origin_corp_ai_snapshot_v1",
    ),
    corpScenario(
      "corp_real_target_choice_multi_score_payload",
      "real-corp-target-choice-multi-score",
      (fixture) => {
        fixture
          .withCorpCredits(10)
          .withCorpRemoteAgenda("remote_1", 3)
          .withCorpRemoteAgenda("remote_2", 3);
      },
      ["fixture:target_choice_multi_score_payload"],
      "onr_origin_corp_ai_snapshot_v1",
    ),
    corpScenario(
      "corp_real_target_choice_multi_advance_payload",
      "real-corp-target-choice-multi-advance",
      (fixture) => {
        fixture
          .withCorpCredits(10)
          .withCorpRemoteAgenda("remote_1", 2)
          .withCorpRemoteAgenda("remote_2", 2);
      },
      ["fixture:target_choice_multi_advance_payload"],
      "onr_origin_corp_ai_snapshot_v1",
    ),
    corpScenario(
      "corp_real_low_rez_reserve",
      "real-corp-low-rez-reserve",
      (fixture) => {
        fixture.withCorpCredits(1);
      },
      [],
      "onr_origin_corp_ai_snapshot_v1",
    ),
    corpRezScenario(
      "corp_real_rez_value_window",
      "real-corp-rez-value",
      8,
      "onr_origin_corp_ai_snapshot_v1",
    ),
    corpRezScenario(
      "corp_real_do_not_rez_when_broke",
      "real-corp-no-rez",
      0,
      "onr_origin_corp_ai_snapshot_v1",
    ),
    corpScenario(
      "corp_real_basic_economy_draw",
      "real-corp-economy-draw",
      (fixture) => {
        fixture.withCorpCredits(0);
      },
      [],
      "demo_corp_008_snapshot_v0_8",
    ),
    corpScenario(
      "corp_real_remote_defense_setup",
      "real-corp-remote-defense-setup",
      (fixture) => {
        fixture.withCorpCredits(6).withCorpRemoteAgenda("remote_1", 1);
      },
      ["fixture:corp_remote_defense_setup"],
      "proteus_corp_region_fast_score_snapshot_v2026_05_25",
    ),
    corpScenario(
      "corp_real_install_credit_pressure",
      "real-corp-install-credit-pressure",
      (fixture) => {
        fixture.withCorpCredits(2);
      },
      ["fixture:corp_install_credit_pressure"],
      "demo_corp_008_snapshot_v0_8",
    ),
    corpScenario(
      "corp_real_high_credit_main_window",
      "real-corp-high-credit-main-window",
      (fixture) => {
        fixture.withCorpCredits(12);
      },
      ["fixture:corp_high_credit_main_window"],
      "onr_origin_corp_ai_snapshot_v1",
    ),
    corpScenario(
      "corp_real_score_low_credits",
      "real-corp-score-low-credits",
      (fixture) => {
        fixture.withCorpCredits(1).withCorpRemoteAgenda("remote_1", 3);
      },
      ["fixture:corp_score_low_credits"],
      "onr_origin_corp_ai_snapshot_v1",
    ),
    corpScenario(
      "corp_real_remote_ice_defense",
      "real-corp-remote-ice-defense",
      (fixture) => {
        fixture
          .withCorpCredits(5)
          .ensureServer("remote_2")
          .withCorpIceOnServer("remote_2", "simple_barrier_ice");
      },
      ["fixture:corp_remote_ice_defense"],
      "proteus_corp_region_fast_score_snapshot_v2026_05_25",
    ),
    corpScenario(
      "corp_real_low_credit_main_window",
      "real-corp-low-credit-main-window",
      (fixture) => {
        fixture.withCorpCredits(1);
      },
      ["fixture:corp_low_credit_main_window"],
      "demo_corp_008_snapshot_v0_8",
    ),
    corpRezScenario(
      "corp_real_rez_affordable_outer_ice",
      "real-corp-rez-affordable-outer-ice",
      4,
      "onr_origin_corp_ai_snapshot_v1",
    ),
    corpScenario(
      "corp_real_remote_double_asset_setup",
      "real-corp-remote-double-asset-setup",
      (fixture) => {
        fixture
          .withCorpCredits(7)
          .withCorpRemoteRoot("remote_1", "simple_economy_asset")
          .ensureServer("remote_2");
      },
      ["fixture:corp_remote_double_asset_setup"],
      "proteus_corp_region_fast_score_snapshot_v2026_05_25",
    ),
    corpScenario(
      "corp_real_draw_pressure_window",
      "real-corp-draw-pressure-window",
      (fixture) => {
        fixture.withCorpCredits(3).withCorpHqSize(1);
      },
      ["fixture:corp_draw_pressure_window"],
      "demo_corp_008_snapshot_v0_8",
    ),
    corpScenario(
      "corp_real_score_now_vs_gain_credit",
      "real-corp-score-now-vs-gain-credit",
      (fixture) => {
        fixture.withCorpCredits(8).withCorpRemoteAgenda("remote_1", 3);
      },
      ["fixture:corp_score_now_vs_gain_credit"],
      "onr_origin_corp_ai_snapshot_v1",
    ),
    corpScenario(
      "corp_real_advance_not_score_yet",
      "real-corp-advance-not-score-yet",
      (fixture) => {
        fixture.withCorpCredits(8).withCorpRemoteAgenda("remote_1", 1);
      },
      ["fixture:corp_advance_not_score_yet"],
      "onr_origin_corp_ai_snapshot_v1",
    ),
    corpRezScenario(
      "corp_real_rez_too_expensive_decline",
      "real-corp-rez-too-expensive-decline",
      0,
      "onr_origin_corp_ai_snapshot_v1",
    ),
    corpScenario(
      "corp_real_hq_pressure_defend",
      "real-corp-hq-pressure-defend",
      (fixture) => {
        fixture.withCorpCredits(5).withCorpIceOnServer("hq", "simple_barrier_ice");
      },
      ["fixture:corp_hq_pressure_defend"],
      "onr_origin_corp_ai_snapshot_v1",
    ),
    corpScenario(
      "corp_real_rnd_pressure_defend",
      "real-corp-rnd-pressure-defend",
      (fixture) => {
        fixture.withCorpCredits(5).withCorpIceOnServer("rd", "simple_barrier_ice");
      },
      ["fixture:corp_rnd_pressure_defend"],
      "onr_origin_corp_ai_snapshot_v1",
    ),
    corpScenario(
      "corp_real_no_punish_without_tag",
      "real-corp-no-punish-without-tag",
      (fixture) => {
        fixture.withCorpCredits(6);
      },
      ["fixture:corp_no_punish_without_tag"],
      "proteus_corp_region_fast_score_snapshot_v2026_05_25",
    ),
    corpScenario(
      "corp_real_punish_candidate_tagged_runner_shadow_only",
      "real-corp-punish-tagged-runner-shadow",
      (fixture) => {
        fixture.withRunnerTags(2).withCorpCredits(6);
      },
      ["fixture:corp_punish_candidate_tagged_runner_shadow_only"],
      "proteus_corp_region_fast_score_snapshot_v2026_05_25",
    ),
    corpScenario(
      "corp_real_install_remote_when_safe",
      "real-corp-install-remote-when-safe",
      (fixture) => {
        fixture.withCorpCredits(7).ensureServer("remote_2");
      },
      ["fixture:corp_install_remote_when_safe"],
      "demo_corp_008_snapshot_v0_8",
    ),
    corpScenario(
      "corp_real_asset_economy_install",
      "real-corp-asset-economy-install",
      (fixture) => {
        fixture.withCorpCredits(7).withCorpRemoteRoot(
          "remote_1",
          "simple_economy_asset",
        );
      },
      ["fixture:corp_asset_economy_install"],
      "proteus_corp_region_fast_score_snapshot_v2026_05_25",
    ),
    corpScenario(
      "corp_real_fast_advance_support_shadow_only",
      "real-corp-fast-advance-support-shadow",
      (fixture) => {
        fixture.withCorpCredits(8).withCorpRemoteAgenda("remote_2", 2);
      },
      ["fixture:corp_fast_advance_support_shadow_only"],
      "proteus_corp_region_fast_score_snapshot_v2026_05_25",
    ),
  ];
}

function runnerScenario(
  scenarioId: string,
  seed: string,
  mutate: RealEngineFixtureMutator,
  evidence: readonly string[] = [],
  deckSnapshotId?: string,
): RealEngineDecisionCorpusScenario {
  return RealEngineDecisionCorpusScenarioBuilder.runnerTurn(scenarioId, seed)
    .mutateFixture(mutate)
    .addEvidence(evidence)
    .withDeckDoctrine(deckSnapshotId)
    .build();
}

function corpScenario(
  scenarioId: string,
  seed: string,
  mutate: RealEngineFixtureMutator,
  evidence: readonly string[] = [],
  deckSnapshotId?: string,
): RealEngineDecisionCorpusScenario {
  return RealEngineDecisionCorpusScenarioBuilder.corpMain(scenarioId, seed)
    .mutateFixture(mutate)
    .addEvidence(evidence)
    .withDeckDoctrine(deckSnapshotId)
    .build();
}

function corpRezScenario(
  scenarioId: string,
  seed: string,
  corpCredits: number,
  deckSnapshotId?: string,
): RealEngineDecisionCorpusScenario {
  let state = toRunnerTurn(
    createGameAfterSetup({ seed, agendaPointsToWin: 7 }),
  );
  RealEngineFixtureBuilder.forState(state).withCorpRezWindow(corpCredits);
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "start_run" && action.payload?.serverId === "hq",
  );
  return RealEngineDecisionCorpusScenarioBuilder.fromState(
    scenarioId,
    "corp",
    state,
  )
    .addEvidence([`fixture:corp_rez_window_credits:${corpCredits}`])
    .withDeckDoctrine(deckSnapshotId)
    .build();
}

function runnerDiscardChoiceScenario(
  scenarioId: string,
  seed: string,
  deckSnapshotId?: string,
): RealEngineDecisionCorpusScenario {
  let state = toRunnerTurn(createGameAfterSetup({ seed, agendaPointsToWin: 7 }));
  RealEngineFixtureBuilder.forState(state)
    .withRunnerCredits(5)
    .withRunnerGripSize(5);
  state = apply(state, "runner", (action) => action.type === "draw_card");
  state = apply(state, "runner", (action) => action.type === "end_turn");
  if (
    state.pendingChoice?.source !== "discard_phase" ||
    state.pendingChoice.side !== "runner"
  ) {
    throw new Error("Missing runner discard choice after draw/end-turn fixture");
  }
  return RealEngineDecisionCorpusScenarioBuilder.fromState(
    scenarioId,
    "runner",
    state,
  )
    .addEvidence(["fixture:target_choice_discard_choice"])
    .withDeckDoctrine(deckSnapshotId)
    .build();
}

class RealEngineDecisionCorpusScenarioBuilder {
  private readonly evidence: string[] = [];
  private deckSnapshotId?: string;

  private constructor(
    private readonly scenarioId: string,
    private readonly side: Side,
    private readonly state: GameState,
  ) {}

  static runnerTurn(
    scenarioId: string,
    seed: string,
  ): RealEngineDecisionCorpusScenarioBuilder {
    return new RealEngineDecisionCorpusScenarioBuilder(
      scenarioId,
      "runner",
      toRunnerTurn(createGameAfterSetup({ seed, agendaPointsToWin: 7 })),
    );
  }

  static corpMain(
    scenarioId: string,
    seed: string,
  ): RealEngineDecisionCorpusScenarioBuilder {
    return new RealEngineDecisionCorpusScenarioBuilder(
      scenarioId,
      "corp",
      apply(
        createGameAfterSetup({ seed, agendaPointsToWin: 7 }),
        "corp",
        (action) => action.type === "mandatory_draw",
      ),
    );
  }

  static fromState(
    scenarioId: string,
    side: Side,
    state: GameState,
  ): RealEngineDecisionCorpusScenarioBuilder {
    return new RealEngineDecisionCorpusScenarioBuilder(scenarioId, side, state);
  }

  mutateFixture(mutator: RealEngineFixtureMutator): this {
    mutator(RealEngineFixtureBuilder.forState(this.state));
    return this;
  }

  addEvidence(evidence: readonly string[]): this {
    this.evidence.push(...evidence);
    return this;
  }

  withDeckDoctrine(deckSnapshotId: string | undefined): this {
    if (deckSnapshotId !== undefined) {
      this.deckSnapshotId = deckSnapshotId;
    }
    return this;
  }

  build(): RealEngineDecisionCorpusScenario {
    const input = buildAiDecisionInput(this.state, this.side, {
      decisionId: this.scenarioId,
      profileId: `${this.side}-ai-real-engine-corpus`,
    });
    return {
      scenarioId: this.scenarioId,
      input,
      ...(this.side === "runner"
        ? {
            runner: {
              runTargets: evaluateRunnerRunTargets({ input }),
              economyPosture: buildRunnerEconomyPosture({ input }),
            },
          }
        : {}),
      evidence: [...this.evidence],
      ...(this.deckSnapshotId
        ? { deckDoctrine: deckDoctrineForSnapshot(this.deckSnapshotId) }
        : {}),
      ...leagueExpectationForScenario(this.scenarioId),
    };
  }
}

function leagueExpectationForScenario(
  scenarioId: string,
): Pick<RealEngineDecisionCorpusScenario, "leagueExpectation"> {
  const leagueExpectation =
    LEAGUE_EXPECTATION_BY_SCENARIO_ID[
      scenarioId as keyof typeof LEAGUE_EXPECTATION_BY_SCENARIO_ID
    ];
  return leagueExpectation
    ? {
        leagueExpectation: {
          ...leagueExpectation,
          evidence: [
            `league_expectation_source:corpus_metadata:${scenarioId}`,
            ...(leagueExpectation.evidence ?? []),
          ],
        },
      }
    : {};
}

function expectation(
  expectedTopActionTypes: readonly string[],
  options: Omit<
    RealEngineDecisionCorpusLeagueExpectation,
    "expectedTopActionTypes" | "expectedTopActionIds" | "evidence"
  > = {},
): RealEngineDecisionCorpusLeagueExpectation {
  return {
    expectedTopActionTypes,
    ...options,
  };
}

function deckDoctrineForSnapshot(snapshotId: string) {
  return buildDeckDoctrineV2Diagnostic(snapshotById(snapshotId));
}

function snapshotById(snapshotId: string): AiDeckDoctrineDeckSnapshot {
  const snapshot = snapshotsData08.snapshots.find(
    (candidate) => candidate.deckSnapshotId === snapshotId,
  );
  if (!snapshot) throw new Error(`Missing deck snapshot ${snapshotId}`);
  const publicMetadata = snapshot.publicMetadata
    ? {
        ...snapshot.publicMetadata,
        side: parseSnapshotSide(snapshot.publicMetadata.side, snapshotId),
      }
    : undefined;
  return {
    deckSnapshotId: snapshot.deckSnapshotId,
    side: parseSnapshotSide(snapshot.side, snapshotId),
    ...(snapshot.formatProfileId
      ? { formatProfileId: snapshot.formatProfileId }
      : {}),
    ...(publicMetadata ? { publicMetadata } : {}),
    cards: snapshot.cards.map((card) => ({
      cardId: card.cardId,
      quantity: card.quantity,
    })),
  };
}

function parseSnapshotSide(side: unknown, snapshotId: string): Side {
  if (side === "runner" || side === "corp") return side;
  throw new Error(`Unsupported deck snapshot side ${side} for ${snapshotId}`);
}

function toRunnerTurn(state: GameState): GameState {
  let next = apply(state, "corp", (action) => action.type === "mandatory_draw");
  next = apply(next, "corp", (action) => action.type === "end_turn");
  if (
    next.pendingChoice?.source === "discard_phase" &&
    next.pendingChoice.side === "corp"
  ) {
    next = applyChoice(next, "corp", [
      String(next.pendingChoice.options[0]?.id),
    ]);
  }
  return next;
}

function apply(
  state: GameState,
  side: Side,
  predicate: (action: LegalAction) => boolean,
): GameState {
  const legalActions = getLegalActions(state, side);
  const selected = legalActions.find(predicate);
  if (!selected) {
    throw new Error(
      `Missing legal action. Legal: ${legalActions
        .map((action) => `${action.type}:${action.label}`)
        .join(", ")}`,
    );
  }
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: selected.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `${side}-${state.stateVersion}-${selected.actionId}`,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function applyChoice(
  state: GameState,
  side: Side,
  selectedOptionIds: string[],
): GameState {
  const legalActions = getLegalActions(state, side);
  const selected = legalActions.find(
    (action) => action.type === "resolve_choice",
  );
  if (!selected) throw new Error("Missing resolve_choice action");
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: selected.actionId,
    clientKnownStateVersion: state.stateVersion,
    selectedChoices: {
      choiceId: state.pendingChoice?.choiceId,
      selectedOptionIds,
    },
    idempotencyKey: `${side}-${state.stateVersion}-${selected.actionId}-${selectedOptionIds.join(".")}`,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}
