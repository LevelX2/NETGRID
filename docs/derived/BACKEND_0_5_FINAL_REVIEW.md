# Backend 0.5 Final Review

Status: done-retention-cleanup-slice
Stand: 2026-05-14

## Gate-Ergebnis

`BACKEND_0_5_retention_cleanup_done: true`

Backend 0.5 ist als private Storage-Maintenance-Oberfläche mit Cleanup-Preview/Apply, optionalem Backup, stündlicher Auto-Cleanup-Policy und Löschschutz abgeschlossen. Die sichtbare App-/Core-Version bleibt unverändert; der laufende Karten-/Mechanik-Scope wird nicht promotet.

## Existierende Endpunkte und Seite

- `GET /api/storage/maintenance/summary`
- `GET /api/storage/maintenance/matches`
- `GET /api/storage/maintenance/matches/:matchId`
- `POST /api/storage/maintenance/cleanup/preview`
- `POST /api/storage/maintenance/cleanup/apply`
- `GET/POST /api/storage/maintenance/cleanup/policy`
- `POST /api/storage/maintenance/cleanup/policy/run`
- `POST /api/storage/maintenance/matches/:matchId/retention-protection`
- `/maintenance`

Die Endpunkte sind im lokalen Deployment-Profil auf Loopback und private LAN-Adressen beschränkt. Im `private_internet`-Profil sind sie blockiert.

## Sichtbare Daten

- Datenbankdateiname, Dateigröße, Page-Größe, Page-Count und Freelist-Count.
- Schema-Version und Storage-Format.
- Matchanzahl, Status-/Modusverteilung, Terminal/Nicht-terminal.
- Tabellen-/Payload-Größen als Zeilenzahl und ungefähre Bytewerte.
- Match-ID, Status, Modus, sichere Anzeigenamen aus Sessions, Created/Updated, Alter, StateVersion, MatchVersion, StateHash, Event-/Snapshotanzahl und ungefähre Größen.
- Detailansicht mit redigierten Tabellenzeilen und Größenanteilen.
- Cleanup-Vorschau mit ausgewählten Statuswerten, Altersgrenze, Matchlimit, Trefferanzahl, Warnungen, Preview-ID und redigierten Kandidaten.
- Cleanup-Ergebnis mit gelöschter Matchanzahl, gelöschten Match-IDs, optionaler Backup-ID/-Verzeichnis, Integritätsstatus und Datenbankgrößen vor/nach Delete.
- Auto-Cleanup-Policy mit Intervall, Status-/Alters-/Limitfiltern, Backup-/Vacuum-Option und letztem Lauf.
- Löschschutzstatus pro Match.

## Bewusst nicht sichtbar

- Authentifizierungswerte und deren Hashwerte.
- Decklisten oder einzelne Karten aus privaten Snapshots.
- FullState, StateSnapshot-Inhalte oder `game_state_json`.
- Event-PrivatePayloads.
- Hidden-Zone-Inhalte.
- Einzelne Events, Snapshots, Sessions, Tokens oder Decksnapshot-Inhalte als löschbare Einzelobjekte.

## Verifikation

Grün:

- `corepack pnpm --filter @netgrid/server test` (80 Tests)
- `corepack pnpm --filter @netgrid/server typecheck`
- `corepack pnpm --filter @netgrid/web test` (112 Tests)
- `corepack pnpm --filter @netgrid/web typecheck`
- Cleanup-Preview/Apply-Tests: alte aktive Matches werden previewed, Apply löscht nur ganze Match-Wurzeln und lässt frische Matches bestehen.
- Auto-Cleanup-/Löschschutz-Test: geschützte Matches bleiben standardmäßig erhalten; Auto-Cleanup kann ohne Backup laufen.
- Browser-Smoke: `/maintenance` startet mit eingeklappten Bereichen, zeigt nach Aufklappen Matchlisten-Limit, Löschschutzspalte, Auto-Cleanup-Policy, optionale Backup-Schalter und keine verbotenen Redaction-Marker.

## Offene Backend-0.5-Punkte

- Restore-Runbook und Restore-Smoke aus optional erzeugtem Backup.
- Browser-Flow-Test für Preview, Bestätigung und Apply.
- Komfort-Presets für stale Lobbys und nicht-terminale alte Matches.
- Schutzmarkierungen für Matches, die bewusst nie automatisch gelöscht werden sollen.
