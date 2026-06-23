import type { GameState } from "@netgrid/shared";
import {
  createAccessFlowAdapters,
  type AccessFlowAdapters,
  type AccessFlowCompositionHost,
} from "../access/access-flow-hosts";
import { buildRunnerDuringRunCardImplementationActions } from "./card-implementation-run-actions";
import { buildMysteryBoxRunActions } from "./encounter-actions";
import {
  createRunFlowAdapters,
  type RunFlowAdapters,
  type RunFlowHost,
} from "./run-flow-hosts";
import {
  buildSuccessfulRunFollowupActions,
  type SuccessfulRunInterventionHost,
} from "./successful-run-interventions";

type StateHostFn<T> = (state: GameState) => T;

export type RunAccessLegalActionHostCompositionHost = {
  cards: Omit<
    RunFlowHost["cards"],
    "cardImplementationAccessHookKindsForDefinition"
  >;
  servers: RunFlowHost["servers"];
  run: Omit<
    RunFlowHost["run"],
    "runnerDuringRunCardImplementationLegalActions"
  > & {
    finishRun: RunFlowHost["callbacks"]["finishRun"];
    successfulRunInterventionHost: StateHostFn<SuccessfulRunInterventionHost>;
    startExpertScheduleAnalyzerPostAccessChoice: AccessFlowCompositionHost["run"]["startExpertScheduleAnalyzerPostAccessChoice"];
  };
  access: Pick<
    RunFlowHost["access"],
    | "hasHiddenResourceAccessStartActions"
    | "advanceArchivesBreachPastNonDecisionCards"
    | "startRunnerPrivateLookChoice"
  >;
  payment: RunFlowHost["payment"] &
    Pick<
      AccessFlowCompositionHost["payment"],
      | "hostedPaymentCredits"
      | "restrictedHostedCreditSourceIds"
      | "isRestrictedHostedCreditSource"
      | "spendRunnerAccessTrashCredits"
    >;
  choices: RunFlowHost["choices"] & AccessFlowCompositionHost["choices"];
  cardImplementation: {
    accessEffectsForDefinition: AccessFlowCompositionHost["cards"]["accessEffectsForDefinition"];
    hiddenReplacementLongtailKindForDefinition: AccessFlowCompositionHost["cards"]["hiddenReplacementLongtailKindForDefinition"];
    accessHookKindsForDefinition: RunFlowHost["cards"]["cardImplementationAccessHookKindsForDefinition"];
    runCardImplementationActionHost: Parameters<
      typeof buildRunnerDuringRunCardImplementationActions
    >[0] extends infer Host
      ? StateHostFn<Host>
      : never;
  };
  constants: AccessFlowCompositionHost["constants"];
  callbacks: {
    rules: RunFlowHost["rules"];
    turn: RunFlowHost["turn"] & AccessFlowCompositionHost["turn"];
    trace: RunFlowHost["trace"] & AccessFlowCompositionHost["trace"];
    damage: RunFlowHost["damage"] & AccessFlowCompositionHost["damage"];
    tags: AccessFlowCompositionHost["tags"];
    counters: RunFlowHost["counters"] & AccessFlowCompositionHost["counters"];
    ice: RunFlowHost["ice"];
    zones: RunFlowHost["zones"] & AccessFlowCompositionHost["zones"];
    effects: RunFlowHost["effects"];
    rng: RunFlowHost["rng"] & AccessFlowCompositionHost["random"];
    misc: Omit<RunFlowHost["callbacks"], "finishRun"> &
      AccessFlowCompositionHost["callbacks"];
  };
};

export type RunAccessLegalActionHostComposition = {
  runFlow: RunFlowAdapters;
  accessFlow: AccessFlowAdapters;
};

export function createRunAccessLegalActionHostComposition(
  host: RunAccessLegalActionHostCompositionHost,
): RunAccessLegalActionHostComposition {
  const cards = requiredGroup(host.cards, "cards");
  const servers = requiredGroup(host.servers, "servers");
  const run = requiredGroup(host.run, "run");
  const access = requiredGroup(host.access, "access");
  const payment = requiredGroup(host.payment, "payment");
  const choices = requiredGroup(host.choices, "choices");
  const cardImplementation = requiredGroup(
    host.cardImplementation,
    "cardImplementation",
  );
  const constants = requiredGroup(host.constants, "constants");
  const callbacks = requiredGroup(host.callbacks, "callbacks");

  let accessFlow: AccessFlowAdapters;
  const runFlow = createRunFlowAdapters({
    cards: {
      ...cards,
      cardImplementationAccessHookKindsForDefinition:
        cardImplementation.accessHookKindsForDefinition,
    },
    servers,
    rules: callbacks.rules,
    turn: callbacks.turn,
    access: {
      breachStateHost: (state) => accessFlow.breachStateHost(state),
      accessFlowHost: (state) => accessFlow.accessFlowHost(state),
      hasHiddenResourceAccessStartActions:
        access.hasHiddenResourceAccessStartActions,
      advanceArchivesBreachPastNonDecisionCards:
        access.advanceArchivesBreachPastNonDecisionCards,
      startRunnerPrivateLookChoice: access.startRunnerPrivateLookChoice,
      startExpertScheduleAnalyzerPostAccessChoice:
        run.startExpertScheduleAnalyzerPostAccessChoice,
    },
    run: {
      currentRun: run.currentRun,
      currentEncounterSubroutines: run.currentEncounterSubroutines,
      runRemainderStrengthBonusForBreaker:
        run.runRemainderStrengthBonusForBreaker,
      runnerDuringRunCardImplementationLegalActions: (state) =>
        buildRunnerDuringRunCardImplementationActions(
          cardImplementation.runCardImplementationActionHost(state),
        ).legalActions,
      executeCardImplementationRunnerRunStartEffects:
        run.executeCardImplementationRunnerRunStartEffects,
      applyRunnerTraceCounterRunStartEffects:
        run.applyRunnerTraceCounterRunStartEffects,
      applyRunStartRandomStrengthBonus: run.applyRunStartRandomStrengthBonus,
      openStartOfRunFortUtilityWindow: run.openStartOfRunFortUtilityWindow,
    },
    trace: callbacks.trace,
    damage: callbacks.damage,
    payment: {
      spendCredits: payment.spendCredits,
      credits: payment.credits,
      rezCostForCard: payment.rezCostForCard,
      creditCostForAction: payment.creditCostForAction,
      spendCorpRunTemporaryCreditsForCurrentRunCost:
        payment.spendCorpRunTemporaryCreditsForCurrentRunCost,
    },
    counters: callbacks.counters,
    ice: callbacks.ice,
    zones: callbacks.zones,
    choices,
    effects: callbacks.effects,
    rng: callbacks.rng,
    callbacks: {
      finishRun: run.finishRun,
      ...callbacks.misc,
    },
  });

  accessFlow = createAccessFlowAdapters({
    cards: {
      definitionFor: cards.definitionFor,
      cardInstanceFor: cards.cardInstanceFor,
      cardHasSubtype: cards.cardHasSubtype,
      accessEffectsForDefinition:
        cardImplementation.accessEffectsForDefinition,
      hiddenReplacementLongtailKindForDefinition:
        cardImplementation.hiddenReplacementLongtailKindForDefinition,
    },
    servers: {
      mustServer: servers.mustServer,
      randomHqAccess: servers.randomHqAccess,
    },
    run: {
      finishRun: run.finishRun,
      successfulRunProgramActions: (state, activeRun) =>
        buildSuccessfulRunFollowupActions(
          run.successfulRunInterventionHost(state),
          activeRun,
        ),
      runnerDuringRunCardImplementationLegalActions: (state) =>
        buildRunnerDuringRunCardImplementationActions(
          cardImplementation.runCardImplementationActionHost(state),
        ).legalActions,
      mysteryBoxRunActions: (state, activeRun) =>
        buildMysteryBoxRunActions(
          runFlow.runnerEncounterActionHostForState(state),
          activeRun,
        ),
      startExpertScheduleAnalyzerPostAccessChoice:
        run.startExpertScheduleAnalyzerPostAccessChoice,
    },
    damage: {
      resolveDamageOperation: callbacks.damage.resolveDamageOperation,
      doDamage: callbacks.damage.doDamage,
      setDamagePayload: callbacks.damage.setDamagePayload,
    },
    tags: callbacks.tags,
    trace: {
      startTraceFromOperation: callbacks.trace.startTraceFromOperation,
      traceSuccessEffectForCardImplementation:
        callbacks.trace.traceSuccessEffectForCardImplementation,
    },
    payment: {
      spendCredits: payment.spendCredits,
      hostedPaymentCredits: payment.hostedPaymentCredits,
      restrictedHostedCreditSourceIds: payment.restrictedHostedCreditSourceIds,
      isRestrictedHostedCreditSource: payment.isRestrictedHostedCreditSource,
      spendRunnerAccessTrashCredits: payment.spendRunnerAccessTrashCredits,
    },
    counters: {
      cardCounter: callbacks.counters.cardCounter,
      addCardCounter: callbacks.counters.addCardCounter,
      addCounterToAllInstalledRunnerIcebreakers:
        callbacks.counters.addCounterToAllInstalledRunnerIcebreakers,
    },
    zones: {
      removeFromAllZones: callbacks.zones.removeFromAllZones,
      ensureSpecialZones: callbacks.zones.ensureSpecialZones,
      trashCorpInstalledCardToArchives:
        callbacks.zones.trashCorpInstalledCardToArchives,
      trashRunnerInstalledCardToHeap:
        callbacks.zones.trashRunnerInstalledCardToHeap,
      shuffleCorpCardIntoRd: callbacks.zones.shuffleCorpCardIntoRd,
      returnRunnerInstalledProgramsToGripForAccess:
        callbacks.zones.returnRunnerInstalledProgramsToGripForAccess,
    },
    choices: {
      openRunnerInstalledTrashPreventionWindow:
        choices.openRunnerInstalledTrashPreventionWindow,
    },
    turn: {
      ensureRunnerTurnFlags: callbacks.turn.ensureRunnerTurnFlags,
    },
    random: {
      nextRandom: callbacks.rng.nextRandom,
    },
    callbacks: callbacks.misc,
    constants,
  });

  return { runFlow, accessFlow };
}

function requiredGroup<T>(value: T | undefined, name: string): T {
  if (!value)
    throw new Error(
      `RunAccessLegalActionHostCompositionHost.${name} ist erforderlich.`,
    );
  return value;
}
