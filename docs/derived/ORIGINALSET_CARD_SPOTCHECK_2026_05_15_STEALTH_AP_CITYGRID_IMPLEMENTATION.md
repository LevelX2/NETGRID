# Originalset-Spotcheck 2026-05-15 Stealth/AP/CityGrid Implementation

Job: `spotcheck-2026-05-15-stealth-ap-citygrid`

Status: `blocked` mit grün geprüften Teilfixes.

## Umgesetzt

| Karte | Ergebnis | Testabdeckung |
|---|---|---|
| Vewy Vewy Quiet | Zwei öffentliche Recurring-Counter statt einem Counter; bestehender Run-Icebreaker-Creditpfad bleibt maßgeblich. | Install- und Counter-Payload-Test |
| Microtech 'Trode Set | Break-Subroutinen kosten mit installiertem Trode Set 1 Credit zusätzlich; ungebrochener AP-Net-Damage wird auf 1 reduziert. | Break-Kosten- und AP-Reduction-Test |
| Bolter Cluster | Kartentext/Runtime auf 4 Net Damage plus Next-ICE-No-Break-Modifier korrigiert. | Damage-, Next-ICE-No-Break-, Payload- und Replay-Test |
| Fang | Erfolgreicher Trace beendet den Run und setzt den bestehenden 2-Credit-Pay-to-run-Lock; kein Tag-Effekt. | Trace-Erfolg, Lock, Clear und Replay |
| Neural Blade | Kartentext/Runtime auf 1 Net Damage plus Next-ICE-No-Break-Modifier korrigiert. | Damage-, Next-ICE-No-Break-, Payload- und Replay-Test |
| Vacant Soulkiller | Access-Schaden skaliert mit Advancement-Countern; 0 Counter verursacht keinen Schaden. | 0-/3-Counter-, Payload-, Leakscan- und Replay-Test |

## Blockierend Offen

Singapore City Grid ist nicht sicher als Nebenpatch lösbar. Die Karte braucht einen dedizierten Resolver mit:

- rezzed, servergebunden und nur während eines Runs auf dieses Fort,
- einmal pro Run,
- Zielauswahl eines unrezzed ICE auf dem angegriffenen Fort,
- Corp-private HQ-ICE-Auswahl mit Hidden-Info-Barriere,
- Swap an gleicher ICE-Position, neue ICE-Instanz concealed/unrezzed,
- PublicPayload ohne HQ-Definition-ID vor Reveal,
- Replay/StateHash-Abdeckung über HQ-Entnahme, ICE-Position und concealed neue Instanz.

Zusätzlich offen sind fokussierte Härtungstests für Corporate Ally, Smith's Pawnshop und Jack Attack. Die bestehenden Pfade wurden in diesem Lauf nicht zurückgebaut.

## Checks

- `corepack pnpm --filter @netgrid/engine test -- -t "Vewy Vewy Quiet|Bolter Cluster|Fang trace|Vacant Soulkiller|Microtech Trode Set|remaining V1.9.19 access ambush|side-safe prevention choices|installs Shield"` - grün.

- `corepack pnpm --filter @netgrid/engine test` - grün.
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` - grün.
- `corepack pnpm --filter @netgrid/catalog test` - grün.
- `corepack pnpm typecheck` - grün.
