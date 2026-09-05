import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

const [mode, filename, marker] = process.argv.slice(2);
const expected = /^C:\\ProgramData\\NETGRID-E2E-[a-f0-9]{32}\\runtime\\multiplayer\\netgrid\.sqlite$/i;
if (process.env.USERNAME !== 'WDAGUtilityAccount' || !expected.test(path.resolve(filename ?? '')) || !['seed', 'probe'].includes(mode) || !/^[a-f0-9]{32}$/.test(marker ?? '')) {
  throw new Error('rollback_marker_scope_invalid');
}
const database = new DatabaseSync(filename);
try {
  if (mode === 'seed') {
    database.exec('CREATE TABLE netgrid_e2e_restore_marker (value TEXT NOT NULL)');
    database.prepare('INSERT INTO netgrid_e2e_restore_marker (value) VALUES (?)').run(marker);
    database.exec('PRAGMA wal_checkpoint(TRUNCATE)');
  }
  const values = database.prepare('SELECT value FROM netgrid_e2e_restore_marker').all();
  if (values.length !== 1 || values[0].value !== marker) throw new Error('rollback_marker_restore_failed');
  const integrity = database.prepare('PRAGMA integrity_check').all();
  if (integrity.length !== 1 || integrity[0].integrity_check !== 'ok') throw new Error('rollback_integrity_failed');
  console.log(JSON.stringify({ ok: true, mode, marker, integrity: 'ok' }));
} finally {
  database.close();
}
