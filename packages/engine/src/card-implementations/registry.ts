/**
 * Registers concrete CardImplementation definitions by card definition id.
 *
 * This file is a catalog only: it imports declarative card files and builds
 * lookup tables. It must not execute abilities, add coverage semantics, or
 * contain legacy resolver branches.
 */
import type { CardDefinitionId } from "@netgrid/shared";
import { aiChiefFinancialOfficerImplementation } from "./onr-v1/corp/agendas/ai-chief-financial-officer";
import { artificialSecurityDirectorsImplementation } from "./onr-v1/corp/agendas/artificial-security-directors";
import { bioweaponsEngineeringImplementation } from "./onr-v1/corp/agendas/bioweapons-engineering";
import { blackIceQualityAssuranceImplementation } from "./onr-v1/corp/agendas/black-ice-quality-assurance";
import { corporateBoonImplementation } from "./onr-v1/corp/agendas/corporate-boon";
import { corporateCoupImplementation } from "./onr-v1/corp/agendas/corporate-coup";
import { corporateDownsizingImplementation } from "./onr-v1/corp/agendas/corporate-downsizing";
import { corporateRetreatImplementation } from "./onr-v1/corp/agendas/corporate-retreat";
import { corporateWarImplementation } from "./onr-v1/corp/agendas/corporate-war";
import { dataFortReclamationImplementation } from "./onr-v1/corp/agendas/data-fort-reclamation";
import { detroitPoliceContractImplementation } from "./onr-v1/corp/agendas/detroit-police-contract";
import { employeeEmpowermentImplementation } from "./onr-v1/corp/agendas/employee-empowerment";
import { encryptionBreakthroughImplementation } from "./onr-v1/corp/agendas/encryption-breakthrough";
import { executiveExtractionImplementation } from "./onr-v1/corp/agendas/executive-extraction";
import { geneticsVisionaryAcquisitionImplementation } from "./onr-v1/corp/agendas/genetics-visionary-acquisition";
import { hostileTakeoverImplementation } from "./onr-v1/corp/agendas/hostile-takeover";
import { iceTransmutationImplementation } from "./onr-v1/corp/agendas/ice-transmutation";
import { mainOfficeRelocationImplementation } from "./onr-v1/corp/agendas/main-office-relocation";
import { marineArcologyImplementation } from "./onr-v1/corp/agendas/marine-arcology";
import { netwatchOperationsOfficeImplementation } from "./onr-v1/corp/agendas/netwatch-operations-office";
import { onCallSoloTeamImplementation } from "./onr-v1/corp/agendas/on-call-solo-team";
import { politicalCoupImplementation } from "./onr-v1/corp/agendas/political-coup";
import { politicalOverthrowImplementation } from "./onr-v1/corp/agendas/political-overthrow";
import { polymerBreakthroughImplementation } from "./onr-v1/corp/agendas/polymer-breakthrough";
import { privateCybernetPoliceImplementation } from "./onr-v1/corp/agendas/private-cybernet-police";
import { priorityRequisitionImplementation } from "./onr-v1/corp/agendas/priority-requisition";
import { projectBabylonImplementation } from "./onr-v1/corp/agendas/project-babylon";
import { securityNetOptimizationImplementation } from "./onr-v1/corp/agendas/security-net-optimization";
import { securityPurgeImplementation } from "./onr-v1/corp/agendas/security-purge";
import { strikeForceKaliImplementation } from "./onr-v1/corp/agendas/strike-force-kali";
import { subsidiaryBranchImplementation } from "./onr-v1/corp/agendas/subsidiary-branch";
import { superiorNetBarriersImplementation } from "./onr-v1/corp/agendas/superior-net-barriers";
import { bbsWhisperingCampaignImplementation } from "./onr-v1/corp/assets/bbs-whispering-campaign";
import { bloodCatImplementation } from "./onr-v1/corp/assets/blood-cat";
import { braindanceCampaignImplementation } from "./onr-v1/corp/assets/braindance-campaign";
import { chicagoBranchImplementation } from "./onr-v1/corp/assets/chicago-branch";
import { corporateNegotiatingCenterImplementation } from "./onr-v1/corp/assets/corporate-negotiating-center";
import { corprunnersShatteredRemainsImplementation } from "./onr-v1/corp/assets/corprunners-shattered-remains";
import { cowboySysopImplementation } from "./onr-v1/corp/assets/cowboy-sysop";
import { dataMasonsHostingImplementation } from "./onr-v1/corp/assets/data-masons-hosting";
import { departmentOfTruthEnhancementImplementation } from "./onr-v1/corp/assets/department-of-truth-enhancement";
import { disinfectantIncImplementation } from "./onr-v1/corp/assets/disinfectant-inc";
import { encoderIncImplementation } from "./onr-v1/corp/assets/encoder-inc";
import { esaContractImplementation } from "./onr-v1/corp/assets/esa-contract";
import { euromarketConsortiumImplementation } from "./onr-v1/corp/assets/euromarket-consortium";
import { experimentalAiImplementation } from "./onr-v1/corp/assets/experimental-ai";
import { fortressArchitectsImplementation } from "./onr-v1/corp/assets/fortress-architects";
import { holovidCampaignImplementation } from "./onr-v1/corp/assets/holovid-campaign";
import { informationLaunderingImplementation } from "./onr-v1/corp/assets/information-laundering";
import { krumzImplementation } from "./onr-v1/corp/assets/krumz";
import { newsgroupTauntingImplementation } from "./onr-v1/corp/assets/newsgroup-taunting";
import { omniscienceFoundationImplementation } from "./onr-v1/corp/assets/omniscience-foundation";
import { pacificaRegionalAiImplementation } from "./onr-v1/corp/assets/pacifica-regional-ai";
import { reschedulerImplementation } from "./onr-v1/corp/assets/rescheduler";
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
import { corporateDetectiveAgencyImplementation } from "./onr-v1/corp/operations/corporate-detective-agency";
import { datapoolByZetatechImplementation } from "./onr-v1/corp/operations/datapool-by-zetatech";
import { dayShiftImplementation } from "./onr-v1/corp/operations/day-shift";
import { edgerunnerIncTempsImplementation } from "./onr-v1/corp/operations/edgerunner-inc-temps";
import { efficiencyExpertsImplementation } from "./onr-v1/corp/operations/efficiency-experts";
import { falsifiedTransactionsExpertImplementation } from "./onr-v1/corp/operations/falsified-transactions-expert";
import { managementShakeUpImplementation } from "./onr-v1/corp/operations/management-shake-up";
import { netwatchCreditVoucherImplementation } from "./onr-v1/corp/operations/netwatch-credit-voucher";
import { nightShiftImplementation } from "./onr-v1/corp/operations/night-shift";
import { offSiteBackupsImplementation } from "./onr-v1/corp/operations/off-site-backups";
import { overtimeIncentivesImplementation } from "./onr-v1/corp/operations/overtime-incentives";
import { planningConsultantsImplementation } from "./onr-v1/corp/operations/planning-consultants";
import { powerGridOverloadImplementation } from "./onr-v1/corp/operations/power-grid-overload";
import { projectConsultantsImplementation } from "./onr-v1/corp/operations/project-consultants";
import { punitiveCounterstrikeImplementation } from "./onr-v1/corp/operations/punitive-counterstrike";
import { scorchedEarthImplementation } from "./onr-v1/corp/operations/scorched-earth";
import { silverLiningRecoveryProtocolImplementation } from "./onr-v1/corp/operations/silver-lining-recovery-protocol";
import { systematicLayoffsImplementation } from "./onr-v1/corp/operations/systematic-layoffs";
import { teamRestructuringImplementation } from "./onr-v1/corp/operations/team-restructuring";
import { trojanHorseImplementation } from "./onr-v1/corp/operations/trojan-horse";
import { urbanRenewalImplementation } from "./onr-v1/corp/operations/urban-renewal";
import { antiquatedInterfaceRoutinesImplementation } from "./onr-v1/corp/upgrades/antiquated-interface-routines";
import { chesterMixImplementation } from "./onr-v1/corp/upgrades/chester-mix";
import { chimeraImplementation } from "./onr-v1/corp/upgrades/chimera";
import { crystalPalaceStationGridImplementation } from "./onr-v1/corp/upgrades/crystal-palace-station-grid";
import { dedicatedResponseTeamImplementation } from "./onr-v1/corp/upgrades/dedicated-response-team";
import { dieterEsslinImplementation } from "./onr-v1/corp/upgrades/dieter-esslin";
import { jerusalemCityGridImplementation } from "./onr-v1/corp/upgrades/jerusalem-city-grid";
import { newGalvestonCityGridImplementation } from "./onr-v1/corp/upgrades/new-galveston-city-grid";
import { oliviaSalazarImplementation } from "./onr-v1/corp/upgrades/olivia-salazar";
import { omniKismetPhDImplementation } from "./onr-v1/corp/upgrades/omni-kismet-ph-d";
import { redHerringsImplementation } from "./onr-v1/corp/upgrades/red-herrings";
import { singaporeCityGridImplementation } from "./onr-v1/corp/upgrades/singapore-city-grid";
import { tesseractFortConstructionImplementation } from "./onr-v1/corp/upgrades/tesseract-fort-construction";
import { washingtonDcCityGridImplementation } from "./onr-v1/corp/upgrades/washington-d-c-city-grid";
import { arasakaOwnsYouImplementation } from "./onr-v1/runner/preps/arasaka-owns-you";
import { allNighterImplementation } from "./onr-v1/runner/preps/all-nighter";
import { bodyweightSyntheticBloodImplementation } from "./onr-v1/runner/preps/bodyweight-synthetic-blood";
import { coreCommandJettisonIceImplementation } from "./onr-v1/runner/preps/core-command-jettison-ice";
import { custodialPositionImplementation } from "./onr-v1/runner/preps/custodial-position";
import { editedShippingManifestsImplementation } from "./onr-v1/runner/preps/edited-shipping-manifests";
import { executiveWiretapsImplementation } from "./onr-v1/runner/preps/executive-wiretaps";
import { forgedActivationOrdersImplementation } from "./onr-v1/runner/preps/forged-activation-orders";
import { forgottenBackupChipImplementation } from "./onr-v1/runner/preps/forgotten-backup-chip";
import { gideonsPawnshopImplementation } from "./onr-v1/runner/preps/gideons-pawnshop";
import { huntClubBbsImplementation } from "./onr-v1/runner/preps/hunt-club-bbs";
import { iceAndDatasGuideToTheNetImplementation } from "./onr-v1/runner/preps/ice-and-datas-guide-to-the-net";
import { ifYouWantItDoneRightImplementation } from "./onr-v1/runner/preps/if-you-want-it-done-right";
import { insideJobImplementation } from "./onr-v1/runner/preps/inside-job";
import { kilroyWasHereImplementation } from "./onr-v1/runner/preps/kilroy-was-here";
import { mantisFixerAtLargeImplementation } from "./onr-v1/runner/preps/mantis-fixer-at-large";
import { miscForSaleImplementation } from "./onr-v1/runner/preps/misc-for-sale";
import { mitWestTierImplementation } from "./onr-v1/runner/preps/mit-west-tier";
import { openEndedMileageProgramImplementation } from "./onr-v1/runner/preps/open-ended-mileage-program";
import { organDonorImplementation } from "./onr-v1/runner/preps/organ-donor";
import { priorityWreckImplementation } from "./onr-v1/runner/preps/priority-wreck";
import { sneakPreviewImplementation } from "./onr-v1/runner/preps/sneak-preview";
import { totalGeneticRetrofitImplementation } from "./onr-v1/runner/preps/total-genetic-retrofit";
import { arasakaPortablePrototypeImplementation } from "./onr-v1/runner/hardware/arasaka-portable-prototype";
import { armadilloArmoredRoadHomeImplementation } from "./onr-v1/runner/hardware/armadillo-armored-road-home";
import { armoredFridgeImplementation } from "./onr-v1/runner/hardware/armored-fridge";
import { artemis2020Implementation } from "./onr-v1/runner/hardware/artemis-2020";
import { bodyweightDataCrecheImplementation } from "./onr-v1/runner/hardware/bodyweight-data-creche";
import { corollaSpeedChipImplementation } from "./onr-v1/runner/hardware/corolla-speed-chip";
import { dermatechBodyplatingImplementation } from "./onr-v1/runner/hardware/dermatech-bodyplating";
import { drifterMobileEnvironmentImplementation } from "./onr-v1/runner/hardware/drifter-mobile-environment";
import { fullBodyConversionImplementation } from "./onr-v1/runner/hardware/full-body-conversion";
import { greenKnightSurgeBuffersImplementation } from "./onr-v1/runner/hardware/green-knight-surge-buffers";
import { hqInterfaceImplementation } from "./onr-v1/runner/hardware/hq-interface";
import { lifesaverNanosurgeonsImplementation } from "./onr-v1/runner/hardware/lifesaver-nanosurgeons";
import { militechMramChipImplementation } from "./onr-v1/runner/hardware/militech-mram-chip";
import { mramChipImplementation } from "./onr-v1/runner/hardware/mram-chip";
import { nasukoCycleImplementation } from "./onr-v1/runner/hardware/nasuko-cycle";
import { pandorasDeckImplementation } from "./onr-v1/runner/hardware/pandoras-deck";
import { parraline5750Implementation } from "./onr-v1/runner/hardware/parraline-5750";
import { pk6089aImplementation } from "./onr-v1/runner/hardware/pk-6089a";
import { rAndDInterfaceImplementation } from "./onr-v1/runner/hardware/r-d-interface";
import { ravenMicrocybEagleImplementation } from "./onr-v1/runner/hardware/raven-microcyb-eagle";
import { ravenMicrocybOwlImplementation } from "./onr-v1/runner/hardware/raven-microcyb-owl";
import { recordReconstructorImplementation } from "./onr-v1/runner/hardware/record-reconstructor";
import { techtronicaUtilitySuitImplementation } from "./onr-v1/runner/hardware/techtronica-utility-suit";
import { tychoMemChipImplementation } from "./onr-v1/runner/hardware/tycho-mem-chip";
import { wutechMemChipImplementation } from "./onr-v1/runner/hardware/wutech-mem-chip";
import { zetatechMemChipImplementation } from "./onr-v1/runner/hardware/zetatech-mem-chip";
import { zz22SpeedChipImplementation } from "./onr-v1/runner/hardware/zz22-speed-chip";
import { jackNJoeImplementation } from "./onr-v1/runner/preps/jack-n-joe";
import { livewiresContactsImplementation } from "./onr-v1/runner/preps/livewires-contacts";
import { privateLdlAccessImplementation } from "./onr-v1/runner/preps/private-ldl-access";
import { rompThroughHqImplementation } from "./onr-v1/runner/preps/romp-through-hq";
import { securityCodeWormChipImplementation } from "./onr-v1/runner/preps/security-code-worm-chip";
import { scoreImplementation } from "./onr-v1/runner/preps/score";
import { stumbleThroughWilderspaceImplementation } from "./onr-v1/runner/preps/stumble-through-wilderspace";
import { templeMicrocodeOutletImplementation } from "./onr-v1/runner/preps/temple-microcode-outlet";
import { weatherToFinancePipeImplementation } from "./onr-v1/runner/preps/weather-to-finance-pipe";
import { afreetImplementation } from "./onr-v1/runner/programs/afreet";
import { aiBoonImplementation } from "./onr-v1/runner/programs/ai-boon";
import { baedekersNetMapImplementation } from "./onr-v1/runner/programs/baedekers-net-map";
import { bakdoorImplementation } from "./onr-v1/runner/programs/bakdoor";
import { bartmossMemorialIcebreakerImplementation } from "./onr-v1/runner/programs/bartmoss-memorial-icebreaker";
import { blackDahliaImplementation } from "./onr-v1/runner/programs/black-dahlia";
import { blinkImplementation } from "./onr-v1/runner/programs/blink";
import { boardwalkImplementation } from "./onr-v1/runner/programs/boardwalk";
import { butcherBoyImplementation } from "./onr-v1/runner/programs/butcher-boy";
import { cascadeImplementation } from "./onr-v1/runner/programs/cascade";
import { cloakImplementation } from "./onr-v1/runner/programs/cloak";
import { codecrackerImplementation } from "./onr-v1/runner/programs/codecracker";
import { codeslingerImplementation } from "./onr-v1/runner/programs/codeslinger";
import { cockroachImplementation } from "./onr-v1/runner/programs/cockroach";
import { cyfermasterImplementation } from "./onr-v1/runner/programs/cyfermaster";
import { deepThoughtImplementation } from "./onr-v1/runner/programs/deep-thought";
import { dogcatcherImplementation } from "./onr-v1/runner/programs/dogcatcher";
import { droppImplementation } from "./onr-v1/runner/programs/dropp";
import { dupreImplementation } from "./onr-v1/runner/programs/dupre";
import { dwarfImplementation } from "./onr-v1/runner/programs/dwarf";
import { emergencySelfConstructImplementation } from "./onr-v1/runner/programs/emergency-self-construct";
import { evilTwinImplementation } from "./onr-v1/runner/programs/evil-twin";
import { expertScheduleAnalyzerImplementation } from "./onr-v1/runner/programs/expert-schedule-analyzer";
import { falseEchoImplementation } from "./onr-v1/runner/programs/false-echo";
import { flakImplementation } from "./onr-v1/runner/programs/flak";
import { forceShieldImplementation } from "./onr-v1/runner/programs/force-shield";
import { grubbImplementation } from "./onr-v1/runner/programs/grubb";
import { faitAccompliImplementation } from "./onr-v1/runner/programs/fait-accompli";
import { gremlinsImplementation } from "./onr-v1/runner/programs/gremlins";
import { hammerImplementation } from "./onr-v1/runner/programs/hammer";
import { impImplementation } from "./onr-v1/runner/programs/imp";
import { incubatorImplementation } from "./onr-v1/runner/programs/incubator";
import { invisibilityImplementation } from "./onr-v1/runner/programs/invisibility";
import { jackhammerImplementation } from "./onr-v1/runner/programs/jackhammer";
import { japaneseWaterTortureImplementation } from "./onr-v1/runner/programs/japanese-water-torture";
import { joanOfArcImplementation } from "./onr-v1/runner/programs/joan-of-arc";
import { krashImplementation } from "./onr-v1/runner/programs/krash";
import { loonyGoonImplementation } from "./onr-v1/runner/programs/loony-goon";
import { microtechAiInterfaceImplementation } from "./onr-v1/runner/programs/microtech-ai-interface";
import { mouseImplementation } from "./onr-v1/runner/programs/mouse";
import { mysteryBoxImplementation } from "./onr-v1/runner/programs/mystery-box";
import { netspaceInverterImplementation } from "./onr-v1/runner/programs/netspace-inverter";
import { newsgroupFilterImplementation } from "./onr-v1/runner/programs/newsgroup-filter";
import { pattelsVirusImplementation } from "./onr-v1/runner/programs/pattels-virus";
import { pileDriverImplementation } from "./onr-v1/runner/programs/pile-driver";
import { poltergeistImplementation } from "./onr-v1/runner/programs/poltergeist";
import { poxImplementation } from "./onr-v1/runner/programs/pox";
import { rAndDProtocolFilesImplementation } from "./onr-v1/runner/programs/r-d-protocol-files";
import { rafflesImplementation } from "./onr-v1/runner/programs/raffles";
import { rammingPistonImplementation } from "./onr-v1/runner/programs/ramming-piston";
import { raptorImplementation } from "./onr-v1/runner/programs/raptor";
import { reflectorImplementation } from "./onr-v1/runner/programs/reflector";
import { replicatorImplementation } from "./onr-v1/runner/programs/replicator";
import { scatterShotImplementation } from "./onr-v1/runner/programs/scatter-shot";
import { seeyaImplementation } from "./onr-v1/runner/programs/seeya";
import { selfModifyingCodeImplementation } from "./onr-v1/runner/programs/self-modifying-code";
import { shakaImplementation } from "./onr-v1/runner/programs/shaka";
import { shieldImplementation } from "./onr-v1/runner/programs/shield";
import { shredderUplinkProtocolImplementation } from "./onr-v1/runner/programs/shredder-uplink-protocol";
import { signpostImplementation } from "./onr-v1/runner/programs/signpost";
import { skivvissImplementation } from "./onr-v1/runner/programs/skivviss";
import { snowballImplementation } from "./onr-v1/runner/programs/snowball";
import { succubusImplementation } from "./onr-v1/runner/programs/succubus";
import { tinweaselImplementation } from "./onr-v1/runner/programs/tinweasel";
import { vewyVewyQuietImplementation } from "./onr-v1/runner/programs/vewy-vewy-quiet";
import { wildCardImplementation } from "./onr-v1/runner/programs/wild-card";
import { wizardsBookImplementation } from "./onr-v1/runner/programs/wizards-book";
import { wormImplementation } from "./onr-v1/runner/programs/worm";
import { zetatechSoftwareInstallerImplementation } from "./onr-v1/runner/programs/zetatech-software-installer";
import { accessThroughAlphaImplementation } from "./onr-v1/runner/resources/access-through-alpha";
import { accessToArasakaImplementation } from "./onr-v1/runner/resources/access-to-arasaka";
import { accessToKiribatiImplementation } from "./onr-v1/runner/resources/access-to-kiribati";
import { backDoorToHilliardImplementation } from "./onr-v1/runner/resources/back-door-to-hilliard";
import { backDoorToOrbitalAirImplementation } from "./onr-v1/runner/resources/back-door-to-orbital-air";
import { aujourdhuiImplementation } from "./onr-v1/runner/resources/aujourdhui";
import { danshisSecondIdImplementation } from "./onr-v1/runner/resources/danshis-second-id";
import { diplomaticImmunityImplementation } from "./onr-v1/runner/resources/diplomatic-immunity";
import { fallGuyImplementation } from "./onr-v1/runner/resources/fall-guy";
import { floatingRunnerBbsImplementation } from "./onr-v1/runner/resources/floating-runner-bbs";
import { brokerImplementation } from "./onr-v1/runner/resources/broker";
import { hellsRunImplementation } from "./onr-v1/runner/resources/hells-run";
import { junkyardBbsImplementation } from "./onr-v1/runner/resources/junkyard-bbs";
import { lelandCorporateBodyguardImplementation } from "./onr-v1/runner/resources/leland-corporate-bodyguard";
import { loanFromChibaImplementation } from "./onr-v1/runner/resources/loan-from-chiba";
import { nEtoImplementation } from "./onr-v1/runner/resources/n-e-t-o";
import { nomadAlliesImplementation } from "./onr-v1/runner/resources/nomad-allies";
import { riggedInvestmentsImplementation } from "./onr-v1/runner/resources/rigged-investments";
import { roninAroundImplementation } from "./onr-v1/runner/resources/ronin-around";
import { shortTermContractImplementation } from "./onr-v1/runner/resources/short-term-contract";
import { siliconSaloonFranchiseImplementation } from "./onr-v1/runner/resources/silicon-saloon-franchise";
import { technicianLoverImplementation } from "./onr-v1/runner/resources/technician-lover";
import { theSpringboardImplementation } from "./onr-v1/runner/resources/the-springboard";
import { theShortCircuitImplementation } from "./onr-v1/runner/resources/the-short-circuit";
import { topRunnersConferenceImplementation } from "./onr-v1/runner/resources/top-runners-conference";
import { traumaTeamImplementation } from "./onr-v1/runner/resources/trauma-team";
import { umbrellaPolicyImplementation } from "./onr-v1/runner/resources/umbrella-policy";
import type { CardImplementationDefinition } from "./types";

export const CARD_IMPLEMENTATIONS = [
  allNighterImplementation,
  arasakaOwnsYouImplementation,
  bodyweightSyntheticBloodImplementation,
  coreCommandJettisonIceImplementation,
  custodialPositionImplementation,
  editedShippingManifestsImplementation,
  executiveWiretapsImplementation,
  forgedActivationOrdersImplementation,
  forgottenBackupChipImplementation,
  gideonsPawnshopImplementation,
  huntClubBbsImplementation,
  iceAndDatasGuideToTheNetImplementation,
  ifYouWantItDoneRightImplementation,
  insideJobImplementation,
  jackNJoeImplementation,
  kilroyWasHereImplementation,
  livewiresContactsImplementation,
  mantisFixerAtLargeImplementation,
  miscForSaleImplementation,
  mitWestTierImplementation,
  openEndedMileageProgramImplementation,
  organDonorImplementation,
  priorityWreckImplementation,
  privateLdlAccessImplementation,
  rompThroughHqImplementation,
  securityCodeWormChipImplementation,
  sneakPreviewImplementation,
  templeMicrocodeOutletImplementation,
  stumbleThroughWilderspaceImplementation,
  totalGeneticRetrofitImplementation,
  weatherToFinancePipeImplementation,
  afreetImplementation,
  aiBoonImplementation,
  baedekersNetMapImplementation,
  bakdoorImplementation,
  bartmossMemorialIcebreakerImplementation,
  blackDahliaImplementation,
  blinkImplementation,
  boardwalkImplementation,
  butcherBoyImplementation,
  cascadeImplementation,
  cloakImplementation,
  codecrackerImplementation,
  codeslingerImplementation,
  cockroachImplementation,
  cyfermasterImplementation,
  deepThoughtImplementation,
  dogcatcherImplementation,
  droppImplementation,
  dupreImplementation,
  dwarfImplementation,
  emergencySelfConstructImplementation,
  evilTwinImplementation,
  expertScheduleAnalyzerImplementation,
  falseEchoImplementation,
  flakImplementation,
  forceShieldImplementation,
  grubbImplementation,
  faitAccompliImplementation,
  gremlinsImplementation,
  hammerImplementation,
  impImplementation,
  incubatorImplementation,
  invisibilityImplementation,
  jackhammerImplementation,
  japaneseWaterTortureImplementation,
  joanOfArcImplementation,
  krashImplementation,
  loonyGoonImplementation,
  microtechAiInterfaceImplementation,
  mouseImplementation,
  mysteryBoxImplementation,
  netspaceInverterImplementation,
  newsgroupFilterImplementation,
  pattelsVirusImplementation,
  pileDriverImplementation,
  poltergeistImplementation,
  poxImplementation,
  rAndDProtocolFilesImplementation,
  rafflesImplementation,
  rammingPistonImplementation,
  raptorImplementation,
  reflectorImplementation,
  replicatorImplementation,
  scatterShotImplementation,
  seeyaImplementation,
  selfModifyingCodeImplementation,
  shakaImplementation,
  shieldImplementation,
  shredderUplinkProtocolImplementation,
  signpostImplementation,
  skivvissImplementation,
  snowballImplementation,
  succubusImplementation,
  tinweaselImplementation,
  vewyVewyQuietImplementation,
  wildCardImplementation,
  wizardsBookImplementation,
  wormImplementation,
  zetatechSoftwareInstallerImplementation,
  accessThroughAlphaImplementation,
  accessToArasakaImplementation,
  accessToKiribatiImplementation,
  backDoorToHilliardImplementation,
  backDoorToOrbitalAirImplementation,
  aujourdhuiImplementation,
  danshisSecondIdImplementation,
  diplomaticImmunityImplementation,
  fallGuyImplementation,
  brokerImplementation,
  floatingRunnerBbsImplementation,
  hellsRunImplementation,
  junkyardBbsImplementation,
  lelandCorporateBodyguardImplementation,
  loanFromChibaImplementation,
  nEtoImplementation,
  nomadAlliesImplementation,
  roninAroundImplementation,
  arasakaPortablePrototypeImplementation,
  armadilloArmoredRoadHomeImplementation,
  armoredFridgeImplementation,
  artemis2020Implementation,
  bodyweightDataCrecheImplementation,
  corollaSpeedChipImplementation,
  dermatechBodyplatingImplementation,
  drifterMobileEnvironmentImplementation,
  fullBodyConversionImplementation,
  greenKnightSurgeBuffersImplementation,
  hqInterfaceImplementation,
  lifesaverNanosurgeonsImplementation,
  militechMramChipImplementation,
  mramChipImplementation,
  nasukoCycleImplementation,
  pandorasDeckImplementation,
  parraline5750Implementation,
  pk6089aImplementation,
  rAndDInterfaceImplementation,
  ravenMicrocybEagleImplementation,
  ravenMicrocybOwlImplementation,
  recordReconstructorImplementation,
  techtronicaUtilitySuitImplementation,
  riggedInvestmentsImplementation,
  scoreImplementation,
  shortTermContractImplementation,
  siliconSaloonFranchiseImplementation,
  technicianLoverImplementation,
  theSpringboardImplementation,
  theShortCircuitImplementation,
  topRunnersConferenceImplementation,
  traumaTeamImplementation,
  umbrellaPolicyImplementation,
  artificialSecurityDirectorsImplementation,
  aiChiefFinancialOfficerImplementation,
  bioweaponsEngineeringImplementation,
  blackIceQualityAssuranceImplementation,
  corporateBoonImplementation,
  corporateCoupImplementation,
  corporateDownsizingImplementation,
  corporateRetreatImplementation,
  corporateWarImplementation,
  dataFortReclamationImplementation,
  detroitPoliceContractImplementation,
  employeeEmpowermentImplementation,
  encryptionBreakthroughImplementation,
  executiveExtractionImplementation,
  geneticsVisionaryAcquisitionImplementation,
  hostileTakeoverImplementation,
  iceTransmutationImplementation,
  mainOfficeRelocationImplementation,
  marineArcologyImplementation,
  netwatchOperationsOfficeImplementation,
  onCallSoloTeamImplementation,
  politicalCoupImplementation,
  politicalOverthrowImplementation,
  polymerBreakthroughImplementation,
  privateCybernetPoliceImplementation,
  priorityRequisitionImplementation,
  projectBabylonImplementation,
  securityNetOptimizationImplementation,
  securityPurgeImplementation,
  strikeForceKaliImplementation,
  subsidiaryBranchImplementation,
  superiorNetBarriersImplementation,
  accountsReceivableImplementation,
  annualReviewsImplementation,
  auditOfCallRecordsImplementation,
  chanceObservationImplementation,
  closedAccountsImplementation,
  corporateDetectiveAgencyImplementation,
  datapoolByZetatechImplementation,
  dayShiftImplementation,
  edgerunnerIncTempsImplementation,
  efficiencyExpertsImplementation,
  falsifiedTransactionsExpertImplementation,
  managementShakeUpImplementation,
  netwatchCreditVoucherImplementation,
  nightShiftImplementation,
  offSiteBackupsImplementation,
  overtimeIncentivesImplementation,
  planningConsultantsImplementation,
  powerGridOverloadImplementation,
  projectConsultantsImplementation,
  punitiveCounterstrikeImplementation,
  scorchedEarthImplementation,
  silverLiningRecoveryProtocolImplementation,
  systematicLayoffsImplementation,
  teamRestructuringImplementation,
  trojanHorseImplementation,
  urbanRenewalImplementation,
  bbsWhisperingCampaignImplementation,
  bloodCatImplementation,
  braindanceCampaignImplementation,
  chicagoBranchImplementation,
  corporateNegotiatingCenterImplementation,
  corprunnersShatteredRemainsImplementation,
  cowboySysopImplementation,
  dataMasonsHostingImplementation,
  departmentOfTruthEnhancementImplementation,
  disinfectantIncImplementation,
  encoderIncImplementation,
  esaContractImplementation,
  euromarketConsortiumImplementation,
  experimentalAiImplementation,
  fortressArchitectsImplementation,
  holovidCampaignImplementation,
  informationLaunderingImplementation,
  krumzImplementation,
  newsgroupTauntingImplementation,
  omniscienceFoundationImplementation,
  pacificaRegionalAiImplementation,
  reschedulerImplementation,
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
  zz22SpeedChipImplementation,
  antiquatedInterfaceRoutinesImplementation,
  chesterMixImplementation,
  chimeraImplementation,
  crystalPalaceStationGridImplementation,
  dedicatedResponseTeamImplementation,
  dieterEsslinImplementation,
  jerusalemCityGridImplementation,
  newGalvestonCityGridImplementation,
  oliviaSalazarImplementation,
  omniKismetPhDImplementation,
  redHerringsImplementation,
  singaporeCityGridImplementation,
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
