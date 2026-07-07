# Punish-primary active remote reserve guard

Datum: 2026-07-07

## Befund

Der Runtime-Pfad fuer aktive Remote-Agenda-Advances hatte eine zu breite
Ausnahme fuer `recommendedNextStep:advance`: Auch wenn
`corpCanRezFullPathWithDynamicReserve:false` war und der Advance die
Score-Remote-Rezreserve unterschritt, konnte ein scheinbar uncontested
Scoring-Window den harten Funding-Guard umgehen.

Das ist fuer reine Fast-Advance-Linien gewollt, wenn die Korp wirklich eine
uncontestable aktive Agenda weiter schliessen soll. Fuer Decks mit
`primaryWinIntent:corp.punish_runner` ist es aber falsch: Dort darf ein
nicht-sofort schliessender Advance die Rezreserve fuer den eigentlichen
Punish-/Remote-Schutzplan nicht unterlaufen.

## Änderung

`corpActiveRemoteAgendaAdvanceClockComponent` laesst die uncontested-Advance-
Ausnahme fuer Punish-primary-Decks nicht mehr gelten, wenn:

- die Aktion nicht vor dem Runner-Turn scored,
- das Scoring-Window Funding oder Dynamic-Reserve braucht,
- die Credits nach dem Advance unter dem aktiven Remote-Reserve-Floor liegen.

Die Evidence enthaelt dann
`punish_primary_uncontested_advance_requires_reserve:true`.

## Validierung

- Neuer Regressionstest:
  `keeps punish-primary active remote advances behind the rez reserve`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-runtime-corp-score.test.ts --maxWorkers=1 --testTimeout=120000`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

## Benchmark-Hinweis

Der gezielte 5x480-Lauf fuer
`strategy_panel_net_damage_black_ice` blieb gegen die aktuelle Referenz
unveraendert: 3 Corp-Flatlines, 1 Runner-Agenda-Sieg, 1 Action-Limit.

In den erzeugten Net-Damage-/Fast-/Hybrid-Artefakten tauchte die neue Evidence
nullmal auf. Die Änderung ist daher ein belegter lokaler Bewertungsfix, aber
erklaert noch keinen messbaren Fortschritt im aktuellen 5er-Strategiepanel.
Die weitere Ursache fuer die Net-Damage-Regression liegt an anderen
Entscheidungsfenstern.
