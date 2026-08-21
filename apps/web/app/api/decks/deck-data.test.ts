import { afterEach, describe, expect, it } from "vitest";
import { deckSnapshotsResponse, deckTemplatesResponse } from "./deck-data";

const previousTestCardSetting = process.env.NETGRID_ENABLE_TEST_CARDS;

afterEach(() => {
  if (previousTestCardSetting === undefined)
    delete process.env.NETGRID_ENABLE_TEST_CARDS;
  else process.env.NETGRID_ENABLE_TEST_CARDS = previousTestCardSetting;
});

describe("deck test-card availability", () => {
  it("omits test-card snapshots and templates by default", () => {
    delete process.env.NETGRID_ENABLE_TEST_CARDS;

    const snapshotPayload = deckSnapshotsResponse().body as {
      snapshots: Array<{ deckSnapshotId: string }>;
    };
    const templatePayload = deckTemplatesResponse().body as {
      templates: Array<{ templateId: string }>;
    };

    expect(
      snapshotPayload.snapshots.some((snapshot) =>
        snapshot.deckSnapshotId.startsWith("demo_runner_00"),
      ),
    ).toBe(false);
    expect(
      templatePayload.templates.some((template) =>
        template.templateId.startsWith("demo_runner_00"),
      ),
    ).toBe(false);
  });

  it("returns the test fixtures only after explicit backend activation", () => {
    process.env.NETGRID_ENABLE_TEST_CARDS = "true";

    const payload = deckSnapshotsResponse().body as {
      snapshots: Array<{ deckSnapshotId: string }>;
    };
    expect(
      payload.snapshots.some(
        (snapshot) =>
          snapshot.deckSnapshotId === "demo_runner_008_snapshot_v0_8",
      ),
    ).toBe(true);
  });
});
