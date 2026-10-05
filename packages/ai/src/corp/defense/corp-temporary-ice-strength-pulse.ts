import type {
  AiDecisionInput,
  CorpTemporaryIceStrengthPulseQuote,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import {
  assessKnownRezzedIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
} from "../../visible-run-analysis";
import { quoteCorpRemotePath } from "../../runtime/corp-remote-maturity-assessment";
import { readKnownCorpCentralAgendaThreat } from "./corp-central-defense-facts-adapter";
import type { CorpRunDefenseAbilityAssessment } from "./defense-runtime-types";

/** Defense owns the exact current pulse and its source-rez preparation.
 * Strength and payment come from the Engine; no duplicated doubling rule. */
export function assessCorpTemporaryIceStrengthPulse(
  input: AiDecisionInput,
  action: LegalAction,
): CorpRunDefenseAbilityAssessment | undefined {
  const source = input.playerView.servers
    .flatMap((s) => s.root)
    .find((c) => c.instanceId === action.source);
  const planning =
    source?.definitionId &&
    cardSpecPlanningCardByDefinitionId(source.definitionId)?.planning;
  const pulse =
    planning &&
    (planning.engine.abilities ?? []).some(
      (a) =>
        a.kind === "activated" &&
        a.effects.length === 1 &&
        a.effects[0]?.kind === "double_chosen_ice_strength_until_end_of_turn",
    );
  if (
    !pulse ||
    action.side !== "corp" ||
    !["rez_card", "activated_card_ability"].includes(action.type)
  )
    return undefined;
  const fail = (): never => {
    throw new PlanResolutionFailure("missing_action_semantics", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((a) => a.type),
      unresolvedActionIds: [action.actionId],
      owner: "rules_contract",
      removalCondition:
        "Supply a complete current action/source/target-bound Engine temporary ICE strength pulse quote or explicit incomplete projection.",
    });
  };
  let q: CorpTemporaryIceStrengthPulseQuote;
  const raw = action.payload?.corpTemporaryIceStrengthPulseQuoteJson;
  try {
    q = typeof raw === "string" ? JSON.parse(raw) : fail();
  } catch {
    return fail();
  }
  const nonnegative = (n: unknown): n is number =>
    typeof n === "number" && Number.isSafeInteger(n) && n >= 0;
  const actionCredits = action.costs.reduce((n, c) => n + (c.credits ?? 0), 0);
  if (
    !q ||
    q.schemaVersion !== 1 ||
    input.side !== "corp" ||
    q.actionId !== action.actionId ||
    q.stateVersion !== input.playerView.stateVersion ||
    action.expiresAtStateVersion !== q.stateVersion ||
    action.timingPoint !== input.playerView.timingPoint ||
    q.turnSerial !== input.playerView.turnSerial ||
    q.sourceCardInstanceId !== action.source ||
    q.sourceDefinitionId !== source!.definitionId ||
    q.sourceTrashed !== true ||
    q.expires !== "turn_end" ||
    q.kind !== (action.type === "rez_card" ? "prepare_rez" : "activate") ||
    !nonnegative(q.pulseCredits) ||
    !nonnegative(q.sourceRezCredits) ||
    (action.type === "rez_card"
      ? q.sourceRezCredits !== actionCredits
      : q.sourceRezCredits !== 0 ||
        q.pulseCredits !== actionCredits ||
        q.capabilityKey !== action.payload?.cardImplementationAbilityKey ||
        action.payload?.cardImplementationTrashSourceCost !== true ||
        q.targetIceInstanceId !== action.payload?.targetCardId)
  )
    return fail();
  const reject = (reason: string): CorpRunDefenseAbilityAssessment => ({
    productive: false,
    serverId:
      q.targetServerId ?? input.playerView.run?.attackedServerId ?? "unknown",
    value: 0,
    evidenceCode: `corp_temporary_ice_strength_pulse_${reason}:${action.actionId}`,
  });
  if (q.complete === false) {
    if (typeof q.reason !== "string" || q.reason.length === 0) return fail();
    return reject(q.reason);
  }
  const run = input.playerView.run;
  const target = input.playerView.servers.find(
    (s) => s.id === q.targetServerId,
  );
  const currentIce =
    run?.position?.kind === "ice" &&
    target &&
    run.position.serverId === target.id
      ? target.ice[run.position.iceIndex]
      : undefined;
  const validIce = (ice: VisibleCard) =>
    ice?.known === true &&
    ice.rezzed === true &&
    ice.type === "ice" &&
    ice.instanceId === q.targetIceInstanceId &&
    ice.definitionId === currentIce?.definitionId &&
    ice.effectiveRunQuote?.iceInstanceId === ice.instanceId &&
    ice.effectiveRunQuote.iceDefinitionId === ice.definitionId &&
    nonnegative(ice.effectiveRunQuote.effectiveStrength) &&
    Array.isArray(ice.effectiveRunQuote.subroutines);
  if (
    q.complete !== true ||
    !run ||
    input.playerView.timingPoint !== "run.approach_ice" ||
    !target ||
    run.attackedServerId !== target.id ||
    currentIce?.instanceId !== q.targetIceInstanceId ||
    !nonnegative(q.iceRezCredits) ||
    !nonnegative(q.corpCreditsAfterDefense) ||
    q.corpCreditsAfterDefense !==
      input.playerView.own.credits -
        q.sourceRezCredits -
        q.iceRezCredits -
        q.pulseCredits ||
    q.corpAgendaPointsAfterDefense !== input.playerView.own.agendaPoints ||
    !validIce(q.beforeIce) ||
    !validIce(q.afterIce)
  )
    return fail();
  const terminal =
    target.id === "hq" || target.id === "rd"
      ? readKnownCorpCentralAgendaThreat({ input, serverId: target.id })
          ?.threat === "terminal"
      : target.root
          .filter(
            (c) =>
              c.known &&
              c.type === "agenda" &&
              c.definitionId &&
              !cardSpecPlanningCardByDefinitionId(c.definitionId)?.planning
                .engine.agendaAccessReplacement,
          )
          .reduce((n, c) => n + (c.agendaPoints ?? 0), 0) +
          input.playerView.opponent.agendaPoints >=
        input.playerView.agendaPointsToWin;
  if (!terminal) return reject("has_no_known_current_terminal_agenda");
  const rig = input.playerView.opponent.rig ?? [];
  const budget = () =>
    runnerRunPathCreditBudgetWithVisiblePools(
      input.playerView.opponent.credits + (run.badPublicityCredits ?? 0),
      rig,
      { liquidCredits: input.playerView.opponent.credits },
    );
  const discarded = new Set(
    input.playerView.own.heapOrArchives.map((c) => c.instanceId),
  );
  const root = target.root.filter(
    (c) => !discarded.has(c.instanceId) && c.instanceId !== action.source,
  );
  const before = quoteCorpRemotePath({
    assessment: assessKnownRezzedIcePath(
      [q.beforeIce],
      rig,
      budget(),
      root,
      input.playerView.own.credits - q.sourceRezCredits - q.iceRezCredits,
    ),
    expectedKnownIceCount: 1,
    runnerCreditBudgetBefore: budget(),
  });
  const after = assessKnownRezzedIcePath(
    [q.afterIce],
    rig,
    budget(),
    root,
    q.corpCreditsAfterDefense,
  );
  if (
    before.accessStatus !== "reachable" ||
    after.blocked !== true ||
    after.canReachAccess !== false ||
    after.noAccessReason !== "known_path_unpayable" ||
    after.hasBypassOrSpecialAccessPlan ||
    (after.conditionalAccessReasons?.length ?? 0) > 0
  )
    return reject("does_not_prove_current_terminal_access_block");
  return {
    productive: true,
    serverId: target.id,
    value: 1000,
    evidenceCode: `corp_temporary_ice_strength_pulse_blocks_current_terminal_agenda_exposure:${target.id}:${q.targetIceInstanceId}:${action.actionId}`,
  };
}
