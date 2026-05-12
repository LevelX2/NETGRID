# V1.9.11 Implementation Review - Hidden-Zone Search/Reveal/Reorder und Shuffle

Status: WIP, nicht release-abgeschlossen
Stand: 2026-05-12
Primärer Agent: release-implementation-agent

## Umgesetzter WIP-Scope

Dieser Lauf hat den ersten Engine-Schnitt für V1.9.11 umgesetzt. Genau sechs Runner-Eventkarten sind als WIP an bestehende side-sichere Hidden-Zone-Pfade angeschlossen:

- `onr_v1_087_forgotten-backup-chip`
- `onr_v1_088_fortress-respecification`
- `onr_v1_089_gideons-pawnshop`
- `onr_v1_092_ice-and-datas-guide-to-the-net`
- `onr_v1_099_mantis-fixer-at-large`
- `onr_v1_110_sneak-preview`

Die Karten nutzen vorhandene LegalAction-/PendingChoice-Verträge für Stack-Search, Reveal und Expose. Search-Choices bleiben nur der Runner-Seite sichtbar; die Korp sieht keine PendingChoice-Daten. Reveal/Expose publizieren nur die ausdrücklich erlaubte Kartendefinition.

## Geänderte Hauptbereiche

- `packages/shared/src/index.ts`: lokale WIP-Definitionen für die sechs V1.9.11-Eventkarten ergänzt.
- `packages/engine/src/index.ts`: Runner-Event-Resolver für Search, Reveal und Expose ergänzt.
- `packages/engine/src/index.test.ts`: V1.9.11-WIP-Tests für Scope, private Search-Choice, Replay/StateHash, Reveal und Expose ergänzt.

## Verifikation

- `v1-9-install-and-check.ps1 -Task engine`: grün, 205 Tests.
- `v1-9-install-and-check.ps1 -Task catalog`: grün, 25 Tests.
- `v1-9-install-and-check.ps1 -Task typecheck`: grün.

## Nicht abgeschlossen

V1.9.11 ist nicht fertig und darf noch nicht als abgeschlossen gelten. Offen bleiben:

- die zehn weiteren Zielkarten aus dem V1.9.11-Scope,
- installierte Programm-/Resource-Helferfähigkeiten,
- `Corporate Downsizing`, `Ice Pick Willie` und `Too Many Doors`,
- AI-Hints und AI-Smokes für die vollständige 16er-Zielmenge,
- Manifest, Mechanics-Coverage und Szenario-Artefakte,
- Server-/Reconnect-/Web-Abdeckung für neue Choice-Flächen,
- vollständiger Pflichtchecklauf inklusive AI, Web, Server, Test, Lint und Build.

## Gate-Entscheidung

Completion-Gate nicht erfüllt. Der Automation-Cursor bleibt auf V1.9.11 in Phase `implementing`.
