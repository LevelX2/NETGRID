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
  it("projects Blink Pressure Rig strategy signals into a generic Runner intent profile", () => {
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
        deckStrategyProfile: "ai_internal_strategy_profile",
        deckCapabilities: "ai_internal",
        plannerEffect: "runtime_projection",
      },
    });
    expect(intent.evidence).toEqual(
      expect.arrayContaining([
        "deck_strategy_planner_effect:strategic_intent_input",
      ]),
    );
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

  it.each([
    {
      name: "real R&D Interface Dig holdout",
      snapshot: benchmarkSnapshotById(
        "local_realistic_runner_rnd_interface_dig_snapshot_v1",
      ),
      executionStyle: "runner.run_event_tempo",
      setupEngine: [
        "runner.search_breaker_setup",
        "runner.rig_first",
        "runner.economy_setup_before_pressure",
        "runner.draw_or_search_setup",
      ],
      pressureVectors: [
        "runner.central_probe_pressure",
        "runner.conditional_remote_contest",
      ],
      riskProfile: ["runner.risky_universal_breaker_pressure"],
      rejectedIntents: [
        "runner.bad_publicity_pressure",
        "runner.dedicated_hq_multiaccess",
        "runner.hq_depletion",
      ],
      notRejected: ["runner.dedicated_rnd_multiaccess"],
      evidenceNeedles: [
        "strategy_score:runner.rnd_pressure",
        "runtime=productive",
        "setup_engine:",
        "pressure_vectors:",
      ],
    },
    {
      name: "synthetic HQ pressure deck",
      snapshot: syntheticSnapshot(
        "synthetic_runner_hq_pressure_fixture",
        [
          ["onr_v1_024_expert-schedule-analyzer", 2],
          ["onr_v1_085_executive-wiretaps", 2],
          ["onr_v1_129_hq-interface", 2],
          ["onr_v1_016_cyfermaster", 1],
          ["onr_v1_021_dwarf", 1],
          ["onr_v1_066_snowball", 1],
          ["onr_v1_079_bodyweight-synthetic-blood", 3],
          ["onr_v1_097_livewires-contacts", 3],
          ["onr_v1_154_broker", 2],
        ],
      ),
      executionStyle: "runner.run_event_tempo",
      setupEngine: [
        "runner.rig_first",
        "runner.economy_setup_before_pressure",
      ],
      pressureVectors: ["runner.central_probe_pressure"],
      riskProfile: [],
      rejectedIntents: [
        "runner.bad_publicity_pressure",
        "runner.dedicated_rnd_multiaccess",
      ],
      notRejected: [
        "runner.dedicated_hq_multiaccess",
        "runner.hq_depletion",
      ],
      evidenceNeedles: [
        "strategy_score:runner.hq_pressure",
        "runtime=productive",
        "setup_engine:",
        "pressure_vectors:",
      ],
    },
    {
      name: "synthetic economy remote-contest deck",
      snapshot: syntheticSnapshot(
        "synthetic_runner_economy_remote_contest_fixture",
        [
          ["onr_v1_156_corporate-ally", 2],
          ["onr_v1_173_restrictive-net-zoning", 2],
          ["onr_v1_016_cyfermaster", 1],
          ["onr_v1_021_dwarf", 1],
          ["onr_v1_066_snowball", 1],
          ["onr_v1_079_bodyweight-synthetic-blood", 3],
          ["onr_v1_097_livewires-contacts", 3],
          ["onr_v1_154_broker", 3],
          ["onr_v1_168_loan-from-chiba", 3],
          ["onr_v1_184_top-runners-conference", 2],
        ],
      ),
      executionStyle: "runner.run_event_tempo",
      setupEngine: [
        "runner.rig_first",
        "runner.economy_setup_before_pressure",
      ],
      pressureVectors: [
        "runner.central_probe_pressure",
        "runner.conditional_remote_contest",
      ],
      riskProfile: [],
      rejectedIntents: [
        "runner.bad_publicity_pressure",
        "runner.dedicated_hq_multiaccess",
        "runner.dedicated_rnd_multiaccess",
        "runner.hq_depletion",
      ],
      notRejected: [],
      evidenceNeedles: [
        "strategy_score:runner.rnd_pressure",
        "runtime=productive",
        "setup_engine:",
        "pressure_vectors:",
      ],
    },
  ])(
    "projects $name with redacted strategy evidence",
    ({
      snapshot,
      executionStyle,
      setupEngine,
      pressureVectors,
      riskProfile,
      rejectedIntents,
      notRejected,
      evidenceNeedles,
    }) => {
      const intent = runnerStrategicIntentForSnapshot(snapshot);

      expect(intent.primaryWinIntent).toBe("runner.steal_agendas_default");
      expect(intent.executionStyle).toBe(executionStyle);
      expect(intent.setupEngine).toEqual(expect.arrayContaining(setupEngine));
      expect(intent.pressureVectors).toEqual(
        expect.arrayContaining(pressureVectors),
      );
      for (const vector of [
        "runner.central_probe_pressure",
        "runner.conditional_remote_contest",
      ] as const) {
        if (!pressureVectors.includes(vector)) {
          expect(intent.pressureVectors).not.toContain(vector);
        }
      }
      expect(intent.riskProfile).toEqual(expect.arrayContaining(riskProfile));
      expect(intent.rejectedIntents).toEqual(
        expect.arrayContaining(rejectedIntents),
      );
      for (const rejectedIntent of notRejected) {
        expect(intent.rejectedIntents).not.toContain(rejectedIntent);
      }
      const evidence = JSON.stringify(intent.evidence);
      for (const needle of evidenceNeedles) {
        expect(evidence).toContain(needle);
      }
      expect(evidence).not.toMatch(
        /onr_v1_|R&D Interface|HQ Interface|Corporate Ally|deckHash|privatePayload|cardInstances|fullGameState|snapshot_id/i,
      );
    },
  );

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

function runnerStrategicIntentForSnapshot(
  snapshot: AiDeckDoctrineDeckSnapshot,
) {
  return buildRunnerStrategicIntentProfile({
    strategyProfile: buildDeckStrategyProfile(snapshot),
    deckCapabilities: buildDeckCapabilityProfile({
      side: "runner",
      deckSnapshot: snapshot,
      legalActions: [],
    }),
  });
}

function syntheticSnapshot(
  deckSnapshotId: string,
  cards: Array<[cardId: string, quantity: number]>,
): AiDeckDoctrineDeckSnapshot {
  return {
    deckSnapshotId,
    side: "runner",
    cards: cards.map(([cardId, quantity]) => ({ cardId, quantity })),
  };
}

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
