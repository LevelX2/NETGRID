import type { CardInstanceId, GameState } from "@netgrid/shared";
import { serverIdForCorpInstalledCard } from "../runtime/installed-card-location";
import { cardTargetTypeForInstance } from "../runtime/simulation-card-target";

export type AgendaProgressionOutcomes = {
  firstAdvanceToScoreTurns?: number;
  finalAdvancesScoredSameTurn: number;
  finalAdvancesStolen: number;
  resolvedFinalAdvances: number;
  finalAdvanceResolutionTurnTotal: number;
};

type Advance = {
  firstTurn: number;
  firstActionIndex: number;
  finalAdvanceTurns: number[];
};

type Observation = {
  before: GameState;
  after: GameState;
  actionIndex: number;
  turn: number;
  targetCardIds: readonly CardInstanceId[];
  finalAdvanceTargetId?: CardInstanceId;
};

/** Match card-instance ids in the trusted simulator. Only numeric outcomes are reported. */
export function createAgendaProgressionObserver() {
  const pending = new Map<CardInstanceId, Advance>();
  const outcomes: AgendaProgressionOutcomes = {
    finalAdvancesScoredSameTurn: 0,
    finalAdvancesStolen: 0,
    resolvedFinalAdvances: 0,
    finalAdvanceResolutionTurnTotal: 0,
  };
  let firstScoredAdvanceIndex = Number.POSITIVE_INFINITY;

  function observe(observation: Observation): void {
    const { before, after, actionIndex, turn } = observation;
    for (const cardId of observation.targetCardIds) {
      const beforeCard = before.cardInstances[cardId];
      const afterCard = after.cardInstances[cardId];
      if (
        !beforeCard ||
        !afterCard ||
        afterCard.advancementCounters <= beforeCard.advancementCounters ||
        cardTargetTypeForInstance(before, cardId) !== "agenda" ||
        !serverIdForCorpInstalledCard(after, cardId)?.startsWith("remote_")
      ) {
        continue;
      }
      let advance = pending.get(cardId);
      if (!advance) {
        advance = {
          firstTurn: turn,
          firstActionIndex: actionIndex,
          finalAdvanceTurns: [],
        };
        pending.set(cardId, advance);
      }
      if (observation.finalAdvanceTargetId === cardId)
        advance.finalAdvanceTurns.push(turn);
    }

    for (const [cardId, advance] of pending) {
      const scored =
        after.corp.scoreArea.includes(cardId) &&
        !before.corp.scoreArea.includes(cardId);
      const stolen =
        after.runner.scoreArea.includes(cardId) &&
        !before.runner.scoreArea.includes(cardId);
      if (scored || stolen) {
        if (scored && advance.firstActionIndex < firstScoredAdvanceIndex) {
          firstScoredAdvanceIndex = advance.firstActionIndex;
          outcomes.firstAdvanceToScoreTurns = turn - advance.firstTurn;
        }
        for (const finalAdvanceTurn of advance.finalAdvanceTurns) {
          outcomes.resolvedFinalAdvances += 1;
          outcomes.finalAdvanceResolutionTurnTotal += turn - finalAdvanceTurn;
          if (scored && finalAdvanceTurn === turn)
            outcomes.finalAdvancesScoredSameTurn += 1;
          if (stolen) outcomes.finalAdvancesStolen += 1;
        }
        pending.delete(cardId);
        continue;
      }
      if (!serverIdForCorpInstalledCard(after, cardId)?.startsWith("remote_")) {
        pending.delete(cardId);
      }
    }
  }

  return { observe, outcomes: () => ({ ...outcomes }) };
}
