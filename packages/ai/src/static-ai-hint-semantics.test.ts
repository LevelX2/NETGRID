import { describe, expect, it } from "vitest";

import { buildActionCardSemanticProfilesByDefinitionId } from "./actions/action-card-semantic-profiles";
import { AI_HINTS_BY_CARD } from "./ai-hints";

const hints = [...AI_HINTS_BY_CARD.values()];
const hintById = new Map(hints.map((hint) => [hint.cardId, hint]));

describe("static AI hint semantics", () => {
  it("keeps one unique static record per active card", () => {
    expect(hints).toHaveLength(618);
    expect(hintById.size).toBe(hints.length);
  });

  it("stores tactic signals and strategy anchors directly on the card", () => {
    const hqInterface = hintById.get("onr_v1_129_hq-interface");
    const rex = hintById.get("onr_v1_264_rex");

    expect(hqInterface?.functionSignals).toContain("access.hq_multiaccess");
    expect(hqInterface?.strategyAnchors).toContain("runner.hq_pressure");
    expect(rex?.functionSignals).toContain("corp_ice.trace_source");
    expect(rex?.strategyAnchors).toContain("corp.ice_tax_glacier");
  });

  it("feeds action semantics from the same static fields", () => {
    const profiles = buildActionCardSemanticProfilesByDefinitionId();
    const hqInterface = profiles["onr_v1_129_hq-interface"];

    expect(hqInterface?.tacticSignals).toEqual(
      hintById.get("onr_v1_129_hq-interface")?.actionTacticSignals,
    );
    expect(hqInterface?.strategySupport).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          strategyId: "runner.hq_pressure",
          role: "payoff_anchor",
        }),
      ]),
    );
  });

  it("keeps the ETR compatibility and effect semantics of the audited ICE", () => {
    for (const cardId of [
      "onr_v1_232_crystal-wall",
      "onr_v1_252_keeper",
      "onr_v1_261_quandary",
    ]) {
      const hint = hintById.get(cardId);
      expect(hint?.tacticSignals).toContain("corp_ice.end_run");
      expect(hint?.functionSignals).toEqual(
        expect.arrayContaining(["corp_ice.end_run", "ice.etr"]),
      );
      expect(hint?.actionTacticSignals).toEqual(
        expect.arrayContaining(["effect:etr", "effect:remote_protection"]),
      );
    }
  });

  it("keeps every stored semantic array duplicate-free", () => {
    for (const hint of hints) {
      expect(new Set(hint.tacticSignals ?? []).size, hint.cardId).toBe(
        hint.tacticSignals?.length ?? 0,
      );
      expect(new Set(hint.functionSignals ?? []).size, hint.cardId).toBe(
        hint.functionSignals?.length ?? 0,
      );
      expect(new Set(hint.strategyAnchors ?? []).size, hint.cardId).toBe(
        hint.strategyAnchors?.length ?? 0,
      );
    }
  });
});
