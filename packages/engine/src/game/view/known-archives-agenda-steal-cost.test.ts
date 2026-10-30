import { expect, it } from "vitest";
import { ORIGINALSET_DEFAULT_DECKS } from "@netgrid/shared";
import {
  createGameAfterSetup,
  getPlayerView,
  hashGameState,
} from "../../index";
import { putCorpRootInRemote } from "../../test-fixtures/mechanic-smoke-fixtures";

function fixture() {
  const state = createGameAfterSetup({
    seed: "known-archives-agenda-cost",
    runnerDeck: ORIGINALSET_DEFAULT_DECKS.runner,
    corpDeck: {
      ...ORIGINALSET_DEFAULT_DECKS.corp,
      cards: [
        { id: "onr_proteus_004_fetal-ai", quantity: 1 },
        ...ORIGINALSET_DEFAULT_DECKS.corp.cards.filter(
          (c) => c.id !== "onr_proteus_004_fetal-ai",
        ),
      ],
    },
  });
  const id = putCorpRootInRemote(state, "onr_proteus_004_fetal-ai");
  const remote = state.corp.servers.find((server) => server.id === "remote_1")!;
  remote.root = remote.root.filter((card) => card !== id);
  state.corp.archives.push(id);
  state.cardInstances[id]!.zone = { side: "corp", zone: "archives" };
  state.cardInstances[id]!.faceup = true;
  return { state, id };
}
it("publishes the complete current steal cost for a public Archives agenda without mutating state", () => {
  const { state, id } = fixture(),
    before = hashGameState(state);
  const archives = getPlayerView(state, "runner").servers.find(
    (s) => s.id === "archives",
  )!;
  expect(
    archives.root.find((c) => c.instanceId === id)?.effectiveStealCostQuote,
  ).toEqual({
    stateVersion: state.stateVersion,
    serverId: "archives",
    agendaInstanceId: id,
    creditCost: 2,
    complete: true,
  });
  expect(archives.runnerAgendaStealCostQuote?.minimumCreditCost).toBe(0);
  expect(hashGameState(state)).toBe(before);
});
it("does not reveal a facedown Archives agenda or a Runner-only quote to the Corp", () => {
  const { state, id } = fixture();
  state.cardInstances[id]!.faceup = false;
  expect(
    getPlayerView(state, "runner")
      .servers.find((s) => s.id === "archives")!
      .root.some((c) => c.instanceId === id),
  ).toBe(false);
  expect(
    getPlayerView(state, "corp")
      .servers.find((s) => s.id === "archives")!
      .root.find((c) => c.instanceId === id),
  ).not.toHaveProperty("effectiveStealCostQuote");
});
