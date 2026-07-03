import { describe, expect, it } from "vitest";
import activeAiHintsData from "../../../data/ai/ai-card-hints-active.json";
import compiledAiHintsData from "../../../data/ai/ai-card-hints-compiled.json";
import fullCoverageReport from "../../../docs/reviews/ai/aufgabe-042-full-compiled-hint-coverage-report-2026-05-25.json";
import {
  classifyCorpFutureRunIcePlacementProfile,
  getStructuredBreakerProfileForCard,
  getStructuredRemoteRoleForCard,
  classifyTagPunishPayoffFromOntology,
  estimateStructuredBreakerCostForIce,
} from "./index";
import { createAiHintsByCard } from "./ai-hints";
import { breakerCardBlocksAccessReachability } from "./breaker-ontology-consumer";
import { canBreakerDefinitionBreakIce } from "./visible-run-analysis";

const PILOT_IDS = [
  "onr_v1_040_loony-goon",
  "onr_v1_039_krash",
  "onr_v1_059_self-modifying-code",
  "onr_v1_043_mystery-box",
  "onr_v1_057_scatter-shot",
  "onr_v1_309_bbs-whispering-campaign",
  "onr_v1_222_ball-and-chain",
  "onr_v1_225_canis-major",
  "onr_v1_302_scorched-earth",
  "onr_v1_366_red-herrings",
] as const;

const MECHANICAL_OVERLAY_FIELDS = [
  "effects",
  "conditions",
  "costProfile",
  "breakerProfile",
  "remoteRole",
  "targetProfiles",
  "aiSupportStatus",
  "roles",
  "planRoles",
] as const;

describe("compiled AI hints runtime full coverage", () => {
  it("loads the full compiled hint artifact at runtime", () => {
    const hints = createAiHintsByCard();
    expect(compiledAiHintsData.taskId).toBe("Aufgabe 042");
    expect(compiledAiHintsData.cards).toHaveLength(
      activeAiHintsData.cards.length,
    );
    expect(hints.size).toBe(activeAiHintsData.cards.length);
    expect(fullCoverageReport.activeHintCount).toBeLessThanOrEqual(
      activeAiHintsData.cards.length,
    );
    expect(fullCoverageReport.generatedFactsCardCount).toBeGreaterThanOrEqual(
      305,
    );
  });

  it("keeps non-generated legacy fallback entries bit-identical", () => {
    const active = activeAiHintsData.cards.find(
      (hint) => hint.cardId === "corp_identity_001",
    );
    const compiled = compiledAiHintsData.cards.find(
      (hint) => hint.cardId === "corp_identity_001",
    );
    expect(compiled).toEqual(active);
  });

  it("does not drift aiSupportStatus for any active hint", () => {
    const activeByCard = new Map(
      activeAiHintsData.cards.map((hint) => [
        hint.cardId,
        hint.aiSupportStatus,
      ]),
    );
    for (const compiled of compiledAiHintsData.cards) {
      expect(compiled.aiSupportStatus).toBe(activeByCard.get(compiled.cardId));
    }
  });

  it("keeps generated-card legacy fields stable while adding structured facts", () => {
    const activeByCard = new Map(
      activeAiHintsData.cards.map((hint) => [hint.cardId, hint]),
    );
    const hints = createAiHintsByCard();
    for (const cardId of PILOT_IDS) {
      const active = activeByCard.get(cardId);
      const compiled = hints.get(cardId);
      expect(compiled).toBeDefined();
      expect(compiled?.cardId).toBe(active?.cardId);
      expect(compiled?.side).toBe(active?.side);
      expect(compiled?.cardType).toBe(active?.cardType);
      expect(compiled?.roles).toEqual(active?.roles);
      expect(compiled?.planRoles).toEqual(active?.planRoles);
      expect(compiled?.aiSupportStatus).toBe(active?.aiSupportStatus);
      expect(
        Boolean(
          compiled?.effects?.length ||
          compiled?.conditions?.length ||
          compiled?.breakerProfile ||
          compiled?.remoteRole ||
          compiled?.targetProfiles?.length,
        ),
      ).toBe(true);
    }
  });

  it("reports full-coverage classes and leaves remaining fallback cards explicit", () => {
    expect(fullCoverageReport.hardErrorCount).toBe(0);
    expect(fullCoverageReport.generatedFactsCardCount).toBeGreaterThanOrEqual(
      305,
    );
    expect(fullCoverageReport.legacyFallbackOnlyCount).toBeGreaterThanOrEqual(
      0,
    );
    expect(fullCoverageReport.blockedMissingImplementationCount).toBe(37);
    const classifiedTotal = Object.values(
      fullCoverageReport.coverageClassCounts,
    ).reduce((sum, count) => sum + count, 0);
    expect(classifiedTotal).toBe(fullCoverageReport.activeHintCount);
    expect(classifiedTotal).toBeLessThanOrEqual(activeAiHintsData.cards.length);
  });

  it("includes AI-supported Proteus cards in compiled runtime hints", () => {
    const activeProteusHints = activeAiHintsData.cards.filter((hint) =>
      hint.cardId.startsWith("onr_proteus_"),
    );
    const compiledByCard = new Map(
      compiledAiHintsData.cards.map((hint) => [hint.cardId, hint]),
    );
    const proteusCoverageCards = fullCoverageReport.cards.filter((card) =>
      card.cardId.startsWith("onr_proteus_"),
    );

    expect(activeProteusHints).toHaveLength(154);
    expect(proteusCoverageCards).toHaveLength(154);
    for (const active of activeProteusHints) {
      const compiled = compiledByCard.get(active.cardId);
      expect(compiled, active.cardId).toBeDefined();
      expect(compiled?.aiSupportStatus, active.cardId).toBe("ai_supported");
      expect(compiled?.side, active.cardId).toBe(active.side);
      expect(compiled?.cardType, active.cardId).toBe(active.cardType);
    }
  });

  it("copies overlay fields while keeping overlays free of mechanical fields", () => {
    const redHerrings = createAiHintsByCard().get("onr_v1_366_red-herrings");
    expect(redHerrings?.strategicNotes).toEqual(
      expect.arrayContaining([expect.any(String)]),
    );
    const serializedOverlays = JSON.stringify(redHerrings);
    for (const field of MECHANICAL_OVERLAY_FIELDS) {
      expect(serializedOverlays).not.toContain(`"overlay.${field}"`);
    }
  });

  it("serves compiled breaker profiles to runner breaker consumers", () => {
    expect(getStructuredBreakerProfileForCard("onr_v1_040_loony-goon")).toEqual(
      expect.objectContaining({
        coverage: ["sentry"],
        pumpCost: 1,
        breakCost: 1,
      }),
    );
    expect(getStructuredBreakerProfileForCard("onr_v1_039_krash")).toEqual(
      expect.objectContaining({
        coverage: ["universal"],
        pumpCost: 2,
        breakCost: 2,
      }),
    );
  });

  it("keeps Dropp emergency breaker hints out of access reachability consumers", () => {
    expect(getStructuredBreakerProfileForCard("onr_v1_019_dropp")).toEqual(
      expect.objectContaining({
        coverage: ["universal"],
        multiSubroutineBreak: true,
        sideEffects: ["ends_run_after_use"],
        restrictions: expect.arrayContaining([
          "not_access_enabling_breaker",
          "not_reachability_coverage",
          "break_ability_ends_run",
        ]),
      }),
    );
    expect(breakerCardBlocksAccessReachability("onr_v1_019_dropp")).toBe(true);
    expect(
      canBreakerDefinitionBreakIce("onr_v1_019_dropp", "onr_v1_237_data-wall"),
    ).toBe(false);
    expect(
      estimateStructuredBreakerCostForIce("onr_v1_019_dropp", {
        definitionId: "onr_v1_237_data-wall",
        strength: 0,
      }),
    ).toBeUndefined();
  });

  it("serves compiled runner search facts without Self-Modifying Code install discount", () => {
    const hints = createAiHintsByCard();
    const selfModifyingCode = hints.get("onr_v1_059_self-modifying-code");
    expect(selfModifyingCode?.effects).toContainEqual(
      expect.objectContaining({ kind: "search" }),
    );
    expect(selfModifyingCode?.effects).not.toContainEqual(
      expect.objectContaining({ kind: "install_discount" }),
    );
    expect(selfModifyingCode?.targetProfiles).toContainEqual(
      expect.objectContaining({
        zone: "stack",
        targetCardType: "program",
        installsTarget: true,
        installCost: "normal",
      }),
    );
  });

  it("serves compiled Mystery Box free-install search context", () => {
    const mysteryBox = createAiHintsByCard().get("onr_v1_043_mystery-box");
    expect(mysteryBox?.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "search" }),
        expect.objectContaining({ kind: "topdeck_info" }),
        expect.objectContaining({ kind: "install_discount" }),
      ]),
    );
    expect(mysteryBox?.targetProfiles).toContainEqual(
      expect.objectContaining({
        zone: "stack_top",
        targetCardType: "program",
        installsTarget: true,
        installCost: "free",
        oncePerRun: true,
      }),
    );
  });

  it("serves compiled remote-role and tag-punish facts to existing consumers", () => {
    expect(
      getStructuredRemoteRoleForCard("onr_v1_309_bbs-whispering-campaign"),
    ).toEqual(expect.objectContaining({ kind: "asset_economy" }));
    expect(getStructuredRemoteRoleForCard("onr_v1_366_red-herrings")).toEqual(
      expect.objectContaining({ kind: "agenda_steal_tax" }),
    );
    expect(
      classifyTagPunishPayoffFromOntology("onr_v1_302_scorched-earth"),
    ).toEqual(
      expect.objectContaining({
        payoff: true,
        requiresRunnerTagged: true,
      }),
    );
    const scorchedEarth = createAiHintsByCard().get(
      "onr_v1_302_scorched-earth",
    );
    expect(scorchedEarth?.effects).toContainEqual(
      expect.objectContaining({ kind: "tag_punish_payoff" }),
    );
    expect(scorchedEarth?.conditions).toContainEqual(
      expect.objectContaining({ kind: "requires_runner_tagged" }),
    );
  });

  it("serves compiled future-encounter facts to ICE-ordering classification", () => {
    expect(
      classifyCorpFutureRunIcePlacementProfile("onr_v1_222_ball-and-chain"),
    ).toBe("ball_and_chain");
    expect(
      classifyCorpFutureRunIcePlacementProfile("onr_v1_225_canis-major"),
    ).toBe("canis");
    for (const cardId of [
      "onr_v1_222_ball-and-chain",
      "onr_v1_225_canis-major",
    ]) {
      const hint = createAiHintsByCard().get(cardId);
      expect(hint?.effects).toContainEqual(
        expect.objectContaining({ kind: "future_encounter_effect" }),
      );
      expect(hint?.conditions).toContainEqual(
        expect.objectContaining({ kind: "requires_remaining_ice" }),
      );
    }
  });

  it("keeps compiled hints free of hidden-state and LegalAction fields", () => {
    const serialized = JSON.stringify(createAiHintsByCard());
    for (const field of [
      "cardInstances",
      "privatePayload",
      "fullGameState",
      "actualStackOrder",
      "actualRndOrder",
      "legalActions",
      "playerActions",
      "stateVersion",
      "stateHash",
      "actionId",
    ]) {
      expect(serialized).not.toContain(`"${field}"`);
    }
  });

  it("keeps expose, topdeck, HQ, and R&D info facts free of hidden-zone identities", () => {
    const infoCards = compiledAiHintsData.cards.filter((hint) =>
      (hint.effects ?? []).some((effect) =>
        ["expose_info", "topdeck_info", "hq_info"].includes(effect.kind),
      ),
    );
    expect(infoCards.length).toBeGreaterThan(0);
    for (const hint of infoCards) {
      const serialized = JSON.stringify(hint);
      expect(serialized).not.toContain("actualRndOrder");
      expect(serialized).not.toContain("actualStackOrder");
      expect(serialized).not.toContain("hiddenHqCards");
      expect(serialized).not.toContain("cardInstances");
    }
  });

  it("requires opponentSignals to be visible-evidence-only", () => {
    for (const hint of createAiHintsByCard().values()) {
      for (const signal of hint.opponentSignals ?? []) {
        expect(signal.visibleEvidenceOnly).toBe(true);
      }
    }
  });
});
