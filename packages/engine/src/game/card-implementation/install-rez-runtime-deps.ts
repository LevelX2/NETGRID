import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import type { CardEffectHiddenInfoResult } from "../../ability-engine/effect-execution-types";
import type { CardImplementationRuntimeDependencies } from "../../ability-engine/card-implementation-runtime";
import {
  RESTRICTED_ACTION_GRANT_KEYS,
  setRestrictedActionGrant,
} from "../state/restricted-action-grants";

export type InstallRezRuntimeDepsKey =
  | "rezzedIceTargetCount"
  | "unrezzedIceTargetCount"
  | "installedIceTargetCount"
  | "rezzedBlackIceTargetCount"
  | "runnerValuPakInstallableProgramCount"
  | "startPayRezCostToTrashRezzedIceChoice"
  | "startTrashUnrezzedIceChoice"
  | "startCorpChoiceRezOrTrashIceChoice"
  | "startDerezRezzedBlackIceChoice"
  | "startRunnerProgramInstallActionBundle";

export type InstallRezCardImplementationRuntimeDeps = Pick<
  CardImplementationRuntimeDependencies,
  InstallRezRuntimeDepsKey
>;

type RuntimeState = Parameters<
  InstallRezCardImplementationRuntimeDeps["rezzedIceTargetCount"]
>[0];
type RuntimeLegalAction = Parameters<
  InstallRezCardImplementationRuntimeDeps["startPayRezCostToTrashRezzedIceChoice"]
>[1];

export type InstallRezRuntimeDepsHost = {
  cards: {
    definitionFor: (
      state: RuntimeState,
      cardId: CardInstanceId,
    ) => CardDefinition;
  };
  install: {
    runnerInstallableProgramIdsForValuPak: (
      state: RuntimeState,
    ) => CardInstanceId[];
  };
  rez: {
    affordableRezzedInstalledIceIdsForRunner: (
      state: RuntimeState,
    ) => CardInstanceId[];
    unrezzedInstalledIceIds: (state: RuntimeState) => CardInstanceId[];
    installedIceIds: (state: RuntimeState) => CardInstanceId[];
    rezzedBlackIceIds: (state: RuntimeState) => CardInstanceId[];
    startCoreCommandJettisonIceChoice: (
      state: RuntimeState,
      sourceCardId: CardInstanceId,
    ) => void;
    startSecurityCodeWormChipTrashIceChoice: (
      state: RuntimeState,
      sourceCardId: CardInstanceId,
    ) => void;
    startForgedActivationOrdersTargetChoice: (
      state: RuntimeState,
      sourceCardId: CardInstanceId,
    ) => void;
    startAnonymousTipDerezBlackIceChoice: (
      state: RuntimeState,
      sourceCardId: CardInstanceId,
    ) => void;
  };
  runner: {
    ensureTurnFlags: (
      state: RuntimeState,
    ) => NonNullable<GameState["runnerTurnFlags"]>;
  };
};

export function createInstallRezCardImplementationRuntimeDeps(
  host: InstallRezRuntimeDepsHost,
): InstallRezCardImplementationRuntimeDeps {
  return {
    rezzedIceTargetCount: (state) =>
      host.rez.affordableRezzedInstalledIceIdsForRunner(state).length,
    unrezzedIceTargetCount: (state) =>
      host.rez.unrezzedInstalledIceIds(state).length,
    installedIceTargetCount: (state) => host.rez.installedIceIds(state).length,
    rezzedBlackIceTargetCount: (state) =>
      host.rez.rezzedBlackIceIds(state).length,
    runnerValuPakInstallableProgramCount: (state) =>
      host.install.runnerInstallableProgramIdsForValuPak(state).length,
    startPayRezCostToTrashRezzedIceChoice: (
      state,
      legalAction,
      sourceCardId,
    ) => {
      host.rez.startCoreCommandJettisonIceChoice(state, sourceCardId);
      return setAbilityPayload(state, legalAction, sourceCardId, host, {
        p3_48RunnerRunControl: "pay_rez_cost_to_trash_rezzed_ice",
        v1922RunnerEventAbility:
          "successful_hq_run_pay_rez_cost_trash_rezzed_ice",
      });
    },
    startTrashUnrezzedIceChoice: (state, legalAction, sourceCardId) => {
      host.rez.startSecurityCodeWormChipTrashIceChoice(state, sourceCardId);
      return setAbilityPayload(state, legalAction, sourceCardId, host, {
        p3_48RunnerRunControl: "trash_unrezzed_ice",
        v1922RunnerEventAbility: "successful_hq_run_trash_unrezzed_ice",
      });
    },
    startCorpChoiceRezOrTrashIceChoice: (state, legalAction, sourceCardId) => {
      host.rez.startForgedActivationOrdersTargetChoice(state, sourceCardId);
      return setAbilityPayload(state, legalAction, sourceCardId, host, {
        p3_48RunnerRunControl: "corp_choice_rez_or_trash_ice",
        v1922RunnerEventAbility: "force_rez_or_trash_ice",
      });
    },
    startDerezRezzedBlackIceChoice: (state, legalAction, sourceCardId) => {
      host.rez.startAnonymousTipDerezBlackIceChoice(state, sourceCardId);
      return setAbilityPayload(state, legalAction, sourceCardId, host, {
        v1922RunnerEventAbility: "derez_black_ice",
      });
    },
    startRunnerProgramInstallActionBundle: (
      state,
      legalAction,
      actionCount,
      temporaryCredit,
    ) =>
      startRunnerProgramInstallActionBundle(
        host,
        state,
        legalAction,
        actionCount,
        temporaryCredit,
      ),
  };
}

function setAbilityPayload(
  state: RuntimeState,
  legalAction: RuntimeLegalAction,
  sourceCardId: CardInstanceId,
  host: InstallRezRuntimeDepsHost,
  payload: Record<string, string | number | boolean>,
): CardEffectHiddenInfoResult {
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ...payload,
    sourceDefinitionId: host.cards.definitionFor(state, sourceCardId).id,
  };
  return { publicPayload: legalAction.payload ?? {} };
}

function startRunnerProgramInstallActionBundle(
  host: InstallRezRuntimeDepsHost,
  state: RuntimeState,
  legalAction: RuntimeLegalAction,
  actionCount: 5,
  temporaryCredit: 1,
): CardEffectHiddenInfoResult {
  if (actionCount !== 5 || temporaryCredit !== 1)
    throw new Error("Valu-Pak Software Bundle profile is invalid.");
  const installablePrograms =
    host.install.runnerInstallableProgramIdsForValuPak(state);
  if (installablePrograms.length === 0)
    throw new Error(
      "Valu-Pak Software Bundle findet kein installierbares Programm.",
    );
  const flags = host.runner.ensureTurnFlags(state);
  const sourceCardId = String(
    legalAction.payload?.cardId ?? legalAction.source ?? "",
  ) as CardInstanceId;
  if (!sourceCardId)
    throw new Error("Valu-Pak Software Bundle fehlt als Quelle.");
  const sourceDefinitionId = host.cards.definitionFor(state, sourceCardId).id;
  setRestrictedActionGrant(
    flags,
    RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
    {
      side: "runner",
      sourceCardInstanceId: sourceCardId,
      sourceDefinitionId,
      actionType: "install_card",
      remainingActions: actionCount,
      costProfile: "temporary_credit_bundle",
      temporaryCredits: {
        amount: temporaryCredit,
        usableFor: "runner_program_install",
      },
      cleanupTiming: "side_turn_end",
    },
  );
  flags.valuPakProgramInstallActionsRemaining = actionCount;
  flags.valuPakTemporaryProgramInstallCredits = temporaryCredit;
  state.runner.clicks += actionCount;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1922RunnerEventAbility: "program_install_action_bundle",
    gainedActions: actionCount,
    temporaryProgramInstallCredits: temporaryCredit,
    valuPakProgramInstallActionsRemaining:
      flags.valuPakProgramInstallActionsRemaining,
    runnerClicksAfter: state.runner.clicks,
  };
  return { publicPayload: legalAction.payload ?? {} };
}
