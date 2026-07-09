import { existsSync, readdirSync, readFileSync } from "node:fs";
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
        if (
          !resolvesToSrcArea(
            file,
            reference.importSource,
            path.join("decision", "pilot"),
          )
        ) {
          return [];
        }
        if (
          allowedPilotImports.has(
            resolvedImportBasename(file, reference.importSource),
          )
        ) {
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
          violation(
            file,
            reference,
            "runtime modules must not import evaluation",
          ),
        ),
    );
    const actionViolations = productionFiles("actions").flatMap((file) =>
      importsFrom(file)
        .filter((reference) =>
          resolvesToSrcArea(file, reference.importSource, "decision"),
        )
        .map((reference) =>
          violation(
            file,
            reference,
            "actions modules must not import decision",
          ),
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
          violation(
            file,
            reference,
            "diagnostics modules must not import selectors",
          ),
        );
      const chooserReferences = content.match(
        /\bchoose(?:Runner|Corp|Ai)Action\b/g,
      );
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

  it("keeps why coverage reports out of runtime selection", () => {
    const violations = productionFiles("runtime").flatMap((file) =>
      importsFrom(file)
        .filter(
          (reference) =>
            resolvedImportBasename(file, reference.importSource) ===
            "semantic-runtime-why-coverage",
        )
        .map((reference) =>
          violation(
            file,
            reference,
            "runtime modules must not import report-only why coverage",
          ),
        ),
    );

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

  it("guards reports, evaluation and runtime import boundaries", () => {
    const reportViolations = productionFiles("reports").flatMap((file) =>
      importsFrom(file).flatMap((reference) => {
        const importsRuntimeChooser =
          resolvesToSrcArea(file, reference.importSource, "runtime") &&
          resolvedImportBasename(file, reference.importSource) ===
            "choose-ai-action";
        const importsLegacy = resolvesToSrcArea(
          file,
          reference.importSource,
          "legacy",
        );
        if (!importsRuntimeChooser && !importsLegacy) return [];
        return [
          violation(
            file,
            reference,
            "reports must not import runtime/choose-ai-action or legacy",
          ),
        ];
      }),
    );
    const evaluationViolations = productionFiles("evaluation").flatMap((file) =>
      importsFrom(file)
        .filter((reference) =>
          resolvesToSrcEntry(file, reference.importSource, "index"),
        )
        .map((reference) =>
          violation(file, reference, "evaluation must not import index.ts"),
        ),
    );
    const runtimeViolations = productionFiles("runtime").flatMap((file) =>
      importsFrom(file)
        .filter((reference) =>
          resolvesToSrcArea(file, reference.importSource, "evaluation"),
        )
        .map((reference) =>
          violation(file, reference, "runtime must not import evaluation"),
        ),
    );

    expect([
      ...reportViolations,
      ...evaluationViolations,
      ...runtimeViolations,
    ]).toEqual([]);
  });

  it("keeps access intelligence modules below runtime, evaluation and public index", () => {
    const violations = productionFiles("access").flatMap((file) =>
      importsFrom(file).flatMap((reference) => {
        if (resolvesToSrcArea(file, reference.importSource, "runtime")) {
          return [
            violation(
              file,
              reference,
              "access modules must not import runtime implementation",
            ),
          ];
        }
        if (resolvesToSrcArea(file, reference.importSource, "evaluation")) {
          return [
            violation(
              file,
              reference,
              "access modules must not import evaluation modules",
            ),
          ];
        }
        if (resolvesToSrcEntry(file, reference.importSource, "index")) {
          return [
            violation(
              file,
              reference,
              "access modules must not import public index.ts",
            ),
          ];
        }
        if (
          resolvesToSrcArea(file, reference.importSource, "decision") &&
          resolvedImportBasename(file, reference.importSource) ===
            "access-decision-projection" &&
          path.basename(file) !== "access-decision-projection.ts"
        ) {
          return [
            violation(
              file,
              reference,
              "access modules must use the access projection facade",
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

  it("does not recreate historical plan compatibility facades", () => {
    const forbiddenFacades = [
      path.join(srcDir, "runner-plans.ts"),
      path.join(srcDir, "corp-plans.ts"),
    ];

    const violations = forbiddenFacades
      .filter((file) => existsSync(file))
      .map((file) => `${relativeFile(file)} must stay removed`);

    expect(violations).toEqual([]);
  });

  it("keeps the legacy doctrine v1 builder removed", () => {
    const deckDoctrine = path.join(srcDir, "deck-doctrine.ts");
    const violations = [
      ...(existsSync(deckDoctrine)
        ? ["deck-doctrine.ts legacy v1 builder must stay removed"]
        : []),
    ];

    expect(violations).toEqual([]);
  });

  it("routes productive doctrine context through the runtime doctrine context", () => {
    const aiDecisionInput = path.join(
      srcDir,
      "runtime",
      "ai-decision-input.ts",
    );
    const content = readFileSync(aiDecisionInput, "utf8");
    const violations = [
      ...(content.includes("buildDeckStrategyProfile")
        ? ["ai-decision-input.ts builds deck strategy profile directly"]
        : []),
      ...(content.includes("buildNeutralDeckStrategyProfile")
        ? ["ai-decision-input.ts builds neutral strategy profile directly"]
        : []),
      ...(content.includes("buildDeckDoctrineV2Diagnostic")
        ? ["ai-decision-input.ts builds doctrine v2 diagnostic directly"]
        : []),
      ...(content.includes("buildDeckDoctrineProfile")
        ? ["ai-decision-input.ts builds doctrine v1 profile directly"]
        : []),
      ...(!content.includes('from "../deck-doctrine-runtime-context"')
        ? ["ai-decision-input.ts misses deck doctrine runtime context"]
        : []),
    ];

    expect(violations).toEqual([]);
  });

  it("keeps productive AI runtime free of missing-snapshot and legacy doctrine fallbacks", () => {
    const productiveFiles = [
      path.join(srcDir, "runtime", "ai-decision-input.ts"),
      path.join(srcDir, "deck-doctrine-runtime-context.ts"),
      path.join(repoRoot, "apps", "server", "src", "multiplayer.ts"),
      path.join(repoRoot, "apps", "server", "src", "index.ts"),
      path.join(repoRoot, "apps", "web", "app", "api", "game", "route.ts"),
    ];
    const forbiddenTerms = [
      "missingDeckContextMode",
      "legacy_compatible",
      "buildNeutralDeckStrategyProfile",
      "buildDeckDoctrineProfile",
      "archetypeTags",
      "planWeights",
      "mulliganWeights",
    ];
    const violations = productiveFiles.flatMap((file) => {
      const content = readFileSync(file, "utf8");
      return forbiddenTerms
        .filter((term) => content.includes(term))
        .map((term) => `${relativeFile(file)} uses forbidden productive AI runtime term ${term}`);
    });

    expect(violations).toEqual([]);
  });

  it("keeps ownDeckSnapshot validation on the productive AI decision path", () => {
    const aiDecisionInput = path.join(
      srcDir,
      "runtime",
      "ai-decision-input.ts",
    );
    const runtimeContext = path.join(srcDir, "deck-doctrine-runtime-context.ts");
    const decisionInputContent = readFileSync(aiDecisionInput, "utf8");
    const runtimeContextContent = readFileSync(runtimeContext, "utf8");
    const violations = [
      ...(!decisionInputContent.includes("ownDeckSnapshot: AiDeckStrategyDeckSnapshot")
        ? ["ai-decision-input.ts does not require ownDeckSnapshot in the runtime contract"]
        : []),
      ...(!decisionInputContent.includes("assertValidAiDeckSnapshotForRuntime")
        ? ["ai-decision-input.ts does not validate ownDeckSnapshot"]
        : []),
      ...(!runtimeContextContent.includes("deckSnapshot: AiDeckStrategyDeckSnapshot")
        ? ["deck-doctrine-runtime-context.ts does not require a deck snapshot"]
        : []),
      ...(!runtimeContextContent.includes("assertValidAiDeckSnapshotForRuntime")
        ? ["deck-doctrine-runtime-context.ts does not validate deck snapshots"]
        : []),
    ];

    expect(violations).toEqual([]);
  });

  it("keeps the public package facade re-export only", () => {
    const publicFacade = path.join(srcDir, "index.ts");
    const content = readFileSync(publicFacade, "utf8");
    const forbiddenPatterns = [
      {
        pattern: /^\s*import\s/m,
        reason: "declares local imports",
      },
      {
        pattern: /^\s*(?:const|let|var|function|class)\s/m,
        reason: "declares local implementation",
      },
      {
        pattern: /create[A-Za-z0-9]+Composition\s*\(/,
        reason: "creates runtime composition directly",
      },
    ];

    const violations = forbiddenPatterns
      .filter(({ pattern }) => pattern.test(content))
      .map(({ reason }) => `${relativeFile(publicFacade)} ${reason}`);

    expect(violations).toEqual([]);
  });

  it("keeps tactical plans as a thin plan facade", () => {
    const tacticalPlans = path.join(srcDir, "tactical-plans.ts");
    const content = readFileSync(tacticalPlans, "utf8");
    const lineCount = content.split(/\r?\n/).length;
    const forbiddenPatterns = [
      {
        pattern: /^\s*function\s/m,
        reason: "declares local helper functions",
      },
      {
        pattern:
          /from\s+["']\.\/plans\/tactical-plan-(?:runner-run-targets|runner-hand-buffer|runner-hand-development|runner-credit-base|runner-breaker-coverage-step|corp-helpers|corp-score-window|deck-coverage|bank-tools|run-reachability)["']/,
        reason: "imports split plan implementation modules directly",
      },
    ];
    const requiredImports = [
      "./plans/tactical-plan-runner-plans",
      "./plans/tactical-plan-corp-plans",
      "./plans/tactical-plan-legal-action-mapping",
      "./plans/tactical-plan-progression",
    ];
    const violations = [
      ...(lineCount > 450
        ? [`tactical-plans.ts has ${lineCount} lines; expected <= 450`]
        : []),
      ...forbiddenPatterns
        .filter(({ pattern }) => pattern.test(content))
        .map(({ reason }) => `tactical-plans.ts ${reason}`),
      ...requiredImports
        .filter((importSource) => !content.includes(`from "${importSource}"`))
        .map((importSource) => `tactical-plans.ts misses ${importSource}`),
    ];
    const planModuleCycles = [
      "tactical-plan-runner-plans.ts",
      "tactical-plan-corp-plans.ts",
      "tactical-plan-legal-action-mapping.ts",
      "tactical-plan-step-candidate-matching.ts",
    ].flatMap((fileName) => {
      const file = path.join(srcDir, "plans", fileName);
      return importsFrom(file)
        .filter((reference) =>
          resolvesToSrcEntry(file, reference.importSource, "tactical-plans"),
        )
        .map((reference) =>
          violation(
            file,
            reference,
            "plan modules must not import tactical-plans.ts",
          ),
        );
    });

    expect([...violations, ...planModuleCycles]).toEqual([]);
  });

  it("keeps the productive runtime tree zero legacy", () => {
    const checkedFiles = [
      ...productionFiles("runtime"),
      path.join(srcDir, "ai-runtime-public-entrypoints.ts"),
    ];
    const forbiddenPatterns = [
      /\blegacy\b/i,
      /from\s+["'][^"']*legacy[^"']*["']/i,
      /\bscoreActionsForLegacy\b/,
      /\bcreateLegacyActionScoringComposition\b/,
      /\bcreateLegacyDecisionContext\b/,
      /\bsemanticRuntimeForcedLegacy\b/,
      /\blegacyDecisionProvider\b/,
      /\bchooseCorpLegacyBaselineAction\b/,
      /\bchooseRunnerLegacyBaselineAction\b/,
    ];
    const violations = checkedFiles.flatMap((file) => {
      const content = readFileSync(file, "utf8");
      return forbiddenPatterns.flatMap((pattern) => {
        const match = pattern.exec(content);
        return match
          ? [
              `${relativeFile(file)} matches forbidden runtime legacy pattern ${pattern} at line ${lineForIndex(content, match.index)}`,
            ]
          : [];
      });
    });

    expect(violations).toEqual([]);
  });

  it("keeps guarded legacy symbols outside productive runtime ownership", () => {
    const allowedAreaPrefixes = ["legacy/", "simulation/", "evaluation/"];
    const guardedSymbols = [
      "scoreActionsForLegacy",
      "createLegacyActionScoringComposition",
      "createLegacyDecisionContext",
      "chooseCorpLegacyBaselineAction",
      "chooseRunnerLegacyBaselineAction",
      "semanticRuntimeForcedLegacy",
      "legacyDecisionProvider",
    ];
    const violations = collectSourceFiles(srcDir)
      .filter((file) => !file.endsWith(".test.ts"))
      .flatMap((file) => {
        const content = readFileSync(file, "utf8");
        const relative = relativeFile(file);
        if (allowedAreaPrefixes.some((prefix) => relative.startsWith(prefix))) {
          return [];
        }
        return guardedSymbols
          .filter((symbol) => content.includes(symbol))
          .map(
            (symbol) =>
              `${relative} references guarded legacy symbol ${symbol}`,
          );
      });

    expect(violations).toEqual([]);
  });

  it("keeps productive runtime access away from legacy entrypoints", () => {
    const publicEntrypoints = path.join(
      srcDir,
      "ai-runtime-public-entrypoints.ts",
    );
    const content = readFileSync(publicEntrypoints, "utf8");
    const violations = [
      ...(content.includes('from "./corp-plans"')
        ? [
            "ai-runtime-public-entrypoints.ts imports corp-plans facade directly",
          ]
        : []),
      ...(content.includes('from "./runner-plans"')
        ? [
            "ai-runtime-public-entrypoints.ts imports runner-plans facade directly",
          ]
        : []),
      ...(content.includes('from "./legacy/')
        ? ["ai-runtime-public-entrypoints.ts imports legacy modules"]
        : []),
    ];

    expect(violations).toEqual([]);
  });

  it("keeps match simulation out of the default package facade", () => {
    const publicIndex = readFileSync(path.join(srcDir, "index.ts"), "utf8");
    const packageManifest = JSON.parse(
      readFileSync(path.join(srcDir, "..", "package.json"), "utf8"),
    ) as { exports?: Record<string, string> };
    const violations = [
      ...(publicIndex.includes('from "./simulation/')
        ? ["index.ts imports or exports simulation modules"]
        : []),
      ...(publicIndex.includes("simulateAiGame") ||
      publicIndex.includes("runAiSelfplayTraceMining")
        ? ["index.ts exposes match-simulation entrypoints"]
        : []),
      ...(packageManifest.exports?.["./simulation"] === "./src/simulation.ts"
        ? []
        : ["package.json misses the explicit ./simulation export"]),
    ];

    expect(violations).toEqual([]);
  });

  it("keeps the transitive live package graph free of legacy modules", () => {
    const liveGraph = transitiveRuntimeFiles(path.join(srcDir, "index.ts"));
    const violations = [...liveGraph]
      .map(relativeFile)
      .filter(
        (file) => file === "legacy" || file.startsWith("legacy/"),
      );

    expect(violations).toEqual([]);
  });

  it("keeps the public package facade away from legacy plan contracts", () => {
    const publicIndex = path.join(srcDir, "index.ts");
    const content = readFileSync(publicIndex, "utf8");
    const violations = [
      ...(content.includes('from "./corp-plans"')
        ? ["index.ts exports corp-plans facade directly"]
        : []),
      ...(content.includes('from "./runner-plans"')
        ? ["index.ts exports runner-plans facade directly"]
        : []),
      ...(content.includes('from "./legacy/')
        ? ["index.ts exports legacy modules"]
        : []),
      ...(content.includes("chooseCorpBaselineAction") ||
      content.includes("chooseRunnerBaselineAction")
        ? ["index.ts exports baseline action selectors"]
        : []),
    ];

    expect(violations).toEqual([]);
  });

  it("keeps removed planner compatibility facades out of active areas", () => {
    const checkedAreas = ["runtime", "simulation", "diagnostics", "evaluation"];
    const violations = checkedAreas.flatMap((area) =>
      productionFiles(area as Parameters<typeof productionFiles>[0]).flatMap(
        (file) =>
          importsFrom(file)
            .filter(
              (reference) =>
                reference.importSource === "../corp-plans" ||
                reference.importSource === "../runner-plans" ||
                reference.importSource === "./corp-plans" ||
                reference.importSource === "./runner-plans",
            )
            .map((reference) =>
              violation(
                file,
                reference,
                "removed planner facades must not be recreated",
              ),
            ),
      ),
    );

    expect(violations).toEqual([]);
  });

  it("keeps semantic runtime score summation owned by score components", () => {
    const allowedFiles = new Set([
      "ai-runtime-public-entrypoints.ts",
      "runtime/semantic-runtime-choice-builder.ts",
      "runtime/semantic-runtime-score-components.ts",
    ]);
    const violations = collectSourceFiles(srcDir)
      .filter((file) => !file.endsWith(".test.ts"))
      .flatMap((file) => {
        const content = readFileSync(file, "utf8");
        if (!content.includes("semanticRuntimeScoreFromComponents")) return [];
        const relative = relativeFile(file);
        return allowedFiles.has(relative)
          ? []
          : [
              `${relative} references semanticRuntimeScoreFromComponents outside score aggregation ownership`,
            ];
      });

    expect(violations).toEqual([]);
  });

  it("keeps runner run-target evaluation owned by the run-target evaluator", () => {
    const allowedFiles = new Set([
      "ai-runtime-public-entrypoints.ts",
      "evaluation/real-engine-decision-corpus-fixtures.ts",
      "index.ts",
      "runner-run-target-evaluation.ts",
      "runtime/semantic-runtime.ts",
      "runtime/semantic-runtime-decision-composition.ts",
    ]);
    const violations = collectSourceFiles(srcDir)
      .filter((file) => !file.endsWith(".test.ts"))
      .flatMap((file) => {
        const content = readFileSync(file, "utf8");
        if (!content.includes("evaluateRunnerRunTargets")) return [];
        const relative = relativeFile(file);
        return allowedFiles.has(relative)
          ? []
          : [
              `${relative} references evaluateRunnerRunTargets outside run-target evaluation ownership`,
            ];
      });

    expect(violations).toEqual([]);
  });

  it("keeps known access payoff evaluation behind access payoff owners", () => {
    const allowedFiles = new Set([
      "ai-runtime-public-entrypoints.ts",
      "known-central-access-payoff.ts",
      "known-remote-access-payoff.ts",
      "runner-run-target-evaluation.ts",
      "plans/tactical-plan-runner-plans.ts",
    ]);
    const guardedSymbols = [
      "evaluateKnownCentralAccessPayoff",
      "evaluateKnownRemoteAccessPayoff",
    ];
    const violations = collectSourceFiles(srcDir)
      .filter((file) => !file.endsWith(".test.ts"))
      .flatMap((file) => {
        const content = readFileSync(file, "utf8");
        const referencesGuardedSymbol = guardedSymbols.some((symbol) =>
          content.includes(symbol),
        );
        if (!referencesGuardedSymbol) return [];
        const relative = relativeFile(file);
        return allowedFiles.has(relative)
          ? []
          : [
              `${relative} references known access payoff evaluation outside owner or adapter boundaries`,
            ];
      });

    expect(violations).toEqual([]);
  });

  it("keeps corp board triage and scoreline safety behind runtime owners", () => {
    const allowedFilesBySymbol = new Map<string, Set<string>>([
      [
        "semanticRuntimeCorpBoardTriage",
        new Set([
          "runtime/semantic-runtime-corp-board-triage.ts",
          "runtime/semantic-runtime-corp-score.ts",
        ]),
      ],
      [
        "semanticRuntimeCorpActionIsScoreLine",
        new Set([
          "runtime/semantic-runtime-corp-board.ts",
          "runtime/semantic-runtime-corp-board-context.ts",
          "runtime/semantic-runtime-corp-board-score-composition.ts",
          "runtime/semantic-runtime-corp-scoring-composition.ts",
        ]),
      ],
      [
        "semanticRuntimeCorpRemoteHasScoreLine",
        new Set([
          "runtime/semantic-runtime-corp-board.ts",
          "runtime/semantic-runtime-corp-board-context.ts",
          "runtime/semantic-runtime-corp-board-score-composition.ts",
          "runtime/semantic-runtime-corp-scoring-composition.ts",
        ]),
      ],
      [
        "semanticRuntimeCorpActionWouldCreateUnsafeRemoteScoreLine",
        new Set([
          "runtime/semantic-runtime-corp-risk.ts",
          "runtime/semantic-runtime-corp-risk-context.ts",
          "runtime/semantic-runtime-corp-board-score-composition.ts",
          "runtime/semantic-runtime-corp-scoring-composition.ts",
        ]),
      ],
      [
        "semanticRuntimeCorpScoreNowSafetyGate",
        new Set([
          "runtime/semantic-runtime-corp-score-safety.ts",
          "runtime/semantic-runtime-corp-score-safety-context.ts",
          "runtime/semantic-runtime-corp-scoring-evidence-composition.ts",
        ]),
      ],
    ]);
    const violations = collectSourceFiles(srcDir)
      .filter((file) => !file.endsWith(".test.ts"))
      .flatMap((file) => {
        const content = readFileSync(file, "utf8");
        const relative = relativeFile(file);
        return [...allowedFilesBySymbol.entries()].flatMap(
          ([symbol, allowedFiles]) => {
            if (!content.includes(symbol) || allowedFiles.has(relative)) {
              return [];
            }
            return [
              `${relative} references ${symbol} outside corp board triage or scoreline safety ownership`,
            ];
          },
        );
      });

    expect(violations).toEqual([]);
  });

  it("keeps target choice fit output behind target fit and diagnostics owners", () => {
    const allowedFilesBySymbol = new Map<string, Set<string>>([
      [
        "targetChoiceRecommendationForTargetFit",
        new Set([
          "decision/target-choice-shadow.ts",
          "decision/semantic-shadow-decision.ts",
          "evaluation/target-choice-shadow-coverage.ts",
          "evaluation/target-choice-shadow-readiness.ts",
        ]),
      ],
      [
        "buildTargetChoiceShadowReport",
        new Set([
          "decision/target-choice-shadow.ts",
          "decision/semantic-shadow-decision.ts",
          "diagnostics/semantic-runtime-debug.ts",
        ]),
      ],
      [
        "targetChoiceWouldSelectForAccessDecisionProjection",
        new Set(["decision/target-choice-shadow.ts"]),
      ],
    ]);
    const violations = collectSourceFiles(srcDir)
      .filter((file) => !file.endsWith(".test.ts"))
      .flatMap((file) => {
        const content = readFileSync(file, "utf8");
        const relative = relativeFile(file);
        return [...allowedFilesBySymbol.entries()].flatMap(
          ([symbol, allowedFiles]) => {
            if (!content.includes(symbol) || allowedFiles.has(relative)) {
              return [];
            }
            return [
              `${relative} references ${symbol} outside target choice fit or diagnostics ownership`,
            ];
          },
        );
      });

    expect(violations).toEqual([]);
  });

  it("keeps goal and strategic fit evaluation behind scoring owners", () => {
    const allowedFilesBySymbol = new Map<string, Set<string>>([
      [
        "scoreActionGoalFit",
        new Set([
          "decision/action-goal-fit.ts",
          "decision/semantic-shadow-decision.ts",
          "evaluation/doctrine-goal-action-fit.ts",
        ]),
      ],
      [
        "buildTacticalGoalUtilities",
        new Set([
          "decision/tactical-goal-utility.ts",
          "decision/semantic-shadow-decision.ts",
          "evaluation/decision-snapshot-suite.ts",
          "evaluation/doctrine-goal-action-fit.ts",
        ]),
      ],
      [
        "semanticRuntimeStrategicActionFitScoreComponents",
        new Set([
          "runtime/strategic-action-fit.ts",
          "runtime/semantic-runtime-score-breakdown.ts",
        ]),
      ],
      [
        "semanticRuntimeStrategicActionFitEvidence",
        new Set([
          "runtime/strategic-action-fit.ts",
          "runtime/semantic-runtime-choice-builder.ts",
        ]),
      ],
    ]);
    const violations = collectSourceFiles(srcDir)
      .filter((file) => !file.endsWith(".test.ts"))
      .flatMap((file) => {
        const content = readFileSync(file, "utf8");
        const relative = relativeFile(file);
        return [...allowedFilesBySymbol.entries()].flatMap(
          ([symbol, allowedFiles]) => {
            if (!content.includes(symbol) || allowedFiles.has(relative)) {
              return [];
            }
            return [
              `${relative} references ${symbol} outside goal or strategic fit ownership`,
            ];
          },
        );
      });

    expect(violations).toEqual([]);
  });

  it("keeps corp economy reserve and rez-floor scoring behind runtime owners", () => {
    const allowedFilesBySymbol = new Map<string, Set<string>>([
      [
        "semanticRuntimeCorpRemoteRezFloorAssessment",
        new Set([
          "runtime/semantic-runtime-corp-rez-floor.ts",
          "runtime/semantic-runtime-corp-rez-floor-context.ts",
          "runtime/semantic-runtime-corp-funding-contestability-composition.ts",
          "runtime/semantic-runtime-corp-board-score-composition.ts",
          "runtime/semantic-runtime-corp-scoring-composition.ts",
        ]),
      ],
      [
        "semanticRuntimeCorpHasRemoteRezFloorFundingNeed",
        new Set([
          "runtime/semantic-runtime-corp-rez-floor.ts",
          "runtime/semantic-runtime-corp-rez-floor-context.ts",
          "runtime/semantic-runtime-corp-funding-contestability-composition.ts",
          "runtime/semantic-runtime-corp-board-score-composition.ts",
          "runtime/semantic-runtime-corp-scoring-composition.ts",
        ]),
      ],
      [
        "semanticRuntimeCorpCentralRezReserveAssessment",
        new Set([
          "runtime/semantic-runtime-corp-central-rez-context.ts",
          "runtime/semantic-runtime-corp-funding-contestability-composition.ts",
          "runtime/semantic-runtime-corp-board-score-composition.ts",
          "runtime/semantic-runtime-corp-scoring-composition.ts",
        ]),
      ],
      [
        "semanticRuntimeCorpHasCentralRezFloorFundingNeed",
        new Set([
          "runtime/semantic-runtime-corp-central-rez-context.ts",
          "runtime/semantic-runtime-corp-funding-contestability-composition.ts",
          "runtime/semantic-runtime-corp-board-score-composition.ts",
          "runtime/semantic-runtime-corp-scoring-composition.ts",
        ]),
      ],
      [
        "semanticRuntimeCorpPassiveScoreLinePenalty",
        new Set([
          "runtime/semantic-runtime-corp-passive-scoreline.ts",
          "runtime/semantic-runtime-corp-passive-scoreline-context.ts",
          "runtime/semantic-runtime-corp-scoring-evidence-composition.ts",
        ]),
      ],
    ]);
    const violations = collectSourceFiles(srcDir)
      .filter((file) => !file.endsWith(".test.ts"))
      .flatMap((file) => {
        const content = readFileSync(file, "utf8");
        const relative = relativeFile(file);
        return [...allowedFilesBySymbol.entries()].flatMap(
          ([symbol, allowedFiles]) => {
            if (!content.includes(symbol) || allowedFiles.has(relative)) {
              return [];
            }
            return [
              `${relative} references ${symbol} outside corp economy reserve or rez-floor ownership`,
            ];
          },
        );
      });

    expect(violations).toEqual([]);
  });

  it("keeps plan continuity and plan-memory exclusions behind their owners", () => {
    const allowedFilesBySymbol = new Map<string, Set<string>>([
      [
        "progressTacticalPlans",
        new Set(["plans/tactical-plan-progression.ts", "tactical-plans.ts"]),
      ],
      [
        "rankTacticalPlans",
        new Set(["plans/tactical-plan-progression.ts", "tactical-plans.ts"]),
      ],
      [
        "planCanMapToCurrentAction",
        new Set(["plans/tactical-plan-progression.ts", "tactical-plans.ts"]),
      ],
      [
        "createSemanticRuntimePlanMemoryExclusionContext",
        new Set([
          "runtime/semantic-runtime-plan-memory-exclusion.ts",
          "runtime/runner-economy-commitment-composition.ts",
        ]),
      ],
      [
        "semanticRuntimePlanMemoryActionExclusion",
        new Set([
          "runtime/semantic-runtime-plan-memory-exclusion.ts",
          "runtime/runner-economy-commitment-composition.ts",
          "runtime/runner-development-support-composition.ts",
          "runtime/ai-live-runtime-composition.ts",
          "simulation/ai-runtime-simulation-composition.ts",
        ]),
      ],
    ]);
    const violations = collectSourceFiles(srcDir)
      .filter((file) => !file.endsWith(".test.ts"))
      .flatMap((file) => {
        const content = readFileSync(file, "utf8");
        const relative = relativeFile(file);
        return [...allowedFilesBySymbol.entries()].flatMap(
          ([symbol, allowedFiles]) => {
            if (!content.includes(symbol) || allowedFiles.has(relative)) {
              return [];
            }
            return [
              `${relative} references ${symbol} outside plan continuity or plan-memory ownership`,
            ];
          },
        );
      });

    expect(violations).toEqual([]);
  });

  it("routes runtime, simulation and diagnostics legacy imports through the legacy entrypoint", () => {
    const checkedAreas = ["runtime", "simulation", "diagnostics", "evaluation"];
    const violations = checkedAreas.flatMap((area) =>
      productionFiles(area as Parameters<typeof productionFiles>[0]).flatMap(
        (file) =>
          importsFrom(file)
            .filter(
              (reference) =>
                resolvesToSrcArea(file, reference.importSource, "legacy") &&
                resolvedImportBasename(file, reference.importSource) !==
                  "legacy-entrypoints",
            )
            .map((reference) =>
              violation(
                file,
                reference,
                "runtime/simulation/diagnostics/evaluation must use legacy-entrypoints",
              ),
            ),
      ),
    );

    expect(violations).toEqual([]);
  });

  it("keeps productive semantic runtime off legacy imports except explicit compatibility facades", () => {
    const allowedRuntimeLegacyEntrypointImporters = new Set([
      "runtime/ai-action-entrypoints.ts",
      "runtime/ai-action-entrypoints-composition.ts",
      "runtime/runner-baseline-support-composition.ts",
      "runtime/semantic-runtime-action-exclusion-composition.ts",
    ]);
    const violations = productionFiles("runtime").flatMap((file) =>
      importsFrom(file).flatMap((reference) => {
        if (!resolvesToSrcArea(file, reference.importSource, "legacy")) {
          return [];
        }
        const relative = relativeFile(file);
        if (
          allowedRuntimeLegacyEntrypointImporters.has(relative) &&
          resolvedImportBasename(file, reference.importSource) ===
            "legacy-entrypoints"
        ) {
          return [];
        }
        return [
          violation(
            file,
            reference,
            "productive semantic runtime must not import legacy outside explicit compatibility facades",
          ),
        ];
      }),
    );

    expect(violations).toEqual([]);
  });
});

function productionFiles(
  area:
    | "access"
    | "actions"
    | "decision"
    | "diagnostics"
    | "evaluation"
    | "reports"
    | "runtime"
    | "simulation",
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

function collectTextFiles(
  directory: string,
  extensions: readonly string[],
): string[] {
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

function violation(
  file: string,
  reference: ImportReference,
  message: string,
): string {
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

function resolvesToSrcEntry(
  file: string,
  importSource: string,
  entryBaseName: string,
): boolean {
  if (!importSource.startsWith(".")) return false;
  const resolved = path.resolve(path.dirname(file), importSource);
  return (
    resolved === path.join(srcDir, entryBaseName) ||
    resolved === path.join(srcDir, `${entryBaseName}.ts`)
  );
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

function transitiveRuntimeFiles(entrypoint: string): Set<string> {
  const visited = new Set<string>();
  const pending = [entrypoint];
  while (pending.length > 0) {
    const file = pending.pop();
    if (!file || visited.has(file)) continue;
    visited.add(file);
    for (const reference of importsFrom(file)) {
      if (reference.isTypeOnly) continue;
      const importedFile = resolveSourceImport(file, reference.importSource);
      if (importedFile && !visited.has(importedFile)) pending.push(importedFile);
    }
  }
  return visited;
}

function resolveSourceImport(
  file: string,
  importSource: string,
): string | undefined {
  if (!importSource.startsWith(".")) return undefined;
  const base = path.resolve(path.dirname(file), importSource);
  const candidates = [base, `${base}.ts`, path.join(base, "index.ts")];
  return candidates.find(
    (candidate) =>
      candidate.startsWith(`${srcDir}${path.sep}`) && existsSync(candidate),
  );
}
