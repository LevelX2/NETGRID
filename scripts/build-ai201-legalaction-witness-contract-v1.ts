import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { LegalAction } from "@netgrid/shared";
import {
  buildLegalActionWitness,
  legalActionWitnessIsRedactionSafe,
} from "../packages/ai/src/legalaction-witness";

const repoRoot = findRepoRoot(process.cwd());
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai201-legalaction-witness-contract-v1.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai201-legalaction-witness-contract-v1.md");

const samples = [
  buildLegalActionWitness({
    legalAction: action("gain_credit", {
      costs: [{ clicks: 1 }],
    }),
    stateVersion: 12,
  }),
  buildLegalActionWitness({
    legalAction: action("start_run", {
      payload: { serverId: "rd" },
      targetRequirements: [{ id: "server", kind: "server", allowedServers: ["rd"] }],
    }),
    stateVersion: 13,
  }),
  buildLegalActionWitness({
    legalAction: action("trigger_ability", {
      source: "cardInstances.corp.hidden.0",
      targetRequirements: [{ id: "target", kind: "card", visibility: "engine_only" }],
    }),
    selectedTargets: { target: "cardInstances.runner.stack.0" },
    stateVersion: 14,
  }),
];

const output = {
  schemaVersion: "ai201-legalaction-witness-contract-v1",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  aggregate: {
    samples: samples.length,
    redactionSafe: samples.every(legalActionWitnessIsRedactionSafe),
    noTargetWitnesses: samples.filter((entry) => entry.targetRef.kind === "none").length,
    serverTargetWitnesses: samples.filter((entry) => entry.targetRef.kind === "server").length,
    hiddenBlockedWitnesses: samples.filter((entry) => entry.targetRef.kind === "hidden_blocked").length,
    runtimeChanged: false,
  },
  samples,
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify(output.aggregate, null, 2));

function renderMarkdown(input: typeof output): string {
  return `# AI201 LegalAction Witness Contract v1

Datum: 2026-06-14

Branch: \`codex/ai201-ai212-witness-proof\`

## Ziel

AI201 definiert eine read-only \`LegalActionWitness\`-Struktur fuer Engine-bereitgestellte \`LegalAction\`-Eintraege. Die Witness-Schicht beschreibt vorhandene LegalActions, erzeugt keine Legalitaet und aendert keine Runtime-Entscheidung.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Sample Witnesses | ${input.aggregate.samples} |
| Redaction safe | ${input.aggregate.redactionSafe ? 1 : 0} |
| No-target Witnesses | ${input.aggregate.noTargetWitnesses} |
| Server-target Witnesses | ${input.aggregate.serverTargetWitnesses} |
| Hidden-blocked Witnesses | ${input.aggregate.hiddenBlockedWitnesses} |
| Runtime geaendert | ${input.aggregate.runtimeChanged ? 1 : 0} |

## Contract

- \`actionId\`, \`stateVersion\`, \`side\` und \`actionType\` stammen aus der vorhandenen \`LegalAction\`.
- \`sourceRef\`, \`abilityRef\`, \`targetRef\`, \`choiceRef\`, \`costProfile\` und \`timingProfile\` sind redaction-safe Projektionen.
- Hidden-Info-Marker fuehren zu \`hidden_blocked\` und Blockern, nicht zu privaten IDs.
- Basic no-target Actions erhalten \`targetRef:none\`.
- Einfache Server-Actions koennen \`targetRef:server:<serverId>\` erhalten.

## Schluss

AI201 schliesst den ersten Witness-Contract ohne Runtime-Wirkung. AI202 baut darauf einen First-Class \`TargetRef\`-Vertrag auf.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai201-legalaction-witness-contract-v1.ts\`
- \`corepack pnpm --filter @netgrid/ai exec vitest run src/legalaction-witness.test.ts\`
- \`corepack pnpm --filter @netgrid/ai run typecheck\`
- \`git diff --check\`
`;
}

function action(
  type: LegalAction["type"],
  overrides: Partial<LegalAction> = {},
): LegalAction {
  return {
    actionId: `ai201.${type}`,
    side: "runner",
    type,
    label: type,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    ...overrides,
  };
}

function findRepoRoot(start: string): string {
  let current = resolve(start);
  for (;;) {
    try {
      const packageJson = JSON.parse(readFileSync(join(current, "package.json"), "utf8")) as {
        name?: string;
      };
      if (packageJson.name === "netgrid-app") return current;
    } catch {
      // Continue walking up.
    }
    const parent = dirname(current);
    if (parent === current) throw new Error(`Could not find NETGRID repo root from ${start}`);
    current = parent;
  }
}

function git(args: string[]): string {
  return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
}
