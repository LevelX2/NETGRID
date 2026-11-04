import fs from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { runnerFutureEncounterDamageJackOutAssessment } from "../../runner-damage-threat-assessment";
import {
  applyAction,
  getLegalActions,
  getPlayerView,
  hashGameState,
  validateGameState,
} from "../../../../engine/src/index";
function capture() {
  const cp = JSON.parse(
    fs.readFileSync(
      new URL(
        "../../runtime/test-fixtures/meta592-r9-g25-d443-future-break-payment.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  return {
    ...cp,
    input: { ...cp.input, ...buildAiDecisionInputDto(cp.input) },
  };
}
afterEach(resetResidentPlanPortfolioMemory);
it("counts the current non-noisy breaker pool for the exact Banpei full break (SP-316)", () => {
  const { input, validation } = capture();
  expect(Object.values(validation)).toEqual(Array(9).fill(true));
  expect(input.playerView.own.credits).toBe(1);
  const before = JSON.stringify(input);
  expect(runnerFutureEncounterDamageJackOutAssessment(input)).toBeUndefined();
  expect(JSON.stringify(input)).toBe(before);
});
it.each([
  "spent_pool",
  "link_only",
  "killer_only",
  "noisy_breaker",
  "unknown_ice",
  "unrezzed_ice",
  "missing_quote",
  "wrong_quote",
  "break_locked",
  "additional_break_cost",
])("retains the future-damage guard for %s", (kind) => {
  const { input } = capture(),
    pool = input.playerView.own.rig[0],
    breaker = input.playerView.own.rig[1],
    ice = input.playerView.servers.find((s: any) => s.id === "remote_1").ice[0];
  if (kind === "spent_pool") {
    pool.counters.bit = 0;
    pool.counterDisplays[0].amount = 0;
  }
  if (kind === "link_only")
    pool.counterDisplays[0].creditPool.uses = ["increase_link"];
  if (kind === "killer_only")
    pool.counterDisplays[0].creditPool.uses = ["using_killer_during_run"];
  if (kind === "noisy_breaker") breaker.subtypes.push("noisy");
  if (kind === "unknown_ice") ice.known = false;
  if (kind === "unrezzed_ice") ice.rezzed = false;
  if (kind === "missing_quote") delete ice.effectiveRunQuote;
  if (kind === "wrong_quote") ice.effectiveRunQuote.iceInstanceId = "other-ice";
  if (kind === "break_locked")
    input.playerView.run.nextEncounterNoBreakSubroutines = true;
  if (kind === "additional_break_cost")
    ice.effectiveRunQuote.breakSubroutineAdditionalCostPerSubroutine = 1;
  expect(runnerFutureEncounterDamageJackOutAssessment(input)).toBeDefined();
});
it("continues under the existing owner and wins through seven actual Engine steps twice", () => {
  const cp = capture(),
    origin = cp.engineOrigin,
    proofs: any[] = [];
  expect(origin.checkedStates).toBe(443);
  for (let repeat = 0; repeat < 2; repeat++) {
    resetResidentPlanPortfolioMemory();
    let state = structuredClone(origin.state),
      first = structuredClone(cp.input);
    restoreAiRuntimeCheckpoint(
      first,
      first.ownDeckSnapshot.deckSnapshotId,
      cp.runtime,
    );
    const turn = first.playerView.turnSerial,
      steps: any[] = [];
    for (let i = 0; i < 30 && !state.winner; i++) {
      const side = getLegalActions(state, "runner").length ? "runner" : "corp",
        input =
          i === 0
            ? first
            : buildAiDecisionInput(state, side, {
                difficulty: "hard",
                ownDeckSnapshot:
                  side === "runner"
                    ? cp.input.ownDeckSnapshot
                    : origin.corpDeck,
              });
      if (input.playerView.turnSerial !== turn) break;
      const before = JSON.stringify(input),
        z = chooseAiAction(input),
        a = getLegalActions(state, side).find((a) => a.actionId === z.actionId);
      expect(JSON.stringify(input)).toBe(before);
      expect(z.fallbackUsed || z.timeoutUsed).toBe(false);
      expect(a).toBeDefined();
      steps.push({
        type: a!.type,
        action: a!.actionId,
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
    }
    proofs.push({
      steps,
      winner: state.winner,
      points: getPlayerView(state, "runner").own.agendaPoints,
      credits: getPlayerView(state, "runner").own.credits,
      hash: hashGameState(state),
    });
  }
  expect(proofs[0].steps[0]).toMatchObject({
    action: "runner.continue_run",
    owner: "runner.convert_run_window",
  });
  expect(proofs[0].steps).toHaveLength(7);
  expect(proofs.map((p) => p.winner)).toEqual(["runner", "runner"]);
  expect(proofs.map((p) => p.points)).toEqual([8, 8]);
  expect(proofs.map((p) => p.credits)).toEqual([1, 1]);
  expect(proofs[0].hash).toBe("fnv1a:a443d243");
  expect(proofs[1].hash).toBe(proofs[0].hash);
});
