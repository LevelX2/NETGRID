import type { CardDefinitionId } from "@netgrid/shared";

declare const capabilityKeyBrand: unique symbol;
declare const abilityKeyBrand: unique symbol;
declare const canonicalCapabilityIdBrand: unique symbol;

/** Stable semantic identity within one CardSpec. */
export type CapabilityKey = string & {
  readonly [capabilityKeyBrand]: "CapabilityKey";
};

/**
 * Specialized alias in the same semantic key domain for activated abilities.
 * It is never a parallel identifier and must equal capabilityKey at runtime.
 */
export type AbilityKey = CapabilityKey & {
  readonly [abilityKeyBrand]: "AbilityKey";
};

export type CanonicalCapabilityId = `${CardDefinitionId}:${CapabilityKey}` & {
  readonly [canonicalCapabilityIdBrand]: "CanonicalCapabilityId";
};

export type CapabilityAddressability =
  | "plan"
  | "action"
  | "choice"
  | "quote"
  | "debug";

export type AddressableCapabilityContract = {
  capabilityKey: CapabilityKey;
  addressability: readonly CapabilityAddressability[];
  abilityKey?: AbilityKey;
};

export type CapabilityIdentityErrorCode =
  | "invalid_card_definition_id"
  | "invalid_capability_key"
  | "ability_key_mismatch";

export class CapabilityIdentityError extends Error {
  readonly name = "CapabilityIdentityError";

  constructor(
    readonly code: CapabilityIdentityErrorCode,
    readonly path: string,
    message: string,
  ) {
    super(`${code} at ${path}: ${message}`);
  }
}

export function capabilityKey(value: string): CapabilityKey {
  assertKeyText(value, "capabilityKey");
  return value as CapabilityKey;
}

export function cardDefinitionId(value: string): CardDefinitionId {
  if (
    value.length === 0 ||
    value.length > 192 ||
    !CARD_DEFINITION_ID_PATTERN.test(value)
  )
    throw new CapabilityIdentityError(
      "invalid_card_definition_id",
      "cardDefinitionId",
      "must use the existing lower-case ASCII definition-id syntax",
    );
  return value as CardDefinitionId;
}

export function abilityKey(value: string): AbilityKey {
  assertKeyText(value, "abilityKey");
  return value as AbilityKey;
}

export function canonicalCapabilityId(
  definitionId: CardDefinitionId,
  key: CapabilityKey,
): CanonicalCapabilityId {
  cardDefinitionId(definitionId);
  assertKeyText(key, "capabilityKey");
  return `${definitionId}:${key}` as CanonicalCapabilityId;
}

export function assertAbilityKeyAlias(
  capability: Pick<
    AddressableCapabilityContract,
    "capabilityKey" | "abilityKey"
  >,
  path = "capability",
): void {
  if (
    capability.abilityKey !== undefined &&
    capability.abilityKey !== capability.capabilityKey
  )
    throw new CapabilityIdentityError(
      "ability_key_mismatch",
      path,
      "abilityKey must be the same string value as capabilityKey",
    );
}

const CAPABILITY_KEY_PATTERN = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;
const CARD_DEFINITION_ID_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

function assertKeyText(value: string, path: string): void {
  if (
    value.length === 0 ||
    value.length > 128 ||
    !CAPABILITY_KEY_PATTERN.test(value)
  )
    throw new CapabilityIdentityError(
      "invalid_capability_key",
      path,
      "must be 1..128 ASCII characters in lower-case semantic key syntax",
    );
}
