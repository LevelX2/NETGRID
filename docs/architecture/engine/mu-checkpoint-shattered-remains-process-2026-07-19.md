# MU-Checkpoint nach Verlust von Runner-Memory

Status: abgeschlossen

## Quelle und Zielprüfung

Ausgangspunkt ist der reproduzierte Playtest-Fund im gespeicherten Match
`match_c34a3b1bd4f5e697`: Nach dem Rezzen von `Corprunner's Shattered Remains`
bleibt nur ein redundanter Rez-Pass übrig. Beim anschließenden Zugriff zerstört
die Karte einen `WuTech Mem Chip`; die effektive Runner-MU fällt von 5 auf 4,
während Programme mit 5 MU installiert sind. Die von der Engine angebotene
LegalAction `access_card` wird anschließend durch die globale
`Runner memory limit exceeded`-Invariante abgelehnt.

Die Vorgabe ist präzise. Comprehensive Rules 3.9.3c und 10.3.1e verlangen beim
nächsten Checkpoint den Trash einer geeigneten minimalen Menge installierter
Programme. Der erwartete Endzustand, die betroffenen Engine-/KI-Grenzen und die
notwendigen Regressionen sind bestimmbar.

## Gesamtziel

Die Engine löst eine nachträgliche MU-Überschreitung regelkonform über eine
verpflichtende, Runner-private Checkpoint-Choice auf. Der Runner beziehungsweise
die Runner-KI trasht genau eine geeignete minimale Programmmenge; danach wird
der unterbrochene Spielablauf fortgesetzt. Ein Root-Rez-Fenster schließt nach
einem Rez automatisch, wenn keine weitere echte Korp-Aktion außer dem Pass
existiert.

## Annahmen und Nicht-Ziele

- Die Checkpoint-Choice betrifft nur nachträgliche MU-Überschreitungen; der
  bestehende Trash-vor-Install-Vertrag bleibt unverändert.
- Eine Auswahl ist geeignet, wenn sie das MU-Limit wieder einhält, und minimal,
  wenn keine ausgewählte Karte entfallen kann, ohne das Limit erneut zu
  überschreiten.
- Mehrere weitere Rez-/Fort-Aktionen bleiben möglich; nur ein tatsächlich
  leeres Restfenster wird automatisch geschlossen.
- Keine Änderung an Kartentext, Kartenpool, Rez-Kosten, Access-Trashkosten oder
  allgemeiner KI-Strategie.
- Keine Migration alter Replays oder Runtime-Daten; das abgelehnte Live-Match
  bleibt unverändert fortsetzbar.

## Controller-Invarianten und Sicherheitsblocker

- Die Rules Engine bleibt einzige Regelautorität; `applyAction` revalidiert
  Side, StateVersion, Choice, installierte Ziele und MU erneut.
- Der temporäre Über-MU-Zustand ist ausschließlich während der eng typisierten
  Checkpoint-Choice zulässig.
- Choice und Zielkarten sind nur für den Runner sichtbar; PublicEvents und
  Gegner-PlayerView leaken keine privaten Daten.
- Replay, StateHash und deterministische KI-Auswahl bleiben stabil.
- Bei Hidden-Info-Leak, nicht deterministischer Auswahl, unauflösbarer
  Fortsetzung oder einer notwendigen Aufweichung der allgemeinen Invariante
  stoppt der Prozess mit Blocker-Report und Removal Condition.

## Automatische Fehlerbehandlung

Rote Tests werden im aktiven Paket eng diagnostiziert und behoben. Findings
außerhalb des beschriebenen MU-/Rez-Vertrags werden als Follow-up dokumentiert
und erweitern den Scope nicht still. Konflikte mit weitergelaufenem `main`
werden so gelöst, dass kompatible Intentionen erhalten bleiben.

## State Machine

`PREPARED -> RED_CONTRACT -> ENGINE_FIXED -> AI_FIXED -> VERIFIED -> MERGED -> CLEANED`

## Paketfolge

### P0 – Prozess, Goal und Worktree

- Ziel: kontrollierte Ausführungsgrundlage schaffen.
- Kernartefakt: dieses Prozessdokument.
- Checks: Worktree-/Branch-Prüfung, `git diff --check`.
- Done-Gate: eigener sauberer Worktree; Prozessartefakt committed.
- Commit: `docs: define MU checkpoint remediation process`.

### P1 – Rote Regel- und Livefall-Regressionen

- Ziel: beide Nutzerbeobachtungen vor der Produktionsänderung rot belegen.
- Arbeit: Shattered-Remains-/WuTech-Fall mit 5/5 MU; verpflichtende minimale
  Runner-Choice; Access-Fortsetzung; leerer Root-Rez-Restpass.
- Negative Verträge: falsche Seite, stale Choice, ungenügende und nicht
  minimale Auswahl.
- Checks: fokussierte Engine-Tests, `git diff --check`.
- Done-Gate: Tests scheitern ausschließlich an den dokumentierten Lücken.
- Commit: `test(engine): reproduce post-memory-loss checkpoint failure`.

### P2 – Engine-Korrektur

- Ziel: generischen Checkpoint-Vertrag und Rez-Autofortsetzung umsetzen.
- Arbeit: reine MU-Choice-/Resolver-Komponente; zentraler Check nach Actions;
  eng begrenzte Validierungs-Ausnahme während der Choice; PendingChoice-Routing;
  automatisches Schließen leerer Root-Rez-Restfenster.
- Checks: P1-Tests, betroffene bestehende Engine-Tests, Engine-Typecheck,
  `git diff --check`.
- Done-Gate: P1 und bestehende Rez-/Access-/MU-Regressionen sind grün.
- Commit: `fix(engine): resolve memory overage at checkpoints`.

### P3 – Runner-KI-Auflösung

- Ziel: die verpflichtende Choice minimal und spielwertorientiert auflösen.
- Arbeit: eigene Choice-Erkennung; Auswahl einer ausreichenden minimalen Menge
  über bestehende Programmsacrifice-Bewertung; side-sichere Tests.
- Checks: fokussierte AI-Tests, AI-Typecheck, Engine-/AI-Integrationsfall,
  `git diff --check`.
- Done-Gate: Die KI wählt nicht pauschal alle Programme und erzeugt eine von
  der Engine akzeptierte minimale Auswahl.
- Commit: `fix(ai): choose minimal checkpoint memory cleanup`.

### P4 – Abschluss und Verifikation

- Ziel: belastbaren Abschlussstand und Wissen zurückführen.
- Arbeit: Final Review und Projektlog; Replay-/StateHash-/Visibility-/stale-
  Regressionen; relevante breite Paketchecks.
- Checks mindestens: Engine- und AI-Typecheck, fokussierte Tests, vollständige
  Engine-Suite, relevante AI-Suite, `git diff --check`.
- Done-Gate: alle Pflichtchecks grün oder vorbestehende Abweichungen präzise
  belegt; Arbeitsbranch sauber.
- Commit: `docs: close MU checkpoint remediation`.

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_MU_CHECKPOINT_SHATTERED_REMAINS`
- Branch: `codex/mu-checkpoint-shattered-remains`
- Hauptworkspace: `C:\Projekte\NETGRID`, nur für den finalen lokalen Merge.
- Jedes Paket erhält einen eigenen Commit.
- Vor dem Merge wird aktuelles `main` in den Arbeitsbranch integriert und die
  relevante Verifikation wiederholt.
- Danach bevorzugt Fast-forward nach `main`; kein Push und kein Pull Request.
- Nach erfolgreichem Merge werden Worktree und vollständig gemergter Branch
  ohne Force entfernt und doppelt verifiziert.

## Controller-Prompt-Kern

`/Goal Arbeite den Prozess MU-Checkpoint nach Verlust von Runner-Memory
vollständig und sequenziell von P0 bis P4 ab und merge den abgeschlossenen
Arbeitsbranch lokal nach main. Lies AGENTS.md, AGENTS.local.md, die wiki-first
Pflichtseiten, agents/release-implementation-agent.md, packages/engine/AGENTS.md,
packages/ai/AGENTS.md und dieses Prozessartefakt. Arbeite ausschließlich im
Worktree C:\Projekte\NETGRID_MU_CHECKPOINT_SHATTERED_REMAINS auf Branch
codex/mu-checkpoint-shattered-remains. Nutze den Hauptworkspace nur für den
finalen Merge. Arbeite immer nur am aktuellen Paket, führe dessen Checks aus
und committe es. Bei Sicherheitsblocker stoppe mit Blocker-Report und Removal
Condition. Nach Abschluss final verifizieren, lokal nach main mergen, main
prüfen, Worktree und gemergten Arbeitsbranch verifiziert entfernen und Goal
erst dann als complete markieren.`

## Abschlusskriterien

- Der gespeicherte Shattered-Remains-/WuTech-Ablauf ist als Regression grün.
- Nachträgliche MU-Überschreitung öffnet eine verpflichtende minimale Choice.
- Runner-KI löst diese Choice legal und wertorientiert auf.
- Ein leeres Root-Rez-Restfenster verlangt keinen zusätzlichen Pass-Klick.
- Visibility, Replay, StateHash, stale und illegal actions sind geschützt.
- Alle Pakete sind committed, lokal nach `main` gemergt und Worktree sowie
  Arbeitsbranch verifiziert entfernt.

## Umsetzungsergebnis

- P0 bis P4 sind fachlich abgeschlossen und als getrennte Paket-Commits
  nachvollziehbar.
- Der Checkpoint öffnet nach nachträglichem Memory-Verlust eine private,
  verpflichtende Runner-Choice und akzeptiert ausschließlich ausreichende,
  einschlussminimale Programmmengen.
- Die Runner-KI verwendet eine eigene deterministische Auswahl, berücksichtigt
  den bestehenden Programmsacrifice-Wert und bleibt auch auflösbar, wenn nur
  kritische Programme verfügbar sind.
- Das Root-Rez-Fenster schließt nach dem letzten tatsächlichen Rez automatisch;
  weitere legale Root-Rez-Aktionen halten es weiterhin offen.
- Der gespeicherte Zustand `match_c34a3b1bd4f5e697` wurde read-only gegen den
  neuen Engine-Stand geprüft: Der zuvor abgelehnte Zugriff erzeugt bei 5/4 MU
  die Runner-Choice mit vier Optionen; die Corp-PlayerView sieht sie nicht.
- Engine-Gesamtsuite, offizielle KI-Shards, beide Typechecks,
  Paketgrenzen, Formatprüfung und `git diff --check` sind grün. Details stehen
  im Final Review.
