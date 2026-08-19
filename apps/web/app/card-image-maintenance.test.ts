import { describe, expect, it } from "vitest";
import {
  cardImageJobIsTerminal,
  cardImageJobProgressPercent,
  importReportFromJob,
  mappingInboxEntries,
  packInboxEntries,
  type CardImageMaintenanceJob,
} from "./card-image-maintenance";

describe("IMG08 card image maintenance UI helpers", () => {
  it("selects only relative mapping files and detected pack directories", () => {
    const inbox = {
      schemaVersion: "netgrid-card-image-inbox-v1" as const,
      entries: [
        {
          relativePath: "mapping.csv",
          kind: "file" as const,
          usage: "mapping" as const,
        },
        {
          relativePath: "images/a.png",
          kind: "file" as const,
          usage: "image" as const,
        },
        {
          relativePath: "classic-pack",
          kind: "directory" as const,
          usage: "pack" as const,
        },
      ],
    };
    expect(
      mappingInboxEntries(inbox).map((entry) => entry.relativePath),
    ).toEqual(["mapping.csv"]);
    expect(packInboxEntries(inbox).map((entry) => entry.relativePath)).toEqual([
      "classic-pack",
    ]);
  });

  it("clamps progress and recognizes terminal jobs", () => {
    const running = job({
      status: "running",
      progress: { phase: "building", completed: 3, total: 4 },
    });
    expect(cardImageJobProgressPercent(running)).toBe(75);
    expect(cardImageJobIsTerminal(running)).toBe(false);
    const finished = job({ status: "succeeded" });
    expect(cardImageJobProgressPercent(finished)).toBe(100);
    expect(cardImageJobIsTerminal(finished)).toBe(true);
  });

  it("extracts nested import reports from package jobs", () => {
    const importReport = {
      schemaVersion: "card-image-import-report-v1" as const,
      createdAt: "2026-08-19T00:00:00.000Z",
      collectionId: "personal",
      dryRun: true,
      onExisting: "fail" as const,
      tableRows: 54,
      selectedRows: 54,
      results: [],
      summary: { bound: 54, replaced: 0, skipped: 0, unchanged: 0 },
    };
    expect(
      importReportFromJob(
        job({
          report: {
            schemaVersion: "netgrid-card-image-pack-maintenance-report-v1",
            operation: "preview",
            profileId: "classic",
            packId: "classic-pack",
            cardCount: 54,
            importReport,
          },
        }),
      ),
    ).toEqual(importReport);
  });
});

function job(
  overrides: Partial<CardImageMaintenanceJob>,
): CardImageMaintenanceJob {
  return {
    schemaVersion: "netgrid-card-image-maintenance-job-v1",
    jobId: "job-1",
    kind: "mapping_preview",
    status: "queued",
    createdAt: "2026-08-19T00:00:00.000Z",
    progress: { phase: "preparing", completed: 0, total: 0 },
    ...overrides,
  };
}
