import type { LegalAction } from "@netgrid/shared";

export function actionServerId(action: LegalAction): string | undefined {
  const value =
    action.payload?.serverId ??
    action.payload?.targetServerId ??
    action.payload?.attackedServerId ??
    action.payload?.server;
  return typeof value === "string" ? value : undefined;
}

export function isServerTargetPayloadKey(key: string): boolean {
  return (
    key === "serverId" ||
    key === "targetServerId" ||
    key === "attackedServerId" ||
    key === "server"
  );
}

export function isRemoteServer(serverId: string | undefined): boolean {
  return serverId?.startsWith("remote_") === true;
}

export function isCentralServer(serverId: string | undefined): boolean {
  return serverId === "hq" || serverId === "rd";
}
