# V1.9.16 Requirements Review

Stand: 2026-05-13
Status: implementation_wip_reviewed

## Ergebnis

`ready_for_implementation: true`

Die Anforderungen fuer V1.9.16 sind fuer einen engen Implementation-Slice ausreichend. Der Scope ist auf genau 16 Karten beschraenkt und nutzt bestehende Engine-Vertraege fuer Installation, Hosting, Recurring, Trace/Link, Damage und installed-card trash.

## Risiken

- Link-/Trace-Beitraege duerfen nur aus PlayerView-sicheren, installierten Karten entstehen.
- Hosting- und Destroy-Folgen brauchen enge Target-Validierung, damit keine verdeckten Zonen in PublicEvents gelangen.
- Stealth/Recurring darf keine neuen Credits akkumulieren und muss turnstart-deterministisch bleiben.

## Freigabe

Der release-implementation-agent darf Runtime-WIP, Engine-Smokes, Datenartefakte und KI-Hints fuer V1.9.16 umsetzen. Releasepromotion bleibt bis zu gruenem Completion-Gate gesperrt.

## WIP-Zwischenstand 2026-05-13 08:26 CEST

- Link-/Trace-Beitraege aus installierten V1.9.16-Karten sind in einem side-sicheren Fragmentation-Storm-Smoke abgedeckt.
- Stealth-/Recurring-Refresh ist fuer Invisibility und Raven Microcyb Eagle abgedeckt.
- Fragmentation Storm nutzt ein Trace-Erfolgsgate ohne Tag-Effekt; Programm-Trash und Net Damage laufen nur nach erfolgreichem Trace.
- Hosting-Lifecycle, Replay/StateHash und AI-Support bleiben vor Releasepromotion offen.
