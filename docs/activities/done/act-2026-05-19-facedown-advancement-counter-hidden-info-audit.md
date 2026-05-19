---
activityId: act-2026-05-19-facedown-advancement-counter-hidden-info-audit
status: done
kind: fix
area: web
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-19
startedAt: 2026-05-19
completedAt: 2026-05-19
branch:
releaseTarget:
blockedBy: []
relatedActivities:
  - act-2026-05-19-corp-ai-unprotected-advanced-agenda-repeat
resultArtifacts:
  - apps/web/app/action-board-ui.ts
  - apps/web/app/action-board-ui.test.ts
  - apps/web/app/page.tsx
  - packages/engine/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/web test -- apps/web/app/action-board-ui.test.ts
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm --filter @netgrid/engine test -- src/index.test.ts -t "does not leak hidden Corp card titles"
  - git diff --check
---

# Verdeckte Korp-Karten: Advancement-Counter ohne Hidden-Info-Leak anzeigen

## Fund

Im Playtest wurde auf einer verdeckten Korp-Karte im Root eines Forts ein Badge `x5` angezeigt. Die ersten vier Advancement-Counter wurden als normale Glasperlen auf der Karte dargestellt; erst beim fünften Counter wechselte die Runner-Ansicht auf den Sonder-Chip `x5`. Die Frage war, ob der Runner daraus sehen darf, dass die Karte ausreichend fortgeschritten ist.

Regelannahme für NETGRID: Advancement-Counter auf installierten verdeckten Korp-Karten sind öffentlich sichtbar. Der Runner darf also die Anzahl der Counter sehen. Nicht öffentlich sind Kartenidentität, Kartentyp, Agenda-Punkte, Advancement Requirement und jede Aussage, ob die Karte aktuell scorebar ist.

## Aktueller technischer Hinweis

Der erste Codeblick deutet darauf hin, dass die Engine für verdeckte gegnerische Root-Karten nur eine redigierte Karte mit `known: false`, `rezzed: false` und `advancementCounters` ausgibt. Das ist grundsätzlich richtig. Das Paket soll trotzdem prüfen, ob Web-UI, Tooltips, ARIA-Labels, Detailansichten oder Hilfstexte aus dem Counter-Badge mehr ableiten oder optisch nahelegen, als der Runner wissen darf.

## Ziel

Der Runner sieht bei verdeckten installierten Korp-Karten nur die öffentliche Anzahl der Advancement-Counter. Die Darstellung macht klar, dass auch fünf oder mehr Counter nur die Counter-Anzahl bedeuten und keinen Hinweis auf Scorebarkeit, Kartentyp oder Kartenidentität enthalten. Aus Runner-Sicht soll der fünfte Counter wie die ersten vier als neutrale Glasperle erscheinen und nicht als besonderer `x5`-Chip.

## Scope

- Runner-View und Corp-View für verdeckte installierte Karten mit 0, 1 und 5 Advancement-Countern prüfen.
- Verdeckte Agenda, verdecktes Asset/Trap und, falls regeltechnisch möglich, nicht advancebare verdeckte Karte mit Countern prüfen.
- Sicherstellen, dass gegnerische PlayerViews keine `advancementRequirement`, Agenda-Punkte, Kartentitel, Kartentypen oder Score-ready-Informationen für unbekannte verdeckte Karten enthalten.
- Web-Darstellung, Tooltip, ARIA-Label und eventuelle Kartendetails so anpassen, dass die Anzeige neutral als Advancement-Counter-Anzahl verstanden wird.
- Runner-Ansicht so anpassen, dass der fünfte Advancement-Counter auf verdeckten Korp-Karten nicht in einen Sonder-Chip wie `x5` zusammengefasst wird, sondern wie die ersten vier Counter als Glasperle auf der Karte liegt.
- Falls aus Platzgründen bei sehr vielen Countern später zusammengefasst werden muss, darf diese Zusammenfassung in der Runner-Ansicht nicht bei typischen Score-Schwellen wie 5 beginnen und muss neutral als reine Counter-Menge erkennbar sein.

## Nicht im Scope

- Öffentliche Advancement-Counter vollständig vor dem Runner verstecken.
- Advancement-Regeln oder Score-Regeln ändern.
- Korp-KI-Gewichtung für advanced Agendas ändern.

## Akzeptanzkriterien

- [x] Der Runner sieht bei einer verdeckten installierten Korp-Karte die Anzahl öffentlicher Advancement-Counter.
- [x] Bei fünf Advancement-Countern auf einer verdeckten Korp-Karte sieht der Runner weiterhin fünf neutrale Counter-Glasperlen und keinen besonderen `x5`-Chip.
- [x] Der Runner sieht dabei keine Kartenidentität, keinen Kartentyp, keine Agenda-Punkte, keine Advancement-Anforderung und keinen Score-ready-Zustand.
- [x] Die UI-Bezeichnung erklärt den Badge als Counter-Anzahl und nicht als „genug advanced“.
- [x] Die Corp-Eigenansicht darf weiterhin vollständige Informationen inklusive Scorebarkeit anzeigen.
- [x] Hidden-Info-Tests für PlayerView-Redaction und relevante Web-Tests sind ergänzt oder aktualisiert.
- [x] Replay und StateHash bleiben deterministisch; es werden keine verdeckten Kartendaten in öffentliche Events, Logs oder Reconnect-Payloads aufgenommen.

## Ergebnisnotiz

Erledigt am 2026-05-19. Die Webanzeige nutzt nun einen gekapselten Advancement-Counter-Displayvertrag: verdeckte Korp-Karten zeigen bei fünf öffentlichen Countern fünf neutrale Glasperlen und keinen `x5`-Sonderchip; erst ab zehn Countern wird neutral verdichtet. Das ARIA-Label spricht bei verdeckten Karten von öffentlichen Advancement-Countern, nicht von Scorebarkeit. Der Engine-Test prüft zusätzlich, dass die Runner-PlayerView für eine verdeckte, fünffach entwickelte Agenda nur `known:false`, `rezzed:false` und `advancementCounters:5` enthält, während die Corp-Eigenansicht Titel, Requirement und Agenda-Punkte weiterhin sieht.
