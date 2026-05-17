import { describe, expect, it } from "vitest";
import {
  activeAiApprovedCardIds,
  PROTEUS_VISIBLE_BASELINE_CARD_IDS,
} from "@netgrid/catalog";
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
    title: "exposes late-core remote-contest program hints",
    cardId: "onr_v1_019_dropp",
    roles: ["program"],
    planRoles: ["contest_remote"],
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
    expect(body.cards.length).toBeLessThan(412);
    expect(body.cards.every((card) => card.statuses.ai_supported)).toBe(true);
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
    expect(body.cards.map((card) => card.catalogCardId)).not.toEqual(
      expect.arrayContaining([...PROTEUS_VISIBLE_BASELINE_CARD_IDS]),
    );
  });

  it("guards the Proteus visible baseline against decklegal, AI or broad promotion", () => {
    const [candidateId] = PROTEUS_VISIBLE_BASELINE_CARD_IDS;
    expect(candidateId).toBeDefined();
    if (!candidateId) throw new Error("Missing Proteus visible baseline card");
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
        deck_legal: false,
        format_legal: false,
        ai_supported: false,
        blocked: false,
      },
      aiHints: null,
    });

    const humanPlayableResponse = catalogListResponse(
      new URLSearchParams({ status: "human_playable", q: "Toughonium" }),
    );
    expect(humanPlayableResponse.status).toBe(200);
    const humanPlayableBody = humanPlayableResponse.body as {
      cards: Array<{ catalogCardId: string }>;
    };
    expect(humanPlayableBody.cards.map((card) => card.catalogCardId)).toEqual([
      candidateId,
    ]);

    for (const status of ["deck_legal", "format_legal", "ai_supported"] as const) {
      const response = catalogListResponse(
        new URLSearchParams({ status, q: "Toughonium" }),
      );
      expect(response.status).toBe(200);
      const body = response.body as { cards: Array<{ catalogCardId: string }> };
      expect(body.cards).toEqual([]);
    }

    const outsideResponse = catalogDetailResponse(
      "onr_proteus_031_minotaur",
    );
    expect(outsideResponse.status).toBe(200);
    const outsideBody = outsideResponse.body as {
      card: {
        statuses: {
          human_playable: boolean;
          deck_legal: boolean;
          ai_supported: boolean;
          blocked: boolean;
        };
      };
    };
    expect(outsideBody.card.statuses).toMatchObject({
      human_playable: false,
      deck_legal: false,
      ai_supported: false,
      blocked: true,
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
