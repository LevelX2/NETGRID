import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";
import {
  isVisibleHardEndRunSubroutine,
  isVisiblePayEndRunSubroutine,
} from "../run-analysis/visible-subroutine-semantics";

export type VisibleEncounterSubroutine = NonNullable<
  NonNullable<VisibleCard["effectiveRunQuote"]>["subroutines"][number]
>;

export function isImmediateSafetyThreatSubroutine(
  subroutine: VisibleEncounterSubroutine,
): boolean {
  const type = subroutine.type.toLowerCase();
  const damageTypeValue = (subroutine as { damageType?: unknown }).damageType;
  const damageType =
    typeof damageTypeValue === "string" ? damageTypeValue : undefined;
  return (
    type === "brain_damage" ||
    type === "core_damage" ||
    type === "do_brain_damage" ||
    type === "do_core_damage" ||
    type === "do_damage" ||
    damageType === "brain" ||
    damageType === "core" ||
    type === "give_runner_tag" ||
    type === "initiate_trace" ||
    type === "trash_installed_program" ||
    type === "trash_program_unless_runner_pays" ||
    subroutine.unbrokenRunEffect?.causesDamageOrProgramTrash === true
  );
}

export function isUnacceptableImmediateSafetyThreatSubroutine(
  input: AiDecisionInput,
  subroutine: VisibleEncounterSubroutine,
): boolean {
  return (
    isImmediateSafetyThreatSubroutine(subroutine) &&
    !isAcceptableNonlethalDamageSubroutine(input, subroutine)
  );
}

export function isAcceptableNonlethalDamageSubroutine(
  input: AiDecisionInput,
  subroutine: VisibleEncounterSubroutine,
): boolean {
  if (!isDirectDamageSubroutine(subroutine)) return false;
  if (isPermanentDamageSubroutine(subroutine)) return false;
  const amount = Math.max(1, Math.floor(subroutine.amount ?? 1));
  return amount <= (input.playerView.own.gripOrHq?.length ?? 0);
}

export function encounterContinueAcceptsOnlyNonlethalDamageThreats(
  input: AiDecisionInput,
): boolean {
  if (input.playerView.run?.phase !== "encounter_ice") return false;
  const continueAction = input.legalActions.find(
    (action) =>
      action.type === "continue_run" &&
      action.payload?.encounterContinue === true,
  );
  if (!continueAction || continueAction.payload?.encounterWillEndRun !== true) {
    return false;
  }
  const encounteredIceId = input.playerView.run.encounteredIce?.instanceId;
  const subroutines = input.playerView.servers
    .flatMap((server) => server.ice)
    .find((ice) => ice.instanceId === encounteredIceId)
    ?.effectiveRunQuote?.subroutines;
  if (!subroutines?.length) return false;
  const immediateThreats = subroutines.filter(
    isImmediateSafetyThreatSubroutine,
  );
  return (
    immediateThreats.length > 0 &&
    immediateThreats.every((subroutine) =>
      isAcceptableNonlethalDamageSubroutine(input, subroutine),
    )
  );
}

function isDirectDamageSubroutine(
  subroutine: VisibleEncounterSubroutine,
): boolean {
  const type = subroutine.type.toLowerCase();
  const damageTypeValue = (subroutine as { damageType?: unknown }).damageType;
  return (
    type === "brain_damage" ||
    type === "core_damage" ||
    type === "do_brain_damage" ||
    type === "do_core_damage" ||
    type === "do_damage" ||
    typeof damageTypeValue === "string"
  );
}

function isPermanentDamageSubroutine(
  subroutine: VisibleEncounterSubroutine,
): boolean {
  const type = subroutine.type.toLowerCase();
  const id = subroutine.id.toLowerCase();
  const damageTypeValue = (subroutine as { damageType?: unknown }).damageType;
  const damageType =
    typeof damageTypeValue === "string"
      ? damageTypeValue.toLowerCase()
      : undefined;
  return (
    type.includes("brain_damage") ||
    type.includes("core_damage") ||
    id.includes("brain_damage") ||
    id.includes("core_damage") ||
    damageType === "brain" ||
    damageType === "core"
  );
}

export function isProgramTrashThreatSubroutine(
  subroutine: VisibleEncounterSubroutine,
): boolean {
  const type = subroutine.type.toLowerCase();
  return (
    type === "set_run_pass_rezzed_ice_program_trash" ||
    type === "trash_installed_program" ||
    type === "trash_program_unless_runner_pays" ||
    type === "trash_installed_program_unless_runner_pays"
  );
}

export function isEndRunSubroutine(
  subroutine: VisibleEncounterSubroutine,
): boolean {
  return (
    isVisibleHardEndRunSubroutine(subroutine) ||
    isVisiblePayEndRunSubroutine(subroutine)
  );
}

export function isTrashUnlessRunnerPaysSubroutine(
  type: string | undefined,
): boolean {
  return (
    type === "trash_program_unless_runner_pays" ||
    type === "trash_installed_program_unless_runner_pays"
  );
}
