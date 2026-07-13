# Manhunt-vs.-Coup-Selfplay-Regressionsprozess (2026-07-13)

Status: P0 bis P6 abgeschlossen; lokal nach `main` integriert, Arbeits-Worktree und Branch entfernt

## Ziel

Die drei freigegebenen Fehlersituationen aus den fünf deterministischen Selfplays mit den exakten Decks des Matches `match_606a546d0ba02826` werden zuerst als spielgleiche Decision-Checkpoints reproduziert. Nur ein auf aktuellem Code fachlich rot laufender Checkpoint legitimiert einen anschließenden generischen KI-Fix. Danach werden die Checkpoints, passende Gegenproben und die breiteren KI-Gates grün abgeschlossen.

`/Goal`: Die drei freigegebenen KI-Fehler aus den fünf Manhunt-vs.-Coup-Selfplays sequenziell im eigenen Worktree zuerst als spielgleiche rote Decision-Checkpoints sichern, danach generisch beheben, vollständig verifizieren, lokal nach `main` integrieren und Worktree sowie Arbeitsbranch sauber entfernen.

Arbeitsbranch: `codex/ai-manhunt-coup-selfplay-regressions` (nach Integration gelöscht)

Worktree: `C:\Projekte\NETGRID_AI_MANHUNT_COUP_SELFPLAY_REGRESSIONS` (nach Integration entfernt)

## Eingefrorene Quelle

- Ausgangsmatch: `match_606a546d0ba02826`
- Runnerdeck: `Mit Ansage: Der perfekte Coup`, Deck-Hash `fnv1a:0ce9ab4d`
- Corpdeck: `Manhunt Pressure Bureau`, Deck-Hash `fnv1a:1e1a582e`
- Profile: auf beiden Seiten `current_candidate`, Schwierigkeit `normal`
- Simulationslimit der Ausgangsläufe: 480 Aktionen
- Seed 001: `manhunt-coup-post-fix-2026-07-13-001`
- Seed 003: `manhunt-coup-post-fix-2026-07-13-003`
- Seed 005: `manhunt-coup-post-fix-2026-07-13-005`

Die zu sichernden Entscheidungspunkte sind:

1. Seed 001, Corp vor Aktion 137: unsichere Agenda-Installation ohne vollständige oder ausreichend geschützte Abschlusslinie.
2. Seed 003, Runner vor Aktion 282: wiederholter Archives-Run mit einem unbekannten Zugang, ohne bekannte Agenda und trotz besserer Nutzung des letzten Klicks.
3. Seed 005, spätes Corp-Endspiel: Entwicklung oder reine Ökonomie trotz unmittelbarer Deckout-Gefahr und noch möglicher Abschlusslinie. Der konkrete Aktionsindex wird aus den gespeicherten Alternativen bestimmt; ohne fachlich bessere legale Alternative entsteht kein künstlicher roter Test und kein Fix.

## Invarianten

- Die Rules Engine und `LegalActions` bleiben alleinige Regelautorität.
- Jeder historische Checkpoint enthält den exakten `GameState`, den für die handelnde Seite redigierten Public-Event-Präfix, Deck-Snapshots, Profil, Seed und den KI-Runtimezustand unmittelbar vor der Entscheidung.
- `engine_legality_drift`, `runtime_state_drift`, Fixture-Migration oder Redaktionsfehler gelten nicht als reproduzierter KI-Fehler.
- Vor dem ersten Verhaltensfix existiert ein eigener Commit, in dem alle belastbaren Fehlersituationen als `behavior_regression` rot sind und ihre Gegenproben grün laufen.
- Die Fixes arbeiten über allgemeine Zustands-, Risiko-, Abschluss- und Opportunitätssignale. Deck-, Match-, Seed- oder Kartennamen werden nicht hart codiert.
- Die vorhandene Planebene bleibt zuständig für langfristige und iterative Ziele. Die neuen Regeln liefern Bewertungs- und Guardrail-Signale und ersetzen keine Planhierarchie.
- Wiederholte Broker-Nutzung ist ausdrücklich nicht Gegenstand dieses Strangs.
- Archives wird nicht allein wegen einer verdeckten Karte attraktiv: erforderlich sind fehlende bessere Aktionen und zusätzlicher Druckkontext, etwa Corp-Deckout, zufällige Abwürfe oder eine anderweitig belastbare Zugangsannahme.

## Pakete

### P0 – Prozess und isolierter Arbeitsstrang

- Prozessartefakt, Ziel, Quellen und Gates versionieren.
- Eigenen Worktree und Branch verwenden.
- Commit: Prozessverankerung ohne Test- oder Verhaltensänderung.

### P1 – Selfplay-Capture und rote Evidence

- Einen test-/diagnosespezifischen Capture-Pfad für deterministische Selfplays ergänzen.
- Die drei Zustände aus Seed 001, 003 und 005 samt Runtimezustand spielgleich exportieren.
- Für jeden belastbaren Fehler einen Verhaltensvertrag und mindestens eine grüne Gegenprobe formulieren.
- Nachweisen, dass die Fehler auf unverändertem aktuellem KI-Code als `behavior_regression` rot sind.
- Alle roten Fixtures und Testinfrastruktur gemeinsam committen, bevor Verhaltenscode geändert wird.

### P2 – Sichere Agenda-Linien

- Agenda-Installationen ohne unmittelbare Abschlusslinie nach Zugriffsdruck, Schutz, verbleibenden Klicks und Economy bewerten.
- Unsichere offene Linien abwerten oder blockieren, ohne legitime Fast-Advance-, Bluff- oder geschützte Scorelinien zu verhindern.
- Seed-001-Checkpoint und Gegenprobe grün machen; fokussiert committen.

### P3 – Archives-Run-Disziplin

- Archives-Wert aus bekannter Beute, unbekannter Menge, Herkunft der verdeckten Karten, Corp-Druck und realen Alternativen ableiten.
- Ein einzelner unbekannter Zugang genügt nicht als pauschale Run-Begründung.
- Seed-003-Checkpoint und Gegenprobe grün machen; fokussiert committen.

### P4 – Corp-Endspiel und Deckout-Abschluss

- Sichtbare Deckout-Nähe, Agenda-/Kill-Abschlussdistanz, Klicks, Credits und Entwicklungskosten in die Corp-Priorität einbeziehen.
- Bei knapper verbleibender Lebenszeit nur Handlungen bevorzugen, die den Sieg unmittelbar ermöglichen, Deckout verhindern oder zwingend vorbereiten.
- Den exakt reproduzierten Seed-005-Checkpoint und Gegenprobe grün machen; falls P1 keinen echten Fehler bestätigt, stattdessen den Nicht-Fix mit Evidence abschließen.
- Fokussiert committen.

### P5 – Gates, Bericht und Wissenspflege

- Alle neuen Decision-Checkpoints und Gegenproben ausführen.
- Betroffene KI-Tests, KI-Typecheck, relevante Behavior-Baseline und möglichst die vollständige KI-Suite ausführen.
- `git diff --check` und Geheimnis-/Redaktionsschutz prüfen.
- Roh- und Ergebnis-Evidence vergleichbar ablegen und den Juli-Projektlog ergänzen.
- Abschlussbericht committen.

### P6 – Lokale Integration und Cleanup

- Vor Integration den aktuellen lokalen `main` in den Arbeitsbranch übernehmen, falls er fortgeschritten ist.
- Gates nach Konfliktauflösung erneut ausführen.
- Arbeitsbranch lokal nach `main` integrieren und den Main-Stand verifizieren.
- Worktree entfernen, seine Abwesenheit in Dateisystem und `git worktree list` prüfen und den gemergten Branch löschen.

## Abschlussgates

- Jeder gefixte Fehler besitzt einen zuvor separat committeden spielgleichen roten Decision-Checkpoint.
- Alle gefixten Checkpoints melden `pass`; Gegenproben bleiben `pass`.
- Kein Fixture enthält für die handelnde Seite nicht sichtbare Informationen im Event-Präfix oder KI-Input.
- KI-Typecheck und fokussierte Tests sind grün; breitere Tests enthalten keine neue Regression.
- Der Arbeitsbaum auf `main` enthält nur beabsichtigte Änderungen oder vorbestehende, klar getrennte Nutzeränderungen.
- Worktree und Arbeitsbranch sind nach erfolgreicher lokaler Integration nachweislich entfernt.
