import { describe, expect, it } from "vitest";
import {
  buildActionCardSemanticProfilesByDefinitionId,
  strategySupportRoleForSignal,
} from "./action-card-semantic-profiles";

describe("ActionCardSemanticProfiles", () => {
  it("keeps legacy hint role fields as compatibility signals", () => {
    const profiles = Object.values(buildActionCardSemanticProfilesByDefinitionId());
    const tacticCompatibilityLeaks = profiles.flatMap((profile) =>
      profile.tacticSignals.filter(legacyCompatibilitySignal),
    );
    const compatibilitySignals = profiles.flatMap(
      (profile) => profile.compatibilitySignals ?? [],
    );

    expect(tacticCompatibilityLeaks).toEqual([]);
    expect(compatibilitySignals.some(legacyCompatibilitySignal)).toBe(true);
  });

  it("does not generate StrategySupportPairs from broad support or legacy hint anchors", () => {
    const profiles = buildActionCardSemanticProfilesByDefinitionId();

    for (const cardId of [
      "simple_draw_event",
      "simple_economy_event",
      "onr_v1_043_mystery-box",
    ]) {
      expect(profiles[cardId]?.strategySupport ?? []).toEqual([]);
    }
    expect(
      profiles["onr_v1_043_mystery-box"]?.compatibilitySignals,
    ).toEqual(
      expect.arrayContaining([
        "line_support:runner.search.breaker",
        "strategic_role:engine_anchor",
      ]),
    );
  });

  it("creates qualified StrategySupportPairs from reviewed multiaccess payoff signals", () => {
    const profiles = buildActionCardSemanticProfilesByDefinitionId();
    const hqInterface = profiles["onr_v1_129_hq-interface"];
    const rndInterface = profiles["onr_v1_139_r-and-d-interface"];

    expect(hqInterface?.tacticSignals).toContain("access.hq_multiaccess");
    expect(hqInterface?.strategySupport).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          strategyId: "runner.hq_pressure",
          role: "payoff_anchor",
          confidence: "high",
          evidence: "tactic_signal_anchor:access.hq_multiaccess",
        }),
        expect.objectContaining({
          strategyId: "runner.interface_closeout",
          role: "payoff_anchor",
          confidence: "high",
          evidence: "tactic_signal_anchor:access.hq_multiaccess",
        }),
      ]),
    );

    expect(rndInterface?.tacticSignals).toContain("access.rnd_multiaccess");
    expect(rndInterface?.strategySupport).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          strategyId: "runner.rnd_pressure",
          role: "payoff_anchor",
          confidence: "high",
          evidence: "tactic_signal_anchor:access.rnd_multiaccess",
        }),
        expect.objectContaining({
          strategyId: "runner.interface_closeout",
          role: "payoff_anchor",
          confidence: "high",
          evidence: "tactic_signal_anchor:access.rnd_multiaccess",
        }),
      ]),
    );
    expect(
      [...(hqInterface?.strategySupport ?? []), ...(rndInterface?.strategySupport ?? [])],
    ).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ evidence: "ai_hint_semantic_profile" }),
      ]),
    );
  });

  it("does not turn generic scored-agenda actions into score closeout signals", () => {
    const profiles = buildActionCardSemanticProfilesByDefinitionId();
    const netwatch = profiles["onr_v1_207_netwatch-operations-office"];

    expect(netwatch?.tacticSignals).toEqual(
      expect.arrayContaining([
        "effect:scored_agenda_action",
        "corp.score_progress",
      ]),
    );
    expect(netwatch?.tacticSignals).not.toContain("corp.score_closeout");
  });

  it("matches StrategySupportPair payoff roles by bounded signal segments", () => {
    expect(strategySupportRoleForSignal("access.hq_multiaccess")).toBe(
      "payoff_anchor",
    );
    expect(
      strategySupportRoleForSignal("access.hq_multiaccessory_noise"),
    ).toBe("anchor_evidence");
  });
});

function legacyCompatibilitySignal(signal: string): boolean {
  return (
    signal.startsWith("role:") ||
    signal.startsWith("plan_role:") ||
    signal.startsWith("line_support:") ||
    signal.startsWith("strategic_role:")
  );
}
