import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  NetgridPathConfigError,
  resolveNetgridCardImageRoot,
  resolveNetgridDataRoot,
  resolveNetgridManagedCardImageRoot,
  resolveNetgridRepositoryRoot,
} from "./paths";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("NETGRID path contract", () => {
  it("discovers the repository root from a nested working directory", async () => {
    const root = await temporaryRoot();
    const nested = path.join(root, "apps", "web", "app");
    await mkdir(nested, { recursive: true });

    expect(resolveNetgridRepositoryRoot(nested)).toBe(root);
    expect(resolveNetgridDataRoot({ startDirectory: nested })).toBe(
      path.join(root, "data"),
    );
    expect(resolveNetgridCardImageRoot({ startDirectory: nested })).toBe(
      path.join(root, "data", "local-assets", "card-images"),
    );
  });

  it("derives managed image paths below an explicit persistent data root", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "netgrid-data-root-"));
    temporaryDirectories.push(root);

    expect(
      resolveNetgridDataRoot({ env: { NETGRID_DATA_ROOT: root } }),
    ).toBe(root);
    expect(
      resolveNetgridCardImageRoot({ env: { NETGRID_DATA_ROOT: root } }),
    ).toBe(path.join(root, "card-images"));
    expect(
      resolveNetgridManagedCardImageRoot({
        env: { NETGRID_DATA_ROOT: root },
      }),
    ).toBe(path.join(root, "card-images", "managed"));
  });

  it("rejects relative and filesystem-root targets", () => {
    expect(() =>
      resolveNetgridDataRoot({ env: { NETGRID_DATA_ROOT: "relative" } }),
    ).toThrowError(
      expect.objectContaining<Partial<NetgridPathConfigError>>({
        code: "data_root_must_be_absolute",
      }),
    );
    expect(() =>
      resolveNetgridDataRoot({
        env: { NETGRID_DATA_ROOT: path.parse(process.cwd()).root },
      }),
    ).toThrowError(
      expect.objectContaining<Partial<NetgridPathConfigError>>({
        code: "data_root_too_broad",
      }),
    );
  });

  it("fails visibly when neither configuration nor repository exists", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "netgrid-no-root-"));
    temporaryDirectories.push(root);

    expect(() => resolveNetgridRepositoryRoot(root)).toThrowError(
      expect.objectContaining<Partial<NetgridPathConfigError>>({
        code: "repository_root_not_found",
      }),
    );
  });
});

async function temporaryRoot(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "netgrid-repo-root-"));
  temporaryDirectories.push(root);
  await mkdir(path.join(root, "data", "card-import"), { recursive: true });
  await writeFile(path.join(root, "package.json"), "{}", "utf8");
  return root;
}
