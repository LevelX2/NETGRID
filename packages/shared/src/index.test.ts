import { describe, expect, it } from "vitest";
import {
  CURRENT_RULES_BASELINE,
  MVP_0_1_BASELINE,
  MVP_0_99_BASELINE,
} from "./baselines";
import { LEGACY_ABILITY_PAYLOAD_FIELDS } from "./ability-payload";
import {
  CORE_DEMO_DECK_IDS,
  LEGACY_FIXTURE_DECK_IDS,
} from "./demo-fixtures";
import { DEMO_DECKS } from "./demo-decks";
import {
  DEMO_DECK_IDS,
  CURRENT_RULES_BASELINE as INDEX_CURRENT_RULES_BASELINE,
  DEMO_DECKS as INDEX_DEMO_DECKS,
  LEGACY_ABILITY_PAYLOAD_FIELDS as INDEX_LEGACY_ABILITY_PAYLOAD_FIELDS,
  MVP_0_99_BASELINE as INDEX_MVP_0_99_BASELINE,
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
    expect(Object.keys(DEMO_DECKS).sort()).toEqual(
      [...DEMO_DECK_IDS].sort(),
    );
    expect(INDEX_DEMO_DECKS).toBe(DEMO_DECKS);
  });
});

describe("rules baseline registry", () => {
  it("keeps version baselines in a dedicated shared module and re-exports them", () => {
    expect(MVP_0_1_BASELINE.engineSchemaVersion).toBe("0.1.0");
    expect(MVP_0_99_BASELINE.cardTextSnapshotId).toBe("mvp-0.99-demo");
    expect(MVP_0_99_BASELINE.simulationSchemaVersion).toBe("0.99.0");
    expect(CURRENT_RULES_BASELINE).toBe(MVP_0_99_BASELINE);
    expect(INDEX_CURRENT_RULES_BASELINE).toBe(CURRENT_RULES_BASELINE);
    expect(INDEX_MVP_0_99_BASELINE).toBe(MVP_0_99_BASELINE);
  });
});
