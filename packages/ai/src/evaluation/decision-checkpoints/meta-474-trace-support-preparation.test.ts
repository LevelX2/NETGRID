import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import {
  corpDefinitionIsTraceSource,
  corpDefinitionIsTraceSupport,
  corpTraceSupportTargetHasVisibleTraceSource,
} from "../../corp/punish/punish-preparation";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";

function fixture() {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-474-r1-g6-d270.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.values(cp.validation).every((v) => v === true)).toBe(true);
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  return input;
}
afterEach(resetResidentPlanPortfolioMemory);

it("consumes actual trace-credit effects and installs global support under the existing Punish executor", () => {
  const input = fixture();
  const definitionId = "onr_v1_325_hacker-tracker-central";
  expect(AI_HINTS_BY_CARD.get(definitionId)!.effects).toContainEqual(
    expect.objectContaining({
      kind: "trace_credit",
      scope: "trace",
      target: "trace.value_and_limit_per_counter",
    }),
  );
  expect(corpDefinitionIsTraceSupport(definitionId)).toBe(true);
  const decision = chooseAiAction(input);
  const action = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  )!;
  expect(action.type).toBe("install_card");
  expect(action.payload).toMatchObject({
    cardId: "corp_onr_v1_325_hacker-tracker-central_1",
    serverId: "new_remote",
  });
  expect(decision.fallbackUsed).toBe(false);
  const portfolio = residentPlanPortfolioSnapshot(input)!;
  const executor = portfolio.instances.find(
    (p) => p.instanceId === portfolio.executorInstanceId,
  )!;
  // Existing prepare roots execute their own materialized preparation step.
  // Only a quoted punish sequence delegates to the sequence child.
  expect(executor.moduleId).toBe("corp.punish_campaign");
  expect(executor.moduleState).toMatchObject({
    kind: "punish_campaign",
    signal: {
      phase: "prepare",
      visibleTerminalProjection: false,
      guarantee: "robust_but_reactive",
    },
  });
  expect(decision.decisionDebug!.planFirstDecision!.route).toMatchObject({
    actionId: action.actionId,
    stateVersion: input.playerView.stateVersion,
    planInstanceId: executor.instanceId,
  });
});

it("holds global support when no visible trace source remains", () => {
  const input = fixture();
  input.playerView.own.gripOrHq = input.playerView.own.gripOrHq.filter(
    (c) => !corpDefinitionIsTraceSource(c.definitionId),
  );
  input.playerView.own.scoreArea = input.playerView.own.scoreArea.filter(
    (c) => !corpDefinitionIsTraceSource(c.definitionId),
  );
  for (const server of input.playerView.servers)
    server.ice = server.ice.filter(
      (c) => !corpDefinitionIsTraceSource(c.definitionId),
    );
  const decision = chooseAiAction(input);
  expect(decision.actionId).not.toContain("hacker-tracker");
  expect(decision.fallbackUsed).toBe(false);
});

it("keeps canonical fort support bound to the fort containing the trace source", () => {
  const input = fixture();
  const sourceAction = input.legalActions.find((a) =>
    a.actionId.includes("hacker-tracker"),
  )!;
  const forServer = (serverId: string) =>
    buildActionSemanticCandidates({
      legalActions: [
        {
          ...sourceAction,
          source: "paris",
          payload: { ...sourceAction.payload, cardId: "paris", serverId },
        },
      ],
      observerSide: "corp",
      stateVersion: input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId: {
        paris: "onr_v1_365_paris-city-grid",
      },
    })[0]!;
  const candidate = forServer("hq");
  expect(corpDefinitionIsTraceSupport(candidate.sourceDefinitionId)).toBe(true);
  expect(corpTraceSupportTargetHasVisibleTraceSource(input, candidate)).toBe(
    true,
  );
  expect(
    corpTraceSupportTargetHasVisibleTraceSource(input, forServer("archives")),
  ).toBe(false);
  expect(
    corpTraceSupportTargetHasVisibleTraceSource(input, forServer("new_remote")),
  ).toBe(false);
  expect(corpDefinitionIsTraceSupport("onr_v1_237_data-wall")).toBe(false);
});
