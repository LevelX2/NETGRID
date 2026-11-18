import { createHash } from "node:crypto";
import { withCurrentPrintedLockCompanion } from "./current-printed-lock.test-support";
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
  const current = withCurrentPrintedLockCompanion(f.input);
  return {
    ...f,
    historicalValidation: f.validation,
    input: { ...current, ...buildAiDecisionInputDto(current) },
  };
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
describe("current-rule companions for captured run-credit differential payoff", () => {
  beforeEach(resetResidentPlanPortfolioMemory);
  it.each(["g13", "g25", "g33"])(
    "does not call unused credits or self damage a benefit in %s",
    (key) => {
      const f = capture(key),
        event = candidates(f.input).find(
          (c) => c.actionId === f.observedActionId,
        )!,
        targets = evaluateRunnerRunTargets({ input: f.input });
      expect(Object.keys(f.historicalValidation)).toHaveLength(9);
      expect(Object.values(f.historicalValidation).every(Boolean)).toBe(true);
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
      expect(candidates(f.input).find((c) => c.actionId === a.actionId)?.sourceDefinitionId).not.toBe(310);
      const p = d.decisionDebug?.planFirstDecision;
      if (key === "g13") {
        expect(a.type).toBe("draw_card");
        expect(p?.selectedPlan).toMatchObject({
          moduleId: "runner.develop_board_and_hand",
          evidenceCodes: expect.arrayContaining(["runner_hand_rotation_status:known_rotation_target_available"]),
        });
      } else {
        expect(a.actionId).toBe("rs.archives");
        expect(p?.selectedPlan?.moduleId).toBe("runner.pressure_central");
      }
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
  it.each(["g31", "g24"])("distinguishes paid access from a paid information probe in %s", (key) => {
    const f = capture(key),
      event = candidates(f.input).find(
        (c) => c.actionId === f.observedActionId,
      )!,
      targets = evaluateRunnerRunTargets({ input: f.input }),
      sid = event.runProjectionSummary!.serverId!;
    expect(Object.values(f.historicalValidation).every(Boolean)).toBe(true);
    expect(
      runnerCardRunHasVisibleDifferentialPayoff(f.input, event, sid, targets),
    ).toBe(true);
    restoreAiRuntimeCheckpoint(
      f.input,
      f.input.ownDeckSnapshot!.deckSnapshotId,
      f.runtime,
    );
    const d = chooseAiAction(f.input);
    if (key === "g31") {
      expect(d.actionId).toBe(f.observedActionId);
      expect(d.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
        "runner.pressure_central",
      );
    } else {
      expect(candidates(f.input).find((c) => c.actionId === d.actionId)?.sourceDefinitionId).toBe(257);
      expect(d.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
        "runner.economy",
      );
      expect(d.decisionDebug?.actionAlternatives).toContainEqual(
        expect.objectContaining({
          actionId: f.observedActionId,
          whyNot: expect.arrayContaining([
            "runner_central_information_probe_known_path_not_admitted:hq",
          ]),
        }),
      );
    }
    expect(d.decisionDebug?.planFirstDecision?.route?.actionId).toBe(
      d.actionId,
    );
  });
});
