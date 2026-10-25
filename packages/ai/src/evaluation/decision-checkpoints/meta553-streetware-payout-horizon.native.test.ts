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
  name: string;
  stateVersion: number;
  validation: Record<string, boolean>;
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
};
const fixture = JSON.parse(
  readFileSync(
    new URL(
      "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta553-streetware-payout-horizon.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as { sourceCommit: string; captures: Capture[] };

beforeEach(resetResidentPlanPortfolioMemory);

describe("pairing 553 native automatic bank payout horizon", () => {
  it.each([
    ["g3-d94", 11, false],
    ["g3-d227", 11, false],
    ["g4-d34", 2, false],
    ["g4-d19", 0, true],
    ["g7-d107", 0, true],
  ] as const)("revalidates the existing queue in %s", (name, stored, load) => {
    const recorded = structuredClone(
      fixture.captures.find((c) => c.name === name),
    );
    const snapshotId = recorded?.input.ownDeckSnapshot?.deckSnapshotId;
    if (!recorded || !snapshotId)
      throw new Error("Missing native bank checkpoint");
    expect(Object.values(recorded.validation).every((v) => v === true)).toBe(
      true,
    );
    const source = recorded.input.playerView.own.rig?.find(
      (c) => c.definitionId === "onr_proteus_150_streetware-distributor",
    );
    expect(source).toBeDefined();
    // The Engine omits counters on an empty source; it does not emit bit: 0.
    expect(source!.counters?.bit).toBe(stored === 0 ? undefined : stored);
    const action = recorded.input.legalActions.find(
      (a) =>
        a.type === "activated_card_ability" && a.source === source?.instanceId,
    );
    if (!action) throw new Error("Missing exact current native load");
    restoreAiRuntimeCheckpoint(recorded.input, snapshotId, recorded.runtime);
    const before = JSON.stringify(recorded.input);
    const decision = chooseAiAction(recorded.input);
    expect(JSON.stringify(recorded.input)).toBe(before);
    expect(decision.fallbackUsed).toBe(false);
    expect(
      recorded.input.legalActions.some((a) => a.actionId === decision.actionId),
    ).toBe(true);
    expect(decision.decisionDebug?.planFirstDecision?.route?.stateVersion).toBe(
      recorded.stateVersion,
    );
    if (load) {
      expect(decision.actionId).toBe(action.actionId);
      expect(decision.reasonCode).toBe("plan_first.runner.credit_bank");
      expect(
        decision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
      ).toContain(source!.instanceId);
    } else {
      expect(decision.actionId).not.toBe(action.actionId);
      expect(decision.evidence).toContain(
        `plan_portfolio_blocked_evidence:plan:runner.credit_bank:${source!.instanceId}:runner_credit_bank_automatic_load_not_profitable_within_horizon`,
      );
    }
  });
});
