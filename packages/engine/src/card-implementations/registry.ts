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
import { netwatchOperationsOfficeImplementation } from "./onr-v1/corp/agendas/netwatch-operations-office";
import { onCallSoloTeamImplementation } from "./onr-v1/corp/agendas/on-call-solo-team";
import { politicalCoupImplementation } from "./onr-v1/corp/agendas/political-coup";
import { politicalOverthrowImplementation } from "./onr-v1/corp/agendas/political-overthrow";
import { polymerBreakthroughImplementation } from "./onr-v1/corp/agendas/polymer-breakthrough";
import { privateCybernetPoliceImplementation } from "./onr-v1/corp/agendas/private-cybernet-police";
import { strikeForceKaliImplementation } from "./onr-v1/corp/agendas/strike-force-kali";
import { subsidiaryBranchImplementation } from "./onr-v1/corp/agendas/subsidiary-branch";
import { bbsWhisperingCampaignImplementation } from "./onr-v1/corp/assets/bbs-whispering-campaign";
import { bloodCatImplementation } from "./onr-v1/corp/assets/blood-cat";
import { braindanceCampaignImplementation } from "./onr-v1/corp/assets/braindance-campaign";
import { chicagoBranchImplementation } from "./onr-v1/corp/assets/chicago-branch";
import { corprunnersShatteredRemainsImplementation } from "./onr-v1/corp/assets/corprunners-shattered-remains";
import { dataMasonsHostingImplementation } from "./onr-v1/corp/assets/data-masons-hosting";
import { departmentOfTruthEnhancementImplementation } from "./onr-v1/corp/assets/department-of-truth-enhancement";
import { encoderIncImplementation } from "./onr-v1/corp/assets/encoder-inc";
import { esaContractImplementation } from "./onr-v1/corp/assets/esa-contract";
import { experimentalAiImplementation } from "./onr-v1/corp/assets/experimental-ai";
import { fortressArchitectsImplementation } from "./onr-v1/corp/assets/fortress-architects";
import { holovidCampaignImplementation } from "./onr-v1/corp/assets/holovid-campaign";
import { informationLaunderingImplementation } from "./onr-v1/corp/assets/information-laundering";
import { pacificaRegionalAiImplementation } from "./onr-v1/corp/assets/pacifica-regional-ai";
import { skaldervikenSaBetaTestSiteImplementation } from "./onr-v1/corp/assets/skalderviken-sa-beta-test-site";
import { soloSquadImplementation } from "./onr-v1/corp/assets/solo-squad";
import { southAfricanMiningCorpImplementation } from "./onr-v1/corp/assets/south-african-mining-corp";
import { spinnPublicRelationsImplementation } from "./onr-v1/corp/assets/spinn-public-relations";
import { rockerboyPromotionImplementation } from "./onr-v1/corp/assets/rockerboy-promotion";
import { remoteFacilityImplementation } from "./onr-v1/corp/assets/remote-facility";
import { rustbeltHqBranchImplementation } from "./onr-v1/corp/assets/rustbelt-hq-branch";
import { setupImplementation } from "./onr-v1/corp/assets/setup";
import { vaporOpsImplementation } from "./onr-v1/corp/assets/vapor-ops";
import { trapImplementation } from "./onr-v1/corp/assets/trap";
import { vacantSoulkillerImplementation } from "./onr-v1/corp/assets/vacant-soulkiller";
import { virusTestSiteImplementation } from "./onr-v1/corp/assets/virus-test-site";
import { aspImplementation } from "./onr-v1/corp/ice/asp";
import { banpeiImplementation } from "./onr-v1/corp/ice/banpei";
import { bolterClusterImplementation } from "./onr-v1/corp/ice/bolter-cluster";
import { canisMajorImplementation } from "./onr-v1/corp/ice/canis-major";
import { canisMinorImplementation } from "./onr-v1/corp/ice/canis-minor";
import { cerberusImplementation } from "./onr-v1/corp/ice/cerberus";
import { codeCorpseImplementation } from "./onr-v1/corp/ice/code-corpse";
import { corticalScannerImplementation } from "./onr-v1/corp/ice/cortical-scanner";
import { corticalScrubImplementation } from "./onr-v1/corp/ice/cortical-scrub";
import { crystalWallImplementation } from "./onr-v1/corp/ice/crystal-wall";
import { dArcKnightImplementation } from "./onr-v1/corp/ice/d-arc-knight";
import { dataDartsImplementation } from "./onr-v1/corp/ice/data-darts";
import { dataWallTwoPointZeroImplementation } from "./onr-v1/corp/ice/data-wall-2-0";
import { dataWallImplementation } from "./onr-v1/corp/ice/data-wall";
import { dataNagaImplementation } from "./onr-v1/corp/ice/data-naga";
import { dataRavenImplementation } from "./onr-v1/corp/ice/data-raven";
import { endlessCorridorImplementation } from "./onr-v1/corp/ice/endless-corridor";
import { fangTwoPointZeroImplementation } from "./onr-v1/corp/ice/fang-2-0";
import { fangImplementation } from "./onr-v1/corp/ice/fang";
import { fetchFourPointZeroPointOneImplementation } from "./onr-v1/corp/ice/fetch-4-0-1";
import { filterImplementation } from "./onr-v1/corp/ice/filter";
import { fireWallImplementation } from "./onr-v1/corp/ice/fire-wall";
import { fragmentationStormImplementation } from "./onr-v1/corp/ice/fragmentation-storm";
import { hunterImplementation } from "./onr-v1/corp/ice/hunter";
import { icePickWillieImplementation } from "./onr-v1/corp/ice/ice-pick-willie";
import { jackAttackImplementation } from "./onr-v1/corp/ice/jack-attack";
import { keeperImplementation } from "./onr-v1/corp/ice/keeper";
import { laserWireImplementation } from "./onr-v1/corp/ice/laser-wire";
import { licheImplementation } from "./onr-v1/corp/ice/liche";
import { mazerImplementation } from "./onr-v1/corp/ice/mazer";
import { mastiffImplementation } from "./onr-v1/corp/ice/mastiff";
import { nerveLabyrinthImplementation } from "./onr-v1/corp/ice/nerve-labyrinth";
import { neuralBladeImplementation } from "./onr-v1/corp/ice/neural-blade";
import { piInTheFaceImplementation } from "./onr-v1/corp/ice/pi-in-the-face";
import { quandaryImplementation } from "./onr-v1/corp/ice/quandary";
import { razorWireImplementation } from "./onr-v1/corp/ice/razor-wire";
import { reinforcedWallImplementation } from "./onr-v1/corp/ice/reinforced-wall";
import { rexImplementation } from "./onr-v1/corp/ice/rex";
import { rockIsStrongImplementation } from "./onr-v1/corp/ice/rock-is-strong";
import { scrambleImplementation } from "./onr-v1/corp/ice/scramble";
import { sentinelsPrimeImplementation } from "./onr-v1/corp/ice/sentinels-prime";
import { shockRImplementation } from "./onr-v1/corp/ice/shock-r";
import { shotgunWireImplementation } from "./onr-v1/corp/ice/shotgun-wire";
import { sleeperImplementation } from "./onr-v1/corp/ice/sleeper";
import { triggermanImplementation } from "./onr-v1/corp/ice/triggerman";
import { tutorImplementation } from "./onr-v1/corp/ice/tutor";
import { virizzImplementation } from "./onr-v1/corp/ice/virizz";
import { wallOfIceImplementation } from "./onr-v1/corp/ice/wall-of-ice";
import { wallOfStaticImplementation } from "./onr-v1/corp/ice/wall-of-static";
import { zombieImplementation } from "./onr-v1/corp/ice/zombie";
import { accountsReceivableImplementation } from "./onr-v1/corp/operations/accounts-receivable";
import { annualReviewsImplementation } from "./onr-v1/corp/operations/annual-reviews";
import { auditOfCallRecordsImplementation } from "./onr-v1/corp/operations/audit-of-call-records";
import { chanceObservationImplementation } from "./onr-v1/corp/operations/chance-observation";
import { closedAccountsImplementation } from "./onr-v1/corp/operations/closed-accounts";
import { datapoolByZetatechImplementation } from "./onr-v1/corp/operations/datapool-by-zetatech";
import { dayShiftImplementation } from "./onr-v1/corp/operations/day-shift";
import { efficiencyExpertsImplementation } from "./onr-v1/corp/operations/efficiency-experts";
import { falsifiedTransactionsExpertImplementation } from "./onr-v1/corp/operations/falsified-transactions-expert";
import { managementShakeUpImplementation } from "./onr-v1/corp/operations/management-shake-up";
import { netwatchCreditVoucherImplementation } from "./onr-v1/corp/operations/netwatch-credit-voucher";
import { nightShiftImplementation } from "./onr-v1/corp/operations/night-shift";
import { projectConsultantsImplementation } from "./onr-v1/corp/operations/project-consultants";
import { punitiveCounterstrikeImplementation } from "./onr-v1/corp/operations/punitive-counterstrike";
import { scorchedEarthImplementation } from "./onr-v1/corp/operations/scorched-earth";
import { systematicLayoffsImplementation } from "./onr-v1/corp/operations/systematic-layoffs";
import { teamRestructuringImplementation } from "./onr-v1/corp/operations/team-restructuring";
import { urbanRenewalImplementation } from "./onr-v1/corp/operations/urban-renewal";
import { antiquatedInterfaceRoutinesImplementation } from "./onr-v1/corp/upgrades/antiquated-interface-routines";
import { chesterMixImplementation } from "./onr-v1/corp/upgrades/chester-mix";
import { crystalPalaceStationGridImplementation } from "./onr-v1/corp/upgrades/crystal-palace-station-grid";
import { dedicatedResponseTeamImplementation } from "./onr-v1/corp/upgrades/dedicated-response-team";
import { dieterEsslinImplementation } from "./onr-v1/corp/upgrades/dieter-esslin";
import { jerusalemCityGridImplementation } from "./onr-v1/corp/upgrades/jerusalem-city-grid";
import { newGalvestonCityGridImplementation } from "./onr-v1/corp/upgrades/new-galveston-city-grid";
import { redHerringsImplementation } from "./onr-v1/corp/upgrades/red-herrings";
import { tesseractFortConstructionImplementation } from "./onr-v1/corp/upgrades/tesseract-fort-construction";
import { washingtonDcCityGridImplementation } from "./onr-v1/corp/upgrades/washington-d-c-city-grid";
import { bodyweightSyntheticBloodImplementation } from "./onr-v1/runner/preps/bodyweight-synthetic-blood";
import { custodialPositionImplementation } from "./onr-v1/runner/preps/custodial-position";
import { editedShippingManifestsImplementation } from "./onr-v1/runner/preps/edited-shipping-manifests";
import { executiveWiretapsImplementation } from "./onr-v1/runner/preps/executive-wiretaps";
import { kilroyWasHereImplementation } from "./onr-v1/runner/preps/kilroy-was-here";
import { priorityWreckImplementation } from "./onr-v1/runner/preps/priority-wreck";
import { hqInterfaceImplementation } from "./onr-v1/runner/hardware/hq-interface";
import { militechMramChipImplementation } from "./onr-v1/runner/hardware/militech-mram-chip";
import { mramChipImplementation } from "./onr-v1/runner/hardware/mram-chip";
import { rAndDInterfaceImplementation } from "./onr-v1/runner/hardware/r-d-interface";
import { recordReconstructorImplementation } from "./onr-v1/runner/hardware/record-reconstructor";
import { tychoMemChipImplementation } from "./onr-v1/runner/hardware/tycho-mem-chip";
import { wutechMemChipImplementation } from "./onr-v1/runner/hardware/wutech-mem-chip";
import { zetatechMemChipImplementation } from "./onr-v1/runner/hardware/zetatech-mem-chip";
import { jackNJoeImplementation } from "./onr-v1/runner/preps/jack-n-joe";
import { livewiresContactsImplementation } from "./onr-v1/runner/preps/livewires-contacts";
import { privateLdlAccessImplementation } from "./onr-v1/runner/preps/private-ldl-access";
import { rompThroughHqImplementation } from "./onr-v1/runner/preps/romp-through-hq";
import { scoreImplementation } from "./onr-v1/runner/preps/score";
import { weatherToFinancePipeImplementation } from "./onr-v1/runner/preps/weather-to-finance-pipe";
import { baedekersNetMapImplementation } from "./onr-v1/runner/programs/baedekers-net-map";
import { bakdoorImplementation } from "./onr-v1/runner/programs/bakdoor";
import { expertScheduleAnalyzerImplementation } from "./onr-v1/runner/programs/expert-schedule-analyzer";
import { microtechAiInterfaceImplementation } from "./onr-v1/runner/programs/microtech-ai-interface";
import { newsgroupFilterImplementation } from "./onr-v1/runner/programs/newsgroup-filter";
import { rAndDProtocolFilesImplementation } from "./onr-v1/runner/programs/r-d-protocol-files";
import { shredderUplinkProtocolImplementation } from "./onr-v1/runner/programs/shredder-uplink-protocol";
import { signpostImplementation } from "./onr-v1/runner/programs/signpost";
import { accessThroughAlphaImplementation } from "./onr-v1/runner/resources/access-through-alpha";
import { accessToArasakaImplementation } from "./onr-v1/runner/resources/access-to-arasaka";
import { accessToKiribatiImplementation } from "./onr-v1/runner/resources/access-to-kiribati";
import { backDoorToHilliardImplementation } from "./onr-v1/runner/resources/back-door-to-hilliard";
import { backDoorToOrbitalAirImplementation } from "./onr-v1/runner/resources/back-door-to-orbital-air";
import { floatingRunnerBbsImplementation } from "./onr-v1/runner/resources/floating-runner-bbs";
import { brokerImplementation } from "./onr-v1/runner/resources/broker";
import { loanFromChibaImplementation } from "./onr-v1/runner/resources/loan-from-chiba";
import { riggedInvestmentsImplementation } from "./onr-v1/runner/resources/rigged-investments";
import { shortTermContractImplementation } from "./onr-v1/runner/resources/short-term-contract";
import { siliconSaloonFranchiseImplementation } from "./onr-v1/runner/resources/silicon-saloon-franchise";
import { technicianLoverImplementation } from "./onr-v1/runner/resources/technician-lover";
import { theSpringboardImplementation } from "./onr-v1/runner/resources/the-springboard";
import { topRunnersConferenceImplementation } from "./onr-v1/runner/resources/top-runners-conference";
import type { CardImplementationDefinition } from "./types";

export const CARD_IMPLEMENTATIONS = [
  bodyweightSyntheticBloodImplementation,
  custodialPositionImplementation,
  editedShippingManifestsImplementation,
  executiveWiretapsImplementation,
  jackNJoeImplementation,
  kilroyWasHereImplementation,
  livewiresContactsImplementation,
  priorityWreckImplementation,
  privateLdlAccessImplementation,
  rompThroughHqImplementation,
  weatherToFinancePipeImplementation,
  baedekersNetMapImplementation,
  bakdoorImplementation,
  expertScheduleAnalyzerImplementation,
  microtechAiInterfaceImplementation,
  newsgroupFilterImplementation,
  rAndDProtocolFilesImplementation,
  shredderUplinkProtocolImplementation,
  signpostImplementation,
  accessThroughAlphaImplementation,
  accessToArasakaImplementation,
  accessToKiribatiImplementation,
  backDoorToHilliardImplementation,
  backDoorToOrbitalAirImplementation,
  brokerImplementation,
  floatingRunnerBbsImplementation,
  loanFromChibaImplementation,
  hqInterfaceImplementation,
  militechMramChipImplementation,
  mramChipImplementation,
  rAndDInterfaceImplementation,
  recordReconstructorImplementation,
  riggedInvestmentsImplementation,
  scoreImplementation,
  shortTermContractImplementation,
  siliconSaloonFranchiseImplementation,
  technicianLoverImplementation,
  theSpringboardImplementation,
  topRunnersConferenceImplementation,
  artificialSecurityDirectorsImplementation,
  blackIceQualityAssuranceImplementation,
  corporateCoupImplementation,
  detroitPoliceContractImplementation,
  executiveExtractionImplementation,
  geneticsVisionaryAcquisitionImplementation,
  mainOfficeRelocationImplementation,
  marineArcologyImplementation,
  netwatchOperationsOfficeImplementation,
  onCallSoloTeamImplementation,
  politicalCoupImplementation,
  politicalOverthrowImplementation,
  polymerBreakthroughImplementation,
  privateCybernetPoliceImplementation,
  strikeForceKaliImplementation,
  subsidiaryBranchImplementation,
  accountsReceivableImplementation,
  annualReviewsImplementation,
  auditOfCallRecordsImplementation,
  chanceObservationImplementation,
  closedAccountsImplementation,
  datapoolByZetatechImplementation,
  dayShiftImplementation,
  efficiencyExpertsImplementation,
  falsifiedTransactionsExpertImplementation,
  managementShakeUpImplementation,
  netwatchCreditVoucherImplementation,
  nightShiftImplementation,
  projectConsultantsImplementation,
  punitiveCounterstrikeImplementation,
  scorchedEarthImplementation,
  systematicLayoffsImplementation,
  teamRestructuringImplementation,
  urbanRenewalImplementation,
  bbsWhisperingCampaignImplementation,
  bloodCatImplementation,
  braindanceCampaignImplementation,
  chicagoBranchImplementation,
  corprunnersShatteredRemainsImplementation,
  dataMasonsHostingImplementation,
  departmentOfTruthEnhancementImplementation,
  encoderIncImplementation,
  esaContractImplementation,
  experimentalAiImplementation,
  fortressArchitectsImplementation,
  holovidCampaignImplementation,
  informationLaunderingImplementation,
  pacificaRegionalAiImplementation,
  skaldervikenSaBetaTestSiteImplementation,
  soloSquadImplementation,
  remoteFacilityImplementation,
  rockerboyPromotionImplementation,
  rustbeltHqBranchImplementation,
  setupImplementation,
  vaporOpsImplementation,
  trapImplementation,
  vacantSoulkillerImplementation,
  virusTestSiteImplementation,
  southAfricanMiningCorpImplementation,
  spinnPublicRelationsImplementation,
  aspImplementation,
  banpeiImplementation,
  bolterClusterImplementation,
  canisMajorImplementation,
  canisMinorImplementation,
  cerberusImplementation,
  codeCorpseImplementation,
  corticalScannerImplementation,
  corticalScrubImplementation,
  crystalWallImplementation,
  dArcKnightImplementation,
  dataDartsImplementation,
  dataWallImplementation,
  dataWallTwoPointZeroImplementation,
  dataNagaImplementation,
  dataRavenImplementation,
  endlessCorridorImplementation,
  fangImplementation,
  fangTwoPointZeroImplementation,
  fetchFourPointZeroPointOneImplementation,
  filterImplementation,
  fireWallImplementation,
  fragmentationStormImplementation,
  hunterImplementation,
  icePickWillieImplementation,
  jackAttackImplementation,
  keeperImplementation,
  laserWireImplementation,
  licheImplementation,
  mastiffImplementation,
  mazerImplementation,
  nerveLabyrinthImplementation,
  neuralBladeImplementation,
  piInTheFaceImplementation,
  quandaryImplementation,
  razorWireImplementation,
  reinforcedWallImplementation,
  rexImplementation,
  rockIsStrongImplementation,
  scrambleImplementation,
  sentinelsPrimeImplementation,
  shockRImplementation,
  shotgunWireImplementation,
  sleeperImplementation,
  triggermanImplementation,
  tutorImplementation,
  virizzImplementation,
  wallOfIceImplementation,
  wallOfStaticImplementation,
  zombieImplementation,
  tychoMemChipImplementation,
  wutechMemChipImplementation,
  zetatechMemChipImplementation,
  antiquatedInterfaceRoutinesImplementation,
  chesterMixImplementation,
  crystalPalaceStationGridImplementation,
  dedicatedResponseTeamImplementation,
  dieterEsslinImplementation,
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
