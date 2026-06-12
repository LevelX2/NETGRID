# Diagnostics

`diagnostics/` enthält redigierte Debug-, Report- und Formatierungsbausteine. Diese Module dürfen Entscheidungsdaten sichtbar machen, aber keine Actions wählen und keine Hidden-Info-Daten ausweiten.

## Grenzen

- Diagnostics dürfen keine Runtime-Chooser importieren.
- Diagnostics dürfen keine Action-Auswahl berechnen.
- Debug-Ausgaben verwenden redigierte Evidence.
- Redaction bleibt ein Gate für Keys und String-Werte.
- Formatter gehören hierher, nicht in `index.ts`.
