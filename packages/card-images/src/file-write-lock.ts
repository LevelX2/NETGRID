import { mkdir, rmdir } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { setTimeout } from "node:timers/promises";

const LOCK_WAIT_MS = 5_000;
const LOCK_POLL_MS = 25;

export class FileWriteLockBusyError extends Error {
  readonly name = "FileWriteLockBusyError";

  constructor() {
    super("Die Datei wird bereits geschrieben.");
  }
}

// An empty sibling directory is acquired atomically across local processes.
export async function withFileWriteLock<T>(
  target: string,
  write: () => Promise<T>,
): Promise<T> {
  const directory = dirname(target);
  const lock = join(directory, `.${basename(target)}.write-lock`);
  await mkdir(directory, { recursive: true });
  const deadline = performance.now() + LOCK_WAIT_MS;
  while (true) {
    try {
      await mkdir(lock);
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      if (performance.now() >= deadline) throw new FileWriteLockBusyError();
      await setTimeout(LOCK_POLL_MS);
    }
  }

  try {
    return await write();
  } finally {
    await rmdir(lock);
  }
}
