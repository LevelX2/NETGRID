import type {
  CardDefinition,
  CardInstanceId,
  DamageType,
  GameState,
  LegalAction,
  ResolvedGameEffect,
} from "@netgrid/shared";
import type { CardImplementationDefinition } from "../../card-implementations/types";

type CorpTraceDamageAbilityPayload = Record<string, string | number | boolean>;

type CorpTraceDamageAbilityProfile =
  | {
      sourceZone: "scored_agenda" | "installed_corp_root";
      family: "trace_tag";
      traceBase: number;
      traceLimit?: number;
    }
  | {
      sourceZone: "scored_agenda" | "installed_corp_root";
      family: "tagged_meat_damage";
      damageType: Extract<DamageType, "meat">;
      damageAmount: number;
      requiresRunnerTagged: true;
    };

export type CorpTraceDamageAbilityHost = {
  state: Pick<GameState, "corp" | "cardInstances">;
  legalAction?: LegalAction;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    implementationForDefinition: (
      definition: CardDefinition,
    ) => CardImplementationDefinition | undefined;
  };
  callbacks: {
    pushActivatedCardImplementationActions: (
      actions: LegalAction[],
      cardId: CardInstanceId,
      definition: CardDefinition,
    ) => void;
    resolveActivatedCardImplementationAbility: () => boolean;
  };
};

export type CorpTraceDamageAbilityLegalActionResult = {
  handled: boolean;
  actions: LegalAction[];
  sourceCardId?: CardInstanceId;
  sourceDefinitionId?: string;
  traceBase?: number;
  traceLimit?: number;
  damageType?: DamageType;
  damageAmount?: number;
  requiresRunnerTagged?: boolean;
};

export type CorpTraceDamageAbilityExecutionResult = {
  handled: boolean;
  stateChanged?: boolean;
  sourceCardId?: CardInstanceId;
  sourceDefinitionId?: string;
  traceStarted?: boolean;
  traceBase?: number;
  traceLimit?: number;
  damageType?: DamageType;
  damageAmount?: number;
  requiresRunnerTagged?: boolean;
  resolvedPayload?: CorpTraceDamageAbilityPayload;
  resolvedEffects?: ResolvedGameEffect[];
};

export function corpTraceDamageAbilityProfileForDefinition(
  definition: CardDefinition,
  implementation: CardImplementationDefinition | undefined,
): CorpTraceDamageAbilityProfile | undefined {
  const sourceZone =
    definition.type === "agenda" ? "scored_agenda" : "installed_corp_root";
  for (const ability of implementation?.abilities ?? []) {
    if (ability.kind !== "activated" || ability.timing !== "corp_main")
      continue;
    const traceEffect = ability.effects.find(
      (effect) =>
        effect.kind === "trace" &&
        effect.onSuccess.some(
          (successEffect) =>
            successEffect.kind === "add_tags" &&
            successEffect.recipient === "runner",
        ),
    );
    if (traceEffect?.kind === "trace") {
      return {
        sourceZone,
        family: "trace_tag",
        traceBase: traceEffect.baseTraceStrength,
      };
    }

    const damageEffect = ability.effects.find(
      (effect) =>
        effect.kind === "damage" &&
        effect.recipient === "runner" &&
        effect.damageType === "meat",
    );
    if (
      ability.condition?.kind === "runner_is_tagged" &&
      damageEffect?.kind === "damage" &&
      damageEffect.damageType === "meat"
    ) {
      return {
        sourceZone,
        family: "tagged_meat_damage",
        damageType: damageEffect.damageType,
        damageAmount: damageEffect.amount,
        requiresRunnerTagged: true,
      };
    }
  }
  return undefined;
}

export function buildCorpTraceDamageAbilityActionsForCard(
  host: CorpTraceDamageAbilityHost,
  sourceCardId: CardInstanceId,
): CorpTraceDamageAbilityLegalActionResult {
  const definition = host.cards.definitionFor(sourceCardId);
  const profile = corpTraceDamageAbilityProfileForDefinition(
    definition,
    host.cards.implementationForDefinition(definition),
  );
  if (!profile) return { handled: false, actions: [] };
  const actions: LegalAction[] = [];
  host.callbacks.pushActivatedCardImplementationActions(
    actions,
    sourceCardId,
    definition,
  );
  return {
    handled: true,
    actions,
    sourceCardId,
    sourceDefinitionId: definition.id,
    ...profileResultFields(profile),
  };
}

export function handleCorpTraceDamageActivatedAbility(
  host: CorpTraceDamageAbilityHost,
): CorpTraceDamageAbilityExecutionResult {
  const legalAction = host.legalAction;
  if (!legalAction || legalAction.type !== "activated_card_ability")
    return { handled: false };
  const sourceCardId = legalAction.abilityRef?.sourceCardInstanceId;
  if (!sourceCardId || !host.state.cardInstances[sourceCardId])
    return { handled: false };
  const definition = host.cards.definitionFor(sourceCardId);
  const profile = corpTraceDamageAbilityProfileForDefinition(
    definition,
    host.cards.implementationForDefinition(definition),
  );
  if (!profile || !sourceZoneMatches(host, sourceCardId, profile))
    return { handled: false };
  if (!host.callbacks.resolveActivatedCardImplementationAbility())
    throw new Error("Die Trace-/Damage-Kartenfaehigkeit ist nicht gueltig.");
  return {
    handled: true,
    stateChanged: true,
    sourceCardId,
    sourceDefinitionId: definition.id,
    ...profileResultFields(profile),
    ...(legalAction.payload
      ? { resolvedPayload: legalAction.payload as CorpTraceDamageAbilityPayload }
      : {}),
    ...(legalAction.resolvedEffects
      ? { resolvedEffects: legalAction.resolvedEffects }
      : {}),
  };
}

function sourceZoneMatches(
  host: CorpTraceDamageAbilityHost,
  sourceCardId: CardInstanceId,
  profile: CorpTraceDamageAbilityProfile,
): boolean {
  if (profile.sourceZone === "scored_agenda")
    return host.state.corp.scoreArea.includes(sourceCardId);
  const instance = host.state.cardInstances[sourceCardId];
  return (
    instance?.zone.side === "corp" &&
    instance.zone.zone === "serverRoot" &&
    instance.rezzed === true
  );
}

function profileResultFields(
  profile: CorpTraceDamageAbilityProfile,
): Omit<
  CorpTraceDamageAbilityExecutionResult,
  "handled" | "stateChanged" | "sourceCardId" | "sourceDefinitionId"
> {
  if (profile.family === "trace_tag") {
    return {
      traceStarted: true,
      traceBase: profile.traceBase,
      ...(profile.traceLimit !== undefined ? { traceLimit: profile.traceLimit } : {}),
    };
  }
  return {
    damageType: profile.damageType,
    damageAmount: profile.damageAmount,
    requiresRunnerTagged: profile.requiresRunnerTagged,
  };
}
