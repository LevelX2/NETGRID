# Vollständige Ereignisicons für Meldungsfenster

## Status

In Umsetzung auf `codex/all-window-event-icons` im Worktree
`C:\Projekte\NETGRID_ALL_WINDOW_EVENT_ICONS`.

## Quelle und Zielprüfung

Die Nutzeranforderung verlangt eine vollständige Inventur der aktuellen KI- und
Spielmeldungsfenster, die Ergänzung fehlender großer Ereignisicons im bestehenden
Kuiper-Space-Stil und den Einbau im bekannten kompakten Layout. Der Endzustand ist
ohne weitere Fachentscheidung bestimmbar.

## Gesamtziel

Jede tatsächlich präsentierte KI-, Aktions- oder Kartenmeldung besitzt ein sofort
erkennbares großes Ereignisicon. Bestehende Spezialicons für Run, Zugriff, Agenda,
Schaden, Trace, Pumpen und Trash bleiben unverändert. Fehlende Familien erhalten
eigene Motive; unbekannte zukünftige Aktionsmeldungen erhalten einen gestalteten
generischen Fallback statt eines leeren Bereichs.

## Annahmen und Nicht-Ziele

- In Scope sind `OpponentActionOverlay`, `CardChoicePanel` und die darin verwendete
  gemeinsame Iconklassifizierung.
- `DamageImpactOverlay`, `AccessReviewModals` und `SecurityPurgeChoicePanel` sind
  bereits vollständig versorgt.
- `GameOverModal` besitzt ein eigenes großes Gewinner-/Verlierermotiv.
- `RunTimelineOverlay`, `ScoredAgendaOverlay`, Options-, Katalog-, Debug- und
  Aktionsleistenfenster sind Werkzeug- oder Statusfenster und keine einzelnen
  Ereignismeldungen. Sie werden nicht mit einem zweiten 128-Pixel-Icon belastet.
- Karten- und Hidden-Info-Verträge werden nicht verändert. Die Klassifizierung
  verwendet nur bereits öffentliche Cue- und Choice-Metadaten.
- Keine Änderung an Engine, KI-Entscheidungslogik, Regeln oder Ereignisreihenfolge.

## Inventar

| Präsentationsfläche | Bisherige Abdeckung | Fehlende Fälle | Ziel |
| --- | --- | --- | --- |
| `OpponentActionOverlay` | Agenda, ICE passiert, Zugriff, Trash, Trace, Pumpen, Runstart mit Ziel | Ziehen, Credits, Installieren, Ausspielen, Rezzen, Vorrücken, Tags entfernen, Purge, Fähigkeit, Entscheidung, Runende, Zugende und unbekannte Actions | Vollständige Klassifizierung mit Fallback |
| `CardChoicePanel` | Nur Choice-Fälle mit Agenda-, Access-, Trash-, Trace- oder Pump-Ambiente | Suche/Ziehen, Installation, Credits, Kartenfähigkeit und neutrale Auswahl | Quell-/Titelklassifizierung mit Choice-Fallback |
| `DamageImpactOverlay` | Net-, Meat- und Core-Damage | keine | unverändert |
| `AccessReviewModals` | Zugriff und kombinierter Zugriffsschaden | keine | unverändert |
| `SecurityPurgeChoicePanel` | Trash/Purge | keine | unverändert |
| `GameOverModal` | großes Ergebnisbild | keine Ereignisicon-Lücke | unverändert |
| `RunTimelineOverlay` | Route-Icon, Zieltext und Timeline | keine Ereignisicon-Lücke | unverändert |
| `ScoredAgendaOverlay` | Agendakarten und Agenda-Ambiente | keine Ereignisicon-Lücke | unverändert |

## Controller-Invarianten

1. Genau ein Paket ist aktiv.
2. Spezialambiente hat Vorrang vor generischen Action-Typen.
3. `start_run` bleibt zielabhängig; `continue_run` mit Bewegung bleibt ICE-Passieren.
4. Verdeckte Installationen erhalten nur ein abstraktes Installationsmotiv und
   niemals Kartenidentität oder Kartentyp aus verdeckten Daten.
5. Jede `OpponentActionCue` ergibt ein nichtleeres Icon.
6. Jede neutrale Kartenwahl ergibt mindestens das Choice-Icon.
7. 128 x 128 Pixel bleiben die stabile Layoutfläche; Fenster werden nicht allein
   wegen neuer Icons höher.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- Fehlende spezifische Zuordnung fällt auf `action` beziehungsweise `choice`
  zurück und blockiert die Präsentation nicht.
- Rote fokussierte Tests oder Typecheck-Fehler blockieren den Paketabschluss.
- Hidden-Info-Leaks, unklare neue öffentliche Payloads oder notwendige Engine-
  Änderungen sind Sicherheitsblocker und werden nicht durch UI-Heuristiken gelöst.

## State Machine

`Inventar -> Assets -> Integration -> visuelle Verifikation -> main-Abgleich -> Merge`

## Paketfolge

### P1: Inventar und Vertrag

- Ziel: Alle relevanten Präsentationsflächen und fehlenden Actionfamilien belegen.
- Artefakt: dieses Prozessdokument.
- Checks: Quellenabgleich, `git diff --check`.
- Done-Gate: Scope, Nicht-Ziele und vollständige Mappingfamilien sind dokumentiert.
- Commit: `docs(web): inventory missing window event icons`.

### P2: Iconfamilien und Assets

- Ziel: Fehlende Motive im bestehenden dunklen, leuchtenden 3D-Cyberspace-Stil
  unter `apps/web/public/icons/window-events/` ergänzen.
- Familien: `draw-card`, `gain-credit`, `install-card`, `play-card`, `rez-card`,
  `advance-card`, `remove-tag`, `purge`, `card-ability`, `choice`, `run-end`,
  `turn-end`, `action`.
- Checks: Dateien vorhanden und lesbar, stabile 1:1-Abmessungen, visuelle Übersicht,
  `git diff --check`.
- Done-Gate: Jede Familie besitzt ein klar unterscheidbares Motiv ohne Text.
- Commit: `feat(web): add remaining window event icon assets`.

### P3: Klassifizierung und Layoutintegration

- Ziel: Action-Cues und neutrale Kartenwahlen vollständig auf Iconfamilien abbilden.
- Artefakte: `window-event-icon-kind.ts`, `WindowEventIcon.tsx`,
  `OpponentActionOverlay.tsx`, `CardChoicePanel.tsx`, `globals.css` und Tests.
- Checks: fokussierte Vitest-Suiten, Web-Typecheck, `git diff --check`.
- Done-Gate: Kein Cue und keine Choice kann ohne Icon gerendert werden; das
  bestehende kompakte Karten-links/Icon-rechts-oben/Text-rechts-unten-Layout bleibt.
- Commit: `feat(web): cover all action windows with event icons`.

### P4: Gesamtverifikation und Abschluss

- Ziel: Repräsentative Fensterfamilien auf Desktop und Mobile visuell prüfen und
  das Ergebnis in diesem Dokument festhalten.
- Checks: fokussierte Tests, Web-Typecheck, Browser-Screenshots und Pixelprüfung,
  `git diff --check`.
- Done-Gate: keine Überlappungen, keine Höhenregression, Assets sichtbar, Branch
  sauber.
- Commit: `docs(web): verify complete window event icon coverage`.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im oben genannten Worktree.
- Ein fachlicher Commit pro Paket.
- Vor Abschluss aktuelles lokales `main` in den Arbeitsbranch integrieren.
- Danach finale Checks und lokaler Merge nach `main`.
- Kein Push und kein Pull Request.
- Die fremde Hauptworkspace-Änderung `apps/web/next-env.d.ts` bleibt unberührt.

## Controller-Prompt-Kern

```text
/Goal Arbeite den Prozess "Vollständige Ereignisicons für Meldungsfenster"
vollständig und sequenziell von P1 bis P4 ab und merge den abgeschlossenen
Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, die verbindliche Wissensbasis und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_ALL_WINDOW_EVENT_ICONS
auf Branch codex/all-window-event-icons. Nutze den Hauptworkspace nur für den
finalen Merge. Arbeite immer nur am aktuellen Paket, führe Paketchecks aus und
committe jedes abgeschlossene Paket. Stoppe bei Sicherheitsblockern mit einem
Blocker-Report. Nach Abschluss: aktuelles main integrieren, final verifizieren,
lokal nach main mergen, main prüfen, Worktree entfernen und /Goal erst dann als
complete markieren.
```

## Abschlusskriterien

- Inventar und Scope sind versioniert.
- Alle 13 fehlenden Iconfamilien sind vorhanden und visuell geprüft.
- Cue- und Choice-Klassifizierung haben vollständige Tests inklusive Fallbacks.
- Web-Typecheck und fokussierte UI-Tests sind grün.
- Arbeitsbranch ist lokal nach `main` gemerged; der Worktree ist entfernt.
