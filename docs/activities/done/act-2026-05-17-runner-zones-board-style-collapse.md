---
activityId: act-2026-05-17-runner-zones-board-style-collapse
status: done
kind: fix
area: ui
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget: board UX / runner zones
blockedBy: []
resultArtifacts:
  - apps/web/app/page.tsx
  - apps/web/app/globals.css
checks:
  - "Browser-Check 1280x720: Runner-Zonen Grip/Heap/Stack einzeln, je 165px hoch, keine Überlappung"
  - "Browser-Check 390x900: Runner-Zonen innerhalb der Boardbreite, keine Zonenüberlappung"
  - "Browser-Check Collapse: Heap und Archive lokal ein-/ausklappbar"
  - "corepack pnpm --filter @netgrid/web typecheck"
  - "corepack pnpm --filter @netgrid/web test"
  - "git diff --check"
relatedActivities:
  - act-2026-05-17-corp-runner-zones-compact-rig-row
  - act-2026-05-17-board-zone-identity-icons
---

# Runner-Zonen wieder an Board-Stil angleichen und Heap/Archive einklappbar machen

## Ziel

Die kompakte Anzeige von `Grip`, `Stack` und `Heap` neben dem Runner-Rig soll nicht wie separate Info-Cards wirken, sondern wieder zur bestehenden Board-Zonensprache passen. `Heap` und `Archive` sollen einheitlich einklappbar sein, damit öffentliche Ablagestapel bei Bedarf Platz sparen, ohne ihre Einsehbarkeit grundsätzlich zu verlieren.

## Kontext und Quellen

- Folgefeedback vom 2026-05-17 nach `act-2026-05-17-corp-runner-zones-compact-rig-row`: Die neue kompakte Anzeige rechts neben dem Rig ist funktional näher am Ziel, wirkt aber stilistisch zu fremd zum restlichen Board.
- Gewünschte Richtung: stärker zurück zum Stil von `Rig`, HQ, R&D/F&E und Archive: vertikale Zonennamen bzw. 90-Grad-Beschriftung, Board-Rahmen, keine kartenartigen Info-Panels für reine Zähler.
- `Grip` ist die Runner-Hand. Aus Korp-Sicht darf sie nur als Zähler erscheinen, ohne Karten-Slot, ohne Platzhalterfläche und ohne Zusatztext `Hand`.
- `Stack` soll ebenfalls count-only bleiben, ohne Zusatztext `Deck` und ohne Kartenrücken-/Kartenslot-Darstellung, sofern kein bestehender Boardbereich eine solche Rückseitenlogik vorgibt.
- `Heap` bleibt eine öffentliche Ablagezone mit sichtbaren/überlagerten Karten, soll aber einklappbar sein. Dasselbe Muster soll auch für `Archive` gelten.
- Der geplante spätere Icon-Schnitt `act-2026-05-17-board-zone-identity-icons` soll mitgedacht werden: unten links im Zonenbereich sollte Platz für ein künftiges Wiedererkennungs-Icon bleiben.

## Scope

- Aktuelle `RunnerOpponentZonesStrip`-/Runner-Zonen-Darstellung visuell an die bestehende Board-Zonensprache angleichen.
- `Grip` als schmale Board-Zone darstellen:
  - vertikaler/gedrehter Zonentitel `GRIP` wie bei den übrigen Zonen;
  - nur Count/Handlimit, z. B. `2 von 5 Karten`;
  - kein Zusatzlabel `Hand`;
  - kein Karten-Slot und keine `Inhalte verborgen`-Fläche.
- `Stack` als schmale Board-Zone darstellen:
  - vertikaler/gedrehter Zonentitel `STACK`;
  - nur Count, z. B. `39 Karten`;
  - kein Zusatzlabel `Deck`;
  - keine verdeckten Karteninhalte und keine unnötige Kartenrücken-Darstellung.
- `Heap` als Board-Zone im gleichen Stil darstellen:
  - vertikaler/gedrehter Zonentitel `HEAP`;
  - Count sichtbar halten;
  - öffentliche Karten bei ausgeklapptem Zustand wie bisher sichtbar/überlagert anzeigen;
  - einklappbar machen, ohne die Zone komplett verschwinden zu lassen.
- `Archive` mit demselben Einklappmuster ausstatten:
  - Count und Zonentitel bleiben auch eingeklappt sichtbar;
  - öffentliche Archivkarten sind ausgeklappt sichtbar;
  - eingeklappt spart die Zone Platz.
- Ein einheitliches, unaufdringliches Toggle im linken Zonenbereich vorsehen, das ein- und ausklappt und per Tooltip/Accessible Label verständlich ist.
- Collapse-Zustände pro Browser/View lokal halten; sie sollen keine Engine-, Replay-, StateHash- oder Multiplayer-Spielzustandsänderung sein.
- Desktop- und schmale Viewports prüfen, damit `Grip`, `Stack`, `Heap`, `Rig` und `Archive` nicht überlappen und die Board-Zeilen stabil bleiben.

## Nicht im Scope

- Keine Änderung an Runner-Hand-, Stack-, Heap- oder Archives-Regeln.
- Keine Anzeige verdeckter Runner-Hand- oder Stack-Inhalte für die Korp.
- Keine Anzeige verdeckter Archives-/R&D-/HQ-Informationen, die nicht bereits legal öffentlich sichtbar sind.
- Keine Änderung an PlayerView-, LegalAction-, Replay-, StateHash- oder Hidden-Info-Verträgen.
- Keine Umsetzung der späteren Zone-Identity-Icons; nur Platz/Anschlussfähigkeit dafür berücksichtigen.
- Kein generelles Board-Redesign über diese Zonen und das gemeinsame Einklappmuster hinaus.

## Akzeptanzkriterien

- [x] `Grip`, `Stack` und `Heap` wirken visuell wie Board-Zonen und nicht wie separate Info-Cards.
- [x] `Grip` zeigt nur `GRIP` plus Count/Handlimit und keine Zusatzzeile `Hand`, keinen Karten-Slot und keine Hidden-Content-Fläche.
- [x] `Stack` zeigt nur `STACK` plus Count und keine Zusatzzeile `Deck`, keine Inhalte und keine unnötige Kartenrücken-Fläche.
- [x] `Heap` zeigt im ausgeklappten Zustand öffentliche Heap-Karten weiterhin sichtbar/überlagert und bleibt im eingeklappten Zustand als Zählerzone erkennbar.
- [x] `Archive` nutzt dasselbe Einklappmuster und bleibt eingeklappt als Zählerzone erkennbar.
- [x] Das Ein-/Ausklappen ist lokal pro Browser/View und verändert keinen Spielzustand, keine Events und keine Replays.
- [x] Desktop- und Mobile-/Schmalviewport-Check belegen: keine Text-/Kartenüberlappung, stabile Rig-Zeile, kein fremder Panel-Stil.

## Umsetzungshinweise

- Primärer Folgeagent: `small-adjustments-agent`.
- Wahrscheinliche Startpunkte:
  - `apps/web/app/page.tsx` rund um `RunnerRigStrip`, `RunnerOpponentZonesStrip`, `SideZoneFrame`, Archive-/Heap-Rendering und Zonencounts.
  - `apps/web/app/globals.css` für die Board-Zonen-Optik, Rotationslabels, kompakte Zähler und Collapse-States.
  - bestehende Web-/Chronik-/Board-Tests oder ein fokussierter UI-Smoke, falls bereits vorhanden.
- Begriffe in sichtbarer UI knapp halten: `GRIP`, `STACK`, `HEAP`, `ARCHIVE` bzw. bestehende lokale Schreibweise verwenden.
- Für den Toggle bevorzugt ein kleines Icon-/Button-Muster mit Tooltip/Accessible Label verwenden, keine langen Erklärungstexte im Board.

## Ergebnisnotiz

`Grip`, `Heap` und `Stack` floaten in der Korp-Sicht nun als drei einzelne Board-Zonen direkt beim Runner-Rig. `Grip` und `Stack` bleiben reine Zählerzonen, behalten aber über die vorhandene Zonen-Größeneinstellung die normale Zonenhöhe; `Heap` nutzt ebenfalls die normale Zonenhöhe und zeigt öffentliche Karten ausgeklappt weiter überlappt. `Heap` und `Archive` haben dasselbe lokale Icon-Toggle-Muster; die Collapse-Zustände bleiben React-UI-State und berühren keine Engine-, Replay-, StateHash-, Event- oder Multiplayer-Daten. Nach Nutzerfeedback wurden Labelgröße und linke Lead-Spalte an den Rig-Stil angenähert, die Toggle-Spalte verschmälert und der schmale Viewport gegen Rechts-Wrap der Runner-Zonen stabilisiert.

Verifiziert mit Web-Typecheck, Web-Testlauf, `git diff --check` sowie Browser-Messungen bei 1280x720 und 390x900. Der Collapse-Smoke bestätigt `Heap einklappen`/`ausklappen` und `Archive einklappen`/`ausklappen`.
