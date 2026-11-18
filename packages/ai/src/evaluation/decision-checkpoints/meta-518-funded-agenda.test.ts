import { syntheticCardDefinitionId } from "@netgrid/engine/test-fixtures/synthetic-card-definition-id";
import { afterEach, expect, it } from "vitest";
import g9 from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta518-g9d132.json";
import g12 from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta518-g12d384.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import { runnerAgendaStealCreditRequirement } from "../../run-analysis/runner-agenda-steal-cost";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";

afterEach(resetResidentPlanPortfolioMemory);
function inputFor(checkpoint: typeof g9 | typeof g12) {
  const cp = structuredClone(checkpoint) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  expect(Object.values(checkpoint.validation)).toEqual(Array(9).fill(true));
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  return input;
}
function withObservedHqAgenda(input: AiDecisionInputWithDeckCapabilities) {
  // Companion with current public knowledge. The captured game has a later
  // hidden installation that may have removed the previously accessed agenda.
  input.eventTail = [{
    eventId: input.playerView.stateVersion + 1,
    type: "access_card",
    stateVersionBefore: input.playerView.stateVersion - 1,
    stateVersionAfter: input.playerView.stateVersion,
    stateHashAfter: "companion-current-hq-access",
    publicPayload: {
      actor: "runner",
      actionType: "access_card",
      serverId: "hq",
      cardDefinitionId: 62,
      corpHqCountAfter: input.playerView.opponent.handCount,
    },
  }];
  input.playerView.publicEvents = input.eventTail;
  return input;
}

it.each([[g12, "rb", "runner.contest_remote"]])(
  "binds the proved access route to its parent's exact funding child",
  (cp, expectedActionId, rootModuleId) => {
    const input = inputFor(cp);
    const decision = chooseAiAction(input);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.timeoutUsed).not.toBe(true);
    expect(decision.actionId).toBe(expectedActionId);
    const plan = decision.decisionDebug!.planFirstDecision!;
    expect(plan.portfolio.find(
      (instance) => instance.instanceId === plan.rootPlanInstanceId,
    )?.moduleId).toBe(rootModuleId);
    expect(plan.selectedPlan!.moduleId).toBe("runner.economy");
    expect(plan.route).toMatchObject({
      actionId: decision.actionId,
      stateVersion: input.playerView.stateVersion,
    });
    expect(plan.route!.stepId).toBe(plan.selectedStep!.stepId);
    expect(plan.route!.planInstanceId).toBe(plan.leafExecutorInstanceId);
    expect(
      input.legalActions.some(
        (a) =>
          a.actionId === decision.actionId &&
          a.expiresAtStateVersion === input.playerView.stateVersion,
      ),
    ).toBe(true);
    expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
  },
);
it("keeps the historical HQ card uncertain after a later hidden install", () => {
  const input = inputFor(g9);
  const hq = evaluateRunnerRunTargets({ input }).find(
    (target) => target.actionId === "rs.hq",
  );
  expect(hq?.accessPayoff).toBe("unknown");
  expect(hq?.accessFacts.knownTargetDefinitionIds).not.toContain(62);
});

it("includes the known HQ agenda's self-cost before admitting access", () => {
  const input = withObservedHqAgenda(inputFor(g9));
  const hq = evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === "rs.hq",
  )!;
  expect(hq.accessPayoff).toBe("agenda");
  expect(hq.accessFacts.knownTargetDefinitionIds).toContain(
    62,
  );
  expect(hq.routeQuote!.fundingGap).toBe(2);
  expect(hq.accessPayoffContestable).toBe(false);
  expect(hq.evidence).toContain("run_target_agenda_steal_credit_requirement:2");
});
it("quotes the complete native five-ICE path at nineteen credits, including a free Worm break", () => {
  const input = inputFor(g12),
    server = input.playerView.servers.find((s) => s.id === "r1")!;
  const path = assessKnownRezzedIcePath(
    server.ice,
    input.playerView.own.rig!,
    19,
    server.root,
    input.playerView.opponent.credits,
  );
  expect(path).toMatchObject({
    canReachAccess: true,
    visibleBreakCost: 19,
    creditsAfterPath: 0,
  });
  const short = assessKnownRezzedIcePath(
    server.ice,
    input.playerView.own.rig!,
    18,
    server.root,
    input.playerView.opponent.credits,
  );
  expect(short.canReachAccess).toBe(false);
  const snowbank = server.ice.filter(
    (c) => c.definitionId === 96,
  );
  expect(
    assessKnownRezzedIcePath(snowbank, input.playerView.own.rig!, 0)
      .canReachAccess,
  ).toBe(true);
  expect(assessKnownRezzedIcePath(snowbank, [], 0).canReachAccess).toBe(false);
  expect(assessKnownRezzedIcePath(snowbank, [], 1)).toMatchObject({
    canReachAccess: true,
    visibleBreakCost: 1,
  });
});
it("combines current public server costs and canonical known agenda costs without guessing missing facts", () => {
  const input = inputFor(g9),
    server = input.playerView.servers.find((s) => s.id === "hq")!;
  server.runnerAgendaStealCostQuote!.minimumCreditCost = 5;
  const known = [408, 62];
  expect(runnerAgendaStealCreditRequirement(input, "hq", known)).toBe(7);
  expect(runnerAgendaStealCreditRequirement(input, "hq")).toBe(5);
  expect(runnerAgendaStealCreditRequirement(input, "hq", [])).toBeUndefined();
  expect(
    runnerAgendaStealCreditRequirement(input, "hq", [syntheticCardDefinitionId("missing-agenda")]),
  ).toBeUndefined();
  expect(
    runnerAgendaStealCreditRequirement(input, "hq", [251]),
  ).toBeUndefined();
  server.runnerAgendaStealCostQuote!.stateVersion--;
  expect(
    runnerAgendaStealCreditRequirement(input, "hq", known),
  ).toBeUndefined();
});
