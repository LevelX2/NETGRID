import {
  CapabilityIdentityError,
  canonicalCapabilityId,
  assertAbilityRefIdentity,
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
import { legacyCardImplementationForDefinitionId } from "../card-implementations/registry";
import type { CardImplementationDefinition } from "../card-implementations/types";
import type { ActivatedCardAbilityImplementation } from "./definition-types";
import type {
  CardLifecycleImplementation,
  CardLifecycleTriggeredAbilityImplementation,
  OnPlayCardAbilityImplementation,
} from "./definition-types";

export type CardCapabilityBindingErrorCode =
  | "hybrid_definition_authority"
  | "missing_definition_authority"
  | "invalid_legacy_ability_index"
  | "invalid_canonical_ability_binding"
  | "wrong_canonical_definition"
  | "unknown_activated_capability"
  | "ambiguous_activated_capability"
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

export type LegacyActivatedAbilityBinding = {
  kind: "legacy_card_implementation_index";
  ability: ActivatedCardAbilityImplementation;
  abilityIndex: number;
};

export type CanonicalActivatedAbilityBinding = {
  kind: "card_spec_capability_key";
  ability: ActivatedCardAbilityImplementation;
  capabilityKey: CapabilityKey;
  sourceAbilityId: CanonicalCapabilityId;
};

export type ActivatedAbilityBinding =
  | LegacyActivatedAbilityBinding
  | CanonicalActivatedAbilityBinding;

export type EndOfRunnerTurnAbilityBinding =
  | {
      kind: "legacy_card_implementation_index";
      ability: CardLifecycleTriggeredAbilityImplementation;
      abilityIndex: number;
    }
  | {
      kind: "card_spec_capability_key";
      ability: CardLifecycleTriggeredAbilityImplementation;
      capabilityKey: CapabilityKey;
      sourceAbilityId: CanonicalCapabilityId;
    };

export type CardCapabilityAuthoritySources = {
  engineCardForDefinitionId: (
    definitionId: CardDefinition["id"],
  ) => EngineCardView | undefined;
  legacyImplementationForDefinitionId: (
    definitionId: CardDefinition["id"],
  ) => CardImplementationDefinition | undefined;
};

const DEFAULT_AUTHORITY_SOURCES: CardCapabilityAuthoritySources = {
  engineCardForDefinitionId: engineCardByDefinitionId,
  legacyImplementationForDefinitionId: legacyCardImplementationForDefinitionId,
};

type CardCapabilityAuthority =
  | {
      kind: "legacy_card_implementation_index";
      implementation: CardImplementationDefinition;
    }
  | { kind: "card_spec_capability_key"; engineCard: EngineCardView };

function authorityForDefinition(
  definition: CardDefinition,
  sources: CardCapabilityAuthoritySources,
): CardCapabilityAuthority | undefined {
  const engineCard = sources.engineCardForDefinitionId(definition.id);
  const implementation = sources.legacyImplementationForDefinitionId(
    definition.id,
  );
  if (engineCard && implementation)
    throw new CardCapabilityBindingError(
      "hybrid_definition_authority",
      `Die Kartendefinition ${definition.id} besitzt gleichzeitig CardSpec- und Legacy-Mechanikautoritaet.`,
    );
  if (engineCard) return { kind: "card_spec_capability_key", engineCard };
  if (implementation)
    return { kind: "legacy_card_implementation_index", implementation };
  return undefined;
}

export function lifecycleForDefinition(
  definition: CardDefinition,
  sources: CardCapabilityAuthoritySources = DEFAULT_AUTHORITY_SOURCES,
): CardLifecycleImplementation | undefined {
  const authority = authorityForDefinition(definition, sources);
  return authority?.kind === "legacy_card_implementation_index"
    ? authority.implementation.lifecycle
    : (authority?.engineCard.engine.lifecycle as
        | CardLifecycleImplementation
        | undefined);
}

export function onPlayAbilityForCapabilityIdentity(
  definition: CardDefinition,
  identity: {
    kind: "legacy_card_implementation_index" | "card_spec_capability_key";
    sourceCapabilityId: string;
  },
  sources: CardCapabilityAuthoritySources = DEFAULT_AUTHORITY_SOURCES,
): OnPlayCardAbilityImplementation | undefined {
  const authority = authorityForDefinition(definition, sources);
  if (!authority) return undefined;
  if (identity.kind !== authority.kind)
    throw new CardCapabilityBindingError(
      "ability_binding_mode_mismatch",
      "Die Quote-Capability verwendet nicht die Mechanikautoritaet ihrer Definition.",
    );
  if (authority.kind === "legacy_card_implementation_index") {
    const match = /^ability:on_play:(0|[1-9]\d*)$/.exec(
      identity.sourceCapabilityId,
    );
    if (!match) return undefined;
    const ability = authority.implementation.abilities?.[Number(match[1])];
    return ability?.kind === "on_play" ? ability : undefined;
  }
  let parsed: ReturnType<typeof parseCanonicalCapabilityId>;
  try {
    parsed = parseCanonicalCapabilityId(identity.sourceCapabilityId);
  } catch (error) {
    if (error instanceof CapabilityIdentityError) return undefined;
    throw error;
  }
  if (parsed.cardDefinitionId !== definition.id) return undefined;
  const matches = (authority.engineCard.engine.abilities ?? []).filter(
    (ability) => ability.capabilityKey === parsed.capabilityKey,
  );
  if (matches.length !== 1 || matches[0]?.kind !== "on_play") return undefined;
  return matches[0] as unknown as OnPlayCardAbilityImplementation;
}

export function endOfRunnerTurnAbilityBindingsForDefinition(
  definition: CardDefinition,
  sources: CardCapabilityAuthoritySources = DEFAULT_AUTHORITY_SOURCES,
): readonly EndOfRunnerTurnAbilityBinding[] {
  const authority = authorityForDefinition(definition, sources);
  if (!authority) return [];
  if (authority.kind === "legacy_card_implementation_index")
    return (authority.implementation.lifecycle?.end_of_runner_turn ?? []).map(
      (ability, abilityIndex) => ({
        kind: "legacy_card_implementation_index" as const,
        ability,
        abilityIndex,
      }),
    );
  return (authority.engineCard.engine.lifecycle?.end_of_runner_turn ?? []).map(
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
  return binding.kind === "legacy_card_implementation_index"
    ? { cardImplementationLifecycleAbilityIndex: binding.abilityIndex }
    : {
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
  const authority = authorityForDefinition(definition, sources);
  if (!authority)
    throw new CardCapabilityBindingError(
      "missing_definition_authority",
      `Die Kartendefinition ${definition.id} besitzt keine Mechanikautoritaet.`,
    );
  const hasLegacyIndex =
    legalAction.payload?.cardImplementationLifecycleAbilityIndex !== undefined;
  const hasCanonicalKey =
    legalAction.payload?.cardImplementationAbilityKey !== undefined;
  const hasCanonicalId =
    legalAction.payload?.cardImplementationAbilityId !== undefined;
  const bindingKind =
    legalAction.payload?.cardImplementationCapabilityBindingKind;
  if (authority.kind === "legacy_card_implementation_index") {
    if (
      hasCanonicalKey ||
      hasCanonicalId ||
      bindingKind !== undefined ||
      !hasLegacyIndex
    )
      throw new CardCapabilityBindingError(
        "ability_binding_mode_mismatch",
        "Eine Legacy-Lifecycle-Faehigkeit muss ausschliesslich per Index gebunden sein.",
      );
    const abilityIndex = Number(
      legalAction.payload?.cardImplementationLifecycleAbilityIndex,
    );
    const ability =
      authority.implementation.lifecycle?.end_of_runner_turn?.[abilityIndex];
    if (!Number.isInteger(abilityIndex) || abilityIndex < 0 || !ability)
      throw new CardCapabilityBindingError(
        "unknown_activated_capability",
        "Die Legacy-Lifecycle-Faehigkeit passt nicht zur Quellkarte.",
      );
    return {
      kind: "legacy_card_implementation_index",
      ability,
      abilityIndex,
    };
  }
  if (
    hasLegacyIndex ||
    !hasCanonicalKey ||
    !hasCanonicalId ||
    bindingKind !== "card_spec_capability_key"
  )
    throw new CardCapabilityBindingError(
      "ability_binding_mode_mismatch",
      "Eine CardSpec-Lifecycle-Faehigkeit muss ausschliesslich per CapabilityKey gebunden sein.",
    );
  const canonical = assertCanonicalPayloadBinding(definition, legalAction);
  const matches = (
    authority.engineCard.engine.lifecycle?.end_of_runner_turn ?? []
  ).filter((ability) => ability.capabilityKey === canonical.capabilityKey);
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
  const authority = authorityForDefinition(definition, sources);
  if (!authority) return [];
  if (authority.kind === "legacy_card_implementation_index")
    return (
      authority.implementation.abilities
        ?.map((ability, abilityIndex) => ({ ability, abilityIndex }))
        .filter(
          (
            entry,
          ): entry is {
            ability: ActivatedCardAbilityImplementation;
            abilityIndex: number;
          } => entry.ability.kind === "activated",
        )
        .map(({ ability, abilityIndex }) => ({
          kind: "legacy_card_implementation_index" as const,
          ability,
          abilityIndex,
        })) ?? []
    );

  return (authority.engineCard.engine.abilities ?? [])
    .filter((ability) => ability.kind === "activated")
    .map((ability) => ({
      kind: "card_spec_capability_key" as const,
      ability: ability as ActivatedCardAbilityImplementation,
      capabilityKey: ability.capabilityKey,
      sourceAbilityId: canonicalCapabilityId(
        definition.id,
        ability.capabilityKey,
      ),
    }));
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
  const parsed = parseCanonicalCapabilityId(rawSourceAbilityId);
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
  const authority = authorityForDefinition(definition, sources);
  if (!authority)
    throw new CardCapabilityBindingError(
      "missing_definition_authority",
      `Die Kartendefinition ${definition.id} besitzt keine Mechanikautoritaet.`,
    );
  const hasLegacyIndex =
    legalAction.payload?.cardImplementationAbilityIndex !== undefined;
  const hasCanonicalKey =
    legalAction.payload?.cardImplementationAbilityKey !== undefined;
  const hasCanonicalId =
    legalAction.payload?.cardImplementationAbilityId !== undefined;
  const bindingKind =
    legalAction.payload?.cardImplementationCapabilityBindingKind;

  if (authority.kind === "legacy_card_implementation_index") {
    if (
      hasCanonicalKey ||
      hasCanonicalId ||
      bindingKind !== undefined ||
      !hasLegacyIndex
    )
      throw new CardCapabilityBindingError(
        "ability_binding_mode_mismatch",
        "Eine Legacy-Kartenfaehigkeit muss ausschliesslich per Ability-Index gebunden sein.",
      );
    const abilityIndex = Number(
      legalAction.payload?.cardImplementationAbilityIndex,
    );
    if (!Number.isInteger(abilityIndex) || abilityIndex < 0)
      throw new CardCapabilityBindingError(
        "invalid_legacy_ability_index",
        "Die Legacy-Kartenfaehigkeit hat keinen gueltigen Index.",
      );
    const ability = authority.implementation.abilities?.[abilityIndex];
    if (!ability || ability.kind !== "activated")
      throw new CardCapabilityBindingError(
        "unknown_activated_capability",
        "Die Legacy-Kartenfaehigkeit passt nicht zur Quellkarte.",
      );
    return {
      kind: "legacy_card_implementation_index",
      ability,
      abilityIndex,
    };
  }

  if (
    hasLegacyIndex ||
    !hasCanonicalKey ||
    !hasCanonicalId ||
    bindingKind !== "card_spec_capability_key"
  )
    throw new CardCapabilityBindingError(
      "ability_binding_mode_mismatch",
      "Eine CardSpec-Kartenfaehigkeit muss ausschliesslich per kanonischem CapabilityKey gebunden sein.",
    );
  const canonical = assertCanonicalPayloadBinding(definition, legalAction);
  const matches = (authority.engineCard.engine.abilities ?? []).filter(
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
  return binding.kind === "legacy_card_implementation_index"
    ? { cardImplementationAbilityIndex: binding.abilityIndex }
    : {
        cardImplementationCapabilityBindingKind: "card_spec_capability_key",
        cardImplementationAbilityKey: binding.capabilityKey,
        cardImplementationAbilityId: binding.sourceAbilityId,
      };
}

export function activatedAbilityBindingForPersistedIdentity(
  definition: CardDefinition,
  identity:
    | { abilityIndex: number; sourceAbilityId?: never }
    | { sourceAbilityId: string; abilityIndex?: never },
  sources: CardCapabilityAuthoritySources = DEFAULT_AUTHORITY_SOURCES,
): ActivatedAbilityBinding {
  const hasLegacyIndex = identity.abilityIndex !== undefined;
  const hasCanonicalId = identity.sourceAbilityId !== undefined;
  if (hasLegacyIndex === hasCanonicalId)
    throw new CardCapabilityBindingError(
      "ability_binding_mode_mismatch",
      "Eine persistierte Kartenfaehigkeit braucht genau eine Legacy- oder kanonische Identitaet.",
    );
  const bindings = activatedAbilityBindingsForDefinition(definition, sources);
  const matches = hasLegacyIndex
    ? bindings.filter(
        (binding) =>
          binding.kind === "legacy_card_implementation_index" &&
          binding.abilityIndex === identity.abilityIndex,
      )
    : bindings.filter(
        (binding) =>
          binding.kind === "card_spec_capability_key" &&
          binding.sourceAbilityId === identity.sourceAbilityId,
      );
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
): AbilityRef | undefined {
  return binding.kind === "legacy_card_implementation_index"
    ? undefined
    : { sourceCardInstanceId, sourceAbilityId: binding.sourceAbilityId };
}

export function assertAbilityRefMatchesActivatedBinding(
  legalAction: LegalAction,
  sourceCardInstanceId: CardInstanceId,
  binding: ActivatedAbilityBinding,
): void {
  const expected = abilityRefForActivatedBinding(sourceCardInstanceId, binding);
  const actual = legalAction.abilityRef;
  if (expected === undefined) {
    if (actual !== undefined)
      throw new CardCapabilityBindingError(
        "ability_ref_mismatch",
        "Eine Legacy-Indexfaehigkeit darf keine kanonische AbilityRef vortaeuschen.",
      );
    return;
  }
  assertAbilityRefIdentity(actual);
  const matches =
    actual?.sourceCardInstanceId === expected.sourceCardInstanceId &&
    actual.sourceAbilityId === expected.sourceAbilityId &&
    actual.abilityId === undefined;
  if (!matches)
    throw new CardCapabilityBindingError(
      "ability_ref_mismatch",
      "Die AbilityRef stimmt nicht mit der exakt gebundenen Kartenfaehigkeit ueberein.",
    );
}
