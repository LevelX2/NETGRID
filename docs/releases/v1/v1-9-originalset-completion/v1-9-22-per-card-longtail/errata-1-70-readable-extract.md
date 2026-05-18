# V1.9.22 Errata 1.70 Readable Extract

Stand: 2026-05-14
Status: lesefreundliche Quellenextraktion fuer offene V1.9.22-Karten, keine Runtime-, Catalog-, AI- oder Release-Promotion

## Quelle und Zweck

- Versionierte lokale Quelle: `docs/source/Netrunner_Errata_v1.70.pdf`
- Arbeits-Extraktion: `tmp/pdfs/Netrunner_Errata_v1.70.raw.txt` und `tmp/pdfs/Netrunner_Errata_v1.70.layout.txt`
- Extraktionswerkzeug: `pdftotext`, Varianten `-raw` und `-layout`

Dieses Artefakt ist keine Vollabschrift der PDF. Es ist eine gezielte, lesbare Arbeitsgrundlage fuer die aktuell offenen V1.9.22-Karten und Resolver-Vertraege.

## Direkt relevante Kartentreffer

| Karte | Lesbare Errata-/Ruling-Kernaussage | Verbindliche Auswirkung fuer V1.9.22 | Was offen bleibt |
| --- | --- | --- | --- |
| `Security Purge` | Die Karte weist die Korp an, aufgedeckte ICE nach Moeglichkeit zu installieren und zu rezzen. "At no cost" befreit nur von den normalen Rez-Kosten, nicht von zusaetzlichen Kosten. Wenn weniger als drei R&D-Karten vorhanden sind, werden nur die vorhandenen Karten aufgedeckt und der Effekt so weit wie moeglich ausgefuehrt. | Kein Wahlrecht, aufgedeckte installier- und rezzbare ICE einfach liegenzulassen. Der Resolver muss Zusatzkosten weiterhin pruefen. Teilmenge bei leerem oder fast leerem R&D ist erlaubt und kein Niederlagenereignis. | Die PDF legt nicht fest, in welches Serverziel jedes aufgedeckte ICE installiert wird und wie mehrere installierbare ICE geordnet oder auf Server verteilt werden. Das ist weiterhin ein lokaler Projektvertrag. |
| `Data Fort Reclamation` | Die Korp darf fuer den Effekt neben dem bereitgestellten Sonderbudget auch eigene Credits aus dem Creditpool einsetzen. Der Score-Effekt erzeugt keine zusaetzlichen Aktionen. Nach Spoiler-Abgleich betraegt das Sonderbudget 10 Credits. | Der Resolver darf zusaetzliche Korp-Credits als freiwillige Zahlungsquelle zulassen. Der Effekt bleibt ein Score-Folgeeffekt, keine Action-Quelle. | Install-/Rez-Auswahl, Zielserver und Zahlungsaufteilung muessen als lokaler On-score-Choice-Vertrag beschrieben werden. |
| `Haunting Inquisition` | Mehrere aktive Effekte derselben Karte laufen parallel. Die sechs Aktionen sind tatsaechlich genommene Runner-Aktionen. Bonus-Runs ausserhalb einer Aktion werden nicht pauschal verboten. | Der Resolver braucht einen actionLock-Zaehler fuer echte Runner-Aktionen. Parallel aktive Locks duerfen nicht seriell zu 12, 18 usw. Aktionen eskalieren. | Umsetzung braucht noch einen Timingvertrag fuer Actionverbrauch, Bonus-Run-Fenster und Ende des Locks. |
| `Tutor` | Tutor veraendert nicht den aktuellen eigenen Encounter; der Zusatz wirkt erst auf spaetere Encounters im selben Run, auch auf dasselbe Tutor, falls es erneut encountered wird. | Guter Kandidat fuer einen engen Runtime-Schnitt: beim erfolgreichen Ausloesen entsteht ein run-weiter ICE-Modifier fuer kuenftige Encounters. | Lokaler Vertrag muss festlegen, wie der zusaetzliche End-the-run-Subroutine-Eintrag in PublicView, Replay und StateHash modelliert wird. |
| `Viral 15` | Der Runner waehlt die zu trashenden Programme. | Keine Korp-Auswahl und keine automatische Engine-Auswahl. Der Resolver braucht eine Runner-private Programmauswahl. | Timing bleibt zu klaeren: nach Passieren, vor/waehrend Jack-out-Fenster und wie bei weniger als drei Programmen verfahren wird. |
| `Hammer` | Noisy-Karten koennen genutzt werden, auch wenn keine Stealth-Karten im Spiel sind. Der Stealth-Credit-Verlust ist eine Straf-/Folgewirkung, keine Nutzungskostenbedingung. | Nutzerentscheidung 2026-05-14: Installkosten 2, MU 1, Stärke 2, `1: Break Wall subroutine`, `1: +1 Strength`; beim Hammer-Break verliert der Runner insgesamt bis zu 2 von Stealth-Karten, Verteilung nach Runner-Wahl. | Runtime-Umsetzung, PublicPayload, Replay/StateHash und AI-Fallback. |
| `Zetatech Software Installer` | Die Karte fuehrt zwei wiederkehrende Credits von der Bank und refreshte genutzte Credits zu Beginn des naechsten Runner-Zugs. | Recurring-Credit-Hoehe und Refresh-Timing sind bestaetigt. Nutzerentscheidung 2026-05-14: Installkosten 0, MU 1. | Programminstallations-Zahlungsfenster und Overlay-Vertrag bleiben als technische Implementierungsvertraege offen. |

## Kein direkter Kartentreffer

| Karte | Befund | Folge |
| --- | --- | --- |
| `Virizz` | Kein eigener Treffer in Errata 1.70 gefunden. | Nutzerentscheidung 2026-05-14: Kosten 2, Stärke 4; für den Rest des Runs muss der Runner +1 bezahlen, wenn er ICE brechen will. |
| `Flak` | Kein eigener Treffer in Errata 1.70 gefunden. | Nutzerentscheidung 2026-05-14: Installkosten 4, Stärke 2, `1: Break AP subroutine`, `1: +1 Strength`. Offen bleibt der technische AP-Subroutine-/Breaker-Vertrag. |
| `Japanese Water Torture` | Kein eigener Treffer in Errata 1.70 gefunden. | Nutzerentscheidung 2026-05-14: Installkosten 7, Stärke 2, `0: Break Wall subroutine`, `X: +X strength, and forgo your next X actions`. Offen bleibt der technische Wall-/Future-Action-Debt-Vertrag. |
| `Reflector` | Kein eigener Treffer in Errata 1.70 gefunden. | Nutzerentscheidung 2026-05-14: Program/Icebreaker, MU 1, Installkosten 2, Stärke 4, `0: Break stun, hellbolt or knockout subroutine`. Offen bleibt der technische Zielkategorie-/Breaker-Vertrag. |

## Allgemeine Regelstellen fuer Resolver

| Bereich | Lesbare Regelgrundlage | Auswirkung |
| --- | --- | --- |
| ICE-Installation | ICE wird auf Data Forts installiert; Agenda-, Node- und Upgrade-Karten liegen in Data Forts. Ein subsidiary Data Fort existiert weiter, solange mindestens eine Karte in oder auf ihm liegt. | Serverziel-Choices muessen als Data-Fort-Operationen modelliert werden. Leere Remote-Server koennen verschwinden, sobald keine Karte mehr in oder auf ihnen liegt. |
| Subroutinen brechen | Der Runner darf Subroutinen in beliebiger Reihenfolge brechen; nicht gebrochene Subroutinen werden in gedruckter Reihenfolge ausgefuehrt. | Break-Actions brauchen Zielauswahl pro Subroutine. Resolve bleibt printed-order fuer ungebrochene Subroutinen. |
| Icebreaker-Faehigkeiten | Icebreaker-Funktionen sind grundsaetzlich nur waehrend eines passenden Encounters mit passendem ICE/Subroutine-Typ nutzbar, ausser der Kartentext erlaubt etwas anderes. | LegalActions fuer Breaker muessen Encounter, ICE-Typ und Subroutine-Typ validieren. |
| Action-Kosten auf Karten | Kartenfunktionen mit Action-Kosten werden grundsaetzlich nur waehrend des eigenen Zugs genutzt. | Installierte Programme wie `Newsgroup Filter` bleiben Runner-turn-gebundene Actions, sofern der Kartentext nichts anderes sagt. |
| Gleichzeitige Funktionsfenster | Wenn beide Seiten im selben Moment Funktionen nutzen koennen, erhaelt der Runner zuerst Gelegenheit, dann die Korp. | Timingfenster muessen die Runner-priority abbilden, bevor Corp-Reaktionen angeboten werden. |

## Was damit sofort weniger hart blockiert ist

`Tutor` ist durch die Errata am saubersten vorwaertsfaehig. Die Karte braucht keinen neuen Kartenfakt, sondern einen engen run-weiten Modifier-Vertrag fuer kuenftige Encounters.

`Security Purge` ist fachlich deutlich enger: installierbare und rezzbare ICE muessen nach Moeglichkeit installiert und gerezzt werden, Zusatzkosten bleiben Kosten, und weniger als drei R&D-Karten sind erlaubt. Der harte Restblocker ist nicht mehr "was bedeutet der Karteneffekt?", sondern "welche lokalen Choices fuer Zielserver und Reihenfolge erlaubt NETGRID?".

`Hammer` verliert den falschen Stealth-Vorblocker und ist fachlich geschlossen. Es bleibt als Runtime-/Testumsetzung offen.

`Zetatech Software Installer` ist fuer recurring Credits, Installkosten 0 und MU 1 geklaert. Offen bleibt der technische Zahlungs- und Overlay-Vertrag.

## Weiterhin zu klaerende Projektvertraege

1. `Security Purge`: Zielserver und Reihenfolge fuer mehrere aufgedeckte ICE.
2. `Data Fort Reclamation`: On-score-Auswahl, Zahlungsaufteilung und Install-/Rez-Sequenz.
3. `Viral 15`: genaues Runner-Choice-Fenster fuer Programm-Trash.
4. `Haunting Inquisition`: Action-Lock-Lebensdauer und Bonus-Run-Ausnahmen.
5. `Flak`, `Japanese Water Torture`, `Reflector`, `Hammer`: gemeinsamer Icebreaker-/Subroutine-Vertrag.
6. `Zetatech Software Installer`: Restricted-Credit-Zahlungsfenster und Overlay-Vertrag.

## Empfohlener naechster Schnitt

Der naechste kleine Runtime-Schnitt sollte `Tutor` sein. Die Errata klaert genau den riskanten Punkt, naemlich dass Tutor sich nicht sofort selbst modifiziert. Danach eignet sich `Security Purge` fuer einen dokumentierten Choice-Vertrag, sofern die lokale Projektentscheidung lautet:

- R&D wird von oben nach unten aufgedeckt.
- Die Korp verarbeitet aufgedeckte ICE in dieser Reihenfolge.
- Pro ICE waehlt die Korp einen legalen Zielserver.
- Das ICE wird dort installiert und, wenn alle zusaetzlichen Kosten zahlbar sind, sofort gerezzt.
- Nicht installier-/rezzbare oder nicht-ICE Karten folgen der Kartenanweisung fuer den Rest der aufgedeckten Karten.
