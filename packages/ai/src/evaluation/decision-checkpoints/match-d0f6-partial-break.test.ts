import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import {
  ORIGINALSET_DEFAULT_DECKS,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  hashGameState,
  replayEvents,
} from "@netgrid/engine";
import {
  installRunnerProgramForTest,
  putCorpIceOnServer,
} from "../../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import { chooseRunnerAction } from "../../index";
import {
  buildAiDecisionInput,
  type AiDecisionInputWithDeckCapabilities,
} from "../../runtime/ai-decision-input";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";
import { currentEncounterMitigationForBreaker } from "../../runtime/runner-encounter-mitigation";
import {
  runnerEncounterCreditBudgetForInput,
  spendRunnerEncounterBreakerCost,
} from "../../runtime/runner-encounter-credit-budget";
import { currentEncounteredIceCard } from "../../runtime/current-encounter";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

describe("match d0f6 partial-break mitigation", () => {
  afterEach(() => resetResidentPlanPortfolioMemory());
  it.each([77, 156])(
    "reproduces decision %s on the current runtime",
    (decisionIndex) => {
      const capture = loadCapture(decisionIndex);
      const input = capture.input;
      restoreAiRuntimeCheckpoint(
        input,
        input.ownDeckSnapshot!.deckSnapshotId,
        capture.runtime,
      );
      const decision = chooseRunnerAction(input);
      const selected = input.legalActions.find(
        (action) => action.actionId === decision.actionId,
      );
      expect(selected?.type).toBe("pump_breaker");
      expect(decision.reasonCode).toBe("plan_first.runner.convert_run_window");
      expect(JSON.stringify(decision.decisionDebug)).toContain(
        "encounter_partial_mitigation:true",
      );
    },
  );
  function loadCapture(decisionIndex: number) {
    return JSON.parse(
      readFileSync(
        new URL(
          `../../../../../data/scenarios/ai-decision-checkpoints/cp-d0f6-${decisionIndex}-partial-break.json`,
          import.meta.url,
        ),
        "utf8",
      ),
    ) as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
  }
  it.each([
    [77, 0, undefined],
    [77, 1, 1],
    [77, 2, 2],
    [77, 3, 2],
    [156, 0, undefined],
    [156, 1, 1],
    [156, 2, 2],
    [156, 3, 3],
  ])(
    "quotes only effective affordable mitigation for checkpoint %s with %s break credits",
    (index, breakCredits, expectedCount) => {
      const input = loadCapture(index!).input;
      const ice = currentEncounteredIceCard(input)!;
      const breaker = input.playerView.own.rig!.find(
        (c) => c.definitionId === "onr_v1_040_loony-goon",
      )!;
      const result = currentEncounterMitigationForBreaker(
        input,
        breaker,
        ice.strength!,
        (cost) => cost <= breakCredits!,
      );
      expect(result?.subroutineIndexes.length).toBe(expectedCount);
      if (result) expect(result.breakCost).toBeLessThanOrEqual(breakCredits!);
    },
  );
  it.each([
    "no_break",
    "full_break",
    "already_broken",
    "zero_damage",
    "prevention",
    "no_harm",
  ])("does not promise partial mitigation for %s", (condition) => {
    const input = loadCapture(77).input;
    const ice = currentEncounteredIceCard(input)!;
    const breaker = input.playerView.own.rig!.find(
      (c) => c.definitionId === "onr_v1_040_loony-goon",
    )!;
    const continueAction = input.legalActions.find(
      (a) => a.payload?.encounterContinue === true,
    )!;
    if (condition === "no_break")
      input.playerView.run!.noBreakSubroutinesActive = true;
    if (condition === "full_break")
      continueAction.payload!.encounterFullBreakDamage = 2;
    if (condition === "already_broken") {
      continueAction.payload!.encounterSubroutineIds =
        ice.effectiveRunQuote!.subroutines.at(-1)!.id;
      continueAction.payload!.unbrokenSubroutineCount = 1;
    }
    if (condition === "zero_damage")
      for (const s of ice.effectiveRunQuote!.subroutines)
        if (s.type === "do_damage") s.amount = 0;
    if (condition === "prevention")
      input.playerView.own.freeNetOrCoreDamagePreventionRemaining = 2;
    if (condition === "no_harm")
      for (const s of ice.effectiveRunQuote!.subroutines)
        s.type = "end_the_run";
    expect(
      currentEncounterMitigationForBreaker(
        input,
        breaker,
        ice.strength!,
        () => true,
      ),
    ).toBeUndefined();
  });
  it("requires all three trash breaks when only one installed program can be lost", () => {
    const input = loadCapture(156).input;
    const ice = currentEncounteredIceCard(input)!;
    const breaker = input.playerView.own.rig!.find(
      (c) => c.definitionId === "onr_v1_040_loony-goon",
    )!;
    input.playerView.own.rig = [breaker];
    expect(
      currentEncounterMitigationForBreaker(
        input,
        breaker,
        ice.strength!,
        (cost) => cost <= 2,
      ),
    ).toBeUndefined();
    expect(
      currentEncounterMitigationForBreaker(
        input,
        breaker,
        ice.strength!,
        (cost) => cost <= 3,
      )?.after.programsTrashed,
    ).toBe(0);
  });
  it.each([
    "onr_v1_007_blink",
    "onr_v1_005_bartmoss-memorial-icebreaker",
    "onr_proteus_088_fubar",
  ])(
    "does not label the unresolved self-cost of %s as guaranteed mitigation",
    (definitionId) => {
      const input = loadCapture(156).input;
      const ice = currentEncounteredIceCard(input)!;
      const breaker = input.playerView.own.rig!.find(
        (c) => c.definitionId === "onr_v1_040_loony-goon",
      )!;
      breaker.definitionId = definitionId;
      breaker.subtypes = ["icebreaker"];
      breaker.selectedSubtype = "sentry";
      expect(
        currentEncounterMitigationForBreaker(
          input,
          breaker,
          ice.strength!,
          () => true,
        ),
      ).toBeUndefined();
    },
  );
  it("includes additional break fees and reuses only the current eligible pools", () => {
    const input = loadCapture(156).input;
    const ice = currentEncounteredIceCard(input)!;
    const breaker = input.playerView.own.rig!.find(
      (c) => c.definitionId === "onr_v1_040_loony-goon",
    )!;
    ice.effectiveRunQuote!.breakSubroutineAdditionalCostPerSubroutine = 2;
    input.playerView.own.credits = 0;
    input.playerView.run!.badPublicityCredits = 3;
    const assess = () =>
      currentEncounterMitigationForBreaker(
        input,
        breaker,
        ice.strength!,
        (cost) =>
          spendRunnerEncounterBreakerCost({
            input,
            breakerId: breaker.instanceId,
            budget: runnerEncounterCreditBudgetForInput(input),
            cost,
          }).affordable,
      );
    expect(assess()?.breakCost).toBe(3);
    expect(assess()?.subroutineIndexes).toHaveLength(1);
    input.playerView.run!.badPublicityCredits = 0;
    expect(assess()).toBeUndefined();
  });
  it("rejects missing remaining IDs and missing damage amounts explicitly", () => {
    const input = loadCapture(77).input;
    const ice = currentEncounteredIceCard(input)!;
    const breaker = input.playerView.own.rig!.find(
      (c) => c.definitionId === "onr_v1_040_loony-goon",
    )!;
    const action = input.legalActions.find(
      (a) => a.payload?.encounterContinue === true,
    )!;
    const ids = action.payload!.encounterSubroutineIds;
    if (typeof ids !== "string")
      throw new Error("Capture is missing exact remaining subroutine IDs.");
    delete action.payload!.encounterSubroutineIds;
    const assess = () =>
      currentEncounterMitigationForBreaker(
        input,
        breaker,
        ice.strength!,
        () => true,
      );
    expect(assess).toThrow("missing_action_semantics");
    action.payload!.encounterSubroutineIds = ids;
    delete ice.effectiveRunQuote!.subroutines.find(
      (s) => s.type === "do_damage",
    )!.amount;
    expect(assess).toThrow("missing_action_semantics");
  });
  it.each([
    ["onr_v1_280_zombie", 6, 4, 2],
    ["onr_proteus_015_colonel-failure", 8, 6, 2],
  ] as const)(
    "proves the complete mitigation sequence with Engine actions for %s",
    (iceDefinitionId, credits, pumps, breaks) => {
      let state = mechanismEncounter(iceDefinitionId, credits);
      const initial = structuredClone(state);
      const eventStart = state.eventLog.length;
      const grip = [...state.runner.grip];
      for (let i = 0; i < pumps; i++)
        state = applyMatching(
          state,
          (a) => a.type === "pump_breaker" && a.source?.includes("loony-goon"),
        );
      for (let i = 0; i < breaks; i++)
        state = applyMatching(
          state,
          (a) =>
            a.type === "break_subroutine" &&
            a.source?.includes("loony-goon") &&
            a.payload?.subroutineIndex === i,
        );
      for (let step = 0; state.run && step < 15; step++) {
        state = applyMatching(
          state,
          (a) => a.type === "continue_run" || a.type === "resolve_choice",
          state.pendingChoice?.options[0]?.id,
        );
      }
      expect(state.run).toBeUndefined();
      expect(state.runner.credits).toBe(0);
      expect(state.runner.grip).toEqual(grip);
      expect(state.runner.coreDamage).toBe(initial.runner.coreDamage);
      expect(state.runner.rig.programs).toHaveLength(
        iceDefinitionId.includes("colonel") ? 2 : 3,
      );
      const replay = replayEvents(initial, state.eventLog.slice(eventStart));
      expect(replay.ok).toBe(true);
      expect(hashGameState(replay.state)).toBe(hashGameState(state));
    },
  );
  it.each([
    ["onr_v1_280_zombie", 6, 4, 2],
    ["onr_proteus_015_colonel-failure", 8, 6, 2],
  ] as const)(
    "executes the entire AI-owned mitigation for %s",
    (iceDefinitionId, credits, expectedPumps, expectedBreaks) => {
      let state = mechanismEncounter(iceDefinitionId, credits);
      let pumps = 0;
      let breaks = 0;
      const initial = structuredClone(state);
      const eventStart = state.eventLog.length;
      let executor: string | undefined;
      for (let step = 0; state.run && step < 25; step++) {
        if (state.activeSide === "corp") {
          state = applyMatching(
            state,
            (a) => a.type === "resolve_choice",
            state.pendingChoice?.options.find((o) =>
              String(o.value).includes("loony-goon"),
            )?.id ?? state.pendingChoice?.options[0]?.id,
          );
          continue;
        }
        const input = buildAiDecisionInput(state, "runner", {
          difficulty: "normal",
          eventTail: state.eventLog,
          ownDeckSnapshot: loadCapture(77).input.ownDeckSnapshot!,
          decisionId: `${state.matchId}:${state.stateVersion}:runner`,
          actionNumber: state.stateVersion,
        });
        const decision = chooseRunnerAction(input);
        const action = input.legalActions.find(
          (a) => a.actionId === decision.actionId,
        )!;
        expect(action).toBeDefined();
        expect(action.expiresAtStateVersion).toBe(state.stateVersion);
        expect(decision.fallbackUsed).toBe(false);
        if (
          action.type === "pump_breaker" ||
          action.type === "break_subroutine"
        ) {
          const selected = decision.decisionDebug!.planFirstDecision!;
          expect(selected.selectedPlan?.moduleId).toBe(
            "runner.convert_run_window",
          );
          executor ??= selected.leafExecutorInstanceId;
          expect(selected.leafExecutorInstanceId).toBe(executor);
          expect(selected.selectedStep?.planInstanceId).toBe(executor);
          expect(
            residentPlanPortfolioSnapshot(input)?.turnPlanExecutionLease
              ?.currentBinding.actionId,
          ).toBe(action.actionId);
        }
        if (action.type === "pump_breaker") pumps++;
        if (action.type === "break_subroutine") breaks++;
        state = applyMatching(state, (a) => a.actionId === action.actionId);
      }
      expect({ pumps, breaks }).toEqual({
        pumps: expectedPumps,
        breaks: expectedBreaks,
      });
      expect(state.run).toBeUndefined();
      expect(state.runner.credits).toBe(0);
      expect(state.runner.coreDamage).toBe(initial.runner.coreDamage);
      expect(state.runner.rig.programs).toHaveLength(
        iceDefinitionId.includes("colonel") ? 2 : 3,
      );
      const replay = replayEvents(initial, state.eventLog.slice(eventStart));
      expect(replay.ok).toBe(true);
      expect(hashGameState(replay.state)).toBe(hashGameState(state));
    },
  );
});

function applyMatching(
  state: GameState,
  matches: (action: LegalAction) => boolean,
  optionId?: string,
): GameState {
  const action = getLegalActions(state, state.activeSide).find(matches);
  if (!action)
    throw new Error(`Missing mechanism action at ${state.timingPoint}`);
  const result = applyAction(state, {
    matchId: state.matchId,
    side: state.activeSide,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `partial-break:${state.stateVersion}`,
    ...(optionId
      ? {
          selectedChoices: {
            choiceId: state.pendingChoice?.choiceId,
            selectedOptionIds: [optionId],
          },
        }
      : {}),
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function mechanismEncounter(
  iceDefinitionId: string,
  credits: number,
): GameState {
  const programs = [
    "onr_v1_040_loony-goon",
    "onr_v1_039_krash",
    "onr_v1_016_cyfermaster",
  ];
  const snapshot = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-d0f6-77-partial-break.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ).input.ownDeckSnapshot;
  let state = createGameAfterSetup({
    seed: "partial-break-mechanism",
    runnerDeck: {
      ...ORIGINALSET_DEFAULT_DECKS.runner,
      identity: snapshot.identityCardId,
      cards: snapshot.cards.map(
        (card: { cardId: string; quantity: number }) => ({
          id: card.cardId,
          quantity: card.quantity,
        }),
      ),
    },
    corpDeck: {
      ...ORIGINALSET_DEFAULT_DECKS.corp,
      cards: [
        { id: iceDefinitionId, quantity: 1 },
        ...ORIGINALSET_DEFAULT_DECKS.corp.cards.filter(
          (c) => c.id !== iceDefinitionId,
        ),
      ],
    },
  });
  for (const id of programs) installRunnerProgramForTest(state, id);
  const iceId = putCorpIceOnServer(state, "rd", iceDefinitionId);
  state.cardInstances[iceId]!.rezzed = true;
  state.cardInstances[iceId]!.faceup = true;
  state = applyMatching(state, (a) => a.type === "mandatory_draw");
  state = applyMatching(state, (a) => a.type === "end_turn");
  while (state.activeSide === "corp" && state.pendingChoice) {
    state = applyMatching(
      state,
      (a) => a.type === "resolve_choice",
      state.pendingChoice.options[0]!.id,
    );
  }
  state.runner.credits = credits;
  state = applyMatching(
    state,
    (a) => a.type === "start_run" && a.payload?.serverId === "rd",
  );
  for (
    let step = 0;
    state.run?.phase !== "encounter_ice" && step < 10;
    step++
  ) {
    state = applyMatching(
      state,
      (a) => a.type === "continue_run" || a.type === "decline_rez",
    );
  }
  expect(state.run?.phase).toBe("encounter_ice");
  return state;
}
