# Backend 0.5 Requirements

Status: implemented-slice-retention-cleanup
Stand: 2026-05-14
Quelle: `docs/derived/BACKEND_0_5_PRIVATE_STORAGE_MAINTENANCE_PLAN.md`

## Scope

Backend 0.5 ist ein separater privater Backend-/Ops-Schnitt für lokalen SQLite-Multiplayer-Storage. Die sichtbare App-/Core-Version bleibt unverändert bei `V1.9.21` bzw. beim laufenden `V1.9.22`-WIP-Scope. Es gibt keine Karten-, Mechanik-, KI- oder Webclient-Release-Promotion.

## Must-Anforderungen für den ersten Schnitt

| ID | Anforderung | Umsetzung |
| --- | --- | --- |
| B05-REQ-001 | Eine private Wartungsansicht zeigt redaktierte Storage-Kennzahlen: Datenbankgröße, Matchanzahl, Statusverteilung, Modusverteilung, Terminal/Nicht-terminal, ältestes/neustes Match und letzte Aktualisierung. | `/maintenance` und `GET /api/storage/maintenance/summary`. |
| B05-REQ-002 | Tabellen-/Payload-Größen werden ohne sensible Inhalte angezeigt. | Summary liefert nur Zeilenzahl und ungefähre Byte-Werte für redigierte Storage-Bereiche. |
| B05-REQ-003 | Die Matchliste zeigt nur sichere Metadaten: Match-ID, Status, Modus, Anzeigenamen, Created/Updated, Alter, StateVersion, MatchVersion, Event-/Snapshotanzahl und ungefähre Größe. | `GET /api/storage/maintenance/matches`. |
| B05-REQ-004 | Die Matchliste unterstützt Filter nach Status, Terminal, Alter, Größe und Modus. | Serverfilter plus Web-Filter auf `/maintenance`. |
| B05-REQ-005 | Die Matchdetailansicht enthält keine FullState-, Snapshot-, Event-PrivatePayload-, Token- oder Decklisten-Daten. | `GET /api/storage/maintenance/matches/:matchId` gibt nur Metadaten, Größen und Zähler aus. |
| B05-REQ-006 | Wartungsendpunkte sind lokal/private-only und nicht im Private-Internet-Profil verfügbar. | HTTP-Routen verlangen lokales Deployment-Profil und Loopback-Zugriff. |
| B05-REQ-007 | Tokens, Token-Hashes, Decklisten, CardInstances, FullState, privatePayloads und Hidden-Zone-Daten erscheinen nicht in API, DOM, Logs oder Fehlern. | Redaction-Tests prüfen API-Antworten und UI-Renderdaten. |
| B05-REQ-008 | Replay-, Health-, Matchstart-, Join-, Action-Submit- und Reconnect-Flows bleiben unverändert. | Neue Routen sind isoliert unter `/api/storage/maintenance/*`; bestehende Routen werden nicht umgebaut. |
| B05-REQ-009 | Cleanup-Preview ist Pflicht vor echter Löschung. | `POST /api/storage/maintenance/cleanup/preview` erzeugt eine redigierte Kandidatenliste mit stabiler Preview-ID aus Status-, Alters- und Limitfiltern. |
| B05-REQ-010 | Cleanup-Apply löscht nur ganze Matches und kann optional vorher ein Backup erstellen. | `POST /api/storage/maintenance/cleanup/apply` verlangt Preview-ID, revalidiert die Filter und löscht ausschließlich Match-Wurzeln mit FK-Cascade; `createBackup` ist optional. |
| B05-REQ-011 | `finished` ist kein Default für Löschung. | Die Wartungsseite startet mit Status `active` und `älter als 60 Minuten`; beendete Matches müssen bewusst ausgewählt werden. |
| B05-REQ-012 | Automatischer Cleanup ist konfigurierbar und standardmäßig aus. | Cleanup-Policy unter `/api/storage/maintenance/cleanup/policy`; wenn aktiviert, prüft der Server stündlich Status-/Altersfilter, Default 3 Tage, ohne Backup und ohne geschützte Matches. |
| B05-REQ-013 | Matches können gegen automatisches Löschen geschützt werden. | Wartungsseite und Ergebnisdialog setzen ein Retention-Schutzflag; Auto-Cleanup löscht geschützte Matches nur bei explizitem `includeProtected`. |

## Bewusste Grenzen

- Keine Einzelzeilenlöschung von Events, Snapshots, Sessions, Tokens oder Decksnapshot-Blöcken.
- Kein Restore-Button in der UI; optionale Backups werden erstellt, Wiederherstellung bleibt Betriebs-/Runbook-Aufgabe.
- Optionales `VACUUM` ist nur explizit über Apply schaltbar und nicht Default.
- Keine Archiv-Exporte.
- Keine Änderung an Engine, LegalActions, `applyAction`, Replay-Hash, Randomness, AI oder PlayerViews.

## Sicherheitsvertrag

Die Wartungs-API darf nur folgende Datenklassen ausgeben:

- technische Dateigröße und SQLite-Page-Zähler,
- aggregierte Counts und Größen,
- Match-ID, Status, Modus, MatchVersion, StateVersion, StateHash nur als Hash,
- Created/Updated und abgeleitetes Alter,
- side-sicher ableitbare Anzeigenamen aus Sessions,
- Event-/Snapshotanzahl und ungefähre Payload-Größen.

Nicht erlaubt sind:

- Session-, Reconnect-, Join- oder andere Authentifizierungswerte,
- Hashwerte solcher Authentifizierungswerte,
- Decklisten, private Decksnapshots oder einzelne Kartenlisten,
- FullState, StateSnapshot-Inhalte oder GameState-JSON,
- Event-PrivatePayloads oder Hidden-Zone-Inhalte.
