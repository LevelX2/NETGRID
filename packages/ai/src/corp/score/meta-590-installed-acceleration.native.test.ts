import { readFileSync } from "node:fs";
import {
  applyAction,
  getLegalActions,
  getPlayerView,
  hashState,
} from "@netgrid/engine";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { sameTurnScoreConversionPreventsTerminalSteal } from "./score-project-signals";
function fixture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta590-installed-acceleration.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}
afterEach(resetResidentPlanPortfolioMemory);
it("finishes the installed terminal-steal agenda before a speculative defense draw despite other HQ agendas", () => {
  const cp = fixture();
  expect(Object.values(cp.validation).every(Boolean)).toBe(true);
  expect(cp.verifiedOriginalPrefix.checkedStates).toBe(223);
  expect(hashState(cp.testEngineState)).toBe(cp.stateHash);
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) },
    before = JSON.stringify(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const decision = chooseAiAction(input),
    root =
      "plan:corp.score_agenda:agenda%3Acorp_onr_v1_206_marine-arcology_1%3Aremote_1";
  expect(decision.actionId).toBe(
    "corp.play_operation.corp_onr_v1_304_systematic-layoffs_2.corp_onr_v1_304_systematic-layoffs_2",
  );
  expect(decision).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
  expect(decision.decisionDebug!.planFirstDecision!).toMatchObject({
    rootPlanInstanceId: root,
    leafExecutorInstanceId: root,
    selectedPlan: { moduleId: "corp.score_agenda", phase: "convert_agenda" },
    priority: { effectiveClass: "P2" },
    route: {
      actionId: decision.actionId,
      stateVersion: 222,
      planInstanceId: root,
    },
  });
  expect(JSON.stringify(input)).toBe(before);
  let state = cp.testEngineState;
  const step = (actionId: string, selectedChoices?: any) => {
    const r = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(selectedChoices ? { selectedChoices } : {}),
    });
    expect(r.ok).toBe(true);
    if (!r.ok) throw Error(JSON.stringify(r.error));
    state = r.state;
  };
  step(decision.actionId!);
  const choice = getPlayerView(state, "corp").pendingChoice!;
  expect(choice.options).toHaveLength(1);
  expect(choice.options[0]!.id).toBe(
    "placement_corp_onr_v1_206_marine-arcology_1_2",
  );
  step(
    getLegalActions(state, "corp").find((a) => a.type === "resolve_choice")!
      .actionId,
    { choiceId: choice.choiceId, selectedOptionIds: [choice.options[0]!.id] },
  );
  step(
    getLegalActions(state, "corp").find((a) => a.type === "advance_card")!
      .actionId,
  );
  step(
    getLegalActions(state, "corp").find((a) => a.type === "score_agenda")!
      .actionId,
  );
  expect(getPlayerView(state, "corp").own).toMatchObject({
    credits: 27,
    clicks: 0,
    agendaPoints: 2,
  });
  expect(state.winner).toBeNull();
});
it.each([1, 2, 3])(
  "uses the installed agenda's actual %s points at the exact terminal threshold",
  (agendaPoints) => {
    const f = {
      agendaPoints,
      targetServerId: "remote_1",
      opponentAgendaPoints: 7 - agendaPoints,
      agendaPointsToWin: 7,
      visibleHqAgendaIds: ["hq-a", "hq-b"],
      agendaCardId: "installed",
      installedAgendaId: "installed",
      hasOtherInstalledAgenda: false,
    };
    expect(sameTurnScoreConversionPreventsTerminalSteal(f)).toBe(true);
    expect(
      sameTurnScoreConversionPreventsTerminalSteal({
        ...f,
        opponentAgendaPoints: 6 - agendaPoints,
      }),
    ).toBe(false);
    expect(
      sameTurnScoreConversionPreventsTerminalSteal({
        ...f,
        installedAgendaId: "other",
      }),
    ).toBe(false);
    expect(
      sameTurnScoreConversionPreventsTerminalSteal({
        ...f,
        hasOtherInstalledAgenda: true,
      }),
    ).toBe(false);
    expect(
      sameTurnScoreConversionPreventsTerminalSteal({
        ...f,
        targetServerId: "new_remote",
      }),
    ).toBe(false);
  },
);
