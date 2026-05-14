# Backend 0.5 Requirements

Status: implemented-slice-read-only
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
| B05-REQ-009 | Destruktive Löschung bleibt im ersten Schnitt deaktiviert. | Die UI zeigt einen klar markierten Cleanup-Bereich „noch nicht aktiv“; es gibt keine Apply-Route. |

## Bewusste Grenzen

- Keine echte Löschung in diesem ersten Schnitt.
- Kein Cleanup-Dry-Run mit Preview-ID.
- Kein Backup-vor-Delete-Flow.
- Kein `VACUUM`.
- Keine Retention-Marks oder Archiv-Exporte.
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
