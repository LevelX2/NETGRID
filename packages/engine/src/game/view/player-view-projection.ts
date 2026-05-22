// ARCH-5R extracts only the read-only PlayerView projection.
// This module creates no LegalActions, executes no actions, and mutates no
// GameState. The host passes LegalActions in until getLegalActions itself moves
// behind the game facade in a later ARCH step.
import {
  type GameState,
  type LegalAction,
  type PlayerView,
  type Side,
} from "@netgrid/shared";
import { maxHandSize, runnerMemoryLimit } from "../../ability-engine/effective-values";
import {
  agendaPoints,
  counterDisplaysField,
  poxCounterDisplaysForServer,
  visibleCorpArchives,
  visibleCorpCard,
  visibleCorpIdentityCard,
  visibleOwnCard,
  visibleRunnerRigCardForViewer,
  visibleSpecialZones,
} from "./card-view";
import { visibleChoice } from "./choice-view";
import { redactPublicEventForSide, toPublicEvent } from "./public-event-view";
export function buildPlayerViewProjection(
  state: GameState,
  side: Side,
  legalActions: LegalAction[],
): PlayerView {
  const runnerSide = side === "runner";
  const visibleServers = state.corp.servers.map((server) => ({
    id: server.id,
    label: server.label,
    ice: server.ice.map((id) => visibleCorpCard(state, id, side, "ice")),
    root:
      server.id === "archives"
        ? visibleCorpArchives(state, side)
        : server.root.map((id) => visibleCorpCard(state, id, side, "root")),
    ...counterDisplaysField(poxCounterDisplaysForServer(state, server.id)),
  }));

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
          ].map((id) => visibleOwnCard(state, id)),
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
    publicEvents: state.eventLog.map((event) =>
      redactPublicEventForSide(toPublicEvent(event), side),
    ),
    legalActions,
    winner: state.winner,
    agendaPointsToWin: state.agendaPointsToWin,
    ...(state.gameEndReason ? { gameEndReason: state.gameEndReason } : {}),
  };
}
