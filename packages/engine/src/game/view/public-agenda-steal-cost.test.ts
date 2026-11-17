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
        { id: 578, quantity: 2 },
        { id: 66, quantity: 1 },
        ...ORIGINALSET_DEFAULT_DECKS.corp.cards.filter(
          (c) =>
            ![
              578,
              66,
            ].includes(c.id),
        ),
      ],
    },
  });
  const tax = putCorpRootInRemote(state, 578);
  const agenda = putCorpRootInRemote(state, 66);
  return { state, tax, agenda };
}
it("quotes only public active server modifiers before any agenda is known", () => {
  const { state, tax, agenda } = fixture();
  const quote = () =>
    getPlayerView(state, "runner").servers.find((s) => s.id === "r1")!;
  expect(quote().runnerAgendaStealCostQuote).toMatchObject({
    stateVersion: state.stateVersion,
    serverId: "r1",
    minimumCreditCost: 0,
    complete: true,
  });
  state.cardInstances[tax]!.rezzed = true;
  state.cardInstances[tax]!.faceup = true;
  expect(quote().runnerAgendaStealCostQuote?.minimumCreditCost).toBe(5);
  expect(quote().root[1]).toMatchObject({ known: false });
  expect(quote().root[1]).not.toHaveProperty("definitionId");
  const original = structuredClone(quote().runnerAgendaStealCostQuote);
  state.cardInstances[agenda]!.definitionId = 578;
  expect(quote().runnerAgendaStealCostQuote).toEqual(original);
  expect(
    getPlayerView(state, "corp").servers.find((s) => s.id === "r1"),
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
    server = view.servers.find((s) => s.id === "r1")!;
  expect(
    server.root.find((c) => c.instanceId === agenda)?.effectiveStealCostQuote,
  ).toEqual({
    stateVersion: state.stateVersion,
    serverId: "r1",
    agendaInstanceId: agenda,
    creditCost: 5,
    complete: true,
  });
});
it("counts a public access snapshot once and preserves it after its active source leaves", () => {
  const { state, tax } = fixture();
  state.cardInstances[tax]!.rezzed = true;
  state.run = {
    runId: 201431,
    attackedServerId: "r1",
    phase: "access",
    position: { kind: "server", serverId: "r1" },
    brokenSubroutineIndexes: [],
    resolvedSubroutineIndexes: [],
    successful: true,
    accessStealCostModifierSnapshotsByServer: {
      r1: [
        {
          sourceCardInstanceId: tax,
          sourceDefinitionId: 578,
          sourceTitle: "Red Herrings",
          amount: 5,
          visibility: "public",
          appliesToCardType: "agenda",
        },
      ],
    },
  };
  expect(quotePublicServerAgendaStealCost(state, "r1")).toBe(5);
  state.cardInstances[tax]!.rezzed = false;
  expect(quotePublicServerAgendaStealCost(state, "r1")).toBe(5);
  expect(quotePublicServerAgendaStealCost(state, "hq")).toBe(0);
});
