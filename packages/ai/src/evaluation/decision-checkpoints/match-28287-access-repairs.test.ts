import { afterEach, expect, it } from "vitest";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { load, decide, candidates } from "./match-28287.test-support";
import { currentRunRemainingIce } from "../../runtime/current-encounter";
import { buildAiDecisionInputDto } from "../../input-dto";
import { runnerAgendaStealCreditRequirement } from "../../run-analysis/runner-agenda-steal-cost";
import { runnerTargetedBypassPlanCommitment } from "../../runner/run-window/runner-targeted-bypass-plan";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
afterEach(resetResidentPlanPortfolioMemory);

it("retains the public exact bypass binding when finishing the outer ICE", () => {
  const cp = load(102);
  expect(currentRunRemainingIce(cp.input)).toEqual([]);
  const { action, plan } = decide(cp);
  expect(action.type).toBe("break_subroutine");
  expect(plan.selectedPlan?.moduleId).toBe("runner.convert_run_window");
});

it("does not bypass a different ICE or a previous run's absent binding", () => {
  for (const id of [
    undefined,
    load(102).input.playerView.run!.encounteredIce!.instanceId,
  ]) {
    const cp = load(102);
    if (id === undefined) delete cp.input.playerView.run!.pendingAutoPassIceId;
    else cp.input.playerView.run!.pendingAutoPassIceId = id;
    expect(currentRunRemainingIce(cp.input)).toHaveLength(1);
    expect(decide(cp).action.type).toBe("continue_run");
  }
});

it("funds the known steal surcharge instead of starting the underfunded remote", () => {
  const original = load(124);
  expect(decide(original).action.type).not.toBe("start_run");
  const server = original.input.playerView.servers.find(
    (s) => s.id === "remote_1",
  )!;
  server.runnerAgendaStealCostQuote = {
    stateVersion: original.stateVersion,
    serverId: "remote_1",
    minimumCreditCost: 5,
    complete: true,
  };
  expect(decide(original).action.type).not.toBe("start_run");
  const quote = () =>
    evaluateRunnerRunTargets({
      input: buildAiDecisionInputDto(original.input),
    }).find(
      (target) =>
        target.targetServerId === "remote_1" &&
        original.input.legalActions.find((a) => a.actionId === target.actionId)
          ?.type === "start_run",
    );
  expect(quote()).toMatchObject({
    creditsAfterRun: 1,
    accessPayoffContestable: false,
    routeQuote: { fundingGap: 4 },
  });
  // With more money the path may protect additional damage subroutines;
  // certify conversion from the freshly quoted remaining liquid credits.
  original.input.playerView.own.credits = 25;
  const funded = quote();
  expect(funded).toMatchObject({
    accessPayoffContestable: true,
    routeQuote: { fundingGap: 0 },
  });
  expect(funded?.creditsAfterRun).toBeGreaterThanOrEqual(5);
});

it.each([
  [6, 5, false],
  [10, 5, true],
  [6, 0, true],
])(
  "quotes both the bypass event and the surviving path before reserving the steal from %s credits at %s cost",
  (credits, cost, admitted) => {
    const cp = load(98),
      input = cp.input;
    input.playerView.own.credits = credits;
    const server = input.playerView.servers.find((s) => s.id === "remote_1")!;
    server.runnerAgendaStealCostQuote = {
      stateVersion: cp.stateVersion,
      serverId: "remote_1",
      minimumCreditCost: cost,
      complete: true,
    };
    const candidate = candidates(input).find(
      (c) => c.sourceDefinitionId === "onr_v1_111_social-engineering",
    )!;
    const result = runnerTargetedBypassPlanCommitment({
      input,
      candidate,
      planTargets: [
        {
          ownerModuleId: "runner.contest_remote",
          ownerDedupeKey: "remote:remote_1",
          serverId: "remote_1",
          payoffValue: 1000,
          knownAgendaThreat: true,
        },
      ],
    });
    expect(Boolean(result)).toBe(admitted);
    if (result)
      expect(result).toMatchObject({
        sourceActionId: candidate.actionId,
        ownerModuleId: "runner.contest_remote",
        plannedAtStateVersion: cp.stateVersion,
        visibleIceInstanceId: server.ice[0]!.instanceId,
      });
  },
);

it("does not reuse missing, stale, negative or cross-server steal costs and retains actor-safe bypass facts", () => {
  const cp = load(124),
    server = cp.input.playerView.servers.find((s) => s.id === "remote_1")!;
  expect(
    runnerAgendaStealCreditRequirement(cp.input, "remote_1"),
  ).toBeUndefined();
  server.runnerAgendaStealCostQuote = {
    stateVersion: cp.stateVersion,
    serverId: "remote_1",
    minimumCreditCost: 5,
    complete: true,
  };
  expect(
    runnerAgendaStealCreditRequirement(
      buildAiDecisionInputDto(cp.input),
      "remote_1",
    ),
  ).toBe(5);
  for (const patch of [
    { stateVersion: cp.stateVersion - 1 },
    { serverId: "hq" as const },
    { minimumCreditCost: -1 },
  ]) {
    const altered = structuredClone(cp);
    Object.assign(
      altered.input.playerView.servers.find((s) => s.id === "remote_1")!
        .runnerAgendaStealCostQuote!,
      patch,
    );
    expect(() => buildAiDecisionInputDto(altered.input)).toThrow(
      "Invalid Engine public server steal-cost quote",
    );
    expect(
      runnerAgendaStealCreditRequirement(altered.input, "remote_1"),
    ).toBeUndefined();
  }
  const bypass = load(102);
  expect(
    buildAiDecisionInputDto(bypass.input).playerView.run?.pendingAutoPassIceId,
  ).toBe(bypass.input.playerView.run!.pendingAutoPassIceId);
  expect(
    buildAiDecisionInputDto(bypass.input).playerView.opponent,
  ).not.toHaveProperty("gripOrHq");
  bypass.input.playerView.run!.pendingAutoPassIceId = "absent-ice";
  expect(() => buildAiDecisionInputDto(bypass.input)).toThrow(
    "Invalid Engine pending auto-pass ICE binding",
  );
});
