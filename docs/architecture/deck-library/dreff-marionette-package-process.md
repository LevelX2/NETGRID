# Dr. Dreff und Marionette

Status: D01 und D02 abgenommen; lokale Integration ausstehend. Auftrag vom 2026-09-13.

## D01-Abnahme

45 Karten, 20 Agendapunkte, 52 aktive kuratierte Standarddecks. Der bestehende
Matchlegalitäts-/Kurationstest ist grün. Der unveränderte Guide-Checker,
lokal auf das neue Deck eingeschränkt, bestätigt 1/1 aktuelle Guides. Die
englischen und deutschen Inhalte sind redaktionell geprüft; Quell- und
Analysehashes stammen aus den bestehenden Autoritäten. Alle alten
Guide-Einträge sind strukturell unverändert.

Das globale Guide-Gate meldet drei unabhängige veraltete Analysehashes:
`standard_proteus_runner_breaker_lab_2026_05_25`,
`standard_runner_rd_express`, `standard_runner_rd_express_v2`. Keine
Neubestätigung fremder Analysen. Kein Volltest, Build oder E2E erforderlich.
`git diff --check` ist grün.

## D02-Abnahme

Der ursprüngliche Fehler wurde mit 14 roten und einem grünen neuen
Szenariotest reproduziert. Nach dem Ursachenfix bestehen alle 15 Szenarien,
einschließlich realer Marionette-Breakaktionen und Wiederverwendung im
nächsten Run, falscher Seite/veralteter Aktion, Sichtbarkeit, optionalem
Einkommen und Replay. Der abschließende Lauf der sechs geänderten beziehungsweise
direkt angebundenen Testdateien besteht mit 52 Tests. Die angrenzende Auswahl
aus Proteus-Lifecycle, Dreff/Jenny und temporären Begegnungen besteht mit
27 Tests einschließlich der neuen Szenarien. Engine-Typecheck und
Engine-Strukturgate (keine relativen Zyklen) sind grün. Keine KI-,
Workspace-, Build- oder E2E-Gesamtläufe. Aktuelle Verträge sind in
`run-runtime-architecture.md` und `CODEX_STATUS.md` zurückgeführt.

## Ziel und Grenzen

Das bestätigte Standarddeck „Dr. Dreffs letzte Visite“ mit 45 Karten und
20 Agendapunkten wird samt Kuration und englischer/deutscher Anleitung
angelegt. Danach wird die regelgemäße Rückkehr von temporär durch Dr. Dreff
begegnetem Marionette vor dessen Trash umgesetzt. Die bestätigte Liste
enthält weiterhin keine Marionette. Keine KI-Verhaltensänderung, kein
Serverstart, kein Push und keine Erweiterung des Kartenpools.

## Ablauf

- D01 — Standarddeck: Katalog, Kuration und vollständige Guides mit exakten
  Quell-/Analysehashes ergänzen; aktuelle Decklegalität, Kartenzahl,
  Agendapunkte und Guide-Gate prüfen. Commit: `feat(decks): add Dr. Dreff standard deck`.
- D02 — Temporärer ICE-Pass: Rückkehrfenster an die tatsächliche temporäre
  Begegnung binden, vor dem Trash auflösen und Zonenwechsel korrekt ausführen.
  Gezielte Regressionen für Rückkehr, Zahlung/Trash, Run-Ende, verwandte
  deklarative Rückkehrmodi, Legalität, Sichtbarkeit und Replay. Aktuelle
  Architektur und Status nachführen. Commit: `fix(engine): resolve temporary ICE return before Dreff cleanup`.

Ein Paket ist jeweils aktiv. Ein Fehler wird am verantwortlichen Pfad
behoben; kein Fallback oder abgeschwächtes Gate. Sicherheitsblocker erhalten
eine konkrete Removal Condition. Unabhängige Findings erweitern den Scope
nicht. Pro Paket nur änderungsnahe Tests, `git diff --check` und eigener
Commit; Typecheck bei berührten Typverträgen, Strukturgate bei Strukturänderung.

## Goal und Integration

/Goal Arbeite D01 und D02 sequenziell im Worktree
`C:\Projekte\NETGRID_dreff_marionette` auf `codex/dreff-marionette` ab.
Committe jedes bestandene Paket, gleiche aktuellen lokalen `main` defensiv
ab und integriere lokal nach `main`. Prüfe anschließend den Main-Stand und
entferne ausschließlich den sauberen eigenen Worktree und gemergten Branch.
Verifiziere Git-Registrierung und Dateisystementfernung vor Goal-Abschluss.

Der Hauptcheckout war bis auf die aus diesem Thread stammende
Architekturdiagnose sauber. Diese Diagnose wurde in den Worktree übertragen.
Fremde Worktrees und ihre Prozesse bleiben unberührt. Die Prozessdatei wird
nach Rückführung aktueller Ergebnisse gemäß Projekt-Retention entfernt;
Paketcommits bleiben der historische Nachweis.
