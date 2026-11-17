import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { resetResidentPlanPortfolioMemory, residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";
import { coverageSupportActionIds } from "../../runner/rig-coverage/coverage-support";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

function native() {
  const cp = JSON.parse(readFileSync(new URL(
    "./fixtures/deep656-replay1-d193-search-zone.json", import.meta.url,
  ), "utf8")).checkpoint;
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input: AiDecisionInputWithDeckCapabilities = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  restoreAiRuntimeCheckpoint(input, input.ownDeckSnapshot!.deckSnapshotId, cp.runtime);
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions, observerSide: input.side,
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: Object.fromEntries(
      [...input.playerView.own.gripOrHq, ...input.playerView.own.rig!]
        .filter(c => c.known && c.definitionId)
        .map(c => [c.instanceId, c.definitionId!]),
    ),
    cardSemanticProfilesByDefinitionId: buildActionCardSemanticProfilesByDefinitionId(),
  });
  const recovery = candidates.find(c => c.sourceDefinitionId === 299)!;
  return { cp, input, candidates, recovery };
}

it("does not bind a Stack-only Worm answer to the native heap-only recovery action", () => {
  const { input, candidates, recovery } = native();
  expect(recovery.functionalEffects).toContainEqual(expect.objectContaining({ kind: "search", scope: "heap", target: "program" }));
  expect(input.playerView.own.heapOrArchives.filter(c => c.type === "program").map(c => c.definitionId)).toEqual([213]);
  const result = coverageSupportActionIds(input, candidates, input.ownDeckCapabilities!, "breaker_wall", {
    deckHasStackAnswerOverride: true, targetDefinitionIdOverride: 286,
  });
  expect(result.directSearchActionIds).not.toContain(recovery.actionId);
  expect(result.directSearchChoiceBindings).not.toContainEqual(expect.objectContaining({ actionId: recovery.actionId, targetDefinitionId: 286 }));
});

it("keeps actual live ownership and the current state binding after rejecting the impossible source", () => {
  const { input, recovery } = native(), before = JSON.stringify(input);
  const decision = chooseAiAction(input);
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
  const plan = decision.decisionDebug!.planFirstDecision!;
  const action = input.legalActions.find(a => a.actionId === decision.actionId)!;
  expect(plan.route).toMatchObject({ actionId: action.actionId, stateVersion: 192, planInstanceId: plan.leafExecutorInstanceId });
  const port = residentPlanPortfolioSnapshot(input)!;
  const impossible = port.instances.some(p => {
    const state = p.moduleState as { gap?: { directSearchChoiceBindings?: Array<{ actionId: string; targetDefinitionId?: number }> } } | undefined;
    return state?.gap?.directSearchChoiceBindings?.some(b => b.actionId === recovery.actionId && b.targetDefinitionId === 286);
  });
  expect(impossible).toBe(false);
  expect(JSON.stringify(input)).toBe(before);
});

it("preserves exact heap coverage recovery in a prospective target-present companion", () => {
  const { input, candidates, recovery } = native();
  // This explicit prospective companion is not a historical checkpoint proof.
  const target = { instanceId: "prospective-worm-in-heap", definitionId: 286, title: "Worm", known: true, side: "runner" as const, type: "program" as const, subtypes: ["icebreaker", "fracter"] };
  input.playerView.own.heapOrArchives.push(target);
  const result = coverageSupportActionIds(input, candidates, input.ownDeckCapabilities!, "breaker_wall", {
    deckHasStackAnswerOverride: false,
  });
  expect(result.directSearchActionIds).toContain(recovery.actionId);
  expect(result.directSearchChoiceBindings).toContainEqual(expect.objectContaining({ actionId: recovery.actionId, targetDefinitionId: target.definitionId, targetCardInstanceId: target.instanceId }));
});
