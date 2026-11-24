import type { LegalAction } from "@netgrid/shared";
import { delayedInstallAbilityForAction } from "./delayed-install-action";
import { cardDefinitionIdValue } from "../card-definition-id-input";

export type PersistentDevelopmentRoute =
  | "direct_install"
  | "prepare_delayed_install"
  | "progress_delayed_install";

export type PersistentDevelopmentActionProjection = {
  route: PersistentDevelopmentRoute;
  targetCardId: string;
  targetDefinitionId?: number;
  developsGripCard: boolean;
  appliesInstallFitNow: boolean;
  evidence: string[];
};

export function persistentDevelopmentActionProjection(
  action: LegalAction,
): PersistentDevelopmentActionProjection | undefined {
  if (action.side !== "runner") return undefined;
  if (action.type === "install_card") {
    const sourceCardId =
      action.source === "basic_action" || action.source === "game_rule"
        ? undefined
        : action.source;
    const targetCardId = firstString(
      action.payload?.cardId,
      sourceCardId,
      action.payload?.targetCardId,
    );
    if (!targetCardId) return undefined;
    const targetDefinitionId =
      cardDefinitionIdValue(action.payload?.cardDefinitionId) ??
      cardDefinitionIdValue(action.payload?.sourceDefinitionId) ??
      cardDefinitionIdValue(action.payload?.targetCardDefinitionId);
    return projection({
      route: "direct_install",
      targetCardId,
      ...(targetDefinitionId ? { targetDefinitionId } : {}),
      developsGripCard: true,
      appliesInstallFitNow: true,
    });
  }
  if (action.type !== "trigger_ability") return undefined;
  const delayedAbility = delayedInstallAbilityForAction(action);
  if (
    delayedAbility !== "set_aside_from_grip" &&
    delayedAbility !== "remove_shell_counter"
  ) {
    return undefined;
  }
  const targetCardId = firstString(action.payload?.targetCardId);
  if (!targetCardId) return undefined;
  const targetDefinitionId = cardDefinitionIdValue(
    action.payload?.targetCardDefinitionId,
  );
  return projection({
    route:
      delayedAbility === "set_aside_from_grip"
        ? "prepare_delayed_install"
        : "progress_delayed_install",
    targetCardId,
    ...(targetDefinitionId ? { targetDefinitionId } : {}),
    developsGripCard: delayedAbility === "set_aside_from_grip",
    appliesInstallFitNow: delayedAbility === "set_aside_from_grip",
  });
}

export function actionAppliesPersistentInstallFitNow(action: LegalAction): boolean {
  return (
    persistentDevelopmentActionProjection(action)?.appliesInstallFitNow === true
  );
}

function projection(
  input: Omit<PersistentDevelopmentActionProjection, "evidence">,
): PersistentDevelopmentActionProjection {
  return {
    ...input,
    evidence: [
      `persistent_development_route:${input.route}`,
      `persistent_development_target:${input.targetCardId}`,
      `persistent_development_grip_card:${input.developsGripCard}`,
      `persistent_development_install_fit_now:${input.appliesInstallFitNow}`,
    ],
  };
}

function firstString(...values: unknown[]): string | undefined {
  return values.find(
    (value): value is string => typeof value === "string" && value.length > 0,
  );
}
