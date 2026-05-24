import type {
  CardDefinition,
  CardInstanceId,
  DamageType,
  GameState,
  LegalAction,
  ResolvedGameEffect,
} from "@netgrid/shared";

type CorpTraceDamageAbilityPayload = Record<string, string | number | boolean>;

type CorpTraceDamageAbilityProfile =
  | {
      sourceDefinitionId: string;
      sourceZone: "scored_agenda" | "installed_corp_root";
      family: "trace_tag";
      traceBase: number;
      traceLimit?: number;
    }
  | {
      sourceDefinitionId: string;
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

const CORP_TRACE_DAMAGE_ABILITY_PROFILES: Record<
  string,
  CorpTraceDamageAbilityProfile
> = {
  "onr_v1_207_netwatch-operations-office": {
    sourceDefinitionId: "onr_v1_207_netwatch-operations-office",
    sourceZone: "scored_agenda",
    family: "trace_tag",
    traceBase: 2,
  },
  "onr_v1_213_private-cybernet-police": {
    sourceDefinitionId: "onr_v1_213_private-cybernet-police",
    sourceZone: "scored_agenda",
    family: "trace_tag",
    traceBase: 5,
  },
  "onr_v1_208_on-call-solo-team": {
    sourceDefinitionId: "onr_v1_208_on-call-solo-team",
    sourceZone: "scored_agenda",
    family: "tagged_meat_damage",
    damageType: "meat",
    damageAmount: 1,
    requiresRunnerTagged: true,
  },
  "onr_v1_217_strike-force-kali": {
    sourceDefinitionId: "onr_v1_217_strike-force-kali",
    sourceZone: "scored_agenda",
    family: "tagged_meat_damage",
    damageType: "meat",
    damageAmount: 2,
    requiresRunnerTagged: true,
  },
  "onr_v1_310_blood-cat": {
    sourceDefinitionId: "onr_v1_310_blood-cat",
    sourceZone: "installed_corp_root",
    family: "trace_tag",
    traceBase: 5,
  },
  "onr_v1_342_solo-squad": {
    sourceDefinitionId: "onr_v1_342_solo-squad",
    sourceZone: "installed_corp_root",
    family: "tagged_meat_damage",
    damageType: "meat",
    damageAmount: 1,
    requiresRunnerTagged: true,
  },
};

export function corpTraceDamageAbilityProfileForDefinitionId(
  definitionId: string,
): CorpTraceDamageAbilityProfile | undefined {
  return CORP_TRACE_DAMAGE_ABILITY_PROFILES[definitionId];
}

export function buildCorpTraceDamageAbilityActionsForCard(
  host: CorpTraceDamageAbilityHost,
  sourceCardId: CardInstanceId,
): CorpTraceDamageAbilityLegalActionResult {
  const definition = host.cards.definitionFor(sourceCardId);
  const profile = corpTraceDamageAbilityProfileForDefinitionId(definition.id);
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
  const profile = corpTraceDamageAbilityProfileForDefinitionId(definition.id);
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
