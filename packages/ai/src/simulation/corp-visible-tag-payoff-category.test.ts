import { describe, expect, it, vi } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { CorpPunishKind } from "../runtime/corp-tag-punish-types";
import { createCorpVisibleTagPayoffCategoryContext } from "./corp-visible-tag-payoff-category";

describe("createCorpVisibleTagPayoffCategoryContext", () => {
  it("matches payoff roles by bounded role terms", () => {
    expect(categoryFor(["run_lock"])).toBe("run_lock");
    expect(categoryFor(["access_ambush"])).toBe("ambush");
    expect(categoryFor(["run_locksmith_noise"])).toBe("unknown");
    expect(categoryFor(["ambusher_noise"])).toBe("unknown");
  });

  it("does not classify a foreign-side action", () => {
    const rolesForAction = vi.fn(() => ["run_lock"]);
    const category = createCorpVisibleTagPayoffCategoryContext({
      tagPunishAssessmentForAction: () => undefined,
      rolesForAction,
    }).corpVisibleTagPayoffCategoryForAction(
      { side: "corp" } as AiDecisionInput,
      { side: "runner" } as LegalAction,
      "unknown" as CorpPunishKind,
    );

    expect(category).toBe("unknown");
    expect(rolesForAction).not.toHaveBeenCalled();
  });
});

function categoryFor(roles: string[]) {
  return createCorpVisibleTagPayoffCategoryContext({
    tagPunishAssessmentForAction: () => undefined,
    rolesForAction: () => roles,
  }).corpVisibleTagPayoffCategoryForAction(
    { side: "corp" } as AiDecisionInput,
    { side: "corp" } as LegalAction,
    "unknown" as CorpPunishKind,
  );
}
