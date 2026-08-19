import { createWriteStream } from "node:fs";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { afterEach, describe, expect, it } from "vitest";
import type { Entry } from "yauzl";
import { ZipFile } from "yazl";
import {
  DEFAULT_CARD_IMAGE_PACK_ARCHIVE_LIMITS,
  __cardImagePackArchiveTestOnly,
  createCardImagePackArchive,
  extractCardImagePackArchive,
} from "./pack-archive";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("private card image ZIP transport", () => {
  it("round-trips the canonical package directory without buffering the archive", async () => {
    const fixture = await archiveFixture();
    const archiveFile = path.join(fixture.root, "classic.zip");
    const buildProgress: string[] = [];
    await createCardImagePackArchive({
      sourceDirectory: fixture.packageDirectory,
      targetFile: archiveFile,
      mtime: new Date("2026-08-20T00:00:00.000Z"),
      onProgress: (progress) =>
        buildProgress.push(`${progress.completed}/${progress.total}`),
    });

    const extractProgress: string[] = [];
    const extracted = await extractCardImagePackArchive({
      archiveFile,
      stagingRoot: fixture.stagingRoot,
      onProgress: (progress) =>
        extractProgress.push(`${progress.completed}/${progress.total}`),
    });
    expect(extracted.fileNames).toEqual([
      "images/card.png",
      "mapping.csv",
      "netgrid-card-image-pack.json",
    ]);
    await expect(
      readFile(path.join(extracted.directory, "images", "card.png"), "utf8"),
    ).resolves.toBe("synthetic-image");
    expect(buildProgress.at(0)).toBe("0/3");
    expect(buildProgress.at(-1)).toBe("3/3");
    expect(extractProgress.at(-1)).toBe("3/3");
  });

  it("rejects duplicate entries and removes partial staging", async () => {
    const fixture = await archiveFixture();
    const archiveFile = path.join(fixture.root, "duplicate.zip");
    await writeRawZip(archiveFile, [
      ["netgrid-card-image-pack.json", "{}"],
      ["mapping.csv", "first"],
      ["mapping.csv", "second"],
    ]);

    await expect(
      extractCardImagePackArchive({
        archiveFile,
        stagingRoot: fixture.stagingRoot,
      }),
    ).rejects.toMatchObject({ code: "pack_archive_entry_invalid" });
    await expect(readdir(fixture.stagingRoot)).resolves.toEqual([]);
  });

  it("enforces entry, aggregate and archive limits before activation", async () => {
    const fixture = await archiveFixture();
    const archiveFile = path.join(fixture.root, "limited.zip");
    await createCardImagePackArchive({
      sourceDirectory: fixture.packageDirectory,
      targetFile: archiveFile,
      mtime: new Date("2026-08-20T00:00:00.000Z"),
    });

    await expect(
      extractCardImagePackArchive({
        archiveFile,
        stagingRoot: fixture.stagingRoot,
        limits: {
          ...DEFAULT_CARD_IMAGE_PACK_ARCHIVE_LIMITS,
          maxEntryBytes: 3,
        },
      }),
    ).rejects.toMatchObject({ code: "pack_archive_entry_too_large" });
    await expect(readdir(fixture.stagingRoot)).resolves.toEqual([]);
  });

  it("rejects corrupt archives and unexpected source-directory entries", async () => {
    const fixture = await archiveFixture();
    const corrupt = path.join(fixture.root, "corrupt.zip");
    await writeFile(corrupt, "not-a-zip");
    await expect(
      extractCardImagePackArchive({
        archiveFile: corrupt,
        stagingRoot: fixture.stagingRoot,
      }),
    ).rejects.toMatchObject({ code: "pack_archive_invalid" });
    await writeFile(path.join(fixture.packageDirectory, "unexpected.txt"), "x");
    const target = path.join(fixture.root, "unexpected.zip");
    await expect(
      createCardImagePackArchive({
        sourceDirectory: fixture.packageDirectory,
        targetFile: target,
        mtime: new Date("2026-08-20T00:00:00.000Z"),
      }),
    ).rejects.toMatchObject({ code: "pack_archive_invalid" });
    await expect(readFile(target)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects traversal, absolute, backslash, encrypted and symlink entries", () => {
    for (const fileName of [
      "../escape.png",
      "/absolute.png",
      "C:/drive.png",
      "images\\escape.png",
      "outer/images/card.png",
    ])
      expect(() =>
        __cardImagePackArchiveTestOnly.validateArchiveEntry(
          archiveEntry({ fileName }),
        ),
      ).toThrowError(
        expect.objectContaining({ code: "pack_archive_entry_invalid" }),
      );
    expect(() =>
      __cardImagePackArchiveTestOnly.validateArchiveEntry(
        archiveEntry({ encrypted: true }),
      ),
    ).toThrowError(
      expect.objectContaining({ code: "pack_archive_entry_invalid" }),
    );
    expect(() =>
      __cardImagePackArchiveTestOnly.validateArchiveEntry(
        archiveEntry({ unixMode: 0o120777 }),
      ),
    ).toThrowError(
      expect.objectContaining({ code: "pack_archive_entry_invalid" }),
    );
  });
});

async function archiveFixture() {
  const root = await mkdtemp(path.join(tmpdir(), "netgrid-pack-archive-"));
  temporaryDirectories.push(root);
  const packageDirectory = path.join(root, "classic");
  const stagingRoot = path.join(root, "staging");
  await mkdir(path.join(packageDirectory, "images"), { recursive: true });
  await mkdir(stagingRoot, { recursive: true });
  await writeFile(
    path.join(packageDirectory, "netgrid-card-image-pack.json"),
    "{}",
  );
  await writeFile(path.join(packageDirectory, "mapping.csv"), "mapping");
  await writeFile(
    path.join(packageDirectory, "images", "card.png"),
    "synthetic-image",
  );
  return { root, packageDirectory, stagingRoot };
}

async function writeRawZip(
  target: string,
  entries: ReadonlyArray<readonly [string, string]>,
): Promise<void> {
  const zip = new ZipFile();
  const output = pipeline(
    zip.outputStream as Readable,
    createWriteStream(target, { flags: "wx" }),
  );
  for (const [fileName, content] of entries)
    zip.addBuffer(Buffer.from(content), fileName);
  zip.end();
  await output;
}

function archiveEntry({
  fileName = "images/card.png",
  encrypted = false,
  unixMode = 0o100600,
}: {
  fileName?: string;
  encrypted?: boolean;
  unixMode?: number;
}): Entry {
  return {
    fileName,
    compressionMethod: 0,
    versionMadeBy: 3 << 8,
    externalFileAttributes: (unixMode << 16) >>> 0,
    isEncrypted: () => encrypted,
    canDecodeFileData: () => true,
  } as Entry;
}
