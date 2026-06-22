# AI Trace Planner Strength Loop

Status: prepared_for_execution

Datum: 2026-06-22

## Quelle und Vorgabe

Der Nutzer hat nach AI-PS3 die größere Trace-/Planner-Analyse als nächste
Optimierungsschleife beauftragt. Die Schleife soll jeweils einen Planungsteil
und einen Umsetzungsteil haben und enden, sobald kein klares Potential mehr
sichtbar ist.

## Zielprüfung

Die Vorgabe ist ausreichend präzise, wenn `kein Potential mehr` operativ
begrenzt wird:

- Eine Iteration braucht eine konkrete, aus Trace-Daten belegte
  Fehlpräferenz oder Planner-Lücke.
- Umsetzung ist nur erlaubt, wenn sie ausschließlich vorhandene
  Engine-`LegalActions` anders priorisiert oder besser diagnostiziert.
- Kandidaten werden nicht übernommen, wenn sie nur synthetische Tests
  verbessern oder im gepaarten Gate keinen Nutzen zeigen.
- Der Prozess endet nach maximal zwei Umsetzungskandidaten oder früher bei
  `no_clear_low_risk_potential`.

## Gesamtziel

Aus den Selfplay-Traces und Planner-/Runtime-Diagnosen nach PS3 eine konkrete
Spielstärkeverbesserung ableiten, kontrolliert umsetzen und gegen Baseline
gaten. Falls die Traces keinen belastbaren Low-Risk-Hebel zeigen, wird das als
No-Potential-Abschluss dokumentiert.

## Annahmen

- `main` ist lokaler Integrationsbranch.
- Worktree: `C:\Projekte\NETGRID_AI_TRACE_PLANNER_STRENGTH_LOOP`.
- Branch: `codex/ai-trace-planner-strength-loop`.
- PS2/PS3 und der Runtime-Tactical-Boundary-Stand liegen lokal auf `main`.
- Bestehende Runner werden bevorzugt wiederverwendet:
  `scripts/run-ai-selfplay-trace-matrix.ts` und
  `scripts/run-ai-ps2-play-strength-gate.ts`.
- Kein Push ohne separaten Nutzerauftrag.

## Nicht-Ziele

- Kein globaler Default-Cutover.
- Keine Engine-, `applyAction`-, Replay-, StateHash- oder Randomness-Änderung.
- Keine Erzeugung oder Mutation von LegalActions.
- Keine Hidden-Info-Erweiterung.
- Keine neue Kartenfreigabe.
- Kein breites Weight-Tuning ohne Trace-Beleg.
- Kein Rewrite der AI-Fassade.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- KI wählt ausschließlich aus Engine-`LegalActions`.
- Planner, Runtime und Overlay dürfen nur side-safe Daten aus
  `AiDecisionInput`, legalen Action-Metadaten, öffentlichen PlayerViews und
  bestehenden redigierten Diagnosen nutzen.
- Trace-Ausgaben bleiben Analyseartefakte und dürfen keine verdeckten
  Kartendaten leaken.
- Ein Kandidat bleibt opt-in oder lokal begrenzt, solange kein separates
  Default-Gate beauftragt ist.

## Automatische Fehlerbehandlung

- Rote Tests werden nur im aktiven Paket debuggt.
- Ein Safety-Verstoß stoppt die Schleife mit Blocker-Report.
- Ein Kandidat ohne praktischen Gate-Nutzen wird verworfen.
- Wenn Traces nur widersprüchliche oder setupabhängige Signale zeigen, endet
  die Schleife mit `no_clear_low_risk_potential`.

## Sicherheitsblocker

- `illegalActions > 0`.
- `replayFailures > 0`.
- `redactionSafe !== true`.
- Kandidat braucht verdeckte Kartendaten.
- Kandidat erzeugt LegalActions oder verändert Engine-Regeln.
- Candidate verschlechtert ohne kompensierenden Fortschritt beide Seiten in
  Action-Limits oder Agenda-Fortschritt.

## State Machine

1. `prepared_for_execution`
2. `TRACE-PLANNER-0`
3. `package_done:TRACE-PLANNER-0`
4. `TRACE-PLANNER-1`
5. `package_done:TRACE-PLANNER-1`
6. `TRACE-PLANNER-2`
7. `package_done:TRACE-PLANNER-2`
8. `TRACE-PLANNER-3`
9. `final_no_potential_or_gate`
10. `final_green`
11. `merged_to_main`
12. `complete`
13. `blocked:<reason>`

## Paketfolge

1. `TRACE-PLANNER-0` Prozess- und Baseline-Setup
2. `TRACE-PLANNER-1` Trace-Planning-Gate mit Action-Alternativen
3. `TRACE-PLANNER-2` Umsetzung eines belegten Planner-/Runtime-Kandidaten
4. `TRACE-PLANNER-3` Gate-Review und zweite Iterationsentscheidung
5. `FINAL-GREEN` Verifikation, lokaler Merge und Worktree-Cleanup

## Paketdetails

### TRACE-PLANNER-0 Prozess- und Baseline-Setup

Ziel: Eigenen Worktree, Prozessartefakt und Ausgangschecks festhalten.

Arbeit:

- Prozessartefakt erstellen.
- Aktuellen Branch, Worktree und Basisstand prüfen.
- Vorhandene Trace- und Gate-Runner identifizieren.

Checks:

- `git status --short`
- `git diff --check`

Done-Gate:

- Prozessartefakt liegt vor.
- Worktree/Branch sind dokumentiert.
- Commit: `docs(ai): plan trace planner strength loop`

### TRACE-PLANNER-1 Trace-Planning-Gate

Ziel: Über Selfplay-Traces mit Action-Alternativen feststellen, ob eine
konkrete Planner-Fehlpräferenz sichtbar ist.

Arbeit:

- Trace-Matrix für Pair A-D mit Action-Alternativen ausführen.
- Fokus auf Action-Limit-Cluster, wiederholte passiv/progressarme Aktionen,
  verpasste Score-/Steal-/Run-Fortschritte und Planner-Mapping prüfen.
- Genau einen Kandidaten auswählen oder No-Potential begründen.

Checks:

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai-trace-planner-strength-loop-planning-gate-2026-06-22.json --pairs a,b,c,d --max-actions 160 --include-action-alternatives --max-alternatives-per-finding 8`
- `git diff --check`

Done-Gate:

- JSON-Trace und Markdown-Review liegen vor.
- Entscheidung: `implement_candidate` oder `no_clear_low_risk_potential`.
- Commit: `test(ai): trace planner strength planning gate`

### TRACE-PLANNER-2 Umsetzung

Ziel: Falls TRACE-PLANNER-1 einen belastbaren Hebel findet, genau diesen eng
umsetzen.

Arbeit:

- Betroffenen Planner-/Runtime-Pfad minimal ändern.
- Fokussierten Unit-Test oder Benchmark-Fall ergänzen.
- Kein Hidden-Info-, Engine- oder LegalAction-Vertrag ändern.

Checks:

- Relevante fokussierte Vitest-Dateien
- `corepack pnpm --filter @netgrid/ai typecheck`
- kleiner Gate-Lauf
- `git diff --check`

Done-Gate:

- Tests grün.
- Safety grün.
- Kandidat hat praktischen Gate-Nutzen oder wird verworfen.
- Commit: `feat(ai): improve trace planner candidate` oder
  `docs(ai): close trace planner no-potential review`

### TRACE-PLANNER-3 Gate-Review und Restpotential

Ziel: Wirkung gegen PS2/PS3-Baseline prüfen und entscheiden, ob eine zweite
Iteration gerechtfertigt ist.

Arbeit:

- Breiten PS2-Gate-Lauf und/oder Trace-Matrix nach Umsetzung ausführen.
- Vorher/Nachher vergleichen.
- Bei weiterem klaren Kandidaten TRACE-PLANNER-2 einmal wiederholen; sonst
  No-Potential-Abschluss schreiben.

Checks:

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-ps2-play-strength-gate.ts --out docs/reviews/ai/ai-trace-planner-strength-loop-final-gate-2026-06-22.json --pairs a,b,c,d --max-actions 160`
- `git diff --check`

Done-Gate:

- Gate-Entscheidung dokumentiert.
- Kein klares Low-Risk-Potential bleibt undokumentiert.
- Commit: `test(ai): gate trace planner strength loop`

### FINAL-GREEN

Ziel: Arbeitsbranch vollständig verifizieren, lokal nach `main` mergen und
Worktree entfernen.

Checks:

- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`
- `git status --short`

Done-Gate:

- Arbeitsbranch sauber.
- Lokal nach `main` integriert.
- Hauptworkspace sauber.
- Worktree entfernt.
- Goal erst danach complete.

## Verifikationsregeln

- Jede Codeänderung braucht fokussierte Tests.
- Jedes Gate braucht JSON- und Markdown-Nachweis.
- `git diff --check` läuft vor jedem Commit.
- Nicht ausgeführte Checks werden begründet.

## Worktree-, Git- und Integrationsregeln

- Branch: `codex/ai-trace-planner-strength-loop`
- Worktree: `C:\Projekte\NETGRID_AI_TRACE_PLANNER_STRENGTH_LOOP`
- Umsetzung ausschließlich im Worktree.
- Hauptworkspace nur für finalen Merge.
- Kein Push ohne separaten Nutzerauftrag.

## Controller-Prompt-Kern

```text
/Goal Arbeite AI Trace Planner Strength Loop vollständig und sequenziell von
TRACE-PLANNER-0 bis TRACE-PLANNER-3 plus FINAL-GREEN ab und merge den
abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, agents/release-implementation-agent.md
und dieses Prozessartefakt. Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_AI_TRACE_PLANNER_STRENGTH_LOOP auf Branch
codex/ai-trace-planner-strength-loop. Nutze den Hauptworkspace nur für den
finalen Merge. Jede Iteration besteht aus Trace-Planung, Umsetzung nur bei
konkretem LegalAction-Hebel, Gate-Review und Stop-/Weiter-Entscheidung. Stelle
keine Zwischenfragen, solange konservative Fortsetzung möglich ist. Bei
Safety-Blocker oder fehlendem klaren Low-Risk-Potential: dokumentieren,
stoppen, final verifizieren und integrieren.
```

## Abschlusskriterien

- Mindestens ein Trace-Planning-Gate mit Action-Alternativen wurde ausgeführt.
- Jede sichtbare Low-Risk-Hypothese wurde umgesetzt oder als nicht tragfähig
  begründet.
- Safety-Gates bleiben grün oder blockieren die Übernahme.
- Kein weiteres klares, enges Potential bleibt sichtbar.
- Branch ist lokal nach `main` integriert und Worktree entfernt.
