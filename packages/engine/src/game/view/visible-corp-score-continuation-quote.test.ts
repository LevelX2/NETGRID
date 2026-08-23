import type { CardInstance, CardInstanceId } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { createGame } from "../create-game";
import { visibleCorpScoreContinuationQuote } from "./visible-corp-score-continuation-quote";

describe("visible Corp score continuation quote", () => {
  it("uses effective scored-agenda points for terminal certification", () => {
    const state = createGame({
      seed: "effective-terminal-score",
      setupMode: "completed",
    });
    const remoteId = "remote_1" as const;
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
    definitionId: "simple_agenda",
    owner: "corp" as const,
    controller: "corp" as const,
    zone,
    faceup: true,
    rezzed: false,
    advancementCounters: 0,
    strengthModifier: 0,
  };
}
