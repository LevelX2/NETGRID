# Gesamt-Review des KI-Selbstspielprozesses 011–030

Stand: 2026-08-20  
Status: beide angeforderten Arbeitsstränge nach ihren Fünferblöcken beendet;
kein weiterer Zyklus gestartet; Selfplay-Skill aus den gemessenen Befunden
aktualisiert und validiert

## Gesamtergebnis

| Arbeitsstrang | Paarungen | finale Partien | vollständig auditierte Entscheidungen | verifizierte neue Ursachenfixes |
| --- | ---: | ---: | ---: | ---: |
| Direkter Strang 011–015 | 5 | 15 | 5.735 | 29 |
| Paralleler Strang 016–030 | 15 | 45 | 12.244 | 15 |
| **Gesamt** | **20** | **60** | **17.979** | **44** |

Alle finalen Serien verwendeten drei feste Seeds pro Paarung. Decisions und
vollständige Ereignishistorien wurden getrennt paginiert; die jeweiligen
Abschlussreviews weisen terminale Eventabdeckung und fehlende Diagnoseflags
aus. Die beiden zuletzt angeforderten Fünferberichte 011–015 und 026–030
wurden als dauerhafte Repository-HTML-Dateien erzeugt und an das
authentifizierte Gmail-Konto `me` (`ludwig.hirth@googlemail.com`) gesendet.
Gmail bestätigt jeweils `SENT` und `INBOX`. Auch die zuvor falsch adressierten
Berichte 016–020 und 021–025 wurden an dieses Konto erneut zugestellt.

## Warum die Stränge unterschiedlich viele Paarungen abschlossen

Der Unterschied ist überwiegend inhaltlich und organisatorisch, nicht durch
eine grundsätzlich andere Modellleistung verursacht:

1. Der direkte Strang traf in nur fünf Paarungen auf 29 klare Ursachenfehler.
   Jeder Fehler benötigte Architektur-Preflight, roten Ownership-/
   Regressionstest, Ursachenpatch, fokussierte Tests und exakten Replay. Das
   sind im Mittel fast sechs Fixschleifen je Paarung.
2. Der parallele Strang fand in 15 Paarungen 15 neue Ursachenfixes. Mehrere
   Paarungen lieferten nur Gegenindikation oder Verdachtsverdichtung und
   konnten nach vollständiger Analyse ohne Codeänderung schließen.
3. Der direkte Strang übernahm zusätzlich den Aufbau und die Korrektur des
   Skills, Reporting-Design, Gmail-Adressdiagnose, erneute Zustellung und die
   Nutzerabstimmung. Diese Arbeit erhöht Qualität und Wiederverwendbarkeit,
   zählt aber nicht als weitere Deckpaarung.
4. Der parallele Strang konnte auf den bereits integrierten Fixes aufsetzen,
   eine fortgeschriebene Datenbank und einen vorbereiteten Driver
   wiederverwenden und dadurch mehr reine Paarungen abarbeiten.
5. Beide Stränge hatten einen komplexen seriellen Endfall: P015 erforderte
   mehrere voneinander abhängige Access-/Kampagnenfixes; P030 legte nach der
   ersten Choice-Reparatur eine zweite Plan-/Choice-Bindungsdrift frei.

Die richtige Kennzahl ist daher nicht Paarungen pro Agent allein. Der direkte
Strang lieferte deutlich mehr Ursachenfixes je Paarung; der parallele Strang
lieferte mehr unabhängige Matchup-, Gegenindikations- und
Cross-Pairing-Evidence.

## Was bereits effizient und fachlich richtig läuft

- Drei Seeds pro Paarung trennen Tendenz besser von Einzelvarianz, ohne den
  vollständigen Analyseumfang unkontrolliert zu vervielfachen.
- Die isolierten SQLite-Datenbanken werden je Arbeitsstrang längsschnittlich
  weiterverwendet und nicht zwischen Paarungen geleert.
- Der normale Server-/Engine-/KI-Pfad erzeugt die Evidence; SQLite wird nicht
  als Analyseabkürzung direkt gelesen oder verändert.
- Decisions werden in großen Seiten ohne wiederholte Eventeinbettung geladen;
  die vollständigen Events folgen separat bis zum Terminal.
- Ein kompletter Sequenzvergleich identifiziert den ersten Replay-Unterschied.
  Identische Präfixe bleiben im Denominator, müssen aber nicht erneut tief
  interpretiert werden.
- Klare Fehler erhalten fokussierte Verhaltens- und Ownership-Tests. Reine
  Niederlagen, hohe Credits oder ungewöhnliche Züge werden nicht ohne
  dominanten Gegenpfad zu Bugs erklärt.
- Verdachtsfälle bleiben mit Decks, Seeds, Matches, Entscheidungsfenstern und
  Removal Condition in der kumulativen Matrix erhalten.
- HTML-Berichte liegen nun dauerhaft unter `docs/reviews/ai/`; temporäre
  `.codex/visualizations` sind nicht mehr die einzige Vorschauquelle.

## Gemessene Redundanz und Zeitfresser

### Analyseausgabe und lokale Artefakte

Der P030-Analyzer schrieb trotz vorhandener kompakter
`analysis-summary.json` nochmals Vollobjekte mit mehr als 48.000 Tokens auf
stdout. Die finale P030-Artefaktgruppe belegt 296.255.583 Bytes; Bundle- und
Finaldateien überlappen teilweise. Diese Datenmenge ist für forensische
Evidence vertretbar, aber nicht für den normalen interaktiven Pfad.

### Zu frühe Replays und Zwischen-Merges

Vor dem SP-074-Ursachennachweis wurden mehrere vollständige Problemseed-
Replays und Serverneustarts ausgeführt. Außerdem gelangten spekulative
Teilfixes vor dem terminal grünen Problemseed in die gemeinsame Historie.
Das erzeugte zusätzliche Abgleich-, Merge- und Replay-Runden.

### Zu breite Tests während der Diagnose

Mehrfach liefen thematische Suiten mit ungefähr 346 Tests, obwohl zunächst
ein einzelner Invariant rot war. Ein direkter TypeScript-Lauf scheiterte
zusätzlich am 4-GB-Heap, obwohl der Paket-Typecheck bereits einen geeigneten
Speicherrahmen bereitstellt. Im direkten Strang erzeugte ein paketfalsch
präfixierter Vitest-Pfad einen sofortigen „keine Testdateien“-Lauf.

### Shell- und CLI-Fehler

PowerShell führt nach einem fehlgeschlagenen Befehl bei bloßer Trennung mit
Semikolon weiter aus. So konnte ein später erfolgreicher Commit den Exitcode
einer vorher roten Berichtsaussage überdecken; der Berichtstest fand dabei
immerhin noch die falsche 12:3- statt 13:2-Siegbilanz. Ein paralleler
Analyzer-Aufruf verwendete außerdem einen positionsabhängigen Suffix statt
der benannten Option und musste wiederholt werden.

### Git- und Parallelkoordination

Frühere Statusmeldungen bezeichneten Arbeitsstände als nach `main`
integriert, obwohl die physische primäre Checkout-Historie das zeitweise
nicht eindeutig belegte. Shared Matrix-, Log-, Finding-ID- und Reporting-
State-Änderungen benötigen deshalb eine serialisierte Integrationsphase und
exakte Ancestry-Prüfung gegen den physischen Main-Pfad.

### Sichtbarer Fortschritt

Planmeilensteine und längere interne Diagnosephasen wurden nicht immer
zeitnah sichtbar aktualisiert. Beim P030-Endfix vergingen mehrfach mehrere
Minuten ohne Gate-Ausgabe. Eine kontrollierte Turn-Unterbrechung und der
Neustart mit explizitem Test-/Replay-Gate brachten den Strang wieder in einen
messbaren Ablauf.

## Ab jetzt verbindlicher optimierter Ablauf

1. Ein Pairing-Driver und ein bounded Denominator-Summarizer werden pro
   Längsschnittserie wiederverwendet. Standard-stdout enthält nur Ergebnisse,
   Denominator, `FLAGS` und benannte Drilldown-Indizes.
2. Bei Choice-/Continuation-/Window-Origin-Fehlern wird zuerst der
   persistierte Selected-Origin-/LegalAction-/Choice-Checkpoint projiziert.
   Der Defekt wird als kleinster roter Ownership-Test gesichert, bevor ein
   kompletter Replay folgt.
3. Zusammengehörige Patches werden gebündelt. Zuerst wird genau der
   Problemseed terminal mit `FLAGS=0`; danach folgt genau ein finaler
   Drei-Seed-Lauf. Spekulative Zwischenfixes werden nicht nach `main`
   integriert.
4. Fokussierte AI-Testpfade sind relativ zu `packages/ai` und beginnen mit
   `src/`. Erst nach grünen Einzelfällen folgt ein gemeinsamer thematischer
   Abschlusslauf. Typechecks verwenden den vorhandenen Paketbefehl mit seinem
   Speicherrahmen.
5. Mehrteilige PowerShell-Gates prüfen nach jedem kritischen Befehl
   `$LASTEXITCODE` oder laufen in getrennten Toolaufrufen. Ein späterer Commit
   darf einen früheren Fehler nicht maskieren.
6. Parallelstränge koordinieren Pairing-/Finding-ID-Bereiche und besitzen nur
   ihre Reporting-IDs. Nur ein Strang verändert den physischen Main-Checkout
   gleichzeitig.
7. Integration gilt erst als bewiesen, wenn der exakte Arbeitscommit im
   physischen `main` enthalten ist und der aktuelle Main-Commit anschließend
   wieder im persistenten Arbeitsbranch liegt. Beide SHAs und beide
   Ancestry-Richtungen werden geprüft.
8. Berichtszahlen werden mechanisch aus Reviews/Manifesten abgeglichen:
   Paarungen, Spiele, Gewinnerbilanz, Decisions, Fixzahl, Match- und
   Agendapunkte sowie Endgründe. Pending-State und HTML stehen vor Versand in
   `main`; nach eindeutigem Gmail-Send werden nur die abgedeckten IDs
   geschlossen.
9. Ein explizites Blockende verhindert jede Vorselektion des nächsten Decks.
   Erst Reporting, Serverstopp, Prozessreview und Skill-Validierung schließen
   den Auftrag.

Diese Regeln wurden in
`netgrid-ai-selfplay-improvement-cycle` übernommen. Der Skill-Validator meldet
weiterhin `Skill is valid!`.

## Weitere sinnvolle Werkzeugverbesserungen

Die folgenden Punkte sind sinnvoll, aber nicht Voraussetzung für den nächsten
Lauf und wurden deshalb nicht nebenbei in Produktcode umgesetzt:

- einen versionierten Repository-Analyzer bereitstellen, der Manifest,
  Denominator, Sequenzdiff und Berichtssummen in einem bounded JSON erzeugt;
- Vollbundle-/Final-Artefakte in der lokalen Evidence nachweisbar
  deduplizieren oder nur für markierte Fehlerfenster doppelt materialisieren;
- Finding-ID-, Reporting- und Main-Integrationsturn durch eine kleine lokale
  Lease/Lock-Datei mechanisch absichern statt nur per Agentenkoordination;
- HTML-Berichte aus den strukturierten Zyklusreviews/Manifesten generieren,
  damit manuell geschriebene Summen vollständig entfallen;
- Planmeilensteine direkt aus dem Pairing-Manifest ableiten, sodass Auswahl,
  Capture, Finding, Replay, Doku, Integration und Reporting automatisch im
  sichtbaren Fortschritt gespiegelt werden.

Diese Automatisierungen dürfen den vollständigen Drei-Seed-Denominator, die
Verliereranalyse, die Matrixverdichtung, die Ursachenfix-Gates oder die
exakten Replays nicht verkürzen.
