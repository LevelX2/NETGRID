import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { corpScorePriorityClass } from "./corp-score-priority";

function capture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta564-protected-terminal-score.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}

afterEach(resetResidentPlanPortfolioMemory);

it("advances the admitted protected winning agenda before staging another remote", () => {
  const f = capture();
  expect(Object.keys(f.validation)).toHaveLength(9);
  expect(Object.values(f.validation).every(Boolean)).toBe(true);
  const input = f.input;
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    f.runtime,
  );
  const before = JSON.stringify(input);
  const advance = input.legalActions.find(
    (a: { type: string }) => a.type === "advance_card",
  );
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(advance.actionId);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).toBe(false);
  const p = decision.decisionDebug!.planFirstDecision!;
  expect(p.selectedPlan!.moduleId).toBe("corp.score_agenda");
  expect(p.rootPlanInstanceId).toBe(
    "plan:corp.score_agenda:agenda%3Acorp_onr_proteus_006_please-dont-choke-anyone_1%3Aremote_1",
  );
  expect(p.leafExecutorInstanceId).toBe(p.rootPlanInstanceId);
  expect(p.route).toMatchObject({
    actionId: advance.actionId,
    stateVersion: 461,
    planInstanceId: p.leafExecutorInstanceId,
  });
  expect(p.priority!.effectiveClass).toBe("P3");
  expect(JSON.stringify(input)).toBe(before);
});

it("keeps a current win above progress and survival above ordinary development", () => {
  const { admittedScore: signal } = capture();
  expect(corpScorePriorityClass(signal)).toBe("P3");
  expect(corpScorePriorityClass({ ...signal, sameTurnCloseout: true })).toBe(
    "P1",
  );
  expect(
    corpScorePriorityClass({ ...signal, preventsTerminalSteal: true }),
  ).toBe("P2");
  expect(corpScorePriorityClass({ ...signal, terminalScore: false })).toBe(
    "P4",
  );
  expect(corpScorePriorityClass({ ...signal, feasible: false })).toBe("P4");
});
