import { readFileSync } from "node:fs";
import { buildAiDecisionInputDto } from "../../input-dto";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import { afterEach, expect, it } from "vitest";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import { corpMatureRemoteAffordableDefenseLayerCertification } from "../../corp/defense/corp-defense-layer-certification";
import { visibleRunnerHeapBreakerPreparations } from "../../runtime/corp-public-heap-breaker-preparation";
import { scoringWindowPostRezProtectionAssessment } from "../../runtime/corp-scoreline/semantic-runtime-corp-scoring-window-runner-pressure";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
function fixture(name: string) {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-555-r4-" +
          name +
          ".json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    validation: Record<string, boolean>;
  };
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  return cp.input;
}
afterEach(resetResidentPlanPortfolioMemory);
it.each(["g4-d595", "g17-d455"])(
  "does not certify the native %s path as protected when a public Heap breaker can be recovered, installed and used next turn",
  (name) => {
    const input = fixture(name);
    const candidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "corp",
      stateVersion: input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId:
        visibleSourceDefinitionsByInstanceId(input.playerView),
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
    });
    const definition =
      name === "g4-d595" ? "project-babylon" : "tycho-extension";
    const action = input.legalActions.find(
      (a) =>
        a.type === "install_card" &&
        a.source.includes(definition) &&
        a.payload?.serverId === "remote_1",
    )!;
    const candidate = candidates.find((c) => c.actionId === action.actionId)!;
    expect(candidate).toBeDefined();
    const before = JSON.stringify([input.playerView, input.legalActions]);
    expect(input.playerView.opponent.discardCards!.at(-1)?.definitionId).toBe(
      "onr_classic_031_rent-i-con",
    );
    expect(
      input.playerView.opponent.rig?.some(
        (c) => c.definitionId === "onr_classic_031_rent-i-con",
      ),
    ).toBe(false);
    expect(
      corpMatureRemoteAffordableDefenseLayerCertification(
        input,
        candidate,
        "remote_1",
      ),
    ).toBeUndefined();
    expect(JSON.stringify([input.playerView, input.legalActions])).toBe(before);
    expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
  },
);

it.each(["g4-d595", "g17-d455"])(
  "uses the public recovery in the underlying native %s scoring-window path",
  (name) => {
    const input = fixture(name);
    const server = input.playerView.servers.find((s) => s.id === "remote_1")!;
    const assessment = scoringWindowPostRezProtectionAssessment(
      input,
      server,
      3,
    );
    expect(assessment.evidence).toContain("remote_access:can_reach:true");
    expect(assessment.evidence).toContain("public_heap_breaker_used:true");
    expect(assessment.missingVisibleBreakerCoverage).toBe(false);
    input.playerView.activeSide = "runner";
    const current = scoringWindowPostRezProtectionAssessment(input, server, 3);
    expect(current.evidence).toContain("public_heap_breaker_used:false");
    expect(current.evidence).toContain("remote_access:can_reach:false");
  },
);
it.each([
  ["g4-d595", 11],
  ["g17-d455", 6],
] as const)(
  "reserves recovery, install and run actions in %s, retaining only %i general credits",
  (name, credits) => {
    const candidates = visibleRunnerHeapBreakerPreparations(fixture(name));
    const direct = candidates.find(
      (candidate) => candidate.recoveryCount === 1,
    )!;
    expect(direct).toBeDefined();
    expect(direct).toMatchObject({
      remainingGeneralCredits: credits,
      preparationCreditCost: 4,
      preparationClicks: 2,
      recoveryCount: 1,
    });
    expect(direct.card.counterDisplays).toEqual([]);
  },
);
it("reaches a buried breaker only by paying for the actual top-Heap cards first", () => {
  const input = fixture("g17-d455");
  const heap = input.playerView.opponent.discardCards!;
  heap.push({ ...heap.at(-2)!, instanceId: "test-public-top-event" });
  input.playerView.opponent.discardCount += 1;
  const candidates = visibleRunnerHeapBreakerPreparations(input);
  expect(candidates).toHaveLength(1);
  expect(candidates[0]).toMatchObject({
    remainingGeneralCredits: 4,
    preparationCreditCost: 5,
    preparationClicks: 3,
    recoveryCount: 2,
  });
  heap.push({ ...heap.at(-1)!, instanceId: "test-second-public-top-event" });
  input.playerView.opponent.discardCount += 1;
  expect(visibleRunnerHeapBreakerPreparations(input)).toEqual([]);
});
it("does not borrow restricted pools to pay for recovery or installation", () => {
  const input = fixture("g4-d595");
  expect(
    input.playerView.opponent.rig!.some((c) =>
      c.counterDisplays?.some((d) => d.creditPool),
    ),
  ).toBe(true);
  input.playerView.opponent.credits = 1;
  expect(visibleRunnerHeapBreakerPreparations(input)).toEqual([]);
});
it("does not invent a memory trash or an unquoted host", () => {
  const input = fixture("g17-d455");
  input.playerView.opponent.memoryUsed = input.playerView.opponent.memoryLimit!;
  expect(visibleRunnerHeapBreakerPreparations(input)).toEqual([]);
});
it("respects action debt and the run click already reserved by the Engine", () => {
  const input = fixture("g17-d455");
  input.playerView.runnerNextTurnCreditClicks = 1;
  expect(visibleRunnerHeapBreakerPreparations(input)).toEqual([]);
});
it.each(["absent", "inactive", "hidden"])(
  "does not invent recovery from an %s public source",
  (mode) => {
    const input = fixture("g17-d455");
    const runner = input.playerView.opponent;
    const bbs = runner.rig!.find(
      (c) => c.definitionId === "onr_v1_165_junkyard-bbs",
    )!;
    if (mode === "absent") runner.rig = runner.rig!.filter((c) => c !== bbs);
    else if (mode === "inactive") bbs.rezzed = false;
    else bbs.known = false;
    expect(visibleRunnerHeapBreakerPreparations(input)).toEqual([]);
  },
);
it("keeps a genuine current two-layer certificate when no public recovery is installed", () => {
  const input = fixture("g17-d455");
  input.playerView.opponent.rig = input.playerView.opponent.rig!.filter(
    (c) => c.definitionId !== "onr_v1_165_junkyard-bbs",
  );
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "corp",
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
  const action = input.legalActions.find(
    (a) =>
      a.type === "install_card" &&
      a.source.includes("tycho-extension") &&
      a.payload?.serverId === "remote_1",
  )!;
  expect(
    corpMatureRemoteAffordableDefenseLayerCertification(
      input,
      candidates.find((c) => c.actionId === action.actionId)!,
      "remote_1",
    ),
  ).toBeDefined();
});
it.each(["heap", "memory", "clicks"])(
  "fails visibly on missing public %s facts",
  (fact) => {
    const input = fixture("g17-d455");
    if (fact === "heap") input.playerView.opponent.discardCount += 1;
    else if (fact === "memory") delete input.playerView.opponent.memoryLimit;
    else delete input.playerView.runnerNextTurnCreditClicks;
    expect(() => visibleRunnerHeapBreakerPreparations(input)).toThrow(
      /corp_public_heap_preparation:/,
    );
  },
);

it.each(["g4-d595", "g17-d455"])(
  "retains the complete public Heap through the actual %s DTO and resident decision path",
  (name) => {
    const input = fixture(name);
    const normalized = { ...input, ...buildAiDecisionInputDto(input) };
    expect(normalized.playerView.opponent.discardCards).toEqual(
      input.playerView.opponent.discardCards,
    );
    const cp = JSON.parse(
      readFileSync(
        new URL(
          "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-555-r4-" +
            name +
            ".json",
          import.meta.url,
        ),
        "utf8",
      ),
    ) as { runtime: AiRuntimeCheckpointV1 };
    restoreAiRuntimeCheckpoint(
      normalized,
      normalized.ownDeckSnapshot!.deckSnapshotId,
      cp.runtime,
    );
    const before = JSON.stringify([
      normalized.playerView,
      normalized.legalActions,
    ]);
    const result = chooseAiAction(normalized);
    expect(result.fallbackUsed).toBe(false);
    expect(result.timeoutUsed).not.toBe(true);
    expect(
      normalized.legalActions.some((a) => a.actionId === result.actionId),
    ).toBe(true);
    expect(result.decisionDebug!.planFirstDecision!.route).toMatchObject({
      actionId: result.actionId,
      stateVersion: normalized.playerView.stateVersion,
    });
    expect(
      JSON.stringify([normalized.playerView, normalized.legalActions]),
    ).toBe(before);
    expect(normalized.playerView.opponent).not.toHaveProperty("gripOrHq");
  },
);

it("does not admit the Corporation discard zone into a Runner input", () => {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-555-r2-g5-d282.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    validation: Record<string, boolean>;
  };
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  expect(cp.input.side).toBe("runner");
  cp.input.playerView.opponent.discardCards = [
    {
      instanceId: "injected-private-corp-discard",
      definitionId: "private-corp-card",
      owner: "corp",
      known: false,
    },
  ];
  const dto = buildAiDecisionInputDto(cp.input);
  expect(dto.playerView.opponent).not.toHaveProperty("discardCards");
  expect(JSON.stringify(dto)).not.toContain("private-corp-card");
});
