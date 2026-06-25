import localRealisticBenchmarkDeckSnapshotsData from "../../../../data/ai/ai-local-realistic-benchmark-deck-snapshots-2026-05-23.json";
import localRealisticBenchmarkDecksData from "../../../../data/ai/ai-local-realistic-benchmark-decks-2026-05-23.json";
import realSceneBenchmarkDeckSnapshotsData from "../../../../data/ai/ai-real-scene-benchmark-deck-snapshots-2026-05-24.json";
import realSceneBenchmarkDecksData from "../../../../data/ai/ai-real-scene-benchmark-decks-2026-05-24.json";
import type {
  FrozenLocalBenchmarkDeckSnapshot,
  LocalRealisticBenchmarkDeckManifest,
  RealSceneBenchmarkDeckManifest,
} from "./benchmark-deck-types";

export const LOCAL_REALISTIC_FROZEN_DECK_SNAPSHOTS = (
  localRealisticBenchmarkDeckSnapshotsData as {
    snapshots: FrozenLocalBenchmarkDeckSnapshot[];
  }
).snapshots;

export const REAL_SCENE_FROZEN_DECK_SNAPSHOTS = (
  realSceneBenchmarkDeckSnapshotsData as {
    snapshots: FrozenLocalBenchmarkDeckSnapshot[];
  }
).snapshots;

export const LOCAL_REALISTIC_BENCHMARK_DECKS =
  localRealisticBenchmarkDecksData as LocalRealisticBenchmarkDeckManifest;

export const REAL_SCENE_BENCHMARK_DECKS =
  realSceneBenchmarkDecksData as RealSceneBenchmarkDeckManifest;
