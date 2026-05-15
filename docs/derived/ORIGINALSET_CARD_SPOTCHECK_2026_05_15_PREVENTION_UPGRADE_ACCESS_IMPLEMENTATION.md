# Originalset-Spotcheck 2026-05-15 Prevention/Upgrade/Access Umsetzung

Job: `spotcheck-2026-05-15-prevention-upgrade-access`

## Ergebnis

Der Spotcheck wurde umgesetzt und fokussiert in der Engine gehärtet. Zwei echte Vertragsabweichungen wurden korrigiert:

- `Armored Fridge` installiert jetzt mit sieben öffentlichen Countern, verhindert pro Meat-Damage-Fenster genau 1 Meat Damage durch Entfernen eines Counters und trasht sich automatisch beim letzten Counter.
- `Solo Squad` bietet seine Meat-Damage-Fähigkeit nur noch bei getaggtem Runner an und revalidiert den Tagstatus erneut in `applyAction`.

Die übrigen Karten des Blocks wurden gegen bestehende Runtime- und Regressionsabdeckung geprüft:

- `If You Want It Done Right...`: privater Stack-Top-5-Choice, Hidden-Zone-Payload und Replay/StateHash sind abgedeckt.
- `Code Corpse` und `Shotgun Wire`: brechbare ICE-Subroutinen, Damage-/ETR-Pfade und Redaction sind über bestehende ICE-Regressionen abgedeckt.
- `Power Grid Overload`: tagged-only-Hardwaretrash bleibt LegalAction- und Payload-seitig abgedeckt.
- `Bizarre Encryption Scheme`: Access-Replacement und Start-of-Runner-turn-Delayed-Agenda-Auflösung bleiben abgedeckt.
- `Jenny Jett`, `Olivia Salazar` und `Twenty-Four-Hour Surveillance`: generische Upgrade-/Root-/Run-Tax- und Agenda-Steal-Kostenpfade bleiben durch bestehende V1.9.18/V1.9.19-Regressionen abgedeckt.

## Geänderte Engine-Verträge

- Armored-Fridge-Counter werden beim Runner-Hardware-Install gesetzt und in PublicPayload/PlayerViews nur als öffentliche Counterdaten sichtbar.
- Die Prevention-Choice für Armored Fridge entsteht nur bei Meat Damage, installierter Quelle und verfügbarem Counter.
- Der Choice-Resolve entfernt einen Counter, veröffentlicht Countertyp, entfernte Menge, Restmenge und Auto-Trash-Status ohne Grip-Identitäten.
- Solo Squad hängt in LegalAction-Projektion und Apply-Revalidation am getaggten Runner.

## Tests

Ergänzt wurden Engine-Regressionen für:

- Armored-Fridge-Install mit sieben Countern.
- Meat-Damage-Prevention mit Counterverbrauch, PublicPayload-Redaction und Replay/StateHash.
- Auto-Trash von Armored Fridge beim letzten Counter.
- Solo-Squad-No-LegalAction ohne Tag und Tag-Drift-Revalidation.

Verifikation:

- `corepack pnpm --filter @netgrid/engine test -- --runInBand`
- Die vollständigen Pflichtchecks sind im Jobbericht dokumentiert.
