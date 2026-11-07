import { createGameAfterSetup } from "@netgrid/engine";
import type {
  AiDecisionInput,
  CardInstance,
  CorpServer,
  ServerId,
} from "@netgrid/shared";
import { expect } from "vitest";
import { CARD_DEFINITIONS_BY_ID } from "../../engine/src/card-definitions";
import {
  quotePublicServerAgendaStealCost,
  quoteStealCostForKnownAgenda,
} from "../../engine/src/ability-engine/steal-cost-modifiers";
import { bindSyntheticAgendaStealQuotes } from "./agenda-steal-quotes.test-support";

/** Explicit current companion, not a repair of a historical input. The Engine
 * quotes a synthetic board containing exactly the public Corp roots. Hidden
 * unrezzed cards cannot be active public steal modifiers. No private identity,
 * access snapshot, historical cost or missing rule is inferred. */
export function bindPublicBoardStealQuoteCompanion(
  input: AiDecisionInput,
): void {
  expect(input.side).toBe("runner");
  expect(input.playerView.run).toBeUndefined();
  const board = createGameAfterSetup({ seed: "public-steal-quote-companion" });
  board.stateVersion = input.playerView.stateVersion;
  board.corp.hq = [];
  board.corp.rd = [];
  board.corp.archives = [];
  board.corp.scoreArea = [];
  board.corp.servers = input.playerView.servers.map<CorpServer>((server) => ({
    id: server.id,
    kind:
      server.id === "hq" || server.id === "rd" || server.id === "archives"
        ? server.id
        : "remote",
    label: server.label,
    ice: [],
    root: [],
  }));
  for (const server of input.playerView.servers) {
    const materialized = board.corp.servers.find(
      (entry) => entry.id === server.id,
    )!;
    for (const card of server.root) {
      if (!card.known) {
        expect(card.rezzed).not.toBe(true);
        continue;
      }
      expect(card.definitionId).toBeDefined();
      expect(typeof card.rezzed).toBe("boolean");
      const definition = CARD_DEFINITIONS_BY_ID[card.definitionId!];
      expect(definition).toBeDefined();
      expect(definition!.type).toBe(card.type);
      expect(Number.isSafeInteger(card.advancementCounters)).toBe(true);
      const instance: CardInstance = {
        instanceId: card.instanceId,
        definitionId: definition!.id,
        owner: "corp",
        controller: "corp",
        faceup: true,
        rezzed: card.rezzed!,
        zone:
          server.id === "archives"
            ? { side: "corp", zone: "archives" }
            : { side: "corp", zone: "serverRoot", serverId: server.id },
        advancementCounters: card.advancementCounters!,
        strengthModifier: 0,
      };
      board.cardInstances[card.instanceId] = instance;
      if (server.id === "archives") board.corp.archives.push(card.instanceId);
      else materialized.root.push(card.instanceId);
    }
  }
  for (const server of input.playerView.servers) {
    const id = server.id as Exclude<ServerId, "new_remote">;
    const costs = Object.fromEntries(
      server.root
        .filter((card) => card.known && card.type === "agenda")
        .map((card) => [
          card.instanceId,
          quoteStealCostForKnownAgenda(
            board,
            id,
            card.instanceId,
            CARD_DEFINITIONS_BY_ID[card.definitionId!]!,
          ).totalCost,
        ]),
    );
    const minimumCreditCost = quotePublicServerAgendaStealCost(board, id);
    if (server.runnerAgendaStealCostQuote)
      expect(server.runnerAgendaStealCostQuote).toEqual({
        stateVersion: input.playerView.stateVersion,
        serverId: server.id,
        minimumCreditCost,
        complete: true,
      });
    for (const agenda of server.root.filter(
      (card) => card.known && card.type === "agenda",
    )) {
      if (agenda.effectiveStealCostQuote)
        expect(agenda.effectiveStealCostQuote).toEqual({
          stateVersion: input.playerView.stateVersion,
          serverId: server.id,
          agendaInstanceId: agenda.instanceId,
          creditCost: costs[agenda.instanceId],
          complete: true,
        });
    }
    bindSyntheticAgendaStealQuotes(input, server.id, minimumCreditCost, costs);
  }
}
