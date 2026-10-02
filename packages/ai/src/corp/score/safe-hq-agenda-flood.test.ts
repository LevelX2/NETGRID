import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { buildAiDecisionInputDto } from "../../input-dto";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { allocateCorpCentralDefenseFromAiFacts } from "../defense/corp-central-defense-facts-adapter";

afterEach(resetResidentPlanPortfolioMemory);

it("keeps an agenda flood behind safe HQ protection instead of exposing unfunded remotes", () => {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-473-r2-g3-d355.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(cp.validation).every((value) => value === true)).toBe(
    true,
  );
  const input: AiDecisionInputWithDeckCapabilities = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  };
  expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
  expect(input.playerView.own.credits).toBe(0);
  expect(input.playerView.own.stackOrRdCount).toBe(6);
  expect(
    input.playerView.own.gripOrHq.filter((card) => card.type === "agenda"),
  ).toHaveLength(5);
  const allocation = allocateCorpCentralDefenseFromAiFacts({ input });
  expect(allocation).toMatchObject({
    status: "known",
    evidence: { hq: { expectedAgendaLoss: { numerator: 0 } } },
  });
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const funding = input.legalActions.find(
    (action) => action.type === "gain_credit",
  )!;
  const result = chooseAiAction(input);
  expect(result.fallbackUsed).toBe(false);
  expect(result.actionId).toBe(funding.actionId);
  expect(result.reasonCode).toBe("plan_first.corp.economy");
  const plan = result.decisionDebug?.planFirstDecision;
  expect(plan?.leafExecutorInstanceId).toMatch(/^plan:corp\.economy:/);
  expect(plan?.route).toMatchObject({
    actionId: funding.actionId,
    stateVersion: input.playerView.stateVersion,
  });
  expect(result.evidence!.some((e) => e.startsWith("plan_step_id:"))).toBe(
    true,
  );
});
