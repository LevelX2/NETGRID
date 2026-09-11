import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const ownerDir = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(ownerDir, "../..");

describe("credit-bank owner boundary", () => {
  it("does not import the central runtime, composition or core registry", () => {
    const violations: string[] = [];
    for (const name of readdirSync(ownerDir)) {
      if (!name.endsWith(".ts") || name.endsWith(".test.ts")) continue;
      const source = ts.createSourceFile(
        name,
        readFileSync(path.join(ownerDir, name), "utf8"),
        ts.ScriptTarget.Latest,
        true,
      );
      for (const statement of source.statements) {
        if (
          !ts.isImportDeclaration(statement) &&
          !ts.isExportDeclaration(statement)
        )
          continue;
        const specifier = statement.moduleSpecifier;
        if (!specifier || !ts.isStringLiteral(specifier)) continue;
        if (
          /plan-first-live-runtime|runner-core-plan-modules|semantic-runtime-decision-context|selected-choices-for-decision|composition/.test(
            specifier.text,
          )
        ) {
          violations.push(`${name}: ${specifier.text}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("keeps bank phase decisions out of the live orchestrator", () => {
    const source = ts.createSourceFile(
      "plan-first-live-runtime.ts",
      readFileSync(
        path.join(srcDir, "runtime/plan-first-live-runtime.ts"),
        "utf8",
      ),
      ts.ScriptTarget.Latest,
      true,
    );
    const bankImplementations = source.statements
      .filter(ts.isFunctionDeclaration)
      .map((declaration) => declaration.name?.text)
      .filter(
        (name) =>
          name &&
          /^(runnerCreditBank|runnerMatureCreditBank|creditBankBuilt)/.test(
            name,
          ),
      );
    expect(bankImplementations).toEqual([]);
  });
});
