import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "./action-card-semantic-profiles";

describe("ActionCardSemanticProfiles", () => {
  it("keeps legacy hint role fields as compatibility signals", () => {
    const profiles = Object.values(
      buildActionCardSemanticProfilesByDefinitionId(),
    );
    const tacticCompatibilityLeaks = profiles.flatMap((profile) =>
      profile.tacticSignals.filter(legacyCompatibilitySignal),
    );
    const compatibilitySignals = profiles.flatMap(
      (profile) => profile.compatibilitySignals ?? [],
    );

    expect(tacticCompatibilityLeaks).toEqual([]);
    expect(compatibilitySignals.some(legacyCompatibilitySignal)).toBe(true);
  });

  it("keeps card-wide static hint signals separate from action signals", () => {
    const profiles = buildActionCardSemanticProfilesByDefinitionId();
    const researchBunker = profiles["onr_proteus_072_research-bunker"];

    expect(researchBunker?.compatibilitySignals).toEqual(
      expect.arrayContaining([
        "remote.agenda_difficulty_discount",
        "score.agenda_difficulty_discount",
        "score.research_difficulty_discount",
      ]),
    );
    expect(researchBunker?.tacticSignals).not.toContain(
      "remote.agenda_difficulty_discount",
    );
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
    expect(profiles["onr_v1_043_mystery-box"]?.compatibilitySignals).toEqual(
      expect.arrayContaining([
        "line_support:runner.search.breaker",
        "strategic_role:engine_anchor",
      ]),
    );
  });

  it("retains static multiaccess without inventing capability-bound strategy pairs", () => {
    const profiles = buildActionCardSemanticProfilesByDefinitionId();
    const hqInterface = profiles["onr_v1_129_hq-interface"];
    const rndInterface = profiles["onr_v1_139_r-and-d-interface"];

    expect(hqInterface?.tacticSignals).toContain("access.hq_multiaccess");
    expect(hqInterface?.functionalEffects).toContainEqual(
      expect.objectContaining({
        kind: "multiaccess",
        scope: "hq",
        amount: 1,
      }),
    );
    expect(hqInterface?.strategySupport).toEqual([]);

    expect(rndInterface?.tacticSignals).toContain("access.rnd_multiaccess");
    expect(rndInterface?.functionalEffects).toContainEqual(
      expect.objectContaining({
        kind: "multiaccess",
        scope: "rnd",
        amount: 1,
      }),
    );
    expect(rndInterface?.strategySupport).toEqual([]);
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

  it("keeps Runner agenda-point conversion distinct from Corp scoring", () => {
    const profiles = buildActionCardSemanticProfilesByDefinitionId();
    const desperate = profiles["onr_v1_083_desperate-competitor"];

    expect(desperate?.tacticSignals).toContain(
      "runner.agenda_point_conversion",
    );
    expect(desperate?.tacticSignals).not.toContain("corp.score_progress");
  });

  it("preserves TKO's structured Runner action-loss signal", () => {
    const profiles = buildActionCardSemanticProfilesByDefinitionId();

    expect(profiles["onr_v1_271_tko-2-0"]?.tacticSignals).toContain(
      "corp_ice.runner_action_loss",
    );
  });

  it("retains delayed credit destinations as structured effect targets", () => {
    const profiles = buildActionCardSemanticProfilesByDefinitionId();

    expect(profiles["onr_v1_174_rigged-investments"]?.effectTargets).toEqual(
      expect.arrayContaining([
        "economy.installment_credit",
        "economy.turn_start_credit",
      ]),
    );
  });

  it("retains the complete structured effect contract from the active hint", () => {
    const profiles = buildActionCardSemanticProfilesByDefinitionId();

    expect(
      profiles["onr_v1_309_bbs-whispering-campaign"]?.functionalEffects,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "finite_economy_pool",
          timing: "on_rez",
          scope: "corp",
          resource: "credits",
          amount: 16,
          economyMode: "fixed_pool",
          target: "economy.hosted_credit_bank",
        }),
        expect.objectContaining({
          kind: "action_economy",
          timing: "action",
          scope: "corp",
          resource: "credits",
          amount: 2,
          economyMode: "liquid_payout",
          target: "economy.hosted_credit_cashout",
        }),
      ]),
    );
  });

  it("joins Blood Cat trace semantics from its canonical capability", () => {
    const profiles = buildActionCardSemanticProfilesByDefinitionId();
    const abilityId =
      "onr_v1_310_blood-cat:abilities_activated_corp_main_trace";
    const action = {
      actionId: "blood-cat-trace",
      side: "corp",
      type: "activated_card_ability",
      label: "Blood Cat: Trace 5 starten",
      source: "blood-cat-instance",
      timingPoint: "corp_action.main",
      costs: [{ clicks: 1 }],
      targetRequirements: [],
      visibility: "public",
      expiresAtStateVersion: 1,
      abilityRef: {
        sourceCardInstanceId: "blood-cat-instance",
        sourceAbilityId: abilityId,
      },
      payload: {
        cardId: "blood-cat-instance",
        sourceDefinitionId: "onr_v1_310_blood-cat",
        cardImplementationCapabilityBindingKind: "card_spec_capability_key",
        cardImplementationAbilityId: abilityId,
        cardImplementationAbilityKey: "abilities_activated_corp_main_trace",
      },
    } satisfies LegalAction;

    const [candidate] = buildActionSemanticCandidates({
      legalActions: [action],
      observerSide: "corp",
      stateVersion: 1,
      cardSemanticProfilesByDefinitionId: profiles,
    });

    expect(candidate).toMatchObject({
      abilityId,
      abilityKey: "abilities_activated_corp_main_trace",
      abilityBindingMethod: "canonical_capability_id",
    });
    expect(candidate?.functionalEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "trace", timing: "action" }),
        expect.objectContaining({
          kind: "tag_source",
          timing: "action",
          amount: 1,
        }),
      ]),
    );
    expect(candidate?.actionTacticSignals).toEqual(
      expect.arrayContaining(["trace.source", "tag.source"]),
    );
    expect(candidate?.projectionIssues).not.toContain("ability_unresolved");
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
