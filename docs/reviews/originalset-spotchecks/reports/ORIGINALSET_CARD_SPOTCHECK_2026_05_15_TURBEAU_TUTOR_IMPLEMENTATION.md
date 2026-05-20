# Originalset-Spotcheck 2026-05-15 Turbeau/Tutor Umsetzung

Status: umgesetzt und getestet am 2026-05-15.

Quelle: `docs/archive/originalset-spotcheck-jobs/2026-05/spotcheck-2026-05-15-turbeau-tutor.md`

## Karten

| Karte | Ergebnis | Nacharbeit |
|---|---|---|
| Turbeau Delacroix | Nacharbeit umgesetzt | Trace 4 beim Access, einmal pro Run auf dem Fort, keine Run-Start-Tax-Familie |
| Dieter Esslin | Nacharbeit umgesetzt | Schlichter 1-Net-Damage-Access-Ambush ohne künstliche Hidden-Zone-Rolle |
| Corporate Negotiating Center | Nacharbeit umgesetzt | Korp-Start-of-turn-HQ-Agenda-Reveal mit Creditgewinn je gezeigter Agenda |
| Krumz | Nacharbeit umgesetzt | Rezzed Bit-Counter als Trace-Bid-Zahlungsquelle mit Corp-Start-Refresh |
| I Got a Rock | Nacharbeit umgesetzt | Rezzed Aktion nur gegen doppelt getaggten Runner, 3 Agenda-Punkte Kosten, 15 Meat Damage |
| Dedicated Response Team | Nacharbeit umgesetzt | Nur tagged Runner erleiden 3 Meat Damage; kein eigener Tag-Gain |
| Systematic Layoffs | Nacharbeit korrigiert | Zwei Advancement-Counter auf installierte advancebare Karten, Zielwahl über LegalActions |
| Rescheduler | Nacharbeit umgesetzt | HQ verdeckt in R&D mischen, gleiche Anzahl ziehen, RandomDrawRecord/StateHash-stabil |
| Tutor | Nachtest bestätigt | Bestehender V1.9.22-Resolver bleibt unverändert; keine Regression durch Subroutine-Duplikation |
| Ice Transmutation | Nacharbeit umgesetzt | Score-Choice auf rezzed ICE, +1 Stärke und Duplikation printed Subroutinen |

## Verifikation

- `corepack pnpm --filter @netgrid/engine test`: grün
- `corepack pnpm typecheck`: grün
- Weitere Pflichtchecks wurden im Jobbericht protokolliert.

## Geänderte Artefaktfamilien

- Engine/Shared: Runtime-Verträge, LegalActions, PendingChoices, PublicPayloads, Replay-/StateHash-Tests.
- AI/Manifeste/Mechanics-Coverage/Szenarien: Verträge von generischen Platzhaltern auf die kartenspezifischen Resolver umgestellt.
- Register: zehn Karten als `completed` und `fixed_and_tested` aufgenommen.
