# Final Review: Spieleübersicht und persönliche Spielhistorie

Stand: 2026-07-20
Status: freigabefähig

## Ergebnis

NETGRID besitzt jetzt zwei klar getrennte Spielübersichten:

- `Spiele` zeigt alle öffentlichen offenen, laufenden und abgeschlossenen
  Matches. Ohne Filter stehen offene vor laufenden und diese vor
  abgeschlossenen Matches.
- Offene Matches führen direkt in den vorhandenen Beitrittsablauf, laufende
  Matches in die Hidden-Info-sichere Zuschaueransicht und abgeschlossene
  Matches in das Full-Information-Replay.
- `Meine Spiele` fragt ausschließlich die serverseitig gebundenen Matches des
  angemeldeten Accounts ab. Eigene private Matches sind enthalten; fremde
  Matches und Gäste sind ausgeschlossen.
- Terminale Ergebnisse werden einmal als viewer-neutraler Ergebnis-Snapshot
  gespeichert. Listen lesen danach kompakte Matchzeilen statt Event- und
  Replayhistorien erneut zu hydrieren.

Es wurden keine neue Lobby, keine Gastidentität und kein zusätzlicher
Sichtbarkeitsschalter eingeführt.

## Implementation Review

### Verträge und Persistenz

Der gemeinsame Listenvertrag enthält Status, Ersteller, Seitenbelegung,
freie Seite, Spielformat und das optionale gespeicherte Ergebnis. Ein
Ergebnis-Snapshot entsteht ausschließlich aus autoritativem Serverzustand
bei regulärem Ende, Aufgabe oder terminalem Serienzeitablauf. Bereits
vorhandene Snapshots werden nicht neu berechnet oder durch Clients
überschrieben.

SQLite besitzt kompakte Candidate-Abfragen für globale und match-id-begrenzte
Listen. Historische terminale Matches ohne Snapshot werden einmalig geladen,
ergänzt und gespeichert; warme Listenabrufe verwenden anschließend nur den
kompakten Pfad.

### Öffentliche und persönliche Grenzen

`GET /api/public/matches` filtert bereits in SQLite auf `isPublic: true` und
relevante Statuswerte. Der Payload enthält keine Hände, LegalActions,
Choices, Deckinhalte, Session-/Reconnect-Tokens oder andere private
Kartendaten.

`GET /api/account/recent-results` verlangt eine gültige Accountsession und
ermittelt die erlaubten Match-IDs aus der bestehenden
Account-Teilnehmerbindung. Zwei-Account-Tests belegen sowohl das eigene
private Positivszenario als auch den Ausschluss des jeweils fremden Matches;
Gäste erhalten `401`.

### Weboberfläche

Der Bereich `Spiele` ist im Start- und Match-Shell erreichbar und bietet die
Filter `Alle`, `Offen`, `Laufend` und `Abgeschlossen`. Die drei Statusklassen
zeigen jeweils nur ihre sinnvolle Aktion. Der manuelle Beitrittsweg bleibt
erhalten. Der bisherige Bereich `Letzte Spiele` heißt jetzt `Meine Spiele`
und verwendet ausschließlich den authentifizierten persönlichen Endpoint.

## Bestands- und Performancenachweis

Vor der Bestandsmutation wurde eine SQLite-Onlinekopie unter
`C:\Projekte\NETGRID\data\runtime\backups\public-game-directory-20260720-1127\netgrid.sqlite`
erstellt und mit `integrity_check = ok` geprüft.

| Messpunkt                               | Ergebnis                 |
| --------------------------------------- | ------------------------ |
| Bestandsmatches                         | 21                       |
| Nach Migration öffentlich               | 21/21                    |
| Abgeschlossene Matches                  | 19                       |
| Nach Backfill mit Ergebnis-Snapshot     | 19/19                    |
| Kalter öffentlicher Abruf mit Backfill  | 6.789 ms                 |
| Warme öffentliche Folgeabrufe           | 73, 14, 13, 12 und 12 ms |
| Payload je warmem Abruf                 | 20.380 Bytes             |
| SQLite-Integritätsprüfung nach Backfill | `ok`                     |

Die kalte Messung umfasst bewusst die einmalige Vollhydrierung der 19
historischen terminalen Matches. Die warmen Messungen belegen zusammen mit
dem Storage-Negativtest, dass dieser Pfad danach nicht erneut verwendet wird.

## Browser-Abnahme

Ein temporäres öffentliches Match deckte die drei produktiven Wege ab:

- `Offen` filterte auf das wartende Match; `Beitreten` öffnete den bestehenden
  Joinablauf mit vorausgewählter Match-ID.
- `Laufend` öffnete die Zuschaueransicht. Der sichtbare DOM enthielt nur
  Handanzahlen und keine Kartenidentitäten, LegalActions oder Tokens.
- `Abgeschlossen` öffnete das Replay in der normalen Spieloberfläche.
  Runner/Korp-Perspektivwechsel, Einzelschritt und Playback funktionierten
  ohne Schrittverlust; die jeweilige eigene Hand wurde normal im Board
  dargestellt.

Das temporäre Match wurde danach exakt identifiziert, entfernt und die
SQLite-Integrität erneut geprüft. Die Gastansicht von `Meine Spiele` zeigte
nur den Anmeldehinweis und keine globale Ersatzliste.

## Final Review

| Abnahmekriterium                                          | Ergebnis  |
| --------------------------------------------------------- | --------- |
| Öffentliche Liste enthält nur öffentliche Matches         | bestanden |
| Reihenfolge Offen, Laufend, Abgeschlossen                 | bestanden |
| Filter und direkte Aktionen funktionieren                 | bestanden |
| Live-Zuschauer erhalten keine Hidden Info                 | bestanden |
| Replay nutzt das normale Board mit Runner/Korp-Wechsel    | bestanden |
| `Meine Spiele` ist accountgebunden                        | bestanden |
| Eigene private und fremde private Partie korrekt getrennt | bestanden |
| 21/21 Bestandsmatches rückwirkend öffentlich              | bestanden |
| 19/19 terminale Ergebnisse dauerhaft gespeichert          | bestanden |
| Warme Listen vermeiden die Vollhydrierung                 | bestanden |
| Typecheck, Contracts, Server-/Webtests, Build und Format  | bestanden |

Führender Prozess ist
`docs/architecture/public-game-directory-and-personal-history-process-2026-07-20.md`.
