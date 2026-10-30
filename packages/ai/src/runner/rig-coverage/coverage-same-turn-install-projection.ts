import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { runnerInstalledProgramTrashLoss } from "../../runtime/runner-installed-program";
import {
  runnerVisibleBreakerUpgradeInstallRoute,
  runnerVisibleBreakerUpgradeMemoryBlockedInstallRoute,
} from "./coverage-breaker-upgrades";
import type { RunnerCoverageServices } from "./coverage-services";

/** Reuse the installation owner's sufficient acceptable sacrifice set. */
export function runnerSameTurnInstallProjection(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  card: VisibleCard,
  services: Pick<RunnerCoverageServices, "assessProgramInstallTarget">,
) {
  const { memoryUsed, memoryLimit } = input.playerView.own;
  if (
    !Number.isSafeInteger(card.memoryCost) ||
    card.memoryCost! < 0 ||
    !Number.isSafeInteger(memoryUsed) ||
    !Number.isSafeInteger(memoryLimit)
  )
    return undefined;
  const rig = input.playerView.own.rig ?? [];
  const deficit = memoryUsed! + card.memoryCost! - memoryLimit!;
  if (deficit <= 0) {
    const install = runnerVisibleBreakerUpgradeInstallRoute(
      input,
      candidates,
      card,
    );
    return install
      ? {
          install,
          rig: [...rig, card],
          memoryUsed: memoryUsed! + card.memoryCost!,
          removedIds: [] as string[],
        }
      : undefined;
  }
  const install = runnerVisibleBreakerUpgradeMemoryBlockedInstallRoute(
    input,
    candidates,
    card,
  );
  if (!install) return undefined;
  const assessment = services.assessProgramInstallTarget(input, card);
  if (
    !assessment.memoryRequired ||
    assessment.requiredMemoryToFree !== deficit ||
    !assessment.canFreeRequiredMemory ||
    assessment.selectedCandidates.length === 0 ||
    assessment.selectedCandidates.some((c) => !c.acceptable || !c.card) ||
    assessment.memoryFreedBySelectedCandidates < deficit
  )
    return undefined;
  const lostIds = new Set<string>();
  let freed = 0;
  for (const selected of assessment.selectedCandidates) {
    const loss = runnerInstalledProgramTrashLoss(
      input,
      selected.card,
      (c) => c.memoryCost!,
    );
    // Overlapping host closures cannot be added as independent MU payments.
    if (
      loss.cards.some((c) => lostIds.has(c.instanceId)) ||
      loss.cards.some((c) => (c.memoryLimitBonus ?? 0) !== 0) ||
      loss.memoryCost !== selected.memoryCost
    )
      return undefined;
    for (const entry of loss.cards) lostIds.add(entry.instanceId);
    freed += loss.memoryCost;
  }
  if (
    freed !== assessment.memoryFreedBySelectedCandidates ||
    freed > memoryUsed!
  )
    return undefined;
  return {
    install,
    rig: [...rig.filter((c) => !lostIds.has(c.instanceId)), card],
    memoryUsed: memoryUsed! - freed + card.memoryCost!,
    removedIds: [...lostIds],
  };
}
