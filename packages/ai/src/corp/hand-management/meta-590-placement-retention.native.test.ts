import { readFileSync } from "node:fs";
import { applyAction, hashState } from "@netgrid/engine";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { corpGuaranteedOnPlayAdvancementCountersPerTarget } from "../../runtime/corp-canonical-card-facts";
function capture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta590-placement-retention.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}
afterEach(resetResidentPlanPortfolioMemory);
it.each([
  { credits: 5, keep: false },
  { credits: 6, keep: true },
  { credits: 7, keep: true },
  { credits: 8, keep: true },
])(
  "uses remaining regular advancement cost at $credits credits",
  ({ credits, keep }) => {
    const cp = capture();
    expect(Object.values(cp.validation).every(Boolean)).toBe(true);
    expect(cp.verifiedOriginalPrefix.checkedStates).toBe(256);
    expect(hashState(cp.engineState)).toBe(cp.stateHash);
    const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
    input.playerView.own.credits = credits;
    const beforeView = JSON.stringify(input.playerView),
      beforeLegal = JSON.stringify(input.legalActions);
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot.deckSnapshotId,
      cp.runtime,
    );
    const d = chooseAiAction(input),
      root =
        "plan:corp.hand_and_agenda_management:discard-window%3Adiscard_corp_255%3A255";
    expect(d).toMatchObject({
      actionId: "corp.resolve_choice",
      fallbackUsed: false,
      timeoutUsed: false,
    });
    expect(d.selectedChoices?.selectedOptionIds).toEqual(
      keep
        ? [
            "card_corp_onr_proteus_021_dog-pile_1",
            "card_corp_onr_proteus_007_project-venice_1",
          ]
        : [
            "card_corp_onr_v1_304_systematic-layoffs_1",
            "card_corp_onr_proteus_021_dog-pile_1",
          ],
    );
    expect(d.decisionDebug!.planFirstDecision!).toMatchObject({
      rootPlanInstanceId: root,
      leafExecutorInstanceId: root,
      selectedPlan: {
        moduleId: "corp.hand_and_agenda_management",
        phase: "discard_window",
      },
      route: { actionId: "corp.resolve_choice", stateVersion: 255 },
    });
    expect(JSON.stringify(input.playerView) === beforeView).toBe(true);
    expect(JSON.stringify(input.legalActions) === beforeLegal).toBe(true);
    if (credits === 6) {
      const z = applyAction(cp.engineState, {
        matchId: cp.engineState.matchId,
        side: "corp",
        actionId: d.actionId!,
        clientKnownStateVersion: 255,
        selectedChoices: d.selectedChoices!,
      });
      expect(z.ok).toBe(true);
    }
  },
);
it("does not treat distinct-target counters or generated actions as unrestricted counters", () => {
  expect(
    corpGuaranteedOnPlayAdvancementCountersPerTarget(
      "onr_v1_304_systematic-layoffs",
    ),
  ).toBe(2);
  expect(
    corpGuaranteedOnPlayAdvancementCountersPerTarget(
      "onr_v1_292_management-shake-up",
    ),
  ).toBe(3);
  expect(
    corpGuaranteedOnPlayAdvancementCountersPerTarget(
      "onr_v1_305_team-restructuring",
    ),
  ).toBe(1);
  expect(
    corpGuaranteedOnPlayAdvancementCountersPerTarget(
      "onr_v1_297_overtime-incentives",
    ),
  ).toBe(0);
  expect(
    corpGuaranteedOnPlayAdvancementCountersPerTarget(
      "onr_v1_312_chicago-branch",
    ),
  ).toBe(0);
});
