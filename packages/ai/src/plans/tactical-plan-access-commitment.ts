import type { KnownRemoteAccessCommitment } from "../decision/known-remote-access-commitment";

export function accessCommitmentPlanEvidence(
  commitment: KnownRemoteAccessCommitment | undefined,
  serverId: string,
): string[] {
  if (!commitment || commitment.serverId !== serverId) return [];
  return [
    `structured_access_commitment_server:${commitment.serverId}`,
    `structured_access_commitment_state:${commitment.knownAccessState}`,
    `structured_access_commitment_intended_action:${commitment.intendedAccessAction}`,
    `structured_access_commitment_reason:${commitment.reason}`,
  ];
}
