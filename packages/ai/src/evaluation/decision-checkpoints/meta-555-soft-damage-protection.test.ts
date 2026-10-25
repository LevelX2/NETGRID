import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import { corpMatureRemoteAffordableDefenseLayerCertification } from "../../corp/defense/corp-defense-layer-certification";
function fixture(name: string) {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/" + name,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  return cp;
}
function candidate(
  input: AiDecisionInputWithDeckCapabilities,
  definition: string,
) {
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: input.side,
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
  const c = candidates.find((c) =>
    input.legalActions.some(
      (a) =>
        a.actionId === c.actionId &&
        a.source?.includes(definition) &&
        a.payload?.serverId === "remote_1",
    ),
  );
  if (!c) throw Error("Native agenda candidate missing");
  return c;
}
afterEach(resetResidentPlanPortfolioMemory);
it.each([
  ["cp-meta-555-r1-g7-d184.json", "employee-empowerment"],
  ["cp-meta-555-r1-g36-d132.json", "tycho-extension"],
  ["cp-meta-555-r1-g34-d38.json", "employee-empowerment"],
])(
  "does not certify damage without an access barrier: %s",
  (name, definition) => {
    const cp = fixture(name),
      input = cp.input,
      c = candidate(input, definition);
    const unchanged = JSON.stringify([input.playerView, input.legalActions]);
    expect(
      corpMatureRemoteAffordableDefenseLayerCertification(input, c, "remote_1"),
    ).toBeUndefined();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      cp.runtime,
    );
    const result = chooseAiAction(input);
    expect(result.actionId).not.toBe(c.actionId);
    expect(result.fallbackUsed).toBe(false);
    expect(result.timeoutUsed).toBe(false);
    const action = input.legalActions.find(
      (a) => a.actionId === result.actionId,
    )!;
    expect(action.expiresAtStateVersion).toBe(input.playerView.stateVersion);
    const pf = result.decisionDebug!.planFirstDecision!;
    expect(pf.route).toMatchObject({
      actionId: result.actionId,
      stateVersion: input.playerView.stateVersion,
    });
    expect(JSON.stringify([input.playerView, input.legalActions])).toBe(
      unchanged,
    );
    expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
  },
);
it("preserves the native funded ETR protection for an immediate next-turn matchpoint", () => {
  const cp = fixture("cp-meta-475-r2-g20-d355.json"),
    input = cp.input,
    c = candidate(input, "superserum");
  expect(
    corpMatureRemoteAffordableDefenseLayerCertification(input, c, "remote_1"),
  ).toMatchObject({
    kind: "affordable_engine_quoted_defense_layers",
    serverId: "remote_1",
    observedAtStateVersion: input.playerView.stateVersion,
  });
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const result = chooseAiAction(input);
  expect(result.actionId).toBe(c.actionId);
  expect(result.fallbackUsed).toBe(false);
});
