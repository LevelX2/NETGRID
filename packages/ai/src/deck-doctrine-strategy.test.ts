import { describe, expect, it } from "vitest";
import snapshotsData08 from "../../../data/decks/deck-snapshots-0.8.json";
import standardDeckCatalog from "../../../data/decks/standard-deck-catalog-1.0.0.json";
import type { AiDeckStrategyDeckSnapshot } from "./deck-strategy-snapshot";
import {
  buildDeckDoctrineV2Diagnostic,
  buildDeckStrategyProfile,
  compareDeckStrategyRanking,
  DECK_STRATEGY_METADATA_CONSUMER_CONTRACT,
  selectRankedStrategyIdsWithCutoffTies,
  type DeckStrategyScore,
} from "./deck-doctrine-strategy";

const snapshots = snapshotsData08.snapshots as Array<{
  deckSnapshotId: string;
  side: "runner" | "corp";
  formatProfileId?: string;
  publicMetadata?: AiDeckStrategyDeckSnapshot["publicMetadata"];
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
  it("classifies every derived public metadata group by consumer mode", () => {
    expect(
      Object.keys(DECK_STRATEGY_METADATA_CONSUMER_CONTRACT).sort(),
    ).toEqual([
      "corpProfile.economyProfile",
      "corpProfile.iceProfile",
      "corpProfile.punishProfile",
      "corpProfile.remoteProfile",
      "corpProfile.scoreProfile",
      "functionSignalCounts",
      "legacySignalCounts",
      "primaryStrategies",
      "runnerProfile.coverageProfile",
      "runnerProfile.defenseProfile",
      "runnerProfile.economyProfile",
      "runnerProfile.pressureProfile",
      "runnerProfile.setupProfile",
      "secondaryStrategies",
      "strategyScores",
      "warnings",
    ]);
    expect(
      DECK_STRATEGY_METADATA_CONSUMER_CONTRACT.legacySignalCounts,
    ).toMatchObject({ mode: "diagnostic_only" });
    expect(
      DECK_STRATEGY_METADATA_CONSUMER_CONTRACT["corpProfile.economyProfile"],
    ).toMatchObject({ mode: "productive_and_diagnostic" });
    expect(
      Object.values(DECK_STRATEGY_METADATA_CONSUMER_CONTRACT).every(
        (entry) => entry.consumers.length > 0,
      ),
    ).toBe(true);
  });

  it("dampens duplicate metadata and additional copies of the same anchor card", () => {
    const oneCopy = buildDeckStrategyProfile({
      deckSnapshotId: "one-copy-recycle-anchor",
      side: "corp",
      cards: [{ cardId: "onr_v1_188_ai-chief-financial-officer", quantity: 1 }],
    }).strategyScores["corp.deck_recycle_engine"];
    const threeCopies = buildDeckStrategyProfile({
      deckSnapshotId: "three-copy-recycle-anchor",
      side: "corp",
      cards: [{ cardId: "onr_v1_188_ai-chief-financial-officer", quantity: 3 }],
    }).strategyScores["corp.deck_recycle_engine"];

    expect(oneCopy?.anchorEvidence.length).toBeGreaterThan(1);
    expect(oneCopy?.anchorScore).toBeLessThan(70);
    expect(threeCopies?.anchorScore).toBeLessThan(100);
    expect(threeCopies?.anchorScore ?? 0).toBeLessThan(
      (oneCopy?.anchorScore ?? 0) * 3,
    );
  });

  it("uses evidence diversity before lexical strategy ids for equal scores", () => {
    const concentrated = rankingScore(["one"], ["support-one"]);
    const diverse = rankingScore(
      ["one", "two"],
      ["support-one", "support-two"],
    );
    const ranked = [
      ["aaa.concentrated", concentrated] as const,
      ["zzz.diverse", diverse] as const,
    ].sort(compareDeckStrategyRanking);

    expect(ranked.map(([strategyId]) => strategyId)).toEqual([
      "zzz.diverse",
      "aaa.concentrated",
    ]);
  });

  it("keeps every exactly tied strategy at the nominal primary cutoff", () => {
    const tiedScore = rankingScore(["anchor"], ["support"]);
    const ranked = [
      ["corp.first", tiedScore],
      ["corp.second", tiedScore],
      ["corp.third", tiedScore],
      ["corp.fourth", tiedScore],
    ] as const;

    expect(selectRankedStrategyIdsWithCutoffTies(ranked, 3)).toEqual([
      "corp.first",
      "corp.second",
      "corp.third",
      "corp.fourth",
    ]);
  });

  it("reduces full anchor saturation across the active standard deck catalog", () => {
    const profiles = standardDeckCatalog.decks.map((deck) =>
      buildDeckStrategyProfile(standardDeckByName(deck.name)),
    );
    const profilesWithSaturatedAnchors = profiles.filter((profile) =>
      profile.primaryStrategies.some(
        (strategyId) => profile.strategyScores[strategyId]?.anchorScore === 100,
      ),
    );

    expect(standardDeckCatalog.decks.length).toBeGreaterThanOrEqual(42);
    expect(profilesWithSaturatedAnchors.length).toBeLessThan(17);
  });

  it.each([
    ["Chrome Rush Bureau", "corp.rush_score"],
    ["Proteus Korp - Variable ICE Gauntlet", "corp.action_tempo"],
    ["Classic Corp - Remote Lab Deflection", "corp.draw_engine"],
    ["Siren Fortress", "corp.deck_recycle_engine"],
  ] as const)(
    "keeps the visible deck focus of %s in its selected strategy portfolio",
    (deckName, expectedStrategyId) => {
      const profile = buildDeckStrategyProfile(standardDeckByName(deckName));

      expect([
        ...profile.primaryStrategies,
        ...profile.secondaryStrategies,
      ]).toContain(expectedStrategyId);
    },
  );

  it("keeps King of the Road productive through a bounded conditional wall bypass", () => {
    const profile = buildDeckStrategyProfile(
      standardDeckByName("King of the Road"),
    );
    const selectedScores = [
      ...profile.primaryStrategies,
      ...profile.secondaryStrategies,
    ].map((strategyId) => profile.strategyScores[strategyId]);

    expect(profile.primaryStrategies.length).toBeGreaterThan(0);
    expect(
      selectedScores.some(
        (score) =>
          score?.runtimeStatus === "productive" &&
          score.supportGaps.includes("conditional_wall_access_path"),
      ),
    ).toBe(true);
    expect(
      selectedScores.some((score) =>
        score?.supportGaps.includes("missing_wall_coverage"),
      ),
    ).toBe(false);
  });

  it("does not use one conditional path to invent Ghost Circuit coverage", () => {
    const profile = buildDeckStrategyProfile(
      standardDeckByName("Ghost Circuit"),
    );
    const breakerDependentScores = Object.values(profile.strategyScores).filter(
      (score) =>
        score.supportGaps.includes("missing_code_gate_coverage") ||
        score.supportGaps.includes("weak_sentry_coverage"),
    );

    expect(breakerDependentScores.length).toBeGreaterThan(0);
    expect(
      breakerDependentScores.every(
        (score) =>
          score.runtimeStatus !== "productive" &&
          !score.supportGaps.some((gap) => gap.startsWith("conditional_")),
      ),
    ).toBe(true);
  });
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
    expect(profile.strategyScores["runner.economy_first"]?.runtimeStatus).toBe(
      "supporting",
    );
    expect(
      profile.strategyScores["runner.economy_first"]?.runtimeBlockers,
    ).toContain("supporting_only:runner.economy_first");
    expect(profile.primaryStrategies).toEqual([]);
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
    expect(profile.strategyScores["runner.rig_first"]?.runtimeStatus).toBe(
      "blocked",
    );
    expect(
      profile.strategyScores["runner.rig_first"]?.runtimeBlockers,
    ).toContain("hard_support_gap:missing_wall_coverage");
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
    expect(profile.strategyScores["corp.tag_trace_punish"]?.runtimeStatus).toBe(
      "productive",
    );
    expect(
      profile.strategyScores["corp.tag_trace_punish"]?.runtimeBlockers,
    ).toEqual([]);
  });

  it("ranks a dense tag-damage line above Fast Advance in a low-agenda Corp deck", () => {
    const profile = buildDeckStrategyProfile({
      deckSnapshotId: "manhunt-low-agenda-kill-line",
      side: "corp",
      cards: [
        { cardId: "onr_v1_196_corporate-war", quantity: 3 },
        { cardId: "onr_v1_223_banpei", quantity: 2 },
        { cardId: "onr_v1_237_data-wall", quantity: 3 },
        { cardId: "onr_v1_244_filter", quantity: 3 },
        { cardId: "onr_v1_252_keeper", quantity: 2 },
        { cardId: "onr_v1_261_quandary", quantity: 3 },
        { cardId: "onr_v1_275_vacuum-link", quantity: 2 },
        { cardId: "onr_v1_279_wall-of-static", quantity: 2 },
        { cardId: "onr_v1_283_audit-of-call-records", quantity: 3 },
        { cardId: "onr_v1_284_chance-observation", quantity: 3 },
        { cardId: "onr_v1_285_closed-accounts", quantity: 3 },
        { cardId: "onr_v1_299_power-grid-overload", quantity: 1 },
        { cardId: "onr_v1_302_scorched-earth", quantity: 3 },
        { cardId: "onr_v1_304_systematic-layoffs", quantity: 3 },
        { cardId: "onr_v1_307_urban-renewal", quantity: 3 },
        { cardId: "onr_v1_309_bbs-whispering-campaign", quantity: 3 },
        { cardId: "onr_v1_313_city-surveillance", quantity: 2 },
        { cardId: "onr_v1_327_i-got-a-rock", quantity: 1 },
      ],
    });

    expect(profile.primaryStrategies[0]).toBe("corp.tag_trace_punish");
    expect(
      profile.strategyScores["corp.fast_advance"]?.finalScore,
    ).toBeLessThan(
      profile.strategyScores["corp.tag_trace_punish"]?.finalScore ?? 0,
    );
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

  it("counts city-grid card ids as region support without substring noise", () => {
    const profile = buildDeckStrategyProfile({
      deckSnapshotId: "ai030-corp-city-grid-id-diagnostic",
      side: "corp",
      cards: [
        { cardId: "onr_v1_367_rio-de-janeiro-city-grid", quantity: 2 },
        { cardId: "test_city-gridish-noise", quantity: 3 },
      ],
    });

    expect(
      profile.corpProfile?.remoteProfile.regionCityGridUpgradeSupport,
    ).toBe(2);
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

  it("recognizes real cheap ICE for the Chrome Rush Bureau rush line", () => {
    const profile = buildDeckStrategyProfile(
      standardDeckByName("Chrome Rush Bureau"),
    );
    const rush = profile.strategyScores["corp.rush_score"];

    expect(rush?.supportEvidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          signal: "cheap_ice",
          reason: "support:earlyIce",
        }),
      ]),
    );
    expect(rush?.supportScore).toBeGreaterThanOrEqual(65);
    expect(rush?.runtimeStatus).toBe("productive");
    expect(rush?.runtimeBlockers).toEqual([]);
  });

  it("keeps new Corp support dimensions semantically distinct from their anchors", () => {
    const actionTempo = buildDeckStrategyProfile(
      standardDeckByName("Proteus Korp - Variable ICE Gauntlet"),
    ).strategyScores["corp.action_tempo"];
    const overadvance = buildDeckStrategyProfile(
      standardDeckByName("Chrome Rush Bureau"),
    ).strategyScores["corp.overadvance_value"];
    const drawEngine = buildDeckStrategyProfile(
      standardDeckByName("Classic Corp - Remote Lab Deflection"),
    ).strategyScores["corp.draw_engine"];

    const boardSafety = actionTempo?.supportEvidence.filter(
      (entry) => entry.reason === "support:boardSafety",
    );
    expect(boardSafety?.length).toBeGreaterThan(0);
    expect(
      boardSafety?.every((entry) => !entry.signal?.startsWith("action.corp_")),
    ).toBe(true);

    const remoteSafety = overadvance?.supportEvidence.filter(
      (entry) => entry.reason === "support:remoteSafety",
    );
    expect(remoteSafety?.length).toBeGreaterThan(0);
    expect(
      remoteSafety?.every(
        (entry) =>
          !entry.signal?.startsWith("advance.overadvance_") &&
          !entry.signal?.startsWith("score.overadvance_"),
      ),
    ).toBe(true);

    const safety = drawEngine?.supportEvidence.filter(
      (entry) => entry.reason === "support:safety",
    );
    expect(safety?.length).toBeGreaterThan(0);
    expect(
      safety?.every((entry) => !entry.signal?.startsWith("draw.corp_")),
    ).toBe(true);
  });

  it("does not invent legacy strategy evidence for a generic run event", () => {
    const profile = buildDeckStrategyProfile({
      deckSnapshotId: "ai006-runner-legacy-only-diagnostic",
      side: "runner",
      cards: [{ cardId: "simple_run_event", quantity: 3 }],
    });

    expect(profile.legacySignalCounts["planRole:pressure_rnd"]).toBeUndefined();
    expect(profile.strategyScores["runner.rnd_pressure"]?.anchorScore).toBe(0);
    expect(
      profile.strategyScores["runner.rnd_pressure"]?.anchorEvidence,
    ).toEqual([]);
  });

  it("keeps the strategy profile output side-safe and deterministic", () => {
    const snapshot = snapshotById("onr_origin_runner_ai_snapshot_v1");
    const profile = buildDeckStrategyProfile(snapshot);

    expect(profile).toEqual(buildDeckStrategyProfile(snapshot));
    expect(profile.source).toMatchObject({
      mode: "ai_internal_strategy_profile",
      plannerEffect: "strategic_intent_input",
    });
    expect(JSON.stringify(profile)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|tokenHash|fullGameState|stateHash|deckHash|legalActions/i,
    );
  });

  it("annotates every strategy score with runtime readiness", () => {
    const profile = buildDeckStrategyProfile(
      snapshotById("onr_origin_runner_ai_snapshot_v1"),
    );

    expect(Object.values(profile.strategyScores).length).toBeGreaterThan(0);
    expect(
      Object.values(profile.strategyScores).every(
        (score) =>
          score.runtimeStatus !== undefined &&
          Array.isArray(score.runtimeBlockers),
      ),
    ).toBe(true);
    expect(
      profile.primaryStrategies.every(
        (strategyId) =>
          profile.strategyScores[strategyId]?.runtimeStatus === "productive",
      ),
    ).toBe(true);
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

function snapshotById(snapshotId: string): AiDeckStrategyDeckSnapshot {
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

function standardDeckByName(name: string): AiDeckStrategyDeckSnapshot {
  const deck = standardDeckCatalog.decks.find(
    (candidate) => candidate.name === name,
  );
  if (!deck) throw new Error(`Missing standard deck fixture ${name}`);
  return {
    deckSnapshotId: `standard_${deck.standardDeckId}_${deck.version}`,
    side: deck.side as "runner" | "corp",
    cards: deck.cards.map((card) => ({
      cardId: card.cardId,
      quantity: card.quantity,
    })),
  };
}

function rankingScore(
  anchorCardIds: readonly string[],
  supportCardIds: readonly string[],
): DeckStrategyScore {
  return {
    anchorScore: 60,
    supportScore: 60,
    finalScore: 60,
    confidence: "medium",
    runtimeStatus: "productive",
    runtimeBlockers: [],
    supportGaps: [],
    anchorEvidence: anchorCardIds.map((cardId) => ({
      cardId,
      quantity: 1,
      source: "derivedStrategyAnchor",
      reason: "test",
    })),
    supportEvidence: supportCardIds.map((cardId) => ({
      cardId,
      quantity: 1,
      source: "functionSignal",
      signal: "test.support",
      reason: "test",
    })),
  };
}
