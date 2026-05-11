# V1.9.8 Detailed Plan – Resolver-Longtail und Abschluss-Gate (inkl. Positionsgedächtnis)

Stand: 2026-05-11  
Status: planungsready für Umsetzung

## 1) Kontext und Zielbild

V1.9.8 ist der Abschlussknoten der 1.9.x-Kernlinie und verbindet:
- `L1B_PerCard_Resolver_Test_Gate` mit den offenen 49 Restfällen.
- Vollständige Finalisierung aller mechanischen Restfälle auf 0 offene Effektfamilien.
- Abschluss-Integration eines side-sicheren KI-Positionsgedächtnis-Gates.
- Freigabe der Sequenz vor jedem V2.x-Startpfad.

Verbindliche Quellen:
- [Open-Points Grobplan](C:/Projekte/NETGRID/docs/derived/V1_9_1_TO_V1_9_8_OPEN_POINTS_GROBPLAN.md)
- [CODEX-Status](C:/Projekte/NETGRID/docs/codex/CODEX_STATUS.md)
- [V1.9.4 Final Review](C:/Projekte/NETGRID/docs/derived/V1_9_4_FINAL_REVIEW.md)

## 2) Release-Dependency-Map

| Release | Abhängigkeit | Typ | Grund | Blocker |
| --- | --- | --- | --- | --- |
| V1.9.8 | V1.9.7_done | hart | Vorletzter 1.9.x-Block muss vollständig abgeschlossen sein | Keine 1.9.7-Finalisierung |
| V1.9.8 | L1B-Residualkatalog | hart | Langrest muss exakt abgearbeitet oder begründet deferred sein | Restfall > 0 bei Final |
| V1.9.8 | side-safe Memory-Contract | hart | KI-Gedächtnis ist fest im Abschlussvertrag definiert | unklare Invalidation bei Shuffle/Swap |
| Abschluss | V1.9.1 bis V1.9.8 sequenziell | hart | V2.x bleibt gesperrt | Offene sequenzielle Freigabe |

## 3) harte Startvoraussetzungen

- `V1.9.7_done: true`.
- `V1.9_1_TO_1.9_8_OPEN_POINTS_GROBPLAN.md` als verbindliche Longtail-Basis aktiv.
- Longtail-Preflight zeigt:
  - harte 49 Restfälle
  - `offene_familien` vor Release-Start
  - offene Deferred mit Begründung
- 1.9.x-Sichtbarkeits- und Redaction-Gates aus 1.9.6/1.9.7 sind grün.
- Keine neue V2.x-Implementierung parallel.

## 4) In-Scope / Out-of-Scope

In-Scope:
- `L1B_PerCard_Resolver_Test_Gate` (Restbestand laut aktueller Zuteilung).
- 1.9.8-Finalisierung aller offenen Kartenknoten auf `offene_familien = 0`.
- side-sicheres KI-Positionsgedächtnis inkl. Invalidationsregeln bei Positionswechseln.
- Vollständige Releaseartefaktkette für Abschluss:
  - manifest
  - mechanics coverage
  - smoke scenario
  - implementation handoff

Out-of-Scope:
- weitere Mechanikfamilien außerhalb des Restbestands.
- neues Plattform-/Netzwerk-/Account-Feature.
- neue Engine-Architektur oder neue RNG-Schicht.

## 5) Muss-/Soll-/Kann-Anforderungen

Muss:
- Longtail-Karteikorridor ist vollständig im Scope dokumentiert und im Manifest verankert.
- Pro Karte muss der Resolverzustand deterministisch wiederholbar sein.
- Side-safe Memory darf nur wahrheitsbelegte, legal beobachtbare Positionen speichern.
- Kein Leak in Reconnect, PublicEvents, UndoPreview, Replay, PlayerView.
- `V1.9.8` muss als sichtbare Version im Web vor Finalisierung stehen.

Soll:
- Explizite Invalidationen bei `shuffle`, `arrange`, `swap`, `draw`, `discard`.
- Positionsgedächtnis als Qualitätsverbesserung dokumentiert, nicht als neue Spielregel.
- Soak-Load für lange Resolverketten.

Kann:
- Appendix mit extra seltenen Kartenpaaren.
- Zusatzmessung `latency per resolver step`.

## 6) Umsetzungsschritte je Bereich

### Engine
- Restliche Resolverknoten nach Longtail-Priorität schließen.
- Für jede Longtail-Karte:
  - Contract-Check
  - Trigger-Pfad
  - Undo/Redo-Pfad
  - Redaction-Kontrakt
- KI-Memory-Konsolidierung auf `visibleZones`/`evidenceSafeEvents` umstellen.
- Replay- und StateHash-Hooks auf vollständige deterministische Reihenfolge erweitern.

### Server/API
- Release-Preflight auf 49 Restfälle mit finaler Artefaktliste binden.
- Endpunkte auf Memo-/Resolverdaten härten: keine nicht autorisierten Zoneinfos.
- API-Vertragsregeln für Reconnect/Undo/Replay finalisieren.

### Web/UX
- Sichtbarkeit auf `V1.9.8`.
- Anzeige von Resolver-/Memory-Warnungen nur textuell robustisieren.
- Keine neue Interaktionsebene.

### Daten/Manifeste/Scenarios
- `data/manifests/card-implementation-manifest-1.9.8.json`
- `data/rules/mechanics-coverage-1.9.8.json`
- `data/scenarios/v198-card-release-smoke.json`
- `V1_9_8_REQUIREMENTS.md` / `V1_9_8_TEST_MATRIX.md` / `V1_9_8_IMPLEMENTATION_HANDOFF.md` / `V1_9_8_FINAL_REVIEW.md` vorbereiten

### Tests/Verifikation
- Resolver-Longtail-Suite mit:
  - deterministischem Seed-Replay
  - per-card Coverage-Delta
  - Undo-/Reconnect-Regression
  - Memory-Invalidations
  - No-Open-Families-Gate

## 7) Reihenfolge innerhalb des Releases

1. Finale Longtail-Preflight und Kartenliste fixieren.
2. Resolver-Backlog sequenziell abarbeiten.
3. KI-Positionsgedächtnis integrieren.
4. Manifest/Coverage/Szenario final erstellen.
5. Full Verification + DoD + Final-Review.

## 8) Risiken + Gegenmaßnahmen

- Risiko: Restbestands-Überlauf (unvollständige Resolverfälle).
  Gegenmaßnahme: harte Null-Open-Abbruchbedingung und iterative Durchläufe.
- Risiko: Memory-Regel nimmt implizit private Information auf.
  Gegenmaßnahme: strikte Side-Safe-Tags und Contract-Tests auf Payload.
- Risiko: Resolver-Kaskaden führen zu nichtlinearer Laufzeit.
  Gegenmaßnahme: Soak-Matrix und Prioritätskürzung bei klaren Bottlenecks.

## 9) mögliche Unmöglichkeiten / technische Limitationen

- Kein Auto-Resolver aus Kartenparsern.
- Kein neues RNG-Verfahren.
- Kein neuer Plattformvertragswechsel außerhalb `release`-Artefakte.

## 10) DoD (Definition of Done)

- `L1B_PerCard_Resolver_Test_Gate` auf 0 offene Restfamilien.
- V1.9.8-Release-Artefakte vollständig konsistent.
- Side-safe Memory und Invalidationen in Engine/Tests dokumentiert und grün.
- Keine Redaction- oder Replay-Leaks.
- Verbindliche CI-Paketchecks grün.
- Weblabel `V1.9.8` aktiv.

## 11) Abbruchkriterien

- Verbleibende offene Effektfamilien im finalen Preflight.
- Seed-Wiederholung mit abweichendem StateHash.
- Memory-Feld wird in einem nicht-publicen Pfad gefälscht oder exponiert.
- Performance-Fail in definierten Longtail-Soaks.

## 12) Offene Fragen

Kritisch:
- Wie genau darf das Positionsgedächtnis nach `shuffle`/`arrange` invalidiert werden?

Mittel:
- Ob 1.9.8-Soaks als Endpunkt oder als Start-Pipeline nach Final Review laufen.

Optional:
- Umfang des Appends `rare edge` für die Longtail-Tests.

## 13) Go/No-Go + Begründung

Go, wenn Zero-Open-Families + Memory-Redaction + Replay-Hash-Gates im kompletten Block grün sind.
Begründung: erst dann ist die 1.9.x-Sequenz technisch und regelkonform für den V2.x-Einstieg abgeschlossen.

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
  - `V1_9_8_RELEASE_ASSIGNMENT_PREFLIGHT.md` auf `openCases=0`
  - Manifest/coverage/smoke auf 1.9.8-Liste konsistent
- Leak/Redaction-Checks:
  - `PlayerViews`, `PublicEvents`, `Reconnect`, `UndoPreview`
  - Sichtprüfung KI-Positionsdaten auf side-safe Struktur
- Replay/StateHash/Performance:
  - Seed-Replay-Konsistenz je Longtail-Set
  - Undo/Redo bei Longtail-Fällen
  - Soak auf kurzer und langer Kette

## 15) Cross-Release-Handoff (Ende der Sequenz)

- Handoff-Ziel:
  - `V1.9.1_bis_V1.9.8_sequenziell_abgeschlossen: true`
  - Start-Flag für V2.x nur nach Final Gate
  - Restfälle-Liste = 0
- Erwartete Folgeartefakte:
  - `V1_9_8_REQUIREMENTS.md`
  - `V1_9_8_TEST_MATRIX.md`
  - `V1_9_8_IMPLEMENTATION_HANDOFF.md`
  - `V1_9_8_FINAL_REVIEW.md`

## 16) Detaillierte Testfälle für den Umsetzungsthread

### 16.1 Longtail-Resolver-Mechanik

1. **TC-198-01 – Longtail-Bucket vollständig geladen**
   - Setup: Preflight mit 49 Restfällen.
   - Erwartung: Bucket enthält keine fehlenden und keine Fremdkarten.

2. **TC-198-02 – Resolver-Determinismus Basic**
   - Setup: Minimal-Resolverfall mit gleichem Seed zweimal.
   - Erwartung: identische Action-Reihenfolge und StateHash.

3. **TC-198-03 – Resolver-Determinismus Deep**
   - Setup: Deep-Resolverfall mit Kettenauslösung.
   - Erwartung: deterministische Auflösung trotz Mehrfach-Pivot.

4. **TC-198-04 – Resolver-Nil-Schutz**
   - Setup: optionaler Pfad ohne Resolverziel.
   - Erwartung: definierter No-Op ohne Absturz.

5. **TC-198-05 – Resolver-Fallback-Konsistenz**
   - Setup: Trigger ausgelöst, Resolver fehlt.
   - Erwartung: harte Fehlermeldung und kontrollierter Abbruch.

6. **TC-198-06 – Resolver-Konfliktauflösung**
   - Setup: zwei Resolverpfade auf dieselbe Aktion.
   - Erwartung: klare Priorität und keine Doppelanwendung.

7. **TC-198-07 – Resolver-Undo Basis**
   - Setup: Resolveraktion + Undo.
   - Erwartung: exakt vorheriger Zustand.

8. **TC-198-08 – Resolver-Undo Preview**
   - Erwartung: Undo-Preview zeigt den legalen Zwischenzustand.

9. **TC-198-09 – Reconnect nach Mid-Resolver**
   - Erwartung: Reconnect reproduziert die Resolverposition korrekt.

10. **TC-198-10 – Resolver-Hashvergleich**
    - Erwartung: identische StateHash-Verläufe bei Replay.

### 16.2 Memory-Positionsgedächtnis und Side-Sicherheit

11. **TC-198-11 – Sichtbare Zone speichern**
    - Setup: Runner beobachtet R&D/HQ/Remote als positionsgenau.
    - Erwartung: Memory enthält nur `sichtbar-beobachtete` Positionen.

12. **TC-198-12 – Draw-invaliderender Shuffle**
    - Setup: Shuffle auf beobachtete Zonen.
    - Erwartung: betroffene Memoryeinträge werden invalidiert.

13. **TC-198-13 – Swap/Arrange-Reaktion**
    - Setup: Kartenreihenfolge in Zone wird sortiert/geswappt.
    - Erwartung: alte Positionsannahmen werden verworfen.

14. **TC-198-14 – Corp-Run Einfluss auf Memory**
    - Setup: Übergang zwischen Corp-Zonenbewegungen.
    - Erwartung: Side-Safe-Flag bleibt korrekt.

15. **TC-198-15 – Hidden-Delta ohne Leak**
    - Setup: Memory aktualisiert nach Zuglauf mit Hidden-Hideout.
    - Erwartung: keine unerlaubte Karteninformationsableitung.

16. **TC-198-16 – Memory bei Off-Hit**
    - Setup: Memory wurde beobachtungsbasiert verfeinert, dann neue unbekannte Information.
    - Erwartung: kein Überspringen auf unsichere Karten-Titel.

### 16.3 Longtail-Karten-Clusters

17. **TC-198-17 – Rarity-Cluster**
   - Setup: seltene Restkarten in minimalem Szenario.
   - Erwartung: jeweils eigene Resolverpfade ohne Seiteneffekte.

18. **TC-198-18 – Deck-Patch-Cluster**
   - Setup: Restkarten aus gleichen Deckkontexten.
   - Erwartung: keine Cross-Deck-Resolver-Leaks.

19. **TC-198-19 – Host/Counter-Hinweis-Cluster**
   - Setup: Karten mit indirektem Host-/Counter-Vorläufer.
   - Erwartung: Resolver bleibt robust und unabhängig.

20. **TC-198-20 – Agnostic-Cluster**
   - Setup: Karten mit minimalem Interface.
   - Erwartung: Resolver greift nur bei definierten Triggern.

### 16.4 Contract-/Server-/Artifact-Checks

21. **TC-198-21 – 1.9.8 Manifest vs Core**
   - Erwartung: keine fehlenden Karten zwischen 1.9.8-Manifest und mechanics-coverage.

22. **TC-198-22 – Release Preflight**
   - Erwartung: `openCases=0` im finalen Preflight-Artefakt.

23. **TC-198-23 – API redaction on memory payload**
   - Erwartung: Memory-Felder in Reconnect/Undo-Preview ohne verdeckte Daten.

24. **TC-198-24 – applyAction mit legacy StateVersion**
   - Erwartung: harte Rejection bei veraltetem Zustand.

25. **TC-198-25 – Server replay diff**
   - Erwartung: Server- und Engine-Hashes konsistent.

### 16.5 Performance- und Stabilitätsnachweise

26. **TC-198-26 – Soak Short**
    - Setup: 25 Longtail-Karten in deterministischem Ablauf.
    - Erwartung: Laufzeit innerhalb Baseline.

27. **TC-198-27 – Soak Mid**
    - Setup: 49 Longtail-Karten plus 10 Wiederholungen.
    - Erwartung: keine exponentielle Degradation.

28. **TC-198-28 – Soak Extended**
    - Setup: 3 vollständige 49er-Läufe.
    - Erwartung: Memory und Hash stabil.

29. **TC-198-29 – GC- und Persistenzprofil**
    - Erwartung: kein unbehandelter Speicheranstieg über definierten Schwellen.

30. **TC-198-30 – Multi-Seed Regression**
    - Erwartung: jeder Seed liefert erwarteten deterministischen Verlauf.

31. **TC-198-31 – Final CI Gate**
    - Erwartung: Pflichttestblock grün.

32. **TC-198-32 – Release-Abschlussprüfung**
    - Erwartung: `CODEX_STATUS.md` auf 1.9.8-Abschlusspfad aktualisierbar.

33. **TC-198-33 – Sequenz-Lock**
    - Erwartung: `V1_9_1_bis_V1_9_8_sequenziell_abgeschlossen: true` nach Final Review.

### 16.6 Abbruchkriterien auf Test-Ebene (No-Go)

- 1 oder mehr Leaks bei `visibility`/`redaction`.
- offener Restfall im finalen Preflight.
- Wiederholte StateHash-Abweichung in Longtail-Replays.
- Performance > akzeptabler Schwellenwert im Extended-Soak.

## 17) Abschluss

- Go/No-Go: **Go** nur bei vollständigem Null-Open-Gate, deterministischen Longtail-Replays, vollständigem Memory-Side-Safety.
- Nächste drei Startaufgaben:
  1. Preflight + Kartensatz final auf 49 Restfälle fixieren.
  2. Resolver-Backlog A/B nach Priorität A bis K abarbeiten.
  3. Memory-Invalidationsregeln vorab als Testfälle in Testmatrix formalisieren.
- Gesamt-Empfehlung: Abschlussrelease als „hard stop“ vor V2.x, ohne Nebenrelease.
