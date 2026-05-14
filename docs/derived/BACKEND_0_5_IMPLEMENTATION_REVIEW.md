# Backend 0.5 Implementation Review

Status: read-only slice implemented
Stand: 2026-05-14

## Umgesetzter Scope

Backend 0.5 ist als erster privater read-only Wartungsschnitt umgesetzt. Der Schnitt ist getrennt von der V1.9.x-Karten-/Mechaniklinie; die sichtbare Webclient-Version bleibt unverändert bei `V1.9.21`, und der laufende `V1.9.22`-Scope wird nicht promotet.

## Server

Neue lokale Endpunkte:

- `GET /api/storage/maintenance/summary`
- `GET /api/storage/maintenance/matches`
- `GET /api/storage/maintenance/matches/:matchId`

Die Endpunkte sind nur im lokalen Deployment-Profil und nur über Loopback oder private LAN-Adressen erreichbar. Im `private_internet`-Profil antworten sie mit `403 maintenance_unavailable`.

Der SQLite-Adapter liefert neue read-only Analysehelper:

- Datenbankdatei, Dateigröße, Page-Größe, Page-Count und Freelist-Count.
- Matchanzahl, Statusverteilung, Modusverteilung, Terminal/Nicht-terminal.
- Tabellen-/Payload-Größen für redigierte Storage-Bereiche.
- Sichere Matchmetadaten mit Status, Modus, Anzeigenamen aus Sessions, Created/Updated, Alter, StateVersion, MatchVersion, Event-/Snapshotanzahl und ungefähren Größen.
- Sichere Matchdetails mit zusätzlichen Tabellenzeilen und Größenanteilen.

## Web

Neue private Seite:

- `/maintenance`

Die Seite zeigt:

- DB-Größe und Match-Zähler,
- Status- und Modusverteilung,
- Tabellen-/Payload-Größen,
- größte Matches,
- Matchliste mit Filtern nach Status, Terminal, Alter, Größe und Modus,
- Matchdetailansicht,
- klar deaktivierten Cleanup-Bereich.

Der Desktop-Starter `scripts/start-netgrid.ps1` kann mit `-OpenPath "/maintenance"` die LAN-fähigen Server-/Web-Prozesse starten und danach die Wartungsseite öffnen. Wenn eine alte Serverinstanz zwar Health liefert, aber den LAN-Maintenance-Endpunkt noch nicht freigibt, startet der Wartungsaufruf den Server neu.

## Redaction und Sicherheitsgrenzen

Bewusst nicht ausgegeben werden:

- Authentifizierungswerte und deren Hashwerte,
- Decklisten und einzelne Karten aus privaten Snapshots,
- FullState, StateSnapshot-Inhalte oder `game_state_json`,
- Event-PrivatePayloads,
- Hidden-Zone-Inhalte.

Die API gibt nur Metadaten, Zähler, Hashes für normalen StateHash-Kontext und Bytegrößen aus. Bytegrößen können intern aus gespeicherten JSON-Spalten berechnet werden, die JSON-Inhalte selbst verlassen den Storage-Adapter nicht.

## Nicht umgesetzt im ersten Schnitt

- Keine echte Löschung.
- Kein Cleanup-Preview mit Preview-ID.
- Kein Backup-vor-Delete-Flow.
- Kein transaktionales Match-Delete.
- Kein `VACUUM`.
- Keine Retention-Marks oder Archiv-Exporte.

Diese Punkte bleiben gesperrt, bis Backup-, Dry-Run-, Restore- und Integrity-Tests vollständig vorliegen.

## Verifikation im Umsetzungsschnitt

Fokussiert grün:

- `corepack pnpm --filter @netgrid/server test -- src/multiplayer.test.ts`
- `corepack pnpm --filter @netgrid/server typecheck`
- `corepack pnpm --filter @netgrid/web test -- maintenance.test.ts`
- `corepack pnpm --filter @netgrid/web typecheck`

Zusätzlich verifiziert: LAN-Zugriff auf `http://192.168.178.141:8787/api/storage/maintenance/summary` liefert `200` mit redigierten Backend-0.5-Metadaten.

Pflichtchecks über vollständige Server-/Web-Testläufe folgen im Final Review.
