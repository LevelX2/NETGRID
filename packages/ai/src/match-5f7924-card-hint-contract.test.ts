import { describe, expect, it } from "vitest";

import generatedArtifact from "../../../data/ai/card-spec-ai-hints-generated.json";

describe("match 5F7924 card-hint contracts", () => {
  it("models Marked Accounts as an access-triggered tag source", () => {
    const hint = generatedArtifact.cards.find(
      (record) => record.cardId === "onr_proteus_005_marked-accounts",
    )?.hint;

    expect(hint?.strategySupportPairs).toContainEqual(
      expect.objectContaining({
        strategyId: "corp.tag_trace_punish",
        roleDetail: "access_tag_source",
        evidence: expect.arrayContaining([
          "access.corp_tag_ambush",
          "tag.corp_access_tag_source",
        ]),
      }),
    );
    expect(hint?.actionStrategySupportPairs).toContainEqual(
      expect.objectContaining({
        strategyId: "corp.tag_trace_punish",
        roleDetail: "anchor_evidence_tag_source",
        evidence: ["tactic_signal_anchor:tag.source"],
      }),
    );
    expect(hint?.requiredMechanics).toEqual(
      expect.arrayContaining(["accessEffects", "add_tags", "on_access"]),
    );
  });
});
