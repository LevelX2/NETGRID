# AI Unproductive Run Path Evaluation Fix

Status: abgeschlossen

## Quelle/Vorgabe

Ausgangspunkt ist der Nutzerbefund vom 2026-06-22: Die Runner-KI startet einen Run auf R&D, obwohl der Runner nur 4 Credits hat und ein offen sichtbares ICE mit Trace 5 liegt, dessen erfolgreicher Trace den Run beendet und eine weitere Run-Sperre erzeugt. Im Screenshot wird der Trace mit Runner-Bid 0 korrekt nicht bezahlt, aber diese Effizienz kommt zu spät: Der Run wurde bereits gestartet.

## Zielprüfung

Die Vorgabe ist präzise genug für direkte Umsetzung:

- Gesamtziel: Runner-KI soll Runs vermeiden, wenn side-sicher sichtbare ICE-/Run-Pfade keinen sinnvollen Access erwarten lassen oder einen klar negativen Run-Lock-/Trace-Ende-Effekt erwarten lassen.
- Reihenfolge: Prozess/Preflight, konkrete Reproduktion, generische Unproductive-Run-Path-Policy, Integration in RunTarget/TacticalPlan/Semantic-Ranking, Randfälle/Evidence, Abschluss und lokaler Merge.
- In Scope: `packages/ai/src/visible-run-analysis.ts`, `runner-run-target-evaluation.ts`, `runner-run-target-guidance.ts`, `tactical-plans.ts`, Semantic-Ranking soweit nötig, fokussierte AI-Tests, Review-/Log-Artefakte.
- Nicht-Ziele: keine Engine-Regeländerung, keine neue LegalAction-Erzeugung, keine Änderung an `applyAction`, Replay, StateHash, Randomness oder Hidden-Info-Grenzen.
- Arbeitsmodell: Worktree `C:\Projekte\NETGRID_AI_UNPRODUCTIVE_RUN_PATH_EVALUATION`, Branch `codex/ai-unproductive-run-path-evaluation`, finaler lokaler Merge nach `main`.

## Gesamtziel

Die KI-Bewertung soll sichtbare, stark negative Run-Pfade vor dem Run erkennen. Der konkrete R&D-Fall mit 4 Runner-Credits, offenem Trace-5-End-the-Run-/Run-Lock-ICE und fehlender Break-/Bypass-/Link-Antwort darf nicht als sinnvoller R&D-Druck gestartet werden.

## Nicht-Ziele

- Kein allgemeines Verbot von R&D- oder Remote-Runs.
- Keine Änderung an Trace-Regeln oder Trace-Bid-LegalActions.
- Keine Karten-ID-Sonderlogik für `Asp`; die Lösung muss über sichtbare Run-/Trace-/Subroutine-Eigenschaften funktionieren.
- Keine Hidden-Info-Projektion aus unrezzed oder verdeckten Karten.
- Keine produktive Prognose aus Full GameState.

## Controller-Invarianten

- KI wählt ausschließlich vorhandene `LegalActions`.
- Sichtbare PlayerView, LegalActions, side-sichere PublicEvents und bestehende AIInput-Felder sind die einzige Bewertungsgrundlage.
- Aktuelle PlayerView gewinnt gegen Memory.
- Unknown-Fälle bleiben konservativ: Nicht sichtbare ICE-Effekte dürfen nicht als harter Blocker angenommen werden.
- Debug-/Evidence-Marker bleiben side-sicher und enthalten keine privaten Payloads, CardInstances oder Decklisten.

## Paketfolge

### AIRUN-0: Prozessartefakt und Preflight

Ziel: Prozess, Worktree, Branch und Abnahmeregeln versionieren.

Done-Gate:

- Prozessartefakt existiert.
- Worktree und Branch sind sauber.
- `git diff --check` ist grün.

Commit: `docs(ai): define unproductive run path process`

### AIRUN-1: Analyse und Reproduktion

Ziel: Den Screenshot-Fall als roten Test in der Run-Bewertung oder TacticalPlan-/Runtime-Schicht abbilden.

Done-Gate:

- Fokussierter Test beschreibt R&D mit sichtbarem Trace-5-End-Run-/Run-Lock-ICE, Runner 4 Credits, keine Trace-/Breaker-Antwort.
- Test zeigt, dass der Pfad vor dem Fix als zu attraktiv gilt oder nicht gegen Economy/Alternativen verliert.
- Verantwortlicher Bewertungspfad ist im Testnamen oder Kommentar benannt.

Commit: `test(ai): reproduce unproductive trace run start`

### AIRUN-2: Unproductive-Run-Path-Policy

Ziel: Eine side-sichere Policy klassifiziert sichtbare Run-Pfade mit erwartbarem No-Access-/Run-Lock-Ergebnis.

Done-Gate:

- Policy erkennt sichtbare Trace-End-Run-/Run-Lock-Subroutinen, die der Runner weder brechen noch sinnvoll im Trace drehen kann.
- Policy unterscheidet harte No-Access-Fälle, riskante aber sinnvolle High-Payoff-Fälle und Unknown-Fälle.
- Pure oder fokussierte Tests decken den Trace-5-/4-Credits-Fall und mindestens einen Gegenfall ab.

Commit: `fix(ai): suppress unproductive visible trace run paths`

### AIRUN-3: Bewertungsintegration

Ziel: RunTargetEvaluation, TacticalPlans und Semantic-Ranking nutzen die Policy vor der Run-Auswahl.

Done-Gate:

- Der Screenshot-Fall wird nicht mehr als Top-Run oder fortgeführter Plan ausgewählt.
- RunTarget-Evidence enthält klare Marker wie `unproductive_visible_run_path` und `visible_trace_end_run_lock_unavoidable`.
- Keine sinnvollen Runs mit Agenda-/Score-/Closeout-Payoff werden pauschal blockiert.

Commit: `fix(ai): suppress unproductive visible trace run paths`

### AIRUN-4: Randfälle und Debug-Evidence

Ziel: Strategie für unnütze Run-Konstellationen stabilisieren und in Tests dokumentieren.

Mindestens prüfen:

- sichtbare harte End-the-run-/Trace-Run-Lock-Pfade ohne Antwort;
- bezahlbare oder brechbare Trace-Pfade bleiben möglich;
- unbekannte oder verdeckte ICE-Pfade bleiben nicht hart blockiert;
- High-Payoff-Ausnahmen wie bekannte Agenda oder unmittelbarer Sieg bleiben kontrolliert möglich, wenn der Pfad erreichbar ist;
- Debug/Evidence bleibt redigiert.

Commit: `fix(ai): suppress unproductive visible trace run paths`

### AIRUN-5: Abschluss, Dokumentation und Integration

Ziel: Ergebnis dokumentieren, final prüfen, lokal nach `main` integrieren.

Finale Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run <betroffene AI-Testdateien> --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`
- `git status --short`

Commit: `docs(ai): record unproductive run path fix`

Abschlussbericht: `docs/reviews/ai/ai-unproductive-run-path-evaluation-final-report-2026-06-22.md`

## Sicherheitsblocker

Stoppen und Blocker-Report schreiben, wenn der Fix eine Engine-Regeländerung, neue LegalAction-Erzeugung, FullState-Zugriff, Hidden-Info-Ausweitung oder nicht redigierbare Debug-Felder verlangen würde.

## Abschlusskriterien

- Der konkrete Screenshot-Fall ist als Test abgedeckt.
- Die Runner-KI startet den sichtbaren Trace-5-/Run-Lock-R&D-Pfad ohne Antwort nicht mehr als sinnvollen Druck-Run.
- Sinnvolle Runs bleiben möglich.
- Keine Engine-/LegalAction-/StateHash-/Randomness-/Hidden-Info-Vertragsänderung.
- Jeder Paketstand ist committed.
- Arbeitsbranch ist lokal nach `main` integriert und der Worktree entfernt.
