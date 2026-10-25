import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
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
  moveRunnerCardToGrip,
  putCorpIceOnServer,
  putCorpRootInRemote,
  scoreRunnerAgendaForTest,
  toRunnerTurn,
} from "../../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import { afterEach, expect, it } from "vitest";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { runnerRemoteBreakerPreparation } from "../../runner/rig-coverage/coverage-remote-breaker-preparation";
import { runnerRunTargetCanConvertNow } from "../../run-analysis/runner-plan-run-funding";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
afterEach(resetResidentPlanPortfolioMemory);
function fixture(game: number, decision: number) {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-554-r3-g" +
          game +
          "-d" +
          decision +
          ".json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.keys(cp.validation)).toHaveLength(9);
  expect(Object.values(cp.validation).every(Boolean)).toBe(true);
  return cp;
}
function decide(cp: ReturnType<typeof fixture>) {
  restoreAiRuntimeCheckpoint(
    cp.input,
    cp.input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const safeInput = () =>
    createHash("sha256")
      .update(JSON.stringify([cp.input.playerView, cp.input.legalActions]))
      .digest("hex");
  const before = safeInput();
  const result = chooseAiAction(cp.input);
  expect(result.fallbackUsed).toBe(false);
  expect(result.timeoutUsed).toBe(false);
  expect(safeInput()).toBe(before);
  const action = cp.input.legalActions.find(
    (a) => a.actionId === result.actionId,
  )!;
  expect(action.expiresAtStateVersion).toBe(cp.input.playerView.stateVersion);
  const plan = result.decisionDebug!.planFirstDecision!;
  expect(plan.route?.actionId).toBe(action.actionId);
  expect(plan.route?.stateVersion).toBe(cp.input.playerView.stateVersion);
  expect(plan.route?.planInstanceId).toBe(plan.leafExecutorInstanceId);
  expect(plan.selectedStep?.planInstanceId).toBe(plan.leafExecutorInstanceId);
  return { action, plan, result };
}
it("uses the funded bypass instead of borrowing its reserve for a blocked basic run at G11/D393", () => {
  const cp = fixture(11, 393),
    { action, plan } = decide(cp);
  expect(action.type).toBe("play_event");
  expect(action.source).toContain("inside-job");
  expect(action.payload?.serverId).toBe("remote_3");
  expect(plan.selectedPlan?.moduleId).toBe("runner.contest_remote");
  expect(plan.rootPlanInstanceId).toBe(plan.leafExecutorInstanceId);
  const target = evaluateRunnerRunTargets({ input: cp.input }).find(
    (evaluation) => evaluation.actionId === action.actionId,
  )!;
  expect(target.runCommitment).toBe("full_path");
  expect(target.prerunReserveQuote?.unknownIceCount).toBe(0);
});
it("installs the exact cheaper decoder under the same remote parent at G24/D139", () => {
  const cp = fixture(24, 139),
    { action, plan } = decide(cp);
  expect(action.type).toBe("install_card");
  expect(action.source).toContain("cyfermaster");
  expect(action.payload?.runnerProgramTrashBeforeInstall).not.toBe(true);
  expect(plan.selectedPlan?.moduleId).toBe("runner.rig_and_coverage");
  expect(plan.rootPlanInstanceId).toBe(
    "plan:runner.contest_remote:remote%3Aremote_1",
  );
  expect(plan.selectedPlan?.parentInstanceId).toBe(plan.rootPlanInstanceId);
});

it("keeps the basic run available once its own unknown-ICE reserve is funded", () => {
  const cp = fixture(11, 393);
  cp.input.playerView.own.credits = 15;
  const { action } = decide(cp);
  expect(action.type).toBe("start_run");
  expect(action.payload?.serverId).toBe("remote_3");
});
it.each([
  "short_cash",
  "last_click",
  "full_memory",
  "missing_install",
  "missing_steal_quote",
  "stale_steal_quote",
  "known_no_payoff",
  "unknown_ice",
] as const)(
  "does not certify an incomplete cheaper preparation: %s",
  (variant) => {
    const cp = fixture(24, 139),
      input = cp.input;
    if (variant === "short_cash") input.playerView.own.credits = 7;
    if (variant === "last_click") input.playerView.own.clicks = 1;
    if (variant === "full_memory")
      input.playerView.own.memoryUsed = input.playerView.own.memoryLimit!;
    if (variant === "missing_install")
      input.legalActions = input.legalActions.filter(
        (a) => a.type !== "install_card",
      );
    const server = input.playerView.servers.find((s) => s.id === "remote_1")!;
    if (variant === "missing_steal_quote")
      delete server.runnerAgendaStealCostQuote;
    if (variant === "stale_steal_quote")
      server.runnerAgendaStealCostQuote!.stateVersion--;
    if (variant === "unknown_ice") {
      const ice = server.ice[0]!;
      ice.known = false;
      delete ice.definitionId;
      delete ice.effectiveRunQuote;
      ice.rezzed = false;
    }
    const target = evaluateRunnerRunTargets({ input }).find(
      (e) => e.actionId === "runner.start_run.remote_1",
    )!;
    if (variant === "known_no_payoff")
      target.knownAccessState = "known_no_current_payoff";
    const result = runnerRemoteBreakerPreparation(
      input,
      buildActionSemanticCandidates({ legalActions: input.legalActions }),
      target,
      input.ownDeckCapabilities!,
      { runnerRunTargetCanConvertNow },
    );
    if (variant === "unknown_ice") {
      expect(result?.sameTurnRunConversion).toBeUndefined();
      expect(result?.evidenceCodes).toContain(
        "remote_breaker_preparation_unknown_ice:1",
      );
    } else expect(result).toBeUndefined();
  },
);
it("quotes all eight credits and both actions of the native cheaper route", () => {
  const cp = fixture(24, 139),
    input = cp.input;
  const target = evaluateRunnerRunTargets({ input }).find(
    (e) => e.actionId === "runner.start_run.remote_1",
  )!;
  expect(target.pathCost).toBe(16);
  expect(target.accessPayoffContestable).toBe(false);
  const result = runnerRemoteBreakerPreparation(
    input,
    buildActionSemanticCandidates({ legalActions: input.legalActions }),
    target,
    input.ownDeckCapabilities!,
    { runnerRunTargetCanConvertNow },
  )!;
  expect(result.totalRecoveryCost).toBe(8);
  expect(result.sameTurnRunConversion).toMatchObject({
    requiredCredits: 8,
    requiredClicksAfterFunding: 2,
    projectedKnownPathCost: 4,
    installProjection: "current_legal_action",
  });
});

function applyNative(
  state: GameState,
  action: LegalAction,
  selectedChoices?: { choiceId: string; selectedOptionIds: string[] },
) {
  const result = applyAction(state, {
    matchId: state.matchId,
    side: state.activeSide,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: "meta554-route:" + state.stateVersion,
    ...(selectedChoices ? { selectedChoices } : {}),
  });
  if (!result.ok) throw Error(result.error.message);
  return result.state;
}
it.each(["bypass", "decoder"] as const)(
  "certifies the planned full Engine conversion and deterministic replay: %s",
  (variant) => {
    const snapshot = fixture(24, 139).input.ownDeckSnapshot!;
    const corpCards = [
      { id: "onr_v1_214_project-babylon", quantity: 1 },
      { id: "onr_proteus_007_project-venice", quantity: 1 },
      { id: "onr_proteus_008_project-zurich", quantity: 3 },
      { id: "onr_v1_245_fire-wall", quantity: 1 },
      { id: "onr_v1_252_keeper", quantity: 1 },
      { id: "onr_v1_261_quandary", quantity: 1 },
    ];
    let state = createGameAfterSetup({
      seed: "meta554-" + variant,
      runnerDeck: {
        ...ORIGINALSET_DEFAULT_DECKS.runner,
        cards: snapshot.cards.map((c) => ({
          id: c.cardId,
          quantity: c.quantity,
        })),
      },
      corpDeck: {
        ...ORIGINALSET_DEFAULT_DECKS.corp,
        cards: [
          ...corpCards,
          ...ORIGINALSET_DEFAULT_DECKS.corp.cards.filter(
            (c) => !corpCards.some((k) => k.id === c.id),
          ),
        ],
      },
    });
    state = toRunnerTurn(state);
    installRunnerProgramForTest(state, "onr_v1_039_krash");
    moveRunnerCardToGrip(state, "onr_v1_094_inside-job");
    if (variant === "decoder")
      moveRunnerCardToGrip(state, "onr_v1_016_cyfermaster");
    const target = putCorpRootInRemote(
      state,
      variant === "bypass"
        ? "onr_v1_214_project-babylon"
        : "onr_proteus_008_project-zurich",
    );
    state.cardInstances[target]!.faceup = variant === "bypass";
    state.cardInstances[target]!.advancementCounters =
      variant === "bypass" ? 0 : 1;
    for (const id of variant === "bypass"
      ? ["onr_v1_245_fire-wall"]
      : ["onr_v1_252_keeper", "onr_v1_261_quandary"]) {
      const ice =
        state.cardInstances[putCorpIceOnServer(state, "remote_1", id)]!;
      ice.rezzed = variant === "decoder";
      ice.faceup = ice.rezzed;
    }
    for (let i = 0; i < (variant === "bypass" ? 3 : 1); i++)
      scoreRunnerAgendaForTest(
        state,
        variant === "decoder"
          ? "onr_proteus_007_project-venice"
          : "onr_proteus_008_project-zurich",
      );
    state.runner.credits = variant === "bypass" ? 3 : 10;
    state.runner.clicks = variant === "bypass" ? 4 : 3;
    state.corp.credits = 15;
    const initial = structuredClone(state),
      start = state.eventLog.length;
    const actions: string[] = [];
    for (let i = 0; i < 40 && !state.winner; i++) {
      if (i > 0 && !state.run && state.runner.scoreArea.includes(target)) break;
      const legal = getLegalActions(state, state.activeSide);
      if (state.activeSide === "corp") {
        const action =
          legal.find((a) => a.type === "rez_card") ??
          legal.find((a) => a.type === "decline_rez");
        if (!action)
          throw Error("Unexpected Corp continuation " + state.timingPoint);
        actions.push(action.type);
        state = applyNative(state, action);
        continue;
      }
      let action: LegalAction | undefined;
      if (i === 0) {
        action = legal.find(
          (a) =>
            a.type === (variant === "bypass" ? "play_event" : "install_card") &&
            String(a.payload?.cardId ?? "").includes(
              variant === "bypass" ? "inside-job" : "cyfermaster",
            ) &&
            (variant === "decoder" || a.payload?.serverId === "remote_1"),
        );
      } else if (variant === "decoder" && !state.run) {
        action = legal.find(
          (a) => a.type === "start_run" && a.payload?.serverId === "remote_1",
        );
      } else {
        action =
          legal.find(
            (a) =>
              a.type === "break_subroutine" &&
              String(a.payload?.breakerId).includes("cyfermaster"),
          ) ??
          legal.find((a) => a.type === "steal_agenda") ??
          legal.find((a) => a.type === "access_card") ??
          legal.find((a) => a.type === "continue_run");
      }
      if (!action)
        throw Error(
          "Unexpected Runner continuation " +
            state.timingPoint +
            " " +
            legal.map((a) => a.type).join(","),
        );
      actions.push(action.type);
      state = applyNative(state, action);
    }
    expect(state.runner.scoreArea).toContain(target);
    expect(state.runner.credits).toBe(variant === "bypass" ? 1 : 2);
    if (variant === "bypass") expect(state.winner).toBe("runner");
    else {
      expect(state.runner.clicks).toBe(1);
      expect(actions.filter((a) => a === "play_event")).toHaveLength(0);
    }
    const replay = replayEvents(initial, state.eventLog.slice(start));
    expect(replay.ok).toBe(true);
    expect(hashGameState(replay.state)).toBe(hashGameState(state));
  },
);
