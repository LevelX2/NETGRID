# Backend 0.5 Implementation Review

Status: retention-cleanup slice implemented
Stand: 2026-05-14

## Umgesetzter Scope

Backend 0.5 ist als privater Wartungsschnitt umgesetzt und hat nach dem read-only Dashboard jetzt Cleanup-Preview/Apply, optionales Backup, stündlichen Auto-Cleanup und Löschschutz. Der Schnitt ist getrennt von der V1.9.x-Karten-/Mechaniklinie; die sichtbare Webclient-Version bleibt unverändert, und der laufende Karten-/Mechanik-Scope wird nicht promotet.

## Server

Neue lokale Endpunkte:

- `GET /api/storage/maintenance/summary`
- `GET /api/storage/maintenance/matches`
- `GET /api/storage/maintenance/matches/:matchId`
- `POST /api/storage/maintenance/cleanup/preview`
- `POST /api/storage/maintenance/cleanup/apply`
- `GET/POST /api/storage/maintenance/cleanup/policy`
- `POST /api/storage/maintenance/cleanup/policy/run`
- `POST /api/storage/maintenance/matches/:matchId/retention-protection`

Die Endpunkte sind nur im lokalen Deployment-Profil und nur über Loopback oder private LAN-Adressen erreichbar. Im `private_internet`-Profil antworten sie mit `403 maintenance_unavailable`.

Der SQLite-Adapter liefert neue read-only Analysehelper:

- Datenbankdatei, Dateigröße, Page-Größe, Page-Count und Freelist-Count.
- Matchanzahl, Statusverteilung, Modusverteilung, Terminal/Nicht-terminal.
- Tabellen-/Payload-Größen für redigierte Storage-Bereiche.
- Sichere Matchmetadaten mit Status, Modus, Anzeigenamen aus Sessions, Created/Updated, Alter, StateVersion, MatchVersion, Event-/Snapshotanzahl und ungefähren Größen.
- Sichere Matchdetails mit zusätzlichen Tabellenzeilen und Größenanteilen.
- Cleanup-Preview mit Status-, Alters- und Limitfiltern, stabiler Preview-ID, Warnungen und redigierter Matchkandidatenliste.
- Cleanup-Apply mit optionalem Backup, Preview-Revalidierung, transaktionalem Delete ganzer Match-Wurzeln, FK-Cascade, Integrity-Check und optionalem `VACUUM`.
- Stündliche Auto-Cleanup-Policy: standardmäßig aus, bei Aktivierung Default 3 Tage, ohne Backup, geschützte Matches ausgenommen.

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
- Standardmäßig eingeklappte Wartungsbereiche.
- Matchliste mit Default-Limit 50; leeres Limit lädt bewusst alle Matches.
- Cleanup-Bereich mit Statusauswahl, Altersgrenze, Matchlimit, optionalem Backup, Vorschau, Pflichtbestätigung, Auto-Cleanup-Policy und Löschschutz.
- Ergebnisdialog in der Spieloberfläche mit Schalter „Spiel aufheben“.

Der Desktop-Starter `scripts/start-netgrid.ps1` kann mit `-OpenPath "/maintenance"` die LAN-fähigen Server-/Web-Prozesse starten und danach die Wartungsseite öffnen. Wenn eine alte Serverinstanz zwar Health liefert, aber den LAN-Maintenance-Endpunkt noch nicht freigibt, startet der Wartungsaufruf den Server neu.

## Redaction und Sicherheitsgrenzen

Bewusst nicht ausgegeben werden:

- Authentifizierungswerte und deren Hashwerte,
- Decklisten und einzelne Karten aus privaten Snapshots,
- FullState, StateSnapshot-Inhalte oder `game_state_json`,
- Event-PrivatePayloads,
- Hidden-Zone-Inhalte.

Die API gibt nur Metadaten, Zähler, Hashes für normalen StateHash-Kontext und Bytegrößen aus. Bytegrößen können intern aus gespeicherten JSON-Spalten berechnet werden, die JSON-Inhalte selbst verlassen den Storage-Adapter nicht.

## Weiter bewusst begrenzt

- Keine Einzelzeilenlöschung von Events, Snapshots, Sessions, Tokens oder Decksnapshot-Blöcken.
- Kein Restore-Button in der Wartungsseite.
- Keine Retention-Marks oder Archiv-Exporte.

Backups sind optional; Restore bleibt als separater Betriebs-/Runbook-Schritt offen.

## Verifikation im Umsetzungsschnitt

Grün:

- `corepack pnpm --filter @netgrid/server test`
- `corepack pnpm --filter @netgrid/server typecheck`
- `corepack pnpm --filter @netgrid/web test`
- `corepack pnpm --filter @netgrid/web typecheck`

Zusätzlich verifiziert: Cleanup-Preview/Apply löschen in Tests nur alte aktive Whole-Match-Kandidaten; Auto-Cleanup respektiert Löschschutz und kann ohne Backup laufen.
Browser-Smoke auf `/maintenance`: Bereiche starten eingeklappt; Matchlisten-Limit, Löschschutzspalte, Auto-Cleanup-Policy und optionale Backup-Schalter sind nach Aufklappen sichtbar; keine verbotenen Redaction-Marker im Seitentext.
