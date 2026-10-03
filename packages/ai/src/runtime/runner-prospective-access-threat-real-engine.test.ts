import { beforeEach, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import type { GameState } from "@netgrid/shared";
import catalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "./ai-decision-input";

const decks = Object.fromEntries(
  (["runner", "corp"] as const).map((side) => {
    const id =
      side === "runner"
        ? "standard_runner_inside_forgery_loop"
        : "standard_corp_mp1ddh7c";
    const entry = catalog.decks.find((d) => d.standardDeckId === id)!;
    return [
      side,
      {
        id,
        name: entry.name,
        side,
        identity: entry.identityCardId,
        cards: entry.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
      },
    ];
  }),
);
beforeEach(resetResidentPlanPortfolioMemory);
function apply(
  state: GameState,
  actionId: string,
  selectedChoices?: Record<string, unknown>,
) {
  const action = [
    ...getLegalActions(state, "runner"),
    ...getLegalActions(state, "corp"),
  ].find((a) => a.actionId === actionId)!;
  const result = applyAction(state, {
    matchId: state.matchId,
    side: action.side,
    actionId,
    clientKnownStateVersion: state.stateVersion,
    ...(selectedChoices ? { selectedChoices } : {}),
  });
  if (!result.ok) throw Error(result.error.message);
  return result.state;
}
function fixture(credits = 9, clicks = 4, advanced = 1) {
  let state = createGameAfterSetup({
    seed: "remote-expose-preparation",
    runnerDeck: decks.runner!,
    corpDeck: decks.corp!,
    agendaPointsToWin: 7,
  });
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "mandatory_draw")!
      .actionId,
  );
  RealEngineFixtureBuilder.forState(state).withCorpHqSize(0);
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "end_turn")!.actionId,
  );
  RealEngineFixtureBuilder.forState(state)
    .withRunnerGripSize(0)
    .withRunnerCredits(credits)
    .withRunnerClicks(clicks)
    .withRunnerProgramInstalled("onr_v1_058_seeya")
    .withRunnerProgramInstalled("onr_v1_039_krash")
    .withRunnerCardInGrip("onr_v1_161_fall-guy")
    .withCorpRemoteRoot("remote_1", "onr_v1_323_experimental-ai", advanced);
  state.runner.memoryUsed = 2;
  state.corp.credits = 8;
  return state;
}
function input(state: GameState) {
  return buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: decks.runner!.id,
      side: "runner",
      cards: decks.runner!.cards.map((c) => ({
        cardId: c.id,
        quantity: c.quantity,
      })),
    },
  });
}

import { evaluateKnownRemoteAccessPayoff } from "../known-remote-access-payoff";
import { projectKnownCorpCardAccessEffect } from "./known-corp-card-access-effect-projection";

function afterNativeExpose(corpCredits = 2, advanced = 1) {
  let state = fixture(9, 4, 1);
  state.corp.credits = corpCredits;
  const source = chooseAiAction(input(state));
  expect(source.actionId).toContain("seeya");
  state = apply(state, source.actionId!);
  for (let step = 0; step < 2; step++) {
    const decision = chooseAiAction(input(state));
    state = apply(state, decision.actionId!, decision.selectedChoices);
  }
  const root = state.corp.servers.find((s) => s.id === "remote_1")!.root[0]!;
  state.cardInstances[root]!.advancementCounters = advanced;
  return state;
}
it("uses observed expose knowledge to reject sacrificing sole coverage to a payable future access rez", () => {
  const state = afterNativeExpose(),
    i = input(state),
    before = JSON.stringify([i.playerView, i.legalActions]),
    payoff = evaluateKnownRemoteAccessPayoff(i, "remote_1");
  expect(payoff).toMatchObject({
    accessDecision: "defer_until_safe",
    declineReason: "unsafe_access_coverage",
    contestable: false,
    knownAccessThreatProjection: {
      status: "complete",
      installedProgramTrash: 1,
      runnerCoverageAtRisk: ["wall", "code_gate", "sentry"],
    },
  });
  expect(payoff.evidence).toContain(
    "known_access_effect_prospective_rez_cost:2",
  );
  const decision = chooseAiAction(i);
  expect(decision.actionId).not.toBe("runner.start_run.remote_1");
  expect(i.legalActions.some((a) => a.actionId === decision.actionId)).toBe(
    true,
  );
  expect(decision.fallbackUsed).toBe(false);
  expect(
    decision.decisionDebug?.actionAlternatives?.find(
      (a) => a.actionId === "runner.start_run.remote_1",
    )?.excluded,
  ).toBe(true);
  expect(JSON.stringify([i.playerView, i.legalActions])).toBe(before);
});
it.each([1, 0])(
  "keeps the known source inapplicable at only %i Corp credits",
  (corpCredits) => {
    const payoff = evaluateKnownRemoteAccessPayoff(
      input(afterNativeExpose(corpCredits)),
      "remote_1",
    );
    expect(payoff.contestable).toBe(true);
    expect(payoff.knownAccessThreatProjection).toBeUndefined();
  },
);
it("does not invent program trash from zero advancement counters", () => {
  const payoff = evaluateKnownRemoteAccessPayoff(
    input(afterNativeExpose(2, 0)),
    "remote_1",
  );
  expect(payoff.contestable).toBe(true);
  expect(payoff.knownAccessThreatProjection?.installedProgramTrash ?? 0).toBe(
    0,
  );
});
it("keeps missing installed program identity explicitly unknown", () => {
  const i = input(afterNativeExpose());
  delete i.playerView.own.rig!.find(
    (card) => card.definitionId === "onr_v1_039_krash",
  )!.definitionId;
  const payoff = evaluateKnownRemoteAccessPayoff(i, "remote_1");
  expect(payoff.knownAccessThreatProjection?.status).toBe("unknown");
  expect(payoff.contestable).toBe(false);
  expect(payoff.evidence).toContain(
    "known_access_effect_installed_program_definition_unknown",
  );
});
it("retains the factual current-state projection for the existing Corp consumers", () => {
  const state = afterNativeExpose(),
    i = input(state),
    root = i.playerView.servers.find((s) => s.id === "remote_1")!.root[0]!;
  expect(
    projectKnownCorpCardAccessEffect({
      input: i,
      sourceDefinitionId: "onr_v1_323_experimental-ai",
      sourceCard: root,
    }),
  ).toMatchObject({ status: "not_applicable", threatValue: 0 });
  expect(
    projectKnownCorpCardAccessEffect({
      input: i,
      sourceDefinitionId: "onr_v1_323_experimental-ai",
      sourceCard: { ...root, rezzed: true },
    }),
  ).toMatchObject({
    status: "complete",
    installedProgramTrash: 1,
    runnerCoverageAtRisk: ["wall", "code_gate", "sentry"],
  });
});
it("does not infer an ambush identity from an unexposed root", () => {
  const i = input(fixture());
  expect(
    evaluateKnownRemoteAccessPayoff(i, "remote_1").knownAccessThreatProjection,
  ).toBeUndefined();
});
it("does not erase installed coverage when the only legal trash targets are utility programs", () => {
  const i = input(afterNativeExpose());
  i.playerView.own.rig = i.playerView.own.rig!.filter(
    (c) => !c.definitionId?.endsWith("_krash"),
  );
  const payoff = evaluateKnownRemoteAccessPayoff(i, "remote_1");
  expect(
    payoff.knownAccessThreatProjection?.runnerCoverageAtRisk ?? [],
  ).toEqual([]);
  expect(payoff.contestable).toBe(true);
});
it("counts two real canonical universal providers separately against one program trash", () => {
  const i = input(afterNativeExpose()),
    original = i.playerView.own.rig!.find((c) =>
      c.definitionId?.endsWith("_krash"),
    )!;
  i.playerView.own.rig!.push({
    ...original,
    instanceId: "second-visible-canonical-provider",
  });
  const payoff = evaluateKnownRemoteAccessPayoff(i, "remote_1");
  expect(payoff.knownAccessThreatProjection?.installedProgramTrash).toBe(1);
  expect(
    payoff.knownAccessThreatProjection?.runnerCoverageAtRisk ?? [],
  ).toEqual([]);
  expect(payoff.contestable).toBe(true);
});
it("does not retain the observed identity after an actual root replacement", () => {
  let state = afterNativeExpose();
  state = apply(
    state,
    getLegalActions(state, "runner").find((a) => a.type === "end_turn")!
      .actionId,
  );
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "mandatory_draw")!
      .actionId,
  );
  RealEngineFixtureBuilder.forState(state).withCorpCardInHq(
    "onr_v1_217_strike-force-kali",
  );
  const install = getLegalActions(state, "corp").find(
    (a) =>
      a.type === "install_card" &&
      a.source.includes("strike-force-kali") &&
      a.payload?.serverId === "remote_1",
  )!;
  state = apply(state, install.actionId);
  const i = input(state);
  expect(
    evaluateKnownRemoteAccessPayoff(i, "remote_1").knownAccessThreatProjection,
  ).toBeUndefined();
});
