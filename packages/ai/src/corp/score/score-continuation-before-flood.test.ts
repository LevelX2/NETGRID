import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";

function fixture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r7-score-continuation-g14.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}
afterEach(resetResidentPlanPortfolioMemory);
describe("existing terminal score continuation before emergency agenda flood", () => {
  it("funds the current Engine-certified G14 agenda through its existing Score parent", () => {
    const cp = fixture();
    restoreAiRuntimeCheckpoint(
      cp.input,
      cp.input.ownDeckSnapshot.deckSnapshotId,
      cp.runtime,
    );
    const decision = chooseAiAction(cp.input);
    expect(decision.actionId).toBe("corp.gain_credit");
    expect(decision.reasonCode).toBe("plan_first.corp.economy");
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        expect.stringContaining("corp_onr_v1_204_ice-transmutation_2"),
      ]),
    );
    const owner = residentPlanPortfolioSnapshot(cp.input)!.instances.find(
      (i) =>
        i.moduleId === "corp.score_agenda" &&
        i.dedupeKey === "agenda:corp_onr_v1_204_ice-transmutation_2:remote_1",
    )!;
    expect(owner.moduleState).toMatchObject({
      signal: {
        terminalScore: true,
        continuationReserve: { requiredCreditsBeforeNextCorpTurn: 1 },
        fundingMilestone: { remainingGap: 1 },
      },
    });
  });
  it.each(["stale_quote", "incomplete_quote", "unfundable_quote"])(
    "keeps emergency development available without a certified current continuation: %s",
    (condition) => {
      const cp = fixture();
      const quote = cp.input.playerView.servers.find(
        (s: { id: string }) => s.id === "remote_1",
      ).root[0].scoreContinuationQuote;
      if (condition === "stale_quote") quote.expiresAtStateVersion--;
      if (condition === "incomplete_quote") {
        quote.complete = false;
        quote.reason = "not_completable_next_corp_turn";
      }
      if (condition === "unfundable_quote")
        quote.creditsRequiredBeforeNextCorpTurn = 5;
      restoreAiRuntimeCheckpoint(
        cp.input,
        cp.input.ownDeckSnapshot.deckSnapshotId,
        cp.runtime,
      );
      const decision = chooseAiAction(cp.input);
      expect(decision.actionId).toContain("corp.install_card.");
      expect(decision.reasonCode).toBe("plan_first.corp.score_agenda");
      expect(decision.fallbackUsed).toBe(false);
    },
  );
});
