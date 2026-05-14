# V1.9.22 Security Purge Slice Preflight

Stand: 2026-05-14
Status: WIP-Preflight mit Errata-1.70-Klaerung, keine Runtime-/Catalog-/AI-Promotion

## Lokaler Regelkern

`data/rules/v1922-local-card-facts.json` fuehrt fuer `onr_v1_216_security-purge` folgende lokal bestaetigte Fakten:

- Seite/Typ: Korp-Agenda, Gray Ops.
- Zahlen: Advancement Requirement 3, Agenda Points 2, R&D-Reveal-Count 3.
- Effektkern: Beim Scoren die obersten drei R&D-Karten revealn; ICE kostenlos installieren und rezzen; den Rest trashen.
- Errata 1.70: Wenn weniger als drei Karten in R&D liegen, werden nur die vorhandenen Karten gezeigt und der Effekt soweit moeglich ausgefuehrt. "At no cost" deckt nur die gedruckten Rez-Kosten ab, nicht zusaetzliche Kosten. Security Purge instruiert Installieren und Rezzen; wenn zusaetzliche Install-/Rez-Kosten zahlbar sind, muessen sie bezahlt werden.

## Umsetzungsschnitt

Der naechste sichere Code-Schnitt ist ein On-score-Resolver fuer `score_agenda`, der R&D-Top-3 side-sicher behandelt und nicht promotet. Durch Errata 1.70 ist die Auswahl enger als bisher angenommen:

- Auswahl: Revealed ICE werden, soweit moeglich, installiert und gerezzt; eine freie Teilmengenauswahl ist nicht mehr die fuehrende Annahme.
- Platzierung: Es braucht weiter eine side-sichere Zielprojektion je ICE, weil die Errata nicht festlegt, ob automatisch ein neues Remote genutzt oder je ICE ein Serverziel gewaehlt wird.
- Reihenfolge: Werden mehrere ICE in Reveal-Reihenfolge installiert oder durch eine Korp-Choice geordnet?
- Visibility: PublicPayload darf keine unrevealed R&D-/HQ-/CardInstance-Daten leaken; revealed Karten und Trash-/Install-Zaehlungen muessen genuegen.
- Replay: Choice-IDs und Install-Reihenfolge muessen deterministisch sein.

## Entscheidung

Kein Runtime-Code in diesem Preflight. Die Errata hebt den Teilmengen-Blocker weitgehend auf, laesst aber Serverziel und Reihenfolge offen. Ein spaeterer Implementierungsschnitt sollte daher entweder eine explizite Korp-Choice fuer Serverziele/Reihenfolge nutzen oder einen bewusst engen WIP-Serverzielvertrag vorab dokumentieren.

## Removal Condition

Security Purge kann in Code gehen, sobald fuer die revealed ICE feststeht:

1. wie Serverziele je ICE gewaehlt werden,
2. ob Reveal-Reihenfolge oder eine Korp-Choice die Install-/Rez-Reihenfolge bestimmt,
3. wie zusaetzliche Install-/Rez-Kosten geprueft und bei Nicht-Zahlbarkeit side-sicher behandelt werden.
