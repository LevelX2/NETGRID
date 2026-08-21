import { createWriteStream } from "node:fs";
import {
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  realpath,
  rm,
  stat,
} from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { openPromise, type Entry } from "yauzl";
import { ZipFile } from "yazl";

export const DEFAULT_CARD_IMAGE_PACK_ARCHIVE_LIMITS = Object.freeze({
  maxArchiveBytes: 512 * 1024 * 1024,
  maxEntries: 1_000,
  maxEntryBytes: 50 * 1024 * 1024,
  maxTotalBytes: 1024 * 1024 * 1024,
});

export type CardImagePackArchiveLimits = {
  maxArchiveBytes: number;
  maxEntries: number;
  maxEntryBytes: number;
  maxTotalBytes: number;
};

export type CardImagePackArchiveProgress = {
  phase: "archiving" | "extracting";
  completed: number;
  total: number;
  relativePath?: string;
};

export type CardImagePackArchiveErrorCode =
  | "pack_archive_missing"
  | "pack_archive_invalid"
  | "pack_archive_too_large"
  | "pack_archive_entry_invalid"
  | "pack_archive_entry_too_large";

export class CardImagePackArchiveError extends Error {
  constructor(
    readonly code: CardImagePackArchiveErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "CardImagePackArchiveError";
  }
}

export type CreateCardImagePackArchiveOptions = {
  sourceDirectory: string;
  targetFile: string;
  mtime: Date;
  limits?: CardImagePackArchiveLimits;
  onProgress?: (progress: CardImagePackArchiveProgress) => void;
};

export type ExtractCardImagePackArchiveOptions = {
  archiveFile: string;
  stagingRoot: string;
  limits?: CardImagePackArchiveLimits;
  onProgress?: (progress: CardImagePackArchiveProgress) => void;
};

export type ExtractedCardImagePackArchive = {
  directory: string;
  fileNames: readonly string[];
};

export async function createCardImagePackArchive(
  options: CreateCardImagePackArchiveOptions,
): Promise<void> {
  const limits = options.limits ?? DEFAULT_CARD_IMAGE_PACK_ARCHIVE_LIMITS;
  const sourceDirectory = await canonicalDirectory(options.sourceDirectory);
  const files = await packageFiles(sourceDirectory, limits);
  const targetFile = path.resolve(options.targetFile);
  await mkdir(path.dirname(targetFile), { recursive: true });
  const zip = new ZipFile();
  const output = createWriteStream(targetFile, { flags: "wx" });
  const completed = pipeline(zip.outputStream as Readable, output);
  options.onProgress?.({
    phase: "archiving",
    completed: 0,
    total: files.length,
  });
  try {
    for (const [index, file] of files.entries()) {
      zip.addFile(file.absolutePath, file.relativePath, {
        mtime: options.mtime,
        mode: 0o600,
        compress: !file.relativePath.startsWith("images/"),
      });
      options.onProgress?.({
        phase: "archiving",
        completed: index + 1,
        total: files.length,
        relativePath: file.relativePath,
      });
    }
    zip.end();
    await completed;
  } catch (error) {
    output.destroy();
    await completed.catch(() => undefined);
    await rm(targetFile, { force: true });
    if (error instanceof CardImagePackArchiveError) throw error;
    throw invalidArchive("ZIP-Bildpaket konnte nicht erstellt werden.");
  }
}

export async function extractCardImagePackArchive(
  options: ExtractCardImagePackArchiveOptions,
): Promise<ExtractedCardImagePackArchive> {
  const limits = options.limits ?? DEFAULT_CARD_IMAGE_PACK_ARCHIVE_LIMITS;
  const archiveFile = await canonicalArchiveFile(options.archiveFile, limits);
  const stagingRoot = path.resolve(options.stagingRoot);
  await mkdir(stagingRoot, { recursive: true });
  const directory = await mkdtemp(path.join(stagingRoot, "pack-zip-"));
  try {
    const zip = await openPromise(archiveFile, {
      autoClose: true,
      decodeStrings: true,
      strictFileNames: true,
      validateEntrySizes: true,
    });
    if (zip.entryCount > limits.maxEntries)
      throw new CardImagePackArchiveError(
        "pack_archive_too_large",
        `ZIP-Bildpaket enthält mehr als ${limits.maxEntries} Einträge.`,
      );
    const seen = new Set<string>();
    const fileNames: string[] = [];
    let declaredTotal = 0;
    let actualTotal = 0;
    let completed = 0;
    options.onProgress?.({
      phase: "extracting",
      completed: 0,
      total: zip.entryCount,
    });
    try {
      for await (const entry of zip.eachEntry()) {
        const relativePath = validateArchiveEntry(entry);
        if (seen.has(relativePath))
          throw new CardImagePackArchiveError(
            "pack_archive_entry_invalid",
            `ZIP-Bildpaket enthält den Pfad ${relativePath} mehrfach.`,
          );
        seen.add(relativePath);
        const directoryEntry = relativePath.endsWith("/");
        if (!directoryEntry) {
          if (entry.uncompressedSize > limits.maxEntryBytes)
            throw new CardImagePackArchiveError(
              "pack_archive_entry_too_large",
              `ZIP-Eintrag ${relativePath} überschreitet 50 MiB.`,
            );
          declaredTotal += entry.uncompressedSize;
          if (declaredTotal > limits.maxTotalBytes)
            throw new CardImagePackArchiveError(
              "pack_archive_too_large",
              "ZIP-Bildpaket überschreitet 1 GiB entpackte Gesamtgröße.",
            );
          const target = safeArchiveTarget(directory, relativePath);
          await mkdir(path.dirname(target), { recursive: true });
          const input = await zip.openReadStreamPromise(entry);
          let entryBytes = 0;
          const limiter = new Transform({
            transform(chunk: Buffer, _encoding, callback) {
              entryBytes += chunk.byteLength;
              actualTotal += chunk.byteLength;
              if (
                entryBytes > limits.maxEntryBytes ||
                actualTotal > limits.maxTotalBytes
              )
                callback(
                  new CardImagePackArchiveError(
                    "pack_archive_entry_too_large",
                    `ZIP-Eintrag ${relativePath} überschreitet die Entpackgrenze.`,
                  ),
                );
              else callback(null, chunk);
            },
          });
          await pipeline(
            input,
            limiter,
            createWriteStream(target, { flags: "wx", mode: 0o600 }),
          );
          if (entryBytes !== entry.uncompressedSize)
            throw invalidArchive(
              `ZIP-Eintrag ${relativePath} besitzt eine falsche Größenangabe.`,
            );
          fileNames.push(relativePath);
        }
        completed += 1;
        options.onProgress?.({
          phase: "extracting",
          completed,
          total: zip.entryCount,
          relativePath,
        });
      }
    } finally {
      if (zip.isOpen) zip.close();
    }
    if (
      !fileNames.includes("netgrid-card-image-pack.json") ||
      !fileNames.includes("mapping.csv")
    )
      throw invalidArchive(
        "ZIP-Bildpaket enthält Manifest oder Zuordnungstabelle nicht auf Archivebene.",
      );
    return { directory, fileNames: fileNames.sort() };
  } catch (error) {
    await rm(directory, { recursive: true, force: true });
    if (error instanceof CardImagePackArchiveError) throw error;
    throw invalidArchive("ZIP-Bildpaket ist beschädigt oder nicht lesbar.");
  }
}

async function packageFiles(
  sourceDirectory: string,
  limits: CardImagePackArchiveLimits,
): Promise<
  Array<{ absolutePath: string; relativePath: string; bytes: number }>
> {
  const rootEntries = await readdir(sourceDirectory, { withFileTypes: true });
  const allowedRoot = new Set([
    "netgrid-card-image-pack.json",
    "mapping.csv",
    "images",
  ]);
  if (rootEntries.some((entry) => !allowedRoot.has(entry.name)))
    throw invalidArchive("Bildpaketverzeichnis enthält unerwartete Einträge.");
  const files: Array<{
    absolutePath: string;
    relativePath: string;
    bytes: number;
  }> = [];
  for (const rootFile of ["netgrid-card-image-pack.json", "mapping.csv"]) {
    files.push(await regularPackageFile(sourceDirectory, rootFile));
  }
  const imagesDirectory = safeArchiveTarget(sourceDirectory, "images");
  const imageDirectoryStats = await lstat(imagesDirectory).catch(
    () => undefined,
  );
  if (
    !imageDirectoryStats?.isDirectory() ||
    imageDirectoryStats.isSymbolicLink()
  )
    throw invalidArchive(
      "Bildpaketverzeichnis enthält kein reguläres images-Verzeichnis.",
    );
  for (const entry of await readdir(imagesDirectory, { withFileTypes: true })) {
    if (!entry.isFile() || entry.isSymbolicLink())
      throw invalidArchive(
        "Bildpaket-images enthält keinen regulären Dateibestand.",
      );
    files.push(
      await regularPackageFile(
        sourceDirectory,
        path.posix.join("images", entry.name),
      ),
    );
  }
  files.sort((left, right) =>
    left.relativePath.localeCompare(right.relativePath),
  );
  if (files.length > limits.maxEntries)
    throw new CardImagePackArchiveError(
      "pack_archive_too_large",
      `Bildpaket enthält mehr als ${limits.maxEntries} Dateien.`,
    );
  let totalBytes = 0;
  for (const file of files) {
    if (file.bytes > limits.maxEntryBytes)
      throw new CardImagePackArchiveError(
        "pack_archive_entry_too_large",
        `Paketdatei ${file.relativePath} überschreitet 50 MiB.`,
      );
    totalBytes += file.bytes;
    if (totalBytes > limits.maxTotalBytes)
      throw new CardImagePackArchiveError(
        "pack_archive_too_large",
        "Bildpaket überschreitet 1 GiB Gesamtgröße.",
      );
  }
  return files;
}

async function regularPackageFile(
  sourceDirectory: string,
  relativePath: string,
): Promise<{ absolutePath: string; relativePath: string; bytes: number }> {
  const absolutePath = safeArchiveTarget(sourceDirectory, relativePath);
  const fileStats = await lstat(absolutePath).catch(() => undefined);
  if (!fileStats?.isFile() || fileStats.isSymbolicLink())
    throw invalidArchive(
      `Paketdatei ${relativePath} fehlt oder ist nicht regulär.`,
    );
  const canonical = await realpath(absolutePath);
  safeArchiveTarget(sourceDirectory, path.relative(sourceDirectory, canonical));
  return { absolutePath: canonical, relativePath, bytes: fileStats.size };
}

async function canonicalDirectory(directory: string): Promise<string> {
  try {
    const canonical = await realpath(path.resolve(directory));
    const directoryStats = await lstat(canonical);
    if (!directoryStats.isDirectory() || directoryStats.isSymbolicLink())
      throw invalidArchive("Bildpaketquelle ist kein reguläres Verzeichnis.");
    return canonical;
  } catch (error) {
    if (error instanceof CardImagePackArchiveError) throw error;
    throw invalidArchive("Bildpaketquelle wurde nicht gefunden.");
  }
}

async function canonicalArchiveFile(
  archiveFile: string,
  limits: CardImagePackArchiveLimits,
): Promise<string> {
  try {
    const directStats = await lstat(path.resolve(archiveFile));
    if (!directStats.isFile() || directStats.isSymbolicLink())
      throw invalidArchive("ZIP-Bildpaket ist keine reguläre lokale Datei.");
    if (directStats.size > limits.maxArchiveBytes)
      throw new CardImagePackArchiveError(
        "pack_archive_too_large",
        "ZIP-Bildpaket überschreitet 512 MiB Archivgröße.",
      );
    return await realpath(path.resolve(archiveFile));
  } catch (error) {
    if (error instanceof CardImagePackArchiveError) throw error;
    if (isMissingFileError(error))
      throw new CardImagePackArchiveError(
        "pack_archive_missing",
        "ZIP-Bildpaket wurde nicht gefunden.",
      );
    throw invalidArchive("ZIP-Bildpaket ist nicht lesbar.");
  }
}

function validateArchiveEntry(entry: Entry): string {
  const relativePath = entry.fileName;
  const directory = relativePath.endsWith("/");
  if (
    !relativePath ||
    relativePath.includes("\\") ||
    path.posix.isAbsolute(relativePath) ||
    /^[A-Za-z]:/.test(relativePath) ||
    path.posix.normalize(relativePath) !== relativePath ||
    relativePath
      .split("/")
      .filter(Boolean)
      .some((segment) => segment === "." || segment === "..") ||
    (directory
      ? relativePath !== "images/"
      : relativePath !== "netgrid-card-image-pack.json" &&
        relativePath !== "mapping.csv" &&
        !/^images\/[^/]+$/.test(relativePath))
  )
    throw new CardImagePackArchiveError(
      "pack_archive_entry_invalid",
      `ZIP-Bildpaket enthält den unzulässigen Pfad ${relativePath || "<leer>"}.`,
    );
  if (entry.isEncrypted() || !entry.canDecodeFileData())
    throw new CardImagePackArchiveError(
      "pack_archive_entry_invalid",
      `ZIP-Eintrag ${relativePath} ist verschlüsselt oder nicht dekodierbar.`,
    );
  if (entry.compressionMethod !== 0 && entry.compressionMethod !== 8)
    throw new CardImagePackArchiveError(
      "pack_archive_entry_invalid",
      `ZIP-Eintrag ${relativePath} verwendet eine unzulässige Kompressionsmethode.`,
    );
  const originSystem = entry.versionMadeBy >>> 8;
  const unixMode = (entry.externalFileAttributes >>> 16) & 0xffff;
  const fileType = unixMode & 0o170000;
  if (
    originSystem === 3 &&
    (fileType === 0o120000 ||
      (fileType !== 0 && fileType !== (directory ? 0o040000 : 0o100000)))
  )
    throw new CardImagePackArchiveError(
      "pack_archive_entry_invalid",
      `ZIP-Eintrag ${relativePath} ist kein regulärer Datei- oder Verzeichniseintrag.`,
    );
  return relativePath;
}

function safeArchiveTarget(root: string, relativePath: string): string {
  const resolvedRoot = path.resolve(root);
  const target = path.resolve(
    resolvedRoot,
    relativePath.split("/").join(path.sep),
  );
  if (
    target === resolvedRoot ||
    !target.startsWith(`${resolvedRoot}${path.sep}`)
  )
    throw new CardImagePackArchiveError(
      "pack_archive_entry_invalid",
      "ZIP-Bildpaketpfad verlässt den erlaubten Staging-Root.",
    );
  return target;
}

function invalidArchive(message: string): CardImagePackArchiveError {
  return new CardImagePackArchiveError("pack_archive_invalid", message);
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

export const __cardImagePackArchiveTestOnly = {
  validateArchiveEntry,
};
