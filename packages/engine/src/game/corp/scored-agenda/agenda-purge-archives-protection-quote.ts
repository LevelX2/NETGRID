import type {
  GameState,
  LegalAction,
  PlayerView,
  VisibleAgendaPurgeArchivesProtectionQuote,
  VisibleChoiceOption,
} from "@netgrid/shared";
import { applyAction } from "../../apply-action";
import { getPlayerView } from "../../player-view";
import { isAgendaPurgeInstallTargetChoiceSource } from "./agenda-purge-install-target-sequence";

/**
 * Actor-private comparison of the exact fixed options already offered by a
 * scored agenda. Apply each full option set to a separate immutable branch
 * through the regular Engine path. Export only the resulting Archives ICE and
 * Corp resources. No hidden R&D remainder or alternate state leaves Engine.
 */
export function quoteAgendaPurgeArchivesProtection(
  state: GameState,
  view: PlayerView,
  action: LegalAction | undefined,
): VisibleAgendaPurgeArchivesProtectionQuote | undefined {
  const choice = view.pendingChoice;
  const requirement = action?.choiceRequirements?.[0];
  const archives = view.servers.find((server) => server.id === "archives");
  if (
    state.run ||
    view.side !== "corp" ||
    view.stateVersion !== state.stateVersion ||
    choice?.side !== "corp" ||
    choice.choiceId !== state.pendingChoice?.choiceId ||
    choice.stateVersion !== state.stateVersion ||
    !isAgendaPurgeInstallTargetChoiceSource(choice.source) ||
    choice.minSelections !== 2 ||
    choice.maxSelections !== 2 ||
    action?.side !== "corp" ||
    action.type !== "resolve_choice" ||
    action.expiresAtStateVersion !== state.stateVersion ||
    requirement?.choiceId !== choice.choiceId ||
    !archives ||
    archives.ice.length !== 0
  )
    return undefined;

  const revealedAgenda = choice.options.find(
    (option) =>
      option.selectable === false &&
      option.card?.known === true &&
      option.card.type === "agenda" &&
      option.value === option.card.instanceId &&
      state.corp.rd.slice(0, 3).includes(option.card.instanceId),
  )?.card;
  if (
    !revealedAgenda ||
    !Number.isSafeInteger(revealedAgenda.agendaPoints) ||
    view.opponent.agendaPoints + revealedAgenda.agendaPoints! <
      view.agendaPointsToWin
  )
    return undefined;

  const fixedTargets = (serverId: "archives" | "rd") =>
    choice.options.filter(
      (option) =>
        option.selectable !== false &&
        option.card?.known === true &&
        option.card.type === "ice" &&
        option.metadata?.targetServerId === serverId &&
        option.metadata.optionKind === "fixed" &&
        option.metadata.creditCost === 0 &&
        requirement.optionIds.includes(option.id),
    );
  const archiveOptions = fixedTargets("archives");
  const rdOptions = fixedTargets("rd");
  if (
    archiveOptions.length !== 2 ||
    rdOptions.length !== 2 ||
    archiveOptions[0]!.card!.instanceId === archiveOptions[1]!.card!.instanceId
  )
    return undefined;
  const [first, second] = archiveOptions;
  const firstRd = rdOptions.find(
    (option) => option.card!.instanceId === first!.card!.instanceId,
  );
  const secondRd = rdOptions.find(
    (option) => option.card!.instanceId === second!.card!.instanceId,
  );
  if (!firstRd || !secondRd) return undefined;

  const packages: VisibleAgendaPurgeArchivesProtectionQuote["packages"] = [];
  const combinations: [VisibleChoiceOption, VisibleChoiceOption][] = [
    [first!, secondRd],
    [firstRd, second!],
    [first!, second!],
  ];
  for (const options of combinations) {
    const optionIds = options.map((option) => option.id);
    const result = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: choice.choiceId,
        selectedOptionIds: optionIds,
      },
    });
    if (!result.ok || result.state.pendingChoice || result.state.winner)
      return undefined;
    const projected = getPlayerView(result.state, "corp");
    const fort = projected.servers.find((server) => server.id === "archives");
    const expectedIceIds = new Set(
      options
        .filter((option) => option.metadata?.targetServerId === "archives")
        .map((option) => option.card!.instanceId),
    );
    if (
      !fort ||
      !fort.root.some(
        (card) => card.known && card.instanceId === revealedAgenda.instanceId,
      ) ||
      fort.ice.length !== expectedIceIds.size ||
      fort.ice.some(
        (card) =>
          !expectedIceIds.has(card.instanceId) ||
          !card.known ||
          card.rezzed !== true ||
          !card.effectiveRunQuote,
      )
    )
      return undefined;
    packages.push({
      optionIds,
      archivesIce: fort.ice,
      corpCreditsAfter: projected.own.credits,
      corpAgendaPointsAfter: projected.own.agendaPoints,
      corpClicksAfter: projected.own.clicks,
    });
  }
  return {
    choiceId: choice.choiceId,
    stateVersion: state.stateVersion,
    revealedAgendaId: revealedAgenda.instanceId,
    packages,
  };
}
