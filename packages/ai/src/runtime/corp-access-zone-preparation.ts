import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import { reconstructBeliefState } from "../belief-state";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { ResidentPlanPortfolio } from "../plans/resident-plan-portfolio";
import type { CorpAmbushSignal } from "../plans/corp-tactical-plan-modules";
import { corpBluffDefenseNeed } from "../plans/corp-bluff-defense";

/** Mechanical profile only. No remote damage is inferred from central access. */
export function corpAccessZonePreparationProfile(definitionId: string) {
  const spec = cardSpecPlanningCardByDefinitionId(definitionId)?.planning;
  if (spec?.side !== "corp" || spec.cardType !== "asset") return undefined;
  const engine = spec.engine;
  const zoneEffect = engine.accessEffects?.find(
    (effect) =>
      effect.kind === "on_access" &&
      !effect.condition &&
      !effect.cost &&
      effect.sourceZones.length === 1 &&
      (effect.sourceZones[0] === "rd" || effect.sourceZones[0] === "archives"),
  );
  if (!zoneEffect || zoneEffect.kind !== "on_access") return undefined;
  if (
    zoneEffect.effects.some(
      (effect) =>
        effect.kind !== "shuffle_source_into_corp_rd" &&
        !(
          effect.kind === "damage" &&
          effect.recipient === "runner" &&
          effect.damageType === "net" &&
          typeof effect.amount === "number" &&
          effect.amount > 0
        ),
    )
  )
    return undefined;
  const damage = zoneEffect.effects.find(
    (effect) =>
      effect.kind === "damage" &&
      effect.recipient === "runner" &&
      effect.damageType === "net" &&
      typeof effect.amount === "number",
  );
  if (!damage || damage.kind !== "damage" || typeof damage.amount !== "number")
    return undefined;
  return {
    zone: zoneEffect.sourceZones[0],
    damage: damage.amount,
    shufflesOnAccess: zoneEffect.effects.some(
      (effect) => effect.kind === "shuffle_source_into_corp_rd",
    ),
    freeSelfShuffleOnRez:
      engine.characteristics.numeric.rezCost === 0 &&
      engine.lifecycle?.on_rez?.length === 1 &&
      engine.lifecycle.on_rez[0]?.kind === "shuffle_source_into_corp_rd",
  };
}

/** Existing Ambush owner admits a finite install/hold/rez sequence. */
export function corpRdRecyclingSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  previous?: ResidentPlanPortfolio,
  reservedScoreServerIds: ReadonlySet<string> = new Set(),
  reservedScoreCredits = 0,
): CorpAmbushSignal[] {
  const locations = [
    ...input.playerView.own.gripOrHq.map((card) => ({
      card,
      server: undefined,
    })),
    ...input.playerView.servers
      .filter((server) => server.id.startsWith("remote_"))
      .flatMap((server) => server.root.map((card) => ({ card, server }))),
  ];
  const fastAgenda = locations
    .map((location) => location.card)
    .find(
      (card) =>
        card.known &&
        card.type === "agenda" &&
        typeof card.advancementRequirement === "number" &&
        card.advancementRequirement - (card.advancementCounters ?? 0) <= 3 &&
        input.playerView.own.credits >=
          card.advancementRequirement - (card.advancementCounters ?? 0),
    );
  const priorSignals = (previous?.instances ?? []).flatMap((instance) => {
    if (instance.moduleId !== "corp.ambush_and_bluff") return [];
    const state = instance.moduleState as { signal?: CorpAmbushSignal };
    return state.signal?.patternKind === "rd_recycle" ? [state.signal] : [];
  });
  const knownSources = new Set(
    reconstructBeliefState(
      input,
    ).corpOpponentModel?.runnerKnownCorpCardMemory.map(
      (entry) => entry.cardInstanceId,
    ),
  );
  return locations.flatMap(({ card, server }): CorpAmbushSignal[] => {
    const profile =
      card.known && card.definitionId
        ? corpAccessZonePreparationProfile(card.definitionId)
        : undefined;
    if (
      profile?.zone !== "rd" ||
      !profile.freeSelfShuffleOnRez ||
      card.rezzed === true
    )
      return [];
    const prior = priorSignals.find(
      (signal) => signal.sourceInstanceId === card.instanceId,
    );
    const bluffUntil =
      prior?.recycleBluffUntilTurnSerial ??
      (input.playerView.turnSerial !== undefined
        ? input.playerView.turnSerial + 4
        : undefined);
    const deckCount = input.playerView.own.stackOrRdCount;
    const handRelief = Math.max(
      0,
      input.playerView.own.gripOrHq.length - input.playerView.own.maxHandSize,
    );
    const actions = candidates.filter((candidate) => {
      if (
        candidate.sourceCardInstanceId !== card.instanceId ||
        candidate.costProfile.costKnownStatus !== "known" ||
        candidate.costProfile.additionalCosts.length > 0
      )
        return false;
      const action = input.legalActions.find(
        (action) => action.actionId === candidate.actionId,
      );
      if (
        !action ||
        action.expiresAtStateVersion !== input.playerView.stateVersion ||
        action.costs.some((cost) => (cost.credits ?? 0) !== 0) ||
        action.targetRequirements.length ||
        (action.choiceRequirements?.length ?? 0)
      )
        return false;
      if (server)
        return (
          action.type === "rez_card" &&
          action.costs.every((cost) => (cost.clicks ?? 0) === 0)
        );
      if (
        action.type !== "install_card" ||
        action.costs.reduce((sum, cost) => sum + (cost.clicks ?? 0), 0) !== 1
      )
        return false;
      const target = action.payload?.serverId;
      return (
        target === "new_remote" ||
        input.playerView.servers.some(
          (entry) =>
            entry.id === target &&
            !reservedScoreServerIds.has(entry.id) &&
            entry.id.startsWith("remote_") &&
            entry.root.length === 0,
        )
      );
    });
    // Do not build multiple idle copies merely for their subtype.
    const installedCopies = locations.filter(
      (other) => other.server && other.card.definitionId === card.definitionId,
    ).length;
    // One recycling source normally; a funded one-turn agenda permits a bounded
    // two-decoy setup, leaving the agenda installation as a separate Score choice.
    if (!server && installedCopies >= (fastAgenda ? 2 : 1)) return [];
    const defenseByServer = new Map<
      string,
      ReturnType<typeof corpBluffDefenseNeed>
    >(
      input.playerView.servers.map((s) => [
        s.id,
        corpBluffDefenseNeed(
          input,
          s.id,
          card.instanceId,
          reservedScoreCredits,
        ),
      ]),
    );
    actions.sort((left, right) => {
      const defense = (candidate: ActionSemanticCandidate) => {
        const target = input.legalActions.find(
          (a) => a.actionId === candidate.actionId,
        )?.payload?.serverId;
        return typeof target === "string"
          ? defenseByServer.get(target)
          : undefined;
      };
      const a = defense(left),
        b = defense(right);
      return (
        Number(!!b) - Number(!!a) ||
        Number(b?.outcome === "access_cost") -
          Number(a?.outcome === "access_cost") ||
        (a?.fundingGap ?? 0) - (b?.fundingGap ?? 0) ||
        (a?.requiredCredits ?? 0) - (b?.requiredCredits ?? 0) ||
        left.actionId.localeCompare(right.actionId)
      );
    });
    const selected = actions[0];
    if (!selected && !server) return [];
    const target =
      server?.id ??
      input.legalActions.find((a) => a.actionId === selected?.actionId)?.payload
        ?.serverId;
    if (typeof target !== "string") return [];
    const run = input.playerView.run;
    // Preserve an unknown protected remote through its ICE toll. There is no
    // damage at this remote, and no claim that the Runner will take the bait.
    const holdBluff =
      !!server &&
      (server.ice.length > 0 || !!fastAgenda) &&
      deckCount > 1 &&
      !knownSources.has(card.instanceId) &&
      run?.attackedServerId !== server.id &&
      bluffUntil !== undefined &&
      input.playerView.turnSerial !== undefined &&
      input.playerView.turnSerial < bluffUntil;
    const beforeIceToll =
      !!server &&
      run?.attackedServerId === server.id &&
      run.position?.kind === "ice";
    const execute = !holdBluff && !beforeIceToll;
    const defenseNeed =
      deckCount > 1 &&
      !knownSources.has(card.instanceId) &&
      (!server || holdBluff || beforeIceToll)
        ? defenseByServer.get(target)
        : undefined;
    return [
      {
        commitmentVersion: "corp_ambush_commitment_v1",
        ambushId: `ambush:${card.instanceId}`,
        sourceDefinitionId: card.definitionId!,
        sourceInstanceId: card.instanceId,
        serverId: target,
        phase: server ? "recycle_rd" : "install",
        patternKind: "rd_recycle",
        ...(deckCount === 0 && selected && execute
          ? {
              emptyRdRecovery: {
                observedAtStateVersion: input.playerView.stateVersion,
              },
            }
          : {}),
        ...(defenseNeed ? { defenseNeed } : {}),
        actionIds: selected && execute ? [selected.actionId] : [],
        purposeCode: server
          ? "recycle_access_source_into_rd"
          : "prepare_rd_recycling_and_optional_remote_bluff",
        assignedDomainPlanIds: ["corp.ambush_bluff"],
        duplicateAlreadyInstalled: false,
        affordableOrSupportable: true,
        plannedAtStateVersion:
          prior?.plannedAtStateVersion ?? input.playerView.stateVersion,
        ...(bluffUntil !== undefined
          ? { recycleBluffUntilTurnSerial: bluffUntil }
          : {}),
        plannedAdvancementTarget: 0,
        ...(fastAgenda
          ? { followupAgendaInstanceId: fastAgenda.instanceId }
          : {}),
        value:
          160 +
          profile.damage * 30 +
          Math.min(handRelief, 1) * 40 +
          (deckCount <= 1 ? 300 : deckCount <= 5 ? 80 : 0),
        evidenceCode:
          deckCount === 0 && selected && execute
            ? "corp_empty_rd_exact_recycling_before_mandatory_draw"
            : execute
              ? "corp_rd_recycling_exact_source_route"
              : "corp_rd_recycling_hold_remote_bluff_without_remote_damage",
        decisionEvidenceCodes: [
          "corp_rd_recycling_adds_one_deck_card",
          "corp_rd_recycling_dilutes_agenda_density",
          "corp_rd_recycling_access_damage_is_conditional",
        ],
        ...(!server && selected
          ? {
              installRoute: {
                actionId: selected.actionId,
                creditCost: 0,
                fundingGap: 0,
                costSource: "legal_action" as const,
              },
            }
          : {}),
      },
    ];
  });
}

/** Value of moving an uncommitted Archives-only source out of HQ at cleanup. */
export function corpArchivesPreparationDiscardValue(card: VisibleCard): number {
  const profile =
    card.known && card.definitionId
      ? corpAccessZonePreparationProfile(card.definitionId)
      : undefined;
  return profile?.zone === "archives"
    ? profile.damage * 30 + (profile.shufflesOnAccess ? 40 : 0)
    : 0;
}
