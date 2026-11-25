import { readFileSync } from "node:fs";
import { applyAction, hashGameState } from "@netgrid/engine";
import type { GameState } from "@netgrid/shared";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";

const fixture = new URL(
  "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta922-terminal-coverage-bank.json",
  import.meta.url,
);

function loadScenario() {
  const scenario = JSON.parse(readFileSync(fixture, "utf8")) as {
    state: GameState;
    stateHash: string;
    options: NonNullable<Parameters<typeof buildAiDecisionInput>[2]>;
  };
  expect(hashGameState(scenario.state)).toBe(scenario.stateHash);
  return scenario;
}

afterEach(resetResidentPlanPortfolioMemory);

it("funds the current terminal Remote's exact coverage under its resident parent", () => {
  const { state, options } = loadScenario();
  const input = buildAiDecisionInput(state, "runner", options);
  const first = chooseAiAction(input, { persistTacticalPlanMemory: true });
  expect(first).toMatchObject({
    actionId: "r1.c29f.c29f.activated.441",
    reasonCode: "plan_first.runner.credit_bank",
    fallbackUsed: false,
    timeoutUsed: false,
  });
  expect(first.evidence).toContain("plan_step_capability:credit_bank_cash_out");
  const portfolio = residentPlanPortfolioSnapshot(input)!;
  const remote = portfolio.instances.find(
    (instance) => instance.instanceId === portfolio.rootForegroundInstanceId,
  );
  const bank = portfolio.instances.find(
    (instance) => instance.instanceId === portfolio.executorInstanceId,
  );
  const coverage = portfolio.instances.find(
    (instance) => instance.instanceId === bank?.parentInstanceId,
  );
  expect(remote).toMatchObject({
    moduleId: "runner.contest_remote",
    target: { kind: "server", id: "r1" },
  });
  expect(bank).toMatchObject({
    moduleId: "runner.credit_bank",
    phase: "cash_out",
    parentNeedId: "coverage-bank-funding:coverage:breaker_sentry",
  });
  expect(coverage).toMatchObject({
    moduleId: "runner.rig_and_coverage",
    parentInstanceId: remote?.instanceId,
    openNeedIds: [bank?.parentNeedId],
    moduleState: {
      gap: {
        installActionIds: [],
        bankFunding: { stateVersion: state.stateVersion, gap: 6 },
        sameTurnRunConversion: {
          requiredCredits: 13,
          requiredClicksAfterFunding: 2,
          postRunCreditFloor: 0,
        },
      },
    },
  });

  const receipt = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId: first.actionId!,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!receipt.ok) throw new Error(receipt.error.message);
  const afterPayout = receipt.state;
  expect(afterPayout.runner.credits).toBe(13);
  const nextInput = buildAiDecisionInput(afterPayout, "runner", options);
  const next = chooseAiAction(nextInput, { persistTacticalPlanMemory: true });
  expect(next.reasonCode).toBe("plan_first.runner.rig_and_coverage");
  const install = nextInput.legalActions.find(
    (action) => action.actionId === next.actionId,
  );
  expect(install).toMatchObject({
    type: "install_card",
    expiresAtStateVersion: afterPayout.stateVersion,
    source: "c1pt",
    payload: { cardId: "c1pt" },
  });
  expect(afterPayout.cardInstances.c1pt?.definitionId).toBe(278);
  const installed = applyAction(afterPayout, {
    matchId: state.matchId,
    side: "runner",
    actionId: next.actionId!,
    clientKnownStateVersion: afterPayout.stateVersion,
  });
  if (!installed.ok) throw new Error(installed.error.message);
  expect(installed.state.runner.credits).toBe(3);
  expect(installed.state.runner.clicks).toBe(1);
  const afterInstall = buildAiDecisionInput(installed.state, "runner", options);
  expect(chooseAiAction(afterInstall)).toMatchObject({
    actionId: "rs.r1",
    reasonCode: "plan_first.runner.contest_remote",
  });
});

it.each([
  ["insufficient cash", "rs.rd", "runner.pressure_central"],
  ["missing run click", "rs.rd", "runner.pressure_central"],
  ["unrezzed ICE", "rs.r1", "runner.contest_remote"],
] as const)(
  "does not open guaranteed coverage funding with %s",
  (constraint, runAction, owner) => {
    const { state, options } = loadScenario();
    if (constraint === "insufficient cash")
      state.cardInstances.c29f!.counters!.bit = 3;
    if (constraint === "missing run click") state.runner.clicks = 2;
    if (constraint === "unrezzed ICE") {
      const fort = state.corp.servers.find((server) => server.id === "r1")!;
      state.cardInstances[fort.ice.at(-1)!]!.rezzed = false;
      state.cardInstances[fort.ice.at(-1)!]!.faceup = false;
    }
    const input = buildAiDecisionInput(state, "runner", options);
    const selected = chooseAiAction(input, { persistTacticalPlanMemory: true });
    expect(selected).toMatchObject({
      actionId: runAction,
      reasonCode: "plan_first." + owner,
    });
    expect(residentPlanPortfolioSnapshot(input)?.instances).not.toContainEqual(
      expect.objectContaining({
        moduleId: "runner.credit_bank",
        parentNeedId: "coverage-bank-funding:coverage:breaker_sentry",
      }),
    );
  },
);
