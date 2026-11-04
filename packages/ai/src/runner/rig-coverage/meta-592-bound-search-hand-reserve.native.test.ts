import fs from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  residentPlanPortfolioSnapshot,
  resetResidentPlanPortfolioMemory,
} from "../../plans/resident-plan-portfolio-memory";
afterEach(resetResidentPlanPortfolioMemory);
it("does not require a fifth card for another R&D run before the bound four-card terminal Remote search (SP-757)", () => {
  const cp = JSON.parse(
    fs.readFileSync(
      new URL(
        "../../runtime/test-fixtures/meta592-r8-g17-d554-other-run-hand-reserve.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const before = JSON.stringify(input),
    z = chooseAiAction(input);
  expect(JSON.stringify(input)).toBe(before);
  expect(z.fallbackUsed || z.timeoutUsed).toBe(false);
  expect(z.actionId).toContain("sneak-preview");
  expect(z.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
    "runner.rig_and_coverage",
  );
  const p = residentPlanPortfolioSnapshot(input)!,
    gap = p.instances
      .filter((x) => x.moduleId === "runner.rig_and_coverage")
      .map((x) => (x.moduleState as any).gap)
      .find((x) => x.targetRunActionId === "runner.start_run.remote_3");
  expect(gap.priorityClass).toBe("P2");
  expect(gap.directSearchActionIds).toContain(z.actionId);
});
import {
  applyAction,
  getLegalActions,
  getPlayerView,
  hashGameState,
  validateGameState,
} from "../../../../engine/src/index";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
it("uses the bound hand reserve through actual Sneak, Heap, Rent and Remote Engine actions twice", () => {
  const cp = JSON.parse(
      fs.readFileSync(
        new URL(
          "../../runtime/test-fixtures/meta592-r8-g17-d554-other-run-hand-reserve.json",
          import.meta.url,
        ),
        "utf8",
      ),
    ),
    origin = cp.engineOrigin,
    proofs: any[] = [];
  expect(origin.checkedStates).toBe(554);
  for (let repeat = 0; repeat < 2; repeat++) {
    resetResidentPlanPortfolioMemory();
    let state = structuredClone(origin.state),
      first = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
    first.planningStateIdentity = buildPlanningStateIdentity(first);
    restoreAiRuntimeCheckpoint(
      first,
      first.ownDeckSnapshot.deckSnapshotId,
      cp.runtime,
    );
    const turn = first.playerView.turnSerial,
      steps: any[] = [];
    for (let i = 0; i < 100 && !state.winner; i++) {
      const side = getLegalActions(state, "runner").length ? "runner" : "corp";
      const input =
        i === 0
          ? first
          : buildAiDecisionInput(state, side, {
              difficulty: "hard",
              ownDeckSnapshot:
                side === "runner" ? cp.input.ownDeckSnapshot : origin.corpDeck,
            });
      if (input.playerView.turnSerial !== turn) break;
      const before = JSON.stringify(input),
        z = chooseAiAction(input),
        a = getLegalActions(state, side).find((a) => a.actionId === z.actionId);
      expect(JSON.stringify(input)).toBe(before);
      expect(z.fallbackUsed || z.timeoutUsed).toBe(false);
      expect(a).toBeDefined();
      steps.push({
        sv: state.stateVersion,
        side,
        action: a!.actionId,
        type: a!.type,
        choices: z.selectedChoices,
        owner: z.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
      });
      const r = applyAction(state, {
        matchId: state.matchId,
        side,
        actionId: a!.actionId,
        clientKnownStateVersion: state.stateVersion,
        ...(z.selectedChoices ? { selectedChoices: z.selectedChoices } : {}),
      });
      expect(r.ok).toBe(true);
      if (!r.ok) throw Error(r.error.message);
      state = r.state;
      expect(validateGameState(state).ok).toBe(true);
      if (getPlayerView(state, "runner").own.agendaPoints > 5) break;
    }
    proofs.push({
      checkedStates: origin.checkedStates,
      steps,
      runnerPoints: getPlayerView(state, "runner").own.agendaPoints,
      corpPoints: getPlayerView(state, "runner").opponent.agendaPoints,
      hash: hashGameState(state),
      winner: state.winner,
    });
  }
  expect(proofs[0].steps[0].action).toContain("sneak-preview");
  expect(
    proofs[0].steps.some((s: any) => s.action === "runner.start_run.remote_3"),
  ).toBe(true);
  expect(proofs.map((x) => x.runnerPoints)).toEqual([6, 6]);
  expect(proofs[0].hash).toBe(proofs[1].hash);
});

it("retains the actual Remote and confirmed damage hand floor when no draw remains", () => {
  const cp = JSON.parse(
      fs.readFileSync(
        new URL(
          "../../runtime/test-fixtures/meta592-r8-g17-d554-other-run-hand-reserve.json",
          import.meta.url,
        ),
        "utf8",
      ),
    ),
    state = structuredClone(cp.engineOrigin.state),
    card = cp.input.playerView.own.gripOrHq.find(
      (c: any) => c.definitionId === "onr_proteus_133_chiba-bank-account",
    ),
    action = getLegalActions(state, "runner").find(
      (a) => a.type === "install_card" && a.source === card.instanceId,
    );
  expect(action).toBeDefined();
  const r = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId: action!.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  expect(r.ok).toBe(true);
  if (!r.ok) throw Error(r.error.message);
  expect(validateGameState(r.state).ok).toBe(true);
  resetResidentPlanPortfolioMemory();
  const input = buildAiDecisionInput(r.state, "runner", {
    difficulty: "hard",
    ownDeckSnapshot: cp.input.ownDeckSnapshot,
  });
  expect(input.playerView.own.gripOrHq.length).toBe(4);
  expect(input.playerView.own.stackOrRdCount).toBe(0);
  const before = JSON.stringify(input),
    z = chooseAiAction(input);
  expect(JSON.stringify(input)).toBe(before);
  expect(z.fallbackUsed || z.timeoutUsed).toBe(false);
  expect(z.actionId).not.toContain("sneak-preview");
  const p = residentPlanPortfolioSnapshot(input)!,
    gaps = p.instances
      .filter((x) => x.moduleId === "runner.rig_and_coverage")
      .map((x) => (x.moduleState as any).gap);
  expect(
    gaps.some(
      (g) =>
        g.targetRunActionId === "runner.start_run.remote_3" &&
        g.recoveryEvidenceCodes?.some((s: string) =>
          s.endsWith("search_run_and_hand_preparation_do_not_fit"),
        ),
    ),
  ).toBe(true);
});
