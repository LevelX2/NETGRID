import type {
  CardInstanceId,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import {
  activeCardImplementationModifiersForRunnerInstalled,
  type ActiveCardImplementationModifier,
} from "../../ability-engine/card-implementation-modifiers";
import type { CardModifierImplementation } from "../../ability-engine/definition-types";
import { buildLegalAction } from "./action-builders";

type NewDataFortCreationLockModifier = Extract<
  CardModifierImplementation,
  { kind: "new_data_fort_creation_lock" }
>;

export type ActiveNewDataFortCreationLock =
  ActiveCardImplementationModifier<NewDataFortCreationLockModifier>;

export function activeNewDataFortCreationLocks(
  state: GameState,
): ActiveNewDataFortCreationLock[] {
  return activeCardImplementationModifiersForRunnerInstalled(
    state,
    "new_data_fort_creation_lock",
  ).filter(
    (match) =>
      match.modifier.activeWhile === "installed" &&
      match.modifier.sourceZone === "runner_installed" &&
      match.modifier.side === "corp" &&
      match.modifier.visibility === "public" &&
      match.modifier.blocks === "corp_new_remote_installs",
  );
}

export function corpNewDataFortCreationLocked(state: GameState): boolean {
  return activeNewDataFortCreationLocks(state).length > 0;
}

export function assertCorpCanCreateNewDataFort(state: GameState): void {
  if (corpNewDataFortCreationLocked(state))
    throw new Error("Die Korp darf aktuell keine neuen Data Forts erstellen.");
}

export function buildCorpTrashNewDataFortCreationLockActions(
  state: GameState,
): LegalAction[] {
  const actions: LegalAction[] = [];
  for (const match of activeNewDataFortCreationLocks(state)) {
    const cost = match.modifier.corpTrashSourceCost;
    if (state.corp.clicks < cost.clicks || state.corp.credits < cost.credits)
      continue;
    actions.push(
      buildLegalAction(
        state,
        "corp",
        "trigger_ability",
        `${match.sourceDefinition.title} trashen`,
        match.sourceCardInstanceId,
        [{ clicks: cost.clicks, credits: cost.credits }],
        {
          cardId: match.sourceCardInstanceId,
          corpAbility: "trash_new_data_fort_creation_lock_source",
          sourceDefinitionId: match.sourceDefinitionId,
          trashCostPaid: cost.credits,
          newDataFortCreationLock: true,
        },
        {
          targetRequirements: [
            {
              id: "newDataFortCreationLockSource",
              kind: "card",
              side: "runner",
              zoneScope: ["runner.rig.resources"],
              visibility: "public",
            },
          ],
        },
      ),
    );
  }
  return actions;
}

export function newDataFortCreationLockForSource(
  state: GameState,
  cardId: CardInstanceId,
): ActiveNewDataFortCreationLock | undefined {
  return activeNewDataFortCreationLocks(state).find(
    (match) => match.sourceCardInstanceId === cardId,
  );
}
