import { describe, expect, it } from "vitest";

import accountsBeforeDefenseDrawJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-0c77a1fb-02-accounts-before-defense-draw-d5.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 0c77a1fb Corp hand-utilization checkpoints", () => {
  it("converts Accounts Receivable instead of spending the last click on a speculative defense draw", () => {
    const result = runAiDecisionCheckpoint(
      accountsBeforeDefenseDrawJson as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    const inventory = result.decision?.decisionDebug?.detailSections?.find(
      (section) => section.id === "corp_hand_inventory",
    );
    expect(inventory?.items).toEqual(
      expect.arrayContaining([
        "authority:diagnostic_only",
        "selection_influence:none",
      ]),
    );
    for (const definitionId of [
      "onr_proteus_007_project-venice",
      "onr_v1_281_accounts-receivable",
      "onr_v1_290_efficiency-experts",
      "onr_v1_340_setup",
    ]) {
      const record = inventory?.items.find((item) =>
        item.includes(`definition:${definitionId}`),
      );
      expect(record, `Missing inventory record for ${definitionId}`).toContain(
        "|claims:",
      );
      expect(record).not.toContain("|claims:none|dispositions:none");
    }
  });
});
