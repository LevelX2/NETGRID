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

const REQUIRED_SCENARIOS = [
  "runner-steals-rd-agenda.json",
  "runner-breaks-ice-and-accesses-rd.json",
  "runner-fails-on-end-the-run.json",
  "corp-scores-remote-agenda.json",
  "visibility-runner-view-no-corp-leak.json",
  "replay-full-demo-game-statehash.json"
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
    expect(present.sort()).toEqual(REQUIRED_SCENARIOS.slice().sort());

    for (const file of REQUIRED_SCENARIOS) {
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

  it("maps every playable MVP card to unit and scenario coverage", () => {
    const manifest = JSON.parse(readFileSync("data/manifests/card-implementation-manifest.json", "utf8")) as {
      cards: Array<{ status: string; unitTests?: string[]; scenarioTests?: string[] }>;
    };
    const playableCards = manifest.cards.filter((card) => card.status === "playable_mvp");
    expect(playableCards.length).toBe(13);
    expect(playableCards.every((card) => card.unitTests?.length && card.scenarioTests?.length)).toBe(true);
  });
});
