import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import type { AiDecisionInput, GameState } from "@netgrid/shared";
import {
  applyAction,
  getLegalActions,
  getPlayerView,
  hashGameState,
} from "@netgrid/engine";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { corpDefensePortfolioHasExecutableRoute } from "./defense-plan-module";
import {
  selectedRezCostSetsEqual,
  validMandatoryInstalledRezCosts,
} from "./defense-validation";
const installId =
  "corp.install_card.corp_onr_classic_011_glacier_2.rd.corp_onr_classic_011_glacier_2.3";
function fixture() {
  return JSON.parse(
    readFileSync(
      new URL("./test-fixtures/point-cost-install.json", import.meta.url),
      "utf8",
    ),
  );
}
function nativeInput(capture: ReturnType<typeof fixture>): AiDecisionInput {
  return {
    ...capture.checkpoint.input,
    ...buildAiDecisionInputDto(capture.checkpoint.input),
  };
}
function restoredDecision(
  input: AiDecisionInput,
  capture: ReturnType<typeof fixture>,
) {
  restoreAiRuntimeCheckpoint(
    input,
    capture.checkpoint.input.ownDeckSnapshot.deckSnapshotId,
    capture.checkpoint.runtime,
  );
  return chooseAiAction(input);
}
function exactRouteContext(capture: ReturnType<typeof fixture>) {
  const input = nativeInput(capture);
  const actionCandidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: input.side,
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  }).filter((c) => c.actionId === installId);
  return {
    input,
    actionCandidates,
    turnKey: `corp:${input.playerView.turnSerial}`,
  };
}
afterEach(resetResidentPlanPortfolioMemory);
describe("Native point-paid Corp Defense install contract", () => {
  it("admits the funded point-paid layer through the existing Defense route", () => {
    const capture = fixture(),
      input = nativeInput(capture);
    expect(
      Object.values(capture.checkpoint.validation).every((v) => v === true),
    ).toBe(true);
    expect(hashGameState(capture.state)).toBe(capture.checkpoint.stateHash);
    const decision = restoredDecision(input, capture);
    expect(decision.actionId).toBe(installId);
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan,
    ).toMatchObject({
      moduleId: "corp.defend_servers",
      executionState: "executor",
      phase: "defense",
    });
    expect(
      corpDefensePortfolioHasExecutableRoute(exactRouteContext(capture), [
        capture.signal,
      ]),
    ).toBe(true);
  });
  it("executes the chosen install and charges exactly one real agenda point on rez", () => {
    const capture = fixture();
    let state: GameState = structuredClone(capture.state);
    const apply = (
      side: "runner" | "corp",
      actionId: string,
      selectedChoices?: any,
    ) => {
      expect(
        getLegalActions(state, side).some((a) => a.actionId === actionId),
      ).toBe(true);
      const result = applyAction(state, {
        matchId: state.matchId,
        side,
        actionId,
        clientKnownStateVersion: state.stateVersion,
        ...(selectedChoices ? { selectedChoices } : {}),
      });
      expect(result.ok).toBe(true);
      if (!result.ok) throw Error(result.error.message);
      state = result.state;
    };
    apply("corp", restoredDecision(nativeInput(capture), capture).actionId!);
    expect(state.corp.credits).toBe(4);
    apply("corp", "corp.gain_credit");
    apply("corp", "corp.end_turn");
    apply("runner", "runner.gain_credit");
    apply("runner", "runner.draw_card");
    apply("runner", "runner.start_run.rd");
    const input = buildAiDecisionInput(state, "corp", {
      difficulty: "hard",
      ownDeckSnapshot: capture.checkpoint.input.ownDeckSnapshot,
    });
    const rez = restoredDecision(input, capture);
    expect(rez.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
      "corp.defend_servers",
    );
    expect(getPlayerView(state, "corp").own.agendaPoints).toBe(2);
    apply("corp", rez.actionId!, rez.selectedChoices);
    expect(state.corp.credits).toBe(5);
    expect(getPlayerView(state, "corp").own.agendaPoints).toBe(1);
    apply("corp", "corp.decline_rez");
    apply(
      "runner",
      "runner.continue_run.subroutine_end_run_a,subroutine_end_run_b",
    );
    expect(state.run).toBeUndefined();
  });
  it.each([
    "missing_point_quote",
    "stale_quote",
    "selected_point_mismatch",
    "after_point_mismatch",
    "missing_point_bank",
    "unfunded_point_bank",
    "incorrect_point_balance",
    "incorrect_point_total",
    "incorrect_cost_kind",
    "stale_point_bank",
  ])("rejects an otherwise authentic route with %s", (kind) => {
    const capture = fixture(),
      context = exactRouteContext(capture),
      signal = capture.signal;
    const payload = context.input.legalActions.find(
      (a) => a.actionId === installId,
    )!.payload!;
    if (kind === "missing_point_quote")
      delete payload.postInstallRezQuoteMandatoryAgendaPointCost;
    if (kind === "stale_quote")
      payload.postInstallRezQuoteExpiresAtStateVersion =
        context.input.playerView.stateVersion - 1;
    if (kind === "selected_point_mismatch") {
      signal.installRoute.projection.selectedRezCosts[0].agendaPoints = 0;
      signal.installRoute.projection.after.selectedRezCosts[0].agendaPoints = 0;
    }
    if (kind === "after_point_mismatch")
      signal.installRoute.projection.after.selectedRezCosts[0].agendaPoints = 0;
    if (kind === "incorrect_point_balance")
      signal.installRoute.projection.after.agendaPointsAfterDefense = 2;
    if (kind === "incorrect_point_total")
      signal.installRoute.projection.after.totalSelectedAgendaPointCost = 0;
    if (kind === "incorrect_cost_kind")
      delete payload.postInstallRezQuoteMandatoryAdditionalCostKind;
    if (kind === "stale_point_bank")
      signal.installRoute.projection.before.availableCorpAgendaPoints = 1;
    if (kind === "missing_point_bank")
      delete (context.input.playerView.own as any).agendaPoints;
    if (kind === "unfunded_point_bank") {
      (context.input.playerView.own as any).agendaPoints = 0;
      signal.installRoute.projection.before.availableCorpAgendaPoints = 0;
      signal.installRoute.projection.after.availableCorpAgendaPoints = 0;
      signal.installRoute.projection.after.agendaPointsAfterDefense = 0;
    }
    expect(corpDefensePortfolioHasExecutableRoute(context, [signal])).toBe(
      false,
    );
  });
  it("includes the exact mandatory point cost when comparing native selected rez sets", () => {
    const selected = fixture().signal.installRoute.projection.selectedRezCosts;
    expect(
      selectedRezCostSetsEqual(selected, [{ ...selected[0], agendaPoints: 0 }]),
    ).toBe(false);
    expect(validMandatoryInstalledRezCosts({ agendaPoints: 1 })).toBe(true);
    expect(
      validMandatoryInstalledRezCosts({
        agendaPoints: 1,
        trashInstalledCard: 1,
      }),
    ).toBe(false);
  });
});
