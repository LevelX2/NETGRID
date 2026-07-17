# KI-Match-414365: Run-Sicherheit und Kartenrollen (2026-07-17)

Status: P1 abgeschlossen

## Ziel und freigegebener Umfang

Dieses Paket setzt die aus `match_414365c726112bf4` bestätigten
Runner-Entscheidungsfehler generisch um:

1. `Running Interference` ist ein Run-Event, kein Economy-Entwicklungsziel.
2. Ein entfernbarer Data-Raven-Zähler erhält Vorrang, wenn er sonst eine
   automatische nächste Markierung auslöst.
3. Ein Start-Run wird abgelehnt, wenn ein vollständig bekannter, nicht
   überwindbarer Trace-Pfad mit einer verbleibenden Markierungsgefahr zu
   einem vermeidbaren Flatline-Risiko führt.
4. Die Deckfähigkeitsableitung darf `Schematics Search Engine` nicht allein
   wegen Titel oder ID als Tutor behandeln.

`Eurocorpse` gehört nicht zum Deck dieses Matches und wird deshalb nicht als
Spielbefund behandelt. Seine bestehenden Checkpoints bleiben Teil der
Abschlussregression.

## Invarianten und Nicht-Ziele

- Es werden ausschließlich Runner-PlayerView, öffentliche Events und
  LegalActions konsumiert.
- Ein Run gegen unbekanntes erstes ICE bleibt ein legitimer Prüfrun. Diese
  Arbeit unterdrückt weder frühe Informationsruns noch allgemein Remote-Runs.
- Bekannte, bezahlbare oder payoff-starke Pfade bleiben zulässig.
- Die Rules Engine, Kartentext, Hidden-Info-Grenzen und Replay-Mechanik werden
  nicht geändert.
- Kein Push und kein Pull Request.

## Arbeitskontext

- Hauptworkspace: `C:\Projekte\NETGRID`
- Worktree: `C:\Projekte\NETGRID_AI_LAST_MATCH_RUN_SAFETY`
- Branch: `codex/ai-last-match-run-safety`
- Runtime-Datenbank: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Integration: nur lokal nach `main`, anschließend sauberer Worktree-Cleanup.

## Paketfolge

### P0 – Prozess und Preflight

Status: abgeschlossen

- Rollen-, Wissens-, Skill- und Checkpoint-Verträge geprüft.
- Worktree offline und lockfile-fest eingerichtet.
- Scope, Nicht-Ziele und Verify-Gates festgehalten.

Done-Gate: `git diff --check`, separater Prozesscommit.

### P1 – Spielgleiche Evidence und rote Checkpoints

Status: abgeschlossen

- D32: `Running Interference` darf nicht in eine bloße Kreditaktion
  umklassifiziert werden.
- D54: Der vorhandene Data-Raven-Zähler muss vor einer Kreditaktion entfernt
  werden.
- D59: Der bekannte, nicht überwindbare Data-Raven-HQ-Run darf nicht starten.
- D52 beweist als enge Gegenprobe, dass die sofortige Entmarkierung erhalten
  bleibt.
- Alle Captures werden gegen den aktuellen kompatiblen Warmup-Suffix geprüft;
  die bereits integrierte D2-Abweichung wird nur als Infrastrukturdrift
  dokumentiert.

Done-Gate: Zielverletzungen ausschließlich als `behavior_regression`, enge
Gegenprobe grün, Red-Evidence-Commit.

### P2 – Generische Consumer-Korrekturen

Status: in Arbeit

- Rollenpriorität für Run-Events vor Economy-Textsignalen.
- Entfernbare, persistent gefährliche Trace-Zähler in der Aktionswertung.
- Start-Run-Sicherheitsprüfung für bekannte unüberwindbare Trace-Pfade.
- Textuelle Decksuche nur aus tatsächlicher Kartentextsemantik, nicht aus
  Titel oder ID.

Done-Gate: unveränderte Checkpoints und eng verbundene Unit-Tests grün.

### P3 – Breite Verifikation und Abschluss

Status: offen

- Decision-Checkpoints, Eurocorpse-, Portfolio-, Runner-Run- und
  Deckfähigkeitsregressionen ausführen.
- AI-Typecheck, geeignete AI-Suite und `git diff --check` dokumentieren.
- Evidence, Final-Report und Monatslog nachziehen.
- Aktuelles `main` defensiv integrieren, lokal mergen und Worktree/Branch
  nach verifiziertem Erfolg entfernen.

## Stoppregeln

- Warmup-, Engine-, LegalAction-, Replay- oder Redaction-Drift ist kein
  KI-Befund und wird vor einem Fix getrennt behandelt.
- Eine Lösung, die verborgene Kartenkenntnis oder nicht legale Aktionen
  erfordert, blockiert den Prozess.
- Neue breite Regressionen werden auf den kleinsten verletzten Vertrag
  zurückgeführt, bevor der Prozess fortgesetzt wird.

## Abschlusskriterien

- Die drei historischen Fehlentscheidungen sind dauerhaft spielgleich
  abgesichert; der Prüfrun-Gegenvertrag bleibt grün.
- Die Korrekturen sind generisch, side-safe und verändern keine Engine-Regeln.
- Die Schematics-Suche ist durch einen Daten-/Consumer-Vertrag abgesichert.
- Eurocorpse und die weiche Portfolio-Kadenz regressieren nicht.
- Alle Paketcommits liegen lokal auf `main`; der Arbeitsworktree ist entfernt.
