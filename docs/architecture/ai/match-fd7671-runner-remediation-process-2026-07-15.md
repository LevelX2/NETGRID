# Match FD7671: Runner-KI-Remediation – Prozess 2026-07-15

## Status

Freigegeben und in Umsetzung.

## Quelle und Zielprüfung

Quelle ist die zugweise Analyse von `match_fd7671d270e1a716` (Runner-KI,
Schwierigkeit Hard). Die fünf bestätigten Funde, ihre historischen
Entscheidungen und die erwarteten Endzustände sind hinreichend bestimmt.

## Gesamtziel

Die Runner-KI soll im gegnerischen Matchpoint einen bezahlbaren Run-Lock lösen,
SeeYa auf ein tatsächlich wertvolles noch nicht exponiertes Ziel richten,
einen Tutor ohne konkrete Suchlücke nicht durch einen absoluten Plan erzwingen,
ihre Run-Reserve nicht für einen zentralen Ökonomie-Trash verbrauchen und Rex
mit korrekten Run-Lock- statt Tag-Hints bewerten. Alle Änderungen bleiben
seiten-sicher, kartengenerisch und durch historische sowie synthetische
Gegenbeispiele abgesichert.

## Annahmen

- Der historische SQLite-Stand bleibt unverändert und dient ausschließlich als
  Read-only-Evidence.
- Ein erster Check-Run ohne vorinstallierten Breaker bleibt zulässig und wird
  nicht durch Tutor- oder Installationszwang verdrängt.
- Der Rex-Fund ist ein Hint-Vertragsfehler. Da die Corp-Seite im Quellspiel
  menschlich war, wird er mit einem Daten-/Consumer-Vertragstest statt mit
  einer erfundenen Corp-KI-Entscheidung belegt.
- Alte Expose-Events ohne exakte Position dürfen nur konservativ ausgewertet
  werden; neue Events nutzen Server, Bereich und Index.

## Nicht-Ziele

- Keine Änderung der Engine-Regeln oder LegalActions.
- Keine Karten-ID-Sonderlogik für SeeYa, Mantis, Rockerboy oder Rex.
- Keine erneute Korrektur bereits geklärter Entscheidungen wie frühem
  Check-Run, Inside-Job-Bypass, unmöglichem Trace-Bid oder Fall-Guy ohne Tags.
- Kein Push und keine Remote-Integration.

## Controller-Invarianten

- Genau ein Paket ist aktiv; kein Paket wird übersprungen.
- Vor dem ersten Fix liegen rote historische Checkpoints beziehungsweise der
  begründete rote Hint-Vertrag vor.
- Checkpoint-Rot muss `behavior_regression` sein, kein Infrastrukturdrift.
- Jeder Fix wird gegen einen positiven und einen negativen Kontrollfall
  geprüft.
- Die KI verarbeitet nur PlayerView, seiten-sichere Events und LegalActions.
- Hint-Änderungen gelten erst nach Prüfung der tatsächlichen Consumer-,
  Compiler-, Plan- und Arbitration-Kette als abgeschlossen.

## Automatische Fehlerbehandlung und Sicherheitsblocker

Infrastrukturdrift, nicht reproduzierbare historische Zustände, Hidden-Info-
Abhängigkeiten oder ein Konflikt zweier aktueller Verträge stoppen das Paket.
Normale Testfehler werden eng im aktiven Paket behoben. Fremde Änderungen
werden nicht verworfen.

## State Machine

`PREPARED -> RED_EVIDENCE -> RUN_EXPOSE_FIXED -> PLAN_ECONOMY_FIXED ->`
`HINT_FIXED -> SKILL_UPDATED -> LATEST_MATCH_REVIEWED -> VERIFIED -> MERGED -> CLEANED`

## Paketfolge

### P0 – Prozess und Red Evidence

- Historische Checkpoints für Decision 132 (Run-Lock), Decision 135
  (SeeYa-Ziel), Decision 53 (Tutorplan) und Decision 102
  (zentraler Trash) aufnehmen.
- Rex-Hint als roten Daten-/Consumer-Vertrag erfassen.
- Nur `behavior_regression` als gültiges Rot akzeptieren.
- Done-Gate: reproduzierbare rote Evidence, eigener Commit.
- Commit: `test(ai): capture match fd7671 red evidence`

### P1 – Run-Lock und Expose-Zielwahl

- Bezahlen zum Lösen eines Run-Locks anhand realer Folgerun-Chancen und
  Matchpoint-Druck bewerten.
- Installed-Card-Expose-Ziele nach sichtbarem strategischem Wert und bisheriger
  exakter Exposition ordnen.
- Wiederholte Aktivierungen ohne verbleibendes wertvolles Ziel abwerten.
- Kontrollen: kein erzwungenes Lösen ohne Folgerun; konservativer Umgang mit
  alten Events; kein erneutes Wählen derselben exakten Position.
- Commit: `fix(ai): convert run lock and expose opportunities`

### P2 – Planarbitration und Run-Reserve

- Einen `play_best_hand_card`-/Entwicklungsplan bei einem negativ bewerteten
  Tutor ohne Suchbedarf gegen eine konkrete positive Aktion ausspielen lassen.
- Im gegnerischen Matchpoint die Reserve für einen weiteren Run gegen
  zentralen Ökonomie-Trash schützen; mit echtem Überschuss bleibt Trash legal
  und attraktiv.
- Kontrollen: Tutor bei realer Coverage-Lücke; Trash bei ausreichender Reserve.
- Commit: `fix(ai): protect runner matchpoint conversion`

### P3 – Rex-Hint und Consumer-Kette

- Aktiven Rex-Hint von Tag-Druck auf Trace, End-the-run und Run-Lock umstellen.
- Aktive Quelle, generiertes Artefakt, Runtime-Consumer, Planbeiträge und
  Arbitration auf dieselbe Semantik prüfen.
- Done-Gate: Vertrags- und Generierungstests grün.
- Commit: `fix(ai): align rex run lock hints`

### P4 – Analyse-Skill erweitern

- Den Skill um die hier bestätigten Prüfschritte ergänzen: Entscheidung für
  Entscheidung, Hint-Quelle bis Arbitration, Choice-Consumer, wiederholte
  Ziele, Freischaltaktionen und Reservekosten.
- Commit: `docs(skill): deepen netgrid ai match audit`

### P5 – Neues letztes Spiel analysieren

- Nach allen Fixes das dann zuletzt beendete Spiel mit dem aktualisierten Skill
  vollständig und zugweise prüfen.
- Neue Funde nur dokumentieren; keine stillschweigende Scope-Erweiterung.
- Commit: `docs(ai): review latest match after fd7671 fixes`

### P6 – Abschluss

- Fokuschecks, vollständige relevante AI-Checks, Typecheck, `git diff --check`
  und Wissenslog ausführen.
- Aktuelles `main` integrieren, erneut prüfen, lokal per Fast-forward mergen.
- Worktree und gemergten Branch entfernen und doppelt verifizieren.

## Verifikationsregeln

- Historische Checkpoints werden isoliert und gemeinsam ausgeführt.
- Targeted Vitest deckt Score, Choice, Planarbitration und Hint-Vertrag ab.
- Die Checkpoint-Erwartung prüft die fachlich richtige Aktionsklasse; Controls
  verhindern zu breite Matchpoint- oder Kartenheuristiken.
- Mindestens AI-Typecheck, relevante Hint-Generierung/Validierung und
  `git diff --check` sind Pflicht.

## Worktree-, Git- und Integrationsregeln

- Arbeitsworktree:
  `C:\Projekte\NETGRID_AI_MATCH_FD7671_REMEDIATION`
- Arbeitsbranch: `codex/ai-match-fd7671-remediation`
- Hauptworkspace nur für den finalen lokalen Merge.
- Jedes Paket endet mit Checks, Dokumentation und eigenem Commit.
- Kein Push, kein Pull Request.

## Controller-Prompt-Kern

`/Goal Arbeite Match FD7671 Runner-KI-Remediation vollständig und sequenziell`
`von P0 bis P6 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.`
`Arbeite ausschließlich im festgelegten Worktree, sichere Red Evidence vor`
`Fixes, stelle keine Zwischenfragen bei konservativ lösbaren Details, committe`
`jedes Paket und markiere das Ziel erst nach verifiziertem Merge sowie Worktree-`
`und Branch-Cleanup als vollständig.`

## Abschlusskriterien

- Alle fünf freigegebenen Funde sind belegt und generisch behoben.
- Historische Fehlerfälle und Gegenbeispiele sind grün.
- Der Analyse-Skill enthält die neuen Audit-Prüfschritte.
- Das danach letzte beendete Spiel ist mit dem aktualisierten Skill analysiert.
- `main` ist sauber, der Arbeitsstand lokal integriert und der temporäre
  Worktree samt Branch entfernt.
