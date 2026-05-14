# Originalset-Karten-Nachtest-Register

Zweck: Dieses Register hält fest, welche Originalset-Karten bereits in einer vertieften Stichprobe geprüft wurden. Neue zufällige Nachtest-Runden sollen diese Karten standardmäßig ausschließen, außer es gibt einen konkreten Regressionsverdacht oder eine Nacharbeitsprüfung.

Maschinenlesbare Begleitdatei: `data/reports/originalset-card-spotcheck-register.json`

## Runde 2026-05-14-B

Auswahlart: zufällige 10er-Stichprobe aus komplexeren bereits decklegalen Originalset-Karten, unter Ausschluss der Runde 2026-05-14-A.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_14_B.md`

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Butcher Boy | `onr_v1_009_butcher-boy` | Nacharbeit umgesetzt: HQ-Erfolgsrun-Counter und Start-of-turn-Credit je 2 Counter funktionieren | Fokussierter Engine-Test ergänzt |
| Dupré | `onr_v1_020_dupre` | Nacharbeit umgesetzt: echter Code-Gate-Breaker mit Strength-Countern und Fortwechsel-Reset | Fokussierter Engine-Test ergänzt |
| Invisibility | `onr_v1_035_invisibility` | Engine-Pfad funktioniert; Recurring-Credit-Install wird in der Chronik sichtbar | Chroniktest ergänzt |
| Pattel’s Virus | `onr_v1_046_pattels-virus` | Nacharbeit umgesetzt: Mehr-ICE-Zielwahl und Counterplatzierung funktionieren | Engine- und Chroniktests ergänzt |
| Pox | `onr_v1_049_pox` | Engine-Pfad funktioniert; Counterplatzierung und Install-Tax werden in der Chronik sichtbar | Chroniktest ergänzt |
| Arasaka Owns You | `onr_v1_078_arasaka-owns-you` | Nacharbeit umgesetzt: Flatline-Replacement verhindert Schaden, refreshed Hand, entfernt Tags/Core Damage und setzt Aktions-/Agenda-Schuld | Engine- und Chroniktests ergänzt |
| Data Fort Reclamation | `onr_v1_197_data-fort-reclamation` | Engine-Pfad funktioniert mit Hidden-Info-Schutz; Install-/Rez-Sequenz wird in der Chronik sichtbar | Chroniktest ergänzt |
| Fang 2.0 | `onr_v1_241_fang-2-0` | Nacharbeit umgesetzt: erfolgreicher Trace beendet den Run und setzt eine bezahlbare Run-Sperre | Engine- und Chroniktests ergänzt |
| Hacker Tracker Central | `onr_v1_325_hacker-tracker-central` | Nacharbeit umgesetzt: Trace-Counter werden nach Traces gelegt und können für Corp-Bids ausgegeben werden | Engine- und Chroniktests ergänzt |
| Aardvark | `onr_v1_349_aardvark` | Engine-Pfad funktioniert mit Choice und Replay/StateHash; Rez-/Trash-Worm-Choice wird in der Chronik sichtbar | Chroniktest ergänzt |

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
