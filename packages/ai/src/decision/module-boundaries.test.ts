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
const repoRoot = path.resolve(srcDir, "..", "..", "..");

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
      importsFrom(file).flatMap((reference) => {
        if (!isRuntimeChooserImport(file, reference)) return [];
        return [
          violation(
            file,
            reference,
            "evaluation modules must not import runtime action choosers",
          ),
        ];
      }),
    );

    expect(violations).toEqual([]);
  });

  it("keeps evaluation modules away from pilot runtime selection internals", () => {
    const allowedPilotImports = new Set([
      "pilot-scope-registry",
      "remote-contest-candidate",
    ]);
    const violations = productionFiles("evaluation").flatMap((file) =>
      importsFrom(file).flatMap((reference) => {
        if (!resolvesToSrcArea(file, reference.importSource, path.join("decision", "pilot"))) {
          return [];
        }
        if (allowedPilotImports.has(resolvedImportBasename(file, reference.importSource))) {
          return [];
        }
        return [
          violation(
            file,
            reference,
            "evaluation modules may import only pilot registry types or report helpers",
          ),
        ];
      }),
    );

    expect(violations).toEqual([]);
  });

  it("keeps runtime and action semantics below higher-level analysis layers", () => {
    const runtimeViolations = productionFiles("runtime").flatMap((file) =>
      importsFrom(file)
        .filter((reference) =>
          resolvesToSrcArea(file, reference.importSource, "evaluation"),
        )
        .map((reference) =>
          violation(file, reference, "runtime modules must not import evaluation"),
        ),
    );
    const actionViolations = productionFiles("actions").flatMap((file) =>
      importsFrom(file)
        .filter((reference) =>
          resolvesToSrcArea(file, reference.importSource, "decision"),
        )
        .map((reference) =>
          violation(file, reference, "actions modules must not import decision"),
        ),
    );

    expect([...runtimeViolations, ...actionViolations]).toEqual([]);
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

  it("keeps reports modules away from action choosers", () => {
    const violations = productionFiles("reports").flatMap((file) =>
      importsFrom(file).flatMap((reference) => {
        if (
          isRuntimeChooserImport(file, reference) ||
          reference.importSource.startsWith("../index") ||
          reference.importSource.startsWith("../legacy")
        ) {
          return [
            violation(
              file,
              reference,
              "reports modules must not import action choosers",
            ),
          ];
        }
        return [];
      }),
    );

    expect(violations).toEqual([]);
  });

  it("keeps diagnostics modules from mutating selected choice payloads", () => {
    const violations = productionFiles("diagnostics").flatMap((file) => {
      const content = readFileSync(file, "utf8");
      const selectionMutationReferences = content.matchAll(
        /\bselected(?:Choices|Targets)\s*[:=]/g,
      );
      return [...selectionMutationReferences].map((match) => {
        const line = lineForIndex(content, match.index ?? 0);
        return `${relativeFile(file)}:${line} writes selected choice or target payloads`;
      });
    });

    expect(violations).toEqual([]);
  });

  it("keeps AI worklists and review docs from adding runtime imports", () => {
    const docsRoot = path.join(repoRoot, "docs");
    const docFiles = collectTextFiles(docsRoot, [".md"]).filter((file) =>
      relativeRepoFile(file).startsWith("docs/reviews/ai/"),
    );
    const violations = docFiles.flatMap((file) => {
      const content = readFileSync(file, "utf8");
      const runtimeImportReferences = content.matchAll(
        /^\s*(?:import|export)\s+[\s\S]*?\sfrom\s+["'][^"']*runtime[^"']*["']/gm,
      );
      return [...runtimeImportReferences].map((match) => {
        const line = lineForIndex(content, match.index ?? 0);
        return `${relativeRepoFile(file)}:${line} declares a runtime import`;
      });
    });

    expect(violations).toEqual([]);
  });
});

function productionFiles(
  area:
    | "actions"
    | "decision"
    | "diagnostics"
    | "evaluation"
    | "reports"
    | "runtime",
): string[] {
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

function collectTextFiles(directory: string, extensions: readonly string[]): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return collectTextFiles(entryPath, extensions);
    }
    if (!entry.isFile() || !extensions.includes(path.extname(entry.name))) {
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
  const fromExportPattern =
    /\bexport\s+(type\s+)?(?:\{[\s\S]*?\}|\*)\s+from\s+["']([^"']+)["']/g;
  const sideEffectImportPattern = /\bimport\s+["']([^"']+)["']/g;
  const dynamicImportPattern = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;

  for (const match of content.matchAll(fromImportPattern)) {
    references.push({
      importSource: match[2] ?? "",
      isTypeOnly: Boolean(match[1]),
      line: lineForIndex(content, match.index ?? 0),
    });
  }

  for (const match of content.matchAll(fromExportPattern)) {
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

  for (const match of content.matchAll(dynamicImportPattern)) {
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

function relativeRepoFile(file: string): string {
  return path.relative(repoRoot, file).replaceAll(path.sep, "/");
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

function isRuntimeChooserImport(
  file: string,
  reference: ImportReference,
): boolean {
  if (!resolvesToSrcArea(file, reference.importSource, "runtime")) return false;
  const basename = resolvedImportBasename(file, reference.importSource);
  return (
    basename === "choose-ai-action" ||
    basename === "semantic-runtime" ||
    basename === "semantic-runtime-score-components"
  );
}
