import { describe, expect, it } from "vitest";

import benchmarkSnapshotsData from "../../../data/ai/ai-local-realistic-benchmark-deck-snapshots-2026-05-23.json";
import { buildDeckCapabilityProfile } from "./deck-capabilities";
import type { AiDeckDoctrineDeckSnapshot } from "./deck-doctrine";
import { buildDeckStrategyProfile } from "./deck-doctrine-strategy";
import { buildRunnerStrategicIntentProfile } from "./runner-strategic-intent";

const benchmarkSnapshots = benchmarkSnapshotsData.snapshots as Array<{
  deckSnapshotId: string;
  side: "runner" | "corp";
  cards: Array<{ cardId: string; quantity: number }>;
}>;

describe("Runner StrategicIntentProjection", () => {
  it("projects Blink Pressure Rig diagnostics into a generic Runner intent profile", () => {
    const snapshot = benchmarkSnapshotById(
      "local_realistic_runner_blink_pressure_rig_snapshot_v1",
    );
    const strategyProfile = buildDeckStrategyProfile(snapshot);
    const deckCapabilities = buildDeckCapabilityProfile({
      side: "runner",
      deckSnapshot: snapshot,
      legalActions: [],
    });

    const intent = buildRunnerStrategicIntentProfile({
      strategyProfile,
      deckCapabilities,
    });

    expect(intent).toMatchObject({
      schemaVersion: "runner-strategic-intent-profile-v1",
      side: "runner",
      primaryWinIntent: "runner.steal_agendas_default",
      executionStyle: "runner.run_event_tempo",
      source: {
        deckStrategyProfile: "diagnostic_only",
        deckCapabilities: "ai_internal",
        plannerEffect: "runtime_projection",
      },
    });
    expect(intent.setupEngine).toEqual(
      expect.arrayContaining([
        "runner.search_breaker_setup",
        "runner.rig_first",
        "runner.economy_setup_before_pressure",
      ]),
    );
    expect(intent.pressureVectors).toEqual(
      expect.arrayContaining([
        "runner.central_probe_pressure",
        "runner.conditional_remote_contest",
      ]),
    );
    expect(intent.riskProfile).toContain(
      "runner.risky_universal_breaker_pressure",
    );
    expect(intent.rejectedIntents).toEqual(
      expect.arrayContaining([
        "runner.hq_depletion",
        "runner.bad_publicity_pressure",
        "runner.dedicated_rnd_multiaccess",
        "runner.dedicated_hq_multiaccess",
      ]),
    );
  });

  it("does not turn generic support into dedicated central pressure", () => {
    const strategyProfile = buildDeckStrategyProfile({
      deckSnapshotId: "runner-support-only-strategy-fixture",
      side: "runner",
      cards: [
        { cardId: "onr_v1_059_self-modifying-code", quantity: 2 },
        { cardId: "onr_v1_108_score", quantity: 3 },
        { cardId: "onr_v1_154_broker", quantity: 2 },
      ],
    });
    const deckCapabilities = buildDeckCapabilityProfile({
      side: "runner",
      deckSnapshot: {
        deckSnapshotId: "runner-support-only-capability-fixture",
        side: "runner",
        cards: [
          { cardId: "onr_v1_059_self-modifying-code", quantity: 2 },
          { cardId: "onr_v1_108_score", quantity: 3 },
          { cardId: "onr_v1_154_broker", quantity: 2 },
        ],
      },
      legalActions: [],
    });

    const intent = buildRunnerStrategicIntentProfile({
      strategyProfile,
      deckCapabilities,
    });

    expect(strategyProfile.strategyScores["runner.rnd_pressure"]?.anchorScore).toBe(0);
    expect(strategyProfile.strategyScores["runner.hq_pressure"]?.anchorScore).toBe(0);
    expect(intent.primaryWinIntent).toBe("runner.steal_agendas_default");
    expect(intent.rejectedIntents).toEqual(
      expect.arrayContaining([
        "runner.dedicated_rnd_multiaccess",
        "runner.dedicated_hq_multiaccess",
      ]),
    );
  });

  it("keeps StrategicIntent debug evidence redacted", () => {
    const snapshot = benchmarkSnapshotById(
      "local_realistic_runner_blink_pressure_rig_snapshot_v1",
    );
    const intent = buildRunnerStrategicIntentProfile({
      strategyProfile: buildDeckStrategyProfile(snapshot),
      deckCapabilities: buildDeckCapabilityProfile({
        side: "runner",
        deckSnapshot: snapshot,
        legalActions: [],
      }),
    });

    expect(JSON.stringify(intent.evidence)).not.toMatch(
      /onr_v1_|Blink|deckHash|privatePayload|cardInstances|fullGameState|snapshot_id/i,
    );
  });
});

function benchmarkSnapshotById(snapshotId: string): AiDeckDoctrineDeckSnapshot {
  const snapshot = benchmarkSnapshots.find(
    (candidate) => candidate.deckSnapshotId === snapshotId,
  );
  if (!snapshot) throw new Error(`Missing benchmark snapshot ${snapshotId}`);
  return {
    deckSnapshotId: snapshot.deckSnapshotId,
    side: snapshot.side,
    cards: snapshot.cards.map((card) => ({
      cardId: card.cardId,
      quantity: card.quantity,
    })),
  };
}
