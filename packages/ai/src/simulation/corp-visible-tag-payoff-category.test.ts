import { describe, expect, it } from "vitest";
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
});

function categoryFor(roles: string[]) {
  return createCorpVisibleTagPayoffCategoryContext({
    tagPunishAssessmentForAction: () => undefined,
    rolesForAction: () => roles,
  }).corpVisibleTagPayoffCategoryForAction(
    {} as AiDecisionInput,
    {} as LegalAction,
    "unknown" as CorpPunishKind,
  );
}
