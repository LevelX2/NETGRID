import {
  isCanonicalCapabilityId,
  type AbilityRef,
  type CanonicalCapabilityId,
  type CardDefinitionId,
} from "@netgrid/shared";
import { CARD_CAPABILITY_IDS } from "./generated/card-capability-ids";
export type { CanonicalCapabilityId } from "@netgrid/shared";

const CAPABILITY_KEY_PATTERN = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;

declare const capabilityKeyBrand: unique symbol;
declare const abilityKeyBrand: unique symbol;

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
  | "invalid_canonical_capability_id"
  | "invalid_ability_ref"
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

export function cardDefinitionId(value: number): CardDefinitionId {
  if (!Number.isSafeInteger(value) || value <= 0)
    throw new CapabilityIdentityError(
      "invalid_card_definition_id",
      "cardDefinitionId",
      "must be a positive safe integer",
    );
  return value;
}

export function abilityKey(value: string): AbilityKey {
  assertKeyText(value, "abilityKey");
  return value as AbilityKey;
}

export type CapabilityIdentityLedger = readonly (
  readonly [CardDefinitionId, string] | null
)[];

export type ResolveCapabilityId = (
  definitionId: CardDefinitionId,
  key: CapabilityKey,
) => CanonicalCapabilityId;

export function createCapabilityIdentityRegistry(ledger: CapabilityIdentityLedger) {
  const byCard = new Map<CardDefinitionId, Map<CapabilityKey, CanonicalCapabilityId>>();
  const byId = new Map<CanonicalCapabilityId, {
    cardDefinitionId: CardDefinitionId;
    capabilityKey: CapabilityKey;
    canonicalCapabilityId: CanonicalCapabilityId;
  }>();
  for (const [index, entry] of ledger.entries()) {
    if (entry === null) continue;
    const definitionId = cardDefinitionId(entry[0]);
    const key = capabilityKey(entry[1]);
    const id = index + 1;
    let capabilities = byCard.get(definitionId);
    if (!capabilities) {
      capabilities = new Map();
      byCard.set(definitionId, capabilities);
    }
    if (capabilities.has(key))
      throw new CapabilityIdentityError(
        "invalid_canonical_capability_id",
        String(id),
        "capability is already assigned an identity",
      );
    capabilities.set(key, id);
    byId.set(id, Object.freeze({
      cardDefinitionId: definitionId,
      capabilityKey: key,
      canonicalCapabilityId: id,
    }));
  }
  const idFor: ResolveCapabilityId = (definitionId, key) => {
    const id = byCard.get(definitionId)?.get(key);
    if (id === undefined)
      throw new CapabilityIdentityError(
        "invalid_canonical_capability_id",
        String(definitionId) + ":" + key,
        "capability has no assigned identity",
      );
    return id;
  };
  function resolve(value: unknown) {
    const capability = isCanonicalCapabilityId(value) ? byId.get(value) : undefined;
    if (capability === undefined)
      throw new CapabilityIdentityError(
        "invalid_canonical_capability_id",
        "canonicalCapabilityId",
        "must be an assigned positive numeric capability ID",
      );
    return capability;
  }
  return { idFor, resolve };
}

const productCapabilityIdentities = createCapabilityIdentityRegistry(CARD_CAPABILITY_IDS);

export const canonicalCapabilityId = productCapabilityIdentities.idFor;
export const parseCanonicalCapabilityId = productCapabilityIdentities.resolve;

export function assertCanonicalCapabilityId(
  value: unknown,
): asserts value is CanonicalCapabilityId {
  parseCanonicalCapabilityId(value);
}

export function assertAbilityRefIdentity(
  value: unknown,
): asserts value is AbilityRef {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new CapabilityIdentityError(
      "invalid_ability_ref",
      String(value),
      "AbilityRef must be an object",
    );
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  const expectedKeys = ["sourceAbilityId", "sourceCardInstanceId"];
  if (
    !isCanonicalCapabilityId(record.sourceAbilityId) ||
    typeof record.sourceCardInstanceId !== "string" ||
    record.sourceCardInstanceId.trim().length === 0 ||
    keys.length !== expectedKeys.length ||
    keys.some((key, index) => key !== expectedKeys[index])
  )
    throw new CapabilityIdentityError(
      "invalid_ability_ref",
      JSON.stringify(value),
      "AbilityRef must contain exactly one canonical capability identity",
    );
  assertCanonicalCapabilityId(record.sourceAbilityId);
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
