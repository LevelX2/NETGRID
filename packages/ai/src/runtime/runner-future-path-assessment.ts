import { visibleRunnerRunOnlyCredits } from "../run-analysis/visible-run-credit-budget";
import type {
  AiDecisionInput,
  VisibleEffectiveSubroutine,
} from "@netgrid/shared";
import { currentRunPathContext } from "../run-analysis/current-run-path-context";
import { subroutineOnlyAffectsNextEncounter } from "../run-analysis/visible-run-hazards";
import { runnerRigAfterEncounter } from "./runner-rig-after-encounter";
import { currentRunRemainingIce } from "./current-encounter";
import { serverBlocksStealthBitPayments } from "./server-target";
import {
  assessKnownRezzedIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
} from "../visible-run-analysis";

type UnbrokenRunEffectEntry = {
  effect: NonNullable<VisibleEffectiveSubroutine["unbrokenRunEffect"]>;
  subroutineType?: VisibleEffectiveSubroutine["type"];
};

export function currentRunFuturePathAssessment(
  input: AiDecisionInput,
  effects: UnbrokenRunEffectEntry[] = [],
): { blocked: boolean; visibleBreakCost?: number } {
  const run = input.playerView.run;
  if (!run || run.position?.kind !== "ice") return { blocked: false };
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === run.position?.serverId,
  );
  if (!server) return { blocked: false };
  const futureRig = runnerRigAfterEncounter(input.playerView.own.rig ?? []);
  const assessment = assessKnownRezzedIcePath(
    currentRunRemainingIce(input),
    futureRig,
    runnerRunPathCreditBudgetWithVisiblePools(
      input.playerView.own.credits +
        visibleRunnerRunOnlyCredits(input.playerView.run),
      futureRig,
      {
        liquidCredits: input.playerView.own.credits,
        excludeStealthCredits: serverBlocksStealthBitPayments(server),
      },
    ),
    server.root,
    input.playerView.opponent.credits,
    currentRunPathContext(input),
    effects.map(({ effect, subroutineType }) =>
      subroutineType &&
      subroutineOnlyAffectsNextEncounter({ type: subroutineType })
        ? { ...effect, expiresAfterNextEncounter: true }
        : effect,
    ),
  );
  return {
    blocked: assessment.blocked,
    ...(assessment.visibleBreakCost
      ? { visibleBreakCost: assessment.visibleBreakCost }
      : {}),
  };
}
