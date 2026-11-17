import fixture from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manual-20261108-corp-hq-allocation.json";
import firstRemoteFixture from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manual-d09-hq-d30.json";
import secondRemoteLayerFixture from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manual-d09-hq-d33.json";
import terminalAlternateEntryFixture from "../../../../../data/scenarios/ai-decision-checkpoints/cp-p742-g11-d277.json";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { allocateCorpCentralDefenseFromAiFacts } from "../../corp/defense/corp-central-defense-facts-adapter";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

function capturedInput(fixture: unknown) {
  const capture = structuredClone(fixture) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.values(capture.validation).every(Boolean)).toBe(true);
  expect(capture.input.playerView.opponent).not.toHaveProperty("gripOrHq");
  restoreAiRuntimeCheckpoint(
    capture.input,
    capture.input.ownDeckSnapshot!.deckSnapshotId,
    capture.runtime,
  );
  return capture.input;
}

it("retains higher HQ agenda exposure in the concrete installation at D34", () => {
  const input = capturedInput(fixture);
  const decision = chooseAiAction(input);
  expect(input.legalActions.some((a) => a.actionId === decision.actionId)).toBe(
    true,
  );
  expect(decision.fallbackUsed).toBe(false);
  const selected = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  )!;
  expect(selected.payload?.serverId).toBe("hq");
  expect(selected.type).toBe("install_card");
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("corp.defend_servers");
});

it.each([
  [firstRemoteFixture, "filter", 2],
  [secondRemoteLayerFixture, "data-wall", 3],
] as const)(
  "protects repeated HQ exposure with %s",
  (fixture, ice, recentTurns) => {
    const input = capturedInput(fixture);
    expect(allocateCorpCentralDefenseFromAiFacts({ input })).toMatchObject({
      selectedServerId: "hq",
      evidence: {
        hq: {
          threat: "acute",
          recentSuccessfulAccessRunnerTurns: recentTurns,
        },
      },
    });
    const decision = chooseAiAction(input);
    const action = input.legalActions.find(
      (entry) => entry.actionId === decision.actionId,
    );
    expect(decision.fallbackUsed).toBe(false);
    expect(action?.actionId).toContain(ice);
    expect(action?.payload?.serverId).toBe("hq");
    expect(action?.costs).toEqual([{ clicks: 1, credits: 2 }]);
    expect(decision.evidence).toContain("plan_priority_class:P3");
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
      route: {
        actionId: decision.actionId,
        stateVersion: input.playerView.stateVersion,
      },
    });
  },
);

it("keeps the score parent if HQ has no repeat access", () => {
  const input = capturedInput(firstRemoteFixture);
  const isEarlierAccess = (event: (typeof input.eventTail)[number]) =>
    event.eventId === 37;
  input.playerView.publicEvents = input.playerView.publicEvents.filter(
    (event) => !isEarlierAccess(event),
  );
  input.eventTail = input.eventTail.filter((event) => !isEarlierAccess(event));
  expect(allocateCorpCentralDefenseFromAiFacts({ input })).toMatchObject({
    evidence: { hq: { threat: "acute", recentSuccessfulAccessRunnerTurns: 1 } },
  });
  const decision = chooseAiAction(input);
  expect(decision.actionId).toContain(".new_remote.");
  expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toMatch(
    /^plan:corp\.score_agenda:/,
  );
});

it("keeps immediately effective remote protection in the same priority band", () => {
  const input = capturedInput(firstRemoteFixture);
  input.playerView.opponent.rig = input.playerView.opponent.rig!.filter(
    (card) => card.type !== "program",
  );
  const decision = chooseAiAction(input);
  expect(decision.actionId).toContain(".new_remote.");
  expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toMatch(
    /^plan:corp\.score_agenda:/,
  );
  expect(
    decision.evidence?.some((code) =>
      code.includes("score_protection_satisfied"),
    ),
  ).toBe(true);
});

it.each([true, false])(
  "uses the funded entrance to the same terminal access when the diversion is visible (%s)",
  (diversionVisible) => {
    const input = capturedInput(terminalAlternateEntryFixture);
    expect(input.playerView.opponent.agendaPoints).toBe(6);
    if (!diversionVisible) {
      input.playerView.opponent.rig = input.playerView.opponent.rig!.filter(
        (card) => card.definitionId !== 274,
      );
    }
    const decision = chooseAiAction(input);
    const head = input.legalActions.find(
      (a) => a.actionId === decision.actionId,
    );
    expect(decision.fallbackUsed).toBe(false);
    expect(head?.payload?.serverId).toBe(diversionVisible ? "archives" : "hq");
    if (diversionVisible) {
      expect(head?.actionId).toContain("wall-of-static");
      expect(head?.payload?.postInstallRezQuoteFinalCredits).toBe(3);
    }
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
      priority: { effectiveClass: "P2" },
      route: {
        actionId: decision.actionId,
        stateVersion: input.playerView.stateVersion,
      },
    });
  },
);
