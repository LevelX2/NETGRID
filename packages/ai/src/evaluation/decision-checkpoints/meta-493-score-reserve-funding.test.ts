import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { withCorpSameTurnScoreDefenseReserve } from "../../corp/score/score-reserve-restoration";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";

afterEach(resetResidentPlanPortfolioMemory);
function checkpoint() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-493-r6-g8-d86.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
}
function decide(cp: ReturnType<typeof checkpoint>) {
  restoreAiRuntimeCheckpoint(
    cp.input,
    cp.input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const before = JSON.stringify([cp.input.playerView, cp.input.legalActions]);
  const result = chooseAiAction(cp.input);
  expect(result.fallbackUsed).toBe(false);
  expect(
    cp.input.legalActions.some(
      (a) =>
        a.actionId === result.actionId &&
        a.expiresAtStateVersion === cp.input.playerView.stateVersion,
    ),
  ).toBe(true);
  expect(JSON.stringify([cp.input.playerView, cp.input.legalActions])).toBe(
    before,
  );
  return result;
}
it("funds the installed same-turn score and funded central reserve jointly under the same Score parent", () => {
  const cp = checkpoint();
  expect(cp.input.playerView.own).toMatchObject({ credits: 6, clicks: 3 });
  const r = decide(cp);
  expect(r.actionId).toBe("corp.gain_credit");
  const p = r.decisionDebug!.planFirstDecision!;
  expect(p.selectedPlan?.moduleId).toBe("corp.economy");
  expect(p.rootPlanInstanceId).toContain(
    "plan:corp.score_agenda:agenda%3Acorp_onr_v1_193_corporate-coup_1%3Aremote_1",
  );
  expect(p.selectedStep?.planInstanceId).toBe(p.leafExecutorInstanceId);
});
it("keeps the current advance when the entire score already leaves the funded reserve", () => {
  const cp = checkpoint();
  cp.input.playerView.own.credits = 7;
  const r = decide(cp);
  expect(r.actionId).toBe(
    "corp.advance_card.corp_onr_v1_193_corporate-coup_1.corp_onr_v1_193_corporate-coup_1",
  );
  expect(r.decisionDebug!.planFirstDecision!.selectedPlan?.moduleId).toBe(
    "corp.score_agenda",
  );
});
it("does not promise joint funding when there is no spare current click", () => {
  const cp = checkpoint();
  cp.input.playerView.own.clicks = 2;
  decide(cp);
  const score = residentPlanPortfolioSnapshot(cp.input)!.instances.find(
    (p) =>
      p.moduleId === "corp.score_agenda" &&
      (p.moduleState as { signal: CorpScoreProjectSignal }).signal
        .agendaDefinitionId === "onr_v1_193_corporate-coup",
  )!;
  expect(
    (score.moduleState as { signal: CorpScoreProjectSignal }).signal,
  ).toMatchObject({
    feasible: false,
    routeAssessment: "corp_same_turn_score_consumes_funded_defense_reserve",
  });
});
it("keeps the terminal own score ahead of the joint reserve funding", () => {
  const cp = checkpoint();
  cp.input.playerView.own.agendaPoints = 5;
  const r = decide(cp);
  expect(r.actionId).toBe(
    "corp.advance_card.corp_onr_v1_193_corporate-coup_1.corp_onr_v1_193_corporate-coup_1",
  );
  expect(r.decisionDebug!.planFirstDecision!.priority?.effectiveClass).toBe(
    "P1",
  );
});
it.each(["missing", "stale", "zero_click"] as const)(
  "does not certify a %s basic-credit prefix",
  (variant) => {
    const cp = checkpoint();
    if (variant === "missing")
      cp.input.legalActions = cp.input.legalActions.filter(
        (a) => a.actionId !== "corp.gain_credit",
      );
    else {
      const basic = cp.input.legalActions.find(
        (a) => a.actionId === "corp.gain_credit",
      )!;
      if (variant === "stale") basic.expiresAtStateVersion--;
      else basic.costs = [{ clicks: 0 }];
    }
    const signal: CorpScoreProjectSignal = {
      projectId: "agenda:corp_onr_v1_193_corporate-coup_1:remote_1",
      agendaDefinitionId: "onr_v1_193_corporate-coup",
      agendaInstanceId: "corp_onr_v1_193_corporate-coup_1",
      agendaPoints: 2,
      serverId: "remote_1",
      phase: "advance_agenda",
      feasible: true,
      terminalScore: false,
      sameTurnCloseout: true,
      sameTurnConversionProof: "engine_quoted_path",
      sameTurnConversionResourceCost: {
        stateVersion: cp.input.playerView.stateVersion,
        credits: 2,
        clicks: 2,
      },
      evidenceCode: "native_installed_coup_cost",
    };
    expect(withCorpSameTurnScoreDefenseReserve(cp.input, signal)).toMatchObject(
      {
        feasible: false,
        routeAssessment: "corp_same_turn_score_consumes_funded_defense_reserve",
      },
    );
  },
);
