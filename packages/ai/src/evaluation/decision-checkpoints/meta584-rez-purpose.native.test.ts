import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import { corpIceRezSupportOperationHasPositiveCurrentIncome } from "../../corp/defense/corp-defense-rez-support-facts";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
function capture(key: string) {
  const data = JSON.parse(
    readFileSync(
      new URL("./fixtures/meta584-rez-purpose.json", import.meta.url),
      "utf8",
    ),
  ) as {
    states: Record<
      string,
      {
        input: AiDecisionInputWithDeckCapabilities;
        runtime: AiRuntimeCheckpointV1;
        validation: Record<string, boolean>;
        observedActionId: string;
      }
    >;
  };
  const cp = data.states[key]!;
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  return { ...cp, input };
}
afterEach(resetResidentPlanPortfolioMemory);
it.each(["g5d43", "g29d124"])(
  "does not buy zero-income empty-remote ICE solely to reduce HQ: %s",
  (key) => {
    const { input, observedActionId } = capture(key);
    const old = input.legalActions.find(
      (a) => a.actionId === observedActionId,
    )!;
    const fort = input.playerView.servers.find((s) =>
      s.ice.some((i) => i.instanceId === old.payload!.targetCardId),
    )!;
    expect(fort.id).toMatch(/^remote_/);
    expect(fort.root).toEqual([]);
    expect(input.playerView.own.clicks).toBe(1);
    expect(old.payload?.xValue).toBe(1);
    const decision = chooseAiAction(input);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.timeoutUsed).toBe(false);
    const action = input.legalActions.find(
      (a) => a.actionId === decision.actionId,
    )!;
    expect(
      action.type === "play_operation" &&
        action.payload?.targetCardId === old.payload?.targetCardId,
    ).toBe(false);
    if (action.type === "play_operation" && action.source === old.source) {
      const quote = JSON.parse(
        String(action.payload!.operationFreeRezRunQuoteJson),
      );
      expect(quote.postRez.complete).toBe(true);
      expect(quote.postRez.creditGainOnRez.creditsAfter).toBeGreaterThan(
        input.playerView.own.credits,
      );
    }
    expect(action.expiresAtStateVersion).toBe(input.playerView.stateVersion);
    expect(decision.decisionDebug?.planFirstDecision?.route).toMatchObject({
      actionId: action.actionId,
      stateVersion: input.playerView.stateVersion,
    });
  },
);
it.each(["g6d278", "g7d68", "g25d18", "g3d82", "g13d54"])(
  "preserves the exact useful income or urgent Defense conversion: %s",
  (key) => {
    const { input, observedActionId } = capture(key);
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe(observedActionId);
    expect(decision.fallbackUsed).toBe(false);
    const expectedOwner = ["g3d82", "g13d54"].includes(key)
      ? "corp.defend_servers"
      : "corp.hand_and_agenda_management";
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe(expectedOwner);
    expect(
      input.legalActions.find((a) => a.actionId === decision.actionId)
        ?.expiresAtStateVersion,
    ).toBe(input.playerView.stateVersion);
  },
);

it("separates actual positive payout from a same-source counter variant with no net gain", () => {
  const { input, observedActionId } = capture("g6d278");
  const positive = input.legalActions.find(
    (a) => a.actionId === observedActionId,
  )!;
  const equalBank = input.legalActions.find(
    (a) =>
      a.type === "play_operation" &&
      a.source === positive.source &&
      a.payload?.targetCardId === positive.payload?.targetCardId &&
      a.payload?.xValue === 3,
  )!;
  expect(equalBank).toBeDefined();
  expect(
    corpIceRezSupportOperationHasPositiveCurrentIncome(input, positive),
  ).toBe(true);
  expect(
    corpIceRezSupportOperationHasPositiveCurrentIncome(input, equalBank),
  ).toBe(false);
});
it.each([
  "missing",
  "state",
  "source",
  "target",
  "server",
  "counter",
  "income",
])("fails closed on a broken current payout quote: %s", (kind) => {
  const { input, observedActionId } = capture("g25d18");
  const action = input.legalActions.find(
    (a) => a.actionId === observedActionId,
  )!;
  const quote = JSON.parse(
    String(action.payload!.operationFreeRezRunQuoteJson),
  );
  if (kind === "state") quote.postRez.expiresAtStateVersion--;
  if (kind === "source") quote.sourceCardId = "other_source";
  if (kind === "target") quote.postRez.cardId = "other_ice";
  if (kind === "server") quote.postRez.targetServerId = "other_server";
  if (kind === "counter") quote.counterAmount++;
  if (kind === "income") quote.postRez.creditGainOnRez.creditsAfter++;
  action.payload!.operationFreeRezRunQuoteJson = JSON.stringify(quote);
  if (kind === "missing") delete action.payload!.operationFreeRezRunQuoteJson;
  expect(() =>
    corpIceRezSupportOperationHasPositiveCurrentIncome(input, action),
  ).toThrow(PlanResolutionFailure);
});
