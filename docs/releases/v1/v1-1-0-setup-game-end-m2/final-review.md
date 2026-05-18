# V1.1.0 Final Review - Setup/Game-End M2 und NETGRID-Statusklarheit

Stand: 2026-05-07
Status: done

## Gate-Ergebnis

V1.1.0 ist vollständig implementiert und lokal verifiziert.

`V1_1_0_implemented: true`

`V1_1_0_verified: true`

`V1_1_0_done: true`

## Verifikationsbericht

| Gate | Ergebnis |
| --- | --- |
| `corepack pnpm lint` | pass |
| `corepack pnpm typecheck` | pass |
| `corepack pnpm test` | pass, Workspace-Tests plus Root-Specs |
| `corepack pnpm build` | pass, bekannte Turbopack-NFT-Warnung in `apps/web/next.config.ts` |
| `corepack pnpm e2e` | pass, 7 Browser-E2E-Tests |

## Finaler Befund

- Setup: explizit, deterministisch und replayfähig.
- Mulligan: private Runner-/Korp-Entscheidung, side-safe über `resolve_choice`.
- Agenda-Ziel: Produktstandard 7, in PlayerViews und UI als aktueller Wert / Zielwert sichtbar.
- Game-End: Agenda-Sieg, Korp-Deckout und Flatline sind konsolidiert.
- Runner-Deckout: nicht als neue Siegbedingung aktiviert.
- Archives-facedown: Grundlage geschützt, kein Full-Archives-Access vorgezogen.
- Identity-Setup: offene Identity in PlayerViews formalisiert.
- Multiplayer/Reconnect/KI: Setup-kompatibel und side-safe getestet.
- NETGRID-UI: sichtbares `Korp`, Rollenicons, Agenda-/Tag-Symbole, side-safe Setup-UI und aktualisierte E2E-Flows.

## Scope-Abgleich

Keine offiziellen Assets, öffentlichen Plattformfunktionen, Accounts, Matchmaking, Rankings, Turnierfunktionen, neuen Karten, neuen Mechanikfamilien oder Browser-/KI-Regelautorität wurden eingeführt.

## Bekannte Abweichungen

- Die Turbopack-NFT-Warnung beim Web-Build besteht als bekannte Build-Warnung weiter.
- E2E-Zwischenläufe deckten zuerst einen laufenden alten Next-Dev-Server und danach die notwendige Setup-Anpassung des Browser-Harnesses auf; der finale E2E-Lauf ist grün.

## Restpunkte

- Keine blockierenden Restpunkte für V1.1.0.
- Spätere Gates bleiben: Full-Archives-Access, Runner-Deckout-Regelentscheidung, Core-Damage, Prevention/Avoid/Interrupt/Replacement und weitere Karten-/Mechanikbreite.
