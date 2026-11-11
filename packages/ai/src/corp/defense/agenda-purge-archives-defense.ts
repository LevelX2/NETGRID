import {
  visibleRunnerNextTurnPreparationCreditGain,
  visibleRunnerPreparationIncomePerClick,
} from "@netgrid/engine";
import type { AiDecisionInput } from "@netgrid/shared";
import { assessCorpScoreProtection } from "../../runtime/corp-score-protection-assessment";
import { runnerStartOfTurnCreditProfile } from "../../runtime/runner-canonical-card-facts";

export function preferredAgendaPurgeArchivesOptions(
  input: AiDecisionInput,
  selectedOptionIds: readonly string[],
): { cardId: string; serverId: "archives"; optionId: string }[] | undefined {
  const view = input.playerView;
  const choice = view.pendingChoice;
  const quote = choice?.agendaPurgeArchivesProtectionQuote;
  if (
    input.side !== "corp" ||
    !choice ||
    !quote ||
    quote.choiceId !== choice.choiceId ||
    quote.stateVersion !== view.stateVersion
  )
    return undefined;
  const runnerRig = view.opponent.rig;
  const preparationClicks = view.runnerNextTurnCreditClicks;
  if (!runnerRig || preparationClicks === undefined) return undefined;

  const revealedAgenda = choice.options.find(
    (option) =>
      option.selectable === false &&
      option.card?.known === true &&
      option.card.type === "agenda" &&
      option.card.instanceId === quote.revealedAgendaId,
  )?.card;
  if (
    !revealedAgenda ||
    !Number.isSafeInteger(revealedAgenda.agendaPoints) ||
    view.opponent.agendaPoints + revealedAgenda.agendaPoints! <
      view.agendaPointsToWin
  )
    return undefined;
  const original = quote.packages.find(
    (entry) =>
      entry.optionIds.length === selectedOptionIds.length &&
      selectedOptionIds.every((id) => entry.optionIds.includes(id)),
  );
  const concentrated = quote.packages.find(
    (entry) => entry.archivesIce.length === choice.minSelections,
  );
  if (
    !original ||
    !concentrated ||
    original === concentrated ||
    concentrated.corpCreditsAfter < original.corpCreditsAfter ||
    concentrated.corpAgendaPointsAfter < original.corpAgendaPointsAfter ||
    concentrated.corpClicksAfter < original.corpClicksAfter
  )
    return undefined;

  const preparationCredits = visibleRunnerNextTurnPreparationCreditGain(
    runnerRig,
    preparationClicks,
    visibleRunnerPreparationIncomePerClick(runnerRig),
  );
  const startOfTurnCredits = runnerRig.reduce((total, card) => {
    if (!card.known || card.rezzed !== true) return total;
    const profile = runnerStartOfTurnCreditProfile(card.definitionId);
    if (profile?.orderClass !== "credit_gain") return total;
    return (
      total +
      (profile.sourceEffect === "take_hosted_credits"
        ? Math.min(profile.amount, card.counters?.bit ?? 0)
        : profile.amount)
    );
  }, 0);
  const protection = (serverIce: typeof concentrated.archivesIce) =>
    assessCorpScoreProtection({
      serverIce,
      runnerRig,
      runnerSetAside: view.specialZones?.setAside ?? [],
      runnerCredits: view.opponent.credits + startOfTurnCredits,
      runnerRunOnlyCredits: view.runnerNextRunBadPublicityCredits ?? 0,
      runnerCreditPoolHorizon: "next_runner_turn",
      runnerPreparationCreditClicks: preparationCredits,
      targetServerId: "archives",
      observedAtStateVersion: view.stateVersion,
      maximumRunnerAccessSuccessProbability: { numerator: 0, denominator: 1 },
    });
  const originalProtection = protection(original.archivesIce);
  const concentratedProtection = protection(concentrated.archivesIce);
  if (
    originalProtection.knowledge !== "known" ||
    originalProtection.runnerAccessSuccessProbability.numerator === 0 ||
    concentratedProtection.knowledge !== "known" ||
    concentratedProtection.runnerAccessSuccessProbability.numerator !== 0
  )
    return undefined;
  const targets = concentrated.optionIds.flatMap((optionId) => {
    const option = choice.options.find(
      (entry) =>
        entry.id === optionId &&
        entry.selectable !== false &&
        entry.card?.known &&
        entry.metadata?.targetServerId === "archives",
    );
    return option?.card
      ? [
          {
            cardId: option.card.instanceId,
            serverId: "archives" as const,
            optionId,
          },
        ]
      : [];
  });
  return targets.length === choice.minSelections ? targets : undefined;
}
