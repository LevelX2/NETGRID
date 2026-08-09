import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { AI_HINTS_BY_CARD } from "./ai-hints";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

function readJson(relativePath: string): any {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function hintById() {
  return AI_HINTS_BY_CARD;
}

describe("AI card hint full-inventory closeout", () => {
  it("closes every active quality review marker", () => {
    const hints = [...hintById().values()];

    expect(hints).toHaveLength(618);
    expect(hints.filter((hint) => hint.quality?.hintReviewed !== true)).toEqual(
      [],
    );
    expect(
      hints.filter((hint) => hint.quality?.needsHumanReview === true),
    ).toEqual([]);
  });

  it("keeps synthetic fixtures free of unrelated strategy roles", () => {
    const hints = hintById();
    const plans = (cardId: string) => hints.get(cardId)?.planRoles;

    expect(plans("corp_identity_001")).toEqual([]);
    expect(plans("runner_identity_001")).toEqual([]);
    expect(plans("simple_run_event")).toEqual([]);
    expect(plans("v08_overclock_run_event")).toEqual(["recover_economy"]);
    expect(plans("simple_setup_hardware")).toEqual([]);
    expect(plans("v08_memory_chip")).toEqual([]);
    expect(plans("simple_draw_operation")).toEqual(["draw_for_answers"]);
    expect(plans("v08_archive_planning_operation")).toEqual([
      "draw_for_answers",
    ]);
    expect(plans("simple_tag_punishment_operation")).toEqual([
      "punish_tagged_runner",
    ]);
    expect(plans("simple_upgrade")).toEqual([]);
  });

  it("contains neither deprecated aliases nor unclassified singleton noise", () => {
    const hints = [...hintById().values()];
    const roleContract = readJson("data/ai/ai-hint-role-contract-v1.json");
    const deprecated = new Set([
      ...Object.keys(roleContract.roleAliases),
      ...Object.keys(roleContract.planRoleAliases),
    ]);
    const presentDeprecated = hints.flatMap((hint) =>
      [...hint.roles, ...hint.planRoles].filter((value) =>
        deprecated.has(value),
      ),
    );
    const qualityReport = readJson(
      "docs/reviews/ai/ai-hint-quality-gate-report-2026-05-25.json",
    );

    expect(presentDeprecated).toEqual([]);
    expect(qualityReport.errorCount).toBe(0);
    expect(qualityReport.warningCount).toBe(0);
  });
});
