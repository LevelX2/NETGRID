---
activityId: act-2026-07-31-roving-submarine-run-lock-badge
status: inbox
kind: fix
area: ui
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-07-31
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Roving-Submarine-Run-Sperre verständlich anzeigen

## Ziel

`Roving Submarine` soll auf dem Spielfeld eindeutig anzeigen, wenn das
zugehörige Remote derzeit kein legales Run-Ziel ist. Der Hinweis darf
Kartenname und Kosten nicht verdecken und muss im Tooltip erklären, welche
Aktivität der Korp im maßgeblichen letzten Korpzug gefehlt hat.

## Kontext und Quellen

- Nutzerbeobachtung vom 31.07.2026 zur Karte `Roving Submarine`:
  `onr_v1_368_roving-submarine`.
- Kartentext: Das Upgrade wird nur in einem subsidiary data fort installiert.
  Dieses Fort darf nur angegriffen werden, wenn die Korp in ihrem letzten Zug
  eine Karte in oder vor diesem Fort installiert oder dort eine Karte
  entwickelt hat.
- Die Engine bildet die Aktivität aktuell mit dem technischen `mark`-Counter
  ab: `mark = 1` bedeutet, dass die erforderliche Korp-Aktivität stattgefunden
  hat und der Run erlaubt ist; `mark = 0` beziehungsweise kein Marker bedeutet,
  dass das Fort gesperrt ist.
- Die generische Counter-Projektion stellt den positiven technischen Zustand
  als `1 Mark` dar. Der Badge sitzt oben auf der Karte, kann Kartenname und
  Kosten überdecken und erklärt die fachliche Bedeutung nicht.
- Der Nutzer deutete den sichtbaren Marker nachvollziehbar als Sperrmarker.
  Eine reine Umbenennung des vorhandenen positiven Markers in
  `Fort gesperrt` wäre jedoch fachlich falsch. Die sichtbare Darstellung muss
  deshalb aus dem tatsächlichen Run-Sperrzustand abgeleitet werden.

## Scope

- Für die bekannte und aktive `Roving Submarine` einen kartenspezifischen
  Status-Badge aus dem bestehenden Run-Gate-Zustand ableiten.
- Den Badge nur anzeigen, wenn das zugehörige Fort durch `Roving Submarine`
  tatsächlich für Runs gesperrt ist.
- Als kompakten sichtbaren Text `Fort gesperrt` verwenden; keinen technischen
  Text wie `1 Mark`, `mark = 0` oder einen Counterbetrag anzeigen.
- Wenn die erforderliche Korp-Aktivität vorliegt und der Run erlaubt ist,
  weder den Sperr-Badge noch einen generischen `1 Mark`-Badge anzeigen. Die
  Abwesenheit des Hinweises bedeutet den normalen, erlaubten Zustand.
- Den Badge unterhalb der Namens-/Kostenzeile positionieren, sodass Kartenname,
  Rez- und Trashkosten bei den unterstützten Kartengrößen und Darstellungsmodi
  lesbar bleiben.
- Einen zugänglichen Tooltip beziehungsweise Hilfetext anbieten, zum Beispiel:
  `Roving Submarine: Dieses Fort ist derzeit gesperrt, weil die Korp im
  maßgeblichen letzten Korpzug keine Karte in oder vor diesem Fort installiert
  und dort keine Karte entwickelt hat.`
- Im Tooltip zusätzlich positiv erklären, wann die Sperre entfällt: Nach einer
  passenden Installation oder Entwicklung im relevanten Korpzug ist der Run
  wieder erlaubt und der Badge verschwindet.
- Die Anzeige muss für den Runner und für andere Ansichten, in denen die
  gerezzte Karte regelgerecht bekannt ist, dieselbe öffentliche
  Run-Gate-Information verwenden.

## Nicht im Scope

- Keine Änderung des Kartentexts oder der fachlichen Run-Bedingung.
- Keine Änderung des bestehenden Engine-Lifecycles für den internen
  Aktivitätsmarker und keine Invertierung seiner gespeicherten Bedeutung.
- Kein genereller Umbau aller `mark`-Counter oder aller Kartenstatus-Badges.
- Keine zusätzliche LegalAction und keine alternative Run-Entscheidungslogik
  im Webclient; die Rules Engine bleibt alleinige Autorität für erlaubte Runs.
- Keine zusätzlichen Informationen über verdeckte Korp-Karten oder konkrete
  installierte beziehungsweise entwickelte Karten in PlayerViews, Tooltips,
  Chronik oder Payloads.

## Akzeptanzkriterien

- [ ] Bei einer gerezzten `Roving Submarine` ohne erfüllte Korp-Aktivität zeigt
  die bekannte Karte den Badge `Fort gesperrt`.
- [ ] Der Tooltip erklärt verständlich, dass im relevanten letzten Korpzug
  keine Karte in oder vor diesem Fort installiert und dort keine Karte
  entwickelt wurde.
- [ ] Sobald der bestehende Engine-Zustand den Run erlaubt, verschwindet der
  Sperr-Badge; ein technischer `1 Mark`-Badge wird nicht ersatzweise gezeigt.
- [ ] Badge und Tooltip behaupten nicht, dass das Fort gesperrt ist, wenn
  `validateActivityGatedFortRun` beziehungsweise die zugehörige
  LegalAction-Projektion den Run erlaubt.
- [ ] Der Badge liegt sichtbar unterhalb der Namens-/Kostenzeile und überdeckt
  weder Kartenname noch Rez-/Trashkosten in Bild-, Text- und Kompaktmodus.
- [ ] Verdeckte beziehungsweise dem Betrachter nicht bekannte Korp-Karten
  erhalten keinen kartenspezifischen Titel oder Sperrhinweis.
- [ ] Engine-/PlayerView-Regressionen decken gesperrten und erlaubten Zustand
  ab; Web-Regressionen decken Badge-Text, Tooltip, kartenspezifische CSS-Klasse
  und das Unterdrücken des generischen Mark-Badges ab.
- [ ] Relevante Engine- und Web-Tests, Typechecks sowie `format:changed` sind
  erfolgreich.

## Umsetzungshinweise

- Primärer Owner ist `small-adjustments-agent`; die Regelmechanik ist bereits
  vorhanden, der Schnitt betrifft ihre öffentliche Projektion und Darstellung.
- `packages/engine/src/game/run/fort-run-side-families.ts` definiert die
  bestehende Bedeutung des technischen `mark`-Counters. Diese Bedeutung nicht
  ändern.
- `packages/engine/src/game/view/card-view.ts` projiziert derzeit generische
  Mark-Counter. Für `onr_v1_368_roving-submarine` ist ein eigener
  `CounterDisplay`- beziehungsweise Status-Display-Identifier sinnvoll, der
  nur im gesperrten Zustand entsteht und den positiven technischen Marker
  nicht sichtbar macht.
- `apps/web/features/cards/CardBadges.tsx` sollte für diesen Identifier den
  Text `Fort gesperrt`, einen kartenspezifischen Tooltip und eine eigene
  CSS-Klasse liefern. Die generische `ablativeCounterBadge`-Position bei
  `top: 6px` ist für diesen Status ungeeignet.
- Die genaue vertikale Position an den realen Kartenlayouts prüfen; Ziel ist
  die erste freie Badge-Zeile unterhalb von Name und Kosten, nicht lediglich
  ein willkürlicher Pixelversatz.

## Ergebnisnotiz

Noch offen.
