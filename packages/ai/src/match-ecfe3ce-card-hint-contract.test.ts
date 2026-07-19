import { describe, expect, it } from "vitest";

import activeHints from "../../../data/ai/ai-card-hints-active.json";

type Hint = {
  cardId: string;
  roles?: string[];
  planRoles?: string[];
  requiredMechanics?: string[];
  functionSignals?: string[];
  tacticSignals?: string[];
  effects?: Array<{
    kind: string;
    timing?: string;
    scope?: string;
    resource?: string;
    amount?: number;
    target?: string;
  }>;
};

describe("match ECFE3CE card-hint contract", () => {
  it.each([["active", activeHints.cards]])(
    "keeps the five reviewed cards mechanically honest in %s hints",
    (_source, cards) => {
      const hints = cards as Hint[];
      const fang = hint(hints, "onr_v1_240_fang");
      expect(fang.roles).not.toContain("tag");
      expect(fang.planRoles).not.toContain("tag_pressure");
      expect(fang.requiredMechanics).not.toContain("add_tag");

      const allNighter = hint(hints, "onr_v1_076_all-nighter");
      expect(allNighter.requiredMechanics).not.toContain("successful_run");
      expect(
        allNighter.effects?.find((effect) => effect.target === "followup_run"),
      ).toMatchObject({ timing: "action" });

      const privateLdl = hint(hints, "onr_v1_106_private-ldl-access");
      expect(privateLdl.requiredMechanics).not.toContain("successful_rd_run");
      expect(privateLdl.effects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "access_replacement",
            scope: "hq",
            target: "hq_to_rnd_conversion",
          }),
        ]),
      );

      const bodyweight = hint(hints, "onr_v1_079_bodyweight-synthetic-blood");
      expect(bodyweight.effects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ kind: "draw", amount: 5 }),
        ]),
      );

      const tko = hint(hints, "onr_v1_271_tko-2-0");
      expect(tko.effects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "action_penalty",
            resource: "actions",
            amount: 1,
            target: "corp_ice.runner_action_loss",
          }),
        ]),
      );
    },
  );

  it("publishes TKO's action loss as a static tactic signal", () => {
    const tko = (activeHints.cards as Hint[]).find(
      (entry) => entry.cardId === "onr_v1_271_tko-2-0",
    );
    expect(tko?.functionSignals).toContain("corp_ice.runner_action_loss");
  });
});

function hint(hints: Hint[], cardId: string): Hint {
  const result = hints.find((entry) => entry.cardId === cardId);
  if (!result) throw new Error(`Missing hint: ${cardId}`);
  return result;
}
