import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./test-windows-installer-e2e.ps1', import.meta.url));
const source = readFileSync(script, 'utf8');

// These are harness contract checks, not native MSI/update/rollback evidence.
test('standalone matrix never impersonates the lease-bound updater', () => {
  assert.doesNotMatch(source, /--(?:install-update|uninstall-update|apply)\b/);
  assert.match(source, /Invoke-Msi @\('\/i', \(Quote-Msi \$updateMsi\)/);
  assert.match(source, /Invoke-Msi @\('\/i', \(Quote-Msi \$baseMsi\)/);
  assert.match(source, /Invoke-Msi @\('\/x', \(Quote-Msi \$baseMsi\)/);
});

test('rejected root change proves its cause, without claiming a rollback', () => {
  assert.match(source, /INSTALLFOLDER=\$\(Quote-Msi \$failedProgramRoot\)/);
  assert.match(source, /-Expected @\(1603\)/);
  assert.match(source, /Select-String[^\r\n]*installation_gate_upgrade_root_changed/);
  assert.match(source, /root-change-rejection-preserves-version/);
  assert.doesNotMatch(source, /failed_upgrade_did_not_rollback|failed-upgrade-preserves-version/);
});

test('installation identity includes actual native bytes and the selected setup', () => {
  for (const field of ['launcherSha256', 'firstRunSha256', 'updaterSha256', 'runtimeConfigSha256'])
    assert.ok(source.includes(`$metadata.runtime.${field}`));
  assert.match(source, /Setup-Hash \$target\) -eq \$files\[\$relative\]/);
  assert.match(source, /GetVersionInfo\(\$target\).FileVersion -eq "\$version.0"/);
  assert.match(source, /\$layout.product.commit -eq \$metadata.product.commit/);
  assert.match(source, /foreach \(\$entry in \$manifest.files\)/);
  assert.match(source, /installed_manifest_path_outside_product/);
  assert.match(source, /Setup-Hash \$target\) -eq \$entry.sha256/);
  assert.match(source, /CurrentProductCode -ceq \$products\[0\].PSChildName/);
  assert.match(source, /Setup-Hash \$cachePath\) -eq \(Setup-Hash \$SetupPath\)/);
  assert.match(source, /\$shortcut.TargetPath -eq \$cachePath/);
  assert.equal((source.match(/^[ \t]+Assert-InstalledIdentity \$(?:base|update)Msi \$(?:base|update)Setup/gm) ?? []).length, 8);
});

test('a second higher artifact version is required before installation', () => {
  const guard = source.indexOf("'two_ordered_product_versions_required'");
  const install = source.indexOf('$recommendedLog =');
  assert.ok(guard > 0 && guard < install);
  assert.match(source, /\[version\]\$updateVersion -gt \[version\]\$baseVersion/);
});

test('Windows PowerShell parses the harness without executing any operation', { skip: process.platform !== 'win32' }, () => {
  const command = `$t=$null; $e=$null; [Management.Automation.Language.Parser]::ParseFile('${script.replaceAll("'", "''")}',[ref]$t,[ref]$e) | Out-Null; if ($e.Count) { $e | Out-String | Write-Output; exit 1 }`;
  const result = spawnSync('powershell.exe', ['-NoProfile', '-Command', command], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
