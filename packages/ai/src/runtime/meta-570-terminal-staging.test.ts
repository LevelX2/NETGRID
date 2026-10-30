import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  getPlayerView,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInput } from "./ai-decision-input";
import { buildPlanningStateIdentity } from "../plans/turn-planning-contracts";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { corpQualitativeIceStagingSignal } from "../corp/defense/corp-defense-domain-signals";

afterEach(resetResidentPlanPortfolioMemory);
function original() {
  return JSON.parse(
    readFileSync(
      new URL(
        "./test-fixtures/meta-570-terminal-staging.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}
function staging(input: any) {
  const candidate = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    visibleSourceDefinitionsByInstanceId: Object.fromEntries(
      input.playerView.own.gripOrHq
        .filter((c: any) => c.known)
        .map((c: any) => [c.instanceId, c.definitionId]),
    ),
  }).find(
    (c) => c.actionId.includes("data-wall") && c.actionId.includes(".hq."),
  )!;
  expect(candidate).toBeDefined();
  return corpQualitativeIceStagingSignal(input, candidate, "hq", undefined, {
    hasExactNonNegativeCostProfile: () => true,
    archivesHasVisibleKnownAgenda: () => false,
  });
}
it("preserves the last funding click instead of claiming unfunded additional ICE as a terminal response", () => {
  const saved = original();
  expect(saved.provenance.checkedStates).toBe(157);
  expect(
    Object.values(saved.checkpoint.validation).every((v) => v === true),
  ).toBe(true);
  expect(hashState(saved.state)).toBe(saved.checkpoint.stateHash);
  expect(staging(saved.checkpoint.input)).toBeUndefined();
  let state = saved.state;
  const initial = state;
  const turn = saved.checkpoint.input.playerView.turnSerial;
  let first = true;
  for (let n = 0; n < 80; n++) {
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
      input.ownDeckSnapshot!.deckSnapshotId,
        saved.checkpoint.runtime,
      );
    const unchanged = JSON.stringify(input);
    const decision = chooseAiAction(input);
    expect(JSON.stringify(input)).toBe(unchanged);
    expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
    const action = input.legalActions.find(
      (a: any) => a.actionId === decision.actionId,
    )!;
    expect(action).toBeDefined();
    if (first) {
      expect(action.type).toBe("gain_credit");
      expect(
        decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
      ).toBe("corp.economy");
      first = false;
    }
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
    if (state.winner || getPlayerView(state, "runner").turnSerial! > turn + 1)
      break;
  }
  expect(state.winner).toBeNull();
  expect(getPlayerView(state, "corp").own.credits).toBe(2);
  expect(getPlayerView(state, "runner").own).toMatchObject({
    agendaPoints: 2,
    credits: 6,
  });
  const replay = replayEvents(
    initial,
    state.eventLog.slice(initial.eventLog.length),
  );
  if (!replay.ok) throw Error("Replay failed");
  expect(hashState(replay.state)).toBe(hashState(state));
});
it.each(["funded", "earlier_click"])(
  "retains existing staging admission for %s",
  (variant) => {
    const saved = original();
    if (variant === "funded") saved.state.corp.credits = 2;
    else saved.state.corp.clicks = 2;
    const input = buildAiDecisionInput(saved.state, "corp", {
      difficulty: "hard",
      eventTail: saved.state.eventLog,
      ownDeckSnapshot: saved.deckSnapshots.corp,
    });
    expect(staging(input)).toMatchObject({
      phase: "install_defense_support",
      urgent: true,
    });
  },
);
