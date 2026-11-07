import { createGameAfterSetup, getPlayerView } from "@netgrid/engine";
import type { CardInstance } from "@netgrid/shared";
import { expect, it } from "vitest";
import { aiInput } from "./semantic-ai-runtime-cutover.test-support";
import { bindPublicBoardStealQuoteCompanion } from "./public-board-steal-quotes.test-support";

it.each([
  { rezzed: true, known: true, minimum: 5, agenda: 7, archived: false },
  { rezzed: false, known: true, minimum: 0, agenda: 2, archived: false },
  {
    rezzed: true,
    known: false,
    minimum: 5,
    agenda: undefined,
    archived: false,
  },
  { rezzed: true, known: true, minimum: 0, agenda: 2, archived: true },
])(
  "quotes only the current public board through the Engine: %j",
  ({ rezzed, known, minimum, agenda, archived }) => {
    const state = createGameAfterSetup({ seed: "public-board-quote-witness" });
    const instance = (
      id: string,
      definitionId: string,
      faceup: boolean,
      isRezzed: boolean,
    ): CardInstance => ({
      instanceId: id,
      definitionId,
      owner: "corp",
      controller: "corp",
      zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
      faceup,
      rezzed: isRezzed,
      advancementCounters: 0,
      strengthModifier: 0,
    });
    state.cardInstances["public-tax"] = instance(
      "public-tax",
      "onr_v1_366_red-herrings",
      rezzed,
      rezzed,
    );
    state.cardInstances["agenda"] = instance(
      "agenda",
      "onr_proteus_004_fetal-ai",
      known,
      false,
    );
    state.corp.servers.push({
      id: "remote_1",
      kind: "remote",
      label: "Remote 1",
      ice: [],
      root: ["public-tax", "agenda"],
    });
    if (archived) {
      state.corp.servers.find((server) => server.id === "remote_1")!.root = [
        "agenda",
      ];
      state.corp.archives.push("public-tax");
      state.cardInstances["public-tax"]!.zone = {
        side: "corp",
        zone: "archives",
      };
    }
    const view = getPlayerView(state, "runner");
    const native = {
      ...aiInput("runner", view.legalActions),
      playerView: view,
      legalActions: view.legalActions,
    };
    const before = native.playerView.servers.find(
      (server) => server.id === "remote_1",
    )!;
    expect(before.runnerAgendaStealCostQuote?.minimumCreditCost).toBe(minimum);
    expect(
      before.root.find((card) => card.instanceId === "agenda")
        ?.effectiveStealCostQuote?.creditCost,
    ).toBe(agenda);
    const companion = structuredClone(native);
    for (const server of companion.playerView.servers) {
      delete server.runnerAgendaStealCostQuote;
      for (const card of server.root) delete card.effectiveStealCostQuote;
    }
    bindPublicBoardStealQuoteCompanion(companion);
    expect(
      companion.playerView.servers.map((server) => ({
        id: server.id,
        quote: server.runnerAgendaStealCostQuote,
        agendas: server.root
          .filter((card) => card.known && card.type === "agenda")
          .map((card) => card.effectiveStealCostQuote),
      })),
    ).toEqual(
      native.playerView.servers.map((server) => ({
        id: server.id,
        quote: server.runnerAgendaStealCostQuote,
        agendas: server.root
          .filter((card) => card.known && card.type === "agenda")
          .map((card) => card.effectiveStealCostQuote),
      })),
    );
  },
);
