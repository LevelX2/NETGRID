# Match 7d284 Corp Play-Strength Final Review

## Ergebnis

Die zehn freigegebenen Fehlergruppen aus
`match_7d284874cdf8a712` sind an ihren fachlichen Quellen behoben. Die Änderung
verwendet keine UI-Korrekturscores, keine erfundenen Aktionen und keine
verdeckten Runner-Daten.

## Architekturentscheidungen

- Pläne binden konkrete aktuelle LegalActions. Zukünftige Schritte werden nur
  aus geprüften sichtbaren Karten-Hints projiziert und erst nach erneuter
  LegalAction-Prüfung ausgeführt.
- Same-Turn-Scorepfade rechnen Installation, Operationskosten, Basic Advances
  und klickfreies Scoring gemeinsam. Normale angreifbare Mehrzug-Scorelines
  werden nicht durch rohe ICE-Anzahl freigegeben.
- BBS ist endliche Action-Economy und damit kein Broker-artiger Investment-
  Bankplan. Ein aktiver BBS-Pool wird vor der nächsten Kopie geleert.
- ICE-Placement bewertet zusätzliche Layer nach ihrem sichtbaren Grenznutzen.
  Rez-Entscheidungen erhalten ein echtes Restpfadbudget.
- Der technische Action-Typ `rez_ice` begründet allein keinen ICE-Plan mehr.
  Root-Karten verwenden ihren geprüften Effektzeitpunkt; Access-Ambushes
  bleiben verdeckt.

## Regressionen

- Project Zurich plus Systematic Layoffs: Installieren, zwei Counter, Basic
  Advance, Score in drei Klicks und neun Credits.
- Corporate Retreat: sichtbare Agenda bleibt als dreizügiger Scoreline-Plan
  vorhanden.
- Project Babylon: erreichbare verzögerte Agenda-Linie wird abgewertet.
- BBS: Install-, Rez- und wiederholte Zwei-Credit-Schritte; keine zweite
  Installation bei aktivem Pool.
- Opening: konkrete R&D-Verteidigung schlägt erstes leeres Remote.
- Sechste schwache Central-Layer mit hohem Installpreis und Breakkosten eins
  wird vertagt.
- Äußeres Rez unter innerem Rez-Floor erhält direkten Malus.
- Setup wird nicht gerezzt; Red Herrings wird vor dem letzten ICE vertagt und
  im letzten relevanten Fenster positiv bewertet.

## Gates

- AI-Testshards: 283 Dateien, 1.829 Tests grün.
- `@netgrid/ai` Typecheck grün.
- `check:ai` und `check:package-boundaries` grün.
- `git diff --check` grün.

Der ungeshardete AI-Gesamtlauf überschritt den 120-Sekunden-Werkzeug-Timeout.
Die drei projektdefinierten Shards decken denselben Testbestand vollständig ab
und bestanden ohne rote Tests.
