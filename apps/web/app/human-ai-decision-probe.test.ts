import { describe, expect, it } from "vitest";
import type { ApiSidePayload, LegalAction } from "@netgrid/shared";
import {
  humanAiDecisionProbeActionContext,
  humanAiDecisionProbeAvailable,
  humanAiDecisionProbeMatchesPayload,
  humanAiDecisionProbeReportSource,
} from "./human-ai-decision-probe";
import type { AiDecisionPreview } from "../lib/client-api";

const payload = {
  matchId: "match_probe",
  matchVersion: 4,
  side: "runner",
  winner: undefined,
  playerView: {
    side: "runner",
    stateVersion: 9,
  },
  legalActions: [
    {
      actionId: "runner.start_run.rd",
      type: "start_run",
      label: "Run auf R&D",
      side: "runner",
      source: "basic_action",
      timingPoint: "runner_action.main",
      costs: [],
      payload: { serverId: "rd" },
    },
  ],
} as unknown as ApiSidePayload;

const preview = {
  matchId: payload.matchId,
  matchVersion: payload.matchVersion,
  stateVersion: payload.playerView.stateVersion,
  requestedBy: "runner",
  side: "runner",
} as AiDecisionPreview;

describe("human-side AI decision probe", () => {
  it("is available only for the authenticated side in a private Human-vs-KI decision window", () => {
    expect(
      humanAiDecisionProbeAvailable(
        { side: "runner", mode: "human_runner_vs_corp_ai" },
        payload,
      ),
    ).toBe(true);
    expect(
      humanAiDecisionProbeAvailable(
        { side: "runner", mode: "ai_vs_ai" },
        payload,
      ),
    ).toBe(false);
    expect(
      humanAiDecisionProbeAvailable(
        { side: "corp", mode: "human_corp_vs_runner_ai" },
        payload,
      ),
    ).toBe(false);
    expect(
      humanAiDecisionProbeAvailable(
        { side: "runner", mode: "human_runner_vs_corp_ai" },
        { ...payload, legalActions: [] },
      ),
    ).toBe(false);
  });

  it("rejects a preview as soon as state, match, requester or target side changes", () => {
    const session = { matchId: payload.matchId, side: "runner" as const };
    expect(humanAiDecisionProbeMatchesPayload(preview, session, payload)).toBe(
      true,
    );
    expect(
      humanAiDecisionProbeMatchesPayload(preview, session, {
        ...payload,
        matchVersion: payload.matchVersion + 1,
      }),
    ).toBe(false);
    expect(
      humanAiDecisionProbeMatchesPayload(
        { ...preview, side: "corp" },
        session,
        payload,
      ),
    ).toBe(false);
  });

  it("maps the selected LegalAction to a server or own-card highlight without changing it", () => {
    expect(humanAiDecisionProbeActionContext(payload.legalActions[0])).toEqual({
      kind: "server",
      id: "rd",
      label: "R&D",
    });
    expect(
      humanAiDecisionProbeActionContext({
        actionId: "runner.play_event.runner_card_1",
        type: "play_event",
        label: "Eigene Karte spielen",
        side: "runner",
        source: "runner_card_1",
        timingPoint: "runner_action.main",
        costs: [],
        payload: { cardId: "runner_card_1" },
      } as unknown as LegalAction),
    ).toEqual({
      kind: "card",
      id: "runner_card_1",
      label: "Eigene Karte spielen",
    });
  });

  it("builds a compact positive-list report source without raw match or hidden-card data", () => {
    const report = humanAiDecisionProbeReportSource({
      matchId: "match_probe",
      matchVersion: 4,
      stateVersion: 9,
      side: "runner",
      selectedActionId: "runner.start_run.rd",
      selectedActionType: "start_run",
      detail: {
        reasonCode: "plan_first.runner.pressure_central",
        selectedChoices: {
          choiceId: "runner-server-choice",
          selectedOptionIds: ["rd"],
          privateCardTitle: "VERDECKTE_KORP_HQ_SENTINELKARTE",
        },
        advisorProfileId: "runner-human-advisor-v0.9-normal",
        advisorDifficulty: "normal",
        advisorMode: "fresh_human_side_takeover",
        fallbackUsed: false,
        timeoutUsed: false,
        playerView: { forbidden: true },
        AIInput: { forbidden: true },
        privateDeckSnapshots: { forbidden: true },
      },
    });

    expect(report).toMatchObject({
      matchId: "match_probe",
      matchVersion: 4,
      stateVersion: 9,
      side: "runner",
      selectedActionId: "runner.start_run.rd",
      selectedActionType: "start_run",
      reasonCode: "plan_first.runner.pressure_central",
      selectedChoices: {
        choiceId: "runner-server-choice",
        selectedOptionIds: ["rd"],
      },
      advisorProfileId: "runner-human-advisor-v0.9-normal",
      advisorDifficulty: "normal",
      advisorMode: "fresh_human_side_takeover",
      fallbackUsed: false,
      timeoutUsed: false,
    });
    expect(JSON.stringify(report)).not.toMatch(
      /VERDECKTE_KORP_HQ_SENTINELKARTE|playerView|AIInput|privateDeckSnapshots/,
    );
  });
});
