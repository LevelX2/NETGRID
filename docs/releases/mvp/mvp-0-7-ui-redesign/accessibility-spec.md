# Accessibility 0.7 Spec

Status: Design Freeze
Stand: 2026-05-03

## Ziel

V0.7 muss als private Desktop-first-Weboberfläche bedienbar, lesbar und tastaturtauglich bleiben. Accessibility ist ein Gate, kein späteres Politurthema.

## Anforderungen

| Bereich | V0.7-Regel |
|---|---|
| Fokusreihenfolge | Topbar, Hauptnavigation, Board, Actions, Choices, EventLog, Diagnostics. |
| Fokuszustände | Alle interaktiven Elemente haben sichtbare Fokusstile. |
| Labels | Buttons, Inputs, Filter, Toggles und Iconbuttons haben sichtbare oder assistive Labels. |
| Tastatur | Actions, Choices, Card Preview, Zoom und Diagnostics sind per Tastatur erreichbar. |
| Kontrast | Text, Status, Actions, Warnungen und Fokuszustände sind kontrastreich genug für Design C. |
| Textüberlauf | Buttons, Karten, Panels und Statuszeilen laufen weder über noch verdecken sie Nachbarelemente. |
| Responsive | Bei schmaleren Browsern stapeln oder tabben Panels; Current Choice und Actions bleiben zuerst erreichbar. |
| Motion | Animationen sind kurz, ruhig und nicht für Verständnis erforderlich. |

## UI-Text

Sichtbare Texte bleiben kurz, funktional und deutsch. Sie erklären nicht ausführlich die App, sondern benennen den aktuellen Zustand oder die verfügbare Aktion.

## Testspur

Diese Spezifikation deckt `V07-MUST-014`, `V07-MUST-015` und Teile von `V07-MUST-016` ab.
