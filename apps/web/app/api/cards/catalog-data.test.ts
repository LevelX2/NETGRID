import { describe, expect, it } from "vitest";
import {
  activeAiApprovedCardIds,
  PROTEUS_CARD_IDS,
  PROTEUS_VISIBLE_BASELINE_CARD_IDS,
} from "@netgrid/catalog";
import { DEMO_CARDS_BY_ID } from "@netgrid/shared";
import { catalogDetailResponse, catalogListResponse } from "./catalog-data";

type CatalogAiHintExpectation = {
  title: string;
  cardId: string;
  roles?: string[];
  planRoles?: string[];
  requiredMechanics?: string[];
  riskTags?: string[];
  scenarioRefs?: string[];
};

type CatalogDetailAiHints = {
  card: {
    aiHints: {
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
      supportStatus: {
        aiSupportStatus: string;
        compiledHintFound: boolean;
        mechanicalFactsFound: boolean;
        generatedFactsFound: boolean;
        warningCount: number;
      };
      compiledHint: {
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
        planRolesClassification: Array<{ value: string; triageCategory: string }>;
      };
      warnings: {
        categories: string[];
        descriptorGaps: Array<{ gapId?: string }>;
      };
    } | null;
  };
};

const EXPECTED_PROTEUS_VISIBLE_BASELINE_CARD_IDS = [
  "onr_proteus_002_charity-takeover",
  "onr_proteus_009_viral-breeding-ground",
  "onr_proteus_011_brain-wash",
  "onr_proteus_012_bug-zapper",
  "onr_proteus_013_caryatid",
  "onr_proteus_015_colonel-failure",
  "onr_proteus_017_credit-blocks",
  "onr_proteus_020_digiconda",
  "onr_proteus_021_dog-pile",
  "onr_proteus_022_food-fight",
  "onr_proteus_023_galatea",
  "onr_proteus_024_gatekeeper",
  "onr_proteus_025_homing-missile",
  "onr_proteus_026_hunting-pack",
  "onr_proteus_028_lesser-arcana",
  "onr_proteus_030_mastermind",
  "onr_proteus_031_minotaur",
  "onr_proteus_032_misleading-access-menus",
  "onr_proteus_033_mobile-barricade",
  "onr_proteus_034_riddler",
  "onr_proteus_036_sandstorm",
  "onr_proteus_038_snowbank",
  "onr_proteus_039_sphinx-2006",
  "onr_proteus_040_sumo-2008",
  "onr_proteus_041_toughoniumtm-wall",
  "onr_proteus_044_walking-wall",
  "onr_proteus_047_credit-consolidation",
  "onr_proteus_048_data-sifters",
  "onr_proteus_050_manhunt",
  "onr_proteus_052_schlaghund-pointers",
  "onr_proteus_053_underworld-mole",
  "onr_proteus_054_bel-digmo-antibody",
  "onr_proteus_057_doppelganger-antibody",
  "onr_proteus_062_lesley-major",
  "onr_proteus_065_networked-center",
  "onr_proteus_068_pattel-antibody",
  "onr_proteus_070_rasmin-bridger",
  "onr_proteus_072_research-bunker",
  "onr_proteus_075_stereogram-antibody",
  "onr_proteus_077_weapons-depot",
  "onr_proteus_078_armageddon",
  "onr_proteus_079_big-frackin-gun",
  "onr_proteus_080_black-widow",
  "onr_proteus_081_boring-bit",
  "onr_proteus_082_bulldozer",
  "onr_proteus_083_corrosion",
  "onr_proteus_084_crumble",
  "onr_proteus_085_disintegrator",
  "onr_proteus_086_enterprise-inc-shields",
  "onr_proteus_088_fubar",
  "onr_proteus_089_garbage-in",
  "onr_proteus_090_highlighter",
  "onr_proteus_091_lockjaw",
  "onr_proteus_092_morphing-tool",
  "onr_proteus_093_redecorator",
  "onr_proteus_094_scaldan",
  "onr_proteus_095_skeleton-passkeys",
  "onr_proteus_096_skullcap",
  "onr_proteus_097_taxman",
  "onr_proteus_098_vienna-22",
  "onr_proteus_099_viral-pipeline",
  "onr_proteus_100_wrecking-ball",
  "onr_proteus_101_all-hands",
  "onr_proteus_103_cruising-for-netwatch",
  "onr_proteus_104_decoy-signal",
  "onr_proteus_105_demolition-run",
  "onr_proteus_106_disgruntled-ice-technician",
  "onr_proteus_107_drone-for-a-day",
  "onr_proteus_108_faked-hit",
  "onr_proteus_114_on-the-fast-track",
  "onr_proteus_115_personal-touch-the",
  "onr_proteus_117_poisoned-water-supply",
  "onr_proteus_118_prearranged-drop",
  "onr_proteus_120_reconnaissance",
  "onr_proteus_121_remote-detonator",
  "onr_proteus_122_rush-hour",
  "onr_proteus_124_stakeout",
  "onr_proteus_127_weefle-initiation",
  "onr_proteus_130_back-door-to-rivals",
  "onr_proteus_134_cortical-cybermodem",
  "onr_proteus_135_cortical-stimulators",
  "onr_proteus_138_deck-the",
  "onr_proteus_139_eurocorpse-tm-spin-chip",
  "onr_proteus_146_precision-bribery",
  "onr_proteus_148_runner-sensei",
  "onr_proteus_150_streetware-distributor",
  "onr_proteus_151_sunburst-cranial-interface",
] as const;

const CATALOG_AI_HINT_EXPECTATIONS = [
  {
    title: "exposes killer breaker plan hints for King of the Road",
    cardId: "onr_v1_006_black-dahlia",
    roles: ["breaker_killer"],
    planRoles: ["build_rig"],
    scenarioRefs: [
      "data/scenarios/ai-kotr-runner-approval-smokes.json#build_rig",
    ],
  },
  {
    title: "exposes decoder rig hints for runner rig approvals",
    cardId: "onr_v1_014_codecracker",
    roles: ["breaker_decoder"],
    planRoles: ["build_rig"],
    riskTags: ["credit_reserve"],
    scenarioRefs: [
      "data/scenarios/ai-runner-rig-low-risk-batch-a-smokes.json#safe_probe_run",
    ],
  },
  {
    title: "exposes tag punishment operation hints",
    cardId: "onr_v1_293_netwatch-credit-voucher",
    roles: ["tag_punishment"],
    planRoles: ["recover_economy"],
    scenarioRefs: [
      "data/scenarios/ai-corp-tag-approval-slice-smokes.json#tag_operation_punish_visible_tag",
    ],
  },
  {
    title: "exposes trace and tag enabler hints",
    cardId: "onr_v1_306_trojan-horse",
    roles: ["tag_enabler"],
    planRoles: ["recover_economy"],
    scenarioRefs: [
      "data/scenarios/ai-corp-tag-approval-slice-smokes.json#trojan_horse_after_agenda_theft",
    ],
  },
  {
    title: "exposes run-event pressure hints",
    cardId: "onr_v1_094_inside-job",
    roles: ["run_event"],
    planRoles: ["pressure_hq"],
    scenarioRefs: [
      "data/scenarios/ai-deck-legal-v171-v181-open64-smokes.json#runner_run_event_pressure",
    ],
  },
  {
    title: "exposes random breaker hints",
    cardId: "onr_v1_007_blink",
    roles: ["random_breaker"],
    planRoles: ["safe_probe_run"],
    scenarioRefs: [
      "data/scenarios/ai-deck-legal-v190-smokes.json#runner_v190_random_breakers_and_black_ops_punish",
    ],
  },
  {
    title: "exposes bonus-run pressure hints",
    cardId: "onr_v1_076_all-nighter",
    roles: ["bonus_run"],
    planRoles: ["pressure_rnd"],
    scenarioRefs: [
      "data/scenarios/ai-deck-legal-v191-v194-smokes.json#runner_v192_run_events_and_resource_lifecycle",
    ],
  },
  {
    title: "exposes Dropp emergency breaker hints",
    cardId: "onr_v1_019_dropp",
    roles: ["program", "icebreaker", "breaker_end_run", "emergency_breaker"],
    requiredMechanics: ["end_run_after_breaker_use"],
    riskTags: ["risk.access_loss_on_use"],
    scenarioRefs: [
      "data/scenarios/ai-deck-legal-v195-v198-smokes.json#runner_v198_dogcatcher_and_dropp_breakers",
    ],
  },
  {
    title: "exposes upgrade protection hints",
    cardId: "onr_v1_349_aardvark",
    roles: ["upgrade"],
    planRoles: ["protect_rnd"],
    scenarioRefs: [
      "data/scenarios/ai-deck-legal-v199-smokes.json#corp_v199_aardvark_worm_intercept",
    ],
  },
  {
    title: "exposes hidden-zone protection hints",
    cardId: "onr_v1_272_too-many-doors",
    roles: ["hidden_zone_tool"],
    planRoles: ["protect_rnd"],
    scenarioRefs: [
      "data/scenarios/ai-deck-legal-v1911-smokes.json#corp_v1911_rd_reveal_and_reorder",
    ],
  },
  {
    title: "exposes deterministic-random resolver hints",
    cardId: "onr_v1_002_ai-boon",
    roles: ["random"],
    planRoles: ["runner_start_run_strength_roll"],
    requiredMechanics: ["deterministic_random_card_resolver"],
    scenarioRefs: [
      "data/scenarios/ai-deck-legal-v1921-smokes.json#runner_v1921_random_programs",
    ],
  },
  {
    title: "exposes longtail program-install hints",
    cardId: "onr_v1_075_zetatech-software-installer",
    roles: ["per_card_longtail"],
    planRoles: ["runner_install_program"],
    requiredMechanics: ["per_card_longtail_resolver_gate"],
    scenarioRefs: [
      "data/scenarios/ai-deck-legal-v1922-smokes.json#runner_v1922_program_longtail",
    ],
  },
] satisfies readonly CatalogAiHintExpectation[];

describe("catalog API filters", () => {
  it("filters by ai_supported instead of falling back to the full catalog", () => {
    const response = catalogListResponse(
      new URLSearchParams({ status: "ai_supported" }),
    );

    expect(response.status).toBe(200);
    const body = response.body as {
      cards: Array<{
        catalogCardId: string;
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
      cardId.startsWith("onr_v1_"),
    );
    expect(
      body.cards
        .filter((card) => card.catalogCardId.startsWith("onr_v1_"))
        .map((card) => card.catalogCardId)
        .sort(),
    ).toEqual([...new Set(expectedOnrAiApproved)].sort());
    expect(body.cards.map((card) => card.catalogCardId)).toEqual(
      expect.arrayContaining([
        "onr_v1_026_false-echo",
        "onr_v1_075_zetatech-software-installer",
      ]),
    );
    expect(body.cards.map((card) => card.catalogCardId)).toEqual(
      expect.arrayContaining([...PROTEUS_VISIBLE_BASELINE_CARD_IDS]),
    );
  });

  it("keeps the Proteus visible baseline decklegal, format-legal and AI-supported", () => {
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
          catalogCardId: string;
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
        aiHints: expect.objectContaining({
          aiSupportStatus: "ai_supported",
        }),
      });
    }

    const humanPlayableResponse = catalogListResponse(
      new URLSearchParams({ status: "human_playable", q: "Toughonium" }),
    );
    expect(humanPlayableResponse.status).toBe(200);
    const humanPlayableBody = humanPlayableResponse.body as {
      cards: Array<{ catalogCardId: string }>;
    };
    expect(humanPlayableBody.cards.map((card) => card.catalogCardId)).toEqual([
      "onr_proteus_041_toughoniumtm-wall",
    ]);

    for (const status of ["deck_legal", "format_legal"] as const) {
      const response = catalogListResponse(
        new URLSearchParams({ status, q: "Toughonium" }),
      );
      expect(response.status).toBe(200);
      const body = response.body as { cards: Array<{ catalogCardId: string }> };
      expect(body.cards.map((card) => card.catalogCardId)).toEqual([
        "onr_proteus_041_toughoniumtm-wall",
      ]);
    }

    const aiSupportedResponse = catalogListResponse(
      new URLSearchParams({ status: "ai_supported", q: "Toughonium" }),
    );
    expect(aiSupportedResponse.status).toBe(200);
    const aiSupportedBody = aiSupportedResponse.body as {
      cards: Array<{ catalogCardId: string }>;
    };
    expect(aiSupportedBody.cards.map((card) => card.catalogCardId)).toEqual([
      "onr_proteus_041_toughoniumtm-wall",
    ]);

    const firstProteusResponse = catalogDetailResponse(
      "onr_proteus_001_ai-board-member",
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
  });

  it("exposes display-only rarity metadata in list and detail responses", () => {
    const detailResponse = catalogDetailResponse("onr_v1_001_afreet");
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
      sourceId: "onr-v1-limited-runner-spoiler",
    });

    const listResponse = catalogListResponse(
      new URLSearchParams({ q: "Afreet" }),
    );
    expect(listResponse.status).toBe(200);
    const listBody = listResponse.body as {
      cards: Array<{
        catalogCardId: string;
        rarity?: { code: string; labelDe: string };
      }>;
    };
    expect(
      listBody.cards.find((card) => card.catalogCardId === "onr_v1_001_afreet")
        ?.rarity,
    ).toMatchObject({ code: "uncommon", labelDe: "Ungewöhnlich" });
  });

  it("exposes the AI005 card-catalog inspector from compiled hints", () => {
    const response = catalogDetailResponse("onr_v1_002_ai-boon");
    expect(response.status).toBe(200);
    const body = response.body as CatalogDetailAiInspector;
    const inspector = body.card.aiInspector;

    expect(inspector).not.toBeNull();
    if (!inspector) throw new Error("Missing AI inspector for onr_v1_002_ai-boon");
    expect(inspector.schemaVersion).toBe("ai-hint-inspector-index-v1");
    expect(inspector.supportStatus).toMatchObject({
      aiSupportStatus: "ai_supported",
      compiledHintFound: true,
      mechanicalFactsFound: true,
    });
    expect(inspector.mechanicalFacts?.effects).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "breaker" })]),
    );
    expect(inspector.mechanicalFacts?.breakerProfile?.coverage).toContain(
      "sentry",
    );
    expect(inspector.functionSignals).toContain("breaker.sentry");
    expect(inspector.legacyRoles.planRolesClassification).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: "runner_install_program",
          triageCategory: "strategy_alias",
          mapsTo: ["runner.rig_first"],
        }),
      ]),
    );
    expect(inspector.strategicRole).toEqual([]);
    expect(inspector.quality).toMatchObject({ hintReviewed: true });
    expect(Object.keys(inspector.quality ?? {})).not.toContain(
      "economyQuality",
    );
    expect(inspector.legacyRoles.roles).toEqual(
      expect.arrayContaining(["program", "random"]),
    );
    expect(inspector.warnings.categories).toContain(
      "deferred_requires_human_review",
    );
  });

  it("exposes generated remoteRole facts and descriptor-gap warnings in the inspector", () => {
    const remoteResponse = catalogDetailResponse("onr_v1_012_clown");
    expect(remoteResponse.status).toBe(200);
    const remoteBody = remoteResponse.body as CatalogDetailAiInspector;
    expect(remoteBody.card.aiInspector?.supportStatus.generatedFactsFound).toBe(
      true,
    );
    expect(remoteBody.card.aiInspector?.mechanicalFacts?.remoteRole).toMatchObject(
      { kind: "ice_modifier" },
    );

    const gapResponse = catalogDetailResponse("onr_v1_017_deep-thought");
    expect(gapResponse.status).toBe(200);
    const gapBody = gapResponse.body as CatalogDetailAiInspector;
    expect(gapBody.card.aiInspector?.warnings.categories).toContain(
      "descriptor_gap",
    );
    expect(gapBody.card.aiInspector?.legacyRoles.rolesClassification).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: "hidden_zone_tool",
          triageCategory: "descriptor_gap",
        }),
      ]),
    );
  });

  it("exposes lightweight AI inspector summaries for catalog filtering", () => {
    const response = catalogListResponse(
      new URLSearchParams("q=Bodyweight%E2%84%A2%20Synthetic%20Blood"),
    );
    expect(response.status).toBe(200);
    const body = response.body as {
      cards: Array<{
        catalogCardId: string;
        aiInspectorSummary?: {
          available: boolean;
          mechanicalFactsFound: boolean;
          generatedFactsFound: boolean;
          hasClassifications: boolean;
          hasWarnings: boolean;
        } | null;
      }>;
    };

    expect(body.cards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          catalogCardId: "onr_v1_079_bodyweight-synthetic-blood",
          aiInspectorSummary: expect.objectContaining({
            available: true,
            mechanicalFactsFound: true,
            generatedFactsFound: true,
            hasClassifications: true,
            hasWarnings: false,
          }),
        }),
      ]),
    );

    const blockedResponse = catalogListResponse(
      new URLSearchParams("status=blocked&q=Baskerville"),
    );
    expect(blockedResponse.status).toBe(200);
    const blockedBody = blockedResponse.body as {
      cards: Array<{
        catalogCardId: string;
        aiInspectorSummary?: unknown;
      }>;
    };
    expect(blockedBody.cards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          catalogCardId: "onr_classic_005_baskerville",
          aiInspectorSummary: null,
        }),
      ]),
    );
  });

  it("serves The Shell Traders catalog text from the confirmed spoiler instead of the old recurring-credit placeholder", () => {
    const response = catalogDetailResponse("onr_v1_176_the-shell-traders");
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
        cardId: "onr_v1_220_tycho-extension",
        contains: ["No additional ability."],
        notContains: ["Regeltext"],
      },
      {
        cardId: "onr_v1_222_ball-and-chain",
        contains: ["Runner must pay 2"],
        notContains: ["Runner must pay 1"],
      },
      {
        cardId: "onr_v1_234_data-darts",
        contains: [
          "Do 3 net damage",
          "cannot break any subroutines of the next piece of ice",
        ],
        notContains: ["Do 1 net damage", "End the run"],
      },
      {
        cardId: "onr_v1_236_data-raven",
        contains: [
          "give Runner a tag and a Data Raven counter",
          "taking an action to pay 1",
        ],
        notContains: ["counter on Data Raven", "End the run"],
      },
      {
        cardId: "onr_v1_320_encoder-inc",
        contains: [
          "cost 1 less to rez",
          'additional "End the run" subroutine',
        ],
        notContains: ["cost 2 less to rez"],
      },
      {
        cardId: "onr_v1_349_aardvark",
        contains: ["any bits spent using that worm", "further icebreakers"],
        notContains: [],
      },
      {
        cardId: "onr_v1_351_bizarre-encryption-scheme",
        contains: [
          "return that agenda to the fort",
          "This does not affect any further runs",
        ],
        notContains: [],
      },
      {
        cardId: "onr_v1_352_chester-mix",
        contains: ["reduced by 2"],
        notContains: ["reduced by 1"],
      },
      {
        cardId: "onr_v1_353_chimera",
        contains: ["When Runner accesses Chimera, trash a daemon."],
        notContains: ["installed daemon program"],
      },
    ];

    for (const expectation of expectations) {
      const response = catalogDetailResponse(expectation.cardId);
      expect(response.status, expectation.cardId).toBe(200);
      const body = response.body as { card: { text: string } };
      for (const snippet of expectation.contains) {
        expect(body.card.text, expectation.cardId).toContain(snippet);
      }
      for (const snippet of expectation.notContains) {
        expect(body.card.text, expectation.cardId).not.toContain(snippet);
      }
    }
  });

  it("serves corrected Runner icebreaker spoiler-aligned catalog and shared text", () => {
    const expectations = [
      {
        cardId: "onr_v1_015_codeslinger",
        catalogContains: ["1 credit: Break sentry subroutine."],
        sharedContains: ["1 Credits: Break 1 sentry subroutine."],
        notContains: ["0 credits: Break sentry subroutine."],
      },
      {
        cardId: "onr_v1_018_dogcatcher",
        catalogContains: ["pit bull, hellhound, bloodhound, or watchdog"],
        sharedContains: ["Pit Bull, Hellhound, Bloodhound, or Watchdog"],
        notContains: ["Break ice subroutine"],
      },
      {
        cardId: "onr_v1_019_dropp",
        catalogContains: [
          "0 credits: Break all subroutines of a piece of ice, and end the run.",
          "1 credit: +1 strength.",
        ],
        sharedContains: [
          "0 Credits: Break all subroutines of a piece of ice, and end the run.",
        ],
        notContains: ["2 credits: +1 strength.", "Using Dropp ends your run."],
      },
      {
        cardId: "onr_v1_036_jackhammer",
        catalogContains: ["lose 1 credit, if you can, from a stealth card"],
        sharedContains: ["lose 1 from a Stealth card, if you can"],
        notContains: [],
      },
      {
        cardId: "onr_v1_052_raffles",
        catalogContains: ["1 credit: Break code gate subroutine."],
        sharedContains: ["1 Credits: Break 1 code gate subroutine."],
        notContains: ["0 credits: Break code gate subroutine."],
      },
      {
        cardId: "onr_v1_053_ramming-piston",
        catalogContains: [
          "2 credits: Break wall subroutine.",
          "lose a total of 2 credits from stealth cards",
        ],
        sharedContains: [
          "[2]: Break wall subroutine.",
          "lose a total of 2 credits from Stealth cards",
        ],
        notContains: ["trace limit reduced"],
      },
      {
        cardId: "onr_v1_066_snowball",
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
      expect(response.status, expectation.cardId).toBe(200);
      const body = response.body as { card: { text: string } };
      const sharedText = DEMO_CARDS_BY_ID[expectation.cardId]?.rulesText ?? "";

      for (const snippet of expectation.catalogContains) {
        expect(body.card.text, expectation.cardId).toContain(snippet);
      }
      for (const snippet of expectation.sharedContains) {
        expect(sharedText, expectation.cardId).toContain(snippet);
      }
      for (const snippet of expectation.notContains) {
        expect(body.card.text, expectation.cardId).not.toContain(snippet);
        expect(sharedText, expectation.cardId).not.toContain(snippet);
      }
    }
  });

  it("exposes corrected Runner icebreaker AI hints", () => {
    expectCatalogAiHints({
      title: "Dogcatcher restriction",
      cardId: "onr_v1_018_dogcatcher",
      roles: ["restricted_breaker"],
      requiredMechanics: ["restricted_breaker_targets"],
    });
    expectCatalogAiHints({
      title: "Dropp end-run drawback",
      cardId: "onr_v1_019_dropp",
      roles: ["breaker_end_run"],
      requiredMechanics: ["end_run_after_breaker_use"],
    });
    expectCatalogAiHints({
      title: "Snowball run strength",
      cardId: "onr_v1_066_snowball",
      requiredMechanics: ["run_strength_modifier"],
    });
  });

  it("serves corrected Runner prevention and tag-protection catalog and shared text", () => {
    const expectations = [
      {
        cardId: "onr_v1_038_joan-of-arc",
        catalogContains: ["other installed programs", "bring Joan of Arc"],
        sharedContains: ["other installed programs", "bring Joan of Arc"],
        notContains: ["prevent 1 net or core damage"],
      },
      {
        cardId: "onr_v1_121_armored-fridge",
        catalogContains: ["seven Ablative counters", "Prevent 1 meat damage"],
        sharedContains: ["7 Ablative counters", "prevent 1 meat damage"],
        notContains: ["prevent 2 meat damage"],
      },
      {
        cardId: "onr_v1_128_green-knight-surge-buffers",
        catalogContains: ["Prevents 1 net damage each turn."],
        sharedContains: ["Prevents 1 net damage each turn."],
        notContains: ["prevent 2 net damage"],
      },
      {
        cardId: "onr_v1_130_lifesaver-nanosurgeons",
        catalogContains: ["Draw two cards", "Prevent 1 brain damage"],
        sharedContains: ["Draw two cards", "Prevent 1 brain damage"],
        notContains: ["prevent 1 core damage."],
      },
      {
        cardId: "onr_v1_135_nasuko-cycle",
        catalogContains: ["Avoid receiving a tag"],
        sharedContains: ["Avoid receiving a tag"],
        notContains: ["prevent 1 net or meat damage"],
      },
      {
        cardId: "onr_v1_143_techtronica-utility-suit",
        catalogContains: ["Provides +1 MU", "increasing your link"],
        sharedContains: ["Provides +1 MU", "increasing your link"],
        notContains: ["prevent 1 meat or net damage"],
      },
      {
        cardId: "onr_v1_161_fall-guy",
        catalogContains: ["Avoid receiving a tag"],
        sharedContains: ["Avoid receiving a tag"],
        notContains: ["prevent 1 meat or net damage"],
      },
      {
        cardId: "onr_v1_170_nomad-allies",
        catalogContains: ["Remove a tag", "Avoid receiving a tag"],
        sharedContains: ["Remove a tag", "Avoid receiving a tag"],
        notContains: ["prevent 1 net or meat damage"],
      },
      {
        cardId: "onr_v1_185_trauma-team",
        catalogContains: ["two Trauma counters", "Put one Trauma counter"],
        sharedContains: ["2 Trauma counters", "Put 1 Trauma counter"],
        notContains: ["prevent 2 meat damage"],
      },
      {
        cardId: "onr_v1_186_umbrella-policy",
        catalogContains: ["program or hardware card from being trashed"],
        sharedContains: ["program or hardware card from being trashed"],
        notContains: ["prevent 1 net, meat or core damage"],
      },
      {
        cardId: "onr_v1_187_wilson-weeflerunner-apprentice",
        catalogContains: ["gain an action", "Prevent any amount of meat damage"],
        sharedContains: ["gain an action", "Prevent any amount of meat damage"],
        notContains: ["prevent 1 meat damage"],
      },
    ];

    for (const expectation of expectations) {
      const response = catalogDetailResponse(expectation.cardId);
      expect(response.status, expectation.cardId).toBe(200);
      const body = response.body as { card: { text: string } };
      const sharedText = DEMO_CARDS_BY_ID[expectation.cardId]?.rulesText ?? "";

      for (const snippet of expectation.catalogContains) {
        expect(body.card.text, expectation.cardId).toContain(snippet);
      }
      for (const snippet of expectation.sharedContains) {
        expect(sharedText, expectation.cardId).toContain(snippet);
      }
      for (const snippet of expectation.notContains) {
        expect(body.card.text, expectation.cardId).not.toContain(snippet);
        expect(sharedText, expectation.cardId).not.toContain(snippet);
      }
    }
  });

  it("exposes corrected Runner prevention and tag-protection AI hints", () => {
    expectCatalogAiHints({
      title: "Joan trash prevention",
      cardId: "onr_v1_038_joan-of-arc",
      roles: ["trash_prevention"],
      requiredMechanics: ["program_trash_prevention", "return_to_hand"],
    });
    expectCatalogAiHints({
      title: "Nasuko tag avoid",
      cardId: "onr_v1_135_nasuko-cycle",
      roles: ["tag_avoid"],
      requiredMechanics: ["tag_avoid", "credit_cost"],
    });
    expectCatalogAiHints({
      title: "Techtronica deck link package",
      cardId: "onr_v1_143_techtronica-utility-suit",
      roles: ["memory", "link", "deck"],
      requiredMechanics: ["link_bits", "deck_unique_replacement"],
    });
    expectCatalogAiHints({
      title: "Umbrella trash prevention",
      cardId: "onr_v1_186_umbrella-policy",
      roles: ["trash_prevention"],
      requiredMechanics: [
        "program_trash_prevention",
        "hardware_trash_prevention",
      ],
    });
    expectCatalogAiHints({
      title: "Wilson run action and tag protection",
      cardId: "onr_v1_187_wilson-weeflerunner-apprentice",
      roles: ["run_action", "tag_avoid"],
      requiredMechanics: ["run_action_gain", "run_spending_cap"],
    });
  });

  it("serves corrected Runner run, access and resource catalog and shared text", () => {
    const expectations = [
      {
        cardId: "onr_v1_032_i-spy",
        catalogContains: ["Spy counter", "successful run on that fort"],
        sharedContains: ["Spy counter", "successful run on that fort"],
        notContains: ["top card of the Runner stack"],
      },
      {
        cardId: "onr_v1_050_r-and-d-protocol-files",
        catalogContains: ["look at the top five cards of R&D"],
        sharedContains: ["look at the top five cards of R&D"],
        notContains: ["Microcyb Owl", "Stealth program"],
      },
      {
        cardId: "onr_v1_082_deal-with-militech",
        catalogContains: ["Militech counter", "+1 strength"],
        sharedContains: ["Militech counter", "+1 strength"],
        notContains: [],
      },
      {
        cardId: "onr_v1_084_edited-shipping-manifests",
        catalogContains: ["Corp loses 1 credit", "you gain 10 credits"],
        sharedContains: ["Corp loses 1", "you gain 10"],
        notContains: ["Corp draws 1 card"],
      },
      {
        cardId: "onr_v1_091_hunt-club-bbs",
        catalogContains: ["Expose up to three installed cards."],
        sharedContains: ["Expose up to three installed Corp cards."],
        notContains: [],
      },
      {
        cardId: "onr_v1_101_mit-west-tier",
        catalogContains: ["remove it from the game instead of trashing it"],
        sharedContains: ["remove MIT West Tier from the game"],
        notContains: [],
      },
      {
        cardId: "onr_v1_106_private-ldl-access",
        catalogContains: ["treat run as a successful run on R&D"],
        sharedContains: ["treat run as a successful run on R&D"],
        notContains: [],
      },
      {
        cardId: "onr_v1_114_temple-microcode-outlet",
        catalogContains: ["Show that program to the Corp"],
        sharedContains: ["Show that program to the Corp"],
        notContains: ["reveal it"],
      },
      {
        cardId: "onr_v1_139_r-and-d-interface",
        catalogContains: ["access an additional card from R&D"],
        sharedContains: ["access 1 additional card whenever you access R&D"],
        notContains: [],
      },
      {
        cardId: "onr_v1_155_code-viral-cache",
        catalogContains: ["two counters of your choice are not removed"],
        sharedContains: ["choose up to two Virus counters that are not removed"],
        notContains: [],
      },
      {
        cardId: "onr_v1_173_restrictive-net-zoning",
        catalogContains: ["must pay 2"],
        sharedContains: ["must pay 2"],
        notContains: ["must pay 1"],
      },
      {
        cardId: "onr_v1_174_rigged-investments",
        catalogContains: ["Put 12 credits", "take 1 credit"],
        sharedContains: ["Put 12 credits", "take 1 credit"],
        notContains: ["2 recurring credits", "Install with 6 Bits"],
      },
      {
        cardId: "onr_v1_184_top-runners-conference",
        catalogContains: ["Gain 2 credits"],
        sharedContains: ["Gain 2 credits"],
        notContains: ["Gain 3"],
      },
    ];

    for (const expectation of expectations) {
      const response = catalogDetailResponse(expectation.cardId);
      expect(response.status, expectation.cardId).toBe(200);
      const body = response.body as { card: { text: string } };
      const sharedText = DEMO_CARDS_BY_ID[expectation.cardId]?.rulesText ?? "";

      for (const snippet of expectation.catalogContains) {
        expect(body.card.text, expectation.cardId).toContain(snippet);
      }
      for (const snippet of expectation.sharedContains) {
        expect(sharedText, expectation.cardId).toContain(snippet);
      }
      for (const snippet of expectation.notContains) {
        expect(body.card.text, expectation.cardId).not.toContain(snippet);
        expect(sharedText, expectation.cardId).not.toContain(snippet);
      }
    }
  });

  it("exposes corrected Runner run, access and resource AI hints", () => {
    expectCatalogAiHints({
      title: "I Spy fort counter",
      cardId: "onr_v1_032_i-spy",
      roles: ["spy_counter"],
      requiredMechanics: ["spy_counter", "expose_fort_cards"],
    });
    expectCatalogAiHints({
      title: "R&D Protocol top-card replacement",
      cardId: "onr_v1_050_r-and-d-protocol-files",
      roles: ["rd_run", "access_replacement"],
      requiredMechanics: ["top_rd_look"],
    });
    expectCatalogAiHints({
      title: "Edited Shipping Manifests payout",
      cardId: "onr_v1_084_edited-shipping-manifests",
      roles: ["tag_self"],
      requiredMechanics: ["runner_gain_credits", "runner_gain_tag"],
    });
    expectCatalogAiHints({
      title: "Rigged Investments bit pool",
      cardId: "onr_v1_174_rigged-investments",
      roles: ["economy", "resource"],
      requiredMechanics: ["bit_counter_pool_12", "trash_when_empty"],
    });
    expectCatalogAiHints({
      title: "Top Runners Conference economy",
      cardId: "onr_v1_184_top-runners-conference",
      roles: ["run_drawback"],
      requiredMechanics: ["start_turn_gain_2", "trash_on_run"],
    });
  });

  it("serves corrected Runner virus-counter catalog and shared text", () => {
    const expectations = [
      {
        cardId: "onr_v1_009_butcher-boy",
        catalogContains: ["Butcher Boy counter", "start of each of your turns"],
        sharedContains: ["Butcher Boy counter", "start of each of your turns"],
      },
      {
        cardId: "onr_v1_010_cascade",
        catalogContains: ["Cascade counter", "trash faceup one card stored in R&D"],
        sharedContains: ["Cascade counter", "trash faceup one card stored in R&D"],
      },
      {
        cardId: "onr_v1_017_deep-thought",
        catalogContains: ["Thought counter", "look at the top card of R&D"],
        sharedContains: ["Thought counter", "look at the top card of R&D"],
      },
      {
        cardId: "onr_v1_064_skivviss",
        catalogContains: ["Skivviss counter", "draw one extra card"],
        sharedContains: ["Skivviss counter", "draw one extra card"],
      },
    ];

    for (const expectation of expectations) {
      const response = catalogDetailResponse(expectation.cardId);
      expect(response.status, expectation.cardId).toBe(200);
      const body = response.body as { card: { text: string } };
      const sharedText = DEMO_CARDS_BY_ID[expectation.cardId]?.rulesText ?? "";

      for (const snippet of expectation.catalogContains) {
        expect(body.card.text, expectation.cardId).toContain(snippet);
      }
      for (const snippet of expectation.sharedContains) {
        expect(sharedText, expectation.cardId).toContain(snippet);
      }
      expect(body.card.text, expectation.cardId).not.toContain(
        "recurring credit for run costs",
      );
      expect(sharedText, expectation.cardId).not.toContain(
        "recurring credit for run costs",
      );
    }
  });

  it("exposes corrected Runner virus-counter AI hints", () => {
    expectCatalogAiHints({
      title: "Butcher Boy counter economy",
      cardId: "onr_v1_009_butcher-boy",
      roles: ["hq_run_reward", "economy"],
      requiredMechanics: ["butcher_boy_counter"],
    });
    expectCatalogAiHints({
      title: "Cascade start-turn trash",
      cardId: "onr_v1_010_cascade",
      roles: ["corp_start_turn_pressure"],
      requiredMechanics: ["cascade_counter", "corp_start_turn_trash_faceup_rd"],
    });
    expectCatalogAiHints({
      title: "Deep Thought hidden look",
      cardId: "onr_v1_017_deep-thought",
      roles: ["hidden_zone_tool"],
      requiredMechanics: ["thought_counter", "top_rd_look_threshold_3"],
    });
    expectCatalogAiHints({
      title: "Skivviss draw pressure",
      cardId: "onr_v1_064_skivviss",
      roles: ["corp_draw_pressure"],
      requiredMechanics: ["skivviss_counter", "corp_start_turn_extra_draw"],
    });
  });

  it("shows promoted longtail card details in the web catalog API", () => {
    for (const cardId of [
      "onr_v1_026_false-echo",
      "onr_v1_075_zetatech-software-installer",
      "onr_v1_298_planning-consultants",
    ]) {
      const response = catalogDetailResponse(cardId);

      expect([200, 404], cardId).toContain(response.status);
      if (response.status === 404) continue;
      const body = response.body as {
        card: {
          catalogCardId: string;
          statuses: {
            ai_supported: boolean;
            human_playable: boolean;
            deck_legal: boolean;
          };
          aiHints: { aiSupportStatus: string } | null;
        };
      };
      expect(body.card.catalogCardId, cardId).toBe(cardId);
      expect(body.card.statuses.ai_supported, cardId).toBe(true);
      expect(body.card.statuses.human_playable, cardId).toBe(true);
      expect(body.card.statuses.deck_legal, cardId).toBe(true);
      expect(body.card.aiHints?.aiSupportStatus ?? "none", cardId).toBe(
        "ai_supported",
      );
    }
  });

  for (const expectation of CATALOG_AI_HINT_EXPECTATIONS) {
    it(expectation.title, () => {
      expectCatalogAiHints(expectation);
    });
  }
});

function expectCatalogAiHints(expectation: CatalogAiHintExpectation) {
  const response = catalogDetailResponse(expectation.cardId);

  expect(response.status).toBe(200);
  const body = response.body as CatalogDetailAiHints;
  const aiHints = body.card.aiHints;
  expect(aiHints, expectation.cardId).not.toBeNull();
  if (!aiHints) throw new Error(`Missing AI hints for ${expectation.cardId}`);

  expect(aiHints.aiSupportStatus, expectation.cardId).toBe("ai_supported");
  expectContainedValues(aiHints.roles, expectation.roles, expectation.cardId);
  expectContainedValues(
    aiHints.planRoles,
    expectation.planRoles,
    expectation.cardId,
  );
  expectContainedValues(
    aiHints.requiredMechanics,
    expectation.requiredMechanics,
    expectation.cardId,
  );
  expectContainedValues(
    aiHints.riskTags,
    expectation.riskTags,
    expectation.cardId,
  );
  expectContainedValues(
    aiHints.scenarioRefs,
    expectation.scenarioRefs,
    expectation.cardId,
  );
}

function expectContainedValues(
  actual: readonly string[],
  expected: readonly string[] | undefined,
  cardId: string,
) {
  for (const value of expected ?? []) {
    expect(actual, cardId).toContain(value);
  }
}
