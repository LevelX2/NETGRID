import { expect, it } from "vitest";
import before from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-406-vacuum-forced-d175.json";
import after from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-406-vacuum-forced-d176.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import type { AiRuntimeCheckpointV1 } from "./runtime-checkpoint";

function fixture() {
  return structuredClone(before) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
}

it.each(["rez", "pass"])(
  "SP-160 keeps the exact run owner through Shock.r forced continuations and the next ICE %s",
  (mode) => {
    const { input, runtime } = fixture();
    if (mode === "pass") {
      const event = input.eventTail!.find((e) => e.stateVersionBefore === 173)!;
      event.type = "decline_rez";
      event.publicPayload = {
        actor: "corp",
        actionType: "decline_rez",
        runPhase: "movement",
        passedIcePosition: 1,
      };
    }
    resetResidentPlanPortfolioMemory();
    // Restore the captured live session, not a restart-invalidated commitment.
    restoreResidentPlanPortfolioMemorySnapshot(
      input,
      runtime.residentPlanPortfolio,
    );
    const forced = chooseAiAction(input);
    expect(forced.actionId).toBe(input.legalActions[0]!.actionId);
    const portfolio = residentPlanPortfolioSnapshot(input);
    expect(portfolio?.selectedActionOrigin).toMatchObject({
      rootPlanInstanceId:
        runtime.residentPlanPortfolio!.rootForegroundInstanceId,
      executorInstanceId: runtime.residentPlanPortfolio!.executorInstanceId,
      selectedAtStateVersion: 174,
      selectedActionId: forced.actionId,
      immediateChoicePolicy: "resolve_runner_vacuum_link_rewind",
    });
    const next = structuredClone(
      after.input,
    ) as unknown as AiDecisionInputWithDeckCapabilities;
    const choice = chooseAiAction(next);
    expect(choice.actionId).toBe("runner.resolve_choice");
    expect(choice.selectedChoices).toMatchObject({
      choiceId: next.playerView.pendingChoice!.choiceId,
    });
    expect(residentPlanPortfolioSnapshot(next)?.executorInstanceId).toBe(
      portfolio!.executorInstanceId,
    );
  },
);

it.each(["gap", "other_server", "unrelated_action"])(
  "does not invent an inherited run origin for %s",
  (fault) => {
    const { input, runtime } = fixture();
    const event = input.eventTail!.find((e) => e.stateVersionBefore === 171)!;
    if (fault === "gap")
      input.eventTail = input.eventTail!.filter((e) => e !== event);
    if (fault === "other_server") event.publicPayload!.serverId = "hq";
    if (fault === "unrelated_action")
      event.publicPayload!.actionType = "gain_credit";
    resetResidentPlanPortfolioMemory();
    restoreResidentPlanPortfolioMemorySnapshot(
      input,
      runtime.residentPlanPortfolio,
    );
    chooseAiAction(input);
    expect(
      residentPlanPortfolioSnapshot(input)?.selectedActionOrigin,
    ).toBeUndefined();
    const next = structuredClone(
      after.input,
    ) as unknown as AiDecisionInputWithDeckCapabilities;
    next.eventTail = [
      ...input.eventTail!,
      ...next.eventTail!.filter((e) => e.stateVersionBefore === 174),
    ];
    expect(() => chooseAiAction(next)).toThrow(/window_origin_missing/);
  },
);
