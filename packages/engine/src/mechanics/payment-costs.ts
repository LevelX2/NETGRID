export const INVESTMENT_FIRM_ASSET_CARD_ID = "onr_v1_329_investment-firm";

export const CORP_ECONOMY_ASSET_CARD_IDS = new Set([
  "onr_v1_311_braindance-campaign",
  "onr_v1_326_holovid-campaign",
  "onr_v1_337_rockerboy-promotion",
  "onr_v1_344_spinn-public-relations",
]);

export const CORP_RECURRING_ASSET_CARD_IDS = new Set([
  "onr_v1_311_braindance-campaign",
  INVESTMENT_FIRM_ASSET_CARD_ID,
  "onr_v1_344_spinn-public-relations",
]);

export type EconomyActionProfile = {
  profileId: string;
  sourceDefinitionId: string;
  side: "corp";
  abilityPayloadKey: "v1917AssetAbility" | "v1920AssetAbility";
  abilityPayloadValue: string;
  clickCost: number;
  creditCost: number;
  creditGain: number;
  trashSource?: boolean;
};

const SPINN_PUBLIC_RELATIONS_TAG_ASSET_CARD_ID = "onr_v1_344_spinn-public-relations";
export const CORP_INSTALLED_ECONOMY_ACTION_PROFILES: EconomyActionProfile[] = [
  ...[...CORP_ECONOMY_ASSET_CARD_IDS]
    .filter((sourceDefinitionId) => sourceDefinitionId !== SPINN_PUBLIC_RELATIONS_TAG_ASSET_CARD_ID)
    .map((sourceDefinitionId) => ({
      profileId: "v1917.corp_economy_asset_gain_2",
      sourceDefinitionId,
      side: "corp" as const,
      abilityPayloadKey: "v1917AssetAbility" as const,
      abilityPayloadValue: "gain_credits",
      clickCost: 1,
      creditCost: 0,
      creditGain: 2,
    })),
];

export function corpInstalledEconomyActionProfileForDefinition(
  sourceDefinitionId: string,
): EconomyActionProfile | undefined {
  return CORP_INSTALLED_ECONOMY_ACTION_PROFILES.find(
    (profile) => profile.sourceDefinitionId === sourceDefinitionId,
  );
}

export function corpInstalledEconomyActionProfileForPayload(
  sourceDefinitionId: string,
  payload: Record<string, unknown> | undefined,
): EconomyActionProfile | undefined {
  return CORP_INSTALLED_ECONOMY_ACTION_PROFILES.find(
    (profile) =>
      profile.sourceDefinitionId === sourceDefinitionId &&
      payload?.[profile.abilityPayloadKey] === profile.abilityPayloadValue,
  );
}

export function corpInstalledEconomyActionPayload(
  profile: EconomyActionProfile,
  cardId: string,
): Record<string, string | number | boolean> {
  return {
    cardId,
    [profile.abilityPayloadKey]: profile.abilityPayloadValue,
    gainCreditsAmount: profile.creditGain,
    ...(profile.trashSource ? { trashOnUse: true } : {}),
  };
}
