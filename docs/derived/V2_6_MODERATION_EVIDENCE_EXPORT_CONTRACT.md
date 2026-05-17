# V2.6 Moderation Evidence-Export-Vertrag

Stand: 2026-05-17
Status: Architekturvertrag, keine Implementierungsfreigabe
Zielrelease: V2.6 Moderation Console

## Zweck und Grenze

Dieser Vertrag legt fest, welche Daten ein späterer Moderations-Evidence-Export enthalten darf, welche Daten nur redigiert erscheinen dürfen und welche Daten immer ausgeschlossen bleiben. Er ergänzt `docs/derived/V2_6_MODERATION_EVIDENCE_RBAC_CONTRACT.md` und ersetzt weder den V2.0 Account-Datenexport noch eine spätere V2.8 Public-Replay-Freigabe.

Evidence-Export ist ein reportbezogener Moderationsvorgang. Er dient der nachvollziehbaren Bearbeitung, Review oder Übergabe eines konkreten Reports. Er ist kein Debug-Export, kein Datenschutz-Self-Export, kein Public Replay und keine FullState-Ansicht.

## Exportierbare Datenklassen

| Datenklasse | Exportierbar | Exportform | Mindestredaktion |
| --- | --- | --- | --- |
| Report-Metadaten | ja | `reportId`, Status, Kategorie, Zeitstempel, betroffener Match-/Lobbybezug, Bearbeitungsstatus | Account-IDs nur rollen-/zweckgebunden; keine internen Token oder lokalen Pfade |
| Reporttext | ja | vom Reporter eingereichter Freitext und eigene Anhänge/Referenzen | beleidigende oder sensible Inhalte bleiben als Evidence sichtbar, aber ohne zusätzliche Systemdaten |
| Chat-Evidence | ja, reportbezogen | ausgewählte Lobbychat-Nachrichten mit `chatMessageId`, Zeitstempel, Seite/Rolle und Kontextfenster | keine Match-Tokens, keine Hidden-Info-Erweiterung, keine fremden nicht relevanten Chatverläufe |
| Public-safe Replay-Auszug | ja, begrenzt | Eventfamilie, Timingpunkt, StateVersion vor/nach, öffentlicher Eventlabel, Hidden-Info-Barriere-Marker | keine side-private Perspektive, keine verdeckten Kartenidentitäten, keine gegnerischen Hand-/Deck-/HQ-/R&D-Inhalte |
| StateHash-Integritätsdaten | ja | finaler StateHash, Replay-OK-Status, per Event erwarteter/tatsächlicher StateHash und Fehlercodes | kein FullState, keine `privatePayload`, keine Replay-Aktion aus privaten Payloads |
| Audit-Zusammenfassung | ja | Export-Audit, Evidence-Views, Rollen, erlaubte/verweigerte Zugriffe, Break-Glass-Metadaten | keine Hidden-Inhalte, keine CardInstance-IDs als private Datenquelle, keine Roh-Cookies |
| Connection-/Ops-Indizien | ja, falls reportrelevant | redigierte Origin-/Rate-Limit-/Join-/WebSocket-Kategorien und Zeitfenster | keine IP-Vollhistorie ohne eigene Policy, keine Tokens, keine Token-Hashes, keine lokalen Pfade |

## Exportverbote

| Verbotene Datenklasse | Beispiele | Grundsatz |
| --- | --- | --- |
| FullState | kompletter `GameState`, StoredMatch-GameState, Engine-Snapshots | nie im Evidence-Export |
| Private Eventdaten | `privatePayload`, Replay-Aktionen aus `privatePayload`, private Choice-Rohdaten | nie im Evidence-Export |
| Verdeckte Karten | Grip-/Stack-/HQ-/R&D-Inhalte, facedown Archives, nicht öffentlich gerezzte/aufgedeckte Karten | nie außerhalb der jeweils legal sichtbaren Projektion |
| Gegnerspezifische Deckdaten | gegnerische Decklisten, private Decksnapshots, Deckhashes, Cloud-Deck-IDs | nie im Moderations-Evidence-Export |
| Tokens und Hashes | Session-/Reconnect-/Join-/Invite-/Recovery-Tokens, `sessionTokenHash`, `tokenHash`, Roh-Cookies | nie exportieren, auch nicht redigiert als stabiler Hash |
| KI-Input und KI-Debug | `AIInput`, `DecisionDebug`, Belief-Fakten, KI-Hypothesen, `aiDecisionDebug` | kein Moderations-Evidence-Export; gesonderte KI-Fehlerpolicy nötig |
| Lokale Analyse | `local_analysis`, `exploitSuggestions`, lokale Replay-Lernhinweise als Analysefläche | nicht exportierbar; nur lokale Replay-Ansicht |
| Lokale Betriebsdetails | SQLite-Pfade, Backup-Pfade, absolute lokale Dateipfade, Secrets | nie im Evidence-Export |

Break-Glass ändert diese Exportverbote nicht. Wenn Hidden-Daten in einem separaten Break-Glass-Vorgang gesichtet wurden, darf der Evidence-Export nur die Audit-Metadaten dieses Vorgangs nennen: Actor, Rolle, Grund, Datenklasse, Zeitraum, Ergebnis. Die Hidden-Daten selbst bleiben ausgeschlossen.

## Abgrenzung zu anderen Exporten

| Exporttyp | Zweck | Darf Evidence-Export wiederverwenden? | Harte Grenze |
| --- | --- | --- | --- |
| V2.6 Evidence-Export | reportbezogene Moderationsakte | ja, Report-, Chat-, public-safe Replay- und Audit-Auszüge | keine Account-Self-Datenpakete, kein Public Listing, kein FullState |
| V2.0 Account-Datenexport | eigene Account- und Datenschutzdaten eines Nutzers | nein, nur eigene Reporttexte/Status nach eigener Policy | keine internen Moderationsnotizen, keine fremden Reports, keine Break-Glass-Inhalte |
| V2.8 Public Replay | freiwillige öffentliche Replay-Veröffentlichung | nein, nur spätere public-sanitized Projektion nach Consent | kein Reportkontext, kein Chat, keine Moderationsnotizen, keine side-private Replay-View |

Ein späterer Implementierungsslice muss getrennte Schemas, Endpunkte, Audit-Actions und Retentionwerte für diese drei Exporttypen nutzen. Gemeinsame Redaction-Helfer sind erlaubt; gemeinsame Payload-Schemas sind nicht erlaubt, solange sie unterschiedliche Zwecke vermischen würden.

## Ablauf

1. Ein Moderator oder Admin wählt einen konkreten Report und einen begrenzten Evidence-Zweck aus.
2. Der Server baut den Export ausschließlich aus referenzierten Evidence-Quellen und public-safe Projektionen auf.
3. Der Export-Builder scannt das Payload gegen verbotene Schlüssel und Muster, bevor ein Artefakt gespeichert wird.
4. Ein Auditereignis `export_created` hält Actor, Rolle, Report, Datenklassen, Grund, Zeitfenster, Ergebnis und Artefakt-ID fest.
5. Das Artefakt erhält ein kurzes Downloadfenster und wird nach Ablauf automatisch gelöscht oder unzugänglich gemacht.
6. Jeder Download schreibt ein eigenes Auditereignis `export_downloaded`; verweigerte Downloads schreiben `export_denied`.
7. Nach Ablauf bleibt nur die Audit-Zusammenfassung ohne Exportinhalt erhalten.

## Downloadfenster, Audit und Retention

| Thema | Vertrag |
| --- | --- |
| Downloadfenster | maximal 24 Stunden als Alpha-Default; kürzer für sensible Reports möglich |
| Downloadberechtigung | nur Admin/Moderator mit Reportzugriff; Support nur nach expliziter read-only Policy und ohne Sanktion |
| Artefakt-Retention | Exportartefakt nach Ablauf löschen oder kryptografisch unzugänglich machen; keine dauerhafte Exportablage |
| Audit-Retention | Export- und Download-Audit mindestens so lange wie Report-/Sanktionsretention; ohne Hidden-Inhalte |
| Report-Retention | folgt dem V2.6 Moderation/RBAC-Vertrag, z. B. 90 Tage ohne Sanktion und 180 Tage nach Sanktion/Aufhebung als Alpha-Vorschlag |
| Break-Glass | Export enthält nur Break-Glass-Audit-Metadaten; keine Hidden-Daten |
| Backups | dürfen kein Sofortlöschversprechen erzwingen; Retention-Ausnahme im Export-/Löschstatus sichtbar machen |

## Review-Checks für spätere Implementierung

Ein späterer Implementierungsslice braucht mindestens diese Gates:

1. Schema-Test: Export enthält nur erlaubte Datenklassen aus diesem Vertrag.
2. Negativscan: Payload blockiert `FullState`, `gameState`, `privatePayload`, `cardInstances`, verdeckte Kartenlisten, Decklisten, Deckhashes, Tokens, Token-Hashes, `AIInput`, `DecisionDebug`, `aiDecisionDebug`, `local_analysis`, `exploitSuggestions` und lokale Pfade.
3. Replay-Check: Evidence-Replay nutzt keine `runner`-/`corp`-private View als Public-Ersatz und keine `local_analysis`.
4. StateHash-Check: Integritätsdaten sind vorhanden, ohne FullState oder private Replay-Aktionen zu exportieren.
5. RBAC-Check: Moderator, Admin, Support und Reporter erhalten nur die im V2.6-RBAC-Vertrag erlaubten Exportzugriffe.
6. Audit-Check: Erstellung, Download, Ablauf, Löschung und verweigerter Zugriff schreiben tokenfreie Auditereignisse.
7. Retention-Check: abgelaufene Exportartefakte sind nicht mehr abrufbar; Audit-Zusammenfassung bleibt redigiert erhalten.
8. Cross-Export-Check: Account-Self-Export und Public Replay können das Evidence-Export-Schema nicht direkt verwenden.

## Entscheidung

V2.6 Evidence-Export darf als enger, reportbezogener, kurzlebiger und auditiert abrufbarer Moderationsauszug geplant werden. Er bleibt strikt redigiert und getrennt von Public Replay, Account-Datenexport, Break-Glass-Inhaltszugriff, KI-Debug und FullState-Analyse.
