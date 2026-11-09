import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  getPlayerView,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import type { GameState } from "@netgrid/shared";
import {
  chooseAiAction,
  aiLiveRuntimeDependencies,
} from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInput } from "./ai-decision-input";
import { buildPlanningStateIdentity } from "../plans/turn-planning-contracts";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { runnerSameTurnInstallProjection } from "../runner/rig-coverage/coverage-same-turn-install-projection";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { createRunnerProgramInstallTrashContext } from "./runner-program-install-trash-context";
import { AI_HINTS_BY_CARD } from "../ai-hints";
import { cardRolesForId } from "./card-role-lookup";

afterEach(resetResidentPlanPortfolioMemory);
const installServices = createRunnerProgramInstallTrashContext({
  ...aiLiveRuntimeDependencies,
  rolesForCardId: (id) => cardRolesForId(id, AI_HINTS_BY_CARD),
});
function original() {
  return JSON.parse(
    readFileSync(
      new URL(
        "./test-fixtures/meta-570-full-memory-preparation.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}
// This test executes a bounded native AI/Engine chain, not one decision.
// The unchanged source and the source-retention fix both finish in about 6 s.
it("replaces the acceptable redundant program, funds and wins the original remote in the same turn", () => {
  const saved = original();
  expect(saved.provenance.checkedStates).toBe(542);
  expect(
    Object.values(saved.checkpoint.validation).every((v) => v === true),
  ).toBe(true);
  expect(hashState(saved.state)).toBe(saved.checkpoint.stateHash);
  let state: GameState = saved.state;
  const initial = state;
  const heads: string[] = [];
  const root = "plan:runner.contest_remote:remote%3Aremote_1";
  for (let n = 0; n < 80 && !state.winner; n++) {
    const side = state.activeSide;
    const input =
      n === 0
        ? structuredClone(saved.checkpoint.input)
        : buildAiDecisionInput(state, side, {
            difficulty: "hard",
            eventTail: state.eventLog,
            ownDeckSnapshot: saved.deckSnapshots[side],
          });
    input.planningStateIdentity = buildPlanningStateIdentity(input);
    if (n === 0)
      restoreAiRuntimeCheckpoint(
        input,
        input.ownDeckSnapshot.deckSnapshotId,
        saved.checkpoint.runtime,
      );
    const before = JSON.stringify(input),
      decision = chooseAiAction(input);
    expect(JSON.stringify(input)).toBe(before);
    expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
    const action = input.legalActions.find(
      (a: any) => a.actionId === decision.actionId,
    );
    expect(action).toBeDefined();
    if (n < 4) {
      heads.push(action.type);
      expect(
        decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
      ).toBe(root);
    }
    if (n === 1) {
      expect(action.payload.runnerProgramTrashBeforeInstall).toBe(true);
      expect(action.source).toContain("codecracker");
    }
    if (n === 2)
      expect(decision.selectedChoices?.selectedOptionIds).toEqual([
        expect.stringContaining("vienna-22"),
      ]);
    const result = applyAction(state, {
      matchId: state.matchId,
      side,
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(decision.selectedChoices
        ? { selectedChoices: decision.selectedChoices }
        : {}),
    });
    if (!result.ok) throw Error(result.error.message);
    state = result.state;
  }
  expect(heads).toEqual([
    "gain_credit",
    "install_card",
    "resolve_choice",
    "start_run",
  ]);
  expect(state.winner).toBe("runner");
  expect(getPlayerView(state, "runner").own).toMatchObject({
    agendaPoints: 9,
    credits: 4,
    clicks: 1,
    memoryUsed: 4,
  });
  expect(
    getPlayerView(state, "runner").own.rig?.map((c) => c.definitionId),
  ).toEqual(
    expect.arrayContaining([
      "onr_v1_039_krash",
      "onr_v1_021_dwarf",
      "onr_v1_014_codecracker",
    ]),
  );
  const replay = replayEvents(
    initial,
    state.eventLog.slice(initial.eventLog.length),
  );
  if (!replay.ok) throw Error("Replay failed");
  expect(hashState(replay.state)).toBe(hashState(state));
}, 15_000);

it.each([
  "unacceptable_sacrifice",
  "missing_native_route",
  "wrong_deficit",
  "lost_memory_provider",
] as const)("does not project an unbound memory release: %s", (boundary) => {
  const { checkpoint } = original(),
    input = checkpoint.input;
  const card = input.playerView.own.gripOrHq.find(
    (c: any) => c.definitionId === "onr_v1_014_codecracker",
  );
  if (boundary === "missing_native_route")
    input.legalActions = input.legalActions.filter(
      (a: any) => a.payload?.runnerProgramTrashBeforeInstall !== true,
    );
  if (boundary === "lost_memory_provider")
    input.playerView.own.rig.find(
      (c: any) => c.definitionId === "onr_proteus_098_vienna-22",
    ).memoryLimitBonus = 1;
  const assessProgramInstallTarget = (
    current: typeof input,
    target: typeof card,
  ) => {
    const assessment =
      installServices.runnerProgramInstallTrashAssessmentForCard(
        current,
        target,
      );
    if (boundary === "unacceptable_sacrifice")
      assessment.selectedCandidates = assessment.selectedCandidates.map(
        (c) => ({ ...c, acceptable: false }),
      );
    if (boundary === "wrong_deficit") assessment.requiredMemoryToFree++;
    return assessment;
  };
  expect(
    runnerSameTurnInstallProjection(
      input,
      buildActionSemanticCandidates({ legalActions: input.legalActions }),
      card,
      { assessProgramInstallTarget },
    ),
  ).toBeUndefined();
});
