export type CentralServerId = "hq" | "rd" | "archives";

export function centralServerId(
  serverId: string | undefined,
): CentralServerId | undefined {
  return serverId === "hq" || serverId === "rd" || serverId === "archives"
    ? serverId
    : undefined;
}

export function isRemoteServerTarget(serverId: string | undefined): boolean {
  return serverId === "new_remote" || serverId?.startsWith("remote_") === true;
}
