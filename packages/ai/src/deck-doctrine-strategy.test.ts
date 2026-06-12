import { describe, expect, it } from "vitest";
import snapshotsData08 from "../../../data/decks/deck-snapshots-0.8.json";
import type { AiDeckDoctrineDeckSnapshot } from "./deck-doctrine";
import {
  buildDeckDoctrineV2Diagnostic,
  buildDeckStrategyProfile,
} from "./deck-doctrine-strategy";

const snapshots = snapshotsData08.snapshots as Array<{
  deckSnapshotId: string;
  side: "runner" | "corp";
  formatProfileId?: string;
  publicMetadata?: AiDeckDoctrineDeckSnapshot["publicMetadata"];
  cards: Array<{ cardId: string; quantity: number }>;
}>;
const realDoctrineSnapshotIds = [
  "demo_runner_008_snapshot_v0_8",
  "demo_corp_008_snapshot_v0_8",
  "onr_origin_runner_ai_snapshot_v1",
  "onr_origin_corp_ai_snapshot_v1",
  "proteus_runner_hq_virus_derez_snapshot_v2026_05_25",
  "proteus_corp_region_fast_score_snapshot_v2026_05_25",
] as const;

describe("DeckDoctrine strategy aggregation diagnostics", () => {
  it("detects Runner R&D and interface pressure from normalized multiaccess evidence", () => {
    const profile = buildDeckStrategyProfile(
      snapshotById("onr_origin_runner_ai_snapshot_v1"),
    );

    expect(
      profile.strategyScores["runner.rnd_pressure"]?.anchorEvidence,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cardId: "onr_v1_081_custodial-position",
          source: "derivedStrategyAnchor",
        }),
      ]),
    );
    expect(
      profile.strategyScores["runner.interface_closeout"]?.anchorEvidence.some(
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

    expect(
      profile.strategyScores["runner.search.breaker"]?.anchorScore,
    ).toBeGreaterThan(0);
    expect(
      profile.strategyScores["runner.search.breaker"]?.supportScore,
    ).toBeGreaterThan(70);
    expect(
      profile.strategyScores["runner.rig_first"]?.supportScore,
    ).toBeGreaterThan(60);
    expect(profile.strategyScores["runner.rnd_pressure"]?.anchorScore).toBe(0);
  });

  it("keeps normal Runner economy as support instead of R&D-pressure anchor evidence", () => {
    const profile = buildDeckStrategyProfile({
      deckSnapshotId: "ai006-runner-economy-only-diagnostic",
      side: "runner",
      cards: [{ cardId: "onr_v1_108_score", quantity: 3 }],
    });

    expect(profile.functionSignalCounts["economy.generic"]).toBe(3);
    expect(
      profile.strategyScores["runner.economy_first"]?.supportScore,
    ).toBeGreaterThan(0);
    expect(profile.strategyScores["runner.rnd_pressure"]?.anchorScore).toBe(0);
    expect(
      profile.strategyScores["runner.rnd_pressure"]?.anchorEvidence,
    ).toEqual([]);
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

  it("does not treat Dropp as Runner access coverage or a strategy anchor", () => {
    const profile = buildDeckStrategyProfile({
      deckSnapshotId: "ai006-runner-dropp-emergency-only-diagnostic",
      side: "runner",
      cards: [{ cardId: "onr_v1_019_dropp", quantity: 3 }],
    });

    expect(profile.functionSignalCounts["breaker.ends_run_after_use"]).toBe(3);
    expect(profile.functionSignalCounts["breaker.break_any_subroutine"]).toBe(
      3,
    );
    expect(profile.functionSignalCounts["breaker.universal"] ?? 0).toBe(0);
    expect(profile.runnerProfile?.coverageProfile.universal.count).toBe(0);
    expect(profile.runnerProfile?.coverageProfile.wall.count).toBe(0);
    expect(profile.strategyScores["runner.rig_first"]?.supportGaps).toEqual(
      expect.arrayContaining([
        "missing_wall_coverage",
        "missing_code_gate_coverage",
        "weak_sentry_coverage",
      ]),
    );
    expect(profile.primaryStrategies).toEqual([]);
  });

  it("pairs Corp tag sources and punish payoff for tag-trace-punish diagnostics", () => {
    const profile = buildDeckStrategyProfile(
      snapshotById("onr_origin_corp_ai_tag_ops_snapshot_v1"),
    );

    expect(
      profile.strategyScores["corp.tag_trace_punish"]?.anchorScore,
    ).toBeGreaterThan(0);
    expect(
      profile.strategyScores["corp.tag_trace_punish"]?.supportScore,
    ).toBeGreaterThan(70);
    expect(profile.corpProfile?.punishProfile.tagSources).toBeGreaterThan(0);
    expect(profile.corpProfile?.punishProfile.tagPayoff).toBeGreaterThan(0);
  });

  it("detects Corp remote-scoring evidence from remote protection and safe lineSupport anchors", () => {
    const profile = buildDeckStrategyProfile({
      deckSnapshotId: "ai030-corp-remote-upgrade-diagnostic",
      side: "corp",
      cards: [
        {
          cardId: "onr_v1_355_crystal-palace-station-grid",
          quantity: 1,
        },
      ],
    });

    expect(
      profile.strategyScores["corp.remote_scoring"]?.anchorEvidence,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cardId: "onr_v1_355_crystal-palace-station-grid",
          source: "lineSupport",
        }),
      ]),
    );
    expect(
      profile.corpProfile?.scoreProfile.remoteScoringProtection,
    ).toBeGreaterThan(0);
  });

  it("reports Corp economy/rez-reserve support from structured function signals", () => {
    const profile = buildDeckStrategyProfile(
      snapshotById("onr_origin_corp_ai_snapshot_v1"),
    );

    expect(
      profile.strategyScores["corp.economy_rez_reserve"]?.supportScore,
    ).toBeGreaterThan(50);
    expect(
      profile.strategyScores["corp.economy_rez_reserve"]?.supportEvidence,
    ).toEqual(
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
    expect(
      profile.strategyScores["corp.ice_tax_glacier"]?.supportScore,
    ).toBeGreaterThan(0);
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
    expect(
      profile.strategyScores["runner.rnd_pressure"]?.anchorEvidence,
    ).toEqual([]);
  });

  it("keeps the diagnostic output side-safe and deterministic", () => {
    const snapshot = snapshotById("onr_origin_runner_ai_snapshot_v1");
    const profile = buildDeckStrategyProfile(snapshot);

    expect(profile).toEqual(buildDeckStrategyProfile(snapshot));
    expect(JSON.stringify(profile)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|tokenHash|fullGameState|stateHash|deckHash|legalActions/i,
    );
  });

  it("builds a report-only DeckDoctrine v2 diagnostic with role status", () => {
    const diagnostic = buildDeckDoctrineV2Diagnostic(
      snapshotById("proteus_corp_region_fast_score_snapshot_v2026_05_25"),
    );
    const serialized = JSON.stringify(diagnostic);

    expect(diagnostic).toMatchObject({
      schemaVersion: "deck-doctrine-v2-diagnostic-v1",
      scope: "diagnostic_only",
      productiveUseAllowed: false,
      side: "corp",
      status: "partial",
      neutralDoctrine: false,
      source: {
        strategyProfile: "buildDeckStrategyProfile",
        mode: "report_only",
        plannerEffect: "none",
      },
      noEffectFlags: {
        actionSelection: false,
        plannerWeights: false,
        scoring: false,
        legalActionGeneration: false,
        engineMutation: false,
        hiddenInfoProjection: false,
      },
    });
    expect(diagnostic.rolesStatus).toMatchObject({
      status: "partial",
      cardRows: expect.any(Number),
      strategyAnchorCount: expect.any(Number),
    });
    expect(diagnostic.rolesStatus.strategyAnchorCount).toBeGreaterThan(0);
    expect(diagnostic.strategyDiagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          strategyId: "corp.remote_scoring",
          status: "complete",
        }),
      ]),
    );
    expect(serialized).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|tokenHash|fullGameState|stateHash|legalActions/i,
    );
  });

  it("keeps DeckDoctrine v2 diagnostics grounded in real deck snapshots", () => {
    const diagnostics = realDoctrineSnapshotIds.map((snapshotId) =>
      buildDeckDoctrineV2Diagnostic(snapshotById(snapshotId)),
    );

    expect(diagnostics).toHaveLength(6);
    expect(new Set(diagnostics.map((entry) => entry.side))).toEqual(
      new Set(["corp", "runner"]),
    );
    expect(
      diagnostics.every((entry) => entry.status !== "unknown_snapshot"),
    ).toBe(true);
    expect(diagnostics.some((entry) => entry.status === "partial")).toBe(true);
    expect(
      diagnostics.every(
        (entry) =>
          entry.scope === "diagnostic_only" &&
          entry.productiveUseAllowed === false,
      ),
    ).toBe(true);

    for (const diagnostic of diagnostics) {
      expect(diagnostic.rolesStatus.cardRows).toBeGreaterThan(0);
      expect(diagnostic.strategyDiagnostics.length).toBeGreaterThan(0);
      if (diagnostic.status === "anchorless") {
        expect(diagnostic.neutralDoctrine).toBe(true);
        expect(diagnostic.rolesStatus.strategyAnchorCount).toBe(0);
      } else {
        expect(diagnostic.neutralDoctrine).toBe(false);
        expect(diagnostic.rolesStatus.strategyAnchorCount).toBeGreaterThan(0);
      }
      expect(JSON.stringify(diagnostic)).not.toMatch(
        /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|tokenHash|fullGameState|stateHash|deckHash|legalActions/i,
      );
    }
  });

  it("keeps NeutralDoctrine anchorless when a deck has no strategy anchors", () => {
    const diagnostic = buildDeckDoctrineV2Diagnostic({
      deckSnapshotId: "ai006-runner-legacy-only-diagnostic",
      side: "runner",
      cards: [{ cardId: "simple_run_event", quantity: 3 }],
    });

    expect(diagnostic.status).toBe("anchorless");
    expect(diagnostic.neutralDoctrine).toBe(true);
    expect(diagnostic.rolesStatus.status).toBe("anchorless");
    expect(
      diagnostic.strategyDiagnostics.every(
        (entry) => entry.status === "anchorless",
      ),
    ).toBe(true);
    expect(diagnostic.warnings).toContain(
      "NeutralDoctrine: no strategy anchor",
    );
  });

  it("reports unknown_snapshot without inventing doctrine evidence", () => {
    const diagnostic = buildDeckDoctrineV2Diagnostic();

    expect(diagnostic).toMatchObject({
      deckSnapshotId: "unknown_snapshot",
      side: "unknown",
      status: "unknown_snapshot",
      neutralDoctrine: true,
      strategyDiagnostics: [],
      cardRoles: [],
      warnings: ["unknown_snapshot"],
    });
    expect(diagnostic.rolesStatus.status).toBe("unknown_snapshot");
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
