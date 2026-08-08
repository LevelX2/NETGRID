# AI Tactical-Runtime Retirement 2026-08-08

## Status

`LGM-1` abgeschlossen. `LGM-2` ist als nächstes Paket vorgesehen. Die Umsetzung erfolgt auf dem sauberen lokalen Branch `main`,
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

### LGM-2 – Gemischte Verträge fachlich trennen

Bearbeitet ausschließlich durch LGM-0 ausgewiesene Shared-Module. Die
produktive Utility erhält einen fachlich aktuellen Owner; der ausschließlich
historische Rest folgt LGM-1 oder wird entfernt.

**Done-Gate:** fokussierte Produktiv- und Altvertrags-Tests, AI-Typecheck,
Strukturcheck und `git diff --check` sind grün.

### LGM-3 – Restgraph und Boundary finalisieren

Prüft, ob verbleibende historische Diagnoseflächen einen aktuellen,
ausdrücklich begründeten Zweck besitzen. Andernfalls werden sie entfernt. Der
Boundary-Check wird von report-only auf fail-closed gestellt, sofern ein
Legacy-/Diagnosebereich verbleibt.

**Done-Gate:** gezielte Tests, AI-Typecheck, aktive AI-Strukturgates,
Package-Boundary-Check und `git diff --check` sind grün.

## Fehlerbehandlung und Abschluss

Ein roter Check wird im aktiven Paket auf die Ursache eingegrenzt. Bei einem
Consumer, der im Audit nicht eindeutig produktiv, diagnostisch oder historisch
einzuordnen ist, bleibt die Datei unverändert und wird als `unknown`
dokumentiert; daraus entsteht keine Ersatzlogik. Jedes abgeschlossene Paket
wird separat committed. Ein umfassender AI-Shard-Lauf bleibt einem bewussten
Integrations- oder Abschlusscheckpoint vorbehalten.
