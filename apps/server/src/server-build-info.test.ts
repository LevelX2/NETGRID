import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { describe, expect, it, vi } from "vitest";
import { NETGRID_PRODUCT_VERSION, isServerBuildInfo } from "@netgrid/shared";
import { readServerBuildInfo, SERVER_BUILD_INFO } from "./server-build-info";
import { loadDeploymentConfig, redactedHealth } from "./internet-hardening";

const metadata = {
  buildNumber: "8090",
  commit: "123abcdef",
  sourceDate: "2026-09-05T12:00:00Z",
  dirty: true,
};

describe("backend process build identity", () => {
  it("captures the loaded source and exposes only safe build metadata in health", () => {
    const readGit = vi
      .fn()
      .mockReturnValueOnce(metadata.buildNumber)
      .mockReturnValueOnce(metadata.commit)
      .mockReturnValueOnce(metadata.sourceDate)
      .mockReturnValueOnce(" M private-local-file.txt");
    const info = readServerBuildInfo({
      readGit,
      startedAt: "2026-09-05T13:00:00Z",
    });
    expect(info).toEqual({
      ...metadata,
      productVersion: NETGRID_PRODUCT_VERSION,
      source: "git",
      startedAt: "2026-09-05T13:00:00Z",
    });
    expect(readGit).toHaveBeenCalledTimes(4);
    const health = redactedHealth(
      { ok: true, kind: "memory" },
      loadDeploymentConfig({} as NodeJS.ProcessEnv),
    );
    expect(health.release).toBe(`V${NETGRID_PRODUCT_VERSION}`);
    expect(health.build).toBe(SERVER_BUILD_INFO);
    expect(JSON.stringify(health)).not.toContain("private-local-file");
  });

  it("reports missing Git explicitly and rejects invalid embedded metadata", () => {
    const info = readServerBuildInfo({
      readGit: () => {
        throw new Error("git missing");
      },
    });
    expect(info).toMatchObject({
      source: "unavailable",
      buildNumber: null,
      commit: null,
      dirty: null,
    });
    expect(isServerBuildInfo(info)).toBe(true);
    expect(() => readServerBuildInfo({ embedded: "{}" })).toThrow(
      "server_build_metadata_invalid",
    );
    const readGit = vi.fn();
    const embedded = readServerBuildInfo({
      embedded: JSON.stringify({ ...metadata, secret: "must-not-escape" }),
      readGit,
    });
    expect(embedded).toMatchObject({ ...metadata, source: "embedded" });
    expect(JSON.stringify(embedded)).not.toContain("must-not-escape");
    expect(readGit).not.toHaveBeenCalled();
  });

  it("runs the release-bundled build identity without a Git executable or checkout", async () => {
    const result = await build({
      entryPoints: [
        fileURLToPath(new URL("./server-build-info.ts", import.meta.url)),
      ],
      bundle: true,
      write: false,
      platform: "node",
      format: "esm",
      target: "node24",
      define: {
        "process.env.NETGRID_SERVER_BUILD_INFO": JSON.stringify(
          JSON.stringify(metadata),
        ),
      },
    });
    const dir = mkdtempSync(join(tmpdir(), "netgrid-build-identity-"));
    const file = join(dir, "build.mjs");
    try {
      writeFileSync(
        file,
        result.outputFiles[0]!.text +
          "\nconsole.log(JSON.stringify(SERVER_BUILD_INFO));\n",
      );
      const output = execFileSync(process.execPath, [file], {
        cwd: dir,
        encoding: "utf8",
        env: { ...process.env, PATH: "" },
      });
      expect(JSON.parse(output)).toMatchObject({
        ...metadata,
        productVersion: NETGRID_PRODUCT_VERSION,
        source: "embedded",
      });
    } finally {
      rmSync(file);
      rmdirSync(dir);
    }
  });
});
