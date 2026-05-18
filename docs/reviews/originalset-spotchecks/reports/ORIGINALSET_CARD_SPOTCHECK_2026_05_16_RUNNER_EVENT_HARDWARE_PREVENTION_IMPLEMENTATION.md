# Originalset-Spotcheck 2026-05-16 Runner Event/Hardware Prevention

Job: `spotcheck-2026-05-16-runner-event-hardware-prevention`

## Ergebnis

Der Job wurde fachlich umgesetzt. Die ausgewählten Runner-Events sowie Hardware-/Prevention-Karten wurden gegen Event-Source-Drift, Side-/StateVersion-Revalidation, Hidden-Zone-Payloads, Damage-Prevention-Choices, PublicPayload-Leaks und Replay/StateHash geprüft.

Commit-Status: `done`. Der lokale Commit wurde erfolgreich erstellt.

## Umgesetzte Härtungen

- `Score!` schreibt seinen Brutto-Creditgewinn und den Runner-Creditstand in den PublicPayload-Kontext.
- `Total Genetic Retrofit` schreibt entfernte Tags und den Runner-Tagstand nach Resolve payloadfähig.
- `Social Engineering` nennt den öffentlichen Runmarker im Eventpayload, ohne interne Server-IDs zu veröffentlichen.
- `Terrorist Reprisal` veröffentlicht nur die Anzahl der zufällig abgelegten HQ-Karten, keine Kartendefinitionen oder Instanz-IDs.
- `MIT West Tier` wurde gegen entfernte Quelle, Special-Zone-Bewegung, Hidden-Zone-Payload und Replay/StateHash nachgetestet.
- `Open-Ended Mileage Program` wurde gegen entfernte Quelle, Tag-Removal, öffentliche Return-Choice und Replay/StateHash geprüft.
- `Temple Microcode Outlet` wurde als private Stack-Suche mit Hidden-Zone-Barriere und Replay/StateHash geprüft.
- `Armadillo Armored Road Home` und `Drifter Mobile Environment` wurden als öffentliche Hardware-Installationen ohne private Payload-Leaks geprüft.
- `Dermatech Bodyplating` wurde als source-bound Meat-Damage-Prevention-Choice mit Replay/StateHash geprüft.

## Verifikation

- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm typecheck`

Alle genannten Checks sind grün.
