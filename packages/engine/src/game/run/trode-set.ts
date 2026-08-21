import type {
  CardDefinition,
  GameState,
  SubroutineDefinition,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { definitionFor } from "../state/card-server-lookup";

export function runnerHasTrodeSet(state: GameState): boolean {
  return state.runner.rig.hardware.some(
    (cardId) =>
      cardImplementationForDefinitionId(definitionFor(state, cardId).id)
        ?.runnerUtilityLongtail?.kind === "access_point_subroutine_modifier",
  );
}

export function trodeSetIgnoresSubroutine(
  state: GameState,
  iceDefinition: CardDefinition,
  subroutine: SubroutineDefinition,
): boolean {
  if (
    !runnerHasTrodeSet(state) ||
    !iceDefinition.subtypes.some((subtype) => subtype.toLowerCase() === "ap")
  )
    return false;
  if (subroutine.type === "initiate_trace") return false;
  return !(
    (subroutine.type === "do_damage" || subroutine.type === "random_damage") &&
    (subroutine.damageType ?? "net") === "net"
  );
}

export function subroutineIsUnavailable(
  run: NonNullable<GameState["run"]>,
  index: number,
): boolean {
  return (
    run.brokenSubroutineIndexes.includes(index) ||
    run.resolvedSubroutineIndexes.includes(index) ||
    (run.ignoredSubroutineIndexes ?? []).includes(index)
  );
}
