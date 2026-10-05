import { afterEach, expect, it } from "vitest";
import {
  createGameAfterSetup,
  applyAction,
  getLegalActions,
  getPlayerView,
  validateGameState,
} from "@netgrid/engine";
import type { DeckDefinition, GameState, LegalAction } from "@netgrid/shared";
import { metaTenStandardDecks as catalog } from "../evaluation/meta-ten-standard-decks.test-support";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { buildAiDecisionInput } from "./ai-decision-input";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
afterEach(resetResidentPlanPortfolioMemory);
const spinal = "onr_classic_048_omnitech-spinal-tap-cybermodem",
  ms = "onr_classic_029_ms-todon";
it("spends genuine general breaker bits on a noisy breaker through the current run owner", () => {
  const runner = catalog.decks.find(
    (d) =>
      d.standardDeckId ===
      "standard_classic_runner_cybernetics_risk_rig_2026_07_01",
  )!;
  const corp = catalog.decks.find(
    (d) =>
      d.standardDeckId ===
      "standard_classic_corp_superserum_control_grid_2026_07_01",
  )!;
  const deck = (d: typeof runner): DeckDefinition => ({
    id: d.standardDeckId,
    name: d.name,
    side: d.side,
    identity: d.identityCardId,
    cards: d.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
  });
  let s = createGameAfterSetup({
    seed: "meta507-general-noisy-credit-owner",
    runnerDeck: deck(runner),
    corpDeck: deck(corp),
  });
  s.activeSide = "runner";
  s.phase = "runner_action_phase";
  s.timingPoint = "runner_action.main";
  RealEngineFixtureBuilder.forState(s)
    .withRunnerCredits(30)
    .withRunnerClicks(4)
    .withRunnerGripSize(0)
    .withRunnerCardInGrip(spinal)
    .withRunnerCardInGrip(ms)
    .withRezzedCorpIceOnServer("hq", "onr_classic_008_deadeye");
  const apply = (a: LegalAction) => {
    const r = applyAction(s, {
      matchId: s.matchId,
      side: a.side,
      actionId: a.actionId,
      clientKnownStateVersion: s.stateVersion,
    });
    if (!r.ok) throw Error(r.error.message);
    s = r.state;
    expect(validateGameState(s)).toEqual({ ok: true, errors: [] });
  };
  for (const id of [spinal, ms]) {
    const a = getLegalActions(s, "runner").find(
      (a) =>
        a.type === "install_card" &&
        s.cardInstances[a.source]?.definitionId === id &&
        !a.payload?.runnerProgramTrashBeforeInstall,
    )!;
    expect(a).toBeDefined();
    apply(a);
  }
  const bits = () =>
    getPlayerView(s, "runner")
      .own.rig!.find((c) => c.definitionId === spinal)!
      .counterDisplays!.find((c) => c.id === "restricted_pool")!.amount;
  expect(bits()).toBe(2);
  apply(
    getLegalActions(s, "runner").find(
      (a) => a.type === "start_run" && a.payload?.serverId === "hq",
    )!,
  );
  const decline = getLegalActions(s, "corp").find(
    (a) => a.type === "decline_rez",
  );
  if (decline) apply(decline);
  const liquid = s.runner.credits;
  for (const remaining of [1, 0]) {
    const input = buildAiDecisionInput(s, "runner", {
      difficulty: "hard",
      decisionId: `general:${s.stateVersion}`,
      ownDeckSnapshot: {
        side: "runner",
        deckSnapshotId: runner.standardDeckId,
        cards: runner.cards,
      },
    });
    const d = chooseAiAction(input);
    expect(d.fallbackUsed).toBe(false);
    expect(d.timeoutUsed).toBe(false);
    const pf = d.decisionDebug!.planFirstDecision!;
    expect(pf.selectedPlan?.moduleId).toBe("runner.convert_run_window");
    expect(pf.route).toMatchObject({
      actionId: d.actionId,
      stateVersion: s.stateVersion,
      planInstanceId: pf.selectedStep!.planInstanceId,
      stepId: pf.selectedStep!.stepId,
    });
    const a = input.legalActions.find((a) => a.actionId === d.actionId)!;
    expect(a.type).toBe("break_subroutine");
    expect(s.cardInstances[a.source]?.definitionId).toBe(ms);
    apply(a);
    expect(bits()).toBe(remaining);
    expect(s.runner.credits).toBe(liquid);
  }
  expect(s.runner.tags).toBe(1);
});
