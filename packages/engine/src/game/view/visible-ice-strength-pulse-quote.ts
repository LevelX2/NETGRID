import type {
  CorpTemporaryIceStrengthPulseQuote,
  GameState,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import { activatedAbilityBindingsForDefinition } from "../../ability-engine/card-capability-binding";
import { temporaryIceStrengthPulseBonus } from "../../ability-engine/temporary-ice-strength-pulse";
import { agendaPoints, visibleCorpCard } from "./card-view";
import { visibleEffectiveIceRunQuote } from "./visible-run-quote";
import { visibleCorpIcePostRezRunQuote } from "./visible-post-rez-run-quote";
import { projectInstalledCorpIceRezCost } from "../payment";
import { projectFixedCorpIcePostRezState } from "./fixed-ice-post-rez-state";

/** Current approached ICE only. Unprojected lifecycle/cost work is explicit,
 * incomplete evidence. The quote neither grants legality nor mutates a turn. */
export function visibleTemporaryIceStrengthPulseQuote(
  state: GameState,
  action: LegalAction,
): CorpTemporaryIceStrengthPulseQuote | undefined {
  if (
    action.side !== "corp" ||
    !["rez_card", "activated_card_ability"].includes(action.type)
  )
    return undefined;
  const source = state.cardInstances[action.source];
  if (!source) return undefined;
  const implementation = cardImplementationForDefinitionId(source.definitionId);
  const definition = CARD_DEFINITIONS_BY_ID[source.definitionId];
  if (!definition) return undefined;
  const abilities = activatedAbilityBindingsForDefinition(definition).filter(
    (binding) => {
      const a = binding.ability;
      return (
        a.effects.length === 1 &&
        a.effects[0]?.kind === "double_chosen_ice_strength_until_end_of_turn" &&
        (action.type === "rez_card"
          ? a.timing === "corp_during_run"
          : binding.capabilityKey ===
            action.payload?.cardImplementationAbilityKey)
      );
    },
  );
  if (abilities.length !== 1) return undefined;
  const capability = abilities[0]!;
  const ability = capability.ability;
  const effect = ability.effects[0]!;
  if (effect.kind !== "double_chosen_ice_strength_until_end_of_turn")
    return undefined;
  const run = state.run;
  const server =
    run && state.corp.servers.find((s) => s.id === run.attackedServerId);
  const currentTarget =
    run?.position.kind === "ice" &&
    server &&
    run.position.serverId === server.id
      ? server.ice[run.position.iceIndex]
      : undefined;
  const target =
    action.type === "rez_card" ? currentTarget : action.payload?.targetCardId;
  const targetId = typeof target === "string" ? target : null;
  const targetServer =
    targetId && state.corp.servers.find((s) => s.ice.includes(targetId));
  const pulseCredits = ability.costs.reduce(
    (sum, c) => sum + (c.kind === "credit" ? c.amount : 0),
    0,
  );
  const sourceRezCredits =
    action.type === "rez_card"
      ? action.costs.reduce((sum, c) => sum + (c.credits ?? 0), 0)
      : 0;
  const binding = {
    schemaVersion: 1 as const,
    kind:
      action.type === "rez_card"
        ? ("prepare_rez" as const)
        : ("activate" as const),
    stateVersion: state.stateVersion,
    actionId: action.actionId,
    sourceCardInstanceId: action.source,
    sourceDefinitionId: source.definitionId,
    targetIceInstanceId: targetId,
    targetServerId: targetServer ? targetServer.id : null,
    capabilityKey: capability.capabilityKey,
    sourceTrashed: true as const,
    expires: "turn_end" as const,
    turnSerial: state.turnSerial ?? 0,
    pulseCredits,
    sourceRezCredits,
  };
  const incomplete = (reason: string): CorpTemporaryIceStrengthPulseQuote => ({
    ...binding,
    complete: false,
    reason,
  });
  if (
    !run ||
    state.timingPoint !== "run.approach_ice" ||
    currentTarget !== targetId
  )
    return incomplete("not_current_approached_target");
  if (run.position.kind !== "ice" || run.position.iceIndex !== 0)
    return incomplete("additional_remaining_ice_projection_required");
  if (!targetServer || targetServer.id !== run.attackedServerId || !targetId)
    return incomplete("missing_current_target");
  if (
    source.controller !== "corp" ||
    source.zone.side !== "corp" ||
    source.zone.zone !== "serverRoot" ||
    !state.corp.servers.some((s) => s.root.includes(action.source)) ||
    (action.type === "rez_card" ? source.rezzed : !source.rezzed)
  )
    return incomplete("source_not_current_installed_root");
  if (
    ability.condition ||
    ability.limit ||
    ability.costs.filter((c) => c.kind === "trash_source" && c.amount === 1)
      .length !== 1 ||
    ability.costs.some(
      (c) => c.kind !== "credit" && c.kind !== "trash_source",
    ) ||
    ability.costs.some(
      (c) => !Number.isSafeInteger(c.amount) || c.amount < 0,
    ) ||
    Object.values(implementation?.lifecycle ?? {}).some((v) =>
      Array.isArray(v) ? v.length > 0 : v === true,
    )
  )
    return incomplete("lifecycle_or_cost_projection_required");
  if (
    action.type === "rez_card" &&
    action.costs.some(
      (c) =>
        Object.keys(c).some((key) => key !== "credits") ||
        !Number.isSafeInteger(c.credits) ||
        (c.credits ?? 0) < 0,
    )
  )
    return incomplete("source_rez_additional_cost_projection_required");
  if (
    action.type === "activated_card_ability" &&
    (action.payload?.cardImplementationTrashSourceCost !== true ||
      action.costs.reduce((sum, c) => sum + (c.credits ?? 0), 0) !==
        pulseCredits)
  )
    throw new Error("temporary_ice_strength_pulse_action_cost_mismatch");
  const targetInstance = state.cardInstances[targetId];
  if (!targetInstance) return incomplete("missing_installed_target");
  let iceRezCredits = 0;
  let beforeState: GameState =
    action.type === "rez_card"
      ? {
          ...state,
          cardInstances: {
            ...state.cardInstances,
            [action.source]: { ...source, rezzed: true, faceup: true },
          },
        }
      : state;
  if (!targetInstance.rezzed) {
    if (action.type !== "rez_card") return incomplete("target_not_rezzed");
    const rez = projectInstalledCorpIceRezCost(beforeState, targetId);
    const card = visibleCorpCard(beforeState, targetId, "corp", "ice");
    const postRez = visibleCorpIcePostRezRunQuote(beforeState, targetId, card);
    if (
      !rez?.complete ||
      rez.costKind !== "fixed" ||
      rez.mandatoryAdditionalCosts.agendaPoints !== 0 ||
      !postRez?.complete
    )
      return incomplete("target_rez_projection_required");
    iceRezCredits = rez.finalCredits;
    const projected = projectFixedCorpIcePostRezState(beforeState, targetId);
    if (!projected)
      throw new Error(
        "temporary_ice_strength_pulse_fixed_rez_projection_missing",
      );
    beforeState = projected;
  }
  const total = sourceRezCredits + iceRezCredits + pulseCredits;
  if (state.corp.credits < total)
    return incomplete("defense_sequence_not_funded");
  beforeState = {
    ...beforeState,
    corp: {
      ...beforeState.corp,
      credits: state.corp.credits - sourceRezCredits - iceRezCredits,
    },
  };
  const visible = (current: GameState): VisibleCard => {
    const card = visibleCorpCard(current, targetId, "corp", "ice");
    const effectiveRunQuote = visibleEffectiveIceRunQuote(
      current,
      targetId,
      card,
    );
    if (!effectiveRunQuote)
      throw new Error(
        "temporary_ice_strength_pulse_effective_run_quote_missing",
      );
    return { ...card, effectiveRunQuote };
  };
  const beforeIce = visible(beforeState);
  const afterState = structuredClone(beforeState);
  afterState.corp.credits = state.corp.credits - total;
  for (const s of afterState.corp.servers)
    s.root = s.root.filter((id) => id !== action.source);
  afterState.cardInstances[action.source] = {
    ...source,
    rezzed: false,
    faceup: true,
    zone: { side: "corp", zone: "archives" },
  };
  afterState.corp.archives.push(action.source);
  const afterSourceTrash = visible(afterState);
  const bonus = temporaryIceStrengthPulseBonus(
    afterSourceTrash.effectiveRunQuote!.effectiveStrength,
    effect.maxStrength,
  );
  afterState.cardInstances[targetId]!.strengthModifier += bonus;
  return {
    ...binding,
    complete: true,
    iceRezCredits,
    corpCreditsAfterDefense: afterState.corp.credits,
    corpAgendaPointsAfterDefense: agendaPoints(afterState, "corp"),
    beforeIce,
    afterIce: visible(afterState),
  };
}
