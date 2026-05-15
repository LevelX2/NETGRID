# V1.9.11 Final Review - Hidden-Zone Search/Reveal/Reorder und Shuffle

Status: final_review_passed
Stand: 2026-05-12
Primärer Agent: release-implementation-agent

## Scope

V1.9.11 schließt genau 16 Hidden-Zone-Zielkarten ab:

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

Keine V1.9.12+-Karte wurde vorgezogen.

## Umsetzung

Die Karten sind über bestehende und eng ergänzte side-sichere Engine-Pfade für Stack-Search, R&D-Reveal, Expose, R&D-Top-Reorder und Shuffle angeschlossen. UI, Server, KI und menschliche Spieler reichen weiterhin nur aus `LegalActions` abgeleitete `PlayerActions` ein; `applyAction` validiert Seite, `actionId`, `stateVersion`, Timing, Ziele und Choices erneut.

Nachtrag 2026-05-14: `Sneak Preview` wurde nach Quellenprüfung aus dem falschen Stack-Reveal-Adapter herausgelöst. Die Karte nutzt jetzt eine vorgelagerte Quellenwahl (`Heap` oder `Stack`), installiert das gewählte Programm kostenlos, mischt nur nach Stack-Suche und nimmt die konkrete Programm-Instanz am Runner-Zugende nur zurück, wenn sie noch installiert ist.

Nachtrag 2026-05-15: `Ice and Data's Guide to the Net` wurde nach Quellenprüfung aus dem falschen Stack-Reveal-Adapter herausgelöst. Die Karte exposed jetzt die äußersten ICE aller Data Forts mit ICE; PublicPayload und Chronik enthalten nur Expose-Definition-IDs, Server-Metadaten und Counts.

Ergänzte oder finalisierte Hauptartefakte:

- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/ai/src/index.ts`
- `packages/catalog/src/index.ts`
- `apps/web/app/api/cards/catalog-data.ts`
- `apps/web/app/page.tsx`
- `data/manifests/card-implementation-manifest-1.9.11.json`
- `data/rules/mechanics-coverage-1.9.11.json`
- `data/scenarios/v1911-hidden-zone-release-smoke.json`
- `data/ai/ai-card-hints-deck-legal-v1911.json`
- `data/manifests/deck-legal-ai-approval-v1911-manifest.json`
- `data/scenarios/ai-deck-legal-v1911-smokes.json`

Der Webclient zeigt nach Abschluss `V1.9.11`.

## Gate-Prüfung

- `human_playable`: erfüllt für alle 16 Zielkarten.
- `deck_legal`: erfüllt für alle 16 Zielkarten.
- `ai_supported`: erfüllt für alle 16 Zielkarten mit versionierten AI-Hints und AI-Smokes.
- Hidden-Info-Sicherheit: private Search-/Reorder-Choices bleiben nur der berechtigten Seite sichtbar; PlayerViews, Server-/Reconnect-Flächen und Katalog-API leaken keine gegnerischen Hidden-Zone-Daten.
- Replay/StateHash: Choice-Auflösung, Reveal, Reorder und Shuffle bleiben deterministisch.
- Runtime-/Katalog-Gate: V1.9.11-Karten sind im Runtime-Release-Set, im Manifest und in den AI-Approval-Daten konsistent nachgewiesen.

## Verifikation

- JSON-Validation der neuen V1.9.11-Artefakte: grün.
- `v1-9-install-and-check.ps1 -Task catalog`: grün, 26 Tests.
- `v1-9-install-and-check.ps1 -Task engine`: grün, 209 Tests.
- `v1-9-install-and-check.ps1 -Task ai`: grün, 84 Tests.
- `v1-9-install-and-check.ps1 -Task web`: grün, 76 Tests.
- `v1-9-install-and-check.ps1 -Task server`: grün, 72 Tests.
- `v1-9-install-and-check.ps1 -Task typecheck`: grün.
- `v1-9-install-and-check.ps1 -Task test`: grün; Workspace-Pakete plus Root-Specs, 49 Root-Tests.
- `v1-9-install-and-check.ps1 -Task lint`: grün nach sequenzieller Wiederholung.
- `v1-9-install-and-check.ps1 -Task build`: grün mit bekannter nicht-blockierender Turbopack-NFT-Warnung.

## Entscheidung

`V1_9_11_done: true`

`ready_for_V1_9_12: true`

`webclient_version: V1.9.11`

`completion_gate: passed`
