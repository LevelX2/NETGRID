import type {
  CardInstanceId,
  CounterType,
  GameState,
  LegalAction,
  ServerId,
} from "@netgrid/shared";
import {
  publicContextForAction,
  type PublicContextForActionDependencies,
} from "../../public-context";
import type { BreachStateHost } from "../access/breach-state";
import { definitionFor, mustInstance } from "../state/card-server-lookup";
import { configureBuildEventHost, type BuildEventHost } from "./build-event";

export type EventContextHostCompositionHost = {
  cards: {
    agendaPointsForScoredCard: (
      state: GameState,
      cardId: CardInstanceId,
    ) => number;
    cardCounter: (
      state: GameState,
      cardId: CardInstanceId,
      counterType: CounterType,
    ) => number;
    hostedProgramStrengthModifier: (
      state: GameState,
      cardId: CardInstanceId,
    ) => number;
  };
  publicContext: {
    creditCostForAction: (legalAction: LegalAction) => number;
    pumpAmountForLegalAction: (
      state: GameState,
      legalAction: LegalAction,
    ) => number;
  };
  callbacks: {
    breachStateHost: (state: GameState) => BreachStateHost;
    installedAccessBonusForServer: (
      host: BreachStateHost,
      serverId: Exclude<ServerId, "new_remote">,
    ) => number;
    runnerHqAccessBonusForBreach: (host: BreachStateHost) => number;
  };
  constants: {
    badPublicityLossThreshold: number;
  };
};

export type EventContextHostComposition = {
  publicContextDeps: PublicContextForActionDependencies;
  buildEventHost: BuildEventHost;
};

export function createEventContextHostComposition(
  host: EventContextHostCompositionHost,
): EventContextHostComposition {
  const cards = requiredGroup(host.cards, "cards");
  const context = requiredGroup(host.publicContext, "publicContext");
  const callbacks = requiredGroup(host.callbacks, "callbacks");
  const constants = requiredGroup(host.constants, "constants");
  const publicContextDeps: PublicContextForActionDependencies = {
    agendaPointsForScoredCard: cards.agendaPointsForScoredCard,
    cardCounter: cards.cardCounter,
    cardStrengthModifier: (state, cardId) =>
      mustInstance(state.cardInstances, cardId).strengthModifier +
      cards.hostedProgramStrengthModifier(state, cardId) -
      cards.cardCounter(state, cardId, "pattel_antibody"),
    creditCostForAction: context.creditCostForAction,
    definitionFor,
    pumpAmountForLegalAction: context.pumpAmountForLegalAction,
    runnerHqAccessBonus: (state) =>
      callbacks.runnerHqAccessBonusForBreach(callbacks.breachStateHost(state)),
    v1915InstalledAccessBonus: (state, serverId) =>
      callbacks.installedAccessBonusForServer(
        callbacks.breachStateHost(state),
        serverId,
      ),
  };
  return {
    publicContextDeps,
    buildEventHost: {
      publicContext: {
        publicContextForAction,
        deps: publicContextDeps,
      },
      constants: {
        badPublicityLossThreshold: constants.badPublicityLossThreshold,
      },
    },
  };
}

export function configureEventContextHostComposition(
  host: EventContextHostCompositionHost,
): EventContextHostComposition {
  const composition = createEventContextHostComposition(host);
  configureBuildEventHost(composition.buildEventHost);
  return composition;
}

function requiredGroup<T>(value: T | undefined, name: string): T {
  if (!value)
    throw new Error(`EventContextHostCompositionHost.${name} ist erforderlich.`);
  return value;
}
