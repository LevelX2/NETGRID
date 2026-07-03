# Corp Scoreline Runtime Assessment Prozess 2026-07-03

## Status

`ready_for_main_integration`

## Quelle/Vorgabe

Nutzerauftrag vom 2026-07-03: `assessCorpScoreTerminalWindow(input)` aus `packages/ai/src/legacy/corp-plans.ts` durch ein neues semantisches Corp-Scoreline-Runtime-Modul ablösen, bestehende Runtime-Consumer umstellen, Legacy nur noch als Adapter-/Kompatibilitätsgrenze belassen und mit Tests, Review und Commit abschließen.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung präzise genug:

- Gesamtziel und Endzustand sind benannt.
- Zielmodul und Consumer sind konkret angegeben.
- Invarianten zu Hidden Info, LegalActions und Planner-Grenze sind eindeutig.
- Testszenarien sind vorgegeben.
- Abschluss verlangt relevante AI-Checks, Review und Commit.

Konservative Annahme: Der Paketprozess läuft in `C:\Projekte\NETGRID_CORP_SCORELINE_RUNTIME` auf Branch `codex/corp-scoreline-runtime-assessment`; der Hauptworkspace wird nur für die finale lokale Integration nach `main` genutzt.

## Gesamtziel

Die produktiv relevante Corp-Scoreline-Bewertung liegt nicht mehr fachlich im Legacy-Corp-Planer. Ein neues Runtime-Modul bewertet vorhandene Korp-`LegalActions` pfadbezogen, stellt konkrete empfohlene nächste Schritte bereit und bietet einen Kompatibilitätsadapter für alte Terminal-Window-Consumer.

## Annahmen

- Die neue Bewertung darf bestehende Runtime-Helfer und sichtbare PlayerView-Daten verwenden.
- Wenn vorhandene Action-Semantik noch keine feingranulare Information liefert, darf das Modul konservativ mit sichtbaren CardDefinition-/Action-Payload-/Serverdaten arbeiten.
- Der alte Export `assessCorpScoreTerminalWindow` bleibt zunächst erhalten, leitet aber auf den neuen Adapter um.
- Diagnose-/Benchmark-Nutzungen dürfen über den Adapter weiterlaufen, solange sie keine neue Runtime-Wahrheit definieren.

## Nicht-Ziele

- Keine Engine-, `applyAction`-, LegalAction-, Replay-, StateHash- oder Randomness-Änderung.
- Keine Hidden-Info-Projektion und kein Zugriff auf verdeckte Kartendaten.
- Kein neuer globaler Planner, keine LegalAction-Erzeugung und keine eigene Aktionsauswahl außerhalb bestehender Consumer.
- Keine vollständige Entfernung des gesamten `packages/ai/src/legacy/*`-Pakets in diesem Slice.

## Controller-Invarianten

- Das Modul bewertet nur `input.legalActions`.
- Jede Empfehlung muss auf konkrete vorhandene `actionId`s rückführbar sein.
- Pfadstatus und Blocker werden pro Action/Pfad ermittelt, globale Booleans sind nur Adapter-Ausgabe.
- `blockedByCredits` bewertet, soweit möglich, die betrachtete Aktion und nicht nur Credits vor der Aktion.
- Runner-Contest- und Cheap-Contest-Befunde sind server-/horizon-spezifisch.
- Central Threat darf Score-now unterstützen, Agenda-Install blockieren oder Central Protection priorisieren.
- Evidence darf keinen fixen True-String für false-Befunde enthalten.

## Automatische Fehlerbehandlung

- Bei rotem Paket-Gate wird nur der aktuelle Paketumfang debuggt.
- Wenn ein bestehender Test einen fachlichen Konflikt mit der neuen Architektur zeigt, wird der Konflikt dokumentiert und der Paketfortschritt gestoppt.
- Unrelated untracked Dateien im Hauptworkspace bleiben unberührt.

## Sicherheitsblocker

- Nutzung verdeckter Runner-/Korp-Informationen außerhalb PlayerView.
- Erzeugung oder Veränderung von `LegalActions`.
- Scoreline-Modul wählt selbst global Aktionen statt nur Assessments zu liefern.
- Adapter erzeugt Evidence, die false-Befunde als true markiert.

## State Machine

`preflight` -> `process_artifact` -> `assessment_module` -> `consumer_migration` -> `regression_tests` -> `review_and_verify` -> `main_integration` -> `complete`

## Paketfolge

### P0 Prozessartefakt und Paket-Gates

Ziel: Prozessdokument anlegen, Worktree-Regeln sichern.

Arbeit:

- Dieses Artefakt erstellen.
- Paketfolge, Gates und Commit-Ziele festhalten.

Tests/Checks:

- `git diff --check`

Done-Gate:

- Prozessartefakt existiert und beschreibt Ziel, Nicht-Ziele, Invarianten, Paketfolge und Abschluss.

Commit: `docs(ai): plan corp scoreline runtime assessment`

### P1 Scoreline-Assessment-Modul mit Adapter

Ziel: Neues Modul `packages/ai/src/runtime/corp-scoreline/semantic-runtime-corp-scoreline-assessment.ts` einführen.

Arbeit:

- Typen `CorpScorelineWindowAssessment`, `CorpScorelinePathAssessment`, `CorpScorelineWindowKind`, `CorpScorelineRecommendedNextStep`, `CorpScorelineActionRole`, `CorpScorelineBlockerKind` definieren.
- Pfadbezogene Bewertung vorhandener `LegalActions` implementieren.
- Kompatibilitätsadapter `scorelineAssessmentToTerminalWindowLike` implementieren.
- Alten Export `assessCorpScoreTerminalWindow` auf neuen Adapter umstellen.

Tests/Checks:

- Relevante TypeScript-/Unit-Checks für neues Modul.
- `git diff --check`

Done-Gate:

- Bestehende Aufrufer kompilieren weiter; alte Terminal-Window-Form bleibt adaptergestützt.

Commit: `feat(ai): add semantic corp scoreline assessment`

### P2 Runtime-Consumer-Migration

Ziel: Aktive Consumer verwenden das neue pfadbezogene Assessment.

Arbeit:

- `semantic-runtime-corp-score-safety.ts` konkrete `score_agenda`-Action gegen ihren `CorpScorelinePathAssessment` prüfen lassen.
- `semantic-runtime-corp-passive-scoreline.ts` nur bei unblocked `score_now` oder `advance_agenda` hart bestrafen.
- Corp-Scoreline-Micro-Kandidaten auf neue Empfehlung/Pfade umstellen.

Tests/Checks:

- Fokussierte Runtime-Tests.
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Done-Gate:

- Consumer nutzen nicht mehr nur globale Blocker als Primärentscheidung.

Commit: `refactor(ai): consume path-based corp scoreline assessment`

### P3 Regressionstests

Ziel: Vorgabe-Szenarien gegen Regression absichern.

Arbeit:

- Tests für sicheres Score-now, unsicheren Remote, Scoreline-Economy, Central Threat, Advance-to-score, geschützten Agenda-Install, kein Scorepfad und korrekte Evidence ergänzen.
- Bestehende Tests an Adapter-/Assessment-Ausgabe anpassen.

Tests/Checks:

- Neue und bestehende fokussierte Tests.
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Done-Gate:

- Alle geforderten fachlichen Fälle sind abgedeckt oder begründet dokumentiert.

Commit: `test(ai): cover semantic corp scoreline assessment`

### P4 Review, Wissenspflege und Integration

Ziel: Abschlussartefakt schreiben, relevante Checks ausführen, Arbeitsbranch lokal nach `main` integrieren.

Arbeit:

- Review unter `docs/reviews/ai/` erstellen.
- `docs/codex/CODEX_STATUS.md` und Monatslog aktualisieren.
- Finale Checks ausführen.
- Arbeitsbranch sauber committen und lokal nach `main` mergen.

Tests/Checks:

- Relevante AI-Tests.
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Done-Gate:

- Review benennt ersetzte Legacy-Abhängigkeit und bewusst verbleibenden Adapter.
- Arbeitsbranch ist integriert oder ein dokumentierter Blocker liegt vor.

Commit: `docs(ai): review corp scoreline runtime assessment`

## Verifikationsregeln

- Paketchecks sind Mindestchecks; bei Änderungen an angrenzenden Runtime-Modulen werden fokussierte Vitest-Läufe ergänzt.
- Vollständige AI-Suite wird versucht, wenn der lokale Zeitrahmen vertretbar ist; andernfalls werden fokussierte Gates und Restlimit dokumentiert.

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree: `C:\Projekte\NETGRID_CORP_SCORELINE_RUNTIME`
- Arbeitsbranch: `codex/corp-scoreline-runtime-assessment`
- Hauptworkspace: `C:\Projekte\NETGRID`
- Hauptworkspace nur für finalen Merge nach `main` nutzen.
- Jeder Paketabschluss erhält einen eigenen Commit.
- Kein Push und kein PR ohne ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

`/Goal Arbeite den Corp Scoreline Runtime Assessment Prozess vollständig und sequenziell von P0 bis P4 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_CORP_SCORELINE_RUNTIME auf Branch codex/corp-scoreline-runtime-assessment. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange konservative automatische Fortsetzung möglich ist. Arbeite immer nur am aktuellen Paket, führe Paketchecks aus, committe jedes abgeschlossene Paket und dokumentiere Blocker mit Removal Condition.`

## Abschlusskriterien

- Neues semantisches Scoreline-Modul vorhanden.
- Alter `assessCorpScoreTerminalWindow`-Export ist Adapter auf das neue Assessment.
- Aktive Consumer nutzen pfadbezogene Bewertung.
- Geforderte Tests bestehen oder verbleibende Abweichung ist als Blocker dokumentiert.
- Review und Wissensstatus sind aktualisiert.
- Paketcommits existieren; Arbeitsbranch ist lokal nach `main` integriert.
