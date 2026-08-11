import {
  CapabilityIdentityError,
  canonicalCapabilityId,
  assertAbilityRefIdentity,
  cardSpecImplementationById,
  engineCardByDefinitionId,
  parseCanonicalCapabilityId,
  type CanonicalCapabilityId,
  type CapabilityKey,
  type EngineCardView,
} from "@netgrid/cards/engine";
import type {
  AbilityRef,
  CardDefinition,
  CardInstanceId,
  LegalAction,
} from "@netgrid/shared";
import type {
  ActivatedCardAbilityImplementation,
  CardLifecycleImplementation,
  CardLifecycleTriggeredAbilityImplementation,
  OnPlayCardAbilityImplementation,
} from "./definition-types";

export type CardCapabilityBindingErrorCode =
  | "missing_definition_authority"
  | "invalid_canonical_ability_binding"
  | "wrong_canonical_definition"
  | "unknown_activated_capability"
  | "ambiguous_activated_capability"
  | "ambiguous_on_play_capability"
  | "wrong_activated_capability_kind"
  | "ability_binding_mode_mismatch"
  | "ability_ref_mismatch";

export class CardCapabilityBindingError extends Error {
  readonly code: CardCapabilityBindingErrorCode;

  constructor(code: CardCapabilityBindingErrorCode, message: string) {
    super(message);
    this.name = "CardCapabilityBindingError";
    this.code = code;
  }
}

export type ActivatedAbilityBinding = {
  kind: "card_spec_capability_key";
  ability: ActivatedCardAbilityImplementation;
  capabilityKey: CapabilityKey;
  sourceAbilityId: CanonicalCapabilityId;
};

export type OnPlayAbilityBinding = {
  kind: "card_spec_capability_key";
  ability: OnPlayCardAbilityImplementation;
  capabilityKey: CapabilityKey;
  sourceAbilityId: CanonicalCapabilityId;
};

export type EndOfRunnerTurnAbilityBinding = {
  kind: "card_spec_capability_key";
  ability: CardLifecycleTriggeredAbilityImplementation;
  capabilityKey: CapabilityKey;
  sourceAbilityId: CanonicalCapabilityId;
};

export type CardCapabilityAuthoritySources = {
  engineCardForDefinitionId: (
    definitionId: CardDefinition["id"],
  ) => EngineCardView | undefined;
};

const DEFAULT_AUTHORITY_SOURCES: CardCapabilityAuthoritySources = {
  engineCardForDefinitionId: engineCardByDefinitionId,
};

function authorityForDefinition(
  definition: CardDefinition,
  sources: CardCapabilityAuthoritySources,
): EngineCardView | undefined {
  return sources.engineCardForDefinitionId(definition.id);
}

export function lifecycleForDefinition(
  definition: CardDefinition,
  sources: CardCapabilityAuthoritySources = DEFAULT_AUTHORITY_SOURCES,
): CardLifecycleImplementation | undefined {
  return authorityForDefinition(definition, sources)?.engine.lifecycle as
    | CardLifecycleImplementation
    | undefined;
}

export function onPlayAbilityForCapabilityIdentity(
  definition: CardDefinition,
  identity: {
    kind: "card_spec_capability_key";
    sourceCapabilityId: string;
  },
  sources: CardCapabilityAuthoritySources = DEFAULT_AUTHORITY_SOURCES,
): OnPlayCardAbilityImplementation | undefined {
  const engineCard = authorityForDefinition(definition, sources);
  if (!engineCard) return undefined;
  let parsed: ReturnType<typeof parseCanonicalCapabilityId>;
  try {
    parsed = parseCanonicalCapabilityId(identity.sourceCapabilityId);
  } catch (error) {
    if (error instanceof CapabilityIdentityError) return undefined;
    throw error;
  }
  if (parsed.cardDefinitionId !== definition.id) return undefined;
  const matches = (engineCard.engine.abilities ?? []).filter(
    (ability) => ability.capabilityKey === parsed.capabilityKey,
  );
  if (matches.length !== 1 || matches[0]?.kind !== "on_play") return undefined;
  return matches[0] as unknown as OnPlayCardAbilityImplementation;
}

export function onPlayAbilityBindingForDefinition(
  definition: CardDefinition,
  sources: CardCapabilityAuthoritySources = DEFAULT_AUTHORITY_SOURCES,
): OnPlayAbilityBinding | undefined {
  const engineCard = authorityForDefinition(definition, sources);
  if (!engineCard) return undefined;
  const matches = (engineCard.engine.abilities ?? []).filter(
    (ability) => ability.kind === "on_play",
  );
  if (matches.length > 1)
    throw new CardCapabilityBindingError(
      "ambiguous_on_play_capability",
      "Die generische On-play-Aktion besitzt mehrere moegliche CardSpec-Capabilities.",
    );
  const ability = matches[0];
  if (!ability) return undefined;
  return {
    kind: "card_spec_capability_key",
    ability: ability as unknown as OnPlayCardAbilityImplementation,
    capabilityKey: ability.capabilityKey,
    sourceAbilityId: canonicalCapabilityId(
      definition.id,
      ability.capabilityKey,
    ),
  };
}

export function onPlayAbilityBindingPayload(
  binding: OnPlayAbilityBinding,
): Record<string, string | number | boolean> {
  return {
    cardImplementationCapabilityBindingKind: "card_spec_capability_key",
    cardImplementationAbilityKey: binding.capabilityKey,
    cardImplementationAbilityId: binding.sourceAbilityId,
  };
}

export function endOfRunnerTurnAbilityBindingsForDefinition(
  definition: CardDefinition,
  sources: CardCapabilityAuthoritySources = DEFAULT_AUTHORITY_SOURCES,
): readonly EndOfRunnerTurnAbilityBinding[] {
  const engineCard = authorityForDefinition(definition, sources);
  if (!engineCard) return [];
  return (engineCard.engine.lifecycle?.end_of_runner_turn ?? []).map(
    (ability) => ({
      kind: "card_spec_capability_key" as const,
      ability: ability as CardLifecycleTriggeredAbilityImplementation,
      capabilityKey: ability.capabilityKey,
      sourceAbilityId: canonicalCapabilityId(
        definition.id,
        ability.capabilityKey,
      ),
    }),
  );
}

export function endOfRunnerTurnBindingPayload(
  binding: EndOfRunnerTurnAbilityBinding,
): Record<string, string | number | boolean> {
  return {
    cardImplementationCapabilityBindingKind: "card_spec_capability_key",
    cardImplementationAbilityKey: binding.capabilityKey,
    cardImplementationAbilityId: binding.sourceAbilityId,
  };
}

export function endOfRunnerTurnAbilityBindingForLegalAction(
  definition: CardDefinition,
  legalAction: LegalAction,
  sources: CardCapabilityAuthoritySources = DEFAULT_AUTHORITY_SOURCES,
): EndOfRunnerTurnAbilityBinding {
  const engineCard = authorityForDefinition(definition, sources);
  if (!engineCard)
    throw new CardCapabilityBindingError(
      "missing_definition_authority",
      `Die Kartendefinition ${definition.id} besitzt keine CardSpec-Mechanikautoritaet.`,
    );
  assertCanonicalBindingMode(legalAction, "Lifecycle");
  const canonical = assertCanonicalPayloadBinding(definition, legalAction);
  const matches = (engineCard.engine.lifecycle?.end_of_runner_turn ?? []).filter(
    (ability) => ability.capabilityKey === canonical.capabilityKey,
  );
  if (matches.length === 0)
    throw new CardCapabilityBindingError(
      "unknown_activated_capability",
      "Die kanonische Lifecycle-Faehigkeit existiert nicht auf der Quellkarte.",
    );
  if (matches.length > 1)
    throw new CardCapabilityBindingError(
      "ambiguous_activated_capability",
      "Die kanonische Lifecycle-Faehigkeit ist auf der Quellkarte mehrdeutig.",
    );
  return {
    kind: "card_spec_capability_key",
    ability: matches[0] as CardLifecycleTriggeredAbilityImplementation,
    capabilityKey: canonical.capabilityKey,
    sourceAbilityId: canonical.sourceAbilityId,
  };
}

export function activatedAbilityBindingsForDefinition(
  definition: CardDefinition,
  sources: CardCapabilityAuthoritySources = DEFAULT_AUTHORITY_SOURCES,
): readonly ActivatedAbilityBinding[] {
  const engineCard = authorityForDefinition(definition, sources);
  if (!engineCard) return [];
  return (engineCard.engine.abilities ?? [])
    .filter((ability) => ability.kind === "activated")
    .map((ability) => {
      const projectedAbility =
        sources === DEFAULT_AUTHORITY_SOURCES
          ? cardSpecImplementationById(definition.id)?.abilities?.find(
              (candidate) =>
                candidate.kind === "activated" &&
                "capabilityKey" in candidate &&
                candidate.capabilityKey === ability.capabilityKey,
            )
          : undefined;
      return {
        kind: "card_spec_capability_key" as const,
        ability: (projectedAbility ??
          ability) as ActivatedCardAbilityImplementation,
        capabilityKey: ability.capabilityKey,
        sourceAbilityId: canonicalCapabilityId(
          definition.id,
          ability.capabilityKey,
        ),
      };
    });
}

function assertCanonicalBindingMode(
  legalAction: LegalAction,
  label: string,
): void {
  const hasLegacyIndex =
    legalAction.payload?.cardImplementationAbilityIndex !== undefined ||
    legalAction.payload?.cardImplementationLifecycleAbilityIndex !== undefined;
  const hasCanonicalKey =
    legalAction.payload?.cardImplementationAbilityKey !== undefined;
  const hasCanonicalId =
    legalAction.payload?.cardImplementationAbilityId !== undefined;
  if (
    hasLegacyIndex ||
    !hasCanonicalKey ||
    !hasCanonicalId ||
    legalAction.payload?.cardImplementationCapabilityBindingKind !==
      "card_spec_capability_key"
  )
    throw new CardCapabilityBindingError(
      "ability_binding_mode_mismatch",
      `Eine ${label}-Kartenfaehigkeit muss ausschliesslich per kanonischem CapabilityKey gebunden sein.`,
    );
}

function assertCanonicalPayloadBinding(
  definition: CardDefinition,
  legalAction: LegalAction,
): { capabilityKey: CapabilityKey; sourceAbilityId: CanonicalCapabilityId } {
  const rawCapabilityKey = legalAction.payload?.cardImplementationAbilityKey;
  const rawSourceAbilityId = legalAction.payload?.cardImplementationAbilityId;
  if (
    typeof rawCapabilityKey !== "string" ||
    typeof rawSourceAbilityId !== "string"
  )
    throw new CardCapabilityBindingError(
      "invalid_canonical_ability_binding",
      "Die kanonische Kartenfaehigkeitsbindung ist unvollstaendig.",
    );
  let parsed: ReturnType<typeof parseCanonicalCapabilityId>;
  try {
    parsed = parseCanonicalCapabilityId(rawSourceAbilityId);
  } catch (error) {
    if (error instanceof CapabilityIdentityError)
      throw new CardCapabilityBindingError(
        "invalid_canonical_ability_binding",
        "Die kanonische Kartenfaehigkeits-ID ist ungueltig.",
      );
    throw error;
  }
  if (parsed.cardDefinitionId !== definition.id)
    throw new CardCapabilityBindingError(
      "wrong_canonical_definition",
      "Die kanonische Kartenfaehigkeit gehoert zu einer anderen Definition.",
    );
  if (parsed.capabilityKey !== rawCapabilityKey)
    throw new CardCapabilityBindingError(
      "invalid_canonical_ability_binding",
      "CapabilityKey und kanonische Kartenfaehigkeits-ID widersprechen sich.",
    );
  return {
    capabilityKey: parsed.capabilityKey,
    sourceAbilityId: rawSourceAbilityId as CanonicalCapabilityId,
  };
}

export function activatedAbilityBindingForLegalAction(
  definition: CardDefinition,
  legalAction: LegalAction,
  sources: CardCapabilityAuthoritySources = DEFAULT_AUTHORITY_SOURCES,
): ActivatedAbilityBinding {
  const engineCard = authorityForDefinition(definition, sources);
  if (!engineCard)
    throw new CardCapabilityBindingError(
      "missing_definition_authority",
      `Die Kartendefinition ${definition.id} besitzt keine CardSpec-Mechanikautoritaet.`,
    );
  assertCanonicalBindingMode(legalAction, "aktivierte");
  const canonical = assertCanonicalPayloadBinding(definition, legalAction);
  const matches = (engineCard.engine.abilities ?? []).filter(
    (ability) => ability.capabilityKey === canonical.capabilityKey,
  );
  if (matches.length === 0)
    throw new CardCapabilityBindingError(
      "unknown_activated_capability",
      "Die kanonische Kartenfaehigkeit existiert nicht auf der Quellkarte.",
    );
  if (matches.length > 1)
    throw new CardCapabilityBindingError(
      "ambiguous_activated_capability",
      "Die kanonische Kartenfaehigkeit ist auf der Quellkarte mehrdeutig.",
    );
  const [ability] = matches;
  if (!ability || ability.kind !== "activated")
    throw new CardCapabilityBindingError(
      "wrong_activated_capability_kind",
      "Die kanonische Kartenfaehigkeit ist keine aktivierte Faehigkeit.",
    );
  return {
    kind: "card_spec_capability_key",
    ability: ability as ActivatedCardAbilityImplementation,
    capabilityKey: canonical.capabilityKey,
    sourceAbilityId: canonical.sourceAbilityId,
  };
}

export function activatedAbilityBindingPayload(
  binding: ActivatedAbilityBinding,
): Record<string, string | number | boolean> {
  return {
    cardImplementationCapabilityBindingKind: "card_spec_capability_key",
    cardImplementationAbilityKey: binding.capabilityKey,
    cardImplementationAbilityId: binding.sourceAbilityId,
  };
}

export function activatedAbilityBindingForPersistedIdentity(
  definition: CardDefinition,
  identity: { sourceAbilityId: string },
  sources: CardCapabilityAuthoritySources = DEFAULT_AUTHORITY_SOURCES,
): ActivatedAbilityBinding {
  const matches = activatedAbilityBindingsForDefinition(
    definition,
    sources,
  ).filter((binding) => binding.sourceAbilityId === identity.sourceAbilityId);
  if (matches.length === 0)
    throw new CardCapabilityBindingError(
      "unknown_activated_capability",
      "Die persistierte Kartenfaehigkeit existiert nicht mehr auf der Quellkarte.",
    );
  if (matches.length > 1)
    throw new CardCapabilityBindingError(
      "ambiguous_activated_capability",
      "Die persistierte Kartenfaehigkeit ist auf der Quellkarte mehrdeutig.",
    );
  return matches[0]!;
}

export function abilityRefForActivatedBinding(
  sourceCardInstanceId: CardInstanceId,
  binding: ActivatedAbilityBinding,
): AbilityRef {
  return { sourceCardInstanceId, sourceAbilityId: binding.sourceAbilityId };
}

export function assertAbilityRefMatchesActivatedBinding(
  legalAction: LegalAction,
  sourceCardInstanceId: CardInstanceId,
  binding: ActivatedAbilityBinding,
): void {
  const expected = abilityRefForActivatedBinding(sourceCardInstanceId, binding);
  const actual = legalAction.abilityRef;
  assertAbilityRefIdentity(actual);
  const matches =
    actual?.sourceCardInstanceId === expected.sourceCardInstanceId &&
    actual.sourceAbilityId === expected.sourceAbilityId;
  if (!matches)
    throw new CardCapabilityBindingError(
      "ability_ref_mismatch",
      "Die AbilityRef stimmt nicht mit der exakt gebundenen Kartenfaehigkeit ueberein.",
    );
}
