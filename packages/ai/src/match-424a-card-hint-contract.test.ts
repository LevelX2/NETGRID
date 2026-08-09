import { describe, expect, it } from "vitest";
import { createAiHintsByCard } from "./ai-hints";

type HintEffect = {
  kind: string;
  timing: string;
  scope: string;
  resource?: string;
  amount?: number;
  target?: string;
};

type HintCard = {
  cardId: string;
  roles: string[];
  planRoles: string[];
  requiredMechanics?: string[];
  valueHints?: Record<string, number>;
  riskTags?: string[];
  effects?: HintEffect[];
  conditions?: Array<{ kind: string }>;
  targetProfiles?: Array<{
    purpose?: string;
    hiddenInfoPolicy?: string;
  }>;
};

const hintSources = ["effective-ai-hint-readmodel"] as const;

describe.each(hintSources)("match 424A card semantics in %s", (source) => {
  const hints = readHints(source);

  it("keeps Force Shield as prevention setup rather than economy recovery", () => {
    const hint = card(hints, "onr_v1_028_force-shield");

    expect(hint.roles).toEqual(
      expect.arrayContaining(["program", "damage_prevention", "rig_defense"]),
    );
    expect(hint.planRoles).toContain("build_rig");
    expect(hint.planRoles).not.toContain("recover_economy");
    expect(hint.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "damage_prevention",
          timing: "prevention_window",
          amount: 2,
        }),
      ]),
    );
  });

  it("records Core Command's successful-HQ-run prerequisite precisely", () => {
    const hint = card(hints, "onr_v1_080_core-command-jettison-ice");

    expect(hint.conditions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "requires_successful_hq_run" }),
        expect.objectContaining({ kind: "requires_rezzed_ice" }),
      ]),
    );
    expect(hint.conditions).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "requires_successful_run" }),
      ]),
    );
  });

  it("models Broker as a click-driven credit bank, not trash recursion", () => {
    const hint = card(hints, "onr_v1_154_broker");

    expect(hint.roles).toEqual(expect.arrayContaining(["economy", "resource"]));
    expect(hint.planRoles).toEqual(
      expect.arrayContaining([
        "recover_economy",
        "click_for_credits_when_safe",
      ]),
    );
    expect(hint.planRoles).not.toContain("recover_key_card");
    expect(hint.requiredMechanics).toEqual(
      expect.arrayContaining([
        "gain_credit",
        "bit_depot",
        "take_click_ability",
      ]),
    );
    expect(hint.requiredMechanics).not.toContain("public_trash_to_hand");
    expect(hint.valueHints).toMatchObject({ economy: 3 });
    expect(hint.valueHints).not.toHaveProperty("cardFlow");
    expect(hint.riskTags).not.toContain("trash_top_card_dependency");
    expect(hint.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "economy",
          target: "economy.temporary_resource_bank",
        }),
      ]),
    );
  });

  it("keeps Inside Job's first-ICE bypass semantics", () => {
    const hint = card(hints, "onr_v1_094_inside-job");

    expect(hint.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "future_run_effect",
          target: "make_run",
        }),
        expect.objectContaining({
          kind: "future_encounter_effect",
          target: "bypass_first_ice",
        }),
      ]),
    );
  });

  it("keeps SeeYa and Forged Activation Orders on legal visible targets", () => {
    const seeYa = card(hints, "onr_v1_058_seeya");
    const forged = card(hints, "onr_v1_086_forged-activation-orders");

    expect(seeYa.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "expose_info",
          target: "installed_card",
        }),
      ]),
    );
    expect(seeYa.targetProfiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          purpose: "expose_installed_card",
          hiddenInfoPolicy: "legal_targets_only",
        }),
      ]),
    );
    expect(forged.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "ice_trash",
          target: "rez_or_trash_choice",
        }),
      ]),
    );
  });

  it("keeps WuTech as memory support and Junkyard as recovery utility", () => {
    const wuTech = card(hints, "onr_v1_145_wutech-mem-chip");
    const junkyard = card(hints, "onr_v1_165_junkyard-bbs");

    expect(wuTech.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "global_modifier",
          resource: "memory",
          amount: 1,
        }),
      ]),
    );
    expect(junkyard.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "search",
          target: "setup.recovery",
        }),
      ]),
    );
    expect(junkyard.roles).toEqual(
      expect.arrayContaining(["trash_recovery", "utility_resource"]),
    );
    expect(junkyard.planRoles).not.toContain("economy");
    expect(junkyard.valueHints?.economy).toBeUndefined();
  });
});

function readHints(_source: string): HintCard[] {
  return [...createAiHintsByCard().values()] as HintCard[];
}

function card(hints: HintCard[], cardId: string): HintCard {
  const found = hints.find((hint) => hint.cardId === cardId);
  if (!found) throw new Error(`Missing AI hint ${cardId}`);
  return found;
}
