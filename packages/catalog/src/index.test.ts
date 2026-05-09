import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import snapshotData from "../../../data/card-import/card-snapshot-0.5.json";
import snapshotData08 from "../../../data/card-import/card-snapshot-0.8.json";
import pipelineSnapshotData from "../../../data/card-import/card-pipeline-snapshot-1.3.1.json";
import sourceRegistry131Data from "../../../data/card-import/source-registry-1.3.1.json";
import aiHints131Data from "../../../data/ai/ai-card-hints-1.3.1.json";
import kingOfTheRoadAiHintsData from "../../../data/ai/ai-card-hints-king-of-the-road-ai-approval.json";
import deckLegalBatchAAiHintsData from "../../../data/ai/ai-card-hints-deck-legal-batch-a.json";
import corpTagSliceAiHintsData from "../../../data/ai/ai-card-hints-corp-tag-approval-slice.json";
import runtimeSupplementAiHintsData from "../../../data/ai/ai-card-hints-runtime-supplement.json";
import aiHintsReport131Data from "../../../data/ai/ai-card-hints-report-1.3.1.json";
import cardSupportManifest131Data from "../../../data/manifests/card-support-manifest-1.3.1.json";
import kingOfTheRoadManifestData from "../../../data/manifests/king-of-the-road-ai-approval-manifest.json";
import deckLegalBatchAManifestData from "../../../data/manifests/deck-legal-ai-approval-batch-a-manifest.json";
import corpTagSliceManifestData from "../../../data/manifests/deck-legal-ai-approval-corp-tag-slice-manifest.json";
import kingOfTheRoadScenarioData from "../../../data/scenarios/ai-kotr-runner-approval-smokes.json";
import deckLegalBatchAScenarioData from "../../../data/scenarios/ai-runner-rig-low-risk-batch-a-smokes.json";
import corpTagSliceScenarioData from "../../../data/scenarios/ai-corp-tag-approval-slice-smokes.json";
import pipelineReport131Data from "../../../data/reports/card-pipeline-report-1.3.1.json";
import diffReport131Data from "../../../data/reports/card-pipeline-diff-report-1.3.1.json";
import rollbackReport131Data from "../../../data/reports/card-pipeline-rollback-report-1.3.1.json";
import catalogIndexData from "../../../data/card-import/catalog-index-0.5.json";
import {
  assertPipelinePayloadSafe,
  assertCatalogPayloadSafe,
  computeCardPipelineSnapshotHash,
  computeSnapshotHash,
  createCatalogIndex,
  createAiCardHintsV2,
  createCardPipelineReport,
  createCardPipelineSnapshot,
  createPipelineRollbackReport,
  DECK_LEGAL_AI_APPROVAL_CORP_TAG_SLICE_CARD_IDS,
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
  ONR_V1_RUNTIME_RELEASE_CARD_IDS,
  searchCatalog,
  validateAiCardHintsV2,
  validateCardPipelineSnapshot,
  validateSnapshot,
  validateSourceRegistryV2,
  type AiCardHintsV2,
  type CardPipelineSnapshot,
  type CardSnapshot
} from "./index";

const snapshot = snapshotData as unknown as CardSnapshot;
const snapshot08 = snapshotData08 as unknown as CardSnapshot;
const pipelineSnapshot131 = pipelineSnapshotData as unknown as CardPipelineSnapshot;
const aiHints131 = aiHints131Data as unknown as AiCardHintsV2;

describe("catalog import and status logic", () => {
  it("validates the local V0.5 snapshot", () => {
    expect(validateSnapshot(snapshot)).toEqual({ ok: true, errors: [] });
  });

  it("computes the frozen snapshot hash deterministically", () => {
    expect(computeSnapshotHash(snapshot)).toBe("fnv1a:a85f7985");
  });

  it("recreates the committed catalog index", () => {
    const recreated = createCatalogIndex(snapshot, computeSnapshotHash(snapshot));
    expect(recreated.cards).toEqual(catalogIndexData.cards);
    expect(recreated.byId).toEqual(catalogIndexData.byId);
    expect(recreated.filters).toEqual(catalogIndexData.filters);
    expect(recreated.statusSummary).toEqual(catalogIndexData.statusSummary);
  });

  it("searches and filters without exposing non-catalog data", () => {
    const runnerResults = searchCatalog(snapshot, { q: "run", side: "runner" });
    expect(runnerResults.some((card) => card.catalogCardId === "simple_run_event")).toBe(true);
    expect(runnerResults.every((card) => card.side === "runner")).toBe(true);
    expect(assertCatalogPayloadSafe(runnerResults)).toEqual({ ok: true, errors: [] });
  });

  it("keeps import-only and blocked cards out of playability", () => {
    const importOnly = getCatalogCard(snapshot, "catalog_preview_operation_001");
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
    expect(burst?.implementationManifest?.manifestVersion).toBe("card-implementation-manifest-v0.8");

    const importOnly = getCatalogCard(snapshot08, "catalog_preview_operation_001");
    expect(importOnly?.statuses.playable).toBe(false);
    expect(importOnly?.statuses.deck_legal).toBe(false);
  });

  it("keeps private local O:NR playable deck-legal cards aligned with manifest and review coverage when present", () => {
    const localSnapshotPath = "data/local/card-import/onr-v1-limited/card-snapshot-onr-v1-limited.local.json";
    if (!existsSync(localSnapshotPath)) return;

    const localSnapshot = JSON.parse(readFileSync(localSnapshotPath, "utf8")) as CardSnapshot;
    expect(validateSnapshot(localSnapshot)).toEqual({ ok: true, errors: [] });

    const playableDeckLegal = localSnapshot.cards.filter((card) => card.statuses.playable && card.statuses.deck_legal);
    const missingManifest = playableDeckLegal.filter((card) => !card.implementationManifest).map((card) => card.catalogCardId);
    const missingCoverage = playableDeckLegal
      .filter((card) => {
        const manifest = card.implementationManifest;
        return !manifest || manifest.unitTests.length === 0 || manifest.scenarioTests.length === 0 || manifest.visibilityTests.length === 0 || manifest.replayTests.length === 0;
      })
      .map((card) => card.catalogCardId);
    const reviewFiles = [
      "data/local/card-import/onr-v1-limited/agenda-implementation-review.local.md",
      "data/local/card-import/onr-v1-limited/asset-implementation-review.local.md",
      "data/local/card-import/onr-v1-limited/agenda-text-review.local.md",
      "data/local/card-import/onr-v1-limited/asset-text-review.local.md"
    ];

    expect(playableDeckLegal.length).toBeGreaterThan(0);
    expect(missingManifest).toEqual([]);
    expect(missingCoverage).toEqual([]);
    expect(reviewFiles.filter((file) => existsSync(file))).toHaveLength(reviewFiles.length);
  });

  it("applies the V1.0.5K, V1.0.6K, V1.1.2K, V1.2.3 and V1.6.1 release gates to private local O:NR runtime cards when present", () => {
    const cardsById = createRuntimeCardsById();
    if (!cardsById["onr_v1_015_codeslinger"]) return;

    expect(ONR_V1_0_5K_RELEASE_CARD_IDS).toHaveLength(12);
    expect(ONR_V1_0_6K_RELEASE_CARD_IDS).toHaveLength(20);
    expect(ONR_V1_1_2K_RELEASE_CARD_IDS).toHaveLength(20);
    expect(ONR_V1_2_3_RELEASE_CARD_IDS).toHaveLength(11);
    expect(ONR_V1_6_1_RELEASE_CARD_IDS).toHaveLength(6);
    expect(ONR_V1_RUNTIME_RELEASE_CARD_IDS).toHaveLength(69);
    for (const cardId of ONR_V1_RUNTIME_RELEASE_CARD_IDS) {
      const card = cardsById[cardId];
      expect(card, cardId).toBeDefined();
      expect(card?.engineCardId).toBe(cardId);
      expect(card?.statuses.implemented).toBe(true);
      expect(card?.statuses.engine_supported).toBe(true);
      expect(card?.statuses.playable).toBe(true);
      expect(card?.statuses.human_playable).toBe(true);
      const approvedAiCards: readonly string[] = [
        ...KING_OF_THE_ROAD_AI_APPROVED_CARD_IDS,
        ...DECK_LEGAL_AI_APPROVAL_BATCH_A_CARD_IDS,
        ...DECK_LEGAL_AI_APPROVAL_CORP_TAG_SLICE_CARD_IDS
      ];
      expect(card?.statuses.ai_supported).toBe(approvedAiCards.includes(cardId));
      expect(card?.statuses.deck_legal).toBe(true);
      expect(card?.statuses.format_legal).toBe(true);
      const expectedManifest = (ONR_V1_6_1_RELEASE_CARD_IDS as readonly string[]).includes(cardId)
        ? "card-implementation-manifest-v1.6.1"
        : (ONR_V1_2_3_RELEASE_CARD_IDS as readonly string[]).includes(cardId)
        ? "card-implementation-manifest-v1.2.3"
        : (ONR_V1_1_2K_RELEASE_CARD_IDS as readonly string[]).includes(cardId)
        ? "card-implementation-manifest-v1.1.2k"
        : (ONR_V1_0_6K_RELEASE_CARD_IDS as readonly string[]).includes(cardId)
          ? "card-implementation-manifest-v1.0.6k"
          : "card-implementation-manifest-v1.0.5k";
      expect(card?.implementationManifest?.manifestVersion).toBe(expectedManifest);
      expect(card?.implementationManifest?.unitTests.length).toBeGreaterThan(0);
      expect(card?.implementationManifest?.scenarioTests.length).toBeGreaterThan(0);
      expect(card?.implementationManifest?.visibilityTests.length).toBeGreaterThan(0);
      expect(card?.implementationManifest?.replayTests.length).toBeGreaterThan(0);
    }

    expect(cardsById["onr_v1_230_cortical-scanner"]?.numeric.rezCost).toBe(7);
    expect(cardsById["onr_v1_237_data-wall"]?.numeric.strength).toBe(0);
    expect(cardsById["onr_v1_238_data-wall-2-0"]?.numeric.strength).toBe(1);
    expect(cardsById["onr_v1_239_endless-corridor"]?.numeric.strength).toBe(2);
    expect(cardsById["onr_v1_015_codeslinger"]?.text).toBe("0 credits: Break sentry subroutine.");
    expect(cardsById["onr_v1_146_zetatech-mem-chip"]?.numeric.installCost).toBe(3);
    expect(cardsById["onr_v1_146_zetatech-mem-chip"]?.text).toBe("Provides +2 MU.");
    expect(cardsById["onr_v1_079_bodyweight-synthetic-blood"]?.numeric.cost).toBe(2);
    expect(cardsById["onr_v1_079_bodyweight-synthetic-blood"]?.numeric.installCost).toBeNull();
    expect(cardsById["onr_v1_079_bodyweight-synthetic-blood"]?.text).toBe("Draw five cards.");
    expect(cardsById["onr_v1_072_wild-card"]?.text).toBe("0 credits: Break sentry subroutine.\n3 credits: +1 strength.");
    expect(cardsById["onr_v1_145_wutech-mem-chip"]?.text).toBe("Provides +1 MU.");
    expect(cardsById["onr_v1_220_tycho-extension"]?.numeric.agendaPoints).toBe(4);
    expect(cardsById["onr_v1_244_filter"]?.numeric.rezCost).toBe(0);
    expect(cardsById["onr_v1_256_mazer"]?.numeric.strength).toBe(5);
    expect(cardsById["onr_v1_006_black-dahlia"]?.statuses.deck_legal).toBe(true);
    expect(cardsById["onr_v1_006_black-dahlia"]?.engineCardId).toBe("onr_v1_006_black-dahlia");
    expect(cardsById["onr_v1_006_black-dahlia"]?.text).toBe("2 credits: Break sentry subroutine.\n2 credits: +1 strength.");
    expect(cardsById["onr_v1_014_codecracker"]?.numeric.installCost).toBe(0);
    expect(cardsById["onr_v1_073_wizards-book"]?.text).toBe("0 credits: Break code gate subroutine.\n2 credits: +1 strength.");
    expect(cardsById["onr_v1_253_laser-wire"]?.text).toBe("[Subroutine] Do 1 net damage.\n[Subroutine] End the run.");
    expect(cardsById["onr_v1_278_wall-of-ice"]?.numeric.rezCost).toBe(13);
    expect(cardsById["onr_v1_293_netwatch-credit-voucher"]?.text).toBe("Play only if Runner is tagged. Give Runner 1 tag and gain 1.");
    expect(cardsById["onr_v1_295_night-shift"]?.numeric.cost).toBe(0);
    expect(cardsById["onr_v1_021_dwarf"]?.text).toBe("1 credit: Break wall subroutine.\n1 credit: +1 strength.");
    expect(cardsById["onr_v1_039_krash"]?.text).toBe("2 credits: Break ice subroutine.\n2 credits: +1 strength.");
    expect(cardsById["onr_v1_081_custodial-position"]?.text).toBe("Make a run on R&D. If successful, access two additional cards from R&D.");
    expect(cardsById["onr_v1_085_executive-wiretaps"]?.text).toBe("Make a run on HQ. If successful, access two additional cards from HQ.");
    expect(cardsById["onr_v1_243_fetch-4-0-1"]?.text).toBe("[Subroutine] Trace 3 - If trace is successful, give Runner a tag.");
    expect(cardsById["onr_v1_249_hunter"]?.numeric.rezCost).toBe(2);
    expect(cardsById["onr_v1_101_mit-west-tier"]?.implementationManifest?.manifestVersion).toBe("card-implementation-manifest-v1.2.3");
    expect(cardsById["onr_v1_023_evil-twin"]?.text).toContain("Prevents up to 2 net and/or core damage");
    expect(cardsById["onr_v1_028_force-shield"]?.numeric.installCost).toBe(2);
    expect(cardsById["onr_v1_125_dermatech-bodyplating"]?.numeric.installCost).toBe(0);
    expect(cardsById["onr_v1_229_code-corpse"]?.numeric.rezCost).toBe(10);
    expect(cardsById["onr_v1_231_cortical-scrub"]?.text).toContain("Do 1 core damage");
    expect(cardsById["onr_v1_254_liche"]?.numeric.strength).toBe(6);
    expect(cardsById["onr_v1_021_dwarf"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_039_krash"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_066_snowball"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_074_worm"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_243_fetch-4-0-1"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_249_hunter"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_287_datapool-by-zetatech"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_293_netwatch-credit-voucher"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_306_trojan-horse"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_101_mit-west-tier"]?.statuses.ai_supported).toBe(false);
    expect(cardsById["onr_v1_297_overtime-incentives"]?.numeric.cost).toBe(0);
    expect(cardsById["onr_v1_075_zetatech-software-installer"]?.text).toBe(
      "Put 2 bits on Software Installer when it is installed. Use these bits only to pay for installing programs. You may use these bits to install a program overlying Software Installer itself. If you use any of these bits, replace them at the start of your next turn."
    );
    expect(cardsById["onr_v1_001_afreet"]?.text).toContain("Afreet can have up to 3 MU");
    expect(cardsById["onr_v1_018_dogcatcher"]?.statuses.deck_legal).toBe(false);
    expect(cardsById["onr_v1_018_dogcatcher"]?.statuses.format_legal).toBe(false);
    expect(cardsById["onr_v1_018_dogcatcher"]?.engineCardId).toBeNull();
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
    const manifestCards = kingOfTheRoadManifestData.cards as Array<{ cardId: string; status: string; scenarioRefs: string[] }>;
    const scenarioCards = new Set((kingOfTheRoadScenarioData.scenarios as Array<{ cards: string[] }>).flatMap((scenario) => scenario.cards));

    expect(KING_OF_THE_ROAD_AI_APPROVED_CARD_IDS).toHaveLength(14);
    expect(hints.map((hint) => hint.cardId).sort()).toEqual([...approved].sort());
    expect(manifestCards.map((card) => card.cardId).sort()).toEqual([...approved].sort());
    expect(kingOfTheRoadScenarioData.deckSnapshotId).toBe("king_of_the_road_runner_ai_snapshot_v1");
    expect(kingOfTheRoadScenarioData.corpPairingSnapshotId).toBe("demo_corp_008_snapshot_v0_8");

    for (const cardId of KING_OF_THE_ROAD_AI_APPROVED_CARD_IDS) {
      const card = cardsById[cardId];
      const hint = hints.find((candidate) => candidate.cardId === cardId);
      const manifest = manifestCards.find((candidate) => candidate.cardId === cardId);
      expect(card?.statuses.human_playable, cardId).toBe(true);
      expect(card?.statuses.deck_legal, cardId).toBe(true);
      expect(card?.statuses.ai_supported, cardId).toBe(true);
      expect(hint?.aiSupportStatus, cardId).toBe("ai_supported");
      expect(hint?.roles.length, cardId).toBeGreaterThan(0);
      expect(hint?.planRoles.length, cardId).toBeGreaterThan(0);
      expect(hint?.requiredMechanics.length, cardId).toBeGreaterThan(0);
      expect(Object.keys(hint?.valueHints ?? {}).length, cardId).toBeGreaterThan(0);
      expect(hint?.riskTags.length, cardId).toBeGreaterThan(0);
      expect(hint?.scenarioRefs.length, cardId).toBeGreaterThan(0);
      expect(manifest?.status, cardId).toBe("ai_supported");
      expect(manifest?.scenarioRefs.length, cardId).toBeGreaterThan(0);
      expect(scenarioCards.has(cardId), cardId).toBe(true);
    }

    const otherLocalOnrAiSupported = Object.values(cardsById)
      .filter((card) => card.catalogCardId.startsWith("onr_v1_") && card.statuses.ai_supported)
      .map((card) => card.catalogCardId)
      .sort();
    expect(otherLocalOnrAiSupported).toEqual(
      [...approved, ...DECK_LEGAL_AI_APPROVAL_BATCH_A_CARD_IDS, ...DECK_LEGAL_AI_APPROVAL_CORP_TAG_SLICE_CARD_IDS.filter((cardId) => cardId.startsWith("onr_v1_"))].sort()
    );
    expect(JSON.stringify({ kingOfTheRoadAiHintsData, kingOfTheRoadManifestData, kingOfTheRoadScenarioData })).not.toMatch(
      /"cardInstances"\s*:|"privatePayload"\s*:|"sessionToken"\s*:|"reconnectToken"\s*:|"joinToken"\s*:|"tokenHash"\s*:|[A-Za-z]:\\/
    );
  });

  it("approves Batch A Runner Rig Low Risk cards only after catalog, hint and scenario gates", () => {
    const cardsById = createRuntimeCardsById();
    if (!cardsById["onr_v1_014_codecracker"]) return;
    const approved = new Set<string>(DECK_LEGAL_AI_APPROVAL_BATCH_A_CARD_IDS);
    const hints = deckLegalBatchAAiHintsData.cards as Array<{
      cardId: string;
      roles: string[];
      planRoles: string[];
      requiredMechanics: string[];
      aiSupportStatus: string;
      scenarioRefs: string[];
    }>;
    const manifestCards = deckLegalBatchAManifestData.cards as Array<{ cardId: string; status: string; scenarioRefs: string[] }>;
    const scenarioCards = new Set((deckLegalBatchAScenarioData.scenarios as Array<{ cards: string[] }>).flatMap((scenario) => scenario.cards));
    const supplementalIds = new Set((runtimeSupplementAiHintsData.cards as Array<{ cardId: string }>).map((hint) => hint.cardId));

    expect(DECK_LEGAL_AI_APPROVAL_BATCH_A_CARD_IDS).toHaveLength(8);
    expect(hints.map((hint) => hint.cardId).sort()).toEqual([...approved].sort());
    expect(manifestCards.map((card) => card.cardId).sort()).toEqual([...approved].sort());
    expect(deckLegalBatchAScenarioData.id).toBe("ai-runner-rig-low-risk-batch-a-smokes");

    for (const cardId of DECK_LEGAL_AI_APPROVAL_BATCH_A_CARD_IDS) {
      const card = cardsById[cardId];
      const hint = hints.find((candidate) => candidate.cardId === cardId);
      const manifest = manifestCards.find((candidate) => candidate.cardId === cardId);
      expect(card?.statuses.human_playable, cardId).toBe(true);
      expect(card?.statuses.deck_legal, cardId).toBe(true);
      expect(card?.statuses.format_legal, cardId).toBe(true);
      expect(card?.statuses.ai_supported, cardId).toBe(true);
      expect(hint?.aiSupportStatus, cardId).toBe("ai_supported");
      expect(hint?.roles.length, cardId).toBeGreaterThan(0);
      expect(hint?.planRoles.length, cardId).toBeGreaterThan(0);
      expect(hint?.requiredMechanics.length, cardId).toBeGreaterThan(0);
      expect(hint?.scenarioRefs.length, cardId).toBeGreaterThan(0);
      expect(manifest?.status, cardId).toBe("ai_supported");
      expect(manifest?.scenarioRefs.length, cardId).toBeGreaterThan(0);
      expect(scenarioCards.has(cardId), cardId).toBe(true);
      expect(supplementalIds.has(cardId), cardId).toBe(false);
    }

    const batchBToG = [
      "onr_v1_081_custodial-position",
      "onr_v1_085_executive-wiretaps",
      "onr_v1_101_mit-west-tier",
      "onr_v1_203_hostile-takeover",
      "onr_v1_220_tycho-extension",
      "onr_v1_237_data-wall",
      "onr_v1_297_overtime-incentives",
      "onr_v1_302_scorched-earth"
    ];
    for (const cardId of batchBToG) expect(cardsById[cardId]?.statuses.ai_supported, cardId).toBe(false);

    expect(JSON.stringify({ deckLegalBatchAAiHintsData, deckLegalBatchAManifestData, deckLegalBatchAScenarioData })).not.toMatch(
      /"cardInstances"\s*:|"privatePayload"\s*:|"sessionToken"\s*:|"reconnectToken"\s*:|"joinToken"\s*:|"tokenHash"\s*:|"fullState"\s*:|[A-Za-z]:\\/
    );
  });

  it("approves the Corp Tag slice only after catalog, hint and scenario gates", () => {
    const cardsById = createRuntimeCardsById();
    if (!cardsById["onr_v1_287_datapool-by-zetatech"]) return;
    const approved = new Set<string>(DECK_LEGAL_AI_APPROVAL_CORP_TAG_SLICE_CARD_IDS);
    const hints = corpTagSliceAiHintsData.cards as Array<{
      cardId: string;
      roles: string[];
      planRoles: string[];
      requiredMechanics: string[];
      aiSupportStatus: string;
      scenarioRefs: string[];
    }>;
    const manifestCards = corpTagSliceManifestData.cards as Array<{ cardId: string; status: string; scenarioRefs: string[] }>;
    const scenarioCards = new Set((corpTagSliceScenarioData.scenarios as Array<{ cards: string[] }>).flatMap((scenario) => scenario.cards));

    expect(DECK_LEGAL_AI_APPROVAL_CORP_TAG_SLICE_CARD_IDS).toHaveLength(6);
    expect(hints.map((hint) => hint.cardId).sort()).toEqual([...approved].sort());
    expect(manifestCards.map((card) => card.cardId).sort()).toEqual([...approved].sort());
    expect(corpTagSliceScenarioData.id).toBe("ai-corp-tag-approval-slice-smokes");

    for (const cardId of DECK_LEGAL_AI_APPROVAL_CORP_TAG_SLICE_CARD_IDS) {
      const card = cardsById[cardId];
      const hint = hints.find((candidate) => candidate.cardId === cardId);
      const manifest = manifestCards.find((candidate) => candidate.cardId === cardId);
      expect(card?.statuses.human_playable, cardId).toBe(true);
      expect(card?.statuses.deck_legal, cardId).toBe(true);
      expect(card?.statuses.format_legal, cardId).toBe(true);
      expect(card?.statuses.ai_supported, cardId).toBe(true);
      expect(hint?.aiSupportStatus, cardId).toBe("ai_supported");
      expect(hint?.roles.length, cardId).toBeGreaterThan(0);
      expect(hint?.planRoles.length, cardId).toBeGreaterThan(0);
      expect(hint?.requiredMechanics.length, cardId).toBeGreaterThan(0);
      expect(hint?.scenarioRefs.length, cardId).toBeGreaterThan(0);
      expect(manifest?.status, cardId).toBe("ai_supported");
      expect(manifest?.scenarioRefs.length, cardId).toBeGreaterThan(0);
      expect(scenarioCards.has(cardId), cardId).toBe(true);
    }

    expect(JSON.stringify({ corpTagSliceAiHintsData, corpTagSliceManifestData, corpTagSliceScenarioData })).not.toMatch(
      /"cardInstances"\s*:|"privatePayload"\s*:|"sessionToken"\s*:|"reconnectToken"\s*:|"joinToken"\s*:|"tokenHash"\s*:|"fullState"\s*:|[A-Za-z]:\\/
    );
  });
});

describe("V1.3.1 Card Data Pipeline v2", () => {
  it("validates the versioned Source Registry v2 without exposing private local paths", () => {
    expect(validateSourceRegistryV2(sourceRegistry131Data as ReturnType<typeof createSourceRegistryV2>)).toEqual({ ok: true, errors: [] });
    expect(assertPipelinePayloadSafe(sourceRegistry131Data)).toEqual({ ok: true, errors: [] });

    const generated = createSourceRegistryV2();
    expect(generated.sources.map((source) => source.sourceId)).toEqual((sourceRegistry131Data as ReturnType<typeof createSourceRegistryV2>).sources.map((source) => source.sourceId));
    expect(generated.sources.find((source) => source.scope === "private_local")?.pathOrReference).toBe("private-local-onr-v1-overlay");
  });

  it("recreates the V1.3.1 pipeline snapshot deterministically with a stable hash", () => {
    const hints = createAiCardHintsV2(createCardPipelineSnapshot(snapshot08, { sourceRegistryId: "source-registry-1.3.1" }), aiHints131.cards, { hintsId: "ai-card-hints-1.3.1" });
    const recreated = createCardPipelineSnapshot(snapshot08, { sourceRegistryId: "source-registry-1.3.1", aiHints: hints });
    const hashFile = readFileSync(new URL("../../../data/card-import/card-pipeline-snapshot-1.3.1.hash", import.meta.url), "utf8").trim();

    expect(validateCardPipelineSnapshot(pipelineSnapshot131, aiHints131)).toEqual({ ok: true, errors: [] });
    expect(computeCardPipelineSnapshotHash(pipelineSnapshot131)).toBe("fnv1a:f2210868");
    expect(pipelineSnapshot131.hash).toBe(hashFile);
    expect(recreated.hash).toBe(pipelineSnapshot131.hash);
    expect(recreated.cards.map((card) => card.catalogCardId)).toEqual(pipelineSnapshot131.cards.map((card) => card.catalogCardId));
    expect(assertPipelinePayloadSafe(pipelineSnapshot131)).toEqual({ ok: true, errors: [] });
  });

  it("keeps all V1.3.1 status chains separated and blocks automatic playability", () => {
    const importOnly = pipelineSnapshot131.cards.find((card) => card.catalogCardId === "catalog_preview_operation_001")!;
    expect(importOnly.statuses.imported).toBe(true);
    expect(importOnly.statuses.catalog_ready).toBe(true);
    expect(importOnly.statuses.engine_supported).toBe(false);
    expect(importOnly.statuses.human_playable).toBe(false);
    expect(importOnly.statuses.deck_legal).toBe(false);
    expect(importOnly.resolverRef).toBeNull();

    const invalid = structuredClone(pipelineSnapshot131);
    const invalidCard = invalid.cards.find((card) => card.catalogCardId === "catalog_preview_operation_001")!;
    invalidCard.statuses.deck_legal = true;
    invalid.hash = computeCardPipelineSnapshotHash(invalid);

    const validation = validateCardPipelineSnapshot(invalid, aiHints131);
    expect(validation.ok).toBe(false);
    expect(validation.errors.join(" ")).toContain("deck_legal");
  });

  it("validates AI-Hints v2 without letting hints grant ai_supported", () => {
    expect(validateAiCardHintsV2(aiHints131, pipelineSnapshot131)).toEqual({ ok: true, errors: [] });
    expect(aiHints131.cards.length).toBeGreaterThan(0);
    expect(aiHints131.cards.every((hint) => hint.roles.length > 0 && hint.planRoles.length > 0)).toBe(true);
    expect(aiHints131.cards.every((hint) => Object.values(hint.valueHints).every((value) => value >= -10 && value <= 10))).toBe(true);
    expect(aiHints131.cards.filter((hint) => hint.aiSupportStatus === "ai_supported").every((hint) => hint.scenarioRefs.length > 0)).toBe(true);

    const hintedOnly = structuredClone(aiHints131);
    hintedOnly.cards[0] = { ...hintedOnly.cards[0]!, aiSupportStatus: "ai_supported", scenarioRefs: [] };
    expect(validateAiCardHintsV2(hintedOnly, pipelineSnapshot131).errors.join(" ")).toContain("without card support and scenarios");
    expect(assertPipelinePayloadSafe(aiHintsReport131Data)).toEqual({ ok: true, errors: [] });
  });

  it("classifies import diffs and preserves a rollback contract without touching matches", () => {
    expect(diffReport131Data.schemaVersion).toBe("card-pipeline-diff-v1.3.1");
    expect(diffReport131Data.entries.map((entry: { category: string }) => entry.category)).toEqual([
      "ability_refs_changed",
      "review_status_changed",
      "numeric_changed",
      "required_mechanics_changed",
      "text_changed",
      "status_changed",
      "resolver_ref_changed",
      "ai_hints_changed",
    ]);
    expect(diffReport131Data.entries.some((entry: { severity: string }) => entry.severity === "blocking")).toBe(true);

    const candidate = structuredClone(pipelineSnapshot131);
    candidate.cards[0] = { ...candidate.cards[0]!, text: `${candidate.cards[0]!.text} Errata fixture.` };
    candidate.hash = computeCardPipelineSnapshotHash(candidate);
    const diff = diffCardPipelineSnapshots(pipelineSnapshot131, candidate);
    expect(diff.entries).toEqual([{ category: "text_changed", severity: "review_required", cardId: candidate.cards[0]!.catalogCardId, summary: "Card display text changed." }]);

    const rollback = createPipelineRollbackReport(candidate, pipelineSnapshot131);
    expect(rollback.matchSnapshotsUntouched).toBe(true);
    expect(rollback.replayStateHashUntouched).toBe(true);
    expect(rollback.privateAssetsUntouched).toBe(true);
    expect(rollbackReport131Data).toMatchObject({ matchSnapshotsUntouched: true, replayStateHashUntouched: true, privateAssetsUntouched: true });
    expect(assertPipelinePayloadSafe({ diffReport131Data, rollbackReport131Data })).toEqual({ ok: true, errors: [] });
  });

  it("publishes safe V1.3.1 support and status reports with explicit no-scope assertions", () => {
    const recreatedReport = createCardPipelineReport(pipelineSnapshot131, aiHints131);

    expect(cardSupportManifest131Data.gateAssertions.noCardTextParser).toBe(true);
    expect(cardSupportManifest131Data.gateAssertions.noNewCardUnlocks).toBe(true);
    expect(cardSupportManifest131Data.gateAssertions.noPrivatePathsOrTokens).toBe(true);
    expect(cardSupportManifest131Data.cards.filter((card: { statuses: { ai_supported: boolean } }) => card.statuses.ai_supported)).toEqual([]);
    expect(cardSupportManifest131Data.cards.every((card: { statuses: { deck_legal: boolean; human_playable: boolean } }) => !card.statuses.deck_legal || card.statuses.human_playable)).toBe(true);

    expect(pipelineReport131Data.noScopeAssertions).toEqual({
      noCardTextParser: true,
      noAutomaticPlayability: true,
      noNewCardRelease: true,
      noNewMechanics: true,
      noOfficialAssets: true,
      noPublicPlatformFeatures: true
    });
    expect(recreatedReport.statusSummary).toEqual(pipelineReport131Data.statusSummary);
    expect(assertPipelinePayloadSafe({ cardSupportManifest131Data, pipelineReport131Data })).toEqual({ ok: true, errors: [] });
  });
});
