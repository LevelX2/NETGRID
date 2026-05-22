import { investmentFirmImplementation } from "../card-implementations/onr-v1/corp/assets/investment-firm";

export const INVESTMENT_FIRM_ASSET_CARD_ID =
  investmentFirmImplementation.cardDefinitionId;

export const CORP_ECONOMY_ASSET_CARD_IDS = new Set<string>([
]);

export const CORP_RECURRING_ASSET_CARD_IDS = new Set<string>([
  INVESTMENT_FIRM_ASSET_CARD_ID,
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

export const CORP_INSTALLED_ECONOMY_ACTION_PROFILES: EconomyActionProfile[] = [
  ...[...CORP_ECONOMY_ASSET_CARD_IDS]
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
