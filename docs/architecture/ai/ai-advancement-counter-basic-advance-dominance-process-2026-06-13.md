# AI Advancement Counter Basic-Advance Dominance Process

Status: in_progress

Quelle/Vorgabe: Nutzer-Handoff vom 2026-06-13 zur KI-Bewertung von `Team Restructuring` und generischen Advancement-Counter-Placement-Aktionen.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Umsetzung. Gesamtziel, Nicht-Ziele, relevante Module, Testfälle und Sicherheitsgrenzen sind bestimmbar. Kleine Annahme: Die konkrete Umsetzung darf in `packages/ai/src/index.ts` erfolgen, weil dort die aktuelle Semantic-Runtime-Bewertung und Legacy-Scoring-Evidenz für Corp-Aktionen liegen.

## Gesamtziel

Die Corp-KI bewertet kartenbasierte Advancement-Counter-Placement-Aktionen nur nach ihrem inkrementellen Mehrwert gegenüber legalem Basic Advance. Wenn eine Operation bei der konkreten Boardlage nur einen Counter auf ein Ziel legt und dieses Ziel per normalem `advance_card` denselben Counter erhalten könnte, wird die Kartenaktion als `dominated_by_basic_advance` stark abgewertet.

## Annahmen

- `Team Restructuring` ist der leitende Fall, die Bewertungsregel wird aber als generische Dominanzprüfung für Advancement-Counter-Placement formuliert.
- Die Engine bleibt alleinige Regelautorität; die KI erzeugt keine LegalActions und verändert keine Legalität.
- Die Prüfung nutzt ausschließlich side-sichere Corp-PlayerView-Information und aktuelle LegalActions.
- Ein zweiter sinnvoller Counter ist der eigentliche Mehrwert solcher Operationen; ein einzelner Counter ist nur ein Basic-Advance-Ersatz.

## Nicht-Ziele

- Keine Änderung an Engine, `applyAction`, PlayerActions, Replay, StateHash oder Hidden-Info-Verträgen.
- Keine Kartenfreigabe, kein Manifest-Gate und keine Änderung am Kartentext.
- Keine globale Neugewichtung aller Corp-Operationen außerhalb der Advancement-Counter-Dominanz.

## Controller-Invarianten

- Nur `LegalActions` werden bewertet.
- Hidden-Info bleibt unberührt.
- Eine kartenbasierte Aktion darf nur wegen fehlendem inkrementellen Nutzen abgewertet werden, nicht illegal gemacht werden.
- Basic-Advance-Dominanz greift nicht, wenn kein äquivalentes legales `advance_card` auf dasselbe Ziel sichtbar ist.

## Automatische Fehlerbehandlung

- Wenn Tests fehlschlagen, wird die Ursache eng auf die betroffenen AI-Bewertungen eingegrenzt.
- Wenn eine bestehende Fixture eine abweichende gewünschte Semantik beweist, wird der Konflikt dokumentiert und nicht still überschrieben.
- Wenn main während der Umsetzung weiterläuft, wird main vor dem finalen Merge defensiv in den Arbeitsbranch integriert.

## Sicherheitsblocker

- Jede Änderung, die LegalAction-Erzeugung, Engine-Auflösung oder Hidden-Info-Projektion verändert, blockiert den Prozess.
- Jede Dominanzregel, die ohne LegalAction-Nachweis für Basic Advance greift, blockiert den Prozess.

## State Machine

1. `process_artifact`: Prozessdokument erstellen und committen.
2. `implementation`: Dominanzbewertung und Evidenz ergänzen.
3. `regression`: Tests für Vapor Ops, Einzelagenda und zwei sinnvolle Ziele ergänzen.
4. `verification`: fokussierte AI-Tests, Typecheck und Diff-Checks ausführen.
5. `integration`: Arbeitsbranch lokal nach `main` mergen und final prüfen.

## Paketfolge

### AI-ADV-DOM-1 Prozessartefakt

Ziel: Diesen Prozess als steuerndes Artefakt dokumentieren.

Eingangsvoraussetzungen: sauberer Worktree auf `codex/ai-advance-dominance`.

Konkrete Arbeit: Dokument unter `docs/architecture/ai/` anlegen.

Kernartefakte: `docs/architecture/ai/ai-advancement-counter-basic-advance-dominance-process-2026-06-13.md`.

Checks: `git diff --check`.

Done-Gate: Dokument ist versioniert und beschreibt Ziel, Pakete, Tests und Sicherheitsgrenzen.

Commit-Message-Vorschlag: `docs: plan advancement dominance ai process`

### AI-ADV-DOM-2 Implementierung

Ziel: Semantic Runtime und relevante Corp-Scoring-Evidenz erkennen und bewerten `advancement_counter_placement_dominated_by_basic_advance`.

Eingangsvoraussetzungen: AI-ADV-DOM-1 abgeschlossen.

Konkrete Arbeit:

- `Team Restructuring` und vergleichbare Counter-Placement-Aktionen aus LegalAction/Source/RulesText/Payload erkennen.
- Legale äquivalente Basic-Advance-Ziele aus aktuellen `advance_card`-LegalActions ableiten.
- Bei nur einem verwertbaren Counter-Ziel und Basic-Advance-Äquivalent stark negativen Score-Component ergänzen.
- Debug-Evidence wie `advancement_selected_targets`, `advancement_max_targets`, `basic_advance_equivalent_available` und `dominated_by_basic_advance` ausgeben.

Kernartefakte: `packages/ai/src/index.ts`.

Checks: fokussierte AI-Tests nach Paket 3; `git diff --check`.

Done-Gate: Dominanzkomponente ist generisch, side-sicher und berührt keine Engine-Legalität.

Commit-Message-Vorschlag: `fix(ai): discount dominated advancement counter operations`

### AI-ADV-DOM-3 Regression

Ziel: Leitfälle gegen Regression absichern.

Eingangsvoraussetzungen: AI-ADV-DOM-2 abgeschlossen.

Konkrete Arbeit:

- Nur `Vapor Ops` advancebar: `Team Restructuring` wird nicht gespielt.
- Nur eine advancebare Agenda: Basic Advance wird gegenüber `Team Restructuring` bevorzugt.
- Zwei sinnvolle Ziele: `Team Restructuring` darf gewinnen.
- Dominanz-Evidenz wird im Debug-Score sichtbar.

Kernartefakte: `packages/ai/src/index.test.ts`.

Checks: fokussierter Vitest-Lauf für neue Tests; `@netgrid/ai` typecheck; `git diff --check`.

Done-Gate: Tests belegen alle expliziten Handoff-Regressionsfälle außer dem Decoy-Fall, der als Follow-up ohne stabile Wertlosigkeitsdefinition bleibt.

Commit-Message-Vorschlag: `test(ai): cover advancement operation dominance`

### AI-ADV-DOM-4 Integration

Ziel: Arbeitsbranch sauber verifizieren und lokal nach `main` mergen.

Eingangsvoraussetzungen: AI-ADV-DOM-1 bis AI-ADV-DOM-3 committed und Worktree sauber.

Konkrete Arbeit: finale Checks, main-Abgleich, lokaler Merge, Worktree-Entfernung.

Kernartefakte: Git-Historie.

Checks: fokussierte AI-Tests, `@netgrid/ai` typecheck, `git diff --check`, `git status --short`.

Done-Gate: `main` enthält die Paketcommits und ist sauber.

Commit-Message-Vorschlag: kein zusätzlicher Commit, Fast-Forward-Merge bevorzugt.

## Verifikationsregeln

- Mindestchecks: `corepack pnpm --filter @netgrid/ai test -- src/index.test.ts -t "advancement operation basic advance dominance"`, `corepack pnpm --filter @netgrid/ai typecheck`, `git diff --check`.
- Falls der fokussierte Testbefehl wegen bestehender Teststruktur nicht greift, wird ein äquivalenter Vitest-Pattern-Lauf verwendet und dokumentiert.

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree: `C:\Projekte\NETGRID_AI_ADVANCE_DOMINANCE`.
- Arbeitsbranch: `codex/ai-advance-dominance`.
- Hauptworkspace: `C:\Projekte\NETGRID`, nur für finalen Merge nach `main`.
- Jeder abgeschlossene Paketstand wird separat committed.
- Kein Push und kein Pull Request ohne Nutzerwunsch.

## Controller-Prompt-Kern

`/Goal Arbeite den AI-Advancement-Counter-Basic-Advance-Dominance-Prozess vollständig und sequenziell von AI-ADV-DOM-1 bis AI-ADV-DOM-4 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis-Pflichtseiten, den release-implementation-agent und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_ADVANCE_DOMINANCE auf Branch codex/ai-advance-dominance. Nutze den Hauptworkspace nur für den finalen Merge. Arbeite immer nur am aktuellen Paket, führe Paketchecks aus, committe jedes abgeschlossene Paket und stoppe bei Sicherheitsblockern mit Blocker-Report.`

## Abschlusskriterien

- Dominanzbewertung ist implementiert und getestet.
- Relevante Debug-Evidence ist vorhanden.
- Pakete sind committed.
- Arbeitsbranch ist lokal in `main` integriert.
- Worktree ist nach erfolgreicher Integration entfernt.
