/**
 * Registers concrete CardImplementation definitions by card definition id.
 *
 * This file is a catalog only: it imports declarative card files and builds
 * lookup tables. It must not execute abilities, add coverage semantics, or
 * contain legacy resolver branches.
 */
import type { CardDefinitionId } from "@netgrid/shared";
import { artificialSecurityDirectorsImplementation } from "./onr-v1/corp/agendas/artificial-security-directors";
import { blackIceQualityAssuranceImplementation } from "./onr-v1/corp/agendas/black-ice-quality-assurance";
import { corporateCoupImplementation } from "./onr-v1/corp/agendas/corporate-coup";
import { detroitPoliceContractImplementation } from "./onr-v1/corp/agendas/detroit-police-contract";
import { executiveExtractionImplementation } from "./onr-v1/corp/agendas/executive-extraction";
import { geneticsVisionaryAcquisitionImplementation } from "./onr-v1/corp/agendas/genetics-visionary-acquisition";
import { mainOfficeRelocationImplementation } from "./onr-v1/corp/agendas/main-office-relocation";
import { marineArcologyImplementation } from "./onr-v1/corp/agendas/marine-arcology";
import { onCallSoloTeamImplementation } from "./onr-v1/corp/agendas/on-call-solo-team";
import { politicalCoupImplementation } from "./onr-v1/corp/agendas/political-coup";
import { politicalOverthrowImplementation } from "./onr-v1/corp/agendas/political-overthrow";
import { polymerBreakthroughImplementation } from "./onr-v1/corp/agendas/polymer-breakthrough";
import { strikeForceKaliImplementation } from "./onr-v1/corp/agendas/strike-force-kali";
import { subsidiaryBranchImplementation } from "./onr-v1/corp/agendas/subsidiary-branch";
import { bbsWhisperingCampaignImplementation } from "./onr-v1/corp/assets/bbs-whispering-campaign";
import { braindanceCampaignImplementation } from "./onr-v1/corp/assets/braindance-campaign";
import { dataMasonsHostingImplementation } from "./onr-v1/corp/assets/data-masons-hosting";
import { departmentOfTruthEnhancementImplementation } from "./onr-v1/corp/assets/department-of-truth-enhancement";
import { encoderIncImplementation } from "./onr-v1/corp/assets/encoder-inc";
import { esaContractImplementation } from "./onr-v1/corp/assets/esa-contract";
import { fortressArchitectsImplementation } from "./onr-v1/corp/assets/fortress-architects";
import { holovidCampaignImplementation } from "./onr-v1/corp/assets/holovid-campaign";
import { skaldervikenSaBetaTestSiteImplementation } from "./onr-v1/corp/assets/skalderviken-sa-beta-test-site";
import { soloSquadImplementation } from "./onr-v1/corp/assets/solo-squad";
import { southAfricanMiningCorpImplementation } from "./onr-v1/corp/assets/south-african-mining-corp";
import { spinnPublicRelationsImplementation } from "./onr-v1/corp/assets/spinn-public-relations";
import { rockerboyPromotionImplementation } from "./onr-v1/corp/assets/rockerboy-promotion";
import { remoteFacilityImplementation } from "./onr-v1/corp/assets/remote-facility";
import { rustbeltHqBranchImplementation } from "./onr-v1/corp/assets/rustbelt-hq-branch";
import { banpeiImplementation } from "./onr-v1/corp/ice/banpei";
import { bolterClusterImplementation } from "./onr-v1/corp/ice/bolter-cluster";
import { codeCorpseImplementation } from "./onr-v1/corp/ice/code-corpse";
import { corticalScannerImplementation } from "./onr-v1/corp/ice/cortical-scanner";
import { corticalScrubImplementation } from "./onr-v1/corp/ice/cortical-scrub";
import { crystalWallImplementation } from "./onr-v1/corp/ice/crystal-wall";
import { dArcKnightImplementation } from "./onr-v1/corp/ice/d-arc-knight";
import { dataDartsImplementation } from "./onr-v1/corp/ice/data-darts";
import { dataWallTwoPointZeroImplementation } from "./onr-v1/corp/ice/data-wall-2-0";
import { dataWallImplementation } from "./onr-v1/corp/ice/data-wall";
import { dataNagaImplementation } from "./onr-v1/corp/ice/data-naga";
import { endlessCorridorImplementation } from "./onr-v1/corp/ice/endless-corridor";
import { filterImplementation } from "./onr-v1/corp/ice/filter";
import { icePickWillieImplementation } from "./onr-v1/corp/ice/ice-pick-willie";
import { keeperImplementation } from "./onr-v1/corp/ice/keeper";
import { laserWireImplementation } from "./onr-v1/corp/ice/laser-wire";
import { licheImplementation } from "./onr-v1/corp/ice/liche";
import { mazerImplementation } from "./onr-v1/corp/ice/mazer";
import { nerveLabyrinthImplementation } from "./onr-v1/corp/ice/nerve-labyrinth";
import { neuralBladeImplementation } from "./onr-v1/corp/ice/neural-blade";
import { quandaryImplementation } from "./onr-v1/corp/ice/quandary";
import { razorWireImplementation } from "./onr-v1/corp/ice/razor-wire";
import { reinforcedWallImplementation } from "./onr-v1/corp/ice/reinforced-wall";
import { rockIsStrongImplementation } from "./onr-v1/corp/ice/rock-is-strong";
import { scrambleImplementation } from "./onr-v1/corp/ice/scramble";
import { sentinelsPrimeImplementation } from "./onr-v1/corp/ice/sentinels-prime";
import { shockRImplementation } from "./onr-v1/corp/ice/shock-r";
import { shotgunWireImplementation } from "./onr-v1/corp/ice/shotgun-wire";
import { sleeperImplementation } from "./onr-v1/corp/ice/sleeper";
import { triggermanImplementation } from "./onr-v1/corp/ice/triggerman";
import { wallOfIceImplementation } from "./onr-v1/corp/ice/wall-of-ice";
import { wallOfStaticImplementation } from "./onr-v1/corp/ice/wall-of-static";
import { zombieImplementation } from "./onr-v1/corp/ice/zombie";
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
import { antiquatedInterfaceRoutinesImplementation } from "./onr-v1/corp/upgrades/antiquated-interface-routines";
import { chesterMixImplementation } from "./onr-v1/corp/upgrades/chester-mix";
import { crystalPalaceStationGridImplementation } from "./onr-v1/corp/upgrades/crystal-palace-station-grid";
import { jerusalemCityGridImplementation } from "./onr-v1/corp/upgrades/jerusalem-city-grid";
import { newGalvestonCityGridImplementation } from "./onr-v1/corp/upgrades/new-galveston-city-grid";
import { redHerringsImplementation } from "./onr-v1/corp/upgrades/red-herrings";
import { tesseractFortConstructionImplementation } from "./onr-v1/corp/upgrades/tesseract-fort-construction";
import { washingtonDcCityGridImplementation } from "./onr-v1/corp/upgrades/washington-d-c-city-grid";
import { bodyweightSyntheticBloodImplementation } from "./onr-v1/runner/preps/bodyweight-synthetic-blood";
import { militechMramChipImplementation } from "./onr-v1/runner/hardware/militech-mram-chip";
import { mramChipImplementation } from "./onr-v1/runner/hardware/mram-chip";
import { tychoMemChipImplementation } from "./onr-v1/runner/hardware/tycho-mem-chip";
import { wutechMemChipImplementation } from "./onr-v1/runner/hardware/wutech-mem-chip";
import { zetatechMemChipImplementation } from "./onr-v1/runner/hardware/zetatech-mem-chip";
import { jackNJoeImplementation } from "./onr-v1/runner/preps/jack-n-joe";
import { livewiresContactsImplementation } from "./onr-v1/runner/preps/livewires-contacts";
import { scoreImplementation } from "./onr-v1/runner/preps/score";
import { newsgroupFilterImplementation } from "./onr-v1/runner/programs/newsgroup-filter";
import { floatingRunnerBbsImplementation } from "./onr-v1/runner/resources/floating-runner-bbs";
import { brokerImplementation } from "./onr-v1/runner/resources/broker";
import { loanFromChibaImplementation } from "./onr-v1/runner/resources/loan-from-chiba";
import { riggedInvestmentsImplementation } from "./onr-v1/runner/resources/rigged-investments";
import { shortTermContractImplementation } from "./onr-v1/runner/resources/short-term-contract";
import { siliconSaloonFranchiseImplementation } from "./onr-v1/runner/resources/silicon-saloon-franchise";
import { topRunnersConferenceImplementation } from "./onr-v1/runner/resources/top-runners-conference";
import type { CardImplementationDefinition } from "./types";

export const CARD_IMPLEMENTATIONS = [
  bodyweightSyntheticBloodImplementation,
  jackNJoeImplementation,
  livewiresContactsImplementation,
  newsgroupFilterImplementation,
  brokerImplementation,
  floatingRunnerBbsImplementation,
  loanFromChibaImplementation,
  militechMramChipImplementation,
  mramChipImplementation,
  riggedInvestmentsImplementation,
  scoreImplementation,
  shortTermContractImplementation,
  siliconSaloonFranchiseImplementation,
  topRunnersConferenceImplementation,
  artificialSecurityDirectorsImplementation,
  blackIceQualityAssuranceImplementation,
  corporateCoupImplementation,
  detroitPoliceContractImplementation,
  executiveExtractionImplementation,
  geneticsVisionaryAcquisitionImplementation,
  mainOfficeRelocationImplementation,
  marineArcologyImplementation,
  onCallSoloTeamImplementation,
  politicalCoupImplementation,
  politicalOverthrowImplementation,
  polymerBreakthroughImplementation,
  strikeForceKaliImplementation,
  subsidiaryBranchImplementation,
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
  braindanceCampaignImplementation,
  dataMasonsHostingImplementation,
  departmentOfTruthEnhancementImplementation,
  encoderIncImplementation,
  esaContractImplementation,
  fortressArchitectsImplementation,
  holovidCampaignImplementation,
  skaldervikenSaBetaTestSiteImplementation,
  soloSquadImplementation,
  remoteFacilityImplementation,
  rockerboyPromotionImplementation,
  rustbeltHqBranchImplementation,
  southAfricanMiningCorpImplementation,
  spinnPublicRelationsImplementation,
  banpeiImplementation,
  bolterClusterImplementation,
  codeCorpseImplementation,
  corticalScannerImplementation,
  corticalScrubImplementation,
  crystalWallImplementation,
  dArcKnightImplementation,
  dataDartsImplementation,
  dataWallImplementation,
  dataWallTwoPointZeroImplementation,
  dataNagaImplementation,
  endlessCorridorImplementation,
  filterImplementation,
  icePickWillieImplementation,
  keeperImplementation,
  laserWireImplementation,
  licheImplementation,
  mazerImplementation,
  nerveLabyrinthImplementation,
  neuralBladeImplementation,
  quandaryImplementation,
  razorWireImplementation,
  reinforcedWallImplementation,
  rockIsStrongImplementation,
  scrambleImplementation,
  sentinelsPrimeImplementation,
  shockRImplementation,
  shotgunWireImplementation,
  sleeperImplementation,
  triggermanImplementation,
  wallOfIceImplementation,
  wallOfStaticImplementation,
  zombieImplementation,
  tychoMemChipImplementation,
  wutechMemChipImplementation,
  zetatechMemChipImplementation,
  antiquatedInterfaceRoutinesImplementation,
  chesterMixImplementation,
  crystalPalaceStationGridImplementation,
  jerusalemCityGridImplementation,
  newGalvestonCityGridImplementation,
  redHerringsImplementation,
  tesseractFortConstructionImplementation,
  washingtonDcCityGridImplementation,
] as const satisfies readonly CardImplementationDefinition[];

export const CARD_IMPLEMENTATIONS_BY_DEFINITION_ID: Partial<
  Record<CardDefinitionId, CardImplementationDefinition>
> = Object.fromEntries(
  CARD_IMPLEMENTATIONS.map((implementation) => [
    implementation.cardDefinitionId,
    implementation,
  ]),
);

/**
 * Looks up the declarative implementation for a card definition, if migrated.
 */
export function cardImplementationForDefinitionId(
  definitionId: CardDefinitionId,
): CardImplementationDefinition | undefined {
  return CARD_IMPLEMENTATIONS_BY_DEFINITION_ID[definitionId];
}
