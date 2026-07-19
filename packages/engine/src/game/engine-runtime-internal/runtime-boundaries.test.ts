import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const runtimeInternalDir = dirname(fileURLToPath(import.meta.url));
const gameDir = join(runtimeInternalDir, "..");
const srcDir = join(gameDir, "..");

function allFiles(dir: string): string[] {
  return readdirSync(dir)
    .flatMap((entry) => {
      const path = join(dir, entry);
      return statSync(path).isDirectory() ? allFiles(path) : [path];
    })
    .sort();
}

describe("engine runtime boundaries", () => {
  it("keeps the staged public API explicit", () => {
    const indexSource = readFileSync(join(srcDir, "index.ts"), "utf8");
    const engineRuntimeSource = readFileSync(join(gameDir, "engine-runtime.ts"), "utf8");
    const publicApiSource = readFileSync(join(runtimeInternalDir, "public-api.ts"), "utf8");

    expect(indexSource).not.toContain('export * from "./game/engine-runtime"');
    expect(engineRuntimeSource).not.toContain('export * from "./engine-runtime-internal"');
    expect(publicApiSource).not.toContain('export * from "./runtime-implementation"');
  });

  it("keeps production imports out of public and runtime facades", () => {
    const productionGameFiles = allFiles(gameDir).filter((path) => path.endsWith(".ts") && !path.endsWith(".test.ts"));

    for (const path of productionGameFiles) {
      const source = readFileSync(path, "utf8");
      expect(source, `${relative(srcDir, path)} imports public index`).not.toMatch(/from ["'](?:\.\.\/index|\.\.\/\.\.\/index)["']/);
    }

    const deepProductionFiles = productionGameFiles.filter(
      (path) =>
        !path.endsWith(join("game", "engine-runtime.ts")) &&
        !path.includes(`${join("game", "engine-runtime-internal")}`),
    );

    for (const path of deepProductionFiles) {
      const source = readFileSync(path, "utf8");
      expect(source, `${relative(srcDir, path)} imports runtime boundary`).not.toMatch(/from ["'].*engine-runtime(?:-internal)?/);
    }
  });
});
