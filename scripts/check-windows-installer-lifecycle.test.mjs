import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { checkLifecycleBinary, checkLifecycleAuthoring, checkLifecycleSource } from "./check-windows-installer-lifecycle.mjs";

const binary = path.resolve("apps/windows/Netgrid.InstallerActions/bin/x64/Release/net48/NETGRID.InstallerActions.CA.dll");
test("built x64 custom action exports all lifecycle entrypoints", () => checkLifecycleBinary(binary));
test("managed-only, x86 and missing-entrypoint binaries fail closed", () => {
  const scratch = mkdtempSync(path.join(tmpdir(), "netgrid-ca-audit-"));
  try {
    const original = readFileSync(binary);
    const pe = original.readUInt32LE(0x3c);
    const variants = [
      bytes => bytes.writeUInt16LE(0x014c, pe + 4),
      bytes => bytes.writeUInt16LE(0x010b, pe + 24),
      bytes => {
        const at = bytes.indexOf(Buffer.from("BeginNetgridLifecycle\0", "ascii"));
        assert.ok(at > 0);
        bytes[at] = "X".charCodeAt(0);
      },
    ];
    for (const [index, mutate] of variants.entries()) {
      const bytes = Buffer.from(original);
      mutate(bytes);
      const candidate = path.join(scratch, `${index}.dll`);
      writeFileSync(candidate, bytes);
      assert.throws(() => checkLifecycleBinary(candidate), /installer_lifecycle_/);
    }
  } finally { rmSync(scratch, { recursive: true, force: true }); }
});
test("all unconditional MSI entrypoints must bind to the embedded lifecycle owner", () => {
  const source = readFileSync("installer/product/Product.wxs", "utf8");
  checkLifecycleSource(source);
  assert.throws(() => checkLifecycleAuthoring(source.replace('Action="BeginNetgridLifecycle" After=', 'Action="BeginNetgridLifecycle" Condition="NOT Installed" After=')), /not_unconditional/);
  assert.throws(() => checkLifecycleAuthoring(source.replaceAll('BinaryRef="NetgridLifecycleActions"', 'BinaryRef="Other"')), /action_unbound/);
  assert.throws(() => checkLifecycleAuthoring(source.replace('Value="DisableShutdown"', 'Value="0"')), /owner_conflict/);
});
test("upgrade order, nested cleanup and outer lease forwarding are mandatory", () => {
  const source = readFileSync("installer/product/Product.wxs", "utf8");
  for (const mutate of [
    value => value.replace('Schedule="afterInstallExecute"', 'Schedule="afterInstallValidate"'),
    value => value.replace('Id="NETGRID_UPDATE_LEASE" Secure="yes"', 'Id="NETGRID_UPDATE_LEASE" Secure="no"'),
    value => value.replace('Id="NETGRID_UPDATE_LEASE" Secure="yes" Hidden="yes"', 'Id="NETGRID_UPDATE_LEASE" Secure="yes" Hidden="no"'),
    value => value.replaceAll(' AND NOT UPGRADINGPRODUCTCODE', ''),
    value => value.replace('Action="VerifyNetgridLifecycle" Before="CommitNetgridLifecycle"', 'Action="VerifyNetgridLifecycle" After="InstallFinalize"'),
    value => value.replace('DllEntry="VerifyNetgridLifecycle" Execute="deferred"', 'DllEntry="VerifyNetgridLifecycle" Execute="commit"'),
    value => value.replace('Id="REINSTALLMODE" Value="amus"', 'Id="REINSTALLMODE" Value="omus"'),
  ]) assert.throws(() => checkLifecycleSource(mutate(source)), /installer_lifecycle_/);
});

test("outer commit is queued after nested removal and verification, never beside begin", () => {
  const source = readFileSync("installer/product/Product.wxs", "utf8");
  assert.match(source, /<Custom Action="CommitNetgridLifecycle" Before="InstallFinalize"\s*\/>/);
  assert.match(source, /<Custom Action="VerifyNetgridLifecycle" Before="CommitNetgridLifecycle"\s*\/>/);
  checkLifecycleSource(source);
  const earlyCommit = source.replace('Action="CommitNetgridLifecycle" Before="InstallFinalize"',
    'Action="CommitNetgridLifecycle" After="BeginNetgridLifecycle"');
  assert.throws(() => checkLifecycleSource(earlyCommit), /installer_lifecycle_commit_sequence_invalid/);
});

test("setup cache, current product selector and uninstall shortcut share MSI identity", () => {
  const source = readFileSync("installer/product/Product.wxs", "utf8");
  checkLifecycleSource(source);
  for (const mutate of [
    value => value.replace('Name="CurrentProductCode" Type="string" Value="[ProductCode]"', 'Name="CurrentProductCode" Type="string" Value="unbound"'),
    value => value.replace('\\config\\updates\\[ProductCode]\\NETGRID-Setup.exe', '\\config\\updates\\NETGRID-Setup.exe'),
    value => value.replace('cache-setup --data-root "[NETGRID_DATA_ROOT]" --product-code "[ProductCode]"', 'cache-setup --data-root "[NETGRID_DATA_ROOT]"'),
  ]) {
    const changed = mutate(source);
    assert.notEqual(changed, source, 'negative fixture must alter the current owner');
    assert.throws(() => checkLifecycleSource(changed), /setup_cache_identity_unbound/);
  }
});

test('MSI cache reconstruction does not depend on an external setup source', () => {
  const source = readFileSync('installer/product/Product.wxs', 'utf8');
  const scheduled = source.match(/<Custom Action="CacheNetgridSetup"[^>]+>/)?.[0];
  assert.equal(scheduled, '<Custom Action="CacheNetgridSetup" After="CacheNetgridMsi" Condition=\'NOT REMOVE~="ALL"\' />');
  assert.match(source, /Id="NetgridSetupStub" Name="NETGRID.SetupStub.exe"/);
  const args = source.match(/Value='cache-setup[^']+'/)?.[0];
  // Like initialization and MSI caching, use the installed executable's
  // location. A quoted MSI directory ends in a backslash and consumes the
  // next argument's opening quote under Windows command-line parsing.
  assert.ok(args);
  assert.ok(!args.includes('--program-root'));
});
