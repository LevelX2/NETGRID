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
    tacticSignalCatalogPath?: string;
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

  it("exposes compiled, mechanical, function-signal and warning classifications without runtime fields", () => {
    const index = readIndex();
    expect(index.schemaVersion).toBe("ai-hint-inspector-index-v1");
    expect(index.source.compiledHintsPath).toBe("data/ai/ai-card-hints-compiled.json");
    expect(index.source.functionSignalDerivationPath).toBe(
      "data/ai/function-signal-derivation-v1.json",
    );
    expect(index.source.tacticSignalCatalogPath).toBe(
      "data/ai/tactic-signals-v1.json",
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
    expect(aiBoon.lineSupportClassification).toEqual([]);
    expect(aiBoon.warningCategories).not.toContain("legacy_lineSupport");
    expect(aiBoon.warningCategories).toContain("deferred_requires_human_review");

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

  it("exposes AI016 tactic-signal derivation fixes without broad legacy anchors", () => {
    const index = readIndex();
    const blackIceQualityAssurance = card(
      index,
      "onr_v1_191_black-ice-quality-assurance",
    );
    const iceTransmutation = card(index, "onr_v1_204_ice-transmutation");
    const doppelganger = card(
      index,
      "onr_proteus_057_doppelganger-antibody",
    );
    const closedAccounts = card(index, "onr_v1_285_closed-accounts");
    const onCallSoloTeam = card(index, "onr_v1_208_on-call-solo-team");
    const aiBoardMember = card(index, "onr_proteus_001_ai-board-member");
    const networkedCenter = card(index, "onr_proteus_065_networked-center");
    const canisMinor = card(index, "onr_v1_226_canis-minor");

    expect(blackIceQualityAssurance.derivedFunctionSignals).toContain(
      "ice.strength_modifier",
    );
    expect(blackIceQualityAssurance.derivedStrategyAnchors).toContain(
      "corp.ice_tax_glacier",
    );
    expect(blackIceQualityAssurance.derivedStrategyAnchors).not.toContain(
      "corp.remote_scoring",
    );

    expect(iceTransmutation.derivedFunctionSignals).toContain(
      "ice.strength_modifier",
    );
    expect(iceTransmutation.derivedFunctionSignals).toContain(
      "ice.subroutine_modifier",
    );
    expect(iceTransmutation.derivedStrategyAnchors).toContain(
      "corp.ice_tax_glacier",
    );
    expect(iceTransmutation.derivedStrategyAnchors).not.toContain(
      "corp.remote_scoring",
    );

    expect(doppelganger.derivedFunctionSignals).toEqual(
      expect.arrayContaining([
        "access.punish",
        "economy.counter",
        "tax.runner_credit",
        "tax.runner_persistent",
      ]),
    );
    expect(doppelganger.derivedStrategyAnchors).toContain(
      "corp.ambush_bluff",
    );
    expect(doppelganger.derivedStrategyAnchors).not.toContain(
      "corp.asset_economy",
    );

    expect(closedAccounts.derivedFunctionSignals).toEqual(
      expect.arrayContaining(["tag.payoff", "tax.runner_credit"]),
    );
    expect(closedAccounts.derivedStrategyAnchors).toContain(
      "corp.tag_trace_punish",
    );
    expect(closedAccounts.derivedStrategyAnchors).not.toContain(
      "corp.damage_kill",
    );

    expect(onCallSoloTeam.derivedFunctionSignals).toEqual(
      expect.arrayContaining([
        "damage.payoff",
        "score.agenda_action",
        "tag.payoff",
      ]),
    );
    expect(onCallSoloTeam.derivedStrategyAnchors).toContain(
      "corp.damage_kill",
    );
    expect(onCallSoloTeam.derivedStrategyAnchors).toContain(
      "corp.tag_trace_punish",
    );
    expect(onCallSoloTeam.derivedStrategyAnchors).not.toContain(
      "corp.fast_advance",
    );

    expect(aiBoardMember.derivedStrategyAnchors).not.toContain(
      "corp.fast_advance",
    );
    expect(networkedCenter.derivedFunctionSignals).toContain(
      "score.advance_burst",
    );
    expect(networkedCenter.derivedStrategyAnchors).toContain(
      "corp.fast_advance",
    );
    expect(canisMinor.derivedFunctionSignals).toContain("tax.ice");
    expect(canisMinor.derivedStrategyAnchors).toContain(
      "corp.ice_tax_glacier",
    );
  });

  it("exposes AI017 icebreaker pilot signals without planner-facing anchors", () => {
    const index = readIndex();
    const blackWidow = card(index, "onr_proteus_080_black-widow");
    const bartmoss = card(index, "onr_v1_005_bartmoss-memorial-icebreaker");
    const morphingTool = card(index, "onr_proteus_092_morphing-tool");
    const clown = card(index, "onr_v1_012_clown");
    const airportLocker = card(index, "onr_proteus_128_airport-locker");

    expect(blackWidow.derivedFunctionSignals).toEqual(
      expect.arrayContaining([
        "breaker.sentry",
        "breaker.targeted_ice_bonus",
        "breaker.strength_bonus_vs_chosen_ice",
      ]),
    );
    expect(blackWidow.derivedStrategyAnchors).toEqual([]);

    expect(bartmoss.derivedFunctionSignals).toEqual(
      expect.arrayContaining([
        "breaker.risky",
        "breaker.self_trash_risk",
        "breaker.universal",
      ]),
    );
    expect(bartmoss.derivedStrategyAnchors).toEqual([]);
    expect(bartmoss.strategicRoleStatus.values).toContain("emergency_tool");

    expect(morphingTool.derivedFunctionSignals).toEqual(
      expect.arrayContaining([
        "breaker.configurable_coverage",
        "breaker.reconfigurable_type",
      ]),
    );
    expect(morphingTool.derivedFunctionSignals).not.toContain(
      "breaker.universal",
    );
    expect(morphingTool.derivedStrategyAnchors).toEqual([]);

    expect(clown.derivedFunctionSignals).toEqual(
      expect.arrayContaining([
        "breaker.support",
        "ice.strength_reduction",
        "run.break_cost_support",
      ]),
    );
    expect(clown.derivedStrategyAnchors).toEqual([]);
    expect(clown.strategicRoleStatus.values).toContain("support_tool");

    expect(airportLocker.derivedFunctionSignals).toEqual(
      expect.arrayContaining([
        "breaker.emergency_search",
        "breaker.search_during_encounter",
        "setup.install_support",
        "setup.search",
      ]),
    );
    expect(airportLocker.derivedStrategyAnchors).toEqual([
      "runner.breaker_search",
    ]);
    expect(JSON.stringify(airportLocker)).not.toMatch(
      /actualStackOrder|hiddenCards|privatePayload|cardInstances/,
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
