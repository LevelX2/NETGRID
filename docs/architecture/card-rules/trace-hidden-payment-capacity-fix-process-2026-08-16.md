# Trace Hidden-Payment- und Capacity-Nachschärfung

Status: abgeschlossen
Quelle: fokussierter Folgeauftrag zum bestehenden Trace-Regelprofilvertrag

## Gesamtziel

Blind-Trace-Payments werden bis zum gemeinsamen Reveal als exakt gebundene,
transiente Quotes gehalten und erst nach autoritativer Revalidation
verbraucht. Die Blind-Bid-KI bewertet die gegnerische Kapazität aus einer
aggregierten side-sicheren Trace-Payment-Projektion statt nur aus normalen
Credits.

## Invarianten und Nicht-Ziele

- Engine, LegalActions, Plan-first-Owner, Replay-RNG und bestehende drei
  Trace-Profile bleiben unverändert zuständig.
- Keine Karten-ID-Heuristik, zweite Payment-Engine, Action-Chooser- oder
  Personality-Schicht.
- Commitments gehören ausschließlich zum laufenden Trace und speichern keine
  zukünftigen LegalAction-IDs.
- Fehlende oder driftende Payment-Quotes scheitern vor dem Reveal-Verbrauch
  fail-closed.

## Paketfolge

1. **TRFIX-1 – Hidden Payment Commit**: Quote im Blind-Trace binden,
   Ressourcen bis Reveal unverändert lassen, beide Quotes revalidieren und im
   Reveal-Schritt verbrauchen. Gate: fokussierte Payment-/Orchestrations- und
   Hidden-View-Tests, `git diff --check`, Commit.
2. **TRFIX-2 – Side-safe Capacity**: sichtbare gegnerische Trace-Kapazität
   generisch projizieren und in der bestehenden rationalen Bid-Bewertung
   verwenden. Gate: AI-Assessment-/Ownership-Tests, `git diff --check`, Commit.
3. **TRFIX-3 – Integration und Abschluss**: Replay/StateHash,
   PublicContext/Events, Profilvergleich, Typechecks und gezieltes Review;
   führenden Trace-Vertrag synchronisieren. Gate: dokumentierte Ergebnisse,
   Commit, defensiver Main-Abgleich, lokaler Merge und verifizierter Cleanup.

Bei einem Sicherheits- oder fachlichen Blocker stoppt der Prozess mit einer
konkreten Ursache und Removal Condition. Baseline-Fehler außerhalb dieses
Scopes werden getrennt ausgewiesen und nicht durch Fallbacks kaschiert.

## Abschlussnachweis

- Fokussierte Engine-Suite: 73 Tests grün; zusätzliche Payment-/PlayerView-
  Projektion: 11 Tests grün.
- Fokussierte AI-/Plan-first-/Szenario-Suite: 83 Tests grün; AI-Struktur- und
  Paketgrenzen-Gates grün.
- Shared-, Engine-, Server- und Web-Typechecks grün. Der vollständige
  AI-Typecheck bleibt ausschließlich an vier bereits im Ausgangsstand
  fehlenden generierten CardSpec-Migrationsreports hängen.
- Der deterministische Profilvergleich blieb reproduzierbar; die
  Erfolgsraten für Modern, Classic Blind und Classic Blind mit Korp-Tie lagen
  im festen Szenariosatz bei 0,333, 0,417 und 0,444.
