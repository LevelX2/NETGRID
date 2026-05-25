---
activityId: act-2026-05-24-private-look-readonly-card-display
status: inbox
kind: fix
area: web
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Private-Look-Effekte als reine Kartenanzeige darstellen

## Ziel

Private Look-Effekte auf verdeckte Korp-Karten sollen im Webclient als reines Anzeige-/Bestätigungsfenster erscheinen: Karte(n) groß und lesbar anzeigen, keine Auswahlmarkierung, kein Plus-/Auswahlbutton, Abschluss nur über `Fertig` beziehungsweise eine eindeutige Bestätigung.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-24: Bei `Technician Lover` öffnet die Fähigkeit zum Blick auf die oberste R&D-Karte ein Auswahlfenster. Der Runner sieht zwar die Karte, muss aber erst eine Auswahl-/Plus-Interaktion ausführen und danach `Fertig` bestätigen. Erwartet ist ein normales Anzeigefenster, z. B. mit Überschrift `Technician Lover: oberste R&D-Karte`, das mit `Fertig` direkt geschlossen wird.
- Betroffene Karte: `onr_v1_183_technician-lover` / `Technician Lover`, Runner-Resource, `[A]: Look at the top card of R&D.`
- Aktueller Engine-Anker: `packages/engine/src/card-implementations/onr-v1/runner/resources/technician-lover.ts` nutzt `kind: "private_look"`, `zone: "rd"`, `count: 1`.
- Gemeinsamer Engine-Pfad: `packages/engine/src/index.ts` `startRunnerPrivateLookChoice(...)` erzeugt aktuell eine `select_cards`-Choice mit nicht auswählbaren Kartenoptionen plus auswählbarer `done`-Option.
- Ähnliche aktuelle Nutzer dieses Pfads: `Deep Thought` (`private_look_top_rd_at_threshold`, R&D-Topkarte), `R&D-Protocol Files` (`private_look_top_rd`, Top 5 nach erfolgreichem Run) und der post-access HQ-Private-Look-Pfad über `post_access_private_look`.
- Verwandte erledigte UI-Pakete: `docs/activities/done/act-2026-05-22-hidden-zone-search-card-image-choices.md` für echte Such-/Auswahl-Choices und `docs/activities/done/act-2026-05-22-rd-access-window-simplification.md` für Access-Reveal. Dieses Paket ist ein Follow-up für reine Anzeige, nicht für Auswahl oder Access-Entscheidung.

## Scope

- Den Webclient-Pfad für `p3_33.private_look:*`-Choices identifizieren und reproduzieren.
- Eine reine Read-only-Kartenanzeige für Private-Look-Choices bauen oder vorhandene Anzeige-Komponenten so erweitern, dass `selectable: false`-Karten ohne Auswahl-/Plus-Interaktion angezeigt werden.
- `Technician Lover` als Fokusfall absichern: eine R&D-Topkarte wird dem Runner groß/lesbar angezeigt und `Fertig` beendet die Anzeige direkt.
- Ähnliche Private-Look-Nutzer prüfen und, wenn sie denselben Vertrag nutzen, mit derselben Anzeige behandeln: `Deep Thought`, `R&D-Protocol Files` und HQ-Private-Look nach Access.
- Überschrift/Kontexttext so setzen, dass Quelle und Zone klar sind, z. B. Kartenname plus `oberste R&D-Karte` oder `R&D-Karten ansehen`.
- Fokussierte Web-Regressionen für mindestens einen Ein-Karten-Fall und einen Mehrkarten-Fall ergänzen.

## Nicht im Scope

- Keine Änderung an LegalAction-, Choice-, Engine-, Replay- oder StateHash-Verträgen, außer eine kleine UI-spezifische Kennzeichnung ist zwingend nötig und side-sicher.
- Keine Änderung daran, welche Karten durch `private_look` sichtbar werden.
- Keine neue Auswahlfunktion, keine Reorder-Funktion und keine Access-Entscheidung.
- Keine Änderung an Hidden-Zone-Search-Choices, bei denen Karten tatsächlich gewählt werden müssen.
- Keine Offenlegung verdeckter Korp-Karten an die Korp-Gegenseite, in PublicEvents, Reconnect-Payloads, KI-Inputs, Logs oder öffentliche Replay-Ansichten.

## Akzeptanzkriterien

- [ ] `Technician Lover` zeigt beim Blick auf die oberste R&D-Karte ein reines Anzeige-/Bestätigungsfenster ohne Plus-/Auswahlbutton.
- [ ] `Fertig` schließt die Anzeige direkt, ohne vorher eine Karte markieren zu müssen.
- [ ] Der angezeigte Kontext nennt verständlich Quelle und Zone, mindestens für den Fokusfall `Technician Lover` / oberste R&D-Karte.
- [ ] Mehrkarten-Private-Look-Fälle wie `R&D-Protocol Files` bleiben lesbar und verwenden ebenfalls keine Auswahlmarkierung, solange keine Auswahlentscheidung existiert.
- [ ] Echte Such-, Reorder-, Trash-, Access- und Auswahlfenster behalten ihre Auswahlinteraktion.
- [ ] Hidden-Info-Grenzen bleiben unverändert: Nur der berechtigte Runner sieht die privaten Karten.
- [ ] Fokussierte Web-Tests oder ein dokumentierter Browser-Smoke decken Ein-Karten- und Mehrkarten-Private-Look ab.
- [ ] Checks: passende Web-Tests, Typecheck, `git diff --check`.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte im Webclient: `apps/web/app/action-board-ui.ts` (`shouldUseCardChoicePanel`, `cardChoiceUsesReadableCards`) und `apps/web/app/page.tsx` (`CardChoicePanel`).
- Der aktuelle Choice-Vertrag kann vermutlich UI-seitig erkannt werden: `choice.source.startsWith("p3_33.private_look:")`, Kartenoptionen sind `selectable: false`, die schließende Option hat `id: "done"`.
- Für die Bestätigung weiterhin die vorhandene `resolve_choice`-Action mit der `done`-Option nutzen; UI soll nur die falsche Auswahlmetapher entfernen.
- Falls die Engine eine explizite `choice.presentation`-Kennzeichnung braucht, diese nur als Anzeigehinweis einführen und nicht als neue Regelautorität.

## Ergebnisnotiz

Noch offen.
