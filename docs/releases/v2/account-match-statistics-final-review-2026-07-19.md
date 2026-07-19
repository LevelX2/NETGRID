# Private Account-Matchstatistik – Final Review

Stand: 2026-07-19
Zielstufe: V2.0 Closed Accounts Alpha
Entscheidung: fachlich und technisch abgenommen

## Ergebnis

NETGRID führt für angemeldete Accounts eine private, retention-unabhängige
Matchstatistik. Die Accountidentität wird ausschließlich aus der gültigen
Server-Session an `player_a` beziehungsweise `player_b` gebunden und bleibt
außerhalb von Matchrecord, Rules Engine, PlayerViews, LegalActions,
PublicEvents, Replay, StateHash und KI-Input.

Ein schmales, idempotentes Ledger speichert terminale Spiel- und
Serienergebnisse aus Accountperspektive. Die Weboberfläche zeigt Gesamtwerte,
Siegquote samt Stichprobe, Runner/Korp, Gegnerart, Serienwerte und eine
gefilterte cursorpaginierte Historie. Gäste und andere Accounts erhalten
keinen Zugriff.

## Umsetzung

| Paket | Inhalt | Commit |
|---|---|---|
| AMS-00 | Paketprozess, Controller und Worktreevertrag | `bba6708fb` |
| AMS-01 | Shared-Verträge und SQLite-Schema 3 | `d8e3645d8` |
| AMS-02 | sichere Account-Matchbindung | `ceb4f49f0` |
| AMS-03 | Ergebnisledger und Reconciliation | `f189459d2` |
| AMS-04 | private API, Export, Löschung und Betrieb | `7eccf11f7` |
| AMS-05 | private Statistik-UI und Historie | `102387b01` |
| AMS-06 | Gesamtgates, Browser-E2E und Betriebsübergabe | dieser Abschlusscommit |

## Persistenz- und Betriebsvertrag

- SQLite-Schema 3 ergänzt `account_match_participants`,
  `account_game_results` und `account_series_results` samt Account-Cascade,
  Constraints und Indizes. Schema 1 und 2 werden nach Pre-Migration-Backup
  ohne historischen Anzeigenamen-Backfill migriert.
- Deterministische Ergebnis-IDs, Unique Constraints und Inhaltsvergleich
  machen wiederholte Persistenz und Reconciliation idempotent; ein
  widersprüchlicher Inhalt wird als Integritätsfehler abgewiesen.
- Die Matchpersistenz wartet den Statistikprojektor ab. Ein erneuter
  idempotenter Aufruf und die Start-Reconciliation aus noch vorhandenen
  terminalen Matches bilden den Reparaturpfad für einen unterbrochenen
  Aufnahmeversuch.
- Ergebnisledger besitzen absichtlich keinen Match-Foreign-Key und überleben
  die Rohmatch-Retention. Accountlöschung entfernt Bindungen und Ledger per
  Account-Cascade beziehungsweise im getrennten Accountstorage.
- SQLite-Backup und -Restore sichern die neuen Tabellen als Teil der gesamten
  Datenbank. Ein eigener Restore-Test weist nach, dass nur der gesicherte
  Ledgerstand wiederhergestellt wird.
- Account-Export-Schema 2 enthält die eigenen redigierten Statistikdaten.
  Maintenance liefert nur Tabellenzeilen und Größen, keine persönlichen
  Statistikantworten.

## API und Datenschutz

- `GET /api/account/statistics` liefert nur die Aggregate des angemeldeten
  Accounts einschließlich `statisticsSince`, Seiten-, Gegnerart-, Modus- und
  Serienwerten.
- `GET /api/account/match-history` liefert ausschließlich eigene redigierte
  Ledgerzeilen, cursorpaginiert mit maximal 50 Einträgen.
- Beide Endpunkte verlangen eine Account-Session, verwenden
  `Cache-Control: no-store` und einen eigenen Read-Rate-Limit-Bucket. Es gibt
  keinen Account-ID-Parameter und keinen öffentlichen Statistikendpunkt.
- Weder Gegner-Account-ID noch Gegner-Anmeldename, Deckliste, Hand,
  Draw-Pile, LegalActions, vollständige Events oder KI-Traces werden in das
  Ledger oder die Antworten übernommen.
- Self-Play bleibt als ausgeschlossene Eigenpartie erkennbar, verändert aber
  Siege, Niederlagen und Winrate nicht. KI-gegen-KI wird nicht verbucht.

## Akzeptanznachweis

| Nr. | Kriterium | Nachweis |
|---:|---|---|
| 1 | nur authentifizierte Teilnahme zählt | sessionbasierte Create-/Join-Bindung; Gast- und Manipulationstests |
| 2 | keine Accountidentität in Spiel-/Replayflächen | Control-Plane-Trennung sowie Payload-, Replay- und StateHash-Regressionen |
| 3 | vollständige Zählmatrix | Projektortests für regulär, Draw, Forfeit, Abbruch, KI, Gast, Account, Self-Play und Serie |
| 4 | höchstens eine Buchung | deterministische IDs, Unique Constraints, Wiederholungs- und Konflikttests |
| 5 | Retention-Unabhängigkeit | Integrationstest löscht den Rohmatch und liest das Ledger erneut |
| 6 | vollständige Accountlöschung | Delete-Tests bei gemeinsamem und getrenntem Accountstorage |
| 7 | versionierter Export | Export-Schema 2 mit redigierten eigenen Spiel- und Serienfakten |
| 8 | strikte Ownergrenze | Auth-, Fremdzugriffs-, Session- und API-Tests ohne Account-ID-Lookup |
| 9 | Migration, Backup, Restore, Reconciliation | Schema-1/2-Migration, Ledger-Restore-Probe und Startup-Reconciliation |
| 10 | Gesamtgates und Browser | Shared-, Server-, Web-, Contract-, Boundary-, Build- und 9-Fall-Browserlauf |

## Browserabnahme

Der isolierte Browserlauf startet Server und Webclient auf freien Ports mit
einer temporären SQLite-Datei. Er legt einen Admin-Testaccount an und räumt
die gesamte Runtime danach auf. Abgedeckt sind:

- angemeldeter Account gegen KI mit anschließendem Forfeit und eigener
  Statistik;
- zwei getrennte Accounts in getrennten Browserkontexten mit entgegengesetzten
  Ergebnisansichten;
- sichtbare Aufschlüsselung gegen Account, Gast und KI;
- keine Accountstatistik für einen Gast;
- einspaltige schmale Darstellung ohne kritischen horizontalen Überlauf;
- bestehende Human-vs-AI-, Human-vs-Human-, Lifecycle-, Reconnect-,
  Hidden-Info-, Runtime-Isolation- und Deckvalidierungsflüsse.

## Architekturabweichung

Der Quellplan sah für `account_match_participants.match_id` einen Foreign Key
auf `matches` vor. Das Projekt unterstützt jedoch mit
`NETGRID_ACCOUNT_SQLITE_PATH` ausdrücklich eine getrennte Accountdatenbank;
ein datenbankübergreifender SQLite-Foreign-Key ist dort nicht möglich. Deshalb
bleibt `match_id` ein opaker Control-Plane-Schlüssel. Die Accountreferenz
behält `ON DELETE CASCADE`, Bindung und Projektion sind idempotent, und die
Abweichung schwächt weder Privacy noch Accountlöschung oder Retention.

## Verifikation

| Gate | Ergebnis |
|---|---:|
| Shared-Tests | 12/12 |
| fokussierte Statistik-, Statistik-HTTP- und Exporttests | 11/11 |
| vollständige Servertests | 184/184 in 18 Dateien |
| vollständige Webtests | 643/643 in 53 Dateien |
| Contracttests | Shared 12/12 und Spezifikationen 8/8 |
| Package Boundaries | grün, 1.881 Dateien |
| projektweiter Typecheck | grün, 7 Workspace-Pakete |
| Produktionsbuild | grün, Server und Web einschließlich 14 statischer Seiten |
| Browser-E2E | 9/9 |

Der Browserlauf enthält zusätzlich die gezielten grünen Einzelproben für die
Accountstrecke, Gast-Human-vs-Human und Gast-Human-vs-KI. Die temporäre
E2E-Runtime wird nach jedem Lauf verifiziert beendet und gelöscht.

## Bewusst offen

Öffentliche Profile, öffentliche Statistiken, Elo, Ranking, Seasons,
Leaderboards, Turniere, Gegnerprofile, E-Mail-Verifikation, Self-Service-
Recovery, Passkeys und MFA bleiben spätere, separat zu planende Produkt- und
Privacy-Gates. Die sichtbare Produktkennung bleibt entsprechend dem
Version-0-Vertrag unverändert; „V2.0 Closed Accounts Alpha“ ist eine
fachliche Zielstufe und keine neue öffentliche Appversion.
