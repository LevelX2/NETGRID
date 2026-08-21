import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import * as ts from "typescript";
import { describe, expect, it } from "vitest";

const GAME_SOURCE_ROOT = join(process.cwd(), "src", "game");

function productionTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory)
    .flatMap((entry) => {
      const path = join(directory, entry);
      if (statSync(path).isDirectory()) return productionTypeScriptFiles(path);
      if (!entry.endsWith(".ts") || entry.endsWith(".test.ts")) return [];
      return [path];
    })
    .sort();
}

function propertyAssignments(
  sourceFile: ts.SourceFile,
  node: ts.ObjectLiteralExpression,
): Map<string, ts.Expression> {
  return new Map(
    node.properties.flatMap((property) => {
      if (!ts.isPropertyAssignment(property)) return [];
      return [
        [
          property.name.getText(sourceFile).replaceAll(/['"]/g, ""),
          property.initializer,
        ] as const,
      ];
    }),
  );
}

describe("choice presentation contract", () => {
  it("requires every production select-option choice to declare a presentation key", () => {
    const missing: string[] = [];
    let choiceCount = 0;

    for (const filePath of productionTypeScriptFiles(GAME_SOURCE_ROOT)) {
      const sourceFile = ts.createSourceFile(
        filePath,
        readFileSync(filePath, "utf8"),
        ts.ScriptTarget.Latest,
        true,
      );
      const visit = (node: ts.Node): void => {
        if (ts.isObjectLiteralExpression(node)) {
          const properties = propertyAssignments(sourceFile, node);
          if (
            properties.get("choiceId") &&
            properties.get("kind")?.getText(sourceFile) === '"select_option"'
          ) {
            choiceCount += 1;
            if (!properties.get("presentationKey")) {
              const line =
                sourceFile.getLineAndCharacterOfPosition(
                  node.getStart(sourceFile),
                ).line + 1;
              missing.push(`${filePath}:${line}`);
            }
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(sourceFile);
    }

    expect(choiceCount).toBeGreaterThan(0);
    expect(missing).toEqual([]);
  });
});
