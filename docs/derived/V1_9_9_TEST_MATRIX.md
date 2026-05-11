# V1.9.9 Test Matrix – Upgrade-Mechanik-Sprint

## Scope

V1.9.9 deckt exakt diese vier Upgrade-Karten ab:

1. `onr_v1_349_aardvark`
2. `onr_v1_351_bizarre-encryption-scheme`
3. `onr_v1_352_chester-mix`
4. `onr_v1_353_chimera`

## Must-Cases

| ID | Karte | Pfad | Erwartung | Nachweis |
| --- | --- | --- | --- | --- |
| TC-199-01 | Aardvark | Human/Engine | Worm-Nutzung auf geschütztem Fort öffnet Corp-Choice; Rez trasht Worm; spätere Worm-LegalActions sind blockiert. | `packages/engine/src/index.test.ts::lets Aardvark intercept...` |
| TC-199-02 | Bizarre Encryption Scheme | Human/Engine | BES-Access markiert den Run; Agenda wird nicht sofort gestohlen; Runner scored sie am Start des nächsten Runner-Zugs, falls sie noch im Fort liegt. | `packages/engine/src/index.test.ts::delays agenda scoring...` |
| TC-199-03 | Chester Mix | Human/Engine | Rezzed Chester Mix reduziert ICE-Installkosten auf dem eigenen Fort um 1 mit Untergrenze 0. | `packages/engine/src/index.test.ts::reduces ICE install costs...` |
| TC-199-04 | Chimera | Human/Engine | Chimera-Access öffnet Runner-Daemon-Choice und trasht genau einen installierten Daemon. | `packages/engine/src/index.test.ts::trashes a Runner daemon...` |
| TC-199-05 | Aardvark/Chimera | KI | KI beantwortet Choice-Fenster über LegalActions und side-sichere PlayerView. | `packages/ai/src/index.test.ts::resolves V1.9.9 Aardvark and Chimera choices...` |
| TC-199-06 | Replay/StateHash | Engine | Aardvark-Choice-Replay reproduziert denselben StateHash. | `packages/engine/src/index.test.ts::lets Aardvark intercept...` |

## Gates

1. `corepack pnpm --filter @netgrid/engine test`
2. `corepack pnpm --filter @netgrid/ai test`
3. `corepack pnpm typecheck`
4. `corepack pnpm test`

## Ergebnis

Stand 2026-05-11: Engine- und KI-Pakettests laufen grün. Vollständiger Workspace-Check folgt im Final Review.
