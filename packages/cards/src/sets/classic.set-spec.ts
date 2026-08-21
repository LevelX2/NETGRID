import type { SetSpec } from "../contracts";

export const setSpec = {
  schemaVersion: "set-spec-v1",
  setId: "classic",
  name: "Classic",
  code: "classic",
  sortOrder: 30,
  publication: { status: "active" },
} satisfies SetSpec;
