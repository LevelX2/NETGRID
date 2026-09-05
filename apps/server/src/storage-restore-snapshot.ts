import { createHash, randomUUID } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

const sqliteSuffixes = ["", "-wal", "-shm", "-journal"] as const;

/** The caller must have stopped every process using this database. A target
 * being replaced is untrusted; preservation must not require valid SQLite. */
export function preserveStoppedSqliteTarget(
  targetPath: string,
  backupRoot: string,
): {
  snapshotDirectory?: string;
  discardPreservedSidecars: () => void;
} {
  const files = sqliteSuffixes.flatMap((suffix) => {
    const source = `${targetPath}${suffix}`;
    if (!existsSync(source)) return [];
    const attributes = lstatSync(source);
    if (!attributes.isFile() || attributes.isSymbolicLink())
      throw new Error("restore_target_not_regular_file");
    return [
      {
        suffix,
        source,
        name: `database.sqlite${suffix}`,
        sha256: hash(source),
      },
    ];
  });
  if (!files.length)
    return {
      discardPreservedSidecars() {
        if (
          sqliteSuffixes.some((suffix) => existsSync(`${targetPath}${suffix}`))
        )
          throw new Error("restore_target_changed_after_snapshot");
      },
    };
  const snapshotDirectory = join(
    resolve(backupRoot),
    "pre-restore-snapshots",
    randomUUID(),
  );
  mkdirSync(snapshotDirectory, { recursive: true });
  for (const file of files) {
    const destination = join(snapshotDirectory, file.name);
    copyFileSync(file.source, destination);
    if (
      hash(destination) !== file.sha256 ||
      hash(file.source) !== file.sha256
    ) {
      throw new Error("restore_target_snapshot_changed");
    }
  }
  // Deliberately not a BackupManifest: these bytes may be corrupt and must not
  // be offered as a validated SQLite backup by the restore/backup interface.
  writeFileSync(
    join(snapshotDirectory, "snapshot.json"),
    `${JSON.stringify(
      {
        schemaVersion: "netgrid-pre-restore-files-v1",
        createdAt: new Date().toISOString(),
        sqliteHealth: "not-asserted",
        files: files.map(({ name, sha256 }) => ({ name, sha256 })),
      },
      null,
      2,
    )}\n`,
  );
  return {
    snapshotDirectory,
    discardPreservedSidecars() {
      // A new or changed sidecar indicates the offline precondition was lost.
      for (const suffix of sqliteSuffixes) {
        const source = `${targetPath}${suffix}`;
        const original = files.find((file) => file.suffix === suffix);
        if (
          existsSync(source) !== Boolean(original) ||
          (original &&
            (!lstatSync(source).isFile() ||
              lstatSync(source).isSymbolicLink() ||
              hash(source) !== original.sha256))
        ) {
          throw new Error("restore_target_changed_after_snapshot");
        }
      }
      for (const file of files) if (file.suffix) unlinkSync(file.source);
    },
  };
}

function hash(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}
