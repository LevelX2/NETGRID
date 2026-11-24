import { effectiveCardHasNormalizedSubtype } from "../../ability-engine/card-implementation-modifiers";
import {
  type CardInstanceId,
  type CorpServer,
  type GameState,
  type LegalAction,
  type PlayerAction,
} from "@netgrid/shared";
import {
  projectHqInstallRezOptionQuote,
  projectInstalledCorpSequenceRezPayment,
  type CorpSequenceRezPaymentProjection,
} from "../payment";
import {
  corpInstalledCardIds,
  definitionFor,
  mustInstance,
  mustServer,
} from "../state/card-server-lookup";
import { drawCorpCard, rollDeterministicDie } from "../state/draw-random";
import { credits, loseAllCorpCredits, spendClick, spendCredits } from "../state/economy-mutation";
import {
  addCardCounter,
  cardCounter,
  ensureCorpTurnFlags,
  setCardCounter,
} from "../state/turn-flags-counters";
import { cleanupEmptyRemotes, createRemote, removeFromAllZones } from "../state/zone-mutation";
import { buildLegalAction as action } from "../turn/action-builders";
import { corpNewDataFortCreationLocked } from "../turn/corp-data-fort-lock";
import {
  finalizeCorpIceInstallAfterExternalPayment,
  finalizeCorpRootInstallAfterExternalPayment,
} from "../install/install-card";
import { canInstallCorpIceInServer } from "../install/corp-ice-install-restrictions";
import {
  effectDrivenCorpIceRezAgendaPointCost,
  effectDrivenCorpIceRezVariants,
  finalizeCorpRezAfterExternalPayment,
  rezCard as executeRezCard,
} from "../rez/rez-card";
import {
  createDamageImminentEvent,
  openDamageResolutionWindow,
  resolveDamageImminentEvent,
  resolveDamageOperation,
  setDamagePayload,
} from "../damage/damage-core";
import {
  resolveHqArchivesShuffleDraw,
  startScoredAgendaHqShuffleCreditsChoice,
} from "../hidden-zone/corp-zone-choice-handlers";
import {
  resolveAgendaPurgeInstallTargets,
  startHqToNewRemoteInstallRezChoice,
  startScoredAgendaFreeRezChoice,
  type CorpInstallRezSequenceHandlerHost,
} from "../corp/install-rez-sequence-handlers";
import { type ScoredAgendaFlowHost } from "../corp/scored-agenda-flow";
import { type ScoredAgendaAbilityHost } from "../corp/scored-agenda-abilities";
import { type CorpTraceDamageAbilityHost } from "../corp/trace-damage-abilities";
import { type CorpSpecialDamageAbilityHost } from "../corp/special-damage-abilities";
import { resolveCorpRootRezEffect } from "../run/run-rez-window";
import { effectiveAgendaDifficulty } from "../../ability-engine/effective-values";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import {
  executeCardImplementationLifecycleEffects,
  pushActivatedCardImplementationActions,
  pushActivatedCardImplementationActionsForTiming,
  resolveActivatedCardImplementationAbility,
} from "../../ability-engine/card-implementation-runtime";
import type { RuntimeDeps } from "./runtime-shared";

export function createScoredEconomyRuntimeHosts(
  deps: RuntimeDeps,
  runtime: RuntimeDeps = {} as RuntimeDeps,
): Pick<
  import("./action-runtime-port").ActionRuntimePort,
  | "corpInstallRezSequenceHandlerHost"
  | "scoredAgendaFlowHost"
  | "scoredAgendaAbilityHost"
  | "corpTraceDamageAbilityHost"
  | "corpSpecialDamageAbilityHost"
> {
  function corpInstallRezSequenceHandlerHost(
    state: GameState,
    legalAction: LegalAction,
    playerAction?: PlayerAction,
  ): CorpInstallRezSequenceHandlerHost {
    const payAndFinalizeSequenceRez = (
      cardId: CardInstanceId,
      quote: Extract<CorpSequenceRezPaymentProjection, { complete: true }>,
    ) => {
      if (
        quote.regularCreditsAvailable !== state.corp.credits ||
        quote.temporaryCreditsApplied > quote.temporaryCreditsAvailable ||
        quote.regularCreditsRequired !==
          quote.finalCredits - quote.temporaryCreditsApplied ||
        quote.creditPayable !==
          state.corp.credits >= quote.regularCreditsRequired ||
        !quote.creditPayable ||
        !quote.additionalCostsPayable ||
        !quote.affordable
      )
        throw new Error(
          "Die Data-Fort-Reclamation-Rez-Quote ist nicht mehr bezahlbar.",
        );
      const agendaPointCost = quote.mandatoryAdditionalCosts.agendaPoints;
      if (agendaPointCost > 0) {
        const costResult = deps.spendCorpAgendaPointCost(
          state,
          agendaPointCost,
        );
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          agendaPointCost,
          agendaPointCostPaid: costResult.paidPoints,
          ...(costResult.bonusPointsSpent > 0
            ? { corpBonusAgendaPointsSpent: costResult.bonusPointsSpent }
            : {}),
          ...(costResult.spentAgendaDefinitionIds.length > 0
            ? {
                spentAgendaDefinitionIds:
                  costResult.spentAgendaDefinitionIds.join(","),
              }
            : {}),
        };
      }
      if (quote.regularCreditsRequired > 0)
        spendCredits(state, "corp", quote.regularCreditsRequired);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        cardId,
        rezCostPaid: quote.finalCredits,
        temporaryCreditsSpent: quote.temporaryCreditsApplied,
        corpCreditsSpent: quote.regularCreditsRequired,
        ...(quote.reductionSourceDefinitionIds?.length
          ? {
              rezCostReductionSourceDefinitionIds:
                quote.reductionSourceDefinitionIds.join(","),
            }
          : {}),
        ...(quote.increaseSourceDefinitionIds?.length
          ? {
              rezCostIncreaseSourceDefinitionIds:
                quote.increaseSourceDefinitionIds.join(","),
            }
          : {}),
      };
      finalizeCorpRezAfterExternalPayment(
        deps.rezCardHost(state),
        cardId,
        legalAction,
      );
      if (quote.cardType !== "ice")
        resolveCorpRootRezEffect(
          deps.runRezWindowHostForState(state),
          cardId,
          legalAction,
        );
      return {
        temporaryCreditsSpent: quote.temporaryCreditsApplied,
        temporaryCreditsRemaining:
          quote.temporaryCreditsAvailable - quote.temporaryCreditsApplied,
        corpCreditsSpent: quote.regularCreditsRequired,
      };
    };
    const availableEffectDrivenRezVariants = (cardId: CardInstanceId) => {
      const definition = definitionFor(state, cardId);
      const agendaPointCost = effectDrivenCorpIceRezAgendaPointCost(definition);
      if (deps.corpAgendaPointTotal(state) < agendaPointCost) return [];
      return effectDrivenCorpIceRezVariants(definition, state.corp.credits);
    };
    const effectDrivenInstallCredits = (
      cardId: CardInstanceId,
      server: CorpServer,
    ) => {
      const installQuote = deps.corpIceInstallTotalCost(state, cardId, server);
      const increaseCredits = Math.max(
        0,
        installQuote.totalCost -
          installQuote.baseCost -
          installQuote.additionalCost +
          installQuote.reduction,
      );
      return {
        installQuote,
        installCreditsPaid: installQuote.additionalCost + increaseCredits,
      };
    };
    const rezInstalledIceWaivingBaseCost = (
      cardId: CardInstanceId,
      variantId: string,
    ) => {
      const definition = definitionFor(state, cardId);
      const variant = availableEffectDrivenRezVariants(cardId).find(
        (candidate) => candidate.variantId === variantId,
      );
      if (!variant)
        throw new Error(
          "Die effect-driven Rez-Variante ist nicht mehr bezahlbar.",
        );
      const instance = state.cardInstances[cardId];
      if (
        definition.type !== "ice" ||
        !instance ||
        instance.zone.side !== "corp" ||
        instance.zone.zone !== "serverIce" ||
        instance.rezzed
      )
        throw new Error("Das effect-driven Rez-Ziel ist nicht mehr gueltig.");
      const agendaPointCost = effectDrivenCorpIceRezAgendaPointCost(definition);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        ...variant.payload,
        cardId,
        effectDrivenInstallRez: true,
        effectDrivenBaseRezCreditsWaived: true,
        ...(agendaPointCost > 0 ? { agendaPointCost } : {}),
      };
      executeRezCard(deps.rezCardHost(state), cardId, false, legalAction, {
        runContinuation: "none",
        waiveBaseCreditCost: true,
      });
      deps.expireScoredAgendaInstallRezCreditAbilities(state);
      return {
        installCreditsPaid: 0,
        rezAdditionalCreditsPaid: variant.additionalCreditCost,
        rezAgendaPointsPaid: agendaPointCost,
        installed: true,
        rezzed: true,
      };
    };
    const installAndRezIceWaivingBaseCosts = (
      cardId: CardInstanceId,
      server: CorpServer,
      variantId: string,
    ) => {
      const definition = definitionFor(state, cardId);
      if (definition.type !== "ice")
        throw new Error("Der effect-driven Install-/Rez-Pfad braucht ICE.");
      const { installQuote, installCreditsPaid } = effectDrivenInstallCredits(
        cardId,
        server,
      );
      if (state.corp.credits < installCreditsPaid)
        throw new Error(
          "Die zusaetzlichen effect-driven ICE-Installkosten sind nicht bezahlbar.",
        );
      if (installCreditsPaid > 0)
        spendCredits(state, "corp", installCreditsPaid);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        cardId,
        serverId: server.id,
        effectDrivenInstallRez: true,
        effectDrivenBaseInstallCreditsWaived: installQuote.baseCost,
        effectDrivenAdditionalInstallCreditsPaid: installCreditsPaid,
        ...(installQuote.increaseSourceDefinitionIds
          ? {
              iceInstallCostIncreaseSourceDefinitionIds:
                installQuote.increaseSourceDefinitionIds,
            }
          : {}),
      };
      finalizeCorpIceInstallAfterExternalPayment(
        deps.installCardHost(state),
        cardId,
        server,
        legalAction,
      );
      const installedInstance = state.cardInstances[cardId];
      if (
        installedInstance?.zone.side !== "corp" ||
        installedInstance.zone.zone !== "serverIce" ||
        installedInstance.zone.serverId !== server.id
      ) {
        return {
          installCreditsPaid,
          rezAdditionalCreditsPaid: 0,
          rezAgendaPointsPaid: 0,
          installed: false,
          rezzed: false,
        };
      }
      const rezReceipt = rezInstalledIceWaivingBaseCost(cardId, variantId);
      return { ...rezReceipt, installCreditsPaid };
    };
    return {
      state,
      legalAction,
      ...(playerAction ? { playerAction } : {}),
      cards: {
        definitionFor: (cardId) => definitionFor(state, cardId),
        mustInstance: (cardId) => mustInstance(state.cardInstances, cardId),
        scoredAgendaKind: (cardId) =>
          deps.scoredAgendaKindForDefinition(definitionFor(state, cardId)),
        scoredAgendaForCard: (cardId) =>
          deps.scoredAgendaImplementationForDefinition(
            definitionFor(state, cardId),
          ),
        isCorpInstallableCardType: (definition) =>
          deps.isCorpInstallableCardType(definition),
        canInstallCorpRootCardInServer: (definition, server) =>
          deps.canInstallCorpRootCardInServer(state, definition, server),
        isRegionUpgrade: deps.isRegionUpgrade,
        rootInstallRezzesOnInstall: deps.rootInstallRezzesOnInstall,
        isScoredAgendaFreeRezCandidate: (cardId) => {
          const instance = state.cardInstances[cardId];
          return (
            instance?.zone.side === "corp" &&
            instance.zone.zone === "serverIce" &&
            !instance.rezzed
          );
        },
      },
      zones: {
        removeFromAllZones: (cardId) => removeFromAllZones(state, cardId),
        moveCardToArchivesFaceup: (cardId) => {
          state.corp.archives.unshift(cardId);
          state.cardInstances[cardId] = {
            ...mustInstance(state.cardInstances, cardId),
            faceup: true,
            rezzed: true,
            zone: { side: "corp", zone: "archives" },
          };
        },
      },
      servers: {
        createRemote: () => createRemote(state),
        mustServer: (serverId) => mustServer(state, serverId),
        trashOlderRegionUpgradesInServer: (server, keepCardId, legalAction) =>
          deps.trashOlderRegionUpgradesInServer(
            state,
            server,
            keepCardId,
            legalAction,
          ),
      },
      credits: {
        spendCorpCredits: (amount) => spendCredits(state, "corp", amount),
      },
      callbacks: {
        payHqInstallCost: (cardId, server, temporaryCreditsAvailable) => {
          const definition = definitionFor(state, cardId);
          const installCost =
            definition.type === "ice"
              ? deps.corpIceInstallTotalCost(state, cardId, server).totalCost
              : 0;
          const temporaryCreditsSpent = Math.min(
            installCost,
            temporaryCreditsAvailable,
          );
          const corpCreditsSpent = installCost - temporaryCreditsSpent;
          if (state.corp.credits < corpCreditsSpent)
            throw new Error(
              "Die Data-Fort-Reclamation-Installkosten sind nicht bezahlbar.",
            );
          if (corpCreditsSpent > 0)
            spendCredits(state, "corp", corpCreditsSpent);
          return {
            temporaryCreditsSpent,
            temporaryCreditsRemaining:
              temporaryCreditsAvailable - temporaryCreditsSpent,
            corpCreditsSpent,
          };
        },
        recordSuccessfulCorpInstall: () =>
          deps.expireScoredAgendaInstallRezCreditAbilities(state),
        finalizeCorpInstallAfterExternalPayment: (cardId, server) => {
          const definition = definitionFor(state, cardId);
          if (definition.type === "ice") {
            finalizeCorpIceInstallAfterExternalPayment(
              deps.installCardHost(state),
              cardId,
              server,
              legalAction,
            );
            return;
          }
          finalizeCorpRootInstallAfterExternalPayment(
            deps.installCardHost(state),
            cardId,
            server,
            legalAction,
          );
        },
        resolveCorpRootRez: (cardId) => {
          resolveCorpRootRezEffect(
            deps.runRezWindowHostForState(state),
            cardId,
          );
        },
        preflightMandatoryHqInstallRez: (
          selectedCardIds,
          temporaryCreditsAvailable,
        ) => {
          const previewState = structuredClone(state);
          const previewLegalAction = structuredClone(legalAction);
          const previewHost = corpInstallRezSequenceHandlerHost(
            previewState,
            previewLegalAction,
          );
          const previewServer = createRemote(previewState);
          let temporaryCreditsRemaining = temporaryCreditsAvailable;
          for (const cardId of selectedCardIds) {
            const definition = definitionFor(previewState, cardId);
            const installPayment = previewHost.callbacks.payHqInstallCost(
              cardId,
              previewServer,
              temporaryCreditsRemaining,
            );
            temporaryCreditsRemaining =
              installPayment.temporaryCreditsRemaining;
            previewHost.callbacks.finalizeCorpInstallAfterExternalPayment(
              cardId,
              previewServer,
            );
            previewHost.callbacks.recordSuccessfulCorpInstall();
            const previewInstance = previewState.cardInstances[cardId];
            if (
              previewInstance?.zone.side !== "corp" ||
              (previewInstance.zone.zone !== "serverIce" &&
                previewInstance.zone.zone !== "serverRoot")
            )
              continue;
            if (definition.type === "ice") continue;
            if (
              !deps.isRegionUpgrade(definition) &&
              !deps.rootInstallRezzesOnInstall(definition)
            )
              continue;
            const payment =
              previewHost.callbacks.payAndFinalizeMandatoryHqInstallRez(
                cardId,
                temporaryCreditsRemaining,
              );
            temporaryCreditsRemaining = payment.temporaryCreditsRemaining;
            if (deps.isRegionUpgrade(definition))
              deps.trashOlderRegionUpgradesInServer(
                previewState,
                previewServer,
                cardId,
                previewLegalAction,
              );
          }
        },
        projectHqInstallRezOptionQuote: (choice, option) =>
          projectHqInstallRezOptionQuote(state, choice, option),
        projectMandatoryHqInstallContinuationAfterOptionalRez: (
          cardId,
          choiceStateVersion,
        ) => {
          const sequence = state.hqInstallRezSequence;
          if (
            !sequence ||
            sequence.selectedCardIds[sequence.nextCardIndex - 1] !== cardId
          )
            return { complete: false, executable: false };
          const currentQuote = projectInstalledCorpSequenceRezPayment(
            state,
            cardId,
            sequence.temporaryCreditsRemaining,
          );
          if (!currentQuote.complete)
            return { complete: false, executable: false };
          if (!currentQuote.affordable)
            return { complete: true, executable: false };

          const previewState = structuredClone(state);
          const previewLegalAction = structuredClone(legalAction);
          previewState.stateVersion = choiceStateVersion;
          delete previewState.pendingChoice;
          const previewHost = corpInstallRezSequenceHandlerHost(
            previewState,
            previewLegalAction,
          );
          const previewSequence = previewState.hqInstallRezSequence;
          if (!previewSequence) return { complete: false, executable: false };
          const currentPayment =
            previewHost.callbacks.payAndFinalizeMandatoryHqInstallRez(
              cardId,
              previewSequence.temporaryCreditsRemaining,
            );
          let temporaryCreditsRemaining =
            currentPayment.temporaryCreditsRemaining;
          const previewServer = previewState.corp.servers.find(
            (candidate) => candidate.id === previewSequence.serverId,
          );
          if (!previewServer) return { complete: false, executable: false };

          for (
            let index = previewSequence.nextCardIndex;
            index < previewSequence.selectedCardIds.length;
            index += 1
          ) {
            const nextCardId = previewSequence.selectedCardIds[index]!;
            if (!previewState.corp.hq.includes(nextCardId))
              return { complete: false, executable: false };
            const definition = definitionFor(previewState, nextCardId);
            if (!deps.isCorpInstallableCardType(definition))
              return { complete: false, executable: false };
            if (
              definition.type !== "ice" &&
              !deps.canInstallCorpRootCardInServer(
                previewState,
                definition,
                previewServer,
              )
            )
              return { complete: false, executable: false };
            const installCost =
              definition.type === "ice"
                ? deps.corpIceInstallTotalCost(
                    previewState,
                    nextCardId,
                    previewServer,
                  ).totalCost
                : 0;
            const regularInstallCreditsRequired = Math.max(
              0,
              installCost - temporaryCreditsRemaining,
            );
            if (previewState.corp.credits < regularInstallCreditsRequired)
              return { complete: true, executable: false };
            const installPayment = previewHost.callbacks.payHqInstallCost(
              nextCardId,
              previewServer,
              temporaryCreditsRemaining,
            );
            temporaryCreditsRemaining =
              installPayment.temporaryCreditsRemaining;
            previewHost.callbacks.finalizeCorpInstallAfterExternalPayment(
              nextCardId,
              previewServer,
            );
            previewHost.callbacks.recordSuccessfulCorpInstall();
            const installedInstance = previewState.cardInstances[nextCardId];
            if (
              installedInstance?.zone.side !== "corp" ||
              (installedInstance.zone.zone !== "serverIce" &&
                installedInstance.zone.zone !== "serverRoot") ||
              installedInstance.zone.serverId !== previewServer.id
            )
              continue;
            if (
              definition.type === "ice" ||
              (!deps.isRegionUpgrade(definition) &&
                !deps.rootInstallRezzesOnInstall(definition))
            )
              continue;
            const mandatoryRezQuote = projectInstalledCorpSequenceRezPayment(
              previewState,
              nextCardId,
              temporaryCreditsRemaining,
            );
            if (!mandatoryRezQuote.complete)
              return { complete: false, executable: false };
            if (!mandatoryRezQuote.affordable)
              return { complete: true, executable: false };
            const mandatoryRezPayment =
              previewHost.callbacks.payAndFinalizeMandatoryHqInstallRez(
                nextCardId,
                temporaryCreditsRemaining,
              );
            temporaryCreditsRemaining =
              mandatoryRezPayment.temporaryCreditsRemaining;
            if (deps.isRegionUpgrade(definition))
              deps.trashOlderRegionUpgradesInServer(
                previewState,
                previewServer,
                nextCardId,
                previewLegalAction,
              );
          }
          return { complete: true, executable: true };
        },
        payAndFinalizeHqInstallRezOption: (cardId, quote) => {
          if (
            quote.cardId !== cardId ||
            quote.stateVersion !== state.stateVersion
          )
            throw new Error(
              "Die Data-Fort-Reclamation-Rez-Quote ist nicht mehr gebunden.",
            );
          return payAndFinalizeSequenceRez(cardId, quote);
        },
        payAndFinalizeMandatoryHqInstallRez: (
          cardId,
          temporaryCreditsAvailable,
        ) => {
          const quote = projectInstalledCorpSequenceRezPayment(
            state,
            cardId,
            temporaryCreditsAvailable,
          );
          if (!quote.complete || !quote.affordable)
            throw new Error(
              "Die verpflichtende Data-Fort-Reclamation-Rez-Quote ist unvollstaendig oder unbezahlbar.",
            );
          return payAndFinalizeSequenceRez(cardId, quote);
        },
        effectDrivenRezVariants: availableEffectDrivenRezVariants,
        rezInstalledIceWaivingBaseCost,
        installAndRezIceWaivingBaseCosts,
        preflightInstallAndRezIceWaivingBaseCosts: (entries) => {
          const previewState = structuredClone(state);
          const previewAction = structuredClone(legalAction);
          const previewHost = corpInstallRezSequenceHandlerHost(
            previewState,
            previewAction,
          );
          for (const entry of entries) {
            const server =
              entry.serverId === "new_remote"
                ? createRemote(previewState)
                : mustServer(previewState, entry.serverId);
            previewHost.callbacks.installAndRezIceWaivingBaseCosts(
              entry.cardId,
              server,
              entry.variantId,
            );
          }
        },
        canInstallAndRezIceWaivingBaseCosts: (cardId, serverId, variantId) => {
          if (serverId === "new_remote" && corpNewDataFortCreationLocked(state))
            return false;
          const definition = definitionFor(state, cardId);
          const server =
            serverId === "new_remote"
              ? ({
                  id: "r0",
                  label: "Neues Remote",
                  kind: "remote",
                  ice: [],
                  root: [],
                } as CorpServer)
              : state.corp.servers.find(
                  (candidate) => candidate.id === serverId,
                );
          if (
            definition.type !== "ice" ||
            !server ||
            !canInstallCorpIceInServer(definition, server) ||
            (deps.isUniqueCard(definition) &&
              deps.hasInstalledUniqueCardDefinition(
                state,
                "corp",
                definition.id,
              ))
          )
            return false;
          const variant = availableEffectDrivenRezVariants(cardId).find(
            (candidate) => candidate.variantId === variantId,
          );
          if (!variant) return false;
          const { installCreditsPaid } = effectDrivenInstallCredits(
            cardId,
            server,
          );
          return (
            state.corp.credits >=
            installCreditsPaid + variant.additionalCreditCost
          );
        },
      },
    };
  }

  function scoredAgendaFlowHost(
    state: GameState,
    legalAction?: LegalAction,
    playerAction?: PlayerAction,
  ): ScoredAgendaFlowHost {
    return {
      state,
      ...(legalAction ? { legalAction } : {}),
      ...(playerAction ? { playerAction } : {}),
      cards: {
        definitionFor: (cardId) => definitionFor(state, cardId),
        mustInstance: (cardId) => mustInstance(state.cardInstances, cardId),
        scoredAgendaForDefinition: (definition) =>
          deps.scoredAgendaImplementationForDefinition(definition),
        effectiveAgendaDifficulty: (cardId) =>
          effectiveAgendaDifficulty(
            deps.effectiveAgendaDifficultyDeps,
            state,
            cardId,
          ),
        hasSubtype: (definition, subtype) =>
          deps.cardHasSubtype(definition, subtype),
        effectiveHasSubtype: (cardId, subtype) =>
          effectiveCardHasNormalizedSubtype(
            state,
            cardId,
            subtype,
            definitionFor(state, cardId),
          ),
      },
      zones: {
        removeFromAllZones: (cardId) => removeFromAllZones(state, cardId),
        cleanupEmptyRemotes: () => cleanupEmptyRemotes(state),
        corpInstalledCardIds: () => corpInstalledCardIds(state),
        mustServer: (serverId) => mustServer(state, serverId),
      },
      counters: {
        setCardCounter: (cardId, counterType, amount) =>
          setCardCounter(state, cardId, counterType, amount),
        addCardCounter: (cardId, counterType, amount) =>
          addCardCounter(state, cardId, counterType, amount),
        cardCounter: (cardId, counterType) =>
          cardCounter(state, cardId, counterType),
      },
      credits: {
        gainCredits: (side, amount) => credits(state, side, amount),
        loseAllCorpCredits: () => loseAllCorpCredits(state),
      },
      flags: {
        markScoredBlackOpsAgendaThisTurn: () => {
          ensureCorpTurnFlags(state).scoredBlackOpsAgendaThisTurn = true;
        },
        scoredAgendaStartDrawChoiceResolvedSourceIds: () =>
          ensureCorpTurnFlags(state)
            .scoredAgendaStartDrawChoiceResolvedSourceIds ?? [],
        markScoredAgendaStartDrawChoiceResolved: (cardId) => {
          const flags = ensureCorpTurnFlags(state);
          flags.scoredAgendaStartDrawChoiceResolvedSourceIds = [
            ...(flags.scoredAgendaStartDrawChoiceResolvedSourceIds ?? []),
            cardId,
          ];
        },
        markScoredAgendaStartDrawChoiceSelected: (cardId) => {
          const flags = ensureCorpTurnFlags(state);
          flags.scoredAgendaStartDrawChoiceSelectedSourceIds = [
            ...(flags.scoredAgendaStartDrawChoiceSelectedSourceIds ?? []),
            cardId,
          ];
        },
      },
      effects: {
        executeOnScore: (definition, cardId) => {
          if (!legalAction) return;
          executeCardImplementationLifecycleEffects(
            deps.cardImplementationRuntimeDeps,
            state,
            legalAction,
            definition,
            cardId,
            "on_score",
          );
        },
        appendScoredAgendaStartDrawChoiceEffect: (
          cardId,
          sourceDefinitionId,
          drawnCount,
        ) => {
          if (!legalAction) return;
          legalAction.resolvedEffects = [
            ...(legalAction.resolvedEffects ?? []),
            deps.automaticDrawCardsEffect(
              `corp.start.scored_agenda_start_draw.${cardId}`,
              "corp",
              drawnCount,
              sourceDefinitionId,
            ),
          ];
        },
      },
      draw: {
        drawCorpCard: () => drawCorpCard(state),
      },
      choices: {
        startHqToNewRemoteInstallRez: (cardId) => {
          if (!legalAction)
            throw new Error("Data Fort Reclamation braucht eine LegalAction.");
          startHqToNewRemoteInstallRezChoice(
            corpInstallRezSequenceHandlerHost(state, legalAction),
            cardId,
          );
        },
        startScoredAgendaFreeRez: (cardId) => {
          if (!legalAction)
            throw new Error("Priority Requisition braucht eine LegalAction.");
          startScoredAgendaFreeRezChoice(
            corpInstallRezSequenceHandlerHost(state, legalAction),
            cardId,
          );
        },
        startScoredAgendaHqShuffleCredits: (cardId, creditPerAgendaPoint) => {
          if (!legalAction)
            throw new Error("HQ-Agenda-Shuffle braucht eine LegalAction.");
          startScoredAgendaHqShuffleCreditsChoice(
            deps.corpZoneChoiceHandlerHost(state, legalAction),
            { sourceCardId: cardId, creditPerAgendaPoint },
          );
        },
        resolveAgendaPurge: (cardId) => {
          if (!legalAction)
            throw new Error("Security Purge braucht eine LegalAction.");
          resolveAgendaPurgeInstallTargets(
            corpInstallRezSequenceHandlerHost(state, legalAction),
            cardId,
          );
        },
      },
    };
  }

  function scoredAgendaAbilityHost(
    state: GameState,
    legalAction?: LegalAction,
  ): ScoredAgendaAbilityHost {
    return {
      state,
      ...(legalAction ? { legalAction } : {}),
      cards: {
        definitionFor: (cardId) => definitionFor(state, cardId),
        scoredAgendaKindForDefinition: (definition) =>
          deps.scoredAgendaKindForDefinition(definition),
        scoredAgendaForDefinition: (definition) =>
          deps.scoredAgendaImplementationForDefinition(definition),
      },
      actions: {
        spendClick: () => spendClick(state, "corp"),
        createLegalAction: (side, type, label, source, costs, payload) =>
          action(state, side, type, label, source, costs, payload),
      },
      counters: {
        cardCounter: (cardId, counterType) =>
          cardCounter(state, cardId, counterType),
      },
      credits: {
        gainCorpCredits: (amount) => credits(state, "corp", amount),
      },
      damage: {
        dealRunnerMeatDamage: (sourceCardId, amount) => {
          const definition = definitionFor(state, sourceCardId);
          if (!legalAction) throw new Error("Damage-Aktion fehlt.");
          const event = createDamageImminentEvent(state, {
            damageId: `corp.scored_agenda.${definition.id}.meat.${state.stateVersion}`,
            damageType: "meat",
            amount,
            source: `scored_agenda:${definition.id}`,
            randomSource: ["c", definition.id, sourceCardId],
          });
          if (openDamageResolutionWindow(state, event, legalAction)) {
            return {
              damageAmount: amount,
              cardsTrashed: 0,
              flatline: false,
            };
          }
          const summary = resolveDamageImminentEvent(state, event);
          setDamagePayload(legalAction, summary);
          return {
            damageAmount: summary.amount,
            cardsTrashed: summary.cardsTrashed,
            flatline: summary.flatline,
          };
        },
      },
      callbacks: {
        pushActivatedCardImplementationActions: (actions, cardId, definition) =>
          pushActivatedCardImplementationActions(
            deps.cardImplementationRuntimeDeps,
            state,
            actions,
            "corp",
            cardId,
            definition,
          ),
        pushActivatedCardImplementationRunActions: (
          actions,
          cardId,
          definition,
        ) =>
          pushActivatedCardImplementationActionsForTiming(
            deps.cardImplementationRuntimeDeps,
            state,
            actions,
            "corp",
            cardId,
            definition,
            "corp_during_run",
          ),
        resolveActivatedCardImplementationAbility: () => {
          if (!legalAction) return false;
          return resolveActivatedCardImplementationAbility(
            deps.cardImplementationRuntimeDeps,
            state,
            legalAction,
          );
        },
        resolveHqArchivesShuffleDraw: (sourceCardId) => {
          if (!legalAction)
            throw new Error(
              "HQ/Archives-Shuffle-Draw braucht eine LegalAction.",
            );
          resolveHqArchivesShuffleDraw(
            deps.corpZoneChoiceHandlerHost(state, legalAction),
            sourceCardId,
          );
        },
      },
    };
  }

  function corpTraceDamageAbilityHost(
    state: GameState,
    legalAction?: LegalAction,
  ): CorpTraceDamageAbilityHost {
    return {
      state,
      ...(legalAction ? { legalAction } : {}),
      cards: {
        definitionFor: (cardId) => definitionFor(state, cardId),
        implementationForDefinition: (definition) =>
          cardImplementationForDefinitionId(definition.id),
      },
      callbacks: {
        pushActivatedCardImplementationActions: (actions, cardId, definition) =>
          pushActivatedCardImplementationActions(
            deps.cardImplementationRuntimeDeps,
            state,
            actions,
            "corp",
            cardId,
            definition,
          ),
        resolveActivatedCardImplementationAbility: () => {
          if (!legalAction) return false;
          return resolveActivatedCardImplementationAbility(
            deps.cardImplementationRuntimeDeps,
            state,
            legalAction,
          );
        },
      },
    };
  }

  function corpSpecialDamageAbilityHost(
    state: GameState,
    legalAction?: LegalAction,
  ): CorpSpecialDamageAbilityHost {
    return {
      state,
      ...(legalAction ? { legalAction } : {}),
      cards: {
        definitionFor: (cardId) => definitionFor(state, cardId),
        uniqueDirectLongtailImplementationForCard: (cardId) =>
          deps.uniqueDirectLongtailImplementationForCard(state, cardId),
        uniqueDirectLongtailImplementationForDefinition: (definitionId) =>
          deps.uniqueDirectLongtailImplementationForDefinition(definitionId),
        rezzedCorpRootCardIds: () => deps.rezzedCorpRootCardIds(state),
      },
      actions: {
        buildLegalAction: (side, type, label, source, costs, payload) =>
          action(state, side, type, label, source, costs, payload),
      },
      agendaPoints: {
        total: () => deps.corpAgendaPointTotal(state),
        scoredForfeitTargets: () => deps.corpScoredAgendaForfeitTargets(state),
        pointsForScoredCard: (cardId) =>
          deps.agendaPointsForScoredCard(state, cardId),
        forfeitCorpAgendaForPointCost: (cardId) =>
          deps.forfeitCorpAgendaForPointCost(state, cardId),
        spendPointCost: (requiredPoints) =>
          deps.spendCorpAgendaPointCost(state, requiredPoints),
      },
      damage: {
        resolveDamageOperation: (damageType, amount, sourceDefinitionId) => {
          if (!legalAction) throw new Error("Damage-Aktion fehlt.");
          resolveDamageOperation(
            state,
            legalAction,
            damageType,
            amount,
            sourceDefinitionId,
          );
        },
      },
      rng: {
        rollDie: (purpose) => rollDeterministicDie(state, purpose),
        randomCounter: () => state.randomCounter,
      },
      trash: {
        trashCorpInstalledCardToArchives: (cardId) =>
          deps.trashCorpInstalledCardToArchives(state, cardId),
      },
    };
  }

  return {
    corpInstallRezSequenceHandlerHost,
    scoredAgendaFlowHost,
    scoredAgendaAbilityHost,
    corpTraceDamageAbilityHost,
    corpSpecialDamageAbilityHost,
  };
}
