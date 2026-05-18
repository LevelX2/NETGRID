# V1.9.6 Detailed Plan – Counter-/Virus-/Agenda-Übernahme und Overadvance-Feinheit

Stand: 2026-05-11  
Status: planungsready für Umsetzung

## 1) Kontext und Zielbild

V1.9.6 ist der Kern-Release für den Übergang von statischen Board-/Modifierblöcken zu interaktiven Regelketten mit Trigger-, Counter- und Agenda-Overadvance-Logik.

Zielbild:
- `L2_Counter_System_und_Virus_Purge_Trigger` vollständig deterministisch einbinden.
- `L2_Agenda_Difficulty_und_Overadvance_Details` reproduzierbar und redaktionell sauber modellieren.
- `L3_Scored_Agenda_Active_Static_Overadvance` mit bestehenden Scored-Agenda-Familien vollständig vereinen.
- Die expliziten Folgepunkte `Data Raven` und `Dupré` im gleichen Release schließen.
- Laufzeit-Kontinuität sichern, damit 1.9.7 ohne Gegenläufigkeiten starten kann.

Verbindliche Quellen:
- [Open-Points Grobplan](C:/Projekte/NETGRID/docs/releases/v1/v1-9-originalset-completion/v1-9-1-mechanikpaket-j/open-points-grobplan-to-v1-9-8.md)
- [V1.9.4 Final Review](C:/Projekte/NETGRID/docs/releases/v1/v1-9-originalset-completion/v1-9-4-mechanikpaket-m/final-review.md)
- [CODEX Status](C:/Projekte/NETGRID/docs/codex/CODEX_STATUS.md)

## 2) Release-Dependency-Map

| Release | Abhängigkeit | Typ | Grund | Blocker |
| --- | --- | --- | --- | --- |
| V1.9.6 | V1.9.5_done | hart | 1.9.6 ist erst nach geschlossenem Counter-vorläufer freigegeben | 1.9.5 muss passendes 1.9.5-DoD liefern |
| V1.9.6 | `V1_9_1_TO_V1_9_8_OPEN_POINTS_GROBPLAN` | hart | Zielfamilien + Sonderpunkte aus der Sequenz sind verbindlich | Freigabekorb-Preflight fehlt |
| V1.9.6 | Keine V2.x-Ausweitung | hart | Kein Scope-Leak in den Kern 1.9.x vor 1.9.8 | Aktivierung von V2-Scope führt No-Go |
| V1.9.7 | 1.9.6 Final Freeze | weich | 1.9.7 nutzt `Counter`-/`Overadvance`-Nebenwirkungen in Host-/Destroy-Pfaden | offene Deferred-Werte |

## 3) harte Startvoraussetzungen

- `V1.9.5_done: true` und sichtbare Webversion `V1.9.5`.
- Release-Preflight für `V1.9.6` mit fixer `freigabefähig`/`deferred`-Liste ist erstellt.
- Keine offenen No-Scope-Gates (`V2.x`, zusätzliche Deckfreigaben, Plattformfeatures).
- `applyAction`-Revalidierung und Redaction-Gates sind als harte Leitplanken aktiv.

## 4) In-Scope / Out-of-Scope

In-Scope:
- Familien: `L2_Counter_System_und_Virus_Purge_Trigger`, `L2_Agenda_Difficulty_und_Overadvance_Details`, `L3_Scored_Agenda_Active_Static_Overadvance`.
- 1.9.6-Kernkorb (Vorgabe 43 Karten als Planwert) inkl. `Data Raven`, `Dupré`.
- Persistente Triggerzustände, die als Folge dieses Release nicht in bereits implementierte Mechaniken verschoben wurden.

Out-of-Scope:
- `L3_Generische_Upgrade_Faehigkeiten`, `L3_Uninstall_und_InstalledCard_Destroy`, Hosting-/Lifecycle-Ketten.
- Per-Card-Resolver-Longtail und `L1B_PerCard_Resolver`.
- KI-Memory-Verträge (`side-safe`) und `ai_supported`-Erweiterung.

## 5) Muss-/Soll-/Kann-Anforderungen

Muss:
- Jeder neue Triggerweg ist `LegalActions`-geführt und in `applyAction` erneut verifiziert.
- Counter-/Purge-Ereignisse müssen deterministisch über Seed/RNG-Records abgegrenzt sein.
- Overadvance-Pfade dürfen keine verdeckten Informationen offenlegen.
- Undo/Undo-Preview muss Counter-/Purge- und Overadvance-Zustände korrekt zurücknehmen.

Soll:
- Konfliktauflösung bei parallelen Counter- und Overadvance-Fällen ohne Reihenfolge-Kipp.
- Defensiver Fallback, falls Triggerketten in Grenzfällen unvollständig abbildbar sind (kontrollierte Deferred-Markierung).

Kann:
- Tiefe Soak-Regressionen mit 4- bis 7-stufigen Counterkaskaden.
- Erweiterte Reproduktionsmatrix zwischen mehreren Kartenketten im selben Zug.

## 6) Umsetzungsschritte je Bereich

### Engine
- Counter- und Virus-Purge-Pipelines in definierte Eventslots mit Reihenfolgevertrag überführen.
- Agenda-Scoring/Overadvance-Mechanik vereinheitlichen (`static`, `agendakostenspezifisch`, `überzogenes Scoring`).
- Kartengebundene Sonderfälle `Data Raven` und `Dupré` auf demselben Contract-Framework verankern.
- Host-/Destroy-Ketten vermeiden, soweit sie nicht Teil von 1.9.7 sind, und als harte No-Op-Guardrails hinterlegen.
- Engine-Unit- und Szenario-Regressionen für:
  - Counter-Prioritäten
  - Overadvance-Order
  - Virus-Purge-Lebenszyklen
  - Undo-Determinismus

### Server/API
- 1.9.6-Manifest/Allowance auf 43 Karten final eintragen.
- `applyAction` bei Counter-/Overadvance-Choice und -Timing erneut serverseitig hart verwerfen.
- API-Verträge (PublicEvents/State-Deltas) für neue Triggertypen auf Redaction- und Feldkonformität prüfen.

### Web/UX
- Sichtbare Release-Kennung auf `V1.9.6`.
- Bestehende Overadvance-/Counter-Fehlermeldungen nur textuell robust machen, keine neue Interaktion.
- UI-Events auf unzulässige Deck/Zone-Personalisierung in Counter-/Purge-Szenen prüfen.

### Daten/Manifeste/Scenarios
- `data/manifests/card-implementation-manifest-1.9.6.json`
- `data/rules/mechanics-coverage-1.9.6.json`
- `data/scenarios/v196-card-release-smoke.json`
- `V1_9_6_RELEASE_ASSIGNMENT_PREFLIGHT.md` mit:
  - Kernkorb
  - Deferred-Zone
  - Hard-Blocked Karten (wenn vorhanden)
  - eindeutiger `releaseContract`-Abgleich

### Tests/Verifikation
- Engine-Tests, Server-Tests, Visibility-Tests und Replay/StateHash-Tests als gebündelte Pipeline.
- Fokus auf `Counter->Purge->Overadvance`-Nests mit deterministischer Reproduzierbarkeit.
- Leak-Checks für Hidden-Informationen in `PublicEvents`, `reconnect` und `undoPreview`.

## 7) Reihenfolge innerhalb des Releases

1. Preflight Freeze auf Kartenset + Vertragsgrenzen.
2. Counter-/Purge-Engine-Layer einbauen und stabilisieren.
3. Agenda-Overadvance-Engine und Scoring-Entscheide vereinheitlichen.
4. `Data Raven`/`Dupré` als harte Sonderfälle integrieren.
5. Manifest/Coverage/Scenario erzeugen.
6. Verifikation + DoD-Freeze.

## 8) Risiken + Gegenmaßnahmen

- Risiko: Gleichzeitige Counter- und Overadvance-Ketten erzeugen nicht deterministische Reihenfolgen.
  Gegenmaßnahme: zentrale Event-Prioritätenmatrix plus deterministische Sortierverträge.
- Risiko: `Data Raven` greift in Trace/Link-Pfad und `Dupré` in Run-/Fort-Pfade.
  Gegenmaßnahme: definierte Übergabe nach 1.9.7, klarer Deferred bei offenen Folgepunkten.
- Risiko: Performance-Verlust bei langen Purge-Kaskaden.
  Gegenmaßnahme: begrenzte Soak-Suite vor Freeze mit Lastprofilen.

## 9) mögliche Unmöglichkeiten / technische Limitationen

- Keine Auto-Generierung vollständiger Card-Resolver aus Regeltext.
- Keine Änderung der Engine-Topologie, nur Erweiterung vorhandener Trigger- und Priority-Hooks.
- Keine neue KI- oder Plattformfunktion.

## 10) DoD (Definition of Done)

- V1.9.6-Preflight eingefroren.
- 1.9.6-Kernkorb implementiert und im Manifest sichtbar.
- Counter-/Purge-/Overadvance-Pfade mit deterministischen Resultaten unter Replay.
- Leak- und Redaction-Gates grün.
- `corepack pnpm lint/typecheck/test/build` grün plus Release-spezifische Tests.
- Webclient-Version steht auf `V1.9.6`.

## 11) Abbruchkriterien

- Replay- oder StateHash-Abweichung in Counter-/Overadvance-Fällen.
- Trigger-Reihenfolge nicht deterministisch nach Seed-Wiederholung.
- Hidden Info wird in einem der Pflichtkanäle sichtbar.
- Scope-Drift Richtung 1.9.7-Familien.

## 12) Offene Fragen

Kritisch:
- Exakte Entscheidung bei Overadvance-Kette mit gleichzeitiger Counter-Reaktion auf bereits gescored Agenda.

Mittel:
- Muss `Dupré` in voller Tiefe oder mit kontrolliertem Deferred für 1.9.6 behandelt werden?

Optional:
- Muss `Arasaka Owns You` im 1.9.6-Korridor als zusätzlicher Grenzfall ergänzt werden?

## 13) Go/No-Go + Begründung

Go, sobald der Preflight vollständig freeze ist und `V1.9.5` grün abgeschlossen vorliegt.
Begründung: Die Familiegrenzen sind hart, Kernkorb ist fachlich abgegrenzt, und die meisten Seiteneffekte sind bereits in 1.9.5 als Grundgerüst vorbereitet.

## 14) Verifikation je Release

- Pflicht-Tests:
  - `corepack pnpm lint`
  - `corepack pnpm typecheck`
  - `corepack pnpm test`
  - `corepack pnpm build`
  - `corepack pnpm --filter @netgrid/engine test -- index.test.ts`
  - `corepack pnpm --filter @netgrid/catalog test -- index.test.ts`
  - `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`
- Contract-Checks:
  - Preflight-Konsistenz, Release-Kernkorb, Engine-Contract, Manifest-Allowlist.
- Leak/Redaction-Checks:
  - `PlayerViews`, `PublicEvents`, `Reconnect`, `UndoPreview`.
- Replay/StateHash:
  - Seed-Wiederholbarkeit auf Counter- und Overadvance-Szenarien.
  - Undo/Redo bei Kaskaden.
- CI-/Local:
  - 2 Performance-Soaks (kurz/lange Kaskade), 1 Leak-Regression.

## 15) Cross-Release-Handoff

- Übergabe an V1.9.7:
  - Freigabekorb 1.9.6 final.
  - Unklare Gegenlogikfälle zu `Data Raven`/`Dupré` mit Entscheidungspfad.
  - Konkrete Counter-/Overadvance-Order als Übergabelogik.
- Erwartete Folgeartefakte:
  - `V1_9_6_REQUIREMENTS.md`
  - `V1_9_6_TEST_MATRIX.md`
  - `V1_9_6_IMPLEMENTATION_HANDOFF.md`
  - `V1_9_6_FINAL_REVIEW.md`

## 16) Detaillierte Testfälle für den Umsetzungsthread

### 16.1 Engine-Regressionen (Counter/Purge/Overadvance-Kern)

1. **TC-196-01 – Counter-Startreihenfolge stabilisieren**
   - Setup: zwei Counter-Quellen auf demselben ICE-Ereignis.
   - Erwartung: Reihenfolge folgt definierter Layer-Matrix, unabhängig von Ausführungszeitpunkt.

2. **TC-196-02 – Virus-Purge vor Überlaufprüfung**
   - Setup: Karte mit Virus-Purge-Trigger und sofortiger Schadensverknüpfung.
   - Erwartung: Purge-Phase wird vor nachgelagertem Overadvance geprüft.

3. **TC-196-03 – Overadvance-Resolution bei statischer + aktivierter Agenda**
   - Setup: Kombination aus statisch überladener und aktivierter Overadvance-Agenda.
   - Erwartung: Overadvance-Limit und zusätzliche Punkte sind korrekt additive/ordnungsbezogene berechnet.

4. **TC-196-04 – Counter-/Purge-Doppelauflösung vermeiden**
   - Setup: dieselbe Quelle löst Counter und Purge bei gleichem Ereignis aus.
   - Erwartung: Deterministische Deduplication, keine doppelte Auswirkung.

5. **TC-196-05 – Agenda-Overadvance bei negierter Hard-Kondition**
   - Setup: Agendabedingung mit Gegenbedingung, die schwerfällige Gegenmaßnahmen triggert.
   - Erwartung: Ergebnis bleibt im Hard-Path identisch mit Seed.

6. **TC-196-06 – Counter-Kette im Multi-Run-Szenario**
   - Setup: mehrstufiger Run mit Counter-Entscheidungsfenster über zwei Züge.
   - Erwartung: kein Zustandstransplant zwischen Runs.

7. **TC-196-07 – Undo bei Purgekaskade**
   - Setup: Purge-Kaskade ausgelöst, anschließend Undo.
   - Erwartung: Rücknahme vollständig ohne Zombie-Counter.

8. **TC-196-08 – Undo Preview für Overadvance-Trigger**
   - Setup: Overadvance-Trigger nach Agenda-Satz, dann Undo-Preview.
   - Erwartung: Vorschau zeigt den alten, legalen Zustand.

9. **TC-196-09 – Reconnect nach Counter-Event**
   - Setup: Netzwerk-Reconnect direkt nach Counter-Aufruf.
   - Erwartung: Redaction und stateVersion bleiben konsistent.

10. **TC-196-10 – StateHash bei Counter-Pfadwechsel**
    - Setup: gleicher Verlauf mit/ohne Counter-Alternative.
    - Erwartung: deterministischer StateHash bei gegebener Aktion, andere Pfade mit klarer Hash-Divergenz.

### 16.2 Asset-/Agenda-Interaktion + Kartennahe Sonderfälle

11. **TC-196-11 – Arasaka Owns You**
   - Erwartung: Tag-Removal/Counter-Impact in Scored-Agenda-Pfad korrekt priorisiert.

12. **TC-196-12 – Fait Accompli**
   - Erwartung: Agenda-Difficulty und aktive Overadvance-Regel stimmen nach Wiederholbarkeit.

13. **TC-196-13 – On-Call-Ähnliche Ketten mit `Data Raven`**
   - Erwartung: Trace-/Link-Zustände und Counter-Auslösung nicht konfliktbehaftet.

14. **TC-196-14 – Dupré-Run/Run-Flow**
   - Erwartung: Run-/Fort-Persistenzzustand bleibt exakt kontrolliert bei Counterinterferenz.

15. **TC-196-15 – Falsified-Transactions und Management Shake-Up als Overadvance-Paar**
   - Erwartung: Overadvance nur nach vollständiger Agenda-Difficulty-Prüfung.

16. **TC-196-16 – Corprunner's Shattered Remains**
   - Erwartung: Overadvance und Counter nicht als doppelte Wirkung auf Access-/Kill-Pfad.

17. **TC-196-17 – Chicago Branch / Berlin-Kombination**
   - Erwartung: Asset-/Agenda-Kopplung bleibt ohne Scope-Drift in Counterzustände.

18. **TC-196-18 – Disinfectant, Inc. + Security-Spezialfälle**
   - Erwartung: Prevention-/Counter-Drosselung mit Agenda-Overadvance kompatibel.

19. **TC-196-19 – ACME Savings and Loan + `I Got a Rock`**
   - Erwartung: statische Difficulty- und Overadvance-Matrix bleibt gleich, wenn beide Karten gemeinsam aktiv sind.

20. **TC-196-20 – Hacker Tracker Central + Information Laundering**
   - Erwartung: Counter-/Purge-Interaktion ändert keine illegalen Zielmengen.

### 16.3 Contract-/Server-/Redaction-Checks

21. **TC-196-21 – Contract Coverage Preflight**
   - Setup: all-on-cards vs manifest-coverage diff.
   - Erwartung: keine fehlenden Pflichtkarten.

22. **TC-196-22 – Invalides applyAction-Timing**
   - Setup: ungültiges Timing/Choice auf Counter/Overadvance.
   - Erwartung: harte serverseitige Ablehnung.

23. **TC-196-23 – PublicEvents-Dedup**
   - Setup: mehrere Counter-Events in einem Zug.
   - Erwartung: Events sind vollständig ohne private Daten.

24. **TC-196-24 – Undo-Preview ohne private Overadvance-Daten**
   - Erwartung: Vorschau enthält nur erlaubte Felder.

25. **TC-196-25 – Reconnect vor und nach Purge**
   - Erwartung: keine Divergenz im Payload.

### 16.4 Replay/Performance

26. **TC-196-26 – Seed-Stabiler Replay der Counter-Longtail**
   - Erwartung: identischer Verlauf bei gleichem Seed.

27. **TC-196-27 – Soak-Performance (kurz)**
   - Setup: 10 aufeinanderfolgende Counter-Events.
   - Erwartung: kein unvertretbarer Drift in der Rechenzeit.

28. **TC-196-28 – Soak-Performance (lang)**
   - Setup: 50 aufeinanderfolgende Counter-Events mit Access-Mix.
   - Erwartung: kein unzulässiger Zeitanstieg > definierter Schwellwert.

29. **TC-196-29 – Deterministische Reproduktion in Replay-Hash**
   - Erwartung: Hash-Verlauf deckungsgleich zwischen Engine- und Server-Run.

30. **TC-196-30 – Recovery aus teilweisem Counter-Stack**
   - Erwartung: State kann stabil auf vorigen Zug zurückgesetzt werden.

31. **TC-196-31 – Server-Contract Smoke**
   - Erwartung: `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts` deckt neue API-Signaturen.

32. **TC-196-32 – CI-Artifactprüfung**
   - Erwartung: manifest/coverage/scenario konsistent mit dem finalen 1.9.6-Kernkorb.

33. **TC-196-33 – Multi-Replay Konsistenz**
   - Erwartung: deterministische Parallelausführung in mehreren Replays.

### 16.5 Abbruchkriterien auf Test-Ebene (No-Go)

- 2 von 5 Seed-Wiederholungen liefern abweichende Hash-Verläufe.
- Über 5% Drift in Soak-Laufzeit gegen Baseline.
- Ein einziges schweres Redaction-Leak bei Event-/Reconnect-Payload.

## 17) Abschluss

- Go/No-Go: **Go** nach grünem Testblock 16.* und finalem Preflight.
- Nächste drei Startaufgaben:
  1. Preflight-Lock + Deferred-Liste finalisieren.
  2. Event-Order-Matrix für Counter/Purge/Overadvance implementieren.
  3. `v196-card-release-smoke.json` auf Kernfälle (inkl. `Data Raven`, `Dupré`) aufsetzen.
- Gesamt-Empfehlung: 1.9.6 zuerst als „Contract- und Reihenfolge-Gates“, dann erst 1.9.7.
