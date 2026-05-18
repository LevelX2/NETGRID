# V1.9.22 Local Card Facts Working Basis

Stand: 2026-05-14
Status: Arbeitsgrundlage hergestellt, Spoiler-/Errata-/Nutzerklärung ergänzt, keine Promotion

## Ergebnis

Fuer alle 47 V1.9.22-WIP-Karten liegt jetzt eine versionierte lokale Faktenbasis vor:

- Maschinenlesbar: `data/rules/v1922-local-card-facts.json`
- Abgedeckte Karten: 47/47 aus `ONR_V1_9_22_WIP_CARD_IDS`
- Offene Attributkonflikte: 0
- Runtime-/Catalog-/AI-Promotion: unveraendert false

Damit fehlt fuer die V1.9.22-Karten nicht mehr die Daten-Arbeitsgrundlage. Offen ist die konkrete Implementierung pro Karte oder Kartenfamilie: LegalActions, `applyAction`-Revalidierung, Sichtbarkeit, Replay/StateHash, Manifest/Coverage, AI-Fallbacks, Webclient-Gates und Final Review.

## Ergaenzte Quellenklaerung 2026-05-14

Die UTF-8-Quellen `docs/source/Runnerspoiler 1.0.txt` und `docs/source/Corpspoiler 1.0.txt` wurden als Primärtext fuer V1.9.22 gegen die lokale Faktenbasis geprueft. Dabei wurden folgende Zahlen verbindlich korrigiert:

- `Scatter Shot`: 2 recurring restricted Credits fuer Trashing von Upgrades, nicht 1.
- `misc.for-sale`: Gain 3 pro getrashter installierter Runner-Karte.
- `Organ Donor`: Gain 2 pro getrashter Grip-Karte, bis zu 5 Karten.
- `Corporate Retreat`: `[A]: Gain 2`, nicht Gain 6; 4/3 Agenda.
- `Data Fort Reclamation`: 10 temporäre Credits, nicht 9; 4/2 Agenda.
- `Marine Arcology`: `[A], [A]: Gain 3`, nicht `[A]: Gain 1`; 3/2 Agenda.

Aus `C:\Users\Lui\OneDrive\Downloads\Netrunner_Errata_v1.70.pdf` wurde `docs/releases/v1/v1-9-originalset-completion/v1-9-22-per-card-longtail/errata-1-70-source-review.md` abgeleitet. Diese Quelle klaert unter anderem:

- `Security Purge`: vorhandene Top-R&D-Karten zeigen, revealed ICE soweit moeglich installieren/rezzen, "at no cost" nur fuer gedruckte Rez-Kosten.
- `Data Fort Reclamation`: temporäre 10 Credits plus eigene Korp-Credits duerfen fuer Installieren/Rezzing genutzt werden.
- `Haunting Inquisition`: mehrere Effekte laufen parallel; es zaehlen nur tatsaechlich genommene Runner-Aktionen.
- `Tutor`: modifiziert nicht den aktuellen Tutor-Encounter, sondern spaetere Encounter im Run.
- `Viral 15`: Runner waehlt die zu trashenden Programme.
- `Speed Trap`: nur nach Rez eines Upgrades/Nodes; nach letztem ICE erfolgreicher Run ohne Access.
- `Startup Immolator`: nur waehrend eines Runs, nach dem Passieren von ICE, wenn alle Subroutinen gebrochen wurden.
- `Poltergeist`, `Scatter Shot`, `Zetatech Software Installer`: Recurring-/Refresh-Handling aus der Bank.
- `Hammer`/Noisy: Nutzung ist auch ohne installierte Stealth-Karten moeglich; Stealth-Verlust nur, soweit anwendbar.

## Nutzerentscheide

- `Political Overthrow`: `Gain 3`
- `Hostile Takeover`: `Gain 5`
- `Private Cybernet Police`: `Trace 5`
- `Data Wall 2.0`: Rez-Kosten 2, Staerke 1
- `Newsgroup Filter`: Runner-Programm, Installkosten 5, MU 2, installierte Aktion `[A]: Gain 2 Credits`, keine Ziele, keine Choices, keine Hidden-Info; Runtime-WIP ohne Promotion ist umgesetzt.
- `Zetatech Software Installer`: Installkosten 0, MU 1.
- `Virizz`: Rez-Kosten 2, Staerke 4; fuer den Rest des Runs muss der Runner 1 Credit extra bezahlen, wenn er ICE brechen will.
- `Flak`: Installkosten 4, Staerke 2, `1: Break AP subroutine`, `1: +1 Strength`.
- `Hammer`: Program/Icebreaker/Noisy, MU 1, Installkosten 2, Staerke 2, `1: Break Wall subroutine`, `1: +1 Strength`; beim Hammer-Break verliert der Runner insgesamt bis zu 2 von Stealth-Karten, Verteilung nach Runner-Wahl falls mehrere Quellen verfuegbar sind.
- `Japanese Water Torture`: Installkosten 7, Staerke 2, `0: Break Wall subroutine`, `X: +X strength, and forgo your next X actions`.
- `Reflector`: Program/Icebreaker, MU 1, Installkosten 2, Staerke 4, `0: Break stun, hellbolt or knockout subroutine`.
- Breaker-Taxonomie: `Wall subroutine` meint jede Subroutine auf Wall-ICE; `AP subroutine` meint jede Subroutine auf AP-ICE; `stun`, `hellbolt` und `knockout` werden als benannte Subroutine-Kategorien nach Effekt/Text markiert.
- Standard-Breaker-Vertrag: installierter Breaker, aktueller gerezzter Encounter, Breaker-Staerke mindestens ICE-Staerke, einzelne passende ungebrochene Subroutine, sofortige Kosten, `applyAction`-Revalidierung, gebrochene Subroutinen werden beim Resolve uebersprungen.
- `Japanese Water Torture`-Aktionsschuld: Der Runner verliert seine naechsten X normalen Aktionen, auch ueber Zugwechsel hinweg, bis die Schuld abgetragen ist.
- `Hammer`-Noisy-Verlust: Trigger nur beim Hammer-Break einer Wall-Subroutine; der Runner verliert insgesamt bis zu 2 von Stealth-Karten. Bei mehreren verfuegbaren Quellen waehlt der Runner die Verteilung; bei weniger als 2 verfuegbaren Stealth-Ressourcen verliert er alles Verfuegbare; ohne Stealth-Ressource wird trotzdem gebrochen.

## Erste enge Implementierungskandidaten

| Karte | Grund |
| --- | --- |
| `Corporate War` | Vollstaendig genug fuer engen On-score-Credit-Resolver: 3 Advancement, 3 Punkte, 12-Credit-Schwelle, Gain 12 oder alle Credits verlieren. |
| `Political Overthrow` | Vollstaendig genug fuer engen scored-agenda-action-Resolver: Aktion kostet 1 und gibt nach Nutzerentscheid 3 Credits. |

## Nicht mehr als Blocker zu verwenden

Die Aussage "es fehlen Kartendaten fuer V1.9.22" ist nach diesem Stand zu breit und nicht mehr korrekt.

Korrekt ist:

- Die lokalen Kartenfakten liegen fuer den kompletten 47er-Scope vor.
- Einzelne Karten brauchen vor Promotion noch konkrete Engine-Vertraege und Tests.
- Bei neuen echten Attributwiderspruechen wird nur der betroffene Kartenwert nachgefragt.

## Gate

V1.9.22 bleibt `implementing` und `blocked_open`, weil diese Korrektur nur Informationen vorbereitet. Sie promotet keine neue Karte und ersetzt nicht die noch fehlenden technischen LegalAction-/`applyAction`-, Visibility-, Replay-/StateHash- und AI-Vertraege.
