import type { SetSpec } from "../contracts";

export const setSpec = {
  schemaVersion: "set-spec-v1",
  setId: "system",
  name: "NETGRID-System",
  code: "system",
  sortOrder: 0,
  publication: { status: "active" },
} satisfies SetSpec;
