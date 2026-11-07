import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { allocateCorpCentralDefenseFromAiFacts } from "../defense/corp-central-defense-facts-adapter";
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
  it("funds a nonterminal installed agenda that can score this turn before opening new flood targets", () => {
    const cp = JSON.parse(
      readFileSync(
        new URL(
          "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r12-score-continuation-g40.json",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    restoreAiRuntimeCheckpoint(
      cp.input,
      cp.input.ownDeckSnapshot.deckSnapshotId,
      cp.runtime,
    );
    const decision = chooseAiAction(cp.input);
    expect(decision.actionId).toBe("corp.gain_credit");
    expect(decision.reasonCode).toBe("plan_first.corp.economy");
    expect(decision.fallbackUsed).toBe(false);
    const portfolio = residentPlanPortfolioSnapshot(cp.input)!;
    const score = portfolio.instances.find(
      (i) =>
        i.moduleId === "corp.score_agenda" &&
        i.dedupeKey ===
          "agenda:corp_onr_v1_188_ai-chief-financial-officer_1:remote_1",
    )!;
    expect(score.moduleState).toMatchObject({
      signal: {
        terminalScore: false,
        sameTurnCloseout: true,
        fundingGap: 1,
        conversion: { remainingAdvancementClicks: 1, remainingScoreCredits: 1 },
      },
    });
    const support = portfolio.instances.find(
      (i) => i.instanceId === portfolio.executorInstanceId,
    )!;
    expect(support.moduleId).toBe("corp.economy");
    expect(support.parentInstanceId).toBe(score.instanceId);
  });
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
  it("keeps emergency development available when nonterminal funding and advancement no longer fit this turn", () => {
    const cp = JSON.parse(
      readFileSync(
        new URL(
          "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r12-score-continuation-g40.json",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    cp.input.playerView.own.clicks = 1;
    restoreAiRuntimeCheckpoint(
      cp.input,
      cp.input.ownDeckSnapshot.deckSnapshotId,
      cp.runtime,
    );
    const decision = chooseAiAction(cp.input);
    expect(decision.actionId).toBe("corp.gain_credit");
    expect(decision.reasonCode).toBe("plan_first.corp.economy");
    expect(decision.fallbackUsed).toBe(false);
    const portfolio = residentPlanPortfolioSnapshot(cp.input)!;
    const root = portfolio.instances.find(
      (instance) => instance.instanceId === portfolio.rootForegroundInstanceId,
    )!;
    // Emergency development remains admitted under the new agenda. Its
    // current multi-turn funding head precedes installation at zero credits.
    expect(root.moduleState).toMatchObject({
      signal: {
        projectId: "agenda:corp_onr_v1_220_tycho-extension_1:new_remote",
        phase: "install_agenda",
        feasible: true,
        routeAssessment: "corp_deckout_agenda_flood_score_install",
        fundingMilestone: { targetCredits: 4, deadline: "multi_turn" },
      },
    });
    expect(
      portfolio.instances.find(
        (instance) => instance.instanceId === portfolio.executorInstanceId,
      )?.parentInstanceId,
    ).toBe(root.instanceId);
  });
  it.each(
    ["stale_quote", "incomplete_quote", "unfundable_quote"].flatMap(
      (condition) => ["protected", "exposed"].map((hq) => ({ condition, hq })),
    ),
  )(
    "uses HQ protection when continuation is $condition and HQ is $hq",
    ({ condition, hq }) => {
      const cp = fixture();
      // At zero credits, unrezzed positive-cost HQ ICE leaves the agendas
      // exposed. This keeps the deck population and remote-install costs intact.
      if (hq === "exposed")
        cp.input.playerView.servers
          .find((server: { id: string }) => server.id === "hq")
          .ice.forEach((card: { rezzed: boolean }) => {
            card.rezzed = false;
          });
      const allocation = allocateCorpCentralDefenseFromAiFacts({
        input: cp.input,
      });
      expect(allocation.status).toBe("known");
      if (allocation.status === "known")
        expect(allocation.evidence.hq.expectedAgendaLoss.numerator > 0).toBe(
          hq === "exposed",
        );
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
      expect(decision.actionId).toBe("corp.gain_credit");
      expect(decision.reasonCode).toBe("plan_first.corp.economy");
      if (hq === "exposed") {
        const portfolio = residentPlanPortfolioSnapshot(cp.input)!;
        const root = portfolio.instances.find(
          (instance) =>
            instance.instanceId === portfolio.rootForegroundInstanceId,
        )!;
        // The invalid installed continuation cannot own this funding. The
        // separate HQ-agenda escape project retains its real multi-turn need.
        expect(root.moduleState).toMatchObject({
          signal: {
            projectId: "agenda:corp_onr_v1_204_ice-transmutation_3:remote_2",
            routeAssessment: "corp_deckout_agenda_flood_score_install",
            fundingMilestone: { deadline: "multi_turn", targetCredits: 5 },
          },
        });
        expect(
          portfolio.instances.find(
            (instance) => instance.instanceId === portfolio.executorInstanceId,
          )?.parentInstanceId,
        ).toBe(root.instanceId);
      }
      expect(decision.fallbackUsed).toBe(false);
    },
  );
});
