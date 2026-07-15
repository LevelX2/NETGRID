import type { VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import activeHints from "../../../data/ai/ai-card-hints-active.json";
import compiledHints from "../../../data/ai/ai-card-hints-compiled.json";
import inspectorIndex from "../../../data/ai/ai-hint-inspector-index.json";
import { createAiHintsByCard } from "./ai-hints";
import { buildCorpIceCardPlacementProfile } from "./runtime/corp-ice-placement/corp-ice-placement";

type Hint = {
  cardId: string;
  roles?: string[];
  planRoles?: string[];
  requiredMechanics?: string[];
  tacticSignals?: string[];
  strategySupportPairs?: Array<{ strategyId: string }>;
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
      expect(rex?.requiredMechanics).toContain("end_the_run");
      expect(rex?.tacticSignals).toEqual(
        expect.arrayContaining([
          "corp_ice.conditional_end_run",
          "corp_ice.run_lock",
          "corp_ice.trace_source",
          "trace.source",
        ]),
      );
      expect(rex?.strategySupportPairs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ strategyId: "corp.ice_tax_glacier" }),
        ]),
      );
      expect(rex?.strategySupportPairs).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ strategyId: "corp.tag_trace_punish" }),
        ]),
      );
    },
  );

  it("preserves Rex run-lock defense through compiled runtime consumers", () => {
    const runtimeHint = createAiHintsByCard().get("onr_v1_264_rex");
    expect(runtimeHint?.roles).toEqual(["ice", "trace"]);
    expect(runtimeHint?.planRoles).toEqual(["defend_server"]);

    const profile = buildCorpIceCardPlacementProfile({
      instanceId: "rex-consumer-contract",
      definitionId: "onr_v1_264_rex",
      known: true,
      title: "Rex",
      type: "ice",
      rulesText:
        "Trace 3 - If trace is successful, end the run, and Runner cannot run again until Runner takes an action to pay 2 credits.",
    } satisfies VisibleCard);
    expect(profile).toMatchObject({
      immediateStop: true,
      tagTrace: true,
      runLock: true,
      damage: false,
    });

    const rexInspector = inspectorIndex.cards.find(
      (entry) => entry.cardId === "onr_v1_264_rex",
    );
    expect(rexInspector?.derivedStrategyAnchors).toContain(
      "corp.ice_tax_glacier",
    );
    expect(rexInspector?.planRolesClassification).toEqual([
      expect.objectContaining({ value: "defend_server" }),
    ]);
  });
});
