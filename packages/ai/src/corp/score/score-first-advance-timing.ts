import { isRemoteServerId, type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { actionMatchesCurrentDecision } from "../../actions/current-legal-action";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { requireVisibleAgendaAdvancementRequirement } from "../../runtime/visible-agenda-facts";
import { corpExactCurrentBasicLiquidCreditCandidate } from "../economy/economy-domain-signals";
import { corpInstalledIceInteractionRezQuote } from "./corp-score-defense-continuity";
import { corpScorePriorityClass } from "./corp-score-priority";

/** Keep the score project open and delegate its last click to funding when
 * delaying the first marker buys an installed defense without changing the
 * earliest score turn on the fully funded basic advancement route.
 */
export function withCorpFirstAdvanceRezFunding(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  project: CorpScoreProjectSignal,
): CorpScoreProjectSignal {
  const view = input.playerView;
  const own = view.own;
  const serverId = project.serverId;
  if (
    input.side !== "corp" ||
    view.activeSide !== "corp" ||
    view.timingPoint !== "corp_action.main" ||
    own.clicks !== 1 ||
    own.corpEndTurnCreditObligation ||
    (own.installRezOnlyCredits ?? 0) > 0 ||
    project.phase !== "advance_agenda" ||
    !project.feasible ||
    corpScorePriorityClass(project) !== "P4" ||
    project.terminalScore ||
    project.terminalDefense ||
    project.lastDrawScoreSurvival ||
    project.conversion?.runnerStealIsMatchpoint !== false ||
    (project.fundingGap ?? 0) !== 0 ||
    project.sameTurnFundingActionIds !== undefined ||
    project.actionIds?.length !== 1 ||
    serverId === undefined ||
    !isRemoteServerId(serverId)
  )
    return project;

  // The public journal redacts the card identity. The immediate, live
  // installation event plus a sole root card binds it without unmasking it.
  const installation = input.eventTail.at(-1);
  if (
    installation?.type !== "install_card" ||
    installation.stateVersionAfter !== view.stateVersion ||
    installation.turnSerial !== view.turnSerial ||
    installation.publicPayload.actor !== "corp" ||
    installation.publicPayload.serverId !== serverId ||
    installation.publicPayload.installPlacement !== "root"
  )
    return project;
  const server = view.servers.find((entry) => entry.id === serverId);
  const agenda = server?.root.length === 1 ? server.root[0] : undefined;
  if (
    !server ||
    !agenda?.known ||
    agenda.type !== "agenda" ||
    agenda.instanceId !== project.agendaInstanceId ||
    agenda.rezzed !== false ||
    agenda.publiclyExposedInRoot ||
    agenda.advancementCounters !== 0
  )
    return project;

  const advance = input.legalActions.find(
    (action) => action.actionId === project.actionIds?.[0],
  );
  if (
    !actionMatchesCurrentDecision(input, advance) ||
    advance.type !== "advance_card" ||
    advance.source !== agenda.instanceId ||
    advance.costs.length !== 1 ||
    advance.costs[0]?.clicks !== 1 ||
    advance.costs[0]?.credits !== 1 ||
    advance.targetRequirements.length !== 0 ||
    (advance.choiceRequirements?.length ?? 0) !== 0
  )
    return project;

  const protection = project.protectionNeed;
  const baseline = protection?.baseline;
  if (
    protection?.parentProjectId !== project.projectId ||
    protection.targetServerId !== serverId ||
    protection.observedAtStateVersion !== view.stateVersion ||
    baseline?.knowledge !== "known" ||
    baseline.protection.protectsScore ||
    !baseline.preservesScoreCreditReserve ||
    baseline.availableCorpCredits !== own.credits
  )
    return project;

  const futureClicks = own.corpFutureFlexibleClicks;
  if (
    !futureClicks?.every(
      (clicks) => Number.isSafeInteger(clicks) && clicks >= 0,
    )
  )
    return project;
  const [nextClicks, followingClicks] = futureClicks;
  const remaining = requireVisibleAgendaAdvancementRequirement(input, agenda);
  const scoreTurnOffset = remaining <= nextClicks ? 1 : 2;
  if (
    remaining <= 1 ||
    remaining > nextClicks + followingClicks ||
    remaining === nextClicks + 1 ||
    own.stackOrRdCount < scoreTurnOffset
  )
    return project;

  // Both lines reserve the full current price of this agenda, any funded
  // central protection and the post-score floor. One line pays part of that
  // reserve now; the other leaves the reserve intact and earns a credit.
  const spareCredits = own.credits - baseline.totalScoreReserveCredits;
  if (spareCredits < 0) return project;
  const newlyAffordableIce = server.ice.find((ice) => {
    const rez = corpInstalledIceInteractionRezQuote(input, ice, serverId);
    return rez?.costKind === "fixed" && rez.finalCredits === spareCredits + 1;
  });
  if (!newlyAffordableIce) return project;
  const funding = candidates.find(
    (candidate) =>
      corpExactCurrentBasicLiquidCreditCandidate(input, candidate) &&
      input.legalActions.some(
        (action) =>
          action.actionId === candidate.actionId &&
          action.payload?.gainCreditsAmount === 1,
      ),
  );
  if (!funding) return project;

  return {
    ...project,
    fundingGap: 1,
    sameTurnFundingActionIds: [funding.actionId],
    routeAssessment: "corp_first_advance_waits_for_rez_reserve",
    evidenceCode: `corp_first_advance_waits_for_rez_reserve:${newlyAffordableIce.instanceId}:${spareCredits + 1}:score_turn_plus_${scoreTurnOffset}`,
  };
}
