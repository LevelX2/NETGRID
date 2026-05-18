# V1.9.5 Detailed Plan – Persistente Boardlogik und globale Modifier

Stand: 2026-05-11  
Status: planungsready für Umsetzung

## 1) Kontext und Zielbild

V1.9.5 ist der nächste Kernschritt nach `V1.9.4` und schließt die Restfamilien:

- `L3_Generische_Asset_Node_Faehigkeiten`
- `L2_Globale_Statische_Modifier_ICE_Cost_Strength`
- `L3_Persistente_Modifier_und_Sonderzustaende`

Ziel ist eine deterministische, legal-action-basierte Grundierung dieser Familien, damit nachfolgenden Releases (`V1.9.6`+) auf konsistenten Board- und Modifier-Zuständen aufsetzen können, ohne den V2.x-Pfad zu starten.

## 2) harte Startvoraussetzungen

- `V1.9.4_done: true` und `V1.9.4_final` muss aktiv sein.  
  [V1.9.4 Final Review](C:/Projekte/NETGRID/docs/releases/v1/v1-9-originalset-completion/v1-9-4-mechanikpaket-m/final-review.md)
- Sequenzfreigabe `V1.9.1` bis `V1.9.4` muss aktiv/abgeschlossen bleiben.  
  [Status-Signal](C:/Projekte/NETGRID/docs/codex/CODEX_STATUS.md)
- `V1.9.4`-Preflight/Kernkorb und offene Deferred-Menge sind bekannt und in Folgeplanung übergeben.  
  [Grobplan](C:/Projekte/NETGRID/docs/releases/v1/v1-9-originalset-completion/v1-9-1-mechanikpaket-j/open-points-grobplan-to-v1-9-8.md)
- Kein V2.x-Gate darf vor `V1.9.8` geöffnet werden.  
  [V2.x-Limitation](C:/Projekte/NETGRID/docs/derived/V2_3A_REQUIREMENTS.md), [CODEX Status](C:/Projekte/NETGRID/docs/codex/CODEX_STATUS.md)

## 3) In-Scope / Out-of-Scope

In-Scope:
- Mechanikfamilien:
  - `L3_Generische_Asset_Node_Faehigkeiten`
  - `L2_Globale_Statische_Modifier_ICE_Cost_Strength`
  - `L3_Persistente_Modifier_und_Sonderzustaende`
- 1.9.5-Freigabekorb: Kernzielgröße **32 Karten** (die verbleibenden Familienpunkte werden mit klarer Deferred-Grenze behandelt).
- Release-Artefakte: Manifest, Szenario, Mechanik-Coverage, Prüfmatrix, Requirements-Review.

Out-of-Scope:
- V1.9.6+/V1.9.7-Mechanikfamilien (`Counter`, `Agenda`, `Hosting`, `Uninstall`).
- V2.x-Features (z. B. öffentliches Matchmaking, Accounts, Persistenzexpansion).
- Änderung des `ai_supported`-Wertes außerhalb bestehender Regeln (keine automatische KI-Freigabe).
- Engine-Rewrite, RNG-Neudesign oder neue KI-Architektur.

## 4) Muss-/Soll-/Kann-Anforderungen

Muss:
- Release wird als sequenzieller Schritt `V1.9.5` in der gleichen Pipeline `5→6→7→8` geplant.
- Familiescope bleibt exakt auf `V1.9.5`-Zielfamilien begrenzt.
- Alle Änderungen bleiben `LegalActions`-abgeleitet und `applyAction`-revalidierbar.
- Keine Hidden-Info-Lecks in PlayerViews, PublicEvents, KI-Inputs, Reconnect- oder Websocket-Payloads.
- Sichtbare Webversion auf `V1.9.5`.

Soll:
- Reihenfolge der globalen Modifier-Layer deterministisch dokumentieren.
- Persistente Sonderzustände mit Undo-/Rollback-Pfaden absichern.
- Karten im Freigabekorb mit klarer Karten-ID-Liste dokumentieren.

Kann:
- Extra-Regressionen für seltene Edge-Kombinationen pro `Asset`/`Node`-Modifier-Stack.
- Soak-Tests für Dauerläufe mit vielen Persistent-Modifier-Umschaltungen.

## 5) Umsetzungsschritte je Bereich

### Engine
- Implementierung der Priorisierungslogik für globale statische Modifier (ICE-Kosten/Stärke).
- Einführung/Anpassung persistenter Modifier-Zustände inkl. deterministischer Anwendung/Entfernung.
- Erweiterung der `Asset`/`Node`-Fähigkeiten in Bezug auf bestehende Laufzeitkontrakte.
- Aufsetzen/Anpassen von Choice-Validierung, sobald Modifier- oder Trigger-Fenster Entscheidungen erzwingen.
- Engine-Tests (Unit/Scenario) für:
  - Modifier-Layer-Priorität
  - Persistenz-Lebenszyklus
  - Undo-/Undo-Preview-Stabilität

### Server/API
- Freigabepreflight `V1.9.5` mit festem `freigabefaehig`/`deferred`-Split.
- Erweiterung der erlaubten Karte-/Mechanikliste in Manifest/Runtime für genau diesen Kernkorb.
- Keine neuen Endpunkte; vorhandene Flows nur auf neue Karteikorpuselemente mappen.

### Web/UX
- Update der sichtbaren Versionsnummer auf `V1.9.5`.
- UI-/Tooltip-Verhalten nur an den bestehenden Modifikator-Anzeigen orientieren; keine neue Interaktionsebene.

### Daten/Manifeste/Scenarios
- Erzeugen:
  - `data/manifests/card-implementation-manifest-1.9.5.json`
  - `data/rules/mechanics-coverage-1.9.5.json`
  - `data/scenarios/v195-card-release-smoke.json`
- Dokumentation der Kernkorb-Zuordnung in `V1_9_5_REQUIREMENTS.md` und Preflight-Dokument.

### Tests/Verifikation
- Ergänzung der Engine-Testblöcke für die drei Zielfamilien.
- Server-Katalog-/Manifesttests auf 1.9.5-Releasekontrakte.
- Visibility-/Leak-Checks auf neue Modifier-Payloads und temporäre Zustandsträger.
- Replay/StateHash-Stabilitätsprüfung für die neuen Szenarien.

## 6) Reihenfolge innerhalb des Releases

1. Preflight-Freeze (`freigabefaehig`/`deferred`, Kartenzuordnung, harte Familie-Range)
2. Engine-Implementation (Modifier-Layer und Persistenz)  
3. Manifest-/Coverage-/Scenario-Erstellung
4. Server-/Web-Check auf Contracts & Redaction
5. Vollständige Verifikation + lokalen Gate-Lauf
6. DoD-Prüfung und Übergabe nach `V1_9_6`

## 7) Risiken + Gegenmaßnahmen

- Risiko: Konflikt zwischen statischen und bereits existierenden Runtime-Modifiern  
  Gegenmaßnahme: zentral definierte Modifier-Order + Regressionstests pro Kombinationsfall
- Risiko: Persistente Zustände bleiben bei Undo/Replay inkonsistent  
  Gegenmaßnahme: deterministische Revert-Routinen und StateHash-Regressionen
- Risiko: Scope-Drift in spätere Familien (Counter/Hosting)  
  Gegenmaßnahme: harte Familie-Guardrails in Requirements/Testmatrix

## 8) mögliche Unmöglichkeiten / technische Limitationen

- Keine vollständige automatische Ableitung aus externem Kartentext; Implementierung bleibt manuell/fundiert.
- Keine Änderung der Kern-Engine-Architektur; die Releaseziele sind auf bestehende Hooks begrenzt.
- Keine zusätzliche KI-Sichtweite oder Plattformfunktionalität außerhalb lokaler Regeln.

## 9) DoD (Definition of Done)

- V1.9.5-Preflight eingefroren.
- `V1.9.5` Kernkorb implementiert und im Karten-Mapping verifiziert.
- Engine/Server/Web-Tests grün inkl. Replay-/StateHash-Regressionen.
- Visibility- und Redaction-Checks grün.
- Webclient zeigt `V1.9.5`.
- `V1.9.5`-Weitergabe (offene Deferred-Liste und Risiken) für `V1.9.6` eindeutig dokumentiert.

## 10) Abbruchkriterien

- Nichtdeterministische Modifier-Reihenfolge in Wiederholläufen.
- Verstoß gegen No-Scope-Regeln (V2.x, neue KI-Deck-Freigaben, neue Karten außerhalb Freigabekorb).
- Persistente Zustand-Drift oder Replay-Hash-Divergenz.
- Leaks von Token/Deckdaten/Hidden-Informationen.

## 11) Offene Fragen

Kritisch:
- Exakte Reihenfolge bei Modifier-Layer-Konflikten mit bereits bestehenden Karten in bereits implementierten Releases.

Mittel:
- Ob die Kernkorbgröße 32 im ersten Schritt absolut hart bleibt oder als zwei kleine Batches (mit gleicher Version) notwendig wird.

Optional:
- Umfang und Laufzeit von zusätzlichen Soak-Szenarien.

## 12) Go/No-Go + Begründung

Go, sobald der Preflight fristgerecht eingefroren und der Kernkorb genehmigt ist.  
Begründung: Familie-Startpunkt ist freigegeben, Risiken sind in Tests und Guardrails abgedeckt.

## 13) Verifikation je Release

- Pflichttests:
  - `corepack pnpm lint`
  - `corepack pnpm typecheck`
  - `corepack pnpm test`
  - `corepack pnpm build`
  - `corepack pnpm --filter @netgrid/engine test -- index.test.ts`
  - `corepack pnpm --filter @netgrid/catalog test -- index.test.ts`
  - `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`
- Contract-Checks:
  - Release-Preflight/Allowlist/Manifest-Konsistenz
  - Version-Label-Contract im Webclient
- Leak/Redaction:
  - `tests/specs/visibility-contract.test.ts` ergänzen für neue 1.9.5-Pfade
- Replay/StateHash:
  - neue Smoke- und Undo/Redo-Szenarien plus deterministische Seedläufe

## 14) Cross-Release-Handoff nach V1.9.5

- Für `V1.9.6` werden als offene Punkte übergeben:
  - Deferred-Liste, die nicht in 32 Karten aufgenommen wurden.
  - Modifier-/Persistenzentscheidungen inkl. Nebenfallströmen.
  - Erhöhte Prioritätsregeln für Counter/Agenda-Interaktionen, falls in bestehenden Integrationspfaden relevant.
- Erwartete Folgeartefakte:
  - `V1_9_5_REQUIREMENTS.md`
  - `V1_9_5_TEST_MATRIX.md`
  - `V1_9_5_RELEASE_ASSIGNMENT_PREFLIGHT.md`
  - `V1_9_5_IMPLEMENTATION_HANDOFF.md`
  - `V1_9_5_FINAL_REVIEW.md`

## 15) Detaillierte Testfälle für den Umsetzungsthread V1.9.5

Alle folgenden Tests sind als umsetzungsreife Akzeptanztests für den 1.9.5-Umsetzungsthread zu lesen.

### 15.1 Engine-Regressionen (Priorisierung + Persistenz)

1. **TC-195-01 – Deterministische Modifier-Sortierung**
   - **Setup:** Zwei globale Modifier A und B mit gleicher Priorität, unterschiedlicher `sourceId`, gleicher Layer, gleicher Richtung.
   - **Test:** Spiel mit identischer Aktion zweimal starten und neu berechnen.
   - **Erwartung:** Reihenfolge der Anwendung bleibt zwischen Läufen identisch; StateHash unterscheidet sich nicht.

2. **TC-195-02 – Harte Layer-Priorität**
   - **Setup:** Kombinierte Auswirkungen auf ICE-Kosten (base, flat, proportional, cap/replace).
   - **Test:** Anwendung in gesetzter Layer-Priorität ausführen.
   - **Erwartung:** Das Ergebnis entspricht genau der in der Layerdefinition festgelegten Reihenfolge (keine implizite Reihenfolge).

3. **TC-195-03 – Tiebreaker-Sicherheit bei gleichen Layern**
   - **Setup:** Drei globale Modifier mit identischem Layer/Typ.
   - **Test:** Reihenfolgewechsel in der Ausführungs-Pipeline simulieren (Input-Array umsortiert).
   - **Erwartung:** Ergebnis bleibt stabil; Ausgabe basiert auf festem Tiebreaker (z. B. Release/Paket/SourceId).

4. **TC-195-04 – Persistenter Modifier nur einmal anlegen**
   - **Setup:** Karte mit `stackable=false` mehrmals aktivieren.
   - **Test:** Zweite Aktivierung erzwingt `idempotent` Verhalten oder definierten Replace-Mechanismus.
   - **Erwartung:** Kein doppelter Effekt, kein Doppelabzug/überzähliger Status-Count.

5. **TC-195-05 – Persistenzende beim definierten Trigger**
   - **Setup:** Persistenter Zustand mit End-of-turn/Phase- oder Bedingungs-Ende.
   - **Test:** Trigger ausführen und anschließend `Undo`.
   - **Erwartung:** Zustandsverlauf ist deterministisch; Undo stellt exakt den früheren Lauf zurück.

6. **TC-195-06 – Persistente Sonderzustände bei Besitzerwechsel**
   - **Setup:** Effekt gebunden an Spieler/Side.
   - **Test:** Host/Runner-Zuordnung im Szenario wechseln und State replayen.
   - **Erwartung:** Effekt bleibt bei Ursprungs-Owner, sofern so vertraglich, sonst konsistent übertragen (konkret dokumentierter Contract).

7. **TC-195-07 – Persistenz-Dereferenzierung**
   - **Setup:** Karte entfernt, gelöscht, gehosted/unhosted oder aus der Hand verworfen.
   - **Test:** Jede Lebenszyklusart triggern.
   - **Erwartung:** Der Effekt wird korrekt entfernt, ohne Zombie-Zustand.

8. **TC-195-08 – Undo/Undo-Preview ohne Drift**
   - **Setup:** persistenter Modifier aktiv + offene Choice + Trigger.
   - **Test:** Undo-preview erzeugen, Aktion zurückdrehen, erneut rendern.
   - **Erwartung:** Keine sichtbaren "Geister-Modifier", keine Wahlmöglichkeiten auf nicht mehr gültige Ziele.

### 15.2 Asset/Node-Fähigkeiten und Laufzeitverträge

9. **TC-195-09 – Contract-Validation bei Engine vs. Manifest**
   - **Setup:** Für jede Kernfamilien-Karte die Manifest-Contract-Metadaten gegen Engine-Funktionssignatur prüfen.
   - **Test:** Automatisiert gegen `V1_9_5`-Manifest laufen lassen.
   - **Erwartung:** Kein Contract-Bruch (Payload/Choice/Trigger fehlen nicht).

10. **TC-195-10 – Installierte Fähigkeit in der `canActivate`-Logik**
    - **Setup:** Asset/Node unter ungültigen Bedingungen (Host/Kostenzustand/Target).
    - **Test:** Aktivierung testen.
    - **Erwartung:** `canActivate` blockiert sauber; kein stilles `apply` auf illegalem Kontext.

11. **TC-195-11 – `apply` + `rollback` bei Node/Asset**
    - **Setup:** Ability mit permanentem und temporärem Effekt.
    - **Test:** `apply` ausführen, danach `rollback`/`undo`.
    - **Erwartung:** Symmetrische Rücknahme ohne Restzustand.

12. **TC-195-12 – Mehrfachfähigkeiten desselben Typs**
    - **Setup:** Zwei Karten aus derselben Asset/Node-Familie mit ähnlichem Effekt.
    - **Test:** Gleichzeitige Aktivierung in Folgeaktionen.
    - **Erwartung:** Korrekte Aggregation/Isolation nach definiertem Layering.

13. **TC-195-13 – Host/Trash/Kaskaden-Robustheit**
    - **Setup:** Node/Asset wird mitten im Effekt-Pfad zerstört.
    - **Test:** `applyAction` validiert und führt den Effekt reproduzierbar zurück.
    - **Erwartung:** Keine Crashs, kein Verweis auf tote Referenz.

### 15.3 Choice/Trigger-Validierung und `applyAction`-Härte

14. **TC-195-14 – Choice-Refresh nach Modifier-Änderung**
    - **Setup:** Vorwahlmenge vorhanden, danach globaler Modifier ändert Kosten/Ziele.
    - **Test:** Auswahl öffnen, Modifier anwenden, Choice neu öffnen/fortführen.
    - **Erwartung:** Alte Auswahl wird invalidiert; aktuelle legal targets werden neu berechnet.

15. **TC-195-15 – Trigger-Deduplizierung**
    - **Setup:** Trigger, der bei Änderung von Modifier-Zustand erneut entstehen könnte.
    - **Test:** Mehrfachauslösung durch gleiche Bedingung prüfen.
    - **Erwartung:** Deterministische einmalige Verarbeitung gemäß Trigger-Definition.

16. **TC-195-16 – Ungültige Choice in `applyAction`**
    - **Setup:** Gespeicherter Choice-Id/Index auf nicht mehr verfügbares Target.
    - **Test:** `applyAction` mit dem Altwert aufrufen.
    - **Erwartung:** Fehlerhafter Versuch wird strikt abgelehnt; kein partielle Updates.

17. **TC-195-17 – Undo-Preview + offene Choice**
    - **Setup:** Offene Choice + Undo-Pfad.
    - **Test:** Undo-Preview lädt Zwischenzustand.
    - **Erwartung:** Keine stale choices, keine Leaks, UI zeigt nur legal validierte Optionen.

18. **TC-195-18 – StateVersion/Timing-Guard**
    - **Setup:** Veraltete `stateVersion` auf Action-Laden mit gültigem Inhalt.
    - **Test:** Ausführen gegen Server/API.
    - **Erwartung:** Relevante Rejection und vollständige Neuauflösung via Replay-Delta.

### 15.4 Verifizierungen zu Sichtbarkeit und Redaction

19. **TC-195-19 – Keinerlei Hidden Info in PlayerViews**
    - **Setup:** Globaler Modifier mit verdeckter Quelle/Hidden-Zone-Teilinformation.
    - **Test:** PlayerView/Replay für beide Parteien prüfen.
    - **Erwartung:** Keine verdeckten Karteninhalte oder Tokens für Gegenpartei sichtbar.

20. **TC-195-20 – Reconnect/Undo-Preview-Maskierung**
    - **Setup:** Verdeckte Daten in Zustand vor und nach Effekt.
    - **Test:** Reconnect + Undo-Preview nacheinander auslesen.
    - **Erwartung:** Keine Änderung der Redaction zwischen Schritten.

21. **TC-195-21 – PublicEvents ohne interne Modifier-Deltas**
    - **Setup:** Verbundenes Logging-Event nach Modifier-Anwendung.
    - **Test:** Event-Felder vergleichen mit Redaction-Gate.
    - **Erwartung:** Nur erlaubte Werte, keine Deck-/Token-/Zonen-Leaks.

### 15.5 Replay / StateHash / Determinismus

22. **TC-195-22 – Deterministischer Replayvergleich**
    - **Setup:** Gleicher Seed, identische Sequenz mit 195-x Effektinterleaving.
    - **Test:** Replay durchspielen und Hashes vergleichen.
    - **Erwartung:** Durchgängige StateHash-Identität in allen Prüfpunkten.

23. **TC-195-23 – Reverse-Undo bei Persistenz**
    - **Setup:** Effekt-Kette mit mindestens zwei persist. Zuständen.
    - **Test:** Undo und Redo über vollständigen Stack.
    - **Erwartung:** StateHash folgt exakt definierter Undo/Redo-Korrektheit.

24. **TC-195-24 – Performance-Matrix für Modifier-Rekalkulation**
    - **Setup:** Worst-Case-Board mit vielen globalen Modellen und mindestens 30 aktiven Modifikatoren.
    - **Test:** Mehrfachdurchlauf pro Turn.
    - **Erwartung:** Keine Regression gegenüber V1.9.4-Baseline; Rekalkulationszeit im akzeptierten Envelope.

### 15.6 Karten-nahe Edge-Case-Tests (1.9.5-Kernfamilie)

Folgende Karten müssen jeweils mindestens ein Engine-Szenario + ein Server-View-Redaction-Szenario erhalten.  
Priorisierte Reihenfolge nach Risiko: `Diplomatic Immunity`, `Security Net Optimization`, `Priority Requisition`, `Data Masons`, `Preying Mantis`, `Main-Office Relocation`, `ACME Savings and Loan`, `Setup!`, `TRAP!`, `Black Ice Quality Assurance`, `Loan from Chiba`, `Information Laundering`.

25. **TC-195-25 – Kombination mehrerer statischer ICE-Modifikatoren**
   - **Karte:** `Diplomatic Immunity`, `Priority Requisition`, `Security Net Optimization`, `Data Masons`
   - **Erwartung:** Endgültiger ICE-Cost/Strength-Wert ist reproduzierbar und unabhängig von Ausführungsreihenfolge.

26. **TC-195-26 – Persistenzkette bei temporären/dauerhaften Effekten**
   - **Karte:** `Preying Mantis`, `Main-Office Relocation`, `ACME Savings and Loan`
   - **Erwartung:** Dauernde Zustände setzen korrekt, enden exakt am vorgesehenen Trigger.

27. **TC-195-27 – Asset/Node-Fähigkeit + globaler Modifier**
   - **Karte:** `Setup!`, `TRAP!`, `Information Laundering`
   - **Erwartung:** Globaler Effekt wird erst nach Revalidierung korrekt in Choice-/Trigger-Flow übernommen.

28. **TC-195-28 – Edge bei Host/Uninstall**
   - **Karte:** `Black Ice Quality Assurance`, `Corporate Boon`
   - **Erwartung:** Entfernen/Uninstall/Destroy führt zu sauberer Effektentfernung ohne Nachwirkung.

29. **TC-195-29 – Multi-Interaktion mit Zugriffspfaden**
   - **Karte:** `EMERGENCY Self-Construct`, `Main-Office Relocation` (sinngemäß als Family-Smartness-Kandidaten)
   - **Erwartung:** Aktivierungen in Folgeaktionen verändern die Basiswerte deterministisch, kein Zustandsverlust bei Reihenfolgeänderung.

30. **TC-195-30 – Legacy-Interferenzfälle**
   - **Karte:** `Encryption Breakthrough`, `Black Ice Quality Assurance`, `I Got a Rock`
   - **Erwartung:** Alte Implementierungen bleiben kompatibel; neue Layering-Logik ändert nur definierte Zielvariablen.

### 15.7 Server/API-Vertragsmatrix

31. **TC-195-31 – Manifest-Konsistenz für 1.9.5**
   - **Setup:** Vergleich `release manifest` vs. Implementation-Coverage.
   - **Test:** Alle geforderten IDs in `1.9.5`-Scope enthalten.
   - **Erwartung:** Keine fehlenden Pflichtkarten und keine unzulässigen Fremdeinträge.

32. **TC-195-32 – Apply-Akzeptanz auf API**
   - **Setup:** Gleiches action-Datensatz mit Varianten.
   - **Test:** `applyAction` akzeptiert nur legal/consistent.
   - **Erwartung:** Alle Illegal-State-Varianten werden mit sauberer Rejection beantwortet.

33. **TC-195-33 – Redaction-Contract**
   - **Setup:** API liefert Reconnect/Replay/Undo-Payload.
   - **Test:** automatisierte Feld-Prüfung auf verdeckte Felder.
   - **Erwartung:** Keine verdeckten Karten-/Token/Deckfelder an falsche Rollen.

### 15.8 CI/Local Checkliste (konkret)

1. `pnpm`-/`corepack`-Build/Tests auf Workspace und betroffene Packages
2. Engine-Testpaket: Modifier-Layer, Persistenz-Lifecycle, Choice/Trigger, Undo-Preview, StateHash
3. Server-Paket: contract tests + schema tests + redaction tests
4. Web-Paket: Version-Label, Modifier-Anzeige-Konsistenz, Reconnect/Undo-Preview-Rendering
5. Integrationstest: 2 End-to-End-Szenarien mit Seed-Replay und Performance-Guard

### 15.9 Abbruchkriterien auf Test-Ebene

- Nichtdeterministische Ergebnisse trotz gleichem Seed/StateVersion
- Leaks bei mindestens einem redaction/visibility-Test
- Persistente Effekte ohne klare Expiry/Owner- oder `undo`-Rückkehr
- >10% Drift in erwarteter Worst-Case-Latenz bei Modifier-Neuberechnung
- Abweichung bei `1.9.5`-Manifest oder Cross-Release-Contract

## 16) Abschluss-Entscheidung V1.9.5

**V1.9.5 ist mit den oben stehenden Testblöcken und den harten Kriterien umsetzbar abgeschlossen, wenn:**

- Alle 33 Testfälle (Abschnitt 15) als `pass` dokumentiert sind,
- keine offenen kritischen offenen Fragen aus Abschnitt 11 verbleiben,
- Cross-Release-Handoff sauber mit `deferred/Carryover` dokumentiert ist.
