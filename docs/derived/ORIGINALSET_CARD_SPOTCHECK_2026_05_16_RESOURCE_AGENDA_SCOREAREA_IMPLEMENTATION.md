# Originalset-Spotcheck 2026-05-16 Resource/Agenda ScoreArea

Job: `spotcheck-2026-05-16-resource-agenda-scorearea`

## Ergebnis

Der Job wurde fachlich umgesetzt. Die ausgewählten Runner-Resources und Corp-Agendas wurden gegen Side-/StateVersion-Revalidation, Source-Drift, ScoreArea-Bindung, Damage-Prevention-Choices, PublicPayload-Leaks sowie Replay/StateHash geprüft.

Commit-Status: `committed`. Der vorherige lokale Commit-Blocker beim Erstellen von `.git/index.lock` ist in diesem Abschlusslauf nicht mehr aufgetreten.

## Umgesetzte Härtungen

- Runner-Resource-Aktionen mit `resourceAbility` nennen ihre sichtbare installierte Quelle in öffentlichen Events.
- Silicon Saloon Franchise revalidiert die installierte Quelle gegen die konkrete Kartendefinition und schreibt Credit-/Draw-Ergebnisse payloadfähig.
- Short-Term Contract wurde gegen Wrong-Side, stale `stateVersion`, entfernte Quelle, Counter-Abzug, Auto-Payload und Replay/StateHash nachgetestet.
- Technician Lover wurde als sichtbare installierte Resource in der öffentlichen Install-Chronik geprüft.
- Top Runners' Conference wurde für Start-of-turn-Credits, Run-Start-Trash und Replay/StateHash geprüft.
- Trauma Team und Umbrella Policy wurden als source-bound Damage-Prevention-Choices mit öffentlichem Prevention-Ergebnis geprüft.
- Employee Empowerment wurde als ScoreArea-Start-of-Corp-turn-Credit geprüft.
- Marine Arcology wurde als ScoreArea-Aktion gegen entfernte Quelle, PublicPayload und Replay/StateHash geprüft.
- Project Babylon veröffentlicht Overadvance- und Bonus-Agenda-Punkte explizit im PublicPayload-Kontext.
- Tycho Extension wurde im Score-Pfad mit Wrong-Side/Stale-Abdeckung, PublicPayload und Replay/StateHash geprüft.
- Der bestehende Playful-AI-Test wurde auf eine deterministische Choice-Seed und die aktuellen Choice-Optionen korrigiert, damit der Engine-Gesamtlauf wieder stabil prüft.

## Verifikation

- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm typecheck`

Alle genannten Checks sind grün. Der lokale Commit-Blocker ist in diesem Abschlusslauf nicht mehr aufgetreten.
