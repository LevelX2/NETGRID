# KI-Choice-Follow-up für Match 424A (2026-07-15)

Status: P0 und P1 abgeschlossen; P2 aktiv; P3 bis P5 offen

## Quelle und `/Goal`

Quelle ist das abgeschlossene Match `match_424abdd1c7ac054d` aus der lokalen
SQLite-Runtime. Die vollständige erneute Entscheidungsprüfung hat zwei weitere
Runner-Fehler ergeben:

1. Decision 51 / StateVersion 91 und Decision 118 / StateVersion 216 lassen
   sichtbare, legale und kostenlose Force-Shield-Schadensverhinderung mit
   `pass` aus.
2. Decision 93 / StateVersion 162 verwirft Forged Activation Orders und Inside
   Job, obwohl der Runner zugleich redundante Handkopien von bereits
   installierten oder mehrfach vorhandenen Werkzeugen hält.

`/Goal`: Die drei freigegebenen historischen Entscheidungen zuerst auf dem
unveränderten aktuellen KI-Code als spielgleiche rote Decision-Checkpoints
sichern, ihre korrekten KI-Hints bestätigen, die generischen Choice- und
Discard-Consumer unter Nutzung der vorhandenen KI-Mechanismen korrigieren, die
unveränderten Checkpoints und Gegenproben grün verifizieren, dokumentieren,
lokal nach `main` integrieren und Worktree sowie Branch verifiziert entfernen.

- Arbeitsbranch: `codex/ai-match-424a-choice-followup`
- Worktree: `C:\Projekte\NETGRID_AI_MATCH_424A_CHOICE_FOLLOWUP`
- Ausgangs-`main`: `7e8ba8c1198037f3dd4f9f89ecd996fece74bbeb`
- Hauptworkspace: nur für den finalen lokalen Merge
- Push oder Pull Request: nicht Teil dieses Prozesses

## Scope, Annahmen und Nicht-Ziele

- D51 und D118 verwenden nur die damalige Runner-PlayerView, LegalActions,
  öffentlichen Events und erlaubten Runtime-Metadaten.
- D93 bewertet sichtbare Kartenrollen, bereits installierte Definitionen,
  Mehrfachkopien, aktuellen MU-Bedarf und den sichtbaren Pfadkontext.
- Die bestehenden Force-Shield-, SeeYa-, Forged-Activation-Orders-,
  Inside-Job-, WuTech- und Junkyard-Hints werden nicht geändert, sofern die
  reproduzierten Hint-Verträge korrekt sind.
- Es gibt keine Match-, Seed-, Deck-, Karteninstanz- oder Decision-Sonderregel.
- Engine-Legalität, Kartentexte, Replay, StateHash, Zufall und Hidden-Info-
  Grenzen bleiben unverändert.
- Der Prozess startet keine zusätzlichen Matches oder Selfplays; die Evidence
  stammt aus dem gespeicherten Match, spielgleichen Checkpoints und
  fokussierten Regressionstests.

## Invarianten und Fehlerbehandlung

- Rules Engine und `LegalActions` bleiben alleinige Regelautorität.
- Vor jeder Produktionsänderung muss der zugehörige historische Checkpoint auf
  unverändertem KI-Code ausschließlich als `behavior_regression` rot sein.
- `engine_legality_drift`, `runtime_state_drift`, Warmup-Drift oder
  Redaction-Probleme sind Infrastrukturfehler und kein fachlicher Red-Nachweis.
- Bereits grüne Zielentscheidungen werden als Nicht-Fix dokumentiert.
- Die Checkpoint-Erwartung wird nach dem Red-Nachweis nicht abgeschwächt.
- Schadensverhinderung darf nicht pauschal Ressourcen ausgeben, wenn kein
  vermeidbarer Schaden vorliegt oder eine relevante Zukunftsreserve sichtbar
  wichtiger ist.
- Discard-Bewertung darf einzigartige, aktuell benötigte Setup-, Pfad- oder
  Ökonomiewerkzeuge nicht pauschal gegenüber beliebigen Duplikaten bevorzugen.
- Fehlt eine notwendige LegalAction oder erfordert eine Lösung verdeckte
  Korp-Informationen, ist das Paket blockiert.
- Genau ein Paket ist aktiv; jedes abgeschlossene Paket erhält einen eigenen
  lokalen Commit.

State Machine:

`preflight -> process_committed -> red_evidence_committed -> prevention_fixed -> discard_fixed -> verified -> documented -> merged -> cleaned`

## Paketfolge

### P0 – Preflight, Worktree und Prozessbindung

- Ziel: Scope, `/Goal`, Invarianten, Branch und Worktree versionieren.
- Checks: Worktree-/Branch-Kollisionen ausgeschlossen, `git diff --check`,
  sauberer Paketcommit.
- Done-Gate: Dieses Artefakt ist auf dem dokumentierten Ausgangsstand
  committed.
- Commit: `docs(ai): start match 424a choice follow-up`

### P1 – Spielgleiche rote Checkpoints und Gegenproben

- Ziel: D51, D118 und D93 mit dem offiziellen Capture-Pfad aus der lokalen
  SQLite-Datenbank sichern.
- Erwartungen:
  - D51 wählt die kostenlose Force-Shield-Option statt `pass`.
  - D118 wählt eine der legalen Force-Shield-Optionen statt `pass`.
  - D93 behält die einzigartigen sichtbaren Pfadwerkzeuge und verwirft
    mindestens die redundante SeeYa-Handkopie sowie weitere im damaligen
    Kontext schwächere Mehrfachkopien.
- Gegenproben: Choice ohne vermeidbaren Schaden bleibt bei `pass`; einmalige
  Präventionsressourcen werden nicht ohne Nutzen verbraucht; einzigartige
  MU-Unterstützung und ein aktuell relevanter Setup-/Recovery-Baustein bleiben
  gegenüber entbehrlichen Karten geschützt.
- Done-Gate: Zielverträge sind nur als `behavior_regression` rot oder begründet
  als Nicht-Fix klassifiziert; Gegenproben sind grün; Fixture, Test und
  Red-Evidence sind separat committed.
- Commit: `test(ai): capture match 424a choice regressions`

### P2 – Generische Schadensverhinderungs-Choice

- Ziel: vorhandene `damage_prevention`-Hints und sichtbare
  Event-Modification-Optionen in der Choice-Auswahl nutzen.
- Done-Gate: D51 und D118 sind mit unveränderten Erwartungen grün;
  Gegenproben und angrenzende Choice-/Damage-Tests bleiben grün.
- Commit: `fix(ai): use visible damage prevention choices`

### P3 – Kontextuelle Discard-Redundanz

- Ziel: installierte nichtadditive Runner-Werkzeuge, Handduplikate und
  konkrete Pfadoptionen im bestehenden Discard-Keep-Score korrekt verrechnen.
- Done-Gate: D93 ist mit unveränderter Erwartung grün; MU-, Recovery-,
  Pfadwerkzeug- und allgemeine Discard-Gegenproben bleiben grün.
- Commit: `fix(ai): preserve unique runner path tools on discard`

### P4 – Verifikation, Final Review und Wissenspflege

- Ziel: fokussierte und angrenzende Regressionen, vollständige AI-Typechecks,
  relevante AI-Gates und dauerhafte Dokumentation abschließen.
- Pflichtchecks: neue Checkpoints und Unit-Gegenproben, angrenzende Runtime-
  Tests, `corepack pnpm --filter @netgrid/ai typecheck`, relevante breite
  AI-Tests, `corepack pnpm check:ai` und `git diff --check`.
- Artefakte: Final Review unter `docs/reviews/ai/` sowie aktueller Monatslog,
  sofern der neue Vertrag dauerhaft wissensrelevant ist.
- Done-Gate: Ergebnisse, Grenzen und Nicht-Fixes sind dokumentiert; Worktree
  ist sauber.
- Commit: `docs(ai): close match 424a choice follow-up`

### P5 – Main-Integration und Cleanup

- Ziel: aktuelles `main` defensiv einbinden, final verifizieren, lokal mergen
  und Worktree sowie Arbeitsbranch entfernen.
- Done-Gate: `main` enthält alle Paketcommits; relevante Checks sind nach der
  Integration grün; Worktree-Pfad, Git-Registrierung und Arbeitsbranch
  existieren nicht mehr.

## Controller-Prompt-Kern

Arbeite ausschließlich im Worktree
`C:\Projekte\NETGRID_AI_MATCH_424A_CHOICE_FOLLOWUP` auf Branch
`codex/ai-match-424a-choice-followup`. Arbeite immer nur am aktuellen Paket,
stelle die historischen Verhaltensverträge vor dem jeweiligen Fix fachlich
rot, ändere ihre Erwartungen danach nicht und committe jedes abgeschlossene
Paket separat. Nutze den Hauptworkspace erst für den finalen lokalen Merge.
