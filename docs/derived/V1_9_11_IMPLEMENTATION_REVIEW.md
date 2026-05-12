# V1.9.11 Implementation Review - Hidden-Zone Search/Reveal/Reorder und Shuffle

Status: WIP, nicht release-abgeschlossen
Stand: 2026-05-12
Primärer Agent: release-implementation-agent

## Umgesetzter WIP-Scope

Die bisherigen Läufe haben den Engine-WIP für V1.9.11 erweitert. Genau vierzehn Zielkarten sind als WIP an bestehende side-sichere Hidden-Zone-Pfade angeschlossen:

- `onr_v1_042_mouse`
- `onr_v1_058_seeya`
- `onr_v1_059_self-modifying-code`
- `onr_v1_087_forgotten-backup-chip`
- `onr_v1_088_fortress-respecification`
- `onr_v1_089_gideons-pawnshop`
- `onr_v1_092_ice-and-datas-guide-to-the-net`
- `onr_v1_099_mantis-fixer-at-large`
- `onr_v1_110_sneak-preview`
- `onr_v1_151_aujourdoui`
- `onr_v1_169_n-e-t-o`
- `onr_v1_175_ronin-around`
- `onr_v1_177_the-short-circuit`
- `onr_v1_194_corporate-downsizing`

Die Karten nutzen vorhandene LegalAction-/PendingChoice-Verträge für Stack-Search, Reveal, Expose und Reorder. Search-/Reorder-Choices bleiben nur der berechtigten Seite sichtbar; die Gegenseite sieht keine PendingChoice-Daten. Reveal/Expose publizieren nur die ausdrücklich erlaubte Kartendefinition.

## Geänderte Hauptbereiche

- `packages/shared/src/index.ts`: lokale WIP-Definitionen für 14 V1.9.11-Zielkarten ergänzt.
- `packages/engine/src/index.ts`: Runner-Event-Resolver sowie eng typisierte LegalAction-Pfade für installierte Runner-Helfer und `Corporate Downsizing` ergänzt.
- `packages/engine/src/index.test.ts`: V1.9.11-WIP-Tests für Scope, private Search-/Reorder-Choice, Replay/StateHash, Reveal, Expose und scored-Agenda-Reveal ergänzt.
- `data/scenarios/v1911-hidden-zone-wip-smoke.json`: WIP-Szenario auf die 14 abgedeckten Karten erweitert.

## Verifikation

- `v1-9-install-and-check.ps1 -Task engine`: grün, 207 Tests.
- `v1-9-install-and-check.ps1 -Task catalog`: grün, 25 Tests.
- `v1-9-install-and-check.ps1 -Task typecheck`: grün.

## Nicht abgeschlossen

V1.9.11 ist nicht fertig und darf noch nicht als abgeschlossen gelten. Offen bleiben:

- die zwei weiteren Zielkarten aus dem V1.9.11-Scope: `Ice Pick Willie` und `Too Many Doors`,
- ICE-subroutinegebundene Hidden-Zone-Pfade,
- AI-Hints und AI-Smokes für die vollständige 16er-Zielmenge,
- Manifest, Mechanics-Coverage und Szenario-Artefakte,
- Server-/Reconnect-/Web-Abdeckung für neue Choice-Flächen,
- vollständiger Pflichtchecklauf inklusive AI, Web, Server, Test, Lint und Build.

## Gate-Entscheidung

Completion-Gate nicht erfüllt. Der Automation-Cursor bleibt auf V1.9.11 in Phase `implementing`.
