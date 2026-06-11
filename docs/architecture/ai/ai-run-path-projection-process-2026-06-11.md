# AI Run Path Projection Process 2026-06-11

## Status

`in_progress`

## Quelle/Vorgabe

Playtest-Fund vom 2026-06-11: Die Runner-KI startete einen Run auf R&D, obwohl der sichtbare Pfad aus `Viral 15`, `Haunting Inquisition` und `Virizz` mit zwei `Cyfermaster` und `Force Shield` nicht sicher zum Zugriff fuehrt. Die bestehende AI-Projektion wertete nur die sichtbaren Break-Kosten fuer die `end_the_run`-Subroutine von `Haunting Inquisition` und ignorierte harte oder sehr teure ungebrochene Nebenfolgen wie Programmtrash und Run-Lock.

## Zielpruefung

Die Vorgabe ist fuer automatische Abarbeitung ausreichend praezise.

- Gesamtziel: Runner-KI soll Runs auf HQ, R&D, Archives und Remotes nur dann als sicher erreichbar bewerten, wenn sichtbare gerezzte ICE mit vorhandenen sichtbaren Runner-Mitteln ohne harte ungebrochene Nebenfolgen passierbar sind.
- Sequenz: Vertrag/Tests vorbereiten, sichtbare Pfadprojektion erweitern, KI-Anbindung pruefen, final verifizieren und lokal integrieren.
- In Scope: `packages/ai/src/visible-run-analysis.ts`, betroffene AI-Scoring-/Planpfade, fokussierte AI-Tests, Dokumentation.
- Nicht-Ziele: Full-State-Simulation, Hidden-Info-Zugriff, echte Engine-Mutation waehrend AI-Bewertung, neue Kartenfreigabe, UI-Redesign.
- Abnahmekriterien: Der konkrete Viral-15/Haunting/Virizz-Fall wird als nicht sicher erreichbar oder als harter Risk-Blocker bewertet; bestehende Tutor-/Virizz-Future-Cost-Abdeckung bleibt gruen.

## Gesamtziel

Eine side-sichere, engine-nahe Run-Pfad-Projektion fuer die Runner-KI, die pro Zielserver sichtbare ICE-Kosten und sichtbare ungebrochene Nebenfolgen strukturiert bewertet und in RunTargetEvaluation, TacticalPlans und Semantic Runtime konsistent als Blocker oder starke Empfehlung gegen den Run nutzt.

## Annahmen

- Die AI darf ausschliesslich PlayerView-/VisibleCard-/LegalAction-Daten verwenden.
- Die vorhandene `effectiveRunQuote` ist die fuehrende Bruecke von Engine-Regelwissen in AI-Sichtbarkeit.
- Ein Run ist fuer die Start-Run-Auswahl nicht "sicher erreichbar", wenn Zugriff nur nach ungebrochener sichtbarer Damage-/Programmtrash-/Run-Lock-/Action-Debt-Folge moeglich waere.
- Jack-out nach `Viral 15` bleibt eine korrekte Engine-Option, darf aber nicht den vorherigen Start-Run als guten Plan rechtfertigen.

## Nicht-Ziele

- Keine Simulation verdeckter ICE, Root-Karten, HQ-/R&D-Inhalte oder unrezzed Kartenidentitaeten.
- Keine echte Hintergrund-Ausfuehrung von `applyAction` auf Match-State.
- Keine Veraenderung von Engine-Regelautoritaet, Replay, StateHash oder Randomness.
- Keine breite Neugewichtung aller Runner-Planauswahlwerte.

## Controller-Invarianten

- Engine bleibt einzige Regelautoritaet.
- AI erzeugt keine LegalActions und darf keine Illegalitaet erfinden.
- Hidden Info bleibt redigiert; Diagnostic-Strings enthalten keine privaten Instanz- oder Zoneninhalte.
- Projektion ist deterministisch und side-safe.
- Alle Serverarten verwenden denselben Pfadvertrag.

## Automatische Fehlerbehandlung

- Wenn ein sichtbarer Effekt nicht sicher bepreist werden kann, wird er konservativ als Risiko statt als kostenloses Durchlassen behandelt.
- Wenn der Runner einen Effekt sichtbar brechen kann, darf die Projektion die Break-Kosten einrechnen.
- Wenn der Runner einen Effekt nicht sichtbar brechen kann und der Effekt Zugriff nur mit harter Folge erlaubt, blockiert oder entwertet die Projektion den Run.
- Wenn Tests eine bestehende Engine-Annahme widerlegen, wird nicht um die Tests herum optimiert; der Blocker wird dokumentiert.

## Sicherheitsblocker

- Zugriff auf `GameState.cardInstances` aus der AI ausserhalb redigierter PlayerView-Daten.
- Verwendung verdeckter R&D-/HQ-/Remote-Root-Inhalte zur Run-Auswahl.
- Nichtdeterministische Pfadbewertung.
- Veraenderung echter Match-States waehrend einer AI-Vorschau.

## State Machine

1. `preflight`: Worktree und Branch angelegt, Prozessartefakt erstellt.
2. `projection_contract`: Tests fuer sichtbare harte ungebrochene Folgen ergaenzt.
3. `projection_implementation`: Run-Pfad-Projektion erweitert.
4. `ai_integration`: Scoring, RunTargetEvaluation und TacticalPlans nutzen den erweiterten Befund.
5. `verification`: fokussierte Tests, Typecheck und Diff-Checks bestanden.
6. `integration`: Arbeitsbranch lokal nach `main` integriert.

## Paketfolge

### Paket 1: Prozessartefakt und Repro-Vertrag

- Ziel: Prozess, Scope und konkreten Repro-Fall dokumentieren.
- Eingangsvoraussetzungen: Worktree `C:\Projekte\NETGRID_AI_RUN_PATH_PROJECTION`, Branch `codex/ai-run-path-projection`.
- Arbeit: Dieses Dokument anlegen.
- Kernartefakte: `docs/architecture/ai/ai-run-path-projection-process-2026-06-11.md`.
- Tests/Checks: `git diff --check`.
- Done-Gate: Prozessartefakt committed.
- Commit: `docs(ai): define run path projection process`

### Paket 2: Sichtbare Run-Pfad-Projektion haerten

- Ziel: `assessKnownRezzedIcePath` erkennt ungebrochene sichtbare harte Folgen wie Programmtrash, Damage und Run-Lock als Kosten-/Risikobestandteil.
- Eingangsvoraussetzungen: Paket 1 committed.
- Arbeit: Typen und Bewertung in `visible-run-analysis.ts` erweitern; fokussierte Tests fuer Viral 15 + Haunting + Virizz und bestehende Tutor/Virizz-Szenarien ergaenzen.
- Kernartefakte: `packages/ai/src/visible-run-analysis.ts`, `packages/ai/src/index.test.ts`.
- Tests/Checks: fokussierte AI-Tests fuer sichtbare Run-Analyse.
- Done-Gate: Repro-Fall ist nicht mehr `canReachAccess: true` ohne harte Folge.
- Commit: `fix(ai): account for hard unbroken run path effects`

### Paket 3: AI-Anbindung und Diagnostics konsolidieren

- Ziel: Semantic Runtime, RunTargetEvaluation und TacticalPlans zeigen und nutzen den erweiterten Befund konsistent.
- Eingangsvoraussetzungen: Paket 2 committed.
- Arbeit: Score-/Exclusion-/Planpfade pruefen und bei Bedarf erweitern, damit HQ/R&D/Archives/Remote gleich behandelt werden.
- Kernartefakte: `packages/ai/src/index.ts`, `packages/ai/src/runner-run-target-evaluation.ts`, `packages/ai/src/tactical-plans.ts`.
- Tests/Checks: fokussierte AI-Tests fuer Semantic Exclusion und Planblocker.
- Done-Gate: R&D-Repro-Run wird ausgeschlossen oder eindeutig als nicht sicher erreichbar bewertet; Diagnostics nennen side-safe Grund.
- Commit: `fix(ai): route run path risk through runner decisions`

### Paket 4: Finale Verifikation und Integration

- Ziel: Arbeitsbranch sauber finalisieren und lokal nach `main` mergen.
- Eingangsvoraussetzungen: Pakete 1 bis 3 committed.
- Arbeit: `git diff --check`, AI-Typecheck, relevante Tests; Arbeitsbranch mit aktuellem `main` abgleichen; Fast-forward-Merge nach `main`.
- Kernartefakte: Git-Historie.
- Tests/Checks: `corepack pnpm --filter @netgrid/ai test -- index.test.ts -t "visible run|Viral 15|Haunting|run path"` und `corepack pnpm --filter @netgrid/ai typecheck`; bei Bedarf weitere fokussierte Tests.
- Done-Gate: Branch merged, Hauptworkspace sauber, Worktree entfernt.
- Commit: kein Paketcommit, nur Merge nach `main`.

## Verifikationsregeln

- Mindestens ein Test muss den konkreten R&D-Fall mit `Viral 15`, `Haunting Inquisition`, `Virizz`, zwei `Cyfermaster` und `Force Shield` absichern.
- Bestehende Tests fuer Tutor-/Virizz-Run-Duration-Effekte muessen weiter bestehen.
- Diagnostics muessen side-safe bleiben.

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/ai-run-path-projection`.
- Arbeits-Worktree: `C:\Projekte\NETGRID_AI_RUN_PATH_PROJECTION`.
- Hauptworkspace: `C:\Projekte\NETGRID`, nur fuer finalen Merge nach `main`.
- Ein Paket wird erst committed, wenn dessen Done-Gate erfuellt ist.
- Kein Push und kein Pull Request ohne ausdruecklichen Nutzerwunsch.

## Controller-Prompt-Kern

```text
/Goal Arbeite AI Run Path Projection 2026-06-11 vollstaendig und sequenziell von Paket 1 bis Paket 4 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md und docs/architecture/ai/ai-run-path-projection-process-2026-06-11.md.
Arbeite ausschliesslich im Worktree C:\Projekte\NETGRID_AI_RUN_PATH_PROJECTION auf Branch codex/ai-run-path-projection.
Nutze den Hauptworkspace nur fuer den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Fuehre Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rueckfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main pruefen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Prozessartefakt liegt versioniert vor.
- Run-Pfad-Projektion behandelt sichtbare harte ungebrochene Folgen konservativ.
- KI startet den dokumentierten R&D-Fall nicht mehr als guten opportunistischen Run.
- Fokussierte Tests und Typecheck sind gruen oder ein enger Blocker ist dokumentiert.
- Arbeitsbranch ist lokal nach `main` integriert.
