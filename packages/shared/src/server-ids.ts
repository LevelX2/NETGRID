export type RemoteServerId = `r${number}`;

export type ServerId = "hq" | "rd" | "archives" | RemoteServerId | "new_remote";

export function isRemoteServerId(value: unknown): value is RemoteServerId {
  return (
    typeof value === "string" &&
    /^r[1-9]\d*$/.test(value) &&
    Number.isSafeInteger(Number(value.slice(1)))
  );
}
