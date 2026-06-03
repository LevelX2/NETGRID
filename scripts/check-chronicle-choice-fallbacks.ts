import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import * as ts from "typescript";
import type { PublicGameEvent, Side } from "@netgrid/shared";
import { formatChronicleEvent } from "../apps/web/app/chronicle";
import {
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  type GameState,
  type LegalAction,
} from "../packages/engine/src/index";
import {
  MECHANIC_SMOKE_DECKS,
  ONR_V1_6_1_RUNNER_DECK,
  V111_CORP_DECK,
  apply,
  applyChoice,
  applyChoices,
  moveCorpCardToHq,
  moveRunnerCardToGrip,
  putCorpCardOnTopOfRd,
  putCorpIceOnServer,
  sourceDefinition,
  toRunnerTurn,
  v172CardReleaseGame,
} from "../packages/engine/src/test-fixtures/mechanic-smoke-fixtures";

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

type AuditCase = {
  id: string;
  sourceKind: "web_fixture" | "engine_scenario";
  sourceFile: string;
  line: number;
  testName: string | undefined;
  scenarioName: string | undefined;
  eventsBySide: Partial<Record<Side, PublicGameEvent>>;
};

type SkippedFixture = {
  sourceFile: string;
  line: number;
  reason: string;
};

type FallbackHit = {
  fixtureId: string;
  sourceKind: "web_fixture" | "engine_scenario";
  sourceFile: string;
  line: number;
  testName: string | undefined;
  scenarioName: string | undefined;
  viewerSide: Side;
  title: string;
  sourceDefinitionId: string | undefined;
  hiddenZoneAction: string | undefined;
  abilityId: string | undefined;
  payloadKeys: string[];
};

type RenderedChoiceCase = {
  fixtureId: string;
  sourceKind: "web_fixture" | "engine_scenario";
  sourceFile: string;
  line: number;
  testName: string | undefined;
  scenarioName: string | undefined;
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
  webFixtureCount: number;
  engineScenarioCount: number;
  engineEventCaseCount: number;
  skippedFixtureCount: number;
  checkedItemCount: number;
  fallbackCount: number;
  fallbacks: FallbackHit[];
  renderedCases: RenderedChoiceCase[];
  skippedFixtures: SkippedFixture[];
};

type EngineScenario = {
  id: string;
  name: string;
  run: () => EngineScenarioRun;
};

type EngineScenarioRun = {
  state: GameState;
  fromStateVersion: number;
};

const ENGINE_SCENARIOS: EngineScenario[] = [
  {
    id: "engine_trace_audit_of_call_records",
    name: "Engine: Audit of Call Records trace bids",
    run: engineTraceAuditOfCallRecordsScenario,
  },
  {
    id: "engine_force_shield_damage_prevention",
    name: "Engine: Force Shield damage prevention",
    run: engineForceShieldDamagePreventionScenario,
  },
  {
    id: "engine_marked_accounts_fall_guy",
    name: "Engine: Marked Accounts tag prevention with Fall Guy",
    run: engineMarkedAccountsFallGuyScenario,
  },
  {
    id: "engine_runner_discard_phase",
    name: "Engine: Runner discard phase choice",
    run: engineRunnerDiscardPhaseScenario,
  },
];

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
  const engineCases = collectEngineScenarioCases();
  const auditCases = [...fixtures.map(webFixtureToAuditCase), ...engineCases];
  const { fallbacks, renderedCases } = auditCasesForFallbacks(auditCases);
  const report: Report = {
    schemaVersion: "chronicle-choice-fallback-audit-v1",
    sourceFiles: [
      relativePath(CHRONICLE_TEST_PATH),
      "scripts/check-chronicle-choice-fallbacks.ts#engine-scenarios",
    ],
    fixtureCount: auditCases.length,
    webFixtureCount: fixtures.length,
    engineScenarioCount: ENGINE_SCENARIOS.length,
    engineEventCaseCount: engineCases.length,
    skippedFixtureCount: skippedFixtures.length,
    checkedItemCount: visibleAuditEventCount(auditCases),
    fallbackCount: fallbacks.length,
    fallbacks,
    renderedCases,
    skippedFixtures,
  };

  if (writeReport) writeJsonReport(reportPath, report);
  if (writeTemplateReport) writeMarkdownTemplateReport(templateReportPath, report);

  const status = fallbacks.length === 0 ? "OK" : "FAIL";
  console.log(
    `CHRONICLE_CHOICE_FALLBACK_AUDIT ${status} cases=${report.fixtureCount} webFixtures=${report.webFixtureCount} engineScenarios=${report.engineScenarioCount} engineEvents=${report.engineEventCaseCount} checked=${report.checkedItemCount} skipped=${report.skippedFixtureCount} fallbacks=${report.fallbackCount}`,
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

function webFixtureToAuditCase(fixture: Fixture): AuditCase {
  return {
    id: fixture.id,
    sourceKind: "web_fixture",
    sourceFile: fixture.sourceFile,
    line: fixture.line,
    testName: fixture.testName,
    scenarioName: undefined,
    eventsBySide: {
      runner: makeEvent("resolve_choice", fixture.payload, fixture.id),
      corp: makeEvent("resolve_choice", fixture.payload, fixture.id),
    },
  };
}

function collectEngineScenarioCases(): AuditCase[] {
  const cases: AuditCase[] = [];
  for (const scenario of ENGINE_SCENARIOS) {
    const result = scenario.run();
    const runnerEvents = resolveChoiceEventsById(
      result.state,
      "runner",
      result.fromStateVersion,
    );
    const corpEvents = resolveChoiceEventsById(
      result.state,
      "corp",
      result.fromStateVersion,
    );
    const ids = [...new Set([...runnerEvents.keys(), ...corpEvents.keys()])].sort();
    for (const [index, eventId] of ids.entries()) {
      const eventsBySide: Partial<Record<Side, PublicGameEvent>> = {};
      const runnerEvent = runnerEvents.get(eventId);
      const corpEvent = corpEvents.get(eventId);
      if (runnerEvent) eventsBySide.runner = runnerEvent;
      if (corpEvent) eventsBySide.corp = corpEvent;
      cases.push({
        id: `${scenario.id}:${index + 1}:${eventId}`,
        sourceKind: "engine_scenario",
        sourceFile: "scripts/check-chronicle-choice-fallbacks.ts#engine-scenarios",
        line: 0,
        testName: undefined,
        scenarioName: scenario.name,
        eventsBySide,
      });
    }
  }
  return cases;
}

function resolveChoiceEventsById(
  state: GameState,
  side: Side,
  fromStateVersion: number,
): Map<string, PublicGameEvent> {
  const events = getPlayerView(state, side).publicEvents.filter(
    (event) =>
      isResolveChoiceEvent(event) && event.stateVersionBefore >= fromStateVersion,
  );
  return new Map(events.map((event) => [event.eventId, event]));
}

function isResolveChoiceEvent(event: PublicGameEvent): boolean {
  return (
    event.type === "resolve_choice" ||
    event.publicPayload.actionType === "resolve_choice"
  );
}

function visibleAuditEventCount(cases: AuditCase[]): number {
  return cases.reduce(
    (sum, item) =>
      sum + VIEWER_SIDES.filter((side) => Boolean(item.eventsBySide[side])).length,
    0,
  );
}

function auditCasesForFallbacks(cases: AuditCase[]): {
  fallbacks: FallbackHit[];
  renderedCases: RenderedChoiceCase[];
} {
  const fallbacks: FallbackHit[] = [];
  const renderedCases: RenderedChoiceCase[] = [];
  for (const auditCase of cases) {
    const runnerEvent = auditCase.eventsBySide.runner;
    const corpEvent = auditCase.eventsBySide.corp;
    const runnerItem = runnerEvent
      ? formatChronicleEvent(runnerEvent, "runner")
      : undefined;
    const corpItem = corpEvent ? formatChronicleEvent(corpEvent, "corp") : undefined;
    const payload = runnerEvent?.publicPayload ?? corpEvent?.publicPayload ?? {};
    renderedCases.push({
      fixtureId: auditCase.id,
      sourceKind: auditCase.sourceKind,
      sourceFile: auditCase.sourceFile,
      line: auditCase.line,
      testName: auditCase.testName,
      scenarioName: auditCase.scenarioName,
      actor: sideValue(payload.actor) ?? "runner",
      sourceDefinitionId: stringValue(payload.sourceDefinitionId),
      hiddenZoneAction: stringValue(payload.hiddenZoneAction),
      abilityId: abilityIdFromPayload(payload),
      templateKey: templateKeyFromPayload(payload),
      runnerTitle: runnerItem?.title ?? "nicht sichtbar",
      corpTitle: corpItem?.title ?? "nicht sichtbar",
      runnerCategory: runnerItem?.category ?? "nicht sichtbar",
      corpCategory: corpItem?.category ?? "nicht sichtbar",
      runnerChips: runnerItem?.chips ?? [],
      corpChips: corpItem?.chips ?? [],
      payloadKeys: Object.keys(payload).sort(),
    });
    for (const viewerSide of VIEWER_SIDES) {
      const event = auditCase.eventsBySide[viewerSide];
      if (!event) continue;
      const item = formatChronicleEvent(event, viewerSide);
      const serialized = JSON.stringify(item);
      if (
        item.title.includes(GENERIC_TITLE_SNIPPET) ||
        serialized.includes(GENERIC_ENGINE_LABEL)
      ) {
        fallbacks.push({
          fixtureId: auditCase.id,
          sourceKind: auditCase.sourceKind,
          sourceFile: auditCase.sourceFile,
          line: auditCase.line,
          testName: auditCase.testName,
          scenarioName: auditCase.scenarioName,
          viewerSide,
          title: item.title,
          sourceDefinitionId: stringValue(event.publicPayload.sourceDefinitionId),
          hiddenZoneAction: stringValue(event.publicPayload.hiddenZoneAction),
          abilityId: abilityIdFromPayload(event.publicPayload),
          payloadKeys: Object.keys(event.publicPayload).sort(),
        });
      }
    }
  }
  return { fallbacks, renderedCases };
}

function engineTraceAuditOfCallRecordsScenario(): EngineScenarioRun {
  let state = toRunnerTurn(v172CardReleaseGame("chronicle-audit-engine-trace"));
  state.runner.credits = 30;
  state.corp.credits = 30;
  moveCorpCardToHq(state, "onr_v1_283_audit-of-call-records");
  putCorpIceOnServer(state, "rd", "onr_v1_232_crystal-wall");

  state = apply(
    state,
    "runner",
    (action) => action.type === "start_run" && action.payload?.serverId === "rd",
  );
  state = apply(
    state,
    "corp",
    (action) =>
      action.type === "rez_ice" &&
      sourceDefinition(state, action) === "onr_v1_232_crystal-wall",
  );
  state = apply(state, "runner", (action) => action.type === "continue_run");
  state = apply(
    state,
    "runner",
    (action) => action.type === "start_run" && action.payload?.serverId === "rd",
  );
  state = apply(state, "runner", (action) => action.type === "continue_run");
  state = apply(state, "runner", (action) => action.type === "end_turn");
  state = apply(state, "corp", (action) => action.type === "mandatory_draw");
  const fromStateVersion = state.stateVersion;
  state = apply(
    state,
    "corp",
    (action) =>
      action.type === "play_operation" &&
      sourceDefinition(state, action) === "onr_v1_283_audit-of-call-records",
  );
  state = applyChoice(state, "corp", "bid_2");
  state = applyChoice(state, "runner", "bid_0");
  return { state, fromStateVersion };
}

function engineForceShieldDamagePreventionScenario(): EngineScenarioRun {
  let state = toRunnerTurn(
    createGameAfterSetup({
      seed: "chronicle-audit-engine-force-shield",
      runnerDeck: ONR_V1_6_1_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7,
    }),
  );
  state.runner.credits = 20;
  moveRunnerCardToGrip(state, "onr_v1_028_force-shield");
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "install_card" &&
      sourceDefinition(state, action) === "onr_v1_028_force-shield",
  );
  state = apply(state, "runner", (action) => action.type === "end_turn");
  state = apply(state, "corp", (action) => action.type === "mandatory_draw");
  moveCorpCardToHq(state, "v111_core_damage_operation");
  const fromStateVersion = state.stateVersion;
  state = apply(
    state,
    "corp",
    (action) =>
      action.type === "play_operation" &&
      sourceDefinition(state, action) === "v111_core_damage_operation",
  );
  const preventionOption = state.pendingChoice?.options.find(
    (option) => option.id !== "pass",
  )?.id;
  state = applyChoice(state, "runner", preventionOption ?? "pass");
  return { state, fromStateVersion };
}

function engineMarkedAccountsFallGuyScenario(): EngineScenarioRun {
  const fallGuyId = "onr_v1_161_fall-guy";
  const markedAccountsId = "onr_proteus_005_marked-accounts";
  let state = toRunnerTurn(
    createGameAfterSetup({
      seed: "chronicle-audit-engine-marked-accounts-fall-guy",
      runnerDeck: {
        ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        id: "chronicle_audit_marked_fall_guy_runner",
        cards: [
          { id: fallGuyId, quantity: 1 },
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
        ],
      },
      corpDeck: {
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        id: "chronicle_audit_marked_fall_guy_corp",
        cards: [
          { id: markedAccountsId, quantity: 1 },
          { id: "onr_proteus_004_fetal-ai", quantity: 1 },
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
        ],
      },
      agendaPointsToWin: 7,
    }),
  );
  state.runner.credits = 8;
  state.runner.clicks = 4;
  const fallGuyCardId = moveRunnerCardToGrip(state, fallGuyId);
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "install_card" &&
      String(action.payload?.cardId) === fallGuyCardId,
  );
  putCorpCardOnTopOfRd(state, "onr_proteus_004_fetal-ai");
  putCorpCardOnTopOfRd(state, markedAccountsId);
  const fromStateVersion = state.stateVersion;
  state = runAndAccessTopCard(state, "rd");
  const fallGuyOption = state.pendingChoice?.options.find((option) =>
    option.id.includes("avoid_tag"),
  )?.id;
  state = applyChoice(state, "runner", fallGuyOption ?? "pass");
  return { state, fromStateVersion };
}

function engineRunnerDiscardPhaseScenario(): EngineScenarioRun {
  let state = toRunnerTurn(
    createGameAfterSetup({
      seed: "chronicle-audit-engine-runner-discard",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      agendaPointsToWin: 7,
    }),
  );
  state.runner.clicks = 4;
  for (let index = 0; index < 4; index += 1) {
    if (!hasLegalAction(state, "runner", (action) => action.type === "draw_card"))
      break;
    state = apply(state, "runner", (action) => action.type === "draw_card");
  }
  const fromStateVersion = state.stateVersion;
  state = apply(state, "runner", (action) => action.type === "end_turn");
  if (state.pendingChoice?.source !== "discard_phase")
    return { state, fromStateVersion };
  const selectedOptionIds = state.pendingChoice.options
    .slice(0, state.pendingChoice.minSelections)
    .map((option) => option.id);
  state = applyChoices(state, "runner", selectedOptionIds);
  return { state, fromStateVersion };
}

function runAndAccessTopCard(state: GameState, serverId: "rd" | "hq" | "archives"): GameState {
  let next = apply(
    state,
    "runner",
    (action) => action.type === "start_run" && action.payload?.serverId === serverId,
  );
  for (let step = 0; step < 12; step += 1) {
    if (hasLegalAction(next, "runner", (action) => action.type === "access_card"))
      return apply(next, "runner", (action) => action.type === "access_card");
    if (hasLegalAction(next, "runner", (action) => action.type === "continue_run")) {
      next = apply(next, "runner", (action) => action.type === "continue_run");
      continue;
    }
    if (hasLegalAction(next, "corp", (action) => action.type === "decline_rez")) {
      next = apply(next, "corp", (action) => action.type === "decline_rez");
      continue;
    }
    throw new Error(`Run erreicht keinen Access-Schritt: ${serverId}`);
  }
  throw new Error(`Run-Access-Schleife ist zu lang: ${serverId}`);
}

function hasLegalAction(
  state: GameState,
  side: Side,
  predicate: (action: LegalAction) => boolean,
): boolean {
  return getLegalActions(state, side).some(predicate);
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
    `- Audit-Cases gesamt: ${report.fixtureCount}`,
    `- Web-Fixtures: ${report.webFixtureCount}`,
    `- Engine-Szenarien: ${report.engineScenarioCount}`,
    `- Engine-Event-Cases: ${report.engineEventCaseCount}`,
    `- Gerenderte Perspektiven: ${report.checkedItemCount}`,
    `- Generische Fallbacks: ${report.fallbackCount}`,
    `- Übersprungene Fixtures: ${report.skippedFixtureCount}`,
    "",
    "## Meldungsschablonen",
    "",
    "| Nr. | Quelle | Testfall/Szenario | Zeile | Schlüssel | Runner-Meldung | Corp-Meldung |",
    "| ---: | --- | --- | ---: | --- | --- | --- |",
  ];
  for (const [index, item] of report.renderedCases.entries()) {
    lines.push(
      `| ${[
        `${index + 1}`,
        markdownCell(item.sourceKind),
        markdownCell(item.scenarioName ?? item.testName ?? item.fixtureId),
        `${item.line}`,
        markdownCell(item.templateKey),
        markdownCell(item.runnerTitle),
        markdownCell(item.corpTitle),
      ].join(" | ")} |`,
    );
  }
  lines.push("", "## Hinweise", "");
  lines.push(
    "Die Tabelle zeigt konkrete gerenderte Meldungen aus vorhandenen Web-Chronicle-Fixtures und aus gezielten Engine-Szenarien. Sie ist eine belastbare Regressionsbasis für bekannte `resolve_choice`-Payload-Formate, aber noch kein Vollscan aller Engine-Pfade.",
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

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function abilityIdFromPayload(payload: Record<string, unknown>): string | undefined {
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

function templateKeyFromPayload(payload: Record<string, unknown>): string {
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

function sideValue(value: unknown): Side | undefined {
  return value === "corp" || value === "runner" ? value : undefined;
}

function relativePath(filePath: string): string {
  return path.relative(REPO_ROOT, filePath).replaceAll("\\", "/");
}

main();
