import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import snapshotData from "../../../data/card-import/card-snapshot-0.5.json";
import snapshotData08 from "../../../data/card-import/card-snapshot-0.8.json";
import pipelineSnapshotData from "../../../data/card-import/card-pipeline-snapshot-1.3.1.json";
import sourceRegistry131Data from "../../../data/card-import/source-registry-1.3.1.json";
import aiHints131Data from "../../../data/ai/ai-card-hints-1.3.1.json";
import aiHintsReport131Data from "../../../data/ai/ai-card-hints-report-1.3.1.json";
import cardImplementationManifest123Data from "../../../data/manifests/card-implementation-manifest-1.2.3.json";
import cardImplementationManifest1910Data from "../../../data/manifests/card-implementation-manifest-1.9.10.json";
import cardImplementationManifest1911Data from "../../../data/manifests/card-implementation-manifest-1.9.11.json";
import cardImplementationManifest1912Data from "../../../data/manifests/card-implementation-manifest-1.9.12.json";
import cardImplementationManifest1913Data from "../../../data/manifests/card-implementation-manifest-1.9.13.json";
import cardImplementationManifest1914Data from "../../../data/manifests/card-implementation-manifest-1.9.14.json";
import cardImplementationManifest1915Data from "../../../data/manifests/card-implementation-manifest-1.9.15.json";
import cardImplementationManifest1916Data from "../../../data/manifests/card-implementation-manifest-1.9.16.json";
import cardImplementationManifest1917Data from "../../../data/manifests/card-implementation-manifest-1.9.17.json";
import cardImplementationManifest1918Data from "../../../data/manifests/card-implementation-manifest-1.9.18.json";
import cardImplementationManifest1919Data from "../../../data/manifests/card-implementation-manifest-1.9.19.json";
import cardImplementationManifest1920Data from "../../../data/manifests/card-implementation-manifest-1.9.20.json";
import cardImplementationManifest1921Data from "../../../data/manifests/card-implementation-manifest-1.9.21.json";
import cardImplementationManifest1922Data from "../../../data/manifests/card-implementation-manifest-1.9.22.json";
import cardSupportManifest131Data from "../../../data/manifests/card-support-manifest-1.3.1.json";
import v1910StatusScenarioData from "../../../data/scenarios/v1910-status-manifest-catalog-smoke.json";
import v1911ReleaseScenarioData from "../../../data/scenarios/v1911-hidden-zone-release-smoke.json";
import v1912WipScenarioData from "../../../data/scenarios/v1912-counter-virus-recurring-wip-smoke.json";
import v1913ReleaseScenarioData from "../../../data/scenarios/v1913-damage-prevention-replacement-smoke.json";
import v1914ReleaseScenarioData from "../../../data/scenarios/v1914-trace-tag-resource-smoke.json";
import v1915ReleaseScenarioData from "../../../data/scenarios/v1915-run-access-multiaccess-smoke.json";
import v1916ReleaseScenarioData from "../../../data/scenarios/v1916-program-subtype-hosting-stealth-smoke.json";
import v1917ReleaseScenarioData from "../../../data/scenarios/v1917-generic-asset-node-release-smoke.json";
import v1918ReleaseScenarioData from "../../../data/scenarios/v1918-generic-upgrade-root-server-release-smoke.json";
import v1919ReleaseScenarioData from "../../../data/scenarios/v1919-agenda-overadvance-release-smoke.json";
import v1920ReleaseScenarioData from "../../../data/scenarios/v1920-global-modifier-special-state-release-smoke.json";
import v1921ReleaseScenarioData from "../../../data/scenarios/v1921-deterministic-random-release-smoke.json";
import v1922ReleaseScenarioData from "../../../data/scenarios/v1922-per-card-longtail-release-smoke.json";
import pipelineReport131Data from "../../../data/reports/card-pipeline-report-1.3.1.json";
import diffReport131Data from "../../../data/reports/card-pipeline-diff-report-1.3.1.json";
import rollbackReport131Data from "../../../data/reports/card-pipeline-rollback-report-1.3.1.json";
import v1910RuntimeStatusReportData from "../../../data/reports/onr-v1-runtime-status-1.9.10.json";
import v1922CompletionGateStatusData from "../../../data/reports/v1922-completion-gate-status.json";
import v1910MechanicsCoverageData from "../../../data/rules/mechanics-coverage-1.9.10.json";
import v1911MechanicsCoverageData from "../../../data/rules/mechanics-coverage-1.9.11.json";
import v1912MechanicsCoverageData from "../../../data/rules/mechanics-coverage-1.9.12.json";
import v1913MechanicsCoverageData from "../../../data/rules/mechanics-coverage-1.9.13.json";
import v1914MechanicsCoverageData from "../../../data/rules/mechanics-coverage-1.9.14.json";
import v1915MechanicsCoverageData from "../../../data/rules/mechanics-coverage-1.9.15.json";
import v1916MechanicsCoverageData from "../../../data/rules/mechanics-coverage-1.9.16.json";
import v1917MechanicsCoverageData from "../../../data/rules/mechanics-coverage-1.9.17.json";
import v1918MechanicsCoverageData from "../../../data/rules/mechanics-coverage-1.9.18.json";
import v1919MechanicsCoverageData from "../../../data/rules/mechanics-coverage-1.9.19.json";
import v1920MechanicsCoverageData from "../../../data/rules/mechanics-coverage-1.9.20.json";
import v1921MechanicsCoverageData from "../../../data/rules/mechanics-coverage-1.9.21.json";
import v1922MechanicsCoverageData from "../../../data/rules/mechanics-coverage-1.9.22.json";
import v1922ResolverContractInventoryData from "../../../data/rules/v1922-resolver-contract-inventory.json";
import v1922ResolverContractsData from "../../../data/rules/v1922-resolver-contracts.json";
import v1922LocalResolverWorkingBasisData from "../../../data/rules/v1922-local-resolver-working-basis.json";
import v1922LocalCardFactsData from "../../../data/rules/v1922-local-card-facts.json";
import onrV1AttributeConflictDecisionsData from "../../../data/rules/onr-v1-card-attribute-conflict-decisions-2026-05-13.json";
import catalogIndexData from "../../../data/card-import/catalog-index-0.5.json";
import {
  corpTagSliceManifestData,
  corpTagSliceScenarioData,
  deckLegalBatchAManifestData,
  deckLegalBatchAScenarioData,
  deckLegalLegacyOpen64ManifestData,
  deckLegalLegacyOpen64ScenarioData,
  deckLegalV190ManifestData,
  deckLegalV190ScenarioData,
  deckLegalV191V194ManifestData,
  deckLegalV191V194ScenarioData,
  deckLegalV195V198ManifestData,
  deckLegalV195V198ScenarioData,
  deckLegalV199ManifestData,
  deckLegalV199ScenarioData,
  deckLegalV1911ManifestData,
  deckLegalV1911ScenarioData,
  deckLegalV1912ManifestData,
  deckLegalV1912ScenarioData,
  deckLegalV1913ManifestData,
  deckLegalV1913ScenarioData,
  deckLegalV1914ManifestData,
  deckLegalV1914ScenarioData,
  deckLegalV1915ManifestData,
  deckLegalV1915ScenarioData,
  deckLegalV1916ManifestData,
  deckLegalV1916ScenarioData,
  deckLegalV1917ManifestData,
  deckLegalV1917ScenarioData,
  deckLegalV1918ManifestData,
  deckLegalV1918ScenarioData,
  deckLegalV1919ManifestData,
  deckLegalV1919ScenarioData,
  deckLegalV1920ManifestData,
  deckLegalV1920ScenarioData,
  deckLegalV1921ManifestData,
  deckLegalV1921ScenarioData,
  deckLegalV1922ManifestData,
  deckLegalV1922ScenarioData,
  deckLegalV161V170ManifestData,
  deckLegalV161V170ScenarioData,
  deckLegalV171V181Open64ManifestData,
  deckLegalV171V181Open64ScenarioData,
  kingOfTheRoadManifestData,
  kingOfTheRoadScenarioData,
} from "./test-fixtures/ai-approval-gates";
import {
  corpTagSliceAiHintsData,
  deckLegalBatchAAiHintsData,
  deckLegalLegacyOpen64AiHintsData,
  deckLegalV190AiHintsData,
  deckLegalV191V194AiHintsData,
  deckLegalV195V198AiHintsData,
  deckLegalV199AiHintsData,
  deckLegalV1911AiHintsData,
  deckLegalV1912AiHintsData,
  deckLegalV1913AiHintsData,
  deckLegalV1914AiHintsData,
  deckLegalV1915AiHintsData,
  deckLegalV1916AiHintsData,
  deckLegalV1917AiHintsData,
  deckLegalV1918AiHintsData,
  deckLegalV1919AiHintsData,
  deckLegalV1920AiHintsData,
  deckLegalV1921AiHintsData,
  deckLegalV1922AiHintsData,
  deckLegalV161V170AiHintsData,
  deckLegalV171V181Open64AiHintsData,
  kingOfTheRoadAiHintsData,
} from "./test-fixtures/ai-approval-hints";
import {
  assertPipelinePayloadSafe,
  assertCatalogPayloadSafe,
  CATALOG_AI_APPROVAL_BATCHES,
  activeAiApprovedCardIds,
  activeRuntimeCardIds,
  aiApprovalByCardId,
  cardFactsById,
  computeCardPipelineSnapshotHash,
  computeSnapshotHash,
  createCatalogIndex,
  createAiCardHintsV2,
  createCardPipelineReport,
  createCardPipelineSnapshot,
  createCardRarityImportReport,
  createPipelineRollbackReport,
  createRuntimeCardSnapshot,
  DECK_LEGAL_AI_APPROVAL_CORP_TAG_SLICE_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_LEGACY_OPEN64_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V190_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V191_TO_V194_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V195_TO_V198_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V199_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V1911_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V1912_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V1913_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V1914_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V1915_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V1916_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V1917_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V1918_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V1919_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V1920_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V1921_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V1922_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V161_TO_V170_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V171_TO_V181_OPEN64_CARD_IDS,
  createRuntimeCardsById,
  DECK_LEGAL_AI_APPROVAL_BATCH_A_CARD_IDS,
  KING_OF_THE_ROAD_AI_APPROVED_CARD_IDS,
  createSourceRegistryV2,
  diffCardPipelineSnapshots,
  getCatalogCard,
  ONR_V1_0_5K_RELEASE_CARD_IDS,
  ONR_V1_0_6K_RELEASE_CARD_IDS,
  ONR_V1_1_2K_RELEASE_CARD_IDS,
  ONR_V1_2_3_RELEASE_CARD_IDS,
  ONR_V1_6_1_RELEASE_CARD_IDS,
  ONR_V1_6_2_RELEASE_CARD_IDS,
  ONR_V1_6_3_RELEASE_CARD_IDS,
  ONR_V1_7_0_RELEASE_CARD_IDS,
  ONR_V1_7_1_RELEASE_CARD_IDS,
  ONR_V1_7_2_RELEASE_CARD_IDS,
  ONR_V1_8_0_RELEASE_CARD_IDS,
  ONR_V1_8_1_RELEASE_CARD_IDS,
  ONR_V1_9_0_RELEASE_CARD_IDS,
  ONR_V1_9_1_RELEASE_CARD_IDS,
  ONR_V1_9_2_RELEASE_CARD_IDS,
  ONR_V1_9_3_RELEASE_CARD_IDS,
  ONR_V1_9_4_RELEASE_CARD_IDS,
  ONR_V1_9_5_RELEASE_CARD_IDS,
  ONR_V1_9_6_RELEASE_CARD_IDS,
  ONR_V1_9_7_RELEASE_CARD_IDS,
  ONR_V1_9_8_RELEASE_CARD_IDS,
  ONR_V1_9_9_RELEASE_CARD_IDS,
  ONR_V1_9_11_RELEASE_CARD_IDS,
  ONR_V1_9_12_RELEASE_CARD_IDS,
  ONR_V1_9_13_RELEASE_CARD_IDS,
  ONR_V1_9_14_RELEASE_CARD_IDS,
  ONR_V1_9_15_RELEASE_CARD_IDS,
  ONR_V1_9_16_RELEASE_CARD_IDS,
  ONR_V1_9_17_RELEASE_CARD_IDS,
  ONR_V1_9_18_RELEASE_CARD_IDS,
  ONR_V1_9_19_RELEASE_CARD_IDS,
  ONR_V1_9_20_RELEASE_CARD_IDS,
  ONR_V1_9_21_RELEASE_CARD_IDS,
  ONR_V1_9_22_RELEASE_CARD_IDS,
  ONR_V1_9_12_WIP_CARD_IDS,
  ONR_V1_9_13_WIP_CARD_IDS,
  ONR_V1_9_14_WIP_CARD_IDS,
  ONR_V1_9_15_WIP_CARD_IDS,
  ONR_V1_9_16_WIP_CARD_IDS,
  ONR_V1_9_17_WIP_CARD_IDS,
  ONR_V1_9_18_WIP_CARD_IDS,
  ONR_V1_9_19_WIP_CARD_IDS,
  ONR_V1_9_20_WIP_CARD_IDS,
  ONR_V1_9_21_WIP_CARD_IDS,
  ONR_V1_9_22_WIP_CARD_IDS,
  ONR_V1_RUNTIME_RELEASE_CARD_IDS,
  releaseEvidenceByCardId,
  readProjectCardRaritySources,
  runtimeGateByCardId,
  searchCatalog,
  validateAiCardHintsV2,
  validateCardPipelineSnapshot,
  validateSnapshot,
  validateSourceRegistryV2,
  type AiCardHintsV2,
  type CardPipelineSnapshot,
  type CardSnapshot,
} from "./index";
import { buildAiApprovedCardIds } from "./gate-evidence";

const snapshot = snapshotData as unknown as CardSnapshot;
const snapshot08 = snapshotData08 as unknown as CardSnapshot;
const pipelineSnapshot131 =
  pipelineSnapshotData as unknown as CardPipelineSnapshot;
const aiHints131 = aiHints131Data as unknown as AiCardHintsV2;
const runtimeSupplementAiHintsData = { cards: [] };

type CardsScenarioAiApprovalCase = {
  title: string;
  cardIds: readonly string[];
  expectedCount: number;
  expectedScenarioId: string;
  hintsData: AiCardHintsV2;
  manifestData: {
    cards: Array<{ cardId: string; status: string; scenarioRefs: string[] }>;
  };
  scenarioData: {
    id?: string;
    scenarios: Array<{ cards?: string[]; coversCards?: string[] }>;
    completionGate?: { aiSupported?: boolean };
  };
  implementationManifestData?: {
    cards: Array<{
      cardCode: string;
      releaseStatus: string;
      aiSupported: boolean;
      resolverFamily: string;
    }>;
    gateAssertions?: Record<string, unknown>;
  };
  releaseCardIds?: readonly string[];
  wipCardIds?: readonly string[];
  releaseScenarioData?: {
    additionalCards?: string[];
    coversCards?: string[];
  };
  releaseScenarioCardField?: "additionalCards" | "coversCards";
  mechanicsCoverageData?: {
    gateAssertions: Record<string, unknown>;
  };
  expectedImplementationManifestGateAssertions?: Record<string, unknown>;
  expectedMechanicsGateAssertions?: Record<string, unknown>;
  expectedResolverFamily?: (cardId: string) => string;
  expectedResolverFamilyIncludes?: string;
  expectedHintRequiredMechanic?: string;
  requireRuntimeReleaseGate?: boolean;
  requireNoWipText?: boolean;
  requireNoSupplementalHints?: boolean;
  expectedImplementationManifestVersion?: string;
};

const CARDS_SCENARIO_AI_APPROVAL_CASES: CardsScenarioAiApprovalCase[] = [
  {
    title:
      "approves Batch A Runner Rig Low Risk cards only after catalog, hint and scenario gates",
    cardIds: DECK_LEGAL_AI_APPROVAL_BATCH_A_CARD_IDS,
    expectedCount: 8,
    expectedScenarioId: "ai-runner-rig-low-risk-batch-a-smokes",
    hintsData: deckLegalBatchAAiHintsData,
    manifestData:
      deckLegalBatchAManifestData as CardsScenarioAiApprovalCase["manifestData"],
    scenarioData:
      deckLegalBatchAScenarioData as CardsScenarioAiApprovalCase["scenarioData"],
    requireNoSupplementalHints: true,
  },
  {
    title:
      "approves the Corp Tag slice only after catalog, hint and scenario gates",
    cardIds: DECK_LEGAL_AI_APPROVAL_CORP_TAG_SLICE_CARD_IDS,
    expectedCount: 6,
    expectedScenarioId: "ai-corp-tag-approval-slice-smokes",
    hintsData: corpTagSliceAiHintsData,
    manifestData:
      corpTagSliceManifestData as CardsScenarioAiApprovalCase["manifestData"],
    scenarioData:
      corpTagSliceScenarioData as CardsScenarioAiApprovalCase["scenarioData"],
  },
  {
    title:
      "approves the V1.6.1 to V1.7.0 deck-legal slice only after catalog, hint and scenario gates",
    cardIds: DECK_LEGAL_AI_APPROVAL_V161_TO_V170_CARD_IDS,
    expectedCount: 21,
    expectedScenarioId: "ai-deck-legal-v161-v170-smokes",
    hintsData: deckLegalV161V170AiHintsData,
    manifestData:
      deckLegalV161V170ManifestData as CardsScenarioAiApprovalCase["manifestData"],
    scenarioData:
      deckLegalV161V170ScenarioData as CardsScenarioAiApprovalCase["scenarioData"],
    requireNoSupplementalHints: true,
  },
  {
    title:
      "approves the V1.7.1 to V1.8.1 open64 slice only after catalog, hint and scenario gates",
    cardIds: DECK_LEGAL_AI_APPROVAL_V171_TO_V181_OPEN64_CARD_IDS,
    expectedCount: 28,
    expectedScenarioId: "ai-deck-legal-v171-v181-open64-smokes",
    hintsData: deckLegalV171V181Open64AiHintsData,
    manifestData:
      deckLegalV171V181Open64ManifestData as CardsScenarioAiApprovalCase["manifestData"],
    scenarioData:
      deckLegalV171V181Open64ScenarioData as CardsScenarioAiApprovalCase["scenarioData"],
  },
  {
    title:
      "approves the legacy open64 slice only after catalog, hint and scenario gates",
    cardIds: DECK_LEGAL_AI_APPROVAL_LEGACY_OPEN64_CARD_IDS,
    expectedCount: 36,
    expectedScenarioId: "ai-deck-legal-legacy-open64-smokes",
    hintsData: deckLegalLegacyOpen64AiHintsData,
    manifestData:
      deckLegalLegacyOpen64ManifestData as CardsScenarioAiApprovalCase["manifestData"],
    scenarioData:
      deckLegalLegacyOpen64ScenarioData as CardsScenarioAiApprovalCase["scenarioData"],
    requireNoSupplementalHints: true,
  },
  {
    title:
      "approves the V1.9.0 release slice only after catalog, hint and scenario gates",
    cardIds: DECK_LEGAL_AI_APPROVAL_V190_CARD_IDS,
    expectedCount: 5,
    expectedScenarioId: "ai-deck-legal-v190-smokes",
    hintsData: deckLegalV190AiHintsData,
    manifestData:
      deckLegalV190ManifestData as CardsScenarioAiApprovalCase["manifestData"],
    scenarioData:
      deckLegalV190ScenarioData as CardsScenarioAiApprovalCase["scenarioData"],
  },
  {
    title:
      "approves the V1.9.1 to V1.9.4 release slice only after catalog, hint and scenario gates",
    cardIds: DECK_LEGAL_AI_APPROVAL_V191_TO_V194_CARD_IDS,
    expectedCount: 16,
    expectedScenarioId: "ai-deck-legal-v191-v194-smokes",
    hintsData: deckLegalV191V194AiHintsData,
    manifestData:
      deckLegalV191V194ManifestData as CardsScenarioAiApprovalCase["manifestData"],
    scenarioData:
      deckLegalV191V194ScenarioData as CardsScenarioAiApprovalCase["scenarioData"],
  },
  {
    title:
      "approves the V1.9.5 to V1.9.8 release slice only after catalog, hint and scenario gates",
    cardIds: DECK_LEGAL_AI_APPROVAL_V195_TO_V198_CARD_IDS,
    expectedCount: 6,
    expectedScenarioId: "ai-deck-legal-v195-v198-smokes",
    hintsData: deckLegalV195V198AiHintsData,
    manifestData:
      deckLegalV195V198ManifestData as CardsScenarioAiApprovalCase["manifestData"],
    scenarioData:
      deckLegalV195V198ScenarioData as CardsScenarioAiApprovalCase["scenarioData"],
  },
  {
    title:
      "approves the V1.9.9 upgrade slice only after catalog, hint and scenario gates",
    cardIds: DECK_LEGAL_AI_APPROVAL_V199_CARD_IDS,
    expectedCount: 4,
    expectedScenarioId: "ai-deck-legal-v199-smokes",
    hintsData: deckLegalV199AiHintsData,
    manifestData:
      deckLegalV199ManifestData as CardsScenarioAiApprovalCase["manifestData"],
    scenarioData:
      deckLegalV199ScenarioData as CardsScenarioAiApprovalCase["scenarioData"],
    expectedImplementationManifestVersion:
      "card-implementation-manifest-v1.9.9",
  },
  {
    title:
      "approves the hidden-zone search/reveal/reorder slice only after catalog, manifest, hint and scenario gates",
    cardIds: DECK_LEGAL_AI_APPROVAL_V1911_CARD_IDS,
    releaseCardIds: ONR_V1_9_11_RELEASE_CARD_IDS,
    expectedCount: 16,
    expectedScenarioId: "ai-deck-legal-v1911-smokes",
    hintsData: deckLegalV1911AiHintsData,
    manifestData:
      deckLegalV1911ManifestData as CardsScenarioAiApprovalCase["manifestData"],
    scenarioData:
      deckLegalV1911ScenarioData as CardsScenarioAiApprovalCase["scenarioData"],
    implementationManifestData:
      cardImplementationManifest1911Data as NonNullable<
        CardsScenarioAiApprovalCase["implementationManifestData"]
      >,
    releaseScenarioData: v1911ReleaseScenarioData as NonNullable<
      CardsScenarioAiApprovalCase["releaseScenarioData"]
    >,
    releaseScenarioCardField: "additionalCards",
    mechanicsCoverageData: v1911MechanicsCoverageData as NonNullable<
      CardsScenarioAiApprovalCase["mechanicsCoverageData"]
    >,
    expectedImplementationManifestVersion:
      "card-implementation-manifest-v1.9.11",
    expectedMechanicsGateAssertions: {
      hiddenZoneSearchRevealReorderResolverImplemented: true,
    },
    expectedResolverFamily: (cardId) =>
      cardId === "onr_v1_089_gideons-pawnshop"
        ? "trash_recovery_resolver"
        : cardId === "onr_v1_110_sneak-preview"
          ? "heap_or_stack_temporary_program_install_resolver"
          : "hidden_zone_search_reveal_reorder_resolver",
  },
  {
    title:
      "approves the counter/recurring slice only after catalog, manifest, hint and scenario gates",
    cardIds: DECK_LEGAL_AI_APPROVAL_V1912_CARD_IDS,
    releaseCardIds: ONR_V1_9_12_RELEASE_CARD_IDS,
    wipCardIds: ONR_V1_9_12_WIP_CARD_IDS,
    expectedCount: 11,
    expectedScenarioId: "ai-deck-legal-v1912-smokes",
    hintsData: deckLegalV1912AiHintsData,
    manifestData:
      deckLegalV1912ManifestData as CardsScenarioAiApprovalCase["manifestData"],
    scenarioData:
      deckLegalV1912ScenarioData as CardsScenarioAiApprovalCase["scenarioData"],
    implementationManifestData:
      cardImplementationManifest1912Data as NonNullable<
        CardsScenarioAiApprovalCase["implementationManifestData"]
      >,
    releaseScenarioData: v1912WipScenarioData as NonNullable<
      CardsScenarioAiApprovalCase["releaseScenarioData"]
    >,
    mechanicsCoverageData: v1912MechanicsCoverageData as NonNullable<
      CardsScenarioAiApprovalCase["mechanicsCoverageData"]
    >,
    expectedImplementationManifestVersion:
      "card-implementation-manifest-v1.9.12",
    expectedImplementationManifestGateAssertions: {
      allCardsHumanPlayable: true,
      allCardsDeckLegal: true,
      allCardsAiSupported: true,
    },
    expectedMechanicsGateAssertions: {
      typedCounterVirusPurgeResolverImplemented: true,
      recurringPoolStartTurnResolverImplemented: true,
    },
    requireRuntimeReleaseGate: true,
  },
  {
    title:
      "approves the damage/prevention slice only after catalog, manifest, hint and scenario gates",
    cardIds: DECK_LEGAL_AI_APPROVAL_V1913_CARD_IDS,
    releaseCardIds: ONR_V1_9_13_RELEASE_CARD_IDS,
    wipCardIds: ONR_V1_9_13_WIP_CARD_IDS,
    expectedCount: 17,
    expectedScenarioId: "ai-deck-legal-v1913-smokes",
    hintsData: deckLegalV1913AiHintsData,
    manifestData:
      deckLegalV1913ManifestData as CardsScenarioAiApprovalCase["manifestData"],
    scenarioData:
      deckLegalV1913ScenarioData as CardsScenarioAiApprovalCase["scenarioData"],
    implementationManifestData:
      cardImplementationManifest1913Data as NonNullable<
        CardsScenarioAiApprovalCase["implementationManifestData"]
      >,
    releaseScenarioData: v1913ReleaseScenarioData as NonNullable<
      CardsScenarioAiApprovalCase["releaseScenarioData"]
    >,
    mechanicsCoverageData: v1913MechanicsCoverageData as NonNullable<
      CardsScenarioAiApprovalCase["mechanicsCoverageData"]
    >,
    expectedImplementationManifestVersion:
      "card-implementation-manifest-v1.9.13",
    expectedImplementationManifestGateAssertions: {
      allCardsHumanPlayable: true,
      allCardsDeckLegal: true,
      allCardsAiSupported: true,
    },
    expectedMechanicsGateAssertions: {
      eventModificationPreventionAvoidResolverImplemented: true,
      damageEventPreventionResolverImplemented: true,
    },
    requireRuntimeReleaseGate: true,
  },
  {
    title:
      "approves the trace/tag/resource slice only after catalog, manifest, hint and scenario gates",
    cardIds: DECK_LEGAL_AI_APPROVAL_V1914_CARD_IDS,
    releaseCardIds: ONR_V1_9_14_RELEASE_CARD_IDS,
    wipCardIds: ONR_V1_9_14_WIP_CARD_IDS,
    expectedCount: 25,
    expectedScenarioId: "ai-deck-legal-v1914-smokes",
    hintsData: deckLegalV1914AiHintsData,
    manifestData:
      deckLegalV1914ManifestData as CardsScenarioAiApprovalCase["manifestData"],
    scenarioData:
      deckLegalV1914ScenarioData as CardsScenarioAiApprovalCase["scenarioData"],
    implementationManifestData:
      cardImplementationManifest1914Data as NonNullable<
        CardsScenarioAiApprovalCase["implementationManifestData"]
      >,
    releaseScenarioData: v1914ReleaseScenarioData as NonNullable<
      CardsScenarioAiApprovalCase["releaseScenarioData"]
    >,
    mechanicsCoverageData: v1914MechanicsCoverageData as NonNullable<
      CardsScenarioAiApprovalCase["mechanicsCoverageData"]
    >,
    expectedImplementationManifestVersion:
      "card-implementation-manifest-v1.9.14",
    expectedImplementationManifestGateAssertions: {
      allCardsHumanPlayable: true,
      allCardsDeckLegal: true,
      allCardsAiSupported: true,
    },
    expectedMechanicsGateAssertions: {
      traceLinkBidWindowResolverImplemented: true,
      resourceTagInteractionResolverImplemented: true,
      tagConditionAvoidRemoveResolverImplemented: true,
    },
    requireRuntimeReleaseGate: true,
    requireNoWipText: true,
  },
  {
    title:
      "approves the run/access slice only after catalog, manifest, hint and scenario gates",
    cardIds: DECK_LEGAL_AI_APPROVAL_V1915_CARD_IDS,
    releaseCardIds: ONR_V1_9_15_RELEASE_CARD_IDS,
    wipCardIds: ONR_V1_9_15_WIP_CARD_IDS,
    expectedCount: 14,
    expectedScenarioId: "ai-deck-legal-v1915-smokes",
    hintsData: deckLegalV1915AiHintsData,
    manifestData:
      deckLegalV1915ManifestData as CardsScenarioAiApprovalCase["manifestData"],
    scenarioData:
      deckLegalV1915ScenarioData as CardsScenarioAiApprovalCase["scenarioData"],
    implementationManifestData:
      cardImplementationManifest1915Data as NonNullable<
        CardsScenarioAiApprovalCase["implementationManifestData"]
      >,
    releaseScenarioData: v1915ReleaseScenarioData as NonNullable<
      CardsScenarioAiApprovalCase["releaseScenarioData"]
    >,
    mechanicsCoverageData: v1915MechanicsCoverageData as NonNullable<
      CardsScenarioAiApprovalCase["mechanicsCoverageData"]
    >,
    expectedImplementationManifestVersion:
      "card-implementation-manifest-v1.9.15",
    expectedImplementationManifestGateAssertions: {
      allCardsHumanPlayable: true,
      allCardsDeckLegal: true,
      allCardsAiSupported: true,
    },
    expectedMechanicsGateAssertions: {
      runFlowResolverImplemented: true,
      accessBreachMultiaccessResolverImplemented: true,
      accessAmbushResolverCovered: true,
    },
    requireRuntimeReleaseGate: true,
    requireNoWipText: true,
  },
  {
    title:
      "approves the program subtype, hosting and stealth slice after full gates",
    cardIds: DECK_LEGAL_AI_APPROVAL_V1916_CARD_IDS,
    releaseCardIds: ONR_V1_9_16_RELEASE_CARD_IDS,
    wipCardIds: ONR_V1_9_16_WIP_CARD_IDS,
    expectedCount: 16,
    expectedScenarioId: "ai-deck-legal-v1916-smokes",
    hintsData: deckLegalV1916AiHintsData,
    manifestData:
      deckLegalV1916ManifestData as CardsScenarioAiApprovalCase["manifestData"],
    scenarioData:
      deckLegalV1916ScenarioData as CardsScenarioAiApprovalCase["scenarioData"],
    implementationManifestData:
      cardImplementationManifest1916Data as NonNullable<
        CardsScenarioAiApprovalCase["implementationManifestData"]
      >,
    releaseScenarioData: v1916ReleaseScenarioData as NonNullable<
      CardsScenarioAiApprovalCase["releaseScenarioData"]
    >,
    mechanicsCoverageData: v1916MechanicsCoverageData as NonNullable<
      CardsScenarioAiApprovalCase["mechanicsCoverageData"]
    >,
    expectedImplementationManifestVersion:
      "card-implementation-manifest-v1.9.16",
    expectedImplementationManifestGateAssertions: {
      allCardsHumanPlayable: true,
      allCardsDeckLegal: true,
      allCardsAiSupported: true,
    },
    expectedMechanicsGateAssertions: {
      hostingLifecycleCovered: true,
      aiChoicePathsCovered: true,
    },
    requireRuntimeReleaseGate: true,
    requireNoWipText: true,
  },
  {
    title:
      "approves the asset/node effect slice only after catalog, manifest, hint and scenario gates",
    cardIds: DECK_LEGAL_AI_APPROVAL_V1917_CARD_IDS,
    releaseCardIds: ONR_V1_9_17_RELEASE_CARD_IDS,
    wipCardIds: ONR_V1_9_17_WIP_CARD_IDS,
    expectedCount: 18,
    expectedScenarioId: "ai-deck-legal-v1917-smokes",
    hintsData: deckLegalV1917AiHintsData,
    manifestData:
      deckLegalV1917ManifestData as CardsScenarioAiApprovalCase["manifestData"],
    scenarioData:
      deckLegalV1917ScenarioData as CardsScenarioAiApprovalCase["scenarioData"],
    implementationManifestData:
      cardImplementationManifest1917Data as NonNullable<
        CardsScenarioAiApprovalCase["implementationManifestData"]
      >,
    releaseScenarioData: v1917ReleaseScenarioData as NonNullable<
      CardsScenarioAiApprovalCase["releaseScenarioData"]
    >,
    mechanicsCoverageData: v1917MechanicsCoverageData as NonNullable<
      CardsScenarioAiApprovalCase["mechanicsCoverageData"]
    >,
    expectedImplementationManifestVersion:
      "card-implementation-manifest-v1.9.17",
    expectedImplementationManifestGateAssertions: {
      allCardsHumanPlayable: true,
      allCardsDeckLegal: true,
      allCardsAiSupported: true,
    },
    expectedMechanicsGateAssertions: {
      genericAssetNodeResolverCovered: true,
      installedCardTargetingCovered: true,
      virusCounterTargetingCovered: true,
    },
    requireRuntimeReleaseGate: true,
    requireNoWipText: true,
  },
  {
    title:
      "approves the upgrade/root/server slice only after catalog, manifest, hint and scenario gates",
    cardIds: DECK_LEGAL_AI_APPROVAL_V1918_CARD_IDS,
    releaseCardIds: ONR_V1_9_18_RELEASE_CARD_IDS,
    wipCardIds: ONR_V1_9_18_WIP_CARD_IDS,
    expectedCount: 15,
    expectedScenarioId: "ai-deck-legal-v1918-smokes",
    hintsData: deckLegalV1918AiHintsData,
    manifestData:
      deckLegalV1918ManifestData as CardsScenarioAiApprovalCase["manifestData"],
    scenarioData:
      deckLegalV1918ScenarioData as CardsScenarioAiApprovalCase["scenarioData"],
    implementationManifestData:
      cardImplementationManifest1918Data as NonNullable<
        CardsScenarioAiApprovalCase["implementationManifestData"]
      >,
    releaseScenarioData: v1918ReleaseScenarioData as NonNullable<
      CardsScenarioAiApprovalCase["releaseScenarioData"]
    >,
    mechanicsCoverageData: v1918MechanicsCoverageData as NonNullable<
      CardsScenarioAiApprovalCase["mechanicsCoverageData"]
    >,
    expectedImplementationManifestVersion:
      "card-implementation-manifest-v1.9.18",
    expectedImplementationManifestGateAssertions: {
      allCardsHumanPlayable: true,
      allCardsDeckLegal: true,
      allCardsAiSupported: true,
    },
    expectedMechanicsGateAssertions: {
      genericUpgradeRootServerResolverCovered: true,
      runStartTaxCovered: true,
      tagConditionCreditCovered: true,
    },
    requireRuntimeReleaseGate: true,
    requireNoWipText: true,
  },
  {
    title:
      "approves the agenda scoring/overadvance slice only after catalog, manifest, hint and scenario gates",
    cardIds: DECK_LEGAL_AI_APPROVAL_V1919_CARD_IDS,
    releaseCardIds: ONR_V1_9_19_RELEASE_CARD_IDS,
    wipCardIds: ONR_V1_9_19_WIP_CARD_IDS,
    expectedCount: 20,
    expectedScenarioId: "ai-deck-legal-v1919-smokes",
    hintsData: deckLegalV1919AiHintsData,
    manifestData:
      deckLegalV1919ManifestData as CardsScenarioAiApprovalCase["manifestData"],
    scenarioData:
      deckLegalV1919ScenarioData as CardsScenarioAiApprovalCase["scenarioData"],
    implementationManifestData:
      cardImplementationManifest1919Data as NonNullable<
        CardsScenarioAiApprovalCase["implementationManifestData"]
      >,
    releaseScenarioData: v1919ReleaseScenarioData as NonNullable<
      CardsScenarioAiApprovalCase["releaseScenarioData"]
    >,
    mechanicsCoverageData: v1919MechanicsCoverageData as NonNullable<
      CardsScenarioAiApprovalCase["mechanicsCoverageData"]
    >,
    expectedImplementationManifestVersion:
      "card-implementation-manifest-v1.9.19",
    expectedImplementationManifestGateAssertions: {
      allCardsHumanPlayable: true,
      allCardsDeckLegal: true,
      allCardsAiSupported: true,
    },
    expectedMechanicsGateAssertions: {
      scoredAgendaResolverCovered: true,
      agendaDifficultyOveradvanceCovered: true,
      runnerAgendaCostEdgesCovered: true,
    },
    requireRuntimeReleaseGate: true,
    requireNoWipText: true,
  },
  {
    title:
      "approves the global modifier and special-state slice only after catalog, manifest, hint and scenario gates",
    cardIds: DECK_LEGAL_AI_APPROVAL_V1920_CARD_IDS,
    releaseCardIds: ONR_V1_9_20_RELEASE_CARD_IDS,
    wipCardIds: ONR_V1_9_20_WIP_CARD_IDS,
    expectedCount: 26,
    expectedScenarioId: "ai-deck-legal-v1920-smokes",
    hintsData: deckLegalV1920AiHintsData,
    manifestData:
      deckLegalV1920ManifestData as CardsScenarioAiApprovalCase["manifestData"],
    scenarioData:
      deckLegalV1920ScenarioData as CardsScenarioAiApprovalCase["scenarioData"],
    implementationManifestData:
      cardImplementationManifest1920Data as NonNullable<
        CardsScenarioAiApprovalCase["implementationManifestData"]
      >,
    releaseScenarioData: v1920ReleaseScenarioData as NonNullable<
      CardsScenarioAiApprovalCase["releaseScenarioData"]
    >,
    mechanicsCoverageData: v1920MechanicsCoverageData as NonNullable<
      CardsScenarioAiApprovalCase["mechanicsCoverageData"]
    >,
    expectedImplementationManifestVersion:
      "card-implementation-manifest-v1.9.20",
    expectedImplementationManifestGateAssertions: {
      allCardsHumanPlayable: true,
      allCardsDeckLegal: true,
      allCardsAiSupported: true,
    },
    expectedMechanicsGateAssertions: {
      engineCovered: true,
      hiddenInfoSafeForCoveredSmokes: true,
      catalogPromotionPending: false,
    },
    requireRuntimeReleaseGate: true,
    requireNoWipText: true,
  },
  {
    title:
      "approves the deterministic-random slice only after catalog, manifest, hint and scenario gates",
    cardIds: DECK_LEGAL_AI_APPROVAL_V1921_CARD_IDS,
    releaseCardIds: ONR_V1_9_21_RELEASE_CARD_IDS,
    wipCardIds: ONR_V1_9_21_WIP_CARD_IDS,
    expectedCount: 6,
    expectedScenarioId: "ai-deck-legal-v1921-smokes",
    hintsData: deckLegalV1921AiHintsData,
    manifestData:
      deckLegalV1921ManifestData as CardsScenarioAiApprovalCase["manifestData"],
    scenarioData:
      deckLegalV1921ScenarioData as CardsScenarioAiApprovalCase["scenarioData"],
    implementationManifestData:
      cardImplementationManifest1921Data as NonNullable<
        CardsScenarioAiApprovalCase["implementationManifestData"]
      >,
    releaseScenarioData: v1921ReleaseScenarioData as NonNullable<
      CardsScenarioAiApprovalCase["releaseScenarioData"]
    >,
    mechanicsCoverageData: v1921MechanicsCoverageData as NonNullable<
      CardsScenarioAiApprovalCase["mechanicsCoverageData"]
    >,
    expectedImplementationManifestVersion:
      "card-implementation-manifest-v1.9.21",
    expectedImplementationManifestGateAssertions: {
      allCardsHumanPlayable: true,
      allCardsDeckLegal: true,
      allCardsAiSupported: true,
    },
    expectedMechanicsGateAssertions: {
      engineCovered: "all_target_cards_completed_random_effects",
      hiddenInfoSafeForCoveredSmokes: true,
      catalogPromotionPending: false,
    },
    expectedHintRequiredMechanic: "deterministic_random_card_resolver",
    expectedResolverFamilyIncludes: "deterministic_random_card_resolver",
    requireRuntimeReleaseGate: true,
    requireNoWipText: true,
  },
];

function expectCardsScenarioAiApprovalGate(
  approvalCase: CardsScenarioAiApprovalCase,
): void {
  const cardsById = createRuntimeCardsById();
  const approved = new Set<string>(approvalCase.cardIds);
  const hints = approvalCase.hintsData.cards as Array<{
    cardId: string;
    roles: string[];
    planRoles: string[];
    requiredMechanics: string[];
    aiSupportStatus: string;
    scenarioRefs: string[];
  }>;
  const manifestCards = approvalCase.manifestData.cards;
  const scenarioCards = new Set(
    approvalCase.scenarioData.scenarios.flatMap(
      (scenario) => scenario.cards ?? scenario.coversCards ?? [],
    ),
  );
  const implementationCards =
    approvalCase.implementationManifestData?.cards ?? [];
  const releaseScenarioCards =
    approvalCase.releaseScenarioData?.[
      approvalCase.releaseScenarioCardField ?? "coversCards"
    ] ?? [];
  const supplementalIds = new Set(
    (runtimeSupplementAiHintsData.cards as Array<{ cardId: string }>).map(
      (hint) => hint.cardId,
    ),
  );

  expect(approvalCase.cardIds).toHaveLength(approvalCase.expectedCount);
  if (approvalCase.releaseCardIds) {
    expect(approvalCase.releaseCardIds).toHaveLength(
      approvalCase.expectedCount,
    );
  }
  if (approvalCase.wipCardIds && approvalCase.releaseCardIds) {
    expect(approvalCase.wipCardIds).toEqual(approvalCase.releaseCardIds);
  }
  if (approvalCase.requireRuntimeReleaseGate && approvalCase.releaseCardIds) {
    expect(ONR_V1_RUNTIME_RELEASE_CARD_IDS).toEqual(
      expect.arrayContaining([...approvalCase.releaseCardIds]),
    );
  }
  expect(hints.map((hint) => hint.cardId).sort()).toEqual([...approved].sort());
  expect(manifestCards.map((card) => card.cardId).sort()).toEqual(
    [...approved].sort(),
  );
  if (approvalCase.implementationManifestData) {
    expect(implementationCards.map((card) => card.cardCode).sort()).toEqual(
      [...approved].sort(),
    );
  }
  if (approvalCase.releaseScenarioData) {
    expect(releaseScenarioCards.sort()).toEqual([...approved].sort());
  }
  if (approvalCase.expectedImplementationManifestGateAssertions) {
    expect(
      approvalCase.implementationManifestData?.gateAssertions,
    ).toMatchObject(approvalCase.expectedImplementationManifestGateAssertions);
  }
  if (approvalCase.expectedMechanicsGateAssertions) {
    expect(approvalCase.mechanicsCoverageData?.gateAssertions).toMatchObject(
      approvalCase.expectedMechanicsGateAssertions,
    );
  }
  if (approvalCase.scenarioData.id) {
    expect(approvalCase.scenarioData.id).toBe(approvalCase.expectedScenarioId);
  }
  expect([...scenarioCards].sort()).toEqual([...approved].sort());
  if (approvalCase.scenarioData.completionGate) {
    expect(approvalCase.scenarioData.completionGate.aiSupported).toBe(true);
  }

  for (const cardId of approvalCase.cardIds) {
    const card = cardsById[cardId];
    const hint = hints.find((candidate) => candidate.cardId === cardId);
    const manifest = manifestCards.find(
      (candidate) => candidate.cardId === cardId,
    );
    const implementation = implementationCards.find(
      (candidate) => candidate.cardCode === cardId,
    );
    expect(card?.statuses.human_playable, cardId).toBe(true);
    expect(card?.statuses.deck_legal, cardId).toBe(true);
    expect(card?.statuses.format_legal, cardId).toBe(true);
    expect(card?.statuses.ai_supported, cardId).toBe(true);
    if (approvalCase.expectedImplementationManifestVersion) {
      expect(card?.implementationManifest?.manifestVersion, cardId).toBe(
        approvalCase.expectedImplementationManifestVersion,
      );
    }
    if (approvalCase.requireNoWipText) {
      expect(card?.text, cardId).not.toContain("WIP");
    }
    expect(hint?.aiSupportStatus, cardId).toBe("ai_supported");
    expect(hint?.roles.length, cardId).toBeGreaterThan(0);
    expect(hint?.planRoles.length, cardId).toBeGreaterThan(0);
    expect(hint?.requiredMechanics.length, cardId).toBeGreaterThan(0);
    if (approvalCase.expectedHintRequiredMechanic) {
      expect(hint?.requiredMechanics, cardId).toContain(
        approvalCase.expectedHintRequiredMechanic,
      );
    }
    expect(hint?.scenarioRefs.length, cardId).toBeGreaterThan(0);
    expect(manifest?.status, cardId).toBe("ai_supported");
    expect(manifest?.scenarioRefs.length, cardId).toBeGreaterThan(0);
    if (approvalCase.implementationManifestData) {
      expect(implementation?.releaseStatus, cardId).toBe("human_playable");
      expect(implementation?.aiSupported, cardId).toBe(true);
      if (approvalCase.expectedResolverFamily) {
        expect(implementation?.resolverFamily, cardId).toBe(
          approvalCase.expectedResolverFamily(cardId),
        );
      } else if (approvalCase.expectedResolverFamilyIncludes) {
        expect(implementation?.resolverFamily, cardId).toContain(
          approvalCase.expectedResolverFamilyIncludes,
        );
      } else {
        expect(implementation?.resolverFamily.length, cardId).toBeGreaterThan(
          0,
        );
      }
    }
    expect(scenarioCards.has(cardId), cardId).toBe(true);
    if (approvalCase.requireNoSupplementalHints) {
      expect(supplementalIds.has(cardId), cardId).toBe(false);
    }
  }

  expect(
    JSON.stringify({
      hintsData: approvalCase.hintsData,
      manifestData: approvalCase.manifestData,
      scenarioData: approvalCase.scenarioData,
      implementationManifestData: approvalCase.implementationManifestData,
      releaseScenarioData: approvalCase.releaseScenarioData,
      mechanicsCoverageData: approvalCase.mechanicsCoverageData,
    }),
  ).not.toMatch(
    /"cardInstances"\s*:|"privatePayload"\s*:|"sessionToken"\s*:|"reconnectToken"\s*:|"joinToken"\s*:|"tokenHash"\s*:|"fullState"\s*:|[A-Za-z]:\\/,
  );
}

type V1922CompletionManifestCard = {
  cardCode: string;
  releaseStatus: string;
  aiSupported: boolean;
  resolverFamily: string;
  coveredSmokes: string[];
};

type V1922LongtailCompletionGroup = {
  label: string;
  expectedCardIds: readonly string[];
  resolverFamilies?: readonly string[];
  resolverFamilyIncludes?: string;
  requiredCoveredSmokes?: readonly string[];
  perCardRequiredCoveredSmokes?: Record<string, readonly string[]>;
};

const V1922_LONGTAIL_COMPLETION_GROUPS: readonly V1922LongtailCompletionGroup[] =
  [
    {
      label: "hardware install surface",
      resolverFamilyIncludes: "install_hardware_memory_surface",
      expectedCardIds: [
        "onr_v1_119_arasaka-portable-prototype",
        "onr_v1_122_artemis-2020",
        "onr_v1_123_bodyweight-data-creche",
        "onr_v1_124_corolla-speed-chip",
        "onr_v1_131_microtech-backup-drive",
        "onr_v1_136_pandoras-deck",
        "onr_v1_137_parraline-5750",
        "onr_v1_138_pk-6089a",
        "onr_v1_147_zz22-speed-chip",
      ],
      requiredCoveredSmokes: [
        "install_hardware_legal_action",
        "wrong_side_revalidation",
        "stale_state_revalidation",
        "public_payload_visibility",
        "replay_statehash",
      ],
    },
    {
      label: "legacy play-event surface",
      resolverFamilyIncludes: "play_event_surface",
      expectedCardIds: [],
    },
    {
      label: "runner event resolvers",
      resolverFamilies: [
        "v1922_runner_event_derez_black_ice",
        "v1922_runner_event_successful_hq_run_pay_rez_cost_trash_rezzed_ice",
        "v1922_runner_event_force_rez_or_trash_ice",
        "v1922_runner_event_grip_trash_gain_credits",
        "v1922_runner_event_installed_trash_gain_credits",
        "v1922_runner_event_remove_tag_optional_return",
        "v1922_runner_event_successful_hq_run_trash_unrezzed_ice",
        "v1922_runner_event_successful_hq_run_corp_pay_to_retain_hq",
        "v1922_runner_event_stack_top5_choose_one_arrange_rest",
        "v1922_runner_event_program_install_action_bundle",
      ],
      expectedCardIds: [
        "onr_v1_077_anonymous-tip",
        "onr_v1_080_core-command-jettison-ice",
        "onr_v1_086_forged-activation-orders",
        "onr_v1_093_if-you-want-it-done-right",
        "onr_v1_100_misc-for-sale",
        "onr_v1_102_open-ended-mileage-program",
        "onr_v1_103_organ-donor",
        "onr_v1_109_security-code-worm-chip",
        "onr_v1_113_synchronized-attack-on-hq",
        "onr_v1_117_valu-pak-software-bundle",
      ],
    },
    {
      label: "runner program resolvers",
      resolverFamilies: [
        "v1922_runner_program_install_surface_ability_gated",
        "v1922_runner_program_net_damage_prevention",
        "v1922_runner_program_newsgroup_filter_gain_2",
        "v1922_runner_program_flak_ap_breaker",
        "v1922_runner_program_hammer_wall_breaker_stealth_loss_choice",
        "v1922_runner_program_japanese_water_torture_future_action_debt",
        "v1922_runner_program_poltergeist_node_trash_recurring_credit",
        "v1922_runner_program_reflector_tagged_breaker",
        "v1922_runner_program_scatter_shot_upgrade_trash_recurring_credit",
        "v1922_runner_program_zetatech_software_installer_recurring_program_install_overlay",
      ],
      expectedCardIds: [
        "onr_v1_026_false-echo",
        "onr_v1_027_flak",
        "onr_v1_031_hammer",
        "onr_v1_037_japanese-water-torture",
        "onr_v1_044_netspace-inverter",
        "onr_v1_045_newsgroup-filter",
        "onr_v1_048_poltergeist",
        "onr_v1_051_rabbit",
        "onr_v1_055_reflector",
        "onr_v1_057_scatter-shot",
        "onr_v1_061_shield",
        "onr_v1_067_speed-trap",
        "onr_v1_068_startup-immolator",
        "onr_v1_075_zetatech-software-installer",
      ],
      requiredCoveredSmokes: [
        "install_program_legal_action",
        "public_payload_visibility",
        "replay_statehash",
      ],
      perCardRequiredCoveredSmokes: {
        "onr_v1_026_false-echo": ["ability_contract_remains_gated"],
        onr_v1_027_flak: [
          "ap_break_subroutine",
          "pump_strength",
          "wrong_side_revalidation",
          "stale_state_revalidation",
        ],
        onr_v1_031_hammer: [
          "wall_break_subroutine",
          "stealth_loss_distribution_choice",
          "pump_strength",
          "wrong_side_revalidation",
          "stale_state_revalidation",
        ],
        "onr_v1_037_japanese-water-torture": [
          "wall_break_subroutine",
          "future_action_debt",
          "pump_strength",
          "wrong_side_revalidation",
          "stale_state_revalidation",
        ],
        "onr_v1_044_netspace-inverter": ["ability_contract_remains_gated"],
        "onr_v1_045_newsgroup-filter": ["gain_2_credit_action"],
        onr_v1_048_poltergeist: [
          "node_trash_recurring_credit",
          "upgrade_trash_negative",
          "runner_turn_start_recurring_refresh",
        ],
        onr_v1_051_rabbit: ["ability_contract_remains_gated"],
        onr_v1_055_reflector: [
          "tagged_break_subroutine",
          "wrong_side_revalidation",
          "stale_state_revalidation",
        ],
        "onr_v1_057_scatter-shot": [
          "upgrade_trash_recurring_credit",
          "asset_trash_negative",
          "runner_turn_start_recurring_refresh",
        ],
        onr_v1_061_shield: ["net_damage_prevention_window"],
        "onr_v1_067_speed-trap": ["ability_contract_remains_gated"],
        "onr_v1_068_startup-immolator": ["ability_contract_remains_gated"],
        "onr_v1_075_zetatech-software-installer": [
          "recurring_program_install_credit",
          "runner_turn_start_recurring_refresh",
          "zetatech_overlay_install",
          "overlay_no_extra_memory",
        ],
      },
    },
    {
      label: "corp agenda resolvers",
      resolverFamilies: [
        "v1922_corp_agenda_on_score_credit_threshold",
        "v1922_corp_agenda_data_fort_reclamation_hq_install_sequence",
        "v1922_corp_agenda_security_purge_rd_top3",
        "v1922_scored_agenda_action_gain_2_until_install_or_rez",
        "v1922_scored_agenda_action_gain_3",
        "v1922_scored_agenda_action_gain_3_for_2_actions",
      ],
      expectedCardIds: [
        "onr_v1_195_corporate-retreat",
        "onr_v1_196_corporate-war",
        "onr_v1_197_data-fort-reclamation",
        "onr_v1_206_marine-arcology",
        "onr_v1_210_political-overthrow",
        "onr_v1_216_security-purge",
      ],
    },
    {
      label: "corp operation resolvers",
      resolverFamilies: [
        "v1922_corp_operation_install_action_bundle",
        "v1922_corp_operation_private_archives_to_hq",
        "v1922_corp_operation_private_rd_top5_reorder",
      ],
      expectedCardIds: [
        "onr_v1_289_edgerunner-inc-temps",
        "onr_v1_296_off-site-backups",
        "onr_v1_298_planning-consultants",
      ],
    },
    {
      label: "corp ice resolvers",
      resolverFamilies: [
        "v1922_corp_ice_future_end_the_run_subroutine",
        "v1922_corp_ice_core_damage_etr",
        "v1922_corp_ice_break_cost_modifier",
        "v1922_corp_ice_haunting_inquisition_run_lock",
        "v1922_corp_ice_viral_15_jackout_tax_program_trash",
      ],
      expectedCardIds: [
        "onr_v1_247_haunting-inquisition",
        "onr_v1_274_tutor",
        "onr_v1_276_viral-15",
        "onr_v1_277_virizz",
        "onr_v1_280_zombie",
      ],
      requiredCoveredSmokes: ["rez_ice_legal_action", "replay_statehash"],
      perCardRequiredCoveredSmokes: {
        "onr_v1_247_haunting-inquisition": ["run_lock_next_six_runner_actions"],
        onr_v1_274_tutor: ["run_wide_future_end_the_run_subroutine"],
        "onr_v1_276_viral-15": ["run_wide_jackout_tax"],
        onr_v1_277_virizz: ["run_wide_break_cost_modifier"],
        onr_v1_280_zombie: ["core_damage_subroutines"],
      },
    },
  ];

function cardsForV1922CompletionGroup(
  manifestCards: readonly V1922CompletionManifestCard[],
  group: V1922LongtailCompletionGroup,
): V1922CompletionManifestCard[] {
  if (group.resolverFamilies) {
    const resolverFamilies = new Set(group.resolverFamilies);
    return manifestCards.filter((card) =>
      resolverFamilies.has(card.resolverFamily),
    );
  }
  return manifestCards.filter((card) =>
    card.resolverFamily.includes(group.resolverFamilyIncludes ?? ""),
  );
}

function expectV1922LongtailCompletionGroup(
  manifestCards: readonly V1922CompletionManifestCard[],
  group: V1922LongtailCompletionGroup,
): void {
  const cards = cardsForV1922CompletionGroup(manifestCards, group);
  expect(cards.map((card) => card.cardCode).sort(), group.label).toEqual(
    [...group.expectedCardIds].sort(),
  );

  for (const card of cards) {
    expect(card.releaseStatus, card.cardCode).toBe("human_playable");
    expect(card.aiSupported, card.cardCode).toBe(true);
    if (
      !group.requiredCoveredSmokes &&
      !group.perCardRequiredCoveredSmokes?.[card.cardCode]
    ) {
      expect(card.coveredSmokes.length, card.cardCode).toBeGreaterThan(0);
    }
    if (group.requiredCoveredSmokes) {
      expect(card.coveredSmokes, card.cardCode).toEqual(
        expect.arrayContaining([...group.requiredCoveredSmokes]),
      );
    }
    const perCardSmokes = group.perCardRequiredCoveredSmokes?.[card.cardCode];
    if (perCardSmokes) {
      expect(card.coveredSmokes, card.cardCode).toEqual(
        expect.arrayContaining([...perCardSmokes]),
      );
    }
  }
}

describe("catalog import and status logic", () => {
  it("exposes fachliche gate evidence maps for runtime, AI and release audit status", () => {
    const releaseIds = [...ONR_V1_RUNTIME_RELEASE_CARD_IDS];
    const aiIds = buildAiApprovedCardIds(CATALOG_AI_APPROVAL_BATCHES);
    expect(activeRuntimeCardIds).toEqual(releaseIds);
    expect(activeAiApprovedCardIds).toEqual(aiIds);
    expect(Object.keys(runtimeGateByCardId).sort()).toEqual(
      releaseIds.slice().sort(),
    );
    expect(
      releaseEvidenceByCardId["onr_v1_092_ice-and-datas-guide-to-the-net"]
        ?.auditReleaseId,
    ).toBe("v1.9.11");
    expect(
      cardFactsById["onr_v1_092_ice-and-datas-guide-to-the-net"]?.runtimeGate,
    ).toMatchObject({
      engineCardId: "onr_v1_092_ice-and-datas-guide-to-the-net",
      deckLegal: true,
    });
    expect(
      aiApprovalByCardId["onr_v1_092_ice-and-datas-guide-to-the-net"]
        ?.approvalStatus,
    ).toBe("ai_supported");
    const runtimeCards = createRuntimeCardsById();
    for (const cardId of releaseIds) {
      const card = runtimeCards[cardId];
      expect(card?.implementationManifest?.manifestVersion, cardId).toBe(
        releaseEvidenceByCardId[cardId]?.implementationManifest.manifestVersion,
      );
      expect(card?.statuses.deck_legal, cardId).toBe(
        runtimeGateByCardId[cardId]?.deckLegal,
      );
      expect(card?.statuses.ai_supported, cardId).toBe(
        Boolean(aiApprovalByCardId[cardId]),
      );
    }
  });

  it("validates the local V0.5 snapshot", () => {
    expect(validateSnapshot(snapshot)).toEqual({ ok: true, errors: [] });
  });

  it("computes the frozen snapshot hash deterministically", () => {
    expect(computeSnapshotHash(snapshot)).toBe("fnv1a:a85f7985");
  });

  it("recreates the committed catalog index", () => {
    const recreated = createCatalogIndex(
      snapshot,
      computeSnapshotHash(snapshot),
    );
    expect(recreated.cards).toEqual(catalogIndexData.cards);
    expect(recreated.byId).toEqual(catalogIndexData.byId);
    expect(recreated.filters).toEqual(catalogIndexData.filters);
    expect(recreated.statusSummary).toEqual(catalogIndexData.statusSummary);
  });

  it("searches and filters without exposing non-catalog data", () => {
    const runnerResults = searchCatalog(snapshot, { q: "run", side: "runner" });
    expect(
      runnerResults.some((card) => card.catalogCardId === "simple_run_event"),
    ).toBe(true);
    expect(runnerResults.every((card) => card.side === "runner")).toBe(true);
    expect(assertCatalogPayloadSafe(runnerResults)).toEqual({
      ok: true,
      errors: [],
    });
  });

  it("imports display-only rarity metadata from local spoiler sources", () => {
    const report = createCardRarityImportReport(readProjectCardRaritySources());
    const sourceReportById = new Map(
      report.sources.map((sourceReport) => [
        sourceReport.sourceId,
        sourceReport,
      ]),
    );

    expect(report.unknownValues).toEqual([]);
    expect(sourceReportById.get("onr-v1-limited-corp-spoiler")).toMatchObject({
      totalEntries: 187,
      countsByRarity: {
        common: 44,
        uncommon: 66,
        rare: 55,
        vital: 22,
      },
    });
    expect(sourceReportById.get("onr-v1-limited-runner-spoiler")).toMatchObject(
      {
        totalEntries: 187,
        countsByRarity: {
          common: 44,
          uncommon: 66,
          rare: 55,
          vital: 22,
        },
      },
    );
    expect(sourceReportById.get("onr-proteus-spoiler")).toMatchObject({
      totalEntries: 154,
      countsByRarity: {
        common: 66,
        uncommon: 44,
        rare: 44,
        vital: 0,
      },
    });

    const runtimeSnapshot = createRuntimeCardSnapshot();
    const afreet = getCatalogCard(runtimeSnapshot, "onr_v1_001_afreet");
    expect(afreet?.rarity).toMatchObject({
      code: "uncommon",
      labelDe: "Ungewöhnlich",
      labelEn: "Uncommon",
      sourceValue: "Uncommon",
      sourceId: "onr-v1-limited-runner-spoiler",
    });
    const blackDahlia = getCatalogCard(runtimeSnapshot, "onr_v1_006_black-dahlia");
    expect(blackDahlia?.rarity).toMatchObject({
      code: "vital",
      labelDe: "Vital",
    });
    expect(
      searchCatalog(runtimeSnapshot, { q: "ungewöhnlich", side: "runner" })
        .map((card) => card.catalogCardId),
    ).toContain("onr_v1_001_afreet");
    expect(validateSnapshot(runtimeSnapshot)).toEqual({ ok: true, errors: [] });
  });

  it("keeps import-only and blocked cards out of playability", () => {
    const importOnly = getCatalogCard(
      snapshot,
      "catalog_preview_operation_001",
    );
    expect(importOnly?.statuses.catalog_ready).toBe(true);
    expect(importOnly?.statuses.implemented).toBe(false);
    expect(importOnly?.statuses.playable).toBe(false);
    expect(importOnly?.statuses.deck_legal).toBe(false);

    const blocked = getCatalogCard(snapshot, "catalog_preview_resource_001");
    expect(blocked?.statuses.blocked).toBe(true);
    expect(blocked?.blockReasons.length).toBeGreaterThan(0);
    expect(blocked?.statuses.deck_legal).toBe(false);
  });

  it("validates the V0.8 playable local starter slice without promoting import-only cards", () => {
    expect(validateSnapshot(snapshot08)).toEqual({ ok: true, errors: [] });
    expect(computeSnapshotHash(snapshot08)).toBe("fnv1a:b4c03f20");

    const burst = getCatalogCard(snapshot08, "v08_burst_credit_event");
    expect(burst?.engineCardId).toBe("v08_burst_credit_event");
    expect(burst?.statuses.playable).toBe(true);
    expect(burst?.statuses.deck_legal).toBe(true);
    expect(burst?.implementationManifest?.manifestVersion).toBe(
      "card-implementation-manifest-v0.8",
    );

    const importOnly = getCatalogCard(
      snapshot08,
      "catalog_preview_operation_001",
    );
    expect(importOnly?.statuses.playable).toBe(false);
    expect(importOnly?.statuses.deck_legal).toBe(false);
  });

  it("keeps private local O:NR playable deck-legal cards aligned with manifest and review coverage when present", () => {
    const localSnapshotPath =
      "data/local/card-import/onr-v1-limited/card-snapshot-onr-v1-limited.local.json";
    if (!existsSync(localSnapshotPath)) return;

    const localSnapshot = JSON.parse(
      readFileSync(localSnapshotPath, "utf8"),
    ) as CardSnapshot;
    expect(validateSnapshot(localSnapshot)).toEqual({ ok: true, errors: [] });

    const playableDeckLegal = localSnapshot.cards.filter(
      (card) => card.statuses.playable && card.statuses.deck_legal,
    );
    const missingManifest = playableDeckLegal
      .filter((card) => !card.implementationManifest)
      .map((card) => card.catalogCardId);
    const missingCoverage = playableDeckLegal
      .filter((card) => {
        const manifest = card.implementationManifest;
        return (
          !manifest ||
          manifest.unitTests.length === 0 ||
          manifest.scenarioTests.length === 0 ||
          manifest.visibilityTests.length === 0 ||
          manifest.replayTests.length === 0
        );
      })
      .map((card) => card.catalogCardId);
    const reviewFiles = [
      "data/local/card-import/onr-v1-limited/agenda-implementation-review.local.md",
      "data/local/card-import/onr-v1-limited/asset-implementation-review.local.md",
      "data/local/card-import/onr-v1-limited/agenda-text-review.local.md",
      "data/local/card-import/onr-v1-limited/asset-text-review.local.md",
    ];

    expect(playableDeckLegal.length).toBeGreaterThan(0);
    expect(missingManifest).toEqual([]);
    expect(missingCoverage).toEqual([]);
    expect(reviewFiles.filter((file) => existsSync(file))).toHaveLength(
      reviewFiles.length,
    );
  });

  it("applies the V1.0.5K through V1.9.8 release gates to private local O:NR runtime cards when present", () => {
    const cardsById = createRuntimeCardsById();
    if (!cardsById["onr_v1_015_codeslinger"]) return;

    expect(ONR_V1_0_5K_RELEASE_CARD_IDS).toHaveLength(12);
    expect(ONR_V1_0_6K_RELEASE_CARD_IDS).toHaveLength(20);
    expect(ONR_V1_1_2K_RELEASE_CARD_IDS).toHaveLength(20);
    expect(ONR_V1_2_3_RELEASE_CARD_IDS).toHaveLength(11);
    expect(ONR_V1_6_1_RELEASE_CARD_IDS).toHaveLength(6);
    expect(ONR_V1_6_2_RELEASE_CARD_IDS).toHaveLength(5);
    expect(ONR_V1_6_3_RELEASE_CARD_IDS).toHaveLength(5);
    expect(ONR_V1_7_0_RELEASE_CARD_IDS).toHaveLength(5);
    expect(ONR_V1_7_1_RELEASE_CARD_IDS).toHaveLength(5);
    expect(ONR_V1_7_2_RELEASE_CARD_IDS).toHaveLength(5);
    expect(ONR_V1_8_0_RELEASE_CARD_IDS).toHaveLength(6);
    expect(ONR_V1_8_1_RELEASE_CARD_IDS).toHaveLength(12);
    expect(ONR_V1_9_0_RELEASE_CARD_IDS).toHaveLength(5);
    expect(ONR_V1_9_1_RELEASE_CARD_IDS).toHaveLength(3);
    expect(ONR_V1_9_2_RELEASE_CARD_IDS).toHaveLength(7);
    expect(ONR_V1_9_3_RELEASE_CARD_IDS).toHaveLength(4);
    expect(ONR_V1_9_4_RELEASE_CARD_IDS).toHaveLength(2);
    expect(ONR_V1_9_5_RELEASE_CARD_IDS).toHaveLength(2);
    expect(ONR_V1_9_6_RELEASE_CARD_IDS).toHaveLength(1);
    expect(ONR_V1_9_7_RELEASE_CARD_IDS).toHaveLength(1);
    expect(ONR_V1_9_8_RELEASE_CARD_IDS).toHaveLength(2);
    expect(ONR_V1_9_9_RELEASE_CARD_IDS).toHaveLength(4);
    expect(ONR_V1_9_11_RELEASE_CARD_IDS).toHaveLength(16);
    expect(ONR_V1_9_12_RELEASE_CARD_IDS).toHaveLength(11);
    expect(ONR_V1_9_13_RELEASE_CARD_IDS).toHaveLength(17);
    expect(ONR_V1_9_14_RELEASE_CARD_IDS).toHaveLength(25);
    expect(ONR_V1_9_15_RELEASE_CARD_IDS).toHaveLength(14);
    expect(ONR_V1_9_16_RELEASE_CARD_IDS).toHaveLength(16);
    expect(ONR_V1_9_17_RELEASE_CARD_IDS).toHaveLength(18);
    expect(ONR_V1_9_18_RELEASE_CARD_IDS).toHaveLength(15);
    expect(ONR_V1_9_19_RELEASE_CARD_IDS).toHaveLength(20);
    expect(ONR_V1_9_20_RELEASE_CARD_IDS).toHaveLength(26);
    expect(ONR_V1_9_21_RELEASE_CARD_IDS).toHaveLength(6);
    expect(ONR_V1_9_21_WIP_CARD_IDS).toHaveLength(6);
    expect(ONR_V1_9_22_WIP_CARD_IDS).toHaveLength(47);
    expect(ONR_V1_9_22_RELEASE_CARD_IDS).toHaveLength(47);
    expect(ONR_V1_9_14_WIP_CARD_IDS).toEqual(ONR_V1_9_14_RELEASE_CARD_IDS);
    expect(ONR_V1_9_15_WIP_CARD_IDS).toHaveLength(14);
    expect(ONR_V1_9_15_WIP_CARD_IDS).toEqual(ONR_V1_9_15_RELEASE_CARD_IDS);
    expect(ONR_V1_9_16_WIP_CARD_IDS).toHaveLength(16);
    expect(ONR_V1_9_16_WIP_CARD_IDS).toEqual(ONR_V1_9_16_RELEASE_CARD_IDS);
    expect(ONR_V1_9_17_WIP_CARD_IDS).toHaveLength(18);
    expect(ONR_V1_9_17_WIP_CARD_IDS).toEqual(ONR_V1_9_17_RELEASE_CARD_IDS);
    expect(ONR_V1_9_18_WIP_CARD_IDS).toHaveLength(15);
    expect(ONR_V1_9_18_WIP_CARD_IDS).toEqual(ONR_V1_9_18_RELEASE_CARD_IDS);
    expect(ONR_V1_9_19_WIP_CARD_IDS).toHaveLength(20);
    expect(ONR_V1_9_19_WIP_CARD_IDS).toEqual(ONR_V1_9_19_RELEASE_CARD_IDS);
    expect(ONR_V1_9_20_WIP_CARD_IDS).toHaveLength(26);
    expect(ONR_V1_9_20_WIP_CARD_IDS).toEqual(ONR_V1_9_20_RELEASE_CARD_IDS);
    expect(ONR_V1_9_21_WIP_CARD_IDS).toEqual(ONR_V1_9_21_RELEASE_CARD_IDS);
    expect(ONR_V1_9_22_WIP_CARD_IDS).toEqual(ONR_V1_9_22_RELEASE_CARD_IDS);
    expect(ONR_V1_RUNTIME_RELEASE_CARD_IDS).toHaveLength(374);
    expect(ONR_V1_RUNTIME_RELEASE_CARD_IDS).toEqual(
      expect.arrayContaining([...ONR_V1_9_15_RELEASE_CARD_IDS]),
    );
    expect(ONR_V1_RUNTIME_RELEASE_CARD_IDS).toEqual(
      expect.arrayContaining([...ONR_V1_9_16_RELEASE_CARD_IDS]),
    );
    expect(ONR_V1_RUNTIME_RELEASE_CARD_IDS).toEqual(
      expect.arrayContaining([...ONR_V1_9_17_RELEASE_CARD_IDS]),
    );
    expect(ONR_V1_RUNTIME_RELEASE_CARD_IDS).toEqual(
      expect.arrayContaining([...ONR_V1_9_18_RELEASE_CARD_IDS]),
    );
    expect(ONR_V1_RUNTIME_RELEASE_CARD_IDS).toEqual(
      expect.arrayContaining([...ONR_V1_9_19_RELEASE_CARD_IDS]),
    );
    expect(ONR_V1_RUNTIME_RELEASE_CARD_IDS).toEqual(
      expect.arrayContaining([...ONR_V1_9_20_RELEASE_CARD_IDS]),
    );
    expect(ONR_V1_RUNTIME_RELEASE_CARD_IDS).toEqual(
      expect.arrayContaining([...ONR_V1_9_21_RELEASE_CARD_IDS]),
    );
    expect(ONR_V1_RUNTIME_RELEASE_CARD_IDS).toEqual(
      expect.arrayContaining([...ONR_V1_9_22_RELEASE_CARD_IDS]),
    );
    expect(cardsById["onr_v1_308_acme-savings-and-loan"]?.text).toBe(
      "Rezzing ACME S&L costs 1 agenda point, in addition to the normal cost. When you rez ACME S&L, gain 12 credits and trash ACME S&L. For the remainder of the game, pay 1 credit at the end of each of your turns, or lose the game. You can remove this effect, and score 1 agenda point, by taking an action to pay 12 credits.",
    );
    expect(cardsById["onr_v1_308_acme-savings-and-loan"]?.text).not.toContain(
      "gain 3 credits",
    );
    for (const cardId of ONR_V1_RUNTIME_RELEASE_CARD_IDS) {
      const card = cardsById[cardId];
      expect(card, cardId).toBeDefined();
      expect(card?.engineCardId).toBe(cardId);
      expect(card?.statuses.implemented).toBe(true);
      expect(card?.statuses.engine_supported).toBe(true);
      expect(card?.statuses.playable).toBe(true);
      expect(card?.statuses.human_playable).toBe(true);
      expect(card?.statuses.ai_supported).toBe(
        Boolean(aiApprovalByCardId[cardId]),
      );
      expect(card?.statuses.deck_legal).toBe(true);
      expect(card?.statuses.format_legal).toBe(true);
      expect(card?.implementationManifest?.manifestVersion).toBe(
        releaseEvidenceByCardId[cardId]?.implementationManifest.manifestVersion,
      );
      expect(card?.implementationManifest?.unitTests.length).toBeGreaterThan(0);
      expect(
        card?.implementationManifest?.scenarioTests.length,
      ).toBeGreaterThan(0);
      expect(
        card?.implementationManifest?.visibilityTests.length,
      ).toBeGreaterThan(0);
      expect(card?.implementationManifest?.replayTests.length).toBeGreaterThan(
        0,
      );
    }

    expect(cardsById["onr_v1_230_cortical-scanner"]?.numeric.rezCost).toBe(7);
    expect(cardsById["onr_v1_237_data-wall"]?.numeric.strength).toBe(0);
    expect(cardsById["onr_v1_238_data-wall-2-0"]?.numeric.rezCost).toBe(2);
    expect(cardsById["onr_v1_238_data-wall-2-0"]?.numeric.strength).toBe(1);
    expect(cardsById["onr_v1_239_endless-corridor"]?.numeric.strength).toBe(2);
    expect(cardsById["onr_v1_015_codeslinger"]?.text).toBe(
      "0 credits: Break sentry subroutine.",
    );
    expect(cardsById["onr_v1_146_zetatech-mem-chip"]?.numeric.installCost).toBe(
      3,
    );
    expect(cardsById["onr_v1_146_zetatech-mem-chip"]?.text).toBe(
      "Provides +2 MU.",
    );
    expect(
      cardsById["onr_v1_079_bodyweight-synthetic-blood"]?.numeric.cost,
    ).toBe(2);
    expect(
      cardsById["onr_v1_079_bodyweight-synthetic-blood"]?.numeric.installCost,
    ).toBeNull();
    expect(cardsById["onr_v1_079_bodyweight-synthetic-blood"]?.text).toBe(
      "Draw five cards.",
    );
    expect(cardsById["onr_v1_072_wild-card"]?.text).toBe(
      "0 credits: Break sentry subroutine.\n3 credits: +1 strength.",
    );
    expect(cardsById["onr_v1_145_wutech-mem-chip"]?.text).toBe(
      "Provides +1 MU.",
    );
    expect(cardsById["onr_v1_220_tycho-extension"]?.numeric.agendaPoints).toBe(
      4,
    );
    expect(cardsById["onr_v1_244_filter"]?.numeric.rezCost).toBe(0);
    expect(cardsById["onr_v1_256_mazer"]?.numeric.strength).toBe(5);
    expect(cardsById["onr_v1_006_black-dahlia"]?.statuses.deck_legal).toBe(
      true,
    );
    expect(cardsById["onr_v1_006_black-dahlia"]?.engineCardId).toBe(
      "onr_v1_006_black-dahlia",
    );
    expect(cardsById["onr_v1_006_black-dahlia"]?.text).toBe(
      "2 credits: Break sentry subroutine.\n2 credits: +1 strength.",
    );
    expect(cardsById["onr_v1_014_codecracker"]?.numeric.installCost).toBe(2);
    expect(cardsById["onr_v1_014_codecracker"]?.numeric.strength).toBe(0);
    expect(cardsById["onr_v1_073_wizards-book"]?.numeric.installCost).toBe(5);
    expect(cardsById["onr_v1_073_wizards-book"]?.numeric.strength).toBe(2);
    expect(cardsById["onr_v1_073_wizards-book"]?.text).toBe(
      "0 credits: Break code gate subroutine.\n2 credits: +1 strength.",
    );
    expect(cardsById["onr_v1_253_laser-wire"]?.text).toBe(
      "[Subroutine] Do 1 net damage.\n[Subroutine] End the run.",
    );
    expect(cardsById["onr_v1_278_wall-of-ice"]?.numeric.rezCost).toBe(13);
    expect(cardsById["onr_v1_293_netwatch-credit-voucher"]?.text).toBe(
      "Play only if Runner is tagged. Give Runner 1 tag and gain 1.",
    );
    expect(cardsById["onr_v1_295_night-shift"]?.numeric.cost).toBe(0);
    expect(cardsById["onr_v1_021_dwarf"]?.text).toBe(
      "1 credit: Break wall subroutine.\n1 credit: +1 strength.",
    );
    expect(cardsById["onr_v1_039_krash"]?.text).toBe(
      "2 credits: Break ice subroutine.\n2 credits: +1 strength.",
    );
    expect(cardsById["onr_v1_081_custodial-position"]?.text).toBe(
      "Make a run on R&D. If successful, access two additional cards from R&D.",
    );
    expect(cardsById["onr_v1_085_executive-wiretaps"]?.text).toBe(
      "Make a run on HQ. If successful, access two additional cards from HQ.",
    );
    expect(cardsById["onr_v1_243_fetch-4-0-1"]?.text).toBe(
      "[Subroutine] Trace 3 - If trace is successful, give Runner a tag.",
    );
    expect(cardsById["onr_v1_249_hunter"]?.numeric.rezCost).toBe(2);
    expect(
      cardsById["onr_v1_101_mit-west-tier"]?.implementationManifest
        ?.manifestVersion,
    ).toBe("card-implementation-manifest-v1.2.3");
    expect(cardsById["onr_v1_023_evil-twin"]?.text).toContain(
      "Prevents up to 2 net and/or core damage",
    );
    expect(cardsById["onr_v1_028_force-shield"]?.numeric.installCost).toBe(2);
    expect(
      cardsById["onr_v1_125_dermatech-bodyplating"]?.numeric.installCost,
    ).toBe(0);
    expect(cardsById["onr_v1_229_code-corpse"]?.numeric.rezCost).toBe(10);
    expect(cardsById["onr_v1_231_cortical-scrub"]?.text).toContain(
      "Do 1 core damage",
    );
    expect(cardsById["onr_v1_254_liche"]?.numeric.strength).toBe(6);
    expect(
      cardsById["onr_v1_212_priority-requisition"]?.implementationManifest
        ?.manifestVersion,
    ).toBe("card-implementation-manifest-v1.6.2");
    expect(cardsById["onr_v1_317_data-masons"]?.numeric.rezCost).toBe(1);
    expect(cardsById["onr_v1_320_encoder-inc"]?.numeric.trashCost).toBe(1);
    expect(
      cardsById["onr_v1_341_skalderviken-sa-beta-test-site"]?.text,
    ).toContain("Black ice costs 2 less to rez");
    expect(cardsById["onr_v1_233_d-arc-knight"]?.text).toContain(
      "Trash a program",
    );
    expect(cardsById["onr_v1_267_sentinels-prime"]?.numeric.rezCost).toBe(8);
    expect(cardsById["onr_v1_273_triggerman"]?.numeric.strength).toBe(3);
    expect(
      cardsById["onr_v1_350_antiquated-interface-routines"]?.text,
    ).toContain("+1 strength");
    expect(
      cardsById["onr_v1_371_tokyo-chiba-infighting"]?.implementationManifest
        ?.manifestVersion,
    ).toBe("card-implementation-manifest-v1.6.3");
    expect(cardsById["onr_v1_011_cloak"]?.numeric.installCost).toBe(7);
    expect(cardsById["onr_v1_011_cloak"]?.text).toContain(
      "not for noisy icebreakers",
    );
    expect(cardsById["onr_v1_036_jackhammer"]?.numeric.strength).toBe(0);
    expect(cardsById["onr_v1_069_succubus"]?.text).toContain("host up to 3 MU");
    expect(
      cardsById["onr_v1_163_floating-runner-bbs"]?.numeric.installCost,
    ).toBe(6);
    expect(
      cardsById["onr_v1_180_smiths-pawnshop"]?.implementationManifest
        ?.manifestVersion,
    ).toBe("card-implementation-manifest-v1.7.0");
    expect(
      cardsById["onr_v1_084_edited-shipping-manifests"]?.numeric.cost,
    ).toBe(1);
    expect(cardsById["onr_v1_084_edited-shipping-manifests"]?.text).toContain(
      "the Corp loses 1",
    );
    expect(cardsById["onr_v1_106_private-ldl-access"]?.numeric.cost).toBe(0);
    expect(cardsById["onr_v1_106_private-ldl-access"]?.text).toContain(
      "successful run on R&D",
    );
    expect(cardsById["onr_v1_114_temple-microcode-outlet"]?.text).toContain(
      "Search your stack for a program",
    );
    expect(cardsById["onr_v1_118_weather-to-finance-pipe"]?.text).toContain(
      "Corp loses 4 credits",
    );
    expect(cardsById["onr_v1_129_hq-interface"]?.numeric.installCost).toBe(4);
    expect(
      cardsById["onr_v1_129_hq-interface"]?.implementationManifest
        ?.manifestVersion,
    ).toBe("card-implementation-manifest-v1.7.1");
    expect(cardsById["onr_v1_158_danshis-second-id"]?.numeric.installCost).toBe(
      0,
    );
    expect(cardsById["onr_v1_179_silicon-saloon-franchise"]?.text).toContain(
      "Gain 1 credit and draw",
    );
    expect(cardsById["onr_v1_283_audit-of-call-records"]?.text).toContain(
      "Trace 5",
    );
    expect(cardsById["onr_v1_284_chance-observation"]?.numeric.cost).toBe(2);
    expect(
      cardsById["onr_v1_286_corporate-detective-agency"]?.implementationManifest
        ?.manifestVersion,
    ).toBe("card-implementation-manifest-v1.7.2");
    expect(cardsById["onr_v1_083_desperate-competitor"]?.text).toContain(
      "Gray Ops agendas",
    );
    expect(cardsById["onr_v1_090_hot-tip-for-wns"]?.numeric.cost).toBe(0);
    expect(cardsById["onr_v1_156_corporate-ally"]?.numeric.installCost).toBe(3);
    expect(cardsById["onr_v1_159_databroker"]?.text).toContain(
      "Gain 10 credits",
    );
    expect(
      cardsById["onr_v1_201_executive-extraction"]?.implementationManifest
        ?.manifestVersion,
    ).toBe("card-implementation-manifest-v1.8.0");
    expect(cardsById["onr_v1_214_project-babylon"]?.numeric.agendaPoints).toBe(
      1,
    );
    expect(cardsById["onr_v1_012_clown"]?.numeric.installCost).toBe(4);
    expect(cardsById["onr_v1_046_pattels-virus"]?.text).toContain(
      "Pattel counter",
    );
    expect(cardsById["onr_v1_049_pox"]?.text).toContain("Pox counter");
    expect(cardsById["onr_v1_094_inside-job"]?.numeric.cost).toBe(2);
    expect(
      cardsById["onr_v1_173_restrictive-net-zoning"]?.numeric.installCost,
    ).toBe(1);
    expect(
      cardsById["onr_v1_193_corporate-coup"]?.implementationManifest
        ?.manifestVersion,
    ).toBe("card-implementation-manifest-v1.8.1");
    expect(
      cardsById["onr_v1_209_political-coup"]?.numeric.advancementRequirement,
    ).toBe(4);
    expect(cardsById["onr_v1_222_ball-and-chain"]?.numeric.strength).toBe(5);
    expect(cardsById["onr_v1_225_canis-major"]?.numeric.rezCost).toBe(0);
    expect(cardsById["onr_v1_226_canis-minor"]?.numeric.strength).toBe(5);
    expect(cardsById["onr_v1_242_fatal-attractor"]?.text).toContain(
      "do 3 Net damage",
    );
    expect(cardsById["onr_v1_268_shock-r"]?.text).toContain("cannot jack out");
    expect(
      cardsById["onr_v1_005_bartmoss-memorial-icebreaker"]?.numeric.installCost,
    ).toBe(5);
    expect(cardsById["onr_v1_007_blink"]?.text).toContain("On a 4, 5, or 6");
    expect(cardsById["onr_v1_115_terrorist-reprisal"]?.numeric.cost).toBe(2);
    expect(cardsById["onr_v1_223_banpei"]?.numeric.strength).toBe(0);
    expect(
      cardsById["onr_v1_275_vacuum-link"]?.implementationManifest
        ?.manifestVersion,
    ).toBe("card-implementation-manifest-v1.9.0");
    expect(cardsById["onr_v1_013_cockroach"]?.numeric.installCost).toBe(0);
    expect(cardsById["onr_v1_034_incubator"]?.numeric.memoryCost).toBe(1);
    expect(cardsById["onr_v1_030_grubb"]?.text).toContain(
      "remainder of this run",
    );
    expect(
      cardsById["onr_v1_013_cockroach"]?.implementationManifest
        ?.manifestVersion,
    ).toBe("card-implementation-manifest-v1.9.1");
    expect(cardsById["onr_v1_076_all-nighter"]?.numeric.cost).toBe(0);
    expect(cardsById["onr_v1_096_kilroy-was-here"]?.text).toContain(
      "run on R&D",
    );
    expect(cardsById["onr_v1_107_romp-through-hq"]?.numeric.cost).toBe(2);
    expect(
      cardsById["onr_v1_184_top-runners-conference"]?.numeric.installCost,
    ).toBe(0);
    expect(
      cardsById["onr_v1_188_ai-chief-financial-officer"]?.numeric
        .advancementRequirement,
    ).toBe(5);
    expect(
      cardsById["onr_v1_211_polymer-breakthrough"]?.numeric.agendaPoints,
    ).toBe(3);
    expect(cardsById["onr_v1_235_data-naga"]?.numeric.strength).toBe(5);
    expect(
      cardsById["onr_v1_235_data-naga"]?.implementationManifest
        ?.manifestVersion,
    ).toBe("card-implementation-manifest-v1.9.2");
    expect(
      cardsById["onr_v1_207_netwatch-operations-office"]?.numeric
        .advancementRequirement,
    ).toBe(5);
    expect(
      cardsById["onr_v1_213_private-cybernet-police"]?.numeric.agendaPoints,
    ).toBe(2);
    expect(cardsById["onr_v1_213_private-cybernet-police"]?.text).toContain(
      "Trace 5",
    );
    expect(cardsById["onr_v1_251_jack-attack"]?.numeric.strength).toBe(3);
    expect(cardsById["onr_v1_251_jack-attack"]?.text).toContain(
      "Runner cannot jack out",
    );
    expect(cardsById["onr_v1_271_tko-2-0"]?.numeric.rezCost).toBe(7);
    expect(cardsById["onr_v1_271_tko-2-0"]?.text).toContain(
      "forgoes his or her next action",
    );
    expect(
      cardsById["onr_v1_251_jack-attack"]?.implementationManifest
        ?.manifestVersion,
    ).toBe("card-implementation-manifest-v1.9.3");
    expect(
      cardsById["onr_v1_208_on-call-solo-team"]?.numeric.advancementRequirement,
    ).toBe(4);
    expect(
      cardsById["onr_v1_217_strike-force-kali"]?.numeric.agendaPoints,
    ).toBe(3);
    expect(cardsById["onr_v1_208_on-call-solo-team"]?.text).toContain(
      "meat damage",
    );
    expect(
      cardsById["onr_v1_217_strike-force-kali"]?.implementationManifest
        ?.manifestVersion,
    ).toBe("card-implementation-manifest-v1.9.4");
    expect(
      cardsById["onr_v1_005_bartmoss-memorial-icebreaker"]?.statuses
        .ai_supported,
    ).toBe(true);
    expect(cardsById["onr_v1_013_cockroach"]?.statuses.human_playable).toBe(
      true,
    );
    expect(cardsById["onr_v1_034_incubator"]?.statuses.human_playable).toBe(
      true,
    );
    expect(cardsById["onr_v1_030_grubb"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_013_cockroach"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_034_incubator"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_030_grubb"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_076_all-nighter"]?.statuses.ai_supported).toBe(
      true,
    );
    expect(cardsById["onr_v1_096_kilroy-was-here"]?.statuses.ai_supported).toBe(
      true,
    );
    expect(cardsById["onr_v1_107_romp-through-hq"]?.statuses.ai_supported).toBe(
      true,
    );
    expect(
      cardsById["onr_v1_184_top-runners-conference"]?.statuses.ai_supported,
    ).toBe(true);
    expect(
      cardsById["onr_v1_188_ai-chief-financial-officer"]?.statuses.ai_supported,
    ).toBe(true);
    expect(
      cardsById["onr_v1_211_polymer-breakthrough"]?.statuses.ai_supported,
    ).toBe(true);
    expect(cardsById["onr_v1_235_data-naga"]?.statuses.ai_supported).toBe(true);
    expect(
      cardsById["onr_v1_207_netwatch-operations-office"]?.statuses.ai_supported,
    ).toBe(true);
    expect(
      cardsById["onr_v1_213_private-cybernet-police"]?.statuses.ai_supported,
    ).toBe(true);
    expect(cardsById["onr_v1_251_jack-attack"]?.statuses.ai_supported).toBe(
      true,
    );
    expect(cardsById["onr_v1_271_tko-2-0"]?.statuses.ai_supported).toBe(true);
    expect(
      cardsById["onr_v1_208_on-call-solo-team"]?.statuses.ai_supported,
    ).toBe(true);
    expect(
      cardsById["onr_v1_217_strike-force-kali"]?.statuses.ai_supported,
    ).toBe(true);
    expect(cardsById["onr_v1_021_dwarf"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_039_krash"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_066_snowball"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_066_snowball"]?.numeric.installCost).toBe(10);
    expect(cardsById["onr_v1_066_snowball"]?.numeric.strength).toBe(0);
    expect(cardsById["onr_v1_074_worm"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_074_worm"]?.numeric.installCost).toBe(4);
    expect(cardsById["onr_v1_074_worm"]?.numeric.strength).toBe(2);
    expect(cardsById["onr_v1_243_fetch-4-0-1"]?.statuses.ai_supported).toBe(
      true,
    );
    expect(cardsById["onr_v1_249_hunter"]?.statuses.ai_supported).toBe(true);
    expect(
      cardsById["onr_v1_287_datapool-by-zetatech"]?.statuses.ai_supported,
    ).toBe(true);
    expect(
      cardsById["onr_v1_293_netwatch-credit-voucher"]?.statuses.ai_supported,
    ).toBe(true);
    expect(cardsById["onr_v1_306_trojan-horse"]?.statuses.ai_supported).toBe(
      true,
    );
    expect(cardsById["onr_v1_101_mit-west-tier"]?.statuses.ai_supported).toBe(
      true,
    );
    expect(cardsById["onr_v1_297_overtime-incentives"]?.numeric.cost).toBe(4);
    if (
      existsSync(
        "data/local/card-import/onr-v1-limited/card-snapshot-onr-v1-limited.local.json",
      )
    ) {
      expect(cardsById["onr_v1_075_zetatech-software-installer"]?.text).toBe(
        "Put 2 bits on Software Installer when it is installed. Use these bits only to pay for installing programs. You may use these bits to install a program overlying Software Installer itself. If you use any of these bits, replace them at the start of your next turn.",
      );
    }
    expect(cardsById["onr_v1_001_afreet"]?.text).toContain(
      "Afreet can host up to 3 MU",
    );
    expect(cardsById["onr_v1_001_afreet"]?.statuses.deck_legal).toBe(true);
    expect(cardsById["onr_v1_001_afreet"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_018_dogcatcher"]?.statuses.deck_legal).toBe(true);
    expect(cardsById["onr_v1_018_dogcatcher"]?.statuses.format_legal).toBe(
      true,
    );
    expect(cardsById["onr_v1_018_dogcatcher"]?.statuses.ai_supported).toBe(
      true,
    );
    expect(cardsById["onr_v1_018_dogcatcher"]?.engineCardId).toBe(
      "onr_v1_018_dogcatcher",
    );
    expect(cardsById["onr_v1_019_dropp"]?.statuses.deck_legal).toBe(true);
    expect(cardsById["onr_v1_019_dropp"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_019_dropp"]?.engineCardId).toBe(
      "onr_v1_019_dropp",
    );
  });

  it("honors user-confirmed O:NR v1 card attribute conflict decisions", () => {
    const decisions = onrV1AttributeConflictDecisionsData as {
      status: string;
      gateAssertions: {
        hostileTakeoverGain5: boolean;
        privateCybernetPoliceTrace5: boolean;
        dataWall20Rez2Strength1: boolean;
        noRuntimePromotionChanged: boolean;
        noAiPromotionChanged: boolean;
      };
      decisions: Array<{
        cardId: string;
        attribute: string;
        value: unknown;
        rejectedValues: unknown[];
      }>;
    };
    const decisionByCardId = Object.fromEntries(
      decisions.decisions.map((decision) => [decision.cardId, decision]),
    );
    const cardsById = createRuntimeCardsById();

    expect(decisions.status).toBe("user_confirmed");
    expect(decisions.gateAssertions.hostileTakeoverGain5).toBe(true);
    expect(decisions.gateAssertions.privateCybernetPoliceTrace5).toBe(true);
    expect(decisions.gateAssertions.dataWall20Rez2Strength1).toBe(true);
    expect(decisions.gateAssertions.noRuntimePromotionChanged).toBe(true);
    expect(decisions.gateAssertions.noAiPromotionChanged).toBe(true);
    expect(decisionByCardId["onr_v1_203_hostile-takeover"]?.value).toBe(5);
    expect(
      decisionByCardId["onr_v1_203_hostile-takeover"]?.rejectedValues,
    ).toContain(6);
    expect(cardsById["onr_v1_203_hostile-takeover"]?.text).toContain("Gain 5");
    expect(decisionByCardId["onr_v1_213_private-cybernet-police"]?.value).toBe(
      5,
    );
    expect(
      decisionByCardId["onr_v1_213_private-cybernet-police"]?.rejectedValues,
    ).toContain(7);
    expect(cardsById["onr_v1_213_private-cybernet-police"]?.text).toContain(
      "Trace 5",
    );
    expect(decisionByCardId["onr_v1_238_data-wall-2-0"]?.value).toEqual({
      rezCost: 2,
      strength: 1,
    });
    expect(cardsById["onr_v1_238_data-wall-2-0"]?.numeric.rezCost).toBe(2);
    expect(cardsById["onr_v1_238_data-wall-2-0"]?.numeric.strength).toBe(1);
  });

  it("keeps V1.9.10 status consolidation to manifest and catalog parity without promotion", () => {
    const cardsById = createRuntimeCardsById();
    if (!cardsById["onr_v1_243_fetch-4-0-1"]) return;

    const v1910Cards = cardImplementationManifest1910Data.cards as Array<{
      cardCode: string;
      newlyPromotedInV1910: boolean;
      implementationManifestRef: string;
      aiApprovalManifestRef: string;
    }>;
    const v1910CardIds = v1910Cards.map((card) => card.cardCode).sort();
    const reconciledIds = [
      "onr_v1_243_fetch-4-0-1",
      "onr_v1_249_hunter",
      "onr_v1_306_trojan-horse",
    ].sort();

    expect(v1910CardIds).toEqual(reconciledIds);
    expect(
      v1910Cards.every((card) => card.newlyPromotedInV1910 === false),
    ).toBe(true);
    expect(
      v1910Cards.every(
        (card) =>
          card.implementationManifestRef ===
          "data/manifests/card-implementation-manifest-1.2.3.json",
      ),
    ).toBe(true);
    expect(
      v1910Cards.every(
        (card) =>
          card.aiApprovalManifestRef ===
          "data/manifests/deck-legal-ai-approval-corp-tag-slice-manifest.json",
      ),
    ).toBe(true);

    const v123ManifestCards = (
      cardImplementationManifest123Data.cards as Array<{ cardCode: string }>
    )
      .map((card) => card.cardCode)
      .sort();
    expect(v123ManifestCards).toEqual([...ONR_V1_2_3_RELEASE_CARD_IDS].sort());
    expect(
      cardImplementationManifest123Data.gateAssertions
        .currentRuntimePlayableCardCountIs11,
    ).toBe(true);
    expect(
      cardImplementationManifest123Data.v1910Reconciliation
        .noNewRuntimePromotion,
    ).toBe(true);

    const runtimeOnrCards = Object.values(cardsById).filter(
      (card) =>
        card.catalogCardId.startsWith("onr_v1_") &&
        card.statuses.human_playable &&
        card.statuses.deck_legal,
    );
    const runtimeAiSupportedOnrCards = runtimeOnrCards.filter(
      (card) => card.statuses.ai_supported,
    );
    expect(runtimeOnrCards.map((card) => card.catalogCardId).sort()).toEqual(
      [...ONR_V1_RUNTIME_RELEASE_CARD_IDS].sort(),
    );
    expect(runtimeOnrCards).toHaveLength(
      ONR_V1_RUNTIME_RELEASE_CARD_IDS.length,
    );
    expect(runtimeAiSupportedOnrCards).toHaveLength(
      ONR_V1_RUNTIME_RELEASE_CARD_IDS.length,
    );

    expect(v1910RuntimeStatusReportData.counts.localOriginalsetCards).toBe(374);
    expect(
      v1910RuntimeStatusReportData.counts.runtimeHumanPlayableDeckLegalCards,
    ).toBe(143);
    expect(v1910RuntimeStatusReportData.counts.runtimeAiSupportedOnrCards).toBe(
      143,
    );
    expect(
      v1910RuntimeStatusReportData.counts.notHumanPlayableDeckLegalAiSupported,
    ).toBe(231);
    expect(
      v1910RuntimeStatusReportData.noPromotionGate.newHumanPlayableCards,
    ).toEqual([]);
    expect(
      v1910RuntimeStatusReportData.noPromotionGate.newDeckLegalCards,
    ).toEqual([]);
    expect(
      v1910RuntimeStatusReportData.noPromotionGate.newAiSupportedCards,
    ).toEqual([]);

    const legacyCatalogIndexPath =
      "data/local/card-import/onr-v1-limited/catalog-index-onr-v1-limited.local.json";
    if (existsSync(legacyCatalogIndexPath)) {
      const legacyCatalogIndexText = readFileSync(
        legacyCatalogIndexPath,
        "utf8",
      );
      expect(legacyCatalogIndexText).not.toContain("@@");
      expect(() => JSON.parse(legacyCatalogIndexText)).not.toThrow();
    } else {
      expect(
        v1910RuntimeStatusReportData.localCatalogIndex
          .statusInAutomationWorktree,
      ).toBe("absent_in_automation_worktree");
      expect(
        v1910RuntimeStatusReportData.localCatalogIndex.versionedFallback,
      ).toBe("data/reports/onr-v1-runtime-status-1.9.10.json");
    }

    expect((v1910StatusScenarioData.cards as string[]).sort()).toEqual(
      reconciledIds,
    );
    expect(v1910MechanicsCoverageData.gateAssertions.noNewMechanics).toBe(true);
  });

  it("approves exactly the King of the Road Runner cards for AI after hints and scenario gates", () => {
    const cardsById = createRuntimeCardsById();
    if (!cardsById["onr_v1_006_black-dahlia"]) return;
    const approved = new Set<string>(KING_OF_THE_ROAD_AI_APPROVED_CARD_IDS);
    const hints = kingOfTheRoadAiHintsData.cards as Array<{
      cardId: string;
      roles: string[];
      planRoles: string[];
      requiredMechanics: string[];
      valueHints: Record<string, number>;
      riskTags: string[];
      aiSupportStatus: string;
      scenarioRefs: string[];
    }>;
    const manifestCards = kingOfTheRoadManifestData.cards as Array<{
      cardId: string;
      status: string;
      scenarioRefs: string[];
    }>;
    const scenarioCards = new Set(
      (
        kingOfTheRoadScenarioData.scenarios as Array<{ cards: string[] }>
      ).flatMap((scenario) => scenario.cards),
    );

    expect(KING_OF_THE_ROAD_AI_APPROVED_CARD_IDS).toHaveLength(14);
    expect(hints.map((hint) => hint.cardId).sort()).toEqual(
      [...approved].sort(),
    );
    expect(manifestCards.map((card) => card.cardId).sort()).toEqual(
      [...approved].sort(),
    );
    expect(kingOfTheRoadScenarioData.deckSnapshotId).toBe(
      "king_of_the_road_runner_ai_snapshot_v1",
    );
    expect(kingOfTheRoadScenarioData.corpPairingSnapshotId).toBe(
      "demo_corp_008_snapshot_v0_8",
    );

    for (const cardId of KING_OF_THE_ROAD_AI_APPROVED_CARD_IDS) {
      const card = cardsById[cardId];
      const hint = hints.find((candidate) => candidate.cardId === cardId);
      const manifest = manifestCards.find(
        (candidate) => candidate.cardId === cardId,
      );
      expect(card?.statuses.human_playable, cardId).toBe(true);
      expect(card?.statuses.deck_legal, cardId).toBe(true);
      expect(card?.statuses.ai_supported, cardId).toBe(true);
      expect(hint?.aiSupportStatus, cardId).toBe("ai_supported");
      expect(hint?.roles.length, cardId).toBeGreaterThan(0);
      expect(hint?.planRoles.length, cardId).toBeGreaterThan(0);
      expect(hint?.requiredMechanics.length, cardId).toBeGreaterThan(0);
      expect(
        Object.keys(hint?.valueHints ?? {}).length,
        cardId,
      ).toBeGreaterThan(0);
      expect(hint?.riskTags.length, cardId).toBeGreaterThan(0);
      expect(hint?.scenarioRefs.length, cardId).toBeGreaterThan(0);
      expect(manifest?.status, cardId).toBe("ai_supported");
      expect(manifest?.scenarioRefs.length, cardId).toBeGreaterThan(0);
      expect(scenarioCards.has(cardId), cardId).toBe(true);
    }

    const otherLocalOnrAiSupported = Object.values(cardsById)
      .filter(
        (card) =>
          card.catalogCardId.startsWith("onr_v1_") &&
          card.statuses.ai_supported,
      )
      .map((card) => card.catalogCardId)
      .sort();
    expect(otherLocalOnrAiSupported).toEqual(
      activeAiApprovedCardIds
        .filter((cardId) => cardId.startsWith("onr_v1_"))
        .sort(),
    );
    expect(
      JSON.stringify({
        kingOfTheRoadAiHintsData,
        kingOfTheRoadManifestData,
        kingOfTheRoadScenarioData,
      }),
    ).not.toMatch(
      /"cardInstances"\s*:|"privatePayload"\s*:|"sessionToken"\s*:|"reconnectToken"\s*:|"joinToken"\s*:|"tokenHash"\s*:|[A-Za-z]:\\/,
    );
  });

  for (const approvalCase of CARDS_SCENARIO_AI_APPROVAL_CASES) {
    it(approvalCase.title, () => {
      expectCardsScenarioAiApprovalGate(approvalCase);
    });
  }

  it("approves the V1.9.22 longtail completion slice after full gates", () => {
    const cardsById = createRuntimeCardsById();
    const manifestCards = cardImplementationManifest1922Data.cards as Array<{
      cardCode: string;
      releaseStatus: string;
      aiSupported: boolean;
      resolverFamily: string;
      coveredSmokes: string[];
    }>;
    const manifestIds = manifestCards.map((card) => card.cardCode);
    const plannedCards = manifestCards.filter(
      (card) => card.releaseStatus === "planned_no_promotion",
    );
    const approved = new Set<string>(DECK_LEGAL_AI_APPROVAL_V1922_CARD_IDS);
    const hints = deckLegalV1922AiHintsData.cards as Array<{
      cardId: string;
      aiSupportStatus: string;
      requiredMechanics: string[];
      scenarioRefs: string[];
    }>;
    const aiManifestCards = deckLegalV1922ManifestData.cards as Array<{
      cardId: string;
      status: string;
      scenarioRefs: string[];
    }>;
    const aiScenarioCards = new Set(
      (
        deckLegalV1922ScenarioData.scenarios as Array<{ coversCards: string[] }>
      ).flatMap((scenario) => scenario.coversCards),
    );

    expect(ONR_V1_9_22_WIP_CARD_IDS).toHaveLength(47);
    expect(manifestIds.sort()).toEqual([...ONR_V1_9_22_WIP_CARD_IDS].sort());
    expect(DECK_LEGAL_AI_APPROVAL_V1922_CARD_IDS).toHaveLength(47);
    expect(ONR_V1_9_22_RELEASE_CARD_IDS).toHaveLength(47);
    expect(ONR_V1_9_22_WIP_CARD_IDS).toEqual(ONR_V1_9_22_RELEASE_CARD_IDS);
    expect(hints.map((hint) => hint.cardId).sort()).toEqual(
      [...approved].sort(),
    );
    expect(aiManifestCards.map((card) => card.cardId).sort()).toEqual(
      [...approved].sort(),
    );
    expect([...aiScenarioCards].sort()).toEqual([...approved].sort());
    expect(v1922ReleaseScenarioData.coversCards.sort()).toEqual(
      [...ONR_V1_9_22_WIP_CARD_IDS].sort(),
    );
    expect(cardImplementationManifest1922Data.status).toBe("release");
    expect(
      cardImplementationManifest1922Data.gateAssertions.catalogPromotionPending,
    ).toBe(false);
    expect(
      cardImplementationManifest1922Data.gateAssertions.aiPromotionPending,
    ).toBe(false);
    expect(
      cardImplementationManifest1922Data.gateAssertions.allCardsHumanPlayable,
    ).toBe(true);
    expect(
      cardImplementationManifest1922Data.gateAssertions.allCardsDeckLegal,
    ).toBe(true);
    expect(
      cardImplementationManifest1922Data.gateAssertions.allCardsAiSupported,
    ).toBe(true);
    expect(v1922ReleaseScenarioData.status).toBe(
      "human_playable_deck_legal_ai_supported",
    );
    expect(v1922ReleaseScenarioData.completionGate.catalogPromoted).toBe(true);
    expect(v1922ReleaseScenarioData.completionGate.aiPromoted).toBe(true);
    expect(v1922ReleaseScenarioData.completionGate.releaseDone).toBe(true);
    expect(v1922MechanicsCoverageData.status).toBe("release");
    expect(
      v1922MechanicsCoverageData.gateAssertions.catalogPromotionPending,
    ).toBe(false);
    expect(v1922MechanicsCoverageData.gateAssertions.aiPromotionPending).toBe(
      false,
    );

    for (const group of V1922_LONGTAIL_COMPLETION_GROUPS) {
      expectV1922LongtailCompletionGroup(manifestCards, group);
    }

    expect(plannedCards).toHaveLength(0);
    for (const card of manifestCards) {
      expect(ONR_V1_RUNTIME_RELEASE_CARD_IDS, card.cardCode).toContain(
        card.cardCode,
      );
      expect(
        cardsById[card.cardCode]?.statuses.human_playable ?? false,
        card.cardCode,
      ).toBe(true);
      expect(
        cardsById[card.cardCode]?.statuses.deck_legal ?? false,
        card.cardCode,
      ).toBe(true);
      expect(
        cardsById[card.cardCode]?.statuses.ai_supported ?? false,
        card.cardCode,
      ).toBe(true);
      expect(card.aiSupported, card.cardCode).toBe(true);
      expect(
        hints.find((hint) => hint.cardId === card.cardCode)?.aiSupportStatus,
        card.cardCode,
      ).toBe("ai_supported");
      expect(
        aiManifestCards.find((entry) => entry.cardId === card.cardCode)?.status,
        card.cardCode,
      ).toBe("ai_supported");
      expect(aiScenarioCards.has(card.cardCode), card.cardCode).toBe(true);
    }

    expect(
      JSON.stringify({
        deckLegalV1922AiHintsData,
        deckLegalV1922ManifestData,
        deckLegalV1922ScenarioData,
        cardImplementationManifest1922Data,
        v1922ReleaseScenarioData,
        v1922MechanicsCoverageData,
      }),
    ).not.toMatch(
      /"cardInstances"\s*:|"privatePayload"\s*:|"sessionToken"\s*:|"reconnectToken"\s*:|"joinToken"\s*:|"tokenHash"\s*:|"fullState"\s*:|[A-Za-z]:\\/,
    );
  });

  it("keeps the V1.9.22 resolver contract inventory exhaustive and non-promoting", () => {
    const inventory = v1922ResolverContractInventoryData as {
      status: string;
      gateAssertions: {
        coversExactWipScope: boolean;
        noClusterReadyForPromotion: boolean;
        catalogPromotionPending: boolean;
        aiPromotionPending: boolean;
      };
      clusters: Array<{
        clusterId: string;
        contractStatus: string;
        cardIds: string[];
        confirmedFields: string[];
        missingFields: string[];
        safeCurrentCoverage: string[];
        partialLocalNotes?: Array<{
          cardIds: string[];
          note: string;
          sourceRef: string;
        }>;
      }>;
    };
    const coveredCards = inventory.clusters.flatMap(
      (cluster) => cluster.cardIds,
    );
    const partialLocalNotes = inventory.clusters.flatMap((cluster) =>
      (cluster.partialLocalNotes ?? []).map((note) => ({
        ...note,
        clusterId: cluster.clusterId,
        clusterCardIds: cluster.cardIds,
      })),
    );

    expect(inventory.status).toBe("wip_no_promotion_contract_inventory");
    expect(inventory.gateAssertions.coversExactWipScope).toBe(true);
    expect(inventory.gateAssertions.noClusterReadyForPromotion).toBe(true);
    expect(inventory.gateAssertions.catalogPromotionPending).toBe(true);
    expect(inventory.gateAssertions.aiPromotionPending).toBe(true);
    expect([...new Set(coveredCards)].sort()).toEqual(
      [...ONR_V1_9_22_WIP_CARD_IDS].sort(),
    );
    expect(coveredCards).toHaveLength(ONR_V1_9_22_WIP_CARD_IDS.length);
    expect(
      inventory.clusters.map((cluster) => cluster.clusterId).sort(),
    ).toEqual([
      "corp_agendas",
      "corp_ice",
      "corp_operations",
      "runner_events",
      "runner_hardware",
      "runner_programs",
    ]);

    for (const cluster of inventory.clusters) {
      expect(cluster.contractStatus, cluster.clusterId).not.toBe(
        "ready_for_promotion",
      );
      expect(cluster.confirmedFields.length, cluster.clusterId).toBeGreaterThan(
        0,
      );
      expect(cluster.missingFields.length, cluster.clusterId).toBeGreaterThan(
        0,
      );
      expect(
        cluster.safeCurrentCoverage.length,
        cluster.clusterId,
      ).toBeGreaterThan(0);
    }

    expect(partialLocalNotes.length).toBeGreaterThan(0);
    for (const note of partialLocalNotes) {
      expect(note.sourceRef).toBe(
        "docs/derived/V1_0_5K_CARD_RELEASE_REQUIREMENTS.md",
      );
      expect(note.note.trim(), note.clusterId).not.toBe("");
      expect(note.note, note.clusterId).not.toMatch(
        /ready_for_promotion|ai_supported|deck_legal|human_playable/i,
      );
      for (const cardId of note.cardIds) {
        expect(note.clusterCardIds, `${note.clusterId}:${cardId}`).toContain(
          cardId,
        );
        expect(
          ONR_V1_9_22_WIP_CARD_IDS,
          `${note.clusterId}:${cardId}`,
        ).toContain(cardId);
      }
    }
  });

  it("tracks per-card V1.9.22 resolver contracts without promotion-ready entries", () => {
    const contracts = v1922ResolverContractsData as {
      status: string;
      gateAssertions: {
        coversExactWipScope: boolean;
        cardCount: number;
        readyForPromotionCount: number;
        readyForNewResolverImplementationCount: number;
        hardwareInstallBaseCoveredCount: number;
        runtimePromotionUnchanged: boolean;
        catalogPromotionUnchanged: boolean;
        aiPromotionUnchanged: boolean;
      };
      cards: Array<{
        cardId: string;
        cluster: string;
        contractStatus: string;
        confirmedLocalFacts: string[];
        safeCurrentCoverage: string[];
        missingInformation: string[];
        removalCondition: string;
      }>;
    };
    const cardIds = contracts.cards.map((card) => card.cardId);

    expect(contracts.status).toBe("contract_matrix_no_promotion");
    expect(contracts.gateAssertions.coversExactWipScope).toBe(true);
    expect(contracts.gateAssertions.cardCount).toBe(
      ONR_V1_9_22_WIP_CARD_IDS.length,
    );
    expect(contracts.gateAssertions.readyForPromotionCount).toBe(0);
    expect(
      contracts.gateAssertions.readyForNewResolverImplementationCount,
    ).toBe(2);
    expect(contracts.gateAssertions.hardwareInstallBaseCoveredCount).toBe(9);
    expect(contracts.gateAssertions.runtimePromotionUnchanged).toBe(true);
    expect(contracts.gateAssertions.catalogPromotionUnchanged).toBe(true);
    expect(contracts.gateAssertions.aiPromotionUnchanged).toBe(true);
    expect([...new Set(cardIds)].sort()).toEqual(
      [...ONR_V1_9_22_WIP_CARD_IDS].sort(),
    );
    expect(cardIds).toHaveLength(ONR_V1_9_22_WIP_CARD_IDS.length);

    for (const card of contracts.cards) {
      expect(card.contractStatus, card.cardId).not.toMatch(
        /ready_for_promotion/,
      );
      expect(card.confirmedLocalFacts.length, card.cardId).toBeGreaterThan(0);
      expect(card.safeCurrentCoverage.length, card.cardId).toBeGreaterThan(0);
      expect(card.missingInformation.length, card.cardId).toBeGreaterThan(0);
      expect(card.removalCondition.trim(), card.cardId).not.toBe("");
    }
  });

  it("tracks the V1.9.22 local resolver working basis without promotion", () => {
    const basis = v1922LocalResolverWorkingBasisData as {
      status: string;
      gateAssertions: {
        runtimePromotionUnchanged: boolean;
        catalogPromotionUnchanged: boolean;
        aiPromotionUnchanged: boolean;
        readyForNarrowResolverImplementationCount: number;
        readyForPromotionCount: number;
        firstImplementationCandidate: string;
      };
      readyCandidates: Array<{
        cardId: string;
        readinessStatus: string;
        numericContract: Record<string, unknown>;
        resolverContract: {
          trigger: string;
          timing: string;
          visibility: string;
          replayStateHash: string;
          aiFallback: string;
        };
        conflictResolution?: {
          resolvedBy: string;
          decision: string;
        };
        requiredImplementationChecks: string[];
      }>;
      reviewedDeferredCandidates: Array<{
        cardId: string;
        status: string;
        reason: string;
      }>;
    };
    const readyCandidateIds = basis.readyCandidates.map(
      (candidate) => candidate.cardId,
    );
    const corporateWar = basis.readyCandidates.find(
      (candidate) => candidate.cardId === "onr_v1_196_corporate-war",
    );
    const politicalOverthrow = basis.readyCandidates.find(
      (candidate) => candidate.cardId === "onr_v1_210_political-overthrow",
    );

    expect(basis.status).toBe("working_basis_no_promotion");
    expect(basis.gateAssertions.runtimePromotionUnchanged).toBe(true);
    expect(basis.gateAssertions.catalogPromotionUnchanged).toBe(true);
    expect(basis.gateAssertions.aiPromotionUnchanged).toBe(true);
    expect(basis.gateAssertions.readyForNarrowResolverImplementationCount).toBe(
      2,
    );
    expect(basis.gateAssertions.readyForPromotionCount).toBe(0);
    expect(basis.gateAssertions.firstImplementationCandidate).toBe(
      "onr_v1_196_corporate-war",
    );
    expect(readyCandidateIds.sort()).toEqual([
      "onr_v1_196_corporate-war",
      "onr_v1_210_political-overthrow",
    ]);
    for (const candidateId of readyCandidateIds) {
      expect(ONR_V1_9_22_WIP_CARD_IDS).toContain(candidateId);
    }

    expect(corporateWar?.readinessStatus).toBe(
      "ready_for_narrow_resolver_implementation_not_promotion",
    );
    expect(corporateWar?.numericContract.advancementRequirement).toBe(3);
    expect(corporateWar?.numericContract.agendaPoints).toBe(3);
    expect(corporateWar?.numericContract.creditThreshold).toBe(12);
    expect(corporateWar?.numericContract.creditGainOnThresholdMet).toBe(12);
    expect(corporateWar?.numericContract.creditResultOnThresholdMiss).toBe(
      "lose_all_credits",
    );

    expect(politicalOverthrow?.readinessStatus).toBe(
      "ready_for_narrow_resolver_implementation_not_promotion",
    );
    expect(politicalOverthrow?.numericContract.advancementRequirement).toBe(9);
    expect(politicalOverthrow?.numericContract.agendaPoints).toBe(6);
    expect(politicalOverthrow?.numericContract.actionCost).toBe(1);
    expect(politicalOverthrow?.numericContract.creditGain).toBe(3);
    expect(politicalOverthrow?.conflictResolution?.resolvedBy).toBe(
      "user_chat_confirmation",
    );
    expect(politicalOverthrow?.conflictResolution?.decision).toBe("gain_3");

    for (const candidate of basis.readyCandidates) {
      expect(candidate.readinessStatus, candidate.cardId).toBe(
        "ready_for_narrow_resolver_implementation_not_promotion",
      );
      expect(
        candidate.requiredImplementationChecks.length,
        candidate.cardId,
      ).toBeGreaterThan(0);
      expect(
        candidate.resolverContract.trigger.trim(),
        candidate.cardId,
      ).not.toBe("");
      expect(
        candidate.resolverContract.timing.trim(),
        candidate.cardId,
      ).not.toBe("");
      expect(candidate.resolverContract.visibility, candidate.cardId).toContain(
        "no_hidden_card_identity",
      );
      expect(
        candidate.resolverContract.replayStateHash,
        candidate.cardId,
      ).toContain("deterministic");
      expect(
        candidate.resolverContract.aiFallback.trim(),
        candidate.cardId,
      ).not.toBe("");
      expect(ONR_V1_9_22_WIP_CARD_IDS).toContain(candidate.cardId);
    }

    expect(
      basis.reviewedDeferredCandidates
        .map((candidate) => candidate.cardId)
        .sort(),
    ).toEqual([
      "onr_v1_077_anonymous-tip",
      "onr_v1_080_core-command-jettison-ice",
      "onr_v1_086_forged-activation-orders",
      "onr_v1_119_arasaka-portable-prototype",
      "onr_v1_136_pandoras-deck",
    ]);
    for (const candidate of basis.reviewedDeferredCandidates) {
      expect(ONR_V1_9_22_WIP_CARD_IDS).toContain(candidate.cardId);
      expect(candidate.status.trim(), candidate.cardId).not.toBe("");
      expect(candidate.reason.trim(), candidate.cardId).not.toBe("");
      expect(readyCandidateIds).not.toContain(candidate.cardId);
    }
  });

  it("tracks V1.9.22 local card facts for the full WIP scope without promotion", () => {
    const facts = v1922LocalCardFactsData as {
      status: string;
      gateAssertions: {
        coversExactV1922WipScope: boolean;
        cardCount: number;
        localFactsAvailableCount: number;
        unresolvedUserAttributeConflictCount: number;
        runtimePromotionChanged: boolean;
        catalogPromotionChanged: boolean;
        aiPromotionChanged: boolean;
      };
      cards: Array<{
        cardId: string;
        localFactStatus: string;
        effectSummary: string;
        implementationContractNeeded: string[];
        readyForNarrowImplementation?: boolean;
        numeric: Record<string, unknown>;
      }>;
    };
    const factCardIds = facts.cards.map((card) => card.cardId);
    const readyCandidateIds = facts.cards
      .filter((card) => card.readyForNarrowImplementation)
      .map((card) => card.cardId);
    const politicalOverthrow = facts.cards.find(
      (card) => card.cardId === "onr_v1_210_political-overthrow",
    );

    expect(facts.status).toBe("local_facts_available_no_promotion");
    expect(facts.gateAssertions.coversExactV1922WipScope).toBe(true);
    expect(facts.gateAssertions.cardCount).toBe(
      ONR_V1_9_22_WIP_CARD_IDS.length,
    );
    expect(facts.gateAssertions.localFactsAvailableCount).toBe(
      ONR_V1_9_22_WIP_CARD_IDS.length,
    );
    expect(facts.gateAssertions.unresolvedUserAttributeConflictCount).toBe(0);
    expect(facts.gateAssertions.runtimePromotionChanged).toBe(false);
    expect(facts.gateAssertions.catalogPromotionChanged).toBe(false);
    expect(facts.gateAssertions.aiPromotionChanged).toBe(false);
    expect([...new Set(factCardIds)].sort()).toEqual(
      [...ONR_V1_9_22_WIP_CARD_IDS].sort(),
    );
    expect(readyCandidateIds.sort()).toEqual([
      "onr_v1_196_corporate-war",
      "onr_v1_210_political-overthrow",
    ]);
    expect(politicalOverthrow?.numeric.creditGain).toBe(3);
    expect(politicalOverthrow?.localFactStatus).toBe("complete_user_corrected");

    for (const card of facts.cards) {
      expect(ONR_V1_RUNTIME_RELEASE_CARD_IDS, card.cardId).toContain(
        card.cardId,
      );
      expect(card.localFactStatus.trim(), card.cardId).toMatch(/^complete/);
      expect(card.effectSummary.trim(), card.cardId).not.toBe("");
      expect(
        card.implementationContractNeeded.length,
        card.cardId,
      ).toBeGreaterThan(0);
    }
  });

  it("keeps V1.9.22 AI promotion artifacts present after the completion gate", () => {
    const promotionArtifacts = [
      "../../../data/ai/ai-card-hints-active.json",
      "../../../data/manifests/deck-legal-ai-approval-v1922-manifest.json",
      "../../../data/scenarios/ai-deck-legal-v1922-smokes.json",
    ];

    for (const artifactPath of promotionArtifacts) {
      expect(
        existsSync(new URL(artifactPath, import.meta.url)),
        artifactPath,
      ).toBe(true);
    }
  });

  it("marks the V1.9.22 completion gate complete after promotion gates are satisfied", () => {
    const gateStatus = v1922CompletionGateStatusData as {
      release: string;
      status: string;
      cursorPhase: string;
      releaseDone: boolean;
      scope: {
        wipCardCount: number;
        runtimeReleasePromoted: boolean;
        catalogPromoted: boolean;
        aiPromoted: boolean;
      };
      verifiedGreenChecks: string[];
      lastLocalContractSearch: {
        result: string;
        confirmedPartialSources: string[];
        removalCondition: string;
      };
      latestContractMatrix: {
        cardCount: number;
        readyForPromotionCount: number;
        hardwareInstallBaseCoveredCount: number;
        decision: string;
      };
      latestLocalWorkingBasis: {
        readyForNarrowResolverImplementationCount: number;
        readyCandidates: string[];
        decision: string;
      };
      latestLocalCardFacts: {
        cardCount: number;
        localFactsAvailableCount: number;
        unresolvedUserAttributeConflictCount: number;
        readyForNarrowImplementationCount: number;
        decision: string;
      };
      blockingGates: Array<{
        gateId: string;
        status: string;
        removalCondition: string;
      }>;
    };

    expect(gateStatus.release).toBe("V1.9.22");
    expect(gateStatus.status).toBe("complete");
    expect(gateStatus.cursorPhase).toBe("complete");
    expect(gateStatus.releaseDone).toBe(true);
    expect(gateStatus.scope.wipCardCount).toBe(ONR_V1_9_22_WIP_CARD_IDS.length);
    expect(gateStatus.scope.runtimeReleasePromoted).toBe(true);
    expect(gateStatus.scope.catalogPromoted).toBe(true);
    expect(gateStatus.scope.aiPromoted).toBe(true);
    expect(gateStatus.verifiedGreenChecks.sort()).toEqual([
      "ai",
      "build",
      "catalog",
      "engine",
      "json",
      "lint",
      "server",
      "test",
      "typecheck",
      "web",
    ]);
    expect(gateStatus.lastLocalContractSearch.result).toBe(
      "no_complete_resolver_contract_found",
    );
    expect(
      gateStatus.lastLocalContractSearch.confirmedPartialSources.sort(),
    ).toEqual([
      "data/rules/v1922-resolver-contracts.json",
      "docs/derived/V1_0_5K_CARD_RELEASE_IMPLEMENTATION_REVIEW.md",
      "docs/derived/V1_0_5K_CARD_RELEASE_REQUIREMENTS.md",
      "docs/derived/V1_9_10_TO_V1_9_XX_CARD_FUNCTION_MATRIX.md",
      "docs/derived/V1_9_22_CORP_LONGTAIL_READINESS_REVIEW.md",
      "docs/derived/V1_9_22_RESOLVER_CONTRACT_MATRIX.md",
      "docs/derived/V1_9_22_RUNNER_EVENT_READINESS_REVIEW.md",
      "docs/derived/V1_9_22_RUNNER_PROGRAM_READINESS_REVIEW.md",
    ]);
    expect(gateStatus.latestContractMatrix.cardCount).toBe(
      ONR_V1_9_22_WIP_CARD_IDS.length,
    );
    expect(gateStatus.latestContractMatrix.readyForPromotionCount).toBe(
      ONR_V1_9_22_WIP_CARD_IDS.length,
    );
    expect(
      gateStatus.latestContractMatrix.hardwareInstallBaseCoveredCount,
    ).toBe(9);
    expect(gateStatus.latestContractMatrix.decision).toBe(
      "runtime_catalog_ai_promotion_complete",
    );
    expect(
      gateStatus.latestLocalWorkingBasis
        .readyForNarrowResolverImplementationCount,
    ).toBe(2);
    expect(gateStatus.latestLocalWorkingBasis.readyCandidates.sort()).toEqual([
      "onr_v1_196_corporate-war",
      "onr_v1_210_political-overthrow",
    ]);
    expect(gateStatus.latestLocalWorkingBasis.decision).toBe(
      "runtime_catalog_ai_promotion_complete_after_all_47_wips",
    );
    expect(gateStatus.latestLocalCardFacts.cardCount).toBe(
      ONR_V1_9_22_WIP_CARD_IDS.length,
    );
    expect(gateStatus.latestLocalCardFacts.localFactsAvailableCount).toBe(
      ONR_V1_9_22_WIP_CARD_IDS.length,
    );
    expect(
      gateStatus.latestLocalCardFacts.unresolvedUserAttributeConflictCount,
    ).toBe(0);
    expect(
      gateStatus.latestLocalCardFacts.readyForNarrowImplementationCount,
    ).toBe(2);
    expect(gateStatus.latestLocalCardFacts.decision).toBe(
      "local_facts_available_runtime_catalog_ai_promotion_complete",
    );
    expect(gateStatus.lastLocalContractSearch.removalCondition.trim()).not.toBe(
      "",
    );
    expect(gateStatus.blockingGates).toEqual([]);
  });
});

describe("V1.3.1 Card Data Pipeline v2", () => {
  it("validates the versioned Source Registry v2 without exposing private local paths", () => {
    expect(
      validateSourceRegistryV2(
        sourceRegistry131Data as ReturnType<typeof createSourceRegistryV2>,
      ),
    ).toEqual({ ok: true, errors: [] });
    expect(assertPipelinePayloadSafe(sourceRegistry131Data)).toEqual({
      ok: true,
      errors: [],
    });

    const generated = createSourceRegistryV2();
    expect(generated.sources.map((source) => source.sourceId)).toEqual(
      (
        sourceRegistry131Data as ReturnType<typeof createSourceRegistryV2>
      ).sources.map((source) => source.sourceId),
    );
    expect(
      generated.sources.find((source) => source.scope === "private_local")
        ?.pathOrReference,
    ).toBe("private-local-onr-v1-overlay");
  });

  it("recreates the V1.3.1 pipeline snapshot deterministically with a stable hash", () => {
    const hints = createAiCardHintsV2(
      createCardPipelineSnapshot(snapshot08, {
        sourceRegistryId: "source-registry-1.3.1",
      }),
      aiHints131.cards,
      { hintsId: "ai-card-hints-1.3.1" },
    );
    const recreated = createCardPipelineSnapshot(snapshot08, {
      sourceRegistryId: "source-registry-1.3.1",
      aiHints: hints,
    });
    const hashFile = readFileSync(
      new URL(
        "../../../data/card-import/card-pipeline-snapshot-1.3.1.hash",
        import.meta.url,
      ),
      "utf8",
    ).trim();

    expect(
      validateCardPipelineSnapshot(pipelineSnapshot131, aiHints131),
    ).toEqual({ ok: true, errors: [] });
    expect(computeCardPipelineSnapshotHash(pipelineSnapshot131)).toBe(
      "fnv1a:f2210868",
    );
    expect(pipelineSnapshot131.hash).toBe(hashFile);
    expect(recreated.hash).toBe(pipelineSnapshot131.hash);
    expect(recreated.cards.map((card) => card.catalogCardId)).toEqual(
      pipelineSnapshot131.cards.map((card) => card.catalogCardId),
    );
    expect(assertPipelinePayloadSafe(pipelineSnapshot131)).toEqual({
      ok: true,
      errors: [],
    });
  });

  it("keeps all V1.3.1 status chains separated and blocks automatic playability", () => {
    const importOnly = pipelineSnapshot131.cards.find(
      (card) => card.catalogCardId === "catalog_preview_operation_001",
    )!;
    expect(importOnly.statuses.imported).toBe(true);
    expect(importOnly.statuses.catalog_ready).toBe(true);
    expect(importOnly.statuses.engine_supported).toBe(false);
    expect(importOnly.statuses.human_playable).toBe(false);
    expect(importOnly.statuses.deck_legal).toBe(false);
    expect(importOnly.resolverRef).toBeNull();

    const invalid = structuredClone(pipelineSnapshot131);
    const invalidCard = invalid.cards.find(
      (card) => card.catalogCardId === "catalog_preview_operation_001",
    )!;
    invalidCard.statuses.deck_legal = true;
    invalid.hash = computeCardPipelineSnapshotHash(invalid);

    const validation = validateCardPipelineSnapshot(invalid, aiHints131);
    expect(validation.ok).toBe(false);
    expect(validation.errors.join(" ")).toContain("deck_legal");
  });

  it("validates AI-Hints v2 without letting hints grant ai_supported", () => {
    expect(validateAiCardHintsV2(aiHints131, pipelineSnapshot131)).toEqual({
      ok: true,
      errors: [],
    });
    expect(aiHints131.cards.length).toBeGreaterThan(0);
    expect(
      aiHints131.cards.every(
        (hint) => hint.roles.length > 0 && hint.planRoles.length > 0,
      ),
    ).toBe(true);
    expect(
      aiHints131.cards.every((hint) =>
        Object.values(hint.valueHints).every(
          (value) => value >= -10 && value <= 10,
        ),
      ),
    ).toBe(true);
    expect(
      aiHints131.cards
        .filter((hint) => hint.aiSupportStatus === "ai_supported")
        .every((hint) => hint.scenarioRefs.length > 0),
    ).toBe(true);

    const hintedOnly = structuredClone(aiHints131);
    hintedOnly.cards[0] = {
      ...hintedOnly.cards[0]!,
      aiSupportStatus: "ai_supported",
      scenarioRefs: [],
    };
    expect(
      validateAiCardHintsV2(hintedOnly, pipelineSnapshot131).errors.join(" "),
    ).toContain("without card support and scenarios");
    expect(assertPipelinePayloadSafe(aiHintsReport131Data)).toEqual({
      ok: true,
      errors: [],
    });
  });

  it("classifies import diffs and preserves a rollback contract without touching matches", () => {
    expect(diffReport131Data.schemaVersion).toBe("card-pipeline-diff-v1.3.1");
    expect(
      diffReport131Data.entries.map(
        (entry: { category: string }) => entry.category,
      ),
    ).toEqual([
      "ability_refs_changed",
      "review_status_changed",
      "numeric_changed",
      "required_mechanics_changed",
      "text_changed",
      "status_changed",
      "resolver_ref_changed",
      "ai_hints_changed",
    ]);
    expect(
      diffReport131Data.entries.some(
        (entry: { severity: string }) => entry.severity === "blocking",
      ),
    ).toBe(true);

    const candidate = structuredClone(pipelineSnapshot131);
    candidate.cards[0] = {
      ...candidate.cards[0]!,
      text: `${candidate.cards[0]!.text} Errata fixture.`,
    };
    candidate.hash = computeCardPipelineSnapshotHash(candidate);
    const diff = diffCardPipelineSnapshots(pipelineSnapshot131, candidate);
    expect(diff.entries).toEqual([
      {
        category: "text_changed",
        severity: "review_required",
        cardId: candidate.cards[0]!.catalogCardId,
        summary: "Card display text changed.",
      },
    ]);

    const rollback = createPipelineRollbackReport(
      candidate,
      pipelineSnapshot131,
    );
    expect(rollback.matchSnapshotsUntouched).toBe(true);
    expect(rollback.replayStateHashUntouched).toBe(true);
    expect(rollback.privateAssetsUntouched).toBe(true);
    expect(rollbackReport131Data).toMatchObject({
      matchSnapshotsUntouched: true,
      replayStateHashUntouched: true,
      privateAssetsUntouched: true,
    });
    expect(
      assertPipelinePayloadSafe({ diffReport131Data, rollbackReport131Data }),
    ).toEqual({ ok: true, errors: [] });
  });

  it("publishes safe V1.3.1 support and status reports with explicit no-scope assertions", () => {
    const recreatedReport = createCardPipelineReport(
      pipelineSnapshot131,
      aiHints131,
    );

    expect(cardSupportManifest131Data.gateAssertions.noCardTextParser).toBe(
      true,
    );
    expect(cardSupportManifest131Data.gateAssertions.noNewCardUnlocks).toBe(
      true,
    );
    expect(
      cardSupportManifest131Data.gateAssertions.noPrivatePathsOrTokens,
    ).toBe(true);
    expect(
      cardSupportManifest131Data.cards.filter(
        (card: { statuses: { ai_supported: boolean } }) =>
          card.statuses.ai_supported,
      ),
    ).toEqual([]);
    expect(
      cardSupportManifest131Data.cards.every(
        (card: {
          statuses: { deck_legal: boolean; human_playable: boolean };
        }) => !card.statuses.deck_legal || card.statuses.human_playable,
      ),
    ).toBe(true);

    expect(pipelineReport131Data.noScopeAssertions).toEqual({
      noCardTextParser: true,
      noAutomaticPlayability: true,
      noNewCardRelease: true,
      noNewMechanics: true,
      noOfficialAssets: true,
      noPublicPlatformFeatures: true,
    });
    expect(recreatedReport.statusSummary).toEqual(
      pipelineReport131Data.statusSummary,
    );
    expect(
      assertPipelinePayloadSafe({
        cardSupportManifest131Data,
        pipelineReport131Data,
      }),
    ).toEqual({ ok: true, errors: [] });
  });
});
