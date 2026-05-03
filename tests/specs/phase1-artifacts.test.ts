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

const REQUIRED_MVP_0_4_SCENARIOS = [
  "v04-safe-card-batch-smoke.json",
  "v04-tag-runner-and-remove-tag.json",
  "v04-tag-punishment-blocked-when-untagged.json",
  "v04-expanded-deck-ai-vs-ai-smoke.json"
];

const REQUIRED_MVP_0_5_MUST_IDS = Array.from({ length: 10 }, (_, index) => `V05-MUST-${String(index + 1).padStart(3, "0")}`);

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
