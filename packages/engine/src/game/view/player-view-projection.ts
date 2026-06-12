// ARCH-5R extracts only the read-only PlayerView projection.
// This module creates no LegalActions, executes no actions, and mutates no
// GameState. The host passes LegalActions in from the game legal-actions facade.
import {
  type CounterDisplay,
  type GameState,
  type LegalAction,
  type PlayerView,
  type ServerId,
  type Side,
} from "@netgrid/shared";
import { maxHandSize, runnerMemoryLimit } from "../../ability-engine/effective-values";
import {
  agendaPoints,
  counterDisplaysField,
  poxCounterDisplaysForServer,
  purgeableRunnerVirusCounterDisplaysForServer,
  spyCounterDisplaysForServer,
  visibleCorpArchives,
  visibleCorpCard,
  visibleCorpIdentityCard,
  visibleOwnCard,
  visibleOwnCardForViewer,
  visibleRunnerRigCardForViewer,
  visibleSpecialZones,
} from "./card-view";
import { visibleChoice } from "./choice-view";
import { toPublicEventForSide } from "./public-event-view";
import { visibleEffectiveIceRunQuote } from "./visible-run-quote";

const RESTRICTIVE_NET_ZONING_ID = "onr_v1_173_restrictive-net-zoning";

export function buildPlayerViewProjection(
  state: GameState,
  side: Side,
  legalActions: LegalAction[],
): PlayerView {
  const runnerSide = side === "runner";
  const visibleServers = state.corp.servers.map((server) => {
    const ice = server.ice.map((id) => {
      const visibleIce = visibleCorpCard(state, id, side, "ice");
      const effectiveRunQuote = visibleEffectiveIceRunQuote(
        state,
        id,
        visibleIce,
      );
      return effectiveRunQuote
        ? { ...visibleIce, effectiveRunQuote }
        : visibleIce;
    });
    return {
      id: server.id,
      label: server.label,
      ice,
      root:
        server.id === "archives"
          ? visibleCorpArchives(state, side)
          : server.root.map((id) => visibleCorpCard(state, id, side, "root")),
      ...counterDisplaysField([
        ...(poxCounterDisplaysForServer(state, server.id) ?? []),
        ...(purgeableRunnerVirusCounterDisplaysForServer(state, server.id) ?? []),
        ...(spyCounterDisplaysForServer(state, server.id) ?? []),
        ...(restrictiveNetZoningCounterDisplaysForServer(
          state,
          server.id,
          server.label,
        ) ?? []),
      ]),
    };
  });

  const run = state.run
    ? {
        attackedServerId: state.run.attackedServerId,
        phase: state.run.phase,
        position: { ...state.run.position },
        ...(state.run.approachIceExposeViewingIceId
          ? {
              approachedIce: visibleCorpCard(
                state,
                state.run.approachIceExposeViewingIceId,
                side,
                "ice",
              ),
            }
          : {}),
        ...(state.run.encounteredIceId
          ? {
              encounteredIce: visibleCorpCard(
                state,
                state.run.encounteredIceId,
                side,
                "ice",
              ),
            }
          : {}),
        ...(state.run.accessedCardId
          ? {
              accessedCard: visibleCorpCard(
                state,
                state.run.accessedCardId,
                side,
                "root",
              ),
            }
          : {}),
        ...(state.run.breach
          ? {
              breach: {
                breachId: state.run.breach.breachId,
                serverId: state.run.breach.serverId,
                currentIndex: state.run.breach.currentIndex,
                remainingCount: state.run.breach.queue.filter(
                  (entry) => entry.status === "pending",
                ).length,
                completed: state.run.breach.completed,
              },
            }
          : {}),
        ...(state.run.badPublicityCredits !== undefined
          ? { badPublicityCredits: state.run.badPublicityCredits }
          : {}),
        successful: state.run.successful,
      }
    : undefined;

  return {
    side,
    stateVersion: state.stateVersion,
    timingPoint: state.timingPoint,
    activeSide: state.activeSide,
    phase: state.phase,
    own: runnerSide
      ? {
          identity: visibleOwnCard(state, state.runner.identity),
          credits: state.runner.credits,
          clicks: state.runner.clicks,
          agendaPoints: agendaPoints(state, "runner"),
          gripOrHq: state.runner.grip.map((id) => visibleOwnCard(state, id)),
          stackOrRdCount: state.runner.stack.length,
          heapOrArchives: state.runner.heap.map((id) =>
            visibleOwnCard(state, id),
          ),
          scoreArea: state.runner.scoreArea.map((id) =>
            visibleOwnCard(state, id),
          ),
          rig: [
            ...state.runner.rig.programs,
            ...state.runner.rig.hardware,
            ...state.runner.rig.resources,
          ].map((id) => visibleOwnCardForViewer(state, id, side)),
          memoryUsed: state.runner.memoryUsed,
          memoryLimit: runnerMemoryLimit(state),
          maxHandSize: maxHandSize(state, "runner"),
          coreDamage: state.runner.coreDamage,
          tags: state.runner.tags,
        }
      : {
          identity: visibleCorpIdentityCard(state),
          credits: state.corp.credits,
          clicks: state.corp.clicks,
          agendaPoints: agendaPoints(state, "corp"),
          gripOrHq: state.corp.hq.map((id) => visibleOwnCard(state, id)),
          stackOrRdCount: state.corp.rd.length,
          heapOrArchives: state.corp.archives.map((id) =>
            visibleOwnCard(state, id),
          ),
          scoreArea: state.corp.scoreArea.map((id) =>
            visibleOwnCard(state, id),
          ),
          maxHandSize: maxHandSize(state, "corp"),
          tags: state.runner.tags,
        },
    opponent: runnerSide
      ? {
          identity: visibleCorpIdentityCard(state),
          credits: state.corp.credits,
          clicks: state.corp.clicks,
          agendaPoints: agendaPoints(state, "corp"),
          tags: state.runner.tags,
          handCount: state.corp.hq.length,
          maxHandSize: maxHandSize(state, "corp"),
          deckCount: state.corp.rd.length,
          discardCount: state.corp.archives.length,
          scoreArea: state.corp.scoreArea.map((id) =>
            visibleOwnCard(state, id),
          ),
        }
      : {
          identity: visibleOwnCard(state, state.runner.identity),
          credits: state.runner.credits,
          clicks: state.runner.clicks,
          agendaPoints: agendaPoints(state, "runner"),
          tags: state.runner.tags,
          handCount: state.runner.grip.length,
          maxHandSize: maxHandSize(state, "runner"),
          coreDamage: state.runner.coreDamage,
          deckCount: state.runner.stack.length,
          discardCount: state.runner.heap.length,
          discardCards: state.runner.heap.map((id) =>
            visibleOwnCard(state, id),
          ),
          scoreArea: state.runner.scoreArea.map((id) =>
            visibleOwnCard(state, id),
          ),
          rig: [
            ...state.runner.rig.programs,
            ...state.runner.rig.hardware,
            ...state.runner.rig.resources,
          ].map((id) => visibleRunnerRigCardForViewer(state, id, side)),
          memoryUsed: state.runner.memoryUsed,
          memoryLimit: runnerMemoryLimit(state),
        },
    servers: visibleServers,
    specialZones: visibleSpecialZones(state, side),
    ...(run ? { run } : {}),
    ...(state.pendingChoice?.side === side
      ? { pendingChoice: visibleChoice(state, state.pendingChoice) }
      : {}),
    ...(state.deckMetadata
      ? {
          deckMetadata: {
            own:
              side === "runner"
                ? state.deckMetadata.runner
                : state.deckMetadata.corp,
            opponent:
              side === "runner"
                ? state.deckMetadata.corp
                : state.deckMetadata.runner,
          },
        }
      : {}),
    publicEvents: state.eventLog.map((event) => toPublicEventForSide(event, side)),
    legalActions,
    winner: state.winner,
    agendaPointsToWin: state.agendaPointsToWin,
    ...(state.gameEndReason ? { gameEndReason: state.gameEndReason } : {}),
  };
}

function restrictiveNetZoningCounterDisplaysForServer(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
  serverLabel: string,
): CounterDisplay[] | undefined {
  const amount = state.runner.rig.resources.reduce((sum, cardId) => {
    const instance = state.cardInstances[cardId];
    if (
      instance?.definitionId !== RESTRICTIVE_NET_ZONING_ID ||
      instance.faceup === false ||
      instance.selectedServerId !== serverId
    ) {
      return sum;
    }
    return sum + 2;
  }, 0);
  if (amount <= 0) return undefined;
  return [
    {
      id: `restrictive_net_zoning_install_cost_${serverId}`,
      amount,
      displayKind: "generic_counter",
      label: "Install +",
      ariaLabel: `${serverLabel}: ICE-Installationskosten +${amount} durch Restrictive Net Zoning.`,
      counterType: "install_cost_modifier",
      usageHint: "status_marker",
    },
  ];
}
