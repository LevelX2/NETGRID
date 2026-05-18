# V1.9.5 bis V1.9.8 sequenzieller Implementierungsreview

Datum: 2026-05-11
Primärer Agent: release-implementation-agent
Sequenz: V1.9.5 -> V1.9.6 -> V1.9.7 -> V1.9.8

## Gesamtbild

Der Durchlauf hat die V1.9.5- bis V1.9.8-Sequenz technisch in einem kontrollierten Kernpfad umgesetzt. Pro Release wurde ein kleiner, prüfbarer Karten- und Mechanik-Korridor in Engine, Catalog, Server/Web-Vertrag, AI-Memory und Tests angeschlossen.

Wichtig: Die groben Release-Backlogs aus den Detailplänen sind nicht vollständig leer. Die Umsetzung ist daher kein vollständiger V2-Unlock. V2.x bleibt blockiert, bis die im Deferred-Register geführten Longtail-Punkte erledigt und erneut grün verifiziert sind.

## Übergreifende Verifikation

- `corepack pnpm test`: grün.
- `corepack pnpm typecheck`: grün.
- Paket-Gates im Root-Lauf: Shared, Catalog, Decks, Engine, AI, Server, Web grün.
- Contract-/Redaction-Specs im Root-Lauf: `phase1-artifacts.test.ts` und `visibility-contract.test.ts` grün.
- Engine-Replay/StateHash/RNG-Schutz: bestehende Engine-Suite plus neue Release-Sonden grün.
- AI-Side-Safety: bestehende AI-Suite plus V1.9.8-Known-Position-Memory-Test grün.

## V1.9.5 Statusblock

- Gate: Go für implementierten Kern, Go mit Deferred für den vollständigen Releasekorb.
- Risiken: Der volle V1.9.5-Backlog ist nicht leer; Data-Darts- und weitere Asset/Modifier-Longtail-Punkte bleiben deferred.
- Offene Punkte: siehe Deferred-Register, Priorität P1/P2.
- Tests: Engine, Catalog, Server/Web-Vertrag, Root-Testlauf und Typecheck grün.

### Kontext und Zielbild

V1.9.5 stabilisiert generische Asset-/Node- und persistente Modifier-Familien. Der implementierte Kern macht globale statische ICE-Stärke und ein rezzed Corp-Asset mit Start-of-Turn-Ökonomie regelgeführt spielbar.

### In-/Out-of-Scope

In Scope:
- `Superior Net Barriers` als scored agenda statischer Wall/ICE-Stärke-Modifier.
- `ACME Savings and Loan` als Corp-Asset mit Rez- und Start-of-Turn-Credit-Effekt.
- Runtime-/Catalog-/Server-/Web-Anschluss und Release-Manifest.

Out of Scope:
- V2.x-Funktionen.
- Vollständige Umsetzung aller V1.9.5-Backlogkarten.
- Neue nicht geplante UI-Features.

### Muss/Soll/Kann

Muss:
- Engine bleibt einzige Regelautorität.
- LegalActions und applyAction validieren weiter.
- Keine Hidden-Info-Leaks in Views, Events, Logs oder AI-Inputs.

Soll:
- Statische Modifier deterministisch über PlayerView sichtbar machen.
- Asset-Effekte mit StateHash/Replay-Verträglichkeit ausführen.

Kann:
- Weitere Asset-Familien später im selben Muster ergänzen.

### Umsetzung je Bereich

Engine:
- Scored `Superior Net Barriers` gibt rezzed Wall-ICE +1 Stärke.
- `ACME Savings and Loan` zahlt beim Rez netto +2 nach Kosten und je Corp-Turn +1.

Server/API:
- Runtime-Kartenpool enthält V1.9.5-Karten als human-playable und nicht AI-supported.

Web/UX:
- Statuslabel auf V1.9.8 fortgeschrieben, damit der Client den Sequenzstand zeigt.

Daten/Manifeste/Szenarios:
- Release-Manifest und Smoke-Szenarien für den Kernpfad angelegt.

Tests/Verifikation:
- Neue Engine-Sonden für Modifier und Asset-Credits.
- Catalog- und Server-Verträge erweitert.

### Reihenfolgeplan

1. Kartendefinitionen und Catalog-Manifest.
2. Engine-Effekte und LegalActions-Pfad.
3. Contract-/Visibility-Tests.
4. Handoff der nicht erledigten Longtail-Punkte.

### Risiken und Gegenmaßnahmen

- Risiko: Vollständiger V1.9.5-Backlog wird überschätzt.
- Gegenmaßnahme: Deferred-Register mit Owner/Priorität; kein V2-Unlock.

### Limitationen

Der Release ist als Kernkorridor abgeschlossen, nicht als vollständige Backlog-Leerung.

### DoD

Erfüllt für Kernkorridor: Karten spielbar, Contract grün, Tests grün, keine V2-Ausweitung.

### Abbruchkriterien

Kein Abbruch ausgelöst. Keine Leak-, Replay- oder Contract-Regression im Verify-Lauf.

### Offene Fragen

Kritisch: Keine für Kernkorridor.
Mittel: Vollständige Priorisierung der restlichen Asset-/Modifier-Karten.
Optional: Zusätzliche Szenario-Snapshots für weitere Asset-Permutationen.

### Go/No-Go

Go mit Deferred. Begründung: Kernmechaniken sind umgesetzt und verifiziert; vollständiger Backlog bleibt dokumentiert.

### Cross-Release-Handoff

V1.9.6 übernimmt den stabilen Counter-/Persistent-Modifier-Pfad und führt Data Raven als Counter/Trace-Kern fort.

### Nächste Startaufgaben

1. Deferred-Punkte für Data Darts und weitere Asset-Modifier clustern.
2. Zusätzliche Szenariofälle für mehrere gleichzeitige Modifier bauen.
3. Teststrategie für vollständige V1.9.5-Leerung festlegen.

## V1.9.6 Statusblock

- Gate: Go für implementierten Kern, Go mit Deferred für den vollständigen Releasekorb.
- Risiken: Counter/Virus/Purge- und Agenda-Difficulty-Familien bleiben nicht vollständig umgesetzt.
- Offene Punkte: Dupre und breitere Counter-/Virus-/Purge-Familie bleiben P1.
- Tests: Data-Raven-Trace/Counter, Start-of-Turn-Tag, Catalog, Server/Web und Root grün.

### Kontext und Zielbild

V1.9.6 führt Counter-/Virus-/Purge- und Agenda-Komplexität fort. Der implementierte Kern nutzt Data Raven als Trace- und Counter-Sonde.

### In-/Out-of-Scope

In Scope:
- `Data Raven` als rezzable Sentry mit Trace, Tag, Power-Counter und Runner-Start-Tag.

Out of Scope:
- Vollständige Virus-/Purge-Familien.
- Dupre und breite Agenda-Difficulty-Longtail-Umsetzung.

### Muss/Soll/Kann

Muss:
- Counter dürfen keine private Information leaken.
- Trace-Auflösung läuft über Choices und LegalActions.

Soll:
- Data-Raven-Counter deterministisch in StateHash/Replay eingehen.

Kann:
- Weitere Counter-Familien später am selben Counter-Hook anbinden.

### Umsetzung je Bereich

Engine:
- Trace-Erfolg legt Power-Counter auf Data Raven und gibt sofort einen Tag.
- Jeder Power-Counter gibt Runner zu Beginn des Runner-Turns einen Tag.

Server/API:
- Data Raven ist human-playable, AI-support bleibt aus.

Web/UX:
- Keine neue UI-Fläche; bestehende öffentliche Counter-/Tag-Anzeige wird genutzt.

Daten/Manifeste/Szenarios:
- Manifest und Smoke-Szenario für Data-Raven-Kern ergänzt.

Tests/Verifikation:
- Engine-Test für Trace-Bids, Counter und Start-of-Turn-Tag.

### Reihenfolgeplan

1. Definition und Catalog-Promotion.
2. Trace-/Counter-Hook in Engine.
3. Release-Verträge und Tests.
4. Carryover nach V1.9.7.

### Risiken und Gegenmaßnahmen

- Risiko: Counter-Familien werden anhand eines Einzelkerns zu breit interpretiert.
- Gegenmaßnahme: Release-Status explizit als Kernkorridor mit Deferred geführt.

### Limitationen

Data Raven ist umgesetzt; V1.9.6 als kompletter Backlog ist nicht vollständig leer.

### DoD

Erfüllt für Kernkorridor: Data Raven spielbar, Trace/Counter/Tag grün, keine Leak-Regression.

### Abbruchkriterien

Kein Abbruch ausgelöst.

### Offene Fragen

Kritisch: Keine für Data-Raven-Kern.
Mittel: Dupre-Mechanik und vollständige Virus-/Purge-Semantik.
Optional: Mehrspieler-Contract-Snapshot für Counter-Stapel.

### Go/No-Go

Go mit Deferred. Begründung: Kernmechanik grün; vollständige Releasefamilie bleibt offen.

### Cross-Release-Handoff

V1.9.7 übernimmt getestete Counter-/StateHash-Sicherheit und ergänzt Hosting-Korridor.

### Nächste Startaufgaben

1. Dupre- und Virus-Familie spezifizieren.
2. Purge-Regressionsmatrix erweitern.
3. Data-Raven-Mehrfachcounter-Szenario ergänzen.

## V1.9.7 Statusblock

- Gate: Go für implementierten Kern, Go mit Deferred für den vollständigen Releasekorb.
- Risiken: Hosting-/Upgrade-/Daemon-/Stealth-/Worm-Familien bleiben teilweise offen.
- Offene Punkte: breite Hosting-Longtail-Umsetzung P1/P2.
- Tests: Afreet-Install, Decklegalität, Runtime-Vertrag und Root grün.

### Kontext und Zielbild

V1.9.7 richtet Hosting- und Daemon-Grundlagen weiter aus. Der implementierte Kern macht Afreet als Host-Programm spielbar.

### In-/Out-of-Scope

In Scope:
- `Afreet` als Runner-Program/Daemon mit Hosting-Kapazität und MU-Kosten.

Out of Scope:
- Vollständige Stealth-/Worm-/Upgrade-/Destroy-Familien.
- Neue UI-Interaktionen für Host-Auswahl außerhalb bestehender Patterns.

### Muss/Soll/Kann

Muss:
- Installation läuft über LegalActions.
- Memory-Kosten bleiben Engine-validiert.

Soll:
- Hosting-Kapazität bleibt deterministisch und nicht leaky.

Kann:
- Spätere Hosted-Resource- und Uninstall-Details ergänzen.

### Umsetzung je Bereich

Engine:
- Afreet kann installiert werden und nutzt bestehende Program-/Hosting-Strukturen.

Server/API:
- Runtime-Kartenpool enthält Afreet human-playable, AI-support bleibt aus.

Web/UX:
- Keine neue UI-Sonderfläche.

Daten/Manifeste/Szenarios:
- Manifest und Smoke-Szenario für Afreet-Kern ergänzt.

Tests/Verifikation:
- Engine-Test für Afreet-Definition, Deckvalidierung und LegalAction-Installation.

### Reihenfolgeplan

1. Definition/Catalog.
2. Engine-Installationspfad.
3. Contract-Tests.
4. Handoff an V1.9.8-Longtail.

### Risiken und Gegenmaßnahmen

- Risiko: Hosting-Fähigkeit wird ohne alle Folgeinteraktionen als vollständig missverstanden.
- Gegenmaßnahme: Limitation und Deferred-Register klar ausgewiesen.

### Limitationen

Afreet-Kern ist umgesetzt; vollständige Hosting- und Destroy/Uninstall-Familien bleiben offen.

### DoD

Erfüllt für Kernkorridor.

### Abbruchkriterien

Kein Abbruch ausgelöst.

### Offene Fragen

Kritisch: Keine für Afreet-Kern.
Mittel: Vollständige Host-/Uninstall-Interaktionsmatrix.
Optional: UI-Komfort für Hosting-Choices.

### Go/No-Go

Go mit Deferred.

### Cross-Release-Handoff

V1.9.8 übernimmt den stabilen Runner-Programmpfad und ergänzt Breaker-Longtail plus AI-Memory.

### Nächste Startaufgaben

1. Restliche Daemon-/Hosting-Karten klassifizieren.
2. Uninstall/Destroy-Szenarien definieren.
3. Hosting-Choice-UX prüfen.

## V1.9.8 Statusblock

- Gate: Go für implementierten Kern; No-Go für V2.x-Unlock.
- Risiken: L1B per-card resolver longtail ist nicht vollständig leer.
- Offene Punkte: vollständige V1.9.8-Longtail-Leerung P0 vor V2.x.
- Tests: Dogcatcher/Dropp-Install, AI-Known-Position-Memory, Root-Testlauf und Typecheck grün.

### Kontext und Zielbild

V1.9.8 soll die L1B-Resolver-Longtail-Punkte und side-safe positional AI memory abschließen. Der implementierte Kern setzt zwei Breaker-Longtail-Karten und die AI-Positionsmemory-Sonde um.

### In-/Out-of-Scope

In Scope:
- `Dogcatcher` und `Dropp` als installierbare Runner-Breaker.
- Runner-seitige, ausschließlich aus PublicEvents abgeleitete Known-Position-Memory.
- Invalidierung bekannter R&D-Top-Position nach Corp-Draw.

Out of Scope:
- Vollständige Leerung aller V1.9.8-L1B-Resolverkarten.
- V2.x Expansion.

### Muss/Soll/Kann

Muss:
- Keine Hidden-Info-Leaks in AI-Memory.
- PublicEvents bleiben einzige Quelle für Known-Position-Memory.
- Breaker laufen über LegalActions.

Soll:
- AI-Memory wird in Debug-Zusammenfassung sichtbar, bleibt aber side-safe.

Kann:
- Weitere Positionsarten später ergänzen, wenn öffentlich ableitbar.

### Umsetzung je Bereich

Engine:
- Dogcatcher und Dropp sind installierbare Programme mit Break-/Pump-Fähigkeiten.

Server/API:
- Runtime-Kartenpool und Multiplayer-Startvertrag erkennen V1.9.8-Karten als human-playable und nicht AI-supported.

Web/UX:
- Statuslabel V1.9.8.

Daten/Manifeste/Szenarios:
- Manifest/Smoke-Artefakte für Kernpfad.

Tests/Verifikation:
- Engine-Tests für Breaker-Longtail.
- AI-Test für Known-Position-Memory und Invalidierung.
- Visibility-/Contract-Suite grün.

### Reihenfolgeplan

1. Dogcatcher/Dropp Definition und Runtime-Promotion.
2. AI Known-Position-Memory.
3. Contract- und Root-Verifikation.
4. Deferred-Register als V2-Blocker fortschreiben.

### Risiken und Gegenmaßnahmen

- Risiko: V1.9.8 wird fälschlich als vollständiger V2-Unlock gelesen.
- Gegenmaßnahme: No-Go für V2.x ausdrücklich dokumentiert.

### Limitationen

Der L1B-Longtail ist nicht vollständig abgeschlossen.

### DoD

Erfüllt für implementierten Kern; nicht erfüllt für vollständigen V1.9.8-Releasekorb/V2-Unlock.

### Abbruchkriterien

Kein technischer Abbruch im Kernpfad. V2-Unlock-Abbruchkriterium bleibt aktiv wegen offener Deferred-Liste.

### Offene Fragen

Kritisch: Vollständige L1B-Longtail-Leerung vor V2.x.
Mittel: Erweiterung der AI-Positionsmemory auf weitere öffentliche Positionstypen.
Optional: Zusätzliche Szenarien für mehrfaches Reveal/Access/Draw.

### Go/No-Go

Go für Kern. No-Go für V2.x. Begründung: Tests grün, aber vollständiger V1.9.8-Backlog nicht leer.

### Cross-Release-Handoff

Folgearbeit muss als V1.9.8-Completion oder V1.9.8B geplant werden, bevor V2.x beginnt.

### Nächste Startaufgaben

1. P0-Longtail-Liste aus V1.9.8 vollständig zerlegen und je Karte umsetzen.
2. Dupre/Data-Darts/Counter-Restpunkte in einen Abschlussplan ziehen.
3. Nach Abschluss erneut Root-Test, Typecheck und Visibility-/AI-Safety-Gates laufen lassen.
