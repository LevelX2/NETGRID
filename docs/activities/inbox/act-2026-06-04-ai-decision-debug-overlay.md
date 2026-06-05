---
activityId: act-2026-06-04-ai-decision-debug-overlay
status: inbox
kind: concept
area: ai
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-06-04
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Schwebendes KI-Entscheidungsfenster für Action-Scores

## Ziel

Für lokale Debug- und Playtest-Zwecke soll im aktiven Spiel optional ein schwebendes Fenster sichtbar machen, welche LegalActions die KI gerade bewertet hat, welche Aktion gewählt wurde, welche Alternativen wie hoch gerankt waren und welche Score-/Plan-/Doctrine-Beiträge die Bewertung beeinflusst haben.

## Kontext und Quellen

- Nutzeridee vom 2026-06-04: optionales schwebendes Fenster über eine Einstellung, das KI-Aktionsauswahl und Bewertungshöhen transparent macht.
- `docs/codex/CODEX_STATUS.md`: Das schwebende normale Aktionsfenster ist bereits als lokale Komfortoption umgesetzt.
- `docs/reviews/ai/semantic-ai-runtime-cutover-2026-06-04.md`: Die Semantic Runtime ist in der privaten Version-0-Instanz default aktiv; Legacy bleibt Fallback/Notaus.
- `docs/reviews/ai/semantic-ai-meta13-meta18-progress-2026-06-04.json`: Semantic Default ist aktiv, aber Full Production und Legacy Removal bleiben nicht bereit.
- `docs/activities/done/act-2026-05-17-decisiondebug-schema-redaction-snapshots.md`: `DecisionDebug` ist side-sicher versioniert und redigiert.
- Bestehende technische Anker:
  - `packages/shared/src/index.ts` mit `AiDecisionDebug`, `actionAlternatives`, `scoreBreakdown`, `ownDeckDoctrine` und Sanitizer.
  - `apps/server/src/multiplayer.ts` mit `aiDecisionTraceJson`.
  - `apps/web/app/maintenance/ai-traces/page.tsx` und `apps/web/app/maintenance.ts` mit redigierter Maintenance-KI-Trace-Ansicht.
  - `apps/web/app/page.tsx` mit `actionPanelMode` und `LegalActionsPanel`.

## Scope

- Eine lokale Gameplay-Option ergänzen, z. B. `KI-Bewertungsfenster anzeigen`, default aus und persistent im bestehenden Gameplay-Settings-Key.
- Ein schwebendes, verschiebbares In-Game-Fenster für Human-vs-KI- und KI-vs-Human-Debugsituationen ergänzen.
- Das Fenster zeigt maximal die aktuelle oder zuletzt abgeschlossene KI-Entscheidung:
  - Seite und Zeitpunkt der Entscheidung,
  - gewählte Aktion,
  - Top-Alternativen aus vorhandenen `LegalActions`,
  - numerische Scores oder Prioritäten, soweit sie im side-sicheren Debugvertrag vorhanden sind,
  - `scoreBreakdown`, `visibleReasons`, `whyNot`, `longTermPlan`, `planKind`, `doctrinePlanWeight` und eigene `ownDeckDoctrine` nur in redigierter Form,
  - klar erkennbare Fallback-/Timeout-/Unsicherheitsmarker.
- Bestehende Maintenance-Trace-Projektion oder vorhandene side-sichere `DecisionDebug`-Daten wiederverwenden, statt einen parallelen Rohdebug-Kanal zu erfinden.
- Wenn der aktuelle Semantic-Livepfad noch nicht genug Score-Komponenten liefert, nur die vorhandenen Felder anzeigen und die fehlenden Plan-/Score-Beiträge als konkreten Folgepunkt dokumentieren.
- UI so gestalten, dass sie Debugdaten scanbar macht, ohne das normale Aktionsfenster, Run-Fenster oder Ergebnisfenster zu verdecken.

## Nicht im Scope

- Keine Änderung an LegalAction-Erzeugung, `applyAction`, Engine-Regeln, Replay, StateHash oder Randomness.
- Keine neue KI-Strategie, keine Score-Neugewichtung und keine Planner-/Doctrine-Änderung außer notwendiger redigierter Debug-Projektion.
- Keine Offenlegung von FullState, gegnerischen Hidden-Zonen, gegnerischen Decklisten, privaten Payloads, Roh-`AIInput`, Tokens, lokalen Pfaden oder unredigiertem `DecisionDebug`.
- Keine Public-, Spectator-, Replay- oder Moderationsfreigabe dieses Fensters.
- Keine Bedienung der KI über das Fenster und keine Möglichkeit, KI-Aktionen dort zu überschreiben.
- Keine Persistenz der Debugdaten außerhalb der bestehenden lokalen Trace-/Maintenance-Verträge.

## Akzeptanzkriterien

- [ ] Die Option ist default aus, lokal persistiert und in den bestehenden Optionen auffindbar.
- [ ] Bei aktivierter Option erscheint im aktiven Spiel ein schwebendes KI-Bewertungsfenster mit der letzten KI-Entscheidung und einer Top-N-Liste bewerteter Alternativen.
- [ ] Gewählte Aktion, Score/Priorität, Gründe, `whyNot` und Plan-/Doctrine-Beiträge werden nur aus side-sicheren, sanitisierten Debugdaten angezeigt.
- [ ] Wenn Score- oder Plananteile fehlen, zeigt die UI keine erfundenen Werte; der fehlende Debugvertrag wird als Folgepunkt benannt.
- [ ] Das Fenster bleibt auf Desktop und schmalem Viewport bedienbar, ohne das normale Aktionsfenster dauerhaft zu überdecken.
- [ ] Redaction-Tests oder bestehende Forbidden-Marker-Checks beweisen, dass keine FullState-/Hidden-Info-/Token-/Decklisten-/`AIInput`-/unredigierten `DecisionDebug`-Marker im In-Game-Fenster landen.
- [ ] Passende Web-/Server-/AI-Checks sind ausgeführt oder begründet ausgelassen, mindestens Web-Typecheck und ein fokussierter UI-/Projection-Test, sobald Code geändert wird.

## Umsetzungshinweise

- Startpunkt ist keine neue Bewertungslogik, sondern die Anzeige vorhandener Debug-Evidence.
- Prüfen, ob die bestehende Maintenance-Trace-Aktivierung für das aktive Match genutzt werden kann oder ob die Live-Spieloberfläche eine eigene redigierte, kurzlebige Projektion der letzten KI-Entscheidung braucht.
- Für die UI die Muster des bestehenden schwebenden Aktionsfensters wiederverwenden: feste Maximalgröße, Drag-Position, schmaler Viewport, kein Layout-Shift.
- Bei der Darstellung Zahlen trennen:
  - Gesamtscore/Priorität,
  - Kostenabzug,
  - Semantic-Scope/Action-Type-Priorität,
  - Plan-/Doctrine-Gewicht,
  - harte Blocker oder `whyNot`.
- Die Planfrage des Nutzers explizit behandeln: Pläne und Doctrine sollen als eigene Score-Beiträge sichtbar sein, wenn sie tatsächlich in der Entscheidung verwendet wurden; diagnostische oder nicht produktive Pläne dürfen nur als Kontext/Debugstatus erscheinen, nicht als behaupteter Bewertungsbeitrag.
- Hidden-Info-Gate vor UI-Komfort: Bei Unsicherheit lieber weniger anzeigen und eine Folgeactivity für bessere redigierte Debug-Komponenten anlegen.

## Ergebnisnotiz

Noch offen.
