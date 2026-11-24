import { beforeEach, expect, it } from "vitest";
import ordered from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-536-r2-g27-d81-vacuum-link.json";
import start from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-536-r2-g27-d80-vacuum-link.json";
import forced from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-536-r2-g27-d84-vacuum-link.json";
import choice from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-536-r2-g27-d85-vacuum-link.json";
import type { PlanSchedulerResult } from "../../plans/plan-scheduler";
import { bindSelectedPlanActionOrigin } from "../../runner/run-window/run-window-selected-origin";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import type { AiRuntimeCheckpointV1 } from "./runtime-checkpoint";

beforeEach(resetResidentPlanPortfolioMemory);
function native(source: { validation: Record<string, boolean> } = choice) {
  expect(Object.values(source.validation).every(Boolean)).toBe(true);
  return structuredClone(source) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
}
function restore(cp: ReturnType<typeof native>) {
  restoreResidentPlanPortfolioMemorySnapshot(
    cp.input,
    cp.runtime.residentPlanPortfolio,
  );
}
it.each([
  "current",
  "wrong_timing",
  "stale_action",
  "stale_route",
  "foreign_step",
  "missing_action",
] as const)(
  "checks the native start offer and route before saving the origin (%s)",
  (variant) => {
    const { input, runtime } = native(start);
    const portfolio = runtime.residentPlanPortfolio!;
    const recorded = portfolio.selectedActionOrigin;
    if (recorded?.immediateChoicePolicy !== "resolve_runner_run_start_order") {
      throw new Error("Expected the captured native run-start origin");
    }
    const planInstanceId = recorded.executorInstanceId;
    const stepId = recorded.sourceStepId!;
    const action = input.legalActions.find(
      ({ actionId }) => actionId === recorded.selectedActionId,
    )!;
    delete portfolio.selectedActionOrigin;
    const route = {
      planInstanceId,
      step: {
        stepId,
        capability: {
          capabilityId: "run_start",
          semanticActionTypes: ["run.start"],
        },
        purpose: "Start the bound native run.",
      },
      head: {
        planInstanceId,
        stepId: variant === "foreign_step" ? "unbound-step" : stepId,
        actionId: action.actionId,
        actionType: action.type,
        semanticActionType: "run.start",
        stateVersion:
          input.playerView.stateVersion - (variant === "stale_route" ? 1 : 0),
      },
    };
    const result = { lane: "plan", portfolio, route } as PlanSchedulerResult;
    if (variant === "wrong_timing") action.timingPoint = "game.checkpoint";
    if (variant === "stale_action") action.expiresAtStateVersion--;
    if (variant === "missing_action") {
      input.legalActions = input.legalActions.filter(
        ({ actionId }) => actionId !== action.actionId,
      );
    }
    const bind = () => bindSelectedPlanActionOrigin(input, result, []);
    if (variant === "current") {
      bind();
      expect(portfolio.selectedActionOrigin).toEqual(recorded);
    } else {
      expect(bind).toThrow(
        expect.objectContaining({
          code: "window_origin_missing",
          context: expect.objectContaining({
            owner: "continuation",
            unresolvedActionIds: [action.actionId],
          }),
        }),
      );
      expect(portfolio.selectedActionOrigin).toBeUndefined();
    }
  },
);

it("retains the exact native run owner across its certified run-start ordering", () => {
  const cp = native();
  restore(cp);
  const decision = chooseAiAction(cp.input);
  expect(decision).toMatchObject({
    actionId: "rn",
    fallbackUsed: false,
    selectedChoices: {
      choiceId: cp.input.playerView.pendingChoice!.choiceId,
      selectedOptionIds: ["resume_from_rezzed_ice_back"],
    },
  });
  expect(
    residentPlanPortfolioSnapshot(cp.input)?.rootForegroundInstanceId,
  ).toBe(cp.runtime.residentPlanPortfolio!.rootForegroundInstanceId);
});
it("produces and consumes the same binding through all three native decisions", () => {
  const cp = native(ordered);
  // Successful trace checkpoints contain their just-observed runtime. Use the
  // preceding actual run-start decision's runtime to replay the ordering choice.
  cp.runtime = native(start).runtime;
  restore(cp);
  const order = chooseAiAction(cp.input);
  expect(order.selectedChoices).toMatchObject({
    choiceId: "runner_run_start_order_80",
    selectedOptionIds: [
      "source_card_implementation:c2g2",
    ],
  });
  expect(
    residentPlanPortfolioSnapshot(cp.input)?.selectedActionOrigin,
  ).toMatchObject({
    immediateChoicePolicy: "resolve_runner_run_start_order",
    continuedThroughStateVersion: 80,
  });
  const next = native(forced).input;
  expect(chooseAiAction(next).actionId).toBe(next.legalActions[0]!.actionId);
  expect(
    residentPlanPortfolioSnapshot(next)?.selectedActionOrigin,
  ).toMatchObject({
    immediateChoicePolicy: "resolve_runner_vacuum_link_rewind",
    selectedAtStateVersion: 83,
  });
  expect(chooseAiAction(native().input).selectedChoices).toMatchObject({
    choiceId: "card_implementation.vacuum_link_rewind:80:84",
    selectedOptionIds: ["resume_from_rezzed_ice_back"],
  });
});
it.each([
  "missing_certificate",
  "unrelated_action",
  "foreign_actor",
  "foreign_server",
  "event_gap",
])("rejects an uncertified or broken ordering continuation: %s", (fault) => {
  const cp = native();
  const event = cp.input.eventTail!.find((e) => e.stateVersionBefore === 80)!;
  if (fault === "missing_certificate")
    delete cp.runtime.residentPlanPortfolio!.selectedActionOrigin;
  if (fault === "unrelated_action")
    event.publicPayload!.actionType = "gain_credit";
  if (fault === "foreign_actor") event.publicPayload!.actor = "corp";
  if (fault === "foreign_server") event.publicPayload!.serverId = "hq";
  if (fault === "event_gap")
    cp.input.eventTail = cp.input.eventTail!.filter((e) => e !== event);
  restore(cp);
  expect(() => chooseAiAction(cp.input)).toThrow(/window_origin_missing/);
});
