import { afterEach, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  CardImageStore,
  type BuildPrivateCardImagePackOptions,
  type BuildPrivateCardImagePackResult,
  type CardImageImportReport,
  type ImportPrivateCardImagePackOptions,
  type ImportPrivateCardImagePackResult,
  type ImportCardImagesOptions,
} from "@netgrid/card-images";
import {
  InMemoryMaintenanceCredentialStore,
  MaintenanceAuthService,
} from "./maintenance-auth";
import {
  createNetgridHttpServer,
  type NetgridServerHandle,
} from "./http-server";
import {
  loadDeploymentConfig,
  type DeploymentConfig,
} from "./internet-hardening";
import { InMemoryMatchStorage, MultiplayerService } from "./multiplayer";
import { CardImageMaintenanceService } from "./card-image-maintenance";

const LOCAL_ORIGIN = "http://127.0.0.1:3100";
const REMOTE_ORIGIN = "https://admin.netgrid.example";
const PASSWORD = "sichere IMG08 Test-Passphrase";

describe("IMG08 local card image maintenance boundary", () => {
  const handles: NetgridServerHandle[] = [];

  afterEach(async () => {
    await Promise.all(handles.splice(0).map((handle) => handle.close()));
  });

  it("requires an authenticated maintenance session locally", async () => {
    const client = await startClient(localConfig());
    const response = await fetch(
      `${client.baseUrl}/api/storage/maintenance/card-images/capabilities`,
      { headers: { origin: LOCAL_ORIGIN } },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "maintenance_auth_required" },
    });
  });

  it("exposes only path-free capabilities to an authenticated local operator", async () => {
    const client = await startClient(localConfig());
    const session = await client.login(LOCAL_ORIGIN);
    const response = await fetch(
      `${client.baseUrl}/api/storage/maintenance/card-images/capabilities`,
      {
        headers: {
          cookie: session.cookie,
          origin: LOCAL_ORIGIN,
        },
      },
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toEqual({
      schemaVersion: "netgrid-card-image-maintenance-capabilities-v1",
      localOnly: true,
      collectionId: "personal",
      importModes: ["local", "https", "pack"],
      conflictModes: ["fail", "skip", "replace"],
      httpsRequiresRightsConfirmation: true,
      mutationsRequireReauthentication: true,
    });
    expect(JSON.stringify(payload)).not.toMatch(/[A-Z]:\\|\/Users\//i);
  });

  it("rejects the card image surface even for authenticated remote maintenance", async () => {
    const client = await startClient(remoteConfig());
    const session = await client.login(REMOTE_ORIGIN, true);
    const response = await fetch(
      `${client.baseUrl}/api/storage/maintenance/card-images/capabilities`,
      {
        headers: {
          cookie: session.cookie,
          origin: REMOTE_ORIGIN,
          "x-forwarded-proto": "https",
        },
      },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "card_image_maintenance_local_only" },
    });
  });

  it("serves catalog inventory, relative inbox entries and profile templates", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "netgrid-img08-http-"));
    const inboxRoot = path.join(root, "inbox");
    await mkdir(path.join(inboxRoot, "mappings"), { recursive: true });
    await writeFile(path.join(inboxRoot, "mappings", "originalset.csv"), "x");
    const client = await startClient(
      localConfig(),
      new CardImageMaintenanceService({
        inbox: { inboxRoot },
        store: new CardImageStore({ root: path.join(root, "store") }),
      }),
    );
    const session = await client.login(LOCAL_ORIGIN);
    const headers = { cookie: session.cookie, origin: LOCAL_ORIGIN };

    const uploadResponse = await fetch(
      `${client.baseUrl}/api/storage/maintenance/card-images/inbox/mappings`,
      {
        method: "POST",
        headers: {
          ...headers,
          "content-type": "application/json",
          "x-netgrid-csrf": session.csrfToken,
        },
        body: JSON.stringify({
          fileName: "auswahl.csv",
          content:
            "# Erklärung\naktiv;printingId;setId;sammlernummer;seite;titel;quelle;sha256\n",
        }),
      },
    );
    expect(uploadResponse.status).toBe(201);
    await expect(uploadResponse.json()).resolves.toEqual({
      relativePath: "mappings/auswahl.csv",
    });

    const packageFileResponse = await fetch(
      `${client.baseUrl}/api/storage/maintenance/card-images/inbox/package-files?package=upload-test&path=${encodeURIComponent("mapping.csv")}`,
      {
        method: "POST",
        headers: {
          ...headers,
          "content-type": "application/octet-stream",
          "x-netgrid-csrf": session.csrfToken,
        },
        body: "mapping",
      },
    );
    expect(packageFileResponse.status).toBe(201);
    await expect(packageFileResponse.json()).resolves.toEqual({
      package: "uploads/upload-test",
      file: "mapping.csv",
    });

    const inventoryResponse = await fetch(
      `${client.baseUrl}/api/storage/maintenance/card-images/inventory`,
      { headers },
    );
    expect(inventoryResponse.status).toBe(200);
    const inventory = await inventoryResponse.json();
    expect(inventory.sets).toEqual([
      expect.objectContaining({
        profileId: "originalset",
        total: 374,
        bound: 0,
      }),
      expect.objectContaining({ profileId: "proteus", total: 154, bound: 0 }),
      expect.objectContaining({ profileId: "classic", total: 54, bound: 0 }),
    ]);

    const inboxResponse = await fetch(
      `${client.baseUrl}/api/storage/maintenance/card-images/inbox`,
      { headers },
    );
    expect(inboxResponse.status).toBe(200);
    const inbox = await inboxResponse.json();
    expect(inbox.entries).toContainEqual(
      expect.objectContaining({
        relativePath: "mappings/originalset.csv",
        usage: "mapping",
      }),
    );
    expect(inbox.entries).toContainEqual(
      expect.objectContaining({
        relativePath: "mappings/auswahl.csv",
        usage: "mapping",
      }),
    );
    expect(JSON.stringify(inbox)).not.toContain(root);

    const templateResponse = await fetch(
      `${client.baseUrl}/api/storage/maintenance/card-images/template?profile=classic`,
      { headers },
    );
    expect(templateResponse.status).toBe(200);
    expect(templateResponse.headers.get("content-type")).toContain("text/csv");
    expect(templateResponse.headers.get("content-disposition")).toContain(
      "netgrid-card-images-classic.csv",
    );
    const template = await templateResponse.text();
    expect(template).toContain("# NETGRID-Kartenbild-Zuordnung");
    expect(template.trimEnd().split("\n").length).toBeGreaterThan(55);
    expect(template).toContain("printingId");
  });

  it("runs preview jobs, serializes execution and requires reauthentication for apply", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "netgrid-img08-jobs-"));
    const inboxRoot = path.join(root, "inbox");
    await mkdir(inboxRoot, { recursive: true });
    await writeFile(path.join(inboxRoot, "mapping.csv"), "synthetic");
    let releaseImport!: () => void;
    const blocked = new Promise<void>((resolve) => {
      releaseImport = resolve;
    });
    let calls = 0;
    const importCards = async (
      options: ImportCardImagesOptions,
    ): Promise<CardImageImportReport> => {
      calls += 1;
      options.onProgress?.({
        phase: "preparing",
        completed: 0,
        total: 1,
      });
      if (calls === 1) await blocked;
      options.onProgress?.({
        phase: "preparing",
        completed: 1,
        total: 1,
        printingId: "onr_v1_001_afreet",
      });
      return importReport(options.dryRun === true);
    };
    const client = await startClient(
      localConfig(),
      new CardImageMaintenanceService({
        inbox: { inboxRoot },
        store: new CardImageStore({ root: path.join(root, "store") }),
        importCards,
        idFactory: (() => {
          let id = 0;
          return () => `job-${++id}`;
        })(),
      }),
    );
    const session = await client.login(LOCAL_ORIGIN);
    const mutationHeaders = {
      "content-type": "application/json",
      cookie: session.cookie,
      origin: LOCAL_ORIGIN,
      "x-netgrid-csrf": session.csrfToken,
    };
    const body = JSON.stringify({
      sourceMode: "local",
      mapping: "mapping.csv",
      onExisting: "fail",
      rightsConfirmed: false,
    });

    const preview = await fetch(
      `${client.baseUrl}/api/storage/maintenance/card-images/imports/preview`,
      { method: "POST", headers: mutationHeaders, body },
    );
    expect(preview.status).toBe(202);
    await expect(preview.json()).resolves.toMatchObject({
      job: { jobId: "job-1", status: "queued", mapping: "mapping.csv" },
    });

    const parallel = await fetch(
      `${client.baseUrl}/api/storage/maintenance/card-images/imports/preview`,
      { method: "POST", headers: mutationHeaders, body },
    );
    expect(parallel.status).toBe(409);
    await expect(parallel.json()).resolves.toMatchObject({
      error: { code: "card_image_job_in_progress" },
    });
    releaseImport();
    await expectJobStatus(client.baseUrl, session, "job-1", "succeeded");

    const applyWithoutReauth = await fetch(
      `${client.baseUrl}/api/storage/maintenance/card-images/imports/apply`,
      { method: "POST", headers: mutationHeaders, body },
    );
    expect(applyWithoutReauth.status).toBe(403);
    await expect(applyWithoutReauth.json()).resolves.toMatchObject({
      error: { code: "maintenance_reauthentication_required" },
    });

    const reauth = await fetch(
      `${client.baseUrl}/api/storage/maintenance/auth/reauthenticate`,
      {
        method: "POST",
        headers: mutationHeaders,
        body: JSON.stringify({ password: PASSWORD }),
      },
    );
    expect(reauth.status).toBe(200);
    const apply = await fetch(
      `${client.baseUrl}/api/storage/maintenance/card-images/imports/apply`,
      { method: "POST", headers: mutationHeaders, body },
    );
    expect(apply.status).toBe(202);
    await expect(apply.json()).resolves.toMatchObject({
      job: { jobId: "job-2", kind: "mapping_import" },
    });
    await expectJobStatus(client.baseUrl, session, "job-2", "succeeded");
  });

  it("rejects HTTPS jobs without an explicit rights confirmation", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "netgrid-img08-rights-"));
    const inboxRoot = path.join(root, "inbox");
    await mkdir(inboxRoot, { recursive: true });
    await writeFile(path.join(inboxRoot, "mapping.csv"), "synthetic");
    const client = await startClient(
      localConfig(),
      new CardImageMaintenanceService({
        inbox: { inboxRoot },
        store: new CardImageStore({ root: path.join(root, "store") }),
      }),
    );
    const session = await client.login(LOCAL_ORIGIN);
    const response = await fetch(
      `${client.baseUrl}/api/storage/maintenance/card-images/imports/preview`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: session.cookie,
          origin: LOCAL_ORIGIN,
          "x-netgrid-csrf": session.csrfToken,
        },
        body: JSON.stringify({
          sourceMode: "https",
          mapping: "mapping.csv",
          onExisting: "fail",
          rightsConfirmed: false,
        }),
      },
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "card_image_job_input_invalid" },
    });
  });

  it("previews, imports and builds private packs without exposing output paths", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "netgrid-img08-packs-"));
    const inboxRoot = path.join(root, "inbox");
    await mkdir(path.join(inboxRoot, "classic-pack"), { recursive: true });
    await writeFile(path.join(inboxRoot, "classic.csv"), "synthetic");
    const importPack = async (
      options: ImportPrivateCardImagePackOptions,
    ): Promise<ImportPrivateCardImagePackResult> => {
      options.onProgress?.({
        phase: "validating",
        completed: 54,
        total: 54,
      });
      return {
        packId: "netgrid-private-classic-images",
        profileId: "classic",
        importReport: importReport(options.dryRun === true),
      };
    };
    const buildPack = async (
      options: BuildPrivateCardImagePackOptions,
    ): Promise<BuildPrivateCardImagePackResult> => {
      options.onProgress?.({ phase: "building", completed: 54, total: 54 });
      return {
        outputDirectory: path.join(root, "private-build-output"),
        manifest: {
          schemaVersion: "netgrid-card-image-pack-v1",
          minimumImporterVersion: 1,
          packId: "netgrid-private-classic-images",
          profileId: "classic",
          displayName: "NETGRID private Bilder – Classic",
          setId: "classic",
          createdAt: "2026-08-19T00:00:00.000Z",
          cardCount: 54,
          catalogFingerprint: "a".repeat(64),
          entries: [],
        },
      };
    };
    const client = await startClient(
      localConfig(),
      new CardImageMaintenanceService({
        inbox: { inboxRoot },
        store: new CardImageStore({ root: path.join(root, "store") }),
        importPack,
        buildPack,
        idFactory: (() => {
          let id = 10;
          return () => `job-${++id}`;
        })(),
      }),
    );
    const session = await client.login(LOCAL_ORIGIN);
    const headers = {
      "content-type": "application/json",
      cookie: session.cookie,
      origin: LOCAL_ORIGIN,
      "x-netgrid-csrf": session.csrfToken,
    };

    const preview = await fetch(
      `${client.baseUrl}/api/storage/maintenance/card-images/packs/preview`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ pack: "classic-pack", onExisting: "fail" }),
      },
    );
    expect(preview.status).toBe(202);
    const previewJob = await expectJobStatus(
      client.baseUrl,
      session,
      "job-11",
      "succeeded",
    );
    expect(previewJob.report).toMatchObject({
      operation: "preview",
      profileId: "classic",
      cardCount: 54,
    });

    const importWithoutReauth = await fetch(
      `${client.baseUrl}/api/storage/maintenance/card-images/packs/import`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ pack: "classic-pack", onExisting: "replace" }),
      },
    );
    expect(importWithoutReauth.status).toBe(403);
    await reauthenticate(client.baseUrl, session);
    const imported = await fetch(
      `${client.baseUrl}/api/storage/maintenance/card-images/packs/import`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ pack: "classic-pack", onExisting: "replace" }),
      },
    );
    expect(imported.status).toBe(202);
    const importedJob = await expectJobStatus(
      client.baseUrl,
      session,
      "job-12",
      "succeeded",
    );
    expect(importedJob.report).toMatchObject({ operation: "import" });

    await reauthenticate(client.baseUrl, session);
    const built = await fetch(
      `${client.baseUrl}/api/storage/maintenance/card-images/packs/build`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          mapping: "classic.csv",
          profileId: "classic",
          replace: false,
        }),
      },
    );
    expect(built.status).toBe(202);
    const builtJob = await expectJobStatus(
      client.baseUrl,
      session,
      "job-13",
      "succeeded",
    );
    expect(builtJob.report).toMatchObject({
      operation: "build",
      profileId: "classic",
      cardCount: 54,
    });
    expect(JSON.stringify(builtJob)).not.toContain(root);
    expect(JSON.stringify(builtJob)).not.toContain("private-build-output");
  });

  async function startClient(
    config: DeploymentConfig,
    cardImageMaintenance?: CardImageMaintenanceService,
  ) {
    const maintenanceAuth = new MaintenanceAuthService(
      new InMemoryMaintenanceCredentialStore(),
      {
        passwordKdf: {
          keyLength: 32,
          cost: 1024,
          blockSize: 8,
          parallelization: 1,
          maxMemory: 8 * 1024 * 1024,
        },
      },
    );
    await maintenanceAuth.bootstrapPassword(PASSWORD);
    const handle = createNetgridHttpServer(
      new MultiplayerService(new InMemoryMatchStorage(), {
        tokenSalt: "img08-maintenance-test",
      }),
      {
        deploymentConfig: config,
        maintenanceAuth,
        ...(cardImageMaintenance ? { cardImageMaintenance } : {}),
      },
    );
    handles.push(handle);
    await new Promise<void>((resolve) =>
      handle.server.listen(0, "127.0.0.1", resolve),
    );
    const port = (handle.server.address() as AddressInfo).port;
    const baseUrl = `http://127.0.0.1:${port}`;
    return {
      baseUrl,
      async login(origin: string, forwardedHttps = false) {
        const response = await fetch(
          `${baseUrl}/api/storage/maintenance/auth/login`,
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              origin,
              ...(forwardedHttps ? { "x-forwarded-proto": "https" } : {}),
            },
            body: JSON.stringify({ password: PASSWORD }),
          },
        );
        expect(response.status).toBe(200);
        const cookie = response.headers.get("set-cookie")?.split(";", 1)[0];
        const payload = (await response.json()) as { csrfToken?: string };
        if (!cookie || !payload.csrfToken)
          throw new Error("Maintenance login returned no session proof");
        return { cookie, csrfToken: payload.csrfToken };
      },
    };
  }
});

async function expectJobStatus(
  baseUrl: string,
  session: { cookie: string; csrfToken: string },
  jobId: string,
  expectedStatus: "succeeded" | "failed",
): Promise<Record<string, any>> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await fetch(
      `${baseUrl}/api/storage/maintenance/card-images/jobs/${jobId}`,
      { headers: { cookie: session.cookie, origin: LOCAL_ORIGIN } },
    );
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      job: { status: string; error?: unknown };
    };
    if (payload.job.status === expectedStatus)
      return payload.job as Record<string, any>;
    if (payload.job.status === "failed")
      throw new Error(`Card image job failed: ${JSON.stringify(payload.job)}`);
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error(`Card image job did not reach ${expectedStatus}`);
}

async function reauthenticate(
  baseUrl: string,
  session: { cookie: string; csrfToken: string },
): Promise<void> {
  const response = await fetch(
    `${baseUrl}/api/storage/maintenance/auth/reauthenticate`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: session.cookie,
        origin: LOCAL_ORIGIN,
        "x-netgrid-csrf": session.csrfToken,
      },
      body: JSON.stringify({ password: PASSWORD }),
    },
  );
  expect(response.status).toBe(200);
}

function importReport(dryRun: boolean): CardImageImportReport {
  return {
    schemaVersion: "card-image-import-report-v1",
    createdAt: "2026-08-19T00:00:00.000Z",
    collectionId: "personal",
    dryRun,
    onExisting: "fail",
    tableRows: 1,
    selectedRows: 1,
    results: [],
    summary: { bound: 1, replaced: 0, skipped: 0, unchanged: 0 },
  };
}

function localConfig(): DeploymentConfig {
  return loadDeploymentConfig({} as NodeJS.ProcessEnv);
}

function remoteConfig(): DeploymentConfig {
  return loadDeploymentConfig({
    NETGRID_DEPLOYMENT_PROFILE: "private_internet",
    NETGRID_WEB_BASE_URL: "https://play.netgrid.example",
    NETGRID_SERVER_BASE_URL: "https://api.netgrid.example",
    NETGRID_ALLOWED_ORIGINS: "https://play.netgrid.example",
    NETGRID_TOKEN_SALT: "img08-private-test-salt",
    NETGRID_MAINTENANCE_ENABLED: "true",
    NETGRID_MAINTENANCE_BASE_URL: REMOTE_ORIGIN,
    NETGRID_MAINTENANCE_ALLOWED_ORIGINS: REMOTE_ORIGIN,
    NETGRID_MAINTENANCE_TRUSTED_PROXY_ADDRESSES: "127.0.0.1",
  } as NodeJS.ProcessEnv);
}
