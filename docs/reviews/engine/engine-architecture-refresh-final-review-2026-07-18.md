# Engine Architecture Refresh Final Review 2026-07-18

Status: vollständig umgesetzt und lokal in `main` integriert

## Gesamtergebnis

Der nach Classic-, Karten- und Regelpaketen erneut gewachsene Engine-Code ist
entlang seiner tatsächlichen Domänen neu geordnet. Alle geplanten Pakete E00
bis E16 sind einzeln geprüft und integriert. Die Rules Engine bleibt alleinige
Regelautorität; LegalAction-Revalidierung, Hidden-Info-Grenzen, Replay,
StateHash und seedbasierter Zufall sind unverändert durch vollständige Tests
geschützt.

## Geschlossene Findings

- Die dynamischen, untypisierten Runtime-Delegate-Grenzen und ihr Store sind
  entfernt. 430 Bindings verwenden deklarative Runtime-Ports.
- Der produktive relative Importgraph besitzt keine Zyklen mehr. Beide
  ursprünglichen Cycle-Ausnahmen sind entfallen.
- Ability-Verträge liegen in sechs Fachfamilien statt einer 2.635-zeiligen
  Sammeldatei.
- Turn, Damage/Prevention/Replacement, Access/Breach/Visibility sowie Run,
  Windows und Run-End-Cleanup besitzen fachliche Teilmodule und ausführbare
  Größenlimits.
- Interne Ability-Payload-Discriminatorfelder werden nicht mehr in
  PublicEvents veröffentlicht. Öffentliche Ability-Metadaten verwenden den
  normalisierten Vertrag.
- 27 nummerierte CardImplementation-Gruppen sind durch Set-/Seite-/Typ-
  Registries mit deterministischer Reihenfolge und Paritätstest ersetzt.
- Zwei Release-Testmonolithen sind in elf navigierbare Suites geteilt; ein
  Quellvertrag verhindert ihre Rückkehr.
- Kommentare stehen an den nicht offensichtlichen Autoritäts-, Hidden-Info-,
  Determinismus- und Mutationsreihenfolge-Grenzen; reine Delegation bleibt
  bewusst unkommentiert.

## Verifizierter Abschlussstand

| Metrik/Gate                                | Ergebnis                                |
| ------------------------------------------ | --------------------------------------- |
| Produktive Engine-Quellen im Strukturguard | 998                                     |
| Relative Importzyklen                      | 0                                       |
| Typisierte Runtime-Port-Bindings           | 430                                     |
| Engine-Testdateien                         | 202                                     |
| Engine-Tests                               | 1.741/1.741 grün                        |
| CardImplementation-Architekturziel         | 0 Findings in sieben Kategorien         |
| Card-Function-Abstraction                  | 132 geprüfte Baseline-Funde, kein Drift |
| Package Boundaries                         | grün                                    |
| Testdiscovery                              | grün                                    |
| Engine- und Root-Typecheck                 | grün                                    |

Die vollständigen Abschlussgates werden im Prozessartefakt E16 protokolliert.

## Verbleibende Findings

### Mittel: Public-Context-Projektion bleibt groß

`packages/engine/src/public-context.ts` ist mit rund 2.227 Zeilen weiterhin ein
großer read-only Projektor. Er entscheidet weder Legalität noch Regeln, enthält
aber viele aktive Präsentations- und teilweise historisch benannte Payload-
Weiterleitungen. Empfehlung: in einem eigenen Paket nach Action-Familien in
typisierte Projektoren teilen und erst danach weitere aktive Versionsfelder
entfernen. Hidden-Info-Golden-Tests sind dafür Pflicht.

### Mittel: Runtime-Integrations-Fan-out ist nur eingefroren

Die Runtime-Ports sind typisiert und zyklenfrei, aber mehrere Host-, Service-
und Resolverdateien importieren weiterhin dreistellig viele Ziele. Der
Strukturguard erlaubt nur die exakt bekannte Obergrenze und verhindert
Wachstum. Empfehlung: Composition Root und Domänenadapter in einem späteren
Paket pro Portgruppe physisch näher zusammenführen, ohne wieder einen
dynamischen Delegate-Store einzuführen.

### Niedrig: Ein großer Longtail-Test bleibt

`per-card-longtail.test.ts` umfasst rund 6.887 Zeilen und liegt damit knapp
unter dem neuen 7.000-Zeilen-Gate. Empfehlung: bei der nächsten fachlichen
Änderung nach Kartenfamilien teilen; keine rein kosmetische Massenbewegung ohne
anstehende Wartung.

### Niedrig: Coverage-Source-Locations bleiben manuell

`coverage-source-locations.ts` ist ein reines 855-zeiliges Datenmodul. Es ist
vom Runtime-Verhalten getrennt und größenbegrenzt, bleibt aber eine manuelle
Ausnahmekarte. Empfehlung: später deterministisch aus den semantischen
Subregistries erzeugen, sofern der Generator selbst klein und prüfbar bleibt.

## Bewertung

Die Engine-Struktur ist wieder nachvollziehbar, statisch typisiert, zyklenfrei
und gegen die konkret beobachteten Regressionen abgesichert. Die verbleibenden
Punkte sind transparente, begrenzte Wartungsschulden; keiner schwächt
Regelautorität, Hidden Info, Replay oder StateHash. Ein weiteres breit
angelegtes Refactoring ist für den aktuellen Version-0-Stand nicht erforderlich.
