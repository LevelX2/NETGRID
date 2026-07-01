# Agenda Semantic Review v1 Process

Status: `active`

Quelle/Vorgabe: Nutzerauftrag vom 2026-07-01. Grundlage sind die fachlich überarbeiteten Review-Artefakte `agenda_semantic_review_v1.md`, `agenda_semantic_review_v1.csv` und der begleitende Kommentar, dass die alte Logik unvollständig ist und die Review-Ergebnisse vollständig umgesetzt werden sollen.

Arbeitsbranch: `codex/agenda-semantic-review-v1`

Arbeits-Worktree: `C:\Projekte\NETGRID_AGENDA_SEMANTIC_REVIEW_V1`

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise.

- Gesamtziel: Alle 50 Agenda-Hints aus Review v1 fachlich korrigieren und für KI-Spielbarkeit mit wertvollen Taktiksignalen, Strategieankern und hierarchischen strategischen Rollen versorgen.
- Endzustand: Aktive Agenda-Hints, Strategy-Taxonomie, Taktiksignal-Katalog, Inspector-Index und UI-/API-Verträge sind konsistent; der Abschlussreport zeigt Agenda, Text, Status vorher/nachher und alle geänderten Semantikfelder.
- In Scope: Agenda-Hints, fehlende Corp-Strategieanker, fehlende Taktiksignale, `strategySupportPairs`, Summary-Felder, abgeleitete AI-Artefakte, gezielte Tests, Review-/Abschlussdokumentation.
- Nicht in Scope: Engine-Regeln, LegalActions, Replay/StateHash, Hidden-Info-Projektion, produktive Planner-Gewichtungen, Push, Pull Request oder externe Integration.
- Verifikation: AI-Hint-Generatoren, Strategy-Taxonomiecheck, Inspector-Indexcheck, relevante AI-/Web-Tests, Typechecks und `git diff --check`.

## Gesamtziel

`/Goal Arbeite Agenda Semantic Review v1 vollständig und sequenziell von AGENDA-SEM-00 bis AGENDA-SEM-05 ab, committe jedes abgeschlossene Paket, integriere den fertigen Arbeitsbranch lokal nach main und markiere das Goal erst danach als complete.`

Der Prozess ist abgeschlossen, wenn:

- alle 50 Agenda-Zeilen aus Review v1 maschinell gegen den aktiven Hint-Bestand abgeglichen sind;
- empfohlene Taktiksignale entweder im Katalog existieren oder bewusst kanonisch normalisiert sind;
- neue Strategieanker nur dort eingeführt sind, wo Review v1 ein echtes strategisches Muster benennt;
- jede aktive Agenda entweder konsistente `strategySupportPairs` oder bewusst keinen Strategieanker hat;
- `lineSupport` und `strategicRole` als kompatible Summary-Felder zu den Paaren passen;
- abgeleitete AI-Artefakte regeneriert und validiert sind;
- ein menschenlesbarer Vorher/Nachher-Report pro Agenda vorliegt;
- der Arbeitsbranch lokal nach `main` integriert und der Worktree entfernt ist.

## Annahmen

- Review v1 ist die fachlich führende Quelle, nicht der ältere Pilotstand.
- Feine Rollenbegriffe aus Review v1 werden als `roleDetail` gespeichert, wenn sie keine kanonische Grobrolle sind.
- Die kanonischen Grobrollen bleiben klein und stabil; neue Fachnuancen entstehen primär über `roleDetail`.
- Neue Strategieanker werden nur für wiederverwendbare Muster angelegt, nicht für Einzelkarten-Etiketten.
- Support-only-Agendas dürfen starke Taktiksignale haben, ohne künstlichen Strategieanker zu bekommen.
- Falls Review v1 einen deferred anchor nennt und die Taxonomie im Prozess sauber ergänzt wird, darf die Agenda den neuen Anchor sofort nutzen.

## Nicht-Ziele

- Keine Änderung an Kartentexten, Kosten, Regeln oder Spielzustandsübergängen.
- Keine neue AI-Entscheidungsgewichtung außerhalb der vorhandenen Hint-/Inspector-Verträge.
- Keine breite Neuordnung der gesamten AI-Semantik außerhalb der 50 Agenda-Karten.
- Keine Migration historischer Reports oder Legacy-Artefakte.

## Controller-Invarianten

- `strategySupportPairs` sind die führende hierarchische Semantik: `strategyId -> role -> roleDetail`.
- `lineSupport` enthält exakt die eindeutigen `strategyId`-Werte aus den Paaren.
- `strategicRole` enthält exakt die eindeutigen kanonischen Rollen aus den Paaren.
- Evidence verweist nur auf bekannte Taktik- oder Funktionssignale.
- Taktiksignale beschreiben konkrete Spielwirkung, nicht nur generische Score-Nähe.
- Strategieanker beschreiben wiederverwendbare Corp-Spielpläne.
- Rules Engine, LegalActions, Replay, StateHash und Hidden-Info-Verträge bleiben unverändert.

## Automatische Fehlerbehandlung

- Fehlende Taktiksignal-IDs werden zuerst katalogisiert oder kanonisch ersetzt.
- Fehlende Strategieanker werden nur ergänzt, wenn mindestens eine Agenda ein echtes wiederverwendbares strategisches Muster daraus macht.
- Nicht-kanonische Review-Rollen werden auf eine kanonische Rolle plus `roleDetail` normalisiert.
- Inkonsistente Paare, unbekannte Evidence oder Summary-Abweichungen blockieren das aktive Paket.
- Rote Checks werden eng debuggt; kein Folgepaket startet mit offenem Done-Gate.

## Sicherheitsblocker

Der Prozess stoppt, wenn eine Änderung verdeckte Kartendaten in KI-Inputs, Logs, PlayerViews, PublicEvents oder Inspector-Daten einführt, LegalActions erzeugt oder verändert, Engine-/Replay-/StateHash-Verträge berührt oder produktive AI-Entscheidungen ohne eigenes Gate neu gewichtet.

## State Machine

`planned -> source_imported -> taxonomy_ready -> hints_applied -> generated_validated -> reported -> merged_complete`

Ein Zustand wird erst verlassen, wenn das zugehörige Paket committed ist.

## Paketfolge

| Paket | Titel | Done-Gate |
| --- | --- | --- |
| AGENDA-SEM-00 | Prozess und Review-Quellen | Prozessartefakt und Review-v1-Quellen sind versioniert; Ausgangslage ist nachvollziehbar. |
| AGENDA-SEM-01 | Taxonomie-Grundlagen | Fehlende Strategieanker und Taktiksignale sind kontrolliert ergänzt; Ontologie kennt neue Anker. |
| AGENDA-SEM-02 | High-Priority-Agendas | Die 7 High-Priority-Agendas sind fachlich korrigiert und validierbar. |
| AGENDA-SEM-03 | Restliche Agenda-Hints | Alle 50 Agenda-Hints folgen Review v1, inklusive support-only-Entscheidungen. |
| AGENDA-SEM-04 | Generatoren und Tests | Compiled Hints, Inspector-Index, Taxonomiecheck, gezielte Tests und Typechecks laufen. |
| AGENDA-SEM-05 | Abschlussreport und Integration | Vorher/Nachher-Report liegt vor; Branch ist lokal nach `main` gemerged; Worktree ist entfernt. |

## Paketdetails

### AGENDA-SEM-00: Prozess und Review-Quellen

Ziel: Review v1 als verbindliche Eingabe sichern.

Arbeit:

- Prozessartefakt schreiben.
- `agenda_semantic_review_v1.md` und `.csv` unverändert unter `docs/reviews/ai/` importieren.
- Review-Zählungen und priorisierte Karten aus der Quelle prüfen.

Checks:

- `git diff --check`

Commit-Vorschlag: `docs(ai): plan agenda semantic review v1`

### AGENDA-SEM-01: Taxonomie-Grundlagen

Ziel: Die alte, unvollständige Semantiklogik durch explizite Taxonomiegrundlagen schließen.

Arbeit:

- Fehlende Taktiksignale aus Review v1 im Katalog ergänzen oder kanonisch normalisieren.
- Neue Corp-Strategieanker nur für wiederverwendbare Muster ergänzen, insbesondere Action-Tempo, Overadvance-Value, Draw-Engine und Deck-Recycle-Engine.
- `hint-ontology` um neue Strategieanker erweitern.
- Nicht-kanonische Review-Rollen auf kanonische Rollen plus `roleDetail` abbilden.

Checks:

- `node scripts/check-ai-strategy-taxonomy.mjs`
- `git diff --check`

Commit-Vorschlag: `feat(ai): add agenda semantic review taxonomy`

### AGENDA-SEM-02: High-Priority-Agendas

Ziel: Die sieben fachlich wichtigsten Korrekturen zuerst sauber umsetzen.

High-Priority-IDs:

- `onr_classic_003_unlisted-research-lab`
- `onr_classic_004_theorem-proof`
- `onr_v1_208_on-call-solo-team`
- `onr_v1_214_project-babylon`
- `onr_v1_216_security-purge`
- `onr_v1_217_strike-force-kali`
- `onr_proteus_009_viral-breeding-ground`

Checks:

- `node scripts/check-ai-strategy-taxonomy.mjs`
- `git diff --check`

Commit-Vorschlag: `feat(ai): correct high priority agenda semantics`

### AGENDA-SEM-03: Restliche Agenda-Hints

Ziel: Alle Agenda-Hints aus Review v1 vollständig anwenden.

Arbeit:

- Review-v1-Empfehlungen auf alle 50 Agendas anwenden.
- Support-only-Agendas ohne künstliche Strategy-Pairs belassen.
- Summary-Felder aus Paaren ableiten.
- Vorher/Nachher-Daten für den Abschlussreport maschinell erfassen.

Checks:

- `node scripts/check-ai-strategy-taxonomy.mjs`
- `git diff --check`

Commit-Vorschlag: `feat(ai): apply agenda semantic review v1`

### AGENDA-SEM-04: Generatoren und Tests

Ziel: Alle abhängigen AI-Artefakte und relevanten Verträge validieren.

Checks:

- `corepack pnpm build:ai-compiled-hints`
- `corepack pnpm build:ai-hint-inspector-index`
- `corepack pnpm check:ai-compiled-hints`
- `corepack pnpm check:ai-hint-inspector-index`
- `node scripts/check-ai-strategy-taxonomy.mjs`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/ai-hint-inspector-index.test.ts src/hint-ontology.test.ts --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm --filter @netgrid/web exec vitest run app/ai-hint-inspector-ui.test.ts app/api/cards/catalog-data.test.ts --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/web typecheck`
- `git diff --check`

Commit-Vorschlag: `test(ai): validate agenda semantic review artifacts`

### AGENDA-SEM-05: Abschlussreport und Integration

Ziel: Ergebnis prüfbar dokumentieren und lokal integrieren.

Arbeit:

- Abschlussreport mit Agenda, Text, Status vorher/nachher, Taktiksignalen, Strategieankern und Rollen schreiben.
- Finalchecks wiederholen.
- Arbeitsbranch sauber nach `main` mergen.
- Worktree entfernen.

Checks:

- Finaler Teil aus AGENDA-SEM-04 nach Bedarf wiederholen.
- `git status --short`
- `git diff --check`

Commit-Vorschlag: `docs(ai): report agenda semantic review v1`

## Verifikationsregeln

- Paketchecks sind Mindestumfang; bei geänderten Verträgen werden betroffene Tests ergänzt.
- `corepack pnpm check:ai-strategy-taxonomy` wird nicht als Paket-Script mit Report-Write genutzt, wenn dadurch unrelated Altberichte churnen; stattdessen läuft `node scripts/check-ai-strategy-taxonomy.mjs`.
- Format- oder Generated-Artefakte werden nur dort aktualisiert, wo sie vom Prozess betroffen sind.

## Worktree-, Git- und Integrationsregeln

- Alle Umsetzungsschritte laufen im Worktree `C:\Projekte\NETGRID_AGENDA_SEMANTIC_REVIEW_V1`.
- Der Hauptworkspace `C:\Projekte\NETGRID` wird nur für den finalen lokalen Merge nach `main` genutzt.
- Nach jedem Paket: Checks, `git diff --check`, gezieltes Staging, Commit.
- Kein Push und kein Pull Request ohne ausdrücklichen Nutzerauftrag.
- Konflikte werden defensiv gelöst; fachlich kompatible Intentionen bleiben erhalten.

## Controller-Prompt-Kern

Arbeite ausschließlich im Agenda-Semantic-Review-v1-Worktree. Beginne bei AGENDA-SEM-00 und gehe strikt sequenziell vor. Stelle keine Zwischenfragen, solange die Annahmen konservative Fortsetzung erlauben. Aktualisiere Paketstatus, führe Paketchecks aus, committe jedes abgeschlossene Paket und stoppe nur bei Sicherheitsblockern oder fachlich nicht auflösbaren Widersprüchen. Nach Abschluss aller Pakete final verifizieren, lokal nach `main` mergen, Worktree entfernen und Goal als complete markieren.

## Abschlusskriterien

- Die Review-v1-Empfehlungen sind vollständig umgesetzt oder als bewusste Normalisierung im Report begründet.
- Keine Agenda behält einen offenkundig falschen Strategieanker aus dem Pilot.
- Strategieanker und strategische Rollen sind hierarchisch in `strategySupportPairs` abgebildet.
- Alle neuen Evidence-IDs und Strategy-IDs sind validierbar.
- Der Abschlussreport erlaubt fachliche Kontrolle von Alt- zu Neustand.
- `main` enthält den integrierten Arbeitsbranch lokal und ist sauber.
