import {
  type CardDefinition,
  type CardInstanceId,
  type CorpServer,
  type GameState,
  type LegalAction,
  type ServerId,
} from "@netgrid/shared";
import { quoteCorpIceInstallCost } from "../payment";
import { assertCorpIceInstallAllowed } from "../install/corp-ice-install-restrictions";
import { mustServer } from "../state/card-server-lookup";

export function createZoneRuntimeServices(): import("./zone-runtime-port").ZoneRuntimePort {
  function corpIceInstallBaseCost(server: CorpServer): number {
    return Math.max(0, server.ice.length);
  }

  function outermostIceIndex(server: CorpServer): number {
    return server.ice.length - 1;
  }

  function poxCountersForServer(
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
  ): number {
    return Math.max(0, Math.floor(state.poxCountersByServer?.[serverId] ?? 0));
  }

  function spyCountersForServer(
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
  ): number {
    return Math.max(0, Math.floor(state.spyCountersByServer?.[serverId] ?? 0));
  }

  function poxInstallTax(
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
  ): number {
    return Math.floor(poxCountersForServer(state, serverId) / 2);
  }

  function corpIceInstallAdditionalCost(
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
  ): number {
    return poxInstallTax(state, serverId);
  }

  function corpIceInstallTotalCost(
    state: GameState,
    cardId: CardInstanceId,
    server: CorpServer,
  ): {
    baseCost: number;
    additionalCost: number;
    reduction: number;
    reductionSourceDefinitionIds?: string;
    increaseSourceDefinitionIds?: string;
    totalCost: number;
  } {
    const additionalCost = corpIceInstallAdditionalCost(state, server.id);
    const quote = quoteCorpIceInstallCost(state, cardId, server, {
      additionalCredits: additionalCost,
    });
    return {
      baseCost: quote.baseCredits,
      additionalCost:
        typeof quote.publicPayload.iceInstallAdditionalCost === "number"
          ? quote.publicPayload.iceInstallAdditionalCost
          : additionalCost,
      reduction: quote.modifiers.reduce(
        (sum, modifier) =>
          modifier.kind === "reduction" ? sum + modifier.amount : sum,
        0,
      ),
      reductionSourceDefinitionIds: quote.modifiers
        .filter((modifier) => modifier.kind === "reduction")
        .map((modifier) => modifier.sourceDefinitionId)
        .join(","),
      increaseSourceDefinitionIds: quote.modifiers
        .filter((modifier) => modifier.kind === "increase")
        .map((modifier) => modifier.sourceDefinitionId)
        .join(","),
      totalCost: quote.finalCredits,
    };
  }

  function assertCorpIceInstallCostValid(
    state: GameState,
    cardId: CardInstanceId,
    definition: CardDefinition,
    legalAction: LegalAction,
  ) {
    if (
      legalAction.side !== "corp" ||
      legalAction.type !== "install_card" ||
      legalAction.payload?.placement !== "ice"
    )
      return undefined;
    if (definition.type !== "ice")
      throw new Error("Corp-ICE-Installkosten gelten nur fuer ICE.");
    const serverId = legalAction.payload?.serverId;
    if (serverId === "new_remote") {
      assertCorpIceInstallAllowed(definition, {
        id: "new_remote",
        kind: "remote",
      });
      if ((legalAction.costs[0]?.credits ?? 0) !== 0)
        throw new Error("Corp-ICE-Installkosten sind nicht mehr gueltig.");
      return undefined;
    }
    const server = mustServer(state, String(serverId));
    assertCorpIceInstallAllowed(definition, server);
    const additionalCost = corpIceInstallAdditionalCost(state, server.id);
    const quote = quoteCorpIceInstallCost(state, cardId, server, {
      additionalCredits: additionalCost,
    });
    if (!quote.canPay)
      throw new Error("Corp kann die Installkosten nicht zahlen.");
    if ((legalAction.costs[0]?.credits ?? 0) !== quote.finalCredits)
      throw new Error("Corp-ICE-Installkosten sind nicht mehr gueltig.");
    return quote;
  }

  return {
    corpIceInstallBaseCost,
    outermostIceIndex,
    poxCountersForServer,
    spyCountersForServer,
    poxInstallTax,
    corpIceInstallAdditionalCost,
    corpIceInstallTotalCost,
    assertCorpIceInstallCostValid,
  };
}
