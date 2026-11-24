import {
  type CardDefinition,
  type CardInstanceId,
  type CorpServer,
  type GameState,
} from "@netgrid/shared";
import {
  corpRootAssetIdsInServer,
  corpRootMainCardIdsInServer,
  definitionFor,
} from "../state/card-server-lookup";
import { rezCard as executeRezCard } from "../rez/rez-card";
import { passCorpRunRootRezWindow } from "../run/run-rez-window";
import { passApproachedIce } from "../run/run-movement";
import { type RezActionExecutionHost } from "../rez/rez-action-execution";
import type {
  CardFortCapacityModifierImplementation,
  CardInstallCapabilityImplementation,
} from "../../ability-engine/definition-types";
import type { RuntimeDeps } from "./runtime-shared";

export function createInstallRezRuntimeHosts(
  deps: RuntimeDeps,
): import("./install-rez-runtime-port").InstallRezRuntimePort {
  function canInstallCorpRootCardInServer(
    state: GameState,
    definition: CardDefinition,
    server: CorpServer,
  ): boolean {
    const installCapabilities = deps.cardInstallCapabilitiesForDefinition(
      definition.id,
    );
    if (
      installCapabilities.some(
        (capability: CardInstallCapabilityImplementation) =>
          capability.kind === "install_only_in_hq",
      ) &&
      server.id !== "hq"
    )
      return false;
    if (
      installCapabilities.some(
        (capability: CardInstallCapabilityImplementation) =>
          capability.kind === "install_only_in_hq_or_rd",
      ) &&
      server.id !== "hq" &&
      server.id !== "rd"
    )
      return false;
    if (
      deps.mustInstallInsideSubsidiaryDataFort(definition) &&
      server.kind !== "remote"
    )
      return false;
    if (definition.type === "upgrade") return server.kind !== "archives";
    if (server.kind !== "remote") return false;
    if (definition.type !== "agenda" && definition.type !== "asset")
      return false;
    const capacity = corpRootAgendaOrNodeCapacityInServer(state, server);
    const mainIds = corpRootMainCardIdsInServer(state, server);
    if (mainIds.length < capacity) return true;
    if (definition.type === "agenda") {
      const hasAgenda = server.root.some(
        (id) => definitionFor(state, id).type === "agenda",
      );
      return !hasAgenda && corpRootAssetIdsInServer(state, server).length > 0;
    }
    return false;
  }

  function corpRootAgendaOrNodeCapacityInServer(
    state: GameState,
    server: CorpServer,
  ): number {
    return (
      1 +
      server.root.reduce((sum, cardId) => {
        const instance = state.cardInstances[cardId];
        if (
          instance?.zone.side !== "corp" ||
          instance.zone.zone !== "serverRoot" ||
          instance.zone.serverId !== server.id
        )
          return sum;
        return (
          sum +
          deps
            .fortCapacityModifiersForCard(state, cardId)
            .filter(
              (modifier: CardFortCapacityModifierImplementation) =>
                modifier.kind ===
                  "additional_agenda_or_node_slot_inside_fort" &&
                modifier.activeWhile === "installed",
            )
            .reduce(
              (
                innerSum: number,
                modifier: CardFortCapacityModifierImplementation,
              ) => innerSum + modifier.amount,
              0,
            )
        );
      }, 0)
    );
  }

  function corpRegionUpgradeIdsInServer(
    state: GameState,
    server: CorpServer,
  ): CardInstanceId[] {
    return server.root
      .filter((cardId) => {
        const definition = definitionFor(state, cardId);
        return (
          definition.type === "upgrade" &&
          deps.cardHasSubtype(definition, "region")
        );
      })
      .sort();
  }

  function rezActionExecutionHost(state: GameState): RezActionExecutionHost {
    return {
      rez: {
        executeRezCard: (cardId, rootRez, legalAction) =>
          executeRezCard(deps.rezCardHost(state), cardId, rootRez, legalAction),
        expireScoredAgendaInstallRezCreditAbilities: () =>
          deps.expireScoredAgendaInstallRezCreditAbilities(state),
      },
      run: {
        passCorpRunRootRezWindow: (legalAction) =>
          passCorpRunRootRezWindow(
            deps.runRezWindowHostForState(state),
            legalAction,
          ),
        passApproachedIce: (legalAction) =>
          passApproachedIce(deps.runMovementHostForState(state), legalAction),
      },
    };
  }

  return {
    canInstallCorpRootCardInServer,
    corpRootAgendaOrNodeCapacityInServer,
    corpRegionUpgradeIdsInServer,
    rezActionExecutionHost,
  };
}
