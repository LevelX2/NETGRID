---
activityId: act-2026-06-02-damage-overlay-manual-confirmation
status: done
kind: fix
area: web
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-06-02
startedAt: 2026-06-03
completedAt: 2026-06-03
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/app/page.tsx
  - apps/web/app/damage-impact-overlay.test.ts
checks:
  - "PASS: pnpm exec vitest run apps/web/app/action-cues.test.ts apps/web/app/damage-impact-overlay.test.ts"
  - "PASS: pnpm --filter @netgrid/web typecheck"
  - "PASS: git diff --check"
---

# Damage-Overlay erst nach Bestätigung schließen

## Ziel

Die spezielle Damage-Anzeige für Runner-Schaden soll nicht automatisch ausblenden. Das Damage-Fenster soll stehen bleiben, bis die zuständige menschliche Sicht bewusst bestätigt und per `Weiter` oder vergleichbarer Aktion fortsetzt.

## Kontext und Quellen

- Nutzerfund vom 2026-06-02: Wenn dem Runner Damage zugefügt wird, gibt es inzwischen eine spezielle Damage-Anzeige; diese soll sich nicht automatisch schließen, sondern erst nach Bestätigung der Korp beziehungsweise der zuständigen menschlichen Sicht.
- Verwandte erledigte Activity: `docs/activities/done/act-2026-05-28-damage-impact-overlay.md`.
- Dortiger Stand: Damage-Resolutionen erzeugen öffentliche Runner-Grip-Counts vor/nach Damage; die Web-UI leitet deduplizierte Damage-Impact-Cues ab und zeigt ein Overlay mit Damage-Typ, Menge, abstraktem Grip-Balken, Flatline-Variante und Core-Damage-/Handlimit-Hinweisen.
- Der bestehende Hidden-Info-Vertrag bleibt führend: Das Overlay zeigt keine konkreten Grip-Karten, keine versteckten DefinitionIds, keine vor-Damage-Grip-Liste und keine nicht öffentlichen Kartentitel.

## Scope

- Aktuelles Auto-Ausblend-/Timeout-Verhalten des Damage-Impact-Overlays reproduzieren und lokalisieren.
- Damage-Overlay so anpassen, dass es bei menschlichen Spielern bis zur aktiven Bestätigung sichtbar bleibt.
- Die Bestätigungsrolle sauber prüfen:
  - Nutzerformulierung: Bestätigung durch die Korp, damit sie den Damage in Ruhe ansehen kann.
  - Falls die bestehende UI das Damage-Overlay seiten- oder perspektivenabhängig zeigt, explizit festlegen und testen, welche menschliche Sicht bestätigen muss.
- Button-/Textlabel für die Fortsetzung in deutscher UI-Sprache prüfen, bevorzugt `Weiter` oder ein bestehendes konsistentes Label.
- Sicherstellen, dass die Matchinteraktion während des offenen Damage-Overlays nicht unklar weiterläuft oder visuell überlagert wird.
- KI-/Bot-Seiten deterministisch behandeln: Wenn die bestätigende Sicht keine menschliche Seite ist, darf die Bestätigung automatisch erfolgen oder übersprungen werden, ohne Human-vs-Human zu entwerten.
- Reconnect- und EventTail-Deduplizierung aus dem ursprünglichen Paket erhalten: alte Damage-Events dürfen nicht mehrfach als neue Pflichtbestätigung stören.
- Fokussierte Web-/UI-Tests für manuelles Schließen, kein Timeout-Schließen und Reconnect-Dedupe ergänzen oder aktualisieren.

## Nicht im Scope

- Keine Neugestaltung der Damage-Overlay-Optik.
- Keine Änderung an Damage-Regeln, Prevention-/Avoid-Fenstern, Flatline-Logik oder Handlimit-/Core-Damage-Engine-Verträgen.
- Keine Erweiterung öffentlicher Payloads um private Kartenlisten, Handlisten, DefinitionIds verdeckter Karten oder sonstige Hidden-Info-Daten.
- Keine allgemeine Umstellung aller Action-Cues auf manuelle Bestätigung.
- Keine Änderung an der Chronik außer falls nötig, um das Overlay-Handling side-sicher zu referenzieren.

## Akzeptanzkriterien

- [x] Ein neues Damage-Overlay verschwindet nicht durch Timeout, Animation-Ende oder automatisches Cue-Weiterlaufen.
- [x] Das Overlay wird erst nach bewusster Bestätigung der zuständigen menschlichen Sicht geschlossen.
- [x] Die Bestätigungsrolle ist im Ergebnis klar dokumentiert, insbesondere ob die Korp, der Runner oder beide Perspektiven betroffen sind.
- [x] Human-vs-KI- und KI-vs-Human-Flows blockieren nicht dauerhaft, wenn die bestätigende Seite keine menschliche Bedienung hat.
- [x] Reconnect oder EventTail zeigen bereits bestätigte Damage-Overlays nicht erneut als neue Pflichtbestätigung.
- [x] Das Overlay bleibt hidden-info-sicher und zeigt weiterhin nur abstrakte, öffentliche Damage-/Grip-Informationen.
- [x] Fokussierte Web-/UI-Regressionen decken manuelles Schließen, kein automatisches Schließen und Dedupe ab, oder ausgelassene Checks sind begründet.

## Umsetzungshinweise

- Vom erledigten Paket `act-2026-05-28-damage-impact-overlay` ausgehen und nur das Lebensdauer-/Ack-Modell der bestehenden Damage-Impact-Cues anpassen.
- Wenn bereits eine allgemeine Cue-Queue mit Auto-Dismiss existiert, Damage-Cues dort als `requiresAck` oder äquivalent modellieren, statt eine zweite unabhängige Overlay-Queue zu bauen.
- Für Reconnect-Dedupe wahrscheinlich bestätigte Event-IDs lokal oder im vorhandenen UI-State markieren; keine neuen Engine-Regeln einführen, solange es reine Anzeigelebensdauer bleibt.
- Bei Tests auf konkrete Hidden-Info-Negativfälle achten: keine Grip-Kartennamen, keine verdeckten DefinitionIds, keine privaten Listen.

## Ergebnisnotiz

Umgesetzt am 2026-06-03.

- Der bisherige Auto-Dismiss-Timer für `currentDamageImpact` wurde entfernt. Nicht-Flatline-Damage bleibt damit wie Flatline-Damage sichtbar, bis die lokale UI bewusst bestätigt wird.
- Der Button im Damage-Impact-Overlay heißt jetzt `Weiter` und hat den zugänglichen Namen `Damage-Fenster bestätigen`.
- Bestätigungsrolle: Das Overlay ist kein Engine-Gate und blockiert keine Bot- oder KI-Entscheidung. Bestätigen muss die jeweilige menschliche lokale Sicht, in der der Damage-Cue angezeigt wird. In Human-vs-Human sehen beide Seiten ihre eigene öffentliche Damage-Anzeige und bestätigen lokal; in Human-vs-KI blockiert keine nicht bedienbare KI-Sicht.
- Reconnect-/EventTail-Dedupe bleibt unverändert über `lastPresentedEventId` in `deriveDamageImpactCues`; bereits präsentierte alte Events werden nicht erneut als neues Pflichtoverlay erzeugt.
- Hidden-Info-Vertrag bleibt unverändert: Die bestehende Cue-Ableitung nutzt weiter nur öffentliche Counts und sichtbare Quellen; es wurden keine Engine- oder Payload-Felder erweitert.
- Der neue Regressionstest prüft, dass `page.tsx` keinen `setTimeout(() => setCurrentDamageImpact(null)` mehr enthält und der manuelle `Weiter`-Button erhalten bleibt. Die bestehenden Action-Cue-Tests decken weiterhin Damage-Cue-Ableitung und Dedupe ab.
