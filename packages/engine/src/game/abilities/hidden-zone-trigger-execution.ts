import type { LegalAction } from "@netgrid/shared";
import {
  handleTopFiveProgramInstallActivation,
  type HiddenZoneSearchActivationHost,
} from "../hidden-zone/search-choice-activations";

export type HiddenZoneTriggerExecutionHost = HiddenZoneSearchActivationHost;

export type HiddenZoneTriggerExecutionResult = {
  handled: boolean;
  actionType?: LegalAction["type"];
};

export function handleHiddenZoneTriggerExecution(
  host: HiddenZoneTriggerExecutionHost,
  legalAction: LegalAction,
): HiddenZoneTriggerExecutionResult {
  if (legalAction.type !== "trigger_ability") return { handled: false };

  if (
    legalAction.payload?.v1915RunnerProgramAbility === "top5_program_install"
  ) {
    handleTopFiveProgramInstallActivation(host);
    return handled(legalAction);
  }

  return { handled: false };
}

function handled(legalAction: LegalAction): HiddenZoneTriggerExecutionResult {
  return { handled: true, actionType: legalAction.type };
}
