import { planningCardByDefinitionId } from "@netgrid/cards/planning";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { assessCorpScoreProtection } from "../../runtime/corp-score-protection-assessment";

/** Defense owns the bounded proof that one sold layer leaves a blocked path.
 * Dynamic/lifecycle ICE requires an Engine post-removal quote, not reuse of a
 * potentially changed current quote. This slice admits only static layers. */
export function assessCorpIceLiquidation(
  input: AiDecisionInput,
  action: LegalAction,
): {
  status: "not_applicable" | "preserved" | "blocked" | "unknown";
  reason: string;
} {
  const source = input.playerView.servers
    .flatMap((s) => s.root)
    .find((c) => c.instanceId === action.source);
  const ability = source?.definitionId
    ? planningCardByDefinitionId(source.definitionId)?.engine.abilities?.find(
        (a) =>
          a.kind === "activated" &&
          a.capabilityKey === action.payload?.cardImplementationAbilityKey,
      )
    : undefined;
  const effect = ability?.effects.find(
    (e) => e.kind === "trash_own_rezzed_ice_for_credits",
  );
  if (!effect)
    return typeof action.payload?.targetCardId === "string" &&
      typeof action.payload?.gainedCredits === "number" &&
      input.playerView.servers.some((s) =>
        s.ice.some((c) => c.instanceId === action.payload?.targetCardId),
      )
      ? { status: "unknown", reason: "missing_liquidation_capability" }
      : { status: "not_applicable", reason: "not_ice_liquidation" };
  const server = input.playerView.servers.find((s) =>
    s.ice.some((c) => c.instanceId === action.payload?.targetCardId),
  );
  if (
    !server ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.payload?.gainedCredits !== effect.gainCredits
  )
    return { status: "unknown", reason: "missing_current_liquidation_binding" };
  const remaining = server.ice.filter(
    (c) => c.instanceId !== action.payload?.targetCardId,
  );
  if (!remaining.length)
    return { status: "blocked", reason: "last_defense_layer" };
  if (
    server.ice.some((c) => {
      const engine = c.definitionId
        ? planningCardByDefinitionId(c.definitionId)?.engine
        : undefined;
      return (
        !c.known ||
        !c.rezzed ||
        !c.effectiveRunQuote ||
        !engine ||
        Object.keys(engine).some(
          (key) =>
            ![
              "schemaVersion",
              "characteristics",
              "printedSubroutines",
            ].includes(key),
        ) ||
        engine.characteristics.strength?.kind !== "fixed" ||
        c.effectiveRunQuote.conditionalEncounterEffects?.length
      );
    })
  )
    return {
      status: "unknown",
      reason: "post_removal_dynamic_path_quote_required",
    };
  const opponent = input.playerView.opponent;
  if (
    opponent.rig === undefined ||
    input.playerView.runnerNextTurnCreditClicks === undefined
  )
    return { status: "unknown", reason: "missing_runner_preparation_facts" };
  const protection = assessCorpScoreProtection({
    serverIce: remaining,
    runnerRig: opponent.rig,
    runnerSetAside: input.playerView.specialZones?.setAside ?? [],
    ...(opponent.memoryUsed !== undefined
      ? { runnerMemoryUsed: opponent.memoryUsed }
      : {}),
    ...(opponent.memoryLimit !== undefined
      ? { runnerMemoryLimit: opponent.memoryLimit }
      : {}),
    runnerCredits: opponent.credits,
    runnerPreparationCreditClicks: input.playerView.runnerNextTurnCreditClicks,
    maximumRunnerAccessSuccessProbability: { numerator: 0, denominator: 1 },
  });
  return protection.knowledge === "unknown"
    ? { status: "unknown", reason: protection.unknownReason }
    : protection.protectsScore
      ? {
          status: "preserved",
          reason: "remaining_static_path_blocks_prepared_runner",
        }
      : { status: "blocked", reason: "remaining_path_allows_access" };
}
