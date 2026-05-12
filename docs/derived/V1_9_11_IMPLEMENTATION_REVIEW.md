# V1.9.11 Implementation Review - Hidden-Zone Search/Reveal/Reorder und Shuffle

Status: WIP, nicht release-abgeschlossen
Stand: 2026-05-12
Primärer Agent: release-implementation-agent

## Umgesetzter WIP-Scope

Die bisherigen Läufe haben den Engine-WIP für V1.9.11 erweitert. Genau sechzehn Zielkarten sind als WIP an bestehende side-sichere Hidden-Zone-Pfade angeschlossen:

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
- `onr_v1_250_ice-pick-willie`
- `onr_v1_272_too-many-doors`

Die Karten nutzen vorhandene und eng ergänzte LegalAction-/PendingChoice-Verträge für Stack-Search, R&D-Reveal, Expose und Reorder. Search-/Reorder-Choices bleiben nur der berechtigten Seite sichtbar; die Gegenseite sieht keine PendingChoice-Daten. Reveal/Expose publizieren nur die ausdrücklich erlaubte Kartendefinition. `Ice Pick Willie` und `Too Many Doors` sind als subroutinegebundene ICE-Pfade angebunden: `Ice Pick Willie` revealt nur die R&D-Spitze öffentlich, `Too Many Doors` öffnet eine Korp-private R&D-Top-2-Reorder-Choice und replayt deterministisch.

## Geänderte Hauptbereiche

- `packages/shared/src/index.ts`: lokale WIP-Definitionen für alle 16 V1.9.11-Zielkarten ergänzt.
- `packages/engine/src/index.ts`: Runner-Event-Resolver, eng typisierte LegalAction-Pfade für installierte Runner-Helfer, `Corporate Downsizing` sowie ICE-subroutinegebundene Korp-R&D-Reveal-/Reorder-Pfade ergänzt.
- `packages/engine/src/index.test.ts`: V1.9.11-WIP-Tests für Scope, private Search-/Reorder-Choice, Replay/StateHash, Reveal, Expose, scored-Agenda-Reveal sowie ICE-subroutinegebundene R&D-Reveal-/Reorder-Pfade ergänzt.
- `packages/ai/src/index.ts`: generischer AI-Fallback für mehrteilige `select_cards`-Choices ergänzt, damit Reorder-Choices alle Pflichtoptionen legal beantworten.
- `packages/ai/src/index.test.ts`: V1.9.11-AI-Smoke für die Korp-private `Too Many Doors`-R&D-Reorder-Choice ergänzt.
- `data/scenarios/v1911-hidden-zone-wip-smoke.json`: WIP-Szenario auf die 16 abgedeckten Karten erweitert.

## Verifikation

- `v1-9-install-and-check.ps1 -Task engine`: grün, 209 Tests.
- `v1-9-install-and-check.ps1 -Task ai`: grün, 84 Tests.
- `v1-9-install-and-check.ps1 -Task catalog`: grün, 25 Tests.
- `v1-9-install-and-check.ps1 -Task typecheck`: grün.

## Nicht abgeschlossen

V1.9.11 ist nicht fertig und darf noch nicht als abgeschlossen gelten. Offen bleiben:

- AI-Hints und versionierte AI-Smoke-Daten für die vollständige 16er-Zielmenge,
- Manifest, Mechanics-Coverage und Szenario-Artefakte,
- Server-/Reconnect-/Web-Abdeckung für neue Choice-Flächen,
- vollständiger Pflichtchecklauf inklusive AI, Web, Server, Test, Lint und Build.

## Gate-Entscheidung

Completion-Gate nicht erfüllt. Der Automation-Cursor bleibt auf V1.9.11 in Phase `implementing`.
