# Engine Source Structure Guard

Status: current

## Zweck

`corepack pnpm check:engine-source-structure` schützt die Schichtgrenzen und
Kompositionsstruktur der Rules Engine gegen erneutes unkontrolliertes Wachstum.
Der Guard analysiert ausschließlich produktive TypeScript-Dateien unter
`packages/engine/src` und verwendet dafür den TypeScript-Parser statt
Textheuristiken.

## Geprüfte Verträge

- Relative Imports dürfen nur die zwei im Schuldenledger benannten Altzyklen
  bilden. Neue Zyklen und veraltete Ledger-Einträge sind Fehler.
- Die fünf Runtime-Delegate-Dateien dürfen keine untypisierte
  Delegate-Signatur mehr besitzen. Jede erneute `any`-Signatur ist ein Fehler.
- Die deklarativen Runtime-Portmodule dürfen kein `any`, keine ausführbaren
  Statements und jeweils höchstens 260 Zeilen enthalten.
- Import-Fan-out über 100 interne Module ist ausschließlich für die explizit
  aufgeführten Runtime-Kompositionsdateien zulässig und muss dort exakt dem
  Ledger entsprechen.
- Ability Engine und CardImplementations dürfen keine neuen Rückwärtsimporte in
  die Game-Ausführung erhalten. Die drei vorhandenen Ability-Engine-Kanten sind
  als zu entfernende Altlasten benannt.
- Nur `game/engine-runtime.ts` darf die private Runtime-Kompositionsschicht von
  außen importieren.

## Schuldenabbau

Die Ledger sind keine dauerhaften Ausnahmen. E03 bis E08 reduzieren sie mit
jedem migrierten Vertrags- und Runtime-Cluster. E05 senkte den Ausgangswert von
430 auf 363, E06 auf 186 und E07 auf null. Sobald eine Altlast entfällt, muss
ihr Eintrag im selben Paket entfernt oder abgesenkt werden. Nach E08 ist auch
der technische Delegate-Store entfernt; die Zyklen werden separat bereinigt.
Import-Fan-out über 100 bleibt ebenfalls abzubauen.

Der Selftest `corepack pnpm check:engine-source-structure:selftest` erzeugt
isolierte Gegenbeispiele für unsichere Delegate-Signaturen, Zyklen, Fan-out und
verbotene Schichtkanten. Er beweist damit, dass jede Fehlerklasse tatsächlich
vom Guard erkannt wird.
