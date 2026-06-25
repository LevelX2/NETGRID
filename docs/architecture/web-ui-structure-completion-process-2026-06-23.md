# NETGRID Web-UI-Strukturrefactoring Abschlussprozess

Datum: 2026-06-23
Branch: `codex/ui-structure-completion`
Worktree: `C:\Projekte\NETGRID_UI_STRUCTURE_COMPLETION`

## Ziel

Das NETGRID-Web-UI soll fachlich klar getrennt, verständlich und erweiterbar werden. `apps/web/app/page.tsx` soll nur noch Route-Einstieg, uebergreifende Page-Orchestrierung, Verdrahtung klar benannter Feature-Module und oberste Komposition enthalten.

## Initiale Inventur

- `apps/web/app/page.tsx`: 16.185 Zeilen, noch zentrale UI-Monolith-Datei.
- Bereits vorhandene Feature-Bereiche: `app-shell`, `game-board`, `actions`, `cards`, `recent`.
- Noch klar extrahierbare Verantwortungen:
  - Katalog- und Deckbuilder-UI inklusive Deck-Table, Deck-Strategieprofil und Katalog-Hilfsdarstellung.
  - Karten- und Zonen-Darstellung inklusive CardView, Tooltips, Counter, Archiv- und Board-Zonen.
  - Action-/Choice-/Chronicle-/Overlay-Darstellung, soweit sie noch lokal in `page.tsx` liegt.
  - Browser-, Storage-, Audio- und Server-API-Hilfsfunktionen am Ende der Route-Datei.
  - Persistente UI-Einstellungen und Feature-Handler, soweit sie fachlich einem Feature gehoeren.

## Paketprozess

1. Prozessartefakt und Ausgangsinventur festhalten.
2. Katalog-/Deckbuilder-Verantwortungen aus `page.tsx` in einen fachlichen Feature-Bereich verschieben.
3. Karten-, Board- und Zonen-Darstellung in den bestehenden Feature-Bereich `game-board` und `cards` verschieben.
4. Runtime-, Browser-, Storage-, Audio- und Server-Hilfen aus der Route-Datei in `apps/web/lib` beziehungsweise passende Feature-Module verschieben.
5. Restinventur durchfuehren: keine groesseren fachlich abgrenzbaren UI-Bloecke in `page.tsx`, keine neue Monsterdatei ohne weitere fachliche Teilung.
6. Passende Checks nach jedem Paket ausfuehren und jedes Paket separat committen.
7. Branch final gegen `main` abgleichen, pruefen, nach `main` integrieren und Worktree entfernen.

## Abschlusskriterien

- `page.tsx` enthaelt keine klar extrahierbaren Feature-JSX-Bloecke von etwa 100 bis 150 Zeilen oder mehr.
- Feature-spezifische Konstanten, Formater, Browserzugriffe und Hilfsfunktionen liegen bei ihrem fachlichen Besitzer.
- Neue zentrale UI-Dateien werden nicht zu Ersatzmonolithen; groessere Dateien sind fachlich begruendet oder weiter geteilt.
- TypeScript- und relevante Test-/Build-Checks sind ausgefuehrt oder nachvollziehbar als blockiert dokumentiert.
