import { investmentFirmImplementation } from "../card-implementations/onr-v1/corp/assets/investment-firm";

export const INVESTMENT_FIRM_ASSET_CARD_ID =
  investmentFirmImplementation.cardDefinitionId;

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

export function corpInstalledEconomyActionProfileForDefinition(
  sourceDefinitionId: string,
): EconomyActionProfile | undefined {
  void sourceDefinitionId;
  return undefined;
}

export function corpInstalledEconomyActionProfileForPayload(
  sourceDefinitionId: string,
  payload: Record<string, unknown> | undefined,
): EconomyActionProfile | undefined {
  void sourceDefinitionId;
  void payload;
  return undefined;
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
