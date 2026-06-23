import type { GameState, LegalAction, PlayerAction } from "@netgrid/shared";
import { describe, expect, it, vi } from "vitest";
import { createGame } from "../create-game";
import {
  resolvePendingChoice,
  type PendingChoiceResolutionHost,
} from "./pending-choice-resolution";

describe("pending choice resolution", () => {
  it("throws the existing error when the choice is not open", () => {
    const state = stateWithChoice("choice_1", "unknown.source");

    expect(() =>
      resolvePendingChoice(
        pendingChoiceHost(state),
        choiceAction("other_choice"),
        playerChoice("other_choice"),
      ),
    ).toThrow("Diese Choice ist nicht offen.");
  });

  it("dispatches setup mulligan choices through the existing callback", () => {
    const state = stateWithChoice("setup_choice", "setup.mulligan");
    const resolveSetupMulliganChoice = vi.fn();

    resolvePendingChoice(
      pendingChoiceHost(state, { setup: { resolveSetupMulliganChoice } }),
      choiceAction("setup_choice"),
      playerChoice("setup_choice", ["keep"]),
    );

    expect(resolveSetupMulliganChoice).toHaveBeenCalledOnce();
    expect(resolveSetupMulliganChoice.mock.calls[0]?.[0]).toBe(state);
  });

  it("lets hidden-zone search handlers clear the pending choice", () => {
    const state = stateWithChoice("search_choice", "hidden_zone.search");

    resolvePendingChoice(
      pendingChoiceHost(state, {
        hiddenZone: {
          handleHiddenZoneSearchChoice: () => ({
            handled: true,
            deletePendingChoice: true,
          }),
        },
      }),
      choiceAction("search_choice"),
      playerChoice("search_choice", ["target"]),
    );

    expect(state.pendingChoice).toBeUndefined();
  });

  it("preserves the fallback behavior for unhandled open choices", () => {
    const state = stateWithChoice("fallback_choice", "unhandled.source");

    resolvePendingChoice(
      pendingChoiceHost(state),
      choiceAction("fallback_choice"),
      playerChoice("fallback_choice", ["decline"]),
    );

    expect(state.pendingChoice).toBeUndefined();
  });
});

function stateWithChoice(choiceId: string, source: string): GameState {
  const state = createGame({
    seed: `arch-55-${choiceId}`,
    setupMode: "completed",
  });
  state.pendingChoice = {
    choiceId,
    side: "runner",
    source,
    kind: "select_option",
    prompt: "Test choice",
    options: [{ id: "target", label: "Target" }],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion,
    visibility: "public",
  };
  return state;
}

function choiceAction(choiceId: string): LegalAction {
  return {
    actionId: `runner.resolve_choice.${choiceId}`,
    side: "runner",
    type: "resolve_choice",
    label: "Choice",
    source: "game_rule",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 0,
    payload: { choiceId },
  };
}

function playerChoice(
  choiceId: string,
  selectedOptionIds: string[] = ["target"],
): PlayerAction {
  return {
    matchId: "local-demo-match",
    side: "runner",
    actionId: `runner.resolve_choice.${choiceId}`,
    clientKnownStateVersion: 0,
    selectedChoices: { choiceId, selectedOptionIds },
  };
}

function pendingChoiceHost(
  state: GameState,
  overrides: Partial<{
    setup: Partial<PendingChoiceResolutionHost["setup"]>;
    hiddenZone: Partial<PendingChoiceResolutionHost["hiddenZone"]>;
  }> = {},
): PendingChoiceResolutionHost {
  const unexpected = (name: string) => () => {
    throw new Error(`Unexpected pending choice host call: ${name}`);
  };
  const unhandled = () => ({ handled: false });

  return {
    state,
    setup: {
      resolveSetupMulliganChoice: unexpected("resolveSetupMulliganChoice"),
      resolveDiscardChoice: unexpected("resolveDiscardChoice"),
      ...overrides.setup,
    },
    replacement: {
      resolveReplacementChoice: unexpected("resolveReplacementChoice"),
      resolveEventModificationChoice: unexpected("resolveEventModificationChoice"),
      resolvePdcaDamageReplacementChoice: unexpected("resolvePdcaDamageReplacementChoice"),
    },
    trace: {
      resolveTraceChoice: unexpected("resolveTraceChoice"),
    },
    hiddenZone: {
      handleHiddenZoneArrangeChoice: unhandled,
      hiddenZoneArrangeChoiceHandlerHost: () => ({}),
      handleHiddenZoneNonSearchChoice: unhandled,
      hiddenZoneNonSearchChoiceHandlerHost: () => ({}),
      handleCorpZoneChoice: unhandled,
      corpZoneChoiceHandlerHost: () => ({}),
      isP358HiddenReplacementCompatibilityChoiceSource: () => false,
      resolveP358HiddenReplacementChoice: unexpected(
        "resolveP358HiddenReplacementChoice",
      ),
      handleHiddenZoneSearchChoice: unhandled,
      hiddenZoneSearchChoiceHandlerHost: () => ({}),
      resolveHuntClubBbsExposeChoice: unexpected("resolveHuntClubBbsExposeChoice"),
      resolveExposeInstalledCorpCardsChoice: unexpected(
        "resolveExposeInstalledCorpCardsChoice",
      ),
      resolveInvestmentFirmCreditChoice: unexpected(
        "resolveInvestmentFirmCreditChoice",
      ),
      resolveCrashEverettDrawChoice: unexpected("resolveCrashEverettDrawChoice"),
      resolvePowerGridOverloadChoice: unexpected("resolvePowerGridOverloadChoice"),
      resolveSystematicLayoffsAdvancementChoice: unexpected(
        "resolveSystematicLayoffsAdvancementChoice",
      ),
      resolveAnonymousTipDerezBlackIceChoice: unexpected(
        "resolveAnonymousTipDerezBlackIceChoice",
      ),
      resolveCoreCommandJettisonIceChoice: unexpected(
        "resolveCoreCommandJettisonIceChoice",
      ),
      resolveForgedActivationOrdersTargetChoice: unexpected(
        "resolveForgedActivationOrdersTargetChoice",
      ),
      resolveForgedActivationOrdersCorpChoice: unexpected(
        "resolveForgedActivationOrdersCorpChoice",
      ),
      resolveSecurityCodeWormChipTrashIceChoice: unexpected(
        "resolveSecurityCodeWormChipTrashIceChoice",
      ),
      resolveV1921PlayfulAiChoice: unexpected("resolveV1921PlayfulAiChoice"),
      resolveRunnerInstalledConnectionTrashBadPublicityChoice: unexpected(
        "resolveRunnerInstalledConnectionTrashBadPublicityChoice",
      ),
      resolveGripInstallTemporaryCreditChoice: unexpected(
        "resolveGripInstallTemporaryCreditChoice",
      ),
      resolveStackInstallRunCleanupChoice: unexpected(
        "resolveStackInstallRunCleanupChoice",
      ),
      resolveOpenEndedMileageProgramReturnChoice: unexpected(
        "resolveOpenEndedMileageProgramReturnChoice",
      ),
      resolveRunnerHostingChoice: unexpected("resolveRunnerHostingChoice"),
      resolveIncubatorTransformChoice: unexpected("resolveIncubatorTransformChoice"),
      resolveCodeViralCachePurgeChoice: unexpected(
        "resolveCodeViralCachePurgeChoice",
      ),
      resolveChimeraDaemonTrashChoice: unexpected("resolveChimeraDaemonTrashChoice"),
      resolveRunnerProgramReturnChoice: unexpected(
        "resolveRunnerProgramReturnChoice",
      ),
      resolveRunnerPrivateLookChoice: unexpected("resolveRunnerPrivateLookChoice"),
      resolveExposePreventionChoice: unexpected("resolveExposePreventionChoice"),
      resolveSenatorialFieldTripChoice: unexpected(
        "resolveSenatorialFieldTripChoice",
      ),
      ...overrides.hiddenZone,
    },
    corp: {
      handleCorpInstallRezSequenceChoice: unhandled,
      corpInstallRezSequenceHandlerHost: () => ({}),
      handleScoredAgendaFlowChoice: unhandled,
      scoredAgendaFlowHost: () => ({}),
    },
    runner: {
      resolveRunnerProgramTrashBeforeInstallChoice: unexpected(
        "resolveRunnerProgramTrashBeforeInstallChoice",
      ),
    },
    run: {
      resolveHqIceSwapChoice: unexpected(
        "resolveHqIceSwapChoice",
      ),
      fortPassWindowHostForState: () => ({}),
      resolveTooManyDoorsSecretSpendChoiceInRunModule: unexpected(
        "resolveTooManyDoorsSecretSpendChoiceInRunModule",
      ),
      encounterSpecialWindowHostForState: () => ({}),
      resolveHammerStealthLossChoice: unexpected("resolveHammerStealthLossChoice"),
      fortRunSideFamiliesHostForState: () => ({}),
      resolveViral15ProgramTrashChoiceInRunModule: unexpected(
        "resolveViral15ProgramTrashChoiceInRunModule",
      ),
      encounterResolutionHostForState: () => ({}),
      resolvePassRezzedIceProgramTrashChoiceInRunModule: unexpected(
        "resolvePassRezzedIceProgramTrashChoiceInRunModule",
      ),
      resolveSpeedTrapRezInterruptChoice: unexpected(
        "resolveSpeedTrapRezInterruptChoice",
      ),
      runRezWindowHostForState: () => ({}),
      resolvePattelsVirusCounterChoice: unexpected("resolvePattelsVirusCounterChoice"),
      runEndCleanupHost: () => ({}),
      resolveAardvarkInterceptionChoice: unexpected(
        "resolveAardvarkInterceptionChoice",
      ),
      resolveSuccessfulRunInterventionChoiceInRunModule: unexpected(
        "resolveSuccessfulRunInterventionChoiceInRunModule",
      ),
      successfulRunInterventionHost: () => ({}),
      resolvePostMeatDamageHiddenResourceChoice: unexpected(
        "resolvePostMeatDamageHiddenResourceChoice",
      ),
      resolveStartOfRunFortUtilityChoice: unexpected(
        "resolveStartOfRunFortUtilityChoice",
      ),
    },
    access: {
      resolvePriorityWreckSpendChoice: unexpected("resolvePriorityWreckSpendChoice"),
      runAccessTransitionHost: () => ({}),
      resolveMicrotechAiInterfacePreAccessChoice: unexpected(
        "resolveMicrotechAiInterfacePreAccessChoice",
      ),
    },
    cardImplementation: {
      resolveCardImplementationAccessPaymentChoice: unexpected(
        "resolveCardImplementationAccessPaymentChoice",
      ),
      resolveCardImplementationAdvancementDistributionChoice: unexpected(
        "resolveCardImplementationAdvancementDistributionChoice",
      ),
      resolveCardImplementationMoveAdvancementChoice: unexpected(
        "resolveCardImplementationMoveAdvancementChoice",
      ),
    },
    constants: {
      RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_CHOICE_SOURCE:
        "runner_connection_trash_bad_publicity",
    },
  };
}
