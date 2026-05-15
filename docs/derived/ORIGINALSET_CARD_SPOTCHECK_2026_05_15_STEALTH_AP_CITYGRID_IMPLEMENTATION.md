# Originalset-Spotcheck 2026-05-15 Stealth/AP/CityGrid Implementation

Job: `spotcheck-2026-05-15-stealth-ap-citygrid`

Status: `done` mit grün geprüfter Umsetzung.

## Umgesetzt

| Karte | Ergebnis | Testabdeckung |
|---|---|---|
| Vewy Vewy Quiet | Zwei öffentliche Recurring-Counter statt einem Counter; bestehender Run-Icebreaker-Creditpfad bleibt maßgeblich. | Install- und Counter-Payload-Test |
| Microtech 'Trode Set | Break-Subroutinen kosten mit installiertem Trode Set 1 Credit zusätzlich; ungebrochener AP-Net-Damage wird auf 1 reduziert. | Break-Kosten- und AP-Reduction-Test |
| Corporate Ally | Mehrere Runner-Agenda-Forfeit-Ziele werden deterministisch gewählt; ohne Agenda wird Install nicht angeboten; Payload bleibt redigiert und replay-stabil. | Mehragenda-, No-agenda-, Leakscan- und Replay-Test |
| Smith's Pawnshop | Start-of-turn-Choice ist gegen Pass, wrong-side, stale StateVersion und zwischenzeitlich entfernte Zielkarten gehärtet. | Pass-Replay-, wrong-side-/stale- und Removed-target-Test |
| Bolter Cluster | Kartentext/Runtime auf 4 Net Damage plus Next-ICE-No-Break-Modifier korrigiert. | Damage-, Next-ICE-No-Break-, Payload- und Replay-Test |
| Fang | Erfolgreicher Trace beendet den Run und setzt den bestehenden 2-Credit-Pay-to-run-Lock; kein Tag-Effekt. | Trace-Erfolg, Lock, Clear und Replay |
| Jack Attack | Jack-out-Lock plus Trace-Tag-Kombination ist direkt payload-, cleanup- und replay-getestet. | Lock-, Trace-, Leakscan-, Run-End-Cleanup- und Replay-Test |
| Neural Blade | Kartentext/Runtime auf 1 Net Damage plus Next-ICE-No-Break-Modifier korrigiert. | Damage-, Next-ICE-No-Break-, Payload- und Replay-Test |
| Vacant Soulkiller | Access-Schaden skaliert mit Advancement-Countern; 0 Counter verursacht keinen Schaden. | 0-/3-Counter-, Payload-, Leakscan- und Replay-Test |
| Singapore City Grid | Einmal pro Run kann die Korp im passenden Run-Fenster ein unrezzed ICE im angegriffenen Fort mit einem ICE aus HQ tauschen; die HQ-Auswahl bleibt `hidden_info_barrier`, das eingewechselte ICE kommt concealed/unrezzed ins Fort. | Wrong-side-/stale-, Hidden-Info-, Once-per-run-, PlayerView-, Payload- und Replay/StateHash-Test |

## Abschluss

Der vormals blockierende Singapore-City-Grid-Pfad ist umgesetzt. Die Karte nutzt jetzt einen dedizierten servergebundenen Resolver mit Corp-privater HQ-ICE-Auswahl, Revalidation von Run, Source, ICE-Position, unrezzed Ziel und HQ-ICE sowie redigierter PublicPayload ohne HQ-Definition-ID vor Reveal.

## Checks

- `corepack pnpm --filter @netgrid/engine test -- -t "Vewy Vewy Quiet|Bolter Cluster|Fang trace|Vacant Soulkiller|Microtech Trode Set|remaining V1.9.19 access ambush|side-safe prevention choices|installs Shield"` - grün.
- `corepack pnpm --filter @netgrid/engine test -- -t "Corporate Ally|Smith's Pawnshop|Jack Attack"` - grün.
- `corepack pnpm --filter @netgrid/engine test -- -t "Singapore City Grid"` - grün.

- `corepack pnpm --filter @netgrid/engine test` - grün.
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` - grün.
- `corepack pnpm --filter @netgrid/catalog test` - grün.
- `corepack pnpm typecheck` - grün.
