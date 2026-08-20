# Ablauf- und Performance-Review des parallelen Selbstspielstrangs 016–030

Stand: 2026-08-20

## Ergebnis

Der Strang schloss 15 Paarungen mit jeweils drei finalen Seeds ab. Für den
letzten Block 026–030 wurden 4.245 finale Entscheidungen vollständig
auditiert. Die aktuelle Paging-Aufteilung ist fachlich korrekt: Decision-
Seiten werden ohne eingebettete Events geladen, die vollständige Eventhistorie
kommt in einem getrennten unscoped Pass bis zum terminalen Zustand.

## Gemessene Zeit- und Speicherfresser

1. Der Analyzer gab neben seiner kompakten Summary erneut große JSON-Objekte
   auf stdout aus. Allein die P030-Ausgabe überschritt 48.000 Tokens, obwohl
   `analysis-summary.json` bereits die benötigte Projektion enthielt.
2. Die finale P030-Artefaktgruppe belegt 296.255.583 Bytes. Bundle- und
   Finaldateien enthalten überlappende Vollobjekte; einzelne Dateien liegen
   zwischen rund 29 und 49 MB. Das ist als lokales Auditreservoir vertretbar,
   aber für die normale interaktive Diagnose redundant.
3. Vor dem SP-074-Ursachennachweis wurden mehrere vollständige Seed-3-Replays
   und Serverneustarts ausgeführt. Die schnellere Diagnose wäre gewesen,
   zuerst den persistierten Checkpoint `runtime.residentPlanPortfolio` und die
   LegalAction-Projektion am ersten Abbruch zu vergleichen.
4. SP-074 wurde in mehreren spekulativen Teilständen nach `main` integriert,
   bevor der exakte Seed vollständig grün war. Das erzeugte zusätzliche
   Sync-/Merge-/Replay-Runden und erschwerte die Historie.
5. Während der Iteration liefen mehrfach breite thematische Suiten mit etwa
   346 Tests. Ein gezielter Testname pro rotem Invariant, danach genau ein
   gemeinsamer thematischer Abschlusslauf, hätte dieselbe Sicherheit günstiger
   geliefert.
6. Ein direkter TypeScript-Lauf scheiterte am 4-GB-Heap. Der bestehende
   Paket-Typecheck setzt den geeigneten 8-GB-Rahmen und sollte unmittelbar
   verwendet werden.
7. Ein früher Analyzer-Aufruf übergab einen Suffix positional (`029 sp070`)
   statt über `--output-suffix=sp070`; die uneindeutige CLI-Nutzung verursachte
   einen vermeidbaren Wiederholungslauf.
8. Die aufgabenbedingt vollständigen Skill-/Preflight-Wiederholungen sind
   bewusst beibehalten worden. Eine Optimierung wäre nur als ausdrücklich
   erlaubter Hash-/Versions-Cache sicher, nicht durch stilles Überspringen.

## Konkreter verbesserter Ablauf

1. Beim ersten Runtime-Abbruch einmal den vollständigen Checkpoint laden und
   daraus eine begrenzte Projektion aus Root, Executor, selected origin,
   LegalAction und Choice erzeugen.
2. Den Defekt zunächst als fokussierten Checkpoint-/Ownership-Test
   reproduzieren. Erst nach rotem Test den Owner patchen.
3. Zusammengehörige Codeänderungen bündeln, den fokussierten Test nach jeder
   relevanten Änderung ausführen und den Server genau einmal für den exakten
   Problem-Seed neu starten.
4. Erst wenn dieser Seed terminal und `FLAGS=0` ist, einen einzigen finalen
   Drei-Seed-Lauf starten. Keine Vorab-Merges von Zwischenfixes.
5. Analyzer-stdout standardmäßig auf Denominator, Flags, Ergebniszeilen und
   benannte Drilldown-Indizes begrenzen. Vollobjekte ausschließlich in Dateien
   persistieren; Bundle-/Final-Duplikate nur bei finaler Evidence oder einem
   markierten Fehlerfenster erzeugen.
6. Den korrekten getrennten Decision-/Event-Paging-Pass unverändert lassen und
   die CLI auf benannte Optionen wie `--output-suffix` festlegen.
7. Reporting als klare Transaktion führen: Pending-State plus HTML physisch in
   `main`, genau ein Gmail-Send, danach nur die exakt abgedeckten IDs schließen.

## Skill-Empfehlung

Die aktuelle Skillfassung enthält bereits die wichtigsten Schutzregeln zu
bounded projection, getrenntem Paging, einem Driver und fail-fast Tests. Eine
weitere belastbare Ergänzung wäre: „Vor dem ersten Replay nach einem
Choice-/Window-Abbruch den persistierten Selected-Origin-/LegalAction-
Checkpoint projizieren; Zwischenfixes erst nach grünem exaktem Seed
integrieren.“ Außerdem sollte der bereitgestellte Analyzer standardmäßig keine
Vollsummary auf stdout schreiben. In diesem Strang wurde keine globale
Skilldatei verändert.
