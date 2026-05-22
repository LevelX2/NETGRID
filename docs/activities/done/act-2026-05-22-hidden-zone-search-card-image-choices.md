---
activityId: act-2026-05-22-hidden-zone-search-card-image-choices
status: done
kind: fix
area: web
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-22
startedAt: 2026-05-22
completedAt: 2026-05-22
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/app/action-board-ui.ts
  - apps/web/app/action-board-ui.test.ts
  - apps/web/app/globals.css
  - apps/web/app/page.tsx
  - apps/web/app/run-layering.test.ts
checks:
  - "corepack pnpm --filter @netgrid/web exec vitest run app/action-board-ui.test.ts -t \"routes hidden multi-card choices|detects field-card choices\""
  - "corepack pnpm --filter @netgrid/web exec vitest run app/run-layering.test.ts"
  - "corepack pnpm --filter @netgrid/web typecheck"
  - "git diff --check"
---

# Hidden-Zone-Suche zeigt vollständige Karten in Auswahl

## Ziel

Kartenauswahlen aus eigenen Hidden Zones sollen lesbare vollständige Karten oder Kartenbilder anzeigen, damit der Spieler vor der Auswahl den relevanten Kartentext erkennen kann.

## Kontext und Quellen

- Nutzerfund vom 2026-05-22: Wenn der Runner die installierte Resource `The Short Circuit` nutzt, um ein Programm aus dem Stack zu suchen, zeigt die Auswahl keine Kartenbilder, sondern nur kleine Namens-Chips oder einfache Auswahloptionen.
- Erwartung: Bei einer Kartenauswahl aus dem Stack müssen vollständige Karten beziehungsweise gut lesbare Kartenbilder angezeigt werden.
- Verwandte erledigte Activity: `docs/activities/done/act-2026-05-21-generic-field-card-choice-ui.md` stellte Feldkarten-Choices bewusst auf direkte Board-Auswahl um und ließ Stack-/Such-/Hand-/Discard-Choices auf bisherigen Pfaden.
- Relevante Release-Spur: Hidden-Zone Search/Reveal/Reorder wurde in V1.9.11 umgesetzt; der UI-Fund betrifft die Präsentation einer legalen Auswahl, nicht die Regelautorität.

## Scope

- Den Choice-Pfad für `The Short Circuit` Stack-Suche reproduzieren und identifizieren.
- Hidden-Zone-Search-Choices, bei denen der Viewer die Karten legal sehen darf, mit vollständigen Karten oder gut lesbaren Kartenbildern darstellen.
- Mindestens Namen, Typ/Kosten und relevanten Kartentext lesbar machen, falls Bildassets fehlen.
- Sicherstellen, dass Suchauswahl und Bestätigung weiterhin die bestehende `resolve_choice`-Action nutzen.
- Einen fokussierten Test oder Story-/Helper-Test für `The Short Circuit` ergänzen.

## Nicht im Scope

- Keine Umstellung von Feldkarten-Choices; die erledigte Feldkarten-Activity bleibt gültig.
- Keine Änderung an Hidden-Zone-Regeln, Search-Result-Zusammenstellung, Shuffle oder Reveal.
- Keine Offenlegung gegnerischer Hidden-Zone-Karten.
- Keine neue externe Kartendatenbank- oder Asset-Abhängigkeit.

## Akzeptanzkriterien

- [x] `The Short Circuit` zeigt bei Programmsuche aus dem Stack lesbare Kartenansichten statt nur kleiner Chips.
- [x] Der Spieler kann vor Auswahl den relevanten Kartentext erkennen.
- [x] Hidden-Info-Grenzen bleiben gewahrt: Nur für den Viewer legal sichtbare Suchergebnisse werden vollständig angezeigt.
- [x] Auswahl, Mehrfach-/Einfachauswahl und Bestätigung bleiben legalitätsgetrieben über `pendingChoice.options`.
- [x] Fokussierte Tests oder eine dokumentierte Browser-Prüfung decken den Choice-Pfad ab.
- [x] Checks: passende Web-Tests, Typecheck, `git diff --check`.

## Umsetzungshinweise

- Wahrscheinlicher Startpunkt ist das bestehende `CardChoicePanel` oder ein Hidden-Zone-Choice-spezifischer Renderingzweig.
- Die bestehende Card-Display-Komponente wiederverwenden, damit Tooltip-/Textformatierung nicht erneut auseinanderläuft.

## Ergebnisnotiz

Stack-/Such-Choices, darunter `The Short Circuit`, nutzen im `CardChoicePanel` jetzt einen eigenen `readableCards`-Layoutmodus. Die Kartenoptionen bleiben weiterhin aus `pendingChoice.options` und vorhandenen `option.card`-Projektionen gespeist, werden aber als nicht überlappendes Grid mit größeren Textkarten dargestellt. Normale Hidden-Multi-Choices behalten das bisherige Layout. Hidden-Info-Grenzen ändern sich nicht, weil keine neuen Kartendaten nachgeladen oder aus verdeckten Zonen erraten werden.
