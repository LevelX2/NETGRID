import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import type { DeckDefinition, GameState } from "@netgrid/shared";
import { metaTenStandardDecks as catalog } from "../evaluation/meta-ten-standard-decks.test-support";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { buildAiDecisionInput } from "./ai-decision-input";
import { buildAiDecisionInputDto } from "../input-dto";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "./visible-source-definitions";
import { runnerProgramSearchStrategyDevelopmentSignals } from "../runner/hand-development/development-signals";
import { runnerDevelopmentSearchTargetIsExecutable } from "../runner/hand-development/development-search-feasibility";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";

const checkpoint = JSON.parse(
  readFileSync(
    new URL(
      "../evaluation/decision-checkpoints/fixtures/meta-ten-repairs/506-g2-d63.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const locker = "onr_proteus_128_airport-locker";
const sneak = "onr_v1_110_sneak-preview";
const temple = "onr_v1_114_temple-microcode-outlet";
const cloak = "onr_v1_011_cloak";
const vewy = "onr_v1_071_vewy-vewy-quiet";
const smc = "onr_v1_059_self-modifying-code";
function fixture(credits: number, fullMemory = false, prepareSmc = false) {
  const runner = catalog.decks.find(
    (d) =>
      d.standardDeckId === "standard_runner_rent_i_con_shellspiel_2026_07_17",
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
  const runnerDeck = deck(runner);
  if (prepareSmc) runnerDeck.cards.push({ id: smc, quantity: 1 });
  let state = createGameAfterSetup({
    seed: "meta506-source-specific-executability",
    runnerDeck,
    corpDeck: deck(corp),
  });
  state.activeSide = "runner";
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  const builder = RealEngineFixtureBuilder.forState(state)
    .withRunnerCredits(30)
    .withRunnerClicks(4)
    .withRunnerGripSize(0)
    .withRunnerCardInGrip("onr_classic_031_rent-i-con")
    .withRunnerCardInGrip("onr_v1_035_invisibility")
    .withRunnerResourceInstalled(locker)
    .withRunnerCardInGrip(sneak)
    .withRunnerCardInGrip(temple);
  if (fullMemory) builder.withRunnerCardInGrip(vewy);
  if (prepareSmc) builder.withRunnerCardInGrip(smc);
  // Real installations maintain the Engine's MU accounting, including payment.
  for (const definition of [
    "onr_classic_031_rent-i-con",
    "onr_v1_035_invisibility",
    ...(fullMemory ? [vewy] : []),
  ]) {
    const cardId = state.runner.grip.find(
      (id) => state.cardInstances[id]!.definitionId === definition,
    )!;
    const action = getLegalActions(state, "runner").find(
      (a) => a.type === "install_card" && a.payload?.cardId === cardId,
    )!;
    state = apply(state, action.actionId);
    expect(state.pendingChoice).toBeUndefined();
  }
  RealEngineFixtureBuilder.forState(state)
    .withRunnerCredits(credits)
    .withRunnerClicks(4);
  if (prepareSmc) state.runner.memoryLimit = 5;
  const ownDeckSnapshot = structuredClone(checkpoint.input.ownDeckSnapshot);
  if (prepareSmc) ownDeckSnapshot.cards.push({ cardId: smc, quantity: 1 });
  const raw = buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    ownDeckSnapshot,
    eventTail: state.eventLog,
  });
  const input = {
    ...raw,
    ...buildAiDecisionInputDto(raw),
    ownRunnerStrategicIntent: checkpoint.input.ownRunnerStrategicIntent,
  } as AiDecisionInputWithDeckCapabilities;
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "runner",
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
  return {
    state,
    input,
    candidates,
    signals: runnerProgramSearchStrategyDevelopmentSignals(
      input,
      candidates,
      input.ownRunnerStrategicIntent!,
      [],
      [],
    ),
  };
}
it("prepares the actual SMC source without claiming its installation already searches", () => {
  const { state, signals, input } = fixture(9, false, true);
  const setup = signals.find((s) => s.definitionId === smc)!;
  expect(setup).toMatchObject({
    targetKind: "card",
    purposeCode: "prepare_program_search_recurring_breaker_economy",
  });
  expect(setup.programSearchCommitment).toBeUndefined();
  const action = input.legalActions.find(
    (a) =>
      setup.actionIds.includes(a.actionId) &&
      a.payload?.runnerProgramTrashBeforeInstall !== true,
  )!;
  expect(action.type).toBe("install_card");
  expect(action.expiresAtStateVersion).toBe(state.stateVersion);
  const next = apply(state, action.actionId);
  expect(next.pendingChoice).toBeUndefined();
  expect(next.runner.credits).toBe(7);
  expect(next.runner.memoryUsed).toBe(5);
  expect(
    next.runner.rig.programs.map((id) => next.cardInstances[id]!.definitionId),
  ).toContain(smc);
  expect(
    next.runner.rig.programs.map((id) => next.cardInstances[id]!.definitionId),
  ).not.toContain(vewy);
});
function apply(
  state: GameState,
  actionId: string,
  selectedChoices?: { choiceId: string; selectedOptionIds: string[] },
) {
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId,
    clientKnownStateVersion: state.stateVersion,
    ...(selectedChoices ? { selectedChoices } : {}),
  });
  if (!result.ok) throw Error(result.error.message);
  return result.state;
}
function complete(state: GameState, target: string) {
  for (let step = 0; step < 6 && state.pendingChoice; step++) {
    const choice = buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
      ownDeckSnapshot: checkpoint.input.ownDeckSnapshot,
      eventTail: state.eventLog,
    }).playerView.pendingChoice!;
    const targetOption = choice.options.find(
      (o) => o.selectable !== false && o.card?.definitionId === target,
    );
    const stackOption = choice.options.find(
      (o) => o.selectable !== false && o.id === "source_stack",
    );
    const noPaymentOption = choice.options.find(
      (o) => o.selectable !== false && o.id === "none",
    );
    const option = targetOption ?? stackOption ?? noPaymentOption;
    if (!option)
      throw Error("No exact source/target option in " + choice.choiceId);
    const action = getLegalActions(state, "runner").find(
      (a) => a.type === "resolve_choice",
    )!;
    state = apply(state, action.actionId, {
      choiceId: choice.choiceId,
      selectedOptionIds: [option.id],
    });
  }
  expect(state.pendingChoice).toBeUndefined();
  return state;
}
it("binds each actual source to its affordable target, preserving free installation", () => {
  const { state, input, candidates, signals } = fixture(9);
  const paid = signals.find((s) => s.definitionId === locker)!;
  const free = signals.find((s) => s.definitionId === sneak)!;
  expect(paid.programSearchCommitment?.targetDefinitionId).toBe(vewy);
  expect(free.programSearchCommitment?.targetDefinitionId).toBe(cloak);
  const source = candidates.find(
    (c) =>
      c.sourceDefinitionId === locker && paid.actionIds.includes(c.actionId),
  )!;
  expect(runnerDevelopmentSearchTargetIsExecutable(input, source, cloak)).toBe(
    false,
  );
  for (const [signal, target, remaining] of [
    [paid, vewy, 0],
    [free, cloak, 6],
  ] as const) {
    const installed = complete(
      apply(structuredClone(state), signal.actionIds[0]!),
      target,
    );
    expect(installed.runner.credits).toBe(remaining);
    expect(
      installed.runner.rig.programs.map(
        (id) => installed.cardInstances[id]!.definitionId,
      ),
    ).toContain(target);
  }
});
it("does not promise direct installation without MU while retaining staged searches", () => {
  const { input, candidates, signals } = fixture(9, true);
  expect(input.playerView.own.memoryUsed).toBe(4);
  expect(
    signals.filter(
      (s) => s.definitionId === locker || s.definitionId === sneak,
    ),
  ).toHaveLength(0);
  const staged = signals.find((s) => s.definitionId === temple)!;
  expect(staged.programSearchCommitment?.targetDefinitionId).toBe(cloak);
  const source = candidates.find(
    (c) =>
      c.sourceDefinitionId === temple && staged.actionIds.includes(c.actionId),
  )!;
  expect(runnerDevelopmentSearchTargetIsExecutable(input, source, cloak)).toBe(
    true,
  );
});
it.each(["source_version", "missing_mode", "conflicting_mode", "missing_mu"])(
  "fails closed for the actual source's %s boundary",
  (boundary) => {
    const { input, candidates } = fixture(9);
    const candidate = candidates.find(
      (c) =>
        c.sourceDefinitionId === locker &&
        c.actionType === "activated_card_ability",
    )!;
    expect(candidate).toBeDefined();
    if (boundary === "source_version")
      input.legalActions.find((a) => a.actionId === candidate.actionId)!
        .expiresAtStateVersion++;
    if (boundary === "missing_mu") delete input.playerView.own.memoryUsed;
    if (boundary === "missing_mode")
      candidate.functionalEffects = candidate.functionalEffects!.map((e) =>
        e.kind === "install"
          ? (({ installCost: _removed, ...rest }) => rest)(e)
          : e,
      );
    if (boundary === "conflicting_mode")
      candidate.functionalEffects = [
        ...candidate.functionalEffects!,
        {
          kind: "install",
          timing: "action",
          scope: "installed_card",
          target: "program",
          installCost: "free",
        },
      ];
    expect(() =>
      runnerDevelopmentSearchTargetIsExecutable(input, candidate, vewy),
    ).toThrow(/invalid_plan_identity/);
  },
);
