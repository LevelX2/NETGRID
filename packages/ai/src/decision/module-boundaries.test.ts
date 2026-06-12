import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

type ImportReference = {
  importSource: string;
  isTypeOnly: boolean;
  line: number;
};

const decisionDir = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(decisionDir, "..");

describe("AI module boundaries", () => {
  it("keeps decision modules independent from evaluation and runtime implementation", () => {
    const violations = productionFiles("decision").flatMap((file) =>
      importsFrom(file).flatMap((reference) => {
        if (resolvesToSrcArea(file, reference.importSource, "evaluation")) {
          return [
            violation(
              file,
              reference,
              "decision modules must not import evaluation modules",
            ),
          ];
        }

        if (resolvesToSrcArea(file, reference.importSource, "runtime")) {
          const isAllowedRuntimeTypeImport =
            reference.isTypeOnly &&
            resolvedImportBasename(file, reference.importSource) ===
              "semantic-runtime-types";
          if (!isAllowedRuntimeTypeImport) {
            return [
              violation(
                file,
                reference,
                "decision modules must not import runtime implementation",
              ),
            ];
          }
        }

        return [];
      }),
    );

    expect(violations).toEqual([]);
  });

  it("keeps play-strength pilot scope modules out of evaluation and runtime selection", () => {
    const pilotRoot = path.join(srcDir, "decision", "pilot");
    const violations = collectSourceFiles(pilotRoot)
      .filter((file) => !file.endsWith(".test.ts"))
      .flatMap((file) =>
        importsFrom(file).flatMap((reference) => {
          if (resolvesToSrcArea(file, reference.importSource, "evaluation")) {
            return [
              violation(
                file,
                reference,
                "pilot scopes must not import evaluation modules",
              ),
            ];
          }
          if (resolvesToSrcArea(file, reference.importSource, "runtime")) {
            const isAllowedRegistryTypeImport =
              path.basename(file) === "pilot-scope-registry.ts" &&
              reference.isTypeOnly &&
              resolvedImportBasename(file, reference.importSource) ===
                "semantic-runtime-types";
            if (!isAllowedRegistryTypeImport) {
              return [
                violation(
                  file,
                  reference,
                  "pilot scopes must not import runtime selection",
                ),
              ];
            }
          }
          if (
            resolvesToSrcArea(file, reference.importSource, "legacy") ||
            resolvesToSrcArea(file, reference.importSource, "index")
          ) {
            return [
              violation(
                file,
                reference,
                "pilot scopes must not import legacy or public action choosers",
              ),
            ];
          }
          return [];
        }),
      );

    expect(violations).toEqual([]);
  });

  it("keeps evaluation modules away from runtime action choosers", () => {
    const violations = productionFiles("evaluation").flatMap((file) =>
      importsFrom(file)
        .filter((reference) =>
          reference.importSource.startsWith("../runtime/choose-ai-action"),
        )
        .map((reference) =>
          violation(
            file,
            reference,
            "evaluation modules must not import runtime action choosers",
          ),
        ),
    );

    expect(violations).toEqual([]);
  });

  it("keeps diagnostics modules from choosing actions", () => {
    const violations = productionFiles("diagnostics").flatMap((file) => {
      const content = readFileSync(file, "utf8");
      const importViolations = importsFrom(file)
        .filter(
          (reference) =>
            reference.importSource.startsWith("../runtime/choose-ai-action") ||
            reference.importSource.startsWith("../index") ||
            reference.importSource.startsWith("../legacy"),
        )
        .map((reference) =>
          violation(file, reference, "diagnostics modules must not import selectors"),
        );
      const chooserReferences = content.match(/\bchoose(?:Runner|Corp|Ai)Action\b/g);
      if (!chooserReferences) {
        return importViolations;
      }

      return [
        ...importViolations,
        `${relativeFile(file)} references runtime action chooser symbols`,
      ];
    });

    expect(violations).toEqual([]);
  });
});

function productionFiles(area: "decision" | "evaluation" | "diagnostics"): string[] {
  const root = path.join(srcDir, area);
  return collectSourceFiles(root).filter((file) => !file.endsWith(".test.ts"));
}

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return collectSourceFiles(entryPath);
    }
    if (!entry.isFile() || !entry.name.endsWith(".ts")) {
      return [];
    }
    return [entryPath];
  });
}

function importsFrom(file: string): ImportReference[] {
  const content = readFileSync(file, "utf8");
  const references: ImportReference[] = [];
  const fromImportPattern =
    /\bimport\s+(type\s+)?[\s\S]*?\bfrom\s+["']([^"']+)["']/g;
  const sideEffectImportPattern = /\bimport\s+["']([^"']+)["']/g;

  for (const match of content.matchAll(fromImportPattern)) {
    references.push({
      importSource: match[2] ?? "",
      isTypeOnly: Boolean(match[1]),
      line: lineForIndex(content, match.index ?? 0),
    });
  }

  for (const match of content.matchAll(sideEffectImportPattern)) {
    references.push({
      importSource: match[1] ?? "",
      isTypeOnly: false,
      line: lineForIndex(content, match.index ?? 0),
    });
  }

  return references;
}

function lineForIndex(content: string, index: number): number {
  return content.slice(0, index).split(/\r?\n/).length;
}

function violation(file: string, reference: ImportReference, message: string): string {
  return `${relativeFile(file)}:${reference.line} imports ${reference.importSource}: ${message}`;
}

function relativeFile(file: string): string {
  return path.relative(srcDir, file).replaceAll(path.sep, "/");
}

function resolvesToSrcArea(
  file: string,
  importSource: string,
  area: string,
): boolean {
  if (!importSource.startsWith(".")) return false;
  const resolved = path.resolve(path.dirname(file), importSource);
  const areaRoot = path.join(srcDir, area);
  return resolved === areaRoot || resolved.startsWith(`${areaRoot}${path.sep}`);
}

function resolvedImportBasename(file: string, importSource: string): string {
  return path.basename(path.resolve(path.dirname(file), importSource));
}
