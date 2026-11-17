import type { CardInstanceId, GameState } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { createAgendaProgressionObserver } from "./agenda-progression-observation";

const first = "first-agenda" as CardInstanceId;
const second = "second-agenda" as CardInstanceId;
const unrelated = "unrelated-agenda" as CardInstanceId;

function board(
  counters: Partial<Record<CardInstanceId, number>>,
  corpScores: CardInstanceId[] = [],
  runnerScores: CardInstanceId[] = [],
): GameState {
  return {
    cardInstances: Object.fromEntries(
      Object.entries(counters).map(([id, advancementCounters]) => [
        id,
        { definitionId: "onr_v1_193_corporate-coup", advancementCounters },
      ]),
    ),
    corp: {
      servers: [{ id: "remote_1", root: Object.keys(counters), ice: [] }],
      scoreArea: corpScores,
    },
    runner: { scoreArea: runnerScores },
  } as unknown as GameState;
}

describe("simulation agenda progression", () => {
  it("joins each advance to the disposition of that agenda", () => {
    const observe = createAgendaProgressionObserver();
    const frames = [
      board({ [first]: 2, [second]: 2, [unrelated]: 0 }),
      board({ [first]: 3, [second]: 2, [unrelated]: 0 }),
      board({ [first]: 3, [second]: 3, [unrelated]: 0 }),
      board({ [first]: 3, [second]: 3 }, [unrelated]),
      board({ [first]: 3 }, [unrelated], [second]),
      board({}, [unrelated, first], [second]),
    ];
    for (const [actionIndex, targetCardId, turn] of [
      [0, first, 2],
      [1, second, 3],
      [2, undefined, 3],
      [3, undefined, 4],
      [4, undefined, 6],
    ] as const) {
      observe.observe({
        before: frames[actionIndex]!,
        after: frames[actionIndex + 1]!,
        actionIndex,
        turn,
        targetCardIds: targetCardId ? [targetCardId] : [],
        ...(targetCardId ? { finalAdvanceTargetId: targetCardId } : {}),
      });
    }
    expect(observe.outcomes()).toEqual({
      firstAdvanceToScoreTurns: 4,
      finalAdvancesScoredSameTurn: 0,
      finalAdvancesStolen: 1,
      resolvedFinalAdvances: 2,
      finalAdvanceResolutionTurnTotal: 5,
    });
  });

  it("drops advances on cards that leave their installed agenda project", () => {
    const observe = createAgendaProgressionObserver();
    const unadvanced = board({ [first]: 2 });
    const advanced = board({ [first]: 3 });
    observe.observe({
      before: unadvanced,
      after: advanced,
      actionIndex: 0,
      turn: 2,
      targetCardIds: [first],
      finalAdvanceTargetId: first,
    });
    const removed = board({});
    observe.observe({
      before: advanced,
      after: removed,
      actionIndex: 1,
      turn: 3,
      targetCardIds: [first],
    });
    observe.observe({
      before: unadvanced,
      after: board({}, [first]),
      actionIndex: 2,
      turn: 4,
      targetCardIds: [first],
    });
    expect(observe.outcomes()).toEqual({
      finalAdvancesScoredSameTurn: 0,
      finalAdvancesStolen: 0,
      resolvedFinalAdvances: 0,
      finalAdvanceResolutionTurnTotal: 0,
    });
  });
});
