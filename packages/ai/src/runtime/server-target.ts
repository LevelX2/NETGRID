import { isRemoteServerId } from "@netgrid/shared";
import type { AiDecisionInput } from "@netgrid/shared";

export type CentralServerId = "hq" | "rd" | "archives";

export function centralServerId(
  serverId: string | undefined,
): CentralServerId | undefined {
  return serverId === "hq" || serverId === "rd" || serverId === "archives"
    ? serverId
    : undefined;
}

export function isRemoteServerTarget(serverId: string | undefined): boolean {
  return serverId === "new_remote" || isRemoteServerId(serverId) === true;
}

export function serverBlocksStealthBitPayments(
  server:
    | Pick<AiDecisionInput["playerView"]["servers"][number], "statuses">
    | undefined,
): boolean {
  return (
    server?.statuses?.some(
      (status) =>
        status.kind === "run_payment_restriction" &&
        status.restriction === "runner_stealth_bit_payment_sources",
    ) === true
  );
}
