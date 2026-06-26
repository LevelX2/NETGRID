import type { CorpPunishKind } from "../runtime/corp-tag-punish-types";
import type { AiSimulationSummary } from "./ai-simulation-summary";

export function tagSourceConvertsToRunnerTagged(
  sequence: AiSimulationSummary["actionSequence"],
  index: number,
): boolean {
  return sequence
    .slice(index + 1, index + 8)
    .some(
      (entry) =>
        entry.runnerTagAddedByAction === true ||
        entry.runnerTaggedAtCorpDecision === true ||
        (entry.runnerTagsAfterAction ?? 0) >
          (entry.runnerTagsBeforeAction ?? 0),
    );
}

export function tagSourceConvertsToPunishOpportunity(
  sequence: AiSimulationSummary["actionSequence"],
  index: number,
): boolean {
  return sequence
    .slice(index + 1, index + 12)
    .some(
      (entry) => entry.side === "corp" && entry.corpPunishOpportunity === true,
    );
}

export function tagSourceConvertsToPunishTaken(
  sequence: AiSimulationSummary["actionSequence"],
  index: number,
): boolean {
  return sequence
    .slice(index + 1, index + 12)
    .some((entry) => entry.side === "corp" && entry.corpPunishTaken === true);
}

export function isTerminalDamageOrEconomicPunish(
  kind: CorpPunishKind | undefined,
): boolean {
  return (
    kind === "scorched_earth_like" ||
    kind === "urban_renewal_like" ||
    kind === "punitive_counterstrike_like" ||
    kind === "closed_accounts_like" ||
    kind === "power_grid_overload_like" ||
    kind === "scored_agenda_damage_like" ||
    kind === "resource_trash_like"
  );
}
