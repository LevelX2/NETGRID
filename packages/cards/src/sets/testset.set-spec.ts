import type { SetSpec } from "../contracts";

export const setSpec = {
  schemaVersion: "set-spec-v1",
  setId: "testset",
  name: "NETGRID Testset",
  code: "testset",
  sortOrder: 0,
  publication: { status: "active" },
} satisfies SetSpec;
