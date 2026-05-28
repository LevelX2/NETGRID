import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
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
    expect(lineCount(join(srcDir, "index.ts"))).toBeLessThanOrEqual(150);
    expect(lineCount(join(gameDir, "engine-runtime.ts"))).toBeLessThanOrEqual(
      150,
    );
    const runtimeImplementationPath = join(
      runtimeInternalDir,
      "runtime-implementation.ts",
    );
    if (existsSync(runtimeImplementationPath)) {
      expect(lineCount(runtimeImplementationPath)).toBeLessThanOrEqual(200);
    }
    expect(
      lineCount(join(runtimeInternalDir, "choice-hidden-zone-runtime.ts")),
    ).toBeLessThanOrEqual(1000);
    for (const module of [
      "pending-choice-runtime-hosts.ts",
      "hidden-zone-search-runtime.ts",
      "hidden-zone-arrange-runtime.ts",
      "hidden-zone-nonsearch-runtime.ts",
      "hidden-zone-nonsearch-playful-ai-runtime.ts",
      "corp-zone-runtime-hosts.ts",
    ]) {
      expect(
        lineCount(join(runtimeInternalDir, module)),
        `${module} exceeds the choice/hidden-zone submodule ceiling`,
      ).toBeLessThanOrEqual(1500);
    }
    expect(
      lineCount(join(runtimeInternalDir, "runtime-bootstrap.ts")),
    ).toBeLessThanOrEqual(3200);
    expect(
      lineCount(join(runtimeInternalDir, "runtime-delegates.ts")),
    ).toBeLessThanOrEqual(600);
    expect(
      lineCount(join(runtimeInternalDir, "card-runtime-hosts.ts")),
    ).toBeLessThanOrEqual(900);
    for (const module of [
      "activated-card-runtime-hosts.ts",
      "card-lifecycle-runtime-hosts.ts",
      "card-runtime-deps-hosts.ts",
      "trigger-ability-runtime-hosts.ts",
    ]) {
      expect(
        lineCount(join(runtimeInternalDir, module)),
        `${module} exceeds the card runtime host submodule ceiling`,
      ).toBeLessThanOrEqual(1500);
    }
    for (const module of [
      "action-runtime-delegates.ts",
      "card-runtime-delegates.ts",
      "choice-runtime-delegates.ts",
      "flow-runtime-delegates.ts",
      "state-runtime-delegates.ts",
    ]) {
      expect(
        lineCount(join(runtimeInternalDir, module)),
        `${module} exceeds the runtime delegate submodule ceiling`,
      ).toBeLessThanOrEqual(1200);
    }
  });

  it("keeps internal runtime modules from becoming new monoliths", () => {
    const runtimeFiles = allFiles(runtimeInternalDir).filter(
      (path) => path.endsWith(".ts") && !path.endsWith(".test.ts"),
    );

    for (const path of runtimeFiles) {
      expect(
        lineCount(path),
        `${relative(srcDir, path)} exceeds the runtime-internal module ceiling`,
      ).toBeLessThanOrEqual(3200);
    }
  });

  it("keeps the staged public API explicit", () => {
    const indexSource = readFileSync(join(srcDir, "index.ts"), "utf8");
    const engineRuntimeSource = readFileSync(
      join(gameDir, "engine-runtime.ts"),
      "utf8",
    );
    const publicApiSource = readFileSync(
      join(runtimeInternalDir, "public-api.ts"),
      "utf8",
    );

    expect(indexSource).not.toContain('export * from "./game/engine-runtime"');
    expect(engineRuntimeSource).not.toContain(
      'export * from "./engine-runtime-internal"',
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
      expect(
        source,
        `${relative(srcDir, path)} imports public index`,
      ).not.toMatch(/from ["'](?:\.\.\/index|\.\.\/\.\.\/index)["']/);
    }

    const deepProductionFiles = productionGameFiles.filter(
      (path) =>
        !path.endsWith(join("game", "engine-runtime.ts")) &&
        !path.includes(`${join("game", "engine-runtime-internal")}`),
    );

    for (const path of deepProductionFiles) {
      const source = readFileSync(path, "utf8");
      expect(
        source,
        `${relative(srcDir, path)} imports runtime boundary`,
      ).not.toMatch(/from ["'].*engine-runtime(?:-internal)?/);
    }
  });
});
