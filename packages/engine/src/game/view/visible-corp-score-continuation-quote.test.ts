import type { CardInstance, CardInstanceId } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { createGame } from "../create-game";
import { addCorpActionDebt } from "../turn/turn-basic-execution";
import {
  visibleCorpFutureFlexibleClicks,
  visibleCorpScoreContinuationQuote,
} from "./visible-corp-score-continuation-quote";

describe("visible Corp score continuation quote", () => {
  it("carries known debt and expires one-turn action grants before the second turn", () => {
    const state = createGame({
      seed: "corp-campaign-clicks",
      setupMode: "completed",
    });
    const source = state.cardInstances[state.corp.identity]!;
    state.actionEconomy = {
      ...state.actionEconomy,
      futureGrants: [
        {
          side: "corp",
          sourceCardInstanceId: source.instanceId,
          sourceDefinitionId: source.definitionId,
          amountPerTurn: 1,
          remainingTurns: 1,
        },
      ],
    };
    addCorpActionDebt(state, {
      amount: 5,
      reason: "fixture",
      source: source.instanceId,
    });
    expect(visibleCorpFutureFlexibleClicks(state)).toEqual([0, 2]);
  });
  it("uses effective scored-agenda points for terminal certification", () => {
    const state = createGame({
      seed: "effective-terminal-score",
      setupMode: "completed",
    });
    const remoteId = "r1" as const;
    state.corp.servers.push({
      id: remoteId,
      label: "Remote 1",
      kind: "remote",
      ice: [],
      root: [],
    });
    const scoredIds = ["spent_1", "spent_2", "spent_3"] as CardInstanceId[];
    for (const cardId of scoredIds) {
      state.cardInstances[cardId] = agenda(cardId, {
        side: "corp",
        zone: "scoreArea",
      });
      state.cardInstances[cardId]!.agendaPointsSpent = 1;
      state.corp.scoreArea.push(cardId);
    }
    const candidateId = "candidate" as CardInstanceId;
    state.cardInstances[candidateId] = {
      ...agenda(candidateId, {
        side: "corp",
        zone: "serverRoot",
        serverId: remoteId,
      }),
      advancementCounters: 3,
    };
    state.corp.servers.at(-1)!.root.push(candidateId);

    expect(
      visibleCorpScoreContinuationQuote(state, candidateId, remoteId),
    ).toMatchObject({ complete: true, terminalScore: false });
  });
});

function agenda(
  instanceId: CardInstanceId,
  zone: CardInstance["zone"],
): CardInstance {
  return {
    instanceId,
    definitionId: 588,
    owner: "corp" as const,
    controller: "corp" as const,
    zone,
    faceup: true,
    rezzed: false,
    advancementCounters: 0,
    strengthModifier: 0,
  };
}
