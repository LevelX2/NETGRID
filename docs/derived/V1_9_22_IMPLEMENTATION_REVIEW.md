# V1.9.22 Implementation Review

Stand: 2026-05-13
Status: planning/catalog WIP

## Umgesetzter Schnitt

- Detailplan, Requirements, Spezifikation, Testmatrix und Requirements Review sind erstellt.
- Der Scope ist auf 47 Zielkarten festgelegt.
- `packages/catalog/src/index.ts` fuehrt `ONR_V1_9_22_WIP_CARD_IDS` als exakte Zielmenge.
- `packages/catalog/src/index.test.ts` schuetzt die Zielmenge und bestaetigt, dass V1.9.22 noch nicht im Runtime-Releasepool steht.
- WIP-Datenartefakte ohne Promotion sind angelegt: `data/scenarios/v1922-per-card-longtail-wip-smoke.json`, `data/manifests/card-implementation-manifest-1.9.22.json` und `data/rules/mechanics-coverage-1.9.22.json`.
- Neun Runner-Hardware-Zielkarten haben Runtime-Definitionen mit finalen display-only Texten, ohne Release- oder AI-Promotion: Arasaka Portable Prototype, Artemis 2020, Bodyweight Data Creche, Corolla Speed Chip, Microtech Backup Drive, Pandora's Deck, Parraline 5750, PK-6089a und ZZ22 Speed Chip.
- Alle neun Runner-Hardware-Zielkarten haben Install-LegalAction-Smokes mit Wrong-Side-/Stale-Revalidation, side-sicheren PublicPayload-/PlayerView-Assertions und Replay-/StateHash-Stabilitaet.
- Zehn Runner-Event-Zielkarten haben Runtime-Definitionen mit finalen display-only Texten und einen expliziten No-`play_event`-Promotion-Guard, bis konkrete Event-Resolver vorliegen: Anonymous Tip, Core Command: Jettison Ice, Forged Activation Orders, If You Want It Done Right..., misc.for-sale, Open-Ended Mileage Program, Organ Donor, Security Code WORM Chip, Synchronized Attack on HQ und Valu-Pak Software Bundle.
- Keine V1.9.22-Karte wurde Runtime-, Catalog- oder AI-promotet.

## Gate

`V1_9_22_done: false`
`V1_9_22_phase: implementing`

## Naechster Schnitt

Naechster kleiner Schnitt: ein echter Runner-Event-Resolver/LegalAction-Smoke fuer den Event-Cluster oder Runtime-WIP fuer die Runner-Programmgruppe.

## Verifikation

- JSON-Validation fuer `data/**/*.json`: pass, 302 Dateien.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 275 Tests inkl. 9/9 Runner-Hardware-Install-Smokes und Runner-Event-No-Promotion-Guard.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 36 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
