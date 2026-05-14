# Backend 0.5 Final Review

Status: done-read-only-slice
Stand: 2026-05-14

## Gate-Ergebnis

`BACKEND_0_5_read_only_done: true`

Der erste Backend-0.5-Schnitt ist abgeschlossen als private read-only Storage-Maintenance-Oberfläche. Der Schnitt liefert Transparenz über lokalen SQLite-Multiplayer-Storage, aber keine destruktiven Aktionen. Die sichtbare App-/Core-Version bleibt unverändert bei `V1.9.21`; der laufende `V1.9.22`-Scope wird nicht promotet.

## Existierende Endpunkte und Seite

- `GET /api/storage/maintenance/summary`
- `GET /api/storage/maintenance/matches`
- `GET /api/storage/maintenance/matches/:matchId`
- `/maintenance`

Die Endpunkte sind im lokalen Deployment-Profil auf Loopback und private LAN-Adressen beschränkt. Im `private_internet`-Profil sind sie blockiert.

## Sichtbare Daten

- Datenbankdateiname, Dateigröße, Page-Größe, Page-Count und Freelist-Count.
- Schema-Version und Storage-Format.
- Matchanzahl, Status-/Modusverteilung, Terminal/Nicht-terminal.
- Tabellen-/Payload-Größen als Zeilenzahl und ungefähre Bytewerte.
- Match-ID, Status, Modus, sichere Anzeigenamen aus Sessions, Created/Updated, Alter, StateVersion, MatchVersion, StateHash, Event-/Snapshotanzahl und ungefähre Größen.
- Detailansicht mit redigierten Tabellenzeilen und Größenanteilen.

## Bewusst nicht sichtbar

- Authentifizierungswerte und deren Hashwerte.
- Decklisten oder einzelne Karten aus privaten Snapshots.
- FullState, StateSnapshot-Inhalte oder `game_state_json`.
- Event-PrivatePayloads.
- Hidden-Zone-Inhalte.

## Verifikation

Grün:

- `corepack pnpm --filter @netgrid/server test` (75 Tests)
- `corepack pnpm --filter @netgrid/server typecheck`
- `corepack pnpm --filter @netgrid/web test` (105 Tests)
- `corepack pnpm --filter @netgrid/web typecheck`
- Browser-Smoke mit frischem Backend-0.5-Server und bestehendem Webclient: `/maintenance` zeigt Heading, DB-Größe, Matchliste und den deaktivierten Cleanup-Bereich; kein Routenfehler; Seitentext enthält keine verbotenen Redaction-Marker.
- LAN-Smoke nach Desktop-Starter-Ergänzung: `http://192.168.178.141:8787/api/storage/maintenance/summary` liefert `200`, und `NETGRID Wartung.lnk` startet bei Bedarf Server/Web und öffnet `http://192.168.178.141:3100/maintenance`.

## Offene Backend-0.5-Punkte

- Cleanup-Preview mit Dry-Run und stabiler Preview-ID.
- Backup-Pflicht vor echter Löschung.
- Transaktionales Löschen nur ganzer Matches.
- Revalidierung der Filter unmittelbar vor Apply.
- Restore-/Integrity-Check nach Delete.
- Optionales `VACUUM`.
- Presets für stale Lobbys und nicht-terminale alte Matches.
- Selektive Terminal-Match-Löschung, wobei `finished` nie Default wird.
