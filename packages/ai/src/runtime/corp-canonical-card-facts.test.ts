import { describe, expect, it } from "vitest";

import { createAiHintsByCard } from "../ai-hints";
import {
  corpArchivesToHqOperationProfile,
  corpDirectTagOperationProfile,
  corpDefinitionHasTraceSource,
  corpDefinitionHasTagSource,
  corpDefinitionHasTraceTagSource,
  corpScoreConversionProfile,
  corpTaggedDamagePayoffProfile,
  corpTaggedCreditDenialOperationProfile,
  corpTaggedMeatDamageOperationProfile,
  corpTraceTagSourceProfile,
  corpPublicFixedOffServerRunProfiles,
} from "./corp-canonical-card-facts";
import {
  corpConditionalScoreCreditProfile,
  corpHostedCreditBankProfile,
  corpScoreHostedCreditPayoutProfile,
  corpImmediateEconomyGainFromHint,
} from "./corp-canonical-credit-facts";

const hints = createAiHintsByCard();

describe("canonical Corp card facts", () => {
  it("includes declarative encounter-tag utilities without making the conditional operation live", () => {
    expect(corpDefinitionHasTagSource(518)).toBe(true);
    expect(corpDefinitionHasTagSource(519)).toBe(false);
    expect(corpDefinitionHasTagSource(306)).toBe(false);
  });
  it("certifies only a fixed public reusable off-server access path", () => {
    expect(
      corpPublicFixedOffServerRunProfiles(
        274,
      ),
    ).toEqual([{ entryServerId: "archives", accessServerId: "hq" }]);
    for (const definitionId of [
      undefined,
      "unknown",
      306,
      323,
      399,
      251,
      464,
    ]) {
      expect(corpPublicFixedOffServerRunProfiles(definitionId)).toEqual([]);
    }
  });
  it("distinguishes a plain scored credit pool from installed banks and conditional score rewards", () => {
    expect(
      corpScoreHostedCreditPayoutProfile(421),
    ).toEqual({ poolCredits: 12, payoutCredits: 3 });
    expect(
      corpScoreHostedCreditPayoutProfile(521),
    ).toBeUndefined();
    expect(
      corpScoreHostedCreditPayoutProfile(408),
    ).toBeUndefined();
  });
  it("reads the complete Archives-to-HQ choice contract from CardSpec mechanics", () => {
    expect(
      corpArchivesToHqOperationProfile(508),
    ).toMatchObject({
      capabilityKey: "corp_utility_corp_archives_to_hq",
      maxSelections: 1,
      visibility: "hidden_info_barrier",
    });
    expect(
      corpArchivesToHqOperationProfile(22),
    ).toMatchObject({
      capabilityKey: "return_archives_ice_to_hq",
      maxSelections: "all",
      filterCardType: "ice",
      visibility: "hidden_info_barrier",
    });
    expect(
      corpArchivesToHqOperationProfile(493),
    ).toBeUndefined();
  });

  it("reads conditional score thresholds and hosted banks from CardSpec mechanics", () => {
    expect(
      corpConditionalScoreCreditProfile(408),
    ).toEqual({ threshold: 12, gainAmount: 12 });
    expect(
      corpConditionalScoreCreditProfile("onr_v1_201_foetal-ai"),
    ).toBeUndefined();

    expect(
      corpHostedCreditBankProfile(521),
    ).toEqual({
      poolCredits: 16,
      payoutCredits: 2,
      payoutActionCost: 1,
      payoutTiming: "action",
    });
    expect(
      corpHostedCreditBankProfile(377),
    ).toBeUndefined();
    expect(corpHostedCreditBankProfile(538)).toEqual({
      poolCredits: 12,
      payoutCredits: 1,
      payoutActionCost: 0,
      payoutTiming: "start_of_corp_turn",
    });
  });

  it("recognizes immediate Corp economy without requiring a historical signal", () => {
    expect(
      corpImmediateEconomyGainFromHint(
        hints.get(493),
      ),
    ).toBe(9);
    expect(
      corpImmediateEconomyGainFromHint(hints.get(507)),
    ).toBe(2);
    expect(
      corpImmediateEconomyGainFromHint(
        hints.get(521),
      ),
    ).toBeUndefined();
  });

  it("distinguishes trace sources and tagged-damage payoffs mechanically", () => {
    expect(corpDefinitionHasTraceSource(108)).toBe(true);
    expect(corpDefinitionHasTraceSource(433)).toBe(true);
    expect(corpDefinitionHasTraceSource(408)).toBe(
      false,
    );
    expect(
      corpDefinitionHasTraceTagSource(496),
    ).toBe(true);
    expect(
      corpTraceTagSourceProfile(496),
    ).toMatchObject({ capabilityKey: "abilities_on_play_trace" });
    expect(corpDefinitionHasTraceTagSource(433)).toBe(false);
    expect(corpDefinitionHasTagSource(496)).toBe(
      true,
    );
    expect(corpDefinitionHasTagSource(514)).toBe(false);
    expect(
      corpDirectTagOperationProfile(106),
    ).toMatchObject({ capabilityKey: "on_play_tag_after_runner_trashed_node" });
    expect(
      corpDirectTagOperationProfile(518),
    ).toMatchObject({
      capabilityKey: "corp_utility_encounter_tag",
      sourceCapabilityId: "518:corp_utility_encounter_tag",
    });
    expect(
      corpTaggedCreditDenialOperationProfile(497),
    ).toMatchObject({ capabilityKey: "abilities_on_play_lose_credits" });

    expect(corpTaggedDamagePayoffProfile(539)).toEqual({
      requiredRunnerTags: 2,
      agendaPointCost: 3,
      damageType: "meat",
      damageAmount: 15,
    });
    expect(
      corpTaggedDamagePayoffProfile(108),
    ).toBeUndefined();
    expect(
      corpTaggedMeatDamageOperationProfile(514),
    ).toMatchObject({
      capabilityKey: "abilities_on_play_damage",
      damageAmount: 4,
    });
    expect(
      corpTaggedMeatDamageOperationProfile(496),
    ).toBeUndefined();
  });

  it("classifies mechanical score conversions and rejects ordinary economy", () => {
    expect(
      corpScoreConversionProfile(512),
    ).toMatchObject({ placesAdvancementCounters: true });
    expect(
      corpScoreConversionProfile(509),
    ).toMatchObject({ gainsCorpActions: true });
    expect(corpScoreConversionProfile(559)).toMatchObject({
      movesAdvancementCounters: true,
    });
    expect(
      corpScoreConversionProfile(493),
    ).toBeUndefined();
  });
});
