import { describe, expect, it } from "vitest";

import { createAiHintsByCard } from "../ai-hints";
import {
  corpArchivesToHqOperationProfile,
  corpConditionalScoreCreditProfile,
  corpDirectTagOperationProfile,
  corpDefinitionHasTraceSource,
  corpDefinitionHasTagSource,
  corpDefinitionHasTraceTagSource,
  corpHostedCreditBankProfile,
  corpImmediateEconomyGainFromHint,
  corpScoreConversionProfile,
  corpTaggedDamagePayoffProfile,
  corpTaggedCreditDenialOperationProfile,
  corpTaggedMeatDamageOperationProfile,
  corpTraceTagSourceProfile,
} from "./corp-canonical-card-facts";

const hints = createAiHintsByCard();

describe("canonical Corp card facts", () => {
  it("reads the complete Archives-to-HQ choice contract from CardSpec mechanics", () => {
    expect(
      corpArchivesToHqOperationProfile("onr_v1_296_off-site-backups"),
    ).toMatchObject({
      capabilityKey: "corp_utility_corp_archives_to_hq",
      maxSelections: 1,
      visibility: "hidden_info_barrier",
    });
    expect(
      corpArchivesToHqOperationProfile("onr_classic_018_reclamation-project"),
    ).toMatchObject({
      capabilityKey: "return_archives_ice_to_hq",
      maxSelections: "all",
      filterCardType: "ice",
      visibility: "hidden_info_barrier",
    });
    expect(
      corpArchivesToHqOperationProfile("onr_v1_281_accounts-receivable"),
    ).toBeUndefined();
  });

  it("reads conditional score thresholds and hosted banks from CardSpec mechanics", () => {
    expect(
      corpConditionalScoreCreditProfile("onr_v1_196_corporate-war"),
    ).toEqual({ threshold: 12, gainAmount: 12 });
    expect(
      corpConditionalScoreCreditProfile("onr_v1_201_foetal-ai"),
    ).toBeUndefined();

    expect(
      corpHostedCreditBankProfile("onr_v1_309_bbs-whispering-campaign"),
    ).toEqual({
      poolCredits: 16,
      payoutCredits: 2,
      payoutActionCost: 1,
      payoutTiming: "action",
    });
    expect(
      corpHostedCreditBankProfile("onr_v1_165_junkyard-bbs"),
    ).toBeUndefined();
    expect(
      corpHostedCreditBankProfile("onr_v1_326_holovid-campaign"),
    ).toEqual({
      poolCredits: 12,
      payoutCredits: 1,
      payoutActionCost: 0,
      payoutTiming: "start_of_corp_turn",
    });
  });

  it("recognizes immediate Corp economy without requiring a historical signal", () => {
    expect(
      corpImmediateEconomyGainFromHint(
        hints.get("onr_v1_281_accounts-receivable"),
      ),
    ).toBe(9);
    expect(
      corpImmediateEconomyGainFromHint(hints.get("onr_v1_295_night-shift")),
    ).toBe(2);
    expect(
      corpImmediateEconomyGainFromHint(
        hints.get("onr_v1_309_bbs-whispering-campaign"),
      ),
    ).toBeUndefined();
  });

  it("distinguishes trace sources and tagged-damage payoffs mechanically", () => {
    expect(corpDefinitionHasTraceSource("onr_proteus_050_manhunt")).toBe(true);
    expect(corpDefinitionHasTraceSource("onr_v1_221_asp")).toBe(true);
    expect(corpDefinitionHasTraceSource("onr_v1_196_corporate-war")).toBe(
      false,
    );
    expect(
      corpDefinitionHasTraceTagSource("onr_v1_284_chance-observation"),
    ).toBe(true);
    expect(
      corpTraceTagSourceProfile("onr_v1_284_chance-observation"),
    ).toMatchObject({ capabilityKey: "abilities_on_play_trace" });
    expect(corpDefinitionHasTraceTagSource("onr_v1_221_asp")).toBe(false);
    expect(corpDefinitionHasTagSource("onr_v1_284_chance-observation")).toBe(
      true,
    );
    expect(corpDefinitionHasTagSource("onr_v1_302_scorched-earth")).toBe(false);
    expect(
      corpDirectTagOperationProfile("onr_proteus_048_data-sifters"),
    ).toMatchObject({ capabilityKey: "on_play_tag_after_runner_trashed_node" });
    expect(
      corpTaggedCreditDenialOperationProfile("onr_v1_285_closed-accounts"),
    ).toMatchObject({ capabilityKey: "abilities_on_play_lose_credits" });

    expect(corpTaggedDamagePayoffProfile("onr_v1_327_i-got-a-rock")).toEqual({
      requiredRunnerTags: 2,
      agendaPointCost: 3,
      damageType: "meat",
      damageAmount: 15,
    });
    expect(
      corpTaggedDamagePayoffProfile("onr_proteus_050_manhunt"),
    ).toBeUndefined();
    expect(
      corpTaggedMeatDamageOperationProfile("onr_v1_302_scorched-earth"),
    ).toMatchObject({
      capabilityKey: "abilities_on_play_damage",
      damageAmount: 4,
    });
    expect(
      corpTaggedMeatDamageOperationProfile("onr_v1_284_chance-observation"),
    ).toBeUndefined();
  });

  it("classifies mechanical score conversions and rejects ordinary economy", () => {
    expect(
      corpScoreConversionProfile("onr_v1_300_project-consultants"),
    ).toMatchObject({ placesAdvancementCounters: true });
    expect(
      corpScoreConversionProfile("onr_v1_297_overtime-incentives"),
    ).toMatchObject({ gainsCorpActions: true });
    expect(corpScoreConversionProfile("onr_v1_347_vapor-ops")).toMatchObject({
      movesAdvancementCounters: true,
    });
    expect(
      corpScoreConversionProfile("onr_v1_281_accounts-receivable"),
    ).toBeUndefined();
  });
});
