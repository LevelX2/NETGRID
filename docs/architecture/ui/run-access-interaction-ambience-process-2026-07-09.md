# Run-, Zugriff- und Interaktions-Ambience Prozess

Status: in_progress
Stand: 2026-07-09
Primaerer Agent: release-implementation-agent
Arbeitsbranch: `codex/run-access-ambience`
Arbeits-Worktree: `C:\Projekte\NETGRID_RUN_ACCESS_AMBIENCE`

## Quelle und Vorgabe

Ausgangspunkt ist der Nutzerwunsch, Run-bezogene Fenster visuell klarer zu unterscheiden:

- `ICE passiert` beziehungsweise Bewegung im Run soll anders wirken als ein Zugriff auf eine Karte.
- Zugriff soll auch dann eindeutig nach Zugriff aussehen, wenn die zugegriffene Karte selbst ein ICE ist.
- Die Unterscheidung soll ueber dezente, stimmungsvolle Hintergrundgrafiken erfolgen, die mit etwa 10 bis 15 Prozent sichtbar durchscheinen.
- Zusaetzlich sollen Damage-, Trace-, Pumpen- und Trashfenster nach derselben Logik eigene Ambience erhalten.

## Zielpruefung

Die Vorgabe ist fuer automatische Umsetzung ausreichend praezise.

- Gesamtziel: visuelle Ambience-Schicht fuer mehrere UI-Zustandstypen, ohne Regel- oder Datenmodellveraenderung.
- Reihenfolge: Prozessartefakt, Assets, UI-Anbindung, Tests/Review, Merge.
- In Scope: Web-UI, eigene Projektassets, CSS/Komponentenklassen, fokussierte Tests.
- Nicht-Ziele: Engine-Regeln, LegalActions, PlayerView-Vertraege, Replay, StateHash, offizielle Artworks, Kartendatenbank-Abhaengigkeiten.
- Abnahme: sichtbare Fenster nutzen unterscheidbare Ambience-Hintergruende; Text bleibt lesbar; Hidden-Info-Grenzen bleiben unveraendert.

Kleine Annahme: Der Nutzerbegriff `Trechfenster` wird als `Trace-Fenster` interpretiert. `Brain Damage` wird im aktuellen NETGRID-Code als vorhandener `core`-Damage-Kontext behandelt, waehrend `net` und `meat` ebenfalls unter dem Damage-Ambience-Fenster bleiben.

## Gesamtziel

Die Web-UI erhaelt einen kleinen, konsistenten Ambience-Satz fuer sechs Praesentationszustaende:

1. Bewegung / ICE passiert
2. Zugriff
3. Damage
4. Trace
5. Pumpen / Breaker-Fokus
6. Trashen

Jeder Zustand bekommt eine eigene, projektlokale, abstrakte Hintergrundgrafik und eine gedimmte CSS-Schicht. Die Grafiken duerfen keine offiziellen Karten-, Logo-, Frame- oder Cardback-Assets enthalten und keine verdeckte Karteninformation transportieren.

## Annahmen

- Assets werden unter `apps/web/public/backgrounds/` versioniert.
- Die Ambience-Schicht ist dekorativ und darf per CSS deaktivierbar bleiben, wenn `prefers-reduced-motion` oder kleine Viewports Zurueckhaltung erfordern.
- Falls ein Fenster mehrere fachliche Zustaende kombiniert, gewinnt der aktuell entscheidungsrelevante Zustand: Access vor Movement, Damage vor normalem Gegnercue, Trace/Pump/Trash vor generischem Choice-Fenster.
- Bestehende Startscreen- oder Branding-Assets werden nicht kopiert oder uebermalt; neue Assets werden eigenstaendig erzeugt.

## Nicht-Ziele

- Kein Redesign der gesamten Spieloberflaeche.
- Keine neue Animation, die den Spielzustand veraendert oder Bedienung verdeckt.
- Keine Aenderung an Engine, Server, KI, LegalAction-Erzeugung, `applyAction`, Replay oder StateHash.
- Keine Anzeige von Kartentiteln, Bildpfaden, Definition-IDs oder Queue-Informationen ausserhalb bereits legal sichtbarer PlayerView-/Event-Daten.
- Keine externe Asset-Abhaengigkeit und keine offiziellen fremden Artworks.

## Controller-Invarianten

- Die Rules Engine bleibt alleinige Regelautoritaet.
- UI-Ambience nutzt nur bereits vorhandene UI-Zustaende, LegalActions, PlayerView und side-sichere Events.
- Ambience-Assets enthalten keinen Text, keine erkennbaren realen Kartendaten und keine Logos.
- Hintergrundgrafiken liegen visuell unter Inhalt und Controls; Lesbarkeit hat Vorrang.
- Opazitaet und Overlay werden so gewaehlt, dass die Grafik erkennbar, aber nicht dominant ist.
- Bestehende fremde Aenderungen im Hauptworkspace bleiben unangetastet.

## Automatische Fehlerbehandlung

- Wenn ein Bildasset nicht sauber genug ist, einmal gezielt neu erzeugen oder lokal mit bestehender Bildverarbeitung skalieren/komprimieren.
- Wenn ein Fenster im Code keine eigene Komponente besitzt, wird die Ambience ueber die naechstbeste vorhandene Wrapper-Klasse angebunden.
- Wenn ein Test zu breit wird, bevorzugt ein kleiner CSS-/Source-Test statt Browser-Flake.
- Wenn visuelle QA wegen Serverstart scheitert, dokumentiert Paket 3 den konkreten Grund und fuehrt alle statisch moeglichen Checks aus.

## Sicherheitsblocker

Stop ohne Rueckfrage, wenn:

- fuer die Ambience verdeckte Kartenidentitaeten, private Payloads oder FullState-Daten noetig waeren;
- offizielle oder fremde Artworks als einzige praktikable Quelle erscheinen;
- ein Trace-, Pump-, Trash- oder Damage-Fenster nur durch Engine-/LegalAction-Vertragsaenderungen unterscheidbar waere;
- der finale Merge einen fachlichen Konflikt mit parallelen main-Aenderungen erzeugt.

Removal Condition: Blockerbericht mit betroffener Datei, Ursache, sicherer Alternative und noetiger Nutzerentscheidung.

## State Machine

```text
P0_process_artifact
  -> P1_assets
  -> P2_ui_integration
  -> P3_verification_and_review
  -> integrate_main
  -> complete
```

Fehlerpfade:

```text
package_active -> package_debug -> package_active
package_active -> blocker_report -> stop
integrate_main -> conflict_review -> integrate_main
integrate_main -> blocker_report -> stop
```

## Paketfolge

### UIAMB-00: Prozessartefakt

Ziel: Diesen Prozess als verbindliche Arbeitsgrundlage im Worktree anlegen.

Eingangsvoraussetzungen:

- Worktree `C:\Projekte\NETGRID_RUN_ACCESS_AMBIENCE` existiert.
- Branch `codex/run-access-ambience` ist aktiv.

Konkrete Arbeit:

- Prozessartefakt unter `docs/architecture/ui/` anlegen.
- Paketfolge, Sicherheitsgrenzen und Checks definieren.

Kernartefakte:

- `docs/architecture/ui/run-access-interaction-ambience-process-2026-07-09.md`

Tests/Checks:

- `git diff --check`

Done-Gate:

- Artefakt ist versioniert und beschreibt alle sechs Ambience-Zustaende.

Commit-Message:

- `docs(ui): plan interaction ambience process`

### UIAMB-01: Ambience-Assets

Ziel: Sechs eigene, abstrakte Hintergrundgrafiken erzeugen und projektlokal speichern.

Konkrete Arbeit:

- Assets fuer Bewegung, Zugriff, Damage, Trace, Pumpen und Trashen erzeugen.
- Keine Texte, Logos, Kartenrahmen, offiziellen Artworks oder kartenspezifischen Motive.
- Dateien unter `apps/web/public/backgrounds/` ablegen.
- Asset-Prompts und finale Pfade im Paketfortschritt dokumentieren.

Kernartefakte:

- `apps/web/public/backgrounds/run-movement-ambience.png`
- `apps/web/public/backgrounds/access-scan-ambience.png`
- `apps/web/public/backgrounds/damage-impact-ambience.png`
- `apps/web/public/backgrounds/trace-signal-ambience.png`
- `apps/web/public/backgrounds/pump-breaker-ambience.png`
- `apps/web/public/backgrounds/trash-shred-ambience.png`

Tests/Checks:

- Bilddateien existieren und sind lokal inspizierbar.
- `git diff --check`

Done-Gate:

- Alle sechs Assets sind versioniert, nicht dominant, textfrei und projekt-eigen.

Commit-Message:

- `assets(ui): add interaction ambience backgrounds`

### UIAMB-02: UI-Anbindung

Ziel: Die vorhandenen UI-Fenster verwenden die passenden Ambience-Schichten.

Konkrete Arbeit:

- Zugriff: `AccessRevealModal`/Access-Reveal-CSS mit Access-Ambience hinterlegen.
- Damage: Damage-Impact-Fenster mit Damage-Ambience hinterlegen; `net`, `meat` und `core` bleiben fachlich unveraendert.
- Bewegung/ICE passiert: RunTimeline-/Run-Fenster fuer Movement mit eigener Bewegungs-Ambience versehen.
- Trace: Trace-bezogene Choice-/Action-Fenster mit Trace-Ambience versehen, soweit der vorhandene UI-State das side-sicher hergibt.
- Pumpen: Pump-/Breaker-bezogene Choice-/Action-Fenster mit Pump-Ambience versehen, soweit der vorhandene UI-State das side-sicher hergibt.
- Trashen: Trash-/Destroy-/Zahlungsfenster mit Trash-Ambience versehen, soweit der vorhandene UI-State das side-sicher hergibt.
- CSS so kapseln, dass Ambience nicht auf normale Karten, Chronicle oder globale Panels ausblutet.

Kernartefakte:

- `apps/web/features/actions/AccessReviewModals.tsx`
- `apps/web/features/actions/OpponentActionOverlay.tsx` oder vorhandene Damage-Komponente, falls separat
- `apps/web/features/game-board/RunTimelineOverlay.tsx`
- `apps/web/app/globals.css`
- fokussierte Tests unter `apps/web/app/*.test.ts`

Tests/Checks:

- fokussierte Web-Tests fuer Klassen-/Style-Vertraege.
- `git diff --check`

Done-Gate:

- Zugriff, Damage, Movement, Trace, Pumpen und Trashen besitzen unterscheidbare Ambience-Hooks.
- Existing hidden-info und action-routing Tests bleiben unveraendert gruen oder nicht betroffen.

Commit-Message:

- `feat(ui): add interaction ambience states`

### UIAMB-03: Verifikation und Review

Ziel: Paketstand verifizieren, Umsetzung kurz dokumentieren und fuer main-Integration vorbereiten.

Konkrete Arbeit:

- Relevante Tests ausfuehren.
- Visuelle Smoke-Pruefung oder statische Fallback-Pruefung dokumentieren.
- Implementation-Notiz unter `docs/reviews/ui/` anlegen.

Kernartefakte:

- `docs/reviews/ui/run-access-interaction-ambience-review-2026-07-09.md`

Tests/Checks:

- `git diff --check`
- fokussierte Web-Tests
- optionaler Browser-Smoke ueber das Projekt-Startscript, falls in der Laufzeit praktikabel

Done-Gate:

- Review nennt geaenderte Dateien, ausgefuehrte Checks, Grenzen und Restpunkte.

Commit-Message:

- `docs(ui): review interaction ambience implementation`

## Verifikationsregeln

- Nach jedem Paket `git diff --check` ausfuehren.
- Nur paketzugehoerige Dateien stagen.
- Jedes abgeschlossene Paket separat committen.
- Vor finalem Merge mindestens fokussierte Web-Tests und `git diff --check` ausfuehren.
- Bei nicht ausgefuehrten Checks konkrete Ursache und Risiko dokumentieren.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschliesslich im Worktree `C:\Projekte\NETGRID_RUN_ACCESS_AMBIENCE`.
- Branch: `codex/run-access-ambience`.
- Hauptworkspace `C:\Projekte\NETGRID` nur fuer finalen lokalen Merge nach `main`.
- Kein Push und kein Pull Request.
- Final bevorzugt Fast-Forward-Merge nach `main`; Merge-Commit nur mit Begruendung.
- Worktree nach erfolgreichem Merge entfernen.

## Controller-Prompt-Kern

```text
/Goal Arbeite den Run-, Zugriff- und Interaktions-Ambience-Prozess vollstaendig und sequenziell von UIAMB-00 bis UIAMB-03 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die Pflichtseiten der Wissensbasis und docs/architecture/ui/run-access-interaction-ambience-process-2026-07-09.md.
Arbeite ausschliesslich im Worktree C:\Projekte\NETGRID_RUN_ACCESS_AMBIENCE auf Branch codex/run-access-ambience.
Nutze den Hauptworkspace nur fuer den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Fuehre Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rueckfrage und schreibe einen Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main pruefen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Alle sechs Ambience-Zustaende sind implementiert oder sicher begrenzt dokumentiert.
- Alle erzeugten Assets liegen im Projekt und sind versioniert.
- Fokussierte Tests pruefen die wichtigsten Ambience-Klassen oder CSS-Vertraege.
- Der Arbeitsbranch ist nach `main` integriert.
- Der Worktree ist entfernt.
- Keine Hidden-Info-, Engine-, Replay- oder StateHash-Vertraege wurden geaendert.
