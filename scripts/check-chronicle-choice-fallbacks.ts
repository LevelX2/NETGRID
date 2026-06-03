import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import * as ts from "typescript";
import type { PublicGameEvent, Side } from "@netgrid/shared";
import { formatChronicleEvent } from "../apps/web/app/chronicle";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHRONICLE_TEST_PATH = path.join(REPO_ROOT, "apps", "web", "app", "chronicle.test.ts");
const DEFAULT_REPORT_PATH = path.join(
  REPO_ROOT,
  "docs",
  "reviews",
  "chronicle",
  "choice-fallback-audit-report.json",
);
const DEFAULT_TEMPLATE_REPORT_PATH = path.join(
  REPO_ROOT,
  "docs",
  "reviews",
  "chronicle",
  "choice-message-template-report-2026-06-03.md",
);
const GENERIC_TITLE_SNIPPET = "Entscheidung beantwortet";
const GENERIC_ENGINE_LABEL = "Choice wurde beantwortet";
const VIEWER_SIDES: Side[] = ["runner", "corp"];

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type Fixture = {
  id: string;
  sourceFile: string;
  line: number;
  testName: string | undefined;
  payload: Record<string, JsonValue>;
};

type SkippedFixture = {
  sourceFile: string;
  line: number;
  reason: string;
};

type FallbackHit = {
  fixtureId: string;
  sourceFile: string;
  line: number;
  testName: string | undefined;
  viewerSide: Side;
  title: string;
  sourceDefinitionId: string | undefined;
  hiddenZoneAction: string | undefined;
  abilityId: string | undefined;
  payloadKeys: string[];
};

type RenderedChoiceCase = {
  fixtureId: string;
  sourceFile: string;
  line: number;
  testName: string | undefined;
  actor: Side;
  sourceDefinitionId: string | undefined;
  hiddenZoneAction: string | undefined;
  abilityId: string | undefined;
  templateKey: string;
  runnerTitle: string;
  corpTitle: string;
  runnerCategory: string;
  corpCategory: string;
  runnerChips: string[];
  corpChips: string[];
  payloadKeys: string[];
};

type Report = {
  schemaVersion: "chronicle-choice-fallback-audit-v1";
  sourceFiles: string[];
  fixtureCount: number;
  skippedFixtureCount: number;
  checkedItemCount: number;
  fallbackCount: number;
  fallbacks: FallbackHit[];
  renderedCases: RenderedChoiceCase[];
  skippedFixtures: SkippedFixture[];
};

function main(): void {
  const args = process.argv.slice(2);
  const writeReport = args.includes("--write-report");
  const writeTemplateReport = args.includes("--write-template-report");
  const reportPath = argumentValue(args, "--report") ?? DEFAULT_REPORT_PATH;
  const templateReportPath =
    argumentValue(args, "--template-report") ?? DEFAULT_TEMPLATE_REPORT_PATH;
  const { fixtures, skippedFixtures } = collectResolveChoiceFixtures(
    CHRONICLE_TEST_PATH,
  );
  const { fallbacks, renderedCases } = auditFixtures(fixtures);
  const report: Report = {
    schemaVersion: "chronicle-choice-fallback-audit-v1",
    sourceFiles: [relativePath(CHRONICLE_TEST_PATH)],
    fixtureCount: fixtures.length,
    skippedFixtureCount: skippedFixtures.length,
    checkedItemCount: fixtures.length * VIEWER_SIDES.length,
    fallbackCount: fallbacks.length,
    fallbacks,
    renderedCases,
    skippedFixtures,
  };

  if (writeReport) writeJsonReport(reportPath, report);
  if (writeTemplateReport) writeMarkdownTemplateReport(templateReportPath, report);

  const status = fallbacks.length === 0 ? "OK" : "FAIL";
  console.log(
    `CHRONICLE_CHOICE_FALLBACK_AUDIT ${status} fixtures=${report.fixtureCount} checked=${report.checkedItemCount} skipped=${report.skippedFixtureCount} fallbacks=${report.fallbackCount}`,
  );
  if (writeReport) console.log(`report=${relativePath(reportPath)}`);
  if (writeTemplateReport)
    console.log(`templateReport=${relativePath(templateReportPath)}`);

  for (const hit of fallbacks) {
    console.error(
      [
        `fallback ${hit.fixtureId}`,
        `viewer=${hit.viewerSide}`,
        `title=${JSON.stringify(hit.title)}`,
        hit.sourceDefinitionId ? `source=${hit.sourceDefinitionId}` : "",
        hit.hiddenZoneAction ? `hiddenZoneAction=${hit.hiddenZoneAction}` : "",
        hit.abilityId ? `ability=${hit.abilityId}` : "",
        `keys=${hit.payloadKeys.join(",")}`,
      ]
        .filter(Boolean)
        .join(" "),
    );
  }

  if (fallbacks.length > 0) process.exit(1);
}

function collectResolveChoiceFixtures(filePath: string): {
  fixtures: Fixture[];
  skippedFixtures: SkippedFixture[];
} {
  const sourceText = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const fixtures: Fixture[] = [];
  const skippedFixtures: SkippedFixture[] = [];

  function visit(node: ts.Node, testName?: string): void {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "it" &&
      ts.isStringLiteralLike(node.arguments[0])
    ) {
      const childTestName = node.arguments[0].text;
      ts.forEachChild(node, (child) => visit(child, childTestName));
      return;
    }
    if (ts.isCallExpression(node) && isResolveChoiceMakeEventCall(node)) {
      const line = lineNumber(sourceFile, node);
      const payloadExpression = node.arguments[1];
      if (!payloadExpression) {
        skippedFixtures.push({
          sourceFile: relativePath(filePath),
          line,
          reason: "makeEvent(resolve_choice) without payload",
        });
      } else {
        const literal = literalValue(payloadExpression);
        if (!literal.ok || !isRecord(literal.value)) {
          skippedFixtures.push({
            sourceFile: relativePath(filePath),
            line,
            reason: literal.ok
              ? "payload is not an object literal"
              : literal.reason,
          });
        } else {
          fixtures.push({
            id: `${relativePath(filePath)}:${line}`,
            sourceFile: relativePath(filePath),
            line,
            testName,
            payload: literal.value,
          });
        }
      }
    }
    ts.forEachChild(node, (child) => visit(child, testName));
  }

  visit(sourceFile);
  return { fixtures, skippedFixtures };
}

function auditFixtures(fixtures: Fixture[]): {
  fallbacks: FallbackHit[];
  renderedCases: RenderedChoiceCase[];
} {
  const fallbacks: FallbackHit[] = [];
  const renderedCases: RenderedChoiceCase[] = [];
  for (const fixture of fixtures) {
    const runnerItem = formatChronicleEvent(
      makeEvent("resolve_choice", fixture.payload, fixture.id),
      "runner",
    );
    const corpItem = formatChronicleEvent(
      makeEvent("resolve_choice", fixture.payload, fixture.id),
      "corp",
    );
    renderedCases.push({
      fixtureId: fixture.id,
      sourceFile: fixture.sourceFile,
      line: fixture.line,
      testName: fixture.testName,
      actor: sideValue(fixture.payload.actor) ?? "runner",
      sourceDefinitionId: stringValue(fixture.payload.sourceDefinitionId),
      hiddenZoneAction: stringValue(fixture.payload.hiddenZoneAction),
      abilityId: abilityIdFromPayload(fixture.payload),
      templateKey: templateKeyFromPayload(fixture.payload),
      runnerTitle: runnerItem.title,
      corpTitle: corpItem.title,
      runnerCategory: runnerItem.category,
      corpCategory: corpItem.category,
      runnerChips: runnerItem.chips,
      corpChips: corpItem.chips,
      payloadKeys: Object.keys(fixture.payload).sort(),
    });
    for (const viewerSide of VIEWER_SIDES) {
      const event = makeEvent("resolve_choice", fixture.payload, fixture.id);
      const item = formatChronicleEvent(event, viewerSide);
      const serialized = JSON.stringify(item);
      if (
        item.title.includes(GENERIC_TITLE_SNIPPET) ||
        serialized.includes(GENERIC_ENGINE_LABEL)
      ) {
        fallbacks.push({
          fixtureId: fixture.id,
          sourceFile: fixture.sourceFile,
          line: fixture.line,
          testName: fixture.testName,
          viewerSide,
          title: item.title,
          sourceDefinitionId: stringValue(fixture.payload.sourceDefinitionId),
          hiddenZoneAction: stringValue(fixture.payload.hiddenZoneAction),
          abilityId: abilityIdFromPayload(fixture.payload),
          payloadKeys: Object.keys(fixture.payload).sort(),
        });
      }
    }
  }
  return { fallbacks, renderedCases };
}

function isResolveChoiceMakeEventCall(node: ts.CallExpression): boolean {
  return (
    ts.isIdentifier(node.expression) &&
    node.expression.text === "makeEvent" &&
    ts.isStringLiteralLike(node.arguments[0]) &&
    node.arguments[0].text === "resolve_choice"
  );
}

function literalValue(
  expression: ts.Expression,
): { ok: true; value: JsonValue } | { ok: false; reason: string } {
  if (ts.isStringLiteralLike(expression)) return { ok: true, value: expression.text };
  if (ts.isNumericLiteral(expression)) return { ok: true, value: Number(expression.text) };
  if (expression.kind === ts.SyntaxKind.TrueKeyword) return { ok: true, value: true };
  if (expression.kind === ts.SyntaxKind.FalseKeyword) return { ok: true, value: false };
  if (expression.kind === ts.SyntaxKind.NullKeyword) return { ok: true, value: null };
  if (ts.isPrefixUnaryExpression(expression) && ts.isNumericLiteral(expression.operand)) {
    const value = Number(expression.operand.text);
    if (expression.operator === ts.SyntaxKind.MinusToken)
      return { ok: true, value: -value };
    if (expression.operator === ts.SyntaxKind.PlusToken)
      return { ok: true, value };
  }
  if (ts.isArrayLiteralExpression(expression)) {
    const items: JsonValue[] = [];
    for (const element of expression.elements) {
      const value = literalValue(element);
      if (!value.ok) return value;
      items.push(value.value);
    }
    return { ok: true, value: items };
  }
  if (ts.isObjectLiteralExpression(expression)) {
    const result: Record<string, JsonValue> = {};
    for (const property of expression.properties) {
      if (!ts.isPropertyAssignment(property)) {
        return { ok: false, reason: "payload contains non-property assignment" };
      }
      const key = propertyName(property.name);
      if (!key) return { ok: false, reason: "payload contains computed property" };
      const value = literalValue(property.initializer);
      if (!value.ok) return value;
      result[key] = value.value;
    }
    return { ok: true, value: result };
  }
  return { ok: false, reason: `unsupported literal: ${ts.SyntaxKind[expression.kind]}` };
}

function propertyName(name: ts.PropertyName): string | undefined {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name))
    return name.text;
  return undefined;
}

function makeEvent(
  actionType: string,
  payload: Record<string, JsonValue>,
  fixtureId: string,
): PublicGameEvent {
  const actor = sideValue(payload.actor) ?? "runner";
  const eventId =
    typeof payload.eventId === "string"
      ? payload.eventId
      : `audit_${fixtureId.replaceAll(/[^a-zA-Z0-9]+/g, "_")}`;
  const payloadWithoutEventId = { ...payload };
  delete payloadWithoutEventId.eventId;
  return {
    eventId,
    type: actionType,
    stateVersionBefore: 4,
    stateVersionAfter: 5,
    stateHashAfter: "audit",
    publicPayload: {
      actor,
      actionType,
      label: `${actor}.${actionType}`,
      ...payloadWithoutEventId,
    },
  };
}

function lineNumber(sourceFile: ts.SourceFile, node: ts.Node): number {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function writeJsonReport(reportPath: string, report: Report): void {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

function writeMarkdownTemplateReport(reportPath: string, report: Report): void {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, markdownTemplateReport(report));
}

function markdownTemplateReport(report: Report): string {
  const lines = [
    "# Chronicle Choice Message Template Report",
    "",
    "Stand: 2026-06-03",
    "",
    "## Zusammenfassung",
    "",
    `- Fixtures: ${report.fixtureCount}`,
    `- Gerenderte Perspektiven: ${report.checkedItemCount}`,
    `- Generische Fallbacks: ${report.fallbackCount}`,
    `- Übersprungene Fixtures: ${report.skippedFixtureCount}`,
    "",
    "## Meldungsschablonen",
    "",
    "| Nr. | Testfall | Zeile | Schlüssel | Runner-Meldung | Corp-Meldung |",
    "| ---: | --- | ---: | --- | --- | --- |",
  ];
  for (const [index, item] of report.renderedCases.entries()) {
    lines.push(
      `| ${[
        `${index + 1}`,
        markdownCell(item.testName ?? item.fixtureId),
        `${item.line}`,
        markdownCell(item.templateKey),
        markdownCell(item.runnerTitle),
        markdownCell(item.corpTitle),
      ].join(" | ")} |`,
    );
  }
  lines.push("", "## Hinweise", "");
  lines.push(
    "Die Tabelle zeigt konkrete gerenderte Meldungen aus den vorhandenen Web-Chronicle-Fixtures. Sie ist eine belastbare Regressionsbasis für bekannte `resolve_choice`-Payload-Formate, aber noch kein Vollscan aller Engine-Pfade.",
  );
  if (report.fallbacks.length > 0) {
    lines.push("", "## Fallback-Treffer", "");
    for (const hit of report.fallbacks) {
      lines.push(
        `- ${hit.fixtureId}, viewer=${hit.viewerSide}, title=${JSON.stringify(hit.title)}`,
      );
    }
  }
  return `${lines.join("\n")}\n`;
}

function markdownCell(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("|", "\\|").replaceAll("\n", " ");
}

function argumentValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index < 0) return undefined;
  const value = args[index + 1];
  return value && !value.startsWith("--") ? path.resolve(REPO_ROOT, value) : undefined;
}

function isRecord(value: JsonValue): value is Record<string, JsonValue> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stringValue(value: JsonValue | undefined): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function abilityIdFromPayload(payload: Record<string, JsonValue>): string | undefined {
  return (
    stringValue(payload.abilityId) ??
    stringValue(payload.cardImplementationAbility) ??
    stringValue(payload.v1919OperationAbility) ??
    stringValue(payload.v1920RunnerProgramAbility) ??
    stringValue(payload.v1921RunnerProgramAbility) ??
    stringValue(payload.v1922RunnerProgramAbility) ??
    stringValue(payload.v1922RunnerEventAbility) ??
    stringValue(payload.v1922CorpOperationAbility)
  );
}

function templateKeyFromPayload(payload: Record<string, JsonValue>): string {
  return (
    abilityIdFromPayload(payload) ??
    stringValue(payload.hiddenZoneAction) ??
    stringValue(payload.traceStep) ??
    stringValue(payload.setupStep) ??
    stringValue(payload.eventModificationKind) ??
    stringValue(payload.imminentEventType) ??
    stringValue(payload.replacementEventType) ??
    stringValue(payload.sourceDefinitionId) ??
    stringValue(payload.ambushDefinitionId) ??
    "resolve_choice"
  );
}

function sideValue(value: JsonValue | undefined): Side | undefined {
  return value === "corp" || value === "runner" ? value : undefined;
}

function relativePath(filePath: string): string {
  return path.relative(REPO_ROOT, filePath).replaceAll("\\", "/");
}

main();
