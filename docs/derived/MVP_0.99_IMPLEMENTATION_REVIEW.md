# MVP 0.99 Implementation Review - Hosting, Viren, Purge und Counter-Familien

Status: bestanden
Stand: 2026-05-04

## Umsetzungsbefund

V0.99 wurde in vier internen Gates umgesetzt:

- V0.99a: generisches, validiertes Counter-Feld auf Karten plus V0.99-Baseline und Demo-Decks.
- V0.99b: direkte Hosting-Beziehung `hostedOn` mit privater Runner-Choice und Host-Trash-Kaskade.
- V0.99c: Virus-Counter und Corp-Basic-Action `purge_virus_counters`.
- V0.99d: Recurring Credits fuer Runner-Programminstallkosten und Bad-Publicity-Run-Fund fuer Runner-Run-Kosten.

Die Engine bleibt die einzige Regelautoritaet. LegalActions werden aus dem GameState gebaut; `applyAction` revalidiert StateVersion, Side, ActionId, Timing, Clicks, Credits, Counter, Choices und Ziele erneut.

## Hidden-Info-Befund

- Hosting nutzt `PendingChoice` mit `visibility: hidden_info_barrier`.
- Private Grip-Kandidaten erscheinen nur in der Runner-PlayerView und im Runner-AI-Input.
- PublicEvents fuer Hosting-Start und Hosting-Resolve enthalten keine privaten Kandidatenlabels.
- Nach erfolgreichem Hosting ist das Programm offen im Runner-Rig sichtbar.
- Purge, Recurring Credits und Bad Publicity arbeiten auf offenen oder side-oeffentlichen Informationen.
- Multiplayer-Reconnect zeigt Hosting-Choices nur dem Runner.
- Undo nach Hosting-Hidden-Info-Barriere wird blockiert.

## Determinismus-Befund

- Counter, `hostedOn`, Recurring Credits und Bad Publicity sind Teil des StateHash.
- Purge erzeugt keine RandomDrawRecords und entfernt nur Virus-Counter.
- Hosting und Host-Trash nutzen keine Randomness.
- Bad-Publicity-Fund wird beim Run-Start gesnapshott und mit dem Run geloescht.
- Replay-Tests reproduzieren StateHashes fuer Purge, Hosting, Recurring-Credit- und Bad-Publicity-Sequenzen.

## No-Scope-Pruefung

Nicht umgesetzt oder freigeschaltet:

- Prevention, Avoid, Interrupts und Replacement.
- Set Aside und Remove from Game.
- Ownership-/Control-Wechsel.
- Vollstaendige offizielle Hosting-Matrix.
- Vollstaendige Deckbuilding-/Formatregeln.
- Spezialcounter V0.99e ohne konkreten Kartenbedarf.

## Risiken und Grenzen

- Hosting ist absichtlich auf `v099_host_resource` und ein Runner-Programm aus Grip beschraenkt.
- Hosted Programme bleiben im Runner-Rig offen und Runner-kontrolliert.
- Recurring Credits werden nur fuer Runner-Programminstallkosten genutzt.
- Bad Publicity wird nur fuer Runner-Run-Kosten genutzt und nicht fuer Trace-Bids.
- Purge ist nur als Corp-Basic-Action umgesetzt.

## Checks

- `corepack pnpm --filter @netrunner/shared typecheck`: pass.
- `corepack pnpm --filter @netrunner/engine typecheck`: pass.
- `corepack pnpm --filter @netrunner/engine test`: pass, 60 Tests.
- `corepack pnpm --filter @netrunner/ai typecheck`: pass.
- `corepack pnpm --filter @netrunner/ai test`: pass, 25 Tests.
- `corepack pnpm --filter @netrunner/server typecheck`: pass.
- `corepack pnpm --filter @netrunner/server test`: pass, 21 Tests.
- `corepack pnpm --filter @netrunner/web typecheck`: pass.
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts tests/specs/visibility-contract.test.ts`: pass, 37 Tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass; bekannte Turbopack-NFT-Warnung zur bestehenden `card-images`-Route bleibt ohne Build-Fehler.

## Review-Ergebnis

`ready_for_hardening: true`

`ready_for_MVP_0.99_final_review: true`
