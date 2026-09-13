import { describe, expect, it, afterEach } from "vitest";
import {
  createGameAfterSetup,
  getPlayerView,
  getLegalActions,
  applyAction,
  validateGameState,
} from "@netgrid/engine";
import {
  ORIGINALSET_DEFAULT_DECKS,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import { removeEverywhere } from "../../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { runnerPostBreakTrashPreparationSignals } from "./post-break-trash-preparation";
import type { RunnerPressureSignal } from "../../plans/runner-tactical-plan-contracts";
import { readFileSync } from "node:fs";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { buildAiDecisionInputDto } from "../../input-dto";

const runnerDeck = {
  ...ORIGINALSET_DEFAULT_DECKS.runner,
  cards: [
    { id: "onr_v1_068_startup-immolator", quantity: 3 },
    { id: "onr_v1_039_krash", quantity: 3 },
    { id: "onr_v1_108_score", quantity: 3 },
  ],
};
function fixture() {
  const state = createGameAfterSetup({
    seed: "sp350-preparation",
    runnerDeck,
    corpDeck: {
      ...ORIGINALSET_DEFAULT_DECKS.corp,
      cards: [
        { id: "onr_v1_238_data-wall-2-0", quantity: 3 },
        { id: "onr_v1_188_ai-chief-financial-officer", quantity: 6 },
      ],
    },
  });
  state.activeSide = "runner";
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  state.runner.credits = 14;
  state.runner.clicks = 4;
  const find = (suffix: string) =>
    Object.values(state.cardInstances).find((c) =>
      c.definitionId.endsWith(suffix),
    )!;
  const startup = find("_startup-immolator"),
    krash = find("_krash"),
    ice = find("_data-wall-2-0");
  for (const card of [startup, krash, ice])
    removeEverywhere(state, card.instanceId);
  krash.zone = { side: "runner", zone: "rig" };
  krash.faceup = true;
  state.runner.rig.programs.push(krash.instanceId);
  startup.zone = { side: "runner", zone: "grip" };
  state.runner.grip.push(startup.instanceId);
  while (state.runner.grip.length < 6) {
    const id = state.runner.stack.pop()!;
    state.cardInstances[id]!.zone = { side: "runner", zone: "grip" };
    state.runner.grip.push(id);
  }
  ice.zone = { side: "corp", zone: "serverIce", serverId: "hq" };
  ice.rezzed = true;
  ice.faceup = true;
  state.corp.servers.find((s) => s.id === "hq")!.ice.push(ice.instanceId);
  return { state, startup, ice };
}
function inputFor(state: GameState) {
  return buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    profileId: "sp350",
    decisionId: `sp350:${state.matchId}:${state.stateVersion}`,
    ownDeckSnapshot: {
      deckSnapshotId: "sp350-runner",
      side: "runner",
      cards: runnerDeck.cards.map((c) => ({
        cardId: c.id,
        quantity: c.quantity,
      })),
    },
  });
}
const pressure: RunnerPressureSignal = {
  pressureId: "central:hq",
  serverId: "hq",
  purpose: "access",
  strategyLineIds: [],
  priorityClass: "P4",
  reachable: true,
  marginalValue: 100,
  evidenceCode: "test_admitted_hq_access",
  runActionIds: ["runner.start_run.hq"],
};
function signals(state: GameState) {
  const input = inputFor(state);
  return runnerPostBreakTrashPreparationSignals(
    input,
    buildActionSemanticCandidates(input),
    [pressure],
  );
}
afterEach(resetResidentPlanPortfolioMemory);
describe("SP-350 current Engine post-break trash preparation", () => {
  it.each(["source_removed", "target_changed", "unaffordable", "cost_changed"])(
    "revalidates a paused installed commitment against current facts: %s",
    (condition) => {
      const checkpoints = JSON.parse(
        readFileSync(
          new URL(
            "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r7-sp350-g30-preparation.json",
            import.meta.url,
          ),
          "utf8",
        ),
      );
      const first = checkpoints[0];
      restoreAiRuntimeCheckpoint(
        first.input,
        first.input.ownDeckSnapshot.deckSnapshotId,
        first.runtime,
      );
      chooseAiAction(first.input);
      chooseAiAction(checkpoints[1].input);
      const previous = residentPlanPortfolioSnapshot(checkpoints[1].input)!;
      const input = checkpoints[2].input;
      const prior = previous.instances.find(
        (i) =>
          i.moduleId === "runner.pressure_central" && i.target?.id === "rd",
      )!;
      const signal = (prior.moduleState as { signal: RunnerPressureSignal })
        .signal;
      const currentSignal = {
        ...signal,
        reachable: true,
        runActionIds: ["runner.start_run.rd"],
      };
      const run = input.legalActions.find(
        (a: LegalAction) => a.actionId === "runner.start_run.rd",
      )!;
      const quote = JSON.parse(run.payload.runnerPostBreakTrashQuoteJson);
      if (condition === "source_removed")
        input.playerView.own.rig = input.playerView.own.rig.filter(
          (c: { instanceId: string }) =>
            c.instanceId !==
            signal.postBreakTrashCommitment!.sourceCardInstanceId,
        );
      if (condition === "target_changed")
        input.playerView.servers.find(
          (s: { id: string }) => s.id === "rd",
        ).ice[0].instanceId = "replacement-ice";
      if (condition === "unaffordable") input.playerView.own.credits = 0;
      if (condition === "cost_changed") {
        quote.targets[0].trashCredits = 3;
        run.payload.runnerPostBreakTrashQuoteJson = JSON.stringify(quote);
      }
      const result = runnerPostBreakTrashPreparationSignals(
        input,
        buildActionSemanticCandidates(input),
        [currentSignal],
        previous,
      );
      if (condition === "cost_changed") {
        expect(result).toEqual([
          expect.objectContaining({
            postBreakTrashCommitment: expect.objectContaining({
              trashCredits: 3,
              observedAtStateVersion: input.playerView.stateVersion,
            }),
          }),
        ]);
      } else {
        expect(result).toEqual([]);
      }
    },
  );
  it("retains the installed removal goal across the real G30 hand-buffer interruption", () => {
    const checkpoints = JSON.parse(
      readFileSync(
        new URL(
          "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r7-sp350-g30-preparation.json",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const first = checkpoints[0];
    restoreAiRuntimeCheckpoint(
      first.input,
      first.input.ownDeckSnapshot.deckSnapshotId,
      first.runtime,
    );
    const preparation = chooseAiAction(first.input);
    expect(preparation.actionId).toContain(
      "runner.install_card.runner_onr_v1_068_startup-immolator_2",
    );
    for (const cp of checkpoints.slice(1)) {
      const decision = chooseAiAction(cp.input);
      const action = cp.input.legalActions.find(
        (a: LegalAction) => a.actionId === decision.actionId,
      );
      const expected: Record<number, string> = {
        65: "draw_card",
        66: "start_run",
        67: "pump_breaker",
        68: "break_subroutine",
        69: "continue_run",
        70: "trigger_ability",
      };
      expect(action.type).toBe(expected[cp.decision]);
      if (cp.decision === 70) {
        expect(action.payload).toMatchObject({
          abilityId: "trash_fully_broken_passed_ice",
        });
        expect(decision.reasonCode).toBe(
          "plan_first.runner.convert_run_window",
        );
      }
      const owner = residentPlanPortfolioSnapshot(cp.input)!.instances.find(
        (i) =>
          i.moduleId === "runner.pressure_central" && i.target?.id === "rd",
      )!;
      expect(owner.moduleState).toMatchObject({
        signal: {
          postBreakTrashCommitment: {
            sourceCardInstanceId: "runner_onr_v1_068_startup-immolator_2",
            serverId: "rd",
          },
        },
      });
      expect(decision.fallbackUsed).toBe(false);
    }
  });
  it("prepares Startup in the persisted G4 D142 decision without raising the owner priority", () => {
    const cp = JSON.parse(
      readFileSync(
        new URL(
          "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r6-sp350-g4-d142.json",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const input = cp.input;
    const run = input.legalActions.find(
      (a: LegalAction) => a.actionId === "runner.start_run.hq",
    );
    // Exact new Engine addition checked independently against actual applyAction
    // transitions above; the old checkpoint predates this quote projection.
    run.payload.runnerPostBreakTrashQuoteJson = JSON.stringify({
      schemaVersion: "runner-post-break-trash-quote-v1",
      stateVersion: input.playerView.stateVersion,
      actionId: run.actionId,
      serverId: "hq",
      sources: [
        {
          sourceCardInstanceId: "runner_onr_v1_068_startup-immolator_1",
          sourceDefinitionId: "onr_v1_068_startup-immolator",
          installed: false,
        },
      ],
      targets: [
        {
          targetIceInstanceId: "corp_onr_v1_238_data-wall-2-0_2",
          targetDefinitionId: "onr_v1_238_data-wall-2-0",
          trashCredits: 2,
        },
      ],
    });
    input.playerView.legalActions = input.legalActions;
    Object.assign(input, buildAiDecisionInputDto(input));
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot.deckSnapshotId,
      cp.runtime,
    );
    const decision = chooseAiAction(input);
    expect(decision.actionId).toContain(
      "runner.install_card.runner_onr_v1_068_startup-immolator_1",
    );
    expect(decision.reasonCode).toBe("plan_first.runner.pressure_central");
    expect(decision.fallbackUsed).toBe(false);
  });
  it("keeps controller-owned quotes through both DTO action lists and out of the Corp view", () => {
    const { state, startup, ice } = fixture();
    const input = inputFor(state);
    for (const actions of [input.legalActions, input.playerView.legalActions]) {
      const raw = actions.find((a) => a.actionId === "runner.start_run.hq")
        ?.payload?.runnerPostBreakTrashQuoteJson;
      expect(typeof raw).toBe("string");
      expect(JSON.parse(raw as string)).toMatchObject({
        stateVersion: state.stateVersion,
        sources: expect.arrayContaining([
          {
            sourceCardInstanceId: startup.instanceId,
            sourceDefinitionId: startup.definitionId,
            installed: false,
          },
        ]),
        targets: [
          {
            targetIceInstanceId: ice.instanceId,
            targetDefinitionId: ice.definitionId,
            trashCredits: 2,
          },
        ],
      });
    }
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain(
      "runnerPostBreakTrashQuoteJson",
    );
  });
  it("binds the same-turn saving to the existing pressure owner and a legal installation", () => {
    const { state, startup, ice } = fixture();
    expect(signals(state)).toEqual([
      expect.objectContaining({
        pressureId: "central:hq",
        priorityClass: pressure.priorityClass,
        marginalValue: pressure.marginalValue,
        routePreparation: "develop_payoff",
        postBreakTrashCommitment: expect.objectContaining({
          sourceCardInstanceId: startup.instanceId,
          targetIceInstanceId: ice.instanceId,
          trashCredits: 2,
        }),
        preparationActionIds: [expect.stringContaining(startup.instanceId)],
      }),
    ]);
  });
  it.each([
    "insufficient_credits",
    "last_click",
    "hidden_ice",
    "missing_breaker",
  ])("does not promise an unsupported route: %s", (condition) => {
    const { state, ice } = fixture();
    if (condition === "insufficient_credits") state.runner.credits = 5;
    if (condition === "last_click") state.runner.clicks = 1;
    if (condition === "hidden_ice") {
      ice.rezzed = false;
      ice.faceup = false;
    }
    if (condition === "missing_breaker") {
      const id = state.runner.rig.programs[0]!;
      removeEverywhere(state, id);
      state.cardInstances[id]!.zone = { side: "runner", zone: "heap" };
      state.runner.heap.push(id);
    }
    expect(signals(state)).toEqual([]);
  });
  it.each(["stale_state", "wrong_action", "invalid_json"])(
    "fails closed on a broken Engine quote: %s",
    (condition) => {
      const { state } = fixture();
      const input = inputFor(state);
      const run = input.legalActions.find(
        (a) => a.actionId === "runner.start_run.hq",
      )!;
      const quote = JSON.parse(
        run.payload!.runnerPostBreakTrashQuoteJson as string,
      );
      if (condition === "stale_state") quote.stateVersion--;
      if (condition === "wrong_action") quote.actionId = "runner.start_run.rd";
      run.payload!.runnerPostBreakTrashQuoteJson =
        condition === "invalid_json" ? "{" : JSON.stringify(quote);
      expect(() =>
        runnerPostBreakTrashPreparationSignals(
          input,
          buildActionSemanticCandidates(input),
          [pressure],
        ),
      ).toThrow("missing_action_semantics");
    },
  );
  it("revalidates a prepared installation and executes the bound post-pass ability through the live chooser", () => {
    let { state } = fixture();
    for (const agenda of Object.values(state.cardInstances)
      .filter((c) => c.definitionId === "onr_v1_188_ai-chief-financial-officer")
      .slice(0, 3)) {
      removeEverywhere(state, agenda.instanceId);
      agenda.zone = { side: "runner", zone: "scoreArea" };
      agenda.faceup = true;
      state.runner.scoreArea.push(agenda.instanceId);
    }
    const first = signals(state)[0]!;
    const install = getLegalActions(state, "runner").find((a) =>
      first.preparationActionIds?.includes(a.actionId),
    )!;
    const apply = (action: LegalAction) => {
      const result = applyAction(state, {
        matchId: state.matchId,
        side: action.side,
        actionId: action.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: `sp350:${state.stateVersion}`,
      });
      if (!result.ok) throw new Error(JSON.stringify(result.error));
      state = result.state;
      expect(validateGameState(state)).toEqual({ ok: true, errors: [] });
    };
    apply(install);
    expect(signals(state)[0]).toMatchObject({
      postBreakTrashCommitment: expect.any(Object),
    });
    const selected: string[] = [];
    for (let step = 0; step < 12; step++) {
      const input = inputFor(state);
      // Isolate this real, already admitted server route; all retained actions
      // are unchanged Engine actions, including the full encounter menu.
      input.legalActions = input.legalActions.filter(
        (a) => state.run || a.actionId === "runner.start_run.hq",
      );
      input.playerView.legalActions = input.legalActions;
      const decision = chooseAiAction(input);
      const action = input.legalActions.find(
        (a) => a.actionId === decision.actionId,
      )!;
      expect(decision.fallbackUsed).toBe(false);
      selected.push(action.type);
      apply(action);
      if (action.type === "trigger_ability") {
        expect(action.payload).toMatchObject({
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          abilityId: "trash_fully_broken_passed_ice",
          targetIceId: first.postBreakTrashCommitment!.targetIceInstanceId,
        });
        expect(decision.reasonCode).toBe(
          "plan_first.runner.convert_run_window",
        );
        expect(state.corp.servers.find((s) => s.id === "hq")!.ice).toHaveLength(
          0,
        );
        expect(state.runner.credits).toBe(8);
        expect(
          JSON.stringify(getPlayerView(state, "corp").publicEvents),
        ).not.toContain("runnerPostBreakTrashQuoteJson");
        return;
      }
    }
    throw new Error(`Expected bound trash, got ${selected.join(",")}`);
  });
});
