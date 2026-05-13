# V1.9.22 Newsgroup Filter Slice Preflight

Stand: 2026-05-14
Status: WIP-Preflight, keine Runtime-/Catalog-/AI-Promotion

## Lokaler Regelkern

`data/rules/v1922-local-card-facts.json` fuehrt fuer `onr_v1_045_newsgroup-filter` folgende lokal bestaetigte Fakten:

- Seite/Typ: Runner-Programm.
- Zahlen: Installkosten 5, MU 2.
- Effektkern: "Gain 1 credit from installed program ability."

## Umsetzungsschnitt

Der kleinste moegliche Code-Schnitt waere eine installierbare Runner-Programm-Definition mit einer aktivierbaren Economy-Faehigkeit. Vor Runtime-Code muss aber der Aktivierungsvertrag geschlossen werden:

- Timing: Aktion im Runner-Main-Action-Fenster, einmal pro Zug, dauerhaft, oder ein anderes Fenster?
- Kosten: Klick-/Tap-/Use-Kosten oder kostenlose Aktivierung?
- Limit: unbegrenzt, einmal pro Zug oder anderweitig begrenzt?
- PublicPayload: sichtbare Information darf nur Programmquelle, Credit-Gain und Runner-Creditstand ausweisen.
- Replay: Aktivierung und etwaiges Use-/Tap-Flag muessen deterministisch im StateHash liegen.

## Entscheidung

Kein Runtime-Code in diesem Preflight. Eine automatische `[A]: Gain 1`-Auslegung waere technisch klein, wuerde aber Timing, Kosten und Limit erfinden. `Newsgroup Filter` bleibt daher bis zur lokalen Bestaetigung aus `playable_mvp` und ohne `install_card`-/Ability-LegalAction.

## Removal Condition

`Newsgroup Filter` kann in Code gehen, sobald lokal feststeht:

1. ob und welche Aktivierungskosten die Programmfaehigkeit hat,
2. in welchem Timingfenster sie nutzbar ist,
3. ob es einen Turn- oder Use-Limit-Marker gibt.
