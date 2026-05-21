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

# Ansehen-Auflösung sichtbar bis zur Bestätigung anzeigen

## Ziel

Ansehen-Effekte sollen nach der bestätigten Zielauswahl stabil und bewusst sichtbar werden. Die betroffene Seite soll die angesehenen Karten prüfen können und erst mit einem `Gesehen`- oder `Fertig`-Button zur normalen verdeckten Boarddarstellung zurückkehren. Sichtbare UI-Texte verwenden `ansehen`/`angesehen`, nicht `exposen` oder englisches `Expose`.

## Kontext und Quellen

- Nutzerfund vom 2026-05-21 nach Playtest mit `Hunt Club BBS`: Nach der Auswahl waren die Karten höchstens kurz sichtbar oder praktisch nicht wahrnehmbar.
- Regel- und UX-Erwartung:
  - Während der Auswahl werden Karten nicht aufgedeckt, weil die Auswahl noch geändert werden kann.
  - Erst nach Bestätigung dürfen die Karten angesehen werden.
  - Ansehen bedeutet nicht rezzen und nicht dauerhaft offenlegen.
  - Nach dem Anschauen bleiben bzw. werden die Karten wieder verdeckt dargestellt.
- Relevante Quelle: `docs/source/Netrunner Errata 1.70.md` zu `Hunt Club BBS`: Alle Entscheidungen darüber, welche und wie viele Karten angesehen werden, erfolgen vor dem regeltechnischen Expose.
- Bestehende technische Anker:
  - `packages/engine/src/index.ts`: `publicRevealKind: "expose"`, `publicRevealDefinitionId`, `publicRevealDefinitionIds`, `exposedServerLabels`.
  - `apps/web/app/chronicle.ts`: Chronik-Auswertung für `expose`.
  - `apps/web/app/page.tsx`: bestehende Access-Reveal- und Dismiss-Muster können als Vorbild dienen.
- Nachtrag 2026-05-21: `Smarteye` hat einen run-integrierten Engine-Zwischenschritt (`ICE ansehen` -> `Ansehen beenden`/`Jack-out`) erhalten. Dieses Activity-Paket bleibt für die allgemeine, stabile Review-Anzeige von Ansehen-/Expose-PublicEvents relevant und darf die Smarteye-Run-Phase nicht durch ein zusätzliches widersprüchliches Overlay ersetzen.

## Scope

- Webclient-Verhalten für PublicEvents mit `publicRevealKind: "expose"` prüfen und härtbar machen.
- Ein bewusstes Ansehen-Review-UI anzeigen, wenn ein lokaler Spieler Karten ansehen darf:
  - Titel/Definition der angesehenen Karten,
  - Standortlabel, soweit side-sicher vorhanden,
  - klarer Abschlussbutton `Gesehen` oder `Fertig`.
- Die Anzeige muss stabil bleiben, auch wenn danach normale Board-/Chronik-/Run-Updates eintreffen.
- Nach Bestätigung wird nur die lokale UI-Anzeige geschlossen; der Boardzustand bleibt Engine-getrieben und verdeckte Karten bleiben unrezzed/verdeckt.
- Mehrkarten-Ansehen unterstützen, insbesondere `Hunt Club BBS` mit bis zu drei installierten Korp-Karten.
- Automatisches Mehrkarten-Ansehen ohne freie Zielauswahl unterstützen, insbesondere `Ice and Data's Guide to the Net`, das die äußersten ICE der Data Forts ansehen lässt.
- Einzelkarten-Ansehen ohne freie Zielkartenauswahl unterstützen:
  - `Mouse`: Server/Fort wird gewählt, angesehen wird eine installierte unrezzed Korp-Karte dort.
  - `SeeYa`: Server/Fort wird gewählt, angesehen wird eine installierte unrezzed Korp-Karte dort.
  - `Ronin Around`: installierte Korp-Karte ansehen.
  - `Fortress Respecification`: Event lässt eine unrezzed installierte Korp-Karte im gewählten Fort ansehen.
  - `Smarteye`: Run-integriertes Ansehen des aktuell angenäherten unrezzed ICE; die neue Engine-Run-Phase mit `Ansehen beenden`/`Jack-out` ist dabei der Primärpfad.
  - ältere lokale Harness-/Legacy-Pfade wie `v098_expose_event`, falls sie im aktuellen Webclient noch erreichbar sind.
- Proteus-Abgleich vormerken: `Decoy Signal` hat einen Smarteye-ähnlichen Run-Text für jedes angenäherte unrezzed ICE; falls diese Karte später umgesetzt wird, soll sie die Smarteye-Ansehenphase wiederverwenden statt einen separaten Expose-Sonderpfad einzuführen.

## Nicht im Scope

- Keine Regeländerung: Regeltechnisches Expose/Ansehen darf keine Karte rezzen und keine dauerhafte Sichtbarkeit setzen.
- Keine Änderung an StateHash oder Replay-Semantik.
- Keine Offenlegung gegenüber Seiten, die die angesehene Information regelhaft nicht erhalten sollen.
- Keine Umstellung der Zielauswahl selbst; das ist durch `act-2026-05-21-generic-field-card-choice-ui` separat geschnitten.
- Keine generelle Neugestaltung der Chronik.

## Akzeptanzkriterien

- [ ] Nach einer Ansehen-Auflösung bleibt eine sichtbare Review-Anzeige offen, bis der Spieler sie bestätigt.
- [ ] `Hunt Club BBS` zeigt alle bestätigten angesehenen Karten in einer stabilen Anzeige.
- [ ] `Ice and Data's Guide to the Net` zeigt alle automatisch angesehenen äußersten ICE stabil in derselben Review-Anzeige, obwohl keine freie Zielauswahl vorausgeht.
- [ ] Einzelkarten-Ansehen über `Mouse`, `SeeYa`, `Ronin Around`, `Fortress Respecification` und die Smarteye-Run-Phase zeigt die angesehene Karte stabil bis zur Bestätigung.
- [ ] Die Karten werden während der Auswahl nicht gezeigt, sondern erst nach der `resolve_choice`-Bestätigung.
- [ ] Nach `Gesehen` erscheinen unrezzed Korp-Karten im Board wieder verdeckt und bleiben nicht dauerhaft bekannt.
- [ ] Chronik beschreibt Ansehen/regeltechnisches Expose weiterhin side-sicher.
- [ ] Reconnect/Live-Update-Verhalten erzeugt keinen zusätzlichen Hidden-Info-Leak und zeigt keine alten Ansehen-Overlays unkontrolliert erneut.
- [ ] Web-Tests decken mindestens Mehrkarten-Ansehen und Einzelkarten-Ansehen ab.
- [ ] Checks: `corepack pnpm --filter @netgrid/web test`, passende Chronik-/UI-Tests, `corepack pnpm --filter @netgrid/web typecheck`, bei Payload-Anpassung zusätzlich passende Engine-/Server-Tests, `git diff --check`.

## Umsetzungshinweise

- Bestehende Access-Reveal-Lifetime-Logik kann als Muster dienen, aber Ansehen ist nicht Access: Die Anzeige darf nicht suggerieren, dass eine Karte gestohlen, getrasht, gerezzt oder dauerhaft offengelegt wurde.
- Falls aktuelle PublicPayloads für Mehrkarten-Ansehen nur Definition-IDs und Standortlabels als kommagetrennte Strings enthalten, prüfen, ob die Webanzeige damit robust genug ist. Additive Payload-Verbesserungen sind möglich, müssen aber Hidden-Info- und Legacy-Kompatibilität wahren.
- Die Anzeige sollte lokal dismissbar sein und nicht als Engine-Aktion modelliert werden.
- Bei Ansehen durch Runner gegen Korp-Karten ist besonders darauf zu achten, dass Korp- und Zuschauer-/Reconnect-Pfade keine zusätzlichen verdeckten Informationen erhalten.
- Sichtbare Buttons und Überschriften sollen `Ansehen`, `Angesehen`, `Gesehen` oder `Fertig` verwenden. `Expose`/`exposen` bleibt nur in Code-Symbolen, Payload-Namen, englischen Originalzitaten und technischen Kommentaren stehen.

## Ergebnisnotiz

Noch offen.
