import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { CorpGenericDefenseSignal } from "../../plans/corp-defense-contracts";
import { corpArchivesToHqOperationProfile } from "../../runtime/corp-canonical-card-facts";
import { corpScorelineFeasibilityForDecisionInput } from "../../runtime/corp-scoreline-feasibility";
import { allocateCorpCentralDefenseFromAiFacts } from "./corp-central-defense-facts-adapter";

/** A bounded relocation, not arbitrary Archives recovery: remove the only
 * agenda from an open Archives without creating an equal or larger HQ risk. */
export function corpArchivesAgendaRelocationSignal(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): CorpGenericDefenseSignal | undefined {
  if (
    input.side !== "corp" ||
    input.playerView.activeSide !== "corp" ||
    input.playerView.timingPoint !== "corp_action.main" ||
    candidate.actionType !== "play_operation" ||
    !candidate.sourceCardInstanceId ||
    !candidate.sourceDefinitionId
  ) return undefined;
  const profile = corpArchivesToHqOperationProfile(candidate.sourceDefinitionId);
  if (profile?.maxSelections !== 1 || profile.filterCardType !== undefined)
    return undefined;
  const view = input.playerView;
  const archives = view.servers.find(s => s.id === "archives");
  const agendas = view.own.heapOrArchives.filter(c => c.known && c.type === "agenda");
  const source = view.own.gripOrHq.find(c => c.instanceId === candidate.sourceCardInstanceId);
  const action = input.legalActions.find(a => a.actionId === candidate.actionId);
  if (!archives || archives.ice.length !== 0 ||
    archives.statuses?.some(s => s.kind === "run_prohibited") === true || agendas.length !== 1 ||
    !source?.known || source.definitionId !== candidate.sourceDefinitionId ||
    action?.side !== "corp" || action.type !== "play_operation" ||
    action.source !== source.instanceId || action.expiresAtStateVersion !== view.stateVersion ||
    action.costs.some(c => Object.keys(c).some(k => k !== "credits" && k !== "clicks")))
    return undefined;
  const target = agendas[0]!;
  const points = target.agendaPoints;
  if (!target.definitionId || !Number.isSafeInteger(points) || points! <= 0 ||
    view.opponent.agendaPoints + points! < view.agendaPointsToWin ||
    !action.costs.every(c => [c.credits ?? 0,c.clicks ?? 0].every(n => Number.isSafeInteger(n) && n >= 0)))
    return undefined;
  const credits = action.costs.reduce((n,c) => n + (c.credits ?? 0),0);
  const clicks = action.costs.reduce((n,c) => n + (c.clicks ?? 0),0);
  if (credits !== 0 || clicks > view.own.clicks || clicks <= 0 ||
    view.own.gripOrHq.length > view.own.maxHandSize) return undefined;
  const projected = {
    ...view,
    own: {
      ...view.own,
      credits: view.own.credits - credits,
      clicks: view.own.clicks - clicks,
      gripOrHq: [...view.own.gripOrHq.filter(c => c.instanceId !== source.instanceId),target],
      heapOrArchives: [...view.own.heapOrArchives.filter(c => c.instanceId !== target.instanceId),{...source,rezzed:true}],
    },
    servers:view.servers.map(s => s.id === "archives" ? {
      ...s,root:[...s.root.filter(c => c.instanceId !== target.instanceId),{...source,rezzed:true}],
    } : s),
  };
  const horizonBefore = corpScorelineFeasibilityForDecisionInput(input);
  const horizonAfter = corpScorelineFeasibilityForDecisionInput({...input,playerView:projected});
  if (!horizonBefore || !horizonAfter ||
    horizonBefore.currentTurnClosableActionIds.some(id =>
      !horizonAfter.currentTurnClosableActionIds.includes(id))) return undefined;
  const before = allocateCorpCentralDefenseFromAiFacts({input});
  const after = allocateCorpCentralDefenseFromAiFacts({input:{...input,playerView:projected}});
  if (before.status !== "known" || after.status !== "known") return undefined;
  const b = before.evidence.hq.expectedAgendaLoss;
  const a = after.evidence.hq.expectedAgendaLoss;
  const br = before.evidence.rd.expectedAgendaLoss;
  const ar = after.evidence.rd.expectedAgendaLoss;
  // Current ICE and installed support are unchanged. Only the canonically
  // recovered own card, spent source and exact legal costs are projected.
  const afterNumerator = BigInt(a.numerator)*BigInt(ar.denominator) +
    BigInt(ar.numerator)*BigInt(a.denominator);
  const beforeDenominator = BigInt(b.denominator)*BigInt(br.denominator);
  const beforeNumerator = BigInt(b.numerator)*BigInt(br.denominator) +
    BigInt(br.numerator)*BigInt(b.denominator) + BigInt(points!)*beforeDenominator;
  if (afterNumerator*beforeDenominator >=
    beforeNumerator*BigInt(a.denominator)*BigInt(ar.denominator)) return undefined;
  return {
    kind:"generic",
    defenseId:"archives-agenda-relocation:"+source.instanceId+":"+target.instanceId,
    serverId:"archives",
    phase:"recover_exposed_agenda",
    sourceDefinitionIds:[source.definitionId!],
    actionIds:[action.actionId],
    urgent:true,
    centralPressure:"terminal",
    archivesRecovery:{stateVersion:view.stateVersion,sourceCardId:source.instanceId,recoveredCardId:target.instanceId},
    value:12,
    evidenceCode:"corp_exact_archives_agenda_relocation_reduces_terminal_exposure",
  };
}
