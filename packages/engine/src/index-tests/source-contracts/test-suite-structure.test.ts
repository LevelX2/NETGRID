import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sourceRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const releaseTestRoot = join(sourceRoot, "index-tests", "releases");

function lineCount(path: string): number {
  return readFileSync(path, "utf8")
    .replace(/\r?\n$/, "")
    .split(/\r?\n/).length;
}

function testFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return testFiles(path);
      return entry.name.endsWith(".test.ts") && statSync(path).isFile()
        ? [path]
        : [];
    })
    .sort();
}

describe("engine test-suite source contracts", () => {
  it("keeps release smoke suites in navigable release ranges", () => {
    expect(
      existsSync(
        join(releaseTestRoot, "mechanic-package-smokes-v16-v199.test.ts"),
      ),
    ).toBe(false);
    expect(
      existsSync(join(releaseTestRoot, "card-release-smokes.test.ts")),
    ).toBe(false);

    const splitReleaseSmokes = testFiles(releaseTestRoot).filter((path) =>
      /(?:mechanic-package|card-release)-smokes-v/.test(path),
    );
    expect(splitReleaseSmokes).toHaveLength(11);
    for (const path of splitReleaseSmokes) {
      expect(
        lineCount(path),
        `${relative(sourceRoot, path)} exceeds the release-smoke ceiling`,
      ).toBeLessThanOrEqual(3000);
    }
  });

  it("prevents a new engine test monolith larger than the remaining longtail suite", () => {
    for (const path of testFiles(sourceRoot)) {
      expect(
        lineCount(path),
        `${relative(sourceRoot, path)} exceeds the engine test-file ceiling`,
      ).toBeLessThanOrEqual(7000);
    }
  });
});
