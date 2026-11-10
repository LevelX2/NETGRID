import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../input-dto";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import { releaseAiMatchRuntime } from "./match-runtime-memory";
import { assessTraceBidCandidates } from "./trace-bid-assessment";
import { latestTraceContext } from "./trace-context";
import { evaluateRunnerRunTargets } from "../runner-run-target-evaluation";

function capture(name: string) {
  const saved = JSON.parse(
    readFileSync(
      new URL(
        `../../../../data/scenarios/ai-decision-checkpoints/cp-manual-20261110-${name}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: Parameters<typeof restoreAiRuntimeCheckpoint>[2];
    validation: Record<string, boolean>;
  };
  expect(Object.values(saved.validation).every(Boolean)).toBe(true);
  const input = {
    ...structuredClone(saved.input),
    ...buildAiDecisionInputDto(structuredClone(saved.input)),
  };
  if (!input.ownDeckSnapshot) throw new Error("manual_checkpoint_deck_missing");
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    structuredClone(saved.runtime),
  );
  restoreResidentPlanPortfolioMemorySnapshot(
    input,
    structuredClone(saved.runtime.residentPlanPortfolio),
  );
  return input;
}
afterEach(() => {
  releaseAiMatchRuntime("match_d267bfa05c3e26cf");
  releaseAiMatchRuntime("match_c6267076d5b8feb4");
});

it("passes the captured Classic profile into the known-path trace hazard quote", () => {
  const input = capture("runner-d44");
  expect(input.playerView.traceRulesProfile).toBe("classic_blind");
  const target = evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === "runner.start_run.hq",
  )!;
  const hazard = target.visibleIceRunHazards!.find(
    (h) => h.kind === "trace_tag",
  )!;
  expect(hazard.evidence).toContain(
    "visible_trace_rules_profile:classic_blind",
  );
  expect(hazard.traceBaseStrength).toBe(0);
  expect(hazard.runnerTraceCapacity).toBe(0);
});

it("caps the historical Classic Hunter bid at the cheapest guaranteed fixed effect", () => {
  const input = capture("corp-d14");
  const before = JSON.stringify(input);
  const context = latestTraceContext(input);
  expect(context.runnerMaximumPreRevealStrength).toBe(0);
  const result = assessTraceBidCandidates(
    input,
    input.playerView.pendingChoice!,
    context,
  )!;
  expect(result.assessment.rationalTarget).toBe(1);
  expect(result.candidates.every((c) => c.bid <= 1)).toBe(true);
  expect(JSON.stringify(input)).toBe(before);
});

it("keeps the last distinct tag enabler over redundant payoffs in the captured discard", () => {
  const input = capture("corp-d37");
  const result = chooseAiAction(input);
  expect(result.actionId).toBe("corp.resolve_choice");
  expect(result.selectedChoices?.choiceId).toBe(
    input.playerView.pendingChoice!.choiceId,
  );
  expect(result.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    "plan:corp.hand_and_agenda_management:discard-window%3Adiscard_corp_75%3A75",
  );
  expect(result.decisionDebug?.planFirstDecision?.leafExecutorInstanceId).toBe(
    "plan:corp.hand_and_agenda_management:discard-window%3Adiscard_corp_75%3A75",
  );
  expect(result.selectedChoices?.selectedOptionIds).not.toContain(
    "card_corp_onr_v1_306_trojan-horse_3",
  );
  expect(result.fallbackUsed).toBeFalsy();
});
