# V1.9.12 Implementation Review - WIP

Stand: 2026-05-13 00:08 CEST
Status: implementing

## Umgesetzter WIP-Scope

- V1.9.12 ist aus `planned` in `implementing` ueberfuehrt.
- Detailplan, Requirements, Counter/Virus/Recurring-Spec, Testmatrix und Requirements Review sind versioniert.
- Alle elf Zielkarten haben Runtime-Definitionen in `packages/shared/src/index.ts`.
- Die Engine nutzt vorhandene Counter-, Virus-/Purge- und Recurring-Helfer fuer den ersten WIP-Schnitt:
  - Virus-Programme erhalten beim Installieren Virus-Counter.
  - Recurring-Counter werden auf Programmen und Resources initialisiert.
  - Purge entfernt nur Virus-Counter und laesst Recurring-Counter stehen.
  - I Spy, Deal with Militech und Hunt Club BBS nutzen side-sichere Hidden-Zone-Pfade.
  - Detroit Police Contract nutzt einen typisierten scored-Agenda-Counter-Pfad.
  - Employee Empowerment nutzt einen scored-Agenda-Start-of-turn-Economy-Pfad.

## Noch nicht abgeschlossen

- Keine finale Katalog-/Manifest-/Coverage-/AI-Promotion.
- Keine Webclient-Version auf V1.9.12 angehoben.
- Exakte per-card Textparitaet muss vor Final Gate gegen die fuehrenden lokalen Quellen/Matrix nachgezogen werden.
- Server/Web/AI-Smokes und volle Pflichtchecks stehen noch aus.

## Verifikation

- `v1-9-install-and-check.ps1 -Task engine`: pass, 213 Tests.
- `v1-9-install-and-check.ps1 -Task catalog`: pass, 26 Tests.
- `v1-9-install-and-check.ps1 -Task ai`: pass, 84 Tests.
- `v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `v1-9-install-and-check.ps1 -Task typecheck`: pass.

## Gate-Status

`V1_9_12_done: false`

`V1_9_12_phase: implementing`
