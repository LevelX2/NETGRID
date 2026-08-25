# KI-Entscheidungslog-Vertrag

Status: Architekturvertrag, 2026-08-20.

Dieser Vertrag beschreibt, wie NETGRID KI-Entscheidungen lokal nachvollziehbar macht, ohne die bestehenden Engine-, Replay-, Hidden-Info- und Observability-Grenzen aufzuweichen. Er gibt keine Karten frei und ändert keine Regelentscheidung.

## Ziel

NETGRID darf für lokale private Analyse ein KI-Entscheidungslog speichern und anzeigen. Dieses Log beantwortet: Welche KI hat wann welche legale Aktion gewählt, welche sichtbaren Gründe und Hypothesen wurden bewertet, welche Alternativen lagen nahe, und welche Unsicherheiten blieben offen.

Das Log ist Diagnosematerial. Es ist kein Teil von `AIInput`, FullState, Engine-State, Public Replay, normaler Spiel-UI, Moderationsansicht oder Standard-Observability.

## Bestehende Grenzen

- `packages/shared/src/index.ts` definiert `AiDecisionDebug`, `AI_DECISION_DEBUG_SCHEMA_VERSION` und `sanitizeAiDecisionDebug`.
- `apps/server/src/multiplayer.ts` projiziert `aiDecisionDebug` bereits nur sanitisiert und perspektivabhängig in Replay-Daten.
- `docs/releases/v2/v2-7-observability/observability-redaction-baseline.md` verbietet `DecisionDebug` in normalen Logs und Metriken.
- `docs/releases/v2/v2-6-moderation/evidence-rbac-contract.md` klassifiziert `AIInput` und `DecisionDebug` als `D6_ai_debug_data`, nicht als Standardzugriff.

Diese Grenzen bleiben führend. Neue Trace-Felder dürfen sie nur konkretisieren, nicht umgehen.

## Datenklassifikation und Zugriff

`AiDecisionTrace` ist lokale private Wartungs- und Analysedatenklasse `D6_ai_debug_data`.

Erlaubter Zugriff:

- lokale Maintenance- oder Diagnoseansicht für den Betreiber;
- lokaler Export, wenn der Match explizit für KI-Trace aktiviert war;
- Live-Follow für aktivierte lokale Matches.

Nicht erlaubter Zugriff:

- normale Spieleransicht;
- Public Replay;
- Standard-Replay-Perspektiven außer expliziter `local_analysis`;
- Moderations- oder Sanktionsautomatik;
- normale Serverlogs, Errorlogs, Analytics, Metriken oder Telemetrie;
- Remote-Support oder Cloud-Sync ohne eigenes späteres Sicherheits- und Rechtsgate.

## Aktivierungsmodell

KI-Trace ist standardmäßig aus.

Aktivierung ist nur pro Match erlaubt, über eine lokale Maintenance- oder Diagnoseeinstellung. Sie muss nicht zwingend beim Matchstart erfolgen: Für laufende KI-Matches darf die lokale Wartungsansicht KI-Tracing ab jetzt aktivieren. Die Aktivierung muss aber vor der jeweiligen KI-Entscheidung wirksam sein. Nachträgliche Rekonstruktion vergangener Detailentscheidungen aus FullState, `AIInput` oder privaten Payloads ist verboten.

Ein aktivierter Match speichert im Match-Metadatum mindestens:

- `aiTraceEnabled: true`;
- Zeitpunkt und lokale Quelle der Aktivierung;
- Trace-Schema-Version;
- Hinweis, ob Live-Follow und Export erlaubt sind.

Deaktivierung stoppt neue Trace-Einträge. Vorhandene lokale Trace-Einträge bleiben bis zur lokalen Löschung erhalten.

## Schema-Version

Zielobjekt: `AiDecisionTrace`.

Schema-Version: `ai-decision-trace-v1`.

Das bestehende `AiDecisionDebug` bleibt der sanitizable Debug-Kern für Replay-Projektionen. `AiDecisionTrace` ist das Persistenz- und Analyseformat. Es darf `AiDecisionDebug`-Felder übernehmen, aber nie als unkontrollierter Dump von KI-Input, Planner-Interna oder FullState behandelt werden.

Jeder Trace-Eintrag enthält genau eine KI-Entscheidung und ist append-only. Korrekturen erfolgen durch neue Diagnose- oder Migrationsversionen, nicht durch stilles Überschreiben historischer Entscheidungsdaten.

## Persistenzform

Die Datenbank speichert strukturierte Spalten und JSON. Sie speichert kein HTML, kein Markdown-Rendering und keine bereits formatierte Wartungsansicht.

Empfohlene Spalten:

- `traceId`;
- `matchId`;
- `matchVersion`;
- `stateVersion`;
- `turn`;
- `side`;
- `createdAt`;
- `schemaVersion`;
- `aiLevel`;
- `profileId`;
- `decisionActionId`;
- `decisionActionType`;
- `confidence`;
- `fallbackUsed`;
- `timeoutUsed`;
- `traceJson`.

`traceJson` enthält nur das versionierte Schema. Anzeige-ViewModels werden serverseitig daraus abgeleitet. HTML entsteht erst im Webclient oder in der lokalen Maintenance-Ansicht.

Die Entscheidungskette nutzt denselben Persistenzvertrag. Bei
`aiTraceMode: summary` enthält `traceJson.decisionChain` die kompakte
`traceLevel: summary`-Projektion; bei `aiTraceMode: detailed` enthält derselbe
Schlüssel die vollständige sanitizierte `AiDecisionChainDebug` mit
`traceLevel: detailed`. Es gibt dafür keine weitere Tabelle oder Logdatei.
Die genaue Feldabgrenzung führt
`semantic-decision-chain-observability-contract-2026-07-14.md`.

## Metaebene

Die Metaebene ist die Standardansicht pro Entscheidung. Sie muss ohne Drilldown verständlich sein und darf keine verdeckten Details preisgeben.

Erlaubte Meta-Felder:

- `traceId`, `matchId`, `matchVersion`, `stateVersion`, `turn`, `side`;
- `schemaVersion`, `aiLevel`, `profileId`, `planId`, `planKind`, `selectedActionType`;
- gewählte `actionId`, sofern diese aus LegalActions stammt;
- `score`, `confidence`, `fallbackUsed`, `timeoutUsed`, `timeBudgetMs`;
- kurze sichtbare Gründe aus `visibleReasons`;
- kurze Unsicherheiten aus `uncertainty` oder `beliefUncertainty`;
- `memoryVersion`;
- Hinweis, ob Details, Export oder Live-Follow für diesen Eintrag verfügbar sind.

Meta-Felder werden begrenzt, sortiert und als Labels oder kurze Listen dargestellt. Lange JSON-Strukturen gehören nicht in die Metaebene.

## Detailansicht

Details sind Drilldown. Sie dürfen nur nach explizitem Aufklappen geladen oder gerendert werden.

Erlaubte Detail-Felder:

- sichtbare Fakten, die aus der aktuellen PlayerView oder LegalActions ableitbar sind;
- Hypothesen als Hypothesen markiert, nicht als bestätigte Fakten;
- Unsicherheiten und Invalidierungen;
- Bewertungsgründe und Evidence-Labels;
- eigene Deck-Doctrine-Zusammenfassung ohne Deckliste;
- Gegner-Modell als abstrakte, sanitisierte Labels oder Wahrscheinlichkeiten;
- Top-Alternativen mit Ranking, Score, Confidence, Reason-Codes und legaler Action-Referenz;
- bei planintern konkurrierenden Run-Routen den side-sicher berechneten
  Routenrohwert, den Opportunitätswert einer verbrauchbaren Run-Karte und den
  daraus resultierenden effektiven Routenwert;
- Timing- und Fallback-Hinweise.

Diese Run-Routenwerte werden in `actionAlternatives` als `score` und
`scoreBreakdown` gespeichert. Damit sind sie über denselben lokalen
Maintenance-Detailendpunkt abrufbar und bleiben auch historisch prüfbar. Es
entsteht dafür weder eine zweite Tabelle noch ein nachträglicher
Rekonstruktionspfad aus FullState oder Hidden-Zonen.

Für eine Engine-randomisierte Blind-Trace-Resolution darf die private
Detailansicht zusätzlich Regelprofil, gedruckten Trace, effektives Limit,
aktuellen Link, side-sicher sichtbare aggregierte gegnerische Bid-Kapazität,
legale Bid-Range, rationale Range, Stakes, Behavioral Bias,
gewichtete Kandidaten, ausgewählten Bid, Plan-Step und den zugehörigen
`RandomDrawRecord`-Verweis enthalten. Noch verdeckte Gegengebote und konkrete
gegnerische Payment-Quellen sind auch hier keine side-sicheren AI-Fakten; sie
dürfen erst nach dem Engine-Reveal als Ergebnis erscheinen. Normale Replay-
und Spielerflächen erhalten diese Bewertungs- und RNG-Details nicht.

Die Detailansicht unterscheidet mindestens:

- `visibleFact`: sichtbarer oder aus LegalActions ableitbarer Fakt;
- `hypothesis`: Annahme der KI;
- `uncertainty`: bekannte Unsicherheit;
- `evaluationReason`: Bewertungsgrund;
- `safetyRedaction`: redigierte oder bewusst ausgelassene Information.

### Decision-Episode-Vertrag

Eine detailliert gespeicherte Plan-first-Entscheidung führt den exakten
`executionOrigin` des ausführenden Producers. Er bindet Root- und
Leaf-Planinstanz, optionales Turn-Commitment, Side, Fensterart, Fenster-ID,
StateVersion und Timingpunkt. Der Server darf diese Bindung weder aus
Evidence-Strings noch aus späteren Zuständen rekonstruieren.

`selectedStep` bindet zusätzlich die tatsächlich ausgeführte Route an
Planinstanz und Step sowie – sofern vorhanden – ParentInstanceId, NeedId und
SupportAssignmentId. Bei einem ausgewählten Start-Run persistiert
`selectedRunQuote` dessen eigene Pfad-, Credit-, Reserve-, Release- und
Risikodaten. Die Quote einer abgelehnten Alternative darf die ausgewählte
Quote nicht vertreten.

Für aktive Corp-Score-/Remote-Roots weist die private Plan-first-Diagnose
zusätzlich den Liveness-Beleg aus: blockierter Root, Blocker, Need-ID,
Provider-Instanz und dessen aktueller Head oder die typisierte Waiting
Condition. Bei einer ausgeführten Support- oder Economy-Aktion werden der
Need vor und nach der Aktion sowie `parentProgress` gespeichert. Eine bloße
Credit-Erhöhung oder ausgeführte Action darf nicht als Parentfortschritt
erscheinen, wenn der gebundene Need unverändert bleibt. Replan, Retarget und
Abandon führen ihren strukturierten Grund; Economy-Ziele führen ihre
fachliche Demand-Quelle. Diese Daten stammen aus Planning Head, Parent-/Need-
Bindung und aktuellem Assessment, nicht aus nachträglicher Rekonstruktion.

Die übrigen Episodendaten werden nicht in einer zweiten Parallelstruktur
dupliziert. Ihre autoritativen Fundstellen sind:

- residente Planinstanzen und ihre Parent-/Need-Bindungen im gespeicherten
  Runtime-Checkpoint;
- Planning Heads, `ResourceGaps`, ausgewählte und abgelehnte Turnlinien sowie
  Continuation-Status in `planFirstDecision.turnPlanning`;
- spätere Run-Fortsetzungen und Risikoneubewertungen in den typisierten
  Planinstanz-/Runner-Runplan-Daten des Runtime-Checkpoints;
- der zum Entscheidungszeitpunkt sichtbare Zustand in der separaten
  `analysisSnapshot`.

Fehlt eine dieser Producer-Strukturen, weist die Analyse das Feld als nicht
gespeichert aus. Eine nachträgliche Schätzung ist unzulässig.

### Kompakter Checkpoint-Input

`checkpointCapture` speichert keinen vollständigen `AIInput`. Zulässig ist
nur eine explizite `inputProjection` mit Side-, StateVersion-, Timingpunkt-
und ActionNumber-Bindung sowie den drei bereits freigegebenen kompakten
Deck-Consumer-Diagnosen. PlayerView, LegalActions und PublicEvents werden
nicht darin dupliziert: Der sichtbare Zustand liegt in `analysisSnapshot`,
die historischen legalen Angebote im LegalAction-Audit.

### Fehlversuche vor und während der Engine-Anwendung

Ein fail-closed abgebrochener KI-Schritt bleibt als privater
`ai-decision-failure-attempt-v1`-Eintrag analysierbar. Scheitert bereits die
Planwahl, bindet der Eintrag Phase `choose`, aktuellen LegalAction-Satz,
Checkpoint und strukturierten Planfehler. Lehnt die Engine eine zuvor von ihr
angebotene und von der KI ausgewählte LegalAction ab, bindet Phase `apply`
zusätzlich deren exakte Action-ID und Action-Art sowie den strukturierten,
begrenzten Engine-Fehler ohne Stacktrace. Das historische Engine-Audit führt
diesen Fall als `rejected`; Zustand und Eventlog bleiben unverändert.

Die öffentliche Matchantwort erhält nur den side-sicheren Fehlercode und
einen opaken `diagnosticCode`. Konkrete Engine-Fehlermeldung, ausgewählte
Payload und Failure-Detail bleiben ausschließlich in der lokalen privaten
Maintenance-Analyse und dürfen nicht in Spieleransichten, Public Replays oder
normale Logs gelangen.

## Export

Export ist optional und nur lokal erlaubt. Er darf dieselben strukturierten Felder wie Meta- und Detailansicht enthalten, plus technische Diagnosefelder:

- Trace-Schema-Version;
- AI-Debug-Schema-Version, falls ein Debug-Kern eingebettet ist;
- Sanitizer-Version oder Redaction-Policy-Version;
- Hashes von Action- oder State-Referenzen, wenn sie keine verdeckten Rohdaten offenlegen;
- lokale Exportzeit;
- Hinweis, dass der Export `D6_ai_debug_data` enthält.

Export darf kein HTML aus der Wartungsansicht speichern. Exportformate sind strukturierte JSON-Dateien oder tabellarische Zusammenfassungen aus ViewModels.

## Live-Follow

Live-Follow ist eine lokale Anzeige über denselben ViewModel-Vertrag wie die historische Detailansicht. Es darf keinen eigenen Datenpfad mit großzügigeren Feldern geben.

Live-Follow zeigt zuerst Metaeinträge und lädt Details nur auf Drilldown. Es darf keine Daten in normale WebSocket-Spielpayloads mischen. Zulässig ist nur ein lokaler Maintenance-Kanal für aktivierte Matches.

## Verbote

`AiDecisionTrace`, ViewModels, Export und Live-Follow dürfen folgende Daten weder speichern noch anzeigen noch in Logs spiegeln:

- FullState, `fullGameState`, Engine-State-Dumps;
- `AIInput` oder vollständige Planner-Eingaben;
- `privatePayload`;
- `cardInstances`;
- `privateDeckSnapshots`;
- Decklisten, Deckinhalte, `deckHash`, `cloudDeckId`, fremde Hand-, R&D-, HQ-, Stack- oder Archiv-Inhalte;
- verdeckte Kartenidentitäten, Hidden-Card-IDs oder indirekte Hidden-Info-Zähler, die nicht ohnehin legal sichtbar sind;
- Session-, Reconnect-, Join-, Invite-, Recovery- oder Account-Tokens sowie Token-Hashes;
- lokale Dateipfade, absolute Projektpfade, Usernamen im Pfad oder Prozessumgebungen;
- Rohfehler mit Stacktraces, die eines dieser Felder enthalten könnten.

Verbotene Felder werden nicht nur im Rendering ausgeblendet. Sie dürfen nicht persistiert werden. Sanitizer sind ein Schutznetz, nicht die primäre Erlaubnisquelle.

## Rendering-Vertrag

Die Architektur trennt drei Schichten:

1. Persistenz: strukturierte Spalten und `traceJson`.
2. Backend-ViewModel: bereits sanitizte Meta-, Detail-, Export- und Live-Follow-DTOs.
3. HTML/UI: reine Darstellung des ViewModels in der lokalen Maintenance-Ansicht.

Der Webclient rendert keine Rohdaten aus `traceJson`. Er erhält ViewModels, deren Felder bereits klassifiziert, begrenzt und redigiert sind.

## Folgepakete

Aus diesem Vertrag folgen getrennte Arbeitspakete:

- Trace-Schema und Top-Alternativen im Shared-/AI-Vertrag ergänzen.
- SQLite-Storage und lokale Maintenance-API für aktivierte Matches bauen.
- Maintenance-Viewer mit Meta-erst-Drilldown-Ansicht bauen.
- Live-Follow und Export über dieselben ViewModels anbinden.
- Redaction-, Zugriff- und Nicht-Leak-Tests für Trace, API, Viewer, Export und normale Logs ergänzen.
