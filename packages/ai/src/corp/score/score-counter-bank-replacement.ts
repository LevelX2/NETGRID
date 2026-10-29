import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { readCorpCounterBankPreparationQuote } from "../../plans/corp-counter-bank-preparation-quote";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { corpSameTurnScoreConversionPaths } from "../../plans/tactical-plan-corp-score-conversion";

/** Preserve the exact admitted installation, salvaging only its free doomed counters. */
export function withCorpCounterBankReplacementPreparation(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  project: CorpScoreProjectSignal,
): CorpScoreProjectSignal {
  if (
    input.side !== "corp" ||
    input.playerView.activeSide !== "corp" ||
    input.playerView.timingPoint !== "corp_action.main" ||
    project.phase !== "install_agenda" ||
    !project.feasible ||
    (project.terminalScore && project.sameTurnCloseout) ||
    (project.fundingMilestone?.remainingGap ?? project.fundingGap ?? 0) > 0 ||
    !project.agendaInstanceId ||
    !project.serverId ||
    project.actionIds?.length !== 1
  )
    return project;

  const current = (actionId: string) =>
    input.legalActions.find(
      (action) =>
        action.actionId === actionId &&
        action.side === "corp" &&
        action.expiresAtStateVersion === input.playerView.stateVersion &&
        action.timingPoint === input.playerView.timingPoint,
    );
  const install = current(project.actionIds[0]!);
  const root = input.playerView.servers.find(
    (server) => server.id === project.serverId,
  )?.root;
  if (
    install?.type !== "install_card" ||
    install.source !== project.agendaInstanceId ||
    install.payload?.cardId !== project.agendaInstanceId ||
    install.payload?.serverId !== project.serverId ||
    install.payload?.placement !== "root" ||
    install.payload?.rootReplacement !== "asset_to_agenda" ||
    root?.length !== 1
  )
    return project;
  const card = root[0]!;
  const quote = readCorpCounterBankPreparationQuote(
    input,
    card,
    "installed_root",
    project.serverId,
  );
  if (
    !quote ||
    !card.definitionId ||
    quote.advancementCounters === 0 ||
    corpSameTurnScoreConversionPaths(input).some(
      (path) => (path.reservedAdvancementCounters[card.instanceId] ?? 0) > 0,
    )
  )
    return project;

  const head = candidates.find((candidate) => {
    const action = current(candidate.actionId);
    if (
      !action ||
      action.source !== card.instanceId ||
      action.payload?.cardId !== card.instanceId ||
      candidate.sourceCardInstanceId !== card.instanceId ||
      candidate.sourceDefinitionId !== card.definitionId ||
      action.costs.some((cost) =>
        Object.entries(cost).some(
          ([key, value]) =>
            (key !== "clicks" && key !== "credits") || value !== 0,
        ),
      )
    )
      return false;
    return card.rezzed === true
      ? candidate.semanticActionType === "economy.gain_credit" &&
          action.type === "activated_card_ability" &&
          action.payload?.cardImplementationAdvancementCounterCost ===
            quote.cashout.advancementCounterCost &&
          action.payload?.gainCreditsAmount === quote.cashout.creditGain
      : candidate.semanticActionType === "corp_window.rez" &&
          action.type === "rez_card";
  });
  if (!head) return project;
  return {
    ...project,
    phase:
      card.rezzed === true
        ? "liquidate_counter_bank"
        : "rez_counter_bank_for_liquidation",
    actionIds: [head.actionId],
    counterBankReplacement: {
      installActionId: install.actionId,
      stateVersion: input.playerView.stateVersion,
    },
    counterBank: {
      sourceCardInstanceId: card.instanceId,
      sourceDefinitionId: card.definitionId,
      serverId: project.serverId,
      advancementCounters: quote.advancementCounters,
      counterTarget: 0,
      quoteStateVersion: quote.expiresAtStateVersion,
    },
    evidenceCode: `corp_score_free_counter_salvage_before_exact_replacement:${card.instanceId}:${install.actionId}`,
  };
}
