# V1.9.22 Security Purge Slice Preflight

Stand: 2026-05-13
Status: WIP-Preflight, keine Runtime-/Catalog-/AI-Promotion

## Lokaler Regelkern

`data/rules/v1922-local-card-facts.json` fuehrt fuer `onr_v1_216_security-purge` folgende lokal bestaetigte Fakten:

- Seite/Typ: Korp-Agenda, Gray Ops.
- Zahlen: Advancement Requirement 3, Agenda Points 2, R&D-Reveal-Count 3.
- Effektkern: Beim Scoren die obersten drei R&D-Karten revealn; beliebige ICE kostenlos installieren und rezzen; den Rest trashen.

## Umsetzungsschnitt

Der naechste sichere Code-Schnitt ist ein On-score-Resolver fuer `score_agenda`, der R&D-Top-3 side-sicher behandelt und nicht promotet. Vor einer Engine-Umsetzung muss der Installationsvertrag eng festgelegt werden:

- Auswahl: Bedeutet "any ice" eine optionale Teilmenge der revealed ICE oder zwingend alle revealed ICE?
- Platzierung: Darf jede ICE vor beliebige vorhandene Server, nur vor einen neuen Remote oder braucht jede ICE eine eigene Zielwahl?
- Reihenfolge: Werden mehrere ICE in Reveal-Reihenfolge installiert oder durch eine Korp-Choice geordnet?
- Visibility: PublicPayload darf keine unrevealed R&D-/HQ-/CardInstance-Daten leaken; revealed Karten und Trash-/Install-Zaehlungen muessen genuegen.
- Replay: Choice-IDs und Install-Reihenfolge muessen deterministisch sein.

## Entscheidung

Kein Runtime-Code in diesem Preflight. Eine automatische Installation aller revealed ICE in ein neues Remote waere zwar technisch klein, wuerde aber Optionalitaet und Serverplatzierung erfinden. Der Implementierungsschnitt bleibt deshalb offen, bis der Installationsvertrag lokal bestaetigt oder als bewusst enges WIP-Verhalten freigegeben wird.

## Removal Condition

Security Purge kann in Code gehen, sobald fuer die revealed ICE feststeht:

1. ob die Korp eine Teilmenge oder alle ICE installiert,
2. wie Serverziele je ICE gewaehlt werden,
3. ob und wie Reihenfolge und kostenlose Rez-Schritte als Choices abgebildet werden.
