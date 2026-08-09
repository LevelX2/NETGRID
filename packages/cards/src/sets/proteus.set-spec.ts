import type { SetSpec } from "../contracts";

export const setSpec = {
  schemaVersion: "set-spec-v1",
  setId: "proteus",
  name: "Proteus",
  code: "proteus",
  sortOrder: 20,
  publication: { status: "active" },
} satisfies SetSpec;
