# Match 7BFE: Decision-Checkpoint-Remediation

## Status

Abgeschlossen. Sechs Zieltests reproduzierten vor der Korrektur die fünf
freigegebenen 7BFE-Findings. Der Audit des älteren Serienspiels
`match_b0080115bddbce23` ergänzte drei weitere rote Fälle. Nach den generischen
Korrekturen sind alle neun Zielverträge und sechs Gegenproben grün; die
vollständige AI-Suite ist ebenfalls grün. Der Abschluss ist im Final Review
`docs/reviews/ai/ai-match-7bfe-b008-decision-checkpoint-final-review-2026-07-12.md`
dokumentiert.

## Quelle

- Match: `match_7bfe82501d0fdcb8`
- Modus: menschlicher Runner gegen Hard-Corp-KI
- Ergebnis: Runner-Sieg nach Agendapunkten
- Evidence: 330 Events, 330 Snapshots und 130 AI-Decision-Traces aus der
  lokalen SQLite, ausschließlich read-only ausgewertet
- Planstand: integriertes Planportfolio und Remote Doctrine auf `main` ab
  Commit `d74319bfe`

## Gesamtziel

Die fünf freigegebenen Fehlentscheidungen werden zuerst als produktionsnahe,
rote Decision-Checkpoint-Regressionen konserviert und erst danach generisch
behoben. Jeder Checkpoint erzeugt PlayerView und LegalActions über die Engine,
nutzt `buildAiDecisionInput` und den produktiven Chooser und besitzt mindestens
eine fachliche Gegenprobe.

## Verbindliche Reihenfolge

1. Checkpoint-Vertrag, Runtime-Restore und Headless-Runner bereitstellen.
2. Alle fünf Checkpoint-Regressionen gegen unveränderten KI-Code ausführen.
3. Red-Evidence je Finding dokumentieren.
4. Erst nach vollständigem Red-Gate die KI-Korrekturen beginnen.
5. Checkpoints, Companion Contracts, Gegenproben und Mutation Witness grün
   verifizieren.
6. Breite Gates ausführen, dokumentieren und lokal nach `main` integrieren.

## Findings und Checkpoints

### CP-7BFE-01 – Finite Economy verdrängt Central-Schutz

- Quelle: Decision 9, StateVersion 17, Memory `belief-v1.4.3:99346934`.
- Rot-Erwartung: weitere BBS-Nutzung wird gewählt.
- Zielvertrag: bezahlbares R&D-ICE wird vor der nächsten BBS-Nutzung
  installiert; ohne sinnvollen Schutzschritt bleibt wiederholte BBS-Nutzung
  zulässig.

### CP-7BFE-02 – Nicht ausführbare Corporate-War-Konversion

- Quelle: Decisions 56/57, StateVersions 110/111.
- Rot-Erwartung: Corporate War wird mit fünf Credits installiert und danach
  Systematic Layoffs ohne verbleibenden Advance-Credit gespielt.
- Zielvertrag: der vollständige Pfad muss über echte Zustandsübergänge
  ausführbar sein. Die Sechs-Credit-Gegenprobe behält den vollständigen
  Same-Turn-Score.

### CP-7BFE-03 – Strategiewidriger Corp-Discard

- Quelle: Decision 92, StateVersion 188.
- Rot-Erwartung: beide BBS-Kopien und City Surveillance werden verworfen,
  während konditionale, redundante Payoffs verbleiben.
- Zielvertrag: mindestens eine installierbare Economy-Karte und ein
  strategiegeeigneter Enabler bleiben erhalten; derzeit unerfüllbare und
  redundante Payoffs werden abgewertet.

### CP-7BFE-04 – Closed Accounts ohne marginalen Effekt

- Quelle: Decision 116, StateVersion 281, Memory
  `belief-v1.4.3:e0024730`.
- Rot-Erwartung: Closed Accounts wird gegen einen getaggten Runner mit null
  Credits gespielt.
- Zielvertrag: Credit nehmen; mit sichtbaren drei Runner-Credits bleibt Closed
  Accounts die richtige Gegenprobe.

### CP-7BFE-05 – Agenda-Draw in bedrohtes Matchpoint-HQ

- Quelle: Decision 128, StateVersion 302, Memory
  `belief-v1.4.3:2f278b21`.
- Rot-Erwartung: Draw transportiert Corporate War in ein nachweislich
  erreichbares HQ, während der Runner sechs Agendapunkte und bekannte
  Multiaccess-Evidence besitzt.
- Zielvertrag: ein bezahlbares HQ-ICE installieren; ohne Matchpunkt- oder
  Reachability-Risiko bleibt die Agenda-Suche zulässig.

## Pakete

### P0 – Prozess und Evidence

- Prozess und Kandidatenregister aktualisieren.
- Gate: `git diff --check` und eigener Commit.

### P1 – Checkpoint-Infrastruktur

- Versionierter Vertrag, Runtime-Checkpoint, Erwartungsmatcher und
  produktiver Headless-Runner.
- Gate: Schema-, Restore-, Side-Safety- und Determinismustests grün.

### P2 – Rote Match-Regressionen

- Fünf Checkpoints samt Gegenproben erstellen.
- Gate: Jeder Zieltest scheitert aus dem erwarteten Verhaltensgrund; keine
  Infrastruktur-, Legality- oder Fixture-Fehler werden als Rot-Evidence
  akzeptiert.

### P3 – Generische Korrekturen – abgeschlossen

- Central-Interrupt für finite Economy.
- vollständige Ressourcenprojektion für Score-Konversion.
- plan- und voraussetzungsbewusster Corp-Discard.
- marginale Effektbewertung für Tag-Punish.
- Matchpoint-/HQ-Expositionsrisiko für Draw.
- Gate: alle fünf Checkpoints und Gegenproben grün.

### P4 – Abschluss – abgeschlossen

- Fokussierte Tests, AI-Typecheck, relevante AI-Gates und vollständige
  AI-Suite soweit lokal realistisch.
- Evidence-, Final-Report und Monatslog aktualisieren.
- Aktuelles `main` defensiv abgleichen, lokal mergen und Worktree sowie Branch
  nach erfolgreicher Main-Verifikation entfernen.

## Invarianten und Nicht-Ziele

- Keine gegnerischen Hidden-Zone-Daten im AI-Input oder Fixture.
- Keine Action außerhalb der Engine-LegalActions.
- Keine Kartenname-Sonderregel, wenn eine semantische Rolle oder
  Effektprojektion genügt.
- Keine pauschale Begrenzung der BBS-Nutzungen.
- Keine Abschwächung des korrekten Sechs-Credit-Corporate-War-Closeouts.
- Keine automatische Erwartungsaktualisierung bei späteren KI-Umbauten.
