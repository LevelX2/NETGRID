import { describe, expect, it } from "vitest";
import type { LegalAction, VisibleCard } from "@netgrid/shared";

import unreachableScorelineJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-baseline-seed02-02-unreachable-scoreline-d354.json";
import deckoutDeadlineJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-baseline-seed02-03-deckout-scoreline-deadline-d413.json";
import { buildCorpTacticalPlans } from "../../plans/tactical-plan-corp-plans";
import {
  corpScorelineAllowsMultiTurnDevelopment,
  corpScorelineFeasibilityForDecisionInput,
} from "../../runtime/corp-scoreline-feasibility";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("baseline Seed 02 shared scoreline feasibility checkpoints", () => {
  it("invalidates the unreachable score-window plan and selects explicit tag-line support", () => {
    const result = runAiDecisionCheckpoint(fixture(unreachableScorelineJson));

    expect(result.ok, `${result.code ?? "ok"}: ${result.message}`).toBe(true);
    expect(
      corpScorelineFeasibilityForDecisionInput(result.input),
    ).toMatchObject({
      feasible: false,
      totalAgendaPoints: 8,
      maxReachablePoints: 5,
      opponentAgendaPoints: 3,
      pointsToWin: 7,
      deadline: "open",
      remainingMandatoryDraws: 5,
    });
    expect(result.decision?.decisionDebug?.planKind).toBe(
      "corp.apply_punish_pressure",
    );
    expect(result.decision?.decisionDebug?.planKind).not.toBe(
      "corp.create_score_window",
    );

    const reachableInput = structuredClone(result.input);
    reachableInput.playerView.opponent.agendaPoints = 0;
    reachableInput.playerView.opponent.scoreArea = [];
    const reachable = corpScorelineFeasibilityForDecisionInput(reachableInput);
    expect(reachable).toMatchObject({
      feasible: true,
      maxReachablePoints: 8,
      deadline: "open",
    });
    expect(corpScorelineAllowsMultiTurnDevelopment(reachable)).toBe(true);
    expect(
      buildCorpTacticalPlans({ input: reachableInput }).some(
        (plan) => plan.type === "corp.create_score_window",
      ),
    ).toBe(true);
  });

  it("rejects unconvertible ICE protection at deck zero and starts the bounded tag engine", () => {
    const result = runAiDecisionCheckpoint(fixture(deckoutDeadlineJson));

    expect(result.ok, `${result.code ?? "ok"}: ${result.message}`).toBe(true);
    expect(
      corpScorelineFeasibilityForDecisionInput(result.input),
    ).toMatchObject({
      feasible: false,
      totalAgendaPoints: 8,
      maxReachablePoints: 5,
      opponentAgendaPoints: 3,
      pointsToWin: 7,
      deadline: "current_turn_only",
      remainingMandatoryDraws: 0,
      currentClicks: 3,
      currentTurnClosableActionIds: [],
    });
    expect(result.selectedAction?.source).toBe("corp_onr_v1_310_blood-cat_2");

    const lastDrawInput = structuredClone(result.input);
    lastDrawInput.playerView.opponent.agendaPoints = 0;
    lastDrawInput.playerView.opponent.scoreArea = [];
    lastDrawInput.playerView.own.stackOrRdCount = 1;
    const lastDraw = corpScorelineFeasibilityForDecisionInput(lastDrawInput);
    expect(lastDraw).toMatchObject({
      feasible: true,
      deadline: "last_draw_window",
      remainingMandatoryDraws: 1,
    });
    expect(corpScorelineAllowsMultiTurnDevelopment(lastDraw)).toBe(true);
  });

  it("recognizes an affordable same-turn score sequence at deck zero", () => {
    const result = runAiDecisionCheckpoint(fixture(deckoutDeadlineJson));
    const input = structuredClone(result.input);
    input.playerView.opponent.agendaPoints = 0;
    input.playerView.opponent.scoreArea = [];
    const agenda = syntheticAgenda();
    const install = syntheticAgendaInstall(agenda);
    input.playerView.own.gripOrHq.push(agenda);
    input.legalActions.push(install);
    input.playerView.legalActions.push(install);

    expect(corpScorelineFeasibilityForDecisionInput(input)).toMatchObject({
      feasible: true,
      deadline: "current_turn_only",
      currentTurnClosableActionIds: [install.actionId],
    });
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

function syntheticAgenda(): VisibleCard {
  return {
    instanceId: "synthetic-one-advance-agenda",
    definitionId: "onr_v1_191_black-ice-quality-assurance",
    known: true,
    type: "agenda",
    owner: "corp",
    controller: "corp",
    advancementRequirement: 1,
    advancementCounters: 0,
    agendaPoints: 2,
    counterDisplays: [],
  } as VisibleCard;
}

function syntheticAgendaInstall(agenda: VisibleCard): LegalAction {
  return {
    actionId: "corp.install.synthetic-one-advance-agenda.remote_1",
    side: "corp",
    type: "install_card",
    label: "Synthetic Agenda installieren",
    source: agenda.instanceId,
    timingPoint: "corp_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 413,
    payload: { serverId: "remote_1", placement: "root" },
  } as LegalAction;
}
