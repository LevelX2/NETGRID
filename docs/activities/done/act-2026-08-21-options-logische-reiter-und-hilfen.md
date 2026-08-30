---
activityId: act-2026-08-21-options-logische-reiter-und-hilfen
status: done
kind: concept
area: ui
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-08-21
startedAt: 2026-08-21
completedAt: 2026-08-21
branch:
releaseTarget:
blockedBy:
  - act-2026-08-21-infofenster-schwebende-einblendung
resultArtifacts:
  - apps/web/features/settings/OptionsPanel.tsx
  - apps/web/app/options-tabs.test.ts
  - apps/web/app/globals.css
  - apps/web/messages/de.json
  - apps/web/messages/en.json
  - apps/web/messages/fr.json
checks:
  - "26 fokussierte Web-Tests bestanden"
  - "Firefox: 390x844 und 1280x900 geprüft"
  - "Web-Typecheck: nur bekannte unabhängige Baseline-Fehler in ai-turn-plan-comparison-ui.test.ts"
---

# Optionen in logische Reiter gliedern und verständlicher erklären

## Ziel

Die stetig gewachsene Optionsoberfläche wird in zwei bis drei leicht
verständliche Reiter gegliedert. Einstellungen sind schneller auffindbar und
erklärungsbedürftige Spielablauf-Optionen erläutern ihre Wirkung dort, wo die
Entscheidung getroffen wird, ohne die Oberfläche erneut mit dauerhaft
sichtbaren Hilfstexten zu überladen.

## Kontext und Quellen

- Nutzeridee vom 2026-08-21: Die Optionsliste wird zunehmend lang. Gewünscht
  sind zwei oder drei logisch sortierte Reiter sowie zusätzliche Tooltips an
  Stellen, deren Bedeutung insbesondere beim Gameflow nicht unmittelbar klar
  ist.
- `apps/web/features/settings/OptionsPanel.tsx` rendert derzeit alle Bereiche
  in einer flachen `optionsContent`-Liste: Sitzung, Sprache, Farbschema,
  Kartenanzeige, Tooltip-Anzeige, Kartenbilder, Chronikdetails, sieben
  Kartengrößen, Gameplay, KI-Steuerung, Infofenster, Audio, Build-Information
  und Systemstatus.
- `GameplaySettings` mischt Ablaufautomatisierung mit Darstellungs- und
  Debugoptionen. Ein einzelner Hilfsabsatz erklärt die Gesamtgruppe, macht aber
  die Folgen einzelner Einstellungen nicht immer deutlich.
- Einzelne Modusknöpfe besitzen bereits native `title`-Texte und manche
  Bereiche sichtbare `settingsHelp`-Texte. Es existiert jedoch noch kein
  einheitlicher, per Tastatur und Touch gut erreichbarer Erklärungskanal für
  erklärungsbedürftige Optionen.
- Die vorgelagerte Activity
  `act-2026-08-21-infofenster-schwebende-einblendung` ergänzt neue
  Infofenster-Einstellungen in derselben Datei. Dieses Paket folgt danach,
  damit die endgültige Gruppierung nur einmal vorgenommen wird.

## Scope

- Die Optionsoberfläche in höchstens drei nutzerorientierte Reiter gliedern.
  Als Ausgangshypothese prüfen:
  - „Spielablauf“ für Automatisierungen, KI-Steuerung und Aktionshinweise;
  - „Darstellung“ für Sprache, Theme, Karten, Chronik, Größen, Layout und Audio;
  - „Sitzung & System“ für Reconnect-/Sitzungszugriff, Buildinformationen und
    Systemstatus.
- Vor der Umsetzung jede aktuelle Einstellung genau einem Reiter zuordnen und
  die Trennung des derzeit gemischten `GameplaySettings`-Blocks zulassen. Die
  sichtbaren Begriffe sollen den tatsächlichen Nutzerzweck beschreiben, nicht
  die interne React-Komponentenstruktur.
- Reiter als semantisch korrekte, per Maus, Touch und Tastatur bedienbare
  Tablist umsetzen. Fokusführung, aktive Kennzeichnung und Zuordnung zwischen
  Tab und Tabpanel müssen für Screenreader nachvollziehbar sein.
- Die Reiternavigation im normalen Optionspanel und im Optionsdialog
  konsistent darstellen. Auf kleinen Viewports bleiben alle Reiter ohne
  abgeschnittene Beschriftung oder unerreichbare Inhalte bedienbar.
- Für missverständliche oder folgenreiche Einstellungen kurze kontextnahe
  Erklärungen ergänzen, insbesondere für die automatischen Ablaufoptionen,
  KI-Modi und die zeitliche beziehungsweise interaktive Wirkung des
  Infofensters. Tooltips beziehungsweise Infohinweise müssen per Hover, Fokus
  und Touch erreichbar und als zugängliche Beschreibung mit dem jeweiligen
  Steuerelement verknüpft sein.
- Hilfetexte knapp und wirkungsorientiert formulieren: Was ändert die Option,
  wann greift sie, und ist sie nur lokal oder Teil des Match-State? Bereits
  klare Beschriftungen nicht mit redundanten Tooltips versehen.
- Deutsche, englische und französische Texte sowie fokussierte UI-Tests und
  eine visuelle Firefox-Prüfung für Desktop und kleinen Viewport ergänzen.

## Nicht im Scope

- Neue fachliche Einstellungswerte außer den bereits durch
  `act-2026-08-21-infofenster-schwebende-einblendung` vorgesehenen
  Infofenster-Optionen.
- Änderung der Wirkung bestehender Gameplay-, KI-, Darstellungs-, Audio- oder
  Sitzungseinstellungen.
- Umstellung lokaler Einstellungen auf Match-State oder Serverspeicherung.
- Großes Redesign des Optionsdialogs, der übrigen Seitenleiste oder der
  allgemeinen NETGRID-Navigation.
- Ein eigener Reiter pro kleiner Einstellungsgruppe, verschachtelte
  Reiterhierarchien oder ein dauerhaft sichtbares Handbuch in den Optionen.
- Tooltips als alleinige Quelle für sicherheits-, datenverlust- oder
  ablaufkritische Warnungen. Solche Hinweise bleiben sichtbar und eindeutig.

## Akzeptanzkriterien

- [x] Die Optionsoberfläche besitzt höchstens drei klar benannte Reiter und
      zeigt nicht mehr alle Einstellungsblöcke gleichzeitig in einer langen
      unstrukturierten Liste.
- [x] Jede bisherige Einstellung, Sitzungsaktion, Buildinformation und jeder
      Systemstatus ist genau einem nachvollziehbaren Reiter zugeordnet und bleibt
      ohne Funktionsverlust erreichbar.
- [x] Ablaufautomatisierung, Darstellungsoptionen und technische
      Sitzung/System-Informationen sind nicht mehr in derselben undifferenzierten
      Gruppe vermischt.
- [x] Tablist und Tabpanels erfüllen die erwartete Tastatur- und
      Screenreader-Semantik; Fokus geht beim Wechsel nicht verloren oder springt
      unkontrolliert hinter den Dialog.
- [x] Auf einem kleinen mobilen Viewport bleiben Reiterbeschriftungen,
      Einstellungen und untere Inhalte vollständig erreichbar. Die Lösung erzeugt
      keine zweite unbemerkte horizontale oder vertikale Scrollfalle.
- [x] Erklärungsbedürftige Gameflow-Optionen besitzen kurze, konkrete
      Hilfetexte, die Wirkung, Auslösezeitpunkt und lokale beziehungsweise
      Match-State-Reichweite verständlich machen.
- [x] Zusätzliche Tooltips/Infohinweise funktionieren per Hover, Tastaturfokus
      und Touch und sind technisch mit dem beschriebenen Steuerelement verknüpft;
      Warnungen bleiben auch ohne Tooltip sichtbar.
- [x] Die aktive Reiterwahl ändert keine Einstellungswerte. Ein Wechsel
      zwischen normalem Panel und Dialog zeigt denselben logisch sortierten Inhalt
      ohne doppelte oder widersprüchliche Steuerung.
- [x] Deutsche, englische und französische Texte sind vollständig; fokussierte
      Tests decken Tabzuordnung, Tastaturbedienung und den Erhalt vorhandener
      Settings-Callbacks ab.
- [x] Die visuelle Prüfung in Firefox bestätigt auf Desktop und kleinem
      Viewport, dass die Optionsoberfläche kürzer, übersichtlicher und die
      Gameflow-Erklärungen leichter auffindbar sind.

## Umsetzungshinweise

- Primärer Folgeagent: `small-adjustments-agent`, solange die Arbeit auf eine
  Neuordnung der bestehenden Oberfläche und kontextnahe Hilfen begrenzt
  bleibt. Ergibt die Bestandsaufnahme einen grundlegenden neuen
  Settings-Vertrag, ist daraus vor der Umsetzung eine kleine
  Architektur-Folgeactivity zu schneiden.
- Zuerst eine vollständige Zuordnungstabelle der aktuellen Unterkomponenten
  erstellen. Danach `GameplaySettings` nur soweit teilen, wie die fachliche
  Sortierung es verlangt; keine Settings-Logik duplizieren.
- Die drei vorgeschlagenen Reiter sind eine belastbare Ausgangshypothese, aber
  kein Zwang zu unpassenden Zuordnungen. Entscheidend sind Auffindbarkeit und
  ein stabiles mentales Modell mit maximal drei Bereichen.
- Native `title`-Attribute allein reichen für Touch- und
  Tastaturzugänglichkeit nicht aus. Ein vorhandenes gemeinsames
  Tooltip-/Popover-Muster bevorzugen oder einen kleinen, wiederverwendbaren
  Infohinweis innerhalb der Settings-Fläche schaffen.
- Der aktive Reiter ist reine lokale Oberflächensteuerung. Ob er für das
  erneute Öffnen gemerkt wird, darf anhand des vorhandenen Dialogverhaltens
  entschieden werden; dafür ist kein Serververtrag nötig.

## Ergebnisnotiz

Die Optionen sind in die drei Reiter „Spielablauf“, „Darstellung“ und
„Sitzung & System“ gegliedert. Die Tablist unterstützt Pfeiltasten, Home und
Ende mit roving Fokus; Tab und Tabpanel sind semantisch verknüpft. Die bislang
gemischten Gameplay-Einstellungen sind ohne duplizierte Settings-Logik nach
Ablauf und Darstellung getrennt. Kurze zugängliche Hilfen erläutern die drei
Ablaufautomatismen; KI-Modi und die Infofenster-Dauer sind direkt mit ihren
Erklärungen verknüpft. Dieselbe OptionsPanel-Komponente bedient normale und
modale Darstellung. Auf 390 px bleiben alle drei Reiter sichtbar, auf 1280 px
entsteht kein horizontaler Überlauf.
