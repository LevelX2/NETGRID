import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createInstallRezCardImplementationRuntimeDeps,
  type InstallRezRuntimeDepsHost,
} from "./install-rez-runtime-deps";

const sourceCardId = "source" as CardInstanceId;
const sourceDefinitionId = "source_def" as CardDefinitionId;
const programId = "program" as CardInstanceId;

function state(): GameState {
  return {
    stateVersion: 10,
    pendingChoice: undefined,
    randomCounter: 0,
    runner: {
      credits: 5,
      clicks: 1,
      tags: 0,
      stack: [],
      grip: [programId],
      heap: [],
      scoreArea: [],
      identity: "runner_identity" as CardInstanceId,
      rig: { programs: [], hardware: [], resources: [] },
      memoryUsed: 0,
    },
    corp: {
      credits: 5,
      hq: [],
      rd: [],
      archives: [],
      scoreArea: [],
      identity: "corp_identity" as CardInstanceId,
      servers: [],
    },
    cardInstances: {},
    eventLog: [],
  } as unknown as GameState;
}

function action(payload: LegalAction["payload"] = {}): LegalAction {
  return {
    actionId: "trigger_ability:source",
    id: "trigger_ability:source",
    side: "runner",
    timingPoint: "runner_action.main",
    type: "trigger_ability",
    label: "Trigger",
    source: sourceCardId,
    payload,
    costs: [],
    targetRequirements: [],
  } as unknown as LegalAction;
}

function definition(id: CardDefinitionId = sourceDefinitionId): CardDefinition {
  return {
    id,
    title: String(id),
    type: "event",
  } as CardDefinition;
}

function host(input: {
  affordableRezzed?: CardInstanceId[];
  unrezzed?: CardInstanceId[];
  installed?: CardInstanceId[];
  rezzedBlack?: CardInstanceId[];
  installablePrograms?: CardInstanceId[];
  calls?: string[];
} = {}): InstallRezRuntimeDepsHost {
  return {
    cards: {
      definitionFor: () => definition(),
    },
    install: {
      runnerInstallableProgramIdsForValuPak: () =>
        input.installablePrograms ?? [programId],
    },
    rez: {
      affordableRezzedInstalledIceIdsForRunner: () =>
        input.affordableRezzed ?? ["rezzed" as CardInstanceId],
      unrezzedInstalledIceIds: () =>
        input.unrezzed ?? ["unrezzed" as CardInstanceId],
      installedIceIds: () => input.installed ?? ["installed" as CardInstanceId],
      rezzedBlackIceIds: () =>
        input.rezzedBlack ?? ["black" as CardInstanceId],
      startCoreCommandJettisonIceChoice: () => {
        input.calls?.push("core_command");
      },
      startSecurityCodeWormChipTrashIceChoice: () => {
        input.calls?.push("security_code");
      },
      startForgedActivationOrdersTargetChoice: () => {
        input.calls?.push("forged_orders");
      },
      startAnonymousTipDerezBlackIceChoice: () => {
        input.calls?.push("anonymous_tip");
      },
    },
    runner: {
      ensureTurnFlags: (gameState) => {
        gameState.runnerTurnFlags ??= {
          stoleAgendaThisTurn: false,
          stoleAgendaLastTurn: false,
        } as NonNullable<GameState["runnerTurnFlags"]>;
        return gameState.runnerTurnFlags;
      },
    },
  };
}

describe("install/rez card implementation runtime deps", () => {
  it("creates only the install/rez runtime properties", () => {
    const deps = createInstallRezCardImplementationRuntimeDeps(host());

    expect(Object.keys(deps)).toEqual([
      "rezzedIceTargetCount",
      "unrezzedIceTargetCount",
      "installedIceTargetCount",
      "rezzedBlackIceTargetCount",
      "runnerValuPakInstallableProgramCount",
      "startPayRezCostToTrashRezzedIceChoice",
      "startTrashUnrezzedIceChoice",
      "startCorpChoiceRezOrTrashIceChoice",
      "startDerezRezzedBlackIceChoice",
      "startRunnerProgramInstallActionBundle",
    ]);
  });

  it("delegates target counts to install/rez host queries", () => {
    const deps = createInstallRezCardImplementationRuntimeDeps(
      host({
        affordableRezzed: ["a", "b"] as CardInstanceId[],
        unrezzed: ["c"] as CardInstanceId[],
        installed: ["d", "e", "f"] as CardInstanceId[],
        rezzedBlack: [] as CardInstanceId[],
        installablePrograms: [programId, "program_2" as CardInstanceId],
      }),
    );
    const gameState = state();

    expect(deps.rezzedIceTargetCount(gameState)).toBe(2);
    expect(deps.unrezzedIceTargetCount(gameState)).toBe(1);
    expect(deps.installedIceTargetCount(gameState)).toBe(3);
    expect(deps.rezzedBlackIceTargetCount(gameState)).toBe(0);
    expect(deps.runnerValuPakInstallableProgramCount(gameState)).toBe(2);
  });

  it("starts rez-adjacent choice callbacks with stable payload metadata", () => {
    const calls: string[] = [];
    const deps = createInstallRezCardImplementationRuntimeDeps(host({ calls }));
    const gameState = state();
    const legalAction = action({ existing: true });

    const result = deps.startPayRezCostToTrashRezzedIceChoice(
      gameState,
      legalAction,
      sourceCardId,
    );

    expect(calls).toEqual(["core_command"]);
    expect(result.publicPayload).toEqual({
      existing: true,
      p3_48RunnerRunControl: "pay_rez_cost_to_trash_rezzed_ice",
      v1922RunnerEventAbility:
        "successful_hq_run_pay_rez_cost_trash_rezzed_ice",
      sourceDefinitionId,
    });
  });

  it("preserves the Valu-Pak install action bundle mutation and payload", () => {
    const deps = createInstallRezCardImplementationRuntimeDeps(host());
    const gameState = state();
    const legalAction = action();

    const result = deps.startRunnerProgramInstallActionBundle(
      gameState,
      legalAction,
      5,
      1,
    );

    expect(gameState.runner.clicks).toBe(6);
    expect(gameState.runnerTurnFlags).toMatchObject({
      valuPakProgramInstallActionsRemaining: 5,
      valuPakTemporaryProgramInstallCredits: 1,
      restrictedActionGrants: {
        valu_pak_program_install: {
          side: "runner",
          sourceCardInstanceId: sourceCardId,
          sourceDefinitionId,
          actionType: "install_card",
          remainingActions: 5,
          costProfile: "temporary_credit_bundle",
          temporaryCredits: {
            amount: 1,
            usableFor: "runner_program_install",
          },
          cleanupTiming: "side_turn_end",
        },
      },
    });
    expect(result.publicPayload).toEqual({
      v1922RunnerEventAbility: "program_install_action_bundle",
      gainedActions: 5,
      temporaryProgramInstallCredits: 1,
      valuPakProgramInstallActionsRemaining: 5,
      runnerClicksAfter: 6,
    });
  });

  it("rejects Valu-Pak bundle start when no program is installable", () => {
    const deps = createInstallRezCardImplementationRuntimeDeps(
      host({ installablePrograms: [] }),
    );

    expect(() =>
      deps.startRunnerProgramInstallActionBundle(state(), action(), 5, 1),
    ).toThrow("Valu-Pak Software Bundle findet kein installierbares Programm.");
  });

  it("does not import from the public engine index", () => {
    const source = readFileSync(
      new URL("./install-rez-runtime-deps.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain('from "../index"');
    expect(source).not.toContain("from '../index'");
    expect(source).not.toContain('from "../../index"');
    expect(source).not.toContain("from '../../index'");
  });
});
