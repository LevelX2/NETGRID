import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function productionTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return productionTypeScriptFiles(path);
    if (!entry.name.endsWith(".ts") || entry.name.endsWith(".test.ts"))
      return [];
    return statSync(path).isFile() ? [path] : [];
  });
}

describe("direct Add-Tag write boundary", () => {
  it("keeps productive Runner tag increases inside the final damage-domain resolvers", () => {
    const sourceRoot = fileURLToPath(new URL("../../", import.meta.url));
    const directWrites = productionTypeScriptFiles(sourceRoot).flatMap(
      (path) => {
        const matches =
          readFileSync(path, "utf8").match(/runner\.tags\s*\+=/g) ?? [];
        return matches.map(() => path.replaceAll("\\", "/"));
      },
    );

    expect(directWrites).toEqual([
      expect.stringMatching(/game\/damage\/damage-event-resolution\.ts$/),
      expect.stringMatching(/game\/damage\/damage-replacement\.ts$/),
    ]);
  });
});
