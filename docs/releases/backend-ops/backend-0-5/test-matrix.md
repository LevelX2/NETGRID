# Backend 0.5 Test Matrix

Status: implemented-slice-retention-cleanup
Stand: 2026-05-14

## Server

| ID | Bereich | Erwartung | Abdeckung |
| --- | --- | --- | --- |
| B05-T-SRV-001 | Summary | Datenbankgröße, Page-Info, Status-/Modusverteilung, Terminalzählung und Tabellen-/Payload-Größen werden korrekt geliefert. | `apps/server/src/multiplayer.test.ts` Backend-0.5-Tests. |
| B05-T-SRV-002 | Matchliste | Status-, Terminal-, Alter-, Größen- und Modusfilter greifen serverseitig. | `apps/server/src/multiplayer.test.ts` Backend-0.5-Tests. |
| B05-T-SRV-003 | Matchdetail | Detail liefert nur sichere Metadaten, Counts und Größen; unbekannte Match-ID ergibt side-sicheren 404. | `apps/server/src/multiplayer.test.ts` Backend-0.5-Tests. |
| B05-T-SRV-004 | Redaction | API-Antworten enthalten keine Authentifizierungswerte, keine Auth-Hashes, keine Decklisten, keine CardInstances, keine FullState-/Snapshot-Inhalte und keine PrivatePayloads. | `apps/server/src/multiplayer.test.ts` Backend-0.5-Redaction-Test. |
| B05-T-SRV-005 | Deployment-Gate | Maintenance-Routen sind im `private_internet`-Profil blockiert. | `apps/server/src/multiplayer.test.ts` Backend-0.5-Deployment-Test. |
| B05-T-SRV-006 | Cleanup-Preview | Alte aktive Matches werden per Status- und Altersfilter als ganze Match-Kandidaten gelistet; frische und nicht ausgewählte Status bleiben aus der Vorschau. | `apps/server/src/multiplayer.test.ts` Backend-0.5-Cleanup-Preview-Test. |
| B05-T-SRV-007 | Cleanup-Apply | Apply löscht nur die previewten Match-Wurzeln; Backup ist optional und andere Matches bleiben bestehen. | `apps/server/src/multiplayer.test.ts` Backend-0.5-Cleanup-Apply-Test. |
| B05-T-SRV-009 | Auto-Cleanup und Löschschutz | Geschützte Matches bleiben beim automatischen Cleanup standardmäßig erhalten; Auto-Cleanup kann ohne Backup laufen. | `apps/server/src/multiplayer.test.ts` Backend-0.5-Retention-Policy-Test. |
| B05-T-SRV-008 | Regression | Replay- und Health-Routen bleiben unverändert redigiert und erreichbar. | Bestehende Server-Tests plus Pflichtcheck `@netgrid/server test`. |

## Web

| ID | Bereich | Erwartung | Abdeckung |
| --- | --- | --- | --- |
| B05-T-WEB-001 | Filter | Status-, Terminal-, Modus-, Alter- und Größenfilter erzeugen eine korrekte Query. | `apps/web/app/maintenance.test.ts`. |
| B05-T-WEB-002 | Redaction | UI-Helper serialisieren keine verbotenen Felder oder sensitiven Marker. | `apps/web/app/maintenance.test.ts`. |
| B05-T-WEB-003 | Cleanup-Request | UI-Helper erzeugen begrenzte Cleanup-Anfragen mit Default `active` und 60 Minuten; doppelte Statuswerte werden dedupliziert. | `apps/web/app/maintenance.test.ts`. |
| B05-T-WEB-004 | Seite | `/maintenance` rendert einklappbare Bereiche, limitierte Matchliste, Detailbereich, Löschschutz und Cleanup-Preview/Policy-Bereich. | Typecheck, Web-Testlauf und Browser-Smoke. |

## Pflichtchecks

- `corepack pnpm --filter @netgrid/server test`
- `corepack pnpm --filter @netgrid/server typecheck`
- `corepack pnpm --filter @netgrid/web test`
- `corepack pnpm --filter @netgrid/web typecheck`

## Offene spätere Testfelder

- Restore-Runbook/Restore-Smoke aus erzeugtem Backup.
- Browser-Flow-Test für Preview, Bestätigung und Apply.
- Größere Retention-Presets und explizite Schutzmarkierungen.
