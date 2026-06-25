export function isRemoteServerTarget(serverId: string | undefined): boolean {
  return serverId === "new_remote" || serverId?.startsWith("remote_") === true;
}
