---
activityId: act-2026-07-31-hq-multiaccess-dialog-clarity
status: inbox
kind: fix
area: web
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

# HQ-Mehrfachzugriff im Zugriffsfenster klar führen

## Ziel

Der Runner soll bei einem HQ-Breach jederzeit erkennen, ob er gerade die
zufällige HQ-Handkarte oder ein im HQ-Root installiertes Upgrade bearbeitet,
welcher Zugriff als Nächstes folgt und ob eine Aktion nur die aktuelle Karte
abschließt oder den gesamten Breach beendet.

## Kontext und Quellen

- Nutzer-Playtest und Screenshot vom 31.07.2026: Ein HQ-Breach enthielt eine
  zufällige HQ-Handkarte und drei installierte Root-Upgrades. Das
  Zugriffsfenster zeigte `Zugriff 1 von 4`, trennte die beiden Quellen aber
  nicht sichtbar.
- Bei einer nicht getrashten Karte lautete die Schaltfläche
  `HQ-Zugriff abschließen`. Das klingt wie das Ende des gesamten Runs, obwohl
  anschließend über die Aktionsfläche `Zugriff auf Karte` der nächste
  Kandidat geöffnet werden kann.
- Die Engine bezeichnet `decline_trash` innerhalb eines Breaches bereits als
  `Weiter accessen`; `apps/web/app/access-reveal-ui.ts` ersetzt diese
  Information derzeit pauschal durch `<Server>-Zugriff abschließen`.
- Verwandter erledigter Engine-Schnitt:
  `docs/activities/done/act-2026-05-17-hq-access-root-upgrade-sequence.md`.
  Dieses Paket ändert dessen Queue- und Hidden-Info-Vertrag nicht.

## Scope

- Im Zugriffsfenster die Quelle der aktuellen Karte klar benennen, mindestens
  als `Zufällige HQ-Handkarte` oder `Installiertes HQ-Upgrade`.
- Den Gesamtfortschritt so darstellen, dass Handkarten- und Root-Zugriffe
  unterscheidbar bleiben, ohne die Reihenfolge künftiger verdeckter
  HQ-Handkarten offenzulegen.
- Die Ablehnen-Aktion für Assets und Upgrades kontextgerecht beschriften:
  - bei weiteren Kandidaten beispielsweise `Nicht trashen – weiter zur
    nächsten Karte`;
  - beim letzten Kandidaten beispielsweise `Nicht trashen – Zugriff beenden`.
- `HQ-Zugriff abschließen` aus dem kartenbezogenen Entscheidungsfenster
  entfernen. Falls der bestehende technische Zwischenschritt über die
  Aktionsfläche erhalten bleibt, muss der Dialog den nächsten Schritt
  unmissverständlich ankündigen.
- Die vorhandenen `LegalActions` und den Breach-Fortschritt als alleinige
  Quelle für Beschriftung und angebotene Aktionen verwenden.

## Nicht im Scope

- Keine Änderung an Access-Anzahl, Kandidatenauswahl, Queue-Reihenfolge,
  Trash-Kosten, Agenda-Steal oder Run-Ende.
- Keine automatische Action-Einreichung und kein Überspringen eines
  erforderlichen `LegalAction`-/`applyAction`-Schritts.
- Kein Redesign der gesamten Run-Aktionsfläche oder der übrigen
  Spieloberfläche.
- Keine Offenlegung noch nicht accesseter HQ-Handkarten oder verdeckter
  Root-Karten.

## Akzeptanzkriterien

- [ ] Ein HQ-Breach mit einer Handkarte und mehreren Root-Upgrades zeigt für
      jede aktuelle Karte ihre korrekte Quelle und einen verständlichen
      Fortschritt.
- [ ] Solange weitere Kandidaten existieren, klingt die Ablehnen-Aktion nicht
      nach Ende des Runs oder des gesamten Breaches.
- [ ] Beim letzten Kandidaten ist erkennbar, dass nur der Zugriffsvorgang
      beendet wird; die Formulierung behauptet kein vorzeitiges Run-Ende.
- [ ] Der Runner findet den nächsten legalen Zugriff ohne Rätselraten; ein
      eventuell verbleibender Wechsel zur Aktionsfläche wird ausdrücklich
      erklärt.
- [ ] Remote-, R&D- und Archiv-Zugriffe behalten passende, nicht irreführende
      Beschriftungen.
- [ ] UI-Regressionen decken nichtfinalen und finalen `decline_trash`, HQ-
      Handkarte, HQ-Root-Upgrade und die fehlende nächste Access-Action ab.
- [ ] LegalActions, Hidden-Info-Projektion, PublicEvents, Replay und StateHash
      bleiben unverändert.

## Umsetzungshinweise

- Primärer Folgeagent: `small-adjustments-agent`.
- Ausgangspunkte sind `apps/web/app/access-reveal-ui.ts`,
  `apps/web/app/action-board-ui.ts` und die Access-Review-Derivation.
- Nicht allein auf den deutschen Engine-Labeltext prüfen. Die Entscheidung
  sollte auf Action-Typ, Access-Origin und nachweisbarem Breach-Fortschritt
  beruhen.
- Die visuelle Quelle darf nur aus bereits runner-sichtbaren Access-Daten
  abgeleitet werden.

## Ergebnisnotiz

Noch offen.
