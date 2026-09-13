import type { VisibleCard } from "@netgrid/shared";

/** Apply the Engine's encounter-boundary fact. No card-rule reconstruction. */
export function runnerRigAfterEncounter(
  rig: readonly VisibleCard[],
): VisibleCard[] {
  return rig.map((card) =>
    card.strengthAfterEncounter !== undefined
      ? { ...card, strength: card.strengthAfterEncounter }
      : card,
  );
}
