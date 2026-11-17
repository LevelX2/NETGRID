import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { CardDefinitionId } from "@netgrid/shared";

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

    expect(hints.length).toBeGreaterThanOrEqual(618);
    expect(hints.filter((hint) => hint.quality?.hintReviewed !== true)).toEqual(
      [],
    );
    expect(
      hints.filter((hint) => hint.quality?.needsHumanReview === true),
    ).toEqual([]);
  });

  it("keeps synthetic fixtures free of unrelated strategy roles", () => {
    const hints = hintById();
    const plans = (cardId: CardDefinitionId) => hints.get(cardId)?.planRoles;

    expect(plans(3)).toEqual([]);
    expect(plans(587)).toEqual([]);
    expect(plans(600)).toEqual([]);
    expect(plans(615)).toEqual(["recover_economy"]);
    expect(plans(602)).toEqual([]);
    expect(plans(614)).toEqual([]);
    expect(plans(593)).toEqual([
      "draw_for_answers",
      "setup",
    ]);
    expect(plans(608)).toEqual([
      "draw_for_answers",
      "setup",
    ]);
    expect(plans(604)).toEqual([
      "punish_tagged_runner",
    ]);
    expect(plans(606)).toEqual([]);
  });

  it("contains neither deprecated aliases nor stale review dependencies", () => {
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

    expect(presentDeprecated).toEqual([]);
  });
});
