# Backend 0.5 Test Matrix

Status: implemented-slice-read-only
Stand: 2026-05-14

## Server

| ID | Bereich | Erwartung | Abdeckung |
| --- | --- | --- | --- |
| B05-T-SRV-001 | Summary | Datenbankgröße, Page-Info, Status-/Modusverteilung, Terminalzählung und Tabellen-/Payload-Größen werden korrekt geliefert. | `apps/server/src/multiplayer.test.ts` Backend-0.5-Tests. |
| B05-T-SRV-002 | Matchliste | Status-, Terminal-, Alter-, Größen- und Modusfilter greifen serverseitig. | `apps/server/src/multiplayer.test.ts` Backend-0.5-Tests. |
| B05-T-SRV-003 | Matchdetail | Detail liefert nur sichere Metadaten, Counts und Größen; unbekannte Match-ID ergibt side-sicheren 404. | `apps/server/src/multiplayer.test.ts` Backend-0.5-Tests. |
| B05-T-SRV-004 | Redaction | API-Antworten enthalten keine Authentifizierungswerte, keine Auth-Hashes, keine Decklisten, keine CardInstances, keine FullState-/Snapshot-Inhalte und keine PrivatePayloads. | `apps/server/src/multiplayer.test.ts` Backend-0.5-Redaction-Test. |
| B05-T-SRV-005 | Deployment-Gate | Maintenance-Routen sind im `private_internet`-Profil blockiert. | `apps/server/src/multiplayer.test.ts` Backend-0.5-Deployment-Test. |
| B05-T-SRV-006 | Regression | Replay- und Health-Routen bleiben unverändert redigiert und erreichbar. | Bestehende Server-Tests plus Pflichtcheck `@netgrid/server test`. |

## Web

| ID | Bereich | Erwartung | Abdeckung |
| --- | --- | --- | --- |
| B05-T-WEB-001 | Filter | Status-, Terminal-, Modus-, Alter- und Größenfilter erzeugen eine korrekte Query. | `apps/web/app/maintenance.test.ts`. |
| B05-T-WEB-002 | Redaction | UI-Helper serialisieren keine verbotenen Felder oder sensitiven Marker. | `apps/web/app/maintenance.test.ts`. |
| B05-T-WEB-003 | Seite | `/maintenance` rendert Übersicht, Tabellen-/Payload-Größen, größte Matches, Matchliste, Detailbereich und deaktivierten Cleanup-Hinweis. | Typecheck und Web-Testlauf. |

## Pflichtchecks

- `corepack pnpm --filter @netgrid/server test`
- `corepack pnpm --filter @netgrid/server typecheck`
- `corepack pnpm --filter @netgrid/web test`
- `corepack pnpm --filter @netgrid/web typecheck`

## Offene spätere Testfelder

- Cleanup-Preview-Dry-Run.
- Backup-Pflicht vor Delete.
- Transaktionales Match-Delete mit FK-Cascade.
- Optionales `VACUUM`.
- Restore-/Integrity-Gate nach Apply.
