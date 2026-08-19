import { afterEach, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { CardImageStore } from "@netgrid/card-images";
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
    expect(template.trimEnd().split("\n")).toHaveLength(55);
    expect(template).toContain("printingId");
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
        if (!cookie) throw new Error("Maintenance login returned no cookie");
        return { cookie };
      },
    };
  }
});

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
