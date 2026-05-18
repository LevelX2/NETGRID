# V1.9.22 Errata 1.70 Source Review

Stand: 2026-05-14
Status: vorbereitende Quellen-/Vertragsklaerung, keine Runtime-, Catalog- oder AI-Promotion

## Quelle

- Versionierte lokale PDF: `docs/source/Netrunner_Errata_v1.70.pdf`
- Ursprungsfund: `C:\Projekte\NETGRID\docs\source\Netrunner_Errata_v1.70.pdf`
- Extraktion: `pdftotext -layout -enc UTF-8`
- Quelle ist ein offizielles Wizards-of-the-Coast-Errata-/Ruling-Dokument fuer klassisches Netrunner, Stand im Dokument: 2000-03-11.
- Lesefreundliche Arbeitsgrundlage fuer V1.9.22: `docs/releases/v1/v1-9-originalset-completion/v1-9-22-per-card-longtail/errata-1-70-readable-extract.md`

## Ergebnis

Die Errata-Datei ersetzt nicht die lokale Kartenfaktenbasis, klaert aber mehrere noch offene Handling- und Timingfragen fuer V1.9.22. Dieser Review ist nur Vorbereitungsartefakt: Er oeffnet keine Karte fuer `human_playable`, `deck_legal`, `ai_supported` oder Release-Promotion.

## Geklaerte Punkte

| Karte | Klaerung aus Errata 1.70 | Auswirkung fuer V1.9.22 |
| --- | --- | --- |
| `Data Fort Reclamation` | Die Korp darf zusaetzliche Credits aus dem eigenen Creditpool zum Installieren/Rezzing verwenden. Das neue Data Fort entsteht durch den Score-Effekt selbst; daraus entstehen keine Aktionen, die fuer andere Kosten geforgoed werden koennten. | Der Vertrag kann nach Spoiler-Abgleich als On-score-Choice mit temporaerem 10-Credit-Pool plus zusaetzlich nutzbaren Korp-Credits vorbereitet werden. Die Install-/Rez-Sequenz bleibt engine-seitig separat zu modellieren. |
| `Security Purge` | "At no cost" deckt nur die gedruckten Rez-Kosten ab, nicht zusaetzliche Kosten. Die Karte instruiert Installieren und Rezzen; wenn weniger als drei R&D-Karten vorhanden sind, werden nur vorhandene Karten gezeigt und der Effekt soweit moeglich ausgefuehrt. | Der alte Blocker "Teilmenge oder alle ICE?" wird enger: revealed ICE sind, soweit moeglich, zu installieren und zu rezzen. Offen bleibt nur die side-sichere Serverziel- und Reihenfolgeprojektion. |
| `Haunting Inquisition` | Mehrere Haunting-Inquisition-Effekte laufen parallel, nicht seriell. Die sechs Aktionen muessen tatsaechlich genommene Aktionen sein; nicht genommene oder nur gewonnene Aktionen zaehlen nicht. Bonus-Runs ausserhalb einer Aktion werden durch die erste Subroutine nicht verboten. | Der Contract kann als Action-Lock-Zaehler ueber tatsaechlich verbrauchte Runner-Aktionen modelliert werden; reine Bonus-Run-Fenster duerfen nicht pauschal gesperrt werden. |
| `Tutor` | Tutor modifiziert sich nicht selbst, ausser der Runner encountert dasselbe Tutor spaeter im Run erneut. | Der run-weite Zusatz-ETR-Modifier gilt erst fuer spaetere Encounter nach der ausgeloesten Subroutine. |
| `Viral 15` | Der Runner waehlt die zu trashenden Programme. | Die Program-trash-Folge braucht eine Runner-private Programmauswahl, keine Korp-Auswahl. |
| `Speed Trap` | Speed Trap kann nur als Reaktion auf das Rezzen eines Upgrades oder Nodes aktiviert werden. Wird es nach dem letzten ICE aktiviert, gilt der Run als erfolgreich, aber der Runner accessed keine Karten. | Der Trigger ist eng: direkt nach Corp-Rez eines Upgrades/Nodes vor dessen Effekt. Der Runabschluss muss "successful without access" abbilden koennen. |
| `Startup Immolator` | Errata: Faehigkeit wird nach dem Passieren des ICE genutzt, wenn alle Subroutinen dieses ICE gebrochen wurden. Startup Immolator kann nur waehrend eines Runs genutzt werden. | Der bisherige "just broken all subroutines"-Blocker wird enger: Trigger ist nach dem Passieren des ICE, nicht sofort beim Brechen der letzten Subroutine. |
| `Poltergeist` | Errata: "Put [2] from the bank on Poltergeist"; genutzte Credits werden zu Beginn des naechsten Runner-Zugs aus der Bank ersetzt. | Lokale Faktenbasis muss von 1 auf 2 recurring restricted Credits korrigiert werden. |
| `Scatter Shot` | Errata: Wenn Credits genutzt werden, werden sie zu Beginn des naechsten Runner-Zugs aus der Bank ersetzt. | Refresh-Timing ist bestaetigt. Nach Spoiler-Abgleich fuehrt die lokale Faktenbasis 2 recurring restricted Credits. |
| `Zetatech Software Installer` | Errata: "Put [2] from the bank on Software Installer"; genutzte Credits werden zu Beginn des naechsten Runner-Zugs aus der Bank ersetzt. | Der recurring-credit- und Refresh-Vertrag ist bestaetigt. Installkosten 0 und MU 1 sind durch Nutzerklaerung vom 2026-05-14 nachgezogen; offen bleiben Zahlungsfenster und Overlay-Vertrag. |
| `Hammer` / Noisy-Karten | Noisy-Karten koennen ohne Stealth-Karten im Spiel genutzt werden; der Verlust kommt aus Stealth-Karten, wenn vorhanden. | Hammer darf nicht blockiert werden, nur weil keine Stealth-Karte installiert ist. Nutzerklaerung 2026-05-14: `1: Break Wall subroutine`, `1: +1 Strength`; beim Hammer-Break verliert der Runner insgesamt bis zu 2 von Stealth-Karten, Verteilung nach Runner-Wahl. |

## Nutzerklaerung

`Newsgroup Filter` wird nicht durch die Errata-Datei geklaert. Die fuer V1.9.22 fuehrende lokale Nutzerklaerung vom 2026-05-14 lautet:

- Runner-Programm
- Installkosten 5
- MU 2
- Aktivierte Faehigkeit: `[A]: Gain 2 Credits`
- Nutzung im Runner-Aktionsfenster ueber eine normale Aktion, ohne zusaetzliche Ziele oder Hidden-Info.

Weitere Nutzerklaerungen vom 2026-05-14:

- `Zetatech Software Installer`: Installkosten 0, MU 1.
- `Virizz`: Rez-Kosten 2, Staerke 4; fuer den Rest des Runs muss der Runner 1 Credit extra bezahlen, wenn er ICE brechen will.
- `Flak`: Installkosten 4, Staerke 2, `1: Break AP subroutine`, `1: +1 Strength`.
- `Hammer`: Installkosten 2, MU 1, Staerke 2, `1: Break Wall subroutine`, `1: +1 Strength`; beim Hammer-Break verliert der Runner insgesamt bis zu 2 von Stealth-Karten, Verteilung nach Runner-Wahl falls mehrere Quellen verfuegbar sind.
- `Japanese Water Torture`: Installkosten 7, Staerke 2, `0: Break Wall subroutine`, `X: +X strength, and forgo your next X actions`.
- `Reflector`: Program/Icebreaker, MU 1, Installkosten 2, Staerke 4, `0: Break stun, hellbolt or knockout subroutine`.

## Weiterfuehrung

Diese Klaerungen sollen in `data/rules/v1922-local-card-facts.json`, `data/rules/v1922-resolver-contracts.json` und die passenden V1.9.22-Preflights uebernommen werden. Sie sind eine Informationsvorbereitung fuer spaetere Implementierung, keine Umsetzung.
