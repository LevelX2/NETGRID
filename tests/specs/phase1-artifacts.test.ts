import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DATA_FILES = [
  "data/rules/rules-baseline.json",
  "data/cards/demo-cards.json",
  "data/decks/demo-decks.json",
  "data/manifests/card-implementation-manifest.json",
  "data/deviations/rule-deviations.json"
];

const REQUIRED_MVP_0_1_SCENARIOS = [
  "runner-steals-rd-agenda.json",
  "runner-breaks-ice-and-accesses-rd.json",
  "runner-fails-on-end-the-run.json",
  "corp-scores-remote-agenda.json",
  "visibility-runner-view-no-corp-leak.json",
  "replay-full-demo-game-statehash.json"
];

const REQUIRED_MVP_0_2_SCENARIOS = [
  "multiplayer-create-join-action.json",
  "multiplayer-reconnect-during-run.json",
  "multiplayer-undo-before-hidden-info.json",
  "multiplayer-undo-after-hidden-info-blocked.json"
];

const MVP_0_4_DATA_FILES = [
  "data/rules/rules-baseline-0.4.json",
  "data/cards/demo-cards-0.4.json",
  "data/decks/demo-decks-0.4.json",
  "data/manifests/card-implementation-manifest-0.4.json",
  "data/deviations/rule-deviations-0.4.json"
];

const MVP_0_5_DATA_FILES = [
  "data/card-import/source-registry-0.5.json",
  "data/card-import/card-snapshot-0.5.json",
  "data/card-import/import-report-0.5.json",
  "data/card-import/catalog-index-0.5.json",
  "data/manifests/card-catalog-status-0.5.json"
];

const MVP_0_6_DATA_FILES = [
  "data/decks/deck-format-profiles-0.6.json",
  "data/decks/deck-templates-0.6.json",
  "data/decks/deck-snapshots-0.6.json",
  "data/manifests/deck-validation-manifest-0.6.json"
];

const REQUIRED_MVP_0_4_SCENARIOS = [
  "v04-safe-card-batch-smoke.json",
  "v04-tag-runner-and-remove-tag.json",
  "v04-tag-punishment-blocked-when-untagged.json",
  "v04-expanded-deck-ai-vs-ai-smoke.json"
];

const REQUIRED_MVP_0_5_MUST_IDS = Array.from({ length: 10 }, (_, index) => `V05-MUST-${String(index + 1).padStart(3, "0")}`);
const REQUIRED_MVP_0_6_MUST_IDS = Array.from({ length: 11 }, (_, index) => `V06-MUST-${String(index + 1).padStart(3, "0")}`);
const REQUIRED_MVP_0_7_MUST_IDS = Array.from({ length: 16 }, (_, index) => `V07-MUST-${String(index + 1).padStart(3, "0")}`);
const REQUIRED_MVP_0_8_MUST_IDS = Array.from({ length: 21 }, (_, index) => `V08-MUST-${String(index + 1).padStart(3, "0")}`);
const REQUIRED_MVP_0_7_DOCS = [
  "docs/derived/MVP_0.7_REQUIREMENTS.md",
  "docs/derived/UI_REDESIGN_0.7_SPEC.md",
  "docs/derived/RUN_ENCOUNTER_UI_0.7_SPEC.md",
  "docs/derived/CARD_VIEW_0.7_SPEC.md",
  "docs/derived/ACCESSIBILITY_0.7_SPEC.md",
  "docs/derived/MVP_0.7_TEST_MATRIX.md",
  "docs/derived/MVP_0.7_REQUIREMENTS_REVIEW.md",
  "docs/derived/MVP_0.7_IMPLEMENTATION_REVIEW.md",
  "docs/derived/MVP_0.7_FINAL_REVIEW.md",
  "tests/specs/ui-redesign-0.7-acceptance-tests.todo.md"
];

const REQUIRED_MVP_0_8_DOCS = [
  "docs/derived/MVP_0.8_REQUIREMENTS.md",
  "docs/derived/PLAYABLE_CARD_SLICE_0.8_SPEC.md",
  "docs/derived/RULE_MECHANICS_0.8_SPEC.md",
  "docs/derived/CARD_IMPLEMENTATION_0.8_SPEC.md",
  "docs/derived/MVP_0.8_TEST_MATRIX.md",
  "docs/derived/MVP_0.8_REQUIREMENTS_REVIEW.md",
  "tests/specs/playable-card-slice-0.8-acceptance-tests.todo.md"
];

const MVP_0_8_DATA_FILES = [
  "data/cards/demo-cards-0.8.json",
  "data/decks/demo-decks-0.8.json",
  "data/manifests/card-implementation-manifest-0.8.json"
];

const REQUIRED_MVP_0_8_SCENARIOS = [
  "v08-starter-runner-economy-draw.json",
  "v08-starter-icebreaker-run.json",
  "v08-starter-corp-economy-score.json",
  "v08-starter-tag-tax-smoke.json"
];

describe("Phase 1 derived artifacts", () => {
  it("keeps all MVP 0.1 JSON data artifacts parseable", () => {
    for (const file of DATA_FILES) {
      expect(() => JSON.parse(readFileSync(file, "utf8")), file).not.toThrow();
    }
  });

  it("keeps required MVP 0.1 scenario fixtures present and mapped to requirements", () => {
    const scenarioDir = "data/scenarios";
    const present = readdirSync(scenarioDir).filter((file) => file.endsWith(".json"));
    for (const file of REQUIRED_MVP_0_1_SCENARIOS) {
      expect(present, file).toContain(file);
    }

    for (const file of REQUIRED_MVP_0_1_SCENARIOS) {
      const scenario = JSON.parse(readFileSync(join(scenarioDir, file), "utf8")) as {
        id?: string;
        baselineId?: string;
        coversRequirements?: string[];
        coversTests?: string[];
        actions?: unknown[];
        expected?: unknown;
      };
      expect(scenario.id, file).toMatch(/^SCN-\d{3}$/);
      expect(scenario.baselineId, file).toBe("rules-baseline-mvp-0.1");
      expect(scenario.coversRequirements?.length, file).toBeGreaterThan(0);
      expect(scenario.coversTests?.length, file).toBeGreaterThan(0);
      expect(Array.isArray(scenario.actions), file).toBe(true);
      expect(scenario.expected, file).toBeDefined();
    }
  });

  it("keeps MVP 0.2 multiplayer scenario fixtures present and mapped", () => {
    const scenarioDir = "data/scenarios";
    const present = readdirSync(scenarioDir).filter((file) => file.endsWith(".json"));
    for (const file of REQUIRED_MVP_0_2_SCENARIOS) {
      expect(present, file).toContain(file);
      const scenario = JSON.parse(readFileSync(join(scenarioDir, file), "utf8")) as {
        id?: string;
        baselineId?: string;
        coversRequirements?: string[];
        steps?: unknown[];
        expected?: unknown;
      };
      expect(scenario.id, file).toMatch(/^SCN-MP-\d{3}$/);
      expect(scenario.baselineId, file).toBe("rules-baseline-mvp-0.2");
      expect(scenario.coversRequirements?.length, file).toBeGreaterThan(0);
      expect(Array.isArray(scenario.steps), file).toBe(true);
      expect(scenario.expected, file).toBeDefined();
    }
  });

  it("maps every playable MVP card to unit and scenario coverage", () => {
    const manifest = JSON.parse(readFileSync("data/manifests/card-implementation-manifest.json", "utf8")) as {
      cards: Array<{ status: string; unitTests?: string[]; scenarioTests?: string[] }>;
    };
    const playableCards = manifest.cards.filter((card) => card.status === "playable_mvp");
    expect(playableCards.length).toBe(13);
    expect(playableCards.every((card) => card.unitTests?.length && card.scenarioTests?.length)).toBe(true);
  });

  it("keeps MVP 0.4 data artifacts parseable and mapped", () => {
    for (const file of MVP_0_4_DATA_FILES) {
      expect(() => JSON.parse(readFileSync(file, "utf8")), file).not.toThrow();
    }
    const scenarioDir = "data/scenarios";
    const present = readdirSync(scenarioDir).filter((file) => file.endsWith(".json"));
    for (const file of REQUIRED_MVP_0_4_SCENARIOS) {
      expect(present, file).toContain(file);
      const scenario = JSON.parse(readFileSync(join(scenarioDir, file), "utf8")) as { id?: string; requirementIds?: string[]; expected?: unknown };
      expect(scenario.id, file).toMatch(/^SCN-V04-\d{3}$/);
      expect(scenario.requirementIds?.length, file).toBeGreaterThan(0);
      expect(scenario.expected, file).toBeDefined();
    }
    const manifest = JSON.parse(readFileSync("data/manifests/card-implementation-manifest-0.4.json", "utf8")) as {
      cards: Array<{ status: string; unitTests?: string[]; scenarioTests?: string[]; visibilityTests?: string[]; replayTests?: string[] }>;
    };
    const playableCards = manifest.cards.filter((card) => card.status === "playable_mvp");
    expect(playableCards.length).toBe(9);
    expect(playableCards.every((card) => card.unitTests?.length && card.scenarioTests?.length && card.visibilityTests?.length && card.replayTests?.length)).toBe(true);
  });

  it("keeps MVP 0.5 card import artifacts parseable and safe", () => {
    for (const file of MVP_0_5_DATA_FILES) {
      expect(() => JSON.parse(readFileSync(file, "utf8")), file).not.toThrow();
    }

    const sourceRegistry = JSON.parse(readFileSync("data/card-import/source-registry-0.5.json", "utf8")) as {
      sources: Array<{ disallowedUses?: string[] }>;
    };
    expect(sourceRegistry.sources.length).toBeGreaterThanOrEqual(2);
    expect(sourceRegistry.sources.every((source) => source.disallowedUses?.includes("runtime_external_fetch"))).toBe(true);
    expect(sourceRegistry.sources.every((source) => source.disallowedUses?.includes("asset_import"))).toBe(true);

    const report = JSON.parse(readFileSync("data/card-import/import-report-0.5.json", "utf8")) as {
      gateAssertions?: Record<string, boolean>;
      counts?: { cardsTotal?: number; blocked?: number };
    };
    expect(report.gateAssertions?.noRuntimeExternalFetch).toBe(true);
    expect(report.gateAssertions?.noOfficialAssets).toBe(true);
    expect(report.gateAssertions?.cardTextDisplayOnly).toBe(true);
    expect(report.gateAssertions?.importDoesNotGrantPlayability).toBe(true);
    expect(report.counts?.cardsTotal).toBeGreaterThan(0);
    expect(report.counts?.blocked).toBeGreaterThanOrEqual(1);
  });

  it("keeps MVP 0.5 snapshot hash stable", () => {
    const snapshot = JSON.parse(readFileSync("data/card-import/card-snapshot-0.5.json", "utf8"));
    const expectedHash = readFileSync("data/card-import/card-snapshot-0.5.hash", "utf8").trim();
    expect(fnv1a(stableStringify(snapshot))).toBe(expectedHash);
  });

  it("keeps MVP 0.5 card status gates separated", () => {
    const statusManifest = JSON.parse(readFileSync("data/manifests/card-catalog-status-0.5.json", "utf8")) as {
      cards: Array<{
        catalogCardId: string;
        engineCardId: string | null;
        statuses: {
          imported: boolean;
          validated: boolean;
          catalog_ready: boolean;
          implemented: boolean;
          playable: boolean;
          deck_legal: boolean;
          blocked: boolean;
        };
        blockReasons: string[];
      }>;
    };
    expect(statusManifest.cards.length).toBeGreaterThan(0);
    expect(statusManifest.cards.every((card) => card.statuses.imported)).toBe(true);
    expect(statusManifest.cards.every((card) => !card.statuses.catalog_ready || card.statuses.validated)).toBe(true);
    expect(statusManifest.cards.every((card) => !card.statuses.playable || card.statuses.implemented)).toBe(true);
    expect(statusManifest.cards.every((card) => !card.statuses.deck_legal || card.statuses.playable)).toBe(true);
    expect(statusManifest.cards.every((card) => !card.statuses.blocked || card.blockReasons.length > 0)).toBe(true);

    const importOnly = statusManifest.cards.find((card) => card.catalogCardId === "catalog_preview_operation_001");
    expect(importOnly?.engineCardId).toBeNull();
    expect(importOnly?.statuses.catalog_ready).toBe(true);
    expect(importOnly?.statuses.playable).toBe(false);
    expect(importOnly?.statuses.deck_legal).toBe(false);

    const blocked = statusManifest.cards.find((card) => card.catalogCardId === "catalog_preview_resource_001");
    expect(blocked?.statuses.blocked).toBe(true);
    expect(blocked?.statuses.deck_legal).toBe(false);
  });

  it("maps every MVP 0.5 Must requirement to test coverage", () => {
    const requirements = readFileSync("docs/derived/MVP_0.5_REQUIREMENTS.md", "utf8");
    const testMatrix = readFileSync("docs/derived/MVP_0.5_TEST_MATRIX.md", "utf8");
    const review = readFileSync("docs/derived/MVP_0.5_REQUIREMENTS_REVIEW.md", "utf8");

    for (const requirementId of REQUIRED_MVP_0_5_MUST_IDS) {
      expect(requirements, requirementId).toContain(requirementId);
      expect(testMatrix, requirementId).toContain(requirementId);
    }
    expect(review).toContain("ready_for_implementation: true");
  });

  it("keeps MVP 0.6 deck artifacts parseable and valid", () => {
    for (const file of MVP_0_6_DATA_FILES) {
      expect(() => JSON.parse(readFileSync(file, "utf8")), file).not.toThrow();
    }

    const manifest = JSON.parse(readFileSync("data/manifests/deck-validation-manifest-0.6.json", "utf8")) as {
      gateAssertions?: Record<string, boolean>;
      snapshots: Array<{
        validation: { ok: boolean };
        publicMetadata: Record<string, unknown>;
      }>;
    };
    expect(manifest.gateAssertions?.allSnapshotsValid).toBe(true);
    expect(manifest.gateAssertions?.allSnapshotsImmutable).toBe(true);
    expect(manifest.gateAssertions?.noImportOnlyCardsDeckLegal).toBe(true);
    expect(manifest.gateAssertions?.publicMetadataHasNoCardLists).toBe(true);
    expect(manifest.snapshots.every((snapshot) => snapshot.validation.ok)).toBe(true);
    expect(manifest.snapshots.every((snapshot) => !Object.hasOwn(snapshot.publicMetadata, "cards"))).toBe(true);
  });

  it("keeps MVP 0.6 deck snapshot hashes deterministic", () => {
    const snapshotSet = JSON.parse(readFileSync("data/decks/deck-snapshots-0.6.json", "utf8")) as {
      snapshots: Array<{
        deckHash: string;
        publicMetadata: { deckHash: string };
      }>;
    };
    expect(snapshotSet.snapshots.length).toBe(4);
    for (const snapshot of snapshotSet.snapshots) {
      const hashInput = structuredClone(snapshot);
      hashInput.deckHash = "pending";
      hashInput.publicMetadata.deckHash = "pending";
      const expected = fnv1a(stableStringify(hashInput));
      expect(snapshot.deckHash).toBe(expected);
      expect(snapshot.publicMetadata.deckHash).toBe(expected);
    }
  });

  it("maps every MVP 0.6 Must requirement to test coverage", () => {
    const requirements = readFileSync("docs/derived/MVP_0.6_REQUIREMENTS.md", "utf8");
    const testMatrix = readFileSync("docs/derived/MVP_0.6_TEST_MATRIX.md", "utf8");
    const review = readFileSync("docs/derived/MVP_0.6_REQUIREMENTS_REVIEW.md", "utf8");

    for (const requirementId of REQUIRED_MVP_0_6_MUST_IDS) {
      expect(requirements, requirementId).toContain(requirementId);
      expect(testMatrix, requirementId).toContain(requirementId);
    }
    expect(review).toContain("ready_for_implementation: true");
  });

  it("keeps MVP 0.7 UI requirements frozen and mapped to test coverage", () => {
    for (const file of REQUIRED_MVP_0_7_DOCS) {
      expect(readFileSync(file, "utf8").length, file).toBeGreaterThan(0);
    }

    const requirements = readFileSync("docs/derived/MVP_0.7_REQUIREMENTS.md", "utf8");
    const testMatrix = readFileSync("docs/derived/MVP_0.7_TEST_MATRIX.md", "utf8");
    const review = readFileSync("docs/derived/MVP_0.7_REQUIREMENTS_REVIEW.md", "utf8");
    const implementationReview = readFileSync("docs/derived/MVP_0.7_IMPLEMENTATION_REVIEW.md", "utf8");
    const finalReview = readFileSync("docs/derived/MVP_0.7_FINAL_REVIEW.md", "utf8");

    for (const requirementId of REQUIRED_MVP_0_7_MUST_IDS) {
      expect(requirements, requirementId).toContain(requirementId);
      expect(testMatrix, requirementId).toContain(requirementId);
    }
    expect(requirements).toContain("Design C");
    expect(requirements).toContain("Design D");
    expect(requirements).toContain("Design B");
    expect(requirements).toContain("ready_for_implementation: true");
    expect(review).toContain("ready_for_implementation: true");
    expect(implementationReview).toContain("ready_for_hardening: true");
    expect(finalReview).toContain("MVP_0.7_done: true");
  });

  it("keeps MVP 0.8 playable starter-slice requirements frozen and mapped", () => {
    for (const file of REQUIRED_MVP_0_8_DOCS) {
      expect(readFileSync(file, "utf8").length, file).toBeGreaterThan(0);
    }
    for (const file of MVP_0_8_DATA_FILES) {
      expect(() => JSON.parse(readFileSync(file, "utf8")), file).not.toThrow();
    }

    const requirements = readFileSync("docs/derived/MVP_0.8_REQUIREMENTS.md", "utf8");
    const testMatrix = readFileSync("docs/derived/MVP_0.8_TEST_MATRIX.md", "utf8");
    const review = readFileSync("docs/derived/MVP_0.8_REQUIREMENTS_REVIEW.md", "utf8");

    for (const requirementId of REQUIRED_MVP_0_8_MUST_IDS) {
      expect(requirements, requirementId).toContain(requirementId);
      expect(testMatrix, requirementId).toContain(requirementId);
    }
    expect(requirements).toContain("source_mode: local_original");
    expect(requirements).toContain("ready_for_implementation: true");
    expect(review).toContain("ready_for_implementation: true");

    const manifest = JSON.parse(readFileSync("data/manifests/card-implementation-manifest-0.8.json", "utf8")) as {
      cards: Array<{
        cardCode: string;
        status: string;
        sourceMode?: string;
        resolver?: string;
        roleTags?: string[];
        unitTests?: string[];
        scenarioTests?: string[];
        visibilityTests?: string[];
        replayTests?: string[];
        aiSmokeTests?: string[];
      }>;
    };
    const playableCards = manifest.cards.filter((card) => card.status === "playable_mvp");
    expect(playableCards.length).toBe(14);
    expect(playableCards.every((card) => card.sourceMode === "local_original")).toBe(true);
    expect(playableCards.every((card) => card.resolver && card.roleTags?.length)).toBe(true);
    expect(
      playableCards.every(
        (card) => card.unitTests?.length && card.scenarioTests?.length && card.visibilityTests?.length && card.replayTests?.length && card.aiSmokeTests?.length
      )
    ).toBe(true);

    const scenarioDir = "data/scenarios";
    const present = readdirSync(scenarioDir).filter((file) => file.endsWith(".json"));
    const scenarioCoveredCards = new Set<string>();
    for (const file of REQUIRED_MVP_0_8_SCENARIOS) {
      expect(present, file).toContain(file);
      const scenario = JSON.parse(readFileSync(join(scenarioDir, file), "utf8")) as {
        id?: string;
        baselineId?: string;
        requirementIds?: string[];
        coversCards?: string[];
        expected?: unknown;
      };
      expect(scenario.id, file).toMatch(/^SCN-V08-\d{3}$/);
      expect(scenario.baselineId, file).toBe("rules-baseline-mvp-0.8");
      expect(scenario.requirementIds?.length, file).toBeGreaterThan(0);
      expect(scenario.expected, file).toBeDefined();
      for (const cardId of scenario.coversCards ?? []) scenarioCoveredCards.add(cardId);
    }
    for (const card of playableCards) {
      expect(scenarioCoveredCards.has(card.cardCode), card.cardCode).toBe(true);
    }
  });
});

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
