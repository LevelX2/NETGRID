---
activityId: act-2026-05-23-effective-ice-quote-for-runner-ai
status: done
kind: architecture
area: ai
priority: high
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-23
startedAt: 2026-05-23
completedAt: 2026-05-23
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/shared/src/index.ts
  - packages/engine/src/game/view/visible-run-quote.ts
  - packages/engine/src/game/view/player-view-projection.ts
  - packages/ai/src/input-dto.ts
  - packages/ai/src/visible-run-analysis.ts
  - packages/ai/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/ai test -- src/index.test.ts -t "effective run quote|Crystal Wall remote|visible ICE and breakers"
  - corepack pnpm --filter @netgrid/engine test -- src/index.test.ts -t "adds Encoder|adds Tesseract|Crystal Palace"
  - git diff --check
---

# Effektive ICE-/Run-Pfad-Projektion für Runner-KI

## Ziel

Die Runner-KI soll sichtbare wirksame Run-/Encounter-Modifikatoren nicht über konkrete Kartennamen erkennen, sondern über eine side-sichere, von der Engine abgeleitete Projektion der effektiven ICE- und Pfadwerte.

Nach dem Paket soll die KI bei sichtbaren, wirksamen Modifikatoren wie `Crystal Palace Station Grid` und `Tesseract Fort Construction` nicht mehr selbst wissen müssen, welche Karte welchen Effekt hat. Stattdessen soll sie lesen können, wie ein ICE beziehungsweise ein sichtbarer Run-Pfad aktuell effektiv aussieht: Stärke, Subroutinen, zusätzliche Subroutinen, Breakkostenmodifikatoren und relevante Pay-or-End-/Tax-Kosten.

## Kontext und Quellen

- Nutzerhinweis vom 2026-05-23 nach Playtest mit `Tesseract Fort Construction`, `Crystal Palace Station Grid`, `Crystal Wall` und `Dwarf`.
- Aktueller Hotfix-Stand: `packages/ai/src/visible-run-analysis.ts` erkennt `onr_v1_355_crystal-palace-station-grid` und `onr_v1_370_tesseract-fort-construction` noch konkret per Karten-ID. Das verhindert den beobachteten Fehlzug, ist aber keine tragfähige Architektur.
- Engine-seitig existieren bereits generischere Modifikatorpfade:
  - `packages/engine/src/ability-engine/active-modifiers.ts`
  - `packages/engine/src/index.ts` mit `subroutinesForCurrentEncounter` und `breakSubroutineCostBreakdown`
  - CardImplementation-Modifier wie `additional_subroutine` und `break_subroutine_cost`
- Architekturhinweis: Sichtbare, gerezzte oder sonst öffentlich wirksame Modifikatoren sind keine Hidden Info. Die Information kann side-sicher in einer Projektion transportiert werden, wenn sie nur aus dem jeweiligen PlayerView legal sichtbaren Quellen abgeleitet wird.

## Scope

- Eine kleine, read-only Engine-Projektion für effektive ICE-/Run-Pfad-Bewertung entwerfen und implementieren.
- Die Projektion soll mindestens für Runner-Sicht auf bekannte/rezzed ICE und öffentlich wirksame Quellen liefern:
  - effektive ICE-Stärke, soweit sie öffentlich bestimmbar ist,
  - effektive Subroutinen inklusive öffentlich bekannter zusätzlicher Subroutinen,
  - Subroutine-Typen/Break-Tags in einer Form, die die Runner-KI für Kostenabschätzung nutzen darf,
  - Breakkostenmodifikatoren pro Subroutine,
  - Pay-or-End-the-Run- beziehungsweise sichtbare Encounter-/Run-Taxes, soweit für die KI relevant,
  - öffentliche Quellenmetadaten nur in der Form, die auch im PlayerView oder PublicPayload sichtbar sein dürfte.
- Die Runner-KI soll `assessKnownRezzedIcePath` und verwandte Run-Cost-Entscheidungen auf diese Projektion umstellen.
- Die aktuellen Spezialfälle für `Crystal Palace Station Grid` und `Tesseract Fort Construction` in der KI sollen entfernt oder auf eine generische Projektion reduziert werden.
- Regressionen für mindestens diese Fälle ergänzen:
  - `Crystal Wall` + rezzed `Tesseract Fort Construction` + rezzed `Crystal Palace Station Grid` + `Dwarf`.
  - Eine zweite Quelle derselben Effektfamilie, sofern im aktuellen Runtime-Stand vorhanden, z. B. `Encoder, Inc.` für zusätzliche Subroutine oder `Virizz`/`Tutor` für Run-Dauer-Modifikatoren.
  - Negativfall: unrezzed oder aus Runner-Sicht unbekannte Root-Karte verändert die Projektion nicht.

## Nicht im Scope

- Keine neue Regelautorität neben der Rules Engine.
- Keine Änderung an `applyAction`-Validierung, LegalAction-Disziplin, Replay oder StateHash ohne explizite Notwendigkeit.
- Keine Hidden-Info-Ausweitung: verdeckte Root-Karten, unrezzed ICE-Identitäten, private Choices, Hand-/Deckdaten und nicht sichtbare Quellen dürfen nicht in AIInput, PlayerView, PublicEvents, Reconnect-Payloads, Logs oder DecisionDebug gelangen.
- Keine vollständige UI-Neugestaltung. Eine spätere UI-Nutzung der Projektion kann als Folgepaket entstehen, ist aber nicht Voraussetzung.
- Kein großer Run-Flow-Refactor und keine breite Extraktion aus `packages/engine/src/index.ts`, außer ein kleiner Helper ist notwendig, um dieselbe Logik für Projektion und Engine-Berechnung zu verwenden.

## Akzeptanzkriterien

- [x] Die KI-Kostenbewertung für sichtbare Run-Pfade nutzt keine konkreten Karten-IDs für `Crystal Palace Station Grid` oder `Tesseract Fort Construction`.
- [x] Eine Engine-nahe Projektion bildet die aktuell öffentlichen wirksamen ICE-/Run-Pfad-Modifikatoren ab und bleibt side-sicher.
- [x] Die Projektion wird aus vorhandenen Engine-/Modifier-Informationen abgeleitet, nicht aus getrennt gepflegten AI-Hardcodings.
- [x] `Crystal Wall` im Fort mit rezzed `Tesseract Fort Construction` und rezzed `Crystal Palace Station Grid` wird für die Runner-KI mit den korrekten sichtbaren Kosten bewertet.
- [x] Unrezzed oder verdeckte Quellen verändern die Runner-KI-Projektion nicht und leaken keine Identität.
- [x] Mindestens ein generischer weiterer Modifier-Fall bestätigt, dass der Mechanismus nicht nur für die zwei Ausgangskarten funktioniert.
- [x] Bestehende Engine-, AI-, Replay-/StateHash- und Hidden-Info-Regressionen bleiben grün.

## Umsetzungshinweise

- Primär zuerst Architektur-Schnitt prüfen: geeigneter Ort könnte ein kleiner Engine-Helper für `VisibleEffectiveIce` oder `VisibleRunPathQuote` sein, der von `getPlayerView`/AIInput oder direkt vom AI-Input-Builder genutzt wird.
- Die Projektion soll read-only sein. Legalität und Zahlung bleiben bei LegalActions und `applyAction`.
- Wenn die vorhandenen Engine-Helfer zu stark in `index.ts` eingeschlossen sind, kleinsten sicheren Schnitt wählen und keine breite Modulverschiebung erzwingen.
- Für Quellenmetadaten nur öffentliche Definition-IDs/Titel ausgeben, wenn die Quelle aus Runner-Sicht bekannt ist. Für reine Zahlenwerte darf die Projektion öffentliche Gesamtwerte liefern, ohne verdeckte Quellen zu benennen.
- Nach erfolgreichem Muster können Folgepakete für UI-Anzeige oder weitere Effektfamilien angelegt werden.

## Ergebnisnotiz

Abgeschlossen am 2026-05-23: Sichtbar bekannte, gerezzte ICE tragen im PlayerView jetzt eine Engine-nahe `effectiveRunQuote` mit effektiver Stärke, effektiven Subroutinen, öffentlichen dynamischen Quellen und Breakkostenmodifikatoren. Die Quote wird aus den vorhandenen Engine-Pfaden für `additional_subroutine`, run-duration Zusatzsubroutinen und `break_subroutine_cost` erzeugt und über den AI-Input-Sanitizer positiv erlaubt. `assessKnownRezzedIcePath` nutzt diese Projektion für normale ETR-Subroutinen und Pay-or-End-the-Run-Subroutinen; die bisherigen KI-Sonderfälle für `Crystal Palace Station Grid` und `Tesseract Fort Construction` sind entfernt. Regressionen decken den Ausgangsfall `Crystal Wall`/`Dwarf` plus Tesseract/Crystal Palace, einen generischen `Encoder, Inc.`-Zusatzsubroutinenfall und einen unrezzed/hidden Negativfall ohne Root-Identitätsleck ab.

Checks: `corepack pnpm --filter @netgrid/shared typecheck`, `corepack pnpm --filter @netgrid/engine typecheck`, `corepack pnpm --filter @netgrid/ai typecheck`, `corepack pnpm --filter @netgrid/ai test -- src/index.test.ts -t "effective run quote|Crystal Wall remote|visible ICE and breakers"`, `corepack pnpm --filter @netgrid/engine test -- src/index.test.ts -t "adds Encoder|adds Tesseract|Crystal Palace"`, `git diff --check` (Exit 0; nur bestehende CRLF-Warnungen in den vorgefundenen Web-Dateien `apps/web/app/globals.css` und `apps/web/app/page.tsx`).
