# V1.9.11 Implementation Review - Hidden-Zone Search/Reveal/Reorder und Shuffle

Status: abgeschlossen, Final Review bestanden
Stand: 2026-05-12
Primärer Agent: release-implementation-agent

## Umgesetzter Scope

Die V1.9.11-Läufe haben genau sechzehn Zielkarten an bestehende und eng ergänzte side-sichere Hidden-Zone-Pfade angeschlossen:

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

Nachtrag 2026-05-14: `Gideon's Pawnshop` war in der Erstumsetzung fälschlich als Stack-Search/Program-Reveal/Shuffle-Adapter umgesetzt. Die bestätigte lokale Textquelle lautet: Kosten 2, `Search your trash for a card and bring it into your hand.` Die Runtime nutzt jetzt einen eigenen Trash-Recovery-Resolver: Auswahl aus Runner-Heap, die gerade gespielte Pawnshop-Karte ist kein Ziel, die gewählte Karte geht in die Grip und der Stack bleibt unverändert.

Nachtrag 2026-05-14: `Self-Modifying Code` zeigte seine Aktivierung fälschlich mit 2 Credits an und zog beim Start der Fähigkeit pauschal 2 Credits ab. Die bestätigte lokale Textquelle beschreibt die Aktivierung als `Trash:`-Kosten. Die LegalAction hat nun keine Credit-Kosten, trasht `Self-Modifying Code`, öffnet anschließend die Stack-Programmauswahl und verwendet in der Web-UI ein kompaktes Label für diese Fähigkeit.

Nachtrag 2026-05-14: Die lokale Errata-Quelle `docs/source/Netrunner_Errata_v1.70.pdf` präzisiert `Self-Modifying Code`: Die Fähigkeit darf während eines ICE-Encounters genutzt werden, die Installationskosten des gefundenen Programms müssen bezahlt werden, bei nicht möglicher Installation bleibt das Programm im Stack und MU darf die Installation nicht endgültig verhindern. Runtime-Text, Catalog-Override und Resolverpfad wurden entsprechend nachgezogen; bei MU-Druck öffnet nun eine Folge-Choice zum Trashen installierter Programme.

## Geänderte Hauptbereiche

- `packages/shared/src/index.ts`: lokale WIP-Definitionen für alle 16 V1.9.11-Zielkarten ergänzt.
- `packages/engine/src/index.ts`: Runner-Event-Resolver, eng typisierte LegalAction-Pfade für installierte Runner-Helfer, `Corporate Downsizing` sowie ICE-subroutinegebundene Korp-R&D-Reveal-/Reorder-Pfade ergänzt.
- `packages/engine/src/index.test.ts`: V1.9.11-WIP-Tests für Scope, private Search-/Reorder-Choice, Replay/StateHash, Reveal, Expose, scored-Agenda-Reveal sowie ICE-subroutinegebundene R&D-Reveal-/Reorder-Pfade ergänzt.
- `packages/ai/src/index.ts`: generischer AI-Fallback für mehrteilige `select_cards`-Choices ergänzt, damit Reorder-Choices alle Pflichtoptionen legal beantworten.
- `packages/ai/src/index.test.ts`: V1.9.11-AI-Smoke für die Korp-private `Too Many Doors`-R&D-Reorder-Choice ergänzt.
- `packages/catalog/src/index.ts`: V1.9.11 Runtime-Release-Set, Manifest-Referenz, AI-Approval-Set und side-sichere Fallback-Katalogdaten ergänzt.
- `apps/web/app/api/cards/catalog-data.ts`: V1.9.11-AI-Hints in die Katalog-API aufgenommen.
- `apps/web/app/page.tsx`: sichtbare Webclient-Version auf `V1.9.11` angehoben.
- `data/scenarios/v1911-hidden-zone-wip-smoke.json`: WIP-Szenario auf die 16 abgedeckten Karten erweitert.
- `data/scenarios/v1911-hidden-zone-release-smoke.json`: versioniertes Release-Smoke-Szenario ergänzt.
- `data/ai/ai-card-hints-deck-legal-v1911.json`: AI-Hints für die vollständige 16er-Zielmenge ergänzt.
- `data/manifests/card-implementation-manifest-1.9.11.json`: Kartenfreigabe-Manifest ergänzt.
- `data/manifests/deck-legal-ai-approval-v1911-manifest.json`: AI-Approval-Manifest ergänzt.
- `data/rules/mechanics-coverage-1.9.11.json`: Mechanics-Coverage ergänzt.

## Verifikation

- `v1-9-install-and-check.ps1 -Task engine`: grün, 209 Tests.
- `v1-9-install-and-check.ps1 -Task ai`: grün, 84 Tests.
- `v1-9-install-and-check.ps1 -Task catalog`: grün, 26 Tests.
- `v1-9-install-and-check.ps1 -Task web`: grün, 76 Tests.
- `v1-9-install-and-check.ps1 -Task server`: grün, 72 Tests.
- `v1-9-install-and-check.ps1 -Task typecheck`: grün.
- `v1-9-install-and-check.ps1 -Task test`: grün; Root-Specs 49 Tests.
- `v1-9-install-and-check.ps1 -Task lint`: grün nach sequenzieller Wiederholung.
- `v1-9-install-and-check.ps1 -Task build`: grün mit bekannter nicht-blockierender Turbopack-NFT-Warnung.

## Abschluss

V1.9.11 ist fertig. Die frühere WIP-Lücke zu AI-Hints, AI-Smokes, Manifest, Coverage, Server/Web, Pflichtchecks, Final Review und Webclient-Version ist geschlossen.

## Gate-Entscheidung

Completion-Gate erfüllt. Der Automation-Cursor darf auf V1.9.12 wechseln.
