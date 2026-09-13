# Menschliche Spielmuster in ausführbare KI-Linien überführen

Status: aktiv; HU00 bis HU02 geprüft, HU03 aktiv. Quelle: Match `match_e553ff2853e6bbba` und ausdrücklicher Umsetzungsauftrag vom 2026-09-13.

## Ziel und Arbeitsvertrag

Vier begründete Fähigkeiten innerhalb bestehender Planowner verbessern: vollständige finanzierte Runner-Antworten, frühzeitige zielgebundene Coverage, Corp-ICE-Verwertung mit erhaltenem Schutz und zustandsabhängiges Risiko unbekannter ICE. Bestehende Fähigkeiten werden zuerst überprüft; bereits korrektes Verhalten erhält gezielte Nachweise statt unnötiger Änderungen. Kein allgemeiner Stärkennachweis aus einem Einzelspiel.

Arbeitsverzeichnis: `C:\Projekte\NETGRID_human_patterns_e553`, Branch `codex/human-patterns-e553`, Integration ausschließlich lokal nach `main`. Keine Serverstarts, SQLite-Zugriffe, Pushes, breiten Tests oder Änderungen fremder Arbeit. Historische Daten ausschließlich aus der Maintenance-Analyse-API; bereits geladene Detailantworten werden wiederverwendet. Menschliche private Hand bleibt ausgeschlossen.

Genau ein Paket ist aktiv: vorbereitet → aktiv → fokussiert geprüft → committed → nächstes Paket. Unerwartete rote Tests werden am verursachenden Pfad geklärt. Fehlende notwendige Quotes oder Bindungen bleiben sichtbar fail-closed; keine Ersatzheuristik. Ein belegter API-/Fachblocker erhält konkrete Removal Condition. Nicht angeforderte Findings werden als Restpunkt abgegrenzt.

## Paketfolge

| ID   | Ziel / konkrete Arbeit und Kernartefakte                                                                     | Voraussetzung                     | Checks und Done-Gate                                                                                         | Commit                                                      |
| ---- | ------------------------------------------------------------------------------------------------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| HU00 | Preflight, API-Replay-Fixtures D147/D96, Diagnose der tatsächlichen Owner; Prozessstand                      | vollständige Match-ID und Auftrag | historische Bindung, Side-Safety und aktuelle Auswahl eng prüfen; reproduzierbare Ausgangsevidence           | `test(ai): capture e553 human-pattern decision evidence`    |
| HU01 | Shell-Vorbereitung an vollständige finanzierte Antwort binden; Shell-/Coverage-/Run-Owner und Runner-Vertrag | HU00                              | historischer Endzustand und finanzierbarer Gegenfall; Plan, Route, Priorität, Reserven belegt                | `fix(ai): bind urgent shell preparation to funded access`   |
| HU02 | frühzeitige zielgebundene Breaker-Vorbereitung für bekannte Scoreblockade; Remote/Coverage                   | HU01                              | früher API-Punkt und geeignete Gegenfälle; Bedarf/Parent bleibt erhalten, kein blindes Globalpriorisieren    | `fix(ai): prepare coverage for persistent scoring threats`  |
| HU03 | ICE-Verwertung zur konkreten Finanzierung bei erhaltenem Schutz; Corp-Economy/Defense                        | HU02                              | echte Engine-Szenarien für entbehrliches ICE und notwendigen Schutz; korrekte Eigentümerschaft und Legalität | `fix(ai): fund corp plans from expendable ice`              |
| HU04 | Risiko unbekannter ICE bei verändertem Rig und Corp-Budget neu bewerten; Central-/Run-Risiko                 | HU03                              | D96 sowie frühe/arme/sichtbar sichere Gegenfälle; keine Annahme verdeckter Kartenidentität                   | `fix(ai): revalue unknown ice exposure with current stakes` |
| HU05 | betroffene aktuelle Verträge und Status pflegen, defensiver Main-Abgleich, Integration und Cleanup           | HU00–HU04 geprüft und committed   | nur direkt betroffene Checks, `git diff --check`, saubere Integration und verifizierte Entfernung            | `docs(ai): finalize human-pattern planning contracts`       |

Neue oder veränderte Typoberflächen erhalten den AI-Typecheck; strukturelle Grenzen das unmittelbar betroffene Gate. Tests laufen mit einem Worker; fortsetzbare Prozesse werden weiterverfolgt, nicht nach dem ersten Yield beendet. Keine automatische Gesamtsuite.

## Controller-Ziel

Alle Pakete vollständig und sequenziell abarbeiten, beendete Pakete getrennt committen, Fortschritt hier aktualisieren. Vor Integration beide Änderungsabsichten lesen und erhalten. Nach erfolgreicher Integration Branch-Ancestor, Main-Zustand, Worktree-Registrierung und Dateisystem prüfen. Goal erst nach erfolgreichem Cleanup abschließen. Aktuelle Ergebnisse in die Fachverträge übertragen; dieses temporäre Prozessartefakt am Abschluss entfernen.

## Fortschritt und Grenzen

- HU00 geprüft: zwei historische actor-sichere Fixtures mit sämtlichen API-Validierungen, deterministische aktuelle LegalAction-/Origin-Auswahl (2 Tests grün). Hauptworkspace beim Start sauber, Basis `55ff15ea3`.
- Diagnosewerkzeug korrigiert: Runtime-Restore benötigt Input, gespeicherte eigene Deck-ID und Runtime als drei Argumente. API unverändert wiederverwendet.
- Testaufruf künftig direkt `pnpm exec vitest run <Datei> --maxWorkers=1` im AI-Paket. Ein versehentlich durch `test -- <Datei>` ungefilterter Lauf wurde sofort beendet; zwei dabei gemeldete bestehende Runtime-Testfehler entstanden vor jedem Verhaltenspatch und gehören nicht zum Scope.
- API-Bundle aus der Analyse: 256 Events, 158 KI-Decisions, vollständiges Endergebnis. D96 und D147 bereits einmal geladen und im Analyseprozess vorhanden.
- Menschliche Aktionen belegen Verhalten, keine aufgezeichneten Absichten oder verworfenen Alternativen. Corp-Fähigkeiten werden daher mit ausdrücklich vorbereiteten Engine-Szenarien geprüft, nicht als historischer Corp-KI-Checkpoint ausgegeben.
- Einzelkarten-Draw-Effizienz ist außerhalb dieses vierteiligen Auftrags.
- HU01: 14 Tests in zwei Dateien grün, AI-Struktur und Erreichbarkeit grün. Voller Paket-Typecheck meldete ausschließlich einen inzwischen korrigierten `exactOptionalPropertyTypes`-Fehler der neuen Projektion. Anschließend fokussierter Typecheck des öffentlichen AI-Einstiegs, aller Shell-Dateien und des Matchtests mit unverändertem Strict-Vertrag grün. Große Replay-Fixtures werden wie bei bestehenden Checkpoints zur Laufzeit geladen; kein ungeprüfter JSON-Uniontyp.
- HU01 belegt vollständig aktuell liquide Kombinationen vorbereiteter Breaker einschließlich Pfadkosten, MU und Run-Klick; noch benötigte zusätzliche Funding-/Installationsvarianten werden nicht als bewiesen ausgegeben. D147 erhält zunächst einen regulären Draw statt sieben unproduktiver Counterzahlungen. Keine Behauptung eines rettbaren Originalspiels.

- HU02: 13 fokussierte Tests einschließlich D49/D59, unbekannter ICE und leerem Remote sowie Suchregression grün; fokussierter Strict-Typecheck grün. D59 sucht die Sentry-Antwort, D49 behält zulässigen HQ-Druck bei und trägt bereits den gebundenen Remote-Bedarf.
