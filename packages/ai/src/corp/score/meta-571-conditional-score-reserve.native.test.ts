import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
afterEach(resetResidentPlanPortfolioMemory);
function decide(name: string) {
  const f = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/" +
          name +
          ".json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.values(f.validation)).toEqual(Array(9).fill(true));
  const i = f.input;
  i.planningStateIdentity = buildPlanningStateIdentity(i);
  restoreAiRuntimeCheckpoint(i, i.ownDeckSnapshot!.deckSnapshotId, f.runtime);
  const before = JSON.stringify(i),
    d = chooseAiAction(i);
  expect(JSON.stringify(i)).toBe(before);
  expect(d).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
  expect(i.legalActions.some((a) => a.actionId === d.actionId)).toBe(true);
  return {
    input: i,
    decision: d,
    portfolio: residentPlanPortfolioSnapshot(i)!,
  };
}
it("preserves the terminal central rez claim through the actual conditional score balance", () => {
  const { input, decision, portfolio } = decide(
    "cp-meta571-r2-g39-conditional-score-reserve",
  );
  const original =
    "corp.install_card.corp_onr_v1_196_corporate-war_1.remote_1.corp_onr_v1_196_corporate-war_1";
  expect(decision.actionId).not.toBe(original);
  const project = portfolio.instances.find(
    (p) =>
      p.instanceId ===
      "plan:corp.score_agenda:agenda%3Acorp_onr_v1_196_corporate-war_1%3Aremote_1",
  );
  expect(project?.moduleState).toMatchObject({
    signal: {
      feasible: false,
      routeAssessment: "corp_same_turn_score_consumes_funded_defense_reserve",
    },
  });
  expect(input.playerView.own.credits).toBe(15);
});
it.each([
  ["cp-meta571-r2-g7-terminal-war", "corp_onr_v1_196_corporate-war_1"],
  ["cp-meta571-r2-g6-funded-war", "corp_onr_v1_196_corporate-war_3"],
])("retains safe and terminal score routes in %s", (name, source) => {
  const { input, decision } = decide(name);
  expect(
    input.legalActions.find((a) => a.actionId === decision.actionId),
  ).toMatchObject({ type: "install_card", source });
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("corp.score_agenda");
});
