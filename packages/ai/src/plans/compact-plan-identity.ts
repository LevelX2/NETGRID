import type { Side } from "@netgrid/shared";

export type PlanInstanceIdentity = Readonly<{
  moduleId: `${Side}.${string}`;
  dedupeKey: string;
}>;

export type CampaignIdentity = Readonly<{
  ownerModuleId: `${Side}.${string}`;
  objectiveKey: string;
}>;

/** The full identity stays with its owner; this reference carries no authority. */
export function compactPlanInstanceId(identity: PlanInstanceIdentity): string {
  return `p${identityDigest([
    0,
    identity.moduleId,
    normalizePlanIdentityToken(identity.dedupeKey),
  ])}`;
}

export function compactCampaignId(identity: CampaignIdentity): string {
  return `k${identityDigest([1, identity.ownerModuleId, identity.objectiveKey])}`;
}

export function agendaCampaignIdentity(objectiveKey: string): CampaignIdentity {
  return { ownerModuleId: "corp.score_agenda", objectiveKey };
}

export function defenseCampaignIdentity(
  objectiveKey = "server-defense-portfolio",
): CampaignIdentity {
  return { ownerModuleId: "corp.defend_servers", objectiveKey };
}

export function compareCampaignIdentities(
  left: CampaignIdentity,
  right: CampaignIdentity,
): number {
  return campaignIdentityOrderKey(left).localeCompare(
    campaignIdentityOrderKey(right),
  );
}

export function campaignIdentityOrderKey(identity: CampaignIdentity): string {
  return identity.ownerModuleId === "corp.score_agenda"
    ? identity.objectiveKey
    : `${identity.ownerModuleId}${identity.objectiveKey === "server-defense-portfolio" ? "" : `:${identity.objectiveKey}`}`;
}

/** Preserve semantic tie order independently of the compact reference bytes. */
export function planIdentityOrderKey(identity: PlanInstanceIdentity): string {
  return `${identity.moduleId}:${encodeURIComponent(
    normalizePlanIdentityToken(identity.dedupeKey),
  )}`;
}

export function comparePlanIdentities(
  left: PlanInstanceIdentity,
  right: PlanInstanceIdentity,
): number {
  return planIdentityOrderKey(left).localeCompare(planIdentityOrderKey(right));
}

export function normalizePlanIdentityToken(value: string): string {
  return value.trim().replace(/\s+/g, "_").slice(0, 160);
}

// FNV-1a-128 over canonical UTF-16 code units. No process-local allocation,
// seed, state version, import order or mutable registry enters the identity.
// Authoritative owners additionally verify the complete identity on restore.
function identityDigest(identity: readonly (string | number)[]): string {
  const value = JSON.stringify(identity);
  let hash = 0x6c62272e07bb014262b821756295c58dn;
  const prime = 0x1000000000000000000013bn;
  const mask = (1n << 128n) - 1n;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash ^ BigInt(value.charCodeAt(index))) * prime) & mask;
  }
  return hash.toString(36);
}
