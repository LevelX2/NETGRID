import path from "node:path";

type LocalDeckEditorStorageConfig = {
  readonly relativeDirectory: string;
  readonly overrideEnv: string;
};

export function resolveLocalDeckEditorDecksDir(input: {
  readonly baseDir?: string;
  readonly storage: LocalDeckEditorStorageConfig;
}): string {
  if (input.baseDir) return input.baseDir;
  const override = process.env[input.storage.overrideEnv];
  if (override) return override;
  return path.join(
    process.env.APPDATA ?? "",
    ...input.storage.relativeDirectory.split(/[\\/]+/),
  );
}
