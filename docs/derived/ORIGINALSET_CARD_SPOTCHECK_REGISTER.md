# Originalset-Karten-Nachtest-Register

Zweck: Dieses Register hält fest, welche Originalset-Karten bereits in einer vertieften Stichprobe geprüft wurden. Neue zufällige Nachtest-Runden sollen diese Karten standardmäßig ausschließen, außer es gibt einen konkreten Regressionsverdacht oder eine Nacharbeitsprüfung.

Maschinenlesbare Begleitdatei: `data/reports/originalset-card-spotcheck-register.json`

## Runde 2026-05-14-A

Auswahlart: zufällige 10er-Stichprobe aus komplexeren bereits decklegalen Originalset-Karten.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Security Purge | `onr_v1_216_security-purge` | Engine funktioniert; Chronik nachgeschärft | Chronik-spezifischer Test ergänzt |
| Mastiff | `onr_v1_255_mastiff` | Funktioniert komplett | Kein offener Punkt |
| Edgerunner, Inc., Temps | `onr_v1_289_edgerunner-inc-temps` | Engine funktioniert; Chronik nachgeschärft | Chronik-spezifischer Test ergänzt |
| Valu-Pak Software Bundle | `onr_v1_117_valu-pak-software-bundle` | Engine funktioniert; Chronik nachgeschärft | Chronik-spezifischer Test ergänzt |
| Flak | `onr_v1_027_flak` | Engine funktioniert; Chronik nachgeschärft | Chronik-spezifischer Test ergänzt |
| Boardwalk | `onr_v1_008_boardwalk` | Engine funktioniert; Chronik nachgeschärft | Chronik-spezifischer Test ergänzt |
| Bioweapons Engineering | `onr_v1_190_bioweapons-engineering` | Nachtest hat fehlenden fokussierten Pfad gefunden; Engine-Fix und Einzeltest ergänzt | +1 Meat-Damage-Modifier nachprogrammiert |
| Shield | `onr_v1_061_shield` | Engine funktioniert; Chronik nachgeschärft | Chronik-spezifischer Test ergänzt |
| Reflector | `onr_v1_055_reflector` | Engine funktioniert; Chronik nachgeschärft | Breaker-Chronik nachgeschärft |
| Quest for Cattekin | `onr_v1_172_quest-for-cattekin` | Engine funktioniert; Chronik nachgeschärft | Chronik-spezifischer Test ergänzt |

## Auswahlregel für Folgerunden

- Standardmäßig Karten mit `spotcheckStatus = "completed"` aus der Zufallsauswahl ausschließen.
- Karten mit `followUpStatus = "fixed_and_tested"` dürfen erst wieder gewählt werden, wenn gezielt Regressionen geprüft werden.
- Karten mit `followUpStatus = "open"` in einer Folgerunde priorisieren, nicht zufällig doppelt ziehen.
