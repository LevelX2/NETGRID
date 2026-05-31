import { describe, expect, it } from "vitest";
import snapshotsData08 from "../../../data/decks/deck-snapshots-0.8.json";
import type { AiDeckDoctrineDeckSnapshot } from "./deck-doctrine";
import { buildDeckStrategyProfile } from "./deck-doctrine-strategy";

const snapshots = snapshotsData08.snapshots as Array<{
  deckSnapshotId: string;
  side: "runner" | "corp";
  formatProfileId?: string;
  publicMetadata?: AiDeckDoctrineDeckSnapshot["publicMetadata"];
  cards: Array<{ cardId: string; quantity: number }>;
}>;

describe("DeckDoctrine strategy aggregation diagnostics", () => {
  it("detects Runner R&D and interface pressure from normalized multiaccess evidence", () => {
    const profile = buildDeckStrategyProfile(
      snapshotById("onr_origin_runner_ai_snapshot_v1"),
    );

    expect(profile.strategyScores["runner.rnd_pressure"]?.anchorEvidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cardId: "onr_v1_081_custodial-position",
          source: "derivedStrategyAnchor",
        }),
      ]),
    );
    expect(
      profile.strategyScores[
        "runner.interface_closeout"
      ]?.anchorEvidence.some(
        (entry) =>
          entry.cardId === "onr_v1_081_custodial-position" ||
          entry.cardId === "onr_v1_085_executive-wiretaps",
      ),
    ).toBe(true);
  });

  it("scores Runner breaker/search support without treating every breaker as a pressure anchor", () => {
    const profile = buildDeckStrategyProfile({
      deckSnapshotId: "ai006-runner-breaker-search-diagnostic",
      side: "runner",
      cards: [
        { cardId: "onr_v1_021_dwarf", quantity: 2 },
        { cardId: "onr_v1_039_krash", quantity: 2 },
        { cardId: "onr_v1_059_self-modifying-code", quantity: 2 },
        { cardId: "onr_v1_066_snowball", quantity: 2 },
        { cardId: "onr_v1_108_score", quantity: 2 },
      ],
    });

    expect(profile.strategyScores["runner.breaker_search"]?.anchorScore).toBeGreaterThan(0);
    expect(profile.strategyScores["runner.breaker_search"]?.supportScore).toBeGreaterThan(70);
    expect(profile.strategyScores["runner.rig_first"]?.supportScore).toBeGreaterThan(60);
    expect(profile.strategyScores["runner.rnd_pressure"]?.anchorScore).toBe(0);
  });

  it("keeps normal Runner economy as support instead of R&D-pressure anchor evidence", () => {
    const profile = buildDeckStrategyProfile({
      deckSnapshotId: "ai006-runner-economy-only-diagnostic",
      side: "runner",
      cards: [{ cardId: "onr_v1_108_score", quantity: 3 }],
    });

    expect(profile.functionSignalCounts["economy.generic"]).toBe(3);
    expect(profile.strategyScores["runner.economy_first"]?.supportScore).toBeGreaterThan(0);
    expect(profile.strategyScores["runner.rnd_pressure"]?.anchorScore).toBe(0);
    expect(profile.strategyScores["runner.rnd_pressure"]?.anchorEvidence).toEqual([]);
  });

  it("reports Runner coverage gaps when a deck has no wall coverage", () => {
    const profile = buildDeckStrategyProfile(
      snapshotById("king_of_the_road_runner_ai_snapshot_v1"),
    );

    expect(profile.runnerProfile?.coverageProfile.wall.count).toBe(0);
    expect(profile.strategyScores["runner.rig_first"]?.supportGaps).toContain(
      "missing_wall_coverage",
    );
  });

  it("pairs Corp tag sources and punish payoff for tag-trace-punish diagnostics", () => {
    const profile = buildDeckStrategyProfile(
      snapshotById("onr_origin_corp_ai_tag_ops_snapshot_v1"),
    );

    expect(profile.strategyScores["corp.tag_trace_punish"]?.anchorScore).toBeGreaterThan(0);
    expect(profile.strategyScores["corp.tag_trace_punish"]?.supportScore).toBeGreaterThan(70);
    expect(profile.corpProfile?.punishProfile.tagSources).toBeGreaterThan(0);
    expect(profile.corpProfile?.punishProfile.tagPayoff).toBeGreaterThan(0);
  });

  it("detects Corp remote-scoring evidence from remote protection and safe lineSupport anchors", () => {
    const profile = buildDeckStrategyProfile(
      snapshotById("onr_origin_corp_ai_snapshot_v1"),
    );

    expect(profile.strategyScores["corp.remote_scoring"]?.anchorEvidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cardId: "onr_v1_317_data-masons",
          source: "lineSupport",
        }),
      ]),
    );
    expect(profile.corpProfile?.scoreProfile.remoteScoringProtection).toBeGreaterThan(0);
  });

  it("reports Corp economy/rez-reserve support from structured function signals", () => {
    const profile = buildDeckStrategyProfile(
      snapshotById("onr_origin_corp_ai_snapshot_v1"),
    );

    expect(profile.strategyScores["corp.economy_rez_reserve"]?.supportScore).toBeGreaterThan(50);
    expect(profile.strategyScores["corp.economy_rez_reserve"]?.supportEvidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cardId: "onr_v1_317_data-masons",
          signal: "economy.rez_discount",
        }),
      ]),
    );
  });

  it("treats normal ICE as ICE support, not automatic Corp remote-scoring anchor evidence", () => {
    const profile = buildDeckStrategyProfile({
      deckSnapshotId: "ai006-corp-normal-ice-diagnostic",
      side: "corp",
      cards: [
        { cardId: "onr_v1_232_crystal-wall", quantity: 2 },
        { cardId: "onr_v1_237_data-wall", quantity: 2 },
        { cardId: "onr_v1_261_quandary", quantity: 2 },
        { cardId: "onr_v1_279_wall-of-static", quantity: 2 },
      ],
    });

    expect(profile.functionSignalCounts["ice.etr"]).toBeGreaterThan(0);
    expect(profile.strategyScores["corp.ice_tax_glacier"]?.supportScore).toBeGreaterThan(0);
    expect(profile.strategyScores["corp.remote_scoring"]?.anchorScore).toBe(0);
  });

  it("counts legacy roles and planRoles without using them alone as StrategyAnchor", () => {
    const profile = buildDeckStrategyProfile({
      deckSnapshotId: "ai006-runner-legacy-only-diagnostic",
      side: "runner",
      cards: [{ cardId: "simple_run_event", quantity: 3 }],
    });

    expect(profile.legacySignalCounts["planRole:pressure_rnd"]).toBe(3);
    expect(profile.strategyScores["runner.rnd_pressure"]?.anchorScore).toBe(0);
    expect(profile.strategyScores["runner.rnd_pressure"]?.anchorEvidence).toEqual([]);
  });

  it("keeps the diagnostic output side-safe and deterministic", () => {
    const snapshot = snapshotById("onr_origin_runner_ai_snapshot_v1");
    const profile = buildDeckStrategyProfile(snapshot);

    expect(profile).toEqual(buildDeckStrategyProfile(snapshot));
    expect(JSON.stringify(profile)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|tokenHash|fullGameState|stateHash|deckHash|legalActions/i,
    );
  });
});

function snapshotById(snapshotId: string): AiDeckDoctrineDeckSnapshot {
  const snapshot = snapshots.find(
    (candidate) => candidate.deckSnapshotId === snapshotId,
  );
  if (!snapshot) throw new Error(`Missing snapshot fixture ${snapshotId}`);
  return {
    deckSnapshotId: snapshot.deckSnapshotId,
    side: snapshot.side,
    ...(snapshot.formatProfileId
      ? { formatProfileId: snapshot.formatProfileId }
      : {}),
    ...(snapshot.publicMetadata
      ? { publicMetadata: snapshot.publicMetadata }
      : {}),
    cards: snapshot.cards.map((card) => ({
      cardId: card.cardId,
      quantity: card.quantity,
    })),
  };
}
