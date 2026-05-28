import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  GameState,
  LegalAction,
  Side,
} from "@netgrid/shared";
import type { ActivatedCardAbilityImplementation } from "../../ability-engine/definition-types";

export type RunCardImplementationActionHost = {
  state: GameState;
  cards: {
    cardInstanceFor: (cardId: CardInstanceId) => CardInstance | undefined;
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    runnerInstalledCardIds: () => CardInstanceId[];
    cardImplementationForDefinitionId?: (definitionId: string) => any;
  };
  actions?: {
    buildLegalAction: (
      type: LegalAction["type"],
      label: string,
      source: LegalAction["source"],
      costs?: LegalAction["costs"],
      payload?: LegalAction["payload"],
    ) => LegalAction;
  };
  runtime: {
    pushActivatedActionsForTiming: (
      actions: LegalAction[],
      side: Side,
      sourceCardId: CardInstanceId,
      definition: CardDefinition,
      timing: ActivatedCardAbilityImplementation["timing"],
    ) => void;
  };
};

export type RunCardImplementationActionBuildResult = {
  handled: boolean;
  legalActions: LegalAction[];
};

export function buildRunnerDuringRunCardImplementationActions(
  host: RunCardImplementationActionHost,
): RunCardImplementationActionBuildResult {
  if (!host.state.run) return { handled: true, legalActions: [] };
  const legalActions: LegalAction[] = [];
  for (const cardId of host.cards.runnerInstalledCardIds().slice().sort()) {
    const definition = host.cards.definitionFor(cardId);
    host.runtime.pushActivatedActionsForTiming(
      legalActions,
      "runner",
      cardId,
      definition,
      "during_run",
    );
    const boost =
      host.cards.cardImplementationForDefinitionId?.(definition.id)
        ?.runnerRunStrengthBoost;
    if (
      !boost ||
      host.state.cardInstances[cardId]?.tapped ||
      host.state.run.runStrengthBoostUsedSourceIds?.includes(cardId)
    )
      continue;
    for (const targetCardId of host.state.runner.rig.programs.slice().sort()) {
      const targetDefinition = host.cards.definitionFor(targetCardId);
      if (!targetDefinition.subtypes.includes("icebreaker")) continue;
      if (!host.actions) continue;
      legalActions.push(
        host.actions.buildLegalAction(
          "trigger_ability",
          `${definition.title}: ${targetDefinition.title} +${boost.amount}`,
          cardId,
          [],
          {
            cardId,
            targetCardId,
            runnerAbility: "boost_icebreaker_for_run",
          },
        ),
      );
    }
  }
  return { handled: true, legalActions };
}

export function buildRunnerCostPenaltySupportCardImplementationActions(
  host: RunCardImplementationActionHost,
): RunCardImplementationActionBuildResult {
  if (!host.state.runnerCostPenaltySupportWindow)
    return { handled: true, legalActions: [] };
  const legalActions: LegalAction[] = [];
  for (const cardId of host.cards.runnerInstalledCardIds().slice().sort()) {
    host.runtime.pushActivatedActionsForTiming(
      legalActions,
      "runner",
      cardId,
      host.cards.definitionFor(cardId),
      "runner_cost_penalty_support",
    );
  }
  return { handled: true, legalActions };
}

export function buildRunnerAccessStartCardImplementationActions(
  host: RunCardImplementationActionHost,
): RunCardImplementationActionBuildResult {
  const serverId = host.state.run?.hiddenRunnerResourceAccessStartServerId;
  if (!serverId) return { handled: true, legalActions: [] };
  const legalActions: LegalAction[] = [];
  for (const cardId of host.cards.runnerInstalledCardIds().slice().sort()) {
    host.runtime.pushActivatedActionsForTiming(
      legalActions,
      "runner",
      cardId,
      host.cards.definitionFor(cardId),
      "access_start",
    );
  }
  if (!host.actions) throw new Error("Access-Start-Action-Builder fehlt.");
  legalActions.push(
    host.actions.buildLegalAction(
      "continue_run",
      "Access beginnen",
      "game_rule",
      [],
      {
        hiddenRunnerResourceAccessStartContinue: true,
        serverId,
      },
    ),
  );
  return { handled: true, legalActions };
}

export function buildCorpEncounterCardImplementationActions(
  host: RunCardImplementationActionHost,
): RunCardImplementationActionBuildResult {
  const run = host.state.run;
  if (
    host.state.timingPoint !== "run.encounter_ice" ||
    run?.phase !== "encounter_ice" ||
    !run.encounteredIceId
  )
    return { handled: true, legalActions: [] };
  const instance = host.cards.cardInstanceFor(run.encounteredIceId);
  if (!instance?.rezzed || instance.controller !== "corp")
    return { handled: true, legalActions: [] };
  const legalActions: LegalAction[] = [];
  host.runtime.pushActivatedActionsForTiming(
    legalActions,
    "corp",
    run.encounteredIceId,
    host.cards.definitionFor(run.encounteredIceId),
    "corp_encounter",
  );
  return { handled: true, legalActions };
}

function rezzedCorpRootCardIds(state: GameState): CardInstanceId[] {
  return state.corp.servers
    .flatMap((server) => server.root)
    .filter((cardId): cardId is CardInstanceId => {
      const instance = state.cardInstances[cardId];
      return Boolean(instance?.rezzed && instance.controller === "corp");
    })
    .sort();
}

export function buildCorpDuringRunCardImplementationActions(
  host: RunCardImplementationActionHost,
): RunCardImplementationActionBuildResult {
  if (!host.state.run) return { handled: true, legalActions: [] };
  const legalActions: LegalAction[] = [];
  for (const cardId of rezzedCorpRootCardIds(host.state)) {
    host.runtime.pushActivatedActionsForTiming(
      legalActions,
      "corp",
      cardId,
      host.cards.definitionFor(cardId),
      "corp_during_run",
    );
  }
  return { handled: true, legalActions };
}

export function buildCorpTraceCardImplementationActions(
  host: RunCardImplementationActionHost,
): RunCardImplementationActionBuildResult {
  if (!host.state.trace) return { handled: true, legalActions: [] };
  const legalActions: LegalAction[] = [];
  for (const cardId of rezzedCorpRootCardIds(host.state)) {
    host.runtime.pushActivatedActionsForTiming(
      legalActions,
      "corp",
      cardId,
      host.cards.definitionFor(cardId),
      "corp_trace_window",
    );
  }
  return { handled: true, legalActions };
}
