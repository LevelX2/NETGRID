# Fünf weitere AI-Owner bündeln

Status: P1–P3 abgenommen; P4 aktiv. Auftrag: Nutzerfreigabe vom 2026-09-11.

## Ziel und Grenzen

Ambush, Central Pressure, Remote Contest, Scoring Remote und Score erhalten
je eine vertikale Implementierung aus Signalbildung, Planlogik und gebundener
Fortsetzung. Keine neuen Owner, Strategien oder Prioritäten. Engine, LegalActions,
Side-Sicherheit, deterministische Reihenfolge und vorhandene Planbindungen bleiben
unverändert. Gemeinsame Runquotes bleiben Dienste; Defense behält ICE-Allokation,
Schutzbewertung und Rez-Autorität. Keine Wrapper zurück zur Live-Runtime.

## Sequenz und Abnahme

Genau ein Paket ist aktiv. Jedes Paket setzt seinen Vorgänger voraus und endet
nach fokussierten Tests, AI-Typecheck bei geänderter Typoberfläche,
`git diff --check`, Dokumentation seiner Codekarte und eigenem Commit.

| Paket | Arbeit und Kernartefakte                                                                                    | Fokussierte Abnahme                                  | Commit                                             |
| ----- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------- |
| P1    | Ambush-Modul, Signale, Zugriffsvorbereitung und Choice-Bindungen unter `corp/ambush/` bündeln               | Ambush-, Recycling-, Bluff- und Choice-Verträge      | `refactor(ai): consolidate ambush owner`           |
| P2    | Central-Plan und Ziel-/Vorbereitungssignale unter `runner/central-pressure/`; gemeinsame Runfakten benennen | Central-/Druck-/Funding- und Planverträge            | `refactor(ai): consolidate central pressure owner` |
| P3    | Remote-Plan, Threat-/Vorbereitungssignale unter `runner/remote-contest/`                                    | Remote-/Letztchancen-/Runstart-Verträge              | `refactor(ai): consolidate remote contest owner`   |
| P4    | Remote-Projekt, Zielbindung, Cadence und Score-Lease unter `corp/scoring-remote/`                           | Remote-Projekt-, Lease- und Defense-Support-Verträge | `refactor(ai): consolidate scoring remote owner`   |
| P5    | Score-Modul, Projekterkennung, Horizont und Finanzierung unter `corp/score/`                                | Score-/Kampagnen-/Finanzierungs-/Schutz-Verträge     | `refactor(ai): consolidate agenda scoring owner`   |

## Controller und Integration

Arbeitsbereich: `C:/Projekte/NETGRID-worktrees/ai-owner-final-five`, Branch
`codex/ai-owner-final-five`, Ausgangspunkt `ad0aa0714`. Lokal nach `main`
integrieren, kein Push. Fremde Arbeitsstände bleiben erhalten. Keine Serverstarts.
Typ- und Quellstrukturgrenzen werden tatsächlich geprüft. Wegen der gemeinsamen
Runtime und fünf betroffenen Strategieownern folgt am Integrationscheckpoint
ein vollständiger AI-Shard-Lauf gemäß Projekt-Testvertrag (drei Shards, je ein
Worker); keine Workspace-/Build-/E2E-Ausweitung.

Fehler werden am verursachenden Pfad behoben. Keine Ersatzwerte oder stillen
Fallbacks. Ein fachlich widersprüchlicher Vertrag ist ein Blocker; unabhängige
Baselinefehler werden getrennt ausgewiesen. Nach erfolgreicher Integration
eigenen Worktree/Branch geprüft entfernen. Aktuelle Erkenntnisse verbleiben in
den Ownerverträgen und der AI-README; dieses Prozessartefakt wird nach Abschluss
entfernt, Git bewahrt die Nachweise.

P1: 70 Tests in sieben Dateien grün; AI-Typecheck und Source-/Reachability-Gates grün (783 produktive Dateien, keine Wert-/Typzyklen). Keine Verhaltensänderung. Gemeinsame Choice-Bindungsfehler und Typen vom Dispatcher getrennt.


P2: 88 Tests über zehn Dateien geprüft; zwei fehlende Imports beim Herauslösen korrigiert, betroffene 15 Tests anschließend grün. Finale Funding-Extraktion ebenfalls mit diesen 15 Tests geprüft. Finaler AI-Typecheck und Source-/Reachability-Gates grün (794 produktive Dateien, keine Zyklen). Ein Typecheck-Aufruf ohne den vorgesehenen 8-GB-Heap wurde nach Speicherabbruch korrekt mit 8 GB wiederholt.


P3: 71 Tests in acht Dateien, AI-Typecheck und Source-/Reachability-Gates grün (798 produktive Dateien, keine Zyklen). Remote-Letztchancenregeln liegen beim Owner; gemeinsame Finanzierung konsumiert diesen Vertrag.

