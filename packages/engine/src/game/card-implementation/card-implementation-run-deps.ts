import type { CardInstanceId, ServerId } from "@netgrid/shared";
import type { CardEffectMakeRunOptions } from "../../ability-engine/effect-execution-types";
import type {
  GameCardImplementationRuntimeDepsHost,
  RuntimeLegalAction,
  RuntimePublicPayload,
  RuntimeState,
} from "./card-implementation-runtime-deps-types";

export function startRunForCardImplementation(
  host: GameCardImplementationRuntimeDepsHost,
  state: RuntimeState,
  legalAction: RuntimeLegalAction,
  serverId: Exclude<ServerId, "new_remote">,
  options: CardEffectMakeRunOptions,
): { publicPayload: RuntimePublicPayload } {
  const sourceCardId =
    typeof legalAction.source === "string" &&
    state.cardInstances[legalAction.source]
      ? legalAction.source
      : typeof legalAction.payload?.cardId === "string" &&
          state.cardInstances[legalAction.payload.cardId]
        ? legalAction.payload.cardId
        : undefined;
  const sourceDefinitionId = sourceCardId
    ? host.cards.definitionFor(state, sourceCardId).id
    : undefined;
  const ordinarySuccessBonusCredits =
    options.successfulRunAccessReplacement === undefined
      ? options.successfulRunRunnerCreditGain
      : undefined;
  const forwardedOptions =
    ordinarySuccessBonusCredits === undefined
      ? options
      : omitOrdinarySuccessBonus(options);
  host.run.startRun(
    state,
    serverId,
    forwardedOptions.accessCount ?? 1,
    {
      ...(forwardedOptions.freeTrashAccessZones
        ? {
            freeTrashAccessZones: forwardedOptions.freeTrashAccessZones.slice(),
          }
        : {}),
      ...(options.accessServerOverride
        ? { accessServerOverride: options.accessServerOverride }
        : {}),
      ...(options.successfulRunAccessReplacement
        ? {
            successfulRunAccessReplacement:
              options.successfulRunAccessReplacement,
          }
        : {}),
      ...(options.conditionalAccessBonus !== undefined
        ? {
            conditionalAccessBonus: {
              ...options.conditionalAccessBonus,
              sourceDefinitionId: sourceDefinitionId ?? "card_implementation",
            },
          }
        : {}),
      ...(options.corpRezCostSurcharge !== undefined
        ? {
            corpRezCostSurcharge: {
              ...options.corpRezCostSurcharge,
              sourceDefinitionId: sourceDefinitionId ?? "card_implementation",
            },
          }
        : {}),
      ...(options.successfulRunCreditLoss !== undefined
        ? { successfulRunCreditLoss: options.successfulRunCreditLoss }
        : {}),
      ...(options.successfulRunRunnerTagGain !== undefined
        ? { successfulRunRunnerTagGain: options.successfulRunRunnerTagGain }
        : {}),
      ...(forwardedOptions.successfulRunRunnerCreditGain !== undefined
        ? {
            successfulRunRunnerCreditGain:
              forwardedOptions.successfulRunRunnerCreditGain,
          }
        : {}),
      ...(options.successfulRunRequiresCorpCredits !== undefined
        ? {
            successfulRunRequiresCorpCredits:
              options.successfulRunRequiresCorpCredits,
          }
        : {}),
      ...(options.successfulRunPrivateLookCount !== undefined
        ? {
            successfulRunPrivateLookCount:
              options.successfulRunPrivateLookCount,
          }
        : {}),
      ...(options.successfulRunArchivesMoveCount !== undefined
        ? {
            successfulRunArchivesMoveCount:
              options.successfulRunArchivesMoveCount,
          }
        : {}),
      ...(options.followupRunOnEnd === "optional"
        ? { grantBonusRunOnFinish: true }
        : {}),
      ...(options.bypassFirstIce ? { bypassFirstIceRemaining: true } : {}),
      ...(options.runTraceLinkBonus !== undefined
        ? { runTraceLinkBonus: options.runTraceLinkBonus }
        : {}),
      ...(options.afterRunCompletedUnpreventableCoreDamage !== undefined
        ? {
            unpreventableCoreDamageAtRunEnd: {
              sourceDefinitionId: sourceDefinitionId ?? "card_implementation",
              amount: options.afterRunCompletedUnpreventableCoreDamage,
            },
          }
        : {}),
      ...(options.prohibitNoisyIcebreakers
        ? { prohibitNoisyIcebreakers: true }
        : {}),
      ...(options.eventApproachIceExposeBeforeRez
        ? { eventApproachIceExposeBeforeRez: true }
        : {}),
      ...(options.runnerCreditGainOnCorpRez !== undefined
        ? { runnerCreditGainOnCorpRez: options.runnerCreditGainOnCorpRez }
        : {}),
      ...(options.damagePreventionPool !== undefined
        ? {
            damagePreventionPool: {
              sourceDefinitionId: sourceDefinitionId ?? "card_implementation",
              remaining: options.damagePreventionPool,
            },
          }
        : {}),
      ...(options.badPublicityRunAftermath !== undefined
        ? {
            badPublicityRunAftermath: {
              kind: options.badPublicityRunAftermath,
              sourceCardId:
                sourceCardId ?? ("card_implementation" as CardInstanceId),
              sourceDefinitionId: sourceDefinitionId ?? "card_implementation",
              sourceTitle:
                sourceCardId && sourceDefinitionId
                  ? host.cards.definitionFor(state, sourceCardId).title
                  : "Card Implementation",
            },
          }
        : {}),
      ...(options.activeSequence
        ? { activeSequence: options.activeSequence }
        : {}),
      ...(options.runTraceLinkBonus !== undefined && sourceDefinitionId
        ? {
            runTraceLinkBonusSourceDefinitionId: sourceDefinitionId,
          }
        : {}),
      ...(sourceCardId && sourceDefinitionId
        ? {
            successfulRunSourceCardId: sourceCardId,
            successfulRunSourceDefinitionId: sourceDefinitionId,
            successfulRunSourceTitle: host.cards.definitionFor(
              state,
              sourceCardId,
            ).title,
          }
        : {}),
    },
    ordinarySuccessBonusCredits,
    legalAction,
  );
  const temporaryCreditGain = options.runTemporaryCredits
    ? (() => {
        if (!sourceCardId || !sourceDefinitionId)
          throw new Error("Temporäre Run-Credits benötigen ihre Kartenquelle.");
        return host.credits.gainCredits(state, {
          side: "runner",
          amount: options.runTemporaryCredits.amount,
          sourceCardId,
          sourceDefinitionId,
          gainOrdinal: 1,
          kind: "standard",
          reason: "make_run_temporary_credits",
          destination: {
            kind: "runner_run_temporary",
            sourceDefinitionId,
            returnUnusedAtRunEnd: options.runTemporaryCredits.returnUnusedAtRunEnd,
          },
        });
      })()
    : undefined;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ...(options.followupRunOnEnd === "optional"
      ? { bonusRunOnFinish: true }
      : {}),
    ...(options.bypassFirstIce ? { bypassFirstIce: true } : {}),
    ...(options.runTraceLinkBonus !== undefined
      ? {
          runTraceLinkBonus: options.runTraceLinkBonus,
          ...(typeof legalAction.source === "string" &&
          sourceCardId &&
          sourceDefinitionId
            ? {
                runTraceLinkBonusSourceDefinitionId: sourceDefinitionId,
              }
            : {}),
        }
      : {}),
    ...(options.corpRezCostSurcharge !== undefined
      ? {
          corpRezCostSurchargeKind: options.corpRezCostSurcharge.kind,
          ...(sourceDefinitionId
            ? { corpRezCostSurchargeSourceDefinitionId: sourceDefinitionId }
            : {}),
        }
      : {}),
    ...(options.runTemporaryCredits !== undefined
      ? {
          v1922RunnerEventAbility: "run_temporary_credits",
          temporaryRunCredits: temporaryCreditGain?.creditedAmount ?? 0,
          temporaryRunCreditsRemaining:
            state.run?.runnerRunTemporaryCredits?.remaining ?? 0,
          ...(temporaryCreditGain?.publicPayload ?? {}),
        }
      : {}),
    ...(options.afterRunCompletedUnpreventableCoreDamage !== undefined
      ? {
          afterRunUnpreventableCoreDamage:
            options.afterRunCompletedUnpreventableCoreDamage,
        }
      : {}),
    ...(options.prohibitNoisyIcebreakers
      ? { prohibitNoisyIcebreakers: true }
      : {}),
    ...(options.eventApproachIceExposeBeforeRez
      ? { eventApproachIceExposeBeforeRez: true }
      : {}),
    ...(options.runnerCreditGainOnCorpRez !== undefined
      ? { runnerCreditGainOnCorpRez: options.runnerCreditGainOnCorpRez }
      : {}),
    ...(options.damagePreventionPool !== undefined
      ? { damagePreventionPool: options.damagePreventionPool }
      : {}),
    ...(options.activeSequence
      ? {
          multiServerSuccessSequenceActive: true,
          multiServerSuccessSequencePendingServerCount:
            options.activeSequence.pendingServerIds.length,
        }
      : {}),
  };
  return { publicPayload: legalAction.payload ?? {} };
}

function omitOrdinarySuccessBonus(
  options: CardEffectMakeRunOptions,
): CardEffectMakeRunOptions {
  const {
    successfulRunRunnerCreditGain: _ordinarySuccessBonus,
    ...forwardedOptions
  } = options;
  void _ordinarySuccessBonus;
  return forwardedOptions;
}
