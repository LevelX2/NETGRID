# V1.9.7 Detailed Plan – Upgrade-/Programm-/Hosting-/Destroy-Lifecycles

Stand: 2026-05-11  
Status: planungsready für Umsetzung

## 1) Kontext und Zielbild

V1.9.7 beendet den Lifecycle-Block vor dem Resolver-Longtail.

Zielbild:
- `L3_Generische_Upgrade_Faehigkeiten` stabilisieren.
- `L3_Programm_Subtypen_Daemon_Stealth_Worm_BaseLink` vollständig einbetten.
- `L2_Hosting_und_Hosted_Resource_Modelle` in Engine und Server konsistent machen.
- `L3_Uninstall_und_InstalledCard_Destroy` sauberer, deterministischer Kill-/Destroy-Pfad.
- Nebenwirkungen auf 1.9.6 bereits bestehende Counter-/Agenda-Pfade vermeiden.

Verbindliche Quellen:
- [Open-Points Grobplan](C:/Projekte/NETGRID/docs/derived/V1_9_1_TO_V1_9_8_OPEN_POINTS_GROBPLAN.md)
- [V1.9.6 Abschlusskontext](C:/Projekte/NETGRID/docs/derived/V1_9_6_DETAILED_PLAN.md)

## 2) Release-Dependency-Map

| Release | Abhängigkeit | Typ | Grund | Blocker |
| --- | --- | --- | --- | --- |
| V1.9.7 | V1.9.6_done | hart | Basispfade Counter/Agenda müssen grün sein | 1.9.6-DoD fehlt |
| V1.9.7 | Hosting-/Uninstall-Contracts | hart | Keine implizite Lifecycle-Lückenschließung erlaubt | fehlender Contract-Hardening |
| V1.9.7 | `V1_9_1_TO_V1_9_8_OPEN_POINTS_GROBPLAN` | hart | Familienzuordnung bleibt Pflicht | unpassende 1.9.8-Kardinalität |
| V1.9.8 | 1.9.7-Preflight | weich | Resolver-Longtail referenziert finalen Hostingzustand | offene per-card Lifecycle-Reste |

## 3) harte Startvoraussetzungen

- `V1.9.6_done: true`.
- `V1.9.6`-sichtbare Releaseversion abgeschlossen.
- 1.9.7-Preflight mit festen 51 Kandidatenkarten und Deferred-Liste.
- No-Scope-Banner aktiv (`kein V2.x`, `kein neues ai_supported`, keine Plattformfeatures).

## 4) In-Scope / Out-of-Scope

In-Scope:
- `L3_Generische_Upgrade_Faehigkeiten`.
- `L3_Programm_Subtypen_Daemon_Stealth_Worm_BaseLink`.
- `L2_Hosting_und_Hosted_Resource_Modelle`.
- `L3_Uninstall_und_InstalledCard_Destroy`.
- 51-Karten-Kernkorb als Startabgleich.

Out-of-Scope:
- `L1B_PerCard_Resolver_Test_Gate`.
- KI-Memory- und Trace-Privacy-Positionierung.
- Neuvergabe von Karten außerhalb freigegebenem 1.9.7-Scope.
- Neue UX-Flows.

## 5) Muss-/Soll-/Kann-Anforderungen

Muss:
- Jede Host-/InstalledCard-/Destroy-Entscheidung bleibt `LegalActions`-getrieben und serverseitig revalidiert.
- Keine Leaks bei Host-Zuordnung, Hosted-Zone, Resource-Pfaden, Uninstall-Fire.
- `applyAction` prüft Timing + Choice-Kontrakte bei verschachtelten Hosting-Events.
- Undo/Undo-Preview muss Hostgraph-Konsistenz garantieren.

Soll:
- Deterministische Auflösung bei verschachteltem Hosting mit mehreren Ebenen.
- Karten mit mehreren Subtypen (Daemon/Stealth/Worm/BaseLink) in einem Teststrang pro Subfamilie.

Kann:
- Tieferes Performance-Monitoring für Hostgraph-Länge > 5.
- Erweiterte Edge-Suite für seltene Destroy-Simultaneitäten.

## 6) Umsetzungsschritte je Bereich

### Engine
- Subtyp-Verträge für `Daemon`, `Stealth`, `Worm`, `BaseLink` ergänzen.
- Hosting-Hierarchien als deterministische Eltern-Kind-Beziehungen modellieren.
- Uninstall/InstalledCard_Destroy als zentrale Lifecycle-Funktion für alle Unterfamilien.
- Konfliktmatrix bei simultanen Destroy-Auslösern (host owner change, purge, end-of-turn, trash).
- Engine-Regression mit Fokus auf:
  - Nested Hosting
  - Host-Löschung im Zug-/Undo-Kontext
  - Upgrade-Ketten und Rebuilds

### Server/API
- 1.9.7-Freigabeliste inkl. `releaseContract` und `deferred` exakt abbilden.
- `applyAction`-Verlauf für `install`, `rez`, `host`, `uninstall`, `destroy` neu hart validieren.
- API-Payload-Sanitizer gegen Hostinformationen unter Redaction prüfen.

### Web/UX
- Version auf `V1.9.7`.
- Anzeige von Hostzuständen nur über bestehende Felder nach Sicherheitsmodell.
- Keine neue Interaktionslogik; bestehende Meldungen robust genug.

### Daten/Manifeste/Scenarios
- `data/manifests/card-implementation-manifest-1.9.7.json`
- `data/rules/mechanics-coverage-1.9.7.json`
- `data/scenarios/v197-card-release-smoke.json`
- `V1_9_7_RELEASE_ASSIGNMENT_PREFLIGHT.md`:
  - 51-Karten-Kernkorb
  - Deferred-Liste
  - Contract-Delta zu 1.9.6

### Tests/Verifikation
- Host-/Destroy-/Upgrade-Pipelines in Engine- und Server-Tests.
- Redaction-Fokus auf `hosted`, `installed`, `ownedBy`, `trashSource`.
- Replay/StateHash für Szenarien mit verschachteltem Hosting.

## 7) Reihenfolge innerhalb des Releases

1. 1.9.7-Preflight Freeze.
2. Subtyp-Engine-Contracts implementieren.
3. Hosting-Hooks und Destroy-Ketten integrieren.
4. Upgrade-/Uninstall-Mechaniken schließen.
5. Artefakte und Scenarios finalisieren.
6. DoD und Handoff vorbereiten.

## 8) Risiken + Gegenmaßnahmen

- Risiko: Kollision zwischen Host-Lebenszeit und Counter-/Purge-Resten aus 1.9.6.
  Gegenmaßnahme: klare Owner/side-gesicherte Guardrails + Regressionen in Grenzfällen.
- Risiko: Nested Hosting führt zu nichtdeterministischem Rebuild.
  Gegenmaßnahme: deterministische Host-Topologie-Sortierung und Knoten-IDs.
- Risiko: Destroy-Zeitpunkte konkurrieren zwischen Runner- und Corp-Events.
  Gegenmaßnahme: explizite Zeitfenster-/Priority-Tabelle.

## 9) mögliche Unmöglichkeiten / technische Limitationen

- Keine neue Subsystem-Architektur für Hosting.
- Keine neue Kartenparser- oder KI-Regelschicht.
- Keine Änderung der Netzwerk-Infrastruktur.

## 10) DoD (Definition of Done)

- 1.9.7-Kernkorb eingefroren und umgesetzt.
- Host-Graph, Upgrade-, Uninstall- und Destroy-Pfade deterministisch.
- Keine Scope- oder Redaction-Leaks.
- Engine-/Server-/Replay-/Undo-Reproduktion bei Kern-Scenarios grün.
- Weblabel auf `V1.9.7`.

## 11) Abbruchkriterien

- Non-Determinismus im Hostgraph- oder Destroy-Verhalten.
- Undo-Preview zeigt Referenzen auf nicht mehr existente Hosted-Instanzen.
- Undokumentierte Deferred-Ausweitung.
- Reconnect-Payload leakt host-relevante private Daten.

## 12) Offene Fragen

Kritisch:
- Reihenfolge bei gleichzeitiger Uninstall durch `destroy` + `uninstall` bei mehrstufigem Hosting.

Mittel:
- Muss `Worm`-Kombinationen bei 1.9.7 komplett in einem Pass behandelt werden oder als kontrollierte Unterwelle?

Optional:
- Umfang der neuen Explainability für Host-Entscheide.

## 13) Go/No-Go + Begründung

Go, sobald der 1.9.7-Preflight vollständig eingefroren und 1.9.6 final ist.
Begründung: Die Familien sind diszipliniert getrennt, und die Releasegrenzen bleiben stabil.

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
  - Manifest/Katalog- und Coverage-Konsistenz.
  - Host-Contract-Validität in Apply- und Undo-Pfaden.
- Leak/Redaction:
  - Reconnect/Reversal/PlayerView auf `hosted`, `trashSource`, `uninstallReason`.
- Replay/StateHash/Performance:
  - Seed-konsistente Hostgraph- und Destroy-Szenarien.
  - Undo-Preview-Diff gegen Baseline.

## 15) Cross-Release-Handoff

- Übergabe an V1.9.8:
  - Vollständiger Handoff der verbleibenden `L1B`-Backlogfälle.
  - Dokumentierte offene Reihenfolgeentscheidungen für Resolver.
  - Openpunkte, die auf 1.9.8 warten.
- Erwartete Folgeartefakte:
  - `V1_9_7_REQUIREMENTS.md`
  - `V1_9_7_TEST_MATRIX.md`
  - `V1_9_7_IMPLEMENTATION_HANDOFF.md`
  - `V1_9_7_FINAL_REVIEW.md`

## 16) Detaillierte Testfälle für den Umsetzungsthread

### 16.1 Host-/Upgrade-Grundstabilität

1. **TC-197-01 – Hosting-Topologie deterministisch**
   - Setup: mehrere Karten in Host-Kette mit Install-Reihenfolge A->B->C.
   - Erwartung: feste Knotenreihenfolge nach deterministischem Hostsortierer.

2. **TC-197-02 – BaseLink-Subtyp-Validierung**
   - Setup: Baselink-Programme mit konkurrierenden Host-Events.
   - Erwartung: Windowing-Fenster bleibt konsistent.

3. **TC-197-03 – Daemon-Subtyp und Destroy-Pfad**
   - Setup: Daemon wird während aktiver Kette zerstört.
   - Erwartung: sauberer Aufruf der Destroy-Kette ohne Nebeneffekte.

4. **TC-197-04 – Stealth/Worm-Hostwechsel**
   - Setup: Worm/Stealth wechselt Host vor Zugende.
   - Erwartung: Zustände bleiben konsistent und undofähig.

5. **TC-197-05 – Upgrade-Anbindung im Runner-Board**
   - Setup: Upgrade in Mehrfachbezug installiert.
   - Erwartung: keine doppelte Anwendung bei gleicher Operation.

6. **TC-197-06 – Upgrade ohne gültigen Host**
   - Erwartung: `applyAction` lehnt invaliden Hostpfad ab.

7. **TC-197-07 – Uninstall-Queue bei Mehrfachschutz**
   - Setup: eine Karte mit mehreren Uninstall-Auslösern.
   - Erwartung: nur einmaliger, deterministischer Remove.

8. **TC-197-08 – InstalledCard_Destroy bei Reconnect**
   - Erwartung: Reconnect-Payload enthält keine internen Karteninfos.

9. **TC-197-09 – Undo nach Hosting-Deep-Change**
   - Setup: Hostkette 4 Ebenen, anschließend Undo.
   - Erwartung: zurückgesetzter Graph exakt.

10. **TC-197-10 – Undo-Preview bei Destroy**
    - Erwartung: Vorschau zeigt Zustand vor Destroy ohne Dangling-Host-Zuordnung.

### 16.2 Kartennahe Edgefälle

11. **TC-197-11 – Afreet und Submarine Uplink**
   - Erwartung: Subtyp-Interaktion mit Trace/Hosting bleibt stabil.

12. **TC-197-12 – Cloak/Jackhammer/Succubus im Hostgraph**
   - Erwartung: Upgrade-/Programmtaxonomie bleibt konsistent.

13. **TC-197-13 – Corprunner's Shattered Remains**
   - Erwartung: Uninstall/Scored-Agenda-Kreuzkaskade ohne doppelte Auslösung.

14. **TC-197-14 – Experimental AI + Chimera**
   - Erwartung: Asset/Upgrade-Lebenszyklen korrekt miteinander harmonisiert.

15. **TC-197-15 – Dread Team-ähnliche Destroy-Simultaneität (detaillierte Beispielgruppe)**
   - Erwartung: keine unklare Reihenfolge bei gleichzeitiger Entfernen-Mehrfachauslösung.

16. **TC-197-16 – Dedicated Response Team / `Dread Team`**
   - Erwartung: Damage-/Ambush-abhängige Hostingpfade bleiben deterministisch.

17. **TC-197-17 – BBS Whispering Campaign & Holovid Campaign**
   - Erwartung: Hosting-Refresh bei Wiederholungsspielen ist idempotent.

18. **TC-197-18 – Krumz / Crybaby / Turbeau Delacroix**
   - Erwartung: BaseLink-Host- und Subtyp-Fenster korrekt validiert.

19. **TC-197-19 – Rockerboy Promotion / Spinn Public Relations**
   - Erwartung: Host- und Recurring-Zielstrukturen konsistent.

20. **TC-197-20 – Triggerman & Fragmentation Storm**
   - Erwartung: Uninstall-Pfade schließen ohne Leaks.

21. **TC-197-21 – Chicago-Suite (Grid-Karten im Upgrade-Kern)**
   - Erwartung: Kartenkombination bleibt im Scope und ohne Cross-Release-Leak.

### 16.3 Server-API- und Contract-Checks

22. **TC-197-22 – Contract Preflight vs Manifest**
   - Erwartung: alle 1.9.7-Pflichtkarten in Manifest und Coverage.

23. **TC-197-23 – Host-Choice-Revalidierung**
   - Setup: Hostchoice wird nach Zwischenergebnis geändert.
   - Erwartung: veraltete Choice wird verworfen.

24. **TC-197-24 – applyAction Timing Hosting**
   - Setup: Timing außerhalb Hostphase.
   - Erwartung: harte serverseitige Rejection.

25. **TC-197-25 – PublicEvents bei Destroy**
   - Erwartung: keine private Hosted-Zuordnung im öffentlichen Channel.

26. **TC-197-26 – Undo-preview Leak Test**
   - Erwartung: Undo-Preview zeigt nur erlaubte Hosting-Information.

### 16.4 Replay/Performance

27. **TC-197-27 – Seed-Kontinuität bei Deep Hosting**
   - Erwartung: gleiche StateHashes bei erneutem Replay.

28. **TC-197-28 – Soak (Kurze Kette)**
   - Setup: 20 Host/Uninstall-Operationen im Testlauf.
   - Erwartung: keine unplanmäßigen Regressionen.

29. **TC-197-29 – Soak (Tiefe Kette)**
   - Setup: 60 Host/Uninstall-Operationen + nested triggers.
   - Erwartung: keine deutliche Laufzeitdrift.

30. **TC-197-30 – Redraw/Undo-Fallback**
   - Setup: Mid-Action Undo auf Hostgraph.
   - Erwartung: Replay reproduzierbar mit validem Hash.

31. **TC-197-31 – Multi-Run Reprod**
   - Erwartung: Wiederholte Durchläufe mit gleicher Seed-Pipeline deterministisch.

32. **TC-197-32 – Engine/Server StateHash-Konstanz**
   - Erwartung: Hostgraph-Kontrakte unverändert zwischen Engine- und Server-Läufen.

33. **TC-197-33 – CI-Abgleich 1.9.7**
   - Erwartung: Alle Pflicht- und Pakettests grün mit Artefaktkonsistenz.

### 16.5 Abbruchkriterien auf Test-Ebene (No-Go)

- Nichtdeterministische Hostgraph-Rekonstruktion bei gleichem Seed.
- 1 oder mehr Redaction-Fehlkonsistenzen.
- Performance-Diff über definierter Soak-Schwelle ohne Begründung.

## 17) Abschluss

- Go/No-Go: **Go** nach grünem Vektor in Abschnitt 16.
- Nächste drei Startaufgaben:
  1. 1.9.7-Preflight finalisieren.
  2. Hostgraph-Engine und Destroy-Resolver in stabiler Reihenfolge implementieren.
  3. 1.9.7-Smoke-Szenarien mit 5 Kernkarten und 5 Gegenbeispielen aufsetzen.
- Gesamt-Empfehlung: 1.9.7 als Architektur-Schutzschicht ausführen, bevor Resolver-Longtail startet.
