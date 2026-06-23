import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { buildLegalAction } from "./action-builders";

export type RunnerValuPakInstallActionInput = {
  cardId: CardInstanceId;
  definition: CardDefinition;
};

export type RunnerShellTradersSetAsideActionInput = {
  sourceCardId: CardInstanceId;
  sourceTitle: string;
  sourceDefinitionId: CardDefinitionId;
  targetCardId: CardInstanceId;
  targetDefinition: CardDefinition;
  shellCounterAmount: number;
};

export type RunnerShellTradersRemoveCounterActionInput = {
  sourceCardId: CardInstanceId;
  sourceTitle: string;
  sourceDefinitionId: CardDefinitionId;
  targetCardId: CardInstanceId;
  targetDefinitionId: CardDefinitionId;
  remainingCountersBefore: number;
};

export function buildRunnerValuPakInstallAction(
  state: GameState,
  input: RunnerValuPakInstallActionInput,
): LegalAction {
  return buildLegalAction(
    state,
    "runner",
    "install_card",
    `${input.definition.title} installieren`,
    input.cardId,
    [{ clicks: 1, credits: input.definition.installCost ?? 0 }],
    {
      cardId: input.cardId,
      v1922ValuPakInstallAction: true,
    },
  );
}

export function buildRunnerValuPakSequenceEndAction(
  state: GameState,
): LegalAction {
  return buildLegalAction(
    state,
    "runner",
    "end_turn",
    "Zug beenden",
    "game_rule",
    [],
    {
      v1922ValuPakSequenceEnd: true,
    },
  );
}

export function buildRunnerShellTradersSetAsideAction(
  state: GameState,
  input: RunnerShellTradersSetAsideActionInput,
): LegalAction {
  return buildLegalAction(
    state,
    "runner",
    "trigger_ability",
    `${input.sourceTitle}: ${input.targetDefinition.title} vorbereiten`,
    input.sourceCardId,
    [{ clicks: 1 }],
    {
      cardId: input.sourceCardId,
      delayedInstallAbility: "set_aside_from_grip",
      targetCardId: input.targetCardId,
      targetCardDefinitionId: input.targetDefinition.id,
      shellCounterAmount: input.shellCounterAmount,
      counterType: "shell",
      addedCounterAmount: input.shellCounterAmount,
      sourceDefinitionId: input.sourceDefinitionId,
      specialZone: "set_aside",
      specialZoneVisibility: "public",
      abilityFamily: "hosting-counters",
      effectKind: "counter_change",
    },
    {
      targetRequirements: [
        {
          id: "shellTradersTarget",
          kind: "card",
          side: "runner",
          zoneScope: ["runner.grip"],
          visibility: "known_to_actor",
        },
      ],
    },
  );
}

export function buildRunnerShellTradersRemoveCounterAction(
  state: GameState,
  input: RunnerShellTradersRemoveCounterActionInput,
): LegalAction {
  return buildLegalAction(
    state,
    "runner",
    "trigger_ability",
    `${input.sourceTitle}: Shell-Counter entfernen`,
    input.sourceCardId,
    [{ credits: 1 }],
    {
      cardId: input.sourceCardId,
      delayedInstallAbility: "remove_shell_counter",
      targetCardId: input.targetCardId,
      targetCardDefinitionId: input.targetDefinitionId,
      counterType: "shell",
      removeCounterAmount: 1,
      remainingCountersBefore: input.remainingCountersBefore,
      sourceDefinitionId: input.sourceDefinitionId,
      abilityFamily: "hosting-counters",
      effectKind: "counter_change",
    },
    {
      targetRequirements: [
        {
          id: "shellTradersPreparedCard",
          kind: "card",
          side: "runner",
          zoneScope: ["special.set_aside"],
          visibility: "public",
        },
      ],
    },
  );
}

export function buildRunnerHiddenStackProgramInstallAction(
  state: GameState,
  sourceCardId: CardInstanceId,
): LegalAction {
  return buildLegalAction(
    state,
    "runner",
    "trigger_ability",
    "Self-Modifying Code trashen: Programm aus Stack installieren",
    sourceCardId,
    [],
    {
      cardId: sourceCardId,
      v1911HiddenZoneAbility: "hidden_stack_program_install",
      hiddenZoneBarrier: true,
    },
    {
      abilityRef: {
        sourceCardInstanceId: sourceCardId,
        abilityId: "hidden_stack_program_install",
      },
      effectRef: "effect.hidden_stack_program_install",
    },
  );
}
