import type { CardDefinitionId } from "@netgrid/shared";
import { corporateCoupImplementation } from "./onr-v1/corp/agendas/corporate-coup";
import { marineArcologyImplementation } from "./onr-v1/corp/agendas/marine-arcology";
import { onCallSoloTeamImplementation } from "./onr-v1/corp/agendas/on-call-solo-team";
import { politicalCoupImplementation } from "./onr-v1/corp/agendas/political-coup";
import { politicalOverthrowImplementation } from "./onr-v1/corp/agendas/political-overthrow";
import { strikeForceKaliImplementation } from "./onr-v1/corp/agendas/strike-force-kali";
import { bbsWhisperingCampaignImplementation } from "./onr-v1/corp/assets/bbs-whispering-campaign";
import { dataMasonsHostingImplementation } from "./onr-v1/corp/assets/data-masons-hosting";
import { encoderIncImplementation } from "./onr-v1/corp/assets/encoder-inc";
import { esaContractImplementation } from "./onr-v1/corp/assets/esa-contract";
import { fortressArchitectsImplementation } from "./onr-v1/corp/assets/fortress-architects";
import { skaldervikenSaBetaTestSiteImplementation } from "./onr-v1/corp/assets/skalderviken-sa-beta-test-site";
import { soloSquadImplementation } from "./onr-v1/corp/assets/solo-squad";
import { southAfricanMiningCorpImplementation } from "./onr-v1/corp/assets/south-african-mining-corp";
import { rockerboyPromotionImplementation } from "./onr-v1/corp/assets/rockerboy-promotion";
import { accountsReceivableImplementation } from "./onr-v1/corp/operations/accounts-receivable";
import { annualReviewsImplementation } from "./onr-v1/corp/operations/annual-reviews";
import { closedAccountsImplementation } from "./onr-v1/corp/operations/closed-accounts";
import { datapoolByZetatechImplementation } from "./onr-v1/corp/operations/datapool-by-zetatech";
import { dayShiftImplementation } from "./onr-v1/corp/operations/day-shift";
import { efficiencyExpertsImplementation } from "./onr-v1/corp/operations/efficiency-experts";
import { netwatchCreditVoucherImplementation } from "./onr-v1/corp/operations/netwatch-credit-voucher";
import { nightShiftImplementation } from "./onr-v1/corp/operations/night-shift";
import { punitiveCounterstrikeImplementation } from "./onr-v1/corp/operations/punitive-counterstrike";
import { scorchedEarthImplementation } from "./onr-v1/corp/operations/scorched-earth";
import { urbanRenewalImplementation } from "./onr-v1/corp/operations/urban-renewal";
import { jerusalemCityGridImplementation } from "./onr-v1/corp/upgrades/jerusalem-city-grid";
import { bodyweightSyntheticBloodImplementation } from "./onr-v1/runner/preps/bodyweight-synthetic-blood";
import { jackNJoeImplementation } from "./onr-v1/runner/preps/jack-n-joe";
import { livewiresContactsImplementation } from "./onr-v1/runner/preps/livewires-contacts";
import { scoreImplementation } from "./onr-v1/runner/preps/score";
import { newsgroupFilterImplementation } from "./onr-v1/runner/programs/newsgroup-filter";
import { shortTermContractImplementation } from "./onr-v1/runner/resources/short-term-contract";
import { siliconSaloonFranchiseImplementation } from "./onr-v1/runner/resources/silicon-saloon-franchise";
import type { CardImplementationDefinition } from "./types";

export const CARD_IMPLEMENTATIONS = [
  bodyweightSyntheticBloodImplementation,
  jackNJoeImplementation,
  livewiresContactsImplementation,
  newsgroupFilterImplementation,
  scoreImplementation,
  shortTermContractImplementation,
  siliconSaloonFranchiseImplementation,
  corporateCoupImplementation,
  marineArcologyImplementation,
  onCallSoloTeamImplementation,
  politicalCoupImplementation,
  politicalOverthrowImplementation,
  strikeForceKaliImplementation,
  accountsReceivableImplementation,
  annualReviewsImplementation,
  closedAccountsImplementation,
  datapoolByZetatechImplementation,
  dayShiftImplementation,
  efficiencyExpertsImplementation,
  netwatchCreditVoucherImplementation,
  nightShiftImplementation,
  punitiveCounterstrikeImplementation,
  scorchedEarthImplementation,
  urbanRenewalImplementation,
  bbsWhisperingCampaignImplementation,
  dataMasonsHostingImplementation,
  encoderIncImplementation,
  esaContractImplementation,
  fortressArchitectsImplementation,
  skaldervikenSaBetaTestSiteImplementation,
  soloSquadImplementation,
  rockerboyPromotionImplementation,
  southAfricanMiningCorpImplementation,
  jerusalemCityGridImplementation,
] as const satisfies readonly CardImplementationDefinition[];

export const CARD_IMPLEMENTATIONS_BY_DEFINITION_ID: Partial<
  Record<CardDefinitionId, CardImplementationDefinition>
> = Object.fromEntries(
  CARD_IMPLEMENTATIONS.map((implementation) => [
    implementation.cardDefinitionId,
    implementation,
  ]),
);

export function cardImplementationForDefinitionId(
  definitionId: CardDefinitionId,
): CardImplementationDefinition | undefined {
  return CARD_IMPLEMENTATIONS_BY_DEFINITION_ID[definitionId];
}
