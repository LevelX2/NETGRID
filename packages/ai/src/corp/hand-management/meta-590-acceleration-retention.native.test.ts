import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
afterEach(resetResidentPlanPortfolioMemory);
it.each([
  {
    name: "funded next-turn matchpoint support",
    points: 5,
    credits: 10,
    runnerPoints: 0,
    keep: true,
  },
  {
    name: "exact credit floor",
    points: 5,
    credits: 7,
    runnerPoints: 0,
    keep: true,
  },
  {
    name: "ordinary nonterminal agenda retention",
    points: 0,
    credits: 10,
    runnerPoints: 0,
    keep: false,
  },
  {
    name: "unfunded accelerator plus advancement",
    points: 5,
    credits: 6,
    runnerPoints: 0,
    keep: false,
  },
  {
    name: "immediate terminal Archives exposure",
    points: 5,
    credits: 10,
    runnerPoints: 5,
    keep: false,
  },
])("$name", ({ points, credits, runnerPoints, keep }) => {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta590-overtime-discard.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(cp.validation).every(Boolean)).toBe(true);
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  input.playerView.own.agendaPoints = points;
  input.playerView.own.credits = credits;
  input.playerView.opponent.agendaPoints = runnerPoints;
  const view = JSON.stringify(input.playerView),
    legal = JSON.stringify(input.legalActions);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const d = chooseAiAction(input),
    root =
      "plan:corp.hand_and_agenda_management:discard-window%3Adiscard_corp_221%3A221";
  expect(d.actionId).toBe("corp.resolve_choice");
  expect(d.selectedChoices).toEqual({
    choiceId: "discard_corp_221",
    selectedOptionIds: [
      keep
        ? "card_corp_onr_proteus_007_project-venice_1"
        : "card_corp_onr_v1_297_overtime-incentives_1",
    ],
  });
  expect(d.decisionDebug!.planFirstDecision!).toMatchObject({
    rootPlanInstanceId: root,
    leafExecutorInstanceId: root,
    selectedPlan: {
      moduleId: "corp.hand_and_agenda_management",
      phase: "discard_window",
    },
    selectedStep: { stepId: root + ":discard_window" },
    route: { actionId: "corp.resolve_choice", stateVersion: 221 },
  });
  expect(d).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
  expect(JSON.stringify(input.playerView)).toBe(view);
  expect(JSON.stringify(input.legalActions)).toBe(legal);
});
