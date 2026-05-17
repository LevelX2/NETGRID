import { describe, expect, it } from "vitest";
import type { LegalAction, PlayerView, PublicGameEvent, Side, VisibleCard } from "@netgrid/shared";
import { formatMatchTimerDuration, matchTimerDecisionKey, matchTimerScopeLabel } from "./match-timer-ui";

describe("UI-only match timer helpers", () => {
  it("formats compact match durations", () => {
    expect(formatMatchTimerDuration(-1)).toBe("00:00");
    expect(formatMatchTimerDuration(5_900)).toBe("00:05");
    expect(formatMatchTimerDuration(65_000)).toBe("01:05");
    expect(formatMatchTimerDuration(3_661_000)).toBe("1:01:01");
  });

  it("uses only side-safe snapshot fields for the visible scope label", () => {
    const viewWithPrivateChoice = view("runner", {
      pendingChoice: {
        choiceId: "choice-hidden",
        side: "runner",
        source: "private-source",
        prompt: "Private Prompt",
        kind: "select_option",
        options: [{ id: "secret-option", label: "Secret", value: "secret-card" }],
        minSelections: 1,
        maxSelections: 1,
        stateVersion: 4,
        visibility: "hidden_info_barrier"
      }
    });

    expect(matchTimerScopeLabel(viewWithPrivateChoice, [])).toBe("Runner entscheidet");
  });

  it("resets the decision key on state, side, choice and legal action changes", () => {
    const base = view("corp", { stateVersion: 2, activeSide: "corp" });
    const baseKey = matchTimerDecisionKey({ matchId: "m1", playerView: base, legalActions: [legalAction("corp", "a1")] });

    expect(matchTimerDecisionKey({ matchId: "m1", playerView: { ...base, stateVersion: 3 }, legalActions: [legalAction("corp", "a1")] })).not.toBe(baseKey);
    expect(matchTimerDecisionKey({ matchId: "m1", playerView: { ...base, activeSide: "runner" }, legalActions: [legalAction("corp", "a1")] })).not.toBe(baseKey);
    expect(
      matchTimerDecisionKey({
        matchId: "m1",
        playerView: {
          ...base,
          pendingChoice: {
            choiceId: "choice-1",
            side: "corp",
            source: "visible",
            prompt: "Weiter?",
            kind: "select_option",
            options: [{ id: "pass", label: "Passen", value: "pass" }],
            minSelections: 1,
            maxSelections: 1,
            stateVersion: 2,
            visibility: "public"
          }
        },
        legalActions: [legalAction("corp", "a1")]
      })
    ).not.toBe(baseKey);
    expect(matchTimerDecisionKey({ matchId: "m1", playerView: base, legalActions: [legalAction("corp", "a2")] })).not.toBe(baseKey);
  });
});

function view(side: Side, overrides: Partial<PlayerView> = {}): PlayerView {
  const opponent = side === "corp" ? "runner" : "corp";
  return {
    side,
    stateVersion: 1,
    timingPoint: side === "corp" ? "corp_action.main" : "runner_action.main",
    activeSide: side,
    phase: side === "corp" ? "corp_action_phase" : "runner_action_phase",
    own: {
      identity: card(`${side}-identity`, `${side} identity`, "identity"),
      credits: 5,
      clicks: side === "corp" ? 3 : 4,
      agendaPoints: 0,
      gripOrHq: [],
      stackOrRdCount: 0,
      heapOrArchives: [],
      scoreArea: [],
      maxHandSize: 5,
      tags: 0
    },
    opponent: {
      identity: card(`${opponent}-identity`, `${opponent} identity`, "identity"),
      credits: 5,
      clicks: opponent === "corp" ? 3 : 4,
      agendaPoints: 0,
      tags: 0,
      handCount: 0,
      maxHandSize: 5,
      deckCount: 0,
      discardCount: 0,
      scoreArea: []
    },
    servers: [],
    publicEvents: [] as PublicGameEvent[],
    legalActions: [],
    winner: null,
    agendaPointsToWin: 7,
    ...overrides
  };
}

function card(instanceId: string, title: string, type: NonNullable<VisibleCard["type"]>): VisibleCard {
  return { instanceId, known: true, title, type };
}

function legalAction(side: Side, actionId: string): LegalAction {
  return {
    actionId,
    side,
    type: "gain_credit",
    label: "Credit nehmen",
    source: "basic_action",
    timingPoint: side === "corp" ? "corp_action.main" : "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2
  };
}
