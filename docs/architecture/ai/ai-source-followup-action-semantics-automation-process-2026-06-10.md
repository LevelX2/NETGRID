# AI Source Follow-up Action Semantics Automation Process 2026-06-10

## Status

`ai_doc_1_complete`

Arbeitsbranch: `codex/ai-source-followup-action-semantics`

Arbeits-Worktree: `C:\Projekte\NETGRID_AI_SOURCE_FOLLOWUP_ACTION_SEMANTICS`

Hauptworkspace: `C:\Projekte\NETGRID`

## Quelle/Vorgabe

Quelle ist die Nutzer-Vorgabe `AI Source Follow-up - Strukturabschluss und Action-Semantik-Fundament` aus dem Codex-Anhang vom 2026-06-10. Der Prozess folgt dem Skill `paketprozess-worktree-goal`: eigener Worktree, sequenzielle Pakete, fokussierte Checks, thematische Commits je Paket, finaler lokaler Merge nach `main`, kein Push.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise.

Bestimmbar sind:

- Gesamtziel: Nach STRUCT-7 verbleibende Struktur- und Semantikrisiken in `@netgrid/ai` beseitigen.
- Reihenfolge: AI-FUP-0, AI-STRUCT-8, AI-STRUCT-9, AI-SEM-1, AI-SEM-2, AI-DOC-1, FINAL-GREEN.
- Scope: primär `packages/ai/src/**`, AI-Reports und AI-Architektur-/Review-Dokumente.
- Nicht-Ziele: kein DeckDoctrine-v2-Cutover, kein neuer KI-Spieler, kein Shadow Mode, keine produktiven Strategiegewichte.
- Akzeptanz: paketbezogene Vitest-Läufe, `@netgrid/ai`-Typecheck, `git diff --check`, am Ende vollständiger `@netgrid/ai`-Testlauf.
- Branch-/Worktree-Erwartung: `codex/ai-source-followup-action-semantics` in `C:\Projekte\NETGRID_AI_SOURCE_FOLLOWUP_ACTION_SEMANTICS`, final lokal nach `main`.

## Gesamtziel

`packages/ai/src/index.ts` wird weiter zur öffentlichen Fassade reduziert, klare Testblöcke werden aus `index.test.ts` in fokussierte Tests überführt, Action-Card-Semantik wird eindeutig per Definition-ID gejoint und die Action-Semantik-Projektion wird durch Coverage-Tests messbar. Der Abschluss darf nur mit grünem vollständigem `@netgrid/ai`-Testlauf erfolgen.

## Annahmen

- Der Hauptworkspace ist zu Prozessbeginn sauber und steht auf `main`.
- Die vorangegangene AI-Testbereinigung ist bereits in `main` integriert.
- Öffentliche Exporte bleiben kompatibel oder werden über Re-Exports erhalten.
- Wenn einzelne optionale Quelldokumente fehlen, wird der Mangel dokumentiert und die vorhandene Reorg-/Roadmap-Spur genutzt.
- Testverschiebungen aus `index.test.ts` erfolgen nur bei gleichwertiger grüner Ersatzabdeckung.

## Nicht-Ziele

- Keine Änderung an `packages/engine/**`.
- Keine Änderung an LegalAction-Erzeugung, `applyAction`, Replay, StateHash, Randomness oder Server-Revalidierung.
- Keine Hidden-Info-Ausweitung in PlayerViews, AI-Inputs, Debug, Logs oder Reports.
- Keine Legacy-Löschung und keine Entfernung von `NETGRID_SEMANTIC_AI_RUNTIME=legacy`.
- Keine produktive KI-Gewichts- oder Cutover-Änderung.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Kein Paket wird übersprungen.
- Ein Paket wird erst abgeschlossen, wenn sein Done-Gate erfüllt ist.
- Finale AI-Actions stammen weiter aus `input.legalActions`.
- Die KI erzeugt keine Legalität.
- Debug- und Diagnoseausgaben bleiben redigiert.
- No-Candidate-Fallback und Force-Legacy bleiben erhalten.

## Automatische Fehlerbehandlung

- Rote Tests werden eng gelesen, ursächlich eingegrenzt und im aktiven Paket behoben.
- Kein `test.skip`, `test.only`, pauschales Löschen von Tests oder breites Lockern von Assertions.
- Keine Hidden-Info-Allowlist-Erweiterung ohne konkreten, side-safe Vertrag.
- Konflikte mit weitergelaufenem `main` werden defensiv gelöst; beide Intentionen bleiben erhalten, wenn fachlich kompatibel.
- Kein `git reset --hard` und kein pauschales Revert fremder Änderungen.

## Sicherheitsblocker

Sofort stoppen und Blocker-Report schreiben, wenn:

- eine Änderung neue LegalAction-Erzeugung oder Engine-Vertragsänderung verlangt;
- Hidden-Info-Grenzen breiter werden müssten;
- Legacy- oder No-Candidate-Fallback nicht erhalten werden kann;
- finale AI-Auswahl nicht mehr auf aktuelle `input.legalActions` rückführbar ist;
- öffentliche `@netgrid/ai`-Exportkompatibilität nicht mit vertretbarem Aufwand erhalten werden kann.

Removal Condition: Der Blocker ist entfernt, wenn der betroffene Vertrag ohne Scope-Erweiterung erhalten und mit fokussierten Checks belegt ist.

## State Machine

```text
process_prepared
  -> ai_fup_0_preflight
  -> ai_struct_8_index_facade
  -> ai_struct_9_index_test_split
  -> ai_sem_1_card_semantic_join_identity
  -> ai_sem_2_action_semantic_coverage
  -> ai_doc_1_reports
  -> final_green
  -> merge_to_main
  -> complete
```

## Paketfolge

1. AI-FUP-0: Grünen Ausgangsstand bestätigen.
2. AI-STRUCT-8: `index.ts` weiter zur Fassade machen.
3. AI-STRUCT-9: `index.test.ts` kontrolliert in fokussierte Tests zerlegen.
4. AI-SEM-1: ActionCardSemanticJoin-ID-Semantik klären.
5. AI-SEM-2: Action-Semantik-Coverage-Tests und optional Coverage-Report.
6. AI-DOC-1: Reports und Reorg-Status nachziehen.
7. FINAL-GREEN: vollständige Checks ausführen und rote Tests beheben.

## Paketdetails

### AI-FUP-0: Preflight

Ziel: Grünen Ausgangsstand im Arbeits-Worktree bestätigen.

Arbeit:

- `git status --short`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`
- `git log --oneline -20`

Kernartefakte: dieses Prozessdokument und optional `docs/reviews/ai/ai-source-followup-action-semantics-preflight-2026-06-10.md`.

Done-Gate: `@netgrid/ai test`, `@netgrid/ai typecheck` und `git diff --check` sind grün.

Commit: `docs(ai): document action semantics follow-up preflight`

### AI-STRUCT-8: `index.ts`-Fassade

Ziel: Produktive Implementierungslogik weiter aus `packages/ai/src/index.ts` herausziehen.

Kernartefakte:

- `packages/ai/src/index.ts`
- `packages/ai/src/runtime/semantic-runtime-types.ts`
- `packages/ai/src/runtime/semantic-choice-ranking.ts`
- `packages/ai/src/diagnostics/decision-debug.ts`
- `packages/ai/src/legacy/legacy-baseline.ts`
- `packages/ai/src/simulation/**`

Checks:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/benchmark-reports.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Done-Gate: Public Exports, Runtime-Modi, Legacy-Mode, No-Candidate-Fallback und Debug-Redaction bleiben kompatibel.

Commit: `refactor(ai): finish index facade extraction`

### AI-STRUCT-9: `index.test.ts` zerlegen

Ziel: Klare Testblöcke aus `index.test.ts` in fokussierte Tests verschieben, ohne Sicherheitsnetz zu verlieren.

Kernartefakte:

- `packages/ai/src/index.test.ts`
- `packages/ai/src/runtime/*.test.ts`
- `packages/ai/src/actions/*.test.ts`
- `packages/ai/src/legacy/*.test.ts`
- `packages/ai/src/simulation/*.test.ts`
- `packages/ai/src/diagnostics/*.test.ts`

Checks mindestens:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-runtime.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/diagnostics/decision-debug.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/legacy/legacy-baseline.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Done-Gate: Keine Tests ohne Ersatz gelöscht, keine Assertions pauschal gelockert, neue fokussierte Tests grün.

Commit: `test(ai): split focused tests from index suite`

### AI-SEM-1: ActionCardSemanticJoin-ID-Semantik

Ziel: Instanz-ID und Definition-ID bei Action-Semantik eindeutig trennen und CardSemanticProfiles per Definition-ID side-safe joinen.

Kernartefakte:

- `packages/ai/src/action-semantic-candidate.ts`
- `packages/ai/src/actions/action-card-semantic-join.ts`
- `packages/ai/src/actions/action-source-binding.ts`
- `packages/ai/src/actions/action-target-context.ts`
- `packages/ai/src/actions/action-card-semantic-join.test.ts`
- `packages/ai/src/action-semantic-candidate.test.ts`

Checks:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/actions/action-card-semantic-join.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/action-semantic-candidate.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Done-Gate: Keine Hidden-Info-Auflösung für verdeckte Gegnerkarten, BasicActions ohne CardJoin, Multi-Ability-Fälle bleiben bei fehlender Ability-ID unresolved.

Commit: `fix(ai): resolve action card semantics by definition id`

### AI-SEM-2: Action-Semantik-Coverage

Ziel: LegalAction-Typen mindestens neutral projizierbar machen und zentrale BasicActions semantisch absichern.

Kernartefakte:

- `packages/ai/src/action-semantic-candidate.ts`
- `packages/ai/src/actions/basic-action-semantics.ts`
- `packages/ai/src/actions/action-source-binding.ts`
- `packages/ai/src/actions/action-target-context.ts`
- `packages/ai/src/actions/action-cost-timing.ts`
- `packages/ai/src/actions/action-card-semantic-join.ts`
- `packages/ai/src/actions/action-semantic-coverage.test.ts`

Checks:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/actions/action-semantic-coverage.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/action-semantic-candidate.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Done-Gate: Coverage-Matrix prüft Candidate-Erzeugung, LegalActionRef, HardGate, Visibility, Timing, Cost, ProjectionStatus und Evidence ohne Runtime-Scoring-Änderung.

Commit: `test(ai): cover action semantic projection contracts`

### AI-DOC-1: Reports

Ziel: Reorg-Status und Follow-up-Abschluss dokumentieren.

Kernartefakte:

- `docs/reviews/ai/ai-source-structure-reorg-final-report-2026-06-10.md`
- `docs/reviews/ai/ai-source-followup-action-semantics-final-report-2026-06-10.md`
- optional dieses Prozessdokument, falls Status nachgezogen werden muss.

Checks:

```bash
git diff --check
```

Done-Gate: Reorg-Final-Report ist auf lokal integrierten Stand korrigiert; Follow-up-Final-Report nennt Umsetzung, Nicht-Änderungen, Verifikation und Folgearbeit.

Commit: `docs(ai): document action semantics follow-up`

### FINAL-GREEN

Ziel: Kein Abschluss mit roten Tests.

Pflichtchecks:

```bash
corepack pnpm --filter @netgrid/ai test
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Wenn rote Tests auftreten: Fehler lesen, eng beheben, Einzeltest erneut ausführen, Paket-/Dateitest erneut ausführen, danach vollständigen `@netgrid/ai`-Testlauf erneut ausführen.

Commit: nur falls FINAL-GREEN Fixes oder Reportänderungen erzeugt.

## Verifikationsregeln

- Nach jedem Paket paketbezogene Tests und `git diff --check`.
- Nach Codeänderungen immer `corepack pnpm --filter @netgrid/ai typecheck`.
- Am Ende vollständiger `corepack pnpm --filter @netgrid/ai test`.
- Wenn außerhalb `packages/ai` Codepakete betroffen sind, zusätzlich betroffene Paketchecks ausführen.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Arbeits-Worktree.
- Hauptworkspace nur für finalen lokalen Merge.
- Jeder Paketabschluss erhält einen thematischen Commit.
- Kein Push und kein Pull Request.
- Vor finalem Merge Arbeitsbranch sauber und grün.
- Fast-Forward-Merge nach `main` bevorzugt; wenn nicht möglich, Ursache prüfen und nicht blind Merge-Commit erzeugen.
- Nach Merge im Hauptworkspace `@netgrid/ai test`, `@netgrid/ai typecheck`, `git diff --check` und `git status --short` ausführen.
- Arbeits-Worktree erst nach erfolgreichem Merge entfernen.

## Paketprotokoll

### AI-FUP-0 abgeschlossen

Commit: `21deb542 docs(ai): document action semantics follow-up preflight`

Verifikation:

- `corepack pnpm --filter @netgrid/ai test` grün.
- `corepack pnpm --filter @netgrid/ai typecheck` grün.
- `git diff --check` grün.

### AI-STRUCT-8 abgeschlossen

Umsetzung:

- Gemeinsame Semantic-Runtime-Typen nach `packages/ai/src/runtime/semantic-runtime-types.ts` extrahiert.
- Plan-Mapping- und Semantic-Choice-Ranking nach `packages/ai/src/runtime/semantic-choice-ranking.ts` extrahiert.
- `packages/ai/src/index.ts` behält die Runtime-Verdrahtung, verliert aber den extrahierten Ranking-/Mapping-Block.
- `packages/ai/src/runtime/semantic-runtime.ts` re-exportiert die Runtime-Typen kompatibel aus der neuen Typdatei.

Verifikation:

- `corepack pnpm --filter @netgrid/ai test` grün, 51 Testdateien, 1027 Tests.
- `corepack pnpm --filter @netgrid/ai typecheck` grün.
- `git diff --check` grün.

Scope-Kontrolle:

- Keine Änderung an Engine, LegalAction-Erzeugung, `applyAction`, Replay, StateHash oder Randomness.
- Legacy-Mode, No-Candidate-Fallback und Public-Export-Kompatibilität bleiben über bestehende Verdrahtung erhalten.

### AI-STRUCT-9 abgeschlossen

Umsetzung:

- V1.4.3-Benchmark-/Exploit-Fixture-Verträge aus `packages/ai/src/index.test.ts` nach `packages/ai/src/simulation/v143-fixtures.test.ts` verschoben.
- Reine Simulation-Harness- und Doctrine-Quality-Metriktests nach `packages/ai/src/simulation/simulation-harness.test.ts` verschoben.
- `index.test.ts` bleibt für die stärker mit lokalen Engine-Harness-Helfern verflochtenen Smoke- und Integrationsfälle zuständig.

Verifikation:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts src/simulation/v143-fixtures.test.ts src/simulation/simulation-harness.test.ts` grün, 473 Tests.
- `corepack pnpm --filter @netgrid/ai test` grün, 53 Testdateien, 1027 Tests.
- `corepack pnpm --filter @netgrid/ai typecheck` grün.
- `git diff --check` grün.

Scope-Kontrolle:

- Keine Assertions gelöscht oder gelockert; die verschobenen Tests laufen unverändert in fokussierten Dateien.
- Keine Runtime-, Engine- oder LegalAction-Vertragsänderung.

### AI-SEM-1 abgeschlossen

Umsetzung:

- `ActionSemanticCandidate` trennt jetzt `sourceCardInstanceId` und `sourceDefinitionId`; `sourceCardId` bleibt als bestehendes Alias für die Instanz erhalten.
- `applyCardActionSourceBinding` übernimmt Definition-IDs nur aus side-safe LegalAction-Payload-Feldern oder side-safe Ability-Bindings.
- `applyCardSemanticJoin` joint CardSemanticProfiles ausschließlich über `sourceDefinitionId`; reine Instanz-IDs lösen keinen Profil-Join aus.
- Bestehende Action-Semantik- und DeckDoctrine-Diagnose-Tests wurden auf Definition-ID-Profile umgestellt.

Verifikation:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/action-semantic-candidate.test.ts src/action-doctrine-goal-diagnostics.test.ts src/semantic-ai-runtime-cutover.test.ts` grün, 55 Tests.
- `corepack pnpm --filter @netgrid/ai test` grün, 53 Testdateien, 1028 Tests.
- `corepack pnpm --filter @netgrid/ai typecheck` grün.
- `git diff --check` grün.

Scope-Kontrolle:

- Keine Hidden-Info-Auflösung aus Instanz-IDs oder Gegnerzonen.
- BasicActions erhalten keinen CardSemanticJoin.
- Multi-Ability-Fälle bleiben ohne eindeutige Ability-ID unresolved.

### AI-SEM-2 abgeschlossen

Umsetzung:

- Neue Coverage-Matrix in `packages/ai/src/actions/action-semantic-coverage.test.ts`.
- Alle bekannten `LegalAction`-Typen werden auf Candidate-Identität, `legalActionRef`, HardGates, Visibility, Timing, Cost, ProjectionStatus und Evidence geprüft.
- Zentrale BasicActions werden separat gegen source-/ability-freie Projektion abgesichert.

Verifikation:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/actions/action-semantic-coverage.test.ts src/action-semantic-candidate.test.ts src/semantic-ai-runtime-cutover.test.ts` grün, 48 Tests.
- `corepack pnpm --filter @netgrid/ai test` grün, 54 Testdateien, 1030 Tests.
- `corepack pnpm --filter @netgrid/ai typecheck` grün.
- `git diff --check` grün.

Scope-Kontrolle:

- Keine Runtime-Scoring-Änderung.
- Keine LegalAction-Erzeugung, Engine-Revalidierung oder Hidden-Info-Grenze geändert.

### AI-DOC-1 abgeschlossen

Umsetzung:

- `docs/reviews/ai/ai-source-structure-reorg-final-report-2026-06-10.md` korrigiert den historischen roten Baseline-Hinweis und verweist auf den grünen Follow-up-Stand.
- `docs/reviews/ai/ai-source-followup-action-semantics-final-report-2026-06-10.md` neu angelegt.

Verifikation:

- `git diff --check` grün.

Scope-Kontrolle:

- Nur Dokumentation geändert.

## Controller-Prompt-Kern

```text
/Goal Arbeite die Folgepakete AI-FUP-0, AI-STRUCT-8, AI-STRUCT-9, AI-SEM-1, AI-SEM-2, AI-DOC-1 und FINAL-GREEN sequenziell ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_SOURCE_FOLLOWUP_ACTION_SEMANTICS auf Branch codex/ai-source-followup-action-semantics.
Nutze den Hauptworkspace nur für den finalen Merge.
Arbeite Lean Local Mode: Ziel klären, Dateien prüfen, direkt umsetzen, relevante Tests/Typechecks ausführen, kurzer Review, Commit.
Stelle keine Zwischenfragen, solange konservative automatische Fortsetzung möglich ist.
Arbeite immer nur am aktuellen Paket.
Führe Paketchecks aus und committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Alle Pakete AI-FUP-0 bis FINAL-GREEN sind abgeschlossen oder ein Sicherheitsblocker ist dokumentiert.
- Alle Paketcommits liegen auf `codex/ai-source-followup-action-semantics`.
- Vollständiger `@netgrid/ai`-Testlauf, Typecheck und `git diff --check` sind grün.
- Arbeitsbranch ist lokal nach `main` integriert.
- Hauptworkspace ist nach Merge geprüft.
- Arbeits-Worktree ist entfernt.
