import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";

const rootId = "plan:runner.pressure_central:central%3Ard";
const windowId = "plan:runner.convert_run_window:run%3Arun_164";
const newTarget = "corp_onr_v1_278_wall-of-ice_1";
const oldTarget = "corp_onr_v1_268_shock-r_1";
const sourceId = "runner_onr_v1_065_smarteye_1";

const checkpoints = {
  88: "cp-meta-736-r3-g24-d088.json",
  171: "cp-meta-736-r1-g37-d171.json",
  173: "cp-meta-736-r2-g16-d173.json",
  174: "cp-meta-736-g37-control-d174.json",
} as const;

function loadCheckpoint(decision: keyof typeof checkpoints = 171): {
  input: AiDecisionInputWithDeckCapabilities;
  portfolio: ResidentPlanPortfolio;
} {
  const fixture = JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/${checkpoints[decision]}`,
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(fixture.validation)).toEqual(Array(9).fill(true));
  return {
    input: { ...fixture.input, ...buildAiDecisionInputDto(fixture.input) },
    portfolio: fixture.runtime.residentPlanPortfolio,
  };
}

describe("SP-469: a later approach window after a declined exposure", () => {
  beforeEach(resetResidentPlanPortfolioMemory);

  it("hands the later target to the same live run parent", () => {
    const { input, portfolio } = loadCheckpoint();
    expect(portfolio.turnPlanExecutionLease).toMatchObject({
      actionType: "trigger_ability",
      currentBinding: {
        actionId: expect.stringContaining(oldTarget),
        stateVersion: 166,
      },
    });
    restoreResidentPlanPortfolioMemorySnapshot(input, portfolio);
    const selected = chooseAiAction(input);
    const decline = input.legalActions.find(
      (action) => action.payload?.approachIceExposeDecision === "decline",
    );
    expect(selected.actionId).toBe(decline?.actionId);
    expect(decline).toMatchObject({
      expiresAtStateVersion: 170,
      payload: { cardId: sourceId, iceId: newTarget },
    });
    expect(selected.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: rootId,
      leafExecutorInstanceId: `plan:runner.expose_information:ice%3A${newTarget}`,
      executionOrigin: { rootPlanInstanceId: rootId, stateVersion: 170 },
    });
    expect(selected.fallbackUsed).toBe(false);
    expect(selected.timeoutUsed).toBe(false);
  });

  it("reaches the third ICE after the Engine reports a targetless Corp rez decline", () => {
    const { input, portfolio } = loadCheckpoint(174);
    const declined = input.eventTail.find(
      (event) => event.stateVersionBefore === 171,
    );
    expect(declined?.type).toBe("decline_rez");
    expect(declined?.publicPayload.serverId).toBeUndefined();
    restoreResidentPlanPortfolioMemorySnapshot(input, portfolio);
    const selected = chooseAiAction(input);
    const target = "corp_onr_v1_238_data-wall-2-0_2";
    const expose = input.legalActions.find(
      (action) => action.payload?.approachIceExposeDecision === "expose",
    );
    expect(expose).toMatchObject({
      expiresAtStateVersion: 173,
      payload: { cardId: sourceId, iceId: target },
    });
    expect(selected.actionId).toBe(expose?.actionId);
    expect(selected.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: rootId,
      leafExecutorInstanceId: `plan:runner.expose_information:ice%3A${target}`,
      executionOrigin: { rootPlanInstanceId: rootId, stateVersion: 173 },
    });
    expect(selected.fallbackUsed).toBe(false);
    expect(selected.timeoutUsed).toBe(false);
  });

  it("rejects a Corp rez decline explicitly attached to another server", () => {
    const { input, portfolio } = loadCheckpoint(174);
    const declined = input.eventTail.find(
      (event) => event.stateVersionBefore === 171,
    )!;
    declined.publicPayload.serverId = "hq";
    restoreResidentPlanPortfolioMemorySnapshot(input, portfolio);
    expect(() => chooseAiAction(input)).toThrow(/window_origin_missing/);
  });

  it.each(["lease", "run", "server", "gap", "decline", "parent"] as const)(
    "rejects a continuation with an invalid %s binding",
    (defect) => {
      const { input, portfolio } = loadCheckpoint();
      if (defect === "lease") delete portfolio.turnPlanExecutionLease;
      if (defect === "run") input.playerView.run!.runId = "different-run";
      if (defect === "server") {
        const encounter = input.eventTail.find(
          (event) => event.stateVersionBefore === 168,
        )!;
        encounter.publicPayload.serverId = "hq";
      }
      if (defect === "gap") {
        input.eventTail = input.eventTail.filter(
          (event) => event.stateVersionBefore !== 168,
        );
      }
      if (defect === "decline") {
        const earlier = input.eventTail.find(
          (event) => event.stateVersionBefore === 166,
        )!;
        earlier.publicPayload.hiddenZoneAction = "approach_ice_expose";
      }
      if (defect === "parent") {
        portfolio.instances = portfolio.instances.filter(
          (instance) => instance.instanceId !== windowId,
        );
      }
      restoreResidentPlanPortfolioMemorySnapshot(input, portfolio);
      expect(() => chooseAiAction(input)).toThrow(/window_origin_missing/);
    },
  );
});

describe("SP-469: nonterminal encounter and automatic movement", () => {
  const runParent = "plan:runner.convert_run_window:run%3Arun_166";
  const pressureRoot = "plan:runner.pressure_central:central%3Ahq";
  const target = "corp_onr_v1_222_ball-and-chain_1";
  beforeEach(resetResidentPlanPortfolioMemory);

  it("lets Smarteye expose the next ICE under the same run parent", () => {
    const { input, portfolio } = loadCheckpoint(173);
    expect(portfolio.executorInstanceId).toBe(runParent);
    expect(portfolio.turnPlanExecutionLease).toMatchObject({
      actionType: "continue_run",
      currentBinding: { stateVersion: 170 },
    });
    expect(input.eventTail.slice(-2)).toMatchObject([
      {
        type: "continue_run",
        stateVersionBefore: 170,
        publicPayload: { encounterContinue: true, encounterWillEndRun: false },
      },
      {
        type: "continue_run",
        stateVersionBefore: 171,
        publicPayload: { actor: "runner", serverId: "hq", result: "continued" },
      },
    ]);
    expect(input.observedTurnPlanAction).toMatchObject({
      actionId: "runner.continue_run",
      source: "game_rule",
      stateVersionBefore: 171,
      stateVersionAfter: 172,
    });
    restoreResidentPlanPortfolioMemorySnapshot(input, portfolio);
    const selected = chooseAiAction(input);
    const expose = input.legalActions.find(
      (action) => action.payload?.approachIceExposeDecision === "expose",
    );
    expect(expose?.payload?.iceId).toBe(target);
    expect(selected.actionId).toBe(expose?.actionId);
    expect(selected.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: pressureRoot,
      leafExecutorInstanceId: `plan:runner.expose_information:ice%3A${target}`,
      executionOrigin: { rootPlanInstanceId: pressureRoot, stateVersion: 172 },
    });
    expect(selected.fallbackUsed).toBe(false);
    expect(selected.timeoutUsed).toBe(false);
  });

  it.each([
    "lease", "run", "server", "gap", "terminal", "extra encounter", "observation",
  ] as const)(
    "rejects an unbound automatic movement with %s",
    (defect) => {
      const { input, portfolio } = loadCheckpoint(173);
      const encounter = input.eventTail.find(
        (event) => event.stateVersionBefore === 170,
      )!;
      const movement = input.eventTail.find(
        (event) => event.stateVersionBefore === 171,
      )!;
      if (defect === "lease") delete portfolio.turnPlanExecutionLease;
      if (defect === "run") input.playerView.run!.runId = "other-run";
      if (defect === "server") movement.publicPayload.serverId = "rd";
      if (defect === "gap") input.eventTail = input.eventTail.filter(
        (event) => event !== movement,
      );
      if (defect === "terminal") encounter.publicPayload.encounterWillEndRun = true;
      if (defect === "extra encounter") movement.publicPayload.encounterContinue = true;
      if (defect === "observation") delete input.observedTurnPlanAction;
      restoreResidentPlanPortfolioMemorySnapshot(input, portfolio);
      expect(() => chooseAiAction(input)).toThrow(/window_origin_missing/);
    },
  );
});

describe("SP-469: an initial expose child directly under the pressure root", () => {
  const pressureRoot = "plan:runner.pressure_central:central%3Ahq";
  const runParent = "plan:runner.convert_run_window:run%3Arun_83";
  const target = "corp_onr_v1_237_data-wall_3";
  beforeEach(resetResidentPlanPortfolioMemory);

  it("moves the next exact ICE window under the resident same-run parent", () => {
    const { input, portfolio } = loadCheckpoint(88);
    const initialChild = portfolio.instances.find(
      (instance) => instance.instanceId === portfolio.executorInstanceId,
    );
    expect(initialChild?.moduleId).toBe("runner.expose_information");
    expect(initialChild?.parentInstanceId).toBe(pressureRoot);
    expect(portfolio.instances.find((instance) => instance.instanceId === runParent))
      .toMatchObject({
        moduleId: "runner.convert_run_window",
        parentInstanceId: pressureRoot,
        target: { kind: "window", id: "run:run_83" },
      });
    restoreResidentPlanPortfolioMemorySnapshot(input, portfolio);
    const selected = chooseAiAction(input);
    const decline = input.legalActions.find(
      (action) => action.payload?.approachIceExposeDecision === "decline",
    );
    expect(decline?.payload?.iceId).toBe(target);
    expect(selected.actionId).toBe(decline?.actionId);
    expect(selected.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: pressureRoot,
      leafExecutorInstanceId: `plan:runner.expose_information:ice%3A${target}`,
      selectedStep: { parentInstanceId: runParent },
    });
    expect(selected.fallbackUsed).toBe(false);
    expect(selected.timeoutUsed).toBe(false);
  });

  it.each(["missing", "different run"] as const)(
    "rejects a direct-root child with a %s run parent",
    (defect) => {
      const { input, portfolio } = loadCheckpoint(88);
      if (defect === "missing") {
        portfolio.instances = portfolio.instances.filter(
          (instance) => instance.instanceId !== runParent,
        );
      } else {
        input.playerView.run!.runId = "different-run";
      }
      restoreResidentPlanPortfolioMemorySnapshot(input, portfolio);
      expect(() => chooseAiAction(input)).toThrow(/window_origin_missing/);
    },
  );
});
