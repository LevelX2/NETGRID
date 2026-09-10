import { beforeEach, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import type { GameState, Side } from "@netgrid/shared";
import catalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { chooseRunnerAction } from "../index";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import {
  buildAiDecisionInput,
  selectAiDecisionSideForState,
} from "./ai-decision-input";

const decks = Object.fromEntries(
  (["corp", "runner"] as const).map((side) => {
    const id =
      side === "corp"
        ? "standard_proteus_corp_hidden_node_control_2026_05_25"
        : "standard_proteus_runner_breaker_lab_2026_05_25";
    const d = catalog.decks.find((d) => d.standardDeckId === id)!;
    return [
      side,
      {
        id,
        name: d.name,
        side,
        identity: d.identityCardId,
        cards: d.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
      },
    ];
  }),
);
const tollKind = "runner_pay_or_end_run_after_passing_ice_on_this_fort";
beforeEach(() => resetResidentPlanPortfolioMemory());
function apply(s: GameState, side: Side, actionId: string | undefined) {
  if (!actionId) throw Error("fixture action ID missing");
  const result = applyAction(s, {
    matchId: s.matchId,
    side,
    actionId,
    clientKnownStateVersion: s.stateVersion,
  });
  if (!result.ok) throw Error(result.error.message);
  return result.state;
}
function fixture(
  credits: number,
  lethalRemainingIce = false,
  withKnownSentry = false,
) {
  let s = createGameAfterSetup({
    seed: "runner-current-pass-toll",
    corpDeck: decks.corp!,
    runnerDeck: decks.runner!,
    traceRulesProfile: "modern_open",
  });
  s = apply(s, "corp", "corp.mandatory_draw");
  const f = RealEngineFixtureBuilder.forState(s)
    .withCorpHqSize(0)
    .withCorpCardInHq("onr_proteus_004_fetal-ai")
    .withCorpCardInHq("onr_proteus_005_marked-accounts")
    .withRunnerCredits(credits)
    .withCorpRemoteRoot("hq", "onr_proteus_070_rasmin-bridger", 0, {
      rezzed: true,
      faceup: true,
    });
  if (lethalRemainingIce)
    f.withRunnerGripSize(0).withRezzedCorpIceOnServer(
      "hq",
      "onr_proteus_033_mobile-barricade",
    );
  if (withKnownSentry)
    f.withRunnerProgramInstalled(
      "onr_proteus_080_black-widow",
    ).withRezzedCorpIceOnServer("hq", "onr_proteus_040_sumo-2008");
  f.withCorpIceOnServer("hq", "onr_proteus_017_credit-blocks");
  if (withKnownSentry) {
    const breakerId = s.runner.rig.programs.find(
      (id) =>
        s.cardInstances[id]?.definitionId === "onr_proteus_080_black-widow",
    )!;
    s.cardInstances[breakerId]!.selectedCardId = s.corp.servers
      .find((server) => server.id === "hq")!
      .ice.at(-1)!;
  }
  s.corp.clicks = 0;
  s = apply(s, "corp", "corp.end_turn");
  s = apply(s, "runner", "runner.start_run.hq");
  for (let i = 0; !s.run?.postPassPayOrEndRun && i < 10; i++) {
    const selection = selectAiDecisionSideForState(s);
    if (selection.terminal || !selection.side)
      throw Error("unexpected terminal fixture");
    const action =
      selection.legalActions.find((a) => a.type === "decline_rez") ??
      selection.legalActions.find((a) => a.type === "continue_run");
    if (!action) throw Error(`unexpected fixture window ${s.timingPoint}`);
    s = apply(s, selection.side, action.actionId);
  }
  expect(s.run?.postPassPayOrEndRun?.amount).toBe(1);
  return s;
}
function input(s: GameState) {
  return buildAiDecisionInput(s, "runner", {
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

it("pays an affordable current fort toll under the run owner and really preserves access", () => {
  let s = fixture(10);
  const initial = structuredClone(s),
    start = s.eventLog.length,
    before = hashState(s);
  const projected = input(s);
  for (const action of projected.legalActions) {
    expect(action.payload?.fortRunWindowAbility).toBe(tollKind);
    expect(action.payload?.passedIceId).toBeUndefined();
    expect(action.payload?.passedIceDefinitionId).toBeUndefined();
  }
  const decision = chooseRunnerAction(projected);
  const selected = getLegalActions(s, "runner").find(
    (a) => a.actionId === decision.actionId,
  )!;
  expect(selected.payload).toMatchObject({
    fortRunWindowAbility: tollKind,
    decision: "pay",
    paymentAmount: 1,
  });
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("runner.convert_run_window");
  expect(hashState(s)).toBe(before);
  s = apply(s, "runner", selected.actionId);
  expect(s.runner.credits).toBe(9);
  expect(s.run?.postPassPayOrEndRun).toBeUndefined();
  expect(s.run).toBeDefined();
  const access = getLegalActions(s, "runner").find(
    (a) => a.type === "continue_run",
  )!;
  s = apply(s, "runner", access.actionId);
  expect(s.run?.successful).toBe(true);
  const replay = replayEvents(initial, s.eventLog.slice(start));
  expect(replay.ok).toBe(true);
  expect(hashState(replay.state)).toBe(hashState(s));
});

it("uses the available toll exit instead of paying into known lethal remaining ICE", () => {
  const s = fixture(10, true);
  const decision = chooseRunnerAction(input(s));
  expect(
    getLegalActions(s, "runner").find((a) => a.actionId === decision.actionId)
      ?.payload?.decision,
  ).toBe("end_run");
  expect(apply(s, "runner", decision.actionId).run).toBeUndefined();
});

it("ends the run when the real payment is unaffordable", () => {
  const s = fixture(0);
  expect(
    getLegalActions(s, "runner").some((a) => a.payload?.decision === "pay"),
  ).toBe(false);
  const decision = chooseRunnerAction(input(s));
  expect(
    getLegalActions(s, "runner").find((a) => a.actionId === decision.actionId)
      ?.payload?.decision,
  ).toBe("end_run");
});

it("accounts for the current fee before committing the remaining breaker budget", () => {
  // Black Widow, bound to the outer ICE, needs three 2-credit pumps and one 1-credit break
  // against Sumo 2008. Paying this fee leaves only six credits.
  const s = fixture(7, false, true);
  expect(
    getLegalActions(s, "runner").some((a) => a.payload?.decision === "pay"),
  ).toBe(true);
  const decision = chooseRunnerAction(input(s));
  expect(
    getLegalActions(s, "runner").find((a) => a.actionId === decision.actionId)
      ?.payload?.decision,
  ).toBe("end_run");
});

it("continues when the known remaining breaker path remains funded after the fee", () => {
  const s = fixture(10, false, true);
  const decision = chooseRunnerAction(input(s));
  expect(
    getLegalActions(s, "runner").find((a) => a.actionId === decision.actionId)
      ?.payload?.decision,
  ).toBe("pay");
});

it("uses real bad-publicity run credits for an offered payment", () => {
  const s = fixture(0);
  s.run!.badPublicityCredits = 1;
  const decision = chooseRunnerAction(input(s));
  expect(
    getLegalActions(s, "runner").find((a) => a.actionId === decision.actionId)
      ?.payload?.decision,
  ).toBe("pay");
  const after = apply(s, "runner", decision.actionId);
  expect(after.run?.badPublicityCredits).toBe(0);
  expect(after.runner.credits).toBe(0);
  expect(after.run).toBeDefined();
});

it("fails visibly for a current fort offer bound to a different server", () => {
  const projected = input(fixture(10));
  for (const action of projected.legalActions)
    if (action.payload?.decision === "pay") action.payload.serverId = "rd";
  expect(() => chooseRunnerAction(projected)).toThrow(/step_target_mismatch/);
});
