import { afterEach, expect, it } from "vitest";
import original from "../../../../../data/scenarios/ai-decision-checkpoints/cp-p719-r03-g26-d349-hazard-bank.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { quoteRunnerRunTarget } from "../../runner-run-target-evaluation";
import { createDeckCapabilitiesContext } from "../../runtime/deck-capabilities-context";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

it.each([true, false])(
  "uses the installed prevention or finances the terminal hazard (installed=%s)",
  (installed) => {
    const cp = structuredClone(original) as unknown as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    if (!installed) {
      cp.input.playerView.own.rig = cp.input.playerView.own.rig!.filter(
        (card) => card.definitionId !== "onr_v1_135_nasuko-cycle",
      );
    }
    const runActionId = "runner.start_run.remote_1";
    const { target } = quoteRunnerRunTarget({
      input: cp.input,
      runActionId,
      targetServerId: "remote_1",
      deckCapabilities:
        createDeckCapabilitiesContext().deckCapabilitiesForInput(cp.input),
    })!;
    expect(target.visibleIceRunHazards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "trace_tag",
          unavoidable: !installed,
          ...(installed ? { minimumAvoidanceCost: 3 } : {}),
        }),
      ]),
    );
    const bank = cp.input.legalActions.find((action) =>
      action.actionId.endsWith(":withdraw_credits"),
    )!;
    expect(bank).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      cp.input,
      cp.input.ownDeckSnapshot!.deckSnapshotId,
      cp.runtime,
    );
    cp.input.planningStateIdentity = buildPlanningStateIdentity(cp.input);
    const before = JSON.stringify(cp.input);
    const decision = chooseAiAction(cp.input);
    expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
    const expectedActionId = installed ? runActionId : bank.actionId;
    expect(decision.actionId).toBe(expectedActionId);
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      selectedPlan: installed
        ? { moduleId: "runner.contest_remote" }
        : {
            moduleId: "runner.credit_bank",
            parentInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
            parentNeedId: "run-support:remote:remote_1",
          },
      route: {
        actionId: expectedActionId,
        stateVersion: cp.input.playerView.stateVersion,
      },
    });
    expect(JSON.stringify(cp.input)).toBe(before);
  },
);
