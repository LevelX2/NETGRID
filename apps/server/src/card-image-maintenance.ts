import { randomUUID } from "node:crypto";
import {
  CardImageImportError,
  CardImageInboxError,
  CardImageMappingCsvError,
  CardImageStore,
  CardImageStoreError,
  HttpsImageImportError,
  PRIVATE_CARD_IMAGE_PACK_PROFILES,
  createCurrentCardImageMappingTemplate,
  importCardImagesFromCsv,
  inventoryCardImageCollection,
  inventoryCardImageInbox,
  resolveCardImageInboxEntry,
  resolveCardImageInboxSource,
  type CardImageBindingConflictMode,
  type CardImageCollectionInventory,
  type CardImageImportProgress,
  type CardImageImportReport,
  type CardImageInboxInventory,
  type CardImageInboxOptions,
  type HttpsImageDownload,
  type ImportCardImagesOptions,
  type PrivateCardImagePackProfileId,
} from "@netgrid/card-images";

export const CARD_IMAGE_MAINTENANCE_API_PREFIX =
  "/api/storage/maintenance/card-images";

export type CardImageMaintenanceCapabilities = {
  schemaVersion: "netgrid-card-image-maintenance-capabilities-v1";
  localOnly: true;
  collectionId: "personal";
  importModes: readonly ["local", "https", "pack"];
  conflictModes: readonly ["fail", "skip", "replace"];
  httpsRequiresRightsConfirmation: true;
  mutationsRequireReauthentication: true;
};

export type CardImageMaintenanceJobKind = "mapping_preview" | "mapping_import";

export type CardImageMaintenanceJobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed";

export type CardImageMaintenanceJobView = {
  schemaVersion: "netgrid-card-image-maintenance-job-v1";
  jobId: string;
  kind: CardImageMaintenanceJobKind;
  status: CardImageMaintenanceJobStatus;
  sourceMode: "local" | "https";
  mapping: string;
  onExisting: CardImageBindingConflictMode;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  progress: CardImageImportProgress;
  report?: CardImageImportReport;
  error?: {
    code: string;
    message: string;
    printingId?: string;
  };
};

export type StartCardImageMappingJobInput = {
  kind: CardImageMaintenanceJobKind;
  sourceMode: "local" | "https";
  mapping: string;
  onExisting: CardImageBindingConflictMode;
  rightsConfirmed: boolean;
};

export class CardImageMaintenanceError extends Error {
  constructor(
    readonly code:
      | "card_image_job_in_progress"
      | "card_image_job_not_found"
      | "card_image_job_input_invalid",
    message: string,
  ) {
    super(message);
    this.name = "CardImageMaintenanceError";
  }
}

type InternalCardImageMaintenanceJob = CardImageMaintenanceJobView & {
  rightsConfirmed: boolean;
};

export class CardImageMaintenanceService {
  private readonly inboxOptions: CardImageInboxOptions;
  private readonly store: CardImageStore;
  private readonly now: () => Date;
  private readonly idFactory: () => string;
  private readonly importCards: (
    options: ImportCardImagesOptions,
  ) => Promise<CardImageImportReport>;
  private readonly httpsDownloader:
    | ((source: string) => Promise<HttpsImageDownload>)
    | undefined;
  private readonly jobs = new Map<string, InternalCardImageMaintenanceJob>();
  private activeJobId: string | undefined;

  constructor(
    options: {
      inbox?: CardImageInboxOptions;
      store?: CardImageStore;
      now?: () => Date;
      idFactory?: () => string;
      importCards?: (
        options: ImportCardImagesOptions,
      ) => Promise<CardImageImportReport>;
      httpsDownloader?: (source: string) => Promise<HttpsImageDownload>;
    } = {},
  ) {
    this.inboxOptions = options.inbox ?? {};
    this.store = options.store ?? new CardImageStore();
    this.now = options.now ?? (() => new Date());
    this.idFactory = options.idFactory ?? randomUUID;
    this.importCards = options.importCards ?? importCardImagesFromCsv;
    this.httpsDownloader = options.httpsDownloader;
  }

  capabilities(): CardImageMaintenanceCapabilities {
    return {
      schemaVersion: "netgrid-card-image-maintenance-capabilities-v1",
      localOnly: true,
      collectionId: "personal",
      importModes: ["local", "https", "pack"],
      conflictModes: ["fail", "skip", "replace"],
      httpsRequiresRightsConfirmation: true,
      mutationsRequireReauthentication: true,
    };
  }

  async inventory(): Promise<CardImageCollectionInventory> {
    return inventoryCardImageCollection({ store: this.store });
  }

  async inbox(): Promise<CardImageInboxInventory> {
    return inventoryCardImageInbox(this.inboxOptions);
  }

  mappingTemplate(profileId: PrivateCardImagePackProfileId | "all"): {
    fileName: string;
    content: string;
  } {
    const profile =
      profileId === "all"
        ? undefined
        : PRIVATE_CARD_IMAGE_PACK_PROFILES[profileId];
    return {
      fileName: `netgrid-card-images-${profileId}.csv`,
      content: createCurrentCardImageMappingTemplate(
        profile ? { setId: profile.setId } : {},
      ),
    };
  }

  startMappingJob(
    input: StartCardImageMappingJobInput,
  ): CardImageMaintenanceJobView {
    validateMappingJobInput(input);
    if (this.activeJobId)
      throw new CardImageMaintenanceError(
        "card_image_job_in_progress",
        "Ein Kartenbildjob wird bereits ausgeführt.",
      );
    this.pruneJobs();
    const job: InternalCardImageMaintenanceJob = {
      schemaVersion: "netgrid-card-image-maintenance-job-v1",
      jobId: this.idFactory(),
      kind: input.kind,
      status: "queued",
      sourceMode: input.sourceMode,
      mapping: input.mapping,
      onExisting: input.onExisting,
      rightsConfirmed: input.rightsConfirmed,
      createdAt: this.now().toISOString(),
      progress: { phase: "preparing", completed: 0, total: 0 },
    };
    this.jobs.set(job.jobId, job);
    this.activeJobId = job.jobId;
    queueMicrotask(() => void this.runMappingJob(job));
    return publicJob(job);
  }

  job(jobId: string): CardImageMaintenanceJobView {
    const job = this.jobs.get(jobId);
    if (!job)
      throw new CardImageMaintenanceError(
        "card_image_job_not_found",
        "Der Kartenbildjob wurde nicht gefunden.",
      );
    return publicJob(job);
  }

  private async runMappingJob(
    job: InternalCardImageMaintenanceJob,
  ): Promise<void> {
    job.status = "running";
    job.startedAt = this.now().toISOString();
    try {
      const mappingFile = await resolveCardImageInboxEntry(
        job.mapping,
        "file",
        this.inboxOptions,
      );
      const report = await this.importCards({
        mappingFile,
        store: this.store,
        collectionId: "personal",
        onExisting: job.onExisting,
        dryRun: job.kind === "mapping_preview",
        allowHttpsSources: job.sourceMode === "https",
        rightsConfirmed: job.rightsConfirmed,
        localSourceResolver: (source, mappingDirectory) =>
          resolveCardImageInboxSource(
            source,
            mappingDirectory,
            this.inboxOptions,
          ),
        onProgress: (progress) => {
          job.progress = { ...progress };
        },
        ...(this.httpsDownloader
          ? { httpsDownloader: this.httpsDownloader }
          : {}),
      });
      job.report = report;
      job.status = "succeeded";
    } catch (error) {
      job.status = "failed";
      job.error = publicJobError(error);
    } finally {
      job.finishedAt = this.now().toISOString();
      if (this.activeJobId === job.jobId) this.activeJobId = undefined;
    }
  }

  private pruneJobs(): void {
    const terminalJobs = [...this.jobs.values()]
      .filter((job) => job.status === "succeeded" || job.status === "failed")
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
    for (const job of terminalJobs.slice(
      0,
      Math.max(0, terminalJobs.length - 49),
    ))
      this.jobs.delete(job.jobId);
  }
}

function validateMappingJobInput(input: StartCardImageMappingJobInput): void {
  if (
    (input.kind !== "mapping_preview" && input.kind !== "mapping_import") ||
    (input.sourceMode !== "local" && input.sourceMode !== "https") ||
    !input.mapping.trim() ||
    !["fail", "skip", "replace"].includes(input.onExisting)
  )
    throw new CardImageMaintenanceError(
      "card_image_job_input_invalid",
      "Der Kartenbildjob enthält ungültige Eingaben.",
    );
  if (input.sourceMode === "https" && !input.rightsConfirmed)
    throw new CardImageMaintenanceError(
      "card_image_job_input_invalid",
      "Der HTTPS-Import benötigt die ausdrückliche Bestätigung der Nutzungsrechte.",
    );
}

function publicJob(
  job: InternalCardImageMaintenanceJob,
): CardImageMaintenanceJobView {
  const { rightsConfirmed: _rightsConfirmed, ...view } = job;
  return structuredClone(view);
}

function publicJobError(
  error: unknown,
): NonNullable<CardImageMaintenanceJobView["error"]> {
  if (
    error instanceof CardImageInboxError ||
    error instanceof CardImageImportError ||
    error instanceof CardImageMappingCsvError ||
    error instanceof CardImageStoreError ||
    error instanceof HttpsImageImportError
  )
    return {
      code: error.code,
      message: error.message,
      ...("printingId" in error && typeof error.printingId === "string"
        ? { printingId: error.printingId }
        : {}),
    };
  return {
    code: "card_image_job_failed",
    message: "Der Kartenbildjob ist unerwartet fehlgeschlagen.",
  };
}
