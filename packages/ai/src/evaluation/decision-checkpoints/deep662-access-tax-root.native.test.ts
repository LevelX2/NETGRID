import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { corpRootRezTimingComponent } from "../../runtime/corp-scoreline/semantic-runtime-corp-score-ice-components";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);
function native() {
  const fixture = JSON.parse(
    readFileSync(
      new URL("./fixtures/deep662-d257-access-tax-root.json", import.meta.url),
      "utf8",
    ),
  );
  const cp = fixture.checkpoint;
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input: AiDecisionInputWithDeckCapabilities = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const action = input.legalActions.find((a) => a.type === "rez_card")!;
  const source = input.playerView.servers
    .find((s) => s.id === "hq")!
    .root.find((c) => c.instanceId === action.source)!;
  return { input, action, source };
}
it("binds the latest access-tax rez to the real HQ destination of the Archives run", () => {
  const { input, action } = native();
  const before = JSON.stringify({
    view: input.playerView,
    legal: input.legalActions,
  });
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(action.actionId);
  const plan = decision.decisionDebug!.planFirstDecision!;
  expect(plan.rootPlanInstanceId).toBe(
    "plan:corp.defend_servers:server-defense-portfolio",
  );
  expect(plan.leafExecutorInstanceId).toBe(plan.rootPlanInstanceId);
  expect(plan.route).toMatchObject({
    actionId: action.actionId,
    stateVersion: 256,
  });
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
  expect(
    JSON.stringify({ view: input.playerView, legal: input.legalActions }),
  ).toBe(before);
});
it("certifies the latest window using the native public destination", () => {
  const { input, action, source } = native();
  expect(corpRootRezTimingComponent(input, action, source)).toMatchObject({
    key: "corp_root_rez_latest_relevant_window",
    value: 1600,
  });
});
it("does not infer a destination when the public override is absent", () => {
  const { input, action, source } = native();
  delete input.playerView.run!.accessServerOverride;
  expect(corpRootRezTimingComponent(input, action, source)).toMatchObject({
    key: "corp_root_rez_defer_until_relevant_run",
  });
});
it("keeps a tax on another access fort outside the current window", () => {
  const { input, action, source } = native();
  input.playerView.run!.accessServerOverride = "rd";
  expect(corpRootRezTimingComponent(input, action, source)).toMatchObject({
    key: "corp_root_rez_defer_until_relevant_run",
  });
});
it("uses a resolved breach destination before the earlier override", () => {
  const { input, action, source } = native();
  input.playerView.run!.accessServerOverride = "rd";
  input.playerView.run!.breach = {
    breachId: "explicit-companion",
    serverId: "hq",
    currentIndex: 0,
    remainingCount: 1,
    completed: false,
  };
  expect(corpRootRezTimingComponent(input, action, source)).toMatchObject({
    key: "corp_root_rez_latest_relevant_window",
  });
});
