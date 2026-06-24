import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { createGame } from "../create-game";
import {
  buildRunnerHiddenStackProgramInstallAction,
  buildRunnerDelayedInstallRemoveCounterAction,
  buildRunnerDelayedInstallSetAsideAction,
  buildRunnerValuPakInstallAction,
  buildRunnerValuPakSequenceEndAction,
} from "./runner-special-zone-install-actions";

function runnerCardDefinition(
  id: string,
  type: CardDefinition["type"],
  title: string,
  installCost = 0,
): CardDefinition {
  return {
    id,
    title,
    side: "runner",
    type,
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost,
    rulesText: "",
    mechanics: [],
  };
}

describe("runner special zone install action builders", () => {
  it("builds Valu-Pak install and sequence-end actions without mutating state", () => {
    const state = createGame({
      seed: "arch-12-valu-pak-actions",
      setupMode: "completed",
    });
    const before = structuredClone(state);
    const cardId = "valu_pak_program" as CardInstanceId;

    const install = buildRunnerValuPakInstallAction(state, {
      cardId,
      definition: runnerCardDefinition(cardId, "program", "Valu-Pak Program", 1),
    });
    const endSequence = buildRunnerValuPakSequenceEndAction(state);

    expect(install).toMatchObject({
      actionId: "runner.install_card.valu_pak_program.valu_pak_program",
      side: "runner",
      type: "install_card",
      label: "Valu-Pak Program installieren",
      source: cardId,
      costs: [{ clicks: 1, credits: 1 }],
      payload: { cardId, v1922ValuPakInstallAction: true },
      targetRequirements: [],
      visibility: "public",
    });
    expect(endSequence).toMatchObject({
      actionId: "runner.end_turn",
      side: "runner",
      type: "end_turn",
      label: "Zug beenden",
      source: "game_rule",
      costs: [],
      payload: { v1922ValuPakSequenceEnd: true },
      visibility: "private_to_actor",
    });
    expect(state).toEqual(before);
  });

  it("builds Shell Traders set-aside and remove-counter actions without mutating state", () => {
    const state = createGame({
      seed: "arch-12-shell-traders-actions",
      setupMode: "completed",
    });
    const before = structuredClone(state);
    const sourceCardId = "shell_traders_source" as CardInstanceId;
    const targetCardId = "shell_traders_target" as CardInstanceId;
    const sourceDefinitionId =
      "onr_v1_091_the-shell-traders" as CardDefinitionId;
    const targetDefinition = runnerCardDefinition(
      "runner_shell_target_definition",
      "program",
      "Prepared Program",
      3,
    );

    const setAside = buildRunnerDelayedInstallSetAsideAction(state, {
      sourceCardId,
      sourceTitle: "The Shell Traders",
      sourceDefinitionId,
      targetCardId,
      targetDefinition,
      shellCounterAmount: 3,
    });
    const removeCounter = buildRunnerDelayedInstallRemoveCounterAction(state, {
      sourceCardId,
      sourceTitle: "The Shell Traders",
      sourceDefinitionId,
      targetCardId,
      targetDefinitionId: targetDefinition.id,
      remainingCountersBefore: 2,
    });

    expect(setAside).toMatchObject({
      actionId:
        "runner.trigger_ability.shell_traders_source.shell_traders_source.shell_traders_target.set_aside_from_grip.shell_traders_target",
      side: "runner",
      type: "trigger_ability",
      label: "The Shell Traders: Prepared Program vorbereiten",
      source: sourceCardId,
      costs: [{ clicks: 1 }],
      payload: {
        cardId: sourceCardId,
        delayedInstallAbility: "set_aside_from_grip",
        targetCardId,
        targetCardDefinitionId: targetDefinition.id,
        shellCounterAmount: 3,
        counterType: "shell",
        addedCounterAmount: 3,
        sourceDefinitionId,
        specialZone: "set_aside",
        specialZoneVisibility: "public",
        abilityFamily: "hosting-counters",
        effectKind: "counter_change",
      },
      targetRequirements: [
        {
          id: "delayedInstallTarget",
          kind: "card",
          side: "runner",
          zoneScope: ["runner.grip"],
          visibility: "known_to_actor",
        },
      ],
      visibility: "public",
    });
    expect(removeCounter).toMatchObject({
      actionId:
        "runner.trigger_ability.shell_traders_source.shell_traders_source.shell_traders_target.remove_shell_counter.shell_traders_target",
      side: "runner",
      type: "trigger_ability",
      label: "The Shell Traders: Shell-Counter entfernen",
      source: sourceCardId,
      costs: [{ credits: 1 }],
      payload: {
        cardId: sourceCardId,
        delayedInstallAbility: "remove_shell_counter",
        targetCardId,
        targetCardDefinitionId: targetDefinition.id,
        counterType: "shell",
        removeCounterAmount: 1,
        remainingCountersBefore: 2,
        sourceDefinitionId,
        abilityFamily: "hosting-counters",
        effectKind: "counter_change",
      },
      targetRequirements: [
        {
          id: "delayedInstallPreparedCard",
          kind: "card",
          side: "runner",
          zoneScope: ["special.set_aside"],
          visibility: "public",
        },
      ],
      visibility: "public",
    });
    expect(state).toEqual(before);
  });

  it("builds the Self-Modifying Code search-install trigger without mutating state", () => {
    const state = createGame({
      seed: "arch-12-self-modifying-code-action",
      setupMode: "completed",
    });
    const before = structuredClone(state);
    const sourceCardId = "self_modifying_code_source" as CardInstanceId;

    const action = buildRunnerHiddenStackProgramInstallAction(
      state,
      sourceCardId,
    );

    expect(action).toMatchObject({
      actionId:
        "runner.trigger_ability.self_modifying_code_source.self_modifying_code_source.hidden_stack_program_install",
      side: "runner",
      type: "trigger_ability",
      label: "Self-Modifying Code trashen: Programm aus Stack installieren",
      source: sourceCardId,
      costs: [],
      payload: {
        cardId: sourceCardId,
        v1911HiddenZoneAbility: "hidden_stack_program_install",
        hiddenZoneBarrier: true,
      },
      abilityRef: {
        sourceCardInstanceId: sourceCardId,
        abilityId: "hidden_stack_program_install",
      },
      effectRef: "effect.hidden_stack_program_install",
      targetRequirements: [],
      visibility: "private_to_actor",
    });
    expect(state).toEqual(before);
  });
});
