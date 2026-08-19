import { randomUUID } from "node:crypto";
import {
  CardImageImportError,
  CardImageInboxError,
  CardImageMappingCsvError,
  CardImagePackError,
  CardImageStore,
  CardImageStoreError,
  HttpsImageImportError,
  PRIVATE_CARD_IMAGE_PACK_PROFILES,
  buildPrivateCardImagePack,
  createCurrentCardImageMappingTemplate,
  importCardImagesFromCsv,
  importPrivateCardImagePack,
  inventoryCardImageCollection,
  inventoryCardImageInbox,
  resolveCardImageInboxEntry,
  resolveCardImageInboxSource,
  writeCardImageInboxMapping,
  writeCardImageInboxPackageFile,
  type BuildPrivateCardImagePackOptions,
  type BuildPrivateCardImagePackResult,
  type CardImageBindingConflictMode,
  type CardImageCollectionInventory,
  type CardImageImportReport,
  type CardImageInboxInventory,
  type CardImageInboxOptions,
  type HttpsImageDownload,
  type ImportCardImagesOptions,
  type ImportPrivateCardImagePackOptions,
  type ImportPrivateCardImagePackResult,
  type NetgridPathOptions,
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
  mutationsRequireReauthentication: false;
};

export type CardImageMaintenanceJobKind =
  | "mapping_preview"
  | "mapping_import"
  | "pack_preview"
  | "pack_import"
  | "pack_build";

export type CardImageMaintenanceJobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed";

export type CardImageMaintenanceJobProgress = {
  phase: "preparing" | "storing" | "validating" | "building" | "importing";
  completed: number;
  total: number;
  printingId?: string;
};

export type CardImagePackMaintenanceReport = {
  schemaVersion: "netgrid-card-image-pack-maintenance-report-v1";
  operation: "preview" | "import" | "build";
  profileId: PrivateCardImagePackProfileId;
  packId: string;
  cardCount: number;
  importReport?: CardImageImportReport;
};

export type CardImageMaintenanceJobView = {
  schemaVersion: "netgrid-card-image-maintenance-job-v1";
  jobId: string;
  kind: CardImageMaintenanceJobKind;
  status: CardImageMaintenanceJobStatus;
  sourceMode?: "local" | "https" | "pack";
  mapping?: string;
  pack?: string;
  profileId?: PrivateCardImagePackProfileId;
  replace?: boolean;
  onExisting?: CardImageBindingConflictMode;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  progress: CardImageMaintenanceJobProgress;
  report?: CardImageImportReport | CardImagePackMaintenanceReport;
  error?: {
    code: string;
    message: string;
    printingId?: string;
  };
};

export type StartCardImageMappingJobInput = {
  kind: "mapping_preview" | "mapping_import";
  sourceMode: "local" | "https";
  mapping: string;
  onExisting: CardImageBindingConflictMode;
  rightsConfirmed: boolean;
};

export type StartCardImagePackJobInput =
  | {
      kind: "pack_preview" | "pack_import";
      pack: string;
      onExisting: CardImageBindingConflictMode;
    }
  | {
      kind: "pack_build";
      mapping: string;
      profileId: PrivateCardImagePackProfileId;
      replace: boolean;
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
  private readonly packPathOptions: NetgridPathOptions;
  private readonly store: CardImageStore;
  private readonly now: () => Date;
  private readonly idFactory: () => string;
  private readonly importCards: (
    options: ImportCardImagesOptions,
  ) => Promise<CardImageImportReport>;
  private readonly buildPack: (
    options: BuildPrivateCardImagePackOptions,
  ) => Promise<BuildPrivateCardImagePackResult>;
  private readonly importPack: (
    options: ImportPrivateCardImagePackOptions,
  ) => Promise<ImportPrivateCardImagePackResult>;
  private readonly httpsDownloader:
    | ((source: string) => Promise<HttpsImageDownload>)
    | undefined;
  private readonly jobs = new Map<string, InternalCardImageMaintenanceJob>();
  private activeJobId: string | undefined;

  constructor(
    options: {
      inbox?: CardImageInboxOptions;
      packPathOptions?: NetgridPathOptions;
      store?: CardImageStore;
      now?: () => Date;
      idFactory?: () => string;
      importCards?: (
        options: ImportCardImagesOptions,
      ) => Promise<CardImageImportReport>;
      buildPack?: (
        options: BuildPrivateCardImagePackOptions,
      ) => Promise<BuildPrivateCardImagePackResult>;
      importPack?: (
        options: ImportPrivateCardImagePackOptions,
      ) => Promise<ImportPrivateCardImagePackResult>;
      httpsDownloader?: (source: string) => Promise<HttpsImageDownload>;
    } = {},
  ) {
    this.inboxOptions = options.inbox ?? {};
    this.packPathOptions = options.packPathOptions ?? {};
    this.store = options.store ?? new CardImageStore();
    this.now = options.now ?? (() => new Date());
    this.idFactory = options.idFactory ?? randomUUID;
    this.importCards = options.importCards ?? importCardImagesFromCsv;
    this.buildPack = options.buildPack ?? buildPrivateCardImagePack;
    this.importPack = options.importPack ?? importPrivateCardImagePack;
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
      mutationsRequireReauthentication: false,
    };
  }

  async inventory(): Promise<CardImageCollectionInventory> {
    return inventoryCardImageCollection({ store: this.store });
  }

  async inbox(): Promise<CardImageInboxInventory> {
    return inventoryCardImageInbox(this.inboxOptions);
  }

  async uploadMapping(
    fileName: string,
    content: string,
  ): Promise<{ relativePath: string }> {
    const entry = await writeCardImageInboxMapping(
      fileName,
      content,
      this.inboxOptions,
    );
    return { relativePath: entry.relativePath };
  }

  async uploadPackageFile(
    packageName: string,
    relativeFilePath: string,
    content: Uint8Array,
  ): Promise<{ package: string; file: string }> {
    return writeCardImageInboxPackageFile(
      packageName,
      relativeFilePath,
      content,
      this.inboxOptions,
    );
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
    const job = this.createJob({
      kind: input.kind,
      sourceMode: input.sourceMode,
      mapping: input.mapping,
      onExisting: input.onExisting,
      rightsConfirmed: input.rightsConfirmed,
      progress: { phase: "preparing", completed: 0, total: 0 },
    });
    queueMicrotask(() => void this.runMappingJob(job));
    return publicJob(job);
  }

  startPackJob(input: StartCardImagePackJobInput): CardImageMaintenanceJobView {
    validatePackJobInput(input);
    const job =
      input.kind === "pack_build"
        ? this.createJob({
            kind: input.kind,
            sourceMode: "pack",
            mapping: input.mapping,
            profileId: input.profileId,
            replace: input.replace,
            rightsConfirmed: false,
            progress: { phase: "building", completed: 0, total: 0 },
          })
        : this.createJob({
            kind: input.kind,
            sourceMode: "pack",
            pack: input.pack,
            onExisting: input.onExisting,
            rightsConfirmed: false,
            progress: { phase: "validating", completed: 0, total: 0 },
          });
    queueMicrotask(() => void this.runPackJob(job));
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

  private createJob(
    input: Omit<
      InternalCardImageMaintenanceJob,
      "schemaVersion" | "jobId" | "status" | "createdAt"
    >,
  ): InternalCardImageMaintenanceJob {
    if (this.activeJobId)
      throw new CardImageMaintenanceError(
        "card_image_job_in_progress",
        "Ein Kartenbildjob wird bereits ausgeführt.",
      );
    this.pruneJobs();
    const job: InternalCardImageMaintenanceJob = {
      schemaVersion: "netgrid-card-image-maintenance-job-v1",
      jobId: this.idFactory(),
      status: "queued",
      createdAt: this.now().toISOString(),
      ...input,
    };
    this.jobs.set(job.jobId, job);
    this.activeJobId = job.jobId;
    return job;
  }

  private async runMappingJob(
    job: InternalCardImageMaintenanceJob,
  ): Promise<void> {
    await this.runJob(job, async () => {
      if (!job.mapping || !job.onExisting)
        throw invalidInternalJob("Mapping-Job ist unvollständig.");
      const mappingFile = await resolveCardImageInboxEntry(
        job.mapping,
        "file",
        this.inboxOptions,
      );
      return this.importCards({
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
    });
  }

  private async runPackJob(
    job: InternalCardImageMaintenanceJob,
  ): Promise<void> {
    await this.runJob(job, async () => {
      if (job.kind === "pack_build") {
        if (!job.mapping || !job.profileId)
          throw invalidInternalJob("Paket-Build-Job ist unvollständig.");
        const mappingFile = await resolveCardImageInboxEntry(
          job.mapping,
          "file",
          this.inboxOptions,
        );
        const result = await this.buildPack({
          profileId: job.profileId,
          mappingFile,
          replace: job.replace === true,
          now: this.now,
          pathOptions: this.packPathOptions,
          localSourceResolver: (source, mappingDirectory) =>
            resolveCardImageInboxSource(
              source,
              mappingDirectory,
              this.inboxOptions,
            ),
          onProgress: (progress) => {
            job.progress = { ...progress };
          },
        });
        return {
          schemaVersion: "netgrid-card-image-pack-maintenance-report-v1",
          operation: "build",
          profileId: result.manifest.profileId,
          packId: result.manifest.packId,
          cardCount: result.manifest.cardCount,
        } satisfies CardImagePackMaintenanceReport;
      }
      if (!job.pack || !job.onExisting)
        throw invalidInternalJob("Paket-Importjob ist unvollständig.");
      const packDirectory = await resolveCardImageInboxEntry(
        job.pack,
        "directory",
        this.inboxOptions,
      );
      const result = await this.importPack({
        packDirectory,
        store: this.store,
        collectionId: "personal",
        onExisting: job.onExisting,
        dryRun: job.kind === "pack_preview",
        now: this.now,
        onProgress: (progress) => {
          job.progress = { ...progress };
        },
      });
      const profile = PRIVATE_CARD_IMAGE_PACK_PROFILES[result.profileId];
      return {
        schemaVersion: "netgrid-card-image-pack-maintenance-report-v1",
        operation: job.kind === "pack_preview" ? "preview" : "import",
        profileId: result.profileId,
        packId: result.packId,
        cardCount: profile.expectedCardCount,
        importReport: result.importReport,
      } satisfies CardImagePackMaintenanceReport;
    });
  }

  private async runJob(
    job: InternalCardImageMaintenanceJob,
    operation: () => Promise<
      CardImageImportReport | CardImagePackMaintenanceReport
    >,
  ): Promise<void> {
    job.status = "running";
    job.startedAt = this.now().toISOString();
    try {
      job.report = await operation();
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
    (input.sourceMode !== "local" && input.sourceMode !== "https") ||
    !input.mapping.trim() ||
    !isConflictMode(input.onExisting)
  )
    throw invalidJobInput();
  if (input.sourceMode === "https" && !input.rightsConfirmed)
    throw new CardImageMaintenanceError(
      "card_image_job_input_invalid",
      "Der HTTPS-Import benötigt die ausdrückliche Bestätigung der Nutzungsrechte.",
    );
}

function validatePackJobInput(input: StartCardImagePackJobInput): void {
  if (input.kind === "pack_build") {
    if (
      !input.mapping.trim() ||
      !(input.profileId in PRIVATE_CARD_IMAGE_PACK_PROFILES)
    )
      throw invalidJobInput();
    return;
  }
  if (!input.pack.trim() || !isConflictMode(input.onExisting))
    throw invalidJobInput();
}

function isConflictMode(value: string): value is CardImageBindingConflictMode {
  return value === "fail" || value === "skip" || value === "replace";
}

function invalidJobInput(): CardImageMaintenanceError {
  return new CardImageMaintenanceError(
    "card_image_job_input_invalid",
    "Der Kartenbildjob enthält ungültige Eingaben.",
  );
}

function invalidInternalJob(message: string): CardImageMaintenanceError {
  return new CardImageMaintenanceError("card_image_job_input_invalid", message);
}

function publicJob(
  job: InternalCardImageMaintenanceJob,
): CardImageMaintenanceJobView {
  const { rightsConfirmed, ...view } = job;
  void rightsConfirmed;
  return structuredClone(view);
}

function publicJobError(
  error: unknown,
): NonNullable<CardImageMaintenanceJobView["error"]> {
  if (
    error instanceof CardImageInboxError ||
    error instanceof CardImageImportError ||
    error instanceof CardImageMappingCsvError ||
    error instanceof CardImagePackError ||
    error instanceof CardImageStoreError ||
    error instanceof HttpsImageImportError ||
    error instanceof CardImageMaintenanceError
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
