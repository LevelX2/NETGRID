---
activityId: act-2026-05-21-expose-reveal-review-ui
status: inbox
kind: fix
area: web
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-21
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Expose-Auflösung sichtbar bis zur Bestätigung anzeigen

## Ziel

Expose-Effekte sollen nach der bestätigten Zielauswahl stabil und bewusst sichtbar werden. Die betroffene Seite soll exposed Karten anschauen können und erst mit einem `Gesehen`- oder `Fertig`-Button zur normalen verdeckten Boarddarstellung zurückkehren.

## Kontext und Quellen

- Nutzerfund vom 2026-05-21 nach Playtest mit `Hunt Club BBS`: Nach der Auswahl waren die Karten höchstens kurz sichtbar oder praktisch nicht wahrnehmbar.
- Regel- und UX-Erwartung:
  - Während der Auswahl werden Karten nicht aufgedeckt, weil die Auswahl noch geändert werden kann.
  - Erst nach Bestätigung wird exposed.
  - Expose bedeutet nicht rezzen und nicht dauerhaft offenlegen.
  - Nach dem Anschauen bleiben bzw. werden die Karten wieder verdeckt dargestellt.
- Relevante Quelle: `docs/source/Netrunner Errata 1.70.md` zu `Hunt Club BBS`: Alle Entscheidungen darüber, welche und wie viele Karten exposed werden, erfolgen vor dem Expose.
- Bestehende technische Anker:
  - `packages/engine/src/index.ts`: `publicRevealKind: "expose"`, `publicRevealDefinitionId`, `publicRevealDefinitionIds`, `exposedServerLabels`.
  - `apps/web/app/chronicle.ts`: Chronik-Auswertung für `expose`.
  - `apps/web/app/page.tsx`: bestehende Access-Reveal- und Dismiss-Muster können als Vorbild dienen.

## Scope

- Webclient-Verhalten für PublicEvents mit `publicRevealKind: "expose"` prüfen und härtbar machen.
- Ein bewusstes Expose-Review-UI anzeigen, wenn ein lokaler Spieler exposed Karten sehen darf:
  - Titel/Definition der exposed Karten,
  - Standortlabel, soweit side-sicher vorhanden,
  - klarer Abschlussbutton `Gesehen` oder `Fertig`.
- Die Anzeige muss stabil bleiben, auch wenn danach normale Board-/Chronik-/Run-Updates eintreffen.
- Nach Bestätigung wird nur die lokale UI-Anzeige geschlossen; der Boardzustand bleibt Engine-getrieben und verdeckte Karten bleiben unrezzed/verdeckt.
- Mehrkarten-Expose unterstützen, insbesondere `Hunt Club BBS` mit bis zu drei installierten Korp-Karten.
- Automatische Mehrkarten-Expose ohne freie Zielauswahl unterstützen, insbesondere `Ice and Data's Guide to the Net`, das die äußersten ICE der Data Forts exposed.
- Einzelkarten-Expose ohne freie Zielkartenauswahl unterstützen:
  - `Mouse`: Server/Fort wird gewählt, exposed wird eine installierte unrezzed Korp-Karte dort.
  - `SeeYa`: Server/Fort wird gewählt, exposed wird eine installierte unrezzed Korp-Karte dort.
  - `Fortress Respecification`: Event exposed eine unrezzed installierte Korp-Karte im gewählten Fort.
  - `Smarteye`: Approach-ICE-Expose auf das aktuell angenäherte unrezzed ICE.
  - ältere lokale Harness-/Legacy-Pfade wie `v098_expose_event`, falls sie im aktuellen Webclient noch erreichbar sind.

## Nicht im Scope

- Keine Regeländerung: Expose darf keine Karte rezzen und keine dauerhafte Sichtbarkeit setzen.
- Keine Änderung an StateHash oder Replay-Semantik.
- Keine Offenlegung gegenüber Seiten, die die exposed Information regelhaft nicht erhalten sollen.
- Keine Umstellung der Zielauswahl selbst; das ist durch `act-2026-05-21-generic-field-card-choice-ui` separat geschnitten.
- Keine generelle Neugestaltung der Chronik.

## Akzeptanzkriterien

- [ ] Nach einer Expose-Auflösung bleibt eine sichtbare Review-Anzeige offen, bis der Spieler sie bestätigt.
- [ ] `Hunt Club BBS` zeigt alle bestätigten exposed Karten in einer stabilen Anzeige.
- [ ] `Ice and Data's Guide to the Net` zeigt alle automatisch exposed äußersten ICE stabil in derselben Review-Anzeige, obwohl keine freie Zielauswahl vorausgeht.
- [ ] Einzelkarten-Expose über `Mouse`, `SeeYa`, `Fortress Respecification` und `Smarteye` zeigt die exposed Karte stabil bis zur Bestätigung.
- [ ] Die Karten werden während der Auswahl nicht gezeigt, sondern erst nach der `resolve_choice`-Bestätigung.
- [ ] Nach `Gesehen` erscheinen unrezzed Korp-Karten im Board wieder verdeckt und bleiben nicht dauerhaft bekannt.
- [ ] Chronik kann den Expose weiterhin side-sicher beschreiben.
- [ ] Reconnect/Live-Update-Verhalten erzeugt keinen zusätzlichen Hidden-Info-Leak und zeigt keine alten Expose-Overlays unkontrolliert erneut.
- [ ] Web-Tests decken mindestens Mehrkarten-Expose und Einzelkarten-Expose ab.
- [ ] Checks: `corepack pnpm --filter @netgrid/web test`, passende Chronik-/UI-Tests, `corepack pnpm --filter @netgrid/web typecheck`, bei Payload-Anpassung zusätzlich passende Engine-/Server-Tests, `git diff --check`.

## Umsetzungshinweise

- Bestehende Access-Reveal-Lifetime-Logik kann als Muster dienen, aber Expose ist nicht Access: Die Anzeige darf nicht suggerieren, dass eine Karte gestohlen, getrasht, gerezzt oder dauerhaft offengelegt wurde.
- Falls aktuelle PublicPayloads für Mehrkarten-Expose nur Definition-IDs und Standortlabels als kommagetrennte Strings enthalten, prüfen, ob die Webanzeige damit robust genug ist. Additive Payload-Verbesserungen sind möglich, müssen aber Hidden-Info- und Legacy-Kompatibilität wahren.
- Die Anzeige sollte lokal dismissbar sein und nicht als Engine-Aktion modelliert werden.
- Bei Expose durch Runner gegen Korp-Karten ist besonders darauf zu achten, dass Korp- und Zuschauer-/Reconnect-Pfade keine zusätzlichen verdeckten Informationen erhalten.

## Ergebnisnotiz

Noch offen.
