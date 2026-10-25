import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { runnerCardRunHasVisibleDifferentialPayoff } from "../../plans/runner-run-payoff";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
function capture(key: string) {
  const f = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta552-run-credit-payoff.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ).states[key] as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
    observedActionId: string;
  };
  return { ...f, input: { ...f.input, ...buildAiDecisionInputDto(f.input) } };
}
function candidates(input: AiDecisionInputWithDeckCapabilities) {
  return buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: input.side,
    stateVersion: input.playerView.stateVersion,
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
    visibleSourceDefinitionsByInstanceId: Object.fromEntries(
      input.playerView.own.gripOrHq.map((c) => [c.instanceId, c.definitionId!]),
    ),
  });
}
function hash(input: AiDecisionInputWithDeckCapabilities) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        view: input.playerView,
        actions: input.legalActions,
        events: input.eventTail,
      }),
    )
    .digest("hex");
}
describe("native current run-credit differential payoff", () => {
  beforeEach(resetResidentPlanPortfolioMemory);
  it.each(["g13", "g25", "g33"])(
    "does not call unused credits or self damage a benefit in %s",
    (key) => {
      const f = capture(key),
        event = candidates(f.input).find(
          (c) => c.actionId === f.observedActionId,
        )!,
        targets = evaluateRunnerRunTargets({ input: f.input });
      expect(Object.keys(f.validation)).toHaveLength(9);
      expect(Object.values(f.validation).every(Boolean)).toBe(true);
      expect(event.effectTargets).toContain("run.after_completed_self_damage");
      expect(targets.find((e) => e.actionId === event.actionId)).toMatchObject({
        pathCost: 0,
        unknownUnrezzedIceCount: 0,
        creditsAfterRun: f.input.playerView.own.credits,
      });
      expect(
        runnerCardRunHasVisibleDifferentialPayoff(
          f.input,
          event,
          "archives",
          targets,
        ),
      ).toBe(false);
      expect(
        runnerCardRunHasVisibleDifferentialPayoff(
          f.input,
          { ...event, effectTargets: ["run.after_completed_self_damage"] },
          "archives",
          targets,
        ),
      ).toBe(false);
    },
  );
  it.each(["g13", "g25", "g33"])(
    "keeps a legal current owner without the needless event in %s",
    (key) => {
      const f = capture(key),
        before = hash(f.input);
      restoreAiRuntimeCheckpoint(
        f.input,
        f.input.ownDeckSnapshot!.deckSnapshotId,
        f.runtime,
      );
      const d = chooseAiAction(f.input);
      expect(d.fallbackUsed).toBe(false);
      expect(d.timeoutUsed).toBe(false);
      expect(d.actionId).not.toBe(f.observedActionId);
      const a = f.input.legalActions.find((a) => a.actionId === d.actionId)!;
      expect(a).toBeDefined();
      expect(
        a.actionId.includes("lucidrine") && a.payload?.serverId === "archives",
      ).toBe(false);
      const p = d.decisionDebug?.planFirstDecision;
      expect(a.actionId).toBe("runner.start_run.archives");
      expect(p?.selectedPlan?.moduleId).toBe("runner.pressure_central");
      expect(p?.route).toMatchObject({
        actionId: a.actionId,
        stateVersion: f.input.playerView.stateVersion,
      });
      expect(p?.rootPlanInstanceId).toBeTruthy();
      expect(p?.route?.planInstanceId).toBe(p?.leafExecutorInstanceId);
      expect(p?.selectedStep?.planInstanceId).toBe(p?.leafExecutorInstanceId);
      expect(hash(f.input)).toBe(before);
    },
  );
  it.each(["g31", "g24"])("retains actual paid-route funding in %s", (key) => {
    const f = capture(key),
      event = candidates(f.input).find(
        (c) => c.actionId === f.observedActionId,
      )!,
      targets = evaluateRunnerRunTargets({ input: f.input }),
      sid = event.runProjectionSummary!.serverId!;
    expect(Object.values(f.validation).every(Boolean)).toBe(true);
    expect(
      runnerCardRunHasVisibleDifferentialPayoff(f.input, event, sid, targets),
    ).toBe(true);
    restoreAiRuntimeCheckpoint(
      f.input,
      f.input.ownDeckSnapshot!.deckSnapshotId,
      f.runtime,
    );
    const d = chooseAiAction(f.input);
    expect(d.actionId).toBe(f.observedActionId);
    expect(d.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
      "runner.pressure_central",
    );
    expect(d.decisionDebug?.planFirstDecision?.route?.actionId).toBe(
      d.actionId,
    );
  });
});
