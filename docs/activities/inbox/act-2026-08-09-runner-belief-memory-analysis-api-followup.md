---
activityId: act-2026-08-09-runner-belief-memory-analysis-api-followup
status: inbox
kind: architecture
area: shared
priority: high
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-08-09
startedAt:
completedAt:
branch:
releaseTarget: ai-observability-hardening
blockedBy: []
resultArtifacts: []
checks: []
---

# Runner-Belief-Memory positionsgenau fortschreiben und über die Analyse-API prüfen

## Ziel

Rechtmäßig gewonnenes Runner-Wissen über verdeckte Corp-Karten soll über
Draws, verdeckte Installationen, Reveals, Rez, Access, Play, Score, Trash und
Discard hinweg side-sicher und positionsgenau fortgeschrieben werden. Sichere
Fakten, unbekannter Rest und mehrdeutige Kandidaten dürfen weder unnötig
vermischt noch als echte Hidden Info behandelt werden.

Dieselbe Activity erweitert die read-only Maintenance-Analyse-API um den
damaligen actor-sicheren Belief-/Memory-Stand einer KI-Entscheidung. Dadurch
werden die fachliche Fortschreibung und ihre Invalidation erstmals für ein
gespeichertes Match vollständig prüfbar. Die API liefert ausdrücklich nicht
die tatsächliche verdeckte Corp-Hand als vermeintliches Runner-Wissen.

## Kontext und Quellen

- Playtest-Match `match_17b23313d4697e86`, beendet am 09.08.2026.
- Das runnerseitige Analyse-Bundle enthält 163 Decisions, 163 Traces und 318
  Events. Kein einziger Trace enthält jedoch `hqHandMemory`,
  `rndTopFreshness`, `knownPositionMemory`, `hiddenRemoteCandidateMemory`,
  einen Belief-Snapshot oder ein Belief-Delta.
- Der Matchverlauf enthält belastbare Soll-Checkpoints:
  - Event 30: Runner accesst `Data Wall 2.0` in HQ.
  - Event 36: Corp installiert verdeckt ein ICE auf Remote 1.
  - Event 43: `Data Wall 2.0` wird auf Remote 1 rezzed.
  - Event 49: Runner accesst `Cortical Scrub` in HQ.
  - Event 59: Runner accesst `Systematic Layoffs` in HQ.
  - Event 72: Corp installiert verdeckt ein ICE vor HQ.
  - Event 79: Runner accesst erneut `Systematic Layoffs` in HQ.
  - Event 90: `Cortical Scrub` wird vor HQ rezzed.
  - Event 165: Corp beendet einen verdeckten Discard mit `discardCount: 1`.
  - Event 66/67: `Marine Arcology` wird auf R&D accessed und gestohlen; die
    bekannte R&D-Spitze ist damit entfernt.
- Die side-sicheren Hidden-Install-Events liefern `installPlacement` und
  `serverLabel`, aber für Remote-Installationen weder ein strukturiertes
  `serverId` noch `installedPositionKey`. Die zugehörigen Rez-Events enthalten
  ebenfalls keinen stabilen Positionsschlüssel.
- Der Current-State-Classifier akzeptiert einen bloßen Remote-Servernamen bei
  Install-/Rez-Ereignissen nicht als Positionsursprung. Eine auf Remote 1
  erzeugte HQ-Kandidatengruppe kann deshalb nicht belastbar mit dem späteren
  Data-Wall-Rez derselben Position abgeglichen werden.
- Ein unbekannter Corp-Discard leert im Current State sämtliche sicheren
  HQ-Einträge und Kandidatengruppen. Das ist side-sicher, aber gröber als ein
  Ledger, das den unbekannten Abgang als Unsicherheit fortschreiben kann.
- Fachlicher Zielvertrag:
  `docs/architecture/ai/hq-hand-memory-contract-matrix-2026-06-07.md`.
- Dieses Paket ist ein Follow-up zu bereits erledigten Activities:
  - `act-2026-06-07-ai-hq-memory-ledger-foundation`;
  - `act-2026-06-07-ai-hq-hidden-install-candidates`;
  - `act-2026-06-07-ai-hq-candidate-reconciliation`;
  - `act-2026-06-07-ai-hq-memory-debug-surface`.
- Die früheren Pakete werden nicht rückwirkend umgedeutet. Der Matchfund
  belegt eine Live-Event-/Persistenzlücke außerhalb ihrer damaligen
  fokussierten Abnahme.

## Scope

### Teil A: Side-sichere Memory-Fortschreibung

- Den öffentlichen, actor-sicheren Ereignisvertrag für verdeckte
  Installationen und spätere Positionsauflösungen vervollständigen.
- Mindestens diese strukturierten Felder an allen zusammengehörigen
  Ereignisfamilien konsistent bereitstellen:
  - kanonisches `serverId`;
  - `installPlacement` als `ice` oder `root`;
  - stabiler öffentlicher `installedPositionKey` beziehungsweise ein
    gleichwertiger typisierter Positionsanker;
  - öffentliches Quell-/Folgeevent zur Reconciliation.
- Die Felder für Install, Rez, Reveal, Expose, Access, Trash, Steal, Score und
  sonstige Positionsabgänge aus derselben Engine-Autorität projizieren. Ein
  UI-Label darf nicht als nachträglich geparste Fachautorität dienen.
- `hqHandMemory` und `hiddenRemoteCandidateMemory` auf denselben
  positionsgebundenen Kandidatenvertrag stellen:
  - bekannte, eindeutig nicht installierbare Definitionen bleiben sicher;
  - plausible bekannte Definitionen und unbekannte Karten bilden eine
    count-sichere Kandidatengruppe;
  - spätere Offenbarung derselben Position schließt genau diese Gruppe;
  - Duplikate und mehrere Installationen auf demselben Server werden nicht
    nur anhand von Server und Definition verwechselt.
- `knownPositionMemory` mit demselben Positionsanker fortschreiben und bei
  Move, Trash, Steal, Score, Derezzing oder Zonenwechsel korrekt revalidieren.
- `rndTopFreshness` beim Access sowie bei Steal, Trash, Draw, Shuffle,
  Reorder und Swap aus derselben sichtbaren Eventfolge fortschreiben.
- Unbekannte HQ-Discards differenziert behandeln:
  - sichere Identitäten nicht ohne Beleg als weiterhin sicher behaupten;
  - unbekannten Abgang, sichere Definitionen und Kandidaten als passende
    Mehrdeutigkeit beziehungsweise Invalidation ausdrücken;
  - Total-Reset nur verwenden, wenn die verbleibende side-sichere Information
    tatsächlich keine engere Aussage erlaubt;
  - den konkreten Reduktionsgrund im Ledger ausweisen.
- Die Matchsequenzen Data Wall, Cortical Scrub, Systematic Layoffs und Marine
  Arcology als fokussierte Regressionsträger verwenden.

### Teil B: Read-only Analyse-API für historischen Belief State

- Den actor-sicheren Belief-/Memory-Debugstand zum Zeitpunkt einer
  KI-Entscheidung zusammen mit eindeutiger Provenance capture-fähig machen.
- Für neue gespeicherte Entscheidungen mindestens persistieren oder
  revisionssicher referenzieren:
  - Belief-Schema-/Runtime-Version und Invariant-Signatur;
  - zugrunde liegende `stateVersion` und letzter verwendeter Eventindex;
  - `hqHandMemory` mit Handcount, sicheren Definition-Counts,
    `unknownRestCount`, Kandidatengruppen, Quell-Events und
    Invalidation-/Reconciliation-Gründen;
  - `rndTopFreshness` einschließlich rechtmäßig bekannter Definition,
    Frischezustand und Invalidation;
  - `knownPositionMemory` und `hiddenRemoteCandidateMemory` mit ausschließlich
    öffentlichen Positionsreferenzen;
  - optional ein kleines Delta zur vorherigen Decision derselben KI-Seite.
- Den Belief-Stand im Decision-Analyse-Endpunkt anbieten:
  `GET /api/storage/maintenance/analysis/matches/:matchId/decisions/:decisionIndex`.
- Das Bundle um eine explizite, standardmäßig begrenzbare Belief-Sektion oder
  einen Parameter wie `includeBeliefState` erweitern. Für einen
  longitudinalen Audit müssen Decision-Index, Belief-Signatur, kompakter
  Summary und Delta ohne 163 einzelne Detailrequests verfügbar sein.
- Provenance strikt unterscheiden:
  - `persisted`: exakt der bei der historischen Entscheidung verwendete
    actor-sichere Stand;
  - `reconstructed`: mit aktueller Runtime aus einem hash-verifizierten
    historischen actor-sicheren Snapshot neu abgeleitet.
- Rekonstruktion darf einen fehlenden historischen Capture nicht still als
  damalige Wahrheit ausgeben. Fehlt beides, meldet
  `diagnostics.unavailableSections` ausdrücklich `beliefState` samt Grund.
- Bestehende Filter `turn`, `side`, `fromDecision` und `toDecision` auch auf
  die Belief-Sektion anwenden und Payloadgröße begrenzen.
- Maintenance-API-Tests belegen Redaction, Match-/Decision-Bindung,
  Hash-/Provenance-Vertrag und konsistente Bundle-/Detailwerte.

## Nicht im Scope

- Keine Ausgabe der tatsächlichen verdeckten Corp-Hand, Deckreihenfolge,
  Karteninstanz-IDs oder sonstiger FullGameState-Wahrheit als Runner-Wissen.
- Kein Datenbank-, Replay- oder Storage-Direktzugriff für die Spielanalyse.
- Keine nachträgliche Reparatur oder erfundene Belief-Historie für alte
  Matches, deren damaliger Stand weder persistiert noch hash-verifiziert
  rekonstruierbar ist. NETGRID V0 benötigt keinen Legacy-Adapter.
- Keine probabilistische Belief-World-Simulation und keine Nutzung der
  gegnerischen Deckliste zur Vervollständigung unbekannter Karten.
- Keine strategische Neubewertung aller Runs, Remotes oder Access-Ziele. Das
  Paket korrigiert Fakten, Unsicherheit, Position und Diagnoseevidence.
- Keine Änderung der Regeln für Draw, Install, Rez, Access, Trash, Steal,
  Score oder Discard.
- Keine Parse-Heuristik aus `actionId`, freiem Labeltext oder Kartennamen als
  Ersatz für strukturierte Engine-Felder.
- Keine Erweiterung normaler PlayerViews, öffentlicher Replays oder normaler
  WebSocket-/Reconnect-Payloads um privilegierte Diagnosefelder.

## Akzeptanzkriterien

- [ ] Verdeckte Remote- und Central-Installationen tragen in side-sicheren
      PublicEvents einen kanonischen Server- und stabilen Positionsanker, der
      bei späteren Reveal-/Rez-/Access-/Abgangsereignissen identisch gebunden
      werden kann.
- [ ] Die Felder enthalten keine verdeckte Definition oder Instanzidentität
      und verändern keine LegalAction- oder Regelautorität.
- [ ] Mehrere verdeckte Karten auf demselben Server werden positionsgenau und
      count-sicher unterschieden.
- [ ] Nach HQ-Access von Data Wall, verdecktem Remote-1-ICE-Install und
      späterem Data-Wall-Rez wird die richtige Kandidatengruppe geschlossen;
      kein Phantomkandidat bleibt bestehen.
- [ ] Nach den HQ-Accesses von Cortical Scrub und Systematic Layoffs bleibt
      Systematic Layoffs bei einem verdeckten ICE-Install sicher
      nicht-installierbar, während Cortical korrekt Kandidat wird und beim Rez
      abgeglichen wird.
- [ ] Der wiederholte Systematic-Layoffs-Access bestätigt denselben
      side-sicheren Ledgerstand statt einen Widerspruch oder Total-Reset zu
      erzeugen.
- [ ] Ein unbekannter Corp-Discard erzeugt eine logisch korrekte
      Mehrdeutigkeit beziehungsweise begründete Invalidation; er erhält keine
      unbewiesene sichere Karte und löscht nicht mehr Information als nötig.
- [ ] R&D-Access und anschließender Steal von Marine Arcology entfernen die
      bekannte Spitze; die nächste unbekannte Karte wird nicht erfunden.
- [ ] Decision-Detail liefert für eine capture-fähige historische Decision
      den actor-sicheren Belief-Snapshot mit Schema, Signatur, Event-Cutoff und
      eindeutiger Provenance.
- [ ] Bundle-Analyse kann den Belief-Verlauf für einen gefilterten
      Decision-Bereich kompakt als Signaturen, Summaries und Deltas liefern.
- [ ] Bundle- und Detaildarstellung desselben historischen Checkpoints stimmen
      in Signatur, Counts, Quellen und Invalidation überein.
- [ ] Bei fehlendem Capture und fehlender hash-verifizierter Rekonstruktion
      erscheint eine strukturierte `beliefState`-Lücke; es gibt keinen
      Fallback auf aktuelle Match-, Datenbank- oder FullState-Wahrheit.
- [ ] Redaction-Tests verbieten gegnerische Handkarten, nicht gesehene
      Definitionen, `cardInstances`, `privatePayload`, Decklisten,
      Session-/Reconnect-Tokens und FullGameState-Felder.
- [ ] Reconnect, Replay, Undo und StateHash bleiben deterministisch; ein
      zurückgerolltes Wissensereignis verschwindet auch aus Memory und
      Analyse-API.
- [ ] Fokussierte Engine-PublicEvent-, AI-Belief-, Server-Analyse-API- und
      Redaction-Tests, erforderliche Package-Typechecks sowie
      `git diff --check` sind grün.

## Umsetzungshinweise

- Vor Änderungen an KI-Verhalten den verbindlichen AI-Architektur-Preflight
  aus `AGENTS.md` vollständig ausführen.
- Zuerst den gemeinsamen strukturierten Positionsvertrag zwischen Engine,
  PublicEvent und AIInput schließen. Eine API-Darstellung eines bereits
  ungebundenen Kandidaten kann die fachliche Ursache nicht reparieren.
- Danach die Belief-Reconciliation und Discard-Reduktion gegen die
  Matchsequenzen prüfen. Erst der fachlich korrekte actor-sichere Stand wird
  in Trace/Persistenz und Analyse-API transportiert.
- Die vorhandene DecisionDebug-Zusammenfassung wiederverwenden, aber für den
  historischen Audit um Schema, Signatur, Event-Cutoff, vollständige
  side-sichere Ledgercounts und Provenance ergänzen. Keine zweite
  Belief-Berechnung im Server einführen.
- Umfangreiche Belief-Daten im Bundle opt-in und kompakt halten; der
  Detailendpunkt darf den vollständigen actor-sicheren Snapshot liefern.
- Das Match bleibt Analyse-Evidence. Regressionen werden aus API-gelieferten,
  capture-fähigen Zuständen oder kleinen fokussierten Fixtures erzeugt, nie
  aus direktem SQLite-Zugriff.

## Ergebnisnotiz

Noch offen. Das Paket verbindet den belegten Live-Positionsverlust mit der
fehlenden historischen Diagnosefläche, damit Korrektur und Nachweis nicht
erneut auseinanderfallen.
