# Corp-Score-Conversion: Progressing-Retest-Evidence

## Laufvertrag

- Corp-Deck: `Universal Fast Advance`
- Runner-Decks: Blink Pressure Rig, Classic Prep Economy, Proteus HQ Virus &
  Derez, Proteus R&D Virus & Bad Publicity
- Seeds: `universal-fast-advance-01` bis `-05`
- Spiele: 20
- Limit: 240 Aktionen
- Controller: Corp und Runner jeweils `current_candidate`
- Rohdaten:
  `data/local/universal-fast-advance-score-conversion-retest-20games-2026-07-10.json`

## Gesamtergebnis vor Fix

- 9 Corp-Siege, 5 Runner-Siege, 6 Action-Limits
- 42 Corp-Scores, 27 Runner-Steals
- 18/20 Spiele mit mindestens einem Corp-Score
- 13 Scores im Installationszug; 12 Scores mit Operation im selben Zug
- 0 illegale Aktionen, Replayfehler, Redactionfehler oder Fallbacks

## Freigegebener Fehler

Der Conversion-Controller wurde sechsmal ausgewählt. Vier Sequenzen liefen als
`Install -> Advance -> Advance -> Advance -> Score` vollständig durch. Zwei
Sequenzen brachen ab:

1. `original_blink_pressure`, Seed `universal-fast-advance-02`, Corp-Zug 23:
   Agenda in neues Remote installieren, danach dreimal `gain_credit`, dann
   `end_turn`.
2. `original_blink_pressure`, Seed `universal-fast-advance-05`, Corp-Zug 13:
   Agenda in neues Remote installieren, danach dreimal `gain_credit`, dann
   `end_turn`.

Vor beiden Installationen waren vier Klicks und mindestens sechs Credits
sichtbar. Der Installationsschritt wurde durch
`corp_score_conversion_plan_controller` gegen einen Off-Plan-Override
geschützt. Beim Folgeschritt war der vorherige Plan `progressing`; der
gemappte Advance verlor als nonpositive Choice gegen Basic Credit. Die
Decision-Evidence nennt
`tactical_plan_semantic_choice_reason:mapped_nonpositive_against_positive`.

## Ursachenbezug

`progressTacticalPlans` setzt fortgesetzte aktive Pläne auf `progressing`.
Der Conversion-Schutz akzeptiert vor dem Fix nur `active`. Die garantierende
Plan-Evidence bleibt vorhanden, wird durch die zu enge Statusprüfung aber
nicht mehr wirksam.

## Weitere Beobachtung

- Neun Corp-`activated_card_ability`-Aktionen waren Vapor-Ops-Credit-Cashouts.
- Es gab keinen `p3_34.move_advancement`-Choice und keine beobachtete
  Chicago-Branch-Counterplatzierung.
- Diese Nichtbeobachtung ist kein zusätzlicher Implementierungsauftrag. Der
  aktuelle Fix behandelt ausschließlich den belegten Planstatusabbruch.

## Erwartung nach Fix

- Beide Seeds dürfen nach der garantierten Installation nicht auf Basic
  Credit ausweichen.
- Entweder wird derselbe legale Conversion-Pfad abgeschlossen oder die
  Revalidierung belegt, dass er nicht mehr garantiert ist und gibt den Plan
  sicher frei.
- Nicht garantierte Standard-Scorepläne behalten ihre bisherigen
  Override-Regeln.
