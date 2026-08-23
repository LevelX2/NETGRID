---
activityId: act-2026-08-21-infofenster-schwebende-einblendung
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
blockedBy: []
resultArtifacts:
  - apps/web/features/actions/OpponentActionOverlay.tsx
  - apps/web/features/actions/cue-display.ts
  - apps/web/features/settings/OptionsPanel.tsx
  - apps/web/features/settings/settings-model.ts
  - apps/web/app/floating-action-cue.test.ts
checks:
  - "43 Cue- und Warteschlangentests bestanden"
  - "21 fokussierte UI-, CSS- und Lokalisierungstests bestanden"
  - "Firefox bei 390 x 844 und 1280 x 900 visuell und geometrisch geprüft"
  - "Web-Typecheck: eigene Änderungen fehlerfrei; unabhängiger Baselinefehler in app/ai-turn-plan-comparison-ui.test.ts:67"
---

# Infofenster um eine schwebende Einblendung erweitern

## Ziel

Für lokale Hinweise zu KI-, Gegner- und automatischen Spielaktionen steht neben
dem bisherigen vollständigen Infofenster eine deutlich platzsparendere
Darstellungsart zur Verfügung. Die empfohlene sichtbare Bezeichnung lautet
„Schwebende Einblendung“: Eine gut lesbare Meldung erscheint am gewählten Ort,
bewegt beziehungsweise vergrößert sich dezent und blendet anschließend wieder
aus, ohne den Blick auf das Board länger als nötig zu verdecken.

## Kontext und Quellen

- Nutzeridee vom 2026-08-21: Das bestehende Infofenster nimmt häufig viel Platz
  ein und verlangt je nach Ablauf zusätzlich „Weiter“. Gewünscht ist eine an
  „Floating Combat Text“ erinnernde, freigestellte Meldung mit großer Schrift,
  kurzer räumlicher Bewegung und anschließendem Ausblenden.
- Die Dauer soll nicht mehr nur aus den festen Werten 1,5, 2,5, 4 und 6
  Sekunden gewählt werden, sondern über einen Regler von 1 bis 10 Sekunden
  genauer einstellbar sein.
- Die Position soll verständlich über eine Vorschau beziehungsweise einen
  verschiebbaren Marker gesetzt werden können. Der Nutzer beschreibt den
  gesetzten Punkt als möglichen linken Rand beziehungsweise Anfang der
  Meldung.
- `apps/web/features/actions/OpponentActionOverlay.tsx` rendert derzeit ein bis
  zu 540 Pixel breites Panel mit Kopf, optionaler Karte, Meldung, Warteschlange,
  Verschiebegriff und „Weiter“-/Bestätigungsaktion.
- `apps/web/features/actions/cue-position.ts` unterstützt bereits fünf
  Positionsvorgaben sowie eine freie, viewportbezogene Position. Die freie
  Position entsteht derzeit durch Ziehen des eingeblendeten Infofensters; in
  den Einstellungen ist sie nur als „Eigene Position“ erkennbar.
- `apps/web/features/settings/settings-model.ts` begrenzt
  `CueAutoDismissMs` auf `0 | 1500 | 2500 | 4000 | 6000`.
  `apps/web/features/settings/OptionsPanel.tsx` bietet dafür ein Auswahlfeld.
- `apps/web/app/page.tsx` verwendet die Anzeigedauer sowohl für die
  automatische Cue-Ausblendung als auch im getakteten KI-Präsentationsablauf.
  Im manuellen KI-Modus kann „Weiter“ dagegen eine echte Ablaufsteuerung sein
  und darf nicht unbemerkt entfallen.

## Scope

- In den Infofenster-Einstellungen eine lokale Darstellungsart anbieten,
  mindestens „Infofenster“ für die bisherige ausführliche Präsentation und
  „Schwebende Einblendung“ für die neue reduzierte Präsentation.
- Die schwebende Einblendung auf den wesentlichen, side-sicheren Meldungstext
  und nur solche unmittelbar verständlichen Kennzeichen reduzieren, die für
  seine Einordnung nötig sind. Sie besitzt keine große Panel-, Karten- oder
  Footerfläche und fängt bei rein informativen Meldungen keine Board-Eingaben
  ab.
- Einen ruhigen Animationsverlauf definieren: kurzes Erscheinen, eine dezente
  räumliche Bewegung beziehungsweise Skalierung mit gut lesbarer Hauptphase
  und anschließendes Ausblenden. Die Gesamtbewegung darf nicht mit der
  Boardinteraktion oder anderen Aktionsanimationen verwechselt werden.
- Die Anzeigedauer als zugänglichen Regler von 1 bis 10 Sekunden mit sichtbarem
  aktuellem Zahlenwert und einer hinreichend feinen, dokumentierten Schrittweite
  anbieten. Bestehende Zeitsteuerung und Warteschlange werden an den
  kontinuierlicheren Wert angepasst, ohne eine zweite konkurrierende
  Cue-Zeitplanung einzuführen.
- In den Einstellungen eine kleine Platzierungsvorschau mit verschiebbarem,
  per Maus, Touch und Tastatur bedienbarem Marker anbieten. Die Vorschau macht
  eindeutig, welcher Ankerpunkt der Meldung gesetzt wird; bevorzugt entspricht
  er ihrer linken oberen beziehungsweise führenden Kante. Positionsvorgaben,
  freie Position, Ziehen im Spiel und Zurücksetzen bleiben synchron.
- Für Cues mit notwendiger lokaler Eingabe oder manueller KI-Fortsetzung einen
  eindeutigen Vertrag umsetzen: Entweder bleiben sie bewusst in der
  interaktiven Infofenster-Darstellung, oder die reduzierte Darstellung bietet
  die erforderliche Aktion ebenso klar und zugänglich an. Keine Aktion wird
  wegen der Darstellungswahl automatisch bestätigt, verworfen oder
  übersprungen.
- Desktop und kleine Viewports berücksichtigen. Meldung und Position werden
  einschließlich Safe Areas im sichtbaren Bereich gehalten; lange lokalisierte
  Texte dürfen nicht rechts oder unten abgeschnitten werden.
- Deutsche, englische und französische Texte sowie fokussierte
  Komponenten-/Verhaltenstests ergänzen. Die visuelle Wirkung wird in Firefox
  mit mehreren Cue-Arten und mindestens einem kleinen Viewport geprüft.

## Nicht im Scope

- Änderung der fachlichen Cue-Erzeugung, der Cue-Texte oder der
  PublicEvent-/PlayerView-Projektion, sofern kein konkret reproduzierter
  Darstellungsfehler dies erfordert.
- Automatisches Ausführen einer `PlayerAction`, Choice oder KI-Fortsetzung nur
  deshalb, weil die kompakte Darstellung ausgewählt wurde.
- Redesign von Damage-, Access-, Successful-Run-, Game-Over- oder anderen
  interaktiven Overlays, die nicht über `OpponentActionOverlay` laufen.
- Änderung der KI-Entscheidungslogik oder der fachlichen KI-Geschwindigkeit.
- Gleichzeitige allgemeine Neuordnung der gesamten Optionsoberfläche; dafür
  existiert die nachgelagerte Activity
  `act-2026-08-21-options-logische-reiter-und-hilfen`.
- Aufbewahrung historischer lokaler V0-Einstellungsformate ohne aktuellen
  Produktnutzen.

## Akzeptanzkriterien

- [x] In den Optionen kann zwischen dem bisherigen vollständigen Infofenster
  und der neuen schwebenden Einblendung gewählt werden; die Wahl ist lokal
  gespeichert und verändert keinen Match-State.
- [x] Eine rein informative schwebende Einblendung zeigt die verständliche
  Hauptmeldung in großer, kontrastreicher Schrift, benötigt keinen „Weiter“-Knopf
  und blockiert keine Boardinteraktion.
- [x] Die Einblendung besitzt eine nachvollziehbare Eintritts-, Lese- und
  Ausblendphase und verschwindet nach der gewählten Gesamtdauer zuverlässig.
- [x] Die Anzeigedauer ist per Regler von 1 bis 10 Sekunden feiner als mit den
  bisherigen vier Zeitwerten einstellbar; der aktuelle Wert ist jederzeit
  sichtbar und per Tastatur änderbar.
- [x] Eine Platzierungsvorschau mit Marker setzt einen klar dokumentierten
  Ankerpunkt. Marker, Positionsvorgaben und direktes Ziehen im Spiel liefern
  denselben gespeicherten Positionsvertrag.
- [x] Schwebende Einblendungen bleiben auf Desktop und kleinen Viewports
  vollständig innerhalb des nutzbaren sichtbaren Bereichs und berücksichtigen
  lange Texte sowie Safe Areas.
- [x] Mehrere schnell aufeinanderfolgende Meldungen bleiben geordnet: Keine
  Cue geht verloren, überlagert unlesbar eine andere oder verändert die
  bestehende Ablauf-/Warteschlangensemantik unkontrolliert.
- [x] Im manuellen KI-Modus und bei sonstigen steuerungsrelevanten Cues bleibt
  eine erforderliche „Weiter“- oder Bestätigungsaktion sichtbar, fokussierbar
  und ausschließlich nutzergesteuert.
- [x] `prefers-reduced-motion` erhält eine bewegungsarme Variante ohne Verlust
  von Text, Anzeigedauer oder Bedienbarkeit; Screenreader werden über eine
  geeignete Live-Region informiert, ohne dieselbe Meldung mehrfach anzusagen.
- [x] Deutsche, englische und französische Beschriftungen sind vollständig;
  fokussierte Tests decken Moduswahl, Normalisierung der Dauer,
  Positionsgrenzen, Cue-Warteschlange und den manuellen KI-Ablauf ab.
- [x] Die visuelle Prüfung in Firefox bestätigt Lesbarkeit, geringe
  Boardverdeckung und den gewünschten kurzen „Aufpoppen–Bewegen–Ausblenden“-Eindruck.

## Umsetzungshinweise

- Primärer Folgeagent: `small-adjustments-agent`, weil die Erweiterung auf die
  bestehende lokale Cue- und Einstellungsoberfläche begrenzt bleiben soll.
- Die Begriffe „Action-Text“ oder „Floating Combat Text“ eignen sich als
  Designreferenz, aber weniger als sichtbare Produktbezeichnung. „Schwebende
  Einblendung“ beschreibt den Zweck auch bei automatischen Systemeffekten.
- Vor dem Rendern die Cues nach reiner Information und erforderlicher lokaler
  Ablaufsteuerung unterscheiden. Die Darstellung darf nicht aus einem
  technischen `actionType`-Text erraten werden; vorhandene strukturierte
  Eigenschaften und der tatsächliche Ablaufvertrag sind maßgeblich.
- Die vorhandene Position ist die linke obere Overlayposition in Prozent und
  wird durch `clampCuePosition` anhand der gerenderten Größe begrenzt. Vorschau
  und neue Textdarstellung sollen dieses Modell bewusst bestätigen oder in
  einem kleinen gemeinsamen Positionsvertrag ersetzen, nicht parallel anders
  interpretieren.
- Die Dauer wird bereits in `page.tsx` für Cue-Lebenszeit und getaktete
  KI-Präsentation konsumiert. Zuerst eine eindeutige Bedeutung des neuen
  Wertes festlegen und dann alle bestehenden Consumer gemeinsam anpassen.
- Animationen über `opacity` und `transform` halten; Layoutbewegungen und eine
  dauerhafte GPU-intensive Endlosschleife vermeiden.

## Ergebnisnotiz

Die lokale Darstellungsart kann nun zwischen dem bisherigen `Infofenster` und
der `Schwebenden Einblendung` wechseln. Rein informative Cues erscheinen ohne
Panel und Footer in großer Schrift, lassen Board-Eingaben durch und folgen der
unveränderten Cue-Warteschlange. Cues mit lokaler Aufmerksamkeit sowie
KI-Cues im Einzelschrittmodus bleiben bewusst vollständige Infofenster mit
einer ausschließlich nutzergesteuerten `Weiter`-Aktion.

Die Dauer ist mit einem zugänglichen Regler von 1 bis 10 Sekunden in
0,25-Sekunden-Schritten einstellbar. Eine Platzierungsvorschau setzt die linke
obere Führungskante per Maus, Touch oder Pfeiltasten; freie Position und
Preset-Auswahl verwenden denselben gespeicherten Vertrag. Die gerenderte Größe
wird beim Einblenden und bei Viewportänderungen erneut begrenzt. Firefox
bestätigte bei 390 x 844 und 1280 x 900 vollständige Sichtbarkeit,
Board-Durchlässigkeit und den ruhigen Aufpoppen-/Bewegen-/Ausblendverlauf. Für
`prefers-reduced-motion` bleibt bei gleicher Dauer eine reine Fade-Variante.
