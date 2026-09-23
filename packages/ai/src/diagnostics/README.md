# Diagnostics

`diagnostics/` enthält redigierte Debug-, Report- und Formatierungsbausteine. Diese Module dürfen Entscheidungsdaten sichtbar machen, aber keine Actions wählen und keine Hidden-Info-Daten ausweiten.

## Grenzen

- Diagnostics dürfen keine Runtime-Chooser importieren.
- Diagnostics dürfen keine Action-Auswahl berechnen.
- Debug-Ausgaben verwenden redigierte Evidence.
- Redaction bleibt ein Gate für Keys und String-Werte.
- Formatter gehören hierher, nicht in `index.ts`.

## Deckprofil-Wirtschaft

`runnerProfile.economyProfile.burst` zählt die Deckkopien mit dem kanonischen
Funktionssignal `economy.burst_credit`. Der Zähler gehört gemäß
`DECK_STRATEGY_METADATA_CONSUMER_CONTRACT` ausschließlich zur Diagnose; die
produktive Strategieauswahl verwendet ihre eigenen ausgewiesenen Verbraucher.
Ein Profilreview muss den aggregierten Wert gegen die erzeugten Kartensignale
prüfen: Eine korrekt gespielte Karte schließt einen falschen Diagnosewert nicht aus.
