import type {
  CardDefinitionId,
  CardInstanceId,
  LegalAction,
} from "@netgrid/shared";
import { describe, expect, it, vi } from "vitest";
import { createGame } from "../create-game";
import {
  resolveEndTurnTagSequence,
  resumeEndTurnTagSequence,
  type EndTurnTagContinuationHost,
} from "./end-turn-tag-continuation";

describe("end-turn tag continuation", () => {
  it("persists the accumulated result across multiple suspended sources", () => {
    const state = createGame({
      seed: "end-turn-tag-multiple-suspensions",
      setupMode: "completed",
    });
    state.runnerTurnFlags = {
      stoleAgendaThisTurn: false,
      stoleAgendaLastTurn: false,
      ...(state.runnerTurnFlags ?? {}),
      runnerReceivedTagThisTurn: true,
    };
    const sourceIds = ["omniscience_1", "omniscience_2"] as CardInstanceId[];
    const finishEndTurn = vi.fn();
    const host: EndTurnTagContinuationHost = {
      state,
      sources: {
        activeSourceIds: () => sourceIds,
        definitionId: () =>
          "onr_v1_195_omniscience-foundation" as CardDefinitionId,
      },
      tags: {
        addRunnerTagsWithPrevention: () => true,
      },
      finishEndTurn,
    };
    const initialAction = {
      side: "runner",
      payload: {},
    } as unknown as LegalAction;

    expect(resolveEndTurnTagSequence(host, initialAction)).toBe(true);
    expect(state.pendingAddTagContinuation).toMatchObject({
      kind: "end_turn_tag",
      nextSourceIndex: 1,
      accumulatedTagsAddedBeforeCurrentSource: 0,
    });

    state.runner.tags += 1;
    const firstResumeAction = {
      side: "runner",
      payload: {},
    } as unknown as LegalAction;
    resumeEndTurnTagSequence(host, firstResumeAction);
    expect(state.pendingAddTagContinuation).toMatchObject({
      kind: "end_turn_tag",
      nextSourceIndex: 2,
      accumulatedTagsAddedBeforeCurrentSource: 1,
    });

    state.runner.tags += 1;
    const secondResumeAction = {
      side: "runner",
      payload: {},
    } as unknown as LegalAction;
    resumeEndTurnTagSequence(host, secondResumeAction);

    expect(state.pendingAddTagContinuation).toBeUndefined();
    expect(secondResumeAction.payload).toMatchObject({
      endTurnTagIfRunnerReceivedTagAdded: 2,
      sourceCount: 2,
      runnerTagsAfter: 2,
    });
    expect(finishEndTurn).toHaveBeenCalledOnce();
  });

  it("rejects a corrupt persisted accumulator before continuing", () => {
    const state = createGame({
      seed: "end-turn-tag-invalid-accumulator",
      setupMode: "completed",
    });
    state.pendingAddTagContinuation = {
      kind: "end_turn_tag",
      side: "runner",
      sourceCardIds: ["omniscience_1" as CardInstanceId],
      nextSourceIndex: 1,
      runnerTagsBefore: state.runner.tags,
      accumulatedTagsAddedBeforeCurrentSource: NaN,
    };
    const host: EndTurnTagContinuationHost = {
      state,
      sources: {
        activeSourceIds: () => ["omniscience_1" as CardInstanceId],
        definitionId: () =>
          "onr_v1_195_omniscience-foundation" as CardDefinitionId,
      },
      tags: { addRunnerTagsWithPrevention: () => false },
      finishEndTurn: vi.fn(),
    };
    const action = { side: "runner", payload: {} } as unknown as LegalAction;
    const before = structuredClone(state);

    expect(() => resumeEndTurnTagSequence(host, action)).toThrow(
      "runtime_invalid_end_turn_tag_accumulator",
    );
    expect(state).toEqual(before);
    expect(action.payload).toEqual({});
  });
});
