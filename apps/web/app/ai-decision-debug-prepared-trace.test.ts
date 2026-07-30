import { describe, expect, it } from "vitest";

import type { PreparedAiDecisionDebug } from "../lib/client-api";
import {
  preparedAiDecisionDebugMatchesState,
  preparedAiDecisionDebugTrace,
} from "./ai-decision-debug-prepared-trace";

const prepared: PreparedAiDecisionDebug = {
  matchId: "match_debug",
  matchVersion: 8,
  stateVersion: 13,
  side: "corp",
  preparedAt: "2026-07-30T12:00:00.000Z",
  actionId: "corp.install_asset",
  actionType: "install_card",
  actionLabel: "PAD Campaign installieren",
  detail: {
    actionAlternatives: [
      {
        actionId: "corp.install_asset",
        label: "Veraltete Alternativbezeichnung",
        selected: true,
      },
    ],
  },
};

describe("prepared AI decision debug trace", () => {
  it("binds the displayed selection label and versions to the prepared action", () => {
    const trace = preparedAiDecisionDebugTrace(prepared);

    expect(trace.selectedActionId).toBe("corp.install_asset");
    expect(trace.detail).toMatchObject({
      selectedActionId: "corp.install_asset",
      selectedActionType: "install_card",
      selectedActionLabel: "PAD Campaign installieren",
      preparedForExecution: true,
    });
    expect(
      preparedAiDecisionDebugMatchesState(prepared, {
        matchId: "match_debug",
        matchVersion: 8,
        stateVersion: 13,
      }),
    ).toBe(true);
  });

  it("rejects a prepared decision after any relevant state identity changes", () => {
    expect(
      preparedAiDecisionDebugMatchesState(prepared, {
        matchId: "match_debug",
        matchVersion: 9,
        stateVersion: 13,
      }),
    ).toBe(false);
    expect(
      preparedAiDecisionDebugMatchesState(null, {
        matchId: "match_debug",
        matchVersion: 8,
        stateVersion: 13,
      }),
    ).toBe(false);
  });
});
