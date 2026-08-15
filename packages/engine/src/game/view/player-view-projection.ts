// ARCH-5R extracts only the read-only PlayerView projection.
// This module creates no LegalActions, executes no actions, and mutates no
// GameState. The host passes LegalActions in from the game legal-actions facade.
import {
  type GameState,
  type LegalAction,
  type PlayerView,
  type Side,
} from "@netgrid/shared";
import {
  maxHandSize,
  runnerMemoryLimit,
} from "../../ability-engine/effective-values";
import { projectInstalledCorpIceRezCost } from "../payment";
import {
  agendaPoints,
  counterDisplaysField,
  poxCounterDisplaysForServer,
  purgeableRunnerVirusCounterDisplaysForServer,
  spyCounterDisplaysForServer,
  visibleCorpArchives,
  visibleCorpCard,
  visibleCorpIdentityCard,
  visibleFreeNetOrCoreDamagePreventionRemaining,
  visibleOwnCard,
  visibleOwnCardForViewer,
  visibleRunnerRigCardForViewer,
  visibleSpecialZones,
} from "./card-view";
import { visibleChoice } from "./choice-view";
import { toPublicEventForSide } from "./public-event-view";
import { visibleCorpIceRezResourceExchangeQuote } from "./visible-rez-resource-exchange-quote";
import { visibleEffectiveIceRunQuote } from "./visible-run-quote";
import { quoteCorpCentralAccesses } from "./corp-central-access-quotes";
import { visibleCorpScoreContinuationQuote } from "./visible-corp-score-continuation-quote";
import { visibleCorpCounterBankPreparationQuote } from "./visible-corp-counter-bank-preparation-quote";
import { visibleServerStatuses } from "./server-status-view";
import { visibleRunnerTraceSupportQuote } from "./visible-runner-trace-support-quote";
import { visibleCorpIcePostRezRunQuote } from "./visible-post-rez-run-quote";
import {
  normalizeTraceRulesProfile,
  traceCorpBaseStrength,
} from "../trace/trace-rules-profile";

export function buildPlayerViewProjection(
  state: GameState,
  side: Side,
  legalActions: LegalAction[],
): PlayerView {
  const runnerSide = side === "runner";
  const corpCentralAccessQuotes =
    side === "corp" ? quoteCorpCentralAccesses(state) : undefined;
  const visibleServers = state.corp.servers.map((server) => {
    const statuses = visibleServerStatuses(state, server.id);
    const ice = server.ice.map((id) => {
      const visibleIce = visibleCorpCard(state, id, side, "ice");
      const effectiveRunQuote = visibleEffectiveIceRunQuote(
        state,
        id,
        visibleIce,
      );
      if (
        visibleIce.known &&
        visibleIce.rezzed === true &&
        visibleIce.type === "ice" &&
        !effectiveRunQuote
      ) {
        throw new Error(
          `Known rezzed ICE ${visibleIce.definitionId ?? id} is missing its effective run quote.`,
        );
      }
      const effectiveRezCostQuote =
        side === "corp" ? projectInstalledCorpIceRezCost(state, id) : undefined;
      const effectivePostRezRunQuote =
        side === "corp"
          ? visibleCorpIcePostRezRunQuote(state, id, visibleIce)
          : undefined;
      const effectiveRezResourceExchangeQuote =
        side === "corp"
          ? visibleCorpIceRezResourceExchangeQuote(state, id, visibleIce)
          : undefined;
      return {
        ...visibleIce,
        ...(effectiveRunQuote ? { effectiveRunQuote } : {}),
        ...(effectivePostRezRunQuote ? { effectivePostRezRunQuote } : {}),
        ...(effectiveRezCostQuote ? { effectiveRezCostQuote } : {}),
        ...(effectiveRezResourceExchangeQuote
          ? { effectiveRezResourceExchangeQuote }
          : {}),
      };
    });
    return {
      id: server.id,
      label: server.label,
      ice,
      root:
        server.id === "archives"
          ? visibleCorpArchives(state, side)
          : server.root.map((id) => {
              const visibleRoot = visibleCorpCard(state, id, side, "root");
              const continuationQuote =
                side === "corp" && visibleRoot.type === "agenda"
                  ? visibleCorpScoreContinuationQuote(state, id, server.id)
                  : undefined;
              const counterBankPreparationQuote =
                side === "corp"
                  ? visibleCorpCounterBankPreparationQuote(state, id)
                  : undefined;
              return {
                ...visibleRoot,
                ...(continuationQuote
                  ? { scoreContinuationQuote: continuationQuote }
                  : {}),
                ...(counterBankPreparationQuote
                  ? { counterBankPreparationQuote }
                  : {}),
              };
            }),
      ...(statuses.length > 0 ? { statuses } : {}),
      ...counterDisplaysField([
        ...(poxCounterDisplaysForServer(state, server.id) ?? []),
        ...(purgeableRunnerVirusCounterDisplaysForServer(state, server.id) ??
          []),
        ...(spyCounterDisplaysForServer(state, server.id) ?? []),
      ]),
    };
  });

  const run = state.run
    ? {
        runId: state.run.runId,
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
        ...(runnerSide && state.run.secretSpendGuessRunAutoPassIceId
          ? {
              pendingAutoPassIceId: state.run.secretSpendGuessRunAutoPassIceId,
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
        ...(state.run.runnerRunTemporaryCredits
          ? {
              runnerRunTemporaryCredits: {
                ...state.run.runnerRunTemporaryCredits,
              },
            }
          : {}),
        ...(state.run.unpreventableCoreDamageAtRunEnd
          ? {
              unpreventableCoreDamageAtRunEnd: {
                ...state.run.unpreventableCoreDamageAtRunEnd,
              },
            }
          : {}),
        ...(state.run.runTraceLinkBonus !== undefined
          ? { runTraceLinkBonus: state.run.runTraceLinkBonus }
          : {}),
        ...(state.run.corpRezCostSurcharge
          ? { corpRezCostSurcharge: { ...state.run.corpRezCostSurcharge } }
          : {}),
        ...(state.run.eventApproachIceExposeBeforeRez
          ? { eventApproachIceExposeBeforeRez: true }
          : {}),
        ...(state.run.prohibitNoisyIcebreakers
          ? { prohibitNoisyIcebreakers: true }
          : {}),
        ...(state.run.runnerCreditGainOnCorpRez !== undefined
          ? { runnerCreditGainOnCorpRez: state.run.runnerCreditGainOnCorpRez }
          : {}),
        ...(state.run.damagePreventionPool
          ? { damagePreventionPool: { ...state.run.damagePreventionPool } }
          : {}),
        successful: state.run.successful,
      }
    : undefined;
  const trace = state.trace;
  const traceRulesProfile = normalizeTraceRulesProfile(state.traceRulesProfile);
  const traceBidsRevealed = trace?.bidsRevealed === true;
  const visibleTrace = trace
    ? {
        traceId: trace.traceId,
        sourceDefinitionId: trace.sourceDefinitionId,
        profile: normalizeTraceRulesProfile(trace.traceRulesProfile),
        phase: trace.status,
        printedTrace: trace.traceLimit,
        effectiveTraceLimit: Math.max(
          0,
          Math.floor(
            side === "corp" || traceBidsRevealed
              ? (trace.effectiveTraceLimit ?? trace.traceLimit)
              : trace.traceLimit - (trace.rabbitTraceLimitReduction ?? 0),
          ),
        ),
        ...(side === "corp" && typeof trace.corpBidMax === "number"
          ? { corpBidMax: trace.corpBidMax }
          : {}),
        bidsRevealed: traceBidsRevealed,
        corpBidCommitted: trace.corpBid !== undefined,
        runnerBidCommitted: trace.runnerBid !== undefined,
        ...(trace.corpBid !== undefined &&
        (side === "corp" || trace.bidsRevealed === true)
          ? {
              corpBid: trace.corpBid,
              corpStrength:
                trace.traceValue ??
                traceCorpBaseStrength(trace) + trace.corpBid,
            }
          : {}),
        ...(typeof trace.runnerLink === "number"
          ? { runnerLink: trace.runnerLink }
          : {}),
        ...(trace.runnerBid !== undefined &&
        (side === "runner" || trace.bidsRevealed === true)
          ? { runnerBid: trace.runnerBid }
          : {}),
        ...(typeof trace.runnerStrength === "number" &&
        trace.bidsRevealed === true
          ? { runnerStrength: trace.runnerStrength }
          : {}),
        ...(typeof trace.postBidLinkBonus === "number" &&
        trace.bidsRevealed === true
          ? { postRevealLinkBonus: trace.postBidLinkBonus }
          : {}),
        ...(typeof trace.successful === "boolean" && trace.bidsRevealed === true
          ? { successful: trace.successful }
          : {}),
      }
    : undefined;

  return {
    side,
    stateVersion: state.stateVersion,
    turnSerial: Math.max(0, Math.floor(state.turnSerial ?? 0)),
    traceRulesProfile,
    timingPoint: state.timingPoint,
    activeSide: state.activeSide,
    phase: state.phase,
    ...(visibleTrace ? { trace: visibleTrace } : {}),
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
          freeNetOrCoreDamagePreventionRemaining:
            visibleFreeNetOrCoreDamagePreventionRemaining(state),
          runnerTraceSupportQuote: visibleRunnerTraceSupportQuote(state),
          availableBadPublicityRunCredits: Math.max(
            0,
            Math.floor(state.corp.badPublicity),
          ),
        }
      : {
          identity: visibleCorpIdentityCard(state),
          credits: state.corp.credits,
          clicks: state.corp.clicks,
          agendaPoints: agendaPoints(state, "corp"),
          gripOrHq: state.corp.hq.map((id) => {
            const visibleCard = visibleOwnCard(state, id);
            const counterBankPreparationQuote =
              visibleCorpCounterBankPreparationQuote(state, id);
            return {
              ...visibleCard,
              ...(counterBankPreparationQuote
                ? { counterBankPreparationQuote }
                : {}),
            };
          }),
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
    ...(corpCentralAccessQuotes
      ? { corpCentralAccessQuotes: [...corpCentralAccessQuotes] }
      : {}),
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
      toPublicEventForSide(event, side),
    ),
    legalActions,
    winner: state.winner,
    agendaPointsToWin: state.agendaPointsToWin,
    ...(state.gameEndReason ? { gameEndReason: state.gameEndReason } : {}),
  };
}
