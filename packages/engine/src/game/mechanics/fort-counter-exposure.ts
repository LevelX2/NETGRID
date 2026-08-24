import type { CardDefinitionId, GameState, ServerId } from "@netgrid/shared";
import type { CardRunnerUtilityLongtailImplementation } from "../../ability-engine/definition-types";
import {
  CARD_IMPLEMENTATIONS,
  cardImplementationForDefinitionId,
} from "../../card-implementations/registry";
import { counterAmountMeetsThreshold } from "../counters/counter-thresholds";

export type FortCounterExposeImplementation = Extract<
  CardRunnerUtilityLongtailImplementation,
  { kind: "successful_run_fort_counter_expose" }
>;

export function fortCounterExposeImplementationForDefinition(
  definitionId: CardDefinitionId,
): FortCounterExposeImplementation | undefined {
  const implementation =
    cardImplementationForDefinitionId(definitionId)?.runnerUtilityLongtail;
  return implementation?.kind === "successful_run_fort_counter_expose"
    ? implementation
    : undefined;
}

export function persistentFortCounterExposeImplementation(): FortCounterExposeImplementation {
  const implementations = Object.values(CARD_IMPLEMENTATIONS)
    .map((implementation) => implementation.runnerUtilityLongtail)
    .filter(
      (implementation): implementation is FortCounterExposeImplementation =>
        implementation?.kind === "successful_run_fort_counter_expose",
    );
  if (implementations.length !== 1)
    throw new Error(
      "Der persistente Fort-Counter-Expose-Vertrag muss eindeutig sein.",
    );
  return implementations[0]!;
}

export function assertFortCounterExposeImplementation(
  implementation: FortCounterExposeImplementation,
): void {
  if (
    implementation.timing !== "immediately_after_successful_run_on_that_fort" ||
    implementation.cost.kind !== "trash_source" ||
    implementation.counter.type !== "spy" ||
    implementation.counter.location !== "attacked_data_fort" ||
    implementation.counter.persistence !== "until_fort_collapses" ||
    !Number.isInteger(implementation.counter.amount) ||
    implementation.counter.amount <= 0 ||
    implementation.exposure.target !== "all_cards_inside_or_on_fort" ||
    implementation.exposure.duration !== "while_counter_present" ||
    !Number.isInteger(implementation.exposure.threshold) ||
    implementation.exposure.threshold <= 0 ||
    !Number.isInteger(implementation.corpRemoveAbility.clicks) ||
    implementation.corpRemoveAbility.clicks <= 0 ||
    !Number.isInteger(implementation.corpRemoveAbility.credits) ||
    implementation.corpRemoveAbility.credits < 0 ||
    !Number.isInteger(implementation.corpRemoveAbility.amount) ||
    implementation.corpRemoveAbility.amount <= 0
  )
    throw new Error("Der Fort-Counter-Expose-Vertrag ist ungueltig.");
}

export function persistentFortCounterExposureActive(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): boolean {
  const implementation = persistentFortCounterExposeImplementation();
  assertFortCounterExposeImplementation(implementation);
  return counterAmountMeetsThreshold(
    Math.max(0, Math.floor(state.spyCountersByServer?.[serverId] ?? 0)),
    implementation.exposure.threshold,
  );
}
