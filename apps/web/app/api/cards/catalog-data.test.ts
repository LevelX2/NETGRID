import { ORIGINALSET_V1_CARD_IDS } from "@netgrid/catalog";
import { type CardDefinitionId } from "@netgrid/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  activeAiApprovedCardIds,
  createRuntimeCardsById,
  PROTEUS_CARD_IDS,
  PROTEUS_VISIBLE_BASELINE_CARD_IDS,
} from "@netgrid/catalog";
import generatedCardSpecAiHints from "../../../../../data/ai/card-spec-ai-hints-generated.json";
import { catalogDetailResponse, catalogListResponse } from "./catalog-data";
import {
  catalogDeckCardsResponse,
  catalogPresentationResponse,
  createCatalogRuntime,
} from "./catalog-runtime";
import type {
  CatalogCardList,
  CatalogDeckCard,
  CatalogPresentationCard,
} from "../../../features/catalog/catalog-types";

const previousTestCardSetting = process.env.NETGRID_ENABLE_TEST_CARDS;

beforeEach(() => {
  process.env.NETGRID_ENABLE_TEST_CARDS = "true";
});

afterEach(() => {
  if (previousTestCardSetting === undefined)
    delete process.env.NETGRID_ENABLE_TEST_CARDS;
  else process.env.NETGRID_ENABLE_TEST_CARDS = previousTestCardSetting;
});

type CatalogDetailAiHints = {
  card: {
    aiHints: {
      cardId: string;
      roles: string[];
      planRoles: string[];
      requiredMechanics: string[];
      aiSupportStatus: string;
      riskTags: string[];
      scenarioRefs: string[];
    } | null;
  };
};

type CatalogDetailAiInspector = {
  card: {
    aiInspector: {
      schemaVersion: string;
      source: {
        schemaVersion: string;
        authority: string;
        sourceRefs: readonly string[];
      };
      supportStatus: {
        aiSupportStatus: string;
        hintFound: boolean;
        mechanicalFactsFound: boolean;
        warningCount: number;
      };
      cardHint: {
        requiredMechanics: string[];
        valueHints: Record<string, number>;
      } | null;
      mechanicalFacts: {
        effects: Array<{ kind: string; scope?: string }>;
        breakerProfile: { coverage?: string[] } | null;
        remoteRole: { kind?: string } | null;
      } | null;
      functionSignals: string[];
      strategyAnchors: string[];
      strategySupportPairs: Array<{
        strategyId: string;
        role?: string;
        roleDetail?: string;
        confidence?: string;
        evidence?: string[];
        sourceField?: string;
      }>;
      lineSupport: {
        values: string[];
        classification: Array<{
          value: string;
          triageCategory: string;
          mapsTo: string[];
        }>;
      };
      strategicRole: string[];
      quality: Record<string, unknown> | null;
      legacyRoles: {
        roles: string[];
        planRoles: string[];
        rolesClassification: Array<{ value: string; triageCategory: string }>;
        planRolesClassification: Array<{
          value: string;
          triageCategory: string;
        }>;
      };
      warnings: {
        categories: string[];
        descriptorGaps: Array<{ gapId?: string }>;
      };
    } | null;
  };
};

const EXPECTED_PROTEUS_VISIBLE_BASELINE_CARD_IDS = [
  60,
  67,
  69,
  70,
  71,
  73,
  75,
  78,
  79,
  80,
  81,
  82,
  83,
  84,
  86,
  88,
  89,
  90,
  91,
  92,
  94,
  96,
  97,
  98,
  99,
  102,
  105,
  106,
  108,
  110,
  111,
  112,
  115,
  120,
  123,
  126,
  128,
  130,
  133,
  135,
  136,
  137,
  138,
  139,
  140,
  141,
  142,
  143,
  144,
  146,
  147,
  148,
  149,
  150,
  151,
  152,
  153,
  154,
  155,
  156,
  157,
  158,
  159,
  161,
  162,
  163,
  164,
  165,
  166,
  172,
  173,
  175,
  176,
  178,
  179,
  180,
  182,
  185,
  188,
  192,
  193,
  196,
  197,
  204,
  206,
  208,
  209,
] as const;

describe("catalog API filters", () => {
  it.each([false, true])("serves a compact presentation index with test cards enabled=%s", (testCards) => {
    process.env.NETGRID_ENABLE_TEST_CARDS = String(testCards);
    const response = catalogPresentationResponse();
    expect(response.status).toBe(200);
    const { cards } = response.body as CatalogCardList<CatalogPresentationCard>;
    const { snapshot } = createCatalogRuntime();
    expect(cards).toEqual(snapshot.cards.map(({ catalogCardId, title, type, setId }) => ({
      catalogCardId, title, type, setId,
    })));
    expect(cards.some((card) => card.setId === "testset")).toBe(testCards);
  });

  it("provides deck card text and values in one response with editor eligibility", () => {
    const response = catalogDeckCardsResponse();
    expect(response.status).toBe(200);
    const { cards } = response.body as CatalogCardList<CatalogDeckCard>;
    const { snapshot } = createCatalogRuntime();
    expect(cards.map((card) => card.catalogCardId)).toEqual(
      snapshot.cards.map((card) => card.catalogCardId),
    );
    cards.forEach((card, index) => {
      const source = snapshot.cards[index]!;
      expect(card).toMatchObject({
        text: source.text,
        numeric: source.numeric,
        statuses: {
          catalog_ready: source.statuses.catalog_ready,
          playable: source.statuses.playable,
          deck_legal: source.statuses.deck_legal,
        },
      });
      expect(card).not.toHaveProperty("aiHints");
      expect(card).not.toHaveProperty("aiInspectorSummary");
      expect(card).not.toHaveProperty("implementationManifest");
    });
  });

  it("hides test cards when the backend setting is absent", () => {
    delete process.env.NETGRID_ENABLE_TEST_CARDS;

    const response = catalogListResponse(new URLSearchParams());

    expect(response.status).toBe(200);
    const body = response.body as {
      cards: Array<{ setId: string }>;
      filters: { sets: string[] };
    };
    expect(body.cards.some((card) => card.setId === "testset")).toBe(false);
    expect(body.filters.sets).not.toContain("testset");
  });

  it("filters by ai_supported instead of falling back to the full catalog", () => {
    const response = catalogListResponse(
      new URLSearchParams({ status: "ai_supported" }),
    );

    expect(response.status).toBe(200);
    const body = response.body as {
      cards: Array<{
        catalogCardId: CardDefinitionId;
        statuses: { ai_supported: boolean };
      }>;
    };
    expect(body.cards.length).toBeGreaterThan(14);
    expect(body.cards.length).toBe(activeAiApprovedCardIds.length);
    expect(body.cards.every((card) => card.statuses.ai_supported)).toBe(true);
    expect(body.cards.map((card) => card.catalogCardId).sort()).toEqual(
      activeAiApprovedCardIds.slice().sort(),
    );
    const expectedOnrAiApproved = activeAiApprovedCardIds.filter((cardId) =>
      ORIGINALSET_V1_CARD_IDS.includes(cardId),
    );
    expect(
      body.cards
        .filter((card) => ORIGINALSET_V1_CARD_IDS.includes(card.catalogCardId))
        .map((card) => card.catalogCardId)
        .sort(),
    ).toEqual([...new Set(expectedOnrAiApproved)].sort());
    expect(body.cards.map((card) => card.catalogCardId)).toEqual(
      expect.arrayContaining([
        238,
        287,
        59,
      ]),
    );
    expect(body.cards.map((card) => card.catalogCardId)).toEqual(
      expect.arrayContaining([...PROTEUS_VISIBLE_BASELINE_CARD_IDS]),
    );
  });

  it("promotes the Proteus visible baseline for deck legality and AI support", () => {
    expect(PROTEUS_VISIBLE_BASELINE_CARD_IDS).toHaveLength(154);
    expect(PROTEUS_VISIBLE_BASELINE_CARD_IDS).toEqual([...PROTEUS_CARD_IDS]);
    expect(PROTEUS_VISIBLE_BASELINE_CARD_IDS).toEqual(
      expect.arrayContaining([...EXPECTED_PROTEUS_VISIBLE_BASELINE_CARD_IDS]),
    );
    for (const candidateId of PROTEUS_VISIBLE_BASELINE_CARD_IDS) {
      const candidateResponse = catalogDetailResponse(candidateId);
      expect(candidateResponse.status).toBe(200);
      const candidateBody = candidateResponse.body as {
        card: {
          catalogCardId: CardDefinitionId;
          statuses: {
            human_playable: boolean;
            deck_legal: boolean;
            format_legal: boolean;
            ai_supported: boolean;
            blocked: boolean;
          };
          aiHints: { aiSupportStatus: string } | null;
        };
      };
      expect(candidateBody.card).toMatchObject({
        catalogCardId: candidateId,
        statuses: {
          human_playable: true,
          deck_legal: true,
          format_legal: true,
          ai_supported: true,
          blocked: false,
        },
        aiHints: { aiSupportStatus: "ai_supported" },
      });
    }

    const humanPlayableResponse = catalogListResponse(
      new URLSearchParams({ status: "human_playable", q: "Toughonium" }),
    );
    expect(humanPlayableResponse.status).toBe(200);
    const humanPlayableBody = humanPlayableResponse.body as {
      cards: Array<{ catalogCardId: CardDefinitionId }>;
    };
    expect(humanPlayableBody.cards.map((card) => card.catalogCardId)).toEqual([
      99,
    ]);

    for (const status of ["deck_legal", "format_legal"] as const) {
      const response = catalogListResponse(
        new URLSearchParams({ status, q: "Toughonium" }),
      );
      expect(response.status).toBe(200);
      const body = response.body as { cards: Array<{ catalogCardId: CardDefinitionId }> };
      expect(body.cards.map((card) => card.catalogCardId)).toEqual([
        99,
      ]);
    }

    const aiSupportedResponse = catalogListResponse(
      new URLSearchParams({ status: "ai_supported", q: "Toughonium" }),
    );
    expect(aiSupportedResponse.status).toBe(200);
    const aiSupportedBody = aiSupportedResponse.body as {
      cards: Array<{ catalogCardId: CardDefinitionId }>;
    };
    expect(aiSupportedBody.cards.map((card) => card.catalogCardId)).toEqual([
      99,
    ]);

    const firstProteusResponse = catalogDetailResponse(
      59,
    );
    expect(firstProteusResponse.status).toBe(200);
    const firstProteusBody = firstProteusResponse.body as {
      card: {
        statuses: {
          human_playable: boolean;
          deck_legal: boolean;
          format_legal: boolean;
          ai_supported: boolean;
          blocked: boolean;
        };
      };
    };
    expect(firstProteusBody.card.statuses).toMatchObject({
      human_playable: true,
      deck_legal: true,
      format_legal: true,
      ai_supported: true,
      blocked: false,
    });
  }, 45_000);

  it("exposes display-only rarity metadata in list and detail responses", () => {
    const detailResponse = catalogDetailResponse(213);
    expect(detailResponse.status).toBe(200);
    const detailBody = detailResponse.body as {
      card: {
        rarity?: {
          code: string;
          labelDe: string;
          labelEn: string;
          sourceId: string;
        };
      };
    };
    expect(detailBody.card.rarity).toMatchObject({
      code: "uncommon",
      labelDe: "Ungewöhnlich",
      labelEn: "Uncommon",
      sourceId: "card-spec:onr_v1_001_afreet",
    });

    const listResponse = catalogListResponse(
      new URLSearchParams({ q: "Afreet" }),
    );
    expect(listResponse.status).toBe(200);
    const listBody = listResponse.body as {
      cards: Array<{
        catalogCardId: CardDefinitionId;
        rarity?: { code: string; labelDe: string };
      }>;
    };
    expect(
      listBody.cards.find((card) => card.catalogCardId === 213)
        ?.rarity,
    ).toMatchObject({ code: "uncommon", labelDe: "Ungewöhnlich" });
  });

  it("exposes the AI005 card-catalog inspector from Karten-Hints", () => {
    const response = catalogDetailResponse(214);
    expect(response.status).toBe(200);
    const body = response.body as CatalogDetailAiInspector;
    const inspector = body.card.aiInspector;

    expect(inspector).not.toBeNull();
    if (!inspector)
      throw new Error("Missing AI inspector for onr_v1_002_ai-boon");
    const aiBoonArtifact = generatedCardSpecAiHints.cards.find(
      (entry) => entry.cardId === 214,
    );
    expect(aiBoonArtifact).toBeDefined();
    expect(inspector.schemaVersion).toBe("catalog-ai-hint-inspector-v1");
    expect(inspector.source).toEqual({
      schemaVersion: "ai-hint-provenance-v1",
      authority: "card_spec_compiler",
      artifactSchemaVersion: "card-spec-ai-hint-artifact-v2",
      compilerVersion: "card-spec-ai-hint-compiler-v2",
      cardRulesFingerprint: aiBoonArtifact?.cardRulesFingerprint,
      planningAnnotationsFingerprint:
        aiBoonArtifact?.planningAnnotationsFingerprint,
      evidenceFingerprint: generatedCardSpecAiHints.evidence.fingerprint,
      sourceRefs: [
        "data/ai/card-spec-ai-hints-generated.json",
        "packages/ai/src/card-spec-ai-hint-compiler.ts#deriveCardSpecAiHint",
        "data/scenarios/card-support-ai-supported-current.json#active_card_support_ai_supported",
      ],
    });
    expect(inspector.supportStatus).toMatchObject({
      aiSupportStatus: "ai_supported",
      hintFound: true,
      mechanicalFactsFound: true,
    });
    expect(inspector.mechanicalFacts?.effects).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "breaker" })]),
    );
    expect(inspector.mechanicalFacts?.breakerProfile?.coverage).toContain(
      "sentry",
    );
    expect(inspector.functionSignals).toContain("breaker.sentry");
    expect(inspector.strategySupportPairs).toEqual([]);
    expect(inspector.lineSupport.values).toEqual([]);
    expect(inspector.lineSupport.classification).toEqual([]);
    expect(inspector.legacyRoles.planRolesClassification).toEqual([]);
    expect(inspector.strategicRole).toEqual([]);
    expect(inspector.quality).toMatchObject({ hintReviewed: true });
    expect(Object.keys(inspector.quality ?? {})).not.toContain(
      "economyQuality",
    );
    expect(inspector.legacyRoles.roles).toEqual(
      expect.arrayContaining(["program", "breaker_killer"]),
    );
    expect(inspector.warnings.categories).toEqual([]);
  });

  it("attributes migrated inspector hints to the CardSpec compiler", () => {
    const brokerArtifact = generatedCardSpecAiHints.cards.find(
      (entry) => entry.cardId === 366,
    );
    expect(brokerArtifact).toBeDefined();
    const response = catalogDetailResponse(366);
    expect(response.status).toBe(200);
    const body = response.body as CatalogDetailAiInspector;
    expect(body.card.aiInspector?.source).toEqual({
      schemaVersion: "ai-hint-provenance-v1",
      authority: "card_spec_compiler",
      artifactSchemaVersion: "card-spec-ai-hint-artifact-v2",
      compilerVersion: "card-spec-ai-hint-compiler-v2",
      cardRulesFingerprint: brokerArtifact?.cardRulesFingerprint,
      planningAnnotationsFingerprint:
        brokerArtifact?.planningAnnotationsFingerprint,
      evidenceFingerprint: generatedCardSpecAiHints.evidence.fingerprint,
      sourceRefs: [
        "data/ai/card-spec-ai-hints-generated.json",
        "packages/ai/src/card-spec-ai-hint-compiler.ts#deriveCardSpecAiHint",
        "data/scenarios/card-support-ai-supported-current.json#active_card_support_ai_supported",
      ],
    });
  });

  it("exposes explicit Agenda strategy support pairs through the inspector API", () => {
    const response = catalogDetailResponse(424);
    expect(response.status).toBe(200);
    const body = response.body as CatalogDetailAiInspector;
    const inspector = body.card.aiInspector;

    expect(inspector).not.toBeNull();
    if (!inspector)
      throw new Error("Missing AI inspector for Priority Requisition");
    expect(inspector.strategySupportPairs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          strategyId: "corp.ice_tax_glacier",
          role: "payoff_anchor",
          roleDetail: "free_rez_ice_payoff",
          confidence: "high",
          sourceField: "strategySupportPairs",
        }),
        expect.objectContaining({
          strategyId: "corp.remote_scoring",
          role: "scoring_tool",
          roleDetail: "free_rez_remote_defense",
          confidence: "medium",
          sourceField: "strategySupportPairs",
        }),
      ]),
    );
  });

  it("exposes reviewed remoteRole facts without derived warning taxonomy", () => {
    const remoteResponse = catalogDetailResponse(576);
    expect(remoteResponse.status).toBe(200);
    const remoteBody = remoteResponse.body as CatalogDetailAiInspector;
    expect(
      remoteBody.card.aiInspector?.supportStatus.mechanicalFactsFound,
    ).toBe(true);
    expect(
      remoteBody.card.aiInspector?.mechanicalFacts?.remoteRole,
    ).toMatchObject({ kind: "ice_modifier" });

    const gapResponse = catalogDetailResponse(229);
    expect(gapResponse.status).toBe(200);
    const gapBody = gapResponse.body as CatalogDetailAiInspector;
    expect(gapBody.card.aiInspector?.warnings.categories).toEqual([]);
    expect(gapBody.card.aiInspector?.legacyRoles.rolesClassification).toEqual(
      [],
    );
    expect(gapBody.card.aiInspector?.warnings.descriptorGaps).toEqual([]);
  });

  it("exposes lightweight AI inspector summaries for catalog filtering", () => {
    const response = catalogListResponse(
      new URLSearchParams("q=Bodyweight%E2%84%A2%20Synthetic%20Blood"),
    );
    expect(response.status).toBe(200);
    const body = response.body as {
      cards: Array<{
        catalogCardId: CardDefinitionId;
        aiInspectorSummary?: {
          available: boolean;
          mechanicalFactsFound: boolean;
          hasClassifications: boolean;
          hasWarnings: boolean;
        } | null;
      }>;
    };

    expect(body.cards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          catalogCardId: 291,
          aiInspectorSummary: expect.objectContaining({
            available: true,
            mechanicalFactsFound: true,
            hasClassifications: true,
            hasWarnings: false,
          }),
        }),
      ]),
    );

    const blockedResponse = catalogListResponse(
      new URLSearchParams("status=blocked&q=Catalog%20Preview%20Resource"),
    );
    expect(blockedResponse.status).toBe(200);
    const blockedBody = blockedResponse.body as {
      cards: Array<{
        catalogCardId: CardDefinitionId;
        aiInspectorSummary?: unknown;
      }>;
    };
    expect(blockedBody.cards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          catalogCardId: 2,
          aiInspectorSummary: null,
        }),
      ]),
    );
  });

  it("serves The Shell Traders catalog text from the confirmed spoiler instead of the old recurring-credit placeholder", () => {
    const response = catalogDetailResponse(388);
    expect(response.status).toBe(200);
    const body = response.body as {
      card: {
        text: string;
      };
    };

    expect(body.card.text).toContain(
      "Choose a program or hardware card from your hand.",
    );
    expect(body.card.text).toContain("Shell counters");
    expect(body.card.text).toContain("install that card, at no cost");
    expect(body.card.text).not.toContain("recurring credit");
  });

  it("serves corrected Corp spoiler-aligned catalog text for active V1 cards", () => {
    const expectations = [
      {
        cardId: 432,
        contains: ["No additional ability."],
        notContains: ["Regeltext"],
      },
      {
        cardId: 434,
        contains: ["Runner must pay [2]"],
        notContains: ["Runner must pay 1"],
      },
      {
        cardId: 446,
        contains: [
          "Do 3 net damage",
          "cannot break any subroutines of the next piece of ice",
        ],
        notContains: ["Do 1 net damage", "End the run"],
      },
      {
        cardId: 448,
        contains: [
          "give Runner a tag and a Data Raven counter",
          "taking an action to pay [1]",
        ],
        notContains: ["counter on Data Raven", "End the run"],
      },
      {
        cardId: 532,
        contains: [
          "cost [1] less to rez",
          'additional "End the run" subroutine',
        ],
        notContains: ["cost 2 less to rez"],
      },
      {
        cardId: 561,
        contains: ["any bits spent using that worm", "further icebreakers"],
        notContains: [],
      },
      {
        cardId: 563,
        contains: [
          "return the agenda to the fort instead",
          "Runner scores the agenda at the start of his or her next turn",
        ],
        notContains: [],
      },
      {
        cardId: 564,
        contains: ["reduced by [2]"],
        notContains: ["reduced by 1"],
      },
      {
        cardId: 565,
        contains: ["When Runner accesses Chimera, trash a daemon."],
        notContains: ["installed daemon program"],
      },
    ];

    for (const expectation of expectations) {
      const response = catalogDetailResponse(expectation.cardId);
      expect(response.status, String(expectation.cardId)).toBe(200);
      const body = response.body as { card: { text: string } };
      for (const snippet of expectation.contains) {
        expect(body.card.text, String(expectation.cardId)).toContain(snippet);
      }
      for (const snippet of expectation.notContains) {
        expect(body.card.text, String(expectation.cardId)).not.toContain(snippet);
      }
    }
  });

  it("serves Runner icebreaker text from the same CardSpec projection in catalog and runtime", () => {
    const expectations = [
      {
        cardId: 227,
        catalogContains: ["[1]: Break sentry subroutine."],
        sharedContains: ["1 Credits: Break 1 sentry subroutine."],
        notContains: ["0 credits: Break sentry subroutine."],
      },
      {
        cardId: 230,
        catalogContains: ["pit bull, hellhound, bloodhound, or watchdog"],
        sharedContains: ["Pit Bull, Hellhound, Bloodhound, or Watchdog"],
        notContains: ["Break ice subroutine"],
      },
      {
        cardId: 231,
        catalogContains: [
          "[0]: Break all subroutines of a piece of ice, and end the run.",
          "[1]: +1 strength.",
        ],
        sharedContains: [
          "0 Credits: Break all subroutines of a piece of ice, and end the run.",
        ],
        notContains: ["2 credits: +1 strength.", "Using Dropp ends your run."],
      },
      {
        cardId: 248,
        catalogContains: ["lose 1 credit, if you can, from a stealth card"],
        sharedContains: ["lose 1 from a Stealth card, if you can"],
        notContains: [],
      },
      {
        cardId: 264,
        catalogContains: ["[1]: Break code gate subroutine."],
        sharedContains: ["1 Credits: Break 1 code gate subroutine."],
        notContains: ["0 credits: Break code gate subroutine."],
      },
      {
        cardId: 265,
        catalogContains: [
          "[2]: Break wall subroutine.",
          "lose a total of [2] from stealth cards",
        ],
        sharedContains: [
          "[2]: Break wall subroutine.",
          "lose a total of 2 credits from Stealth cards",
        ],
        notContains: ["trace limit reduced"],
      },
      {
        cardId: 278,
        catalogContains: [
          "Snowball has +1 strength for each subroutine it has broken during a run",
        ],
        sharedContains: [
          "Snowball has +1 strength for each subroutine it has broken during a run",
        ],
        notContains: [],
      },
    ];

    for (const expectation of expectations) {
      const response = catalogDetailResponse(expectation.cardId);
      expect(response.status, String(expectation.cardId)).toBe(200);
      const body = response.body as { card: { text: string } };
      const sharedText =
        createRuntimeCardsById()[expectation.cardId]?.text ?? "";

      for (const snippet of expectation.catalogContains) {
        expect(body.card.text, String(expectation.cardId)).toContain(snippet);
      }
      expect(sharedText, String(expectation.cardId)).toBe(body.card.text);
      for (const snippet of expectation.notContains) {
        expect(body.card.text, String(expectation.cardId)).not.toContain(snippet);
        expect(sharedText, String(expectation.cardId)).not.toContain(snippet);
      }
    }
  });

  it("serves Runner prevention text from the same CardSpec projection in catalog and runtime", () => {
    const expectations = [
      {
        cardId: 250,
        catalogContains: ["other installed programs", "bring Joan of Arc"],
        sharedContains: ["other installed programs", "bring Joan of Arc"],
        notContains: ["prevent 1 net or core damage"],
      },
      {
        cardId: 333,
        catalogContains: ["seven Ablative counters", "Prevent 1 meat damage"],
        sharedContains: ["7 Ablative counters", "prevent 1 meat damage"],
        notContains: ["prevent 2 meat damage"],
      },
      {
        cardId: 340,
        catalogContains: ["Prevents up to 1 Net damage each turn."],
        sharedContains: ["Prevents 1 net damage each turn."],
        notContains: ["prevent 2 net damage"],
      },
      {
        cardId: 342,
        catalogContains: ["Draw two cards", "Prevent 1 brain damage"],
        sharedContains: ["Draw two cards", "Prevent 1 brain damage"],
        notContains: ["prevent 1 core damage."],
      },
      {
        cardId: 347,
        catalogContains: ["Avoid receiving a tag"],
        sharedContains: ["Avoid receiving a tag"],
        notContains: ["prevent 1 net or meat damage"],
      },
      {
        cardId: 355,
        catalogContains: ["Provides +1 MU", "increasing your link"],
        sharedContains: ["Provides +1 MU", "increasing your link"],
        notContains: ["prevent 1 meat or net damage"],
      },
      {
        cardId: 373,
        catalogContains: ["Avoid receiving a tag"],
        sharedContains: ["Avoid receiving a tag"],
        notContains: ["prevent 1 meat or net damage"],
      },
      {
        cardId: 382,
        catalogContains: ["Remove a tag", "Avoid receiving a tag"],
        sharedContains: ["Remove a tag", "Avoid receiving a tag"],
        notContains: ["prevent 1 net or meat damage"],
      },
      {
        cardId: 397,
        catalogContains: ["two Trauma counters", "Put one Trauma counter"],
        sharedContains: ["2 Trauma counters", "Put 1 Trauma counter"],
        notContains: ["prevent 2 meat damage"],
      },
      {
        cardId: 398,
        catalogContains: ["program or hardware card from being trashed"],
        sharedContains: ["program or hardware card from being trashed"],
        notContains: ["prevent 1 net, meat or core damage"],
      },
      {
        cardId: 399,
        catalogContains: [
          "gain an action",
          "Prevent any amount of meat damage",
        ],
        sharedContains: ["gain an action", "Prevent any amount of meat damage"],
        notContains: ["prevent 1 meat damage"],
      },
    ];

    for (const expectation of expectations) {
      const response = catalogDetailResponse(expectation.cardId);
      expect(response.status, String(expectation.cardId)).toBe(200);
      const body = response.body as { card: { text: string } };
      const sharedText =
        createRuntimeCardsById()[expectation.cardId]?.text ?? "";

      for (const snippet of expectation.catalogContains) {
        expect(body.card.text, String(expectation.cardId)).toContain(snippet);
      }
      expect(sharedText, String(expectation.cardId)).toBe(body.card.text);
      for (const snippet of expectation.notContains) {
        expect(body.card.text, String(expectation.cardId)).not.toContain(snippet);
        expect(sharedText, String(expectation.cardId)).not.toContain(snippet);
      }
    }
  });

  it("serves Runner utility text from the same CardSpec projection in catalog and runtime", () => {
    const expectations = [
      {
        cardId: 244,
        catalogContains: ["Spy counter", "successful run on that fort"],
        sharedContains: ["Spy counter", "successful run on that fort"],
        notContains: ["top card of the Runner stack"],
      },
      {
        cardId: 262,
        catalogContains: ["look at the top five cards of R&D"],
        sharedContains: ["look at the top five cards of R&D"],
        notContains: ["Microcyb Owl", "Stealth program"],
      },
      {
        cardId: 294,
        catalogContains: ["Militech counter", "+1 strength"],
        sharedContains: ["Militech counter", "+1 strength"],
        notContains: [],
      },
      {
        cardId: 296,
        catalogContains: ["Corp loses [1]", "you gain [10]"],
        sharedContains: ["Corp loses 1", "you gain 10"],
        notContains: ["Corp draws 1 card"],
      },
      {
        cardId: 303,
        catalogContains: ["Expose up to three installed cards."],
        sharedContains: ["Expose up to three installed Corp cards."],
        notContains: [],
      },
      {
        cardId: 313,
        catalogContains: ["remove it from the game instead of trashing it"],
        sharedContains: ["remove MIT West Tier from the game"],
        notContains: [],
      },
      {
        cardId: 318,
        catalogContains: ["treat run as a successful run on R&D"],
        sharedContains: ["treat run as a successful run on R&D"],
        notContains: [],
      },
      {
        cardId: 326,
        catalogContains: ["Show that program to the Corp"],
        sharedContains: ["Show that program to the Corp"],
        notContains: ["reveal it"],
      },
      {
        cardId: 351,
        catalogContains: ["access an additional card from R&D"],
        sharedContains: ["access 1 additional card whenever you access R&D"],
        notContains: [],
      },
      {
        cardId: 367,
        catalogContains: ["two counters of your choice are not removed"],
        sharedContains: [
          "choose up to two Virus counters that are not removed",
        ],
        notContains: [],
      },
      {
        cardId: 385,
        catalogContains: ["must pay [2]"],
        sharedContains: ["must pay [2]"],
        notContains: ["must pay 1"],
      },
      {
        cardId: 386,
        catalogContains: ["Put [12]", "take [1]"],
        sharedContains: ["Put [12]", "take [1]"],
        notContains: ["2 recurring credits", "Install with 6 Bits"],
      },
      {
        cardId: 396,
        catalogContains: ["Gain [2]"],
        sharedContains: ["Gain [2]"],
        notContains: ["Gain 3"],
      },
    ];

    for (const expectation of expectations) {
      const response = catalogDetailResponse(expectation.cardId);
      expect(response.status, String(expectation.cardId)).toBe(200);
      const body = response.body as { card: { text: string } };
      const sharedText =
        createRuntimeCardsById()[expectation.cardId]?.text ?? "";

      for (const snippet of expectation.catalogContains) {
        expect(body.card.text, String(expectation.cardId)).toContain(snippet);
      }
      expect(sharedText, String(expectation.cardId)).toBe(body.card.text);
      for (const snippet of expectation.notContains) {
        expect(body.card.text, String(expectation.cardId)).not.toContain(snippet);
        expect(sharedText, String(expectation.cardId)).not.toContain(snippet);
      }
    }
  });

  it("serves Runner virus text from the same CardSpec projection in catalog and runtime", () => {
    const expectations = [
      {
        cardId: 221,
        catalogContains: ["Butcher Boy counter", "start of each of your turns"],
        sharedContains: ["Butcher Boy counter", "start of each of your turns"],
      },
      {
        cardId: 222,
        catalogContains: [
          "Cascade counter",
          "trash faceup one card stored in R&D",
        ],
        sharedContains: [
          "Cascade counter",
          "trash faceup one card stored in R&D",
        ],
      },
      {
        cardId: 229,
        catalogContains: ["Thought counter", "look at the top card of R&D"],
        sharedContains: ["Thought counter", "look at the top card of R&D"],
      },
      {
        cardId: 276,
        catalogContains: ["Skivviss counter", "draw one extra card"],
        sharedContains: ["Skivviss counter", "draw one extra card"],
      },
    ];

    for (const expectation of expectations) {
      const response = catalogDetailResponse(expectation.cardId);
      expect(response.status, String(expectation.cardId)).toBe(200);
      const body = response.body as { card: { text: string } };
      const sharedText =
        createRuntimeCardsById()[expectation.cardId]?.text ?? "";

      for (const snippet of expectation.catalogContains) {
        expect(body.card.text, String(expectation.cardId)).toContain(snippet);
      }
      expect(sharedText, String(expectation.cardId)).toBe(body.card.text);
      expect(body.card.text, String(expectation.cardId)).not.toContain(
        "recurring credit for run costs",
      );
      expect(sharedText, String(expectation.cardId)).not.toContain(
        "recurring credit for run costs",
      );
    }
  });

  it("shows promoted longtail card details in the web catalog API", () => {
    for (const cardId of [
      238,
      287,
      510,
    ]) {
      const response = catalogDetailResponse(cardId);

      expect([200, 404], String(cardId)).toContain(response.status);
      if (response.status === 404) continue;
      const body = response.body as {
        card: {
          catalogCardId: CardDefinitionId;
          statuses: {
            ai_supported: boolean;
            human_playable: boolean;
            deck_legal: boolean;
          };
          aiHints: { aiSupportStatus: string } | null;
        };
      };
      expect(body.card.catalogCardId, String(cardId)).toBe(cardId);
      expect(body.card.statuses.ai_supported, String(cardId)).toBe(true);
      expect(body.card.statuses.human_playable, String(cardId)).toBe(true);
      expect(body.card.statuses.deck_legal, String(cardId)).toBe(true);
      expect(body.card.aiHints?.aiSupportStatus ?? "none", String(cardId)).toBe(
        "ai_supported",
      );
    }
  });

  it("covers the generated CardSpec hint inventory with unique current entries", () => {
    const cardIds = generatedCardSpecAiHints.cards.map((entry) => entry.cardId);
    expect(cardIds.length).toBeGreaterThanOrEqual(618);
    expect(new Set(cardIds).size).toBe(cardIds.length);
    expect(cardIds).toEqual(generatedCardSpecAiHints.cardIds);
  });

  // Each API response is the contract unit. A growing catalog must not share
  // one aggregate timeout, and failures must identify the affected card.
  it.each(generatedCardSpecAiHints.cards)(
    "serves the generated CardSpec hint projection for $cardId",
    (generated) => {
      const response = catalogDetailResponse(generated.cardId);
      expect(response.status, String(generated.cardId)).toBe(200);
      const body = response.body as CatalogDetailAiHints;
      expect(body.card.aiHints, String(generated.cardId)).toMatchObject({
        cardId: generated.hint.cardId,
        roles: generated.hint.roles,
        planRoles: generated.hint.planRoles,
        requiredMechanics: generated.hint.requiredMechanics,
        ...(generated.hint.riskTags === undefined
          ? {}
          : { riskTags: generated.hint.riskTags }),
        scenarioRefs: generated.hint.scenarioRefs,
        aiSupportStatus: "ai_supported",
      });
    },
  );

  it("keeps generated detail hints deeply immutable across API responses", () => {
    for (const cardId of [
      366,
      59,
    ]) {
      const first = catalogDetailResponse(cardId).body as CatalogDetailAiHints;
      const roles = first.card.aiHints?.roles;
      expect(roles, String(cardId)).toBeDefined();
      expect(Object.isFrozen(roles), String(cardId)).toBe(true);
      expect(() => roles?.push("cs06_poison"), String(cardId)).toThrow(TypeError);

      const second = catalogDetailResponse(cardId).body as CatalogDetailAiHints;
      expect(second.card.aiHints?.roles, String(cardId)).not.toContain("cs06_poison");
      expect(second.card.aiHints).toBe(first.card.aiHints);
    }
  });
});
