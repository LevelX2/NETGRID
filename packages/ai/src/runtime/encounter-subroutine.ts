import { type VisibleCard } from "@netgrid/shared";

export type VisibleEncounterSubroutine = NonNullable<
  NonNullable<VisibleCard["effectiveRunQuote"]>["subroutines"][number]
>;

export function isImmediateSafetyThreatSubroutine(
  subroutine: VisibleEncounterSubroutine,
): boolean {
  const type = subroutine.type.toLowerCase();
  return (
    type === "do_damage" ||
    type === "give_runner_tag" ||
    type === "initiate_trace" ||
    type === "trash_installed_program" ||
    type === "trash_program_unless_runner_pays" ||
    type === "trash_installed_program_unless_runner_pays" ||
    subroutine.unbrokenRunEffect?.causesDamageOrProgramTrash === true
  );
}

export function isEndRunSubroutine(
  subroutine: VisibleEncounterSubroutine,
): boolean {
  return (
    subroutine.type === "end_the_run" ||
    subroutine.type === "end_the_run_unless_runner_pays"
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
