# Accountgebundene Matchstart-Vorbelegungen – Final Review (2026-07-27)

## Ergebnis

Bestanden. Angemeldete Nutzer erhalten ihre letzte gültige Matchstart-
Konfiguration serverseitig und geräteübergreifend. Die Vorbelegung ist ein
kleiner privater Accountdatensatz; sie ist weder Teil eines Matches noch einer
Lobby, eines WebSocket-Payloads, einer PlayerView, eines Replays, StateHashs
oder KI-Inputs.

## Vertrag und Grenzen

- `GET`, `PUT` und `DELETE /api/account/match-start-preferences` verwenden
  die bestehende Account-Session. Schreibende Requests verlangen zusätzlich
  zulässige Origin und sessiongebundenes CSRF-Token; Antworten sind
  `no-store`.
- Der versionierte DTO erlaubt ausschließlich Spielmodus, eigene Seite,
  Format und Serienlänge, Kartenpool, KI-Schwierigkeit/-Deckstrategie,
  Countdown, Spielerzeit sowie zwei primäre Deckreferenzen. Seeds,
  öffentliche Sichtbarkeit, Lobby-/Teilnehmer-B-Auswahl, Debug-/Trace-Optionen
  und Credentials sind nicht Teil des DTOs.
- Unbekannte Felder werden nicht persistiert. Ungültige Allowlist-Werte
  quittiert der Server mit `400`, ohne den vorhandenen Datensatz zu ändern.
- Für Decks werden nur ein aktuelles Standarddeck, ein aktuell gültiges eigenes
  Accountdeck oder „zufälliges Standarddeck“ akzeptiert. Eigentum, Seite,
  Validierungsstatus und Kartenpool werden serverseitig geprüft. Gelöschte,
  fremde oder formatinkompatible Referenzen werden nicht übernommen; der
  Client zeigt einen Hinweis und verwendet die normale Standardauswahl.
- SQLite speichert genau einen Upsert-Datensatz je Account. Bei parallelen
  Geräten gilt dokumentiert „zuletzt gespeichert gewinnt“.
- Der Datensatz ist Bestandteil des privaten Accountexports, wird bei
  Accountlöschung entfernt und liegt wie die übrigen Accountdaten in den
  vorhandenen SQLite-Backups/Restores.

## Clientverhalten

Nach eindeutig feststehender Account-Session wartet der Spielstart auf
Deckbibliothek und Standarddecks und lädt erst dann den Accountdatensatz. Bei
einem Account ohne Vorbelegung werden Produktstandards gesetzt, ohne alte
browserlokale Gastwerte in den Account zu kopieren. Änderungen danach werden
debounced gespeichert. Gäste verwenden weiterhin ausschließlich Local Storage;
beim Abmelden werden die zuvor lokalen Gastwerte wiederhergestellt. Die
sichtbare Reset-Aktion entfernt die Accountvorbelegung und setzt die UI auf
Produktstandards zurück.

## Abnahmebelege

- Server-HTTP-Tests decken Auth, CSRF, Owner-Grenze, zweiten Geräte-Login,
  Allowlist-/Fehlervertrag, Deck-Fallback, Export, Reset und Accountlöschung
  ab.
- SQLite-Test belegt Backup und Restore des Präferenzdatensatzes.
- Die betroffenen bestehenden Account-Deck-, Statistik-, Auth- und
  Session-HTTP-Tests bleiben grün.
- Server- und Web-Typecheck sind grün. Die fokussierten Serverprüfungen
  enthalten 12, die Webprüfungen 6 Tests; die vollständige Websuite umfasst
  715 grüne Tests. `git diff --check` ist grün.
- Die vollständige Serversuite erreicht 213/214 grüne Tests. Der einzelne
  Fehlschlag in `multiplayer.test.ts` erwartet eine geschrumpfte
  SQLite-Dateigröße nach `OPTIMIZE`, obwohl Vorher- und Nachhergröße gleich
  sind. Der identische Test schlägt auf unverändertem `main` ebenfalls fehl;
  die Präferenzänderung berührt den Optimierungspfad nicht.
