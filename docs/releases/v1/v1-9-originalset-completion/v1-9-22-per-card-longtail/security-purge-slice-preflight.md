# V1.9.22 Security Purge Slice Preflight

Stand: 2026-05-14
Status: Runtime-WIP umgesetzt, keine Catalog-/AI-/Release-Promotion

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

Der Runtime-WIP nutzt bewusst den engen lokalen Serverzielvertrag: revealed ICE werden in Reveal-Reihenfolge jeweils in ein neues Remote installiert und sofort rezzed; Nicht-ICE wird faceup nach Archives getrasht. Das ist runtime-seitig dokumentiert und keine Catalog-, AI- oder Release-Promotion. Eine explizite Korp-Choice fuer Serverziele bleibt Folgearbeit, falls dieser lokale WIP-Vertrag spaeter ersetzt werden soll.

## Nachklaerung 2026-06-11

Ein Playtest-Fund ersetzt die fachliche Annahme fuer die spaetere Promotion: Der neue-Remote-je-ICE-Vertrag darf nicht fuehrend bleiben. Security Purge erzwingt weiterhin, revealed ICE zu installieren und zu rezzen, soweit das moeglich ist; die normale Installationsentscheidung fuer ICE bleibt aber eine Korp-seitige Serverzielwahl. Die Comprehensive-Rules-Referenz bestaetigt fuer Korp-Installationen: Beim Installieren einer Agenda, eines Assets, Upgrades oder ICE waehlt die Korp einen Zielserver; ein neues Remote entsteht nur, wenn die Korp es als Zielserver fuer die Installation ansagt; ICE wird, falls nicht anders angegeben, in die aeusserste Position vor dem gewaehlten Server installiert.

Der naechste Security-Purge-Schnitt soll daher fuer jedes revealed ICE eine Korp-Choice anbieten: vorhandene Zentralserver, vorhandene Remotes, sofern legal, sowie ein neues Remote. Die Choice muss LegalAction-/applyAction-revalidiert, side-sicher und replay-stabil sein. Die Chronik muss ausserdem die revealed Karten, die installierten und gerezzten ICE inklusive Zielserver sowie die getrashten Restkarten beziehungsweise deren Count/Titel oeffentlich nachvollziehbar ausgeben.

## Removal Condition

Security Purge bleibt bis zur Finalisierung in WIP. Removal Condition fuer Promotion:

1. Catalog-, AI- und Release-Promotion-Gates sind finalisiert.
2. Der lokale neue-Remote-je-ICE-Vertrag wird bestaetigt oder durch eine explizite Korp-Choice ersetzt.
3. Zusaetzliche Install-/Rez-Kosten werden, falls im Kartensystem relevant, side-sicher modelliert und getestet.
