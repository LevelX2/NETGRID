import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const inspectorIndexPath = path.join(repoRoot, "data/ai/ai-hint-inspector-index.json");

type AiHintInspectorIndex = {
  schemaVersion: string;
  source: {
    compiledHintsPath: string;
    functionSignalDerivationPath: string;
  };
  summary: {
    cardCount: number;
    cardsWithMechanicalFacts: number;
    cardsWithFunctionSignals: number;
    cardsWithStrategyAnchors: number;
  };
  cards: Array<{
    cardId: string;
    supportStatus: {
      compiledHintFound: boolean;
      mechanicalFactsFound: boolean;
      generatedFactsFound: boolean;
    };
    derivedFunctionSignals: string[];
    derivedStrategyAnchors: string[];
    lineSupportClassification: Array<{
      value: string;
      triageCategory: string;
      mapsTo: string[];
    }>;
    rolesClassification: Array<{ value: string; triageCategory: string }>;
    planRolesClassification: Array<{ value: string; triageCategory: string }>;
    warningCategories: string[];
    strategicRoleStatus: { values: string[] };
  }>;
};

describe("AI005 hint inspector index", () => {
  it("is deterministic against the committed artifact", () => {
    execFileSync("node", ["scripts/build-ai-hint-inspector-index.mjs", "--check"], {
      cwd: repoRoot,
      encoding: "utf8",
    });
  });

  it("exposes compiled, mechanical, function-signal and legacy classifications without runtime fields", () => {
    const index = readIndex();
    expect(index.schemaVersion).toBe("ai-hint-inspector-index-v1");
    expect(index.source.compiledHintsPath).toBe("data/ai/ai-card-hints-compiled.json");
    expect(index.source.functionSignalDerivationPath).toBe(
      "data/ai/function-signal-derivation-v1.json",
    );
    expect(index.summary.cardCount).toBeGreaterThan(400);
    expect(index.summary.cardsWithMechanicalFacts).toBeGreaterThan(300);
    expect(index.summary.cardsWithFunctionSignals).toBeGreaterThan(300);
    expect(index.summary.cardsWithStrategyAnchors).toBeGreaterThan(100);

    const aiBoon = card(index, "onr_v1_002_ai-boon");
    expect(aiBoon.supportStatus).toMatchObject({
      compiledHintFound: true,
      mechanicalFactsFound: true,
    });
    expect(aiBoon.derivedFunctionSignals).toContain("breaker.sentry");
    expect(aiBoon.lineSupportClassification).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: "rig_first",
          triageCategory: "deferred_requires_human_review",
          mapsTo: ["runner.rig_first"],
        }),
      ]),
    );
    expect(aiBoon.warningCategories).toContain("legacy_lineSupport");

    const clown = card(index, "onr_v1_012_clown");
    expect(clown.supportStatus.generatedFactsFound).toBe(true);
    expect(clown.rolesClassification).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: "ice_modifier",
          triageCategory: "function_signal_only",
        }),
      ]),
    );

    expect(JSON.stringify(index)).not.toMatch(
      /"cardInstances"|"privatePayload"|"fullState"|"stateHash"|"actionId"/,
    );
  });
});

function readIndex(): AiHintInspectorIndex {
  return JSON.parse(fs.readFileSync(inspectorIndexPath, "utf8")) as AiHintInspectorIndex;
}

function card(index: AiHintInspectorIndex, cardId: string) {
  const found = index.cards.find((entry) => entry.cardId === cardId);
  if (!found) throw new Error(`Missing inspector card ${cardId}`);
  return found;
}
