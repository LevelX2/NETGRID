import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { GameState } from "@netgrid/shared";
import { getLegalActions, hashGameState } from "../../index";
import { quoteCorpRootRezDiscountedIce } from "./root-rez-discounted-ice-quote";

function original() {
  const { state } = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta557-root-discount-original.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as { state: GameState };
  const root = getLegalActions(state, "corp").find(
    (a) => a.type === "rez_card",
  )!;
  return { state, root };
}

describe("current pure root-rez discounted ICE quote boundaries", () => {
  it.each([
    "paid_source",
    "source_used",
    "source_rezzed",
    "ice_rezzed",
    "other_fort",
    "no_run",
    "unfunded",
    "bypass",
    "variable",
    "stale",
  ])("does not certify unsupported preparation: %s", (kind) => {
    const { state, root } = original();
    const source = state.cardInstances[root.source!]!;
    const ice = state.cardInstances[state.run!.approachedIceId!]!;
    if (kind === "paid_source") root.costs = [{ credits: 1 }];
    if (kind === "source_used")
      state.run!.discountedRezUsedSourceIdsThisRun = [source.instanceId];
    if (kind === "source_rezzed") source.rezzed = true;
    if (kind === "ice_rezzed") ice.rezzed = true;
    if (kind === "other_fort") state.run!.attackedServerId = "hq";
    if (kind === "no_run") delete state.run;
    if (kind === "unfunded") state.corp.credits = 2;
    if (kind === "bypass") state.run!.bypassFirstIceRemaining = true;
    if (kind === "variable") ice.definitionId = "onr_proteus_023_galatea";
    if (kind === "stale") root.expiresAtStateVersion--;
    const before = hashGameState(state);
    expect(quoteCorpRootRezDiscountedIce(state, root)).toBeUndefined();
    expect(hashGameState(state)).toBe(before);
  });
});
