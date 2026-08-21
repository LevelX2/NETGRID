# Paketprozess: Lokalisierter Gamebook-Download

## Status

Paketarbeit GB-01 bis GB-03 abgeschlossen. Finaler Main-Abgleich, Merge und Cleanup werden anschließend vom Controller verifiziert.

## Quelle/Vorgabe

Das heruntergeladene Gamebook soll der aktuell eingestellten Oberflächensprache folgen. NETGRID unterstützt derzeit Deutsch, Englisch und Französisch. Ist keine unterstützte Sprache bestimmbar, wird Englisch verwendet.

## Zielprüfung

Die Vorgabe ist für die automatische Umsetzung ausreichend präzise. Download-Aufrufer, HTTP-Endpunkt, serverseitiger Renderer und vorhandene Regressionstests sind eindeutig bestimmbar.

## Gesamtziel

Der Gamebook-Download übermittelt die aktive UI-Sprache explizit an den Server. Der Server erzeugt alle redaktionellen und dynamischen Gamebook-Texte auf Deutsch, Englisch oder Französisch und verwendet Englisch als Fallback. Das Match, sein Replay, seine Ereignisse und sein StateHash bleiben sprachneutral und unverändert.

## Annahmen

- Unterstützte Gamebook-Sprachen sind `de`, `en` und `fr`.
- Ein fehlender oder unbekannter Locale-Wert wird serverseitig zu `en` normalisiert.
- Karten-, Spieler- und andere Eigennamen bleiben in ihrer kanonischen Form.
- Der bestehende private Gamebook-Zugriff und seine Side-Safety-Regeln bleiben unverändert.
- Der Dateiname darf sprachneutral werden; die Sprache wird nicht im Match gespeichert.

## Nicht-Ziele

- Keine Übersetzung von Karten- oder Decknamen.
- Keine Änderung an Rules Engine, Matchzustand, Replayformat oder StateHash.
- Keine neue Sprache außerhalb von Deutsch, Englisch und Französisch.
- Keine Übersetzung allgemeiner Serverfehler außerhalb des Gamebook-Endpunkts.
- Kein breiter Workspace-, Build- oder E2E-Lauf ohne änderungsbezogenen Grund.

## Controller-Invarianten

- Die Locale ist ein reiner Präsentationsparameter des einzelnen Downloads.
- Der Server rendert ausschließlich aus den bereits autorisierten Gamebook-Daten.
- Der Download darf keine Tokens, privaten Payloads, internen Kartenzustände oder lokale Pfade offenlegen.
- Öffentliche und private Gamebooks behalten ihre bisherige Zugriffskontrolle.
- Unbekannte Locale-Werte erzeugen deterministisch englischen Inhalt.

## Automatische Fehlerbehandlung

- Rote fokussierte Tests werden im aktiven Paket ursachenbezogen behoben.
- Fremde Änderungen in `main` werden nicht übernommen, verworfen oder beiläufig committed.
- Läuft `main` weiter, wird es vor dem Abschluss defensiv in den Arbeitsbranch integriert.
- Fachlich inkompatible Konflikte stoppen den Prozess mit Blocker-Report und Removal Condition.

## Sicherheitsblocker

Ein Blocker liegt vor, wenn die Lokalisierung nur durch Ausweitung des Gamebook-Zugriffs, Parsing bereits formulierter Ereignistexte oder Änderung semantischer Matchdaten erreichbar wäre. Removal Condition: ein typisierter Präsentationsvertrag, der ohne diese Ausweitungen auskommt.

## State Machine

`PREPARED -> GB-01 -> GB-02 -> GB-03 -> FINAL_VERIFY -> MAIN_MERGED -> CLEANED -> COMPLETE`

Nur das jeweils aktuelle Paket darf Änderungen erhalten. Bei einem nicht erfüllten Done-Gate bleibt der Prozess im aktuellen Zustand.

## Paketfolge

1. GB-01 – Locale-Vertrag und Download-Weitergabe
2. GB-02 – Lokalisierter serverseitiger Gamebook-Renderer
3. GB-03 – Integrationsregressionen und Abschlussdokumentation

## Paketdetails

### GB-01 – Locale-Vertrag und Download-Weitergabe

- Ziel: Der Browser übergibt seine aktive Sprache explizit an den Gamebook-Endpunkt, der Server normalisiert sie typisiert.
- Eingangsvoraussetzungen: Prozessartefakt committed; Worktree sauber.
- Konkrete Arbeit: Locale-Parameter an Download-URL ergänzen, alle Aufrufer aktualisieren, serverseitige Normalisierung und sprachneutralen Dateinamen ergänzen.
- Kernartefakte: `apps/web/features/match-start/public-match-navigation.ts`, zugehörige Panels und Tests, `apps/server/src/http-server.ts`, serverseitiger Locale-Vertrag.
- Tests/Checks: fokussierter Navigationstest, passende HTTP-/Service-Tests, `git diff --check`.
- Done-Gate: `de`, `en` und `fr` werden übertragen; fehlende/unbekannte Werte werden zu `en`; Zugriffsschutz bleibt grün.
- Commit: `feat(gamebook): pass download locale to server`

### GB-02 – Lokalisierter serverseitiger Gamebook-Renderer

- Ziel: Alle vom Renderer erzeugten Überschriften, Labels und dynamischen Sätze sind für `de`, `en` und `fr` vorhanden.
- Eingangsvoraussetzungen: GB-01 committed und sauber.
- Konkrete Arbeit: typisierten Übersetzungskatalog beziehungsweise locale-abhängige Formulierungsfunktionen einführen; Renderer und Hilfsfunktionen locale-aware machen; Eigennamen erhalten.
- Kernartefakte: `apps/server/src/multiplayer.ts`, `apps/server/src/multiplayer.test.ts`.
- Tests/Checks: fokussierte Gamebook-Service-Tests für alle Sprachen, bestehender Leak-Schutz, `git diff --check`.
- Done-Gate: dieselbe Partie lässt sich auf Deutsch, Englisch und Französisch rendern; unbekannte Sprache liefert Englisch; keine festen deutschen Redaktionstexte verbleiben im nichtdeutschen Export.
- Commit: `feat(gamebook): localize rendered markdown`

### GB-03 – Integrationsregressionen und Abschlussdokumentation

- Ziel: Der vollständige Downloadpfad und die Prozessdokumentation sind konsistent abgeschlossen.
- Eingangsvoraussetzungen: GB-02 committed und sauber.
- Konkrete Arbeit: HTTP-Download je Locale prüfen, Content-Disposition und Leak-Schutz absichern, Prozessstatus und Ergebnisse dokumentieren.
- Kernartefakte: fokussierte HTTP-Tests und dieses Prozessartefakt.
- Tests/Checks: direkt betroffene Web- und Servertests, gegebenenfalls berührte Paket-Typechecks, `git diff --check`.
- Done-Gate: aktiver Locale-Wert bestimmt nachweislich den Markdown-Inhalt; Prozessartefakt nennt ausgeführte Checks und Restpunkte.
- Commit: `test(gamebook): cover localized downloads`

## Verifikationsregeln

- Nach jedem Paket nur direkt änderungsnahe Tests ausführen.
- Typechecks nur für tatsächlich berührte Typoberflächen oder Paketgrenzen.
- Nach jedem Paket `git diff --check`, ausschließlich paketbezogenes Staging und ein eigener Commit.
- Nach einem Main-Abgleich nur durch die neuen Main-Änderungen betroffene Checks wiederholen.

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/gamebook-localization`
- Arbeits-Worktree: `C:\Projekte\NETGRID_GAMEBOOK_LOCALIZATION`
- Hauptworkspace: `C:\Projekte\NETGRID`
- Umsetzung ausschließlich im Arbeits-Worktree; Hauptworkspace nur für den finalen lokalen Merge.
- Final bevorzugt Fast-Forward nach lokalem `main`.
- Nach erfolgreichem Merge Arbeits-Worktree entfernen, Entfernung in Git und Dateisystem prüfen und Branch mit `git branch -d` löschen.
- Kein Push und kein Pull Request.

## Controller-Prompt-Kern

`/Goal Arbeite die Lokalisierung des Gamebook-Downloads vollständig und sequenziell von GB-01 bis GB-03 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, die projektbezogene Wissensbasis und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_GAMEBOOK_LOCALIZATION auf Branch codex/gamebook-localization. Nutze den Hauptworkspace nur für den finalen Merge. Arbeite immer nur am aktuellen Paket, führe änderungsnahe Checks aus und committe jedes abgeschlossene Paket. Bei einem Sicherheitsblocker stoppe mit Blocker-Report und Removal Condition. Integriere danach aktuelles main, verifiziere direkt änderungsnah, merge lokal nach main und markiere das Goal erst nach verifiziertem Worktree- und Branch-Cleanup als complete.`

## Abschlusskriterien

- Alle drei Locale-Werte werden vom Web bis zum Server übertragen.
- Gamebook-Inhalt ist vollständig auf Deutsch, Englisch und Französisch renderbar.
- Englisch ist der deterministische Fallback.
- Zugriffsschutz und Leak-Schutz bleiben erhalten.
- Jedes Paket hat einen eigenen Commit und erfülltes Done-Gate.
- Arbeitsbranch ist lokal in `main` integriert.
- Worktree und gemergter Branch sind entfernt und die Entfernung ist verifiziert.

## Umsetzungsergebnisse

- GB-01 (`8e8c0c0e5`): Die Web-Downloadflächen übertragen `de`, `en` oder `fr`; der HTTP-Endpunkt normalisiert fehlende und unbekannte Werte zu Englisch und kennzeichnet den sprachabhängigen Dateinamen.
- GB-02 (`aee47e201`): Der serverseitige Renderer nutzt einen vollständigen typisierten Sprachkatalog für statische und dynamische Gamebook-Texte. Karten-, Spieler- und Eigennamen bleiben kanonisch.
- GB-03: Der reale HTTP-Pfad ist für Deutsch, Englisch, Französisch sowie fehlende und unbekannte Locale-Werte abgedeckt; der bestehende Leak-Schutz gilt für jede Variante.

Direkt ausgeführte Checks:

- Web-Navigationstest und kompakte öffentliche Spieleansicht: grün.
- Gamebook-Locale-, Service- und HTTP-Regressionstests: grün.
- Server-Typecheck: grün.
- `git diff --check`: grün.

Der Web-Typecheck wurde angestoßen, ist jedoch an einem bereits im Ausgangsstand vorhandenen, nicht betroffenen KI-Testfixture (`app/ai-turn-plan-comparison-ui.test.ts`) gescheitert: Dort fehlen `executionOrigin` und `selectedStep` für `AiPlanFirstDecisionDebug`. Die direkt betroffenen Webtests sind grün; dieser fremde Baseline-Fehler wurde nicht in den Gamebook-Scope gezogen.
