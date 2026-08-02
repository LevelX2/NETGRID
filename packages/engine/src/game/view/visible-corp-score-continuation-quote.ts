import type {
  CardInstanceId,
  GameState,
  ServerId,
  VisibleCorpScoreContinuationQuote,
} from "@netgrid/shared";
import { effectiveAgendaDifficulty } from "../../ability-engine/effective-values";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import {
  definitionFor,
  serverDifficultyIncreaseFromRunCounters,
  serverDifficultyReductionFromUpgrades,
} from "./card-view";

const STANDARD_CORP_TURN_CLICKS = 3;

/**
 * Certifies the narrow, deterministic next-Corp-turn score continuation for
 * an installed agenda. The score plan owns interpretation of this quote; other
 * plans may only preserve the published resulting reserve.
 */
export function visibleCorpScoreContinuationQuote(
  state: GameState,
  agendaCardId: CardInstanceId,
  serverId: Exclude<ServerId, "new_remote">,
): VisibleCorpScoreContinuationQuote {
  const instance = state.cardInstances[agendaCardId];
  const binding = {
    context: "installed_agenda" as const,
    agendaCardId,
    serverId,
    expiresAtStateVersion: state.stateVersion,
  };
  if (
    !instance ||
    instance.zone.side !== "corp" ||
    instance.zone.zone !== "serverRoot" ||
    instance.zone.serverId !== serverId
  ) {
    return { ...binding, complete: false, reason: "not_installed_root" };
  }
  const definition = definitionFor(state, agendaCardId);
  if (definition.type !== "agenda") {
    return { ...binding, complete: false, reason: "not_agenda" };
  }

  const requirement = effectiveAgendaDifficulty(
    {
      definitionFor,
      serverDifficultyIncreaseFromRunCounters,
      serverDifficultyReductionFromUpgrades,
    },
    state,
    agendaCardId,
  );
  const remainingAdvancementCounters = Math.max(
    0,
    requirement - Math.max(0, Math.floor(instance.advancementCounters)),
  );
  const nextCorpTurnGuaranteedFlexibleClicks =
    guaranteedNextCorpTurnFlexibleClicks(state);
  if (remainingAdvancementCounters > nextCorpTurnGuaranteedFlexibleClicks) {
    return {
      ...binding,
      complete: false,
      reason: "not_completable_next_corp_turn",
    };
  }
  const freeCreditClicksAfterAdvancement =
    nextCorpTurnGuaranteedFlexibleClicks - remainingAdvancementCounters;
  const certifiedCreditGainFromFreeClicks = freeCreditClicksAfterAdvancement;
  const creditsRequiredBeforeNextCorpTurn = Math.max(
    0,
    remainingAdvancementCounters - certifiedCreditGainFromFreeClicks,
  );
  return {
    ...binding,
    complete: true,
    remainingAdvancementCounters,
    advancementCreditCostPerCounter: 1,
    advancementClickCostPerCounter: 1,
    scoreActionCreditCost: 0,
    scoreActionClickCost: 0,
    nextCorpTurnGuaranteedFlexibleClicks,
    freeCreditClicksAfterAdvancement,
    certifiedCreditGainFromFreeClicks,
    creditsRequiredBeforeNextCorpTurn,
    terminalScore:
      state.corp.scoreArea.reduce(
        (sum, scoreAreaCardId) => {
          const scoreDefinition = definitionFor(state, scoreAreaCardId);
          return sum + (scoreDefinition.agendaPoints ?? 0);
        },
        Math.max(0, Math.floor(state.corpBonusAgendaPoints ?? 0)),
      ) +
        (definition.agendaPoints ?? 0) >=
      state.agendaPointsToWin,
  };
}

export function guaranteedNextCorpTurnFlexibleClicks(state: GameState): number {
  return Math.max(
    0,
    STANDARD_CORP_TURN_CLICKS +
      unrestrictedFutureCorpActionGrants(state) +
      unrestrictedScoredAgendaActionGrants(state) -
      Math.max(0, Math.floor(state.corpActionDebt?.forgoActionsPending ?? 0)),
  );
}

function unrestrictedFutureCorpActionGrants(state: GameState): number {
  return (state.actionEconomy?.futureGrants ?? []).reduce(
    (sum, grant) =>
      grant.side === "corp" &&
      grant.remainingTurns > 0 &&
      grant.restriction === undefined
        ? sum + Math.max(0, Math.floor(grant.amountPerTurn))
        : sum,
    0,
  );
}

function unrestrictedScoredAgendaActionGrants(state: GameState): number {
  return state.corp.scoreArea.reduce((sum, scoreAreaCardId) => {
    const implementation = cardImplementationForDefinitionId(
      definitionFor(state, scoreAreaCardId).id,
    )?.scoredAgenda;
    if (implementation?.kind !== "overadvance_start_of_corp_turn_actions") {
      return sum;
    }
    const marks = Math.max(
      0,
      Math.floor(state.cardInstances[scoreAreaCardId]?.counters?.mark ?? 0),
    );
    return sum + marks;
  }, 0);
}
