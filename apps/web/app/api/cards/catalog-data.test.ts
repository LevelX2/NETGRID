import { describe, expect, it } from "vitest";
import { catalogDetailResponse, catalogListResponse } from "./catalog-data";

describe("catalog API filters", () => {
  it("filters by ai_supported instead of falling back to the full catalog", () => {
    const response = catalogListResponse(new URLSearchParams({ status: "ai_supported" }));

    expect(response.status).toBe(200);
    const body = response.body as { cards: Array<{ catalogCardId: string; statuses: { ai_supported: boolean } }> };
    expect(body.cards.length).toBeGreaterThan(14);
    expect(body.cards.length).toBeLessThan(412);
    expect(body.cards.every((card) => card.statuses.ai_supported)).toBe(true);
    expect(body.cards.filter((card) => card.catalogCardId.startsWith("onr_v1_")).map((card) => card.catalogCardId).sort()).toEqual([
      "onr_v1_006_black-dahlia",
      "onr_v1_014_codecracker",
      "onr_v1_015_codeslinger",
      "onr_v1_016_cyfermaster",
      "onr_v1_021_dwarf",
      "onr_v1_039_krash",
      "onr_v1_040_loony-goon",
      "onr_v1_052_raffles",
      "onr_v1_054_raptor",
      "onr_v1_060_shaka",
      "onr_v1_066_snowball",
      "onr_v1_070_tinweasel",
      "onr_v1_072_wild-card",
      "onr_v1_073_wizards-book",
      "onr_v1_074_worm",
      "onr_v1_079_bodyweight-synthetic-blood",
      "onr_v1_095_jack-n-joe",
      "onr_v1_097_livewires-contacts",
      "onr_v1_108_score",
      "onr_v1_144_tycho-mem-chip",
      "onr_v1_145_wutech-mem-chip",
      "onr_v1_146_zetatech-mem-chip",
      "onr_v1_243_fetch-4-0-1",
      "onr_v1_249_hunter",
      "onr_v1_287_datapool-by-zetatech",
      "onr_v1_293_netwatch-credit-voucher",
      "onr_v1_306_trojan-horse"
    ]);
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
});
