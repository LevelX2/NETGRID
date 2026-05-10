import { describe, expect, it } from "vitest";
import {
  DECK_LEGAL_AI_APPROVAL_BATCH_A_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_CORP_TAG_SLICE_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_LEGACY_OPEN64_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V190_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V191_TO_V194_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V161_TO_V170_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V171_TO_V181_OPEN64_CARD_IDS,
  KING_OF_THE_ROAD_AI_APPROVED_CARD_IDS
} from "@netgrid/catalog";
import { catalogDetailResponse, catalogListResponse } from "./catalog-data";

describe("catalog API filters", () => {
  it("filters by ai_supported instead of falling back to the full catalog", () => {
    const response = catalogListResponse(new URLSearchParams({ status: "ai_supported" }));

    expect(response.status).toBe(200);
    const body = response.body as { cards: Array<{ catalogCardId: string; statuses: { ai_supported: boolean } }> };
    expect(body.cards.length).toBeGreaterThan(14);
    expect(body.cards.length).toBeLessThan(412);
    expect(body.cards.every((card) => card.statuses.ai_supported)).toBe(true);
    const expectedOnrAiApproved = [
      ...KING_OF_THE_ROAD_AI_APPROVED_CARD_IDS,
      ...DECK_LEGAL_AI_APPROVAL_BATCH_A_CARD_IDS,
      ...DECK_LEGAL_AI_APPROVAL_CORP_TAG_SLICE_CARD_IDS,
      ...DECK_LEGAL_AI_APPROVAL_V161_TO_V170_CARD_IDS,
      ...DECK_LEGAL_AI_APPROVAL_V171_TO_V181_OPEN64_CARD_IDS,
      ...DECK_LEGAL_AI_APPROVAL_LEGACY_OPEN64_CARD_IDS,
      ...DECK_LEGAL_AI_APPROVAL_V190_CARD_IDS,
      ...DECK_LEGAL_AI_APPROVAL_V191_TO_V194_CARD_IDS
    ].filter((cardId) => cardId.startsWith("onr_v1_"));
    expect(body.cards.filter((card) => card.catalogCardId.startsWith("onr_v1_")).map((card) => card.catalogCardId).sort()).toEqual(
      [...new Set(expectedOnrAiApproved)].sort()
    );
  });

  it("adds curated AI hints to card detail responses when available", () => {
    const response = catalogDetailResponse("onr_v1_006_black-dahlia");

    expect(response.status).toBe(200);
    const body = response.body as {
      card: {
        aiHints: {
          roles: string[];
          planRoles: string[];
          aiSupportStatus: string;
          scenarioRefs: string[];
        } | null;
      };
    };
    expect(body.card.aiHints?.roles).toContain("breaker_killer");
    expect(body.card.aiHints?.planRoles).toContain("build_rig");
    expect(body.card.aiHints?.aiSupportStatus).toBe("ai_supported");
    expect(body.card.aiHints?.scenarioRefs).toContain("data/scenarios/ai-kotr-runner-approval-smokes.json#build_rig");
  });

  it("adds Batch A AI-approved hints for newly approved runner rig cards", () => {
    const response = catalogDetailResponse("onr_v1_014_codecracker");

    expect(response.status).toBe(200);
    const body = response.body as {
      card: {
        aiHints: {
          roles: string[];
          planRoles: string[];
          aiSupportStatus: string;
          riskTags: string[];
          scenarioRefs: string[];
        } | null;
      };
    };
    expect(body.card.aiHints?.roles).toContain("breaker_decoder");
    expect(body.card.aiHints?.planRoles).toContain("build_rig");
    expect(body.card.aiHints?.aiSupportStatus).toBe("ai_supported");
    expect(body.card.aiHints?.riskTags).toContain("credit_reserve");
    expect(body.card.aiHints?.scenarioRefs).toContain("data/scenarios/ai-runner-rig-low-risk-batch-a-smokes.json#safe_probe_run");
  });

  it("adds Corp Tag slice AI hints for newly approved Corp tag cards", () => {
    const response = catalogDetailResponse("onr_v1_293_netwatch-credit-voucher");

    expect(response.status).toBe(200);
    const body = response.body as {
      card: {
        aiHints: {
          roles: string[];
          planRoles: string[];
          aiSupportStatus: string;
          scenarioRefs: string[];
        } | null;
      };
    };
    expect(body.card.aiHints?.roles).toContain("tag_punishment");
    expect(body.card.aiHints?.planRoles).toContain("recover_economy");
    expect(body.card.aiHints?.aiSupportStatus).toBe("ai_supported");
    expect(body.card.aiHints?.scenarioRefs).toContain("data/scenarios/ai-corp-tag-approval-slice-smokes.json#tag_operation_punish_visible_tag");
  });

  it("adds Corp Tag slice AI hints for unreleased trace/tag approvals", () => {
    const response = catalogDetailResponse("onr_v1_306_trojan-horse");

    expect(response.status).toBe(200);
    const body = response.body as {
      card: {
        aiHints: {
          roles: string[];
          planRoles: string[];
          aiSupportStatus: string;
          scenarioRefs: string[];
        } | null;
      };
    };
    expect(body.card.aiHints?.roles).toContain("tag_enabler");
    expect(body.card.aiHints?.planRoles).toContain("recover_economy");
    expect(body.card.aiHints?.aiSupportStatus).toBe("ai_supported");
    expect(body.card.aiHints?.scenarioRefs).toContain("data/scenarios/ai-corp-tag-approval-slice-smokes.json#trojan_horse_after_agenda_theft");
  });

  it("adds Open64 AI hints for newly approved V1.8.x run-event pressure cards", () => {
    const response = catalogDetailResponse("onr_v1_094_inside-job");

    expect(response.status).toBe(200);
    const body = response.body as {
      card: {
        aiHints: {
          roles: string[];
          planRoles: string[];
          aiSupportStatus: string;
          scenarioRefs: string[];
        } | null;
      };
    };
    expect(body.card.aiHints?.roles).toContain("run_event");
    expect(body.card.aiHints?.planRoles).toContain("pressure_hq");
    expect(body.card.aiHints?.aiSupportStatus).toBe("ai_supported");
    expect(body.card.aiHints?.scenarioRefs).toContain("data/scenarios/ai-deck-legal-v171-v181-open64-smokes.json#runner_run_event_pressure");
  });

  it("adds V1.9.0 AI hints for newly approved random-breaker release cards", () => {
    const response = catalogDetailResponse("onr_v1_007_blink");

    expect(response.status).toBe(200);
    const body = response.body as {
      card: {
        aiHints: {
          roles: string[];
          planRoles: string[];
          aiSupportStatus: string;
          scenarioRefs: string[];
        } | null;
      };
    };
    expect(body.card.aiHints?.roles).toContain("random_breaker");
    expect(body.card.aiHints?.planRoles).toContain("safe_probe_run");
    expect(body.card.aiHints?.aiSupportStatus).toBe("ai_supported");
    expect(body.card.aiHints?.scenarioRefs).toContain("data/scenarios/ai-deck-legal-v190-smokes.json#runner_v190_random_breakers_and_black_ops_punish");
  });

  it("adds V1.9.1-V1.9.4 AI hints for newly approved run-bonus cards", () => {
    const response = catalogDetailResponse("onr_v1_076_all-nighter");

    expect(response.status).toBe(200);
    const body = response.body as {
      card: {
        aiHints: {
          roles: string[];
          planRoles: string[];
          aiSupportStatus: string;
          scenarioRefs: string[];
        } | null;
      };
    };
    expect(body.card.aiHints?.roles).toContain("bonus_run");
    expect(body.card.aiHints?.planRoles).toContain("pressure_rnd");
    expect(body.card.aiHints?.aiSupportStatus).toBe("ai_supported");
    expect(body.card.aiHints?.scenarioRefs).toContain("data/scenarios/ai-deck-legal-v191-v194-smokes.json#runner_v192_run_events_and_resource_lifecycle");
  });
});
