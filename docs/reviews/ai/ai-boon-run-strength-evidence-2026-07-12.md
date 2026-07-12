# AI Boon: Evidence zur blockierten KI-Aktion

Datum: 2026-07-12

## Untersuchte Situation

- Match: `match_95a8416194bb9ac4`
- Zustand: Run auf R&D, Encounter mit dem bereits gerezzten `Credit Blocks`
- Runner-Programm: `AI Boon`
- Würfelwurf beim Runstart: 5
- Sichtbarer Serverfehler: `Die KI konnte aktuell keine Aktion ausführen.`

## Nachgewiesene Ursache

Das gespeicherte Start-Run-Event enthält `v1921DieRoll: 5`, aber den
fehlerhaften Stärkewert `runStartRandomStrengthBonus: 7`. Die aktive
Kartendefinition hatte AI Boon irrtümlich die statische Stärke 2 gegeben und
den Wurf addiert. Die LegalAction-Berechnung sah deshalb Stärke 7 und bot den
Break gegen Credit Blocks mit Stärke 3 an.

Die spätere `applyAction`-Validierung verwendete nicht denselben Runwert,
sondern fiel auf die statische Stärke 2 zurück. Sie lehnte damit eine zuvor
angebotene LegalAction als `ERR_INVALID_TARGET` ab. Der Multiplayer-Server
übersetzte diese Ablehnung anschließend in das unspezifische `ai_no_action`.

## Regelentscheidung

AI Boon hat keine gedruckte Grundstärke. Der W6-Wurf bestimmt direkt die
Grundstärke für den aktuellen Run. Der gültige Bereich ist daher 1 bis 6;
Pump-Modifikatoren werden erst danach addiert.

Das laufende Spiel benötigt keine Daten- oder Recovery-Brücke. Es kann vor den
Run zurückgenommen und nach dem Neustart mit dem korrigierten Stand fortgeführt
werden.
