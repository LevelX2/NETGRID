import type { AiBenchmarkDeckSlotDefinition } from "./benchmark-deck-types";
import { benchmarkDeckManifestEntry } from "./benchmark-deck-manifest-entry";
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
      tuningUse: slot.tuningUse,
      ...(!runner || !corp
        ? {
            pendingReason:
              "Real-scene benchmark manifest references a missing deck entry.",
          }
        : {}),
    };
  });

export const MATCH_PROGRESSION_BENCHMARK_DECK_SLOTS: AiBenchmarkDeckSlotDefinition[] =
  [
    {
      slotId: "safety_smoke_demo_008",
      label: "Safety-Smoke demo_008",
      slotType: "smoke",
      status: "runnable",
      runner: { kind: "runtime_deck_id", deckId: "demo_runner_008" },
      corp: { kind: "runtime_deck_id", deckId: "demo_corp_008" },
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
      tuningUse: "holdout_only",
    },
    ...LOCAL_REALISTIC_BENCHMARK_DECK_SLOTS,
    ...REAL_SCENE_BENCHMARK_DECK_SLOTS,
  ];
