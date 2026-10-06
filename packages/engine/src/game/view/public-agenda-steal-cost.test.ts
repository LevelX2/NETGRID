import { expect, it } from "vitest";
import { ORIGINALSET_DEFAULT_DECKS } from "@netgrid/shared";
import { createGameAfterSetup, getPlayerView } from "../../index";
import { putCorpRootInRemote } from "../../test-fixtures/mechanic-smoke-fixtures";
import { quotePublicServerAgendaStealCost } from "../../ability-engine/steal-cost-modifiers";

function fixture() {
  const state = createGameAfterSetup({
    seed: "public-steal-cost",
    runnerDeck: ORIGINALSET_DEFAULT_DECKS.runner,
    corpDeck: {
      ...ORIGINALSET_DEFAULT_DECKS.corp,
      cards: [
        { id: "onr_v1_366_red-herrings", quantity: 2 },
        { id: "onr_proteus_008_project-zurich", quantity: 1 },
        ...ORIGINALSET_DEFAULT_DECKS.corp.cards.filter(
          (c) =>
            ![
              "onr_v1_366_red-herrings",
              "onr_proteus_008_project-zurich",
            ].includes(c.id),
        ),
      ],
    },
  });
  const tax = putCorpRootInRemote(state, "onr_v1_366_red-herrings");
  const agenda = putCorpRootInRemote(state, "onr_proteus_008_project-zurich");
  return { state, tax, agenda };
}
it("quotes only public active server modifiers before any agenda is known", () => {
  const { state, tax, agenda } = fixture();
  const quote = () =>
    getPlayerView(state, "runner").servers.find((s) => s.id === "remote_1")!;
  expect(quote().runnerAgendaStealCostQuote).toMatchObject({
    stateVersion: state.stateVersion,
    serverId: "remote_1",
    minimumCreditCost: 0,
    complete: true,
  });
  state.cardInstances[tax]!.rezzed = true;
  state.cardInstances[tax]!.faceup = true;
  expect(quote().runnerAgendaStealCostQuote?.minimumCreditCost).toBe(5);
  expect(quote().root[1]).toMatchObject({ known: false });
  expect(quote().root[1]).not.toHaveProperty("definitionId");
  const original = structuredClone(quote().runnerAgendaStealCostQuote);
  state.cardInstances[agenda]!.definitionId = "onr_v1_366_red-herrings";
  expect(quote().runnerAgendaStealCostQuote).toEqual(original);
  expect(
    getPlayerView(state, "corp").servers.find((s) => s.id === "remote_1"),
  ).not.toHaveProperty("runnerAgendaStealCostQuote");
  expect(
    getPlayerView(state, "runner").servers.find((s) => s.id === "hq")!
      .runnerAgendaStealCostQuote?.minimumCreditCost,
  ).toBe(0);
  state.cardInstances[tax]!.rezzed = false;
  expect(quote().runnerAgendaStealCostQuote?.minimumCreditCost).toBe(0);
});
it("keeps the complete known agenda cost distinct from the public lower bound", () => {
  const { state, tax, agenda } = fixture();
  state.cardInstances[tax]!.rezzed = true;
  state.cardInstances[tax]!.faceup = true;
  state.cardInstances[agenda]!.faceup = true;
  const view = getPlayerView(state, "runner"),
    server = view.servers.find((s) => s.id === "remote_1")!;
  expect(
    server.root.find((c) => c.instanceId === agenda)?.effectiveStealCostQuote,
  ).toEqual({
    stateVersion: state.stateVersion,
    serverId: "remote_1",
    agendaInstanceId: agenda,
    creditCost: 5,
    complete: true,
  });
});
it("counts a public access snapshot once and preserves it after its active source leaves", () => {
  const { state, tax } = fixture();
  state.cardInstances[tax]!.rezzed = true;
  state.run = {
    runId: "public-steal-cost-snapshot",
    attackedServerId: "remote_1",
    phase: "access",
    position: { kind: "server", serverId: "remote_1" },
    brokenSubroutineIndexes: [],
    resolvedSubroutineIndexes: [],
    successful: true,
    accessStealCostModifierSnapshotsByServer: {
      remote_1: [
        {
          sourceCardInstanceId: tax,
          sourceDefinitionId: "onr_v1_366_red-herrings",
          sourceTitle: "Red Herrings",
          amount: 5,
          visibility: "public",
          appliesToCardType: "agenda",
        },
      ],
    },
  };
  expect(quotePublicServerAgendaStealCost(state, "remote_1")).toBe(5);
  state.cardInstances[tax]!.rezzed = false;
  expect(quotePublicServerAgendaStealCost(state, "remote_1")).toBe(5);
  expect(quotePublicServerAgendaStealCost(state, "hq")).toBe(0);
});
