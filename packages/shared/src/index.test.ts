import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CURRENT_RULES_BASELINE } from "./baselines";
import { LEGACY_ABILITY_PAYLOAD_FIELDS } from "./ability-payload";
import { CORE_DEMO_DECK_IDS, LEGACY_FIXTURE_DECK_IDS } from "./demo-fixtures";
import { DEMO_DECKS } from "./demo-decks";
import {
  DEMO_DECK_IDS,
  AI_DECISION_DEBUG_SCHEMA_VERSION,
  CARD_DEFINITIONS,
  CARD_DEFINITIONS_BY_ID,
  CURRENT_RULES_BASELINE as INDEX_CURRENT_RULES_BASELINE,
  DEMO_CARDS_BY_ID,
  DEMO_DECKS as INDEX_DEMO_DECKS,
  LEGACY_ABILITY_PAYLOAD_FIELDS as INDEX_LEGACY_ABILITY_PAYLOAD_FIELDS,
  sanitizeAiDecisionDebug,
} from "./index";

describe("legacy ability payload compatibility registry", () => {
  it("keeps stable coverage for historical ability payload aliases", () => {
    expect(LEGACY_ABILITY_PAYLOAD_FIELDS).toEqual(
      expect.arrayContaining([
        "v1911HiddenZoneAbility",
        "v1917AssetAbility",
        "v1919OperationAbility",
        "v1922RunnerEventAbility",
        "v1922CorpOperationAbility",
        "agendaAbility",
        "resourceAbility",
      ]),
    );
    expect(new Set(LEGACY_ABILITY_PAYLOAD_FIELDS).size).toBe(
      LEGACY_ABILITY_PAYLOAD_FIELDS.length,
    );
    expect(INDEX_LEGACY_ABILITY_PAYLOAD_FIELDS).toBe(
      LEGACY_ABILITY_PAYLOAD_FIELDS,
    );
  });
});

describe("demo deck fixture registry", () => {
  it("groups current demos separately from legacy fixture decks", () => {
    expect(CORE_DEMO_DECK_IDS).toEqual([
      "demo_runner_001",
      "demo_corp_001",
      "demo_runner_004",
      "demo_corp_004",
      "demo_runner_008",
      "demo_corp_008",
    ]);
    expect(LEGACY_FIXTURE_DECK_IDS).toEqual([
      "demo_runner_096",
      "demo_corp_096",
      "demo_runner_097",
      "demo_corp_097",
      "demo_runner_098",
      "demo_corp_098",
      "demo_runner_099",
      "demo_corp_099",
    ]);
    expect(DEMO_DECK_IDS).toEqual([
      ...CORE_DEMO_DECK_IDS,
      ...LEGACY_FIXTURE_DECK_IDS,
    ]);
    expect(Object.keys(DEMO_DECKS).sort()).toEqual([...DEMO_DECK_IDS].sort());
    expect(INDEX_DEMO_DECKS).toBe(DEMO_DECKS);
  });
});

describe("rules baseline registry", () => {
  it("keeps the current rules baseline in a dedicated shared module and re-exports it", () => {
    expect(CURRENT_RULES_BASELINE.cardTextSnapshotId).toBe("mvp-0.99-demo");
    expect(CURRENT_RULES_BASELINE.simulationSchemaVersion).toBe("0.99.0");
    expect(INDEX_CURRENT_RULES_BASELINE).toBe(CURRENT_RULES_BASELINE);
  });
});

describe("shared card definition registry", () => {
  it("keeps concrete card data out of the shared contract barrel", () => {
    const barrel = readFileSync(new URL("./index.ts", import.meta.url), "utf8");

    expect(barrel).toContain('from "./card-definitions"');
    expect(barrel).not.toContain("ONR_V1_LIMITED_PLAYABLE_CARDS");
    expect(barrel).not.toContain('id: "onr_v1_');
  });

  it("exposes a current-state registry independent from the shared barrel implementation", () => {
    expect(CARD_DEFINITIONS.length).toBeGreaterThan(0);
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_140_raven-microcyb-eagle"]).toBe(
      DEMO_CARDS_BY_ID["onr_v1_140_raven-microcyb-eagle"],
    );
  });

  it("keeps Raven Microcyb Eagle on its real deck text and subtype", () => {
    const raven = DEMO_CARDS_BY_ID["onr_v1_140_raven-microcyb-eagle"];

    expect(raven?.subtypes).toEqual(["deck"]);
    expect(raven?.rulesText).toContain("Provides +1 MU");
    expect(raven?.rulesText).toContain("Prevents up to 1 Net damage");
    expect(raven?.rulesText).toContain(
      "Use this bit only to pay for using icebreakers during runs",
    );
    expect(raven?.mechanics).toEqual(
      expect.arrayContaining([
        "memory",
        "damage_prevention",
        "recurring_credit",
        "deck_unique",
      ]),
    );
  });
});

describe("AI decision debug sanitizing", () => {
  it("keeps enough detail sections for semantic precision reports", () => {
    const detailSections = Array.from({ length: 16 }, (_, index) => ({
      id: `section_${index + 1}`,
      title: `Section ${index + 1}`,
      items: [`item_${index + 1}`],
    }));

    const sanitized = sanitizeAiDecisionDebug({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: 2,
      detailSections,
    });

    expect(sanitized?.detailSections).toHaveLength(16);
    expect(sanitized?.detailSections?.at(-1)?.id).toBe("section_16");
  });

  it("keeps extended detail section items for rich AI plan diagnostics", () => {
    const items = Array.from(
      { length: 160 },
      (_, index) => `item_${index + 1}`,
    );

    const sanitized = sanitizeAiDecisionDebug({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: 2,
      detailSections: [{ id: "tactical_plan", title: "Tactical Plan", items }],
    });

    expect(sanitized?.detailSections?.[0]?.items).toHaveLength(160);
    expect(sanitized?.detailSections?.[0]?.items.at(-1)).toBe("item_160");
  });

  it("still bounds oversized detail section item payloads", () => {
    const items = Array.from(
      { length: 300 },
      (_, index) => `item_${index + 1}`,
    );

    const sanitized = sanitizeAiDecisionDebug({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: 2,
      detailSections: [{ id: "tactical_plan", title: "Tactical Plan", items }],
    });

    expect(sanitized?.detailSections?.[0]?.items).toHaveLength(256);
    expect(sanitized?.detailSections?.[0]?.items.at(-1)).toBe("item_256");
  });

  it("keeps action alternative raw scores distinct from display priority", () => {
    const sanitized = sanitizeAiDecisionDebug({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: 2,
      actionAlternatives: [
        {
          rank: 1,
          actionId: "runner.gain_credit",
          actionType: "gain_credit",
          selected: true,
          score: 979,
          priority: 1229,
        },
      ],
    });

    expect(sanitized?.actionAlternatives?.[0]).toMatchObject({
      score: 979,
      priority: 1229,
    });
  });
});
