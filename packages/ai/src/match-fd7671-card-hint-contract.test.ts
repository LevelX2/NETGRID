import { describe, expect, it } from "vitest";

import activeHints from "../../../data/ai/ai-card-hints-active.json";
import compiledHints from "../../../data/ai/ai-card-hints-compiled.json";

type Hint = {
  cardId: string;
  roles?: string[];
  planRoles?: string[];
  requiredMechanics?: string[];
  tacticSignals?: string[];
};

describe("match FD7671 card-hint contract", () => {
  it.each([
    ["active", activeHints.cards],
    ["compiled", compiledHints.cards],
  ])(
    "models Rex as trace run-lock ICE without tag semantics in %s hints",
    (_source, cards) => {
      const rex = (cards as Hint[]).find(
        (hint) => hint.cardId === "onr_v1_264_rex",
      );
      expect(rex).toBeDefined();
      expect(rex?.roles).not.toContain("tag");
      expect(rex?.planRoles).not.toContain("tag_pressure");
      expect(rex?.requiredMechanics).not.toContain("add_tag");
      expect(rex?.tacticSignals).toEqual(
        expect.arrayContaining([
          "corp_ice.conditional_end_run",
          "corp_ice.run_lock",
          "corp_ice.trace_source",
          "trace.source",
        ]),
      );
    },
  );
});
