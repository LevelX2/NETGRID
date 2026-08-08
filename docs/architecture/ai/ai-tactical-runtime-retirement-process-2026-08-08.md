# AI Tactical-Runtime Retirement 2026-08-08

## Status

`LGM-6` ist abgeschlossen. Die historische Semantic-Shadow-Evaluation bleibt
als expliziter Consumer erhalten; weitere ausschließlich testseitig erreichbare
Cluster werden weiterhin nur nach einem separaten Consumer-Audit bearbeitet.
Die Umsetzung erfolgt auf dem sauberen lokalen Branch `main`,
weil für diesen nicht parallelen Bereinigungsauftrag ausdrücklich kein
Worktree vorgesehen ist.

## Quelle und Ziel

Die Plan-first-Live-Runtime ist die einzige produktive Handlungsautorität.
Historische TacticalPlan-, SemanticChoice- und alte Semantic-Runtime-Bestände
werden nicht nach ihrem Dateinamen, sondern ausschließlich nach einem
reproduzierbaren Reachability- und Consumer-Audit bereinigt.

Der Zielzustand ist ein kleinerer, eindeutiger Current State: Nicht mehr
benötigter historischer Code wird gelöscht. Noch benötigte produktive Semantik
bleibt außerhalb eines Legacy-Bereichs oder wird vorher fachlich getrennt.
Git ist die Wiederherstellungsmöglichkeit; es wird kein dauerhafter
Kompatibilitäts- oder Quarantänebestand allein zur Vorsicht angelegt.

## Nicht-Ziele

- keine Änderung von KI-Verhalten, Plan-Ownership oder LegalAction-Bindung;
- keine Fallbacks, Bridges, Proxydateien oder alten Importpfad-Aliasse;
- keine Umbenennung produktiver Shared Utilities allein wegen historischer
  Dateinamen;
- keine breiten AI-Shards oder Workspace-Gates ohne paketbezogenen Anlass.

## Invarianten

- Live, Simulation, Tooling, Test und explizite Vergleichsdiagnostik werden
  als getrennte Graphen ausgewertet.
- `legacy_compare` ist Diagnose, niemals eine produktive Fallbackautorität.
- Ein Löschpaket enthält nur einen nachgewiesen geschlossenen Teilgraphen.
- Gemischte Module werden vor einer Löschung gesplittet; produktive Verträge
  dürfen dabei weder indirekt ersetzt noch versteckt weitergeführt werden.

## Paketfolge

### LGM-0 – Reachability-Audit und Entscheidungslisten

Erstelle einen TypeScript-AST-basierten Audit für `packages/ai/src`. Erfasst
werden direkte und transitive relative Import-/Re-Export-Kanten sowie externe
Consumer aus dem Workspace. Der Audit klassifiziert mindestens
`productive_live`, `productive_simulation`, `productive_tooling`,
`productive_shared`, `diagnostic_comparison`, `legacy_test_only`,
`mixed_split_required`, `unreferenced` und `unknown`.

Das Ergebnis enthält die entscheidenden Listen `RETIRE_NOW`,
`SPLIT_BEFORE_RETIRE` und `KEEP_PRODUCTIVE`; die vollständigen Maschinendaten
bleiben als versioniertes Manifest reproduzierbar. Zusätzlich entsteht zunächst
ein report-only Boundary-Check. Keine Datei wird in diesem Paket bewegt oder
gelöscht.

**Done-Gate:** Audit-Selftest, gezielter Auditlauf,
`corepack pnpm check:ai-source-structure` und `git diff --check` sind grün.

### LGM-1 – Geschlossenen historischen Teilgraphen retiren

Nimmt ausschließlich den durch LGM-0 ausgewiesenen `RETIRE_NOW`-Teilgraphen
einschließlich seiner exklusiven Tests und Evaluationen weg. Kein
`src/legacy/`-Zielverzeichnis wird angelegt.

**Done-Gate:** betroffene fokussierte Tests, AI-Typecheck, Strukturcheck und
`git diff --check` sind grün.

**Ergebnis:** `runtime/semantic-runtime.ts` sowie zwei ausschließlich auf
diese alte Auswahlruntime zugeschnittene Cutover-Testdateien sind entfernt.
Der produktive Runner-Run-Plan-Speicher bleibt unverändert; aus seinem Test
sind nur die beiden historischen Runtime-Integrationsfälle entfernt. Die
weiterhin breit verwendete Testunterstützung enthält keine alte
`SemanticRuntimeDependencies`-Fixture mehr.

### LGM-2 – Isolierte historische Diagnosepfade retiren

Entfernt ausschließlich durch LGM-0 ausgewiesene historische
Diagnose-/Decision-Chain-Module, die keine Produktionsconsumer und nur ihre
eigenen Tests besitzen. Die gemischten Verträge bleiben ausdrücklich für das
Folgepaket unverändert.

**Done-Gate:** AI-Typecheck, Strukturcheck, Referenzscan und `git diff --check`
sind grün.

**Ergebnis:** Die alten Coverage-Selection-, Action-Alternatives-,
Decision-Chain- und Runtime-Debug-Contexts einschließlich exklusiver Tests
sind entfernt. Kein produktiver Plan-first-Debugvertrag wurde geändert.

### LGM-3 – Produktive Diagnosetypen vom Evaluator lösen

Die produktive Plan-first-Diagnostik importiert die benötigten historischen
Strukturtypen direkt aus `plans/tactical-plan-types.ts`; sie importiert nicht
mehr die alte TacticalPlan-Evaluator-Fassade. Verhalten, Debugpayload und
Plan-Ownership bleiben unverändert.

**Done-Gate:** fokussierte Diagnostik-/Authority-Tests, AI-Typecheck,
Strukturcheck und `git diff --check` sind grün.

**Ergebnis:** Die letzte produktive Type-only-Abhängigkeit von
`tactical-plans.ts` ist entfernt. Der Audit weist danach ausschließlich den
alten Choice-Ranking-Cluster als verbleibenden direkten Consumer aus.

### LGM-4 – Alten Choice-Ranking-Cluster retiren

Entfernt die historische freie Choice-Ranking- und Override-Schicht samt
exklusiven Regressionstests. Ebenfalls entfernt werden ihre unerreichbaren
Self-Damage- und Exclusion-Kontexte. Kein Produktivpfad ersetzt diese
Entscheidungsautorität; Plan-first bleibt der alleinige Live-Chooser.

**Done-Gate:** fokussierte Authority-/Invarianten-Tests, AI-Typecheck,
Strukturcheck, Referenzscan und `git diff --check` sind grün.

**Ergebnis:** Der Audit klassifiziert `tactical-plans.ts` einschließlich der
alten Runner-/Corp-Builder nun als `legacy_test_only`.

### LGM-5 – TacticalPlan-Evaluator und Restgraph retiren

Entfernt den verbleibenden alten TacticalPlan-Evaluator, seine exklusiven
Builder/Mapper/Memory-Pfade und die nur noch daraus abgeleiteten Tests. Tests,
die ausschließlich einen Reset der alten Memory verwenden, werden auf den
heutigen residenten Planportfolio-Reset umgestellt; sie behalten ihren
fachlichen produktiven Vertrag.

Prüft, ob verbleibende historische Diagnoseflächen einen aktuellen,
ausdrücklich begründeten Zweck besitzen. Andernfalls werden sie entfernt. Der
Boundary-Check wird von report-only auf fail-closed gestellt, sofern ein
Legacy-/Diagnosebereich verbleibt.

**Done-Gate:** gezielte Tests, AI-Typecheck, aktive AI-Strukturgates,
Package-Boundary-Check und `git diff --check` sind grün.

**Ergebnis:** Der historische Evaluator `tactical-plans.ts`, seine exklusiven
Runner-/Corp-Builder, Mapper und TacticalPlan-Memory sowie die ausschließlich
darauf bezogenen Tests sind entfernt. Checkpoint- und Capture-Tooling speichern
nur noch den residenten Planportfolio-Zustand. Der AI-Typecheck und der
Struktur-Gate sind grün; 22 fokussierte, weiterbestehende Vertrags-Tests sind
grün. Die separate Runner-Safety-Suite schlägt bereits beim Fixture-Aufbau an
fehlenden autoritativen Effective-Run-Quotes für bekannte ICE fehl und ist kein
Consumer des entfernten Graphen.

### LGM-6 – Isolierte Micro-/Overlay-Reste retiren

Entfernt nur den im Folgeaudit vollständig isolierten TacticalGoal-Merge sowie
die praktische Micro-/Overlay- und alte Scorebreakdown-Schicht einschließlich
ihrer ausschließlichen Tests. Ein erster Versuch, auch die Goal-Synthesen zu
entfernen, wurde anhand des Typechecks verworfen: Sie sind weiterhin fachlicher
Bestandteil der historischen Semantic-Shadow-Evaluation und bleiben daher
unverändert erhalten.

**Ergebnis:** 13 isolierte Quelldateien beziehungsweise Tests wurden entfernt.
AI-Typecheck, Struktur-Gate, Package-Boundary-Check und `git diff --check`
sind grün.

## Fehlerbehandlung und Abschluss

Ein roter Check wird im aktiven Paket auf die Ursache eingegrenzt. Bei einem
Consumer, der im Audit nicht eindeutig produktiv, diagnostisch oder historisch
einzuordnen ist, bleibt die Datei unverändert und wird als `unknown`
dokumentiert; daraus entsteht keine Ersatzlogik. Jedes abgeschlossene Paket
wird separat committed. Ein umfassender AI-Shard-Lauf bleibt einem bewussten
Integrations- oder Abschlusscheckpoint vorbehalten.
