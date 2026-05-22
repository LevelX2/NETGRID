# KI-Entscheidungslog-Vertrag

Status: Architekturvertrag, 2026-05-22.

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

Aktivierung ist nur pro Match erlaubt, über eine erweiterte lokale Diagnoseoption oder eine lokale Maintenance-Einstellung. Die Aktivierung muss vor der jeweiligen KI-Entscheidung wirksam sein. Nachträgliche Rekonstruktion aus FullState, `AIInput` oder privaten Payloads ist verboten.

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
- Timing- und Fallback-Hinweise.

Die Detailansicht unterscheidet mindestens:

- `visibleFact`: sichtbarer oder aus LegalActions ableitbarer Fakt;
- `hypothesis`: Annahme der KI;
- `uncertainty`: bekannte Unsicherheit;
- `evaluationReason`: Bewertungsgrund;
- `safetyRedaction`: redigierte oder bewusst ausgelassene Information.

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
