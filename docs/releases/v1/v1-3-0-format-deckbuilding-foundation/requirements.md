# V1.3.0 Requirements - Format und Deckbuilding Foundation

Stand: 2026-05-08
Status: eingefroren

## Ziel

V1.3.0 fuehrt versionierte lokale Formatprofile und staerkere Deckvalidierung ein. Matches duerfen nur mit Decks starten, deren Kartenstatus, Mechanikstatus und Formatprofilvalidierung gruen sind.

## Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V130-MUST-001 | V1.3.0 startet erst nach gruenem V1.2.3-Final-Gate. |
| V130-MUST-002 | Es gibt mindestens ein versioniertes lokales Formatprofil. |
| V130-MUST-003 | Formatprofile erzeugen keine Spielbarkeit; sie koennen nur zusaetzlich einschraenken. |
| V130-MUST-004 | `format_legal` setzt `deck_legal` voraus. |
| V130-MUST-005 | `deck_legal` setzt `human_playable` voraus. |
| V130-MUST-006 | Deckvalidierung prueft Side und Identity. |
| V130-MUST-007 | Deckvalidierung prueft Faction-Werte und Identity-Kompatibilitaet. |
| V130-MUST-008 | Deckvalidierung prueft Influence-Kosten und Influence-Limit. |
| V130-MUST-009 | Deckvalidierung prueft Mindestdeckgroesse je Identity oder Formatprofil. |
| V130-MUST-010 | Korp-Deckvalidierung prueft Agenda-Punkte oder Agenda-Dichte nach lokalem Profil. |
| V130-MUST-011 | Deckvalidierung prueft Kopienlimit pro Kartentitel oder kanonischem Gruppenschluessel. |
| V130-MUST-012 | Explizite Kopienlimit-Ausnahmen sind datengetrieben und reviewpflichtig. |
| V130-MUST-013 | Karten ohne vollstaendige benoetigte Validierungsdaten blockieren betroffene Decks. |
| V130-MUST-014 | Deck-Snapshots speichern FormatProfile-ID und Version. |
| V130-MUST-015 | Matchstart validiert Decks serverseitig erneut. |
| V130-MUST-016 | Import/Export enthaelt Formatprofil-Metadaten und erzeugt keine Spielbarkeit. |
| V130-MUST-017 | Alte lokale Decks ohne Formatprofil werden als `needs_revalidation` oder gleichwertig markiert. |
| V130-MUST-018 | Deckeditor zeigt Validierungsfehler konkret, aber ohne gegnerische oder private Matchdaten. |
| V130-MUST-019 | Katalogstatus, Spielbarkeit, Decklegalitaet und Formatlegalitaet bleiben getrennt sichtbar. |
| V130-MUST-020 | Gegnerische Decklisten bleiben in Bootstrap, WebSocket, Reconnect, Errors, Logs und PublicEvents side-sicher. |
| V130-MUST-021 | Deckhashes und Deckrollenprofile duerfen nur nach side-sicherem Vertrag erscheinen. |
| V130-MUST-022 | Replay/StateHash nutzt unveraenderliche Deck-Snapshots mit Formatprofil-Version. |
| V130-MUST-023 | KI-Deckbau nutzt nur `ai_supported` Karten. |
| V130-MUST-024 | KI lehnt Decks mit nicht AI-supported Karten ab oder nutzt ein validiertes Ersatzdeck. |
| V130-MUST-025 | Deckrollenprofil wird aus eigenem Decksnapshot und AI-Hints berechnet. |
| V130-MUST-026 | DecisionDebug nennt nur eigenes Deckrollenprofil und oeffentliche Gegnerdaten. |
| V130-MUST-027 | Tests decken legale und illegale Runner- und Korp-Beispieldecks ab. |
| V130-MUST-028 | Browser-E2E deckt legales Matchstartdeck und blockiertes illegales Deck ab. |
| V130-MUST-029 | No-Scope-Regression bestaetigt: keine Public Decklists, keine Accounts, kein Ranked, keine Turniere, keine neuen Karten, keine Assets. |

## Should-Anforderungen

| ID | Anforderung |
| --- | --- |
| V130-SHOULD-001 | Validierungsfehler sollten stabile Codes fuer UI und Tests haben. |
| V130-SHOULD-002 | Deckeditor sollte Fehler nach Blocker, Warnung und Hinweis gruppieren. |
| V130-SHOULD-003 | Import sollte unbekannte Formatprofile blockieren oder als revalidation-pflichtig markieren. |
| V130-SHOULD-004 | KI-Soaks sollten mindestens zwei validierte Deckprofile vorbereiten. |

## Gate

`ready_for_implementation_after_V1_2_3: true`

V1.3.0 ist nach erfolgreichem V1.2.3-Gate implementierbar.
