import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const runtimeInternalDir = dirname(fileURLToPath(import.meta.url));
const gameDir = join(runtimeInternalDir, "..");
const srcDir = join(gameDir, "..");

function lineCount(path: string): number {
  const text = readFileSync(path, "utf8");
  if (text.length === 0) return 0;
  return text.replace(/\r?\n$/, "").split(/\r?\n/).length;
}

function allFiles(dir: string): string[] {
  return readdirSync(dir)
    .flatMap((entry) => {
      const path = join(dir, entry);
      return statSync(path).isDirectory() ? allFiles(path) : [path];
    })
    .sort();
}

describe("engine runtime module size gates", () => {
  it("keeps the public facades and runtime residue under their ceilings", () => {
    expect(lineCount(join(srcDir, "index.ts"))).toBeLessThanOrEqual(100);
    expect(lineCount(join(gameDir, "engine-runtime.ts"))).toBeLessThanOrEqual(
      100,
    );
    expect(lineCount(join(runtimeInternalDir, "runtime-implementation.ts")))
      .toBeLessThanOrEqual(1800);
    expect(lineCount(join(runtimeInternalDir, "choice-hidden-zone-runtime.ts")))
      .toBeLessThanOrEqual(3200);
  });

  it("keeps internal runtime modules from becoming new monoliths", () => {
    const runtimeFiles = allFiles(runtimeInternalDir).filter(
      (path) =>
        path.endsWith(".ts") &&
        !path.endsWith(".test.ts") &&
        !path.endsWith("runtime-implementation.ts"),
    );

    for (const path of runtimeFiles) {
      expect(
        lineCount(path),
        `${relative(srcDir, path)} exceeds the runtime-internal module ceiling`,
      ).toBeLessThanOrEqual(3200);
    }
  });

  it("keeps the staged public API explicit", () => {
    const publicApiSource = readFileSync(
      join(runtimeInternalDir, "public-api.ts"),
      "utf8",
    );

    expect(publicApiSource).not.toContain(
      'export * from "./runtime-implementation"',
    );
  });

  it("keeps production imports out of public and runtime facades", () => {
    const productionGameFiles = allFiles(gameDir).filter(
      (path) => path.endsWith(".ts") && !path.endsWith(".test.ts"),
    );

    for (const path of productionGameFiles) {
      const source = readFileSync(path, "utf8");
      expect(source, `${relative(srcDir, path)} imports public index`).not
        .toMatch(/from ["'](?:\.\.\/index|\.\.\/\.\.\/index)["']/);
    }

    const deepProductionFiles = productionGameFiles.filter(
      (path) =>
        !path.endsWith(join("game", "engine-runtime.ts")) &&
        !path.includes(`${join("game", "engine-runtime-internal")}`),
    );

    for (const path of deepProductionFiles) {
      const source = readFileSync(path, "utf8");
      expect(source, `${relative(srcDir, path)} imports runtime boundary`).not
        .toMatch(/from ["'].*engine-runtime(?:-internal)?/);
    }
  });
});
