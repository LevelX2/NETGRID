import type {
  AiBenchmarkDeckSlotDefinition,
  AiBenchmarkRunnerArchetype,
} from "./benchmark-deck-types";
import { benchmarkDeckManifestEntry } from "./benchmark-deck-manifest-entry";
import {
  benchmarkCorpArchetypeFromRole,
  missingCorpStrategyPanelSlots,
} from "./benchmark-deck-strategy-panel";
import {
  LOCAL_REALISTIC_BENCHMARK_DECKS,
  REAL_SCENE_BENCHMARK_DECKS,
} from "./benchmark-local-deck-data";

const LOCAL_REALISTIC_BENCHMARK_DECK_SLOTS: AiBenchmarkDeckSlotDefinition[] =
  LOCAL_REALISTIC_BENCHMARK_DECKS.slots.map((slot) => {
    const runner = benchmarkDeckManifestEntry(
      LOCAL_REALISTIC_BENCHMARK_DECKS.decks,
      slot.runnerLocalDeckId,
    );
    const corp = benchmarkDeckManifestEntry(
      LOCAL_REALISTIC_BENCHMARK_DECKS.decks,
      slot.corpLocalDeckId,
    );
    return {
      slotId: slot.slotId,
      label: slot.label,
      slotType: slot.slotType,
      status: slot.status,
      runner: runner
        ? { kind: "frozen_local_snapshot", snapshotId: runner.snapshotId }
        : {
            kind: "pending_real_scene",
            label: `${slot.runnerLocalDeckId}:missing_manifest_entry`,
          },
      corp: corp
        ? { kind: "frozen_local_snapshot", snapshotId: corp.snapshotId }
        : {
            kind: "pending_real_scene",
            label: `${slot.corpLocalDeckId}:missing_manifest_entry`,
          },
      runnerArchetype: runnerArchetypeFromRole(runner?.role),
      corpArchetype: benchmarkCorpArchetypeFromRole(corp?.role),
      tuningUse: slot.tuningUse,
      ...(!runner || !corp
        ? {
            pendingReason:
              "Local realistic benchmark manifest references a missing deck entry.",
          }
        : {}),
    };
  });

const REAL_SCENE_BENCHMARK_DECK_SLOTS: AiBenchmarkDeckSlotDefinition[] =
  REAL_SCENE_BENCHMARK_DECKS.slots.map((slot) => {
    const runner = benchmarkDeckManifestEntry(
      REAL_SCENE_BENCHMARK_DECKS.decks,
      slot.runnerLocalDeckId,
    );
    const corp = benchmarkDeckManifestEntry(
      REAL_SCENE_BENCHMARK_DECKS.decks,
      slot.corpLocalDeckId,
    );
    return {
      slotId: slot.slotId,
      label: slot.label,
      slotType: slot.slotType,
      status: runner && corp ? slot.status : "pending",
      runner: runner
        ? { kind: "frozen_local_snapshot", snapshotId: runner.snapshotId }
        : {
            kind: "pending_real_scene",
            label: `${slot.runnerLocalDeckId}:missing_manifest_entry`,
          },
      corp: corp
        ? { kind: "frozen_local_snapshot", snapshotId: corp.snapshotId }
        : {
            kind: "pending_real_scene",
            label: `${slot.corpLocalDeckId}:missing_manifest_entry`,
          },
      runnerArchetype: runnerArchetypeFromRole(runner?.role),
      corpArchetype: benchmarkCorpArchetypeFromRole(corp?.role),
      tuningUse: slot.tuningUse,
      ...(!runner || !corp
        ? {
            pendingReason:
              "Real-scene benchmark manifest references a missing deck entry.",
          }
        : {}),
    };
  });

const STRATEGY_PANEL_BENCHMARK_DECK_SLOTS: AiBenchmarkDeckSlotDefinition[] = [
  {
    slotId: "strategy_panel_fast_advance_chrome_rush",
    label: "Strategy Panel: Fast Advance",
    slotType: "local_realistic_holdout",
    status: "runnable",
    runner: {
      kind: "frozen_local_snapshot",
      snapshotId: "local_realistic_runner_blink_pressure_rig_snapshot_v1",
    },
    corp: {
      kind: "frozen_local_snapshot",
      snapshotId: "local_realistic_corp_chrome_rush_bureau_snapshot_v1",
    },
    runnerArchetype: "rig_economy_pressure",
    corpArchetype: "fast_advance",
    tuningUse: "holdout_only",
  },
  {
    slotId: "strategy_panel_net_damage_black_ice",
    label: "Strategy Panel: Net Damage",
    slotType: "local_realistic_holdout",
    status: "runnable",
    runner: {
      kind: "frozen_local_snapshot",
      snapshotId: "local_realistic_runner_rnd_interface_dig_snapshot_v1",
    },
    corp: {
      kind: "frozen_local_snapshot",
      snapshotId: "local_realistic_corp_black_ice_ambush_lab_snapshot_v1",
    },
    runnerArchetype: "central_multiaccess",
    corpArchetype: "net_damage",
    tuningUse: "holdout_only",
  },
  {
    slotId: "strategy_panel_hybrid_score_punish_cheap_bag",
    label: "Strategy Panel: Hybrid Score Punish",
    slotType: "local_realistic_holdout",
    status: "runnable",
    runner: {
      kind: "frozen_local_snapshot",
      snapshotId: "local_realistic_runner_blink_pressure_rig_snapshot_v1",
    },
    corp: {
      kind: "frozen_local_snapshot",
      snapshotId: "local_realistic_corp_cheap_bag_tricks_snapshot_v1",
    },
    runnerArchetype: "rig_economy_pressure",
    corpArchetype: "hybrid_score_punish",
    tuningUse: "holdout_only",
  },
];

const CORE_MATCH_PROGRESSION_BENCHMARK_DECK_SLOTS: AiBenchmarkDeckSlotDefinition[] =
  [
    {
      slotId: "safety_smoke_demo_008",
      label: "Safety-Smoke demo_008",
      slotType: "smoke",
      status: "runnable",
      runner: { kind: "runtime_deck_id", deckId: "demo_runner_008" },
      corp: { kind: "runtime_deck_id", deckId: "demo_corp_008" },
      runnerArchetype: "starter",
      corpArchetype: "starter_scoreline",
      tuningUse: "safety_regression",
    },
    {
      slotId: "progression_tuning_origin_rig_vs_tax",
      label: "Progression-Tuning A",
      slotType: "snapshot_tuning",
      status: "runnable",
      runner: {
        kind: "snapshot",
        snapshotId: "onr_origin_runner_ai_snapshot_v1",
      },
      corp: { kind: "snapshot", snapshotId: "onr_origin_corp_ai_snapshot_v1" },
      runnerArchetype: "rig_economy_pressure",
      corpArchetype: "remote_scoring",
      tuningUse: "progression_tuning",
    },
    {
      slotId: "progression_tuning_origin_pressure_vs_tax",
      label: "Progression-Tuning B",
      slotType: "snapshot_tuning",
      status: "runnable",
      runner: {
        kind: "snapshot",
        snapshotId: "onr_origin_runner_ai_event_pressure_snapshot_v1",
      },
      corp: { kind: "snapshot", snapshotId: "onr_origin_corp_ai_snapshot_v1" },
      runnerArchetype: "event_pressure",
      corpArchetype: "remote_scoring",
      tuningUse: "progression_tuning",
    },
    {
      slotId: "snapshot_holdout_origin_pressure_vs_tag_ops",
      label: "Snapshot-Holdout",
      slotType: "snapshot_holdout",
      status: "runnable",
      runner: {
        kind: "snapshot",
        snapshotId: "onr_origin_runner_ai_event_pressure_snapshot_v1",
      },
      corp: {
        kind: "snapshot",
        snapshotId: "onr_origin_corp_ai_tag_ops_snapshot_v1",
      },
      runnerArchetype: "event_pressure",
      corpArchetype: "tag_punish",
      tuningUse: "holdout_only",
    },
    ...LOCAL_REALISTIC_BENCHMARK_DECK_SLOTS,
    ...STRATEGY_PANEL_BENCHMARK_DECK_SLOTS,
    ...REAL_SCENE_BENCHMARK_DECK_SLOTS,
  ];

export const MATCH_PROGRESSION_BENCHMARK_DECK_SLOTS: AiBenchmarkDeckSlotDefinition[] =
  [
    ...CORE_MATCH_PROGRESSION_BENCHMARK_DECK_SLOTS,
    ...missingCorpStrategyPanelSlots(CORE_MATCH_PROGRESSION_BENCHMARK_DECK_SLOTS),
  ];

function runnerArchetypeFromRole(
  role: string | undefined,
): AiBenchmarkRunnerArchetype {
  if (!role) return "unknown";
  if (role.includes("rnd") || role.includes("multiaccess")) {
    return "central_multiaccess";
  }
  if (role.includes("event")) return "event_pressure";
  if (
    role.includes("rig") ||
    role.includes("economy") ||
    role.includes("pressure")
  ) {
    return "rig_economy_pressure";
  }
  return "unknown";
}
