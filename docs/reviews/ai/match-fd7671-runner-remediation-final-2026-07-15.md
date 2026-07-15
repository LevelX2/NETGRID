# Match FD7671: Runner-KI-Remediation – Final Review 2026-07-15

## Status

Die fünf freigegebenen Findings aus `match_fd7671d270e1a716` sind im
Arbeitsbranch `codex/ai-match-fd7671-remediation` mit historischen roten
Beweisen, generischen Korrekturen und Gegenproben abgeschlossen. Der Branch
ist für die lokale Fast-forward-Integration nach `main` vorbereitet.

## Umgesetzte Verhaltensänderungen

### Run-Lock und Matchpoint-Konvertierung

- Ein bezahlbarer Run-Lock wird bei gegnerischem Matchpoint nur gelöst, wenn
  ein weiterer Run-Click und ein side-safe erreichbar bewerteter Payoff-Pfad
  verbleiben.
- Bekannte unpassierbare ICE-Pfade erzeugen keinen falschen Hard-Interrupt.
- Die D102-Runreserve schützt zentralen Low-Value-Trash nur mit konkretem
  Folgerun, Click, Pfadquote und ohne akute höherwertige Ausgabe.

### SeeYa-Expose

- Expose-Ziele werden nach sichtbarem Wert und exakter Positionshistorie
  geordnet.
- Spätere Install-, Move-, Swap- oder Trash-Ereignisse invalidieren die
  positionsbezogene Erinnerung; wiederholtes Expose derselben unveränderten
  Position bleibt abgewertet.

### Tutorplan und früher Check-Run

- Ein Tutor ohne aktuelle Coverage-Lücke darf nicht mehr absolut eine
  deutlich bessere konkrete Aktion blockieren.
- Ein sicherer früher Informationsrun darf bei unbekanntem Payoff und
  reachable side-safe Pfad eine direkte Breaker-Installation überstimmen.
  Die Regel greift nicht für Gain/Draw, bekannte unpassierbare Pfade oder
  unvermeidbare sichtbare ICE-Gefahren.
- Damit bleibt ausdrücklich erhalten, dass ein Check vor der Installation
  strategisch besser sein kann: Das unbekannte ICE kann günstig/passierbar
  sein, während ein falscher vorinstallierter Breaker getrasht werden kann.

### Rex-Hint und tatsächliche Consumer

- Rex trägt Trace-, conditional-End-the-run- und Run-Lock-Semantik, aber keine
  Tagquelle.
- Action-Semantik projiziert `trace.source` nur innerhalb der vorhandenen
  Function-Signal-Scope-Gates; Installation oder Rezzen wird nicht zur
  ausführbaren Trace-Aktion.
- Tag-Punish verlangt eine echte Tagquelle beziehungsweise eine ausdrücklich
  an Trace-Erfolg gebundene `tag_source`-Semantik.
- Native ICE-Traces transportieren ihre SourceDefinition bis zum Bid-
  Consumer. Die Corp kann einen belegten Trace-Payoff finanzieren, bietet aber
  nicht unbeschränkt all-in und bewahrt eine Reserve. Operationen und andere
  Nicht-ICE-Quellen werden von dieser Ausnahme nicht erfasst.

## Historische und zusätzliche Red Evidence

Die ursprünglichen D53-, D102-, D132- und D135-Checkpoints sowie der Rex-
Hintvertrag wurden vor dem jeweiligen Fix rot gesichert. Der nachgelagerte
Consumer-Audit ergänzte getrennte rote Beweise für:

- falsche Rex-Action-Projektion;
- fehlende native Trace-Payoff-Bewertung;
- Source-Bindung des realen Encounter-Traces;
- überbreite Tag-Ontologie;
- zu breite Matchpoint-Reserve;
- fehlerhafte Positionsmemory nach Replacement;
- fehlende frühe Check-Run-Kontrolle.

Alle Erwartungen blieben beim Fix unverändert; positive und negative
Gegenproben sind grün.

## Analyse-Skill

Der lokale Skill
`C:\Users\Lui\.codex\skills\netgrid-ai-spielanalyse-worktree` besitzt jetzt
eine verpflichtende vollständige Audit-Checkliste für:

- Decision-Denominator und Trace-Coverage;
- Parent-Child-Sequenzen;
- Hint-Übergaben bis Consumer und Arbitration;
- Plan-Lebenszyklus und Revalidation;
- kausale historische Checkpoints;
- faire Check-/Facecheck-Vergleiche;
- Regelrestriktionen über Basic-, Karten-, Restricted- und Bonus-Actions samt
  erneutem Engine-Ausführungs-Guard.

Die Skill-Validierung endet mit `Skill is valid!`.

## Neues letztes Spiel

Das nach der Umsetzung ausgewählte neueste abgeschlossene Match
`match_ecfe3ce373a56823` ist mit der erweiterten Checkliste vollständig
analysiert. Der führende Bericht ist
`docs/reviews/ai/match-ecfe3ce-full-decision-audit-2026-07-15.md`.

Die Coverage ist geschlossen: 208 erwartete Runner-Entscheidungen, 208
klassifizierte Traces, keine Lücke oder Dublette. Die Analyse fand zwei neue,
nicht stillschweigend umgesetzte Fehlergruppen:

1. D59 bewertet einen bekannten Barrier-Pfad trotz Dwarf im Heap als
   erreichbar und blockiert den um 1126 besseren freien HQ-Run.
2. Nach Fang bleibt die 2-Credit-Run-Sperre aktiv, aber Run-Events und
   Bonus-Runs umgehen den Engine-Guard. D115, D134, D150, D175, D189 und D192
   sind deshalb regelwidrige Elternaktionen; der Matchsieg ist als
   KI-Qualitätsbeleg ungültig.

Zusätzlich sind Fang- und All-Nighter-Hints sowie Private-LDL-, Bodyweight-
und TKO-Consumer als eng begrenzte Daten-/Übergabelücken dokumentiert. D26
bleibt bewusst nur eine Facecheck-Risikobeobachtung, weil die spätere
Aufdeckung von D'Arc Knight nicht als damaliges Wissen benutzt werden darf.

## Verifikation

- 11 fokussierte Testdateien: 120/120 Tests grün
- vollständige KI-Suite: 338/338 Testdateien und 2316/2316 Tests grün
- `@netgrid/ai` TypeScript-Check: grün
- kompilierte Hint-Verträge: grün, nur bekannte Warnungen
- Derived-Facts-Normalcheck: grün, nur bekannte Warnungen
- Hint-Inspector-Index: grün
- Deck-Doctrine-/Strategy-Gate: grün
- Action-Semantic-Signal-Katalog: grün
- Manual-Overlay-Gate: grün
- `git diff --check`: grün

`check:ai:full` erreicht weiterhin den vorbestehenden
`check:ai-derived-facts-full`-Inventardrift: Das versionierte Full-Inventar
erwartet 616 aktive Hints, der aktuelle Repository-Stand besitzt 618. Die
beiden zusätzlichen Karten sind `Protected Resources` und `Phone Freak` und
gehören nicht zu diesem Arbeitsstrang; erzeugte Fremdänderungen wurden nicht
übernommen.

## Grenzen und Nicht-Ziele

- Keine Engine-, LegalAction- oder Kartenregeländerung im FD7671-Scope.
- Keine Karten-ID-Sondergewichte.
- Keine automatische Umsetzung der neuen ECFE3CE-Funde ohne eigenes
  Freigabe-Gate und aktuelle rote Reproduktion.
- Kein Push und kein Pull Request.

## Integrationsstatus

Der Arbeitsbranch hat den abschließenden Verify-Lauf bestanden und wurde lokal
per Fast-forward nach `main` integriert. Auf dem integrierten Stand sind die
11 fokussierten Testdateien mit 120/120 Tests und der AI-Typecheck erneut grün;
der temporäre Worktree und Arbeitsbranch werden anschließend verifiziert
entfernt.
