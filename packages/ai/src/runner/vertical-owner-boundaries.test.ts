import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const runnerDir = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(runnerDir, "..");

describe.each([
  "credit-bank",
  "recurring-economy",
  "resource-lifecycle",
  "shell-traders",
  "expose-information",
  "terminal-win",
  "installed-agenda",
])("%s owner boundary", (owner) => {
  const ownerDir = path.join(runnerDir, owner);
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
          /plan-first-live-runtime|runner-core-plan-modules|runner-tactical-plan-modules|semantic-runtime-decision-context|selected-choices-for-decision|composition/.test(
            specifier.text,
          )
        ) {
          violations.push(`${name}: ${specifier.text}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});

describe("vertical Runner owners", () => {
  it("keeps extracted phase decisions out of the live orchestrator", () => {
    const source = ts.createSourceFile(
      "plan-first-live-runtime.ts",
      readFileSync(
        path.join(srcDir, "runtime/plan-first-live-runtime.ts"),
        "utf8",
      ),
      ts.ScriptTarget.Latest,
      true,
    );
    const ownerImplementations = source.statements
      .filter(ts.isFunctionDeclaration)
      .map((declaration) => declaration.name?.text)
      .filter(
        (name) =>
          name &&
          /^(runnerCreditBank|runnerMatureCreditBank|creditBankBuilt|runnerRecurringEconomy|recurringEconomy|runnerInstalledCompatibleRestrictedCredit|runnerResourceLifecycle|runnerCandidateIsLeavePlayPaymentLifecycle|runnerLifecycleLeavePlayPayment|runnerShellTraders|buildRunnerShellTraders|runnerExposeInformation|runnerProactiveExposeInformation|runnerCurrentExposeInformation|bindSelectedRunnerExposeInformation|runnerTerminalWin|runnerImmediateAgendaPointTerminalWin|runnerInstalledAgendaScore)/.test(
            name,
          ),
      );
    expect(ownerImplementations).toEqual([]);
  });
});
