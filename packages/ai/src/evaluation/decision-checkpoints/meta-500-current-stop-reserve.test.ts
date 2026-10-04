import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { projectExactCorpIceRezRoute } from "../../runtime/corp-exact-ice-rez-route";
import { assessCorpRezOpportunityCost } from "../../corp/defense/corp-server-protection-reserve";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function fixture(decisionIndex: number, dto = false) {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-500-r3-g6-d${decisionIndex}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.values(cp.validation)).toHaveLength(9);
  expect(Object.values(cp.validation).every(Boolean)).toBe(true);
  const input = dto
    ? { ...cp.input, ...buildAiDecisionInputDto(cp.input) }
    : cp.input;
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  return input;
}

function routeFor(input: AiDecisionInputWithDeckCapabilities, count: number) {
  const position = input.playerView.run?.position;
  if (!position || position.kind !== "ice")
    throw Error("Native ICE position required");
  const sourceCard = input.playerView.servers.find((s) => s.id === "remote_1")!
    .ice[position.iceIndex]!;
  const candidate = buildActionSemanticCandidates({
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
    legalActions: input.legalActions,
    observerSide: "corp",
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: {
      [sourceCard.instanceId]: sourceCard.definitionId!,
    },
  }).find(
    (c) =>
      input.legalActions.find((a) => a.actionId === c.actionId)?.payload
        ?.effectiveSubroutineCountAfterRez === count,
  )!;
  return projectExactCorpIceRezRoute({
    input,
    candidate,
    sourceCard,
    targetServerId: "remote_1",
  })!;
}

afterEach(resetResidentPlanPortfolioMemory);

it.each([
  [94, false],
  [94, true],
  [96, false],
  [96, true],
] as const)(
  "admits the native current stop at D%i through DTO=%s",
  (d, dto) => {
    const input = fixture(d, dto);
    const factsHash = () =>
      createHash("sha256")
        .update(
          JSON.stringify({
            view: input.playerView,
            legal: input.legalActions,
            events: input.eventTail,
          }),
        )
        .digest("hex");
    const before = factsHash(),
      decision = chooseAiAction(input);
    const action = input.legalActions.find(
      (a) => a.actionId === decision.actionId,
    )!;
    expect(action.type).toBe("rez_ice");
    expect(action.payload?.effectiveSubroutineCountAfterRez).toBeGreaterThan(0);
    expect(action.expiresAtStateVersion).toBe(input.playerView.stateVersion);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
      leafExecutorInstanceId:
        "plan:corp.defend_servers:server-defense-portfolio",
      selectedStep: {
        stepId: "plan:corp.defend_servers:server-defense-portfolio:allocate",
      },
      route: {
        actionId: action.actionId,
        stateVersion: input.playerView.stateVersion,
      },
    });
    expect(factsHash()).toBe(before);
  },
);

it("counts exact current stop despite an unchanged abstract server probability", () => {
  const input = fixture(96),
    route = routeFor(input, 1);
  expect(route.before?.runnerAccessSuccessProbability).toEqual({
    numerator: 1,
    denominator: 1,
  });
  expect(route.after?.runnerAccessSuccessProbability).toEqual({
    numerator: 1,
    denominator: 1,
  });
  expect(route.accessBlock).toMatchObject({
    reason: "visible_break_route_unaffordable",
  });
  expect(assessCorpRezOpportunityCost(input, route, 2)).toMatchObject({
    preservesReserve: true,
    requiredCredits: 0,
    reason: "current_access_preferred",
  });
});

it("does not admit the offered zero-ETR rez as an exact stop", () => {
  const input = fixture(96);
  expect(
    input.legalActions.some(
      (a) =>
        a.type === "rez_ice" &&
        a.payload?.effectiveSubroutineCountAfterRez === 0,
    ),
  ).toBe(true);
  expect(routeFor(input, 0)).toBeUndefined();
});

it("does not invent marginal saving when the before route was already blocked", () => {
  const input = fixture(96),
    route = routeFor(input, 1);
  const before = {
    ...route.before!,
    runnerAccessSuccessProbability: { numerator: 0, denominator: 1 },
  };
  expect(
    assessCorpRezOpportunityCost(input, { ...route, before }, 2),
  ).toMatchObject({
    preservesReserve: false,
    requiredCredits: 6,
    reason: "funded_alternative_protection",
  });
});
