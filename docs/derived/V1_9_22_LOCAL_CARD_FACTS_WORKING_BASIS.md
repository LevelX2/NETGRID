# V1.9.22 Local Card Facts Working Basis

Stand: 2026-05-14
Status: Arbeitsgrundlage hergestellt, Errata-/Nutzerklärung ergänzt, keine Promotion

## Ergebnis

Fuer alle 47 V1.9.22-WIP-Karten liegt jetzt eine versionierte lokale Faktenbasis vor:

- Maschinenlesbar: `data/rules/v1922-local-card-facts.json`
- Abgedeckte Karten: 47/47 aus `ONR_V1_9_22_WIP_CARD_IDS`
- Offene Attributkonflikte: 0
- Runtime-/Catalog-/AI-Promotion: unveraendert false

Damit fehlt fuer die V1.9.22-Karten nicht mehr die Daten-Arbeitsgrundlage. Offen ist die konkrete Implementierung pro Karte oder Kartenfamilie: LegalActions, `applyAction`-Revalidierung, Sichtbarkeit, Replay/StateHash, Manifest/Coverage, AI-Fallbacks, Webclient-Gates und Final Review.

## Ergaenzte Quellenklaerung 2026-05-14

Aus `C:\Users\Lui\OneDrive\Downloads\Netrunner_Errata_v1.70.pdf` wurde `docs/derived/V1_9_22_ERRATA_1_70_SOURCE_REVIEW.md` abgeleitet. Diese Quelle klaert unter anderem:

- `Security Purge`: vorhandene Top-R&D-Karten zeigen, revealed ICE soweit moeglich installieren/rezzen, "at no cost" nur fuer gedruckte Rez-Kosten.
- `Data Fort Reclamation`: temporäre 9 Credits plus eigene Korp-Credits duerfen fuer Installieren/Rezzing genutzt werden.
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
