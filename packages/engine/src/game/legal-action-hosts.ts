import type { ChoiceRequest, GameState, LegalAction } from "@netgrid/shared";
import {
  configureLegalActionGenerationHost,
  type LegalActionGenerationHost,
} from "./legal-actions";
import { buildLegalAction } from "./turn/action-builders";

type StateHostFn<T> = (state: GameState) => T;

export type LegalActionHostCompositionHost = {
  actions: {
    buildChoiceAction: (state: GameState, choice: ChoiceRequest) => LegalAction;
    corpRunnerActionPaidWindowActions: StateHostFn<LegalAction[]>;
  };
  counters: {
    corpActionDebtPending: StateHostFn<number>;
    purgeableRunnerVirusCounterTotal: StateHostFn<number>;
  };
  hosts: {
    corpMainActionGenerationHost: StateHostFn<
      ReturnType<LegalActionGenerationHost["hosts"]["corpMainActionGenerationHost"]>
    >;
    runnerMainActionGenerationHost: StateHostFn<
      ReturnType<LegalActionGenerationHost["hosts"]["runnerMainActionGenerationHost"]>
    >;
    runnerEncounterActionHost: StateHostFn<
      ReturnType<LegalActionGenerationHost["hosts"]["runnerEncounterActionHost"]>
    >;
    encounterEntryHost: StateHostFn<
      ReturnType<LegalActionGenerationHost["hosts"]["encounterEntryHost"]>
    >;
    runRezWindowHost: StateHostFn<
      ReturnType<LegalActionGenerationHost["hosts"]["runRezWindowHost"]>
    >;
    runMovementHost: StateHostFn<
      ReturnType<LegalActionGenerationHost["hosts"]["runMovementHost"]>
    >;
    runCardImplementationActionHost: StateHostFn<
      ReturnType<LegalActionGenerationHost["hosts"]["runCardImplementationActionHost"]>
    >;
    runnerAccessActionHost: StateHostFn<
      ReturnType<LegalActionGenerationHost["hosts"]["runnerAccessActionHost"]>
    >;
  };
};

export type LegalActionHostComposition = {
  legalActionGenerationHost: StateHostFn<LegalActionGenerationHost>;
  buildPurgeableRunnerVirusPurgeAction: StateHostFn<LegalAction>;
  buildCorpForgoActionDebtAction: StateHostFn<LegalAction>;
};

export function createLegalActionHostComposition(
  host: LegalActionHostCompositionHost,
): LegalActionHostComposition {
  const actions = requiredGroup(host.actions, "actions");
  const counters = requiredGroup(host.counters, "counters");
  const hosts = requiredGroup(host.hosts, "hosts");

  const buildPurgeableRunnerVirusPurgeAction = (state: GameState) => {
    const window = state.runnerVirusPurgeWindow;
    return buildLegalAction(
      state,
      "corp",
      "purge_runner_virus_counters",
      "Runner-Virus-Counter purgen (3 Aktionen aussetzen)",
      "game_rule",
      [],
      {
        purgeModel: "future_action_debt",
        actionDebtAdded: 3,
        ...(window
          ? {
              timingWindowId: window.windowId,
              timingFamily: window.timingFamily,
            }
          : {
              timingFamily: "corp_main_action",
            }),
      },
      { targetRequirements: [] },
    );
  };

  const buildCorpForgoActionDebtAction = (state: GameState) =>
    buildLegalAction(
      state,
      "corp",
      "forgo_action",
      "Aktionsschuld abtragen",
      "game_rule",
      [{ clicks: 1 }],
      {
        actionDebtPaid: 1,
        corpActionDebtTotalBefore: counters.corpActionDebtPending(state),
      },
      { targetRequirements: [] },
    );

  return {
    buildPurgeableRunnerVirusPurgeAction,
    buildCorpForgoActionDebtAction,
    legalActionGenerationHost: (state) => ({
      state,
      actions: {
        buildMandatoryDrawAction: () =>
          buildLegalAction(
            state,
            "corp",
            "mandatory_draw",
            "Korp Pflichtkarte ziehen",
            "game_rule",
          ),
        buildChoiceAction: (choice) => actions.buildChoiceAction(state, choice),
        buildPurgeableRunnerVirusPurgeAction: () =>
          buildPurgeableRunnerVirusPurgeAction(state),
        corpRunnerActionPaidWindowActions: () =>
          actions.corpRunnerActionPaidWindowActions(state),
      },
      counters: {
        purgeableRunnerVirusCounterTotal: () =>
          counters.purgeableRunnerVirusCounterTotal(state),
      },
      hosts: {
        corpMainActionGenerationHost: () =>
          hosts.corpMainActionGenerationHost(state),
        runnerMainActionGenerationHost: () =>
          hosts.runnerMainActionGenerationHost(state),
        runnerEncounterActionHost: () => hosts.runnerEncounterActionHost(state),
        encounterEntryHost: () => hosts.encounterEntryHost(state),
        runRezWindowHost: () => hosts.runRezWindowHost(state),
        runMovementHost: () => hosts.runMovementHost(state),
        runCardImplementationActionHost: () =>
          hosts.runCardImplementationActionHost(state),
        runnerAccessActionHost: () => hosts.runnerAccessActionHost(state),
      },
    }),
  };
}

export function configureLegalActionHostComposition(
  host: LegalActionHostCompositionHost,
): LegalActionHostComposition {
  const composition = createLegalActionHostComposition(host);
  configureLegalActionGenerationHost(composition.legalActionGenerationHost);
  return composition;
}

function requiredGroup<T>(value: T | undefined, name: string): T {
  if (!value)
    throw new Error(`LegalActionHostCompositionHost.${name} ist erforderlich.`);
  return value;
}
