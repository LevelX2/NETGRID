# Final Review: Generische KI-Fähigkeitsmigration

Datum: 01.08.2026

Status: **freigegeben**

## Ergebnis

Die sieben priorisierten Korrekturpakete sind umgesetzt. Die produktive KI
erkennt die betroffenen wiederverwendbaren Fähigkeiten nicht mehr über
zentrale Karten-ID- oder Kartennamenlisten, sondern über die Kette

```text
aktive Karten-Hints
→ exakt gebundene LegalAction-/Ability-Semantik
→ ActionSemanticCandidate
→ typisierte Plan-Step-Anforderung
→ bestehender Planowner
```

Aktuelle Kosten, Ziele, Mengen, Forts, Timingfenster und zustandsabhängige
Folgen bleiben Engine- beziehungsweise LegalAction-autorisiert. Die Migration
hat keinen zweiten Action-Chooser, Resolver oder Planowner eingeführt.

## Abgeschlossene Pakete

| Paket | Ergebnis                                                                                               | Commit      |
| ----- | ------------------------------------------------------------------------------------------------------ | ----------- |
| GC01  | Strukturierte Hint-Effekte erreichen verlustfrei Candidate und Kartenkontext.                          | `3aac85c5c` |
| GC02  | Produktive Effekte sind an die konkrete Action/Ability gebunden; Mehrdeutigkeit scheitert fail-closed. | `2a352d13c` |
| GC03  | Grubb-, SeeYa-, Economy-Pool-, Team-Restructuring- und Tag-Descriptor-Fallbacks wurden entfernt.       | `ce3d9045e` |
| GC04  | Plan-Steps matchen typisiert Effektart, Timing, Scope, Ressource, Ziel und Wiederholungsvertrag.       | `80463675a` |
| GC05  | Corp-Defense verwendet strukturierte Subtyp-, Scope-, Same-Fort- und Encounterprofile.                 | `b0d6e6294` |
| GC06  | Konditionale Defense-Folgen verwenden exakt gebundene Engine-Quotes und den bestehenden Defense-Owner. | `ede351ed0` |
| GC07  | Zufallsbruch/Eigenschaden verwendet allgemeine Hint-, DTO-, Event-, Risk- und Evidence-Verträge.       | `64a97667a` |

## Architekturgrenzen

- `data/ai/ai-card-hints-active.json` bleibt die einzige statische
  Hint-Quelle; es entstand kein Compiler, Overlay oder persistierter
  Derived-Facts-Bestand.
- Hints klassifizieren Funktion, erzeugen aber weder Legalität noch aktuelle
  Beträge oder Ziele.
- `functionalEffects` einer Action und passiver
  `cardContextFunctionalEffects` sind getrennt.
- Choice-Resolver wählen keine Karte, Ability, Source, Fort oder Strategie.
- Zufall bleibt Engine-seitig seed- und record-basiert. Die KI konsumiert nur
  side-sichere generische Outcome-Felder.

## Restinventar und Klassifikation

Der Abschluss-Scan findet keine produktive KI-Entscheidung mehr, die Blink
über Definition-ID, Kartenname oder alte Blink-Payloadfelder erkennt. Der
konkrete Blink-Name verbleibt nur in Engine-Implementierung, Test-/Benchmark-
Fixtures und historischen Artefakten; dort bezeichnet er eine konkrete Karte
und keine generische Entscheidungsregel.

Verbleibende Definition-IDs in produktiven KI-Pfaden gehören überwiegend zu
drei zulässigen Klassen:

1. konkrete Source-/Instanz- und Lifecyclebindung, etwa Loan from Chiba,
   Junkyard BBS, All-nighter und The Shell Traders;
2. individuelle Plan- oder Engine-Modelle, etwa Social Engineering und
   konkrete Corp-Punish-Quotes;
3. Simulation, Corpus, Test-Support und Diagnostik ohne Live-Autorität.

Zusätzlich verbleiben außerhalb des vereinbarten Siebener-Scope aktive
Text-/Tokenheuristiken und einzelne Kartenfamilien-Tabellen, unter anderem in
Runner-Economy/-Handentwicklung, sichtbarer Breaker-Coverage,
Corp-Scoreline/-Defense und Simulationseinstufungen. Sie sind nicht pauschal
entfernbar: Ein Teil ist nur ein weiches Klassifikationssignal, ein Teil
kaschiert noch fehlende Hint- oder Engine-Facts. Für eine Folgemigration muss
je Stelle zuerst Owner, harte/weiche Wirkung und benötigter generischer
Vertrag festgelegt werden. Eine neue zentrale Universalklassifikation wäre
keine zulässige Abkürzung.

## Verifikation

Paketnah vor GC08 bestanden:

- AI-Typecheck;
- 362 betroffene AI-Regressionstests;
- Engine-Typecheck;
- 16 Engine-Smoke-Tests für den generischen PublicEvent-Vertrag;
- `format:changed` und `git diff --check`.

Final nach Integration des aktuellen `main` bestanden:

- `@netgrid/shared`, `@netgrid/engine` und `@netgrid/ai` Typecheck;
- `check:ai-source-structure`: 755 produktive Dateien, keine Runtime- oder
  Typzyklen;
- `check:package-boundaries`: 1.998 geprüfte Dateien;
- `check:ai`: Hint-Metadatenvertrag ohne Hard Error und Source-Structure grün;
- `test:ai:shards`: 548 Testdateien und 4.490 Tests grün;
- vollständiger Engine-Test: 212 Testdateien und 1.841 Tests grün;
- vollständiger Shared-Test: eine Testdatei und 16 Tests grün;
- `format:changed` und `git diff --check` grün.

Unmittelbar vor der lokalen Integration wurde der zwischenzeitlich auf
`main` hinzugekommene Run-Start-Eligibility-Vertrag (`e0071801e`) erneut in
den Arbeitsbranch gemergt. Der einzige manuelle Konflikt betraf das gemeinsam
ergänzte August-Wissenslog; beide Einträge wurden vollständig erhalten. Alle
oben genannten Gates wurden auf diesem finalen Merge-Stand wiederholt.

Der erste AI-Typecheck mit dem Node-Standardheap endete bei etwa 4 GB mit
Speichermangel. Derselbe unveränderte Paket-Typecheck bestand anschließend mit
`NODE_OPTIONS=--max-old-space-size=8192`; es lag kein Typfehler vor.

Der erste vollständige AI-Shard-Lauf deckte vier veraltete Test-Fixtures auf:
zwei Blink-Evidence-Erwartungen und zwei künstliche Danshi-LegalActions ohne
den inzwischen von der Engine gelieferten `remove_tags`-Effektvertrag. Die
Fixtures wurden im Fixcommit `47f98ccaf` an die produktiven generischen
Verträge angepasst; der vollständige Wiederholungslauf war grün.

## Bewusst vertagter Folgeschritt

Neue Baseline-Kriterien, zusätzliche Play-Strength-Metriken und eine
verbindliche Erweiterung der Abnahmebedingungen waren kein Teil dieses
Umsetzungsprozesses. Sie werden auf Basis dieses bereinigten Architekturstands
gesondert diskutiert. Sinnvolle Kandidaten sind generische Future-Card-
Kontrakttests, Ownership-/Action-Bindungs-Invarianten und messbare
Verhaltensgates für neue Funktionsfamilien.
