import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";

import type { AiCardHint } from "../ai-hints";
import { rolesForAction as rolesForActionRuntime } from "./action-role-lookup";
import { cardRolesForId as cardRolesForIdRuntime } from "./card-role-lookup";

export type RoleContextDependencies = {
  findVisibleCard: (
    input: AiDecisionInput,
    instanceId: string,
  ) => VisibleCard | undefined;
  aiHints: ReadonlyMap<string, AiCardHint>;
};

export function createRoleContext(
  dependencies: RoleContextDependencies,
): {
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
  rolesForCardId: (cardId: string | undefined) => string[];
} {
  const rolesForCardId = (cardId: string | undefined): string[] =>
    cardRolesForIdRuntime(cardId, dependencies.aiHints);

  const rolesForAction = (
    input: AiDecisionInput,
    action: LegalAction,
  ): string[] =>
    rolesForActionRuntime(input, action, {
      findVisibleCard: dependencies.findVisibleCard,
      rolesForCardId,
    });

  return {
    rolesForAction,
    rolesForCardId,
  };
}
