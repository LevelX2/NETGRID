import type { AiDecisionInput } from "@netgrid/shared";
import { recentlyCompromisedCorpRemoteIds } from "../../plans/corp-opponent-campaign-continuity";
import type { ScoreState } from "../../plans/corp-core-plan-contracts";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import type { PlanSchedulerResult } from "../../plans/plan-scheduler";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { requireVisibleAgendaAdvancementRequirement } from "../../runtime/visible-agenda-facts";
import type { CorpCentralDefenseAllocation } from "../defense/corp-central-defense-allocation";
import { corpExactCurrentBasicLiquidCreditAction } from "../economy/economy-domain-signals";
import { corpInstalledIceInteractionRezQuote } from "./corp-score-defense-continuity";
import {
  corpDeferredAdvanceCentralExposureAllows,
  corpHasExactBasicAdvance,
} from "./score-first-advance-timing";

/** Remember the selected Economy child on its Score campaign across the Runner
 * turn. The next live quote requires the Engine's actual funding event.
 */
export function bindSelectedCorpDeferredAdvanceWindow(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
): void {
  if (input.side !== "corp" || result.lane !== "plan") return;
  const executor = result.portfolio.instances.find(
    (instance) => instance.instanceId === result.route.planInstanceId,
  );
  if (executor?.moduleId !== "corp.economy" || !executor.parentInstanceId)
    return;
  const root = result.portfolio.instances.find(
    (instance) => instance.instanceId === executor.parentInstanceId,
  );
  if (root?.moduleId !== "corp.score_agenda") return;
  const state = root.moduleState as ScoreState;
  const project = state.signal;
  const window = project.deferredAdvanceWindow;
  if (
    !window ||
    window.selectedAtStateVersion !== input.playerView.stateVersion
  )
    return;
  const action = input.legalActions.find(
    (entry) => entry.actionId === result.route.head.actionId,
  );
  const campaign = result.portfolio.campaigns?.find(
    (entry) => entry.origin.rootPlanInstanceId === root.instanceId,
  );
  if (
    !campaign ||
    !action ||
    !project.sameTurnFundingActionIds?.includes(action.actionId) ||
    executor.parentNeedId !== `score-support:${project.projectId}` ||
    !corpExactCurrentBasicLiquidCreditAction(input, action) ||
    action.payload?.gainCreditsAmount !== 1
  )
    throw new PlanResolutionFailure("invalid_support_graph", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((entry) => entry.type),
      planInstanceId: root.instanceId,
      owner: "plan_module",
      removalCondition:
        "Bind the first-advance window to the selected basic-credit child of its resident Score campaign.",
    });
  campaign.deferredAdvanceWindow = window;
}

/** Preserve a still-executable two-turn score on the first Corp turn after
 * its funding click. Discovery revalidates the budget after each legal action.
 * The normal same-turn score route takes over on the actual deadline.
 */
export function withCorpDeferredAdvanceBudget(
  input: AiDecisionInput,
  project: CorpScoreProjectSignal,
  previous: ResidentPlanPortfolio | undefined,
  centralDefenseAllocation: CorpCentralDefenseAllocation,
): CorpScoreProjectSignal {
  const view = input.playerView;
  if (
    view.activeSide !== "corp" ||
    view.timingPoint !== "corp_action.main" ||
    view.turnSerial === undefined ||
    view.own.corpEndTurnCreditObligation ||
    (view.own.installRezOnlyCredits ?? 0) > 0 ||
    view.own.stackOrRdCount < 1 ||
    project.phase !== "advance_agenda" ||
    project.sameTurnCloseout ||
    !project.feasible ||
    project.terminalScore ||
    project.terminalDefense ||
    project.lastDrawScoreSurvival ||
    project.conversion?.runnerStealIsMatchpoint !== false ||
    (project.fundingGap ?? 0) > 0 ||
    !corpDeferredAdvanceCentralExposureAllows(centralDefenseAllocation) ||
    !corpHasExactBasicAdvance(input, project)
  )
    return project;
  const campaign = previous?.campaigns?.find(
    (entry) =>
      entry.kind === "agenda" &&
      entry.identity.objectiveKey === project.projectId &&
      entry.origin.targetCardInstanceId === project.agendaInstanceId &&
      entry.origin.targetServerId === project.serverId,
  );
  const window = campaign?.deferredAdvanceWindow;
  if (
    !window ||
    view.turnSerial !== window.selectedOnTurnSerial + 2 ||
    view.turnSerial + 2 !== window.scoreByTurnSerial ||
    !input.eventTail.some(
      (event) =>
        event.stateVersionBefore === window.selectedAtStateVersion &&
        event.stateVersionAfter === window.selectedAtStateVersion + 1 &&
        event.turnSerial === window.selectedOnTurnSerial &&
        event.type === "gain_credit" &&
        event.publicPayload.actor === "corp" &&
        event.publicPayload.gainCreditsAmount === 1,
    )
  )
    return project;

  const serverId = project.serverId;
  const server = view.servers.find((entry) => entry.id === serverId);
  const agenda = server?.root.find(
    (card) => card.instanceId === project.agendaInstanceId,
  );
  const ice = server?.ice.find(
    (card) => card.instanceId === window.defenseIceInstanceId,
  );
  if (
    !serverId ||
    !agenda?.known ||
    !ice ||
    requireVisibleAgendaAdvancementRequirement(input, agenda) !==
      window.agendaRequirement ||
    campaign.publicOutcomes.some(
      (event) =>
        event.kind === "remote_compromised" &&
        event.stateVersionAfter > window.selectedAtStateVersion,
    ) ||
    recentlyCompromisedCorpRemoteIds(
      input,
      window.selectedAtStateVersion,
    ).includes(serverId)
  )
    return project;
  const need = project.protectionNeed;
  const baseline = need?.baseline;
  const nextClicks = view.own.corpFutureFlexibleClicks?.[0];
  const remaining = project.conversion.remainingAdvancementClicks + 1;
  if (
    need?.observedAtStateVersion !== view.stateVersion ||
    need.targetServerId !== serverId ||
    need.parentProjectId !== project.projectId ||
    baseline?.knowledge !== "known" ||
    baseline.availableCorpCredits !== view.own.credits ||
    !baseline.preservesScoreCreditReserve ||
    baseline.totalScoreReserveCredits < remaining ||
    nextClicks === undefined ||
    !Number.isSafeInteger(nextClicks) ||
    nextClicks < 0
  )
    return project;
  const rez = corpInstalledIceInteractionRezQuote(input, ice, serverId);
  const rezCredits = ice.rezzed
    ? 0
    : rez?.costKind === "fixed"
      ? rez.finalCredits
      : undefined;
  if (rezCredits === undefined) return project;
  const requiredCredits =
    baseline.totalScoreReserveCredits +
    Math.max(rezCredits, baseline.totalSelectedRezCost);
  const advancesDue = Math.max(0, remaining - nextClicks);
  if (requiredCredits > view.own.credits || advancesDue > view.own.clicks)
    return project;

  return {
    ...project,
    deferredAdvanceBudget: { advancesDue, requiredCredits },
    deadlinePressure: project.deadlinePressure || advancesDue > 0,
    evidenceCode: `corp_deferred_advance_progress:${serverId}:${advancesDue}:${requiredCredits}`,
  };
}
