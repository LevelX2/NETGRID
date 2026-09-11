import type { VisibleCard } from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";

/** A public hypothetical install, never an authorization to execute it. */
export function visibleProgramHostInstallVariants(
  program: VisibleCard,
  rig: readonly VisibleCard[],
):
  | { complete: true; cards: VisibleCard[] }
  | { complete: false; reason: string } {
  if (
    !program.known ||
    program.type !== "program" ||
    !program.definitionId ||
    !Number.isSafeInteger(program.memoryCost) ||
    program.memoryCost! < 0
  ) {
    return { complete: false, reason: "invalid_public_program" };
  }
  if (program.subtypes?.includes("daemon"))
    return { complete: true, cards: [] };
  const cards: VisibleCard[] = [];
  for (const host of rig) {
    if (!host.known) return { complete: false, reason: "unknown_public_host" };
    if (
      !host.definitionId ||
      host.hostedOn ||
      (host.type !== "program" && host.type !== "hardware")
    )
      continue;
    const implementation = cardImplementationForDefinitionId(host.definitionId);
    const capacity = implementation?.hostedProgramCapacity;
    if (
      !capacity?.hostedProgramsAreInstalled ||
      !capacity.allowedCardTypes.includes("program")
    )
      continue;
    if (
      capacity.allowedProgramSubtypes?.length &&
      !capacity.allowedProgramSubtypes.some((subtype) =>
        program.subtypes?.includes(subtype),
      )
    )
      continue;
    const hosted = rig.filter((card) => card.hostedOn === host.instanceId);
    if (
      hosted.some(
        (card) =>
          !Number.isSafeInteger(card.memoryCost) || card.memoryCost! < 0,
      )
    ) {
      return { complete: false, reason: "unknown_host_occupancy" };
    }
    if (
      (capacity.maxHostedPrograms !== undefined &&
        hosted.length >= capacity.maxHostedPrograms) ||
      hosted.reduce((sum, card) => sum + card.memoryCost!, 0) +
        program.memoryCost! >
        capacity.capacityMu
    )
      continue;
    const strengthChange = program.subtypes?.includes("icebreaker")
      ? (implementation?.hostedProgramModifiers ?? []).reduce(
          (sum, modifier) =>
            modifier.kind === "icebreaker_strength" &&
            modifier.appliesTo === "hosted_icebreakers"
              ? sum +
                Math.max(0, Math.floor(modifier.amount)) *
                  (modifier.operation === "reduce" ? -1 : 1)
              : sum,
          0,
        )
      : 0;
    if (strengthChange !== 0 && !Number.isFinite(program.strength)) {
      return { complete: false, reason: "unknown_hosted_strength" };
    }
    cards.push({
      ...program,
      hostedOn: host.instanceId,
      ...(program.strength !== undefined
        ? { strength: Math.max(0, program.strength + strengthChange) }
        : {}),
    });
  }
  return { complete: true, cards };
}
