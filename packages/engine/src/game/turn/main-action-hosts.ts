import type { GameState } from "@netgrid/shared";
import type { CorpMainActionGenerationHost } from "./corp-main-actions";
import type { RunnerMainActionGenerationHost } from "./runner-main-actions";

type StateHostFn<T> = (state: GameState) => T;

export type MainActionHostCompositionHost = {
  actions: CorpMainActionGenerationHost["actions"] &
    RunnerMainActionGenerationHost["actions"];
  cards: CorpMainActionGenerationHost["cards"] &
    RunnerMainActionGenerationHost["cards"];
  scored: CorpMainActionGenerationHost["agenda"];
  counters: CorpMainActionGenerationHost["counters"] &
    RunnerMainActionGenerationHost["counters"];
  corp: CorpMainActionGenerationHost["corp"];
  runner: CorpMainActionGenerationHost["runner"] &
    RunnerMainActionGenerationHost["runner"];
  run: RunnerMainActionGenerationHost["run"];
  install: CorpMainActionGenerationHost["install"] &
    RunnerMainActionGenerationHost["install"];
  rez: CorpMainActionGenerationHost["rez"];
  cardImplementation: CorpMainActionGenerationHost["abilities"] &
    RunnerMainActionGenerationHost["cardImplementation"];
  specialZones: CorpMainActionGenerationHost["specialZones"] &
    RunnerMainActionGenerationHost["specialZones"];
  callbacks: {
    mustServer: RunnerMainActionGenerationHost["servers"]["mustServer"];
    serverChoiceDisplayLabel: RunnerMainActionGenerationHost["servers"]["serverChoiceDisplayLabel"];
    runnerMemoryLimit: RunnerMainActionGenerationHost["memory"]["runnerMemoryLimit"];
  };
};

export type MainActionHostComposition = {
  corpMainActionGenerationHost: StateHostFn<CorpMainActionGenerationHost>;
  runnerMainActionGenerationHost: StateHostFn<RunnerMainActionGenerationHost>;
};

export function createMainActionHostComposition(
  host: MainActionHostCompositionHost,
): MainActionHostComposition {
  const actions = requiredGroup(host.actions, "actions");
  const cards = requiredGroup(host.cards, "cards");
  const scored = requiredGroup(host.scored, "scored");
  const counters = requiredGroup(host.counters, "counters");
  const corp = requiredGroup(host.corp, "corp");
  const runner = requiredGroup(host.runner, "runner");
  const run = requiredGroup(host.run, "run");
  const install = requiredGroup(host.install, "install");
  const rez = requiredGroup(host.rez, "rez");
  const cardImplementation = requiredGroup(
    host.cardImplementation,
    "cardImplementation",
  );
  const specialZones = requiredGroup(host.specialZones, "specialZones");
  const callbacks = requiredGroup(host.callbacks, "callbacks");

  // These services are supplied at bootstrap. Only the state varies by call.
  const corpServices = {
    actions,
    cards,
    agenda: {
      ...scored,
      serverChoiceDisplayLabel: callbacks.serverChoiceDisplayLabel,
    },
    counters,
    corp,
    runner,
    install,
    rez,
    abilities: cardImplementation,
    specialZones,
  } satisfies Omit<CorpMainActionGenerationHost, "state">;
  const runnerServices = {
    actions,
    cards,
    runner,
    servers: callbacks,
    run,
    install,
    memory: callbacks,
    counters,
    specialZones,
    cardImplementation,
  } satisfies Omit<RunnerMainActionGenerationHost, "state">;

  return {
    corpMainActionGenerationHost: (state) => ({ state, ...corpServices }),
    runnerMainActionGenerationHost: (state) => ({ state, ...runnerServices }),
  };
}

function requiredGroup<T>(value: T | undefined, name: string): T {
  if (!value)
    throw new Error(`MainActionHostCompositionHost.${name} ist erforderlich.`);
  return value;
}
