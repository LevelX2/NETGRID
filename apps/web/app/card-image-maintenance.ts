export type CardImageProfileId = "originalset" | "proteus" | "classic";
export type CardImageConflictMode = "fail" | "skip" | "replace";

export type CardImageSetInventory = {
  profileId: CardImageProfileId;
  displayName: string;
  setId: string;
  total: number;
  bound: number;
  missing: number;
  missingPrintingIds: string[];
};

export type CardImageCollectionInventory = {
  schemaVersion: "netgrid-card-image-collection-inventory-v1";
  collectionId: string;
  revision: number;
  totalBindings: number;
  unknownBindings: number;
  sets: CardImageSetInventory[];
};

export type CardImageInboxEntry = {
  relativePath: string;
  kind: "file" | "directory";
  usage: "mapping" | "image" | "pack" | "directory" | "other";
  bytes?: number;
};

export type CardImageInboxInventory = {
  schemaVersion: "netgrid-card-image-inbox-v1";
  entries: CardImageInboxEntry[];
};

export type CardImageImportReport = {
  schemaVersion: "card-image-import-report-v1";
  createdAt: string;
  collectionId: string;
  dryRun: boolean;
  onExisting: CardImageConflictMode;
  tableRows: number;
  selectedRows: number;
  results: Array<{
    printingId: string;
    sourceFileName: string;
    sourceMediaType: "image/png" | "image/jpeg" | "image/webp";
    sourceWidth: number;
    sourceHeight: number;
    mediaType: "image/png" | "image/jpeg" | "image/webp";
    width: number;
    height: number;
    bytes: number;
    status: "bound" | "replaced" | "skipped" | "unchanged";
  }>;
  summary: Record<"bound" | "replaced" | "skipped" | "unchanged", number>;
};

export type CardImagePackReport = {
  schemaVersion: "netgrid-card-image-pack-maintenance-report-v1";
  operation: "preview" | "import" | "build";
  profileId: CardImageProfileId;
  packId: string;
  cardCount: number;
  importReport?: CardImageImportReport;
};

export type CardImageMaintenanceJob = {
  schemaVersion: "netgrid-card-image-maintenance-job-v1";
  jobId: string;
  kind:
    | "mapping_preview"
    | "mapping_import"
    | "pack_preview"
    | "pack_import"
    | "pack_build";
  status: "queued" | "running" | "succeeded" | "failed";
  sourceMode?: "local" | "https" | "pack";
  mapping?: string;
  pack?: string;
  profileId?: CardImageProfileId;
  replace?: boolean;
  onExisting?: CardImageConflictMode;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  progress: {
    phase: "preparing" | "storing" | "validating" | "building" | "importing";
    completed: number;
    total: number;
    printingId?: string;
  };
  report?: CardImageImportReport | CardImagePackReport;
  error?: { code: string; message: string; printingId?: string };
};

export function mappingInboxEntries(
  inbox: CardImageInboxInventory | null,
): CardImageInboxEntry[] {
  return (inbox?.entries ?? []).filter(
    (entry) => entry.kind === "file" && entry.usage === "mapping",
  );
}

export function packInboxEntries(
  inbox: CardImageInboxInventory | null,
): CardImageInboxEntry[] {
  return (inbox?.entries ?? []).filter(
    (entry) => entry.kind === "directory" && entry.usage === "pack",
  );
}

export function cardImageJobProgressPercent(
  job: CardImageMaintenanceJob | null,
): number {
  if (!job) return 0;
  if (job.status === "succeeded") return 100;
  if (job.progress.total <= 0) return 0;
  return Math.max(
    0,
    Math.min(
      100,
      Math.round((job.progress.completed / job.progress.total) * 100),
    ),
  );
}

export function cardImageJobIsTerminal(
  job: CardImageMaintenanceJob | null,
): boolean {
  return job?.status === "succeeded" || job?.status === "failed";
}

export function importReportFromJob(
  job: CardImageMaintenanceJob | null,
): CardImageImportReport | undefined {
  const report = job?.report;
  if (!report) return undefined;
  if (report.schemaVersion === "card-image-import-report-v1") return report;
  return report.importReport;
}
