import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  extractArrayObjects,
  extractExportedConstObject,
  extractSingleExportedConstObject,
  parseSetMigrationInvocation,
  renderValue,
  sha256,
  verifyMigrationOutputs,
} from "./lib/card-spec-migration-core.mjs";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("generic CardSpec migration core", () => {
  it("dispatches isolated Testset, Classic, and Proteus adapters through the neutral CLI", () => {
    for (const [setId, mode] of [
      ["testset", "check"],
      ["classic", "dry-run"],
      ["proteus", "check"],
    ] as const)
      expect(
        execFileSync(
          process.execPath,
          ["scripts/migrate-card-specs.mjs", "--set", setId, `--${mode}`],
          { cwd: process.cwd(), encoding: "utf8" },
        ),
      ).toContain(`${setId}_card_spec_`);
  }, 30_000);

  it("selects one of multiple set descriptors and rejects invalid invocations", () => {
    const descriptors = {
      testset: { setId: "testset" },
      future: { setId: "future" },
    };
    expect(
      parseSetMigrationInvocation(
        ["node", "tool", "--set", "future", "--check"],
        descriptors,
      ),
    ).toMatchObject({
      mode: "check",
      setId: "future",
      descriptor: descriptors.future,
    });
    for (const argv of [
      ["node", "tool", "--set", "missing", "--check"],
      ["node", "tool", "--set", "testset"],
      ["node", "tool", "--set", "testset", "--check", "--write"],
    ])
      expect(() => parseSetMigrationInvocation(argv, descriptors)).toThrow();
  });

  it("renders and hashes canonical values and parses only literal arrays", () => {
    const value = { beta: [1, true], alpha: "x" };
    expect(renderValue(value)).toBe(
      '{\n  beta: [\n    1,\n    true,\n  ],\n  alpha: "x",\n}',
    );
    expect(sha256(renderValue(value))).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(
      extractArrayObjects(
        'const CARDS = [{ id: "a", amount: 2 }] as const;',
        "CARDS",
        (message: string) => {
          throw new Error(message);
        },
      ),
    ).toEqual([{ id: "a", amount: 2 }]);
    expect(() =>
      extractArrayObjects(
        "const CARDS = [makeCard()];",
        "CARDS",
        (message: string) => {
          throw new Error(message);
        },
      ),
    ).toThrow(/unsupported_legacy_expression/);
  });

  it("parses closed implementation modules with reviewed helpers and local spreads", () => {
    const source = `
      const common = { kind: "activated", costs: [{ kind: "credit", amount: 2 }] } as const;
      export const implementation: CardImplementationDefinition = {
        cardDefinitionId: "card_a",
        abilities: [{ ...common, timing: "runner_main" }],
        printedSubroutines: [endTheRunSubroutine()],
      };
    `;
    const fail = (message: string): never => {
      throw new Error(message);
    };
    expect(
      extractExportedConstObject(
        source,
        "implementation",
        {
          endTheRunSubroutine: (args: readonly unknown[]) => {
            expect(args).toEqual([]);
            return { kind: "end_the_run", text: "*End the run." };
          },
        },
        fail,
      ),
    ).toEqual({
      cardDefinitionId: "card_a",
      abilities: [
        {
          kind: "activated",
          costs: [{ kind: "credit", amount: 2 }],
          timing: "runner_main",
        },
      ],
      printedSubroutines: [{ kind: "end_the_run", text: "*End the run." }],
    });
    expect(() =>
      extractExportedConstObject(
        "export const implementation = unknownHelper();",
        "implementation",
        {},
        fail,
      ),
    ).toThrow(/unknown_legacy_helper:unknownHelper/);
    expect(
      extractSingleExportedConstObject(
        'export const implementation = { cardDefinitionId: "card_a" };',
        {},
        fail,
      ),
    ).toEqual({
      exportName: "implementation",
      value: { cardDefinitionId: "card_a" },
    });
  });

  it("detects and removes only scoped unexpected generated outputs", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "netgrid-migration-core-"));
    temporaryDirectories.push(root);
    const outputDirectory = path.join(root, "specs");
    await mkdir(outputDirectory, { recursive: true });
    await writeFile(path.join(outputDirectory, "a.card-spec.ts"), "old\n");
    await writeFile(path.join(outputDirectory, "stale.card-spec.ts"), "x\n");
    const failures: string[] = [];
    await verifyMigrationOutputs({
      mode: "check",
      root,
      outputDirectory,
      generated: new Map([["a.card-spec.ts", "new\n"]]),
      targetFor: (relativePath: string) =>
        path.join(outputDirectory, relativePath),
      driftCode: "fixture_drift",
      fail: (message: string) => failures.push(message),
    });
    expect(failures).toEqual([
      expect.stringMatching(
        /^fixture_drift:unexpected:specs\/stale\.card-spec\.ts,specs\/a\.card-spec\.ts$/,
      ),
    ]);

    failures.length = 0;
    await verifyMigrationOutputs({
      mode: "write",
      root,
      outputDirectory,
      generated: new Map([["a.card-spec.ts", "new\n"]]),
      targetFor: (relativePath: string) =>
        path.join(outputDirectory, relativePath),
      driftCode: "fixture_drift",
      fail: (message: string) => failures.push(message),
    });
    expect(failures).toEqual([]);

    await verifyMigrationOutputs({
      mode: "check",
      root,
      outputDirectory,
      generated: new Map([["a.card-spec.ts", "new\n"]]),
      targetFor: (relativePath: string) =>
        path.join(outputDirectory, relativePath),
      driftCode: "fixture_drift",
      fail: (message: string) => failures.push(message),
    });
    expect(failures).toEqual([]);
  });
});
import { execFileSync } from "node:child_process";
