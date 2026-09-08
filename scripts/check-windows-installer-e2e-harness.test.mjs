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
  for (const field of ['launcherSha256', 'firstRunSha256', 'updaterSha256', 'runtimeConfigSha256', 'setupStubSha256'])
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

test('fresh MSI-only installation proves the generated setup without an external setup source', () => {
  const start = source.indexOf('$recommendedLog =');
  const end = source.indexOf('Assert-InstalledIdentity $baseMsi $baseSetup', start);
  assert.ok(start > 0 && end > start);
  assert.doesNotMatch(source.slice(start, end), /NETGRID_SETUP_SOURCE|NETGRID_SETUP_SHA256/);
  assert.match(source, /msi-only-reconstructed-setup-cache/);
});

test('a second higher artifact version is required before installation', () => {
  const guard = source.indexOf("'two_ordered_product_versions_required'");
  const install = source.indexOf('$recommendedLog =');
  assert.ok(guard > 0 && guard < install);
  assert.match(source, /\[version\]\$updateVersion -gt \[version\]\$baseVersion/);
});

test('product-code repair proves its protected source after removing only an owned download copy', () => {
  assert.match(source, /Copy-Item -LiteralPath \$updateMsi -Destination \$upgradeMsiSource/);
  assert.match(source, /Invoke-Msi @\('\/i', \(Quote-Msi \$upgradeMsiSource\)/);
  const copyGuard = source.indexOf("'upgrade_source_copy_mismatch'");
  const scopeGuard = source.indexOf("'upgrade_source_cleanup_scope_invalid'");
  const remove = source.indexOf('Remove-Item -LiteralPath $resolvedSource');
  const missing = source.indexOf("'repair_download_source_still_present'");
  const repair = source.indexOf('Invoke-Msi @("/fa", $productCode');
  const proof = source.indexOf("'repair_protected_source_not_used'");
  assert.ok(copyGuard > 0 && scopeGuard > copyGuard && remove > scopeGuard && missing > remove && repair > missing && proof > repair);
  assert.match(source, /upgrade_source_cleanup_reparse/);
  assert.match(source, /upgrade_source_changed_before_cleanup/);
  assert.match(source, /Select-String -LiteralPath \$repairLog -Pattern 'Resolved source to:'/);
  assert.match(source, /\$_.Line.Contains\(\$protectedSource\)/);
  assert.doesNotMatch(source, /(?:Remove|Move)-Item -LiteralPath \$(?:baseMsi|baseSetup|updateMsi|updateSetup)\b/);
});

test('Windows PowerShell parses the harness without executing any operation', { skip: process.platform !== 'win32' }, () => {
  const command = `$t=$null; $e=$null; [Management.Automation.Language.Parser]::ParseFile('${script.replaceAll("'", "''")}',[ref]$t,[ref]$e) | Out-Null; if ($e.Count) { $e | Out-String | Write-Output; exit 1 }`;
  const result = spawnSync('powershell.exe', ['-NoProfile', '-Command', command], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
