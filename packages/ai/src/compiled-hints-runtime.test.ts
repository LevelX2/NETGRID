import { describe, expect, it } from "vitest";
import activeAiHintsData from "../../../data/ai/ai-card-hints-active.json";
import compiledAiHintsData from "../../../data/ai/ai-card-hints-compiled.json";
import {
  classifyCorpFutureRunIceDefinitionId,
  getStructuredBreakerProfileForCard,
  getStructuredRemoteRoleForCard,
  classifyTagPunishPayoffFromOntology,
} from "./index";
import { createAiHintsByCard } from "./ai-hints";

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

describe("compiled AI hints runtime pilot", () => {
  it("loads the 410-card compiled hint artifact at runtime", () => {
    const hints = createAiHintsByCard();
    expect(compiledAiHintsData.cards).toHaveLength(410);
    expect(hints.size).toBe(410);
    expect(activeAiHintsData.cards).toHaveLength(410);
    for (const cardId of PILOT_IDS) {
      expect(hints.get(cardId)?.runtimeCompiledHintPilot).toBe(true);
    }
  });

  it("keeps non-pilot legacy fallback entries bit-identical", () => {
    const active = activeAiHintsData.cards.find(
      (hint) => hint.cardId === "corp_identity_001",
    );
    const compiled = compiledAiHintsData.cards.find(
      (hint) => hint.cardId === "corp_identity_001",
    );
    expect(compiled).toEqual(active);
  });

  it("keeps pilot legacy fields stable while adding generated facts", () => {
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
  });

  it("serves compiled future-encounter facts to ICE-ordering classification", () => {
    expect(classifyCorpFutureRunIceDefinitionId("onr_v1_222_ball-and-chain")).toBe(
      "ball_and_chain",
    );
    expect(classifyCorpFutureRunIceDefinitionId("onr_v1_225_canis-major")).toBe(
      "canis",
    );
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
});
