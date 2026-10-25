import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

type Capture = {
  stateVersion: number;
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
};

function capture(name: string): Capture {
  return JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/${name}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as Capture;
}

function replay(captured: Capture) {
  const snapshotId = captured.input.ownDeckSnapshot?.deckSnapshotId;
  if (!snapshotId) throw new Error("Missing captured deck snapshot");
  restoreAiRuntimeCheckpoint(captured.input, snapshotId, captured.runtime);
  const decision = chooseAiAction(captured.input);
  expect(decision.fallbackUsed).toBe(false);
  expect(
    captured.input.legalActions.some((a) => a.actionId === decision.actionId),
  ).toBe(true);
  return decision;
}

beforeEach(resetResidentPlanPortfolioMemory);

describe("pairing 541 native credit-bank budgets", () => {
  it("does not install another Broker while existing savings fund the spending budget", () => {
    const recorded = capture("cp-meta-541-r1-g2-d302-broker");
    expect(recorded.input.playerView.own.credits).toBe(7);
    expect(
      recorded.input.playerView.own.rig?.find((c) =>
        c.instanceId.endsWith("broker_2"),
      )?.counters?.bit,
    ).toBe(9);
    const decision = replay(recorded);
    expect(
      recorded.input.legalActions.find((a) => a.actionId === decision.actionId)
        ?.type,
    ).not.toBe("install_card");
    expect(decision.evidence).toContain(
      "plan_portfolio_blocked_evidence:plan:runner.credit_bank:runner_onr_v1_154_broker_1:runner_credit_bank_install_deferred_portfolio_budget_funded",
    );
  });

  it.each([21, 36, 37, 40])(
    "classifies the deferred Department load in failed diagnostic game %i",
    (game) => {
      // The server stayed at the failed state. Its current-input export was
      // checked against the persisted failure's actor, state hash and version.
      const recorded = capture(`cp-meta-541-r1-g${game}-department`);
      expect(recorded.input.playerView.stateVersion).toBe(
        recorded.stateVersion,
      );
      const decision = replay(recorded);
      expect(decision.decisionDebug?.planFirstDecision?.dispositions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            disposition: "explicitly_nonproductive",
            ownerModuleId: "corp.economy",
            evidenceCode:
              "corp_hosted_bank_load_deferred_no_admitted_investment_or_funding_route",
          }),
        ]),
      );
    },
  );
});
